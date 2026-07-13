import "core-js/stable";
import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from 'react-router-dom';
import { AppContainer } from "react-hot-loader";
import App from "./client/App";
import history from "./client/helpers/history";
import 'react-toastify/dist/ReactToastify.css';

const initialData = JSON.parse(document?.getElementById('initialData')?.innerHTML || "{}"); // TODO: Inner text?

ReactDOM.hydrate(
  <AppContainer>
    <Router history={history}>
      <App initialData={initialData} />
    </Router>
  </AppContainer>
  , document.getElementById('root'));
