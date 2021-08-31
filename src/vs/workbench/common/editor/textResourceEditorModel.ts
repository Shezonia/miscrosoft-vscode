/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BaseTextEditorModel } from 'vs/workbench/common/editor/textEditorModel';
import { URI } from 'vs/base/common/uri';
import { IModeService } from 'vs/editor/common/services/modeService';
import { IModelService } from 'vs/editor/common/services/modelService';
import { ILanguageDetectionService } from 'vs/workbench/services/languageDetection/common/languageDetectionWorkerService';
import { IAriaAlertService } from 'vs/workbench/services/accessibility/common/ariaAlertService';

/**
 * An editor model for in-memory, readonly text content that
 * is backed by an existing editor model.
 */
export class TextResourceEditorModel extends BaseTextEditorModel {

	constructor(
		resource: URI,
		@IModeService modeService: IModeService,
		@IModelService modelService: IModelService,
		@ILanguageDetectionService languageDetectionService: ILanguageDetectionService,
		@IAriaAlertService ariaAlertService: IAriaAlertService
	) {
		super(modelService, modeService, languageDetectionService, ariaAlertService, resource);
	}

	override dispose(): void {

		// force this class to dispose the underlying model
		if (this.textEditorModelHandle) {
			this.modelService.destroyModel(this.textEditorModelHandle);
		}

		super.dispose();
	}
}
