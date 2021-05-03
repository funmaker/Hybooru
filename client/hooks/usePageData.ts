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
  fetching: false,
});

interface FetchEmitter {
  listeners: number;
  unlisten: UnlistenCallback;
  cancel: Canceler;
  key: string | undefined;
}

export function usePageDataInit(initialData: any): ContextType<typeof PageDataContext> {
  if(initialData._error) initialData = null;
  const history = useHistory();
  const [{ locationKey, pageData }, setPageData] = useState({ locationKey: history.location.key, pageData: initialData || null });
  const [fetching, setFetching] = useState(false);
  const fetchEmitter = useRef<FetchEmitter | null>(null);
  const titleCache = useRef<Record<string, string>>({});
  
  useEffect(() => {
    return history.listen(location => {
      if(fetchEmitter.current?.key && fetchEmitter.current.key !== location.key) {
        fetchEmitter.current?.cancel("Route Change");
        fetchEmitter.current = null;
        setPageData(state => (state.locationKey || state.pageData) ? { locationKey: undefined, pageData: null } : state);
      }
      
      if(titleCache.current[history.location.pathname]) document.title = titleCache.current[history.location.pathname];
    });
  }, [history]);
  
  useEffect(() => {
    if(typeof pageData?._title === "string") {
      document.title = titleCache.current[history.location.pathname] = pageData._title;
    }
  }, [history, pageData]);
  
  const fetch = useCallback(() => {
    if(fetchEmitter.current) {
      fetchEmitter.current.listeners++;
      return fetchEmitter.current.unlisten;
    }
    
    setFetching(true);
    let cancelFetch = () => {};
    requestJSON({
      cancelCb: cancel => cancelFetch = cancel,
    }).then(pageData => {
      setPageData({ locationKey: history.location.key, pageData });
    }).catch(error => {
      console.error("Unable to fetch page data: ", error);
    }).finally(() => {
      fetchEmitter.current = null;
      setFetching(false);
    });
    
    fetchEmitter.current = {
      listeners: 1,
      unlisten() {
        this.listeners--;
        if(this.listeners <= 0) this.cancel("Orphan");
      },
      cancel: cancelFetch,
      key: history.location.key,
    };
    fetchEmitter.current.unlisten = fetchEmitter.current.unlisten.bind(fetchEmitter.current);
    
    return fetchEmitter.current.unlisten;
  }, [history]);
  
  return useMemo(() => ({ pageData, locationKey, fetch, fetching }), [pageData, locationKey, fetch, fetching]);
}

export default function usePageData<T>(auto = true): [T | null, boolean, () => UnlistenCallback] {
  const currentKey = useLocation().key;
  const { pageData, fetch, locationKey, fetching } = useContext(PageDataContext);
  
  useEffect(() => {
    if(!auto || currentKey === locationKey) return;
    else return fetch();
  }, [fetch, auto, currentKey, locationKey]);
  
  if(currentKey !== locationKey) {
    return [null, fetching, fetch];
  } else {
    return [pageData, fetching, fetch];
  }
}
