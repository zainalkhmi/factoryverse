/**
 * FactoryVerse Expert XR - Assembly System
 * IWSDK ECS System handling part grabs, proximity snapping, and assembly progression.
 */

import {
  createSystem,
  Grabbed,
  Vector3,
  type Entity,
} from '@iwsdk/core';
import { AssemblyPart } from '../components.js';
import { TrainingEngine } from '../training/training-engine.js';
import { arRuntimeSyncService } from '../studio/services/ar-runtime-sync-service.js';

export class AssemblySystem extends createSystem({
  parts: { required: [AssemblyPart] },
  grabbedParts: { required: [AssemblyPart, Grabbed] },
}) {
  private tempVec = new Vector3();
  private trainingEngine!: TrainingEngine;
  private animationTime = 0;
  private beaconObject: any = null;
  private guideViewObject: any = null;
  private isGuideViewVisible = true;

  // Snapping target positions on the fixture
  private readonly snapTargets: Record<string, [number, number, number]> = {
    piston_rod: [-0.35, 1.04, -1.1], // Seated inside barrel
    end_cap: [-0.08, 1.04, -1.1],    // Mated against barrel flange
  };

  // Step-based Waypoint Beacon Targets (Vuforia Spatial Wayfinding)
  private readonly beaconStepTargets: [number, number, number][] = [
    [0.35, 1.22, -1.0],   // Step 1: Parts Tray / Rod
    [-0.35, 1.28, -1.1],  // Step 2: Cylinder Barrel Bore
    [-0.08, 1.25, -1.1],  // Step 3: Gland Flange Spigot
    [-0.08, 1.18, -1.05], // Step 4: Datum Measurement Gauge
    [0.65, 1.80, -1.7],   // Step 5: Inspection Panel & Audit
  ];

  private isARPassthroughMode = false;
  private benchObject: any = null;

  public setTrainingEngine(engine: TrainingEngine): void {
    this.trainingEngine = engine;
  }

  public toggleCADGuideView(): boolean {
    this.isGuideViewVisible = !this.isGuideViewVisible;
    if (this.guideViewObject) {
      this.guideViewObject.visible = this.isGuideViewVisible;
    }
    return this.isGuideViewVisible;
  }

  public setARPassthroughMode(enabled: boolean): boolean {
    this.isARPassthroughMode = enabled;
    if (!this.benchObject && this.world) {
      this.benchObject = (this.world as any).scene?.getObjectByName('WorkstationBench');
    }
    if (this.benchObject) {
      if (enabled) {
        // In AR Passthrough mode, hide the virtual bench so the real physical desk is unobstructed
        this.benchObject.visible = false;
      } else {
        this.benchObject.visible = true;
        this.benchObject.traverse((child: any) => {
          if (child.isMesh && child.material) {
            child.material.transparent = false;
            child.material.opacity = 1.0;
            child.material.wireframe = false;
          }
        });
      }
    }
    return this.isARPassthroughMode;
  }

  public getARPassthroughMode(): boolean {
    return this.isARPassthroughMode;
  }

  init(): void {
    // Listen for grab release on parts
    this.queries.parts.subscribe('qualify', (_entity: Entity) => {
      // Initialize part positions or metadata
    });
  }

  update(): void {
    this.animationTime += 0.016;

    // Update real-time telemetry on floating 3D AR gauge billboards
    arRuntimeSyncService.updateTelemetry({
      pressureBar: 208.3 + Math.sin(this.animationTime * 1.5) * 2.5,
      temperatureC: 62.4 + Math.sin(this.animationTime * 0.8) * 1.2,
      vibrationRms: 0.082 + Math.sin(this.animationTime * 2.0) * 0.005,
      flowRateLmin: 14.8 + Math.sin(this.animationTime * 1.0) * 0.4,
    });

    if (!this.trainingEngine) return;

    // 1. Locate and animate Vuforia Spatial Waypoint Beacon
    if (!this.beaconObject && this.world) {
      this.beaconObject = (this.world as any).scene?.getObjectByName('SpatialWaypointBeacon');
    }

    if (this.beaconObject) {
      const stepIndex = this.trainingEngine.getState().currentStepIndex;
      const targetPos = this.beaconStepTargets[Math.min(stepIndex, this.beaconStepTargets.length - 1)];
      if (targetPos) {
        // Smooth interpolation towards target step position
        this.beaconObject.position.x += (targetPos[0] - this.beaconObject.position.x) * 0.08;
        this.beaconObject.position.z += (targetPos[2] - this.beaconObject.position.z) * 0.08;
        // Bobbing vertical sine motion
        const bob = Math.sin(this.animationTime * 3.5) * 0.025;
        this.beaconObject.position.y += (targetPos[1] + bob - this.beaconObject.position.y) * 0.1;
        // Slow continuous beacon spin
        this.beaconObject.rotation.y += 0.015;
      }
    }

    // 2. Animate and update Model Target Guide View (Vuforia Model Target Parity)
    if (!this.guideViewObject && this.world) {
      this.guideViewObject = (this.world as any).scene?.getObjectByName('ModelTargetGuideView');
    }

    if (this.guideViewObject) {
      this.guideViewObject.visible = this.isGuideViewVisible;
      if (this.isGuideViewVisible) {
        // Subtle optical breathing pulse
        const pulse = 0.5 + Math.sin(this.animationTime * 2.5) * 0.15;
        this.guideViewObject.traverse((child: any) => {
          if (child.material && 'opacity' in child.material) {
            child.material.opacity = pulse;
          }
        });
      }
    }

    // 3. Monitor ungrabbed parts to check if they were placed near their snap target
    for (const entity of this.queries.parts.entities) {
      if (entity.hasComponent(Grabbed)) continue; // Still holding

      const partId = entity.getValue(AssemblyPart, 'partId') as string;
      const isAssembled = entity.getValue(AssemblyPart, 'isAssembled') as boolean;
      if (isAssembled) continue;

      const obj = entity.object3D;
      if (!obj) continue;

      const target = this.snapTargets[partId];
      if (!target) continue;

      obj.getWorldPosition(this.tempVec);
      const targetVec = new Vector3(target[0], target[1], target[2]);
      const dist = this.tempVec.distanceTo(targetVec);

      // Snap threshold: 0.35m
      if (dist < 0.35) {
        // Snap to target position
        obj.position.set(target[0], target[1], target[2]);
        obj.rotation.set(0, 0, 0);
        entity.setValue(AssemblyPart, 'isAssembled', true);

        // Notify training engine of assembled component
        if (partId === 'piston_rod' || partId === 'end_cap') {
          this.trainingEngine.assembleComponent(partId);
        }
      }
    }
  }

  public resetParts(): void {
    for (const entity of this.queries.parts.entities) {
      const partId = entity.getValue(AssemblyPart, 'partId') as string;
      const obj = entity.object3D;
      if (!obj) continue;

      if (partId === 'piston_rod') {
        entity.setValue(AssemblyPart, 'isAssembled', false);
        obj.position.set(0.35, 0.95, -1.0);
        obj.rotation.set(0, Math.PI / 2, 0);
      } else if (partId === 'end_cap') {
        entity.setValue(AssemblyPart, 'isAssembled', false);
        obj.position.set(0.65, 0.95, -1.0);
        obj.rotation.set(0, 0, 0);
      }
    }
  }
}
