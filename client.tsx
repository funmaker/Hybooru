import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { AppContainer } from "react-hot-loader";
import App from "./client/App";
import 'semantic-ui-less/semantic.less';

const initialData = JSON.parse(document?.getElementById('initialData')?.innerHTML || "{}");

ReactDOM.hydrate(
  <AppContainer>
    <BrowserRouter>
      <App initialData={initialData} />
    </BrowserRouter>
  </AppContainer>
  , document.getElementById('root'));
