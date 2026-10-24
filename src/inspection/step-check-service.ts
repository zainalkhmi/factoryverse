/**
 * FactoryVerse Expert XR - Step Check Service
 * On-device visual verification engine inspired by Vuforia Engine Step Check (Beta).
 * 
 * Verifies whether an assembly or inspection step has been performed correctly
 * using a single masked template image (no cloud upload or external AI required).
 * 
 * Returns standard Vuforia Step Check runtime statuses:
 * - NORMAL: Template is visible AND masked region matches expected pass state.
 * - UNDECIDABLE: Template is visible, but masked region does NOT match (e.g. gap, unseated, wrong orientation).
 * - NOT_VISIBLE: Template is not recognized in camera view or out of alignment.
 */

export type StepCheckStatus = 'NORMAL' | 'UNDECIDABLE' | 'NOT_VISIBLE';

export interface StepCheckMask {
  readonly x: number;      // Normalized 0..1 (from left)
  readonly y: number;      // Normalized 0..1 (from top)
  readonly width: number;  // Normalized 0..1 (fraction of image width)
  readonly height: number; // Normalized 0..1 (fraction of image height)
}

export interface OptimalViewpoint {
  readonly distanceMeters: number; // Optimal standoff distance (e.g. 0.45m)
  readonly pitchDegrees: number;   // Camera pitch angle relative to datum
  readonly yawDegrees: number;     // Camera yaw angle relative to datum
}

export interface StepCheckTemplate {
  readonly id: string;
  readonly name: string;
  readonly procedureStepId: string;
  readonly targetComponentId: string;
  readonly label: string;
  readonly description: string;
  readonly mask: StepCheckMask;
  readonly confidenceThreshold: number; // 0..1, e.g. 0.80
  readonly optimalViewpoint: OptimalViewpoint;
  readonly expectedSignature: number[]; // Feature vector: luminance/contrast/edge profile
}

export interface ViewpointGuidance {
  readonly direction: 'OPTIMAL' | 'MOVE_CLOSER' | 'MOVE_BACK' | 'PITCH_UP' | 'PITCH_DOWN' | 'CENTER_FRAME';
  readonly distanceDeltaMeters: number;
  readonly angleDeltaDegrees: number;
  readonly message: string;
}

export interface StepCheckEvaluation {
  readonly templateId: string;
  readonly templateName: string;
  readonly status: StepCheckStatus;
  readonly label: string;
  readonly confidence: number;
  readonly isPassing: boolean;
  readonly mask: StepCheckMask;
  readonly guidance: ViewpointGuidance;
  readonly message: string;
  readonly timestamp: number;
}

export const PRESET_STEP_CHECK_TEMPLATES: StepCheckTemplate[] = [
  {
    id: 'TEMPL-ROD-01',
    name: 'Piston Rod Full Insertion Check',
    procedureStepId: 'step-2-assemble-rod',
    targetComponentId: 'piston_rod',
    label: 'PASS_ROD_SEATED',
    description: 'Validates that the chrome-plated piston rod is fully inserted into the barrel and the collar makes flush contact with the internal stop.',
    mask: { x: 0.38, y: 0.40, width: 0.24, height: 0.20 },
    confidenceThreshold: 0.82,
    optimalViewpoint: { distanceMeters: 0.45, pitchDegrees: -15, yawDegrees: 0 },
    expectedSignature: [0.78, 0.82, 0.85, 0.76, 0.88, 0.90, 0.84, 0.79],
  },
  {
    id: 'TEMPL-CAP-02',
    name: 'Gland End Cap Thread Engagement Check',
    procedureStepId: 'step-3-install-cap',
    targetComponentId: 'end_cap',
    label: 'PASS_CAP_ENGAGED',
    description: 'Validates that the hexagonal gland cap is properly threaded without cross-threading and seated flush against the barrel spigot.',
    mask: { x: 0.42, y: 0.38, width: 0.20, height: 0.24 },
    confidenceThreshold: 0.85,
    optimalViewpoint: { distanceMeters: 0.40, pitchDegrees: -10, yawDegrees: 15 },
    expectedSignature: [0.65, 0.70, 0.72, 0.68, 0.74, 0.76, 0.71, 0.69],
  },
  {
    id: 'TEMPL-SEAL-03',
    name: 'U-Cup Hydraulic Seal Lip Orientation Check',
    procedureStepId: 'step-1-identify',
    targetComponentId: 'seal_ring',
    label: 'PASS_SEAL_ORIENTED',
    description: 'Validates that the polyurethane U-cup seal is seated in the gland groove with its pressure lip facing inward towards the hydraulic pressure chamber.',
    mask: { x: 0.45, y: 0.42, width: 0.16, height: 0.16 },
    confidenceThreshold: 0.80,
    optimalViewpoint: { distanceMeters: 0.35, pitchDegrees: -25, yawDegrees: 0 },
    expectedSignature: [0.55, 0.58, 0.60, 0.54, 0.62, 0.63, 0.59, 0.56],
  },
  {
    id: 'TEMPL-PORT-04',
    name: 'High-Pressure Test Port Plug Sealing Check',
    procedureStepId: 'step-4-inspect-dim',
    targetComponentId: 'inspection_port',
    label: 'PASS_PORT_SEALED',
    description: 'Validates that the SAE-6 test port plug is torqued with its nitrile O-ring compressed and no thread gap visible.',
    mask: { x: 0.46, y: 0.44, width: 0.14, height: 0.14 },
    confidenceThreshold: 0.84,
    optimalViewpoint: { distanceMeters: 0.30, pitchDegrees: -30, yawDegrees: -10 },
    expectedSignature: [0.60, 0.64, 0.66, 0.62, 0.68, 0.70, 0.65, 0.63],
  },
];

export class StepCheckService {
  private templates: Map<string, StepCheckTemplate> = new Map();
  private evaluationHistory: StepCheckEvaluation[] = [];

  constructor(initialTemplates: StepCheckTemplate[] = PRESET_STEP_CHECK_TEMPLATES) {
    for (const t of initialTemplates) {
      this.templates.set(t.id, t);
    }
  }

  public getTemplates(): StepCheckTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplateById(id: string): StepCheckTemplate | undefined {
    return this.templates.get(id);
  }

  public registerTemplate(template: StepCheckTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Evaluates simulated state for automated tests, demonstrations, and offline verification.
   */
  public evaluateSimulatedState(
    templateId: string,
    simulatedState: 'PASS' | 'DEFECT_UNSEATED' | 'OFF_TARGET' | 'INCORRECT_PART',
    currentPose?: { distanceMeters: number; pitchDegrees: number; yawDegrees: number }
  ): StepCheckEvaluation {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`StepCheck template '${templateId}' not found in registry.`);
    }

    const timestamp = Date.now();
    const guidance = this.calculateGuidance(template.optimalViewpoint, currentPose);

    if (simulatedState === 'OFF_TARGET') {
      const evaluation: StepCheckEvaluation = {
        templateId: template.id,
        templateName: template.name,
        status: 'NOT_VISIBLE',
        label: 'NOT_OBSERVED',
        confidence: 0.12,
        isPassing: false,
        mask: template.mask,
        guidance: {
          direction: 'CENTER_FRAME',
          distanceDeltaMeters: 0,
          angleDeltaDegrees: 0,
          message: 'Template appearance not recognized in camera view. Re-align camera to inspection datum.',
        },
        message: 'NOT_VISIBLE: Inspection target not recognized in camera view.',
        timestamp,
      };
      this.evaluationHistory.push(evaluation);
      return evaluation;
    }

    if (simulatedState === 'DEFECT_UNSEATED' || simulatedState === 'INCORRECT_PART') {
      const confidence = 0.44; // Target recognized, but ROI failed
      const evaluation: StepCheckEvaluation = {
        templateId: template.id,
        templateName: template.name,
        status: 'UNDECIDABLE',
        label: 'FAIL_DISCREPANCY_DETECTED',
        confidence,
        isPassing: false,
        mask: template.mask,
        guidance,
        message: `UNDECIDABLE: Target assembly recognized, but masked region does NOT match expected pass state (Confidence: ${(confidence * 100).toFixed(1)}% < ${(template.confidenceThreshold * 100).toFixed(0)}%). Check part seating or alignment.`,
        timestamp,
      };
      this.evaluationHistory.push(evaluation);
      return evaluation;
    }

    // PASS state
    const confidence = 0.94;
    const evaluation: StepCheckEvaluation = {
      templateId: template.id,
      templateName: template.name,
      status: 'NORMAL',
      label: template.label,
      confidence,
      isPassing: true,
      mask: template.mask,
      guidance,
      message: `NORMAL: Step validated successfully! Masked region matches expected state (${template.label}) with ${(confidence * 100).toFixed(1)}% confidence.`,
      timestamp,
    };
    this.evaluationHistory.push(evaluation);
    return evaluation;
  }

  /**
   * Computes client-side computer vision validation on live pixel buffer (ImageData).
   * Runs directly in browser without cloud upload.
   */
  public evaluatePixelBuffer(
    templateId: string,
    pixelData: Uint8ClampedArray,
    width: number,
    height: number,
    currentPose?: { distanceMeters: number; pitchDegrees: number; yawDegrees: number }
  ): StepCheckEvaluation {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`StepCheck template '${templateId}' not found.`);
    }

    const timestamp = Date.now();
    const guidance = this.calculateGuidance(template.optimalViewpoint, currentPose);

    // 1. Check if camera feed is valid and has sufficient contrast
    let totalLuminance = 0;
    const sampleStep = 8;
    let sampledCount = 0;

    for (let i = 0; i < pixelData.length; i += 4 * sampleStep) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      totalLuminance += lum;
      sampledCount++;
    }

    const avgLuminance = sampledCount > 0 ? totalLuminance / sampledCount : 0;

    // If completely dark or blank (<0.05 or >0.98), target is not visible
    if (avgLuminance < 0.05 || avgLuminance > 0.98) {
      const evaluation: StepCheckEvaluation = {
        templateId: template.id,
        templateName: template.name,
        status: 'NOT_VISIBLE',
        label: 'NOT_OBSERVED',
        confidence: 0.05,
        isPassing: false,
        mask: template.mask,
        guidance: {
          direction: 'CENTER_FRAME',
          distanceDeltaMeters: 0,
          angleDeltaDegrees: 0,
          message: 'Lighting inadequate or target not in view. Re-align camera to inspection datum.',
        },
        message: 'NOT_VISIBLE: Insufficient optical contrast to recognize template.',
        timestamp,
      };
      this.evaluationHistory.push(evaluation);
      return evaluation;
    }

    // 2. Extract masked ROI pixels
    const mask = template.mask;
    const roiX = Math.floor(mask.x * width);
    const roiY = Math.floor(mask.y * height);
    const roiW = Math.max(1, Math.floor(mask.width * width));
    const roiH = Math.max(1, Math.floor(mask.height * height));

    // Sample 8 sub-blocks within the ROI to produce candidate signature
    const signature: number[] = new Array(8).fill(0);
    const blockH = Math.floor(roiH / 8);

    for (let b = 0; b < 8; b++) {
      let blockSum = 0;
      let blockSamples = 0;
      const startY = roiY + b * blockH;
      const endY = Math.min(height, startY + blockH);

      for (let y = startY; y < endY; y += 2) {
        for (let x = roiX; x < roiX + roiW; x += 2) {
          const idx = (y * width + x) * 4;
          if (idx + 2 < pixelData.length) {
            const r = pixelData[idx];
            const g = pixelData[idx + 1];
            const bVal = pixelData[idx + 2];
            blockSum += (0.299 * r + 0.587 * g + 0.114 * bVal) / 255;
            blockSamples++;
          }
        }
      }
      signature[b] = blockSamples > 0 ? blockSum / blockSamples : 0;
    }

    // 3. Compute correlation/similarity against expected template signature
    let diffSum = 0;
    for (let k = 0; k < 8; k++) {
      const exp = template.expectedSignature[k] ?? 0.7;
      const act = signature[k];
      diffSum += Math.abs(exp - act);
    }
    const meanDiff = diffSum / 8;
    const rawConfidence = Math.max(0, Math.min(1, 1 - meanDiff * 1.5));
    const confidence = Math.round(rawConfidence * 1000) / 1000;

    const isPassing = confidence >= template.confidenceThreshold;
    const status: StepCheckStatus = isPassing ? 'NORMAL' : 'UNDECIDABLE';

    const evaluation: StepCheckEvaluation = {
      templateId: template.id,
      templateName: template.name,
      status,
      label: isPassing ? template.label : 'UNDECIDABLE_MISMATCH',
      confidence,
      isPassing,
      mask: template.mask,
      guidance,
      message: isPassing
        ? `NORMAL: Step validated (${template.label}). Match confidence ${(confidence * 100).toFixed(1)}% >= ${(template.confidenceThreshold * 100).toFixed(0)}%.`
        : `UNDECIDABLE: Masked validation area failed to match expected pass criteria (Confidence: ${(confidence * 100).toFixed(1)}% < ${(template.confidenceThreshold * 100).toFixed(0)}%).`,
      timestamp,
    };

    this.evaluationHistory.push(evaluation);
    return evaluation;
  }

  /**
   * Calculates viewpoint guidance (cone & distance recommendations).
   */
  public calculateGuidance(optimal: OptimalViewpoint, current?: { distanceMeters: number; pitchDegrees: number; yawDegrees: number }): ViewpointGuidance {
    if (!current) {
      return {
        direction: 'OPTIMAL',
        distanceDeltaMeters: 0,
        angleDeltaDegrees: 0,
        message: `Hold device steady at ~${optimal.distanceMeters.toFixed(2)}m from inspection area.`,
      };
    }

    const distDelta = Math.round((current.distanceMeters - optimal.distanceMeters) * 100) / 100;
    const angleDelta = Math.round(
      Math.sqrt(
        Math.pow(current.pitchDegrees - optimal.pitchDegrees, 2) +
        Math.pow(current.yawDegrees - optimal.yawDegrees, 2)
      ) * 10
    ) / 10;

    if (distDelta > 0.15) {
      return {
        direction: 'MOVE_CLOSER',
        distanceDeltaMeters: distDelta,
        angleDeltaDegrees: angleDelta,
        message: `Move device closer by ${(distDelta * 100).toFixed(0)} cm (optimal: ${optimal.distanceMeters.toFixed(2)}m).`,
      };
    }

    if (distDelta < -0.15) {
      return {
        direction: 'MOVE_BACK',
        distanceDeltaMeters: distDelta,
        angleDeltaDegrees: angleDelta,
        message: `Step back by ${Math.abs(distDelta * 100).toFixed(0)} cm (optimal: ${optimal.distanceMeters.toFixed(2)}m).`,
      };
    }

    if (angleDelta > 15) {
      return {
        direction: current.pitchDegrees < optimal.pitchDegrees ? 'PITCH_UP' : 'PITCH_DOWN',
        distanceDeltaMeters: distDelta,
        angleDeltaDegrees: angleDelta,
        message: `Adjust viewpoint angle to match template capture pose (tilt ${current.pitchDegrees < optimal.pitchDegrees ? 'up' : 'down'}).`,
      };
    }

    return {
      direction: 'OPTIMAL',
      distanceDeltaMeters: distDelta,
      angleDeltaDegrees: angleDelta,
      message: 'Optimal viewpoint achieved. Viewfinder reticle locked.',
    };
  }

  public getEvaluationHistory(): readonly StepCheckEvaluation[] {
    return this.evaluationHistory;
  }

  public getLatestEvaluation(): StepCheckEvaluation | null {
    return this.evaluationHistory.length > 0 ? this.evaluationHistory[this.evaluationHistory.length - 1] : null;
  }

  public clearHistory(): void {
    this.evaluationHistory = [];
  }
}

export const stepCheckService = new StepCheckService();
