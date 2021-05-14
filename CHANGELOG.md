
### TODO:

- DMCA page
- Optimize tag relation resolving
- Importing tag repository mappings/relations
- Display tag relations in tag search page
- IPFS integration
- Fix `Error: Request aborted`
- Scroll bug when clicking on tag name while being scrolled down in search(needs confirmation)
- Sorting and rating buttons do not have text in mobile/chrome
- Hide db regen button if password not set
- Investigate potential hour long going requests
- Add zoom in to gallery
- Research if VACUUMing has any value


# Unreleased

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
