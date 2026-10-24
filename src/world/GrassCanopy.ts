import * as THREE from 'three';
import type {VegetationInteraction} from './VegetationInteraction';

type GrassCanopyOptions = {
  mobile: boolean;
  /** Final, regular indexed PlaneGeometry: row 0 is z = -depth / 2. Borrowed, never disposed here. */
  terrain: THREE.BufferGeometry;
  width: number;
  depth: number;
  segments: number;
  /** Signed clearance in metres; negative values forbid growth. Sampled once at terrain vertices. */
  habitat: (x: number, z: number) => number;
  interaction:VegetationInteraction;
};

export type GrassCanopy = {
  /** Positions are generated in world coordinates; attach under an identity world transform. */
  mesh: THREE.InstancedMesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  update: (elapsed: number, carPosition: THREE.Vector3) => void;
  setLowDetail: (enabled: boolean) => void;
  dispose: () => void;
};

const CELL_SIZE = .75;
const BLADES_PER_CELL = 32;

/** A fixed-budget, moving GPU window over stable world cells. No placement-matrix updates or world scans. */
export function createGrassCanopy({ mobile, terrain, width, depth, segments, habitat, interaction }: GrassCanopyOptions): GrassCanopy {
  if (!Number.isFinite(width) || !Number.isFinite(depth) || width <= 0 || depth <= 0 || !Number.isInteger(segments) || segments < 1) {
    throw new RangeError('GrassCanopy requires positive terrain dimensions and an integer segment count.');
  }
  const position = terrain.getAttribute('position');
  const side = segments + 1;
  if (!position || position.itemSize < 3 || position.count !== side * side) {
    throw new Error('GrassCanopy terrain must contain a complete regular PlaneGeometry vertex grid.');
  }
  // PlaneGeometry uses the anti-diagonal: (00, 01, 10), then (01, 11, 10).
  const index = terrain.getIndex();
  if (!index || index.count !== segments * segments * 6 || index.getX(0) !== 0 || index.getX(1) !== side || index.getX(2) !== 1) {
    throw new Error('GrassCanopy requires the standard indexed PlaneGeometry triangle layout.');
  }

  const heightsAndClearance = new Float32Array(side * side * 2);
  const spacing = new THREE.Vector2(width / segments, depth / segments);
  let minHeight = Infinity, maxHeight = -Infinity;
  for (let row = 0; row < side; row++) for (let column = 0; column < side; column++) {
    const i = row * side + column;
    const x = position.getX(i), z = position.getZ(i), y = position.getY(i);
    const expectedX = column * spacing.x - width / 2, expectedZ = row * spacing.y - depth / 2;
    if (!Number.isFinite(y) || Math.abs(x - expectedX) > .001 || Math.abs(z - expectedZ) > .001) {
      throw new Error('GrassCanopy terrain must be an untransformed regular world grid with finite heights.');
    }
    const clearance = habitat(x, z);
    if (!Number.isFinite(clearance)) throw new Error('GrassCanopy habitat must return a finite signed clearance.');
    heightsAndClearance[i * 2] = y;
    heightsAndClearance[i * 2 + 1] = clearance;
    minHeight = Math.min(minHeight, y);
    maxHeight = Math.max(maxHeight, y);
  }
  const field = new THREE.DataTexture(heightsAndClearance, side, side, THREE.RGFormat, THREE.FloatType);
  field.name = 'Grass canopy actual terrain height and signed habitat';
  field.internalFormat = 'RG32F';
  field.minFilter = field.magFilter = THREE.NearestFilter;
  field.wrapS = field.wrapT = THREE.ClampToEdgeWrapping;
  field.generateMipmaps = false;
  field.flipY = false;
  field.unpackAlignment = 1;
  field.colorSpace = THREE.NoColorSpace;
  field.needsUpdate = true;

  // Each blade is one slender, tapered triangle; its footprint/orientation is generated from its world cell.
  const vertices = new Float32Array(BLADES_PER_CELL * 9);
  const normals = new Float32Array(vertices.length);
  const bladeIds = new Float32Array(BLADES_PER_CELL * 3);
  for (let blade = 0; blade < BLADES_PER_CELL; blade++) {
    vertices.set([-.5, 0, 0, .5, 0, 0, 0, 1, 0], blade * 9);
    normals.set([0, 0, 1, 0, 0, 1, 0, 0, 1], blade * 9);
    bladeIds.fill(blade, blade * 3, blade * 3 + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.name = 'Short tapered coastal grass blades';
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('aCanopyBlade', new THREE.BufferAttribute(bladeIds, 1));

  const cellsPerSide = mobile ? 48 : 64;
  const fullCount = cellsPerSide * cellsPerSide;
  const radius = (cellsPerSide / 2 - 2) * CELL_SIZE;
  const uniforms = {
    uCanopyField: { value: field },
    uCanopyTerrainSize: { value: new THREE.Vector2(width, depth) },
    uCanopyOriginCell: { value: new THREE.Vector2(-cellsPerSide / 2, -cellsPerSide / 2) },
    uCanopyCarXZ: { value: new THREE.Vector2() },
    uCanopyTime: { value: 0 },
    uCanopyHiddenPoint: { value: new THREE.Vector3(0, minHeight - .1, 0) },
  };
  const material = new THREE.MeshStandardMaterial({
    name: 'Lit dry coastal grass canopy',
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
    envMapIntensity: .4,
  });
  const declarations = /* glsl */`
    uniform highp sampler2D uCanopyField;
    uniform vec2 uCanopyTerrainSize, uCanopyOriginCell, uCanopyCarXZ;
    uniform float uCanopyTime;
    uniform vec3 uCanopyHiddenPoint;
    attribute float aCanopyBlade;
    varying vec3 vCanopyTint;
    const int CANOPY_SEGMENTS = ${segments};
    const int CANOPY_SIDE = ${cellsPerSide};
    const float CANOPY_CELL = ${CELL_SIZE.toFixed(2)};
    const float CANOPY_RADIUS = ${radius.toFixed(3)};

    // Integer arithmetic makes every random property independent of window origin and instance index.
    float canopyRandom(ivec2 cell, uint salt) {
      uint h = uint(cell.x) * 0x8da6b343u ^ uint(cell.y) * 0xd8163841u ^ salt;
      h ^= h >> 16u; h *= 0x7feb352du;
      h ^= h >> 15u; h *= 0x846ca68bu; h ^= h >> 16u;
      return float(h & 0x00ffffffu) * (1.0 / 16777216.0);
    }
    float canopyQuadHeight(vec4 h, vec2 f) {
      return f.x + f.y <= 1.0
        ? h.x * (1.0 - f.x - f.y) + h.y * f.x + h.z * f.y
        : h.w * (f.x + f.y - 1.0) + h.z * (1.0 - f.x) + h.y * (1.0 - f.y);
    }
    struct CanopySurface {
      float height; float clearance; float minClearance; float inside;
      vec2 slope; vec2 fraction; vec4 heights;
    };
    CanopySurface canopySurface(vec2 point) {
      vec2 grid = (point / uCanopyTerrainSize + .5) * float(CANOPY_SEGMENTS);
      float inside = step(0.0, grid.x) * step(0.0, grid.y)
        * step(grid.x, float(CANOPY_SEGMENTS)) * step(grid.y, float(CANOPY_SEGMENTS));
      ivec2 corner = ivec2(clamp(floor(grid), vec2(0.0), vec2(float(CANOPY_SEGMENTS - 1))));
      vec2 f = clamp(grid - vec2(corner), vec2(0.0), vec2(1.0));
      vec2 a = texelFetch(uCanopyField, corner, 0).rg;
      vec2 b = texelFetch(uCanopyField, corner + ivec2(1, 0), 0).rg;
      vec2 c = texelFetch(uCanopyField, corner + ivec2(0, 1), 0).rg;
      vec2 d = texelFetch(uCanopyField, corner + ivec2(1, 1), 0).rg;
      vec2 cellSize = uCanopyTerrainSize / float(CANOPY_SEGMENTS);
      bool first = f.x + f.y <= 1.0;
      vec2 slope = first ? vec2(b.x - a.x, c.x - a.x) / cellSize : vec2(d.x - c.x, d.x - b.x) / cellSize;
      vec4 heights = vec4(a.x, b.x, c.x, d.x);
      float clearance = canopyQuadHeight(vec4(a.y, b.y, c.y, d.y), f);
      float minimum = first ? min(a.y, min(b.y, c.y)) : min(d.y, min(b.y, c.y));
      return CanopySurface(canopyQuadHeight(heights, f), clearance, minimum, inside, slope, f, heights);
    }
  `;
  const prepareBlade = /* glsl */`
    #include <beginnormal_vertex>
    const int halfSide = CANOPY_SIDE / 2;
    const int halfCells = CANOPY_SIDE * halfSide;
    int group = gl_InstanceID / halfCells;
    int slot = gl_InstanceID % halfCells;
    int row = slot / halfSide;
    ivec2 origin = ivec2(uCanopyOriginCell);
    // The first half is always even WORLD parity, including after a one-cell recenter.
    int column = (slot % halfSide) * 2 + ((row + origin.x + origin.y + group) & 1);
    ivec2 worldCell = origin + ivec2(column, row);
    uint blade = uint(aCanopyBlade);
    uint salt = blade * 97u;
    vec2 cellRoot = (vec2(worldCell) + vec2(canopyRandom(worldCell, 1u), canopyRandom(worldCell, 2u))) * CANOPY_CELL;
    float rootAngle = canopyRandom(worldCell, salt + 7u) * 6.283185307;
    float rootSpread = sqrt(canopyRandom(worldCell, salt + 8u)) * .23;
    vec2 bladeRoot = cellRoot + vec2(cos(rootAngle), sin(rootAngle)) * rootSpread;
    CanopySurface surface = canopySurface(bladeRoot);
    vec3 groundNormal = normalize(vec3(-surface.slope.x, 1.0, -surface.slope.y));
    float guard = length(uCanopyTerrainSize / float(CANOPY_SEGMENTS)) * .5 + .32;
    float edgeFade = 1.0 - smoothstep(CANOPY_RADIUS - 4.5, CANOPY_RADIUS, distance(bladeRoot, uCanopyCarXZ));
    float canopyVisibility = surface.inside * step(0.0, surface.minClearance)
      * smoothstep(guard, guard + 1.25, surface.clearance)
      * smoothstep(.68, .88, groundNormal.y) * smoothstep(.4, 2.8, surface.height) * edgeFade;
    float bladeAngle = canopyRandom(worldCell, salt + 11u) * 6.283185307;
    vec2 bladeWidthAxis = vec2(cos(bladeAngle), sin(bladeAngle));
    float bladeWidth = .018 + canopyRandom(worldCell, salt + 12u) * .022;
    float stature = canopyRandom(worldCell, salt + 13u);
    float bladeHeight = stature < .85 ? .12 + stature * .24 : .38 + (stature - .85) * 1.5;
    float leanAngle = bladeAngle + .5 + canopyRandom(worldCell, salt + 14u) * 2.0;
    vec2 lean = vec2(cos(leanAngle), sin(leanAngle)) * (.045 + canopyRandom(worldCell, salt + 15u) * .15);
    float phase = canopyRandom(worldCell, salt + 16u) * 6.283185307;
    float gust = sin(uCanopyTime * 1.15 + float(worldCell.x) * .071 + float(worldCell.y) * .053 + phase);
    lean += vec2(.048, .023) * gust + vec2(.012, -.018) * sin(uCanopyTime * 2.3 + phase);
    vec3 canopyForce=coastPlantPressure(vec3(bladeRoot.x,surface.height,bladeRoot.y));
    objectNormal = normalize(cross(vec3(bladeWidthAxis.x, dot(surface.slope, bladeWidthAxis), bladeWidthAxis.y), vec3(lean.x+canopyForce.x*bladeHeight*.95, bladeHeight*(1.0-canopyForce.y*.93), lean.y+canopyForce.z*bladeHeight*.95)));
    float dryness = canopyRandom(worldCell, salt + 19u);
    vCanopyTint = mix(vec3(.20, .176, .086), vec3(.37, .29, .14), dryness) * mix(.65, 1.06, position.y);
  `;
  const placeBlade = /* glsl */`
    #include <begin_vertex>
    vec2 footOffset = bladeWidthAxis * position.x * bladeWidth;
    vec2 footFraction = surface.fraction + footOffset / (uCanopyTerrainSize / float(CANOPY_SEGMENTS));
    // Reuse the root's four cached heights unless a base corner crosses into the next terrain quad.
    // The anti-diagonal decision is repeated here so even a 9mm base crossing a triangle edge stays grounded.
    bool sameQuad = all(greaterThanEqual(footFraction, vec2(0.0))) && all(lessThanEqual(footFraction, vec2(1.0)));
    float footHeight = sameQuad ? canopyQuadHeight(surface.heights, footFraction) : canopySurface(bladeRoot + footOffset).height;
    vec2 bladeXZ = bladeRoot + footOffset + lean * position.y * canopyVisibility;
    transformed = canopyVisibility > 0.0
      ? vec3(bladeXZ.x, footHeight + position.y * bladeHeight * canopyVisibility, bladeXZ.y)
      : uCanopyHiddenPoint;
    if(canopyVisibility>0.0)transformed=coastBendByPressure(transformed,position.y*bladeHeight*canopyVisibility,canopyForce);
  `;
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = declarations + shader.vertexShader
      .replace('#include <beginnormal_vertex>', prepareBlade)
      .replace('#include <begin_vertex>', placeBlade);
    interaction.setupShader(shader);
    shader.fragmentShader = 'varying vec3 vCanopyTint;\n' + shader.fragmentShader.replace(
      '#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vCanopyTint;',
    );
  };
  material.customProgramCacheKey = () => `coast-grass-canopy-v2-${cellsPerSide}-${segments}`;

  // Three initializes these matrices to identity once. They remain immutable throughout the lifetime.
  const mesh = new THREE.InstancedMesh(geometry, material, fullCount);
  mesh.name = 'World anchored dry grass canopy';
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.frustumCulled = false;
  mesh.boundingBox = new THREE.Box3(new THREE.Vector3(-width / 2 - 1, minHeight - .1, -depth / 2 - 1), new THREE.Vector3(width / 2 + 1, maxHeight + .9, depth / 2 + 1));
  mesh.boundingSphere = mesh.boundingBox.getBoundingSphere(new THREE.Sphere());
  const diagnostics = {
    cellsPerSide, fullCount, cellSize: CELL_SIZE, bladesPerCell: BLADES_PER_CELL,
    triangles: fullCount * BLADES_PER_CELL, lowTriangles: fullCount * BLADES_PER_CELL / 2,
    vertexInvocations: fullCount * BLADES_PER_CELL * 3,
    fieldFormat: 'RG32F', fieldBytes: heightsAndClearance.byteLength,
    instanceBytes: mesh.instanceMatrix.array.byteLength,
    radius, clearanceGuard: spacing.length() / 2 + .32,
    originCell: uniforms.uCanopyOriginCell.value, lowDetail: false,
  };
  mesh.userData.grassCanopy = diagnostics;
  let disposed = false;
  return {
    mesh,
    update(elapsed, carPosition) {
      if (disposed || !Number.isFinite(elapsed) || !Number.isFinite(carPosition.x) || !Number.isFinite(carPosition.z)) return;
      uniforms.uCanopyTime.value = elapsed;
      uniforms.uCanopyCarXZ.value.set(carPosition.x, carPosition.z);
      uniforms.uCanopyOriginCell.value.set(Math.floor(carPosition.x / CELL_SIZE) - cellsPerSide / 2, Math.floor(carPosition.z / CELL_SIZE) - cellsPerSide / 2);
    },
    setLowDetail(enabled) {
      if (disposed) return;
      diagnostics.lowDetail = enabled;
      mesh.count = enabled ? fullCount / 2 : fullCount;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      mesh.removeFromParent();
      mesh.dispose();
      geometry.dispose();
      material.dispose();
      field.dispose();
    },
  };
}
