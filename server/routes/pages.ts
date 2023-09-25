import PromiseRouter from "express-promise-router";
import { Theme } from "../../client/hooks/useTheme";
import { qsStringify } from "../../client/helpers/utils";
import { fileUrl, MIME_STRING, namespaceRegex, postTitle, prettifyTag } from "../helpers/consts";
import { Options } from "../middlewares/reactMiddleware";
import configs from "../helpers/configs";
import opensearch from "../views/opensearch.handlebars";
import * as githubController from "../controllers/github";
import * as postsController from "../controllers/posts";
import * as globalController from "../controllers/global";
import * as tagsController from "../controllers/tags";
import { IndexPageData, Post, PostPageData, PostsSearchPageData, PostsSearchPageRequest, PostSummary, RandomPageData, RandomPageRequest, SetThemeRequest, TagsSearchPageData, TagsSearchPageRequest } from "./apiTypes";

export const router = PromiseRouter();


router.get<{ id: string }>('/posts/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  let post;
  if(!isNaN(id)) post = await postsController.get(parseInt(req.params.id));
  else post = null;
  
  const options: Options = {
    ogUrl: `${req.protocol}://${req.get('host')}/post/${req.params.id}`,
  };
  
  if(post) {
    options.ogTitle = options.title = postTitle(post);
    
    const tags = Object.keys(post.tags);
    const namespaced = tags.filter(tag => tag.match(namespaceRegex)).sort();
    const unnamespaced = tags.filter(tag => !tag.match(namespaceRegex)).sort();
    options.ogDescription = [...namespaced, ...unnamespaced].slice(0, 128).map(prettifyTag).join(", ");
    
    addOGMedia(options, post);
  }
  
  res.react<PostPageData>({ post }, options);
});

router.get<any, any, any, any, PostsSearchPageRequest>('/posts', async (req, res) => {
  const results = await postsController.search({ ...req.query, includeTags: true });
  
  res.react<PostsSearchPageData>({ results }, { ogTitle: "Post Search", ogDescription: req.query.query });
});

router.get<any, any, any, any, TagsSearchPageRequest>('/tags', async (req, res) => {
  const results = await tagsController.search(req.query);
  
  res.react<TagsSearchPageData>({ results }, { ogTitle: "Tag Search", ogDescription: req.query.query });
});

router.get<any, any, any, any, RandomPageRequest>('/random', async (req, res) => {
  const post = await postsController.random(req.query.query);
  const redirect = post ? `/posts/${post.id}${qsStringify(req.query)}` : `/posts${qsStringify(req.query)}`;
  
  res.react<RandomPageData>({ redirect }, { ogTitle: "Random Post", ogDescription: req.query.query, htmlRedirect: redirect });
});

router.post<any, any, SetThemeRequest>('/setTheme', async (req, res) => {
  res.cookie("theme", req.body.theme, { maxAge: 356 * 24 * 60 * 60 * 1000 });
  
  res.redirect(req.body.redirectUrl || "/");
});

router.get('/', async (req, res) => {
  const stats = await globalController.getStats();
  const theme = req.cookies.theme as Theme || Theme.AUTO;
  
  let motdQuery: string | undefined;
  if(configs.tags.motd && typeof configs.tags.motd === "object") motdQuery = configs.tags.motd[theme];
  else if(configs.tags.motd) motdQuery = configs.tags.motd;
  
  const motd = typeof motdQuery === "string" && await postsController.random(motdQuery) || null;
  const options: Options = { ogTitle: "Main Page" };
  
  const releases = await githubController.getReleases();
  let updateUrl: string | null = null;
  if(releases.length > 0) {
    const newest = releases[0];
    if(`v${req.config.version}` !== newest.tag_name) {
      updateUrl = newest.html_url;
    }
  }
  
  if(motd) addOGMedia(options, motd);
  
  res.react<IndexPageData>({ stats, updateUrl, motd }, options);
});

router.get("/opensearch.xml", async (req, res) => {
  res.setHeader('Content-Type', 'application/opensearchdescription+xml');
  res.end(opensearch({
    appName: configs.appName,
    appDescription: configs.appDescription,
    origin: `${req.protocol}://${req.get('host')}`,
  }));
});

router.get('/test', async (req, res) => {
  res.react({});
});


function addOGMedia(options: Options, post: Post | PostSummary) {
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
