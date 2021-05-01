import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { TagsSearchPageData } from "../../../server/routes/apiTypes";
import { namespaceRegex } from "../../../server/helpers/consts";
import Layout from "../../components/Layout";
import Pagination from "../../components/Pagination";
import usePageData from "../../hooks/usePageData";
import useConfig from "../../hooks/useConfig";
import useLocalStorage from "../../hooks/useLocalStorage";
import "./TagsPage.scss";

export default function TagsPage() {
  const [showNamespaces] = useLocalStorage("namespaces", false);
  let [pageData] = usePageData<TagsSearchPageData>();
  const pageDataCache = useRef(pageData);
  
  if(pageData) pageDataCache.current = pageData;
  else pageData = pageDataCache.current;
  
  const pageCount = pageData && Math.ceil(pageData.results.total / pageData.results.pageSize);
  
  return (
    <Layout className="TagsPage" searchAction="/tags" simpleSettings>
      <table className="tags">
        <thead>
          <tr>
            <th>Posts</th>
            <th>Name</th>
            <th>Namespace</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(pageData?.results.tags || {}).map(([tag, posts]) => <Row key={tag} tag={tag} posts={posts} showNamespaces={showNamespaces} />)}
        </tbody>
      </table>
      {pageCount && <Pagination count={pageCount} />}
    </Layout>
  );
}

interface RowProps {
  tag: string;
  posts: number;
  showNamespaces: boolean;
}

function Row({ tag, posts, showNamespaces }: RowProps) {
  const config = useConfig();
  
  let name = tag.replace(/_/g, " ");
  let color: string | undefined;
  
  const result = name.match(namespaceRegex);
  if(result) {
    if(!showNamespaces) name = result[2];
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
