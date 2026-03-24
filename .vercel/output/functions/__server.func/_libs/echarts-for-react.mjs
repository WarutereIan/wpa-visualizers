import { __extends, __awaiter, __generator, __assign, __rest } from "tslib";
import { e as echarts } from "./echarts.mjs";
import { R as React, r as reactExports } from "./react.mjs";
import { l as libExports } from "./size-sensor.mjs";
import { i as isEqual } from "./fast-deep-equal.mjs";
function pick(obj, keys) {
  var r = {};
  keys.forEach(function(key) {
    r[key] = obj[key];
  });
  return r;
}
function isFunction(v) {
  return typeof v === "function";
}
function isString(v) {
  return typeof v === "string";
}
var EChartsReactCore = (
  /** @class */
  (function(_super) {
    __extends(EChartsReactCore2, _super);
    function EChartsReactCore2(props) {
      var _this = _super.call(this, props) || this;
      _this.echarts = props.echarts;
      _this.ele = null;
      _this.isInitialResize = true;
      _this.eventHandlerRefs = {};
      return _this;
    }
    EChartsReactCore2.prototype.componentDidMount = function() {
      this.renderNewEcharts();
    };
    EChartsReactCore2.prototype.componentDidUpdate = function(prevProps) {
      var shouldSetOption = this.props.shouldSetOption;
      if (isFunction(shouldSetOption) && !shouldSetOption(prevProps, this.props)) {
        return;
      }
      if (!isEqual(prevProps.theme, this.props.theme) || !isEqual(prevProps.opts, this.props.opts)) {
        this.dispose();
        this.renderNewEcharts();
        return;
      }
      var echartsInstance = this.getEchartsInstance();
      if (!isEqual(prevProps.onEvents, this.props.onEvents)) {
        this.unbindEvents(echartsInstance);
        this.bindEvents(echartsInstance, this.props.onEvents);
      }
      var pickKeys = ["option", "notMerge", "replaceMerge", "lazyUpdate", "showLoading", "loadingOption"];
      if (!isEqual(pick(this.props, pickKeys), pick(prevProps, pickKeys))) {
        this.updateEChartsOption();
      }
      if (!isEqual(prevProps.style, this.props.style) || !isEqual(prevProps.className, this.props.className)) {
        this.resize();
      }
    };
    EChartsReactCore2.prototype.componentWillUnmount = function() {
      this.dispose();
    };
    EChartsReactCore2.prototype.initEchartsInstance = function() {
      return __awaiter(this, void 0, void 0, function() {
        var _this = this;
        return __generator(this, function(_a) {
          return [2, new Promise(function(resolve) {
            _this.echarts.init(_this.ele, _this.props.theme, _this.props.opts);
            var echartsInstance = _this.getEchartsInstance();
            echartsInstance.on("finished", function() {
              var width = _this.ele.clientWidth;
              var height = _this.ele.clientHeight;
              _this.echarts.dispose(_this.ele);
              var opts = __assign({ width, height }, _this.props.opts);
              resolve(_this.echarts.init(_this.ele, _this.props.theme, opts));
            });
          })];
        });
      });
    };
    EChartsReactCore2.prototype.getEchartsInstance = function() {
      return this.echarts.getInstanceByDom(this.ele);
    };
    EChartsReactCore2.prototype.dispose = function() {
      if (this.ele) {
        try {
          libExports.clear(this.ele);
        } catch (e) {
          console.warn(e);
        }
        this.echarts.dispose(this.ele);
      }
    };
    EChartsReactCore2.prototype.renderNewEcharts = function() {
      return __awaiter(this, void 0, void 0, function() {
        var _a, onEvents, onChartReady, _b, autoResize, echartsInstance;
        var _this = this;
        return __generator(this, function(_c) {
          switch (_c.label) {
            case 0:
              _a = this.props, onEvents = _a.onEvents, onChartReady = _a.onChartReady, _b = _a.autoResize, autoResize = _b === void 0 ? true : _b;
              return [4, this.initEchartsInstance()];
            case 1:
              _c.sent();
              echartsInstance = this.updateEChartsOption();
              this.bindEvents(echartsInstance, onEvents || {});
              if (isFunction(onChartReady))
                onChartReady(echartsInstance);
              if (this.ele && autoResize) {
                libExports.bind(this.ele, function() {
                  _this.resize();
                });
              }
              return [
                2
                /*return*/
              ];
          }
        });
      });
    };
    EChartsReactCore2.prototype.bindEvents = function(instance, events) {
      var _this = this;
      var _bindEvent = function(eventName2, func) {
        if (isString(eventName2) && isFunction(func)) {
          var handler = function(param) {
            func(param, instance);
          };
          instance.on(eventName2, handler);
          _this.eventHandlerRefs[eventName2] = handler;
        }
      };
      for (var eventName in events) {
        if (Object.prototype.hasOwnProperty.call(events, eventName)) {
          _bindEvent(eventName, events[eventName]);
        }
      }
    };
    EChartsReactCore2.prototype.unbindEvents = function(instance) {
      for (var _i = 0, _a = Object.entries(this.eventHandlerRefs); _i < _a.length; _i++) {
        var _b = _a[_i], eventName = _b[0], listener = _b[1];
        instance.off(eventName, listener);
      }
      this.eventHandlerRefs = {};
    };
    EChartsReactCore2.prototype.updateEChartsOption = function() {
      var _a = this.props, option = _a.option, _b = _a.notMerge, notMerge = _b === void 0 ? false : _b, _c = _a.replaceMerge, replaceMerge = _c === void 0 ? null : _c, _d = _a.lazyUpdate, lazyUpdate = _d === void 0 ? false : _d, showLoading = _a.showLoading, _e = _a.loadingOption, loadingOption = _e === void 0 ? null : _e;
      var echartInstance = this.getEchartsInstance();
      echartInstance.setOption(option, { notMerge, replaceMerge, lazyUpdate });
      if (showLoading)
        echartInstance.showLoading(loadingOption);
      else
        echartInstance.hideLoading();
      return echartInstance;
    };
    EChartsReactCore2.prototype.resize = function() {
      var echartsInstance = this.getEchartsInstance();
      if (!this.isInitialResize) {
        try {
          echartsInstance.resize({
            width: "auto",
            height: "auto"
          });
        } catch (e) {
          console.warn(e);
        }
      }
      this.isInitialResize = false;
    };
    EChartsReactCore2.prototype.render = function() {
      var _this = this;
      var _a = this.props, style = _a.style, _b = _a.className, className = _b === void 0 ? "" : _b;
      _a.echarts;
      _a.option;
      _a.theme;
      _a.notMerge;
      _a.replaceMerge;
      _a.lazyUpdate;
      _a.showLoading;
      _a.loadingOption;
      _a.opts;
      _a.onChartReady;
      _a.onEvents;
      _a.shouldSetOption;
      _a.autoResize;
      var divHTMLAttributes = __rest(_a, ["style", "className", "echarts", "option", "theme", "notMerge", "replaceMerge", "lazyUpdate", "showLoading", "loadingOption", "opts", "onChartReady", "onEvents", "shouldSetOption", "autoResize"]);
      var newStyle = __assign({ height: 300 }, style);
      return React.createElement("div", __assign({ ref: function(e) {
        _this.ele = e;
      }, style: newStyle, className: "echarts-for-react ".concat(className) }, divHTMLAttributes));
    };
    return EChartsReactCore2;
  })(reactExports.PureComponent)
);
var EChartsReact = (
  /** @class */
  (function(_super) {
    __extends(EChartsReact2, _super);
    function EChartsReact2(props) {
      var _this = _super.call(this, props) || this;
      _this.echarts = echarts;
      return _this;
    }
    return EChartsReact2;
  })(EChartsReactCore)
);
export {
  EChartsReact as E
};
