jest.mock('@actions/core')
jest.mock('@actions/exec')
jest.mock('@actions/github')

const fs = require('fs')
const { Buffer } = require('buffer')

const core = require('@actions/core')
const exec = require('@actions/exec')
const github = require('@actions/github')

const { run } = require('./update')

describe('run', () => {
  let gpgImportOutput

  const files = [
    'foo.rb',
    'bar.rb'
  ]

  const fooContent = `url "https://github.com/octocat/foo.git",
  tag: "v0.1.0",
  revision: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"`

  const barContent = `url "https://github.com/octocat/bar.git",
  tag: "v0.2.0",
  revision: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"`

  const fooNewTag = {
    name: 'v0.1.1',
    commit: {
      sha: 'cccccccccccccccccccccccccccccccccccccccc'
    }
  }

  const barNewTag = {
    name: 'v0.2.1',
    commit: {
      sha: 'dddddddddddddddddddddddddddddddddddddddd'
    }
  }

  const pull = {
    number: 1,
    title: '[AUTOMATED] Update Formulas',
    user: {
      login: 'github-actions[bot]'
    },
    html_url: 'https://github.com/octocat/homebrew-test/pulls/1'
  }

  beforeEach(() => {
    core.getInput
      .mockReturnValueOnce('github-token')
      .mockReturnValueOnce('Jane Doe')
      .mockReturnValueOnce('jane.doe@example.com')
      .mockReturnValueOnce('-----BEGIN PGP PRIVATE KEY BLOCK----- -----END PGP PRIVATE KEY BLOCK-----')

    github.context.repo = {
      owner: 'gardenbed',
      repo: 'homebrew-brew'
    }

    gpgImportOutput = Buffer.from('gpg: key 0123456789ABCDEF: secret key imported')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('running git config user.name command fails', async () => {
    exec.exec
      .mockRejectedValueOnce(new Error('error on git config user.name'))
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on git config user.name')
  })

  test('running git config user.email command fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockRejectedValueOnce(new Error('error on git config user.email'))
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on git config user.email')
  })

  test('writing signing key file fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
    fs.promises.writeFile = jest.fn()
      .mockRejectedValueOnce(new Error('error on writing key file'))
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on writing key file')
  })

  test('running gpg import command fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
    exec.getExecOutput
      .mockRejectedValueOnce(new Error('error on importing gpg key'))
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on importing gpg key')
  })

  test('running git config user.signingkey command fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockRejectedValueOnce(new Error('error on git config user.signingkey'))
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on git config user.signingkey')
  })

  test('running git config commit.gpgSign command fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockRejectedValueOnce(new Error('error on git config commit.gpgSign'))
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on git config commit.gpgSign')
  })

  test('running git config tag.gpgSign command fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockRejectedValueOnce(new Error('error on git config tag.gpgSign'))
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on git config tag.gpgSign')
  })

  test('reading directory fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
    fs.promises.readdir = jest.fn()
      .mockRejectedValueOnce(new Error('cannot read directory'))
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('cannot read directory')
  })

  test('reading ruby file fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockRejectedValueOnce(new Error('cannot read file'))
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('cannot read file')
  })

  test('getting the latest release fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockResolvedValueOnce(fooContent) // read foo.rb file
    github.getOctokit.mockReturnValueOnce({
      rest: {
        repos: {
          getLatestRelease: jest.fn()
            .mockRejectedValueOnce(new Error('cannot get the latest release'))
        }
      }
    })
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('cannot get the latest release')
  })

  test('all formulas are up-to-date', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockResolvedValueOnce(fooContent) // read foo.rb file
      .mockResolvedValueOnce(barContent) // read bar.rb file
    github.getOctokit.mockReturnValueOnce({
      rest: {
        repos: {
          getLatestRelease: jest.fn()
            .mockResolvedValueOnce({ data: { tag_name: 'v0.1.0' } })
            .mockResolvedValueOnce({ data: { tag_name: 'v0.2.0' } })
        }
      }
    })
    await run()
    expect(core.setOutput).toHaveBeenCalledWith('updated', false)
  })

  test('listing tags fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockResolvedValueOnce(fooContent) // read foo.rb file
    github.getOctokit.mockReturnValueOnce({
      rest: {
        repos: {
          getLatestRelease: jest.fn()
            .mockResolvedValueOnce({ data: { tag_name: 'v0.1.1' } }),
          listTags: jest.fn()
            .mockRejectedValueOnce(new Error('cannot list tags'))
        }
      }
    })
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('cannot list tags')
  })

  test('writing file fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
      .mockRejectedValueOnce(new Error('cannot write file'))
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockResolvedValueOnce(fooContent) // read foo.rb file
    github.getOctokit.mockReturnValueOnce({
      rest: {
        repos: {
          getLatestRelease: jest.fn()
            .mockResolvedValueOnce({ data: { tag_name: 'v0.1.1' } }),
          listTags: jest.fn()
            .mockResolvedValueOnce({ data: [fooNewTag] })
        }
      }
    })
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('cannot write file')
  })

  test('running git add command fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
      .mockRejectedValueOnce(new Error('error on git add'))
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
      .mockResolvedValueOnce() // update ruby file
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockResolvedValueOnce(fooContent) // read foo.rb file
    github.getOctokit.mockReturnValueOnce({
      rest: {
        repos: {
          getLatestRelease: jest.fn()
            .mockResolvedValueOnce({ data: { tag_name: 'v0.1.1' } }),
          listTags: jest.fn()
            .mockResolvedValueOnce({ data: [fooNewTag] })
        }
      }
    })
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on git add')
  })

  test('running git checkout command fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
      .mockResolvedValueOnce() // git add
      .mockRejectedValueOnce(new Error('error on git checkout'))
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
      .mockResolvedValueOnce() // update ruby file
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockResolvedValueOnce(fooContent) // read foo.rb file
      .mockResolvedValueOnce(barContent) // read bar.rb file
    github.getOctokit.mockReturnValueOnce({
      rest: {
        repos: {
          getLatestRelease: jest.fn()
            .mockResolvedValueOnce({ data: { tag_name: 'v0.1.1' } })
            .mockResolvedValueOnce({ data: { tag_name: 'v0.2.1' } }),
          listTags: jest.fn()
            .mockResolvedValueOnce({ data: [fooNewTag] })
            .mockResolvedValueOnce({ data: [barNewTag] })
        }
      }
    })
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on git checkout')
  })

  test('running git commit command fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
      .mockResolvedValueOnce() // git add
      .mockResolvedValueOnce() // git checkout
      .mockRejectedValueOnce(new Error('error on git commit'))
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
      .mockResolvedValueOnce() // update ruby file
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockResolvedValueOnce(fooContent) // read foo.rb file
      .mockResolvedValueOnce(barContent) // read bar.rb file
    github.getOctokit.mockReturnValueOnce({
      rest: {
        repos: {
          getLatestRelease: jest.fn()
            .mockResolvedValueOnce({ data: { tag_name: 'v0.1.1' } })
            .mockResolvedValueOnce({ data: { tag_name: 'v0.2.1' } }),
          listTags: jest.fn()
            .mockResolvedValueOnce({ data: [fooNewTag] })
            .mockResolvedValueOnce({ data: [barNewTag] })
        }
      }
    })
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on git commit')
  })

  test('running git push command fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
      .mockResolvedValueOnce() // git add
      .mockResolvedValueOnce() // git checkout
      .mockResolvedValueOnce() // git commit
      .mockRejectedValueOnce(new Error('error on git push'))
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
      .mockResolvedValueOnce() // update ruby file
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockResolvedValueOnce(fooContent) // read foo.rb file
      .mockResolvedValueOnce(barContent) // read bar.rb file
    github.getOctokit.mockReturnValueOnce({
      rest: {
        repos: {
          getLatestRelease: jest.fn()
            .mockResolvedValueOnce({ data: { tag_name: 'v0.1.1' } })
            .mockResolvedValueOnce({ data: { tag_name: 'v0.2.1' } }),
          listTags: jest.fn()
            .mockResolvedValueOnce({ data: [fooNewTag] })
            .mockResolvedValueOnce({ data: [barNewTag] })
        }
      }
    })
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on git push')
  })

  test('getting repo fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
      .mockResolvedValueOnce() // git add
      .mockResolvedValueOnce() // git checkout
      .mockResolvedValueOnce() // git commit
      .mockResolvedValueOnce() // git push
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
      .mockResolvedValueOnce() // update ruby file
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockResolvedValueOnce(fooContent) // read foo.rb file
      .mockResolvedValueOnce(barContent) // read bar.rb file
    github.getOctokit.mockReturnValueOnce({
      rest: {
        repos: {
          getLatestRelease: jest.fn()
            .mockResolvedValueOnce({ data: { tag_name: 'v0.1.1' } })
            .mockResolvedValueOnce({ data: { tag_name: 'v0.2.1' } }),
          listTags: jest.fn()
            .mockResolvedValueOnce({ data: [fooNewTag] })
            .mockResolvedValueOnce({ data: [barNewTag] }),
          get: jest.fn()
            .mockRejectedValueOnce(new Error('error on getting repo'))
        }
      }
    })
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on getting repo')
  })

  test('listing pulls fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
      .mockResolvedValueOnce() // git add
      .mockResolvedValueOnce() // git checkout
      .mockResolvedValueOnce() // git commit
      .mockResolvedValueOnce() // git push
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
      .mockResolvedValueOnce() // update ruby file
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockResolvedValueOnce(fooContent) // read foo.rb file
      .mockResolvedValueOnce(barContent) // read bar.rb file
    github.getOctokit.mockReturnValueOnce({
      rest: {
        repos: {
          getLatestRelease: jest.fn()
            .mockResolvedValueOnce({ data: { tag_name: 'v0.1.1' } })
            .mockResolvedValueOnce({ data: { tag_name: 'v0.2.1' } }),
          listTags: jest.fn()
            .mockResolvedValueOnce({ data: [fooNewTag] })
            .mockResolvedValueOnce({ data: [barNewTag] }),
          get: jest.fn()
            .mockResolvedValueOnce({ data: { default_branch: 'main' } })
        },
        pulls: {
          list: jest.fn()
            .mockRejectedValueOnce(new Error('error on listing pulls'))
        }
      }
    })
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on listing pulls')
  })

  test('there is an open pull request', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
      .mockResolvedValueOnce() // git add
      .mockResolvedValueOnce() // git checkout
      .mockResolvedValueOnce() // git commit
      .mockResolvedValueOnce() // git push
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
      .mockResolvedValueOnce() // update ruby file
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockResolvedValueOnce(fooContent) // read foo.rb file
      .mockResolvedValueOnce(barContent) // read bar.rb file
    github.getOctokit.mockReturnValueOnce({
      rest: {
        repos: {
          getLatestRelease: jest.fn()
            .mockResolvedValueOnce({ data: { tag_name: 'v0.1.1' } })
            .mockResolvedValueOnce({ data: { tag_name: 'v0.2.1' } }),
          listTags: jest.fn()
            .mockResolvedValueOnce({ data: [fooNewTag] })
            .mockResolvedValueOnce({ data: [barNewTag] }),
          get: jest.fn()
            .mockResolvedValueOnce({ data: { default_branch: 'main' } })
        },
        pulls: {
          list: jest.fn()
            .mockResolvedValueOnce({ data: [pull] })
        }
      }
    })
    await run()
    expect(core.setOutput).toHaveBeenCalledWith('updated', true)
    expect(core.setOutput).toHaveBeenCalledWith('pull_number', 1)
    expect(core.setOutput).toHaveBeenCalledWith('pull_url', 'https://github.com/octocat/homebrew-test/pulls/1')
  })

  test('creating pull fails', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
      .mockResolvedValueOnce() // git add
      .mockResolvedValueOnce() // git checkout
      .mockResolvedValueOnce() // git commit
      .mockResolvedValueOnce() // git push
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
      .mockResolvedValueOnce() // update ruby file
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockResolvedValueOnce(fooContent) // read foo.rb file
      .mockResolvedValueOnce(barContent) // read bar.rb file
    github.getOctokit.mockReturnValueOnce({
      rest: {
        repos: {
          getLatestRelease: jest.fn()
            .mockResolvedValueOnce({ data: { tag_name: 'v0.1.1' } })
            .mockResolvedValueOnce({ data: { tag_name: 'v0.2.1' } }),
          listTags: jest.fn()
            .mockResolvedValueOnce({ data: [fooNewTag] })
            .mockResolvedValueOnce({ data: [barNewTag] }),
          get: jest.fn()
            .mockResolvedValueOnce({ data: { default_branch: 'main' } })
        },
        pulls: {
          list: jest.fn()
            .mockResolvedValueOnce({ data: [] }),
          create: jest.fn()
            .mockRejectedValueOnce(new Error('error on creating pull'))
        }
      }
    })
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('error on creating pull')
  })

  test('open a new pull request succeeds', async () => {
    exec.exec
      .mockResolvedValueOnce() // git config user.name
      .mockResolvedValueOnce() // git config user.email
      .mockResolvedValueOnce() // git config user.signingkey
      .mockResolvedValueOnce() // git config commit.gpgSign
      .mockResolvedValueOnce() // git config tag.gpgSign
      .mockResolvedValueOnce() // git add
      .mockResolvedValueOnce() // git checkout
      .mockResolvedValueOnce() // git commit
      .mockResolvedValueOnce() // git push
    exec.getExecOutput
      .mockResolvedValueOnce({ stdout: gpgImportOutput }) // gpg --import
    fs.promises.writeFile = jest.fn()
      .mockResolvedValueOnce() // write signing key file
      .mockResolvedValueOnce() // update ruby file
    fs.promises.readdir = jest.fn()
      .mockResolvedValueOnce(files) // read directory
    fs.promises.readFile = jest.fn()
      .mockResolvedValueOnce(fooContent) // read foo.rb file
      .mockResolvedValueOnce(barContent) // read bar.rb file
    github.getOctokit.mockReturnValueOnce({
      rest: {
        repos: {
          getLatestRelease: jest.fn()
            .mockResolvedValueOnce({ data: { tag_name: 'v0.1.1' } })
            .mockResolvedValueOnce({ data: { tag_name: 'v0.2.1' } }),
          listTags: jest.fn()
            .mockResolvedValueOnce({ data: [fooNewTag] })
            .mockResolvedValueOnce({ data: [barNewTag] }),
          get: jest.fn()
            .mockResolvedValueOnce({ data: { default_branch: 'main' } })
        },
        pulls: {
          list: jest.fn()
            .mockResolvedValueOnce({ data: [] }),
          create: jest.fn()
            .mockResolvedValueOnce({ data: pull })
        }
      }
    })
    await run()
    expect(core.setOutput).toHaveBeenCalledWith('updated', true)
    expect(core.setOutput).toHaveBeenCalledWith('pull_number', 1)
    expect(core.setOutput).toHaveBeenCalledWith('pull_url', 'https://github.com/octocat/homebrew-test/pulls/1')
  })
})
