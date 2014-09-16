/**
 * Created by bcouriol on 13/06/14.
 * TODO: Error treatment
 * - error treatment!!!!
 * A lot of those functions have a callback err, result. The question is how to react and propagate those errors
 * TODO: consistency between text handling text functions and utils tex functions
 * - isPunct for example
 * - - would be nice if punct list of characters would be language-dependant
 * - - also word split function and the like in text handling should reuse the text utils here to ensure consistency
 * - isNaN
 * - - isNaN recognizes english formatting of numbers only
 */


define(['data_struct'], function (DS) {
  Array.prototype.isItArray = true;

  var rePUNCT = /[ \,\.\$\uFFE5\^\+=`~<>{}\[\]|\u3000-\u303F!-#%-\x2A,-\/:;\x3F@\x5B-\x5D_\x7B}\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E3B\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]+/g;

  function getIndexInArray (aArray, field_to_search, value) {
    var i, iIndex = -1;
    for (i = 0; i < aArray.length; i++) {
      if (aArray[i][field_to_search] === value) {
        iIndex = i;
        break;
      }
    }
    return iIndex;
  }

  function isArray (ar) {
    return Array.isArray(ar) || (typeof ar === 'object' && objectToString(ar) === '[object Array]');
  }

  function async_cached (f, initialCache) {
    /*
     TODO TO UPDATE!!! We now a library for caching
     Function who takes a function and returns an cached version of that function which memorized past computations
     A cache object can be passed as a parameter. That cache object must implement the following interface:
     - getItem
     - setItem
     In addition it can also implement:
     - clear
     - toHtmlString
     - removeItem
     - removeWhere
     - size
     - stats
     The OutputStore functionality equals to that of a stream. Each character arrival (value) provokes
     a read action (function call), when the end is reached (countDown) the gathered charactered are passed to a function
     (propagateResult)
     @param f: the function to be applied. f takes an object and output another one
     @param initial_cache : a specific cache implemention OR if none, an array of valueMap object which are simply couples (x,y) where y=f(x), OR []
     */
    // nice to have : redesign the outputstore function to detect end of stream instead of having a fixed countdown

    // Default implementation of CachedValues is an array, it needs to be able to have property through CachedValues[prop] = value
    var cvCachedValues;

    if (initialCache && isArray(initialCache)) {
      // give the possibility to initialize the cachedvalues cache object with an array, it is easier
      cvCachedValues = new CachedValues(initialCache);
    }
    else if (!initialCache) {//no cache passed as parameter
      logWrite(DBG.TAG.INFO, "async function will not be cached");
    }
    else {
      cvCachedValues = initialCache; // if a cache is passed in parameter then use that one
    }

    var async_cached_f = function (value, osStore) {
      // could be refactored to separate functionality of OutputStore which is that of a stream buffer
      // it piles on values till a trigger (similar to "end" of stream) is detected, then a callback ensues
      // if OutputStore is a function, then it is considered to be the callback function with default values for OutputStore structure
      logEntry("async_cached_f");

      if (isFunction(osStore)) {
        var f_callback = osStore;
        osStore = new OutputStore({countdown: 1, callback: f_callback});
      }
      var index = osStore.push(["Input value", value].join(": ")); // this is in order to "book" a place in the output array to minimize chances that a concurrent exec does not take it
      // index points at the temporary value;

      var fvalue = null;
      // TODO : !! also applies to "", check that
      //logWrite(DBG.TAG.DEBUG, "cvCachedValues", inspect(cvCachedValues));
      if (cvCachedValues) { // if function is cached
        var fValue = cvCachedValues.getItem(value);
        if (fValue) {
          // value already cached, no callback, no execution, just assigning the value to the output array
          logWrite(DBG.TAG.DEBUG, "Computation for value already in cache!", inspect(value), inspect(fValue));
          updateOutputStore(osStore, index, fValue);
          //fvalue = aValue;
        }
        else { // not in cache so cache it, except if it is a number
          exec_f();
          cvCachedValues.setItem(value, fvalue);
        }
      }
      else {// if function is not cached
        //logWrite(DBG.TAG.INFO, "function is not cached so just executing it");
        exec_f();
      }

      logExit("async_cached_f");
      return fvalue;

      function exec_f () {
        fvalue = f(value, callback);
        osStore.setValueAt(index, osStore.getValueAt[index] + " | async call to f returns : " + fvalue);
        logWrite(DBG.TAG.INFO, "New async computation, logging value immediately returned by func", value, fvalue);
      }

      function updateOutputStore (osOutputStore, iIndex, aaValue) {
        osOutputStore.setValueAt(iIndex, aaValue);
        osOutputStore.invalidateAt(iIndex); // This is to propagate the change elsewhere who registered for an action to be taken
      }

      function callback (err, result) {
        logEntry("async cached callback");
        if (cvCachedValues) {
          if (!(err)) {
            cvCachedValues.setItem(value, result);
          }
          else {
            cvCachedValues.setItem(value, null);
          }
        }
        if (err) {
          logWrite(DBG.TAG.ERROR, "error while executing async query on server", err);
          osStore.setErr(err);
          osStore.invalidateAt(index);
        }
        else {
          updateOutputStore(osStore, index, result);
        }
        logExit("async cached callback");
      }
    };

    async_cached_f.cache = cvCachedValues;
    async_cached_f.f = f; // giving a way to return to the original uncached version of f)
    f.async_cached_f = async_cached_f;

    return async_cached_f;
  }

  function trimInput (value) {
    return value.replace(/^\s*|\s*$/g, '');
  }

  function isNotEmpty (value) {
    if (value && value !== '') {
      return true;
    }
  }

  function isEmail (value) {
    var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (filter.test(value)) {
      return true;
    }
  }

  function stylizeNoColor (str, styleType) {
    return str;
  }

  function stylizeWithColor (str, styleType) {
    var style = inspect.styles[styleType];

    if (style) {
      return '\u001b[' + inspect.colors[style][0] + 'm' + str + '\u001b[' + inspect.colors[style][1] + 'm';
    }
    else {
      return str;
    }
  }

  /**
   * Echos the value of a value. Trys to print the value out
   * in the best way possible given the different types.
   *
   * @param {Object} obj The object to print out.
   * @param {Object} opts Optional options object that alters the output.
   */
  /* legacy: obj, showHidden, depth, colors
   * The first required argument is the object, the second optional argument is
   whether to display the non-enumerable properties, the  third optional argument is the number of times the
   object is recursed (depth), and the fourth, also optional, is whether to style the output in ANSI colors.
   */
  function inspect (obj, opts) {
    // TAKEN FROM NODE
    // default options
    var ctx = {
      seen   : [],
      stylize: stylizeNoColor
    };
    // legacy...
    if (arguments.length >= 3) {
      ctx.depth = arguments[2];
    }
    if (arguments.length >= 4) {
      ctx.colors = arguments[3];
    }
    if (typeof opts === 'boolean') {
      // legacy...
      ctx.showHidden = opts;
    }
    else if (opts) {
      // got an "options" object
      exports._extend(ctx, opts);
    }
    // set default options
    if (typeof ctx.showHidden === 'undefined') {
      ctx.showHidden = false;
    }
    if (typeof ctx.depth === 'undefined') {
      ctx.depth = 2;
    }
    if (typeof ctx.colors === 'undefined') {
      ctx.colors = false;
    }
    if (typeof ctx.customInspect === 'undefined') {
      ctx.customInspect = true;
    }
    if (ctx.colors) {
      ctx.stylize = stylizeWithColor;
    }
    return formatValue(ctx, obj, ctx.depth);
  }

  function formatValue (ctx, value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (ctx.customInspect && value && typeof value.inspect === 'function' && // Filter out the util module, it's inspect function is special
        value.inspect !== exports.inspect && // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return String(value.inspect(recurseTimes));
    }

    // Primitive types cannot have properties
    var primitive = formatPrimitive(ctx, value);
    if (primitive) {
      return primitive;
    }

    // Look up the keys of the object.
    var keys = Object.keys(value);
    var visibleKeys = arrayToHash(keys);

    if (ctx.showHidden) {
      keys = Object.getOwnPropertyNames(value);
    }

    // Some type of object without properties can be shortcutted.
    if (keys.length === 0) {
      if (typeof value === 'function') {
        var name = value.name ? ': ' + value.name : '';
        return ctx.stylize('[Function' + name + ']', 'special');
      }
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      }
      if (isDate(value)) {
        return ctx.stylize(Date.prototype.toString.call(value), 'date');
      }
      if (isError(value)) {
        return formatError(value);
      }
    }

    var base = '', array = false, braces = ['{', '}'];

    // Make Array say that they are Array
    if (isArray(value)) {
      array = true;
      braces = ['[', ']'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = ' [Function' + n + ']';
    }

    // Make RegExps say that they are RegExps
    if (isRegExp(value)) {
      base = ' ' + RegExp.prototype.toString.call(value);
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + Date.prototype.toUTCString.call(value);
    }

    // Make error with message first say the error
    if (isError(value)) {
      base = ' ' + formatError(value);
    }

    if (keys.length === 0 && (!array || value.length == 0)) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      }
      else {
        return ctx.stylize('[Object]', 'special');
      }
    }

    ctx.seen.push(value);

    var output;
    if (array) {
      output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
    }
    else {
      output = keys.map(function (key) {
        return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
      });
    }

    ctx.seen.pop();

    return reduceToSingleString(output, base, braces);
  }

  function arrayToHash (array) {
    var hash = {};

    array.forEach(function (val, idx) {
      hash[val] = true;
    });

    return hash;
  }

  function isRegExp (re) {
    return typeof re === 'object' && objectToString(re) === '[object RegExp]';
  }

  function isFunction (object) {

    return !!(object && typeof object.constructor !== "undefined" && typeof object.call !== "undefined" &&
              typeof object.apply !== "undefined");

    // return typeof obj === 'function' && toString.call(obj) == '[object Function]';
    // this is a more precise version but slower
  }

  function isString (obj) {
    return obj && (typeof teststring === "string");
    // return obj && toString.call(obj) == '[object String]';
    // this is a more precise version but slower
  }

  function isPunct (char) {
    // return true if the character char is a punctuation sign
    // TODO: improve to adjust list of punctuation by language
    if (char.length > 1) {
      return null;
    }
    else {
      return (rePUNCT.exec(char));
    }
  }

  function isDate (d) {
    return typeof d === 'object' && objectToString(d) === '[object Date]';
  }

  function isError (e) {
    return typeof e === 'object' && objectToString(e) === '[object Error]';
  }

  function formatPrimitive (ctx, value) {
    switch (typeof value) {
      case 'undefined':
        return ctx.stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') +
                     '\'';
        return ctx.stylize(simple, 'string');

      case 'number':
        return ctx.stylize('' + value, 'number');

      case 'boolean':
        return ctx.stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return ctx.stylize('null', 'null');
    }
  }

  function formatError (value) {
    return '[' + Error.prototype.toString.call(value) + ']';
  }

  function formatArray (ctx, value, recurseTimes, visibleKeys, keys) {
    var output = [];
    for (var i = 0, l = value.length; i < l; ++i) {
      if (hasOwnProperty(value, String(i))) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
      }
      else {
        output.push('');
      }
    }
    keys.forEach(function (key) {
      if (!key.match(/^\d+$/)) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
      }
    });
    return output;
  }

  function formatProperty (ctx, value, recurseTimes, visibleKeys, key, array) {
    var name, str, desc;
    desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
    if (desc.get) {
      if (desc.set) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      }
      else {
        str = ctx.stylize('[Getter]', 'special');
      }
    }
    else {
      if (desc.set) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
    if (!hasOwnProperty(visibleKeys, key)) {
      name = '[' + key + ']';
    }
    if (!str) {
      if (ctx.seen.indexOf(desc.value) < 0) {
        if (recurseTimes === null) {
          str = formatValue(ctx, desc.value, null);
        }
        else {
          str = formatValue(ctx, desc.value, recurseTimes - 1);
        }
        if (str.indexOf('\n') > -1) {
          if (array) {
            str = str.split('\n').map(function (line) {
              return '  ' + line;
            }).join('\n').substr(2);
          }
          else {
            str = '\n' + str.split('\n').map(function (line) {
              return '   ' + line;
            }).join('\n');
          }
        }
      }
      else {
        str = ctx.stylize('[Circular]', 'special');
      }
    }
    if (typeof name === 'undefined') {
      if (array && key.match(/^\d+$/)) {
        return str;
      }
      name = JSON.stringify('' + key);
      if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
        name = name.substr(1, name.length - 2);
        name = ctx.stylize(name, 'name');
      }
      else {
        name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
        name = ctx.stylize(name, 'string');
      }
    }

    return name + ': ' + str;
  }

  function reduceToSingleString (output, base, braces) {
    var numLinesEst = 0;
    var length = output.reduce(function (prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) {
        numLinesEst++;
      }
      return prev + cur.length + 1;
    }, 0);

    if (length > 60) {
      return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
    }

    return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
  }

  function objectToString (o) {
    return Object.prototype.toString.call(o);
  }

  function timestamp () {
    var d = new Date();
    var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
    return [d.getDate(), months[d.getMonth()], time].join(' ');
  }

  function inherits (ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value       : ctor,
        enumerable  : false,
        writable    : true,
        configurable: true
      }
    });
  };

  function _extend (origin, add) {
    // Don't do anything if add isn't an object
    if (!add || typeof add !== 'object') {
      return origin;
    }

    var keys = Object.keys(add);
    var i = keys.length;
    while (i--) {
      origin[keys[i]] = add[keys[i]];
    }
    return origin;
  };

  function hasOwnProperty (obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  // definition of helper function format, similar to sprintf of C
  // usage : String.format('{0} is dead, but {1} is alive! {0} {2}', 'ASP', 'ASP.NET');
  // result : ASP is dead, but ASP.NET is alive! ASP {2}

  if (!String.format) {
    String.format = function (format) {
      var args = Array.prototype.slice.call(arguments, 1);
      return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
      });
    };
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

  function isNumberString (text) {
    // issue: isNaN recognizes english formatting of numbers only
    return !isNaN(text);
  }

  function CachedValues (arrayInit) {
    // constructor
    /* We are taking advantage here of the native hashmap implementation of javascript (search in O(1))
     On the down side, we might loose some efficiency in terms of storage, as each hash is a full-fledged new object.
     NOTE: keys can be any valid javascript string: cf. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
     NOTE: it is preferable to have keys trimmed and removed extra spaces to avoid unexpected or confusing results
     However indexedDB currently has an asynchronous API, which makes it difficult to use in connection with
     synchronous functions
     */
    self = this;
    this.internalStore = {};
    this.secondaryStore = [];
    this.jsObjectInternals =
    ["__proto__", "__noSuchMethod__", "__count__", "__parent__", "__defineGetter__", "__defineSetter__",
     "__lookupGetter__", "__lookupSetter__", "hasOwnProperty", "constructor", "isPrototypeOf", "propertyIsEnumerable",
     "toLocaleString", "toString", "valueOf"
      /* , "toSource", "eval", "watch", "unwatch" // not in js core anymore */
    ]; // this is the list of the function that cannot be used as keys in an object as they are already reserved
    this.jsOI_length = this.jsObjectInternals.length;

    this.getItem = function (key) {
      // return the fvalue if there, otherwise return false
      // be careful that fvalue not be a boolean otherwise it could conflict
      var isVinC = this.isValueInCache(key);
      if (isVinC.bool) {
        // that should be the normal case if that function is called
        var isRes = this.isReservedKey(key);
        if (isRes.bool) {
          // in secondary store
          return this.secondaryStore[isRes.index];
        }
        else {
          // in primary store
          return this.internalStore[key];
        }
      }
      else {
        // the function was called but nothing was found in cache!!
        return null;
      }
    };
    this.setItem = function (key, fvalue) {
      // check that the key is not already in the cache, if it is replace current by the new fvalue
      // e.g. cache is a indexed set
      // so we have a new row, or an update row operation here
      // returns false if error, true if operation was successful
      logEntry("putValueInCache");
      logWrite(DBG.TAG.DEBUG, "isValueInCache", inspect(this.isValueInCache(key).bool));
      if (this.isValueInCache(key).bool) {
        logWrite(DBG.TAG.DEBUG, "calling updateValueInCache", key, fvalue);
        logExit("putValueInCache");
        return this.updateValueInCache(key, fvalue);
      }
      else {
        // not in cache, add it
        // but add it where?
        var isRes = this.isReservedKey(key);
        logWrite(DBG.TAG.DEBUG, "not in cache");
        logWrite(DBG.TAG.DEBUG, "isReservedKey?", isRes.bool, isRes.index);
        if (isRes.bool) {
          logWrite(DBG.TAG.DEBUG, "adding to secondary Store");
          this.secondaryStore[isRes.index] = fvalue;
          logExit("putValueInCache");
          return true;
        }
        else {
          // add it to the internal store
          logWrite(DBG.TAG.DEBUG, "adding to internal store");
          this.internalStore[key] = fvalue;
          logExit("putValueInCache");
          return true;
        }
      }
    };

    this.isValueInCache = function (key) {
      // returns true if the key passed in parameter is already in the cache
      // first, test if the key is one of the reserved keys, because it will always match is applied to any object
      var isRes = this.isReservedKey(key);
      if (isRes.bool) {
        // the key is one of the reserved properties, look up the secondary store
        if (this.secondaryStore[isRes.index]) {
          return {isInternalStore: false, bool: true};
        }
        else {
          return {isInternalStore: false, bool: false};
        }
      }
      if (!!this.internalStore[key]) {
        // key is already cached
        return {isInternalStore: true, bool: true};
      }
      return {isInternalStore: true, bool: false};
    };

    this.updateValueInCache = function (key, fvalue) {
      // updates the value referenced by key in the cache
      // returns false if error, true if operation was successful
      // NOTE : this is an internal function, it can only be called by putValueInCache, it is supposed that the
      // value is in the cache already
      // we keep it that way in case of a change of implementation towards database which have a real update function

      var isVinC = this.isValueInCache(key);
      if (isVinC.bool) {// it should be in cache if we arrive, but double checking
        // already in cache, we update the value
        if (isVinC.isInternalStore) {
          // update internalStore
          this.internalStore[key] = fvalue;
          return true;
        }
        else {
          // it is in secondary store, update it there
          var isRes = this.isReservedKey(key);
          if (isRes.bool) {// should be, otherwise error
            // the key is one of the reserved properties, update in the secondary store
            this.secondaryStore[isRes.index] = fvalue;
            return true;
          }
        }
      }
      else {
        // if we arrive here, it is because it is not in either primary and secondary store, so return false
        return false;
      }
    };

    this.isReservedKey = function (key) {
      // returns true if the key is one of the reserved ones in jsObjectInternals
      for (var i = 0; i < this.jsOI_length; i++) {
        if (this.jsObjectInternals[i] === key) {
          return {index: i, bool: true};
        }
      }
      return {index: -1, bool: false};
    };

    this.init = function (arrayInit) {
      logEntry("CachedValues.init");
      logWrite(DBG.TAG.DEBUG, "input", inspect(arrayInit));
      if (arrayInit && isArray(arrayInit)) {
        arrayInit.forEach(function (element, index, array) {
          logWrite(DBG.TAG.DEBUG, "element", inspect(element), element["key"], element["value"]);
          self.putValueInCache(element["key"], element["value"]);
        })
      }
      else {
        logWrite(DBG.TAG.ERROR, "function init called with a parameter that is not an array");
      }
      logExit("CachedValues.init");
    };

    this.init(arrayInit);
  }

  function OutputStore (init) {
    // constructor
    var self = this;
    var defaults = {countDown: 1, aStore: [], err: null};
    defaults.propagateResult = function (err) {
      //prepare the reault values and call the callback function with it
      // but call it with objects indicating success or failure
      logEntry("propagateResult");
      self.callback(err, self.aStore);
      logExit("propagateResult");
    }; // default parameters, execute action after 1 value is stored
    defaults.callback = function (err, result) {
      logWrite(DBG.TAG.WARNING, "no callback function for asynchronous function call!");
      logWrite(DBG.TAG.DEBUG, "err, result", err, UT.inspect(result));
    };

    init = init || defaults;

    this.err = defaults.err;
    this.aStore = init.aStore || defaults.aStore;
    this.callback = init.callback || defaults.callback;
    this.countDown = init.countDown || defaults.countDown;
    this.propagateResult = init.propagateResult || defaults.propagateResult;

    this.setErr = function (err) {
      this.err = err;
    };
    this.getErr = function () {
      return this.err;
    };
    this.toString = function () {
      // print the concatenation of all values in storage
      var formatString = "";
      this.aStore.forEach(function (element, index, array) {
        if (element) {
          if (isPunct(element)) {
            var SEP_CHAR = "";
          }
          else {
            var SEP_CHAR = " ";
          }
          formatString = [formatString, element.toString()].join(SEP_CHAR);
        }
      });
      return formatString;
    };
    this.setValueAt = function (pos, value) {
      // set some value at index pos
      this.aStore[pos] = value;
    };
    this.getValueAt = function (pos) {
      // get the value at index pos
      return this.aStore[pos];
    };
    this.getValuesArray = function () {
      return this.aStore;
    };
    this.invalidateAt = function (pos) {
      // update the counter to reflect callback who already returned
      // if all callbacks returned then we can execute the final function to propagate results where it matters
      logEntry("invalidateAt");
      this.countDown = this.countDown - 1;
      if (this.countDown == 0) {
        this.propagateResult(self.err);
      }
      logExit("invalidateAt");
    };
    this.push = function (value) {
      // add a value in the store and return an index to it
      this.aStore.push(value);
      return this.aStore.length - 1;
    }
  }

  function escape_html (text) {
    // utility function taken from TransOver google extension
    return text.replace(XRegExp("(<|>|&)", 'g'), function ($0, $1) {
      switch ($1) {
        case '<':
          return "&lt;";
        case '>':
          return "&gt;";
        case '&':
          return "&amp;";
      }
    });
  }

  // left padding s with c to a total of n chars
  function padding_left (s, c, n) {
    if (!s || !c || s.length >= n) {
      return s;
    }

    var max = (n - s.length) / c.length;
    for (var i = 0; i < max; i++) {
      s = c + s;
    }

    return s;
  }

  // right padding s with c to a total of n chars
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

  function fragmentFromString (strHTML) {
    var temp = document.createElement('template');
    temp.innerHTML = strHTML;
    return temp.content;
  }

  return {
    isArray           : isArray,
    trimInput         : trimInput,
    isNotEmpty        : isNotEmpty,
    inspect           : inspect,
    isRegExp          : isRegExp,
    isDate            : isDate,
    isError           : isError,
    timestamp         : timestamp,
    inherits          : inherits,
    _extend           : _extend,
    hasOwnProperty    : hasOwnProperty,
    isString          : isString,
    isPunct           : isPunct,
    isFunction        : isFunction,
    sPrintf           : String.format,
    timeStamp         : timeStamp,
    isNumberString    : isNumberString,
    async_cached      : async_cached,
    OutputStore       : OutputStore,
    CachedValues      : CachedValues,
    getIndexInArray   : getIndexInArray,
    escape_html       : escape_html,
    padding_left      : padding_left,
    padding_right     : padding_right,
    fragmentFromString: fragmentFromString
  }
});
