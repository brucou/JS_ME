/*
 Convention : ALL_CAPS : constants
 sCamelHumps : variables
 function_name : functions
 ObjectConstructor : object
 */

/**
 * TODO: MODULARITY
 * - remove sockets variables from global from better encapsulation, create a dedicated sio.js module
 * - investigate how to have module both require.js and stand alone in same file
 * TODO: DOCUMENTATION
 * - documentation in code, refactoring, and split in file
 * TODO: DEBUGGING
 * - investigate automatic logEntry through deubg_Setup function who stubs all functions under windows
 * - experiment with a log prototype function to see if the log shows the originating function correctly
 * - fake all the server communication server - that should allow to run with debugging in webstorm
 * TODO: TESTING
 * - testing suite to write
 * TODO: DEPLOYMENT
 * -  PASSER SUR LE CLOUD!!!!
  */

/*
 Configuring require.js
 */

requirejs.config({
                   //By default load any module IDs from js/lib
                   baseUrl: './js/lib',
                   //except, if the module ID starts with "app",
                   //load it from the js/app directory. paths
                   //config is relative to the baseUrl, and
                   //never includes a ".js" extension since
                   //the paths config could be for a directory.
                   paths  : {
                     jquery  : '../vendor/jquery-1.10.2.min',
                     cache   : '../vendor/cache',
                     mustache: '../vendor/mustache',
                     css     : '../../css',
                     assets  : '../../assets',
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

var main_socket, rpc_socket;
var RPC_NAMESPACE = '/rpc';

///*
requirejs(['jquery',
           'ReaderModel',
           'ReaderController',
           'socketio',
           'utils'],
          function ($, RM, RC, IO, UT) {

            function start () {
              logEntry("start");
              new RC.ReaderToolController("#reader_tool");
              logExit("start");
            }

            function init_log () {
              setConfig(DBG.TAG.DEBUG, true, {by_default: true});
              setConfig(DBG.TAG.TRACE, true, {by_default: true});
              setConfig(DBG.TAG.INFO, false, {by_default: true});
              disableLog(DBG.TAG.DEBUG, "CachedValues.init");
              disableLog(DBG.TAG.DEBUG, "putValueInCache");
              disableLog(DBG.TAG.DEBUG, "disaggregate_input");
              disableLog(DBG.TAG.DEBUG, "async_cached_f");
              disableLog(DBG.TAG.TRACE, "async_cached_f");
              disableLog(DBG.TAG.TRACE, "propagateResult");
              disableLog(DBG.TAG.TRACE, "async cached callback");
              disableLog(DBG.TAG.DEBUG, "highlight_text_in_div");
              disableLog(DBG.TAG.DEBUG, "search_for_text_to_highlight");
              disableLog(DBG.TAG.TRACE, "search_for_text_to_highlight");
              disableLog(DBG.TAG.TRACE, "get_text_stats");
              disableLog(DBG.TAG.TRACE, "generateTagAnalysisData");
              disableLog(DBG.TAG.TRACE, "getHitWord");
              disableLog(DBG.TAG.DEBUG, "getHitWord");
            }

            function init_socket () {
              rpc_socket = IO.connect(RPC_NAMESPACE);
              logWrite(DBG.TAG.INFO, 'rpc_socket', 'connected');
            }

            function init_fake() {
              FAKE.config('make_article_readable', FAKE.fn.fake_make_article_readable);
              FAKE.config('url_load_callback', FAKE.fn.url_load_callback);
            }

            $(function () {
              init_log();
              //init_fake();
              init_socket();
              start();
            });
          })
;
// */
