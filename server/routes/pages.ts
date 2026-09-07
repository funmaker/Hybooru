import type ExpressCore from "express-serve-static-core";
import express from "express";
import { Theme } from "../../client/hooks/useTheme";
import { qsStringify } from "../../client/helpers/utils";
import { fileUrl, MIME_STRING, namespaceRegex, postTitle, prettifyTag } from "../helpers/consts";
import { SSROptions } from "../middlewares/reactMiddleware";
import lockMiddleware from "../middlewares/lockMiddleware";
import opensearch from "../views/opensearch.handlebars";
import HTTPError from "../helpers/HTTPError";
import configs from "../helpers/configs";
import * as db from "../helpers/db";
import * as githubController from "../controllers/github";
import * as postsController from "../controllers/posts";
import * as globalController from "../controllers/global";
import * as tagsController from "../controllers/tags";
import { IndexPageResponse, LockPageResponse, LockPageRequest, Post, PostPageResponse, PostsSearchPageResponse, PostsSearchPageRequest, PostSummary, RandomPageResponse, RandomPageRequest, SetThemeRequest, TagsSearchPageResponse, TagsSearchPageRequest } from "../../types/api";

export const router = express.Router();

const baseUrl = (req: ExpressCore.Request) => `${req.protocol}://${req.get('host')}`;

router.get<{ id: string }, PostPageResponse>('/posts/:id', lockMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  
  let post;
  if(!isNaN(id)) post = await postsController.get(parseInt(req.params.id));
  else post = null;
  
  if(!post) throw new HTTPError(404, "Post not found");
  
  const canonicalUrl = `${baseUrl(req)}/post/${req.params.id}`;
  const options: SSROptions = {
    ogUrl: canonicalUrl,
    canonicalUrl,
  };
  
  options.ogTitle = options.title = postTitle(post);
  
  const tags = Object.keys(post.tags);
  const namespaced = tags.filter(tag => tag.match(namespaceRegex)).sort();
  const unnamespaced = tags.filter(tag => !tag.match(namespaceRegex)).sort();
  options.ogDescription = [...namespaced, ...unnamespaced].slice(0, 128).map(prettifyTag).join(", ");
  
  addOGMedia(options, post);
  
  res.react({ post }, options);
});

router.get<never, PostsSearchPageResponse, PostsSearchPageRequest>('/posts', lockMiddleware, async (req, res) => {
  const results = await postsController.search({ ...req.query, tags: true, blurhash: true });
  
  res.react({ results }, {
    ogTitle: "Post Search",
    ogDescription: req.query.query,
    canonicalUrl: `${baseUrl(req)}/posts${qsStringify({ page: parseInt(req.query.page) || undefined })}`,
    noIndex: !!req.query.query,
    soft404: results.posts.length === 0,
  });
});

router.get<never, TagsSearchPageResponse, TagsSearchPageRequest>('/tags', lockMiddleware, async (req, res) => {
  const results = await tagsController.search({
    ...req.query,
    full: true,
  });
  
  res.react({ results }, {
    ogTitle: "Tag Search",
    ogDescription: req.query.query,
    canonicalUrl: `${baseUrl(req)}/tags${qsStringify({ page: parseInt(req.query.page) || undefined })}`,
    noIndex: !!req.query.query,
    soft404: results.tags.length === 0,
  });
});

router.get<never, RandomPageResponse, RandomPageRequest>('/random', lockMiddleware, async (req, res) => {
  const post = await postsController.random(req.query.query);
  const redirect = post ? `/posts/${post.id}${qsStringify(req.query)}` : `/posts${qsStringify(req.query)}`;
  
  res.react({ redirect }, {
    ogTitle: "Random Post",
    ogDescription: req.query.query,
    htmlRedirect: redirect,
    noIndex: true,
  });
});

router.post<never, never, SetThemeRequest>('/setTheme', async (req, res) => {
  res.cookie("theme", req.body.theme, { maxAge: 356 * 24 * 60 * 60 * 1000 });
  
  res.redirect(req.body.redirectUrl || "/");
});

router.get("/opensearch.xml", async (req, res) => {
  res.setHeader('Content-Type', 'application/opensearchdescription+xml');
  res.end(opensearch({
    appName: configs.appName,
    appDescription: configs.appDescription,
    origin: `${req.protocol}://${req.get('host')}`,
  }));
});

router.get<never, LockPageResponse, LockPageRequest>('/lock', async (req, res) => {
  const redirect = req.query.redirect ?? "/";
  
  res.react({
    isLocked: db.dbLock.isLocked(),
    lockName: db.dbLock.lockName,
    redirect,
  }, {
    htmlRedirect: db.dbLock.isLocked() ? undefined : redirect,
  });
});

router.get<never, Empty>('/diagnostics', async (req, res) => {
  res.react({}, {
    noIndex: true,
  });
});

router.get<never, IndexPageResponse>('/', lockMiddleware, async (req, res) => {
  const stats = await globalController.getStats();
  const config = await globalController.getConfig();
  const theme = req.cookies.theme as Theme || Theme.AUTO;
  
  let motdQuery: string | undefined;
  if(configs.tags.motd && typeof configs.tags.motd === "object") motdQuery = configs.tags.motd[theme];
  else if(configs.tags.motd) motdQuery = configs.tags.motd;
  
  const motd = typeof motdQuery === "string" && await postsController.random(motdQuery) || null;
  const options: SSROptions = {
    ogTitle: "Main Page",
    ogDescription: configs.appDescription,
    canonicalUrl: baseUrl(req),
  };
  
  const releases = await githubController.getReleases();
  let updateUrl: string | null = null;
  if(releases.length > 0) {
    const newest = releases[0];
    if(`v${config.version}` !== newest.tag_name) {
      updateUrl = newest.html_url;
    }
  }
  
  if(motd) addOGMedia(options, motd);
  
  res.react({ stats, updateUrl, motd }, options);
});

function addOGMedia(options: SSROptions, post: Post | PostSummary) {
  const type = post.mime !== null && MIME_STRING[post.mime] || null;
  const url = fileUrl(post);
  if(type?.startsWith("image/")) {
    options.ogImage = {
      url,
      type,
      width: 'width' in post && post.width || 0,
      height: 'height' in post && post.height || 0,
      alt: post.id.toString(),
    };
  } else if(type?.startsWith("video/")) {
    options.ogVideo = {
      url,
      type,
      width: 'width' in post && post.width || 0,
      height: 'height' in post && post.height || 0,
      duration: 'duration' in post && post.duration || 0,
    };
  } else if(type?.startsWith("audio/")) {
    options.ogAudio = { url, type };
  }
}
