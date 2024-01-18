import { MezonStoreProvider, initStore } from '@mezon/store';
import { RouterProvider } from 'react-router-dom';
import {
  MezonContextProvider,
  CreateNakamaClientOptions,
  useMezon,
} from '@mezon/transport';
import { GoogleOAuthProvider } from '@react-oauth/google';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MezonUiProvider } from '@mezon/ui';
import { routes } from './routes/index';
import './app.module.scss';
import { preloadedState } from './mock/state';
import { useEffect, useMemo } from 'react';
import WebFont from 'webfontloader';


const GOOGLE_CLIENT_ID =
  '1089303247801-qp0lhju8efratqkuk2murphealgdcseu.apps.googleusercontent.com';

const nakama: CreateNakamaClientOptions = {
  host: 'dev-mezon.nccsoft.vn',
  port: '7350',
  key: 'defaultkey',
  ssl: false,
};

const theme = 'light';

export function App() {
  const mezon = useMezon();

  const { store, persistor } = useMemo(() => {
    return initStore(mezon, preloadedState);
  }, [mezon])

  if (!store) {
    return <>loading...</>
  }

  return (
    <MezonStoreProvider store={store} loading={null} persistor={persistor} >
      <MezonUiProvider themeName={theme}>
        <RouterProvider router={routes} />
      </MezonUiProvider>
    </MezonStoreProvider>
  );
}

function AppWrapper() {

  useEffect(() => {
    WebFont.load({
      google: {
        families: ['Manrope'],
      },
    });
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <MezonContextProvider nakama={nakama} connect={true}>
        <App />
      </MezonContextProvider>
    </GoogleOAuthProvider>
  );
}

export default AppWrapper;
