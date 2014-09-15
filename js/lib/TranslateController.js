/**
 * Defining and instantiating translate controllers for tooltip functionality
 */
/**
 * Lessons learnt:
 * var self = this in each beginning when necessary
 * triggered event listened from document or window
 * can.trigger cannot be used for that purpose, better use $.trigger, as I can pass ev.x, ev.y
 * cam.trigger is good to generate event on specific OBJECTS (pubsub mechanism)
 * document fragment is nice to perform DOM operations with good performance
 * BUT to have it live (e.g. get dimensions for instance), necessary to display:block and insert it in body
 */
/**
 * TODO:
 * !!! probably I cannot have several tooltips because I only have one adapter. Should call a new ..Adapter in the controller
 * afficher qqch dans la tooltip en cas de rien retourné par la translation
 * passer le main dans ReaderController
 *
 * next step:
 * factoriser avant d'avancer plus (scalability!!! maintability!!! documentation!!!)
 * PASSER SUR LE CLOUD!!!!
 * documentation : purpose, argument, settings, returns, throws, action, example
 * passer aux synonymes cf. wordnet
 */
define(['jquery',
        'mustache',
        'data_struct',
        'ReaderModel',
        'ReaderViews',
        'utils'],
       function ($, MUSTACHE, DS, RM, RV, UT) {
         /*
          TODO : factoriser tout dans ReaderViews
          nom template : tpl--... : NO!! get_view (retourne can-view)
          Ainsi le nom du template est encapsule dans RV
          div in template :  reader-tool-tooltip NO!! que ce soit une methode . RV. getReaderToolDiv -> $el
          ainsi on peut tout modifier dans view sans modifier le controlleur
          div out template : ici y'a pas vu qu'on ajoute a body NO!!!! mettre le render dans la view??
          A priori render seulement une fois, car le reste est dynamically updated
          */

         var TC = TC || {};

         TC.rtTranslateView = can.view('tpl-translate-tooltip');

         TC.viewTranslateAdapter = new
            can.Map({
                      tooltip_html_content: null,
                      display             : 'none',
                      top                 : '10px',
                      left                : '10px',
                      width               : '10%',
                      height              : '10%',
                      text_align          : 'center',
                      set_HTML_tooltip    : function (html_text) {
                        this.attr("tooltip_html_content", html_text)
                      },
                      set_display         : function (attribute_value) {
                        this.attr("display", attribute_value);
                      }
                    });

         // The controller will manage mousestop event and tooltip display and dismissal
         // Options :
         // dismiss_on : enum(mousemove, click) -> event which dismissed/hide the tooltip
         // translate_by : enum(point, click) -> show the tooltip by pointing the mouse on the word or clicking on it
         TC.TranslateRTController = can.Control.extend
         (//static property of control is first argument
            { defaults: {dismiss_on: 'mousemove'} },
            {
              init: function ($el, options) {
                logWrite(DBG.TAG.INFO, "initializing tooltip with options", UT.inspect(options));
                var self = this;
                $("body").append(TC.rtTranslateView(TC.viewTranslateAdapter));
                this.$tooltip = $("#reader-tool-tooltip");
              },

              $tooltip       : null,
              last_mouse_stop: {x: 0, y: 0},
              timer25        : null,

              '{document} mousestop': function ($el, ev) {
                if (this.options.translate_by != 'point') {
                  return;
                }
                logWrite(DBG.TAG.DEBUG, "mousestop x y event", ev.clientX, ev.clientY);
                this.process(ev, this.$tooltip, this.options);
              },
              'click'               : function ($el, ev) {
                if (this.options.translate_by != 'click') {
                  return;
                }
                logEntry('Translate : click');
                logWrite(DBG.TAG.DEBUG, "click x y event", ev.clientX, ev.clientY);
                this.process(ev, this.$tooltip, this.options);
                logExit('Translate : click');
                return true;
              },
              'mousemove'           : function ($el, ev) {
                var self = this;
                if (this.hasMouseReallyMoved(ev)) {
                  var mousemove_without_noise = new $.Event('mousemove_without_noise');
                  mousemove_without_noise.clientX = ev.clientX;
                  mousemove_without_noise.clientY = ev.clientY;

                  // trigger that event on the whole div container. The $el here is not used
                  // but necessary to get access to the ev parameter
                  self.element.trigger(mousemove_without_noise);
                }
              },

              '{document} mousemove_without_noise': function ($el, ev) {
                var self = this;
                clearTimeout(this.timer25);
                var delay = 300;
                this.timer25 = setTimeout(function () {
                  var mousestop = new $.Event("mousestop");
                  self.last_mouse_stop.x = mousestop.clientX = ev.clientX;
                  self.last_mouse_stop.y = mousestop.clientY = ev.clientY;

                  self.element.trigger(mousestop);
                }, delay);
              },

              '{window} keydown' : function ($el, ev) {
                logWrite(DBG.TAG.DEBUG, "keydown event", ev.keyCode);
                if (ev.keyCode == 27) {
                  this.empty_and_hide();
                }
              },
              /*                 function setup_dismiss(tt) {
               if (opts.dismiss_on == 'mousemove') {
               $(document).on('mousemove_without_noise', self.hide);
               $(window).scroll(self.hide);
               }
               "change", "click", "contextmenu", "dblclick", "keydown", "keyup",
               "keypress", "mousedown", "mousemove", "mouseout", "mouseover",
               "mouseup", "reset", "resize", "scroll", "select", "submit", "focusin",
               "focusout", "mouseenter", "mouseleave",
               "touchstart", "touchmove", "touchcancel", "touchend", "touchleave",
               "inserted", "removed"
               }*/
              hasMouseReallyMoved: function (e) { //or is it a tremor?
                var left_boundry = parseInt(this.last_mouse_stop.x) - 5,
                   right_boundry = parseInt(this.last_mouse_stop.x) + 5,
                   top_boundry = parseInt(this.last_mouse_stop.y) - 5,
                   bottom_boundry = parseInt(this.last_mouse_stop.y) + 5;
                return e.clientX > right_boundry || e.clientX < left_boundry || e.clientY > bottom_boundry ||
                       e.clientY < top_boundry;
              },

              resize: function (tt) {
                tt.height(tt.contents().height());
                tt.width(tt.contents().width() + 10);
              },

              empty_and_hide: function () {
                TC.viewTranslateAdapter.set_HTML_tooltip("");
                TC.viewTranslateAdapter.set_display("none");
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

                logEntry("getHitWord");
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

                logWrite(DBG.TAG.INFO, "Word found: ", hit_word);
                logExit("getHitWord");
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
                  // display the tooltip with the translation
                  self.show_translation(word, e);

                  // set the mousemove event handler for dismissing tooltip (window scroll and mousemove)
                  if (self.options.dismiss_on == 'mousemove') {
                    self.element.on('mousemove_without_noise', self.empty_and_hide);
                    $(window).scroll(self.empty_and_hide);
                  }
                }
              },

              show_translation: function (word, ev) {
                //TODO: no function show on tooltip...tooltip_html_content
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
                    return null; //TODO: error management
                  }

                  logWrite(DBG.TAG.INFO, "Translation fetched");

                  // Get table html text which contains the translation of the word
                  var html_text = self.formatTranslationResults(aQuery_result);

                  // get the height and width of the rendered table
                  // we have to render the table first to get the dimensions
                  // to that purpose we use a fragment that we display to get dimensions and then undisplay
                  var frag = UT.fragmentFromString(html_text);
                  self.$tooltip.append(frag);
                  TC.viewTranslateAdapter.set_HTML_tooltip("");
                  TC.viewTranslateAdapter.set_display("block");
                  var $$tbl = $("#table_tooltip");
                  var width = $$tbl.width();
                  var height = $$tbl.height();
                  var pos = self.compute_position(ev.clientX, ev.clientY, $$tbl);
                  TC.viewTranslateAdapter.set_display("none");
                  $$tbl.remove();
                  //logWrite(DBG.TAG.DEBUG, "HTML formatting :", html_text);

                  TC.viewTranslateAdapter.set_HTML_tooltip(html_text);
                  TC.viewTranslateAdapter.set_display("block");
                  TC.viewTranslateAdapter.attr("left", [pos.x, 'px'].join(""));
                  TC.viewTranslateAdapter.attr("top", [pos.y, 'px'].join(""));
                  TC.viewTranslateAdapter.attr("width", [width, 'px'].join(""));
                  TC.viewTranslateAdapter.attr("height", [height, 'px'].join(""));

                  logWrite(DBG.TAG.DEBUG, "displaying tooltip");
                });
              },

              compute_position: function (x, y, tt, ttOuterWidth, ttOuterHeight) {
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
                var html_text = MUSTACHE.render(RV.translation_template,
                                                {result_rows: aValues, translation_lemma: aValues[0].translation_lemma});
                //logWrite(DBG.TAG.DEBUG, "html_text", html_text);
                logExit("formatTranslationResults");
                return html_text;
              }

            });

         return TC;
       });
