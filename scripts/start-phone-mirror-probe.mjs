import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import {createServer} from 'node:net';
import {build, preview} from 'vite';

// A separate local diagnostic build. The production dist/ and source stay intact.
const outDir = 'work/phone-probe-m70-dist';
const artifactDir = 'artifacts/phone-probe-m70';
const port = 5191;
// Refuse before building, so a second invocation cannot replace a live probe.
await new Promise((resolve, reject) => {
  const check = createServer();
  check.once('error', reject);
  check.listen(port, '0.0.0.0', () => check.close(resolve));
});
const source = await readFile('src/game/OceanDrive.ts', 'utf8');
const client = await readFile('scripts/phone-mirror-probe-client.js');
const old = 'this.running&&this.cameraMode===1&&!this.disposed';
const next = '(window as any).__phoneMirrorEnabled!==false&&' + old;
assert.equal(source.split(old).length, 2, 'The diagnostic requires one mirror update gate');
let count = 0;
await build({
  build: {outDir},
  plugins: [{
    name: 'phone-mirror-probe-work-only',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/game/OceanDrive.ts')) return;
      assert.equal(code, source);
      count++;
      return {code: code.replace(old, next), map: null};
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace('<head>', '<head><script src="/phone-probe-m70.js" defer></script>');
      },
    },
  }],
});
assert.equal(count, 1);
await writeFile(outDir + '/phone-probe-m70.js', client);
await mkdir(artifactDir + '/reports', {recursive: true});
const hash = value => createHash('sha256').update(value).digest('hex');
await writeFile(artifactDir + '/recipe.json', JSON.stringify({
  method: 'Work-only four-phase phone RAF comparison, not production5190. ON/OFF gates the entire mirror update including secondary cull. No production source edits.',
  sourceSha256: hash(source), probeSha256: hash(client), old, next, count,
}, null, 2) + '\n');

const server = await preview({
  configFile: false,
  build: {outDir},
  preview: {host: '0.0.0.0', port, strictPort: true},
  plugins: [{
    name: 'local-phone-mirror-probe-results',
    configurePreviewServer(server) {
      server.middlewares.use('/__phone-perf', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let text = '';
        req.on('data', chunk => {
          text += chunk;
          if (text.length > 250_000) req.destroy();
        });
        req.on('end', async () => {
          try {
            const report = JSON.parse(text);
            assert.equal(report.runTag, 'm70-phone-mirrors');
            assert.ok(Array.isArray(report.phases));
            assert.deepEqual(report.phases.map(p => p.enabled), [true, false, true, false]);
            assert.ok(report.phases.every(p => Number.isFinite(p.fps) && Number.isFinite(p.p95)
              && p.frames > 0 && Array.isArray(p.frameTimes)));
            const file = new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID() + '.json';
            await writeFile(artifactDir + '/reports/' + file, JSON.stringify({
              ...report, receivedAt: new Date().toISOString(),
            }, null, 2), {flag: 'wx'});
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ok: true, file}));
            console.log(JSON.stringify({file, renderer: report.renderer, viewport: report.viewport,
              phases: report.phases.map(p => ({enabled: p.enabled, fps: p.fps, p95: p.p95, passes: p.mirrorPasses})),
            }));
          } catch (error) {
            res.statusCode = 400;
            res.end(JSON.stringify({error: error.message}));
          }
        });
      });
    },
  }],
});
server.printUrls();
console.log('Phone diagnostic: open the network URL with /?test=1 and press Start. Keep it foreground.');
