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

源gltf/bin双SHA-256及许可作者保存在src/world/offshore-heights.json，5,452字节随包导入；scripts/prepare-offshore-rocks.mjs可离线重建。本步是远景形体迭代；下一步处理团块状松树冠和地表层次，不声称已经接近照片效果。历史光照/海水/自由驾驶证据保留如下。

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
