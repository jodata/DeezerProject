
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
var position = 0;

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
                            //On leur applique un id-2 car les 2 premières track sont shift
                            proposedTracks.push({id:i-2,trackID:prevTrack.trackID,deezerID:track.deezerID,title:track.title,artist:albums[track.albumID].artist,cover:albums[track.albumID].cover,votes:prevTrack.votes});
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

app.get('/playlist/position', function (request, response) {
    response.json(position);
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
    response.json(albums);
});

app.get('/albums/:id', function (request, response) {
    response.json(albums[request.params.id]);
});

app.get('/tracks', function (request, response) {
    response.json(tracks);
});

app.get('/tracks/:id', function (request, response) {
    response.json(tracks[request.params.id]);
});

app.get('/search/:query', function (request, response) {
    new deezer().getSearchResult(request.params.query,function(resp,err){
        if(!err)
            response.json(resp);
        else console.log(err);
    });
});

/**********
 *   PUT  *
 **********/

app.put('/playlist/:trackID', function(request, response) {
    var trackID = parseInt(request.params.trackID);
    db.get('ProposedTracks', { data: true }, function(err, jsonData) {
        if (!err) {
            notInProposedTracks(jsonData.data, trackID, function (id) {
                console.log(id);
                if (id > -1) {
                    response.send(jsonData.data[id].votes.toString());
                } else {
                    jsonData.data.push({id: jsonData.data.length, trackID: trackID, votes: 0, status: 'playlist'});
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
app.post('/album/:albumID',function(request, response){
    var albumID = request.params.albumID;
    notInTable(albums,albumID,function(res){
        if(res==-1){
            new deezer().getAlbum(albumID, function(deezerAlbum,err){
                if(!err){
                    db.get('Albums', { data: true }, function(err, albumsData) {
                        if (!err){
                            var album = {id:albumsData.data.length,deezerID:deezerAlbum.id,title:deezerAlbum.title,artist:deezerAlbum.artist.name,cover:deezerAlbum.cover};
                            albums.push(album);
                            albumsData.data.push(album);
                            db.insert(albumsData, function (err, respAlbum) {
                                if(!err){
                                    new deezer().getAlbumTracks(albumID,function(albumTracks,err){
                                        if(!err){
                                            db.get('Tracks',{data:true},function(err,tracksData){
                                                if(!err){
                                                    var offsetId = tracksData.data.length;
                                                    for(var i=0;i<albumTracks.length;i++){
                                                        var track = {id:offsetId+i,deezerID:albumTracks[i].id,title:albumTracks[i].title,albumID:albumsData.data.length-1};
                                                        tracks.push(track);
                                                        tracksData.data.push(track);
                                                    }
                                                    db.insert(tracksData, function (err, respTracks) {
                                                        if(!err){
                                                            response.json(albums);
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    })
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

app.post('/playlist/nextTrack', function (request, response) {
    previousTracks.push(currentTrack);
    if(previousTracks.length>3)
        previousTracks.shift();
    currentTrack = proposedTracks.shift();

    response.json(currentTrack);
});

app.post('/playlist/calculVotes', function (request, response) {
    var track = request.body;
    if(currentTrack.trackID == track.trackID) {

        var res = null;
        var max = -1;
        var index = -1;
        for (var i = 0; i < proposedTracks.length; i++) {
            if (proposedTracks[i].votes > max) {
                max = proposedTracks[i].votes;
                res = proposedTracks[i];
                index = i;
            }
            //proposedTracks[i].votes = 0;
        }
        previousTracks.push(currentTrack);
        if (previousTracks.length > 3)
            previousTracks.shift();
        if(afterTrack!=null)
            currentTrack = afterTrack;
        else{
            var id = Math.floor((Math.random() * tracks.length));
            currentTrack = {trackID:id,deezerID:tracks[id].deezerID,title:tracks[id].title,artist:albums[tracks[id].albumID].artist,cover:albums[tracks[id].albumID].cover};
        }
        position = 0;
        afterTrack = res;
        proposedTracks.splice(index, 1);

        for (var i = 0; i < proposedTracks.length; i++) {
            proposedTracks[i].id = i;
        }
        response.send("true");
    }
    else {
        response.send("false");
    }
});

app.post('/playlist/vote/:idTrack', function (request, response) {
    var idTrack = parseInt(request.params.idTrack);
    proposedTracks[idTrack].votes++;
    response.json(proposedTracks[idTrack].votes);
});

app.post('/playlist/position' , function (request, response) {
    var data = request.body;
    if(data.pos > position && data.trackID == currentTrack.trackID)
        position = data.pos;
    //console.log(position);
    response.send("ok");
});

app.post('/playlist/add/:trackID', function(request, response) {
    var trackID = parseInt(request.params.trackID);
    var track = tracks[trackID];
    if(afterTrack==null){
        afterTrack={id:proposedTracks.length,trackID:track.id,deezerID:track.deezerID,title:track.title,artist:albums[track.albumID].artist,cover:albums[track.albumID].cover};
    }
    notInProposedTracks(proposedTracks, trackID, function (id) {
        if (id > -1 || afterTrack.deezerID==track.deezerID) {
            response.send("already in playlist");
        } else {
            proposedTracks.push({id:proposedTracks.length,trackID:track.id,deezerID:track.deezerID,title:track.title,artist:albums[track.albumID].artist,cover:albums[track.albumID].cover,votes:1});
            response.json(proposedTracks[proposedTracks.length-1]);
        }
    });


});

var server = app.listen(3000, function () {
    console.log('Listening at http://localhost:%s', server.address().port);
});