/**
 * Created by bcouriol on 2/06/14.
 */

define(['utils'], function (UT) {
   return {
      ParagraphData: function ParagraphData(init_object) {
         /* For each paragraph, calculate a series of indicators
          number of sentences
          average length of sentences in words
          number of links
          the first enclosing div
          */
         // limit cases : init_object not defined
         init_object = init_object || {};

         this.$el = init_object.$el || null;
         this.tag = init_object.tag;
         this.text = init_object.text // text content of the tag
         this.sentence_number = init_object.sentence_number;
         this.avg_sentence_length = init_object.avg_sentence_length; //average length of sentences in words
         this.enclosing_div = init_object.enclosing_div; // first enclosing div
         this.enclosing_div_id = init_object.enclosing_div_id;
         this.enclosing_div_class = init_object.enclosing_div_class;

         this.toString = function () {
            return [this.$el.selector, this.tag, this.text.slice(0, 40), this.sentence_number, this.avg_sentence_length,
                    this.enclosing_div, "$$$"].join("\\");
         }
      },
      ValueMap     : function ValueMap(init_object) {
         /* Contains two fields, one input and one output
          This data structure is designed to cache one function value as in output = f(input);
          input and output can be any object.
          However this data structure is isolated and named here to be able to reference it by typeof
          for type checking
          */
         init_object = init_object || {};
         this.x = init_object.x;
         this.y = init_object.y;

         this.toString = function () {
            return "(" + [this.x, this.y].join(",") + ")";
         }
      },

      CachedValues: function CachedValues(arrayInit) {
         // constructor
         /* We are taking advantage here of the native hashmap implementation of javascript (search in O(1))
          On the down side, we might loose some efficiency in terms of storage, as each hash is a full-fledged new object.
          NOTE: keys can be any valid javascript string: cf. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
          NOTE: it is preferable to have keys trimmed and removed extra spaces to avoid unexpected or confusing results
          nice to have: A better implementation could be to use indexedDb who has indexes, which can speed up searches
          However indexedDB currently has an asynchronous API, which makes it difficult to use in connection with
          synchronous functions
          */
         self = this;
         this.internalStore = {};
         this.secondaryStore = [];
         this.jsObjectInternals =
         ["__proto__", "__noSuchMethod__", "__count__", "__parent__", "__defineGetter__", "__defineSetter__",
          "__lookupGetter__", "__lookupSetter__", "hasOwnProperty", "constructor", "isPrototypeOf",
          "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"
            /* , "toSource", "eval", "watch", "unwatch" // not in js core anymore */
         ]; // this is the list of the function that cannot be used as keys in an object as they are already reserved
         this.jsOI_length = this.jsObjectInternals.length;

         this.getValueFromCache = function (key) {
            // return the fvalue if there, otherwise return false
            // be careful that fvalue not be a boolean otherwise it could conflict
            var isVinC = this.isValueInCache(key);
            if (isVinC.bool) {
               // that should be the normal case if that function is called
               var isRes = this.isReservedKey(key);
               if (isRes.bool) {
                  // in secondary store
                  return this.secondaryStore[isRes.index];
               } else {
                  // in primary store
                  return this.internalStore[key];
               }
            } else {
               // the function was called but nothing was found in cache!!
               return {notInCache: "ERROR: tried to retrieve value from cache but could not find any"}; // we return an object as that should provoke an error somewhere up
            }
         };
         this.putValueInCache = function (key, fvalue) {
            // check that the key is not already in the cache, if it is replace current by the new fvalue
            // e.g. cache is a indexed set
            // so we have a new row, or an update row operation here
            // returns false if error, true if operation was successful
            logEntry("putValueInCache");
            logWrite(DBG.TAG.DEBUG, "isValueInCache", UT.inspect(this.isValueInCache(key).bool));
            if (this.isValueInCache(key).bool) {
               logWrite(DBG.TAG.DEBUG, "calling updateValueInCache", key, fvalue);
               logExit("putValueInCache");
               return this.updateValueInCache(key, fvalue);
            } else {
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
               } else {
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
               } else {
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
               } else {
                  // it is in secondary store, update it there
                  var isRes = this.isReservedKey(key);
                  if (isRes.bool) {// should be, otherwise error
                     // the key is one of the reserved properties, update in the secondary store
                     this.secondaryStore[isRes.index] = fvalue;
                     return true;
                  }
               }
            } else {
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
            logWrite(DBG.TAG.DEBUG, "input", UT.inspect(arrayInit));
            if (arrayInit && UT.isArray(arrayInit)) {
               arrayInit.forEach(function (element, index, array) {
                  logWrite(DBG.TAG.DEBUG, "element", UT.inspect(element), element["key"], element["value"]);
                  self.putValueInCache(element["key"], element["value"]);
               })
            } else {
               logWrite(DBG.TAG.ERROR, "function init called with a parameter that is not an array");
            }
            logExit("CachedValues.init");
         };

         this.init(arrayInit);
      },

      OutputStore: function OutputStore(init) {
         // constructor
         init = init || {countDown: 1, aStore: []}; // default parameters todo : think better if 1 is appropriate default value
         this.aStore = init.aStore;
         this.countDown = init.countDown;
         this.toString = function () {
            // print the concatenation of all values in storage
            var formatString = "";
            this.aStore.forEach(function (element, index, array) {
               if (element) {
                  if (UT.isPunct(element)) {
                     var SEP_CHAR = "";
                  } else {
                     var SEP_CHAR=" ";
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
         this.invalidateAt = function (pos) {
            // update the counter to reflect callback who already returned
            // if all callbacks returned then we can execute the final function to propagate results where it matters
            logEntry("invalidateAt");
            this.countDown = this.countDown - 1;
            if (this.countDown == 0) {
               this.propagateResult();
            }
            logExit("invalidateAt");
         };
         this.propagateResult = function () {
            // here should be upadated by the caller to reflect actions to perform when
            // all async calls have returned with their results in the store
            // todo : how to manage errors??
            logWrite(DBG.TAG.WARNING, "no propagateResult function!");
         };
         this.push = function (value) {
            // add a value in the store and return an index to it
            this.aStore.push(value);
            return this.aStore.length - 1;
         }
      }
   }
});
