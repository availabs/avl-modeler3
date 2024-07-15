import React from 'react';
import ReactDOM from 'react-dom/client';

import { Provider } from 'react-redux';
import { authProvider } from "./modules/ams/src"

import store from './store';

import {
  FalcorProvider,
  falcorGraph
} from "./modules/avl-falcor"

import {
  ThemeContext
} from "./modules/avl-components/src"

import AVL_THEME from "./layout/avail-theme"

// import { enableAuth } from "./modules/ams/src"

import {
  API_HOST,
  AUTH_HOST,
  PROJECT_NAME,
  CLIENT_HOST
} from './config'

import App from './App';
import './index.css';

window.global ||= window;

export const falcor = falcorGraph(API_HOST)
// const AuthEnabledApp = enableAuth(App, { AUTH_HOST, PROJECT_NAME, CLIENT_HOST });

const AuthEnabledApp = authProvider(App, { AUTH_HOST, PROJECT_NAME, CLIENT_HOST });

// ReactDOM.createRoot(document.getElementById('root')).render(
//     <React.StrictMode>
      
//       <Provider store={ store }>
//         <FalcorProvider falcor={falcor}>
//           <ThemeContext.Provider value={AVL_THEME}>
//             <AuthEnabledApp />
//           </ThemeContext.Provider>
//         </FalcorProvider>
//       </Provider>
//     </React.StrictMode>
// );

ReactDOM.createRoot(document.getElementById('root'))
  .render(
    <React.StrictMode>
       <FalcorProvider falcor={falcor}>
      <AuthEnabledApp />
      </FalcorProvider>
    </React.StrictMode>,
  )

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

//reportWebVitals();