# 当前进展 · 2026-10-21

路径：/home/ryan/workspace/coastline。Goal active，按用户授权持续迭代到真实需求与验收达到；每个可验证步骤中文 Conventional Commit，不push。

## 已提交
- 6d3d3ba：文档、需求与验收基线。
- 234a27c：M1可玩海岸、三款车、三视角、驾驶巡航、触控、音乐。
- 2e8eff8：M2小镇/隧道/灯塔、驾驶者、扫描材质/纯天空HDR、音频与镜头缺陷修复。

- 4b8c778：M4海岸地形、夕阳机位、座舱材质、镜头遮挡与自动质量。

## 已验证的M4改进
- 按用户“画面更精致、更接近真实风景”反馈重塑地形，最高约54m；隧道覆岩山丘、岬角岩脊、草/地被/砂岩过渡。
- 排除小镇人行道与隧道内的植被，完善地形开挖与MSAA叶缘；Scenery返回实际groundHeight给镜头。
- 首发点改主路.84朝向落日；真实天空曝光.28、低太阳光、干燥沥青粗糙度；相机同时检查建筑与实际坡面，防止目标及平滑机位穿墙/山。
- 车辆皮革细纹、木纹、车漆微表面、中控屏；修复门板外露、门缝浮空；驾驶者后追可读性提高。
- 自动质量在持续低帧率时降为流畅档；可手动选择质量。
- 生产构建通过；生产预览4188的Chrome桌面/手机6项+WebKit手机3项，共9项浏览器测试通过。
- test:driving七项通过：整圈2622m(主环1818m)、双向支路返回、手动手刹/恢复、音频排队、镜头墙面/山坡遮挡。巡航最大偏移1.695m。
- WebKit通过仅在work内局部提供旧ABI库实现，无系统安装；来源SHA与启动器留work/webkit-runtime；真实iPhone/Android性能仍未验证。

## 已提交的扫描植被
- ae14f8a：四种扫描蕨类（桌面64株/手机16株）、平台支撑、本地中文字体和载入按钮；当时9项生产浏览器与7项逻辑通过，16状态像素/预算通过。

## 已提交1f28835：树木、视点和资源等待
- TreeGeometry：细长羽叶棕榈、冠心与不规则五枝冠松树；开场树木人工构图。用户确认继续干燥加州海岸，已写D15/D16。
- 运动发现车内急转世界位置平滑导致视点后退进入靠背，已改驾驶位固定，真实转向回归眼位偏差<1cm。
- 全资源LoadingManager等待道路、地表、HDR、模型；慢路面资源测试通过；原一次Sport路面异常保留，后续64次同页面选择及40次新页面加载未复现。
- 生产build通过，桌面Chrome5+Android Pixel7 Chrome5+手机WebKit5=15项通过。
- 正式manifest artifacts/evidence-trees-stable.json，16状态+2运动文件共18项checker通过；desktop max87/605686/81/34，mobile max72/288397/63/30。
- motion-trees/drive.webm约21秒；2秒间隔8帧已目视检查。隧道.710到.766，切电影与手动急转，三车型副驾/中控截图已看。
- 未实现seed/no-debug钩子删除；截图稳定不再误改真实“减少动态”设置或电影构图。

## 已提交8f9f625：海水与内饰
- 同一天空HDR反射到海面、近岸水色/远波抗闪烁；扩大向下环顾，修复衣物遮挡手刹并细化手刹。
- 三车逐车真实油门测试，desktop5+Android5+WebKit5=15项通过。22状态正式manifest evidence-sea-cabins.json；海水/cabin当前build完成，桌面87/606036/81/34、手机72/288701/63/30，均预算内。子路径静态build验证通过。

## 当前待提交：手机优化与横屏全屏
- 一加12 Chrome首轮画面掉帧；修正UI图标/文本无变化仍重建、小地图重复曲线采样，缓存Path2D与地标。
- baseline→cached-ui→optimized-low：8秒DOM1543→14→14、布局108ms→3→2、Task2689ms→2111→1995；4xCPU节流桌面RTX4050 Android视口对照，非真机fps。
- 手机自动档从low启动，DPR1、轻量车底影，少些远景草/灌/蕨，保留近景风动与海岸风格；coarse UI去实时背景模糊。
- MobilePresentation默认横置引导，点击开始同步申请fullscreen，成功后尝试landscape锁定；能力不足有手动横置与iPhone添加到主屏幕说明。webmanifest/icon/iOSmeta已加。
- 用户真实一加12复测稳定地址 http://192.168.3.10:5190/ 后确认“明显更流畅，横屏全屏正常”。docs09记录。
- 当前build通过；desktop5+Android7+WebKit7共19项功能通过。两项仅手机测试在桌面skip；API顺序测试桩曾因DOM尚未建立/ScreenOrientation不存在失败，桩已修正为HTMLElement.prototype与完整screen.orientation对象，Chrome/WebKit聚焦重跑通过；源功能未因此改动。
- 22份inspector截图已生成，artifacts/evidence-mobile-performance.json。目视mobile-tunnel有一次车身表面不见/路面透出异常，保留并继续查，不能假称全视觉通过。考虑冷启动GPU预编译，但尚未实施或验证根因。

## 下一步
1. 提交当前已验证手机优化/横屏全屏阶段，保留异常说明。
2. 重复冷加载手机tunnel/换车，定位偶发材质/绘制缺失；检查renderer.compileAsync预热是否有实际帮助，不能无证据称已修复。
3. work/manual-route.mjs未运行，且route.nearest不存在需改nearestRoad(x,z,route)。继续真实输入主环/支路与最终逐项审计、10类视觉评分；当前goal active，用户没有要求暂停。

## 当前可用服务
- dev 5188，exec session29673，http://localhost:5188/ (LAN 192.168.3.10)。
- production preview4188，exec session40693，http://127.0.0.1:4188/。
- 稳定LAN生产5190，exec session79618，http://192.168.3.10:5190/。
- 子路径静态示例4190，exec session61671，仅本地。
- 私有Site仅预登记未发布；commit技能禁止push，本轮不走外部部署。

## 剩余差距
- 仍有程序化树冠/岸线和部分设施形体需更自然；持续目标未达成。
- 手机Chrome/WebKit引擎功能已验证，缺真实设备GPU/手感与Safari宿主差异证据。
- 未运行本轮完整canvas inspector/视觉scorecard，不应声称整体premium验收已通过。
- 并行子任务已结束；文件全部可由主代理接管。原外部生成服务凭据缺失，当前使用程序化与Poly Haven CC0扫描资源。
