import React from 'react';
import { ErrorResponse } from "../../../server/routes/apiTypes";
import "./ErrorPage.scss";

interface Props {
  error: ErrorResponse["error"];
}

export default function ErrorPage({ error }: Props) {
  return (
    <div className="ErrorPage">
      <div className="header">
        <span className="code">{error.code}</span>
        <span className="message">{error.message}</span>
      </div>
      <div className="stack">{error.stack}</div>
    </div>
  );
}
