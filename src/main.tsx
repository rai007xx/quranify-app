import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure window.fetch is writable to avoid extension TypeError
try {
  let _fetch = window.fetch ? window.fetch.bind(window) : undefined;
  Object.defineProperty(window, 'fetch', {
    get() {
      return _fetch;
    },
    set(v) {
      _fetch = v;
    },
    configurable: true,
    enumerable: true,
  });
} catch (_) {}

createRoot(document.getElementById('root')!).render(<App />);
