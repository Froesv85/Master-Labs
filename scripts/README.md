# Dev start scripts

Two helper scripts to run backend and frontend concurrently for development.

- PowerShell (Windows): `scripts/start-dev.ps1`
  - Usage: `.\	emplates\scripts\start-dev.ps1` or open PowerShell and run `.\	emplates\scripts\start-dev.ps1 -Install` to install deps first.
- Shell (macOS/Linux): `scripts/start-dev.sh`
  - Usage: `./scripts/start-dev.sh` or `./scripts/start-dev.sh install` to install deps first.

Notes:
- The scripts expect paths: `maker-connect` (frontend) and `maker-connect/backend` (backend).
- `npm run dev` is used for both projects (scripts defined in their `package.json`).
