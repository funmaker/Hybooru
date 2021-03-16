import React, { useContext, useEffect, useState } from "react";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SSRContext = React.createContext(true);

export default function useSSR() {
  return useContext(SSRContext);
}

export function SSRProvider({ children }: { children: React.ReactNode }) {
  const [SSR, setSSR] = useState(true);
  
  useEffect(() => {
    setSSR(false);
  }, []);
  
  return <SSRContext.Provider value={SSR}>{children}</SSRContext.Provider>;
}

