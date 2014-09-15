/*
 Convention : ALL_CAPS : constants
 sCamelHumps : variables
 function_name : functions
 ObjectConstructor : object
 */

/**
 * TODO:
 * - remove sockets variables from global from better encapsulation, create a dedicated sio.js module
 * - documentation in code, refactoring, and split in file
 * - TESTING SUITE!
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
           'data_struct',
           'ReaderModel',
           'TranslateController',
           'socketio',
           'utils'],
          function ($, DS, RM, TC, IO, UT) {

            function start () {
              logEntry("start");
              var rtView = can.view('tpl-reader-tool-stub');

              /*
               Using a view adapter to have in the same place all variables which are boudn in the view template
               This also allows for cleaner code in the controller...
               ...and the binding of the new controller instance when created...
               ...and not forgetting to use attr to modify those live bindings
               Another option would be to use this.options and pass the same data in an extra parameter when creating
               the controller. In my opinion, this.options distract from what is being done
               */
              var viewAdapter = new can.Map({
                                              url_to_load     : null,
                                              webpage_readable: null,
                                              error_message   : null,
                                              setErrorMessage : function (text) {
                                                this.attr("error_message", text);
                                              },
                                              set_HTML_body   : function (html_text) {
                                                this.attr("webpage_readable", html_text)
                                              }
                                            });

              var ReaderToolController = can.Control.extend
              ({
                 init: function ($el, options) {
                   $el.html(rtView(viewAdapter)); //el already in jquery form
                 },

                 '#url_param change': function ($el, ev) {
                   var my_url = $el.val();
                   var self = this;
                   viewAdapter.attr("url_to_load", my_url);
                   viewAdapter.setErrorMessage(null);
                   viewAdapter.set_HTML_body(null);

                   var prm_success; // promise to manage async data reception
                   // TODO: harnomize the signature of callback function to err, result with err and Error object
                   prm_success = RM.make_article_readable(my_url);
                   prm_success
                      .fail(function (Error) {
                              if (Error instanceof DS.Error) {
                                logWrite(DBG.TAG.ERROR, "Error in make_article_readable", Error.error_message);
                                viewAdapter.setErrorMessage(Error.error_message);
                                viewAdapter.set_HTML_body(null);
                              }
                            })
                      .done(function (error, html_text) {
                              logWrite(DBG.TAG.INFO, "URL read successfully");
                              viewAdapter.set_HTML_body(html_text);
                              viewAdapter.setErrorMessage("");

                              var rtTranslateController = new TC.TranslateRTController(self.element, {translate_by: 'point'});
                            });
                 }
               });

              var rtController = new ReaderToolController("#reader_tool");

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
