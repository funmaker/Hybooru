import React from "react";

interface SourceProps {
  url: string;
}

const domainRegex = /^(?:https?:\/\/)?([^/]+)/;

export default function SourceLink({ url }: SourceProps) {
  const match = url.match(domainRegex);
  const domain = match && Object.keys(DOMAINS).find(domain => match[1].endsWith(domain));
  
  let text;
  if(domain) text = DOMAINS[domain as keyof typeof DOMAINS];
  else text = match && match[1] || url;
  
  return (
    <div><a href={url} target="_blank" rel="noreferrer">{text}</a></div>
  );
}


// From Hydrus' default parsers
const DOMAINS = {
  "8ch.net": "8chan",
  "8chan.moe": "8chan.moe",
  "8kun.top": "8kun",
  "a.4cdn.org": "4chan",
  "api.420chan.org": "420chan",
  "artstation.com": "ArtStation",
  "backend.deviantart.com": "Deviant Art",
  "boards.420chan.org": "420chan Thread",
  "boards.4chan.org": "4chan Thread",
  "boards.4channel.org": "4channel Thread",
  "chan.sankakucomplex.com": "Sankaku Channel",
  "danbooru.donmai.us": "Danbooru",
  "derpibooru.org": "Derpibooru",
  "deviantart.com": "Deviant Art",
  "e621.net": "e621",
  "furry.booru.org": "FurryBooru",
  "gelbooru.com": "Gelbooru",
  "gfycat.com": "Gfycat",
  "i.4cdn.org": "4chan",
  "i.imgur.com": "Imgur",
  "i.warosu.org": "Warosu",
  "idol.sankakucomplex.com": "Sankaku Idol",
  "imgur.com": "Imgur",
  "inkbunny.net": "Inkbunny",
  "konachan.com": "Konachan",
  "newgrounds.com": "Newgrounds",
  "nijie.info": "Nijie",
  "nitter.eu": "nitter",
  "nitter.net": "nitter",
  "nitter.nixnet.services": "nitter",
  "pixiv.net": "pixiv",
  "prolikewoah.com": "ProLikeWoah",
  "realbooru.com": "Realbooru",
  "rule34.paheal.net": "Rule 34",
  "rule34.xxx": "Rule 34",
  "rule34hentai.net": "Rule 34 Hentai",
  "safebooru.org": "Safebooru",
  "sakugabooru.com": "Sakugabooru",
  "sandbox.deviantart.com": "Deviant Art",
  "smuglo.li": "smuglo.li",
  "tbib.org": "The Big Imageboard",
  "tumblr.com": "Tumblr",
  "tvch.moe": "tvchan",
  "twitter.com": "Twitter",
  "vch.moe": "vch.moe",
  "warosu.org": "Warosu",
  "www.hentai-foundry.com": "Hentai Foundry",
  "xbooru.com": "Xbooru",
  "yande.re": "yande.re",
  "yiff.party": "Yiff.Party",
  "booru.funmaker.moe": "Mikubooru",
  "discordapp.com": "Discord",
};

