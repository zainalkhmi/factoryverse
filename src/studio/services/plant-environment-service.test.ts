import { describe, expect, it } from 'vitest';
import { PlantEnvironmentService, PLANT_AREA_PRESETS } from './plant-environment-service';

describe('PlantEnvironmentService (Vuforia ATG & Target Manager Parity)', () => {
  const service = new PlantEnvironmentService();

  it('should list all predefined industrial plant area presets', () => {
    const presets = service.getPlantPresets();
    expect(presets.length).toBe(4);
    expect(presets.map((p) => p.id)).toEqual(['assembly_bay', 'cnc_floor', 'cleanroom', 'ar_passthrough']);
  });

  it('should switch and cycle plant area presets correctly', () => {
    service.setPlantPreset('cnc_floor');
    expect(service.getActivePreset().id).toBe('cnc_floor');
    expect(service.getActivePreset().lightingTone).toContain('Warm');

    // Cycle next
    const next = service.cycleNextPreset();
    expect(next.id).toBe('cleanroom');
    expect(service.getActivePreset().lightingTone).toContain('Sterile Daylight');
  });

  it('should toggle AR Passthrough mode correctly', () => {
    service.setARPassthrough(true);
    expect(service.isARPassthroughActive()).toBe(true);
    expect(service.getActivePreset().code).toBe('PLANT-AR-MR');

    service.setARPassthrough(false);
    expect(service.isARPassthroughActive()).toBe(false);
    expect(service.getActivePreset().id).toBe('assembly_bay');
  });

  it('should generate a comprehensive target database package with models and equipment', () => {
    const pkg = service.generateTargetDatabasePackage();
    expect(pkg.schemaVersion).toBe('1.0.0');
    expect(pkg.databaseName).toBe('FactoryVerse-Industrial-Target-DB');
    expect(pkg.models.length).toBeGreaterThanOrEqual(1);
    expect(pkg.equipmentRegistry.length).toBeGreaterThanOrEqual(4);
    expect(pkg.qualityGates.nominalValue).toBe(24.0);
    expect(pkg.qualityGates.passRange).toEqual([23.9, 24.1]);
  });
});
