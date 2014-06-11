/**
 * Created by bcouriol on 5/06/14.
 */
const CLASS_SELECTOR_CHAR = ".";
const ID_SELECTOR_CHAR = "#";
const SOURCE = "source";
const DEST = "destination";

// todo: paragraghData.enclosing_div_id = $(hierarchy[0]).attr("id"); change it so that if undefined, it is set to "" //adjust the corresponding function make_selector_from_concat
// issue: deal with the error when the page cannot be loaded (undefined)
function make_article_readable(your_url, then_callback) {
   url_load(your_url, function (html_text) {extract_relevant_text_from_html(html_text); then_callback();});
}

function extract_relevant_text_from_html(html_text) {
   /*
    LIMITATION : Will not work for pages who have paragraph directly under body
    This case is currently considered pathological and ignored
    IMPROVEMENT : look if there is an article tag, in which case take the title and add it first with H1 tag before constructing the page
    */
   logEntry("extract_relevant_text_from_html");
   const TEXT_SELECTORS = ["p", "h1", "h2", "h3", "h4", "h5", "h6"].join(", ");
   const DIV_SELECTORS = ["article", "div"].join(", ");
   const MIN_SENTENCE_NUMBER = 5;
   const MIN_AVG_AVG_SENTENCE_LENGTH = 10;

   html_text_to_DOM(html_text, SOURCE);
   create_div_in_DOM(DEST);
   var aData = generateTagAnalysisData(SOURCE, [DIV_SELECTORS, TEXT_SELECTORS].join(", "));

   /*
    for each div:
    for each paragraph in that div
    number of sentences and avg. of avg words per sentences
    Take all divs satisfying those conditions:
    sum #sentences > min number (language dependent)
    #avg #avg_xx > min number (language dependent)
    */
   var aDivRow = []; // contains stats for each div
   var i = 0; // loop variable
   for (i = 0; i < aData.length; i++) {
      var pdStatRow = aData[i]; //ParagraphData object
      var div = pdStatRow.enclosing_div;
      var tagName = pdStatRow.tag;
      logWrite(DBG.TAG.DEBUG, "i, div, tagName", i, div, tagName);

      if (tagName === "P") {// we only compute summary stats for some tags
         var iIndex = getIndexInArray(aDivRow, "div", div);
         logWrite(DBG.TAG.DEBUG, "iIndex", iIndex);

         if (iIndex > -1) { // div class already added to the stat array
            aDivRow[iIndex].sum_sentence_number += pdStatRow.sentence_number;
            aDivRow[iIndex].sum_avg_sentence_length += pdStatRow.avg_sentence_length;
            aDivRow[iIndex].count_avg_sentence_length += 1;
         } else { // first time seen that div class, so add it to the stat array
            aDivRow.push({div: div, sum_sentence_number: pdStatRow.sentence_number, sum_avg_sentence_length: pdStatRow.avg_sentence_length, count_avg_sentence_length: 1});
         }
      }
   }


   /* we finished exploring, now gather the final stats
    */
   for (i = 0; i < aDivRow.length; i++) {
      aDivRow[i].avg_avg_sentence_length =
      aDivRow[i].sum_avg_sentence_length / aDivRow[i].count_avg_sentence_length;
   }

   /* Sort it
    aDivRow.sort(function (aDR1, aDR2) { // sorting two aDivRow[index] object on sum_sentence_number
    return aDR2.sum_sentence_number - adr1.sum_sentence_number;
    });
    */ // Don't sort it, I need in order of DOM traversal to present it in the same order

   /* Identify the div classes to keep in the DOM */
   var selectedDivs = [];
   for (i = 0; i < aDivRow.length; i++) {
      var pdStatRowPartial = aDivRow[i]; //ParagraphData object
      if (pdStatRowPartial.sum_sentence_number >= MIN_SENTENCE_NUMBER &&
          pdStatRowPartial.avg_avg_sentence_length >= MIN_AVG_AVG_SENTENCE_LENGTH) {
         // that div is selected candidate for display
         selectedDivs.push(pdStatRowPartial);
         logWrite(DBG.TAG.INFO, "div class, sentence_number, avg w/s", pdStatRowPartial.div,
                  pdStatRowPartial.sum_sentence_number, pdStatRowPartial.avg_avg_sentence_length);
      }
   }

   /*
    traverse DOM tree and display only the text tags (p, h1, etc.) under the selected divs
    NOTE : might be necessary to have a special treatment for div with no classes or id selectors
    */
   var wDest = $("#" + DEST);
   wDest.append($("<div id='article' class='title'/>"));
   var wTitle = $("#article.title");
   logWrite(DBG.TAG.DEBUG,$("title").text());
   wTitle.text($("title").text());// praying that there is only 1 title on the page...
   for (i = 0; i < selectedDivs.length; i++) {
      var pdStatRowPartial = selectedDivs[i];
      var div_selector = pdStatRowPartial.div;
      if (div_selector.length === 0) { // this is pathological case, where the relevant text is directly under the body tag
         logWrite(DBG.TAG.WARNING, "div_selector is empty, ignoring");
         continue;
      }
      logWrite(DBG.TAG.INFO, "div_selector", div_selector);
      wDest.append($(TEXT_SELECTORS, div_selector));
      /*
       NOTE : Another option si wDest.append($(div_selector));
       This allows to keep some extra information included in other child divs
       Also, one can add more selectors than TEXT_SELECTORS to include more things (image, tables, videos, etc.)
       */
      /*
       NOTE : maybe I should also in that case remove the div that have been recognized as non pertinent
       for instance, low avg_avg_sentence_length and high sum_sentence_number
       */
   }

   /* clean the DOM tree used for calculating the statistics*/
   $("#" + SOURCE).remove();

   logExit("extract_relevant_text_from_html");
}

function generateTagAnalysisData(source_id, tagHTML) {
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
   $("#" + source_id + " " + "head").remove();
   $("#" + source_id + " " + "script").remove();
   $("#" + source_id + " " + "meta").remove();

   /* For each paragraph, calculate a series of indicators
    number of sentences
    average length of sentences in words
    number of links
    the first enclosing div
    */
   logWrite(DBG.TAG.DEBUG, "tagHTML", tagHTML);
   $("#" + source_id + " " + tagHTML).each(get_tag_stat);

   function get_tag_stat(index, element) {

      paragraghData = new DS.ParagraphData();
      switch (element.nodeType) {
         case 1:
            // look for nodename and do something
            var tagName = element.tagName;
            if (tagName !== "DIV") {
               var hierarchy = $(this).parentsUntil("body", "div") || [$("body")]; //!! to test! if no div enclosing, then body is used
               var div = $(hierarchy[0]); // By construction can't be null right?


               paragraghData.$el = $(this);
               paragraghData.tag = tagName;
               paragraghData.text = element.textContent;
               var text_stats = get_text_stats(paragraghData.text);
               paragraghData.sentence_number = text_stats.sentence_number;
               paragraghData.avg_sentence_length = text_stats.avg_sentence_length;
               paragraghData.enclosing_div_id = (typeof div.attr("id") === "undefined") ? "" : div.attr("id");
               paragraghData.enclosing_div_class = (typeof div.attr("class") === "undefined") ? "" : div.attr("class");
               paragraghData.enclosing_div =
               ((paragraghData.enclosing_div_id !== "") ? ID_SELECTOR_CHAR + paragraghData.enclosing_div_id : "") +
               ((paragraghData.enclosing_div_class !== "") ? CLASS_SELECTOR_CHAR + paragraghData.enclosing_div_class :
                "");

               aData.push(paragraghData);
            }
            break;
         case 3:
            logWrite(DBG.TAG.WARNING, "text", element);
            break;
         default:
            //do nothing
            logWrite(DBG.TAG.WARNING, "do nothing");
      }

   }

   /*
    Empty the added div
    */
//   $("#" + source_id).html("");
   logWrite(DBG.TAG.DEBUG, "aData", aData);
   logExit("generateTagAnalysisData");
   return aData;
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

function html_text_to_DOM(html_text, div_id) {
   /* insert the html_text into a DOM structure to have it parsed automatically */

   /* Create a div element with id string_id
    If already existing, remove them
    */
   create_div_in_DOM(div_id);
   $("#" + div_id).html(html_text);
}

function create_div_in_DOM2(div_id) {
   /* Create div element to hold the result
    If already existing, empty them
    */
   if ($("#" + div_id).length !== 0) {
      logWrite(DBG.TAG.WARNING, "html_text_to_DOM: already existing id. Was removed", div_id);
      $("#" + div_id).remove();
   }
   $("body").append($("<div id='" + div_id + "'/>"));
}

function create_div_in_DOM(div_id) {
   /* Create div element to hold the result
    If already existing, empty them
    */
   var div = $("#" + div_id);
   if (div.length !== 0) {
      logWrite(DBG.TAG.WARNING, "html_text_to_DOM: already existing id. Was removed", div_id);
      div.remove();
   }
   $("body").append($("<div id='" + div_id + "'/>"));
}

function activate_read_words_over (){
   $("#" + DEST + " p").click(function (e) {
      console.log("Found: " + getWordAtPoint(e.target, e.clientX, e.clientY));
   });
}
/**
 * Created by bcouriol on 5/06/14.
 */
const CLASS_SELECTOR_CHAR = ".";
const ID_SELECTOR_CHAR = "#";
const SOURCE = "source";
const DEST = "destination";

// todo: paragraghData.enclosing_div_id = $(hierarchy[0]).attr("id"); change it so that if undefined, it is set to "" //adjust the corresponding function make_selector_from_concat
// issue: deal with the error when the page cannot be loaded (undefined)
function make_article_readable(your_url, then_callback) {
   url_load(your_url, function (html_text) {extract_relevant_text_from_html(html_text); then_callback();});
}

function extract_relevant_text_from_html(html_text) {
   /*
    LIMITATION : Will not work for pages who have paragraph directly under body
    This case is currently considered pathological and ignored
    IMPROVEMENT : look if there is an article tag, in which case take the title and add it first with H1 tag before constructing the page
    */
   logEntry("extract_relevant_text_from_html");
   const TEXT_SELECTORS = ["p", "h1", "h2", "h3", "h4", "h5", "h6"].join(", ");
   const DIV_SELECTORS = ["article", "div"].join(", ");
   const MIN_SENTENCE_NUMBER = 5;
   const MIN_AVG_AVG_SENTENCE_LENGTH = 10;

   html_text_to_DOM(html_text, SOURCE);
   create_div_in_DOM(DEST);
   var aData = generateTagAnalysisData(SOURCE, [DIV_SELECTORS, TEXT_SELECTORS].join(", "));

   /*
    for each div:
    for each paragraph in that div
    number of sentences and avg. of avg words per sentences
    Take all divs satisfying those conditions:
    sum #sentences > min number (language dependent)
    #avg #avg_xx > min number (language dependent)
    */
   var aDivRow = []; // contains stats for each div
   var i = 0; // loop variable
   for (i = 0; i < aData.length; i++) {
      var pdStatRow = aData[i]; //ParagraphData object
      var div = pdStatRow.enclosing_div;
      var tagName = pdStatRow.tag;
      logWrite(DBG.TAG.DEBUG, "i, div, tagName", i, div, tagName);

      if (tagName === "P") {// we only compute summary stats for some tags
         var iIndex = getIndexInArray(aDivRow, "div", div);
         logWrite(DBG.TAG.DEBUG, "iIndex", iIndex);

         if (iIndex > -1) { // div class already added to the stat array
            aDivRow[iIndex].sum_sentence_number += pdStatRow.sentence_number;
            aDivRow[iIndex].sum_avg_sentence_length += pdStatRow.avg_sentence_length;
            aDivRow[iIndex].count_avg_sentence_length += 1;
         } else { // first time seen that div class, so add it to the stat array
            aDivRow.push({div: div, sum_sentence_number: pdStatRow.sentence_number, sum_avg_sentence_length: pdStatRow.avg_sentence_length, count_avg_sentence_length: 1});
         }
      }
   }


   /* we finished exploring, now gather the final stats
    */
   for (i = 0; i < aDivRow.length; i++) {
      aDivRow[i].avg_avg_sentence_length =
      aDivRow[i].sum_avg_sentence_length / aDivRow[i].count_avg_sentence_length;
   }

   /* Sort it
    aDivRow.sort(function (aDR1, aDR2) { // sorting two aDivRow[index] object on sum_sentence_number
    return aDR2.sum_sentence_number - adr1.sum_sentence_number;
    });
    */ // Don't sort it, I need in order of DOM traversal to present it in the same order

   /* Identify the div classes to keep in the DOM */
   var selectedDivs = [];
   for (i = 0; i < aDivRow.length; i++) {
      var pdStatRowPartial = aDivRow[i]; //ParagraphData object
      if (pdStatRowPartial.sum_sentence_number >= MIN_SENTENCE_NUMBER &&
          pdStatRowPartial.avg_avg_sentence_length >= MIN_AVG_AVG_SENTENCE_LENGTH) {
         // that div is selected candidate for display
         selectedDivs.push(pdStatRowPartial);
         logWrite(DBG.TAG.INFO, "div class, sentence_number, avg w/s", pdStatRowPartial.div,
                  pdStatRowPartial.sum_sentence_number, pdStatRowPartial.avg_avg_sentence_length);
      }
   }

   /*
    traverse DOM tree and display only the text tags (p, h1, etc.) under the selected divs
    NOTE : might be necessary to have a special treatment for div with no classes or id selectors
    */
   var wDest = $("#" + DEST);
   wDest.append($("<div id='article' class='title'/>"));
   var wTitle = $("#article.title");
   logWrite(DBG.TAG.DEBUG,$("title").text());
   wTitle.text($("title").text());// praying that there is only 1 title on the page...
   for (i = 0; i < selectedDivs.length; i++) {
      var pdStatRowPartial = selectedDivs[i];
      var div_selector = pdStatRowPartial.div;
      if (div_selector.length === 0) { // this is pathological case, where the relevant text is directly under the body tag
         logWrite(DBG.TAG.WARNING, "div_selector is empty, ignoring");
         continue;
      }
      logWrite(DBG.TAG.INFO, "div_selector", div_selector);
      wDest.append($(TEXT_SELECTORS, div_selector));
      /*
       NOTE : Another option si wDest.append($(div_selector));
       This allows to keep some extra information included in other child divs
       Also, one can add more selectors than TEXT_SELECTORS to include more things (image, tables, videos, etc.)
       */
      /*
       NOTE : maybe I should also in that case remove the div that have been recognized as non pertinent
       for instance, low avg_avg_sentence_length and high sum_sentence_number
       */
   }

   /* clean the DOM tree used for calculating the statistics*/
   $("#" + SOURCE).remove();

   logExit("extract_relevant_text_from_html");
}

function generateTagAnalysisData(source_id, tagHTML) {
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
   $("#" + source_id + " " + "head").remove();
   $("#" + source_id + " " + "script").remove();
   $("#" + source_id + " " + "meta").remove();

   /* For each paragraph, calculate a series of indicators
    number of sentences
    average length of sentences in words
    number of links
    the first enclosing div
    */
   logWrite(DBG.TAG.DEBUG, "tagHTML", tagHTML);
   $("#" + source_id + " " + tagHTML).each(get_tag_stat);

   function get_tag_stat(index, element) {

      paragraghData = new DS.ParagraphData();
      switch (element.nodeType) {
         case 1:
            // look for nodename and do something
            var tagName = element.tagName;
            if (tagName !== "DIV") {
               var hierarchy = $(this).parentsUntil("body", "div") || [$("body")]; //!! to test! if no div enclosing, then body is used
               var div = $(hierarchy[0]); // By construction can't be null right?


               paragraghData.$el = $(this);
               paragraghData.tag = tagName;
               paragraghData.text = element.textContent;
               var text_stats = get_text_stats(paragraghData.text);
               paragraghData.sentence_number = text_stats.sentence_number;
               paragraghData.avg_sentence_length = text_stats.avg_sentence_length;
               paragraghData.enclosing_div_id = (typeof div.attr("id") === "undefined") ? "" : div.attr("id");
               paragraghData.enclosing_div_class = (typeof div.attr("class") === "undefined") ? "" : div.attr("class");
               paragraghData.enclosing_div =
               ((paragraghData.enclosing_div_id !== "") ? ID_SELECTOR_CHAR + paragraghData.enclosing_div_id : "") +
               ((paragraghData.enclosing_div_class !== "") ? CLASS_SELECTOR_CHAR + paragraghData.enclosing_div_class :
                "");

               aData.push(paragraghData);
            }
            break;
         case 3:
            logWrite(DBG.TAG.WARNING, "text", element);
            break;
         default:
            //do nothing
            logWrite(DBG.TAG.WARNING, "do nothing");
      }

   }

   /*
    Empty the added div
    */
//   $("#" + source_id).html("");
   logWrite(DBG.TAG.DEBUG, "aData", aData);
   logExit("generateTagAnalysisData");
   return aData;
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

function html_text_to_DOM(html_text, div_id) {
   /* insert the html_text into a DOM structure to have it parsed automatically */

   /* Create a div element with id string_id
    If already existing, remove them
    */
   create_div_in_DOM(div_id);
   $("#" + div_id).html(html_text);
}

function create_div_in_DOM2(div_id) {
   /* Create div element to hold the result
    If already existing, empty them
    */
   if ($("#" + div_id).length !== 0) {
      logWrite(DBG.TAG.WARNING, "html_text_to_DOM: already existing id. Was removed", div_id);
      $("#" + div_id).remove();
   }
   $("body").append($("<div id='" + div_id + "'/>"));
}

function create_div_in_DOM(div_id) {
   /* Create div element to hold the result
    If already existing, empty them
    */
   var div = $("#" + div_id);
   if (div.length !== 0) {
      logWrite(DBG.TAG.WARNING, "html_text_to_DOM: already existing id. Was removed", div_id);
      div.remove();
   }
   $("body").append($("<div id='" + div_id + "'/>"));
}

function activate_read_words_over (){
   $("#" + DEST + " p").click(function (e) {
      console.log("Found: " + getWordAtPoint(e.target, e.clientX, e.clientY));
   });
}
