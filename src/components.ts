/**
 * FactoryVerse Expert XR - ECS Components
 * Declared in a system-free module and exported via defineComponents().
 */

import { createComponent, defineComponents, Types } from '@iwsdk/core';

export const AssemblyPart = createComponent('AssemblyPart', {
  partId: { type: Types.String, default: 'barrel' },
  isAssembled: { type: Types.Boolean, default: false },
  stepOrder: { type: Types.Int32, default: 1 },
});

export const AssemblySlot = createComponent('AssemblySlot', {
  targetPartId: { type: Types.String, default: 'barrel' },
  isOccupied: { type: Types.Boolean, default: false },
});

export const TrainingStation = createComponent('TrainingStation', {
  stationId: { type: Types.String, default: 'station-01' },
  activeStep: { type: Types.Int32, default: 1 },
});

export default defineComponents([AssemblyPart, AssemblySlot, TrainingStation]);
