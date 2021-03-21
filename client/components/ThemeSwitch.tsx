import React, { useCallback } from "react";
import { useLocation } from "react-router";
import useTheme, { Theme } from "../hooks/useTheme";
import useCSRF from "../hooks/useCSRF";
import "./ThemeSwitch.scss";

export default function ThemeSwitch() {
  const [theme, setTheme] = useTheme();
  const location = useLocation();
  const csrf = useCSRF();
  const newTheme = theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
  
  const onClick = useCallback((ev: React.FormEvent) => {
    ev.preventDefault();
    
    setTheme(newTheme);
  }, [newTheme, setTheme]);
  
  return (
    <form className="ThemeSwitch" method="POST" action="/setTheme" onClick={onClick}>
      <input type="hidden" name="_csrf" value={csrf} />
      <input type="hidden" name="redirectUrl" value={location.pathname + location.search} />
      <input type="hidden" name="theme" value={newTheme} />
      <input type="image" src={theme === Theme.DARK ? "/static/bulb_on.svg" :  "/static/bulb_off.svg"} alt="Theme" />
    </form>
  );
}
