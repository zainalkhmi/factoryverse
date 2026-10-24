/**
 * FactoryVerse Expert XR - Training Engine
 * Manages the training sequence: LEARN → ASSEMBLE → MEASURE → PASS/FAIL → SCORE
 */

import { DEFAULT_CYLINDER_INSPECTION_RULE, InspectionEngine, type InspectionResult } from '../inspection/inspection-engine';
import type { ComponentId, InstructionStep, TrainingScore, TrainingSessionState } from './types';

export const DEFAULT_INSTRUCTION_STEPS: InstructionStep[] = [
  {
    id: 'step-1-identify',
    order: 1,
    title: 'Step 1 — Identify Components',
    instruction: 'Inspect the parts tray. Identify the Cylinder Barrel, Piston Rod, and End Cap before beginning assembly.',
    checkpoint: 'Required components identified and verified for surface defects.',
    targetComponentId: 'barrel',
    interactionType: 'identify',
    estimatedDurationSeconds: 45,
  },
  {
    id: 'step-2-assemble-rod',
    order: 2,
    title: 'Step 2 — Assemble Piston Rod',
    instruction: 'Pinch and grab the Piston Rod from the tray. Carefully align and insert it into the Cylinder Barrel bore until fully seated.',
    checkpoint: 'Piston rod seated in the correct axial position within barrel.',
    targetComponentId: 'piston_rod',
    interactionType: 'grab_and_seat',
    estimatedDurationSeconds: 60,
  },
  {
    id: 'step-3-install-cap',
    order: 3,
    title: 'Step 3 — Install End Cap',
    instruction: 'Pick up the threaded End Cap. Position it over the open barrel end and seat it into the locked position.',
    checkpoint: 'End cap aligned and seated flush with barrel retention face.',
    targetComponentId: 'end_cap',
    interactionType: 'align_and_lock',
    estimatedDurationSeconds: 60,
  },
  {
    id: 'step-4-inspect-dim',
    order: 4,
    title: 'Step 4 — Dimensional Inspection',
    instruction: 'Verify seating depth clearance at the inspection feature. Nominal dimension is 24.00 mm (Tolerance ±0.10 mm, range: 23.90 – 24.10 mm). Enter simulated measurement.',
    checkpoint: 'Seating depth dimension measured within ±0.10 mm specification.',
    targetComponentId: 'inspection_port',
    interactionType: 'measure',
    inspectionRule: DEFAULT_CYLINDER_INSPECTION_RULE,
    estimatedDurationSeconds: 45,
  },
  {
    id: 'step-5-score-report',
    order: 5,
    title: 'Step 5 — Training Report & Evaluation',
    instruction: 'Review your assembly score, dimensional verification status, and training summary.',
    checkpoint: 'Training session evaluation completed.',
    targetComponentId: 'barrel',
    interactionType: 'review',
    estimatedDurationSeconds: 30,
  },
];

export class TrainingEngine {
  private steps: InstructionStep[] = [];
  private state: TrainingSessionState;
  private inspectionEngine: InspectionEngine;

  constructor(customSteps?: InstructionStep[], inspectionEngine?: InspectionEngine) {
    this.steps = customSteps ? [...customSteps] : JSON.parse(JSON.stringify(DEFAULT_INSTRUCTION_STEPS));
    this.inspectionEngine = inspectionEngine || new InspectionEngine();
    this.state = this.createInitialState();
  }

  private createInitialState(): TrainingSessionState {
    return {
      currentStepIndex: 0,
      completedStepIds: [],
      componentIdentified: {
        barrel: false,
        piston_rod: false,
        end_cap: false,
        seal_ring: false,
        inspection_port: false,
      },
      assembledComponents: new Set<ComponentId>(),
      measurementResult: null,
      startTime: Date.now(),
      endTime: null,
      isComplete: false,
    };
  }

  public getSteps(): readonly InstructionStep[] {
    return this.steps;
  }

  public setSteps(newSteps: InstructionStep[]): void {
    this.steps = [...newSteps].sort((a, b) => a.order - b.order);
  }

  public getState(): Readonly<TrainingSessionState> {
    return this.state;
  }

  public getCurrentStep(): InstructionStep | null {
    if (this.state.currentStepIndex >= 0 && this.state.currentStepIndex < this.steps.length) {
      return this.steps[this.state.currentStepIndex];
    }
    return null;
  }

  public identifyComponent(componentId: ComponentId): boolean {
    this.state.componentIdentified[componentId] = true;
    const currentStep = this.getCurrentStep();
    if (currentStep && currentStep.interactionType === 'identify') {
      // Check if all primary components (barrel, piston_rod, end_cap) are identified
      if (
        this.state.componentIdentified.barrel &&
        this.state.componentIdentified.piston_rod &&
        this.state.componentIdentified.end_cap
      ) {
        this.completeCurrentStep();
        return true;
      }
    }
    return false;
  }

  public assembleComponent(componentId: ComponentId): boolean {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return false;

    if (currentStep.targetComponentId === componentId) {
      this.state.assembledComponents.add(componentId);
      this.completeCurrentStep();
      return true;
    }
    return false;
  }

  public submitMeasurement(simulatedValue: string | number | null | undefined): InspectionResult {
    const currentStep = this.getCurrentStep();
    if (currentStep?.inspectionRule) {
      this.inspectionEngine.setRule(currentStep.inspectionRule);
    }
    const result = this.inspectionEngine.evaluate(simulatedValue);
    this.state.measurementResult = result;

    if (currentStep && currentStep.interactionType === 'measure') {
      // Complete step regardless of PASS/FAIL, but score reflects result!
      this.completeCurrentStep();
    }
    return result;
  }

  public completeCurrentStep(): boolean {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return false;

    if (!this.state.completedStepIds.includes(currentStep.id)) {
      this.state.completedStepIds.push(currentStep.id);
    }

    if (this.state.currentStepIndex < this.steps.length - 1) {
      this.state.currentStepIndex += 1;
    } else {
      this.state.isComplete = true;
      this.state.endTime = Date.now();
    }
    return true;
  }

  public calculateScore(): TrainingScore {
    const totalSteps = this.steps.length;
    const completedCount = this.state.completedStepIds.length;
    const passedCheckpoints: string[] = [];
    const failedCheckpoints: string[] = [];

    // 1. Step Completion Points: max 50 points proportional to completed steps
    const stepWeight = 50 / Math.max(totalSteps, 1);
    let stepCompletionPoints = 0;

    for (const step of this.steps) {
      if (this.state.completedStepIds.includes(step.id)) {
        stepCompletionPoints += stepWeight;
        passedCheckpoints.push(step.checkpoint);
      } else {
        failedCheckpoints.push(step.checkpoint);
      }
    }
    stepCompletionPoints = Math.round(stepCompletionPoints);

    // 2. Inspection Points: max 35 points
    let inspectionPoints = 0;
    const measResult = this.state.measurementResult;
    if (measResult) {
      if (measResult.isPassing) {
        inspectionPoints = 35;
      } else if (measResult.state === 'FAIL') {
        // Partial credit (10 pts) for attempting measurement, but penalized for tolerance breach
        inspectionPoints = 10;
      } else {
        // INVALID: 0 points
        inspectionPoints = 0;
      }
    }

    // 3. Time Efficiency Bonus: max 15 points
    const endTime = this.state.endTime || Date.now();
    const durationSeconds = Math.max(1, Math.round((endTime - this.state.startTime) / 1000));
    const targetDurationSeconds = this.steps.reduce((acc, s) => acc + s.estimatedDurationSeconds, 0);

    let timeBonusPoints = 0;
    if (completedCount >= totalSteps - 1) {
      if (durationSeconds <= targetDurationSeconds) {
        timeBonusPoints = 15;
      } else if (durationSeconds <= targetDurationSeconds * 1.5) {
        timeBonusPoints = 10;
      } else {
        timeBonusPoints = 5;
      }
    }

    const totalScore = Math.min(100, stepCompletionPoints + inspectionPoints + timeBonusPoints);
    const overallPassed = totalScore >= 70 && (measResult?.isPassing ?? false);

    return {
      totalScore,
      stepCompletionPoints,
      inspectionPoints,
      timeBonusPoints,
      completedStepCount: completedCount,
      totalStepCount: totalSteps,
      passedCheckpoints,
      failedCheckpoints,
      inspectionResult: measResult,
      overallPassed,
      durationSeconds,
    };
  }

  public reset(): void {
    this.state = this.createInitialState();
    this.inspectionEngine.clearHistory();
  }
}
