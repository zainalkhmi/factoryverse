import { describe, expect, it } from 'vitest';
import { BarcodeScannerService } from './barcode-scanner-service';

describe('BarcodeScannerService (Vuforia Engine Parity)', () => {
  const service = new BarcodeScannerService();

  it('should list all registered industrial equipment assets', () => {
    const list = service.getAllEquipment();
    expect(list.length).toBeGreaterThanOrEqual(4);
    const cell = list.find((e) => e.code === 'EQUIP-CYL-8821');
    expect(cell).toBeDefined();
    expect(cell?.associatedProcedureId).toBe('proc-hyd-cyl-01');
  });

  it('should lookup equipment by exact barcode string', () => {
    const res = service.lookupCode('EQUIP-CYL-8821');
    expect(res.equipment).toBeDefined();
    expect(res.equipment?.name).toContain('Hydraulic Cylinder');
    expect(res.procedureId).toBe('proc-hyd-cyl-01');
  });

  it('should lookup equipment case-insensitively with whitespace trimmed', () => {
    const res = service.lookupCode('   part-rod-01   ');
    expect(res.equipment).toBeDefined();
    expect(res.equipment?.code).toBe('PART-ROD-01');
    expect(res.procedureId).toBe('proc-hyd-cyl-01');
  });

  it('should match VuMark QR payload strings', () => {
    const res = service.lookupCode('FACTORYVERSE:EQUIP:EQUIP-CYL-8821:proc-hyd-cyl-01');
    expect(res.equipment).toBeDefined();
    expect(res.equipment?.code).toBe('EQUIP-CYL-8821');
  });

  it('should handle unrecognized barcode gracefully', () => {
    const res = service.lookupCode('UNKNOWN-TAG-999');
    expect(res.equipment).toBeUndefined();
    expect(res.procedureId).toBeUndefined();
    expect(res.code).toBe('UNKNOWN-TAG-999');
  });
});
