/**
 * Created by bcouriol on 16/06/14.
 */
// load http module
var listen_port = 8124;
var http = require('http');
var util = require('util');

// create http server
http.createServer(function (req, res) {

   // content header
   res.writeHead(200, {'content-type': 'text/plain'});

   // write message and signal communication is complete
   res.end("Hello, World!\n");
}).listen(listen_port);

console.log('Server running on ' + listen_port + '/');
