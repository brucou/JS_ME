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
           'debug',
           'mustache',
           'data_struct',
           'ReaderController',
           'ReaderModel',
           'ReaderViews',
           'socketio',
           'utils'],
          function ($, DEBUG, MUSTACHE, DS, RC, RM, RV, IO, UT) {

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
                              var rtTranslateController = new TranslateRTController(self.element);
                            });
                 },

                 '#error_message errore': function (el, ev) {
                   console.log("entered");
                   viewAdapter.attr("error_message", ev.data);
                 }
               });

              var rtController = new ReaderToolController("#reader_tool");

              /**
               * Defining and instantiating translate controllers for tooltip functionality
               */
              // The tooltip is set to be an iframe
              var rtTranslateView = can.view('tpl-translate-tooltip');

              var viewTranslateAdapter = new
                 can.Map({
                           tooltip_html_content: null,
                           display             : 'none',
                           top                 : '10px',
                           left                : '10px',
                           width               : '0px',
                           height              : '0px',
                           text_align          : 'center',
                           set_HTML_tooltip    : function (html_text) {
                             this.attr("tooltip_html_content", html_text)
                           },
                           set_display         : function (attribute_value) {
                             this.attr("display", attribute_value);
                           }
                         });

              // The controller will manage mousestop event and tooltip display and dismissal
              var TranslateRTController = can.Control.extend
              ({
                 init: function ($el, options) {
                   logWrite(DBG.TAG.INFO, "initializing tooltip");
                   var self=this;
                   $("#iframe_container").html(rtTranslateView(viewTranslateAdapter));
                   this.$tooltip = this.element.find("#iframe_container");
                 },

                 defaults       : {dismiss_on: 'mousemove'}, //todo : check syntax
                 $tooltip       : null,
                 last_mouse_stop: {x: 0, y: 0},
                 timer25        : null,
                 options        : {translate_by: 'point'},

                 'mousestop'              : function ($el, ev) {
                   this.process(ev, this.$tooltip, this.options); //todo
                 },
                 'click'                  : function ($el, ev) {
                   logEntry('Translate : click');
                   this.process(ev, this.$tooltip, this.options); //todo
                   logExit('Translate : click');
                   return true;
                 },
                 'mousemove'              : function ($el, ev) {
                   if (this.hasMouseReallyMoved(ev)) {
                     console.log("mouse really moved!");
                     var mousemove_without_noise = new $.Event('mousemove_without_noise');
                     mousemove_without_noise.clientX = ev.clientX;
                     mousemove_without_noise.clientY = ev.clientY;

                     // trigger that event on the whole div container. The $el here is not used
                     // but necessary to get access to the ev parameter
                     can.trigger(this.element, "mousemove_without_noise");
                   }
                 },
                 // setup mousestop event
                 'mousemove_without_noise': function ($el, ev) {
                   console.log("mousemove_without_noise!");
                   clearTimeout(this.timer25);
                   var delay = 200;
                   this.timer25 = setTimeout(function () {
                     var mousestop = new $.Event("mousestop");
                     this.last_mouse_stop.x = mousestop.clientX = ev.clientX;
                     this.last_mouse_stop.y = mousestop.clientY = ev.clientY;

                     this.element.trigger(mousestop);
                   }, delay);
                 },

                 hasMouseReallyMoved: function (e) { //or is it a tremor?
                   var left_boundry = parseInt(this.last_mouse_stop.x) - 5,
                      right_boundry = parseInt(this.last_mouse_stop.x) + 5,
                      top_boundry = parseInt(this.last_mouse_stop.y) - 5,
                      bottom_boundry = parseInt(this.last_mouse_stop.y) + 5;
                   return e.clientX > right_boundry || e.clientX < left_boundry || e.clientY > bottom_boundry ||
                          e.clientY < top_boundry;
                 },

                 getHitWord: function (e) {

                   function restorable (node, do_stuff) {
                     $(node).wrap('<transwrapper />');
                     var res = do_stuff(node);
                     $('transwrapper').replaceWith(UT.escape_html($('transwrapper').text()));
                     return res;
                   }

                   function getExactTextNode (nodes, e) {
                     $(text_nodes).wrap('<transblock />');
                     var hit_text_node = document.elementFromPoint(e.clientX, e.clientY);

                     //means we hit between the lines
                     if (hit_text_node.nodeName != 'TRANSBLOCK') {
                       $(text_nodes).unwrap();
                       return null;
                     }

                     hit_text_node = hit_text_node.childNodes[0];

                     $(text_nodes).unwrap();

                     return hit_text_node;
                   }

                   var hit_elem = $(document.elementFromPoint(e.clientX, e.clientY));
                   var word_re = "\\p{L}{2,}";
                   var parent_font_style = {
                     'line-height': hit_elem.css('line-height'),
                     'font-size'  : '1em',
                     'font-family': hit_elem.css('font-family')
                   };

                   var text_nodes = hit_elem.contents().filter(function () {
                     return this.nodeType == Node.TEXT_NODE && XRegExp(word_re).test(this.nodeValue)
                   });

                   if (text_nodes.length == 0) {
                     logWrite(DBG.TAG.DEBUG, 'no text');
                     return '';
                   }

                   var hit_text_node = getExactTextNode(text_nodes, e);
                   if (!hit_text_node) {
                     logWrite(DBG.TAG.DEBUG, 'hit between lines');
                     return '';
                   }

                   var hit_word = restorable(hit_text_node, function (node) {
                     var hw = '';

                     function getHitText (node, parent_font_style) {
                       logWrite(DBG.TAG.DEBUG, "getHitText: '" + node.textContent + "'");

                       if (XRegExp(word_re).test(node.textContent)) {
                         $(node).replaceWith(function () {
                           return this.textContent.replace(XRegExp("^(.{" + Math.round(node.textContent.length / 2) +
                                                                   "}\\p{L}*)(.*)", 's'), function ($0, $1, $2) {
                             return '<transblock>' + UT.escape_html($1) + '</transblock><transblock>' +
                                    UT.escape_html($2) + '</transblock>';
                           });
                         });

                         $('transblock').css(parent_font_style);

                         var next_node = document.elementFromPoint(e.clientX, e.clientY).childNodes[0];

                         if (next_node.textContent == node.textContent) {
                           return next_node;
                         }
                         else {
                           return getHitText(next_node, parent_font_style);
                         }
                       }
                       else {
                         return null;
                       }
                     }

                     var minimal_text_node = getHitText(hit_text_node, parent_font_style);

                     if (minimal_text_node) {
                       //wrap words inside text node into <transover> element
                       $(minimal_text_node).replaceWith(function () {
                         return this.textContent.replace(XRegExp("(<|>|&|\\p{L}+)", 'g'), function ($0, $1) {
                           switch ($1) {
                             case '<':
                               return "&lt;";
                             case '>':
                               return "&gt;";
                             case '&':
                               return "&amp;";
                             default:
                               return '<transover>' + $1 + '</transover>';
                           }
                         });
                       });

                       $('transover').css(parent_font_style);

                       //get the exact word under cursor
                       var hit_word_elem = document.elementFromPoint(e.clientX, e.clientY);

                       //no word under cursor? we are done
                       if (hit_word_elem.nodeName != 'TRANSOVER') {
                         logWrite(DBG.TAG.DEBUG, "missed!");
                       }
                       else {
                         hw = $(hit_word_elem).text();
                         logWrite(DBG.TAG.DEBUG, "got it: " + hw);
                       }
                     }

                     return hw;
                   });

                   return hit_word;
                 },

                 process: function (e, tooltip, options) {

                   var self = this; //store reference to controller instance object

                   var selection = window.getSelection();
                   var hit_elem = document.elementFromPoint(e.clientX, e.clientY);

                   //don't mess around with html inputs
                   if (/INPUT|TEXTAREA/.test(hit_elem.nodeName)) {
                     return;
                   }

                   //and editable divs
                   if (hit_elem.getAttribute('contenteditable') == 'true' ||
                       $(hit_elem).parents('[contenteditable=true]').length > 0) {
                     return;
                   }

                   var word = '';
                   if (selection.toString()) {

                     logWrite(DBG.TAG.DEBUG, 'Got selection: ' + selection.toString());

                     var sel_container = selection.getRangeAt(0).commonAncestorContainer;

                     while (sel_container.nodeType != Node.ELEMENT_NODE) {
                       sel_container = sel_container.parentNode;
                     }

                     if (// only choose selection if mouse stopped within immediate parent of selection
                        ( $(hit_elem).is(sel_container) || $.contains(sel_container, hit_elem) )
                       // and since it can still be quite a large area
                       // narrow it down by only choosing selection if mouse points at the element that is (partially) inside selection
                        && selection.containsNode(hit_elem, true)
                     // But what is the point for the first part of condition? Well, without it, pointing at body for instance would also satisfy the second part
                     // resulting in selection translation showing up in random places
                        ) {
                       word = selection.toString();
                     }
                     else if (options.translate_by == 'point') {
                       word = self.getHitWord(e);
                     }
                   }
                   else {
                     word = self.getHitWord(e);
                   }
                   if (word != '') {
                     self.show_translation(word, e);
                   }
                 },

                 show_translation: function (word, ev) {
                   //todo: no function show on tooltip...tooltip_html_content
                   // basically, put the param here in {{}} and modify them, handle resize separately
                   // how to debug!!!
                   logWrite(DBG.TAG.INFO, "Fetching translation for :", word);

                   var self = this;
                   RM.cached_translation(word, function (err, aValues) {
                     var aQuery_result = aValues[0];
                     if (err) {
                       logWrite(DBG.TAG.ERROR, "An error ocurred", err);
                       return null;
                     }
                     if (aValues.length === 0 || // means nothing was returned from server and put in store
                         aQuery_result.length === 0) { // means server returned empty
                       logWrite(DBG.TAG.WARNING, "Query did not return any values");
                       return null; //todo: error management
                     }

                     logWrite(DBG.TAG.INFO, "Translation fetched");

                     var html_text = self.formatTranslationResults(aQuery_result);

                     //logWrite(DBG.TAG.DEBUG, "HTML formatting :", html_text);

                     viewTranslateAdapter.set_HTML_tooltip(html_text);

                     var tt = self.$tooltip;
                     //todo : improve position so that I do not loose text on the border of the screen (right and bottom)
                     var pos = self.compute_position(ev.clientX, ev.clientY, tt);

                     viewTranslateAdapter.set_display("block");
                     viewTranslateAdapter.attr("left", [pos.x, 'px'].join(""));
                     viewTranslateAdapter.attr("top", [pos.y, 'px'].join(""));

                     logWrite(DBG.TAG.DEBUG, "displaying tooltip");

                     // missing left-to-right
                     // tt.contents().find('.pos_translation').css('direction', text_direction || 'ltr');
                   });
                 },

                 compute_position: function (x, y, tt) {
                   var pos = {};
                   var margin = 5;
                   var anchor = 10;

                   // show popup to the right of the word if it fits into window this way
                   if (x + anchor + tt.outerWidth(true) + margin < $(window).width()) {
                     pos.x = x + anchor;
                   }
                   // show popup to the left of the word if it fits into window this way
                   else if (x - anchor - tt.outerWidth(true) - margin > 0) {
                     pos.x = x - anchor - tt.outerWidth(true);
                   }
                   // show popup at the very left if it is not wider than window
                   else if (tt.outerWidth(true) + margin * 2 < $(window).width()) {
                     pos.x = margin;
                   }
                   // resize popup width to fit into window and position it the very left of the window
                   else {
                     var non_content_x = tt.outerWidth(true) - tt.width();

                     tt.width($(window).width() - margin * 2 - non_content_x);
                     tt.height(tt.contents().height() + 4);

                     pos.x = margin;
                   }

                   // show popup above the word if it fits into window this way
                   if (y - anchor - tt.outerHeight(true) - margin > 0) {
                     pos.y = y - anchor - tt.outerHeight(true);
                   }
                   // show popup below the word if it fits into window this way
                   else if (y + anchor + tt.outerHeight(true) + margin < $(window).height()) {
                     pos.y = y + anchor;
                   }
                   // show popup at the very top of the window
                   else {
                     pos.y = margin;
                   }

                   return pos;
                 },

                 formatTranslationResults: function (aValues) {
                   /**
                    * aValues is the direct result of the query queryGetTranslationInfo (server-side), each object has format
                    * SELECT DISTINCT pglemmatranslationcz.translation_lemma," +
                    "pglemmatranslationcz.translation_sense, " +
                    "pglemmaen.lemma_gram_info, pglemmaen.lemma, " +
                    "pglemmaen.sense, pglemmatranslationcz.translation_gram_info, " +
                    "example_sentence_from, " +
                    "example_sentence_to, " +
                    "pgwordfrequency_short.freq_cat "
                    */
                   logEntry("formatTranslationResults");
                   var html_text = MUSTACHE.to_html(RV.translation_template,
                                                    {result_rows: aValues, translation_lemma: aValues[0].translation_lemma});
                   //logWrite(DBG.TAG.DEBUG, "html_text", html_text);
                   logExit("formatTranslationResults");
                   return html_text;
                 }

               });


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
