jest.mock('@actions/core')
jest.mock('@actions/github')

const core = require('@actions/core')
const github = require('@actions/github')

const { getConfig } = require('./config')

describe('getConfig', () => {
  beforeAll(() => {
    github.context.repo = {
      owner: 'gardenbed',
      repo: 'homebrew-brew'
    }
  })

  test('input parameters are not provided', async () => {
    core.getInput.mockReturnValue('')

    const config = await getConfig()

    expect(config).toEqual({
      owner: 'gardenbed',
      repo: 'homebrew-brew',
      githubToken: '',
      gitUserName: '',
      gitUserEmail: '',
      gitUserSigningKey: '',
      remoteName: 'origin',
      branchName: 'automated-update-formulas',
      commitMessage: '[AUTOMATED] Update Formulas',
      pullRequestTitle: '[AUTOMATED] Update Formulas',
      pullRequestUser: 'github-actions[bot]'
    })
  })

  test('input parameters are provided', async () => {
    core.getInput
      .mockReturnValueOnce('github-token')
      .mockReturnValueOnce('Jane Doe')
      .mockReturnValueOnce('jane.doe@example.com')
      .mockReturnValueOnce('-----BEGIN PGP PRIVATE KEY BLOCK----- -----END PGP PRIVATE KEY BLOCK-----')

    const config = await getConfig()

    expect(config).toEqual({
      owner: 'gardenbed',
      repo: 'homebrew-brew',
      githubToken: 'github-token',
      gitUserName: 'Jane Doe',
      gitUserEmail: 'jane.doe@example.com',
      gitUserSigningKey: '-----BEGIN PGP PRIVATE KEY BLOCK----- -----END PGP PRIVATE KEY BLOCK-----',
      remoteName: 'origin',
      branchName: 'automated-update-formulas',
      commitMessage: '[AUTOMATED] Update Formulas',
      pullRequestTitle: '[AUTOMATED] Update Formulas',
      pullRequestUser: 'github-actions[bot]'
    })
  })
})
