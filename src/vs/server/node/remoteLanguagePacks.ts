/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FileAccess } from 'vs/base/common/network';
import { join } from 'vs/base/common/path';
import type { INLSConfiguration } from 'vs/nls';
import { resolveNLSConfiguration } from 'vs/base/node/nls';
import { Promises } from 'vs/base/node/pfs';
import product from 'vs/platform/product/common/product';

const nlsMetadataPath = join(FileAccess.asFileUri('').fsPath);
const nlsConfigurationCache = new Map<string, Promise<INLSConfiguration>>();

export async function getNLSConfiguration(language: string, userDataPath: string): Promise<INLSConfiguration> {
	if (!product.commit || !(await Promises.exists(nlsMetadataPath))) {
		return { userLocale: 'en', osLocale: 'en', availableLanguages: {}, defaultMessagesFile: join(nlsMetadataPath, 'nls.messages.json') };
	}

	const cacheKey = `${language}||${userDataPath}`;
	let result = nlsConfigurationCache.get(cacheKey);
	if (!result) {
		result = resolveNLSConfiguration({ userLocale: language, osLocale: language, commit: product.commit, userDataPath, nlsMetadataPath });
		nlsConfigurationCache.set(cacheKey, result);
	}

	return result;
}
