import React, { useCallback } from "react";
import useLocationParts from "../hooks/useLocationParts";
import useTheme, { Theme } from "../hooks/useTheme";
import "./ThemeSwitch.scss";

export default function ThemeSwitch() {
  const [, setTheme] = useTheme();
  const [location] = useLocationParts();
  
  const onClick = useCallback((ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    
    setTheme(ev.currentTarget.theme.value);
  }, [setTheme]);
  
  return <>
    <form className="ThemeSwitch light" method="POST" action="/setTheme" onClick={onClick}>
      <input type="hidden" name="redirectUrl" value={location.href} />
      <input type="hidden" name="theme" value={Theme.DARK} />
      <input type="image" src="/static/bulb_off.svg" alt="Theme" />
    </form>
    <form className="ThemeSwitch dark" method="POST" action="/setTheme" onClick={onClick}>
      <input type="hidden" name="redirectUrl" value={location.href} />
      <input type="hidden" name="theme" value={Theme.LIGHT} />
      <input type="image" src="/static/bulb_on.svg" alt="Theme" />
    </form>
  </>; // eslint-disable-line @stylistic/jsx-closing-tag-location
}
