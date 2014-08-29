/**
 * Created by bcouriol on 27/08/14.
 */
/**
 This is loosely destined to get the code related to the Reader Tool
 */
define(['jquery', 'data_struct', 'url_load', 'utils', 'ReaderModel', 'ReaderViews', 'mustache'],
       function ($, DS, UL, UT, RM, RV, MUSTACHE) {

          var ERROR_DIV = "error_message";

          function RD_display_error(error_message) {
             if (error_message) {
                $("#" + ERROR_DIV).html(error_message);
             }
          }

          function make_article_readable(your_url, then_callback) {
             var error_message = null;
             UL.url_load(your_url, function (html_text) {
                if (html_text) { // the query did not fail to return a non-empty text
                   var $dest = RM.extract_relevant_text_from_html(html_text);
                } else {
                   RD_display_error("<p> ERROR : could not retrieve the webpage </p>");
                   return null;
                }

                if ($dest) {
                   $dest.appendTo("body");
                   $("#" + ERROR_DIV).empty();
                   then_callback($dest);
                } else {
                   RD_display_error("<p> ERROR : nothing to display </p><p> Possible cause : no important paragraph could be identified </p>");
                   return null;
                }

             });
          }

          function log() {
             logWrite(DBG.TAG.DEBUG, UT.inspect(arguments));
          }

          function activate_read_words_over($dest) {
             var options = {};
             options.translate_by = 'point';

             // todo: remove the document and replace with $el_target_translate in tooltip.js
             var tooltip = new DS.Tooltip({dismiss_on: 'click'});
             var $el_target_translate = $dest;

             var timer25;
             var last_mouse_stop = {x: 0, y: 0};

             function hasMouseReallyMoved(e) { //or is it a tremor?
                var left_boundry = parseInt(last_mouse_stop.x) - 5, right_boundry = parseInt(last_mouse_stop.x) +
                                                                                    5, top_boundry = parseInt(last_mouse_stop.y) -
                                                                                                     5, bottom_boundry = parseInt(last_mouse_stop.y) +
                                                                                                                         5;
                return e.clientX > right_boundry || e.clientX < left_boundry || e.clientY > bottom_boundry ||
                       e.clientY < top_boundry;
             }

             $el_target_translate.on('mousestop', function (e) {
                process(e, tooltip, options); //in text_handling.js for now
             });

             $el_target_translate.click(function (e) {
                process(e, tooltip, options);
                return true;
             });

             $el_target_translate.mousemove(function (e) {
                if (hasMouseReallyMoved(e)) {
                   var mousemove_without_noise = new $.Event('mousemove_without_noise');
                   mousemove_without_noise.clientX = e.clientX;
                   mousemove_without_noise.clientY = e.clientY;

                   $el_target_translate.trigger(mousemove_without_noise);
                }
             });

             // setup mousestop event
             $el_target_translate.on('mousemove_without_noise', function (e) {
                clearTimeout(timer25);
                var delay = 200;
                timer25 = setTimeout(function () {
                   var mousestop = new $.Event("mousestop");
                   last_mouse_stop.x = mousestop.clientX = e.clientX;
                   last_mouse_stop.y = mousestop.clientY = e.clientY;

                   $el_target_translate.trigger(mousestop);
                }, delay);
             });
          }

          function process(e, tooltip, options) {

             function getHitWord(e) {

                function restorable(node, do_stuff) {
                   $(node).wrap('<transwrapper />');
                   var res = do_stuff(node);
                   $('transwrapper').replaceWith(UT.escape_html($('transwrapper').text()));
                   return res;
                }

                function getExactTextNode(nodes, e) {
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
                   log('no text');
                   return '';
                }

                var hit_text_node = getExactTextNode(text_nodes, e);
                if (!hit_text_node) {
                   log('hit between lines');
                   return '';
                }

                var hit_word = restorable(hit_text_node, function (node) {
                   var hw = '';

                   function getHitText(node, parent_font_style) {
                      log("getHitText: '" + node.textContent + "'");

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
                         } else {
                            return getHitText(next_node, parent_font_style);
                         }
                      } else {
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
                         log("missed!");
                      } else {
                         hw = $(hit_word_elem).text();
                         log("got it: " + hw);
                      }
                   }

                   return hw;
                });

                return hit_word;
             }

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

                log('Got selection: ' + selection.toString());

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
                } else if (options.translate_by == 'point') {
                   word = getHitWord(e);
                }
             } else {
                word = getHitWord(e);
             }
             if (word != '') {
                logWrite(DBG.TAG.INFO, "Fetching translation for :", word);

                /*
                 var translation = null;
                 if (!translation) {
                 log('skipping empty translation');
                 return;
                 }
                 */

                var osStore = new UT.OutputStore({countDown: 1, propagateResult: function () {
                   logEntry("propagateResult");
                   var translate_text = "dummy text for now";//osStore.toString();
                   var aValues = osStore.getValuesArray();
                   var aQuery_result = aValues[0];
                   if (aValues.length === 0 || // means nothing was returned from server and put in store
                       aQuery_result.length === 0) { // means server returned empty
                      logWrite(DBG.TAG.WARNING, "Query did not return any values");
                      return null; //todo: error management
                   }
                   show_translation(formatTranslationResults(aQuery_result));
                   logExit("propagateResult");
                }});

                RM.cached_translation(word, osStore);

                function show_translation(html_text) {
                   //if (tooltip) {tooltip.remove();}
                   //new DS.Tooltip({dismiss_on: 'click'}).show(e.clientX, e.clientY,
                   tooltip.show(e.clientX, e.clientY,
                                html_text,
                                'ltr');
                }
             }
          }

          function formatTranslationResults(aValues) {
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
                // todo : make a render function in the view RV like backbone
             var html_text = MUSTACHE.to_html(RV.translation_template,
                                              {result_rows: aValues, translation_lemma: aValues[0].translation_lemma});
             //logWrite(DBG.TAG.DEBUG, "html_text", html_text);
             return html_text;
          }

          return {//that's the object returned only for requirejs, e.g. the visible interface exposed
             make_article_readable   : make_article_readable,
             activate_read_words_over: activate_read_words_over
          };
       });
