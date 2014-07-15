/**
 * Created by bcouriol on 11/05/14.
 */
function getWordAtPoint(elem, x, y) {
   /*
    Known issues : Sometimes, the text read from the cursor position is several words. That happens on boundaries of the paragrpah box
    */
   if (elem.nodeType == elem.TEXT_NODE) {
      var range = elem.ownerDocument.createRange();
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
         var range = elem.childNodes[i].ownerDocument.createRange();
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
    @param text (string) The string text can be in several lines. Any HTML tags or else will be considered as normal text
    @returns an object with two fields:
    1. sentence_number
    2. avg_sentence_length

    issue : The correctness of this would be depending on the particular language. For example in czech, 1.6.2014 is not three sentence but one date
    todo : add a parameter for taking language into account
    LIMIT CASES : text="" -> {1,0}
    */
   //logEntry("get_text_stats");
   if (!text) {
      logWrite(DBG.TAG.ERROR, "invalid parameter text", text);
      logExit("get_text_stats");
      return null; //todo: implement a throw error mechanism
   }

   // split by . which is not of the kind number followed by a . ->
   // count the number of split
   // for each split, count the number of words
   var words =  text.toLowerCase().replace(/[,;.!\?]/g, '').trim().split(/[\s\/]+/g);
   var word_number = (words[0].trim().length === 0)? 0 : words.length; // case "" e.g. text with spaces and punct only
   // todo: write better: this is remove punctuation sign, clean and split
   var sentence_number = text.split(".").length - 1;
   // naive algorithm for english, just count number of dots.
   // even for english could be improved with .+space (\n or " " etc or EOF)
   // also, we take 1 as sentence number even if there is no ., it could be a sentence not terminated by a . like in a li element
   // but if there is a . somewhere then . are expected everywhere
   if (sentence_number === 0) {//if there is no DOT in the text, we still count one sentence
      sentence_number = 1;
   }
   //logWrite(DBG.TAG.INFO, "Input & Output", text, sentence_number, word_number);
   //logExit("get_text_stats");
   return {sentence_number: sentence_number, avg_sentence_length: Math.round(word_number / sentence_number)};
}

function clean_text(sWords) {
   return sWords.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, ' ').trim();
}

function disaggregate_input(sWords) {
   /* for now, just takes a string and returns an array of word tokens
    Consecutive spaces are reduced to one
    Trailing and leading spaces are taking out
    That includes characters such as \n \r, etc. anything considered spaces by regexp
    Tested on czech, french and english language characters
    nice to have : do further testing of international language support
    */
   // temp.sql: return clean_text(sWords).split(" ");
   return sWords.replace(/[^\u00C0-\u1FFF\u2C00-\uD7FF\w\s]|_/g, function ($1) {
      return ' ' + $1 + ' ';
   }).replace(/\s+/g, ' ').trim().split(' ');
}
