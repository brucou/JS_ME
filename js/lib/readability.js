/**
 * Created by bcouriol on 5/06/14.
 */

   // issue: deal with lemonde, some words give null when you click on it?? Seems to happen after anchor links : replace anchor links by span class and copy the style of links
   // todo : disable click on links anyways - interacts with word info functionality
   // todo: !!test how the callback works in case of error in query on server
   // todo: differ the display in DOM after receiving all results from callback from server (with timeout not to block)
   // todo: I should also remove the repeated . signs (...) in the sentence counting
   // issue: analyse why some paragraphs are not parsed : http://prazsky.denik.cz/zpravy_region/lenka-mrazova-dokonalost-je-moje-hodnota-20140627.html
   // todo: add some style for code div
   // todo: treat wikipedia as a special case. More special cases? http://en.wikipedia.org/wiki/Perranzabuloe
   // todo: write tests for each function (unit tests) and then for the higher level functions
   // NOTE: testing strategies. then compute_text_stats_group_by_div then selectedDivs (later)
   // todo : test highlight_important_words
   // todo: then do global tests with lemonde etc. and verify that selectedDiv are correct (possibly load them from file)
   // todo: include the title in the highlighting of words
   // write several describe each for test page, and then write test for each function in the chain
   // test also the communication with the server, and the correct return of full text search (use done ()!! async!)

define(['jquery', 'data_struct', 'url_load', 'utils', 'socketio'], function ($, DS, UL, UT, IO) {
   var CLASS_SELECTOR_CHAR = ".";
   var ID_SELECTOR_CHAR = "#";
   var SOURCE = "source";
   var DEST = "destination";
   var ERROR_DIV = "error_message";

   function srv_qry_important_words(word, callback) {
      /*
       Word: the word to question the server with
       callback: executed when the server has finished its processing
       */
      logEntry("srv_qry_important_words");
      rpc_socket.emit('highlight_important_words', word, callback);
         logExit("srv_qry_important_words");
      }

   //var cached_highlight = UT.async_cached(srv_qry_important_words, new DS.CachedValues([])); // no initial cache
   var cached_highlight = UT.async_cached(srv_qry_important_words, null); // we use the non-cached version

   function RD_display_error(error_message) {
      if (error_message) {
         $("#" + ERROR_DIV).html(error_message);
      }
   }

   function make_article_readable(your_url, then_callback) {
         var error_message = null;
      UL.url_load(your_url, function (html_text) {
         if (html_text) { // the query did not fail to return a non-empty text
            var $dest = extract_relevant_text_from_html(html_text);
         } else {
            RD_display_error("<p> ERROR : could not retrieve the webpage </p>");
            return null;
         }
         if ($dest) {
            $dest.appendTo("body");
            $("#" + ERROR_DIV).empty();
            then_callback();
         } else {
            RD_display_error("<p> ERROR : nothing to display </p><p> Possible cause : no important paragraph could be identified </p>");
            return null;
         }
      });
   }

   function extract_relevant_text_from_html(html_text) {
      /*
       LIMITATION : Will not work for pages who have paragraph directly under body
       This case is currently considered pathological and ignored
       IMPROVEMENT : look if there is an article tag, in which case take the title and add it first with H1 tag before constructing the page
       */
      logEntry("extract_relevant_text_from_html");
      var MIN_SENTENCE_NUMBER = 7;
      var MIN_AVG_AVG_SENTENCE_LENGTH = 13;

      var $source = create_div_in_DOM(SOURCE).html(html_text);
      $source.hide();
      $source.appendTo($("body")); //apparently it is necessary to add it to body to avoid having head and doctype etc tag added
      var $dest = create_div_in_DOM(DEST);
      logWrite(DBG.TAG.INFO, "Compute tag stats");
      var aData = generateTagAnalysisData($source);

      /* A.
       for each div:
       for each paragraph in that div
       number of sentences and avg. of avg words per sentences
       Take all divs satisfying those conditions:
       sum #sentences > min number (language dependent)
       #avg #avg_xx > min number (language dependent)
       */
      /* A1.
       First compute the tag and text stats grouped by div
       */
      logWrite(DBG.TAG.INFO, "Compute tag stats grouped by div");
      var aDivRow = compute_text_stats_group_by_div(aData);

      /* we finished exploring, now gather the final stats (averages)
       */
      logWrite(DBG.TAG.INFO, "We finished exploring, now gather the final stats (averages)");
      for (i = 0; i < aDivRow.length; i++) {
         aDivRow[i].avg_avg_sentence_length = aDivRow[i].sum_avg_sentence_length / aDivRow[i].count_avg_sentence_length;
      }

      /* Identify the div classes to keep in the DOM */
      logWrite(DBG.TAG.INFO, "Identify the div classes to keep in the DOM");
      var selectedDivs = select_div_to_keep(aDivRow, MIN_SENTENCE_NUMBER, MIN_AVG_AVG_SENTENCE_LENGTH);
      if (selectedDivs.length === 0) {
         logWrite(DBG.TAG.WARNING, "no div selected!!");
         logExit("extract_relevant_text_from_html");
         return null;
      }

      logWrite(DBG.TAG.INFO, "Reading and adding title");
      read_and_add_title_to_$el($source, $dest);

      logWrite(DBG.TAG.INFO, "Highlighting important words");
      highlight_important_words(selectedDivs, $dest);
      $source.remove();

      logExit("extract_relevant_text_from_html");
      return $dest;
   }

   function compute_text_stats_group_by_div(aData) {
      /*
       @param aData {array} todo
       @returns {array} todo
       */
      var aDivRow = []; // contains stats for each div
      var i; // loop variable
      for (i = 0; i < aData.length; i++) {
         var pdStatRow = aData[i]; //ParagraphData object
         var div = pdStatRow.enclosing_div;
         var tagName = pdStatRow.tag;
         logWrite(DBG.TAG.DEBUG, "i, div, tagName", i, div, tagName);

         if (tagName) {// TEST!! we only compute summary stats for some tags
            var iIndex = getIndexInArray(aDivRow, "div", div);

            if (iIndex > -1) { // div class already added to the stat array
               aDivRow[iIndex].sum_sentence_number += pdStatRow.sentence_number;
               aDivRow[iIndex].sum_avg_sentence_length += pdStatRow.avg_sentence_length;
               aDivRow[iIndex].count_avg_sentence_length += 1;
            } else { // first time seen that div class, so add it to the stat array
               aDivRow.push({div: div, sum_sentence_number: pdStatRow.sentence_number, sum_avg_sentence_length: pdStatRow.avg_sentence_length, count_avg_sentence_length: 1});
            }
         }
      }
      return aDivRow;
   }

   function select_div_to_keep(aDivRow, MIN_SENTENCE_NUMBER, MIN_AVG_AVG_SENTENCE_LENGTH) {
      /**
       @param aDivRow {array} array of div elements from the page to analyze
       @returns {array} filtered array with only the div elements to keep for presentation, e.g. the important text
       */
      var selectedDivs = [];
      var pdStatRowPartial, i;
      for (i = 0; i < aDivRow.length; i++) {
         pdStatRowPartial = aDivRow[i]; //ParagraphData object
         if (pdStatRowPartial.sum_sentence_number >= MIN_SENTENCE_NUMBER &&
             pdStatRowPartial.avg_avg_sentence_length >= MIN_AVG_AVG_SENTENCE_LENGTH) {
            // that div is selected candidate for display
            selectedDivs.push(pdStatRowPartial);
            logWrite(DBG.TAG.INFO, "keeping div class, sentence_number, avg w/s", pdStatRowPartial.div,
                     pdStatRowPartial.sum_sentence_number, pdStatRowPartial.avg_avg_sentence_length);
         } else {
            logWrite(DBG.TAG.INFO, "discarding div class, sentence_number, avg w/s", pdStatRowPartial.div,
                     pdStatRowPartial.sum_sentence_number, pdStatRowPartial.avg_avg_sentence_length);

         }
      }
      return selectedDivs;
   }

   function highlight_important_words(aSelectedDivs, $dest) {
      /*
       for each element of the array of selected div elements, highlight its text content
       then put the result in the destination DOM element
       The DOM takes the el from its source and (RE)MOVES it to the destination
       issue : might be necessary to have a special treatment for div with no classes AND no id selectors
       */
      var pdStatRowPartial;
      for (i = 0; i < aSelectedDivs.length; i++) {
         pdStatRowPartial = aSelectedDivs[i];
         var div_selector = pdStatRowPartial.div;
         if (div_selector.length === 0) {
            // this is pathological case, where the relevant text is directly under the body tag
            // that should not happen as we are always under body under that version of the algorithm
            // so just warns in console
            logWrite(DBG.TAG.WARNING, "div_selector is empty, ignoring");
            continue;
         }

         logWrite(DBG.TAG.INFO, "Highlighting important words on text from", div_selector);
         var $div_selector = $(div_selector);
         highlight_text_in_div($div_selector); //null : use current cache
         $div_selector.appendTo($dest);
      }
   }

   function highlight_proper_text($el, then_callback) {
      /**
       * Highlights important words found in sWords, and signals them in $el
       * Important : this function expects to be called with a normal text, e.g. no html tags
       * If html tags are present, they will be parsed as regular text
       @param sWords {String}: sentence whose words are to be highlit
       @param $el {Object}: jQuery element that contains sWords in its inner text
       @param then_callback {function} : callback executed after words habve been highlighted
       */
      logEntry("highlight_proper_text");

      var sWords =$el.text();
      var osStore = new DS.OutputStore({countDown: 1, propagateResult: function () {
         logEntry("propagateResult");
         var highlit_text = osStore.toString();
         $el.html(highlit_text);
         if (then_callback) {
            then_callback(sWords, highlit_text, $el);
         }
         logExit("propagateResult");
      }
                                       });
      cached_highlight(sWords, osStore);
      logExit("highlight_proper_text");
   }

   function highlight_text_in_div($el, then_callback) {
      /**
       * Highlights important words found in $el,
       * Works by wrapping all text between given set of tags in a span class
       * and later analyze text in each children tag of $el for important words
       */
      logEntry("highlight_text_in_div");
      var TEXT_SELECTORS = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li"].join(", ");

      $("script", $el).remove();
      $("head", $el).remove();
      $("iframe", $el).remove();
      $("header", $el).remove();

      // text_selectors cannot have SPAN inside, otherwise it will recurse infinitely
      // Wrap a span tag around text nodes for easier modification
      // issue: if a span do not have only text, that text outside of tags might fail to be parsed
      // remove text_selectors filter, do it for all tags, except for span -> cf. filter function application
      $(TEXT_SELECTORS, $el).contents().filter(function () {
         // filter all the noise of spaces that are converted to Node_text elements
         //todo : remove the this.nodeType!==1 redundant with the 3 put TEXT_NODE instead of 3
         return (this.nodeType !== 1) && (this.nodeType === 3) && (clean_text(this.textContent).length > 0);
      }).wrap("<span></span>").end().filter("br").remove(); //todo : test on a text with br elements (old web pages)

      var length = $el.children().length;
      if (length == 0) {
         logWrite(DBG.TAG.DEBUG, "processing element without child", $el.tagName, $el.text());
         highlight_proper_text($el, then_callback);
      } else {
         // go through recursively into the children
         logWrite(DBG.TAG.DEBUG, "", "tag", $el.get(0).tagName, "has ", length, "children", "processing them");

         $el.children().each(function () {
            highlight_text_in_div($(this), then_callback);
         });
      }
      logExit("highlight_text_in_div");
   }

   function generateTagAnalysisData($source) {
      /**
       INPUT:
       @param $source {jquery element} the id of the div source within which to select the text
       @returns {array} returns an array with text stats in ParagraphData object (div class, sentence number etc.)
       */
      logEntry("generateTagAnalysisData");

      var tagHTML = ["p"/*, "h1", "h2", "h3", "h4", "h5", "h6"*//*, "li"*/].join(", ");
      // table tags and spans should not be among those tags as it would affect the accurate counting of sentences.
      // table tags : a lots of single words would lower dramatically the average sentence number
      // span tags : One sentence can be separated into several span which falsify the counting
      var aData = []; // array which will contain the analysis of text paragraphs

      // Do clean-up of in-the-way tags
      $("script", $source).remove();
      $("meta", $source).remove();
      $("link", $source).remove();
      $("iframe", $source).remove();

      /* For each paragraph, calculate a series of indicators
       number of sentences
       average length of sentences in words
       number of links
       the first enclosing div
       */
      logWrite(DBG.TAG.DEBUG, "Computing stats on text with tags", tagHTML);
      $(tagHTML, $source).each(get_tag_stat);

      logExit("generateTagAnalysisData");
      return aData;

      function get_tag_stat(index, element) {
         // I have to put it inside that bloc to have aData available in the closure
         // that makes it harder to test it separately
         // called from a DOM object, in an each context
         // that means this refers to the DOM element, NOTE: the DOM element, not the jQuery version
         var paragraghData = new DS.ParagraphData();
         switch (element.nodeType) {
            case 1: //Represents an element
               // look for nodename and do something
               var tagName = element.tagName;

               var parentTagName = $(this).parent()[0].tagName;
               //logWrite(DBG.TAG.DEBUG, "element read", tagName, element.id, element.textContent);
               //logWrite(DBG.TAG.DEBUG, "element parent", parentTagName);

               // this portion of code ensure that value in tables do no count towards the stats
               // if they would, table elements with one number would dramatically lower the average of words
               // per sentence, hence a greater likelihood of excluding paragraphs
               //var isTableContent =  ? "false" : "true";
               if (parentTagName.search("T") !== -1) {
                  break;
               }

               var hierarchy = $(this).parentsUntil("body", "div") || [$("body")]; //!! to test! if no div enclosing, then body is used
               var div = $(hierarchy[0]); // By construction can't be null right?

               paragraghData.$el = $(this);
               paragraghData.tag = tagName;
               paragraghData.text = element.textContent;
               if (paragraghData.text === "") {
                  logWrite(DBG.TAG.WARNING, "text in element is empty : ignoring");
                  break;
               }

               var text_stats = get_text_stats(paragraghData.text);
               if (text_stats.avg_sentence_length === 0) {
                  // we don't count sentences with no words inside
                  break;
               }
               paragraghData.sentence_number = text_stats.sentence_number;
               paragraghData.avg_sentence_length = text_stats.avg_sentence_length;
               paragraghData.enclosing_div_id = (typeof div.attr("id") === "undefined") ? "" : div.attr("id");
               paragraghData.enclosing_div_class = (typeof div.attr("class") === "undefined") ? "" : div.attr("class");
               paragraghData.enclosing_div =
               get_DOM_select_format_from_class(paragraghData.enclosing_div_id, paragraghData.enclosing_div_class);//we have to take care of the case with several classes

               aData.push(paragraghData);
               break;

            case elem.TEXT_NODE: //Represents textual content in an element or attribute
               // that case should never happen because of the processing done prior to the call (wrap in span tags)
               // for the sake of completeness we could define it though
               logWrite(DBG.TAG.WARNING, "text", element);
               break;

            default:
               //do nothing
               logWrite(DBG.TAG.WARNING, "do nothing");
         }
      }
   }

   function get_DOM_select_format_from_class(div_id, div_class) {
      /**
       * This function return a selector from div_id, div_class parameter
       * For example: <div id=article class= summary    large  > -> #article.summary.large
       * @param div_id {string}
       * @param div_class {string}
       * @type {string}
       */
      var id_part = (div_id !== "") ? ID_SELECTOR_CHAR + div_id : "";
      var class_part = (div_class !== "") ?
                       [CLASS_SELECTOR_CHAR, clean_text(div_class).replace(/ /g, CLASS_SELECTOR_CHAR)].join("") : "";
      return [id_part, class_part].join("");
   }

   function read_and_add_title_to_$el($source, $dest) {
      // read the title tag from $source element and set it to $dest element
      logWrite(DBG.TAG.DEBUG, "title", $("title", $source).text());
      $dest.append($("<div id='article' class='title'/>"));
      var $dTitle = $("#article.title", $dest);
      var $title = $("title", $source);
      $dTitle.text($title.text());// praying that there is only 1 title on the page...
   }

   function getIndexInArray(aArray, field_to_search, value) {
      var i, iIndex = -1;
      for (i = 0; i < aArray.length; i++) {
         if (aArray[i][field_to_search] === value) {
            iIndex = i;
            break;
         }
      }
      return iIndex;
   }

   function create_div_in_DOM(div_id) {
      /* Create div element to hold the result
       If already existing, empty them
       */
      var $div = $("#" + div_id);
      if ($div.length !== 0) {
         logWrite(DBG.TAG.WARNING, "html_text_to_DOM: already existing id. Was emptied", div_id);
         $div.remove();
      }

      $div = $("<div id='" + div_id + "'/>");
      return $div;
   }

   function activate_read_words_over() {
      $("#" + DEST + " p").click(function (e) {
         console.log("Found: " + getWordAtPoint(e.target, e.clientX, e.clientY));
      });
   }

   return {//that's the object returned only for requirejs, e.g. the visible interface exposed
      make_article_readable           : make_article_readable,
      extract_relevant_text_from_html : extract_relevant_text_from_html,
      generateTagAnalysisData         : generateTagAnalysisData,
      compute_text_stats_group_by_div : compute_text_stats_group_by_div,
      select_div_to_keep              : select_div_to_keep,
      highlight_important_words       : highlight_important_words,
      highlight_proper_text           : highlight_proper_text,
      highlight_text_in_div           : highlight_text_in_div,
      read_and_add_title_to_$el       : read_and_add_title_to_$el,
      get_DOM_select_format_from_class: get_DOM_select_format_from_class,
      getIndexInArray                 : getIndexInArray,
      create_div_in_DOM               : create_div_in_DOM,
      activate_read_words_over        : activate_read_words_over
   };
});
