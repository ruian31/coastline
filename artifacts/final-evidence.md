# M85 · 季节光照已更新试玩

- [47源/4包SHA](season-light-m85/build-source.json)、[原子发布](season-light-m85/local-release.json)通过；主包ChRFySFK987857B/CSS17996B，三入口12行一致、34旧JS保留。普通无query[原资源/压力/实际驾驶](fineleaf-season-light-m85-release/result.json)4.94m，[实际季节与光照菜单](fineleaf-season-light-m85-release/season.json)再32.93m/5.7497季节秒，太阳/天空/环境/水面与保存系数一致、测试关闭/GL0/0错误，两原图已看。
- [CPU时钟/新旧迁移](season-light-m85/timeline-cpu.json)、[11524全天季相光样本](season-light-m85/lighting-cpu.json)通过。[浏览器批次与原失败](season-light-m85/browser-summary.json)：最终源码三端5通过/1诊断滞后失败（4.48e-6），等待实际暂停诊断同步后手机单项1通过，不能称一次6全过。实际水面GL值、固定/连续/晴云回晴、真实菜单停时变化、保存/重载覆盖；三张代表车内及三菜单图已看。
- 单次独立审查找出停时循环未响应季节；[旧候选正常菜单反例](season-light-m85-stopped-counterexample/result.json)差.0016211。现过程复用4Hz原天空RT、季节端点单次force。[正常速度实际菜单驾驶](season-drive-light-m85-stopped/result.json)60.8643季节秒/712.45m，18.7小时不动、235天空更新、1931镜面pass，最后实际RT gainA/B=.2548/.098；没有合成季节秒/驾驶步/瞬移。5个15秒编码帧及phase-3/winter-start原图已看，不作逐帧或完整年循环保证。
- [默认完整世界8对独立FBO](season-light-m85-default/result.json)：7对逐通道相同，电脑active-play连续13h有2通道差1级、均差5.43e-7，重复稳定/非空/GL0。没有隐藏花丛；默认中性夏季CPU preset保持原对象。原摄影天空与水/物理/压力/几何源保持，没有M84试验代码。
- [修后工作64图](season-light-m85-study-second/result.json)与[正式源码32图](season-light-m85-source/result.json)各8联图已看，前灯关闭、晴天、固定相机/车位，是真实静态季相对照，不能当季节日长/太阳轨迹/自然年或真机性能。第一批工具Vector3乘Color导致NaN海面已拒绝并保留，非产品缺陷。
- [同机成本](season-light-m85/cost-summary.json)：候选树P50/P95=5.259/10.405ms、镇5.368/8.911ms，树>12ms帧3→19；CPU约−2.03%/−3.51%，不宣称提速。候选峰260calls/784869tri、末树210geo54tex/镇211geo56tex，与控制内存数相同，旧预算超额保留。不是停时过渡最坏工况或一加12/iPhoneFPS。
- 夏中性、春轻冷、秋微暖、冬柔冷，与同一60秒过渡/存档联动；没有新增图片、几何、RT或渲染阶段。季节日长/太阳轨迹、48分钟正常年、自然群落丰富度、新真机接受与旧录制异常仍未完成，World1.5/Lighting2.25不升，Goal active。

## M83 · 立体花期已更新试玩，M84天空试验拒绝

- M83源码提交87bc150；[本日新构建逐字一致](flowers-m83/rebuild-equality-nov8.json)、[三入口原子发布](flowers-m83/local-release.json)通过，32旧JS保留。普通无query[启动/原资源/压草绑定](fineleaf-flowers-m83-release-nov8/result.json)4.85m，[季节菜单](fineleaf-flowers-m83-release-nov8/season.json)再32.93m/5.7665季节秒、bloom.42→.4264003、GL0/0错误，两原图已看。5190当前BHzhewW7 986005B；新花期仍待真机体验。
- M84[显式HDR背景](sky-capture-m84-direct-first/result.json)22秒1315帧44黑；[固定颜色反例](sky-capture-m84-solid-first/result.json)1320帧35黑，正常帧颜色与HDR不同。未解决，产品源码已还原；工作源码/patch留存，未将此试验发布或称作修复。录制异常仍列已知限制，普通不录制旧检查的3900帧范围不扩展。

## 当前M83 · 2026-11-08

- 原位弯瓣/折叶/茎/花心与连续bloom接入既有单批/风/压力，300/380面每5株，无新图片。旧季节存档只补新增花期字段，原地表状态保留。
- [CPU时间线/迁移](flowers-m83/timeline-cpu.json)、[最终几何](flowers-m83-second/geometry-cpu.json)、[三浏览器6项](flowers-m83-browser/browser-first.json)通过，192.38s、0失败/跳过/重试。3张菜单图已看。[最终24图](flowers-m83-refined/result.json)四联图全看，8世界/16隔离图库分别计；图库不是接地/运动证明，仍有程序化形体限制。
- [手机GPU](flower-shader-m83-mobile-stress/result.json)/[电脑GPU](flower-shader-m83-desktop-stress/result.json)：真实落点四开合与合成车压力、20根点误差<.002mm/根位移0/无埋尖；较陡合成坡面的端点法线dot>.9996，仅省略地面法线修正的反事实.346–.855，GL0。中间插值最小约.977；不是实际驾车碾花或轮迹恢复证明。
- [早期注册实例矩阵](flowers-m83-world-identity-second/result.json)两端43/42批、66270/41358实例与M82精确一致；后续只修花形/着色。[最终非花FBO](flowers-m83-isolation/result.json)隐藏原花批后四组逐通道0差、GL0，不冒充完整默认图一致。
- [真实菜单驾驶](season-drive-flowers-m83-first/result.json)60.5976季节秒/709.45m/1921镜面pass，花期春端点/冬中断通过；5个间隔编码帧和phase-3/winter-start原图已看，录像出现黑天，未判全视觉通过。[成本](flowers-m83/cost-summary.json)树5.238/18.713ms、镇5.595/9.401ms，树尾上升、峰265calls/787010tri，旧预算保留，不称提速/手机FPS。
- 黑天调查：[旧M82录制](sky-capture-m83-m82-control/sky-video-audit.json)、[主画布直接读回](sky-capture-m83-readback/result.json)及[完整GL状态](sky-capture-m83-full-state/result.json)均支持录制条件下确有黑输出，非仅VP8编码。背景draw1/12、绑定、矩阵、强度/曝光正常。背景draw后GL查询会改变复现条件，不能当修复；远裁面/renderer重置/buffer保留均失败。[不录制65秒](sky-capture-m83-no-video-long/result.json)3900帧0黑，[重新开启录制](sky-capture-m83-video-repeat/result.json)1321帧43黑，因果机制仍待查明。
- [47源/4包SHA](flowers-m83/build-source.json)已核对，BHzhewW7 986005B/CSS17996B，未包含任何天空工作补丁。M83现已提交并更新普通5190；World1.5/Lighting2.25不升，Goal active，继续季节光照与自然群落，录制限制保留。

## 当前M82 · 2026-11-08发布

- 地表返绿覆盖加入宽范围颜色限制，减轻部分暖土染绿，无新图/几何；这是有限近似。强限制12图及宽范围8图工作对照已看，前者使春坡过干而拒绝；[正式源码16图](season-soil-m82-source/result.json)4张联图均已看、GL0/0错误。
- 11月2日[三浏览器3项](season-soil-m82/browser-first.json)71.30s、0失败/跳过/重试；[默认FBO](season-soil-m82-default-source/result.json)两端各两机位与M81逐通道0差、重复稳定/非空/GL0。[完整RAF成本](season-soil-m82/cost-summary.json)树P50/P95=4.784/7.661ms、镇4.728/9.854ms，镇旁有上升、max28.17ms，不称提速/手机FPS。
- 11月8日确认旧句柄缺失及端口无监听后恢复服务；[新构建一致](season-soil-m82/rebuild-equality-nov8.json)证明新tsc/Vite输出与已验证候选HTML/4包逐字相同，不将旧测试改称本日重跑。[46源/4包SHA](season-soil-m82/build-source.json)、[原子发布](season-soil-m82/local-release.json)三入口12行一致、30旧JS保留，无push。
- [本日普通无query入口](fineleaf-season-soil-m82-release-nov8/result.json)4.94m、原资源/压草/116投影单缓存/测试全局关闭；[实际季节菜单](fineleaf-season-soil-m82-release-nov8/season.json)32.96m/5.783季节秒、存档与地表/草毯uniform同值、GL0/0错误。两原图已看。5190/session81080、LAN10.36.133.114，候选4220/session46895。
- 花期/季节光照、精确生境分区与自然风景质量仍不达标，World1.5/Lighting2.25保持；Goal active。新增天气/季节仍无真实设备复核，旧镜面/昼夜接受范围不扩大。

## 当前M81 · 2026-11-02

- 普通菜单新增四季选择、60秒连续手选过渡与可选48分钟自然年；完整中途表面/目标/进度和剩余季节时间保存。默认夏季、天气/昼夜独立，花期/季节光照与精确生境遮罩仍未完成，F06不全勾选。
- [CPU](seasons-m81/timeline-cpu.json)通过自然边界顺序、大区间/8700小步一致、中途保存和坏数据整体拒绝；[三浏览器6过](seasons-m81/browser-first.json)171.50s、0失败/跳过/重试，包括既有表面身份与新菜单/保存/重载/欢迎冻结/实际恢复/中途改选。3菜单原图已看。
- [新构建默认FBO](seasons-m81-default-source/result.json)两端各两机位相机/车位相同，重复稳定、非空、GL0，M79→M81所有通道0差。地表、草毯、Scenery及两物理源SHA与M80相同；前32幅季相图/两端压草属于M80证据，不算本轮重测。
- [正常速度实际菜单驾驶](season-drive-m81-first/result.json)60.8143季节秒/712.01m/60样本、途中真实车内/1931镜面pass、春端点/暂停冻结/冬中断恢复、0错误。无季节时间或车辆步进钩子。[5编码帧](season-drive-m81-first/filmstrip.png)和phase-3/winter-start原图已看，不称逐帧/真机或正常速度完整48分钟年循环。
- [成本复核](seasons-m81/cost-summary.json)：树旁P50/P95=4.694/6.119ms，镇旁5.002/8.365ms/max22.55ms、16帧>12ms；CPU任务约−3.38%/+0.85%。每状态540有效完整RAF含镜面/1世界重烘及8s4倍CPU。没有解释/撤销原M80尾部，不称无成本或提速，既有预算超额保留。
- [46源/4包SHA](seasons-m81/build-source.json)、[本地原子发布](seasons-m81/local-release.json)三入口12行一致，index-Bxq5BN8V.js981308B/CSS17996B、28旧JS保留，无push。5190/session87917，Wi-Fi192.168.3.10。
- [普通无query入口](fineleaf-seasons-m81-release/result.json)4.85m/原资源和压草/116投影单缓存/测试全局关闭；[实际季节菜单启动/保存](fineleaf-seasons-m81-release/season.json)32.80m/5.75季节秒、地表与草毯uniform和存档一致、GL0/0错误。normal/season-playing两原图已看。
- 新增天气与季节尚无真实设备复核；World1.5/Lighting2.25保持。自然群落、陡坡可读性、花期和季节光照继续，Goal active。

## M80表面内部阶段 · 2026-11-02

- 四季表面共享状态与60秒过渡已接入地表、近中远草层；默认夏季沿用原景观，普通菜单/保存/自然年/花期/季节光照未接。5190继续已提交M79，不以内部钩子充当可玩四季。
- [CPU模型](seasons-m80/timeline-cpu.json)与[三浏览器3项](seasons-m80/browser-first.json)通过，79.41秒、无失败/重试/跳过；实际编译uniform、几何/实例缓冲和压力对象身份、暂停及中断连续性均检查。
- [源码32幅代表画面](seasons-m80-source/result.json)的8张联图全部看过，0错误，同机位相机/投影/车位精确一致。[源构建默认独立FBO](seasons-m80-default-source/result.json)两端各两机位、重复读回稳定且非空，M79/M80夏季所有通道0差、GL0。早期默认canvas读回差异保留为工具局限，不作默认渲染缺陷证据。
- 春季实际GPU草探针：[手机](grass-canopy-seasons-m80-mobile/result.json)/[桌面](grass-canopy-seasons-m80-desktop/result.json)，两状态根点贴地、稳定世界身份、轮迹/双侧拨动及0/20/45/65秒模拟恢复通过，不称本轮真实65秒等待。
- [正常速度季相驾驶](season-drive-m80-first/result.json)60.6976季节秒/709.49m/60样本、途中实际切车内/1926镜面pass、春季精确端点、暂停冻结及冬季中断后恢复，0错误。[5个15秒间隔编码帧](season-drive-m80-first/filmstrip.png)和阶段原图已看，不是逐帧或真机FPS。
- 单次只读审查无可确认实现缺陷；指出暖色裸土也可能被颜色遮罩选中，近处春季裸地偏绿。保留有限遮罩/夏秋差异轻/缺花期光照等范围限制，不提高World1.5/Lighting2.25，不称整体风景接近满分。
- [完整RAF成本](seasons-m80/cost-summary.json)：M79控制/M80夏/M80春串行、每状态540GPU+8秒4倍CPU；夏树P95升至17.584ms/max27.40ms，29帧>12ms，原因尚未隔离。内存计数相同、无新增位图和几何，不推导无成本或手机流畅结论。Goal active，继续下一阶段。

## 已发布M79 · 2026-11-02

- 普通菜单提供晴天、多云、海雾、细雨及自然变化；手选45秒连续过渡、暂停/后台冻结、保存中途模型/湿度。单批惰性雨池、五类风uniform、共享海水风浪/雨后湿材质、雨声与Rapier抓地已接入。遮雨使用真实洞顶，原驾驶/相机/海岸进退水几何保持。
- [CPU天气/保存](weather-m79/timeline-cpu.json)、[受控三车干湿物理](weather-m79-vehicle/result.json)、[原27物理工况](weather-m79-vehicle-regression/result.json)通过。9组干燥轨迹与f45d825全状态哈希一致；湿转向有实际变化，当前制动停止距离未变，不写成更长。
- 三浏览器分批：[菜单/保存/音频3过](weather-m79/browser-menu-first.json)、[天气/海水/镜面15过](weather-m79/browser-regression-first.json)、[雨池生命周期3过](weather-m79/browser-lifecycle-first.json)，分别107.36/340.16/57.82s，无失败/重试/跳过。不是同一次21项调用。三菜单原图全看。
- [最终24机位](weather-m79-final/result.json)与desktop/mobile各两张按比例联图全部看过，0错误；五类实际uniform与weather.wind一致。[天空/海水光学](weather-m79-optics/result.json)六组合GL0、边界.009918/.12。草实际GPU探针[手机](grass-canopy-weather-m79-mobile/result.json)/[桌面](grass-canopy-weather-m79-desktop/result.json)四工况根点误差<.03mm、稳定世界身份、轮迹/双侧拨动与恢复通过；年龄恢复为GPU模拟，并非本轮等待65秒。
- [沥青实际shader湿润输出/物理/雨场](weather-m79-surfaces-fixed/result.json)四工况通过：洞内shaderWet0/physicsWet0/无雨，出洞恢复。先前洞口被旧宽范围当作洞内的[failure](weather-m79-surfaces/failure.json)保留；已按实际洞顶统一。48²局部屋顶场与雨16²采样支持不认证所有建筑屋檐。
- [正常速度实际UI驾驶](weather-drive-m79-second/result.json)46.6814天气秒/530.19m、镜面1316次、昼夜同时流动、Android原生触控接管/暂停冻结/20秒回晴，0错误。原WebM9103945B，5个间隔编码帧及rain-1/rain-3/clearing三原图已看；不称逐帧或真机FPS。首次诊断缓存观察失败保留，等待实际恢复状态后通过。复现：WEATHER_DRIVE_LABEL取新标签，运行scripts/playtest-weather-drive.mjs。
- [完整RAF成本摘要](weather-m79/cost-summary.json)：M78晴控制→M79晴/雨，540有效GPU/状态+8秒4倍CPU，镜面与世界重烘纳入。雨树/镇P50/P95=4.214/5.794和4.872/6.857ms，CPU+2.53%/+0.83%；晴最大33.90ms、雨最大14.13ms，不称提速/真机FPS。雨末213geo/58–60tex、峰267calls/780105tri，旧超额保留。
- [45源/4包SHA](weather-m79/build-source.json)、[原子本地发布](weather-m79/local-release.json)：C01K7Jio976130B/CSS17972B，三入口12行一致、26旧JS保留，无push。[普通无query检查](fineleaf-weather-m79-release/result.json)前进4.85m/116投影单缓存/原资源与压草/测试全局关闭；[真实菜单启动天气](fineleaf-weather-m79-release/weather.json)启动雨池、湿润及保存通过，两原图已看。5190当前session87917，Wi-Fi192.168.3.10。
- 新天气已请求一加12复测，真实iPhone和完整自然天气旅程待验；World1.5/Lighting2.25保留，其余类别未重评，无新平均分。自然群落/陡坡可读性与F06季节尚未完成，Goal active。

## M78 · 共享大气天气已验证，F08仍在开发 · 2026-11-02

- 用户选择舒适观景、偶尔海雾/细雨。Weather.ts的共享时钟/45秒过渡/晴段较长的自然计划/湿干模型，WeatherSky.ts的惰性线性HDR合成、天空/IBL/直射/场景雾/海面反射已实现；天气仅测试钩子可选。普通菜单、雨粒、雨后材质、植被风、声音、抓地、保存尚未完成；不发布5190、不称完整天气或总体Goal通过。
- `artifacts/weather-m78/timeline-cpu.json`由`scripts/test-weather-timeline.mjs`完成45秒、改选、非活动冻结、1800秒确定性、1650秒自然计划、90秒雨段开启与湿干数学检查。物理/材质尚未消费wetness。
- `artifacts/weather-m78/browser-fourth.json`最终三浏览器6通过/0重试/0跳过，100.90s；`browser-regression.json`原昼夜开关/欢迎冻结/地形GL深度/夕阳缓存12通过，213.61s。不是同一次18项调用。三份先前失败报告保留，诊断80ms缓存通过等待新帧解决；WebKit原5秒观察过短，活动样本帧39→45/seconds .1→.7/paused false，而本机晴天fps约1，扩大到20秒同阈值，不称iPhone性能。
- `artifacts/weather-m78-final/result.json`32幅（两端×晨曦/正午/夕阳/夜×clear/cloudy/fog/drizzle大气参数），desktop/mobile联图32格全看、0错误。drizzle此时仅大气，无雨粒，不以标签冒充细雨完成。first24/horizon24早期图保留并全看，最终新增晨曦、HDR峰值限制及海面距离雾；旧图不冒充最终源码。
- 一次独立只读审查提出固定晨曦HDR clamp和自定义水面无天气距离雾，已改owned HDR RepeatWrapping及水面同exp²距离衰减。`scripts/check-weather-atmosphere.mjs`实际GPU半浮点RT读回：`weather-m78-optics/result.json`六组合、source wrap1000/GPU10497、dawn yaw.5、边界曲率最大.009918/.12，水/场景雾绑定相同、GL0。不是全部天空艺术验收。
- `weather-m78/cost-summary.json`与`mirrors-m67-profile-m78-{control,cloudy}/result.json`是串行同机Android844低档cycle13车内树/镇对照，分别540完整RAF GPU+8秒4倍CPU；新增大气有成本、镇P95升至13.806ms/max35.466ms，不称真机FPS/提速。详见文档09。
- `weather-m78/build-source.json`记录当前14源文件/4包SHA：index-YOla8uRP.js963820B、CSS17947B，物理源码未改。稳定5190仍CPz7ET6p/M76；4216/session27895仅工作候选。World1.5、Lighting2.25沿用，不因天气层提高自然风景总体验收。

## M77 · 两种局部岩脚形状均未采用 · 2026-11-02

- 范围：同一40m岩段，原材质/植被/道路保持。`work/build-cliff-apron-m77.mjs`构建控制、第一版和joined工作版；`artifacts/cliff-apron-m77/recipe-{control,candidate,joined-candidate}.json`记录变换与源码SHA，不是正式发布。
- 第一版32幅：`cliff-apron-m77-first/result.json`，两版×desktop1280×720/mobile844×390×cycle13/原固定golden×接近/车内/近/侧。四联图均看过，desktop初版联图压宽，不能据此判比例。候选496面/250顶点/744边/Euler2/无退化坏边，周界采样埋地至少约20cm；接地采样不是精确三角相交证明。真实驾驶视角仍像独立低土包，拒绝。
- 可见性：`cliff-apron-m77-visibility/result.json`及三个visible原图均已看。临时发光材质/原几何，遮挡前后投影计数为接近2366/4727、近6356/10513、侧1034/1960。仅用于分离遮挡原因，不当最终效果。
- 第二版16幅：`cliff-apron-m77-joined/result.json`及`comparison.json`；原控制16幅复用，同姿态/相机全部精确匹配、GL0/错误0，四张按比例留边的联图32格全部已看。原岩面三点扫描/内嵌坡脚仍496面；体积桌面432.23/手机430.45m³、拓扑正常/无fallback，但最高周界相对max(地面,原岩面)外露5.90/9.96cm，不能称无缝。纹理形成浅色规则斜条带，车内与近景突兀，拒绝。
- 未改变产品源码/public资产/稳定dist；没有被拒形状的运动、碰撞、压草或性能通过结论。World1.5/Lighting2.25沿用。5190本轮重启session87917，当前Wi-Fi192.168.3.10，HTTP200；仍为ae4dde4地形阴影修正，不是M77发布。F06季节/F08天气仍未完成。

- 只在大地形缓存深度draw中加入slope polygon offset .5/2，正常颜色、对象caster和receiver normalBias .035保持，自有深度材质复用并释放，无新增目标/贴图/pass。[三浏览器](daynight-m76/browser-terrain-depth.json)一次11过/1设备条件跳过、144.84秒，无失败/重试；[实际GL状态](daynight-m76/terrain-depth-gl-summary.json)每端4次地形偏移正确/1材质UUID，460–464次对象深度draw偏移关闭、颜色无偏移/仍接收阴影、GL0。
- [有效32工作图](daynight-m76-terrain-depth-study-active/result.json)与[16接触场景图](daynight-m76-terrain-depth-contacts/result.json)联图全部已看；首轮同名代理Scene误判、实际applied=0的32图排除。最终源码[20代表图](daynight-m76-terrain-final/result.json)/[桌面](daynight-m76-terrain-final/desktop-contact.png)/[手机](daynight-m76-terrain-final/mobile-contact.png)全部已看、0错误；两端均844×390低档，实际昼/夜/出洞/小镇等，不混为一次68项正式采集。
- [真实键盘/原生触控驾驶](daynight-m76-terrain-drive-verified/summary.json)：323.78/348.69m、各3次重烘、镜面/暂停恢复、0错误；[阶段图与6个稀疏编码帧](daynight-m76-terrain-drive-verified/contact.png)已看。键盘段邻护栏时短暂减速未独立取接触证据，不称无碰撞路线。脚本80ms旧诊断、正午观察时长不足的两次失败保留，最终等待状态/延长巡航而保留重烘断言。
- [完整RAF成本](daynight-m76/terrain-depth-cost-summary.json)控制→补丁树旁GPU P50/P95 4.212/9.674→4.796/9.292ms，镇旁4.665/9.696→3.976/7.008；各540有效/无disjoint、均镜面且含实际世界重烘。CPU任务约+3.8%/+1.8%，不称总体提速/真机FPS。补丁重烘峰248/260calls、775279/775804tri；末210/211geo、54/56tex，旧预算超额保留。
- [源码/11资产](daynight-m76-terrain-final/build-source.json)、[本地原子发布](daynight-m76-terrain-final/local-release.json)三入口33行验证/24旧JS保留，无push。CPz7ET6p952723B、物理源码SHA未变。[普通入口](fineleaf-m76-terrain-release/result.json)5.03m、[菜单开启循环](fineleaf-m76-terrain-release/cycle.json)再5.95m/18.712667h，原资源/压草/116投影单缓存/测试全局关闭、0错误，两原图已看。World1.5/Lighting2.25保持，真实本补丁手机数据未测；Goal active，下一步实际验证已准备的M77局部岩脚形体，四季/天气仍待实现。

# M76补正 · 天空亮条已修正，继续地形自阴影

- [实际HDR边界旧版](daynight-seams-m76-before/result.json)曲率.879071、[新源码](daynight-seams-m76-after/result.json).038298，固定上限.12，旧版真实失败记录保留。让RepeatWrapping处理源采样，不先fract破坏导数；HDR资产未改。[shader范围等价](daynight-seams-m76-after/shader-only-equivalence.json)证明其余缓存/时钟/管线不变，不把它当性能测试。
- [三浏览器受影响检查](daynight-m76/browser-seam-optics.json)一次3通过、无失败/跳过/重试，104.78秒；[实际环境GPU读回](daynight-seams-m76-after/gpu-radiance-blend.json)双端误差仍.000772476、单源零混合draw。[8幅最终源码非关键时刻](daynight-m76-seam-final/result.json)/[联图](daynight-m76-seam-final/contact.png)全部已看、0错误；两端均844×390流畅档，原12关键机位属于补丁前，避免并为同一最终采集。
- [源码/构建](daynight-seams-m76-after/build-source.json)、[原子本地发布](daynight-seams-m76-after/local-release.json)核对4211/5190/LAN的11资产/33行，保留22旧JS，无push。BQ0R3W1w952506B/CSS17947B。[普通入口](fineleaf-m76-seam-release/result.json)前进4.85m、[菜单开启流动](fineleaf-m76-seam-release/cycle.json)再行5.99m、18.712888小时；原资源/压草/116投影一次缓存/测试全局关闭，0错误。普通两图已看。无新手机或性能结论；坡面暗纹继续处理，M77岩脚工作尚未构建，World1.5/Lighting2.25保持，Goal active。

# M76 · 可选连续昼夜已更新本地试玩

- [试玩](http://10.158.204.114:5190/)暂停菜单开启“时间自然流动”，30分钟一昼夜；默认仍固定18:42。天空、环境辐射、日/月光、雾、海水与阴影共同变化，暂停/未开始不推进，可冻结当前时间并记住偏好。正常速度完整一昼夜已走完，回放发现的天空环绕亮条/坡面自阴影仍需修正，四季/天气尚未实现，World1.5/Lighting2.25保持，Goal active。
- [CPU时间线](daynight-m76/timeline-cpu.json)2881时刻、边界连续性/时钟格式通过。[实际GPU辐射读回](daynight-m76/gpu-radiance-blend.json)半浮点等权混合最大相对误差0.000772476，单源免混合draw。[12正式机位](evidence-daylight-cycle-m76.json)两端六时段及月夜车内，[桌面](pass-m76-daylight-cycle-final/desktop-contact.png)/[手机](pass-m76-daylight-cycle-final/mobile-contact.png)联图全部已看、0错误；峰桌面155calls/768435tri/206geo/58tex、手机112/294170/203/55，不当运动或手机FPS证明。
- 浏览器分批而非一次总数：[基础回归](daynight-m76/browser-source-full.json)16过/5条件跳过；[过滤和时钟](daynight-m76/browser-cycle-mips-final.json)10过/5跳过；[最终生命周期](daynight-m76/browser-final-source-lifecycle.json)3过；[最后取消所有权修正](daynight-m76/browser-cancel-owner.json)4过。[实际有窗口失焦](daynight-m76/browser-headed-native-focus.json)2过，观测hidden:false/focused:false，只证明失焦暂停，不当手机后台。失败历史和条件跳过见文档08。[活跃方法字节等价](daynight-m76/active-loop-equivalence.json)说明最后取消修正与已测渲染版本关系。
- [完整RAF成本](daynight-m76/cost-summary.json)M75固定/M76固定/循环夕阳/月夜，每两状态各540有效GPU帧，含镜面和实际世界重烘；镇旁夕阳循环GPU中位2.985→4.479ms，不能宣称整体提速。循环烘焙峰265calls/777945tri，镇旁末211geo/61tex，已有预算超额保留。[冷源原生RAF](daynight-m76-cold-prefetch/result.json)两状态各10秒，P95约16.8/max33.4ms、无超过50ms，源准备确实发生；主机短测不代表手机或热稳定。
- [源码/11资产SHA](daynight-m76/build-source.json)、[原子本地发布](daynight-m76/local-release.json)核对4209/5190/LAN共33行、20旧JS保留，无push。主包DzRHJTJG952364B，车辆物理源码SHA不变。[普通入口](fineleaf-m76-cycle-release/result.json)前进5.03m、原资源/压草/116物体一次缓存及测试全局关闭；[菜单开启循环再驾驶](fineleaf-m76-cycle-release/cycle.json)前进6.00m、时钟18.7→18.712665、测试/工作钩子仍关闭，0错误，两张原图已看。[本轮一加12 Chrome反馈](daynight-m76/phone-feedback.json)确认开启流动后“主画面和后视镜都顺畅”，这次体验通过；无新增帧时间或热稳定采样，iPhone仍待实测。

- [正常速度完整一昼夜](daynight-m76-full-normal/summary.json)：1800.918秒/24.005483小时/21.472km，山路往返、12次隧道区间、夜间/白昼车内切换通过，0错误/天空源峰3份；[完整录像](daynight-m76-full-normal/full-day.webm)及[10个稀疏编码帧](daynight-m76-full-normal/video-contact.png)已抽看，不称逐帧或真机验证。录像/观察/轻量CPU研究并存的108000 RAF中3次>50ms、最大266.6ms，不能当隔离性能。1Hz峰177/396266/211/65会漏短烘焙，旧预算问题保留。`scripts/check-daylight-long-drive.mjs`保留实际长跑方法。
- [实际GPU隔离](daynight-m76-sky-diagnosis/result.json)复现亮条，RT读回可见经度细线，去除source lookup前的fract后同机位消失；坡面关闭接收阴影后规则暗纹消失。只是定位和临时运行对照，源码尚未修正、未更新试玩，不把功能长跑通过写成视觉验收通过。

# M75 · 五个固定海岸时段已更新本地试玩

- [试玩](http://10.158.204.114:5190/)暂停菜单“海岸时段”可选晨曦/正午/原夕阳/暮色/月夜并记住偏好，默认18:42；背景与IBL、太阳/半球/雾、海水和世界阴影同步，暂停镜面各刷新一次后冻结。**连续昼夜、四季和天气仍未实现**，World1.5/Lighting2.25保持，Goal active。
- [来源配方](../source-assets/daylight-skies.json)、[输出验证](daynight-m75/source-validation.json)：四份Poly Haven CC0纯天空/4563942B、正午/月夜精确gain2，独立逐值乘回原RGBE零误差，太阳/月光方向校对。默认原天空不改且不请求其他时段；失败/过期选择保留当前有效场景。第一次正规化255/256差异失败保留并修正。[单次独立审查](daynight-m75/review.json)发现重烘临时target释放后为null，已修为每次独立离屏目标并加浏览器断言。
- [分两批去重浏览器](daynight-m75/browser-consolidated.json)9通过/3条件跳过、最终0失败；当前界面/昼夜6通过，另镜面3项仅CSS修正前通过，[源码等价](daynight-m75/css-only-equivalence.json)保留。不是一次9项调用，不称真实iPhone。WebKit网络与移动端机位控制流条件跳过，失败历史和修正理由见文档08。[镜面五档CPU](daynight-m75/mirror-invalidate-cpu.json)保持每主帧最多1pass与暂停两镜各补一次。
- [12正式同机位](evidence-daylight-m75.json)的[桌面](pass-m75-daylight-fixed/desktop-contact.png)/[手机](pass-m75-daylight-fixed/mobile-contact.png)全部查看，0错误；首漏query与异步机位行驶记录保留，最终临时冻结后同时间/位置。[三车夜间及前灯开/关](daynight-m75-night-cars/result.json)、[8图联图](daynight-m75-night-cars/contact.png)全看，实际路面ROI开灯更亮。车灯遮挡漏光限制仍在，不宣告F04完整验收。
- [实际夜间驾驶](daynight-m75-motion-final/result.json)：键盘75.42m/触控78.26m，制动倒车最低−3.41/−3.38m/s，再前进转弯、转头/新侧镜更新、暂停恢复及外部视角，0错误。[22.48秒桌面](daynight-m75-motion-final/desktop-keyboard.webm)/[19.56秒原生Android触控](daynight-m75-motion-final/android-touch.webm)只抽查[6个编码时间样本](daynight-m75-motion-final/sampled-frames.json)和[联图](daynight-m75-motion-final/filmstrip.png)，Android末样本为暂停菜单，另侧看/外部原PNG已看，不称完整逐帧或真机帧率。
- [隔离GPU/4倍CPU汇总](daynight-m75/cost-summary.json)：M72→夕阳→月夜每状态90有效整帧GPU样本，活跃峰149/372235/209/56；夕阳镇旁P95 5.123→8.531ms上升，夜景相近，不宣称总体提速。CPU任务接近8s窗口上限，旧预算超额保持；详见文档09。M72一加12体验通过不冒充本轮新时段/循环性能验证。
- [源码/构建SHA](daynight-m75/build-source.json)、[原子本地发布](daynight-m75/local-release.json)核对4207/5190/LAN的9个运行资产（27行）、18旧JS保留，无push。主包CeEI7Ht_937176B，车辆块6139B/Rapier源码未改；[普通入口](fineleaf-m75-daylight-release/result.json)前进5.02m、116投影一次缓存、原资源与压草绑定/测试全局关闭，默认只原sky-mobile.hdr、0错误，[普通图](fineleaf-m75-daylight-release/normal.png)已看。下一步连续时钟/天空与光照过渡，之后继续自然群落和季节/天气。

## M74 · 完整低冠层候选未采用

- Didelta Spinosa完整扫描来自[Poly Haven](https://polyhaven.com/a/didelta_spinosa)，CC0、作者Jenelle van Heerden；官方逐文件size/MD5及本地SHA在work/low-cover-m74-source/downloaded-source.json。不是加州原生物种保证，未新增产品资产。凭据探测三个生成服务均MISSING，无付费生成任务。
- [原生7幅](lowcover-m74-source-shapes/result.json)、[源/简化嵌土9幅](lowcover-m74-lod-embedded/result.json)和完整联图均已查看。large234552面简为9665/15631面，只选前者做实际场景试验。首家族同株两形，far2186面；[首16幅实际对照](didelta-m74-world-first/result.json)与[手机](didelta-m74-world-first/mobile-contact.png)/[桌面](didelta-m74-world-first/desktop-contact.png)联图0错误、原摆放/数量/上限保持，但鲜绿和变宽矮不协调，未采用。未替换的中央coastal_tree不算新资产收益。
- 一次独立只读审查确认任意64格native coverage穿叶/树皮的问题。修正版采用未膨胀、线性光alpha加权native mips，真实large/medium两株near9665/6446、far2186/1592；只对隔离叶片减饱和/亮度，243964像素变化、542722树皮像素逐字相同、原alpha零差值。[烘焙](scrub-impostor-bake-m74-didelta-muted/result.json)颜色校准0、法线1码值，单位法线最大误差.006465。
- [修正后16幅实际对照](didelta-m74-world-muted/result.json)与[手机](didelta-m74-world-muted/mobile-contact.png)/[桌面](didelta-m74-world-muted/desktop-contact.png)联图全部已看，摆放SHA/数量/近景上限与M72控制一致、0错误；叶色偏冷灰，整体自然层次收益仍有限，**不采用整家族替换、不发布5190**。未做运动、压力、三浏览器或GPU性能验收；两轮控制机位重叠，不计32项独立验收。World1.5/Lighting2.25保持，Goal active。下一阶段天空/统一光照与F07昼夜变化；四季、天气尚未完成。

## M73 · 草坡牵引原因已分离，继续自然风景

- [受控36工况](vehicle-slopes-m73-verified/result.json)由`scripts/measure-vehicle-slopes.mjs`直接调用当前VehicleDynamics：三车型、道路/离路、六个坡度，1/60固定步长，3秒服务制动稳定/零速重置后12秒全油门，之后无赋值移动。2000米平面、边界/有限状态断言；[初版400米平面](vehicle-slopes-m73/first-short-plane.json)最快平地车驶出边缘，已排除并以更大平面重测。经典离路15/20/25度前进38.20/8.15/0.28m，GT25度5.74m，Sport25/30度37.70/11.95m，全部最终四轮接地。
- [当前世界观察配方](slope-m73-source/recipe.json)、[现场汇总](vehicle-slopes-m73/live-summary.json)与[桌面原始](slope-m73-source/desktop-observed.json)/[手机几何原始](slope-m73-source/mobile-observed.json)保留。工作4199构建仅暴露原私有物理及几何供观察，不能发布。真实键盘W8.5秒/S3.5秒，两档最后2秒四轮接地、底盘解算接触0，末坡度27.44/28.60度，随后倒车−6.14/−6.23m/s、0错误；手机几何档仍是键盘测试，不冒充原生触控或物理手机。[四图联图](slope-m73-source/contact.png)已看。
- [实际世界三车型CPU重放](vehicle-slopes-m73/bank-replay.json)保留原始面/碰撞体/初始位姿及世界SHA，12秒全油门、始终offroad=true，不运行Driving路线/海水边界规则。经典车3.22/5.91m、GT6.93/11.49m、Sport33.88/35.42m并跨坡，末速6.28/5.70m/s。共同支持这段停驶源于当前车型的爬坡力上限；不能据此把旧M64/M67失败路线改作通过，或保证所有离路路线。
- M72一加12镜面“更顺滑，主画面流畅”的确认已提交`c396acf`，UTF8核验/临时消息清理完成，无push。当前稳定5190仍为已接受的M72版本。自然风景层次、陡坡探索路线的可读性、四季昼夜天气与既有预算继续推进；Goal active。

## M72 · 一加12确认镜面顺滑与主画面流畅

- [本地试玩](http://10.158.204.114:5190/)已更新BnTV9v9-/932039B，车辆Bqhv8m_-/6139B、Rapier库SHA不变；[源码/构建SHA](mirror-smooth-m72-build-source.json)、[构建日志](mirror-smooth-m72-build.log)、[原子更新/3地址全部模块](mirror-smooth-m72-local-release.json)保留，16旧JS不删除，无push。当前网络地址从192.168.3.10变为10.158.204.114，需手机与主机网络可互通。
- 两可见镜通常交替各30Hz，总槽60Hz、每主帧最多一次额外render；三可见镜共用预算。deadline跳过错过的槽，避免16.6ms别名降频，不循环补帧。保留大玻璃/目标/mip和手机0/桌面4采样，原冻结/屏外停更保持。固定车身精确保守裁剪，动态车轮/手臂/方向盘不裁剪；紧凑属性独立拥有、原排序包围球和主画面车身在finally恢复。
- [实际12组目标比较](mirror-smooth-m72-body/result.json)三车各三镜+隧道三镜，原车身与精简车身同场景/相机/时间重绘到同一RGBA16F目标，**所有通道逐位差异0**，每次少42921–54270tri。[body联图](mirror-smooth-m72-body/contact.png)已看；QA二次render只在检查脚本，不计作性能。[CPU36射线](mirror-smooth-m72-cpu-rays.json)、[5种RAF时间/暂停恢复/抛错还原/释放](mirror-smooth-m72-refresh-cpu.json)通过；[唯一独立代码/CPU审查](mirror-smooth-m72-review.json)无当前调用链缺陷，未冒充浏览器背书。
- [最终三浏览器](mirror-smooth-m72-browser-final.json)一次3通过/0失败、跳过或重试（154.88秒），[读回/调度/换车资源记录](mirror-smooth-m72-browser-records.json)含实际Chrome两镜约29.6–30.3Hz、典型间隔33.4ms、每主帧最多一次、屏外停更、反射左右和资源不增长。软件WebKit4.52秒8主帧/各镜4次，绝不称iPhone30FPS。[首失败](mirror-smooth-m72-browser.json)WebKit1.5秒仅3帧/分配2与1触发小数阈值，补足至少8实际帧观察后通过，运行冻结逻辑及原像素/资源断言未改。
- [键盘/原生Android触控实际驾驶](mirror-smooth-m72-motion-approved/result.json)78.97/78.67m、倒车最低−3.46m/s，转弯/可信拖动让新侧镜更新，暂停恢复/外部停更与0错误；[19.96秒桌面](mirror-smooth-m72-motion-approved/desktop-keyboard.webm)、[18.88秒触控](mirror-smooth-m72-motion-approved/android-touch.webm)的[6个稀疏编码帧](mirror-smooth-m72-motion-approved/sampled-frames.json)、[联图](mirror-smooth-m72-motion-approved/filmstrip.png)、侧看与外部车身原PNG已看，不称完整逐帧或手机性能。
- [8正式机位](evidence-mirror-smooth-m72.json)及[全部联图](pass-m72-mirror-smooth/contact.png)已看、0错误；[冻结计数](mirror-smooth-m72-render-counts.json)峰桌面143/769323/211/57、手机105/288602/209/55，不替代活跃镜面。顺序[控制](mirrors-m67-profile-m72-m69-control/result.json)→[隔离候选](mirrors-m67-profile-m72-smooth-isolated/result.json)各90完整GPU帧/状态、无disjoint，另8s4xCPU都480帧；[汇总](mirror-smooth-m72-cost-summary.json)镜面pass90→480，任务5099/4867→7751/7798ms，GPU P50 2.811/3.428→3.354/4.135，P95 6.214/9.388→5.613/12.774ms。提高连续性增加工作量，未声称整体提速。首候选有源码搜索干扰的[原记录](mirrors-m67-profile-m72-smooth-final/result.json)保留，已隔离重测。活跃峰149calls/372235tri、209几何/56纹理，旧预算超额继续记录。
- [普通入口](fineleaf-m72-mirror-smooth-release/result.json)前进5.03m、116投影物一次缓存、原纹理/压草/岩石/棕榈绑定正常，测试全局关闭、0错误，[普通图](fineleaf-m72-mirror-smooth-release/normal.png)已看。[证据检查](mirror-smooth-m72-evidence-check.log)8正式+24辅助共32引用通过，不是32个独立测试。
- M72代码已提交`6ecaa6c`，立即检查HEAD中文UTF8正常、临时消息删除，无push。用户随后在一加12Chrome普通入口复核明确“镜面更顺滑，主画面流畅”，该设备本次镜面体验通过。没有额外采集新版FPS，M71旧低频版约60FPS不移作M72数值；iPhone/长时间发热未实测。自然风景、草坡停驶与四季昼夜天气仍未完成，World1.5/Lighting2.25保持，Goal active。

## M71 · 真机主画面约60FPS，卡顿明确在镜内

- 独立检测新增`drive=1`四段真实巡航+10秒手动，记录每15帧状态和可信输入；[配方/SHA](phone-probe-m70/recipe-drive-manual.json)、[主机原生触控端到端](phone-probe-m70/host-drive-manual-final-verification.json)、[完成图](phone-probe-m70/host-drive-manual-final-complete.png)与[操作中图](phone-probe-m70/host-manual-final-active.png)保留，图已查看，0错误。首轮过早读取诊断的失败记录保留，修正为等候实际手动状态发布，未改游戏物理或弱化断言。
- [一加12真实行驶报告](phone-probe-m70/reports/2026-10-30T07-54-53-607Z-a6dc5bf9-7b0a-4c75-bf1c-e7e0c8ab5967.json)：Chrome156/Adreno750、905×411/画布DPR1/低档，巡航ON60.38/OFF60.37/ON59.87/OFF60.37FPS，P95均16.6ms；手动601帧/60.07FPS/P95 16.7ms/max33.2ms、15次可信输入、约125m、无后台切换。ON45/46pass每4秒、OFF0，手动129pass每10秒。用户确认普通画质“自动”，并明确“只有后视镜卡顿，手动自动都卡”。
- 结论修正：主画面流畅，当前中央8Hz/侧镜4Hz导致镜中景物跳动；此前降低刷新率的方向不能解决这个体验问题。下一步提高可见镜面至约30Hz/块，每主帧最多一个额外render并减少无效车身绘制；尚未发布修复、不提高评分或完成Goal。静止真实报告、先前主机性能与失败记录保留，iPhone及热稳定性仍未验证。

## M70 · 历史：真机对照检测准备

- 真实用户M69仍明显卡顿，现提供[手机检测](http://192.168.3.10:5191/?test=1)。独立work构建只给整个镜面update加总开关，5190/正式dist/游戏源码保持；[转换配方与SHA](phone-probe-m70/recipe.json)和[构建日志](phone-probe-m70-build-final.log)保留。可用`npm run diagnose:phone`重建并启动；已存在5191时先退出，不覆盖活跃检测。
- 同路段低档、静止车内，两轮ON/OFF，每段1秒暖机+4秒真实RAF；原始间隔、FPS/P50/P95/慢帧、视口/DPR/GPU和前后诊断自动回传项目目录。[主机端到端](phone-probe-m70/host-verification.json)确认四段顺序、实际低档、ON45/45pass与OFF0/0、0错误；[完成页](phone-probe-m70/host-complete.png)已看。四段主机约60FPS只是采集验证，**不是一加12报告**。Node语法及[重复服务保护](phone-probe-m70/duplicate-server-guard.json)通过，拒绝前后HTML SHA相同。
- 用户已收到约25秒的一键检测请求，真实硬件报告尚未到达。需要据此区分主场景瓶颈和镜面额外负担，当前不继续凭桌面数据猜测调参；未声称修好卡顿、未提高评分或完成Goal。此前已验证的镜面清晰度及全部失败记录保留。

## M69 · 镜面工作量下降，真机仍卡顿

- [试玩](http://192.168.3.10:5190/)已更新CxFJuKZJ/930187B、车辆BwwWFpGI/6139B，Rapier库SHA保持；[源码/构建](mirror-perf-m69-build-source.json)、[原子更新/三地址核对](mirror-perf-m69-local-release.json)保留，14旧JS保留、无push。**一加12复测仍“还是明显卡顿”**，不称真机性能通过；下一步需要区分主场景和镜面单次开销。
- 实际玻璃顶点裁剪修正右镜屏外−2.43px仍刷新的问题。手机中央8Hz/侧4Hz/16槽，桌面12Hz/36槽；手机取消镜内MSAA，保留大玻璃、目标尺寸及三线mip。三方案四手机机位[12幅对照](mirror-perf-m69/compare/result.json)、[联图](mirror-perf-m69/compare/contact.png)已看，选择filtered源码方案。
- [三浏览器专项](mirror-perf-m69-browser.json)一次3通过/0失败、跳过或重试（162.65秒），[读回记录](mirror-perf-m69-browser-records.json)含屏外镜零初始化、真实1500ms内刷新数量上限、反射左右/三车返车/资源不增长/冻结与外部停更。[CPU36射线](mirror-perf-m69-cpu-rays.json)通过。[实际键盘/Android触控](mirror-perf-m69-motion-approved/result.json)78.58/78.50m、倒车−3.34/−3.36m/s，可信拖动后原不可见侧镜确实更新、0错误。视频[20.28秒](mirror-perf-m69-motion-approved/desktop-keyboard.webm)/[18.72秒](mirror-perf-m69-motion-approved/android-touch.webm)的[6个稀疏编码帧](mirror-perf-m69-motion-approved/sampled-frames.json)、[联图](mirror-perf-m69-motion-approved/filmstrip.png)及侧看原PNG已看，不称完整逐帧或真机FPS。
- [8最终机位](evidence-mirror-perf-m69.json)与[联图](pass-m69-mirror-perf/contact.png)全部查看、0错误。[冻结峰](mirror-perf-m69-render-counts.json)桌面143/769323/210/57、手机105/288602/208/55，不当活跃镜面成本。[控制](mirrors-m67-profile-m69-m68-control/result.json)→[候选](mirrors-m67-profile-m69-filtered-final/result.json)顺序各90整帧GPU样本/状态、无disjoint；[汇总](mirror-perf-m69-cost-summary.json)8秒镜面pass160/161→90/91、任务−8.0/−13.4%、脚本−8.7/−13.8%。树旁/镇旁GPU P50 4.606/4.095→3.917/5.159、P95 7.823/6.432→9.729/7.345ms，未一致改善；活跃峰154calls/423500tri、54–56纹理，超额保持。
- [普通入口](fineleaf-m69-mirror-perf-release/result.json)前进5.12m、116投影一次缓存、原资源/压草绑定/测试全局关闭、0错误，[普通图](fineleaf-m69-mirror-perf-release/normal.png)已看。用户仍卡顿，M69只是已验证的工作量减少，没有完成手机修正。World1.5/Lighting2.25保持，草坡/自然风景/四季昼夜天气仍未完成，Goal active。

## M68 · 镜面清楚了，真机性能仍需修正

- [当前试玩](http://192.168.3.10:5190/)已更新Dwj5HiKP/929908B，三入口全部模块SHA相同，[原子更新记录](mirror-clarity-m68-local-release.json)保留12个旧JS，无push。[源码/构建SHA](mirror-clarity-m68-build-source.json)、[构建日志](mirror-clarity-m68-source-build.log)保留。**一加12 Chrome复核“清楚了，但画面更卡”**：清晰度改善成立，真机性能不通过；下一步M69先减镜面开销。
- 中央玻璃/框体及侧镜扩大，低档手机中央66.6×19.1→97.4×31.3 CSS像素，桌面190.2×61.0；主画布DPR1保持。中央384×128/侧192×128，MSAA与三线mip过滤。[16幅工作对照](mirror-clarity-m68/compare/result.json)和[手机联图](mirror-clarity-m68/compare/mobile-contact.png)已看，目标颜色含mip1048560B，另有多采样颜色/深度与驱动开销。
- [专项去重结果](mirror-clarity-m68-browser-approved.json)含同一冻结运行构建的WebKit和最终桌面/Android Chrome各1项通过；并非一次三项全过。实际高度、采样、GL错误、物理左右反射读回、三车切换/返回资源不增长、暂停/外部停更均检查；Chrome手机实际2采样/桌面4，WebKit将请求2取成4。[首轮](mirror-clarity-m68-browser.json)WebKit350ms等待不够；[按帧版](mirror-clarity-m68-browser-final.json)WebKit/桌面通过，Chrome快帧仍不足冷却时长；[最终Chrome](mirror-clarity-m68-browser-chrome.json)加入墙钟等待后2项通过。运行冻结逻辑未改，[独立暂停观察](mirror-clarity-m68/pause-debug.json)记录两镜按当前姿态各补拍后停止；[CPU36射线](mirror-clarity-m68-cpu.json)误差约1.2e-12。
- [实际键盘/Android原生触控](mirror-clarity-m68-motion-approved/result.json)行驶77.76/76.68m，倒车至−3.34/−3.28m/s，再前进转弯、拖动、暂停恢复和回追随，0错误。视频[18.48秒](mirror-clarity-m68-motion-approved/desktop-keyboard.webm)/[18.28秒](mirror-clarity-m68-motion-approved/android-touch.webm)的[6个稀疏编码时间帧](mirror-clarity-m68-motion-approved/sampled-frames.json)及[联图](mirror-clarity-m68-motion-approved/filmstrip.png)已看；另看代表原PNG，不称完整逐帧或真机FPS。
- [8正式视图](evidence-mirror-clarity-m68.json)覆盖两端三车与隧道，[全部联图](pass-m68-mirror-clarity/contact.png)已看、0错误。[冻结计数](mirror-clarity-m68-render-counts.json)峰桌面143/769323/210/57、手机105/288602/208/56，不用于代替活跃成本。[M67控制](mirrors-m67-profile-m68-clarity-control/result.json)→[M68](mirrors-m67-profile-m68-clarity-final/result.json)各90整帧样本/状态、无disjoint，[成本汇总](mirror-clarity-m68-cost-summary.json)保留全部样本。树旁/镇旁P50 5.079/4.538→4.667/4.403，P95 11.749/7.577→12.947/11.030ms；任务+4.0/+1.8%、脚本+4.2/+2.0%，慢帧增加，不称提速。尺寸改变可见范围，8秒镜面pass120→160；活跃峰154calls/423500tri，原预算问题保留。
- [普通入口](fineleaf-m68-mirror-clarity-release/result.json)前进4.94m、116投影物一次烘焙，原资源/压草绑定正常、测试全局关闭、0错误，[普通图](fineleaf-m68-mirror-clarity-release/normal.png)已看。World1.5/Lighting2.25保持，无新整体评分；草坡停驶和自然风景仍未完成，四季昼夜天气保存在文档11。Goal active，未创建重复目标。

## M67 · 三车后视镜历史记录

- [试玩](http://192.168.3.10:5190/)刷新后选择车内。[本地原子更新/三地址HTTP](mirrors-m67-local-release.json)核对主WbwKHcRk/929840B/SHA b911de3f…、车辆C22FCqfk/6139B，Rapier BR_-CEU_仍同M64哈希；先复制资产再换HTML，保留10个旧JS，无push。[源码/构建SHA](mirrors-m67-build-source.json)、[构建日志](mirrors-m67-build-approved.log)保留。
- 三车中央/侧镜由实际驾驶位反射眼点和镜面边界取景，默认−.02方向兼顾后方护栏、海面和路面。三块线性半浮点目标共360448B颜色缓冲，另有深度/驱动开销；手机8/电脑12次每秒上限、单槽分时，暂停保留画面、首次/新姿态补一次，外部视角停更。[唯一独立审查](mirrors-m67-review.json)发现的暂停重复更新已修；不把审查当最终全量背书。
- [最终三浏览器镜面](mirrors-m67-browser-approved.json)3通过/0失败、跳过或重试，117.96秒；[实际读回记录](mirrors-m67-browser-approved-records.json)包含三车切换/回车、资源不累积和停更，QA红/蓝独立反射射线板在256宽真实目标中约2775/2639像素、中心186.6/68.8，左右正确，QA板未进产品。[CPU36射线](mirrors-m67-cpu-final.json)误差约1.2e-12。[首版](mirrors-m67-browser-first.json)资源相等断言过严的失败、[暂停修正版](mirrors-m67-browser-pause.json)、[旧下调角度/草图6项](mirrors-m67-browser-aim-final.json)保留，不重复计作独立最终用例。
- [植被首轮](mirrors-m67-culling-browser.json)12项8通过/4失败；[M64同样复现](mirrors-m67-m64-fixture-control.json)旧整图域与bank停驶。仅将断言对齐源码已有两域，三浏览器修正专项通过，未改资源。电脑bank20秒仅3.3806m、控制3.3818m，仍失败；没有改阈值、挪起点或称全通过。后续需分离牵引/坡面问题。
- [实际键盘/Android触控](mirrors-m67-motion-approved/result.json)行驶78.76/77.53m，制动倒车至−3.48/−3.39m/s，再前进转弯、拖动、暂停恢复和回追随，0错误。视频[20.20s](mirrors-m67-motion-approved/desktop-keyboard.webm)/[18.56s](mirrors-m67-motion-approved/android-touch.webm)，[六个实际编码时间帧](mirrors-m67-motion-approved/sampled-frames.json)及[联图](mirrors-m67-motion-approved/filmstrip.png)已看，另看代表原PNG；不是完整逐帧或真机性能证据。旧强下调角度的路面过满未采用，[四角度内容对照](mirrors-m67-aim-content/contact.png)选择较轻下调。
- [八正式视图](evidence-mirrors-approved.json)覆盖两端三车和隧道，[全部联图](pass-m67-mirrors-approved/contact.png)已看，0错误。[冻结计数](mirrors-m67-render-counts.json)峰桌面143/769323/210/57、手机104/288580/208/55；暂停无镜面更新，不作活跃镜面预算。[M64控制](mirrors-m67-profile-m64-control/result.json)与[最终M67](mirrors-m67-profile-approved/result.json)各状态90整帧GPU样本/无disjoint，[成本汇总](mirrors-m67-cost-summary.json)保留全部镜面/非镜面帧。树旁/镇旁P50 2.839/4.049→2.462/2.386、P95 4.666/5.236→4.594/11.913ms，频率/尾部波动明显；CPU任务+21.5/+28.3%、脚本+23.9/+30.0%，不称提速或手机FPS。完整活跃帧峰151calls/421482tri，已有及新增超预算均保留。
- [普通无query5190](fineleaf-m67-mirrors-release/result.json)实际开始/前进5.03m，原纹理/压草/岩石/棕榈绑定与115物体一次缓存正常、测试全局关闭、0错误，[普通图](fineleaf-m67-mirrors-release/normal.png)已看。真实一加12镜面清晰度/流畅度问题已发，等待不阻塞下一阶段；自然风景未达标、World1.5和Lighting2.25沿用，无新整体评分。四季/昼夜/天气继续文档11，下一步先定位已复现草坡停驶，Goal active。

# M66 · 原生植物形体筛选，未采用

- 官方[Poly Haven模型](https://polyhaven.com/models/nature/plants)与[CC0许可](https://polyhaven.com/license)确认后，四种素材只下载到work；官方字节/MD5及本地SHA保存在work/low-cover-m66-source/downloaded-source.json。RGB与独立alpha无损合并，几何、UV、法线、原1k PBR完整，统一一米足迹并记录原尺寸/缩放。
- [前两种28幅](lowcover-m66-source-shapes-fixed/result.json)、[Leipoldtia7幅](lowcover-m66-leipoldtia-source/result.json)、[Burchellii7幅](lowcover-m66-burchellii-source/result.json)均0页面错误；联图与前两种顶部原图已看。这是独立平地、近似夕阳的素材检查，非游戏/LOD/压力/运动/真机成本验收。首次favicon404和Burchellii几何60秒下载超时日志保留，修正后才完成，不将失败计为通过。
- [Leipoldtia联图](lowcover-m66-leipoldtia-source/all-contact.png)的低宽形体仍稀疏；[Burchellii联图](lowcover-m66-burchellii-source/all-contact.png)的宽冠仍裸枝。其最小完整株分别53920/44516面，未简化或接入；旧M43成熟Lucida原图和d/e过重结论复核后不重做。四种均暂不采用，无public新资源、无性能/美术达标声明。稳定5190与运行源码仍M64；下一步F05，风景、草坡停驶和F06–F08继续保留。

# M64 · 连贯的灯塔岬角坡面

- 已更新[试玩](http://192.168.3.10:5190/)。[三地址HTTP](cape-grade-m64-http-release.json)均BwUp8_dq/923444B/SHA c49def7d…、车辆DU7I1iqD/6139B、Rapier BR_-CEU_/4332859B；库与M63同SHA。[源码/构建记录](cape-grade-m64-build-source.json)和[原子本地更新](cape-grade-m64-local-release.json)保留，无push。普通入口前进、测试全局关闭及原资源绑定通过，见下。
- 道路、地形、地标与岸体共用8m岬角场，[实际路线/路面审计](cape-grade-m64-source/audit.json)最高新增7.983m、最大绝对纵坡8.124%、同进度XZ偏移.410m。原M57内陆delta仅约束修正手机62/桌面116点，最大.146/.154m；[v2来源](../source-assets/inland-relief-v2.source.json)、[逐字重建](cape-grade-m64-reproduction.json)保留。实际[最终格网](inland-relief-m64-source-final/result.json)保护12736/22521点零移动、57840/102720边无超过2.1mm的越界，应用误差<4微米。
- 临岸摄影面和闭合体共同变形，保留海下底脚；[实际整体拓扑](cape-grade-m64-source/topology.json)开放边/退化面0，原8/33条多重边及焊接边图保持。两端各4648沥青点无地形/岩面侵入，[实际四凸包](cape-grade-m64-source/hull-check.json)各308射线无路面侵入。[一次审查](cape-grade-m64-review.json)发现测试复用0号未变形几何，已逐实例读真实parts/matrix并保留接触阈值。早期interleaved数组误读、单材质独立闭合误判等无效工作审计保留，不当运行错误或最终通过依据；整体拓扑检查不是完整自交证明。
- [三浏览器最终集合](cape-grade-m64-browser-final.json)40通过/2设备条件跳过，0未解决集合内失败或重试。它是[首轮](cape-grade-m64-browser-before-fern-fixture.json)37通过/旧植物世界坐标fixture三失败，与[修正专项](cape-grade-m64-fern-browser-final.json)3通过的去重汇总，不是伪造的单次原始报告。保留原M22矩阵与[冻结旧曲线](../tests/fixtures/coast-route-m63.json)，核对原旋转/缩放、道路局部间距与实际地面2.5cm埋深。最初宽范围99项运行手动中止于16通过/83未完成，不计入本集合。[原雨棚局部反例](camera-surface-m64-final.json)仍保留4.6249m命中、9.1587m请求，最终3.90585m且独立射线无阻；[22旧驾驶组](cape-grade-m64-driving.log)通过。
- [八自动轨迹](vehicle-m64-source-final/result.json)双端三车正向及经典反向，各24000物理步，共192000；每.5s样本无停驶/离路，峰路距2.619m。不是实时录像或真机性能。实际[键盘/原生触控岬角记录](cape-grade-m64-motion/result.json)从声明起点后纯输入行驶193.66/194.71m，切车内/追随，0错误；视频[23.04s](cape-grade-m64-motion/desktop-keyboard.webm)/[22.52s](cape-grade-m64-motion/android-touch.webm)，[六个实际时间样本](cape-grade-m64-motion/sampled-frames.json)和[联图](cape-grade-m64-motion/filmstrip.png)已看，另看代表原PNG，未称逐帧看完整视频。
- [电脑岩背](offroad-m64-cape-final/desktop-keyboard.json)离路86.15m返回、[手机海湾](offroad-m64-mobile-bay-final/android-touch.json)离路62.98m返回，0错误。视频62.80/31.80s，[六个时间样本](cape-grade-m64-offroad-review/sampled-frames.json)及[联图](cape-grade-m64-offroad-review/filmstrip.png)已看；两端不是相同路径。手机[三个岬角草坡失败尝试](cape-grade-m64-mobile-offroad-attempts.json)均停滞，最后四轮接地，原报告/录像保留；牵引极限和引导影响仍待分离，不把海湾返回当草坡问题已修复。
- [生产草毯GPU反馈](grass-canopy-m64-cape-final/result.json)覆盖bank/岬角公路/岩背，根误差<.026mm，无埋尖；bank2481、岩背2483叶受影响，0/20/45/65秒GPU年龄恢复成立，不等于本轮实际等65秒。[16正式机位](evidence-cape-final.json)四组联图已看；[计数](cape-grade-m64-render-counts.json)峰桌面166/867122/208/58、手机122/378710/206/54，静态冻结机位不作为悬挂运动证明。
- [M63](ground-gpu-m64-m63-control/result.json)→[M64](ground-gpu-m64-cape-final/result.json)手机低档、每状态90有效GPU样本且无disjoint。追随/岩侧/岸侧P50 2.621/3.950/3.504→2.612/3.326/4.644ms，P95 6.004/29.314/14.163→4.183/5.415/7.226；控制尾部明显波动，岸侧中位上升，且新形体改变视野，不称提速或真实手机FPS。四个几何克隆底层缓冲额外手机460960B、桌面1464520B；原有面数/纹理和新增几何超预算保留。
- [普通5190入口](fineleaf-m64-cape-release/result.json)实开/前进、测试全局关闭，原八表面、压草、岩石、棕榈与115物体一次缓存正常，0错误，[普通图](fineleaf-m64-cape-release/normal.png)已看。当前主机Wi-Fi仍192.168.3.10。真实手机新版本待反馈；World1.5、Lighting2.25沿用，无新总分。继续地表与草—低灌丛共同边界，镜面、四季、昼夜、天气仍按文档11推进，Goal active。

# M63 · 实际照路的前灯与制动/倒车灯

- 已更新[本地试玩](http://192.168.3.10:5190/)。[三地址HTTP](lights-m63-http-release.json)主Cn1uuQIv/922647B/SHA2de9ee42…、车辆9n1oNJvB/6139B、Rapier BR_-CEU_/4332859B逐字相同；[源码/构建SHA](lights-m63-build-source.json)保留，库哈希与M62一致。先复制已验证资产再原子替换HTML，保留旧哈希文件，未push。
- 前灯两个真实PBR聚光灯，共享64²光学遮罩、随底盘姿态照路；经典偏暖，另外两车偏中性。H与暂停菜单开关并记忆，换车保留。独立红灯读取实际服务制动，白灯跟随倒车，座椅扣件/卡钳不再被一同点亮；驻车与手刹不冒充踩刹车。红灯绕开电影高亮去饱和，修正首轮偏橙表现。
- [最终三浏览器](lights-m63-browser-final.json)3项通过、0失败/跳过/重试，242.8s，每项依次实输入驾驶三款车并测开关/记忆。[18输入图](lights-m63-input-contact.png)已看。前两轮各3项通过，保留首轮244.5s与改色前219.9s报告，不算9个独立用例。WebKit为宿主模拟，Android另有原生触控录像；不当实际iPhone或手机性能通过。
- [28物理CPU](lights-m63-cpu-final/result.json)、[22旧驾驶检查](lights-m63-legacy.log)通过，动力/碰撞参数保持。[一次只读审查](lights-m63-review.json)发现回退模式恢复/暂停换车会保留旧制动信号，已在提前返回前清理并加回归；审查SHA早于该修复，非最终全量批准。
- [键盘/原生触控记录](lights-m63-motion/result.json)先真实加速、制动、倒车、再前进，随后声明隧道起点并正常巡航100.00/100.20m；0错误。视频[17.36s](lights-m63-motion/desktop-keyboard.webm)/[18.08s](lights-m63-motion/android-touch.webm)，[六个实际时间样本](lights-m63-motion/sampled-frames.json)与[联图](lights-m63-motion/filmstrip.png)已看，含红灯/白灯及洞内照路；未称逐帧看完整视频。横屏[手机菜单](lights-m63-motion/android-touch-menu.png)可滚动、无横向溢出。
- [6正式机位](evidence-lights-final.json)、[正式联图](lights-m63-formal-contact.png)、[12开关对照](lights-m63-final/result.json)及[对照联图](lights-m63-optics-contact.png)均已看，0运行错误。前两次采集分别误缺test参数、误传不存在的seed接口，失败日志/报告保留；最终按原六机位和现有接口重拍，不修改游戏接口迎合采集。[路面像素观察](lights-m63-optics-pixels.json)固定区域sRGB亮度差约19.1/12.9，非光度学标定。六图峰桌面152/774386/198/55、手机110/296741/199/52；子集不代表全世界预算通过，旧bank等超标仍保留。World1.5、Lighting2.25沿用，无新总分。
- [同机M62](ground-gpu-m63-m62-control/result.json)→[M63](ground-gpu-m63-lights-final/result.json)，手机低档固定海岸/隧道各90有效GPU样本、无disjoint；P50为2.806/3.552→2.786/3.658ms，P95为4.071/5.089→3.705/4.404ms。各加2calls/568面/2geo/1tex，单轮波动不能当提速或真机FPS。光学纹理约16KiB，未新增前灯阴影pass；中间遮挡漏光和真实夜间验收留到F07。
- [普通5190入口](fineleaf-m63-lights-release/result.json)前进5.75m、测试全局关闭、原八表面/压草/岩石/棕榈绑定与115物体一次缓存正常，0错误，[普通画面](fineleaf-m63-lights-release/normal.png)已看。真实一加12新物理反馈仍待回复；自然风景、镜面、四季昼夜天气未完成，下一轮先处理道路/岸台过平和地表与植物缺少共同空间组织的问题。

# M62 · 物理库缓存，驾驶与画面保持M61

- [本地试玩](http://192.168.3.10:5190/)已恢复并更新。[三地址HTTP](physics-cache-m62/http-release.json)主B-FYNEws/920656B、车辆Cg_oRHpL/6066B、库BR_-CEU_/4332859B，候选/稳定/LAN全部逐字一致；未push。总raw比M61多228B，不是首次加载减重。
- [工作构建图](physics-cache-m62/build-graph.json)只改应用质量参数，应用两块文件名变化，独立Rapier SHA bf574388…保持，库无指向应用的静态import。1281kg探针只在work，已清理候选额外文件，最终三车参数保持M61。
- [Chrome/WebKit同源记录](physics-cache-m62/browser.json)：首次物理正文约1.64MB gzip，应用变更后Chrome ResourceTiming仅300B、WebKit0B且新应用初始化成功；不把WebKit缓存项bodySize0解释为空库。physics=0控制均无物理请求，0错误。[Chrome启动图](physics-cache-m62/chrome-active.png)、[WebKit图](physics-cache-m62/webkit-active.png)已看，不是新的画质评分。
- [三浏览器真实驾驶专项](physics-cache-m62-driving.json)3通过、0失败/跳过/重试，79.5秒；[普通入口](fineleaf-m62-physics-cache-release/result.json)行驶5.74m、测试全局关闭、原资源绑定/压草和115物体一次缓存正常，0错误，[普通图](fineleaf-m62-physics-cache-release/normal.png)已看。首次工作复制目录与残余探针选择失败的日志保留，清理重建后才做最终浏览器及发布。
- 仅构建配置改变，无新纹理、可见面数、物理参数或运行时帧率优化。M61的CPU/路线/运动证据见下；本轮未重评分。真实手机新引擎反馈仍待回复，整体需求未完成，继续F04灯光及后续镜面/动态世界。

# M61 · 真实惯性、轮胎抓地和四轮悬挂

- 已更新[本地试玩](http://192.168.3.10:5190/)；[三地址HTTP核对](vehicle-m61-http-release.json)主JS Beu2WSct/920493B/SHA f4cc3a03…，物理Dey3i3yR/4338860B/SHA d321fafb…相同，许可证200。精确复制已验证候选后原子替换HTML，保留旧哈希资产。主包比M59 raw+8008B，另增物理兼容包，构建gzip估计268.45/1671.75kB；无新图或可见物理网格，未push。
- 一个有质量/惯量、CCD的底盘与四个弹簧阻尼射线轮；三车不同质量、动力/悬挂。速度方向不再随车头硬转，有限轮胎抓地、后轮手刹和制动冲量；渲染读取物理四元数与各轮状态，非输入驱动的假侧倾。场景用简化代理，非完整轮胎/变速箱或每个装饰物的汽车工程仿真。
- [28组最终CPU](vehicle-m61-cpu/result.json)：三车九工况加Driving抬高地面放车。平地12m/s两秒松油门约11.67m/s，制动≤.2m/s约1.78s/10.73m，转向侧速约.66m/s；三车实际油门加速分别约6.78/7.94/9.41m/s@2s。高速短波起伏仍有离地和3.3–3.4cm接地样本轮底P95误差，慢速/单轮起伏另列。与M60工况/航向/offroad不完全相同，不计算严格提升百分比。放车检查以实际姿态漂移判稳，不要求求解器阶段速度恰为零。
- 首版内部地面边骤停、hill出口顶护栏、第二版反向切弯和旧贴墙起点低于铺装弹起均有工作记录，未采用失败版本。现地面法线邻接修正，铺装实际三角高度参与放车支撑，路口25m减速/6m换目标。[最终双端八条路线](vehicle-m61-routes-corner/result.json)各24000步、共192000步，含三车正向及经典反向；每.5秒观察均无停驶、路距峰2.85m、中段山路后回到主路。属于CPU轨迹核对，不是实时运动或手机性能。
- [最终三浏览器](vehicle-m61-browser-final.json)17通过/4设备条件跳过，0失败/重试；包含真实油门/滑行/制动、切车质量、暂停/恢复、驾驶位、环绕、多指和横屏。首轮[6失败原记录](vehicle-m61-browser-first.json)保留；贴墙三项由铺装起点修正、制动两项由50ms级采样避免漏过停车/倒车窗口、WebKit一项延长加载等待后通过。[铺装专项三浏览器](vehicle-m61-camera-placement.json)保持原镜头断言。WebKit为宿主模拟，非真实iPhone触控/流畅度验收。
- [键盘](offroad-vehicle-m61-final/desktop-keyboard.json)/[Android原生触控](offroad-vehicle-m61-final/android-touch.json)实际离路62.26/62.71m并返回，0错误，同Beu2/Dey3 SHA。视频28.52/32.36秒，[六个编码时间样本](offroad-vehicle-m61-final/sampled-frames.json)、[桌面filmstrip](offroad-vehicle-m61-final/desktop-keyboard-filmstrip.png)/[手机filmstrip](offroad-vehicle-m61-final/android-touch-filmstrip.png)均已看，稀疏抽帧不称逐帧看完整录像；原压草仍跟随轮点，65秒恢复沿用M41。
- [12正式机位](evidence-vehicle-final.json)及[桌面](vehicle-m61-formal-desktop.png)/[手机](vehicle-m61-formal-mobile.png)联图全部已看，0错误；静态冻结机位不作为悬挂运动证明。[计数](vehicle-m61-render-counts.json)峰桌面148calls/819812tri/201geo/56tex、手机117/369009/199/53，已有预算问题保留。World1.5、Lighting2.25沿用，其余八项未重评，无新的综合视觉分数。
- [同主机最终开销](vehicle-m61-mainthread-final/result.json)：同最终主包，Android低档4倍CPU/单次8秒，贴墙Task4033→4590ms、隧道4073→4701ms；Task/帧8.32→9.46、8.48→9.69ms。缓冲存储约43.3→49.1MB，不能全部归为物理独占。贴墙新车仅移4mm、提交相同；隧道末帧107/106calls，实际行驶100.07/98.51m，非严格同视野。首份贴墙车弹起的[无效停车对照](vehicle-m61-mainthread/result.json)不作该结论依据；不称提速或真实手机FPS。
- [普通5190入口](fineleaf-m61-vehicle-release/result.json)新物理包一次加载、前进5.75m、测试全局关闭，原八表面/压力/岩石/棕榈绑定与115物体一次缓存正常，0错误；[普通画面](fineleaf-m61-vehicle-release/normal.png)已看。[一次只读审查附加CPU探针](vehicle-m61-review/result.json)单列其旧源SHA与范围，不当最终全量批准。
- 一加12新手感/流畅度问题已异步发出，真实iPhone仍待设备复核。Goal未完成，工具仍usageLimited；自然风景、F04/F05灯镜、F06–F08四季昼夜天气继续推进。M57一次未复现黑角观察仍保留，不能据本轮无异常声称已查明根因。

# M60 · 驾驶CPU基线，试玩保留M59

- [18场景测量](driving-m60-baseline/summary.json)直接调用M59源码的Driving.update，两遍各8640步完整raw哈希相同；[脚本](../scripts/measure-driving-baseline.mjs)、[源码与数据SHA清单](driving-m60-baseline/manifest.json)、[报告](driving-m60-baseline/report.md)可核对。初速12m/s是受控设置，非玩家加速；道路和离路摩擦分开，不把后续倒车轨迹当刹停距离。
- 转向1秒偏航77.75°、峰侧向加速度16.77m/s²，位移侧向速度约8e-12m/s。连续小起伏轮底几何绝对误差P95 9.82cm、最大14.06cm，属于CPU估计，非悬挂录像。三车本次零油门工况相同，未测试加速和极速。
- 本步骤没有渲染、真机性能或发布验证，不修改5190的M59版本；F02/F03进入质量/轮胎/弹簧工作方案验证，目标未完成。

# M59 · 自由环绕与连续结构避障

- 已更新[试玩](http://192.168.3.10:5190/)；[生产/候选HTTP](camera-m59-http-release.json)均DMDpn9Js、912485B、SHA cbab2fe8…，相对M57 raw+6113B。没有新图片、可见几何或投影烘焙。
- [旧版实际拖动](camera-m59-before/summary-corrected.json)隧道两端maxTravel=0，已解除固定角度覆盖；保留输入方向，只阻尼恢复距离。旧原始日志切状态时有少数player诊断滞后，已独立列出排除帧，未删除原记录。
- 静态结构按实际世界三角面建立16m CPU索引，覆盖地形/岬角、实体岩石完整原始矩阵、扫描岸面与建筑雨棚/阳台；五条射线查询附近分区，生产不再用高度步进。一次聚焦审查的雨棚和窄脊漏检均处理；[雨棚源几何反例](camera-surface-regression.json)两端4.625m命中处旧boom7.935m、新3.906m，独立结果射线无阻；21组CPU含2mm薄脊/负格缝通过。
- [三浏览器最终](camera-m59-browser-final.json)：12通过/3设备条件跳过，0失败/重试；覆盖旋转恢复、Android原生多指/油门释放、巡航接管/三视角/三车、驾驶位及横屏。早期错误CDP抬指和等待上限失败记录保留，修复专项脚本和等待设置后通过；WebKit环绕使用可信鼠标，非真实iPhone触控证据。
- [完整输入记录](camera-m59-final/result.json)电脑/Android各五个静止实际机位三次拖动，随后18秒行驶三次环顾，位移218.30/217.16m、0错误。[桌面](camera-m59-final/desktop-mouse-contact.png)/[手机](camera-m59-final/android-touch-contact.png)46张已看。视频45.72/43.28秒，[实际尾部时间样本](camera-m59-final/sampled-frames.json)及两组filmstrip六帧已看；没有把静态截图当运动证明。
- [8正式机位](evidence-camera-final.json)与[联图](camera-m59-formal-contact.png)均已看，0错误；[计数](camera-m59-render-counts.json)峰桌面149/818478/201/56、手机116/357477/199/53，原有面数/手机纹理超预算保留。画面仍有草形、裸坡、车辆地面接触问题，World1.5、Lighting2.25沿用，其余八项未重评，无新总分。
- [4倍CPU同主机对照](camera-m59-mainthread/result.json)：小镇/隧道8秒Task3532/3362→4271/3721ms；500us采样updateCamera含后代/帧0.090/0.552→1.452/0.875ms。新增检测有CPU成本，小镇提交相同，隧道新角度多见部分结构，不称提速或真实手机FPS。
- [普通入口](fineleaf-m59-camera-release/result.json)行驶8.45m、测试全局关闭、八表面/压草/岩石/棕榈绑定与115物体一次缓存正常；普通截图已看。[普通两端CPU索引](camera-m59-normal-index.json)单独记录，不当新增渲染面数。真实一加12反馈待回；M57一次未复现黑角观察仍保留，未据镜头修复宣称已查明。
- [后续文档11](../docs/11-后续驾驶与动态世界计划.md)标记F01实现/待真机，进入F02/F03惯性与悬挂。Goal未完成，目标工具仍usageLimited，本轮按用户授权继续工作。

# M58 · 灌丛重排未采用，生产保持M57

- [独立工作对照](chaparral-m58-first/result.json)包含桌面/手机各4实际机位、2工作观察机位的前后24图；[手机](chaparral-m58-first/mobile-contact.png)/[桌面](chaparral-m58-first/desktop-contact.png)均已看，0错误。扩大压低的46条凹地灌丛带在驾驶机位收益很小，工作远观出现贴地绿条，未采用；无本轮运动/真机性能/发布声明。
- Scenery已恢复M57；下面的Dg2生产证据仍为当前发布依据。5190服务已重新启动：[同一Wi-Fi试玩](http://192.168.3.10:5190/)。风景仍未完成；接下来进入已登记F01镜头避障/拖动问题。

# M57 · 内陆脊谷与最终格网约束

- 最终Dg2Kz38n已更新[试玩地址](http://192.168.3.10:5190/)，[HTTP双构建核对](inland-relief-m57-http-release.json)同SHA b9444069…；906372B，较M52 raw+28833B，同Node默认gzip估计+11753B。
- [原高程、输入与配方](../source-assets/inland-relief-v1.source.json)保留，生成数据按两端最终顶点索引读取，无新纹理或地形面数。[逐字重建](inland-relief-m57-reproduction.json)通过；[实际顶点/边检查](inland-relief-m57-source-final/result.json)保护12736/22522点零位移，57840/102720边无超过2.1mm量化容差的越界，应用误差<4微米。[道路](roadbanks-m57-source-final/)两端各4648样本无侵入。一次独立审查指出的128格重采样缺陷已据此修正，没有递归审查。
- [18项三浏览器](inland-relief-m57-browser-tests.json)全过、无失败/跳过/重试；[手机GPU草毯](grass-canopy-m57-inland-final-phone/result.json)三机位实际shader回读，根误差<.04mm、无埋尖，bank2470叶受压、双侧外拨及0/20/45/65秒GPU年龄恢复通过，非本轮真实等待65秒。
- [12正式机位清单](evidence-inland-relief-final.json)与[手机](inland-relief-m57-final-mobile-contact.png)/[桌面](inland-relief-m57-final-desktop-contact.png)均已看。峰桌面149/818478/201/57、手机116/357477/199/53；真实离路峰桌面927313tri/手机398842tri，已有超预算保留。
- [键盘往返](offroad-m57-final/desktop-keyboard.json)/[触控往返](offroad-m57-final/android-touch.json)分别离路64.47/64.15m并返回，视频25.68/27.20秒，[六个实际时间样本](offroad-m57-final/sampled-frames.json)和两组filmstrip均已看，0错误。[横屏暂停署名](inland-relief-m57-menu/result.json)可滚动查看、无横向溢出。
- [同主机M52](ground-gpu-m57-m52-control/result.json)→[M57](ground-gpu-m57-inland-candidate/result.json)，路草/内陆GPU P50=1.086/1.270→1.110/1.255ms，P95=2.859/5.755→5.800/6.728；90有效样本/状态、无disjoint，中位接近但尾部上升，不当真实手机FPS。
- [普通5190入口](fineleaf-m57-inland-release/result.json)前进8.45m、测试全局关闭、115投影一次缓存、原八表面/草/压力/岩石/棕榈绑定正常，0错误；普通截图已看。
- 首张手机bank左上黑块[原图](terrain-m57-bank-cold-audit/initial-formal.png)/原报告已保留；[四个独立零等待冷context](terrain-m57-bank-cold-audit/result.json)均0近黑像素/0错误，两次分离观察与正式复拍正常。未查明根因、未修改天空或相机，不称已修，继续观察。
- 自然形体有可见脊谷，平顶、均匀坡面和近草平贴仍不足。World1.5、Lighting2.25保持，其余八类未重评，无新均分。Goal未完成，工具仍显示usageLimited；镜头、物理/悬挂、灯镜、四季昼夜天气继续保留文档11。

# 历史M52 · 连续干草地表颜色

2026-10-26，**index-Dj-QjOG3.js**，877.53kB/gzip252.41，已更新[5190试玩](http://192.168.3.10:5190/)；接口与候选HTTP字节SHA已核对。生成的16m草土基色替换旧颜色sampler，保留2m摄影微法线/粗糙度、八张表面纹理、全部地形/道路/植物布局及压草规则。

- 内置image_gen生成的[原图](../source-assets/coastal-field-v1.png)、[完整提示词](../source-assets/coastal-field-v1.prompt.txt)、[转换/哈希记录](../public/assets/environment/coastal-field-source.json)齐全；原1254²RGB4571206B，手机512²142726B、桌面1024²601158B。非扫描或配套摄影PBR；镜像寻址缓解边缘，不声称生成图严格周期无缝。M50草簇及M51地形工作候选未采用。
- [最终12项三浏览器](landcover-m52-browser-tests.json)115秒全过，0失败/跳过/重试。初版同12项另存，非24独立用例。一次只读审查发现通用加载完成回调在dispose后被跳过，会悬挂树皮ready；修复后[四图晚回调专项](scenery-lifecycle-m52-four-completions/result.json)0错误：scene3→0、四成功回调均发生、ready结束、fieldAvailable仍0。该专项走Vite源且无renderer，不当生产或GPU证据；初工具等待load与主动拦图相互等待的超时已记录。
- [12最终桌面/手机机位](evidence-coastal-field-final.json)已逐图看、0错误，覆盖正常道路、草侧、原野、内陆、小镇和洞口。[原有八机位提交计数](landcover-m52-count-comparison.json)与M49完全相同；本轮12图峰桌面150calls/853236tri/201geo/57tex、手机116/381989/199/53，已有超预算保留。手机RGBA含mip存储估算少4MiB，桌面同1k相近。
- 早期页面内工作对照的Texture.clone共享Source，替换image也影响了控制图，故其控制图不作美术基线。补做[两个独立构建](landcover-m52-independent-comparison.json)的12幅原图，均0错误：M49 C9Jf/285cab…与M52 Dj-Q/a23ed…独立页面，没有贴图替换。[手机](landcover-m52-independent-phone-compare.png)和[桌面](landcover-m52-independent-desktop-compare.png)三机位均已看；新增草土地表变化成立，近处平贴和远坡形体不足的限制保留。正式资源、浏览器功能及GPU对照原本均使用独立构建，不受该工作工具错误影响。
- [实际多点触控](offroad-m52-field-phone/android-touch.json)/[视频](offroad-m52-field-phone/android-touch.webm)：离路64.62m并返回，最后行驶采样21.274秒、完整视频26.36秒、0错误。[6秒](offroad-m52-field-phone/motion-1.png)/[14秒](offroad-m52-field-phone/motion-2.png)/[24.5秒](offroad-m52-field-phone/motion-3.png)已看，[时间清单](offroad-m52-field-phone/sampled-frames.json)为间隔取样；65秒恢复继续沿用M41，不声称本轮重测。
- 同轮RTX4050、Android844×390低档，各90有效GPU样本、无disjoint，[M49](ground-gpu-m52-m49-control/result.json)→[M52](ground-gpu-m52-field-candidate/result.json)：路草/内陆P50=1.956/3.128→2.034/3.455ms，P95=3.140/4.243→3.504/5.893ms。计时上升保留，不称提速或真实手机FPS；单轮无法隔离时钟/缓存波动。
- [5190普通入口](fineleaf-m52-coastal-field-release/result.json)同Dj-QjOG3、前进8.45m；新512图一次请求，实际GL sampler/镜像寻址/10级mip FBO完整、8表面槽，原草/压力/岩石/棕榈与115投影一次缓存正常，测试全局关闭、0错误；[普通画面](fineleaf-m52-coastal-field-release/normal.png)已看。[实际HTTP核对](landcover-m52-http-release.json)与候选同SHA a23ed90051a9388547378595d17a4287ccdde5ddefd9d6d66d085da156d6302a。

近处宏颜色仍偏平贴，远坡和实际植物形体未完成。World1.5、Lighting2.25保持，其余八类未重评、无新均分，**Goal active**；用户新增的视角/物理及动态世界仍按[文档11](../docs/11-后续驾驶与动态世界计划.md)后续实施。

# M49 · 完整羽状棕榈叶面

2026-10-26，**index-C9JfYe3-.js**，877.04kB/gzip252.23，已更新[5190试玩](http://192.168.3.10:5190/)（同一Wi-Fi，接口已复核）。树冠由完整透明叶图、弯曲主叶轴与中央折脊组成；原树干、位置、数量及叶轴随机形体保持。近/远面数手机1185/401→625/345、桌面2673/729→801/441。

- 来源为内置image_gen工具生成的[原始RGBA](../source-assets/palm-fronds-v1.png)，[完整提示词](../source-assets/palm-fronds-v1.prompt.txt)与[转换记录](../public/assets/environment/palm-fronds-source.json)保留。手机512²314894B、桌面1024²1151738B，各只加载一张，4区覆盖mip与中心裁切；新增GPU槽+1，约1.33/5.33MiB（手机/桌面）。初程序叶面过于重叠与M48草簇方案未采用。
- [15项三浏览器](palm-m49-browser-tests.json)2.77分钟全过，0失败/跳过/重试：成功、请求失败、尺寸错误回退及继续驾驶，近远共享/互斥、质量切换、树根与首帧世界阴影。一次聚焦只读审查未见明确缺陷；[8最终机位](evidence-palm-fronds-final.json)已逐图看，重新烘焙缓存，0错误。峰桌面150calls/853236tri/201geo/56tex、手机116/381989/199/53；原面/手机纹理预算仍超。
- [实际海湾巡航](sun-motion-m49-palm-coast-phone/samples.json)/[视频](sun-motion-m49-palm-coast-phone/drive.webm)：234.87m、18.597秒，按钮切车内再回追随，世界缓存一次、0错误。[原始车内](sun-motion-m49-palm-coast-phone/drive-10.png)及视频[6秒](sun-motion-m49-palm-coast-phone/motion-1.png)/[13秒](sun-motion-m49-palm-coast-phone/motion-2.png)/[20.5秒](sun-motion-m49-palm-coast-phone/motion-3.png)已看；[时间清单](sun-motion-m49-palm-coast-phone/sampled-frames.json)是22.28秒完整录制中的间隔取样，非相邻帧。
- 同轮主机RTX4050、Android横屏低档，各90有效GPU样本、无disjoint，[M47](ground-gpu-m49-m47-control/result.json)→[M49](ground-gpu-m49-photo-candidate/result.json)：路草/原野P50=2.169/3.528→2.007/3.016ms，P95=4.773/7.590→7.640/10.197。中位数降低、尾部升高，不称整体提速或真机帧率。实际面数254705/272628→250738/267532、calls88/90保持；包围界变化会改变边缘实例提交。
- [5190普通入口](fineleaf-m49-palm-fronds-release/result.json)：同C9Jf、前进8.45m，512叶图一次请求/实际sampler/两层共享/10级mip，草主体/压力上传/岩石共用图与SHA/115世界投影单次缓存、测试全局关闭，0错误；[普通画面](fineleaf-m49-palm-fronds-release/normal.png)已看。新旧草互动代码保持，M41完整65秒恢复证据继续适用。

World1.5、Lighting2.25保持，其余八类未重评，无新均分，原野发白中草/重复裸坡仍未达标，**Goal active**。用户新增的镜头遮挡/惯性、悬挂、车灯、后视镜及四季昼夜天气已写入[后续计划](../docs/11-后续驾驶与动态世界计划.md)，按用户顺序留在当前工作之后。

# M47 · 闭合石体与米制岩石表面

2026-10-26，**index-WjARrULR.js**，874.25kB/gzip251.64，已更新[5190试玩](http://192.168.3.10:5190/)（接口复核，同一Wi-Fi）。采用[官方Boulder01](https://polyhaven.com/a/boulder_01)的512面闭合形体，Rico Cilliers/[CC0](https://polyhaven.com/license)；原照片UV未采用，继续共用旧两张岩石图，以1.8m世界投影给完整体积着色。保留原岩石数量/位置/尺度，双石岩脊yaw错开；植物随机序列、低档和碰撞半径保持。

- [来源与精确打包](../src/world/boulder-shape.json)：gltf/bin MD5/SHA校验，66122→512面/310顶点，保留原比例。43394B数字JSON改15317B base64 Float32/Uint16，几何前后逐字节一致；实际SHA见普通入口检查。远礁高度、保UV的54122面版本及拉花原图方案全部拒绝，没有新增照片或纹理槽。
- [独立几何检查](boulder-m47-geometry.json)：768边双面反向、单位法线、三轴146个厚度>.15m探针。双向最近表面采样2048/596点，P95=.026/.031m、最大.056/.046m，实例缩放前，不称世界误差上界。最初沿射线P95<.05失败，保留原轴向P95=.111/max=.348m；独立最近三角面距离用于区分掠射放大，不隐藏旧值。一次只读审查未发现实例坐标/法线、资源所有权或完整世界投影遗漏。
- [初12项三浏览器](boulder-m47-browser-tests.json)2.5分钟全过；仅无损改变打包后，[最终另6项](boulder-m47-packed-browser-tests.json)1.1分钟全过，两组有重叠，不称18独立用例。[8最终机位](evidence-closed-boulders-final.json)已逐图看，0错误。峰值桌面166calls/951007tri/201geo/55tex、手机121/383109/199/52；已有面数/手机纹理超预算保留。
- [横屏触控往返](offroad-m47-boulders-phone/android-touch.json)/[视频](offroad-m47-boulders-phone/android-touch.webm)：离路76.35m、四角环顾并返路，49.77秒，0错误。已看[原始环顾](offroad-m47-boulders-phone/android-touch-orbit-0.png)、[侧向](offroad-m47-boulders-phone/android-touch-orbit-2.png)、[返回](offroad-m47-boulders-phone/android-touch-returned.png)，以及[3秒](offroad-m47-boulders-phone/motion-01.png)/[23秒](offroad-m47-boulders-phone/motion-06.png)/[47秒](offroad-m47-boulders-phone/motion-12.png)。[12帧时间清单](offroad-m47-boulders-phone/sampled-frames.json)为间隔取样，非相邻帧；窄行程不能代表所有路线或真机。
- 同轮主机GPU各90有效/无disjoint，[M46](ground-gpu-m47-m46-control/result.json)→[M47](ground-gpu-m47-boulders-final/result.json)：岩背/内陆P50=2.874/4.504→2.945/4.256ms，P95=6.975/8.055→3.724/6.034。一升一降，不称整体提速或真机FPS。确定手机两处+5504/+12384面，calls/geo/tex相同；内陆比M45仍少10689面。
- [普通无query入口](fineleaf-m47-closed-boulders-release/result.json)：同WjAR，前进8.60m、实际几何SHA一致、两旧图与地形共用且真实GPU sampler正确、115世界投影单次缓存、测试全局关闭，0错误；[普通画面](fineleaf-m47-closed-boulders-release/normal.png)已看。

World1.5、Lighting2.25保持，其他八类未重评，无新均分，空坡构图未通过。石体改善不等于自然风景达标，**Goal active**；继续草簇/地表的连续层次。一加12/iPhone草地与新版美术性能待反馈。

# M46 · 保留完整景点的空间分区

2026-10-26，**index-CS9TI9rj.js**，856.38kB/gzip239.61，已更新[5190试玩](http://192.168.3.10:5190/)（同一Wi-Fi）。景点按96m空间分区，共用原材质并保留所有完整三角；相机可剔除离屏区域。草、地形、驾驶和素材保持。

- [完整几何等价](landmark-geometry-m46-equivalence.json)：桌面/手机各21材质角色的全部三角属性bits、world transform规范排序SHA与M45全同，65638/51468总面保持。[原版](landmark-geometry-m46-m45-control/result.json)/[候选](landmark-geometry-m46-partition-candidate/result.json)。一次聚焦只读审查未发现新缺陷。
- [工作分区对照](landmark-partition-m46/result.json)/[旧缓存像素](landmark-partition-m46/pixel-comparison.json)：12组像素0差。正式重新烘焙后[三机位比较](destination-m46-actual-shadow-comparison.json)分别736/347/426像素变化，包含UI/车辆边缘，不称最终像素完全一致。8正式机位[清单](evidence-destination-partition-final.json)已逐图看、0错误，未见建筑缺失或新接缝。
- [三浏览器6项](destination-m46-behavior.json)1.7分钟全过。完整世界缓存投影手机42→115个，但仍只烘焙一次、局部pass为0。[小镇连续驾驶](sun-motion-m46-partition-town-phone/samples.json)/[视频](sun-motion-m46-partition-town-phone/drive.webm)219.70m、18.58秒，实际按钮切车内再返回追随，0错误。[间隔帧时间](sun-motion-m46-partition-town-phone/sampled-frames.json)与原始drive-10及3/9.5/17.3秒代表帧已看。
- 手机内陆/原野/小镇/洞口分别减少23073/31352/22779/29131面，calls110/91/95/97→116/89/104/99。最终峰值桌面146calls/842692tri/201geo/56tex，手机116/370725/199/52；几何对象增加73个，既有面数/手机纹理超预算仍在。
- 同轮主机GPU各90有效/无disjoint，[M45](ground-gpu-m46-m45-control/result.json)→[M46](ground-gpu-m46-partition/result.json)：内陆/小镇P50=3.995/3.713→2.739/3.574ms，P95=8.447/5.727→5.857/5.120。原样保留，不把主机波动说成确定百分比收益或真机FPS。
- [普通无query入口](fineleaf-m46-partition-release/result.json)实际前进8.60m、草主体/共享图/压力上传/115投影一次缓存/测试全局关闭，0错误；[普通画面](fineleaf-m46-partition-release/normal.png)已看。

World1.5、Lighting2.25保持，其余八类未重评，不计算新均分。自然风景仍未达用户要求，**Goal active**。草土调色试验拒绝，下一阶段继续实际岩土与植被形体；一加12/iPhone新版本反馈待回。

# M45 · 云隙夕阳与连贯海面反射

2026-10-26，**index-C9gz2Cw_.js**，855.64kB/gzip239.36kB，已更新[5190试玩](http://192.168.3.10:5190/)（当前接口复核，同一Wi-Fi）。[官方Kloppenheim06](https://polyhaven.com/a/kloppenheim_06_puresky)的2k/1k原HDR替换原天空，背景/IBL/海面同源，日照和固定阴影对应新图最亮方向；天空与海面同强度.26。远海长波法线按世界像素过滤、HDR开启mip，减少密集亮线，近岸高度/岸线及草地互动未改。

- [来源校验](sky-m45-source-validation.json)与[运行清单](../public/assets/environment/manifest.json)：官方原文件MD5/SHA、4434394/1173154B均一致，无重编码，Greg Zaal/Jarod Guest，[CC0](https://polyhaven.com/license)。新文件较M44桌面+262435B/手机+111530B；同2k/1k尺寸与槽数，mip新增估算5.33/1.33MiB。
- [三浏览器专项](sky-m45-sun-final.json)：8通过/1桌面跳过，1.6分钟。实际加载HDR独立解码太阳方向、水面同源/同强度、世界缓存一次、手机低帧率保护和缺失照片回退均过。[原生GPU mip/方向附件](sky-m45-gpu-mips-and-sun.json)：桌面12/手机11级浮点FBO均完整、GL0，方向点积>=.99999765。初回退测试未按横屏点击、WebKit5秒加载等待不足的失败记录保留；改测试为横屏和20秒等待后通过，运行逻辑未改。
- [8正式机位](evidence-golden-hour-final.json)已逐图看，0错误；峰值桌面142calls/872700tri/128geo/55tex，手机110/393798/126/52，已有面数/手机纹理超预算保留。一次只读独立审查未见新坐标/所有权缺陷，最终手机/运动/mip边界直接补验。
- [手机行驶](sun-motion-m45-sky-phone/samples.json)/[视频](sun-motion-m45-sky-phone/drive.webm)、[桌面行驶](sun-motion-m45-sky-desktop/samples.json)/[视频](sun-motion-m45-sky-desktop/drive.webm)：洞口起步沿海216.99/221.91m、18.588/19.098秒，实际按钮切车内再返回追随，0错误、世界阴影只烘焙一次。两端原始drive-10车内PNG、间隔帧与14.00–14.44秒12帧中1/6/12代表帧已看，窄窗口未见明显反射跳闪，不据此声称所有机位或真机表现。
- 同轮主机GPU每状态90有效/无disjoint，[M44](ground-gpu-m45-m44-control/result.json)→[M45](ground-gpu-m45-golden-hour/result.json)：洞口/原野P50=3.185/3.419→2.770/3.593ms，P95=10.488/11.160→3.838/5.264。中位数一降一升，不称整体提速或真机FPS；draw/面数/纹理在各对应状态相同。
- [普通无query入口](fineleaf-m45-golden-hour-release/result.json)：同C9gz，前进8.60m、草主体保留/共享图/压力实际上传/42世界投影单次缓存、测试全局关闭、0错误。[普通画面](fineleaf-m45-golden-hour-release/normal.png)。

重看scene-1/2/3校准锚点和完整桌面/手机集，Lighting/render **2.0→2.25**（云隙、海面冷暖与驾驶室深度改善）；World **1.5→1.5**（重复裸坡与白草斑仍明显，空坡构图自动失败不变）。其余八类未重评，无新总均分。整体自然风景未达用户要求，**Goal active**；真实一加12/iPhone的草地连续性和新版天空性能待反馈。当前云形/光束来自固定照片，后续四季、天气、昼夜继续按需求推进。

# M44 · 长草保留、矮草连续过渡

2026-10-26，**index-DsRsS9Pk.js**，855.39kB/gzip239.25kB，已更新[5190试玩](http://192.168.3.10:5190/)（同一Wi-Fi）。保留长草主体，近模添加细茎；矮草中层取消近处空洞，细叶以8m距离带过渡覆盖率，同一世界叶片保持原尺寸。无新贴图、批次或草毯容量；近草共享48/96上限、原作者位置及低档前缀保持。

- [实际轮廓定位](plant-lod-coverage-m44/result.json)：远长草4178/3376覆盖像素，近模242–301，旧互斥会移除约92–94%体量。[源工厂接近](grass-approach-m44-body/result.json)：桌面/手机、全/低档、路边/原野8配置128样本，38m→2m主体均保留且细节真正进入。
- [初候选33项三浏览器](grass-m44-behavior.json)8.3分钟全过，覆盖LOD、根部、前缀、切档、资源回退与输入。独立只读审查后修正双重渐退及轮廓alpha/距离筛选顺序，最终shader[另6项三浏览器](grass-m44-final-shader.json)2.3分钟全过，不称39个独立用例。
- 最终实际shader GPU：[手机Chrome](grass-canopy-m44-full-fade-phone/result.json)、[WebKit](grass-canopy-m44-full-fade-webkit/result.json)、[桌面](grass-canopy-m44-full-fade-desktop/result.json)。移动LOD中心6m，同一世界叶位置误差0；手机实际1152绘制前缀中，近部中草76个三角样本仍存在。非零渐退带另查根点/法线/接触，手机912受压叶端0埋地，根点不动、道路0命中、移窗与半密度前缀稳定，受控20/45/65秒恢复保持。重复顶点/三角样本不称独立草株。
- [8正式机位清单](evidence-grass-continuity-final.json)已逐图看，0错误；峰值桌面142calls/872700tri/128geo/55tex、手机110/393798/126/52，既有三角和手机纹理超预算保留。草地形体的近远连续改善，整体空坡与远草颜色仍不足，World维持1.5/3、其余九类未重评，Goal active。
- [实际横屏双指驾驶](vegetation-m44-grass-continuity-mobile/result.json)/[运动视频](vegetation-m44-grass-continuity-mobile/driving-and-recovery.webm)：前进/右转/制动/倒车及5.083秒未暂停恢复0错误，深压格7→280。[抽帧记录](vegetation-m44-grass-continuity-mobile/sampled-frames.json)覆盖3.00–10.15秒，已看[3.00秒](vegetation-m44-grass-continuity-mobile/drive-01.png)、[6.25秒](vegetation-m44-grass-continuity-mobile/drive-06.png)、[10.15秒](vegetation-m44-grass-continuity-mobile/drive-12.png)及原始移动/转向/轮迹PNG；这些是间隔取样，非相邻帧。原压力时钟未改，M41完整65秒实际记录继续适用，本轮新shader另有受控65秒检查。
- 同轮主机GPU各90有效样本、无disjoint：[M43](ground-gpu-m44-m43-control/result.json)→[M44](ground-gpu-m44-grass-continuity/result.json)，路草/内陆P50为2.284/3.668→2.356/3.937ms，P95为7.187/6.121→3.177/4.812。不称提速或真机FPS。确定路草+216tri、内陆+66tri，同calls/纹理；保留主体上限最多+288手机/+576桌面tri，取消空洞增加实际覆盖。
- [普通无query入口](fineleaf-m44-grass-continuity-release/result.json)：实际前进8.30m、主体保留标记、共享草图及实际压力上传、42世界投影单次缓存、测试全局关闭，0错误。[普通画面](fineleaf-m44-grass-continuity-release/normal.png)。当前接口192.168.3.10已复核，已询问一加12消失/突现与流畅度。

同源照片远草候选因画面更空而拒绝，未进入产品。接下来改善整张风景的天空夕阳、远草/裸土层次；用户后续的四季/天气/昼夜已写入需求。整体自然风景尚未达到用户要求。

# M43 · 完整叶形与立体干燥灌丛

2026-10-26，**index-C_hraUJb.js**，854.79kB/gzip238.96kB，已更新[5190试玩](http://192.168.3.10:5190/)。Searsia f/g完整近景7232/6302面，保留全部源叶、细枝、木质表面；远景2129/1735面使用16个原三角域隔离照片及完整木质部分。手机/桌面共享近上限2/4、较早切入五方向对象法线代理，原作者位置、密度、车辆草压不变。失败先回退旧Rooibos，再回退程序灌丛。五运行文件2104204B，较M42增加578921B；同1k+两个512尺寸、纹理槽不增。

- [独立原表面/边界/Alpha/来源SHA](coastal-searsia-validation-m43-native-final/result.json)：7232/6302近景面缺失、多余、反向均0，最大属性误差3.57e-8；远木质371/339组件均保留，1113/1005边界根点全在。原有效RGB/Alpha字节不变，16隔离域Alpha积分误差最大.3564%、有限像素的裁切面积误差3.853%。四准备文件独立复建逐字节相同。
- [39项三浏览器检查](searsia-m43-behavior.json)：6.1分钟全过，切档、三层互斥、前缀/根部/共享预算、18区mip、新资源四失败恢复旧模型、旧资源四失败保留程序景观、可选法线回退与驾驶均覆盖。
- 实际GPU：[Chrome](scrub-normals-m43-searsia-chrome-final/result.json)、[WebKit](scrub-normals-m43-searsia-webkit-final/result.json)10级全像素上传0误差/A255，9级独立原块求和0误差，8组实际shader实例方向<=1/0字节，sampler绑定正确。初oracle未处理相反方向抵消，两级各一像素误差128；Float64残差5.55e-17无方向，已补向上兜底判定，产品代码未改。[原失败](scrub-normals-m43-searsia-chrome/failure.json)保留。[四路径资源销毁](scrub-disposal-m43-searsia/result.json)均只释放实际拥有的纹理一次。
- [正式清单](evidence-searsia-final.json)8图0错误，逐图已看，桌面峰142calls/872250tri/128geo/55tex，手机110/393732/126/52，仍超三角与手机纹理预算。另有[9手机视角和环顾](inland-scrub-m43-searsia-final-phone/result.json)，以及[横屏真实触控](vegetation-m43-searsia-mobile/result.json)/[驾驶视频](vegetation-m43-searsia-mobile/driving-and-recovery.webm)：前进、右转、制动、倒车0错误，深压格7→263，短恢复5.083秒；原始PNG及两段运动的1/6/12代表帧已看。长期草压规则不改，M41完整65秒证据沿用。
- 同轮主机GPU各90有效样本/机位、无disjoint。[正序M42](ground-gpu-m43-m42-control/result.json)→[M43](ground-gpu-m43-searsia-final/result.json)：路草/内陆P50=2.189/3.401→2.270/4.667ms，P95=7.638/4.213→3.797/6.528。首轮内陆增加，追加一次[反序M43](ground-gpu-m43-searsia-reverse/result.json)→[M42](ground-gpu-m43-m42-reverse-control/result.json)：P50=2.700/2.156→2.251/3.992，P95=11.187/9.566→15.532/12.689。未重现同样增幅，完整保留四组，不挑低结果称提速，亦不代表实机FPS。确定路草+9733面、内陆+17910（约4.8%），同纹理49/52。
- [普通入口](fineleaf-m43-searsia-release/result.json)：同C_hraUJb，实际前进8.45m、新五资源各一次/旧资源0请求，草图共享与压力实际上传、42世界投影一次缓存、测试全局关闭、0错误。[最终普通画面](fineleaf-m43-searsia-release/normal.png)。

旧像素方案虽保留组件，却裁掉25%叶片及约51%远细枝，全部拒绝；完整双株配对增加手机6万面也拒绝。当前单株叶形更明确，远草发白、空坡与海岸整体构图仍不足，**World继续1.5/3，Goal active**，其余九类不重评、不生成新均分。真实一加12/iPhone新版美术性能待复核，下一阶段先改善地表与植被的大尺度连续层次。

# M42 · 远灌丛原色与叶片受光

2026-10-25，**index-B3sbJFCT.js**，854.27kB/gzip238.72kB，已更新[5190试玩](http://10.158.204.114:5190/)。保留M41作者摆放、密度、实体模型和LOD范围；重烘原生直通颜色与对象法线，减少远灌丛黑色剪影。颜色/法线源mask一致，输出法线保持不透明，运行10级mip按原颜色coverage加权。一个新512²槽含mip约1.33MiB，首次下载增加116846B；未增加draw或几何数量。细枝与枝冠分开保留覆盖，正常与低档代理共用材质图。

- [24项三浏览器检查](scrub-m42-final-browser-tests.json)：桌面Chrome、Android尺寸Chrome、手机WebKit，4.3分钟全过。覆盖根部、三层互斥、前缀、预算共享、旧四种失败及新法线成功/缺失/尺寸错回退。
- 实际GPU检查：[Chrome](scrub-normals-m42-chrome/result.json)、[WebKit](scrub-normals-m42-webkit/result.json)。10级全像素上传误差0、A255；9级独立直接原像素块求和误差0；8个实际生产shader旋转/非均匀Y缩放样本与Three normalMatrix误差<=1/0字节，绘制后sampler绑定正确，0错误。独立只读审查指出的自动mip污染已修复，没有递归审查。
- [颜色/法线烘焙校准](scrub-impostor-bake-m42-weighted-normals/result.json)、[源几何/输入输出SHA](coastal-rooibos-validation-m42-weighted-normal/result.json)、[四路径资源销毁](scrub-disposal-m42-decoded/result.json)：实际已解码的两张代理图正常/错误尺寸/主色失败/加载中销毁均只释放一次。最初销毁探针对完全失败、未取得图像/GPU存储的临时Texture误要求dispose，已按拥有的资源修正，未改产品路径掩盖失败。
- [最终正式清单](evidence-scrub-normals-final.json)：8机位0错误，逐图已看。桌面峰144calls/849049tri/128geo/55tex，手机110/375822/126/52；三角与手机纹理预算仍超额。另有[9个手机实际视角](inland-scrub-m42-proxy-phone/result.json)、[指针环顾录像](inland-scrub-m42-proxy-phone/page@f967a779d7ffa851f8d6fd5c9a336799.webm)、[连续首帧](inland-scrub-m42-proxy-phone/orbit-01.png)/[中帧](inland-scrub-m42-proxy-phone/orbit-06.png)/[末帧](inland-scrub-m42-proxy-phone/orbit-12.png)。原始PNG和连续帧已看，仍能见到远草团、空坡和细枝株型限制；未当作自然风景达标。
- 同轮主机GPU各90有效样本/机位、无disjoint：[M41控制](ground-gpu-m42-m41-control/result.json)路草/内陆P50=2.611/3.999ms、P95=4.154/5.888；[M42最终](ground-gpu-m42-proxy-final/result.json)P50=2.638/3.229、P95=5.052/4.933。一升一降，不称整体提速；相同draw/三角，纹理+1，主机数据不是真机FPS。
- [普通无query入口](fineleaf-m42-proxy-release/result.json)：同B3sb、前进8.45m，新资源各请求一次、草图共享/压力上传/42世界投影一次缓存、测试全局关闭、0错误。草毯/车辆互动未改，M41完整65秒实测证据保持适用；用户指定几十秒保留再恢复的要求不变。

48片新群落及减半数量、缩短LOD、顶片淡出候选均因扁冠/开销没有采用。World仍1.5/3，其余九类不重评、不生成新均分，**Goal active**。更饱满的灌木与草地/裸土大尺度构图继续推进；一加12/iPhone新美术版真机反馈待补。

# M41 · 细叶草地与完整干草簇

2026-10-25，**index-D40x5E2c.js**，850.97kB/gzip237.71kB，已更新[5190试玩](http://10.158.204.114:5190/)。24个独立细叶三角与4个中层矩形仍占32面/96顶点，近格.45m、半径手机9.9m/桌面13.5m，低档每格12叶；中层复用原256²草图，1.2m格、半径26.4/36m。五米密度渐退与提前重叠减轻车周围的圈状边界，仍未完全解决近远草形态差异。

三款摄影近草各301面，由六株完整原生细草组成，保留原UV/变换法线；替换旧328/321/341面草簇，成功路径不再创建90面补充主体，不请求旧Bermuda。1k照片与草毯共用，首次三文件878382B，较旧版+529439B，同尺寸GPU纹理槽不增。失败回退旧摄影草，再失败保留程序草。来源与哈希见[细草清单](../public/assets/models/coastal_fine_grass/source.json)及[CPU资产检查](fine-grass-m41-asset-check.json)。独立只读审查发现导出材质漏设非金属，已修并重生成；运行原本替换材质，未将此修正计为画质改善。

[最终清单](evidence-fine-grass-final.json)声明8幅桌面/手机机位，全部0浏览器错误，已逐图查看。桌面峰144calls/849049tri/128geo/54tex，手机110/375822/126/51，三角形和手机纹理仍超起始预算。像素熵桌面5.59–6.03、手机5.05–6.00，边缘密度.261–.595/.234–.517，最大主色份额.162/.173；像素指标不代表真实风景达标。近叶更连续细密，但远处发白草团、裸坡和海岸整体构图仍不足；本轮不重评其余九类、不生成新均分，沿用世界1.5/3与空地构图未通过。Goal active。

- [初接入30项三浏览器检查](tests-m41-fine.json)：7.4分钟全过，覆盖根部、近远互斥、作者前缀、材质共享、切档、实际驾驶、两层素材失败与暂停。该版DQQ在最终过渡调整前，未冒充最终机位。
- [最终窗口/压力六项复核](tests-m41-fine-wide.json)：2.3分钟全过；只扩大格与重叠、保持资产及原摆放，因此未重跑已过的素材失败用例。30与6含重叠，不称36个不同用例。
- 实际GPU编译shader读回：[Chrome手机](grass-canopy-m41-wide-phone/result.json)、[WebKit](grass-canopy-m41-wide-webkit/result.json)、[桌面](grass-canopy-m41-wide-desktop/result.json)。各2410个可见受压叶端读回全部用实际地形三角射线核对，埋地0，根部位移0，最低面法线点积.9999798、根误差约19微米，道路0命中；全/低密度、移窗与风动保持。24轮点样本压低约.222m，20秒.208、45秒.057、65秒0，两侧外拨保持。
- [真实触控与65秒恢复](vegetation-m41-fine-phone/result.json)、[录像](vegetation-m41-fine-phone/driving-and-recovery.webm)、[转弯原始PNG](vegetation-m41-fine-phone/moving-turn.png)、[前进轮痕](vegetation-m41-fine-phone/forward-tracks.png)、[65秒](vegetation-m41-fine-phone/recovery-65.png)：前进/转向/制动/倒车0错误，深压格7→268，实际未暂停65.08秒。停车处继续受车压，不能用深压格仍非零否定旧路径恢复。另用Playwright自带ffmpeg解码3秒起连续12帧，查看[首帧](vegetation-m41-fine-phone/motion-01.png)、[中帧](vegetation-m41-fine-phone/motion-06.png)、[末帧](vegetation-m41-fine-phone/motion-12.png)，并对照原始运动PNG，未见叶根跳动或车身穿草的突变。
- 同轮GPU各机位90有效样本、无disjoint：[M40控制](ground-gpu-m41-control/result.json)路草/内陆P50=2.122/3.135ms、P95=4.434/5.500；[最终M41](ground-gpu-m41-fine-final/result.json)P50=2.401/3.437ms、P95=6.787/5.120。中位数约+13%/+10%，不是提速；固定机位各少1draw，分别少3502/1097面，纹理数不变。此为RTX4050主机、Android视口，不是一加12或iPhone实测FPS。CPU取消补充主体复制，未再跑不相关节流回归。
- [普通入口检查](fineleaf-grass-m41-release/result.json)：无query前进8.60m，新草ready、11/9级共享mip、32面模板、实际绘制后核对中层GPU sampler绑定、压力上传/车位、42投影体一次世界缓存、测试全局undefined、0错误。候选与正常dist同D40；车辆、横屏全屏及其他系统未改。

此前几组整簇烘焙、面积Alpha、法线图、光照与升高山坡的试验均未采用，记录在game-progress，不用它们的截图/计时替代最终证据。待真实一加12/iPhone复测；反馈不阻塞下一阶段风景改进。

# M40 · 连续干草地表与中距离草带

2026-10-25，**index-dWqHp5uJ.js**，844.70kB/gzip236.04kB，已更新[5190试玩](http://10.158.204.114:5190/)。真实细叶干草模型离线烘成2m周期摄影地表，温和内陆坡面更连续、陡坡保留岩面。草毯固定32面预算按24/8分给近/中层，低档每格近6/中2簇，全档12/4，中层半径手机33m/桌面45m；两层均世界固定、两端密度渐退，没有新增运行draw、面数、实例容量或草图片。两张1k地表图替换旧field槽，GPU存储保持，下载约+1.61MB。

地表单独候选仍过空，最终增加中层接续后近草边界改善；远坡大形、株型与整体自然感仍不足。保留此前世界1.5/3和空地构图未通过的结论，未重评其余九类，**Goal active**。这一步不代表达到用户要求的接近满分。

- [8个正式桌面/横屏机位与18项辅助清单](/home/ryan/workspace/coastline/artifacts/evidence-meadow-release.json)
- [实际摄影烘焙、平面/倾斜方向和X/Z周期验证](/home/ryan/workspace/coastline/artifacts/meadow-ground-m40-ground-axes/result.json)
- [来源、输入与输出哈希](/home/ryan/workspace/coastline/public/assets/environment/meadow-source.json)
- [三浏览器9项驾驶/切档/暂停与实际表面纹理检查](/home/ryan/workspace/coastline/artifacts/tests-m40-meadow.json)
- [Chrome草接触、近中层及恢复](/home/ryan/workspace/coastline/artifacts/grass-canopy-m40-middle-mobile/result.json)、[WebKit](/home/ryan/workspace/coastline/artifacts/grass-canopy-m40-middle-webkit/result.json)、[桌面](/home/ryan/workspace/coastline/artifacts/grass-canopy-m40-middle-desktop/result.json)
- [Chrome地表实际GPU逐像素读取](/home/ryan/workspace/coastline/artifacts/packed-ground-m40-chrome/result.json)与[WebKit同项](/home/ryan/workspace/coastline/artifacts/packed-ground-m40-webkit/result.json)
- [实际触控前进/转向/制动/倒车和短恢复录像](/home/ryan/workspace/coastline/artifacts/vegetation-m40-phone/driving-and-recovery.webm)，[行进原始PNG](/home/ryan/workspace/coastline/artifacts/vegetation-m40-phone/moving-straight.png)与[轮迹PNG](/home/ryan/workspace/coastline/artifacts/vegetation-m40-phone/forward-tracks.png)
- [普通无query入口与缓存核验](/home/ryan/workspace/coastline/artifacts/fineleaf-grass-m40-release/result.json)

三配置实际编译顶点shader逐一射线检查1299个受压顶角读回（含矩形重复顶点），0埋地/根部位移0；法线与实际三角面点积最低.99999984，根点误差约20微米，道路0命中，全/低档和移窗稳定、近中层均可见。5簇轮点样本平均下降约.263m，20秒.246、45秒.067、65秒恢复；两侧平均约2.4cm外拨。Chrome/WebKit实际三种1024²地表纹理与参考法线/粗糙度GPU通道逐像素相同。独立只读审查指出的倾斜法线和Z周期验证缺口已补齐，源/烘焙输入/输出哈希再次核对，未以资产烘焙成功代替美术验收。

9项三浏览器全过（2.6m），8正式图0错误。桌面峰145calls/857704tri/129geo/54tex，手机111/376919/127/51；原750k/300k面和手机40纹理建议预算仍超。像素熵桌面5.73–6.19、手机5.30–6.00，边缘密度.261–.630/.234–.542，最大主色份额.129/.162，只作非空/层次信号，不替代审美判断。

同轮主机固定路草/内陆各90有效GPU样本、无disjoint，M39控制P50=2.315/3.672ms，新版2.524/3.493；P95=11.023/13.801→3.795/5.588。中位数分别约+9%/−5%，不以较低尾延迟宣布整体提速，详见[控制](/home/ryan/workspace/coastline/artifacts/ground-gpu-m40-control/result.json)和[最终候选](/home/ryan/workspace/coastline/artifacts/ground-gpu-m40-middle/result.json)。两机位实际map sampler共享已核验，draw/面数/纹理保持94/272386/48和111/376919/51。每帧仅增加中层原点的两次floor与vec2更新，本轮未重复CPU节流；不是一加12或iPhone硬件帧率。

触控深压格7→276，倒车停止后275，随后实际5.08秒未暂停恢复，0错误；已看行进与轮迹原始画面，短片不替代M36原65秒实际等待。普通入口前进8.30m，摄影共享图/11级mip、中层窗口原点、压力图上传与车位、42投影体完整一次烘焙、测试全局undefined均通过。真实一加12/iPhone的新美术流畅度与用户对压草强弱的反馈仍待复核。

---

# M39 · 完整摄影草簇、连续近景覆盖与压伏接触

2026-10-25，**index-D9XkvLL6.js**，843.74kB/gzip235.77kB，已更新5190。近草借用已有1k摄影图集，四种完整植物轮廓替换单根薄三角；16个矩形各2三角，仍为96顶点/32面每实例。低档每个世界格保留8簇、全档16簇，根点均匀覆盖格内，世界固定的密度渐退分散近景边界。两个受压顶角分别沿真实地形三角支撑，法线按实际三角计算；没有新增运行图片、纹理、draw、实例缓冲或每帧CPU扫描。

首个收尖UV候选会裁掉10–27%有效叶片，已放弃。远草共用照片/增密候选仍有横向偏扁的轮廓，地表调色与受光候选也未形成有效改善，均未采用；最终地面及远草保留M38。近处体量与互动改善，但空坡、近密远疏及干草形态仍需继续，世界1.5/3和空地构图自动失败保留，其余九类未重评，**Goal active**。

- [8个正式桌面/横屏机位及辅助证据清单](/home/ryan/workspace/coastline/artifacts/evidence-canopy-release.json)
- [D9手机实际GPU接触、根点、法线、移窗和恢复](/home/ryan/workspace/coastline/artifacts/grass-canopy-m39-release-mobile/result.json)
- [同一草簇几何/压力计算的WebKit读回](/home/ryan/workspace/coastline/artifacts/grass-canopy-m39-field-final-webkit/result.json)与[桌面读回](/home/ryan/workspace/coastline/artifacts/grass-canopy-m39-field-final-desktop/result.json)
- [三浏览器共享/驾驶/切档/暂停6项](/home/ryan/workspace/coastline/artifacts/tests-m39-canopy-release.json)与[最终草图失败回退3项](/home/ryan/workspace/coastline/artifacts/tests-m39-fallback-release.json)
- [最终真实触控前进、转向、制动、倒车及5秒短恢复](/home/ryan/workspace/coastline/artifacts/vegetation-m39-phone-motion-pixels/driving-and-recovery.webm)
- [行进中原始画面](/home/ryan/workspace/coastline/artifacts/vegetation-m39-phone-motion-pixels/moving-straight.png)与[转向原始画面](/home/ryan/workspace/coastline/artifacts/vegetation-m39-phone-motion-pixels/moving-turn.png)
- [D9普通无query入口、共享图集和世界阴影缓存](/home/ryan/workspace/coastline/artifacts/fineleaf-grass-m39-release/result.json)

最终实际GPU逐一射线核对1743个受压顶角读回（含矩形共享顶点的重复），埋地0、根部位移0、实际面法线点积最低.99999984；根部最大误差约13微米，道路0命中。7簇轮点样本平均下降约.242m，20秒.227m、45秒.062m、65秒恢复到无压控制；两侧平均外拨约2.2–2.4cm，距离渐退与移窗/半密度前缀保持。这是轻量植物形变近似，不是逐叶刚体物理。长期寿命逻辑未改，M36原实际65秒等待视频保留；本轮短运动不冒充完整长等待。

8个正式图0错误，桌面峰145calls/857704tri/129geo/54tex，手机111/376919/127/51；原750k/300k面及手机40纹理建议预算仍超。集合少于M38，不以较低峰值声称减少总体成本。像素熵桌面6.02–6.28、手机5.63–6.18，边缘密度.515–.688/.435–.574，最大主色份额.072/.119，只作非空白/层次证据，不替代美术评分。

主机固定路草/内陆各90有效GPU样本，M38控制P50=2.185/3.313ms，最终D9=2.076/3.455；P95=3.747/5.904→5.403/13.896。D9额外确认实际map sampler确实共享近草摄影图；早期Bcd为2.448/3.866和6.546/20.243，未记录该绑定，原数据保留。不同轮次频率与尾延迟波动明显，不挑低数据宣布提速或零成本，详见[最终GPU记录](/home/ryan/workspace/coastline/artifacts/ground-gpu-m39-release-binding/result.json)和[较早控制](/home/ryan/workspace/coastline/artifacts/ground-gpu-m39-control/result.json)。CPU每帧逻辑未改，未重复节流；真实一加12/iPhone仍待复核。

早期远草候选漏算新几何包围球，触发加载回退，已定位；修后18项17过/1桌面30秒记录超时，在浏览器完整逐值比较作者矩阵、只返回汇总后，该项三浏览器通过。最终远草试验放弃，单独保留原记录，不将它们合并成同版本独立验收。近草最终6项与GPU首次成本采自Bcd；D9只移除错误的灌木回调绑定，成功草图的渲染路径相同，最终3项失败回退与普通入口再次验证。普通入口前进8.45m，摄影图/11级mip和压力图实际上传、42投影体全部一次烘焙、测试全局undefined、0错误。当前试玩地址为[5190](http://10.158.204.114:5190/)。

---

# M38 · 扫描海岸树、分层枝叶和近镜头渐隐

2026-10-25，**index-sZ71VLvZ.js**，841.40kB/gzip235.02kB，已更新5190。保留原内陆树的独立随机序列、根部XZ、尺度关系与旋转，替换伞状冠与直筒树干为CC0 Island Tree 01扫描树。近5371/远1431面，近188/远67个空间簇分别用自己的三个方向实模图像，三张正交片保留体积和视差；不是整树单片。树皮使用摄影颜色、扫描法线与粗糙度，叶簇使用体积法线和轻微风动，刚体树不接入车辆压草。实体树干仍可能短暂挡住第三人称镜头；极近叶簇在1.2→3.8m范围按像素渐隐，减少驶入树冠时的大张贴片遮挡。

原159.94万面/60.7MB模型仅离线使用。最初16代表簇重复明显、1k逐簇图集分辨率不足，两者都未发布。最终逐簇2k无损WebP、独立512×256紧凑normal/roughness共3,299,118B，GPU RGBA含mip约22MiB，比旧松针图增加约20.67MiB；每级共用同一材质/两图。保护简化中的细连接，近/远只增加4/24面，两级木质连通部分均实测35；44,168叶片部分的空间分布在两级均保留，源细枝也逐簇烘焙。模型、纹理和烘焙输入SHA、许可及作者写入[source.json](/home/ryan/workspace/coastline/public/assets/models/coastal_tree/source.json)，离线核验通过。

- [12个正式桌面/横屏机位与辅助证据](/home/ryan/workspace/coastline/artifacts/evidence-coastal-trees.json)
- [模型连通性、来源哈希与预算](/home/ryan/workspace/coastline/artifacts/coastal-tree-m38-validation.json)
- [三浏览器相关回归原记录](/home/ryan/workspace/coastline/artifacts/tests-m38-connected-final.json)
- [全部根部射线、材质和近远切换复核](/home/ryan/workspace/coastline/artifacts/tests-m38-root-final.json)
- [近镜头渐隐后最终三浏览器材质/根部/LOD](/home/ryan/workspace/coastline/artifacts/tests-m38-camera-final.json)
- [最终真实触控驾驶与连续环顾](/home/ryan/workspace/coastline/artifacts/coastal-tree-motion-m38-camera/drive-and-orbit.webm)
- [普通无query入口验证](/home/ryan/workspace/coastline/artifacts/fineleaf-grass-m38-release/result.json)

相关18项首次有3项测试变量错误，修正后17过/1桌面根部检查超时；不是游戏报错。保留所有根点的实际三角射线检查，把每点断言改为汇总命中数和最大净空，3浏览器30.7秒全过。最终渐隐后同3项32.3秒全过。两个3项是同组复核，不合计为23个独立用例。原世界其他作者/布局继承、缓存阴影、草压共享/实际驾驶/切档/暂停、树加载失败回退都已通过；不把较早版本记录换标签。树脚扫描裙按实际坡面整体埋入，独立射线验证所有根部，无只比较高度公式的自证。

12个正式图0错误，桌面各项峰147calls/857704tri/129geo/56tex，横屏手机111/376919/128/53；仍超原750k/300k面和手机40纹理建议预算。匹配手机内陆视图336525→376919面、113→111calls、50→51纹理；不能用不同捕获集合的峰值推断净变化。最终真实触控前进、转向、制动与拖动环顾，模拟时间7.97秒、位移约10.87m，风动继续、树无草压绑定、世界缓存仍1次，0错误。已看正式图和实际运动前/驶过/环顾帧；近镜头渐隐明显减少叶片遮挡，实体树枝仍可遮挡局部画面。

8秒默认巡航、4倍CPU节流：M37→M38渐隐前同CPU路径Task3667→3650ms、Script3302→3287ms，距离108.92/108.50m，单轮相近路线，不是真机FPS。最终GPU固定路草/内陆各90样本、无disjoint：M37 P50=2.272/3.265ms，最终=2.535/3.546；P95=3.636/14.958→14.635/12.742，主机尾延迟波动大。渐隐前两次内陆对照P50约3.032→3.115、2.634→3.067，P95约4.718→10.189、4.362→4.986，原数据全部保留，不挑低样本宣布提速。详情见[最终对照](/home/ryan/workspace/coastline/artifacts/ground-gpu-m38-camera-control/result.json)、[最终候选](/home/ryan/workspace/coastline/artifacts/ground-gpu-m38-camera-final/result.json)和[CPU](/home/ryan/workspace/coastline/artifacts/mobile-performance/m38-final.json)。新版本一加12/iPhone实际帧率仍待复核，已询问一加12用户。

普通入口同sZ71前进8.45m，新树加载成功；旧草共享Canvas/mip、48容量配对主体、256²压草图上传及车位、42个世界投影体全部一次烘焙、测试全局undefined，0错误。树木形状和材质改善，但宽阔空坡、近远草形态与地表组合仍未达到用户要求。世界层次保持此前1.5/3判断，空地构图自动失败保留，其余九类本轮未重评；**Goal active**。下一阶段优先整体坡面/植被层次，以及实际手机反馈下的远树和纹理开销。

---

# M37 · 受压草叶的坡面接触

2026-10-25，**index-ldrvLuiu.js**，836.06kB/gzip233.42kB。草毯叶端随横移后的真实地形三角面抬起，摄影草/蕨/灌木沿已有地面坡度修正形变及法线；局部位移保留微小形变精度，未受压一般植物跳过额外变形计算。没有新增纹理、实例、作者或draw，CPU轨迹记录、保留时长和输入逻辑保持。

M36控制GPU读回的121个受压样本有1片叶端低于实际地面17.45mm，未压控制0。最终Chrome横屏/WebKit/桌面三配置对1082片可见且位移>1mm的叶端逐一用真实地形三角射线核对，埋地0；不是把shader高度公式当参考。根部位移0，移窗全/半密度前缀、两侧拨开、20/45/65秒恢复及距离渐隐保持，几何面与GPU法线点积最低.999747。一般植物使用原实例地面坡面近似，不声称逐枝完整碰撞。

- [本轮8个正式机位与辅助清单](/home/ryan/workspace/coastline/artifacts/evidence-plant-ground-contact.json)
- [旧版真实叶端接触控制](/home/ryan/workspace/coastline/artifacts/grass-canopy-m37-tip-contact-control/result.json)
- [最终Chrome全部受压叶端](/home/ryan/workspace/coastline/artifacts/grass-canopy-m37-local-final-mobile/result.json)
- [最终WebKit同项](/home/ryan/workspace/coastline/artifacts/grass-canopy-m37-local-final-webkit/result.json)
- [最终桌面同项](/home/ryan/workspace/coastline/artifacts/grass-canopy-m37-local-final-desktop/result.json)
- [三浏览器6个行为专项](/home/ryan/workspace/coastline/artifacts/tests-m37-ground-contact.json)
- [触控前进/转弯/制动/倒车与短恢复运动](/home/ryan/workspace/coastline/artifacts/vegetation-m37-phone-contact/driving-and-recovery.webm)

6项共享/实际驾驶/切档/暂停检查通过，8个正式图0错误；桌面峰147/785838/130/53，手机113/336525/128/52。集合比M36少，不能以较低桌面峰值宣称总面数减少。触控7→247个深压格，倒车停止后未暂停5.08秒，0错误，已看运动与坡面图；该视频仅证明接触改动期间的运动，完整65秒实际等待保留M36原标签，恢复渲染由本轮实际GPU时间控制再验。自然风景仍未整体达标，真实手机新美术/互动FPS待复核，**Goal active**。

已更新5190，同一ldrv构建普通无query入口实际前进、压力图已上传/车位正确、原摄影草资源与世界缓存保持、测试全局undefined，0错误。固定路草/内陆坡各90有效GPU样本、无disjoint，M36→M37 P50 2.388/3.406→2.428/3.235ms，P95 3.647/7.456→3.746/5.961ms，有尾延迟波动，不宣布真机提速；CPU压力路径未改，未重复CPU节流。详情见[普通入口](/home/ryan/workspace/coastline/artifacts/fineleaf-grass-m37-release/result.json)和[GPU计时](/home/ryan/workspace/coastline/artifacts/ground-gpu-m37-local-final/result.json)。

---

# M36 · 车辆拨草、车底压伏与恢复中的轮胎轨迹

2026-10-25，**index-D2-JlrYY.js**，835.03kB/gzip233.13kB，已更新5190。细草、摄影草/弯叶主体、蕨叶与矮灌木共用世界压力记录，车身两侧拨开、车底压伏，轮胎留下更深的连续倒草轨迹。浅痕1→5秒恢复，深痕12→60秒恢复；车底平面跟随俯仰/侧倾，形变法线同步调整。记录在GPU窗口外保留至过期，17→23m平滑呈现，跨时间戳边界保留新痕迹，防旧痕复活。独立模块负责实际需要的压力记录/资源/材质变形，没有新增模型、图片、draw或依赖。

初版18专项中3项抓到主体和克隆/模板材质漏接，修复后Cvl三浏览器18项通过；最终D2三浏览器共享实际纹理/编译、驾驶留下深浅痕、切档复用及暂停冻结3项再通过。两组不是21个同版本独立用例，D2未重复原18项全集，渲染改动另由实际GPU探针和正式图覆盖。CPU专项验证连续轮路、倒车方向、旋转接触点、软压不覆盖深痕、跨窗返回、瞬移不连线、过期、时间回退/边界、倾斜车底和资源释放。

最终D2 Chrome横屏/WebKit/桌面实际编译顶点shader读回：根部位移0，全/半密度移窗重叠叶片一致；两侧叶端平均向外约2–3cm，四片轮点区域叶端平均降低约.337m，20秒约.312m、45秒约.078m、65秒与无压控制完全一致。实际形变面与GPU法线点积最低.999739、长度误差<.00000016。受控旧痕距离0/15/20/26m平均压伏约.338/.338/.152/0m，验证移窗边界前已有渐隐。它们是实际GPU程序/几何检查，不是美术评分或真机FPS。

- [本轮12正式机位与辅助清单](/home/ryan/workspace/coastline/artifacts/evidence-vegetation-interaction.json)
- [D2三浏览器最终共享/驾驶/切档/暂停](/home/ryan/workspace/coastline/artifacts/tests-m36-range-bindings.json)
- [Cvl18项基础回归原记录](/home/ryan/workspace/coastline/artifacts/tests-m36-vegetation-final.json)
- [CPU轨迹/边界/坡面/生命周期](/home/ryan/workspace/coastline/artifacts/tests-m36-pressure-cpu-final.json)
- [D2 Chrome实际形变与距离渐隐](/home/ryan/workspace/coastline/artifacts/grass-canopy-m36-range-final-mobile/result.json)
- [D2 WebKit同项](/home/ryan/workspace/coastline/artifacts/grass-canopy-m36-range-final-webkit/result.json)
- [D2桌面同项](/home/ryan/workspace/coastline/artifacts/grass-canopy-m36-range-final-desktop/result.json)
- [手机触控前进/转弯/倒车与65秒恢复](/home/ryan/workspace/coastline/artifacts/vegetation-m36-phone-final/driving-and-recovery.webm)
- [D2桌面键盘同类连续运动](/home/ryan/workspace/coastline/artifacts/vegetation-m36-desktop-final/driving-and-recovery.webm)
- [D2普通入口](/home/ryan/workspace/coastline/artifacts/fineleaf-grass-m36-release/result.json)

手机录像为CMB近处同渲染路径，7个深压格→前进255格，并实际未暂停等待65.16秒；最终D2另录桌面键盘65.08秒（7→229格），均0错误。两段固定环境风相位使压伏/恢复可辨，交互时间正常前进，不是快进或切换时间截图。已看最终正式蕨叶/灌丛、手机前进/恢复和桌面运动帧；痕迹目前较细，受草地密度影响。自然景观仍沿用M35未达标，不以新增互动抬高整体视觉结论，**Goal active**。

手动内陆8秒4倍CPU节流Task4015→4234ms、Script3601→3806ms（约+5.5/+5.7%），相近非同轨迹；最终D2固定机位各90有效GPU样本P50路草/内陆2.103/3.156ms、P95 3.143/4.217ms，保留比前版较低样本更高的最终成本。12图桌面峰147/805233/130/53，手机113/336525/128/52，原预算超标仍在，真实一加12/iPhone新版本FPS待复核。普通无query入口实际前进、256²/262144B压力图已上传、车位uniform正确、原摄影草与世界缓存保持、测试全局undefined，0错误。坡地叶端的接触形态仍需进一步专项检查和改善。

---

# M35 · 连续干草地表与世界固定的近景草覆盖

2026-10-25，**index-D6VD0TVj.js**，826.13kB/gzip229.91kB，已更新5190。地表沿温和坡面混合连续干草、裸土和陡坡岩面，并先归一化片元地形法线再决定坡度权重。独立GPU草层采用短叶为主的32面cell，固定世界hash、根部实际三角面贴合、径向高度渐隐和世界奇偶低档前缀；每帧只改时间/车位/窗口uniform。未改变地形、道路、驾驶物理或旧植被作者。

最终相关12项（三浏览器各草毯切档/实际驾驶、八图地表、海岸准备、减弱动态）通过。首轮WebKit定时2.5秒只走0.87m，改为按真实移动距离等待，三个项目均通过，未降低移动门限。顶点探针最初按作者等步长抽样导致桌面只命中窗口边缘，改为从实际可见叶中均匀抽样；源代码未为检查改形体。最终Chrome手机/WebKit/桌面实际编译shader的transform feedback均通过：内陆/路草每图抽取128片叶的两个根点、共256条实际三角射线，最大贴地误差0.0000188m、道路命中0；单轴移窗后全档/半密度重叠草叶含叶端形态完全一致，风动根部误差0、叶端约0.10m，半密度为完整输出前缀。桌面镇旁另222根点，手机镇内无可见草，不以零样本证明贴地。

- [正式12图和本轮辅助清单](/home/ryan/workspace/coastline/artifacts/evidence-grass-canopy.json)
- [实际桌面坡面](/home/ryan/workspace/coastline/artifacts/pass-m35-grass-canopy/desktop-bank-inland.png)
- [手机近景草覆盖](/home/ryan/workspace/coastline/artifacts/pass-m35-grass-canopy/mobile-field-verge.png)
- [Chrome实际GPU草根/风动/移窗](/home/ryan/workspace/coastline/artifacts/grass-canopy-m35-mobile-validated/result.json)
- [WebKit实际GPU同项](/home/ryan/workspace/coastline/artifacts/grass-canopy-m35-webkit-validated/result.json)
- [桌面实际GPU同项](/home/ryan/workspace/coastline/artifacts/grass-canopy-m35-desktop-validated/result.json)
- [移动距离等待后最终三浏览器](/home/ryan/workspace/coastline/artifacts/tests-m35-canopy-movement.json)
- [地表与岸边其余专项](/home/ryan/workspace/coastline/artifacts/tests-m35-canopy.json)
- [实际横屏触控离路与环顾](/home/ryan/workspace/coastline/artifacts/offroad-grass-m35-phone/android-touch.webm)
- [普通入口与实际草层资源](/home/ryan/workspace/coastline/artifacts/fineleaf-grass-m35-release/result.json)

默认巡航8秒4倍CPU节流Task3537→3525ms、Script3165→3164ms，距离同为108.923m，仅近似持平。两个固定GPU机位各90样本，无disjoint；P50 1.897/2.722→1.839/2.440ms，P95 2.541/10.652→2.763/4.150ms，有频率及尾延迟波动，不是实际手机FPS或新增几何提速证据。正式峰桌面147/805233/130/53，手机113/336525/128/49；实际离路76.34m/50.09秒并返回，0错误，压力124/384409/129/53，仍超手机300k/40预算28.1%/32.5%。取舍和内存详见文档09。

普通无query入口前进超过2m，真实草层RG32F121²/117128B、2304容量/1152提交、随车uniform正确；原摄影草共享/mip/弯叶配对和世界阴影缓存保持，测试全局undefined，0错误。已看最终桌面坡面/横屏原野及连续环顾帧；近景体量有所改善，但远坡与近远草形态仍不完整，世界层次1.5→1.5，空地自动失败保留，其余九类未重评，**Goal active**。用户新确认车辆两侧拨草、车底压伏与几十秒恢复的轮胎轨迹，R17/A24已记，尚未以风动替代车辆互动验收。

---

# M34 · 不规则草斑与近处立体弯叶

2026-10-24，**index-BXlABHjY.js**，816.57kB/gzip226.54kB，已更新5190。100个不规则草斑沿路展开并向路肩偏置，保留裸土间隙与高低变化；手机14302个新原野作者点，既有道路草/树/灌丛/岩体的随机流保持。近处18片弯曲收尖薄叶（90面/簇）补摄影细枝体量，远处仍6面轮廓。没有新图片或下载，主体仅48/96容量，复制已选摄影细枝的矩阵/颜色/坡度，共用原近景总额。**整体自然风景仍未达标，Goal active**。

全field主体版三浏览器18项通过；改为紧凑伴随实例后9项相关复核通过；手机远草范围收至120m后最终12项通过。它们是逐次变更的验证范围，不相加为39个独立用例。覆盖独立实际根部射线、层内无重复/近远互斥、每个摄影细枝有同作者主体且可见数相等、共享48/96/前缀/质量复用、失败回退继续驾驶与实际GPU草链。一次只读审查指出硬X形、成本归因和配对语义；分别通过弯叶几何、实际计时与明确各层断言处理，未递归审查。

拒绝了常驻交叉片近景与230/350高密度版。最终160/250候选密度、48/96伴随主体，手机远草85→120m消退，桌面225→260m保持。CPU 8秒4倍节流M33 Task3159/Script2790→最终3399/3049ms，约+7.6%/+9.3%；近似路线108.92/108.29m，新增景观确有成本。两个冻结机位各90个GPU样本、无disjoint，M33路草/内陆P50=1.959/3.112ms，最终2.126/2.817；最终P95=9.962/4.712有明显尾延迟，不能据P50宣称普遍提速或真机FPS。

零samples/恒定投影的实际远草材质，手机80/90/100/110/117/120/125m覆盖Chrome3049/2886/1872/597/68/0/0，WebKit3064/2917/1903/603/73/0/0；桌面220/230/240/250/257/260/265m为3105/2951/1882/601/71/0/0。末段仍非零，到界/界外零，0错误。

最终12正式图0错误，桌面峰147calls/674161tri/129geo/53tex，横屏手机112/299661/128/50。实际双指离路88.10m、四角环顾并返回49.36秒，0错误，近草峰48；整程123/348287/128/52，仍超初始300k/40约16.1%/30%。M33相同脚本76.16m不是逐帧同路线，不拿面数差额当本轮确定增量。

- [正式12图与22辅助清单](/home/ryan/workspace/coastline/artifacts/evidence-curved-grass.json)
- [实际桌面内陆坡面](/home/ryan/workspace/coastline/artifacts/pass-m34-curved-grass/desktop-bank-inland.png)
- [实际手机原野](/home/ryan/workspace/coastline/artifacts/pass-m34-curved-grass/mobile-field-verge.png)
- [最终三浏览器复核](/home/ryan/workspace/coastline/artifacts/m34-range-compat.json)
- [最终GPU计时与波动](/home/ryan/workspace/coastline/artifacts/ground-gpu-grass-m34-distance/result.json)
- [实际离路视频](/home/ryan/workspace/coastline/artifacts/offroad-grass-m34-phone/android-touch.webm)
- [普通发布入口](/home/ryan/workspace/coastline/artifacts/fineleaf-grass-m34-release/result.json)

普通无query入口前进8.30m，草图共享/11与9级mip、主体90面/48矩阵与坡度容量、主体数等于实际细枝数（此入口为0）、世界缓存1次43draw、测试全局undefined，0错误。它验证正常入口和资源；实际可见主体由三浏览器、正式图与连续驾驶另外验证。

依据本轮已查看的三张校准锚点复评实际桌面/横屏图，世界层次仍1.5→1.5：近处体量和分布改善，但远草团块、宽阔空地与坡面大形仍未到2档，空地构图自动失败保留。其余九类本轮未重评，不生成整体均分。下一轮优先让近远草形态/颜色连贯，并以真实干燥海岸参考校准地表和坡面，真实一加12/iPhone新美术FPS仍待复核。

---

# M33 · 草叶轮廓与原野远草消退

2026-10-24，**index-D54dcJnW.js**，814.89kB/gzip225.85kB，已更新5190。复用现有两张草图、全部模型及作者摆放，完整Canvas保覆盖mip与中心Alpha裁切让细草缩小时保留轮廓；远草在115→150m手机、225→260m桌面逐渐减少覆盖。没有增加下载、纹理槽、作者数量或近草48/96总额。**整体自然风景仍未达标，Goal active**；成片草灌关系、大片空地和坡面形态继续处理。

受影响三浏览器27项全过，含实际GPU草程序/链接、近远互斥、质量前缀/共享资源、草三种下载或尺寸失效后继续行驶，以及草/灌丛源ImageBitmap关闭的连带回归。一次只读审查指出末端样本漏断言、桌面分支未测与掩码仅采集，均已补强，不递归审查。

受控128个独立掩码中，每个8/16px的正侧面、0/4 samples都比自身旧处理保留更多覆盖；摄影正面8px单samples从3→10像素，16px18→38。实际摄影GPU mip五级Alpha/RGB误差0，程序四级Alpha0/RGB≤1，按各自flipY核对。手机四族完整作者矩阵Float32哈希与M32一致。掩码与哈希证明的是轮廓和布局，不是整体画质。

实际远草材质在零samples/固定投影下，手机Chrome110/120/130/140/147/150/155m覆盖3049/2886/1872/597/68/0/0，WebKit3010/2867/1878/611/69/0/0；桌面220/230/240/250/257/260/265m为3129/2972/1897/608/73/0/0。原M32手机相同目标2307/2307/2305/2300/2276/0/0，原本几乎不变后突然消失的记录保留。

最终12个正式视图0错误，桌面峰143calls/656633tri/128geo/53tex，手机峰107/274836/127/50。真实横屏双指驶离76.16m、四角环顾并返回50.10秒，0错误，近草峰36；整程119/342931/127/52仍超300k/40初始预算约14.3%/30%。CPU对照Task3157→3159ms、Script2796→2790ms；两个固定机位各90个GPU样本P50为2.151/2.213→2.101/2.110ms，尾延迟与主机频率有波动，不据此宣称新材质提速或手机FPS。

普通无query入口开始前进8.30m，两族近远草共用各自Canvas/11与9级mip、中心裁切和原野覆盖正确；灌丛四文件各一次、世界阴影缓存1次43draw、测试钩子及诊断undefined，0错误。真实一加12/iPhone新美术帧率仍待复核。

- [本轮正式12图与辅助清单](/home/ryan/workspace/coastline/artifacts/evidence-grass-coverage.json)
- [实际桌面原野](/home/ryan/workspace/coastline/artifacts/pass-m33-grass-coverage/desktop-field-verge.png)
- [实际手机路草](/home/ryan/workspace/coastline/artifacts/pass-m33-grass-coverage/mobile-grass-verge.png)
- [受控轮廓与真实GPU上传](/home/ryan/workspace/coastline/artifacts/grass-coverage-m33-final/result.json)
- [WebKit末段消退](/home/ryan/workspace/coastline/artifacts/grass-fade-m33-final-webkit/result.json)
- [实际横屏离路视频](/home/ryan/workspace/coastline/artifacts/offroad-grass-m33-phone/android-touch.webm)
- [正常发布入口](/home/ryan/workspace/coastline/artifacts/fineleaf-grass-m33-release/result.json)

已重新查看三张校准锚点、最终桌面/横屏画面与实际离路环顾。窄范围世界层次仍1.5→1.5，空旷构图自动失败保留；其余九类本轮未重评。草叶更完整不足以达到用户要求，下一步实际试验不规则成片枯草与裸土地带的组合。

---

# M32 · 干燥细针叶灌丛与真实横屏验证

2026-10-24，**index-DJ93ttqD.js**，814.48kB/gzip225.76kB，已更新5190。完整扫描细针叶d/e接入道路与内陆群落，两族共享两图/8手机16桌面近景总额，原作者矩阵、颜色与质量前缀保持。原图分区覆盖mip、线性光平均和中心化裁切保留细叶；纹理所属加载者在成功转移或失败清理时关闭原ImageBitmap。**自然风景仍未达标，Goal active**；草丛细杆、空旷地表和坡面形态继续处理。

CSw全距离版三浏览器21项通过，涵盖LOD/实际根部/前缀/共享、三种下载失败和16px损坏图、位图释放及实际GPU所有program的LINK_STATUS；稍早手机代理版DJ93再通过9项相关复核，不相加为30个独立用例。手机内陆34±6m/道路52±6m转代理，近景距离不变，桌面75±6/110±6保持。

最终16个正式机位全部0错误，桌面1280×720峰143calls/656633tri/128geo/53tex，手机844×390峰107/274836/127/50。首次误传不支持的seed参数、后续仍沿用竖屏设备视口的旧报告都保留；最终本地inspector明确横屏，不伪改旧报告。旧竖屏统计不能与新横屏峰值直接比较。

实际横屏双指驶离公路75.93m、四角环顾并返回49.84秒，0错误，近草峰36；整程119/342446/127/52，仍超初始300k/40预算约14.1%/30%。M29同脚本76.19m/337515面不是同一逐帧路线。CPU近似巡航Task3170→3170ms、Script2812→2822ms；90个GPU样本P50原野/近群落M29=1.835/1.891ms、初候选=2.116/2.084ms、手机距离优化后=1.745/2.009ms，主机频率/采样波动保留，不称真实手机或全部场景同比提速。

Chrome实际代理材质110/120/130/140/144/145/150m覆盖992/936/526/69/5/0/0，WebKit为1019/946/522/78/5/0/0，单samples目标中末段持续至144m，145m与150m均0。普通无query的5190入口开始后8.60m，四个新文件各请求一次、旧灌木路径0请求，11级Canvas mip/共享图/缓存1次43draw正确，测试钩子/诊断undefined，0错误。

- [正式16图与27辅助清单](/home/ryan/workspace/coastline/artifacts/evidence-fineleaf-world.json)
- [桌面实际原野](/home/ryan/workspace/coastline/artifacts/pass-m32-fineleaf-landscape/desktop-field-verge.png)
- [横屏手机电影驾驶](/home/ryan/workspace/coastline/artifacts/pass-m32-fineleaf-landscape/mobile-cinematic.png)
- [真实离路与完整环顾](/home/ryan/workspace/coastline/artifacts/offroad-fineleaf-distance-phone/android-touch.webm)
- [完整行程/成本记录](/home/ryan/workspace/coastline/artifacts/offroad-fineleaf-distance-phone/android-touch.json)
- [距离优化GPU计时](/home/ryan/workspace/coastline/artifacts/ground-gpu-rooibos-distance/result.json)
- [WebKit末段覆盖](/home/ryan/workspace/coastline/artifacts/scrub-fade-rooibos-final-webkit/result.json)
- [正常发布入口](/home/ryan/workspace/coastline/artifacts/fineleaf-release-smoke/result.json)

清单43项核对通过。重新查看三张技能校准图与最终实际画面，世界层次本轮仍1.5→1.5，空地构图自动失败保留；其余九类未重评，不推导整体均分。真实一加12/iPhone新美术FPS仍待复核。

---

# M29 · 内陆灰绿群落与手机选择成本

2026-10-24，**index-D_jyuSBA.js**，811.39kB/gzip224.74kB，已更新5190。复用已有实拍Shrub04枝叶/两图，在海岸内陆形成112个有疏密与高度变化的群落，手机1285/桌面2115作者摆放，避开道路/洞口/陡坡/小镇建筑带；原世界作者矩阵和低档前缀保持。新旧近景合用8/16总名额，内陆三层LOD/32m单元限制额外成本，无新图片。**整体自然风景仍未达标，Goal active**；大片平整地面、山坡大面、稀疏株型仍需修整。

一次只读审查发现失败回退缺少范围、正常代理alpha-test前渐隐提前消失；修复后未递归审查。实际相机/已绘实例距离检查回退，实际代理材质在零samples目标恒定投影尺寸验证覆盖：Chrome110/130/140/144/145/150m为1595/789/115/8/0/0像素，WebKit1605/772/113/8/0/0。旧版140m已经0，初修145m尚有1–2残点的失败原图均保留；最终稳定像素阈值与极小覆盖epsilon兼容无MSAA手机。这不是整体画质或真机FPS证明。

聚集分布版受影响三浏览器 **28通过/2平台跳过**，覆盖原世界fixture、根部/路肩独立射线、近草共享、旧新灌丛与车漆/首帧缓存；边界修复版14通过/1跳过，最后空间优化版 **9项全过**，加入实际三层距离带检查。不是将三次运行相加为独立用例。一次手机候选反向图车漆部分缺失，同bundle重采、两浏览器连续四帧与最终转身未复现，尚无根因，保留为未复现问题而非宣称已修复。

最终 **artifacts/evidence-inland-colonies.json**（pass-m29-inland-near-pool）十六机位0错误，桌面各项峰143calls/635309tri/128geo/53tex，手机96/248160/125/46。已看正常驾驶原野、侧向、完整转身及近群落；四个正常手机固定图优化前后阈值>8变化0，scrub-field2086像素变化，未声称全部图一致。校准后的世界层次仍1.5/3，空地构图不足的自动失败仍成立，不把专项通过当高级画质完成。

4倍CPU暖机1.5秒后默认巡航8秒，M28控制Task2934/Script2582ms，群落初版3301/2942；近景只扫退出距离、远/代理在绘制候选上维护迟滞后为 **3104/2741ms**，相对初版约-6.0%/-6.8%，相对M28仍+5.8%/+6.2%，同终点108.29m。单轮主机比较不能替代一加12/iPhone帧率，heap差仅GC状态，无新整帧GPU计时。

最终横屏真实双指离路76.19m、四角环顾并返回50.08秒、0错误，近草共用峰36≤48；整程119calls/337515tri/127geo/52tex，仍超300k/40约12.5%/30%。初版77.09m与M28的88.02m轨迹不同，不能按面数差额伪称同比提速。

- [实际原野驾驶](/home/ryan/workspace/coastline/artifacts/pass-m29-inland-near-pool/desktop-field-verge.png)
- [正常侧向群落](/home/ryan/workspace/coastline/artifacts/inland-scrub-colonies-near-pool-desktop/field-verge-inland.png)
- [手机完整转身](/home/ryan/workspace/coastline/artifacts/inland-scrub-colonies-near-pool-phone/field-verge-reverse.png)
- [实际离路记录](/home/ryan/workspace/coastline/artifacts/offroad-inland-near-pool-phone/android-touch.json)
- [实际离路视频](/home/ryan/workspace/coastline/artifacts/offroad-inland-near-pool-phone/android-touch.webm)

正常dist与候选同D_jyuSBA；普通入口开始前进8.30m，新群落ready/共享图/独立坡度与145m范围、原植物/岩体及一次缓存1/43正常，钩子与诊断undefined、0错误。试玩[当前地址](http://10.158.204.114:5190/)。继续分析坡地与道路外地面过渡，整体目标未完成。

---

# M28 · 实拍棕榈树干与连续驾驶

2026-10-24，**index-B8t9kL2e.js**，808.52kB/gzip223.83kB，已更新5190。均匀程序环纹换为实拍日晒纤维/损伤，512×1024颜色和normal RGB/roughness A共享表面按生长方向/约1.3m尺度映射，三路实例phase对齐。原位置、弯曲、树根/碰撞及共享随机流保持。**整体自然风景仍未达标，Goal active**；离路群落稀疏、地形表面均匀、硬折小叶和树皮周期仍需改进。

一次独立只读审查找到UV边位置重合但法线约差36°的硬缝；保留UV分离并平均边法线修复，没有递归审查。三浏览器实际游戏网格按位置独立配对，法线角差<.01°；连同编译shader的A粗糙度/三路phase、高低反复切档资源复用、两张单图各自失败仍可巡航、八槽地表、原世界矩阵/岩岛、首帧缓存和树根，共 **21项通过**。

Chrome/WebKit实际GPU纹理全像素读回，与处理后参考PNG的normal RGB/roughness A最大字节误差0；参考不是原分辨率JPEG。此读回在RmWwu_Pi完成，最终只修几何边法线，图像及通道未变；ground模式回归三张1024²表面也0误差。实拍资产来源/作者/CC0、处理和哈希见文档06及palm-bark-source.json。

正式 **artifacts/evidence-photographed-bark.json** 十二视图0错误，桌面各项峰139calls/623886tri/121geo/53tex、手机94/247820/118/46。已看实际驾驶原野/路边及最终正侧背近景，近远冠体保持，固定模型镜头连续风动3.33/3.25秒留存。模型预览与非空指标不能代替整体自然感验收。

每棵可见树干112→240tri，新增两图共1,137,530字节/含mip估算5.33MiB存储。手机横屏实际双指离路88.02m、四角环顾并返回49.48秒、0错误，近草总峰48≤48；整程115calls/329400tri/120geo/52tex，仍超300k/40约9.8%/30%。4倍CPU持续巡航8秒M27 Task2870/Script2513→M28 **2948/2574ms**，约+2.7%/+2.4%，同终点108.29m，单轮比较不证明逐帧同轨迹或将全部差额归因材质；没有新的GPU计时/实际一加12或iPhone帧率。

- [实际海岸驾驶](/home/ryan/workspace/coastline/artifacts/pass-m28-photographed-bark/desktop-active-play.png)
- [实际原野树干](/home/ryan/workspace/coastline/artifacts/palm-crown-photographed-bark-final-desktop/world-field-verge.png)
- [最终树干背面近景](/home/ryan/workspace/coastline/artifacts/palm-crown-photographed-bark-final-desktop/trunk-back.png)
- [横屏实际离路记录](/home/ryan/workspace/coastline/artifacts/offroad-photographed-bark-phone/android-touch.json)
- [横屏实际离路视频](/home/ryan/workspace/coastline/artifacts/offroad-photographed-bark-phone/android-touch.webm)

正常dist/5190同B8t9kL2e；普通入口实际开始前进8.60m，两图共享/准备及颜色空间、240面树干、一次缓存1/43、植物正常，钩子/诊断undefined、0错误。试玩[当前地址](http://10.158.204.114:5190/)。继续改善可驶入区域的群落与地形层次，整体目标未完成。

---

# M27 · 出洞海景、共边山体与实际高度

2026-10-24，**index-D82rtCAi.js**，807.41kB/gzip223.41kB，已更新5190。隧道侧翼从沿路约27m缩回约7m，缓和侧坡纵向收口，出洞视野直接展开大海；删除39个未贴图多面体椭球，保留连续山体、真实内外拱壳/厚洞口/灯具，无新增图片。**整体自然风景仍未达标，Goal active**；山体大尺度面感、硬折小叶、均匀树干仍需精修。

一次独立只读审查发现两项M26已存在的问题：约5m道路样本逆算使实际侧翼安全高度低估约17m，侧面机位可进实体；屋顶32均匀段与封面手写截面不共边，接缝最高约2.24m。局部提取TunnelHeadland，使绘制和高度共用实际三角网格；屋顶/封面共用截面与首末行顶点，scanSurface精确查询，连续道路投影单独保留中央空气通道。修复后未递归审查，以独立三角射线和开放边拓扑验证。

纯CPU桌面/手机、基础/起伏地面四组合，各2067条侧翼网格射线、1320/1321实际屋顶点，最大高度误差6.6e-14、0漏面；洞口外高于地面的开放接缝0，中央各63点与已知侧面机位通过。地面/拱洞边缘仍有232/204条开放边，不伪称整个独立模型封底。最终三浏览器驾驶/巡航/三视角/选车/暂停、车内急转、树根/原世界矩阵与首帧缓存 **15项全通过**。

正式 **artifacts/evidence-tunnel-headland.json**（pass-m27-shared-headland）十二视图0错误；桌面各项峰139calls/621710tri/121geo/51tex，手机94/247180/118/44。实际连续穿越 **手机14.11秒/桌面14.27秒**，真实按钮切车内/追随、出洞后拖动回看，0碰撞/离路/错误。99条实际山体/内外拱壳净空射线各含81条内部有顶样本，最小眼高以上净空3.795/3.796m。中央净空和侧翼/接缝分开验证；所有前版原图/通过报告保留为pre-surface历史，未覆盖或冒充最终证据。

共享截面增加几何，但删除39×80tri占位物后净少手机768/桌面208面；同一tunnel-exit手机228905→228137、桌面568913→568705tri，其余调用/几何/纹理保持。4倍CPU同tunnel起点、暖机1.5秒、持续巡航8秒：M26 Task2955/Script2627→M27 **2718/2410ms**，约-8.0%/-8.3%，终点相差0.81m，不能当逐帧同轨迹或将差额全部归因于查询优化。heap29.88/36.72MiB仅当次GC状态，无新GPU计时/一加12或iPhone帧率；M26绕岩超预算压力边界仍保留。

- [实际出洞海景](/home/ryan/workspace/coastline/artifacts/pass-m27-shared-headland/desktop-tunnel-exit.png)
- [实际洞口回看](/home/ryan/workspace/coastline/artifacts/tunnel-shared-roof-desktop/portal-back.png)
- [横屏车内穿越](/home/ryan/workspace/coastline/artifacts/tunnel-shared-roof-phone/cabin.png)
- [实际穿越/切镜记录](/home/ryan/workspace/coastline/artifacts/tunnel-shared-roof-phone/result.json)
- [侧翼高度与接缝拓扑](/home/ryan/workspace/coastline/artifacts/tunnel-surface-shared-roof-first/summary.json)

普通dist与候选同D82rtCAi；5190无query入口实际开始前进8.59m，手机山体5200tri、外拱壳2304tri、缓存1/43、准备正常，钩子/诊断undefined、0错误。试玩[当前地址](http://10.158.204.114:5190/)。继续树干实拍表面与自然细节，整体目标未完成。

---

# M26 · 分龄棕榈冠与远叶覆盖

2026-10-24，**index-Ot5MRk8T.js**，807.66kB/gzip223.54kB，已更新5190。原单层细线冠改为14/18片按年龄展开的叶轴：下层老叶垂落、中层展开、年轻叶向上；黄金角错落、局部扫弯、错位小叶及折脊增加体积。所有叶轴从实际干顶生长，独立随机流不改变原世界作者矩阵/树根/碰撞，无新增图片。**整体自然风景仍未达标，Goal active**；硬折小叶、均匀环状树干、隧道山体直切仍需改。

手机近1185/远401tri（旧975/339），桌面2673/729（旧2523/339）。一次只读审查发现初版桌面远冠太稀：CPU正侧背顶覆盖约50–53%，实际130m像素near748/far474。桌面far由5对补到8对后630像素（约84%），250m211/193（约91%）；手机153/122、43/33。像素是与中性背景差>8计数，不证明轮廓完全相同。原始缺陷图保留，修改后未递归审查，以新距离原图验证；固定阴影仍只烘焙一次远冠，新增叶片也会改变缓存叶影覆盖。

TypeScript/生产构建通过。三浏览器根部/原世界摆放fixture/首帧缓存/手机降级 **11通过、1平台跳过**。最终四档几何0退化面/异常值，法线误差max4.14e-8；这些数据不能替代美术观察。模型正/侧/背/顶、实际正常原野/路边/电影图与3.25/3.33秒不暂停风动留存。正式 **artifacts/evidence-layered-palms.json** 八机位0错误，桌面各项峰139calls/621710tri/121geo/51tex，手机94/247180/112/44；同机位调用/几何/纹理数保持，面数增加如文档09。

横屏实际双指离路、四角环顾并返回 **49.21秒/87.91米/0错误**，峰116calls/326407tri/120geo/50tex，仍超300k/40约8.8%/25%。4倍CPU持续巡航8秒Task2977/Script2625ms，M25 2944/2597，约+1.1%/+1.1%，同终点108.92m仍巡航；不称真机FPS不变。手机行程/CPU在ensIaI2k完成，最后仅桌面far分支补叶，手机代码几何不变；最终Ot5MRk8T手机正式图与普通入口另验。未新增GPU耗时测量，真实一加12/iPhone仍待反馈。

- [实际驾驶原野](/home/ryan/workspace/coastline/artifacts/pass-m26-layered-palms/desktop-field-verge.png)
- [实际手机原野](/home/ryan/workspace/coastline/artifacts/pass-m26-layered-palms/mobile-field-verge.png)
- [真实模型侧面](/home/ryan/workspace/coastline/artifacts/palm-crown-layered-final-desktop/near-side.png)
- [真实模型顶部](/home/ryan/workspace/coastline/artifacts/palm-crown-layered-final-desktop/near-above.png)
- [远距像素记录](/home/ryan/workspace/coastline/artifacts/palm-crown-layered-final-desktop/result.json)
- [手机离路行驶](/home/ryan/workspace/coastline/artifacts/offroad-layered-palm-phone/android-touch.webm)

普通dist与候选同Ot5MRk8T；5190无query入口前进8.30m，实际手机近远1185/401面、一次缓存1/43、植物准备正常，钩子和诊断undefined、0错误。试玩[当前地址](http://10.158.204.114:5190/)。继续修整山体形态，未宣布自然景观验收完成。

---

# M25 · 连续干草地、海砂与岩岸

2026-10-24，生产包 **index-BXrxtmQy.js**，807.13kB/gzip223.33kB，已更新5190。内陆真实枯草与褐土按海拔、坡面及宏观噪声形成连续斑块，约2.5m摄影尺度；海砂与三向岩面保留。地形、六路肩、洞顶共用材质，实际物理表面不变。原野近草改暖干色，仍借用路边图集并合用48/96总名额。**整体自然风景仍不达标，Goal active**：棕榈细线冠、简单树干和山体直切轮廓仍需改进。

新素材来自[Poly Haven Withered Grass](https://polyhaven.com/a/withered_grass)，Charlotte Baglioni/CC0；输入官方MD5、字节与全部输出SHA、处理方式见dry-field-source.json。地面/砂地normal RGB+roughness A各合一张无损WebP，腾出的两槽供枯草color/surface，实际地表仍八张1k纹理。首次下载净增加 **7,156,159字节**；不称下载优化。Chrome与WebKit从实际游戏sampler取得纹理，用texelFetch/readRenderTargetPixels逐像素对照同浏览器原JPEG，三张图的RGB法线/A粗糙度六组最大误差均0，区别于仅CPU编码验证。

三浏览器受影响范围 **17项通过、1项按平台跳过**，覆盖八槽实际uniform/请求/颜色空间/mip、六路肩共享、近草共用cap、实际根部射线、首帧车漆和海水进退。最终普通构建还修复新增测试的TypeScript观察对象类型，运行代码未变。一次独立只读审查未发现通道/所有权/风动贴地调用链缺陷，指出CPU编码不能代替浏览器上传验证，本轮补充GPU读回，没有递归审查。

正式 **artifacts/evidence-dry-field.json**（pass-m25-dry-field-final）16机位0错误；桌面各项峰139calls/616031tri/121geo/51tex，手机94/246426/118/44，与M24同机位相同。首次采集因URL漏test参数无法切状态，pass-m25-dry-field全部失败报告保留；使用新runId/路径重拍，不覆盖旧证据。已实际查看原野/路边/隧道、离路内陆环顾及近岸图；地面分区更合理，仍不能以非空像素或专项通过替代美术验收。

横屏真实双指离路、四角环顾、返回公路 **49.52秒/88.08米/0错误**；近草最高47≤48，峰116calls/320139tri/120geo/50tex，仍超300k/40约6.7%/25%。海水实际深度水线四测线两个周期往返1.23–2.62m，8个地面探针湿润变化、4个高处干地不变，正常运行18.02秒。

硬件GPU四状态各90次、新旧两轮完整保留，P50/P95全表见文档09。原野中位1.97–2.11ms（M24 2.19–2.58），隧道2.89–2.98（M24 2.74–2.88），第二轮候选长尾变大，整体波动明显，不宣称GPU提速或真机帧率不变。4倍CPU持续巡航8秒Task2944/Script2597ms，M24 2877/2538，约+2.3%/+2.3%；终点仍在巡航、距离108.92m，非逐帧相同轨迹。真实一加12/iPhone开销仍待复核。

- [正常原野追随](/home/ryan/workspace/coastline/artifacts/pass-m25-dry-field-final/desktop-field-verge.png)
- [连续路肩与地面](/home/ryan/workspace/coastline/artifacts/pass-m25-dry-field-final/desktop-grass-verge.png)
- [手机离路环顾](/home/ryan/workspace/coastline/artifacts/offroad-dry-field-phone/android-touch-orbit-2.png)
- [双指行驶录像](/home/ryan/workspace/coastline/artifacts/offroad-dry-field-phone/android-touch.webm)
- [实际GPU数据比较](/home/ryan/workspace/coastline/artifacts/packed-ground-dry-field-chrome/result.json)
- [近岸运动与湿润](/home/ryan/workspace/coastline/artifacts/shore-wash-dry-field-phone/samples.json)

普通dist与候选同BXrxtmQy；5190无query入口点击开始前进8.45m，六路肩/field ready/共用贴图/独立坡度/一次缓存正常，钩子和诊断undefined、0错误。试玩[当前地址](http://10.158.204.114:5190/)。继续M26棕榈形体，整体目标未完成。

---

# M24 · 可驶入原野的干草斑块

2026-10-24，生产包 **index-DNiaziFM.js**，已更新5190。内陆不规则斑块复用原远草和摄影图，手机4991个作者位置、低档55%前缀；与原路边近草共用48手机/96桌面总名额。独立随机源和显式角度保留旧树/草/岩/蕨叶摆放。实际terrain+路肩坡度与根部贴合，远草150/260m裁剪、最后35m渐隐，选中株2m优先差稳定名额。**整体自然景观仍不达标，Goal active**；原野仍由同一种海岸碎石表面主导，下一步干草地底层与分区。

最终TypeScript、生产构建及三浏览器environment **42项全部通过**：新共享预算/前缀/互斥/距离/贴图/独立属性/独立射线、草资源回退，及旧植被/树/岩岸/原世界矩阵。一次只读审查指出提前消失的alpha阈值和名额迟滞边界，已修正；随后优化未递归审查，以更完整的GPU像素、矩阵和驾驶验证。

32m保守单元先筛选相关区域，仍逐株精确裁剪并保持原作者索引顺序；矩阵/颜色/坡度只上传实际可见前缀，清理隐藏批次旧更新范围。五个冻结横屏机位与同作者/同材质的优化前BrB控制包calls/tri相同；原RGB差>8变化像素0，更严格检查三个机位逐字节一致、另两处10/7像素最大差1/255。原始图/result保持，附pixel-precision.json及输入SHA。控制包已经有原野，**不是M23旧版画面对照**。

初版手动4倍CPU8秒Task3298/Script2902ms，仅距离前置3330/2909，无可测收益；加单元3092/2679，再加前缀上传 **2905/2516**，较初版-11.9%/-13.3%，相对M23仍+4.0%/+5.0%。手动后段车会撞岩停住，另以持续巡航8秒测新旧：M23 2669/2324→M24 **2877/2538**，约+7.8%/+9.2%，终点仍巡航、路径差约0.21m。完整中间记录保留，不推算一加12/iPhone FPS，没有新GPU耗时结论。

正式 **artifacts/evidence-field-grass.json**（pass-m24-field-grass）16视图0错误，连同25附属文件共41项证据检查。桌面各项峰139calls/616031tri/121geo/51tex，手机竖屏94/246426/118/44；不增加位图/纹理数。最终真实横屏双指驶离公路、四角环顾并返回 **49.58秒/88.13米/0错误**，field近草和总近草均最高47≤48，峰117/321350/120/50，仍超300k/40约7.1%/25%。

- [正常原野追随](/home/ryan/workspace/coastline/artifacts/pass-m24-field-grass/desktop-field-verge.png)
- [实际朝内陆环顾](/home/ryan/workspace/coastline/artifacts/offroad-field-grass-prefix-phone/android-touch-orbit-2.png)
- [横屏双指行驶录像](/home/ryan/workspace/coastline/artifacts/offroad-field-grass-prefix-phone/android-touch.webm)
- [同机位绘制与像素控制](/home/ryan/workspace/coastline/artifacts/field-culling-prefix-final-phone/result.json)
- [更严逐字节测量](/home/ryan/workspace/coastline/artifacts/field-culling-prefix-final-phone/pixel-precision.json)

普通dist与候选同DNiaziFM，无query入口实际开始前进8.30米，新field ready/材质贴图共享/坡度属性独立/一次缓存正常，测试钩子/诊断undefined、0错误。试玩[当前地址](http://10.158.204.114:5190/)。新美术真机表现仍待复核。

---

# M23 · 卷曲蕨叶、共享贴图与逐株剔除

2026-10-24，生产包 **index-BRkU5y8R.js**，已更新5190。尖三角蕨叶换成两种完整卷曲叶束，近784/816、远198/197面，借用原Fern02三张PBR贴图，新增几何64,178字节。保留原作者位置、颜色、随机序列及60%低档前缀，近景限8手机/16桌面；成功后隐藏旧叶片，失败时仍可驾驶。旧四批实拍大蕨叶复用已有逐株视锥剔除，保留所有原始变换与50%低档前缀。整体风景仍有大片裸露地面、山体切边及树干重复，**Goal active**。

最终三浏览器 **21项专项通过**：草/灌木切档、实际土壤与路肩的独立射线、新蕨叶贴图共享/近远互斥/前缀、旧植物全矩阵/剔除/前缀，以及两种资源失败时开始、恢复和巡航。旧植物矩阵基线来自实际M22稳定包全部GPU容量，非只取可见实例。一次新蕨叶材质/异步/LOD只读审查无具体缺陷；其后的旧植物剔除通过矩阵和受控像素另行验证，不声称全部最终代码已获独立审查。

手机58与桌面103个低档作者位置用独立Raycaster选最大抬升、最大坡度，保留实际terrain+4个graded网格做近株正/侧/顶部观察；冠心下沉7.5厘米。实际风动3.12/3.28秒，变化8762/22896像素，0错误。早期隔离图漏画路肩，已标inconclusive并保留；不将其作为贴地证据，也不宣称局部平面能精确贴合每片叶根。

正式 **artifacts/evidence-curved-ferns.json**（pass-m23-curved-ferns）12视图0错误，连同20个附属文件共32项证据检查通过。桌面各项最高138calls/611279tri/117geo/51tex，手机竖屏93/246408/114/44。相同active-play机位由M22桌面135/666521/105/47到137/611279/109/47，手机92/251959/102/43到93/246408/106/43；新叶片和旧植物剔除共同影响这些数值，不归因于单一优化。

另在两个冻结横屏机位，以相同当前几何/材质/完整原前缀恢复整批绘制作为控制：active-play 275822→270406tri、rock-back 223086→219238tri，各少5416/3848面，calls100/81不变，像素变化0。控制不是旧构建的完整重现，不据此推算真机帧率。

真实横屏双指绕岩、停车环顾并返回 **46.66秒/最远离路88.02米/0错误**，峰116calls/318527tri/116geo/50tex，仍超300k/40目标约6.2%/25%。4倍CPU8秒Task2794/Script2397ms，M22为2665/2282，约+4.8%/+5.0%；heap21.78MiB。如实保留额外成本，没有新GPU计时或一加12/iPhone帧率结论。

- [实际路肩](/home/ryan/workspace/coastline/artifacts/pass-m23-curved-ferns/desktop-grass-verge.png)
- [正常电影追随](/home/ryan/workspace/coastline/artifacts/pass-m23-curved-ferns/desktop-cinematic.png)
- [实际坡地叶束侧面](/home/ryan/workspace/coastline/artifacts/fern-contact-soil-visible-phone/steep-soil-side.png)
- [手机双指绕岩与返回](/home/ryan/workspace/coastline/artifacts/offroad-curved-ferns-phone/android-touch.webm)
- [逐株剔除受控比较](/home/ryan/workspace/coastline/artifacts/fern-culling-final-phone/result.json)

普通dist与候选同BRkU5y8R；5190无query入口真实开始前进8.30米，共享贴图、旧叶隐藏、逐株剔除、一次缓存正常，测试钩子/诊断undefined，0错误。试玩[当前地址](http://10.158.204.114:5190/)。下一步让干草斑块扩展到可驶达的内陆山坡，原野与路边近草共享总限额；新美术真机表现仍待复核。

---

# M22 · 干燥地表、连续路肩与真实根部

2026-10-24，生产包 **index-CKmKV6_p.js**，已更新5190。暖干草混色保留扫描土壤的亮度和颗粒，减少均匀绿色覆盖；地面、洞顶和6块斜/平路肩共用世界坐标材质，亮白路肩带消失。岩石颜色/法线/粗糙度三向投影对应，以真实坡面合成受光。整体风景仍在迭代，**尖三角蕨叶、离路山坡过空及山体切边过直**仍是下一步，Goal active。

独立实际网格射线发现此前37株可见近草中4株被路肩埋深超过20厘米、最深49.3厘米；原M20只覆盖底层terrain。现在直接采样4个斜路肩最高三角面，近/远草和灌木按实际高度、坡度和抬升贴地，保留原矩阵/颜色/随机顺序。新增三浏览器独立Raycaster验证中心只埋5厘米和局部梯度；全部4647桌面/2713手机摆放低根CPU重建，0株露空超过12厘米。桌面最高露空7.85厘米、埋入8.80厘米；手机全部低根埋地，最深13.86厘米。宽草丛跨坡折仍为局部平面近似，不宣称所有叶根完全贴合。

打包前CJCfsuAm三浏览器环境/材质/海水/太阳 **40项通过、2平台跳过**；最终打包版再跑受影响范围 **20项通过、1平台跳过**。岩体扫描提取兼容性1294高度样本/42厚度探针通过。唯一证据目录保存所有尝试；首次graded-desktop仅截图无完整result，不作为通过证据；固定历史岩体输出曾被误覆写，随后已改脚本唯一标签/wx并以新路径重新通过。

岩石原法线RGB与粗糙度灰度无损合成1024² RGB/A，逐字节验证解码误差0；地形、岩块及克隆的实体背壳共用，clone后显式恢复A粗糙度钩子。运行纹理由9→8张，估算含mip显存 **-5.33MiB**；PNG增加首次下载约1.69MB。三向法线/粗糙度只需3次采样，较初版少3次，较M21净多1次。源/输出SHA、脚本和通道定义随代码保存。

正式 **artifacts/evidence-dry-ground.json**（pass-m22-dry-ground）12视图无浏览器错误。桌面峰135calls/666521tri/113geo/51tex，手机竖屏92/251959/104/44。实际横屏双指绕岩、停车环顾和返回46.23秒，离路87.74m，0错误，峰115/319877/112/50，仍超300k/40约6.6%/25%；M21离路76.53m，不能当作相同轨迹提速。

横屏海岸实际水线四测线两个周期往返1.23–2.62m，8个地面探针湿润明显、4个高处干地不变；实际不暂停运行17.93秒，0错误。4倍CPU8秒Task2665/Script2282ms（M21为2732/2326），终点83/218542/103/44，小幅波动不作真机FPS结论。

新旧及未打包版本各2轮硬件GPU计时，每机位90样本。最终路肩P50 2.21–3.42ms、隧道2.39–3.02ms、近岸2.00–2.81ms；M21为1.79–3.21、2.83–3.71、1.40–1.92ms。重复波动较大、近岸仍有额外成本，不能宣称打包已降低GPU计时。完整范围/P95见文档09；环境为RTX4050手机视口，**新美术版一加12及iPhone实际帧率仍待复核**。

- [实际地面与路肩](/home/ryan/workspace/coastline/artifacts/pass-m22-dry-ground/desktop-grass-verge.png)
- [隧道出口](/home/ryan/workspace/coastline/artifacts/pass-m22-dry-ground/desktop-tunnel-exit.png)
- [近岸侧面](/home/ryan/workspace/coastline/artifacts/pass-m22-dry-ground/desktop-shore-side.png)
- [横屏双指绕岩](/home/ryan/workspace/coastline/artifacts/offroad-dry-ground-packed-phone/android-touch.webm)
- [海水/湿润动态](/home/ryan/workspace/coastline/artifacts/shore-wash-dry-ground-packed-phone/samples.json)

正常dist与候选同CKmKV6_p，5190普通入口实际开始、前进8.45米，6块路肩共享材质、岩块/背壳共享打包图、三分量根部、两类植物和一次缓存正常，无query钩子/诊断暴露、0错误。试玩[当前地址](http://10.158.204.114:5190/)。

---

# M21 · 灰绿枝叶与远距轮廓

2026-10-24，生产包 **index-Bz0T4lOs.js**，已更新5190。放射球maquis换成两个实拍灰绿植株：近1272/2255、中307/536tri，全部叶片和木枝保留；远于手机60±6m/桌面110±6m用10tri五面轮廓。原位置、颜色和共享随机序列保持，三级互斥、遵守低档前缀，近景8/16株。整体风景仍待验收，地表平绿重复、尖三角蕨叶与植被分布仍是短板，Goal active。

最终三浏览器 **18项通过**：共享草丛、灌木三级互斥/前缀/切档、模型和轮廓图失败回退、原摆放fixture。独立审查指出删叶远景破坏叶冠、坡度扩张没有同步整批包围球；已保留所有叶组件，变形实例改用保守逐实例剔除。成功后释放旧占位图/材质；失败时原景观可开始。未把程序化球缩小后覆盖减少当作整体美术达标。

正式 **artifacts/evidence-coastal-scrub-impostors.json**（pass-m21c-scrub-impostors）8视图+22附属文件，**30项证据检查通过**，0浏览器错误。桌面峰135calls/666515tri/113geo/52tex，手机竖屏92/251959/104/45。实际横屏双指绕岩、停车环顾和返回约46秒，离路76.53米，0错误，峰115/319877/112/51；仍超300k/40目标约6.6%/27.5%，不是预算全通过，也不代表真实手机帧率。

最初全部中远景使用真实网格时峰373169tri，未发布该候选；加入远距轮廓后峰值降低，但旧路线离路88米，轨迹不同，不能将全部差额解释为同一路线提速。同一冻结路肩把23个代理按原变换临时换回中景3D，82calls不变，207674 vs217024tri，直接测得节省9350面；已查看两图，差异很小。第一次rock-back相机朝空岩岸、copies0，保留为inconclusive，不作效益证明。

4倍CPU节流8秒Task2732/Script2326ms，M20为2547/2169，约+7.3%/+7.2%；远距优化前2751/2323，CPU没有明显下降。最终同终点83calls/218536tri/103geo/45tex，优化前233647tri。没有新增GPU计时或一加12/iPhone帧率测量。

来源Poly Haven Shrub 04，Rico Cilliers、CC0。逐叶/木枝简化保留真实轮廓；轮廓图由实际模型4侧面+顶部离线生成，只存albedo，运行时接收夕阳与缓存阴影、法线近似向上。新增512²约1.33MiB GPU，1k摄影图替代256占位图后，本步净约6.33MiB/1纹理。源四文件MD5/SHA、输出SHA和烘焙输入/输出SHA均核验，转换/烘焙脚本随代码保存。

- [实际路肩](/home/ryan/workspace/coastline/artifacts/pass-m21c-scrub-impostors/desktop-grass-verge.png)
- [近景枝叶素材侧视](/home/ryan/workspace/coastline/artifacts/coastal-scrub-asset-full-leaves/2-side.png)
- [相同机位的远距轮廓](/home/ryan/workspace/coastline/artifacts/scrub-lod-compare-verge/proxy.png)
- [控制对照：临时全3D](/home/ryan/workspace/coastline/artifacts/scrub-lod-compare-verge/all-3d.png)
- [手机双指绕岩录像](/home/ryan/workspace/coastline/artifacts/offroad-coastal-scrub-impostor-phone/android-touch.webm)

正常dist与候选主包一致；5190无query入口实际点击开始，三种LOD、1024/512图、旧图释放、一次太阳缓存正常，钩子与诊断undefined，0错误。试玩[http://10.158.204.114:5190/](http://10.158.204.114:5190/)，新艺术版本主观与真机反馈仍待复核。

---

# M20 · 弯叶低草与坡地贴合

2026-10-24，生产包 **index-X9KjVLTb.js**，更新5190。三种实拍弯叶/穗梗/枯叶组合替换可见近草，328/321/341三角形，共享一张1k RGBA；保留原位置和颜色，远草使用缩小的三交叉卡片。近草限48手机/96桌面，先过滤视锥再选距离，进出迟滞20/24与30/35米。整体风景仍未达到验收，旧放射灌木、三角蕨叶与平坦重复地面是接下来的主要问题，Goal active。

加载/切档/近远互斥/原始矩阵/槽位坡度和资源失败回退的最终三浏览器专项 **6项通过**；同阶段另一次摆放fixture三平台通过，后续只添加根部坡度修正。初版测试的矩阵浮点舍入误差、离路12米直接开启巡航的错误测试假设已修正，失败记录coastal-grass-regression保留。原共享随机序列没有新调用。

坡度属性随GPU实例压缩同步，根部贴地而穗梗保持竖直。CPU按实际绘制三角地形重建全部4647/2713个摆放，原最大露空20.2/15.1厘米，修正后低根顶点均埋入地表。地形平面近似不是任意岩面的贴合；独立坡地照片仅复制一个真实实例到原位置观察，隐藏其他草，使用实际材质、地面和光照。最初相机进入坡地的图保留，最终above-ground-*修正相机地面净空，不能把素材预览当普通驾驶截图。

正式清单 **artifacts/evidence-coastal-grass.json**（pass-m20-coastal-grass），8个桌面/手机机位，另含横屏双指驾驶、CPU对照、素材与坡地观察。无浏览器错误；桌面最大130调用/654187tri/107geo/51tex，手机竖屏91/251947/98/44。新增近草贴图约5.33MiB GPU；手机纹理仍超40初始目标，不能称预算全通过。

横屏双指驶入内陆约65.0米并返回，约22秒、0错误，峰109调用/281578tri/106geo/49tex，近草可见0–13丛。已看行驶中及返回截图，未见大块突变；这是普通内陆路线，不能代替此前绕岩319619tri的高峰路线。4倍CPU节流8秒Task2547/Script2169ms，上一版2460/2072ms，约+3.5%/+4.7%；终点82调用/218456tri/97geo/44tex，原79/215900/94/43。只作桌面模拟的成本比较，不推算一加12或iPhone帧率，没有新增GPU计时。

- [实际路肩](/home/ryan/workspace/coastline/artifacts/pass-m20-coastal-grass/desktop-grass-verge.png)
- [实际沿海驾驶](/home/ryan/workspace/coastline/artifacts/pass-m20-coastal-grass/desktop-active-play.png)
- [手机双指离路录像](/home/ryan/workspace/coastline/artifacts/offroad-coastal-grass-phone/android-touch.webm)
- [独立坡地观察](/home/ryan/workspace/coastline/artifacts/coastal-grass-ground-above-ground-desktop/isolated-slope-front.png)

来源为Poly Haven Grass Bermuda 01，Rico Cilliers、CC0。输出gltf/bin/RGBA总348943字节，另加来源记录4318字节；源四文件官方MD5、源/输出SHA256和转换脚本保留。新版本真机与主观风景反馈尚未收到，当前网络试玩地址[http://10.158.204.114:5190/](http://10.158.204.114:5190/)。

5190普通入口已实际点击开始，无测试查询和钩子/诊断暴露，三种近草、一次夕阳缓存、组合贴地风动shader正常，0错误，实际RTX4050硬件渲染；coastal-grass-release-smoke留存。独立候选与普通dist主包一致。

---

# M19 · 透光针叶松冠与实际驾驶

2026-10-24，生产包 **index-CvemNPy4.js**（789.52kB/gzip217.88kB），已更新5190。7组上升木枝、39针叶簇取代多面体圆团，近580/远184tri，一张本地512²图集共用，10级mip约1.33MiB。倾斜/近水平枝簇补顶部体积，叶片使用一致的冠体法线；完整松冠只参与一次固定投影，行驶仍用近远LOD。树干、草卡与地表重复仍是短板，整体Goal active。

三浏览器环境/材质/太阳专项首轮13有效通过、2平台跳过，3例因新树冠改变缓存范围约2.6cm而停在旧尺寸断言。现直接对照原始摆放矩阵，补充旧已提交生产包松干/松冠fixture，3例复测全过；没有调整矩阵断言精度。首次失败trace保留pine-first-framing-regression。累计16项有效专项通过，不将旧版全套41项声称为本轮重跑。

正式 **artifacts/evidence-pine-canopy.json**（pass-m19-pine-canopy），10个桌面/手机机位无脚本错误。桌面最大127调用/645439tri/104geo/50tex，手机91/251953/101/43；相同机位比M18调用不变、纹理+1。50纹理峰值来自额外电影机位，手机42–43仍超40起始目标。

- [原团块松冠](/home/ryan/workspace/coastline/artifacts/pine-canopy-isolated-before/near-front.png)
- [新松冠侧面](/home/ryan/workspace/coastline/artifacts/pine-canopy-final-desktop/near-side.png)
- [新松冠上方](/home/ryan/workspace/coastline/artifacts/pine-canopy-final-desktop/near-above.png)
- [实际手机巡航与切镜](/home/ryan/workspace/coastline/artifacts/sun-motion-pine-canopy-phone/drive.webm)
- [实际触控离路绕岩再返回](/home/ryan/workspace/coastline/artifacts/offroad-pine-canopy-restored-phone/android-touch.webm)

针叶专用掩码排除木枝后，手机20m约43.3%包围卡像素透空，130/300/700m保留38.6/17.3/3.27加权针叶像素；小于像素的细节无法与近景等同。mip0–7的.5覆盖率约25%，mip8每图块仅1像素，量化限制明确保留。第一次未真正隐藏原世界的模型图无效，最终使用Boolean visibility的隔离图；实际世界图与模型预览用途分别记录。

指定松树20完整近冠包围盒在视锥外，缓存仍使手机36.9%/桌面42.1%实际车身像素改变；连续200帧均0阴影重绘，高低切档缓存与纹理数稳定。实际手机巡航18.563秒/210m、桌面18.95秒/215m，按钮切镜无错误；手机峰值92调用/245732tri/101geo/43tex，桌面125/512430/104/46。已查看多个时刻，叶冠保持体积，夕阳/座舱可读。

4倍CPU同路线8秒Task2460/Script2072ms，前次2592/2172ms；终点79调用/215900tri不变，纹理42→43，heap18.23→20.83MiB。不把样本波动解释为手机FPS改善。恢复已停止的本地预览进程后，真实双指离路约46.5秒、最大77.3m、停车环顾并返回，0错误；峰值114调用/319619tri/103geo/49tex，仍超300k/40目标约6.5%/22.5%，不是预算全通过。此前类似过程尚未加入固定投影/远岛批次，轨迹亦不同。

本次主机网络变更，当前局域网地址为[试玩](http://10.158.204.114:5190/)，需设备能访问该主机网络。旧192.168.3.10地址不再适用。尚未收到本轮一加12/iPhone真实GPU表现复核；历史证据保留如下，整体自然风景不作完成声明。

独立预览与正常dist主包相同；5190无test参数实际开始、车辆/一次缓存/10级针叶纹理和组合shader key均正常，钩子及诊断未暴露，0错误。恢复后的实际GPU仍为RTX4050硬件后端。最终证据清单10机位+25附属文件共35项检查通过，普通入口记录pine-canopy-release-smoke。

---

# M18 · 离岸岩脊轮廓

2026-10-23，生产包 **index-BevlEjQa.js**，已更新5190。远海20座同形圆丘换为三个现有CC0摄影礁岩高度裁片，保留闭合海下基座；总9840三角形，原10560，无新纹理，最多增加2次绘制。岩脊是远景高度壳，不能表达悬挑；此次没有改动松树，整体自然风景尚未验收，Goal active。

独立生产三浏览器环境/材质专项 **11通过、1平台跳过**。新增正体积/闭合绕序/海下基座/预算检查；旧版b5e8392生产包捕获的fixture对照全部20岛体矩阵、近景草石样本和太阳包围盒。最初显式角度跳过随机消费导致近景重排，已恢复原调用；对应失败图保留，不用作最终对照。

正式 **artifacts/evidence-offshore-rocks.json**（pass-m18-offshore-relief），8机位+14文件共22检查通过，无脚本错误。桌面最大127调用/644467tri/103geo/45tex，手机91/251593/101/42；纹理仍超40目标。正常按钮巡航/切镜18.527秒/210m，无错误；4倍CPU同路线8秒Task2592/Script2172ms（前阶段2664/2237ms），终点79调用/215900tri/42tex，不推算一加12或iPhone实际帧率。

- [原圆丘](/home/ryan/workspace/coastline/artifacts/offshore-final-comparison/before-tree-shadow.png)
- [新岩脊，同位置](/home/ryan/workspace/coastline/artifacts/offshore-final-comparison/after-tree-shadow.png)
- [侧向海岸](/home/ryan/workspace/coastline/artifacts/offshore-final-comparison/after-shore-side.png)
- [正常行驶录像](/home/ryan/workspace/coastline/artifacts/sun-motion-offshore-phone/drive.webm)

源模型与二进制双SHA-256及许可作者保存在[offshore-heights.json](/home/ryan/workspace/coastline/src/world/offshore-heights.json)，5,452字节随包导入；scripts/prepare-offshore-rocks.mjs可离线重建。本步是远景形体迭代；下一步处理团块状松树冠和地表层次，不声称已经接近照片效果。历史光照/海水/自由驾驶证据保留如下。

正常dist构建与独立预览主包相同；5190无测试查询入口实际点击开始通过，无测试钩子/诊断暴露，三个岩岛批次、车辆、一次太阳缓存正常，0错误。烟测保存offshore-release-smoke。

---

# M17 · 固定夕阳、世界遮挡与手机保护

2026-10-23，生产包 **index-C3WyIKRn.js**，已更新[局域网试玩](http://192.168.3.10:5190/)。本步改善自然光照层次，整体风景仍未达到用户最终验收，Goal保持active。海水、岩岸实体和自由驾驶证据保留在下文。

主光提高到2.5、半球填光降到0.9；固定地形、树木、扫描岩体和建筑生成一次太阳深度图。手机流畅档为1024²，桌面2048²，行驶时不再绘制固定世界阴影；中高档将实时车影乘到同一束太阳，不引入第二束漏光的直射光。车辆可接收镜头后方的树影，实际可见实例仍按相机筛选。主场景与局部车影均计入渲染诊断。

正式清单 **artifacts/evidence-static-sun.json**，run **pass-m17c-static-sun**：20个桌面/手机机位、11个附属证据，共31条检查通过，无脚本/控制台错误。包含三车内饰、树影/建筑影/岩背、洞内/出洞和沙岸。桌面最大125调用/644647tri/101geo/46tex；手机竖屏89/251701/99/42，其中41–42纹理超过40张初始预算。新增手机深度缓存约8MiB/2纹理，属于有记录的成本，不是预算全通过。

- [桌面树影](/home/ryan/workspace/coastline/artifacts/pass-m17c-static-sun/desktop-tree-shadow.png)
- [隧道与出口](/home/ryan/workspace/coastline/artifacts/pass-m17c-static-sun/desktop-tunnel.png)
- [手机正常行驶](/home/ryan/workspace/coastline/artifacts/sun-motion-production-phone/drive.webm)
- [桌面正常行驶](/home/ryan/workspace/coastline/artifacts/sun-motion-production-desktop/drive.webm)
- [手机缓存/切档/实际车身接收](/home/ryan/workspace/coastline/artifacts/static-sun-low-pruned-phone/summary.json)
- [桌面缓存/切档/实际车身接收](/home/ryan/workspace/coastline/artifacts/static-sun-low-pruned-desktop/summary.json)
- [真实GPU计时](/home/ryan/workspace/coastline/artifacts/static-sun-gpu-production-pruned/samples.json)
- [最终CPU对照](/home/ryan/workspace/coastline/artifacts/mobile-performance/static-sun-release-manual.json)

低档连续200帧两设备均0次阴影重绘，深度纹理ID、矩阵和烘焙次数不变。实际车身隔离渲染仍使用真实相机、ACES和sRGB；树影使手机约46%/桌面45%的车身像素明显改变，建筑约11%/9%，岩背约57%/32%。确定的松树20整个包围盒位于相机视锥外，其影子仍落在车上；独立射线检查记录在树影候选文件。早期未真正隐藏世界的car-only结果无效，保留而不引用。高/低反复切换纹理不持续增加；低档程序实际没有局部阴影sampler，高档恢复，缓存不重建。

手机正常巡航18.53秒/210m，桌面18.98秒/214m，实际按钮启巡航和切换车内/追随，均无错误。已检查多个时刻，车辆经过世界遮挡、车内材质可读，没有车影遗留在缓存中的拖尾。该路线手机峰值90调用/244784tri/99geo/42tex，桌面123/511870/102/45；不是绕岩完整公路外行程，也不能覆盖下文317k三角形的已知峰值。

GPU计时为RTX4050、844×390/DPR1，每组120次、三机位关/开各两轮：启用时中位数约0.97–1.24ms，关闭约0.91–1.48ms，区间重叠且有调度波动，没有GPU disjoint；不能换算手机性能。CPU为同一路线8秒/4倍节流：旧版重复样本Task2387/Script1975ms，新版最终2664/2237ms，约+11.6%/+13.3%；其他重复新样本2738/2303ms。没有声称零成本或一加12帧率提升。

手机自动档在流畅档持续低于40fps约5秒后减少世界投影，保留光色、接触影、海水和景物，手动重选画质可恢复缓存。WebKit极低帧率测试首次暴露物理限幅dt让降档延后；已把FPS平滑/降级计时改用真实帧间隔，物理步长限制保持。20秒断言未放宽，两手机浏览器重跑通过，失败trace保留在static-sun-adaptive-first-webkit。此模拟只验证状态转换，一加12/iPhone新版本真实开销仍未测。

独立只读审查还发现首帧方向初始化竞争和分能量双光源漏光，均已处理。代理只借用几何/材质，临时实例缓冲在烘焙后释放；局部阴影从移动车辆生成，不重复投整个世界。流畅档编译裁掉局部代码，全局autoUpdate关闭，只有缓存生成和局部车影显式更新。固定世界投影不逐叶跟随风动；细节精度受整岛1024/2048投影分辨率限制，后续自然树冠与远景形体仍需改进。

最终生产build通过，三浏览器完整回归 **41项有效通过、4项按平台跳过**。5190普通入口另实测真实开始按钮与正常画面，无测试钩子/诊断暴露、无脚本错误、世界缓存就绪，实际主包哈希一致。此前中途失败与开发候选证据保留，不混入最终通过统计。

---

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

## M31A · 细叶素材检查，游戏运行引用待接入

最终完整d/e近2344/1058、远1541/736面；独立二进制核对各427/179组件、0退化面、原木枝542/264边界位置0缺失，UV/原顶点对应与逆缩放法线误差约4.19e-8，RGB16源遮罩转8位后误差0。三个导出文件重建SHA一致，实际代理与烘焙代码SHA核对通过。

- [独立来源、几何、边界与Alpha核对](/home/ryan/workspace/coastline/artifacts/coastal-rooibos-validation-protected-endpoints/result.json)
- [Chrome两株两级三角度与GPU逐级读回](/home/ryan/workspace/coastline/artifacts/coastal-rooibos-asset-protected-endpoints-chrome/result.json)
- [WebKit同组检查](/home/ryan/workspace/coastline/artifacts/coastal-rooibos-asset-protected-endpoints-webkit/result.json)
- [最终近景侧面](/home/ryan/workspace/coastline/artifacts/coastal-rooibos-asset-protected-endpoints-chrome/0-near-side.png)
- [最终远档侧面](/home/ryan/workspace/coastline/artifacts/coastal-rooibos-asset-protected-endpoints-chrome/0-far-side.png)
- [小株顶部](/home/ryan/workspace/coastline/artifacts/coastal-rooibos-asset-protected-endpoints-chrome/1-near-above.png)
- [实际代理10格与输入/输出SHA](/home/ryan/workspace/coastline/artifacts/scrub-impostor-bake-rooibos-protected-endpoints/result.json)

Chrome/WebKit共24个素材视图、0浏览器错误；真实前置普通纹理使flipY/premultiply=true，再上传全Canvas叶图恢复false。0/2/4/8/10级FBO读回Alpha最大误差0、RGB≤1；独立首级线性参考7806个保留叶/枝像素最大差2。该证据是素材/解码/受光观察，不是手机实测帧率或游戏世界通过。当前5190仍M29，Goal active。
