import * as THREE from 'three';

type SurfaceMaps={color:THREE.Texture;surface:THREE.Texture};

// Standard materials normally read roughness from G; these surface images
// store normals in RGB and roughness in A. Reapply after Material.clone().
export function usePackedSurfaceRoughness(material:THREE.MeshStandardMaterial){
  material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',THREE.ShaderChunk.roughnessmap_fragment.replace('texelRoughness.g','texelRoughness.a'));};
  material.customProgramCacheKey=()=> 'coast-packed-rock-v1';
}

/** Shared metre-sized rock detail on closed geometry, including instances with
 * nonuniform scales. Scenery owns the two borrowed maps. No UV atlas needed. */
export function createCoastalBoulderMaterial(maps:SurfaceMaps){
  const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95});
  material.name='Metre textured closed coastal boulders';
  material.onBeforeCompile=shader=>{
    shader.uniforms.uBoulderColor={value:maps.color};shader.uniforms.uBoulderSurface={value:maps.surface};
    shader.vertexShader='varying vec3 vBoulderPosition,vBoulderNormal;\n'+shader.vertexShader
      .replace('#include <defaultnormal_vertex>','#include <defaultnormal_vertex>\nvBoulderNormal=inverseTransformDirection(transformedNormal,viewMatrix);')
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        vec4 boulderPosition=vec4(position,1.0);
        #ifdef USE_INSTANCING
          boulderPosition=instanceMatrix*boulderPosition;
        #endif
        vBoulderPosition=(modelMatrix*boulderPosition).xyz;`);
    shader.fragmentShader=`varying vec3 vBoulderPosition,vBoulderNormal;
      uniform sampler2D uBoulderColor,uBoulderSurface;
      vec3 boulderDetail(vec3 n){return normalize(vec3((n.xy*2.0-1.0)*.62,n.z*2.0-1.0));}
      `+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        vec3 boulderN=normalize(vBoulderNormal),boulderWeights=pow(abs(boulderN),vec3(4.0));boulderWeights/=max(dot(boulderWeights,vec3(1.0)),.001);
        vec3 boulderP=vBoulderPosition/1.8;
        diffuseColor.rgb*=texture2D(uBoulderColor,boulderP.zy).rgb*boulderWeights.x+texture2D(uBoulderColor,boulderP.xz).rgb*boulderWeights.y+texture2D(uBoulderColor,boulderP.xy).rgb*boulderWeights.z;
        vec4 boulderX=texture2D(uBoulderSurface,boulderP.zy),boulderY=texture2D(uBoulderSurface,boulderP.xz),boulderZ=texture2D(uBoulderSurface,boulderP.xy);
        vec3 nx=boulderDetail(boulderX.xyz),ny=boulderDetail(boulderY.xyz),nz=boulderDetail(boulderZ.xyz);
        vec3 boulderWorldNormal=normalize(vec3(abs(nx.z)*boulderN.x,nx.y+boulderN.y,nx.x+boulderN.z)*boulderWeights.x+vec3(ny.x+boulderN.x,abs(ny.z)*boulderN.y,ny.y+boulderN.z)*boulderWeights.y+vec3(nz.x+boulderN.x,nz.y+boulderN.y,abs(nz.z)*boulderN.z)*boulderWeights.z);
      `).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(dot(vec3(boulderX.a,boulderY.a,boulderZ.a),boulderWeights)*.95,.67,1.0);')
      .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(mat3(viewMatrix)*boulderWorldNormal);');
  };
  material.customProgramCacheKey=()=> 'coast-closed-boulder-triplanar-v1';
  return material;
}

// Shared by the terrain, tunnel cap and graded shoulders. Textures remain
// owned by Scenery; this function owns only material shading.
export function createCoastalGroundMaterial(groundMaps:SurfaceMaps,sandMaps:SurfaceMaps,rockMaps:SurfaceMaps,fieldMaps:SurfaceMaps,mobile:boolean){
  const groundMaterial = new THREE.MeshStandardMaterial({ roughness: .96, metalness: 0 });
  groundMaterial.onBeforeCompile = shader => {
    for (const [prefix, maps] of Object.entries({ Ground:groundMaps, Sand:sandMaps, Field:fieldMaps })) {
      shader.uniforms[`u${prefix}Color`] = { value:maps.color };
      shader.uniforms[`u${prefix}Surface`] = { value:maps.surface };
    }
    shader.uniforms.uRockColor={value:rockMaps.color};shader.uniforms.uRockSurface={value:rockMaps.surface};
    shader.vertexShader = 'varying vec3 vGroundPosition;varying vec3 vGroundWorldNormal;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGroundPosition = (modelMatrix*vec4(position,1.0)).xyz;vGroundWorldNormal=normalize(mat3(modelMatrix)*normal);');
    shader.fragmentShader = `varying vec3 vGroundPosition;varying vec3 vGroundWorldNormal;
      uniform sampler2D uGroundColor,uGroundSurface,uSandColor,uSandSurface,uFieldColor,uFieldSurface,uRockColor,uRockSurface;
      float coastHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float coastNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(coastHash(i),coastHash(i+vec2(1,0)),f.x),mix(coastHash(i+vec2(0,1)),coastHash(i+1.0),f.x),f.y);}
      vec3 coastTriplanar(sampler2D source,vec3 point,float size,vec3 weights){return texture2D(source,point.zy/size).rgb*weights.x+texture2D(source,point.xz/size).rgb*weights.y+texture2D(source,point.xy/size).rgb*weights.z;}
      vec3 coastDetailNormal(vec3 sampleNormal){return normalize(vec3((sampleNormal.xy*2.0-1.0)*.62,sampleNormal.z*2.0-1.0));}
      // Whiteout each projected normal with the actual surface before mixing.
      // A flat normal map returns surfaceN on every axis, including cliff backs.
      vec3 coastXzNormal(vec3 detail,vec3 surfaceN){return normalize(vec3(detail.x+surfaceN.x,abs(detail.z)*surfaceN.y,detail.y+surfaceN.z));}
      vec3 coastRockNormal(vec4 surfaceX,vec4 surfaceY,vec4 surfaceZ,vec3 surfaceN,vec3 weights){
        vec3 nx=coastDetailNormal(surfaceX.xyz);
        vec3 ny=coastDetailNormal(surfaceY.xyz);
        vec3 nz=coastDetailNormal(surfaceZ.xyz);
        vec3 worldX=vec3(abs(nx.z)*surfaceN.x,nx.y+surfaceN.y,nx.x+surfaceN.z);
        vec3 worldY=vec3(ny.x+surfaceN.x,abs(ny.z)*surfaceN.y,ny.y+surfaceN.z);
        vec3 worldZ=vec3(nz.x+surfaceN.x,nz.y+surfaceN.y,abs(nz.z)*surfaceN.z);
        return normalize(worldX*weights.x+worldY*weights.y+worldZ*weights.z);
      }
    ` + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec2 soilUv=vGroundPosition.xz/7.5,sandUv=vGroundPosition.xz/12.0;
      float macro=coastNoise(vGroundPosition.xz*.035);
      float meadowPattern=coastNoise(vGroundPosition.xz*.019+vec2(11.7,3.1));
      soilUv+=vec2(macro-.5,meadowPattern-.5)*.17;
      float sandWeight=1.0-smoothstep(2.0,9.0,vGroundPosition.y+macro*2.2);
      vec3 groundN=normalize(vGroundWorldNormal);
      vec3 triWeights=pow(abs(groundN),vec3(4.0));triWeights/=max(dot(triWeights,vec3(1.0)),.001);
      float slope=1.0-clamp(groundN.y,0.0,1.0);
      float rockWeight=clamp(smoothstep(.13,.48,slope)*.9+smoothstep(.76,.95,macro)*.06,0.0,.92);
      float inland=1.0-smoothstep(.84,.96,length(vGroundPosition.xz/vec2(355.0,292.0)));
      float fieldPatch=smoothstep(.24,.62,macro*.65+meadowPattern*.35);
      float fieldWeight=inland*smoothstep(3.0,7.0,vGroundPosition.y)*(1.0-smoothstep(.20,.48,slope))*mix(.80,.98,fieldPatch);
      vec2 fieldUv=vGroundPosition.xz/2.0+vec2(macro-.5,meadowPattern-.5)*.23;
      vec3 soil=texture2D(uGroundColor,soilUv).rgb;
      vec3 sand=texture2D(uSandColor,sandUv).rgb;
      vec3 stone=coastTriplanar(uRockColor,vGroundPosition,3.5,triWeights);
      ${mobile ? '' : `soil=mix(soil,texture2D(uGroundColor,soilUv*1.73+vec2(17.3,9.7)).rgb,coastNoise(vGroundPosition.xz*.08)*.34);
      sand=mix(sand,texture2D(uSandColor,sandUv*1.57+vec2(3.7,8.1)).rgb,.26);`}
      // Dry the photographed moss selectively; preserve its scanned grain
      // instead of painting most of the soil with a flat meadow color.
      float moss=smoothstep(.005,.035,soil.g-soil.r*.93);
      float soilLuma=dot(soil,vec3(.25,.60,.15));
      vec3 dryGrass=soilLuma*vec3(1.23,1.12,.72);
      soil=mix(soil,dryGrass,moss*(.48+.32*meadowPattern));
      soil=mix(soil,texture2D(uFieldColor,fieldUv).rgb*vec3(.92,.97,.85),fieldWeight);
      vec3 albedo=mix(mix(soil,sand,sandWeight),stone,rockWeight);
      float damp=1.0-smoothstep(-.7,1.4,vGroundPosition.y);
      diffuseColor.rgb=albedo*mix(.91,1.16,macro)*mix(1.0,.65,damp);
      vec4 soilSurface=texture2D(uGroundSurface,soilUv),sandSurface=texture2D(uSandSurface,sandUv),fieldSurface=texture2D(uFieldSurface,fieldUv);
      vec3 soilNormal=coastXzNormal(coastDetailNormal(soilSurface.rgb),groundN);
      vec3 fieldNormal=coastXzNormal(coastDetailNormal(fieldSurface.rgb),groundN);
      soilNormal=normalize(mix(soilNormal,fieldNormal,fieldWeight));
      vec3 sandNormal=coastXzNormal(coastDetailNormal(sandSurface.rgb),groundN);
      vec4 surfaceX=texture2D(uRockSurface,vGroundPosition.zy/3.5);
      vec4 surfaceY=texture2D(uRockSurface,vGroundPosition.xz/3.5);
      vec4 surfaceZ=texture2D(uRockSurface,vGroundPosition.xy/3.5);
      vec3 stoneNormal=coastRockNormal(surfaceX,surfaceY,surfaceZ,groundN,triWeights);
      vec3 mixedGroundNormal=mix(mix(soilNormal,sandNormal,sandWeight),stoneNormal,rockWeight);
      float stoneRoughness=dot(vec3(surfaceX.a,surfaceY.a,surfaceZ.a),triWeights);
      float soilRoughness=mix(soilSurface.a,fieldSurface.a,fieldWeight);
      float scannedRoughness=mix(mix(soilRoughness,sandSurface.a,sandWeight),stoneRoughness,rockWeight);
    `).replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=clamp(scannedRoughness*.92,.67,1.0);')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        normal=normalize(mat3(viewMatrix)*mixedGroundNormal);`);
  };
  groundMaterial.customProgramCacheKey = () => `coastal-dry-field-rock-v8-${mobile}`;
  return groundMaterial;
}
