# Hybooru

<p align="center"><img src="static/logo.svg" width="256"></p>

Hydrus-based booru-styled imageboard in React, inspired by [hyve](https://github.com/imtbl/hyve).

Demo: https://booru.funmaker.moe/

[API Documentation](API.md)

[Changelog](CHANGELOG.md)

Hybooru uses its own PostgreSQL database, populated using metadata from Hydrus' SQLite
database. Files are not cloned and served directly from Hydrus's database. You need to
regenerate the Hybooru's database every time you want to update it. Make sure to
properly configure `configs.json` file. **Stop Hydrus when you regenerate HyBooru'
database if you plan to use live Hydrus' database (use hydrus backup instead if
possible)**


## Features

- Searching by tags
- Negative search
- Ratings
- Sorting (date imported, rating, size, etc)
- Searching tags and autocomplete
- Colored tags
- REST API
- Mobile support
- OpenGraph and OpenSearch
- Works without JS in browser


## Searching Query

Searching tries to imitate classical booru's syntax. All tags are lowercase and use `_` instead of space character.
You can also use `?` to match for single character(eg: `?girl`) and `*` to match number of characters(eg: `blue_*`).
Patterns prefixed with `-` will be excluded from results. Patterns are matched against tag's name, but
Hydrus's `namespace:subtag` syntax is also supported.

Additionally you can sort results by including `order:*` in query. Supported sorts are: `order:posted`(date),
`order:id`, `order:rating`, `order:size`. You can also append `_desc` or `_asc` to specify order(eg: `order:posted_asc`).
If not specified, post are sorted by date descending.

Eg: `1girl blue_* -outdoors order:rating_desc`


## Configuration

Hybooru's config is stored in `configs.json` file in the project's root directory.

Name            | Type   | Default | Comment
--------------- | ------ | --- | ---
port            | number | `3939` | HTTP server port.
hydrusDbPath    | string or null | `null` | Hydrus db or backup location. If null, default platform-dependent locaton is used: `%appdata%/hydrus/db`(Windows), `~/.local/share/hydrus/db`(Linux), `~/Library/Preferences/hydrus/db`(MacOS)
appName         | string | `"Hybooru"` | Specify name of your booru (appears as logo).
appDescription  | string | `"Hydrus-based booru-styled imageboard in React"` | Booru's description used in OpenGraph.
adminPassword   | string or null | `null` | Password used to regenerate database (can be accessed from the cog button). Null disables manual database regeneration.
isTTY           | boolean or null | `null` | Overrides colorful/fancy output. `true` forces, `false` disables, `null` automatically determines. Useful when piping output.
importBatchSize | boolean or null | `10000` | Base batch size used during importing. Decrease it if hybooru crashes during import
filesPathOverride | string or null | `null` | Overrides location of post's files. If `null`, `client_files` inside hydrus's db folder is used.
thumbnailsPathOverride | string or null | `null` | Overrides location of post's thumbnails. If `null`, `filesPathOverride` is used.
db              | PoolConfig | local database | node-postgres config object. See https://node-postgres.com/api/client for more details. By defaults it attempts to connect to `hybooru` database at `localhost` using `hybooru` as password.
tags            | object |  | Options related to tags.
tags.motd       | string or object or null | `null` | Tag pattern used to search for random image displayed on main page. You can also specify object to specify different tags for different themes(use `light`, `dark` and `auto` as keys)
tags.untagged   | string | `"-*"` | Overrides tag pattern used to determine which posts require tagging. Default `"-*"` matches all posts with no tags.
tags.ignore     | string[] | `[]` | List of tags patterns that will not be imported from Hydrus (posts tagged by these tags will still be imported).
tags.blacklist  | string[] | `[]` | All posts and tags matching any of specified tag patterns will not be imported from Hydrus.


## Development

### Run development

```bash
npm run start
```

### Build production

```bash
npm run build:prod
```

Output is saved to `dist/` folder in project's root directory.

### Start production

```bash
npm run start:prod
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
