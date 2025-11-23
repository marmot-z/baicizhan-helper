import { TopicResourceV2 } from '../api/types';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faLink } from '@fortawesome/free-solid-svg-icons';
import AudioIcon from './AudioIcon';
import { groupChineseMeanings } from '../utils';
import { useState, useEffect } from 'react';
import { UnauthorizedError, ForbiddenError } from '../api/errors';
import { settingsStore } from '../stores/settingsStore';
import { useHotkeys } from 'react-hotkeys-hook';
import Tips from './Tips';
import './PopoverContent.css';

const CDN_HOST = 'https://7n.bczcdn.com';

const PopoverContent: React.FC<{wordResult: TopicResourceV2}> = ({ wordResult }) => {
    const [collected, setCollected] = useState<boolean>(wordResult.collected);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const collectShortcut = settingsStore.getState().collectShortcut;
    if (collectShortcut) {
        useHotkeys(collectShortcut, manageCollect, { scopes: ['popover'] });
    }

    useEffect(() => {
        const audios: HTMLAudioElement[] = [];        

        const playAudiosSequentially = async () => {
            const audioUrls = [
                wordResult.dict.word_basic_info.accent_uk_audio_uri,
                wordResult.dict.sentences?.[0]?.audio_uri
            ].filter(Boolean);

            for (const audioUrl of audioUrls) {
                try {
                    const audio = new Audio(CDN_HOST + audioUrl);
                    audios.push(audio);
                    await new Promise((resolve, reject) => {
                        audio.onended = resolve;
                        audio.onerror = reject;
                        audio.play().catch(reject);
                    });                    
                    await new Promise(resolve => setTimeout(resolve, 500)); 
                } catch (error) {
                    console.error('音频播放失败:', error);
                }
            }
        };

        settingsStore.getState().autoPlay && playAudiosSequentially();        

        return () => {
            audios.forEach(audio => audio.pause());
        };
    }, [wordResult, useHotkeys]);

    async function manageCollect() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: collected ? 'cancelCollect' : 'collect',
                bookId: settingsStore.getState().defaultWordBook.bookId,
                topicId: wordResult.dict.word_basic_info.topic_id,
            });

            if (response.success) {
                setErrorMessage(collected ? '取消收藏成功' : `已收藏到：${settingsStore.getState().defaultWordBook.bookName}`);
                setCollected(!collected);                
            } else {
                if (response.errorType === UnauthorizedError.type) {
                    setErrorMessage('请先登录');
                } else if (response.errorType === ForbiddenError.type) {
                    setErrorMessage('权限不足，请开通会员');
                } else {
                    setErrorMessage((collected ? '取消收藏' : '收藏') + '操作失败，请稍后重试');
                }
            }
        } catch (error) {
            console.error('收藏/取消收藏失败', error);
            setErrorMessage('网络异常，请稍后重试');
        }
    }

    return (
        <div>
            <div className="bcz-helper-header-row">
                <span className="bcz-helper-word">
                    {wordResult.dict.word_basic_info.word}
                    <a href={`http://www.baicizhan-helper.cn/page/word-detail/${wordResult.dict.word_basic_info.topic_id}`} target="_blank">
                        <FontAwesomeIcon 
                            icon={faLink} 
                            style={{fontSize: 'medium'}}
                            title='查看详情'
                        />
                    </a>
                </span>                
                <FontAwesomeIcon
                    icon={faStar}
                    style={{color: collected ? '#007bff' : '#ccc'}}
                    className='bcz-helper-fontawesome-icon'
                    onClick={manageCollect}
                    title="收藏/取消收藏"
                />
            </div>
            <div className="bcz-helper-pronunciation-row">
                <div className="bcz-helper-pronunciation-container">
                    {wordResult.dict.word_basic_info.accent_uk && (
                        <div className="bcz-helper-pronunciation-item">
                            英<span className="bcz-helper-pronunciation">{wordResult.dict.word_basic_info.accent_uk}</span>
                            <AudioIcon src={wordResult.dict.word_basic_info.accent_uk_audio_uri} />
                        </div>
                    )}
                    {wordResult.dict.word_basic_info.accent_usa && (
                        <div className="bcz-helper-pronunciation-item">
                            美<span className="bcz-helper-pronunciation">{wordResult.dict.word_basic_info.accent_usa}</span>
                            <AudioIcon src={wordResult.dict.word_basic_info.accent_usa_audio_uri} />
                        </div>
                    )}
                </div>
            </div>
            <div className="bcz-helper-definition-row">
                {Array.from(groupChineseMeanings(wordResult.dict.chn_means)).map(([meanType, means]) => (
                    <p key={meanType} style={{ margin: '0.25rem 0' }}>
                        <strong>{meanType}</strong> {(() => {
                            const text = means.join('; ');
                            return text.length > 50 ? text.substring(0, 50) + '...' : text;
                        })()}
                    </p>
                ))}
            </div>
            <hr className="bcz-helper-separator" />
            {wordResult.dict.sentences && wordResult.dict.sentences.length > 0 && (
                <>
                    <div className="bcz-helper-example-sentence-row">
                        <span className="bcz-helper-sentence">{wordResult.dict.sentences[0].sentence}</span>
                        {wordResult.dict.sentences[0].audio_uri && <AudioIcon src={wordResult.dict.sentences[0].audio_uri} />}
                    </div>
                    <div className="bcz-helper-example-translation-row">
                        <span className="bcz-helper-translation">{wordResult.dict.sentences[0].sentence_trans}</span>
                    </div>
                    <div className="bcz-helper-example-image-row">
                        <img src={"https://7n.bczcdn.com" + wordResult.dict.sentences[0].img_uri} alt="Example Image" className="bcz-helper-example-image" />
                    </div>
                </>
            )}
            {errorMessage && (
                <Tips 
                    message={errorMessage} 
                    onClose={() => setErrorMessage('')} 
                />
            )}
        </div>
    )
}

export default PopoverContent;