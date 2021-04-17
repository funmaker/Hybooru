import React, { useCallback, useContext, useEffect, useState } from "react";

export enum Theme {
  AUTO = "auto",
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
    document.documentElement.classList.remove(...Object.values(Theme));
    document.documentElement.classList.add(newTheme);
    setCookie("theme", newTheme);
    setTheme(newTheme);
  }, []);
  
  // Refresh the cookie
  useEffect(() => {
    const inCookie = getCookie("theme");
    if(inCookie) {
      setCookie("theme", inCookie);
    }
  }, []);
  
  return <ThemeContext.Provider value={[theme, onThemeChange]}>{children}</ThemeContext.Provider>;
}


function setCookie(name: string, value: string) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if(parts.length === 2) return parts.pop()!.split(';').shift();
  else return "";
}
