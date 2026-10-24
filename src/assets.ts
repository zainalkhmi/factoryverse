/**
 * FactoryVerse Expert XR - Asset Manifest
 * Imported by both runtime and editor realms. Must be deterministic and self-contained.
 */

import { AssetType, defineAssets } from '@iwsdk/core';
import {
  createCylinderBarrel,
  createEndCap,
  createInspectionFeature,
  createModelTargetGuideView,
  createPistonRod,
  createSealRing,
  createSpatialBeacon,
  createWorkstationBench,
} from './scene-assets/cylinder-workstation.scene-asset.js';

const publicAssetUrl = (filePath: string): string =>
  `${import.meta.env.BASE_URL || './'}${filePath.replace(/^\/+/u, '')}`;

const uikitml = (fileName: string, name: string) => ({
  url: publicAssetUrl(`ui/${fileName}`),
  type: AssetType.UIKitML,
  name,
});

export default defineAssets({
  'workstation-bench': createWorkstationBench(),
  'cylinder-barrel': createCylinderBarrel(),
  'piston-rod': createPistonRod(),
  'end-cap': createEndCap(),
  'seal-ring': createSealRing(),
  'inspection-feature': createInspectionFeature(),
  'spatial-beacon': createSpatialBeacon(),
  'cad-guide-view': createModelTargetGuideView(),
  'training-panel': uikitml('training-panel.uikitml', 'Training Instruction Panel'),
  'inspection-panel': uikitml('inspection-panel.uikitml', 'Quality Inspection Panel'),
  'score-panel': uikitml('score-panel.uikitml', 'Training Score Report'),
});
