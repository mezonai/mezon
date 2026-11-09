import * as ReactDOM from 'react-dom/client';

import { showSelfXssWarning } from '@mezon/logger';
import { ThemeManager } from '@mezon/themes';
import { applyIconMotion } from '@mezon/ui';
import App from './app/app';

import 'lite-youtube-embed/src/lite-yt-embed.css';
import 'lite-youtube-embed/src/lite-yt-embed.js';
import './styles.scss';

showSelfXssWarning();

if (process.env.NX_ENABLE_SENTRY === 'true') {
	// import('./instrument/instrument');
}

ThemeManager.initializeTheme();
applyIconMotion();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(<App />);
