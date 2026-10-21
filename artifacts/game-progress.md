# 当前进展 · 2026-10-21

项目路径：/home/ryan/workspace/coastline
持续 goal 已按用户明确授权建立并保持 active；每步验证后中文 Conventional Commit，不推送。

## 完成
- 文档基线提交 6d3d3ba；依赖锁修复，安装、构建、类型检查通过，npm audit 0。
- M1：程序化三款不同敞篷车与细致内饰，沿海路/地形/风动植被/海面，手动驾驶和自动巡航，车内/第三人称/电影镜头，电脑键鼠/手机触控，地图、暂停/设置/选车，WebAudio原创合成音乐及发动机/风/海浪。
- Playwright 桌面与手机 4 项行为/布局测试通过；实际键盘/鼠标油门、巡航接管、选车、三镜头、暂停恢复与横竖屏。
- GPU验证：启用ANGLE GL的Chrome使用NVIDIA RTX4050，900x600初始场景约60FPS；未加参数的headless落到软件渲染，不能当作性能证据。

## 正在进行
- M1环境画面第二轮：修复原天空灰、植被低模稀疏与海面规则白线；降低主光与曝光。
- M1完成后提交；随后M2集成 Landmarks.ts（已由环境子任务写好但尚未接入，不能视作完成）。

## 待验证/差距
- M2小镇/隧道/灯塔、建筑碰撞、全线巡航与支路往返。
- 完整实际截图与运动证据，电影镜头遮挡及手机真实设备GPU/Safari。
- 画面质量还需反复评分、调整，不能把M1构建通过当作最终完成。

## 预览
Vite dev server：http://localhost:5188/；局域网：http://192.168.3.10:5188/。当前私有Site仅预登记，未发布；commit技能禁止push，本轮保持本地预览。

## 并行任务
vehicle_art 完成src/vehicles/Convertible.ts；coastal_world正在完成Scenery提升，已完成Landmarks.ts待主代理集成。资源生成服务凭据缺失；没有外部生成任务，当前资源全部程序化。
