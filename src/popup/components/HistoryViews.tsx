import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { HistoryEntry, HistorySource } from '../../stores/historyStorage';

interface RecentHistoryBarProps {
  entries: HistoryEntry[];
  onOpenAll: () => void;
  onSelect: (entry: HistoryEntry) => void;
}

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onBack: () => void;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

type HistoryFilter = 'all' | HistorySource;

function formatHistoryTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function getPageDomain(entry: HistoryEntry): string {
  if (!entry.page?.url) return '';
  try {
    return new URL(entry.page.url).hostname;
  } catch {
    return '';
  }
}

function sourceLabel(source: HistorySource): string {
  return source === 'search' ? '搜索' : '划词';
}

export function RecentHistoryBar({ entries, onOpenAll, onSelect }: RecentHistoryBarProps) {
  const recentEntries = entries.slice(0, 3);
  if (!recentEntries.length) return null;

  return (
    <div className="history-recent-bar" aria-label="最近历史记录">
      <span className="history-recent-label">最近</span>
      <div className="history-recent-items">
        {recentEntries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="history-recent-chip"
            title={entry.text}
            onClick={() => onSelect(entry)}
          >
            {entry.text}
          </button>
        ))}
      </div>
      <button type="button" className="history-all-button" onClick={onOpenAll}>
        全部
      </button>
    </div>
  );
}

export function HistoryPanel({
  entries,
  onBack,
  onSelect,
  onDelete,
  onClear,
}: HistoryPanelProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const filteredEntries = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((entry) => entry.sources.includes(filter));
  }, [entries, filter]);

  const handleClear = () => {
    if (window.confirm('确定清空全部历史记录吗？')) {
      onClear();
    }
  };

  return (
    <section className="history-panel" aria-label="历史记录">
      <div className="history-panel-header">
        <button type="button" className="history-back-button" onClick={onBack}>
          返回
        </button>
        <span className="history-panel-title">历史记录（{entries.length}）</span>
        <button
          type="button"
          className="history-clear-button"
          onClick={handleClear}
          disabled={!entries.length}
        >
          <FontAwesomeIcon icon={faTrashCan} />
          清空
        </button>
      </div>

      <div className="history-filters" aria-label="筛选历史记录">
        {([
          ['all', '全部'],
          ['search', '搜索'],
          ['selection', '划词'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`history-filter-button ${filter === value ? 'active' : ''}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="history-list">
        {!filteredEntries.length ? (
          <div className="history-empty">暂无{filter === 'all' ? '' : sourceLabel(filter)}记录</div>
        ) : filteredEntries.map((entry) => {
          const domain = getPageDomain(entry);
          return (
            <div key={entry.id} className="history-list-item">
              <button
                type="button"
                className="history-entry-button"
                onClick={() => onSelect(entry)}
                title="重新查询"
              >
                <div className="history-entry-heading">
                  <span className="history-entry-sources">
                    {entry.sources.map((source) => (
                      <span key={source} className={`history-source history-source-${source}`}>
                        {sourceLabel(source)}
                      </span>
                    ))}
                  </span>
                  <span className="history-entry-text">{entry.text}</span>
                  <time className="history-entry-time" dateTime={new Date(entry.lastViewedAt).toISOString()}>
                    {formatHistoryTime(entry.lastViewedAt)}
                  </time>
                </div>
                <div className="history-entry-preview">
                  <span>{entry.preview || '已查询'}</span>
                  {domain && <span className="history-entry-domain"> · {domain}</span>}
                </div>
              </button>
              <button
                type="button"
                className="history-delete-button"
                onClick={() => onDelete(entry.id)}
                aria-label={`删除 ${entry.text}`}
                title="删除"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
