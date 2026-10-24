/**
 * FactoryVerse Studio - Visual Procedure Editor
 * Professional 3-column authoring workspace for industrial work instructions.
 */

import { storageRepository, SEED_HYDRAULIC_MODEL } from '../../storage/storage-repository';
import type { Procedure, ProcedureStep, StepType, InteractionType, ComponentId, ModelComponent } from '../../types';

export function renderVisualProcedureEditorView(
  container: HTMLElement,
  procedureId: string | undefined,
  onNavigate: (viewId: string, param?: string) => void
): void {
  let procedure: Procedure;

  if (!procedureId || procedureId === 'new') {
    procedure = {
      id: `proc-${Date.now()}`,
      code: `SOP-ASM-${Math.floor(100 + Math.random() * 900)}`,
      title: 'New Industrial Assembly Procedure',
      description: 'Standard operating procedure authored in FactoryVerse Studio.',
      category: 'Assembly',
      status: 'draft',
      currentRevisionNumber: 0,
      author: 'Elena Vance',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedTotalDurationMinutes: 5,
      requiredTools: ['Safety Glasses', 'Nitrile Gloves', 'Torque Wrench'],
      safetyPrecautions: ['Adhere to standard shop-floor PPE guidelines'],
      associatedModelId: 'model-hydraulic-cyl-01',
      revisions: [],
      activeDraftSteps: [
        {
          id: `step-${Date.now()}-1`,
          order: 1,
          title: 'Initial Component Inspection',
          instruction: 'Inspect components in the parts tray before starting assembly.',
          stepType: 'instruction',
          interactionType: 'identify',
          targetComponentId: 'barrel',
          checkpoint: 'Parts verified clean and undamaged.',
          estimatedDurationSeconds: 45,
        },
      ],
    };
  } else {
    const existing = storageRepository.getProcedureById(procedureId);
    if (existing) {
      procedure = JSON.parse(JSON.stringify(existing));
    } else {
      alert('Procedure not found. Redirecting to library.');
      onNavigate('procedures');
      return;
    }
  }

  let selectedStepIndex = 0;
  let isDirty = false;

  const render = () => {
    const steps = procedure.activeDraftSteps;
    const currentStep: ProcedureStep | undefined = steps[selectedStepIndex];
    const components = SEED_HYDRAULIC_MODEL.components;

    container.innerHTML = `
      <!-- Editor Top Action Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; background-color: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px 18px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <button id="ed-btn-back" class="btn btn-secondary btn-sm">← Back</button>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge ${procedure.status === 'published' ? 'badge-published' : 'badge-draft'}">
                ${procedure.status}
              </span>
              <span style="font-size: 11px; font-weight: 700; color: var(--accent-amber);">v${procedure.currentRevisionNumber}.0</span>
              <h2 style="font-size: 15px; font-weight: 700; color: #fff;">${procedure.code} · ${procedure.title}</h2>
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">
              Author: ${procedure.author} · Model: Modular Hydraulic Cylinder
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <button id="ed-btn-meta" class="btn btn-secondary btn-sm">Metadata & Safety</button>
          <button id="ed-btn-save-draft" class="btn btn-secondary btn-sm">
            <span>💾</span> Save Draft
          </button>
          <button id="ed-btn-publish" class="btn btn-primary btn-sm">
            <span>🚀</span> Publish Revision
          </button>
          ${
            procedure.status === 'published'
              ? `<button id="ed-btn-launch-xr" class="btn btn-amber btn-sm"><span>🥽</span> Launch in XR</button>`
              : ''
          }
        </div>
      </div>

      <!-- 3-Column Workspace -->
      <div class="editor-workspace">
        <!-- 1. Left Column: Step List -->
        <div class="editor-column">
          <div class="editor-col-header">
            <span class="editor-col-title">Steps (${steps.length})</span>
            <button id="ed-btn-add-step" class="btn btn-primary btn-sm">+ Add</button>
          </div>
          <div class="editor-col-body">
            ${steps
              .map(
                (step: ProcedureStep, idx: number) => `
              <div class="step-item ${idx === selectedStepIndex ? 'active' : ''}" data-step-idx="${idx}">
                <div class="step-item-header">
                  <span class="step-badge-num">STEP ${idx + 1}</span>
                  <div style="display: flex; gap: 4px;">
                    ${idx > 0 ? `<button class="btn btn-secondary btn-sm ed-step-up" data-step-idx="${idx}" style="padding: 2px 6px;">▲</button>` : ''}
                    ${idx < steps.length - 1 ? `<button class="btn btn-secondary btn-sm ed-step-down" data-step-idx="${idx}" style="padding: 2px 6px;">▼</button>` : ''}
                    <button class="btn btn-danger btn-sm ed-step-del" data-step-idx="${idx}" style="padding: 2px 6px;">✕</button>
                  </div>
                </div>
                <div class="step-item-title">${step.title}</div>
                <div class="step-item-meta">
                  <span>${step.interactionType}</span>
                  <span>${step.estimatedDurationSeconds}s</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- 2. Center Column: Step Content & Preview -->
        <div class="editor-column">
          <div class="editor-col-header">
            <span class="editor-col-title">Step ${selectedStepIndex + 1} Content</span>
            <span style="font-size: 11px; color: var(--accent-blue);">Type: ${currentStep?.stepType || 'instruction'}</span>
          </div>
          <div class="editor-col-body">
            ${
              currentStep
                ? `
              <div class="form-group">
                <label class="form-label">Step Title</label>
                <input id="ed-input-title" type="text" class="form-input" value="${currentStep.title}" />
              </div>

              <div class="form-group">
                <label class="form-label">Work Instruction Text</label>
                <textarea id="ed-input-instruction" class="form-textarea" style="min-height: 90px;">${currentStep.instruction}</textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Safety Warning (Shop-Floor Hazard)</label>
                <input id="ed-input-safety" type="text" class="form-input" value="${currentStep.safetyWarning || ''}" placeholder="e.g. Pinch hazard; wear protective gloves..." />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="form-group">
                  <label class="form-label">Associated 3D Component</label>
                  <select id="ed-select-component" class="form-select">
                    <option value="">None / General Workstation</option>
                    ${components
                      .map(
                        (c: ModelComponent) => `
                      <option value="${c.id}" ${currentStep.targetComponentId === c.id ? 'selected' : ''}>
                        ${c.name} (${c.partCode})
                      </option>
                    `
                      )
                      .join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Step Type</label>
                  <select id="ed-select-step-type" class="form-select">
                    <option value="instruction" ${currentStep.stepType === 'instruction' ? 'selected' : ''}>Instruction Card</option>
                    <option value="assembly_action" ${currentStep.stepType === 'assembly_action' ? 'selected' : ''}>Assembly Action (Direct Hand Grab)</option>
                    <option value="measurement" ${currentStep.stepType === 'measurement' ? 'selected' : ''}>Dimensional Measurement</option>
                    <option value="checkpoint" ${currentStep.stepType === 'checkpoint' ? 'selected' : ''}>Visual Checkpoint</option>
                    <option value="confirmation" ${currentStep.stepType === 'confirmation' ? 'selected' : ''}>Final Confirmation</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Media Attachment (Photo / Diagram / Video)</label>
                <div style="background-color: #0b1420; border: 1px dashed var(--border-subtle); border-radius: var(--radius-sm); padding: 14px; text-align: center;">
                  <span style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 8px;">Upload technical reference image or recorded video snippet</span>
                  <input type="file" id="ed-file-media" accept="image/*,video/*" style="font-size: 12px; color: var(--text-secondary);" />
                </div>
              </div>

              <!-- Vuforia-Style Visual & Spatial Callout Annotations -->
              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <label class="form-label" style="margin-bottom: 0;">Spatial & Media Callout Annotations</label>
                  <span style="font-size: 11px; color: #38bdf8; font-weight: 600;">Vuforia Vantage / XR Pin</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                  <div style="background: #0f1c2e; border: 1px solid #1e3a5f; border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">📍</span>
                    <div>
                      <div style="font-size: 11px; font-weight: 700; color: #fff;">3D Waypoint Pin</div>
                      <div style="font-size: 10px; color: #94a3b8;">${currentStep.targetComponentId || 'Workstation datum'}</div>
                    </div>
                  </div>
                  <div style="background: #0f1c2e; border: 1px solid #1e3a5f; border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">⚠️</span>
                    <div>
                      <div style="font-size: 11px; font-weight: 700; color: #fff;">Hazard Callout</div>
                      <div style="font-size: 10px; color: #94a3b8;">${currentStep.safetyWarning ? 'Active warning' : 'Standard caution'}</div>
                    </div>
                  </div>
                  <div style="background: #0f1c2e; border: 1px solid #1e3a5f; border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">📏</span>
                    <div>
                      <div style="font-size: 11px; font-weight: 700; color: #fff;">Measurement Datum</div>
                      <div style="font-size: 10px; color: #94a3b8;">${currentStep.inspectionRule ? `${currentStep.inspectionRule.nominalValue} mm +/- ${currentStep.inspectionRule.tolerance}` : 'Visual verification'}</div>
                    </div>
                  </div>
                  <div style="background: #0f1c2e; border: 1px solid #1e3a5f; border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">🔧</span>
                    <div>
                      <div style="font-size: 11px; font-weight: 700; color: #fff;">Interaction Mode</div>
                      <div style="font-size: 10px; color: #94a3b8;">${currentStep.interactionType}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Live Spatial Card Preview -->
              <div class="step-preview-card">
                <div class="step-preview-title">XR Spatial Panel Live Preview</div>
                <div style="background-color: #0d1622; border: 1px solid #243b53; border-radius: 8px; padding: 14px;">
                  <div style="color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px;">STEP ${selectedStepIndex + 1} OF ${steps.length}</div>
                  <div style="font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 6px;">${currentStep.title}</div>
                  <div style="font-size: 13px; color: #cbd5e1; line-height: 1.4; margin-bottom: 10px;">${currentStep.instruction}</div>
                  ${
                    currentStep.safetyWarning
                      ? `<div style="background: rgba(245, 158, 11, 0.12); border-left: 3px solid #f59e0b; padding: 6px 10px; font-size: 12px; color: #fbbf24; margin-bottom: 8px;">⚠️ ${currentStep.safetyWarning}</div>`
                      : ''
                  }
                  <div style="background-color: #172433; border-radius: 4px; padding: 8px; font-size: 12px; color: #38bdf8;">
                    <strong>CHECKPOINT:</strong> ${currentStep.checkpoint || 'Step verified.'}
                  </div>
                </div>
              </div>
            `
                : '<div style="color: var(--text-muted); text-align: center; padding: 40px;">Select a step to view and edit.</div>'
            }
          </div>
        </div>

        <!-- 3. Right Column: Properties & Inspection -->
        <div class="editor-column">
          <div class="editor-col-header">
            <span class="editor-col-title">Interaction & Quality Gate</span>
          </div>
          <div class="editor-col-body">
            ${
              currentStep
                ? `
              <div class="form-group">
                <label class="form-label">XR Interaction Mechanism</label>
                <select id="ed-select-interaction" class="form-select">
                  <option value="identify" ${currentStep.interactionType === 'identify' ? 'selected' : ''}>Identify / Point & Click (Ray)</option>
                  <option value="grab_and_seat" ${currentStep.interactionType === 'grab_and_seat' ? 'selected' : ''}>Pinch Grab & Snap (Hand Tracking)</option>
                  <option value="align_and_lock" ${currentStep.interactionType === 'align_and_lock' ? 'selected' : ''}>Align & Lock Collar</option>
                  <option value="measure" ${currentStep.interactionType === 'measure' ? 'selected' : ''}>Simulated Caliper Gauge (Keypad)</option>
                  <option value="review" ${currentStep.interactionType === 'review' ? 'selected' : ''}>Review & Certification</option>
                </select>
                <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px;">Controls the physical interaction required in the WebXR scene.</span>
              </div>

              <div class="form-group">
                <label class="form-label">Acceptance Checkpoint Criteria</label>
                <textarea id="ed-input-checkpoint" class="form-textarea" style="min-height: 70px;">${currentStep.checkpoint || ''}</textarea>
                <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px;">Operator must satisfy this checkpoint before certification.</span>
              </div>

              <div class="form-group">
                <label class="form-label">Estimated Duration (seconds)</label>
                <input id="ed-input-duration" type="number" min="5" max="600" class="form-input" value="${currentStep.estimatedDurationSeconds}" />
              </div>

              <div style="border-top: 1px solid var(--border-subtle); padding-top: 16px; margin-top: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                  <span style="font-size: 12px; font-weight: 700; color: #fff; text-transform: uppercase;">Dimensional Inspection Gate</span>
                  <input type="checkbox" id="ed-check-has-inspection" ${currentStep.inspectionRule ? 'checked' : ''} />
                </div>

                <div id="ed-inspection-fields" style="${currentStep.inspectionRule ? 'display: block;' : 'display: none;'}">
                  <div class="form-group">
                    <label class="form-label">Nominal Dimension</label>
                    <input id="ed-input-nominal" type="number" step="0.01" class="form-input" value="${currentStep.inspectionRule?.nominalValue ?? 24.00}" />
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="form-group">
                      <label class="form-label">Tolerance (±)</label>
                      <input id="ed-input-tolerance" type="number" step="0.01" class="form-input" value="${currentStep.inspectionRule?.tolerance ?? 0.10}" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Unit</label>
                      <input id="ed-input-unit" type="text" class="form-input" value="${currentStep.inspectionRule?.unit ?? 'mm'}" />
                    </div>
                  </div>
                  <div style="background-color: #122133; border: 1px solid #1e3a5f; border-radius: var(--radius-sm); padding: 10px; font-size: 12px; color: var(--accent-amber);">
                    Acceptable PASS Range: 
                    <strong id="ed-range-preview">
                      ${(Number(currentStep.inspectionRule?.nominalValue ?? 24.0) - Number(currentStep.inspectionRule?.tolerance ?? 0.1)).toFixed(2)} – ${(Number(currentStep.inspectionRule?.nominalValue ?? 24.0) + Number(currentStep.inspectionRule?.tolerance ?? 0.1)).toFixed(2)} mm
                    </strong>
                  </div>
                </div>
              </div>

              <!-- Vuforia-Style Safety & PPE Compliance Gate -->
              <div style="border-top: 1px solid var(--border-subtle); padding-top: 16px; margin-top: 16px;">
                <div style="font-size: 12px; font-weight: 700; color: #fff; text-transform: uppercase; margin-bottom: 8px;">
                  Safety & PPE Compliance Checklist
                </div>
                <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">
                  Operator must acknowledge mandatory PPE and hazard controls before performing this step in XR.
                </p>
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #cbd5e1;">
                    <input type="checkbox" id="ed-ppe-glasses" checked />
                    🥽 Safety Glasses (ANSI Z87.1 Approved)
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #cbd5e1;">
                    <input type="checkbox" id="ed-ppe-gloves" checked />
                    🧤 Nitrile / Cut-Resistant Mechanics Gloves
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #cbd5e1;">
                    <input type="checkbox" id="ed-ppe-pressure" checked />
                    ⚡ Hydraulic Pressure Relief & Zero-Energy State
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #cbd5e1;">
                    <input type="checkbox" id="ed-ppe-boots" />
                    🥾 Steel-Toe Safety Boots
                  </label>
                </div>
              </div>
            `
                : ''
            }
          </div>
        </div>
      </div>
    `;

    // Bind Left Column Controls
    container.querySelectorAll('.step-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).tagName === 'BUTTON') return;
        const idx = Number((e.currentTarget as HTMLElement).getAttribute('data-step-idx'));
        selectedStepIndex = idx;
        render();
      });
    });

    container.querySelector('#ed-btn-add-step')?.addEventListener('click', () => {
      const newStep: ProcedureStep = {
        id: `step-${Date.now()}-${steps.length + 1}`,
        order: steps.length + 1,
        title: `New Step ${steps.length + 1}`,
        instruction: 'Enter step instruction details here.',
        stepType: 'instruction',
        interactionType: 'identify',
        targetComponentId: 'barrel',
        checkpoint: 'Step criteria verified.',
        estimatedDurationSeconds: 45,
      };
      procedure.activeDraftSteps.push(newStep);
      selectedStepIndex = procedure.activeDraftSteps.length - 1;
      isDirty = true;
      render();
    });

    container.querySelectorAll('.ed-step-up').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = Number((e.currentTarget as HTMLElement).getAttribute('data-step-idx'));
        if (idx > 0) {
          const temp = steps[idx];
          steps[idx] = steps[idx - 1];
          steps[idx - 1] = temp;
          steps.forEach((s: ProcedureStep, i: number) => (s.order = i + 1));
          selectedStepIndex = idx - 1;
          isDirty = true;
          render();
        }
      });
    });

    container.querySelectorAll('.ed-step-down').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = Number((e.currentTarget as HTMLElement).getAttribute('data-step-idx'));
        if (idx < steps.length - 1) {
          const temp = steps[idx];
          steps[idx] = steps[idx + 1];
          steps[idx + 1] = temp;
          steps.forEach((s: ProcedureStep, i: number) => (s.order = i + 1));
          selectedStepIndex = idx + 1;
          isDirty = true;
          render();
        }
      });
    });

    container.querySelectorAll('.ed-step-del').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = Number((e.currentTarget as HTMLElement).getAttribute('data-step-idx'));
        if (steps.length <= 1) {
          alert('A procedure must have at least one step.');
          return;
        }
        steps.splice(idx, 1);
        steps.forEach((s: ProcedureStep, i: number) => (s.order = i + 1));
        selectedStepIndex = Math.max(0, idx - 1);
        isDirty = true;
        render();
      });
    });

    // Bind Center Column Inputs
    if (currentStep) {
      container.querySelector('#ed-input-title')?.addEventListener('input', (e) => {
        currentStep.title = (e.target as HTMLInputElement).value;
        isDirty = true;
      });

      container.querySelector('#ed-input-instruction')?.addEventListener('input', (e) => {
        currentStep.instruction = (e.target as HTMLTextAreaElement).value;
        isDirty = true;
      });

      container.querySelector('#ed-input-safety')?.addEventListener('input', (e) => {
        currentStep.safetyWarning = (e.target as HTMLInputElement).value;
        isDirty = true;
      });

      container.querySelector('#ed-select-component')?.addEventListener('change', (e) => {
        currentStep.targetComponentId = (e.target as HTMLSelectElement).value as any;
        isDirty = true;
      });

      container.querySelector('#ed-select-step-type')?.addEventListener('change', (e) => {
        currentStep.stepType = (e.target as HTMLSelectElement).value as any;
        isDirty = true;
      });

      container.querySelector('#ed-select-interaction')?.addEventListener('change', (e) => {
        currentStep.interactionType = (e.target as HTMLSelectElement).value as any;
        isDirty = true;
      });

      container.querySelector('#ed-input-checkpoint')?.addEventListener('input', (e) => {
        currentStep.checkpoint = (e.target as HTMLTextAreaElement).value;
        isDirty = true;
      });

      container.querySelector('#ed-input-duration')?.addEventListener('input', (e) => {
        currentStep.estimatedDurationSeconds = Number((e.target as HTMLInputElement).value) || 30;
        isDirty = true;
      });

      // Inspection Checkbox
      const checkInsp = container.querySelector('#ed-check-has-inspection') as HTMLInputElement;
      checkInsp?.addEventListener('change', () => {
        if (checkInsp.checked) {
          currentStep.inspectionRule = {
            id: `rule-${Date.now()}`,
            parameterName: 'Seating Depth Clearance',
            nominalValue: 24.00,
            tolerance: 0.10,
            unit: 'mm',
            minAcceptable: 23.90,
            maxAcceptable: 24.10,
            description: 'Nominal 24.00 mm (±0.10 mm)',
          };
        } else {
          delete currentStep.inspectionRule;
        }
        isDirty = true;
        render();
      });

      // Inspection Fields Update
      const updateInspection = () => {
        if (!currentStep.inspectionRule) return;
        const nom = Number((container.querySelector('#ed-input-nominal') as HTMLInputElement)?.value) || 24.00;
        const tol = Number((container.querySelector('#ed-input-tolerance') as HTMLInputElement)?.value) || 0.10;
        const unit = (container.querySelector('#ed-input-unit') as HTMLInputElement)?.value || 'mm';

        const minAcc = Math.round((nom - tol) * 100) / 100;
        const maxAcc = Math.round((nom + tol) * 100) / 100;
        currentStep.inspectionRule = {
          id: currentStep.inspectionRule.id,
          parameterName: currentStep.inspectionRule.parameterName,
          nominalValue: nom,
          tolerance: tol,
          unit,
          minAcceptable: minAcc,
          maxAcceptable: maxAcc,
          description: `Nominal ${nom.toFixed(2)} ${unit} (±${tol.toFixed(2)} ${unit})`,
        };

        const preview = container.querySelector('#ed-range-preview');
        if (preview) {
          preview.textContent = `${minAcc.toFixed(2)} – ${maxAcc.toFixed(2)} ${unit}`;
        }
        isDirty = true;
      };

      container.querySelector('#ed-input-nominal')?.addEventListener('input', updateInspection);
      container.querySelector('#ed-input-tolerance')?.addEventListener('input', updateInspection);
      container.querySelector('#ed-input-unit')?.addEventListener('input', updateInspection);
    }

    // Top Action Handlers
    container.querySelector('#ed-btn-back')?.addEventListener('click', () => {
      if (isDirty && !confirm('You have unsaved changes. Return to library?')) return;
      onNavigate('procedures');
    });

    container.querySelector('#ed-btn-save-draft')?.addEventListener('click', () => {
      storageRepository.saveProcedure(procedure);
      isDirty = false;
      alert(`Draft for "${procedure.title}" saved successfully to LocalStorage.`);
      render();
    });

    container.querySelector('#ed-btn-publish')?.addEventListener('click', () => {
      const summary = prompt('Enter change summary for this published revision:', 'Validated industrial training revision.');
      if (summary === null) return;

      try {
        storageRepository.saveProcedure(procedure);
        const published = storageRepository.publishProcedure(procedure.id, summary);
        if (published) {
          procedure = published;
          isDirty = false;
          alert(`Revision ${procedure.currentRevisionNumber}.0 successfully published and locked for training!`);
          render();
        }
      } catch (err: any) {
        alert(err.message || 'Error publishing procedure.');
      }
    });

    container.querySelector('#ed-btn-launch-xr')?.addEventListener('click', () => {
      storageRepository.saveProcedure(procedure);
      onNavigate('xr-player', procedure.id);
    });
  };

  render();
}
