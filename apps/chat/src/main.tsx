import * as ReactDOM from 'react-dom/client';

import App from './app/app';

import 'rc-tooltip/assets/bootstrap.css';

// import './styles.scss';

// import './instrument/instrument';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(<App />);
