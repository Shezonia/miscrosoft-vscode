/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from 'vs/base/browser/dom';
import { Disposable, DisposableStore } from 'vs/base/common/lifecycle';
import { MarkdownRenderer } from 'vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer';
import { ICodeEditor, IEditorMouseEvent, IOverlayWidget, IOverlayWidgetPosition, MouseTargetType } from 'vs/editor/browser/editorBrowser';
import { ConfigurationChangedEvent, EditorOption } from 'vs/editor/common/config/editorOptions';
import { ILanguageService } from 'vs/editor/common/languages/language';
import { HoverOperation, HoverResult, HoverStartMode } from 'vs/editor/contrib/hover/browser/hoverOperation';
import { IOpenerService } from 'vs/platform/opener/common/opener';
import { HoverWidget } from 'vs/base/browser/ui/hover/hoverWidget';
import { IHoverWidget } from 'vs/editor/contrib/hover/browser/hoverTypes';
import { IHoverMessage, LaneOrLineNumber, MarginHoverComputer, MarginHoverComputerOptions } from 'vs/editor/contrib/hover/browser/marginHoverComputer';

const $ = dom.$;

export class MarginHoverWidget extends Disposable implements IOverlayWidget, IHoverWidget {

	public static readonly ID = 'editor.contrib.modesGlyphHoverWidget';

	private readonly _editor: ICodeEditor;
	private readonly _hover: HoverWidget;

	private _isVisible: boolean;
	private _messages: IHoverMessage[];

	private readonly _markdownRenderer: MarkdownRenderer;
	private readonly _hoverOperation: HoverOperation<MarginHoverComputerOptions, IHoverMessage>;
	private readonly _renderDisposeables = this._register(new DisposableStore());

	private _hoverComputerOptions: MarginHoverComputerOptions | undefined;

	constructor(
		editor: ICodeEditor,
		languageService: ILanguageService,
		openerService: IOpenerService,
	) {
		super();
		this._editor = editor;

		this._isVisible = false;
		this._messages = [];

		this._hover = this._register(new HoverWidget());
		this._hover.containerDomNode.classList.toggle('hidden', !this._isVisible);

		this._markdownRenderer = this._register(new MarkdownRenderer({ editor: this._editor }, languageService, openerService));
		this._hoverOperation = this._register(new HoverOperation(this._editor, new MarginHoverComputer(this._editor)));
		this._register(this._hoverOperation.onResult((result) => {
			this._withResult(result);
		}));

		this._register(this._editor.onDidChangeModelDecorations(() => this._onModelDecorationsChanged()));
		this._register(this._editor.onDidChangeConfiguration((e: ConfigurationChangedEvent) => {
			if (e.hasChanged(EditorOption.fontInfo)) {
				this._updateFont();
			}
		}));

		this._editor.addOverlayWidget(this);
	}

	public override dispose(): void {
		this._hoverComputerOptions = undefined;
		this._editor.removeOverlayWidget(this);
		super.dispose();
	}

	public getId(): string {
		return MarginHoverWidget.ID;
	}

	public getDomNode(): HTMLElement {
		return this._hover.containerDomNode;
	}

	public getPosition(): IOverlayWidgetPosition | null {
		return null;
	}

	private _updateFont(): void {
		const codeClasses: HTMLElement[] = Array.prototype.slice.call(this._hover.contentsDomNode.getElementsByClassName('code'));
		codeClasses.forEach(node => this._editor.applyFontInfo(node));
	}

	private _onModelDecorationsChanged(): void {
		if (this._isVisible && this._hoverComputerOptions) {
			// The decorations have changed and the hover is visible,
			// we need to recompute the displayed text
			this._hoverOperation.cancel();
			this._hoverOperation.start(HoverStartMode.Delayed, this._hoverComputerOptions);
		}
	}

	public showsOrWillShow(mouseEvent: IEditorMouseEvent): boolean {
		const target = mouseEvent.target;
		if (target.type === MouseTargetType.GUTTER_GLYPH_MARGIN && target.detail.glyphMarginLane) {
			this._startShowingAt(target.position.lineNumber, target.detail.glyphMarginLane);
			return true;
		}
		if (target.type === MouseTargetType.GUTTER_LINE_NUMBERS) {
			this._startShowingAt(target.position.lineNumber, 'lineNo');
			return true;
		}
		return false;
	}

	private _startShowingAt(lineNumber: number, laneOrLine: LaneOrLineNumber): void {
		if (this._hoverOperation.options?.lineNumber === lineNumber && this._hoverOperation.options.laneOrLine === laneOrLine) {
			// We have to show the widget at the exact same line number as before, so no work is needed
			return;
		}
		this._hoverOperation.cancel();
		this.hide();
		this._hoverComputerOptions = { lineNumber, laneOrLine };
		this._hoverOperation.start(HoverStartMode.Delayed, this._hoverComputerOptions);
	}

	public hide(): void {
		this._hoverOperation.cancel();
		if (!this._isVisible) {
			return;
		}
		this._isVisible = false;
		this._hoverComputerOptions = undefined;
		this._hover.containerDomNode.classList.toggle('hidden', !this._isVisible);
	}

	private _withResult(result: HoverResult<MarginHoverComputerOptions, IHoverMessage>): void {
		this._messages = result.value;

		if (this._messages.length > 0) {
			this._renderMessages(result.options?.lineNumber ?? -1, result.options?.laneOrLine ?? 'lineNo', this._messages,);
		} else {
			this.hide();
		}
	}

	private _renderMessages(lineNumber: number, laneOrLine: LaneOrLineNumber, messages: IHoverMessage[]): void {
		this._renderDisposeables.clear();

		const fragment = document.createDocumentFragment();

		for (const msg of messages) {
			const markdownHoverElement = $('div.hover-row.markdown-hover');
			const hoverContentsElement = dom.append(markdownHoverElement, $('div.hover-contents'));
			const renderedContents = this._renderDisposeables.add(this._markdownRenderer.render(msg.value));
			hoverContentsElement.appendChild(renderedContents.element);
			fragment.appendChild(markdownHoverElement);
		}

		this._updateContents(fragment);
		this._showAt(lineNumber, laneOrLine);
	}

	private _updateContents(node: Node): void {
		this._hover.contentsDomNode.textContent = '';
		this._hover.contentsDomNode.appendChild(node);
		this._updateFont();
	}

	private _showAt(lineNumber: number, laneOrLine: LaneOrLineNumber): void {
		if (!this._isVisible) {
			this._isVisible = true;
			this._hover.containerDomNode.classList.toggle('hidden', !this._isVisible);
		}

		const editorLayout = this._editor.getLayoutInfo();
		const topForLineNumber = this._editor.getTopForLineNumber(lineNumber);
		const editorScrollTop = this._editor.getScrollTop();
		const lineHeight = this._editor.getOption(EditorOption.lineHeight);
		const nodeHeight = this._hover.containerDomNode.clientHeight;
		const top = topForLineNumber - editorScrollTop - ((nodeHeight - lineHeight) / 2);
		const left = editorLayout.glyphMarginLeft + editorLayout.glyphMarginWidth + (laneOrLine === 'lineNo' ? editorLayout.lineNumbersWidth : 0);
		this._hover.containerDomNode.style.left = `${left}px`;
		this._hover.containerDomNode.style.top = `${Math.max(Math.round(top), 0)}px`;
	}
}
