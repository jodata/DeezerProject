var httpClient = require('./httpClient');

var CouchDBClient = module.exports = function() {
    var couchDBPath = "http://localhost:5984/deezer/{_}";

    this.GET = function(table,callback){
        var url = couchDBPath.replace('{_}', encodeURIComponent(table));
        new httpClient().GET(url, function(resp){
            callback(JSON.parse(resp.body).data);
        });
    }

    this.GETall = function(table,callback){
        var url = couchDBPath.replace('{_}', encodeURIComponent(table));
        new httpClient().GET(url, function(resp){
            callback(JSON.parse(resp.body));
        });
    }

    this.PUT = function(table, data,callback){
        var url = couchDBPath.replace('{_}', encodeURIComponent(table));
        new httpClient().PUT(url, JSON.stringify(data), callback);
    }
}