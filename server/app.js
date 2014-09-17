/**
 * Created by bcouriol on 16/06/14.
 */

/*
 NOTE : to configure postgres sql database to include czech text search, executing the following script is necessary
 as well as copying the czech files in the corresponding directory. cf. http://postgres.cz/wiki/Instalace_PostgreSQL
 CREATE TEXT SEARCH DICTIONARY cspell
 (template=ispell, dictfile = czech, afffile=czech, stopwords=czech);
 CREATE TEXT SEARCH CONFIGURATION cs (copy=english);
 ALTER TEXT SEARCH CONFIGURATION cs
 ALTER MAPPING FOR word, asciiword WITH cspell, simple;

 Then 'cs' is the name for full text search
 */

// TODO : define a list (script file to create table) with important words -> to_tsquery, be careful with syntax 'word |...' cf. temp.sql.js
// TODO: add a debug systme
// TODO: check if db connections are pooled, otherwise pool them : performance should be better
// TODO : gather all query and query functionalities in a query object

var http, express, app, io, server, _; // server connection variables
var pgClient; //postgresSQL connection variable


_ = require('underscore');
var Util = require('util');
//var Promise = require('es6-promise').Promise;
var LOG = require('debug');
var U = require('utils');
var SIO = require('sio_logic');
var DB = require('db_logic');

const RPC_NAMESPACE = '/rpc';

const PREFIX_DIR_SERVER = '../server';
const PREFIX_DIR_CLIENT = '.';

function initialize_server () {
  var srver;
  http = require('http');
  express = require('express');
  app = express();
  // Set the view engine
  app.set('view engine', 'jade');
  // Where to find the view files
  app.set('views', __dirname + '/views'); //__dirname : directory in which the currently executing script resides

  app.use(express.static(__dirname + "/../")); //we point to the home directory of the project to get any files there

  // A route for the home page - will render a view
  app.get('/', function (req, res) {// won't execute as the static file loader of express will use index.html instead
    res.render('hello');
  });

  srver = require('http').createServer(app);

  srver.listen(3000, function () {
    console.log('App started');
  });

  return srver;
}

function initialize_string_lib () {
  // Import Underscore.string to separate object, because there are conflict functions (include, reverse, contains)
  _.str = require('underscore.string');
  // Mix in non-conflict functions to Underscore namespace if you want
  _.mixin(_.str.exports());
  // All functions, include conflict, will be available through _.str object
  _.str.include('Underscore.string', 'string'); // => true
}

initialize_string_lib();
server = initialize_server();
io = SIO.initialize_socket_cnx(server);
DB.initialize_database();

// io.set('log level', 2); for socket.io before 1.0
io.on('connect', function (socket) {
  console.log('Client connected no namespace');
});

io.of(RPC_NAMESPACE).on('connect', function (socket) {
  console.log('Client connected');

  socket.on('highlight_important_words', SIO.sio_onHighlight_important_words);

  socket.on('get_translation_info', SIO.sio_onGet_translation_info);

});

io.on('disconnect', function (socket) {
  console.log('Client disconnected');
  DB.close_connection();
});


