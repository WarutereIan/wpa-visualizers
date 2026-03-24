import { a as requireReact } from "./react.mjs";
import { r as requirePropTypes } from "./prop-types.mjs";
import { r as requireReactDom } from "./react-dom.mjs";
import { r as requireClsx } from "./clsx.mjs";
var cjs = { exports: {} };
var Draggable = {};
var domFns = {};
var shims = {};
var hasRequiredShims;
function requireShims() {
  if (hasRequiredShims) return shims;
  hasRequiredShims = 1;
  Object.defineProperty(shims, "__esModule", {
    value: true
  });
  shims.dontSetMe = dontSetMe;
  shims.findInArray = findInArray;
  shims.int = int;
  shims.isFunction = isFunction;
  shims.isNum = isNum;
  function findInArray(array, callback) {
    for (let i = 0, length = array.length; i < length; i++) {
      if (callback.apply(callback, [array[i], i, array])) return array[i];
    }
  }
  function isFunction(func) {
    return typeof func === "function" || Object.prototype.toString.call(func) === "[object Function]";
  }
  function isNum(num) {
    return typeof num === "number" && !isNaN(num);
  }
  function int(a) {
    return parseInt(a, 10);
  }
  function dontSetMe(props, propName, componentName) {
    if (props[propName]) {
      return new Error(`Invalid prop ${propName} passed to ${componentName} - do not set this, set it on the child.`);
    }
  }
  return shims;
}
var getPrefix = {};
var hasRequiredGetPrefix;
function requireGetPrefix() {
  if (hasRequiredGetPrefix) return getPrefix;
  hasRequiredGetPrefix = 1;
  Object.defineProperty(getPrefix, "__esModule", {
    value: true
  });
  getPrefix.browserPrefixToKey = browserPrefixToKey;
  getPrefix.browserPrefixToStyle = browserPrefixToStyle;
  getPrefix.default = void 0;
  getPrefix.getPrefix = getPrefix$1;
  const prefixes = ["Moz", "Webkit", "O", "ms"];
  function getPrefix$1() {
    let prop = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "transform";
    if (typeof window === "undefined") return "";
    const style = window.document?.documentElement?.style;
    if (!style) return "";
    if (prop in style) return "";
    for (let i = 0; i < prefixes.length; i++) {
      if (browserPrefixToKey(prop, prefixes[i]) in style) return prefixes[i];
    }
    return "";
  }
  function browserPrefixToKey(prop, prefix) {
    return prefix ? `${prefix}${kebabToTitleCase(prop)}` : prop;
  }
  function browserPrefixToStyle(prop, prefix) {
    return prefix ? `-${prefix.toLowerCase()}-${prop}` : prop;
  }
  function kebabToTitleCase(str) {
    let out = "";
    let shouldCapitalize = true;
    for (let i = 0; i < str.length; i++) {
      if (shouldCapitalize) {
        out += str[i].toUpperCase();
        shouldCapitalize = false;
      } else if (str[i] === "-") {
        shouldCapitalize = true;
      } else {
        out += str[i];
      }
    }
    return out;
  }
  getPrefix.default = getPrefix$1();
  return getPrefix;
}
var hasRequiredDomFns;
function requireDomFns() {
  if (hasRequiredDomFns) return domFns;
  hasRequiredDomFns = 1;
  Object.defineProperty(domFns, "__esModule", {
    value: true
  });
  domFns.addClassName = addClassName;
  domFns.addEvent = addEvent;
  domFns.addUserSelectStyles = addUserSelectStyles;
  domFns.createCSSTransform = createCSSTransform;
  domFns.createSVGTransform = createSVGTransform;
  domFns.getTouch = getTouch;
  domFns.getTouchIdentifier = getTouchIdentifier;
  domFns.getTranslation = getTranslation;
  domFns.innerHeight = innerHeight;
  domFns.innerWidth = innerWidth;
  domFns.matchesSelector = matchesSelector;
  domFns.matchesSelectorAndParentsTo = matchesSelectorAndParentsTo;
  domFns.offsetXYFromParent = offsetXYFromParent;
  domFns.outerHeight = outerHeight;
  domFns.outerWidth = outerWidth;
  domFns.removeClassName = removeClassName;
  domFns.removeEvent = removeEvent;
  domFns.scheduleRemoveUserSelectStyles = scheduleRemoveUserSelectStyles;
  var _shims = /* @__PURE__ */ requireShims();
  var _getPrefix = _interopRequireWildcard(/* @__PURE__ */ requireGetPrefix());
  function _interopRequireWildcard(e, t) {
    if ("function" == typeof WeakMap) var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
    return (_interopRequireWildcard = function(e2, t2) {
      if (!t2 && e2 && e2.__esModule) return e2;
      var o, i, f = { __proto__: null, default: e2 };
      if (null === e2 || "object" != typeof e2 && "function" != typeof e2) return f;
      if (o = t2 ? n : r) {
        if (o.has(e2)) return o.get(e2);
        o.set(e2, f);
      }
      for (const t3 in e2) "default" !== t3 && {}.hasOwnProperty.call(e2, t3) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e2, t3)) && (i.get || i.set) ? o(f, t3, i) : f[t3] = e2[t3]);
      return f;
    })(e, t);
  }
  let matchesSelectorFunc = "";
  function matchesSelector(el, selector) {
    if (!matchesSelectorFunc) {
      matchesSelectorFunc = (0, _shims.findInArray)(["matches", "webkitMatchesSelector", "mozMatchesSelector", "msMatchesSelector", "oMatchesSelector"], function(method) {
        return (0, _shims.isFunction)(el[method]);
      });
    }
    if (!(0, _shims.isFunction)(el[matchesSelectorFunc])) return false;
    return el[matchesSelectorFunc](selector);
  }
  function matchesSelectorAndParentsTo(el, selector, baseNode) {
    let node = el;
    do {
      if (matchesSelector(node, selector)) return true;
      if (node === baseNode) return false;
      node = node.parentNode;
    } while (node);
    return false;
  }
  function addEvent(el, event, handler, inputOptions) {
    if (!el) return;
    const options = {
      capture: true,
      ...inputOptions
    };
    if (el.addEventListener) {
      el.addEventListener(event, handler, options);
    } else if (el.attachEvent) {
      el.attachEvent("on" + event, handler);
    } else {
      el["on" + event] = handler;
    }
  }
  function removeEvent(el, event, handler, inputOptions) {
    if (!el) return;
    const options = {
      capture: true,
      ...inputOptions
    };
    if (el.removeEventListener) {
      el.removeEventListener(event, handler, options);
    } else if (el.detachEvent) {
      el.detachEvent("on" + event, handler);
    } else {
      el["on" + event] = null;
    }
  }
  function outerHeight(node) {
    let height = node.clientHeight;
    const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
    height += (0, _shims.int)(computedStyle.borderTopWidth);
    height += (0, _shims.int)(computedStyle.borderBottomWidth);
    return height;
  }
  function outerWidth(node) {
    let width = node.clientWidth;
    const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
    width += (0, _shims.int)(computedStyle.borderLeftWidth);
    width += (0, _shims.int)(computedStyle.borderRightWidth);
    return width;
  }
  function innerHeight(node) {
    let height = node.clientHeight;
    const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
    height -= (0, _shims.int)(computedStyle.paddingTop);
    height -= (0, _shims.int)(computedStyle.paddingBottom);
    return height;
  }
  function innerWidth(node) {
    let width = node.clientWidth;
    const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
    width -= (0, _shims.int)(computedStyle.paddingLeft);
    width -= (0, _shims.int)(computedStyle.paddingRight);
    return width;
  }
  function offsetXYFromParent(evt, offsetParent, scale) {
    const isBody = offsetParent === offsetParent.ownerDocument.body;
    const offsetParentRect = isBody ? {
      left: 0,
      top: 0
    } : offsetParent.getBoundingClientRect();
    const x = (evt.clientX + offsetParent.scrollLeft - offsetParentRect.left) / scale;
    const y = (evt.clientY + offsetParent.scrollTop - offsetParentRect.top) / scale;
    return {
      x,
      y
    };
  }
  function createCSSTransform(controlPos, positionOffset) {
    const translation = getTranslation(controlPos, positionOffset, "px");
    return {
      [(0, _getPrefix.browserPrefixToKey)("transform", _getPrefix.default)]: translation
    };
  }
  function createSVGTransform(controlPos, positionOffset) {
    const translation = getTranslation(controlPos, positionOffset, "");
    return translation;
  }
  function getTranslation(_ref, positionOffset, unitSuffix) {
    let {
      x,
      y
    } = _ref;
    let translation = `translate(${x}${unitSuffix},${y}${unitSuffix})`;
    if (positionOffset) {
      const defaultX = `${typeof positionOffset.x === "string" ? positionOffset.x : positionOffset.x + unitSuffix}`;
      const defaultY = `${typeof positionOffset.y === "string" ? positionOffset.y : positionOffset.y + unitSuffix}`;
      translation = `translate(${defaultX}, ${defaultY})` + translation;
    }
    return translation;
  }
  function getTouch(e, identifier) {
    return e.targetTouches && (0, _shims.findInArray)(e.targetTouches, (t) => identifier === t.identifier) || e.changedTouches && (0, _shims.findInArray)(e.changedTouches, (t) => identifier === t.identifier);
  }
  function getTouchIdentifier(e) {
    if (e.targetTouches && e.targetTouches[0]) return e.targetTouches[0].identifier;
    if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].identifier;
  }
  function addUserSelectStyles(doc) {
    if (!doc) return;
    let styleEl = doc.getElementById("react-draggable-style-el");
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.type = "text/css";
      styleEl.id = "react-draggable-style-el";
      styleEl.innerHTML = ".react-draggable-transparent-selection *::-moz-selection {all: inherit;}\n";
      styleEl.innerHTML += ".react-draggable-transparent-selection *::selection {all: inherit;}\n";
      doc.getElementsByTagName("head")[0].appendChild(styleEl);
    }
    if (doc.body) addClassName(doc.body, "react-draggable-transparent-selection");
  }
  function scheduleRemoveUserSelectStyles(doc) {
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(() => {
        removeUserSelectStyles(doc);
      });
    } else {
      removeUserSelectStyles(doc);
    }
  }
  function removeUserSelectStyles(doc) {
    if (!doc) return;
    try {
      if (doc.body) removeClassName(doc.body, "react-draggable-transparent-selection");
      if (doc.selection) {
        doc.selection.empty();
      } else {
        const selection = (doc.defaultView || window).getSelection();
        if (selection && selection.type !== "Caret") {
          selection.removeAllRanges();
        }
      }
    } catch (e) {
    }
  }
  function addClassName(el, className) {
    if (el.classList) {
      el.classList.add(className);
    } else {
      if (!el.className.match(new RegExp(`(?:^|\\s)${className}(?!\\S)`))) {
        el.className += ` ${className}`;
      }
    }
  }
  function removeClassName(el, className) {
    if (el.classList) {
      el.classList.remove(className);
    } else {
      el.className = el.className.replace(new RegExp(`(?:^|\\s)${className}(?!\\S)`, "g"), "");
    }
  }
  return domFns;
}
var positionFns = {};
var hasRequiredPositionFns;
function requirePositionFns() {
  if (hasRequiredPositionFns) return positionFns;
  hasRequiredPositionFns = 1;
  Object.defineProperty(positionFns, "__esModule", {
    value: true
  });
  positionFns.canDragX = canDragX;
  positionFns.canDragY = canDragY;
  positionFns.createCoreData = createCoreData;
  positionFns.createDraggableData = createDraggableData;
  positionFns.getBoundPosition = getBoundPosition;
  positionFns.getControlPosition = getControlPosition;
  positionFns.snapToGrid = snapToGrid;
  var _shims = /* @__PURE__ */ requireShims();
  var _domFns = /* @__PURE__ */ requireDomFns();
  function getBoundPosition(draggable, x, y) {
    if (!draggable.props.bounds) return [x, y];
    let {
      bounds
    } = draggable.props;
    bounds = typeof bounds === "string" ? bounds : cloneBounds(bounds);
    const node = findDOMNode(draggable);
    if (typeof bounds === "string") {
      const {
        ownerDocument
      } = node;
      const ownerWindow = ownerDocument.defaultView;
      let boundNode;
      if (bounds === "parent") {
        boundNode = node.parentNode;
      } else {
        const rootNode = node.getRootNode();
        boundNode = rootNode.querySelector(bounds);
      }
      if (!(boundNode instanceof ownerWindow.HTMLElement)) {
        throw new Error('Bounds selector "' + bounds + '" could not find an element.');
      }
      const boundNodeEl = boundNode;
      const nodeStyle = ownerWindow.getComputedStyle(node);
      const boundNodeStyle = ownerWindow.getComputedStyle(boundNodeEl);
      bounds = {
        left: -node.offsetLeft + (0, _shims.int)(boundNodeStyle.paddingLeft) + (0, _shims.int)(nodeStyle.marginLeft),
        top: -node.offsetTop + (0, _shims.int)(boundNodeStyle.paddingTop) + (0, _shims.int)(nodeStyle.marginTop),
        right: (0, _domFns.innerWidth)(boundNodeEl) - (0, _domFns.outerWidth)(node) - node.offsetLeft + (0, _shims.int)(boundNodeStyle.paddingRight) - (0, _shims.int)(nodeStyle.marginRight),
        bottom: (0, _domFns.innerHeight)(boundNodeEl) - (0, _domFns.outerHeight)(node) - node.offsetTop + (0, _shims.int)(boundNodeStyle.paddingBottom) - (0, _shims.int)(nodeStyle.marginBottom)
      };
    }
    if ((0, _shims.isNum)(bounds.right)) x = Math.min(x, bounds.right);
    if ((0, _shims.isNum)(bounds.bottom)) y = Math.min(y, bounds.bottom);
    if ((0, _shims.isNum)(bounds.left)) x = Math.max(x, bounds.left);
    if ((0, _shims.isNum)(bounds.top)) y = Math.max(y, bounds.top);
    return [x, y];
  }
  function snapToGrid(grid, pendingX, pendingY) {
    const x = Math.round(pendingX / grid[0]) * grid[0];
    const y = Math.round(pendingY / grid[1]) * grid[1];
    return [x, y];
  }
  function canDragX(draggable) {
    return draggable.props.axis === "both" || draggable.props.axis === "x";
  }
  function canDragY(draggable) {
    return draggable.props.axis === "both" || draggable.props.axis === "y";
  }
  function getControlPosition(e, touchIdentifier, draggableCore) {
    const touchObj = typeof touchIdentifier === "number" ? (0, _domFns.getTouch)(e, touchIdentifier) : null;
    if (typeof touchIdentifier === "number" && !touchObj) return null;
    const node = findDOMNode(draggableCore);
    const offsetParent = draggableCore.props.offsetParent || node.offsetParent || node.ownerDocument.body;
    return (0, _domFns.offsetXYFromParent)(touchObj || e, offsetParent, draggableCore.props.scale);
  }
  function createCoreData(draggable, x, y) {
    const isStart = !(0, _shims.isNum)(draggable.lastX);
    const node = findDOMNode(draggable);
    if (isStart) {
      return {
        node,
        deltaX: 0,
        deltaY: 0,
        lastX: x,
        lastY: y,
        x,
        y
      };
    } else {
      return {
        node,
        deltaX: x - draggable.lastX,
        deltaY: y - draggable.lastY,
        lastX: draggable.lastX,
        lastY: draggable.lastY,
        x,
        y
      };
    }
  }
  function createDraggableData(draggable, coreData) {
    const scale = draggable.props.scale;
    return {
      node: coreData.node,
      x: draggable.state.x + coreData.deltaX / scale,
      y: draggable.state.y + coreData.deltaY / scale,
      deltaX: coreData.deltaX / scale,
      deltaY: coreData.deltaY / scale,
      lastX: draggable.state.x,
      lastY: draggable.state.y
    };
  }
  function cloneBounds(bounds) {
    return {
      left: bounds.left,
      top: bounds.top,
      right: bounds.right,
      bottom: bounds.bottom
    };
  }
  function findDOMNode(draggable) {
    const node = draggable.findDOMNode();
    if (!node) {
      throw new Error("<DraggableCore>: Unmounted during event!");
    }
    return node;
  }
  return positionFns;
}
var DraggableCore = {};
var log = {};
var hasRequiredLog;
function requireLog() {
  if (hasRequiredLog) return log;
  hasRequiredLog = 1;
  Object.defineProperty(log, "__esModule", {
    value: true
  });
  log.default = log$1;
  function log$1() {
  }
  return log;
}
var hasRequiredDraggableCore;
function requireDraggableCore() {
  if (hasRequiredDraggableCore) return DraggableCore;
  hasRequiredDraggableCore = 1;
  Object.defineProperty(DraggableCore, "__esModule", {
    value: true
  });
  DraggableCore.default = void 0;
  var React = _interopRequireWildcard(/* @__PURE__ */ requireReact());
  var _propTypes = _interopRequireDefault(/* @__PURE__ */ requirePropTypes());
  var _reactDom = _interopRequireDefault(/* @__PURE__ */ requireReactDom());
  var _domFns = /* @__PURE__ */ requireDomFns();
  var _positionFns = /* @__PURE__ */ requirePositionFns();
  var _shims = /* @__PURE__ */ requireShims();
  var _log = _interopRequireDefault(/* @__PURE__ */ requireLog());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function _interopRequireWildcard(e, t) {
    if ("function" == typeof WeakMap) var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
    return (_interopRequireWildcard = function(e2, t2) {
      if (!t2 && e2 && e2.__esModule) return e2;
      var o, i, f = { __proto__: null, default: e2 };
      if (null === e2 || "object" != typeof e2 && "function" != typeof e2) return f;
      if (o = t2 ? n : r) {
        if (o.has(e2)) return o.get(e2);
        o.set(e2, f);
      }
      for (const t3 in e2) "default" !== t3 && {}.hasOwnProperty.call(e2, t3) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e2, t3)) && (i.get || i.set) ? o(f, t3, i) : f[t3] = e2[t3]);
      return f;
    })(e, t);
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r);
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  const eventsFor = {
    touch: {
      start: "touchstart",
      move: "touchmove",
      stop: "touchend"
    },
    mouse: {
      start: "mousedown",
      move: "mousemove",
      stop: "mouseup"
    }
  };
  let dragEventFor = eventsFor.mouse;
  let DraggableCore$1 = class DraggableCore extends React.Component {
    constructor() {
      super(...arguments);
      _defineProperty(this, "dragging", false);
      _defineProperty(this, "lastX", NaN);
      _defineProperty(this, "lastY", NaN);
      _defineProperty(this, "touchIdentifier", null);
      _defineProperty(this, "mounted", false);
      _defineProperty(this, "handleDragStart", (e) => {
        this.props.onMouseDown(e);
        if (!this.props.allowAnyClick && typeof e.button === "number" && e.button !== 0) return false;
        const thisNode = this.findDOMNode();
        if (!thisNode || !thisNode.ownerDocument || !thisNode.ownerDocument.body) {
          throw new Error("<DraggableCore> not mounted on DragStart!");
        }
        const {
          ownerDocument
        } = thisNode;
        if (this.props.disabled || !(e.target instanceof ownerDocument.defaultView.Node) || this.props.handle && !(0, _domFns.matchesSelectorAndParentsTo)(e.target, this.props.handle, thisNode) || this.props.cancel && (0, _domFns.matchesSelectorAndParentsTo)(e.target, this.props.cancel, thisNode)) {
          return;
        }
        if (e.type === "touchstart" && !this.props.allowMobileScroll) e.preventDefault();
        const touchIdentifier = (0, _domFns.getTouchIdentifier)(e);
        this.touchIdentifier = touchIdentifier;
        const position = (0, _positionFns.getControlPosition)(e, touchIdentifier, this);
        if (position == null) return;
        const {
          x,
          y
        } = position;
        const coreEvent = (0, _positionFns.createCoreData)(this, x, y);
        (0, _log.default)("DraggableCore: handleDragStart: %j", coreEvent);
        (0, _log.default)("calling", this.props.onStart);
        const shouldUpdate = this.props.onStart(e, coreEvent);
        if (shouldUpdate === false || this.mounted === false) return;
        if (this.props.enableUserSelectHack) (0, _domFns.addUserSelectStyles)(ownerDocument);
        this.dragging = true;
        this.lastX = x;
        this.lastY = y;
        (0, _domFns.addEvent)(ownerDocument, dragEventFor.move, this.handleDrag);
        (0, _domFns.addEvent)(ownerDocument, dragEventFor.stop, this.handleDragStop);
      });
      _defineProperty(this, "handleDrag", (e) => {
        const position = (0, _positionFns.getControlPosition)(e, this.touchIdentifier, this);
        if (position == null) return;
        let {
          x,
          y
        } = position;
        if (Array.isArray(this.props.grid)) {
          let deltaX = x - this.lastX, deltaY = y - this.lastY;
          [deltaX, deltaY] = (0, _positionFns.snapToGrid)(this.props.grid, deltaX, deltaY);
          if (!deltaX && !deltaY) return;
          x = this.lastX + deltaX, y = this.lastY + deltaY;
        }
        const coreEvent = (0, _positionFns.createCoreData)(this, x, y);
        (0, _log.default)("DraggableCore: handleDrag: %j", coreEvent);
        const shouldUpdate = this.props.onDrag(e, coreEvent);
        if (shouldUpdate === false || this.mounted === false) {
          try {
            this.handleDragStop(new MouseEvent("mouseup"));
          } catch (err) {
            const event = document.createEvent("MouseEvents");
            event.initMouseEvent("mouseup", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            this.handleDragStop(event);
          }
          return;
        }
        this.lastX = x;
        this.lastY = y;
      });
      _defineProperty(this, "handleDragStop", (e) => {
        if (!this.dragging) return;
        const position = (0, _positionFns.getControlPosition)(e, this.touchIdentifier, this);
        if (position == null) return;
        let {
          x,
          y
        } = position;
        if (Array.isArray(this.props.grid)) {
          let deltaX = x - this.lastX || 0;
          let deltaY = y - this.lastY || 0;
          [deltaX, deltaY] = (0, _positionFns.snapToGrid)(this.props.grid, deltaX, deltaY);
          x = this.lastX + deltaX, y = this.lastY + deltaY;
        }
        const coreEvent = (0, _positionFns.createCoreData)(this, x, y);
        const shouldContinue = this.props.onStop(e, coreEvent);
        if (shouldContinue === false || this.mounted === false) return false;
        const thisNode = this.findDOMNode();
        if (thisNode) {
          if (this.props.enableUserSelectHack) (0, _domFns.scheduleRemoveUserSelectStyles)(thisNode.ownerDocument);
        }
        (0, _log.default)("DraggableCore: handleDragStop: %j", coreEvent);
        this.dragging = false;
        this.lastX = NaN;
        this.lastY = NaN;
        if (thisNode) {
          (0, _log.default)("DraggableCore: Removing handlers");
          (0, _domFns.removeEvent)(thisNode.ownerDocument, dragEventFor.move, this.handleDrag);
          (0, _domFns.removeEvent)(thisNode.ownerDocument, dragEventFor.stop, this.handleDragStop);
        }
      });
      _defineProperty(this, "onMouseDown", (e) => {
        dragEventFor = eventsFor.mouse;
        return this.handleDragStart(e);
      });
      _defineProperty(this, "onMouseUp", (e) => {
        dragEventFor = eventsFor.mouse;
        return this.handleDragStop(e);
      });
      _defineProperty(this, "onTouchStart", (e) => {
        dragEventFor = eventsFor.touch;
        return this.handleDragStart(e);
      });
      _defineProperty(this, "onTouchEnd", (e) => {
        dragEventFor = eventsFor.touch;
        return this.handleDragStop(e);
      });
    }
    componentDidMount() {
      this.mounted = true;
      const thisNode = this.findDOMNode();
      if (thisNode) {
        (0, _domFns.addEvent)(thisNode, eventsFor.touch.start, this.onTouchStart, {
          passive: false
        });
      }
    }
    componentWillUnmount() {
      this.mounted = false;
      const thisNode = this.findDOMNode();
      if (thisNode) {
        const {
          ownerDocument
        } = thisNode;
        (0, _domFns.removeEvent)(ownerDocument, eventsFor.mouse.move, this.handleDrag);
        (0, _domFns.removeEvent)(ownerDocument, eventsFor.touch.move, this.handleDrag);
        (0, _domFns.removeEvent)(ownerDocument, eventsFor.mouse.stop, this.handleDragStop);
        (0, _domFns.removeEvent)(ownerDocument, eventsFor.touch.stop, this.handleDragStop);
        (0, _domFns.removeEvent)(thisNode, eventsFor.touch.start, this.onTouchStart, {
          passive: false
        });
        if (this.props.enableUserSelectHack) (0, _domFns.scheduleRemoveUserSelectStyles)(ownerDocument);
      }
    }
    // React Strict Mode compatibility: if `nodeRef` is passed, we will use it instead of trying to find
    // the underlying DOM node ourselves. See the README for more information.
    findDOMNode() {
      return this.props?.nodeRef ? this.props?.nodeRef?.current : _reactDom.default.findDOMNode(this);
    }
    render() {
      return /* @__PURE__ */ React.cloneElement(React.Children.only(this.props.children), {
        // Note: mouseMove handler is attached to document so it will still function
        // when the user drags quickly and leaves the bounds of the element.
        onMouseDown: this.onMouseDown,
        onMouseUp: this.onMouseUp,
        // onTouchStart is added on `componentDidMount` so they can be added with
        // {passive: false}, which allows it to cancel. See
        // https://developers.google.com/web/updates/2017/01/scrolling-intervention
        onTouchEnd: this.onTouchEnd
      });
    }
  };
  DraggableCore.default = DraggableCore$1;
  _defineProperty(DraggableCore$1, "displayName", "DraggableCore");
  _defineProperty(DraggableCore$1, "propTypes", {
    /**
     * `allowAnyClick` allows dragging using any mouse button.
     * By default, we only accept the left button.
     *
     * Defaults to `false`.
     */
    allowAnyClick: _propTypes.default.bool,
    /**
     * `allowMobileScroll` turns off cancellation of the 'touchstart' event
     * on mobile devices. Only enable this if you are having trouble with click
     * events. Prefer using 'handle' / 'cancel' instead.
     *
     * Defaults to `false`.
     */
    allowMobileScroll: _propTypes.default.bool,
    children: _propTypes.default.node.isRequired,
    /**
     * `disabled`, if true, stops the <Draggable> from dragging. All handlers,
     * with the exception of `onMouseDown`, will not fire.
     */
    disabled: _propTypes.default.bool,
    /**
     * By default, we add 'user-select:none' attributes to the document body
     * to prevent ugly text selection during drag. If this is causing problems
     * for your app, set this to `false`.
     */
    enableUserSelectHack: _propTypes.default.bool,
    /**
     * `offsetParent`, if set, uses the passed DOM node to compute drag offsets
     * instead of using the parent node.
     */
    offsetParent: function(props, propName) {
      if (props[propName] && props[propName].nodeType !== 1) {
        throw new Error("Draggable's offsetParent must be a DOM Node.");
      }
    },
    /**
     * `grid` specifies the x and y that dragging should snap to.
     */
    grid: _propTypes.default.arrayOf(_propTypes.default.number),
    /**
     * `handle` specifies a selector to be used as the handle that initiates drag.
     *
     * Example:
     *
     * ```jsx
     *   let App = React.createClass({
     *       render: function () {
     *         return (
     *            <Draggable handle=".handle">
     *              <div>
     *                  <div className="handle">Click me to drag</div>
     *                  <div>This is some other content</div>
     *              </div>
     *           </Draggable>
     *         );
     *       }
     *   });
     * ```
     */
    handle: _propTypes.default.string,
    /**
     * `cancel` specifies a selector to be used to prevent drag initialization.
     *
     * Example:
     *
     * ```jsx
     *   let App = React.createClass({
     *       render: function () {
     *           return(
     *               <Draggable cancel=".cancel">
     *                   <div>
     *                     <div className="cancel">You can't drag from here</div>
     *                     <div>Dragging here works fine</div>
     *                   </div>
     *               </Draggable>
     *           );
     *       }
     *   });
     * ```
     */
    cancel: _propTypes.default.string,
    /* If running in React Strict mode, ReactDOM.findDOMNode() is deprecated.
     * Unfortunately, in order for <Draggable> to work properly, we need raw access
     * to the underlying DOM node. If you want to avoid the warning, pass a `nodeRef`
     * as in this example:
     *
     * function MyComponent() {
     *   const nodeRef = React.useRef(null);
     *   return (
     *     <Draggable nodeRef={nodeRef}>
     *       <div ref={nodeRef}>Example Target</div>
     *     </Draggable>
     *   );
     * }
     *
     * This can be used for arbitrarily nested components, so long as the ref ends up
     * pointing to the actual child DOM node and not a custom component.
     */
    nodeRef: _propTypes.default.object,
    /**
     * Called when dragging starts.
     * If this function returns the boolean false, dragging will be canceled.
     */
    onStart: _propTypes.default.func,
    /**
     * Called while dragging.
     * If this function returns the boolean false, dragging will be canceled.
     */
    onDrag: _propTypes.default.func,
    /**
     * Called when dragging stops.
     * If this function returns the boolean false, the drag will remain active.
     */
    onStop: _propTypes.default.func,
    /**
     * A workaround option which can be passed if onMouseDown needs to be accessed,
     * since it'll always be blocked (as there is internal use of onMouseDown)
     */
    onMouseDown: _propTypes.default.func,
    /**
     * `scale`, if set, applies scaling while dragging an element
     */
    scale: _propTypes.default.number,
    /**
     * These properties should be defined on the child, not here.
     */
    className: _shims.dontSetMe,
    style: _shims.dontSetMe,
    transform: _shims.dontSetMe
  });
  _defineProperty(DraggableCore$1, "defaultProps", {
    allowAnyClick: false,
    // by default only accept left click
    allowMobileScroll: false,
    disabled: false,
    enableUserSelectHack: true,
    onStart: function() {
    },
    onDrag: function() {
    },
    onStop: function() {
    },
    onMouseDown: function() {
    },
    scale: 1
  });
  return DraggableCore;
}
var hasRequiredDraggable;
function requireDraggable() {
  if (hasRequiredDraggable) return Draggable;
  hasRequiredDraggable = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", {
      value: true
    });
    Object.defineProperty(exports$1, "DraggableCore", {
      enumerable: true,
      get: function() {
        return _DraggableCore.default;
      }
    });
    exports$1.default = void 0;
    var React = _interopRequireWildcard(/* @__PURE__ */ requireReact());
    var _propTypes = _interopRequireDefault(/* @__PURE__ */ requirePropTypes());
    var _reactDom = _interopRequireDefault(/* @__PURE__ */ requireReactDom());
    var _clsx = /* @__PURE__ */ requireClsx();
    var _domFns = /* @__PURE__ */ requireDomFns();
    var _positionFns = /* @__PURE__ */ requirePositionFns();
    var _shims = /* @__PURE__ */ requireShims();
    var _DraggableCore = _interopRequireDefault(/* @__PURE__ */ requireDraggableCore());
    var _log = _interopRequireDefault(/* @__PURE__ */ requireLog());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function _interopRequireWildcard(e, t) {
      if ("function" == typeof WeakMap) var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
      return (_interopRequireWildcard = function(e2, t2) {
        if (!t2 && e2 && e2.__esModule) return e2;
        var o, i, f = { __proto__: null, default: e2 };
        if (null === e2 || "object" != typeof e2 && "function" != typeof e2) return f;
        if (o = t2 ? n : r) {
          if (o.has(e2)) return o.get(e2);
          o.set(e2, f);
        }
        for (const t3 in e2) "default" !== t3 && {}.hasOwnProperty.call(e2, t3) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e2, t3)) && (i.get || i.set) ? o(f, t3, i) : f[t3] = e2[t3]);
        return f;
      })(e, t);
    }
    function _extends() {
      return _extends = Object.assign ? Object.assign.bind() : function(n) {
        for (var e = 1; e < arguments.length; e++) {
          var t = arguments[e];
          for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
        }
        return n;
      }, _extends.apply(null, arguments);
    }
    function _defineProperty(e, r, t) {
      return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
    }
    function _toPropertyKey(t) {
      var i = _toPrimitive(t, "string");
      return "symbol" == typeof i ? i : i + "";
    }
    function _toPrimitive(t, r) {
      if ("object" != typeof t || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r);
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return ("string" === r ? String : Number)(t);
    }
    class Draggable2 extends React.Component {
      // React 16.3+
      // Arity (props, state)
      static getDerivedStateFromProps(_ref, _ref2) {
        let {
          position
        } = _ref;
        let {
          prevPropsPosition
        } = _ref2;
        if (position && (!prevPropsPosition || position.x !== prevPropsPosition.x || position.y !== prevPropsPosition.y)) {
          (0, _log.default)("Draggable: getDerivedStateFromProps %j", {
            position,
            prevPropsPosition
          });
          return {
            x: position.x,
            y: position.y,
            prevPropsPosition: {
              ...position
            }
          };
        }
        return null;
      }
      constructor(props) {
        super(props);
        _defineProperty(this, "onDragStart", (e, coreData) => {
          (0, _log.default)("Draggable: onDragStart: %j", coreData);
          const shouldStart = this.props.onStart(e, (0, _positionFns.createDraggableData)(this, coreData));
          if (shouldStart === false) return false;
          this.setState({
            dragging: true,
            dragged: true
          });
        });
        _defineProperty(this, "onDrag", (e, coreData) => {
          if (!this.state.dragging) return false;
          (0, _log.default)("Draggable: onDrag: %j", coreData);
          const uiData = (0, _positionFns.createDraggableData)(this, coreData);
          const newState = {
            x: uiData.x,
            y: uiData.y,
            slackX: 0,
            slackY: 0
          };
          if (this.props.bounds) {
            const {
              x,
              y
            } = newState;
            newState.x += this.state.slackX;
            newState.y += this.state.slackY;
            const [newStateX, newStateY] = (0, _positionFns.getBoundPosition)(this, newState.x, newState.y);
            newState.x = newStateX;
            newState.y = newStateY;
            newState.slackX = this.state.slackX + (x - newState.x);
            newState.slackY = this.state.slackY + (y - newState.y);
            uiData.x = newState.x;
            uiData.y = newState.y;
            uiData.deltaX = newState.x - this.state.x;
            uiData.deltaY = newState.y - this.state.y;
          }
          const shouldUpdate = this.props.onDrag(e, uiData);
          if (shouldUpdate === false) return false;
          this.setState(newState);
        });
        _defineProperty(this, "onDragStop", (e, coreData) => {
          if (!this.state.dragging) return false;
          const shouldContinue = this.props.onStop(e, (0, _positionFns.createDraggableData)(this, coreData));
          if (shouldContinue === false) return false;
          (0, _log.default)("Draggable: onDragStop: %j", coreData);
          const newState = {
            dragging: false,
            slackX: 0,
            slackY: 0
          };
          const controlled = Boolean(this.props.position);
          if (controlled) {
            const {
              x,
              y
            } = this.props.position;
            newState.x = x;
            newState.y = y;
          }
          this.setState(newState);
        });
        this.state = {
          // Whether or not we are currently dragging.
          dragging: false,
          // Whether or not we have been dragged before.
          dragged: false,
          // Current transform x and y.
          x: props.position ? props.position.x : props.defaultPosition.x,
          y: props.position ? props.position.y : props.defaultPosition.y,
          prevPropsPosition: {
            ...props.position
          },
          // Used for compensating for out-of-bounds drags
          slackX: 0,
          slackY: 0,
          // Can only determine if SVG after mounting
          isElementSVG: false
        };
        if (props.position && !(props.onDrag || props.onStop)) {
          console.warn("A `position` was applied to this <Draggable>, without drag handlers. This will make this component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the `position` of this element.");
        }
      }
      componentDidMount() {
        if (typeof window.SVGElement !== "undefined" && this.findDOMNode() instanceof window.SVGElement) {
          this.setState({
            isElementSVG: true
          });
        }
      }
      componentWillUnmount() {
        if (this.state.dragging) {
          this.setState({
            dragging: false
          });
        }
      }
      // React Strict Mode compatibility: if `nodeRef` is passed, we will use it instead of trying to find
      // the underlying DOM node ourselves. See the README for more information.
      findDOMNode() {
        return this.props?.nodeRef?.current ?? _reactDom.default.findDOMNode(this);
      }
      render() {
        const {
          axis,
          bounds,
          children,
          defaultPosition,
          defaultClassName,
          defaultClassNameDragging,
          defaultClassNameDragged,
          position,
          positionOffset,
          scale,
          ...draggableCoreProps
        } = this.props;
        let style = {};
        let svgTransform = null;
        const controlled = Boolean(position);
        const draggable = !controlled || this.state.dragging;
        const validPosition = position || defaultPosition;
        const transformOpts = {
          // Set left if horizontal drag is enabled
          x: (0, _positionFns.canDragX)(this) && draggable ? this.state.x : validPosition.x,
          // Set top if vertical drag is enabled
          y: (0, _positionFns.canDragY)(this) && draggable ? this.state.y : validPosition.y
        };
        if (this.state.isElementSVG) {
          svgTransform = (0, _domFns.createSVGTransform)(transformOpts, positionOffset);
        } else {
          style = (0, _domFns.createCSSTransform)(transformOpts, positionOffset);
        }
        const className = (0, _clsx.clsx)(children.props.className || "", defaultClassName, {
          [defaultClassNameDragging]: this.state.dragging,
          [defaultClassNameDragged]: this.state.dragged
        });
        return /* @__PURE__ */ React.createElement(_DraggableCore.default, _extends({}, draggableCoreProps, {
          onStart: this.onDragStart,
          onDrag: this.onDrag,
          onStop: this.onDragStop
        }), /* @__PURE__ */ React.cloneElement(React.Children.only(children), {
          className,
          style: {
            ...children.props.style,
            ...style
          },
          transform: svgTransform
        }));
      }
    }
    exports$1.default = Draggable2;
    _defineProperty(Draggable2, "displayName", "Draggable");
    _defineProperty(Draggable2, "propTypes", {
      // Accepts all props <DraggableCore> accepts.
      ..._DraggableCore.default.propTypes,
      /**
       * `axis` determines which axis the draggable can move.
       *
       *  Note that all callbacks will still return data as normal. This only
       *  controls flushing to the DOM.
       *
       * 'both' allows movement horizontally and vertically.
       * 'x' limits movement to horizontal axis.
       * 'y' limits movement to vertical axis.
       * 'none' limits all movement.
       *
       * Defaults to 'both'.
       */
      axis: _propTypes.default.oneOf(["both", "x", "y", "none"]),
      /**
       * `bounds` determines the range of movement available to the element.
       * Available values are:
       *
       * 'parent' restricts movement within the Draggable's parent node.
       *
       * Alternatively, pass an object with the following properties, all of which are optional:
       *
       * {left: LEFT_BOUND, right: RIGHT_BOUND, bottom: BOTTOM_BOUND, top: TOP_BOUND}
       *
       * All values are in px.
       *
       * Example:
       *
       * ```jsx
       *   let App = React.createClass({
       *       render: function () {
       *         return (
       *            <Draggable bounds={{right: 300, bottom: 300}}>
       *              <div>Content</div>
       *           </Draggable>
       *         );
       *       }
       *   });
       * ```
       */
      bounds: _propTypes.default.oneOfType([_propTypes.default.shape({
        left: _propTypes.default.number,
        right: _propTypes.default.number,
        top: _propTypes.default.number,
        bottom: _propTypes.default.number
      }), _propTypes.default.string, _propTypes.default.oneOf([false])]),
      defaultClassName: _propTypes.default.string,
      defaultClassNameDragging: _propTypes.default.string,
      defaultClassNameDragged: _propTypes.default.string,
      /**
       * `defaultPosition` specifies the x and y that the dragged item should start at
       *
       * Example:
       *
       * ```jsx
       *      let App = React.createClass({
       *          render: function () {
       *              return (
       *                  <Draggable defaultPosition={{x: 25, y: 25}}>
       *                      <div>I start with transformX: 25px and transformY: 25px;</div>
       *                  </Draggable>
       *              );
       *          }
       *      });
       * ```
       */
      defaultPosition: _propTypes.default.shape({
        x: _propTypes.default.number,
        y: _propTypes.default.number
      }),
      positionOffset: _propTypes.default.shape({
        x: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.string]),
        y: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.string])
      }),
      /**
       * `position`, if present, defines the current position of the element.
       *
       *  This is similar to how form elements in React work - if no `position` is supplied, the component
       *  is uncontrolled.
       *
       * Example:
       *
       * ```jsx
       *      let App = React.createClass({
       *          render: function () {
       *              return (
       *                  <Draggable position={{x: 25, y: 25}}>
       *                      <div>I start with transformX: 25px and transformY: 25px;</div>
       *                  </Draggable>
       *              );
       *          }
       *      });
       * ```
       */
      position: _propTypes.default.shape({
        x: _propTypes.default.number,
        y: _propTypes.default.number
      }),
      /**
       * These properties should be defined on the child, not here.
       */
      className: _shims.dontSetMe,
      style: _shims.dontSetMe,
      transform: _shims.dontSetMe
    });
    _defineProperty(Draggable2, "defaultProps", {
      ..._DraggableCore.default.defaultProps,
      axis: "both",
      bounds: false,
      defaultClassName: "react-draggable",
      defaultClassNameDragging: "react-draggable-dragging",
      defaultClassNameDragged: "react-draggable-dragged",
      defaultPosition: {
        x: 0,
        y: 0
      },
      scale: 1
    });
  })(Draggable);
  return Draggable;
}
var hasRequiredCjs;
function requireCjs() {
  if (hasRequiredCjs) return cjs.exports;
  hasRequiredCjs = 1;
  const {
    default: Draggable2,
    DraggableCore: DraggableCore2
  } = /* @__PURE__ */ requireDraggable();
  cjs.exports = Draggable2;
  cjs.exports.default = Draggable2;
  cjs.exports.DraggableCore = DraggableCore2;
  return cjs.exports;
}
var cjsExports = /* @__PURE__ */ requireCjs();
export {
  cjsExports as c,
  requireCjs as r
};
