
var express    = require('express');
var bodyParser = require('body-parser');
var cors       = require('cors');
var couchDBClient = require('./couchDBClient');

var app = express();
app.use(bodyParser.json());
app.use( cors() );


var currentTrack   = null;
var proposedTracks = [60946206, 60946207, 60946208, 60946209];
var previousTracks = [ ];
var albums = [ ];


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
    new couchDBClient().GET('Albums',function(resp){
        response.json(resp);
    });
});

app.put('/tracks/album', function (request, response) {
    console.log(request);
    response.json("jean-mi");
    /*new couchDBClient().PUT('Albums', '{"salut":"salut"}',function(resp){
        response.json(resp);
    });*/
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





