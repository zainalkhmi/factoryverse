import { describe, it, expect, beforeEach } from 'vitest';
import {
  VuforiaProjectService,
  DEFAULT_VUFORIA_PROJECT,
  VUFORIA_PROJECT_TEMPLATES,
} from './vuforia-project-service';

describe('VuforiaProjectService', () => {
  let service: VuforiaProjectService;

  beforeEach(() => {
    service = new VuforiaProjectService();
    service.resetToDefault();
  });

  it('retrieves default active project initially', () => {
    const project = service.getActiveProject();
    expect(project).toBeDefined();
    expect(project.id).toBe(DEFAULT_VUFORIA_PROJECT.id);
    expect(project.name).toBe('Hydraulic Cylinder Assembly & QA AR');
    expect(project.template).toBe('assembly_qa');
  });

  it('updates project name successfully', () => {
    const updated = service.updateProjectName('Robotics Arm Inspection AR v2');
    expect(updated.name).toBe('Robotics Arm Inspection AR v2');
    expect(service.getActiveProject().name).toBe('Robotics Arm Inspection AR v2');
  });

  it('ignores empty project name update', () => {
    const original = service.getActiveProject().name;
    const res = service.updateProjectName('   ');
    expect(res.name).toBe(original);
  });

  it('creates new project from assembly_qa template with proper default augmentations', () => {
    const { project, augmentations } = service.createNewProject({
      name: 'Custom QC Project',
      template: 'assembly_qa',
    });

    expect(project.id).toMatch(/^vfp-/);
    expect(project.name).toBe('Custom QC Project');
    expect(project.template).toBe('assembly_qa');
    expect(augmentations.length).toBe(3);
    expect(augmentations.some((a) => a.type === '3dlabel')).toBe(true);
    expect(service.getActiveProject().id).toBe(project.id);
  });

  it('creates blank project with zero default augmentations', () => {
    const { project, augmentations } = service.createNewProject({
      name: 'Clean Slate Project',
      template: 'blank',
    });

    expect(project.name).toBe('Clean Slate Project');
    expect(project.template).toBe('blank');
    expect(project.associatedModelId).toBe('none');
    expect(augmentations.length).toBe(0);
  });

  it('provides all 4 official project templates', () => {
    expect(VUFORIA_PROJECT_TEMPLATES.length).toBe(4);
    const ids = VUFORIA_PROJECT_TEMPLATES.map((t) => t.id);
    expect(ids).toContain('assembly_qa');
    expect(ids).toContain('maintenance_iot');
    expect(ids).toContain('sop_instruction');
    expect(ids).toContain('blank');
  });

  it('saves and persists project augmentations', () => {
    const { project } = service.createNewProject({
      name: 'Persist Test',
      template: 'blank',
    });
    expect(service.getActiveProject().augmentations?.length).toBe(0);

    service.saveProjectAugmentations([
      {
        id: 'test-pin-1',
        type: 'spatial_pin',
        name: 'Test Pin',
        label: 'Test Label',
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        scale: 1,
        bindingField: 'none',
      },
    ]);

    expect(service.getActiveProject().augmentations?.length).toBe(1);
    expect(service.getActiveProject().augmentations?.[0].id).toBe('test-pin-1');
  });

  it('switches between projects and restores their augmentations', () => {
    const projA = service.createNewProject({
      name: 'Project Alpha',
      template: 'assembly_qa',
    });
    const projB = service.createNewProject({
      name: 'Project Beta Blank',
      template: 'blank',
    });

    expect(service.getActiveProject().id).toBe(projB.project.id);
    expect(service.getActiveProject().augmentations?.length).toBe(0);

    const switched = service.switchActiveProject(projA.project.id);
    expect(switched).toBeDefined();
    expect(switched?.name).toBe('Project Alpha');
    expect(switched?.augmentations?.length).toBe(3);
    expect(service.getActiveProject().id).toBe(projA.project.id);
  });

  it('updates project metadata and keeps id immutable', () => {
    const { project } = service.createNewProject({
      name: 'Initial Name',
      template: 'assembly_qa',
    });

    const updated = service.updateProject(project.id, {
      name: 'Updated Industrial Name',
      description: 'Updated procedure inspection details',
      associatedModelId: 'model-valve-manifold-02',
    });

    expect(updated.id).toBe(project.id);
    expect(updated.name).toBe('Updated Industrial Name');
    expect(updated.description).toBe('Updated procedure inspection details');
    expect(updated.associatedModelId).toBe('model-valve-manifold-02');
    expect(service.getActiveProject().name).toBe('Updated Industrial Name');
  });

  it('throws when updating non-existent project id', () => {
    expect(() => {
      service.updateProject('invalid-proj-id-999', { name: 'Fail' });
    }).toThrow(/not found/);
  });

  it('imports valid project json and switches to it', () => {
    const rawProject = {
      name: 'Imported Turbine Inspection',
      description: 'Turbine fan blade inspection workflow',
      template: 'blank',
      associatedModelId: 'model-centrifugal-pump-03',
      augmentations: [
        {
          id: 'imported-pin-1',
          type: 'spatial_pin',
          name: 'Blade Datum',
          label: 'Blade 1 Leading Edge',
          position: [0.1, 0.2, 0.0],
          rotation: [0, 0, 0],
          scale: 1,
          bindingField: 'none',
        },
      ],
    };

    const imported = service.importProject(rawProject);
    expect(imported).toBeDefined();
    expect(imported.id).toMatch(/^vfp-/);
    expect(imported.name).toBe('Imported Turbine Inspection');
    expect(imported.augmentations?.length).toBe(1);
    expect(service.getActiveProject().id).toBe(imported.id);
  });

  it('imports wrapped project package format', () => {
    const wrappedPkg = {
      schemaVersion: '1.0.0',
      exportType: 'factoryverse_vuforia_project',
      project: {
        id: 'vfp-wrapped-101',
        name: 'Wrapped Package Project',
        template: 'sop_instruction',
        associatedModelId: 'model-hydraulic-cyl-01',
      },
    };

    const imported = service.importProject(wrappedPkg);
    expect(imported.name).toBe('Wrapped Package Project');
    expect(imported.template).toBe('sop_instruction');
    expect(service.getActiveProject().id).toBe(imported.id);
  });

  it('rejects invalid import payloads lacking name', () => {
    expect(() => {
      service.importProject({ invalid: 123 });
    }).toThrow(/missing required "name"/);

    expect(() => {
      service.importProject(null);
    }).toThrow(/expected a JSON object/);
  });

  it('exports active project to formatted JSON package', () => {
    const exportResult = service.exportProjectJSON();
    expect(exportResult.filename).toMatch(/\.json$/);
    const parsed = JSON.parse(exportResult.json);
    expect(parsed.schemaVersion).toBe('1.0.0');
    expect(parsed.exportType).toBe('factoryverse_vuforia_project');
    expect(parsed.project.name).toBe(service.getActiveProject().name);
  });

  it('deletes project and falls back gracefully', () => {
    const { project } = service.createNewProject({
      name: 'To Be Deleted',
      template: 'blank',
    });
    expect(service.getActiveProject().id).toBe(project.id);

    const remaining = service.deleteProject(project.id);
    expect(remaining).toBeDefined();
    expect(service.getAllProjects().some((p) => p.id === project.id)).toBe(false);
  });
});

