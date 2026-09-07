import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { LockPageResponse, ProgressMessage, WebSocketMessage } from "../../../types/api";
import { useResetPostsCache } from "../../hooks/usePostsCache";
import usePageData from "../../hooks/usePageData";
import useConfig from "../../hooks/useConfig";
import Logo from "../../components/Logo";
import Layout from "../../components/Layout";
import "./LockPage.scss";

export default function LockPage() {
  const { pageData } = usePageData<LockPageResponse>();
  const [, setConfig] = useConfig();
  const clearPostsCache = useResetPostsCache();
  const [, navigate] = useLocation();
  const [state, setState] = useState<ProgressMessage | string | null>(null);
  
  useEffect(() => {
    if(!pageData) return;
    if(!pageData.isLocked) return void navigate(pageData.redirect, { replace: true });
    
    const ws = new WebSocket(window.location.origin.replace(/^http/, 'ws') + "/api/progress");
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
            clearPostsCache();
            navigate(pageData.redirect, { replace: true });
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
  }, [navigate, pageData, clearPostsCache, setConfig]);
  
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
    </>; // eslint-disable-line @stylistic/jsx-closing-tag-location
  } else {
    content = <>
      <span>{state}</span>
      
      <a href={pageData?.redirect}>Go Back</a>
    </>; // eslint-disable-line @stylistic/jsx-closing-tag-location
  }
  
  return (
    <Layout className="LockPage" plain>
      <Logo />
      
      {pageData && <h4>{pageData.lockName ?? "Doing something"}</h4>}
      
      {content}
    </Layout>
  );
}
