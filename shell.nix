{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  packages = [
    pkgs.nodejs-slim
    pkgs.pnpm
  ];
}
