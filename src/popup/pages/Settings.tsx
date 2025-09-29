import React, { useState, useEffect } from 'react';
import './Settings.css';
import { API } from '../../api/api';
import { UserBookItem } from '../../api/types';
import { settingsStore } from '../../stores/settingsStore';

interface SettingsProps {}

const Settings: React.FC<SettingsProps> = () => {
  const [defaultWordBook, setDefaultWordBook] = useState<number>(settingsStore.getState().defaultWordBook.bookId);
  const [autoPlay, setAutoPlay] = useState<boolean>(settingsStore.getState().autoPlay);
  const [translateTiming, setTranslateTiming] = useState<number>(settingsStore.getState().translateTiming);
  const [wordBooks, setWordBooks] = useState<UserBookItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchWordBooks = async () => {
      try {
        const books = await API.getBooks();
        setWordBooks(books);
      } catch (error) {
        console.error('获取单词本列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWordBooks();
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

  const handleTranslateTimingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const timing = Number(e.target.value);
    setTranslateTiming(timing);
    settingsStore.getState().setTranslateTiming(timing);
  };

  return (
    <div className="settings-container">
      <h2 className="settings-title">设置</h2>
      
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
      </form>
    </div>
  );
};

export default Settings;