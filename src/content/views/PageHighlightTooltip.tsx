import type { HighlightHoverInfo } from '../highlight/pageHighlighter';

interface PageHighlightTooltipProps {
  info: HighlightHoverInfo;
  theme: 'light' | 'dark';
}

function PageHighlightTooltip({ info, theme }: PageHighlightTooltipProps) {
  const maxWidth = Math.min(320, window.innerWidth - 16);
  const left = Math.min(
    Math.max(8, info.rect.left),
    Math.max(8, window.innerWidth - maxWidth - 8),
  );
  const estimatedHeight = info.mean.length > 80 ? 132 : 96;
  const showAbove = info.rect.bottom + estimatedHeight + 8 > window.innerHeight;

  return (
    <div
      className={`bcz-helper-highlight-tooltip ${theme === 'dark' ? 'dark-theme' : ''}`}
      style={{
        left: `${left}px`,
        top: `${showAbove ? info.rect.top - 8 : info.rect.bottom + 8}px`,
        maxWidth: `${maxWidth}px`,
        transform: showAbove ? 'translateY(-100%)' : undefined,
      }}
      role="tooltip"
      translate="no"
    >
      <div className="bcz-helper-highlight-tooltip-word">{info.word}</div>
      <div className="bcz-helper-highlight-tooltip-mean">{info.mean || '暂无释义'}</div>
    </div>
  );
}

export default PageHighlightTooltip;
