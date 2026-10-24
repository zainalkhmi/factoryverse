/**
 * Unit tests for TrainingEngine
 * Verifies the full training workflow: LEARN → ASSEMBLE → MEASURE → PASS/FAIL → SCORE
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TrainingEngine } from './training-engine';

describe('TrainingEngine - 5-Step Workflow & Scoring', () => {
  let engine: TrainingEngine;

  beforeEach(() => {
    engine = new TrainingEngine();
  });

  it('starts at Step 1 (Identify components)', () => {
    const current = engine.getCurrentStep();
    expect(current).not.toBeNull();
    expect(current?.order).toBe(1);
    expect(current?.interactionType).toBe('identify');
  });

  it('advances from Step 1 to Step 2 only after identifying all primary parts', () => {
    // Partial identification
    engine.identifyComponent('barrel');
    expect(engine.getCurrentStep()?.order).toBe(1);

    engine.identifyComponent('piston_rod');
    expect(engine.getCurrentStep()?.order).toBe(1);

    // Complete identification
    const advanced = engine.identifyComponent('end_cap');
    expect(advanced).toBe(true);
    expect(engine.getCurrentStep()?.order).toBe(2);
    expect(engine.getCurrentStep()?.targetComponentId).toBe('piston_rod');
  });

  it('progresses through assemble steps (rod, end cap) sequentially', () => {
    // Complete Step 1
    engine.identifyComponent('barrel');
    engine.identifyComponent('piston_rod');
    engine.identifyComponent('end_cap');

    // Step 2: assemble piston rod
    expect(engine.getCurrentStep()?.order).toBe(2);
    // Incorrect part should be rejected
    expect(engine.assembleComponent('end_cap')).toBe(false);
    expect(engine.getCurrentStep()?.order).toBe(2);

    // Correct part
    expect(engine.assembleComponent('piston_rod')).toBe(true);
    expect(engine.getCurrentStep()?.order).toBe(3);

    // Step 3: assemble end cap
    expect(engine.assembleComponent('end_cap')).toBe(true);
    expect(engine.getCurrentStep()?.order).toBe(4);
    expect(engine.getCurrentStep()?.interactionType).toBe('measure');
  });

  it('evaluates PASS measurement (24.02 mm) and awards high training score', () => {
    // Fast forward to Step 4
    engine.identifyComponent('barrel');
    engine.identifyComponent('piston_rod');
    engine.identifyComponent('end_cap');
    engine.assembleComponent('piston_rod');
    engine.assembleComponent('end_cap');

    // Submit valid PASS measurement
    const evalResult = engine.submitMeasurement('24.02');
    expect(evalResult.state).toBe('PASS');
    expect(evalResult.isPassing).toBe(true);
    expect(engine.getCurrentStep()?.order).toBe(5);

    const score = engine.calculateScore();
    expect(score.completedStepCount).toBe(4);
    expect(score.stepCompletionPoints).toBeGreaterThanOrEqual(40);
    expect(score.inspectionPoints).toBe(35);
    expect(score.overallPassed).toBe(true);
    expect(score.totalScore).toBeGreaterThanOrEqual(80);
  });

  it('penalizes FAIL measurement (23.50 mm) in score calculation', () => {
    engine.identifyComponent('barrel');
    engine.identifyComponent('piston_rod');
    engine.identifyComponent('end_cap');
    engine.assembleComponent('piston_rod');
    engine.assembleComponent('end_cap');

    // Submit out-of-tolerance FAIL measurement
    const evalResult = engine.submitMeasurement('23.50');
    expect(evalResult.state).toBe('FAIL');
    expect(evalResult.isPassing).toBe(false);

    const score = engine.calculateScore();
    expect(score.inspectionPoints).toBe(10); // Partial attempt credit only
    expect(score.overallPassed).toBe(false);
  });

  it('resets session back to step 1 and clears history', () => {
    engine.identifyComponent('barrel');
    engine.identifyComponent('piston_rod');
    engine.identifyComponent('end_cap');
    engine.assembleComponent('piston_rod');

    expect(engine.getCurrentStep()?.order).toBe(3);

    engine.reset();
    expect(engine.getCurrentStep()?.order).toBe(1);
    expect(engine.getState().assembledComponents.size).toBe(0);
    expect(engine.getState().completedStepIds.length).toBe(0);
  });
});
