import Logo from '../../assets/icon.png'
import { useState, useEffect } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { TopicResourceV2 } from '../../api/types'
import PopoverContent from '../../components/PopoverContent'
import ErrorPopover from '../../components/ErrorPopover'
import { UnauthorizedError, ForbiddenError } from '../../api/errors'
import AnkiExport from '../../components/AnkiExport'
import { WordData } from '../../components/AnkiExport'
import { isEnglishWord } from '../../utils/index'
import { settingsStore } from '../../stores/settingsStore'
import './App.css'

function App() {
  const [showIcon, setShowIcon] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [iconPosition, setIconPosition] = useState({ x: 0, y: 0 })
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 })
  const [selectionSize, setSelectionSize] = useState({ width: 0, height: 0 })
  const [selectedWord, setSelectedWord] = useState('')
  const [wordResult, setWordResult] = useState<TopicResourceV2 | null>(null)
  const [operateError, setOperateError] = useState<Error | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportWords, setExportWords] = useState<WordData[]>([])

  // 查询单词信息
  const handleSearchWord = async (word?: string) => {
    const wordToSearch = word || selectedWord
    if (!wordToSearch) return
    if (settingsStore.getState().translateTiming === 2) return;

    setWordResult(null)
    setShowIcon(false)

    try {
      // 通过background service worker调用API
      const response = await chrome.runtime.sendMessage({
        action: 'searchWord',
        word: wordToSearch
      })

      setShowPopover(true)

      if (response.success && response.data) {
        setWordResult(response.data)        
        setOperateError(null)
      } else {      
        if (response.errorType === UnauthorizedError.type) {
          setOperateError(new UnauthorizedError(response?.message))
        } else if (response.errorType === ForbiddenError.type) {
          setOperateError(new ForbiddenError(response?.message))
        } else {
          setOperateError(new Error(response?.message || '查询单词失败'))
        }
        setWordResult(null)
      }
    } catch (error) {
      console.error('查询单词失败:', error)
      setOperateError(error instanceof Error ? error : new Error('查询单词失败'))
    }
  }

  // 处理鼠标松开事件
  const handleMouseUp = (event: MouseEvent) => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim() && isEnglishWord(selection.toString().trim())) {
      const selectedText = selection.toString().trim()
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setIconPosition({ x: event.clientX, y: event.clientY })
      setSelectionPosition({ x: rect.left, y: rect.top })
      setSelectionSize({ width: rect.width, height: rect.height })
      setSelectedWord(selectedText)

      if (settingsStore.getState().translateTiming === 1) {
        handleSearchWord(selectedText);
      } else if (settingsStore.getState().translateTiming === 0) {
        setShowIcon(true)
      }
    } else {
      setShowIcon(false)
    }
  }

  useEffect(() => {  
    const validWebsites = ['localhost', 'www.baicizhan-helper.cn'];

    if (validWebsites.includes(window.location.hostname)) {
      const addExportListener = () => {
        const exportBtn = document.querySelector('#exportBtn') as HTMLElement

        if (exportBtn) {
          exportBtn.addEventListener('click', () => setIsExportModalOpen(true));
        }
      };

      document.readyState === 'loading' ? 
        document.addEventListener('DOMContentLoaded', addExportListener) :
        addExportListener();
    }

    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <>
      {showIcon && (
        <div
          className="selection-icon"
          style={{
            position: 'fixed',
            left: `${iconPosition.x + 10}px`,
            top: `${iconPosition.y - 30}px`,
            zIndex: 10000,
            cursor: 'pointer'
          }}
          onClick={() => handleSearchWord()}
        >
          <img src={Logo} alt="Selection icon" className="selection-icon-img" />
        </div>
      )}
      <Popover.Root open={showPopover} onOpenChange={setShowPopover}>
        <Popover.Trigger id='placeholderDiv' asChild>
          <div style={{
            display: showPopover ? 'block' : 'none',
            position: 'absolute',
            left: `${selectionPosition.x + window.scrollX}px`,
            top: `${selectionPosition.y + window.scrollY}px`,
            width: `${selectionSize.width}px`,
            height: `${selectionSize.height}px`,
            zIndex: 10000
          }}>
          </div>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="popover-content" sideOffset={5} >
            {wordResult ? 
              (<div className="word-popover"><PopoverContent wordResult={wordResult}/></div>) : 
              <ErrorPopover error={operateError} />
            }
            <Popover.Arrow className="popover-arrow" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <AnkiExport
       isOpen={isExportModalOpen} 
       words={exportWords}
       onClose={() => setIsExportModalOpen(false)} 
      />      
      <div id="baicizhan-helper-extension-injection" style={{display: 'none'}}></div>
    </>
  )
}

export default App
