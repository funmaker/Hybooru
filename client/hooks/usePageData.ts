import React, { ContextType, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router";
import { Canceler } from "axios";
import requestJSON from "../helpers/requestJSON";

type UnlistenCallback = () => void;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const PageDataContext = React.createContext({
  pageData: null as any,
  locationKey: null as any as string | undefined,
  fetch: (): UnlistenCallback => { throw new Error("Not Initialized"); },
});

interface FetchEmitter {
  listeners: number;
  unlisten: UnlistenCallback;
  cancel: Canceler;
}

export function usePageDataInit(initialData: any): ContextType<typeof PageDataContext> {
  if(initialData._error) initialData = null;
  const locationRef = useRef<string>();
  locationRef.current = useLocation().key;
  const [[pageDataKey, pageData], setPageData] = useState([locationRef.current, initialData || null]);
  const history = useHistory();
  const fetchEmitter = useRef<FetchEmitter | null>(null);
  
  useEffect(() => {
    return history.listen(() => {
      fetchEmitter.current?.cancel();
      fetchEmitter.current = null;
      setPageData([undefined, null]);
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
      setPageData([locationRef.current, data]);
    }).catch(error => {
      console.error("Unable to fetch page data: ", error);
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
  
  return useMemo(() => ({ pageData, locationKey: pageDataKey, fetch }), [pageData, pageDataKey, fetch]);
}

export default function usePageData<T>(auto = true): [T | null, boolean] {
  const currentKey = useLocation().key;
  const { pageData, fetch, locationKey } = useContext(PageDataContext);
  
  const loaded = pageData !== null;
  
  useEffect(() => {
    if(loaded || !auto) return;
    else return fetch();
  }, [fetch, auto, loaded]);
  
  if(currentKey !== locationKey) {
    return [null, true];
  } else {
    return [pageData, !loaded];
  }
}
