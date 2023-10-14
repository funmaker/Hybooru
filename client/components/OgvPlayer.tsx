import React, { useEffect, useRef } from "react";

export interface OgvPlayerProps {
  src: string;
  width?: number;
  height?: number;
  controls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
}

export default function OgvPlayer({ src, width, height, muted }: OgvPlayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = ref.current;
    if(!container) return;
    
    let canceled = false;
    let player: any = null;
    
    (async () => {
      // @ts-ignore
      const ogv = await import("ogv");
      if(canceled) return;
      ogv.OGVLoader.base = '/static/ogv';
      player = new ogv.OGVPlayer();
      container.replaceChildren(player);
      player.src = src;
      player.muted = muted;
      player.play();
      player.addEventListener('ended', () => {
        player.play();
      });
      player.addEventListener('click', () => {
        if(player.error) {
          console.error(`Player encountered error: ${player.error.message}; resetting.`);
          player.stop();
        }
        if(!player.paused) {
          player.pause();
        } else {
          player.play();
        }
      });
      player.addEventListener('dblclick', () => {
        if(!document.fullscreenElement) {
          player.requestFullscreen();
        } else if(document.exitFullscreen) {
          document.exitFullscreen();
        }
      });
      player.style.width = width + "px";
      player.style.height = height + "px";
      player.style.maxWidth = "100%";
      player.style.maxHeight = "100%";
    })();
    
    return () => {
      canceled = true;
      if(player) player.remove();
    };
  }, [src, height, width, muted]);
  
  return <div className="OgvPlayer" ref={ref} />;
}
