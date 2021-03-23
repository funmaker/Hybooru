import React, { ContextType, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router";
import { Canceler } from "axios";
import requestJSON from "../helpers/requestJSON";

type UnlistenCallback = () => void;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const PageDataContext = React.createContext({
  pageData: null as any,
  locationKey: undefined as string | undefined,
  fetch: (): UnlistenCallback => { throw new Error("Not Initialized"); },
});

interface FetchEmitter {
  listeners: number;
  unlisten: UnlistenCallback;
  cancel: Canceler;
}

export function usePageDataInit(initialData: any): ContextType<typeof PageDataContext> {
  if(initialData._error) initialData = null;
  const locationRef = useRef(useLocation().key);
  locationRef.current = useLocation().key;
  const [{ locationKey, pageData }, setPageData] = useState({ locationKey: locationRef.current, pageData: initialData || null });
  const history = useHistory();
  const fetchEmitter = useRef<FetchEmitter | null>(null);
  
  useEffect(() => {
    return history.listen(() => {
      fetchEmitter.current?.cancel();
      fetchEmitter.current = null;
      setPageData({ locationKey: undefined, pageData: null });
    });
  }, [history]);
  
  useEffect(() => {
    if(typeof pageData?._title === "string") {
      document.title = pageData._title;
    }
  }, [pageData]);
  
  const fetch = useCallback(() => {
    if(fetchEmitter.current) {
      fetchEmitter.current.listeners++;
      return fetchEmitter.current.unlisten;
    }
    
    let cancelFetch = () => {};
    requestJSON({
      cancelCb: cancel => cancelFetch = cancel,
    }).then(pageData => {
      setPageData({ locationKey: locationRef.current, pageData });
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
  
  return useMemo(() => ({ pageData, locationKey, fetch }), [pageData, locationKey, fetch]);
}

export default function usePageData<T>(auto = true): [T | null, boolean, () => void] {
  const currentKey = useLocation().key;
  const { pageData, fetch, locationKey } = useContext(PageDataContext);
  
  const loaded = pageData !== null;
  
  useEffect(() => {
    if(loaded || !auto || currentKey === locationKey) return;
    else return fetch();
  }, [fetch, auto, loaded, currentKey, locationKey]);
  
  if(currentKey !== locationKey) {
    return [null, true, fetch];
  } else {
    return [pageData, !loaded, fetch];
  }
}
