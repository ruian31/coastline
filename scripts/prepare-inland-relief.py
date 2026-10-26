import json,math,struct,base64,hashlib
from pathlib import Path
from PIL import Image

# Run from the project root; requires Pillow. Original inputs stay outside public/.
out=Path('source-assets');source=out/'inland-terrarium-13-1323-3207.png'
input_path=out/'inland-relief-inputs.json';inputs=json.loads(input_path.read_text())
assert hashlib.sha256(input_path.read_bytes()).hexdigest()=='5341b326bb368385f088b864b3bcea1f5411417e1df7e8adc66c72ab916bda82'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='0d531a5542c0c1706b25c1fb7202358b0ca831d8aee4c67d3c4a8622d9de415f'
image=Image.open(source).convert('RGB');assert image.size==(256,256)
heights=[r*256+g+b/256-32768 for r,g,b in image.get_flattened_data()]
cx=98;cz=178;span=192;scale=.12
def source_xy(x,z):return x/600*span+cx,z/560*span+cz
def sample(x,z):
    sx,sz=source_xy(x,z);sx=max(0,min(255,sx));sz=max(0,min(255,sz));ix=min(254,int(sx));iz=min(254,int(sz));u=sx-ix;v=sz-iz;a=iz*256+ix
    return heights[a]*(1-u)*(1-v)+heights[a+1]*u*(1-v)+heights[a+256]*(1-u)*v+heights[a+257]*u*v
def solve_tier(tier):
    size=tier['segments'];side=size+1;n=side*side;base=tier['base'];fixed=tier['protected'];xs=tier['x'];zs=tier['z'];assert len(base)==len(fixed)==n
    free=[i for i in range(n) if not fixed[i]]
    for i in free:
        for dx,dz in ((0,0),(1,0),(-1,0),(0,1),(0,-1)):
            px,pz=source_xy(xs[i%side+dx],zs[i//side+dz]);assert 0<=px<=255 and 0<=pz<=255,'Free terrain/boundary clamps source'
    detail=[sample(xs[i%side],zs[i//side])*scale for i in range(n)];correction=[-h for h in detail];wx=1/(inputs['width']/size)**2;wz=1/(inputs['depth']/size)**2;den=2*(wx+wz);max_step=0
    for iteration in range(3500):
        max_step=0
        for parity in (0,1):
            for i in free:
                if ((i%side+i//side)&1)!=parity:continue
                h=(wx*(correction[i-1]+correction[i+1])+wz*(correction[i-side]+correction[i+side]))/den;step=(h-correction[i])*1.72;correction[i]+=step;max_step=max(max_step,abs(step))
        if max_step<.00002:break
    assert max_step<.00002
    land=[base[i]+(0 if fixed[i] else detail[i]+correction[i]) for i in range(n)];edges=[]
    for row in range(side):
        for col in range(side):
            i=row*side+col
            for dx,dz in ((1,0),(0,1),(1,1),(-1,1)):
                x=col+dx;z=row+dz
                if x<0 or x>=side or z>=side:continue
                j=z*side+x
                if fixed[i] and fixed[j]:continue
                distance=math.hypot(xs[x]-xs[col],zs[z]-zs[row]);edges.append((i,j,max(.50*distance,abs(base[i]-base[j])),distance))
    max_grade_move=0
    for projection in range(1200):
        max_grade_move=0
        for i,j,limit,distance in edges if projection%2==0 else reversed(edges):
            difference=land[i]-land[j];excess=max(0,abs(difference)-limit)
            if excess<.000001:continue
            change=math.copysign(excess,difference)
            if not fixed[i] and not fixed[j]:land[i]-=change*.5;land[j]+=change*.5
            elif not fixed[i]:land[i]-=change
            else:land[j]+=change
            max_grade_move=max(max_grade_move,excess)
        if max_grade_move<.00002:break
    assert max_grade_move<.00002
    quantized=[0 if fixed[i] else round((land[i]-base[i])/.002) for i in range(n)];assert max(abs(q)for q in quantized)<=32767
    final=[base[i]+quantized[i]*.002 for i in range(n)];max_edge_error=max(abs(final[i]-final[j])-limit for i,j,limit,distance in edges);assert max_edge_error<.0021
    active=[i for i,q in enumerate(quantized)if q];min_col=min(i%side for i in active);max_col=max(i%side for i in active);min_row=min(i//side for i in active);max_row=max(i//side for i in active);columns=max_col-min_col+1;rows=max_row-min_row+1
    cropped=[quantized[row*side+col]for row in range(min_row,max_row+1)for col in range(min_col,max_col+1)];packed=struct.pack('<'+'h'*len(cropped),*cropped)
    payload=dict(segments=size,metresPerUnit=.002,originColumn=min_col,originRow=min_row,columns=columns,rows=rows,deltaBase64=base64.b64encode(packed).decode())
    # Decode the stored crop independently before writing a runtime asset.
    decoded=struct.unpack('<'+'h'*(columns*rows),base64.b64decode(payload['deltaBase64']));reconstructed=[0]*n
    for row in range(rows):
        for col in range(columns):reconstructed[(row+min_row)*side+col+min_col]=decoded[row*columns+col]
    assert reconstructed==quantized
    report=dict(segments=size,vertices=n,freeVertices=len(free),changedVertices=len(active),harmonicIterations=iteration+1,harmonicResidual=max_step,gradeProjectionIterations=projection+1,gradeResidual=max_grade_move,maxQuantizedEdgeExcessMetres=max_edge_error,protectedError=max(abs(quantized[i]*.002)for i in range(n)if fixed[i]),minDelta=min(quantized)*.002,maxDelta=max(quantized)*.002,minFreeHeight=min(final[i]for i in free),maxFreeHeight=max(final[i]for i in free),storedSamples=len(cropped),runtimeSha256=hashlib.sha256(packed).hexdigest(),sourceCropClampedFreeAndBoundaryPoints=0)
    return payload,report
payload={};reports={}
for name,tier in inputs['tiers'].items():payload[name],reports[name]=solve_tier(tier)
encoded=json.dumps(payload,separators=(',',':')).encode();output_path=Path('src/world/inland-relief.json');output_path.write_bytes(encoded)
report=dict(source=str(source),sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),inputsSha256=hashlib.sha256(input_path.read_bytes()).hexdigest(),baselineBundle=inputs['baselineBundle'],baselineBundleSha256=inputs['baselineBundleSha256'],cropPixels=[cx,cz,span],horizontalGameSize=[600,560],verticalScale=scale,edgeGradeLimit=.5,quantizationMetres=.002,outputSha256=hashlib.sha256(encoded).hexdigest(),outputBytes=len(encoded),tiers=reports,method='DEM curvature added to the existing fictional island. Harmonic correction and protected-vertex/edge-grade constraints solved independently on the exact final 120/160 grids. Direct index application, cropped binary storage without resampling. Existing shore, road, town, tunnel and cliff boundaries preserved at protected grid vertices. Not a geographical reconstruction or calibrated erosion model.')
report.update(dict(output=str(output_path),inputSnapshot=str(input_path),sourceUrl='https://s3.amazonaws.com/elevation-tiles-prod/terrarium/13/1323/3207.png',datasetUrl='https://registry.opendata.aws/terrain-tiles/',attributionUrl='https://github.com/tilezen/joerd/blob/master/docs/attribution.md',formatUrl='https://www.mapzen.com/blog/terrain-tile-service/',attribution='Terrain data courtesy of the U.S. Geological Survey. Terrain Tiles by Mapzen.',accessed='2026-10-26',inputSnapshotMethod='Actual M52 final terrain Float32 positions (120/160 grids), observed from frozen baseline bundle SHA above. Protection formula evaluated at those final vertices. Original x/z, baseline y and protection flags retained; this snapshot is an input, not recomputed from the new terrain.'))
(out/'inland-relief-v1.source.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
