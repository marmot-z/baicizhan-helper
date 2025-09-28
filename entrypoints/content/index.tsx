import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { defineContentScript } from 'wxt/sandbox';
import App from '../../src/content/views/App.tsx';

export default defineContentScript({
  matches: ['<all_urls>', 'file:///*'],
  main() {
    // 确保React在content script环境中正确初始化
    if (typeof window !== 'undefined') {
      (window as any).React = React;
    }

    console.log('[WXT] Hello world from content script!');

    const container = document.createElement('div');
    container.id = 'wxt-app';
    document.body.appendChild(container);
    createRoot(container).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  },
});