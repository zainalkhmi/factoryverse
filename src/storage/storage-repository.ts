/**
 * FactoryVerse Expert XR - Storage & Persistence Layer
 * Provides repository interface, LocalStorage implementation, and seed data.
 */

import { DEFAULT_CYLINDER_INSPECTION_RULE } from '../inspection/inspection-engine';
import type {
  CaptureSession,
  CapturedStep,
  ModelAsset,
  PlatformStats,
  Procedure,
  ProcedureRevision,
  ProcedureStep,
  SupervisorApproval,
  TrainingSession,
  UserAccount,
} from '../types';

export interface IStorageRepository {
  // Procedures
  getProcedures(): Procedure[];
  getProcedureById(id: string): Procedure | null;
  saveProcedure(procedure: Procedure): void;
  deleteProcedure(id: string): boolean;
  publishProcedure(id: string, changeSummary: string): Procedure | null;
  createRevisionDraft(id: string): Procedure | null;

  // 3D Models
  getModels(): ModelAsset[];
  getModelById(id: string): ModelAsset | null;
  saveModel(model: ModelAsset): void;

  // Expert Capture
  getCaptureSessions(): CaptureSession[];
  getCaptureSessionById(id: string): CaptureSession | null;
  saveCaptureSession(session: CaptureSession): void;
  convertCaptureToProcedure(sessionId: string): Procedure | null;

  // Training Sessions
  getTrainingSessions(): TrainingSession[];
  getTrainingSessionById(id: string): TrainingSession | null;
  saveTrainingSession(session: TrainingSession): void;
  approveTrainingSession(sessionId: string, approval: SupervisorApproval): TrainingSession | null;

  // Users & Analytics
  getUsers(): UserAccount[];
  getStats(): PlatformStats;

  // Export
  exportSessionsAsJson(): string;
  exportSessionsAsCsv(): string;

  // Reset
  resetToDefaultSeeds(): void;
}

const STORAGE_KEYS = {
  PROCEDURES: 'factoryverse_procedures_v1',
  MODELS: 'factoryverse_models_v1',
  CAPTURES: 'factoryverse_captures_v1',
  SESSIONS: 'factoryverse_sessions_v1',
  USERS: 'factoryverse_users_v1',
};

// Seed: Hydraulic Cylinder Model
export const SEED_HYDRAULIC_MODEL: ModelAsset = {
  id: 'model-hydraulic-cyl-01',
  name: 'Modular Heavy-Duty Hydraulic Cylinder',
  category: 'Actuators',
  format: 'procedural',
  createdAt: '2026-10-01T08:00:00.000Z',
  components: [
    {
      id: 'barrel',
      name: 'Cylinder Barrel Bore',
      partCode: 'CYL-BRL-01',
      material: 'Honed Seamless Steel Tube',
      nominalWeightKg: 4.2,
      isInspectable: true,
      defaultPosition: [-0.35, 0.92, 0],
      explodedPosition: [-0.95, 0.92, 0],
    },
    {
      id: 'piston_rod',
      name: 'Hard-Chrome Piston Rod & Piston Head',
      partCode: 'CYL-ROD-02',
      material: 'Induction-Hardened Chrome Alloy',
      nominalWeightKg: 2.6,
      isInspectable: true,
      defaultPosition: [0.05, 0.92, 0],
      explodedPosition: [0.05, 1.25, 0],
    },
    {
      id: 'seal_ring',
      name: 'Hydraulic U-Cup & Retaining Seal',
      partCode: 'CYL-SEL-03',
      material: '92 Shore A Polyurethane',
      nominalWeightKg: 0.08,
      isInspectable: false,
      defaultPosition: [0.42, 0.92, 0],
      explodedPosition: [0.42, 1.15, 0.3],
    },
    {
      id: 'end_cap',
      name: 'Threaded Cylinder Gland End Cap',
      partCode: 'CYL-CAP-04',
      material: 'Ductile Iron Machined Flange',
      nominalWeightKg: 1.4,
      isInspectable: true,
      defaultPosition: [0.65, 0.92, 0],
      explodedPosition: [1.15, 0.92, 0],
    },
    {
      id: 'inspection_port',
      name: 'Gland Seating Depth Gauge Feature',
      partCode: 'CYL-INS-05',
      material: 'Precision Ground Datum Face',
      nominalWeightKg: 0.0,
      isInspectable: true,
      defaultPosition: [0.55, 1.05, 0],
      explodedPosition: [0.55, 1.35, 0],
    },
  ],
};

export const SEED_VALVE_MANIFOLD_MODEL: ModelAsset = {
  id: 'model-valve-manifold-02',
  name: 'High-Pressure Hydraulic Manifold Block',
  category: 'Valves & Manifolds',
  format: 'procedural',
  createdAt: '2026-10-05T09:00:00.000Z',
  components: [
    {
      id: 'manifold_block',
      name: 'CNC Monoblock Manifold Core',
      partCode: 'MNF-BLK-01',
      material: 'Anodized 6061-T6 Aluminum',
      nominalWeightKg: 8.5,
      isInspectable: true,
      defaultPosition: [0, 0, 0],
      explodedPosition: [0, 0, 0],
    },
    {
      id: 'spool_valve',
      name: 'Proportional Cartridge Valve Spool',
      partCode: 'VLV-SPL-02',
      material: 'Hardened Tool Steel',
      nominalWeightKg: 1.2,
      isInspectable: true,
      defaultPosition: [-0.12, 0.22, 0],
      explodedPosition: [-0.12, 0.45, 0],
    },
    {
      id: 'pressure_flange',
      name: 'High-Pressure SAE 6000 PSI Flange',
      partCode: 'FLG-PR-03',
      material: 'Forged Carbon Steel',
      nominalWeightKg: 2.1,
      isInspectable: true,
      defaultPosition: [0.26, 0, 0],
      explodedPosition: [0.55, 0, 0],
    },
  ],
};

export const SEED_CENTRIFUGAL_PUMP_MODEL: ModelAsset = {
  id: 'model-centrifugal-pump-03',
  name: 'Industrial Centrifugal Slurry Pump',
  category: 'Pumps & Turbines',
  format: 'procedural',
  createdAt: '2026-10-08T11:30:00.000Z',
  components: [
    {
      id: 'volute_casing',
      name: 'Spiral Volute Pump Housing',
      partCode: 'PMP-VOL-01',
      material: 'ASTM A48 Cast Iron',
      nominalWeightKg: 14.2,
      isInspectable: true,
      defaultPosition: [0, 0, 0],
      explodedPosition: [0, 0, 0],
    },
    {
      id: 'impeller',
      name: 'Semi-Open Vortex Impeller',
      partCode: 'PMP-IMP-02',
      material: 'CF8M Stainless Steel',
      nominalWeightKg: 3.8,
      isInspectable: true,
      defaultPosition: [0, 0, 0.12],
      explodedPosition: [0, 0, 0.38],
    },
    {
      id: 'shaft_coupling',
      name: 'Flexible Jaw Shaft Coupling',
      partCode: 'PMP-CPL-03',
      material: 'Forged Steel & Nitrile',
      nominalWeightKg: 1.9,
      isInspectable: false,
      defaultPosition: [0.18, 0.15, 0],
      explodedPosition: [0.4, 0.35, 0],
    },
  ],
};

export const SEED_ROBOTIC_FLANGE_MODEL: ModelAsset = {
  id: 'model-robotic-flange-04',
  name: '6-Axis Robot End-Effector Tooling Flange',
  category: 'Robotics & Automation',
  format: 'procedural',
  createdAt: '2026-10-14T14:00:00.000Z',
  components: [
    {
      id: 'tool_plate',
      name: 'ISO 9409-1-50-4-M6 Tool Mounting Plate',
      partCode: 'ROB-PLT-01',
      material: 'Aviation 7075-T6 Aluminum',
      nominalWeightKg: 1.1,
      isInspectable: true,
      defaultPosition: [0, 0, 0],
      explodedPosition: [0, 0, -0.2],
    },
    {
      id: 'gripper_jaws',
      name: 'Pneumatic Parallel Gripping Jaws',
      partCode: 'ROB-GRP-02',
      material: 'Hardened Anodized Alloy',
      nominalWeightKg: 1.8,
      isInspectable: true,
      defaultPosition: [0, 0, 0.1],
      explodedPosition: [0, 0, 0.35],
    },
    {
      id: 'sensor_bracket',
      name: 'Optical Sensor Alignment Bracket',
      partCode: 'ROB-BKT-03',
      material: 'Carbon Fiber Reinforced Polymer',
      nominalWeightKg: 0.3,
      isInspectable: false,
      defaultPosition: [0.06, 0, 0.22],
      explodedPosition: [0.2, 0, 0.3],
    },
  ],
};

export const SEED_ALL_MODELS: ModelAsset[] = [
  SEED_HYDRAULIC_MODEL,
  SEED_VALVE_MANIFOLD_MODEL,
  SEED_CENTRIFUGAL_PUMP_MODEL,
  SEED_ROBOTIC_FLANGE_MODEL,
];

// Seed: Hydraulic Cylinder Procedure Steps
export const SEED_CYLINDER_STEPS: ProcedureStep[] = [
  {
    id: 'step-1-inspect',
    order: 1,
    title: 'Component Verification and Layout',
    instruction: 'Inspect the workstation parts tray. Verify the cylinder barrel, hard-chrome piston rod, and gland end cap are present and free of surface scratches or swarf.',
    stepType: 'instruction',
    interactionType: 'identify',
    targetComponentId: 'barrel',
    checkpoint: 'All primary hydraulic components verified with surface integrity confirmed.',
    safetyWarning: 'Wear nitrile protective gloves. Parts are pre-coated with synthetic hydraulic assembly oil.',
    estimatedDurationSeconds: 45,
  },
  {
    id: 'step-2-assemble-rod',
    order: 2,
    title: 'Insert Piston Rod into Barrel Bore',
    instruction: 'Pinch and lift the piston rod assembly from the tray. Align it coaxially with the cylinder barrel bore and push smoothly until the piston head seats against the bottom stop.',
    stepType: 'assembly_action',
    interactionType: 'grab_and_seat',
    targetComponentId: 'piston_rod',
    checkpoint: 'Piston rod axially aligned and seated with smooth mechanical travel.',
    safetyWarning: 'Do not cock the rod during insertion to prevent scoring the micro-honed barrel finish.',
    estimatedDurationSeconds: 60,
  },
  {
    id: 'step-3-install-cap',
    order: 3,
    title: 'Install and Torque End Cap Gland',
    instruction: 'Pick up the threaded gland end cap. Position it over the rod shank and thread into the barrel collar until fully mated flush against the internal shoulder.',
    stepType: 'assembly_action',
    interactionType: 'align_and_lock',
    targetComponentId: 'end_cap',
    checkpoint: 'End cap threaded flush with retaining flange zero gap.',
    estimatedDurationSeconds: 60,
  },
  {
    id: 'step-4-inspect',
    order: 4,
    title: 'Quality Dimensional Verification',
    instruction: 'Measure the seated gland clearance depth with the caliper datum tool. Nominal dimension is 24.00 mm with tolerance ±0.10 mm (23.90 mm to 24.10 mm). Record the value.',
    stepType: 'measurement',
    interactionType: 'measure',
    targetComponentId: 'inspection_port',
    checkpoint: 'Seating clearance dimension certified within 23.90 mm – 24.10 mm.',
    inspectionRule: DEFAULT_CYLINDER_INSPECTION_RULE,
    estimatedDurationSeconds: 45,
  },
  {
    id: 'step-5-summary',
    order: 5,
    title: 'Workstation Cleanup and Certification',
    instruction: 'Review the digital inspection certification, verify all checkpoints passed, and submit the training session record to the quality system.',
    stepType: 'confirmation',
    interactionType: 'review',
    targetComponentId: 'barrel',
    checkpoint: 'Assembly procedure certified and signed off.',
    estimatedDurationSeconds: 30,
  },
];

// Seed: Primary Procedure
export const SEED_PROCEDURES: Procedure[] = [
  {
    id: 'proc-hyd-cyl-01',
    code: 'SOP-HYD-042',
    title: 'Hydraulic Cylinder Assembly and Inspection',
    description: 'Standard operating procedure for manual assembly, gland seating, and precision dimensional verification of a double-acting industrial hydraulic cylinder.',
    category: 'Assembly',
    status: 'published',
    currentRevisionNumber: 1,
    author: 'Elena Vance (Lead Assembly Specialist)',
    createdAt: '2026-10-10T09:30:00.000Z',
    updatedAt: '2026-10-12T14:15:00.000Z',
    estimatedTotalDurationMinutes: 4,
    requiredTools: ['Digital Vernier Caliper (0-150mm)', 'Nitrile Assembly Gloves', 'Lint-Free Wipes', 'Nylon Assembly Drift'],
    safetyPrecautions: ['Pinch hazard during rod insertion', 'Use proper lifting posture for steel cylinder bodies', 'Wear ISO 13688 rated PPE'],
    associatedModelId: 'model-hydraulic-cyl-01',
    revisions: [
      {
        revisionId: 'rev-01-initial',
        revisionNumber: 1,
        publishedAt: '2026-10-12T14:15:00.000Z',
        publishedBy: 'Elena Vance',
        changeSummary: 'Initial validated release with 24.00 mm ± 0.10 mm tolerance specification.',
        steps: JSON.parse(JSON.stringify(SEED_CYLINDER_STEPS)),
      },
    ],
    activeDraftSteps: JSON.parse(JSON.stringify(SEED_CYLINDER_STEPS)),
  },
  {
    id: 'proc-hyd-flange-02',
    code: 'SOP-HYD-043',
    title: 'Hydraulic High-Pressure Manifold Seal Inspection',
    description: 'Pre-flight pressure seal seating procedure and leak-path surface flatness verification.',
    category: 'Inspection',
    status: 'draft',
    currentRevisionNumber: 0,
    author: 'Marcus Cole (Quality Auditor)',
    createdAt: '2026-10-18T11:00:00.000Z',
    updatedAt: '2026-10-22T16:20:00.000Z',
    estimatedTotalDurationMinutes: 5,
    requiredTools: ['Feeler Gauge Set', 'Optical Surface Loupe'],
    safetyPrecautions: ['Depressurize manifold lines prior to gauge insertion'],
    associatedModelId: 'model-hydraulic-cyl-01',
    revisions: [],
    activeDraftSteps: [
      {
        id: 'draft-step-1',
        order: 1,
        title: 'Clean O-Ring Groove',
        instruction: 'Wipe down sealing surface using isopropyl alcohol wipes. Verify no grit remains.',
        stepType: 'instruction',
        interactionType: 'identify',
        targetComponentId: 'seal_ring',
        checkpoint: 'Sealing groove particulate-free.',
        estimatedDurationSeconds: 60,
      },
      {
        id: 'draft-step-2',
        order: 2,
        title: 'Seat Fluorocarbon O-Ring',
        instruction: 'Carefully press the elastomeric seal into the retaining recess without twisting.',
        stepType: 'assembly_action',
        interactionType: 'grab_and_seat',
        targetComponentId: 'seal_ring',
        checkpoint: 'O-ring uniformly seated along 360-degree perimeter.',
        estimatedDurationSeconds: 90,
      },
    ],
  },
];

// Seed: Capture Sessions
export const SEED_CAPTURES: CaptureSession[] = [
  {
    id: 'cap-session-01',
    title: 'Expert Workstation Demo — Hydraulic Cylinder Build',
    expertName: 'Marcus Cole (Master Technician)',
    recordedAt: '2026-10-08T10:15:00.000Z',
    status: 'converted',
    notes: 'Walkthrough demonstration captured on the test bench for training new shift technicians.',
    steps: [
      {
        id: 'cap-step-1',
        order: 1,
        timestamp: '00:15',
        title: 'Verify Bore Finish',
        writtenAction: 'Inspect inside the honed barrel bore with inspection mirror.',
        narrationText: 'Always check that the honed surface has no cross-hatched burrs before seating the chrome rod.',
        checkpointCriteria: 'No scratches deeper than 0.02 mm.',
        targetComponentId: 'barrel',
      },
      {
        id: 'cap-step-2',
        order: 2,
        timestamp: '01:10',
        title: 'Insert Rod Smoothly',
        writtenAction: 'Slide the rod along centerline without tilting.',
        narrationText: 'Support both ends of the rod so the seal does not catch on the entry bevel.',
        checkpointCriteria: 'Zero radial binding.',
        targetComponentId: 'piston_rod',
      },
      {
        id: 'cap-step-3',
        order: 3,
        timestamp: '02:40',
        title: 'Check Gland Datum Clearance',
        writtenAction: 'Position vernier caliper against datum collar.',
        narrationText: 'Ensure the depth rod rests flat. Nominal target is 24 mm flat, with a tenth millimeter tolerance.',
        checkpointCriteria: 'Within 23.90 mm to 24.10 mm.',
        targetComponentId: 'inspection_port',
      },
    ],
  },
];

// Seed: Realistic Training Sessions for Analytics
export const SEED_TRAINING_SESSIONS: TrainingSession[] = [
  {
    id: 'sess-2026-1021-01',
    procedureId: 'proc-hyd-cyl-01',
    procedureTitle: 'Hydraulic Cylinder Assembly and Inspection',
    procedureCode: 'SOP-HYD-042',
    revisionNumber: 1,
    operatorId: 'OP-4102',
    operatorName: 'Alex Mercer (Apprentice)',
    startedAt: '2026-10-21T08:14:20.000Z',
    completedAt: '2026-10-21T08:17:48.000Z',
    status: 'completed',
    overallPassed: true,
    totalScore: 95,
    durationSeconds: 208,
    inspectionResult: {
      ruleId: 'cyl-seat-dim-01',
      parameterName: 'Seating Depth Clearance',
      state: 'PASS',
      measuredValue: 24.02,
      rawInput: '24.02',
      nominalValue: 24.00,
      deviation: 0.02,
      message: 'PASS: Measured 24.02 mm is within tolerance [23.90, 24.10] mm.',
      timestamp: 1792570640000,
      isPassing: true,
    },
    failedCheckpoints: [],
    stepResults: [
      { stepId: 'step-1-inspect', order: 1, startedAt: 1792570460000, completedAt: 1792570495000, status: 'passed', checkpointPassed: true },
      { stepId: 'step-2-assemble-rod', order: 2, startedAt: 1792570495000, completedAt: 1792570545000, status: 'passed', checkpointPassed: true },
      { stepId: 'step-3-install-cap', order: 3, startedAt: 1792570545000, completedAt: 1792570600000, status: 'passed', checkpointPassed: true },
      { stepId: 'step-4-inspect', order: 4, startedAt: 1792570600000, completedAt: 1792570645000, status: 'passed', checkpointPassed: true },
      { stepId: 'step-5-summary', order: 5, startedAt: 1792570645000, completedAt: 1792570668000, status: 'passed', checkpointPassed: true },
    ],
  },
  {
    id: 'sess-2026-1022-02',
    procedureId: 'proc-hyd-cyl-01',
    procedureTitle: 'Hydraulic Cylinder Assembly and Inspection',
    procedureCode: 'SOP-HYD-042',
    revisionNumber: 1,
    operatorId: 'OP-4108',
    operatorName: 'Devon Lee (Trainee)',
    startedAt: '2026-10-22T13:20:10.000Z',
    completedAt: '2026-10-22T13:24:45.000Z',
    status: 'completed',
    overallPassed: false,
    totalScore: 62,
    durationSeconds: 275,
    inspectionResult: {
      ruleId: 'cyl-seat-dim-01',
      parameterName: 'Seating Depth Clearance',
      state: 'FAIL',
      measuredValue: 24.16,
      rawInput: '24.16',
      nominalValue: 24.00,
      deviation: 0.16,
      message: 'FAIL: Measured 24.16 mm EXCEEDS maximum tolerance (24.10 mm) by 0.06 mm.',
      timestamp: 1792675460000,
      isPassing: false,
    },
    failedCheckpoints: ['Seating clearance dimension certified within 23.90 mm – 24.10 mm.'],
    stepResults: [
      { stepId: 'step-1-inspect', order: 1, startedAt: 1792675210000, completedAt: 1792675250000, status: 'passed', checkpointPassed: true },
      { stepId: 'step-2-assemble-rod', order: 2, startedAt: 1792675250000, completedAt: 1792675310000, status: 'passed', checkpointPassed: true },
      { stepId: 'step-3-install-cap', order: 3, startedAt: 1792675310000, completedAt: 1792675390000, status: 'passed', checkpointPassed: true },
      { stepId: 'step-4-inspect', order: 4, startedAt: 1792675390000, completedAt: 1792675465000, status: 'failed', checkpointPassed: false },
      { stepId: 'step-5-summary', order: 5, startedAt: 1792675465000, completedAt: 1792675485000, status: 'passed', checkpointPassed: true },
    ],
  },
  {
    id: 'sess-2026-1023-03',
    procedureId: 'proc-hyd-cyl-01',
    procedureTitle: 'Hydraulic Cylinder Assembly and Inspection',
    procedureCode: 'SOP-HYD-042',
    revisionNumber: 1,
    operatorId: 'OP-3920',
    operatorName: 'Sanjay Patel (Senior Assembler)',
    startedAt: '2026-10-23T09:05:00.000Z',
    completedAt: '2026-10-23T09:08:12.000Z',
    status: 'completed',
    overallPassed: true,
    totalScore: 98,
    durationSeconds: 192,
    inspectionResult: {
      ruleId: 'cyl-seat-dim-01',
      parameterName: 'Seating Depth Clearance',
      state: 'PASS',
      measuredValue: 23.98,
      rawInput: '23.98',
      nominalValue: 24.00,
      deviation: -0.02,
      message: 'PASS: Measured 23.98 mm is within tolerance [23.90, 24.10] mm.',
      timestamp: 1792746480000,
      isPassing: true,
    },
    failedCheckpoints: [],
    stepResults: [
      { stepId: 'step-1-inspect', order: 1, startedAt: 1792746300000, completedAt: 1792746330000, status: 'passed', checkpointPassed: true },
      { stepId: 'step-2-assemble-rod', order: 2, startedAt: 1792746330000, completedAt: 1792746380000, status: 'passed', checkpointPassed: true },
      { stepId: 'step-3-install-cap', order: 3, startedAt: 1792746380000, completedAt: 1792746430000, status: 'passed', checkpointPassed: true },
      { stepId: 'step-4-inspect', order: 4, startedAt: 1792746430000, completedAt: 1792746470000, status: 'passed', checkpointPassed: true },
      { stepId: 'step-5-summary', order: 5, startedAt: 1792746470000, completedAt: 1792746492000, status: 'passed', checkpointPassed: true },
    ],
  },
];

// Seed: User Accounts
export const SEED_USERS: UserAccount[] = [
  { id: 'usr-01', name: 'Elena Vance', email: 'elena.vance@factoryverse.local', role: 'Author', active: true },
  { id: 'usr-02', name: 'Marcus Cole', email: 'marcus.cole@factoryverse.local', role: 'Quality_Inspector', active: true },
  { id: 'usr-03', name: 'Alex Mercer', email: 'alex.mercer@factoryverse.local', role: 'Trainee', active: true },
  { id: 'usr-04', name: 'Dr. Aris Thorne', email: 'aris.thorne@factoryverse.local', role: 'Administrator', active: true },
];

export class LocalStorageRepository implements IStorageRepository {
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    if (!this.isBrowser) return;

    if (!localStorage.getItem(STORAGE_KEYS.PROCEDURES)) {
      localStorage.setItem(STORAGE_KEYS.PROCEDURES, JSON.stringify(SEED_PROCEDURES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MODELS)) {
      localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify([SEED_HYDRAULIC_MODEL]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CAPTURES)) {
      localStorage.setItem(STORAGE_KEYS.CAPTURES, JSON.stringify(SEED_CAPTURES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(SEED_TRAINING_SESSIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    }
  }

  public getProcedures(): Procedure[] {
    if (!this.isBrowser) return JSON.parse(JSON.stringify(SEED_PROCEDURES));
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROCEDURES);
      return data ? JSON.parse(data) : [];
    } catch {
      return JSON.parse(JSON.stringify(SEED_PROCEDURES));
    }
  }

  public getProcedureById(id: string): Procedure | null {
    const list = this.getProcedures();
    return list.find((p) => p.id === id) || null;
  }

  public saveProcedure(procedure: Procedure): void {
    procedure.updatedAt = new Date().toISOString();
    const list = this.getProcedures();
    const index = list.findIndex((p) => p.id === procedure.id);
    if (index >= 0) {
      list[index] = procedure;
    } else {
      list.unshift(procedure);
    }
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.PROCEDURES, JSON.stringify(list));
    }
  }

  public deleteProcedure(id: string): boolean {
    const list = this.getProcedures();
    const filtered = list.filter((p) => p.id !== id);
    if (filtered.length !== list.length) {
      if (this.isBrowser) {
        localStorage.setItem(STORAGE_KEYS.PROCEDURES, JSON.stringify(filtered));
      }
      return true;
    }
    return false;
  }

  public publishProcedure(id: string, changeSummary: string): Procedure | null {
    const proc = this.getProcedureById(id);
    if (!proc) return null;

    if (proc.activeDraftSteps.length === 0) {
      throw new Error('Cannot publish a procedure with 0 steps.');
    }

    const newRevNum = proc.currentRevisionNumber + 1;
    const revision: ProcedureRevision = {
      revisionId: `rev-${newRevNum}-${Date.now()}`,
      revisionNumber: newRevNum,
      publishedAt: new Date().toISOString(),
      publishedBy: proc.author || 'Author',
      changeSummary: changeSummary || `Revision ${newRevNum} published.`,
      steps: JSON.parse(JSON.stringify(proc.activeDraftSteps)),
    };

    proc.revisions.unshift(revision);
    proc.currentRevisionNumber = newRevNum;
    proc.status = 'published';
    this.saveProcedure(proc);
    return proc;
  }

  public createRevisionDraft(id: string): Procedure | null {
    const proc = this.getProcedureById(id);
    if (!proc) return null;

    // Copies current published revision steps into activeDraftSteps and switches status to draft
    proc.status = 'draft';
    if (proc.revisions.length > 0) {
      proc.activeDraftSteps = JSON.parse(JSON.stringify(proc.revisions[0].steps));
    }
    this.saveProcedure(proc);
    return proc;
  }

  public getModels(): ModelAsset[] {
    if (!this.isBrowser) return [...SEED_ALL_MODELS];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MODELS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((m: any) => m.id));
          let changed = false;
          for (const seed of SEED_ALL_MODELS) {
            if (!existingIds.has(seed.id)) {
              parsed.push(seed);
              changed = true;
            }
          }
          if (changed) {
            localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(parsed));
          }
          return parsed;
        }
      }
      localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(SEED_ALL_MODELS));
      return [...SEED_ALL_MODELS];
    } catch {
      return [...SEED_ALL_MODELS];
    }
  }

  public getModelById(id: string): ModelAsset | null {
    return this.getModels().find((m) => m.id === id) || null;
  }

  public saveModel(model: ModelAsset): void {
    const list = this.getModels();
    const index = list.findIndex((m) => m.id === model.id);
    if (index >= 0) list[index] = model;
    else list.push(model);
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(list));
    }
  }

  public getCaptureSessions(): CaptureSession[] {
    if (!this.isBrowser) return JSON.parse(JSON.stringify(SEED_CAPTURES));
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAPTURES);
      return data ? JSON.parse(data) : [];
    } catch {
      return JSON.parse(JSON.stringify(SEED_CAPTURES));
    }
  }

  public getCaptureSessionById(id: string): CaptureSession | null {
    return this.getCaptureSessions().find((c) => c.id === id) || null;
  }

  public saveCaptureSession(session: CaptureSession): void {
    const list = this.getCaptureSessions();
    const index = list.findIndex((c) => c.id === session.id);
    if (index >= 0) list[index] = session;
    else list.unshift(session);
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.CAPTURES, JSON.stringify(list));
    }
  }

  public convertCaptureToProcedure(sessionId: string): Procedure | null {
    const session = this.getCaptureSessionById(sessionId);
    if (!session) return null;

    const steps: ProcedureStep[] = session.steps.map((s: CapturedStep, idx: number) => ({
      id: `step-${Date.now()}-${idx + 1}`,
      order: idx + 1,
      title: s.title,
      instruction: `${s.writtenAction}${s.narrationText ? ' (' + s.narrationText + ')' : ''}`,
      stepType: 'instruction',
      interactionType: idx === 1 ? 'grab_and_seat' : idx === 2 ? 'measure' : 'identify',
      targetComponentId: s.targetComponentId || 'barrel',
      checkpoint: s.checkpointCriteria || 'Step completed per standard.',
      mediaUrl: s.mediaBlobUrl,
      mediaType: s.mediaType,
      estimatedDurationSeconds: 60,
      inspectionRule: idx === 2 ? DEFAULT_CYLINDER_INSPECTION_RULE : undefined,
    }));

    const newProc: Procedure = {
      id: `proc-from-cap-${Date.now()}`,
      code: `SOP-CAP-${Math.floor(100 + Math.random() * 900)}`,
      title: `${session.title} (Draft)`,
      description: `Procedure automatically drafted from expert capture session recorded by ${session.expertName}.`,
      category: 'Assembly',
      status: 'draft',
      currentRevisionNumber: 0,
      author: session.expertName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedTotalDurationMinutes: Math.max(1, Math.round(steps.length * 1.5)),
      requiredTools: ['Safety Glasses', 'Standard Mechanical Toolset'],
      safetyPrecautions: ['Adhere to standard shop floor safety protocols'],
      associatedModelId: 'model-hydraulic-cyl-01',
      revisions: [],
      activeDraftSteps: steps,
    };

    session.status = 'converted';
    this.saveCaptureSession(session);
    this.saveProcedure(newProc);
    return newProc;
  }

  public getTrainingSessions(): TrainingSession[] {
    if (!this.isBrowser) return JSON.parse(JSON.stringify(SEED_TRAINING_SESSIONS));
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return JSON.parse(JSON.stringify(SEED_TRAINING_SESSIONS));
    }
  }

  public getTrainingSessionById(id: string): TrainingSession | null {
    return this.getTrainingSessions().find((s) => s.id === id) || null;
  }

  public saveTrainingSession(session: TrainingSession): void {
    const list = this.getTrainingSessions();
    const index = list.findIndex((s) => s.id === session.id);
    if (index >= 0) list[index] = session;
    else list.unshift(session);
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(list));
    }
  }

  public approveTrainingSession(sessionId: string, approval: SupervisorApproval): TrainingSession | null {
    const session = this.getTrainingSessionById(sessionId);
    if (!session) return null;
    session.supervisorApproval = approval;
    this.saveTrainingSession(session);
    return session;
  }

  public getUsers(): UserAccount[] {
    if (!this.isBrowser) return JSON.parse(JSON.stringify(SEED_USERS));
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return JSON.parse(JSON.stringify(SEED_USERS));
    }
  }

  public getStats(): PlatformStats {
    const procedures = this.getProcedures();
    const sessions = this.getTrainingSessions();

    const published = procedures.filter((p) => p.status === 'published').length;
    const drafts = procedures.filter((p) => p.status === 'draft').length;
    const archived = procedures.filter((p) => p.status === 'archived').length;

    const totalSessions = sessions.length;
    const passedSessions = sessions.filter((s) => s.overallPassed).length;
    const avgPassRate = totalSessions > 0 ? Math.round((passedSessions / totalSessions) * 100) : 0;
    const avgScore = totalSessions > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.totalScore, 0) / totalSessions) : 0;

    return {
      totalProcedures: procedures.length,
      publishedProcedures: published,
      draftProcedures: drafts,
      archivedProcedures: archived,
      totalTrainingSessions: totalSessions,
      averagePassRate: avgPassRate,
      averageScore: avgScore,
    };
  }

  public exportSessionsAsJson(): string {
    return JSON.stringify(this.getTrainingSessions(), null, 2);
  }

  public exportSessionsAsCsv(): string {
    const sessions = this.getTrainingSessions();
    const headers = [
      'SessionID',
      'ProcedureCode',
      'ProcedureTitle',
      'Revision',
      'Operator',
      'StartedAt',
      'CompletedAt',
      'DurationSec',
      'Status',
      'Passed',
      'Score',
      'MeasuredValue_mm',
      'InspectionResult',
      'FailedCheckpoints',
    ];

    const rows = sessions.map((s) => {
      const failed = (s.failedCheckpoints || []).join('; ');
      return [
        s.id,
        `"${s.procedureCode}"`,
        `"${s.procedureTitle.replace(/"/g, '""')}"`,
        s.revisionNumber,
        `"${s.operatorName}"`,
        s.startedAt,
        s.completedAt || '',
        s.durationSeconds,
        s.status,
        s.overallPassed ? 'TRUE' : 'FALSE',
        s.totalScore,
        s.inspectionResult?.measuredValue ?? '',
        s.inspectionResult?.state ?? 'NOT_CHECKED',
        `"${failed.replace(/"/g, '""')}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  public resetToDefaultSeeds(): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.PROCEDURES, JSON.stringify(SEED_PROCEDURES));
    localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify([SEED_HYDRAULIC_MODEL]));
    localStorage.setItem(STORAGE_KEYS.CAPTURES, JSON.stringify(SEED_CAPTURES));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(SEED_TRAINING_SESSIONS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
  }
}

export const storageRepository = new LocalStorageRepository();
