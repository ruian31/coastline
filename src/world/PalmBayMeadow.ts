import * as THREE from 'three';

// Fixed groups sit in gaps between the dry grass on the driveable bay slope.
export const palmBayShrubGroups = [
  [223.6, 162.7, .3, 1.12],
  [211.9, 172.5, 1.5, .95],
  [226.5, 174.1, 2.1, 1],
] as const;

// The rock apron and the rooted crowns use the same irregular patches of soil.
export const palmBayScrubPatches = [
  {x:220.4,z:155.4,bearing:.7,scale:1.48},
  {x:224.5,z:160.4,bearing:.38,scale:1.34},
  {x:216.7,z:166.9,bearing:-.87,scale:1.15},
  {x:224.1,z:174.5,bearing:1.92,scale:1.22},
  {x:215.7,z:180,bearing:-.28,scale:1.18},
  {x:206.3,z:183.9,bearing:-.51,scale:.92},
] as const;

function scrubPatchCoordinates(x:number,z:number,patch:typeof palmBayScrubPatches[number]){
  const px=(x-patch.x)/patch.scale, pz=(z-patch.z)/patch.scale;
  const cos=Math.cos(patch.bearing), sin=Math.sin(patch.bearing);
  return [px*cos+pz*sin,pz*cos-px*sin];
}

function scrubShoulder(along:number,across:number){
  return 1-THREE.MathUtils.smoothstep(Math.hypot((along+.13)*.67,across*1.1),.65,1.95);
}

export function palmBayScrubCover(x:number,z:number){
  let cover=0;
  for(const patch of palmBayScrubPatches){
    if(Math.abs(x-patch.x)>4.7||Math.abs(z-patch.z)>4.7)continue;
    const [along,across]=scrubPatchCoordinates(x,z,patch);
    cover=Math.max(cover,scrubShoulder(along,across));
  }
  return cover;
}

/** Locally authored grass and bare earth coverage, shared by the ground and
 * fine grass shaders. Alpha blends the meadow into the surrounding island. */
export function createPalmBayMeadow(roadClearance: (x: number, z: number) => number) {
  const width = 64, depth = 64, resolution = 96;
  const bounds = new THREE.Vector4(186, 133, width, depth);
  const data = new Uint8Array(resolution * resolution * 4);
  const {smoothstep, clamp} = THREE.MathUtils;

  for (let row=0; row<resolution; row++) for (let column=0; column<resolution; column++) {
    const u=(column+.5)/resolution, v=(row+.5)/resolution;
    const edge=Math.min(u,v,1-u,1-v);
    if (edge<.04) continue;
    const x=bounds.x+u*width, z=bounds.y+v*depth;
    const weight=smoothstep(edge,.04,.23)*smoothstep(roadClearance(x,z),8,15);
    if (weight===0) continue;

    // Irregular metre-scale islands of dry grass and patches of exposed soil.
    // All meshes and passes see the same field regardless of camera position.
    const dx=x-218, dz=z-168;
    const patches=.55*Math.sin(dx*.32+dz*.39)
      +.26*Math.sin(dx*.71-dz*.17+1.8)
      +.19*Math.cos(dx*.21+dz*.85);
    const grass=smoothstep(patches,-.8,.36);
    let shrubSoil=0, exposedStone=0;
    for (const [sx,sz,,scale] of palmBayShrubGroups) {
      shrubSoil=Math.max(shrubSoil,1-smoothstep(Math.hypot(x-sx,z-sz)/scale,.65,2.2));
    }
    for (const patch of palmBayScrubPatches) {
      if(Math.abs(x-patch.x)>4.7||Math.abs(z-patch.z)>4.7)continue;
      const [along,across]=scrubPatchCoordinates(x,z,patch);
      shrubSoil=Math.max(shrubSoil,scrubShoulder(along,across));
      const stones=Math.hypot((along-.31)*.85,(across-.5)*1.35);
      exposedStone=Math.max(exposedStone,(1-smoothstep(stones,.2,1.16))*(.73+.27*Math.sin(x*3.1-z*2.5)));
    }
    const i=(row*resolution+column)*4;
    data[i]=Math.round(clamp(grass*(1-shrubSoil*.95),0,1)*255);
    data[i+1]=Math.round(shrubSoil*255);
    data[i+2]=Math.round(exposedStone*255);
    data[i+3]=Math.round(weight*255);
  }
  const map = new THREE.DataTexture(data,resolution,resolution,THREE.RGBAFormat);
  map.name='Palm Bay meadow coverage';
  map.magFilter=map.minFilter=THREE.LinearFilter;
  map.needsUpdate=true;
  return {uMeadowMap:{value:map}, uMeadowBounds:{value:bounds}};
}

export type MeadowUniforms = ReturnType<typeof createPalmBayMeadow>;

export const meadowShader = /* glsl */`
  uniform sampler2D uMeadowMap;
  uniform vec4 uMeadowBounds;
  vec4 palmBayMeadow(vec2 xz){
    vec2 uv=(xz-uMeadowBounds.xy)/uMeadowBounds.zw;
    if(any(lessThanEqual(uv,vec2(0.)))||any(greaterThanEqual(uv,vec2(1.))))return vec4(0.);
    return textureLod(uMeadowMap,uv,0.);
  }
`;
