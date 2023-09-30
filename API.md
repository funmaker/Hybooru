
# Api Documentation

Hybooru offers REST API for fetching data and management. All requests
are done over HTTP. GET requests should be url-encoded, POST requests
should be sent as json inside http body. Responses are sent as jsons
as well.


## GET /api/post

Searches posts by a text query.

### Request

| Name     | Type    | Comment                                                     |
|----------|---------|-------------------------------------------------------------|
| query    | string  | _(optional)_ Search query. eg: `"1girl blue_sky striped_*"` |
| page     | number  | _(optional)_ 0-indexed number of page to fetch.             |
| pageSize | number  | _(optional)_ Ignored if larger than the default page size.  |
| hashes   | boolean | _(optional)_ Includes md5 in results.                       |
| blurhash | boolean | _(optional)_ Includes blurhash and dimensions in results.   |

### Response

| Name     | Type                          | Comment                        |
|----------|-------------------------------|--------------------------------|
| posts    | [PostSummary](#PostSummary)[] | Results                        |
| total    | number                        | Total amount of matched posts. |
| pageSize | number                        | Actual page size.              |

### PostSummary

| Name      | Type           | Comment                                                                                                                                                 |
|-----------|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| id        | number         | Post's unique id.                                                                                                                                       |
| sha256    | string         | sha256 hash of the file.                                                                                                                                |
| hash      | string         | _(deprecated)_ sha256 hash of the file. use sha256 field instead.                                                                                       |
| md5       | string         | _(optional)_ md5 hash of the file. Present iff `hash` parameter is true.                                                                                |
| blurhash  | string or null | _(optional)_ Blurhash of the file. Present iff `blurhash` parameter is true. [Learn more](https://blurha.sh/)                                           |
| width     | number         | _(optional)_ Width of the file. Present iff `blurhash` parameter is true. [Learn more](https://blurha.sh/)                                              |
| height    | number         | _(optional)_ Height of the file. Present iff `blurhash` parameter is true. [Learn more](https://blurha.sh/)                                             |
| extension | string         | File extension, eg: `".jpg"`, `".png"`, etc                                                                                                             |
| mime      | number or null | Hydrus internal mime id. See [HydrusConstants.py](https://github.com/hydrusnetwork/hydrus/blob/master/hydrus/core/HydrusConstants.py) for more details. |
| posted    | string         | ISO 8601 date time when original post was created.                                                                                                      |


## GET /api/post/:id

Fetches post details by given `id`.

### Response

| Name      | Type                            | Comment                                                                                                                                                 |
|-----------|---------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| id        | number                          | Post's unique id.                                                                                                                                       |
| sha256    | string                          | sha256 hash of the file.                                                                                                                                |
| hash      | string                          | _(deprecated)_ sha256 hash of the file. use sha256 field instead                                                                                        |
| md5       | string                          | md5 hash of the file.                                                                                                                                   |
| extension | string                          | File extension, eg: `".jpg"`, `".png"`, etc                                                                                                             |
| size      | number or null                  | File size.                                                                                                                                              |
| width     | number or null                  | Width of the image or video.                                                                                                                            |
| height    | number or null                  | Height of the image or video.                                                                                                                           |
| duration  | number or null                  | Duration of the video or audio in milliseconds.                                                                                                         |
| nunFrames | number or null                  | Number of frames in the video.                                                                                                                          |
| hasAudio  | boolean or null                 | Whenever the video has audio.                                                                                                                           |
| rating    | number or null                  | Post's rating in 0-1 range.                                                                                                                             |
| mime      | number or null                  | Hydrus internal mime id. See [HydrusConstants.py](https://github.com/hydrusnetwork/hydrus/blob/master/hydrus/core/HydrusConstants.py) for more details. |
| posted    | string                          | ISO 8601 date time when original post was created.                                                                                                      |
| tags      | object                          | Post's tags(keys are the names, values are their global usage).                                                                                         |
| sources   | string[]                        | List of source urls.                                                                                                                                    |
| relations | [PostRelation](#PostRelation)[] | List of post relations.                                                                                                                                 |
| notes     | [PostNote](#PostNote)[]         | List of post notes.                                                                                                                                     |

### PostRelation

Same as [PostSummary](#PostSummary) with additional fields:

| Name | Type   | Comment                                                                                                     |
|------|--------|-------------------------------------------------------------------------------------------------------------|
| kind | string | `"DUPLICATE"`(duplicate), `"DUPLICATE_BEST"`(better quality duplicate), `"ALTERNATE"`(related alternative), |

### PostNote

| Name        | Type           | Comment                                                                                             |
|-------------|----------------|-----------------------------------------------------------------------------------------------------|
| label       | string or null | Title of the note.                                                                                  |
| note        | string         | Text content of the note.                                                                           |
| rect        | object or null | Optional positional information about the note. [Learn More](README.md#translationoverlay-notes)    |
| rect.top    | object or null | Vertical offset of the note from the top of the image, in percents relative to image height.        |
| rect.left   | object or null | Horizontal offset of the note from the left side of the image, in percents relative to image width. |
| rect.width  | object or null | Width of the note from the top of the image, in percents relative to image width.                   |
| rect.height | object or null | Height of the note from the top of the image, in percents relative to image height.                 |


## GET /api/tags

Searches tags by a text query.

### Request

| Name     | Type    | Comment                                                           |
|----------|---------|-------------------------------------------------------------------|
| query    | string  | _(optional)_ Single search pattern. eg: `"red_*"`, `"?girl"`, etc |
| sorting  | string  | _(optional)_ `"used"`(default) or `"id"`.                         |
| page     | number  | _(optional)_ 0-indexed number of page to fetch.                   |
| pageSize | number  | _(optional)_ Ignored if larger than the default page size.        |
| full     | boolean | _(optional)_ Includes tag siblings and parents in results.        |

### Response

| Name     | Type                        | Comment                                                                 |
|----------|-----------------------------|-------------------------------------------------------------------------|
| tags     | object                      | _(`!full`)_ Results(keys are the names, values are their global usage). |
| tags     | [TagSummary](#TagSummary)[] | _(`full === true`)_ Results                                             |
| total    | number                      | Total amount of matched tags.                                           |
| pageSize | number                      | Actual page size.                                                       |                                                                            |

### TagSummary

| Name     | Type     | Comment                              |
|----------|----------|--------------------------------------|
| name     | string   | Name of the tag, namespace included. |
| parents  | string[] | Parent list of the tag.              |
| siblings | string[] | Sibling list of the tag.             |
| posts    | number   | Total number of posts with this tag. |


## POST /api/regendb

Triggers database rebuilt, just like when `Rebuild Database`
button is pressed. Hybooru will clear it's database and fetch
everything from scratch. If there is an error during import
no data will be added or lost, nothing will change.

If `adminPassword` was not set in `configs.json` this endpoint
will return HTTP error 400.

### Request

| Name     | Type   | Comment                             |
|----------|--------|-------------------------------------|
| password | string | `adminPassword` from `configs.json` |

### Response

| Name     | Type   | Comment                       |
|----------|--------|-------------------------------|
| ok       | true   | ok                            |


