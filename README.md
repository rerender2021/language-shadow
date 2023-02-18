<p align="center">
    <img width="400" src="./docs/images/logo-language-shadow.svg">
</p>

<div align="center">

[![build](https://github.com/rerender2021/ocr-2/actions/workflows/build.yml/badge.svg?branch=main&event=push)](https://github.com/rerender2021/ocr-2/actions/workflows/build.yml) [![pack](https://github.com/rerender2021/ocr-2/actions/workflows/pack.yml/badge.svg?branch=main&event=push)](https://github.com/rerender2021/ocr-2/actions/workflows/pack.yml)

 </div>
 
# 简介

文影 (Language Shadow) 是一个简单的翻译器，原理是：使用 OCR 识别指定区域，获得文字用于翻译。目前支持离线英文翻译成中文。

![language-shadow-usage](./docs/images/language-shadow-usage.png)

# 安装

-   下载文影可执行文件:

# 开发

```bash
> npm install
> npm run dev
```

开发过程中需要确保本机启动了 OCR 服务器和翻译服务器。

-   OCR 服务器：https://github.com/rerender2021/PaddleocrAPI/releases/tag/1.0.1
-   翻译服务器：https://github.com/rerender2021/NLP-API/releases/tag/1.0.1

下载它们，并解压到项目下，确保项目目录结构如下：

```
- nlp-server
    - NLP-API.exe
    - ...
- ocr-server
    - PaddleocrAPI.exe
    - ...
- src
- ...
- package.json
```

# 打包

-   生成 exe

```bash
> npm run release
```

-   将 `ocr-server` 和 `nlp-server` 复制到 `bin` 目录中，和 exe 一起压缩打包。

# 开源协议

[MIT](./LICENSE)
