// D3.js Fallback Implementation
// Provides basic data visualization functionality when D3.js CDN fails

(function () {
  "use strict";

  // Basic D3-like selection API
  function Selection(elements) {
    this._elements = Array.from(elements || []);
  }

  Selection.prototype.select = function (selector) {
    const elements = this._elements.flatMap((el) =>
      Array.from(el.querySelectorAll(selector)),
    );
    return new Selection(elements);
  };

  Selection.prototype.selectAll = function (selector) {
    const elements = this._elements.flatMap((el) =>
      Array.from(el.querySelectorAll(selector)),
    );
    return new Selection(elements);
  };

  Selection.prototype.attr = function (name, value) {
    if (typeof value === "function") {
      this._elements.forEach((el, i) => {
        const val = value.call(el, el, i);
        if (val !== null && val !== undefined) {
          el.setAttribute(name, val);
        }
      });
    } else if (value !== null && value !== undefined) {
      this._elements.forEach((el) => el.setAttribute(name, value));
    }
    return this;
  };

  Selection.prototype.style = function (name, value) {
    if (typeof value === "function") {
      this._elements.forEach((el, i) => {
        const val = value.call(el, el, i);
        if (val !== null && val !== undefined) {
          el.style[name] = val;
        }
      });
    } else if (value !== null && value !== undefined) {
      this._elements.forEach((el) => (el.style[name] = value));
    }
    return this;
  };

  Selection.prototype.text = function (value) {
    if (typeof value === "function") {
      this._elements.forEach((el, i) => {
        const val = value.call(el, el, i);
        if (val !== null && val !== undefined) {
          el.textContent = val;
        }
      });
    } else if (value !== null && value !== undefined) {
      this._elements.forEach((el) => (el.textContent = value));
    }
    return this;
  };

  Selection.prototype.append = function (tagName) {
    const newElements = this._elements.map((el) => {
      const newEl = document.createElement(tagName);
      el.appendChild(newEl);
      return newEl;
    });
    return new Selection(newElements);
  };

  Selection.prototype.remove = function () {
    this._elements.forEach((el) => el.remove());
    return this;
  };

  Selection.prototype.data = function (data, key) {
    this._data = data;
    return this;
  };

  Selection.prototype.enter = function () {
    return new Selection(this._elements);
  };

  // Create global d3 object
  window.d3 = {
    select: function (selector) {
      const elements = document.querySelectorAll(selector);
      return new Selection(elements);
    },
    selectAll: function (selector) {
      const elements = document.querySelectorAll(selector);
      return new Selection(elements);
    },
    max: function (array, accessor) {
      if (!array || !array.length) return undefined;
      const values = accessor ? array.map(accessor) : array;
      return Math.max(...values);
    },
    min: function (array, accessor) {
      if (!array || !array.length) return undefined;
      const values = accessor ? array.map(accessor) : array;
      return Math.min(...values);
    },
    scaleLinear: function () {
      return {
        domain: function (d) {
          this._domain = d;
          return this;
        },
        range: function (r) {
          this._range = r;
          return this;
        },
        _domain: [0, 1],
        _range: [0, 1],
        call: function (value) {
          const [dMin, dMax] = this._domain;
          const [rMin, rMax] = this._range;
          const normalized = (value - dMin) / (dMax - dMin);
          return rMin + normalized * (rMax - rMin);
        },
      };
    },
    scaleBand: function () {
      return {
        domain: function (d) {
          this._domain = d;
          return this;
        },
        range: function (r) {
          this._range = r;
          return this;
        },
        padding: function (p) {
          this._padding = p;
          return this;
        },
        _domain: [],
        _range: [0, 1],
        _padding: 0,
        call: function (value) {
          const index = this._domain.indexOf(value);
          const bandwidth =
            (this._range[1] - this._range[0]) / this._domain.length;
          return this._range[0] + index * bandwidth;
        },
      };
    },
    axisBottom: function (scale) {
      return {
        scale: scale,
        call: function (selection) {
          // Simple axis implementation
          return selection;
        },
      };
    },
    axisLeft: function (scale) {
      return {
        scale: scale,
        call: function (selection) {
          return selection;
        },
      };
    },
  };

  console.info(
    "D3.js fallback loaded - basic selection and scale functionality available",
  );
})();
