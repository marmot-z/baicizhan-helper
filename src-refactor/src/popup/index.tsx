import { createRoot } from 'react-dom/client'
import './index.css'

function Popup() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">百词斩助手</h1>
      <p className="text-gray-600">React版本开发中...</p>
    </div>
  )
}

const container = document.getElementById('popup-root')
if (container) {
  const root = createRoot(container)
  root.render(<Popup />)
}