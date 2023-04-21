/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'vs/nls';
import { Color, RGBA } from 'vs/base/common/color';
import { activeContrastBorder, editorBackground, registerColor, editorWarningForeground, editorInfoForeground, editorWarningBorder, editorInfoBorder, contrastBorder, editorFindMatchHighlight } from 'vs/platform/theme/common/colorRegistry';
import { registerThemingParticipant } from 'vs/platform/theme/common/themeService';

/**
 * Definition of the editor colors
 */
export const editorLineHighlight = registerColor('editor.lineHighlightBackground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('lineHighlight', 'Background color for the highlight of line at the cursor position.'));
export const editorLineHighlightBorder = registerColor('editor.lineHighlightBorder', { dark: '#282828', light: '#eeeeee', hcDark: '#f38518', hcLight: contrastBorder }, nls.localize('lineHighlightBorderBox', 'Background color for the border around the line at the cursor position.'));
export const editorRangeHighlight = registerColor('editor.rangeHighlightBackground', { dark: '#ffffff0b', light: '#fdff0033', hcDark: null, hcLight: null }, nls.localize('rangeHighlight', 'Background color of highlighted ranges, like by quick open and find features. The color must not be opaque so as not to hide underlying decorations.'), true);
export const editorRangeHighlightBorder = registerColor('editor.rangeHighlightBorder', { dark: null, light: null, hcDark: activeContrastBorder, hcLight: activeContrastBorder }, nls.localize('rangeHighlightBorder', 'Background color of the border around highlighted ranges.'), true);
export const editorSymbolHighlight = registerColor('editor.symbolHighlightBackground', { dark: editorFindMatchHighlight, light: editorFindMatchHighlight, hcDark: null, hcLight: null }, nls.localize('symbolHighlight', 'Background color of highlighted symbol, like for go to definition or go next/previous symbol. The color must not be opaque so as not to hide underlying decorations.'), true);
export const editorSymbolHighlightBorder = registerColor('editor.symbolHighlightBorder', { dark: null, light: null, hcDark: activeContrastBorder, hcLight: activeContrastBorder }, nls.localize('symbolHighlightBorder', 'Background color of the border around highlighted symbols.'), true);

export const editorCursorForeground = registerColor('editorCursor.foreground', { dark: '#AEAFAD', light: Color.black, hcDark: Color.white, hcLight: '#0F4A85' }, nls.localize('caret', 'Color of the editor cursor.'));
export const editorCursorBackground = registerColor('editorCursor.background', null, nls.localize('editorCursorBackground', 'The background color of the editor cursor. Allows customizing the color of a character overlapped by a block cursor.'));
export const editorWhitespaces = registerColor('editorWhitespace.foreground', { dark: '#e3e4e229', light: '#33333333', hcDark: '#e3e4e229', hcLight: '#CCCCCC' }, nls.localize('editorWhitespaces', 'Color of whitespace characters in the editor.'));
export const editorIndentGuides = registerColor('editorIndentGuide.background', { dark: editorWhitespaces, light: editorWhitespaces, hcDark: editorWhitespaces, hcLight: editorWhitespaces }, nls.localize('editorIndentGuides', 'Color of the editor indentation guides.'));
export const editorActiveIndentGuides = registerColor('editorIndentGuide.activeBackground', { dark: editorWhitespaces, light: editorWhitespaces, hcDark: editorWhitespaces, hcLight: editorWhitespaces }, nls.localize('editorActiveIndentGuide', 'Color of the active editor indentation guides.'));
export const editorLineNumbers = registerColor('editorLineNumber.foreground', { dark: '#858585', light: '#237893', hcDark: Color.white, hcLight: '#292929' }, nls.localize('editorLineNumbers', 'Color of editor line numbers.'));

const deprecatedEditorActiveLineNumber = registerColor('editorActiveLineNumber.foreground', { dark: '#c6c6c6', light: '#0B216F', hcDark: activeContrastBorder, hcLight: activeContrastBorder }, nls.localize('editorActiveLineNumber', 'Color of editor active line number'), false, nls.localize('deprecatedEditorActiveLineNumber', 'Id is deprecated. Use \'editorLineNumber.activeForeground\' instead.'));
export const editorActiveLineNumber = registerColor('editorLineNumber.activeForeground', { dark: deprecatedEditorActiveLineNumber, light: deprecatedEditorActiveLineNumber, hcDark: deprecatedEditorActiveLineNumber, hcLight: deprecatedEditorActiveLineNumber }, nls.localize('editorActiveLineNumber', 'Color of editor active line number'));
export const editorDimmedLineNumber = registerColor('editorLineNumber.dimmedForeground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('editorDimmedLineNumber', 'Color of the final editor line when editor.renderFinalNewline is set to dimmed.'));

export const editorRuler = registerColor('editorRuler.foreground', { dark: '#5A5A5A', light: Color.lightgrey, hcDark: Color.white, hcLight: '#292929' }, nls.localize('editorRuler', 'Color of the editor rulers.'));

export const editorCodeLensForeground = registerColor('editorCodeLens.foreground', { dark: '#999999', light: '#919191', hcDark: '#999999', hcLight: '#292929' }, nls.localize('editorCodeLensForeground', 'Foreground color of editor CodeLens'));

export const editorBracketMatchBackground = registerColor('editorBracketMatch.background', { dark: '#0064001a', light: '#0064001a', hcDark: '#0064001a', hcLight: '#0000' }, nls.localize('editorBracketMatchBackground', 'Background color behind matching brackets'));
export const editorBracketMatchBorder = registerColor('editorBracketMatch.border', { dark: '#888', light: '#B9B9B9', hcDark: contrastBorder, hcLight: contrastBorder }, nls.localize('editorBracketMatchBorder', 'Color for matching brackets boxes'));

export const editorOverviewRulerBorder = registerColor('editorOverviewRuler.border', { dark: '#7f7f7f4d', light: '#7f7f7f4d', hcDark: '#7f7f7f4d', hcLight: '#666666' }, nls.localize('editorOverviewRulerBorder', 'Color of the overview ruler border.'));
export const editorOverviewRulerBackground = registerColor('editorOverviewRuler.background', null, nls.localize('editorOverviewRulerBackground', 'Background color of the editor overview ruler.'));

export const editorGutter = registerColor('editorGutter.background', { dark: editorBackground, light: editorBackground, hcDark: editorBackground, hcLight: editorBackground }, nls.localize('editorGutter', 'Background color of the editor gutter. The gutter contains the glyph margins and the line numbers.'));

export const editorUnnecessaryCodeBorder = registerColor('editorUnnecessaryCode.border', { dark: null, light: null, hcDark: Color.fromHex('#fff').transparent(0.8), hcLight: contrastBorder }, nls.localize('unnecessaryCodeBorder', 'Border color of unnecessary (unused) source code in the editor.'));
export const editorUnnecessaryCodeOpacity = registerColor('editorUnnecessaryCode.opacity', { dark: Color.fromHex('#000a'), light: Color.fromHex('#0007'), hcDark: null, hcLight: null }, nls.localize('unnecessaryCodeOpacity', 'Opacity of unnecessary (unused) source code in the editor. For example, "#000000c0" will render the code with 75% opacity. For high contrast themes, use the  \'editorUnnecessaryCode.border\' theme color to underline unnecessary code instead of fading it out.'));

export const ghostTextBorder = registerColor('editorGhostText.border', { dark: null, light: null, hcDark: Color.fromHex('#fff').transparent(0.8), hcLight: Color.fromHex('#292929').transparent(0.8) }, nls.localize('editorGhostTextBorder', 'Border color of ghost text in the editor.'));
export const ghostTextForeground = registerColor('editorGhostText.foreground', { dark: Color.fromHex('#ffffff56'), light: Color.fromHex('#0007'), hcDark: null, hcLight: null }, nls.localize('editorGhostTextForeground', 'Foreground color of the ghost text in the editor.'));
export const ghostTextBackground = registerColor('editorGhostText.background', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('editorGhostTextBackground', 'Background color of the ghost text in the editor.'));

const rulerRangeDefault = new Color(new RGBA(0, 122, 204, 0.6));
export const overviewRulerRangeHighlight = registerColor('editorOverviewRuler.rangeHighlightForeground', { dark: rulerRangeDefault, light: rulerRangeDefault, hcDark: rulerRangeDefault, hcLight: rulerRangeDefault }, nls.localize('overviewRulerRangeHighlight', 'Overview ruler marker color for range highlights. The color must not be opaque so as not to hide underlying decorations.'), true);
export const overviewRulerError = registerColor('editorOverviewRuler.errorForeground', { dark: new Color(new RGBA(255, 18, 18, 0.7)), light: new Color(new RGBA(255, 18, 18, 0.7)), hcDark: new Color(new RGBA(255, 50, 50, 1)), hcLight: '#B5200D' }, nls.localize('overviewRuleError', 'Overview ruler marker color for errors.'));
export const overviewRulerWarning = registerColor('editorOverviewRuler.warningForeground', { dark: editorWarningForeground, light: editorWarningForeground, hcDark: editorWarningBorder, hcLight: editorWarningBorder }, nls.localize('overviewRuleWarning', 'Overview ruler marker color for warnings.'));
export const overviewRulerInfo = registerColor('editorOverviewRuler.infoForeground', { dark: editorInfoForeground, light: editorInfoForeground, hcDark: editorInfoBorder, hcLight: editorInfoBorder }, nls.localize('overviewRuleInfo', 'Overview ruler marker color for infos.'));

export const editorBracketHighlightingForeground1 = registerColor('editorBracketHighlight.foreground1', { dark: '#FFD700', light: '#0431FAFF', hcDark: '#FFD700', hcLight: '#0431FAFF' }, nls.localize('editorBracketHighlightForeground1', 'Foreground color of brackets (1). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground2 = registerColor('editorBracketHighlight.foreground2', { dark: '#DA70D6', light: '#319331FF', hcDark: '#DA70D6', hcLight: '#319331FF' }, nls.localize('editorBracketHighlightForeground2', 'Foreground color of brackets (2). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground3 = registerColor('editorBracketHighlight.foreground3', { dark: '#179FFF', light: '#7B3814FF', hcDark: '#87CEFA', hcLight: '#7B3814FF' }, nls.localize('editorBracketHighlightForeground3', 'Foreground color of brackets (3). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground4 = registerColor('editorBracketHighlight.foreground4', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground4', 'Foreground color of brackets (4). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground5 = registerColor('editorBracketHighlight.foreground5', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground5', 'Foreground color of brackets (5). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground6 = registerColor('editorBracketHighlight.foreground6', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground6', 'Foreground color of brackets (6). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground7 = registerColor('editorBracketHighlight.foreground7', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground7', 'Foreground color of brackets (7). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground8 = registerColor('editorBracketHighlight.foreground8', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground8', 'Foreground color of brackets (8). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground9 = registerColor('editorBracketHighlight.foreground9', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground9', 'Foreground color of brackets (9). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground10 = registerColor('editorBracketHighlight.foreground10', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground10', 'Foreground color of brackets (10). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground11 = registerColor('editorBracketHighlight.foreground11', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground11', 'Foreground color of brackets (11). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground12 = registerColor('editorBracketHighlight.foreground12', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground12', 'Foreground color of brackets (12). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground13 = registerColor('editorBracketHighlight.foreground13', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground13', 'Foreground color of brackets (13). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground14 = registerColor('editorBracketHighlight.foreground14', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground14', 'Foreground color of brackets (14). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground15 = registerColor('editorBracketHighlight.foreground15', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground15', 'Foreground color of brackets (15). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground16 = registerColor('editorBracketHighlight.foreground16', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground16', 'Foreground color of brackets (16). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground17 = registerColor('editorBracketHighlight.foreground17', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground17', 'Foreground color of brackets (17). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground18 = registerColor('editorBracketHighlight.foreground18', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground18', 'Foreground color of brackets (18). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground19 = registerColor('editorBracketHighlight.foreground19', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground19', 'Foreground color of brackets (19). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground20 = registerColor('editorBracketHighlight.foreground20', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground20', 'Foreground color of brackets (20). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground21 = registerColor('editorBracketHighlight.foreground21', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground21', 'Foreground color of brackets (21). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground22 = registerColor('editorBracketHighlight.foreground22', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground22', 'Foreground color of brackets (22). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground23 = registerColor('editorBracketHighlight.foreground23', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground23', 'Foreground color of brackets (23). Requires enabling bracket pair colorization.'));
export const editorBracketHighlightingForeground24 = registerColor('editorBracketHighlight.foreground24', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketHighlightForeground24', 'Foreground color of brackets (24). Requires enabling bracket pair colorization.'));

export const editorBracketHighlightingUnexpectedBracketForeground = registerColor('editorBracketHighlight.unexpectedBracket.foreground', { dark: new Color(new RGBA(255, 18, 18, 0.8)), light: new Color(new RGBA(255, 18, 18, 0.8)), hcDark: new Color(new RGBA(255, 50, 50, 1)), hcLight: '' }, nls.localize('editorBracketHighlightUnexpectedBracketForeground', 'Foreground color of unexpected brackets.'));

export const editorBracketPairGuideBackground1 = registerColor('editorBracketPairGuide.background1', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background1', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground2 = registerColor('editorBracketPairGuide.background2', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background2', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground3 = registerColor('editorBracketPairGuide.background3', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background3', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground4 = registerColor('editorBracketPairGuide.background4', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background4', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground5 = registerColor('editorBracketPairGuide.background5', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background5', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground6 = registerColor('editorBracketPairGuide.background6', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background6', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground7 = registerColor('editorBracketPairGuide.background7', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background7', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground8 = registerColor('editorBracketPairGuide.background8', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background8', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground9 = registerColor('editorBracketPairGuide.background9', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background9', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground10 = registerColor('editorBracketPairGuide.background10', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background10', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground11 = registerColor('editorBracketPairGuide.background11', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background11', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground12 = registerColor('editorBracketPairGuide.background12', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background12', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground13 = registerColor('editorBracketPairGuide.background13', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background13', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground14 = registerColor('editorBracketPairGuide.background14', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background14', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground15 = registerColor('editorBracketPairGuide.background15', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background15', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground16 = registerColor('editorBracketPairGuide.background16', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background16', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground17 = registerColor('editorBracketPairGuide.background17', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background17', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground18 = registerColor('editorBracketPairGuide.background18', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background18', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground19 = registerColor('editorBracketPairGuide.background19', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background19', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground20 = registerColor('editorBracketPairGuide.background20', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background20', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground21 = registerColor('editorBracketPairGuide.background21', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background21', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground22 = registerColor('editorBracketPairGuide.background22', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background22', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground23 = registerColor('editorBracketPairGuide.background23', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background23', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideBackground24 = registerColor('editorBracketPairGuide.background24', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.background24', 'Background color of inactive bracket pair guides (1). Requires enabling bracket pair guides.'));

export const editorBracketPairGuideActiveBackground1 = registerColor('editorBracketPairGuide.activeBackground1', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground1', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground2 = registerColor('editorBracketPairGuide.activeBackground2', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground2', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground3 = registerColor('editorBracketPairGuide.activeBackground3', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground3', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground4 = registerColor('editorBracketPairGuide.activeBackground4', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground4', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground5 = registerColor('editorBracketPairGuide.activeBackground5', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground5', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground6 = registerColor('editorBracketPairGuide.activeBackground6', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground6', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground7 = registerColor('editorBracketPairGuide.activeBackground7', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground7', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground8 = registerColor('editorBracketPairGuide.activeBackground8', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground8', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground9 = registerColor('editorBracketPairGuide.activeBackground9', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground9', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground10 = registerColor('editorBracketPairGuide.activeBackground10', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground10', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground11 = registerColor('editorBracketPairGuide.activeBackground11', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground11', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground12 = registerColor('editorBracketPairGuide.activeBackground12', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground12', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground13 = registerColor('editorBracketPairGuide.activeBackground13', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground13', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground14 = registerColor('editorBracketPairGuide.activeBackground14', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground14', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground15 = registerColor('editorBracketPairGuide.activeBackground15', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground15', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground16 = registerColor('editorBracketPairGuide.activeBackground16', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground16', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground17 = registerColor('editorBracketPairGuide.activeBackground17', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground17', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground18 = registerColor('editorBracketPairGuide.activeBackground18', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground18', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground19 = registerColor('editorBracketPairGuide.activeBackground19', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground19', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground20 = registerColor('editorBracketPairGuide.activeBackground20', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground20', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground21 = registerColor('editorBracketPairGuide.activeBackground21', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground21', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground22 = registerColor('editorBracketPairGuide.activeBackground22', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground22', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground23 = registerColor('editorBracketPairGuide.activeBackground23', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground23', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));
export const editorBracketPairGuideActiveBackground24 = registerColor('editorBracketPairGuide.activeBackground24', { dark: '#00000000', light: '#00000000', hcDark: '#00000000', hcLight: '#00000000' }, nls.localize('editorBracketPairGuide.activeBackground24', 'Background color of active bracket pair guides (1). Requires enabling bracket pair guides.'));

export const editorUnicodeHighlightBorder = registerColor('editorUnicodeHighlight.border', { dark: '#BD9B03', light: '#CEA33D', hcDark: '#ff0000', hcLight: '#CEA33D' }, nls.localize('editorUnicodeHighlight.border', 'Border color used to highlight unicode characters.'));
export const editorUnicodeHighlightBackground = registerColor('editorUnicodeHighlight.background', { dark: '#bd9b0326', light: '#cea33d14', hcDark: '#00000000', hcLight: '#cea33d14' }, nls.localize('editorUnicodeHighlight.background', 'Background color used to highlight unicode characters.'));


// contains all color rules that used to defined in editor/browser/widget/editor.css
registerThemingParticipant((theme, collector) => {
	const background = theme.getColor(editorBackground);
	const lineHighlight = theme.getColor(editorLineHighlight);
	const imeBackground = (lineHighlight && !lineHighlight.isTransparent() ? lineHighlight : background);
	if (imeBackground) {
		collector.addRule(`.monaco-editor .inputarea.ime-input { background-color: ${imeBackground}; }`);
	}
});
