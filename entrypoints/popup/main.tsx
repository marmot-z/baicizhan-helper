import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../src/popup/App.tsx';
import '../../src/popup/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);