import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

if (import.meta.env.DEV && typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  const motion = params.get('motion');
  if (motion === 'force' || motion === 'reduce') {
    document.documentElement.setAttribute('data-motion', motion);
  } else {
    document.documentElement.removeAttribute('data-motion');
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
