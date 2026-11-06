# 现场视觉参考

`blue_white_light.glsl` 是本项目原创的 TouchDesigner GLSL TOP 光场代码，使用 `uState` 输入时间、事件包络、事件编号与画幅比例。

现场版本已在 TouchDesigner 2025.32460 运行，960×540，读取同一份摩斯事件时间表，声音由 TD 执行。网页分享版使用浏览器 WebAudio 与 WebGL，不连接访问者或作者电脑上的 TD。

本仓库不分发含本机路径与运行状态的 `.toe` 文件，也不将单份着色器称为完整 TD 工程。浏览器粒子和 TD GLSL 为不同渲染实现，保持同一蓝白光场方向，不声称逐像素相同。
