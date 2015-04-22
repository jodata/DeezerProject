
var httpClient = require('./httpClient');

var Deezer = module.exports = function() {

    var DEEZER_ALBUM         = 'http://api.deezer.com/album/{_}';
    var DEEZER_SONGS_ALBUMS  = 'http://api.deezer.com/album/{_}/tracks';
    var DEEZER_QUERY         = 'http://api.deezer.com/search?q={_}';

    this.getAlbum = function (albumID, callback) {
        var url = DEEZER_ALBUM.replace('{_}', albumID);
        new httpClient().GET(url, function (resp,err) {
            callback(JSON.parse(resp.body),err);
        });
    }; // method

    this.getAlbumTracks = function (albumID, callback) {
        var url = DEEZER_SONGS_ALBUMS.replace('{_}', albumID);
        new httpClient().GET(url, function (resp,err) {
            callback(JSON.parse(resp.body).data,err);
        });
    }; // method

    this.getSearchResult = function (query, callback) {
        var url = DEEZER_QUERY.replace('{_}', query);
        new httpClient().GET(url, function (resp,err) {
            callback(JSON.parse(resp.body).data,err);
        });
    };// method

} // class
