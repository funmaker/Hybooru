# Hybooru

<p align="center">
   <img src="static/logo.svg" width="256"><br/>
   <a href="https://github.com/funmaker/Hybooru/releases/latest"><img src="https://github.com/funmaker/Hybooru/actions/workflows/release_build.yml/badge.svg"></a>
   <a href="https://github.com/funmaker/Hybooru/pkgs/container/hybooru"><img src="https://github.com/funmaker/Hybooru/actions/workflows/docker_build.yml/badge.svg"></a>
</p>

[Hydrus](https://github.com/hydrusnetwork/hydrus)-based booru-styled imageboard in React, inspired by [hyve](https://github.com/imtbl/hyve).

Demo: https://booru.funmaker.moe/

[API Documentation](API.md)

[Changelog](CHANGELOG.md)

Hybooru allows you to create an online booru-styled imageboard and REST API on top of Hydrus client,
allowing you to access your collection from anywhere, without the need for running Hydrus instance.
It uses its own PostgreSQL database, populated using metadata from Hydrus' SQLite database.
Files are not cloned and instead served directly from Hydrus's database. You need to
regenerate the Hybooru's database every time you want to update it. Make sure to
properly configure `configs.json` file. **Stop Hydrus when you regenerate HyBooru's
database if you plan to use live Hydrus' database (use hydrus backup instead if
possible)**


## Features

- Searching by tags
- Negative search
- Ratings
- Sorting (date imported, rating, size, tag-based ordering)
- Tag-based ordering for comics/manga (page, volume, chapter)
- Post navigation (previous/next buttons with keyboard support)
- Searching tags and autocomplete
- Notes and translation overlays
- tag and post relations (parents/siblings, duplicates/alternatives)
- Colored tags
- Blurhash
- REST API
- Mobile support
- OpenGraph and OpenSearch
- Supports browsers without JS

Minimum Hydrus Version: **v586**

Keep in mind this project is not a standalone, fully-fledged booru, but rather a read-only interface to your Hydrus database.
It does not provide any way to manage your posts or tags. The only way to add/modify your data is to do these
changes in Hydrus and then rebuild Hybooru's database again(can be done from the cog menu on search/post page).

Currently, only Hydrus Client database is supported. You cannot use Hybooru on top of Hydrus Server.


## Setup

1) Install NodeJS, npm and PostgreSQL.
2) Create new Postgresql database and user.
3) Allow user to use `pg_trgm` and `intarray` extensions. Either:
   - Grant the user permission to create trusted extensions: `GRANT CREATE ON DATABASE <database> TO <user>`.
   - Create the extensions yourself: `CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS intarray;`.
4) Download latest [Release](https://github.com/funmaker/Hybooru/releases) production build [or build it yourself](#development).
5) Extract server files.
6) Edit `configs.json` to specify database credentials, hydrus db location and other options. See [Configuration](#configuration).
7) (Optional) Configure [reverse proxy](#reverse-proxy).
8) Run `npm install` to install dependencies.
9) Run `npm start` to start server.


## Searching Query Syntax

Searching tries to imitate classical booru's syntax. All tags are lowercase and use `_` instead of space character.
You can also use `?` to match for single character(eg: `?girl`) and `*` to match number of characters(eg: `blue_*`).
Patterns prefixed with `-` will be excluded from results. Patterns are matched against tag's name, but
Hydrus's `namespace:subtag` syntax is also supported.

Additionally you can sort results by including `order:*` in query. Supported sorts are: `order:date`(date posted),
`order:id`, `order:score`(rating), `order:size`. You can also append `_desc` or `_asc` to specify order(eg: `order:date_asc`).
If not specified, posts are sorted by date descending.

### Tag-based Ordering

You can also sort by tag namespaces for reading comics/manga in order. By default, the following namespaces are
supported: `order:page`, `order:volume`, `order:chapter`, `order:part`. These sort by the numeric value of the
corresponding tags (e.g., `page:1`, `page:2`, `volume:1`).

Multiple sort fields can be combined for hierarchical sorting:
- `series:example order:volume order:page` - Sort by volume first, then by page within each volume

Posts without the specified tag are placed at the end (ascending) or beginning (descending) of results.
Non-numeric tag values (like `page:cover`) are treated as null and sorted accordingly.

The list of sortable namespaces can be configured via `posts.tagSorts` in `configs.json`.

### Post Navigation

When clicking a post from search results, navigation buttons (Previous/Next) appear on the post page, allowing
you to browse through posts in order. You can also use arrow keys (Left/Right) for keyboard navigation.

### Rating Filter

If you use a numeric rating service and successfully imported the ratings, you can also filter posts by their ratings
using `rating:` namespace. You can search posts with specific rating(`rating:3`), range(`rating:2-4`) or query posts
that have not been rated(`rating:none`).

### System Tags

`system:` tags from Hydrus are not real tags and are not fully supported. Hybooru only supports `system:inbox`,
`system:archive` and a non-standard `system:trash` for filtering posts that are respectively in inbox, are not in inbox
and are in trash. You can use them in the blacklist/whitelist and you can also negate them using `-` prefix in searches.

### Examples

- `1girl blue_* -outdoors rating:3-5 order:score_desc` - Search with tag filters and sort by rating
- `series:example order:volume order:page` - Read a manga series in order
- `order:page_asc` - Sort all posts by page number ascending


## Configuration

Hybooru's config is stored in `configs.json` file in the project's root directory. Restart Hybooru to apply changes.

| Name                         | Type                      | Default                                           | Comment                                                                                                                                                                                                          |
|------------------------------|---------------------------|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| port                         | number                    | `3939`                                            | HTTP server port. You can use `PORT` envvar to override this.                                                                                                                                                    |
| host                         | string or null            | `null`                                            | HTTP server host. `null` will listen on all interfaces. Set to `"localhost"` if you are not going to connect to it directly over network. You can use `HOST` envvar to override this.                            |
| hydrusDbPath                 | string or null            | `null`                                            | Hydrus db or backup location. If null, default platform-dependent locaton is used: `%appdata%/hydrus/db`(Windows), `~/.local/share/hydrus/db`(Linux), `~/Library/Preferences/hydrus/db`(MacOS)                   |
| appName                      | string                    | `"Hybooru"`                                       | Specify name of your booru (appears as logo).                                                                                                                                                                    |
| appDescription               | string                    | `"Hydrus-based booru-styled imageboard in React"` | Booru's description used in OpenGraph.                                                                                                                                                                           |
| adminPassword                | string or null            | `null`                                            | Password used to regenerate database (can be accessed from the cog button). Null disables manual database regeneration. You can also use environmental variable `HYDRUS_ADMIN_PASSWORD` to override the password |
| isTTY                        | boolean or null           | `null`                                            | Overrides colorful/fancy output. `true` forces, `false` disables, `null` automatically determines. Useful when piping output.                                                                                    |
| importBatchSize              | number                    | `8192`                                            | Base batch size used during importing. Decrease it if hybooru crashes during import.                                                                                                                             |
| db                           | PoolConfig                | _local database_                                  | node-postgres config object. See https://node-postgres.com/apis/client for more details. By defaults it attempts to connect to `hybooru` database at `localhost` using `hybooru` as password. Can be overridden with `DB_*` environment variables (see below). |
| posts                        | object                    | _see below_                                       | Options related to posts and files.                                                                                                                                                                              |
| posts.services               | (string/number)[] or null | `null`                                            | List of names or ids of file services to import. Use `null` to import from all services.                                                                                                                         |
| posts.filesPathOverride      | string or null            | `null`                                            | Overrides location of post's files. If `null`, `client_files` inside hydrus's db folder is used.                                                                                                                 |
| posts.thumbnailsPathOverride | string or null            | `null`                                            | Overrides location of post's thumbnails. If `null`, `filesPathOverride` is used.                                                                                                                                 |
| posts.thumbnailsMode         | `"fit"` or `"fill"`       | `"fit"`                                           | Specifies thumbnail scale mode. Change it to `"fill"` if you are using `scale to fill` in hydrus thumbnail options.                                                                                              |
| posts.pageSize               | number                    | `72`                                              | Number of posts on single page.                                                                                                                                                                                  |
| posts.cachePages             | number                    | `5`                                               | Number of pages cached in single cache entry.                                                                                                                                                                    |
| posts.cacheRecords           | number                    | `1024`                                            | Max number of cache entries.                                                                                                                                                                                     |
| posts.maxPreviewSize         | number                    | `104857600`                                       | Max size in bytes of post that can be previewed in post page/gallery. Default is 100MB.                                                                                                                          |
| posts.tagSorts               | string[]                  | `["page", "volume", "chapter", "part"]`           | List of tag namespaces that can be used for `order:*` sorting. Allows sorting posts by tag values (e.g., `order:page`).                                                                                          |
| tags                         | object                    | _see below_                                       | Options related to tags. All tags below support wildcards.                                                                                                                                                       |
| tags.services                | (string/number)[] or null | `null`                                            | List of names or ids of tag services to import. Use `null` to import from all services.                                                                                                                          |
| tags.motd                    | string or object or null  | `null`                                            | Query used to search for random image displayed on main page. You can also specify object to specify different tags for different themes(use `light`, `dark` and `auto` as keys)                                 |
| tags.untagged                | string                    | `"-*"`                                            | Overrides query used to determine which posts require tagging. Default `"-*"` matches all posts with no tags.                                                                                                    |
| tags.ignore                  | string[]                  | `[]`                                              | List of tags that will not be imported from Hydrus (posts tagged by these tags will still be imported).                                                                                                          |
| tags.blacklist               | string[] or null          | `null`                                            | All posts and tags matching any of specified tags will not be imported from Hydrus. Use `null` or empty array to ignore blacklist.                                                                               |
| tags.whitelist               | string[] or null          | `null`                                            | Only posts matching specified tags will be imported from Hydrus. Use `null` or empty array to ignore whitelist.                                                                                                  |
| tags.resolveRelations        | boolean                   | `true`                                            | Resolve tag siblings and parents. Can be slow in large databases.                                                                                                                                                |
| tags.reportLoops             | boolean                   | `false`                                           | Print out all loops detected in tag relationships.                                                                                                                                                               |
| tags.searchSummary           | number                    | `39`                                              | Number of tags that appear on side menu when searching posts.                                                                                                                                                    |
| rating                       | object or null            | _see below_                                       | Options related to numerical rating. Set null to remove ratings.                                                                                                                                                 |
| rating.enabled               | boolean                   | `true`                                            | Enables or disables rating import.                                                                                                                                                                               |
| rating.service               | string or number or null  | `null`                                            | Name or id of the numerical rating service. Set to `null` to pick any service.                                                                                                                                   |
| rating.stars                 | number                    | `5`                                               | Number of stars used in rating.                                                                                                                                                                                  |
| versionCheck                 | object or null            | _see below_                                       | Options related to version checking. Set null to disable.                                                                                                                                                        |
| versionCheck.enabled         | boolean                   | `true`                                            | Enables or disables version checking.                                                                                                                                                                            |
| versionCheck.owner           | string                    | `"funmaker"`                                      | GitHub handle of the repo owner. Do not change unless you know what you are doing.                                                                                                                               |
| versionCheck.repo            | string                    | `"hybooru"`                                       | GitHub handle of the repo name. Do not change unless you know what you are doing.                                                                                                                                |
| versionCheck.cacheLifeMs     | number                    | `3600000` (1 hour)                                | Lifetime of versions cache. GitHub API is rate-limited, do not change unless you know what you are doing.                                                                                                        |

### Environment Variables

The following environment variables can be used to override config values:

| Variable               | Overrides         | Description                          |
|------------------------|-------------------|--------------------------------------|
| `PORT`                 | `port`            | HTTP server port                     |
| `HOST`                 | `host`            | HTTP server host                     |
| `HYDRUS_ADMIN_PASSWORD`| `adminPassword`   | Password for database regeneration   |
| `DB_HOST`              | `db.host`         | Database hostname                    |
| `DB_PORT`              | `db.port`         | Database port                        |
| `DB_USER`              | `db.user`         | Database username                    |
| `DB_PASSWORD`          | `db.password`     | Database password                    |
| `DB_NAME`              | `db.database`     | Database name                        |

Environment variables take precedence over `configs.json` values.

## Translation/overlay notes

_This feature is meant for advanced users._

Hydrus so far does not support overlay notes (https://github.com/hydrusnetwork/hydrus/issues/562). Hybooru implements it
using a non-standard extension to the existing Hydrus note system and custom content parser. If you want to display
overlay notes in Hybooru you will need to modify page parsers in Hydrus to create a note in special format that stores
note position and size. I have prepared few content parser for popular boorus:

<img src=".github/images/gelbooru.png" width="256"> <img src=".github/images/danbooru.png" width="256">

To import content parsers in Hydrus you need to go to network > downloader components > manage parsers > select target
file page parser > edit > content parsers and drag and drop one of the above images into the content parser list.
Hydrus will prevent you from dropping mismatched image into a different kind of list, but it will not prevent you from
adding a content parser to wrong page parse, so make sure you are adding it to the right page parser for the right
domain.

After importing content parser, newly imported images should have `translation` containing all the overlays if they have
any. However, Hydrus by default will not add translations to images that it already recognizes in the database. To
fetch overlay notes for images recognized by Hydrus, you will have to create a new Url Import tab (download > urls)
and go to import options > tags > set custom tag import options just for this importer > check both force fetch page
even if url/hash recognized and file already in db. In this particular importer hydrus will update notes(and other file
metadata I guess) even if it recognizes the image. You can also set it as the default, but it's not recommended.


### Overlay note format

[Content Parsers in Hydrus Documentation](https://hydrusnetwork.github.io/hydrus/downloader_parsers_content_parsers.html)

If you want to fetch overlays from different website, you will need to write your own content parser. Overlay notes
are stored in one or many regular hydrus notes and contain special commands that can be understood by Hybooru. One note
can contain any number of overlay sub-notes. The label/title of the note is ignored. The format is as follows:

```
<note content>
#! [<left>,<top>,<width>,<height>,<srcWidth>,<srcHeight>]

<note content>
#! [<left>,<top>,<width>,<height>,<srcWidth>,<srcHeight>]

...
```

For example:

```
Note in upper left corner
#! [50,50,100,100,500,500]

Multi
-line
note on the bottom
#! [0,400,500,100,500,500]
```

Sub-notes are divided using lines that begin with `#! `. On these lines Hybooru expects an JSON array with numbers
representing its position on the image. `<srcWidth>` and `<srcHeight>` represent the size of the original image. They
are necessary to keep overlays in the right in case an user copies notes to another version of the image, for example
in case of merge during duplicates processing. You can also set these values to `100` each if you are dealing with
positions in percents. It is strongly recommended you put all the subnotes into a single Hydrus note as the output
of your content parser. Hydrus uses note names to handle note update/replacement and outputting multiple notes with
generated names like `translation (###)` will make resolving conflicts much harder.


## Development

Build scripts are written for Linux. Building on Windows is currently not supported.
However, you can still look into `package.json` and change `scripts` to use Window's commands.
Alternatively you can probably just use Docker or a virtual machine.


### Install Dependencies

```bash
npm install
```


### Run development

```bash
npm run start
```


### Build production

```bash
npm run build:prod
```

Output is saved to `dist/` folder in project's root directory. These are the files you will want to deploy.


### Start production

```bash
cd dist
npm start
```


## Reverse Proxy

It is recommended to set up a reverse proxy to serve static files and enable HTTPS.

Example Nginx configuration:

```nginx
server {
    listen 80;
    listen 443 ssl;
    
    server_name booru.example.com;
    
    # Uncomment to override thumbnails location
    #location ~ ^\/files\/t(..)(.*)$ { 
    #    root /path/to/thumbnails;
    #    try_files /t$1/$1$2 =404;
    #}
    
    location ~ ^\/files\/(.)(..)(.*)$ {
        root /path/to/files; # hydrus's files location (eg: client_files folder inside hydrus's db folder)
        try_files /$1$2/$2$3 =404;
    }
    
    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_pass http://localhost:3939/;
    }
}
```
