/**
 * Created by bcouriol on 1/06/14.
 */

var DBG_INDENT_PREFIX = "";
var DBG_INDENT_STRING = "--";
var DBG_INDENT_STRING_LENGTH = DBG_INDENT_STRING.length;
var DBG = {
   FLAGS: {
      DEBUG: true
   }
}

var DBG_TAGS = {
   TRACE  : "Trace",
   INFO   : "Info",
   ERROR  : "Error",
   WARNING: "Warning",
   DEBUG  : "DEBUG"
}
var DBG_TAG_SEP = ": ";
var DBG_ARG_SEP = ":: ";
var DBG_NAME_SEP = ":: ";
var DBG_SEP = " ";
var DBG_MAX_CHAR = 40;
var DBG_CHAR_IN = ">";
var DBG_CHAR_OUT = "<";

function logEntry(context) {
   //context should be the function from which the logEntry is called
   DBG_INDENT_PREFIX += DBG_INDENT_STRING;
   logWrite(DBG_TAGS.TRACE, DBG_INDENT_PREFIX + DBG_CHAR_IN + DBG_SEP + context.toString().slice(0, DBG_MAX_CHAR));
}

function logExit(context) {
   //context should be the function from which the logEntry is called
   if (DBG_INDENT_PREFIX.length >= DBG_INDENT_STRING_LENGTH) {
      logWrite(DBG_TAGS.TRACE, DBG_CHAR_OUT + DBG_INDENT_PREFIX + DBG_SEP + context.toString().slice(0, DBG_MAX_CHAR));
      DBG_INDENT_PREFIX = DBG_INDENT_PREFIX.slice(0, DBG_INDENT_PREFIX.length - DBG_INDENT_STRING_LENGTH);
   } else {
      logWrite(DBG_TAGS.ERROR, "logExit called probably without matching logEntry");
   }

}

function logWrite(tag, text, arg) {
   //just writes some text to some output terminal (console, or else)
   //however in function of the tag, one could decide to change the terminal
   // for example trace data could go to a specific file or terminal
   /*
    Add parameters validation : text can't be null or undefined
    */
   var i;
   if (tag === DBG_TAGS.DEBUG && !DBG.FLAGS.DEBUG) {
      return;
   }
   if (arg) {
      for (i = 2; i != arguments.length; i++) {
         if (!arguments[i]) {
            text += DBG_ARG_SEP + "??"
         } else {
            text += DBG_ARG_SEP + arguments[i].toString();
         }
      }
   }
   console.log(tag + DBG_TAG_SEP + text);
}

function setDebugMode(debug_mode) {
   /*
    for the moment one mode, if parameter is false, then don't print the logWrite DEBUG
    INPUT : debug_mode : boolean (true or false)
    */
   DBG.FLAGS.DEBUG = debug_mode;
}