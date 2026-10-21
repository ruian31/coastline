import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export interface Driver {
  root: THREE.Group;
  head: THREE.Group;
  update: (steer: number, dt: number) => void;
  dispose: () => void;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
type Profile = readonly [y: number, width: number, depth: number, forward: number][];

/** An elliptical ring loft keeps shoulders, jaw and fabric continuous. */
function loft(profile: Profile, segments = 20, sculptFace = false) {
  const vertices: number[] = [], colors: number[] = [], indices: number[] = [];
  for (let row = 0; row < profile.length; row++) {
    const [y, width, depth, forward] = profile[row];
    for (let col = 0; col <= segments; col++) {
      const angle = col / segments * Math.PI * 2;
      const x = Math.cos(angle) * width;
      let z = Math.sin(angle) * depth + forward;
      if (sculptFace) {
        // A restrained nose bridge and cheek planes, without a toy face.
        const front = Math.pow(Math.max(0, Math.sin(angle)), 20);
        z += front * .025 * Math.exp(-(((y + .025) / .025) ** 2));
      }
      vertices.push(x, y, z);
      const shade = .96 + .04 * Math.cos(angle * 4);
      colors.push(shade, shade, shade);
      if (row < profile.length - 1 && col < segments) {
        const a = row * (segments + 1) + col, b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}

/** Continuous taper follows a bend instead of stacking visible primitive joints. */
function limb(points: THREE.Vector3[], radii: number[], ellipse = 1, segments = 10, rings = 10,capEnds=false) {
  const curve = new THREE.CatmullRomCurve3(points), frame = curve.computeFrenetFrames(rings, false);
  const vertices: number[] = [], colors: number[] = [], indices: number[] = [];
  for (let row = 0; row <= rings; row++) {
    const t = row / rings, center = curve.getPointAt(t);
    const r = t * (radii.length - 1), lo = Math.floor(r);
    const radius = THREE.MathUtils.lerp(radii[lo], radii[Math.min(lo + 1, radii.length - 1)], r - lo);
    for (let col = 0; col <= segments; col++) {
      const a = col / segments * Math.PI * 2;
      const p = center.clone().addScaledVector(frame.normals[row], Math.cos(a) * radius).addScaledVector(frame.binormals[row], Math.sin(a) * radius * ellipse);
      vertices.push(p.x, p.y, p.z);
      const shade = .95 + .05 * Math.cos(a * 3 + row * .3);
      colors.push(shade, shade, shade);
      if (row < rings && col < segments) {
        const start = row * (segments + 1) + col, next = start + segments + 1;
        indices.push(start, start + 1, next, next, start + 1, next + 1);
      }
    }
  }
  if(capEnds){
    for(const end of[0,1]){
      const point=curve.getPointAt(end),center=vertices.length/3;vertices.push(point.x,point.y,point.z);colors.push(1,1,1);
      const row=end*rings*(segments+1);for(let col=0;col<segments;col++)if(end)indices.push(center,row+col,row+col+1);else indices.push(center,row+col+1,row+col);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}

function addGeometry(list: THREE.BufferGeometry[], g: THREE.BufferGeometry, at = v(0, 0, 0), scale = v(1, 1, 1), tint = 1) {
  g.scale(scale.x, scale.y, scale.z); g.translate(at.x, at.y, at.z);
  let result = g;
  if (g.index) { result = g.toNonIndexed(); g.dispose(); }
  if (!result.getAttribute('color')) {
    const colors = new Float32Array(result.getAttribute('position').count * 3).fill(tint);
    result.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  } else if (tint !== 1) {
    const colors = result.getAttribute('color');
    for (let i = 0; i < colors.count; i++) colors.setXYZ(i, colors.getX(i) * tint, colors.getY(i) * tint, colors.getZ(i) * tint);
  }
  result.deleteAttribute('uv');
  list.push(result);
}

function merge(list: THREE.BufferGeometry[], material: THREE.MeshStandardMaterial, parent: THREE.Group, name: string) {
  const geo = mergeGeometries(list, false)!; list.forEach(g => g.dispose());
  const mesh = new THREE.Mesh(geo, material); mesh.name = name; mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
  return mesh;
}

/** A lower cockpit sleeve rig keeps arms connected beyond the frame without hiding the console. */
export function createDriver(variant = 0): Driver {
  const root = new THREE.Group(); root.name = 'driver'; root.position.x = -.425;
  const head = new THREE.Group(); head.name = 'driver-head'; root.add(head);
  const armPivot = new THREE.Group(); armPivot.name = 'driver-arms'; armPivot.position.set(0, 1.015, .17); root.add(armPivot);
  const mat = (color: string, roughness: number) => new THREE.MeshStandardMaterial({ color, roughness, vertexColors: true });
  const linen = mat(variant === 1 ? '#d6d4c6' : '#cec2aa', .95);
  const trousers = mat(variant === 2 ? '#2e363b' : '#4f5554', .96);
  const skin = mat('#b6805d', .85), hair = mat('#302c26', .97);
  const shirtParts: THREE.BufferGeometry[] = [], cuffs:THREE.BufferGeometry[]=[],trouserParts: THREE.BufferGeometry[] = [], arms: THREE.BufferGeometry[] = [], face: THREE.BufferGeometry[] = [], hairParts: THREE.BufferGeometry[] = [];
  const drop = variant === 2 ? -.035 : 0;

  // Relaxed seated posture: tapered waist, chest and rounded shoulders.
  addGeometry(shirtParts, loft([
    [.59, .115, .075, -.46], [.64, .14, .095, -.46], [.77, .135, .095, -.46],
    [.9, .159, .104, -.465], [1.01, .179, .095, -.46], [1.07, .17, .079, -.45],
    [1.105, .127, .06, -.435], [1.12, .064, .05, -.43],
  ]), v(0, drop, 0));
  // Placket, rolled sleeve cuffs and collar catch soft highlights in rear-quarter views.
  addGeometry(shirtParts, limb([v(0, .67, -.359), v(0, .88, -.353), v(0, 1.075, -.365)], [.007, .007, .008], .55, 5, 5), v(0, drop, 0), v(1, 1, 1), .87);
  for (const side of [-1, 1]) {
    addGeometry(shirtParts, limb([v(side * .02, 1.12, -.38), v(side * .06, 1.085, -.366), v(side * .09, 1.07, -.371)], [.018, .022, .007], .23, 6, 4), v(0, drop, 0), v(1, 1, 1), 1.04);
    addGeometry(shirtParts,limb([v(side*.15,1.055,-.445),v(side*.195,.995,-.36),v(side*.213,.93,-.26)],[.073,.065,.054],.9,10,7),v(0,drop,0));
    addGeometry(shirtParts,limb([v(side*.209,.945,-.28),v(side*.214,.927,-.255)],[.057,.057],.95,10,2),v(0,drop,0),v(1,1,1),.86);
    addGeometry(cuffs,limb([v(side*.17,.72+drop,-.45),v(side*.19,.84+drop,-.33),v(side*.214,.935+drop,-.255)],[.075,.067,.057],.95,14,12),armPivot.position.clone().negate(),v(1,1,1),.9);
    // Upper arm exits its sleeve, bends through an elbow and tapers to the wrist.
    const elbow = v(side * .215, .875 + drop, -.15);
    const wrist = v(side * .13, 1.065, .145);
    const offset = armPivot.position.clone().negate();
    addGeometry(arms, limb([v(side * .213, .938 + drop, -.265), elbow, v(side * .177, .947, .015), wrist], [.045, .043, .035, .022], .88, 10, 10,true), offset);
    addGeometry(arms, limb([wrist, v(side * .135, 1.08, .165), v(side * .132, 1.079, .19)], [.021, .029, .013], .68, 10, 5), offset);
    // Fingers wrap the rim as one ridged contour; thumb crosses its inner edge.
    for (let i = 0; i < 3; i++) addGeometry(arms, limb([v(side * (.114 + i * .012), 1.082, .167), v(side * (.114 + i * .012), 1.063, .181), v(side * (.114 + i * .012), 1.056, .164)], [.007, .007, .004], .8, 5, 4), offset);
    addGeometry(arms, limb([v(side * .117, 1.07, .15), v(side * .105, 1.085, .154), v(side * .109, 1.093, .171)], [.011, .01, .005], .8, 6, 4), offset);

    // Bent knees and tapered shins follow the footwell rather than hanging vertically.
    addGeometry(trouserParts, limb([v(side * .087, .63 + drop, -.46), v(side * .1, .615 + drop, -.22), v(side * .12, .568, .035)], [.084, .079, .064], 1.03, 12, 8));
    addGeometry(trouserParts, limb([v(side * .12, .568, .035), v(side * .125, .43, .17), v(side * .125, .38, .30)], [.061, .048, .034], .88, 10, 7));
    addGeometry(trouserParts, limb([v(side * .125, .388, .26), v(side * .125, .38, .34), v(side * .125, .38, .43)], [.044, .047, .025], .6, 10, 6), v(0, 0, 0), v(1, 1, 1), .48);
  }

  const headCenter = v(0, 1.28 + drop, -.435);
  // Head has a jaw, cheekbone, temple and crown profile, with short swept hair.
  addGeometry(face, loft([[-.112, .026, .034, .022], [-.09, .05, .054, .012], [-.055, .068, .065, .007], [-.018, .075, .073, .002], [.025, .076, .071, 0], [.067, .064, .06, -.006], [.095, .042, .043, -.009], [.108, .003, .004, -.012]], 24, true), headCenter);
  addGeometry(face, loft([[-.165, .046, .044, 0], [-.11, .047, .043, .007], [-.072, .038, .039, .008]], 14), headCenter);
  for (const side of [-1, 1]) addGeometry(face, loft([[-.027, .008, .008, 0], [-.015, .014, .017, 0], [.012, .012, .013, 0], [.025, .004, .006, 0]], 10), headCenter.clone().add(v(side * .075, -.01, -.007)));
  addGeometry(hairParts, loft([[-.032, .072, .064, -.018], [.015, .079, .074, -.011], [.057, .071, .066, -.01], [.09, .051, .05, -.014], [.117, .015, .019, -.023], [.12, .001, .002, -.023]], 24), headCenter);
  // Hair silhouette clears the forehead; muted eyebrows indicate the forward gaze.
  for (const side of [-1, 1]) addGeometry(hairParts, limb([v(side * .019, 1.284 + drop, -.365), v(side * .035, 1.289 + drop, -.366), v(side * .049, 1.284 + drop, -.371)], [.003, .004, .002], .6, 5, 4));

  merge(shirtParts, linen, root, 'driver-linen-shirt');
  const cockpitSleeves=merge(cuffs,linen,armPivot,'driver-cockpit-sleeves');cockpitSleeves.visible=false;
  merge(trouserParts, trousers, root, 'driver-trousers');
  merge(arms, skin, armPivot, 'driver-forearms-and-hands');
  merge(face, skin, head, 'driver-face');
  merge(hairParts, hair, head, 'driver-hair');
  root.userData.diagnostics = { exteriorDraws:5,cockpitDraws:3,triangles:0 };
  root.traverse(obj => { if (obj instanceof THREE.Mesh) root.userData.diagnostics.triangles += obj.geometry.getAttribute('position').count / 3; });
  let steering = 0;
  return {
    root, head,
    update(steer, dt) {
      steering = THREE.MathUtils.damp(steering, THREE.MathUtils.clamp(steer, -1, 1), 8, Math.min(.1, dt));
      armPivot.rotation.z = steering * -.105;
      head.rotation.y = steering * .045;
    },
    dispose() {
      root.traverse(obj => { if (obj instanceof THREE.Mesh) obj.geometry.dispose(); });
      linen.dispose(); trousers.dispose(); skin.dispose(); hair.dispose(); root.removeFromParent();
    },
  };
}
