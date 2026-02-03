/**
 * APGI Framework Polyfills
 * Provides compatibility for older browsers
 * Load this script before any other scripts
 */

// ES6+ Polyfills
(function () {
  "use strict";

  // Array.prototype.includes polyfill
  if (!Array.prototype.includes) {
    Array.prototype.includes = function (searchElement) {
      var O = Object(this);
      var len = parseInt(O.length) || 0;
      if (len === 0) return false;
      var n = parseInt(arguments[1]) || 0;
      var k;
      if (n >= 0) {
        k = n;
      } else {
        k = len + n;
        if (k < 0) k = 0;
      }
      var currentElement;
      while (k < len) {
        currentElement = O[k];
        if (
          searchElement === currentElement ||
          (searchElement !== searchElement && currentElement !== currentElement)
        ) {
          return true;
        }
        k++;
      }
      return false;
    };
  }

  // String.prototype.includes polyfill
  if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
      if (typeof start !== "number") {
        start = 0;
      }
      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }

  // Object.assign polyfill
  if (typeof Object.assign !== "function") {
    Object.assign = function (target) {
      if (target === null || typeof target === "undefined") {
        throw new TypeError("Cannot convert undefined or null to object");
      }
      var to = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource !== null && typeof nextSource !== "undefined") {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }

  // Array.from polyfill
  if (!Array.from) {
    Array.from = (function () {
      var toStr = Object.prototype.toString;
      var isCallable = function (fn) {
        return (
          typeof fn === "function" || toStr.call(fn) === "[object Function]"
        );
      };
      var toInteger = function (value) {
        var number = Number(value);
        if (isNaN(number)) {
          return 0;
        }
        if (number === 0 || !isFinite(number)) {
          return number;
        }
        return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
      };
      var maxSafeInteger = Math.pow(2, 53) - 1;
      var toLength = function (value) {
        var len = toInteger(value);
        return Math.min(Math.max(len, 0), maxSafeInteger);
      };
      return function from(arrayLike) {
        var C = this;
        var items = Object(arrayLike);
        if (arrayLike == null) {
          throw new TypeError(
            "Array.from requires an array-like object - not null or undefined",
          );
        }
        var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
        var T;
        if (typeof mapFn !== "undefined") {
          if (!isCallable(mapFn)) {
            throw new TypeError(
              "Array.from: when provided, the second argument must be a function",
            );
          }
          T = arguments.length > 2 ? arguments[2] : void undefined;
        }
        var len = toLength(items.length);
        var A = isCallable(C) ? Object(new C(len)) : new Array(len);
        var k = 0;
        var kValue;
        while (k < len) {
          kValue = items[k];
          if (mapFn) {
            A[k] =
              typeof T === "undefined"
                ? mapFn(kValue, k)
                : mapFn.call(T, kValue, k);
          } else {
            A[k] = kValue;
          }
          k += 1;
        }
        A.length = len;
        return A;
      };
    })();
  }

  // Fetch API polyfill (for older browsers)
  if (!window.fetch) {
    console.warn(
      "Fetch API not supported. Consider loading the whatwg-fetch polyfill.",
    );
  }

  // CustomEvent polyfill
  if (typeof window.CustomEvent !== "function") {
    function CustomEvent(event, params) {
      params = params || {
        bubbles: false,
        cancelable: false,
        detail: undefined,
      };
      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(
        event,
        params.bubbles,
        params.cancelable,
        params.detail,
      );
      return evt;
    }
    window.CustomEvent = CustomEvent;
  }

  // IntersectionObserver polyfill detection
  if (!("IntersectionObserver" in window)) {
    console.warn(
      "IntersectionObserver not supported. Consider loading intersection-observer polyfill.",
    );
  }

  // console.log('Polyfills loaded successfully');
})();
