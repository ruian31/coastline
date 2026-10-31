import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createServer} from 'vite';

const server = await createServer({configFile: false, server: {middlewareMode: true, hmr: false, watch: null}, appType: 'custom', logLevel: 'error'});
try {
  const T = await server.ssrLoadModule('three');
  const {createVehicleMirrors} = await server.ssrLoadModule('/src/systems/VehicleMirrors.ts');
  const rows = [];
  for (const rate of [1000 / 16.6, 60, 59.94, 120, 30]) {
    const root = new T.Group(), scene = new T.Scene(), cockpitEye = new T.Vector3(0, 0, 1);
    scene.add(root);
    const mirrors = ['left', 'right', 'center'].map((name, i) => {
      const mirror = new T.Mesh(new T.PlaneGeometry(.25, .12), new T.MeshBasicMaterial());
      mirror.name = 'rearview-' + name; mirror.position.x = [-.16, 100, .16][i]; root.add(mirror); return mirror;
    });
    // Many triangles wholly outside each small mirror, plus crossing triangles.
    const geometry = new T.SphereGeometry(1, 24, 16), body = new T.Mesh(geometry, new T.MeshBasicMaterial());
    body.position.z = 2; root.add(body);
    let target = null, time = 0, fail = false, originalDisposed = false;
    const passes = [], subsets = new Set();
    geometry.addEventListener('dispose', () => { originalDisposed = true; });
    const renderer = {capabilities: {maxSamples: 4}, xr: {enabled: true}, shadowMap: {autoUpdate: true, needsUpdate: true}, info: {render: {calls: 1, triangles: 0}},
      getRenderTarget: () => target, setRenderTarget: value => { target = value; }, clear() {}, render() {
        assert.notEqual(body.geometry, geometry);
        assert.notEqual(body.geometry.attributes.position.array, geometry.attributes.position.array);
        subsets.add(body.geometry); passes.push({name: target.texture.name, time});
        if (fail) throw Error('intentional render failure');
      }};
    const car = {root, mirrors, mirrorBody: [body], cockpitEye};
    const controller = createVehicleMirrors(renderer, scene, car, true, () => {});
    const camera = new T.PerspectiveCamera(75, 2, .05, 180); camera.position.copy(cockpitEye); camera.lookAt(0, 0, 0);
    for (let i = 0; i < rate * 5; i++) {
      time = i / rate;
      const before = passes.length; controller.update(time, camera, true);
      assert.ok(passes.length - before <= 1);
      assert.equal(body.geometry, geometry); assert.equal(body.visible, true);
      assert.equal(target, null); assert.equal(renderer.xr.enabled, true);
      assert.equal(renderer.shadowMap.autoUpdate, true); assert.equal(renderer.shadowMap.needsUpdate, true);
    }
    const views = ['left', 'center'].map(name => {
      const stamps = passes.filter(pass => pass.name === 'rearview-' + name + '-linear-view').map(pass => pass.time);
      assert.ok(Math.abs(stamps.length - Math.min(150, rate * 2.5)) <= 2, rate + ':' + name);
      const intervals = stamps.slice(1).map((t, i) => t - stamps[i]);
      return {name, updates: stamps.length, maxInterval: Math.max(...intervals)};
    });
    assert.equal(passes.filter(pass => pass.name.includes('right')).length, 0);
    const frozen = passes.length;
    for (let i = 0; i < 300; i++) { time = 5 + i / 60; controller.update(time, camera, true, false); }
    assert.equal(passes.length, frozen);
    controller.invalidate();
    const refreshStart = passes.length;
    for (let i = 0; i < 300; i++) {
      time = 10 + i / 60; const before = passes.length;
      controller.update(time, camera, true, false); assert.ok(passes.length - before <= 1);
    }
    assert.equal(passes.length, refreshStart + 2);
    const refreshed = passes.length;
    for (let i = 0; i < 120; i++) { time = 15 + i / 60; controller.update(time, camera, true, false); }
    assert.equal(passes.length, refreshed);
    time = 3000; controller.update(time, camera, true); assert.equal(passes.length, refreshed + 1);
    // Failure must restore shared renderer state and the original body geometry.
    time += 1; fail = true;
    assert.throws(() => controller.update(time, camera, true), /intentional render failure/);
    assert.equal(body.geometry, geometry); assert.equal(body.visible, true); assert.equal(target, null);
    assert.equal(renderer.xr.enabled, true); assert.equal(renderer.shadowMap.autoUpdate, true); assert.equal(renderer.shadowMap.needsUpdate, true);
    assert.ok(mirrors.every(mirror => mirror.visible));
    let disposed = 0; for (const subset of subsets) subset.addEventListener('dispose', () => { disposed++; });
    controller.dispose(); assert.equal(disposed, subsets.size); assert.equal(originalDisposed, false);
    rows.push({rate, seconds: 5, views, pausedPasses: 0, invalidatedPausedPasses: 2, invalidationBurstPerFrame: 1, resumeBurst: 1, restoredAfterFailure: true, independentGeometryDisposed: true});
    root.traverse(object => { if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); } });
  }
  await writeFile(process.env.MIRROR_REFRESH_REPORT ?? 'artifacts/mirror-smooth-m72-refresh-cpu.json', JSON.stringify({method: 'Production update with a stub renderer and declared synthetic RAF timestamps. Tests16.6ms alias,60/59.94/120/30Hz, two visible glasses and offscreen third, max one render per update, pause, long-gap resume, throw/finally restoration and independent geometry disposal. CPU control-flow only; not actual browser cadence or phone performance.', rows}, null, 2) + '\n');
  console.log(JSON.stringify(rows));
} finally { await server.close(); }
