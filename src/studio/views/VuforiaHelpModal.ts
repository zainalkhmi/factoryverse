/**
 * FactoryVerse Studio - Vuforia Studio & AR Experience Help Guide Modal
 * Comprehensive, interactive English guide explaining how to author, run, and deploy
 * Vuforia AR & WebXR experiences on Desktop, Mobile, and Meta Quest 3 headsets.
 */

export interface VuforiaHelpModalOptions {
  initialTab?: 'run_ar' | 'quest' | 'targets' | 'iot' | 'shortcuts';
  onLaunchAR?: () => void;
  onClose?: () => void;
}

export function openVuforiaHelpModal(options: VuforiaHelpModalOptions = {}): void {
  const existing = document.getElementById('vf-help-modal');
  if (existing) existing.remove();

  let activeTab = options.initialTab || 'run_ar';
  let copiedToast = false;

  const modal = document.createElement('div');
  modal.id = 'vf-help-modal';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background-color: rgba(3, 7, 18, 0.92);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: var(--font-sans, system-ui, sans-serif);
    color: #fff;
    backdrop-filter: blur(8px);
    animation: vfFadeIn 0.2s ease;
  `;

  const hostIp = typeof window !== 'undefined' ? window.location.hostname : '192.168.100.40';
  const port = typeof window !== 'undefined' ? window.location.port || '8081' : '8081';
  const questUrl = `https://${hostIp}:${port}/#vuforia`;

  const renderModal = () => {
    modal.innerHTML = `
      <div style="max-width: 840px; width: 100%; max-height: 90vh; background: #09111c; border: 1px solid #1e3a5f; border-radius: 12px; box-shadow: 0 25px 60px rgba(0,0,0,0.85); overflow: hidden; display: flex; flex-direction: column;">
        
        <!-- Header -->
        <div style="padding: 16px 20px; background: #0c182a; border-bottom: 1px solid #1e3a5f; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #0284c7, #38bdf8); display: flex; align-items: center; justify-content: center; font-size: 20px;">
              📖
            </div>
            <div>
              <div style="font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px;">
                Vuforia Studio & AR Experience Guide
                <span style="font-size: 10px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 7px; border-radius: 10px; text-transform: uppercase; font-weight: 700;">
                  v1.2 Online
                </span>
              </div>
              <div style="font-size: 11px; color: #94a3b8;">
                Step-by-step instructions for running, testing, and deploying industrial AR experiences
              </div>
            </div>
          </div>
          <button id="vf-help-btn-close" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 4px;" title="Close Guide (Esc)">✕</button>
        </div>

        <!-- Navigation Tabs -->
        <div style="display: flex; border-bottom: 1px solid #1e3a5f; background: #070d16; padding: 0 16px;">
          <button class="vf-help-tab-btn ${activeTab === 'run_ar' ? 'active' : ''}" data-tab="run_ar" style="padding: 10px 14px; background: none; border: none; border-bottom: 2px solid ${activeTab === 'run_ar' ? '#38bdf8' : 'transparent'}; color: ${activeTab === 'run_ar' ? '#38bdf8' : '#94a3b8'}; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>👓</span> How to Run AR
          </button>
          <button class="vf-help-tab-btn ${activeTab === 'quest' ? 'active' : ''}" data-tab="quest" style="padding: 10px 14px; background: none; border: none; border-bottom: 2px solid ${activeTab === 'quest' ? '#38bdf8' : 'transparent'}; color: ${activeTab === 'quest' ? '#38bdf8' : '#94a3b8'}; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>🥽</span> Meta Quest 3 & WebXR
          </button>
          <button class="vf-help-tab-btn ${activeTab === 'targets' ? 'active' : ''}" data-tab="targets" style="padding: 10px 14px; background: none; border: none; border-bottom: 2px solid ${activeTab === 'targets' ? '#38bdf8' : 'transparent'}; color: ${activeTab === 'targets' ? '#38bdf8' : '#94a3b8'}; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>🎯</span> Targets & ThingMarks
          </button>
          <button class="vf-help-tab-btn ${activeTab === 'iot' ? 'active' : ''}" data-tab="iot" style="padding: 10px 14px; background: none; border: none; border-bottom: 2px solid ${activeTab === 'iot' ? '#38bdf8' : 'transparent'}; color: ${activeTab === 'iot' ? '#38bdf8' : '#94a3b8'}; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>📡</span> IoT & Augmentations
          </button>
          <button class="vf-help-tab-btn ${activeTab === 'shortcuts' ? 'active' : ''}" data-tab="shortcuts" style="padding: 10px 14px; background: none; border: none; border-bottom: 2px solid ${activeTab === 'shortcuts' ? '#38bdf8' : 'transparent'}; color: ${activeTab === 'shortcuts' ? '#38bdf8' : '#94a3b8'}; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>⌨️</span> Controls & Shortcuts
          </button>
        </div>

        <!-- Body Content -->
        <div style="flex: 1; overflow-y: auto; padding: 20px; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
          ${
            activeTab === 'run_ar'
              ? `
            <!-- TAB 1: HOW TO RUN AR -->
            <div style="display: flex; flex-direction: column; gap: 18px;">
              <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 14px 16px;">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #f59e0b; font-size: 14px; margin-bottom: 6px;">
                  <span>⚡</span> Quickest Way: In-Editor Run AR Button
                </div>
                <p style="margin: 0; font-size: 12px; color: #e2e8f0;">
                  Click the golden <strong>"👓 Run AR"</strong> button located right in the <strong>bottom canvas toolbar</strong> (next to Fit & Reset) or click <strong>"Deploy Experience to Meta Quest 3 →"</strong> in the right-hand Model Inspector tab.
                </p>
              </div>

              <!-- Methods List -->
              <div style="display: flex; flex-direction: column; gap: 14px;">
                <h4 style="margin: 0; font-size: 14px; color: #38bdf8; font-weight: 700; border-bottom: 1px solid #1e3a5f; padding-bottom: 6px;">
                  The 4 Ways to Run & Experience Your AR Project:
                </h4>

                <!-- Method 1 -->
                <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 8px; padding: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: 700; color: #38bdf8; font-size: 13px;">
                      1. Instant AR Preview from Vuforia Canvas (Direct Launch)
                    </div>
                    <span style="font-size: 10px; background: #0369a1; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">IN-STUDIO</span>
                  </div>
                  <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #94a3b8; display: flex; flex-direction: column; gap: 4px;">
                    <li>Click the golden <strong style="color: #f59e0b;">"👓 Run AR"</strong> button at the bottom of the 3D canvas viewport.</li>
                    <li>The system switches instantly to the <strong>AR Passthrough Player</strong>, loading your chosen CAD model, spatial pins, ThingMarks, and real-time ThingWorx IoT telemetry.</li>
                    <li>To exit and return to authoring, simply click <strong style="color: #fff;">"← Return to Studio"</strong> at the top-left of the player.</li>
                  </ul>
                </div>

                <!-- Method 2 -->
                <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 8px; padding: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: 700; color: #38bdf8; font-size: 13px;">
                      2. Desktop / Laptop / Tablet Camera Passthrough (Mixed Reality)
                    </div>
                    <span style="font-size: 10px; background: #b45309; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">WEBCAM MR</span>
                  </div>
                  <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #94a3b8; display: flex; flex-direction: column; gap: 4px;">
                    <li>Click the amber <strong style="color: #f59e0b;">"👓 AR Passthrough"</strong> button on the top navigation bar.</li>
                    <li>When prompted by your browser, grant permission for camera access.</li>
                    <li>Your real-world desk, machine, or room will become the video background behind the 3D digital twin assembly and floating live telemetry gauges.</li>
                    <li>Use the HUD button <strong style="color: #fff;">"👓 AR Camera"</strong> to toggle camera video feed on or off at any time.</li>
                  </ul>
                </div>

                <!-- Method 3 -->
                <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 8px; padding: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: 700; color: #38bdf8; font-size: 13px;">
                      3. Meta Quest 3 & Quest Pro Immersive Session (WebXR 6DoF)
                    </div>
                    <span style="font-size: 10px; background: #059669; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">HEADSET 6DOF</span>
                  </div>
                  <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #94a3b8; display: flex; flex-direction: column; gap: 4px;">
                    <li>Connect your Meta Quest 3 to the <strong>same local Wi-Fi network</strong> as this workstation.</li>
                    <li>Open <strong>Meta Quest Browser</strong> inside your headset.</li>
                    <li>Navigate to your local network URL: <code style="color: #38bdf8;">${questUrl}</code></li>
                    <li>Click the <strong style="color: #fff;">"Enter XR"</strong> button at the top of the page.</li>
                    <li>The headset enters full <strong>stereoscopic color passthrough</strong> with 6DoF head tracking, natural hand gestures, and controller grab support!</li>
                  </ul>
                </div>

                <!-- Method 4 -->
                <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 8px; padding: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: 700; color: #38bdf8; font-size: 13px;">
                      4. Optical Marker & ThingMark Scan (Auto-Alignment)
                    </div>
                    <span style="font-size: 10px; background: #7c3aed; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">AUTO-ANCHOR</span>
                  </div>
                  <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #94a3b8; display: flex; flex-direction: column; gap: 4px;">
                    <li>Click <strong style="color: #38bdf8;">"📐 Scanner"</strong> in the top header bar.</li>
                    <li>Point your device camera at a printed ThingMark (e.g. <code style="color: #38bdf8;">EQUIP-CYL-8821</code>) or machinery QR code.</li>
                    <li>Vuforia's edge and marker detector automatically correlates the target and opens the AR procedure with exact physical datum anchoring.</li>
                  </ul>
                </div>
              </div>
            </div>
          `
              : activeTab === 'quest'
              ? `
            <!-- TAB 2: META QUEST 3 & WEBXR -->
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 14px 16px;">
                <div style="font-weight: 700; color: #38bdf8; font-size: 14px; margin-bottom: 4px;">
                  Zero-Install WebXR Architecture
                </div>
                <div style="font-size: 12px; color: #cbd5e1;">
                  FactoryVerse is powered by IWSDK (Industrial WebXR SDK) v1.1.0 and Three.js. You don't need to install custom APKs or connect via USB cables during daily operation — any Meta Quest 3 running Meta Horizon OS can load and run your scenes over Wi-Fi.
                </div>
              </div>

              <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 8px; padding: 16px;">
                <div style="font-weight: 700; color: #fff; font-size: 13px; margin-bottom: 10px;">
                  Local Wi-Fi Network Connection Steps:
                </div>
                <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #94a3b8; display: flex; flex-direction: column; gap: 8px;">
                  <li>
                    Ensure your PC and Meta Quest 3 headset are on the <strong>same Wi-Fi router or hotspot</strong>.
                  </li>
                  <li>
                    Your local network URL is:
                    <div style="margin-top: 6px; display: flex; align-items: center; gap: 8px;">
                      <input type="text" readonly value="${questUrl}" style="background: #0b1728; border: 1px solid #1e3a5f; color: #38bdf8; font-family: monospace; font-size: 12px; padding: 6px 10px; border-radius: 4px; width: 340px;" />
                      <button id="vf-help-copy-url" class="btn btn-secondary btn-sm" style="padding: 6px 12px; font-size: 11px;">
                        ${copiedToast ? '✓ Copied!' : '📋 Copy URL'}
                      </button>
                    </div>
                  </li>
                  <li>
                    In Meta Quest Browser, open the URL. If you encounter the standard local development certificate warning, click <strong>"Advanced"</strong> and then <strong>"Proceed to IP (unsafe)"</strong>.
                  </li>
                  <li>
                    Click the <strong>"Enter XR"</strong> badge in the top navigation bar.
                  </li>
                  <li>
                    The browser will grant WebXR immersive-ar session permissions, and the virtual machine will align to your real workspace floor and tables.
                  </li>
                </ol>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 8px; padding: 12px;">
                  <div style="color: #4ade80; font-weight: 700; font-size: 12px; margin-bottom: 4px;">✓ Natural Hand Tracking</div>
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                    No controllers needed! Perform a quick <strong>Pinch</strong> (tap index finger & thumb together) to select 3D gauges, or reach out to grab parts.
                  </p>
                </div>
                <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 8px; padding: 12px;">
                  <div style="color: #38bdf8; font-weight: 700; font-size: 12px; margin-bottom: 4px;">✓ Real-Time Depth Occlusion</div>
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                    FactoryVerse features float32 WebXR depth sensing. Real operator hands and physical tools will naturally occlude virtual components.
                  </p>
                </div>
              </div>
            </div>
          `
              : activeTab === 'targets'
              ? `
            <!-- TAB 3: TARGETS & THINGMARKS -->
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 8px; padding: 14px;">
                <div style="font-weight: 700; color: #38bdf8; font-size: 13px; margin-bottom: 8px;">
                  Vuforia Target Manager Integration
                </div>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #94a3b8;">
                  FactoryVerse mirrors PTC Vuforia Target Manager workflows. You can register, evaluate, and track multiple industrial targets:
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 6px; padding: 10px;">
                    <strong style="color: #fff;">1. Model Target (CAD Mesh)</strong>
                    <div style="color: #94a3b8; margin-top: 4px;">
                      Direct edge detection on CAD geometries (STEP, OBJ, GLTF). Does not require any stickers or visual marks on the equipment.
                    </div>
                  </div>
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 6px; padding: 10px;">
                    <strong style="color: #fff;">2. ThingMark (Optical Pattern)</strong>
                    <div style="color: #94a3b8; margin-top: 4px;">
                      High-contrast circular fiducial markers encoding unique asset IDs for instant physical registration under low-light conditions.
                    </div>
                  </div>
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 6px; padding: 10px;">
                    <strong style="color: #fff;">3. Image Target (Feature Points)</strong>
                    <div style="color: #94a3b8; margin-top: 4px;">
                      Tracks schematic posters, equipment faceplates, and electrical wiring diagrams using FAST natural feature correlation.
                    </div>
                  </div>
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 6px; padding: 10px;">
                    <strong style="color: #fff;">4. Guide Views</strong>
                    <div style="color: #94a3b8; margin-top: 4px;">
                      Provides operators with a visual 3D silhouette in the AR camera to guide the user into the initial tracking alignment angle.
                    </div>
                  </div>
                </div>
              </div>

              <div style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #e2e8f0;">
                <strong style="color: #4ade80;">Pro-Tip:</strong> Click <strong>"Manage ↗"</strong> in the left hierarchy panel or click the <strong>Target Database button</strong> in the toolbar to upload custom CAD targets, inspect feature point star ratings, and adjust guide view presets.
              </div>
            </div>
          `
              : activeTab === 'iot'
              ? `
            <!-- TAB 4: IOT & AUGMENTATIONS -->
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 8px; padding: 14px;">
                <div style="font-weight: 700; color: #38bdf8; font-size: 13px; margin-bottom: 6px;">
                  PTC ThingWorx Real-Time IoT Data Streaming
                </div>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #94a3b8;">
                  Augmentations in Vuforia Studio dynamically bind to industrial telemetry streams:
                </p>
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; background: #09111c; border: 1px solid #1e3a5f; border-radius: 4px; padding: 6px 10px;">
                    <span style="color: #38bdf8; font-weight: 600;">Hydraulic Line Pressure</span>
                    <span style="font-family: monospace; color: #fff;">211.1 Bar (Normal: 180 - 230 Bar)</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; background: #09111c; border: 1px solid #1e3a5f; border-radius: 4px; padding: 6px 10px;">
                    <span style="color: #f59e0b; font-weight: 600;">Fluid Operating Temperature</span>
                    <span style="font-family: monospace; color: #fff;">63.2 °C (Warning: > 75.0 °C)</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; background: #09111c; border: 1px solid #1e3a5f; border-radius: 4px; padding: 6px 10px;">
                    <span style="color: #4ade80; font-weight: 600;">Spindle Vibration RMS</span>
                    <span style="font-family: monospace; color: #fff;">0.082 mm/s (PASS: < 0.150 mm/s)</span>
                  </div>
                </div>
              </div>

              <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 8px; padding: 14px;">
                <div style="font-weight: 700; color: #fff; font-size: 13px; margin-bottom: 8px;">
                  Available Spatial Augmentation Widgets:
                </div>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #94a3b8; display: flex; flex-direction: column; gap: 4px;">
                  <li><strong>⏱️ 3D Gauge:</strong> Renders radial and linear dial indicators anchored in 3D space above physical valves.</li>
                  <li><strong>📍 Inspection Spatial Pin:</strong> Marks critical inspection waypoints, torque points, or lube fittings.</li>
                  <li><strong>📋 SOP Instruction Card:</strong> Displays standard operating procedure steps right beside the component.</li>
                  <li><strong>🎯 ThingMark Anchor:</strong> Defines optical coordinate origins for multi-marker tracking.</li>
                  <li><strong>🔍 Tolerance Datum:</strong> Real-time pass/fail quality indicators linked to MES quality inspection runs.</li>
                </ul>
              </div>
            </div>
          `
              : `
            <!-- TAB 5: CONTROLS & SHORTCUTS -->
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 8px; padding: 14px;">
                <div style="font-weight: 700; color: #38bdf8; font-size: 13px; margin-bottom: 10px;">
                  3D Viewport Mouse & Keyboard Navigation
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 4px; padding: 8px 10px; display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Orbit / Rotate</span>
                    <strong style="color: #fff;">Left Mouse Drag</strong>
                  </div>
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 4px; padding: 8px 10px; display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Pan Camera</span>
                    <strong style="color: #fff;">Right Drag / Shift + Drag</strong>
                  </div>
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 4px; padding: 8px 10px; display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Zoom In / Out</span>
                    <strong style="color: #fff;">Mouse Wheel / + / —</strong>
                  </div>
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 4px; padding: 8px 10px; display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Fit / Reset View</span>
                    <strong style="color: #fff;">⛶ Fit / ↺ Reset</strong>
                  </div>
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 4px; padding: 8px 10px; display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Close Dialog</span>
                    <strong style="color: #fff;">Escape (Esc)</strong>
                  </div>
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 4px; padding: 8px 10px; display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Toggle Wireframe</span>
                    <strong style="color: #fff;">🧊 Wireframe Icon</strong>
                  </div>
                </div>
              </div>

              <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 8px; padding: 14px;">
                <div style="font-weight: 700; color: #fff; font-size: 13px; margin-bottom: 8px;">
                  Meta Quest 3 XR Controller & Hand Gestures
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 4px; padding: 8px 10px; display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Select / Tap</span>
                    <strong style="color: #4ade80;">Pinch (Index + Thumb)</strong>
                  </div>
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 4px; padding: 8px 10px; display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Grab / Relocate</span>
                    <strong style="color: #4ade80;">Grip Squeeze / Fist Grab</strong>
                  </div>
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 4px; padding: 8px 10px; display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Raycast Pointer</span>
                    <strong style="color: #38bdf8;">Controller Target Ray</strong>
                  </div>
                  <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 4px; padding: 8px 10px; display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Exit Immersive Session</span>
                    <strong style="color: #38bdf8;">Oculus / Meta Menu Button</strong>
                  </div>
                </div>
              </div>
            </div>
          `
          }
        </div>

        <!-- Footer Actions -->
        <div style="padding: 14px 20px; background: #0c182a; border-top: 1px solid #1e3a5f; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 11px; color: #64748b;">
            Press <kbd style="background: #0b1728; border: 1px solid #1e3a5f; border-radius: 3px; padding: 1px 4px; color: #94a3b8;">Esc</kbd> to return to workspace
          </div>
          <div style="display: flex; gap: 10px;">
            <button id="vf-help-btn-launch-ar" class="btn btn-amber btn-sm" style="padding: 6px 14px; font-weight: 700; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; border: none;">
              👓 Launch AR Experience Now
            </button>
            <button id="vf-help-btn-done" class="btn btn-primary btn-sm" style="padding: 6px 16px;">
              Done
            </button>
          </div>
        </div>

      </div>
    `;

    // Event listeners
    modal.querySelector('#vf-help-btn-close')?.addEventListener('click', closeModal);
    modal.querySelector('#vf-help-btn-done')?.addEventListener('click', closeModal);

    modal.querySelectorAll('.vf-help-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).getAttribute('data-tab');
        if (tab) {
          activeTab = tab as any;
          renderModal();
        }
      });
    });

    modal.querySelector('#vf-help-copy-url')?.addEventListener('click', () => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(questUrl).then(() => {
          copiedToast = true;
          renderModal();
          setTimeout(() => {
            copiedToast = false;
            const copyBtn = modal.querySelector('#vf-help-copy-url');
            if (copyBtn) copyBtn.textContent = '📋 Copy URL';
          }, 2500);
        });
      }
    });

    modal.querySelector('#vf-help-btn-launch-ar')?.addEventListener('click', () => {
      closeModal();
      if (options.onLaunchAR) {
        options.onLaunchAR();
      }
    });
  };

  const closeModal = () => {
    window.removeEventListener('keydown', handleKey);
    modal.remove();
    if (options.onClose) options.onClose();
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeModal();
  };

  window.addEventListener('keydown', handleKey);
  document.body.appendChild(modal);
  renderModal();
}
