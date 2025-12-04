import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { blockUiClicks } from './utils/uiLayer'

createRoot(document.getElementById("root")!).render(<App />);

// Initialize UI click blocking after React renders
setTimeout(() => {
  blockUiClicks();
}, 100);
