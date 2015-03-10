
var express = require('express');

var app = express();
app.use( express.static('.') );
app.listen(8080, function () {
    console.log('Listening at http://localhost:8080');
});
