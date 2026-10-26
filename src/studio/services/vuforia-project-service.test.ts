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
});
