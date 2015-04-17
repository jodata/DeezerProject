
var express    = require('express');
var bodyParser = require('body-parser');
var cors       = require('cors');
var deezer = require('./DeezerClient');
var nano = require('nano')('http://localhost:5984');
var db = nano.db.use('deezer');

var app = express();
app.use(bodyParser.json());
app.use( cors() );


var albums;
var tracks;
var currentTrack   = null;
var afterTrack   = null;
var proposedTracks = [];

db.get('Albums', { data: true }, function(err, body) {
    if (!err){
        albums=body.data;
        db.get('Tracks', { data: true }, function(err, body) {
            if (!err) {
                tracks = body.data;
                db.get('ProposedTracks', { data: true }, function(err, body) {
                    if (!err){
                        for(var i=0;i<body.data.length;i++){
                            var prevTrack = body.data[i];
                            var track = tracks[prevTrack.trackID];
                            proposedTracks.push({trackID:prevTrack.trackID,deezerID:track.deezerID,title:track.title,artist:albums[track.albumID].artist,cover:albums[track.albumID].cover,votes:prevTrack.votes});
                        }
                        currentTrack=proposedTracks.shift();
                        afterTrack=proposedTracks.shift();
                    }
                });
            }else{
                console.log(err);
            }
        });
    }
});


var previousTracks = [ ];

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
var notInProposedTracks = function(data,id,callback){
    for(var i=0;i<data.length;i++){
        if(data[i].trackID==id) {
            callback(id);
            return;
        }
    }
    callback(-1);
};

/**********
 * GETTER *
 **********/

app.get('/playlist/currentTrack', function (request, response) {
    response.json(currentTrack);
});

app.get('/playlist/afterTrack', function (request, response) {
    response.json(afterTrack);
});

app.get('/playlist/proposedTracks', function (request, response) {
    response.json(proposedTracks);
});

app.get('/playlist/previousTracks', function (request, response) {
    response.json(previousTracks);
});

app.get('/albums', function (request, response) {
    db.get('Albums', { data: true }, function(err, body) {
        if (!err){
            response.json(body.data);
        }
    });
});

app.get('/albums/:id', function (request, response) {
    db.get('Albums', { data: true }, function(err, body) {
        if (!err){
            response.send(resp[request.params.id]);
        }
    });
});

app.get('/tracks', function (request, response) {
    db.get('Tracks', { data: true }, function(err, body) {
        if (!err){
            response.json(body.data);
        }
    });
});

app.get('/tracks/:id', function (request, response) {
    db.get('Tracks', { data: true }, function(err, body) {
        if (!err){
            response.send(resp[request.params.id]);
        }
    });
});

/**********
 *   PUT  *
 **********/

app.put('/tracks/album/:albumID', function (request, response) {
    if(!isPutting) {
        var albumID = parseInt(request.params.albumID);
        db.get('Albums', { data: true }, function(err, body) {
            if (!err) {
                var albums=body.data;
                db.get('Tracks', { data: true }, function(err, jsonData) {
                    if (!err) {
                        new deezer().getAlbumTracks(albums[albumID].deezerID, function (resp) {
                            var tracks = resp;
                            var offset_id = jsonData.data.length;
                            for (var i = 0; i < tracks.length; i++) {
                                notInTable(jsonData.data, tracks[i].id, function (id) {
                                    console.log(tracks[i].title + " " + id);
                                    if (id == -1) {
                                        jsonData.data.push({
                                            id:offset_id+i,
                                            deezerID: tracks[i].id,
                                            title: tracks[i].title,
                                            preview: tracks[i].preview,
                                            albumID: albumID
                                        });
                                    } else console.log("in Table");
                                });
                            }
                            db.insert(jsonData, function (err, body) {
                                if (!err) {
                                    response.send(body.ok);
                                } else {
                                    response.send(body);
                                    console.log(body);
                                }
                            });
                        });
                    }
                });
            }
        });
    }
});

app.put('/playlist/:trackID', function(request, response) {
    var trackID = parseInt(request.params.trackID);
    db.get('ProposedTracks', { data: true }, function(err, jsonData) {
        if (!err) {
            notInProposedTracks(jsonData.data, trackID, function (id) {
                console.log(id);
                if (id > -1) {
                    response.send(jsonData.data[id].vote.toString());
                } else {
                    jsonData.data.push({trackID: trackID, votes: 0, status: 'playlist'});
                    db.insert(jsonData, function (err, body) {
                        if (!err) {
                            response.send(body.ok);
                        } else {
                            response.send("erreur");
                        }
                    });
                }
            });
        }
    });
});

/**********
 *  POST  *
 **********/
app.post('/playlist/nextTrack', function (request, response) {
    previousTracks.push(currentTrack);
    if(previousTracks.length>3)
        previousTracks.shift();
    currentTrack = proposedTracks.shift();

    response.json(currentTrack);
});
var server = app.listen(3000, function () {
    console.log('Listening at http://localhost:%s', server.address().port);
});





