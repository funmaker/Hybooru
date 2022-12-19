import { Octokit } from "@octokit/core";
import { Endpoints } from "@octokit/types/dist-types/generated/Endpoints";
import configs from "../helpers/configs";

export type Releases = Endpoints['GET /repos/{owner}/{repo}/releases']['response']['data'];

const octokit = new Octokit();

interface ReleasesCache {
  releases: Releases;
  created: number;
}

let cache: ReleasesCache | null = null;

export async function getReleases() {
  if(!configs.versionCheck || !configs.versionCheck.enabled) return [];
  if(cache && Date.now() - cache.created < configs.versionCheck.cacheLifeMs) return cache.releases;
  
  try {
    console.log("Fetching resources");
    const response = await octokit.request('GET /repos/{owner}/{repo}/releases', {
      owner: configs.versionCheck.owner,
      repo: configs.versionCheck.repo,
      per_page: 100, // eslint-disable-line @typescript-eslint/naming-convention
    });
    
    cache = {
      releases: response.data,
      created: Date.now(),
    };
    
    return cache.releases;
  } catch(e) {
    console.error("Failed to fetch releases from GitHub.");
    console.error(e);
    
    return [];
  }
}
