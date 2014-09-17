/**
 * Created by bcouriol on 17/09/14.
 */
define(['jquery',
        'ReaderModel',
        'TranslateController',
        'utils'],
       function ($, RM, TC, UT) {
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

                         var rtTranslateController = new TC.TranslateRTController(self.element,
                                                                                  {translate_by: 'point'});
                       });
            }
          });

         return {
           ReaderToolController: ReaderToolController
         }
       });
