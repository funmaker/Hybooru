import React, { useCallback, useMemo } from "react";
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

function addTag(query: string, tag: string): string {
  const parts = query.split(" ");
  const partsClean = parts.filter(p => p && p !== tag && p !== `-${tag}`);
  
  if(!parts.includes(tag)) return [...partsClean, tag].join(" ");
  else return partsClean.join(" ");
}

function delTag(query: string, tag: string): string {
  const parts = query.split(" ");
  const partsClean = parts.filter(p => p && p !== tag && p !== `-${tag}`);
  
  if(!parts.includes(`-${tag}`)) return [...partsClean, `-${tag}`].join(" ");
  else return partsClean.join(" ");
}

interface TagProps {
  searchMod?: boolean;
  tag: string;
  tags: Record<string, number>;
  showNamespace?: boolean;
}

function Tag({ searchMod, tag, tags, showNamespace }: TagProps) {
  const config = useConfig();
  const [query, setQuery, genLink] = useQuery();
  
  let name = tag.replace(/_/g, " ");
  let color: string | undefined;
  
  const result = name.match(namespaceRegex);
  if(result) {
    if(!showNamespace) name = result[2];
    color = config.namespaceColors[result[1]];
  }
  
  const parts = query.split(" ");
  const addLink = genLink(addTag(query, tag));
  const delLink = genLink(delTag(query, tag));
  const addCh = parts.includes(tag) ? "•" : "+";
  const delCh = parts.includes(`-${tag}`) ? "•" : "-";
  
  const onAdd = useCallback<React.MouseEventHandler>(ev => {
    ev.preventDefault();
    setQuery(query => addTag(query, tag));
  }, [setQuery, tag]);
  
  const onDel = useCallback<React.MouseEventHandler>(ev => {
    ev.preventDefault();
    setQuery(query => addTag(query, tag));
  }, [setQuery, tag]);
  
  return (
    <div>
      {searchMod && <>
        <Link className="btn" to={addLink} onClick={onAdd}>{addCh}</Link>
        <Link className="btn" to={delLink} onClick={onDel}>{delCh}</Link>
      </> /* eslint-disable-line react/jsx-closing-tag-location */ }
      <Link to={genLink(tag)} style={{ color }}>{name}</Link>
      {" "}
      <span>{tags[tag]}</span>
    </div>
  );
}
