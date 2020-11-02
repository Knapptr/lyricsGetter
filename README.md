# lyricsGetter
Node script for pulling lyrics from Musixmatch API. For local use only.

## Syntax
`index.js` takes 3 arguments:
1. number of pages of results (each page is 100)
2. artist name
3. (optional) known artist ID

if artist ID is not supplied, api is queried for artist name, and uses first result's ID.
## Env
.env must have API_KEY.

## Shell Script
The bash script was used to pull for a **MBMBAM** inspired project lyric guessing game.


