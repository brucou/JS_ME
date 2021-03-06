/**
 * Created by bcouriol on 2/07/14.
 */
/**
 * Created by bcouriol on 1/06/14.
 */

var DBG_INDENT_PREFIX = "";
const DBG_INDENT_STRING = "--";
const DBG_INDENT_STRING_LENGTH = DBG_INDENT_STRING.length;
const ALL = "ALL";
const BY_DEFAULT = "BY_DEFAULT";

var DBG = {
  TAG    : {TRACE: "Trace", INFO: "Info",
    ERROR        : "Error",
    WARNING      : "Warning",
    DEBUG        : "DEBUG"},
  SEP    : {
    SPACE: " ",
    TAG  : ": ",
    ARG  : ":: ",
    NAME : ":: "},
  CONFIG : {
    DETAIL    : true,
    BY_DEFAULT: false // if DETAIL is false, then the by_default behaviour applies for all.
  },
  // empty object by default, should have values of the form :
  // func_name : true to enable detailed config, false defers to default values applyng to all
  // value all if set works for all function contexts
  CONTEXT: []
};

/** FAKE mechanism
 * setup at a global level
 */
var FAKE_MAP={};

function setConfig (tag, bool_flag, by_default) {
  DBG.CONFIG[tag] = {DETAIL: bool_flag, BY_DEFAULT: by_default.by_default};
}

setConfig(DBG.TAG.TRACE, false, {by_default: true}); // always trace
setConfig(DBG.TAG.INFO, false, {by_default: true});
setConfig(DBG.TAG.ERROR, false, {by_default: true});
setConfig(DBG.TAG.WARNING, true, {by_default: true}); //
setConfig(DBG.TAG.DEBUG, false, {by_default: true}); //

const DBG_MAX_CHAR = 40;
const DBG_CHAR_IN = ">";
const DBG_CHAR_OUT = "<";

function enableLog (TAG, context) {
  setLog(TAG, context, true);
}

function disableLog (TAG, context) {
  setLog(TAG, context, false);
}

function setLog (TAG, context, bool_flag) {
  // LIMITATION : context cannot be a reserved javascript function to avoid problem
  DBG.CONFIG[TAG][context] = bool_flag;
}

function logEntry (context) {
  //context should be the function from which the logEntry is called
  DBG_INDENT_PREFIX += DBG_INDENT_STRING;
  DBG.CONTEXT.push(context);
  logWrite(DBG.TAG.TRACE, DBG_INDENT_PREFIX + DBG_CHAR_IN + DBG.SEP.SPACE + context.toString().slice(0, DBG_MAX_CHAR));
}

function logExit (context) {
  //context should be the function from which the logEntry is called
  DBG.CONTEXT.pop();
  if (DBG_INDENT_PREFIX.length >= DBG_INDENT_STRING_LENGTH) {
    logWrite(DBG.TAG.TRACE,
             DBG_CHAR_OUT + DBG_INDENT_PREFIX + DBG.SEP.SPACE + context.toString().slice(0, DBG_MAX_CHAR));
    DBG_INDENT_PREFIX = DBG_INDENT_PREFIX.slice(0, DBG_INDENT_PREFIX.length - DBG_INDENT_STRING_LENGTH);
  }
  else {
    logWrite(DBG.TAG.ERROR, "logExit called probably without matching logEntry");
  }
}

function lastElemArray (array) {
  return array[array.length - 1];
}

//ojo with the logWrite called from logEntry which always must print!! logForceWrite??

function logWrite (tag, text, arg) {
  //just writes some text to some output terminal (console, or else)
  //however in function of the tag, one could decide to change the terminal
  // for example trace data could go to a specific file or terminal
  /*
   Add parameters validation : text can't be null or undefined
   */
  var context = lastElemArray(DBG.CONTEXT);
  var DETAIL = "DETAIL";

  if (typeof(DBG.CONFIG[tag][context]) === 'undefined' || DBG.CONFIG[tag][context] === null) {
    DBG.CONFIG[tag][context] = DBG.CONFIG[tag][BY_DEFAULT];
  }

  // if detailed configs are allowed then look at it, if false don't do anything
  if (DBG.CONFIG[DETAIL] && DBG.CONFIG[tag][DETAIL] && !DBG.CONFIG[tag][context]) {
    return;
  }
  if (DBG.CONFIG[DETAIL] && !DBG.CONFIG[tag][DETAIL] && !DBG.CONFIG[tag][BY_DEFAULT]) {
    return;
  }
  if (!DBG.CONFIG[DETAIL] && !DBG.CONFIG[DETAIL][BY_DEFAULT]) {
    return;
  }
  logForceWrite.apply(null, arguments);
}

function logForceWrite (tag, text, arg) {
  var i;
  const MAX_LETTERS = 20;
  var context = lastElemArray(DBG.CONTEXT);
  if (context) {
    context = context.substring(0, MAX_LETTERS);
  }
  text = ['[', padding_right(context, ' ', MAX_LETTERS), ']', ' ', text].join("");
  if (arg) {
    for (i = 2; i != arguments.length; i++) {
      if (!arguments[i]) {
        text += DBG.SEP.ARG + "??"
      }
      else {
        text += DBG.SEP.ARG + arguments[i].toString();
      }
    }
  }
  console.log(padding_right(tag, ' ', 6) + DBG.SEP.TAG + text);
}

/**
 * Helper function already contained in utils
 * @type {Date}
 */
function padding_right (s, c, n) {
  if (!s || !c || s.length >= n) {
    return s;
  }

  var max = (n - s.length) / c.length;
  for (var i = 0; i < max; i++) {
    s += c;
  }

  return s;
}

/**
 * Return a timestamp with the format "m/d/yy h:MM:ss TT"
 * @type {Date}
 */
function timeStamp () {
  // Create a date object with the current time
  var now = new Date();

  // Create an array with the current month, day and time
  var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];

  // Create an array with the current hour, minute and second
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

  // Determine AM or PM suffix based on the hour
  var suffix = ( time[0] < 12 ) ? "AM" : "PM";

  // Convert hour from military time
  time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;

  // If hour is 0, set it to 12
  time[0] = time[0] || 12;

  // If seconds and minutes are less than 10, add a zero
  for (var i = 1; i < 3; i++) {
    if (time[i] < 10) {
      time[i] = "0" + time[i];
    }
  }

  // Return the formatted string
  return date.join("/") + " " + time.join(":") + " " + suffix;
}

