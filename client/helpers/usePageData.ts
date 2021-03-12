import React, { ContextType, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useHistory } from "react-router";
import { Canceler } from "axios";
import requestJSON from "./requestJSON";

type UnlistenCallback = () => void;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const PageDataContext = React.createContext({
  pageData: null as any,
  fetch: (): UnlistenCallback => { throw new Error("Not Initialized"); },
});

interface FetchEmitter {
  listeners: number;
  unlisten: UnlistenCallback;
  cancel: Canceler;
}

export function usePageDataInit(initialData: any): ContextType<typeof PageDataContext> {
  const [pageData, setPageData] = useState(initialData || null);
  const history = useHistory();
  const fetchEmitter = useRef<FetchEmitter | null>(null);
  
  useEffect(() => {
    return history.listen(() => {
      fetchEmitter.current?.cancel();
      fetchEmitter.current = null;
      setPageData(null);
    });
  }, [history]);
  
  const fetch = useCallback(() => {
    if(fetchEmitter.current) {
      fetchEmitter.current.listeners++;
      return fetchEmitter.current.unlisten;
    }
    
    let cancelFetch = () => {};
    requestJSON({
      cancelCb: cancel => cancelFetch = cancel,
    }).then(data => {
      setPageData(data);
    }).catch(error => {
      setPageData({ error });
    }).finally(() => {
      fetchEmitter.current = null;
    });
    
    fetchEmitter.current = {
      listeners: 1,
      unlisten() {
        this.listeners--;
        if(this.listeners <= 0) this.cancel();
      },
      cancel: cancelFetch,
    };
    fetchEmitter.current.unlisten = fetchEmitter.current.unlisten.bind(fetchEmitter.current);
    
    return fetchEmitter.current.unlisten;
  }, []);
  
  return useMemo(() => ({ pageData, fetch }), [pageData, fetch]);
}

export default function usePageData<T>(): [T | null, boolean] {
  const { pageData, fetch } = useContext(PageDataContext);
  
  const loaded = pageData !== null;
  
  useEffect(() => {
    if(loaded) return;
    else return fetch();
  }, [fetch, loaded]);
  
  return [pageData, !loaded];
}

