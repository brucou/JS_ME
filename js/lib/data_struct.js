/**
 * Created by bcouriol on 2/06/14.
 */

define(['utils'], function (UT) {
  return {
    ParagraphData: function ParagraphData (init_object) {
      /* For each paragraph, calculate a series of indicators
       number of sentences
       average length of sentences in words
       number of links
       the first enclosing div
       */
      // limit cases : init_object not defined
      init_object = init_object || {};

      this.$el = init_object.$el || null;
      this.tag = init_object.tag;
      this.text = init_object.text; // text content of the tag
      this.sentence_number = init_object.sentence_number;
      this.avg_sentence_length = init_object.avg_sentence_length; //average length of sentences in words
      this.enclosing_div = init_object.enclosing_div; // first enclosing div
      this.enclosing_div_id = init_object.enclosing_div_id;
      this.enclosing_div_class = init_object.enclosing_div_class;

      this.toString = function () {
        return [this.$el.selector, this.tag, this.text.slice(0, 40), this.sentence_number, this.avg_sentence_length,
                this.enclosing_div, "$$$"].join("\\");
      }
    },
    ValueMap     : function ValueMap (init_object) {
      /* Contains two fields, one input and one output
       This data structure is designed to cache one function value as in output = f(input);
       input and output can be any object.
       However this data structure is isolated and named here to be able to reference it by typeof
       for type checking
       */
      init_object = init_object || {};
      this.x = init_object.x;
      this.y = init_object.y;

      this.toString = function () {
        return "(" + [this.x, this.y].join(",") + ")";
      }
    },
    Error        : function (error_message) {
      this.error_message = error_message;
    },
    Tooltip      : (function () {
      function Tooltip (args) {
        var opts = $.extend({dismiss_on: 'mousemove'}, args);
        var self = this;
        var future_events = [];
        var tt;
        //var context = args["context"] || document; //for not applying events to the whole document

        function inject_css (tt) {
          var cssLink = document.createElement("link");
          cssLink.href = "css/tooltip_iframe.css";
          cssLink.rel = "stylesheet";
          cssLink.type = "text/css";
          tt[0].contentDocument.head.appendChild(cssLink);
        }

        function position (x, y, tt) {
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
            tt.contents().find('.translation').css('white-space', 'normal');

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
        }

        function setup_dismiss (tt) {
          if (opts.dismiss_on == 'mousemove') {
            $(document).on('mousemove_without_noise', self.hide);
            $(window).scroll(self.hide);
          }
          else {
            $(document).keydown(escape_hide_handler);
            tt.contents().keydown(escape_hide_handler);
          }
        }

        function escape_hide_handler (e) {
          if (e.keyCode == 27) {
            self.hide();
          }
        }

        function bind_future_events (tt) {
          future_events.forEach(function (event) {
            tt.contents().find(event.selector).on(event.event, event.action);
          })
        }

        function set_text_direction (text_direction, tt) {
          tt.contents().find('.pos_translation').css('direction', text_direction || 'ltr');
        }

        this.remove = function () {
          tt.remove();
        };

        this.show = function (x, y, content, text_direction) {
          logEntry("tooltip show");
          tt[0].contentDocument.body.innerHTML = content;

          self.resize();

          var pos = position(x, y, tt);

          // I don't know why by calling this second time makes the popup height resize properly.
          // Maybe some things are lazy evalutated? No idea.
          pos = position(x, y, tt);

          self.resize();

          setup_dismiss(tt);

          bind_future_events(tt);

          set_text_direction(text_direction, tt);

          tt.css({ top: pos.y, left: pos.x, display: 'block'});

          logExit("tooltip show");
        };

        this.hide = function () {
          //tt.css('display', 'none');
          tt.html("");
        };

        this.is_hidden = function () {
          return !tt || tt.css('display') == 'none';
        };

        this.is_visible = function () {
          return tt && !this.is_hidden();
        };

        this.find = function (selector) {
          return tt.contents().find(selector);
        };

        this.bindFutureEvent = function (event, selector, action) {
          future_events.push({event: event, selector: selector, action: action});
        };

        this.resize = function () {
          logEntry("resize tooltip");
          logWrite(DBG.TAG.DEBUG, "tt contents height", tt.contents().height());
          // don't know why we have to do it like this for it to work...
          tt.height(tt.contents().height());
          tt.css("height", "auto");
          tt.height(tt.contents().height());
          tt.width(tt.contents().width() + 10);
          tt.css("width", "auto");
          tt.width(tt.contents().width() + 10);
          logExit("resize tooltip");
        };

        tt = $('<iframe>', {
          css  : {
            background     : '#fcf7d9',
            'text-align'   : 'left',
            'border-style' : 'solid',
            'border-width' : '1px',
            'border-color' : '#ccc',
            'box-shadow'   : 'rgba(0,0,0,0.2) 0px 2px 5px',
            position       : 'fixed',
            'border-radius': '5px',
            'z-index'      : 2147483647,
            top            : '-1500px',
            display        : 'none'
          },
          class: 'transover-tooltip'
        }).appendTo('body');

        inject_css(tt);
      }

      return Tooltip;
    })()

  }
});
