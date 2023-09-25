import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useHistory } from "react-router";
import { RandomPageData } from "../../../server/routes/apiTypes";
import usePageData from "../../hooks/usePageData";
import Layout from "../../components/Layout";
import Spinner from "../../components/Spinner";
import "./RandomPage.scss";

export default function RandomPage() {
  const [pageData, loading] = usePageData<RandomPageData>();
  const history = useHistory();
  
  useEffect(() => {
    if(!pageData) return;
    
    history.replace(pageData.redirect || "/");
  }, [history, loading, pageData]);
  
  return (
    <Layout className="RandomPage">
      <Spinner />
      <Link to="/">Back to Main Page</Link>
    </Layout>
  );
}
