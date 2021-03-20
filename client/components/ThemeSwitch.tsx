import React, { useCallback } from "react";
import { useLocation } from "react-router";
import useTheme, { Theme } from "../hooks/useTheme";
import "./ThemeSwitch.scss";

export default function ThemeSwitch() {
  const [theme, setTheme] = useTheme();
  const location = useLocation();
  const newTheme = theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
  
  const onClick = useCallback((ev: React.FormEvent) => {
    ev.preventDefault();
    
    setTheme(newTheme);
  }, [newTheme, setTheme]);
  
  const noJSLink = `/setTheme/${newTheme}?redirectUrl=${encodeURIComponent(location.pathname + "?" + location.search)}`;
  
  return (
    <form className="ThemeSwitch" onSubmit={onClick} method="POST" action={noJSLink}>
      <input type="image" src={theme === Theme.DARK ? "/static/bulb_on.svg" :  "/static/bulb_off.svg"} alt="Theme" />
    </form>
  );
}
