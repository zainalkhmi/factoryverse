/**
 * FactoryVerse Studio - Capture Workspace
 * Expert demonstration recording workflow with live camera & audio capture,
 * timeline annotations, and 1-click conversion to editable procedure drafts.
 */

import { storageRepository } from '../../storage/storage-repository';
import type { CaptureSession, CapturedStep } from '../../types';

export function renderCaptureWorkspaceView(
  container: HTMLElement,
  onNavigate: (viewId: string, param?: string) => void
): void {
  const sessions = storageRepository.getCaptureSessions();
  let activeSession: CaptureSession = sessions[0] || {
    id: `cap-new-${Date.now()}`,
    title: 'New Expert Capture Session',
    expertName: 'Marcus Cole',
    recordedAt: new Date().toISOString(),
    status: 'recording',
    steps: [],
    notes: 'Floor capture demo.',
  };

  // Live media recording state
  let mediaStream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let recordedChunks: Blob[] = [];
  let isRecording = false;
  let lastRecordedBlobUrl: string | null = null;

  const stopCameraStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
  };

  const render = () => {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 700; color: #fff;">Expert Knowledge Capture Studio</h2>
          <p style="font-size: 13px; color: var(--text-secondary);">Record video demonstrations with live narration, document tactile feedback, and generate standardized drafts.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="cap-btn-new-session" class="btn btn-secondary"><span>+</span> New Recording Session</button>
          <button id="cap-btn-convert" class="btn btn-primary" ${activeSession.steps.length === 0 ? 'disabled' : ''}>
            <span>⚡</span> Convert to Procedure Draft
          </button>
        </div>
      </div>

      <!-- Active Session Metadata -->
      <div style="background-color: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 18px; margin-bottom: 20px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px;">
        <div>
          <label class="form-label">Capture Session Title</label>
          <input id="cap-input-title" type="text" class="form-input" value="${activeSession.title}" />
        </div>
        <div>
          <label class="form-label">Lead Expert / Demonstrator</label>
          <input id="cap-input-expert" type="text" class="form-input" value="${activeSession.expertName}" />
        </div>
        <div>
          <label class="form-label">Workflow Status</label>
          <div style="margin-top: 6px;">
            <span class="badge ${activeSession.status === 'converted' ? 'badge-published' : 'badge-draft'}">
              ${activeSession.status}
            </span>
          </div>
        </div>
      </div>

      <!-- Step Timeline & Recording Grid -->
      <div style="display: grid; grid-template-columns: 1fr 420px; gap: 20px;">
        <!-- Left: Captured Step Timeline -->
        <div class="table-card" style="margin-bottom: 0;">
          <div class="table-header-bar">
            <span class="table-title">Captured Demonstration Steps (${activeSession.steps.length})</span>
            <span style="font-size: 12px; color: var(--text-muted);">Frontline Knowledge Base</span>
          </div>
          <div style="padding: 18px;">
            ${
              activeSession.steps.length === 0
                ? `<div style="text-align: center; padding: 40px; color: var(--text-muted);">No steps captured yet. Use the console on the right to record video or log expert actions.</div>`
                : activeSession.steps
                    .map(
                      (step: CapturedStep, idx: number) => `
              <div style="background-color: #0d1724; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 12px; display: flex; gap: 16px; align-items: flex-start;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #1e3a5f; color: #38bdf8; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;">
                  ${idx + 1}
                </div>
                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <div style="font-weight: 700; color: #fff; font-size: 14px;">${step.title}</div>
                    <span style="font-size: 11px; color: var(--accent-amber); font-family: var(--font-mono);">${step.timestamp || '00:00'}</span>
                  </div>
                  <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">
                    <strong>Action:</strong> ${step.writtenAction}
                  </div>
                  <div style="font-size: 12px; color: #cbd5e1; background-color: #112235; padding: 8px 12px; border-radius: 4px; margin-bottom: 6px;">
                    🗣️ <em>"${step.narrationText || 'No audio narration recorded'}"</em>
                  </div>
                  ${
                    step.mediaBlobUrl
                      ? `
                    <div style="margin-bottom: 6px;">
                      <video src="${step.mediaBlobUrl}" controls style="max-width: 100%; max-height: 140px; border-radius: 4px; border: 1px solid #1e3a5f; background: #000;"></video>
                    </div>
                  `
                      : ''
                  }
                  <div style="font-size: 12px; color: var(--accent-blue);">
                    <strong>Checkpoint:</strong> ${step.checkpointCriteria || 'Standard completed.'}
                  </div>
                </div>
                <button class="btn btn-danger btn-sm cap-btn-del-step" data-idx="${idx}" style="padding: 4px 8px;">✕</button>
              </div>
            `
                    )
                    .join('')
            }
          </div>
        </div>

        <!-- Right: Live Camera & Step Capture Console -->
        <div class="editor-column" style="height: auto;">
          <div class="editor-col-header">
            <span class="editor-col-title">Live Capture Console</span>
            <span id="cap-rec-indicator" class="badge" style="background: #1e293b; color: #94a3b8;">Camera Idle</span>
          </div>
          <div class="editor-col-body">
            <!-- Camera Viewfinder -->
            <div style="position: relative; width: 100%; height: 210px; background: #000; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); overflow: hidden; margin-bottom: 14px; display: flex; align-items: center; justify-content: center;">
              <video id="cap-camera-feed" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover; display: none;"></video>
              <div id="cap-camera-placeholder" style="color: var(--text-muted); text-align: center; font-size: 12px; padding: 20px;">
                <div style="font-size: 28px; margin-bottom: 6px;">📹</div>
                Webcam & Mic Offline.<br />Click "Enable Camera" to record live demonstrations.
              </div>
              <div id="cap-live-rec-badge" style="display: none; position: absolute; top: 10px; left: 10px; background: rgba(239, 68, 68, 0.9); color: #fff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px;">
                ● RECORDING CLIP
              </div>
            </div>

            <!-- Camera Controls -->
            <div style="display: flex; gap: 8px; margin-bottom: 14px;">
              <button id="cap-btn-toggle-cam" class="btn btn-secondary btn-sm" style="flex: 1;">
                📷 Enable Camera
              </button>
              <button id="cap-btn-record-clip" class="btn btn-danger btn-sm" style="flex: 1;" disabled>
                ⏺ Record Clip
              </button>
            </div>

            <div class="form-group">
              <label class="form-label">Step Action Title</label>
              <input id="cap-step-title" type="text" class="form-input" placeholder="e.g. Inspect Bore Honing" />
            </div>

            <div class="form-group">
              <label class="form-label">Written Action Description</label>
              <textarea id="cap-step-action" class="form-textarea" placeholder="Detail the physical motions or machine operations..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Expert Voice Narration / Transcribed Speech</label>
              <textarea id="cap-step-narration" class="form-textarea" placeholder="Key expert tips, tactile feels, audible clicks to listen for..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Checkpoint Acceptance Criteria</label>
              <input id="cap-step-checkpoint" type="text" class="form-input" placeholder="e.g. Bore particulate-free under loupe" />
            </div>

            <button id="cap-btn-save-step" class="btn btn-primary" style="width: 100%; margin-top: 6px;">
              <span>+</span> Append Step to Session
            </button>
          </div>
        </div>
      </div>
    `;

    // Hook Camera and Recorder
    const videoEl = container.querySelector('#cap-camera-feed') as HTMLVideoElement;
    const placeholderEl = container.querySelector('#cap-camera-placeholder') as HTMLElement;
    const toggleCamBtn = container.querySelector('#cap-btn-toggle-cam') as HTMLButtonElement;
    const recordBtn = container.querySelector('#cap-btn-record-clip') as HTMLButtonElement;
    const recBadge = container.querySelector('#cap-live-rec-badge') as HTMLElement;
    const recIndicator = container.querySelector('#cap-rec-indicator') as HTMLElement;

    toggleCamBtn?.addEventListener('click', async () => {
      if (mediaStream) {
        stopCameraStream();
        videoEl.style.display = 'none';
        placeholderEl.style.display = 'block';
        toggleCamBtn.textContent = '📷 Enable Camera';
        recordBtn.disabled = true;
        recIndicator.textContent = 'Camera Idle';
        recIndicator.style.background = '#1e293b';
        recIndicator.style.color = '#94a3b8';
      } else {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          videoEl.srcObject = mediaStream;
          videoEl.style.display = 'block';
          placeholderEl.style.display = 'none';
          toggleCamBtn.textContent = '⏹ Disable Camera';
          recordBtn.disabled = false;
          recIndicator.textContent = 'Camera Live';
          recIndicator.style.background = 'rgba(16, 185, 129, 0.2)';
          recIndicator.style.color = '#10b981';
        } catch (err: any) {
          alert('Could not access camera/mic: ' + (err.message || 'Permission denied'));
        }
      }
    });

    recordBtn?.addEventListener('click', () => {
      if (!mediaStream) return;

      if (!isRecording) {
        // Start recording
        recordedChunks = [];
        try {
          mediaRecorder = new MediaRecorder(mediaStream);
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
          };
          mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            lastRecordedBlobUrl = URL.createObjectURL(blob);
            alert('Video demonstration recorded successfully and attached to this step!');
          };
          mediaRecorder.start();
          isRecording = true;
          recordBtn.textContent = '⏹ Stop Recording';
          recBadge.style.display = 'block';
          recIndicator.textContent = 'Recording Clip...';
          recIndicator.style.background = 'rgba(239, 68, 68, 0.2)';
          recIndicator.style.color = '#ef4444';
        } catch (e: any) {
          alert('MediaRecorder error: ' + e.message);
        }
      } else {
        // Stop recording
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        isRecording = false;
        recordBtn.textContent = '⏺ Record Clip';
        recBadge.style.display = 'none';
        recIndicator.textContent = 'Clip Ready';
        recIndicator.style.background = 'rgba(56, 189, 248, 0.2)';
        recIndicator.style.color = '#38bdf8';
      }
    });

    // Form Event Handlers
    container.querySelector('#cap-input-title')?.addEventListener('input', (e) => {
      activeSession.title = (e.target as HTMLInputElement).value;
      storageRepository.saveCaptureSession(activeSession);
    });

    container.querySelector('#cap-input-expert')?.addEventListener('input', (e) => {
      activeSession.expertName = (e.target as HTMLInputElement).value;
      storageRepository.saveCaptureSession(activeSession);
    });

    container.querySelector('#cap-btn-new-session')?.addEventListener('click', () => {
      stopCameraStream();
      activeSession = {
        id: `cap-session-${Date.now()}`,
        title: 'New Expert Capture Session',
        expertName: 'Elena Vance',
        recordedAt: new Date().toISOString(),
        status: 'recording',
        steps: [],
        notes: '',
      };
      storageRepository.saveCaptureSession(activeSession);
      render();
    });

    container.querySelector('#cap-btn-save-step')?.addEventListener('click', () => {
      const title = (container.querySelector('#cap-step-title') as HTMLInputElement)?.value.trim();
      const action = (container.querySelector('#cap-step-action') as HTMLTextAreaElement)?.value.trim();
      const narration = (container.querySelector('#cap-step-narration') as HTMLTextAreaElement)?.value.trim();
      const checkpoint = (container.querySelector('#cap-step-checkpoint') as HTMLInputElement)?.value.trim();

      if (!title || !action) {
        alert('Please provide a title and action description for the captured step.');
        return;
      }

      const minutes = Math.floor(activeSession.steps.length * 1.2);
      const seconds = (activeSession.steps.length * 25) % 60;
      const timestamp = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      const newStep: CapturedStep = {
        id: `cap-step-${Date.now()}`,
        order: activeSession.steps.length + 1,
        timestamp,
        title,
        writtenAction: action,
        narrationText: narration,
        checkpointCriteria: checkpoint || 'Step completed per standard.',
        targetComponentId: 'barrel',
        mediaBlobUrl: lastRecordedBlobUrl || undefined,
        mediaType: lastRecordedBlobUrl ? 'video' : undefined,
      };

      activeSession.steps.push(newStep);
      storageRepository.saveCaptureSession(activeSession);
      lastRecordedBlobUrl = null;
      render();
    });

    container.querySelectorAll('.cap-btn-del-step').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = Number((e.currentTarget as HTMLElement).getAttribute('data-idx'));
        activeSession.steps.splice(idx, 1);
        activeSession.steps.forEach((s: CapturedStep, i: number) => (s.order = i + 1));
        storageRepository.saveCaptureSession(activeSession);
        render();
      });
    });

    container.querySelector('#cap-btn-convert')?.addEventListener('click', () => {
      stopCameraStream();
      if (activeSession.steps.length === 0) return;
      const newProc = storageRepository.convertCaptureToProcedure(activeSession.id);
      if (newProc) {
        alert(`Capture session successfully converted to draft procedure "${newProc.title}"!`);
        onNavigate('editor', newProc.id);
      }
    });
  };

  render();
}
