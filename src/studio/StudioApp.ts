/**
 * FactoryVerse Expert XR - Studio Application Controller
 * Manages view routing, sidebar state, and seamless switching between
 * Desktop Studio authoring and Immersive XR Player training.
 */

import { renderDashboardView } from './views/DashboardView';
import { renderProcedureLibraryView } from './views/ProcedureLibraryView';
import { renderVisualProcedureEditorView } from './views/VisualProcedureEditorView';
import { renderCaptureWorkspaceView } from './views/CaptureWorkspaceView';
import { renderModelLibraryView } from './views/ModelLibraryView';
import { renderQualityInspectionView } from './views/QualityInspectionView';
import { renderSessionReportsView } from './views/SessionReportsView';
import { renderUserRolesView } from './views/UserRolesView';
import { renderSettingsView } from './views/SettingsView';
import { storageRepository } from '../storage/storage-repository';
import type { ProcedureStep } from '../types';
import type { TrainingEngine } from '../training/training-engine';
import type { AssemblySystem } from '../xr/assembly-system';
import { voiceCommandService } from '../xr/voice-command-service';
import { barcodeScannerService } from './services/barcode-scanner-service';

export class StudioApp {
  private currentView: string = 'dashboard';
  private viewParam?: string;
  private trainingEngine?: TrainingEngine;
  private assemblySystem?: AssemblySystem;
  private isXRMode = false;

  constructor() {}

  public setXREngine(engine: TrainingEngine, assemblySys?: AssemblySystem): void {
    this.trainingEngine = engine;
    if (assemblySys) this.assemblySystem = assemblySys;
  }

  public mount(): void {
    this.renderLayout();
    this.navigateTo('dashboard');
  }

  public navigateTo(viewId: string, param?: string): void {
    this.currentView = viewId;
    this.viewParam = param;

    if (viewId === 'xr-player') {
      this.enterXRPlayerMode(param);
      return;
    }

    this.exitXRPlayerMode();
    this.updateSidebarActive(viewId);
    this.renderCurrentView();
  }

  private enterXRPlayerMode(procedureId?: string): void {
    this.isXRMode = true;
    const xrOverlay = document.getElementById('xr-player-view');
    const studioLayout = document.getElementById('app-layout');
    if (xrOverlay && studioLayout) {
      xrOverlay.classList.add('visible');
      studioLayout.style.display = 'none';
    }

    // Configure procedure in TrainingEngine if specified
    if (procedureId && this.trainingEngine) {
      const proc = storageRepository.getProcedureById(procedureId);
      if (proc && proc.activeDraftSteps.length > 0) {
        const steps = proc.activeDraftSteps.map((s: ProcedureStep) => ({
          id: s.id,
          order: s.order,
          title: s.title,
          instruction: s.instruction,
          checkpoint: s.checkpoint || 'Step verified.',
          targetComponentId: (s.targetComponentId as any) || 'barrel',
          interactionType: s.interactionType,
          inspectionRule: s.inspectionRule,
          estimatedDurationSeconds: s.estimatedDurationSeconds,
        }));
        this.trainingEngine.setSteps(steps);
        this.trainingEngine.reset();
        this.assemblySystem?.resetParts();
      }
    }

    this.updateXRHUD();
  }

  public exitXRPlayerMode(): void {
    this.isXRMode = false;
    const xrOverlay = document.getElementById('xr-player-view');
    const studioLayout = document.getElementById('app-layout');
    if (xrOverlay && studioLayout) {
      xrOverlay.classList.remove('visible');
      studioLayout.style.display = 'flex';
    }
  }

  private updateXRHUD(): void {
    const hudTitle = document.getElementById('xr-hud-proc-title');
    const hudStep = document.getElementById('xr-hud-step-title');
    const hudDesc = document.getElementById('xr-hud-step-desc');
    const hudCheckpoint = document.getElementById('xr-hud-checkpoint');

    if (!this.trainingEngine) return;
    const step = this.trainingEngine.getCurrentStep();
    if (!step) return;

    if (hudTitle) hudTitle.textContent = 'Hydraulic Cylinder Assembly & Inspection (SOP-HYD-042)';
    if (hudStep) hudStep.textContent = `${step.title}`;
    if (hudDesc) hudDesc.textContent = step.instruction;
    if (hudCheckpoint) hudCheckpoint.textContent = `CHECKPOINT: ${step.checkpoint}`;
  }

  private updateSidebarActive(viewId: string): void {
    document.querySelectorAll('.nav-item').forEach((item) => {
      const target = item.getAttribute('data-view');
      if (target === viewId) item.classList.add('active');
      else item.classList.remove('active');
    });

    const heading = document.getElementById('view-heading');
    if (heading) {
      const titles: Record<string, string> = {
        dashboard: 'Executive Dashboard',
        procedures: 'Standard Operating Procedures',
        editor: 'Visual Procedure Editor',
        capture: 'Expert Capture Workspace',
        models: '3D Model & CAD Catalog',
        inspection: 'Quality Inspection & Tolerances',
        reports: 'Training Session Reports & Audits',
        users: 'User & Role Management',
        settings: 'Settings & Architecture',
      };
      heading.textContent = titles[viewId] || 'FactoryVerse Studio';
    }
  }

  private renderCurrentView(): void {
    const content = document.getElementById('view-content');
    if (!content) return;
    content.innerHTML = '';

    const nav = (v: string, p?: string) => this.navigateTo(v, p);

    switch (this.currentView) {
      case 'dashboard':
        renderDashboardView(content, nav);
        break;
      case 'procedures':
        renderProcedureLibraryView(content, nav);
        break;
      case 'editor':
        renderVisualProcedureEditorView(content, this.viewParam, nav);
        break;
      case 'capture':
        renderCaptureWorkspaceView(content, nav);
        break;
      case 'models':
        renderModelLibraryView(content, nav);
        break;
      case 'inspection':
        renderQualityInspectionView(content, nav);
        break;
      case 'reports':
        renderSessionReportsView(content, nav);
        break;
      case 'users':
        renderUserRolesView(content, nav);
        break;
      case 'settings':
        renderSettingsView(content, nav);
        break;
      default:
        renderDashboardView(content, nav);
    }
  }

  private renderLayout(): void {
    const layout = document.getElementById('app-layout');
    if (!layout) return;

    layout.innerHTML = `
      <!-- Studio Sidebar -->
      <aside class="studio-sidebar">
        <div class="sidebar-header">
          <div class="brand-badge">FV</div>
          <div>
            <div class="brand-title">FactoryVerse</div>
            <div class="brand-subtitle">Expert XR Platform</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-label">Operations</div>
          <div class="nav-item" data-view="dashboard">
            <span class="nav-icon">📊</span> Dashboard
          </div>
          <div class="nav-item" data-view="procedures">
            <span class="nav-icon">📋</span> Procedure Library
          </div>
          <div class="nav-item" data-view="editor">
            <span class="nav-icon">✏️</span> Visual Editor
          </div>
          <div class="nav-item" data-view="capture">
            <span class="nav-icon">⏺</span> Expert Capture
          </div>

          <div class="nav-section-label">Engineering & QA</div>
          <div class="nav-item" data-view="models">
            <span class="nav-icon">🧊</span> 3D Model Library
          </div>
          <div class="nav-item" data-view="inspection">
            <span class="nav-icon">🔍</span> Quality Inspection
          </div>
          <div class="nav-item" data-view="reports">
            <span class="nav-icon">📑</span> Session Reports
          </div>

          <div class="nav-section-label">Administration</div>
          <div class="nav-item" data-view="users">
            <span class="nav-icon">👥</span> Users & Roles
          </div>
          <div class="nav-item" data-view="settings">
            <span class="nav-icon">⚙️</span> Settings & Adapters
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="mode-toggle-card">
            <h4>Meta Quest Training</h4>
            <p>Ready to test in VR workstation mode</p>
            <button id="sidebar-btn-launch-xr" class="btn btn-amber" style="width: 100%; justify-content: center;">
              <span>🥽</span> Launch XR Workstation
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Studio Viewport -->
      <main class="studio-main">
        <header class="studio-header">
          <div class="header-left">
            <h1 id="view-heading" class="view-heading">Executive Dashboard</h1>
            <span class="breadcrumb-tag">Meta VR Start 2026</span>
          </div>
          <div class="header-actions">
            <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; padding: 5px 10px; border-radius: 4px;">
              <span style="width: 7px; height: 7px; border-radius: 50%; background: #22c55e; display: inline-block;"></span>
              Cloud Synced · Offline Cache Active
            </span>
            <button id="header-btn-scan-qr" class="btn btn-secondary btn-sm">
              <span>📷</span> Scan Machine QR / VuMark
            </button>
            <button id="header-btn-quick-xr" class="btn btn-amber btn-sm">
              <span>🥽</span> XR Workstation Mode
            </button>
          </div>
        </header>

        <div id="view-content" class="view-content-wrapper">
          <!-- Views dynamically injected here -->
        </div>
      </main>
    `;

    // Bind sidebar navigation items
    layout.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const view = (e.currentTarget as HTMLElement).getAttribute('data-view');
        if (view) this.navigateTo(view);
      });
    });

    layout.querySelector('#sidebar-btn-launch-xr')?.addEventListener('click', () => {
      this.navigateTo('xr-player', 'proc-hyd-cyl-01');
    });

    layout.querySelector('#header-btn-quick-xr')?.addEventListener('click', () => {
      this.navigateTo('xr-player', 'proc-hyd-cyl-01');
    });

    layout.querySelector('#header-btn-scan-qr')?.addEventListener('click', () => {
      barcodeScannerService.openScannerModal((procId) => {
        this.navigateTo('xr-player', procId);
      });
    });

    // Wire XR Player overlay controls
    const xrExitBtn = document.getElementById('xr-btn-exit-to-studio');
    xrExitBtn?.addEventListener('click', () => {
      this.exitXRPlayerMode();
      this.navigateTo('dashboard');
    });

    const xrCadGuideBtn = document.getElementById('xr-btn-hud-cad-guide');
    xrCadGuideBtn?.addEventListener('click', () => {
      if (this.assemblySystem) {
        const visible = this.assemblySystem.toggleCADGuideView();
        if (xrCadGuideBtn) {
          xrCadGuideBtn.textContent = visible ? '📐 CAD Guide (ON)' : '📐 CAD Guide (OFF)';
          xrCadGuideBtn.className = visible ? 'btn btn-secondary btn-sm' : 'btn btn-danger btn-sm';
        }
      }
    });

    const xrScanBtn = document.getElementById('xr-btn-hud-scan');
    xrScanBtn?.addEventListener('click', () => {
      barcodeScannerService.openScannerModal((procId) => {
        this.navigateTo('xr-player', procId);
      });
    });

    const xrNextBtn = document.getElementById('xr-btn-hud-next');
    xrNextBtn?.addEventListener('click', () => {
      this.trainingEngine?.completeCurrentStep();
      this.updateXRHUD();
    });

    const xrResetBtn = document.getElementById('xr-btn-hud-reset');
    xrResetBtn?.addEventListener('click', () => {
      this.trainingEngine?.reset();
      this.assemblySystem?.resetParts();
      this.updateXRHUD();
    });

    const xrPassBtn = document.getElementById('xr-btn-hud-pass');
    xrPassBtn?.addEventListener('click', () => {
      if (this.trainingEngine) {
        const res = this.trainingEngine.submitMeasurement('24.02');
        alert(res.message);
        this.updateXRHUD();
      }
    });

    const xrFailBtn = document.getElementById('xr-btn-hud-fail');
    xrFailBtn?.addEventListener('click', () => {
      if (this.trainingEngine) {
        const res = this.trainingEngine.submitMeasurement('24.18');
        alert(res.message);
        this.updateXRHUD();
      }
    });

    // Hands-Free Voice Commands
    const voiceBtn = document.getElementById('xr-btn-hud-voice');
    const voiceBadge = document.getElementById('xr-hud-voice-badge');

    voiceBtn?.addEventListener('click', () => {
      const active = voiceCommandService.toggle();
      if (voiceBtn) voiceBtn.textContent = active ? '🎙️ Voice Active' : '🎤 Voice Commands';
      if (voiceBadge) {
        voiceBadge.style.display = active ? 'inline-block' : 'none';
        voiceBadge.textContent = '🎙️ Listening: Say "Next", "Back", "Pass"';
      }
    });

    voiceCommandService.addListener((cmd: string) => {
      if (!this.isXRMode || !this.trainingEngine) return;
      if (voiceBadge) {
        voiceBadge.textContent = `🎙️ Heard: "${cmd.toUpperCase()}"`;
        setTimeout(() => {
          if (voiceBadge) voiceBadge.textContent = '🎙️ Listening: Say "Next", "Back", "Pass"';
        }, 2000);
      }

      if (cmd === 'next') {
        this.trainingEngine.completeCurrentStep();
        this.updateXRHUD();
      } else if (cmd === 'previous') {
        const state = this.trainingEngine.getState();
        if (state.currentStepIndex > 0) {
          (this.trainingEngine as any).state.currentStepIndex -= 1;
          this.updateXRHUD();
        }
      } else if (cmd === 'reset') {
        this.trainingEngine.reset();
        this.assemblySystem?.resetParts();
        this.updateXRHUD();
      } else if (cmd === 'pass') {
        this.trainingEngine.submitMeasurement('24.02');
        this.updateXRHUD();
      } else if (cmd === 'fail') {
        this.trainingEngine.submitMeasurement('24.18');
        this.updateXRHUD();
      } else if (cmd === 'guide' || cmd === 'wireframe') {
        if (this.assemblySystem) {
          const visible = this.assemblySystem.toggleCADGuideView();
          if (xrCadGuideBtn) {
            xrCadGuideBtn.textContent = visible ? '📐 CAD Guide (ON)' : '📐 CAD Guide (OFF)';
            xrCadGuideBtn.className = visible ? 'btn btn-secondary btn-sm' : 'btn btn-danger btn-sm';
          }
        }
      }
    });
  }
}

export const studioApp = new StudioApp();
