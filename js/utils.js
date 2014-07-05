/**
 * Created by bcouriol on 13/06/14.
 */

   // todo: verifier que la nouvelle fonction inspect fonctionne bien sans aucune reference restante a node.js (util)

define(['data_struct'], function (DS) {
   Array.prototype.isItArray = true;

   function isArray(ar) {
      return Array.isArray(ar) || (typeof ar === 'object' && objectToString(ar) === '[object Array]');
   }

   function caching(f, initial_cache) {
      /*
       Function who takes a function and returns an cached version of that function which memorized past computations
       That function is also added some utilities function to empty, set and get its cache
       f: the function to be cached. f takes an object and output another one
       initial_cache : an array of valueMap object which are simply couples (x,y) where y=f(x)
       NOTE: f: x -> y, but caching(f): [x] -> [y].
       HYPOTHESIS : We suppose that it is more efficient to compute whole arrays of value
       vs. sequentially computing single values
       LIMITATION :
       I don't think that's possible to create function inside this function, to empty,set or get cache, just recall the cached_f with an empty cache, but what about memory?
       IMPROVEMENT : possibility to index the cache! But would make sense only for a large  set of value right? could use
       a memory-based cache mechanish such as memcached (in-memory key-value store for small chunks of arbitrary data)?
       or disk-based caching (localstorage)
       KNOWN BUGS : sure inconsistency if the cache has one x and two y, e.g. if the mapping is not the one for a function
       */
      // issue: sure inconsistency if the cache has one x and two y, e.g. if the mapping is not the one for a function, that should be checked somewhere
      // nice to have: test for performance, weak link is indexOf search in the cache.

      var aCache = initial_cache; // out of the function
      /* check that aCache is an array
       */
      if (!isArray(aCache)) {
         logWrite(DBG.TAG.WARNING,
                  "initial_cache parameter of function 'caching' not an array (forcing it to empty array)", aCache);
         aCache = [];
      }

      var cached_f = function (aArg) {
         /*
          aArg is a single argument which is an array of values to be computed
          */

         // check that aArg is an array
         logEntry("cached_f");
         if (!isArray(aArg)) {
            logWrite(DBG.TAG.ERROR, "cached_f function not called with array parameter", aArg);
         } else {

            var mapped_values = [];
            var fvalue = null;
            logWrite(DBG.TAG.DEBUG, "aCache", aCache);
            if (/*typeof aCache === "undefined" || null === aCache || */aCache.length === 0) {//already tested that it is an array
               // could be the case if there is no second parameter for example
               // just act as if cache is empty

               // So in that case, there is no mapping in the cache, so
               // compute everything and cache the values
               logWrite(DBG.TAG.INFO, "Cache is empty");
               mapped_values = aArg.map(function (value) {
                  return new DS.ValueMap({x: value, y: f(value)});
               });
               // now copy the computed values to the cache
               aCache = mapped_values.map(function (value) {
                  return value;
               });
               logWrite(DBG.TAG.INFO, "Cache is filled with computed values", aCache);
            } else {
               var aCacheInputs = aCache.map(function (valueMap) {
                  return valueMap.x;
               });
               mapped_values = aArg.map(function (value) {
                  var index = aCacheInputs.indexOf(value); // nice to have : instead of looking one by one in the cache, look for the whole cache intersection in the parameter array
                  if (index > -1) {
                     // value already cached
                     logWrite(DBG.TAG.INFO, "Computation for value already in cache!", value, aCache[index]);
                     return aCache[index];
                  } else { // not in cache so cache it
                     fvalue = f(value);
                     logWrite(DBG.TAG.INFO, "New computation, caching the resulting value!", value, fvalue);
                     var newVal = new DS.ValueMap({x: value, y: fvalue});
                     aCache.push(newVal);
                     return newVal;
                  }
               });
            }
            logExit("cached_f");
            return mapped_values;
         }
      };
      cached_f.cache = aCache; // todo : seeing if it is possible to return the cache object for further modification
      cached_f.f = f; // giving a way to return to the original uncached version of f)

      return cached_f;
   }

   function trimInput(value) {
      return value.replace(/^\s*|\s*$/g, '');
   }

   function isNotEmpty(value) {
      if (value && value !== '') {
         return true;
      }
   }

   function isEmail(value) {
      var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
      if (filter.test(value)) {
         return true;
      }
   }

   function stylizeNoColor(str, styleType) {
      return str;
   }

   function stylizeWithColor(str, styleType) {
      var style = inspect.styles[styleType];

      if (style) {
         return '\u001b[' + inspect.colors[style][0] + 'm' + str + '\u001b[' + inspect.colors[style][1] + 'm';
      } else {
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
   function inspect(obj, opts) {
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
      } else if (opts) {
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

   function formatValue(ctx, value, recurseTimes) {
      // Provide a hook for user-specified inspect functions.
      // Check that value is an object with an inspect function on it
      if (ctx.customInspect && value &&
          typeof value.inspect === 'function' && // Filter out the util module, it's inspect function is special
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
         } else {
            return ctx.stylize('[Object]', 'special');
         }
      }

      ctx.seen.push(value);

      var output;
      if (array) {
         output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
      } else {
         output = keys.map(function (key) {
            return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
         });
      }

      ctx.seen.pop();

      return reduceToSingleString(output, base, braces);
   }

   function arrayToHash(array) {
      var hash = {};

      array.forEach(function (val, idx) {
         hash[val] = true;
      });

      return hash;
   }

   function isRegExp(re) {
      return typeof re === 'object' && objectToString(re) === '[object RegExp]';
   }

   function isFunction(object) {

      return !!(object && typeof object.constructor !== "undefined" && typeof object.call !== "undefined" &&
                typeof object.apply !== "undefined");

      // return typeof obj === 'function' && toString.call(obj) == '[object Function]';
      // this is a more precise version but slower
   }

   function isString(obj) {
      return obj && (typeof teststring === "string");
      // return obj && toString.call(obj) == '[object String]';
      // this is a more precise version but slower
   }

   function isDate(d) {
      return typeof d === 'object' && objectToString(d) === '[object Date]';
   }

   function isError(e) {
      return typeof e === 'object' && objectToString(e) === '[object Error]';
   }

   function formatPrimitive(ctx, value) {
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

   function formatError(value) {
      return '[' + Error.prototype.toString.call(value) + ']';
   }

   function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
      var output = [];
      for (var i = 0, l = value.length; i < l; ++i) {
         if (hasOwnProperty(value, String(i))) {
            output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
         } else {
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

   function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
      var name, str, desc;
      desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
      if (desc.get) {
         if (desc.set) {
            str = ctx.stylize('[Getter/Setter]', 'special');
         } else {
            str = ctx.stylize('[Getter]', 'special');
         }
      } else {
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
            } else {
               str = formatValue(ctx, desc.value, recurseTimes - 1);
            }
            if (str.indexOf('\n') > -1) {
               if (array) {
                  str = str.split('\n').map(function (line) {
                     return '  ' + line;
                  }).join('\n').substr(2);
               } else {
                  str = '\n' + str.split('\n').map(function (line) {
                     return '   ' + line;
                  }).join('\n');
               }
            }
         } else {
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
         } else {
            name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
            name = ctx.stylize(name, 'string');
         }
      }

      return name + ': ' + str;
   }

   function reduceToSingleString(output, base, braces) {
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

   function objectToString(o) {
      return Object.prototype.toString.call(o);
   }

   function timestamp() {
      var d = new Date();
      var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
      return [d.getDate(), months[d.getMonth()], time].join(' ');
   }

   function inherits(ctor, superCtor) {
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

   function _extend(origin, add) {
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

   function hasOwnProperty(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
   }

   // definition of helper function format, similar to sprintf of C
   // usage : String.format('{0} is dead, but {1} is alive! {0} {2}', 'ASP', 'ASP.NET');
   // result : ASP is dead, but ASP.NET is alive! ASP {2}

   if (!String.format) {
      String.format = function(format) {
         var args = Array.prototype.slice.call(arguments, 1);
         return format.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
               ? args[number]
               : match
               ;
         });
      };
   }

   /**
    * Return a timestamp with the format "m/d/yy h:MM:ss TT"
    * @type {Date}
    */

   function timeStamp() {
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
      for ( var i = 1; i < 3; i++ ) {
         if ( time[i] < 10 ) {
            time[i] = "0" + time[i];
         }
      }

      // Return the formatted string
      return date.join("/") + " " + time.join(":") + " " + suffix;
   }

   return {
      isArray       : isArray,
      caching       : caching,
      trimInput     : trimInput,
      isNotEmpty    : isNotEmpty,
      inspect       : inspect,
      isRegExp      : isRegExp,
      isDate        : isDate,
      isError       : isError,
      timestamp     : timestamp,
      inherits      : inherits,
      _extend       : _extend,
      hasOwnProperty: hasOwnProperty,
      isString : isString,
      isFunction : isFunction,
      sPrintf: String.format,
      timeStamp: timeStamp
   }
});
