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
import { buildWordHistoryPreview, type HistoryRecordInput } from '../../stores/historyStorage'
import './App.css'

type PopoverResult =
  | { kind: 'word'; data: TopicResourceV2 }
  | { kind: 'translation'; translatedText: string }
  | null

interface SelectionContext {
  text: string
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'> | null
}

function getCurrentSelectionContext(): SelectionContext {
  const selection = window.getSelection()
  const selectedText = selection?.toString() || ''
  if (selectedText.trim() && selection?.rangeCount) {
    const rect = selection.getRangeAt(0).getBoundingClientRect()
    return { text: selectedText, rect }
  }

  const activeElement = document.activeElement
  if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
    const start = activeElement.selectionStart
    const end = activeElement.selectionEnd
    if (start !== null && end !== null && end > start) {
      return {
        text: activeElement.value.slice(start, end),
        rect: activeElement.getBoundingClientRect(),
      }
    }
  }

  return { text: '', rect: null }
}

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

  const recordSelectionHistory = useCallback((entry: Omit<HistoryRecordInput, 'source' | 'page'>) => {
    void chrome.runtime.sendMessage({
      action: 'recordHistory',
      entry: {
        ...entry,
        source: 'selection',
        page: {
          title: document.title,
          url: window.location.href,
        },
      },
    }).then((response) => {
      if (!response?.success) {
        console.warn('保存划词历史失败:', response?.error);
      }
    }).catch((error) => {
      console.warn('保存划词历史失败:', error);
    });
  }, [])

  const handleSelectedContent = useCallback(async (content: string, explicit = false): Promise<boolean> => {
    const classification = classifySelectedText(content)
    if (classification.kind === 'unsupported'
      || (!explicit && settingsStore.getState().translateTiming === 3)) {
      return false
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
        return true
      }

      setShowPopover(true)

      if (response.success && response.data) {
        if (classification.kind === 'english-word') {
          setPopoverResult({ kind: 'word', data: response.data })
          recordSelectionHistory({
            text: classification.text,
            resultKind: 'word',
            preview: buildWordHistoryPreview(response.data.dict.chn_means),
            topicId: response.data.dict.word_basic_info.topic_id,
          })
        } else if (response.data.translatedText) {
          setPopoverResult({
            kind: 'translation',
            translatedText: response.data.translatedText,
          })
          recordSelectionHistory({
            text: classification.text,
            resultKind: 'translation',
            preview: response.data.translatedText,
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
        return true
      }

      console.error('查询失败:', error)
      setPopoverResult(null)
      setOperateError(error instanceof Error ? error : new Error('查询失败，请稍后重试'))
      setShowPopover(true)
    }

    return true
  }, [recordSelectionHistory])

  const handleExternalLookup = useCallback(async (providedText?: string): Promise<boolean> => {
    const currentSelection = getCurrentSelectionContext()
    const content = (providedText?.trim() || currentSelection.text).trim()
    const classification = classifySelectedText(content)
    if (classification.kind === 'unsupported') {
      return false
    }

    const currentSelectionText = currentSelection.text.trim().replace(/\s+/g, ' ')
    const selectionMatches = currentSelectionText === classification.text
    const rect = selectionMatches ? currentSelection.rect : null

    setSelectionPosition({
      x: rect?.left ?? window.innerWidth / 2,
      y: rect?.top ?? window.innerHeight / 3,
    })
    setSelectionSize({
      width: rect?.width ?? 1,
      height: rect?.height ?? 1,
    })
    setSelectedContent(classification.text)
    setShowIcon(false)
    setShowPopover(false)
    setPopoverResult(null)
    setOperateError(null)

    return handleSelectedContent(classification.text, true)
  }, [handleSelectedContent])

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

  useEffect(() => {
    const handleRuntimeMessage = (
      message: { action?: string; text?: string },
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: { handled: boolean }) => void,
    ) => {
      if (message?.action !== 'lookupSelection') {
        return false
      }

      void handleExternalLookup(message.text)
        .then((handled) => sendResponse({ handled }))
        .catch((error) => {
          console.error('快捷查询失败:', error)
          sendResponse({ handled: false })
        })
      return true
    }

    chrome.runtime.onMessage.addListener(handleRuntimeMessage)
    return () => chrome.runtime.onMessage.removeListener(handleRuntimeMessage)
  }, [handleExternalLookup])

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
