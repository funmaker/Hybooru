# HyBooru

Hydrus-based booru-styled imageboard in React, inspired by [hyve](https://github.com/imtbl/hyve).

Demo: https://booru.funmaker.moe/

[CHANGELOG.md](CHANGELOG.md)

HyBooru uses its own PostgreSQL database, populated using metadata from Hydrus' SQLite
database. Files are not cloned and served directly from Hydrus's database. You need to
regenerate the HyBooru's database every time you want to update it. Make sure to
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
