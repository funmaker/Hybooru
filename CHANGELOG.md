
### TODO:

- fix very long tags fetch on last pages with a lot of tags
- DMCA page
- IPFS integration
- Fix `Error: Request aborted`
- Scroll bug when clicking on tag name while being scrolled down in search(needs confirmation)
- Investigate potential hour long going requests
- Add zoom in to gallery
- Research if VACUUMing has any value
- Invalid sequence during import
- Option to disable notes/urls/etc
- Fix ruffle in popup gallery


# Unreleased


# v1.13.0

- Added DB_* config override env variables (#53)
- Fixed filtered Random Post being limited to the first cache page (#55)
- Fixed github version check getting stuck on request error
- Removed error messages on ECONNABORTED connections (#56)


# v1.12.4

- Fixed github api being spammed on long imports
- Fixed importer failing when a post has multiple identical notes


# v1.12.3

- Added healthcheck to Dockerfile


# v1.12.2

- Popup gallery now stops all off-screen media from playing instead of just muting videos
- Fixed videos not reloading when navigating between posts


# v1.12.1

- Removed leftover adminPassword


# v1.12.0

- Updated for Hydrus v586 (https://github.com/funmaker/Hybooru/issues/45)
- Added rating.service config that can accept either id number or string name of the rating service
- Deprecated rating.serviceName in favor of rating.service
- Fixed error while importing tags with multiple independent preferred siblings
- Fixed deprecated config options overriding properly named options on conflict 


# v1.11.0

- Updated for Hydrus v559


# v1.10.0

- Added support for `system:inbox`, `system:archive` and `system:trash` (https://github.com/funmaker/Hybooru/issues/25)
- Added `host` config option (https://github.com/funmaker/Hybooru/issues/38)
- Added support for PORT and HOST envvar override
- Removed DOCKERIZED envvar, Dockerfile now uses PORT (https://github.com/funmaker/Hybooru/issues/36)
- Fixed faulty tag loop detection (https://github.com/funmaker/Hybooru/issues/39)


# v1.9.0

- Added Flash support via Ruffle (https://github.com/funmaker/Hybooru/issues/34)
- Added blurhash support
- Added Hydrus version check
- Added support to override admin password using `HYDRUS_ADMIN_PASSWORD` environmental variable (https://github.com/funmaker/Hybooru/issues/35)
- Added setting to control thumbnail fading
- Added config option to control thumbnail scaling
- Fixed thumbnail fading


# v1.8.0

- Added support for notes (https://github.com/funmaker/Hybooru/issues/31)
- Added `Random` button to draw a random image from the search pool (https://github.com/funmaker/Hybooru/issues/24)
- Added support for full queries in motd (https://github.com/funmaker/Hybooru/issues/3)
- Added searching sha256/md5 hashes
- Added tag siblings and parents on tags search page and api. Tag siblings will no longer appear as "primary" results, 
  but only as associated records. They can still be searched but will return the preferred sibling instead.
- Added `full` flag for `/api/tags` endpoint, allowing to query tags siblings and parents as well.
- Updated Docker Node target to v18.12.0
- Fixed Internal Server Error on invalid post id
- Fixed Motd only working with images
- Fixed tags not being negated when pressed `-` tag button with JS enabled
- Fixed handling of recently added content types from Hydrus (https://github.com/funmaker/Hybooru/issues/33)
- Deprecated `hash` field in `Post` and `PostSummary`


# v1.7.1

- Fixed import crashing on multi-service tag sibling conflict


# v1.7.0

- Added version check
- Added docs for `/api/regendb`
- Removed CSRF tokens
- Fixed import crashing on tag collisions


# v1.6.0

- Added support for choosing file services (https://github.com/funmaker/Hybooru/issues/18)
- Added support for filtering services by ids
- Added `tags.printLoops` config option to print tag relationships loops
- Added `tags.searchSummary` config option to control how many tags appear on side menu when searching posts
- Added `posts` config category and moved all posts related config options there
- Added support for Node v19 (https://github.com/funmaker/Hybooru/issues/19)
- Deprecated old config options
- Fixed import getting suck in case of loops in parent tag relationships
- Fixed siblings tag relationships not getting normalized in case of a sibling relationship loop (Fixes https://github.com/funmaker/Hybooru/issues/17)
- Fixed inaccuracies in API.md
- Fixed web crawlers following tag links and indexing random search terms


# v1.5.0

- Added support for importing from multiple tag services/repositories
- package-lock.json is now included in production builds


# v1.4.8

- Security update


# v1.4.7

- Resolves problem with new OpenSSL in newer Node https://github.com/webpack/webpack/issues/14532


# v1.4.6

- Fixed compatibility problems with newer node/npm
- Improved full-height post page style


# v1.4.4

- Updated for Hydrus v447


# v1.4.3

- Optimized Docker image (by [98WuG](https://github.com/98WuG))


# v1.4.2

- Added support for large files (2GB+)
- Rebuild Database button now hides if password is not set
- Fixed broken bugged gallery after page refresh
- Fixed sorting and rating buttons not having text in mobile/chrome browsers
- Fixed rating stars not hiding if rating is disabled 


# v1.4.1

- Updated to Node v16.1.0
- Added support for scroll wheel in gallery
- Disabled animation in gallery when using keyboard buttons


# v1.4.0

- Added mobile-friendly Popup Gallery
- Added server-side and client-side cache
- Added autoplay to videos
- Added navigation using arrow keys in autocomplete box
- Added option to show namespaces
- Added option to disable image height limit
- Added option to rebuild database
- Added option to set page size
- Added post relations (alternatives, duplicates)
- Added tag relations (siblings, parents)
- Added tag whitelist
- Added rating configuration and filtering
- Added files and thumbnails path override configuration
- Added example Nginx reverse proxy configuration
- Theme now defaults to browser preferences until changed
- Optimized client rendering
- Improved documentation
- Improved unknown/binary/missing file handling
- Fixed handling of subtags containing `:` character
- Fixed negative search autocomplete
- Fixed Hydrus database not being closed gracefully
- Fixed page title not updating when traversing browser history


# v1.3.0

- Complete DB import rewrite
- Indexing and SQL optimizations
- Added Dark Theme
- Added dynamic HTML titles
- Added Open Graph protocol
- Added favicon (by Ostrich)
- Added CSRF mitigation
- Added isTTY option
- Added "Untagged" stat query configuration
- Added more HTML meta tags and robots.txt
- Added OpenSearch protocol support
- Added result count in search page
- Improved error handling
- Fixed `client.js.LICENSE.txt` not being served in production build 
- Fixed untagged images not showing


# v1.2.0

- Added source URLs in Post page.
- Added `sources` in Post
- API will now always return dates at UTC timezone
- Fixed 500 HTTP Error when post has no tags


# v1.1.0

- Added `posted` in PostSummary
- Added `extension` in PostSummary and Post
- Database rebuild no longer drops everything owned by user
- Fixed page endpoints defaulting to application/json when Accepts HTTP header is ambiguous.
- Fixed anchors with # causing fetch data
- Fixed auto pagination not working on large screens
- Fixed "Post Not Found" flashing when entering Post page


# v1.0.0

- First Release
