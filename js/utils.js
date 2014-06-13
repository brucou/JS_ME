/**
 * Created by bcouriol on 13/06/14.
 */

/*
 Function who takes a function and returns an cached version of that function which converse the order of the value in its input
 That function is also added some utilities function to empty, set and get its cache
 f: the function to cache
 initial_cache : the cache to start with
 NOTE: f: value -> value, but caching(f): [values] -> [values].
 HYPOTHESIS : We suppose that it is more efficient to compute whole arrays of value
 vs. sequentially computing single values
 LIMITATION : I don't think that's possible to create function inside this function, to empty,set or get cache
 just recall the cached_f with an empty cache, but what about memory?
 */

define(['data_struct'], function (DS) {
   Array.prototype.isItArray = true;

   function isArray(object) {
      if ("undefined" !== typeof object && null !== object) {
         return (object.isItArray === true) ? true : false;
      } else {
         return false;
      }
   }

   function caching(f, initial_cache) {
      /*
       This functions transforms a function f into another function cached_f which memorized
       the past values of computations.
       f : the function to be cached. f takes an object and output another one
       initial_cache : an array of valueMap object which are simply couples (x,y) where y=f(x)
       */
      // issue : sure inconsistency if the cache has one x and two y
      // (e.g. if the mapping is not the one for a function, that should be checked somewhere

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
                  var index = aCacheInputs.indexOf(value);
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

      return cached_f;
   }

   return {
      isArray: isArray,
      caching: caching
   }
});
