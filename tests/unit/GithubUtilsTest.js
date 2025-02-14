/**
 * @jest-environment node
 */
const {Octokit} = require('@octokit/rest');
const GithubUtils = require('../../.github/libs/GithubUtils');

describe('GithubUtils', () => {
    describe('getStagingDeployCash', () => {
        const baseIssue = {
            url: 'https://api.github.com/repos/Andrew-Test-Org/Public-Test-Repo/issues/29',
            title: 'Andrew Test Issue',
            labels: [
                {
                    id: 2783847782,
                    node_id: 'MDU6TGFiZWwyNzgzODQ3Nzgy',
                    url: 'https://api.github.com/repos/Andrew-Test-Org/Public-Test-Repo/labels/StagingDeployCash',
                    name: 'StagingDeployCash',
                    color: '6FC269',
                    default: false,
                    description: '',
                },
            ],
            // eslint-disable-next-line max-len
            body: '**Release Version:** `1.0.1-47`\r\n**Compare Changes:** https://github.com/Expensify/Expensify.cash/compare/production...staging\r\n\r\n**This release contains changes from the following pull requests:**\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/21\r\n- [x] https://github.com/Expensify/Expensify.cash/pull/22\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/23\r\n\r\n',
        };
        const issueWithDeployBlockers = {...baseIssue};
        // eslint-disable-next-line max-len
        issueWithDeployBlockers.body += '\r\n**Deploy Blockers:**\r\n- [ ] https://github.com/Expensify/Expensify.cash/issues/1\r\n- [x] https://github.com/Expensify/Expensify.cash/issues/2\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/1234\r\n';

        const baseExpectedResponse = {
            PRList: [
                {
                    url: 'https://github.com/Expensify/Expensify.cash/pull/21',
                    number: 21,
                    isVerified: false,
                },
                {
                    url: 'https://github.com/Expensify/Expensify.cash/pull/22',
                    number: 22,
                    isVerified: true,
                },
                {
                    url: 'https://github.com/Expensify/Expensify.cash/pull/23',
                    number: 23,
                    isVerified: false,
                },
            ],
            labels: [
                {
                    color: '6FC269',
                    default: false,
                    description: '',
                    id: 2783847782,
                    name: 'StagingDeployCash',
                    node_id: 'MDU6TGFiZWwyNzgzODQ3Nzgy',
                    url: 'https://api.github.com/repos/Andrew-Test-Org/Public-Test-Repo/labels/StagingDeployCash',
                },
            ],
            tag: '1.0.1-47',
            title: 'Andrew Test Issue',
            url: 'https://api.github.com/repos/Andrew-Test-Org/Public-Test-Repo/issues/29',
            deployBlockers: [],
        };
        const expectedResponseWithDeployBlockers = {...baseExpectedResponse};
        expectedResponseWithDeployBlockers.deployBlockers = [
            {
                url: 'https://github.com/Expensify/Expensify.cash/issues/1',
                number: 1,
                isResolved: false,
            },
            {
                url: 'https://github.com/Expensify/Expensify.cash/issues/2',
                number: 2,
                isResolved: true,
            },
            {
                url: 'https://github.com/Expensify/Expensify.cash/pull/1234',
                number: 1234,
                isResolved: false,
            },
        ];

        test('Test finding an open issue with no PRs successfully', () => {
            const octokit = new Octokit();
            const github = new GithubUtils(octokit);
            const bareIssue = {
                ...baseIssue,
                // eslint-disable-next-line max-len
                body: '**Release Version:** `1.0.1-47`\r\n**Compare Changes:** https://github.com/Expensify/Expensify.cash/compare/production...staging\r\n\r\ncc @Expensify/applauseleads\n',
            };

            const bareExpectedResponse = {
                ...baseExpectedResponse,
                PRList: [],
            };

            octokit.issues.listForRepo = jest.fn().mockResolvedValue({data: [bareIssue]});
            return github.getStagingDeployCash().then(data => expect(data).toStrictEqual(bareExpectedResponse));
        });

        test('Test finding an open issue successfully', () => {
            const octokit = new Octokit();
            const github = new GithubUtils(octokit);
            octokit.issues.listForRepo = jest.fn().mockResolvedValue({data: [baseIssue]});
            return github.getStagingDeployCash().then(data => expect(data).toStrictEqual(baseExpectedResponse));
        });

        test('Test finding an open issue successfully and parsing with deploy blockers', () => {
            const octokit = new Octokit();
            const github = new GithubUtils(octokit);
            octokit.issues.listForRepo = jest.fn().mockResolvedValue({data: [issueWithDeployBlockers]});
            return github.getStagingDeployCash()
                .then(data => expect(data).toStrictEqual(expectedResponseWithDeployBlockers));
        });

        test('Test finding an open issue successfully and parsing with blockers w/o carriage returns', () => {
            const octokit = new Octokit();
            const github = new GithubUtils(octokit);

            const modifiedIssueWithDeployBlockers = {...issueWithDeployBlockers};
            modifiedIssueWithDeployBlockers.body = modifiedIssueWithDeployBlockers.body.replace(/\r/g, '');

            octokit.issues.listForRepo = jest.fn().mockResolvedValue({data: [modifiedIssueWithDeployBlockers]});
            return github.getStagingDeployCash()
                .then(data => expect(data).toStrictEqual(expectedResponseWithDeployBlockers));
        });

        test('Test finding an open issue without a body', () => {
            const octokit = new Octokit();
            const github = new GithubUtils(octokit);

            const noBodyIssue = baseIssue;
            noBodyIssue.body = '';

            octokit.issues.listForRepo = jest.fn().mockResolvedValue({data: [noBodyIssue]});
            return github.getStagingDeployCash()
                .catch(e => expect(e).toEqual(new Error('Unable to find StagingDeployCash issue with correct data.')));
        });

        test('Test finding more than one issue', () => {
            const octokit = new Octokit();
            const github = new GithubUtils(octokit);
            octokit.issues.listForRepo = jest.fn().mockResolvedValue({data: [{a: 1}, {b: 2}]});
            return github.getStagingDeployCash()
                .catch(e => expect(e).toEqual(new Error('Found more than one StagingDeployCash issue.')));
        });

        test('Test finding no issues', () => {
            const octokit = new Octokit();
            const github = new GithubUtils(octokit);
            octokit.issues.listForRepo = jest.fn().mockResolvedValue({data: []});
            return github.getStagingDeployCash()
                .catch(e => expect(e).toEqual(new Error('Unable to find StagingDeployCash issue.')));
        });
    });

    describe('updateStagingDeployCash', () => {
        test('successfully updates issue', () => {
            const issueBefore = {
                url: 'https://api.github.com/repos/Expensify/Expensify.cash/issues/29',
                title: 'Test StagingDeployCash',
                labels: [
                    {
                        id: 2783847782,
                        node_id: 'MDU6TGFiZWwyNzgzODQ3Nzgy',
                        url: 'https://api.github.com/repos/Expensify/Expensify.cash/labels/StagingDeployCash',
                        name: 'StagingDeployCash',
                        color: '6FC269',
                        default: false,
                        description: '',
                    },
                ],
                // eslint-disable-next-line max-len
                body: '**Release Version:** `1.0.1-47`\r\n**Compare Changes:** https://github.com/Expensify/Expensify.cash/compare/production...staging\r\n\r\n**This release contains changes from the following pull requests:**\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/21\r\n- [x] https://github.com/Expensify/Expensify.cash/pull/22\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/23\r\n\r\n**Deploy Blockers:**\r\n- [ ] https://github.com/Expensify/Expensify.cash/issues/1\r\n- [x] https://github.com/Expensify/Expensify.cash/issues/2\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/1234\r\n',
            };

            const octokit = new Octokit();
            octokit.repos.listTags = jest.fn().mockResolvedValue({
                data: [
                    {name: '1.0.1-0'},
                    {name: '1.0.1-47'},
                    {name: '1.0.1-48'},
                ],
            });
            octokit.issues.listForRepo = jest.fn().mockResolvedValue({data: [issueBefore]});
            octokit.issues.update = jest.fn().mockImplementation(arg => Promise.resolve(arg));
            const githubUtils = new GithubUtils(octokit);

            return githubUtils.updateStagingDeployCash(
                '1.0.1-48',
                [
                    'https://github.com/Expensify/Expensify.cash/pull/24',
                    'https://github.com/Expensify/Expensify.cash/pull/25',
                ],
                [
                    'https://github.com/Expensify/Expensify.cash/issues/3',
                    'https://github.com/Expensify/Expensify.cash/pull/4321',
                ],
            ).then((result) => {
                expect(result).toStrictEqual({
                    owner: GithubUtils.GITHUB_OWNER,
                    repo: GithubUtils.EXPENSIFY_CASH_REPO,
                    issue_number: 29,
                    // eslint-disable-next-line max-len
                    body: '**Release Version:** `1.0.1-48`\r\n**Compare Changes:** https://github.com/Expensify/Expensify.cash/compare/production...staging\r\n\r\n**This release contains changes from the following pull requests:**\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/21\r\n- [x] https://github.com/Expensify/Expensify.cash/pull/22\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/23\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/24\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/25\r\n\r\n**Deploy Blockers:**\r\n- [ ] https://github.com/Expensify/Expensify.cash/issues/1\r\n- [x] https://github.com/Expensify/Expensify.cash/issues/2\r\n- [ ] https://github.com/Expensify/Expensify.cash/issues/3\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/1234\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/4321\r\n\r\ncc @Expensify/applauseleads\r\n',
                });
            });
        });

        test('updates issue with just deploy blockers', () => {
            const issueBefore = {
                url: 'https://api.github.com/repos/Expensify/Expensify.cash/issues/29',
                title: 'Test StagingDeployCash',
                labels: [
                    {
                        id: 2783847782,
                        node_id: 'MDU6TGFiZWwyNzgzODQ3Nzgy',
                        url: 'https://api.github.com/repos/Expensify/Expensify.cash/labels/StagingDeployCash',
                        name: 'StagingDeployCash',
                        color: '6FC269',
                        default: false,
                        description: '',
                    },
                ],
                // eslint-disable-next-line max-len
                body: '**Release Version:** `1.0.1-47`\r\n**Compare Changes:** https://github.com/Expensify/Expensify.cash/compare/production...staging\r\n\r\n**This release contains changes from the following pull requests:**\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/21\r\n- [x] https://github.com/Expensify/Expensify.cash/pull/22\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/23\r\n\r\n',
            };

            const octokit = new Octokit();
            octokit.repos.listTags = jest.fn().mockResolvedValue({
                data: [
                    {name: '1.0.1-0'},
                    {name: '1.0.1-47'},
                    {name: '1.0.1-48'},
                ],
            });
            octokit.issues.listForRepo = jest.fn().mockResolvedValue({data: [issueBefore]});
            octokit.issues.update = jest.fn().mockImplementation(arg => Promise.resolve(arg));
            const githubUtils = new GithubUtils(octokit);

            return githubUtils.updateStagingDeployCash(
                undefined,
                undefined,
                ['https://github.com/Expensify/Expensify.cash/pull/24',
                    'https://github.com/Expensify/Expensify.cash/issues/25'],
            ).then((result) => {
                expect(result).toStrictEqual({
                    owner: GithubUtils.GITHUB_OWNER,
                    repo: GithubUtils.EXPENSIFY_CASH_REPO,
                    issue_number: 29,
                    // eslint-disable-next-line max-len
                    body: '**Release Version:** `1.0.1-47`\r\n**Compare Changes:** https://github.com/Expensify/Expensify.cash/compare/production...staging\r\n\r\n**This release contains changes from the following pull requests:**\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/21\r\n- [x] https://github.com/Expensify/Expensify.cash/pull/22\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/23\r\n\r\n**Deploy Blockers:**\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/24\r\n- [ ] https://github.com/Expensify/Expensify.cash/issues/25\r\n\r\ncc @Expensify/applauseleads\r\n',
                });
            });
        });
    });

    describe('getPullRequestNumberFromURL', () => {
        describe('valid pull requests', () => {
            test.each([
                ['https://github.com/Expensify/Expensify/pull/156369', 156369],
                ['https://github.com/Expensify/Expensify.cash/pull/1644', 1644],
                ['https://github.com/Expensify/expensify-common/pull/346', 346],
                ['https://api.github.com/repos/Expensify/Expensify/pull/156369', 156369],
                ['https://api.github.com/repos/Expensify/Expensify.cash/pull/1644', 1644],
                ['https://api.github.com/repos/Expensify/expensify-common/pull/346', 346],
            ])('getPullRequestNumberFromURL("%s")', (input, expected) => {
                expect(GithubUtils.getPullRequestNumberFromURL(input)).toBe(expected);
            });
        });

        describe('invalid pull requests', () => {
            test.each([
                ['https://www.google.com/'],
                ['https://github.com/Expensify/Expensify/issues/156481'],
                ['https://docs.google.com/document/d/1mMFh-m1seOES48r3zNqcvfuTvr3qOAsY6n5rP4ejdXE/edit?ts=602420d2#'],
            ])('getPullRequestNumberFromURL("%s")', (input) => {
                expect(() => GithubUtils.getPullRequestNumberFromURL(input))
                    .toThrow(new Error(`Provided URL ${input} is not a Github Pull Request!`));
            });
        });
    });

    describe('getIssueNumberFromURL', () => {
        describe('valid issues', () => {
            test.each([
                ['https://github.com/Expensify/Expensify/issues/156369', 156369],
                ['https://github.com/Expensify/Expensify.cash/issues/1644', 1644],
                ['https://github.com/Expensify/expensify-common/issues/346', 346],
                ['https://api.github.com/repos/Expensify/Expensify/issues/156369', 156369],
                ['https://api.github.com/repos/Expensify/Expensify.cash/issues/1644', 1644],
                ['https://api.github.com/repos/Expensify/expensify-common/issues/346', 346],
            ])('getIssueNumberFromURL("%s")', (input, expected) => {
                expect(GithubUtils.getIssueNumberFromURL(input)).toBe(expected);
            });
        });

        describe('invalid issues', () => {
            test.each([
                ['https://www.google.com/'],
                ['https://github.com/Expensify/Expensify/pull/156481'],
                ['https://docs.google.com/document/d/1mMFh-m1seOES48r3zNqcvfuTvr3qOAsY6n5rP4ejdXE/edit?ts=602420d2#'],
            ])('getIssueNumberFromURL("%s")', (input) => {
                expect(() => GithubUtils.getIssueNumberFromURL(input))
                    .toThrow(new Error(`Provided URL ${input} is not a Github Issue!`));
            });
        });
    });

    describe('getIssueOrPullRequestNumberFromURL', () => {
        describe('valid issues and pull requests', () => {
            test.each([
                ['https://github.com/Expensify/Expensify/issues/156369', 156369],
                ['https://github.com/Expensify/Expensify.cash/issues/1644', 1644],
                ['https://github.com/Expensify/expensify-common/issues/346', 346],
                ['https://github.com/Expensify/Expensify/pull/156369', 156369],
                ['https://github.com/Expensify/Expensify.cash/pull/1644', 1644],
                ['https://github.com/Expensify/expensify-common/pull/346', 346],
                ['https://api.github.com/repos/Expensify/Expensify/issues/156369', 156369],
                ['https://api.github.com/repos/Expensify/Expensify.cash/issues/1644', 1644],
                ['https://api.github.com/repos/Expensify/expensify-common/issues/346', 346],
                ['https://api.github.com/repos/Expensify/Expensify/pull/156369', 156369],
                ['https://api.github.com/repos/Expensify/Expensify.cash/pull/1644', 1644],
                ['https://api.github.com/repos/Expensify/expensify-common/pull/346', 346],
            ])('getIssueOrPullRequestNumberFromURL("%s")', (input, expected) => {
                expect(GithubUtils.getIssueOrPullRequestNumberFromURL(input)).toBe(expected);
            });
        });

        describe('invalid issues/pull requests', () => {
            test.each([
                ['https://www.google.com/'],
                ['https://docs.google.com/document/d/1mMFh-m1seOES48r3zNqcvfuTvr3qOAsY6n5rP4ejdXE/edit?ts=602420d2#'],
            ])('getIssueOrPullRequestNumberFromURL("%s")', (input) => {
                expect(() => GithubUtils.getIssueOrPullRequestNumberFromURL(input))
                    .toThrow(new Error(`Provided URL ${input} is not a valid Github Issue or Pull Request!`));
            });
        });
    });

    describe('createNewStagingDeployCash', () => {
        const octokit = new Octokit();
        octokit.repos.listTags = jest.fn().mockResolvedValue({data: [{name: '1.0.2-0'}]});
        octokit.issues.create = jest.fn().mockImplementation(arg => Promise.resolve(arg));
        const githubUtils = new GithubUtils(octokit);

        const title = 'Test StagingDeployCash title';
        const tag = '1.0.2-12';
        const PRList = [
            'https://github.com/Expensify/Expensify.cash/pull/2',
            'https://github.com/Expensify/Expensify.cash/pull/3',
            'https://github.com/Expensify/Expensify.cash/pull/3',
            'https://github.com/Expensify/Expensify.cash/pull/1',
        ];

        test('Issue is successfully created', () => (
            githubUtils.createNewStagingDeployCash(title, tag, PRList)
                .then((newIssue) => {
                    expect(newIssue).toStrictEqual({
                        owner: GithubUtils.GITHUB_OWNER,
                        repo: GithubUtils.EXPENSIFY_CASH_REPO,
                        labels: ['StagingDeployCash'],
                        assignees: ['applausebot'],
                        title,
                        // eslint-disable-next-line max-len
                        body: `**Release Version:** \`${tag}\`\r\n**Compare Changes:** https://github.com/Expensify/Expensify.cash/compare/production...staging\r\n\r\n**This release contains changes from the following pull requests:**\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/1\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/2\r\n- [ ] https://github.com/Expensify/Expensify.cash/pull/3\r\n\r\ncc @Expensify/applauseleads\r\n`,
                    });
                })
        ));
    });

    describe('generateStagingDeployCashBody', () => {
        const mockTags = [{name: '1.0.2-0'}, {name: '1.0.2-12'}];
        const mockPRs = [
            {
                number: 1,
                html_url: 'https://github.com/Expensify/Expensify.cash/pull/1',
                user: {login: 'testUser'},
                labels: [],
            },
            {
                number: 2,
                html_url: 'https://github.com/Expensify/Expensify.cash/pull/2',
                user: {login: 'testUser'},
                labels: [],
            },
            {
                number: 3,
                html_url: 'https://github.com/Expensify/Expensify.cash/pull/3',
                user: {login: 'testUser'},
                labels: [],
            },
            {
                number: 4,
                html_url: 'https://github.com/Expensify/Expensify.cash/pull/4',
                user: {login: 'OSBotify'},
                labels: [{name: 'automerge'}],
            },
        ];
        const mockGithub = jest.fn(() => ({
            getOctokit: () => ({
                repos: {
                    listTags: jest.fn().mockResolvedValue({data: mockTags}),
                },
                pulls: {
                    list: jest.fn().mockResolvedValue({data: mockPRs}),
                },
            }),
        }));

        const octokit = mockGithub().getOctokit();
        const githubUtils = new GithubUtils(octokit);

        const tag = '1.0.2-12';
        const basePRList = [
            'https://github.com/Expensify/Expensify.cash/pull/2',
            'https://github.com/Expensify/Expensify.cash/pull/3',
            'https://github.com/Expensify/Expensify.cash/pull/3',
            'https://github.com/Expensify/Expensify.cash/pull/1',
            'https://github.com/Expensify/Expensify.cash/pull/4',
        ];

        const baseDeployBlockerList = [
            'https://github.com/Expensify/Expensify.cash/pull/3',
            'https://github.com/Expensify/Expensify.cash/issues/4',
        ];

        // eslint-disable-next-line max-len
        const baseExpectedOutput = `**Release Version:** \`${tag}\`\r\n**Compare Changes:** https://github.com/Expensify/Expensify.cash/compare/production...staging\r\n\r\n**This release contains changes from the following pull requests:**\r\n`;
        const openCheckbox = '- [ ]';
        const closedCheckbox = '- [x]';

        const ccApplauseLeads = '\r\ncc @Expensify/applauseleads\r\n';

        test('Test no verified PRs', () => (
            githubUtils.generateStagingDeployCashBody(tag, basePRList)
                .then((issueBody) => {
                    // eslint-disable-next-line max-len
                    expect(issueBody).toBe(`${baseExpectedOutput}${openCheckbox} ${basePRList[3]}\r\n${openCheckbox} ${basePRList[0]}\r\n${openCheckbox} ${basePRList[1]}\r\n${ccApplauseLeads}`);
                })
        ));

        test('Test some verified PRs', () => (
            githubUtils.generateStagingDeployCashBody(tag, basePRList, [basePRList[0]])
                .then((issueBody) => {
                    // eslint-disable-next-line max-len
                    expect(issueBody).toBe(`${baseExpectedOutput}${openCheckbox} ${basePRList[3]}\r\n${closedCheckbox} ${basePRList[0]}\r\n${openCheckbox} ${basePRList[1]}\r\n${ccApplauseLeads}`);
                })
        ));

        // eslint-disable-next-line max-len
        const allVerifiedExpectedOutput = `${baseExpectedOutput}${closedCheckbox} ${basePRList[3]}\r\n${closedCheckbox} ${basePRList[0]}\r\n${closedCheckbox} ${basePRList[1]}\r\n`;
        test('Test all verified PRs', () => (
            githubUtils.generateStagingDeployCashBody(tag, basePRList, basePRList)
                .then((issueBody) => {
                    expect(issueBody).toBe(`${allVerifiedExpectedOutput}${ccApplauseLeads}`);
                })
        ));

        const deployBlockerHeader = '\r\n**Deploy Blockers:**\r\n';
        test('Test no resolved deploy blockers', () => (
            githubUtils.generateStagingDeployCashBody(tag, basePRList, basePRList, baseDeployBlockerList)
                .then((issueBody) => {
                    // eslint-disable-next-line max-len
                    expect(issueBody).toBe(`${allVerifiedExpectedOutput}${deployBlockerHeader}${openCheckbox} ${baseDeployBlockerList[0]}\r\n${openCheckbox} ${baseDeployBlockerList[1]}\r\n${ccApplauseLeads}`);
                })
        ));

        test('Test some resolved deploy blockers', () => (
            // eslint-disable-next-line max-len
            githubUtils.generateStagingDeployCashBody(tag, basePRList, basePRList, baseDeployBlockerList, [baseDeployBlockerList[0]])
                .then((issueBody) => {
                    // eslint-disable-next-line max-len
                    expect(issueBody).toBe(`${allVerifiedExpectedOutput}${deployBlockerHeader}${closedCheckbox} ${baseDeployBlockerList[0]}\r\n${openCheckbox} ${baseDeployBlockerList[1]}\r\n${ccApplauseLeads}`);
                })
        ));

        test('Test all resolved deploy blockers', () => (
            // eslint-disable-next-line max-len
            githubUtils.generateStagingDeployCashBody(tag, basePRList, basePRList, baseDeployBlockerList, baseDeployBlockerList)
                .then((issueBody) => {
                    // eslint-disable-next-line max-len
                    expect(issueBody).toBe(`${allVerifiedExpectedOutput}${deployBlockerHeader}${closedCheckbox} ${baseDeployBlockerList[0]}\r\n${closedCheckbox} ${baseDeployBlockerList[1]}\r\n${ccApplauseLeads}`);
                })
        ));
    });

    describe('getPullRequestURLFromNumber', () => {
        test.each([
            [1234, 'https://github.com/Expensify/Expensify.cash/pull/1234'],
            [54321, 'https://github.com/Expensify/Expensify.cash/pull/54321'],
        ])('getPullRequestNumberFromURL("%s")', (input, expectedOutput) => (
            expect(GithubUtils.getPullRequestURLFromNumber(input)).toBe(expectedOutput)
        ));
    });

    describe('getReleaseBody', () => {
        test.each([
            // eslint-disable-next-line max-len
            [[1, 2, 3], '- https://github.com/Expensify/Expensify.cash/pull/1\r\n- https://github.com/Expensify/Expensify.cash/pull/2\r\n- https://github.com/Expensify/Expensify.cash/pull/3'],
            [[], ''],
            [[12345], '- https://github.com/Expensify/Expensify.cash/pull/12345'],
        ])('getReleaseBody("%s")', (input, expectedOutput) => (
            expect(GithubUtils.getReleaseBody(input)).toBe(expectedOutput)
        ));
    });
});
