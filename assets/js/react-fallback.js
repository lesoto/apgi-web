// React Fallback Implementation
// Provides minimal React functionality when CDN fails

(function () {
  "use strict";

  // Minimal React createElement function
  function createElement(type, props, ...children) {
    const element = document.createElement(type);

    if (props) {
      Object.keys(props).forEach((key) => {
        if (key === "className") {
          element.className = props[key];
        } else if (key === "style" && typeof props[key] === "object") {
          Object.assign(element.style, props[key]);
        } else if (key.startsWith("on") && typeof props[key] === "function") {
          const eventType = key.substring(2).toLowerCase();
          element.addEventListener(eventType, props[key]);
        } else if (key !== "children") {
          element.setAttribute(key, props[key]);
        }
      });
    }

    children.forEach((child) => {
      if (typeof child === "string" || typeof child === "number") {
        element.appendChild(document.createTextNode(child));
      } else if (child && child.nodeType) {
        element.appendChild(child);
      }
    });

    return element;
  }

  // Minimal Component class
  class Component {
    constructor(props) {
      this.props = props || {};
      this.state = {};
    }

    setState(newState) {
      this.state = Object.assign({}, this.state, newState);
      if (this.componentDidMount) {
        this.componentDidMount();
      }
    }

    render() {
      return null;
    }
  }

  // Create global React object
  window.React = {
    createElement,
    Component,
    PureComponent: Component,
    useState: function (initialValue) {
      return [initialValue, function () {}];
    },
    useEffect: function (fn) {
      if (typeof fn === "function") {
        setTimeout(fn, 0);
      }
    },
    useRef: function (initialValue) {
      return { current: initialValue };
    },
    useCallback: function (fn) {
      return fn;
    },
    useMemo: function (fn) {
      return fn();
    },
  };

  console.info("React fallback loaded - basic functionality available");
})();
