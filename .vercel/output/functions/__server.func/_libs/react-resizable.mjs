import { a as requireReact } from "./react.mjs";
import { r as requireCjs } from "./react-draggable.mjs";
import { r as requirePropTypes$1 } from "./prop-types.mjs";
var reactResizable = { exports: {} };
var Resizable = {};
var utils = {};
var hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  utils.__esModule = true;
  utils.cloneElement = cloneElement;
  var _react = _interopRequireDefault(/* @__PURE__ */ requireReact());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r2) {
        return Object.getOwnPropertyDescriptor(e, r2).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
        _defineProperty(e, r2, t[r2]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
        Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
      });
    }
    return e;
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
  function cloneElement(element, props) {
    if (props.style && element.props.style) {
      props.style = _objectSpread(_objectSpread({}, element.props.style), props.style);
    }
    if (props.className && element.props.className) {
      props.className = `${element.props.className} ${props.className}`;
    }
    return /* @__PURE__ */ _react.default.cloneElement(element, props);
  }
  return utils;
}
var propTypes = {};
var hasRequiredPropTypes;
function requirePropTypes() {
  if (hasRequiredPropTypes) return propTypes;
  hasRequiredPropTypes = 1;
  propTypes.__esModule = true;
  propTypes.resizableProps = void 0;
  var _propTypes = _interopRequireDefault(/* @__PURE__ */ requirePropTypes$1());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  propTypes.resizableProps = {
    /*
    * Restricts resizing to a particular axis (default: 'both')
    * 'both' - allows resizing by width or height
    * 'x' - only allows the width to be changed
    * 'y' - only allows the height to be changed
    * 'none' - disables resizing altogether
    * */
    axis: _propTypes.default.oneOf(["both", "x", "y", "none"]),
    className: _propTypes.default.string,
    /*
    * Require that one and only one child be present.
    * */
    children: _propTypes.default.element.isRequired,
    /*
    * These will be passed wholesale to react-draggable's DraggableCore
    * */
    draggableOpts: _propTypes.default.shape({
      allowAnyClick: _propTypes.default.bool,
      cancel: _propTypes.default.string,
      children: _propTypes.default.node,
      disabled: _propTypes.default.bool,
      enableUserSelectHack: _propTypes.default.bool,
      // #251: Check for Element to support SSR environments where DOM globals don't exist
      offsetParent: typeof Element !== "undefined" ? _propTypes.default.instanceOf(Element) : _propTypes.default.any,
      grid: _propTypes.default.arrayOf(_propTypes.default.number),
      handle: _propTypes.default.string,
      nodeRef: _propTypes.default.object,
      onStart: _propTypes.default.func,
      onDrag: _propTypes.default.func,
      onStop: _propTypes.default.func,
      onMouseDown: _propTypes.default.func,
      scale: _propTypes.default.number
    }),
    /*
    * Initial height
    * */
    height: function() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      const [props] = args;
      if (props.axis === "both" || props.axis === "y") {
        return _propTypes.default.number.isRequired(...args);
      }
      return _propTypes.default.number(...args);
    },
    /*
    * Customize cursor resize handle
    * */
    handle: _propTypes.default.oneOfType([_propTypes.default.node, _propTypes.default.func]),
    /*
    * If you change this, be sure to update your css
    * */
    handleSize: _propTypes.default.arrayOf(_propTypes.default.number),
    lockAspectRatio: _propTypes.default.bool,
    /*
    * Max X & Y measure
    * */
    maxConstraints: _propTypes.default.arrayOf(_propTypes.default.number),
    /*
    * Min X & Y measure
    * */
    minConstraints: _propTypes.default.arrayOf(_propTypes.default.number),
    /*
    * Called on stop resize event
    * */
    onResizeStop: _propTypes.default.func,
    /*
    * Called on start resize event
    * */
    onResizeStart: _propTypes.default.func,
    /*
    * Called on resize event
    * */
    onResize: _propTypes.default.func,
    /*
    * Defines which resize handles should be rendered (default: 'se')
    * 's' - South handle (bottom-center)
    * 'w' - West handle (left-center)
    * 'e' - East handle (right-center)
    * 'n' - North handle (top-center)
    * 'sw' - Southwest handle (bottom-left)
    * 'nw' - Northwest handle (top-left)
    * 'se' - Southeast handle (bottom-right)
    * 'ne' - Northeast handle (top-center)
    * */
    resizeHandles: _propTypes.default.arrayOf(_propTypes.default.oneOf(["s", "w", "e", "n", "sw", "nw", "se", "ne"])),
    /*
    * If `transform: scale(n)` is set on the parent, this should be set to `n`.
    * */
    transformScale: _propTypes.default.number,
    /*
     * Initial width
     */
    width: function() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      const [props] = args;
      if (props.axis === "both" || props.axis === "x") {
        return _propTypes.default.number.isRequired(...args);
      }
      return _propTypes.default.number(...args);
    }
  };
  return propTypes;
}
var hasRequiredResizable;
function requireResizable() {
  if (hasRequiredResizable) return Resizable;
  hasRequiredResizable = 1;
  Resizable.__esModule = true;
  Resizable.default = void 0;
  var React = _interopRequireWildcard(/* @__PURE__ */ requireReact());
  var _reactDraggable = /* @__PURE__ */ requireCjs();
  var _utils = /* @__PURE__ */ requireUtils();
  var _propTypes = /* @__PURE__ */ requirePropTypes();
  const _excluded = ["children", "className", "draggableOpts", "width", "height", "handle", "handleSize", "lockAspectRatio", "axis", "minConstraints", "maxConstraints", "onResize", "onResizeStop", "onResizeStart", "resizeHandles", "transformScale"];
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
  function _objectWithoutProperties(e, t) {
    if (null == e) return {};
    var o, r, i = _objectWithoutPropertiesLoose(e, t);
    if (Object.getOwnPropertySymbols) {
      var n = Object.getOwnPropertySymbols(e);
      for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
    }
    return i;
  }
  function _objectWithoutPropertiesLoose(r, e) {
    if (null == r) return {};
    var t = {};
    for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
      if (-1 !== e.indexOf(n)) continue;
      t[n] = r[n];
    }
    return t;
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r2) {
        return Object.getOwnPropertyDescriptor(e, r2).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
        _defineProperty(e, r2, t[r2]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
        Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
      });
    }
    return e;
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
  let Resizable$1 = class Resizable extends React.Component {
    constructor() {
      super(...arguments);
      this.handleRefs = {};
      this.lastHandleRect = null;
      this.slack = null;
      this.lastSize = null;
    }
    componentWillUnmount() {
      this.resetData();
    }
    resetData() {
      this.lastHandleRect = this.slack = this.lastSize = null;
    }
    // Clamp width and height within provided constraints
    runConstraints(width, height) {
      const {
        minConstraints,
        maxConstraints,
        lockAspectRatio
      } = this.props;
      if (!minConstraints && !maxConstraints && !lockAspectRatio) return [width, height];
      if (lockAspectRatio) {
        const ratio = this.props.width / this.props.height;
        const deltaW = width - this.props.width;
        const deltaH = height - this.props.height;
        if (Math.abs(deltaW) > Math.abs(deltaH * ratio)) {
          height = width / ratio;
        } else {
          width = height * ratio;
        }
      }
      const [oldW, oldH] = [width, height];
      let [slackW, slackH] = this.slack || [0, 0];
      width += slackW;
      height += slackH;
      if (minConstraints) {
        width = Math.max(minConstraints[0], width);
        height = Math.max(minConstraints[1], height);
      }
      if (maxConstraints) {
        width = Math.min(maxConstraints[0], width);
        height = Math.min(maxConstraints[1], height);
      }
      this.slack = [slackW + (oldW - width), slackH + (oldH - height)];
      return [width, height];
    }
    /**
     * Wrapper around drag events to provide more useful data.
     *
     * @param  {String} handlerName Handler name to wrap.
     * @return {Function}           Handler function.
     */
    resizeHandler(handlerName, axis) {
      return (e, _ref) => {
        let {
          node,
          deltaX,
          deltaY
        } = _ref;
        if (handlerName === "onResizeStart") this.resetData();
        const canDragX = (this.props.axis === "both" || this.props.axis === "x") && axis !== "n" && axis !== "s";
        const canDragY = (this.props.axis === "both" || this.props.axis === "y") && axis !== "e" && axis !== "w";
        if (!canDragX && !canDragY) return;
        const axisV = axis[0];
        const axisH = axis[axis.length - 1];
        const handleRect = node.getBoundingClientRect();
        if (this.lastHandleRect != null) {
          if (axisH === "w") {
            const deltaLeftSinceLast = handleRect.left - this.lastHandleRect.left;
            deltaX += deltaLeftSinceLast;
          }
          if (axisV === "n") {
            const deltaTopSinceLast = handleRect.top - this.lastHandleRect.top;
            deltaY += deltaTopSinceLast;
          }
        }
        this.lastHandleRect = handleRect;
        if (axisH === "w") deltaX = -deltaX;
        if (axisV === "n") deltaY = -deltaY;
        let width = this.props.width + (canDragX ? deltaX / this.props.transformScale : 0);
        let height = this.props.height + (canDragY ? deltaY / this.props.transformScale : 0);
        [width, height] = this.runConstraints(width, height);
        if (handlerName === "onResizeStop" && this.lastSize) {
          ({
            width,
            height
          } = this.lastSize);
        }
        const dimensionsChanged = width !== this.props.width || height !== this.props.height;
        if (handlerName !== "onResizeStop") {
          this.lastSize = {
            width,
            height
          };
        }
        const cb = typeof this.props[handlerName] === "function" ? this.props[handlerName] : null;
        const shouldSkipCb = handlerName === "onResize" && !dimensionsChanged;
        if (cb && !shouldSkipCb) {
          e.persist?.();
          cb(e, {
            node,
            size: {
              width,
              height
            },
            handle: axis
          });
        }
        if (handlerName === "onResizeStop") this.resetData();
      };
    }
    // Render a resize handle given an axis & DOM ref. Ref *must* be attached for
    // the underlying draggable library to work properly.
    renderResizeHandle(handleAxis, ref) {
      const {
        handle
      } = this.props;
      if (!handle) {
        return /* @__PURE__ */ React.createElement("span", {
          className: `react-resizable-handle react-resizable-handle-${handleAxis}`,
          ref
        });
      }
      if (typeof handle === "function") {
        return handle(handleAxis, ref);
      }
      const isDOMElement = typeof handle.type === "string";
      const props = _objectSpread({
        ref
      }, isDOMElement ? {} : {
        handleAxis
      });
      return /* @__PURE__ */ React.cloneElement(handle, props);
    }
    render() {
      const _this$props = this.props, {
        children,
        className,
        draggableOpts,
        width,
        height,
        handle,
        handleSize,
        lockAspectRatio,
        axis,
        minConstraints,
        maxConstraints,
        onResize,
        onResizeStop,
        onResizeStart,
        resizeHandles,
        transformScale
      } = _this$props, p = _objectWithoutProperties(_this$props, _excluded);
      return (0, _utils.cloneElement)(children, _objectSpread(_objectSpread({}, p), {}, {
        className: `${className ? `${className} ` : ""}react-resizable`,
        children: [...React.Children.toArray(children.props.children), ...resizeHandles.map((handleAxis) => {
          const ref = this.handleRefs[handleAxis] ?? (this.handleRefs[handleAxis] = /* @__PURE__ */ React.createRef());
          return /* @__PURE__ */ React.createElement(_reactDraggable.DraggableCore, _extends({}, draggableOpts, {
            nodeRef: ref,
            key: `resizableHandle-${handleAxis}`,
            onStop: this.resizeHandler("onResizeStop", handleAxis),
            onStart: this.resizeHandler("onResizeStart", handleAxis),
            onDrag: this.resizeHandler("onResize", handleAxis)
          }), this.renderResizeHandle(handleAxis, ref));
        })]
      }));
    }
  };
  Resizable.default = Resizable$1;
  Resizable$1.propTypes = _propTypes.resizableProps;
  Resizable$1.defaultProps = {
    axis: "both",
    handleSize: [20, 20],
    lockAspectRatio: false,
    minConstraints: [20, 20],
    maxConstraints: [Infinity, Infinity],
    resizeHandles: ["se"],
    transformScale: 1
  };
  return Resizable;
}
var ResizableBox = {};
var hasRequiredResizableBox;
function requireResizableBox() {
  if (hasRequiredResizableBox) return ResizableBox;
  hasRequiredResizableBox = 1;
  ResizableBox.__esModule = true;
  ResizableBox.default = void 0;
  var React = _interopRequireWildcard(/* @__PURE__ */ requireReact());
  var _propTypes = _interopRequireDefault(/* @__PURE__ */ requirePropTypes$1());
  var _Resizable = _interopRequireDefault(/* @__PURE__ */ requireResizable());
  var _propTypes2 = /* @__PURE__ */ requirePropTypes();
  const _excluded = ["handle", "handleSize", "onResize", "onResizeStart", "onResizeStop", "draggableOpts", "minConstraints", "maxConstraints", "lockAspectRatio", "axis", "width", "height", "resizeHandles", "style", "transformScale"];
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
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r2) {
        return Object.getOwnPropertyDescriptor(e, r2).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
        _defineProperty(e, r2, t[r2]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
        Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
      });
    }
    return e;
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
  function _objectWithoutProperties(e, t) {
    if (null == e) return {};
    var o, r, i = _objectWithoutPropertiesLoose(e, t);
    if (Object.getOwnPropertySymbols) {
      var n = Object.getOwnPropertySymbols(e);
      for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
    }
    return i;
  }
  function _objectWithoutPropertiesLoose(r, e) {
    if (null == r) return {};
    var t = {};
    for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
      if (-1 !== e.indexOf(n)) continue;
      t[n] = r[n];
    }
    return t;
  }
  let ResizableBox$1 = class ResizableBox extends React.Component {
    constructor() {
      super(...arguments);
      this.state = {
        width: this.props.width,
        height: this.props.height,
        propsWidth: this.props.width,
        propsHeight: this.props.height
      };
      this.onResize = (e, data) => {
        const {
          size
        } = data;
        if (this.props.onResize) {
          e.persist?.();
          this.setState(size, () => this.props.onResize && this.props.onResize(e, data));
        } else {
          this.setState(size);
        }
      };
    }
    static getDerivedStateFromProps(props, state) {
      if (state.propsWidth !== props.width || state.propsHeight !== props.height) {
        return {
          width: props.width,
          height: props.height,
          propsWidth: props.width,
          propsHeight: props.height
        };
      }
      return null;
    }
    render() {
      const _this$props = this.props, {
        handle,
        handleSize,
        onResize,
        onResizeStart,
        onResizeStop,
        draggableOpts,
        minConstraints,
        maxConstraints,
        lockAspectRatio,
        axis,
        width,
        height,
        resizeHandles,
        style,
        transformScale
      } = _this$props, props = _objectWithoutProperties(_this$props, _excluded);
      return /* @__PURE__ */ React.createElement(_Resizable.default, {
        axis,
        draggableOpts,
        handle,
        handleSize,
        height: this.state.height,
        lockAspectRatio,
        maxConstraints,
        minConstraints,
        onResizeStart,
        onResize: this.onResize,
        onResizeStop,
        resizeHandles,
        transformScale,
        width: this.state.width
      }, /* @__PURE__ */ React.createElement("div", _extends({}, props, {
        style: _objectSpread(_objectSpread({}, style), {}, {
          width: this.state.width + "px",
          height: this.state.height + "px"
        })
      })));
    }
  };
  ResizableBox.default = ResizableBox$1;
  ResizableBox$1.propTypes = _objectSpread(_objectSpread({}, _propTypes2.resizableProps), {}, {
    children: _propTypes.default.element
  });
  return ResizableBox;
}
var hasRequiredReactResizable;
function requireReactResizable() {
  if (hasRequiredReactResizable) return reactResizable.exports;
  hasRequiredReactResizable = 1;
  reactResizable.exports = function() {
    throw new Error("Don't instantiate Resizable directly! Use require('react-resizable').Resizable");
  };
  reactResizable.exports.Resizable = requireResizable().default;
  reactResizable.exports.ResizableBox = requireResizableBox().default;
  return reactResizable.exports;
}
var reactResizableExports = /* @__PURE__ */ requireReactResizable();
export {
  reactResizableExports as r
};
