# 音色克隆工具

一个简单的 Web 应用，用于音色克隆。使用 Whisper API 进行语音转文字，使用 CosyVoice API 进行音色克隆。

## 功能特点

- 音频文件上传并自动转写文字
- 支持自定义 API 配置
- 实时显示 API 调用耗时
- 自动下载生成的音频文件
- 简洁直观的用户界面

## 使用方法

1. 上传样本音频文件（支持常见的音频格式）
2. 等待自动转写完成
3. 输入需要生成的文案
4. 点击"生成音频"按钮
5. 等待生成完成后自动下载音频文件

## 技术栈

- HTML5
- CSS3
- JavaScript (原生)
- Whisper API
- CosyVoice API

## 部署

本项目已部署在 Vercel 上，访问地址：[音色克隆工具](https://voice-clone.vercel.app)

## 本地开发

1. 克隆项目

```bash
git clone https://github.com/wujun1047/VoiceClone.git
```

2. 进入项目目录

```bash
cd voice-clone
```

3. 使用任意 HTTP 服务器运行，例如：

```bash
python -m http.server 8000
# 或者使用 VS Code 的 Live Server 插件
```

4. 在浏览器中访问 `http://localhost:8000`

## API 配置

默认提供了测试用的 API 配置，你也可以使用自己的 API 密钥：

- Whisper API：用于语音转文字
- CosyVoice API：用于音色克隆

## License

MIT
