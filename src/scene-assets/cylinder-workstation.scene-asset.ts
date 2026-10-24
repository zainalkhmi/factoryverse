/**
 * FactoryVerse Expert XR - Procedural Hydraulic Cylinder Workstation
 * High-fidelity, industrial procedural geometry created using Three.js inside IWSDK.
 * Features:
 * - Machined Cylinder Barrel with port bosses and flange
 * - Hard-Chrome Piston Rod & Piston Head assembly
 * - Polyurethane Hydraulic U-Cup Seal
 * - Threaded Gland End Cap with hex pattern
 * - Workstation Bench with partitioned parts tray
 * - Datum feature for 24.00 mm seating measurement
 */

import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  TorusGeometry,
} from '@iwsdk/core';

// Shared Materials (dark industrial aesthetic: graphite, brushed metal, steel, rubber, safety orange)
const steelMaterial = new MeshStandardMaterial({
  color: 0x4a5d6e,
  metalness: 0.85,
  roughness: 0.28,
  name: 'steel-barrel',
});

const chromeMaterial = new MeshStandardMaterial({
  color: 0xdae6ee,
  metalness: 0.95,
  roughness: 0.12,
  name: 'hard-chrome-rod',
});

const brassEndCapMaterial = new MeshStandardMaterial({
  color: 0xc89d42,
  metalness: 0.78,
  roughness: 0.32,
  name: 'brass-gland-cap',
});

const sealMaterial = new MeshStandardMaterial({
  color: 0x1e88e5, // Blue polyurethane industrial seal
  metalness: 0.1,
  roughness: 0.45,
  name: 'polyurethane-seal',
});

const benchMaterial = new MeshStandardMaterial({
  color: 0x182433,
  metalness: 0.3,
  roughness: 0.75,
  name: 'bench-composite',
});

const trayMaterial = new MeshStandardMaterial({
  color: 0x0f1822,
  metalness: 0.4,
  roughness: 0.6,
  name: 'tray-base',
});

const highlightOrangeMaterial = new MeshStandardMaterial({
  color: 0xff7a18,
  emissive: 0x331800,
  metalness: 0.5,
  roughness: 0.2,
  name: 'highlight-active',
});

export function createWorkstationBench(): Object3D {
  const bench = new Group();
  bench.name = 'WorkstationBench';

  // Table top: width 2.4m, depth 1.2m, thickness 0.08m at height 0.85m
  const topGeo = new BoxGeometry(2.4, 0.08, 1.2);
  const topMesh = new Mesh(topGeo, benchMaterial);
  topMesh.position.set(0, 0.85, 0);
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  bench.add(topMesh);

  // Bench legs (4 heavy square steel legs)
  const legGeo = new BoxGeometry(0.1, 0.85, 0.1);
  const legPositions: [number, number, number][] = [
    [-1.1, 0.425, -0.5],
    [1.1, 0.425, -0.5],
    [-1.1, 0.425, 0.5],
    [1.1, 0.425, 0.5],
  ];
  for (const pos of legPositions) {
    const leg = new Mesh(legGeo, benchMaterial);
    leg.position.set(...pos);
    leg.castShadow = true;
    leg.receiveShadow = true;
    bench.add(leg);
  }

  // Workstation rubber anti-static parts tray on the right
  const trayGeo = new BoxGeometry(0.9, 0.04, 0.5);
  const trayMesh = new Mesh(trayGeo, trayMaterial);
  trayMesh.position.set(0.6, 0.91, 0.1);
  trayMesh.receiveShadow = true;
  bench.add(trayMesh);

  // Tray divider walls
  const divXGeo = new BoxGeometry(0.015, 0.06, 0.46);
  const div1 = new Mesh(divXGeo, benchMaterial);
  div1.position.set(0.35, 0.93, 0.1);
  bench.add(div1);
  const div2 = new Mesh(divXGeo, benchMaterial);
  div2.position.set(0.65, 0.93, 0.1);
  bench.add(div2);

  // Assembly Fixture V-blocks on the left (holds the cylinder barrel in place)
  const vBlockGeo = new BoxGeometry(0.12, 0.15, 0.3);
  const vBlock1 = new Mesh(vBlockGeo, steelMaterial);
  vBlock1.position.set(-0.7, 0.965, 0.0);
  bench.add(vBlock1);
  const vBlock2 = new Mesh(vBlockGeo, steelMaterial);
  vBlock2.position.set(-0.2, 0.965, 0.0);
  bench.add(vBlock2);

  return bench;
}

export function createCylinderBarrel(): Object3D {
  const barrel = new Group();
  barrel.name = 'CylinderBarrel';

  // Main tubular body: length 0.7m, outer radius 0.075m, inner bore 0.06m
  const bodyGeo = new CylinderGeometry(0.075, 0.075, 0.7, 32);
  const bodyMesh = new Mesh(bodyGeo, steelMaterial);
  bodyMesh.rotation.z = Math.PI / 2;
  bodyMesh.position.set(0, 0, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  barrel.add(bodyMesh);

  // Base mounting clevis flange at rear (-X)
  const clevisGeo = new BoxGeometry(0.12, 0.16, 0.12);
  const clevisMesh = new Mesh(clevisGeo, steelMaterial);
  clevisMesh.position.set(-0.38, 0, 0);
  barrel.add(clevisMesh);

  // Pin eye bore through clevis
  const pinBoreGeo = new CylinderGeometry(0.025, 0.025, 0.14, 24);
  const pinMesh = new Mesh(pinBoreGeo, chromeMaterial);
  pinMesh.position.set(-0.38, 0, 0);
  barrel.add(pinMesh);

  // Hydraulic Port Bosses (SAE threaded ports on top)
  const portGeo = new CylinderGeometry(0.025, 0.025, 0.04, 16);
  const port1 = new Mesh(portGeo, steelMaterial);
  port1.position.set(-0.25, 0.09, 0);
  barrel.add(port1);

  const port2 = new Mesh(portGeo, steelMaterial);
  port2.position.set(0.25, 0.09, 0);
  barrel.add(port2);

  // Front retention collar flange (+X)
  const collarGeo = new CylinderGeometry(0.088, 0.088, 0.05, 32);
  const collarMesh = new Mesh(collarGeo, steelMaterial);
  collarMesh.rotation.z = Math.PI / 2;
  collarMesh.position.set(0.33, 0, 0);
  barrel.add(collarMesh);

  return barrel;
}

export function createPistonRod(): Object3D {
  const rodGroup = new Group();
  rodGroup.name = 'PistonRodAssembly';

  // Hard-chrome ground rod: length 0.65m, radius 0.032m
  const shaftGeo = new CylinderGeometry(0.032, 0.032, 0.65, 32);
  const shaftMesh = new Mesh(shaftGeo, chromeMaterial);
  shaftMesh.rotation.z = Math.PI / 2;
  shaftMesh.position.set(0, 0, 0);
  shaftMesh.castShadow = true;
  rodGroup.add(shaftMesh);

  // Piston head at inner end (-X): radius 0.059m (to fit in 0.06m bore), length 0.08m
  const pistonHeadGeo = new CylinderGeometry(0.059, 0.059, 0.08, 32);
  const pistonHeadMesh = new Mesh(pistonHeadGeo, steelMaterial);
  pistonHeadMesh.rotation.z = Math.PI / 2;
  pistonHeadMesh.position.set(-0.28, 0, 0);
  rodGroup.add(pistonHeadMesh);

  // Piston wear band / seal groove rings
  const ringGeo = new TorusGeometry(0.06, 0.004, 16, 32);
  const ring1 = new Mesh(ringGeo, sealMaterial);
  ring1.rotation.y = Math.PI / 2;
  ring1.position.set(-0.26, 0, 0);
  rodGroup.add(ring1);

  const ring2 = new Mesh(ringGeo, sealMaterial);
  ring2.rotation.y = Math.PI / 2;
  ring2.position.set(-0.30, 0, 0);
  rodGroup.add(ring2);

  // Rod eye / mounting clevis at outer end (+X)
  const eyeGeo = new CylinderGeometry(0.045, 0.045, 0.06, 24);
  const eyeMesh = new Mesh(eyeGeo, steelMaterial);
  eyeMesh.position.set(0.34, 0, 0);
  rodGroup.add(eyeMesh);

  return rodGroup;
}

export function createEndCap(): Object3D {
  const capGroup = new Group();
  capGroup.name = 'CylinderEndCap';

  // Outer hex gland flange: radius 0.088m, thickness 0.045m
  const flangeGeo = new CylinderGeometry(0.088, 0.088, 0.045, 6); // 6-sided hex
  const flangeMesh = new Mesh(flangeGeo, brassEndCapMaterial);
  flangeMesh.rotation.z = Math.PI / 2;
  flangeMesh.position.set(0, 0, 0);
  flangeMesh.castShadow = true;
  capGroup.add(flangeMesh);

  // Threaded insertion spigot that screws into barrel (-X): radius 0.062m, length 0.05m
  const threadGeo = new CylinderGeometry(0.062, 0.062, 0.05, 32);
  const threadMesh = new Mesh(threadGeo, steelMaterial);
  threadMesh.rotation.z = Math.PI / 2;
  threadMesh.position.set(-0.045, 0, 0);
  capGroup.add(threadMesh);

  // Center rod pass-through hole (visualized with dark bushing)
  const bushingGeo = new CylinderGeometry(0.033, 0.033, 0.095, 24);
  const bushingMesh = new Mesh(bushingGeo, chromeMaterial);
  bushingMesh.rotation.z = Math.PI / 2;
  bushingMesh.position.set(-0.02, 0, 0);
  capGroup.add(bushingMesh);

  return capGroup;
}

export function createSealRing(): Object3D {
  const seal = new Group();
  seal.name = 'SealRing';

  const torusGeo = new TorusGeometry(0.045, 0.007, 16, 32);
  const torusMesh = new Mesh(torusGeo, sealMaterial);
  torusMesh.rotation.y = Math.PI / 2;
  seal.add(torusMesh);

  return seal;
}

export function createInspectionFeature(): Object3D {
  const feature = new Group();
  feature.name = 'InspectionDatumFeature';

  // Precision caliper jaws datum indicator
  const datumGeo = new BoxGeometry(0.024, 0.08, 0.008);
  const datumMesh = new Mesh(datumGeo, highlightOrangeMaterial);
  datumMesh.position.set(0, 0, 0);
  feature.add(datumMesh);

  // Measurement guideline brackets
  const lineGeo = new BoxGeometry(0.024, 0.004, 0.024);
  const lineMesh = new Mesh(lineGeo, highlightOrangeMaterial);
  lineMesh.position.set(0, 0.04, 0);
  feature.add(lineMesh);

  return feature;
}

const beaconMaterial = new MeshStandardMaterial({
  color: 0x38bdf8,
  emissive: 0x0284c7,
  emissiveIntensity: 0.8,
  metalness: 0.2,
  roughness: 0.2,
  name: 'spatial-beacon-cyan',
});

const beaconRingMaterial = new MeshStandardMaterial({
  color: 0xf59e0b,
  emissive: 0xd97706,
  emissiveIntensity: 0.6,
  metalness: 0.3,
  roughness: 0.3,
  name: 'spatial-beacon-ring',
});

/**
 * Vuforia-Style Spatial Location Beacon / 3D Waypoint Pin
 * Inverted glowing cone with target halo ring that hovers over the active assembly part.
 */
export function createSpatialBeacon(): Object3D {
  const beaconGroup = new Group();
  beaconGroup.name = 'SpatialWaypointBeacon';

  // Inverted pointer cone pointing down: radiusTop 0.038m, radiusBottom 0.002m, height 0.08m
  const coneGeo = new CylinderGeometry(0.038, 0.002, 0.08, 16);
  const coneMesh = new Mesh(coneGeo, beaconMaterial);
  coneMesh.position.set(0, 0.05, 0);
  beaconGroup.add(coneMesh);

  // Outer target ring / halo hovering above cone
  const ringGeo = new TorusGeometry(0.06, 0.005, 12, 32);
  const ringMesh = new Mesh(ringGeo, beaconRingMaterial);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.set(0, 0.10, 0);
  beaconGroup.add(ringMesh);

  // Vertical laser guide beam from tip down to part
  const beamGeo = new CylinderGeometry(0.002, 0.002, 0.12, 8);
  const beamMesh = new Mesh(beamGeo, beaconMaterial);
  beamMesh.position.set(0, -0.05, 0);
  beaconGroup.add(beamMesh);

  return beaconGroup;
}

const guideWireframeMaterial = new MeshBasicMaterial({
  color: 0x38bdf8,
  wireframe: true,
  transparent: true,
  opacity: 0.55,
  name: 'cad-guide-wireframe',
});

const guideReticleMaterial = new MeshBasicMaterial({
  color: 0x38bdf8,
  wireframe: false,
  transparent: true,
  opacity: 0.8,
  name: 'cad-guide-reticle',
});

/**
 * Vuforia Engine Model Target "Guide View" Alignment Contour
 * A holographic wireframe overlay showing the target CAD seating pose
 * for optical alignment and tracking confidence verification.
 */
export function createModelTargetGuideView(): Object3D {
  const guideGroup = new Group();
  guideGroup.name = 'ModelTargetGuideView';

  // Barrel silhouette wireframe (aligned on cylinder fixture)
  const barrelWireGeo = new CylinderGeometry(0.088, 0.088, 0.58, 16);
  const barrelWire = new Mesh(barrelWireGeo, guideWireframeMaterial);
  barrelWire.name = 'GuideWireBarrel';
  barrelWire.rotation.z = Math.PI / 2;
  barrelWire.position.set(-0.45, 1.04, -1.1);
  guideGroup.add(barrelWire);

  // Piston Rod target seating outline
  const rodWireGeo = new CylinderGeometry(0.026, 0.026, 0.68, 16);
  const rodWire = new Mesh(rodWireGeo, guideWireframeMaterial);
  rodWire.name = 'GuideWireRod';
  rodWire.rotation.z = Math.PI / 2;
  rodWire.position.set(-0.35, 1.04, -1.1);
  guideGroup.add(rodWire);

  // Gland End Cap target seating outline
  const capWireGeo = new CylinderGeometry(0.092, 0.092, 0.05, 6);
  const capWire = new Mesh(capWireGeo, guideWireframeMaterial);
  capWire.name = 'GuideWireCap';
  capWire.rotation.z = Math.PI / 2;
  capWire.position.set(-0.08, 1.04, -1.1);
  guideGroup.add(capWire);

  // Optical Alignment Reticle Brackets (4 corners)
  const bracketGeo = new BoxGeometry(0.004, 0.06, 0.06);
  const bracketPositions: [number, number, number][] = [
    [-0.72, 1.25, -1.1],
    [-0.05, 1.25, -1.1],
    [-0.72, 0.85, -1.1],
    [-0.05, 0.85, -1.1],
  ];
  for (const pos of bracketPositions) {
    const bracket = new Mesh(bracketGeo, guideReticleMaterial);
    bracket.position.set(...pos);
    guideGroup.add(bracket);
  }

  return guideGroup;
}

