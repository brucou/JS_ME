/**
 * Created by bcouriol on 1/06/14.
 */

// todo à chaque TAG ajouter le flag correspond true ou pas true pour inhiber la fonction. Ajouter d'autre tags?
// nice to have changer tous les DBG_ en DBG., revoir les tags dans le code si ils correspondent bien a la semantique

var DBG_INDENT_PREFIX = "";
var DBG_INDENT_STRING = "--";
var DBG_INDENT_STRING_LENGTH = DBG_INDENT_STRING.length;
var DBG = {
   TAG : {TRACE: "Trace", INFO: "Info",
      ERROR    : "Error",
      WARNING  : "Warning",
      DEBUG    : "DEBUG"},
   FLAG: {TRACE: "True", INFO: "True",
      ERROR    : "True",
      WARNING  : "True",
      DEBUG    : "True"},
   SEP : {
      SPACE: " ",
      TAG  : ": ",
      ARG  : ":: ",
      NAME : ":: "}
}

var DBG_MAX_CHAR = 40;
var DBG_CHAR_IN = ">";
var DBG_CHAR_OUT = "<";

function logEntry(context) {
   //context should be the function from which the logEntry is called
   DBG_INDENT_PREFIX += DBG_INDENT_STRING;
   logWrite(DBG.TAG.TRACE, DBG_INDENT_PREFIX + DBG_CHAR_IN + DBG.SEP.SPACE + context.toString().slice(0, DBG_MAX_CHAR));
}

function logExit(context) {
   //context should be the function from which the logEntry is called
   if (DBG_INDENT_PREFIX.length >= DBG_INDENT_STRING_LENGTH) {
      logWrite(DBG.TAG.TRACE,
               DBG_CHAR_OUT + DBG_INDENT_PREFIX + DBG.SEP.SPACE + context.toString().slice(0, DBG_MAX_CHAR));
      DBG_INDENT_PREFIX = DBG_INDENT_PREFIX.slice(0, DBG_INDENT_PREFIX.length - DBG_INDENT_STRING_LENGTH);
   } else {
      logWrite(DBG.TAG.ERROR, "logExit called probably without matching logEntry");
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
   if (tag === DBG.TAG.DEBUG && !DBG.FLAG.DEBUG) {
      return;
   }
   if (arg) {
      for (i = 2; i != arguments.length; i++) {
         if (!arguments[i]) {
            text += DBG.SEP.ARG + "??"
         } else {
            text += DBG.SEP.ARG + arguments[i].toString();
         }
      }
   }
   console.log(tag + DBG.SEP.TAG + text);
}

function setDebugMode(debug_category, debug_mode) {
   /*
    for the moment one mode, if parameter is false, then don't print the logWrite DEBUG
    INPUT : debug_mode : boolean (true or false)
    */
   DBG.FLAG[debug_category] = debug_mode;
}
