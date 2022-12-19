
# Api Documentation

Hybooru offers REST API for fetching data and managment. All requests
are done over HTTP. GET requests should be url-encoded, POST requests
should be sent as json inside http body. Responses are sent as jsons
as well.


## GET /api/post

Searches posts by query.

### Request

| Name     | Type   | Comment                                                     |
|----------|--------|-------------------------------------------------------------|
| query    | string | _(optional)_ Search query. eg: `"1girl blue_sky striped_*"` |
| page     | number | _(optional)_ 0-indexed number of page to fetch.             |
| pageSize | number | _(optional)_ Ignored if larger than the default page size.  |

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
| hash      | string         | md5 hash of the file.                                                                                                                                   |
| extension | string         | File extension, eg: `".jpg"`, `".png"`, etc                                                                                                             |
| mime      | number or null | Hydrus internal mime id. See [HydrusConstants.py](https://github.com/hydrusnetwork/hydrus/blob/master/hydrus/core/HydrusConstants.py) for more details. |
| posted    | string         | ISO 8601 date time when original post was created.                                                                                                      |


## GET /api/post/:id

Fetches post details by given `id`.

### Response

| Name      | Type                            | Comment                                                                                                                                                 |
|-----------|---------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| id        | number                          | Post's unique id.                                                                                                                                       |
| hash      | string                          | md5 hash of the file.                                                                                                                                   |
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

### PostRelation

Same as [PostSummary](#PostSummary) with additional fields:

| Name | Type   | Comment                                                                                                     |
|------|--------|-------------------------------------------------------------------------------------------------------------|
| kind | string | `"DUPLICATE"`(duplicate), `"DUPLICATE_BEST"`(better quality duplicate), `"ALTERNATE"`(related alternative), |


## GET /api/tags

Searches tags by query.

### Request

| Name     | Type   | Comment                                                           |
|----------|--------|-------------------------------------------------------------------|
| query    | string | _(optional)_ Single search pattern. eg: `"red_*"`, `"?girl"`, etc |
| sorting  | string | _(optional)_ `"used"`(default) or `"id"`.                         |
| page     | number | _(optional)_ 0-indexed number of page to fetch.                   |
| pageSize | number | _(optional)_ Ignored if larger than the default page size.        |

### Response

| Name     | Type   | Comment                                                     |
|----------|--------|-------------------------------------------------------------|
| tags     | object | Results(keys are the names, values are their global usage). |
| total    | number | Total amount of matched tags.                               |
| pageSize | number | Actual page size.                                           |


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


