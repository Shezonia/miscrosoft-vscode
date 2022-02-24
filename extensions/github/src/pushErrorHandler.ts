/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TextDecoder } from 'util';
import { commands, env, ProgressLocation, Uri, window, RelativePattern, workspace, QuickPickOptions } from 'vscode';
import * as nls from 'vscode-nls';
import { getOctokit } from './auth';
import { GitErrorCodes, PushErrorHandler, Remote, Repository } from './typings/git';

const localize = nls.loadMessageBundle();

type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

export function isInCodespaces(): boolean {
	return env.remoteName === 'codespaces';
}

async function handlePushError(repository: Repository, remote: Remote, refspec: string, owner: string, repo: string): Promise<void> {
	const yes = localize('create a fork', "Create Fork");
	const no = localize('no', "No");

	const answer = await window.showInformationMessage(localize('fork', "You don't have permissions to push to '{0}/{1}' on GitHub. Would you like to create a fork and push to it instead?", owner, repo), yes, no);
	if (answer === no) {
		return;
	}

	const match = /^([^:]*):([^:]*)$/.exec(refspec);
	const localName = match ? match[1] : refspec;
	let remoteName = match ? match[2] : refspec;

	const [octokit, ghRepository] = await window.withProgress({ location: ProgressLocation.Notification, cancellable: false, title: localize('create fork', 'Create GitHub fork') }, async progress => {
		progress.report({ message: localize('forking', "Forking '{0}/{1}'...", owner, repo), increment: 33 });

		const octokit = await getOctokit();

		type CreateForkResponseData = Awaited<ReturnType<typeof octokit.repos.createFork>>['data'];

		// Issue: what if the repo already exists?
		let ghRepository: CreateForkResponseData;
		try {
			if (isInCodespaces()) {
				// Call into the codespaces extension to fork the repository
				const resp = await commands.executeCommand<{ repository: CreateForkResponseData; ref: string }>('github.codespaces.forkRepository');
				if (!resp) {
					throw new Error('Unable to fork respository');
				}

				ghRepository = resp.repository;

				if (resp.ref) {
					let ref = resp.ref;
					if (ref.startsWith('refs/heads/')) {
						ref = ref.substr(11);
					}

					remoteName = ref;
				}
			} else {
				const resp = await octokit.repos.createFork({ owner, repo });
				ghRepository = resp.data;
			}
		} catch (ex) {
			console.error(ex);
			throw ex;
		}

		progress.report({ message: localize('forking_pushing', "Pushing changes..."), increment: 33 });

		// Issue: what if there's already an `upstream` repo?
		await repository.renameRemote(remote.name, 'upstream');

		// Issue: what if there's already another `origin` repo?
		await repository.addRemote('origin', ghRepository.clone_url);

		try {
			await repository.fetch('origin', remoteName);
			await repository.setBranchUpstream(localName, `origin/${remoteName}`);
		} catch {
			// noop
		}

		await repository.push('origin', localName, true);

		return [octokit, ghRepository] as const;
	});

	// yield
	(async () => {
		const openOnGitHub = localize('openingithub', "Open on GitHub");
		const createPR = localize('createpr', "Create PR");
		const action = await window.showInformationMessage(localize('forking_done', "The fork '{0}' was successfully created on GitHub.", ghRepository.full_name), openOnGitHub, createPR);

		if (action === openOnGitHub) {
			await commands.executeCommand('vscode.open', Uri.parse(ghRepository.html_url));
		} else if (action === createPR) {
			const pr = await window.withProgress({ location: ProgressLocation.Notification, cancellable: false, title: localize('createghpr', "Creating GitHub Pull Request...") }, async _ => {
				let title = `Update ${remoteName}`;
				const head = repository.state.HEAD?.name;

				if (head) {
					const commit = await repository.getCommit(head);
					title = commit.message.replace(/\n.*$/m, '');
				}

				let body: string | undefined;

				const templates = await getPullRequestTemplates(repository);
				if (templates.length > 0) {
					templates.sort((a, b) => a.path.localeCompare(b.path));
					const pickedTemplate = await pickPullRequestTemplate(templates);
					if (pickedTemplate) {
						body = new TextDecoder('utf-8').decode(await workspace.fs.readFile(pickedTemplate));
					}
				}

				const res = await octokit.pulls.create({
					owner,
					repo,
					title,
					body,
					head: `${ghRepository.owner.login}:${remoteName}`,
					base: remoteName
				});

				await repository.setConfig(`branch.${localName}.remote`, 'upstream');
				await repository.setConfig(`branch.${localName}.merge`, `refs/heads/${remoteName}`);
				await repository.setConfig(`branch.${localName}.github-pr-owner-number`, `${owner}#${repo}#${pr.number}`);

				return res.data;
			});

			const openPR = localize('openpr', "Open PR");
			const action = await window.showInformationMessage(localize('donepr', "The PR '{0}/{1}#{2}' was successfully created on GitHub.", owner, repo, pr.number), openPR);

			if (action === openPR) {
				await commands.executeCommand('vscode.open', Uri.parse(pr.html_url));
			}
		}
	})();
}

async function getPullRequestTemplates(repository: Repository): Promise<Uri[]> {
	/**
	 * Places a PR template can be:
	 * - At the root, the docs folder, or the.github folder, named pull_request_template.md or PULL_REQUEST_TEMPLATE.md
	 * - At the same folder locations under a PULL_REQUEST_TEMPLATE folder with any name
	 *
	 * NOTE This method is a modified copy of a method with same name at microsoft/vscode-pull-request-github repository:
	 *   https://github.com/microsoft/vscode-pull-request-github/blob/0a0c3c6c21c0b9c2f4d5ffbc3f8c6a825472e9e6/src/github/folderRepositoryManager.ts#L1061
	 *
	 */
	const pattern1 = '{pull_request_template,PULL_REQUEST_TEMPLATE}.md';
	const templatesPattern1 = await workspace.findFiles(
		new RelativePattern(repository.rootUri, pattern1)
	);

	const pattern2 = '{docs,.github}/{pull_request_template,PULL_REQUEST_TEMPLATE}.md';
	const templatesPattern2 = await workspace.findFiles(
		new RelativePattern(repository.rootUri, pattern2), null
	);

	const pattern3 = 'PULL_REQUEST_TEMPLATE/*.md';
	const templatesPattern3 = await workspace.findFiles(
		new RelativePattern(repository.rootUri, pattern3)
	);

	const pattern4 = '{docs,.github}/PULL_REQUEST_TEMPLATE/*.md';
	const templatesPattern4 = await workspace.findFiles(
		new RelativePattern(repository.rootUri, pattern4), null
	);

	return [...templatesPattern1, ...templatesPattern2, ...templatesPattern3, ...templatesPattern4];
}

async function pickPullRequestTemplate(templates: Uri[]): Promise<Uri | undefined> {
	const quickPickItemFromUri = (x: Uri) => ({ label: x.path, template: x });
	const quickPickItems = [
		{
			label: localize('no pr template', "No template"),
			picked: true,
			template: undefined,
		},
		...templates.map(quickPickItemFromUri)
	];
	const quickPickOptions: QuickPickOptions = {
		placeHolder: localize('select pr template', "Select the Pull Request template")
	};
	const pickedTemplate = await window.showQuickPick(quickPickItems, quickPickOptions);
	return pickedTemplate?.template;
}

export class GithubPushErrorHandler implements PushErrorHandler {

	async handlePushError(repository: Repository, remote: Remote, refspec: string, error: Error & { gitErrorCode: GitErrorCodes }): Promise<boolean> {
		if (error.gitErrorCode !== GitErrorCodes.PermissionDenied) {
			return false;
		}

		const remoteUrl = remote.pushUrl || (isInCodespaces() ? remote.fetchUrl : undefined);
		if (!remoteUrl) {
			return false;
		}

		const match = /^(?:https:\/\/github\.com\/|git@github\.com:)([^/]+)\/([^/.]+)(?:\.git)?$/i.exec(remoteUrl);
		if (!match) {
			return false;
		}

		if (/^:/.test(refspec)) {
			return false;
		}

		const [, owner, repo] = match;
		await handlePushError(repository, remote, refspec, owner, repo);

		return true;
	}
}
