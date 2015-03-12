var httpClient = require('./httpClient');

var CouchDBClient = module.exports = function() {
    var couchDBPath = "https://localhost:5984/deezer/{_}";

    this.GET = function(table,callback){
        var url = couchDBPath.replace('{_}', encodeURIComponent(table));
        new httpClient().GET(url, function(resp){
            callback(JSON.parse(resp.body).data);
        });
    }

    this.PUT = function(table, data,callback){
        var url = couchDBPath.replace('{_}', encodeURIComponent(table));
        new httpClient().PUT(url, data, callback);
    }
}