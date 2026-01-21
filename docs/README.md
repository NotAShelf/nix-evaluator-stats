# nix-evaluator-stats

A pretty visualiser for Nix evaluator stats from `NIX_SHOW_STATS` and
`NIX_COUNT_CALLS` invocations.

![Demo](./assets/ns-demo.png)

ns takes the resulting JSON data from your Nix invocation with the relevant
variables, and provides a ✨ pretty ✨ dashboard-like visual with the ability to
compare your "snapshots" of benchmarks. Besides looking nice, it is helpful in
collecting statistics about your Nix commands and tracking performance
regressions in subsequent exports.

## Usage

Usage instructions are provided in the initial page. Simply navigate to the site
and provide the JSON export (or a file) to render the statistics. The number of
rendered fields might differ based on your Nix version or implementation (Lix,
Snix, etc.) Please crate an issue if the render looks wrong or incorrect.

## Hacking

`nix-evaluator-stats` (or "ns" for short) is built with Vite, using
Typescript-React (`.tsx`) and SolidJS. A Nix shell is provided, and NPM
dependencies can be fetched with `pnpm` while inside the dev shell.

```bash
# Run the live server
$ pnpm run dev

# Build a static site
$ pnpm run build
```

If submitting pull requests, please ensure that format (`pnpm run fmt`) and lint
(`pnpm run lint`) tasks are ran beforehand.

## License

<!-- markdownlint-disable MD059 -->

This project is made available under Mozilla Public License (MPL) version 2.0.
See [LICENSE](LICENSE) for more details on the exact conditions. An online copy
is provided [here](https://www.mozilla.org/en-US/MPL/2.0/).

<!-- markdownlint-enable MD059 -->
