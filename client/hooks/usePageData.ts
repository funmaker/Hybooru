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
  const location = useLocation();
  const locationRef = useRef(location.key);
  locationRef.current = location.key;
  const [{ locationKey, pageData }, setPageData] = useState({ locationKey: locationRef.current, pageData: initialData || null });
  const [fetching, setFetching] = useState(false);
  const history = useHistory();
  const fetchEmitter = useRef<FetchEmitter | null>(null);
  
  useEffect(() => {
    return history.listen(() => {
      if(locationRef.current && fetchEmitter.current?.key !== locationRef.current) {
        fetchEmitter.current?.cancel();
        fetchEmitter.current = null;
        setPageData({ locationKey: undefined, pageData: null });
      }
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
    
    setFetching(true);
    let cancelFetch = () => {};
    requestJSON({
      cancelCb: cancel => cancelFetch = cancel,
    }).then(pageData => {
      setPageData({ locationKey: locationRef.current, pageData });
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
        if(this.listeners <= 0) this.cancel();
      },
      cancel: cancelFetch,
      key: locationRef.current,
    };
    fetchEmitter.current.unlisten = fetchEmitter.current.unlisten.bind(fetchEmitter.current);
    
    return fetchEmitter.current.unlisten;
  }, []);
  
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
