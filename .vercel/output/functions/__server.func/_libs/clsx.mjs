function r(e) {
  var t, f, n = "";
  if ("string" == typeof e || "number" == typeof e) n += e;
  else if ("object" == typeof e) if (Array.isArray(e)) {
    var o = e.length;
    for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
  } else for (f in e) e[f] && (n && (n += " "), n += f);
  return n;
}
function clsx$1() {
  for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
  return n;
}
var clsx = { exports: {} };
var hasRequiredClsx;
function requireClsx() {
  if (hasRequiredClsx) return clsx.exports;
  hasRequiredClsx = 1;
  function r2(e2) {
    var o, t, f = "";
    if ("string" == typeof e2 || "number" == typeof e2) f += e2;
    else if ("object" == typeof e2) if (Array.isArray(e2)) {
      var n = e2.length;
      for (o = 0; o < n; o++) e2[o] && (t = r2(e2[o])) && (f && (f += " "), f += t);
    } else for (t in e2) e2[t] && (f && (f += " "), f += t);
    return f;
  }
  function e() {
    for (var e2, o, t = 0, f = "", n = arguments.length; t < n; t++) (e2 = arguments[t]) && (o = r2(e2)) && (f && (f += " "), f += o);
    return f;
  }
  clsx.exports = e, clsx.exports.clsx = e;
  return clsx.exports;
}
export {
  clsx$1 as c,
  requireClsx as r
};
