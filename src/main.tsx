import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerPWA } from './utils/pwa';
import { applyTheme, loadTheme } from './utils/theme';

// Apply the saved look before the first paint (no colour flash)
applyTheme(loadTheme());

registerPWA();

createRoot(document.getElementById('root')!).render(<App />);
