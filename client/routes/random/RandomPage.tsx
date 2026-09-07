import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { RandomPageResponse } from "../../../types/api";
import usePageData from "../../hooks/usePageData";
import Layout from "../../components/Layout";
import Spinner from "../../components/Spinner";
import "./RandomPage.scss";

export default function RandomPage() {
  const { pageData } = usePageData<RandomPageResponse>();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if(!pageData) return;
    
    navigate(pageData.redirect || "/", { replace: true });
  }, [navigate, pageData]);
  
  return (
    <Layout className="RandomPage">
      <Spinner />
      <Link to="/">Back to Main Page</Link>
    </Layout>
  );
}
