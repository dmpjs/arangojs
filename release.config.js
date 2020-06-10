module.exports = {
  "dryRun": false,
  "plugins": [
    [
      "@semantic-release/commit-analyzer",
      {
        "preset": "conventionalcommits",
      },
    ],
    [
      "@google/semantic-release-replace-plugin",
      {
        "replacements": [
          {
            "files": [
              "version.ts",
            ],
            "from": 'const VERSION = ".*"',
            "to":
              'const VERSION = "${nextRelease.version}"',
            "results": [
              {
                "file": "version.ts",
                "hasChanged": true,
                "numMatches": 1,
                "numReplacements": 1,
              },
            ],
            "countMatches": true,
          },
        ],
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        "preset": "conventionalcommits",
      },
    ],
    "@semantic-release/changelog",
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        "assets": [
          "version.ts",
          "mod.ts",
          "src/*",
          "UPGRADE.md",
          "LICENSE.md",
          "CHANGELOG.md",
        ],
      },
    ],
  ],
};
