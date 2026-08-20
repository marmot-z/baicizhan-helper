import React, { useState, useEffect } from 'react';
import './Settings.css';
import { API } from '../../api/api';
import { UserBookItem } from '../../api/types';
import { settingsStore } from '../../stores/settingsStore';
import Tips from '../../components/Tips';
import { browser } from 'wxt/browser';

interface SettingsProps {}

const Settings: React.FC<SettingsProps> = () => {
  const [defaultWordBook, setDefaultWordBook] = useState<number>(settingsStore.getState().defaultWordBook.bookId);
  const [autoPlay, setAutoPlay] = useState<boolean>(settingsStore.getState().autoPlay);
  const [autoPlayAccent, setAutoPlayAccent] = useState<'uk' | 'usa'>(settingsStore.getState().autoPlayAccent);
  const [translateTiming, setTranslateTiming] = useState<number>(settingsStore.getState().translateTiming);
  const [theme, setTheme] = useState<'light' | 'dark'>(settingsStore.getState().theme);
  const [collectShortcut, setCollectShortcut] = useState<string>(settingsStore.getState().collectShortcut || '');
  const [pageHighlightEnabled, setPageHighlightEnabled] = useState<boolean>(
    settingsStore.getState().pageHighlightEnabled,
  );
  const [lookupShortcut, setLookupShortcut] = useState<string>('读取中...');
  const [wordBooks, setWordBooks] = useState<UserBookItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const fetchWordBooks = async () => {
      try {
        const books = await API.getBooks();
        setWordBooks(books);
      } catch (error) {
        console.error('获取单词本列表失败:', error);
        setErrorMessage('获取单词本列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchWordBooks();
  }, []);

  useEffect(() => {
    void browser.commands.getAll()
      .then((commands) => {
        const lookupCommand = commands.find(command => command.name === 'lookup-selection');
        setLookupShortcut(lookupCommand?.shortcut || '未设置');
      })
      .catch(() => setLookupShortcut('读取失败'));
  }, []);

  const handleWordBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let bookId = Number(e.target.value);
    setDefaultWordBook(bookId);
    settingsStore.getState().setDefaultWordBook({
      bookId: bookId, 
      bookName: wordBooks.find(book => book.user_book_id === bookId)?.book_name || ''});
  };

  const handleAutoPlayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoPlay(e.target.checked);
    settingsStore.getState().setAutoPlay(e.target.checked);
  };

  const handleAutoPlayAccentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const accent = e.target.checked ? 'usa' : 'uk';
    setAutoPlayAccent(accent);
    settingsStore.getState().setAutoPlayAccent(accent);
  };

  const handleTranslateTimingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const timing = Number(e.target.value);
    setTranslateTiming(timing);
    settingsStore.getState().setTranslateTiming(timing);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value as 'light' | 'dark';
    setTheme(newTheme);
    settingsStore.getState().setTheme(newTheme);
  };

  const handlePageHighlightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageHighlightEnabled(e.target.checked);
    settingsStore.getState().setPageHighlightEnabled(e.target.checked);
  };

  const validateShortcut = (input: string) => {
    const parts = input.trim().toLowerCase().split('+').map(p => p.trim()).filter(Boolean);

    if (!parts.length) return '';

    const mods = new Set<string>();
    let key = '';

    for (const p of parts) {
      if (p === 'ctrl' || p === 'alt' || p === 'shift') { 
        mods.add(p); 
        continue; 
      }

      key = p;
    }

    if (!key) return null;

    const validKey = /^[a-z0-9]$/.test(key)
      || /^f([1-9]|1[0-2])$/.test(key)
      || ['enter','escape','esc','tab','space','backspace','delete','del','home','end','pageup','pagedown','up','down','left','right'].includes(key);

    if (!validKey) return null;

    return [...mods].sort().concat(key).join('+');
  };

  const handleShortcutBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const norm = validateShortcut(e.target.value);

    if (norm === null) { 
      setCollectShortcut('');       
      setErrorMessage('收藏快捷键格式错误');
      return; 
    }

    setCollectShortcut(norm);
    settingsStore.getState().setCollectShortcut(norm);
  };

  return (
    <div className="settings-container">      
      <form className="settings-form">
        <div className="setting-item">
          <label className="setting-label">默认收藏单词本</label>
          <select
            value={defaultWordBook}
            onChange={handleWordBookChange}
            className="setting-select"
            disabled={loading}
          >
            {loading ? (
              <option value="">加载中...</option>
            ) : (
              wordBooks.map(book => (
                 <option 
                  key={book.user_book_id} 
                  value={book.user_book_id.toString()} 
                  selected={book.user_book_id === defaultWordBook}>
                   {book.book_name}
                 </option>
               ))
            )}
          </select>
        </div>

        <div className="setting-item">
          <label className="setting-label">翻译时机</label>
          <select
            value={translateTiming}
            onChange={handleTranslateTimingChange}
            className="setting-select"
          >
            <option value={0}>显示图标，点击翻译</option>
            <option value={1}>直接翻译</option>
            <option value={3}>永不翻译</option>
          </select>
        </div>

        <div className="setting-item">
          <label className="setting-label">主题设置</label>
          <select
            value={theme}
            onChange={handleThemeChange}
            className="setting-select"
          >
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>

        <div className="setting-item">
          <label className="setting-label">自动发音</label>
          <div className="switch-container">
            <input
              type="checkbox"
              checked={autoPlay}
              onChange={handleAutoPlayChange}
              className="switch-input"
            />
            <div className="switch-slider" />
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">网页高亮收藏单词</label>
          <div className="switch-container">
            <input
              type="checkbox"
              checked={pageHighlightEnabled}
              onChange={handlePageHighlightChange}
              className="switch-input"
              aria-label="启用网页收藏单词高亮"
            />
            <div className="switch-slider" />
          </div>
        </div>

        <p>开启后使用蓝色下划线标记所有单词本中的收藏单词，鼠标悬停可查看释义</p>

        <div className="setting-item">
          <label className="setting-label">自动发音口音</label>
          <label className="switch-container dual-switch-container">
            <input
              type="checkbox"
              checked={autoPlayAccent === 'usa'}
              onChange={handleAutoPlayAccentChange}
              className="switch-input dual-switch-input"
              aria-label="切换自动发音口音"
            />
            <span className="dual-switch-option dual-switch-option-left">英音</span>
            <span className="dual-switch-option dual-switch-option-right">美音</span>
            <div className="switch-slider dual-switch-slider" />
          </label>
        </div>

        <div className="setting-item">
          <label className="setting-label">划词查询快捷键</label>
          <span className="setting-shortcut-value">{lookupShortcut}</span>
        </div>

        <p>未设置时不启用快捷键查询，可在浏览器的扩展快捷键管理页面中绑定</p>

        <div className="setting-item">
          <label className="setting-label">收藏快捷键</label>
          <div className="switch-container">
            <input
              type="text"
              defaultValue={collectShortcut}
              onBlur={handleShortcutBlur}
              className="setting-input"
            />
          </div>
        </div>

        <p>多键位时使用 + 分隔，如：ctrl + shift + c。支持 alt, ctrl, shift 以及其他字母数字键位</p>      
        <p>导出anki功能请到 <a href="https://www.baicizhan-helper.cn/page/wordbook/0" target="_blank">网页端</a> 进行操作</p>
        <p>单词本内容请到  <a href="https://www.baicizhan-helper.cn/page/dashboard" target="_blank">网页端</a> 查看</p>
      </form>

      <>
        {
          errorMessage &&
          <Tips message={errorMessage} onClose={() => setErrorMessage('')}  />
        }
      </>
    </div>
  );
};

export default Settings;
