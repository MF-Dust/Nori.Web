var d = [],
  a = [],
  j = Uint8Array,
  b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for (var h = 0, R = b.length; h < R; ++h) ((d[h] = b[h]), (a[b.charCodeAt(h)] = h));
a[45] = 62;
a[95] = 63;
function N(t) {
  var e = t.length;
  if (e % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
  var r = t.indexOf("=");
  r === -1 && (r = e);
  var n = r === e ? 0 : 4 - (r % 4);
  return [r, n];
}
function D(t, e, r) {
  return ((e + r) * 3) / 4 - r;
}
function u(t) {
  var e,
    r = N(t),
    n = r[0],
    i = r[1],
    s = new j(D(t, n, i)),
    o = 0,
    c = i > 0 ? n - 4 : n,
    f;
  for (f = 0; f < c; f += 4)
    ((e =
      (a[t.charCodeAt(f)] << 18) |
      (a[t.charCodeAt(f + 1)] << 12) |
      (a[t.charCodeAt(f + 2)] << 6) |
      a[t.charCodeAt(f + 3)]),
      (s[o++] = (e >> 16) & 255),
      (s[o++] = (e >> 8) & 255),
      (s[o++] = e & 255));
  return (
    i === 2 &&
      ((e = (a[t.charCodeAt(f)] << 2) | (a[t.charCodeAt(f + 1)] >> 4)), (s[o++] = e & 255)),
    i === 1 &&
      ((e =
        (a[t.charCodeAt(f)] << 10) | (a[t.charCodeAt(f + 1)] << 4) | (a[t.charCodeAt(f + 2)] >> 2)),
      (s[o++] = (e >> 8) & 255),
      (s[o++] = e & 255)),
    s
  );
}
function M(t) {
  return d[(t >> 18) & 63] + d[(t >> 12) & 63] + d[(t >> 6) & 63] + d[t & 63];
}
function S(t, e, r) {
  for (var n, i = [], s = e; s < r; s += 3)
    ((n = ((t[s] << 16) & 16711680) + ((t[s + 1] << 8) & 65280) + (t[s + 2] & 255)), i.push(M(n)));
  return i.join("");
}
function g(t) {
  for (var e, r = t.length, n = r % 3, i = [], s = 16383, o = 0, c = r - n; o < c; o += s)
    i.push(S(t, o, o + s > c ? c : o + s));
  return (
    n === 1
      ? ((e = t[r - 1]), i.push(d[e >> 2] + d[(e << 4) & 63] + "=="))
      : n === 2 &&
        ((e = (t[r - 2] << 8) + t[r - 1]),
        i.push(d[e >> 10] + d[(e >> 4) & 63] + d[(e << 2) & 63] + "=")),
    i.join("")
  );
}
function z(t) {
  if (t === void 0) return {};
  if (!T(t))
    throw new Error(`The arguments to a Convex function must be an object. Received: ${t}`);
  return t;
}
function K(t) {
  if (typeof t > "u")
    throw new Error(
      "Client created with undefined deployment address. If you used an environment variable, check that it's set.",
    );
  if (typeof t != "string") throw new Error(`Invalid deployment address: found ${t}".`);
  if (!(t.startsWith("http:") || t.startsWith("https:")))
    throw new Error(
      `Invalid deployment address: Must start with "https://" or "http://". Found "${t}".`,
    );
  try {
    new URL(t);
  } catch {
    throw new Error(
      `Invalid deployment address: "${t}" is not a valid URL. If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`,
    );
  }
  if (t.endsWith(".convex.site"))
    throw new Error(
      `Invalid deployment address: "${t}" ends with .convex.site, which is used for HTTP Actions. Convex deployment URLs typically end with .convex.cloud? If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`,
    );
}
function T(t) {
  const e = typeof t == "object",
    r = Object.getPrototypeOf(t),
    n = r === null || r === Object.prototype || r?.constructor?.name === "Object";
  return e && n;
}
const L = !0,
  w = BigInt("-9223372036854775808"),
  A = BigInt("9223372036854775807"),
  E = BigInt("0"),
  U = BigInt("8"),
  P = BigInt("256");
function _(t) {
  return Number.isNaN(t) || !Number.isFinite(t) || Object.is(t, -0);
}
function J(t) {
  t < E && (t -= w + w);
  let e = t.toString(16);
  e.length % 2 === 1 && (e = "0" + e);
  const r = new Uint8Array(new ArrayBuffer(8));
  let n = 0;
  for (const i of e.match(/.{2}/g).reverse()) (r.set([parseInt(i, 16)], n++), (t >>= U));
  return g(r);
}
function V(t) {
  const e = u(t);
  if (e.byteLength !== 8)
    throw new Error(`Received ${e.byteLength} bytes, expected 8 for $integer`);
  let r = E,
    n = E;
  for (const i of e) ((r += BigInt(i) * P ** n), n++);
  return (r > A && (r += w + w), r);
}
function W(t) {
  if (t < w || A < t) throw new Error(`BigInt ${t} does not fit into a 64-bit signed integer.`);
  const e = new ArrayBuffer(8);
  return (new DataView(e).setBigInt64(0, t, !0), g(new Uint8Array(e)));
}
function X(t) {
  const e = u(t);
  if (e.byteLength !== 8)
    throw new Error(`Received ${e.byteLength} bytes, expected 8 for $integer`);
  return new DataView(e.buffer).getBigInt64(0, !0);
}
const H = DataView.prototype.setBigInt64 ? W : J,
  G = DataView.prototype.getBigInt64 ? X : V,
  B = 1024;
function m(t) {
  if (t.length > B) throw new Error(`Field name ${t} exceeds maximum field name length ${B}.`);
  if (t.startsWith("$")) throw new Error(`Field name ${t} starts with a '$', which is reserved.`);
  for (let e = 0; e < t.length; e += 1) {
    const r = t.charCodeAt(e);
    if (r < 32 || r >= 127)
      throw new Error(
        `Field name ${t} has invalid character '${t[e]}': Field names can only contain non-control ASCII characters`,
      );
  }
}
function C(t) {
  if (t === null || typeof t == "boolean" || typeof t == "number" || typeof t == "string") return t;
  if (Array.isArray(t)) return t.map((n) => C(n));
  if (typeof t != "object") throw new Error(`Unexpected type of ${t}`);
  const e = Object.entries(t);
  if (e.length === 1) {
    const n = e[0][0];
    if (n === "$bytes") {
      if (typeof t.$bytes != "string") throw new Error(`Malformed $bytes field on ${t}`);
      return u(t.$bytes).buffer;
    }
    if (n === "$integer") {
      if (typeof t.$integer != "string") throw new Error(`Malformed $integer field on ${t}`);
      return G(t.$integer);
    }
    if (n === "$float") {
      if (typeof t.$float != "string") throw new Error(`Malformed $float field on ${t}`);
      const i = u(t.$float);
      if (i.byteLength !== 8)
        throw new Error(`Received ${i.byteLength} bytes, expected 8 for $float`);
      const o = new DataView(i.buffer).getFloat64(0, L);
      if (!_(o)) throw new Error(`Float ${o} should be encoded as a number`);
      return o;
    }
    if (n === "$set")
      throw new Error("Received a Set which is no longer supported as a Convex type.");
    if (n === "$map")
      throw new Error("Received a Map which is no longer supported as a Convex type.");
  }
  const r = {};
  for (const [n, i] of Object.entries(t)) (m(n), (r[n] = C(i)));
  return r;
}
const l = 16384;
function p(t) {
  const e = JSON.stringify(t, (r, n) =>
    n === void 0 ? "undefined" : typeof n == "bigint" ? `${n.toString()}n` : n,
  );
  if (e.length > l) {
    const r = "[...truncated]";
    let n = l - r.length;
    const i = e.codePointAt(n - 1);
    return (i !== void 0 && i > 65535 && (n -= 1), e.substring(0, n) + r);
  }
  return e;
}
function y(t, e, r, n) {
  if (t === void 0) {
    const o = r && ` (present at path ${r} in original object ${p(e)})`;
    throw new Error(
      `undefined is not a valid Convex value${o}. To learn about Convex's supported types, see https://docs.convex.dev/using/types.`,
    );
  }
  if (t === null) return t;
  if (typeof t == "bigint") {
    if (t < w || A < t) throw new Error(`BigInt ${t} does not fit into a 64-bit signed integer.`);
    return { $integer: H(t) };
  }
  if (typeof t == "number")
    if (_(t)) {
      const o = new ArrayBuffer(8);
      return (new DataView(o).setFloat64(0, t, L), { $float: g(new Uint8Array(o)) });
    } else return t;
  if (typeof t == "boolean" || typeof t == "string") return t;
  if (t instanceof ArrayBuffer) return { $bytes: g(new Uint8Array(t)) };
  if (Array.isArray(t)) return t.map((o, c) => y(o, e, r + `[${c}]`, !1));
  if (t instanceof Set) throw new Error($(r, "Set", [...t], e));
  if (t instanceof Map) throw new Error($(r, "Map", [...t], e));
  if (!T(t)) {
    const o = t?.constructor?.name,
      c = o ? `${o} ` : "";
    throw new Error($(r, c, t, e));
  }
  const i = {},
    s = Object.entries(t);
  s.sort(([o, c], [f, q]) => (o === f ? 0 : o < f ? -1 : 1));
  for (const [o, c] of s)
    c !== void 0
      ? (m(o), (i[o] = y(c, e, r + `.${o}`, !1)))
      : n && (m(o), (i[o] = O(c, e, r + `.${o}`)));
  return i;
}
function $(t, e, r, n) {
  return t
    ? `${e}${p(r)} is not a supported Convex type (present at path ${t} in original object ${p(n)}). To learn about Convex's supported types, see https://docs.convex.dev/using/types.`
    : `${e}${p(r)} is not a supported Convex type.`;
}
function O(t, e, r) {
  if (t === void 0) return { $undefined: null };
  if (e === void 0)
    throw new Error(`Programming error. Current value is ${p(t)} but original value is undefined`);
  return y(t, e, r, !1);
}
function Q(t) {
  return y(t, t, "", !1);
}
function tt(t) {
  return O(t, t, "");
}
function et(t) {
  return y(t, t, "", !0);
}
var Y = Object.defineProperty,
  Z = (t, e, r) =>
    e in t ? Y(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : (t[e] = r),
  I = (t, e, r) => Z(t, typeof e != "symbol" ? e + "" : e, r),
  v,
  x;
const k = Symbol.for("ConvexError");
class rt extends ((x = Error), (v = k), x) {
  constructor(e) {
    (super(typeof e == "string" ? e : p(e)),
      I(this, "name", "ConvexError"),
      I(this, "data"),
      I(this, v, !0),
      (this.data = e));
  }
}
const F = () => Array.from({ length: 4 }, () => 0);
F();
F();
const nt = "1.36.1";
export { rt as C, nt as a, tt as b, Q as c, et as d, g as f, C as j, z as p, u as t, K as v };
