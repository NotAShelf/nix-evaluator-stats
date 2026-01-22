# nix-evaluator-stats

<!-- markdownlint-disable MD033 -->

<div align="center">

<a alt="CI Status" href="https://github.com/NotAShelf/nix-evaluator-stats">
    <img
      src="https://github.com/NotAShelf/nix-evaluator-stats/actions/workflows/check.yml/badge.svg"
      alt="Lints & Formatting"
    />
  </a>
  <a alt="Build & Deploy" href="https://notashelf.github.io/nix-evaluator-stats/">
    <img
      src="https://github.com/NotAShelf/nix-evaluator-stats/actions/workflows/deploy.yml/badge.svg"
      alt="License"
    />
  </a>
</div>

<!-- markdownlint-enable MD033 -->

![Demo](./assets/ns-demo.png)

`nix-evaluator-stats`, or "ns" for short, is a pretty visualiser for the Nix
evaluator stats export from `NIX_SHOW_STATS` and `NIX_COUNT_CALLS` invocations.
It takes the resulting JSON data from your Nix invocation with the relevant
variables, and provides a ✨ pretty ✨ dashboard-like visual with the ability to
compare your "snapshots" of benchmarks. Besides looking nice, it is helpful in
collecting statistics about your Nix commands and tracking performance
regressions in subsequent exports.

## Usage

Usage instructions are provided in the initial page. Simply navigate to the site
and provide the JSON export (or a file) to render the statistics. The number of
rendered fields might differ based on your Nix version or implementation (Lix,
Snix, etc.) The classic usage looks like this:

```bash
# Invoke a Nix command with NIX_SHOW_STATS=1
$ NIX_SHOW_STATS=1 nix eval nixpkgs#hello -- --option eval-cache false # disable eval-cache for accuracy
```

1. Create the JSON export
2. Copy it
3. Paste it in the input field that appears the first time you visit the site

Once you hit "Load", the JSON will be parsed and you'll be looking at a dash
board of your export. By using the snapshot feature, i.e., saving a particular
analysis you may compare two _named_ analyses at a time.

> [!NOTE]
> `nix-evaluator-stats` was created in a very short duration, and there might be
> UI bugs or areas where UI polish is very clearly missing. Please crate an
> issue if the generated graph or the site UI looks off. Thanks :)

## Hacking

This project is built with Vite, using Typescript-React (`.tsx`) and SolidJS. A
Nix shell is provided, and dependencies can be fetched with `pnpm` while inside
the dev shell.

```bash
# Run the live server
$ pnpm run dev

# Build a static site
$ pnpm run build
```

If submitting pull requests, please ensure that format (`pnpm run fmt`) and lint
(`pnpm run lint`) tasks are ran beforehand. The automated CI will tell you
whether your code matches the requirements, but it's a good rule of thumb to do
this before submitting your PR.

## License

<!-- markdownlint-disable MD059 -->

This project is made available under Mozilla Public License (MPL) version 2.0.
See [LICENSE](LICENSE) for more details on the exact conditions. An online copy
is provided [here](https://www.mozilla.org/en-US/MPL/2.0/).

<!-- markdownlint-enable MD059 -->
