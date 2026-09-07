import React, { SetStateAction, useContext, useState } from "react";
import { Config } from "../../types/api";

type SetConfig = (config: SetStateAction<Config>) => void;

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

