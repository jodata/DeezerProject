
var express    = require('express');
var bodyParser = require('body-parser');
var cors       = require('cors');
var couchDBClient = require('./couchDBClient');
var deezer = require('./DeezerClient');

var app = express();
app.use(bodyParser.json());
app.use( cors() );


var currentTrack   = null;
var proposedTracks = [60946206, 60946207, 60946208, 60946209];
var previousTracks = [ ];
var albums = [ ];
var couchDBClient = new couchDBClient();

/**Tools**/
var notInTracks = function(data,id,callback){
    for(var i=0;i<data.length;i++){
        if(data[i].deezerID==id)
            return;
    }
    callback();
};

app.get('/playlist/currentTrack', function (request, response) {
    response.json(currentTrack);
});

app.get('/playlist/proposedTracks', function (request, response) {
    response.json(proposedTracks);
});

app.get('/playlist/previousTracks', function (request, response) {
    response.json(previousTracks);
});

app.get('/albums', function (request, response) {
    couchDBClient.GET('Albums',function(resp){
        response.json(resp);
    });
});

app.put('/tracks/album/:albumID', function (request, response) {
    var albumID = request.params.albumID;
    couchDBClient.GETall('Tracks', function(jsonData){
        new deezer().getAlbumTracks(albumID,function(resp){
            var tracks=resp;
            for(var i=0;i<tracks.length;i++){
                notInTracks(jsonData.data,tracks[i].id,function() {
                    jsonData.data.push(JSON.parse('{' +
                    '"deezerID" : "' + tracks[i].id +
                    '", "title" : "' + tracks[i].title +
                    '", "preview" : "' + tracks[i].preview +
                    '"}'));
                });
            }
            couchDBClient.PUT('Tracks',jsonData,function(){
                response.end();
            });
        });
    });
});

app.post('/playlist/nextTrack', function (request, response) {
    previousTracks.push(currentTrack);
    currentTrack = proposedTracks.shift();


    console.log("Current Track: "   + currentTrack);
    console.log("Proposed Tracks: " + proposedTracks);
    console.log("Previous Tracks: " + previousTracks);
    console.log("");

    response.json(currentTrack);
});
var server = app.listen(3000, function () {
    console.log('Listening at http://localhost:%s', server.address().port);
});





