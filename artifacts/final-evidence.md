# R16/A23 · 近岸海水进退阶段证据

2026-10-23，项目 `/home/ryan/workspace/coastline`，生产包 `index-CljZ-HJR.js`。这是持续目标中的一个阶段，整体自然风景尚未通过用户最终验收。此前车辆、岩体接缝和自由驾驶已获阶段认可。

试玩：[局域网生产版](http://192.168.3.10:5190/)；WASD/手机双指驾驶，C/顶部按钮切镜头，P/巡航按钮切驾驶模式。棕榈海湾的开放路肩可驶向沙岸近看海水。手机开始点击申请横屏全屏。

## 本阶段结果

海水按实际岸面一波波漫上岸再退回，泡沫随接触深度移动，土壤/岩石保留湿润过渡。附近采用真实起伏网格，远海为轻量平面；共享岸线数据、HDR反射和时间。减弱动态冻结当前浪相，恢复连续推进。离线来源和实体岩体资源仍见文档07，未新增外部模型或纹理素材任务。

| 验证 | 结果 |
| --- | --- |
| 生产构建、14组驾驶逻辑、岩体表面/厚度 | 通过 |
| 解析岸面/编码/掩码等 | 7118个近岸采样及边界用例通过 |
| 原有三浏览器回归 | 30项通过，3项平台跳过 |
| 新海水/弱动态生产专项 | 桌面Chrome、Android Chrome模拟、Linux WebKit共6项通过 |
| 连续水线 | 各33时刻、四测线、两个周期，实际地形投影往返约1.2–2.6m |
| 湿润材质 | 桌面12/手机8近岸像素明显变化，高处干地4点各自不变 |
| 正常动画 | 桌面17.98s/横屏手机18.05s，不暂停录像，已检查多个时刻 |
| 实际手机双指 | 离路89.46m、绕到岩后、停车环顾再回路，约47s，无脚本错误 |

正式截图清单 `artifacts/evidence-shore-wash.json`，run **pass-m16c-shore-wash**，16个实际机位含岸岩侧背、车内、隧道出口和低角度沙岸，像素非空/错误/预算检查通过。桌面最大104 calls/606350tri/88geo/42tex，手机竖屏最大92/263374/77/40；这些计数是主渲染，不含独立阴影pass。

- [桌面沙岸](/home/ryan/workspace/coastline/artifacts/pass-m16c-shore-wash/desktop-shore-wash.png)
- [低角度沙岸](/home/ryan/workspace/coastline/artifacts/pass-m16c-shore-wash/desktop-shore-wash-low.png)
- [实际岩岸衔接](/home/ryan/workspace/coastline/artifacts/pass-m16c-shore-wash/desktop-shore-side.png)
- [桌面动态/水线/湿润采样](/home/ryan/workspace/coastline/artifacts/shore-wash-production-desktop/samples.json)
- [横屏手机动态/水线/湿润采样](/home/ryan/workspace/coastline/artifacts/shore-wash-production-phone/samples.json)
- [实际双指绕行](/home/ryan/workspace/coastline/artifacts/offroad-shore-wash-phone/android-touch.webm)
- [手机视口CPU对照](/home/ryan/workspace/coastline/artifacts/mobile-performance/shore-wash-manual.json)

实际双指全程峰值112 calls/317033tri/101geo/46tex，超300k/40初始目标约5.7%/15%；前一版相近过程为304475tri/45tex。新效果增加约1.26万三角形/1张纹理，不能用冷上下文的16个机位覆盖整个行程的超支。8秒/4倍CPU同终点对照Task2337→2240ms、Script1950→1845ms，布局均19ms，heap15.86→16.98MiB；这是桌面RTX4050模拟，不代表一加12或iPhone帧率。

## 方法、修复与限制

水线检查复用实际水面顶点/片元程序，仅把末端颜色替换为白色，离屏输出真实深度遮挡的水陆掩码，再用独立Raycaster投影至实际地形。湿润检查暂时隐藏海水，读取实际地面材质，防止将水面颜色动画误认成湿润过渡。动画另录正常不暂停片段，已查看推进/后退时刻，岩岸无明显裁切裂口。现有视觉基线保留，新增受影响状态和运动证据，未用标题页或单张截图替代动态检查。

独立只读审查发现浅视角固定次数片元求根会漏检眼前浪峰，已改成真实网格。初版GLSL保留字错误、初次遗漏生产测试查询参数、旧帧诊断采集和失败的过浅投影测线均留存；新采集不会覆盖旧目录。测试入口等新帧再刷新诊断，海水测试保留即时离路断言并在三浏览器再次通过。早期带旧帧元数据的截图不作为逐图性能对照。

目前泡沫/水色仍采用最高表面高度场近似，复杂悬挑下不是体积水深；也不是完整流体或数小时的潮汐模拟。新海水版真实一加12和iPhone性能尚待复核。整体自然地表、光照、远景和公路外开销仍需改进，Goal保持active；没有以非空截图或测试数目宣布接近满分。

复现命令：`npm run build`、`npm run test:driving`、`npm run test:rocks`、`npm run test:shore`；浏览器使用 `TEST_BASE_URL=http://127.0.0.1:4188`，WebKit环境见playwright配置。海水脚本以唯一 `SHORE_LABEL` 运行，`SHORE_DEVICE=mobile`为横屏；正式采集必须带 `/?test=1`。所有GPU检查串行执行。
