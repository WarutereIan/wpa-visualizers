import { r as rootPath, g as generateAccessibleDescription, p as prepareRuleGroup, i as isRuleGroupTypeIC, a as pathIsDisabled, L as LogType, b as add, u as update, f as findPath, c as remove, m as move, d as isRuleGroup, e as group, h as clsx, s as standardClassnames, j as generateID, k as prepareOptionList, l as getFirstOption, n as getValueSourcesUtil, o as getMatchModesUtil, q as filterFieldsByComparator, t as getOption, v as preferFlagProps, w as preferProp, x as mergeClassnames, y as defaultControlClassnames, z as mergeAnyTranslation, A as defaultCombinators, B as defaultCombinatorLabelMap, C as defaultOperators, D as defaultOperatorLabelMap, E as joinWith, F as parseNumber, T as TestID, G as pathsAreEqual, H as isRuleGroupType, I as defaultTranslations, J as toArray, K as isOptionGroupArray, M as getParseNumberMethod, N as getParentPath, O as getValidationClassNames, P as isFlexibleOptionArray, Q as isFlexibleOptionGroupArray, R as toFullOptionList, S as isPojo, U as lc } from "./react-querybuilder__core.mjs";
import { r as reactExports } from "./react.mjs";
import { c as configureStore, a as combineSlices, b as createSlice } from "./reduxjs__toolkit.mjs";
import { c as createSelectorHook, a as createStoreHook, b as createDispatchHook, P as Provider_default } from "./react-redux.mjs";
import { c as produce } from "./immer.mjs";
const ActionElement = (props) => /* @__PURE__ */ reactExports.createElement("button", {
  type: "button",
  "data-testid": props.testID,
  disabled: props.disabled && !props.disabledTranslation,
  className: props.className,
  title: props.disabledTranslation && props.disabled ? props.disabledTranslation.title : props.title,
  onClick: (e) => props.handleOnClick(e)
}, props.disabledTranslation && props.disabled ? props.disabledTranslation.label : props.label);
const DragHandle = reactExports.forwardRef((props, dragRef) => /* @__PURE__ */ reactExports.createElement("span", {
  "data-testid": props.testID,
  ref: dragRef,
  className: props.className,
  title: props.title
}, props.label));
const InlineCombinator = (allProps) => {
  const { component: CombinatorSelectorComponent, ...props } = allProps;
  const className = clsx(props.schema.suppressStandardClassnames || standardClassnames.betweenRules, props.schema.classNames.betweenRules);
  return /* @__PURE__ */ reactExports.createElement("div", {
    className,
    "data-testid": TestID.inlineCombinator
  }, /* @__PURE__ */ reactExports.createElement(CombinatorSelectorComponent, {
    ...props,
    testID: TestID.combinators
  }));
};
const dummyFieldData = {
  name: "",
  value: "",
  label: ""
};
const requiresThreshold = (mm) => [
  "atleast",
  "atmost",
  "exactly"
].includes(lc(mm) ?? "");
const dummyPath = [];
const MatchModeEditor = (props) => {
  const { match, options, title, className, disabled, testID, schema, selectorComponent: SelectorComponent = props.schema.controls.valueSelector, numericEditorComponent: NumericEditorComponent = props.schema.controls.valueEditor } = props;
  const { thresholdNum, thresholdRule, thresholdSchema, handleChangeMode, handleChangeThreshold } = useMatchModeEditor(props);
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement(SelectorComponent, {
    schema,
    testID,
    className,
    title,
    handleOnChange: handleChangeMode,
    disabled,
    value: match.mode,
    options,
    multiple: false,
    listsAsArrays: false,
    path: dummyPath,
    level: 0
  }), requiresThreshold(match.mode) && /* @__PURE__ */ reactExports.createElement(NumericEditorComponent, {
    skipHook: true,
    testID,
    inputType: "number",
    title,
    className,
    disabled,
    handleOnChange: handleChangeThreshold,
    field: "",
    operator: "",
    value: thresholdNum,
    valueSource: "value",
    fieldData: dummyFieldData,
    schema: thresholdSchema,
    path: dummyPath,
    level: 0,
    rule: thresholdRule
  }));
};
const useMatchModeEditor = (props) => {
  const { match, handleOnChange } = props;
  const thresholdNum = reactExports.useMemo(() => typeof match.threshold === "number" ? Math.max(0, match.threshold) : 1, [match.threshold]);
  return {
    thresholdNum,
    thresholdRule: reactExports.useMemo(() => ({
      field: "",
      operator: "=",
      value: thresholdNum
    }), [thresholdNum]),
    thresholdSchema: reactExports.useMemo(() => ({
      ...props.schema,
      parseNumbers: true
    }), [props.schema]),
    handleChangeMode: reactExports.useCallback((mode) => {
      if (requiresThreshold(mode) && typeof match.threshold !== "number") handleOnChange({
        ...match,
        mode,
        threshold: 1
      });
      else handleOnChange({
        ...match,
        mode
      });
    }, [handleOnChange, match]),
    handleChangeThreshold: reactExports.useCallback((threshold) => {
      handleOnChange({
        ...match,
        threshold: parseNumber(threshold, { parseNumbers: true })
      });
    }, [handleOnChange, match])
  };
};
const NotToggle = (props) => {
  const id = reactExports.useId();
  return /* @__PURE__ */ reactExports.createElement("label", {
    "data-testid": props.testID,
    className: props.className,
    title: props.title,
    htmlFor: id
  }, /* @__PURE__ */ reactExports.createElement("input", {
    id,
    type: "checkbox",
    onChange: (e) => props.handleOnChange(e.target.checked),
    checked: !!props.checked,
    disabled: props.disabled
  }), props.label);
};
const messages = {
  errorInvalidIndependentCombinatorsProp: "QueryBuilder was rendered with a truthy independentCombinators prop. This prop is deprecated and unnecessary. Furthermore, the initial query/defaultQuery prop was of type RuleGroupType instead of type RuleGroupIC. More info: https://react-querybuilder.js.org/docs/components/querybuilder#independent-combinators",
  errorUnnecessaryIndependentCombinatorsProp: "QueryBuilder was rendered with the deprecated and unnecessary independentCombinators prop. To use independent combinators, make sure the query/defaultQuery prop is of type RuleGroupIC when the component mounts. More info: https://react-querybuilder.js.org/docs/components/querybuilder#independent-combinators",
  errorDeprecatedRuleGroupProps: "A custom RuleGroup component has rendered a standard RuleGroup component with deprecated props. The combinator, not, and rules props should not be used. Instead, the full group object should be passed as the ruleGroup prop.",
  errorDeprecatedRuleProps: "A custom RuleGroup component has rendered a standard Rule component with deprecated props. The field, operator, value, and valueSource props should not be used. Instead, the full rule object should be passed as the rule prop.",
  errorBothQueryDefaultQuery: "QueryBuilder was rendered with both query and defaultQuery props. QueryBuilder must be either controlled or uncontrolled (specify either the query prop, or the defaultQuery prop, but not both). Decide between using a controlled or uncontrolled query builder and remove one of these props. More info: https://reactjs.org/link/controlled-components",
  errorUncontrolledToControlled: "QueryBuilder is changing from an uncontrolled component to be controlled. This is likely caused by the query changing from undefined to a defined value, which should not happen. Decide between using a controlled or uncontrolled query builder for the lifetime of the component. More info: https://reactjs.org/link/controlled-components",
  errorControlledToUncontrolled: "QueryBuilder is changing from a controlled component to be uncontrolled. This is likely caused by the query changing from defined to undefined, which should not happen. Decide between using a controlled or uncontrolled query builder for the lifetime of the component. More info: https://reactjs.org/link/controlled-components",
  errorEnabledDndWithoutReactDnD: "QueryBuilder was rendered with the enableDragAndDrop prop set to true, but either react-dnd was not detected or one of react-dnd-html5-backend or react-dnd-touch-backend was not detected. To enable drag-and-drop functionality, install react-dnd and one of the backend packages and wrap QueryBuilder in QueryBuilderDnD from @react-querybuilder/dnd.",
  errorDeprecatedDebugImport: `Importing from react-querybuilder/debug is deprecated. To enable Redux DevTools for React Query Builder's internal store, set globalThis.__RQB_DEVTOOLS__ = true.`
};
const initialState$1 = {};
const queriesSlice = createSlice({
  name: "queries",
  initialState: initialState$1,
  reducers: { setQueryState: (state, { payload: { qbId, query } }) => {
    state[qbId] = query;
  } },
  selectors: { getQuerySelectorById: (state, qbId) => state[qbId] }
});
const QueryBuilderStateContext = reactExports.createContext(null);
const initialState = {
  [messages.errorInvalidIndependentCombinatorsProp]: false,
  [messages.errorUnnecessaryIndependentCombinatorsProp]: false,
  [messages.errorDeprecatedRuleGroupProps]: false,
  [messages.errorDeprecatedRuleProps]: false,
  [messages.errorBothQueryDefaultQuery]: false,
  [messages.errorUncontrolledToControlled]: false,
  [messages.errorControlledToUncontrolled]: false,
  [messages.errorEnabledDndWithoutReactDnD]: false,
  [messages.errorDeprecatedDebugImport]: false
};
const warningsSlice = createSlice({
  name: "warnings",
  initialState,
  reducers: { rqbWarn: (state, { payload }) => {
    if (!state[payload]) {
      console.error(payload);
      state[payload] = true;
    }
  } }
});
const rootReducer = combineSlices(queriesSlice, warningsSlice).withLazyLoadedSlices();
const genUseQueryBuilderDispatch = (ctx) => createDispatchHook(ctx);
const genUseQueryBuilderStore = (ctx) => createStoreHook(ctx);
const genUseQueryBuilderSelector = (ctx) => createSelectorHook(ctx);
const getInternalHooks = (ctx) => ({
  useRQB_INTERNAL_QueryBuilderDispatch: genUseQueryBuilderDispatch(ctx),
  useRQB_INTERNAL_QueryBuilderStore: genUseQueryBuilderStore(ctx),
  useRQB_INTERNAL_QueryBuilderSelector: genUseQueryBuilderSelector(ctx)
});
const _RQB_INTERNAL_dispatchThunk = ({ payload, onQueryChange }) => (dispatch) => {
  dispatch(queriesSlice.actions.setQueryState(payload));
  if (typeof onQueryChange === "function") onQueryChange(payload.query);
};
const internalHooks = getInternalHooks(QueryBuilderStateContext);
const useRQB_INTERNAL_QueryBuilderDispatch = internalHooks.useRQB_INTERNAL_QueryBuilderDispatch;
const useRQB_INTERNAL_QueryBuilderStore = internalHooks.useRQB_INTERNAL_QueryBuilderStore;
const useRQB_INTERNAL_QueryBuilderSelector = internalHooks.useRQB_INTERNAL_QueryBuilderSelector;
const { rqbWarn: _SYNC_rqbWarn } = warningsSlice.actions;
const preloadedState = {
  queries: queriesSlice.getInitialState(),
  warnings: warningsSlice.getInitialState()
};
const storeCommon = {
  reducer: rootReducer,
  preloadedState,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: {
    ignoredActions: [queriesSlice.actions.setQueryState.type],
    ignoredPaths: [/^queries\b.*\.rules\.\d+\.value$/]
  } })
};
const usePrevious = (value) => {
  const ref = reactExports.useRef({
    value,
    prev: null
  });
  const current = ref.current.value;
  if (value !== current) {
    ref.current.prev = current;
    ref.current.value = value;
  }
  return ref.current.prev;
};
const useControlledOrUncontrolled = (params) => {
  useRQB_INTERNAL_QueryBuilderDispatch();
  const { queryProp } = params;
  usePrevious(!!queryProp);
};
function useDeprecatedProps(type, logWarning, otherParams) {
  useRQB_INTERNAL_QueryBuilderDispatch();
}
const useFields = (props) => {
  const { optionList: fields, optionsMap: fieldMap, defaultOption: defaultField } = reactExports.useMemo(() => prepareOptionList({
    placeholder: props.translations.fields,
    optionList: props.fields,
    autoSelectOption: props.autoSelectField,
    baseOption: props.baseField
  }), [
    props.autoSelectField,
    props.baseField,
    props.fields,
    props.translations.fields
  ]);
  return {
    fields,
    fieldMap,
    defaultField
  };
};
const configureRqbStore = (devTools) => {
  const queryBuilderStore = configureStore({
    ...storeCommon,
    devTools: devTools ? (
      /* istanbul ignore next */
      { name: "React Query Builder" }
    ) : false
  });
  queryBuilderStore.addSlice = (slice) => {
    rootReducer.inject(slice);
    queryBuilderStore.dispatch({
      type: crypto.randomUUID().slice(0, 8),
      meta: `Initializing state for slice "${slice.name}"`
    });
  };
  return queryBuilderStore;
};
let _store = null;
function getRqbStore(devTools) {
  if (!_store) _store = configureRqbStore(globalThis?.__RQB_DEVTOOLS__);
  return _store;
}
const getQuerySelectorById = (qbId) => (state) => queriesSlice.selectors.getQuerySelectorById({ queries: state.queries }, qbId);
const useQueryBuilderSelector = (selector, other) => {
  const rqbContext = reactExports.useContext(QueryBuilderContext);
  return useRQB_INTERNAL_QueryBuilderSelector(selector, other) ?? rqbContext?.initialQuery;
};
const defaultValidationResult = {};
const defaultValidationMap = {};
const defaultDisabledPaths = [];
const icCombinatorPropObject = {};
const defaultGetValueEditorSeparator = () => null;
const defaultGetRuleOrGroupClassname = () => "";
const defaultOnAddMoveRemove = () => true;
const defaultOnLog = (...params) => {
  console.log(...params);
};
function useQueryBuilderSchema(props, setup) {
  const { query: queryProp, defaultQuery: defaultQueryProp, getValueEditorSeparator = defaultGetValueEditorSeparator, getRuleClassname = defaultGetRuleOrGroupClassname, getRuleGroupClassname = defaultGetRuleOrGroupClassname, onAddRule = defaultOnAddMoveRemove, onAddGroup = defaultOnAddMoveRemove, onMoveRule = defaultOnAddMoveRemove, onMoveGroup = defaultOnAddMoveRemove, onGroupRule = defaultOnAddMoveRemove, onGroupGroup = defaultOnAddMoveRemove, onRemove = defaultOnAddMoveRemove, onQueryChange, showCombinatorsBetweenRules: showCombinatorsBetweenRulesProp = false, showNotToggle: showNotToggleProp = false, showShiftActions: showShiftActionsProp = false, showCloneButtons: showCloneButtonsProp = false, showLockButtons: showLockButtonsProp = false, showMuteButtons: showMuteButtonsProp = false, suppressStandardClassnames: suppressStandardClassnamesProp = false, resetOnFieldChange: resetOnFieldChangeProp = true, resetOnOperatorChange: resetOnOperatorChangeProp = false, autoSelectField: autoSelectFieldProp = true, autoSelectOperator: autoSelectOperatorProp = true, autoSelectValue: autoSelectValueProp = true, addRuleToNewGroups: addRuleToNewGroupsProp = false, listsAsArrays: listsAsArraysProp = false, parseNumbers = false, disabled = false, validator, onLog = defaultOnLog, idGenerator, accessibleDescriptionGenerator = generateAccessibleDescription } = props;
  const { qbId, rqbContext: incomingRqbContext, fields, fieldMap, combinators, getOperatorsMain, getMatchModesMain, getRuleDefaultOperator, getSubQueryBuilderPropsMain, getValueEditorTypeMain, getValueSourcesMain, getValuesMain, getRuleDefaultValue, getInputTypeMain, createRule, createRuleGroup } = setup;
  const { controlClassnames, controlElements: controls, debugMode, enableDragAndDrop, enableMountQueryChange, translations } = incomingRqbContext;
  const showCombinatorsBetweenRules = !!showCombinatorsBetweenRulesProp;
  const showNotToggle = !!showNotToggleProp;
  const showShiftActions = !!showShiftActionsProp;
  const showCloneButtons = !!showCloneButtonsProp;
  const showLockButtons = !!showLockButtonsProp;
  const showMuteButtons = !!showMuteButtonsProp;
  const resetOnFieldChange = !!resetOnFieldChangeProp;
  const resetOnOperatorChange = !!resetOnOperatorChangeProp;
  const autoSelectField = !!autoSelectFieldProp;
  const autoSelectOperator = !!autoSelectOperatorProp;
  const autoSelectValue = !!autoSelectValueProp;
  const addRuleToNewGroups = !!addRuleToNewGroupsProp;
  const listsAsArrays = !!listsAsArraysProp;
  const suppressStandardClassnames = !!suppressStandardClassnamesProp;
  const maxLevels = (props.maxLevels ?? 0) > 0 ? Number(props.maxLevels) : Infinity;
  const log = reactExports.useCallback((...params) => {
    if (debugMode) onLog(...params);
  }, [debugMode, onLog]);
  useControlledOrUncontrolled({
    queryProp
  });
  const queryBuilderStore = useRQB_INTERNAL_QueryBuilderStore();
  const queryBuilderDispatch = useRQB_INTERNAL_QueryBuilderDispatch();
  const querySelector = reactExports.useMemo(() => getQuerySelectorById(qbId), [qbId]);
  const storeQuery = useQueryBuilderSelector(querySelector);
  const getQuery = reactExports.useCallback(() => querySelector(queryBuilderStore.getState()), [queryBuilderStore, querySelector]);
  const fallbackQuery = reactExports.useMemo(() => createRuleGroup(), [createRuleGroup]);
  const candidateQuery = queryProp ?? storeQuery ?? defaultQueryProp ?? fallbackQuery;
  const rootGroup = candidateQuery.id ? candidateQuery : prepareRuleGroup(candidateQuery, { idGenerator });
  const [initialQuery] = reactExports.useState(rootGroup);
  const rqbContext = reactExports.useMemo(() => ({
    ...incomingRqbContext,
    initialQuery
  }), [incomingRqbContext, initialQuery]);
  reactExports.useEffect(() => {
    if (!!queryProp && !Object.is(queryProp, storeQuery)) queryBuilderDispatch(_RQB_INTERNAL_dispatchThunk({
      payload: {
        qbId,
        query: queryProp
      },
      onQueryChange: void 0
    }));
  }, [
    queryProp,
    qbId,
    storeQuery,
    queryBuilderDispatch
  ]);
  const independentCombinators = reactExports.useMemo(() => isRuleGroupTypeIC(rootGroup), [rootGroup]);
  const invalidIC = !!props.independentCombinators && !independentCombinators;
  useDeprecatedProps("independentCombinators", invalidIC || !invalidIC && (props.independentCombinators ?? "not present") !== "not present");
  const hasRunMountQueryChange = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (hasRunMountQueryChange.current) return;
    hasRunMountQueryChange.current = true;
    queryBuilderDispatch(_RQB_INTERNAL_dispatchThunk({
      payload: {
        qbId,
        query: rootGroup
      },
      onQueryChange: enableMountQueryChange && typeof onQueryChange === "function" ? onQueryChange : void 0
    }));
  }, [
    enableMountQueryChange,
    onQueryChange,
    qbId,
    queryBuilderDispatch,
    rootGroup
  ]);
  const dispatchQuery = reactExports.useCallback((newQuery) => {
    queryBuilderDispatch(_RQB_INTERNAL_dispatchThunk({
      payload: {
        qbId,
        query: newQuery
      },
      onQueryChange
    }));
  }, [
    onQueryChange,
    qbId,
    queryBuilderDispatch
  ]);
  const disabledPaths = Array.isArray(disabled) && disabled || defaultDisabledPaths;
  const queryDisabled = disabled === true;
  const rootGroupDisabled = rootGroup.disabled || disabledPaths.some((p) => p.length === 0);
  const onRuleAdd = reactExports.useCallback((rule, parentPath, context) => {
    const queryLocal = getQuerySelectorById(qbId)(queryBuilderStore.getState());
    if (!queryLocal) return;
    if (pathIsDisabled(parentPath, queryLocal) || queryDisabled) {
      log({
        qbId,
        type: LogType.parentPathDisabled,
        rule,
        parentPath,
        query: queryLocal
      });
      return;
    }
    const nextRule = onAddRule(rule, parentPath, queryLocal, context);
    if (!nextRule) {
      log({
        qbId,
        type: LogType.onAddRuleFalse,
        rule,
        parentPath,
        query: queryLocal
      });
      return;
    }
    const newRule = nextRule === true ? rule : nextRule;
    const newQuery = add(queryLocal, newRule, parentPath, {
      combinators,
      combinatorPreceding: newRule.combinatorPreceding ?? void 0,
      idGenerator
    });
    log({
      qbId,
      type: LogType.add,
      query: queryLocal,
      newQuery,
      newRule,
      parentPath
    });
    dispatchQuery(newQuery);
  }, [
    combinators,
    dispatchQuery,
    idGenerator,
    log,
    onAddRule,
    qbId,
    queryBuilderStore,
    queryDisabled
  ]);
  const onGroupAdd = reactExports.useCallback((ruleGroup, parentPath, context) => {
    if (parentPath.length >= maxLevels) return;
    const queryLocal = getQuerySelectorById(qbId)(queryBuilderStore.getState());
    if (!queryLocal) return;
    if (pathIsDisabled(parentPath, queryLocal) || queryDisabled) {
      log({
        qbId,
        type: LogType.parentPathDisabled,
        ruleGroup,
        parentPath,
        query: queryLocal
      });
      return;
    }
    const nextGroup = onAddGroup(ruleGroup, parentPath, queryLocal, context);
    if (!nextGroup) {
      log({
        qbId,
        type: LogType.onAddGroupFalse,
        ruleGroup,
        parentPath,
        query: queryLocal
      });
      return;
    }
    const newGroup = nextGroup === true ? ruleGroup : nextGroup;
    const newQuery = add(queryLocal, newGroup, parentPath, {
      combinators,
      combinatorPreceding: newGroup.combinatorPreceding ?? void 0,
      idGenerator
    });
    log({
      qbId,
      type: LogType.add,
      query: queryLocal,
      newQuery,
      newGroup,
      parentPath
    });
    dispatchQuery(newQuery);
  }, [
    combinators,
    dispatchQuery,
    idGenerator,
    log,
    maxLevels,
    onAddGroup,
    qbId,
    queryBuilderStore,
    queryDisabled
  ]);
  const onPropChange = reactExports.useCallback((prop, value, path) => {
    const queryLocal = getQuerySelectorById(qbId)(queryBuilderStore.getState());
    if (!queryLocal) return;
    if (pathIsDisabled(path, queryLocal) && prop !== "disabled" || queryDisabled) {
      log({
        qbId,
        type: LogType.pathDisabled,
        path,
        prop,
        value,
        query: queryLocal
      });
      return;
    }
    const newQuery = update(queryLocal, prop, value, path, {
      resetOnFieldChange,
      resetOnOperatorChange,
      getRuleDefaultOperator,
      getValueSources: getValueSourcesMain,
      getRuleDefaultValue,
      getMatchModes: getMatchModesMain
    });
    log({
      qbId,
      type: LogType.update,
      query: queryLocal,
      newQuery,
      prop,
      value,
      path
    });
    dispatchQuery(newQuery);
  }, [
    dispatchQuery,
    getMatchModesMain,
    getRuleDefaultOperator,
    getRuleDefaultValue,
    getValueSourcesMain,
    log,
    qbId,
    queryBuilderStore,
    queryDisabled,
    resetOnFieldChange,
    resetOnOperatorChange
  ]);
  const onRuleOrGroupRemove = reactExports.useCallback((path, context) => {
    const queryLocal = getQuerySelectorById(qbId)(queryBuilderStore.getState());
    if (!queryLocal) return;
    if (pathIsDisabled(path, queryLocal) || queryDisabled) {
      log({
        qbId,
        type: LogType.pathDisabled,
        path,
        query: queryLocal
      });
      return;
    }
    const ruleOrGroup = findPath(path, queryLocal);
    if (ruleOrGroup) if (onRemove(ruleOrGroup, path, queryLocal, context)) {
      const newQuery = remove(queryLocal, path);
      log({
        qbId,
        type: LogType.remove,
        query: queryLocal,
        newQuery,
        path,
        ruleOrGroup
      });
      dispatchQuery(newQuery);
    } else log({
      qbId,
      type: LogType.onRemoveFalse,
      ruleOrGroup,
      path,
      query: queryLocal
    });
  }, [
    dispatchQuery,
    log,
    onRemove,
    qbId,
    queryBuilderStore,
    queryDisabled
  ]);
  const moveRule = reactExports.useCallback((oldPath, newPath, clone, context) => {
    const queryLocal = getQuerySelectorById(qbId)(queryBuilderStore.getState());
    if (!queryLocal) return;
    if (pathIsDisabled(oldPath, queryLocal) || queryDisabled) {
      log({
        qbId,
        type: LogType.pathDisabled,
        oldPath,
        newPath,
        query: queryLocal
      });
      return;
    }
    const nextQuery = move(queryLocal, oldPath, newPath, {
      clone,
      combinators,
      idGenerator
    });
    const ruleOrGroup = findPath(oldPath, queryLocal);
    const isGroup = isRuleGroup(ruleOrGroup);
    const callbackResult = (isGroup ? onMoveGroup : onMoveRule)(ruleOrGroup, oldPath, newPath, queryLocal, nextQuery, {
      clone,
      combinators
    }, context);
    if (!callbackResult) {
      log({
        qbId,
        type: isGroup ? LogType.onMoveGroupFalse : LogType.onMoveRuleFalse,
        ruleOrGroup,
        oldPath,
        newPath,
        clone,
        query: queryLocal,
        nextQuery
      });
      return;
    }
    const newQuery = isRuleGroup(callbackResult) ? callbackResult : nextQuery;
    log({
      qbId,
      type: LogType.move,
      query: queryLocal,
      newQuery,
      oldPath,
      newPath,
      clone
    });
    dispatchQuery(newQuery);
  }, [
    combinators,
    dispatchQuery,
    idGenerator,
    log,
    onMoveGroup,
    onMoveRule,
    qbId,
    queryBuilderStore,
    queryDisabled
  ]);
  const groupRule = reactExports.useCallback((sourcePath, targetPath, clone, context) => {
    const queryLocal = getQuerySelectorById(qbId)(queryBuilderStore.getState());
    if (!queryLocal) return;
    if (pathIsDisabled(sourcePath, queryLocal) || queryDisabled) {
      log({
        qbId,
        type: LogType.pathDisabled,
        sourcePath,
        targetPath,
        query: queryLocal
      });
      return;
    }
    const nextQuery = group(queryLocal, sourcePath, targetPath, {
      clone,
      combinators,
      idGenerator
    });
    const ruleOrGroup = findPath(sourcePath, queryLocal);
    const isGroup = isRuleGroup(ruleOrGroup);
    const callbackResult = (isGroup ? onGroupGroup : onGroupRule)(ruleOrGroup, sourcePath, targetPath, queryLocal, nextQuery, {
      clone,
      combinators
    }, context);
    if (!callbackResult) {
      log({
        qbId,
        type: isGroup ? LogType.onGroupGroupFalse : LogType.onGroupRuleFalse,
        ruleOrGroup,
        sourcePath,
        targetPath,
        clone,
        query: queryLocal,
        nextQuery
      });
      return;
    }
    const newQuery = isRuleGroup(callbackResult) ? callbackResult : nextQuery;
    log({
      qbId,
      type: LogType.group,
      query: queryLocal,
      newQuery,
      sourcePath,
      targetPath,
      clone
    });
    dispatchQuery(newQuery);
  }, [
    combinators,
    dispatchQuery,
    idGenerator,
    log,
    onGroupGroup,
    onGroupRule,
    qbId,
    queryBuilderStore,
    queryDisabled
  ]);
  const { validationResult, validationMap } = reactExports.useMemo(() => {
    const validationResult$1 = typeof validator === "function" && rootGroup ? validator(rootGroup) : defaultValidationResult;
    return {
      validationResult: validationResult$1,
      validationMap: typeof validationResult$1 === "boolean" ? defaultValidationMap : validationResult$1
    };
  }, [rootGroup, validator]);
  const dndEnabledAttr = enableDragAndDrop ? "enabled" : "disabled";
  const inlineCombinatorsAttr = independentCombinators || showCombinatorsBetweenRules ? "enabled" : "disabled";
  const combinatorPropObject = reactExports.useMemo(() => typeof rootGroup.combinator === "string" ? { combinator: rootGroup.combinator } : icCombinatorPropObject, [rootGroup.combinator]);
  const wrapperClassName = reactExports.useMemo(() => clsx(suppressStandardClassnames || standardClassnames.queryBuilder, clsx(controlClassnames.queryBuilder), queryDisabled && controlClassnames.disabled, typeof validationResult === "boolean" && validationResult && controlClassnames.valid, typeof validationResult === "boolean" && !validationResult && controlClassnames.invalid, suppressStandardClassnames || {
    [standardClassnames.disabled]: queryDisabled,
    [standardClassnames.valid]: typeof validationResult === "boolean" && validationResult,
    [standardClassnames.invalid]: typeof validationResult === "boolean" && !validationResult
  }), [
    controlClassnames.disabled,
    controlClassnames.invalid,
    controlClassnames.queryBuilder,
    controlClassnames.valid,
    queryDisabled,
    suppressStandardClassnames,
    validationResult
  ]);
  const createRuleGroupOverride = reactExports.useCallback((ic) => createRuleGroup(ic ?? independentCombinators), [createRuleGroup, independentCombinators]);
  const schema = reactExports.useMemo(() => ({
    addRuleToNewGroups,
    accessibleDescriptionGenerator,
    autoSelectField,
    autoSelectOperator,
    autoSelectValue,
    classNames: controlClassnames,
    combinators,
    controls,
    createRule,
    createRuleGroup: createRuleGroupOverride,
    disabledPaths,
    enableDragAndDrop,
    fieldMap,
    fields,
    dispatchQuery,
    getQuery,
    getInputType: getInputTypeMain,
    getOperators: getOperatorsMain,
    getMatchModes: getMatchModesMain,
    getRuleClassname,
    getRuleGroupClassname,
    getSubQueryBuilderProps: getSubQueryBuilderPropsMain,
    getValueEditorSeparator,
    getValueEditorType: getValueEditorTypeMain,
    getValues: getValuesMain,
    getValueSources: getValueSourcesMain,
    independentCombinators,
    listsAsArrays,
    maxLevels,
    parseNumbers,
    qbId,
    showCloneButtons,
    showCombinatorsBetweenRules,
    showLockButtons,
    showMuteButtons,
    showNotToggle,
    showShiftActions,
    suppressStandardClassnames,
    validationMap
  }), [
    accessibleDescriptionGenerator,
    addRuleToNewGroups,
    autoSelectField,
    autoSelectOperator,
    autoSelectValue,
    combinators,
    controlClassnames,
    controls,
    createRule,
    createRuleGroupOverride,
    disabledPaths,
    dispatchQuery,
    enableDragAndDrop,
    fieldMap,
    fields,
    getInputTypeMain,
    getOperatorsMain,
    getMatchModesMain,
    getQuery,
    getRuleClassname,
    getRuleGroupClassname,
    getSubQueryBuilderPropsMain,
    getValueEditorSeparator,
    getValueEditorTypeMain,
    getValuesMain,
    getValueSourcesMain,
    independentCombinators,
    listsAsArrays,
    maxLevels,
    parseNumbers,
    qbId,
    showCloneButtons,
    showCombinatorsBetweenRules,
    showLockButtons,
    showMuteButtons,
    showNotToggle,
    showShiftActions,
    suppressStandardClassnames,
    validationMap
  ]);
  return {
    actions: reactExports.useMemo(() => ({
      moveRule,
      onGroupAdd,
      onGroupRemove: onRuleOrGroupRemove,
      onPropChange,
      onRuleAdd,
      onRuleRemove: onRuleOrGroupRemove,
      groupRule
    }), [
      groupRule,
      moveRule,
      onGroupAdd,
      onPropChange,
      onRuleAdd,
      onRuleOrGroupRemove
    ]),
    rootGroup,
    rootGroupDisabled,
    queryDisabled,
    rqbContext,
    schema,
    translations,
    wrapperClassName,
    dndEnabledAttr,
    inlineCombinatorsAttr,
    combinatorPropObject
  };
}
const getFirstOptionsFrom = (opts, r, listsAsArrays) => {
  const firstOption = getFirstOption(opts);
  if (r.operator === "between" || r.operator === "notBetween") {
    const valueAsArray = [firstOption, firstOption];
    return listsAsArrays ? valueAsArray : joinWith(valueAsArray.map((v) => v ?? ""), ",");
  }
  return firstOption;
};
const useQueryBuilderSetup = (props) => {
  const [qbId] = reactExports.useState(generateID);
  const { fields: fieldsProp, baseField, operators: operatorsProp, baseOperator, combinators: combinatorsProp, baseCombinator, translations: translationsProp, enableMountQueryChange: enableMountQueryChangeProp = true, controlClassnames: controlClassnamesProp, controlElements: controlElementsProp, getDefaultField, getDefaultOperator, getDefaultValue, getMatchModes, getOperators, getSubQueryBuilderProps, getValueEditorType, getValueSources, getInputType, getValues, autoSelectField = true, autoSelectOperator = true, autoSelectValue = true, addRuleToNewGroups = false, enableDragAndDrop: enableDragAndDropProp, listsAsArrays = false, debugMode: debugModeProp = false, idGenerator = generateID } = props;
  const [initialQueryProp] = reactExports.useState(props.query ?? props.defaultQuery);
  const rqbContext = useMergedContext({
    controlClassnames: controlClassnamesProp,
    controlElements: controlElementsProp,
    debugMode: debugModeProp,
    enableDragAndDrop: enableDragAndDropProp,
    enableMountQueryChange: enableMountQueryChangeProp,
    translations: translationsProp,
    initialQuery: initialQueryProp,
    qbId,
    finalize: true
  });
  const { translations } = rqbContext;
  const { fields, fieldMap } = useFields({
    fields: fieldsProp,
    baseField,
    autoSelectField,
    translations
  });
  const { optionList: combinators } = reactExports.useMemo(() => prepareOptionList({
    optionList: combinatorsProp ?? defaultCombinators,
    labelMap: defaultCombinatorLabelMap,
    baseOption: baseCombinator,
    autoSelectOption: true
  }), [baseCombinator, combinatorsProp]);
  const { optionList: operators } = reactExports.useMemo(() => prepareOptionList({
    optionList: operatorsProp ?? defaultOperators,
    placeholder: translations.operators,
    labelMap: defaultOperatorLabelMap,
    baseOption: baseOperator,
    autoSelectOption: autoSelectOperator
  }), [
    autoSelectOperator,
    baseOperator,
    operatorsProp,
    translations.operators
  ]);
  const getOperatorsMain = reactExports.useCallback((field, { fieldData }) => prepareOptionList({
    optionList: fieldData?.operators ?? getOperators?.(field, { fieldData }) ?? operators,
    placeholder: translations.operators,
    baseOption: baseOperator,
    labelMap: defaultOperatorLabelMap,
    autoSelectOption: autoSelectOperator
  }).optionList, [
    autoSelectOperator,
    baseOperator,
    getOperators,
    operators,
    translations.operators
  ]);
  const getRuleDefaultOperator = reactExports.useCallback((field) => {
    const fieldData = fieldMap[field];
    if (fieldData?.defaultOperator) return fieldData.defaultOperator;
    if (getDefaultOperator) return typeof getDefaultOperator === "function" ? getDefaultOperator(field, { fieldData }) : getDefaultOperator;
    return getFirstOption(getOperatorsMain(field, { fieldData }) ?? []) ?? "";
  }, [
    fieldMap,
    getDefaultOperator,
    getOperatorsMain
  ]);
  const getValueEditorTypeMain = reactExports.useCallback((field, operator, { fieldData }) => {
    if (fieldData.valueEditorType) {
      if (typeof fieldData.valueEditorType === "function") return fieldData.valueEditorType(operator);
      return fieldData.valueEditorType;
    }
    return getValueEditorType?.(field, operator, { fieldData }) ?? "text";
  }, [getValueEditorType]);
  const getValueSourcesMain = reactExports.useCallback((field, operator, _misc) => getValueSourcesUtil(fieldMap[field], operator, getValueSources), [fieldMap, getValueSources]);
  const getMatchModesMain = reactExports.useCallback((field, _misc) => getMatchModesUtil(fieldMap[field], getMatchModes), [fieldMap, getMatchModes]);
  const getSubQueryBuilderPropsMain = reactExports.useCallback((field, misc) => getSubQueryBuilderProps?.(field, misc) ?? {}, [getSubQueryBuilderProps]);
  const getValuesMain = reactExports.useCallback((field, operator, { fieldData }) => prepareOptionList({
    optionList: fieldData?.values ?? getValues?.(field, operator, { fieldData }) ?? [],
    placeholder: translations.values,
    autoSelectOption: autoSelectValue
  }).optionList, [
    autoSelectValue,
    getValues,
    translations.values
  ]);
  const getRuleDefaultValue = reactExports.useCallback((r) => {
    const fieldData = fieldMap[r.field] ?? {};
    if (fieldData?.defaultValue !== void 0 && fieldData.defaultValue !== null) return fieldData.defaultValue;
    else if (getDefaultValue) return getDefaultValue(r, { fieldData });
    let value = "";
    const values = getValuesMain(r.field, r.operator, { fieldData });
    if (r.valueSource === "field") {
      const filteredFields = filterFieldsByComparator(fieldData, fields, r.operator);
      value = filteredFields.length > 0 ? getFirstOptionsFrom(filteredFields, r, listsAsArrays) : "";
    } else if (values.length > 0) {
      const editorType = getValueEditorTypeMain(r.field, r.operator, { fieldData });
      if (editorType === "multiselect") value = listsAsArrays ? [] : "";
      else if (editorType === "select" || editorType === "radio") value = getFirstOptionsFrom(values, r, listsAsArrays);
    } else if (getValueEditorTypeMain(r.field, r.operator, { fieldData }) === "checkbox") value = false;
    return value;
  }, [
    fieldMap,
    fields,
    getDefaultValue,
    getValueEditorTypeMain,
    getValuesMain,
    listsAsArrays
  ]);
  const getInputTypeMain = reactExports.useCallback((field, operator, { fieldData }) => {
    if (getInputType) {
      const inputType = getInputType(field, operator, { fieldData });
      if (inputType) return inputType;
    }
    return "text";
  }, [getInputType]);
  const createRule = reactExports.useCallback(() => {
    let field = "";
    const flds = fields;
    if (flds?.length > 0 && flds[0]) {
      const fo = getFirstOption(flds);
      if (fo) field = fo;
    }
    if (getDefaultField) if (typeof getDefaultField === "function") {
      const df = getDefaultField(flds);
      if (df) field = df;
    } else field = getDefaultField;
    const operator = getRuleDefaultOperator(field);
    const valueSource = getFirstOption(getValueSourcesMain(field, operator, { fieldData: getOption(flds, field) })) ?? "value";
    const matchMode = getFirstOption(getMatchModesMain(field, { fieldData: getOption(flds, field) }));
    const newRule = {
      id: idGenerator(),
      field,
      operator,
      valueSource,
      value: "",
      ...matchMode ? { match: {
        mode: matchMode,
        threshold: 1
      } } : null
    };
    const value = getRuleDefaultValue(newRule);
    return {
      ...newRule,
      value
    };
  }, [
    fields,
    getDefaultField,
    getMatchModesMain,
    getRuleDefaultOperator,
    getRuleDefaultValue,
    getValueSourcesMain,
    idGenerator
  ]);
  return {
    qbId,
    rqbContext,
    fields,
    fieldMap,
    combinators,
    getMatchModesMain,
    getOperatorsMain,
    getRuleDefaultOperator,
    getSubQueryBuilderPropsMain,
    getValueEditorTypeMain,
    getValueSourcesMain,
    getValuesMain,
    getRuleDefaultValue,
    getInputTypeMain,
    createRule,
    createRuleGroup: reactExports.useCallback((independentCombinators) => {
      if (independentCombinators) return {
        id: idGenerator(),
        rules: addRuleToNewGroups ? [createRule()] : [],
        not: false
      };
      return {
        id: idGenerator(),
        rules: addRuleToNewGroups ? [createRule()] : [],
        combinator: getFirstOption(combinators) ?? "",
        not: false
      };
    }, [
      addRuleToNewGroups,
      combinators,
      createRule,
      idGenerator
    ])
  };
};
const useQueryBuilder = (props) => useQueryBuilderSchema(props, useQueryBuilderSetup(props));
const QueryBuilderContext = reactExports.createContext({});
const RuleGroup = reactExports.memo(function RuleGroup$1(props) {
  const rg = useRuleGroup(props);
  const { schema: { controls: { ruleGroupBodyElements: RuleGroupBodyElements, ruleGroupHeaderElements: RuleGroupHeaderElements } } } = rg;
  const addRule = useStopEventPropagation(rg.addRule);
  const addGroup = useStopEventPropagation(rg.addGroup);
  const cloneGroup = useStopEventPropagation(rg.cloneGroup);
  const toggleLockGroup = useStopEventPropagation(rg.toggleLockGroup);
  const toggleMuteGroup = useStopEventPropagation(rg.toggleMuteGroup);
  const removeGroup = useStopEventPropagation(rg.removeGroup);
  const shiftGroupUp = useStopEventPropagation(rg.shiftGroupUp);
  const shiftGroupDown = useStopEventPropagation(rg.shiftGroupDown);
  const actions = reactExports.useMemo(() => ({
    addRule,
    addGroup,
    cloneGroup,
    toggleLockGroup,
    toggleMuteGroup,
    removeGroup,
    shiftGroupUp,
    shiftGroupDown
  }), [
    addRule,
    addGroup,
    cloneGroup,
    toggleLockGroup,
    toggleMuteGroup,
    removeGroup,
    shiftGroupUp,
    shiftGroupDown
  ]);
  return /* @__PURE__ */ reactExports.createElement("div", {
    ref: rg.previewRef,
    title: rg.accessibleDescription,
    className: rg.outerClassName,
    "data-testid": TestID.ruleGroup,
    "data-not": rg.ruleGroup.not ? "true" : void 0,
    "data-dragmonitorid": rg.dragMonitorId,
    "data-dropmonitorid": rg.dropMonitorId,
    "data-rule-group-id": rg.id,
    "data-level": rg.path.length,
    "data-path": JSON.stringify(rg.path)
  }, /* @__PURE__ */ reactExports.createElement("div", {
    ref: rg.dropRef,
    className: rg.classNames.header
  }, /* @__PURE__ */ reactExports.createElement(RuleGroupHeaderElements, {
    ...rg,
    ...actions
  })), /* @__PURE__ */ reactExports.createElement("div", { className: rg.classNames.body }, /* @__PURE__ */ reactExports.createElement(RuleGroupBodyElements, {
    ...rg,
    ...actions
  })));
});
const RuleGroupHeaderComponents = reactExports.memo(function RuleGroupHeaderComponents$1(rg) {
  const { schema: { controls: { shiftActions: ShiftActionsControlElement, dragHandle: DragHandleControlElement, combinatorSelector: CombinatorSelectorControlElement, notToggle: NotToggleControlElement, addRuleAction: AddRuleActionControlElement, addGroupAction: AddGroupActionControlElement, cloneGroupAction: CloneGroupActionControlElement, lockGroupAction: LockGroupActionControlElement, muteGroupAction: MuteGroupActionControlElement, removeGroupAction: RemoveGroupActionControlElement } } } = rg;
  const commonSubcomponentProps = reactExports.useMemo(() => ({
    level: rg.path.length,
    path: rg.path,
    disabled: rg.disabled,
    context: rg.context,
    validation: rg.validationResult,
    schema: rg.schema
  }), [
    rg.path,
    rg.disabled,
    rg.context,
    rg.validationResult,
    rg.schema
  ]);
  const shiftTitles = reactExports.useMemo(() => rg.schema.showShiftActions ? {
    shiftUp: rg.translations.shiftActionUp.title,
    shiftDown: rg.translations.shiftActionDown.title
  } : void 0, [rg.schema.showShiftActions, rg.translations]);
  const shiftLabels = reactExports.useMemo(() => rg.schema.showShiftActions ? {
    shiftUp: rg.translations.shiftActionUp.label,
    shiftDown: rg.translations.shiftActionDown.label
  } : void 0, [rg.schema.showShiftActions, rg.translations]);
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, rg.schema.showShiftActions && rg.path.length > 0 && /* @__PURE__ */ reactExports.createElement(ShiftActionsControlElement, {
    key: TestID.shiftActions,
    ...commonSubcomponentProps,
    testID: TestID.shiftActions,
    titles: shiftTitles,
    labels: shiftLabels,
    className: rg.classNames.shiftActions,
    shiftUp: rg.shiftGroupUp,
    shiftDown: rg.shiftGroupDown,
    shiftUpDisabled: rg.shiftUpDisabled,
    shiftDownDisabled: rg.shiftDownDisabled,
    ruleOrGroup: rg.ruleGroup
  }), rg.path.length > 0 && rg.schema.enableDragAndDrop && /* @__PURE__ */ reactExports.createElement(DragHandleControlElement, {
    key: TestID.dragHandle,
    ...commonSubcomponentProps,
    testID: TestID.dragHandle,
    ref: rg.dragRef,
    title: rg.translations.dragHandle.title,
    label: rg.translations.dragHandle.label,
    className: rg.classNames.dragHandle,
    ruleOrGroup: rg.ruleGroup
  }), !rg.schema.showCombinatorsBetweenRules && !rg.schema.independentCombinators && /* @__PURE__ */ reactExports.createElement(CombinatorSelectorControlElement, {
    key: TestID.combinators,
    ...commonSubcomponentProps,
    testID: TestID.combinators,
    options: rg.schema.combinators,
    value: rg.combinator,
    title: rg.translations.combinators.title,
    className: rg.classNames.combinators,
    handleOnChange: rg.onCombinatorChange,
    rules: rg.ruleGroup.rules,
    ruleGroup: rg.ruleGroup
  }), rg.schema.showNotToggle && /* @__PURE__ */ reactExports.createElement(NotToggleControlElement, {
    key: TestID.notToggle,
    ...commonSubcomponentProps,
    testID: TestID.notToggle,
    className: rg.classNames.notToggle,
    title: rg.translations.notToggle.title,
    label: rg.translations.notToggle.label,
    checked: rg.ruleGroup.not,
    handleOnChange: rg.onNotToggleChange,
    ruleGroup: rg.ruleGroup
  }), /* @__PURE__ */ reactExports.createElement(AddRuleActionControlElement, {
    key: TestID.addRule,
    ...commonSubcomponentProps,
    testID: TestID.addRule,
    label: rg.translations.addRule.label,
    title: rg.translations.addRule.title,
    className: rg.classNames.addRule,
    handleOnClick: rg.addRule,
    rules: rg.ruleGroup.rules,
    ruleOrGroup: rg.ruleGroup
  }), rg.schema.maxLevels > rg.path.length && /* @__PURE__ */ reactExports.createElement(AddGroupActionControlElement, {
    key: TestID.addGroup,
    ...commonSubcomponentProps,
    testID: TestID.addGroup,
    label: rg.translations.addGroup.label,
    title: rg.translations.addGroup.title,
    className: rg.classNames.addGroup,
    handleOnClick: rg.addGroup,
    rules: rg.ruleGroup.rules,
    ruleOrGroup: rg.ruleGroup
  }), rg.schema.showCloneButtons && rg.path.length > 0 && /* @__PURE__ */ reactExports.createElement(CloneGroupActionControlElement, {
    key: TestID.cloneGroup,
    ...commonSubcomponentProps,
    testID: TestID.cloneGroup,
    label: rg.translations.cloneRuleGroup.label,
    title: rg.translations.cloneRuleGroup.title,
    className: rg.classNames.cloneGroup,
    handleOnClick: rg.cloneGroup,
    rules: rg.ruleGroup.rules,
    ruleOrGroup: rg.ruleGroup
  }), rg.schema.showLockButtons && /* @__PURE__ */ reactExports.createElement(LockGroupActionControlElement, {
    key: TestID.lockGroup,
    ...commonSubcomponentProps,
    testID: TestID.lockGroup,
    label: rg.translations.lockGroup.label,
    title: rg.translations.lockGroup.title,
    className: rg.classNames.lockGroup,
    handleOnClick: rg.toggleLockGroup,
    rules: rg.ruleGroup.rules,
    disabledTranslation: rg.parentDisabled ? void 0 : rg.translations.lockGroupDisabled,
    ruleOrGroup: rg.ruleGroup
  }), rg.schema.showMuteButtons && /* @__PURE__ */ reactExports.createElement(MuteGroupActionControlElement, {
    key: TestID.muteGroup,
    ...commonSubcomponentProps,
    testID: TestID.muteGroup,
    label: rg.ruleGroup.muted ? rg.translations.unmuteGroup.label : rg.translations.muteGroup.label,
    title: rg.ruleGroup.muted ? rg.translations.unmuteGroup.title : rg.translations.muteGroup.title,
    className: rg.classNames.muteGroup,
    handleOnClick: rg.toggleMuteGroup,
    rules: rg.ruleGroup.rules,
    ruleOrGroup: rg.ruleGroup
  }), rg.path.length > 0 && /* @__PURE__ */ reactExports.createElement(RemoveGroupActionControlElement, {
    key: TestID.removeGroup,
    ...commonSubcomponentProps,
    testID: TestID.removeGroup,
    label: rg.translations.removeGroup.label,
    title: rg.translations.removeGroup.title,
    className: rg.classNames.removeGroup,
    handleOnClick: rg.removeGroup,
    rules: rg.ruleGroup.rules,
    ruleOrGroup: rg.ruleGroup
  }));
});
const RuleGroupBodyComponents = reactExports.memo(function RuleGroupBodyComponents$1(rg) {
  const { schema: { controls: { combinatorSelector: CombinatorSelectorControlElement, inlineCombinator: InlineCombinatorControlElement, ruleGroup: RuleGroupControlElement, rule: RuleControlElement } } } = rg;
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, rg.ruleGroup.rules.map((r, idx, { length: ruleArrayLength }) => {
    const thisPathMemo = rg.pathsMemo[idx];
    const thisPath = thisPathMemo.path;
    const thisPathDisabled = thisPathMemo.disabled || typeof r !== "string" && r.disabled;
    const shiftUpDisabled = pathsAreEqual([0], thisPath);
    const shiftDownDisabled = rg.path.length === 0 && idx === ruleArrayLength - 1;
    const key = typeof r === "string" ? [...thisPath, r].join("-") : r.id;
    return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, { key }, idx > 0 && !rg.schema.independentCombinators && rg.schema.showCombinatorsBetweenRules && /* @__PURE__ */ reactExports.createElement(InlineCombinatorControlElement, {
      key: TestID.inlineCombinator,
      options: rg.schema.combinators,
      value: rg.combinator,
      title: rg.translations.combinators.title,
      className: rg.classNames.combinators,
      handleOnChange: rg.onCombinatorChange,
      rules: rg.ruleGroup.rules,
      level: rg.path.length,
      context: rg.context,
      validation: rg.validationResult,
      component: CombinatorSelectorControlElement,
      path: thisPath,
      disabled: rg.disabled,
      schema: rg.schema,
      ruleGroup: rg.ruleGroup
    }), typeof r === "string" ? /* @__PURE__ */ reactExports.createElement(InlineCombinatorControlElement, {
      key: `${TestID.inlineCombinator}-independent`,
      options: rg.schema.combinators,
      value: r,
      title: rg.translations.combinators.title,
      className: rg.classNames.combinators,
      handleOnChange: (val) => rg.onIndependentCombinatorChange(val, idx),
      rules: rg.ruleGroup.rules,
      level: rg.path.length,
      context: rg.context,
      validation: rg.validationResult,
      component: CombinatorSelectorControlElement,
      path: thisPath,
      disabled: thisPathDisabled,
      schema: rg.schema,
      ruleGroup: rg.ruleGroup
    }) : isRuleGroup(r) ? /* @__PURE__ */ reactExports.createElement(RuleGroupControlElement, {
      key: TestID.ruleGroup,
      id: r.id,
      schema: rg.schema,
      actions: rg.actions,
      path: thisPath,
      translations: rg.translations,
      ruleGroup: r,
      rules: r.rules,
      combinator: isRuleGroupType(r) ? r.combinator : void 0,
      not: !!r.not,
      disabled: thisPathDisabled,
      parentDisabled: rg.parentDisabled || rg.disabled,
      parentMuted: rg.parentMuted || rg.muted,
      shiftUpDisabled,
      shiftDownDisabled,
      context: rg.context
    }) : /* @__PURE__ */ reactExports.createElement(RuleControlElement, {
      key: TestID.rule,
      id: r.id,
      rule: r,
      field: r.field,
      operator: r.operator,
      value: r.value,
      valueSource: r.valueSource,
      schema: rg.schema,
      actions: rg.actions,
      path: thisPath,
      disabled: thisPathDisabled,
      parentDisabled: rg.parentDisabled || rg.disabled,
      parentMuted: rg.parentMuted || rg.muted,
      translations: rg.translations,
      shiftUpDisabled,
      shiftDownDisabled,
      context: rg.context
    }));
  }));
});
const useRuleGroup = (props) => {
  const { id, path, ruleGroup: ruleGroupProp, schema: { qbId, accessibleDescriptionGenerator, classNames: classNamesProp, combinators, createRule, createRuleGroup, disabledPaths, independentCombinators, validationMap, enableDragAndDrop, getRuleGroupClassname, suppressStandardClassnames }, actions: { onGroupAdd, onGroupRemove, onPropChange, onRuleAdd, moveRule }, disabled: disabledProp, parentDisabled, parentMuted, shiftUpDisabled, shiftDownDisabled, combinator: combinatorProp, rules: rulesProp, not: notProp, dropEffect = "move", groupItems = false, dragMonitorId = "", dropMonitorId = "", previewRef = null, dragRef = null, dropRef = null, isDragging = false, isOver = false, dropNotAllowed = false } = props;
  useDeprecatedProps();
  const disabled = !!parentDisabled || !!disabledProp;
  const muted = !!parentMuted || !!ruleGroupProp?.muted;
  const combinator = reactExports.useMemo(() => ruleGroupProp && isRuleGroupType(ruleGroupProp) ? ruleGroupProp.combinator : ruleGroupProp ? getFirstOption(combinators) : combinatorProp ?? getFirstOption(combinators), [
    combinatorProp,
    combinators,
    ruleGroupProp
  ]);
  const ruleGroup = reactExports.useMemo(() => {
    if (ruleGroupProp) {
      if (ruleGroupProp.combinator === combinator || independentCombinators) return ruleGroupProp;
      const newRG = structuredClone(ruleGroupProp);
      newRG.combinator = combinator;
      return newRG;
    }
    return {
      rules: rulesProp,
      not: notProp
    };
  }, [
    combinator,
    independentCombinators,
    notProp,
    ruleGroupProp,
    rulesProp
  ]);
  const classNames = reactExports.useMemo(() => ({
    header: clsx(suppressStandardClassnames || standardClassnames.header, classNamesProp.header, isOver && dropEffect === "copy" && classNamesProp.dndCopy, dropNotAllowed && classNamesProp.dndDropNotAllowed, suppressStandardClassnames || {
      [standardClassnames.dndOver]: isOver,
      [standardClassnames.dndCopy]: isOver && dropEffect === "copy",
      [standardClassnames.dndDropNotAllowed]: dropNotAllowed
    }),
    shiftActions: clsx(suppressStandardClassnames || standardClassnames.shiftActions, classNamesProp.shiftActions),
    dragHandle: clsx(suppressStandardClassnames || standardClassnames.dragHandle, classNamesProp.dragHandle),
    combinators: clsx(suppressStandardClassnames || standardClassnames.combinators, classNamesProp.valueSelector, classNamesProp.combinators),
    notToggle: clsx(suppressStandardClassnames || standardClassnames.notToggle, classNamesProp.notToggle),
    addRule: clsx(suppressStandardClassnames || standardClassnames.addRule, classNamesProp.actionElement, classNamesProp.addRule),
    addGroup: clsx(suppressStandardClassnames || standardClassnames.addGroup, classNamesProp.actionElement, classNamesProp.addGroup),
    cloneGroup: clsx(suppressStandardClassnames || standardClassnames.cloneGroup, classNamesProp.actionElement, classNamesProp.cloneGroup),
    lockGroup: clsx(suppressStandardClassnames || standardClassnames.lockGroup, classNamesProp.actionElement, classNamesProp.lockGroup),
    muteGroup: clsx(suppressStandardClassnames || standardClassnames.muteGroup, classNamesProp.actionElement, classNamesProp.muteGroup),
    removeGroup: clsx(suppressStandardClassnames || standardClassnames.removeGroup, classNamesProp.actionElement, classNamesProp.removeGroup),
    body: clsx(suppressStandardClassnames || standardClassnames.body, classNamesProp.body)
  }), [
    classNamesProp.actionElement,
    classNamesProp.addGroup,
    classNamesProp.addRule,
    classNamesProp.body,
    classNamesProp.cloneGroup,
    classNamesProp.combinators,
    classNamesProp.dndCopy,
    classNamesProp.dndDropNotAllowed,
    classNamesProp.dragHandle,
    classNamesProp.header,
    classNamesProp.lockGroup,
    classNamesProp.muteGroup,
    classNamesProp.notToggle,
    classNamesProp.removeGroup,
    classNamesProp.shiftActions,
    classNamesProp.valueSelector,
    dropEffect,
    dropNotAllowed,
    isOver,
    suppressStandardClassnames
  ]);
  const onCombinatorChange = reactExports.useCallback((value) => {
    if (!disabled) onPropChange("combinator", value, path);
  }, [
    disabled,
    onPropChange,
    path
  ]);
  const onIndependentCombinatorChange = reactExports.useCallback((value, index, _context) => {
    if (!disabled) onPropChange("combinator", value, [...path, index]);
  }, [
    disabled,
    onPropChange,
    path
  ]);
  const onNotToggleChange = reactExports.useCallback((checked, _context) => {
    if (!disabled) onPropChange("not", checked, path);
  }, [
    disabled,
    onPropChange,
    path
  ]);
  const addRule = reactExports.useCallback((_e, context) => {
    if (!disabled) onRuleAdd(createRule(), path, context);
  }, [
    createRule,
    disabled,
    onRuleAdd,
    path
  ]);
  const addGroup = reactExports.useCallback((_e, context) => {
    if (!disabled) onGroupAdd(createRuleGroup(), path, context);
  }, [
    createRuleGroup,
    disabled,
    onGroupAdd,
    path
  ]);
  const cloneGroup = reactExports.useCallback(() => {
    if (!disabled) moveRule(path, [...getParentPath(path), path.at(-1) + 1], true);
  }, [
    disabled,
    moveRule,
    path
  ]);
  const shiftGroupUp = reactExports.useCallback((event, _context) => {
    if (!disabled && !shiftUpDisabled) moveRule(path, "up", event?.altKey);
  }, [
    disabled,
    moveRule,
    path,
    shiftUpDisabled
  ]);
  const shiftGroupDown = reactExports.useCallback((event, _context) => {
    if (!disabled && !shiftDownDisabled) moveRule(path, "down", event?.altKey);
  }, [
    disabled,
    moveRule,
    path,
    shiftDownDisabled
  ]);
  const toggleLockGroup = reactExports.useCallback(() => {
    onPropChange("disabled", !disabled, path);
  }, [
    disabled,
    onPropChange,
    path
  ]);
  const toggleMuteGroup = reactExports.useCallback(() => {
    onPropChange("muted", !ruleGroup.muted, path);
  }, [
    ruleGroup.muted,
    onPropChange,
    path
  ]);
  const removeGroup = reactExports.useCallback(() => {
    if (!disabled) onGroupRemove(path);
  }, [
    disabled,
    onGroupRemove,
    path
  ]);
  const validationResult = validationMap[id ?? ""];
  const validationClassName = reactExports.useMemo(() => getValidationClassNames(validationResult), [validationResult]);
  const combinatorBasedClassName = reactExports.useMemo(() => independentCombinators ? null : getOption(combinators, combinator)?.className ?? "", [
    combinator,
    combinators,
    independentCombinators
  ]);
  const ruleGroupClassname = reactExports.useMemo(() => getRuleGroupClassname(ruleGroup), [getRuleGroupClassname, ruleGroup]);
  const outerClassName = reactExports.useMemo(() => clsx(ruleGroupClassname, combinatorBasedClassName, suppressStandardClassnames || standardClassnames.ruleGroup, classNamesProp.ruleGroup, disabled && classNamesProp.disabled, muted && classNamesProp.muted, isDragging && classNamesProp.dndDragging, isOver && groupItems && classNamesProp.dndGroup, suppressStandardClassnames || {
    [standardClassnames.disabled]: disabled,
    [standardClassnames.muted]: muted,
    [standardClassnames.dndDragging]: isDragging,
    [standardClassnames.dndGroup]: isOver && groupItems
  }, validationClassName), [
    classNamesProp.disabled,
    classNamesProp.muted,
    classNamesProp.dndDragging,
    classNamesProp.dndGroup,
    classNamesProp.ruleGroup,
    combinatorBasedClassName,
    disabled,
    muted,
    groupItems,
    isDragging,
    isOver,
    ruleGroupClassname,
    suppressStandardClassnames,
    validationClassName
  ]);
  const pathsMemo = usePathsMemo({
    disabled,
    disabledPaths,
    path,
    nestedArray: ruleGroup.rules
  });
  const accessibleDescription = reactExports.useMemo(() => accessibleDescriptionGenerator({
    path,
    qbId
  }), [
    accessibleDescriptionGenerator,
    path,
    qbId
  ]);
  return {
    ...props,
    addGroup,
    addRule,
    accessibleDescription,
    classNames,
    cloneGroup,
    combinator,
    disabled,
    dragMonitorId,
    dragRef,
    dropMonitorId,
    dropRef,
    isDragging,
    isOver,
    muted,
    onCombinatorChange,
    onGroupAdd,
    onIndependentCombinatorChange,
    onNotToggleChange,
    outerClassName,
    parentDisabled,
    pathsMemo,
    previewRef,
    removeGroup,
    ruleGroup,
    shiftGroupUp,
    shiftGroupDown,
    toggleLockGroup,
    toggleMuteGroup,
    validationClassName,
    validationResult
  };
};
const ShiftActions = (props) => /* @__PURE__ */ reactExports.createElement("div", {
  "data-testid": props.testID,
  className: props.className
}, /* @__PURE__ */ reactExports.createElement("button", {
  disabled: props.disabled || props.shiftUpDisabled,
  onClick: props.shiftUp,
  title: props.titles?.shiftUp
}, props.labels?.shiftUp), /* @__PURE__ */ reactExports.createElement("button", {
  disabled: props.disabled || props.shiftDownDisabled,
  onClick: props.shiftDown,
  title: props.titles?.shiftDown
}, props.labels?.shiftDown));
const RadioButton = ({ name, disabled, checked, label, handleOnChange }) => {
  const id = reactExports.useId();
  return /* @__PURE__ */ reactExports.createElement("label", { htmlFor: id }, /* @__PURE__ */ reactExports.createElement("input", {
    id,
    type: "radio",
    value: name,
    disabled,
    checked,
    onChange: (e) => handleOnChange(e.target.value)
  }), label);
};
const ValueEditor = (allProps) => {
  const { operator, value, handleOnChange, title, className, type = "text", inputType, values = [], listsAsArrays, fieldData, disabled, separator = null, testID, selectorComponent: SelectorComponent = allProps.schema.controls.valueSelector, parseNumbers: _parseNumbers, skipHook: _skipHook, valueSource: _valueSource, ...propsForValueSelector } = allProps;
  const { valueAsArray, multiValueHandler, bigIntValueHandler, parseNumberMethod, valueListItemClassName, inputTypeCoerced } = useValueEditor(allProps);
  if (operator === "null" || operator === "notNull") return null;
  const placeHolderText = fieldData?.placeholder ?? "";
  if ((operator === "between" || operator === "notBetween") && (type === "select" || type === "text")) {
    const editors = ["from", "to"].map((key, i) => {
      if (type === "text") return /* @__PURE__ */ reactExports.createElement("input", {
        key,
        type: inputTypeCoerced,
        placeholder: placeHolderText,
        value: valueAsArray[i] ?? "",
        className: valueListItemClassName,
        disabled,
        onChange: (e) => multiValueHandler(e.target.value, i)
      });
      return /* @__PURE__ */ reactExports.createElement(SelectorComponent, {
        key,
        ...propsForValueSelector,
        schema: allProps.schema,
        className: valueListItemClassName,
        handleOnChange: (v) => multiValueHandler(v, i),
        disabled,
        value: valueAsArray[i] ?? getFirstOption(values),
        options: values,
        listsAsArrays
      });
    });
    return /* @__PURE__ */ reactExports.createElement("span", {
      "data-testid": testID,
      className,
      title
    }, editors[0], separator, editors[1]);
  }
  switch (type) {
    case "select":
    case "multiselect":
      return /* @__PURE__ */ reactExports.createElement(SelectorComponent, {
        ...propsForValueSelector,
        schema: allProps.schema,
        testID,
        className,
        title,
        handleOnChange,
        disabled,
        value,
        options: values,
        multiple: type === "multiselect",
        listsAsArrays
      });
    case "textarea":
      return /* @__PURE__ */ reactExports.createElement("textarea", {
        "data-testid": testID,
        placeholder: placeHolderText,
        value,
        title,
        className,
        disabled,
        onChange: (e) => handleOnChange(e.target.value)
      });
    case "switch":
    case "checkbox":
      return /* @__PURE__ */ reactExports.createElement("input", {
        "data-testid": testID,
        type: "checkbox",
        className,
        title,
        onChange: (e) => handleOnChange(e.target.checked),
        checked: !!value,
        disabled
      });
    case "radio":
      return /* @__PURE__ */ reactExports.createElement("span", {
        "data-testid": testID,
        className,
        title
      }, values.map((v) => /* @__PURE__ */ reactExports.createElement(RadioButton, {
        key: v.name,
        name: v.name,
        disabled,
        checked: value === v.name,
        handleOnChange,
        label: v.label
      })));
  }
  if (inputType === "bigint") return /* @__PURE__ */ reactExports.createElement("input", {
    "data-testid": testID,
    type: inputTypeCoerced,
    placeholder: placeHolderText,
    value: `${value}`,
    title,
    className,
    disabled,
    onChange: (e) => bigIntValueHandler(e.target.value)
  });
  return /* @__PURE__ */ reactExports.createElement("input", {
    "data-testid": testID,
    type: inputTypeCoerced,
    placeholder: placeHolderText,
    value,
    title,
    className,
    disabled,
    onChange: (e) => handleOnChange(parseNumber(e.target.value, { parseNumbers: parseNumberMethod }))
  });
};
const useValueEditor = (props) => {
  const { handleOnChange, inputType, operator, value, listsAsArrays, parseNumbers, values, type, skipHook, schema: { classNames: classNamesProp, suppressStandardClassnames } } = props;
  reactExports.useEffect(() => {
    if (!skipHook && type !== "multiselect" && ![
      "between",
      "notBetween",
      "in",
      "notIn"
    ].includes(operator) && (Array.isArray(value) || inputType === "number" && typeof value === "string" && value.includes(","))) handleOnChange(toArray(value, { retainEmptyStrings: true })[0] ?? "");
  }, [
    handleOnChange,
    inputType,
    operator,
    skipHook,
    type,
    value
  ]);
  const valueAsArray = reactExports.useMemo(() => toArray(value, { retainEmptyStrings: true }), [value]);
  const parseNumberMethod = reactExports.useMemo(() => getParseNumberMethod({
    parseNumbers,
    inputType
  }), [inputType, parseNumbers]);
  return {
    valueAsArray,
    multiValueHandler: reactExports.useCallback((val, idx) => {
      const v = produce(valueAsArray, (va) => {
        va[idx] = parseNumber(val, { parseNumbers: parseNumberMethod });
        if (idx === 0 && (operator === "between" || operator === "notBetween") && (va.length < 2 || va[1] === void 0)) va[1] = getFirstOption(values);
      });
      handleOnChange(listsAsArrays ? v : joinWith(v, ","));
    }, [
      handleOnChange,
      listsAsArrays,
      operator,
      parseNumberMethod,
      valueAsArray,
      values
    ]),
    bigIntValueHandler: reactExports.useCallback((v) => {
      const valAsMaybeNumber = parseNumber(v, {
        parseNumbers: parseNumberMethod,
        bigIntOnOverflow: true
      });
      let bi;
      try {
        bi = BigInt(valAsMaybeNumber);
      } catch {
        handleOnChange(valAsMaybeNumber);
        return;
      }
      handleOnChange(bi);
    }, [handleOnChange, parseNumberMethod]),
    parseNumberMethod,
    valueListItemClassName: clsx(suppressStandardClassnames || standardClassnames.valueListItem, classNamesProp?.valueListItem),
    inputTypeCoerced: inputType === "bigint" || operator === "in" || operator === "notIn" ? "text" : inputType || "text"
  };
};
const useSelectElementChangeHandler = (params) => {
  const { multiple, onChange } = params;
  return reactExports.useMemo(() => multiple ? (e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value)) : (e) => onChange(e.target.value), [multiple, onChange]);
};
const toOptions = (arr) => isOptionGroupArray(arr) ? arr.map((og) => /* @__PURE__ */ reactExports.createElement("optgroup", {
  key: og.label,
  label: og.label
}, og.options.map((opt) => /* @__PURE__ */ reactExports.createElement("option", {
  key: opt.name,
  value: opt.name,
  disabled: opt.disabled
}, opt.label)))) : Array.isArray(arr) ? arr.map((opt) => /* @__PURE__ */ reactExports.createElement("option", {
  key: opt.name,
  value: opt.name,
  disabled: opt.disabled
}, opt.label)) : null;
const ValueSelector = (props) => {
  const { onChange, val } = useValueSelector(props);
  const selectElementChangeHandler = useSelectElementChangeHandler({
    multiple: props.multiple,
    onChange
  });
  return /* @__PURE__ */ reactExports.createElement("select", {
    "data-testid": props.testID,
    className: props.className,
    value: val,
    title: props.title,
    disabled: props.disabled,
    multiple: !!props.multiple,
    onChange: selectElementChangeHandler
  }, toOptions(props.options));
};
const useValueSelector = (props) => {
  const { handleOnChange, listsAsArrays = false, multiple = false, value } = props;
  return {
    onChange: reactExports.useCallback((v) => {
      if (multiple) {
        const valueAsArray = toArray(v);
        handleOnChange(listsAsArrays ? valueAsArray : joinWith(valueAsArray, ","));
      } else handleOnChange(v);
    }, [
      handleOnChange,
      listsAsArrays,
      multiple
    ]),
    val: reactExports.useMemo(() => multiple ? toArray(value) : value, [multiple, value])
  };
};
const QueryBuilderInternal = ({ props }) => {
  const qb = useQueryBuilder(props);
  const RuleGroupControlElement = qb.schema.controls.ruleGroup;
  const QueryBuilderContext$1 = QueryBuilderContext;
  return /* @__PURE__ */ reactExports.createElement(QueryBuilderContext$1.Provider, {
    key: qb.dndEnabledAttr,
    value: qb.rqbContext
  }, /* @__PURE__ */ reactExports.createElement("div", {
    role: "form",
    className: qb.wrapperClassName,
    "data-dnd": qb.dndEnabledAttr,
    "data-inlinecombinators": qb.inlineCombinatorsAttr
  }, /* @__PURE__ */ reactExports.createElement(RuleGroupControlElement, {
    translations: qb.translations,
    ruleGroup: qb.rootGroup,
    rules: qb.rootGroup.rules,
    ...qb.combinatorPropObject,
    not: !!qb.rootGroup.not,
    schema: qb.schema,
    actions: qb.actions,
    id: qb.rootGroup.id,
    path: rootPath,
    disabled: qb.rootGroupDisabled,
    shiftUpDisabled: true,
    shiftDownDisabled: true,
    parentDisabled: qb.queryDisabled,
    context: props.context
  })));
};
const nullComp = () => null;
const nullFwdComp = reactExports.forwardRef(nullComp);
const emptyObject = {};
const useMergedContext = ({ finalize, ...props }) => {
  const rqbContext = reactExports.useContext(QueryBuilderContext);
  const queryBuilderFlags = reactExports.useMemo(() => preferFlagProps(props, rqbContext), [
    props,
    rqbContext,
    finalize
  ]);
  const enableDragAndDrop = finalize ? rqbContext.enableDragAndDrop !== false && preferProp(false, props.enableDragAndDrop, rqbContext.enableDragAndDrop) : props.enableDragAndDrop ?? rqbContext.enableDragAndDrop;
  const cc = reactExports.useMemo(() => mergeClassnames(Object.assign({}, defaultControlClassnames), rqbContext.controlClassnames, props.controlClassnames), [
    rqbContext.controlClassnames,
    props.controlClassnames,
    finalize
  ]);
  const controlClassnames = reactExports.useMemo(() => ({
    actionElement: cc.actionElement,
    addGroup: cc.addGroup,
    addRule: cc.addRule,
    body: cc.body,
    cloneGroup: cc.cloneGroup,
    cloneRule: cc.cloneRule,
    combinators: cc.combinators,
    dragHandle: cc.dragHandle,
    fields: cc.fields,
    header: cc.header,
    lockGroup: cc.lockGroup,
    lockRule: cc.lockRule,
    muteGroup: cc.muteGroup,
    muteRule: cc.muteRule,
    muted: cc.muted,
    notToggle: cc.notToggle,
    operators: cc.operators,
    queryBuilder: cc.queryBuilder,
    removeGroup: cc.removeGroup,
    removeRule: cc.removeRule,
    rule: cc.rule,
    ruleGroup: cc.ruleGroup,
    shiftActions: cc.shiftActions,
    value: cc.value,
    valueSelector: cc.valueSelector,
    valueSource: cc.valueSource,
    betweenRules: cc.betweenRules,
    valid: cc.valid,
    invalid: cc.invalid,
    dndDragging: cc.dndDragging,
    dndOver: cc.dndOver,
    dndCopy: cc.dndCopy,
    dndGroup: cc.dndGroup,
    dndDropNotAllowed: cc.dndDropNotAllowed,
    disabled: cc.disabled,
    valueListItem: cc.valueListItem,
    matchMode: cc.matchMode,
    matchThreshold: cc.matchThreshold,
    branches: cc.branches,
    hasSubQuery: cc.hasSubQuery,
    loading: cc.loading
  }), [
    cc.actionElement,
    cc.addGroup,
    cc.addRule,
    cc.betweenRules,
    cc.body,
    cc.branches,
    cc.cloneGroup,
    cc.cloneRule,
    cc.combinators,
    cc.disabled,
    cc.dndCopy,
    cc.dndDropNotAllowed,
    cc.dndGroup,
    cc.dndDragging,
    cc.dndOver,
    cc.dragHandle,
    cc.fields,
    cc.hasSubQuery,
    cc.header,
    cc.invalid,
    cc.loading,
    cc.lockGroup,
    cc.lockRule,
    cc.muteGroup,
    cc.muteRule,
    cc.muted,
    cc.matchMode,
    cc.matchThreshold,
    cc.notToggle,
    cc.operators,
    cc.queryBuilder,
    cc.removeGroup,
    cc.removeRule,
    cc.rule,
    cc.ruleGroup,
    cc.shiftActions,
    cc.valid,
    cc.value,
    cc.valueListItem,
    cc.valueSelector,
    cc.valueSource
  ]);
  const contextCE = rqbContext.controlElements ?? emptyObject;
  const propsCE = props.controlElements ?? emptyObject;
  const mergeControlElement = reactExports.useCallback((name, propComp, contextComp) => {
    const nc = name === "dragHandle" ? nullFwdComp : nullComp;
    const propBulkOverride = (name.endsWith("Action") && propsCE.actionElement ? propsCE.actionElement : void 0) ?? (name.endsWith("Selector") && propsCE.valueSelector ? propsCE.valueSelector : void 0);
    const contextBulkOverride = (name.endsWith("Action") && contextCE.actionElement ? contextCE.actionElement : void 0) ?? (name.endsWith("Selector") && contextCE.valueSelector ? contextCE.valueSelector : void 0);
    const comp = propComp === null ? nc : propComp ?? propBulkOverride ?? (contextComp === null ? nc : contextComp ?? contextBulkOverride);
    return comp ? { [name]: comp } : { [name]: defaultControlElements[name] };
  }, [
    contextCE.actionElement,
    contextCE.valueSelector,
    finalize,
    propsCE.actionElement,
    propsCE.valueSelector
  ]);
  const controlElements = reactExports.useMemo(() => Object.assign({}, mergeControlElement("addGroupAction", propsCE.addGroupAction, contextCE.addGroupAction), mergeControlElement("addRuleAction", propsCE.addRuleAction, contextCE.addRuleAction), mergeControlElement("cloneGroupAction", propsCE.cloneGroupAction, contextCE.cloneGroupAction), mergeControlElement("cloneRuleAction", propsCE.cloneRuleAction, contextCE.cloneRuleAction), mergeControlElement("combinatorSelector", propsCE.combinatorSelector, contextCE.combinatorSelector), mergeControlElement("dragHandle", propsCE.dragHandle, contextCE.dragHandle), mergeControlElement("fieldSelector", propsCE.fieldSelector, contextCE.fieldSelector), mergeControlElement("inlineCombinator", propsCE.inlineCombinator, contextCE.inlineCombinator), mergeControlElement("lockGroupAction", propsCE.lockGroupAction, contextCE.lockGroupAction), mergeControlElement("lockRuleAction", propsCE.lockRuleAction, contextCE.lockRuleAction), mergeControlElement("muteGroupAction", propsCE.muteGroupAction, contextCE.muteGroupAction), mergeControlElement("muteRuleAction", propsCE.muteRuleAction, contextCE.muteRuleAction), mergeControlElement("notToggle", propsCE.notToggle, contextCE.notToggle), mergeControlElement("operatorSelector", propsCE.operatorSelector, contextCE.operatorSelector), mergeControlElement("removeGroupAction", propsCE.removeGroupAction, contextCE.removeGroupAction), mergeControlElement("removeRuleAction", propsCE.removeRuleAction, contextCE.removeRuleAction), mergeControlElement("shiftActions", propsCE.shiftActions, contextCE.shiftActions), { valueEditor: propsCE.valueEditor === null ? nullComp : propsCE.valueEditor ?? (contextCE.valueEditor === null ? nullComp : contextCE.valueEditor) ?? defaultControlElements.valueEditor }, mergeControlElement("valueSourceSelector", propsCE.valueSourceSelector, contextCE.valueSourceSelector), mergeControlElement("matchModeEditor", propsCE.matchModeEditor, contextCE.matchModeEditor), mergeControlElement("rule", propsCE.rule, contextCE.rule), mergeControlElement("ruleGroup", propsCE.ruleGroup, contextCE.ruleGroup), mergeControlElement("ruleGroupBodyElements", propsCE.ruleGroupBodyElements, contextCE.ruleGroupBodyElements), mergeControlElement("ruleGroupHeaderElements", propsCE.ruleGroupHeaderElements, contextCE.ruleGroupHeaderElements), { actionElement: propsCE.actionElement ?? contextCE.actionElement ?? defaultControlElements.actionElement }, { valueSelector: propsCE.valueSelector ?? contextCE.valueSelector ?? defaultControlElements.valueSelector }), [
    contextCE.actionElement,
    contextCE.addGroupAction,
    contextCE.addRuleAction,
    contextCE.cloneGroupAction,
    contextCE.cloneRuleAction,
    contextCE.combinatorSelector,
    contextCE.dragHandle,
    contextCE.fieldSelector,
    contextCE.inlineCombinator,
    contextCE.lockGroupAction,
    contextCE.lockRuleAction,
    contextCE.muteGroupAction,
    contextCE.muteRuleAction,
    contextCE.matchModeEditor,
    contextCE.notToggle,
    contextCE.operatorSelector,
    contextCE.removeGroupAction,
    contextCE.removeRuleAction,
    contextCE.rule,
    contextCE.ruleGroup,
    contextCE.ruleGroupBodyElements,
    contextCE.ruleGroupHeaderElements,
    contextCE.shiftActions,
    contextCE.valueEditor,
    contextCE.valueSelector,
    contextCE.valueSourceSelector,
    mergeControlElement,
    finalize,
    propsCE.actionElement,
    propsCE.addGroupAction,
    propsCE.addRuleAction,
    propsCE.cloneGroupAction,
    propsCE.cloneRuleAction,
    propsCE.combinatorSelector,
    propsCE.dragHandle,
    propsCE.fieldSelector,
    propsCE.inlineCombinator,
    propsCE.lockGroupAction,
    propsCE.lockRuleAction,
    propsCE.muteGroupAction,
    propsCE.muteRuleAction,
    propsCE.matchModeEditor,
    propsCE.notToggle,
    propsCE.operatorSelector,
    propsCE.removeGroupAction,
    propsCE.removeRuleAction,
    propsCE.rule,
    propsCE.ruleGroup,
    propsCE.ruleGroupBodyElements,
    propsCE.ruleGroupHeaderElements,
    propsCE.shiftActions,
    propsCE.valueEditor,
    propsCE.valueSelector,
    propsCE.valueSourceSelector
  ]);
  const propsT = props.translations ?? emptyObject;
  const contextT = rqbContext.translations ?? emptyObject;
  const translations = reactExports.useMemo(() => Object.assign({}, mergeAnyTranslation("addGroup", {
    label: [propsT.addGroup?.label, contextT.addGroup?.label],
    title: [propsT.addGroup?.title, contextT.addGroup?.title]
  }, defaultTranslations), mergeAnyTranslation("addRule", {
    label: [propsT.addRule?.label, contextT.addRule?.label],
    title: [propsT.addRule?.title, contextT.addRule?.title]
  }, defaultTranslations), mergeAnyTranslation("cloneRule", {
    label: [propsT.cloneRule?.label, contextT.cloneRule?.label],
    title: [propsT.cloneRule?.title, contextT.cloneRule?.title]
  }, defaultTranslations), mergeAnyTranslation("cloneRuleGroup", {
    label: [propsT.cloneRuleGroup?.label, contextT.cloneRuleGroup?.label],
    title: [propsT.cloneRuleGroup?.title, contextT.cloneRuleGroup?.title]
  }, defaultTranslations), mergeAnyTranslation("combinators", { title: [propsT.combinators?.title, contextT.combinators?.title] }, defaultTranslations), mergeAnyTranslation("dragHandle", {
    label: [propsT.dragHandle?.label, contextT.dragHandle?.label],
    title: [propsT.dragHandle?.title, contextT.dragHandle?.title]
  }, defaultTranslations), mergeAnyTranslation("fields", {
    placeholderGroupLabel: [propsT.fields?.placeholderGroupLabel, contextT.fields?.placeholderGroupLabel],
    placeholderLabel: [propsT.fields?.placeholderLabel, contextT.fields?.placeholderLabel],
    placeholderName: [propsT.fields?.placeholderName, contextT.fields?.placeholderName],
    title: [propsT.fields?.title, contextT.fields?.title]
  }, defaultTranslations), mergeAnyTranslation("lockGroup", {
    label: [propsT.lockGroup?.label, contextT.lockGroup?.label],
    title: [propsT.lockGroup?.title, contextT.lockGroup?.title]
  }, defaultTranslations), mergeAnyTranslation("lockGroupDisabled", {
    label: [propsT.lockGroupDisabled?.label, contextT.lockGroupDisabled?.label],
    title: [propsT.lockGroupDisabled?.title, contextT.lockGroupDisabled?.title]
  }, defaultTranslations), mergeAnyTranslation("lockRule", {
    label: [propsT.lockRule?.label, contextT.lockRule?.label],
    title: [propsT.lockRule?.title, contextT.lockRule?.title]
  }, defaultTranslations), mergeAnyTranslation("lockRuleDisabled", {
    label: [propsT.lockRuleDisabled?.label, contextT.lockRuleDisabled?.label],
    title: [propsT.lockRuleDisabled?.title, contextT.lockRuleDisabled?.title]
  }, defaultTranslations), mergeAnyTranslation("muteGroup", {
    label: [propsT.muteGroup?.label, contextT.muteGroup?.label],
    title: [propsT.muteGroup?.title, contextT.muteGroup?.title]
  }, defaultTranslations), mergeAnyTranslation("unmuteGroup", {
    label: [propsT.unmuteGroup?.label, contextT.unmuteGroup?.label],
    title: [propsT.unmuteGroup?.title, contextT.unmuteGroup?.title]
  }, defaultTranslations), mergeAnyTranslation("muteRule", {
    label: [propsT.muteRule?.label, contextT.muteRule?.label],
    title: [propsT.muteRule?.title, contextT.muteRule?.title]
  }, defaultTranslations), mergeAnyTranslation("unmuteRule", {
    label: [propsT.unmuteRule?.label, contextT.unmuteRule?.label],
    title: [propsT.unmuteRule?.title, contextT.unmuteRule?.title]
  }, defaultTranslations), mergeAnyTranslation("notToggle", {
    label: [propsT.notToggle?.label, contextT.notToggle?.label],
    title: [propsT.notToggle?.title, contextT.notToggle?.title]
  }, defaultTranslations), mergeAnyTranslation("operators", {
    placeholderGroupLabel: [propsT.operators?.placeholderGroupLabel, contextT.operators?.placeholderGroupLabel],
    placeholderLabel: [propsT.operators?.placeholderLabel, contextT.operators?.placeholderLabel],
    placeholderName: [propsT.operators?.placeholderName, contextT.operators?.placeholderName],
    title: [propsT.operators?.title, contextT.operators?.title]
  }, defaultTranslations), mergeAnyTranslation("values", {
    placeholderGroupLabel: [propsT.values?.placeholderGroupLabel, contextT.values?.placeholderGroupLabel],
    placeholderLabel: [propsT.values?.placeholderLabel, contextT.values?.placeholderLabel],
    placeholderName: [propsT.values?.placeholderName, contextT.values?.placeholderName],
    title: [propsT.values?.title, contextT.values?.title]
  }, defaultTranslations), mergeAnyTranslation("removeGroup", {
    label: [propsT.removeGroup?.label, contextT.removeGroup?.label],
    title: [propsT.removeGroup?.title, contextT.removeGroup?.title]
  }, defaultTranslations), mergeAnyTranslation("removeRule", {
    label: [propsT.removeRule?.label, contextT.removeRule?.label],
    title: [propsT.removeRule?.title, contextT.removeRule?.title]
  }, defaultTranslations), mergeAnyTranslation("shiftActionDown", {
    label: [propsT.shiftActionDown?.label, contextT.shiftActionDown?.label],
    title: [propsT.shiftActionDown?.title, contextT.shiftActionDown?.title]
  }, defaultTranslations), mergeAnyTranslation("shiftActionUp", {
    label: [propsT.shiftActionUp?.label, contextT.shiftActionUp?.label],
    title: [propsT.shiftActionUp?.title, contextT.shiftActionUp?.title]
  }, defaultTranslations), mergeAnyTranslation("matchMode", { title: [propsT.matchMode?.title, contextT.matchMode?.title] }, defaultTranslations), mergeAnyTranslation("matchThreshold", { title: [propsT.matchThreshold?.title, contextT.matchThreshold?.title] }, defaultTranslations), mergeAnyTranslation("value", { title: [propsT.value?.title, contextT.value?.title] }, defaultTranslations), mergeAnyTranslation("valueSourceSelector", { title: [propsT.valueSourceSelector?.title, contextT.valueSourceSelector?.title] }, defaultTranslations)), [
    contextT.addGroup?.label,
    contextT.addGroup?.title,
    contextT.addRule?.label,
    contextT.addRule?.title,
    contextT.cloneRule?.label,
    contextT.cloneRule?.title,
    contextT.cloneRuleGroup?.label,
    contextT.cloneRuleGroup?.title,
    contextT.combinators?.title,
    contextT.dragHandle?.label,
    contextT.dragHandle?.title,
    contextT.fields?.placeholderGroupLabel,
    contextT.fields?.placeholderLabel,
    contextT.fields?.placeholderName,
    contextT.fields?.title,
    contextT.lockGroup?.label,
    contextT.lockGroup?.title,
    contextT.lockGroupDisabled?.label,
    contextT.lockGroupDisabled?.title,
    contextT.lockRule?.label,
    contextT.lockRule?.title,
    contextT.lockRuleDisabled?.label,
    contextT.lockRuleDisabled?.title,
    contextT.muteGroup?.label,
    contextT.muteGroup?.title,
    contextT.unmuteGroup?.label,
    contextT.unmuteGroup?.title,
    contextT.muteRule?.label,
    contextT.muteRule?.title,
    contextT.unmuteRule?.label,
    contextT.unmuteRule?.title,
    contextT.matchMode?.title,
    contextT.matchThreshold?.title,
    contextT.notToggle?.label,
    contextT.notToggle?.title,
    contextT.operators?.placeholderGroupLabel,
    contextT.operators?.placeholderLabel,
    contextT.operators?.placeholderName,
    contextT.operators?.title,
    contextT.removeGroup?.label,
    contextT.removeGroup?.title,
    contextT.removeRule?.label,
    contextT.removeRule?.title,
    contextT.shiftActionDown?.label,
    contextT.shiftActionDown?.title,
    contextT.shiftActionUp?.label,
    contextT.shiftActionUp?.title,
    contextT.value?.title,
    contextT.values?.placeholderGroupLabel,
    contextT.values?.placeholderLabel,
    contextT.values?.placeholderName,
    contextT.values?.title,
    contextT.valueSourceSelector?.title,
    finalize,
    propsT.addGroup?.label,
    propsT.addGroup?.title,
    propsT.addRule?.label,
    propsT.addRule?.title,
    propsT.cloneRule?.label,
    propsT.cloneRule?.title,
    propsT.cloneRuleGroup?.label,
    propsT.cloneRuleGroup?.title,
    propsT.combinators?.title,
    propsT.dragHandle?.label,
    propsT.dragHandle?.title,
    propsT.fields?.placeholderGroupLabel,
    propsT.fields?.placeholderLabel,
    propsT.fields?.placeholderName,
    propsT.fields?.title,
    propsT.lockGroup?.label,
    propsT.lockGroup?.title,
    propsT.lockGroupDisabled?.label,
    propsT.lockGroupDisabled?.title,
    propsT.lockRule?.label,
    propsT.lockRule?.title,
    propsT.lockRuleDisabled?.label,
    propsT.lockRuleDisabled?.title,
    propsT.muteGroup?.label,
    propsT.muteGroup?.title,
    propsT.unmuteGroup?.label,
    propsT.unmuteGroup?.title,
    propsT.muteRule?.label,
    propsT.muteRule?.title,
    propsT.unmuteRule?.label,
    propsT.unmuteRule?.title,
    propsT.matchMode?.title,
    propsT.matchThreshold?.title,
    propsT.notToggle?.label,
    propsT.notToggle?.title,
    propsT.operators?.placeholderGroupLabel,
    propsT.operators?.placeholderLabel,
    propsT.operators?.placeholderName,
    propsT.operators?.title,
    propsT.removeGroup?.label,
    propsT.removeGroup?.title,
    propsT.removeRule?.label,
    propsT.removeRule?.title,
    propsT.shiftActionDown?.label,
    propsT.shiftActionDown?.title,
    propsT.shiftActionUp?.label,
    propsT.shiftActionUp?.title,
    propsT.value?.title,
    propsT.values?.placeholderGroupLabel,
    propsT.values?.placeholderLabel,
    propsT.values?.placeholderName,
    propsT.values?.title,
    propsT.valueSourceSelector?.title
  ]);
  return {
    ...queryBuilderFlags,
    controlClassnames,
    controlElements,
    enableDragAndDrop,
    translations,
    initialQuery: props.initialQuery,
    qbId: props.qbId
  };
};
const usePathsMemo = ({ disabled, path, nestedArray, disabledPaths }) => {
  const nestedArrayLength = nestedArray.length;
  return reactExports.useMemo(() => {
    const paths = [];
    for (let i = 0; i < nestedArrayLength; i++) {
      const thisPath = [...path, i];
      paths[i] = {
        path: thisPath,
        disabled: disabled || disabledPaths.some((p) => pathsAreEqual(thisPath, p))
      };
    }
    return paths;
  }, [
    disabled,
    path,
    nestedArrayLength,
    disabledPaths
  ]);
};
const useStopEventPropagation = (method) => reactExports.useCallback((event, context) => {
  event?.preventDefault();
  event?.stopPropagation();
  method(event, context);
}, [method]);
const defaultMatch = { mode: "all" };
const defaultSubproperties = [{
  name: "",
  value: "",
  label: ""
}];
const Rule = reactExports.memo(function Rule$1(props) {
  const r = useRule(props);
  const cloneRule = useStopEventPropagation(r.cloneRule);
  const toggleLockRule = useStopEventPropagation(r.toggleLockRule);
  const toggleMuteRule = useStopEventPropagation(r.toggleMuteRule);
  const removeRule = useStopEventPropagation(r.removeRule);
  const shiftRuleUp = useStopEventPropagation(r.shiftRuleUp);
  const shiftRuleDown = useStopEventPropagation(r.shiftRuleDown);
  const actions = reactExports.useMemo(() => ({
    cloneRule,
    toggleLockRule,
    toggleMuteRule,
    removeRule,
    shiftRuleUp,
    shiftRuleDown
  }), [
    cloneRule,
    removeRule,
    shiftRuleDown,
    shiftRuleUp,
    toggleLockRule,
    toggleMuteRule
  ]);
  return /* @__PURE__ */ reactExports.createElement("div", {
    ref: r.dndRef,
    "data-testid": TestID.rule,
    "data-dragmonitorid": r.dragMonitorId,
    "data-dropmonitorid": r.dropMonitorId,
    className: r.outerClassName,
    "data-rule-id": r.id,
    "data-level": r.path.length,
    "data-path": JSON.stringify(r.path)
  }, r.matchModes.length > 0 ? /* @__PURE__ */ reactExports.createElement(RuleComponentsWithSubQuery, {
    ...r,
    ...actions
  }) : /* @__PURE__ */ reactExports.createElement(RuleComponents, {
    ...r,
    ...actions
  }));
});
const RuleComponents = reactExports.memo(function RuleComponents$1(r) {
  const { schema: { controls: { shiftActions: ShiftActionsControlElement, dragHandle: DragHandleControlElement, fieldSelector: FieldSelectorControlElement, matchModeEditor: MatchModeEditorControlElement, operatorSelector: OperatorSelectorControlElement, valueSourceSelector: ValueSourceSelectorControlElement, valueEditor: ValueEditorControlElement, cloneRuleAction: CloneRuleActionControlElement, lockRuleAction: LockRuleActionControlElement, muteRuleAction: MuteRuleActionControlElement, removeRuleAction: RemoveRuleActionControlElement, ruleGroupBodyElements: RuleGroupBodyControlElements, ruleGroupHeaderElements: RuleGroupHeaderControlElements } }, groupComponentsWrapper: GroupComponentsWrapper = reactExports.Fragment } = r;
  const commonSubcomponentProps = reactExports.useMemo(() => ({
    level: r.path.length,
    path: r.path,
    disabled: r.disabled,
    context: r.context,
    validation: r.validationResult,
    schema: r.schema,
    rule: r.rule
  }), [
    r.path,
    r.disabled,
    r.context,
    r.validationResult,
    r.schema,
    r.rule
  ]);
  const showFieldSelector = reactExports.useMemo(() => !(r.schema.fields.length === 1 && isPojo(r.schema.fields[0]) && "value" in r.schema.fields[0] && r.schema.fields[0].value === ""), [r.schema.fields]);
  const shiftTitles = reactExports.useMemo(() => r.schema.showShiftActions ? {
    shiftUp: r.translations.shiftActionUp.title,
    shiftDown: r.translations.shiftActionDown.title
  } : void 0, [r.schema.showShiftActions, r.translations]);
  const shiftLabels = reactExports.useMemo(() => r.schema.showShiftActions ? {
    shiftUp: r.translations.shiftActionUp.label,
    shiftDown: r.translations.shiftActionDown.label
  } : void 0, [r.schema.showShiftActions, r.translations]);
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, r.schema.showShiftActions && /* @__PURE__ */ reactExports.createElement(ShiftActionsControlElement, {
    key: TestID.shiftActions,
    ...commonSubcomponentProps,
    testID: TestID.shiftActions,
    titles: shiftTitles,
    labels: shiftLabels,
    className: r.classNames.shiftActions,
    ruleOrGroup: r.rule,
    shiftUp: r.shiftRuleUp,
    shiftDown: r.shiftRuleDown,
    shiftUpDisabled: r.shiftUpDisabled,
    shiftDownDisabled: r.shiftDownDisabled
  }), r.schema.enableDragAndDrop && /* @__PURE__ */ reactExports.createElement(DragHandleControlElement, {
    key: TestID.dragHandle,
    ...commonSubcomponentProps,
    testID: TestID.dragHandle,
    ref: r.dragRef,
    title: r.translations.dragHandle.title,
    label: r.translations.dragHandle.label,
    className: r.classNames.dragHandle,
    ruleOrGroup: r.rule
  }), showFieldSelector && /* @__PURE__ */ reactExports.createElement(FieldSelectorControlElement, {
    key: TestID.fields,
    ...commonSubcomponentProps,
    testID: TestID.fields,
    options: r.schema.fields,
    title: r.translations.fields.title,
    value: r.rule.field,
    operator: r.rule.operator,
    className: r.classNames.fields,
    handleOnChange: r.onChangeField
  }), (r.schema.autoSelectField || r.rule.field !== r.translations.fields.placeholderName) && (r.subQuery ? /* @__PURE__ */ reactExports.createElement(MatchModeEditorControlElement, {
    key: TestID.matchModeEditor,
    ...commonSubcomponentProps,
    testID: TestID.matchModeEditor,
    field: r.rule.field,
    fieldData: r.fieldData,
    title: r.translations.matchMode.title,
    options: r.matchModes,
    match: r.rule.match ?? defaultMatch,
    className: r.classNames.matchMode,
    classNames: r.classNames,
    handleOnChange: r.onChangeMatchMode
  }) : /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement(OperatorSelectorControlElement, {
    key: TestID.operators,
    ...commonSubcomponentProps,
    testID: TestID.operators,
    field: r.rule.field,
    fieldData: r.fieldData,
    title: r.translations.operators.title,
    options: r.operators,
    value: r.rule.operator,
    className: r.classNames.operators,
    handleOnChange: r.onChangeOperator
  }), (r.schema.autoSelectOperator || r.rule.operator !== r.translations.operators.placeholderName) && !r.hideValueControls && /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, !["null", "notnull"].includes(lc(`${r.rule.operator}`)) && r.valueSources.length > 1 && /* @__PURE__ */ reactExports.createElement(ValueSourceSelectorControlElement, {
    key: TestID.valueSourceSelector,
    ...commonSubcomponentProps,
    testID: TestID.valueSourceSelector,
    field: r.rule.field,
    fieldData: r.fieldData,
    title: r.translations.valueSourceSelector.title,
    options: r.valueSourceOptions,
    value: r.rule.valueSource ?? "value",
    className: r.classNames.valueSource,
    handleOnChange: r.onChangeValueSource
  }), /* @__PURE__ */ reactExports.createElement(ValueEditorControlElement, {
    key: TestID.valueEditor,
    ...commonSubcomponentProps,
    testID: TestID.valueEditor,
    field: r.rule.field,
    fieldData: r.fieldData,
    title: r.translations.value.title,
    operator: r.rule.operator,
    value: r.rule.value,
    valueSource: r.rule.valueSource ?? "value",
    type: r.valueEditorType,
    inputType: r.inputType,
    values: r.values,
    listsAsArrays: r.schema.listsAsArrays,
    parseNumbers: r.schema.parseNumbers,
    separator: r.valueEditorSeparator,
    className: r.classNames.value,
    handleOnChange: r.onChangeValue
  })))), r.subQuery && /* @__PURE__ */ reactExports.createElement(GroupComponentsWrapper, { className: r.subQuery.classNames.header }, /* @__PURE__ */ reactExports.createElement(RuleGroupHeaderControlElements, r.subQuery)), r.schema.showCloneButtons && /* @__PURE__ */ reactExports.createElement(CloneRuleActionControlElement, {
    key: TestID.cloneRule,
    ...commonSubcomponentProps,
    testID: TestID.cloneRule,
    label: r.translations.cloneRule.label,
    title: r.translations.cloneRule.title,
    className: r.classNames.cloneRule,
    ruleOrGroup: r.rule,
    handleOnClick: r.cloneRule
  }), r.schema.showLockButtons && /* @__PURE__ */ reactExports.createElement(LockRuleActionControlElement, {
    key: TestID.lockRule,
    ...commonSubcomponentProps,
    testID: TestID.lockRule,
    label: r.translations.lockRule.label,
    title: r.translations.lockRule.title,
    className: r.classNames.lockRule,
    ruleOrGroup: r.rule,
    handleOnClick: r.toggleLockRule,
    disabledTranslation: r.parentDisabled ? void 0 : r.translations.lockRuleDisabled
  }), r.schema.showMuteButtons && /* @__PURE__ */ reactExports.createElement(MuteRuleActionControlElement, {
    key: TestID.muteRule,
    ...commonSubcomponentProps,
    testID: TestID.muteRule,
    label: r.rule.muted ? r.translations.unmuteRule.label : r.translations.muteRule.label,
    title: r.rule.muted ? r.translations.unmuteRule.title : r.translations.muteRule.title,
    className: r.classNames.muteRule,
    ruleOrGroup: r.rule,
    handleOnClick: r.toggleMuteRule
  }), /* @__PURE__ */ reactExports.createElement(RemoveRuleActionControlElement, {
    key: TestID.removeRule,
    ...commonSubcomponentProps,
    testID: TestID.removeRule,
    label: r.translations.removeRule.label,
    title: r.translations.removeRule.title,
    className: r.classNames.removeRule,
    ruleOrGroup: r.rule,
    handleOnClick: r.removeRule
  }), r.subQuery && /* @__PURE__ */ reactExports.createElement(GroupComponentsWrapper, { className: r.subQuery.classNames.body }, /* @__PURE__ */ reactExports.createElement(RuleGroupBodyControlElements, r.subQuery)));
});
const RuleWithSubQueryGroupComponentsWrapper = (props) => /* @__PURE__ */ reactExports.createElement("div", props);
const RuleComponentsWithSubQuery = reactExports.memo(function RuleComponentsWithSubQuery$1(r) {
  const initialQuery = reactExports.useMemo(() => r.schema.createRuleGroup(), [r.schema]);
  const subQB = useQueryBuilder({
    ...r.subQueryBuilderProps,
    enableDragAndDrop: false,
    disabled: r.disabled,
    fields: r.subproperties.fields,
    enableMountQueryChange: !isRuleGroup(r.rule.value) || !r.rule.value.id,
    query: isRuleGroup(r.rule.value) ? r.rule.value : initialQuery,
    onQueryChange: r.onChangeValue
  });
  const subQuery = useRuleGroup({
    ...subQB,
    ruleGroup: subQB.rootGroup,
    path: rootPath,
    disabled: r.disabled,
    parentDisabled: subQB.queryDisabled,
    id: subQB.rootGroup.id,
    shiftUpDisabled: true,
    shiftDownDisabled: true
  });
  const addRule = useStopEventPropagation(subQuery.addRule);
  const addGroup = useStopEventPropagation(subQuery.addGroup);
  const cloneGroup = useStopEventPropagation(subQuery.cloneGroup);
  const toggleLockGroup = useStopEventPropagation(subQuery.toggleLockGroup);
  const removeGroup = useStopEventPropagation(subQuery.removeGroup);
  const shiftGroupUp = useStopEventPropagation(subQuery.shiftGroupUp);
  const shiftGroupDown = useStopEventPropagation(subQuery.shiftGroupDown);
  const memoizedSubQuery = reactExports.useMemo(() => ({
    ...subQuery,
    addGroup,
    addRule,
    cloneGroup,
    removeGroup,
    shiftGroupDown,
    shiftGroupUp,
    toggleLockGroup
  }), [
    addGroup,
    addRule,
    cloneGroup,
    removeGroup,
    shiftGroupDown,
    shiftGroupUp,
    subQuery,
    toggleLockGroup
  ]);
  return /* @__PURE__ */ reactExports.createElement(RuleComponents, {
    ...r,
    groupComponentsWrapper: r.groupComponentsWrapper ?? RuleWithSubQueryGroupComponentsWrapper,
    subQuery: memoizedSubQuery
  });
});
const useRule = (props) => {
  const { id, path, rule: ruleProp, schema: { classNames: classNamesProp, fields, fieldMap, getInputType, getMatchModes, getOperators, getSubQueryBuilderProps, getValueEditorType, getValueEditorSeparator, getValueSources, getValues, validationMap, enableDragAndDrop, getRuleClassname, suppressStandardClassnames }, actions: { moveRule, onPropChange, onRuleRemove }, disabled: disabledProp, parentDisabled, parentMuted, shiftUpDisabled, shiftDownDisabled, field: fieldProp, operator: operatorProp, value: valueProp, valueSource: valueSourceProp, dropEffect = "move", groupItems = false, dragMonitorId = "", dropMonitorId = "", dndRef = null, dragRef = null, isDragging = false, isOver = false, dropNotAllowed = false } = props;
  useDeprecatedProps();
  const disabled = !!parentDisabled || !!disabledProp;
  const muted = !!parentMuted || !!ruleProp?.muted;
  const rule = reactExports.useMemo(() => ruleProp ?? {
    id,
    field: fieldProp ?? "",
    operator: operatorProp ?? "",
    value: valueProp,
    valueSource: valueSourceProp
  }, [
    fieldProp,
    id,
    operatorProp,
    ruleProp,
    valueProp,
    valueSourceProp
  ]);
  const classNames = reactExports.useMemo(() => ({
    shiftActions: clsx(suppressStandardClassnames || standardClassnames.shiftActions, classNamesProp.shiftActions),
    dragHandle: clsx(suppressStandardClassnames || standardClassnames.dragHandle, classNamesProp.dragHandle),
    fields: clsx(suppressStandardClassnames || standardClassnames.fields, classNamesProp.valueSelector, classNamesProp.fields),
    matchMode: clsx(suppressStandardClassnames || standardClassnames.matchMode, classNamesProp.valueSelector, classNamesProp.matchMode),
    matchThreshold: clsx(suppressStandardClassnames || standardClassnames.matchThreshold, classNamesProp.valueSelector, classNamesProp.matchThreshold),
    operators: clsx(suppressStandardClassnames || standardClassnames.operators, classNamesProp.valueSelector, classNamesProp.operators),
    valueSource: clsx(suppressStandardClassnames || standardClassnames.valueSource, classNamesProp.valueSelector, classNamesProp.valueSource),
    value: clsx(suppressStandardClassnames || standardClassnames.value, classNamesProp.value),
    cloneRule: clsx(suppressStandardClassnames || standardClassnames.cloneRule, classNamesProp.actionElement, classNamesProp.cloneRule),
    lockRule: clsx(suppressStandardClassnames || standardClassnames.lockRule, classNamesProp.actionElement, classNamesProp.lockRule),
    muteRule: clsx(suppressStandardClassnames || standardClassnames.muteRule, classNamesProp.actionElement, classNamesProp.muteRule),
    removeRule: clsx(suppressStandardClassnames || standardClassnames.removeRule, classNamesProp.actionElement, classNamesProp.removeRule),
    valueListItem: clsx(suppressStandardClassnames || standardClassnames.valueListItem, classNamesProp.valueListItem)
  }), [
    classNamesProp.shiftActions,
    classNamesProp.dragHandle,
    classNamesProp.valueSelector,
    classNamesProp.fields,
    classNamesProp.matchMode,
    classNamesProp.matchThreshold,
    classNamesProp.operators,
    classNamesProp.valueSource,
    classNamesProp.value,
    classNamesProp.actionElement,
    classNamesProp.cloneRule,
    classNamesProp.lockRule,
    classNamesProp.muteRule,
    classNamesProp.removeRule,
    classNamesProp.valueListItem,
    suppressStandardClassnames
  ]);
  const getChangeHandler = reactExports.useCallback((prop) => (value, context) => {
    if (!disabled) onPropChange(prop, value, path, context);
  }, [
    disabled,
    onPropChange,
    path
  ]);
  const onChangeField = reactExports.useMemo(() => getChangeHandler("field"), [getChangeHandler]);
  const onChangeOperator = reactExports.useMemo(() => getChangeHandler("operator"), [getChangeHandler]);
  const onChangeMatchMode = reactExports.useMemo(() => getChangeHandler("match"), [getChangeHandler]);
  const onChangeValueSource = reactExports.useMemo(() => getChangeHandler("valueSource"), [getChangeHandler]);
  const onChangeValue = reactExports.useMemo(() => getChangeHandler("value"), [getChangeHandler]);
  const cloneRule = reactExports.useCallback((_event, context) => {
    if (!disabled) moveRule(path, [...getParentPath(path), path.at(-1) + 1], true, context);
  }, [
    disabled,
    moveRule,
    path
  ]);
  const toggleLockRule = reactExports.useCallback((_event, context) => onPropChange("disabled", !disabled, path, context), [
    disabled,
    onPropChange,
    path
  ]);
  const toggleMuteRule = reactExports.useCallback((_event, context) => onPropChange("muted", !rule.muted, path, context), [
    rule.muted,
    onPropChange,
    path
  ]);
  const removeRule = reactExports.useCallback((_event, _context) => {
    if (!disabled) onRuleRemove(path);
  }, [
    disabled,
    onRuleRemove,
    path
  ]);
  const shiftRuleUp = reactExports.useCallback((event, context) => {
    if (!disabled && !shiftUpDisabled) moveRule(path, "up", event?.altKey, context);
  }, [
    disabled,
    moveRule,
    path,
    shiftUpDisabled
  ]);
  const shiftRuleDown = reactExports.useCallback((event, context) => {
    if (!disabled && !shiftDownDisabled) moveRule(path, "down", event?.altKey, context);
  }, [
    disabled,
    moveRule,
    path,
    shiftDownDisabled
  ]);
  const fieldData = reactExports.useMemo(() => fieldMap?.[rule.field] ?? {
    name: rule.field,
    value: rule.field,
    label: rule.field
  }, [fieldMap, rule.field]);
  const inputType = reactExports.useMemo(() => fieldData.inputType ?? getInputType(rule.field, rule.operator, { fieldData }), [
    fieldData,
    getInputType,
    rule.field,
    rule.operator
  ]);
  const matchModes = reactExports.useMemo(() => getMatchModes(rule.field, { fieldData }), [
    fieldData,
    getMatchModes,
    rule.field
  ]);
  const operators = reactExports.useMemo(() => getOperators(rule.field, { fieldData }), [
    fieldData,
    getOperators,
    rule.field
  ]);
  const operatorObject = reactExports.useMemo(() => getOption(operators, rule.operator), [operators, rule.operator]);
  const arity = operatorObject?.arity;
  const hideValueControls = typeof arity === "string" && arity === "unary" || typeof arity === "number" && arity < 2;
  const valueSourceOptions = reactExports.useMemo(() => {
    const configuredVSs = getValueSources(rule.field, rule.operator, { fieldData });
    if (rule.valueSource && !getOption(configuredVSs, rule.valueSource)) return [...configuredVSs, {
      name: rule.valueSource,
      value: rule.valueSource,
      label: rule.valueSource
    }];
    return configuredVSs;
  }, [
    fieldData,
    getValueSources,
    rule.field,
    rule.operator,
    rule.valueSource
  ]);
  const valueSources = reactExports.useMemo(() => valueSourceOptions.map(({ value }) => value), [valueSourceOptions]);
  const valueEditorType = reactExports.useMemo(() => rule.valueSource === "field" ? "select" : getValueEditorType(rule.field, rule.operator, { fieldData }), [
    fieldData,
    getValueEditorType,
    rule.field,
    rule.operator,
    rule.valueSource
  ]);
  const valueEditorSeparator = reactExports.useMemo(() => getValueEditorSeparator(rule.field, rule.operator, { fieldData }), [
    fieldData,
    getValueEditorSeparator,
    rule.field,
    rule.operator
  ]);
  const values = reactExports.useMemo(() => {
    const v = rule.valueSource === "field" ? filterFieldsByComparator(fieldData, fields, rule.operator) : getValues(rule.field, rule.operator, { fieldData });
    return isFlexibleOptionArray(v) || isFlexibleOptionGroupArray(v) ? toFullOptionList(v) : v;
  }, [
    fieldData,
    fields,
    getValues,
    rule.field,
    rule.operator,
    rule.valueSource
  ]);
  const subQueryBuilderProps = reactExports.useMemo(() => getSubQueryBuilderProps(rule.field, { fieldData }), [
    fieldData,
    getSubQueryBuilderProps,
    rule.field
  ]);
  const subproperties = useFields({
    translations: props.translations,
    fields: fieldData.subproperties ?? subQueryBuilderProps.fields ?? defaultSubproperties,
    autoSelectField: props.schema.autoSelectField || !!fieldData.subproperties
  });
  const validationResult = reactExports.useMemo(() => validationMap[id ?? ""] ?? (typeof fieldData.validator === "function" ? fieldData.validator(rule) : null), [
    fieldData,
    id,
    rule,
    validationMap
  ]);
  const validationClassName = reactExports.useMemo(() => getValidationClassNames(validationResult), [validationResult]);
  const fieldBasedClassName = fieldData?.className ?? "";
  const operatorBasedClassName = operatorObject?.className ?? "";
  const hasSubQuery = matchModes.length > 0;
  const outerClassName = reactExports.useMemo(() => clsx(getRuleClassname(rule, { fieldData }), fieldBasedClassName, operatorBasedClassName, suppressStandardClassnames || standardClassnames.rule, classNamesProp.rule, disabled && classNamesProp.disabled, muted && classNamesProp.muted, isDragging && classNamesProp.dndDragging, isOver && classNamesProp.dndOver, isOver && dropEffect === "copy" && classNamesProp.dndCopy, isOver && groupItems && classNamesProp.dndGroup, dropNotAllowed && classNamesProp.dndDropNotAllowed, hasSubQuery && classNamesProp.hasSubQuery, suppressStandardClassnames || {
    [standardClassnames.disabled]: disabled,
    [standardClassnames.muted]: muted,
    [standardClassnames.dndDragging]: isDragging,
    [standardClassnames.dndOver]: isOver,
    [standardClassnames.dndCopy]: isOver && dropEffect === "copy",
    [standardClassnames.dndGroup]: isOver && groupItems,
    [standardClassnames.dndDropNotAllowed]: dropNotAllowed,
    [standardClassnames.hasSubQuery]: hasSubQuery
  }, validationClassName), [
    classNamesProp.disabled,
    classNamesProp.muted,
    classNamesProp.dndCopy,
    classNamesProp.dndDragging,
    classNamesProp.dndGroup,
    classNamesProp.dndOver,
    classNamesProp.dndDropNotAllowed,
    classNamesProp.hasSubQuery,
    classNamesProp.rule,
    disabled,
    dropEffect,
    dropNotAllowed,
    muted,
    fieldBasedClassName,
    fieldData,
    getRuleClassname,
    groupItems,
    hasSubQuery,
    isDragging,
    isOver,
    operatorBasedClassName,
    rule,
    suppressStandardClassnames,
    validationClassName
  ]);
  return {
    ...props,
    classNames,
    cloneRule,
    disabled,
    dndRef,
    dragMonitorId,
    dragRef,
    dropMonitorId,
    fieldData,
    generateOnChangeHandler: getChangeHandler,
    onChangeField,
    onChangeMatchMode,
    onChangeOperator,
    onChangeValueSource,
    onChangeValue,
    hideValueControls,
    inputType,
    matchModes,
    muted,
    operators,
    outerClassName,
    removeRule,
    rule,
    shiftRuleUp,
    shiftRuleDown,
    subproperties,
    subQueryBuilderProps,
    toggleLockRule,
    toggleMuteRule,
    validationResult,
    valueEditorSeparator,
    valueEditorType,
    values,
    valueSourceOptions,
    valueSources
  };
};
const defaultControlElements = {
  actionElement: ActionElement,
  addGroupAction: ActionElement,
  addRuleAction: ActionElement,
  cloneGroupAction: ActionElement,
  cloneRuleAction: ActionElement,
  combinatorSelector: ValueSelector,
  dragHandle: DragHandle,
  fieldSelector: ValueSelector,
  inlineCombinator: InlineCombinator,
  lockGroupAction: ActionElement,
  lockRuleAction: ActionElement,
  matchModeEditor: MatchModeEditor,
  muteGroupAction: ActionElement,
  muteRuleAction: ActionElement,
  notToggle: NotToggle,
  operatorSelector: ValueSelector,
  removeGroupAction: ActionElement,
  removeRuleAction: ActionElement,
  rule: Rule,
  ruleGroup: RuleGroup,
  ruleGroupBodyElements: RuleGroupBodyComponents,
  ruleGroupHeaderElements: RuleGroupHeaderComponents,
  shiftActions: ShiftActions,
  valueEditor: ValueEditor,
  valueSelector: ValueSelector,
  valueSourceSelector: ValueSelector
};
getRqbStore();
const QueryBuilderStateProvider = (props) => /* @__PURE__ */ reactExports.createElement(Provider_default, {
  context: QueryBuilderStateContext,
  store: getRqbStore()
}, props.children);
const QueryBuilder = (props) => /* @__PURE__ */ reactExports.createElement(QueryBuilderStateProvider, null, /* @__PURE__ */ reactExports.createElement(QueryBuilderInternal, { props }));
export {
  QueryBuilder as Q
};
