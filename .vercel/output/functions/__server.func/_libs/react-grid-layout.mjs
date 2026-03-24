import { r as reactExports, j as jsxRuntimeExports, R as React } from "./react.mjs";
import { c as cjsExports } from "./react-draggable.mjs";
import { r as reactResizableExports } from "./react-resizable.mjs";
import { c as clsx } from "./clsx.mjs";
import { d as deepEqual } from "./fast-equals.mjs";
function calcGridColWidth(positionParams) {
  const { margin, containerPadding, containerWidth, cols } = positionParams;
  return (containerWidth - margin[0] * (cols - 1) - containerPadding[0] * 2) / cols;
}
function calcGridItemWHPx(gridUnits, colOrRowSize, marginPx) {
  if (!Number.isFinite(gridUnits)) return gridUnits;
  return Math.round(
    colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx
  );
}
function calcGridItemPosition(positionParams, x, y, w, h, dragPosition, resizePosition) {
  const { margin, containerPadding, rowHeight } = positionParams;
  const colWidth = calcGridColWidth(positionParams);
  let width;
  let height;
  let top;
  let left;
  if (resizePosition) {
    width = Math.round(resizePosition.width);
    height = Math.round(resizePosition.height);
  } else {
    width = calcGridItemWHPx(w, colWidth, margin[0]);
    height = calcGridItemWHPx(h, rowHeight, margin[1]);
  }
  if (dragPosition) {
    top = Math.round(dragPosition.top);
    left = Math.round(dragPosition.left);
  } else if (resizePosition) {
    top = Math.round(resizePosition.top);
    left = Math.round(resizePosition.left);
  } else {
    top = Math.round((rowHeight + margin[1]) * y + containerPadding[1]);
    left = Math.round((colWidth + margin[0]) * x + containerPadding[0]);
  }
  if (!dragPosition && !resizePosition) {
    if (Number.isFinite(w)) {
      const siblingLeft = Math.round(
        (colWidth + margin[0]) * (x + w) + containerPadding[0]
      );
      const actualMarginRight = siblingLeft - left - width;
      if (actualMarginRight !== margin[0]) {
        width += actualMarginRight - margin[0];
      }
    }
    if (Number.isFinite(h)) {
      const siblingTop = Math.round(
        (rowHeight + margin[1]) * (y + h) + containerPadding[1]
      );
      const actualMarginBottom = siblingTop - top - height;
      if (actualMarginBottom !== margin[1]) {
        height += actualMarginBottom - margin[1];
      }
    }
  }
  return { top, left, width, height };
}
function calcXY(positionParams, top, left, w, h) {
  const { margin, containerPadding, cols, rowHeight, maxRows } = positionParams;
  const colWidth = calcGridColWidth(positionParams);
  let x = Math.round((left - containerPadding[0]) / (colWidth + margin[0]));
  let y = Math.round((top - containerPadding[1]) / (rowHeight + margin[1]));
  x = clamp$1(x, 0, cols - w);
  y = clamp$1(y, 0, maxRows - h);
  return { x, y };
}
function calcXYRaw(positionParams, top, left) {
  const { margin, containerPadding, rowHeight } = positionParams;
  const colWidth = calcGridColWidth(positionParams);
  const x = Math.round((left - containerPadding[0]) / (colWidth + margin[0]));
  const y = Math.round((top - containerPadding[1]) / (rowHeight + margin[1]));
  return { x, y };
}
function calcWHRaw(positionParams, width, height) {
  const { margin, rowHeight } = positionParams;
  const colWidth = calcGridColWidth(positionParams);
  const w = Math.max(
    1,
    Math.round((width + margin[0]) / (colWidth + margin[0]))
  );
  const h = Math.max(
    1,
    Math.round((height + margin[1]) / (rowHeight + margin[1]))
  );
  return { w, h };
}
function clamp$1(num, lowerBound, upperBound) {
  return Math.max(Math.min(num, upperBound), lowerBound);
}
function collides(l1, l2) {
  if (l1.i === l2.i) return false;
  if (l1.x + l1.w <= l2.x) return false;
  if (l1.x >= l2.x + l2.w) return false;
  if (l1.y + l1.h <= l2.y) return false;
  if (l1.y >= l2.y + l2.h) return false;
  return true;
}
function getFirstCollision(layout, layoutItem) {
  for (let i = 0; i < layout.length; i++) {
    const item = layout[i];
    if (item !== void 0 && collides(item, layoutItem)) {
      return item;
    }
  }
  return void 0;
}
function getAllCollisions(layout, layoutItem) {
  return layout.filter((l) => collides(l, layoutItem));
}
function sortLayoutItems(layout, compactType) {
  if (compactType === "horizontal") {
    return sortLayoutItemsByColRow(layout);
  }
  if (compactType === "vertical") {
    return sortLayoutItemsByRowCol(layout);
  }
  if (compactType === "wrap") {
    return sortLayoutItemsByRowCol(layout);
  }
  return [...layout];
}
function sortLayoutItemsByRowCol(layout) {
  return [...layout].sort((a, b) => {
    if (a.y !== b.y) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });
}
function sortLayoutItemsByColRow(layout) {
  return [...layout].sort((a, b) => {
    if (a.x !== b.x) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });
}
function bottom(layout) {
  let max = 0;
  for (let i = 0; i < layout.length; i++) {
    const item = layout[i];
    if (item !== void 0) {
      const bottomY = item.y + item.h;
      if (bottomY > max) max = bottomY;
    }
  }
  return max;
}
function getLayoutItem(layout, id) {
  for (let i = 0; i < layout.length; i++) {
    const item = layout[i];
    if (item !== void 0 && item.i === id) {
      return item;
    }
  }
  return void 0;
}
function getStatics(layout) {
  return layout.filter((l) => l.static === true);
}
function cloneLayoutItem(layoutItem) {
  return {
    i: layoutItem.i,
    x: layoutItem.x,
    y: layoutItem.y,
    w: layoutItem.w,
    h: layoutItem.h,
    minW: layoutItem.minW,
    maxW: layoutItem.maxW,
    minH: layoutItem.minH,
    maxH: layoutItem.maxH,
    moved: Boolean(layoutItem.moved),
    static: Boolean(layoutItem.static),
    isDraggable: layoutItem.isDraggable,
    isResizable: layoutItem.isResizable,
    resizeHandles: layoutItem.resizeHandles,
    constraints: layoutItem.constraints,
    isBounded: layoutItem.isBounded
  };
}
function cloneLayout(layout) {
  const newLayout = new Array(layout.length);
  for (let i = 0; i < layout.length; i++) {
    const item = layout[i];
    if (item !== void 0) {
      newLayout[i] = cloneLayoutItem(item);
    }
  }
  return newLayout;
}
function modifyLayout(layout, layoutItem) {
  const newLayout = new Array(layout.length);
  for (let i = 0; i < layout.length; i++) {
    const item = layout[i];
    if (item !== void 0) {
      if (layoutItem.i === item.i) {
        newLayout[i] = layoutItem;
      } else {
        newLayout[i] = item;
      }
    }
  }
  return newLayout;
}
function withLayoutItem(layout, itemKey, cb) {
  let item = getLayoutItem(layout, itemKey);
  if (!item) {
    return [[...layout], null];
  }
  item = cb(cloneLayoutItem(item));
  const newLayout = modifyLayout(layout, item);
  return [newLayout, item];
}
function correctBounds(layout, bounds) {
  const collidesWith = getStatics(layout);
  for (let i = 0; i < layout.length; i++) {
    const l = layout[i];
    if (l === void 0) continue;
    if (l.x + l.w > bounds.cols) {
      l.x = bounds.cols - l.w;
    }
    if (l.x < 0) {
      l.x = 0;
      l.w = bounds.cols;
    }
    if (!l.static) {
      collidesWith.push(l);
    } else {
      while (getFirstCollision(collidesWith, l)) {
        l.y++;
      }
    }
  }
  return layout;
}
function moveElement(layout, l, x, y, isUserAction, preventCollision, compactType, cols, allowOverlap) {
  if (l.static && l.isDraggable !== true) {
    return [...layout];
  }
  if (l.y === y && l.x === x) {
    return [...layout];
  }
  const oldX = l.x;
  const oldY = l.y;
  if (typeof x === "number") l.x = x;
  if (typeof y === "number") l.y = y;
  l.moved = true;
  let sorted = sortLayoutItems(layout, compactType);
  const movingUp = compactType === "vertical" && typeof y === "number" ? oldY >= y : compactType === "horizontal" && typeof x === "number" ? oldX >= x : false;
  if (movingUp) {
    sorted = sorted.reverse();
  }
  const collisions = getAllCollisions(sorted, l);
  const hasCollisions = collisions.length > 0;
  if (hasCollisions && allowOverlap) {
    return cloneLayout(layout);
  }
  if (hasCollisions && preventCollision) {
    l.x = oldX;
    l.y = oldY;
    l.moved = false;
    return layout;
  }
  let resultLayout = [...layout];
  for (let i = 0; i < collisions.length; i++) {
    const collision = collisions[i];
    if (collision === void 0) continue;
    if (collision.moved) continue;
    if (collision.static) {
      resultLayout = moveElementAwayFromCollision(
        resultLayout,
        collision,
        l,
        isUserAction,
        compactType
      );
    } else {
      resultLayout = moveElementAwayFromCollision(
        resultLayout,
        l,
        collision,
        isUserAction,
        compactType
      );
    }
  }
  return resultLayout;
}
function moveElementAwayFromCollision(layout, collidesWith, itemToMove, isUserAction, compactType, cols) {
  const compactH = compactType === "horizontal";
  const compactV = compactType === "vertical";
  const preventCollision = collidesWith.static;
  if (isUserAction) {
    isUserAction = false;
    const fakeItem = {
      x: compactH ? Math.max(collidesWith.x - itemToMove.w, 0) : itemToMove.x,
      y: compactV ? Math.max(collidesWith.y - itemToMove.h, 0) : itemToMove.y,
      w: itemToMove.w,
      h: itemToMove.h,
      i: "-1"
    };
    const firstCollision = getFirstCollision(layout, fakeItem);
    const collisionNorth = firstCollision !== void 0 && firstCollision.y + firstCollision.h > collidesWith.y;
    const collisionWest = firstCollision !== void 0 && collidesWith.x + collidesWith.w > firstCollision.x;
    if (!firstCollision) {
      return moveElement(
        layout,
        itemToMove,
        compactH ? fakeItem.x : void 0,
        compactV ? fakeItem.y : void 0,
        isUserAction,
        preventCollision,
        compactType
      );
    }
    if (collisionNorth && compactV) {
      return moveElement(
        layout,
        itemToMove,
        void 0,
        itemToMove.y + 1,
        isUserAction,
        preventCollision,
        compactType
      );
    }
    if (collisionNorth && compactType === null) {
      collidesWith.y = itemToMove.y;
      itemToMove.y = itemToMove.y + itemToMove.h;
      return [...layout];
    }
    if (collisionWest && compactH) {
      return moveElement(
        layout,
        collidesWith,
        itemToMove.x,
        void 0,
        isUserAction,
        preventCollision,
        compactType
      );
    }
  }
  const newX = compactH ? itemToMove.x + 1 : void 0;
  const newY = compactV ? itemToMove.y + 1 : void 0;
  if (newX === void 0 && newY === void 0) {
    return [...layout];
  }
  return moveElement(
    layout,
    itemToMove,
    newX,
    newY,
    isUserAction,
    preventCollision,
    compactType
  );
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
var gridBounds = {
  name: "gridBounds",
  constrainPosition(item, x, y, { cols, maxRows }) {
    return {
      x: clamp(x, 0, Math.max(0, cols - item.w)),
      y: clamp(y, 0, Math.max(0, maxRows - item.h))
    };
  },
  constrainSize(item, w, h, handle, { cols, maxRows }) {
    const maxW = handle === "w" || handle === "nw" || handle === "sw" ? item.x + item.w : cols - item.x;
    const maxH = handle === "n" || handle === "nw" || handle === "ne" ? item.y + item.h : maxRows - item.y;
    return {
      w: clamp(w, 1, Math.max(1, maxW)),
      h: clamp(h, 1, Math.max(1, maxH))
    };
  }
};
var minMaxSize = {
  name: "minMaxSize",
  constrainSize(item, w, h) {
    return {
      w: clamp(w, item.minW ?? 1, item.maxW ?? Infinity),
      h: clamp(h, item.minH ?? 1, item.maxH ?? Infinity)
    };
  }
};
var containerBounds = {
  name: "containerBounds",
  constrainPosition(item, x, y, { cols, maxRows, containerHeight, rowHeight, margin }) {
    const visibleRows = containerHeight > 0 ? Math.floor((containerHeight + margin[1]) / (rowHeight + margin[1])) : maxRows;
    return {
      x: clamp(x, 0, Math.max(0, cols - item.w)),
      y: clamp(y, 0, Math.max(0, visibleRows - item.h))
    };
  }
};
var defaultConstraints = [gridBounds, minMaxSize];
function applyPositionConstraints(constraints, item, x, y, context) {
  let result = { x, y };
  for (const constraint of constraints) {
    if (constraint.constrainPosition) {
      result = constraint.constrainPosition(item, result.x, result.y, context);
    }
  }
  if (item.constraints) {
    for (const constraint of item.constraints) {
      if (constraint.constrainPosition) {
        result = constraint.constrainPosition(
          item,
          result.x,
          result.y,
          context
        );
      }
    }
  }
  return result;
}
function applySizeConstraints(constraints, item, w, h, handle, context) {
  let result = { w, h };
  for (const constraint of constraints) {
    if (constraint.constrainSize) {
      result = constraint.constrainSize(
        item,
        result.w,
        result.h,
        handle,
        context
      );
    }
  }
  if (item.constraints) {
    for (const constraint of item.constraints) {
      if (constraint.constrainSize) {
        result = constraint.constrainSize(
          item,
          result.w,
          result.h,
          handle,
          context
        );
      }
    }
  }
  return result;
}
function setTransform({
  top,
  left,
  width,
  height
}) {
  const translate = `translate(${left}px,${top}px)`;
  return {
    transform: translate,
    WebkitTransform: translate,
    MozTransform: translate,
    msTransform: translate,
    OTransform: translate,
    width: `${width}px`,
    height: `${height}px`,
    position: "absolute"
  };
}
function setTopLeft({
  top,
  left,
  width,
  height
}) {
  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
    position: "absolute"
  };
}
function perc(num) {
  return num * 100 + "%";
}
function constrainWidth(left, currentWidth, newWidth, containerWidth) {
  return left + newWidth > containerWidth ? currentWidth : newWidth;
}
function constrainHeight(top, currentHeight, newHeight) {
  return top < 0 ? currentHeight : newHeight;
}
function constrainLeft(left) {
  return Math.max(0, left);
}
function constrainTop(top) {
  return Math.max(0, top);
}
var resizeNorth = (currentSize, newSize, _containerWidth) => {
  const { left, height, width } = newSize;
  const top = currentSize.top - (height - currentSize.height);
  return {
    left,
    width,
    height: constrainHeight(top, currentSize.height, height),
    top: constrainTop(top)
  };
};
var resizeEast = (currentSize, newSize, containerWidth) => {
  const { top, left, height, width } = newSize;
  return {
    top,
    height,
    width: constrainWidth(
      currentSize.left,
      currentSize.width,
      width,
      containerWidth
    ),
    left: constrainLeft(left)
  };
};
var resizeWest = (currentSize, newSize, _containerWidth) => {
  const { top, height, width } = newSize;
  const left = currentSize.left + currentSize.width - width;
  if (left < 0) {
    return {
      height,
      width: currentSize.left + currentSize.width,
      top: constrainTop(top),
      left: 0
    };
  }
  return {
    height,
    width,
    top: constrainTop(top),
    left
  };
};
var resizeSouth = (currentSize, newSize, _containerWidth) => {
  const { top, left, height, width } = newSize;
  return {
    width,
    left,
    height: constrainHeight(top, currentSize.height, height),
    top: constrainTop(top)
  };
};
var resizeNorthEast = (currentSize, newSize, containerWidth) => resizeNorth(
  currentSize,
  resizeEast(currentSize, newSize, containerWidth)
);
var resizeNorthWest = (currentSize, newSize, containerWidth) => resizeNorth(
  currentSize,
  resizeWest(currentSize, newSize)
);
var resizeSouthEast = (currentSize, newSize, containerWidth) => resizeSouth(
  currentSize,
  resizeEast(currentSize, newSize, containerWidth)
);
var resizeSouthWest = (currentSize, newSize, containerWidth) => resizeSouth(
  currentSize,
  resizeWest(currentSize, newSize)
);
var resizeHandlerMap = {
  n: resizeNorth,
  ne: resizeNorthEast,
  e: resizeEast,
  se: resizeSouthEast,
  s: resizeSouth,
  sw: resizeSouthWest,
  w: resizeWest,
  nw: resizeNorthWest
};
function resizeItemInDirection(direction, currentSize, newSize, containerWidth) {
  const handler = resizeHandlerMap[direction];
  if (!handler) {
    return newSize;
  }
  return handler(currentSize, { ...currentSize, ...newSize }, containerWidth);
}
var transformStrategy = {
  type: "transform",
  scale: 1,
  calcStyle(pos) {
    return setTransform(pos);
  }
};
var absoluteStrategy = {
  type: "absolute",
  scale: 1,
  calcStyle(pos) {
    return setTopLeft(pos);
  }
};
function createScaledStrategy(scale) {
  return {
    type: "transform",
    scale,
    calcStyle(pos) {
      return setTransform(pos);
    },
    calcDragPosition(clientX, clientY, offsetX, offsetY) {
      return {
        left: (clientX - offsetX) / scale,
        top: (clientY - offsetY) / scale
      };
    }
  };
}
var defaultPositionStrategy = transformStrategy;
var defaultGridConfig = {
  cols: 12,
  rowHeight: 150,
  margin: [10, 10],
  containerPadding: null,
  maxRows: Infinity
};
var defaultDragConfig = {
  enabled: true,
  bounded: false,
  threshold: 3
};
var defaultResizeConfig = {
  enabled: true,
  handles: ["se"]
};
var defaultDropConfig = {
  enabled: false,
  defaultItem: { w: 1, h: 1 }
};
function resolveCompactionCollision(layout, item, moveToCoord, axis, hasStatics) {
  const sizeProp = axis === "x" ? "w" : "h";
  item[axis] += 1;
  const itemIndex = layout.findIndex((l) => l.i === item.i);
  const layoutHasStatics = hasStatics ?? getStatics(layout).length > 0;
  for (let i = itemIndex + 1; i < layout.length; i++) {
    const otherItem = layout[i];
    if (otherItem === void 0) continue;
    if (otherItem.static) continue;
    if (!layoutHasStatics && otherItem.y > item.y + item.h) break;
    if (collides(item, otherItem)) {
      resolveCompactionCollision(
        layout,
        otherItem,
        moveToCoord + item[sizeProp],
        axis,
        layoutHasStatics
      );
    }
  }
  item[axis] = moveToCoord;
}
function compactItemVertical(compareWith, l, fullLayout, maxY) {
  l.x = Math.max(l.x, 0);
  l.y = Math.max(l.y, 0);
  l.y = Math.min(maxY, l.y);
  while (l.y > 0 && !getFirstCollision(compareWith, l)) {
    l.y--;
  }
  let collision;
  while ((collision = getFirstCollision(compareWith, l)) !== void 0) {
    resolveCompactionCollision(fullLayout, l, collision.y + collision.h, "y");
  }
  l.y = Math.max(l.y, 0);
  return l;
}
function compactItemHorizontal(compareWith, l, cols, fullLayout) {
  l.x = Math.max(l.x, 0);
  l.y = Math.max(l.y, 0);
  while (l.x > 0 && !getFirstCollision(compareWith, l)) {
    l.x--;
  }
  let collision;
  while ((collision = getFirstCollision(compareWith, l)) !== void 0) {
    resolveCompactionCollision(fullLayout, l, collision.x + collision.w, "x");
    if (l.x + l.w > cols) {
      l.x = cols - l.w;
      l.y++;
      while (l.x > 0 && !getFirstCollision(compareWith, l)) {
        l.x--;
      }
    }
  }
  l.x = Math.max(l.x, 0);
  return l;
}
var verticalCompactor = {
  type: "vertical",
  allowOverlap: false,
  compact(layout, _cols) {
    const compareWith = getStatics(layout);
    let maxY = bottom(compareWith);
    const sorted = sortLayoutItemsByRowCol(layout);
    const out = new Array(layout.length);
    for (let i = 0; i < sorted.length; i++) {
      const sortedItem = sorted[i];
      if (sortedItem === void 0) continue;
      let l = cloneLayoutItem(sortedItem);
      if (!l.static) {
        l = compactItemVertical(compareWith, l, sorted, maxY);
        maxY = Math.max(maxY, l.y + l.h);
        compareWith.push(l);
      }
      const originalIndex = layout.indexOf(sortedItem);
      out[originalIndex] = l;
      l.moved = false;
    }
    return out;
  }
};
var horizontalCompactor = {
  type: "horizontal",
  allowOverlap: false,
  compact(layout, cols) {
    const compareWith = getStatics(layout);
    const sorted = sortLayoutItemsByColRow(layout);
    const out = new Array(layout.length);
    for (let i = 0; i < sorted.length; i++) {
      const sortedItem = sorted[i];
      if (sortedItem === void 0) continue;
      let l = cloneLayoutItem(sortedItem);
      if (!l.static) {
        l = compactItemHorizontal(compareWith, l, cols, sorted);
        compareWith.push(l);
      }
      const originalIndex = layout.indexOf(sortedItem);
      out[originalIndex] = l;
      l.moved = false;
    }
    return out;
  }
};
var noCompactor = {
  type: null,
  allowOverlap: false,
  compact(layout, _cols) {
    return cloneLayout(layout);
  }
};
var verticalOverlapCompactor = {
  ...verticalCompactor,
  allowOverlap: true,
  compact(layout, _cols) {
    return cloneLayout(layout);
  }
};
var horizontalOverlapCompactor = {
  ...horizontalCompactor,
  allowOverlap: true,
  compact(layout, _cols) {
    return cloneLayout(layout);
  }
};
var noOverlapCompactor = {
  ...noCompactor,
  allowOverlap: true
};
function getCompactor(compactType, allowOverlap = false, preventCollision = false) {
  let baseCompactor;
  if (allowOverlap) {
    if (compactType === "vertical") baseCompactor = verticalOverlapCompactor;
    else if (compactType === "horizontal")
      baseCompactor = horizontalOverlapCompactor;
    else baseCompactor = noOverlapCompactor;
  } else {
    if (compactType === "vertical") baseCompactor = verticalCompactor;
    else if (compactType === "horizontal") baseCompactor = horizontalCompactor;
    else baseCompactor = noCompactor;
  }
  if (preventCollision) {
    return { ...baseCompactor, preventCollision };
  }
  return baseCompactor;
}
function GridItem(props) {
  const {
    children,
    cols,
    containerWidth,
    margin,
    containerPadding,
    rowHeight,
    maxRows,
    isDraggable,
    isResizable,
    isBounded,
    static: isStatic,
    useCSSTransforms = true,
    usePercentages = false,
    transformScale = 1,
    positionStrategy,
    dragThreshold = 0,
    droppingPosition,
    className = "",
    style,
    handle = "",
    cancel = "",
    x,
    y,
    w,
    h,
    minW = 1,
    maxW = Infinity,
    minH = 1,
    maxH = Infinity,
    i,
    resizeHandles,
    resizeHandle,
    constraints = defaultConstraints,
    layoutItem,
    layout = [],
    onDragStart: onDragStartProp,
    onDrag: onDragProp,
    onDragStop: onDragStopProp,
    onResizeStart: onResizeStartProp,
    onResize: onResizeProp,
    onResizeStop: onResizeStopProp
  } = props;
  const [dragging, setDragging] = reactExports.useState(false);
  const [resizing, setResizing] = reactExports.useState(false);
  const elementRef = reactExports.useRef(null);
  const dragPositionRef = reactExports.useRef({ left: 0, top: 0 });
  const resizePositionRef = reactExports.useRef({
    top: 0,
    left: 0,
    width: 0,
    height: 0
  });
  const prevDroppingPositionRef = reactExports.useRef(
    void 0
  );
  const layoutRef = reactExports.useRef(layout);
  layoutRef.current = layout;
  const onDragStartRef = reactExports.useRef(null);
  const onDragRef = reactExports.useRef(null);
  const dragPendingRef = reactExports.useRef(false);
  const initialDragClientRef = reactExports.useRef({ x: 0, y: 0 });
  const thresholdExceededRef = reactExports.useRef(false);
  const positionParams = reactExports.useMemo(
    () => ({
      cols,
      containerPadding,
      containerWidth,
      margin,
      maxRows,
      rowHeight
    }),
    [cols, containerPadding, containerWidth, margin, maxRows, rowHeight]
  );
  const constraintContext = reactExports.useMemo(
    () => ({
      cols,
      maxRows,
      containerWidth,
      containerHeight: 0,
      // Auto-height grids don't have a fixed container height
      rowHeight,
      margin,
      // Use empty layout here - the actual layout will be accessed via layoutRef when needed
      // This prevents the context from changing when layout changes, avoiding callback recreation
      layout: []
    }),
    [cols, maxRows, containerWidth, rowHeight, margin]
  );
  const getConstraintContext = reactExports.useCallback(
    () => ({
      ...constraintContext,
      layout: layoutRef.current
    }),
    [constraintContext]
  );
  const effectiveLayoutItem = reactExports.useMemo(
    () => layoutItem ?? {
      i,
      x,
      y,
      w,
      h,
      minW,
      maxW,
      minH,
      maxH
    },
    [layoutItem, i, x, y, w, h, minW, maxW, minH, maxH]
  );
  const createStyle = reactExports.useCallback(
    (pos2) => {
      if (positionStrategy?.calcStyle) {
        return positionStrategy.calcStyle(pos2);
      }
      if (useCSSTransforms) {
        return setTransform(pos2);
      }
      const styleObj = setTopLeft(pos2);
      if (usePercentages) {
        return {
          ...styleObj,
          left: perc(pos2.left / containerWidth),
          width: perc(pos2.width / containerWidth)
        };
      }
      return styleObj;
    },
    [positionStrategy, useCSSTransforms, usePercentages, containerWidth]
  );
  const onDragStart = reactExports.useCallback(
    (e, { node }) => {
      if (!onDragStartProp) return;
      const { offsetParent } = node;
      if (!offsetParent) return;
      const parentRect = offsetParent.getBoundingClientRect();
      const clientRect = node.getBoundingClientRect();
      const cLeft = clientRect.left / transformScale;
      const pLeft = parentRect.left / transformScale;
      const cTop = clientRect.top / transformScale;
      const pTop = parentRect.top / transformScale;
      let newPosition;
      if (positionStrategy?.calcDragPosition) {
        const mouseEvent = e;
        newPosition = positionStrategy.calcDragPosition(
          mouseEvent.clientX,
          mouseEvent.clientY,
          mouseEvent.clientX - clientRect.left,
          mouseEvent.clientY - clientRect.top
        );
      } else {
        newPosition = {
          left: cLeft - pLeft + offsetParent.scrollLeft,
          top: cTop - pTop + offsetParent.scrollTop
        };
      }
      dragPositionRef.current = newPosition;
      if (dragThreshold > 0) {
        const mouseEvent = e;
        initialDragClientRef.current = {
          x: mouseEvent.clientX,
          y: mouseEvent.clientY
        };
        dragPendingRef.current = true;
        thresholdExceededRef.current = false;
        setDragging(true);
        return;
      }
      setDragging(true);
      const rawPos = calcXYRaw(
        positionParams,
        newPosition.top,
        newPosition.left
      );
      const { x: newX, y: newY } = applyPositionConstraints(
        constraints,
        effectiveLayoutItem,
        rawPos.x,
        rawPos.y,
        getConstraintContext()
      );
      onDragStartProp(i, newX, newY, {
        e,
        node,
        newPosition
      });
    },
    [
      onDragStartProp,
      transformScale,
      positionParams,
      positionStrategy,
      dragThreshold,
      constraints,
      effectiveLayoutItem,
      getConstraintContext,
      i
    ]
  );
  const onDrag = reactExports.useCallback(
    (e, { node, deltaX, deltaY }) => {
      if (!onDragProp || !dragging) return;
      const mouseEvent = e;
      if (dragPendingRef.current && !thresholdExceededRef.current) {
        const dx = mouseEvent.clientX - initialDragClientRef.current.x;
        const dy = mouseEvent.clientY - initialDragClientRef.current.y;
        const distance = Math.hypot(dx, dy);
        if (distance < dragThreshold) {
          return;
        }
        thresholdExceededRef.current = true;
        dragPendingRef.current = false;
        if (onDragStartProp) {
          const rawPos2 = calcXYRaw(
            positionParams,
            dragPositionRef.current.top,
            dragPositionRef.current.left
          );
          const { x: startX, y: startY } = applyPositionConstraints(
            constraints,
            effectiveLayoutItem,
            rawPos2.x,
            rawPos2.y,
            getConstraintContext()
          );
          onDragStartProp(i, startX, startY, {
            e,
            node,
            newPosition: dragPositionRef.current
          });
        }
      }
      let top = dragPositionRef.current.top + deltaY;
      let left = dragPositionRef.current.left + deltaX;
      if (isBounded) {
        const { offsetParent } = node;
        if (offsetParent) {
          const bottomBoundary = offsetParent.clientHeight - calcGridItemWHPx(h, rowHeight, margin[1]);
          top = clamp$1(top, 0, bottomBoundary);
          const colWidth = calcGridColWidth(positionParams);
          const rightBoundary = containerWidth - calcGridItemWHPx(w, colWidth, margin[0]);
          left = clamp$1(left, 0, rightBoundary);
        }
      }
      const newPosition = { top, left };
      dragPositionRef.current = newPosition;
      const rawPos = calcXYRaw(positionParams, top, left);
      const { x: newX, y: newY } = applyPositionConstraints(
        constraints,
        effectiveLayoutItem,
        rawPos.x,
        rawPos.y,
        getConstraintContext()
      );
      onDragProp(i, newX, newY, {
        e,
        node,
        newPosition
      });
    },
    [
      onDragProp,
      onDragStartProp,
      dragging,
      dragThreshold,
      isBounded,
      h,
      rowHeight,
      margin,
      positionParams,
      containerWidth,
      w,
      i,
      constraints,
      effectiveLayoutItem,
      getConstraintContext
    ]
  );
  const onDragStop = reactExports.useCallback(
    (e, { node }) => {
      if (!onDragStopProp || !dragging) return;
      const wasPending = dragPendingRef.current;
      dragPendingRef.current = false;
      thresholdExceededRef.current = false;
      initialDragClientRef.current = { x: 0, y: 0 };
      if (wasPending) {
        setDragging(false);
        dragPositionRef.current = { left: 0, top: 0 };
        return;
      }
      const { left, top } = dragPositionRef.current;
      const newPosition = { top, left };
      setDragging(false);
      dragPositionRef.current = { left: 0, top: 0 };
      const rawPos = calcXYRaw(positionParams, top, left);
      const { x: newX, y: newY } = applyPositionConstraints(
        constraints,
        effectiveLayoutItem,
        rawPos.x,
        rawPos.y,
        getConstraintContext()
      );
      onDragStopProp(i, newX, newY, {
        e,
        node,
        newPosition
      });
    },
    [
      onDragStopProp,
      dragging,
      positionParams,
      constraints,
      effectiveLayoutItem,
      getConstraintContext,
      i
    ]
  );
  onDragStartRef.current = onDragStart;
  onDragRef.current = onDrag;
  const onResizeHandler = reactExports.useCallback(
    (e, { node, size, handle: resizeHandle2 }, position, handlerName) => {
      const handler = handlerName === "onResizeStart" ? onResizeStartProp : handlerName === "onResize" ? onResizeProp : onResizeStopProp;
      if (!handler) return;
      let updatedSize;
      if (node) {
        updatedSize = resizeItemInDirection(
          resizeHandle2,
          position,
          size,
          containerWidth
        );
      } else {
        updatedSize = {
          ...size,
          top: position.top,
          left: position.left
        };
      }
      resizePositionRef.current = updatedSize;
      const rawSize = calcWHRaw(
        positionParams,
        updatedSize.width,
        updatedSize.height
      );
      const { w: newW, h: newH } = applySizeConstraints(
        constraints,
        effectiveLayoutItem,
        rawSize.w,
        rawSize.h,
        resizeHandle2,
        getConstraintContext()
      );
      handler(i, newW, newH, {
        e: e.nativeEvent,
        node,
        size: updatedSize,
        handle: resizeHandle2
      });
    },
    [
      onResizeStartProp,
      onResizeProp,
      onResizeStopProp,
      containerWidth,
      positionParams,
      i,
      constraints,
      effectiveLayoutItem,
      getConstraintContext
    ]
  );
  const handleResizeStart = reactExports.useCallback(
    (e, data) => {
      setResizing(true);
      const pos2 = calcGridItemPosition(positionParams, x, y, w, h);
      const typedData = {
        ...data,
        handle: data.handle
      };
      onResizeHandler(e, typedData, pos2, "onResizeStart");
    },
    [onResizeHandler, positionParams, x, y, w, h]
  );
  const handleResize = reactExports.useCallback(
    (e, data) => {
      const pos2 = calcGridItemPosition(positionParams, x, y, w, h);
      const typedData = {
        ...data,
        handle: data.handle
      };
      onResizeHandler(e, typedData, pos2, "onResize");
    },
    [onResizeHandler, positionParams, x, y, w, h]
  );
  const handleResizeStop = reactExports.useCallback(
    (e, data) => {
      setResizing(false);
      resizePositionRef.current = { top: 0, left: 0, width: 0, height: 0 };
      const pos2 = calcGridItemPosition(positionParams, x, y, w, h);
      const typedData = {
        ...data,
        handle: data.handle
      };
      onResizeHandler(e, typedData, pos2, "onResizeStop");
    },
    [onResizeHandler, positionParams, x, y, w, h]
  );
  reactExports.useEffect(() => {
    if (!droppingPosition) return;
    const node = elementRef.current;
    if (!node) return;
    const prevDroppingPosition = prevDroppingPositionRef.current || {
      left: 0,
      top: 0
    };
    const shouldDrag = dragging && (droppingPosition.left !== prevDroppingPosition.left || droppingPosition.top !== prevDroppingPosition.top);
    if (!dragging) {
      const fakeData = {
        node,
        deltaX: droppingPosition.left,
        deltaY: droppingPosition.top,
        lastX: 0,
        lastY: 0,
        x: droppingPosition.left,
        y: droppingPosition.top
      };
      onDragStartRef.current?.(
        droppingPosition.e,
        fakeData
      );
    } else if (shouldDrag) {
      const deltaX = droppingPosition.left - dragPositionRef.current.left;
      const deltaY = droppingPosition.top - dragPositionRef.current.top;
      const fakeData = {
        node,
        deltaX,
        deltaY,
        lastX: dragPositionRef.current.left,
        lastY: dragPositionRef.current.top,
        x: droppingPosition.left,
        y: droppingPosition.top
      };
      onDragRef.current?.(
        droppingPosition.e,
        fakeData
      );
    }
    prevDroppingPositionRef.current = droppingPosition;
  }, [droppingPosition, dragging, i]);
  const pos = calcGridItemPosition(
    positionParams,
    x,
    y,
    w,
    h,
    dragging ? dragPositionRef.current : null,
    resizing ? resizePositionRef.current : null
  );
  const child = React.Children.only(children);
  const minGridUnit = calcGridItemPosition(positionParams, 0, 0, 1, 1);
  const minConstraints = [
    minGridUnit.width,
    minGridUnit.height
  ];
  const maxConstraints = [Infinity, Infinity];
  const childProps = child.props;
  const childClassName = childProps["className"];
  const childStyle = childProps["style"];
  let newChild = React.cloneElement(child, {
    ref: elementRef,
    className: clsx("react-grid-item", childClassName, className, {
      static: isStatic,
      resizing,
      "react-draggable": isDraggable,
      "react-draggable-dragging": dragging,
      dropping: Boolean(droppingPosition),
      cssTransforms: useCSSTransforms
    }),
    style: {
      ...style,
      ...childStyle,
      ...createStyle(pos)
    }
  });
  const resizableHandle = resizeHandle;
  newChild = /* @__PURE__ */ jsxRuntimeExports.jsx(
    reactResizableExports.Resizable,
    {
      draggableOpts: { disabled: !isResizable },
      className: isResizable ? void 0 : "react-resizable-hide",
      width: pos.width,
      height: pos.height,
      minConstraints,
      maxConstraints,
      onResizeStart: handleResizeStart,
      onResize: handleResize,
      onResizeStop: handleResizeStop,
      transformScale,
      resizeHandles,
      handle: resizableHandle,
      children: newChild
    }
  );
  newChild = /* @__PURE__ */ jsxRuntimeExports.jsx(
    cjsExports.DraggableCore,
    {
      disabled: !isDraggable,
      onStart: onDragStart,
      onDrag,
      onStop: onDragStop,
      handle,
      cancel: ".react-resizable-handle" + (cancel ? "," + cancel : ""),
      scale: transformScale,
      nodeRef: elementRef,
      children: newChild
    }
  );
  return newChild;
}
var noop = () => {
};
var layoutClassName$1 = "react-grid-layout";
var isFirefox = false;
try {
  isFirefox = /firefox/i.test(navigator.userAgent);
} catch {
}
function childrenEqual(a, b) {
  const aArr = React.Children.toArray(a);
  const bArr = React.Children.toArray(b);
  if (aArr.length !== bArr.length) return false;
  for (let i = 0; i < aArr.length; i++) {
    const aChild = aArr[i];
    const bChild = bArr[i];
    if (aChild?.key !== bChild?.key) return false;
  }
  return true;
}
function synchronizeLayoutWithChildren(initialLayout, children, cols, compactor) {
  const layout = [];
  const childKeys = /* @__PURE__ */ new Set();
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || child.key === null) return;
    const key = String(child.key);
    childKeys.add(key);
    const existingItem = initialLayout.find((l) => l.i === key);
    if (existingItem) {
      layout.push(cloneLayoutItem(existingItem));
    } else {
      const childProps = child.props;
      const dataGrid = childProps["data-grid"];
      if (dataGrid) {
        layout.push({
          i: key,
          x: dataGrid.x ?? 0,
          y: dataGrid.y ?? 0,
          w: dataGrid.w ?? 1,
          h: dataGrid.h ?? 1,
          minW: dataGrid.minW,
          maxW: dataGrid.maxW,
          minH: dataGrid.minH,
          maxH: dataGrid.maxH,
          static: dataGrid.static,
          isDraggable: dataGrid.isDraggable,
          isResizable: dataGrid.isResizable,
          resizeHandles: dataGrid.resizeHandles,
          isBounded: dataGrid.isBounded
        });
      } else {
        layout.push({
          i: key,
          x: 0,
          y: bottom(layout),
          w: 1,
          h: 1
        });
      }
    }
  });
  const corrected = correctBounds(layout, { cols });
  return compactor.compact(corrected, cols);
}
function GridLayout(props) {
  const {
    // Required
    children,
    width,
    // Composable config interfaces
    gridConfig: gridConfigProp,
    dragConfig: dragConfigProp,
    resizeConfig: resizeConfigProp,
    dropConfig: dropConfigProp,
    positionStrategy = defaultPositionStrategy,
    compactor: compactorProp,
    constraints = defaultConstraints,
    // Layout data
    layout: propsLayout = [],
    droppingItem: droppingItemProp,
    // Container props
    autoSize = true,
    className = "",
    style = {},
    innerRef,
    // Callbacks
    onLayoutChange = noop,
    onDragStart: onDragStartProp = noop,
    onDrag: onDragProp = noop,
    onDragStop: onDragStopProp = noop,
    onResizeStart: onResizeStartProp = noop,
    onResize: onResizeProp = noop,
    onResizeStop: onResizeStopProp = noop,
    onDrop: onDropProp = noop,
    onDropDragOver: onDropDragOverProp = noop
  } = props;
  const gridConfig = reactExports.useMemo(
    () => ({ ...defaultGridConfig, ...gridConfigProp }),
    [gridConfigProp]
  );
  const dragConfig = reactExports.useMemo(
    () => ({ ...defaultDragConfig, ...dragConfigProp }),
    [dragConfigProp]
  );
  const resizeConfig = reactExports.useMemo(
    () => ({ ...defaultResizeConfig, ...resizeConfigProp }),
    [resizeConfigProp]
  );
  const dropConfig = reactExports.useMemo(
    () => ({ ...defaultDropConfig, ...dropConfigProp }),
    [dropConfigProp]
  );
  const { cols, rowHeight, maxRows, margin, containerPadding } = gridConfig;
  const {
    enabled: isDraggable,
    bounded: isBounded,
    handle: draggableHandle,
    cancel: draggableCancel,
    threshold: dragThreshold
  } = dragConfig;
  const {
    enabled: isResizable,
    handles: resizeHandles,
    handleComponent: resizeHandle
  } = resizeConfig;
  const {
    enabled: isDroppable,
    defaultItem: defaultDropItem,
    onDragOver: dropConfigOnDragOver
  } = dropConfig;
  const compactor = compactorProp ?? getCompactor("vertical");
  const compactType = compactor.type;
  const allowOverlap = compactor.allowOverlap;
  const preventCollision = compactor.preventCollision ?? false;
  const droppingItem = reactExports.useMemo(
    () => droppingItemProp ?? {
      i: "__dropping-elem__",
      ...defaultDropItem
    },
    [droppingItemProp, defaultDropItem]
  );
  const useCSSTransforms = positionStrategy.type === "transform";
  const transformScale = positionStrategy.scale;
  const effectiveContainerPadding = containerPadding ?? margin;
  const [mounted, setMounted] = reactExports.useState(false);
  const [layout, setLayout] = reactExports.useState(
    () => synchronizeLayoutWithChildren(propsLayout, children, cols, compactor)
  );
  const [activeDrag, setActiveDrag] = reactExports.useState(null);
  const [resizing, setResizing] = reactExports.useState(false);
  const [droppingDOMNode, setDroppingDOMNode] = reactExports.useState(
    null
  );
  const [droppingPosition, setDroppingPosition] = reactExports.useState();
  const oldDragItemRef = reactExports.useRef(null);
  const oldResizeItemRef = reactExports.useRef(null);
  const oldLayoutRef = reactExports.useRef(null);
  const dragEnterCounterRef = reactExports.useRef(0);
  const prevLayoutRef = reactExports.useRef(layout);
  const prevPropsLayoutRef = reactExports.useRef(propsLayout);
  const prevChildrenRef = reactExports.useRef(children);
  const prevCompactTypeRef = reactExports.useRef(compactType);
  const layoutRef = reactExports.useRef(layout);
  layoutRef.current = layout;
  reactExports.useEffect(() => {
    setMounted(true);
    if (!deepEqual(layout, propsLayout)) {
      onLayoutChange(layout);
    }
  }, []);
  reactExports.useEffect(() => {
    if (activeDrag) return;
    if (droppingDOMNode) return;
    const layoutChanged = !deepEqual(propsLayout, prevPropsLayoutRef.current);
    const childrenChanged = !childrenEqual(children, prevChildrenRef.current);
    const compactTypeChanged = compactType !== prevCompactTypeRef.current;
    if (layoutChanged || childrenChanged || compactTypeChanged) {
      const baseLayout = layoutChanged ? propsLayout : layout;
      const newLayout = synchronizeLayoutWithChildren(
        baseLayout,
        children,
        cols,
        compactor
      );
      if (!deepEqual(newLayout, layout)) {
        setLayout(newLayout);
      }
    }
    prevPropsLayoutRef.current = propsLayout;
    prevChildrenRef.current = children;
    prevCompactTypeRef.current = compactType;
  }, [
    propsLayout,
    children,
    cols,
    compactType,
    compactor,
    activeDrag,
    droppingDOMNode,
    layout
  ]);
  reactExports.useEffect(() => {
    if (!activeDrag && !deepEqual(layout, prevLayoutRef.current)) {
      prevLayoutRef.current = layout;
      const publicLayout = layout.filter((l) => l.i !== droppingItem.i);
      onLayoutChange(publicLayout);
    }
  }, [layout, activeDrag, onLayoutChange, droppingItem.i]);
  const containerHeight = reactExports.useMemo(() => {
    if (!autoSize) return void 0;
    const nbRow = bottom(layout);
    const containerPaddingY = effectiveContainerPadding[1];
    return nbRow * rowHeight + (nbRow - 1) * margin[1] + containerPaddingY * 2 + "px";
  }, [autoSize, layout, rowHeight, margin, effectiveContainerPadding]);
  const onDragStart = reactExports.useCallback(
    (i, _x, _y, data) => {
      const currentLayout = layoutRef.current;
      const l = getLayoutItem(currentLayout, i);
      if (!l) return;
      const placeholder = {
        w: l.w,
        h: l.h,
        x: l.x,
        y: l.y,
        i
      };
      oldDragItemRef.current = cloneLayoutItem(l);
      oldLayoutRef.current = currentLayout;
      setActiveDrag(placeholder);
      onDragStartProp(currentLayout, l, l, null, data.e, data.node);
    },
    [onDragStartProp]
  );
  const onDrag = reactExports.useCallback(
    (i, x, y, data) => {
      const currentLayout = layoutRef.current;
      const oldDragItem = oldDragItemRef.current;
      const l = getLayoutItem(currentLayout, i);
      if (!l) return;
      const placeholder = {
        w: l.w,
        h: l.h,
        x: l.x,
        y: l.y,
        i
      };
      const newLayout = moveElement(
        currentLayout,
        l,
        x,
        y,
        true,
        preventCollision,
        compactType,
        cols,
        allowOverlap
      );
      onDragProp(newLayout, oldDragItem, l, placeholder, data.e, data.node);
      setLayout(compactor.compact(newLayout, cols));
      setActiveDrag(placeholder);
    },
    [preventCollision, compactType, cols, allowOverlap, compactor, onDragProp]
  );
  const onDragStop = reactExports.useCallback(
    (i, x, y, data) => {
      if (!activeDrag) return;
      const currentLayout = layoutRef.current;
      const oldDragItem = oldDragItemRef.current;
      const l = getLayoutItem(currentLayout, i);
      if (!l) return;
      const newLayout = moveElement(
        currentLayout,
        l,
        x,
        y,
        true,
        preventCollision,
        compactType,
        cols,
        allowOverlap
      );
      const finalLayout = compactor.compact(newLayout, cols);
      onDragStopProp(finalLayout, oldDragItem, l, null, data.e, data.node);
      const oldLayout = oldLayoutRef.current;
      oldDragItemRef.current = null;
      oldLayoutRef.current = null;
      setActiveDrag(null);
      setLayout(finalLayout);
      if (oldLayout && !deepEqual(oldLayout, finalLayout)) {
        onLayoutChange(finalLayout);
      }
    },
    [
      activeDrag,
      preventCollision,
      compactType,
      cols,
      allowOverlap,
      compactor,
      onDragStopProp,
      onLayoutChange
    ]
  );
  const onResizeStart = reactExports.useCallback(
    (i, _w, _h, data) => {
      const currentLayout = layoutRef.current;
      const l = getLayoutItem(currentLayout, i);
      if (!l) return;
      oldResizeItemRef.current = cloneLayoutItem(l);
      oldLayoutRef.current = currentLayout;
      setResizing(true);
      onResizeStartProp(currentLayout, l, l, null, data.e, data.node);
    },
    [onResizeStartProp]
  );
  const onResize = reactExports.useCallback(
    (i, w, h, data) => {
      const currentLayout = layoutRef.current;
      const oldResizeItem = oldResizeItemRef.current;
      const { handle } = data;
      let shouldMoveItem = false;
      let newX;
      let newY;
      const [newLayout, l] = withLayoutItem(currentLayout, i, (item) => {
        newX = item.x;
        newY = item.y;
        if (["sw", "w", "nw", "n", "ne"].includes(handle)) {
          if (["sw", "nw", "w"].includes(handle)) {
            newX = item.x + (item.w - w);
            w = item.x !== newX && newX < 0 ? item.w : w;
            newX = newX < 0 ? 0 : newX;
          }
          if (["ne", "n", "nw"].includes(handle)) {
            newY = item.y + (item.h - h);
            h = item.y !== newY && newY < 0 ? item.h : h;
            newY = newY < 0 ? 0 : newY;
          }
          shouldMoveItem = true;
        }
        if (preventCollision && !allowOverlap) {
          const collisions = getAllCollisions(currentLayout, {
            ...item,
            w,
            h,
            x: newX ?? item.x,
            y: newY ?? item.y
          }).filter((layoutItem) => layoutItem.i !== item.i);
          if (collisions.length > 0) {
            newY = item.y;
            h = item.h;
            newX = item.x;
            w = item.w;
            shouldMoveItem = false;
          }
        }
        item.w = w;
        item.h = h;
        return item;
      });
      if (!l) return;
      let finalLayout = newLayout;
      if (shouldMoveItem && newX !== void 0 && newY !== void 0) {
        finalLayout = moveElement(
          newLayout,
          l,
          newX,
          newY,
          true,
          preventCollision,
          compactType,
          cols,
          allowOverlap
        );
      }
      const placeholder = {
        w: l.w,
        h: l.h,
        x: l.x,
        y: l.y,
        i,
        static: true
      };
      onResizeProp(
        finalLayout,
        oldResizeItem,
        l,
        placeholder,
        data.e,
        data.node
      );
      setLayout(compactor.compact(finalLayout, cols));
      setActiveDrag(placeholder);
    },
    [preventCollision, compactType, cols, allowOverlap, compactor, onResizeProp]
  );
  const onResizeStop = reactExports.useCallback(
    (i, _w, _h, data) => {
      const currentLayout = layoutRef.current;
      const oldResizeItem = oldResizeItemRef.current;
      const l = getLayoutItem(currentLayout, i);
      const finalLayout = compactor.compact(currentLayout, cols);
      onResizeStopProp(
        finalLayout,
        oldResizeItem,
        l ?? null,
        null,
        data.e,
        data.node
      );
      const oldLayout = oldLayoutRef.current;
      oldResizeItemRef.current = null;
      oldLayoutRef.current = null;
      setActiveDrag(null);
      setResizing(false);
      setLayout(finalLayout);
      if (oldLayout && !deepEqual(oldLayout, finalLayout)) {
        onLayoutChange(finalLayout);
      }
    },
    [cols, compactor, onResizeStopProp, onLayoutChange]
  );
  const removeDroppingPlaceholder = reactExports.useCallback(() => {
    const currentLayout = layoutRef.current;
    const hasDroppingItem = currentLayout.some((l) => l.i === droppingItem.i);
    if (!hasDroppingItem) {
      setDroppingDOMNode(null);
      setActiveDrag(null);
      setDroppingPosition(void 0);
      return;
    }
    const newLayout = compactor.compact(
      currentLayout.filter((l) => l.i !== droppingItem.i),
      cols
    );
    setLayout(newLayout);
    setDroppingDOMNode(null);
    setActiveDrag(null);
    setDroppingPosition(void 0);
  }, [droppingItem.i, cols, compactor]);
  const handleDragOver = reactExports.useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isFirefox && !e.nativeEvent.target?.classList.contains(
        layoutClassName$1
      )) {
        return false;
      }
      const rawResult = dropConfigOnDragOver ? dropConfigOnDragOver(e.nativeEvent) : onDropDragOverProp(e);
      if (rawResult === false) {
        if (droppingDOMNode) {
          removeDroppingPlaceholder();
        }
        return false;
      }
      const {
        dragOffsetX = 0,
        dragOffsetY = 0,
        ...onDragOverResult
      } = rawResult ?? {};
      const finalDroppingItem = { ...droppingItem, ...onDragOverResult };
      const gridRect = e.currentTarget.getBoundingClientRect();
      const positionParams = {
        cols,
        margin,
        maxRows,
        rowHeight,
        containerWidth: width,
        containerPadding: effectiveContainerPadding
      };
      const actualColWidth = calcGridColWidth(positionParams);
      const itemPixelWidth = calcGridItemWHPx(
        finalDroppingItem.w,
        actualColWidth,
        margin[0]
      );
      const itemPixelHeight = calcGridItemWHPx(
        finalDroppingItem.h,
        rowHeight,
        margin[1]
      );
      const itemCenterOffsetX = itemPixelWidth / 2;
      const itemCenterOffsetY = itemPixelHeight / 2;
      const rawGridX = e.clientX - gridRect.left + dragOffsetX - itemCenterOffsetX;
      const rawGridY = e.clientY - gridRect.top + dragOffsetY - itemCenterOffsetY;
      const clampedGridX = Math.max(0, rawGridX);
      const clampedGridY = Math.max(0, rawGridY);
      const newDroppingPosition = {
        left: clampedGridX / transformScale,
        top: clampedGridY / transformScale,
        e: e.nativeEvent
      };
      if (!droppingDOMNode) {
        const calculatedPosition = calcXY(
          positionParams,
          clampedGridY,
          clampedGridX,
          finalDroppingItem.w,
          finalDroppingItem.h
        );
        setDroppingDOMNode(/* @__PURE__ */ jsxRuntimeExports.jsx("div", {}, finalDroppingItem.i));
        setDroppingPosition(newDroppingPosition);
        setLayout([
          ...layoutRef.current,
          {
            ...finalDroppingItem,
            x: calculatedPosition.x,
            y: calculatedPosition.y,
            static: false,
            isDraggable: true
          }
        ]);
      } else if (droppingPosition) {
        const shouldUpdate = droppingPosition.left !== newDroppingPosition.left || droppingPosition.top !== newDroppingPosition.top;
        if (shouldUpdate) {
          setDroppingPosition(newDroppingPosition);
        }
      }
    },
    [
      droppingDOMNode,
      droppingPosition,
      droppingItem,
      dropConfigOnDragOver,
      onDropDragOverProp,
      removeDroppingPlaceholder,
      transformScale,
      cols,
      margin,
      maxRows,
      rowHeight,
      width,
      effectiveContainerPadding
    ]
  );
  const handleDragLeave = reactExports.useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragEnterCounterRef.current--;
      if (dragEnterCounterRef.current < 0) {
        dragEnterCounterRef.current = 0;
      }
      if (dragEnterCounterRef.current === 0) {
        removeDroppingPlaceholder();
      }
    },
    [removeDroppingPlaceholder]
  );
  const handleDragEnter = reactExports.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragEnterCounterRef.current++;
  }, []);
  const handleDrop = reactExports.useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const currentLayout = layoutRef.current;
      const item = currentLayout.find((l) => l.i === droppingItem.i);
      dragEnterCounterRef.current = 0;
      removeDroppingPlaceholder();
      onDropProp(currentLayout, item, e.nativeEvent);
    },
    [droppingItem.i, removeDroppingPlaceholder, onDropProp]
  );
  const processGridItem = reactExports.useCallback(
    (child, isDroppingItem) => {
      if (!child || !child.key) return null;
      const l = getLayoutItem(layout, String(child.key));
      if (!l) return null;
      const draggable = typeof l.isDraggable === "boolean" ? l.isDraggable : !l.static && isDraggable;
      const resizable = typeof l.isResizable === "boolean" ? l.isResizable : !l.static && isResizable;
      const resizeHandlesOptions = l.resizeHandles || [...resizeHandles];
      const bounded = draggable && isBounded && l.isBounded !== false;
      const resizeHandleElement = resizeHandle;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        GridItem,
        {
          containerWidth: width,
          cols,
          margin,
          containerPadding: effectiveContainerPadding,
          maxRows,
          rowHeight,
          cancel: draggableCancel,
          handle: draggableHandle,
          onDragStart,
          onDrag,
          onDragStop,
          onResizeStart,
          onResize,
          onResizeStop,
          isDraggable: draggable,
          isResizable: resizable,
          isBounded: bounded,
          useCSSTransforms: useCSSTransforms && mounted,
          usePercentages: !mounted,
          transformScale,
          positionStrategy,
          dragThreshold,
          w: l.w,
          h: l.h,
          x: l.x,
          y: l.y,
          i: l.i,
          minH: l.minH,
          minW: l.minW,
          maxH: l.maxH,
          maxW: l.maxW,
          static: l.static,
          droppingPosition: isDroppingItem ? droppingPosition : void 0,
          resizeHandles: resizeHandlesOptions,
          resizeHandle: resizeHandleElement,
          constraints,
          layoutItem: l,
          layout,
          children: child
        },
        l.i
      );
    },
    [
      layout,
      width,
      cols,
      margin,
      effectiveContainerPadding,
      maxRows,
      rowHeight,
      draggableCancel,
      draggableHandle,
      onDragStart,
      onDrag,
      onDragStop,
      onResizeStart,
      onResize,
      onResizeStop,
      isDraggable,
      isResizable,
      isBounded,
      useCSSTransforms,
      mounted,
      transformScale,
      positionStrategy,
      dragThreshold,
      droppingPosition,
      resizeHandles,
      resizeHandle,
      constraints
    ]
  );
  const renderPlaceholder = () => {
    if (!activeDrag) return null;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      GridItem,
      {
        w: activeDrag.w,
        h: activeDrag.h,
        x: activeDrag.x,
        y: activeDrag.y,
        i: activeDrag.i,
        className: `react-grid-placeholder ${resizing ? "placeholder-resizing" : ""}`,
        containerWidth: width,
        cols,
        margin,
        containerPadding: effectiveContainerPadding,
        maxRows,
        rowHeight,
        isDraggable: false,
        isResizable: false,
        isBounded: false,
        useCSSTransforms,
        transformScale,
        constraints,
        layout,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", {})
      }
    );
  };
  const mergedClassName = clsx(layoutClassName$1, className);
  const mergedStyle = {
    height: containerHeight,
    ...style
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: innerRef,
      className: mergedClassName,
      style: mergedStyle,
      onDrop: isDroppable ? handleDrop : void 0,
      onDragLeave: isDroppable ? handleDragLeave : void 0,
      onDragEnter: isDroppable ? handleDragEnter : void 0,
      onDragOver: isDroppable ? handleDragOver : void 0,
      children: [
        React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;
          return processGridItem(child);
        }),
        isDroppable && droppingDOMNode && processGridItem(droppingDOMNode, true),
        renderPlaceholder()
      ]
    }
  );
}
function ReactGridLayout(props) {
  const {
    // Required
    children,
    width,
    // Grid measurement
    cols = 12,
    rowHeight = 150,
    maxRows = Infinity,
    margin = [10, 10],
    containerPadding = null,
    // Layout data
    layout,
    droppingItem,
    // Compaction
    compactType: compactTypeProp,
    preventCollision = false,
    allowOverlap = false,
    verticalCompact,
    // Drag behavior
    isDraggable = true,
    isBounded = false,
    draggableHandle,
    draggableCancel,
    // Resize behavior
    isResizable = true,
    resizeHandles = ["se"],
    resizeHandle,
    // Drop behavior
    isDroppable = false,
    // Position
    useCSSTransforms = true,
    transformScale = 1,
    // Container props
    autoSize,
    className,
    style,
    innerRef,
    // Callbacks
    onLayoutChange,
    onDragStart,
    onDrag,
    onDragStop,
    onResizeStart,
    onResize,
    onResizeStop,
    onDrop,
    onDropDragOver
  } = props;
  let compactType = compactTypeProp === void 0 ? "vertical" : compactTypeProp;
  if (verticalCompact === false) {
    if (process.env["NODE_ENV"] !== "production") {
      console.warn(
        '`verticalCompact` on <ReactGridLayout> is deprecated and will be removed soon. Use `compactType`: "horizontal" | "vertical" | null.'
      );
    }
    compactType = null;
  }
  const gridConfig = {
    cols,
    rowHeight,
    maxRows,
    margin,
    containerPadding
  };
  const dragConfig = {
    enabled: isDraggable,
    bounded: isBounded,
    handle: draggableHandle,
    cancel: draggableCancel,
    // Set threshold to 0 for backwards compatibility with v1 API
    // v2 API defaults to 3px threshold (fixes #1341, #1401)
    threshold: 0
  };
  const resizeConfig = {
    enabled: isResizable,
    handles: resizeHandles,
    handleComponent: resizeHandle
  };
  const dropConfig = {
    enabled: isDroppable
  };
  let positionStrategy;
  if (!useCSSTransforms) {
    positionStrategy = absoluteStrategy;
  } else if (transformScale !== 1) {
    positionStrategy = createScaledStrategy(transformScale);
  } else {
    positionStrategy = transformStrategy;
  }
  const compactor = getCompactor(compactType, allowOverlap, preventCollision);
  const constraints = isBounded ? [...defaultConstraints, containerBounds] : defaultConstraints;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    GridLayout,
    {
      width,
      gridConfig,
      dragConfig,
      resizeConfig,
      dropConfig,
      positionStrategy,
      compactor,
      constraints,
      layout,
      droppingItem,
      autoSize,
      className,
      style,
      innerRef,
      onLayoutChange,
      onDragStart,
      onDrag,
      onDragStop,
      onResizeStart,
      onResize,
      onResizeStop,
      onDrop,
      onDropDragOver,
      children
    }
  );
}
ReactGridLayout.displayName = "ReactGridLayout";
var ReactGridLayout_default = ReactGridLayout;
var layoutClassName = "react-grid-layout";
function WidthProvider(ComposedComponent) {
  function WidthProviderWrapper(props) {
    const { measureBeforeMount = false, className, style, ...rest } = props;
    const [width, setWidth] = reactExports.useState(1280);
    const [mounted, setMounted] = reactExports.useState(false);
    const elementRef = reactExports.useRef(null);
    const resizeObserverRef = reactExports.useRef(null);
    reactExports.useEffect(() => {
      setMounted(true);
    }, []);
    reactExports.useEffect(() => {
      const node = elementRef.current;
      if (!(node instanceof HTMLElement)) return;
      const observer = new ResizeObserver((entries) => {
        if (entries[0]) {
          const newWidth = entries[0].contentRect.width;
          setWidth(newWidth);
        }
      });
      observer.observe(node);
      resizeObserverRef.current = observer;
      return () => {
        observer.unobserve(node);
        observer.disconnect();
      };
    }, [mounted]);
    if (measureBeforeMount && !mounted) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: clsx(className, layoutClassName),
          style,
          ref: elementRef
        }
      );
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      ComposedComponent,
      {
        innerRef: elementRef,
        className,
        style,
        ...rest,
        width
      }
    );
  }
  WidthProviderWrapper.displayName = `WidthProvider(${ComposedComponent.displayName || ComposedComponent.name || "Component"})`;
  return WidthProviderWrapper;
}
export {
  ReactGridLayout_default as R,
  WidthProvider as W
};
