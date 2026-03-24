var NOTHING$3 = /* @__PURE__ */ Symbol.for("immer-nothing");
var DRAFTABLE$3 = /* @__PURE__ */ Symbol.for("immer-draftable");
var DRAFT_STATE$3 = /* @__PURE__ */ Symbol.for("immer-state");
function die$3(error, ...args) {
  throw new Error(
    `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
  );
}
var O$2 = Object;
var getPrototypeOf$3 = O$2.getPrototypeOf;
var CONSTRUCTOR$2 = "constructor";
var PROTOTYPE$2 = "prototype";
var CONFIGURABLE$2 = "configurable";
var ENUMERABLE$2 = "enumerable";
var WRITABLE$2 = "writable";
var VALUE$2 = "value";
var isDraft$3 = (value) => !!value && !!value[DRAFT_STATE$3];
function isDraftable$3(value) {
  if (!value)
    return false;
  return isPlainObject$3(value) || isArray$2(value) || !!value[DRAFTABLE$3] || !!value[CONSTRUCTOR$2]?.[DRAFTABLE$3] || isMap$3(value) || isSet$3(value);
}
var objectCtorString$3 = O$2[PROTOTYPE$2][CONSTRUCTOR$2].toString();
var cachedCtorStrings$3 = /* @__PURE__ */ new WeakMap();
function isPlainObject$3(value) {
  if (!value || !isObjectish$2(value))
    return false;
  const proto = getPrototypeOf$3(value);
  if (proto === null || proto === O$2[PROTOTYPE$2])
    return true;
  const Ctor = O$2.hasOwnProperty.call(proto, CONSTRUCTOR$2) && proto[CONSTRUCTOR$2];
  if (Ctor === Object)
    return true;
  if (!isFunction$2(Ctor))
    return false;
  let ctorString = cachedCtorStrings$3.get(Ctor);
  if (ctorString === void 0) {
    ctorString = Function.toString.call(Ctor);
    cachedCtorStrings$3.set(Ctor, ctorString);
  }
  return ctorString === objectCtorString$3;
}
function each$3(obj, iter, strict = true) {
  if (getArchtype$3(obj) === 0) {
    const keys = strict ? Reflect.ownKeys(obj) : O$2.keys(obj);
    keys.forEach((key) => {
      iter(key, obj[key], obj);
    });
  } else {
    obj.forEach((entry, index) => iter(index, entry, obj));
  }
}
function getArchtype$3(thing) {
  const state = thing[DRAFT_STATE$3];
  return state ? state.type_ : isArray$2(thing) ? 1 : isMap$3(thing) ? 2 : isSet$3(thing) ? 3 : 0;
}
var has$3 = (thing, prop, type = getArchtype$3(thing)) => type === 2 ? thing.has(prop) : O$2[PROTOTYPE$2].hasOwnProperty.call(thing, prop);
var get$2 = (thing, prop, type = getArchtype$3(thing)) => (
  // @ts-ignore
  type === 2 ? thing.get(prop) : thing[prop]
);
var set$3 = (thing, propOrOldValue, value, type = getArchtype$3(thing)) => {
  if (type === 2)
    thing.set(propOrOldValue, value);
  else if (type === 3) {
    thing.add(value);
  } else
    thing[propOrOldValue] = value;
};
function is$3(x, y) {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}
var isArray$2 = Array.isArray;
var isMap$3 = (target) => target instanceof Map;
var isSet$3 = (target) => target instanceof Set;
var isObjectish$2 = (target) => typeof target === "object";
var isFunction$2 = (target) => typeof target === "function";
var isBoolean$2 = (target) => typeof target === "boolean";
function isArrayIndex$2(value) {
  const n = +value;
  return Number.isInteger(n) && String(n) === value;
}
var latest$3 = (state) => state.copy_ || state.base_;
var getFinalValue$2 = (state) => state.modified_ ? state.copy_ : state.base_;
function shallowCopy$3(base, strict) {
  if (isMap$3(base)) {
    return new Map(base);
  }
  if (isSet$3(base)) {
    return new Set(base);
  }
  if (isArray$2(base))
    return Array[PROTOTYPE$2].slice.call(base);
  const isPlain = isPlainObject$3(base);
  if (strict === true || strict === "class_only" && !isPlain) {
    const descriptors = O$2.getOwnPropertyDescriptors(base);
    delete descriptors[DRAFT_STATE$3];
    let keys = Reflect.ownKeys(descriptors);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const desc = descriptors[key];
      if (desc[WRITABLE$2] === false) {
        desc[WRITABLE$2] = true;
        desc[CONFIGURABLE$2] = true;
      }
      if (desc.get || desc.set)
        descriptors[key] = {
          [CONFIGURABLE$2]: true,
          [WRITABLE$2]: true,
          // could live with !!desc.set as well here...
          [ENUMERABLE$2]: desc[ENUMERABLE$2],
          [VALUE$2]: base[key]
        };
    }
    return O$2.create(getPrototypeOf$3(base), descriptors);
  } else {
    const proto = getPrototypeOf$3(base);
    if (proto !== null && isPlain) {
      return { ...base };
    }
    const obj = O$2.create(proto);
    return O$2.assign(obj, base);
  }
}
function freeze$3(obj, deep = false) {
  if (isFrozen$3(obj) || isDraft$3(obj) || !isDraftable$3(obj))
    return obj;
  if (getArchtype$3(obj) > 1) {
    O$2.defineProperties(obj, {
      set: dontMutateMethodOverride$3,
      add: dontMutateMethodOverride$3,
      clear: dontMutateMethodOverride$3,
      delete: dontMutateMethodOverride$3
    });
  }
  O$2.freeze(obj);
  if (deep)
    each$3(
      obj,
      (_key, value) => {
        freeze$3(value, true);
      },
      false
    );
  return obj;
}
function dontMutateFrozenCollections$3() {
  die$3(2);
}
var dontMutateMethodOverride$3 = {
  [VALUE$2]: dontMutateFrozenCollections$3
};
function isFrozen$3(obj) {
  if (obj === null || !isObjectish$2(obj))
    return true;
  return O$2.isFrozen(obj);
}
var PluginMapSet$2 = "MapSet";
var PluginPatches$2 = "Patches";
var PluginArrayMethods$2 = "ArrayMethods";
var plugins$3 = {};
function getPlugin$3(pluginKey) {
  const plugin = plugins$3[pluginKey];
  if (!plugin) {
    die$3(0, pluginKey);
  }
  return plugin;
}
var isPluginLoaded$2 = (pluginKey) => !!plugins$3[pluginKey];
var currentScope$3;
var getCurrentScope$3 = () => currentScope$3;
var createScope$3 = (parent_, immer_) => ({
  drafts_: [],
  parent_,
  immer_,
  // Whenever the modified draft contains a draft from another scope, we
  // need to prevent auto-freezing so the unowned draft can be finalized.
  canAutoFreeze_: true,
  unfinalizedDrafts_: 0,
  handledSet_: /* @__PURE__ */ new Set(),
  processedForPatches_: /* @__PURE__ */ new Set(),
  mapSetPlugin_: isPluginLoaded$2(PluginMapSet$2) ? getPlugin$3(PluginMapSet$2) : void 0,
  arrayMethodsPlugin_: isPluginLoaded$2(PluginArrayMethods$2) ? getPlugin$3(PluginArrayMethods$2) : void 0
});
function usePatchesInScope$3(scope, patchListener) {
  if (patchListener) {
    scope.patchPlugin_ = getPlugin$3(PluginPatches$2);
    scope.patches_ = [];
    scope.inversePatches_ = [];
    scope.patchListener_ = patchListener;
  }
}
function revokeScope$3(scope) {
  leaveScope$3(scope);
  scope.drafts_.forEach(revokeDraft$3);
  scope.drafts_ = null;
}
function leaveScope$3(scope) {
  if (scope === currentScope$3) {
    currentScope$3 = scope.parent_;
  }
}
var enterScope$3 = (immer2) => currentScope$3 = createScope$3(currentScope$3, immer2);
function revokeDraft$3(draft) {
  const state = draft[DRAFT_STATE$3];
  if (state.type_ === 0 || state.type_ === 1)
    state.revoke_();
  else
    state.revoked_ = true;
}
function processResult$3(result, scope) {
  scope.unfinalizedDrafts_ = scope.drafts_.length;
  const baseDraft = scope.drafts_[0];
  const isReplaced = result !== void 0 && result !== baseDraft;
  if (isReplaced) {
    if (baseDraft[DRAFT_STATE$3].modified_) {
      revokeScope$3(scope);
      die$3(4);
    }
    if (isDraftable$3(result)) {
      result = finalize$3(scope, result);
    }
    const { patchPlugin_ } = scope;
    if (patchPlugin_) {
      patchPlugin_.generateReplacementPatches_(
        baseDraft[DRAFT_STATE$3].base_,
        result,
        scope
      );
    }
  } else {
    result = finalize$3(scope, baseDraft);
  }
  maybeFreeze$3(scope, result, true);
  revokeScope$3(scope);
  if (scope.patches_) {
    scope.patchListener_(scope.patches_, scope.inversePatches_);
  }
  return result !== NOTHING$3 ? result : void 0;
}
function finalize$3(rootScope, value) {
  if (isFrozen$3(value))
    return value;
  const state = value[DRAFT_STATE$3];
  if (!state) {
    const finalValue = handleValue$2(value, rootScope.handledSet_, rootScope);
    return finalValue;
  }
  if (!isSameScope$2(state, rootScope)) {
    return value;
  }
  if (!state.modified_) {
    return state.base_;
  }
  if (!state.finalized_) {
    const { callbacks_ } = state;
    if (callbacks_) {
      while (callbacks_.length > 0) {
        const callback = callbacks_.pop();
        callback(rootScope);
      }
    }
    generatePatchesAndFinalize$2(state, rootScope);
  }
  return state.copy_;
}
function maybeFreeze$3(scope, value, deep = false) {
  if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
    freeze$3(value, deep);
  }
}
function markStateFinalized$2(state) {
  state.finalized_ = true;
  state.scope_.unfinalizedDrafts_--;
}
var isSameScope$2 = (state, rootScope) => state.scope_ === rootScope;
var EMPTY_LOCATIONS_RESULT$2 = [];
function updateDraftInParent$2(parent, draftValue, finalizedValue, originalKey) {
  const parentCopy = latest$3(parent);
  const parentType = parent.type_;
  if (originalKey !== void 0) {
    const currentValue = get$2(parentCopy, originalKey, parentType);
    if (currentValue === draftValue) {
      set$3(parentCopy, originalKey, finalizedValue, parentType);
      return;
    }
  }
  if (!parent.draftLocations_) {
    const draftLocations = parent.draftLocations_ = /* @__PURE__ */ new Map();
    each$3(parentCopy, (key, value) => {
      if (isDraft$3(value)) {
        const keys = draftLocations.get(value) || [];
        keys.push(key);
        draftLocations.set(value, keys);
      }
    });
  }
  const locations = parent.draftLocations_.get(draftValue) ?? EMPTY_LOCATIONS_RESULT$2;
  for (const location of locations) {
    set$3(parentCopy, location, finalizedValue, parentType);
  }
}
function registerChildFinalizationCallback$2(parent, child, key) {
  parent.callbacks_.push(function childCleanup(rootScope) {
    const state = child;
    if (!state || !isSameScope$2(state, rootScope)) {
      return;
    }
    rootScope.mapSetPlugin_?.fixSetContents(state);
    const finalizedValue = getFinalValue$2(state);
    updateDraftInParent$2(parent, state.draft_ ?? state, finalizedValue, key);
    generatePatchesAndFinalize$2(state, rootScope);
  });
}
function generatePatchesAndFinalize$2(state, rootScope) {
  const shouldFinalize = state.modified_ && !state.finalized_ && (state.type_ === 3 || state.type_ === 1 && state.allIndicesReassigned_ || (state.assigned_?.size ?? 0) > 0);
  if (shouldFinalize) {
    const { patchPlugin_ } = rootScope;
    if (patchPlugin_) {
      const basePath = patchPlugin_.getPath(state);
      if (basePath) {
        patchPlugin_.generatePatches_(state, basePath, rootScope);
      }
    }
    markStateFinalized$2(state);
  }
}
function handleCrossReference$2(target, key, value) {
  const { scope_ } = target;
  if (isDraft$3(value)) {
    const state = value[DRAFT_STATE$3];
    if (isSameScope$2(state, scope_)) {
      state.callbacks_.push(function crossReferenceCleanup() {
        prepareCopy$3(target);
        const finalizedValue = getFinalValue$2(state);
        updateDraftInParent$2(target, value, finalizedValue, key);
      });
    }
  } else if (isDraftable$3(value)) {
    target.callbacks_.push(function nestedDraftCleanup() {
      const targetCopy = latest$3(target);
      if (target.type_ === 3) {
        if (targetCopy.has(value)) {
          handleValue$2(value, scope_.handledSet_, scope_);
        }
      } else {
        if (get$2(targetCopy, key, target.type_) === value) {
          if (scope_.drafts_.length > 1 && (target.assigned_.get(key) ?? false) === true && target.copy_) {
            handleValue$2(
              get$2(target.copy_, key, target.type_),
              scope_.handledSet_,
              scope_
            );
          }
        }
      }
    });
  }
}
function handleValue$2(target, handledSet, rootScope) {
  if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
    return target;
  }
  if (isDraft$3(target) || handledSet.has(target) || !isDraftable$3(target) || isFrozen$3(target)) {
    return target;
  }
  handledSet.add(target);
  each$3(target, (key, value) => {
    if (isDraft$3(value)) {
      const state = value[DRAFT_STATE$3];
      if (isSameScope$2(state, rootScope)) {
        const updatedValue = getFinalValue$2(state);
        set$3(target, key, updatedValue, target.type_);
        markStateFinalized$2(state);
      }
    } else if (isDraftable$3(value)) {
      handleValue$2(value, handledSet, rootScope);
    }
  });
  return target;
}
function createProxyProxy$3(base, parent) {
  const baseIsArray = isArray$2(base);
  const state = {
    type_: baseIsArray ? 1 : 0,
    // Track which produce call this is associated with.
    scope_: parent ? parent.scope_ : getCurrentScope$3(),
    // True for both shallow and deep changes.
    modified_: false,
    // Used during finalization.
    finalized_: false,
    // Track which properties have been assigned (true) or deleted (false).
    // actually instantiated in `prepareCopy()`
    assigned_: void 0,
    // The parent draft state.
    parent_: parent,
    // The base state.
    base_: base,
    // The base proxy.
    draft_: null,
    // set below
    // The base copy with any updated values.
    copy_: null,
    // Called by the `produce` function.
    revoke_: null,
    isManual_: false,
    // `callbacks` actually gets assigned in `createProxy`
    callbacks_: void 0
  };
  let target = state;
  let traps = objectTraps$3;
  if (baseIsArray) {
    target = [state];
    traps = arrayTraps$3;
  }
  const { revoke, proxy } = Proxy.revocable(target, traps);
  state.draft_ = proxy;
  state.revoke_ = revoke;
  return [proxy, state];
}
var objectTraps$3 = {
  get(state, prop) {
    if (prop === DRAFT_STATE$3)
      return state;
    let arrayPlugin = state.scope_.arrayMethodsPlugin_;
    const isArrayWithStringProp = state.type_ === 1 && typeof prop === "string";
    if (isArrayWithStringProp) {
      if (arrayPlugin?.isArrayOperationMethod(prop)) {
        return arrayPlugin.createMethodInterceptor(state, prop);
      }
    }
    const source = latest$3(state);
    if (!has$3(source, prop, state.type_)) {
      return readPropFromProto$3(state, source, prop);
    }
    const value = source[prop];
    if (state.finalized_ || !isDraftable$3(value)) {
      return value;
    }
    if (isArrayWithStringProp && state.operationMethod && arrayPlugin?.isMutatingArrayMethod(
      state.operationMethod
    ) && isArrayIndex$2(prop)) {
      return value;
    }
    if (value === peek$3(state.base_, prop)) {
      prepareCopy$3(state);
      const childKey = state.type_ === 1 ? +prop : prop;
      const childDraft = createProxy$3(state.scope_, value, state, childKey);
      return state.copy_[childKey] = childDraft;
    }
    return value;
  },
  has(state, prop) {
    return prop in latest$3(state);
  },
  ownKeys(state) {
    return Reflect.ownKeys(latest$3(state));
  },
  set(state, prop, value) {
    const desc = getDescriptorFromProto$3(latest$3(state), prop);
    if (desc?.set) {
      desc.set.call(state.draft_, value);
      return true;
    }
    if (!state.modified_) {
      const current2 = peek$3(latest$3(state), prop);
      const currentState = current2?.[DRAFT_STATE$3];
      if (currentState && currentState.base_ === value) {
        state.copy_[prop] = value;
        state.assigned_.set(prop, false);
        return true;
      }
      if (is$3(value, current2) && (value !== void 0 || has$3(state.base_, prop, state.type_)))
        return true;
      prepareCopy$3(state);
      markChanged$3(state);
    }
    if (state.copy_[prop] === value && // special case: handle new props with value 'undefined'
    (value !== void 0 || prop in state.copy_) || // special case: NaN
    Number.isNaN(value) && Number.isNaN(state.copy_[prop]))
      return true;
    state.copy_[prop] = value;
    state.assigned_.set(prop, true);
    handleCrossReference$2(state, prop, value);
    return true;
  },
  deleteProperty(state, prop) {
    prepareCopy$3(state);
    if (peek$3(state.base_, prop) !== void 0 || prop in state.base_) {
      state.assigned_.set(prop, false);
      markChanged$3(state);
    } else {
      state.assigned_.delete(prop);
    }
    if (state.copy_) {
      delete state.copy_[prop];
    }
    return true;
  },
  // Note: We never coerce `desc.value` into an Immer draft, because we can't make
  // the same guarantee in ES5 mode.
  getOwnPropertyDescriptor(state, prop) {
    const owner = latest$3(state);
    const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
    if (!desc)
      return desc;
    return {
      [WRITABLE$2]: true,
      [CONFIGURABLE$2]: state.type_ !== 1 || prop !== "length",
      [ENUMERABLE$2]: desc[ENUMERABLE$2],
      [VALUE$2]: owner[prop]
    };
  },
  defineProperty() {
    die$3(11);
  },
  getPrototypeOf(state) {
    return getPrototypeOf$3(state.base_);
  },
  setPrototypeOf() {
    die$3(12);
  }
};
var arrayTraps$3 = {};
for (let key in objectTraps$3) {
  let fn = objectTraps$3[key];
  arrayTraps$3[key] = function() {
    const args = arguments;
    args[0] = args[0][0];
    return fn.apply(this, args);
  };
}
arrayTraps$3.deleteProperty = function(state, prop) {
  return arrayTraps$3.set.call(this, state, prop, void 0);
};
arrayTraps$3.set = function(state, prop, value) {
  return objectTraps$3.set.call(this, state[0], prop, value, state[0]);
};
function peek$3(draft, prop) {
  const state = draft[DRAFT_STATE$3];
  const source = state ? latest$3(state) : draft;
  return source[prop];
}
function readPropFromProto$3(state, source, prop) {
  const desc = getDescriptorFromProto$3(source, prop);
  return desc ? VALUE$2 in desc ? desc[VALUE$2] : (
    // This is a very special case, if the prop is a getter defined by the
    // prototype, we should invoke it with the draft as context!
    desc.get?.call(state.draft_)
  ) : void 0;
}
function getDescriptorFromProto$3(source, prop) {
  if (!(prop in source))
    return void 0;
  let proto = getPrototypeOf$3(source);
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc)
      return desc;
    proto = getPrototypeOf$3(proto);
  }
  return void 0;
}
function markChanged$3(state) {
  if (!state.modified_) {
    state.modified_ = true;
    if (state.parent_) {
      markChanged$3(state.parent_);
    }
  }
}
function prepareCopy$3(state) {
  if (!state.copy_) {
    state.assigned_ = /* @__PURE__ */ new Map();
    state.copy_ = shallowCopy$3(
      state.base_,
      state.scope_.immer_.useStrictShallowCopy_
    );
  }
}
var Immer2$3 = class Immer2 {
  constructor(config) {
    this.autoFreeze_ = true;
    this.useStrictShallowCopy_ = false;
    this.useStrictIteration_ = false;
    this.produce = (base, recipe, patchListener) => {
      if (isFunction$2(base) && !isFunction$2(recipe)) {
        const defaultBase = recipe;
        recipe = base;
        const self = this;
        return function curriedProduce(base2 = defaultBase, ...args) {
          return self.produce(base2, (draft) => recipe.call(this, draft, ...args));
        };
      }
      if (!isFunction$2(recipe))
        die$3(6);
      if (patchListener !== void 0 && !isFunction$2(patchListener))
        die$3(7);
      let result;
      if (isDraftable$3(base)) {
        const scope = enterScope$3(this);
        const proxy = createProxy$3(scope, base, void 0);
        let hasError = true;
        try {
          result = recipe(proxy);
          hasError = false;
        } finally {
          if (hasError)
            revokeScope$3(scope);
          else
            leaveScope$3(scope);
        }
        usePatchesInScope$3(scope, patchListener);
        return processResult$3(result, scope);
      } else if (!base || !isObjectish$2(base)) {
        result = recipe(base);
        if (result === void 0)
          result = base;
        if (result === NOTHING$3)
          result = void 0;
        if (this.autoFreeze_)
          freeze$3(result, true);
        if (patchListener) {
          const p = [];
          const ip = [];
          getPlugin$3(PluginPatches$2).generateReplacementPatches_(base, result, {
            patches_: p,
            inversePatches_: ip
          });
          patchListener(p, ip);
        }
        return result;
      } else
        die$3(1, base);
    };
    this.produceWithPatches = (base, recipe) => {
      if (isFunction$2(base)) {
        return (state, ...args) => this.produceWithPatches(state, (draft) => base(draft, ...args));
      }
      let patches, inversePatches;
      const result = this.produce(base, recipe, (p, ip) => {
        patches = p;
        inversePatches = ip;
      });
      return [result, patches, inversePatches];
    };
    if (isBoolean$2(config?.autoFreeze))
      this.setAutoFreeze(config.autoFreeze);
    if (isBoolean$2(config?.useStrictShallowCopy))
      this.setUseStrictShallowCopy(config.useStrictShallowCopy);
    if (isBoolean$2(config?.useStrictIteration))
      this.setUseStrictIteration(config.useStrictIteration);
  }
  createDraft(base) {
    if (!isDraftable$3(base))
      die$3(8);
    if (isDraft$3(base))
      base = current$3(base);
    const scope = enterScope$3(this);
    const proxy = createProxy$3(scope, base, void 0);
    proxy[DRAFT_STATE$3].isManual_ = true;
    leaveScope$3(scope);
    return proxy;
  }
  finishDraft(draft, patchListener) {
    const state = draft && draft[DRAFT_STATE$3];
    if (!state || !state.isManual_)
      die$3(9);
    const { scope_: scope } = state;
    usePatchesInScope$3(scope, patchListener);
    return processResult$3(void 0, scope);
  }
  /**
   * Pass true to automatically freeze all copies created by Immer.
   *
   * By default, auto-freezing is enabled.
   */
  setAutoFreeze(value) {
    this.autoFreeze_ = value;
  }
  /**
   * Pass true to enable strict shallow copy.
   *
   * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
   */
  setUseStrictShallowCopy(value) {
    this.useStrictShallowCopy_ = value;
  }
  /**
   * Pass false to use faster iteration that skips non-enumerable properties
   * but still handles symbols for compatibility.
   *
   * By default, strict iteration is enabled (includes all own properties).
   */
  setUseStrictIteration(value) {
    this.useStrictIteration_ = value;
  }
  shouldUseStrictIteration() {
    return this.useStrictIteration_;
  }
  applyPatches(base, patches) {
    let i;
    for (i = patches.length - 1; i >= 0; i--) {
      const patch = patches[i];
      if (patch.path.length === 0 && patch.op === "replace") {
        base = patch.value;
        break;
      }
    }
    if (i > -1) {
      patches = patches.slice(i + 1);
    }
    const applyPatchesImpl = getPlugin$3(PluginPatches$2).applyPatches_;
    if (isDraft$3(base)) {
      return applyPatchesImpl(base, patches);
    }
    return this.produce(
      base,
      (draft) => applyPatchesImpl(draft, patches)
    );
  }
};
function createProxy$3(rootScope, value, parent, key) {
  const [draft, state] = isMap$3(value) ? getPlugin$3(PluginMapSet$2).proxyMap_(value, parent) : isSet$3(value) ? getPlugin$3(PluginMapSet$2).proxySet_(value, parent) : createProxyProxy$3(value, parent);
  const scope = parent?.scope_ ?? getCurrentScope$3();
  scope.drafts_.push(draft);
  state.callbacks_ = parent?.callbacks_ ?? [];
  state.key_ = key;
  if (parent && key !== void 0) {
    registerChildFinalizationCallback$2(parent, state, key);
  } else {
    state.callbacks_.push(function rootDraftCleanup(rootScope2) {
      rootScope2.mapSetPlugin_?.fixSetContents(state);
      const { patchPlugin_ } = rootScope2;
      if (state.modified_ && patchPlugin_) {
        patchPlugin_.generatePatches_(state, [], rootScope2);
      }
    });
  }
  return draft;
}
function current$3(value) {
  if (!isDraft$3(value))
    die$3(10, value);
  return currentImpl$3(value);
}
function currentImpl$3(value) {
  if (!isDraftable$3(value) || isFrozen$3(value))
    return value;
  const state = value[DRAFT_STATE$3];
  let copy;
  let strict = true;
  if (state) {
    if (!state.modified_)
      return state.base_;
    state.finalized_ = true;
    copy = shallowCopy$3(value, state.scope_.immer_.useStrictShallowCopy_);
    strict = state.scope_.immer_.shouldUseStrictIteration();
  } else {
    copy = shallowCopy$3(value, true);
  }
  each$3(
    copy,
    (key, childValue) => {
      set$3(copy, key, currentImpl$3(childValue));
    },
    strict
  );
  if (state) {
    state.finalized_ = false;
  }
  return copy;
}
var immer$3 = new Immer2$3();
var produce$2 = immer$3.produce;
var NOTHING$2 = /* @__PURE__ */ Symbol.for("immer-nothing");
var DRAFTABLE$2 = /* @__PURE__ */ Symbol.for("immer-draftable");
var DRAFT_STATE$2 = /* @__PURE__ */ Symbol.for("immer-state");
function die$2(error, ...args) {
  throw new Error(
    `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
  );
}
var O$1 = Object;
var getPrototypeOf$2 = O$1.getPrototypeOf;
var CONSTRUCTOR$1 = "constructor";
var PROTOTYPE$1 = "prototype";
var CONFIGURABLE$1 = "configurable";
var ENUMERABLE$1 = "enumerable";
var WRITABLE$1 = "writable";
var VALUE$1 = "value";
var isDraft$2 = (value) => !!value && !!value[DRAFT_STATE$2];
function isDraftable$2(value) {
  if (!value)
    return false;
  return isPlainObject$2(value) || isArray$1(value) || !!value[DRAFTABLE$2] || !!value[CONSTRUCTOR$1]?.[DRAFTABLE$2] || isMap$2(value) || isSet$2(value);
}
var objectCtorString$2 = O$1[PROTOTYPE$1][CONSTRUCTOR$1].toString();
var cachedCtorStrings$2 = /* @__PURE__ */ new WeakMap();
function isPlainObject$2(value) {
  if (!value || !isObjectish$1(value))
    return false;
  const proto = getPrototypeOf$2(value);
  if (proto === null || proto === O$1[PROTOTYPE$1])
    return true;
  const Ctor = O$1.hasOwnProperty.call(proto, CONSTRUCTOR$1) && proto[CONSTRUCTOR$1];
  if (Ctor === Object)
    return true;
  if (!isFunction$1(Ctor))
    return false;
  let ctorString = cachedCtorStrings$2.get(Ctor);
  if (ctorString === void 0) {
    ctorString = Function.toString.call(Ctor);
    cachedCtorStrings$2.set(Ctor, ctorString);
  }
  return ctorString === objectCtorString$2;
}
function each$2(obj, iter, strict = true) {
  if (getArchtype$2(obj) === 0) {
    const keys = strict ? Reflect.ownKeys(obj) : O$1.keys(obj);
    keys.forEach((key) => {
      iter(key, obj[key], obj);
    });
  } else {
    obj.forEach((entry, index) => iter(index, entry, obj));
  }
}
function getArchtype$2(thing) {
  const state = thing[DRAFT_STATE$2];
  return state ? state.type_ : isArray$1(thing) ? 1 : isMap$2(thing) ? 2 : isSet$2(thing) ? 3 : 0;
}
var has$2 = (thing, prop, type = getArchtype$2(thing)) => type === 2 ? thing.has(prop) : O$1[PROTOTYPE$1].hasOwnProperty.call(thing, prop);
var get$1 = (thing, prop, type = getArchtype$2(thing)) => (
  // @ts-ignore
  type === 2 ? thing.get(prop) : thing[prop]
);
var set$2 = (thing, propOrOldValue, value, type = getArchtype$2(thing)) => {
  if (type === 2)
    thing.set(propOrOldValue, value);
  else if (type === 3) {
    thing.add(value);
  } else
    thing[propOrOldValue] = value;
};
function is$2(x, y) {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}
var isArray$1 = Array.isArray;
var isMap$2 = (target) => target instanceof Map;
var isSet$2 = (target) => target instanceof Set;
var isObjectish$1 = (target) => typeof target === "object";
var isFunction$1 = (target) => typeof target === "function";
var isBoolean$1 = (target) => typeof target === "boolean";
function isArrayIndex$1(value) {
  const n = +value;
  return Number.isInteger(n) && String(n) === value;
}
var latest$2 = (state) => state.copy_ || state.base_;
var getFinalValue$1 = (state) => state.modified_ ? state.copy_ : state.base_;
function shallowCopy$2(base, strict) {
  if (isMap$2(base)) {
    return new Map(base);
  }
  if (isSet$2(base)) {
    return new Set(base);
  }
  if (isArray$1(base))
    return Array[PROTOTYPE$1].slice.call(base);
  const isPlain = isPlainObject$2(base);
  if (strict === true || strict === "class_only" && !isPlain) {
    const descriptors = O$1.getOwnPropertyDescriptors(base);
    delete descriptors[DRAFT_STATE$2];
    let keys = Reflect.ownKeys(descriptors);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const desc = descriptors[key];
      if (desc[WRITABLE$1] === false) {
        desc[WRITABLE$1] = true;
        desc[CONFIGURABLE$1] = true;
      }
      if (desc.get || desc.set)
        descriptors[key] = {
          [CONFIGURABLE$1]: true,
          [WRITABLE$1]: true,
          // could live with !!desc.set as well here...
          [ENUMERABLE$1]: desc[ENUMERABLE$1],
          [VALUE$1]: base[key]
        };
    }
    return O$1.create(getPrototypeOf$2(base), descriptors);
  } else {
    const proto = getPrototypeOf$2(base);
    if (proto !== null && isPlain) {
      return { ...base };
    }
    const obj = O$1.create(proto);
    return O$1.assign(obj, base);
  }
}
function freeze$2(obj, deep = false) {
  if (isFrozen$2(obj) || isDraft$2(obj) || !isDraftable$2(obj))
    return obj;
  if (getArchtype$2(obj) > 1) {
    O$1.defineProperties(obj, {
      set: dontMutateMethodOverride$2,
      add: dontMutateMethodOverride$2,
      clear: dontMutateMethodOverride$2,
      delete: dontMutateMethodOverride$2
    });
  }
  O$1.freeze(obj);
  if (deep)
    each$2(
      obj,
      (_key, value) => {
        freeze$2(value, true);
      },
      false
    );
  return obj;
}
function dontMutateFrozenCollections$2() {
  die$2(2);
}
var dontMutateMethodOverride$2 = {
  [VALUE$1]: dontMutateFrozenCollections$2
};
function isFrozen$2(obj) {
  if (obj === null || !isObjectish$1(obj))
    return true;
  return O$1.isFrozen(obj);
}
var PluginMapSet$1 = "MapSet";
var PluginPatches$1 = "Patches";
var PluginArrayMethods$1 = "ArrayMethods";
var plugins$2 = {};
function getPlugin$2(pluginKey) {
  const plugin = plugins$2[pluginKey];
  if (!plugin) {
    die$2(0, pluginKey);
  }
  return plugin;
}
var isPluginLoaded$1 = (pluginKey) => !!plugins$2[pluginKey];
var currentScope$2;
var getCurrentScope$2 = () => currentScope$2;
var createScope$2 = (parent_, immer_) => ({
  drafts_: [],
  parent_,
  immer_,
  // Whenever the modified draft contains a draft from another scope, we
  // need to prevent auto-freezing so the unowned draft can be finalized.
  canAutoFreeze_: true,
  unfinalizedDrafts_: 0,
  handledSet_: /* @__PURE__ */ new Set(),
  processedForPatches_: /* @__PURE__ */ new Set(),
  mapSetPlugin_: isPluginLoaded$1(PluginMapSet$1) ? getPlugin$2(PluginMapSet$1) : void 0,
  arrayMethodsPlugin_: isPluginLoaded$1(PluginArrayMethods$1) ? getPlugin$2(PluginArrayMethods$1) : void 0
});
function usePatchesInScope$2(scope, patchListener) {
  if (patchListener) {
    scope.patchPlugin_ = getPlugin$2(PluginPatches$1);
    scope.patches_ = [];
    scope.inversePatches_ = [];
    scope.patchListener_ = patchListener;
  }
}
function revokeScope$2(scope) {
  leaveScope$2(scope);
  scope.drafts_.forEach(revokeDraft$2);
  scope.drafts_ = null;
}
function leaveScope$2(scope) {
  if (scope === currentScope$2) {
    currentScope$2 = scope.parent_;
  }
}
var enterScope$2 = (immer2) => currentScope$2 = createScope$2(currentScope$2, immer2);
function revokeDraft$2(draft) {
  const state = draft[DRAFT_STATE$2];
  if (state.type_ === 0 || state.type_ === 1)
    state.revoke_();
  else
    state.revoked_ = true;
}
function processResult$2(result, scope) {
  scope.unfinalizedDrafts_ = scope.drafts_.length;
  const baseDraft = scope.drafts_[0];
  const isReplaced = result !== void 0 && result !== baseDraft;
  if (isReplaced) {
    if (baseDraft[DRAFT_STATE$2].modified_) {
      revokeScope$2(scope);
      die$2(4);
    }
    if (isDraftable$2(result)) {
      result = finalize$2(scope, result);
    }
    const { patchPlugin_ } = scope;
    if (patchPlugin_) {
      patchPlugin_.generateReplacementPatches_(
        baseDraft[DRAFT_STATE$2].base_,
        result,
        scope
      );
    }
  } else {
    result = finalize$2(scope, baseDraft);
  }
  maybeFreeze$2(scope, result, true);
  revokeScope$2(scope);
  if (scope.patches_) {
    scope.patchListener_(scope.patches_, scope.inversePatches_);
  }
  return result !== NOTHING$2 ? result : void 0;
}
function finalize$2(rootScope, value) {
  if (isFrozen$2(value))
    return value;
  const state = value[DRAFT_STATE$2];
  if (!state) {
    const finalValue = handleValue$1(value, rootScope.handledSet_, rootScope);
    return finalValue;
  }
  if (!isSameScope$1(state, rootScope)) {
    return value;
  }
  if (!state.modified_) {
    return state.base_;
  }
  if (!state.finalized_) {
    const { callbacks_ } = state;
    if (callbacks_) {
      while (callbacks_.length > 0) {
        const callback = callbacks_.pop();
        callback(rootScope);
      }
    }
    generatePatchesAndFinalize$1(state, rootScope);
  }
  return state.copy_;
}
function maybeFreeze$2(scope, value, deep = false) {
  if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
    freeze$2(value, deep);
  }
}
function markStateFinalized$1(state) {
  state.finalized_ = true;
  state.scope_.unfinalizedDrafts_--;
}
var isSameScope$1 = (state, rootScope) => state.scope_ === rootScope;
var EMPTY_LOCATIONS_RESULT$1 = [];
function updateDraftInParent$1(parent, draftValue, finalizedValue, originalKey) {
  const parentCopy = latest$2(parent);
  const parentType = parent.type_;
  if (originalKey !== void 0) {
    const currentValue = get$1(parentCopy, originalKey, parentType);
    if (currentValue === draftValue) {
      set$2(parentCopy, originalKey, finalizedValue, parentType);
      return;
    }
  }
  if (!parent.draftLocations_) {
    const draftLocations = parent.draftLocations_ = /* @__PURE__ */ new Map();
    each$2(parentCopy, (key, value) => {
      if (isDraft$2(value)) {
        const keys = draftLocations.get(value) || [];
        keys.push(key);
        draftLocations.set(value, keys);
      }
    });
  }
  const locations = parent.draftLocations_.get(draftValue) ?? EMPTY_LOCATIONS_RESULT$1;
  for (const location of locations) {
    set$2(parentCopy, location, finalizedValue, parentType);
  }
}
function registerChildFinalizationCallback$1(parent, child, key) {
  parent.callbacks_.push(function childCleanup(rootScope) {
    const state = child;
    if (!state || !isSameScope$1(state, rootScope)) {
      return;
    }
    rootScope.mapSetPlugin_?.fixSetContents(state);
    const finalizedValue = getFinalValue$1(state);
    updateDraftInParent$1(parent, state.draft_ ?? state, finalizedValue, key);
    generatePatchesAndFinalize$1(state, rootScope);
  });
}
function generatePatchesAndFinalize$1(state, rootScope) {
  const shouldFinalize = state.modified_ && !state.finalized_ && (state.type_ === 3 || state.type_ === 1 && state.allIndicesReassigned_ || (state.assigned_?.size ?? 0) > 0);
  if (shouldFinalize) {
    const { patchPlugin_ } = rootScope;
    if (patchPlugin_) {
      const basePath = patchPlugin_.getPath(state);
      if (basePath) {
        patchPlugin_.generatePatches_(state, basePath, rootScope);
      }
    }
    markStateFinalized$1(state);
  }
}
function handleCrossReference$1(target, key, value) {
  const { scope_ } = target;
  if (isDraft$2(value)) {
    const state = value[DRAFT_STATE$2];
    if (isSameScope$1(state, scope_)) {
      state.callbacks_.push(function crossReferenceCleanup() {
        prepareCopy$2(target);
        const finalizedValue = getFinalValue$1(state);
        updateDraftInParent$1(target, value, finalizedValue, key);
      });
    }
  } else if (isDraftable$2(value)) {
    target.callbacks_.push(function nestedDraftCleanup() {
      const targetCopy = latest$2(target);
      if (target.type_ === 3) {
        if (targetCopy.has(value)) {
          handleValue$1(value, scope_.handledSet_, scope_);
        }
      } else {
        if (get$1(targetCopy, key, target.type_) === value) {
          if (scope_.drafts_.length > 1 && (target.assigned_.get(key) ?? false) === true && target.copy_) {
            handleValue$1(
              get$1(target.copy_, key, target.type_),
              scope_.handledSet_,
              scope_
            );
          }
        }
      }
    });
  }
}
function handleValue$1(target, handledSet, rootScope) {
  if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
    return target;
  }
  if (isDraft$2(target) || handledSet.has(target) || !isDraftable$2(target) || isFrozen$2(target)) {
    return target;
  }
  handledSet.add(target);
  each$2(target, (key, value) => {
    if (isDraft$2(value)) {
      const state = value[DRAFT_STATE$2];
      if (isSameScope$1(state, rootScope)) {
        const updatedValue = getFinalValue$1(state);
        set$2(target, key, updatedValue, target.type_);
        markStateFinalized$1(state);
      }
    } else if (isDraftable$2(value)) {
      handleValue$1(value, handledSet, rootScope);
    }
  });
  return target;
}
function createProxyProxy$2(base, parent) {
  const baseIsArray = isArray$1(base);
  const state = {
    type_: baseIsArray ? 1 : 0,
    // Track which produce call this is associated with.
    scope_: parent ? parent.scope_ : getCurrentScope$2(),
    // True for both shallow and deep changes.
    modified_: false,
    // Used during finalization.
    finalized_: false,
    // Track which properties have been assigned (true) or deleted (false).
    // actually instantiated in `prepareCopy()`
    assigned_: void 0,
    // The parent draft state.
    parent_: parent,
    // The base state.
    base_: base,
    // The base proxy.
    draft_: null,
    // set below
    // The base copy with any updated values.
    copy_: null,
    // Called by the `produce` function.
    revoke_: null,
    isManual_: false,
    // `callbacks` actually gets assigned in `createProxy`
    callbacks_: void 0
  };
  let target = state;
  let traps = objectTraps$2;
  if (baseIsArray) {
    target = [state];
    traps = arrayTraps$2;
  }
  const { revoke, proxy } = Proxy.revocable(target, traps);
  state.draft_ = proxy;
  state.revoke_ = revoke;
  return [proxy, state];
}
var objectTraps$2 = {
  get(state, prop) {
    if (prop === DRAFT_STATE$2)
      return state;
    let arrayPlugin = state.scope_.arrayMethodsPlugin_;
    const isArrayWithStringProp = state.type_ === 1 && typeof prop === "string";
    if (isArrayWithStringProp) {
      if (arrayPlugin?.isArrayOperationMethod(prop)) {
        return arrayPlugin.createMethodInterceptor(state, prop);
      }
    }
    const source = latest$2(state);
    if (!has$2(source, prop, state.type_)) {
      return readPropFromProto$2(state, source, prop);
    }
    const value = source[prop];
    if (state.finalized_ || !isDraftable$2(value)) {
      return value;
    }
    if (isArrayWithStringProp && state.operationMethod && arrayPlugin?.isMutatingArrayMethod(
      state.operationMethod
    ) && isArrayIndex$1(prop)) {
      return value;
    }
    if (value === peek$2(state.base_, prop)) {
      prepareCopy$2(state);
      const childKey = state.type_ === 1 ? +prop : prop;
      const childDraft = createProxy$2(state.scope_, value, state, childKey);
      return state.copy_[childKey] = childDraft;
    }
    return value;
  },
  has(state, prop) {
    return prop in latest$2(state);
  },
  ownKeys(state) {
    return Reflect.ownKeys(latest$2(state));
  },
  set(state, prop, value) {
    const desc = getDescriptorFromProto$2(latest$2(state), prop);
    if (desc?.set) {
      desc.set.call(state.draft_, value);
      return true;
    }
    if (!state.modified_) {
      const current2 = peek$2(latest$2(state), prop);
      const currentState = current2?.[DRAFT_STATE$2];
      if (currentState && currentState.base_ === value) {
        state.copy_[prop] = value;
        state.assigned_.set(prop, false);
        return true;
      }
      if (is$2(value, current2) && (value !== void 0 || has$2(state.base_, prop, state.type_)))
        return true;
      prepareCopy$2(state);
      markChanged$2(state);
    }
    if (state.copy_[prop] === value && // special case: handle new props with value 'undefined'
    (value !== void 0 || prop in state.copy_) || // special case: NaN
    Number.isNaN(value) && Number.isNaN(state.copy_[prop]))
      return true;
    state.copy_[prop] = value;
    state.assigned_.set(prop, true);
    handleCrossReference$1(state, prop, value);
    return true;
  },
  deleteProperty(state, prop) {
    prepareCopy$2(state);
    if (peek$2(state.base_, prop) !== void 0 || prop in state.base_) {
      state.assigned_.set(prop, false);
      markChanged$2(state);
    } else {
      state.assigned_.delete(prop);
    }
    if (state.copy_) {
      delete state.copy_[prop];
    }
    return true;
  },
  // Note: We never coerce `desc.value` into an Immer draft, because we can't make
  // the same guarantee in ES5 mode.
  getOwnPropertyDescriptor(state, prop) {
    const owner = latest$2(state);
    const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
    if (!desc)
      return desc;
    return {
      [WRITABLE$1]: true,
      [CONFIGURABLE$1]: state.type_ !== 1 || prop !== "length",
      [ENUMERABLE$1]: desc[ENUMERABLE$1],
      [VALUE$1]: owner[prop]
    };
  },
  defineProperty() {
    die$2(11);
  },
  getPrototypeOf(state) {
    return getPrototypeOf$2(state.base_);
  },
  setPrototypeOf() {
    die$2(12);
  }
};
var arrayTraps$2 = {};
for (let key in objectTraps$2) {
  let fn = objectTraps$2[key];
  arrayTraps$2[key] = function() {
    const args = arguments;
    args[0] = args[0][0];
    return fn.apply(this, args);
  };
}
arrayTraps$2.deleteProperty = function(state, prop) {
  return arrayTraps$2.set.call(this, state, prop, void 0);
};
arrayTraps$2.set = function(state, prop, value) {
  return objectTraps$2.set.call(this, state[0], prop, value, state[0]);
};
function peek$2(draft, prop) {
  const state = draft[DRAFT_STATE$2];
  const source = state ? latest$2(state) : draft;
  return source[prop];
}
function readPropFromProto$2(state, source, prop) {
  const desc = getDescriptorFromProto$2(source, prop);
  return desc ? VALUE$1 in desc ? desc[VALUE$1] : (
    // This is a very special case, if the prop is a getter defined by the
    // prototype, we should invoke it with the draft as context!
    desc.get?.call(state.draft_)
  ) : void 0;
}
function getDescriptorFromProto$2(source, prop) {
  if (!(prop in source))
    return void 0;
  let proto = getPrototypeOf$2(source);
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc)
      return desc;
    proto = getPrototypeOf$2(proto);
  }
  return void 0;
}
function markChanged$2(state) {
  if (!state.modified_) {
    state.modified_ = true;
    if (state.parent_) {
      markChanged$2(state.parent_);
    }
  }
}
function prepareCopy$2(state) {
  if (!state.copy_) {
    state.assigned_ = /* @__PURE__ */ new Map();
    state.copy_ = shallowCopy$2(
      state.base_,
      state.scope_.immer_.useStrictShallowCopy_
    );
  }
}
var Immer2$2 = class Immer22 {
  constructor(config) {
    this.autoFreeze_ = true;
    this.useStrictShallowCopy_ = false;
    this.useStrictIteration_ = false;
    this.produce = (base, recipe, patchListener) => {
      if (isFunction$1(base) && !isFunction$1(recipe)) {
        const defaultBase = recipe;
        recipe = base;
        const self = this;
        return function curriedProduce(base2 = defaultBase, ...args) {
          return self.produce(base2, (draft) => recipe.call(this, draft, ...args));
        };
      }
      if (!isFunction$1(recipe))
        die$2(6);
      if (patchListener !== void 0 && !isFunction$1(patchListener))
        die$2(7);
      let result;
      if (isDraftable$2(base)) {
        const scope = enterScope$2(this);
        const proxy = createProxy$2(scope, base, void 0);
        let hasError = true;
        try {
          result = recipe(proxy);
          hasError = false;
        } finally {
          if (hasError)
            revokeScope$2(scope);
          else
            leaveScope$2(scope);
        }
        usePatchesInScope$2(scope, patchListener);
        return processResult$2(result, scope);
      } else if (!base || !isObjectish$1(base)) {
        result = recipe(base);
        if (result === void 0)
          result = base;
        if (result === NOTHING$2)
          result = void 0;
        if (this.autoFreeze_)
          freeze$2(result, true);
        if (patchListener) {
          const p = [];
          const ip = [];
          getPlugin$2(PluginPatches$1).generateReplacementPatches_(base, result, {
            patches_: p,
            inversePatches_: ip
          });
          patchListener(p, ip);
        }
        return result;
      } else
        die$2(1, base);
    };
    this.produceWithPatches = (base, recipe) => {
      if (isFunction$1(base)) {
        return (state, ...args) => this.produceWithPatches(state, (draft) => base(draft, ...args));
      }
      let patches, inversePatches;
      const result = this.produce(base, recipe, (p, ip) => {
        patches = p;
        inversePatches = ip;
      });
      return [result, patches, inversePatches];
    };
    if (isBoolean$1(config?.autoFreeze))
      this.setAutoFreeze(config.autoFreeze);
    if (isBoolean$1(config?.useStrictShallowCopy))
      this.setUseStrictShallowCopy(config.useStrictShallowCopy);
    if (isBoolean$1(config?.useStrictIteration))
      this.setUseStrictIteration(config.useStrictIteration);
  }
  createDraft(base) {
    if (!isDraftable$2(base))
      die$2(8);
    if (isDraft$2(base))
      base = current$2(base);
    const scope = enterScope$2(this);
    const proxy = createProxy$2(scope, base, void 0);
    proxy[DRAFT_STATE$2].isManual_ = true;
    leaveScope$2(scope);
    return proxy;
  }
  finishDraft(draft, patchListener) {
    const state = draft && draft[DRAFT_STATE$2];
    if (!state || !state.isManual_)
      die$2(9);
    const { scope_: scope } = state;
    usePatchesInScope$2(scope, patchListener);
    return processResult$2(void 0, scope);
  }
  /**
   * Pass true to automatically freeze all copies created by Immer.
   *
   * By default, auto-freezing is enabled.
   */
  setAutoFreeze(value) {
    this.autoFreeze_ = value;
  }
  /**
   * Pass true to enable strict shallow copy.
   *
   * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
   */
  setUseStrictShallowCopy(value) {
    this.useStrictShallowCopy_ = value;
  }
  /**
   * Pass false to use faster iteration that skips non-enumerable properties
   * but still handles symbols for compatibility.
   *
   * By default, strict iteration is enabled (includes all own properties).
   */
  setUseStrictIteration(value) {
    this.useStrictIteration_ = value;
  }
  shouldUseStrictIteration() {
    return this.useStrictIteration_;
  }
  applyPatches(base, patches) {
    let i;
    for (i = patches.length - 1; i >= 0; i--) {
      const patch = patches[i];
      if (patch.path.length === 0 && patch.op === "replace") {
        base = patch.value;
        break;
      }
    }
    if (i > -1) {
      patches = patches.slice(i + 1);
    }
    const applyPatchesImpl = getPlugin$2(PluginPatches$1).applyPatches_;
    if (isDraft$2(base)) {
      return applyPatchesImpl(base, patches);
    }
    return this.produce(
      base,
      (draft) => applyPatchesImpl(draft, patches)
    );
  }
};
function createProxy$2(rootScope, value, parent, key) {
  const [draft, state] = isMap$2(value) ? getPlugin$2(PluginMapSet$1).proxyMap_(value, parent) : isSet$2(value) ? getPlugin$2(PluginMapSet$1).proxySet_(value, parent) : createProxyProxy$2(value, parent);
  const scope = parent?.scope_ ?? getCurrentScope$2();
  scope.drafts_.push(draft);
  state.callbacks_ = parent?.callbacks_ ?? [];
  state.key_ = key;
  if (parent && key !== void 0) {
    registerChildFinalizationCallback$1(parent, state, key);
  } else {
    state.callbacks_.push(function rootDraftCleanup(rootScope2) {
      rootScope2.mapSetPlugin_?.fixSetContents(state);
      const { patchPlugin_ } = rootScope2;
      if (state.modified_ && patchPlugin_) {
        patchPlugin_.generatePatches_(state, [], rootScope2);
      }
    });
  }
  return draft;
}
function current$2(value) {
  if (!isDraft$2(value))
    die$2(10, value);
  return currentImpl$2(value);
}
function currentImpl$2(value) {
  if (!isDraftable$2(value) || isFrozen$2(value))
    return value;
  const state = value[DRAFT_STATE$2];
  let copy;
  let strict = true;
  if (state) {
    if (!state.modified_)
      return state.base_;
    state.finalized_ = true;
    copy = shallowCopy$2(value, state.scope_.immer_.useStrictShallowCopy_);
    strict = state.scope_.immer_.shouldUseStrictIteration();
  } else {
    copy = shallowCopy$2(value, true);
  }
  each$2(
    copy,
    (key, childValue) => {
      set$2(copy, key, currentImpl$2(childValue));
    },
    strict
  );
  if (state) {
    state.finalized_ = false;
  }
  return copy;
}
var immer$2 = new Immer2$2();
var produce$1 = immer$2.produce;
var NOTHING$1 = /* @__PURE__ */ Symbol.for("immer-nothing");
var DRAFTABLE$1 = /* @__PURE__ */ Symbol.for("immer-draftable");
var DRAFT_STATE$1 = /* @__PURE__ */ Symbol.for("immer-state");
function die$1(error, ...args) {
  throw new Error(
    `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
  );
}
var O = Object;
var getPrototypeOf$1 = O.getPrototypeOf;
var CONSTRUCTOR = "constructor";
var PROTOTYPE = "prototype";
var CONFIGURABLE = "configurable";
var ENUMERABLE = "enumerable";
var WRITABLE = "writable";
var VALUE = "value";
var isDraft$1 = (value) => !!value && !!value[DRAFT_STATE$1];
function isDraftable$1(value) {
  if (!value)
    return false;
  return isPlainObject$1(value) || isArray(value) || !!value[DRAFTABLE$1] || !!value[CONSTRUCTOR]?.[DRAFTABLE$1] || isMap$1(value) || isSet$1(value);
}
var objectCtorString$1 = O[PROTOTYPE][CONSTRUCTOR].toString();
var cachedCtorStrings$1 = /* @__PURE__ */ new WeakMap();
function isPlainObject$1(value) {
  if (!value || !isObjectish(value))
    return false;
  const proto = getPrototypeOf$1(value);
  if (proto === null || proto === O[PROTOTYPE])
    return true;
  const Ctor = O.hasOwnProperty.call(proto, CONSTRUCTOR) && proto[CONSTRUCTOR];
  if (Ctor === Object)
    return true;
  if (!isFunction(Ctor))
    return false;
  let ctorString = cachedCtorStrings$1.get(Ctor);
  if (ctorString === void 0) {
    ctorString = Function.toString.call(Ctor);
    cachedCtorStrings$1.set(Ctor, ctorString);
  }
  return ctorString === objectCtorString$1;
}
function each$1(obj, iter, strict = true) {
  if (getArchtype$1(obj) === 0) {
    const keys = strict ? Reflect.ownKeys(obj) : O.keys(obj);
    keys.forEach((key) => {
      iter(key, obj[key], obj);
    });
  } else {
    obj.forEach((entry, index) => iter(index, entry, obj));
  }
}
function getArchtype$1(thing) {
  const state = thing[DRAFT_STATE$1];
  return state ? state.type_ : isArray(thing) ? 1 : isMap$1(thing) ? 2 : isSet$1(thing) ? 3 : 0;
}
var has$1 = (thing, prop, type = getArchtype$1(thing)) => type === 2 ? thing.has(prop) : O[PROTOTYPE].hasOwnProperty.call(thing, prop);
var get = (thing, prop, type = getArchtype$1(thing)) => (
  // @ts-ignore
  type === 2 ? thing.get(prop) : thing[prop]
);
var set$1 = (thing, propOrOldValue, value, type = getArchtype$1(thing)) => {
  if (type === 2)
    thing.set(propOrOldValue, value);
  else if (type === 3) {
    thing.add(value);
  } else
    thing[propOrOldValue] = value;
};
function is$1(x, y) {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}
var isArray = Array.isArray;
var isMap$1 = (target) => target instanceof Map;
var isSet$1 = (target) => target instanceof Set;
var isObjectish = (target) => typeof target === "object";
var isFunction = (target) => typeof target === "function";
var isBoolean = (target) => typeof target === "boolean";
function isArrayIndex(value) {
  const n = +value;
  return Number.isInteger(n) && String(n) === value;
}
var latest$1 = (state) => state.copy_ || state.base_;
var getFinalValue = (state) => state.modified_ ? state.copy_ : state.base_;
function shallowCopy$1(base, strict) {
  if (isMap$1(base)) {
    return new Map(base);
  }
  if (isSet$1(base)) {
    return new Set(base);
  }
  if (isArray(base))
    return Array[PROTOTYPE].slice.call(base);
  const isPlain = isPlainObject$1(base);
  if (strict === true || strict === "class_only" && !isPlain) {
    const descriptors = O.getOwnPropertyDescriptors(base);
    delete descriptors[DRAFT_STATE$1];
    let keys = Reflect.ownKeys(descriptors);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const desc = descriptors[key];
      if (desc[WRITABLE] === false) {
        desc[WRITABLE] = true;
        desc[CONFIGURABLE] = true;
      }
      if (desc.get || desc.set)
        descriptors[key] = {
          [CONFIGURABLE]: true,
          [WRITABLE]: true,
          // could live with !!desc.set as well here...
          [ENUMERABLE]: desc[ENUMERABLE],
          [VALUE]: base[key]
        };
    }
    return O.create(getPrototypeOf$1(base), descriptors);
  } else {
    const proto = getPrototypeOf$1(base);
    if (proto !== null && isPlain) {
      return { ...base };
    }
    const obj = O.create(proto);
    return O.assign(obj, base);
  }
}
function freeze$1(obj, deep = false) {
  if (isFrozen$1(obj) || isDraft$1(obj) || !isDraftable$1(obj))
    return obj;
  if (getArchtype$1(obj) > 1) {
    O.defineProperties(obj, {
      set: dontMutateMethodOverride$1,
      add: dontMutateMethodOverride$1,
      clear: dontMutateMethodOverride$1,
      delete: dontMutateMethodOverride$1
    });
  }
  O.freeze(obj);
  if (deep)
    each$1(
      obj,
      (_key, value) => {
        freeze$1(value, true);
      },
      false
    );
  return obj;
}
function dontMutateFrozenCollections$1() {
  die$1(2);
}
var dontMutateMethodOverride$1 = {
  [VALUE]: dontMutateFrozenCollections$1
};
function isFrozen$1(obj) {
  if (obj === null || !isObjectish(obj))
    return true;
  return O.isFrozen(obj);
}
var PluginMapSet = "MapSet";
var PluginPatches = "Patches";
var PluginArrayMethods = "ArrayMethods";
var plugins$1 = {};
function getPlugin$1(pluginKey) {
  const plugin = plugins$1[pluginKey];
  if (!plugin) {
    die$1(0, pluginKey);
  }
  return plugin;
}
var isPluginLoaded = (pluginKey) => !!plugins$1[pluginKey];
var currentScope$1;
var getCurrentScope$1 = () => currentScope$1;
var createScope$1 = (parent_, immer_) => ({
  drafts_: [],
  parent_,
  immer_,
  // Whenever the modified draft contains a draft from another scope, we
  // need to prevent auto-freezing so the unowned draft can be finalized.
  canAutoFreeze_: true,
  unfinalizedDrafts_: 0,
  handledSet_: /* @__PURE__ */ new Set(),
  processedForPatches_: /* @__PURE__ */ new Set(),
  mapSetPlugin_: isPluginLoaded(PluginMapSet) ? getPlugin$1(PluginMapSet) : void 0,
  arrayMethodsPlugin_: isPluginLoaded(PluginArrayMethods) ? getPlugin$1(PluginArrayMethods) : void 0
});
function usePatchesInScope$1(scope, patchListener) {
  if (patchListener) {
    scope.patchPlugin_ = getPlugin$1(PluginPatches);
    scope.patches_ = [];
    scope.inversePatches_ = [];
    scope.patchListener_ = patchListener;
  }
}
function revokeScope$1(scope) {
  leaveScope$1(scope);
  scope.drafts_.forEach(revokeDraft$1);
  scope.drafts_ = null;
}
function leaveScope$1(scope) {
  if (scope === currentScope$1) {
    currentScope$1 = scope.parent_;
  }
}
var enterScope$1 = (immer2) => currentScope$1 = createScope$1(currentScope$1, immer2);
function revokeDraft$1(draft) {
  const state = draft[DRAFT_STATE$1];
  if (state.type_ === 0 || state.type_ === 1)
    state.revoke_();
  else
    state.revoked_ = true;
}
function processResult$1(result, scope) {
  scope.unfinalizedDrafts_ = scope.drafts_.length;
  const baseDraft = scope.drafts_[0];
  const isReplaced = result !== void 0 && result !== baseDraft;
  if (isReplaced) {
    if (baseDraft[DRAFT_STATE$1].modified_) {
      revokeScope$1(scope);
      die$1(4);
    }
    if (isDraftable$1(result)) {
      result = finalize$1(scope, result);
    }
    const { patchPlugin_ } = scope;
    if (patchPlugin_) {
      patchPlugin_.generateReplacementPatches_(
        baseDraft[DRAFT_STATE$1].base_,
        result,
        scope
      );
    }
  } else {
    result = finalize$1(scope, baseDraft);
  }
  maybeFreeze$1(scope, result, true);
  revokeScope$1(scope);
  if (scope.patches_) {
    scope.patchListener_(scope.patches_, scope.inversePatches_);
  }
  return result !== NOTHING$1 ? result : void 0;
}
function finalize$1(rootScope, value) {
  if (isFrozen$1(value))
    return value;
  const state = value[DRAFT_STATE$1];
  if (!state) {
    const finalValue = handleValue(value, rootScope.handledSet_, rootScope);
    return finalValue;
  }
  if (!isSameScope(state, rootScope)) {
    return value;
  }
  if (!state.modified_) {
    return state.base_;
  }
  if (!state.finalized_) {
    const { callbacks_ } = state;
    if (callbacks_) {
      while (callbacks_.length > 0) {
        const callback = callbacks_.pop();
        callback(rootScope);
      }
    }
    generatePatchesAndFinalize(state, rootScope);
  }
  return state.copy_;
}
function maybeFreeze$1(scope, value, deep = false) {
  if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
    freeze$1(value, deep);
  }
}
function markStateFinalized(state) {
  state.finalized_ = true;
  state.scope_.unfinalizedDrafts_--;
}
var isSameScope = (state, rootScope) => state.scope_ === rootScope;
var EMPTY_LOCATIONS_RESULT = [];
function updateDraftInParent(parent, draftValue, finalizedValue, originalKey) {
  const parentCopy = latest$1(parent);
  const parentType = parent.type_;
  if (originalKey !== void 0) {
    const currentValue = get(parentCopy, originalKey, parentType);
    if (currentValue === draftValue) {
      set$1(parentCopy, originalKey, finalizedValue, parentType);
      return;
    }
  }
  if (!parent.draftLocations_) {
    const draftLocations = parent.draftLocations_ = /* @__PURE__ */ new Map();
    each$1(parentCopy, (key, value) => {
      if (isDraft$1(value)) {
        const keys = draftLocations.get(value) || [];
        keys.push(key);
        draftLocations.set(value, keys);
      }
    });
  }
  const locations = parent.draftLocations_.get(draftValue) ?? EMPTY_LOCATIONS_RESULT;
  for (const location of locations) {
    set$1(parentCopy, location, finalizedValue, parentType);
  }
}
function registerChildFinalizationCallback(parent, child, key) {
  parent.callbacks_.push(function childCleanup(rootScope) {
    const state = child;
    if (!state || !isSameScope(state, rootScope)) {
      return;
    }
    rootScope.mapSetPlugin_?.fixSetContents(state);
    const finalizedValue = getFinalValue(state);
    updateDraftInParent(parent, state.draft_ ?? state, finalizedValue, key);
    generatePatchesAndFinalize(state, rootScope);
  });
}
function generatePatchesAndFinalize(state, rootScope) {
  const shouldFinalize = state.modified_ && !state.finalized_ && (state.type_ === 3 || state.type_ === 1 && state.allIndicesReassigned_ || (state.assigned_?.size ?? 0) > 0);
  if (shouldFinalize) {
    const { patchPlugin_ } = rootScope;
    if (patchPlugin_) {
      const basePath = patchPlugin_.getPath(state);
      if (basePath) {
        patchPlugin_.generatePatches_(state, basePath, rootScope);
      }
    }
    markStateFinalized(state);
  }
}
function handleCrossReference(target, key, value) {
  const { scope_ } = target;
  if (isDraft$1(value)) {
    const state = value[DRAFT_STATE$1];
    if (isSameScope(state, scope_)) {
      state.callbacks_.push(function crossReferenceCleanup() {
        prepareCopy$1(target);
        const finalizedValue = getFinalValue(state);
        updateDraftInParent(target, value, finalizedValue, key);
      });
    }
  } else if (isDraftable$1(value)) {
    target.callbacks_.push(function nestedDraftCleanup() {
      const targetCopy = latest$1(target);
      if (target.type_ === 3) {
        if (targetCopy.has(value)) {
          handleValue(value, scope_.handledSet_, scope_);
        }
      } else {
        if (get(targetCopy, key, target.type_) === value) {
          if (scope_.drafts_.length > 1 && (target.assigned_.get(key) ?? false) === true && target.copy_) {
            handleValue(
              get(target.copy_, key, target.type_),
              scope_.handledSet_,
              scope_
            );
          }
        }
      }
    });
  }
}
function handleValue(target, handledSet, rootScope) {
  if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
    return target;
  }
  if (isDraft$1(target) || handledSet.has(target) || !isDraftable$1(target) || isFrozen$1(target)) {
    return target;
  }
  handledSet.add(target);
  each$1(target, (key, value) => {
    if (isDraft$1(value)) {
      const state = value[DRAFT_STATE$1];
      if (isSameScope(state, rootScope)) {
        const updatedValue = getFinalValue(state);
        set$1(target, key, updatedValue, target.type_);
        markStateFinalized(state);
      }
    } else if (isDraftable$1(value)) {
      handleValue(value, handledSet, rootScope);
    }
  });
  return target;
}
function createProxyProxy$1(base, parent) {
  const baseIsArray = isArray(base);
  const state = {
    type_: baseIsArray ? 1 : 0,
    // Track which produce call this is associated with.
    scope_: parent ? parent.scope_ : getCurrentScope$1(),
    // True for both shallow and deep changes.
    modified_: false,
    // Used during finalization.
    finalized_: false,
    // Track which properties have been assigned (true) or deleted (false).
    // actually instantiated in `prepareCopy()`
    assigned_: void 0,
    // The parent draft state.
    parent_: parent,
    // The base state.
    base_: base,
    // The base proxy.
    draft_: null,
    // set below
    // The base copy with any updated values.
    copy_: null,
    // Called by the `produce` function.
    revoke_: null,
    isManual_: false,
    // `callbacks` actually gets assigned in `createProxy`
    callbacks_: void 0
  };
  let target = state;
  let traps = objectTraps$1;
  if (baseIsArray) {
    target = [state];
    traps = arrayTraps$1;
  }
  const { revoke, proxy } = Proxy.revocable(target, traps);
  state.draft_ = proxy;
  state.revoke_ = revoke;
  return [proxy, state];
}
var objectTraps$1 = {
  get(state, prop) {
    if (prop === DRAFT_STATE$1)
      return state;
    let arrayPlugin = state.scope_.arrayMethodsPlugin_;
    const isArrayWithStringProp = state.type_ === 1 && typeof prop === "string";
    if (isArrayWithStringProp) {
      if (arrayPlugin?.isArrayOperationMethod(prop)) {
        return arrayPlugin.createMethodInterceptor(state, prop);
      }
    }
    const source = latest$1(state);
    if (!has$1(source, prop, state.type_)) {
      return readPropFromProto$1(state, source, prop);
    }
    const value = source[prop];
    if (state.finalized_ || !isDraftable$1(value)) {
      return value;
    }
    if (isArrayWithStringProp && state.operationMethod && arrayPlugin?.isMutatingArrayMethod(
      state.operationMethod
    ) && isArrayIndex(prop)) {
      return value;
    }
    if (value === peek$1(state.base_, prop)) {
      prepareCopy$1(state);
      const childKey = state.type_ === 1 ? +prop : prop;
      const childDraft = createProxy$1(state.scope_, value, state, childKey);
      return state.copy_[childKey] = childDraft;
    }
    return value;
  },
  has(state, prop) {
    return prop in latest$1(state);
  },
  ownKeys(state) {
    return Reflect.ownKeys(latest$1(state));
  },
  set(state, prop, value) {
    const desc = getDescriptorFromProto$1(latest$1(state), prop);
    if (desc?.set) {
      desc.set.call(state.draft_, value);
      return true;
    }
    if (!state.modified_) {
      const current2 = peek$1(latest$1(state), prop);
      const currentState = current2?.[DRAFT_STATE$1];
      if (currentState && currentState.base_ === value) {
        state.copy_[prop] = value;
        state.assigned_.set(prop, false);
        return true;
      }
      if (is$1(value, current2) && (value !== void 0 || has$1(state.base_, prop, state.type_)))
        return true;
      prepareCopy$1(state);
      markChanged$1(state);
    }
    if (state.copy_[prop] === value && // special case: handle new props with value 'undefined'
    (value !== void 0 || prop in state.copy_) || // special case: NaN
    Number.isNaN(value) && Number.isNaN(state.copy_[prop]))
      return true;
    state.copy_[prop] = value;
    state.assigned_.set(prop, true);
    handleCrossReference(state, prop, value);
    return true;
  },
  deleteProperty(state, prop) {
    prepareCopy$1(state);
    if (peek$1(state.base_, prop) !== void 0 || prop in state.base_) {
      state.assigned_.set(prop, false);
      markChanged$1(state);
    } else {
      state.assigned_.delete(prop);
    }
    if (state.copy_) {
      delete state.copy_[prop];
    }
    return true;
  },
  // Note: We never coerce `desc.value` into an Immer draft, because we can't make
  // the same guarantee in ES5 mode.
  getOwnPropertyDescriptor(state, prop) {
    const owner = latest$1(state);
    const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
    if (!desc)
      return desc;
    return {
      [WRITABLE]: true,
      [CONFIGURABLE]: state.type_ !== 1 || prop !== "length",
      [ENUMERABLE]: desc[ENUMERABLE],
      [VALUE]: owner[prop]
    };
  },
  defineProperty() {
    die$1(11);
  },
  getPrototypeOf(state) {
    return getPrototypeOf$1(state.base_);
  },
  setPrototypeOf() {
    die$1(12);
  }
};
var arrayTraps$1 = {};
for (let key in objectTraps$1) {
  let fn = objectTraps$1[key];
  arrayTraps$1[key] = function() {
    const args = arguments;
    args[0] = args[0][0];
    return fn.apply(this, args);
  };
}
arrayTraps$1.deleteProperty = function(state, prop) {
  return arrayTraps$1.set.call(this, state, prop, void 0);
};
arrayTraps$1.set = function(state, prop, value) {
  return objectTraps$1.set.call(this, state[0], prop, value, state[0]);
};
function peek$1(draft, prop) {
  const state = draft[DRAFT_STATE$1];
  const source = state ? latest$1(state) : draft;
  return source[prop];
}
function readPropFromProto$1(state, source, prop) {
  const desc = getDescriptorFromProto$1(source, prop);
  return desc ? VALUE in desc ? desc[VALUE] : (
    // This is a very special case, if the prop is a getter defined by the
    // prototype, we should invoke it with the draft as context!
    desc.get?.call(state.draft_)
  ) : void 0;
}
function getDescriptorFromProto$1(source, prop) {
  if (!(prop in source))
    return void 0;
  let proto = getPrototypeOf$1(source);
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc)
      return desc;
    proto = getPrototypeOf$1(proto);
  }
  return void 0;
}
function markChanged$1(state) {
  if (!state.modified_) {
    state.modified_ = true;
    if (state.parent_) {
      markChanged$1(state.parent_);
    }
  }
}
function prepareCopy$1(state) {
  if (!state.copy_) {
    state.assigned_ = /* @__PURE__ */ new Map();
    state.copy_ = shallowCopy$1(
      state.base_,
      state.scope_.immer_.useStrictShallowCopy_
    );
  }
}
var Immer2$1 = class Immer23 {
  constructor(config) {
    this.autoFreeze_ = true;
    this.useStrictShallowCopy_ = false;
    this.useStrictIteration_ = false;
    this.produce = (base, recipe, patchListener) => {
      if (isFunction(base) && !isFunction(recipe)) {
        const defaultBase = recipe;
        recipe = base;
        const self = this;
        return function curriedProduce(base2 = defaultBase, ...args) {
          return self.produce(base2, (draft) => recipe.call(this, draft, ...args));
        };
      }
      if (!isFunction(recipe))
        die$1(6);
      if (patchListener !== void 0 && !isFunction(patchListener))
        die$1(7);
      let result;
      if (isDraftable$1(base)) {
        const scope = enterScope$1(this);
        const proxy = createProxy$1(scope, base, void 0);
        let hasError = true;
        try {
          result = recipe(proxy);
          hasError = false;
        } finally {
          if (hasError)
            revokeScope$1(scope);
          else
            leaveScope$1(scope);
        }
        usePatchesInScope$1(scope, patchListener);
        return processResult$1(result, scope);
      } else if (!base || !isObjectish(base)) {
        result = recipe(base);
        if (result === void 0)
          result = base;
        if (result === NOTHING$1)
          result = void 0;
        if (this.autoFreeze_)
          freeze$1(result, true);
        if (patchListener) {
          const p = [];
          const ip = [];
          getPlugin$1(PluginPatches).generateReplacementPatches_(base, result, {
            patches_: p,
            inversePatches_: ip
          });
          patchListener(p, ip);
        }
        return result;
      } else
        die$1(1, base);
    };
    this.produceWithPatches = (base, recipe) => {
      if (isFunction(base)) {
        return (state, ...args) => this.produceWithPatches(state, (draft) => base(draft, ...args));
      }
      let patches, inversePatches;
      const result = this.produce(base, recipe, (p, ip) => {
        patches = p;
        inversePatches = ip;
      });
      return [result, patches, inversePatches];
    };
    if (isBoolean(config?.autoFreeze))
      this.setAutoFreeze(config.autoFreeze);
    if (isBoolean(config?.useStrictShallowCopy))
      this.setUseStrictShallowCopy(config.useStrictShallowCopy);
    if (isBoolean(config?.useStrictIteration))
      this.setUseStrictIteration(config.useStrictIteration);
  }
  createDraft(base) {
    if (!isDraftable$1(base))
      die$1(8);
    if (isDraft$1(base))
      base = current$1(base);
    const scope = enterScope$1(this);
    const proxy = createProxy$1(scope, base, void 0);
    proxy[DRAFT_STATE$1].isManual_ = true;
    leaveScope$1(scope);
    return proxy;
  }
  finishDraft(draft, patchListener) {
    const state = draft && draft[DRAFT_STATE$1];
    if (!state || !state.isManual_)
      die$1(9);
    const { scope_: scope } = state;
    usePatchesInScope$1(scope, patchListener);
    return processResult$1(void 0, scope);
  }
  /**
   * Pass true to automatically freeze all copies created by Immer.
   *
   * By default, auto-freezing is enabled.
   */
  setAutoFreeze(value) {
    this.autoFreeze_ = value;
  }
  /**
   * Pass true to enable strict shallow copy.
   *
   * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
   */
  setUseStrictShallowCopy(value) {
    this.useStrictShallowCopy_ = value;
  }
  /**
   * Pass false to use faster iteration that skips non-enumerable properties
   * but still handles symbols for compatibility.
   *
   * By default, strict iteration is enabled (includes all own properties).
   */
  setUseStrictIteration(value) {
    this.useStrictIteration_ = value;
  }
  shouldUseStrictIteration() {
    return this.useStrictIteration_;
  }
  applyPatches(base, patches) {
    let i;
    for (i = patches.length - 1; i >= 0; i--) {
      const patch = patches[i];
      if (patch.path.length === 0 && patch.op === "replace") {
        base = patch.value;
        break;
      }
    }
    if (i > -1) {
      patches = patches.slice(i + 1);
    }
    const applyPatchesImpl = getPlugin$1(PluginPatches).applyPatches_;
    if (isDraft$1(base)) {
      return applyPatchesImpl(base, patches);
    }
    return this.produce(
      base,
      (draft) => applyPatchesImpl(draft, patches)
    );
  }
};
function createProxy$1(rootScope, value, parent, key) {
  const [draft, state] = isMap$1(value) ? getPlugin$1(PluginMapSet).proxyMap_(value, parent) : isSet$1(value) ? getPlugin$1(PluginMapSet).proxySet_(value, parent) : createProxyProxy$1(value, parent);
  const scope = parent?.scope_ ?? getCurrentScope$1();
  scope.drafts_.push(draft);
  state.callbacks_ = parent?.callbacks_ ?? [];
  state.key_ = key;
  if (parent && key !== void 0) {
    registerChildFinalizationCallback(parent, state, key);
  } else {
    state.callbacks_.push(function rootDraftCleanup(rootScope2) {
      rootScope2.mapSetPlugin_?.fixSetContents(state);
      const { patchPlugin_ } = rootScope2;
      if (state.modified_ && patchPlugin_) {
        patchPlugin_.generatePatches_(state, [], rootScope2);
      }
    });
  }
  return draft;
}
function current$1(value) {
  if (!isDraft$1(value))
    die$1(10, value);
  return currentImpl$1(value);
}
function currentImpl$1(value) {
  if (!isDraftable$1(value) || isFrozen$1(value))
    return value;
  const state = value[DRAFT_STATE$1];
  let copy;
  let strict = true;
  if (state) {
    if (!state.modified_)
      return state.base_;
    state.finalized_ = true;
    copy = shallowCopy$1(value, state.scope_.immer_.useStrictShallowCopy_);
    strict = state.scope_.immer_.shouldUseStrictIteration();
  } else {
    copy = shallowCopy$1(value, true);
  }
  each$1(
    copy,
    (key, childValue) => {
      set$1(copy, key, currentImpl$1(childValue));
    },
    strict
  );
  if (state) {
    state.finalized_ = false;
  }
  return copy;
}
var immer$1 = new Immer2$1();
var produce = immer$1.produce;
var NOTHING = /* @__PURE__ */ Symbol.for("immer-nothing");
var DRAFTABLE = /* @__PURE__ */ Symbol.for("immer-draftable");
var DRAFT_STATE = /* @__PURE__ */ Symbol.for("immer-state");
function die(error, ...args) {
  throw new Error(
    `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
  );
}
var getPrototypeOf = Object.getPrototypeOf;
function isDraft(value) {
  return !!value && !!value[DRAFT_STATE];
}
function isDraftable(value) {
  if (!value)
    return false;
  return isPlainObject(value) || Array.isArray(value) || !!value[DRAFTABLE] || !!value.constructor?.[DRAFTABLE] || isMap(value) || isSet(value);
}
var objectCtorString = Object.prototype.constructor.toString();
var cachedCtorStrings = /* @__PURE__ */ new WeakMap();
function isPlainObject(value) {
  if (!value || typeof value !== "object")
    return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null || proto === Object.prototype)
    return true;
  const Ctor = Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;
  if (Ctor === Object)
    return true;
  if (typeof Ctor !== "function")
    return false;
  let ctorString = cachedCtorStrings.get(Ctor);
  if (ctorString === void 0) {
    ctorString = Function.toString.call(Ctor);
    cachedCtorStrings.set(Ctor, ctorString);
  }
  return ctorString === objectCtorString;
}
function each(obj, iter, strict = true) {
  if (getArchtype(obj) === 0) {
    const keys = strict ? Reflect.ownKeys(obj) : Object.keys(obj);
    keys.forEach((key) => {
      iter(key, obj[key], obj);
    });
  } else {
    obj.forEach((entry, index) => iter(index, entry, obj));
  }
}
function getArchtype(thing) {
  const state = thing[DRAFT_STATE];
  return state ? state.type_ : Array.isArray(thing) ? 1 : isMap(thing) ? 2 : isSet(thing) ? 3 : 0;
}
function has(thing, prop) {
  return getArchtype(thing) === 2 ? thing.has(prop) : Object.prototype.hasOwnProperty.call(thing, prop);
}
function set(thing, propOrOldValue, value) {
  const t = getArchtype(thing);
  if (t === 2)
    thing.set(propOrOldValue, value);
  else if (t === 3) {
    thing.add(value);
  } else
    thing[propOrOldValue] = value;
}
function is(x, y) {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}
function isMap(target) {
  return target instanceof Map;
}
function isSet(target) {
  return target instanceof Set;
}
function latest(state) {
  return state.copy_ || state.base_;
}
function shallowCopy(base, strict) {
  if (isMap(base)) {
    return new Map(base);
  }
  if (isSet(base)) {
    return new Set(base);
  }
  if (Array.isArray(base))
    return Array.prototype.slice.call(base);
  const isPlain = isPlainObject(base);
  if (strict === true || strict === "class_only" && !isPlain) {
    const descriptors = Object.getOwnPropertyDescriptors(base);
    delete descriptors[DRAFT_STATE];
    let keys = Reflect.ownKeys(descriptors);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const desc = descriptors[key];
      if (desc.writable === false) {
        desc.writable = true;
        desc.configurable = true;
      }
      if (desc.get || desc.set)
        descriptors[key] = {
          configurable: true,
          writable: true,
          // could live with !!desc.set as well here...
          enumerable: desc.enumerable,
          value: base[key]
        };
    }
    return Object.create(getPrototypeOf(base), descriptors);
  } else {
    const proto = getPrototypeOf(base);
    if (proto !== null && isPlain) {
      return { ...base };
    }
    const obj = Object.create(proto);
    return Object.assign(obj, base);
  }
}
function freeze(obj, deep = false) {
  if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj))
    return obj;
  if (getArchtype(obj) > 1) {
    Object.defineProperties(obj, {
      set: dontMutateMethodOverride,
      add: dontMutateMethodOverride,
      clear: dontMutateMethodOverride,
      delete: dontMutateMethodOverride
    });
  }
  Object.freeze(obj);
  if (deep)
    Object.values(obj).forEach((value) => freeze(value, true));
  return obj;
}
function dontMutateFrozenCollections() {
  die(2);
}
var dontMutateMethodOverride = {
  value: dontMutateFrozenCollections
};
function isFrozen(obj) {
  if (obj === null || typeof obj !== "object")
    return true;
  return Object.isFrozen(obj);
}
var plugins = {};
function getPlugin(pluginKey) {
  const plugin = plugins[pluginKey];
  if (!plugin) {
    die(0, pluginKey);
  }
  return plugin;
}
var currentScope;
function getCurrentScope() {
  return currentScope;
}
function createScope(parent_, immer_) {
  return {
    drafts_: [],
    parent_,
    immer_,
    // Whenever the modified draft contains a draft from another scope, we
    // need to prevent auto-freezing so the unowned draft can be finalized.
    canAutoFreeze_: true,
    unfinalizedDrafts_: 0
  };
}
function usePatchesInScope(scope, patchListener) {
  if (patchListener) {
    getPlugin("Patches");
    scope.patches_ = [];
    scope.inversePatches_ = [];
    scope.patchListener_ = patchListener;
  }
}
function revokeScope(scope) {
  leaveScope(scope);
  scope.drafts_.forEach(revokeDraft);
  scope.drafts_ = null;
}
function leaveScope(scope) {
  if (scope === currentScope) {
    currentScope = scope.parent_;
  }
}
function enterScope(immer2) {
  return currentScope = createScope(currentScope, immer2);
}
function revokeDraft(draft) {
  const state = draft[DRAFT_STATE];
  if (state.type_ === 0 || state.type_ === 1)
    state.revoke_();
  else
    state.revoked_ = true;
}
function processResult(result, scope) {
  scope.unfinalizedDrafts_ = scope.drafts_.length;
  const baseDraft = scope.drafts_[0];
  const isReplaced = result !== void 0 && result !== baseDraft;
  if (isReplaced) {
    if (baseDraft[DRAFT_STATE].modified_) {
      revokeScope(scope);
      die(4);
    }
    if (isDraftable(result)) {
      result = finalize(scope, result);
      if (!scope.parent_)
        maybeFreeze(scope, result);
    }
    if (scope.patches_) {
      getPlugin("Patches").generateReplacementPatches_(
        baseDraft[DRAFT_STATE].base_,
        result,
        scope.patches_,
        scope.inversePatches_
      );
    }
  } else {
    result = finalize(scope, baseDraft, []);
  }
  revokeScope(scope);
  if (scope.patches_) {
    scope.patchListener_(scope.patches_, scope.inversePatches_);
  }
  return result !== NOTHING ? result : void 0;
}
function finalize(rootScope, value, path) {
  if (isFrozen(value))
    return value;
  const useStrictIteration = rootScope.immer_.shouldUseStrictIteration();
  const state = value[DRAFT_STATE];
  if (!state) {
    each(
      value,
      (key, childValue) => finalizeProperty(rootScope, state, value, key, childValue, path),
      useStrictIteration
    );
    return value;
  }
  if (state.scope_ !== rootScope)
    return value;
  if (!state.modified_) {
    maybeFreeze(rootScope, state.base_, true);
    return state.base_;
  }
  if (!state.finalized_) {
    state.finalized_ = true;
    state.scope_.unfinalizedDrafts_--;
    const result = state.copy_;
    let resultEach = result;
    let isSet2 = false;
    if (state.type_ === 3) {
      resultEach = new Set(result);
      result.clear();
      isSet2 = true;
    }
    each(
      resultEach,
      (key, childValue) => finalizeProperty(
        rootScope,
        state,
        result,
        key,
        childValue,
        path,
        isSet2
      ),
      useStrictIteration
    );
    maybeFreeze(rootScope, result, false);
    if (path && rootScope.patches_) {
      getPlugin("Patches").generatePatches_(
        state,
        path,
        rootScope.patches_,
        rootScope.inversePatches_
      );
    }
  }
  return state.copy_;
}
function finalizeProperty(rootScope, parentState, targetObject, prop, childValue, rootPath, targetIsSet) {
  if (childValue == null) {
    return;
  }
  if (typeof childValue !== "object" && !targetIsSet) {
    return;
  }
  const childIsFrozen = isFrozen(childValue);
  if (childIsFrozen && !targetIsSet) {
    return;
  }
  if (isDraft(childValue)) {
    const path = rootPath && parentState && parentState.type_ !== 3 && // Set objects are atomic since they have no keys.
    !has(parentState.assigned_, prop) ? rootPath.concat(prop) : void 0;
    const res = finalize(rootScope, childValue, path);
    set(targetObject, prop, res);
    if (isDraft(res)) {
      rootScope.canAutoFreeze_ = false;
    } else
      return;
  } else if (targetIsSet) {
    targetObject.add(childValue);
  }
  if (isDraftable(childValue) && !childIsFrozen) {
    if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
      return;
    }
    if (parentState && parentState.base_ && parentState.base_[prop] === childValue && childIsFrozen) {
      return;
    }
    finalize(rootScope, childValue);
    if ((!parentState || !parentState.scope_.parent_) && typeof prop !== "symbol" && (isMap(targetObject) ? targetObject.has(prop) : Object.prototype.propertyIsEnumerable.call(targetObject, prop)))
      maybeFreeze(rootScope, childValue);
  }
}
function maybeFreeze(scope, value, deep = false) {
  if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
    freeze(value, deep);
  }
}
function createProxyProxy(base, parent) {
  const isArray2 = Array.isArray(base);
  const state = {
    type_: isArray2 ? 1 : 0,
    // Track which produce call this is associated with.
    scope_: parent ? parent.scope_ : getCurrentScope(),
    // True for both shallow and deep changes.
    modified_: false,
    // Used during finalization.
    finalized_: false,
    // Track which properties have been assigned (true) or deleted (false).
    assigned_: {},
    // The parent draft state.
    parent_: parent,
    // The base state.
    base_: base,
    // The base proxy.
    draft_: null,
    // set below
    // The base copy with any updated values.
    copy_: null,
    // Called by the `produce` function.
    revoke_: null,
    isManual_: false
  };
  let target = state;
  let traps = objectTraps;
  if (isArray2) {
    target = [state];
    traps = arrayTraps;
  }
  const { revoke, proxy } = Proxy.revocable(target, traps);
  state.draft_ = proxy;
  state.revoke_ = revoke;
  return proxy;
}
var objectTraps = {
  get(state, prop) {
    if (prop === DRAFT_STATE)
      return state;
    const source = latest(state);
    if (!has(source, prop)) {
      return readPropFromProto(state, source, prop);
    }
    const value = source[prop];
    if (state.finalized_ || !isDraftable(value)) {
      return value;
    }
    if (value === peek(state.base_, prop)) {
      prepareCopy(state);
      return state.copy_[prop] = createProxy(value, state);
    }
    return value;
  },
  has(state, prop) {
    return prop in latest(state);
  },
  ownKeys(state) {
    return Reflect.ownKeys(latest(state));
  },
  set(state, prop, value) {
    const desc = getDescriptorFromProto(latest(state), prop);
    if (desc?.set) {
      desc.set.call(state.draft_, value);
      return true;
    }
    if (!state.modified_) {
      const current2 = peek(latest(state), prop);
      const currentState = current2?.[DRAFT_STATE];
      if (currentState && currentState.base_ === value) {
        state.copy_[prop] = value;
        state.assigned_[prop] = false;
        return true;
      }
      if (is(value, current2) && (value !== void 0 || has(state.base_, prop)))
        return true;
      prepareCopy(state);
      markChanged(state);
    }
    if (state.copy_[prop] === value && // special case: handle new props with value 'undefined'
    (value !== void 0 || prop in state.copy_) || // special case: NaN
    Number.isNaN(value) && Number.isNaN(state.copy_[prop]))
      return true;
    state.copy_[prop] = value;
    state.assigned_[prop] = true;
    return true;
  },
  deleteProperty(state, prop) {
    if (peek(state.base_, prop) !== void 0 || prop in state.base_) {
      state.assigned_[prop] = false;
      prepareCopy(state);
      markChanged(state);
    } else {
      delete state.assigned_[prop];
    }
    if (state.copy_) {
      delete state.copy_[prop];
    }
    return true;
  },
  // Note: We never coerce `desc.value` into an Immer draft, because we can't make
  // the same guarantee in ES5 mode.
  getOwnPropertyDescriptor(state, prop) {
    const owner = latest(state);
    const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
    if (!desc)
      return desc;
    return {
      writable: true,
      configurable: state.type_ !== 1 || prop !== "length",
      enumerable: desc.enumerable,
      value: owner[prop]
    };
  },
  defineProperty() {
    die(11);
  },
  getPrototypeOf(state) {
    return getPrototypeOf(state.base_);
  },
  setPrototypeOf() {
    die(12);
  }
};
var arrayTraps = {};
each(objectTraps, (key, fn) => {
  arrayTraps[key] = function() {
    arguments[0] = arguments[0][0];
    return fn.apply(this, arguments);
  };
});
arrayTraps.deleteProperty = function(state, prop) {
  return arrayTraps.set.call(this, state, prop, void 0);
};
arrayTraps.set = function(state, prop, value) {
  return objectTraps.set.call(this, state[0], prop, value, state[0]);
};
function peek(draft, prop) {
  const state = draft[DRAFT_STATE];
  const source = state ? latest(state) : draft;
  return source[prop];
}
function readPropFromProto(state, source, prop) {
  const desc = getDescriptorFromProto(source, prop);
  return desc ? `value` in desc ? desc.value : (
    // This is a very special case, if the prop is a getter defined by the
    // prototype, we should invoke it with the draft as context!
    desc.get?.call(state.draft_)
  ) : void 0;
}
function getDescriptorFromProto(source, prop) {
  if (!(prop in source))
    return void 0;
  let proto = getPrototypeOf(source);
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc)
      return desc;
    proto = getPrototypeOf(proto);
  }
  return void 0;
}
function markChanged(state) {
  if (!state.modified_) {
    state.modified_ = true;
    if (state.parent_) {
      markChanged(state.parent_);
    }
  }
}
function prepareCopy(state) {
  if (!state.copy_) {
    state.copy_ = shallowCopy(
      state.base_,
      state.scope_.immer_.useStrictShallowCopy_
    );
  }
}
var Immer24 = class {
  constructor(config) {
    this.autoFreeze_ = true;
    this.useStrictShallowCopy_ = false;
    this.useStrictIteration_ = true;
    this.produce = (base, recipe, patchListener) => {
      if (typeof base === "function" && typeof recipe !== "function") {
        const defaultBase = recipe;
        recipe = base;
        const self = this;
        return function curriedProduce(base2 = defaultBase, ...args) {
          return self.produce(base2, (draft) => recipe.call(this, draft, ...args));
        };
      }
      if (typeof recipe !== "function")
        die(6);
      if (patchListener !== void 0 && typeof patchListener !== "function")
        die(7);
      let result;
      if (isDraftable(base)) {
        const scope = enterScope(this);
        const proxy = createProxy(base, void 0);
        let hasError = true;
        try {
          result = recipe(proxy);
          hasError = false;
        } finally {
          if (hasError)
            revokeScope(scope);
          else
            leaveScope(scope);
        }
        usePatchesInScope(scope, patchListener);
        return processResult(result, scope);
      } else if (!base || typeof base !== "object") {
        result = recipe(base);
        if (result === void 0)
          result = base;
        if (result === NOTHING)
          result = void 0;
        if (this.autoFreeze_)
          freeze(result, true);
        if (patchListener) {
          const p = [];
          const ip = [];
          getPlugin("Patches").generateReplacementPatches_(base, result, p, ip);
          patchListener(p, ip);
        }
        return result;
      } else
        die(1, base);
    };
    this.produceWithPatches = (base, recipe) => {
      if (typeof base === "function") {
        return (state, ...args) => this.produceWithPatches(state, (draft) => base(draft, ...args));
      }
      let patches, inversePatches;
      const result = this.produce(base, recipe, (p, ip) => {
        patches = p;
        inversePatches = ip;
      });
      return [result, patches, inversePatches];
    };
    if (typeof config?.autoFreeze === "boolean")
      this.setAutoFreeze(config.autoFreeze);
    if (typeof config?.useStrictShallowCopy === "boolean")
      this.setUseStrictShallowCopy(config.useStrictShallowCopy);
    if (typeof config?.useStrictIteration === "boolean")
      this.setUseStrictIteration(config.useStrictIteration);
  }
  createDraft(base) {
    if (!isDraftable(base))
      die(8);
    if (isDraft(base))
      base = current(base);
    const scope = enterScope(this);
    const proxy = createProxy(base, void 0);
    proxy[DRAFT_STATE].isManual_ = true;
    leaveScope(scope);
    return proxy;
  }
  finishDraft(draft, patchListener) {
    const state = draft && draft[DRAFT_STATE];
    if (!state || !state.isManual_)
      die(9);
    const { scope_: scope } = state;
    usePatchesInScope(scope, patchListener);
    return processResult(void 0, scope);
  }
  /**
   * Pass true to automatically freeze all copies created by Immer.
   *
   * By default, auto-freezing is enabled.
   */
  setAutoFreeze(value) {
    this.autoFreeze_ = value;
  }
  /**
   * Pass true to enable strict shallow copy.
   *
   * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
   */
  setUseStrictShallowCopy(value) {
    this.useStrictShallowCopy_ = value;
  }
  /**
   * Pass false to use faster iteration that skips non-enumerable properties
   * but still handles symbols for compatibility.
   *
   * By default, strict iteration is enabled (includes all own properties).
   */
  setUseStrictIteration(value) {
    this.useStrictIteration_ = value;
  }
  shouldUseStrictIteration() {
    return this.useStrictIteration_;
  }
  applyPatches(base, patches) {
    let i;
    for (i = patches.length - 1; i >= 0; i--) {
      const patch = patches[i];
      if (patch.path.length === 0 && patch.op === "replace") {
        base = patch.value;
        break;
      }
    }
    if (i > -1) {
      patches = patches.slice(i + 1);
    }
    const applyPatchesImpl = getPlugin("Patches").applyPatches_;
    if (isDraft(base)) {
      return applyPatchesImpl(base, patches);
    }
    return this.produce(
      base,
      (draft) => applyPatchesImpl(draft, patches)
    );
  }
};
function createProxy(value, parent) {
  const draft = isMap(value) ? getPlugin("MapSet").proxyMap_(value, parent) : isSet(value) ? getPlugin("MapSet").proxySet_(value, parent) : createProxyProxy(value, parent);
  const scope = parent ? parent.scope_ : getCurrentScope();
  scope.drafts_.push(draft);
  return draft;
}
function current(value) {
  if (!isDraft(value))
    die(10, value);
  return currentImpl(value);
}
function currentImpl(value) {
  if (!isDraftable(value) || isFrozen(value))
    return value;
  const state = value[DRAFT_STATE];
  let copy;
  let strict = true;
  if (state) {
    if (!state.modified_)
      return state.base_;
    state.finalized_ = true;
    copy = shallowCopy(value, state.scope_.immer_.useStrictShallowCopy_);
    strict = state.scope_.immer_.shouldUseStrictIteration();
  } else {
    copy = shallowCopy(value, true);
  }
  each(
    copy,
    (key, childValue) => {
      set(copy, key, currentImpl(childValue));
    },
    strict
  );
  if (state) {
    state.finalized_ = false;
  }
  return copy;
}
var immer = new Immer24();
immer.produce;
function castDraft(value) {
  return value;
}
export {
  produce$1 as a,
  isDraft$2 as b,
  produce as c,
  current$2 as d,
  castDraft as e,
  isDraftable$2 as i,
  produce$2 as p
};
