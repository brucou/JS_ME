/**
 * Created by bcouriol on 5/06/14.
 */

   // issue: deal with the error when the page cannot be loaded (undefined)
   // issue: deal with lemonde, some words give null when you click on it?? Seems to happen after anchor links : replace anchor links by span class and copy the style of links
   // todo : disable click on links anyways - interacts with word info functionality
   // nice to have : refactor to separate selector (display) from functionality?
   // todo: !!test how the callback works in case of error in query on server
   // done: hid the source div DOM to accelerate display
   // issue: analyse why some paragraphs are not parsed : http://prazsky.denik.cz/zpravy_region/lenka-mrazova-dokonalost-je-moje-hodnota-20140627.html
// issue: lecourrierinternational what is happening?
// issue: issue with table tags in the text : cf last link

define(['jquery', 'debug', 'data_struct', 'url_load', 'utils', 'socketio'], function ($, DEBUG, DS, UL, UT, IO) {
   var CLASS_SELECTOR_CHAR = ".";
   var ID_SELECTOR_CHAR = "#";
   var SOURCE = "source";
   var DEST = "destination";

   function srv_qry_important_words(word, callback) {
      /*
       Word: the word to question the server with
       callback: executed when the server has finished its processing
       */
      rpc_socket.emit('highlight_important_words', word, callback);
   }

   //var cached_highlight = UT.async_cached(srv_qry_important_words, new DS.CachedValues([])); // no initial cache
   var cached_highlight = UT.async_cached(srv_qry_important_words, null); // we use the non-cached version

   function make_article_readable(your_url, then_callback) {
      UL.url_load(your_url, function (html_text) {
         extract_relevant_text_from_html(html_text);
         then_callback();
      });
   }

   function extract_relevant_text_from_html(html_text) {
      /*
       LIMITATION : Will not work for pages who have paragraph directly under body
       This case is currently considered pathological and ignored
       IMPROVEMENT : look if there is an article tag, in which case take the title and add it first with H1 tag before constructing the page
       */
      /*html_text =
       '<p> S odkazem na sdělení čínské firmy to v pátek uvedla agentura Reuters. This is in order to have a minimum of five paragraphs. The bad thing is I need to have at least five paragraphs to be selected. So here are two in English and one in czech, with enough words to have a high average and be selected. propertyIsEnumerable Je ochotna za něj zaplatit 1,34 miliardy korun.  </p>';
       */
      logEntry("extract_relevant_text_from_html");
      var TEXT_SELECTORS_FILTER = ["p", "h1", "h2", "h3", "h4", "h5", "h6"].join(", ");
      var TABLE_SELECTORS = ["th", "td"].join(", ");
      var LIST_SELECTORS = ["li"].join(", ");
      //const TEXT_SELECTORS = [TEXT_SELECTORS_FILTER, LIST_SELECTORS, TABLE_SELECTORS].join(", ");
      var TEXT_SELECTORS = [TEXT_SELECTORS_FILTER, LIST_SELECTORS].join(", ");
      var DIV_SELECTORS = "div"; //took off the article under div, otherwise wikipedia does not pass
      //const DIV_SELECTORS = ["div"];
      var MIN_SENTENCE_NUMBER = 7;
      var MIN_AVG_AVG_SENTENCE_LENGTH = 10;

      //logWrite(DBG.TAG.DEBUG, "html_text", html_text);
      var $source = create_div_in_DOM(SOURCE).html(html_text);
      $source.hide();
      $source.appendTo($("body")); //apparently it is necessary to add it to body to avoid having head and doctype etc tag added
      var $dest = create_div_in_DOM(DEST);
      //var aData = generateTagAnalysisData($source, [DIV_SELECTORS, TEXT_SELECTORS].join(", "));
      var aData = generateTagAnalysisData($source, TEXT_SELECTORS, TABLE_SELECTORS);

      //logWrite(DBG.TAG.DEBUG, "aData", aData);
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
      logWrite(DBG.TAG.INFO, "First compute the tag and text stats grouped by div");
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

      /* we finished exploring, now gather the final stats (averages)
       */
      logWrite(DBG.TAG.INFO, "We finished exploring, now gather the final stats (averages)");
      for (i = 0; i < aDivRow.length; i++) {
         aDivRow[i].avg_avg_sentence_length = aDivRow[i].sum_avg_sentence_length / aDivRow[i].count_avg_sentence_length;
      }

      /* Identify the div classes to keep in the DOM */
      var selectedDivs = [];
      logWrite(DBG.TAG.INFO, "Identify the div classes to keep in the DOM");
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

      /*
       traverse DOM tree and display only the text tags (p, h1, etc.) under the selected divs
       NOTE : might be necessary to have a special treatment for div with no classes or id selectors
       */
      logWrite(DBG.TAG.INFO, "Reading and adding title");
      $dest.append($("<div id='article' class='title'/>"));
      var $dTitle = $("#article.title", $dest);
      var $title = $("title", $source);
      $dTitle.text($title.text());// praying that there is only 1 title on the page...

      logWrite(DBG.TAG.INFO, "Highlighting important words");
      for (i = 0; i < selectedDivs.length; i++) {
         pdStatRowPartial = selectedDivs[i];
         var div_selector = pdStatRowPartial.div;
         if (div_selector.length === 0) { // this is pathological case, where the relevant text is directly under the body tag
            logWrite(DBG.TAG.WARNING, "div_selector is empty, ignoring");
            continue;
         }

         logWrite(DBG.TAG.INFO, "Highlighting important words on text from", div_selector);

         //$dest.append($(TEXT_SELECTORS, $(div_selector, $source)));
         // change this by calling new functions on a div
         //$body = $("body", $source);
         var $div_selector = $(div_selector);
         highlight_text($div_selector, TEXT_SELECTORS); //null : use current cache
         $div_selector.appendTo($dest);
      }

      $source.remove();
      $dest.appendTo("body");

      logExit("extract_relevant_text_from_html");
   }

   function highlight_proper_text(sWords, $el) {
      /*
       sWords : sentence whose words are to be highlit
       $el : jQuery element that contains sWords in its inner text
       cvCache : cache object that keeps a memory of already processed words
       srv_query : the query executed on the server that returns information on the importance of the word
       */
      logEntry("highlight_proper_text");
      /*
      var aInput = disaggregate_input(sWords);
       var osStore = new DS.OutputStore();
       osStore.countDown = aInput.length;
       */
      var osStore = new DS.OutputStore();
      osStore.countDown = 1;
      osStore.propagateResult = function () {
         logEntry("propagateResult");
         $el.html(osStore.toString());
         logExit("propagateResult");
      };
      /*aInput.map(function (element) {
         cached_highlight(element, osStore);
      }); //ojo it needs to apply the map function in order!!*/
      cached_highlight(sWords, osStore);
      logExit("highlight_proper_text");
   }

   function highlight_text($el, TEXT_SELECTORS) {
      logEntry("highlight_text");

      $("script", $el).remove();
      $("head", $el).remove();
      // text_selectors cannot have SPAN inside, otherwise it will recurse infinitely
      // Wrap a span tag around text nodes for easier modification
      // issue: if a span do not have only text, that text outside of tags might fail to be parsed
      $(TEXT_SELECTORS, $el).contents().filter(function () {
         // filter all the noise of spaces that are converted to Node_text elements
         //todo : remove the this.nodeType!==1 redundant with the 3 put TEXT_NODE instead of 3
         return (this.nodeType !== 1) && (this.nodeType === 3) && (clean_text(this.textContent).length > 0);
      }).wrap("<span></span>").end().filter("br").remove(); //todo : test on a text with br elements (old web pages)

      var length = $el.children().length;
      if (length == 0) {
         logWrite(DBG.TAG.DEBUG, "processing element without child", $el.tagName, $el.text());
         highlight_proper_text($el.text(), $el);
      } else {
         // go through recursively into the children
         logWrite(DBG.TAG.DEBUG, "", "tag", $el.get(0).tagName, "has ", length, "children", "processing them");

         $el.children().each(function () {
            highlight_text($(this), TEXT_SELECTORS);
         });
      }
      logExit("highlight_text");
   }

   function generateTagAnalysisData($source, tagHTML, TABLE_SELECTORS) {
      /*
       INPUT:
       source_id : the id of the div source within which to select the text
       tagHTML : the tags to filter the div (e.g. text tags)
       OUTPUT : returns an array with text stats in ParagraphData object (div class, sentence number etc.)
       */
      logEntry("generateTagAnalysisData");

      var aData = []; // array which will contain the analysis of text paragraphs

      /* Set the source div to the text to analyze to be able to use jQuery on it
       Note : Otherwise, I would have to do the parsing myself
       */

      /* Do come clean-up of in-the-way tags */
      //$("head", $source).remove(); don't remove the head, the title tag can be in it
      logWrite(DBG.TAG.DEBUG, "title", $("title", $source).text());
      $("script", $source).remove();
      $("meta", $source).remove();
      $("link", $source).remove();

      /* For each paragraph, calculate a series of indicators
       number of sentences
       average length of sentences in words
       number of links
       the first enclosing div
       */
      logWrite(DBG.TAG.DEBUG, "tagHTML", tagHTML);
      //$(tagHTML, $source).each(get_tag_stat);
      $(tagHTML, $source).each(get_tag_stat);

      //logWrite(DBG.TAG.DEBUG, "aData", aData);
      logExit("generateTagAnalysisData");
      return aData;

      function show(index, element) {
         logWrite(DBG.TAG.DEBUG, "element read", element.tagName, element.id, element.textContent);
      }

      function get_tag_stat(index, element) {
         var paragraghData = new DS.ParagraphData();
         switch (element.nodeType) {
            case 1: //Represents an element
               // look for nodename and do something
               var tagName = element.tagName;

               if (tagName !== "DIV") {
                  var parentTagName = $(this).parent()[0].tagName;
                  //logWrite(DBG.TAG.DEBUG, "element read", tagName, element.id, element.textContent);
                  //logWrite(DBG.TAG.DEBUG, "element parent", parentTagName);

                  // this portion of code ensure that value in tables do no count towards the stats
                  // if they would, table elements with one number would dramatically lower the average of words
                  // per sentence, hence a greater likelihood of excluding paragraphs
                  var isTableContent = parentTagName.search("T") ? "false" : "true";
                  if (isTableContent === "true") {
                     break;
                  }

                  var hierarchy = $(this).parentsUntil("body", "div") || [$("body")]; //!! to test! if no div enclosing, then body is used
                  var div = $(hierarchy[0]); // By construction can't be null right?

                  paragraghData.$el = $(this);
                  paragraghData.tag = tagName;
                  paragraghData.text = element.textContent;
                  var text_stats = get_text_stats(paragraghData.text);
                  paragraghData.sentence_number = text_stats.sentence_number;
                  paragraghData.avg_sentence_length = text_stats.avg_sentence_length;
                  paragraghData.enclosing_div_id = (typeof div.attr("id") === "undefined") ? "" : div.attr("id");
                  paragraghData.enclosing_div_class =
                  (typeof div.attr("class") === "undefined") ? "" : div.attr("class");
                  paragraghData.enclosing_div =
                  ((paragraghData.enclosing_div_id !== "") ? ID_SELECTOR_CHAR + paragraghData.enclosing_div_id : "") + (
                     (paragraghData.enclosing_div_class !== "") ?
                     CLASS_SELECTOR_CHAR + paragraghData.enclosing_div_class : "");

                  aData.push(paragraghData);
               }
               break;
            case elem.TEXT_NODE: //Represents textual content in an element or attribute, todo: this might cover text with a <p>, deal with it?
               logWrite(DBG.TAG.WARNING, "text", element);
               break;
            default:
               //do nothing
               logWrite(DBG.TAG.WARNING, "do nothing");
         }
      }

   }

   function getIndexInArray(aArray, field_to_search, value) {
      var i = 0, iIndex = -1;
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

   return {
      extract_relevant_text_from_html: extract_relevant_text_from_html,
      make_article_readable          : make_article_readable,
      generateTagAnalysisData        : generateTagAnalysisData,
      activate_read_words_over       : activate_read_words_over
   }
});

