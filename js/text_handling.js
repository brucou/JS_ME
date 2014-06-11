/**
 * Created by bcouriol on 11/05/14.
 */
function getWordAtPoint(elem, x, y) {
   /*
    Known issues : Sometimes, the text read from the cursor position is several words. That happens on boundaries of the paragrpah box
    */
   if (elem.nodeType == elem.TEXT_NODE) {
      range = elem.ownerDocument.createRange();
      range.selectNodeContents(elem);
      var currentPos = 0;
      var endPos = range.endOffset;
      while (currentPos + 1 < endPos) {
         range.setStart(elem, currentPos);
         range.setEnd(elem, currentPos + 1);
         if (range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right >= x &&
             range.getBoundingClientRect().top <= y && range.getBoundingClientRect().bottom >= y) {
            range.expand("word");
            var ret = range.toString();
            range.detach();
            return(ret);
         }
         currentPos += 1;
      }
   } else {
      for (var i = 0; i < elem.childNodes.length; i++) {
         range = elem.childNodes[i].ownerDocument.createRange();
         range.selectNodeContents(elem.childNodes[i]);
         if (range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right >= x &&
             range.getBoundingClientRect().top <= y && range.getBoundingClientRect().bottom >= y) {
            range.detach();
            return(getWordAtPoint(elem.childNodes[i], x, y));
         } else {
            range.detach();
         }
      }
   }
   return(null);
}

function get_text_stats(text) {
   /*
    Input : text (STRING), can be in several lines. Any HTML tags or else will be considered as normal text
    Output : an object with two fields:
    1. sentence_number
    2. avg_sentence_length

    NOTE : The correctness of this would be depending on the particular language. For example in czech, 1.6.2014 is not three sentence but one date
    IMPROVEMENT : add a parameter for taking language into account
    LIMIT CASES : text="" -> {0,0}
    */
   logEntry("get_text_stats");
   if (!text) {
      logWrite(DBG.TAG.ERROR, "invalid parameter text", text);
      logExit("get_text_stats");
   }

   // split by . which is not of the kind number followed by a . ->
   // count the number of split
   // for each split, count the number of words
   var word_number = text.toLowerCase().trim().replace(/[,;.!\?]/g, '').trim().split(/[\s\/]+/g).length;
   var sentence_number = text.split(".").length-1; // naive algorithm for english, just count number of dots.
   if (sentence_number === 0) {//if there is no DOT in the text, we still count one sentence
      sentence_number = 1;
   }
   //logWrite(DBG.TAG.INFO, "Input & Output", text, sentence_number, word_number);
   logExit("get_text_stats");
   return {sentence_number: sentence_number, avg_sentence_length: Math.round(word_number / sentence_number)};
}
