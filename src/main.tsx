import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import App from "./App.tsx";
import "./index.css";

// Initialize Eruda for mobile debugging - ONLY in development mode
// Opt-in only when ?debug=true is in URL (avoid overlays blocking UI)
if (import.meta.env.DEV) {
  const urlParams = new URLSearchParams(window.location.search);
  const debugMode = urlParams.get('debug') === 'true';
  
  if (debugMode) {
    import('eruda').then((eruda) => eruda.default.init());
  }
}

// Register push notification service worker
if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/push-sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[Push] Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.log('[Push] Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
