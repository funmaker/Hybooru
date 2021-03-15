import React from "react";
import { SearchPageData } from "../../../server/routes/apiTypes";
import usePageData from "../../helpers/usePageData";
import Layout from "../../components/Layout";
import Tags from "../../components/Tags";
import Thumbnail from "../../components/Thumbnail";
import "./SearchPage.scss";

export default function SearchPage() {
  const [pageData] = usePageData<SearchPageData>();
  
  return (
    <Layout className="SearchPage"
            sidebar={pageData?.results.tags && <Tags tags={pageData?.results.tags} searchMod />}>
      {pageData?.results.posts.map(post => <Thumbnail key={post.id} post={post} />)}
    </Layout>
  );
}
