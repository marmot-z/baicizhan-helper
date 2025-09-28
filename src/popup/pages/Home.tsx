import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { API } from '../../api/api';
import { SearchWordResultV2, TopicResourceV2 } from '../../api/types';
import PopoverContent from '../../components/PopoverContent';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchWordResultV2[]>([]);
  const [wordDetail, setWordDetail] = useState<TopicResourceV2 | null>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const results = await API.searchWord(searchQuery);
      setSearchResults(results);
      setWordDetail(null);
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
    }
  };

  const handleWordClick = async (topicId: number) => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getWordDetail',
        topicId
      })

      if (response.success) {
        const detail = response.data;  
        setSearchResults([]);
        setWordDetail(detail);
      } else {
        setWordDetail(null);
        console.error('获取单词详情失败:', response.error);        
      }
    } catch (error) {
      setWordDetail(null);
      console.error('获取单词详情失败:', error);
    }
  };

  return (
    <>
      {/* 搜索框 */}
      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="输入要查询的单词..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="search-button" onClick={handleSearch}>
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </div>
      </div>

      {/* 搜索结果或单词详情 */}
      {wordDetail ? (
        <div className="word-detail">
          <PopoverContent wordResult={wordDetail} />
        </div>
      ) : (
        <div className="search-results">
          {searchResults.map((result) => (
            <div
              key={result.topic_id}
              className="word-item"
              onClick={() => handleWordClick(result.topic_id)}
            >
              <div className="search-result-word">{result.word}</div>
              <div className="word-meaning">{result.mean_cn}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}