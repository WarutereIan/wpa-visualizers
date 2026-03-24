import { p as produce } from "./immer.mjs";
import { n as numericQuantity, a as numericRegex } from "./numeric-quantity.mjs";
const defaultPlaceholderName = "~";
const defaultPlaceholderLabel = "------";
const defaultPlaceholderFieldName = defaultPlaceholderName;
const defaultPlaceholderFieldLabel = defaultPlaceholderLabel;
const defaultPlaceholderFieldGroupLabel = defaultPlaceholderLabel;
const defaultPlaceholderOperatorName = defaultPlaceholderName;
const defaultPlaceholderOperatorLabel = defaultPlaceholderLabel;
const defaultPlaceholderOperatorGroupLabel = defaultPlaceholderLabel;
const defaultPlaceholderValueName = defaultPlaceholderName;
const defaultPlaceholderValueLabel = defaultPlaceholderLabel;
const defaultPlaceholderValueGroupLabel = defaultPlaceholderLabel;
const defaultTranslations = {
  fields: {
    title: "Field",
    placeholderName: defaultPlaceholderFieldName,
    placeholderLabel: defaultPlaceholderFieldLabel,
    placeholderGroupLabel: defaultPlaceholderFieldGroupLabel
  },
  operators: {
    title: "Operator",
    placeholderName: defaultPlaceholderOperatorName,
    placeholderLabel: defaultPlaceholderOperatorLabel,
    placeholderGroupLabel: defaultPlaceholderOperatorGroupLabel
  },
  values: {
    title: "Values",
    placeholderName: defaultPlaceholderValueName,
    placeholderLabel: defaultPlaceholderValueLabel,
    placeholderGroupLabel: defaultPlaceholderValueGroupLabel
  },
  matchMode: { title: "Match mode" },
  matchThreshold: { title: "Match threshold" },
  value: { title: "Value" },
  removeRule: {
    label: "⨯",
    title: "Remove rule"
  },
  removeGroup: {
    label: "⨯",
    title: "Remove group"
  },
  addRule: {
    label: "+ Rule",
    title: "Add rule"
  },
  addGroup: {
    label: "+ Group",
    title: "Add group"
  },
  combinators: { title: "Combinator" },
  notToggle: {
    label: "Not",
    title: "Invert this group"
  },
  cloneRule: {
    label: "⧉",
    title: "Clone rule"
  },
  cloneRuleGroup: {
    label: "⧉",
    title: "Clone group"
  },
  shiftActionUp: {
    label: "˄",
    title: "Shift up"
  },
  shiftActionDown: {
    label: "˅",
    title: "Shift down"
  },
  dragHandle: {
    label: "⁞⁞",
    title: "Drag handle"
  },
  lockRule: {
    label: "🔓",
    title: "Lock rule"
  },
  lockGroup: {
    label: "🔓",
    title: "Lock group"
  },
  lockRuleDisabled: {
    label: "🔒",
    title: "Unlock rule"
  },
  lockGroupDisabled: {
    label: "🔒",
    title: "Unlock group"
  },
  muteRule: {
    label: "🔊",
    title: "Mute rule"
  },
  muteGroup: {
    label: "🔊",
    title: "Mute group"
  },
  unmuteRule: {
    label: "🔇",
    title: "Unmute rule"
  },
  unmuteGroup: {
    label: "🔇",
    title: "Unmute group"
  },
  valueSourceSelector: { title: "Value source" }
};
const defaultJoinChar = ",";
const defaultOperatorLabelMap = {
  "=": "=",
  "!=": "!=",
  "<": "<",
  ">": ">",
  "<=": "<=",
  ">=": ">=",
  contains: "contains",
  beginsWith: "begins with",
  endsWith: "ends with",
  doesNotContain: "does not contain",
  doesNotBeginWith: "does not begin with",
  doesNotEndWith: "does not end with",
  null: "is null",
  notNull: "is not null",
  in: "in",
  notIn: "not in",
  between: "between",
  notBetween: "not between"
};
const defaultCombinatorLabelMap = {
  and: "AND",
  or: "OR",
  xor: "XOR"
};
const defaultOperators = [
  {
    name: "=",
    value: "=",
    label: "="
  },
  {
    name: "!=",
    value: "!=",
    label: "!="
  },
  {
    name: "<",
    value: "<",
    label: "<"
  },
  {
    name: ">",
    value: ">",
    label: ">"
  },
  {
    name: "<=",
    value: "<=",
    label: "<="
  },
  {
    name: ">=",
    value: ">=",
    label: ">="
  },
  {
    name: "contains",
    value: "contains",
    label: "contains"
  },
  {
    name: "beginsWith",
    value: "beginsWith",
    label: "begins with"
  },
  {
    name: "endsWith",
    value: "endsWith",
    label: "ends with"
  },
  {
    name: "doesNotContain",
    value: "doesNotContain",
    label: "does not contain"
  },
  {
    name: "doesNotBeginWith",
    value: "doesNotBeginWith",
    label: "does not begin with"
  },
  {
    name: "doesNotEndWith",
    value: "doesNotEndWith",
    label: "does not end with"
  },
  {
    name: "null",
    value: "null",
    label: "is null"
  },
  {
    name: "notNull",
    value: "notNull",
    label: "is not null"
  },
  {
    name: "in",
    value: "in",
    label: "in"
  },
  {
    name: "notIn",
    value: "notIn",
    label: "not in"
  },
  {
    name: "between",
    value: "between",
    label: "between"
  },
  {
    name: "notBetween",
    value: "notBetween",
    label: "not between"
  }
];
const defaultCombinators = [{
  name: "and",
  value: "and",
  label: "AND"
}, {
  name: "or",
  value: "or",
  label: "OR"
}];
[...defaultCombinators, {
  name: "xor",
  value: "xor",
  label: "XOR"
}];
const defaultMatchModes = [
  {
    name: "all",
    value: "all",
    label: "all"
  },
  {
    name: "some",
    value: "some",
    label: "some"
  },
  {
    name: "none",
    value: "none",
    label: "none"
  },
  {
    name: "atLeast",
    value: "atLeast",
    label: "at least"
  },
  {
    name: "atMost",
    value: "atMost",
    label: "at most"
  },
  {
    name: "exactly",
    value: "exactly",
    label: "exactly"
  }
];
const standardClassnames = {
  queryBuilder: "queryBuilder",
  ruleGroup: "ruleGroup",
  header: "ruleGroup-header",
  body: "ruleGroup-body",
  combinators: "ruleGroup-combinators",
  addRule: "ruleGroup-addRule",
  addGroup: "ruleGroup-addGroup",
  cloneRule: "rule-cloneRule",
  cloneGroup: "ruleGroup-cloneGroup",
  removeGroup: "ruleGroup-remove",
  notToggle: "ruleGroup-notToggle",
  rule: "rule",
  fields: "rule-fields",
  matchMode: "rule-matchMode",
  matchThreshold: "rule-matchThreshold",
  operators: "rule-operators",
  value: "rule-value",
  removeRule: "rule-remove",
  betweenRules: "betweenRules",
  valid: "queryBuilder-valid",
  invalid: "queryBuilder-invalid",
  shiftActions: "shiftActions",
  dndDragging: "dndDragging",
  dndOver: "dndOver",
  dndCopy: "dndCopy",
  dndGroup: "dndGroup",
  dndDropNotAllowed: "dndDropNotAllowed",
  dragHandle: "queryBuilder-dragHandle",
  disabled: "queryBuilder-disabled",
  muted: "queryBuilder-muted",
  lockRule: "rule-lock",
  lockGroup: "ruleGroup-lock",
  muteRule: "rule-mute",
  muteGroup: "ruleGroup-mute",
  valueSource: "rule-valueSource",
  valueListItem: "rule-value-list-item",
  hasSubQuery: "rule-hasSubQuery"
};
const defaultControlClassnames = {
  queryBuilder: "",
  ruleGroup: "",
  header: "",
  body: "",
  combinators: "",
  addRule: "",
  addGroup: "",
  cloneRule: "",
  cloneGroup: "",
  removeGroup: "",
  notToggle: "",
  rule: "",
  fields: "",
  matchMode: "",
  matchThreshold: "",
  operators: "",
  value: "",
  removeRule: "",
  shiftActions: "",
  dragHandle: "",
  lockRule: "",
  lockGroup: "",
  muteRule: "",
  muteGroup: "",
  muted: "",
  valueSource: "",
  actionElement: "",
  valueSelector: "",
  betweenRules: "",
  valid: "",
  invalid: "",
  dndDragging: "",
  dndOver: "",
  dndGroup: "",
  dndCopy: "",
  dndDropNotAllowed: "",
  disabled: "",
  valueListItem: "",
  branches: "",
  hasSubQuery: "",
  loading: ""
};
const TestID = {
  rule: "rule",
  ruleGroup: "rule-group",
  inlineCombinator: "inline-combinator",
  addGroup: "add-group",
  removeGroup: "remove-group",
  cloneGroup: "clone-group",
  cloneRule: "clone-rule",
  addRule: "add-rule",
  removeRule: "remove-rule",
  combinators: "combinators",
  fields: "fields",
  operators: "operators",
  valueEditor: "value-editor",
  notToggle: "not-toggle",
  shiftActions: "shift-actions",
  dragHandle: "drag-handle",
  lockRule: "lock-rule",
  lockGroup: "lock-group",
  muteRule: "mute-rule",
  muteGroup: "mute-group",
  valueSourceSelector: "value-source-selector",
  matchModeEditor: "match-mode-editor"
};
const LogType = {
  parentPathDisabled: "action aborted: parent path disabled",
  pathDisabled: "action aborted: path is disabled",
  onAddRuleFalse: "onAddRule callback returned false",
  onAddGroupFalse: "onAddGroup callback returned false",
  onGroupRuleFalse: "onGroupRule callback returned false",
  onGroupGroupFalse: "onGroupGroup callback returned false",
  onMoveRuleFalse: "onMoveRule callback returned false",
  onMoveGroupFalse: "onMoveGroup callback returned false",
  onRemoveFalse: "onRemove callback returned false",
  add: "rule or group added",
  remove: "rule or group removed",
  update: "rule or group updated",
  move: "rule or group moved",
  group: "rule or group grouped with another"
};
const rootPath = [];
const queryBuilderFlagDefaults = {
  addRuleToNewGroups: false,
  autoSelectField: true,
  autoSelectOperator: true,
  autoSelectValue: false,
  debugMode: false,
  enableDragAndDrop: false,
  enableMountQueryChange: true,
  listsAsArrays: false,
  resetOnFieldChange: true,
  resetOnOperatorChange: false,
  showCloneButtons: false,
  showCombinatorsBetweenRules: false,
  showLockButtons: false,
  showMuteButtons: false,
  showNotToggle: false,
  showShiftActions: false,
  suppressStandardClassnames: false
};
const splitBy = (str, splitChar = defaultJoinChar) => typeof str === "string" ? str.split(`\\${splitChar}`).map((c) => c.split(splitChar)).reduce((prev, curr, idx) => {
  if (idx === 0) return curr;
  return [
    ...prev.slice(0, -1),
    `${prev.at(-1)}${splitChar}${curr[0]}`,
    ...curr.slice(1)
  ];
}, []) : [];
const joinWith = (strArr, joinChar = defaultJoinChar) => strArr.map((str) => `${str ?? ""}`.replaceAll(joinChar[0], `\\${joinChar[0]}`)).join(joinChar);
const trimIfString = (val) => typeof val === "string" ? val.trim() : val;
const toArray = (v, { retainEmptyStrings } = {}) => Array.isArray(v) ? v.map((v$1) => trimIfString(v$1)) : typeof v === "string" ? splitBy(v, defaultJoinChar).filter(retainEmptyStrings ? () => true : (s) => !/^\s*$/.test(s)).map((s) => s.trim()) : typeof v === "number" ? [v] : [];
function toVal(mix) {
  let k;
  let y;
  let str = "";
  if (typeof mix === "string" || typeof mix === "number") str += mix;
  else if (typeof mix === "object") {
    if (Array.isArray(mix)) {
      const len = mix.length;
      for (k = 0; k < len; k++) if (mix[k] && (y = toVal(mix[k]))) {
        str && (str += " ");
        str += y;
      }
    } else for (y in mix) if (mix[y]) {
      str && (str += " ");
      str += y;
    }
  }
  return str;
}
function clsx(...args) {
  let i = 0;
  let tmp;
  let x;
  let str = "";
  const len = args.length;
  for (; i < len; i++) if ((tmp = args[i]) && (x = toVal(tmp))) {
    str && (str += " ");
    str += x;
  }
  return str;
}
const lc = (v) => typeof v === "string" ? v.toLowerCase() : v;
new RegExp(numericRegex.source.replace(/^\^/, String.raw`^\s*`).replace(/\$$/, String.raw`\s*$`));
const isPojo = (obj) => obj === null || typeof obj !== "object" ? false : Object.getPrototypeOf(obj) === Object.prototype;
const isRuleGroup = (rg) => isPojo(rg) && Array.isArray(rg.rules);
const isRuleGroupType = (rg) => isRuleGroup(rg) && typeof rg.combinator === "string";
const isRuleGroupTypeIC = (rg) => isRuleGroup(rg) && rg.combinator === void 0;
const objectKeys = Object.keys;
const objectEntries = Object.entries;
const isOptionWithName = (opt) => isPojo(opt) && "name" in opt && typeof opt.name === "string";
const isOptionWithValue = (opt) => isPojo(opt) && "value" in opt && typeof opt.value === "string";
function toFullOption(opt, baseProperties, labelMap) {
  return produce((draft) => {
    const idObj = {};
    let needsUpdating = !!baseProperties;
    if (typeof draft === "string") return {
      ...baseProperties,
      name: draft,
      value: draft,
      label: labelMap?.[draft] ?? draft
    };
    if (isOptionWithName(draft) && !isOptionWithValue(draft)) {
      idObj.value = draft.name;
      needsUpdating = true;
    } else if (!isOptionWithName(draft) && isOptionWithValue(draft)) {
      idObj.name = draft.value;
      needsUpdating = true;
    }
    if (needsUpdating) return Object.assign({}, baseProperties, draft, idObj);
  })(opt);
}
function toFullOptionList(optList, baseProperties, labelMap) {
  if (!Array.isArray(optList)) return [];
  return produce((draft) => {
    if (isFlexibleOptionGroupArray(draft)) for (const optGroup of draft) for (const [idx, opt] of optGroup.options.entries()) optGroup.options[idx] = toFullOption(opt, baseProperties, labelMap);
    else for (const [idx, opt] of draft.entries()) draft[idx] = toFullOption(opt, baseProperties, labelMap);
  })(optList);
}
function toFullOptionMap(optMap, baseProperties) {
  return Object.fromEntries(Object.entries(optMap).map(([k, v]) => [k, toFullOption(v, baseProperties)]));
}
const uniqByIdentifier = (originalArray) => {
  const names = /* @__PURE__ */ new Set();
  const newArray = [];
  for (const el of originalArray) if (!names.has(el.value ?? el.name)) {
    names.add(el.value ?? el.name);
    newArray.push(el);
  }
  return originalArray.length === newArray.length ? originalArray : newArray;
};
const isOptionGroupArray = (arr) => Array.isArray(arr) && arr.length > 0 && isPojo(arr[0]) && "options" in arr[0] && Array.isArray(arr[0].options);
const isFlexibleOptionArray = (arr) => {
  let isFOA = false;
  if (Array.isArray(arr)) for (const o of arr) if (isOptionWithName(o) || isOptionWithValue(o)) isFOA = true;
  else return false;
  return isFOA;
};
const isFlexibleOptionGroupArray = (arr, { allowEmpty = false } = {}) => {
  let isFOGA = false;
  if (Array.isArray(arr)) for (const og of arr) if (isPojo(og) && "options" in og && (isFlexibleOptionArray(og.options) || allowEmpty && Array.isArray(og.options) && og.options.length === 0)) isFOGA = true;
  else return false;
  return isFOGA;
};
function getOption(arr, name) {
  return (isFlexibleOptionGroupArray(arr, { allowEmpty: true }) ? arr.flatMap((og) => og.options) : arr).find((op) => op.value === name || op.name === name);
}
function getFirstOption(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  else if (isFlexibleOptionGroupArray(arr, { allowEmpty: true })) {
    for (const og of arr) if (og.options.length > 0) return og.options[0].value ?? og.options[0].name;
    return null;
  }
  return arr[0].value ?? arr[0].name;
}
const uniqOptGroups = (originalArray) => {
  const labels = /* @__PURE__ */ new Set();
  const names = /* @__PURE__ */ new Set();
  const newArray = [];
  for (const el of originalArray) if (!labels.has(el.label)) {
    labels.add(el.label);
    const optionsForThisGroup = [];
    for (const opt of el.options) if (!names.has(opt.value ?? opt.name)) {
      names.add(opt.value ?? opt.name);
      optionsForThisGroup.push(toFullOption(opt));
    }
    newArray.push({
      ...el,
      options: optionsForThisGroup
    });
  }
  return newArray;
};
const prepareOptionList = (props) => {
  const { optionList: optionListPropOriginal, baseOption = {}, labelMap = {}, placeholder: { placeholderName = defaultPlaceholderName, placeholderLabel = defaultPlaceholderLabel, placeholderGroupLabel = defaultPlaceholderLabel } = {}, autoSelectOption = true } = props;
  const defaultOption = {
    id: placeholderName,
    name: placeholderName,
    value: placeholderName,
    label: placeholderLabel
  };
  const optionsProp = optionListPropOriginal ?? [defaultOption];
  let optionList;
  const opts = Array.isArray(optionsProp) ? toFullOptionList(optionsProp, baseOption, labelMap) : objectKeys(toFullOptionMap(optionsProp, baseOption)).map((opt) => ({
    ...optionsProp[opt],
    name: opt,
    value: opt
  })).sort((a, b) => a.label.localeCompare(b.label));
  if (isFlexibleOptionGroupArray(opts)) optionList = autoSelectOption ? uniqOptGroups(opts) : uniqOptGroups([{
    label: placeholderGroupLabel,
    options: [defaultOption]
  }, ...opts]);
  else optionList = autoSelectOption ? uniqByIdentifier(opts) : uniqByIdentifier([defaultOption, ...opts]);
  let optionsMap = {};
  if (!Array.isArray(optionsProp)) {
    const op = toFullOptionMap(optionsProp, baseOption);
    optionsMap = autoSelectOption ? op : {
      ...op,
      [placeholderName]: defaultOption
    };
  } else if (isFlexibleOptionGroupArray(optionList)) for (const og of optionList) for (const opt of og.options) optionsMap[opt.value ?? opt.name] = toFullOption(opt, baseOption);
  else for (const opt of optionList) optionsMap[opt.value ?? opt.name] = toFullOption(opt, baseOption);
  return {
    defaultOption,
    optionList,
    optionsMap
  };
};
const filterByComparator = (field, operator, fieldToCompare) => {
  const fullField = toFullOption(field);
  const fullFieldToCompare = toFullOption(fieldToCompare);
  if (fullField.value === fullFieldToCompare.value) return false;
  if (typeof fullField.comparator === "string") return fullField[fullField.comparator] === fullFieldToCompare[fullField.comparator];
  return fullField.comparator?.(fullFieldToCompare, operator) ?? false;
};
const filterFieldsByComparator = (field, fields, operator) => {
  if (!field.comparator) {
    const filterOutSameField = (f) => (f.value ?? f.name) !== (field.value ?? field.name);
    if (isFlexibleOptionGroupArray(fields)) return fields.map((og) => ({
      ...og,
      options: og.options.filter((v) => filterOutSameField(v))
    }));
    return fields.filter((v) => filterOutSameField(v));
  }
  if (isFlexibleOptionGroupArray(fields)) return fields.map((og) => ({
    ...og,
    options: og.options.filter((f) => filterByComparator(field, operator, f))
  })).filter((og) => og.options.length > 0);
  return fields.filter((f) => filterByComparator(field, operator, f));
};
const parseNumber = (val, { parseNumbers, bigIntOnOverflow } = {}) => {
  if (!parseNumbers || typeof val === "bigint" || typeof val === "number") return val;
  if (parseNumbers === "native") return Number.parseFloat(val);
  const valAsNum = numericQuantity(val, {
    allowTrailingInvalid: parseNumbers === "enhanced",
    bigIntOnOverflow,
    romanNumerals: false,
    round: false
  });
  return typeof valAsNum === "bigint" || !Number.isNaN(valAsNum) ? valAsNum : val;
};
const getParseNumberMethod = ({ parseNumbers, inputType }) => {
  if (typeof parseNumbers === "string") {
    const [method, level] = parseNumbers.split("-");
    if (level === "limited") return inputType === "number" ? method : false;
    return method;
  }
  return parseNumbers ? "strict" : false;
};
const processMatchMode = (rule) => {
  const { mode, threshold } = rule.match ?? {};
  if (!mode) return null;
  if (!isRuleGroup(rule.value)) return false;
  const matchModeLC = lc(mode);
  const matchModeCoerced = matchModeLC === "atleast" && threshold === 1 ? "some" : matchModeLC === "atmost" && threshold === 0 ? "none" : matchModeLC;
  if ((matchModeCoerced === "atleast" || matchModeCoerced === "atmost" || matchModeCoerced === "exactly") && (typeof threshold !== "number" || threshold < 0)) return false;
  return {
    mode: matchModeCoerced,
    threshold
  };
};
const findPath = (path, query) => {
  let target = query;
  let level = 0;
  while (level < path.length && target && isRuleGroup(target)) {
    const t = target.rules[path[level]];
    target = typeof t === "string" ? null : t;
    level++;
  }
  return level < path.length ? null : target;
};
const findID = (id, query) => {
  if (query.id === id) return query;
  for (const rule of query.rules) {
    if (typeof rule === "string") continue;
    if (rule.id === id) return rule;
    else if (isRuleGroup(rule)) {
      const subRule = findID(id, rule);
      if (subRule) return subRule;
    }
  }
  return null;
};
const getPathOfID = (id, query) => {
  if (query.id === id) return [];
  const idx = query.rules.findIndex((r) => !(typeof r === "string") && r.id === id);
  if (idx >= 0) return [idx];
  for (const [i, r] of Object.entries(query.rules)) if (isRuleGroup(r)) {
    const subPath = getPathOfID(id, r);
    if (Array.isArray(subPath)) return [Number.parseInt(i), ...subPath];
  }
  return null;
};
const getParentPath = (path) => path.slice(0, -1);
const pathsAreEqual = (path1, path2) => path1.length === path2.length && path1.every((val, idx) => val === path2[idx]);
const getCommonAncestorPath = (path1, path2) => {
  const commonAncestorPath = [];
  const parentPath1 = getParentPath(path1);
  const parentPath2 = getParentPath(path2);
  let i = 0;
  while (i < parentPath1.length && i < parentPath2.length && parentPath1[i] === parentPath2[i]) {
    commonAncestorPath.push(parentPath2[i]);
    i++;
  }
  return commonAncestorPath;
};
const pathIsDisabled = (path, query) => {
  let disabled = !!query.disabled;
  let target = query;
  let level = 0;
  while (level < path.length && !disabled && isRuleGroup(target)) {
    const t = target.rules[path[level]];
    if (isPojo(t) && (isRuleGroup(t) || "field" in t && !!t.field)) {
      disabled = !!t.disabled;
      target = t;
    }
    level++;
  }
  return disabled;
};
const generateAccessibleDescription = (params) => pathsAreEqual([], params.path) ? `Query builder` : `Rule group at path ${params.path.join("-")}`;
const cryptoModule = globalThis.crypto;
let generateID = () => "00-0-4-2-000".replaceAll(/[^-]/g, (s) => ((Math.random() + Math.trunc(s)) * 65536 >> Number.parseInt(s)).toString(16).padStart(4, "0"));
if (cryptoModule) {
  if (typeof cryptoModule.randomUUID === "function") generateID = () => cryptoModule.randomUUID();
  else if (typeof cryptoModule.getRandomValues === "function") {
    const position19vals = "89ab";
    const container = new Uint32Array(32);
    generateID = () => {
      cryptoModule.getRandomValues(container);
      let id = (container[0] % 16).toString(16);
      for (let i = 1; i < 32; i++) {
        if (i === 12) id = `${id}4`;
        else if (i === 16) id = `${id}${position19vals[container[17] % 4]}`;
        else id = `${id}${(container[i] % 16).toString(16)}`;
        if (i === 7 || i === 11 || i === 15 || i === 19) id = `${id}-`;
      }
      return id;
    };
  }
}
const dummyFD$1 = {
  name: "name",
  value: "name",
  matchModes: null,
  label: "label"
};
const getMatchModesUtil = (fieldData, getMatchModes) => {
  const fd = fieldData ? toFullOption(fieldData) : dummyFD$1;
  let matchModes = fd.matchModes ?? false;
  if (!matchModes && getMatchModes) matchModes = getMatchModes(fd.value, { fieldData: fd });
  if (matchModes === true) return defaultMatchModes;
  else if (matchModes === false) return [];
  if (isFlexibleOptionArray(matchModes)) return toFullOptionList(matchModes);
  return matchModes?.map((mm) => defaultMatchModes.find((dmm) => dmm.value === lc(mm)) ?? {
    name: mm,
    value: mm,
    label: mm
  }) ?? [];
};
const getValidationClassNames = (validationResult) => {
  const valid = typeof validationResult === "boolean" ? validationResult : typeof validationResult === "object" && validationResult !== null ? validationResult.valid : null;
  return typeof valid === "boolean" ? valid ? standardClassnames.valid : standardClassnames.invalid : "";
};
const defaultValueSourcesArray = [{
  name: "value",
  value: "value",
  label: "value"
}];
const dummyFD = {
  name: "name",
  value: "name",
  valueSources: null,
  label: "label"
};
const getValueSourcesUtil = (fieldData, operator, getValueSources) => {
  const fd = fieldData ? toFullOption(fieldData) : dummyFD;
  let valueSourcesNEW = fd.valueSources ?? false;
  if (typeof valueSourcesNEW === "function") valueSourcesNEW = valueSourcesNEW(operator);
  if (!valueSourcesNEW && getValueSources) valueSourcesNEW = getValueSources(fd.value, operator, { fieldData: fd });
  if (!valueSourcesNEW) return defaultValueSourcesArray;
  if (isFlexibleOptionArray(valueSourcesNEW)) return toFullOptionList(valueSourcesNEW);
  return valueSourcesNEW.map((vs) => defaultValueSourcesArray.find((dmm) => dmm.value === lc(vs)) ?? {
    name: vs,
    value: vs,
    label: vs
  });
};
const mergeAnyTranslation = (el, keyPropContextMap, defaults) => {
  const finalKeys = objectEntries(keyPropContextMap).map(([key, [pT, cT]]) => [key, pT ?? cT ?? defaults?.[el]?.[key]]).filter((k) => !!k[1]);
  if (finalKeys.length > 0 || defaults) {
    const defaultProperties = defaults?.[el] ?? {};
    const finalObject = Object.assign({}, defaultProperties, Object.fromEntries(finalKeys));
    return { [el]: finalObject };
  }
};
const joinClassnamesByName = (name, args) => clsx(args.map((c) => clsx(c?.[name])));
const mergeClassnames = (...args) => ({
  queryBuilder: joinClassnamesByName("queryBuilder", args),
  ruleGroup: joinClassnamesByName("ruleGroup", args),
  header: joinClassnamesByName("header", args),
  body: joinClassnamesByName("body", args),
  combinators: joinClassnamesByName("combinators", args),
  addRule: joinClassnamesByName("addRule", args),
  addGroup: joinClassnamesByName("addGroup", args),
  cloneRule: joinClassnamesByName("cloneRule", args),
  cloneGroup: joinClassnamesByName("cloneGroup", args),
  removeGroup: joinClassnamesByName("removeGroup", args),
  rule: joinClassnamesByName("rule", args),
  fields: joinClassnamesByName("fields", args),
  operators: joinClassnamesByName("operators", args),
  value: joinClassnamesByName("value", args),
  removeRule: joinClassnamesByName("removeRule", args),
  notToggle: joinClassnamesByName("notToggle", args),
  shiftActions: joinClassnamesByName("shiftActions", args),
  dragHandle: joinClassnamesByName("dragHandle", args),
  lockRule: joinClassnamesByName("lockRule", args),
  lockGroup: joinClassnamesByName("lockGroup", args),
  muteRule: joinClassnamesByName("muteRule", args),
  muteGroup: joinClassnamesByName("muteGroup", args),
  muted: joinClassnamesByName("muted", args),
  valueSource: joinClassnamesByName("valueSource", args),
  actionElement: joinClassnamesByName("actionElement", args),
  valueSelector: joinClassnamesByName("valueSelector", args),
  betweenRules: joinClassnamesByName("betweenRules", args),
  valid: joinClassnamesByName("valid", args),
  invalid: joinClassnamesByName("invalid", args),
  dndDragging: joinClassnamesByName("dndDragging", args),
  dndOver: joinClassnamesByName("dndOver", args),
  dndCopy: joinClassnamesByName("dndCopy", args),
  dndGroup: joinClassnamesByName("dndGroup", args),
  dndDropNotAllowed: joinClassnamesByName("dndDropNotAllowed", args),
  disabled: joinClassnamesByName("disabled", args),
  valueListItem: joinClassnamesByName("valueListItem", args),
  matchMode: joinClassnamesByName("matchMode", args),
  matchThreshold: joinClassnamesByName("matchThreshold", args),
  branches: joinClassnamesByName("branches", args),
  hasSubQuery: joinClassnamesByName("hasSubQuery", args),
  loading: joinClassnamesByName("loading", args)
});
const preferPropDefaultTrue = (prop, context) => prop === false ? false : prop ? true : !(context === false);
const preferPropDefaultFalse = (prop, context) => prop ? true : prop === false ? false : !!context;
const preferProp = (def, prop, context, doNotFinalize) => !doNotFinalize ? def ? preferPropDefaultTrue(prop, context) : preferPropDefaultFalse(prop, context) : prop ?? context;
const preferFlagProps = (props = {}, contextVals = {}, finalize) => objectEntries(queryBuilderFlagDefaults).reduce((acc, [key, def]) => {
  acc[key] = preferProp(def, props[key], contextVals[key], false);
  return acc;
}, {});
const prepareRule = (rule, { idGenerator = generateID } = {}) => produce(rule, (draft) => {
  if (!draft.id) draft.id = idGenerator();
  if (processMatchMode(draft)) draft.value = prepareRuleGroup(draft.value, { idGenerator });
});
const prepareRuleGroup = (queryObject, { idGenerator = generateID } = {}) => produce(queryObject, (draft) => {
  if (!draft.id) draft.id = idGenerator();
  draft.rules = draft.rules.map((r) => typeof r === "string" ? r : isRuleGroup(r) ? prepareRuleGroup(r, { idGenerator }) : prepareRule(r, { idGenerator }));
});
const prepareRuleOrGroup = (rg, { idGenerator = generateID } = {}) => isRuleGroup(rg) ? prepareRuleGroup(rg, { idGenerator }) : prepareRule(rg, { idGenerator });
const regenerateID = (rule, { idGenerator = generateID } = {}) => structuredClone({
  ...rule,
  id: idGenerator()
});
const regenerateIDs = (subject, { idGenerator = generateID } = {}) => {
  if (!isPojo(subject)) return subject;
  if (!isRuleGroup(subject)) return structuredClone({
    ...subject,
    id: idGenerator()
  });
  const newGroup = {
    ...subject,
    id: idGenerator()
  };
  if (Array.isArray(newGroup.rules)) newGroup.rules = subject.rules.map((r) => typeof r === "string" ? r : isRuleGroup(r) ? regenerateIDs(r, { idGenerator }) : regenerateID(r, { idGenerator }));
  return newGroup;
};
const add = (query, ruleOrGroup, parentPathOrID, { combinators = defaultCombinators, combinatorPreceding, idGenerator = generateID } = {}) => produce(query, (draft) => {
  const parent = Array.isArray(parentPathOrID) ? findPath(parentPathOrID, draft) : findID(parentPathOrID, draft);
  if (!parent || !isRuleGroup(parent)) return;
  if (isRuleGroupTypeIC(parent) && parent.rules.length > 0) {
    const prevCombinator = parent.rules.at(-2);
    parent.rules.push(combinatorPreceding ?? (typeof prevCombinator === "string" ? prevCombinator : getFirstOption(combinators)));
  }
  parent.rules.push(prepareRuleOrGroup(ruleOrGroup, { idGenerator }));
});
const update = (query, prop, value, pathOrID, { resetOnFieldChange = true, resetOnOperatorChange = false, getRuleDefaultOperator = () => "=", getValueSources = () => ["value"], getRuleDefaultValue = () => "", getMatchModes = () => [] } = {}) => produce(query, (draft) => {
  const path = Array.isArray(pathOrID) ? pathOrID : getPathOfID(pathOrID, draft);
  if (!path) return;
  if (prop === "combinator" && !isRuleGroupType(draft)) {
    const parentRules = findPath(getParentPath(path), draft).rules;
    if (path.at(-1) % 2 === 1) parentRules[path.at(-1)] = value;
    return;
  }
  const ruleOrGroup = findPath(path, draft);
  if (!ruleOrGroup) return;
  const isGroup = isRuleGroup(ruleOrGroup);
  if (ruleOrGroup[prop] === value) return;
  if (prop !== "valueSource") ruleOrGroup[prop] = value;
  if (isGroup) return;
  let resetValueSource = false;
  let resetValue = false;
  if (prop === "field") {
    const fromFieldMatchModes = getMatchModes(ruleOrGroup.field);
    const toFieldMatchModes = getMatchModes(value);
    if (toFieldMatchModes.length === 0) delete ruleOrGroup.match;
    else {
      const nextMatchMode = ruleOrGroup.match?.mode && getOption(toFieldMatchModes, ruleOrGroup.match.mode) ? null : getFirstOption(toFieldMatchModes);
      if (nextMatchMode) ruleOrGroup.match = {
        mode: nextMatchMode,
        threshold: 1
      };
    }
    if (fromFieldMatchModes.length > 0 || toFieldMatchModes.length > 0) resetOnFieldChange = true;
  }
  if (resetOnFieldChange && prop === "field") {
    ruleOrGroup.operator = getRuleDefaultOperator(value);
    resetValueSource = true;
    resetValue = true;
  }
  if (resetOnOperatorChange && prop === "operator") {
    resetValueSource = true;
    resetValue = true;
  }
  const defaultValueSource = getFirstOption(getValueSourcesUtil({
    name: ruleOrGroup.field,
    value: ruleOrGroup.field,
    label: ""
  }, ruleOrGroup.operator, getValueSources));
  if (resetValueSource && ruleOrGroup.valueSource && defaultValueSource !== ruleOrGroup.valueSource || prop === "valueSource" && value !== ruleOrGroup.valueSource) {
    resetValue = !!ruleOrGroup.valueSource || !ruleOrGroup.valueSource && value !== defaultValueSource;
    ruleOrGroup.valueSource = resetValueSource ? defaultValueSource : value;
  }
  if (resetValue) ruleOrGroup.value = getRuleDefaultValue(ruleOrGroup);
});
const remove = (query, pathOrID) => {
  const path = Array.isArray(pathOrID) ? pathOrID : getPathOfID(pathOrID, query);
  if (!path) return query;
  if (path.length === 0 || !isRuleGroupType(query) && !findPath(path, query)) return query;
  return produce(query, (draft) => {
    const index = path.at(-1);
    const parent = findPath(getParentPath(path), draft);
    if (parent && isRuleGroup(parent)) if (!isRuleGroupType(parent) && parent.rules.length > 1) {
      const idxStartDelete = index === 0 ? 0 : index - 1;
      parent.rules.splice(idxStartDelete, 2);
    } else parent.rules.splice(index, 1);
  });
};
const getNextPath = (query, currentPath, newPathOrShiftDirection) => {
  if (Array.isArray(newPathOrShiftDirection)) return newPathOrShiftDirection;
  const ic = isRuleGroupTypeIC(query);
  if (newPathOrShiftDirection === "up") if (pathsAreEqual(currentPath, [0])) return currentPath;
  else if (currentPath.at(-1) === 0) {
    const parentPath = getParentPath(currentPath);
    return [...getParentPath(parentPath), Math.max(0, parentPath.at(-1) - (ic ? 1 : 0))];
  } else {
    const evaluationPath = [...getParentPath(currentPath), Math.max(0, currentPath.at(-1) - (ic ? 2 : 1))];
    const entityAtTarget = findPath(evaluationPath, query);
    if (isRuleGroup(entityAtTarget)) return [...evaluationPath, entityAtTarget.rules.length];
    else return [...getParentPath(currentPath), Math.max(0, currentPath.at(-1) - (ic ? 3 : 1))];
  }
  else if (newPathOrShiftDirection === "down") if (pathsAreEqual([query.rules.length - 1], currentPath)) return currentPath;
  else if (currentPath.at(-1) === findPath(getParentPath(currentPath), query).rules.length - 1) {
    const parentPath = getParentPath(currentPath);
    return [...getParentPath(parentPath), parentPath.at(-1) + 1];
  } else {
    const evaluationPath = [...getParentPath(currentPath), currentPath.at(-1) + (ic ? 2 : 1)];
    if (isRuleGroup(findPath(evaluationPath, query))) return [...evaluationPath, 0];
    else return [...getParentPath(currentPath), currentPath.at(-1) + (ic ? 3 : 2)];
  }
  return currentPath;
};
const move = (query, oldPathOrID, newPath, { clone = false, combinators = defaultCombinators, idGenerator = generateID } = {}) => {
  const oldPath = Array.isArray(oldPathOrID) ? oldPathOrID : getPathOfID(oldPathOrID, query);
  if (!oldPath) return query;
  const nextPath = getNextPath(query, oldPath, newPath);
  if (oldPath.length === 0 || pathsAreEqual(oldPath, nextPath) || !findPath(getParentPath(nextPath), query)) return query;
  const ruleOrGroupOriginal = findPath(oldPath, query);
  if (!ruleOrGroupOriginal) return query;
  const ruleOrGroup = clone ? regenerateIDs(ruleOrGroupOriginal, { idGenerator }) : ruleOrGroupOriginal;
  return produce(query, (draft) => {
    const independentCombinators = isRuleGroupTypeIC(draft);
    const parentOfRuleToRemove = findPath(getParentPath(oldPath), draft);
    const ruleToRemoveIndex = oldPath.at(-1);
    const oldPrevCombinator = independentCombinators && ruleToRemoveIndex > 0 ? parentOfRuleToRemove.rules[ruleToRemoveIndex - 1] : null;
    const oldNextCombinator = independentCombinators && ruleToRemoveIndex < parentOfRuleToRemove.rules.length - 1 ? parentOfRuleToRemove.rules[ruleToRemoveIndex + 1] : null;
    if (!clone) {
      const idxStartDelete = independentCombinators ? Math.max(0, ruleToRemoveIndex - 1) : ruleToRemoveIndex;
      const deleteLength = independentCombinators ? 2 : 1;
      parentOfRuleToRemove.rules.splice(idxStartDelete, deleteLength);
    }
    const newNewPath = [...nextPath];
    const commonAncestorPath = getCommonAncestorPath(oldPath, nextPath);
    if (!clone && oldPath.length === commonAncestorPath.length + 1 && nextPath[commonAncestorPath.length] > oldPath[commonAncestorPath.length]) newNewPath[commonAncestorPath.length] -= independentCombinators ? 2 : 1;
    const parentToInsertInto = findPath(getParentPath(newNewPath), draft);
    const newIndex = newNewPath.at(-1);
    const insertRuleOrGroup = (...args) => parentToInsertInto.rules.splice(newIndex, 0, ...args);
    if (parentToInsertInto.rules.length === 0 || !independentCombinators) insertRuleOrGroup(ruleOrGroup);
    else if (newIndex === 0) if (ruleToRemoveIndex === 0 && oldNextCombinator) insertRuleOrGroup(ruleOrGroup, oldNextCombinator);
    else insertRuleOrGroup(ruleOrGroup, parentToInsertInto.rules[1] ?? oldPrevCombinator ?? getFirstOption(combinators));
    else if (oldPrevCombinator) insertRuleOrGroup(oldPrevCombinator, ruleOrGroup);
    else insertRuleOrGroup(parentToInsertInto.rules[newIndex - 2] ?? oldNextCombinator ?? getFirstOption(combinators), ruleOrGroup);
  });
};
const group = (query, sourcePathOrID, targetPathOrID, { clone = false, combinators = defaultCombinators, idGenerator = generateID } = {}) => {
  const sourcePath = Array.isArray(sourcePathOrID) ? sourcePathOrID : getPathOfID(sourcePathOrID, query);
  const targetPath = Array.isArray(targetPathOrID) ? targetPathOrID : getPathOfID(targetPathOrID, query);
  if (!sourcePath || !targetPath) return query;
  const nextPath = getNextPath(query, sourcePath, targetPath);
  if (sourcePath.length === 0 || pathsAreEqual(sourcePath, nextPath) || !findPath(getParentPath(nextPath), query)) return query;
  const sourceRuleOrGroupOriginal = findPath(sourcePath, query);
  const targetRuleOrGroup = findPath(targetPath, query);
  if (!sourceRuleOrGroupOriginal || !targetRuleOrGroup) return query;
  const sourceRuleOrGroup = clone ? regenerateIDs(sourceRuleOrGroupOriginal, { idGenerator }) : sourceRuleOrGroupOriginal;
  return produce(query, (draft) => {
    const independentCombinators = isRuleGroupTypeIC(draft);
    const parentOfRuleToRemove = findPath(getParentPath(sourcePath), draft);
    const ruleToRemoveIndex = sourcePath.at(-1);
    if (!clone) {
      const idxStartDelete = independentCombinators ? Math.max(0, ruleToRemoveIndex - 1) : ruleToRemoveIndex;
      const deleteLength = independentCombinators ? 2 : 1;
      parentOfRuleToRemove.rules.splice(idxStartDelete, deleteLength);
    }
    const newNewPath = [...nextPath];
    const commonAncestorPath = getCommonAncestorPath(sourcePath, nextPath);
    if (!clone && sourcePath.length === commonAncestorPath.length + 1 && nextPath[commonAncestorPath.length] > sourcePath[commonAncestorPath.length]) newNewPath[commonAncestorPath.length] -= independentCombinators ? 2 : 1;
    const parentOfTargetPath = findPath(getParentPath(newNewPath), draft);
    const targetPathIndex = newNewPath.at(-1);
    parentOfTargetPath.rules.splice(targetPathIndex, 1, prepareRuleOrGroup(independentCombinators ? { rules: [
      targetRuleOrGroup,
      getFirstOption(combinators),
      sourceRuleOrGroup
    ] } : {
      combinator: getFirstOption(combinators),
      rules: [targetRuleOrGroup, sourceRuleOrGroup]
    }, { idGenerator }));
  });
};
export {
  defaultCombinators as A,
  defaultCombinatorLabelMap as B,
  defaultOperators as C,
  defaultOperatorLabelMap as D,
  joinWith as E,
  parseNumber as F,
  pathsAreEqual as G,
  isRuleGroupType as H,
  defaultTranslations as I,
  toArray as J,
  isOptionGroupArray as K,
  LogType as L,
  getParseNumberMethod as M,
  getParentPath as N,
  getValidationClassNames as O,
  isFlexibleOptionArray as P,
  isFlexibleOptionGroupArray as Q,
  toFullOptionList as R,
  isPojo as S,
  TestID as T,
  lc as U,
  pathIsDisabled as a,
  add as b,
  remove as c,
  isRuleGroup as d,
  group as e,
  findPath as f,
  generateAccessibleDescription as g,
  clsx as h,
  isRuleGroupTypeIC as i,
  generateID as j,
  prepareOptionList as k,
  getFirstOption as l,
  move as m,
  getValueSourcesUtil as n,
  getMatchModesUtil as o,
  prepareRuleGroup as p,
  filterFieldsByComparator as q,
  rootPath as r,
  standardClassnames as s,
  getOption as t,
  update as u,
  preferFlagProps as v,
  preferProp as w,
  mergeClassnames as x,
  defaultControlClassnames as y,
  mergeAnyTranslation as z
};
