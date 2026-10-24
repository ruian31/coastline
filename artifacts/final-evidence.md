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
