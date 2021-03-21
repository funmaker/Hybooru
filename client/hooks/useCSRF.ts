import React, { useContext } from "react";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const CSRFContext = React.createContext("");

export default function useCSRF() {
  return useContext(CSRFContext);
}

