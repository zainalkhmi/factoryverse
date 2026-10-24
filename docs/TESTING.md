# FactoryVerse Expert XR — Testing & Quality Assurance
**Meta VR Start Developer Competition 2026 · Productivity Track**

---

## 1. Testing Strategy

FactoryVerse Expert XR uses a multi-tiered testing strategy spanning automated unit tests, desktop browser emulation (IWER), and physical Meta Quest headset verification.

```
+-------------------------------------------------------------------------+
| Level 3: Physical Quest 3 Headset Verification (Wireless WebXR)         |
+-------------------------------------------------------------------------+
| Level 2: Desktop Meta Immersive Web Emulator (IWER) (Synthetic Hands)   |
+-------------------------------------------------------------------------+
| Level 1: Automated Vitest Unit Test Suite (15/15 tests passing)         |
+-------------------------------------------------------------------------+
```

---

## 2. Automated Unit Tests (Vitest)

Unit testing runs independently of the browser DOM and 3D rendering context, verifying core mathematical algorithms and workflow state machines.

### Running Unit Tests
```bash
npm test
```

### Test Suite Results
```
 ✓ src/inspection/inspection-engine.test.ts (9 tests)
   ✓ should pass exact nominal value (24.00 mm)
   ✓ should pass lower boundary (23.90 mm)
   ✓ should pass upper boundary (24.10 mm)
   ✓ should pass in-range value (24.05 mm)
   ✓ should fail value below lower boundary (23.85 mm)
   ✓ should fail value above upper boundary (24.15 mm)
   ✓ should handle string input correctly
   ✓ should fail invalid non-numeric string
   ✓ should handle custom tolerances correctly

 ✓ src/training/training-engine.test.ts (6 tests)
   ✓ should initialize with step 1 and zero score
   ✓ should advance through assembly steps on valid actions
   ✓ should correctly record dimensional measurement
   ✓ should reject out-of-tolerance measurement and penalize score
   ✓ should calculate final training score including bonuses
   ✓ should reset training session cleanly

 Test Files  2 passed (2)
      Tests  15 passed (15)
   Duration  1.08s
```

---

## 3. Desktop Emulation with Meta Immersive Web Emulator (IWER)

For developers without physical hardware or during rapid iteration, the official **Meta Immersive Web Emulator (IWER)** Chrome extension provides complete simulated hand tracking and 6DoF head tracking.

### Emulation Configuration
1. Install **Meta Immersive Web Emulator** from the Chrome Web Store.
2. In the emulator settings panel:
   - Target Device: **Meta Quest 3**
   - Controllers: **Simulated Hands**
   - Field of View: **110° diagonal**
3. Start the dev server: `npm run dev`
4. Open `https://localhost:8081` in Chrome.
5. In FactoryVerse Studio, click **"Launch XR Workstation"**.
6. Click the WebXR prompt: **"Enter VR"**.
7. In the desktop viewport, use the bottom helper navigation bar to:
   - Toggle **Voice Commands** (Microphone speech recognition)
   - Simulate **Pass Measurement** (24.02 mm)
   - Simulate **Fail Measurement** (24.18 mm)
   - Reset parts fixture

---

## 4. Physical Meta Quest Verification Protocol

To verify FactoryVerse on physical hardware (Meta Quest 3, Meta Quest 2, Meta Quest Pro):

### Step-by-Step Headset Workflow
1. **Network Connectivity:** Ensure your Meta Quest headset is on the same local Wi-Fi network as your host workstation.
2. **Start Dev Server:**
   ```bash
   npx vite --port 8081 --host 0.0.0.0
   ```
3. **Open Meta Quest Browser:**
   - Launch the pre-installed **Meta Quest Browser** inside the headset.
   - Navigate to: `https://<WORKSTATION_IP>:8081` (e.g. `https://192.168.1.100:8081`).
   - Accept the expected self-signed certificate warning for the local development server.
4. **Enter VR:**
   - Tap **"Launch XR Workstation"** on the touchscreen, then tap the Meta WebXR **"Enter VR"** button.
5. **Hands-First Interaction Verification:**
   - **Put away controllers.** Meta Quest hand tracking activates automatically.
   - Look at the parts tray on the right side of the industrial workbench.
   - Pinch your index finger and thumb to grab the **Hard-Chrome Piston Rod**.
   - Bring the rod toward the open bore of the **Cylinder Barrel**.
   - Observe the **Spatial Wayfinding Beacon** hovering above the bore.
   - Release your pinch within 35 cm of the bore to trigger the proximity snap seating.
   - Next, pinch the **Threaded Gland End Cap** and mate it to the cylinder barrel spigot.
   - Use the **Spatial Inspection Panel** to verify the 24.00 mm datum dimension.
   - Speak **"Pass"** or tap the panel to submit the quality verification.
   - Review your final Score Report panel and supervisor certification seal.
