
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
var isPutting = false;

/**Tools**/
var notInTable = function(data,id,callback){
    for(var i=0;i<data.length;i++){
        if(data[i].deezerID==id) {
            callback(id);
            return;
        }
    }
    callback(-1);
};

app.get('/playlist/currentTrack', function (request, response) {
    response.json(currentTrack);
});

app.get('/playlist/proposedTracks', function (request, response) {
    response.json(proposedTracks);
    /*couchDBClient.GET('ProposedTracks',function(resp){
     response.json(resp);
     });*/
});

app.get('/playlist/previousTracks', function (request, response) {
    response.json(previousTracks);
});

app.get('/albums', function (request, response) {
    couchDBClient.GET('Albums',function(resp){
        response.json(resp);
    });
});

app.get('/albums/:id', function (request, response) {
    couchDBClient.GET('Albums',function(resp){
        response.send(resp[request.params.id]);
    });
});

app.get('/tracks', function (request, response) {
    couchDBClient.GET('Tracks',function(resp){
       response.json(resp);
    });
});

app.get('/tracks/:id', function (request, response) {
    couchDBClient.GET('Tracks',function(resp){
       response.json(resp[request.params.id]);
    });
});

app.put('/tracks/album/:albumID', function (request, response) {
    if(!isPutting) {
        var albumID = request.params.albumID;
        console.log(albumID);
        couchDBClient.GET('Albums', function (albums) {
            couchDBClient.GETall('Tracks', function (jsonData) {
                new deezer().getAlbumTracks(albums[albumID].id, function (resp) {
                    var tracks = resp;
                    for (var i = 0; i < tracks.length; i++) {
                        notInTable(jsonData.data, tracks[i].id, function (id) {
                            if (id == -1) {
                                jsonData.data.push(JSON.parse('{' +
                                '"deezerID" : "' + tracks[i].id +
                                '", "title" : "' + tracks[i].title +
                                '", "preview" : "' + tracks[i].preview +
                                '", "albumID" : "' + albumID +
                                '"}'));
                            }
                        });
                    }
                    couchDBClient.PUT('Tracks', jsonData, function () {
                        console.log("done");
                        response.end();
                    });
                });
            });
        });
    }
});

app.get('/test/params', function (request, response) {
    var param = request.params.name;
    response.send(param);
})

app.put('/playlist/:trackID', function(request, response) {
    var trackID = request.params.trackID;
    new couchDBClient.GETall("ProposedTracks", function(jsonData){
        notInTable(jsonData.data, trackID, function(id){
            if(id>-1){
                jsonData.data[id].vote++;
            } else {
                jsonData.data.push(JSON.parse('{' +
                '"trackID" : "' + trackID +
                '", "votes" : "0"' +
                '", "status" : "waiting"' +
                '"}'));
            }
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





