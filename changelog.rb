# The formula for installing changelog binary.
class Changelog < Formula
  desc 'The Simple Changelog Generator'
  license 'ISC'
  homepage 'https://github.com/gardenbed/changelog'
  url 'https://github.com/gardenbed/changelog.git',
      tag: 'v0.1.8',
      revision: 'c5709e41d4442763c1c48f65dadbb3c4b5da98fc'
  head 'https://github.com/gardenbed/changelog.git',
       branch: 'main'

  depends_on 'go' => :build

  def install
    commit = `git rev-parse --short HEAD`
    go_version = `go version | grep -E -o '[0-9]+\.[0-9]+(\.[0-9]+)?'`
    build_time = `date '+%Y-%m-%d %T %Z'`

    commit = commit.strip
    go_version = go_version.strip
    build_time = build_time.strip

    metadata_package = 'github.com/gardenbed/changelog/metadata'
    version_flag = "-X \"#{metadata_package}.Version=#{version}\""
    commit_flag = "-X \"#{metadata_package}.Commit=#{commit}\""
    branch_flag = "-X \"#{metadata_package}.Branch=main\""
    go_version_flag = "-X \"#{metadata_package}.GoVersion=#{go_version}\""
    build_tool_flag = "-X \"#{metadata_package}.BuildTool=Homebrew\""
    build_time_flag = "-X \"#{metadata_package}.BuildTime=#{build_time}\""
    ldflags = "#{version_flag} #{commit_flag} #{branch_flag} #{go_version_flag} #{build_tool_flag} #{build_time_flag}"

    system 'go', 'build', '-ldflags', ldflags, './cmd/changelog'

    bin.install 'changelog'
    prefix.install_metafiles
  end

  test do
    system "#{bin}/changelog", '-version'
  end
end
