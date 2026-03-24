var lib = {};
var sensorPool = {};
var id = {};
var hasRequiredId;
function requireId() {
  if (hasRequiredId) return id;
  hasRequiredId = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", {
      value: true
    });
    exports$1["default"] = void 0;
    var id2 = 1;
    exports$1["default"] = function _default() {
      return "".concat(id2++);
    };
  })(id);
  return id;
}
var sensors = {};
var object = {};
var debounce = {};
var hasRequiredDebounce;
function requireDebounce() {
  if (hasRequiredDebounce) return debounce;
  hasRequiredDebounce = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", {
      value: true
    });
    exports$1["default"] = void 0;
    exports$1["default"] = function _default(fn) {
      var delay = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 60;
      var timer = null;
      return function() {
        var _this = this;
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        clearTimeout(timer);
        timer = setTimeout(function() {
          fn.apply(_this, args);
        }, delay);
      };
    };
  })(debounce);
  return debounce;
}
var constant = {};
var hasRequiredConstant;
function requireConstant() {
  if (hasRequiredConstant) return constant;
  hasRequiredConstant = 1;
  Object.defineProperty(constant, "__esModule", {
    value: true
  });
  constant.SizeSensorId = constant.SensorTabIndex = constant.SensorClassName = void 0;
  constant.SizeSensorId = "size-sensor-id";
  constant.SensorClassName = "size-sensor-object";
  constant.SensorTabIndex = "-1";
  return constant;
}
var hasRequiredObject;
function requireObject() {
  if (hasRequiredObject) return object;
  hasRequiredObject = 1;
  Object.defineProperty(object, "__esModule", {
    value: true
  });
  object.createSensor = void 0;
  var _debounce = _interopRequireDefault(/* @__PURE__ */ requireDebounce());
  var _constant = /* @__PURE__ */ requireConstant();
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { "default": e };
  }
  object.createSensor = function createSensor(element, whenDestroy) {
    var sensor = void 0;
    var listeners = [];
    var newSensor = function newSensor2() {
      if (getComputedStyle(element).position === "static") {
        element.style.position = "relative";
      }
      var obj = document.createElement("object");
      obj.onload = function() {
        obj.contentDocument.defaultView.addEventListener("resize", resizeListener);
        resizeListener();
      };
      obj.style.display = "block";
      obj.style.position = "absolute";
      obj.style.top = "0";
      obj.style.left = "0";
      obj.style.height = "100%";
      obj.style.width = "100%";
      obj.style.overflow = "hidden";
      obj.style.pointerEvents = "none";
      obj.style.zIndex = "-1";
      obj.style.opacity = "0";
      obj.setAttribute("class", _constant.SensorClassName);
      obj.setAttribute("tabindex", _constant.SensorTabIndex);
      obj.type = "text/html";
      element.appendChild(obj);
      obj.data = "about:blank";
      return obj;
    };
    var resizeListener = (0, _debounce["default"])(function() {
      listeners.forEach(function(listener) {
        listener(element);
      });
    });
    var bind = function bind2(cb) {
      if (!sensor) {
        sensor = newSensor();
      }
      if (listeners.indexOf(cb) === -1) {
        listeners.push(cb);
      }
    };
    var destroy = function destroy2() {
      if (sensor && sensor.parentNode) {
        if (sensor.contentDocument) {
          sensor.contentDocument.defaultView.removeEventListener("resize", resizeListener);
        }
        sensor.parentNode.removeChild(sensor);
        element.removeAttribute(_constant.SizeSensorId);
        sensor = void 0;
        listeners = [];
        whenDestroy && whenDestroy();
      }
    };
    var unbind = function unbind2(cb) {
      var idx = listeners.indexOf(cb);
      if (idx !== -1) {
        listeners.splice(idx, 1);
      }
      if (listeners.length === 0 && sensor) {
        destroy();
      }
    };
    return {
      element,
      bind,
      destroy,
      unbind
    };
  };
  return object;
}
var resizeObserver = {};
var hasRequiredResizeObserver;
function requireResizeObserver() {
  if (hasRequiredResizeObserver) return resizeObserver;
  hasRequiredResizeObserver = 1;
  Object.defineProperty(resizeObserver, "__esModule", {
    value: true
  });
  resizeObserver.createSensor = void 0;
  var _constant = /* @__PURE__ */ requireConstant();
  var _debounce = _interopRequireDefault(/* @__PURE__ */ requireDebounce());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { "default": e };
  }
  resizeObserver.createSensor = function createSensor(element, whenDestroy) {
    var sensor = void 0;
    var listeners = [];
    var resizeListener = (0, _debounce["default"])(function() {
      listeners.forEach(function(listener) {
        listener(element);
      });
    });
    var newSensor = function newSensor2() {
      var s = new ResizeObserver(resizeListener);
      s.observe(element);
      resizeListener();
      return s;
    };
    var bind = function bind2(cb) {
      if (!sensor) {
        sensor = newSensor();
      }
      if (listeners.indexOf(cb) === -1) {
        listeners.push(cb);
      }
    };
    var destroy = function destroy2() {
      if (sensor) {
        sensor.disconnect();
      }
      listeners = [];
      sensor = void 0;
      element.removeAttribute(_constant.SizeSensorId);
      whenDestroy && whenDestroy();
    };
    var unbind = function unbind2(cb) {
      var idx = listeners.indexOf(cb);
      if (idx !== -1) {
        listeners.splice(idx, 1);
      }
      if (listeners.length === 0 && sensor) {
        destroy();
      }
    };
    return {
      element,
      bind,
      destroy,
      unbind
    };
  };
  return resizeObserver;
}
var hasRequiredSensors;
function requireSensors() {
  if (hasRequiredSensors) return sensors;
  hasRequiredSensors = 1;
  Object.defineProperty(sensors, "__esModule", {
    value: true
  });
  sensors.createSensor = void 0;
  var _object = /* @__PURE__ */ requireObject();
  var _resizeObserver = /* @__PURE__ */ requireResizeObserver();
  sensors.createSensor = typeof ResizeObserver !== "undefined" ? _resizeObserver.createSensor : _object.createSensor;
  return sensors;
}
var hasRequiredSensorPool;
function requireSensorPool() {
  if (hasRequiredSensorPool) return sensorPool;
  hasRequiredSensorPool = 1;
  Object.defineProperty(sensorPool, "__esModule", {
    value: true
  });
  sensorPool.removeSensor = sensorPool.getSensor = sensorPool.Sensors = void 0;
  var _id = _interopRequireDefault(/* @__PURE__ */ requireId());
  var _sensors = /* @__PURE__ */ requireSensors();
  var _constant = /* @__PURE__ */ requireConstant();
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { "default": e };
  }
  var Sensors = sensorPool.Sensors = {};
  function clean(sensorId) {
    if (sensorId && Sensors[sensorId]) {
      delete Sensors[sensorId];
    }
  }
  sensorPool.getSensor = function getSensor(element) {
    var sensorId = element.getAttribute(_constant.SizeSensorId);
    if (sensorId && Sensors[sensorId]) {
      return Sensors[sensorId];
    }
    var newId = (0, _id["default"])();
    element.setAttribute(_constant.SizeSensorId, newId);
    var sensor = (0, _sensors.createSensor)(element, function() {
      return clean(newId);
    });
    Sensors[newId] = sensor;
    return sensor;
  };
  sensorPool.removeSensor = function removeSensor(sensor) {
    var sensorId = sensor.element.getAttribute(_constant.SizeSensorId);
    sensor.destroy();
    clean(sensorId);
  };
  return sensorPool;
}
var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib) return lib;
  hasRequiredLib = 1;
  Object.defineProperty(lib, "__esModule", {
    value: true
  });
  lib.ver = lib.clear = lib.bind = void 0;
  var _sensorPool = /* @__PURE__ */ requireSensorPool();
  lib.bind = function bind(element, cb) {
    var sensor = (0, _sensorPool.getSensor)(element);
    sensor.bind(cb);
    return function() {
      sensor.unbind(cb);
    };
  };
  lib.clear = function clear(element) {
    var sensor = (0, _sensorPool.getSensor)(element);
    (0, _sensorPool.removeSensor)(sensor);
  };
  lib.ver = "1.0.3";
  return lib;
}
var libExports = /* @__PURE__ */ requireLib();
export {
  libExports as l
};
