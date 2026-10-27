/**
 * FactoryVerse Studio - Vuforia Studio AR Experience Builder View
 * Authentic 4-column visual authoring workspace matching PTC Vuforia Studio (ThingWorx Studio):
 * 1. Project Hierarchy Tree (Configuration, Views, 3D Container, Models, 3D Labels, 3D Gauges)
 * 2. Widgets Toolbox (Targets: Model/Image/Spatial/ThingMark; Augmentations: 3D Gauge, 3D Label, Pins)
 * 3. Real 3D Spatial Canvas (Three.js WebGL viewport with orbit, transform gizmo, camera angles, floating tracked AR pins)
 * 4. Model Details & Live IoT Data Bindings (ThingWorx external sensor stream, 6DOF pose coordinates, scale, resource switch)
 */

import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  GridHelper,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from '@iwsdk/core';
import { storageRepository, SEED_HYDRAULIC_MODEL } from '../../storage/storage-repository';
import type { ModelAsset } from '../../types';
import { plantEnvironmentService } from '../services/plant-environment-service';
import {
  createCylinderBarrel,
  createPistonRod,
  createEndCap,
} from '../../scene-assets/cylinder-workstation.scene-asset';
import { openVuforiaTargetManagerModal } from './VuforiaTargetManagerModal';
import {
  vuforiaTargetManagerService,
  type VuforiaTarget,
  type VuforiaTargetType,
} from '../services/vuforia-target-manager-service';
import {
  vuforiaProjectService,
  type VuforiaProject,
} from '../services/vuforia-project-service';
import { openVuforiaNewProjectModal } from './VuforiaNewProjectModal';
import { openVuforiaEditProjectModal } from './VuforiaEditProjectModal';
import { openVuforiaHelpModal } from './VuforiaHelpModal';

export interface VuforiaAugmentation {
  id: string;
  type: '3dlabel' | '3dgauge' | '3dimage' | 'spatial_pin' | 'thingmark';
  name: string;
  label: string;
  position: [number, number, number]; // [x, y, z] in meters
  rotation: [number, number, number]; // [degX, degY, degZ]
  scale: number;
  bindingField: 'pressure' | 'temperature' | 'vibration' | 'flowRate' | 'none';
  customValue?: string;
}

export function renderVuforiaStudioView(
  container: HTMLElement,
  onNavigate: (viewId: string, param?: string, mode?: 'vr' | 'ar') => void
): void {
  const models = storageRepository.getModels();

  let currentProject: VuforiaProject = vuforiaProjectService.getActiveProject();
  let projectName = currentProject.name;

  let activeModelIndex = 0;
  if (currentProject.associatedModelId) {
    const foundIdx = models.findIndex((m) => m.id === currentProject.associatedModelId);
    if (foundIdx >= 0) activeModelIndex = foundIdx;
  }
  let activeModel: ModelAsset = models[activeModelIndex] || SEED_HYDRAULIC_MODEL;

  let activeTarget: VuforiaTarget =
    vuforiaTargetManagerService.getActiveTarget() ||
    vuforiaTargetManagerService.getTargets()[0];

  const handleTargetActivated = (target: VuforiaTarget) => {
    activeTarget = target;
    if (currentProject.template !== 'blank' && currentProject.associatedModelId !== 'none' && target.associatedModelId) {
      const mIdx = models.findIndex((m) => m.id === target.associatedModelId);
      if (mIdx >= 0) {
        activeModelIndex = mIdx;
        activeModel = models[activeModelIndex];
        currentProject.associatedModelId = activeModel.id;
        vuforiaProjectService.saveActiveProject(currentProject);
        rebuild3DSceneGeometry();
      }
    }
    toastMessage = `✓ Activated Vuforia Target: ${target.name} (${target.robustnessScore}% Robustness)`;
    renderUI();
  };

  const handleLoadTargetTemplate = (targetType: VuforiaTargetType) => {
    const proj = vuforiaProjectService.getOrCreateProjectForTargetType(targetType);
    currentProject = proj;
    projectName = proj.name;
    augmentations = proj.augmentations ? [...proj.augmentations] : vuforiaProjectService.generateTemplateAugmentations(proj.template);
    selectedElementId = augmentations[0]?.id || 'model-1';

    const matchedTarget = vuforiaTargetManagerService.getTargets().find((t) => t.type === targetType);
    if (matchedTarget) {
      activeTarget = matchedTarget;
      vuforiaTargetManagerService.setActiveTarget(matchedTarget.id);
    }

    const mIdx = models.findIndex((m) => m.id === proj.associatedModelId);
    activeModelIndex = mIdx >= 0 ? mIdx : 0;
    activeModel = models[activeModelIndex] || SEED_HYDRAULIC_MODEL;

    const overlayEl = container.querySelector('#vf-html-overlay');
    if (overlayEl) overlayEl.innerHTML = '';

    rebuild3DSceneGeometry();
    rebuild3DPinAnchors();
    toastMessage = `✓ Loaded Ready-to-Run AR Template: "${proj.name}"`;
    renderUI();
  };

  // Real Dynamic Augmentations List (Authorable in 3D Scene - loaded from active project)
  let augmentations: VuforiaAugmentation[] = currentProject.augmentations
    ? [...currentProject.augmentations]
    : vuforiaProjectService.generateTemplateAugmentations(currentProject.template);

  if (!currentProject.augmentations) {
    currentProject.augmentations = [...augmentations];
    vuforiaProjectService.saveActiveProject(currentProject);
  }

  let selectedElementId = augmentations[0]?.id || 'model-1';
  let isWireframeActive = true;
  let activePerspective: 'iso' | 'front' | 'top' = 'iso';
  let activeTool: 'select' | 'move' | 'rotate' | 'scale' = 'move';
  let isAutoRefreshActive = true;
  let toastMessage = '';
  let activeLeftTab: 'screens' | 'records' = 'screens';
  let activeRightTab: 'widget' | 'model' | 'iot' = 'widget';
  let canvasZoomPercent = 100;

  // Real-time IoT Machine Telemetry Stream (ThingWorx / OPC-UA Parity)
  const telemetry = {
    pressureBar: 210.4,
    temperatureC: 62.1,
    vibrationRms: 0.08,
    flowRateLmin: 14.8,
    cycleCount: 14280,
  };

  // Clean-up refs
  let animationFrameId: number | null = null;
  let telemetryIntervalId: any = null;
  let threeRenderer: WebGLRenderer | null = null;
  let modelMeshGroup: Group | null = null;
  let pinsMeshGroup: Group | null = null;
  let camera: PerspectiveCamera | null = null;
  let scene: Scene | null = null;

  // Camera Orbit Spherical Coordinates
  let camTheta = Math.PI / 4;
  let camPhi = Math.PI / 3;
  let camRadius = 1.5;
  const camTarget = new Vector3(0, 0, 0);

  const updateCameraPosition = () => {
    if (!camera) return;
    camera.position.x = camRadius * Math.sin(camPhi) * Math.sin(camTheta);
    camera.position.y = camRadius * Math.cos(camPhi);
    camera.position.z = camRadius * Math.sin(camPhi) * Math.cos(camTheta);
    camera.lookAt(camTarget);
  };

  const setCameraPreset = (preset: 'iso' | 'front' | 'top') => {
    activePerspective = preset;
    if (preset === 'iso') {
      camTheta = Math.PI / 4;
      camPhi = Math.PI / 3;
      camRadius = 1.5;
    } else if (preset === 'front') {
      camTheta = 0;
      camPhi = Math.PI / 2;
      camRadius = 1.35;
    } else if (preset === 'top') {
      camTheta = 0;
      camPhi = 0.05;
      camRadius = 1.6;
    }
    updateCameraPosition();
    container.querySelectorAll('.vf-cam-btn').forEach((b) => b.classList.remove('active'));
    container.querySelector(`#vf-btn-cam-${preset}`)?.classList.add('active');
  };

  const getSelectedAugmentation = (): VuforiaAugmentation | undefined => {
    return augmentations.find((a) => a.id === selectedElementId);
  };

  const getBindingValue = (aug: VuforiaAugmentation): string => {
    if (aug.bindingField === 'pressure') return `${telemetry.pressureBar.toFixed(1)} Bar`;
    if (aug.bindingField === 'temperature') return `${telemetry.temperatureC.toFixed(1)} °C`;
    if (aug.bindingField === 'vibration') return `${telemetry.vibrationRms.toFixed(3)} mm/s`;
    if (aug.bindingField === 'flowRate') return `${telemetry.flowRateLmin.toFixed(1)} L/min`;
    return aug.customValue || aug.label;
  };

  const rebuild3DSceneGeometry = () => {
    if (!scene || !modelMeshGroup) return;

    // Clear existing children
    while (modelMeshGroup.children.length > 0) {
      modelMeshGroup.remove(modelMeshGroup.children[0]);
    }

    // 0. BLANK / EMPTY CANVAS:
    // If project has no model or is a blank canvas project, keep canvas completely clean!
    if (
      currentProject.template === 'blank' ||
      currentProject.associatedModelId === 'none' ||
      !currentProject.associatedModelId
    ) {
      return;
    }

    if (currentProject.template === 'cylinder_target' || activeTarget.type === 'cylinder_target') {
      // 1. CYLINDER TARGET: HONED BORE PRESSURE PIPE & VESSEL
      const pipeGeo = new CylinderGeometry(0.09, 0.09, 0.65, 32, 1, false);
      const pipeMat = new MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 });
      const pipeMesh = new Mesh(pipeGeo, pipeMat);
      pipeMesh.rotation.z = Math.PI / 2;
      modelMeshGroup.add(pipeMesh);

      // Flange collars on both ends
      const flgGeo = new CylinderGeometry(0.14, 0.14, 0.04, 32);
      const flgMat = new MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
      const flg1 = new Mesh(flgGeo, flgMat);
      flg1.rotation.z = Math.PI / 2;
      flg1.position.set(-0.31, 0, 0);
      modelMeshGroup.add(flg1);

      const flg2 = new Mesh(flgGeo, flgMat);
      flg2.rotation.z = Math.PI / 2;
      flg2.position.set(0.31, 0, 0);
      modelMeshGroup.add(flg2);

      // Circumferential Weld Bead (NDT Datum)
      const weldGeo = new TorusGeometry(0.092, 0.008, 16, 32);
      const weldMat = new MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.35 });
      const weld = new Mesh(weldGeo, weldMat);
      weld.rotation.y = Math.PI / 2;
      weld.position.set(0.05, 0, 0);
      modelMeshGroup.add(weld);

    } else if (currentProject.template === 'multi_target' || activeTarget.type === 'multi_target') {
      // 2. MULTI-TARGET (BOX): HEAVY-DUTY INDUSTRIAL SHIPPING CRATE
      const boxGeo = new BoxGeometry(0.48, 0.34, 0.30);
      const boxMat = new MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4, roughness: 0.6 });
      const boxMesh = new Mesh(boxGeo, boxMat);
      modelMeshGroup.add(boxMesh);

      // Metal reinforced corner edge brackets
      const edgeMat = new MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.3 });
      const topEdge1 = new Mesh(new BoxGeometry(0.50, 0.02, 0.02), edgeMat);
      topEdge1.position.set(0, 0.17, 0.15);
      modelMeshGroup.add(topEdge1);

      const topEdge2 = new Mesh(new BoxGeometry(0.50, 0.02, 0.02), edgeMat);
      topEdge2.position.set(0, 0.17, -0.15);
      modelMeshGroup.add(topEdge2);

      // Heavy-duty steel strap bands
      const strapMat = new MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
      const strap1 = new Mesh(new BoxGeometry(0.03, 0.35, 0.31), strapMat);
      strap1.position.set(-0.12, 0, 0);
      modelMeshGroup.add(strap1);

      const strap2 = new Mesh(new BoxGeometry(0.03, 0.35, 0.31), strapMat);
      strap2.position.set(0.12, 0, 0);
      modelMeshGroup.add(strap2);

    } else if (currentProject.template === 'area_target' || activeTarget.type === 'area_target') {
      // 3. AREA TARGET: ASSEMBLY BAY 3 FACILITY CELL
      const floorGeo = new BoxGeometry(1.2, 0.02, 0.8);
      const floorMat = new MeshStandardMaterial({ color: 0x0f172a, metalness: 0.3, roughness: 0.8 });
      const floor = new Mesh(floorGeo, floorMat);
      floor.position.set(0, -0.2, 0);
      modelMeshGroup.add(floor);

      // Workstation bench 1
      const benchGeo = new BoxGeometry(0.35, 0.16, 0.22);
      const benchMat = new MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.4 });
      const bench = new Mesh(benchGeo, benchMat);
      bench.position.set(-0.35, -0.11, 0);
      modelMeshGroup.add(bench);

      // CNC Lathe machine block 2
      const latheGeo = new BoxGeometry(0.38, 0.24, 0.26);
      const latheMat = new MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
      const lathe = new Mesh(latheGeo, latheMat);
      lathe.position.set(0.32, -0.07, 0);
      modelMeshGroup.add(lathe);

      // Overhead Crane Beam (Safety envelope)
      const craneGeo = new BoxGeometry(1.1, 0.04, 0.06);
      const craneMat = new MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 });
      const crane = new Mesh(craneGeo, craneMat);
      crane.position.set(0, 0.32, 0);
      modelMeshGroup.add(crane);

    } else if (currentProject.template === 'vumark' || activeTarget.type === 'vumark' || activeModel.id === 'model-robotic-flange-04') {
      // 4. VUMARK OPTICAL: 6-AXIS TOOLING FLANGE WITH OPTICAL FIDUCIAL RING
      const flangeGeo = new CylinderGeometry(0.16, 0.16, 0.04, 32);
      const flangeMat = new MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 });
      const flange = new Mesh(flangeGeo, flangeMat);
      flange.rotation.x = Math.PI / 2;
      modelMeshGroup.add(flange);

      // Concentric VuMark Disc
      const vumarkDiscGeo = new CylinderGeometry(0.12, 0.12, 0.005, 32);
      const vumarkDiscMat = new MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.2 });
      const vumarkDisc = new Mesh(vumarkDiscGeo, vumarkDiscMat);
      vumarkDisc.rotation.x = Math.PI / 2;
      vumarkDisc.position.set(0, 0, 0.024);
      modelMeshGroup.add(vumarkDisc);

      // Center Spindle Shaft
      const spindleGeo = new CylinderGeometry(0.04, 0.04, 0.18, 24);
      const spindleMat = new MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
      const spindle = new Mesh(spindleGeo, spindleMat);
      spindle.rotation.x = Math.PI / 2;
      spindle.position.set(0, 0, 0.1);
      modelMeshGroup.add(spindle);

    } else if (currentProject.template === 'image_target' || activeTarget.type === 'image_target' || activeModel.id === 'model-valve-manifold-02') {
      // 5. SINGLE IMAGE TARGET: ELECTRICAL PANEL & MANIFOLD ENCLOSURE
      const panelGeo = new BoxGeometry(0.44, 0.32, 0.08);
      const panelMat = new MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.5 });
      const panel = new Mesh(panelGeo, panelMat);
      modelMeshGroup.add(panel);

      const termGeo = new BoxGeometry(0.36, 0.04, 0.03);
      const termMat = new MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
      const term1 = new Mesh(termGeo, termMat);
      term1.position.set(0, 0.08, 0.05);
      modelMeshGroup.add(term1);

      const term2 = new Mesh(termGeo, termMat);
      term2.position.set(0, -0.06, 0.05);
      modelMeshGroup.add(term2);

    } else if (activeModel.id === 'model-centrifugal-pump-03') {
      // CENTRIFUGAL SLURRY PUMP
      const casingGeo = new TorusGeometry(0.16, 0.08, 20, 36);
      const casingMat = new MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.4 });
      const casingMesh = new Mesh(casingGeo, casingMat);
      casingMesh.rotation.x = Math.PI / 2;
      modelMeshGroup.add(casingMesh);

      const suctionGeo = new CylinderGeometry(0.065, 0.065, 0.22, 24);
      const nozzleMat = new MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.3 });
      const suctionMesh = new Mesh(suctionGeo, nozzleMat);
      suctionMesh.position.set(0, 0, 0.1);
      suctionMesh.rotation.x = Math.PI / 2;
      modelMeshGroup.add(suctionMesh);

      const dischargeGeo = new CylinderGeometry(0.048, 0.048, 0.2, 24);
      const dischargeMesh = new Mesh(dischargeGeo, nozzleMat);
      dischargeMesh.position.set(0.16, 0.14, 0);
      dischargeMesh.rotation.z = -Math.PI / 6;
      modelMeshGroup.add(dischargeMesh);

    } else {
      // 0. MODEL TARGET: MODULAR HEAVY-DUTY HYDRAULIC CYLINDER
      const barrel = createCylinderBarrel();
      barrel.position.set(-0.15, 0, 0);
      modelMeshGroup.add(barrel);

      const rod = createPistonRod();
      rod.position.set(0.15, 0, 0);
      modelMeshGroup.add(rod);

      const cap = createEndCap();
      cap.position.set(0.18, 0, 0);
      modelMeshGroup.add(cap);
    }

    // Apply current wireframe mode
    modelMeshGroup.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.material.wireframe = isWireframeActive;
      }
    });
  };

  const rebuild3DPinAnchors = () => {
    if (!scene || !pinsMeshGroup) return;

    while (pinsMeshGroup.children.length > 0) {
      pinsMeshGroup.remove(pinsMeshGroup.children[0]);
    }

    const pinMatActive = new MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      roughness: 0.2,
      metalness: 0.8,
    });
    const pinMatInactive = new MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.5,
      metalness: 0.5,
    });

    augmentations.forEach((aug) => {
      const isSelected = aug.id === selectedElementId;
      const markerGroup = new Group();
      markerGroup.name = `Pin_${aug.id}`;
      markerGroup.position.set(...aug.position);

      // Sphere beacon head
      const sphereGeo = new SphereGeometry(isSelected ? 0.024 : 0.016, 16, 16);
      const sphere = new Mesh(sphereGeo, isSelected ? pinMatActive : pinMatInactive);
      markerGroup.add(sphere);

      // Stalk line to surface
      const stalkGeo = new CylinderGeometry(0.003, 0.003, 0.08, 8);
      const stalk = new Mesh(stalkGeo, isSelected ? pinMatActive : pinMatInactive);
      stalk.position.set(0, -0.04, 0);
      markerGroup.add(stalk);

      pinsMeshGroup?.add(markerGroup);
    });
  };

  const renderUI = () => {
    const selectedAug = getSelectedAugmentation();

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: calc(100vh - 52px); width: 100%; background: #070d17; overflow: hidden;">
        
        <!-- TOP HORIZONTAL WIDGETS TOOLBOX RIBBON (Single Slim Centered Row) -->
        <div class="vf-top-ribbon">
          <div class="vf-widget-ribbon">
            <!-- TARGETS (Cyan Tinted) -->
            <button id="vf-btn-add-screen-target" class="vf-widget-add vf-widget-card-btn target-type" data-widget="add_target" title="+ Add Vuforia Target (Target Manager Wizard)">
              <span>➕</span>
            </button>
            <button class="vf-widget-add vf-widget-card-btn target-type" data-widget="model_target" title="PTC Model Target (CAD Optical Tracking)">
              <span>📐</span>
            </button>
            <button class="vf-widget-add vf-widget-card-btn target-type" data-widget="thingmark" title="ThingMark / VuMark Optical Anchor">
              <span>🎯</span>
            </button>
            <button class="vf-widget-add vf-widget-card-btn target-type" data-widget="spatial_target" title="Spatial Surface SLAM Tracking">
              <span>🌐</span>
            </button>

              <span style="width: 1px; height: 18px; background: #1e3a5f; margin: 0 4px; flex-shrink: 0;"></span>

              <!-- 3D ANNOTATIONS & MARKERS -->
              <button class="vf-widget-add vf-widget-card-btn" data-widget="3dlabel" title="3D Datum & Annotation Label">
                <span>🏷️</span>
              </button>
              <button class="vf-widget-add vf-widget-card-btn" data-widget="3dgauge" title="3D Sensor Gauge (Live IoT)">
                <span>⏱️</span>
              </button>
              <button class="vf-widget-add vf-widget-card-btn" data-widget="spatial_pin" title="Spatial Waypoint Pin">
                <span>📍</span>
              </button>
              <button class="vf-widget-add vf-widget-card-btn" data-widget="3dimage" title="3D Exploded Diagram Callout">
                <span>🖼️</span>
              </button>
              <button class="vf-widget-add vf-widget-card-btn" data-widget="tml_text" title="TML / SOP Step Card">
                <span>📝</span>
              </button>

              <span style="width: 1px; height: 18px; background: #1e3a5f; margin: 0 4px; flex-shrink: 0;"></span>

              <!-- INSPECTION & IOT INTELLIGENCE -->
              <button class="vf-widget-add vf-widget-card-btn" data-widget="qc_tolerance" title="QC Tolerance Inspection Datum">
                <span>🔍</span>
              </button>
              <button class="vf-widget-add vf-widget-card-btn" data-widget="sensor_chart" title="Telemetry Sparkline Chart">
                <span>📊</span>
              </button>
              <button class="vf-widget-add vf-widget-card-btn" data-widget="digital_twin" title="ThingWorx Digital Twin Synchronizer">
                <span>⚡</span>
              </button>
            </div>
            ${toastMessage ? `<span id="vf-toast-msg" style="position: absolute; right: 16px; font-size: 11px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.4); pointer-events: none; z-index: 30;">${toastMessage}</span>` : ''}
          </div>

        <!-- 3-COLUMN WORKSPACE BODY: LEFT PROJECT TREE | CENTER 3D VIEWPORT | RIGHT INSPECTOR -->
        <div style="display: grid; grid-template-columns: 260px 1fr 340px; flex: 1; min-height: 0; background: #070d17;">
          
          <!-- COLUMN 1: PROJECT TREE / VIEWS & SCREENS (Left Panel) -->
          <div style="background: #09111c; border-right: 1px solid #1e3a5f; display: flex; flex-direction: column; overflow: hidden;">
            <!-- Tab Header (Matching Image 2 SCREENS / RECORDS) -->
            <div class="vf-tab-bar">
              <div class="vf-left-tab-btn vf-tab-item ${activeLeftTab === 'screens' ? 'active' : ''}" data-tab="screens">
                SCREENS / VIEWS
              </div>
              <div class="vf-left-tab-btn vf-tab-item ${activeLeftTab === 'records' ? 'active' : ''}" data-tab="records">
                RECORDS / CAD
              </div>
            </div>

            <!-- Project Header with Editable Name & Action Buttons -->
            <div style="padding: 10px 12px; background: #060e19; border-bottom: 1px solid #1e3a5f; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 10px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">
                  📁 PROJECT
                </span>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <button id="vf-btn-new-project" data-testid="vf-btn-new-project" class="btn btn-primary btn-sm" style="padding: 2px 7px; font-size: 10px; font-weight: 700; gap: 3px; background: linear-gradient(135deg, #0284c7, #38bdf8); color: #000;" title="Create New Vuforia Studio Project">
                    <span>➕</span> New
                  </button>
                  <button id="vf-btn-edit-project" data-testid="vf-btn-edit-project" class="btn btn-secondary btn-sm" style="padding: 2px 7px; font-size: 10px; font-weight: 600; gap: 3px; border-color: #1e3a5f; color: #cbd5e1;" title="Edit Active Project Details & CAD Resource">
                    <span>✏️</span> Edit
                  </button>
                  <button id="vf-btn-import-project" data-testid="vf-btn-import-project" class="btn btn-secondary btn-sm" style="padding: 2px 7px; font-size: 10px; font-weight: 600; gap: 3px; border-color: #1e3a5f; color: #cbd5e1;" title="Import Project from JSON file">
                    <span>📥</span> Import
                  </button>
                  <input id="vf-file-import-project" type="file" accept=".json,application/json" style="display: none;" />
                </div>
              </div>
              <!-- Project Switcher Dropdown -->
              <div style="display: flex; align-items: center; gap: 6px;">
                <select id="vf-select-active-project" data-testid="vf-select-active-project" class="form-select" style="font-size: 11px; padding: 4px 6px; width: 100%; background: #0b1728; border: 1px solid #1e3a5f; border-radius: 4px; color: #38bdf8; font-weight: 700;" title="Switch active Vuforia project">
                  ${vuforiaProjectService.getAllProjects().map((p) => `
                    <option value="${p.id}" ${p.id === currentProject.id ? 'selected' : ''}>
                      📂 ${p.name.length > 24 ? p.name.slice(0, 24) + '...' : p.name}
                    </option>
                  `).join('')}
                </select>
              </div>
              <div style="position: relative; display: flex; align-items: center;">
                <input id="vf-input-project-name" data-testid="vf-input-project-name" type="text" class="form-input" value="${projectName}" placeholder="Project Name..." style="font-size: 11px; font-weight: 700; color: #fff; padding: 4px 24px 4px 8px; width: 100%; background: #0b1728; border: 1px solid #1e3a5f; border-radius: 4px;" title="Click to rename project (Press Enter or unfocus to save)" />
                <span style="position: absolute; right: 8px; font-size: 11px; color: #64748b; pointer-events: none;" title="Editable">✏️</span>
              </div>
            </div>

            <div style="flex: 1; overflow-y: auto; padding: 12px;">
              ${
                activeLeftTab === 'screens'
                  ? `
                <!-- Configuration Section -->
                <div style="margin-bottom: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-weight: 700; color: #38bdf8; font-size: 11px;">▾ PROJECT CONFIGURATION</span>
                    <button id="vf-btn-cfg-edit-project" class="btn btn-secondary btn-sm" style="padding: 1px 6px; font-size: 9px; color: #38bdf8; border-color: rgba(56, 189, 248, 0.3);" title="Configure Project">Edit ↗</button>
                  </div>
                  <div style="padding-left: 10px; display: flex; flex-direction: column; gap: 4px; color: #94a3b8; font-size: 11px;">
                    <div style="cursor: pointer;">• Theme: Industrial Dark</div>
                    <div style="cursor: pointer;">• Experience: ${currentProject.template.toUpperCase().replace('_', ' ')}</div>
                    <div style="cursor: pointer;">• Target Format: Vuforia CAD Mesh</div>
                    <div style="cursor: pointer; color: #facc15;">• Active ThingMarks: (${augmentations.filter(a => a.type === 'thingmark').length})</div>
                    <div id="vf-tree-target-mgr-link" style="cursor: pointer; color: #38bdf8; display: flex; align-items: center; justify-content: space-between; margin-top: 4px; padding: 3px 6px; border-radius: 3px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2);" title="Open Vuforia Target Manager">
                      <span>• Target: ${activeTarget ? activeTarget.name.slice(0, 14) + '...' : 'CAD Model'}</span>
                      <span style="font-size: 9px; background: #0284c7; color: #fff; padding: 1px 4px; border-radius: 2px;">Manage ↗</span>
                    </div>
                  </div>
                </div>

                <!-- Views Hierarchy Tree -->
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; color: #38bdf8; font-size: 11px; margin-bottom: 6px;">
                    <span>▾ VIEWS & HIERARCHY</span>
                    <span id="vf-btn-add-aug-tree" style="font-size: 14px; cursor: pointer; color: #38bdf8; padding: 0 4px;" title="Add 3D Augmentation">+</span>
                  </div>
                  
                  <div style="padding-left: 6px; display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
                    <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: #fff;">
                      <span>▾ 📱 Home</span>
                      <span style="font-size: 9px; color: #64748b;">(Home.js)</span>
                    </div>

                    <div style="padding-left: 12px;">
                      <div style="display: flex; align-items: center; gap: 6px; color: #38bdf8; font-weight: 600;">
                        <span>▾ 🧊 3D Container</span>
                      </div>

                      <div style="padding-left: 12px; margin-top: 4px; display: flex; flex-direction: column; gap: 3px;">
                        ${
                          currentProject.template !== 'blank' &&
                          currentProject.associatedModelId &&
                          currentProject.associatedModelId !== 'none'
                            ? `
                          <div class="vf-tree-item ${selectedElementId === 'model-1' ? 'active' : ''}" data-id="model-1" style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: ${selectedElementId === 'model-1' ? '#38bdf8' : '#cbd5e1'}; padding: 3px 6px; border-radius: 4px; background: ${selectedElementId === 'model-1' ? 'rgba(56, 189, 248, 0.14)' : 'transparent'};">
                            <span>▾ ⚙️ model-1 (${activeModel ? activeModel.name.slice(0, 14) : 'Model'}...)</span>
                          </div>
                          `
                            : `
                          <div style="display: flex; align-items: center; gap: 6px; color: #64748b; padding: 3px 6px; font-size: 10px; font-style: italic;">
                            <span>⚙️ (No 3D Model Attached — Blank Canvas)</span>
                          </div>
                          `
                        }

                        <!-- Dynamic 3D Augmentations in Tree -->
                        <div style="padding-left: 12px; display: flex; flex-direction: column; gap: 2px;">
                          ${augmentations.length === 0
                            ? `
                            <div style="padding: 10px 8px; text-align: center; background: rgba(56, 189, 248, 0.04); border: 1px dashed rgba(56, 189, 248, 0.25); border-radius: 6px; margin: 4px 0;">
                              <div style="font-size: 14px; margin-bottom: 2px;">📄</div>
                              <div style="font-size: 11px; font-weight: 700; color: #38bdf8;">Blank Spatial Canvas</div>
                              <div style="font-size: 10px; color: #94a3b8; margin-top: 2px; line-height: 1.3;">
                                Clean slate. Click widgets in toolbar above to add 3D annotations.
                              </div>
                            </div>
                            `
                            : augmentations
                            .map((aug) => {
                              const isSel = aug.id === selectedElementId;
                              const icon =
                                aug.type === '3dlabel'
                                  ? '🏷️'
                                  : aug.type === '3dgauge'
                                  ? '⏱️'
                                  : aug.type === 'thingmark'
                                  ? '🎯'
                                  : '📍';
                              return `
                                <div class="vf-tree-item" data-id="${aug.id}" style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; color: ${isSel ? '#38bdf8' : '#cbd5e1'}; font-weight: ${isSel ? '700' : '400'}; padding: 3px 6px; border-radius: 4px; background: ${isSel ? 'rgba(56, 189, 248, 0.16)' : 'transparent'}; border-left: 2px solid ${isSel ? '#38bdf8' : 'transparent'};">
                                  <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
                                    <span>${icon}</span>
                                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px;">${aug.name}</span>
                                  </div>
                                  <button class="vf-tree-item-delete" data-id="${aug.id}" style="background: none; border: none; color: #64748b; font-size: 11px; cursor: pointer; padding: 0 4px;" title="Remove element">✕</button>
                                </div>
                              `;
                            })
                            .join('')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `
                  : `
                <!-- Records / CAD Hierarchy View -->
                <div style="font-size: 11px; color: #cbd5e1;">
                  <div style="font-weight: 700; color: #38bdf8; margin-bottom: 8px;">▾ QUALITY INSPECTION RECORDS</div>
                  <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;">
                    <div style="background: #0d1a2d; border: 1px solid #1e3a5f; padding: 6px 8px; border-radius: 4px;">
                      <div style="color: #4ade80; font-weight: 700;">● QC Run #148: Bore Datum A</div>
                      <div style="color: #94a3b8; font-size: 10px;">Measured: 24.01 mm · Target: 24.00 ± 0.10 mm (PASS)</div>
                    </div>
                    <div style="background: #0d1a2d; border: 1px solid #1e3a5f; padding: 6px 8px; border-radius: 4px;">
                      <div style="color: #4ade80; font-weight: 700;">● QC Run #147: Gland Torque</div>
                      <div style="color: #94a3b8; font-size: 10px;">Torque: 45.2 Nm · Spec: 45.0 Nm (PASS)</div>
                    </div>
                    <div style="background: #0d1a2d; border: 1px solid #1e3a5f; padding: 6px 8px; border-radius: 4px;">
                      <div style="color: #4ade80; font-weight: 700;">● QC Run #146: Pressure Burst</div>
                      <div style="color: #94a3b8; font-size: 10px;">Pressure: 210.4 Bar · Safe operating (PASS)</div>
                    </div>
                  </div>

                  <div style="font-weight: 700; color: #38bdf8; margin-bottom: 8px;">▾ CAD ASSEMBLY PARTS</div>
                  <div style="display: flex; flex-direction: column; gap: 4px; color: #94a3b8; font-size: 11px;">
                    <div>⚙️ Cylinder Barrel (ST52 Cold Drawn)</div>
                    <div>⚙️ Piston Rod (42CrMo4 Hard Chrome)</div>
                    <div>⚙️ End Cap & Gland (GGG-40 Iron)</div>
                    <div>⚙️ Polyurethane U-Cup Seal (90 Shore)</div>
                  </div>
                </div>
              `
              }
            </div>

            <!-- Left Panel Footer -->
            <div style="padding: 8px 12px; background: #0c1726; border-top: 1px solid #1e3a5f; font-size: 10px; color: #64748b; display: flex; justify-content: space-between;">
              <span>Total Augmentations: <strong style="color: #38bdf8;">${augmentations.length}</strong></span>
              <span>Home.js Ready</span>
            </div>
          </div>

          <!-- COLUMN 2: REAL 3D CANVAS & VIEWPORT (Center Wide Area) -->
          <div style="position: relative; display: flex; flex-direction: column; background: #03070d; overflow: hidden;">
            <!-- Real WebGL Three.js Viewport Container -->
            <div id="vf-three-container" style="flex: 1; position: relative; width: 100%; height: 100%; cursor: grab;">
              <canvas id="vf-three-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block;"></canvas>
              
              <!-- Floating HTML Augmentations Overlay Layer -->
              <div id="vf-html-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden;"></div>

              <!-- Optical Model Target Framing Brackets (Vuforia Alignment Overlay) -->
              <svg style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 5 10 L 2 10 L 2 18" stroke="#38bdf8" stroke-width="0.8" fill="none" opacity="0.8" />
                <path d="M 95 10 L 98 10 L 98 18" stroke="#38bdf8" stroke-width="0.8" fill="none" opacity="0.8" />
                <path d="M 5 90 L 2 90 L 2 82" stroke="#38bdf8" stroke-width="0.8" fill="none" opacity="0.8" />
                <path d="M 95 90 L 98 90 L 98 82" stroke="#38bdf8" stroke-width="0.8" fill="none" opacity="0.8" />
              </svg>

              <!-- Coordinate Axes Legend in bottom-left -->
              <div style="position: absolute; bottom: 12px; left: 16px; font-family: monospace; font-size: 10px; font-weight: 700; background: rgba(10, 16, 26, 0.88); padding: 4px 10px; border-radius: 4px; border: 1px solid #1e3a5f; pointer-events: none; backdrop-filter: blur(4px);">
                <span style="color: #ef4444;">— X</span> · <span style="color: #22c55e;">— Y (Up)</span> · <span style="color: #38bdf8;">— Z</span> · Orbit: Drag Mouse | Zoom: Scroll
              </div>
            </div>

            <!-- Bottom Floating Canvas Toolbar with Tools & Presets as Icons -->
            <div style="background: #09111c; border-top: 1px solid #1e3a5f; padding: 4px 14px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; align-items: center; z-index: 10; gap: 8px;">
              <!-- Left side: Tool Icons, Camera Presets, Wireframe & Selection -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <!-- Gizmo Tool Icons -->
                <div class="vf-icon-group" title="Gizmo Transform Tools">
                  <button class="vf-tool-btn vf-icon-btn ${activeTool === 'select' ? 'active' : ''}" data-tool="select" title="Select Tool (Q)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
                  </button>
                  <button class="vf-tool-btn vf-icon-btn ${activeTool === 'move' ? 'active' : ''}" data-tool="move" title="Translate / Move Tool (W)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>
                  </button>
                  <button class="vf-tool-btn vf-icon-btn ${activeTool === 'rotate' ? 'active' : ''}" data-tool="rotate" title="Rotate Tool (E)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                  </button>
                  <button class="vf-tool-btn vf-icon-btn ${activeTool === 'scale' ? 'active' : ''}" data-tool="scale" title="Scale Tool (R)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>
                  </button>
                </div>

                <span style="width: 1px; height: 16px; background: #1e3a5f;"></span>

                <!-- Camera Presets Icons -->
                <div class="vf-icon-group" title="Camera Perspectives">
                  <button id="vf-btn-cam-iso" class="vf-cam-btn vf-icon-btn ${activePerspective === 'iso' ? 'active' : ''}" title="Isometric 3D View">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 16-9 5-9-5V8l9-5 9 5v8z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 12v9.5"/></svg>
                  </button>
                  <button id="vf-btn-cam-front" class="vf-cam-btn vf-icon-btn ${activePerspective === 'front' ? 'active' : ''}" title="Front Ortho / Perspective View">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3.5"/></svg>
                  </button>
                  <button id="vf-btn-cam-top" class="vf-cam-btn vf-icon-btn ${activePerspective === 'top' ? 'active' : ''}" title="Top-Down View">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                  </button>
                </div>

                <!-- Wireframe Toggle Icon -->
                <div class="vf-icon-group" title="Render Modes">
                  <button id="vf-btn-wireframe" class="vf-icon-btn ${isWireframeActive ? 'active wireframe-active' : ''}" style="${isWireframeActive ? 'color: #f59e0b; border-color: rgba(245,158,11,0.5);' : ''}" title="Toggle CAD Wireframe (${isWireframeActive ? 'ON' : 'OFF'})">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 22 22 22"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
                  </button>
                </div>

                <span style="width: 1px; height: 16px; background: #1e3a5f;"></span>

                <div style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 6px;">
                  <span>Selected: <strong style="color: #38bdf8;">${selectedAug ? selectedAug.name : (currentProject.template === 'blank' || currentProject.associatedModelId === 'none' ? 'Empty Canvas (No Model)' : 'CAD Model Root')}</strong></span>
                </div>
              </div>

              <!-- Right side: IoT Telemetry & Zoom Controls -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: rgba(34, 197, 94, 0.12); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.25); font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;" title="${activeTarget ? activeTarget.name : 'Model Target'}">
                  ● ${activeTarget ? activeTarget.type.toUpperCase().replace('_', ' ') : 'MODEL TARGET'} (${activeTarget ? activeTarget.robustnessScore : 99.4}%)
                </span>

                <span style="width: 1px; height: 16px; background: #1e3a5f;"></span>

                <span style="font-family: monospace; color: #4ade80; font-size: 10px; display: flex; align-items: center; gap: 5px;">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 6px #4ade80;"></span>
                  IoT Live: ONLINE
                </span>

                <span style="width: 1px; height: 16px; background: #1e3a5f;"></span>

                <!-- Zoom Controls -->
                <div class="vf-icon-group">
                  <button id="vf-btn-zoom-out" class="vf-icon-btn" title="Zoom Out" style="width: 22px; height: 22px;">—</button>
                  <span id="vf-zoom-label" style="font-family: monospace; font-size: 10px; font-weight: 700; color: #fff; min-width: 32px; text-align: center;">${canvasZoomPercent}%</span>
                  <button id="vf-btn-zoom-in" class="vf-icon-btn" title="Zoom In" style="width: 22px; height: 22px;">+</button>
                </div>
                <button id="vf-btn-zoom-fit" class="btn btn-secondary btn-sm" style="padding: 2px 7px; font-size: 10px; border-radius: 4px;" title="Fit Camera to Model">⛶ Fit</button>
                <button id="vf-btn-zoom-reset" class="btn btn-secondary btn-sm" style="padding: 2px 7px; font-size: 10px; border-radius: 4px;" title="Reset Orbit">↺ Reset</button>

                <span style="width: 1px; height: 16px; background: #1e3a5f;"></span>

                <button id="vf-btn-preview-ar" data-testid="vf-btn-preview-ar" class="btn btn-amber btn-sm" style="padding: 2px 9px; font-size: 11px; font-weight: 700; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; border: none; border-radius: 4px; display: flex; align-items: center; gap: 4px; cursor: pointer;" title="Launch this project in AR Passthrough Mode">
                  <span>👓</span> Run AR
                </button>

                <button id="vf-btn-help-guide" data-testid="vf-btn-help-guide" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; border-radius: 4px; cursor: pointer;" title="Vuforia Studio & AR Experience User Guide">
                  <span>❓</span> Help
                </button>
              </div>
            </div>
          </div>

          <!-- COLUMN 3: MODEL · DETAILS & PROPERTIES (Right Panel with WIDGET / SCREEN / IOT Tabs) -->
          <div style="background: #09111c; border-left: 1px solid #1e3a5f; display: flex; flex-direction: column; overflow: hidden;">
            <!-- Tab Header (Right Panel Inspector - Icon Tabs) -->
            <div class="vf-tab-bar">
              <div class="vf-right-tab-btn vf-tab-item ${activeRightTab === 'widget' ? 'active' : ''}" data-tab="widget" title="Widget Properties & Transforms">
                <span style="font-size: 16px;">🧩</span>
              </div>
              <div class="vf-right-tab-btn vf-tab-item ${activeRightTab === 'model' ? 'active' : ''}" data-tab="model" title="Screen & 3D CAD Model Target">
                <span style="font-size: 16px;">🧊</span>
              </div>
              <div class="vf-right-tab-btn vf-tab-item ${activeRightTab === 'iot' ? 'active' : ''}" data-tab="iot" title="ThingWorx IoT Live Telemetry">
                <span style="font-size: 16px;">📡</span>
              </div>
            </div>

            <div style="flex: 1; overflow-y: auto; padding: 14px 16px; font-size: 12px;">
              ${
                activeRightTab === 'widget'
                  ? `
                <!-- TAB 1: WIDGET PROPERTIES -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="font-weight: 700; color: #38bdf8; font-size: 11px;">▾ WIDGET CONFIGURATION</span>
                  ${selectedAug ? `<button id="vf-btn-remove-selected" style="background: transparent; border: none; color: #f43f5e; font-size: 11px; font-weight: 700; cursor: pointer;">✕ Remove</button>` : ''}
                </div>

                ${
                  selectedAug
                    ? `
                  <div style="margin-bottom: 10px;">
                    <label style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 3px;">Augmentation Label / Title</label>
                    <input id="vf-input-label" type="text" class="form-input" value="${selectedAug.label}" style="font-size: 11px; padding: 4px 8px; width: 100%;" />
                  </div>

                  <div style="margin-bottom: 10px;">
                    <label style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 3px;">→) Scale</label>
                    <input id="vf-input-scale" type="number" step="0.1" min="0.2" max="3" class="form-input" value="${selectedAug.scale}" style="font-size: 11px; padding: 4px 8px; width: 100%;" />
                  </div>

                  <!-- 6DOF Spatial Coordinates -->
                  <div style="margin-bottom: 10px;">
                    <div style="font-size: 11px; color: #94a3b8; margin-bottom: 3px;">3D Position (Meters)</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
                      <div>
                        <label style="font-size: 10px; color: #64748b;">X Coord</label>
                        <input id="vf-input-pos-x" type="number" step="0.05" class="form-input" value="${selectedAug.position[0]}" style="font-size: 11px; padding: 3px 6px; width: 100%;" />
                      </div>
                      <div>
                        <label style="font-size: 10px; color: #64748b;">Y Coord</label>
                        <input id="vf-input-pos-y" type="number" step="0.05" class="form-input" value="${selectedAug.position[1]}" style="font-size: 11px; padding: 3px 6px; width: 100%;" />
                      </div>
                      <div>
                        <label style="font-size: 10px; color: #64748b;">Z Coord</label>
                        <input id="vf-input-pos-z" type="number" step="0.05" class="form-input" value="${selectedAug.position[2]}" style="font-size: 11px; padding: 3px 6px; width: 100%;" />
                      </div>
                    </div>
                  </div>

                  <!-- 3-Axis Rotation -->
                  <div style="margin-bottom: 14px;">
                    <div style="font-size: 11px; color: #94a3b8; margin-bottom: 3px;">Rotation (Degrees)</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
                      <div>
                        <label style="font-size: 10px; color: #64748b;">X Rot</label>
                        <input id="vf-input-rot-x" type="number" step="15" class="form-input" value="${selectedAug.rotation[0]}" style="font-size: 11px; padding: 3px 6px; width: 100%;" />
                      </div>
                      <div>
                        <label style="font-size: 10px; color: #64748b;">Y Rot</label>
                        <input id="vf-input-rot-y" type="number" step="15" class="form-input" value="${selectedAug.rotation[1]}" style="font-size: 11px; padding: 3px 6px; width: 100%;" />
                      </div>
                      <div>
                        <label style="font-size: 10px; color: #64748b;">Z Rot</label>
                        <input id="vf-input-rot-z" type="number" step="15" class="form-input" value="${selectedAug.rotation[2]}" style="font-size: 11px; padding: 3px 6px; width: 100%;" />
                      </div>
                    </div>
                  </div>

                  <!-- Telemetry Binding Selector -->
                  <div style="margin-bottom: 14px;">
                    <label style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 3px;">→) Telemetry Data Binding</label>
                    <select id="vf-select-binding" class="form-select" style="font-size: 11px; padding: 4px 8px; width: 100%;">
                      <option value="none" ${selectedAug.bindingField === 'none' ? 'selected' : ''}>None (Static Annotation)</option>
                      <option value="pressure" ${selectedAug.bindingField === 'pressure' ? 'selected' : ''}>Hydraulic Pressure (Bar)</option>
                      <option value="temperature" ${selectedAug.bindingField === 'temperature' ? 'selected' : ''}>Fluid Temperature (°C)</option>
                      <option value="vibration" ${selectedAug.bindingField === 'vibration' ? 'selected' : ''}>Vibration RMS (mm/s)</option>
                      <option value="flowRate" ${selectedAug.bindingField === 'flowRate' ? 'selected' : ''}>Flow Rate (L/min)</option>
                    </select>
                  </div>
                `
                    : `
                  <div style="background: #0d1724; border: 1px dashed #1e3a5f; padding: 14px; border-radius: 6px; color: #94a3b8; font-size: 11px; text-align: center; margin-bottom: 16px;">
                    Select an augmentation from the top ribbon, 3D scene, or Project Tree to configure its 3D properties.
                  </div>
                `
                }

                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #1e3a5f;">
                  <span style="font-size: 11px; color: #94a3b8;">WebXR Occlusion</span>
                  <span style="font-size: 11px; font-weight: 700; color: #4ade80;">REAL-TIME DEPTH (float32)</span>
                </div>
              `
                  : activeRightTab === 'model'
                  ? `
                <!-- TAB 2: MODEL RESOURCE & TARGET -->
                <div style="font-weight: 700; color: #38bdf8; font-size: 11px; margin-bottom: 10px;">▾ CAD MODEL & TARGET PROPERTIES</div>

                <div style="margin-bottom: 12px;">
                  <label style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 3px;">→) CAD Model Resource</label>
                  <select id="vf-select-resource" class="form-select" style="font-size: 11px; padding: 4px 8px; width: 100%;">
                    <option value="none" ${currentProject.associatedModelId === 'none' ? 'selected' : ''}>
                      None (Empty Canvas — Blank Slate)
                    </option>
                    ${models
                      .map(
                        (m, idx) => `
                      <option value="${idx}" ${currentProject.associatedModelId !== 'none' && idx === activeModelIndex ? 'selected' : ''}>
                        ${m.name} (${m.format.toUpperCase()})
                      </option>
                    `
                      )
                      .join('')}
                  </select>
                </div>

                <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 6px; padding: 10px; margin-bottom: 14px; font-size: 11px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div style="color: #38bdf8; font-weight: 700;">Vuforia Target Manager Status</div>
                    <button id="vf-btn-manage-targets-tab" class="btn btn-secondary btn-sm" style="padding: 2px 6px; font-size: 10px;">Manager ↗</button>
                  </div>
                  <div style="color: #94a3b8; line-height: 1.5;">
                    <div>• Active Target: <strong style="color: #fff;">${activeTarget.name}</strong></div>
                    <div>• Target Type: <span style="color: #38bdf8; text-transform: uppercase;">${activeTarget.type.replace('_', ' ')}</span></div>
                    <div>• Robustness Rating: <strong style="color: #4ade80;">${activeTarget.robustnessScore}% (${activeTarget.ratingStars} ⭐)</strong></div>
                    <div>• Guide View: <span style="color: #e2e8f0;">${(activeTarget.guideViewPreset || 'Isometric').toUpperCase()}</span></div>
                    <div>• Tracking Algorithm: <span style="color: #94a3b8;">${activeTarget.type === 'model_target' ? 'CAD Feature Edge Tracker' : 'Visual Feature Point Correlation'}</span></div>
                  </div>
                </div>

                <!-- Deploy / Export Card -->
                <div style="padding: 12px; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; text-align: center;">
                  <div style="font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 4px;">Zero-Install WebXR Target</div>
                  <p style="font-size: 10px; color: #94a3b8; margin-bottom: 10px;">Ready for instant deployment to Meta Quest 3 Browser & WebXR AR passthrough.</p>
                  <button id="vf-btn-deploy-quest" class="btn btn-primary btn-sm" style="width: 100%; justify-content: center;">
                    Deploy Experience to Meta Quest 3 →
                  </button>
                </div>
              `
                  : `
                <!-- TAB 3: THINGWORX IOT DATA -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-weight: 700; color: #38bdf8; font-size: 11px;">▾ THINGWORX IOT TELEMETRY</span>
                  <span style="font-size: 10px; color: #4ade80;">● Live Stream</span>
                </div>

                <div style="background: #060b13; border: 1px solid #1e3a5f; border-radius: 6px; padding: 12px; font-size: 11px;">
                  <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">CONNECTED INDUSTRIAL SENSORS:</div>

                  <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #94a3b8;">HydraulicPressure:</span>
                        <strong id="live-val-pressure" style="color: #38bdf8; font-family: monospace;">${telemetry.pressureBar.toFixed(1)} Bar</strong>
                      </div>
                      <div style="height: 4px; background: #1e3a5f; border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; width: ${(telemetry.pressureBar / 250) * 100}%; background: #38bdf8;"></div>
                      </div>
                    </div>

                    <div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #94a3b8;">OilTemperature:</span>
                        <strong id="live-val-temp" style="color: #f59e0b; font-family: monospace;">${telemetry.temperatureC.toFixed(1)} °C</strong>
                      </div>
                      <div style="height: 4px; background: #1e3a5f; border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; width: ${(telemetry.temperatureC / 100) * 100}%; background: #f59e0b;"></div>
                      </div>
                    </div>

                    <div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #94a3b8;">VibrationRms:</span>
                        <strong id="live-val-vib" style="color: #4ade80; font-family: monospace;">${telemetry.vibrationRms.toFixed(3)} mm/s</strong>
                      </div>
                      <div style="height: 4px; background: #1e3a5f; border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; width: ${(telemetry.vibrationRms / 0.15) * 100}%; background: #4ade80;"></div>
                      </div>
                    </div>

                    <div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #94a3b8;">FlowRate:</span>
                        <strong id="live-val-flow" style="color: #cbd5e1; font-family: monospace;">${telemetry.flowRateLmin.toFixed(1)} L/min</strong>
                      </div>
                      <div style="height: 4px; background: #1e3a5f; border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; width: ${(telemetry.flowRateLmin / 25) * 100}%; background: #cbd5e1;"></div>
                      </div>
                    </div>
                  </div>

                  <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #1e3a5f; display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 10px; color: #64748b;">Auto-Refresh Stream:</span>
                    <input id="vf-check-autorefresh" type="checkbox" ${isAutoRefreshActive ? 'checked' : ''} style="accent-color: #38bdf8;" />
                  </div>
                </div>
              `
              }
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize Real Three.js Canvas
    initThreeCanvas();

    // Bind Event Listeners
    bindUIEventListeners();
  };

  const initThreeCanvas = () => {
    const canvas = container.querySelector('#vf-three-canvas') as HTMLCanvasElement;
    const canvasContainer = container.querySelector('#vf-three-container') as HTMLElement;
    if (!canvas || !canvasContainer) return;

    // Clean up previous instance
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (threeRenderer) {
      threeRenderer.dispose();
      threeRenderer = null;
    }

    const width = canvasContainer.clientWidth || 600;
    const height = canvasContainer.clientHeight || 400;

    scene = new Scene();
    scene.background = new Color(0x04080e);

    camera = new PerspectiveCamera(45, width / height, 0.1, 100);
    updateCameraPosition();

    threeRenderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    threeRenderer.setSize(width, height);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Lights
    const ambientLight = new AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new DirectionalLight(0xffffff, 2.2);
    dirLight1.position.set(2, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new DirectionalLight(0x38bdf8, 1.0);
    dirLight2.position.set(-2, -1, -2);
    scene.add(dirLight2);

    // Coordinate Grid & Axes
    const grid = new GridHelper(2, 20, 0x1e3a5f, 0x0e1c2e);
    grid.position.y = -0.25;
    scene.add(grid);

    const axes = new AxesHelper(0.4);
    axes.position.set(-0.6, -0.24, -0.6);
    scene.add(axes);

    // Groups
    modelMeshGroup = new Group();
    scene.add(modelMeshGroup);

    pinsMeshGroup = new Group();
    scene.add(pinsMeshGroup);

    rebuild3DSceneGeometry();
    rebuild3DPinAnchors();

    // Mouse Drag Orbit Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    canvas.addEventListener('pointerdown', (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvasContainer.style.cursor = 'grabbing';
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      camTheta -= deltaX * 0.008;
      camPhi = Math.max(0.05, Math.min(Math.PI - 0.05, camPhi - deltaY * 0.008));
      updateCameraPosition();
    });

    canvas.addEventListener('pointerup', (e) => {
      isDragging = false;
      canvas.releasePointerCapture(e.pointerId);
      canvasContainer.style.cursor = 'grab';
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      camRadius = Math.max(0.6, Math.min(4.5, camRadius + e.deltaY * 0.0015));
      updateCameraPosition();
    });

    // Window Resize Handler
    const onResize = () => {
      if (!canvasContainer || !camera || !threeRenderer) return;
      const w = canvasContainer.clientWidth;
      const h = canvasContainer.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      threeRenderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation & Floating Screen-space Overlay Loop
    const tempVec = new Vector3();
    const overlayLayer = container.querySelector('#vf-html-overlay') as HTMLElement;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (threeRenderer && scene && camera) {
        threeRenderer.render(scene, camera);

        // Update 3D Floating Labels & Gauges on top of WebGL canvas
        if (overlayLayer && canvasContainer) {
          const w = canvasContainer.clientWidth;
          const h = canvasContainer.clientHeight;

          let overlayHtml = '';

          augmentations.forEach((aug) => {
            tempVec.set(...aug.position);
            tempVec.project(camera!);

            // In front of camera
            if (tempVec.z < 1.0) {
              const screenX = (tempVec.x * 0.5 + 0.5) * w;
              const screenY = (-tempVec.y * 0.5 + 0.5) * h;

              const isSelected = aug.id === selectedElementId;
              const valueText = getBindingValue(aug);

              if (aug.type === '3dgauge') {
                overlayHtml += `
                  <div class="vf-overlay-tag" data-id="${aug.id}" style="pointer-events: auto; position: absolute; left: ${screenX}px; top: ${screenY}px; transform: translate(-50%, -100%); cursor: pointer; user-select: none;">
                    <div style="background: rgba(9, 17, 28, 0.94); border: 2px solid ${isSelected ? '#38bdf8' : '#1e3a5f'}; border-radius: 8px; padding: 6px 12px; box-shadow: ${isSelected ? '0 0 16px rgba(56, 189, 248, 0.6)' : '0 4px 12px rgba(0,0,0,0.5)'}; text-align: center; min-width: 120px;">
                      <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">${aug.label}</div>
                      <div style="font-size: 15px; font-weight: 800; color: ${aug.bindingField === 'temperature' ? '#f59e0b' : '#38bdf8'}; font-family: monospace; margin: 2px 0;">${valueText}</div>
                      <div style="font-size: 8px; color: #4ade80;">● Auto-Refreshed (1s)</div>
                    </div>
                    <div style="width: 2px; height: 18px; background: ${isSelected ? '#38bdf8' : '#1e3a5f'}; margin: 0 auto;"></div>
                  </div>
                `;
              } else if (aug.type === 'thingmark') {
                overlayHtml += `
                  <div class="vf-overlay-tag" data-id="${aug.id}" style="pointer-events: auto; position: absolute; left: ${screenX}px; top: ${screenY}px; transform: translate(-50%, -100%); cursor: pointer; user-select: none;">
                    <div style="background: rgba(9, 17, 28, 0.94); border: 2px dashed ${isSelected ? '#4ade80' : '#22c55e'}; border-radius: 6px; padding: 4px 10px; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);">
                      <span style="font-size: 12px;">🎯</span>
                      <span style="font-size: 11px; font-weight: 700; color: #4ade80;">${aug.label}</span>
                    </div>
                    <div style="width: 2px; height: 16px; background: #22c55e; margin: 0 auto;"></div>
                  </div>
                `;
              } else {
                // 3D Label / Datum
                overlayHtml += `
                  <div class="vf-overlay-tag" data-id="${aug.id}" style="pointer-events: auto; position: absolute; left: ${screenX}px; top: ${screenY}px; transform: translate(-50%, -100%); cursor: pointer; user-select: none;">
                    <div style="background: ${isSelected ? 'rgba(14, 165, 233, 0.95)' : 'rgba(15, 28, 46, 0.9)'}; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; border: 1px solid ${isSelected ? '#7dd3fc' : '#1e3a5f'}; box-shadow: ${isSelected ? '0 0 15px rgba(14, 165, 233, 0.6)' : 'none'}; display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                      <span>🏷️</span>
                      <span>${aug.label}</span>
                    </div>
                    <div style="width: 2px; height: 16px; background: ${isSelected ? '#38bdf8' : '#1e3a5f'}; margin: 0 auto;"></div>
                  </div>
                `;
              }
            }
          });

          overlayLayer.innerHTML = overlayHtml;

          // Bind tag clicks
          overlayLayer.querySelectorAll('.vf-overlay-tag').forEach((tag) => {
            tag.addEventListener('click', (e) => {
              e.stopPropagation();
              const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
              if (id) {
                selectedElementId = id;
                rebuild3DPinAnchors();
                renderUI();
              }
            });
          });
        }
      }
    };

    animate();
  };

  const bindUIEventListeners = () => {
    // Left Tab switching (SCREENS / RECORDS)
    container.querySelectorAll('.vf-left-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        activeLeftTab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
        renderUI();
      });
    });

    // Right Tab switching (WIDGET / MODEL / IOT)
    container.querySelectorAll('.vf-right-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        activeRightTab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
        renderUI();
      });
    });

    // Tree item delete buttons
    container.querySelectorAll('.vf-tree-item-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (id) {
          augmentations = augmentations.filter((a) => a.id !== id);
          if (selectedElementId === id) {
            selectedElementId = augmentations[0]?.id || 'model-1';
          }
          vuforiaProjectService.saveProjectAugmentations(augmentations);
          rebuild3DPinAnchors();
          renderUI();
        }
      });
    });

    // Project Tree Item Clicks
    container.querySelectorAll('.vf-tree-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (id) {
          selectedElementId = id;
          activeRightTab = 'widget';
          rebuild3DPinAnchors();
          renderUI();
        }
      });
    });

    // Tool Buttons (Select, Move, Rotate, Scale)
    container.querySelectorAll('.vf-tool-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tool = (e.currentTarget as HTMLElement).getAttribute('data-tool') as any;
        if (tool) {
          activeTool = tool;
          renderUI();
        }
      });
    });

    // Camera Presets
    container.querySelector('#vf-btn-cam-iso')?.addEventListener('click', () => setCameraPreset('iso'));
    container.querySelector('#vf-btn-cam-front')?.addEventListener('click', () => setCameraPreset('front'));
    container.querySelector('#vf-btn-cam-top')?.addEventListener('click', () => setCameraPreset('top'));

    // Wireframe Toggle (Three.js real toggle)
    container.querySelector('#vf-btn-wireframe')?.addEventListener('click', () => {
      isWireframeActive = !isWireframeActive;
      if (modelMeshGroup) {
        modelMeshGroup.traverse((child: any) => {
          if (child.isMesh && child.material) {
            child.material.wireframe = isWireframeActive;
          }
        });
      }
      renderUI();
    });

    // Canvas Bottom Zoom Controls (Image 2 style)
    container.querySelector('#vf-btn-zoom-in')?.addEventListener('click', () => {
      camRadius = Math.max(0.6, camRadius - 0.25);
      canvasZoomPercent = Math.min(200, canvasZoomPercent + 15);
      updateCameraPosition();
      const zoomLabel = container.querySelector('#vf-zoom-label');
      if (zoomLabel) zoomLabel.textContent = `${canvasZoomPercent}%`;
    });

    container.querySelector('#vf-btn-zoom-out')?.addEventListener('click', () => {
      camRadius = Math.min(4.5, camRadius + 0.25);
      canvasZoomPercent = Math.max(50, canvasZoomPercent - 15);
      updateCameraPosition();
      const zoomLabel = container.querySelector('#vf-zoom-label');
      if (zoomLabel) zoomLabel.textContent = `${canvasZoomPercent}%`;
    });

    container.querySelector('#vf-btn-zoom-fit')?.addEventListener('click', () => {
      camRadius = 1.35;
      canvasZoomPercent = 110;
      updateCameraPosition();
      const zoomLabel = container.querySelector('#vf-zoom-label');
      if (zoomLabel) zoomLabel.textContent = `${canvasZoomPercent}%`;
    });

    container.querySelector('#vf-btn-zoom-reset')?.addEventListener('click', () => {
      setCameraPreset('iso');
      canvasZoomPercent = 100;
      const zoomLabel = container.querySelector('#vf-zoom-label');
      if (zoomLabel) zoomLabel.textContent = `100%`;
    });

    // Horizontal Widgets Ribbon Add Buttons
    container.querySelectorAll('.vf-widget-add').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const widgetType = (e.currentTarget as HTMLElement).getAttribute('data-widget');
        const newId = `${widgetType}-${Date.now().toString().slice(-4)}`;

        if (widgetType === 'add_target') {
          openVuforiaTargetManagerModal({
            initialTab: 'add_target',
            onTargetActivated: handleTargetActivated,
            onLoadTargetTemplate: handleLoadTargetTemplate,
          });
          return;
        } else if (widgetType === 'model_target' || widgetType === 'spatial_target' || widgetType === 'thingmark') {
          openVuforiaTargetManagerModal({
            initialTab: 'database',
            onTargetActivated: handleTargetActivated,
            onLoadTargetTemplate: handleLoadTargetTemplate,
          });
          return;
        } else if (widgetType === '3dlabel') {
          augmentations.push({
            id: newId,
            type: '3dlabel',
            name: `3DLabel-${augmentations.length + 1}`,
            label: `New Datum Point #${augmentations.length + 1}`,
            position: [Math.random() * 0.4 - 0.2, 0.25, Math.random() * 0.2 - 0.1],
            rotation: [0, 0, 0],
            scale: 1.0,
            bindingField: 'none',
          });
          selectedElementId = newId;
          activeRightTab = 'widget';
          toastMessage = `✓ Added 3D Label [${newId}] to scene!`;
        } else if (widgetType === '3dgauge') {
          augmentations.push({
            id: newId,
            type: '3dgauge',
            name: `3DGauge-${augmentations.length + 1}`,
            label: `Hydraulic Sensor Metric`,
            position: [Math.random() * 0.4 - 0.2, 0.35, Math.random() * 0.2 - 0.1],
            rotation: [0, 0, 0],
            scale: 1.0,
            bindingField: 'pressure',
          });
          selectedElementId = newId;
          activeRightTab = 'widget';
          toastMessage = `✓ Added 3D Gauge [${newId}] to scene!`;
        } else if (widgetType === 'spatial_pin') {
          augmentations.push({
            id: newId,
            type: 'spatial_pin',
            name: `SpatialPin-${augmentations.length + 1}`,
            label: `Inspection Waypoint Pin`,
            position: [Math.random() * 0.4 - 0.2, 0.2, Math.random() * 0.2 - 0.1],
            rotation: [0, 0, 0],
            scale: 1.0,
            bindingField: 'none',
          });
          selectedElementId = newId;
          activeRightTab = 'widget';
          toastMessage = `✓ Added 3D Spatial Pin [${newId}]!`;
        } else if (widgetType === 'thingmark') {
          augmentations.push({
            id: newId,
            type: 'thingmark',
            name: `thingMark-${augmentations.length + 1}`,
            label: `ThingMark: ASSET-ID-${Math.floor(1000 + Math.random() * 9000)}`,
            position: [-0.35, -0.15, 0.0],
            rotation: [0, 0, 0],
            scale: 1.0,
            bindingField: 'none',
          });
          selectedElementId = newId;
          activeRightTab = 'widget';
          toastMessage = `✓ Added ThingMark [${newId}]!`;
        } else if (widgetType === '3dimage') {
          augmentations.push({
            id: newId,
            type: '3dlabel',
            name: `3DImage-${augmentations.length + 1}`,
            label: `Exploded View Schematic Callout`,
            position: [0.15, 0.28, 0.0],
            rotation: [0, 0, 0],
            scale: 1.0,
            bindingField: 'none',
          });
          selectedElementId = newId;
          activeRightTab = 'widget';
          toastMessage = `✓ Added 3D Image Callout [${newId}]!`;
        } else if (widgetType === 'tml_text') {
          augmentations.push({
            id: newId,
            type: '3dlabel',
            name: `SOPCard-${augmentations.length + 1}`,
            label: `SOP Instruction: Check O-Ring Depth`,
            position: [-0.1, 0.15, 0.1],
            rotation: [0, 0, 0],
            scale: 1.0,
            bindingField: 'none',
          });
          selectedElementId = newId;
          activeRightTab = 'widget';
          toastMessage = `✓ Added SOP Card [${newId}]!`;
        } else if (widgetType === 'qc_tolerance') {
          augmentations.push({
            id: newId,
            type: '3dlabel',
            name: `Tolerance-${augmentations.length + 1}`,
            label: `Tolerance Datum: ±0.05 mm (PASS)`,
            position: [0.2, 0.2, -0.05],
            rotation: [0, 0, 0],
            scale: 1.0,
            bindingField: 'none',
          });
          selectedElementId = newId;
          activeRightTab = 'widget';
          toastMessage = `✓ Added Quality Tolerance Pin [${newId}]!`;
        } else if (widgetType === 'sensor_chart') {
          augmentations.push({
            id: newId,
            type: '3dgauge',
            name: `SensorChart-${augmentations.length + 1}`,
            label: `Live Pressure Trend Curve`,
            position: [-0.2, 0.38, 0.0],
            rotation: [0, 0, 0],
            scale: 1.0,
            bindingField: 'pressure',
          });
          selectedElementId = newId;
          activeRightTab = 'widget';
          toastMessage = `✓ Added Telemetry Chart [${newId}]!`;
        } else if (widgetType === 'digital_twin') {
          activeRightTab = 'iot';
          toastMessage = `✓ Synchronized ThingWorx Digital Twin stream!`;
        }

        vuforiaProjectService.saveProjectAugmentations(augmentations);
        rebuild3DPinAnchors();
        renderUI();

        setTimeout(() => {
          toastMessage = '';
          const msg = container.querySelector('#vf-toast-msg');
          if (msg) msg.remove();
        }, 3500);
      });
    });

    container.querySelector('#vf-btn-add-screen-target')?.addEventListener('click', () => {
      openVuforiaTargetManagerModal({
        initialTab: 'add_target',
        onTargetActivated: handleTargetActivated,
        onLoadTargetTemplate: handleLoadTargetTemplate,
      });
    });

    container.querySelector('#vf-tree-target-mgr-link')?.addEventListener('click', () => {
      openVuforiaTargetManagerModal({
        initialTab: 'database',
        onTargetActivated: handleTargetActivated,
        onLoadTargetTemplate: handleLoadTargetTemplate,
      });
    });

    container.querySelector('#vf-btn-manage-targets-tab')?.addEventListener('click', () => {
      openVuforiaTargetManagerModal({
        initialTab: 'database',
        onTargetActivated: handleTargetActivated,
        onLoadTargetTemplate: handleLoadTargetTemplate,
      });
    });

    // Project Switcher Dropdown
    container.querySelector('#vf-select-active-project')?.addEventListener('change', (e) => {
      const projId = (e.target as HTMLSelectElement).value;
      const switched = vuforiaProjectService.switchActiveProject(projId);
      if (switched) {
        currentProject = switched;
        projectName = switched.name;
        if (switched.template === 'blank') {
          currentProject.associatedModelId = 'none';
        }

        // Sync active target according to project
        const matchedTarget = vuforiaTargetManagerService.getTargets().find((t) => t.id === switched.targetId || t.type === switched.targetType || t.type === switched.template);
        if (matchedTarget) {
          activeTarget = matchedTarget;
          vuforiaTargetManagerService.setActiveTarget(matchedTarget.id);
        }

        const mIdx = models.findIndex((m) => m.id === currentProject.associatedModelId);
        activeModelIndex = mIdx >= 0 ? mIdx : 0;
        activeModel = models[activeModelIndex] || SEED_HYDRAULIC_MODEL;
        augmentations = switched.augmentations
          ? [...switched.augmentations]
          : vuforiaProjectService.generateTemplateAugmentations(switched.template);
        selectedElementId = augmentations[0]?.id || (currentProject.associatedModelId === 'none' ? '' : 'model-1');

        const overlayEl = container.querySelector('#vf-html-overlay');
        if (overlayEl) overlayEl.innerHTML = '';

        rebuild3DSceneGeometry();
        rebuild3DPinAnchors();
        toastMessage = `✓ Switched to project: "${switched.name}"`;
        renderUI();
      }
    });

    // Project Name Inline Editing
    const inputProjectName = container.querySelector('#vf-input-project-name') as HTMLInputElement;
    let isCommittingRename = false;
    const commitProjectRename = () => {
      if (isCommittingRename) return;
      if (!inputProjectName) return;
      const val = inputProjectName.value.trim();
      if (!val || val === currentProject.name) return;
      isCommittingRename = true;
      currentProject = vuforiaProjectService.updateProjectName(val);
      projectName = currentProject.name;
      toastMessage = `✓ Project renamed to "${projectName}"`;
      renderUI();
    };

    inputProjectName?.addEventListener('change', commitProjectRename);
    inputProjectName?.addEventListener('blur', commitProjectRename);
    inputProjectName?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        inputProjectName.blur();
      }
    });

    // New Project Modal Action
    container.querySelector('#vf-btn-new-project')?.addEventListener('click', () => {
      openVuforiaNewProjectModal({
        onProjectCreated: ({ project, augmentations: newAugs, modelIndex }) => {
          currentProject = project;
          projectName = project.name;
          if (project.template === 'blank' || project.associatedModelId === 'none') {
            currentProject.associatedModelId = 'none';
          }
          augmentations = [...newAugs];
          selectedElementId = augmentations[0]?.id || (currentProject.associatedModelId === 'none' ? '' : 'model-1');
          activeModelIndex = modelIndex >= 0 ? modelIndex : 0;
          activeModel = models[activeModelIndex] || SEED_HYDRAULIC_MODEL;

          // Sync active target according to project template/target
          const matchedTarget = vuforiaTargetManagerService.getTargets().find(
            (t) => t.id === project.targetId || t.type === project.targetType || t.type === project.template
          );
          if (matchedTarget) {
            activeTarget = matchedTarget;
            vuforiaTargetManagerService.setActiveTarget(matchedTarget.id);
          }

          // Clear floating overlay immediately
          const overlayEl = container.querySelector('#vf-html-overlay');
          if (overlayEl) overlayEl.innerHTML = '';

          rebuild3DSceneGeometry();
          rebuild3DPinAnchors();
          toastMessage = `✓ Created new project: "${project.name}" (${project.template.toUpperCase().replace('_', ' ')})`;
          renderUI();
        },
      });
    });

    // Edit Project Modal Action
    const handleOpenEditProject = () => {
      openVuforiaEditProjectModal({
        project: currentProject,
        onProjectUpdated: ({ project: updated, modelIndex }) => {
          currentProject = updated;
          projectName = updated.name;
          if (updated.template === 'blank' || updated.associatedModelId === 'none') {
            currentProject.associatedModelId = 'none';
          }
          selectedElementId = augmentations[0]?.id || (currentProject.associatedModelId === 'none' ? '' : 'model-1');
          activeModelIndex = modelIndex >= 0 ? modelIndex : 0;
          activeModel = models[activeModelIndex] || SEED_HYDRAULIC_MODEL;

          const matchedTarget = vuforiaTargetManagerService.getTargets().find(
            (t) => t.id === updated.targetId || t.type === updated.targetType || t.type === updated.template
          );
          if (matchedTarget) {
            activeTarget = matchedTarget;
            vuforiaTargetManagerService.setActiveTarget(matchedTarget.id);
          }

          rebuild3DSceneGeometry();
          rebuild3DPinAnchors();
          toastMessage = `✓ Project updated: "${updated.name}"`;
          renderUI();
        },
        onProjectDeleted: (remaining) => {
          currentProject = remaining;
          projectName = remaining.name;
          if (remaining.template === 'blank' || remaining.associatedModelId === 'none') {
            currentProject.associatedModelId = 'none';
          }
          augmentations = remaining.augmentations ? [...remaining.augmentations] : vuforiaProjectService.generateTemplateAugmentations(remaining.template);
          selectedElementId = augmentations[0]?.id || (currentProject.associatedModelId === 'none' ? '' : 'model-1');
          const mIdx = models.findIndex((m) => m.id === remaining.associatedModelId);
          activeModelIndex = mIdx >= 0 ? mIdx : 0;
          activeModel = models[activeModelIndex] || SEED_HYDRAULIC_MODEL;
          rebuild3DSceneGeometry();
          rebuild3DPinAnchors();
          toastMessage = `✓ Switched to remaining project: "${remaining.name}"`;
          renderUI();
        },
      });
    };

    container.querySelector('#vf-btn-edit-project')?.addEventListener('click', handleOpenEditProject);
    container.querySelector('#vf-btn-cfg-edit-project')?.addEventListener('click', handleOpenEditProject);

    // Import Project Action
    const btnImport = container.querySelector('#vf-btn-import-project');
    const fileImportInput = container.querySelector('#vf-file-import-project') as HTMLInputElement;

    btnImport?.addEventListener('click', () => {
      fileImportInput?.click();
    });

    fileImportInput?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        try {
          const content = loadEvt.target?.result as string;
          const parsed = JSON.parse(content);
          const imported = vuforiaProjectService.importProject(parsed);

          currentProject = imported;
          projectName = imported.name;
          augmentations = imported.augmentations ? [...imported.augmentations] : [];
          selectedElementId = augmentations[0]?.id || 'model-1';

          const mIdx = models.findIndex((m) => m.id === imported.associatedModelId);
          activeModelIndex = mIdx >= 0 ? mIdx : 0;
          activeModel = models[activeModelIndex] || SEED_HYDRAULIC_MODEL;

          const matchedTarget = vuforiaTargetManagerService.getTargets().find(
            (t) => t.id === imported.targetId || t.type === imported.targetType || t.type === imported.template
          );
          if (matchedTarget) {
            activeTarget = matchedTarget;
            vuforiaTargetManagerService.setActiveTarget(matchedTarget.id);
          }

          rebuild3DSceneGeometry();
          rebuild3DPinAnchors();
          toastMessage = `✓ Successfully imported project: "${imported.name}"!`;
          renderUI();
        } catch (err: any) {
          alert(`Failed to import project: ${err.message || 'Invalid JSON format'}`);
        }
      };
      reader.readAsText(file);
      fileImportInput.value = '';
    });

    container.querySelector('#vf-btn-add-aug-tree')?.addEventListener('click', () => {
      const btn = container.querySelector('.vf-widget-add[data-widget="3dlabel"]') as HTMLButtonElement;
      btn?.click();
    });

    // Remove Selected Augmentation
    container.querySelector('#vf-btn-remove-selected')?.addEventListener('click', () => {
      augmentations = augmentations.filter((a) => a.id !== selectedElementId);
      selectedElementId = augmentations[0]?.id || 'model-1';
      vuforiaProjectService.saveProjectAugmentations(augmentations);
      rebuild3DPinAnchors();
      renderUI();
    });

    // Input Bindings for Selected Augmentation
    const selectedAug = getSelectedAugmentation();
    if (selectedAug) {
      container.querySelector('#vf-input-label')?.addEventListener('input', (e) => {
        selectedAug.label = (e.target as HTMLInputElement).value;
        vuforiaProjectService.saveProjectAugmentations(augmentations);
        const nameItem = container.querySelector(`.vf-tree-item[data-id="${selectedAug.id}"] span:last-child`);
        if (nameItem) nameItem.textContent = selectedAug.name;
      });

      container.querySelector('#vf-input-scale')?.addEventListener('change', (e) => {
        selectedAug.scale = Number((e.target as HTMLInputElement).value) || 1.0;
        vuforiaProjectService.saveProjectAugmentations(augmentations);
      });

      const posX = container.querySelector('#vf-input-pos-x') as HTMLInputElement;
      const posY = container.querySelector('#vf-input-pos-y') as HTMLInputElement;
      const posZ = container.querySelector('#vf-input-pos-z') as HTMLInputElement;

      const updatePos = () => {
        selectedAug.position = [
          Number(posX.value) || 0,
          Number(posY.value) || 0,
          Number(posZ.value) || 0,
        ];
        vuforiaProjectService.saveProjectAugmentations(augmentations);
        rebuild3DPinAnchors();
      };

      posX?.addEventListener('input', updatePos);
      posY?.addEventListener('input', updatePos);
      posZ?.addEventListener('input', updatePos);

      const rotX = container.querySelector('#vf-input-rot-x') as HTMLInputElement;
      const rotY = container.querySelector('#vf-input-rot-y') as HTMLInputElement;
      const rotZ = container.querySelector('#vf-input-rot-z') as HTMLInputElement;

      const updateRot = () => {
        selectedAug.rotation = [
          Number(rotX.value) || 0,
          Number(rotY.value) || 0,
          Number(rotZ.value) || 0,
        ];
        vuforiaProjectService.saveProjectAugmentations(augmentations);
      };

      rotX?.addEventListener('input', updateRot);
      rotY?.addEventListener('input', updateRot);
      rotZ?.addEventListener('input', updateRot);

      container.querySelector('#vf-select-binding')?.addEventListener('change', (e) => {
        selectedAug.bindingField = (e.target as HTMLSelectElement).value as any;
        vuforiaProjectService.saveProjectAugmentations(augmentations);
        renderUI();
      });
    }

    // CAD Resource Model Selector
    container.querySelector('#vf-select-resource')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value;
      if (val === 'none') {
        currentProject.associatedModelId = 'none';
      } else {
        activeModelIndex = Number(val);
        activeModel = models[activeModelIndex] || SEED_HYDRAULIC_MODEL;
        currentProject.associatedModelId = activeModel.id;
        if (currentProject.template === 'blank') {
          currentProject.template = 'model_target';
        }
      }
      vuforiaProjectService.saveActiveProject(currentProject);
      rebuild3DSceneGeometry();
      renderUI();
    });

    // Auto-refresh Checkbox
    container.querySelector('#vf-check-autorefresh')?.addEventListener('change', (e) => {
      isAutoRefreshActive = (e.target as HTMLInputElement).checked;
    });

    // Top action buttons
    container.querySelector('#vf-btn-preview-ar')?.addEventListener('click', () => {
      onNavigate('xr-player', undefined, 'ar');
    });

    container.querySelector('#vf-btn-help-guide')?.addEventListener('click', () => {
      openVuforiaHelpModal({
        onLaunchAR: () => {
          onNavigate('xr-player', undefined, 'ar');
        },
      });
    });

    container.querySelector('#vf-btn-launch-xr')?.addEventListener('click', () => {
      onNavigate('xr-player', undefined, 'vr');
    });

    container.querySelector('#vf-btn-deploy-quest')?.addEventListener('click', () => {
      onNavigate('xr-player', undefined, 'ar');
    });

    container.querySelector('#vf-btn-export-pkg')?.addEventListener('click', () => {
      plantEnvironmentService.downloadTargetDatabaseJSON();
      alert('Target Database Package exported successfully as "factoryverse-target-database.json"!');
    });
  };

  // Start Real IoT Streaming Loop (1 Second Interval)
  let tick = 0;
  telemetryIntervalId = setInterval(() => {
    if (!isAutoRefreshActive) return;
    tick += 1;

    // Realistic industrial sensor fluctuation
    telemetry.pressureBar = Number((210.0 + Math.sin(tick * 0.4) * 2.8 + Math.random() * 0.5).toFixed(1));
    telemetry.temperatureC = Number((62.0 + Math.sin(tick * 0.15) * 1.2 + Math.random() * 0.3).toFixed(1));
    telemetry.vibrationRms = Number((0.080 + Math.sin(tick * 0.7) * 0.007 + Math.random() * 0.002).toFixed(3));
    telemetry.flowRateLmin = Number((14.8 + Math.sin(tick * 0.25) * 0.4).toFixed(1));

    // Update live readouts if DOM element present
    const elPress = container.querySelector('#live-val-pressure');
    if (elPress) elPress.textContent = `${telemetry.pressureBar.toFixed(1)} Bar`;

    const elTemp = container.querySelector('#live-val-temp');
    if (elTemp) elTemp.textContent = `${telemetry.temperatureC.toFixed(1)} °C`;

    const elVib = container.querySelector('#live-val-vib');
    if (elVib) elVib.textContent = `${telemetry.vibrationRms.toFixed(3)} mm/s`;

    const elFlow = container.querySelector('#live-val-flow');
    if (elFlow) elFlow.textContent = `${telemetry.flowRateLmin.toFixed(1)} L/min`;
  }, 1000);

  // Initial Render
  renderUI();
}
