# Project 03 — AFTER EXPRESSION / LIVING TRACES

工业设计交互装置项目的第一阶段软件演示。两个名称暂时并列保留。

**给老师的入口：** [打开蓝白光场](https://liujunjie1114-ben.github.io/project03-living-traces-demo/)

- [交互演示：输入、确认、声音、画面和事件回看](https://liujunjie1114-ben.github.io/project03-living-traces-demo/studio.html)
- [项目说明与实际软件录制](https://liujunjie1114-ben.github.io/project03-living-traces-demo/about.html)

## 可以体验什么

默认首页是黑底蓝白粒子光场，以 `HELLO` 静音循环预览。进入交互演示后，确认编码文本并点击开始，可以听见 600 Hz 摩斯节奏，同时观看由同一份事件表驱动的 WebGL 光场。

点、划、同字母内间隔、字母间隔和词间隔分别为 1、3、1、3、7 单位。`HELLO` 在 120 ms 单位下共有 31 段，总长 **5,880 ms**，请求发声合计 **3,120 ms**。

编码文本仅支持 A–Z、0–9 和半角空格；原句单独保留。中文、标点或换行不会被静默丢弃。每次确认建立独立 event_id，记录时间表、状态、声音和视觉版本，可导出 JSON。

## 当前阶段

- 已实现文本确认、摩斯编码、WebAudio、原创 WebGL 粒子、停止、浏览器本地档案及导出。
- 视觉明确为 **rhythm-driven**，不是植物测量结果，也没有声称完成音频分析。
- 植物观测、实体灯光、真实植物照明和语音识别未连接。
- 本仓库为独立在线分享版。现场 Python / TouchDesigner 控制环境没有通过该网页远程开放。
- 输入和事件最多保留最近 30 次，只在访问者自己的浏览器中保存；没有上传 API、注册或云端事件库。需要备份时导出 JSON。

## 本地运行

无需 npm 安装；Python 仅用于本机静态预览：

```bash
python -m http.server 8790 --directory docs --bind 127.0.0.1
```

打开 `http://127.0.0.1:8790/`。不要直接双击 HTML，模块需要 HTTP / HTTPS。浏览器需要 WebGL；声音由访问者点击后启动，音量由浏览器与设备控制。

## 文件

| 目录 / 文件 | 用途 |
|---|---|
| docs/index.html | 黑底蓝白光场审美预览，静音 |
| docs/studio.html、share-app.js | 可操作的浏览器交互演示 |
| docs/core.js、player.js | 摩斯事件表、状态与声音 |
| docs/visual.js、particle-shaders.js | 原创 GPU 粒子、景深光斑和辉光 |
| docs/about.html | 项目说明与当前边界 |
| docs/media/ | 实时 Canvas 实际录制 |
| examples/ | 工程示例时间表与明确标注未执行的样例档案 |
| touchdesigner/ | 原创现场 GLSL 着色器及状态说明 |
| tests/ | 在线演示的本地检查 |

所有参与者真实本机档案、研究原始资料、临时文件、凭证和带本机路径的 `.toe` 均未包含。装置图为概念表达，未作为硬件验证证据。

## 发布

GitHub Pages 从 `main` 分支的 `/docs` 文件夹发布。代码及媒体均为静态文件；线上版本不依赖 Python 服务或 TD 本机端口。
