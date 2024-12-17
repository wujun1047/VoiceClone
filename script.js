// 音频文件转base64函数
function convertAudioToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// 默认API配置
const DEFAULT_CONFIG = {
  WHISPER_ID: "14c6b2b039b7",
  WHISPER_KEY: "60b2ad10f9a24edaad5c5a2a3c3e41da",
  COSYVOICE_ID: "10a2728980e0",
  COSYVOICE_KEY: "0c2f7179d22247fbb20e4f423f504b72",
};

// 格式化时间为字符串
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// 计算耗时
function calculateDuration(startTime) {
  const duration = (Date.now() - startTime) / 1000; // 转换为秒
  return duration.toFixed(1);
}

// 初始化所有事件监听
function initializeEventListeners() {
  // 监听音频文件上传
  document
    .getElementById("sampleAudio")
    .addEventListener("change", handleAudioUpload);
  // 监听表单提交
  document
    .getElementById("voiceCloneForm")
    .addEventListener("submit", handleFormSubmit);

  // 设置默认值
  document.getElementById("whisperId").value = DEFAULT_CONFIG.WHISPER_ID;
  document.getElementById("whisperKey").value = DEFAULT_CONFIG.WHISPER_KEY;
  document.getElementById("cosyvoiceId").value = DEFAULT_CONFIG.COSYVOICE_ID;
  document.getElementById("cosyvoiceKey").value = DEFAULT_CONFIG.COSYVOICE_KEY;
}

// 存储当前上传的音频base64编码
let currentAudioBase64 = null;

// 处理音频文件上传
async function handleAudioUpload(e) {
  const file = e.target.files[0];
  if (file) {
    try {
      console.log("开始转换音频文件...");
      console.log("文件信息:", {
        名称: file.name,
        类型: file.type,
        大小: (file.size / 1024).toFixed(2) + " KB",
      });

      const base64 = await convertAudioToBase64(file);
      // 存储base64编码，移除开头的data:audio/xxx;base64,
      currentAudioBase64 = base64.split(",")[1];
      console.log("音频文件已转换为base64格式");

      // 自动开始转写
      await handleTranscribe();
    } catch (error) {
      console.error("处理音频文件失败:", error);
      alert("处理音频文件失败: " + error.message);
    }
  }
}

// 调用CosyVoice API进行语音合成
async function callCosyVoiceAPI(originAudioText, audioBase64, outputText) {
  // 获取当前配置
  const cosyvoiceId =
    document.getElementById("cosyvoiceId").value || DEFAULT_CONFIG.COSYVOICE_ID;
  const cosyvoiceKey =
    document.getElementById("cosyvoiceKey").value ||
    DEFAULT_CONFIG.COSYVOICE_KEY;

  try {
    const response = await fetch(
      `https://api-serverless.datastone.cn/v1/${cosyvoiceId}/sync`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cosyvoiceKey}`,
        },
        body: JSON.stringify({
          input: {
            prompt: JSON.stringify({
              output_text: outputText,
              origin_audio_text: originAudioText,
              audio_base64: audioBase64,
            }),
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("CosyVoice API调用错误:", error);
    throw error;
  }
}

// 下载音频文件
function downloadAudio(audioBase64) {
  // 创建Blob对象
  const byteCharacters = atob(audioBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "audio/wav" });

  // 创建下载链接
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  // 使用格式化的时间作为文件名
  const timestamp = formatDateTime(new Date());
  link.download = `${timestamp}.wav`;

  // 触发下载
  document.body.appendChild(link);
  link.click();

  // 清理
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// 显示loading提示
function showLoading(text = "处理中...") {
  const startTime = Date.now();
  const overlay = document.getElementById("loadingOverlay");
  const loadingText = document.getElementById("loadingText");
  loadingText.textContent = text;
  overlay.style.display = "flex";

  // 启动定时器更新耗时
  const timer = setInterval(() => {
    const duration = calculateDuration(startTime);
    loadingText.textContent = `${text}（${duration}秒）`;
  }, 100);

  return { startTime, timer };
}

// 隐藏loading提示
function hideLoading(timer) {
  const overlay = document.getElementById("loadingOverlay");
  overlay.style.display = "none";
  if (timer) {
    clearInterval(timer);
  }
}

// 处理表单提交
async function handleFormSubmit(e) {
  e.preventDefault();

  if (!currentAudioBase64) {
    alert("请先上传音频文件并完成转写");
    return;
  }

  const sampleText = document.getElementById("sampleText").value;
  if (!sampleText) {
    alert("请先完成音频转写");
    return;
  }

  const targetText = document.getElementById("targetText").value;
  if (!targetText) {
    alert("请输入要克隆的文案");
    return;
  }

  const { startTime, timer } = showLoading("正在生成克隆语音");
  try {
    console.log("开始调用CosyVoice API...");
    const response = await callCosyVoiceAPI(
      sampleText,
      currentAudioBase64,
      targetText
    );

    // 将返回的字符串解析为JSON对象
    const result = JSON.parse(response);
    console.log("CosyVoice API返回结果:", result);

    // 检查返回结果中是否包含音频数据
    if (result && result.data && result.data.audio_base64) {
      console.log("开始下载生成的音频文件...");
      downloadAudio(result.data.audio_base64);
    } else {
      throw new Error("API返回结果中没有找到音频数据");
    }
  } catch (error) {
    console.error("语音克隆失败:", error);
    alert("语音克隆失败: " + error.message);
  } finally {
    hideLoading(timer);
  }
}

// 调用Whisper API进行音频转写
async function callWhisperAPI(audioBase64) {
  // 获取当前配置
  const whisperId =
    document.getElementById("whisperId").value || DEFAULT_CONFIG.WHISPER_ID;
  const whisperKey =
    document.getElementById("whisperKey").value || DEFAULT_CONFIG.WHISPER_KEY;

  try {
    const response = await fetch(
      `https://api-serverless.datastone.cn/v1/${whisperId}/sync`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${whisperKey}`,
        },
        body: JSON.stringify({
          input: {
            audio_base64: audioBase64,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Whisper API调用错误:", error);
    throw error;
  }
}

// 处理转写按钮点击
async function handleTranscribe() {
  if (!currentAudioBase64) {
    alert("请先上传音频文件");
    return;
  }

  const { startTime, timer } = showLoading("正在转写音频");
  try {
    console.log("开始转写文字...");
    const result = await callWhisperAPI(currentAudioBase64);
    console.log("转写结果:", result);

    // 将transcription字段的内容显示在样本音频文案文本框中
    if (result && result.transcription) {
      document.getElementById("sampleText").value = result.transcription;
    } else {
      throw new Error("API返回结果中没有找到transcription字段");
    }
  } catch (error) {
    console.error("转写失败:", error);
    alert("转写失败: " + error.message);
  } finally {
    hideLoading(timer);
  }
}

// 当DOM加载完成后初始化事件监听
document.addEventListener("DOMContentLoaded", initializeEventListeners);
