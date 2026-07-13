import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router";
import axios, { Canceler } from "axios";
import ClientError from "../helpers/clientError";
import requestJSON from "../helpers/requestJSON";
import { InitialData } from "../../server/routes/apiTypes";
import { qsStringify } from "../helpers/utils";

type UnlistenCallback = () => void;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const PageDataContext = React.createContext({
  pageData: null as any,
  pageError: null as ClientError | null,
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

interface PageDataProviderProps {
  initialData: InitialData;
  children: React.ReactNode;
}

export function PageDataProvider({ initialData, children }: PageDataProviderProps) {
  const history = useHistory();
  const [fetching, setFetching] = useState(false);
  const fetchEmitter = useRef<FetchEmitter | null>(null);
  const titleCache = useRef<Record<string, string>>({});
  
  const [state, setState] = useState({
    locationKey: history.location.key,
    pageData: initialData._error ? null : initialData,
    pageError: initialData._error ? new ClientError(initialData._error) : null,
  });
  
  useEffect(() => {
    titleCache.current[history.location.pathname] = document.title;
    
    return history.listen(location => {
      if(fetchEmitter.current?.key && fetchEmitter.current.key !== location.key) {
        fetchEmitter.current?.cancel("Route Change");
        fetchEmitter.current = null;
        setState(state => (state.locationKey || state.pageData) ? { locationKey: undefined, pageData: null, pageError: null } : state);
      }
      
      if(titleCache.current[history.location.pathname]) document.title = titleCache.current[history.location.pathname];
    });
  }, [history]);
  
  useEffect(() => {
    if(typeof state.pageData?._title === "string") {
      document.title = titleCache.current[history.location.pathname] = state.pageData._title;
    }
  }, [history, state.pageData]);
  
  const fetch = useCallback(() => {
    if(fetchEmitter.current) {
      fetchEmitter.current.listeners++;
      return fetchEmitter.current.unlisten;
    }
    
    setFetching(true);
    let cancelFetch = (reason?: string) => {};
    requestJSON<any>({
      cancelCb: cancel => cancelFetch = cancel,
    }).then(pageData => {
      setState({ locationKey: history.location.key, pageData, pageError: null });
    }).catch(error => {
      if(!error.isCancel) setState({ locationKey: history.location.key, pageData: null, pageError: error });
    }).finally(() => {
      fetchEmitter.current = null;
      setFetching(false);
    });
    
    const self = fetchEmitter.current = {
      listeners: 1,
      unlisten() {
        self.listeners--;
        if(self.listeners <= 0) self.cancel("Orphan");
      },
      cancel: cancelFetch,
      key: history.location.key,
    };
    
    return fetchEmitter.current.unlisten;
  }, [history]);
  
  const contextValue = useMemo(() => ({ ...state, fetch, fetching }), [state, fetch, fetching]);
  
  return <PageDataContext.Provider value={contextValue}>{children}</PageDataContext.Provider>;
}

export default function usePageData<T>(auto = true, cache = true) {
  const currentKey = useLocation().key;
  const { pageData, pageError, fetch, locationKey, fetching } = useContext(PageDataContext);
  const cached = useRef(false);
  
  if(locationKey === currentKey && cache) cached.current = true;
  
  useEffect(() => {
    if(!auto || currentKey === locationKey) return;
    else return fetch();
  }, [fetch, auto, currentKey, locationKey]);
  
  
  return {
    pageData: (currentKey !== locationKey && !cached.current) ? null : pageData as T,
    pageError: (currentKey !== locationKey) ? null : pageError,
    fetching,
    refresh: fetch,
  };
}
