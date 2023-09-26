import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { TagsSearchPageData, TagSummary } from "../../../server/routes/apiTypes";
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
  
  console.log(pageData);
  
  return (
    <Layout className="TagsPage" searchAction="/tags" random={false} simpleSettings>
      <table className="tags">
        <thead>
          <tr>
            <th>Posts</th>
            <th>Name</th>
            <th>Namespace</th>
            <th>Parents</th>
            <th>Siblings</th>
          </tr>
        </thead>
        <tbody>
          {pageData?.results.tags.map(tag => <Row key={tag.name} tag={tag} showNamespaces={showNamespaces} />)}
        </tbody>
      </table>
      {!!pageCount && <Pagination count={pageCount} />}
    </Layout>
  );
}

interface RowProps {
  tag: TagSummary;
  showNamespaces: boolean;
}

function Row({ tag, showNamespaces }: RowProps) {
  const namespaceMatch = tag.name.match(namespaceRegex);
  
  return (
    <tr>
      <td>{tag.posts}</td>
      <td><TagLink tag={tag.name} showNamespaces={showNamespaces} /></td>
      <td>{namespaceMatch ? namespaceMatch[1] : "General"}</td>
      <td>{tag.parents.map((parent, id) => <>{id !== 0 && ", "}<TagLink key={parent} tag={parent} showNamespaces={showNamespaces} /></>)}</td>
      <td>{tag.siblings.map((sibling, id) => <>{id !== 0 && ", "}<TagLink key={sibling} tag={sibling} showNamespaces={showNamespaces} /></>)}</td>
    </tr>
  );
}

interface TagLinkProps {
  tag: string;
  showNamespaces: boolean;
}

function TagLink({ tag, showNamespaces }: TagLinkProps) {
  const config = useConfig();
  
  let name = tag.replace(/_/g, " ");
  let color: string | undefined;
  
  const result = tag.match(namespaceRegex);
  if(result) {
    if(!showNamespaces) name = result[2];
    color = config.namespaceColors[result[1]];
  }
  
  return <Link to={`/posts?query=${encodeURIComponent(tag)}`} style={{ color }}>{name}</Link>;
}
