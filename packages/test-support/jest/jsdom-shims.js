function getGlobal() {
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  return global;
}

function createCanvasContext() {
  return {
    fillRect: function () {},
    clearRect: function () {},
    getImageData: function (_x, _y, w, h) {
      return { data: new Array((w || 0) * (h || 0) * 4) };
    },
    putImageData: function () {},
    createImageData: function () {
      return [];
    },
    setTransform: function () {},
    resetTransform: function () {},
    drawImage: function () {},
    save: function () {},
    restore: function () {},
    fillText: function () {},
    strokeText: function () {},
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    closePath: function () {},
    stroke: function () {},
    translate: function () {},
    scale: function () {},
    rotate: function () {},
    arc: function () {},
    fill: function () {},
    measureText: function (text) {
      return { width: String(text || "").length * 10 };
    },
    transform: function () {},
    rect: function () {},
    clip: function () {},
    quadraticCurveTo: function () {},
    bezierCurveTo: function () {},
    setLineDash: function () {},
  };
}

function installCommonJsdomShims() {
  const g = getGlobal();

  if (typeof g.URL === "object" || typeof g.URL === "function") {
    if (typeof g.URL.createObjectURL !== "function") {
      g.URL.createObjectURL = function createObjectURL() {
        return "blob:jsdom-shim";
      };
    }
    if (typeof g.URL.revokeObjectURL !== "function") {
      g.URL.revokeObjectURL = function revokeObjectURL() {};
    }
  }

  if (typeof g.requestAnimationFrame !== "function") {
    g.requestAnimationFrame = function requestAnimationFrame(callback) {
      return setTimeout(function () {
        callback(Date.now());
      }, 0);
    };
  }
  if (typeof g.cancelAnimationFrame !== "function") {
    g.cancelAnimationFrame = function cancelAnimationFrame(id) {
      clearTimeout(id);
    };
  }

  if (typeof g.MessageChannel !== "function") {
    function ShimMessagePort() {
      this.onmessage = null;
      this._paired = null;
    }
    ShimMessagePort.prototype.postMessage = function postMessage(data) {
      const target = this._paired;
      if (!target) return;
      setTimeout(function () {
        if (typeof target.onmessage === "function") {
          target.onmessage({ data: data });
        }
      }, 0);
    };
    ShimMessagePort.prototype.start = function start() {};
    ShimMessagePort.prototype.close = function close() {};
    ShimMessagePort.prototype.addEventListener = function addEventListener() {};
    ShimMessagePort.prototype.removeEventListener = function removeEventListener() {};

    function ShimMessageChannel() {
      this.port1 = new ShimMessagePort();
      this.port2 = new ShimMessagePort();
      this.port1._paired = this.port2;
      this.port2._paired = this.port1;
    }

    g.MessageChannel = ShimMessageChannel;
    if (typeof g.MessagePort !== "function") {
      g.MessagePort = ShimMessagePort;
    }
  }

  if (typeof g.HTMLElement !== "undefined" && typeof g.HTMLElement.prototype.scrollIntoView !== "function") {
    g.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
  }

  if (typeof g.HTMLCanvasElement !== "undefined") {
    const proto = g.HTMLCanvasElement.prototype;
    if (typeof proto.getContext !== "function") {
      proto.getContext = function getContext() {
        return createCanvasContext();
      };
    }
  }

  if (typeof g.getComputedStyle === "function" && !g.getComputedStyle.__jsdomShimPatched) {
    const originalGetComputedStyle = g.getComputedStyle.bind(g);
    function patchedGetComputedStyle(elt, pseudoElt) {
      const style = originalGetComputedStyle(elt, pseudoElt);
      if (style && !style.fontFamily) {
        try {
          style.fontFamily = "sans-serif";
        } catch (_err) {}
      }
      return style;
    }
    patchedGetComputedStyle.__jsdomShimPatched = true;
    g.getComputedStyle = patchedGetComputedStyle;
  }
}

function installMatchMediaMock() {
  const g = getGlobal();
  if (typeof g.matchMedia === "function") {
    return;
  }

  const implementation = function matchMedia(query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {
        return false;
      },
    };
  };

  const value = typeof jest !== "undefined" && typeof jest.fn === "function" ? jest.fn(implementation) : implementation;

  try {
    Object.defineProperty(g, "matchMedia", {
      writable: true,
      configurable: true,
      value: value,
    });
  } catch (_err) {
    g.matchMedia = value;
  }
}

function installReactDomFindDOMNodeShim() {
  let ReactDOM;
  try {
    ReactDOM = require("react-dom");
  } catch (_err) {
    return;
  }
  if (!ReactDOM || typeof ReactDOM.findDOMNode === "function") {
    return;
  }

  ReactDOM.findDOMNode = function findDOMNode(componentOrElement) {
    if (componentOrElement == null) {
      return null;
    }
    if (componentOrElement.nodeType === 1 || componentOrElement.nodeType === 3 || componentOrElement.nodeType === 8) {
      return componentOrElement;
    }
    return null;
  };
}

function installResizeObserverShim() {
  const g = getGlobal();
  if (typeof g.ResizeObserver === "function") {
    return;
  }

  function ResizeObserver() {}
  ResizeObserver.prototype.observe = function observe() {};
  ResizeObserver.prototype.unobserve = function unobserve() {};
  ResizeObserver.prototype.disconnect = function disconnect() {};
  g.ResizeObserver = ResizeObserver;
}

module.exports = {
  installCommonJsdomShims,
  installMatchMediaMock,
  installReactDomFindDOMNodeShim,
  installResizeObserverShim,
};
