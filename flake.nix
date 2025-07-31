{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    napalm = {
      url = "github:nix-community/napalm";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    napalm,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      name = "hybooru";
      pkgs = nixpkgs.legacyPackages.${system}.pkgs;
      lib = pkgs.lib;
      nodejs = pkgs.nodejs_20;
    in rec {
      packages = {
        hybooru-raw = napalm.legacyPackages."${system}".buildPackage ./. {
          inherit nodejs;
          patchPackages = false;
          installPhase = "npm run build:prod && cp -r dist $out";
          nativeBuildInputs = [
            pkgs.python3Full
          ];
        };
        hybooru-unwrapped = napalm.legacyPackages."${system}".buildPackage packages.hybooru-raw {
          inherit nodejs;
          patchPackages = false;
          installPhase = "cp -r ./ $out";
          nativeBuildInputs = [
            pkgs.python3Full
          ];
        };
        hybooru-wrapped = pkgs.writeShellScriptBin name ''
          ${lib.getExe pkgs.nodejs} ${packages.hybooru-unwrapped}/server.js "$@"
        '';
        default = packages.hybooru-wrapped;
      };

      devShells.default = pkgs.mkShell {
        nativeBuildInputs = [
          nodejs
          pkgs.python3Full
        ];
      };
    });
}
