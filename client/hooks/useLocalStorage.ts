import { useState, useEffect, useCallback } from "react";
import useSSR from "./useSSR";

function parseVal<T>(val: string | null): T | undefined;
function parseVal<T>(val: string | null, def: T): T;
function parseVal<T>(val: string | null, def?: T) {
  if(typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch(e) {
      console.error(e);
    }
  }
  return def;
}

const lsListeners = new Set<(key: string, value: any) => void>();

export default function useLocalStorage<T>(name: string, defValue: T): [T, (value: T) => void] {
  const SSR = useSSR();
  const [value, setValue] = useState(SSR ? defValue : parseVal(localStorage.getItem(name), defValue));
  
  const changeValue = useCallback(newValue => {
    if(newValue === undefined) localStorage.removeItem(name);
    else localStorage.setItem(name, JSON.stringify(newValue));
    
    lsListeners.forEach(listener => listener(name, newValue));
    
    setValue(newValue);
  }, [name]);
  
  useEffect(() => {
    const onChange = (newName: string, newValue: any) => {
      if(newName === name) {
        setValue(newValue);
      }
    };
    
    lsListeners.add(onChange);
    return () => void lsListeners.delete(onChange);
  }, [defValue, name]);
  
  useEffect(() => {
    const stored = parseVal<T>(localStorage.getItem(name));
    
    if(stored !== undefined && stored !== value) {
      setValue(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return [value, changeValue];
}
