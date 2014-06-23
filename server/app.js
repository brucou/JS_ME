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

// todo : define a list (script file to create table) with important words -> to_tsquery, be careful with syntax 'word |...' cf. temp.js
// todo : connect with socket.io and receive a text file from client to return with important words
// todo: add a debug systme

var http = require('http');
var express = require('express');
var app = express();
const PREFIX_DIR_SERVER = '../server';
const PREFIX_DIR_CLIENT = '..';

// Set the view engine
app.set('view engine', 'jade');
// Where to find the view files
app.set('views', PREFIX_DIR_SERVER + '/views');

app.use(express.static(PREFIX_DIR_CLIENT + ''));

// A route for the home page - will render a view
app.get('/', function (req, res) {
   res.render('hello');
});

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(3000, function () {
   console.log('App started');
});

io.on('connection', function(socket){
   console.log('Client connected');
   socket.on('highlight_important_words', function(msg){
      console.log('message: ' + msg);
   });
});

var pg = require('pg');
//or native libpq bindings
//var pg = require('pg').native

var conString = "postgres://postgres:Italska184a@localhost/postgres";

var client = new pg.Client(conString);
client.connect(function (err) {
   if (err) {
      return console.error('could not connect to postgres', err);
   }
   client.query("select * from ts_debug('cs','Příliš žluťoučký kůň se napil žluté vody')", function (err, result) {
      if (err) {
         return console.error('error running query', err);
      }
      for (var i = 0; i < result.rows.length; i++) console.log(result.rows[i]);
      //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
      client.end();
   });
});
