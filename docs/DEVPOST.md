# FactoryVerse Expert XR — Devpost Submission
**Meta VR Start Developer Competition 2026**
*Track: Productivity | Built with Meta Immersive Web SDK (IWSDK)*

---

### Project Title
**FactoryVerse Expert XR — Industrial Work Instruction & Spatial Training Platform**

### Tagline
An enterprise-grade, hands-first WebXR training platform bringing PTC Vuforia Expert Capture capabilities to Meta Quest via the Meta Immersive Web SDK.

---

### 1. Inspiration
Modern manufacturing facilities face an escalating talent crisis: skilled master machinists and senior assembly technicians are retiring, while onboarding new operators using static 200-page paper binders takes weeks and produces high defect rates.

Enterprise solutions like PTC Vuforia Expert Capture demonstrated that augmented reality and step-by-step spatial instructions dramatically accelerate training and reduce errors. However, legacy enterprise XR tools require expensive proprietary licenses, complex CAD conversion pipelines, and heavy native headsets.

We asked: **What if an industrial enterprise could author, capture, simulate, and certify shop-floor procedures entirely on the open web — accessible instantly on Meta Quest with zero downloads?**

That vision is **FactoryVerse Expert XR**.

---

### 2. What it does
FactoryVerse Expert XR is a complete, dual-layer industrial training system:

1. **FactoryVerse Studio (Web Authoring Suite):**
   - **Visual Procedure Editor:** A 3-column drag-and-drop authoring environment for creating Standard Operating Procedures (SOPs), defining interaction gates, and configuring tolerance rules.
   - **Expert Capture Workspace:** Allows veteran engineers to record physical machine demonstrations using live camera and microphone, convert recordings to SOP step drafts in one click, and attach media annotations.
   - **3D CAD Model Library:** High-precision CAD component inspector with exploded assembly views and custom GLTF/GLB drag-and-drop uploading.
   - **Quality Inspection Lab:** Interactive tolerance calculator with pass/fail boundaries.
   - **Session Reports & Audit Trail:** CFR 21 Part 11 compliant digital records with supervisor electronic signatures and SHA-256 cryptographic audit seals.

2. **FactoryVerse XR Player (Meta Quest WebXR):**
   - **Hands-First Mechanical Assembly:** Operators sit at a realistic industrial workbench and assemble hydraulic cylinder components (piston rod, barrel bore, gland end cap) using natural hand tracking (pinch and proximity snap).
   - **Spatial Wayfinding Beacon:** An animated 3D guide pin with laser cone and target halo floats above the active part, guiding the operator's attention through complex 3D assemblies.
   - **Spatial UIKitML Panels:** Floating Horizon-styled industrial UI panels displaying step instructions, safety warnings, and live feedback.
   - **Hands-Free Voice Commands:** Operators can keep their hands dirty while speaking commands ("Next", "Previous", "Reset", "Pass", "Fail") via integrated Web Speech recognition.

---

### 3. How we built it
- **Meta Immersive Web SDK (IWSDK v1.1.0-rc.2):** Used `@iwsdk/core` for WebXR session management, hand tracking integration, Spatial UIKitML rendering, and entity-component-system (ECS) architecture.
- **Three.js Procedural 3D Modeling:** High-fidelity, deterministic procedural geometry for an industrial workstation, cylinder barrel, chrome piston rod, polyurethane seal ring, and threaded brass gland cap.
- **TypeScript & Vite:** Strict typed codebase with modular systems, clean separation of concerns, and rapid HMR.
- **State Machine & Tolerancing Engine:** Custom standalone training state machine and dimensional validation algorithms (`24.00 ± 0.10 mm`), thoroughly covered by automated Vitest unit tests (15/15 passing).
- **Web Speech API:** Built an integrated voice command recognition service enabling hands-free navigation.
- **Repository Architecture:** Dual persistence adapters supporting offline LocalStorage with rich industrial seed data and Supabase PostgreSQL with Row-Level Security.

---

### 4. Challenges we ran into
1. **Hands-First Proximity Snapping in ECS:** Industrial assembly requires precise feedback when parts mate. We designed a dual-distance proximity detection loop in `AssemblySystem` that computes Euclidean distance in world coordinates and provides magnetic snap seating when ungrabbed within 35 cm.
2. **Deterministic Multi-Realm Asset Catalog:** In IWSDK, asset manifests are evaluated in both the application runtime and editor realms. We structured all 3D procedural assets as pure, parentless Three.js Object3D factories without DOM or window dependencies.
3. **Spatial UI Typography & Atlas Rendering:** IWSDK's Spatial UIKitML MSDF text renderer uses a standard ASCII glyph atlas. Non-ASCII unicode symbols triggered glyph warnings; we normalized all typographic markers to clean industrial ASCII notation while preserving rich visual polish.

---

### 5. Accomplishments that we're proud of
- **True PTC Vuforia Parity on the Open Web:** Full lifecycle coverage — from video capture to SOP authoring, 3D CAD inspection, hands-first Quest training, and CFR 21 Part 11 electronic supervisor sign-off.
- **Zero-Controller Operation:** The entire WebXR training flow can be completed 100% hands-first, using pinch-to-grab or hands-free voice commands.
- **100% Original Code & Geometry:** All 3D assets, styles, and logic were created from scratch for this competition. Zero proprietary or third-party assets.
- **Automated QA Coverage:** 15/15 unit tests passing with full test isolation.

---

### 6. What we learned
- The Meta Immersive Web SDK unlocks incredible performance and developer velocity for WebXR on Meta Quest.
- Building for frontline industrial workers requires forgiving interaction design: combining visual 3D wayfinding beacons, proximity-based magnetic snapping, and voice commands creates an accessible experience for novice operators.

---

### 7. What's next for FactoryVerse Expert XR
- Multi-user WebXR collaborative training (supervisor and trainee in the same shared virtual workstation).
- Real-time IoT sensor telemetry integration via WebSockets to reflect live torque and pressure sensor readings on virtual fixtures.
