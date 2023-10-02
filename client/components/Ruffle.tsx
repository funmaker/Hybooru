import React, { useEffect, useRef } from "react";
import "./Ruffle.scss";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RufflePlayer: any;
  }
}

export interface RuffleProps {
  url: string;
  width?: number;
  height?: number;
}

export default function Ruffle({ url, width, height }: RuffleProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = ref.current;
    if(!container) return;
    
    let canceled = false;
    let player: any = null;
    
    (async () => {
      window.RufflePlayer = window.RufflePlayer || {};
      window.RufflePlayer.config = {
        publicPath: "/static/ruffle",
        polyfills: false,
      };
      
      // @ts-ignore
      await import("@ruffle-rs/ruffle");
      if(canceled) return;
      
      const ruffle = window.RufflePlayer.newest();
      player = ruffle.createPlayer();
      container.replaceChildren(player);
      player.load(url);
      
      player.style.width = width + "px";
      player.style.height = height + "px";
      player.style.maxWidth = "100%";
      player.style.maxHeight = "100%";
      
      player.addEventListener('loadedmetadata', () => {
        if(canceled) return;
        player.style.width = player.metadata.width + "px";
        player.style.height = player.metadata.height + "px";
      });
    })();
    
    return () => {
      canceled = true;
      if(player) player.remove();
    };
  }, [url, height, width]);
  
  return <div className="Ruffle" ref={ref} />;
}
