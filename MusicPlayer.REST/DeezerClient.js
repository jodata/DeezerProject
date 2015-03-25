
var httpClient = require('./httpClient');

var Deezer = module.exports = function() {

    var DEEZER_ARTIST_SEARCH = 'http://api.deezer.com/search/artist?q={_}';
    var DEEZER_ARTIST_ALBUMS = 'http://api.deezer.com/artist/{_}/albums';
    var DEEZER_SONGS_ALBUMS = 'http://api.deezer.com/album/{_}/tracks';

    this.searchArtist = function (artistName, callback) {
        var url = DEEZER_ARTIST_SEARCH.replace('{_}', encodeURIComponent(artistName) );
        new httpClient().GET(url, function (resp) {
            callback(JSON.parse(resp.body).data);
        });
    }; // method

    this.getArtistAlbums = function (artistID, callback) {
        var url = DEEZER_ARTIST_ALBUMS.replace('{_}', artistID);
        new httpClient().GET(url, function (resp) {
            callback(JSON.parse(resp.body).data);
        });
    }; // method

    this.getAlbumTracks = function (albumID, callback) {
        var url = DEEZER_SONGS_ALBUMS.replace('{_}', albumID);
        new httpClient().GET(url, function (resp) {
            callback(JSON.parse(resp.body).data);
        });
    }; // method

} // class
