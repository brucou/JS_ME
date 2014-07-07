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

var http, express, app, io, server, _; // server connection variables
var pg, client; // database connection variables
const conString = "postgres://postgres:Italska184a@localhost/postgres"; // connection string
const PREFIX_DIR_SERVER = '../server';
const PREFIX_DIR_CLIENT = '..';
const pgVERBATIM = "$random_some$"; // !! if this is already in the text, there will be a problem
// todo: randomize that constant

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

function initialize_string_lib() {
   _ = require('underscore');
   // Import Underscore.string to separate object, because there are conflict functions (include, reverse, contains)
   _.str = require('underscore.string');
   // Mix in non-conflict functions to Underscore namespace if you want
   _.mixin(_.str.exports());
   // All functions, include conflict, will be available through _.str object
   _.str.include('Underscore.string', 'string'); // => true
}

initialize_server();
initialize_database();
initialize_string_lib();

//var rpc = require('rpc'); // not needed anymore, can use callback parameter in emit function
var LOG = require('debug');
var U = require('utils');
const RPC_NAMESPACE = '/rpc';

function wrap_string(wrap_begin, word, wrap_end) {
   return [wrap_begin, word, wrap_end].join("");
}

function wrap_highlight_span(word) {
   return wrap_string("<span class = 'highlight'>", word, "</span>");
}

// initialize database connection and
// one-time variable  linked to the database

io.of(RPC_NAMESPACE).on('connect', function (socket) {
   console.log('Client connected');

   socket.on('highlight_important_words', function (msg, callback) {
      console.log('message received');
      //var data = JSON.parse(JSON_msg);
      //var msg = data.text;
      //var callback = data.callback;
      // todo: remove the sprintf to use tje $1, $2 who protects again sql injuntion
      //cf. https://github.com/brianc/node-postgres/wiki/Client#method-query-parameterized

      // todo - escaping query, and write a template mechanism similar to html templates client side
      var pgTable_WordFrequency = "pgwordfrequency";
      var queryHighlightImportantWords = "select ts_headline('cs', %s, to_tsquery('cs', '%s'), " +
                                         "'StartSel=\"<span class = ''highlight''>\", StopSel=\"</span>\", HighlightAll=true') " +
                                         "as highlit_text"; //important the first %s has no quotes

      var queryIsOneWordImportant = "select to_tsvector('cs', '%s') @@ to_tsquery('cs', '%s') as highlit_text";
      var queryFrequencyWords = "select word, frequency from " + pgTable_WordFrequency + " where ";
      var queryString = queryIsOneWordImportant; // we go with that one now
      // I also need to escape the problematic characters in the string I am passing as argument
      function pg_escape_string(string) {
         return pgVERBATIM + string + pgVERBATIM;
      }

      var qryHighlightImportantWords = _.sprintf(queryString, msg, qryImportantWords);
      LOG.write(LOG.TAG.INFO, 'running query with text', msg);

      client.query(qryHighlightImportantWords, function (err, result) {
         if (err) {
            LOG.write(LOG.TAG.ERROR, 'error running query', err);
            callback(true, {data: null, error: err});
            return;
         }
         //console.log('displaying result', result.rows[0].highlit_text);
         //socket.send(JSON.stringify({type: 'highlight_important_words', data: result.rows[0].highlit_text}));
         if (result && result.rows) {
            var highlit_text = result.rows[0].highlit_text;
            LOG.write("callback results", result.rows[0].highlit_text);
            if ("true" === highlit_text.toString()) {
               LOG.write("Word is an important word", wrap_highlight_span(msg));
               callback(false, {data: wrap_highlight_span(msg), error: false}); // no err, and important word
            } else {
               LOG.write("Word is not an important word", msg);
               callback(false, {data: msg, error: false}); // no err, and not an important word
            }
            // just in case, but because err is catched, should not be necessary
         }
      });
      LOG.write(LOG.TAG.INFO, 'query sent to server, waiting for callback');
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
