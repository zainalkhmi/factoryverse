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

  it('should handle openScannerModal gracefully in both node and browser environments', () => {
    let called = false;
    service.openScannerModal(() => { called = true; }, undefined, 'model_target');
    expect(called).toBe(false);

    // Mock minimal DOM to verify modal rendering and selection
    const mockElements: Record<string, any> = {};
    (globalThis as any).document = {
      getElementById: (id: string) => mockElements[id] || null,
      createElement: () => {
        const el: any = {
          id: '',
          style: {},
          innerHTML: '',
          querySelector: (sel: string) => {
            if (sel === '#scanner-btn-action-ar') {
              return { addEventListener: (_ev: string, cb: any) => { el._onArClick = cb; } };
            }
            return { addEventListener: () => {} };
          },
          querySelectorAll: () => [],
          remove: () => {},
        };
        return el;
      },
      body: {
        appendChild: (child: any) => {
          mockElements[child.id] = child;
        },
      },
    };

    let selectedProc = '';
    let selectedMode: 'vr' | 'ar' | undefined = undefined;
    service.openScannerModal((procId, mode) => {
      selectedProc = procId;
      selectedMode = mode;
    }, undefined, 'model_target');

    const modal = mockElements['barcode-scanner-modal'];
    expect(modal).toBeDefined();
    expect(modal.innerHTML).toContain('Vuforia Engine AR Target');
    expect(modal.innerHTML).toContain('Model Target (CAD Contour)');
    expect(modal.innerHTML).toContain('WebXR AR Passthrough');

    modal._onArClick?.();
    expect(selectedProc).toBe('proc-hyd-cyl-01');
    expect(selectedMode).toBe('ar');

    delete (globalThis as any).document;
  });
});
