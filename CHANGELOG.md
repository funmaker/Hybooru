
### TODO:

- DB Generation Streaming and Progress Bar
- Gallery
- OpenGraph
- API docs
- Search by rating
- NeedsTags tag configuration
- RegenDB panel
- optimize page size
- optimize SQL
- Dark mode
- 3rd party license file
- Improve README.md
- Handling txt/unknown files

# Unreleased

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
