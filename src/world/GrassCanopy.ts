import * as THREE from 'three';
import type {VegetationInteraction} from './VegetationInteraction';
import {centerPlantAlphaCoverage} from './PlantTexture';

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
  usePhotographedClumps:(texture:THREE.Texture)=>void;
  useFineGrass:(texture:THREE.Texture,farTexture:THREE.Texture)=>void;
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
  const uvs=new Float32Array(BLADES_PER_CELL*6);
  for(let i=0;i<BLADES_PER_CELL;i++)uvs.set([0,1,1,1,.5,0],i*6);
  geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));

  const cellsPerSide = mobile ? 48 : 64;
  const fullCount = cellsPerSide * cellsPerSide;
  const radius = (cellsPerSide / 2 - 2) * CELL_SIZE;
  let fineGrass=false;
  const uniforms = {
    uCanopyField: { value: field },
    uCanopyFarMap: { value: null as THREE.Texture|null },
    uCanopyTerrainSize: { value: new THREE.Vector2(width, depth) },
    uCanopyOriginCell: { value: new THREE.Vector2(-cellsPerSide / 2, -cellsPerSide / 2) },
    uCanopyFarOriginCell: { value: new THREE.Vector2(-cellsPerSide / 2, -cellsPerSide / 2) },
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
    vec4 coastalGrassCrop(float glyph){
      if(glyph>2.5)return vec4(549.0,367.0,736.0,562.0);
      if(glyph>1.5)return vec4(284.0,412.0,474.0,553.0);
      if(glyph>.5)return vec4(51.0,427.0,193.0,557.0);
      return vec4(43.0,161.0,319.0,297.0);
    }
    uniform highp sampler2D uCanopyField;
    uniform vec2 uCanopyTerrainSize, uCanopyOriginCell, uCanopyFarOriginCell, uCanopyCarXZ;
    uniform float uCanopyTime;
    uniform vec3 uCanopyHiddenPoint;
    attribute float aCanopyBlade;
    varying vec3 vCanopyTint;
    varying float vCanopyCoverage;
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
    float canopyOffsetHeight(vec2 root,vec2 offset,CanopySurface surface){
      vec2 f=surface.fraction+offset/(uCanopyTerrainSize/float(CANOPY_SEGMENTS));
      bool cached=all(greaterThanEqual(f,vec2(0.0)))&&all(lessThanEqual(f,vec2(1.0)));
      return (cached?canopyQuadHeight(surface.heights,f):canopySurface(root+offset).height)-surface.height;
    }
    vec3 canopyPressedTip(vec3 offset,float height,vec3 force,float visibility,vec2 root,CanopySurface surface){
      vec3 bent=coastBendByPressure(offset*visibility,height*visibility,force);
      if(force.y>0.0&&visibility>0.0){
        float ground=canopyOffsetHeight(root,bent.xz,surface);
        bent.y=max(bent.y+ground*force.y,ground+.008*visibility);
      }
      return bent;
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
    uint sourceBlade=uint(aCanopyBlade);
    bool middleDistance=false;
    float canopyCellSize=CANOPY_CELL;
    // Each instance serves a world-cell pair in each band. The low prefix
    // keeps every cell: six near clumps and two middle-distance clumps.
    int member=int(sourceBlade)/16;
    uint blade = sourceBlade%16u+uint(group)*16u;
    #ifdef USE_MAP
      middleDistance=sourceBlade>=24u;
      if(middleDistance){
        origin=ivec2(uCanopyFarOriginCell);canopyCellSize*=2.0;
        member=int(sourceBlade-24u)/4;
        blade=(sourceBlade-24u)%4u/2u+uint(group)*2u;
      }else{
        member=int(sourceBlade)/12;
        blade=sourceBlade%12u/2u+uint(group)*6u;
      }
    #endif
    int column = (slot % halfSide) * 2 + ((row + origin.x + origin.y + member) & 1);
    ivec2 worldCell = origin + ivec2(column, row);
    uint salt = blade * 97u+(middleDistance?50000u:0u);
    vec2 bladeRoot=(vec2(worldCell)+vec2(canopyRandom(worldCell,salt+7u),canopyRandom(worldCell,salt+8u)))*canopyCellSize;
    CanopySurface surface = canopySurface(bladeRoot);
    vec3 groundNormal = normalize(vec3(-surface.slope.x, 1.0, -surface.slope.y));
    float guard = length(uCanopyTerrainSize / float(CANOPY_SEGMENTS)) * .5 + .32;
    float carDistance=distance(bladeRoot,uCanopyCarXZ);
    float nearFade=1.0-smoothstep(CANOPY_RADIUS-8.0,CANOPY_RADIUS,carDistance);
    float edgeFade=middleDistance
      ? smoothstep(CANOPY_RADIUS-9.0,CANOPY_RADIUS-3.0,carDistance)*(1.0-smoothstep(CANOPY_RADIUS*2.0-10.0,CANOPY_RADIUS*2.0,carDistance))
      : nearFade;
    float canopyVisibility = surface.inside * step(0.0, surface.minClearance)
      * smoothstep(guard, guard + 1.25, surface.clearance)
      * smoothstep(.68, .88, groundNormal.y) * smoothstep(.4, 2.8, surface.height);
    // World-stable density thinning spreads the boundary over eight metres;
    // do not shrink every opaque photographed leaf at the same cutoff radius.
    #ifdef USE_MAP
      canopyVisibility*=smoothstep(canopyRandom(worldCell,salt+25u),min(1.0,canopyRandom(worldCell,salt+25u)+.12),edgeFade);
    #else
      canopyVisibility*=edgeFade;
    #endif
    vCanopyCoverage=canopyVisibility;
    float bladeAngle = canopyRandom(worldCell, salt + 11u) * 6.283185307;
    vec2 bladeWidthAxis = vec2(cos(bladeAngle), sin(bladeAngle));
    float bladeWidth = .018 + canopyRandom(worldCell, salt + 12u) * .022;
    float stature = canopyRandom(worldCell, salt + 13u);
    float bladeHeight = stature < .85 ? .12 + stature * .24 : .38 + (stature - .85) * 1.5;
    #ifdef USE_MAP
      bladeHeight=(.15+stature*.22)*(middleDistance?1.3:1.0);
      float glyph=floor(canopyRandom(worldCell,salt+22u)*4.0);
      // Bounds of four connected photographed plants; avoid including a
      // neighbouring glyph's detached leaf in the same crop.
      vec4 crop=coastalGrassCrop(glyph);
      bladeWidth=clamp(bladeHeight*(crop.z-crop.x)/(crop.w-crop.y)*(.9+canopyRandom(worldCell,salt+12u)*.2),.18,.6);
      vMapUv=(mapTransform*vec3(mix(crop.xy,crop.zw,uv)/1024.0,1.0)).xy;
    #endif
    float leanAngle = bladeAngle + .5 + canopyRandom(worldCell, salt + 14u) * 2.0;
    vec2 lean = vec2(cos(leanAngle), sin(leanAngle)) * (.045 + canopyRandom(worldCell, salt + 15u) * .15);
    float phase = canopyRandom(worldCell, salt + 16u) * 6.283185307;
    float gust = sin(uCanopyTime * 1.15 + float(worldCell.x) * .071 + float(worldCell.y) * .053 + phase);
    lean += vec2(.048, .023) * gust + vec2(.012, -.018) * sin(uCanopyTime * 2.3 + phase);
    vec3 canopyForce=coastPlantPressure(vec3(bladeRoot.x,surface.height,bladeRoot.y));
    vec2 halfWidth=bladeWidthAxis*bladeWidth*.5;
    vec3 baseLeft=vec3(-halfWidth.x,canopyOffsetHeight(bladeRoot,-halfWidth,surface),-halfWidth.y);
    vec3 baseRight=vec3(halfWidth.x,canopyOffsetHeight(bladeRoot,halfWidth,surface),halfWidth.y);
    vec3 tipLeft=canopyPressedTip(vec3(lean.x,bladeHeight,lean.y),bladeHeight,canopyForce,canopyVisibility,bladeRoot,surface);
    #ifdef USE_MAP
      tipLeft=canopyPressedTip(vec3(lean.x-halfWidth.x,bladeHeight,lean.y-halfWidth.y),bladeHeight,canopyForce,canopyVisibility,bladeRoot,surface);
      vec3 tipRight=canopyPressedTip(vec3(lean.x+halfWidth.x,bladeHeight,lean.y+halfWidth.y),bladeHeight,canopyForce,canopyVisibility,bladeRoot,surface);
      // Each triangle receives the normal of its actual supported corners.
      objectNormal=normalize((int(sourceBlade)&1)==0?cross(baseRight-baseLeft,tipLeft-baseLeft):cross(tipRight-baseRight,tipLeft-baseRight));
      vec3 canopyTip=vec3(bladeRoot.x,surface.height,bladeRoot.y)+(position.x<0.0?tipLeft:tipRight);
    #else
      vec3 canopyTip=vec3(bladeRoot.x,surface.height,bladeRoot.y)+tipLeft;
      objectNormal=normalize(cross(baseRight-baseLeft,tipLeft-baseLeft));
    #endif
    float dryness = canopyRandom(worldCell, salt + 19u);
    vCanopyTint = mix(vec3(.20, .176, .086), vec3(.37, .29, .14), dryness) * mix(.65, 1.06, position.y);
  `;
  const placeBlade = /* glsl */`
    #include <begin_vertex>
    vec3 canopyFoot=vec3(bladeRoot.x,surface.height,bladeRoot.y)+(position.x<0.0?baseLeft:baseRight);
    transformed = canopyVisibility > 0.0
      ? (position.y>.5?canopyTip:canopyFoot)
      : uCanopyHiddenPoint;
  `;
  const fineDeclarations = `varying float vFineLeaf;varying vec2 vCanopyFarUv;\n`;
  const prepareFineLeaf = /* glsl */`
 #include <beginnormal_vertex>
 const int halfSide=CANOPY_SIDE/2;
 const int halfCells=CANOPY_SIDE*halfSide;
 int group=gl_InstanceID/halfCells,slot=gl_InstanceID%halfCells,row=slot/halfSide;
 uint sourceBlade=uint(aCanopyBlade);bool middleDistance=sourceBlade>=24u;
 int member=middleDistance?int(sourceBlade-24u)/4:int(sourceBlade)/12;
 float cellSize=middleDistance?1.2:.45;
 ivec2 origin=ivec2(middleDistance?uCanopyFarOriginCell:uCanopyOriginCell);
 int column=(slot%halfSide)*2+((row+origin.x+origin.y+member)&1);
 ivec2 worldCell=origin+ivec2(column,row);
 uint leaf=middleDistance?(sourceBlade-24u)%4u/2u+uint(group)*2u:sourceBlade%12u+uint(group)*12u;uint salt=leaf*97u+(middleDistance?50000u:0u);
 vec2 root=(vec2(worldCell)+vec2(canopyRandom(worldCell,salt+7u),canopyRandom(worldCell,salt+8u)))*cellSize;
 CanopySurface surface=canopySurface(root);
 vec3 groundNormal=normalize(vec3(-surface.slope.x,1.0,-surface.slope.y));
 float guard=length(uCanopyTerrainSize/float(CANOPY_SEGMENTS))*.5+.4;
 float nearRadius=float(CANOPY_SIDE/2-2)*.45,farRadius=float(CANOPY_SIDE/2-2)*1.2,d=distance(root,uCanopyCarXZ);
 // The short tuft remains under close leaf detail. Removing its inner
 // ring made one grass body vanish just as the independent leaves appeared.
 float edge=middleDistance?1.0-smoothstep(farRadius-8.0,farRadius,d):1.0-smoothstep(max(0.0,nearRadius-8.0),nearRadius,d);
 float canopyVisibility=surface.inside*step(0.0,surface.minClearance)*smoothstep(guard,guard+1.25,surface.clearance)*smoothstep(.68,.88,groundNormal.y)*smoothstep(.4,2.8,surface.height);
 // Distance changes pixel coverage only; a fixed world leaf keeps its height.
 float canopyShape=canopyVisibility;canopyVisibility*=edge;
 vCanopyCoverage=canopyVisibility;vFineLeaf=middleDistance?0.0:1.0;
 float angle=canopyRandom(worldCell,salt+11u)*6.283185307,c=cos(angle),s=sin(angle),stature=canopyRandom(worldCell,salt+13u),phase=canopyRandom(worldCell,salt+16u)*6.283185307;

 vec3 force=coastPlantPressure(vec3(root.x,surface.height,root.y));
 float gust=sin(uCanopyTime*1.15+float(worldCell.x)*.071+float(worldCell.y)*.053+phase);
 vec3 canopyPosition;
 if(!middleDistance){
  float height=.15+stature*.25,width=.01+canopyRandom(worldCell,salt+12u)*.015;vec2 halfWidth=vec2(c,s)*width*.5,lean=vec2(c,s)*(.02+canopyRandom(worldCell,salt+14u)*.10)+vec2(.04,.02)*gust;
  vec3 left=vec3(-halfWidth.x,canopyOffsetHeight(root,-halfWidth,surface),-halfWidth.y),right=vec3(halfWidth.x,canopyOffsetHeight(root,halfWidth,surface),halfWidth.y),tip=canopyPressedTip(vec3(lean.x,height,lean.y),height,force,canopyShape,root,surface);
  canopyPosition=vec3(root.x,surface.height,root.y)+(position.y>.5?tip:(position.x<0.0?left:right));objectNormal=normalize(cross(right-left,tip-left));
  vMapUv=vec2(mix(.77,.79,uv.x),mix(.2,.58,uv.y));
 }else{
  float height=.16+stature*.2,width=.55+canopyRandom(worldCell,salt+12u)*.4;vec2 halfWidth=vec2(c,s)*width*.5,lean=vec2(.035+.04*gust,.025*sin(uCanopyTime*1.8+phase));
  vec3 left=vec3(-halfWidth.x,canopyOffsetHeight(root,-halfWidth,surface),-halfWidth.y),right=vec3(halfWidth.x,canopyOffsetHeight(root,halfWidth,surface),halfWidth.y);
  vec3 topLeft=canopyPressedTip(vec3(lean.x-halfWidth.x,height,lean.y-halfWidth.y),height,force,canopyShape,root,surface),topRight=canopyPressedTip(vec3(lean.x+halfWidth.x,height,lean.y+halfWidth.y),height,force,canopyShape,root,surface);
  vec3 offset=position.y>.5?(position.x<0.0?topLeft:topRight):(position.x<0.0?left:right);canopyPosition=vec3(root.x,surface.height,root.y)+offset;
  objectNormal=normalize((int(sourceBlade)&1)==0?cross(right-left,topLeft-left):cross(topRight-right,topLeft-right));
  vCanopyFarUv=vec2(uv.x,1.0-uv.y);
 }
 float dry=canopyRandom(worldCell,salt+19u);vCanopyTint=middleDistance?mix(vec3(.21,.19,.10),vec3(.34,.28,.15),dry):mix(vec3(.21,.19,.10),vec3(.36,.29,.15),dry);if(!middleDistance)vCanopyTint*=mix(.65,1.0,position.y);
`;
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = declarations + (fineGrass?fineDeclarations:'') + shader.vertexShader
      .replace('#include <beginnormal_vertex>', fineGrass?prepareFineLeaf:prepareBlade)
      .replace('#include <begin_vertex>', fineGrass?'#include <begin_vertex>\ntransformed=canopyVisibility>0.0?canopyPosition:uCanopyHiddenPoint;':placeBlade);
    interaction.setupShader(shader);
    shader.fragmentShader = 'varying vec3 vCanopyTint;varying float vCanopyCoverage;\n' + shader.fragmentShader;
    if(fineGrass){
      shader.fragmentShader='uniform sampler2D uCanopyFarMap;'+fineDeclarations+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
        vec4 grassSample=vFineLeaf>.5?texture2D(map,vMapUv):texture2D(uCanopyFarMap,vCanopyFarUv);
        // The near leaf silhouette is actual geometry. Only the far card uses
        // alpha, with the existing procedural atlas's authored .46 cutoff.
        grassSample.a=vFineLeaf>.5?1.0:grassSample.a*.43/.46;
        diffuseColor*=grassSample;`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float grassValue=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
        diffuseColor.rgb=vFineLeaf>.5?vCanopyTint*(.7+clamp(grassValue*3.0,0.0,.5)):grassValue*vec3(1.5,1.3,.9);`);
    }else{
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',material.map
        ? '#include <color_fragment>\nfloat canopyPhotoLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));\ndiffuseColor.rgb=vCanopyTint*(.75+clamp(canopyPhotoLuma*4.0,0.0,.65));'
        : '#include <color_fragment>\ndiffuseColor.rgb *= vCanopyTint;');
    }
    if(material.map)shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',fineGrass?`
      // Single-sample mobile targets need coverage, rather than an alpha value
      // that crosses .43 and switches a whole blade on in one frame.
      #include <alphatest_fragment>
      float canopyThreshold=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);
      if(vCanopyCoverage<=canopyThreshold)discard;`:'diffuseColor.a*=vCanopyCoverage;\n#include <alphatest_fragment>');
  };
  const cacheKey=()=>`coast-grass-canopy-v6-${cellsPerSide}-${segments}-${fineGrass?'fine-leaves-continuous-body-v1':material.map?'clumps':'blades'}`;
  material.customProgramCacheKey=cacheKey;
  let centeredCoverage=false;
  function prepareCoverage(){
    material.alphaTest=.43;material.alphaToCoverage=true;
    if(!centeredCoverage){centerPlantAlphaCoverage(material);centeredCoverage=true;}
    // The coverage helper captures a key, whereas this material may select its
    // final asset mode later during loading. Preserve the live mode in the key.
    material.customProgramCacheKey=()=>cacheKey()+'-plant-centered-alpha-v1';
    material.needsUpdate=true;
  }

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
    originCell: uniforms.uCanopyOriginCell.value,farOriginCell:uniforms.uCanopyFarOriginCell.value,farCellSize:CELL_SIZE*2,farRadius:radius*2,
    lowDetail: false,photographed:false,fineLeaves:false,lowBladesPerCell:BLADES_PER_CELL/2,farBladesPerCell:0,lowFarBladesPerCell:0,
  };
  mesh.userData.grassCanopy = diagnostics;
  let disposed = false;
  return {
    mesh,
    update(elapsed, carPosition) {
      if (disposed || !Number.isFinite(elapsed) || !Number.isFinite(carPosition.x) || !Number.isFinite(carPosition.z)) return;
      uniforms.uCanopyTime.value = elapsed;
      uniforms.uCanopyCarXZ.value.set(carPosition.x, carPosition.z);
      uniforms.uCanopyOriginCell.value.set(Math.floor(carPosition.x / diagnostics.cellSize) - cellsPerSide / 2, Math.floor(carPosition.z / diagnostics.cellSize) - cellsPerSide / 2);
      uniforms.uCanopyFarOriginCell.value.set(Math.floor(carPosition.x / diagnostics.farCellSize) - cellsPerSide / 2, Math.floor(carPosition.z / diagnostics.farCellSize) - cellsPerSide / 2);
    },
    setLowDetail(enabled) {
      if (disposed) return;
      diagnostics.lowDetail = enabled;
      mesh.count = enabled ? fullCount / 2 : fullCount;
    },
    usePhotographedClumps(texture){
      if(disposed||material.map)return;
      // Sixteen full rectangles replace thirty-two tapered triangles without
      // changing triangle or vertex counts. The entire source plant survives.
      for(let clump=0;clump<BLADES_PER_CELL/2;clump++){
        vertices.set([-.5,0,0,.5,0,0,-.5,1,0,.5,0,0,.5,1,0,-.5,1,0],clump*18);
        uvs.set([0,1,1,1,0,0,1,1,1,0,0,0],clump*12);
      }
      geometry.getAttribute('position').needsUpdate=true;geometry.getAttribute('uv').needsUpdate=true;
      material.map=texture;material.alphaTest=.43;material.alphaToCoverage=true;
      diagnostics.photographed=true;diagnostics.bladesPerCell=12;diagnostics.lowBladesPerCell=6;diagnostics.farBladesPerCell=4;diagnostics.lowFarBladesPerCell=2;
      prepareCoverage();
    },
    useFineGrass(texture,farTexture){
      if(disposed||material.map)return;
      fineGrass=true;
      // 24 independent fine leaf triangles plus four complete far cards retain
      // the fixed 32-triangle / 96-vertex budget, including the low prefix.
      for(let leaf=0;leaf<24;leaf++){
        vertices.set([-.5,0,0,.5,0,0,0,1,0],leaf*9);
        uvs.set([0,1,1,1,.5,0],leaf*6);
      }
      for(let card=0;card<4;card++){
        vertices.set([-.5,0,0,.5,0,0,-.5,1,0,.5,0,0,.5,1,0,-.5,1,0],24*9+card*18);
        uvs.set([0,1,1,1,0,0,1,1,1,0,0,0],24*6+card*12);
      }
      geometry.getAttribute('position').needsUpdate=true;geometry.getAttribute('uv').needsUpdate=true;
      geometry.name='Fine dry leaf triangles and middle distance grass cards';
      material.map=texture;uniforms.uCanopyFarMap.value=farTexture;
      Object.assign(diagnostics,{photographed:true,fineLeaves:true,cellSize:.45,farCellSize:1.2,radius:(cellsPerSide/2-2)*.45,farRadius:(cellsPerSide/2-2)*1.2,clearanceGuard:spacing.length()/2+.4,bladesPerCell:24,lowBladesPerCell:12,farBladesPerCell:4,lowFarBladesPerCell:2});
      prepareCoverage();
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
