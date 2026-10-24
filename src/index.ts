/**
 * FactoryVerse Expert XR - Entry Point
 * Wires the official IWSDK World initialization, ECS systems, and FactoryVerse Studio.
 */

import './studio/styles/studio.css';
import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { AssemblySystem } from './xr/assembly-system.js';
import { XRTrainingSystem } from './xr/xr-training-system.js';
import { TrainingEngine } from './training/training-engine.js';
import { studioApp } from './studio/StudioApp.js';

// 1. Initialize Training Engine instance
const trainingEngine = new TrainingEngine();

// 2. Initialize IWSDK World
World.create(
  document.getElementById('scene-container') as HTMLDivElement,
  projectOptions,
).then((world) => {
  // Register IWSDK ECS Systems
  world.registerSystem(AssemblySystem);
  world.registerSystem(XRTrainingSystem);

  const assemblySys = world.getSystem(AssemblySystem);
  const xrTrainingSys = world.getSystem(XRTrainingSystem);

  if (assemblySys) {
    assemblySys.setTrainingEngine(trainingEngine);
  }

  if (xrTrainingSys) {
    xrTrainingSys.setDependencies(trainingEngine, assemblySys || undefined);
  }

  // 3. Connect Training Engine to Studio App
  studioApp.setXREngine(trainingEngine, assemblySys || undefined);
}).catch((err) => {
  console.warn('[IWSDK] Non-fatal runtime notice (Studio active):', err);
});

// 4. Mount FactoryVerse Studio Desktop Application
studioApp.mount();
