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

var http, express, app, io, server; // server connection variables
var pg, client; // database connection variables
const conString = "postgres://postgres:Italska184a@localhost/postgres"; // connection string
const PREFIX_DIR_SERVER = '../server';
const PREFIX_DIR_CLIENT = '..';

// session variables : initialized one time
var qryImportantWords;

function initialize_server() {
   http = require('http');
   express = require('express');
   app = express();
   // Set the view engine
   app.set('view engine', 'jade');
   // Where to find the view files
   app.set('views', PREFIX_DIR_SERVER + '/views');

   app.use(express.static(PREFIX_DIR_CLIENT + ''));

   // A route for the home page - will render a view
   app.get('/', function (req, res) {
      res.render('hello');
   });

   server = require('http').createServer(app);
   io = require('socket.io').listen(server);

   server.listen(3000, function () {
      console.log('App started');
   });
}

function initialize_database() {
   pg = require('pg');
   client = new pg.Client(conString);
   client.connect(function (err) {
      if (err) {
         return console.error('could not connect to postgres', err);
      }
      client.query("select string_agg(word, ' | ') as freq_words from pgWordFrequency where freq_cat = 'A';",
                   function (err, result) {
                      if (err) {
                         return console.error('error running query', err);
                      }
                      qryImportantWords = result.rows[0].freq_words;
                      //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
                   });
   });
}

initialize_server();
initialize_database();

var rpc = require('rpc');
var LOG = require('debug');
var U = require ('utils');

// initialize database connection and
// one-time variable  linked to the database

io.on('connect', function (socket) {
   console.log('Client connected');
   socket.on('highlight_important_words', function (msg) {
      console.log('message received');
      //var data = JSON.parse(JSON_msg);
      //var msg = data.text;
      //var callback = data.callback;
      var expr = "select ts_headline('cs', '" + msg + "', to_tsquery('cs', '" + qryImportantWords +
                 "'), 'StartSel=\"<span class = ''highlight''>\", StopSel=\"</span>\", HighlightAll=true') as highlit_text";

      client.query(expr, function (err, result) {
         if (err) {
            LOG.write(LOG.TAG.ERROR, 'error running query', err);
         }
         //console.log('displaying result', result.rows[0].highlit_text);
         socket.send(JSON.stringify({type: 'highlight_important_words', data: result.rows[0].highlit_text}));
      });
   });
});

io.on('disconnect', function (socket) {
   console.log('Client disconnected');
   close_connection();
});

function print_rows(rows) {
   for (var i = 0; i < result.rows.length; i++) console.log(result.rows[i]);
}

function close_connection() {
   client.end();
}
