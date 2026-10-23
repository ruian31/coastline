import{MeshoptSimplifier}from'meshoptimizer';
import{BufferGeometry,Float32BufferAttribute,Vector3}from'three';

/** Preserve the photographed face; author a deep, closed body behind its open perimeter. */
export function solidifyScan(doc,{axis,depth,backTriangles}){
 const buffer=doc.getRoot().listBuffers()[0],bodyMaterial=doc.createMaterial('solid-rock-body').setRoughnessFactor(.95),reports=[];
 for(const mesh of doc.getRoot().listMeshes())for(const source of [...mesh.listPrimitives()]){
  const attribute=source.getAttribute('POSITION'),original=source.getIndices().getArray(),vertices=[],remap=[],known=new Map(),edges=new Map();
  // UV seams must not be mistaken for open geometry.
  for(let i=0;i<attribute.getCount();i++){const vertex=attribute.getElement(i,[]),key=vertex.join(',');if(!known.has(key)){known.set(key,vertices.length);vertices.push(vertex);}remap[i]=known.get(key);}
  const front=Uint32Array.from(original,i=>remap[i]);
  for(let i=0;i<front.length;i+=3)for(let j=0;j<3;j++){const a=front[i+j],b=front[i+(j+1)%3],key=a<b?a+','+b:b+','+a;if(!edges.has(key))edges.set(key,{a,b,count:0});edges.get(key).count++;}
  const boundary=[...edges.values()].filter(e=>e.count===1);
  if(!boundary.length)throw Error('Expected an open photogrammetry surface');
  const stages=4,positions=[],index=[];
  function point(vertex,t){const[x,y,z]=vertex,wave=Math.sin(t*Math.PI);
   return axis==='z'?[x*(1-.015*t),y*(1-.15*t)-1.2*t+wave*Math.sin(x*.29)*.35,z*(1-.75*t)-depth*t+Math.sin(x*.17+y*.3)*.5*t+wave*Math.cos(x*.23+y*.31)*.6]
    :[x*(1-.04*t),y*(1-.9*t)-depth*t,z*(1-.04*t)];
  }
  const back=Float32Array.from(vertices.flatMap(vertex=>point(vertex,1)));
  const[backIndex]=MeshoptSimplifier.simplify(front,back,3,backTriangles*3,.02,['LockBorder']);
  positions.push(...back);
  for(let i=0;i<backIndex.length;i+=3)index.push(backIndex[i+2],backIndex[i+1],backIndex[i]);
  // Shared perimeter vertices at each stage make continuous eroded sides, top and base.
  const perimeter=[...new Set(boundary.flatMap(e=>[e.a,e.b]))],rings=[];
  for(let stage=0;stage<stages;stage++){
   const ring=new Map();for(const id of perimeter){ring.set(id,positions.length/3);positions.push(...point(vertices[id],stage/stages));}rings.push(ring);
  }
  rings.push(new Map(perimeter.map(id=>[id,id])));
  for(let stage=0;stage<stages;stage++)for(const{a,b}of boundary){const a0=rings[stage].get(a),b0=rings[stage].get(b),a1=rings[stage+1].get(a),b1=rings[stage+1].get(b);index.push(b0,a0,a1,b0,a1,b1);}
  const indexed=new BufferGeometry();indexed.setAttribute('position',new Float32BufferAttribute(positions,3));indexed.setIndex(index);indexed.computeVertexNormals();
  const geometry=indexed.toNonIndexed(),position=geometry.getAttribute('position'),uv=[],a=new Vector3(),b=new Vector3(),c=new Vector3(),normal=new Vector3();
  // Each cap triangle receives metre-scaled UVs; no stretched one-pixel edge texture.
  for(let i=0;i<position.count;i+=3){a.fromBufferAttribute(position,i);b.fromBufferAttribute(position,i+1);c.fromBufferAttribute(position,i+2);normal.copy(b).sub(a).cross(c.sub(a));const n=[Math.abs(normal.x),Math.abs(normal.y),Math.abs(normal.z)],major=n.indexOf(Math.max(...n));
   for(let j=0;j<3;j++){const x=position.getX(i+j),y=position.getY(i+j),z=position.getZ(i+j);uv.push((major===0?z:x)/6,(major===1?z:y)/6);}
  }
  const accessor=(name,type,array)=>doc.createAccessor(name,buffer).setType(type).setArray(array);
  const primitive=doc.createPrimitive().setMaterial(bodyMaterial)
   .setAttribute('POSITION',accessor('Rock body positions','VEC3',position.array))
   .setAttribute('NORMAL',accessor('Rock body normals','VEC3',geometry.getAttribute('normal').array))
   .setAttribute('TEXCOORD_0',accessor('Rock body metric UV','VEC2',Float32Array.from(uv)))
   .setIndices(accessor('Rock body indices','SCALAR',Uint32Array.from({length:position.count},(_,i)=>i)));
  mesh.addPrimitive(primitive);source.getMaterial().setDoubleSided(false);
  reports.push({sourceTriangles:front.length/3,openPerimeterEdges:boundary.length,authoredBodyTriangles:index.length/3,depthMetres:depth,stages});indexed.dispose();geometry.dispose();
 }
 return reports;
}

/** Count actual mesh boundaries across primitive/material/UV seams, not just index streams. */
export function scanTopology(mesh){
 const vertices=new Map(),edges=new Map();let degenerateFaces=0;
 for(const primitive of mesh.listPrimitives()){
  const p=primitive.getAttribute('POSITION'),remap=[];
  for(let i=0;i<p.getCount();i++){const key=p.getElement(i,[]).map(n=>Math.round(n*1e5)).join(',');if(!vertices.has(key))vertices.set(key,vertices.size);remap[i]=vertices.get(key);}
  const indices=primitive.getIndices().getArray();for(let i=0;i<indices.length;i+=3){const face=[remap[indices[i]],remap[indices[i+1]],remap[indices[i+2]]];if(new Set(face).size!==3){degenerateFaces++;continue;}for(let j=0;j<3;j++){const a=face[j],b=face[(j+1)%3],key=a<b?a+','+b:b+','+a;edges.set(key,(edges.get(key)??0)+1);}}
 }
 return{openEdges:[...edges.values()].filter(n=>n===1).length,overlapEdges:[...edges.values()].filter(n=>n>2).length,degenerateFaces};
}
