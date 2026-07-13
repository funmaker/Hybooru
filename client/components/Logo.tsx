import React from "react";
import { Link } from "react-router-dom";
import useConfig from "../hooks/useConfig";
import "./Logo.scss";

export interface LogoProps {
  to?: string;
}

export default function Logo({ to = "/" }: LogoProps) {
  const [config] = useConfig();
  
  return <h1 className="Logo"><Link to={to}>{config.appName}</Link></h1>;
}
