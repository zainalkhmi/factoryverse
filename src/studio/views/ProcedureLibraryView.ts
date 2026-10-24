/**
 * FactoryVerse Studio - Procedure Library View
 * Full procedure catalog with search, filtering, duplicate, archive, delete, and XR launch.
 */

import { storageRepository } from '../../storage/storage-repository';
import type { Procedure, ProcedureStatus } from '../../types';
import { barcodeScannerService } from '../services/barcode-scanner-service';

export function renderProcedureLibraryView(
  container: HTMLElement,
  onNavigate: (viewId: string, param?: string) => void
): void {
  let searchTerm = '';
  let statusFilter: string = 'all';
  let categoryFilter: string = 'all';
  let sortBy: 'updatedAt' | 'title' | 'status' = 'updatedAt';

  const render = () => {
    let list = storageRepository.getProcedures();

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.author.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.category === categoryFilter);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 700; color: #fff;">Standard Operating Procedures</h2>
          <p style="font-size: 13px; color: var(--text-secondary);">Manage, version, publish, and deploy interactive training sequences.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="lib-btn-scan-qr" class="btn btn-secondary">
            <span>📷</span> Scan Machine QR
          </button>
          <button id="lib-btn-create-new" class="btn btn-primary">
            <span>+</span> Create Procedure
          </button>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div style="background-color: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <input 
          id="lib-search-input" 
          type="text" 
          placeholder="Search by code, title, or author..." 
          value="${searchTerm}" 
          class="form-input" 
          style="max-width: 320px;"
        />

        <select id="lib-status-filter" class="form-select" style="max-width: 160px;">
          <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
          <option value="published" ${statusFilter === 'published' ? 'selected' : ''}>Published</option>
          <option value="draft" ${statusFilter === 'draft' ? 'selected' : ''}>Draft</option>
          <option value="archived" ${statusFilter === 'archived' ? 'selected' : ''}>Archived</option>
        </select>

        <select id="lib-category-filter" class="form-select" style="max-width: 160px;">
          <option value="all" ${categoryFilter === 'all' ? 'selected' : ''}>All Categories</option>
          <option value="Assembly" ${categoryFilter === 'Assembly' ? 'selected' : ''}>Assembly</option>
          <option value="Inspection" ${categoryFilter === 'Inspection' ? 'selected' : ''}>Inspection</option>
          <option value="Maintenance" ${categoryFilter === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
          <option value="Safety" ${categoryFilter === 'Safety' ? 'selected' : ''}>Safety</option>
        </select>

        <select id="lib-sort-select" class="form-select" style="max-width: 180px;">
          <option value="updatedAt" ${sortBy === 'updatedAt' ? 'selected' : ''}>Sort by: Last Updated</option>
          <option value="title" ${sortBy === 'title' ? 'selected' : ''}>Sort by: Title</option>
          <option value="status" ${sortBy === 'status' ? 'selected' : ''}>Sort by: Status</option>
        </select>
      </div>

      <!-- Procedures Table -->
      <div class="table-card">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Procedure Details</th>
              <th>Category</th>
              <th>Status</th>
              <th>Revision</th>
              <th>Steps</th>
              <th>Duration</th>
              <th>Last Updated</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              list.length === 0
                ? `<tr><td colspan="8" style="text-align: center; padding: 36px; color: var(--text-muted);">No procedures match the selected filters.</td></tr>`
                : list
                    .map(
                      (p) => `
              <tr>
                <td>
                  <div style="font-weight: 700; color: #fff; font-size: 14px;">${p.code} · ${p.title}</div>
                  <div style="font-size: 12px; color: var(--text-muted); max-width: 380px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${p.description}
                  </div>
                  <div style="font-size: 11px; color: var(--text-secondary); margin-top: 3px;">Author: ${p.author}</div>
                </td>
                <td>
                  <span class="breadcrumb-tag">${p.category}</span>
                </td>
                <td>
                  <span class="badge ${p.status === 'published' ? 'badge-published' : p.status === 'draft' ? 'badge-draft' : 'badge-archived'}">
                    ${p.status}
                  </span>
                </td>
                <td><span style="font-weight: 600; color: #fff;">v${p.currentRevisionNumber}.0</span></td>
                <td>${p.activeDraftSteps?.length || 0} steps</td>
                <td>${p.estimatedTotalDurationMinutes} min</td>
                <td style="font-size: 12px;">${new Date(p.updatedAt).toLocaleDateString()}</td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 6px;">
                    ${
                      p.status === 'published'
                        ? `<button class="btn btn-amber btn-sm lib-btn-launch" data-id="${p.id}" title="Launch in XR Player">🥽 Play</button>`
                        : ''
                    }
                    <button class="btn btn-secondary btn-sm lib-btn-edit" data-id="${p.id}">Edit</button>
                    <button class="btn btn-secondary btn-sm lib-btn-duplicate" data-id="${p.id}" title="Duplicate">Copy</button>
                    <button class="btn btn-danger btn-sm lib-btn-delete" data-id="${p.id}" title="Delete">✕</button>
                  </div>
                </td>
              </tr>
            `
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
    `;

    // Event Handlers
    container.querySelector('#lib-search-input')?.addEventListener('input', (e) => {
      searchTerm = (e.target as HTMLInputElement).value;
      render();
    });

    container.querySelector('#lib-status-filter')?.addEventListener('change', (e) => {
      statusFilter = (e.target as HTMLSelectElement).value;
      render();
    });

    container.querySelector('#lib-category-filter')?.addEventListener('change', (e) => {
      categoryFilter = (e.target as HTMLSelectElement).value;
      render();
    });

    container.querySelector('#lib-sort-select')?.addEventListener('change', (e) => {
      sortBy = (e.target as HTMLSelectElement).value as any;
      render();
    });

    container.querySelector('#lib-btn-create-new')?.addEventListener('click', () => {
      onNavigate('editor', 'new');
    });

    container.querySelector('#lib-btn-scan-qr')?.addEventListener('click', () => {
      barcodeScannerService.openScannerModal((procId) => {
        onNavigate('xr-player', procId);
      });
    });

    container.querySelectorAll('.lib-btn-launch').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (id) onNavigate('xr-player', id);
      });
    });

    container.querySelectorAll('.lib-btn-edit').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (id) onNavigate('editor', id);
      });
    });

    container.querySelectorAll('.lib-btn-duplicate').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (!id) return;
        const original = storageRepository.getProcedureById(id);
        if (!original) return;

        const duplicated: Procedure = {
          ...JSON.parse(JSON.stringify(original)),
          id: `proc-copy-${Date.now()}`,
          code: `${original.code}-COPY`,
          title: `${original.title} (Copy)`,
          status: 'draft',
          currentRevisionNumber: 0,
          revisions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        storageRepository.saveProcedure(duplicated);
        render();
      });
    });

    container.querySelectorAll('.lib-btn-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (!id) return;
        const proc = storageRepository.getProcedureById(id);
        if (confirm(`Are you sure you want to delete procedure "${proc?.title || id}"?`)) {
          storageRepository.deleteProcedure(id);
          render();
        }
      });
    });
  };

  render();
}
