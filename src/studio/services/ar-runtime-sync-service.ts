/**
 * FactoryVerse Expert XR - AR Runtime Synchronization Service
 * Dynamically binds the active Vuforia Studio Project (Model Target, Multi-Target Box,
 * Cylinder Target, VuMark, Image Target, Area Target) and its 3D augmentations directly
 * into the IWSDK WebXR World & AR Passthrough Player.
 */

import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  Vector3,
} from '@iwsdk/core';
import type { VuforiaProject } from './vuforia-project-service';
import type { VuforiaAugmentation } from '../views/VuforiaStudioView';
import { vuforiaProjectService } from './vuforia-project-service';
import {
  createCylinderBarrel,
  createPistonRod,
  createEndCap,
} from '../../scene-assets/cylinder-workstation.scene-asset';

export interface DynamicBillboardTracker {
  augmentation: VuforiaAugmentation;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: CanvasTexture;
  sprite: Sprite;
}

export class ARRuntimeSyncService {
  private activeSyncGroup: Group | null = null;
  private dynamicBillboards: DynamicBillboardTracker[] = [];
  private defaultNodeDefinitions = [
    {
      id: 'training-panel',
      name: 'Spatial Training Panel',
      isPanel: true,
      aliases: ['training-panel', 'training instruction', 'training panel', 'spatial training'],
    },
    {
      id: 'inspection-panel',
      name: 'Spatial Inspection Panel',
      isPanel: true,
      aliases: ['inspection-panel', 'quality inspection', 'inspection panel', 'spatial inspection'],
    },
    {
      id: 'score-panel',
      name: 'Training Score Report',
      isPanel: true,
      aliases: ['score-panel', 'score report', 'score panel'],
    },
    {
      id: 'cylinder-barrel',
      name: 'Cylinder Barrel Bore',
      isDefaultPart: true,
      aliases: ['cylinder-barrel', 'cylinder barrel', 'barrel bore'],
    },
    {
      id: 'piston-rod',
      name: 'Piston Rod & Head Assembly',
      isDefaultPart: true,
      aliases: ['piston-rod', 'piston rod'],
    },
    {
      id: 'end-cap',
      name: 'Threaded Gland End Cap',
      isDefaultPart: true,
      aliases: ['end-cap', 'end cap', 'gland end cap'],
    },
    {
      id: 'spatial-beacon',
      name: 'Spatial Wayfinding Beacon',
      isDefaultPart: true,
      aliases: ['spatial-beacon', 'spatial beacon', 'waypoint beacon'],
    },
    {
      id: 'cad-guide-view',
      name: 'CAD Model Target Guide View',
      isDefaultPart: true,
      aliases: ['cad-guide-view', 'guide view'],
    },
    {
      id: 'primitive-sphere-1',
      name: 'primitive-sphere-1',
      isDefaultPart: true,
      aliases: ['primitive-sphere-1', 'primitive-sphere'],
    },
  ];

  /**
   * Synchronizes the currently active Vuforia Project and its 3D augmentations
   * into the IWSDK Three.js world scene.
   */
  public syncActiveProjectToScene(
    worldOrScene: any,
    isARPassthrough: boolean,
    projectOverride?: VuforiaProject
  ): Group | null {
    const scene = worldOrScene?.scene || worldOrScene;
    if (!scene || typeof scene.add !== 'function') {
      console.warn('[ARSync] Invalid Three.js scene supplied to syncActiveProjectToScene');
      return null;
    }

    const project = projectOverride || vuforiaProjectService.getActiveProject();
    if (!project) return null;

    // 1. Remove previous runtime group if present
    const existing = scene.getObjectByName('VuforiaARRuntimeGroup');
    if (existing) {
      scene.remove(existing);
      existing.traverse((c: any) => {
        if (c.geometry) c.geometry.dispose?.();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach((m: any) => m.dispose?.());
          else c.material.dispose?.();
        }
      });
    }
    this.dynamicBillboards = [];

    // 2. Determine whether this is the hardcoded default cylinder assembly or a custom/target template
    const isDefaultAssembly =
      project.id === 'vfp-hyd-cyl-qa-01' && project.template === 'assembly_qa';

    // 3. Robustly toggle default nodes & floating panels:
    // - In AR Passthrough mode, floating UIKitML panels are ALWAYS hidden so only pure 3D canvas data shows.
    // - Custom Vuforia target templates hide default assembly parts (barrel, rod, cap) so they don't collide.
    this.defaultNodeDefinitions.forEach((def) => {
      const targetVisible = def.isPanel
        ? (!isARPassthrough && isDefaultAssembly)
        : isDefaultAssembly;

      // Direct name / ID lookup on scene (supports mocks & named nodes)
      const nodeById = scene.getObjectByName?.(def.id);
      if (nodeById) nodeById.visible = targetVisible;

      const nodeByName = scene.getObjectByName?.(def.name);
      if (nodeByName) nodeByName.visible = targetVisible;

      // Check via IWSDK World if available
      if (typeof worldOrScene?.getSceneObject === 'function') {
        try {
          const obj = worldOrScene.getSceneObject(def.id);
          if (obj) {
            obj.visible = targetVisible;
            if (!targetVisible && typeof obj.traverse === 'function') {
              obj.traverse((c: any) => { c.visible = false; });
            }
          }
        } catch {}
      }
    });

    // Deep traverse Three.js scene hierarchy matching iwsdkSceneNodeId and name aliases
    if (typeof scene.traverse === 'function') {
      scene.traverse((child: any) => {
        const nodeId = child.userData?.iwsdkSceneNodeId;
        const nameLower = (child.name || '').toLowerCase();

        for (const def of this.defaultNodeDefinitions) {
          const targetVisible = def.isPanel
            ? (!isARPassthrough && isDefaultAssembly)
            : isDefaultAssembly;

          const matchesId = nodeId === def.id;
          const matchesName =
            nameLower === def.name.toLowerCase() ||
            def.aliases.some((a) => nameLower.includes(a.toLowerCase()));

          if (matchesId || matchesName) {
            child.visible = targetVisible;
            if (!targetVisible && typeof child.traverse === 'function') {
              child.traverse((c: any) => { c.visible = false; });
            }
          }
        }
      });
    }

    // 4. Configure Workstation Bench for AR Passthrough vs VR Plant
    // In AR Passthrough mode, hide the virtual bench so the user's physical table is unobstructed
    const bench =
      scene.getObjectByName?.('WorkstationBench') ||
      (typeof worldOrScene?.getSceneObject === 'function' ? worldOrScene.getSceneObject('fill-light') : null);

    if (bench) {
      if (isARPassthrough) {
        bench.visible = false;
      } else {
        bench.visible = true;
        bench.traverse((child: any) => {
          if (child.isMesh && child.material) {
            child.material.transparent = false;
            child.material.opacity = 1.0;
            child.material.wireframe = false;
          }
        });
      }
    }

    // If it's the default assembly and no extra augmentations, the native IWSDK scene handles it
    if (isDefaultAssembly && (!project.augmentations || project.augmentations.length <= 3)) {
      this.activeSyncGroup = null;
      return null;
    }

    // 4. Create VuforiaARRuntimeGroup anchored at physical workbench / eye level
    const runtimeGroup = new Group();
    runtimeGroup.name = 'VuforiaARRuntimeGroup';
    // Position right on top of workstation surface in front of player
    runtimeGroup.position.set(0, 1.05, -1.1);

    // 5. Build 3D CAD Model Target Geometry matching the project
    const modelContainer = new Group();
    modelContainer.name = 'ActiveTarget3DModel';
    this.buildTargetModelGeometry(project, modelContainer);
    runtimeGroup.add(modelContainer);

    // 6. Build 3D Augmentation Pins and Floating Spatial Billboards
    const augmentations = project.augmentations || [];
    augmentations.forEach((aug) => {
      const augGroup = this.createAugmentation3DElement(aug);
      runtimeGroup.add(augGroup);
    });

    scene.add(runtimeGroup);
    this.activeSyncGroup = runtimeGroup;

    return runtimeGroup;
  }

  /**
   * Builds the procedural 3D target geometry matching the active target template
   */
  private buildTargetModelGeometry(project: VuforiaProject, group: Group): void {
    const template = project.template;
    const targetType = project.targetType;
    const modelId = project.associatedModelId;

    if (template === 'cylinder_target' || targetType === 'cylinder_target') {
      // 1. CYLINDER TARGET: HONED STEEL BORE PRESSURE PIPE
      const pipeGeo = new CylinderGeometry(0.08, 0.08, 0.62, 32);
      const pipeMat = new MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
      const pipe = new Mesh(pipeGeo, pipeMat);
      pipe.rotation.z = Math.PI / 2;
      group.add(pipe);

      // Dual Flange Collars
      const flgGeo = new CylinderGeometry(0.14, 0.14, 0.04, 32);
      const flgMat = new MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 });
      const flg1 = new Mesh(flgGeo, flgMat);
      flg1.rotation.z = Math.PI / 2;
      flg1.position.set(-0.31, 0, 0);
      group.add(flg1);

      const flg2 = new Mesh(flgGeo, flgMat);
      flg2.rotation.z = Math.PI / 2;
      flg2.position.set(0.31, 0, 0);
      group.add(flg2);

      // NDT Circumferential Weld Bead
      const weldGeo = new TorusGeometry(0.092, 0.008, 16, 32);
      const weldMat = new MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.3 });
      const weld = new Mesh(weldGeo, weldMat);
      weld.rotation.y = Math.PI / 2;
      weld.position.set(0.05, 0, 0);
      group.add(weld);

    } else if (template === 'multi_target' || targetType === 'multi_target') {
      // 2. MULTI-TARGET (BOX): HEAVY-DUTY INDUSTRIAL SHIPPING CRATE
      const boxGeo = new BoxGeometry(0.48, 0.34, 0.30);
      const boxMat = new MeshStandardMaterial({ color: 0x1e293b, metalness: 0.45, roughness: 0.55 });
      const box = new Mesh(boxGeo, boxMat);
      group.add(box);

      // Steel Reinforced Corner Edge Brackets
      const edgeMat = new MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.25 });
      const topEdge1 = new Mesh(new BoxGeometry(0.50, 0.02, 0.02), edgeMat);
      topEdge1.position.set(0, 0.17, 0.15);
      group.add(topEdge1);

      const topEdge2 = new Mesh(new BoxGeometry(0.50, 0.02, 0.02), edgeMat);
      topEdge2.position.set(0, 0.17, -0.15);
      group.add(topEdge2);

      // Heavy-Duty Steel Strapping Bands
      const strapMat = new MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
      const strap1 = new Mesh(new BoxGeometry(0.03, 0.35, 0.31), strapMat);
      strap1.position.set(-0.12, 0, 0);
      group.add(strap1);

      const strap2 = new Mesh(new BoxGeometry(0.03, 0.35, 0.31), strapMat);
      strap2.position.set(0.12, 0, 0);
      group.add(strap2);

      // Pallet Runner Blocks (Base)
      const palletMat = new MeshStandardMaterial({ color: 0x0f172a, metalness: 0.3, roughness: 0.8 });
      const runner1 = new Mesh(new BoxGeometry(0.48, 0.03, 0.06), palletMat);
      runner1.position.set(0, -0.185, 0.11);
      group.add(runner1);

      const runner2 = new Mesh(new BoxGeometry(0.48, 0.03, 0.06), palletMat);
      runner2.position.set(0, -0.185, -0.11);
      group.add(runner2);

    } else if (template === 'area_target' || targetType === 'area_target') {
      // 3. AREA TARGET: ASSEMBLY BAY 3 FACILITY CELL
      const floorGeo = new BoxGeometry(1.2, 0.02, 0.8);
      const floorMat = new MeshStandardMaterial({ color: 0x0f172a, metalness: 0.3, roughness: 0.8 });
      const floor = new Mesh(floorGeo, floorMat);
      floor.position.set(0, -0.2, 0);
      group.add(floor);

      const benchGeo = new BoxGeometry(0.35, 0.16, 0.22);
      const benchMat = new MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.4 });
      const bench = new Mesh(benchGeo, benchMat);
      bench.position.set(-0.35, -0.11, 0);
      group.add(bench);

      const latheGeo = new BoxGeometry(0.38, 0.24, 0.26);
      const latheMat = new MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
      const lathe = new Mesh(latheGeo, latheMat);
      lathe.position.set(0.32, -0.07, 0);
      group.add(lathe);

      const craneGeo = new BoxGeometry(1.1, 0.04, 0.06);
      const craneMat = new MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 });
      const crane = new Mesh(craneGeo, craneMat);
      crane.position.set(0, 0.32, 0);
      group.add(crane);

    } else if (template === 'vumark' || targetType === 'vumark' || modelId === 'model-robotic-flange-04') {
      // 4. VUMARK OPTICAL: 6-AXIS TOOLING FLANGE
      const flangeGeo = new CylinderGeometry(0.16, 0.16, 0.04, 32);
      const flangeMat = new MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 });
      const flange = new Mesh(flangeGeo, flangeMat);
      flange.rotation.x = Math.PI / 2;
      group.add(flange);

      const vumarkDiscGeo = new CylinderGeometry(0.12, 0.12, 0.005, 32);
      const vumarkDiscMat = new MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.2 });
      const vumarkDisc = new Mesh(vumarkDiscGeo, vumarkDiscMat);
      vumarkDisc.rotation.x = Math.PI / 2;
      vumarkDisc.position.set(0, 0, 0.024);
      group.add(vumarkDisc);

      const spindleGeo = new CylinderGeometry(0.04, 0.04, 0.18, 24);
      const spindleMat = new MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
      const spindle = new Mesh(spindleGeo, spindleMat);
      spindle.rotation.x = Math.PI / 2;
      spindle.position.set(0, 0, 0.1);
      group.add(spindle);

    } else if (template === 'image_target' || targetType === 'image_target' || modelId === 'model-valve-manifold-02') {
      // 5. SINGLE IMAGE TARGET: ELECTRICAL PANEL ENCLOSURE
      const panelGeo = new BoxGeometry(0.44, 0.32, 0.08);
      const panelMat = new MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.5 });
      const panel = new Mesh(panelGeo, panelMat);
      group.add(panel);

      const termGeo = new BoxGeometry(0.36, 0.04, 0.03);
      const termMat = new MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
      const term1 = new Mesh(termGeo, termMat);
      term1.position.set(0, 0.08, 0.05);
      group.add(term1);

      const term2 = new Mesh(termGeo, termMat);
      term2.position.set(0, -0.06, 0.05);
      group.add(term2);

    } else if (modelId === 'model-centrifugal-pump-03') {
      // 6. CENTRIFUGAL SLURRY PUMP
      const casingGeo = new TorusGeometry(0.16, 0.08, 20, 36);
      const casingMat = new MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.4 });
      const casingMesh = new Mesh(casingGeo, casingMat);
      casingMesh.rotation.x = Math.PI / 2;
      group.add(casingMesh);

      const suctionGeo = new CylinderGeometry(0.065, 0.065, 0.22, 24);
      const nozzleMat = new MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.3 });
      const suctionMesh = new Mesh(suctionGeo, nozzleMat);
      suctionMesh.position.set(0, 0, 0.1);
      suctionMesh.rotation.x = Math.PI / 2;
      group.add(suctionMesh);

    } else {
      // 0. MODEL TARGET: MODULAR HYDRAULIC CYLINDER
      const barrel = createCylinderBarrel();
      barrel.position.set(-0.15, 0, 0);
      group.add(barrel);

      const rod = createPistonRod();
      rod.position.set(0.15, 0, 0);
      group.add(rod);

      const cap = createEndCap();
      cap.position.set(0.18, 0, 0);
      group.add(cap);
    }
  }

  /**
   * Creates an interactive 3D spatial pin and floating billboard card
   */
  private createAugmentation3DElement(aug: VuforiaAugmentation): Group {
    const group = new Group();
    group.name = `ARAug_${aug.id}`;
    group.position.set(aug.position[0], aug.position[1], aug.position[2]);

    // 1. Datum Stalk & Sphere Pin
    const stalkGeo = new CylinderGeometry(0.003, 0.003, 0.07, 8);
    const stalkMat = new MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
    const stalk = new Mesh(stalkGeo, stalkMat);
    stalk.position.set(0, -0.035, 0);
    group.add(stalk);

    const sphereGeo = new SphereGeometry(0.016, 16, 16);
    const sphereMat = new MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      metalness: 0.9,
      roughness: 0.2,
    });
    const sphere = new Mesh(sphereGeo, sphereMat);
    group.add(sphere);

    // 2. High-Contrast Spatial Billboard (HTML5 CanvasTexture Sprite)
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        this.drawCardToCanvas(ctx, aug, '---');
        const texture = new CanvasTexture(canvas);
        const spriteMat = new SpriteMaterial({
          map: texture,
          transparent: true,
          depthTest: false,
        });
        const sprite = new Sprite(spriteMat);
        // Position floating neatly above the sphere beacon
        sprite.position.set(0, 0.11, 0);
        const scale = aug.scale || 1.0;
        sprite.scale.set(0.32 * scale, 0.11 * scale, 1.0);
        group.add(sprite);

        this.dynamicBillboards.push({
          augmentation: aug,
          canvas,
          ctx,
          texture,
          sprite,
        });
      }
    }

    return group;
  }

  /**
   * Draws a PTC Vuforia View-style industrial dark card on canvas
   */
  private drawCardToCanvas(
    ctx: CanvasRenderingContext2D,
    aug: VuforiaAugmentation,
    liveValue: string
  ): void {
    const w = 512;
    const h = 180;

    ctx.clearRect(0, 0, w, h);

    // Card background
    ctx.fillStyle = 'rgba(8, 14, 24, 0.94)';
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, 16);
    ctx.fill();

    // Card Border
    let borderColor = '#1e3a5f';
    let badgeText = '3D ANNOTATION';
    let badgeColor = '#94a3b8';

    if (aug.type === '3dgauge') {
      borderColor = '#38bdf8';
      badgeText = 'LIVE IOT GAUGE';
      badgeColor = '#38bdf8';
    } else if (aug.id.includes('SOP') || aug.label.toLowerCase().includes('sop') || aug.label.toLowerCase().includes('card')) {
      borderColor = '#0284c7';
      badgeText = 'SOP INSTRUCTION CARD';
      badgeColor = '#38bdf8';
    } else if (aug.id.includes('Tolerance') || aug.label.toLowerCase().includes('datum') || aug.label.toLowerCase().includes('shock')) {
      borderColor = '#f59e0b';
      badgeText = 'QC TOLERANCE DATUM';
      badgeColor = '#f59e0b';
    } else if (aug.type === 'thingmark') {
      borderColor = '#22c55e';
      badgeText = 'OPTICAL THINGMARK';
      badgeColor = '#4ade80';
    } else if (aug.type === 'spatial_pin') {
      borderColor = '#e11d48';
      badgeText = 'SPATIAL WAYPOINT';
      badgeColor = '#f43f5e';
    }

    ctx.lineWidth = 4;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    // Top Category Badge
    ctx.font = 'bold 18px "Inter", sans-serif';
    ctx.fillStyle = badgeColor;
    ctx.fillText(badgeText, 24, 40);

    // Main Title / Label
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    const label = aug.label || aug.name;
    const truncatedLabel = label.length > 34 ? label.slice(0, 32) + '...' : label;
    ctx.fillText(truncatedLabel, 24, 82);

    // Bottom Status / Live Telemetry Reading
    if (aug.type === '3dgauge' || aug.bindingField !== 'none') {
      ctx.font = 'bold 36px "JetBrains Mono", monospace';
      ctx.fillStyle = aug.bindingField === 'temperature' ? '#f59e0b' : '#38bdf8';
      ctx.fillText(liveValue, 24, 138);

      ctx.font = '16px "Inter", sans-serif';
      ctx.fillStyle = '#4ade80';
      ctx.fillText('● Live ThingWorx Telemetry', 300, 138);
    } else {
      ctx.font = '18px "Inter", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('✓ 6DOF Surface Anchored · Occlusion ON', 24, 134);
    }
  }

  /**
   * Updates dynamic telemetry values on all 3D gauge billboards
   */
  public updateTelemetry(telemetry: {
    pressureBar: number;
    temperatureC: number;
    vibrationRms: number;
    flowRateLmin: number;
  }): void {
    this.dynamicBillboards.forEach((item) => {
      const aug = item.augmentation;
      if (aug.type === '3dgauge' || aug.bindingField !== 'none') {
        let valStr = `${telemetry.pressureBar.toFixed(1)} Bar`;
        if (aug.bindingField === 'temperature') {
          valStr = `${telemetry.temperatureC.toFixed(1)} °C`;
        } else if (aug.bindingField === 'vibration') {
          valStr = `${telemetry.vibrationRms.toFixed(3)} mm/s`;
        } else if (aug.bindingField === 'flowRate') {
          valStr = `${telemetry.flowRateLmin.toFixed(1)} L/min`;
        } else if (aug.label.toLowerCase().includes('weight')) {
          valStr = `${telemetry.pressureBar.toFixed(1)} Bar · 482.5 kg`;
        }

        this.drawCardToCanvas(item.ctx, aug, valStr);
        item.texture.needsUpdate = true;
      }
    });
  }

  /**
   * Cleans up custom runtime objects when returning to studio
   */
  public cleanup(worldOrScene: any): void {
    const scene = worldOrScene?.scene || worldOrScene;
    if (!scene) return;

    const runtimeGroup = scene.getObjectByName('VuforiaARRuntimeGroup');
    if (runtimeGroup) {
      scene.remove(runtimeGroup);
    }

    // Restore visibility of default nodes
    this.defaultNodeDefinitions.forEach((def) => {
      const nodeById = scene.getObjectByName?.(def.id);
      if (nodeById) nodeById.visible = true;

      const nodeByName = scene.getObjectByName?.(def.name);
      if (nodeByName) nodeByName.visible = true;

      if (typeof worldOrScene?.getSceneObject === 'function') {
        try {
          const obj = worldOrScene.getSceneObject(def.id);
          if (obj) {
            obj.visible = true;
            if (typeof obj.traverse === 'function') {
              obj.traverse((c: any) => { c.visible = true; });
            }
          }
        } catch {}
      }
    });

    if (typeof scene.traverse === 'function') {
      scene.traverse((child: any) => {
        const nodeId = child.userData?.iwsdkSceneNodeId;
        const nameLower = (child.name || '').toLowerCase();

        for (const def of this.defaultNodeDefinitions) {
          const matchesId = nodeId === def.id;
          const matchesName =
            nameLower === def.name.toLowerCase() ||
            def.aliases.some((a) => nameLower.includes(a.toLowerCase()));

          if (matchesId || matchesName) {
            child.visible = true;
            if (typeof child.traverse === 'function') {
              child.traverse((c: any) => { c.visible = true; });
            }
          }
        }
      });
    }

    // Restore WorkstationBench
    const bench =
      scene.getObjectByName?.('WorkstationBench') ||
      (typeof worldOrScene?.getSceneObject === 'function' ? worldOrScene.getSceneObject('fill-light') : null);
    if (bench) {
      bench.visible = true;
      bench.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material.transparent = false;
          child.material.opacity = 1.0;
          child.material.wireframe = false;
        }
      });
    }

    this.dynamicBillboards = [];
    this.activeSyncGroup = null;
  }

  /**
   * Generates human-friendly Operator HUD metadata for the active project
   */
  public getHUDInfoForProject(project: VuforiaProject): {
    title: string;
    stepTitle: string;
    stepDesc: string;
    checkpoint: string;
    badge: string;
  } {
    const targetTypeLabels: Record<string, string> = {
      model_target: '📐 MODEL TARGET',
      image_target: '🖼️ SINGLE IMAGE TARGET',
      cylinder_target: '🥫 CYLINDER TARGET',
      multi_target: '📦 MULTI-TARGET (BOX)',
      vumark: '🎯 VUMARK OPTICAL',
      area_target: '🌐 AREA TARGET (SPATIAL)',
    };

    const typeKey = project.targetType || 'model_target';
    const typeLabel = targetTypeLabels[typeKey] || 'AR TARGET';
    const augCount = project.augmentations?.length || 0;

    let stepTitle = 'Step 1 — Target Recognition & CAD Alignment';
    let stepDesc = 'Point camera at physical asset. Edge contrast and 3D guide views will lock alignment.';
    let checkpoint = `CHECKPOINT: ${augCount} Augmentations Tracked · 6DOF Spatial Anchor: LOCKED`;

    if (project.template === 'multi_target' || project.targetType === 'multi_target') {
      stepTitle = 'Step 1 — Verify BOM & Tare Weight';
      stepDesc = 'Inspect 3D bounding envelope, verify TiltWatch drop datum (< 1.0G), and cross-check pallet tare weight.';
      checkpoint = 'CHECKPOINT: 12/12 Parts Verified · Shock Sensor: PASS (< 1.0G)';
    } else if (project.template === 'cylinder_target' || project.targetType === 'cylinder_target') {
      stepTitle = 'Step 1 — NDT Ultrasonic Wall Thickness & Welds';
      stepDesc = 'Scan curved surface. Inspect circumferential weld bead and ultrasonic gauge (8.00 mm min).';
      checkpoint = 'CHECKPOINT: Wall Thickness: 8.42 mm (PASS) · Weld Integrity: API 5L OK';
    } else if (project.template === 'image_target' || project.targetType === 'image_target') {
      stepTitle = 'Step 1 — Electrical Cabinet LOTO & Terminal Wiring';
      stepDesc = 'Follow LOTO lockout tagout warnings. Inspect terminal block wire pinouts against digital twin.';
      checkpoint = 'CHECKPOINT: LOTO Tag Verified · Voltage: 415V AC Isolated';
    } else if (project.template === 'vumark' || project.targetType === 'vumark') {
      stepTitle = 'Step 1 — Serialized Asset Overhaul & Vibration FFT';
      stepDesc = 'Optical VuMark locked (#CYL-8821-X). Check spindle vibration RMS and lubrication schedule.';
      checkpoint = 'CHECKPOINT: Spindle RMS: 1.42 mm/s (GOOD) · Next Overhaul: 214 Hrs';
    } else if (project.template === 'area_target' || project.targetType === 'area_target') {
      stepTitle = 'Step 1 — Assembly Bay 3 Spatial Wayfinding';
      stepDesc = 'Follow directional waypoint beacon to Station 4. Keep clear of overhead crane safety zone.';
      checkpoint = 'CHECKPOINT: Bay 3 Navigation Active · Crane Safety Clearance: 2.4m (CLEAR)';
    }

    return {
      title: `[${typeLabel}] ${project.name}`,
      stepTitle,
      stepDesc,
      checkpoint,
      badge: `👓 AR Passthrough Active · Target: ${project.name} · Tracking: ★★★★★ (99.4%)`,
    };
  }
}

export const arRuntimeSyncService = new ARRuntimeSyncService();
