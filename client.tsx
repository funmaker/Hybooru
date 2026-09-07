import "core-js/stable";
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from "./client/App";
import 'react-toastify/dist/ReactToastify.css';

const initialData = JSON.parse(document?.getElementById('initialData')?.innerText || "{}");
let root = document.getElementById('root');

if(!root) {
  console.warn('React root not found, creating div#root in body');
  root = document.body.appendChild(document.createElement('div'));
  root.id = 'root';
}

ReactDOM.hydrateRoot(
  root,
  <StrictMode>
    <App initialData={initialData} />
  </StrictMode>,
);
