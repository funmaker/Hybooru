# Hybooru

<p align="center"><img src="static/logo.svg" width="256"></p>

Hydrus-based booru-styled imageboard in React, inspired by [hyve](https://github.com/imtbl/hyve).

Demo: https://booru.funmaker.moe/

[CHANGELOG.md](CHANGELOG.md)

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
- Works without JS in browser

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

## Usage

### Run development

```bash
npm run start
```

### Build production

```bash
npm run build:prod
```

### Start production

```bash
npm run start:prod
```
