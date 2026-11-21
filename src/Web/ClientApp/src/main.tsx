import './styles.scss';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const baseUrl = document.getElementsByTagName('base')[0]?.getAttribute('href') ?? '/';
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('index.html has no #root element');

createRoot(rootElement).render(
  <BrowserRouter basename={baseUrl}>
    <App />
  </BrowserRouter>
);
