import React from "react";
import useSSR from "../hooks/useSSR";

interface Props {
  children?: React.ReactNode;
}

export default function SSRCurtain({ children }: Props) {
  const SSR = useSSR();
  
  if(SSR) return null;
  else return children;
}
