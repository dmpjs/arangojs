<h1 align="center">ArangoJS for deno</h1>
<p align="center">
    <a href="https://github.com/dmpjs/arangojs/releases">
        <img src="https://img.shields.io/github/release/dmpjs/arangojs.svg?color=bright_green&label=latest&style=flat-square">
    </a>
    <a href="https://github.com/dmpjs/arangojs/actions">
        <img src="https://img.shields.io/github/workflow/status/dmpjs/arangojs/Continuous%20Integration/master?label=ci&style=flat-square">
    </a>
    <a href="https://github.com/semantic-release/semantic-release">
        <img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square">
    </a>
    <a href="https://opensource.org/licenses/MIT">
        <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square">
    </a>
</p>

ArangoJS bassed on official [ArangoJS](https://github.com/arangodb/arangojs) and has been ported for use on Deno, on top of the deno fetch.

## Installation

Run

```
import { Database } from "https://raw.githubusercontent.com/dmpjs/arangojs/master/mod/database.ts"; // import from github as raw data

import { Database } from "https://deno.land/x/arangojs/mod/database.ts"; // If module is uploaded into deno.land
```

## Usage

### Basic usage

```typescript
import { Database } from "https://raw.githubusercontent.com/dmpjs/arangojs/master/mod/database.ts"; // import from github as raw data

const db = new Database();

console.log(await db.version());
```

For more, please visit the [ArangoJS docs](https://www.arangodb.com/docs/3.6/drivers/js.html).

## Test

Run

```
deno test ./test.ts
```

## Versioning

This library follows semantic versioning, and additions to the code ruleset are performed in major releases.

## Changelog

Please have a look at [`CHANGELOG.md`](CHANGELOG.md).

## Contributing

Please have a look at [`CONTRIBUTING.md`](.github/CONTRIBUTING.md).

## Code of Conduct

Please have a look at [`CODE_OF_CONDUCT.md`](.github/CODE_OF_CONDUCT.md).

## License

This work is dual-licensed under Apache 2.0 and MIT

Please have a look at [`LICENSE.md`](LICENSE.md).

> Some files inside this package are licensed using the Apache License, Version 2.0.

Please have a look at [`LICENSE_APACHE.md`](LICENSE.md).
