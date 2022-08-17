/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, IDisposable, dispose, toDisposable } from 'vs/base/common/lifecycle';
import { ITerminalCommand } from 'vs/workbench/contrib/terminal/common/terminal';
import { IDecoration, ITerminalAddon, Terminal } from 'xterm';
import * as dom from 'vs/base/browser/dom';
import { IClipboardService } from 'vs/platform/clipboard/common/clipboardService';
import { CommandInvalidationReason, IBufferMark, ITerminalCapabilityStore, TerminalCapability } from 'vs/platform/terminal/common/capabilities/capabilities';
import { IColorTheme, ICssStyleCollector, IThemeService, registerThemingParticipant } from 'vs/platform/theme/common/themeService';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IHoverService } from 'vs/workbench/services/hover/browser/hover';
import { IAction, Separator } from 'vs/base/common/actions';
import { Emitter } from 'vs/base/common/event';
import { MarkdownString } from 'vs/base/common/htmlContent';
import { localize } from 'vs/nls';
import { Delayer } from 'vs/base/common/async';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { fromNow } from 'vs/base/common/date';
import { toolbarHoverBackground } from 'vs/platform/theme/common/colorRegistry';
import { TerminalSettingId } from 'vs/platform/terminal/common/terminal';
import { TERMINAL_COMMAND_DECORATION_DEFAULT_BACKGROUND_COLOR, TERMINAL_COMMAND_DECORATION_ERROR_BACKGROUND_COLOR, TERMINAL_COMMAND_DECORATION_SUCCESS_BACKGROUND_COLOR } from 'vs/workbench/contrib/terminal/common/terminalColorRegistry';
import { Color } from 'vs/base/common/color';
import { IOpenerService } from 'vs/platform/opener/common/opener';
import { IQuickInputService, IQuickPickItem } from 'vs/platform/quickinput/common/quickInput';
import { Codicon } from 'vs/base/common/codicons';
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle';

const enum DecorationSelector {
	CommandDecoration = 'terminal-command-decoration',
	Hide = 'hide',
	ErrorColor = 'error',
	DefaultColor = 'default-color',
	Default = 'default',
	Codicon = 'codicon',
	XtermDecoration = 'xterm-decoration',
	OverviewRuler = '.xterm-decoration-overview-ruler'
}

const enum DecorationStyles {
	DefaultDimension = 16,
	MarginLeft = -17,
}

interface IDisposableDecoration { decoration: IDecoration; disposables: IDisposable[]; exitCode?: number }

export class DecorationAddon extends Disposable implements ITerminalAddon {
	protected _terminal: Terminal | undefined;
	private _hoverDelayer: Delayer<void>;
	private _commandDetectionListeners: IDisposable[] | undefined;
	private _bufferMarkListeners: IDisposable[] | undefined;
	private _contextMenuVisible: boolean = false;
	private _decorations: Map<number, IDisposableDecoration> = new Map();
	private _placeholderDecoration: IDecoration | undefined;
	private _showGutterDecorations?: boolean;
	private _showOverviewRulerDecorations?: boolean;

	private readonly _onDidRequestRunCommand = this._register(new Emitter<{ command: ITerminalCommand; copyAsHtml?: boolean }>());
	readonly onDidRequestRunCommand = this._onDidRequestRunCommand.event;

	constructor(
		private readonly _capabilities: ITerminalCapabilityStore,
		@IClipboardService private readonly _clipboardService: IClipboardService,
		@IContextMenuService private readonly _contextMenuService: IContextMenuService,
		@IHoverService private readonly _hoverService: IHoverService,
		@IConfigurationService private readonly _configurationService: IConfigurationService,
		@IThemeService private readonly _themeService: IThemeService,
		@IOpenerService private readonly _openerService: IOpenerService,
		@IQuickInputService private readonly _quickInputService: IQuickInputService,
		@ILifecycleService lifecycleService: ILifecycleService
	) {
		super();
		this._register(toDisposable(() => this._dispose()));
		this._register(this._contextMenuService.onDidShowContextMenu(() => this._contextMenuVisible = true));
		this._register(this._contextMenuService.onDidHideContextMenu(() => this._contextMenuVisible = false));
		this._hoverDelayer = this._register(new Delayer(this._configurationService.getValue('workbench.hover.delay')));

		this._register(this._configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(TerminalSettingId.FontSize) || e.affectsConfiguration(TerminalSettingId.LineHeight)) {
				this.refreshLayouts();
			} else if (e.affectsConfiguration('workbench.colorCustomizations')) {
				this._refreshStyles(true);
			} else if (e.affectsConfiguration(TerminalSettingId.ShellIntegrationDecorationsEnabled)) {
				if (this._commandDetectionListeners) {
					dispose(this._commandDetectionListeners);
					this._commandDetectionListeners = undefined;
				}
				this._updateDecorationVisibility();
			}
		}));
		this._register(this._themeService.onDidColorThemeChange(() => this._refreshStyles(true)));
		this._updateDecorationVisibility();
		this._register(this._capabilities.onDidAddCapability(c => {
			if (c === TerminalCapability.CommandDetection) {
				this._addCommandDetectionListeners();
			} else if (c === TerminalCapability.BufferMarkDetection) {
				this._addBufferMarkListeners();
			}
		}));
		this._register(this._capabilities.onDidRemoveCapability(c => {
			if (c === TerminalCapability.CommandDetection) {
				if (this._commandDetectionListeners) {
					dispose(this._commandDetectionListeners);
					this._commandDetectionListeners = undefined;
				}
			}
		}));
		this._register(lifecycleService.onWillShutdown(() => this._disposeAllDecorations()));
	}

	private _updateDecorationVisibility(): void {
		const showDecorations = this._configurationService.getValue(TerminalSettingId.ShellIntegrationDecorationsEnabled);
		this._showGutterDecorations = (showDecorations === 'both' || showDecorations === 'gutter');
		this._showOverviewRulerDecorations = (showDecorations === 'both' || showDecorations === 'overviewRuler');
		this._disposeAllDecorations();
		if (this._showGutterDecorations || this._showOverviewRulerDecorations) {
			this._attachToCommandCapability();
			this._updateGutterDecorationVisibility();
		}
		const currentCommand = this._capabilities.get(TerminalCapability.CommandDetection)?.executingCommandObject;
		if (currentCommand) {
			this.registerCommandDecoration(currentCommand, true);
		}
	}

	private _disposeAllDecorations(): void {
		this._placeholderDecoration?.dispose();
		for (const value of this._decorations.values()) {
			value.decoration.dispose();
			dispose(value.disposables);
		}
	}

	private _updateGutterDecorationVisibility(): void {
		const commandDecorationElements = document.querySelectorAll(DecorationSelector.CommandDecoration);
		for (const commandDecorationElement of commandDecorationElements) {
			this._updateCommandDecorationVisibility(commandDecorationElement);
		}
	}

	private _updateCommandDecorationVisibility(commandDecorationElement: Element): void {
		if (this._showGutterDecorations) {
			commandDecorationElement.classList.remove(DecorationSelector.Hide);
		} else {
			commandDecorationElement.classList.add(DecorationSelector.Hide);
		}
	}

	public refreshLayouts(): void {
		this._updateLayout(this._placeholderDecoration?.element);
		for (const decoration of this._decorations) {
			this._updateLayout(decoration[1].decoration.element);
		}
	}

	private _refreshStyles(refreshOverviewRulerColors?: boolean, bufferMark?: IBufferMark): void {
		if (refreshOverviewRulerColors) {
			for (const decoration of this._decorations.values()) {
				let color = decoration.exitCode === undefined ? defaultColor : decoration.exitCode ? errorColor : successColor;
				if (color && typeof color !== 'string') {
					color = color.toString();
				} else {
					color = '';
				}
				if (decoration.decoration.options?.overviewRulerOptions) {
					decoration.decoration.options.overviewRulerOptions.color = color;
				} else if (decoration.decoration.options) {
					decoration.decoration.options.overviewRulerOptions = { color };
				}
			}
		}
		this._updateClasses(this._placeholderDecoration?.element, undefined, bufferMark);
		for (const decoration of this._decorations.values()) {
			this._updateClasses(decoration.decoration.element, decoration.exitCode, bufferMark);
		}
	}

	private _dispose(): void {
		if (this._commandDetectionListeners) {
			dispose(this._commandDetectionListeners);
		}
		this.clearDecorations();
	}

	private _clearPlaceholder(): void {
		this._placeholderDecoration?.dispose();
		this._placeholderDecoration = undefined;
	}

	public clearDecorations(): void {
		this._placeholderDecoration?.marker.dispose();
		this._clearPlaceholder();
		this._disposeAllDecorations();
		this._decorations.clear();
	}

	private _attachToCommandCapability(): void {
		if (this._capabilities.has(TerminalCapability.CommandDetection)) {
			this._addCommandDetectionListeners();
		}
	}

	private _addBufferMarkListeners(): void {
		if (this._bufferMarkListeners) {
			return;
		}
		const capability = this._capabilities.get(TerminalCapability.BufferMarkDetection);
		if (!capability) {
			return;
		}
		this._bufferMarkListeners = [];
		this._bufferMarkListeners.push(capability.onMarkAdded(mark => this.registerMarkDecoration(mark)));
		this._bufferMarkListeners.push(capability.onDidRequestMarkDecoration(mark => this.registerMarkDecoration(mark)));
	}

	private _addCommandDetectionListeners(): void {
		if (this._commandDetectionListeners) {
			return;
		}
		const capability = this._capabilities.get(TerminalCapability.CommandDetection);
		if (!capability) {
			return;
		}
		this._commandDetectionListeners = [];
		// Command started
		if (capability.executingCommandObject?.marker) {
			this.registerCommandDecoration(capability.executingCommandObject, true);
		}
		this._commandDetectionListeners.push(capability.onCommandStarted(command => this.registerCommandDecoration(command, true)));
		// Command finished
		for (const command of capability.commands) {
			this.registerCommandDecoration(command);
		}
		this._commandDetectionListeners.push(capability.onCommandFinished(command => this.registerCommandDecoration(command)));
		// Command invalidated
		this._commandDetectionListeners.push(capability.onCommandInvalidated(commands => {
			for (const command of commands) {
				const id = command.marker?.id;
				if (id) {
					const match = this._decorations.get(id);
					if (match) {
						match.decoration.dispose();
						dispose(match.disposables);
					}
				}
			}
		}));
		// Current command invalidated
		this._commandDetectionListeners.push(capability.onCurrentCommandInvalidated((request) => {
			if (request.reason === CommandInvalidationReason.NoProblemsReported) {
				const lastDecoration = Array.from(this._decorations.entries())[this._decorations.size - 1];
				lastDecoration?.[1].decoration.dispose();
			} else if (request.reason === CommandInvalidationReason.Windows) {
				this._clearPlaceholder();
			}
		}));
	}

	activate(terminal: Terminal): void {
		this._terminal = terminal;
		this._attachToCommandCapability();
	}

	registerMarkDecoration(mark: IBufferMark): IDecoration | undefined {
		if (!this._terminal || mark.hidden || mark.marker.isDisposed || !defaultColor) {
			return undefined;
		}
		const height = mark.endMarker ? mark.endMarker.line - mark.marker.line + 1 : 1;
		const decoration = this._terminal.registerDecoration({ marker: mark.marker, anchor: 'left', foregroundColor: Color.cyan.toString(), height });
		if (!decoration) {
			return undefined;
		}
		decoration.onRender(element => this._onRender(element, mark, decoration));
		return decoration;
	}

	registerCommandDecoration(command: ITerminalCommand, beforeCommandExecution?: boolean): IDecoration | undefined {
		if (!this._terminal || (!this._showGutterDecorations && !this._showOverviewRulerDecorations)) {
			return undefined;
		}
		if (!command.marker) {
			throw new Error(`cannot add a decoration for a command ${JSON.stringify(command)} with no marker`);
		}
		this._clearPlaceholder();
		let color = command.exitCode === undefined ? defaultColor : command.exitCode ? errorColor : successColor;
		if (color && typeof color !== 'string') {
			color = color.toString();
		} else {
			color = '';
		}
		const decoration = this._terminal.registerDecoration({
			marker: command.marker,
			overviewRulerOptions: this._showOverviewRulerDecorations ? (beforeCommandExecution
				? { color, position: 'left' }
				: { color, position: command.exitCode ? 'right' : 'left' }) : undefined
		});
		if (!decoration) {
			return undefined;
		}
		if (beforeCommandExecution) {
			this._placeholderDecoration = decoration;
		}
		decoration.onRender(element => this._onRender(element, command, decoration));
		return decoration;
	}

	private _onRender(element: HTMLElement, item: ITerminalCommand | IBufferMark, decoration: IDecoration): void {
		if (element.classList.contains(DecorationSelector.OverviewRuler) || !item.marker) {
			return;
		}
		const exitCode = 'exitCode' in item ? item.exitCode : undefined;
		if (!this._decorations.get(item.marker.id)) {
			decoration.onDispose(() => this._decorations.delete(decoration.marker.id));
			this._decorations.set(decoration.marker.id,
				{
					decoration,
					disposables: this._createDisposables(element, item),
					exitCode
				});
		}
		if (!element.classList.contains(DecorationSelector.Codicon) || item.marker?.line === 0) {
			// first render or buffer was cleared
			this._updateLayout(element);
			this._updateClasses(element, exitCode, !('command' in item) ? item : undefined);
		}
	}

	private _createDisposables(element: HTMLElement, item: ITerminalCommand | IBufferMark): IDisposable[] {
		if (!('command' in item)) {
			return [...this._createHover(element, item)];
		}
		if (item.exitCode === undefined) {
			return [];
		}
		return [this._createContextMenu(element, item), ...this._createHover(element, item)];
	}

	private _updateLayout(element?: HTMLElement): void {
		if (!element) {
			return;
		}
		const fontSize = this._configurationService.inspect(TerminalSettingId.FontSize).value;
		const defaultFontSize = this._configurationService.inspect(TerminalSettingId.FontSize).defaultValue;
		const lineHeight = this._configurationService.inspect(TerminalSettingId.LineHeight).value;
		if (typeof fontSize === 'number' && typeof defaultFontSize === 'number' && typeof lineHeight === 'number') {
			const scalar = (fontSize / defaultFontSize) <= 1 ? (fontSize / defaultFontSize) : 1;
			// must be inlined to override the inlined styles from xterm
			element.style.width = `${scalar * DecorationStyles.DefaultDimension}px`;
			element.style.height = `${scalar * DecorationStyles.DefaultDimension * lineHeight}px`;
			element.style.fontSize = `${scalar * DecorationStyles.DefaultDimension}px`;
			element.style.marginLeft = `${scalar * DecorationStyles.MarginLeft}px`;
		}
	}

	private _updateClasses(element?: HTMLElement, exitCode?: number, bufferMark?: IBufferMark): void {
		if (!element) {
			return;
		}
		for (const classes of element.classList) {
			element.classList.remove(classes);
		}
		element.classList.add(DecorationSelector.CommandDecoration, DecorationSelector.Codicon, DecorationSelector.XtermDecoration);

		if (bufferMark) {
			element.classList.add(DecorationSelector.DefaultColor);
			if (!bufferMark.hoverMessage) {
				//disable the mouse pointer
				element.classList.add(DecorationSelector.Default);
			}
		} else {
			// command decoration
			this._updateCommandDecorationVisibility(element);
			if (exitCode === undefined) {
				element.classList.add(DecorationSelector.DefaultColor, DecorationSelector.Default);
				element.classList.add(...Codicon.terminalDecorationIncomplete.classNamesArray);
			} else if (exitCode) {
				element.classList.add(DecorationSelector.ErrorColor);
				element.classList.add(...Codicon.terminalDecorationError.classNamesArray);
			} else {
				element.classList.add(...Codicon.terminalDecorationSuccess.classNamesArray);
			}
		}
	}

	private _createContextMenu(element: HTMLElement, command: ITerminalCommand): IDisposable {
		// When the xterm Decoration gets disposed of, its element gets removed from the dom
		// along with its listeners
		return dom.addDisposableListener(element, dom.EventType.CLICK, async () => {
			this._hideHover();
			const actions = await this._getCommandActions(command);
			this._contextMenuService.showContextMenu({ getAnchor: () => element, getActions: () => actions });
		});
	}

	private _createHover(element: HTMLElement, item: ITerminalCommand | IBufferMark): IDisposable[] {
		return [
			dom.addDisposableListener(element, dom.EventType.MOUSE_ENTER, () => {
				if (this._contextMenuVisible) {
					return;
				}
				this._hoverDelayer.trigger(() => {
					let hoverContent = `${localize('terminalPromptContextMenu', "Show Command Actions")}`;
					hoverContent += '\n\n---\n\n';
					if (!('command' in item)) {
						if (item.hoverMessage) {
							hoverContent = item.hoverMessage;
						} else {
							return;
						}
					} else if (item.exitCode) {
						if (item.exitCode === -1) {
							hoverContent += localize('terminalPromptCommandFailed', 'Command executed {0} and failed', fromNow(item.timestamp, true));
						} else {
							hoverContent += localize('terminalPromptCommandFailedWithExitCode', 'Command executed {0} and failed (Exit Code {1})', fromNow(item.timestamp, true), item.exitCode);
						}
					} else {
						hoverContent += localize('terminalPromptCommandSuccess', 'Command executed {0}', fromNow(item.timestamp, true));
					}
					this._hoverService.showHover({ content: new MarkdownString(hoverContent), target: element });
				});
			}),
			dom.addDisposableListener(element, dom.EventType.MOUSE_LEAVE, () => this._hideHover()),
			dom.addDisposableListener(element, dom.EventType.MOUSE_OUT, () => this._hideHover())
		];
	}

	private _hideHover() {
		this._hoverDelayer.cancel();
		this._hoverService.hideHover();
	}

	private async _getCommandActions(command: ITerminalCommand): Promise<IAction[]> {
		const actions: IAction[] = [];
		if (command.command !== '') {
			const labelRun = localize("terminal.rerunCommand", 'Rerun Command');
			actions.push({
				class: undefined, tooltip: labelRun, id: 'terminal.rerunCommand', label: labelRun, enabled: true,
				run: () => this._onDidRequestRunCommand.fire({ command })
			});
			const labelCopy = localize("terminal.copyCommand", 'Copy Command');
			actions.push({
				class: undefined, tooltip: labelCopy, id: 'terminal.copyCommand', label: labelCopy, enabled: true,
				run: () => this._clipboardService.writeText(command.command)
			});
		}
		if (command.hasOutput()) {
			if (actions.length > 0) {
				actions.push(new Separator());
			}
			const labelText = localize("terminal.copyOutput", 'Copy Output');
			actions.push({
				class: undefined, tooltip: labelText, id: 'terminal.copyOutput', label: labelText, enabled: true,
				run: () => this._clipboardService.writeText(command.getOutput()!)
			});
			const labelHtml = localize("terminal.copyOutputAsHtml", 'Copy Output as HTML');
			actions.push({
				class: undefined, tooltip: labelHtml, id: 'terminal.copyOutputAsHtml', label: labelHtml, enabled: true,
				run: () => this._onDidRequestRunCommand.fire({ command, copyAsHtml: true })
			});
		}
		if (actions.length > 0) {
			actions.push(new Separator());
		}
		const labelConfigure = localize("terminal.configureCommandDecorations", 'Configure Command Decorations');
		actions.push({
			class: undefined, tooltip: labelConfigure, id: 'terminal.configureCommandDecorations', label: labelConfigure, enabled: true,
			run: () => this._showConfigureCommandDecorationsQuickPick()
		});
		const labelAbout = localize("terminal.learnShellIntegration", 'Learn About Shell Integration');
		actions.push({
			class: undefined, tooltip: labelAbout, id: 'terminal.learnShellIntegration', label: labelAbout, enabled: true,
			run: () => this._openerService.open('https://code.visualstudio.com/docs/terminal/shell-integration')
		});
		return actions;
	}

	private async _showConfigureCommandDecorationsQuickPick() {
		const quickPick = this._quickInputService.createQuickPick();
		quickPick.items = [
			{ id: 'a', label: localize('toggleVisibility', 'Toggle visibility') },
		];
		quickPick.canSelectMany = false;
		quickPick.onDidAccept(async e => {
			quickPick.hide();
			const result = quickPick.activeItems[0];
			let iconSetting: string | undefined;
			switch (result.id) {
				case 'a': this._showToggleVisibilityQuickPick(); break;
			}
			if (iconSetting) {
				this._showChangeIconQuickPick(iconSetting);
			}
		});
		quickPick.show();
	}

	private async _showChangeIconQuickPick(iconSetting: string) {
		type Item = IQuickPickItem & { icon: Codicon };
		const items: Item[] = [];
		for (const icon of Codicon.getAll()) {
			items.push({ label: `$(${icon.id})`, description: `${icon.id}`, icon });
		}
		const result = await this._quickInputService.pick(items, {
			matchOnDescription: true
		});
		if (result) {
			this._configurationService.updateValue(iconSetting, result.icon.id);
			this._showConfigureCommandDecorationsQuickPick();
		}
	}

	private _showToggleVisibilityQuickPick() {
		const quickPick = this._quickInputService.createQuickPick();
		quickPick.hideInput = true;
		quickPick.hideCheckAll = true;
		quickPick.canSelectMany = true;
		quickPick.title = localize('toggleVisibility', 'Toggle visibility');
		const configValue = this._configurationService.getValue(TerminalSettingId.ShellIntegrationDecorationsEnabled);
		const gutterIcon: IQuickPickItem = {
			label: localize('gutter', 'Gutter command decorations'),
			picked: configValue !== 'never' && configValue !== 'overviewRuler'
		};
		const overviewRulerIcon: IQuickPickItem = {
			label: localize('overviewRuler', 'Overview ruler command decorations'),
			picked: configValue !== 'never' && configValue !== 'gutter'
		};
		quickPick.items = [gutterIcon, overviewRulerIcon];
		const selectedItems: IQuickPickItem[] = [];
		if (configValue !== 'never') {
			if (configValue !== 'gutter') {
				selectedItems.push(gutterIcon);
			}
			if (configValue !== 'overviewRuler') {
				selectedItems.push(overviewRulerIcon);
			}
		}
		quickPick.selectedItems = selectedItems;
		quickPick.onDidChangeSelection(async e => {
			let newValue: 'both' | 'gutter' | 'overviewRuler' | 'never' = 'never';
			if (e.includes(gutterIcon)) {
				if (e.includes(overviewRulerIcon)) {
					newValue = 'both';
				} else {
					newValue = 'gutter';
				}
			} else if (e.includes(overviewRulerIcon)) {
				newValue = 'overviewRuler';
			}
			await this._configurationService.updateValue(TerminalSettingId.ShellIntegrationDecorationsEnabled, newValue);
		});
		quickPick.show();
	}
}
let successColor: string | Color | undefined;
let errorColor: string | Color | undefined;
let defaultColor: string | Color | undefined;
registerThemingParticipant((theme: IColorTheme, collector: ICssStyleCollector) => {
	successColor = theme.getColor(TERMINAL_COMMAND_DECORATION_SUCCESS_BACKGROUND_COLOR);
	errorColor = theme.getColor(TERMINAL_COMMAND_DECORATION_ERROR_BACKGROUND_COLOR);
	defaultColor = theme.getColor(TERMINAL_COMMAND_DECORATION_DEFAULT_BACKGROUND_COLOR);
	const hoverBackgroundColor = theme.getColor(toolbarHoverBackground);

	if (successColor) {
		collector.addRule(`.${DecorationSelector.CommandDecoration} { color: ${successColor.toString()}; } `);
	}
	if (errorColor) {
		collector.addRule(`.${DecorationSelector.CommandDecoration}.${DecorationSelector.ErrorColor} { color: ${errorColor.toString()}; } `);
	}
	if (defaultColor) {
		collector.addRule(`.${DecorationSelector.CommandDecoration}.${DecorationSelector.DefaultColor} { color: ${defaultColor.toString()};} `);
	}
	if (hoverBackgroundColor) {
		collector.addRule(`.${DecorationSelector.CommandDecoration}:not(.${DecorationSelector.DefaultColor}):hover { background-color: ${hoverBackgroundColor.toString()}; }`);
	}
});
