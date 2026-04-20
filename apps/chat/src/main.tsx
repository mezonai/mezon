import * as ReactDOM from 'react-dom/client';

import { ThemeManager } from '@mezon/themes';
import App from './app/app';

import 'lite-youtube-embed/src/lite-yt-embed.css';
import 'lite-youtube-embed/src/lite-yt-embed.js';
import './styles.scss';

if (process.env.NX_ENABLE_SENTRY === 'true') {
	// import('./instrument/instrument');
}

ThemeManager.initializeTheme();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(<App />);
