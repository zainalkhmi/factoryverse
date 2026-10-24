/**
 * Unit tests for InspectionEngine
 * Verifies compliance with Meta VR Start 2026 requirements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InspectionEngine, DEFAULT_CYLINDER_INSPECTION_RULE } from './inspection-engine';

describe('InspectionEngine - FactoryVerse Quality Check', () => {
  let engine: InspectionEngine;

  beforeEach(() => {
    engine = new InspectionEngine(DEFAULT_CYLINDER_INSPECTION_RULE);
  });

  it('evaluates nominal value (24.00 mm) as PASS with 0.00 deviation', () => {
    const result = engine.evaluate(24.00);
    expect(result.state).toBe('PASS');
    expect(result.isPassing).toBe(true);
    expect(result.measuredValue).toBe(24.00);
    expect(result.deviation).toBe(0.00);
    expect(result.message).toContain('PASS');
  });

  it('evaluates lower tolerance boundary (23.90 mm) as PASS', () => {
    const result = engine.evaluate('23.90');
    expect(result.state).toBe('PASS');
    expect(result.isPassing).toBe(true);
    expect(result.measuredValue).toBe(23.90);
    expect(result.deviation).toBe(-0.10);
  });

  it('evaluates upper tolerance boundary (24.10 mm) as PASS', () => {
    const result = engine.evaluate('24.10');
    expect(result.state).toBe('PASS');
    expect(result.isPassing).toBe(true);
    expect(result.measuredValue).toBe(24.10);
    expect(result.deviation).toBe(0.10);
  });

  it('evaluates value below lower tolerance (23.89 mm) as FAIL', () => {
    const result = engine.evaluate(23.89);
    expect(result.state).toBe('FAIL');
    expect(result.isPassing).toBe(false);
    expect(result.measuredValue).toBe(23.89);
    expect(result.deviation).toBe(-0.11);
    expect(result.message).toContain('BELOW minimum tolerance');
  });

  it('evaluates value above upper tolerance (24.11 mm) as FAIL', () => {
    const result = engine.evaluate(24.11);
    expect(result.state).toBe('FAIL');
    expect(result.isPassing).toBe(false);
    expect(result.measuredValue).toBe(24.11);
    expect(result.deviation).toBe(0.11);
    expect(result.message).toContain('EXCEEDS maximum tolerance');
  });

  it('rejects empty string input as INVALID (never PASS)', () => {
    const result = engine.evaluate('');
    expect(result.state).toBe('INVALID');
    expect(result.isPassing).toBe(false);
    expect(result.measuredValue).toBeNull();
    expect(result.message).toContain('Empty measurement');
  });

  it('rejects null or undefined input as INVALID (never PASS)', () => {
    const resultNull = engine.evaluate(null);
    expect(resultNull.state).toBe('INVALID');
    expect(resultNull.isPassing).toBe(false);

    const resultUndefined = engine.evaluate(undefined);
    expect(resultUndefined.state).toBe('INVALID');
    expect(resultUndefined.isPassing).toBe(false);
  });

  it('rejects non-numeric string input as INVALID', () => {
    const result = engine.evaluate('abc mm');
    expect(result.state).toBe('INVALID');
    expect(result.isPassing).toBe(false);
    expect(result.measuredValue).toBeNull();
    expect(result.message).toContain('Invalid numeric value');
  });

  it('tracks session history of evaluations', () => {
    engine.evaluate(24.00);
    engine.evaluate(23.50);
    engine.evaluate(24.05);

    const history = engine.getHistory();
    expect(history.length).toBe(3);
    expect(history[0].state).toBe('PASS');
    expect(history[1].state).toBe('FAIL');
    expect(history[2].state).toBe('PASS');
  });
});
