import React, { SetStateAction, useContext, useEffect, useState } from "react";
import { Config } from "../../server/routes/apiTypes";

type SetConfig = (config: SetStateAction<Config>) => void;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConfigContext = React.createContext<[Config, SetConfig]>(null as any);

interface ConfigContextProviderProps {
  config: Config;
  children: React.ReactNode;
}

export function ConfigContextProvider({ config: initialConfig, children }: ConfigContextProviderProps) {
  const [config, setConfig] = useState(initialConfig);
  
  return <ConfigContext.Provider value={[config, setConfig]}>{children}</ConfigContext.Provider>;
}

export default function useConfig() {
  return useContext(ConfigContext);
}

