import PromiseRouter from "express-promise-router";
import configs from "../helpers/configs";
import * as postsController from "../controllers/posts";
import * as globalController from "../controllers/global";
import * as tagsController from "../controllers/tags";
import { IndexPageData, PostPageData, PostsSearchPageData, PostsSearchPageRequest, TagsSearchPageData, TagsSearchPageRequest } from "./apiTypes";

export const router = PromiseRouter();

router.get<{ id: string }>('/posts/:id', async (req, res) => {
  const post = await postsController.get(parseInt(req.params.id));
  
  res.react<PostPageData>({ post });
});

router.get<any, any, any, PostsSearchPageRequest>('/posts', async (req, res) => {
  const results = await postsController.search({ ...req.query, includeTags: true });
  
  res.react<PostsSearchPageData>({ results });
});

router.get<any, any, any, TagsSearchPageRequest>('/tags', async (req, res) => {
  const results = await tagsController.search(req.query);
  
  res.react<TagsSearchPageData>({ results });
});

router.get('/random', async (req, res) => {
  const post = await postsController.random();
  
  res.redirect(post ? `/posts/${post.id}` : "/");
});

router.get('/', async (req, res) => {
  const stats = await globalController.getStats();
  const motd = configs.tags.motd && await postsController.random(configs.tags.motd) || null;
  
  res.react<IndexPageData>({ stats, motd });
});

router.get('/test', async (req, res) => {
  res.react({});
});
