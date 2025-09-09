// Background Script
// 扩展的后台服务工作者

// 监听扩展安装
chrome.runtime.onInstalled.addListener(() => {
  console.log('百词斩助手已安装')
})

// 监听消息
chrome.runtime.onMessage.addListener((message: any) => {
  console.log('收到消息:', message)
  // 这里将来会处理各种消息
  return true
})

export {}