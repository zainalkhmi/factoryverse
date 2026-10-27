/**
 * FactoryVerse Studio - Vuforia Edit Project Modal
 * Allows operators and engineers to edit active project metadata,
 * change associated CAD assembly, update description, export project package, or delete project.
 */

import {
  vuforiaProjectService,
  VUFORIA_PROJECT_TEMPLATES,
  type VuforiaProject,
  type VuforiaProjectTemplate,
} from '../services/vuforia-project-service';
import { storageRepository } from '../../storage/storage-repository';

export interface VuforiaEditProjectModalOptions {
  project: VuforiaProject;
  onProjectUpdated: (result: {
    project: VuforiaProject;
    modelIndex: number;
  }) => void;
  onProjectDeleted?: (remainingProject: VuforiaProject) => void;
  onClose?: () => void;
}

export function openVuforiaEditProjectModal(options: VuforiaEditProjectModalOptions): void {
  const existing = document.getElementById('vf-edit-project-modal');
  if (existing) existing.remove();

  const models = storageRepository.getModels();
  const current = options.project;

  let modelIdx = models.findIndex((m) => m.id === current.associatedModelId);
  if (modelIdx < 0) modelIdx = 0;

  const modal = document.createElement('div');
  modal.id = 'vf-edit-project-modal';
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

  modal.innerHTML = `
    <div style="max-width: 620px; width: 100%; background: #09111c; border: 1px solid #1e3a5f; border-radius: 12px; box-shadow: 0 25px 60px rgba(0,0,0,0.85); overflow: hidden; display: flex; flex-direction: column; animation: vfFadeIn 0.2s ease;">
      
      <!-- Header -->
      <div style="padding: 16px 20px; background: #0c182a; border-bottom: 1px solid #1e3a5f; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 34px; height: 34px; border-radius: 6px; background: linear-gradient(135deg, #0284c7, #38bdf8); display: flex; align-items: center; justify-content: center; font-size: 18px;">
            ✏️
          </div>
          <div>
            <h2 style="font-size: 15px; font-weight: 700; margin: 0; color: #fff;">Edit Vuforia Studio Project</h2>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
              ID: <code style="color: #38bdf8; font-family: monospace;">${current.id}</code> · Created: ${current.dateCreated}
            </div>
          </div>
        </div>
        <button id="vf-epm-btn-close" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; padding: 2px 6px; line-height: 1; border-radius: 4px;">✕</button>
      </div>

      <!-- Form Body -->
      <div style="padding: 20px; display: flex; flex-direction: column; gap: 14px; max-height: calc(85vh - 120px); overflow-y: auto;">
        
        <!-- Field 1: Project Name -->
        <div>
          <label style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">
            Project Name <span style="color: #f43f5e;">*</span>
          </label>
          <input id="vf-epm-input-name" data-testid="vf-epm-input-name" type="text" class="form-input" value="${current.name}" style="font-size: 13px; font-weight: 600; padding: 8px 12px; width: 100%; background: #060d17; border: 1px solid #1e3a5f; border-radius: 6px; color: #fff;" />
        </div>

        <!-- Field 2: Description -->
        <div>
          <label style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">
            Description & Procedure Notes
          </label>
          <textarea id="vf-epm-input-desc" rows="3" class="form-input" placeholder="Project purpose, engineering datums, SOP instructions..." style="font-size: 12px; padding: 8px 12px; width: 100%; background: #060d17; border: 1px solid #1e3a5f; border-radius: 6px; color: #cbd5e1; resize: vertical;">${current.description || ''}</textarea>
        </div>

        <!-- Field 3: 3D CAD Resource Model -->
        <div>
          <label style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">
            Target 3D CAD Assembly Resource
          </label>
          <select id="vf-epm-select-model" class="form-select" style="font-size: 12px; padding: 7px 10px; width: 100%; background: #060d17; border: 1px solid #1e3a5f; border-radius: 6px; color: #fff;">
            ${models.map((m, idx) => `
              <option value="${idx}" ${idx === modelIdx ? 'selected' : ''}>
                ${m.name} (${m.format.toUpperCase()}) — ${m.category}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Field 4: Experience Template -->
        <div>
          <label style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">
            Experience Template Type
          </label>
          <select id="vf-epm-select-template" class="form-select" style="font-size: 12px; padding: 7px 10px; width: 100%; background: #060d17; border: 1px solid #1e3a5f; border-radius: 6px; color: #fff;">
            ${VUFORIA_PROJECT_TEMPLATES.map((t) => `
              <option value="${t.id}" ${t.id === current.template ? 'selected' : ''}>
                ${t.icon} ${t.title}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Metadata Info Box -->
        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid #1e3a5f; border-radius: 6px; padding: 10px 12px; font-size: 11px; color: #94a3b8; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>• Augmentations: <strong style="color: #38bdf8;">${current.augmentations?.length || 0}</strong></div>
          <div>• Target Format: <strong style="color: #4ade80;">${(current.targetType || 'model_target').toUpperCase().replace('_', ' ')}</strong></div>
          <div>• Last Modified: <span style="color: #cbd5e1;">${current.dateModified || current.dateCreated}</span></div>
          <div>• Target ID: <code style="color: #e2e8f0; font-family: monospace;">${current.targetId || 'vt-model-cyl-01'}</code></div>
        </div>

      </div>

      <!-- Footer Actions -->
      <div style="padding: 14px 20px; background: #070e18; border-top: 1px solid #1e3a5f; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
        <div style="display: flex; gap: 8px;">
          <button id="vf-epm-btn-export" class="btn btn-secondary btn-sm" style="padding: 6px 12px; font-size: 11px;" title="Export this project as a JSON file">
            📤 Export JSON
          </button>
          <button id="vf-epm-btn-delete" class="btn btn-danger btn-sm" style="padding: 6px 12px; font-size: 11px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #ef4444;" title="Delete this project permanently">
            🗑️ Delete
          </button>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="vf-epm-btn-cancel" class="btn btn-secondary btn-sm" style="padding: 6px 14px;">
            Cancel
          </button>
          <button id="vf-epm-btn-save" data-testid="vf-epm-btn-save" class="btn btn-primary btn-sm" style="padding: 6px 18px; font-weight: 700; background: linear-gradient(135deg, #0284c7, #38bdf8); color: #000;">
            💾 Save Changes
          </button>
        </div>
      </div>

    </div>
  `;

  // Close handlers
  modal.querySelector('#vf-epm-btn-close')?.addEventListener('click', () => {
    modal.remove();
    options.onClose?.();
  });
  modal.querySelector('#vf-epm-btn-cancel')?.addEventListener('click', () => {
    modal.remove();
    options.onClose?.();
  });

  // Export JSON action
  modal.querySelector('#vf-epm-btn-export')?.addEventListener('click', () => {
    const { filename, json } = vuforiaProjectService.exportProjectJSON(current.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Delete action
  modal.querySelector('#vf-epm-btn-delete')?.addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete project "${current.name}"?`)) {
      const remaining = vuforiaProjectService.deleteProject(current.id);
      options.onProjectDeleted?.(remaining);
      modal.remove();
    }
  });

  // Save changes action
  modal.querySelector('#vf-epm-btn-save')?.addEventListener('click', () => {
    const nameInput = modal.querySelector('#vf-epm-input-name') as HTMLInputElement;
    const descInput = modal.querySelector('#vf-epm-input-desc') as HTMLTextAreaElement;
    const modelSelect = modal.querySelector('#vf-epm-select-model') as HTMLSelectElement;
    const templateSelect = modal.querySelector('#vf-epm-select-template') as HTMLSelectElement;

    const newName = nameInput ? nameInput.value.trim() : current.name;
    const newDesc = descInput ? descInput.value.trim() : current.description;
    const selectedModelIndex = modelSelect ? Number(modelSelect.value) : modelIdx;
    const chosenModel = models[selectedModelIndex] || models[0];
    const newTemplate = (templateSelect ? templateSelect.value : current.template) as VuforiaProjectTemplate;

    const updated = vuforiaProjectService.updateProject(current.id, {
      name: newName || current.name,
      description: newDesc,
      associatedModelId: chosenModel.id,
      template: newTemplate,
    });

    options.onProjectUpdated({
      project: updated,
      modelIndex: selectedModelIndex,
    });

    modal.remove();
  });

  document.body.appendChild(modal);

  const nameInput = modal.querySelector('#vf-epm-input-name') as HTMLInputElement;
  setTimeout(() => {
    nameInput?.focus();
    nameInput?.select();
  }, 50);
}
