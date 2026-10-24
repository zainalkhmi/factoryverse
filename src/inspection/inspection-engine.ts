/**
 * FactoryVerse Expert XR - Inspection Engine
 * Reusable dimensional and quality verification module.
 * Designed for simulated industrial training procedures.
 */

export type InspectionState = 'NOT_CHECKED' | 'PASS' | 'FAIL' | 'INVALID';

export interface InspectionRule {
  readonly id: string;
  readonly parameterName: string;
  readonly nominalValue: number;
  readonly tolerance: number;
  readonly unit: string;
  readonly minAcceptable: number;
  readonly maxAcceptable: number;
  readonly description: string;
}

export interface InspectionResult {
  readonly ruleId: string;
  readonly parameterName: string;
  readonly state: InspectionState;
  readonly measuredValue: number | null;
  readonly rawInput: string;
  readonly nominalValue: number;
  readonly deviation: number | null;
  readonly message: string;
  readonly timestamp: number;
  readonly isPassing: boolean;
}

export const DEFAULT_CYLINDER_INSPECTION_RULE: InspectionRule = {
  id: 'cyl-seat-dim-01',
  parameterName: 'Seating Depth Clearance',
  nominalValue: 24.00,
  tolerance: 0.10,
  unit: 'mm',
  minAcceptable: 23.90,
  maxAcceptable: 24.10,
  description: 'Nominal 24.00 mm with bilateral tolerance ±0.10 mm (Acceptable range: 23.90 mm – 24.10 mm).',
};

export class InspectionEngine {
  private currentRule: InspectionRule;
  private history: InspectionResult[] = [];

  constructor(rule: InspectionRule = DEFAULT_CYLINDER_INSPECTION_RULE) {
    this.currentRule = rule;
  }

  public getRule(): InspectionRule {
    return this.currentRule;
  }

  public setRule(rule: InspectionRule): void {
    this.currentRule = rule;
  }

  public evaluate(rawInput: string | number | null | undefined): InspectionResult {
    const timestamp = Date.now();

    // 1. Missing or empty validation
    if (rawInput === null || rawInput === undefined) {
      const result: InspectionResult = {
        ruleId: this.currentRule.id,
        parameterName: this.currentRule.parameterName,
        state: 'INVALID',
        measuredValue: null,
        rawInput: '',
        nominalValue: this.currentRule.nominalValue,
        deviation: null,
        message: 'No measurement value entered. Simulated input required.',
        timestamp,
        isPassing: false,
      };
      this.history.push(result);
      return result;
    }

    const trimmed = typeof rawInput === 'string' ? rawInput.trim() : String(rawInput);
    if (trimmed === '') {
      const result: InspectionResult = {
        ruleId: this.currentRule.id,
        parameterName: this.currentRule.parameterName,
        state: 'INVALID',
        measuredValue: null,
        rawInput: trimmed,
        nominalValue: this.currentRule.nominalValue,
        deviation: null,
        message: 'Empty measurement entry. Please enter a simulated reading.',
        timestamp,
        isPassing: false,
      };
      this.history.push(result);
      return result;
    }

    // 2. Numeric parse validation
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      const result: InspectionResult = {
        ruleId: this.currentRule.id,
        parameterName: this.currentRule.parameterName,
        state: 'INVALID',
        measuredValue: null,
        rawInput: trimmed,
        nominalValue: this.currentRule.nominalValue,
        deviation: null,
        message: `Invalid numeric value "${trimmed}". Must be a valid number in ${this.currentRule.unit}.`,
        timestamp,
        isPassing: false,
      };
      this.history.push(result);
      return result;
    }

    // 3. Round to 4 decimal places for floating-point tolerance safety
    const normalizedValue = Math.round(parsed * 10000) / 10000;
    const deviation = Math.round((normalizedValue - this.currentRule.nominalValue) * 10000) / 10000;

    // 4. Inclusive tolerance range check
    // 23.90 <= normalizedValue <= 24.10
    const min = Math.round(this.currentRule.minAcceptable * 10000) / 10000;
    const max = Math.round(this.currentRule.maxAcceptable * 10000) / 10000;

    const isPassing = normalizedValue >= min && normalizedValue <= max;
    const state: InspectionState = isPassing ? 'PASS' : 'FAIL';

    let message: string;
    if (isPassing) {
      message = `PASS: Measured ${normalizedValue.toFixed(2)} ${this.currentRule.unit} is within tolerance [${min.toFixed(2)}, ${max.toFixed(2)}] ${this.currentRule.unit} (Deviation: ${deviation >= 0 ? '+' : ''}${deviation.toFixed(2)} ${this.currentRule.unit}).`;
    } else if (normalizedValue < min) {
      const underBy = Math.round((min - normalizedValue) * 10000) / 10000;
      message = `FAIL: Measured ${normalizedValue.toFixed(2)} ${this.currentRule.unit} is BELOW minimum tolerance (${min.toFixed(2)} ${this.currentRule.unit}) by ${underBy.toFixed(2)} ${this.currentRule.unit}.`;
    } else {
      const overBy = Math.round((normalizedValue - max) * 10000) / 10000;
      message = `FAIL: Measured ${normalizedValue.toFixed(2)} ${this.currentRule.unit} EXCEEDS maximum tolerance (${max.toFixed(2)} ${this.currentRule.unit}) by ${overBy.toFixed(2)} ${this.currentRule.unit}.`;
    }

    const result: InspectionResult = {
      ruleId: this.currentRule.id,
      parameterName: this.currentRule.parameterName,
      state,
      measuredValue: normalizedValue,
      rawInput: trimmed,
      nominalValue: this.currentRule.nominalValue,
      deviation,
      message,
      timestamp,
      isPassing,
    };

    this.history.push(result);
    return result;
  }

  public getHistory(): readonly InspectionResult[] {
    return this.history;
  }

  public getLatestResult(): InspectionResult | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  public clearHistory(): void {
    this.history = [];
  }
}
