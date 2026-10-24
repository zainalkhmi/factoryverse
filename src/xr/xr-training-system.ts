/**
 * FactoryVerse Expert XR - XR Training & Spatial UI System
 * Wires Spatial UIKitML panels to TrainingEngine and InspectionEngine in VR.
 */

import {
  createSystem,
  UIKitMLAsset,
  VisibilityState,
} from '@iwsdk/core';
import { TrainingEngine } from '../training/training-engine.js';
import { storageRepository } from '../storage/storage-repository.js';
import type { AssemblySystem } from './assembly-system.js';

export class XRTrainingSystem extends createSystem({}) {
  private trainingEngine!: TrainingEngine;
  private assemblySystem: AssemblySystem | null = null;

  public setDependencies(engine: TrainingEngine, assemblySys?: AssemblySystem): void {
    this.trainingEngine = engine;
    if (assemblySys) this.assemblySystem = assemblySys;
  }

  init(): void {
    const trainingPanel = this.world.getSceneObject<UIKitMLAsset>('training-panel');
    const inspectionPanel = this.world.getSceneObject<UIKitMLAsset>('inspection-panel');

    // UI elements on training panel
    const titleEl = trainingPanel?.getElementById('panel-step-title');
    const descEl = trainingPanel?.getElementById('panel-step-desc');
    const checkpointEl = trainingPanel?.getElementById('panel-checkpoint-text');

    const nextBtn = trainingPanel?.getElementById('next-step-btn');
    const prevBtn = trainingPanel?.getElementById('prev-step-btn');
    const resetBtn = trainingPanel?.getElementById('reset-workstation-btn');

    // Inspection buttons
    const passBtn1 = inspectionPanel?.getElementById('vr-btn-pass-2402');
    const failBtn1 = inspectionPanel?.getElementById('vr-btn-fail-2418');
    const passBtn2 = inspectionPanel?.getElementById('vr-btn-pass-2395');
    const feedbackEl = inspectionPanel?.getElementById('vr-inspection-feedback');

    const updateDisplay = () => {
      if (!this.trainingEngine) return;
      const step = this.trainingEngine.getCurrentStep();
      if (!step) return;

      titleEl?.setProperties({ text: step.title });
      descEl?.setProperties({ text: step.instruction });
      checkpointEl?.setProperties({ text: step.checkpoint });
    };

    const handleNext = () => {
      this.trainingEngine?.completeCurrentStep();
      updateDisplay();
    };

    const handlePrev = () => {
      const state = this.trainingEngine?.getState();
      if (state && state.currentStepIndex > 0) {
        // decrement step
        (this.trainingEngine as any).state.currentStepIndex -= 1;
        updateDisplay();
      }
    };

    const handleReset = () => {
      this.trainingEngine?.reset();
      this.assemblySystem?.resetParts();
      updateDisplay();
      feedbackEl?.setProperties({ text: 'Ready for measurement. Select simulated reading below:' });
    };

    nextBtn?.addEventListener('click', handleNext);
    prevBtn?.addEventListener('click', handlePrev);
    resetBtn?.addEventListener('click', handleReset);

    // Measurement click handlers
    const handleMeasure = (val: string) => {
      if (!this.trainingEngine) return;
      const result = this.trainingEngine.submitMeasurement(val);
      feedbackEl?.setProperties({
        text: result.message,
        color: result.isPassing ? '#4ade80' : '#f87171',
      });

      // Save training session to repository if completed
      if (this.trainingEngine.getState().isComplete) {
        const score = this.trainingEngine.calculateScore();
        storageRepository.saveTrainingSession({
          id: `sess-vr-${Date.now()}`,
          procedureId: 'proc-hyd-cyl-01',
          procedureTitle: 'Hydraulic Cylinder Assembly and Inspection',
          procedureCode: 'SOP-HYD-042',
          revisionNumber: 1,
          operatorId: 'OP-VR-GUEST',
          operatorName: 'Meta Quest Operator',
          startedAt: new Date(Date.now() - score.durationSeconds * 1000).toISOString(),
          completedAt: new Date().toISOString(),
          status: 'completed',
          overallPassed: score.overallPassed,
          totalScore: score.totalScore,
          durationSeconds: score.durationSeconds,
          inspectionResult: result,
          failedCheckpoints: score.failedCheckpoints,
          stepResults: [],
        });
      }
      updateDisplay();
    };

    passBtn1?.addEventListener('click', () => handleMeasure('24.02'));
    failBtn1?.addEventListener('click', () => handleMeasure('24.18'));
    passBtn2?.addEventListener('click', () => handleMeasure('23.95'));

    // Handle session visibility state (blur / pause)
    this.cleanupFuncs.push(
      () => nextBtn?.removeEventListener('click', handleNext),
      () => prevBtn?.removeEventListener('click', handlePrev),
      () => resetBtn?.removeEventListener('click', handleReset),
      this.world.visibilityState.subscribe((state) => {
        if (state === VisibilityState.VisibleBlurred) {
          // Pause simulation
        }
      }),
    );

    updateDisplay();
  }
}
