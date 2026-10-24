/**
 * FactoryVerse Studio - Dashboard View
 * Provides derived metrics, recent activity feeds, and quick workflow launches.
 */

import { storageRepository } from '../../storage/storage-repository';

export function renderDashboardView(container: HTMLElement, onNavigate: (viewId: string, param?: string) => void): void {
  const stats = storageRepository.getStats();
  const procedures = storageRepository.getProcedures().slice(0, 5);
  const sessions = storageRepository.getTrainingSessions().slice(0, 5);

  container.innerHTML = `
    <!-- Top KPI Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-title">Total Procedures</span>
        <span class="stat-value">${stats.totalProcedures}</span>
        <span class="stat-meta">${stats.publishedProcedures} published · ${stats.draftProcedures} draft</span>
      </div>
      <div class="stat-card">
        <span class="stat-title">Training Sessions</span>
        <span class="stat-value">${stats.totalTrainingSessions}</span>
        <span class="stat-meta positive">Active shop-floor records</span>
      </div>
      <div class="stat-card">
        <span class="stat-title">Certification Pass Rate</span>
        <span class="stat-value" style="color: ${stats.averagePassRate >= 70 ? 'var(--accent-emerald)' : 'var(--accent-amber)'}">${stats.averagePassRate}%</span>
        <span class="stat-meta">±0.10 mm tolerance gate</span>
      </div>
      <div class="stat-card">
        <span class="stat-title">Average Score</span>
        <span class="stat-value">${stats.averageScore} <span style="font-size: 16px; font-weight: 500; color: var(--text-muted)">/ 100</span></span>
        <span class="stat-meta">Across all operators</span>
      </div>
    </div>

    <!-- Quick Actions Banner -->
    <div style="background: linear-gradient(90deg, #102238 0%, #152d4a 100%); border: 1px solid var(--border-active); border-radius: var(--radius-md); padding: 18px 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <h3 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px;">Industrial XR Workstation Ready</h3>
        <p style="font-size: 13px; color: var(--text-secondary);">Author standardized work instructions on desktop, capture expert demos, and train operators in Meta Quest VR.</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="dash-btn-new-proc" class="btn btn-secondary btn-sm">
          <span>+</span> New Procedure
        </button>
        <button id="dash-btn-capture" class="btn btn-secondary btn-sm">
          <span>⏺</span> Expert Capture
        </button>
        <button id="dash-btn-xr-launch" class="btn btn-amber btn-sm">
          <span>🥽</span> Launch XR Workstation
        </button>
      </div>
    </div>

    <!-- Split Feed: Recent Procedures & Recent Training Results -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <!-- Recent Procedures -->
      <div class="table-card" style="margin-bottom: 0;">
        <div class="table-header-bar">
          <span class="table-title">Recent Procedures</span>
          <button id="dash-btn-view-all-proc" class="btn btn-secondary btn-sm">View Library</button>
        </div>
        <table class="custom-table">
          <thead>
            <tr>
              <th>Code / Title</th>
              <th>Status</th>
              <th>Revision</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${procedures.map((p) => `
              <tr>
                <td>
                  <div style="font-weight: 600; color: #fff;">${p.code}</div>
                  <div style="font-size: 12px; color: var(--text-muted);">${p.title}</div>
                </td>
                <td>
                  <span class="badge ${p.status === 'published' ? 'badge-published' : p.status === 'draft' ? 'badge-draft' : 'badge-archived'}">
                    ${p.status}
                  </span>
                </td>
                <td>Rev ${p.currentRevisionNumber}</td>
                <td>
                  <button class="btn btn-secondary btn-sm dash-edit-proc" data-id="${p.id}">Edit</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Recent Sessions -->
      <div class="table-card" style="margin-bottom: 0;">
        <div class="table-header-bar">
          <span class="table-title">Recent Training Sessions</span>
          <button id="dash-btn-view-all-sess" class="btn btn-secondary btn-sm">Full Analytics</button>
        </div>
        <table class="custom-table">
          <thead>
            <tr>
              <th>Operator</th>
              <th>Result</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${sessions.map((s) => `
              <tr>
                <td>
                  <div style="font-weight: 600; color: #fff;">${s.operatorName}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">${s.procedureCode}</div>
                </td>
                <td>
                  <span class="badge ${s.overallPassed ? 'badge-pass' : 'badge-fail'}">
                    ${s.overallPassed ? 'PASS' : 'FAIL'}
                  </span>
                </td>
                <td>
                  <span style="font-weight: 700; color: ${s.totalScore >= 70 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}">${s.totalScore}</span>
                </td>
                <td style="font-size: 12px; color: var(--text-muted);">${new Date(s.startedAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Wire buttons
  container.querySelector('#dash-btn-new-proc')?.addEventListener('click', () => {
    onNavigate('editor', 'new');
  });
  container.querySelector('#dash-btn-capture')?.addEventListener('click', () => {
    onNavigate('capture');
  });
  container.querySelector('#dash-btn-xr-launch')?.addEventListener('click', () => {
    onNavigate('xr-player', 'proc-hyd-cyl-01');
  });
  container.querySelector('#dash-btn-view-all-proc')?.addEventListener('click', () => {
    onNavigate('procedures');
  });
  container.querySelector('#dash-btn-view-all-sess')?.addEventListener('click', () => {
    onNavigate('reports');
  });

  container.querySelectorAll('.dash-edit-proc').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) onNavigate('editor', id);
    });
  });
}
