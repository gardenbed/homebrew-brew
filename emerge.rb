# The formula for installing emerge binary.
class Emerge < Formula
  desc 'Lexer and Parser Generator for Go'
  license 'ISC'
  homepage 'https://github.com/gardenbed/emerge'
  url 'https://github.com/gardenbed/emerge.git',
      tag: 'v0.2.0',
      revision: 'fccd6aaf6d87ad561db04fff58e40dab3c8871c5'
  head 'https://github.com/gardenbed/emerge.git',
       branch: 'main'

  depends_on 'go' => :build

  def install
    commit = `git rev-parse --short HEAD`
    go_version = `go version | grep -E -o '[0-9]+\.[0-9]+(\.[0-9]+)?'`
    build_time = `date '+%Y-%m-%d %T %Z'`

    commit = commit.strip
    go_version = go_version.strip
    build_time = build_time.strip

    metadata_package = 'github.com/gardenbed/emerge/metadata'
    version_flag = "-X \"#{metadata_package}.Version=#{version}\""
    commit_flag = "-X \"#{metadata_package}.Commit=#{commit}\""
    branch_flag = "-X \"#{metadata_package}.Branch=main\""
    go_version_flag = "-X \"#{metadata_package}.GoVersion=#{go_version}\""
    build_tool_flag = "-X \"#{metadata_package}.BuildTool=Homebrew\""
    build_time_flag = "-X \"#{metadata_package}.BuildTime=#{build_time}\""
    ldflags = "#{version_flag} #{commit_flag} #{branch_flag} #{go_version_flag} #{build_tool_flag} #{build_time_flag}"

    system 'go', 'build', '-ldflags', ldflags, './cmd/emerge'

    bin.install 'emerge'
    prefix.install_metafiles
  end

  test do
    system "#{bin}/emerge", '-version'
  end
end
