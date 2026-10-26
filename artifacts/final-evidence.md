# M43 · 完整叶形与立体干燥灌丛

2026-10-26，**index-C_hraUJb.js**，854.79kB/gzip238.96kB，已更新[5190试玩](http://10.158.204.114:5190/)。Searsia f/g完整近景7232/6302面，保留全部源叶、细枝、木质表面；远景2129/1735面使用16个原三角域隔离照片及完整木质部分。手机/桌面共享近上限2/4、较早切入五方向对象法线代理，原作者位置、密度、车辆草压不变。失败先回退旧Rooibos，再回退程序灌丛。五运行文件2104204B，较M42增加578921B；同1k+两个512尺寸、纹理槽不增。

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
