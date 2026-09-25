import { showSelfXssWarning } from '@mezon/logger';
import i18n from '@mezon/translations';
import { Buffer } from 'buffer';
import * as ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import App from './app/app';
import './styles.scss';

showSelfXssWarning();

const globalScope = globalThis as typeof globalThis & { Buffer?: typeof Buffer; global?: typeof globalThis };
globalScope.global = globalScope.global || globalScope;
globalScope.Buffer = Buffer;
if (!(globalThis as { process?: unknown }).process) {
	(globalThis as { process: { env: Record<string, string | undefined> } }).process = { env: {} };
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<I18nextProvider i18n={i18n}>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</I18nextProvider>
);
