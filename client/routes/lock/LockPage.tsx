import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { LockPageData, ProgressMessage, WebSocketMessage } from "../../../server/routes/apiTypes";
import usePageData from "../../hooks/usePageData";
import useConfig from "../../hooks/useConfig";
import Logo from "../../components/Logo";
import Layout from "../../components/Layout";
import "./LockPage.scss";

export default function LockPage() {
  const { pageData } = usePageData<LockPageData>();
  const [, setConfig] = useConfig();
  const history = useHistory();
  const [state, setState] = useState<ProgressMessage | string | null>({
    name: "Test",
    target: 2134,
    value: 1000,
  });
  
  useEffect(() => {
    if(!pageData) return;
    if(!pageData.isLocked) return void history.replace(pageData.redirect);
    
    const ws = new WebSocket(window.location.origin.replace(/^http/, 'ws') + "/api/progress");
    setState("Connecting WebSocket");
    
    ws.addEventListener("open", () => setState("Waiting for messages"));
    ws.addEventListener("close", () => setState("WebSocket closed unexpectedly"));
    ws.addEventListener("message", ev => {
      try {
        const message: WebSocketMessage = JSON.parse(ev.data);
        
        switch(message.type) {
          case "progress":
            setState(message.data);
            break;
          
          case "end":
            setConfig(message.data);
            history.replace(pageData.redirect);
            break;
        }
      } catch(err) {
        console.error(err);
        setState("Can't parse message");
      }
    });
    
    return () => {
      ws.close();
    };
  }, [history, pageData, setConfig]);
  
  let content;
  
  if(state && typeof state === "object") {
    content = <>
      <div className="progressWrap">
        <div className="info">
          <span className="name">{state.name}</span>
          {state.target > 1 && <span className="progress">{state.value} / {state.target}</span>}
        </div>
        <div className="bar">
          <div className="fill" style={{ width: (state.value / state.target) * 100 + "%" }}></div>
        </div>
      </div>
    </>; // eslint-disable-line react/jsx-closing-tag-location
  } else {
    content = <>
      <span>{state}</span>
      
      <a href={pageData?.redirect}>Go Back</a>
    </>; // eslint-disable-line react/jsx-closing-tag-location
  }
  
  return (
    <Layout className="LockPage" plain>
      <Logo />
      
      {pageData && <h4>{pageData.lockName ?? "Doing something"}</h4>}
      
      {content}
    </Layout>
  );
}
