import { useEffect, useRef } from "react";

export default function useChange<T>(val: T, callback: (newVal: T, prevVal: T) => void) {
  const valRef = useRef(val);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  useEffect(() => {
    if(valRef.current !== val) {
      callbackRef.current(val, valRef.current);
      valRef.current = val;
    }
  }, [val]);
}
