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
            "to": 'const VERSION = "${nextRelease.version}"',
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
          {
            "files": [
              "README.md",
            ],
            "from": "/v.*/",
            "to": "/v${nextRelease.version}/mod.ts",
            "results": [
              {
                "file": "README.md",
                "hasChanged": true,
                "numMatches": 2,
                "numReplacements": 2,
              },
            ],
            "countMatches": true,
          },
          {
            "files": [
              "README.md",
            ],
            "from": "@v.*/",
            "to": "@v${nextRelease.version}/mod.ts",
            "results": [
              {
                "file": "README.md",
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
          "mod/*",
          "src/*",
          "README.md",
          "UPGRADE.md",
          "LICENSE.md",
          "LICENSE_MIT.md",
          "CHANGELOG.md",
        ],
      },
    ],
  ],
};
