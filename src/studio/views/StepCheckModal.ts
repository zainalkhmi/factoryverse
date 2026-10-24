/**
 * FactoryVerse Studio - Step Check Live Inspector Modal
 * Inspired by Vuforia Engine Step Check (Beta) & Vuforia Creator App.
 * 
 * Provides an interactive AR viewfinder that tests Step Check templates in real-time
 * with on-device computer vision, viewpoint guidance cone, and center reticle HUD.
 */

import {
  stepCheckService,
  type StepCheckTemplate,
  type StepCheckEvaluation,
} from '../../inspection/step-check-service';

export function openStepCheckModal(
  initialTemplateId: string = 'TEMPL-ROD-01',
  onClose?: () => void
): void {
  const existing = document.getElementById('step-check-modal');
  if (existing) existing.remove();

  let activeTemplate = stepCheckService.getTemplateById(initialTemplateId) || stepCheckService.getTemplates()[0];
  let currentDistanceMeters = activeTemplate.optimalViewpoint.distanceMeters;
  let currentPitchDegrees = activeTemplate.optimalViewpoint.pitchDegrees;
  let currentYawDegrees = activeTemplate.optimalViewpoint.yawDegrees;
  let webcamStream: MediaStream | null = null;
  let isWebcamActive = false;
  let animationFrameId: number | null = null;

  let currentEvaluation: StepCheckEvaluation = stepCheckService.evaluateSimulatedState(
    activeTemplate.id,
    'PASS',
    {
      distanceMeters: currentDistanceMeters,
      pitchDegrees: currentPitchDegrees,
      yawDegrees: currentYawDegrees,
    }
  );

  const modal = document.createElement('div');
  modal.id = 'step-check-modal';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background-color: rgba(3, 7, 18, 0.94);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    padding: 24px;
    font-family: var(--font-sans, system-ui, sans-serif);
    color: #fff;
    overflow-y: auto;
  `;

  const renderModalContent = () => {
    const templates = stepCheckService.getTemplates();
    const isPass = currentEvaluation.status === 'NORMAL';
    const isUndecidable = currentEvaluation.status === 'UNDECIDABLE';
    const statusColor = isPass ? '#22c55e' : isUndecidable ? '#ef4444' : '#94a3b8';
    const statusBg = isPass ? 'rgba(34, 197, 94, 0.15)' : isUndecidable ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.15)';

    modal.innerHTML = `
      <div style="max-width: 1040px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 18px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background: linear-gradient(135deg, #0ea5e9, #38bdf8); width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              👁️
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h2 style="font-size: 18px; font-weight: 700; margin: 0; color: #fff;">Vuforia Step Check — Live Visual Validation</h2>
                <span style="font-size: 10px; font-weight: 700; background: #0284c7; color: #fff; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px;">ON-DEVICE BETA</span>
              </div>
              <div style="font-size: 12px; color: #94a3b8;">
                Visual verification from a single masked template image without cloud training.
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <select id="modal-select-template" style="background: #0f172a; border: 1px solid #334155; color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 13px;">
              ${templates
                .map(
                  (t) => `
                <option value="${t.id}" ${t.id === activeTemplate.id ? 'selected' : ''}>
                  ${t.name} (${t.targetComponentId})
                </option>
              `
                )
                .join('')}
            </select>
            <button id="modal-btn-close" style="background: #1e293b; border: 1px solid #334155; color: #cbd5e1; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-size: 16px;">✕</button>
          </div>
        </div>

        <!-- Viewfinder & Simulator Area -->
        <div style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px;">
          <!-- 1. Left: Optical Viewfinder Canvas -->
          <div style="position: relative; background: #020617; border: 2px solid #1e3a5f; border-radius: 12px; overflow: hidden; aspect-ratio: 16/10; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);">
            <!-- Live Webcam Video element (hidden if not webcam) -->
            <video id="modal-webcam-video" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover; display: ${isWebcamActive ? 'block' : 'none'};"></video>

            <!-- Simulated Background Canvas -->
            <canvas id="modal-viewfinder-canvas" width="640" height="400" style="width: 100%; height: 100%; object-fit: cover; display: ${isWebcamActive ? 'none' : 'block'};"></canvas>

            <!-- Mask Region of Interest (ROI) Overlay -->
            <div id="modal-mask-overlay" style="
              position: absolute;
              left: ${activeTemplate.mask.x * 100}%;
              top: ${activeTemplate.mask.y * 100}%;
              width: ${activeTemplate.mask.width * 100}%;
              height: ${activeTemplate.mask.height * 100}%;
              border: 2px dashed ${statusColor};
              background: ${isPass ? 'rgba(34, 197, 94, 0.18)' : isUndecidable ? 'rgba(239, 68, 68, 0.22)' : 'rgba(148, 163, 184, 0.12)'};
              box-shadow: 0 0 14px ${statusColor};
              border-radius: 4px;
              pointer-events: none;
              transition: all 0.25s ease;
            ">
              <span style="position: absolute; top: -18px; left: 0; font-size: 9px; font-weight: 700; color: ${statusColor}; background: #0f172a; padding: 1px 4px; border-radius: 3px; border: 1px solid ${statusColor};">
                MASK: ${activeTemplate.targetComponentId}
              </span>
            </div>

            <!-- Center Reticle Overlay -->
            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
              <!-- Optical Reticle Crosshairs -->
              <div style="position: relative; width: 140px; height: 140px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <!-- Reticle Corner Brackets -->
                <div style="position: absolute; top: 0; left: 0; width: 14px; height: 14px; border-top: 3px solid ${statusColor}; border-left: 3px solid ${statusColor};"></div>
                <div style="position: absolute; top: 0; right: 0; width: 14px; height: 14px; border-top: 3px solid ${statusColor}; border-right: 3px solid ${statusColor};"></div>
                <div style="position: absolute; bottom: 0; left: 0; width: 14px; height: 14px; border-bottom: 3px solid ${statusColor}; border-left: 3px solid ${statusColor};"></div>
                <div style="position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; border-bottom: 3px solid ${statusColor}; border-right: 3px solid ${statusColor};"></div>

                <!-- Center Result Icon -->
                <div style="font-size: 32px; filter: drop-shadow(0 0 8px ${statusColor});">
                  ${isPass ? '✅' : isUndecidable ? '⚠️' : '🎯'}
                </div>
              </div>

              <!-- Reticle Confidence Badge -->
              <div style="margin-top: 10px; background: rgba(15, 23, 42, 0.85); border: 1px solid ${statusColor}; color: ${statusColor}; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; backdrop-filter: blur(4px);">
                ${currentEvaluation.status} · ${(currentEvaluation.confidence * 100).toFixed(1)}% CONFIDENCE
              </div>
            </div>

            <!-- Lower-Left Picture-in-Picture: Template Reference Image -->
            <div style="position: absolute; bottom: 12px; left: 12px; background: rgba(15, 23, 42, 0.85); border: 1px solid #334155; border-radius: 6px; padding: 6px; width: 130px; backdrop-filter: blur(6px);">
              <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Template Reference</div>
              <div style="width: 100%; height: 50px; background: #1e293b; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #38bdf8; border: 1px solid #0284c7;">
                ${activeTemplate.label}
              </div>
            </div>

            <!-- Top-Right: Viewpoint Guidance Cone HUD -->
            <div style="position: absolute; top: 12px; right: 12px; background: rgba(15, 23, 42, 0.85); border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; backdrop-filter: blur(6px); display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">📐</span>
              <div>
                <div style="font-size: 10px; font-weight: 700; color: #cbd5e1;">Viewpoint Guidance Cone</div>
                <div style="font-size: 11px; color: ${currentEvaluation.guidance.direction === 'OPTIMAL' ? '#22c55e' : '#f59e0b'}; font-weight: 600;">
                  ${currentEvaluation.guidance.direction}
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Right: Template Specs & Interactive Diagnostic Controls -->
          <div style="background: #0b1320; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 14px;">
            <div>
              <div style="font-size: 11px; color: #0284c7; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Active Template Properties</div>
              <h3 style="font-size: 16px; font-weight: 700; margin: 4px 0 2px; color: #fff;">${activeTemplate.name}</h3>
              <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.4;">${activeTemplate.description}</p>
            </div>

            <!-- Status Callout Card -->
            <div style="background: ${statusBg}; border: 1px solid ${statusColor}; border-radius: 8px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 800; color: ${statusColor};">STATUS: ${currentEvaluation.status}</span>
                <span style="font-size: 11px; font-weight: 700; color: #cbd5e1;">Target: ${(activeTemplate.confidenceThreshold * 100).toFixed(0)}%</span>
              </div>
              <!-- Confidence Progress Bar -->
              <div style="background: rgba(0, 0, 0, 0.4); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                <div style="background: ${statusColor}; width: ${(currentEvaluation.confidence * 100).toFixed(0)}%; height: 100%; transition: width 0.3s ease;"></div>
              </div>
              <div style="font-size: 11px; color: #e2e8f0; line-height: 1.4;">
                ${currentEvaluation.message}
              </div>
            </div>

            <!-- Viewpoint Direction Banner -->
            <div style="background: #111d2e; border: 1px solid #1e3a5f; border-radius: 8px; padding: 10px; font-size: 12px; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
              <span>🧭</span>
              <div>
                <strong>GUIDANCE CONE:</strong> ${currentEvaluation.guidance.message}
              </div>
            </div>

            <!-- Interactive Simulation & Live Camera Controls -->
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px;">
                Validation Test Triggers
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                <button id="modal-btn-sim-pass" style="background: #166534; border: 1px solid #22c55e; color: #fff; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">
                  ✓ Simulate Pass (NORMAL)
                </button>
                <button id="modal-btn-sim-defect" style="background: #991b1b; border: 1px solid #ef4444; color: #fff; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">
                  ⚠ Simulate Defect (UNDECIDABLE)
                </button>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button id="modal-btn-sim-offtarget" style="background: #334155; border: 1px solid #64748b; color: #fff; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">
                  🎯 Off-Target (NOT_VISIBLE)
                </button>
                <button id="modal-btn-toggle-webcam" style="background: ${isWebcamActive ? '#0284c7' : '#0f172a'}; border: 1px solid #0284c7; color: #fff; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">
                  📷 ${isWebcamActive ? 'Stop Webcam' : 'Use Real Webcam'}
                </button>
              </div>
            </div>

            <!-- Viewpoint Standoff Slider (Cone test) -->
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-bottom: 4px;">
                <span>Simulate Camera Distance</span>
                <span id="slider-dist-val">${currentDistanceMeters.toFixed(2)} m (Optimal: ${activeTemplate.optimalViewpoint.distanceMeters.toFixed(2)}m)</span>
              </div>
              <input id="modal-slider-distance" type="range" min="0.15" max="1.20" step="0.05" value="${currentDistanceMeters}" style="width: 100%; accent-color: #0284c7;" />
            </div>
          </div>
        </div>
      </div>
    `;

    // Draw simulated frame on canvas if webcam not active
    const canvas = modal.querySelector<HTMLCanvasElement>('#modal-viewfinder-canvas');
    if (canvas && !isWebcamActive) {
      drawSimulatedFrame(canvas, isPass, isUndecidable);
    }

    bindEvents();
  };

  const drawSimulatedFrame = (canvas: HTMLCanvasElement, pass: boolean, defect: boolean) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background CAD workshop gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw Cylinder Workpiece Outline
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#0f2942';

    // Barrel
    ctx.fillRect(180, 140, 280, 120);
    ctx.strokeRect(180, 140, 280, 120);

    // Flange
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(430, 120, 30, 160);
    ctx.strokeRect(430, 120, 30, 160);

    // Target Component Feature
    if (pass) {
      // Correct state (Flush contact, no gap)
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(250, 170, 140, 60);
      ctx.strokeStyle = '#4ade80';
      ctx.strokeRect(250, 170, 140, 60);

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.fillText('SEATED / ENGAGED (PASS)', 260, 205);
    } else if (defect) {
      // Defect state (Unseated, gap visible)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(270, 170, 110, 60);
      ctx.strokeStyle = '#f87171';
      ctx.strokeRect(270, 170, 110, 60);

      // Gap indicator
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(250, 170, 15, 60);

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.fillText('UNSEATED GAP (FAIL)', 275, 205);
    }
  };

  const startWebcamEvaluation = async () => {
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      isWebcamActive = true;
      renderModalContent();

      const video = modal.querySelector<HTMLVideoElement>('#modal-webcam-video');
      if (video) {
        video.srcObject = webcamStream;
        video.onloadedmetadata = () => {
          video.play();
          startPixelEvaluationLoop(video);
        };
      }
    } catch (err) {
      alert('Unable to access webcam: ' + String(err));
      isWebcamActive = false;
      renderModalContent();
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop());
      webcamStream = null;
    }
    isWebcamActive = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  const startPixelEvaluationLoop = (video: HTMLVideoElement) => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 160;
    offscreen.height = 120;
    const ctx = offscreen.getContext('2d');

    const loop = () => {
      if (!isWebcamActive || !video.videoWidth) return;

      if (ctx) {
        ctx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
        const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
        currentEvaluation = stepCheckService.evaluatePixelBuffer(
          activeTemplate.id,
          imgData.data,
          offscreen.width,
          offscreen.height,
          {
            distanceMeters: currentDistanceMeters,
            pitchDegrees: currentPitchDegrees,
            yawDegrees: currentYawDegrees,
          }
        );
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
  };

  const bindEvents = () => {
    modal.querySelector('#modal-btn-close')?.addEventListener('click', () => {
      stopWebcam();
      modal.remove();
      if (onClose) onClose();
    });

    modal.querySelector('#modal-select-template')?.addEventListener('change', (e) => {
      const selectedId = (e.target as HTMLSelectElement).value;
      const found = stepCheckService.getTemplateById(selectedId);
      if (found) {
        activeTemplate = found;
        currentDistanceMeters = activeTemplate.optimalViewpoint.distanceMeters;
        currentEvaluation = stepCheckService.evaluateSimulatedState(activeTemplate.id, 'PASS', {
          distanceMeters: currentDistanceMeters,
          pitchDegrees: currentPitchDegrees,
          yawDegrees: currentYawDegrees,
        });
        renderModalContent();
      }
    });

    modal.querySelector('#modal-btn-sim-pass')?.addEventListener('click', () => {
      currentEvaluation = stepCheckService.evaluateSimulatedState(activeTemplate.id, 'PASS', {
        distanceMeters: currentDistanceMeters,
        pitchDegrees: currentPitchDegrees,
        yawDegrees: currentYawDegrees,
      });
      renderModalContent();
    });

    modal.querySelector('#modal-btn-sim-defect')?.addEventListener('click', () => {
      currentEvaluation = stepCheckService.evaluateSimulatedState(activeTemplate.id, 'DEFECT_UNSEATED', {
        distanceMeters: currentDistanceMeters,
        pitchDegrees: currentPitchDegrees,
        yawDegrees: currentYawDegrees,
      });
      renderModalContent();
    });

    modal.querySelector('#modal-btn-sim-offtarget')?.addEventListener('click', () => {
      currentEvaluation = stepCheckService.evaluateSimulatedState(activeTemplate.id, 'OFF_TARGET');
      renderModalContent();
    });

    modal.querySelector('#modal-btn-toggle-webcam')?.addEventListener('click', () => {
      if (isWebcamActive) {
        stopWebcam();
        renderModalContent();
      } else {
        startWebcamEvaluation();
      }
    });

    modal.querySelector('#modal-slider-distance')?.addEventListener('input', (e) => {
      currentDistanceMeters = Number((e.target as HTMLInputElement).value);
      const isPass = currentEvaluation.status === 'NORMAL';
      currentEvaluation = stepCheckService.evaluateSimulatedState(
        activeTemplate.id,
        isPass ? 'PASS' : 'DEFECT_UNSEATED',
        {
          distanceMeters: currentDistanceMeters,
          pitchDegrees: currentPitchDegrees,
          yawDegrees: currentYawDegrees,
        }
      );
      renderModalContent();
    });
  };

  renderModalContent();
  document.body.appendChild(modal);
}
