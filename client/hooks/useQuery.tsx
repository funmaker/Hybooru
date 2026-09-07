import React, { useCallback, useMemo } from "react";
import { qsParse, qsStringify } from "../helpers/utils";
import useLocationParts from "./useLocationParts";

export default function useQuery() {
  const [location, navigate] = useLocationParts();
  
  const { search, query, parts } = useMemo(() => {
    const search = qsParse(location.search);
    const query = typeof search.query === "string" ? search.query : "";
    const parts = query.split(" ").filter(p => !!p);
    return { search, query, parts };
  }, [location.search]);
  
  const getUrl = useCallback((update: React.SetStateAction<string>, pathname?: string) => {
    pathname = pathname ?? location.pathname;
    
    let newQuery;
    if(typeof update === "function") newQuery = update(query);
    else newQuery = update;
    
    if(newQuery) return `${pathname}${qsStringify({ query: newQuery })}`;
    else return pathname;
  }, [location.pathname, query]);
  
  const setQuery = useCallback((update: React.SetStateAction<string>) => {
    navigate(getUrl(update));
  }, [getUrl, navigate]);
  
  return {
    location,
    search,
    query,
    parts,
    getUrl,
    setQuery,
  };
}
