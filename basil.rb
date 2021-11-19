# The formula for installing basil binary.
class Basil < Formula
  desc 'The command-line tool for Basil framework'
  license 'ISC'
  homepage 'https://github.com/gardenbed/basil-cli'
  url 'https://github.com/gardenbed/basil-cli.git',
      tag: 'v0.2.0',
      revision: 'd32ddf0a33652ac6994093134bea58962a2411e5'
  head 'https://github.com/gardenbed/basil-cli.git',
       branch: 'main'

  depends_on 'go' => :build

  def install
    commit = `git rev-parse --short HEAD`
    go_version = `go version | grep -E -o '[0-9]+\.[0-9]+\.[0-9]+'`
    build_time = `date '+%Y-%m-%d %T %Z'`

    commit = commit.strip
    go_version = go_version.strip
    build_time = build_time.strip

    metadata_package = 'github.com/gardenbed/basil-cli/metadata'
    version_flag = "-X \"#{metadata_package}.Version=#{version}\""
    commit_flag = "-X \"#{metadata_package}.Commit=#{commit}\""
    branch_flag = "-X \"#{metadata_package}.Branch=main\""
    go_version_flag = "-X \"#{metadata_package}.GoVersion=#{go_version}\""
    build_tool_flag = "-X \"#{metadata_package}.BuildTool=Homebrew\""
    build_time_flag = "-X \"#{metadata_package}.BuildTime=#{build_time}\""
    ldflags = "#{version_flag} #{commit_flag} #{branch_flag} #{go_version_flag} #{build_tool_flag} #{build_time_flag}"

    system 'go', 'build', '-ldflags', ldflags, './cmd/basil'

    bin.install 'basil'
    prefix.install_metafiles
  end

  test do
    system "#{bin}/basil", '-version'
  end
end
