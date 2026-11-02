import * as THREE from 'three';

/** Light coastal rain. All owned GPU resources are allocated lazily.
 * The ground grid samples support, not every possible roof or overhang.
 */
export function createCoastalDrizzle(
  scene: THREE.Scene,
  mobile: boolean,
  ground: (x: number, z: number) => number,
) {
  const columnsX = mobile ? 10 : 16, columnsZ = mobile ? 9 : 10, layers = 3;
  const dropsPerCell=2,capacity = columnsX * columnsZ * layers*dropsPerCell;
  const cellSize = 3.2, layerHeight = 8, gridSize = 16, gridStep = 4;
  const animationPeriod = 2400;
  let resources: ReturnType<typeof createResources> | undefined, disposed = false;
  let lastGridTime = -Infinity, gridX = Infinity, gridZ = Infinity;
  const diagnostics = {
    ready: false, active: false, reason: 'dry', capacity, allocatedParticles: 0,
    scheduledDraws: 0, scheduledTriangles: 0, seconds: 0, shaderSeconds: 0,
    rain: 0, wind: 1, inTunnel: false, animationPeriodSeconds: animationPeriod,
    windowOrigin: [0, 0, 0], heightOrigin: [0, 0],
    heightGrid: [gridSize, gridSize], heightSpacing: gridStep,
    heightUploads: 0, groundSamples: 0, invalidGroundSamples: 0,
    lastGroundError: '', supportScope: 'Sampled local ground; tunnel flag hides rain. Other roofs are not certified.',
  };

  function createResources() {
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      -.5, -.5, 0, .5, -.5, 0, -.5, .5, 0, .5, .5, 0,
    ], 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2));
    geometry.setIndex([0, 1, 2, 2, 1, 3]);
    const cells = new Float32Array(capacity * 3),salts=new Float32Array(capacity);
    let instance = 0;
    for (let y = 0; y < layers; y++) for (let z = 0; z < columnsZ; z++) for (let x = 0; x < columnsX; x++) for(let drop=0;drop<dropsPerCell;drop++) {
      cells[instance * 3] = x;cells[instance * 3 + 1] = y;cells[instance * 3 + 2] = z;salts[instance]=drop;instance++;
    }
    geometry.setAttribute('aSalt',new THREE.InstancedBufferAttribute(salts,1));
    geometry.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 3));
    geometry.instanceCount = capacity;

    const heights = new Float32Array(gridSize * gridSize);
    const heightTexture = new THREE.DataTexture(heights, gridSize, gridSize, THREE.RedFormat, THREE.FloatType);
    heightTexture.name = 'Sampled rain support';heightTexture.minFilter = heightTexture.magFilter = THREE.NearestFilter;
    heightTexture.generateMipmaps = false;heightTexture.unpackAlignment = 1;
    const uniforms = {
      uOrigin: {value: new THREE.Vector3()}, uAnchor: {value: new THREE.Vector3()},
      uExtent: {value: new THREE.Vector2((columnsX - 2) * cellSize / 2, (columnsZ - 2) * cellSize / 2)},
      uHeightMap: {value: heightTexture}, uHeightOrigin: {value: new THREE.Vector2()},
      uSeconds: {value: 0}, uRain: {value: 0}, uWind: {value: 1},
      uColor: {value: new THREE.Color(.3, .34, .36)}, uFogDensity: {value: 0},
    };
    const material = new THREE.ShaderMaterial({
      name: 'Soft coastal drizzle', transparent: true, depthTest: true, depthWrite: false,
      side: THREE.DoubleSide, uniforms,
      vertexShader: `
        attribute vec3 aCell;attribute float aSalt;
        uniform vec3 uOrigin,uAnchor;uniform vec2 uExtent,uHeightOrigin;
        uniform sampler2D uHeightMap;uniform float uSeconds,uRain,uWind,uFogDensity;
        varying vec2 vRainUv;varying float vAlpha,vWorldY,vSupport;
        vec3 hash3(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.xxy+p.yxx)*p.zyx);}
        float supportAt(vec2 point){
          vec2 cell=(point-uHeightOrigin)/4.0,index=floor(cell),lo=(index+.5)/16.0;
          float a=texture2D(uHeightMap,lo).r,b=texture2D(uHeightMap,lo+vec2(1.0/16.0,0.)).r;
          float c=texture2D(uHeightMap,lo+vec2(0.,1.0/16.0)).r,d=texture2D(uHeightMap,lo+vec2(1.0/16.0)).r;
          return max(max(a,b),max(c,d))+.07;
        }
        void main(){
          vec3 cell=uOrigin+aCell,randomCell=cell+vec3(13.37,7.91,19.41)*aSalt,seed=hash3(randomCell),extra=hash3(randomCell+vec3(17.2,43.7,9.4));
          // Two fall rates have an exact 2400s common period. Reducing only the
          // shader clock preserves phase across long sessions without a reset.
          float speed=mix(7.5,9.0,step(.5,extra.x)),phase=fract(seed.y-uSeconds*speed/${layerHeight.toFixed(1)});
          float age=(1.-phase)*${layerHeight.toFixed(1)}/speed;
          vec3 centre=vec3((cell.x+.12+.76*seed.x)*3.2,(cell.y+phase)*${layerHeight.toFixed(1)},(cell.z+.12+.76*seed.z)*3.2);
          centre.xz+=vec2(.22,.11)*uWind*age;
          vec3 fall=normalize(vec3(.22*uWind,-speed,.11*uWind));
          vec3 cameraRight=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
          float width=mix(.02,.035,extra.y),streakLength=mix(.16,.33,extra.z);
          vec3 world=centre+cameraRight*position.x*width+fall*position.y*streakLength;
          vRainUv=uv;vWorldY=world.y;vSupport=supportAt(world.xz);
          vec2 relative=abs((centre.xz-uAnchor.xz)/uExtent);
          float edge=1.-smoothstep(.78,1.,max(relative.x,relative.y));
          // The visible vertical band fits all three layers before and after their
          // window origin changes. Entering and leaving cells are already dim.
          float vertical=smoothstep(uAnchor.y-7.,uAnchor.y-5.,centre.y)*(1.-smoothstep(uAnchor.y+4.,uAnchor.y+6.,centre.y));
          float cycle=smoothstep(0.,.09,phase)*(1.-smoothstep(.91,1.,phase));
          float density=smoothstep(extra.y-.06,extra.y+.06,uRain);
          vec2 grid=(world.xz-uHeightOrigin)/4.0;
          float inside=step(0.,min(grid.x,grid.y))*step(max(grid.x,grid.y),14.999);
          float cameraDistance=length(cameraPosition-centre),nearFade=smoothstep(.45,1.1,cameraDistance);
          float fog=exp(-uFogDensity*uFogDensity*cameraDistance*cameraDistance);
          vAlpha=.22*uRain*edge*vertical*cycle*density*inside*nearFade*fog;
          gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;varying vec2 vRainUv;varying float vAlpha,vWorldY,vSupport;
        void main(){
          if(vWorldY<vSupport)discard;
          float side=abs(vRainUv.x-.5)*2.,soft=1.-smoothstep(.12,1.,side);
          float ends=sin(vRainUv.y*3.141592654);
          float alpha=vAlpha*soft*ends;if(alpha<.001)discard;
          gl_FragColor=vec4(uColor,alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    // Transparent DoubleSide materials otherwise submit separate back/front
    // passes in Three.js. These unlit narrow billboards need only one pass.
    material.forceSinglePass = true;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'Local coastal drizzle';mesh.frustumCulled = false;mesh.visible = false;
    scene.add(mesh);diagnostics.ready = true;diagnostics.allocatedParticles = capacity;
    return {geometry, heights, heightTexture, uniforms, material, mesh};
  }

  function refreshGround(anchor: THREE.Vector3, seconds: number) {
    const r = resources!;
    const nextX = (Math.floor(anchor.x / gridStep) - 7) * gridStep;
    const nextZ = (Math.floor(anchor.z / gridStep) - 7) * gridStep;
    if (nextX === gridX && nextZ === gridZ) return;
    const shift = Math.max(Math.abs(nextX - gridX), Math.abs(nextZ - gridZ));
    if (shift <= gridStep && seconds >= lastGridTime && seconds - lastGridTime < .35) return;
    gridX = nextX;gridZ = nextZ;lastGridTime = seconds;
    for (let z = 0; z < gridSize; z++) for (let x = 0; x < gridSize; x++) {
      let height = Infinity;
      try {height = ground(gridX + x * gridStep, gridZ + z * gridStep);}
      catch (error) {diagnostics.lastGroundError = String(error);}
      diagnostics.groundSamples++;
      if (!Number.isFinite(height)) {height = 1e6;diagnostics.invalidGroundSamples++;}
      r.heights[z * gridSize + x] = height;
    }
    r.uniforms.uHeightOrigin.value.set(gridX, gridZ);r.heightTexture.needsUpdate = true;
    diagnostics.heightOrigin[0] = gridX;diagnostics.heightOrigin[1] = gridZ;diagnostics.heightUploads++;
  }

  function hide(reason: string) {
    if (resources) resources.mesh.visible = false;
    diagnostics.active = false;diagnostics.reason = reason;
    diagnostics.scheduledDraws = diagnostics.scheduledTriangles = 0;
  }

  return {
    diagnostics,
    update(anchor: THREE.Vector3, seconds: number, rain: number, wind: number, inTunnel: boolean) {
      if (disposed) return;
      const time = Number.isFinite(seconds) && seconds >= 0 ? seconds : diagnostics.seconds;
      const amount = Number.isFinite(rain) ? THREE.MathUtils.clamp(rain, 0, 1) : 0;
      const breeze = Number.isFinite(wind) ? THREE.MathUtils.clamp(wind, 0, 3) : 1;
      diagnostics.seconds = time;diagnostics.shaderSeconds = time % animationPeriod;
      diagnostics.rain = amount;diagnostics.wind = breeze;diagnostics.inTunnel = inTunnel;
      if (![anchor.x, anchor.y, anchor.z].every(Number.isFinite)) {hide('invalid anchor');return;}
      if (inTunnel) {hide('tunnel');return;}
      if (amount <= .001) {hide('dry');return;}
      const r = resources ??= createResources();refreshGround(anchor, time);
      const x = Math.floor(anchor.x / cellSize) - Math.floor(columnsX / 2);
      const y = Math.floor((anchor.y - 7.5) / layerHeight);
      const z = Math.floor(anchor.z / cellSize) - Math.floor(columnsZ / 2);
      r.uniforms.uOrigin.value.set(x, y, z);r.uniforms.uAnchor.value.copy(anchor);
      r.uniforms.uSeconds.value = diagnostics.shaderSeconds;r.uniforms.uRain.value = amount;r.uniforms.uWind.value = breeze;
      const fog = scene.fog;
      if (fog) r.uniforms.uColor.value.copy(fog.color).multiplyScalar(1.22).addScalar(.008);
      else r.uniforms.uColor.value.setRGB(.3, .34, .36);
      r.uniforms.uFogDensity.value = fog instanceof THREE.FogExp2 ? fog.density : 0;
      r.mesh.visible = true;diagnostics.active = true;diagnostics.reason = 'rain';
      diagnostics.windowOrigin[0] = x;diagnostics.windowOrigin[1] = y;diagnostics.windowOrigin[2] = z;
      diagnostics.scheduledDraws = 1;diagnostics.scheduledTriangles = capacity * 2;
    },
    dispose() {
      if (disposed) return;disposed = true;hide('disposed');
      const r = resources;if (r) {r.mesh.removeFromParent();r.geometry.dispose();r.material.dispose();r.heightTexture.dispose();}
      resources = undefined;diagnostics.ready = false;diagnostics.allocatedParticles = 0;
    },
  };
}
