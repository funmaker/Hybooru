import { useEffect, useRef } from "react";

interface UseChangeOptions {
  init?: boolean;
}

export default function useChange<T>(value: T, callback: (newValue: T, previousValue: T, init: boolean) => void, options: UseChangeOptions = {}) {
  const valueRef = useRef(value);
  const initRef = useRef(true);
  
  useEffect(() => {
    if(valueRef.current !== value || (options.init && initRef.current)) callback(value, valueRef.current, initRef.current);
    valueRef.current = value;
    initRef.current = false;
  }, [callback, options.init, value]);
}
