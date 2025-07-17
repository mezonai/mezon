import * as ReactDOM from 'react-dom/client';

import { ThemeManager } from '@mezon/themes';
import App from './app/app';

// import './styles.scss';

import './instrument/instrument';

ThemeManager.initializeTheme();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(<App />);
