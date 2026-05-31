# Project Overview

This project is a desktop application built with Electron, React, and TypeScript.

The application allows users to:

- Record audio and/or video from their microphone and webcam
- Apply real-time audio effects controlled by hand gestures
- Analyze webcam input using computer vision
- Detect hand positions and gestures
- Modify audio processing parameters based on detected gestures
- Save recordings locally

The primary goal is to create an experimental creative tool where users can manipulate audio effects through natural hand movements captured by a webcam.

---

# Core Features

## Video Input

The application should:

- Access the user's webcam
- Display a live webcam preview
- Process video frames in real-time
- Detect hands and hand landmarks
- Detect predefined gestures

Implementation target:

- MediaPipe Hand Landmarker

Examples of supported gestures:

- Closed fist
- Open hand
- Pinch gesture
- Thumbs up
- Custom gesture combinations

---

## Audio Input

The application should:

- Access the user's microphone
- Process audio in real-time
- Apply audio effects dynamically
- Allow effect parameters to be controlled by gestures

Examples:

- Pitch shift
- Robot voice
- Reverb
- Delay
- Low-pass filter
- High-pass filter
- Distortion

Implementation target:

- Web Audio API
- AudioWorklets where necessary

---

## Recording

The application should support:

### Audio Only Recording

Input:
- Microphone
- Processed audio output

Output:
- WAV
- MP3 (future)

### Video Recording

Input:
- Webcam video
- Processed audio

Output:
- WebM
- MP4 (future)

The recorded file should contain the processed audio, not the raw microphone input.

---

# Technical Stack

## Desktop Framework

- Electron

## Frontend

- React
- TypeScript
- Vite

## State Management

Preferred:

- Zustand

Avoid:

- Redux unless clearly necessary

## Styling

- Material UI (MUI) as UI library
- Dark and Light theme modes
- Clean and modern design


## Computer Vision

- MediaPipe Hand Landmarker

## Audio Processing

- Web Audio API
- AudioWorklets

## Recording

- MediaRecorder API

## File Storage

Electron filesystem APIs

---

# Architecture

## Electron Main Process

Responsibilities:

- Window creation
- File system access
- Exporting recordings
- Native integrations

Should NOT:

- Contain business logic
- Perform audio processing
- Perform hand tracking

---

## Renderer Process

Responsibilities:

- React UI
- Webcam preview
- MediaPipe integration
- Audio processing
- Gesture mapping
- Recording controls

Most application logic should live here.

---

# Gesture Mapping System

Gestures should be configurable.

Example:

```ts
{
  gesture: "fist",
  action: "togglePitchShift"
}
```

```ts
{
  gesture: "pinch",
  action: "setReverbAmount",
  value: normalizedPinchDistance
}
```

Gesture detection should be separated from effect logic.

Use a mapping layer:

Gesture Detector
↓
Gesture Event
↓
Gesture Mapper
↓
Audio Effect Controller
```

---

# Audio Engine Design

The audio system should be modular.

Example:

```text
Microphone
↓
Input Node
↓
Effect Chain
├─ Pitch Shift
├─ Reverb
├─ Delay
├─ Distortion
↓
Output
↓
Recorder
```

Each effect should:

- Have its own module
- Expose configurable parameters
- Be independently enabled/disabled

Example:

```ts
interface AudioEffect {
  enable(): void;
  disable(): void;
  setParameter(name: string, value: number): void;
}
```

---

# Project Structure

The project will use monorepo structure for desktop and mobile apps, and landing page.
The first target is the desktop app which uses the ```desktop-app``` directory with the following structure:
```text
src/
├── app/
├── components/
├── features/
│   ├── camera/
│   ├── gestures/
│   ├── audio/
│   ├── recording/
│   └── settings/
├── hooks/
├── services/
├── stores/
├── types/
├── utils/
└── pages/
```

---

# Coding Guidelines

## TypeScript

- Use strict mode
- Avoid `any`
- Prefer explicit types

Good:

```ts
const landmarks: HandLandmark[] = [];
```

Bad:

```ts
const landmarks: any = [];
```

---

## React

Use:

- Functional components
- Custom hooks
- Composition

Avoid:

- Class components

---

## State Management

Global state only for:

- Recording status
- Settings
- Active effects
- Gesture mappings

Keep local UI state inside components.

---

# Performance Requirements

The application is real-time.

Priorities:

1. Audio stability
2. Low audio latency
3. Smooth gesture tracking
4. UI responsiveness

Avoid:

- Unnecessary re-renders
- Heavy processing inside React components
- Expensive computations on every frame

Use:

- requestAnimationFrame
- Web Workers when appropriate
- Memoization when useful

---

# Future Features

Potential future additions:

- Multiple gesture profiles
- MIDI controller support
- AI gesture training
- AI voice effects
- Custom gesture creation
- Recording timeline editor
- OBS integration
- Streaming mode
- Multi-camera support
- Audio effect presets
- Community preset sharing

---

# Development Philosophy

Focus on:

- Fast iteration
- Simple architecture
- Modular design
- Low latency
- Real-time interaction

Build an MVP first.

Do not over-engineer.

Prioritize working gesture-controlled audio effects before advanced features.
