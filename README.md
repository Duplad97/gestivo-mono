# Gestivo

Gestivo is a desktop creative tool for gesture-controlled audio processing.

It combines a live webcam stage, MediaPipe-based hand tracking, a real-time Web Audio chain, configurable gesture routing, and local recording so sound can be shaped through hand movement instead of only traditional controls.

## Current State

The repository currently contains one application target:

- `desktop-app`: Electron + React + TypeScript desktop app
- `landing-site`: React + Vite landing page for downloads and release discovery

What is already implemented:

- Electron desktop shell with preload bridge and local preference persistence
- React renderer with Zustand state and Material UI styling
- Live webcam preview and microphone input
- MediaPipe Hand Landmarker integration for gesture tracking
- Gesture routing with configurable mappings and trigger modes
- Real-time low-pass, high-pass, and output gain control
- Audio-only and video-plus-audio recording modes
- Dedicated Settings screen for theme mode, recording mode, and debug overlay
- Dynamic dark/light/system theming
- Branded splash screen and macOS packaging flow
- Landing site with OS-aware GitHub Release download links
- Electron auto-updater wired to GitHub Releases

## Tech Stack

- Electron
- React 19
- TypeScript
- Vite
- Zustand
- Material UI
- MediaPipe Tasks Vision
- Web Audio API
- MediaRecorder API

## Repository Structure

```text
.
├── AI_CONTEXT.md
├── README.md
├── landing-site/
├── shared_assets/
└── desktop-app/
    ├── electron/
    ├── public/
    ├── resources/
    └── src/
```

Important renderer areas inside `desktop-app/src`:

```text
src/
├── app/
│   ├── components/
│   ├── hooks/
│   ├── config.ts
│   └── App.tsx
├── components/
├── features/
│   ├── audio/
│   ├── camera/
│   ├── gestures/
│   ├── recording/
│   └── settings/
├── stores/
├── types/
└── utils/
```

## Getting Started

### Requirements

- Node.js 20+
- npm 10+
- macOS, Windows, or Linux

### Install

```bash
cd desktop-app
npm install
```

### Run in development

```bash
cd desktop-app
npm run dev
```

### Validate

```bash
cd desktop-app
npm run typecheck
npm run build
```

## Available Scripts

From `desktop-app/`:

- `npm run dev`: start the Electron renderer/main development workflow
- `npm run typecheck`: run the TypeScript project build checks
- `npm run build`: build renderer and Electron outputs
- `npm run dist:mac`: create a macOS app bundle and installer artifacts via `electron-builder`
- `npm run dist:win`: create a Windows NSIS installer
- `npm run dist:linux`: create a Linux AppImage
- `npm run dist:all`: build all desktop release targets locally
- `npm run release:mac`: build and publish macOS release artifacts to GitHub Releases
- `npm run release:win`: build and publish Windows release artifacts to GitHub Releases
- `npm run release:linux`: build and publish Linux release artifacts to GitHub Releases

## Packaging

The project now includes multi-platform desktop packaging targets.

```bash
cd desktop-app
npm run dist:mac
npm run dist:win
npm run dist:linux
```

Generated release artifacts are written to:

- `desktop-app/release/`

These files are generated output and are ignored by Git.

Expected release artifact types:

- macOS: `dmg` and `zip` universal builds
- Windows: `nsis` installer
- Linux: `AppImage`

## Landing Page

The download landing site lives in:

- `landing-site/`

What it does:

- detects the visitor OS in the browser
- fetches the latest GitHub Release metadata
- presents a platform-aware desktop download CTA
- falls back to the Releases page if the GitHub API is unavailable

Run it locally:

```bash
cd landing-site
npm install
npm run dev
```

Build it for deployment:

```bash
cd landing-site
npm run build
```

The production build output is written to:

- `landing-site/dist/`

For Vercel, set the project root to `landing-site`, use `npm run build` as the build command, and publish `dist` as the output directory.

## Auto Updates

The Electron app now uses `electron-updater` with GitHub Releases as the update source.

Current updater behavior:

- packaged builds check for updates on launch
- the app checks again periodically while open
- downloaded updates prompt the user to restart immediately or later

Important practical note:

- automatic updates work best with signed production builds, especially on macOS and Windows
- unsigned preview builds may still install manually, but updater trust and OS prompts will be rougher
- for public rollout, code signing and notarization should be treated as the next release-hardening step

## GitHub Release Process

The repository now includes:

- GitHub publishing config in `desktop-app/package.json`
- a release workflow at `.github/workflows/release.yml`

Recommended release flow:

1. Update the version in `desktop-app/package.json`.
2. Commit the release changes.
3. Push the commit to the default branch.
4. Create and push a git tag like `v0.2.0`.

```bash
git tag v0.2.0
git push origin v0.2.0
```

What happens next:

- GitHub Actions runs a build matrix for macOS, Windows, and Linux
- each job runs the matching `release:*` script
- `electron-builder` publishes artifacts and updater metadata to the tagged GitHub Release

If you want to trigger the same workflow manually:

- open the `Actions` tab on GitHub
- run `Release Desktop Builds` with `workflow_dispatch`

Requirements for publishing from GitHub Actions:

- the repository must allow workflows to write release contents
- the default `GITHUB_TOKEN` is used by the workflow
- the repo should stay public, or you should handle private-release auth separately

## Branding Assets

Shared branding assets live in:

- `shared_assets/logo.png`
- `shared_assets/logo_full.png`

Runtime copies used by the app live in:

- `desktop-app/public/logo.png`
- `desktop-app/public/logo_full.png`
- `desktop-app/resources/icons/icon.icns`

## Notes for macOS

Gestivo needs camera and microphone access. If access was previously denied, re-enable it in:

- `System Settings -> Privacy & Security -> Camera`
- `System Settings -> Privacy & Security -> Microphone`

Then restart the app.

For branding behavior on macOS:

- In `npm run dev`, some OS-level surfaces may still show `Electron`, because the development host app is Electron itself.
- The packaged app bundle created by `npm run dist:mac` uses the Gestivo name and icon correctly.

## Unsigned Builds

Current downloadable builds should be treated as unsigned preview builds.

That means:

- macOS may warn that the app is from an unidentified developer
- Windows may show SmartScreen or installer warnings
- this is expected until code signing and notarization are added

For personal use or limited sharing, this is acceptable. For broader public distribution, signing should be added later.

## Architecture Notes

The renderer has been refactored so the top-level app stays relatively small:

- `src/app/App.tsx`: high-level composition and store wiring
- `src/app/components/AppHeader.tsx`: hero/header section
- `src/app/components/SettingsScreen.tsx`: settings UI
- `src/app/components/StudioDashboard.tsx`: main studio UI
- `src/app/hooks/useStudioSession.ts`: media, audio, recording orchestration
- `src/app/hooks/useGestureTracking.ts`: detector lifecycle and frame updates
- `src/app/hooks/useGestureRouter.ts`: gesture event dispatch and action application
- `src/app/hooks/usePersistedPreferences.ts`: load/save preference lifecycle

## Recording Behavior

Gestivo records processed audio, not raw microphone input.

Supported modes today:

- `Audio Only`
- `Video + Audio`

Current output format:

- `WebM`

## Roadmap

Likely next areas of improvement:

- Expand the audio effect chain beyond filter/gain primitives
- Add more gesture profiles and richer mapping presets
- Improve export and packaging for broader distribution
- Add signing and notarization for smoother installs
- Reduce renderer bundle size through code-splitting
