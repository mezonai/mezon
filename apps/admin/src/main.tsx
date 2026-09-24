import * as ReactDOM from 'react-dom/client';

import { showSelfXssWarning } from '@mezon/logger';
import App from './app/app';

import './styles.scss';

showSelfXssWarning();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
