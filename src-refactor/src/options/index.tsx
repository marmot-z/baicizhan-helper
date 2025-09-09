import { createRoot } from 'react-dom/client'
import './index.css'

function Options() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">百词斩助手设置</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">React版本开发中...</p>
        </div>
      </div>
    </div>
  )
}

const container = document.getElementById('options-root')
if (container) {
  const root = createRoot(container)
  root.render(<Options />)
}