import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { TagsSearchPageData } from "../../../server/routes/apiTypes";
import { namespaceRegex } from "../../components/Tags";
import Layout from "../../components/Layout";
import Pagination from "../../components/Pagination";
import usePageData from "../../hooks/usePageData";
import useConfig from "../../hooks/useConfig";
import "./TagsPage.scss";

export default function TagsPage() {
  let [pageData] = usePageData<TagsSearchPageData>();
  const pageDataCache = useRef(pageData);
  
  if(pageData) pageDataCache.current = pageData;
  else pageData = pageDataCache.current;
  
  const pageCount = pageData && Math.ceil(pageData.results.total / pageData.results.pageSize);
  
  return (
    <Layout className="TagsPage" searchAction="/tags">
      <table className="tags">
        <tr>
          <th>Posts</th>
          <th>Name</th>
          <th>Category</th>
        </tr>
        {Object.entries(pageData?.results.tags || {}).map(([tag, posts]) => <Row key={tag} tag={tag} posts={posts} />)}
      </table>
      {pageCount && <Pagination count={pageCount} />}
    </Layout>
  );
}

interface RowProps {
  tag: string;
  posts: number;
}

function Row({ tag, posts }: RowProps) {
  const config = useConfig();
  
  let name = tag.replace(/_/g, " ");
  let color: string | undefined;
  
  const result = name.match(namespaceRegex);
  if(result) {
    name = result[2];
    color = config.namespaceColors[result[1]];
  }
  
  return (
    <tr>
      <td>{posts}</td>
      <td><Link to={`/posts?query=${encodeURIComponent(tag)}`} style={{ color }}>{name}</Link></td>
      <td>{result ? result[1] : "General"}</td>
    </tr>
  );
}
