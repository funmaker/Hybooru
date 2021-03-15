import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import "./Tags.scss";

export interface TagsProps {
  tags: Record<string, number>;
  grouped?: boolean;
  searchMod?: boolean;
}

const namespaceRegex = /(.+):(.+)/;

export default function Tags({ tags, grouped, searchMod }: TagsProps) {
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
      <Namespace members={Object.keys(tags)} tags={tags} searchMod={searchMod} />
    </div>
  );
}

interface NamespaceProps {
  header?: string;
  members: string[];
  tags: Record<string, number>;
  searchMod?: boolean;
  sorted?: boolean;
}

function Namespace({ header, members, tags, searchMod, sorted }: NamespaceProps) {
  const sortedMembers = useMemo(() => sorted ? members.slice().sort() : members, [members, sorted]);
  
  return (
    <div className="namespace">
      {header && <b>{header}</b>}
      {sortedMembers.map(tag => <Tag key={tag} searchMod={searchMod} tag={tag} tags={tags} />)}
    </div>
  );
}

interface TagProps {
  searchMod?: boolean;
  tag: string;
  tags: Record<string, number>;
}

function Tag({ searchMod, tag, tags }: TagProps) {
  let name = tag.replace(/_/g, " ");
  if(namespaceRegex.test(name)) name = name.slice(name.indexOf(":") + 1);
  
  return (
    <div>
      {searchMod ? "+ - " : ""}
      <Link to={`/posts?query=${encodeURIComponent(tag)}`}>{name}</Link>
      <span>{tags[tag]}</span>
    </div>
  );
}
