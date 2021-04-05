import { useState, useEffect } from 'react';
import ResizeObserver from 'resize-observer-polyfill';

export default function useMeasure() {
  const [rect, setRect] = useState<DOMRectReadOnly | null>(null);
  const [node, setNode] = useState<Element | null>(null);
  
  useEffect(() => {
    if(!node) return;
    
    const observer = new ResizeObserver(([entry]: ResizeObserverEntry[]) => setRect(entry.contentRect as DOMRectReadOnly));
    observer.observe(node);
    setRect(node.getBoundingClientRect());
    
    return () => {
      observer.disconnect();
    };
  }, [node]);
  
  return { ref: setNode, rect };
}
