import React, { useCallback, useContext, useMemo, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router";
import qs from "query-string";
import useChange from "./useChange";

type SetState = (newState: string | ((state: string) => string), silent?: boolean) => void;
type GenLink = (newState: string | ((state: string) => string)) => string;
type QueryContextData = [string, SetState, GenLink];

// eslint-disable-next-line @typescript-eslint/naming-convention
export const RTQueryContext = React.createContext<QueryContextData>(["", () => {}, () => ""]);
export const URLQueryContext = React.createContext<QueryContextData>(["", () => {}, () => ""]);

export default function useQuery() {
  return useContext(URLQueryContext);
}

export function useRTQuery() {
  return useContext(RTQueryContext);
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const history = useHistory();
  const search = qs.parse(useLocation().search);
  const urlQuery = typeof search.query === "string" ? search.query : "";
  const [query, setQuery] = useState(urlQuery);
  const queryRef = useRef(query);
  queryRef.current = query;
  
  useChange(urlQuery, newQuery => {
    if(newQuery !== query) setQuery(newQuery);
  });
  
  const genLink = useCallback<GenLink>(update => {
    let newVal = "";
    if(typeof update === "function") newVal = update(queryRef.current);
    else newVal = update;
    
    const search = qs.parse(history.location.search);
    search.query = newVal;
    if(!search.query) delete search.query;
    const searchEncoded = qs.stringify(search);
    
    return `${history.location.pathname}${searchEncoded ? `?${searchEncoded}` : ""}${history.location.hash}`;
  }, [history]);
  
  const onQueryChange = useCallback<SetState>((update, silent) => {
    if(silent) {
      setQuery(update);
    } else {
      const link = genLink(update);
      history.push(link);
    }
  }, [history, genLink]);
  
  const rtState = useMemo<QueryContextData>(() => [query, onQueryChange, genLink], [query, onQueryChange, genLink]);
  const urlState = useMemo<QueryContextData>(() => [urlQuery, onQueryChange, genLink], [urlQuery, onQueryChange, genLink]);
  
  return (
    <RTQueryContext.Provider value={rtState}>
      <URLQueryContext.Provider value={urlState}>
        {children}
      </URLQueryContext.Provider>
    </RTQueryContext.Provider>
  );
}

