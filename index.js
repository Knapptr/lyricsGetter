// Files are written with 'export default data' to export for browser use.
const fs = require("fs");
require("dotenv").config();
const {exec} = require('child_process');
const axios = require("axios");
const totalPages = process.argv.slice(2)[0];
const artistNameArg = encodeURIComponent(process.argv.slice(2)[1]);
const artistIDArg = process.argv.slice(2)[2];

///api values
const baseURL = `https://api.musixmatch.com/ws/1.1/`;
const apiKey = `apikey=${process.env.API_KEY}`;
const artistSearch = `artist.search?`;
const trackSearch = `track.search?`;
const lyricsSearch = `track.lyrics.get?`;

console.clear();
console.log("Running Script");
console.log(
  `totalPages: ${totalPages}\nartistName: ${artistNameArg}\nartistID: ${artistIDArg}`
);
// argument error handling
if (!artistNameArg || !totalPages) {
  console.log("Hey! You need some arguments!\n");
  console.log("command should look like this: ");
  console.log("node index.js [totalPages] [artistName] [artistID].");
  console.log(
    "artistID is optional. If not supplied, will query DB with artistName, and use first result"
  );
  process.exit(1);
}

const regex = /\ /g
const joinedArtistNameForFileName =  process.argv.slice(2)[1].replace(regex, "_");

//////////////////// Artist ID logic
async function getArtistID(artistName) {
  let data = await axios(
    `${baseURL}${artistSearch}q_artist=${artistName}&${apiKey}`
  );
let artistIDResult = data.data.message.body.artist_list[0].artist.artist_id;
	console.log(artistIDResult);
  return artistIDResult
}

///////////////////////// track search(all!)

async function getTrackInformation(artistId) {
  let promises = [];
  let tracks = [];
  for (let i = 1; i <= totalPages; i++) {
    promises.push(
      axios(
        `${baseURL}${trackSearch}f_artist_id=${artistId}&f_has_lyrics=1&page_size=100&page=${i}&${apiKey}`
      ).then((data) => {
        return data;
      })
    );
  }
  let data = await Promise.all(promises);
  let trackInfo = [];
  data.forEach((response) => {
    const allTracks = response.data.message.body.track_list;
    allTracks.forEach((entry) => {
      const track = entry.track;
      trackInfo.push({ trackName: track.track_name, trackId: track.track_id });
    });
  });
  return trackInfo;
}

////////////////////////////////////////Get Lyrics from track array

async function getLyrics(array) {
  let allRequests = [];
  array.forEach((trackEntry) => {
    allRequests.push(
      axios(
        `${baseURL}${lyricsSearch}track_id=${trackEntry.trackId}&${apiKey}`
      ).then((response) => {
        return {
          artist: joinedArtistNameForFileName,
          trackName: trackEntry.trackName,
          trackId: trackEntry.trackId,
          lyrics: response.data.message.body.lyrics.lyrics_body,
        };
      })
    );
  });
  let lyricsArray = Promise.all(allRequests);
  return lyricsArray;
}

////////////////////////

async function requestLogic() {
  let artistID;
  if (!artistIDArg) {
    artistID = await getArtistID(artistNameArg);
  } else {
    artistID = artistIDArg;
  }
  let allTracks = await getTrackInformation(artistID);
  let allLyrics = await getLyrics(allTracks);
	console.log(allLyrics)
	if(allLyrics.length === 0){
		console.log("Lyrics came back blank. Sometimes this happens with strange artist name formatting. Tips: Try omitting 'the' in artist names")
		process.exit(1);
	}
  return allLyrics;
}

////////////////////////////////////////
//        FILE SYSTEM PROCESS         //
////////////////////////////////////////

console.log("Creating File Structure");
try {
  fs.mkdirSync("./Data");
} catch (error) {
  console.log("Directory exists, using pre-existing directory");
}
console.log("Creating JS File");
fs.writeFileSync(`./Data/${joinedArtistNameForFileName}.js`, "const data = ");

console.log("Making requests . . . ");
requestLogic().then((allLyrics) => {
  console.log("Parsing to JSON string");
  let jsonObj = {};
  jsonObj.data = allLyrics;
  let stringyboi = JSON.stringify(jsonObj);
  console.log("Writing data to files");
  fs.appendFileSync(`./Data/${joinedArtistNameForFileName}.js`, stringyboi);
  fs.writeFileSync(`./Data/${joinedArtistNameForFileName}.json`, stringyboi);

  fs.appendFileSync(`./Data/${joinedArtistNameForFileName}.js`, "\n export default data;");
  console.log("Done.");
});
