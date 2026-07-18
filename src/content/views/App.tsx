import Logo from '../../assets/icon.png'
import { useState, useEffect, useCallback, useRef } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { TopicResourceV2 } from '../../api/types'
import PopoverContent from '../../components/PopoverContent'
import ErrorPopover from '../../components/ErrorPopover'
import SentenceTranslationPopover from '../../components/SentenceTranslationPopover'
import { UnauthorizedError, ForbiddenError } from '../../api/errors'
import AnkiExport from '../../components/AnkiExport'
import { WordData } from '../../components/AnkiExport'
import { classifySelectedText } from '../../utils/selectionText'
import { settingsStore } from '../../stores/settingsStore'
import './App.css'

type PopoverResult =
  | { kind: 'word'; data: TopicResourceV2 }
  | { kind: 'translation'; translatedText: string }
  | null

function App() {
  const [showIcon, setShowIcon] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [iconPosition, setIconPosition] = useState({ x: 0, y: 0 })
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 })
  const [selectionSize, setSelectionSize] = useState({ width: 0, height: 0 })
  const [selectedContent, setSelectedContent] = useState('')
  const [popoverResult, setPopoverResult] = useState<PopoverResult>(null)
  const [operateError, setOperateError] = useState<Error | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportWords, setExportWords] = useState<WordData[]>([])
  const requestIdRef = useRef(0)
  const theme = settingsStore((state) => state.theme)

  const handleSelectedContent = useCallback(async (content: string) => {
    const classification = classifySelectedText(content)
    if (classification.kind === 'unsupported' || settingsStore.getState().translateTiming === 3) {
      return
    }

    const requestId = ++requestIdRef.current
    setPopoverResult(null)
    setOperateError(null)
    setShowIcon(false)

    try {
      const response = classification.kind === 'english-word'
        ? await chrome.runtime.sendMessage({
            action: 'searchWord',
            word: classification.text,
          })
        : await chrome.runtime.sendMessage({
            action: 'translateSentence',
            text: classification.text,
          })

      if (requestId !== requestIdRef.current) {
        return
      }

      setShowPopover(true)

      if (response.success && response.data) {
        if (classification.kind === 'english-word') {
          setPopoverResult({ kind: 'word', data: response.data })
        } else if (response.data.translatedText) {
          setPopoverResult({
            kind: 'translation',
            translatedText: response.data.translatedText,
          })
        } else {
          throw new Error('翻译失败，返回结果为空')
        }
      } else {
        if (response.errorType === UnauthorizedError.type) {
          setOperateError(new UnauthorizedError(response.error || '登录已过期'))
        } else if (response.errorType === ForbiddenError.type) {
          setOperateError(new ForbiddenError(response.error || '权限不足'))
        } else {
          setOperateError(new Error(response.error || '查询失败，请稍后重试'))
        }
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return
      }

      console.error('查询失败:', error)
      setPopoverResult(null)
      setOperateError(error instanceof Error ? error : new Error('查询失败，请稍后重试'))
      setShowPopover(true)
    }
  }, [])

  // 处理鼠标松开事件
  const handleMouseUp = useCallback((event: MouseEvent) => {
    const selection = window.getSelection()
    const classification = classifySelectedText(selection?.toString() || '')
    const translateTiming = settingsStore.getState().translateTiming
    requestIdRef.current += 1

    if (classification.kind === 'unsupported' || translateTiming === 3 || !selection?.rangeCount) {
      setShowIcon(false)
      setShowPopover(false)
      return
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    setIconPosition({ x: event.clientX, y: event.clientY })
    setSelectionPosition({ x: rect.left, y: rect.top })
    setSelectionSize({ width: rect.width, height: rect.height })
    setSelectedContent(classification.text)
    setShowPopover(false)
    setPopoverResult(null)
    setOperateError(null)

    if (translateTiming === 1) {
      void handleSelectedContent(classification.text)
    } else if (translateTiming === 0) {
      setShowIcon(true)
    }
  }, [handleSelectedContent])

  useEffect(() => {
    const validWebsites = ['http://localhost:5173', 'https://www.baicizhan-helper.cn'];

    window.addEventListener('message', (event) => {
      if (validWebsites.includes(event.origin) && event.data.type === 'EXPORT_TO_ANKI_WORDS') {
        const words = Object.entries(event.data.payload).map(([topicId, word]) => ({
          topicId: Number(topicId), word: word as string
        }));

        setExportWords(words);
        setIsExportModalOpen(true);
      }
    });

    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseUp])

  return (
    <>
      {showIcon && (
        <div
          className="bcz-helper-selection-icon"
          style={{
            position: 'fixed',
            left: `${iconPosition.x + 10}px`,
            top: `${iconPosition.y - 30}px`,
            zIndex: 10000,
            cursor: 'pointer'
          }}
          onClick={() => handleSelectedContent(selectedContent)}
        >
          <img src={Logo} alt="Selection icon" className="bcz-helper-selection-icon-img" />
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
          <Popover.Content className="bcz-helper-popover-content" sideOffset={5} >
            {popoverResult?.kind === 'word' ?
              (<div className={`bcz-helper-word-popover ${theme === 'dark' ? 'dark-theme' : ''}`}>
                <PopoverContent wordResult={popoverResult.data}/>
              </div>) : popoverResult?.kind === 'translation' ?
              (<SentenceTranslationPopover
                translatedText={popoverResult.translatedText}
                theme={theme}
              />) :
              (<ErrorPopover error={operateError} />)
            }
            <Popover.Arrow className={`bcz-helper-popover-arrow ${theme === 'dark' ? 'dark-theme' : ''}`} />
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
