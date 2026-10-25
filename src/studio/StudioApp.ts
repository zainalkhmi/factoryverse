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
import { renderVuforiaStudioView } from './views/VuforiaStudioView';
import { storageRepository } from '../storage/storage-repository';
import type { ProcedureStep } from '../types';
import type { TrainingEngine } from '../training/training-engine';
import type { AssemblySystem } from '../xr/assembly-system';
import { voiceCommandService } from '../xr/voice-command-service';
import { barcodeScannerService } from './services/barcode-scanner-service';
import { plantEnvironmentService } from './services/plant-environment-service';

export class StudioApp {
  private currentView: string = 'dashboard';
  private viewParam?: string;
  private trainingEngine?: TrainingEngine;
  private assemblySystem?: AssemblySystem;
  private isXRMode = false;
  private isARPassthroughActive = false;
  private arMediaStream: MediaStream | null = null;

  constructor() {}

  public setXREngine(engine: TrainingEngine, assemblySys?: AssemblySystem): void {
    this.trainingEngine = engine;
    if (assemblySys) this.assemblySystem = assemblySys;
  }

  public mount(): void {
    this.renderLayout();
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    this.navigateTo(hash || 'vuforia');
  }

  public navigateTo(viewId: string, param?: string, mode?: 'vr' | 'ar'): void {
    this.currentView = viewId;
    this.viewParam = param;

    if (typeof window !== 'undefined' && viewId !== 'xr-player') {
      try {
        window.location.hash = viewId;
      } catch {
        // ignore in headless
      }
    }

    if (viewId === 'xr-player') {
      this.enterXRPlayerMode(param, mode);
      return;
    }

    this.exitXRPlayerMode();
    this.updateSidebarActive(viewId);
    this.renderCurrentView();
  }

  public toggleARPassthroughMode(forceState?: boolean): boolean {
    const nextState = forceState !== undefined ? forceState : !this.isARPassthroughActive;
    this.isARPassthroughActive = nextState;

    const arVideo = document.getElementById('xr-passthrough-video') as HTMLVideoElement | null;
    const arReticle = document.getElementById('xr-ar-reticle');
    const arBadge = document.getElementById('xr-hud-ar-badge');
    const toggleBtn = document.getElementById('xr-btn-hud-ar-toggle');
    const envBtn = document.getElementById('xr-btn-hud-env');
    const sceneContainer = document.getElementById('scene-container');

    if (nextState) {
      // Activate AR Passthrough Mixed Reality
      plantEnvironmentService.setARPassthrough(true);
      this.assemblySystem?.setARPassthroughMode(true);

      if (arReticle) arReticle.style.display = 'block';
      if (arBadge) arBadge.style.display = 'block';
      if (toggleBtn) {
        toggleBtn.textContent = '👓 Mode: AR Passthrough (ON)';
        toggleBtn.className = 'btn btn-amber btn-sm';
      }
      if (envBtn) envBtn.textContent = '👓 AR Passthrough';

      // Start live camera stream for desktop/mobile AR view
      if (arVideo) {
        navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
          .then((stream) => {
            this.arMediaStream = stream;
            arVideo.srcObject = stream;
            arVideo.style.display = 'block';
          })
          .catch(() => {
            arVideo.style.display = 'none';
          });
      }

      // Make Three.js canvas transparent so camera or reality shows through
      if (sceneContainer) {
        const canvas = sceneContainer.querySelector('canvas');
        if (canvas) {
          canvas.style.backgroundColor = 'transparent';
        }
      }
    } else {
      // Return to VR Plant Mode
      plantEnvironmentService.setARPassthrough(false);
      this.assemblySystem?.setARPassthroughMode(false);

      if (arReticle) arReticle.style.display = 'none';
      if (arBadge) arBadge.style.display = 'none';
      if (toggleBtn) {
        toggleBtn.textContent = '🥽 Mode: VR Plant (Bay 3)';
        toggleBtn.className = 'btn btn-secondary btn-sm';
      }
      if (envBtn) envBtn.textContent = '🏭 Plant: Bay 3';

      if (this.arMediaStream) {
        this.arMediaStream.getTracks().forEach((track) => track.stop());
        this.arMediaStream = null;
      }
      if (arVideo) {
        arVideo.style.display = 'none';
        arVideo.srcObject = null;
      }
    }

    return this.isARPassthroughActive;
  }

  private enterXRPlayerMode(procedureId?: string, mode?: 'vr' | 'ar'): void {
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

    if (mode === 'ar') {
      this.toggleARPassthroughMode(true);
    } else if (mode === 'vr') {
      this.toggleARPassthroughMode(false);
    }

    this.updateXRHUD();
  }

  public exitXRPlayerMode(): void {
    this.isXRMode = false;
    this.toggleARPassthroughMode(false);
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
      if (target === viewId) {
        item.classList.add('active');
        (item as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });

    const subheader = document.getElementById('view-subheader');
    const content = document.getElementById('view-content');

    // Vuforia Studio uses full-bleed layout with its own dedicated top ribbon (matching Image 2)
    if (viewId === 'vuforia') {
      if (subheader) subheader.style.display = 'none';
      if (content) {
        content.style.padding = '0';
        content.style.overflow = 'hidden';
      }
    } else {
      if (subheader) subheader.style.display = 'flex';
      if (content) {
        content.style.padding = '24px';
        content.style.overflowY = 'auto';
      }
    }

    const heading = document.getElementById('view-heading');
    if (heading) {
      const titles: Record<string, string> = {
        dashboard: 'Executive Dashboard',
        procedures: 'Standard Operating Procedures',
        editor: 'Visual Procedure Editor',
        capture: 'Expert Capture Workspace',
        models: '3D Model & CAD Catalog',
        vuforia: 'Vuforia AR Experience Studio',
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
      case 'vuforia':
        renderVuforiaStudioView(content, nav);
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
      <!-- Top Navbar (MES CORE / FactoryVerse Topbar Style) -->
      <header class="studio-top-navbar">
        <div class="topbar-left">
          <div class="brand-badge">FV</div>
          <div class="brand-info">
            <span class="brand-title">FactoryVerse</span>
            <span class="brand-subtitle">EXPERT XR</span>
          </div>
        </div>

        <nav class="topbar-nav">
          <div class="nav-item" data-view="dashboard">
            <span class="nav-icon">📊</span> <span>Dashboard</span>
          </div>
          <div class="nav-item" data-view="procedures">
            <span class="nav-icon">📋</span> <span>Procedures</span>
          </div>
          <div class="nav-item" data-view="editor">
            <span class="nav-icon">✏️</span> <span>Editor</span>
          </div>
          <div class="nav-item" data-view="capture">
            <span class="nav-icon">⏺</span> <span>Capture</span>
          </div>
          <div class="nav-item active" data-view="vuforia">
            <span class="nav-icon">📐</span> <span>Vuforia Studio</span>
          </div>
          <div class="nav-item" data-view="models">
            <span class="nav-icon">🧊</span> <span>Models</span>
          </div>
          <div class="nav-item" data-view="inspection">
            <span class="nav-icon">🔍</span> <span>Inspection</span>
          </div>
          <div class="nav-item" data-view="reports">
            <span class="nav-icon">📑</span> <span>Reports</span>
          </div>
          <div class="nav-item" data-view="users">
            <span class="nav-icon">👥</span> <span>Users</span>
          </div>
          <div class="nav-item" data-view="settings">
            <span class="nav-icon">⚙️</span> <span>Settings</span>
          </div>
        </nav>

        <div class="topbar-right">
          <span class="status-chip-live" title="Plant Telemetry ONLINE">
            <span class="status-pulse-dot"></span>
            Live
          </span>
          <button id="header-btn-scan-qr" class="btn btn-secondary btn-sm" title="Vuforia Optical Marker & QR Scanner" style="padding: 4px 8px; font-size: 11px;">
            <span>📐</span> Scanner
          </button>
          <button id="header-btn-quick-ar" class="btn btn-amber btn-sm" title="Preview in AR Passthrough Mode" style="padding: 4px 8px; font-size: 11px;">
            <span>👓</span> AR Passthrough
          </button>
          <button id="header-btn-quick-xr" class="btn btn-secondary btn-sm" title="Launch in XR Workstation Mode" style="padding: 4px 8px; font-size: 11px;">
            <span>🥽</span> VR Workstation
          </button>
          <button id="header-btn-export-pkg" class="btn btn-secondary btn-sm" title="Export Vuforia Target Database Package" style="padding: 4px 8px; font-size: 11px;">
            <span>💾</span> Export DB
          </button>
          <div class="user-profile-badge" title="Logged in as System Admin">
            <span class="user-avatar">S</span>
            <span class="user-name" style="font-size: 11px;">Admin</span>
          </div>
        </div>
      </header>

      <!-- Main Studio Viewport -->
      <main class="studio-main">
        <!-- Subheader for standard views -->
        <header id="view-subheader" class="studio-header" style="height: 46px; min-height: 46px; padding: 0 20px;">
          <div class="header-left">
            <h1 id="view-heading" class="view-heading" style="font-size: 15px;">Executive Dashboard</h1>
            <span class="breadcrumb-tag">Meta VR Start 2026</span>
          </div>
          <div class="header-actions">
            <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; padding: 3px 8px; border-radius: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #22c55e; display: inline-block;"></span>
              Cloud Synced · Cache Active
            </span>
          </div>
        </header>

        <div id="view-content" class="view-content-wrapper">
          <!-- Views dynamically injected here -->
        </div>
      </main>
    `;

    // Bind navigation items
    layout.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const view = (e.currentTarget as HTMLElement).getAttribute('data-view');
        if (view) this.navigateTo(view);
      });
    });

    layout.querySelector('#header-btn-quick-xr')?.addEventListener('click', () => {
      this.navigateTo('xr-player', 'proc-hyd-cyl-01', 'vr');
    });

    layout.querySelector('#header-btn-quick-ar')?.addEventListener('click', () => {
      this.navigateTo('xr-player', 'proc-hyd-cyl-01', 'ar');
    });

    layout.querySelector('#header-btn-export-pkg')?.addEventListener('click', () => {
      plantEnvironmentService.downloadTargetDatabaseJSON();
      alert('Target Database Package exported successfully as "factoryverse-target-database.json"!');
    });

    layout.querySelector('#header-btn-scan-qr')?.addEventListener('click', () => {
      barcodeScannerService.openScannerModal((procId, mode) => {
        this.navigateTo('xr-player', procId, mode || 'ar');
      });
    });

    // Wire XR Player overlay controls
    const xrExitBtn = document.getElementById('xr-btn-exit-to-studio');
    xrExitBtn?.addEventListener('click', () => {
      this.exitXRPlayerMode();
      this.navigateTo('dashboard');
    });

    const xrARToggleBtn = document.getElementById('xr-btn-hud-ar-toggle');
    xrARToggleBtn?.addEventListener('click', () => {
      this.toggleARPassthroughMode();
    });

    const xrEnvBtn = document.getElementById('xr-btn-hud-env');
    xrEnvBtn?.addEventListener('click', () => {
      const next = plantEnvironmentService.cycleNextPreset();
      if (xrEnvBtn) {
        xrEnvBtn.textContent = `🏭 ${next.name.slice(0, 16)}...`;
      }
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
      barcodeScannerService.openScannerModal((procId, mode) => {
        this.navigateTo('xr-player', procId, mode || 'ar');
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
      } else if (cmd === 'ar' || cmd === 'passthrough') {
        this.toggleARPassthroughMode(true);
      } else if (cmd === 'vr') {
        this.toggleARPassthroughMode(false);
      } else if (cmd === 'environment' || cmd === 'plant' || cmd === 'location') {
        const next = plantEnvironmentService.cycleNextPreset();
        if (xrEnvBtn) xrEnvBtn.textContent = `🏭 ${next.name.slice(0, 16)}...`;
      }
    });
  }
}

export const studioApp = new StudioApp();
