(() => {
  const moving = new URLSearchParams(location.search).has('drive');
  const saved = localStorage.getItem('coast-settings');
  localStorage.setItem('coast-settings', JSON.stringify({quality: 'low', muted: true}));
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:#14222ae8;color:#f5ecda;font:16px system-ui;text-align:center;padding:20px';
  const card = document.createElement('div');
  card.style.cssText = 'max-width:480px;padding:20px;background:#14222ae8;border-radius:15px';
  overlay.append(card);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => document.body.append(overlay), {once: true});
  else document.body.append(overlay);
  card.innerHTML = '<h2>手机' + (moving ? '行驶' : '静止') + '画面检测</h2><p>'
    + (moving ? '先自动巡航对照约25秒，再请照常开车、转动视角10秒。' : '同一路段、流畅画质，对照动态后视镜开启与关闭。约25秒，请暂时不要操作。')
    + '</p><button id="phone-probe-start" style="font:inherit;padding:14px 28px;border:0;border-radius:9px;background:#eed39a;color:#14222a">开始检测</button>';
  let running = false;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const copy = () => structuredClone(window.__THREE_GAME_DIAGNOSTICS__);
  const quantile = (values, q) => values[Math.floor((values.length - 1) * q)];

  async function measure(ms) {
    const frames = [], checkpoints = [], start = performance.now(), before = copy();
    let previous;
    await new Promise(resolve => {
      const tick = now => {
        if (previous !== undefined) frames.push(now - previous);
        previous = now;
        if (frames.length % 15 === 0) {
          const d = window.__THREE_GAME_DIAGNOSTICS__;
          checkpoints.push({ms: now - start, frame: d.frame, position: {...d.player.position}, speed: d.player.speed,
            calls: d.renderer.calls, triangles: d.renderer.triangles, camera: d.state.camera, paused: d.state.paused,
            automatic: d.state.automatic, offroad: d.state.offroad, steer: d.state.steer, tier: d.state.renderTier});
        }
        if (now - start >= ms) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const after = copy(), sorted = [...frames].sort((a, b) => a - b);
    const seconds = frames.reduce((a, b) => a + b, 0) / 1000;
    return {seconds, frames: frames.length, fps: frames.length / seconds, p50: quantile(sorted, .5),
      p95: quantile(sorted, .95), over33: frames.filter(x => x > 33.34).length, over50: frames.filter(x => x > 50).length,
      frameTimes: frames.map(x => Math.round(x * 1000) / 1000), checkpoints,
      mirrorPasses: after.vehicleMirrors.passes - before.vehicleMirrors.passes, before, after};
  }

  async function run() {
    if (running) return;
    running = true;
    card.textContent = '正在准备横屏场景…';
    const visibility = [], onVisibility = () => visibility.push({at: performance.now(), state: document.visibilityState});
    document.addEventListener('visibilitychange', onVisibility);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen({navigationUI: 'hide'}).catch(() => {});
      if (screen.orientation?.lock) await screen.orientation.lock('landscape').catch(() => {});
      for (let i = 0; i < 1200 && !window.__THREE_GAME_TEST_HOOKS__; i++) await wait(100);
      if (!window.__THREE_GAME_TEST_HOOKS__) throw Error('游戏加载超时');
      const hooks = window.__THREE_GAME_TEST_HOOKS__;
      overlay.style.background = 'transparent';
      overlay.style.alignItems = 'end';
      overlay.style.justifyItems = 'center';
      card.style.padding = '10px 18px';
      const phases = [];
      for (const [index, enabled] of [true, false, true, false].entries()) {
        card.textContent = `检测 ${index + 1}/4 · ${enabled ? '动态后视镜开启' : '动态后视镜关闭'} · 请暂时不要操作`;
        window.__phoneMirrorEnabled = enabled;
        await hooks.setState(moving ? 'cockpit' : 'tree-shadow');
        hooks.setReducedMotion(!moving);
        document.querySelector('[data-camera="1"]').click();
        await wait(1000);
        phases.push({enabled, ...await measure(4000)});
      }
      let manual = null;
      if (moving) {
        window.__phoneMirrorEnabled = true;
        await hooks.setState('cockpit');
        hooks.setReducedMotion(false);
        document.querySelector('#auto-button').click();
        // Diagnostics publish every80ms; measure after the real manual state is visible.
        for (let i = 0; i < 120 && window.__THREE_GAME_DIAGNOSTICS__.state.automatic; i++) await wait(50);
        if (window.__THREE_GAME_DIAGNOSTICS__.state.automatic) throw Error('无法切换手动驾驶');
        card.textContent = '现在请照常开车、转动视角（10秒），结果会自动回传';
        overlay.style.pointerEvents = 'none';
        const inputs = [], inputStart = performance.now();
        const onInput = event => {
          const button = event.target.closest?.('[data-drive],[data-camera]');
          if (button) inputs.push({ms: performance.now() - inputStart, trusted: event.isTrusted,
            action: button.dataset.drive ?? 'camera:' + button.dataset.camera});
          else if (event.target === document.querySelector('canvas')) inputs.push({ms: performance.now() - inputStart, trusted: event.isTrusted, action: 'view'});
        };
        document.addEventListener('pointerdown', onInput, true);
        window.__phoneManualActive = true;
        try { manual = {...await measure(10000), inputs}; }
        finally {
          window.__phoneManualActive = false;
          document.removeEventListener('pointerdown', onInput, true);
          overlay.style.pointerEvents = 'auto';
        }
      }
      hooks.setPausedForScreenshot(true);
      const gl = document.querySelector('canvas').getContext('webgl2');
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const report = {mode: moving ? 'driving' : 'stationary', runTag: 'm70-phone-mirrors', at: new Date().toISOString(),
        userAgent: navigator.userAgent, viewport: [innerWidth, innerHeight], devicePixelRatio,
        hardwareConcurrency: navigator.hardwareConcurrency,
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        method: 'Same phone, low tier. Four live RAF ON/OFF phases,1s warm and4s measured each. Driving uses an initial cockpit fixture per phase, then actual automatic physics; stationary uses a stopped tree fixture. No hook stepping or simulated clock. Whole mirror update gated, including cull. Optional10s manual segment records trusted control presses and sparse game checkpoints; inspect inputs before treating it as a user playtest.',
        phases, manual, visibility};
      const response = await fetch('/__phone-perf', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(report)});
      if (!response.ok) throw Error('结果回传失败');
      const ack = await response.json();
      card.innerHTML = '<b>检测完成，结果已回传</b><p style="font-size:14px">我会据此定位卡顿。</p><button id="phone-probe-return" style="font:inherit;padding:10px 20px">返回游戏</button>';
      window.__phonePerfReport = report;
      window.__phonePerfReceipt = ack;
      document.querySelector('#phone-probe-return').onclick = () => { location.href = location.origin.replace(':5191', ':5190') + '/'; };
    } catch (error) {
      card.textContent = '检测未完成：' + error.message;
      window.__phonePerfError = String(error);
    } finally {
      document.removeEventListener('visibilitychange', onVisibility);
      if (saved === null) localStorage.removeItem('coast-settings');
      else localStorage.setItem('coast-settings', saved);
    }
  }
  card.querySelector('#phone-probe-start').onclick = run;
})();
