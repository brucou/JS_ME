/**
 *
 :w
 :q
 * Created by bcouriol on 16/06/14.
 */
var http = require('http');
var express = require('express');
var app = express();
const PREFIX_DIR_SERVER='../server';
const PREFIX_DIR_CLIENT='..';

// Set the view engine
app.set('view engine', 'jade');
// Where to find the view files
app.set('views', PREFIX_DIR_SERVER + '/views');

app.use(express.static(PREFIX_DIR_CLIENT + ''));

// A route for the home page - will render a view
app.get('/', function(req, res) {
   res.render('hello');
});
// A route for /say-hello - will render a view
app.get('/say-hello', function(req, res) {
   res.render('hello');
});
app.get('/test', function(req, res) {
   res.send('this is a test');
});
http.createServer(app).listen(3000, function() {
   console.log('App started');
});
