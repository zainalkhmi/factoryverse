/**
 * FactoryVerse Expert XR - Domain Data Types
 * Comprehensive models for industrial procedures, revisions, 3D models,
 * capture sessions, training executions, inspections, and user roles.
 */

import type { InspectionRule, InspectionResult } from '../inspection/inspection-engine';

export type ProcedureStatus = 'draft' | 'published' | 'archived';

export type StepType =
  | 'instruction'
  | 'media'
  | 'select_component'
  | 'assembly_action'
  | 'measurement'
  | 'checkpoint'
  | 'safety_warning'
  | 'confirmation';

export type InteractionType =
  | 'identify'
  | 'grab_and_seat'
  | 'align_and_lock'
  | 'measure'
  | 'review';

export type ComponentId = 'barrel' | 'piston_rod' | 'end_cap' | 'seal_ring' | 'inspection_port';

export interface ProcedureStep {
  id: string;
  order: number;
  title: string;
  instruction: string;
  stepType: StepType;
  interactionType: InteractionType;
  targetComponentId?: ComponentId | string;
  checkpoint?: string;
  safetyWarning?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  inspectionRule?: InspectionRule;
  estimatedDurationSeconds: number;
  spatialAnnotation?: {
    position: [number, number, number];
    label: string;
  };
}

export interface ProcedureRevision {
  revisionId: string;
  revisionNumber: number;
  publishedAt: string | null;
  publishedBy: string;
  changeSummary: string;
  steps: ProcedureStep[];
}

export interface Procedure {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'Assembly' | 'Maintenance' | 'Inspection' | 'Safety';
  status: ProcedureStatus;
  currentRevisionNumber: number;
  author: string;
  createdAt: string;
  updatedAt: string;
  estimatedTotalDurationMinutes: number;
  requiredTools: string[];
  safetyPrecautions: string[];
  associatedModelId: string;
  revisions: ProcedureRevision[];
  activeDraftSteps: ProcedureStep[];
}

export interface ModelComponent {
  id: ComponentId | string;
  name: string;
  partCode: string;
  material: string;
  nominalWeightKg: number;
  isInspectable: boolean;
  defaultPosition: [number, number, number];
  explodedPosition: [number, number, number];
}

export interface ModelAsset {
  id: string;
  name: string;
  category: string;
  format: 'procedural' | 'gltf' | 'glb';
  components: ModelComponent[];
  createdAt: string;
}

export interface CapturedStep {
  id: string;
  order: number;
  timestamp: string;
  title: string;
  writtenAction: string;
  narrationText: string;
  mediaBlobUrl?: string;
  mediaFileName?: string;
  mediaType?: 'image' | 'video';
  checkpointCriteria?: string;
  targetComponentId?: ComponentId | string;
}

export interface CaptureSession {
  id: string;
  title: string;
  expertName: string;
  recordedAt: string;
  status: 'recording' | 'completed' | 'converted';
  steps: CapturedStep[];
  notes: string;
}

export interface StepExecutionResult {
  stepId: string;
  order: number;
  startedAt: number;
  completedAt: number;
  status: 'passed' | 'failed' | 'skipped';
  checkpointPassed: boolean;
  inspectionResult?: InspectionResult;
  notes?: string;
}

export interface SupervisorApproval {
  approvedBy: string;
  supervisorPin: string;
  approvedAt: string;
  signatureHash: string;
  notes: string;
}

export interface TrainingSession {
  id: string;
  procedureId: string;
  procedureTitle: string;
  procedureCode: string;
  revisionNumber: number;
  operatorId: string;
  operatorName: string;
  startedAt: string;
  completedAt: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  overallPassed: boolean;
  totalScore: number;
  stepResults: StepExecutionResult[];
  inspectionResult: InspectionResult | null;
  failedCheckpoints: string[];
  durationSeconds: number;
  supervisorApproval?: SupervisorApproval;
}

export type UserRole = 'Administrator' | 'Author' | 'Quality_Inspector' | 'Operator' | 'Trainee';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  active: boolean;
}

export interface PlatformStats {
  totalProcedures: number;
  publishedProcedures: number;
  draftProcedures: number;
  archivedProcedures: number;
  totalTrainingSessions: number;
  averagePassRate: number;
  averageScore: number;
}

export interface EquipmentAsset {
  id: string;
  code: string;
  name: string;
  serialNumber: string;
  manufacturer: string;
  location: string;
  associatedProcedureId: string;
  modelAssetId?: string;
  calibrationDate: string;
  status: 'calibrated' | 'pending_calibration' | 'maintenance_required';
  qrPayload: string;
}

export interface BarcodeScanResult {
  code: string;
  format: string;
  equipment?: EquipmentAsset;
  procedureId?: string;
  timestamp: string;
}
