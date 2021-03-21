
### TODO:

- Gallery
- API docs
- Search by rating
- NeedsTags tag configuration
- RegenDB panel
- optimize page size
- optimize SQL
- 3rd party license file
- Improve README.md
- Handling txt/unknown files
- 404 on missing files
- error pages
- meta tags, description, keywords, etc
- search tag (html header)


# Unreleased

- Improved DB import
- Added Dark Theme
- Added dynamic HTML titles
- Added Open Graph protocol
- Added favicon (by Ostrich)
- Added CSRF mitigation


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
