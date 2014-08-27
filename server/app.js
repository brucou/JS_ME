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

// todo : define a list (script file to create table) with important words -> to_tsquery, be careful with syntax 'word |...' cf. temp.sql.js
// todo : connect with socket.io and receive a text file from client to return with important words
// todo: add a debug systme
// todo: check if db connections are pooled, otherwise pool them : performance should be better

var http, express, app, io, server, _; // server connection variables
var pg, client; // database connection variables
var util = require('util');
const conString = "postgres://postgres:Italska184a@localhost/postgres"; // connection string
const PREFIX_DIR_SERVER = '../server';
const PREFIX_DIR_CLIENT = '.';
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
   app.set('views', __dirname + '/views'); //__dirname : directory in which the currently executing script resides

   app.use(express.static(__dirname + "/../")); //we point to the home directory of the project to get any files there

   // A route for the home page - will render a view
   app.get('/', function (req, res) {// won't execute as the static file loader of express will use index.html instead
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

// io.set('log level', 2); for socket.io before 1.0
io.on('connect', function (socket) {
   console.log('Client connected no namespace');
});

io.of(RPC_NAMESPACE).on('connect', function (socket) {
   console.log('Client connected');

   socket.on('highlight_important_words', function (msg, callback) {
      console.log('highlight_important_words message received');
      //var data = JSON.parse(JSON_msg);
      //var msg = data.text;
      //var callback = data.callback;
      // todo: remove the sprintf to use tje $1, $2 who protects again sql injuntion
      //cf. https://github.com/brianc/node-postgres/wiki/Client#method-query-parameterized

      // todo - escaping query, and write a template mechanism similar to html templates client side
      var pgTable_WordFrequency = "pgwordfrequency";
      var queryHighlightImportantWords = "select ts_headline('cs', $1, to_tsquery('cs', $2), " +
                                         "'StartSel=\"<span class = ''highlight''>\", StopSel=\"</span>\", HighlightAll=true') " +
                                         "as highlit_text"; //important the first %s has no quotes

      var queryIsOneWordImportant = "select to_tsvector('cs', '%s') @@ to_tsquery('cs', '%s') as highlit_text";
      var queryFrequencyWords = "select word, frequency from " + pgTable_WordFrequency + " where ";
      var queryString = queryHighlightImportantWords; // we go with that one now
      // I also need to escape the problematic characters in the string I am passing as argument
      function pg_escape_string(string) {
         return pgVERBATIM + string + pgVERBATIM;
      }

      var qryHighlightImportantWords = queryHighlightImportantWords;
      LOG.write(LOG.TAG.INFO, 'running query with text', msg);

      client.query(qryHighlightImportantWords, [msg, qryImportantWords], function (err, result) {
         if (err) {
            LOG.write(LOG.TAG.ERROR, 'error running query', err);
            callback(true, {data: null, error: err});
            return;
         }
         //console.log('displaying result', result.rows[0].highlit_text);
         //socket.send(JSON.stringify({type: 'highlight_important_words', data: result.rows[0].highlit_text}));
         if (result && result.rows) {
            var highlit_text = result.rows[0].highlit_text;
            LOG.write("callback results", highlit_text);
            callback(false, {data: highlit_text, error: false});
            // just in case, but because err is catched, should not be necessary
         }
      });
      LOG.write(LOG.TAG.INFO, 'query sent to database server, waiting for callback');
   });

   socket.on('get_translation_info', function (msg, callback) {
      console.log('get_translation_info message received');
      // $1 : dictionary (here cspell)
      // $2 : the word to be lemmatize
      // !! issue : unsolved when ts_lexize returns two values... Ex. rámci -> {rámci,rámec}
      // todo: create a stored procedure which converts {word, word} to first or last word?
      var queryGetTranslationInfo = "SELECT DISTINCT pglemmatranslationcz.translation_lemma," +
                                    "pglemmatranslationcz.translation_sense, " +
                                    "pglemmaen.lemma_gram_info, pglemmaen.lemma, " +
                                    "pglemmaen.sense, pglemmatranslationcz.translation_gram_info, " +
                                    "pgwordfrequency_short.freq_cat " +
                                    "FROM pgwordfrequency_short, pglemmaen, pglemmatranslationcz  " +
                                    "WHERE pglemmatranslationcz.lemma_sense_id = pglemmaen.lemma_sense_id " +
                                    "AND pglemmatranslationcz.translation_lemma = pgwordfrequency_short.lemma " +
                                    "AND translation_lemma in " +
                                    "(select(right(left(ts_lexize($1, $2)::varchar, -1), -1)))";
      client.query(queryGetTranslationInfo, ['cspell', msg], function (err, result) {
         if (err) {
            LOG.write(LOG.TAG.ERROR, 'error running query', err);
            callback(true, {data: null, error: err});
            return;
         }
         if (result && result.rows) {
            LOG.write("callback results", util.inspect(result.rows));
            callback(false, {data: result.rows,  error: false});
            // just in case, but because err is catched, should not be necessary
         }
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
