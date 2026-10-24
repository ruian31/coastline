// Read back the actual compiled canopy vertex shader. Roots are checked against
// the rendered terrain triangles, not against a copied height interpolation.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium,webkit,devices} from 'playwright';

const label=process.env.CANOPY_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);
const kind=process.env.CANOPY_BROWSER??'chrome',mobile=process.env.CANOPY_DEVICE!=='desktop',out=`artifacts/grass-canopy-${label}`;
assert.ok(['chrome','webkit'].includes(kind));await mkdir(out);
const browser=kind==='webkit'?await webkit.launch({executablePath:path.resolve('work/webkit-runtime/launch-webkit.sh')}):await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']});
const page=await browser.newPage(mobile?{...devices[kind==='webkit'?'iPhone 13':'Pixel 7'],viewport:{width:844,height:390}}:{viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
for(const file of ['three.module.js','three.core.js'])await page.route(`**/__qa/${file}`,route=>route.fulfill({path:path.resolve('node_modules/three/build',file),contentType:'text/javascript'}));
await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.canopyObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>canopyObjects.push(e.detail));});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');
 const samples=[];
 for(const state of ['bank-inland','grass-verge','town']){
  await page.evaluate(async state=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState(state);h.setPausedForScreenshot(true);h.setReducedMotion(true);},state);
  const report=await page.evaluate(async()=>{
   const T=await import('/__qa/three.module.js'),scene=canopyObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape')),renderer=canopyObjects.find(o=>o.isWebGLRenderer),mesh=scene.getObjectByName('World anchored dry grass canopy'),terrain=scene.getObjectByName('Limestone headland and grassy interior'),gl=renderer.getContext();
   const {uniforms,currentProgram}=renderer.properties.get(mesh.material),source=gl.getShaderSource(currentProgram.vertexShader),program=gl.createProgram(),shaders=[],buffers=[],vao=gl.createVertexArray(),tf=gl.createTransformFeedback();
   const compile=(type,source)=>{const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);};
   const matrices=Array.from(mesh.instanceMatrix.array),field=uniforms.uCanopyField.value;
   try{
    compile(gl.VERTEX_SHADER,source.replace('void main() {','out vec4 canopyProbe;\nvoid main() {').replace(/\}\s*$/,'canopyProbe=vec4(transformed,canopyVisibility);\n}'));
    compile(gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;out vec4 color;void main(){color=vec4(1.0);}');
    gl.transformFeedbackVaryings(program,['canopyProbe'],gl.INTERLEAVED_ATTRIBS);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);gl.bindVertexArray(vao);
    for(const name of ['position','normal','aCanopyBlade']){const location=gl.getAttribLocation(program,name);if(location<0)continue;const attribute=mesh.geometry.getAttribute(name),buffer=gl.createBuffer();buffers.push(buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,attribute.array,gl.STATIC_DRAW);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,attribute.itemSize,gl.FLOAT,false,0,0);}
    for(const name of ['uCanopyTerrainSize','uCanopyCarXZ']){const v=uniforms[name].value;gl.uniform2f(gl.getUniformLocation(program,name),v.x,v.y);}
    const hidden=uniforms.uCanopyHiddenPoint.value;gl.uniform3f(gl.getUniformLocation(program,'uCanopyHiddenPoint'),hidden.x,hidden.y,hidden.z);
    gl.uniform1f(gl.getUniformLocation(program,'uCanopyTime'),2.5);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,renderer.properties.get(field).__webglTexture);gl.uniform1i(gl.getUniformLocation(program,'uCanopyField'),0);
    const vertices=mesh.geometry.getAttribute('position').count,capacity=mesh.userData.grassCanopy.fullCount,output=gl.createBuffer();buffers.push(output);gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,tf);gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER,output);gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER,capacity*vertices*16,gl.STREAM_READ);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,output);
    const probe=(origin,count=capacity,time=2.5)=>{gl.uniform2f(gl.getUniformLocation(program,'uCanopyOriginCell'),origin.x,origin.y);gl.uniform1f(gl.getUniformLocation(program,'uCanopyTime'),time);gl.enable(gl.RASTERIZER_DISCARD);gl.beginTransformFeedback(gl.POINTS);gl.drawArraysInstanced(gl.POINTS,0,vertices,count);gl.endTransformFeedback();gl.disable(gl.RASTERIZER_DISCARD);const data=new Float32Array(count*vertices*4);gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER,0,data);return data;};
    const origin=uniforms.uCanopyOriginCell.value,shift={x:origin.x+1,y:origin.y},base=probe(origin),shifted=probe(shift),low=probe(origin,capacity/2),shiftedLow=probe(shift,capacity/2),wind=probe(origin,capacity,4.5),ray=new T.Raycaster(),visible=[],visibleOffsets=[],tipMotion=[];
    const roads=scene.getObjectByName('road-network').children.filter(o=>o.isMesh&&o.material.customProgramCacheKey().includes('coast-dry-asphalt-v1'));
    let maxRootError=0,roadHits=0,baseWindError=0;
    let rootsChecked=0;
    for(let i=0;i<base.length/4;i+=3){const b=i*4;if(base[b+3]<.9)continue;for(const offset of [0,4]){const x=base[b+offset],y=base[b+offset+1],z=base[b+offset+2];baseWindError=Math.max(baseWindError,Math.abs(x-wind[b+offset]),Math.abs(y-wind[b+offset+1]),Math.abs(z-wind[b+offset+2]));}
     visible.push([base[b],base[b+1],base[b+2]]);visibleOffsets.push(b);tipMotion.push(Math.hypot(base[b+8]-wind[b+8],base[b+10]-wind[b+10]));
    }
    for(let n=0;n<visibleOffsets.length;n+=Math.max(1,Math.ceil(visibleOffsets.length/128)))for(const offset of [0,4]){const b=visibleOffsets[n]+offset;ray.set(new T.Vector3(base[b],200,base[b+2]),new T.Vector3(0,-1,0));const hit=ray.intersectObject(terrain)[0];if(!hit)throw Error('Grass root has no rendered terrain');maxRootError=Math.max(maxRootError,Math.abs(hit.point.y-base[b+1]));if(ray.intersectObjects(roads,false).length)roadHits++;rootsChecked++;}
    const key=(d,i)=>[d[i],d[i+1],d[i+2]].map(v=>v.toFixed(4)).join(','),roots=new Map(),lowRoots=new Set();for(let i=0;i<base.length;i+=12)if(base[i+3]>.9)roots.set(key(base,i),i);for(let i=0;i<low.length;i+=12)if(low[i+3]>.9)lowRoots.add(key(low,i));let overlap=0,lowOverlap=0,stableVertexError=0;for(let i=0;i<shifted.length;i+=12)if(shifted[i+3]>.9){const at=roots.get(key(shifted,i));if(at!==undefined){overlap++;for(let j=0;j<12;j++)stableVertexError=Math.max(stableVertexError,Math.abs(shifted[i+j]-base[at+j]));}}for(let i=0;i<shiftedLow.length;i+=12)if(shiftedLow[i+3]>.9&&lowRoots.has(key(shiftedLow,i)))lowOverlap++;
    let prefixError=0;for(let i=0;i<low.length;i++)prefixError=Math.max(prefixError,Math.abs(low[i]-base[i]));
    return{config:mesh.userData.grassCanopy,count:mesh.count,triangles:mesh.geometry.getAttribute('position').count/3,visibleBlades:visible.length,rootsChecked,maxRootError,roadHits,baseWindError,maxTipMotion:Math.max(0,...tipMotion),stableShiftOverlap:overlap,lowShiftOverlap:lowOverlap,stableVertexError,lowPrefixError:prefixError,matricesUnchanged:matrices.every((v,i)=>v===mesh.instanceMatrix.array[i]),fieldSize:[field.image.width,field.image.height],fieldBytes:field.image.data.byteLength,glError:gl.getError(),sampleRoots:visible.filter((_,i)=>i%Math.max(1,Math.ceil(visible.length/12))===0),roadMeshesChecked:roads.length,roadRouteCount:scene.getObjectByName('Coastal landscape').userData.routeIds.length};
   }finally{gl.disable(gl.RASTERIZER_DISCARD);gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,null);gl.bindVertexArray(null);gl.useProgram(null);buffers.forEach(b=>gl.deleteBuffer(b));shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);gl.deleteVertexArray(vao);gl.deleteTransformFeedback(tf);renderer.resetState();}
  });
  samples.push({state,...report});console.log(JSON.stringify(samples.at(-1)));
 }
 const result={bundle:await page.locator('script[type=module][src]').getAttribute('src'),browser:kind,mobile,method:'Transform feedback of actual prepared game vertex shader, terrain and asphalt triangle raycasts; host GPU, not phone hardware',samples,errors};await writeFile(out+'/result.json',JSON.stringify(result,null,2),{flag:'wx'});
 assert.deepEqual(errors,[]);
 for(const s of samples){assert.equal(s.glError,0);assert.equal(s.lowPrefixError,0);assert.equal(s.baseWindError,0);assert.equal(s.stableVertexError,0);assert.equal(s.roadHits,0);assert.ok(s.roadMeshesChecked>0);assert.equal(s.roadMeshesChecked,s.roadRouteCount);assert.ok(s.maxRootError<.001);assert.equal(s.matricesUnchanged,true);if(s.state==='bank-inland'){assert.ok(s.rootsChecked>25);assert.ok(s.visibleBlades>100);assert.ok(s.stableShiftOverlap>100);assert.ok(s.lowShiftOverlap>100);assert.ok(s.maxTipMotion>.01);}}
}finally{await browser.close();}
