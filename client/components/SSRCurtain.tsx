import React, { useEffect, useState } from "react";

interface Props {
  children?: any;
}

export default function SSRCurtain({ children }: Props) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(true), []);
  
  if(loaded) return children || null;
  else return null;
}
