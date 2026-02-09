{
  lib,
  stdenv,
  fetchPnpmDeps,
  nodejs-slim,
  pnpm,
  pnpmConfigHook,
}:
stdenv.mkDerivation (finalAttrs: {
  pname = "nix-evaluator-stats";
  version = "0.1.0";

  src = ../.;

  nativeBuildInputs = [
    nodejs-slim
    pnpm
    pnpmConfigHook # dependency resolution
  ];

  pnpmDeps = fetchPnpmDeps {
    inherit (finalAttrs) pname src;
    hash = "sha256-K6wk/OrH9eO/jYMcqkj4MhREg59qHu3Zvxd3JKFIOgM=";
    fetcherVersion = 3; # https://nixos.org/manual/nixpkgs/stable/#javascript-pnpm-fetcherVersion
  };

  buildPhase = ''
    runHook preBuild

    mkdir -p $out/share/dist
    pnpm run build --outDir $out/share/dist

    runHook postBuild
  '';

  meta = {
    description = "Pretty visualiser for Nix evaluator stats";
    homepage = "https://github.com/notashelf/nix-evaluator-stats";
    platforms = ["x86_64-linux" "aarch64-linux"];
    license = lib.licenses.mpl20;
    maintainers = [lib.maintainers.NotAShelf];
  };
})
