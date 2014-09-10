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

// nice to have documentation in code, refactoring, and split in file

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

var main_socket, rpc_socket; //todo: remove from global from better encapsulation
var RPC_NAMESPACE = '/rpc';

///*
requirejs(['jquery',
           'data_struct',
           'ReaderController',
           'ReaderModel',
           'TranslateController',
           'socketio',
           'utils'],
          function ($, DS, RC, RM, TC, IO, UT) {

            // testing socket.io

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
                   // todo: harnomize the signature of callback function to err, result with err and Error object
                   prm_success = RC.make_article_readable(my_url);
                   prm_success
                      .fail(function (Error) {
                              if (Error instanceof DS.Error) {
                                logWrite(DBG.TAG.ERROR, "Error in make_article_readable", Error.error_message);
                                viewAdapter.setErrorMessage(Error.error_message);
                                viewAdapter.set_HTML_body(null);
                              }
                            })
                      .done(function (error, html_text) {
                              logWrite(DBG.TAG.INFO, "success make_article_readable");
                              viewAdapter.set_HTML_body(html_text);
                              viewAdapter.setErrorMessage("");

                              //todo : switch to another controller for the tooltip!!
                              //RC.activate_read_words_over(self.element);

                              // start the tooltip controller targetting words in the $element from the reader tool controller
                                                 // which is #reader_tool
                              var rtTranslateController = new TC.TranslateRTController(self.element, {translate_by: 'point'});
                            });
                 },

                 '#error_message errore': function (el, ev) {
                   console.log("entered");
                   viewAdapter.attr("error_message", ev.data);
                 }
               });

              var rtController = new ReaderToolController("#reader_tool");

              /*can.trigger(el, {
               type: "attributes",
               attributeName: attrName,
               target: el,
               oldValue: oldValue,
               bubbles: false
               }, []);*/
              logExit("start");
            }

            function init_log () {
              setConfig(DBG.TAG.DEBUG, false, {by_default: true});
              setConfig(DBG.TAG.TRACE, true, {by_default: true});
              setConfig(DBG.TAG.INFO, false, {by_default: true});
              disableLog(DBG.TAG.DEBUG, "CachedValues.init");
              disableLog(DBG.TAG.DEBUG, "putValueInCache");
              disableLog(DBG.TAG.DEBUG, "disaggregate_input");
              disableLog(DBG.TAG.DEBUG, "async_cached_f");
              disableLog(DBG.TAG.TRACE, "propagateResult");
              disableLog(DBG.TAG.TRACE, "async cached callback");
              disableLog(DBG.TAG.DEBUG, "highlight_text_in_div"); // does not work because there is no trace associated
              disableLog(DBG.TAG.TRACE, "get_text_stats"); //todo : review the log behaviour. first is DETAILED? : true, false, and in absnce of config, show or not show?
              disableLog(DBG.TAG.TRACE, "generateTagAnalysisData");
            }

            function init_socket () {
              rpc_socket = IO.connect(RPC_NAMESPACE);
              logWrite(DBG.TAG.INFO, 'rpc_socket', 'connected');
            }

            $(function () {
              init_log();
              init_socket();
              start();
            });
          })
;
// */
