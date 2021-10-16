# Update Formulas Action

This action can be used for updating [Homebrew](https://brew.sh) [Formulas](https://docs.brew.sh/Formula-Cookbook).

For each formula in the [Tap](https://docs.brew.sh/Taps),
it checks if there is a newer version of formula available and if so, it updates the formula.

## Inputs

### `github_token`

The GitHub token provided by `GITHUB_TOKEN` secret.
For _schedule_ event, this token is not available through github context.

### `git_user_name`

The name of the git user for creating commits.

### `git_user_email`

The email address of the git user for creating commits.

### `git_user_signing_key`

A private GPG key for signing commits, so they show as verified in GitHub.
This is an optional parameter and if not provided, commits will be unsigned.

## Outputs

### `updated`

Determines whether or not there has been any formula update.

### `pull_number`

The pull request number for updating formulas (if any).

### `pull_url`

The pull request url for updating formulas (if any).

## Example Usages

```yaml
uses: ./.github/actions/update-formulas
with:
  github_token: ${{ secrets.GITHUB_TOKEN }}
```
