import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium, devices} from 'playwright';

const out = process.env.MIRROR_BODY_OUT ?? 'artifacts/mirror-smooth-m72-body';
await mkdir(out, {recursive: true});
const browser = await chromium.launch({channel: 'chrome', args: ['--enable-gpu', '--use-gl=angle', '--use-angle=gl']});
const page = await browser.newPage({...devices['Pixel 7'], viewport: {width: 844, height: 390}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
try {
  await page.addInitScript(() => {
    localStorage.setItem('coast-settings', JSON.stringify({quality: 'low', muted: true}));
    window.bodyComparisons = [];
    const originals = new WeakMap();
    window.__THREE_DEVTOOLS__ = new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe', event => {
      const object = event.detail;
      if (object.isScene) {
        const add = object.add;
        object.add = function (...objects) {
          for (const car of objects) if (car.name.startsWith('convertible-')) car.traverse(mesh => {
            if (mesh.isMesh) originals.set(mesh, {geometry: mesh.geometry, visible: mesh.visible});
          });
          return add.apply(this, objects);
        };
      }
      if (!object.isWebGLRenderer) return;
      const render = object.render;
      object.render = function (scene, camera) {
        const target = this.getRenderTarget(), car = scene.children.find(child => child.name.startsWith('convertible-'));
        const key = car?.name + ':' + target?.texture.name + ':' + window.bodyComparisonPose;
        if (!car || !target?.texture.name.startsWith('rearview-') || !window.bodyComparisonPose || window.bodyComparisons.some(row => row.key === key))
          return render.call(this, scene, camera);
        const changed = [];
        car.traverse(mesh => {
          const original = originals.get(mesh);
          if (original && original.geometry !== mesh.geometry) changed.push({mesh, original, geometry: mesh.geometry, visible: mesh.visible});
        });
        if (!changed.length) throw Error('Expected actual production mirror body subsets');
        const read = () => {
          const pixels = new Uint16Array(target.width * target.height * 4);
          this.readRenderTargetPixels(target, 0, 0, target.width, target.height, pixels);
          return pixels;
        };
        render.call(this, scene, camera);
        const clippedInfo = {...this.info.render}, clipped = read();
        try {
          for (const row of changed) { row.mesh.geometry = row.original.geometry; row.mesh.visible = row.original.visible; }
          render.call(this, scene, camera);
          const fullInfo = {...this.info.render}, full = read();
          let differingChannels = 0;
          for (let i = 0; i < full.length; i++) if (full[i] !== clipped[i]) differingChannels++;
          window.bodyComparisons.push({key, car: car.name, mirror: target.texture.name, pose: window.bodyComparisonPose,
            width: target.width, height: target.height, differingChannels, clipped: clippedInfo, full: fullInfo,
            body: changed.map(row => ({name: row.mesh.name, triangles: row.geometry.attributes.position.count / 3,
              originalTriangles: (row.original.geometry.index?.count ?? row.original.geometry.attributes.position.count) / 3,
              sharesPosition: row.geometry.attributes.position.array === row.original.geometry.attributes.position.array,
              sameSortCenter: row.geometry.boundingSphere.center.equals(row.original.geometry.boundingSphere.center)}))});
        } finally {
          for (const row of changed) { row.mesh.geometry = row.geometry; row.mesh.visible = row.visible; }
          Object.assign(this.info.render, clippedInfo);
        }
      };
    });
  });
  await page.goto((process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4198') + '/?test=1');
  await page.waitForFunction(() => window.__THREE_GAME_TEST_HOOKS__);
  for (const state of ['classic-mirrors', 'gt-mirrors', 'sport-mirrors', 'tunnel-mirrors']) {
    await page.evaluate(async state => {
      window.bodyComparisonPose = state;
      await window.__THREE_GAME_TEST_HOOKS__.setState(state);
      window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(true);
    }, state);
    await page.waitForTimeout(400);
    await page.mouse.move(370, 130); await page.mouse.down();
    await page.mouse.move(240, 130, {steps: 15}); await page.mouse.up();
    await page.waitForTimeout(400);
    await page.screenshot({path: out + '/' + state + '-side.png', scale: 'css'});
  }
  const rows = await page.evaluate(() => window.bodyComparisons);
  assert.equal(rows.length, 12, 'All three mirrors in each of four car/road poses');
  for (const row of rows) {
    assert.equal(row.differingChannels, 0, row.key + ' exact half-float raster comparison');
    assert.ok(row.clipped.triangles < row.full.triangles, row.key);
    assert.ok(row.body.every(mesh => !mesh.sharesPosition && mesh.sameSortCenter));
  }
  assert.deepEqual(errors, []);
  await writeFile(out + '/result.json', JSON.stringify({method: 'Actual production subsets vs original full body rendered sequentially into the same physical mirror target at identical camera/scene/time. Exact Uint16 half-float channel comparison, all3 mirrors x3 cars plus tilted tunnel pose. QA intercept restores geometry, visibility and renderer counters; no production switch. Not a performance or phone test.', rows, errors}, null, 2) + '\n');
  console.log(JSON.stringify(rows.map(row => ({car: row.car, mirror: row.mirror, pose: row.pose, different: row.differingChannels, triangles: [row.full.triangles, row.clipped.triangles]})), null, 2));
} finally { await browser.close(); }
