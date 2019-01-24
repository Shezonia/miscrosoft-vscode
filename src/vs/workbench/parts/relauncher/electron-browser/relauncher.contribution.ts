/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IDisposable, dispose, Disposable } from 'vs/base/common/lifecycle';
import { IWorkbenchContributionsRegistry, IWorkbenchContribution, Extensions as WorkbenchExtensions } from 'vs/workbench/common/contributions';
import { Registry } from 'vs/platform/registry/common/platform';
import { IWindowsService, IWindowService, IWindowsConfiguration } from 'vs/platform/windows/common/windows';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { localize } from 'vs/nls';
import { IEnvironmentService } from 'vs/platform/environment/common/environment';
import { IWorkspaceContextService, WorkbenchState } from 'vs/platform/workspace/common/workspace';
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions';
import { RunOnceScheduler } from 'vs/base/common/async';
import { URI } from 'vs/base/common/uri';
import { isEqual } from 'vs/base/common/resources';
import { isLinux, isMacintosh, isWindows } from 'vs/base/common/platform';
import { LifecyclePhase } from 'vs/platform/lifecycle/common/lifecycle';
import { IDialogService } from 'vs/platform/dialogs/common/dialogs';
import { equals } from 'vs/base/common/objects';

interface IConfiguration extends IWindowsConfiguration {
	update: { channel: string; };
	telemetry: { enableCrashReporter: boolean };
	keyboard: { touchbar: { enabled: boolean } };
	workbench: { tree: { horizontalScrolling: boolean }, useExperimentalGridLayout: boolean };
	files: { useExperimentalFileWatcher: boolean, watcherExclude: object };
}

export class SettingsChangeRelauncher extends Disposable implements IWorkbenchContribution {

	private transparent: boolean;
	private compositionAttribute: 'none' | 'transparent' | 'blur' | 'acrylic';
	private vibrancy: 'none' | 'appearance-based' | 'light' | 'dark' | 'titlebar' | 'medium-light' | 'ultra-dark';
	private titleBarStyle: 'native' | 'custom';
	private nativeTabs: boolean;
	private nativeFullScreen: boolean;
	private clickThroughInactive: boolean;
	private updateChannel: string;
	private enableCrashReporter: boolean;
	private touchbarEnabled: boolean;
	private treeHorizontalScrolling: boolean;
	private windowsSmoothScrollingWorkaround: boolean;
	private experimentalFileWatcher: boolean;
	private fileWatcherExclude: object;
	private useGridLayout: boolean;

	private firstFolderResource?: URI;
	private extensionHostRestarter: RunOnceScheduler;

	private onDidChangeWorkspaceFoldersUnbind: IDisposable;

	constructor(
		@IWindowsService private readonly windowsService: IWindowsService,
		@IWindowService private readonly windowService: IWindowService,
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IEnvironmentService private readonly envService: IEnvironmentService,
		@IDialogService private readonly dialogService: IDialogService,
		@IWorkspaceContextService private readonly contextService: IWorkspaceContextService,
		@IExtensionService private readonly extensionService: IExtensionService
	) {
		super();

		const workspace = this.contextService.getWorkspace();
		this.firstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
		this.extensionHostRestarter = new RunOnceScheduler(() => this.extensionService.restartExtensionHost(), 10);

		this.onConfigurationChange(configurationService.getValue<IConfiguration>(), false);
		this.handleWorkbenchState();

		this.registerListeners();
	}

	private registerListeners(): void {
		this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChange(this.configurationService.getValue<IConfiguration>(), true)));
		this._register(this.contextService.onDidChangeWorkbenchState(() => setTimeout(() => this.handleWorkbenchState())));
	}

	private onConfigurationChange(config: IConfiguration, notify: boolean): void {
		let changed = false;

		// Linux transparency
		if (isLinux && config.window && typeof config.window.transparent === 'boolean' && config.window.transparent !== this.transparent) {
			this.transparent = config.window.transparent;
			changed = true;
		}

		// Windows Composition Attribute
		if (isWindows && config.window && config.window.compositionAttribute !== this.compositionAttribute) {
			this.compositionAttribute = config.window.compositionAttribute;
			changed = true;
		}

		// macOS vibrancy
		if (isMacintosh && config.window && config.window.vibrancy !== this.vibrancy) {
			this.vibrancy = config.window.vibrancy;
			changed = true;
		}

		// Titlebar style
		if (config.window && config.window.titleBarStyle !== this.titleBarStyle && (config.window.titleBarStyle === 'native' || config.window.titleBarStyle === 'custom')) {
			this.titleBarStyle = config.window.titleBarStyle;
			changed = true;
		}

		// macOS: Native tabs
		if (isMacintosh && config.window && typeof config.window.nativeTabs === 'boolean' && config.window.nativeTabs !== this.nativeTabs) {
			this.nativeTabs = config.window.nativeTabs;
			changed = true;
		}

		// macOS: Native fullscreen
		if (isMacintosh && config.window && typeof config.window.nativeFullScreen === 'boolean' && config.window.nativeFullScreen !== this.nativeFullScreen) {
			this.nativeFullScreen = config.window.nativeFullScreen;
			changed = true;
		}

		// macOS: Click through (accept first mouse)
		if (isMacintosh && config.window && typeof config.window.clickThroughInactive === 'boolean' && config.window.clickThroughInactive !== this.clickThroughInactive) {
			this.clickThroughInactive = config.window.clickThroughInactive;
			changed = true;
		}

		// Update channel
		if (config.update && typeof config.update.channel === 'string' && config.update.channel !== this.updateChannel) {
			this.updateChannel = config.update.channel;
			changed = true;
		}

		// Crash reporter
		if (config.telemetry && typeof config.telemetry.enableCrashReporter === 'boolean' && config.telemetry.enableCrashReporter !== this.enableCrashReporter) {
			this.enableCrashReporter = config.telemetry.enableCrashReporter;
			changed = true;
		}

		// Experimental File Watcher
		if (config.files && typeof config.files.useExperimentalFileWatcher === 'boolean' && config.files.useExperimentalFileWatcher !== this.experimentalFileWatcher) {
			this.experimentalFileWatcher = config.files.useExperimentalFileWatcher;
			changed = true;
		}

		// File Watcher Excludes (only if in folder workspace mode)
		if (!this.experimentalFileWatcher && this.contextService.getWorkbenchState() === WorkbenchState.FOLDER) {
			if (config.files && typeof config.files.watcherExclude === 'object' && !equals(config.files.watcherExclude, this.fileWatcherExclude)) {
				this.fileWatcherExclude = config.files.watcherExclude;
				changed = true;
			}
		}

		// macOS: Touchbar config
		if (isMacintosh && config.keyboard && config.keyboard.touchbar && typeof config.keyboard.touchbar.enabled === 'boolean' && config.keyboard.touchbar.enabled !== this.touchbarEnabled) {
			this.touchbarEnabled = config.keyboard.touchbar.enabled;
			changed = true;
		}

		// Tree horizontal scrolling support
		if (config.workbench && config.workbench.tree && typeof config.workbench.tree.horizontalScrolling === 'boolean' && config.workbench.tree.horizontalScrolling !== this.treeHorizontalScrolling) {
			this.treeHorizontalScrolling = config.workbench.tree.horizontalScrolling;
			changed = true;
		}

		// Windows: smooth scrolling workaround
		if (isWindows && config.window && typeof config.window.smoothScrollingWorkaround === 'boolean' && config.window.smoothScrollingWorkaround !== this.windowsSmoothScrollingWorkaround) {
			this.windowsSmoothScrollingWorkaround = config.window.smoothScrollingWorkaround;
			changed = true;
		}

		// Workbench Grid Layout
		if (config.workbench && typeof config.workbench.useExperimentalGridLayout === 'boolean' && config.workbench.useExperimentalGridLayout !== this.useGridLayout) {
			this.useGridLayout = config.workbench.useExperimentalGridLayout;
			changed = true;
		}

		// Notify only when changed and we are the focused window (avoids notification spam across windows)
		if (notify && changed) {
			this.doConfirm(
				localize('relaunchSettingMessage', "A setting has changed that requires a restart to take effect."),
				localize('relaunchSettingDetail', "Press the restart button to restart {0} and enable the setting.", this.envService.appNameLong),
				localize('restart', "&&Restart"),
				() => this.windowsService.relaunch(Object.create(null))
			);
		}
	}

	private handleWorkbenchState(): void {

		// React to folder changes when we are in workspace state
		if (this.contextService.getWorkbenchState() === WorkbenchState.WORKSPACE) {

			// Update our known first folder path if we entered workspace
			const workspace = this.contextService.getWorkspace();
			this.firstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;

			// Install workspace folder listener
			if (!this.onDidChangeWorkspaceFoldersUnbind) {
				this.onDidChangeWorkspaceFoldersUnbind = this.contextService.onDidChangeWorkspaceFolders(() => this.onDidChangeWorkspaceFolders());
			}
		}

		// Ignore the workspace folder changes in EMPTY or FOLDER state
		else {
			this.onDidChangeWorkspaceFoldersUnbind = dispose(this.onDidChangeWorkspaceFoldersUnbind);
		}
	}

	private onDidChangeWorkspaceFolders(): void {
		const workspace = this.contextService.getWorkspace();

		// Restart extension host if first root folder changed (impact on deprecated workspace.rootPath API)
		const newFirstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
		if (!isEqual(this.firstFolderResource, newFirstFolderResource, !isLinux)) {
			this.firstFolderResource = newFirstFolderResource;

			this.extensionHostRestarter.schedule(); // buffer calls to extension host restart
		}
	}

	private doConfirm(message: string, detail: string, primaryButton: string, confirmed: () => void): void {
		this.windowService.isFocused().then(focused => {
			if (focused) {
				return this.dialogService.confirm({
					type: 'info',
					message,
					detail,
					primaryButton
				}).then(res => {
					if (res.confirmed) {
						confirmed();
					}
				});
			}

			return undefined;
		});
	}
}

const workbenchRegistry = Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench);
workbenchRegistry.registerWorkbenchContribution(SettingsChangeRelauncher, LifecyclePhase.Restored);
