# FactoryVerse Expert XR
### Industrial Work Instruction & Spatial Training Platform
**Built with Meta Immersive Web SDK (IWSDK) & Three.js for the Meta VR Start Developer Competition 2026**
*Track: Productivity | Hands-First WebXR Experience*

---

> 📖 **Panduan Pengembangan Lengkap (End-to-End Master Guide):**  
> Baca [docs/MASTER-GUIDE.md](file:///c:/Users/PERSON/factoryverse/docs/MASTER-GUIDE.md) untuk tutorial langkah-demi-langkah membangun proyek ini dari nol sampai akhir.

## 🚀 Overview

**FactoryVerse Expert XR** is a comprehensive, production-grade industrial work instruction and spatial training platform inspired by enterprise solutions like **PTC Vuforia Expert Capture**, purpose-built for the **Meta Quest 3 / Quest 2 / Quest Pro** and modern desktop browsers via WebXR and Web Standards.

It bridges the divide between frontline factory technicians and engineering knowledge by uniting:
1. **FactoryVerse Studio (Web Authoring):** A desktop authoring and engineering suite for standard operating procedures (SOPs), 3D CAD/model inspection, live expert video capture, dimensional tolerance verification, and audit sign-off (CFR 21 Part 11).
2. **FactoryVerse XR Player (WebXR Training):** A hands-first, seated virtual reality training workstation built on **Meta IWSDK (v1.1.0-rc.2)** and `@iwsdk/core`. Operators execute guided mechanical assemblies using natural hand tracking (pinch-grab, proximity mating, snap-seating), floating Spatial UIKitML panels, and hands-free voice commands.

---

## ⚡ PTC Vuforia Feature Parity & Comparison

FactoryVerse Expert XR delivers full functional parity with the enterprise PTC Vuforia ecosystem while leveraging modern open-web standards (WebXR, Three.js, ECS) without proprietary vendor lock-in:

| Feature Dimension | PTC Vuforia Suite (Capture / Studio / Vantage) | FactoryVerse Expert XR (IWSDK + WebXR) |
|---|---|---|
| **Authoring Environment** | Vuforia Studio (Desktop Electron / Web) | **FactoryVerse Studio** (Reactive Web App, Visual Step Builder, Reordering) |
| **Knowledge Capture** | Vuforia Expert Capture (RealWear / HoloLens / Mobile) | **Expert Capture Workspace** (`getUserMedia` live camera/mic recording + 1-click SOP conversion) |
| **Operator Execution** | Vuforia Vantage (HoloLens 2 / Mobile AR) | **FactoryVerse XR Player** (Meta Quest WebXR, IWER emulation, Seated 90° FOV) |
| **Interaction Model** | Gaze & Air-Tap (HoloLens) or Hand Pinch | **Hands-First Proximity Grab & Snap** (IWSDK `@iwsdk/core` Hand Tracking + Ray fallback) |
| **Hands-Free Control** | Proprietary Voice Engine | **Web Speech API Voice Service** ("Next", "Back", "Reset", "Pass", "Fail") |
| **3D Spatial Guidance** | Location Wayfinding Pins (Spatial Beacons) | **3D Animated Spatial Wayfinding Beacon** (Bobbing laser cone & target halo) |
| **Model Target Alignment** | Vuforia Engine Model Target "Guide View" | **CAD Model Target Guide View** (Holographic wireframe contour & optical alignment reticle) |
| **Asset & Code Recognition** | Vuforia Engine Barcode Scanner / VuMarks | **Industrial Barcode & VuMark Service** (Live camera scanner, equipment registry, 1-click SOP launch) |
| **Quality Verification** | Visual Checkpoint Inspection | **Integrated Tolerance Engine** (Pass/Fail mathematical validation: 24.00 ± 0.10 mm) |
| **Compliance & Sign-off** | PTC Windchill / ThingWorx E-Signature | **Supervisor E-Signature Modal** (SHA-256 cryptographic audit seal & CFR 21 Part 11) |
| **CAD / Model Support** | Creo CAD / Step / GLTF converter | **Procedural Three.js Workstation + Custom Drag-and-Drop GLTF/GLB Loader** |
| **Deployment Model** | On-premise or PTC Cloud subscription | **100% Zero-Install Web URL (PWA / WebXR)** or Meta Horizon Store TWA |

---

## 🛠️ System Architecture

```
                  ┌─────────────────────────────────────────────────────────────┐
                  │                 FactoryVerse Studio (Web)                   │
                  │  Visual Editor · Expert Capture · CAD Library · QA Reports │
                  └──────────────┬───────────────────────────────▲──────────────┘
                                 │                               │
                                 │ Procedure Data (SOP-HYD-042)  │ Session Telemetry
                                 ▼                               │
┌────────────────────────────────────────────────────────────────┴─────────────────────────────┐
│                          FactoryVerse XR Player (Meta IWSDK Runtime)                          │
├──────────────────────────────┬───────────────────────────────┬───────────────────────────────┤
│    AssemblySystem (ECS)      │    XRTrainingSystem (ECS)     │   VoiceCommandService         │
│  - Proximity Snapping        │  - Spatial UIKitML Panels     │  - Web Speech Hands-Free      │
│  - Spatial Waypoint Beacon   │  - 3-Column Instruction Deck  │  - "Next", "Back", "Pass"     │
│  - Dynamic Physics Seating   │  - Dimensional Gauges         │  - Live Audio Transcription   │
├──────────────────────────────┴───────────────────────────────┴───────────────────────────────┤
│                                      Core Engine Layer                                       │
│  - TrainingEngine (5-Step SOP State Machine)                 - LocalStorage & Supabase Adapt │
│  - InspectionEngine (Pass/Fail Tolerance Calculator)         - Procedural Three.js CAD Mesh  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Directory Structure

```
factoryverse/
├── iwsdk.config.json           # Authority: Scene, assets, components, XR features
├── vite.config.ts              # Vite + IWSDK development plugin
├── vitest.config.ts            # Isolated test runner configuration
├── index.html                  # Dual-view DOM container (Studio + XR Player)
├── src/
│   ├── index.ts                # App entry: World.create() + ECS registration
│   ├── assets.ts               # Shared runtime/editor asset manifest
│   ├── components.ts           # System-free ECS component definitions
│   ├── types/                  # Strict TypeScript domain interfaces
│   ├── storage/                # Repository pattern (LocalStorage + Supabase)
│   ├── inspection/             # Tolerancing engine & math validation
│   ├── training/               # SOP state machine & scoring engine
│   ├── scene-assets/           # Procedural Three.js 3D workstation & parts
│   ├── studio/                 # FactoryVerse Studio (Desktop authoring suite)
│   │   ├── StudioApp.ts        # SPA controller & XR mode router
│   │   ├── styles/studio.css   # Industrial dark slate design system
│   │   └── views/              # Studio views (Editor, Capture, CAD, QA, Reports)
│   └── xr/                     # Meta IWSDK WebXR ECS systems
│       ├── assembly-system.ts  # Proximity snapping & spatial beacon tracking
│       ├── xr-training-system.ts# Spatial UIKitML UI bindings
│       └── voice-command-service.ts# Hands-free Web Speech API service
├── public/
│   ├── scenes/
│   │   └── main.iwsdk.scene.json # Composed 3D scene manifest
│   └── ui/                     # Spatial UIKitML layout files (.uikitml)
├── docs/                       # Comprehensive competition documentation
└── supabase/                   # Optional cloud schema with Row Level Security
```

---

## 🏃 Getting Started

### Prerequisites
- **Node.js**: v20.19+ (or Node 22+)
- **NPM**: v10+
- **Browser**: Google Chrome / Microsoft Edge with WebXR support, or **Meta Quest Browser** on Quest 3 / Quest 2 / Quest Pro.

### 1. Installation
```bash
git clone <repository-url>
cd factoryverse
npm install
```

### 2. Run Automated Verification Tests
Run the standalone Vitest unit test suite (15/15 tests passing):
```bash
npm test
```

### 3. Check TypeScript Types
```bash
npx tsc --noEmit
```

### 4. Launch Local Development Server
```bash
npm run dev
```
Open **`https://localhost:8081`** in your browser. (Accept the self-signed local certificate when prompted).

---

## 🥽 Meta Quest & XR Testing

### On Desktop (Meta Immersive Web Emulator - IWER)
1. Install the official **Meta Immersive Web Emulator** Chrome extension.
2. In the emulator settings, select **Meta Quest 3**.
3. Open `https://localhost:8081`.
4. Click **"Launch XR Workstation"** in FactoryVerse Studio.
5. In XR mode, use the bottom navigation helper bar to test voice commands, trigger tolerance simulations, or reset the assembly fixture.

### On Physical Meta Quest (100% Wireless WebXR)
1. Connect your Meta Quest headset to the same Wi-Fi network as your workstation.
2. Ensure the dev server is bound to all interfaces (`--host 0.0.0.0`).
3. In Meta Quest Browser, navigate to `https://<YOUR_LOCAL_IP>:8081`.
4. Click **Enter VR / Launch XR**.
5. Put away controllers and use your natural hands to grab parts, seat the piston rod, and inspect the clearance.

---

## 📋 Competition Alignment & Originality

- **Competition:** Meta VR Start Developer Competition 2026
- **Track:** Productivity (Enterprise Spatial Training & Work Instructions)
- **SDK:** Meta Immersive Web SDK (IWSDK v1.1.0-rc.2 via `@iwsdk/core`)
- **Originality:** 100% original code, procedural Three.js geometry, original CSS design system, and custom UIKitML spatial panels. Zero proprietary PTC Vuforia code, reverse engineering, or copyrighted assets.
- **Licensing:** MIT License.
