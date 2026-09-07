import React, { useContext, useEffect, useState } from "react";

export const SSRContext = React.createContext(true);

export default function useSSR() {
  return useContext(SSRContext);
}

export function SSRProvider({ children }: { children: React.ReactNode }) {
  const [SSR, setSSR] = useState(true);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSSR(false);
  }, []);
  
  return <SSRContext.Provider value={SSR}>{children}</SSRContext.Provider>;
}

