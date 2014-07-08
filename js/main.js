//var your_url = 'http://internacional.elpais.com/internacional/2014/06/03/actualidad/1401797293_595478.html';

/**********************
 * MAIN BODY
 */

/*
 Convention : ALL_CAPS : constants
 sCamelHumps : variables
 function_name : functions
 ObjectConstructor : object
 */

// todo modularize js
// nice to have documentation in code, refactoring, and split in file
// nice to have improve CSS of page result - take the whole page till div

/*
 Configuring require.js
 */

requirejs.config({
                    //By default load any module IDs from js/lib
                    baseUrl: './js',
                    //except, if the module ID starts with "app",
                    //load it from the js/app directory. paths
                    //config is relative to the baseUrl, and
                    //never includes a ".js" extension since
                    //the paths config could be for a directory.
                    paths  : {
                       jquery  : 'vendor/jquery-1.10.2.min',
                       css     : '../css',
                       assets  : '../assets',
                       socketio: '/socket.io/socket.io'
                    }
                 });

/*
 Require : load the indicated dependencies if needed, and run the function inside
 Define : does not run anything. It defines (declarative) the module.
 When a module is looked for, the factory function passed as a parameter is executed
 to return the object)
 So we start the app here.
 */

var main_socket, rpc_socket; //todo: remove from global from better encapsulation
const RPC_NAMESPACE = '/rpc';

requirejs(['jquery', 'debug', 'readability', 'socketio'], function ($, DEBUG, RD, IO) {

   // testing socket.io

   function stub(url_param, url_log) {
      logEntry("stub");
      var my_url = $("#" + url_param + " option:selected").val();
      $("#" + url_log).text(my_url);
      RD.make_article_readable(my_url, RD.activate_read_words_over);
      logWrite(DBG.TAG.DEBUG, "url", my_url);
      logExit("stub");
   }

   $(function () {
      setConfig(DBG.TAG.DEBUG, true, {by_default: true});
      setConfig(DBG.TAG.TRACE, false, {by_default: true}); // default is don't show debug messages
      setConfig(DBG.TAG.INFO, false, {by_default: true}); // default is don't show debug messages
      disableLog(DBG.TAG.DEBUG, "CachedValues.init");
      disableLog(DBG.TAG.DEBUG, "putValueInCache");
      disableLog(DBG.TAG.DEBUG, "disaggregate_input");
      disableLog(DBG.TAG.DEBUG, "async_cached_f");
      enableLog(DBG.TAG.DEBUG, "propagateResult");
      enableLog(DBG.TAG.DEBUG, "highlight_text");

      rpc_socket = IO.connect(RPC_NAMESPACE);
      logWrite(DBG.TAG.INFO, 'rpc_socket', 'connected');

      $("#url_param").change(function () {
         stub("url_param", "url");
      });
   });
});

// Start the main app logic.
/*
 requirejs(['jquery', 'canvas', 'app/sub'],
 function   ($,        canvas,   sub) {
 //jQuery, canvas and the app/sub module are all
 //loaded and can be used here now.
 });
 */
