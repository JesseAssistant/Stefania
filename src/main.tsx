import { createRoot } from 'react-dom/client';
import { Root } from './app/App';
import { registerServiceWorker } from './pwa/register';
import './styles/app.css';

createRoot(document.getElementById('root') as HTMLElement).render(<Root />);
registerServiceWorker();
