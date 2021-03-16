import React, { useContext } from "react";
import { Config } from "../../server/routes/apiTypes";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConfigContext = React.createContext<Config>(null as any);

export default function useConfig() {
  return useContext(ConfigContext);
}

