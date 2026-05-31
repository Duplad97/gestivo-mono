# Gestivo

Gestivo is a desktop creative tool for gesture-controlled audio processing.

It combines a live webcam stage, MediaPipe-based hand tracking, a real-time Web Audio chain, configurable gesture routing, and local recording so sound can be shaped through hand movement instead of only traditional controls.

## Current State

The repository currently contains one application target:

- `desktop-app`: Electron + React + TypeScript desktop app

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

## Packaging

The project currently includes a macOS packaging path.

```bash
cd desktop-app
npm run dist:mac
```

Generated release artifacts are written to:

- `desktop-app/release/`

These files are generated output and are ignored by Git.

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
