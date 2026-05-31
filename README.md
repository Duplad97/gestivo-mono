# Gestivo

Gestivo is an experimental desktop application for gesture-controlled audio effects.

The project combines webcam input, real-time audio processing, and gesture mapping so users can manipulate sound through natural hand movement. The current focus is the desktop application MVP.

## Status

The repository is organized as a monorepo and currently contains the first application target:

- `desktop-app`: Electron + React + TypeScript desktop app

The current MVP foundation includes:

- Electron main/preload process setup
- React renderer app with Material UI
- Webcam preview
- Microphone input and real-time audio chain
- Basic audio controls for low-pass, high-pass, and gain
- Audio/video recording pipeline with Electron save dialog
- Gesture module scaffolding for later MediaPipe integration

## Vision

Gestivo is intended to support:

- Webcam-based hand tracking
- Gesture recognition with MediaPipe Hand Landmarker
- Real-time effect control through gesture mappings
- Audio-only and video recordings with processed audio
- Modular audio effects and configurable gesture profiles

## Tech Stack

- Electron
- React
- TypeScript
- Vite
- Zustand
- Material UI
- Web Audio API
- MediaRecorder API

## Repository Structure

```text
.
├── AI_CONTEXT.md
├── README.md
└── desktop-app/
```

Planned renderer structure inside `desktop-app/src`:

```text
src/
├── app/
├── components/
├── features/
│   ├── audio/
│   ├── camera/
│   ├── gestures/
│   ├── recording/
│   └── settings/
├── hooks/
├── pages/
├── services/
├── stores/
├── types/
└── utils/
```

## Getting Started

### Requirements

- Node.js 20+
- npm 10+
- macOS, Windows, or Linux

### Run the desktop app

```bash
cd desktop-app
npm install
npm run dev
```

### Validate the project

```bash
cd desktop-app
npm run typecheck
npm run build
```

## Notes for macOS

The app needs camera and microphone access. If access was previously denied, re-enable it in:

- System Settings -> Privacy & Security -> Camera
- System Settings -> Privacy & Security -> Microphone

Then restart the app.

## Roadmap

Near-term priorities:

- Integrate MediaPipe Hand Landmarker
- Convert gesture events into effect parameter changes
- Expand the audio effect chain
- Improve export formats and recording options
- Add settings and gesture mapping UI
