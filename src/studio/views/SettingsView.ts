/**
 * FactoryVerse Studio - Settings & Configuration View
 * Storage adapter status, Supabase cloud sync, Meta Quest WebXR instructions, and demo seed resets.
 */

import { storageRepository } from '../../storage/storage-repository';
import { supabaseAdapter } from '../../storage/supabase-adapter';

export function renderSettingsView(
  container: HTMLElement,
  _onNavigate: (viewId: string, param?: string) => void
): void {
  const sbStatus = supabaseAdapter.getStatus();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h2 style="font-size: 20px; font-weight: 700; color: #fff;">Platform Settings & Architecture</h2>
        <p style="font-size: 13px; color: var(--text-secondary);">Manage runtime adapters, cloud persistence, and Meta Quest device configurations.</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <!-- Persistence Engine Status -->
      <div class="table-card" style="margin-bottom: 0;">
        <div class="table-header-bar">
          <span class="table-title">Persistence & Data Layer</span>
          <span class="badge ${sbStatus.enabled ? 'badge-published' : 'badge-draft'}">
            ${sbStatus.enabled ? 'Supabase Connected' : 'Local Storage Mode'}
          </span>
        </div>
        <div style="padding: 20px; font-size: 13px;">
          <p style="color: var(--text-secondary); margin-bottom: 14px;">
            FactoryVerse Expert XR operates with a modular repository abstraction. In local development and competition review, all procedures, captures, revisions, and training sessions are saved to browser LocalStorage with zero external dependencies.
          </p>
          <div style="background-color: #0d1724; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 16px;">
            <div>Adapter: <strong>${sbStatus.enabled ? 'Supabase Cloud PostgreSQL' : 'Browser LocalStorage'}</strong></div>
            <div style="margin-top: 4px;">Cloud URL: <code>${sbStatus.url || 'Not configured (using local repo)'}</code></div>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
            To connect to a live Supabase instance, copy <code>.env.example</code> to <code>.env</code> and add your <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
          <button id="set-btn-reset-seeds" class="btn btn-secondary btn-sm">
            <span>↺</span> Reset Seed Demonstration Data
          </button>
        </div>
      </div>

      <!-- WebXR & Meta Quest Info -->
      <div class="table-card" style="margin-bottom: 0;">
        <div class="table-header-bar">
          <span class="table-title">Meta Quest / WebXR Runtime</span>
          <span class="badge badge-published">IWSDK v1.1.0-rc.2</span>
        </div>
        <div style="padding: 20px; font-size: 13px;">
          <p style="color: var(--text-secondary); margin-bottom: 12px;">
            Target Platform: <strong>Meta Quest Browser (Horizon OS)</strong><br />
            Interaction Profile: <strong>Hands-First (Meta Natural Hand Tracking + Proximity Grab)</strong>
          </p>
          <div style="background-color: #0d1724; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 16px;">
            <div style="font-weight: 700; color: #fff; margin-bottom: 6px;">Testing Workflows:</div>
            <ul style="padding-left: 20px; color: #cbd5e1; font-size: 12px; line-height: 1.6;">
              <li><strong>Desktop:</strong> Runs using IWSDK's official IWER emulator (mouse orbit, shift for hands).</li>
              <li><strong>Headset over Wi-Fi:</strong> Open Vite HTTPS dev server URL in Meta Quest Browser.</li>
              <li><strong>Quest over USB:</strong> Use <code>adb reverse tcp:8081 tcp:8081</code> and open <code>localhost:8081</code>.</li>
            </ul>
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">
            Complies with Meta VR Start Developer Competition 2026 originality rules.
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#set-btn-reset-seeds')?.addEventListener('click', () => {
    if (confirm('Reset all procedures, models, and sessions back to initial factory demonstration seeds?')) {
      storageRepository.resetToDefaultSeeds();
      alert('Default seed data reloaded.');
    }
  });
}
