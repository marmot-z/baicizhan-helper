import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCopy } from '@fortawesome/free-solid-svg-icons';
import './SentenceTranslationPopover.css';

interface SentenceTranslationPopoverProps {
  translatedText: string;
  theme: 'light' | 'dark';
}

const SentenceTranslationPopover: React.FC<SentenceTranslationPopoverProps> = ({
  translatedText,
  theme,
}) => {
  const [copied, setCopied] = useState(false);

  const fallbackCopy = () => {
    const textarea = document.createElement('textarea');
    textarea.value = translatedText;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    const copySucceeded = document.execCommand('copy');
    textarea.remove();

    if (!copySucceeded) {
      throw new Error('浏览器不支持复制译文');
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(translatedText);
        } catch {
          fallbackCopy();
        }
      } else {
        fallbackCopy();
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('复制译文失败:', error);
    }
  };

  return (
    <div
      className={`bcz-helper-sentence-translation-popover ${theme === 'dark' ? 'dark-theme' : ''}`}
      aria-live="polite"
    >
      <div className="bcz-helper-sentence-translation-label">翻译</div>
      <div className="bcz-helper-sentence-translation-text">
        <span>{translatedText}</span>
        <button
          type="button"
          className={`bcz-helper-sentence-translation-copy ${copied ? 'copied' : ''}`}
          aria-label={copied ? '已复制译文' : '复制译文'}
          title={copied ? '已复制' : '复制'}
          onMouseUp={(event) => event.stopPropagation()}
          onClick={() => void handleCopy()}
        >
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
        </button>
      </div>
    </div>
  );
};

export default SentenceTranslationPopover;
