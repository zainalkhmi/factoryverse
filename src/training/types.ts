/**
 * FactoryVerse Expert XR - Training Types and Models
 * Standardized data models for procedural assembly instructions and session metrics.
 */

import type { InspectionRule, InspectionResult } from '../inspection/inspection-engine';

export type ComponentId = 'barrel' | 'piston_rod' | 'end_cap' | 'seal_ring' | 'inspection_port';

export type StepInteractionType =
  | 'identify'
  | 'grab_and_seat'
  | 'align_and_lock'
  | 'measure'
  | 'review';

export interface InstructionStep {
  id: string;
  order: number;
  title: string;
  instruction: string;
  checkpoint: string;
  targetComponentId: ComponentId;
  interactionType: StepInteractionType;
  inspectionRule?: InspectionRule;
  estimatedDurationSeconds: number;
}

export interface TrainingScore {
  totalScore: number;             // 0 to 100
  stepCompletionPoints: number;   // Max 50 pts
  inspectionPoints: number;       // Max 35 pts
  timeBonusPoints: number;        // Max 15 pts
  completedStepCount: number;
  totalStepCount: number;
  passedCheckpoints: string[];
  failedCheckpoints: string[];
  inspectionResult: InspectionResult | null;
  overallPassed: boolean;
  durationSeconds: number;
}

export interface TrainingSessionState {
  currentStepIndex: number;
  completedStepIds: string[];
  componentIdentified: Record<ComponentId, boolean>;
  assembledComponents: Set<ComponentId>;
  measurementResult: InspectionResult | null;
  startTime: number;
  endTime: number | null;
  isComplete: boolean;
}
