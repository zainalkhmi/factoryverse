import { describe, it, expect, beforeEach } from 'vitest';
import {
  StepCheckService,
  PRESET_STEP_CHECK_TEMPLATES,
  type StepCheckTemplate,
} from './step-check-service';

describe('StepCheckService (Vuforia Step Check Parity)', () => {
  let service: StepCheckService;

  beforeEach(() => {
    service = new StepCheckService();
  });

  it('initializes with default industrial presets for hydraulic cylinder', () => {
    const templates = service.getTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(4);

    const rodTemplate = service.getTemplateById('TEMPL-ROD-01');
    expect(rodTemplate).toBeDefined();
    expect(rodTemplate?.label).toBe('PASS_ROD_SEATED');
    expect(rodTemplate?.mask.width).toBeGreaterThan(0.1);
    expect(rodTemplate?.mask.height).toBeGreaterThan(0.1);

    const capTemplate = service.getTemplateById('TEMPL-CAP-02');
    expect(capTemplate).toBeDefined();
    expect(capTemplate?.label).toBe('PASS_CAP_ENGAGED');
  });

  describe('Simulated State Evaluation', () => {
    it('evaluates PASS condition returning NORMAL status and label', () => {
      const evalResult = service.evaluateSimulatedState('TEMPL-ROD-01', 'PASS');
      expect(evalResult.status).toBe('NORMAL');
      expect(evalResult.isPassing).toBe(true);
      expect(evalResult.label).toBe('PASS_ROD_SEATED');
      expect(evalResult.confidence).toBeGreaterThanOrEqual(0.85);
      expect(evalResult.message).toContain('NORMAL');
    });

    it('evaluates DEFECT_UNSEATED condition returning UNDECIDABLE status', () => {
      const evalResult = service.evaluateSimulatedState('TEMPL-ROD-01', 'DEFECT_UNSEATED');
      expect(evalResult.status).toBe('UNDECIDABLE');
      expect(evalResult.isPassing).toBe(false);
      expect(evalResult.confidence).toBeLessThan(0.82); // Below threshold
      expect(evalResult.message).toContain('UNDECIDABLE');
    });

    it('evaluates OFF_TARGET condition returning NOT_VISIBLE status', () => {
      const evalResult = service.evaluateSimulatedState('TEMPL-ROD-01', 'OFF_TARGET');
      expect(evalResult.status).toBe('NOT_VISIBLE');
      expect(evalResult.isPassing).toBe(false);
      expect(evalResult.guidance.direction).toBe('CENTER_FRAME');
      expect(evalResult.message).toContain('NOT_VISIBLE');
    });

    it('throws error when evaluating unknown template ID', () => {
      expect(() => {
        service.evaluateSimulatedState('UNKNOWN_TEMPLATE_XYZ', 'PASS');
      }).toThrowError(/not found/i);
    });
  });

  describe('Viewpoint Guidance & Cone Calculation', () => {
    it('guides user to MOVE_CLOSER when device is too far from datum', () => {
      const evalResult = service.evaluateSimulatedState('TEMPL-ROD-01', 'PASS', {
        distanceMeters: 0.90, // Optimal is 0.45m
        pitchDegrees: -15,
        yawDegrees: 0,
      });

      expect(evalResult.guidance.direction).toBe('MOVE_CLOSER');
      expect(evalResult.guidance.distanceDeltaMeters).toBeGreaterThan(0.15);
      expect(evalResult.guidance.message).toContain('Move device closer');
    });

    it('guides user to MOVE_BACK when device is too close to datum', () => {
      const evalResult = service.evaluateSimulatedState('TEMPL-ROD-01', 'PASS', {
        distanceMeters: 0.20, // Optimal is 0.45m
        pitchDegrees: -15,
        yawDegrees: 0,
      });

      expect(evalResult.guidance.direction).toBe('MOVE_BACK');
      expect(evalResult.guidance.message).toContain('Step back');
    });

    it('identifies OPTIMAL position when camera aligns with template capture pose', () => {
      const evalResult = service.evaluateSimulatedState('TEMPL-ROD-01', 'PASS', {
        distanceMeters: 0.45,
        pitchDegrees: -15,
        yawDegrees: 0,
      });

      expect(evalResult.guidance.direction).toBe('OPTIMAL');
      expect(evalResult.guidance.message).toContain('Optimal');
    });
  });

  describe('Pixel Buffer Client-Side Vision Evaluation', () => {
    const width = 100;
    const height = 100;

    it('returns NOT_VISIBLE when frame is completely dark (insufficient contrast)', () => {
      const darkBuffer = new Uint8ClampedArray(width * height * 4); // all zeros
      const result = service.evaluatePixelBuffer('TEMPL-ROD-01', darkBuffer, width, height);

      expect(result.status).toBe('NOT_VISIBLE');
      expect(result.isPassing).toBe(false);
      expect(result.message).toContain('NOT_VISIBLE');
    });

    it('evaluates pixels matching expected signature and returns NORMAL', () => {
      const buffer = new Uint8ClampedArray(width * height * 4);
      // Fill with bright gray (~0.8 luminance, ~204 RGB)
      for (let i = 0; i < buffer.length; i += 4) {
        buffer[i] = 210;     // R
        buffer[i + 1] = 210; // G
        buffer[i + 2] = 210; // B
        buffer[i + 3] = 255; // A
      }

      const result = service.evaluatePixelBuffer('TEMPL-ROD-01', buffer, width, height);
      expect(result.status).toBe('NORMAL');
      expect(result.isPassing).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.82);
    });

    it('evaluates mismatched pixels and returns UNDECIDABLE', () => {
      const buffer = new Uint8ClampedArray(width * height * 4);
      // Fill with dim gray (~0.25 luminance, ~64 RGB) so it is visible but does not match 0.85
      for (let i = 0; i < buffer.length; i += 4) {
        buffer[i] = 65;
        buffer[i + 1] = 65;
        buffer[i + 2] = 65;
        buffer[i + 3] = 255;
      }

      const result = service.evaluatePixelBuffer('TEMPL-ROD-01', buffer, width, height);
      expect(result.status).toBe('UNDECIDABLE');
      expect(result.isPassing).toBe(false);
      expect(result.confidence).toBeLessThan(0.82);
    });
  });

  describe('History and Registry Management', () => {
    it('records evaluations and allows clearing history', () => {
      service.clearHistory();
      expect(service.getEvaluationHistory().length).toBe(0);

      service.evaluateSimulatedState('TEMPL-ROD-01', 'PASS');
      service.evaluateSimulatedState('TEMPL-CAP-02', 'DEFECT_UNSEATED');

      const history = service.getEvaluationHistory();
      expect(history.length).toBe(2);
      expect(service.getLatestEvaluation()?.status).toBe('UNDECIDABLE');

      service.clearHistory();
      expect(service.getEvaluationHistory().length).toBe(0);
      expect(service.getLatestEvaluation()).toBeNull();
    });

    it('registers custom templates dynamically', () => {
      const customTemplate: StepCheckTemplate = {
        id: 'TEMPL-CUSTOM-99',
        name: 'Custom Battery Terminal Check',
        procedureStepId: 'step-custom',
        targetComponentId: 'battery',
        label: 'PASS_TERMINAL_LOCKED',
        description: 'Verifies battery clamp bolt is seated.',
        mask: { x: 0.4, y: 0.4, width: 0.2, height: 0.2 },
        confidenceThreshold: 0.75,
        optimalViewpoint: { distanceMeters: 0.3, pitchDegrees: 0, yawDegrees: 0 },
        expectedSignature: [0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7],
      };

      service.registerTemplate(customTemplate);
      expect(service.getTemplateById('TEMPL-CUSTOM-99')).toBeDefined();
    });
  });
});
