import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { TagsSearchPageResponse, TagSummary } from "../../../types/api";
import { namespaceRegex } from "../../../server/helpers/consts";
import Layout from "../../components/Layout";
import Pagination from "../../components/Pagination";
import usePageData from "../../hooks/usePageData";
import useConfig from "../../hooks/useConfig";
import useLocalStorage from "../../hooks/useLocalStorage";
import "./TagsPage.scss";

export default function TagsPage() {
  const [showNamespaces] = useLocalStorage("namespaces", false);
  const { pageData, fetching } = usePageData<TagsSearchPageResponse>();
  const [memoData, setMemoData] = useState(pageData);
  
  const pageCount = memoData && Math.ceil(memoData.results.total / memoData.results.pageSize);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if(!fetching) setMemoData(pageData);
  }, [fetching, pageData]);
  
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
          {memoData?.results.tags.map(tag => <Row key={tag.name} tag={tag} showNamespaces={showNamespaces} />)}
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
      <td>{tag.parents.map((parent, id) => <React.Fragment key={parent}>{id !== 0 && ", "}<TagLink tag={parent} showNamespaces={showNamespaces} /></React.Fragment>)}</td>
      <td>{tag.siblings.map((sibling, id) => <React.Fragment key={sibling}>{id !== 0 && ", "}<TagLink tag={sibling} showNamespaces={showNamespaces} /></React.Fragment>)}</td>
    </tr>
  );
}

interface TagLinkProps {
  tag: string;
  showNamespaces: boolean;
}

function TagLink({ tag, showNamespaces }: TagLinkProps) {
  const [config] = useConfig();
  
  let name = tag.replace(/_/g, " ");
  let color: string | undefined;
  
  const result = tag.match(namespaceRegex);
  if(result) {
    if(!showNamespaces) name = result[2];
    color = config.namespaceColors[result[1]];
  }
  
  return <Link to={`/posts?query=${encodeURIComponent(tag)}`} rel="nofollow" style={{ color }}>{name}</Link>;
}
