import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import useConfig from "../hooks/useConfig";
import { namespaceRegex } from "../../server/helpers/consts";
import useLocalStorage from "../hooks/useLocalStorage";
import useQuery from "../hooks/useQuery";
import "./Tags.scss";

export interface TagsProps {
  tags: Record<string, number>;
  grouped?: boolean;
  searchMod?: boolean;
}

// eslint-disable-next-line prefer-arrow-callback
export default React.memo(function Tags({ tags, grouped, searchMod }: TagsProps) {
  const [showNamespaces] = useLocalStorage("namespaces", false);
  
  if(grouped) {
    const groups: Record<string, string[]> = {};
    const free = [];
    
    for(const tag of Object.keys(tags)) {
      const result = tag.match(namespaceRegex);
      
      if(result) {
        const namespace = result[1];
        if(!groups[namespace]) groups[namespace] = [];
        groups[namespace].push(tag);
      } else {
        free.push(tag);
      }
    }
    
    const groupEntries = Object.entries(groups)
                               .sort((a, b) => a[0].localeCompare(b[0]));
    
    return (
      <div className="Tags">
        {groupEntries.map(([namespace, members]) =>
          <Namespace key={namespace} header={namespace} members={members} tags={tags} searchMod={searchMod} sorted />,
        )}
        <Namespace header="Tags" members={free} tags={tags} searchMod={searchMod} sorted />
      </div>
    );
  }
  
  return (
    <div className="Tags">
      <Namespace members={Object.keys(tags)} tags={tags} searchMod={searchMod} showNamespaces={showNamespaces} />
    </div>
  );
});

interface NamespaceProps {
  header?: string;
  members: string[];
  tags: Record<string, number>;
  searchMod?: boolean;
  sorted?: boolean;
  showNamespaces?: boolean;
}

function Namespace({ header, members, tags, searchMod, sorted, showNamespaces }: NamespaceProps) {
  const sortedMembers = useMemo(() => sorted ? members.slice().sort() : members, [members, sorted]);
  
  return (
    <div className="namespace">
      {header && <b>{header}</b>}
      {sortedMembers.map(tag => <Tag key={tag} searchMod={searchMod} tag={tag} tags={tags} showNamespace={showNamespaces} />)}
    </div>
  );
}

interface TagProps {
  searchMod?: boolean;
  tag: string;
  tags: Record<string, number>;
  showNamespace?: boolean;
}

function Tag({ searchMod, tag, tags, showNamespace }: TagProps) {
  const config = useConfig();
  const query = useQuery();
  
  let name = tag.replace(/_/g, " ");
  let color: string | undefined;
  
  const result = name.match(namespaceRegex);
  if(result) {
    if(!showNamespace) name = result[2];
    color = config.namespaceColors[result[1]];
  }
  
  let addLink = "#";
  let delLink = "#";
  let addCh = "+";
  let delCh = "-";
  
  if(searchMod) {
    const parts = query.split(" ");
    const partsClean = parts.filter(p => p !== tag && p !== `-${tag}`);
    
    if(!parts.includes(tag)) addLink = `/posts?query=${encodeURIComponent([...partsClean, tag].join(" "))}`;
    else {
      addLink = `/posts?query=${encodeURIComponent(partsClean.join(" "))}`;
      addCh = "•";
    }
    
    if(!parts.includes(`-${tag}`)) delLink = `/posts?query=${encodeURIComponent([...partsClean, `-${tag}`].join(" "))}`;
    else {
      addLink = `/posts?query=${encodeURIComponent(partsClean.join(" "))}`;
      delCh = "•";
    }
  }
  
  return (
    <div>
      {searchMod && <>
        <Link className="btn" to={addLink}>{addCh}</Link>
        <Link className="btn" to={delLink}>{delCh}</Link>
      </> /* eslint-disable-line react/jsx-closing-tag-location */ }
      <Link to={`/posts?query=${encodeURIComponent(tag)}`} style={{ color }}>{name}</Link>
      {" "}
      <span>{tags[tag]}</span>
    </div>
  );
}
