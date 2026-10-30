"""Keep M57's DEM relief while projecting it onto the new cape's constraints.

Run from the project root. Frozen base inputs are observed Float32 values from
the work build, before relief; the final browser check reads the actual output.
The original M57 input, runtime data and reproducer remain unchanged.
"""
import base64
import hashlib
import json
import math
import struct
from pathlib import Path

input_path = Path('source-assets/cape-grade-base-inputs.json')
parent_path = Path('src/world/inland-relief.json')
inputs = json.loads(input_path.read_text())
parent = json.loads(parent_path.read_text())
assert hashlib.sha256(input_path.read_bytes()).hexdigest() == 'f0ecd557c34006be7e92a70c7db81b7b97eebabe9bcdd83820f66bad00fa0a6e'
payload, reports = {}, {}
for name, tier in inputs['tiers'].items():
    side = tier['segments'] + 1
    base, fixed, xs, zs = tier['base'], tier['protected'], tier['x'], tier['z']
    assert len(base) == len(fixed) == side * side
    old = parent[name]
    assert old['segments'] == tier['segments'] and old['metresPerUnit'] == .002
    data = base64.b64decode(old['deltaBase64'])
    stored = struct.unpack('<' + 'h' * (len(data) // 2), data)
    initial = [0] * len(base)
    for row in range(old['rows']):
        for col in range(old['columns']):
            initial[(row + old['originRow']) * side + col + old['originColumn']] = stored[row * old['columns'] + col]
    assert all(initial[i] == 0 for i in range(len(base)) if fixed[i])
    land = [y + initial[i] * .002 for i, y in enumerate(base)]
    edges = []
    for row in range(side):
        for col in range(side):
            i = row * side + col
            for dx, dz in ((1, 0), (0, 1), (1, 1), (-1, 1)):
                x, z = col + dx, row + dz
                if x < 0 or x >= side or z >= side:
                    continue
                j = z * side + x
                limit = max(.5 * math.hypot(xs[x] - xs[col], zs[z] - zs[row]), abs(base[i] - base[j]))
                edges.append((i, j, limit))
    initial_bad = sum(abs(land[i] - land[j]) - limit > .0021 for i, j, limit in edges)
    for iteration in range(1200):
        residual = 0
        for i, j, limit in edges if iteration % 2 == 0 else reversed(edges):
            excess = abs(land[i] - land[j]) - limit
            if excess <= .000001 or fixed[i] and fixed[j]:
                continue
            correction = math.copysign(excess, land[i] - land[j])
            if not fixed[i] and not fixed[j]:
                land[i] -= correction * .5
                land[j] += correction * .5
            elif not fixed[i]:
                land[i] -= correction
            else:
                land[j] += correction
            residual = max(residual, excess)
        if residual < .00002:
            break
    assert residual < .00002
    quantized = [0 if fixed[i] else round((land[i] - y) / .002) for i, y in enumerate(base)]
    assert max(abs(q) for q in quantized) <= 32767
    final = [y + quantized[i] * .002 for i, y in enumerate(base)]
    max_excess = max(abs(final[i] - final[j]) - limit for i, j, limit in edges)
    assert max_excess < .0021
    active = [i for i, q in enumerate(quantized) if q]
    c0, c1 = min(i % side for i in active), max(i % side for i in active)
    r0, r1 = min(i // side for i in active), max(i // side for i in active)
    columns, rows = c1 - c0 + 1, r1 - r0 + 1
    cropped = [quantized[row * side + col] for row in range(r0, r1 + 1) for col in range(c0, c1 + 1)]
    packed = struct.pack('<' + 'h' * len(cropped), *cropped)
    payload[name] = dict(segments=tier['segments'], metresPerUnit=.002, originColumn=c0, originRow=r0, columns=columns, rows=rows, deltaBase64=base64.b64encode(packed).decode())
    reports[name] = dict(vertices=len(base), protectedVertices=sum(fixed), protectedDelta=0, originalViolations=initial_bad, projectionIterations=iteration + 1, residual=residual, maxQuantizedEdgeExcess=max_excess, changedFromM57=sum(a != b for a, b in zip(quantized, initial)), maxCorrectionMetres=max(abs(a - b) * .002 for a, b in zip(quantized, initial)), storedSamples=len(cropped), decodedSha256=hashlib.sha256(packed).hexdigest())

output_path = Path('src/world/inland-relief-v2.json')
encoded = json.dumps(payload, separators=(',', ':')).encode()
output_path.write_bytes(encoded)
report = dict(method='Project the existing M57 DEM deltas against the new authored cape base on each exact final grid, preserving newly recomputed protected vertices. Only edge-limit corrections are made; no additional DEM noise or grid resampling.', input=str(input_path), inputSha256=hashlib.sha256(input_path.read_bytes()).hexdigest(), parent=str(parent_path), parentSha256=hashlib.sha256(parent_path.read_bytes()).hexdigest(), parentSource='source-assets/inland-relief-v1.source.json', observedBaseBundle=inputs['baselineBundle'], observedBaseBundleSha256=inputs['baselineBundleSha256'], capeProfile=inputs['capeProfile'], output=str(output_path), outputBytes=len(encoded), outputSha256=hashlib.sha256(encoded).hexdigest(), tiers=reports)
Path('source-assets/inland-relief-v2.source.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
