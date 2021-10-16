const core = require('@actions/core')
const github = require('@actions/github')

module.exports = {
  getConfig
}

async function getConfig () {
  const { owner, repo } = github.context.repo
  const githubToken = core.getInput('github_token')
  const gitUserName = core.getInput('git_user_name')
  const gitUserEmail = core.getInput('git_user_email')
  const gitUserSigningKey = core.getInput('git_user_signing_key')

  return {
    owner: owner,
    repo: repo,

    // Git configurations
    githubToken: githubToken,
    gitUserName: gitUserName,
    gitUserEmail: gitUserEmail,
    gitUserSigningKey: gitUserSigningKey,

    // Pull request configurations
    remoteName: 'origin',
    branchName: 'automated-update-formulas',
    commitMessage: '[AUTOMATED] Update Formulas',
    pullRequestTitle: '[AUTOMATED] Update Formulas',
    pullRequestUser: 'github-actions[bot]'
  }
}
