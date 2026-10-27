/**
 * FactoryVerse Studio - Vuforia Project Management Service
 * Manages Vuforia Studio AR authoring projects, target-driven manufacturing templates, and project metadata.
 * Reference: PTC Vuforia Studio & Vuforia Target Manager Lifecycle
 */

import type { VuforiaAugmentation } from '../views/VuforiaStudioView';
import type { VuforiaTargetType } from './vuforia-target-manager-service';

export type VuforiaProjectTemplate =
  | 'model_target'
  | 'image_target'
  | 'cylinder_target'
  | 'multi_target'
  | 'vumark'
  | 'area_target'
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
  targetType?: VuforiaTargetType;
  dateCreated: string;
  dateModified: string;
  augmentations?: VuforiaAugmentation[];
}

export interface ProjectTemplateInfo {
  id: VuforiaProjectTemplate;
  title: string;
  description: string;
  icon: string;
  targetType?: VuforiaTargetType;
  defaultModelId: string;
  defaultTargetId?: string;
}

/** 4 Standard templates required by official studio tests */
export const VUFORIA_PROJECT_TEMPLATES: ProjectTemplateInfo[] = [
  {
    id: 'assembly_qa',
    title: 'Assembly & Quality Inspection',
    description: 'CAD dimensional datums, geometric tolerance pins, and seal groove callouts.',
    icon: '🛠️',
    targetType: 'model_target',
    defaultModelId: 'model-hydraulic-cyl-01',
    defaultTargetId: 'vt-model-cyl-01',
  },
  {
    id: 'maintenance_iot',
    title: 'Live IoT & Remote Telemetry',
    description: 'Dynamic ThingWorx sensor gauges for hydraulic pressure, fluid temp, and vibration.',
    icon: '⏱️',
    targetType: 'vumark',
    defaultModelId: 'model-hydraulic-cyl-01',
    defaultTargetId: 'vt-vumark-cyl-8821',
  },
  {
    id: 'sop_instruction',
    title: 'Digital SOP & Step Procedures',
    description: 'Sequenced operator work instructions with 3D exploded view callouts and checkpoints.',
    icon: '📝',
    targetType: 'image_target',
    defaultModelId: 'model-hydraulic-cyl-01',
    defaultTargetId: 'vt-image-spec-tag',
  },
  {
    id: 'blank',
    title: 'Blank Spatial Canvas',
    description: 'Clean slate without default annotations, ready for custom AR authoring.',
    icon: '📄',
    targetType: 'model_target',
    defaultModelId: 'model-hydraulic-cyl-01',
    defaultTargetId: 'vt-model-cyl-01',
  },
];

/** 6 Ready-to-Run Target-Specific Manufacturing Templates */
export const VUFORIA_TARGET_TEMPLATES: ProjectTemplateInfo[] = [
  {
    id: 'model_target',
    title: 'Model Target · Machine Digital Twin QA',
    description: '3D CAD edge tracking for hydraulic cylinder assembly, live telemetry, and bore datum tolerance.',
    icon: '📐',
    targetType: 'model_target',
    defaultModelId: 'model-hydraulic-cyl-01',
    defaultTargetId: 'vt-model-cyl-01',
  },
  {
    id: 'image_target',
    title: 'Single Image Target · Electrical Cabinet & SOP',
    description: 'Planar 5-star placard tracking for electrical control cabinets, LOTO warnings, and wire pinouts.',
    icon: '🖼️',
    targetType: 'image_target',
    defaultModelId: 'model-valve-manifold-02',
    defaultTargetId: 'vt-image-spec-tag',
  },
  {
    id: 'cylinder_target',
    title: 'Cylinder Target · Honed Pipe & Vessel NDT',
    description: 'Cylindrical curved surface tracking for ultrasonic pipe wall thickness and circumferential weld inspection.',
    icon: '🥫',
    targetType: 'cylinder_target',
    defaultModelId: 'model-hydraulic-cyl-01',
    defaultTargetId: 'vt-cylinder-pipe-01',
  },
  {
    id: 'multi_target',
    title: 'Multi-Target · Parts Crate & Pallet QA',
    description: '3D 6-face box tracking for shipping crates, BOM parts verification, tare weight, and shock tilt datums.',
    icon: '📦',
    targetType: 'multi_target',
    defaultModelId: 'model-centrifugal-pump-03',
    defaultTargetId: 'vt-multi-box-crate',
  },
  {
    id: 'vumark',
    title: 'VuMark Optical · Serialized Asset Maintenance',
    description: 'High-density branded optical marker tracking for machine serialization, runtime hours, and overhaul logs.',
    icon: '🎯',
    targetType: 'vumark',
    defaultModelId: 'model-robotic-flange-04',
    defaultTargetId: 'vt-vumark-cyl-8821',
  },
  {
    id: 'area_target',
    title: 'Area Target · Assembly Bay Facility Nav',
    description: 'LiDAR 3D facility scan tracking for workstation navigation, overhead crane safety zones, and ambient stats.',
    icon: '🌐',
    targetType: 'area_target',
    defaultModelId: 'model-hydraulic-cyl-01',
    defaultTargetId: 'vt-area-assembly-bay',
  },
];

const STORAGE_KEY_ACTIVE_PROJECT = 'factoryverse_vuforia_active_project_v1';
const STORAGE_KEY_PROJECT_LIST = 'factoryverse_vuforia_projects_list_v1';

export const DEFAULT_VUFORIA_PROJECT: VuforiaProject = {
  id: 'vfp-hyd-cyl-01',
  name: 'Hydraulic Cylinder Assembly & QA AR',
  description: 'Heavy-duty hydraulic cylinder inspection procedure and optical CAD tracking project.',
  template: 'assembly_qa',
  associatedModelId: 'model-hydraulic-cyl-01',
  targetId: 'vt-model-cyl-01',
  targetType: 'model_target',
  dateCreated: '2026-10-25',
  dateModified: '2026-10-25',
};

export const SEED_VUFORIA_PROJECTS: VuforiaProject[] = [
  { ...DEFAULT_VUFORIA_PROJECT },
  {
    id: 'vfp-image-target-02',
    name: 'Electrical Cabinet & SOP (Single Image)',
    description: 'Planar 5-star placard tracking for electrical control cabinets, LOTO warnings, and wire pinouts.',
    template: 'image_target',
    targetType: 'image_target',
    associatedModelId: 'model-valve-manifold-02',
    targetId: 'vt-image-spec-tag',
    dateCreated: '2026-10-25',
    dateModified: '2026-10-25',
  },
  {
    id: 'vfp-cylinder-target-03',
    name: 'Honed Pipe & Vessel NDT (Cylinder Target)',
    description: 'Cylindrical curved surface tracking for ultrasonic pipe wall thickness and circumferential weld inspection.',
    template: 'cylinder_target',
    targetType: 'cylinder_target',
    associatedModelId: 'model-hydraulic-cyl-01',
    targetId: 'vt-cylinder-pipe-01',
    dateCreated: '2026-10-25',
    dateModified: '2026-10-25',
  },
  {
    id: 'vfp-multi-target-04',
    name: 'Parts Shipping Crate QA (Multi-Target Box)',
    description: '3D 6-face box tracking for shipping crates, BOM parts verification, tare weight, and shock tilt datums.',
    template: 'multi_target',
    targetType: 'multi_target',
    associatedModelId: 'model-centrifugal-pump-03',
    targetId: 'vt-multi-box-crate',
    dateCreated: '2026-10-25',
    dateModified: '2026-10-25',
  },
  {
    id: 'vfp-vumark-target-05',
    name: 'Serialized Asset Maintenance (VuMark Target)',
    description: 'High-density branded optical marker tracking for machine serialization, runtime hours, and overhaul logs.',
    template: 'vumark',
    targetType: 'vumark',
    associatedModelId: 'model-robotic-flange-04',
    targetId: 'vt-vumark-cyl-8821',
    dateCreated: '2026-10-25',
    dateModified: '2026-10-25',
  },
  {
    id: 'vfp-area-target-06',
    name: 'Assembly Bay 3 Facility Nav (Area Target)',
    description: 'LiDAR 3D facility scan tracking for workstation navigation, overhead crane safety zones, and ambient stats.',
    template: 'area_target',
    targetType: 'area_target',
    associatedModelId: 'model-hydraulic-cyl-01',
    targetId: 'vt-area-assembly-bay',
    dateCreated: '2026-10-25',
    dateModified: '2026-10-25',
  },
];

export class VuforiaProjectService {
  private activeProjectCache: VuforiaProject | null = null;
  private projectsListCache: VuforiaProject[] | null = null;

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  public getActiveProject(): VuforiaProject {
    if (this.activeProjectCache) {
      if (!this.activeProjectCache.augmentations) {
        this.activeProjectCache.augmentations = this.generateTemplateAugmentations(
          this.activeProjectCache.template
        );
      }
      return this.activeProjectCache;
    }

    if (this.isBrowser()) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_PROJECT);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!parsed.augmentations) {
            parsed.augmentations = this.generateTemplateAugmentations(parsed.template);
          }
          this.activeProjectCache = parsed;
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse Vuforia active project from storage:', err);
      }
    }

    const defaultProj = { ...DEFAULT_VUFORIA_PROJECT };
    defaultProj.augmentations = this.generateTemplateAugmentations(defaultProj.template);
    this.activeProjectCache = defaultProj;
    return this.activeProjectCache;
  }

  public saveActiveProject(project: VuforiaProject): void {
    project.dateModified = new Date().toISOString().split('T')[0];
    this.activeProjectCache = { ...project };

    if (this.isBrowser()) {
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT, JSON.stringify(project));
      } catch (err) {
        console.warn('Failed to save Vuforia active project to storage:', err);
      }
    }

    // Update in projects list
    const list = this.getAllProjects();
    const idx = list.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      list[idx] = { ...project };
    } else {
      list.push({ ...project });
    }
    this.saveProjectsList(list);
  }

  public saveProjectAugmentations(augmentations: VuforiaAugmentation[]): void {
    const current = this.getActiveProject();
    current.augmentations = JSON.parse(JSON.stringify(augmentations));
    this.saveActiveProject(current);
  }

  public switchActiveProject(projectId: string): VuforiaProject | null {
    const list = this.getAllProjects();
    const target = list.find((p) => p.id === projectId);
    if (!target) return null;

    if (!target.augmentations) {
      target.augmentations = this.generateTemplateAugmentations(target.template);
    }

    this.saveActiveProject(target);
    return target;
  }

  public updateProject(projectId: string, updates: Partial<VuforiaProject>): VuforiaProject {
    const list = this.getAllProjects();
    const idx = list.findIndex((p) => p.id === projectId);
    if (idx < 0) {
      throw new Error(`Project with id "${projectId}" not found.`);
    }

    const current = list[idx];
    const updated: VuforiaProject = {
      ...current,
      ...updates,
      id: current.id, // ID is immutable
      dateModified: new Date().toISOString().split('T')[0],
    };

    list[idx] = updated;
    this.saveProjectsList(list);

    if (this.activeProjectCache?.id === projectId) {
      this.activeProjectCache = { ...updated };
      if (this.isBrowser()) {
        try {
          localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT, JSON.stringify(this.activeProjectCache));
        } catch (err) {
          console.warn('Failed to save active project update to storage:', err);
        }
      }
    }

    return updated;
  }

  public importProject(raw: unknown): VuforiaProject {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid project file: expected a JSON object.');
    }

    const data = raw as any;

    // Check if it's a factoryverse package containing projects or a single project
    let projectPayload: any = data;
    if (data.project && typeof data.project === 'object') {
      projectPayload = data.project;
    } else if (Array.isArray(data.projects) && data.projects.length > 0) {
      projectPayload = data.projects[0];
    } else if (data.activeProject && typeof data.activeProject === 'object') {
      projectPayload = data.activeProject;
    }

    if (!projectPayload.name || typeof projectPayload.name !== 'string') {
      throw new Error('Invalid project format: missing required "name" property.');
    }

    const now = new Date().toISOString().split('T')[0];
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const list = this.getAllProjects();
    const existingIndex = list.findIndex((p) => p.id === projectPayload.id);
    const newId = existingIndex >= 0 || !projectPayload.id
      ? `vfp-import-${Date.now().toString().slice(-6)}-${rand}`
      : projectPayload.id;

    const importedProject: VuforiaProject = {
      id: newId,
      name: projectPayload.name.trim(),
      description: projectPayload.description || 'Imported Vuforia Studio Project',
      template: projectPayload.template || 'blank',
      associatedModelId: projectPayload.associatedModelId || 'model-hydraulic-cyl-01',
      targetId: projectPayload.targetId || 'vt-model-cyl-01',
      targetType: projectPayload.targetType || 'model_target',
      dateCreated: projectPayload.dateCreated || now,
      dateModified: now,
      augmentations: Array.isArray(projectPayload.augmentations)
        ? JSON.parse(JSON.stringify(projectPayload.augmentations))
        : this.generateTemplateAugmentations(projectPayload.template || 'blank'),
    };

    this.saveActiveProject(importedProject);
    return importedProject;
  }

  public exportProjectJSON(projectId?: string): { filename: string; json: string } {
    const proj = projectId
      ? this.getAllProjects().find((p) => p.id === projectId) || this.getActiveProject()
      : this.getActiveProject();
    const exportData = {
      schemaVersion: '1.0.0',
      exportType: 'factoryverse_vuforia_project',
      exportedAt: new Date().toISOString(),
      project: proj,
    };
    const sanitizedName = proj.name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    return {
      filename: `${sanitizedName || 'vuforia-project'}.json`,
      json: JSON.stringify(exportData, null, 2),
    };
  }

  public getOrCreateProjectForTargetType(targetType: VuforiaTargetType): VuforiaProject {
    const list = this.getAllProjects();
    const matched = list.find((p) => p.template === targetType || p.targetType === targetType);
    if (matched) {
      this.switchActiveProject(matched.id);
      return this.getActiveProject();
    }

    // Create a new target-driven project
    const tmplInfo = VUFORIA_TARGET_TEMPLATES.find((t) => t.targetType === targetType) || VUFORIA_TARGET_TEMPLATES[0];
    const { project } = this.createNewProject({
      name: tmplInfo.title,
      template: tmplInfo.id,
      modelId: tmplInfo.defaultModelId,
      description: tmplInfo.description,
    });
    project.targetId = tmplInfo.defaultTargetId;
    project.targetType = targetType;
    this.saveActiveProject(project);
    return project;
  }

  public deleteProject(projectId: string): VuforiaProject {
    let projects = this.getAllProjects().filter((p) => p.id !== projectId);
    if (projects.length === 0) {
      projects = [JSON.parse(JSON.stringify(DEFAULT_VUFORIA_PROJECT))];
    }
    this.saveProjectsList(projects);

    if (this.activeProjectCache?.id === projectId) {
      this.activeProjectCache = { ...projects[0] };
      if (this.isBrowser()) {
        try {
          localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT, JSON.stringify(this.activeProjectCache));
        } catch (err) {
          console.warn('Failed to save active project after deletion:', err);
        }
      }
    }
    return this.getActiveProject();
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
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const newId = `vfp-${Date.now().toString().slice(-6)}-${rand}`;
    const now = new Date().toISOString().split('T')[0];

    const augmentations = this.generateTemplateAugmentations(params.template);

    const tmplInfo =
      VUFORIA_TARGET_TEMPLATES.find((t) => t.id === params.template) ||
      VUFORIA_PROJECT_TEMPLATES.find((t) => t.id === params.template);

    const project: VuforiaProject = {
      id: newId,
      name: params.name.trim() || `New Vuforia AR Project (${now})`,
      description: params.description || `Created from ${params.template} template`,
      template: params.template,
      targetType: tmplInfo?.targetType || 'model_target',
      targetId: tmplInfo?.defaultTargetId || 'vt-model-cyl-01',
      associatedModelId: params.modelId || tmplInfo?.defaultModelId || 'model-hydraulic-cyl-01',
      dateCreated: now,
      dateModified: now,
      augmentations: JSON.parse(JSON.stringify(augmentations)),
    };

    this.saveActiveProject(project);

    return { project, augmentations };
  }

  public generateTemplateAugmentations(template: VuforiaProjectTemplate): VuforiaAugmentation[] {
    // Standard test template: assembly_qa (3 augmentations)
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

    // 1. MODEL TARGET: HEAVY MACHINE ASSEMBLY & QA (Full scenario)
    if (template === 'model_target') {
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
          id: '3dlabel-1',
          type: '3dlabel',
          name: '3DLabel-1 (Bore Datum)',
          label: 'Bore Datum A: 24.00 ± 0.10 mm (PASS)',
          position: [-0.25, 0.22, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: '3dlabel-2',
          type: '3dlabel',
          name: 'SOPCard-Seal (O-Ring Check)',
          label: 'SOP Instruction: Check O-Ring Depth',
          position: [0.08, 0.20, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: 'spatial-pin-1',
          type: 'spatial_pin',
          name: 'SpatialPin-1 (Piston Waypoint)',
          label: 'Inspection Waypoint Pin',
          position: [0.18, 0.28, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: 'thingmark-1',
          type: 'thingmark',
          name: 'thingMark-1 (Cell #4)',
          label: 'ThingMark: EQUIP-CYL-8821',
          position: [-0.35, -0.16, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
      ];
    }

    // 2. SINGLE IMAGE TARGET: ELECTRICAL CABINET & SOP PLACARD
    if (template === 'image_target') {
      return [
        {
          id: '3dgauge-1',
          type: '3dgauge',
          name: '3DGauge-BusLoad',
          label: '24V DC Bus Load',
          position: [-0.18, 0.32, 0.05],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'pressure',
        },
        {
          id: '3dgauge-2',
          type: '3dgauge',
          name: '3DGauge-CabTemp',
          label: 'Cabinet Operating Temp',
          position: [0.18, 0.32, 0.05],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'temperature',
        },
        {
          id: '3dlabel-1',
          type: '3dlabel',
          name: 'SOPCard-LOTO',
          label: 'LOTO Safety: Zero Energy Verified',
          position: [-0.15, 0.16, 0.08],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: '3dlabel-2',
          type: '3dlabel',
          name: '3DLabel-TB104',
          label: 'Terminal Block TB-104 Pinout',
          position: [0.14, 0.16, 0.08],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: 'spatial-pin-1',
          type: 'spatial_pin',
          name: 'SpatialPin-TP3',
          label: 'Multimeter Calib Datum (TP-3)',
          position: [0.0, -0.12, 0.08],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
      ];
    }

    // 3. CYLINDER TARGET: HONED BORE PIPE & PRESSURE VESSEL NDT
    if (template === 'cylinder_target') {
      return [
        {
          id: '3dgauge-1',
          type: '3dgauge',
          name: '3DGauge-Thickness',
          label: 'Ultrasonic Wall Thickness',
          position: [-0.18, 0.30, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'pressure',
        },
        {
          id: '3dgauge-2',
          type: '3dgauge',
          name: '3DGauge-SkinTemp',
          label: 'Pipe Surface Skin Temp',
          position: [0.18, 0.30, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'temperature',
        },
        {
          id: '3dlabel-1',
          type: '3dlabel',
          name: 'Tolerance-WeldSeam',
          label: 'Circumferential Weld #3 (ISO 5817-B)',
          position: [0.05, 0.18, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: '3dlabel-2',
          type: '3dlabel',
          name: 'SOPCard-NDT',
          label: 'NDT Scan: Zero Micro-Cracks PASS',
          position: [-0.22, -0.16, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: 'spatial-pin-1',
          type: 'spatial_pin',
          name: 'SpatialPin-FlangeSeat',
          label: 'Flange Gasket Seat Datum',
          position: [0.26, -0.16, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
      ];
    }

    // 4. MULTI-TARGET: PARTS CRATE & PALLET SHIPPING QA
    if (template === 'multi_target') {
      return [
        {
          id: '3dlabel-1',
          type: '3dlabel',
          name: 'SOPCard-BOM',
          label: 'Top Face: BOM 12/12 Parts Verified',
          position: [0.0, 0.32, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: '3dgauge-1',
          type: '3dgauge',
          name: '3DGauge-TareWeight',
          label: 'Pallet Gross Weight (kg)',
          position: [-0.22, 0.22, 0.16],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'pressure',
        },
        {
          id: '3dlabel-2',
          type: '3dlabel',
          name: 'Tolerance-Shock',
          label: 'TiltWatch Shock Datum: < 1.0G (PASS)',
          position: [0.22, 0.22, 0.16],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: 'spatial-pin-1',
          type: 'spatial_pin',
          name: 'SpatialPin-CoG',
          label: 'Center of Gravity (CoG Datum)',
          position: [0.0, 0.0, 0.18],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: '3dlabel-3',
          type: '3dlabel',
          name: '3DLabel-BatchCode',
          label: 'Batch Datum: LOT-2026-X8',
          position: [0.24, -0.16, 0.16],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
      ];
    }

    // 5. VUMARK OPTICAL: SERIALIZED ASSET MAINTENANCE
    if (template === 'vumark') {
      return [
        {
          id: 'thingmark-1',
          type: 'thingmark',
          name: 'VuMark-AssetID',
          label: 'VuMark ID: EQUIP-CYL-8821',
          position: [0.0, 0.32, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: '3dgauge-1',
          type: '3dgauge',
          name: '3DGauge-Runtime',
          label: 'Operating Hours (1,840 hrs)',
          position: [-0.22, 0.20, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'pressure',
        },
        {
          id: '3dgauge-2',
          type: '3dgauge',
          name: '3DGauge-Vibration',
          label: 'Spindle Bearing RMS Vibration',
          position: [0.22, 0.20, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'vibration',
        },
        {
          id: '3dlabel-1',
          type: '3dlabel',
          name: 'SOPCard-Maintenance',
          label: 'PM Overhaul: Next Due 160 hrs',
          position: [-0.15, -0.16, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: 'spatial-pin-1',
          type: 'spatial_pin',
          name: 'SpatialPin-ZerkFitting',
          label: 'Lubrication Grease Port Datum',
          position: [0.18, -0.16, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
      ];
    }

    // 6. AREA TARGET: ASSEMBLY BAY 3 FACILITY NAV
    if (template === 'area_target') {
      return [
        {
          id: 'spatial-pin-1',
          type: 'spatial_pin',
          name: 'SpatialPin-Station1',
          label: 'Bay 3: Sub-Assembly Bench',
          position: [-0.35, 0.15, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: 'spatial-pin-2',
          type: 'spatial_pin',
          name: 'SpatialPin-Station2',
          label: 'Bay 3: CNC Honing Cell',
          position: [0.32, 0.15, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: '3dlabel-1',
          type: '3dlabel',
          name: 'Tolerance-CraneClearance',
          label: 'Overhead Crane Envelope: 3.8m Clearance',
          position: [0.0, 0.38, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'none',
        },
        {
          id: '3dgauge-1',
          type: '3dgauge',
          name: '3DGauge-AmbientTemp',
          label: 'Bay Ambient Temp (°C)',
          position: [-0.22, -0.22, 0.0],
          rotation: [0, 0, 0],
          scale: 1.0,
          bindingField: 'temperature',
        },
        {
          id: '3dlabel-2',
          type: '3dlabel',
          name: 'SOPCard-EvacRoute',
          label: 'Emergency E-Stop & Evac Route',
          position: [0.22, -0.22, 0.0],
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
    if (this.projectsListCache && this.projectsListCache.length > 0) {
      return this.projectsListCache;
    }

    if (this.isBrowser()) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PROJECT_LIST);
        if (stored) {
          const parsed: VuforiaProject[] = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.projectsListCache = parsed;
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to parse Vuforia projects list from storage:', err);
      }
    }

    // Populate all 6 seeded manufacturing projects
    const allSeeded = SEED_VUFORIA_PROJECTS.map((p) => ({
      ...p,
      augmentations: this.generateTemplateAugmentations(p.template),
    }));

    this.projectsListCache = allSeeded;
    this.saveProjectsList(allSeeded);
    return allSeeded;
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
    const allSeeded = SEED_VUFORIA_PROJECTS.map((p) => ({
      ...p,
      augmentations: this.generateTemplateAugmentations(p.template),
    }));
    this.activeProjectCache = {
      ...DEFAULT_VUFORIA_PROJECT,
      augmentations: this.generateTemplateAugmentations(DEFAULT_VUFORIA_PROJECT.template),
    };
    this.projectsListCache = allSeeded;
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
