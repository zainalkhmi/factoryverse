/**
 * FactoryVerse Studio - User & Role Management View
 * Manage shop-floor permissions for Authors, Quality Inspectors, and Trainees.
 */

import { storageRepository } from '../../storage/storage-repository';
import type { UserAccount, UserRole } from '../../types';

export function renderUserRolesView(
  container: HTMLElement,
  _onNavigate: (viewId: string, param?: string) => void
): void {
  const users = storageRepository.getUsers();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h2 style="font-size: 20px; font-weight: 700; color: #fff;">User & Role Management</h2>
        <p style="font-size: 13px; color: var(--text-secondary);">Configure operator access levels, procedure authoring rights, and QA audit roles.</p>
      </div>
      <button id="usr-btn-add" class="btn btn-primary btn-sm">+ Add User</button>
    </div>

    <div class="table-card">
      <table class="custom-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Permissions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users
            .map(
              (u) => `
            <tr>
              <td>
                <div style="font-weight: 700; color: #fff;">${u.name}</div>
                <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${u.id}</div>
              </td>
              <td>${u.email}</td>
              <td>
                <span class="badge ${u.role === 'Administrator' ? 'badge-published' : u.role === 'Quality_Inspector' ? 'badge-fail' : 'badge-draft'}">
                  ${u.role.replace('_', ' ')}
                </span>
              </td>
              <td>
                <span style="color: var(--accent-emerald); font-weight: 600;">Active</span>
              </td>
              <td style="font-size: 12px; color: var(--text-secondary);">
                ${
                  u.role === 'Administrator'
                    ? 'Full Admin, Publishing, Analytics, RBAC'
                    : u.role === 'Author'
                    ? 'Draft Procedures, Expert Capture, Edit Steps'
                    : u.role === 'Quality_Inspector'
                    ? 'Tolerance Calibration, Audit Review, Sign-off'
                    : 'Execute VR Training Scenarios'
                }
              </td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="alert('User settings updated.')">Edit</button>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelector('#usr-btn-add')?.addEventListener('click', () => {
    alert('Add user modal: Enter new technician name, email, and assign role.');
  });
}
