import React, { useState, useEffect } from 'react';
import './AnkiExport.css';

interface WordData { 
  topicId: number, 
  word: string 
}

interface AnkiExportProps {
  isOpen: boolean;
  onClose?: () => void;
  onExport?: (deckName: string) => void;
  decks?: string[];
  words?: WordData[];
}

const AnkiExport: React.FC<AnkiExportProps> = ({
  isOpen,
  onClose,
  onExport,
  words = []
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedDeck, setSelectedDeck] = useState('');
  const [availableDecks, setAvailableDecks] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 组件打开时获取可用牌组
  useEffect(() => {
    const loadAvailableDecks = async () => {
      setLoading(true);
      try {
        const response = await chrome.runtime.sendMessage({ action: 'getAnkiDecks' });
        
        if (response.success) {
          const deckNames = response.data;

          setAvailableDecks(deckNames);

          if (deckNames.length > 0 && !selectedDeck) {
            setSelectedDeck(deckNames[0]);
          }
        } else {
          setError('无法连接到 Anki，请确保 Anki 正在运行并安装了 AnkiConnect 插件');
        }
      } catch (error) {
        setAvailableDecks([]);
        setError('无法连接到 Anki，请确保 Anki 正在运行并安装了 AnkiConnect 插件');
      } finally {
        setLoading(false);
      }
    };

    loadAvailableDecks();
  }, [isOpen]);

  const close = async() => {
    await chrome.runtime.sendMessage({ action: 'stopExport' });
    setIsExporting(false);
    setProgress(0);
    setError('');
    onClose?.();
  }

  const handleExport = async () => {
    if (!selectedDeck) {
      setError('请选择一个牌组');
      return;
    }

    setIsExporting(true);
    setError('');

    try {
        await chrome.runtime.sendMessage({ 
          action: 'exportCheck', 
          deckName: selectedDeck, 
          words 
        });

        chrome.runtime.sendMessage({ 
          action: 'doExport'
        });

        while (true) {
            const res = await chrome.runtime.sendMessage({ 
              action: 'getExportProgress'
            });

            if (!res.success) {
              setError(res.error || '导出失败，请检查 Anki 是否正在运行');              
              return;
            }

            const progressValue = res.data.total === 0 ?
              1 :
              Number((res.data.processed / res.data.total).toFixed(2));
            setProgress(progressValue * 100);

            if (progressValue === 1) {
              onExport?.(selectedDeck);
              return;
            }

            // 休眠0.5s
            await new Promise(resolve => setTimeout(resolve, 500));
        }      

    } catch (error) {
      console.error('Export error:', error);
      setError(error instanceof Error ? error.message : '导出失败，请检查 Anki 是否正在运行');
      setIsExporting(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    close();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="export-modal-overlay">
      <div className="export-modal">
        {!isExporting ? (
          // Export Modal
          <>
            <div className="modal-header">
              <h2>导出{words.length}词至Anki</h2>
              <button className="close-button" onClick={handleClose}>&times;</button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="deck-select">deck:</label>
                <select
                  id="deck-select"
                  value={selectedDeck}
                  onChange={(e) => setSelectedDeck(e.target.value)}
                  disabled={loading}
                >
                  {loading ? (
                    <option value="">加载中...</option>
                  ) : !availableDecks || availableDecks.length === 0 ? (
                    <option value="">未找到牌组</option>
                  ) : (
                    availableDecks.map((deck) => (
                      <option key={deck} value={deck}>{deck}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={handleClose}>取消</button>
              <button
                className="export-button"
                onClick={handleExport}
                disabled={loading || !selectedDeck || availableDecks.length === 0}
              >
                导出
              </button>
            </div>
          </>
        ) : (
          // Export Progress
          <>
            <div className="modal-header">
              <h2>导出{words.length}词至Anki</h2>
              <button className="close-button" onClick={handleClose}>&times;</button>
            </div>
            <div className="modal-body">
              {error ? (
                <div className="error-message">
                  {error}
                  <div style={{ marginTop: '8px' }}>
                    <button
                      className="cancel-button"
                      onClick={() => { setIsExporting(false); setError(''); }}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      返回
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="progress-percentage">{progress}%</div>
                  <p className="warning-text">请耐心等候，退出该页面会中断导出。</p>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnkiExport;
export { type WordData }