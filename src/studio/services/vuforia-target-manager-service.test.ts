import { describe, it, expect, beforeEach } from 'vitest';
import { vuforiaTargetManagerService, SEED_VUFORIA_TARGETS } from './vuforia-target-manager-service';

describe('VuforiaTargetManagerService', () => {
  beforeEach(() => {
    vuforiaTargetManagerService.resetToSeeds();
  });

  it('retrieves default seed targets from database', () => {
    const targets = vuforiaTargetManagerService.getTargets();
    expect(targets.length).toBeGreaterThanOrEqual(SEED_VUFORIA_TARGETS.length);
    expect(targets.some((t) => t.type === 'model_target')).toBe(true);
    expect(targets.some((t) => t.type === 'image_target')).toBe(true);
    expect(targets.some((t) => t.type === 'cylinder_target')).toBe(true);
    expect(targets.some((t) => t.type === 'vumark')).toBe(true);
  });

  it('retrieves database info with total stars and count', () => {
    const info = vuforiaTargetManagerService.getDatabaseInfo();
    expect(info.databaseName).toBe('FactoryVerse_Industrial_Device_DB');
    expect(info.databaseType).toBe('Device');
    expect(info.targetCount).toBeGreaterThanOrEqual(6);
    expect(info.totalStars).toBeGreaterThan(0);
  });

  it('adds a new target and evaluates rating', () => {
    const added = vuforiaTargetManagerService.addTarget({
      name: 'Turbine-Impeller-Scan',
      type: 'model_target',
      dimensions: { widthMeters: 0.45, heightMeters: 0.20 },
      guideViewPreset: 'Front',
      isCurrentActive: true,
    });

    expect(added.id).toBeDefined();
    expect(added.name).toBe('Turbine-Impeller-Scan');
    expect(added.isCurrentActive).toBe(true);
    expect(added.status).toBe('Active');
    expect(added.ratingStars).toBe(5);

    const active = vuforiaTargetManagerService.getActiveTarget();
    expect(active.id).toBe(added.id);
  });

  it('sets another target as active', () => {
    const target = vuforiaTargetManagerService.setActiveTarget('vt-image-spec-tag');
    expect(target).not.toBeNull();
    expect(target?.id).toBe('vt-image-spec-tag');
    expect(target?.isCurrentActive).toBe(true);
    expect(target?.status).toBe('Active');

    const prevModel = vuforiaTargetManagerService.getTargetById('vt-model-cyl-01');
    expect(prevModel?.isCurrentActive).toBe(false);
  });

  it('deletes target correctly', () => {
    const initialCount = vuforiaTargetManagerService.getTargets().length;
    const deleted = vuforiaTargetManagerService.deleteTarget('vt-cylinder-pipe-01');
    expect(deleted).toBe(true);
    expect(vuforiaTargetManagerService.getTargets().length).toBe(initialCount - 1);
  });

  it('generates valid PTC Vuforia XML dataset', () => {
    const xml = vuforiaTargetManagerService.generateVuforiaXMLDataset();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<QCARConfig');
    expect(xml).toContain('<ModelTarget');
    expect(xml).toContain('<ImageTarget');
    expect(xml).toContain('<VuMarkTarget');
  });
});
