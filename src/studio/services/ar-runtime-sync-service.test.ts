import { describe, it, expect, beforeEach } from 'vitest';
import { ARRuntimeSyncService } from './ar-runtime-sync-service';
import type { VuforiaProject } from './vuforia-project-service';

describe('ARRuntimeSyncService', () => {
  let service: ARRuntimeSyncService;

  beforeEach(() => {
    service = new ARRuntimeSyncService();
  });

  it('generates accurate HUD information for Multi-Target Box projects', () => {
    const mockProject: VuforiaProject = {
      id: 'vfp-box-crate-01',
      name: '4. Parts Shipping Crate QA',
      description: 'Crate box tracking',
      template: 'multi_target',
      associatedModelId: 'model-centrifugal-pump-03',
      targetType: 'multi_target',
      dateCreated: '2026-10-26T00:00:00.000Z',
      dateModified: '2026-10-26T00:00:00.000Z',
      augmentations: [
        {
          id: 'aug-bom-1',
          type: '3dlabel',
          name: 'BOM Card',
          label: 'Top Face: BOM 12/12 Parts Verified',
          position: [0, 0.32, 0],
          rotation: [0, 0, 0],
          scale: 1,
          bindingField: 'none',
        },
      ],
    };

    const hud = service.getHUDInfoForProject(mockProject);
    expect(hud.title).toContain('MULTI-TARGET (BOX)');
    expect(hud.title).toContain('4. Parts Shipping Crate QA');
    expect(hud.stepTitle).toContain('Verify BOM & Tare Weight');
    expect(hud.checkpoint).toContain('12/12 Parts Verified');
    expect(hud.badge).toContain('4. Parts Shipping Crate QA');
  });

  it('generates accurate HUD information for Cylinder Target projects', () => {
    const mockProject: VuforiaProject = {
      id: 'vfp-cyl-pipe-01',
      name: '3. Honed Bore Pipe & Vessel NDT',
      description: 'Cylinder pipe tracking',
      template: 'cylinder_target',
      associatedModelId: 'model-hydraulic-cyl-01',
      targetType: 'cylinder_target',
      dateCreated: '2026-10-26T00:00:00.000Z',
      dateModified: '2026-10-26T00:00:00.000Z',
      augmentations: [],
    };

    const hud = service.getHUDInfoForProject(mockProject);
    expect(hud.title).toContain('CYLINDER TARGET');
    expect(hud.stepTitle).toContain('NDT Ultrasonic Wall Thickness & Welds');
    expect(hud.checkpoint).toContain('Wall Thickness: 8.42 mm (PASS)');
  });

  it('generates accurate HUD information for VuMark Optical projects', () => {
    const mockProject: VuforiaProject = {
      id: 'vfp-vumark-01',
      name: '5. Serialized Asset Overhaul',
      description: 'VuMark optical tracking',
      template: 'vumark',
      associatedModelId: 'model-robotic-flange-04',
      targetType: 'vumark',
      dateCreated: '2026-10-26T00:00:00.000Z',
      dateModified: '2026-10-26T00:00:00.000Z',
      augmentations: [],
    };

    const hud = service.getHUDInfoForProject(mockProject);
    expect(hud.title).toContain('VUMARK OPTICAL');
    expect(hud.stepTitle).toContain('Serialized Asset Overhaul & Vibration FFT');
    expect(hud.checkpoint).toContain('Spindle RMS');
  });

  it('synchronizes target model and augmentations to Three.js scene', () => {
    const children: any[] = [];
    const mockDefaultNodes: Record<string, { name: string; visible: boolean }> = {
      'cylinder-barrel': { name: 'cylinder-barrel', visible: true },
      'piston-rod': { name: 'piston-rod', visible: true },
      'end-cap': { name: 'end-cap', visible: true },
    };

    const mockScene = {
      children,
      add: (obj: any) => children.push(obj),
      remove: (obj: any) => {
        const idx = children.indexOf(obj);
        if (idx !== -1) children.splice(idx, 1);
      },
      getObjectByName: (name: string) => {
        if (mockDefaultNodes[name]) return mockDefaultNodes[name];
        return children.find((c) => c.name === name) || null;
      },
    };

    const mockProject: VuforiaProject = {
      id: 'vfp-box-crate-01',
      name: 'Shipping Crate QA',
      description: 'Crate box tracking',
      template: 'multi_target',
      associatedModelId: 'model-centrifugal-pump-03',
      targetType: 'multi_target',
      dateCreated: '2026-10-26T00:00:00.000Z',
      dateModified: '2026-10-26T00:00:00.000Z',
      augmentations: [
        {
          id: 'aug-1',
          type: '3dgauge',
          name: 'Tare Gauge',
          label: 'Pallet Gross Weight',
          position: [0, 0.32, 0],
          rotation: [0, 0, 0],
          scale: 1,
          bindingField: 'pressure',
        },
      ],
    };

    const runtimeGroup = service.syncActiveProjectToScene(mockScene, true, mockProject);
    expect(runtimeGroup).toBeDefined();
    expect(runtimeGroup?.name).toBe('VuforiaARRuntimeGroup');

    // Default cylinder nodes should be hidden for custom template
    expect(mockDefaultNodes['cylinder-barrel'].visible).toBe(false);
    expect(mockDefaultNodes['piston-rod'].visible).toBe(false);

    // Runtime group should contain model and augmentations
    expect(runtimeGroup?.children.some((c) => c.name === 'ActiveTarget3DModel')).toBe(true);
    expect(runtimeGroup?.children.some((c) => c.name === 'ARAug_aug-1')).toBe(true);

    // Cleanup restores default nodes
    service.cleanup(mockScene);
    expect(mockDefaultNodes['cylinder-barrel'].visible).toBe(true);
    expect(mockDefaultNodes['piston-rod'].visible).toBe(true);
    expect(children.some((c) => c.name === 'VuforiaARRuntimeGroup')).toBe(false);
  });

  it('hides all floating UIKitML panels in AR Passthrough mode so only 3D data displays on canvas', () => {
    const children: any[] = [];
    const mockNodes: Record<string, { name: string; visible: boolean }> = {
      'training-panel': { name: 'training-panel', visible: true },
      'inspection-panel': { name: 'inspection-panel', visible: true },
      'score-panel': { name: 'score-panel', visible: true },
      'cylinder-barrel': { name: 'cylinder-barrel', visible: true },
    };

    const mockScene = {
      children,
      add: (obj: any) => children.push(obj),
      remove: (obj: any) => {
        const idx = children.indexOf(obj);
        if (idx !== -1) children.splice(idx, 1);
      },
      getObjectByName: (name: string) => {
        if (mockNodes[name]) return mockNodes[name];
        return children.find((c) => c.name === name) || null;
      },
    };

    const defaultAssemblyProject: VuforiaProject = {
      id: 'vfp-hyd-cyl-qa-01',
      name: 'Hydraulic Cylinder QA',
      description: 'Assembly QA',
      template: 'assembly_qa',
      associatedModelId: 'model-hydraulic-cyl-01',
      targetType: 'model_target',
      dateCreated: '2026-10-26T00:00:00.000Z',
      dateModified: '2026-10-26T00:00:00.000Z',
      augmentations: [],
    };

    // When in AR Passthrough mode (isARPassthrough = true), panels must be hidden even in default assembly
    service.syncActiveProjectToScene(mockScene, true, defaultAssemblyProject);
    expect(mockNodes['training-panel'].visible).toBe(false);
    expect(mockNodes['inspection-panel'].visible).toBe(false);
    expect(mockNodes['score-panel'].visible).toBe(false);
    // 3D part itself remains visible for assembly on desk
    expect(mockNodes['cylinder-barrel'].visible).toBe(true);

    // In VR Plant mode (isARPassthrough = false), panels are visible
    service.syncActiveProjectToScene(mockScene, false, defaultAssemblyProject);
    expect(mockNodes['training-panel'].visible).toBe(true);
    expect(mockNodes['inspection-panel'].visible).toBe(true);
  });
});
