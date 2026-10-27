/**
 * FactoryVerse Studio - Vuforia New Project Creation Modal
 * Parity with PTC Vuforia Studio (ThingWorx Studio) New Project Dialog:
 * Allows user to define project name, select experience template, and choose CAD model.
 */

import {
  vuforiaProjectService,
  VUFORIA_PROJECT_TEMPLATES,
  type VuforiaProject,
  type VuforiaProjectTemplate,
} from '../services/vuforia-project-service';
import { storageRepository } from '../../storage/storage-repository';
import type { VuforiaAugmentation } from './VuforiaStudioView';

export interface VuforiaNewProjectModalOptions {
  onProjectCreated: (result: {
    project: VuforiaProject;
    augmentations: VuforiaAugmentation[];
    modelIndex: number;
  }) => void;
  onClose?: () => void;
}

export function openVuforiaNewProjectModal(options: VuforiaNewProjectModalOptions): void {
  const existing = document.getElementById('vf-new-project-modal');
  if (existing) existing.remove();

  const models = storageRepository.getModels();
  let selectedTemplate: VuforiaProjectTemplate = 'assembly_qa';
  let projectName = `Industrial AR Project #${Math.floor(100 + Math.random() * 900)}`;
  let selectedModelIdx = 0;
  let description = '';

  const modal = document.createElement('div');
  modal.id = 'vf-new-project-modal';
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
  `;

  const renderModal = () => {
    modal.innerHTML = `
      <div style="max-width: 680px; width: 100%; background: #09111c; border: 1px solid #1e3a5f; border-radius: 12px; box-shadow: 0 25px 60px rgba(0,0,0,0.85); overflow: hidden; display: flex; flex-direction: column; animation: vfFadeIn 0.2s ease;">
        
        <!-- Header -->
        <div style="padding: 16px 20px; background: #0c182a; border-bottom: 1px solid #1e3a5f; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 34px; height: 34px; border-radius: 6px; background: linear-gradient(135deg, #0284c7, #38bdf8); display: flex; align-items: center; justify-content: center; font-size: 18px;">
              📁
            </div>
            <div>
              <h2 style="font-size: 15px; font-weight: 700; margin: 0; color: #fff;">Create New Vuforia Studio Project</h2>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
                Define project name, experience template, and target 3D CAD asset
              </div>
            </div>
          </div>
          <button id="vf-npm-btn-close" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; padding: 2px 6px; line-height: 1; border-radius: 4px;">✕</button>
        </div>

        <!-- Form Body -->
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px; max-height: calc(85vh - 120px); overflow-y: auto;">
          
          <!-- Field 1: Project Name -->
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">
              Project Name <span style="color: #f43f5e;">*</span>
            </label>
            <div style="position: relative; display: flex; align-items: center;">
              <input id="vf-npm-input-name" data-testid="vf-npm-input-name" type="text" class="form-input" value="${projectName}" placeholder="e.g. Hydraulic Cylinder AR Inspection" style="font-size: 13px; font-weight: 600; padding: 8px 12px; width: 100%; background: #060d17; border: 1px solid #1e3a5f; border-radius: 6px; color: #fff;" />
            </div>
          </div>

          <!-- Field 2: Experience Template Selector -->
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">
              Select Experience Template
            </label>
            <div id="vf-npm-templates-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              ${VUFORIA_PROJECT_TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplate;
                return `
                  <div class="vf-npm-template-card" data-template="${tmpl.id}" data-testid="vf-template-${tmpl.id}" style="padding: 12px; background: ${isSelected ? '#10243e' : '#070e18'}; border: 2px solid ${isSelected ? '#38bdf8' : '#1e3a5f'}; border-radius: 8px; cursor: pointer; transition: all 0.15s ease;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                      <span style="font-size: 18px;">${tmpl.icon}</span>
                      <strong class="vf-tmpl-title" style="font-size: 12px; color: ${isSelected ? '#fff' : '#cbd5e1'};">${tmpl.title}</strong>
                    </div>
                    <p style="font-size: 10px; color: #94a3b8; margin: 0; line-height: 1.4;">
                      ${tmpl.description}
                    </p>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Field 3: 3D CAD Resource Model -->
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">
              Base 3D CAD Assembly Resource
            </label>
            <select id="vf-npm-select-model" class="form-select" style="font-size: 12px; padding: 7px 10px; width: 100%; background: #060d17; border: 1px solid #1e3a5f; border-radius: 6px; color: #fff;">
              ${models.map((m, idx) => `
                <option value="${idx}" ${idx === selectedModelIdx ? 'selected' : ''}>
                  ${m.name} (${m.format.toUpperCase()}) — ${m.category}
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Template Summary Preview -->
          <div style="background: rgba(56, 189, 248, 0.06); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 6px; padding: 10px 12px; font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">💡</span>
            <div>
              <span style="color: #38bdf8; font-weight: 700;">Zero-Install WebXR AR Authoring:</span>
              <span id="vf-npm-summary-text">Initializes a fresh workspace in Vuforia Studio with calibrated tracking and 6DoF spatial coordinates.</span>
            </div>
          </div>

        </div>

        <!-- Footer Actions -->
        <div style="padding: 14px 20px; background: #070e18; border-top: 1px solid #1e3a5f; display: flex; justify-content: flex-end; align-items: center; gap: 10px;">
          <button id="vf-npm-btn-cancel" class="btn btn-secondary btn-sm" style="padding: 6px 14px;">
            Cancel
          </button>
          <button id="vf-npm-btn-create" data-testid="vf-npm-btn-create" class="btn btn-primary btn-sm" style="padding: 6px 18px; font-weight: 700; background: linear-gradient(135deg, #0284c7, #38bdf8); color: #000;">
            ⚡ Create Project
          </button>
        </div>

      </div>
    `;

    // Event Bindings
    modal.querySelector('#vf-npm-btn-close')?.addEventListener('click', () => {
      modal.remove();
      options.onClose?.();
    });

    modal.querySelector('#vf-npm-btn-cancel')?.addEventListener('click', () => {
      modal.remove();
      options.onClose?.();
    });

    const inputName = modal.querySelector('#vf-npm-input-name') as HTMLInputElement;
    inputName?.addEventListener('input', (e) => {
      projectName = (e.target as HTMLInputElement).value;
    });

    const updateTemplateSelectionUI = (tmplId: VuforiaProjectTemplate) => {
      selectedTemplate = tmplId;
      modal.querySelectorAll('.vf-npm-template-card').forEach((card) => {
        const cTmpl = card.getAttribute('data-template');
        const isMatch = cTmpl === tmplId;
        (card as HTMLElement).style.background = isMatch ? '#10243e' : '#070e18';
        (card as HTMLElement).style.borderColor = isMatch ? '#38bdf8' : '#1e3a5f';
        const titleEl = card.querySelector('.vf-tmpl-title') as HTMLElement;
        if (titleEl) {
          titleEl.style.color = isMatch ? '#fff' : '#cbd5e1';
        }
      });
      const summaryEl = modal.querySelector('#vf-npm-summary-text');
      if (summaryEl) {
        if (tmplId === 'blank') {
          summaryEl.textContent = 'Creates an empty spatial canvas without preloaded annotations, ready for full custom authoring.';
        } else if (tmplId === 'assembly_qa') {
          summaryEl.textContent = 'Pre-loads CAD datum points, seal groove tolerances, and dimensional verification annotations.';
        } else if (tmplId === 'maintenance_iot') {
          summaryEl.textContent = 'Pre-loads live ThingWorx IoT telemetry bindings (hydraulic pressure, oil temp, vibration).';
        } else if (tmplId === 'sop_instruction') {
          summaryEl.textContent = 'Pre-loads operator SOP step-by-step procedures and safety lockout waypoint markers.';
        }
      }
    };

    modal.querySelectorAll('.vf-npm-template-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        const tmplId = (e.currentTarget as HTMLElement).getAttribute('data-template') as VuforiaProjectTemplate;
        updateTemplateSelectionUI(tmplId);
      });
    });

    const selectModel = modal.querySelector('#vf-npm-select-model') as HTMLSelectElement;
    selectModel?.addEventListener('change', (e) => {
      selectedModelIdx = Number((e.target as HTMLSelectElement).value);
    });

    modal.querySelector('#vf-npm-btn-create')?.addEventListener('click', () => {
      const liveName = inputName ? inputName.value.trim() : projectName.trim();
      const finalName = liveName || `Industrial AR Project #${Math.floor(100 + Math.random() * 900)}`;
      const liveModelIdx = selectModel ? Number(selectModel.value) : selectedModelIdx;
      const chosenModel = models[liveModelIdx] || models[0];

      const { project, augmentations } = vuforiaProjectService.createNewProject({
        name: finalName,
        template: selectedTemplate,
        modelId: chosenModel ? chosenModel.id : 'model-hydraulic-cyl-01',
      });

      options.onProjectCreated({
        project,
        augmentations,
        modelIndex: liveModelIdx,
      });

      modal.remove();
    });

    setTimeout(() => {
      inputName?.focus();
      inputName?.select();
    }, 50);
  };

  document.body.appendChild(modal);
  renderModal();
}
