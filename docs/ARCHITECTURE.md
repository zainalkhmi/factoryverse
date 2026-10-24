# FactoryVerse Expert XR — Technical Architecture
**Meta VR Start Developer Competition 2026 · Productivity Track**

---

## 1. Architectural Philosophy

FactoryVerse Expert XR addresses the central bottleneck of industrial XR adoption: **the authoring-to-execution disconnect**. Traditional enterprise solutions require heavy desktop authoring suites and separate proprietary runtime binaries. 

FactoryVerse eliminates this barrier through a **Dual-Layer Architecture** delivered entirely across modern Web standards:
- **Presentation & Engineering Layer (FactoryVerse Studio):** Zero-install, high-density desktop web interface for procedure authoring, webcam-based expert recording, CAD analysis, quality inspection, and audit compliance.
- **Spatial Execution Layer (FactoryVerse XR Player):** Seated, immersive WebXR application built on the **Meta Immersive Web SDK (IWSDK v1.1.0-rc.2)**, rendering high-fidelity Three.js procedural geometry and floating Spatial UIKitML panels.

Both layers share a unified TypeScript domain model and persistence repository, enabling real-time authoring, rapid testing, and immediate shop-floor deployment.

---

## 2. System Architecture Diagram

```
+-----------------------------------------------------------------------------------------+
|                                FACTORYVERSE STUDIO (WEB)                                |
|  - DashboardView (KPIs, Pass Rate)        - VisualProcedureEditorView (3-Column Author) |
|  - CaptureWorkspaceView (Webcam/Audio)    - ModelLibraryView (Exploded CAD Inspector)   |
|  - QualityInspectionView (Tolerance Lab)  - SessionReportsView (CFR 21 E-Signatures)    |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                    DATA & DOMAIN LAYER                                  |
|  - Types: Procedure, ProcedureRevision, ProcedureStep, InspectionRule, TrainingSession |
|  - StorageRepository: LocalStorageRepository (with seed data) + SupabaseCloudAdapter   |
|  - InspectionEngine: 24.00 mm +/- 0.10 mm mathematical validation with deviation calc  |
|  - TrainingEngine: 5-step SOP state machine with error tracking and duration metrics   |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                        FACTORYVERSE XR PLAYER (META IWSDK RUNTIME)                      |
|                                                                                         |
|  +---------------------------+  +---------------------------+  +----------------------+ |
|  |   AssemblySystem (ECS)    |  |  XRTrainingSystem (ECS)   |  | VoiceCommandService  | |
|  | - Proximity grab & snap   |  | - Spatial UIKitML panels  |  | - Web Speech API     | |
|  | - Spatial Wayfinding Pin  |  | - Step synchronization    |  | - Hands-free speech  | |
|  | - Snapping threshold: 35cm|  | - Button event delegation |  | - "Next", "Pass"    | |
|  +---------------------------+  +---------------------------+  +----------------------+ |
|                                                                                         |
|  +------------------------------------------------------------------------------------+ |
|  |                           Three.js Scene Graph & Geometry                          | |
|  | - Industrial Bench (2.4m x 1.2m)       - Cylinder Barrel Bore & Port Bosses        | |
|  | - Hard-Chrome Piston Rod & Head        - Polyurethane U-Cup Seal Ring              | |
|  | - Threaded Brass Gland End Cap         - 24.00mm Datum Inspection Caliper Feature  | |
|  +------------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Core Subsystems

### 3.1 Training Engine & State Machine (`src/training/training-engine.ts`)
The `TrainingEngine` governs the operator's progression through standard operating procedures (SOPs). It manages:
- **5-Step Standard Assembly Lifecycle:**
  1. `step-01`: Component Identification (Safety check & parts verification)
  2. `step-02`: Piston Rod Insertion (Pinch-grab & cylindrical bore snap)
  3. `step-03`: Gland End Cap Seating (Threaded mating to barrel flange)
  4. `step-04`: Dimensional Tolerance Verification (Datum measurement against rule)
  5. `step-05`: Supervisor Audit & Sign-off (CFR 21 Part 11 certification)
- **Scoring Algorithm:**
  - Base Score: 100 points
  - Step Completion: 15 points per step (max 75 points)
  - Time Bonus: 10 points for completing assembly within estimated time
  - First-Time Quality Bonus: 15 points if dimensional measurement passes on first attempt
  - Error Penalty: -10 points per assembly or measurement failure

### 3.2 Inspection & Tolerancing Engine (`src/inspection/inspection-engine.ts`)
The `InspectionEngine` handles quantitative quality gates. For the hydraulic cylinder assembly (`SOP-HYD-042`), the critical dimensional tolerance is:
- **Nominal Seating Gap:** `24.00 mm`
- **Allowable Tolerance:** `±0.10 mm` (Valid range: `23.90 mm` to `24.10 mm`)
- The engine calculates numerical deviation, generates human-readable diagnostic messages, and tags results with ISO 9001 quality status (`PASS` or `FAIL`).

### 3.3 Meta IWSDK ECS Architecture (`src/xr/`)
IWSDK is an Entity-Component-System framework built on Three.js:
1. **`AssemblySystem`**:
   - Queries entities with `[AssemblyPart]` and `[Grabbed]`.
   - Computes Euclidean distance between parts and target fixture coordinates.
   - Snaps components into seated alignment when distance falls below `0.35m`.
   - Dynamically positions the animated **Spatial Wayfinding Beacon** above active components.
2. **`XRTrainingSystem`**:
   - Connects spatial UIKitML documents (`training-panel.uikitml`, `inspection-panel.uikitml`, `score-panel.uikitml`) to the `TrainingEngine`.
   - Listens to ray clicks and pinch selections from WebXR hands.
3. **`VoiceCommandService`**:
   - Continuous hands-free voice recognition via the browser Web Speech API.
   - Maps vocal utterances ("next", "previous", "reset", "pass", "fail") directly to training state transitions.

### 3.4 Storage & Compliance Layer (`src/storage/`)
- Implements the Repository Pattern via `IStorageRepository`.
- **LocalStorageRepository:** Synchronous, offline-first persistence with complete seed data for zero-config offline execution.
- **SupabaseCloudAdapter:** Asynchronous REST client supporting enterprise cloud sync, PostgreSQL persistence, and Row-Level Security (RLS).
- **CFR 21 Part 11 Supervisor Approval:** Records digital supervisor sign-offs with role, date, comments, and a 64-character SHA-256 cryptographic audit seal.
