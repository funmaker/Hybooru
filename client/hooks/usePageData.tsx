import React, { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios, { Canceler } from "axios";
import { Config, InitialData } from "../../types/api";
import ClientError from "../helpers/clientError";
import requestJSON from "../helpers/requestJSON";
import useLocationParts, { locationCmp, LocationLevel, LocationParts } from "./useLocationParts";


interface PageDataState {
  location: LocationParts | null;
  pageData: any;
  pageError: ClientError | null;
  config: Config;
  fetching: LocationParts | null;
}

type UnlistenCallback = () => void;
type UnlistenablePromise<T> = Promise<T> & { unlisten: UnlistenCallback };
type FetchFn = (location: LocationParts) => UnlistenablePromise<any>;

export interface PageDataContextState extends PageDataState {
  fetch: FetchFn;
}

export const PageDataContext = React.createContext<PageDataContextState | null>(null);

interface FetchRef {
  location: LocationParts;
  promise: UnlistenablePromise<any> | null;
  cancel: Canceler;
  listeners: number;
}

interface PageDataProviderProps {
  initialData: InitialData;
  children: React.ReactNode;
}

export function PageDataProvider({ initialData, children }: PageDataProviderProps) {
  const fetchRef = useRef<FetchRef | null>(null);
  const [location] = useLocationParts();
  const [state, setState] = useState<PageDataState>(() => ({
    location,
    pageData: initialData?._error ? null : initialData,
    pageError: initialData?._error ? new ClientError(initialData._error) : null,
    config: initialData._config,
    fetching: null,
  }));
  
  const fetch = useCallback<FetchFn>(location => {
    if(fetchRef.current) {
      if(locationCmp(fetchRef.current.location, location)) {
        fetchRef.current.listeners++;
        if(!fetchRef.current.promise) throw new Error("Invalid page data state. Missing promise!");
        else return fetchRef.current.promise;
      } else {
        fetchRef.current.cancel();
      }
    }
    
    const thisRef: FetchRef = fetchRef.current = {
      location,
      promise: null,
      cancel: () => {},
      listeners: 1,
    };
    
    const promise = requestJSON<any>({
      waitFix: true,
      cancelCb: cancel => thisRef.cancel = cancel,
    }).then(data => {
      setState(state => ({ ...state, location, fetching: null, pageData: data, pageError: null }));
    }).catch(err => {
      if(!axios.isCancel(err)) setState(state => ({ ...state, location, fetching: null, pageData: null, pageError: new ClientError(err) }));
    }).finally(() => {
      if(fetchRef.current === thisRef) fetchRef.current = null;
    });
    
    thisRef.promise = Object.assign(promise, {
      unlisten: () => {
        thisRef.listeners--;
        if(thisRef.listeners <= 0) thisRef.cancel();
      },
    });
    
    setState(state => ({ ...state, fetching: location }));
    
    return thisRef.promise;
  }, []);
  
  const value = useMemo<PageDataContextState>(() => ({ ...state, fetch }), [state, fetch]);
  
  return (
    <PageDataContext.Provider value={value}>
      {children}
    </PageDataContext.Provider>
  );
}

export default function usePageData<T>(autoFetch = true, level: LocationLevel = "search") {
  const [location] = useLocationParts();
  const context = use(PageDataContext);
  if(!context) throw new Error("useConfig must be used within PageData context");
  
  const validLocation = !!context.location && locationCmp(location, context.location, level);
  const willFetch = autoFetch && !validLocation;
  const fetch = context.fetch;
  const refresh = () => fetch(location) as UnlistenablePromise<T>;
  
  useEffect(() => {
    if(willFetch) return fetch(location).unlisten;
    return;
  }, [fetch, location, willFetch]);
  
  return {
    pageData: validLocation && context.pageData ? context.pageData as T : null,
    pageError: validLocation && context.pageError ? context.pageError : null,
    fetching: willFetch || context.fetching && locationCmp(location, context.fetching) || false,
    refresh,
  };
}

export function useConfig(): Config {
  const context = use(PageDataContext);
  if(!context) throw new Error("useConfig must be used within PageData context");
  
  return context.config;
}
