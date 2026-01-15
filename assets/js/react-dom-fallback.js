// React DOM Fallback Implementation
// Provides minimal ReactDOM functionality when CDN fails

(function () {
  "use strict";

  function render(element, container) {
    if (!container) {
      console.error("ReactDOM fallback: Container is required");
      return;
    }

    // Clear container
    container.innerHTML = "";

    if (element && element.nodeType) {
      container.appendChild(element);
    } else if (typeof element === "string") {
      container.innerHTML = element;
    } else {
      console.warn("ReactDOM fallback: Invalid element", element);
    }
  }

  function createPortal(element, container) {
    return {
      element,
      container,
      _isPortal: true,
    };
  }

  // Create global ReactDOM object
  window.ReactDOM = {
    render,
    createPortal,
    hydrate: render,
    unmountComponentAtNode: function (container) {
      if (container) {
        container.innerHTML = "";
      }
    },
    findDOMNode: function (component) {
      return (component && component.element) || null;
    },
  };

  console.info("ReactDOM fallback loaded - basic functionality available");
})();
