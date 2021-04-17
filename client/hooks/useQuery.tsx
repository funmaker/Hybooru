import React, { useContext } from "react";
import { useLocation } from "react-router";
import qs from "query-string";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const QueryContext = React.createContext("");

export default function useQuery() {
  return useContext(QueryContext);
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const search = qs.parse(useLocation().search);
  const query = typeof search.query === "string" ? search.query : "";
  
  return <QueryContext.Provider value={query}>{children}</QueryContext.Provider>;
}

