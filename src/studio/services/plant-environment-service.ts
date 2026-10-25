/**
 * FactoryVerse Expert XR - Plant Facility Environment & Target Database Exporter
 * Vuforia Toolchain Parity:
 * 1. Area Target Generator (ATG): Plant facility area presets & lighting environments
 * 2. Vuforia Target Manager: Target database package exporter (JSON dataset)
 */

import { storageRepository } from '../../storage/storage-repository';
import { SEED_EQUIPMENT_REGISTRY } from './barcode-scanner-service';

export interface PlantAreaPreset {
  id: string;
  name: string;
  code: string;
  description: string;
  facilityType: string;
  lightingTone: string;
  domeSky: [number, number, number, number];
  domeEquator: [number, number, number, number];
  domeGround: [number, number, number, number];
  exposure: number;
}

export interface TargetDatabasePackage {
  schemaVersion: string;
  databaseName: string;
  exportedAt: string;
  platform: string;
  targetCount: number;
  models: Array<{
    id: string;
    name: string;
    format: string;
    trackingRatingStars: number;
    trackingConfidence: number;
    geometryFeatures: {
      vertices: number;
      triangles: number;
      distinctEdges: boolean;
      rotationalSymmetry: string;
    };
    components: Array<{
      id: string;
      name: string;
      partCode: string;
      material: string;
      isInspectable: boolean;
      defaultPosition: [number, number, number];
    }>;
  }>;
  equipmentRegistry: Array<{
    code: string;
    name: string;
    serialNumber: string;
    location: string;
    calibrationStatus: string;
    qrPayload: string;
    associatedProcedureId: string;
  }>;
  qualityGates: {
    nominalValue: number;
    tolerance: number;
    unit: string;
    passRange: [number, number];
  };
}

export const PLANT_AREA_PRESETS: PlantAreaPreset[] = [
  {
    id: 'assembly_bay',
    name: 'Heavy Assembly Bay 3 (Shop Floor)',
    code: 'PLANT-BAY-03',
    description: 'Standard high-bay manufacturing hall with high-intensity overhead industrial illumination.',
    facilityType: 'Mechanical Assembly Cell',
    lightingTone: '4500K Industrial Neutral',
    domeSky: [0.07, 0.11, 0.18, 1],
    domeEquator: [0.09, 0.15, 0.22, 1],
    domeGround: [0.04, 0.07, 0.11, 1],
    exposure: 1.15,
  },
  {
    id: 'cnc_floor',
    name: 'Automated CNC Machining Floor',
    code: 'PLANT-CNC-08',
    description: 'High-contrast industrial floor with warm machinery indicators and deep shadows.',
    facilityType: 'Heavy Machining Cell',
    lightingTone: '3200K Warm Industrial Accent',
    domeSky: [0.12, 0.08, 0.04, 1],
    domeEquator: [0.15, 0.10, 0.06, 1],
    domeGround: [0.05, 0.04, 0.03, 1],
    exposure: 1.25,
  },
  {
    id: 'cleanroom',
    name: 'ISO Class 7 Precision Metrology Cleanroom',
    code: 'PLANT-LAB-01',
    description: 'Ultra-bright 5500K sterile daylight illumination with glare reduction for precision metrology.',
    facilityType: 'Quality Assurance Lab',
    lightingTone: '5500K Sterile Daylight',
    domeSky: [0.18, 0.22, 0.28, 1],
    domeEquator: [0.22, 0.26, 0.32, 1],
    domeGround: [0.12, 0.14, 0.18, 1],
    exposure: 1.40,
  },
  {
    id: 'ar_passthrough',
    name: 'AR Passthrough (Mixed Reality)',
    code: 'PLANT-AR-MR',
    description: 'Real-world optical passthrough for Meta Quest 3 & WebXR AR with hand depth occlusion and physical table anchoring.',
    facilityType: 'Spatial Mixed Reality',
    lightingTone: 'Adaptive Room Ambient',
    domeSky: [0, 0, 0, 0],
    domeEquator: [0, 0, 0, 0],
    domeGround: [0, 0, 0, 0],
    exposure: 1.0,
  },
];

export class PlantEnvironmentService {
  private activePresetId = 'assembly_bay';
  private listeners: Array<(preset: PlantAreaPreset) => void> = [];

  public getPlantPresets(): PlantAreaPreset[] {
    return PLANT_AREA_PRESETS;
  }

  public getActivePreset(): PlantAreaPreset {
    return PLANT_AREA_PRESETS.find((p) => p.id === this.activePresetId) || PLANT_AREA_PRESETS[0];
  }

  public isARPassthroughActive(): boolean {
    return this.activePresetId === 'ar_passthrough';
  }

  public setARPassthrough(enabled: boolean): PlantAreaPreset {
    return this.setPlantPreset(enabled ? 'ar_passthrough' : 'assembly_bay');
  }

  public setPlantPreset(presetId: string): PlantAreaPreset {
    const found = PLANT_AREA_PRESETS.find((p) => p.id === presetId);
    if (found) {
      this.activePresetId = found.id;
      this.notifyListeners(found);
    }
    return this.getActivePreset();
  }

  public cycleNextPreset(): PlantAreaPreset {
    const currentIndex = PLANT_AREA_PRESETS.findIndex((p) => p.id === this.activePresetId);
    const nextIndex = (currentIndex + 1) % PLANT_AREA_PRESETS.length;
    return this.setPlantPreset(PLANT_AREA_PRESETS[nextIndex].id);
  }

  public addListener(fn: (preset: PlantAreaPreset) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notifyListeners(preset: PlantAreaPreset): void {
    this.listeners.forEach((fn) => {
      try {
        fn(preset);
      } catch (e) {
        console.error('Error in plant environment listener:', e);
      }
    });
  }

  /**
   * Bundles all CAD Model Targets, Equipment VuMarks, and Tolerances into a single exportable package.
   * Vuforia Target Manager Parity: "Download Target Database"
   */
  public generateTargetDatabasePackage(): TargetDatabasePackage {
    const models = storageRepository.getModels();
    
    return {
      schemaVersion: '1.0.0',
      databaseName: 'FactoryVerse-Industrial-Target-DB',
      exportedAt: new Date().toISOString(),
      platform: 'Meta-IWSDK-WebXR',
      targetCount: models.length + SEED_EQUIPMENT_REGISTRY.length,
      models: models.map((m) => ({
        id: m.id,
        name: m.name,
        format: m.format,
        trackingRatingStars: 5,
        trackingConfidence: 0.984,
        geometryFeatures: {
          vertices: 1420,
          triangles: 2840,
          distinctEdges: true,
          rotationalSymmetry: 'Z-Axis (Guide View Active)',
        },
        components: m.components.map((c) => ({
          id: c.id,
          name: c.name,
          partCode: c.partCode,
          material: c.material,
          isInspectable: c.isInspectable,
          defaultPosition: c.defaultPosition,
        })),
      })),
      equipmentRegistry: SEED_EQUIPMENT_REGISTRY.map((eq) => ({
        code: eq.code,
        name: eq.name,
        serialNumber: eq.serialNumber,
        location: eq.location,
        calibrationStatus: eq.status,
        qrPayload: eq.qrPayload,
        associatedProcedureId: eq.associatedProcedureId,
      })),
      qualityGates: {
        nominalValue: 24.0,
        tolerance: 0.1,
        unit: 'mm',
        passRange: [23.9, 24.1],
      },
    };
  }

  /**
   * Triggers a browser file download of the JSON Target Database Package
   */
  public downloadTargetDatabaseJSON(): void {
    const pkg = this.generateTargetDatabasePackage();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pkg, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'factoryverse-target-database.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}

export const plantEnvironmentService = new PlantEnvironmentService();
