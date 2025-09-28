import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './views/App.tsx'

// 确保React在content script环境中正确初始化
if (typeof window !== 'undefined') {
  (window as any).React = React
}

console.log('[CRXJS] Hello world from content script!')

const container = document.createElement('div')
container.id = 'crxjs-app'
document.body.appendChild(container)
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
