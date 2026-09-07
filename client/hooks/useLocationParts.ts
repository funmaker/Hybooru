import { useLocation, useSearch } from "wouter";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface LocationParts {
  pathname: string;
  search: string;
  hash: string;
  href: string;
}

export type LocationLevel = "none" | "pathname" | "search" | "hash" | "all";

export interface NavigateOptions<S> {
  replace?: boolean;
  state?: S;
  transition?: boolean;
}

export default function useLocationParts<State = any>() {
  const [pathname, navigate] = useLocation();
  const search = useSearch();
  const [hash, setHash] = useState("");
  
  let href = pathname;
  if(search) href += `?${search}`;
  if(hash) href += `#${hash}`;
  
  const parts = useMemo<LocationParts>(() => ({ pathname, search, hash, href }), [pathname, search, hash, href]);
  
  const navigateParts = useCallback((location: string | Partial<LocationParts>, options?: NavigateOptions<State>) => {
    if(typeof location === "string") navigate(location, options);
    else {
      if(!location.pathname) throw new Error("You need to specify a pathname");
      if(location.search?.startsWith("?")) location.search = location.search.slice(1);
      if(location.hash?.startsWith("#")) location.hash = location.hash.slice(1);
      
      let href = location.pathname;
      if(location.search) href += `?${location.search}`;
      if(location.hash) href += `#${location.hash}`;
      
      navigate(href, options);
      setHash(location.hash || "");
    }
  }, [navigate]);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHash(trimHash(location.hash));
    
    const onHashChange = () => setHash(trimHash(location.hash));
    
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  
  return [parts, navigateParts] as const;
}

export function locationCmp(a: LocationParts, b: LocationParts, level: LocationLevel = "search") {
  switch(level) {
    case "none": return true;
    case "pathname": return a.pathname === b.pathname;
    case "search": return a.pathname === b.pathname && a.search === b.search;
    case "hash": case "all": return a.pathname === b.pathname && a.search === b.search && a.hash === b.hash;
  }
}

const trimHash = (hash: string) => hash.startsWith("#") ? hash.slice(1) : hash;
