import React, { useCallback, useContext, useEffect, useState } from "react";

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

type ThemeContextType = [Theme, (t: Theme) => void];

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ThemeContext = React.createContext<ThemeContextType>([Theme.LIGHT, () => {}]);

export default function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  init?: Theme;
  children?: React.ReactNode;
}

export function ThemeProvider({ init = Theme.LIGHT, children }: ThemeProviderProps) {
  const [theme, setTheme] = useState(init);
  
  const onThemeChange = useCallback(async (newTheme: Theme) => {
    document.documentElement.className = newTheme;
    setTheme(newTheme);
  }, []);
  
  // Refreshes the cookie
  useEffect(() => {
    setCookie("theme", theme);
  }, [theme]);
  
  return <ThemeContext.Provider value={[theme, onThemeChange]}>{children}</ThemeContext.Provider>;
}


function setCookie(name: string, value: string) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
}
