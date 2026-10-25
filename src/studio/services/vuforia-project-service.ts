/**
 * FactoryVerse Studio - Vuforia Project Management Service
 * Manages Vuforia Studio AR authoring projects, templates, and project metadata.
 * Reference: PTC Vuforia Studio Project Lifecycle
 */

import type { VuforiaAugmentation } from '../views/VuforiaStudioView';

export type VuforiaProjectTemplate =
  | 'assembly_qa'
  | 'maintenance_iot'
  | 'sop_instruction'
  | 'blank';

export interface VuforiaProject {
  id: string;
  name: string;
  description: string;
  template: VuforiaProjectTemplate;
  associatedModelId: string;
  targetId?: string;
  dateCreated: string;
  dateModified: string;
}

export interface ProjectTemplateInfo {
  id: VuforiaProjectTemplate;
  title: string;
  description: string;
  icon: string;
  defaultModelId: string;
}

export const VUFORIA_PROJECT_TEMPLATES: ProjectTemplateInfo[] = [
  {
    id: 'assembly_qa',
    title: 'Assembly & Quality Inspection',
    description: 'CAD dimensional datums, geometric tolerance pins, and seal groove callouts.',
    icon: '🛠️',
    defaultModelId: 'proc-hyd-cyl-01',
  },
  {
    id: 'maintenance_iot',
    title: 'Live IoT & Remote Telemetry',
    description: 'Dynamic ThingWorx sensor gauges for hydraulic pressure, fluid temp, and vibration.',
    icon: '⏱️',
    defaultModelId: 'proc-hyd-cyl-01',
  },
  {
    id: 'sop_instruction',
    title: 'Digital SOP & Step Procedures',
    description: 'Sequenced operator work instructions with 3D exploded view callouts and checkpoints.',
    icon: '📝',
    defaultModelId: 'proc-hyd-cyl-01',
  },
  {
    id: 'blank',
    title: 'Blank Spatial Canvas',
    description: 'Clean slate without default annotations, ready for custom AR authoring.',
    icon: '📄',
    defaultModelId: 'proc-hyd-cyl-01',
  },
];

const STORAGE_KEY_ACTIVE_PROJECT = 'factoryverse_vuforia_active_project_v1';
const STORAGE_KEY_PROJECT_LIST = 'factoryverse_vuforia_projects_list_v1';

export const DEFAULT_VUFORIA_PROJECT: VuforiaProject = {
  id: 'vfp-hyd-cyl-01',
  name: 'Hydraulic Cylinder Assembly & QA AR',
  description: 'Heavy-duty hydraulic cylinder inspection procedure and optical CAD tracking project.',
  template: 'assembly_qa',
  associatedModelId: 'proc-hyd-cyl-01',
  targetId: 'vt-model-cyl-01',
  dateCreated: '2026-10-25',
  dateModified: '2026-10-25',
};

export class VuforiaProjectService {
  private activeProjectCache: VuforiaProject | null = null;
  private projectsListCache: VuforiaProject[] | null = null;

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  public getActiveProject(): VuforiaProject {
    if (this.activeProjectCache) {
      return this.activeProjectCache;
    }

    if (this.isBrowser()) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_PROJECT);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.activeProjectCache = parsed;
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse active Vuforia project from storage:', err);
      }
    }

    this.activeProjectCache = { ...DEFAULT_VUFORIA_PROJECT };
    return this.activeProjectCache;
  }

  public saveActiveProject(project: VuforiaProject): void {
    project.dateModified = new Date().toISOString().split('T')[0];
    this.activeProjectCache = { ...project };

    if (this.isBrowser()) {
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT, JSON.stringify(project));
      } catch (err) {
        console.warn('Failed to save active Vuforia project to storage:', err);
      }
    }

    // Also update in list
    const projects = this.getAllProjects();
    const idx = projects.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = { ...project };
    } else {
      projects.unshift({ ...project });
    }
    this.saveProjectsList(projects);
  }

  public updateProjectName(newName: string): VuforiaProject {
    const trimmed = newName.trim();
    if (!trimmed) {
      return this.getActiveProject();
    }
    const current = this.getActiveProject();
    current.name = trimmed;
    this.saveActiveProject(current);
    return current;
  }

  public createNewProject(params: {
    name: string;
    template: VuforiaProjectTemplate;
    modelId?: string;
    description?: string;
  }): { project: VuforiaProject; augmentations: VuforiaAugmentation[] } {
    const newId = `vfp-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString().split('T')[0];

    const project: VuforiaProject = {
      id: newId,
      name: params.name.trim() || `New Vuforia AR Project (${now})`,
      description: params.description || `Created from ${params.template} template`,
      template: params.template,
      associatedModelId: params.modelId || 'proc-hyd-cyl-01',
      dateCreated: now,
      dateModified: now,
    };

    const augmentations = this.generateTemplateAugmentations(params.template);
    this.saveActiveProject(project);

    return { project, augmentations };
  }

  public generateTemplateAugmentations(template: VuforiaProjectTemplate): VuforiaAugmentation[] {
    if (template === 'assembly_qa') {
      return [
        {
          id: '3dlabel-1',
          type: '3dlabel',
          name: '3DLabel-1 (Bore Datum)',
          label: 'Bore Datum A: 24.00 ± 0.10 mm',
          position: [-0.25, 0.22, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: '3dlabel-2',
          type: '3dlabel',
          name: '3DLabel-2 (Seal Groove)',
          label: 'U-Cup Seal Retention Groove',
          position: [0.08, 0.22, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: '3dlabel-3',
          type: '3dlabel',
          name: '3DLabel-3 (Gland Flange)',
          label: 'Gland Flange: 45 Nm Torque',
          position: [0.32, -0.18, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
      ];
    }

    if (template === 'maintenance_iot') {
      return [
        {
          id: '3dgauge-1',
          type: '3dgauge',
          name: '3DGauge-1 (Pressure)',
          label: 'Hydraulic Line Pressure',
          position: [-0.15, 0.38, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'pressure',
        },
        {
          id: '3dgauge-2',
          type: '3dgauge',
          name: '3DGauge-2 (Temp)',
          label: 'Fluid Operating Temperature',
          position: [0.26, 0.36, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'temperature',
        },
        {
          id: 'thingmark-1',
          type: 'thingmark',
          name: 'thingMark-1 (Cell #4)',
          label: 'ThingMark: EQUIP-CYL-8821',
          position: [-0.38, -0.18, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
      ];
    }

    if (template === 'sop_instruction') {
      return [
        {
          id: '3dlabel-1',
          type: '3dlabel',
          name: 'SOP-Step-1 (Inspect O-Ring)',
          label: 'Step 1: Inspect O-ring seat for contamination',
          position: [-0.15, 0.25, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: '3dlabel-2',
          type: '3dlabel',
          name: 'SOP-Step-2 (Torque Gland)',
          label: 'Step 2: Torque gland bolts in cross pattern to 45 Nm',
          position: [0.22, -0.15, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: 'spatial-pin-1',
          type: 'spatial_pin',
          name: 'Waypoint-Safety-Lockout',
          label: 'LOTO Checkpoint Pin',
          position: [-0.35, -0.1, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
      ];
    }

    // Blank template
    return [];
  }

  public getAllProjects(): VuforiaProject[] {
    if (this.projectsListCache) {
      return this.projectsListCache;
    }

    if (this.isBrowser()) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PROJECT_LIST);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.projectsListCache = parsed;
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse Vuforia projects list from storage:', err);
      }
    }

    this.projectsListCache = [{ ...DEFAULT_VUFORIA_PROJECT }];
    return this.projectsListCache;
  }

  private saveProjectsList(projects: VuforiaProject[]): void {
    this.projectsListCache = [...projects];
    if (this.isBrowser()) {
      try {
        localStorage.setItem(STORAGE_KEY_PROJECT_LIST, JSON.stringify(projects));
      } catch (err) {
        console.warn('Failed to save Vuforia projects list to storage:', err);
      }
    }
  }

  public resetToDefault(): void {
    this.activeProjectCache = { ...DEFAULT_VUFORIA_PROJECT };
    this.projectsListCache = [{ ...DEFAULT_VUFORIA_PROJECT }];
    if (this.isBrowser()) {
      try {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_PROJECT);
        localStorage.removeItem(STORAGE_KEY_PROJECT_LIST);
      } catch (err) {
        console.warn('Failed to reset Vuforia project storage:', err);
      }
    }
  }
}

export const vuforiaProjectService = new VuforiaProjectService();
