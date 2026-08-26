import { j as r, c as ec } from "./index-CyHAbkO5.js";
import {
  r as h,
  _ as Nt,
  d as tc,
  o as Ge,
  l as Ni,
  a as nc,
  b as li,
  s as St,
  c as gi,
  u as kt,
} from "./i18n-DtIC1LRi.js";
import {
  f as Un,
  p as Ie,
  bf as ic,
  bJ as T,
  bK as ac,
  bL as cc,
  bM as rc,
  bN as sc,
  bO as oc,
  u as dc,
  b as fc,
  a as Nc,
  d as Pe,
  aL as At,
  ar as He,
  bP as Le,
  bQ as lc,
  bR as gc,
  X as dn,
  bS as $t,
  m as Ce,
  A as Gt,
  B as We,
} from "./NormalApp-Cn6agT0F.js";
import { C as da } from "./circle-question-mark-B6STuJHR.js";
const hc = [
    [
      "path",
      {
        d: "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",
        key: "1vdc57",
      },
    ],
    ["path", { d: "M5 21h14", key: "11awu3" }],
  ],
  hi = Un("crown", hc);
const Bc = [
    [
      "path",
      {
        d: "M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528",
        key: "1jaruq",
      },
    ],
  ],
  Mn = Un("flag", Bc);
const uc = [
    ["path", { d: "m11 17 2 2a1 1 0 1 0 3-3", key: "efffak" }],
    [
      "path",
      {
        d: "m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4",
        key: "9pr0kb",
      },
    ],
    ["path", { d: "m21 3 1 11h-2", key: "1tisrp" }],
    ["path", { d: "M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3", key: "1uvwmv" }],
    ["path", { d: "M3 4h8", key: "1ep09j" }],
  ],
  Wt = Un("handshake", uc);
function bc(n) {
  return n !== null ? { comment: n, variations: [] } : { variations: [] };
}
function mc(n, e, t, i, a) {
  const c = { move: n, variations: a };
  return (e && (c.suffix = e), t && (c.nag = t), i !== null && (c.comment = i), c);
}
function xc(...n) {
  const [e, ...t] = n;
  let i = e;
  for (const a of t)
    a !== null && ((i.variations = [a, ...a.variations]), (a.variations = []), (i = a));
  return e;
}
function Dc(n, e) {
  if (e.marker && e.marker.comment) {
    let t = e.root;
    for (;;) {
      const i = t.variations[0];
      if (!i) {
        t.comment = e.marker.comment;
        break;
      }
      t = i;
    }
  }
  return { headers: n, root: e.root, result: (e.marker && e.marker.result) ?? void 0 };
}
function pc(n, e) {
  function t() {
    this.constructor = n;
  }
  ((t.prototype = e.prototype), (n.prototype = new t()));
}
function yt(n, e, t, i) {
  var a = Error.call(this, n);
  return (
    Object.setPrototypeOf && Object.setPrototypeOf(a, yt.prototype),
    (a.expected = e),
    (a.found = t),
    (a.location = i),
    (a.name = "SyntaxError"),
    a
  );
}
pc(yt, Error);
function pn(n, e, t) {
  return (
    (t = t || " "),
    n.length > e ? n : ((e -= n.length), (t += t.repeat(e)), n + t.slice(0, e))
  );
}
yt.prototype.format = function (n) {
  var e = "Error: " + this.message;
  if (this.location) {
    var t = null,
      i;
    for (i = 0; i < n.length; i++)
      if (n[i].source === this.location.source) {
        t = n[i].text.split(/\r\n|\n|\r/g);
        break;
      }
    var a = this.location.start,
      c =
        this.location.source && typeof this.location.source.offset == "function"
          ? this.location.source.offset(a)
          : a,
      s = this.location.source + ":" + c.line + ":" + c.column;
    if (t) {
      var o = this.location.end,
        d = pn("", c.line.toString().length, " "),
        N = t[a.line - 1],
        l = a.line === o.line ? o.column : N.length + 1,
        u = l - a.column || 1;
      e +=
        `
 --> ` +
        s +
        `
` +
        d +
        ` |
` +
        c.line +
        " | " +
        N +
        `
` +
        d +
        " | " +
        pn("", a.column - 1, " ") +
        pn("", u, "^");
    } else
      e +=
        `
 at ` + s;
  }
  return e;
};
yt.buildMessage = function (n, e) {
  var t = {
    literal: function (N) {
      return '"' + a(N.text) + '"';
    },
    class: function (N) {
      var l = N.parts.map(function (u) {
        return Array.isArray(u) ? c(u[0]) + "-" + c(u[1]) : c(u);
      });
      return "[" + (N.inverted ? "^" : "") + l.join("") + "]";
    },
    any: function () {
      return "any character";
    },
    end: function () {
      return "end of input";
    },
    other: function (N) {
      return N.description;
    },
  };
  function i(N) {
    return N.charCodeAt(0).toString(16).toUpperCase();
  }
  function a(N) {
    return N.replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\0/g, "\\0")
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/[\x00-\x0F]/g, function (l) {
        return "\\x0" + i(l);
      })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function (l) {
        return "\\x" + i(l);
      });
  }
  function c(N) {
    return N.replace(/\\/g, "\\\\")
      .replace(/\]/g, "\\]")
      .replace(/\^/g, "\\^")
      .replace(/-/g, "\\-")
      .replace(/\0/g, "\\0")
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/[\x00-\x0F]/g, function (l) {
        return "\\x0" + i(l);
      })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function (l) {
        return "\\x" + i(l);
      });
  }
  function s(N) {
    return t[N.type](N);
  }
  function o(N) {
    var l = N.map(s),
      u,
      f;
    if ((l.sort(), l.length > 0)) {
      for (u = 1, f = 1; u < l.length; u++) l[u - 1] !== l[u] && ((l[f] = l[u]), f++);
      l.length = f;
    }
    switch (l.length) {
      case 1:
        return l[0];
      case 2:
        return l[0] + " or " + l[1];
      default:
        return l.slice(0, -1).join(", ") + ", or " + l[l.length - 1];
    }
  }
  function d(N) {
    return N ? '"' + a(N) + '"' : "end of input";
  }
  return "Expected " + o(n) + " but " + d(e) + " found.";
};
function Oc(n, e) {
  e = e !== void 0 ? e : {};
  var t = {},
    i = e.grammarSource,
    a = { pgn: ci },
    c = ci,
    s = "[",
    o = '"',
    d = "]",
    N = ".",
    l = "O-O-O",
    u = "O-O",
    f = "0-0-0",
    B = "0-0",
    b = "$",
    p = "{",
    V = "}",
    G = ";",
    A = "(",
    Q = ")",
    _ = "1-0",
    z = "0-1",
    j = "1/2-1/2",
    De = "*",
    oe = /^[a-zA-Z]/,
    fe = /^[^"]/,
    ie = /^[0-9]/,
    ue = /^[.]/,
    Z = /^[a-zA-Z1-8\-=]/,
    J = /^[+#]/,
    de = /^[!?]/,
    $ = /^[^}]/,
    ge = /^[^\r\n]/,
    ae = /^[ \t\r\n]/,
    K = Ae("tag pair"),
    pe = I("[", !1),
    H = I('"', !1),
    X = I("]", !1),
    ye = Ae("tag name"),
    F = he(
      [
        ["a", "z"],
        ["A", "Z"],
      ],
      !1,
      !1,
    ),
    S = Ae("tag value"),
    E = he(['"'], !0, !1),
    ee = Ae("move number"),
    v = he([["0", "9"]], !1, !1),
    W = I(".", !1),
    te = he(["."], !1, !1),
    Se = Ae("standard algebraic notation"),
    ce = I("O-O-O", !1),
    be = I("O-O", !1),
    _e = I("0-0-0", !1),
    pt = I("0-0", !1),
    ze = he([["a", "z"], ["A", "Z"], ["1", "8"], "-", "="], !1, !1),
    Fe = he(["+", "#"], !1, !1),
    wt = Ae("suffix annotation"),
    qe = he(["!", "?"], !1, !1),
    Et = Ae("NAG"),
    Ot = I("$", !1),
    Qt = Ae("brace comment"),
    lt = I("{", !1),
    Ye = he(["}"], !0, !1),
    Je = I("}", !1),
    Re = Ae("rest of line comment"),
    gt = I(";", !1),
    Ue = he(
      [
        "\r",
        `
`,
      ],
      !0,
      !1,
    ),
    Rt = Ae("variation"),
    Pt = I("(", !1),
    Lt = I(")", !1),
    Xe = Ae("game termination marker"),
    et = I("1-0", !1),
    tt = I("0-1", !1),
    nt = I("1/2-1/2", !1),
    Kt = I("*", !1),
    je = Ae("whitespace"),
    P = he(
      [
        " ",
        "	",
        "\r",
        `
`,
      ],
      !1,
      !1,
    ),
    Y = function (g, x) {
      return Dc(g, x);
    },
    ne = function (g) {
      return Object.fromEntries(g);
    },
    ht = function (g, x) {
      return [g, x];
    },
    Ne = function (g, x) {
      return { root: g, marker: x };
    },
    it = function (g, x) {
      return xc(bc(g), ...x.flat());
    },
    Ct = function (g, x, D, k, w) {
      return mc(g, x, D, k, w);
    },
    Mt = function (g) {
      return g;
    },
    mn = function (g) {
      return g.replace(/[\r\n]+/g, " ");
    },
    Vt = function (g) {
      return g.trim();
    },
    It = function (g) {
      return g;
    },
    xn = function (g, x) {
      return { result: g, comment: x };
    },
    m = e.peg$currPos | 0,
    at = [{ line: 1, column: 1 }],
    ke = m,
    q = e.peg$maxFailExpected || [],
    O = e.peg$silentFails | 0,
    me;
  if (e.startRule) {
    if (!(e.startRule in a))
      throw new Error(`Can't start parsing from rule "` + e.startRule + '".');
    c = a[e.startRule];
  }
  function I(g, x) {
    return { type: "literal", text: g, ignoreCase: x };
  }
  function he(g, x, D) {
    return { type: "class", parts: g, inverted: x, ignoreCase: D };
  }
  function we() {
    return { type: "end" };
  }
  function Ae(g) {
    return { type: "other", description: g };
  }
  function ii(g) {
    var x = at[g],
      D;
    if (x) return x;
    if (g >= at.length) D = at.length - 1;
    else for (D = g; !at[--D];);
    for (x = at[D], x = { line: x.line, column: x.column }; D < g;)
      (n.charCodeAt(D) === 10 ? (x.line++, (x.column = 1)) : x.column++, D++);
    return ((at[g] = x), x);
  }
  function ai(g, x, D) {
    var k = ii(g),
      w = ii(x),
      U = {
        source: i,
        start: { offset: g, line: k.line, column: k.column },
        end: { offset: x, line: w.line, column: w.column },
      };
    return U;
  }
  function y(g) {
    m < ke || (m > ke && ((ke = m), (q = [])), q.push(g));
  }
  function Fa(g, x, D) {
    return new yt(yt.buildMessage(g, x), g, x, D);
  }
  function ci() {
    var g, x, D;
    return ((g = m), (x = ja()), (D = Wa()), (g = Y(x, D)), g);
  }
  function ja() {
    var g, x, D;
    for (g = m, x = [], D = ri(); D !== t;) (x.push(D), (D = ri()));
    return ((D = ve()), (g = ne(x)), g);
  }
  function ri() {
    var g, x, D, k, w, U, Bt;
    return (
      O++,
      (g = m),
      ve(),
      n.charCodeAt(m) === 91 ? ((x = s), m++) : ((x = t), O === 0 && y(pe)),
      x !== t
        ? (ve(),
          (D = Ha()),
          D !== t
            ? (ve(),
              n.charCodeAt(m) === 34 ? ((k = o), m++) : ((k = t), O === 0 && y(H)),
              k !== t
                ? ((w = $a()),
                  n.charCodeAt(m) === 34 ? ((U = o), m++) : ((U = t), O === 0 && y(H)),
                  U !== t
                    ? (ve(),
                      n.charCodeAt(m) === 93 ? ((Bt = d), m++) : ((Bt = t), O === 0 && y(X)),
                      Bt !== t ? (g = ht(D, w)) : ((m = g), (g = t)))
                    : ((m = g), (g = t)))
                : ((m = g), (g = t)))
            : ((m = g), (g = t)))
        : ((m = g), (g = t)),
      O--,
      g === t && O === 0 && y(K),
      g
    );
  }
  function Ha() {
    var g, x, D;
    if (
      (O++,
      (g = m),
      (x = []),
      (D = n.charAt(m)),
      oe.test(D) ? m++ : ((D = t), O === 0 && y(F)),
      D !== t)
    )
      for (; D !== t;)
        (x.push(D), (D = n.charAt(m)), oe.test(D) ? m++ : ((D = t), O === 0 && y(F)));
    else x = t;
    return (
      x !== t ? (g = n.substring(g, m)) : (g = x),
      O--,
      g === t && ((x = t), O === 0 && y(ye)),
      g
    );
  }
  function $a() {
    var g, x, D;
    for (
      O++, g = m, x = [], D = n.charAt(m), fe.test(D) ? m++ : ((D = t), O === 0 && y(E));
      D !== t;
    )
      (x.push(D), (D = n.charAt(m)), fe.test(D) ? m++ : ((D = t), O === 0 && y(E)));
    return ((g = n.substring(g, m)), O--, (x = t), O === 0 && y(S), g);
  }
  function Wa() {
    var g, x, D;
    return ((g = m), (x = si()), ve(), (D = Xa()), D === t && (D = null), ve(), (g = Ne(x, D)), g);
  }
  function si() {
    var g, x, D, k;
    for (g = m, x = Dn(), x === t && (x = null), D = [], k = oi(); k !== t;)
      (D.push(k), (k = oi()));
    return ((g = it(x, D)), g);
  }
  function oi() {
    var g, x, D, k, w, U, Bt, Yt;
    if (((g = m), ve(), qa(), ve(), (x = Ua()), x !== t)) {
      for (D = Za(), D === t && (D = null), k = [], w = di(); w !== t;) (k.push(w), (w = di()));
      for (w = ve(), U = Dn(), U === t && (U = null), Bt = [], Yt = fi(); Yt !== t;)
        (Bt.push(Yt), (Yt = fi()));
      g = Ct(x, D, k, U, Bt);
    } else ((m = g), (g = t));
    return g;
  }
  function qa() {
    var g, x, D, k, w, U;
    for (
      O++, g = m, x = [], D = n.charAt(m), ie.test(D) ? m++ : ((D = t), O === 0 && y(v));
      D !== t;
    )
      (x.push(D), (D = n.charAt(m)), ie.test(D) ? m++ : ((D = t), O === 0 && y(v)));
    if ((n.charCodeAt(m) === 46 ? ((D = N), m++) : ((D = t), O === 0 && y(W)), D !== t)) {
      for (
        k = ve(), w = [], U = n.charAt(m), ue.test(U) ? m++ : ((U = t), O === 0 && y(te));
        U !== t;
      )
        (w.push(U), (U = n.charAt(m)), ue.test(U) ? m++ : ((U = t), O === 0 && y(te)));
      ((x = [x, D, k, w]), (g = x));
    } else ((m = g), (g = t));
    return (O--, g === t && ((x = t), O === 0 && y(ee)), g);
  }
  function Ua() {
    var g, x, D, k, w, U;
    if (
      (O++,
      (g = m),
      (x = m),
      n.substr(m, 5) === l ? ((D = l), (m += 5)) : ((D = t), O === 0 && y(ce)),
      D === t &&
        (n.substr(m, 3) === u ? ((D = u), (m += 3)) : ((D = t), O === 0 && y(be)),
        D === t &&
          (n.substr(m, 5) === f ? ((D = f), (m += 5)) : ((D = t), O === 0 && y(_e)),
          D === t &&
            (n.substr(m, 3) === B ? ((D = B), (m += 3)) : ((D = t), O === 0 && y(pt)), D === t))))
    )
      if (((D = m), (k = n.charAt(m)), oe.test(k) ? m++ : ((k = t), O === 0 && y(F)), k !== t)) {
        if (((w = []), (U = n.charAt(m)), Z.test(U) ? m++ : ((U = t), O === 0 && y(ze)), U !== t))
          for (; U !== t;)
            (w.push(U), (U = n.charAt(m)), Z.test(U) ? m++ : ((U = t), O === 0 && y(ze)));
        else w = t;
        w !== t ? ((k = [k, w]), (D = k)) : ((m = D), (D = t));
      } else ((m = D), (D = t));
    return (
      D !== t
        ? ((k = n.charAt(m)),
          J.test(k) ? m++ : ((k = t), O === 0 && y(Fe)),
          k === t && (k = null),
          (D = [D, k]),
          (x = D))
        : ((m = x), (x = t)),
      x !== t ? (g = n.substring(g, m)) : (g = x),
      O--,
      g === t && ((x = t), O === 0 && y(Se)),
      g
    );
  }
  function Za() {
    var g, x, D;
    for (
      O++, g = m, x = [], D = n.charAt(m), de.test(D) ? m++ : ((D = t), O === 0 && y(qe));
      D !== t;
    )
      (x.push(D),
        x.length >= 2
          ? (D = t)
          : ((D = n.charAt(m)), de.test(D) ? m++ : ((D = t), O === 0 && y(qe))));
    return (
      x.length < 1 ? ((m = g), (g = t)) : (g = x),
      O--,
      g === t && ((x = t), O === 0 && y(wt)),
      g
    );
  }
  function di() {
    var g, x, D, k, w;
    if (
      (O++,
      (g = m),
      ve(),
      n.charCodeAt(m) === 36 ? ((x = b), m++) : ((x = t), O === 0 && y(Ot)),
      x !== t)
    ) {
      if (
        ((D = m),
        (k = []),
        (w = n.charAt(m)),
        ie.test(w) ? m++ : ((w = t), O === 0 && y(v)),
        w !== t)
      )
        for (; w !== t;)
          (k.push(w), (w = n.charAt(m)), ie.test(w) ? m++ : ((w = t), O === 0 && y(v)));
      else k = t;
      (k !== t ? (D = n.substring(D, m)) : (D = k), D !== t ? (g = Mt(D)) : ((m = g), (g = t)));
    } else ((m = g), (g = t));
    return (O--, g === t && O === 0 && y(Et), g);
  }
  function Dn() {
    var g;
    return ((g = Ya()), g === t && (g = Ja()), g);
  }
  function Ya() {
    var g, x, D, k, w;
    if (
      (O++,
      (g = m),
      n.charCodeAt(m) === 123 ? ((x = p), m++) : ((x = t), O === 0 && y(lt)),
      x !== t)
    ) {
      for (D = m, k = [], w = n.charAt(m), $.test(w) ? m++ : ((w = t), O === 0 && y(Ye)); w !== t;)
        (k.push(w), (w = n.charAt(m)), $.test(w) ? m++ : ((w = t), O === 0 && y(Ye)));
      ((D = n.substring(D, m)),
        n.charCodeAt(m) === 125 ? ((k = V), m++) : ((k = t), O === 0 && y(Je)),
        k !== t ? (g = mn(D)) : ((m = g), (g = t)));
    } else ((m = g), (g = t));
    return (O--, g === t && ((x = t), O === 0 && y(Qt)), g);
  }
  function Ja() {
    var g, x, D, k, w;
    if (
      (O++, (g = m), n.charCodeAt(m) === 59 ? ((x = G), m++) : ((x = t), O === 0 && y(gt)), x !== t)
    ) {
      for (D = m, k = [], w = n.charAt(m), ge.test(w) ? m++ : ((w = t), O === 0 && y(Ue)); w !== t;)
        (k.push(w), (w = n.charAt(m)), ge.test(w) ? m++ : ((w = t), O === 0 && y(Ue)));
      ((D = n.substring(D, m)), (g = Vt(D)));
    } else ((m = g), (g = t));
    return (O--, g === t && ((x = t), O === 0 && y(Re)), g);
  }
  function fi() {
    var g, x, D, k;
    return (
      O++,
      (g = m),
      ve(),
      n.charCodeAt(m) === 40 ? ((x = A), m++) : ((x = t), O === 0 && y(Pt)),
      x !== t
        ? ((D = si()),
          D !== t
            ? (ve(),
              n.charCodeAt(m) === 41 ? ((k = Q), m++) : ((k = t), O === 0 && y(Lt)),
              k !== t ? (g = It(D)) : ((m = g), (g = t)))
            : ((m = g), (g = t)))
        : ((m = g), (g = t)),
      O--,
      g === t && O === 0 && y(Rt),
      g
    );
  }
  function Xa() {
    var g, x, D;
    return (
      O++,
      (g = m),
      n.substr(m, 3) === _ ? ((x = _), (m += 3)) : ((x = t), O === 0 && y(et)),
      x === t &&
        (n.substr(m, 3) === z ? ((x = z), (m += 3)) : ((x = t), O === 0 && y(tt)),
        x === t &&
          (n.substr(m, 7) === j ? ((x = j), (m += 7)) : ((x = t), O === 0 && y(nt)),
          x === t && (n.charCodeAt(m) === 42 ? ((x = De), m++) : ((x = t), O === 0 && y(Kt))))),
      x !== t ? (ve(), (D = Dn()), D === t && (D = null), (g = xn(x, D))) : ((m = g), (g = t)),
      O--,
      g === t && ((x = t), O === 0 && y(Xe)),
      g
    );
  }
  function ve() {
    var g, x;
    for (O++, g = [], x = n.charAt(m), ae.test(x) ? m++ : ((x = t), O === 0 && y(P)); x !== t;)
      (g.push(x), (x = n.charAt(m)), ae.test(x) ? m++ : ((x = t), O === 0 && y(P)));
    return (O--, (x = t), O === 0 && y(je), g);
  }
  if (((me = c()), e.peg$library))
    return {
      peg$result: me,
      peg$currPos: m,
      peg$FAILED: t,
      peg$maxFailExpected: q,
      peg$maxFailPos: ke,
    };
  if (me !== t && m === n.length) return me;
  throw (
    me !== t && m < n.length && y(we()),
    Fa(q, ke < n.length ? n.charAt(ke) : null, ke < n.length ? ai(ke, ke + 1) : ai(ke, ke))
  );
}
const an = 0xffffffffffffffffn;
function On(n, e) {
  return ((n << e) | (n >> (64n - e))) & 0xffffffffffffffffn;
}
function Bi(n, e) {
  return (n * e) & an;
}
function Cc(n) {
  return function () {
    let e = BigInt(n & an),
      t = BigInt((n >> 64n) & an);
    const i = Bi(On(Bi(e, 5n), 7n), 9n);
    return (
      (t ^= e),
      (e = (On(e, 24n) ^ t ^ (t << 16n)) & an),
      (t = On(t, 37n)),
      (n = (t << 64n) | e),
      i
    );
  };
}
const Nn = Cc(0xa187eb39cdcaed8f31c4b365b102e01en),
  Vc = Array.from({ length: 2 }, () =>
    Array.from({ length: 6 }, () => Array.from({ length: 128 }, () => Nn())),
  ),
  Sc = Array.from({ length: 8 }, () => Nn()),
  vc = Array.from({ length: 16 }, () => Nn()),
  Cn = Nn(),
  Ve = "w",
  Ee = "b",
  le = "p",
  In = "n",
  cn = "b",
  _t = "r",
  st = "q",
  Be = "k",
  Vn = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
class Jt {
  color;
  from;
  to;
  piece;
  captured;
  promotion;
  flags;
  san;
  lan;
  before;
  after;
  constructor(e, t) {
    const { color: i, piece: a, from: c, to: s, flags: o, captured: d, promotion: N } = t,
      l = xe(c),
      u = xe(s);
    ((this.color = i),
      (this.piece = a),
      (this.from = l),
      (this.to = u),
      (this.san = e._moveToSan(t, e._moves({ legal: !0 }))),
      (this.lan = l + u),
      (this.before = e.fen()),
      e._makeMove(t),
      (this.after = e.fen()),
      e._undoMove(),
      (this.flags = ""));
    for (const f in L) L[f] & o && (this.flags += ut[f]);
    (d && (this.captured = d), N && ((this.promotion = N), (this.lan += N)));
  }
  isCapture() {
    return this.flags.indexOf(ut.CAPTURE) > -1;
  }
  isPromotion() {
    return this.flags.indexOf(ut.PROMOTION) > -1;
  }
  isEnPassant() {
    return this.flags.indexOf(ut.EP_CAPTURE) > -1;
  }
  isKingsideCastle() {
    return this.flags.indexOf(ut.KSIDE_CASTLE) > -1;
  }
  isQueensideCastle() {
    return this.flags.indexOf(ut.QSIDE_CASTLE) > -1;
  }
  isBigPawn() {
    return this.flags.indexOf(ut.BIG_PAWN) > -1;
  }
}
const Oe = -1,
  ut = {
    NORMAL: "n",
    CAPTURE: "c",
    BIG_PAWN: "b",
    EP_CAPTURE: "e",
    PROMOTION: "p",
    KSIDE_CASTLE: "k",
    QSIDE_CASTLE: "q",
    NULL_MOVE: "-",
  },
  L = {
    NORMAL: 1,
    CAPTURE: 2,
    BIG_PAWN: 4,
    EP_CAPTURE: 8,
    PROMOTION: 16,
    KSIDE_CASTLE: 32,
    QSIDE_CASTLE: 64,
    NULL_MOVE: 128,
  },
  Tn = {
    Event: "?",
    Site: "?",
    Date: "????.??.??",
    Round: "?",
    White: "?",
    Black: "?",
    Result: "*",
  },
  Ac = {
    WhiteTitle: null,
    BlackTitle: null,
    WhiteElo: null,
    BlackElo: null,
    WhiteUSCF: null,
    BlackUSCF: null,
    WhiteNA: null,
    BlackNA: null,
    WhiteType: null,
    BlackType: null,
    EventDate: null,
    EventSponsor: null,
    Section: null,
    Stage: null,
    Board: null,
    Opening: null,
    Variation: null,
    SubVariation: null,
    ECO: null,
    NIC: null,
    Time: null,
    UTCTime: null,
    UTCDate: null,
    TimeControl: null,
    SetUp: null,
    FEN: null,
    Termination: null,
    Annotator: null,
    Mode: null,
    PlyCount: null,
  },
  Gc = { ...Tn, ...Ac },
  R = {
    a8: 0,
    b8: 1,
    c8: 2,
    d8: 3,
    e8: 4,
    f8: 5,
    g8: 6,
    h8: 7,
    a7: 16,
    b7: 17,
    c7: 18,
    d7: 19,
    e7: 20,
    f7: 21,
    g7: 22,
    h7: 23,
    a6: 32,
    b6: 33,
    c6: 34,
    d6: 35,
    e6: 36,
    f6: 37,
    g6: 38,
    h6: 39,
    a5: 48,
    b5: 49,
    c5: 50,
    d5: 51,
    e5: 52,
    f5: 53,
    g5: 54,
    h5: 55,
    a4: 64,
    b4: 65,
    c4: 66,
    d4: 67,
    e4: 68,
    f4: 69,
    g4: 70,
    h4: 71,
    a3: 80,
    b3: 81,
    c3: 82,
    d3: 83,
    e3: 84,
    f3: 85,
    g3: 86,
    h3: 87,
    a2: 96,
    b2: 97,
    c2: 98,
    d2: 99,
    e2: 100,
    f2: 101,
    g2: 102,
    h2: 103,
    a1: 112,
    b1: 113,
    c1: 114,
    d1: 115,
    e1: 116,
    f1: 117,
    g1: 118,
    h1: 119,
  },
  Sn = { b: [16, 32, 17, 15], w: [-16, -32, -17, -15] },
  ui = {
    n: [-18, -33, -31, -14, 18, 33, 31, 14],
    b: [-17, -15, 17, 15],
    r: [-16, 1, 16, -1],
    q: [-17, -16, -15, 1, 17, 16, 15, -1],
    k: [-17, -16, -15, 1, 17, 16, 15, -1],
  },
  yc = [
    20, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 20, 0, 0, 20, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 20,
    0, 0, 0, 0, 20, 0, 0, 0, 0, 24, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 24, 0, 0, 0, 20,
    0, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 24, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 2, 24, 2, 20,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 53, 56, 53, 2, 0, 0, 0, 0, 0, 0, 24, 24, 24, 24, 24, 24, 56,
    0, 56, 24, 24, 24, 24, 24, 24, 0, 0, 0, 0, 0, 0, 2, 53, 56, 53, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 20, 2, 24, 2, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 24, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0,
    0, 20, 0, 0, 0, 24, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 24, 0, 0, 0, 0, 20, 0, 0, 0,
    0, 20, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 20, 0, 0, 20, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0,
    20,
  ],
  kc = [
    17, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 15, 0, 0, 17, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 15,
    0, 0, 0, 0, 17, 0, 0, 0, 0, 16, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 16, 0, 0, 0, 15,
    0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 16, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 16, 0, 15,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 16, 15, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, -1,
    -1, -1, -1, -1, -1, -1, 0, 0, 0, 0, 0, 0, 0, -15, -16, -17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    -15, 0, -16, 0, -17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -15, 0, 0, -16, 0, 0, -17, 0, 0, 0, 0, 0, 0,
    0, 0, -15, 0, 0, 0, -16, 0, 0, 0, -17, 0, 0, 0, 0, 0, 0, -15, 0, 0, 0, 0, -16, 0, 0, 0, 0, -17,
    0, 0, 0, 0, -15, 0, 0, 0, 0, 0, -16, 0, 0, 0, 0, 0, -17, 0, 0, -15, 0, 0, 0, 0, 0, 0, -16, 0, 0,
    0, 0, 0, 0, -17,
  ],
  wc = { p: 1, n: 2, b: 4, r: 8, q: 16, k: 32 },
  Ec = "pnbrqkPNBRQK",
  bi = [In, cn, _t, st],
  Qc = 7,
  Rc = 6,
  Pc = 1,
  Lc = 0,
  Xt = { [Be]: L.KSIDE_CASTLE, [st]: L.QSIDE_CASTLE },
  ct = {
    w: [
      { square: R.a1, flag: L.QSIDE_CASTLE },
      { square: R.h1, flag: L.KSIDE_CASTLE },
    ],
    b: [
      { square: R.a8, flag: L.QSIDE_CASTLE },
      { square: R.h8, flag: L.KSIDE_CASTLE },
    ],
  },
  Kc = { b: Pc, w: Rc },
  vn = "--";
function mt(n) {
  return n >> 4;
}
function qt(n) {
  return n & 15;
}
function fa(n) {
  return "0123456789".indexOf(n) !== -1;
}
function xe(n) {
  const e = qt(n),
    t = mt(n);
  return "abcdefgh".substring(e, e + 1) + "87654321".substring(t, t + 1);
}
function Tt(n) {
  return n === Ve ? Ee : Ve;
}
function Mc(n) {
  const e = n.split(/\s+/);
  if (e.length !== 6)
    return { ok: !1, error: "Invalid FEN: must contain six space-delimited fields" };
  const t = parseInt(e[5], 10);
  if (isNaN(t) || t <= 0)
    return { ok: !1, error: "Invalid FEN: move number must be a positive integer" };
  const i = parseInt(e[4], 10);
  if (isNaN(i) || i < 0)
    return {
      ok: !1,
      error: "Invalid FEN: half move counter number must be a non-negative integer",
    };
  if (!/^(-|[abcdefgh][36])$/.test(e[3]))
    return { ok: !1, error: "Invalid FEN: en-passant square is invalid" };
  if (/[^kKqQ-]/.test(e[2]))
    return { ok: !1, error: "Invalid FEN: castling availability is invalid" };
  if (!/^(w|b)$/.test(e[1])) return { ok: !1, error: "Invalid FEN: side-to-move is invalid" };
  const a = e[0].split("/");
  if (a.length !== 8)
    return { ok: !1, error: "Invalid FEN: piece data does not contain 8 '/'-delimited rows" };
  for (let s = 0; s < a.length; s++) {
    let o = 0,
      d = !1;
    for (let N = 0; N < a[s].length; N++)
      if (fa(a[s][N])) {
        if (d) return { ok: !1, error: "Invalid FEN: piece data is invalid (consecutive number)" };
        ((o += parseInt(a[s][N], 10)), (d = !0));
      } else {
        if (!/^[prnbqkPRNBQK]$/.test(a[s][N]))
          return { ok: !1, error: "Invalid FEN: piece data is invalid (invalid piece)" };
        ((o += 1), (d = !1));
      }
    if (o !== 8)
      return { ok: !1, error: "Invalid FEN: piece data is invalid (too many squares in rank)" };
  }
  if ((e[3][1] == "3" && e[1] == "w") || (e[3][1] == "6" && e[1] == "b"))
    return { ok: !1, error: "Invalid FEN: illegal en-passant square" };
  const c = [
    { color: "white", regex: /K/g },
    { color: "black", regex: /k/g },
  ];
  for (const { color: s, regex: o } of c) {
    if (!o.test(e[0])) return { ok: !1, error: `Invalid FEN: missing ${s} king` };
    if ((e[0].match(o) || []).length > 1)
      return { ok: !1, error: `Invalid FEN: too many ${s} kings` };
  }
  return Array.from(a[0] + a[7]).some((s) => s.toUpperCase() === "P")
    ? { ok: !1, error: "Invalid FEN: some pawns are on the edge rows" }
    : { ok: !0 };
}
function Ic(n, e) {
  const t = n.from,
    i = n.to,
    a = n.piece;
  let c = 0,
    s = 0,
    o = 0;
  for (let d = 0, N = e.length; d < N; d++) {
    const l = e[d].from,
      u = e[d].to,
      f = e[d].piece;
    a === f && t !== l && i === u && (c++, mt(t) === mt(l) && s++, qt(t) === qt(l) && o++);
  }
  return c > 0 ? (s > 0 && o > 0 ? xe(t) : o > 0 ? xe(t).charAt(1) : xe(t).charAt(0)) : "";
}
function rt(n, e, t, i, a, c = void 0, s = L.NORMAL) {
  const o = mt(i);
  if (a === le && (o === Qc || o === Lc))
    for (let d = 0; d < bi.length; d++) {
      const N = bi[d];
      n.push({
        color: e,
        from: t,
        to: i,
        piece: a,
        captured: c,
        promotion: N,
        flags: s | L.PROMOTION,
      });
    }
  else n.push({ color: e, from: t, to: i, piece: a, captured: c, flags: s });
}
function mi(n) {
  let e = n.charAt(0);
  return e >= "a" && e <= "h"
    ? n.match(/[a-h]\d.*[a-h]\d/)
      ? void 0
      : le
    : ((e = e.toLowerCase()), e === "o" ? Be : e);
}
function An(n) {
  return n.replace(/=/, "").replace(/[+#]?[?!]*$/, "");
}
class Te {
  _board = new Array(128);
  _turn = Ve;
  _header = {};
  _kings = { w: Oe, b: Oe };
  _epSquare = -1;
  _halfMoves = 0;
  _moveNumber = 0;
  _history = [];
  _comments = {};
  _castling = { w: 0, b: 0 };
  _hash = 0n;
  _positionCount = new Map();
  constructor(e = Vn, { skipValidation: t = !1 } = {}) {
    this.load(e, { skipValidation: t });
  }
  clear({ preserveHeaders: e = !1 } = {}) {
    ((this._board = new Array(128)),
      (this._kings = { w: Oe, b: Oe }),
      (this._turn = Ve),
      (this._castling = { w: 0, b: 0 }),
      (this._epSquare = Oe),
      (this._halfMoves = 0),
      (this._moveNumber = 1),
      (this._history = []),
      (this._comments = {}),
      (this._header = e ? this._header : { ...Gc }),
      (this._hash = this._computeHash()),
      (this._positionCount = new Map()),
      (this._header.SetUp = null),
      (this._header.FEN = null));
  }
  load(e, { skipValidation: t = !1, preserveHeaders: i = !1 } = {}) {
    let a = e.split(/\s+/);
    if (a.length >= 2 && a.length < 6) {
      const o = ["-", "-", "0", "1"];
      e = a.concat(o.slice(-(6 - a.length))).join(" ");
    }
    if (((a = e.split(/\s+/)), !t)) {
      const { ok: o, error: d } = Mc(e);
      if (!o) throw new Error(d);
    }
    const c = a[0];
    let s = 0;
    this.clear({ preserveHeaders: i });
    for (let o = 0; o < c.length; o++) {
      const d = c.charAt(o);
      if (d === "/") s += 8;
      else if (fa(d)) s += parseInt(d, 10);
      else {
        const N = d < "a" ? Ve : Ee;
        (this._put({ type: d.toLowerCase(), color: N }, xe(s)), s++);
      }
    }
    ((this._turn = a[1]),
      a[2].indexOf("K") > -1 && (this._castling.w |= L.KSIDE_CASTLE),
      a[2].indexOf("Q") > -1 && (this._castling.w |= L.QSIDE_CASTLE),
      a[2].indexOf("k") > -1 && (this._castling.b |= L.KSIDE_CASTLE),
      a[2].indexOf("q") > -1 && (this._castling.b |= L.QSIDE_CASTLE),
      (this._epSquare = a[3] === "-" ? Oe : R[a[3]]),
      (this._halfMoves = parseInt(a[4], 10)),
      (this._moveNumber = parseInt(a[5], 10)),
      (this._hash = this._computeHash()),
      this._updateSetup(e),
      this._incPositionCount());
  }
  fen({ forceEnpassantSquare: e = !1 } = {}) {
    let t = 0,
      i = "";
    for (let s = R.a8; s <= R.h1; s++) {
      if (this._board[s]) {
        t > 0 && ((i += t), (t = 0));
        const { color: o, type: d } = this._board[s];
        i += o === Ve ? d.toUpperCase() : d.toLowerCase();
      } else t++;
      (s + 1) & 136 && (t > 0 && (i += t), s !== R.h1 && (i += "/"), (t = 0), (s += 8));
    }
    let a = "";
    (this._castling[Ve] & L.KSIDE_CASTLE && (a += "K"),
      this._castling[Ve] & L.QSIDE_CASTLE && (a += "Q"),
      this._castling[Ee] & L.KSIDE_CASTLE && (a += "k"),
      this._castling[Ee] & L.QSIDE_CASTLE && (a += "q"),
      (a = a || "-"));
    let c = "-";
    if (this._epSquare !== Oe)
      if (e) c = xe(this._epSquare);
      else {
        const s = this._epSquare + (this._turn === Ve ? 16 : -16),
          o = [s + 1, s - 1];
        for (const d of o) {
          if (d & 136) continue;
          const N = this._turn;
          if (this._board[d]?.color === N && this._board[d]?.type === le) {
            this._makeMove({
              color: N,
              from: d,
              to: this._epSquare,
              piece: le,
              captured: le,
              flags: L.EP_CAPTURE,
            });
            const l = !this._isKingAttacked(N);
            if ((this._undoMove(), l)) {
              c = xe(this._epSquare);
              break;
            }
          }
        }
      }
    return [i, this._turn, a, c, this._halfMoves, this._moveNumber].join(" ");
  }
  _pieceKey(e) {
    if (!this._board[e]) return 0n;
    const { color: t, type: i } = this._board[e],
      a = { w: 0, b: 1 }[t],
      c = { p: 0, n: 1, b: 2, r: 3, q: 4, k: 5 }[i];
    return Vc[a][c][e];
  }
  _epKey() {
    return this._epSquare === Oe ? 0n : Sc[this._epSquare & 7];
  }
  _castlingKey() {
    const e = (this._castling.w >> 5) | (this._castling.b >> 3);
    return vc[e];
  }
  _computeHash() {
    let e = 0n;
    for (let t = R.a8; t <= R.h1; t++) {
      if (t & 136) {
        t += 7;
        continue;
      }
      this._board[t] && (e ^= this._pieceKey(t));
    }
    return ((e ^= this._epKey()), (e ^= this._castlingKey()), this._turn === "b" && (e ^= Cn), e);
  }
  _updateSetup(e) {
    this._history.length > 0 ||
      (e !== Vn
        ? ((this._header.SetUp = "1"), (this._header.FEN = e))
        : ((this._header.SetUp = null), (this._header.FEN = null)));
  }
  reset() {
    this.load(Vn);
  }
  get(e) {
    return this._board[R[e]];
  }
  findPiece(e) {
    const t = [];
    for (let i = R.a8; i <= R.h1; i++) {
      if (i & 136) {
        i += 7;
        continue;
      }
      !this._board[i] ||
        this._board[i]?.color !== e.color ||
        (this._board[i].color === e.color && this._board[i].type === e.type && t.push(xe(i)));
    }
    return t;
  }
  put({ type: e, color: t }, i) {
    return this._put({ type: e, color: t }, i)
      ? (this._updateCastlingRights(),
        this._updateEnPassantSquare(),
        this._updateSetup(this.fen()),
        !0)
      : !1;
  }
  _set(e, t) {
    ((this._hash ^= this._pieceKey(e)), (this._board[e] = t), (this._hash ^= this._pieceKey(e)));
  }
  _put({ type: e, color: t }, i) {
    if (Ec.indexOf(e.toLowerCase()) === -1 || !(i in R)) return !1;
    const a = R[i];
    if (e == Be && !(this._kings[t] == Oe || this._kings[t] == a)) return !1;
    const c = this._board[a];
    return (
      c && c.type === Be && (this._kings[c.color] = Oe),
      this._set(a, { type: e, color: t }),
      e === Be && (this._kings[t] = a),
      !0
    );
  }
  _clear(e) {
    ((this._hash ^= this._pieceKey(e)), delete this._board[e]);
  }
  remove(e) {
    const t = this.get(e);
    return (
      this._clear(R[e]),
      t && t.type === Be && (this._kings[t.color] = Oe),
      this._updateCastlingRights(),
      this._updateEnPassantSquare(),
      this._updateSetup(this.fen()),
      t
    );
  }
  _updateCastlingRights() {
    this._hash ^= this._castlingKey();
    const e = this._board[R.e1]?.type === Be && this._board[R.e1]?.color === Ve,
      t = this._board[R.e8]?.type === Be && this._board[R.e8]?.color === Ee;
    ((!e || this._board[R.a1]?.type !== _t || this._board[R.a1]?.color !== Ve) &&
      (this._castling.w &= -65),
      (!e || this._board[R.h1]?.type !== _t || this._board[R.h1]?.color !== Ve) &&
        (this._castling.w &= -33),
      (!t || this._board[R.a8]?.type !== _t || this._board[R.a8]?.color !== Ee) &&
        (this._castling.b &= -65),
      (!t || this._board[R.h8]?.type !== _t || this._board[R.h8]?.color !== Ee) &&
        (this._castling.b &= -33),
      (this._hash ^= this._castlingKey()));
  }
  _updateEnPassantSquare() {
    if (this._epSquare === Oe) return;
    const e = this._epSquare + (this._turn === Ve ? -16 : 16),
      t = this._epSquare + (this._turn === Ve ? 16 : -16),
      i = [t + 1, t - 1];
    if (
      this._board[e] !== null ||
      this._board[this._epSquare] !== null ||
      this._board[t]?.color !== Tt(this._turn) ||
      this._board[t]?.type !== le
    ) {
      ((this._hash ^= this._epKey()), (this._epSquare = Oe));
      return;
    }
    const a = (c) =>
      !(c & 136) && this._board[c]?.color === this._turn && this._board[c]?.type === le;
    i.some(a) || ((this._hash ^= this._epKey()), (this._epSquare = Oe));
  }
  _attacked(e, t, i) {
    const a = [];
    for (let c = R.a8; c <= R.h1; c++) {
      if (c & 136) {
        c += 7;
        continue;
      }
      if (this._board[c] === void 0 || this._board[c].color !== e) continue;
      const s = this._board[c],
        o = c - t;
      if (o === 0) continue;
      const d = o + 119;
      if (yc[d] & wc[s.type]) {
        if (s.type === le) {
          if ((o > 0 && s.color === Ve) || (o <= 0 && s.color === Ee))
            if (i) a.push(xe(c));
            else return !0;
          continue;
        }
        if (s.type === "n" || s.type === "k")
          if (i) {
            a.push(xe(c));
            continue;
          } else return !0;
        const N = kc[d];
        let l = c + N,
          u = !1;
        for (; l !== t;) {
          if (this._board[l] != null) {
            u = !0;
            break;
          }
          l += N;
        }
        if (!u)
          if (i) {
            a.push(xe(c));
            continue;
          } else return !0;
      }
    }
    return i ? a : !1;
  }
  attackers(e, t) {
    return t ? this._attacked(t, R[e], !0) : this._attacked(this._turn, R[e], !0);
  }
  _isKingAttacked(e) {
    const t = this._kings[e];
    return t === -1 ? !1 : this._attacked(Tt(e), t);
  }
  hash() {
    return this._hash.toString(16);
  }
  isAttacked(e, t) {
    return this._attacked(t, R[e]);
  }
  isCheck() {
    return this._isKingAttacked(this._turn);
  }
  inCheck() {
    return this.isCheck();
  }
  isCheckmate() {
    return this.isCheck() && this._moves().length === 0;
  }
  isStalemate() {
    return !this.isCheck() && this._moves().length === 0;
  }
  isInsufficientMaterial() {
    const e = { b: 0, n: 0, r: 0, q: 0, k: 0, p: 0 },
      t = [];
    let i = 0,
      a = 0;
    for (let c = R.a8; c <= R.h1; c++) {
      if (((a = (a + 1) % 2), c & 136)) {
        c += 7;
        continue;
      }
      const s = this._board[c];
      s && ((e[s.type] = s.type in e ? e[s.type] + 1 : 1), s.type === cn && t.push(a), i++);
    }
    if (i === 2) return !0;
    if (i === 3 && (e[cn] === 1 || e[In] === 1)) return !0;
    if (i === e[cn] + 2) {
      let c = 0;
      const s = t.length;
      for (let o = 0; o < s; o++) c += t[o];
      if (c === 0 || c === s) return !0;
    }
    return !1;
  }
  isThreefoldRepetition() {
    return this._getPositionCount(this._hash) >= 3;
  }
  isDrawByFiftyMoves() {
    return this._halfMoves >= 100;
  }
  isDraw() {
    return (
      this.isDrawByFiftyMoves() ||
      this.isStalemate() ||
      this.isInsufficientMaterial() ||
      this.isThreefoldRepetition()
    );
  }
  isGameOver() {
    return this.isCheckmate() || this.isDraw();
  }
  moves({ verbose: e = !1, square: t = void 0, piece: i = void 0 } = {}) {
    const a = this._moves({ square: t, piece: i });
    return e ? a.map((c) => new Jt(this, c)) : a.map((c) => this._moveToSan(c, a));
  }
  _moves({ legal: e = !0, piece: t = void 0, square: i = void 0 } = {}) {
    const a = i ? i.toLowerCase() : void 0,
      c = t?.toLowerCase(),
      s = [],
      o = this._turn,
      d = Tt(o);
    let N = R.a8,
      l = R.h1,
      u = !1;
    if (a)
      if (a in R) ((N = l = R[a]), (u = !0));
      else return [];
    for (let B = N; B <= l; B++) {
      if (B & 136) {
        B += 7;
        continue;
      }
      if (!this._board[B] || this._board[B].color === d) continue;
      const { type: b } = this._board[B];
      let p;
      if (b === le) {
        if (c && c !== b) continue;
        ((p = B + Sn[o][0]),
          this._board[p] ||
            (rt(s, o, B, p, le),
            (p = B + Sn[o][1]),
            Kc[o] === mt(B) && !this._board[p] && rt(s, o, B, p, le, void 0, L.BIG_PAWN)));
        for (let V = 2; V < 4; V++)
          ((p = B + Sn[o][V]),
            !(p & 136) &&
              (this._board[p]?.color === d
                ? rt(s, o, B, p, le, this._board[p].type, L.CAPTURE)
                : p === this._epSquare && rt(s, o, B, p, le, le, L.EP_CAPTURE)));
      } else {
        if (c && c !== b) continue;
        for (let V = 0, G = ui[b].length; V < G; V++) {
          const A = ui[b][V];
          for (p = B; (p += A), !(p & 136);) {
            if (!this._board[p]) rt(s, o, B, p, b);
            else {
              if (this._board[p].color === o) break;
              rt(s, o, B, p, b, this._board[p].type, L.CAPTURE);
              break;
            }
            if (b === In || b === Be) break;
          }
        }
      }
    }
    if ((c === void 0 || c === Be) && (!u || l === this._kings[o])) {
      if (this._castling[o] & L.KSIDE_CASTLE) {
        const B = this._kings[o],
          b = B + 2;
        !this._board[B + 1] &&
          !this._board[b] &&
          !this._attacked(d, this._kings[o]) &&
          !this._attacked(d, B + 1) &&
          !this._attacked(d, b) &&
          rt(s, o, this._kings[o], b, Be, void 0, L.KSIDE_CASTLE);
      }
      if (this._castling[o] & L.QSIDE_CASTLE) {
        const B = this._kings[o],
          b = B - 2;
        !this._board[B - 1] &&
          !this._board[B - 2] &&
          !this._board[B - 3] &&
          !this._attacked(d, this._kings[o]) &&
          !this._attacked(d, B - 1) &&
          !this._attacked(d, b) &&
          rt(s, o, this._kings[o], b, Be, void 0, L.QSIDE_CASTLE);
      }
    }
    if (!e || this._kings[o] === -1) return s;
    const f = [];
    for (let B = 0, b = s.length; B < b; B++)
      (this._makeMove(s[B]), this._isKingAttacked(o) || f.push(s[B]), this._undoMove());
    return f;
  }
  move(e, { strict: t = !1 } = {}) {
    let i = null;
    if (typeof e == "string") i = this._moveFromSan(e, t);
    else if (e === null) i = this._moveFromSan(vn, t);
    else if (typeof e == "object") {
      const c = this._moves();
      for (let s = 0, o = c.length; s < o; s++)
        if (
          e.from === xe(c[s].from) &&
          e.to === xe(c[s].to) &&
          (!("promotion" in c[s]) || e.promotion === c[s].promotion)
        ) {
          i = c[s];
          break;
        }
    }
    if (!i)
      throw typeof e == "string"
        ? new Error(`Invalid move: ${e}`)
        : new Error(`Invalid move: ${JSON.stringify(e)}`);
    if (this.isCheck() && i.flags & L.NULL_MOVE)
      throw new Error("Null move not allowed when in check");
    const a = new Jt(this, i);
    return (this._makeMove(i), this._incPositionCount(), a);
  }
  _push(e) {
    this._history.push({
      move: e,
      kings: { b: this._kings.b, w: this._kings.w },
      turn: this._turn,
      castling: { b: this._castling.b, w: this._castling.w },
      epSquare: this._epSquare,
      halfMoves: this._halfMoves,
      moveNumber: this._moveNumber,
    });
  }
  _movePiece(e, t) {
    ((this._hash ^= this._pieceKey(e)),
      (this._board[t] = this._board[e]),
      delete this._board[e],
      (this._hash ^= this._pieceKey(t)));
  }
  _makeMove(e) {
    const t = this._turn,
      i = Tt(t);
    if ((this._push(e), e.flags & L.NULL_MOVE)) {
      (t === Ee && this._moveNumber++, this._halfMoves++, (this._turn = i), (this._epSquare = Oe));
      return;
    }
    if (
      ((this._hash ^= this._epKey()),
      (this._hash ^= this._castlingKey()),
      e.captured && (this._hash ^= this._pieceKey(e.to)),
      this._movePiece(e.from, e.to),
      e.flags & L.EP_CAPTURE &&
        (this._turn === Ee ? this._clear(e.to - 16) : this._clear(e.to + 16)),
      e.promotion && (this._clear(e.to), this._set(e.to, { type: e.promotion, color: t })),
      this._board[e.to].type === Be)
    ) {
      if (((this._kings[t] = e.to), e.flags & L.KSIDE_CASTLE)) {
        const a = e.to - 1,
          c = e.to + 1;
        this._movePiece(c, a);
      } else if (e.flags & L.QSIDE_CASTLE) {
        const a = e.to + 1,
          c = e.to - 2;
        this._movePiece(c, a);
      }
      this._castling[t] = 0;
    }
    if (this._castling[t]) {
      for (let a = 0, c = ct[t].length; a < c; a++)
        if (e.from === ct[t][a].square && this._castling[t] & ct[t][a].flag) {
          this._castling[t] ^= ct[t][a].flag;
          break;
        }
    }
    if (this._castling[i]) {
      for (let a = 0, c = ct[i].length; a < c; a++)
        if (e.to === ct[i][a].square && this._castling[i] & ct[i][a].flag) {
          this._castling[i] ^= ct[i][a].flag;
          break;
        }
    }
    if (((this._hash ^= this._castlingKey()), e.flags & L.BIG_PAWN)) {
      let a;
      (t === Ee ? (a = e.to - 16) : (a = e.to + 16),
        (!((e.to - 1) & 136) &&
          this._board[e.to - 1]?.type === le &&
          this._board[e.to - 1]?.color === i) ||
        (!((e.to + 1) & 136) &&
          this._board[e.to + 1]?.type === le &&
          this._board[e.to + 1]?.color === i)
          ? ((this._epSquare = a), (this._hash ^= this._epKey()))
          : (this._epSquare = Oe));
    } else this._epSquare = Oe;
    (e.piece === le
      ? (this._halfMoves = 0)
      : e.flags & (L.CAPTURE | L.EP_CAPTURE)
        ? (this._halfMoves = 0)
        : this._halfMoves++,
      t === Ee && this._moveNumber++,
      (this._turn = i),
      (this._hash ^= Cn));
  }
  undo() {
    const e = this._hash,
      t = this._undoMove();
    if (t) {
      const i = new Jt(this, t);
      return (this._decPositionCount(e), i);
    }
    return null;
  }
  _undoMove() {
    const e = this._history.pop();
    if (e === void 0) return null;
    ((this._hash ^= this._epKey()), (this._hash ^= this._castlingKey()));
    const t = e.move;
    ((this._kings = e.kings),
      (this._turn = e.turn),
      (this._castling = e.castling),
      (this._epSquare = e.epSquare),
      (this._halfMoves = e.halfMoves),
      (this._moveNumber = e.moveNumber),
      (this._hash ^= this._epKey()),
      (this._hash ^= this._castlingKey()),
      (this._hash ^= Cn));
    const i = this._turn,
      a = Tt(i);
    if (t.flags & L.NULL_MOVE) return t;
    if (
      (this._movePiece(t.to, t.from),
      t.piece && (this._clear(t.from), this._set(t.from, { type: t.piece, color: i })),
      t.captured)
    )
      if (t.flags & L.EP_CAPTURE) {
        let c;
        (i === Ee ? (c = t.to - 16) : (c = t.to + 16), this._set(c, { type: le, color: a }));
      } else this._set(t.to, { type: t.captured, color: a });
    if (t.flags & (L.KSIDE_CASTLE | L.QSIDE_CASTLE)) {
      let c, s;
      (t.flags & L.KSIDE_CASTLE
        ? ((c = t.to + 1), (s = t.to - 1))
        : ((c = t.to - 2), (s = t.to + 1)),
        this._movePiece(s, c));
    }
    return t;
  }
  pgn({
    newline: e = `
`,
    maxWidth: t = 0,
  } = {}) {
    const i = [];
    let a = !1;
    for (const f in this._header)
      (this._header[f] && i.push(`[${f} "${this._header[f]}"]` + e), (a = !0));
    a && this._history.length && i.push(e);
    const c = (f) => {
        const B = this._comments[this.fen()];
        if (typeof B < "u") {
          const b = f.length > 0 ? " " : "";
          f = `${f}${b}{${B}}`;
        }
        return f;
      },
      s = [];
    for (; this._history.length > 0;) s.push(this._undoMove());
    const o = [];
    let d = "";
    for (s.length === 0 && o.push(c("")); s.length > 0;) {
      d = c(d);
      const f = s.pop();
      if (!f) break;
      if (!this._history.length && f.color === "b") {
        const B = `${this._moveNumber}. ...`;
        d = d ? `${d} ${B}` : B;
      } else f.color === "w" && (d.length && o.push(d), (d = this._moveNumber + "."));
      ((d = d + " " + this._moveToSan(f, this._moves({ legal: !0 }))), this._makeMove(f));
    }
    if ((d.length && o.push(c(d)), o.push(this._header.Result || "*"), t === 0))
      return i.join("") + o.join(" ");
    const N = function () {
        return i.length > 0 && i[i.length - 1] === " " ? (i.pop(), !0) : !1;
      },
      l = function (f, B) {
        for (const b of B.split(" "))
          if (b) {
            if (f + b.length > t) {
              for (; N();) f--;
              (i.push(e), (f = 0));
            }
            (i.push(b), (f += b.length), i.push(" "), f++);
          }
        return (N() && f--, f);
      };
    let u = 0;
    for (let f = 0; f < o.length; f++) {
      if (u + o[f].length > t && o[f].includes("{")) {
        u = l(u, o[f]);
        continue;
      }
      (u + o[f].length > t && f !== 0
        ? (i[i.length - 1] === " " && i.pop(), i.push(e), (u = 0))
        : f !== 0 && (i.push(" "), u++),
        i.push(o[f]),
        (u += o[f].length));
    }
    return i.join("");
  }
  header(...e) {
    for (let t = 0; t < e.length; t += 2)
      typeof e[t] == "string" && typeof e[t + 1] == "string" && (this._header[e[t]] = e[t + 1]);
    return this._header;
  }
  setHeader(e, t) {
    return ((this._header[e] = t ?? Tn[e] ?? null), this.getHeaders());
  }
  removeHeader(e) {
    return e in this._header ? ((this._header[e] = Tn[e] || null), !0) : !1;
  }
  getHeaders() {
    const e = {};
    for (const [t, i] of Object.entries(this._header)) i !== null && (e[t] = i);
    return e;
  }
  loadPgn(
    e,
    {
      strict: t = !1,
      newlineChar: i = `\r?
`,
    } = {},
  ) {
    i !==
      `\r?
` &&
      (e = e.replace(
        new RegExp(i, "g"),
        `
`,
      ));
    const a = Oc(e);
    this.reset();
    const c = a.headers;
    let s = "";
    for (const N in c) (N.toLowerCase() === "fen" && (s = c[N]), this.header(N, c[N]));
    if (!t) s && this.load(s, { preserveHeaders: !0 });
    else if (c.SetUp === "1") {
      if (!("FEN" in c)) throw new Error("Invalid PGN: FEN tag must be supplied with SetUp tag");
      this.load(c.FEN, { preserveHeaders: !0 });
    }
    let o = a.root;
    for (; o;) {
      if (o.move) {
        const N = this._moveFromSan(o.move, t);
        if (N == null) throw new Error(`Invalid move in PGN: ${o.move}`);
        (this._makeMove(N), this._incPositionCount());
      }
      (o.comment !== void 0 && (this._comments[this.fen()] = o.comment), (o = o.variations[0]));
    }
    const d = a.result;
    d &&
      Object.keys(this._header).length &&
      this._header.Result !== d &&
      this.setHeader("Result", d);
  }
  _moveToSan(e, t) {
    let i = "";
    if (e.flags & L.KSIDE_CASTLE) i = "O-O";
    else if (e.flags & L.QSIDE_CASTLE) i = "O-O-O";
    else {
      if (e.flags & L.NULL_MOVE) return vn;
      if (e.piece !== le) {
        const a = Ic(e, t);
        i += e.piece.toUpperCase() + a;
      }
      (e.flags & (L.CAPTURE | L.EP_CAPTURE) && (e.piece === le && (i += xe(e.from)[0]), (i += "x")),
        (i += xe(e.to)),
        e.promotion && (i += "=" + e.promotion.toUpperCase()));
    }
    return (
      this._makeMove(e),
      this.isCheck() && (this.isCheckmate() ? (i += "#") : (i += "+")),
      this._undoMove(),
      i
    );
  }
  _moveFromSan(e, t = !1) {
    let i = An(e);
    if ((t || (i === "0-0" ? (i = "O-O") : i === "0-0-0" && (i = "O-O-O")), i == vn))
      return { color: this._turn, from: 0, to: 0, piece: "k", flags: L.NULL_MOVE };
    let a = mi(i),
      c = this._moves({ legal: !0, piece: a });
    for (let f = 0, B = c.length; f < B; f++) if (i === An(this._moveToSan(c[f], c))) return c[f];
    if (t) return null;
    let s,
      o,
      d,
      N,
      l,
      u = !1;
    if (
      ((o = i.match(/([pnbrqkPNBRQK])?([a-h][1-8])x?-?([a-h][1-8])([qrbnQRBN])?/)),
      o
        ? ((s = o[1]), (d = o[2]), (N = o[3]), (l = o[4]), d.length == 1 && (u = !0))
        : ((o = i.match(/([pnbrqkPNBRQK])?([a-h]?[1-8]?)x?-?([a-h][1-8])([qrbnQRBN])?/)),
          o && ((s = o[1]), (d = o[2]), (N = o[3]), (l = o[4]), d.length == 1 && (u = !0))),
      (a = mi(i)),
      (c = this._moves({ legal: !0, piece: s || a })),
      !N)
    )
      return null;
    for (let f = 0, B = c.length; f < B; f++)
      if (d) {
        if (
          (!s || s.toLowerCase() == c[f].piece) &&
          R[d] == c[f].from &&
          R[N] == c[f].to &&
          (!l || l.toLowerCase() == c[f].promotion)
        )
          return c[f];
        if (u) {
          const b = xe(c[f].from);
          if (
            (!s || s.toLowerCase() == c[f].piece) &&
            R[N] == c[f].to &&
            (d == b[0] || d == b[1]) &&
            (!l || l.toLowerCase() == c[f].promotion)
          )
            return c[f];
        }
      } else if (i === An(this._moveToSan(c[f], c)).replace("x", "")) return c[f];
    return null;
  }
  ascii() {
    let e = `   +------------------------+
`;
    for (let t = R.a8; t <= R.h1; t++) {
      if ((qt(t) === 0 && (e += " " + "87654321"[mt(t)] + " |"), this._board[t])) {
        const i = this._board[t].type,
          c = this._board[t].color === Ve ? i.toUpperCase() : i.toLowerCase();
        e += " " + c + " ";
      } else e += " . ";
      (t + 1) & 136 &&
        ((e += `|
`),
        (t += 8));
    }
    return (
      (e += `   +------------------------+
`),
      (e += "     a  b  c  d  e  f  g  h"),
      e
    );
  }
  perft(e) {
    const t = this._moves({ legal: !1 });
    let i = 0;
    const a = this._turn;
    for (let c = 0, s = t.length; c < s; c++)
      (this._makeMove(t[c]),
        this._isKingAttacked(a) || (e - 1 > 0 ? (i += this.perft(e - 1)) : i++),
        this._undoMove());
    return i;
  }
  setTurn(e) {
    return this._turn == e ? !1 : (this.move("--"), !0);
  }
  turn() {
    return this._turn;
  }
  board() {
    const e = [];
    let t = [];
    for (let i = R.a8; i <= R.h1; i++)
      (this._board[i] == null
        ? t.push(null)
        : t.push({ square: xe(i), type: this._board[i].type, color: this._board[i].color }),
        (i + 1) & 136 && (e.push(t), (t = []), (i += 8)));
    return e;
  }
  squareColor(e) {
    if (e in R) {
      const t = R[e];
      return (mt(t) + qt(t)) % 2 === 0 ? "light" : "dark";
    }
    return null;
  }
  history({ verbose: e = !1 } = {}) {
    const t = [],
      i = [];
    for (; this._history.length > 0;) t.push(this._undoMove());
    for (;;) {
      const a = t.pop();
      if (!a) break;
      (e ? i.push(new Jt(this, a)) : i.push(this._moveToSan(a, this._moves())), this._makeMove(a));
    }
    return i;
  }
  _getPositionCount(e) {
    return this._positionCount.get(e) ?? 0;
  }
  _incPositionCount() {
    this._positionCount.set(this._hash, (this._positionCount.get(this._hash) ?? 0) + 1);
  }
  _decPositionCount(e) {
    const t = this._positionCount.get(e) ?? 0;
    t === 1 ? this._positionCount.delete(e) : this._positionCount.set(e, t - 1);
  }
  _pruneComments() {
    const e = [],
      t = {},
      i = (a) => {
        a in this._comments && (t[a] = this._comments[a]);
      };
    for (; this._history.length > 0;) e.push(this._undoMove());
    for (i(this.fen()); ;) {
      const a = e.pop();
      if (!a) break;
      (this._makeMove(a), i(this.fen()));
    }
    this._comments = t;
  }
  getComment() {
    return this._comments[this.fen()];
  }
  setComment(e) {
    this._comments[this.fen()] = e.replace("{", "[").replace("}", "]");
  }
  deleteComment() {
    return this.removeComment();
  }
  removeComment() {
    const e = this._comments[this.fen()];
    return (delete this._comments[this.fen()], e);
  }
  getComments() {
    return (
      this._pruneComments(),
      Object.keys(this._comments).map((e) => ({ fen: e, comment: this._comments[e] }))
    );
  }
  deleteComments() {
    return this.removeComments();
  }
  removeComments() {
    return (
      this._pruneComments(),
      Object.keys(this._comments).map((e) => {
        const t = this._comments[e];
        return (delete this._comments[e], { fen: e, comment: t });
      })
    );
  }
  setCastlingRights(e, t) {
    for (const a of [Be, st])
      t[a] !== void 0 && (t[a] ? (this._castling[e] |= Xt[a]) : (this._castling[e] &= ~Xt[a]));
    this._updateCastlingRights();
    const i = this.getCastlingRights(e);
    return (t[Be] === void 0 || t[Be] === i[Be]) && (t[st] === void 0 || t[st] === i[st]);
  }
  getCastlingRights(e) {
    return { [Be]: (this._castling[e] & Xt[Be]) !== 0, [st]: (this._castling[e] & Xt[st]) !== 0 };
  }
  moveNumber() {
    return this._moveNumber;
  }
}
function Tc(n, e) {
  var t = {};
  for (var i in n) Object.prototype.hasOwnProperty.call(n, i) && e.indexOf(i) < 0 && (t[i] = n[i]);
  if (n != null && typeof Object.getOwnPropertySymbols == "function")
    for (var a = 0, i = Object.getOwnPropertySymbols(n); a < i.length; a++)
      e.indexOf(i[a]) < 0 &&
        Object.prototype.propertyIsEnumerable.call(n, i[a]) &&
        (t[i[a]] = n[i[a]]);
  return t;
}
const Ut = "abcdefgh".split(""),
  rn = {
    a8: "bR",
    b8: "bN",
    c8: "bB",
    d8: "bQ",
    e8: "bK",
    f8: "bB",
    g8: "bN",
    h8: "bR",
    a7: "bP",
    b7: "bP",
    c7: "bP",
    d7: "bP",
    e7: "bP",
    f7: "bP",
    g7: "bP",
    h7: "bP",
    a2: "wP",
    b2: "wP",
    c2: "wP",
    d2: "wP",
    e2: "wP",
    f2: "wP",
    g2: "wP",
    h2: "wP",
    a1: "wR",
    b1: "wN",
    c1: "wB",
    d1: "wQ",
    e1: "wK",
    f1: "wB",
    g1: "wN",
    h1: "wR",
  },
  zc = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 },
  _c = { a: 7, b: 6, c: 5, d: 4, e: 3, f: 2, g: 1, h: 0 },
  Fc = [7, 6, 5, 4, 3, 2, 1, 0],
  jc = [0, 1, 2, 3, 4, 5, 6, 7],
  xi = {
    wP: r.jsx(
      "svg",
      Object.assign(
        { xmlns: "http://www.w3.org/2000/svg", version: "1.1", width: "45", height: "45" },
        {
          children: r.jsx("path", {
            d: "m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z",
            style: {
              opacity: "1",
              fill: "#ffffff",
              fillOpacity: "1",
              fillRule: "nonzero",
              stroke: "#000000",
              strokeWidth: "1.5",
              strokeLinecap: "round",
              strokeLinejoin: "miter",
              strokeMiterlimit: "4",
              strokeDasharray: "none",
              strokeOpacity: "1",
            },
          }),
        },
      ),
    ),
    wR: r.jsx(
      "svg",
      Object.assign(
        { xmlns: "http://www.w3.org/2000/svg", version: "1.1", width: "45", height: "45" },
        {
          children: r.jsxs(
            "g",
            Object.assign(
              {
                style: {
                  opacity: "1",
                  fill: "#ffffff",
                  fillOpacity: "1",
                  fillRule: "evenodd",
                  stroke: "#000000",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeMiterlimit: "4",
                  strokeDasharray: "none",
                  strokeOpacity: "1",
                },
              },
              {
                children: [
                  r.jsx("path", {
                    d: "M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z ",
                    style: { strokeLinecap: "butt" },
                  }),
                  r.jsx("path", {
                    d: "M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z ",
                    style: { strokeLinecap: "butt" },
                  }),
                  r.jsx("path", {
                    d: "M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14",
                    style: { strokeLinecap: "butt" },
                  }),
                  r.jsx("path", { d: "M 34,14 L 31,17 L 14,17 L 11,14" }),
                  r.jsx("path", {
                    d: "M 31,17 L 31,29.5 L 14,29.5 L 14,17",
                    style: { strokeLinecap: "butt", strokeLinejoin: "miter" },
                  }),
                  r.jsx("path", { d: "M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" }),
                  r.jsx("path", {
                    d: "M 11,14 L 34,14",
                    style: { fill: "none", stroke: "#000000", strokeLinejoin: "miter" },
                  }),
                ],
              },
            ),
          ),
        },
      ),
    ),
    wN: r.jsx(
      "svg",
      Object.assign(
        { xmlns: "http://www.w3.org/2000/svg", version: "1.1", width: "45", height: "45" },
        {
          children: r.jsxs(
            "g",
            Object.assign(
              {
                style: {
                  opacity: "1",
                  fill: "none",
                  fillOpacity: "1",
                  fillRule: "evenodd",
                  stroke: "#000000",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeMiterlimit: "4",
                  strokeDasharray: "none",
                  strokeOpacity: "1",
                },
              },
              {
                children: [
                  r.jsx("path", {
                    d: "M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18",
                    style: { fill: "#ffffff", stroke: "#000000" },
                  }),
                  r.jsx("path", {
                    d: "M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10",
                    style: { fill: "#ffffff", stroke: "#000000" },
                  }),
                  r.jsx("path", {
                    d: "M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z",
                    style: { fill: "#000000", stroke: "#000000" },
                  }),
                  r.jsx("path", {
                    d: "M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z",
                    transform: "matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)",
                    style: { fill: "#000000", stroke: "#000000" },
                  }),
                ],
              },
            ),
          ),
        },
      ),
    ),
    wB: r.jsx(
      "svg",
      Object.assign(
        { xmlns: "http://www.w3.org/2000/svg", version: "1.1", width: "45", height: "45" },
        {
          children: r.jsxs(
            "g",
            Object.assign(
              {
                style: {
                  opacity: "1",
                  fill: "none",
                  fillRule: "evenodd",
                  fillOpacity: "1",
                  stroke: "#000000",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeMiterlimit: "4",
                  strokeDasharray: "none",
                  strokeOpacity: "1",
                },
              },
              {
                children: [
                  r.jsxs(
                    "g",
                    Object.assign(
                      { style: { fill: "#ffffff", stroke: "#000000", strokeLinecap: "butt" } },
                      {
                        children: [
                          r.jsx("path", {
                            d: "M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z",
                          }),
                          r.jsx("path", {
                            d: "M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z",
                          }),
                          r.jsx("path", {
                            d: "M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z",
                          }),
                        ],
                      },
                    ),
                  ),
                  r.jsx("path", {
                    d: "M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18",
                    style: { fill: "none", stroke: "#000000", strokeLinejoin: "miter" },
                  }),
                ],
              },
            ),
          ),
        },
      ),
    ),
    wQ: r.jsx(
      "svg",
      Object.assign(
        { xmlns: "http://www.w3.org/2000/svg", version: "1.1", width: "45", height: "45" },
        {
          children: r.jsxs(
            "g",
            Object.assign(
              {
                style: {
                  fill: "#ffffff",
                  stroke: "#000000",
                  strokeWidth: "1.5",
                  strokeLinejoin: "round",
                },
              },
              {
                children: [
                  r.jsx("path", {
                    d: "M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z",
                  }),
                  r.jsx("path", {
                    d: "M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z",
                  }),
                  r.jsx("path", { d: "M 11.5,30 C 15,29 30,29 33.5,30", style: { fill: "none" } }),
                  r.jsx("path", {
                    d: "M 12,33.5 C 18,32.5 27,32.5 33,33.5",
                    style: { fill: "none" },
                  }),
                  r.jsx("circle", { cx: "6", cy: "12", r: "2" }),
                  r.jsx("circle", { cx: "14", cy: "9", r: "2" }),
                  r.jsx("circle", { cx: "22.5", cy: "8", r: "2" }),
                  r.jsx("circle", { cx: "31", cy: "9", r: "2" }),
                  r.jsx("circle", { cx: "39", cy: "12", r: "2" }),
                ],
              },
            ),
          ),
        },
      ),
    ),
    wK: r.jsx(
      "svg",
      Object.assign(
        { xmlns: "http://www.w3.org/2000/svg", version: "1.1", width: "45", height: "45" },
        {
          children: r.jsxs(
            "g",
            Object.assign(
              {
                style: {
                  fill: "none",
                  fillOpacity: "1",
                  fillRule: "evenodd",
                  stroke: "#000000",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeMiterlimit: "4",
                  strokeDasharray: "none",
                  strokeOpacity: "1",
                },
              },
              {
                children: [
                  r.jsx("path", {
                    d: "M 22.5,11.63 L 22.5,6",
                    style: { fill: "none", stroke: "#000000", strokeLinejoin: "miter" },
                  }),
                  r.jsx("path", {
                    d: "M 20,8 L 25,8",
                    style: { fill: "none", stroke: "#000000", strokeLinejoin: "miter" },
                  }),
                  r.jsx("path", {
                    d: "M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25",
                    style: {
                      fill: "#ffffff",
                      stroke: "#000000",
                      strokeLinecap: "butt",
                      strokeLinejoin: "miter",
                    },
                  }),
                  r.jsx("path", {
                    d: "M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37",
                    style: { fill: "#ffffff", stroke: "#000000" },
                  }),
                  r.jsx("path", {
                    d: "M 12.5,30 C 18,27 27,27 32.5,30",
                    style: { fill: "none", stroke: "#000000" },
                  }),
                  r.jsx("path", {
                    d: "M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5",
                    style: { fill: "none", stroke: "#000000" },
                  }),
                  r.jsx("path", {
                    d: "M 12.5,37 C 18,34 27,34 32.5,37",
                    style: { fill: "none", stroke: "#000000" },
                  }),
                ],
              },
            ),
          ),
        },
      ),
    ),
    bP: r.jsx(
      "svg",
      Object.assign(
        { xmlns: "http://www.w3.org/2000/svg", version: "1.1", width: "45", height: "45" },
        {
          children: r.jsx("path", {
            d: "m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z",
            style: {
              opacity: "1",
              fill: "#000000",
              fillOpacity: "1",
              fillRule: "nonzero",
              stroke: "#000000",
              strokeWidth: "1.5",
              strokeLinecap: "round",
              strokeLinejoin: "miter",
              strokeMiterlimit: "4",
              strokeDasharray: "none",
              strokeOpacity: "1",
            },
          }),
        },
      ),
    ),
    bR: r.jsx(
      "svg",
      Object.assign(
        { xmlns: "http://www.w3.org/2000/svg", version: "1.1", width: "45", height: "45" },
        {
          children: r.jsxs(
            "g",
            Object.assign(
              {
                style: {
                  opacity: "1",
                  fill: "#000000",
                  fillOpacity: "1",
                  fillRule: "evenodd",
                  stroke: "#000000",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeMiterlimit: "4",
                  strokeDasharray: "none",
                  strokeOpacity: "1",
                },
              },
              {
                children: [
                  r.jsx("path", {
                    d: "M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z ",
                    style: { strokeLinecap: "butt" },
                  }),
                  r.jsx("path", {
                    d: "M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z ",
                    style: { strokeLinecap: "butt" },
                  }),
                  r.jsx("path", {
                    d: "M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z ",
                    style: { strokeLinecap: "butt" },
                  }),
                  r.jsx("path", {
                    d: "M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z ",
                    style: { strokeLinecap: "butt", strokeLinejoin: "miter" },
                  }),
                  r.jsx("path", {
                    d: "M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z ",
                    style: { strokeLinecap: "butt" },
                  }),
                  r.jsx("path", {
                    d: "M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z ",
                    style: { strokeLinecap: "butt" },
                  }),
                  r.jsx("path", {
                    d: "M 12,35.5 L 33,35.5 L 33,35.5",
                    style: {
                      fill: "none",
                      stroke: "#ffffff",
                      strokeWidth: "1",
                      strokeLinejoin: "miter",
                    },
                  }),
                  r.jsx("path", {
                    d: "M 13,31.5 L 32,31.5",
                    style: {
                      fill: "none",
                      stroke: "#ffffff",
                      strokeWidth: "1",
                      strokeLinejoin: "miter",
                    },
                  }),
                  r.jsx("path", {
                    d: "M 14,29.5 L 31,29.5",
                    style: {
                      fill: "none",
                      stroke: "#ffffff",
                      strokeWidth: "1",
                      strokeLinejoin: "miter",
                    },
                  }),
                  r.jsx("path", {
                    d: "M 14,16.5 L 31,16.5",
                    style: {
                      fill: "none",
                      stroke: "#ffffff",
                      strokeWidth: "1",
                      strokeLinejoin: "miter",
                    },
                  }),
                  r.jsx("path", {
                    d: "M 11,14 L 34,14",
                    style: {
                      fill: "none",
                      stroke: "#ffffff",
                      strokeWidth: "1",
                      strokeLinejoin: "miter",
                    },
                  }),
                ],
              },
            ),
          ),
        },
      ),
    ),
    bN: r.jsx(
      "svg",
      Object.assign(
        { xmlns: "http://www.w3.org/2000/svg", version: "1.1", width: "45", height: "45" },
        {
          children: r.jsxs(
            "g",
            Object.assign(
              {
                style: {
                  opacity: "1",
                  fill: "none",
                  fillOpacity: "1",
                  fillRule: "evenodd",
                  stroke: "#000000",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeMiterlimit: "4",
                  strokeDasharray: "none",
                  strokeOpacity: "1",
                },
              },
              {
                children: [
                  r.jsx("path", {
                    d: "M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18",
                    style: { fill: "#000000", stroke: "#000000" },
                  }),
                  r.jsx("path", {
                    d: "M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10",
                    style: { fill: "#000000", stroke: "#000000" },
                  }),
                  r.jsx("path", {
                    d: "M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z",
                    style: { fill: "#ffffff", stroke: "#ffffff" },
                  }),
                  r.jsx("path", {
                    d: "M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z",
                    transform: "matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)",
                    style: { fill: "#ffffff", stroke: "#ffffff" },
                  }),
                  r.jsx("path", {
                    d: "M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z ",
                    style: { fill: "#ffffff", stroke: "none" },
                  }),
                ],
              },
            ),
          ),
        },
      ),
    ),
    bB: r.jsx(
      "svg",
      Object.assign(
        { xmlns: "http://www.w3.org/2000/svg", version: "1.1", width: "45", height: "45" },
        {
          children: r.jsxs(
            "g",
            Object.assign(
              {
                style: {
                  opacity: "1",
                  fill: "none",
                  fillRule: "evenodd",
                  fillOpacity: "1",
                  stroke: "#000000",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeMiterlimit: "4",
                  strokeDasharray: "none",
                  strokeOpacity: "1",
                },
              },
              {
                children: [
                  r.jsxs(
                    "g",
                    Object.assign(
                      { style: { fill: "#000000", stroke: "#000000", strokeLinecap: "butt" } },
                      {
                        children: [
                          r.jsx("path", {
                            d: "M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z",
                          }),
                          r.jsx("path", {
                            d: "M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z",
                          }),
                          r.jsx("path", {
                            d: "M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z",
                          }),
                        ],
                      },
                    ),
                  ),
                  r.jsx("path", {
                    d: "M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18",
                    style: { fill: "none", stroke: "#ffffff", strokeLinejoin: "miter" },
                  }),
                ],
              },
            ),
          ),
        },
      ),
    ),
    bQ: r.jsx(
      "svg",
      Object.assign(
        { xmlns: "http://www.w3.org/2000/svg", version: "1.1", width: "45", height: "45" },
        {
          children: r.jsxs(
            "g",
            Object.assign(
              {
                style: {
                  fill: "#000000",
                  stroke: "#000000",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                },
              },
              {
                children: [
                  r.jsx("path", {
                    d: "M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z",
                    style: { strokeLinecap: "butt", fill: "#000000" },
                  }),
                  r.jsx("path", {
                    d: "m 9,26 c 0,2 1.5,2 2.5,4 1,1.5 1,1 0.5,3.5 -1.5,1 -1,2.5 -1,2.5 -1.5,1.5 0,2.5 0,2.5 6.5,1 16.5,1 23,0 0,0 1.5,-1 0,-2.5 0,0 0.5,-1.5 -1,-2.5 -0.5,-2.5 -0.5,-2 0.5,-3.5 1,-2 2.5,-2 2.5,-4 -8.5,-1.5 -18.5,-1.5 -27,0 z",
                  }),
                  r.jsx("path", { d: "M 11.5,30 C 15,29 30,29 33.5,30" }),
                  r.jsx("path", { d: "m 12,33.5 c 6,-1 15,-1 21,0" }),
                  r.jsx("circle", { cx: "6", cy: "12", r: "2" }),
                  r.jsx("circle", { cx: "14", cy: "9", r: "2" }),
                  r.jsx("circle", { cx: "22.5", cy: "8", r: "2" }),
                  r.jsx("circle", { cx: "31", cy: "9", r: "2" }),
                  r.jsx("circle", { cx: "39", cy: "12", r: "2" }),
                  r.jsx("path", {
                    d: "M 11,38.5 A 35,35 1 0 0 34,38.5",
                    style: { fill: "none", stroke: "#000000", strokeLinecap: "butt" },
                  }),
                  r.jsxs(
                    "g",
                    Object.assign(
                      { style: { fill: "none", stroke: "#ffffff" } },
                      {
                        children: [
                          r.jsx("path", { d: "M 11,29 A 35,35 1 0 1 34,29" }),
                          r.jsx("path", { d: "M 12.5,31.5 L 32.5,31.5" }),
                          r.jsx("path", { d: "M 11.5,34.5 A 35,35 1 0 0 33.5,34.5" }),
                          r.jsx("path", { d: "M 10.5,37.5 A 35,35 1 0 0 34.5,37.5" }),
                        ],
                      },
                    ),
                  ),
                ],
              },
            ),
          ),
        },
      ),
    ),
    bK: r.jsx(
      "svg",
      Object.assign(
        { xmlns: "http://www.w3.org/2000/svg", version: "1.1", width: "45", height: "45" },
        {
          children: r.jsxs(
            "g",
            Object.assign(
              {
                style: {
                  fill: "none",
                  fillOpacity: "1",
                  fillRule: "evenodd",
                  stroke: "#000000",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeMiterlimit: "4",
                  strokeDasharray: "none",
                  strokeOpacity: "1",
                },
              },
              {
                children: [
                  r.jsx("path", {
                    d: "M 22.5,11.63 L 22.5,6",
                    style: { fill: "none", stroke: "#000000", strokeLinejoin: "miter" },
                    id: "path6570",
                  }),
                  r.jsx("path", {
                    d: "M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25",
                    style: {
                      fill: "#000000",
                      fillOpacity: "1",
                      strokeLinecap: "butt",
                      strokeLinejoin: "miter",
                    },
                  }),
                  r.jsx("path", {
                    d: "M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37",
                    style: { fill: "#000000", stroke: "#000000" },
                  }),
                  r.jsx("path", {
                    d: "M 20,8 L 25,8",
                    style: { fill: "none", stroke: "#000000", strokeLinejoin: "miter" },
                  }),
                  r.jsx("path", {
                    d: "M 32,29.5 C 32,29.5 40.5,25.5 38.03,19.85 C 34.15,14 25,18 22.5,24.5 L 22.5,26.6 L 22.5,24.5 C 20,18 10.85,14 6.97,19.85 C 4.5,25.5 13,29.5 13,29.5",
                    style: { fill: "none", stroke: "#ffffff" },
                  }),
                  r.jsx("path", {
                    d: "M 12.5,30 C 18,27 27,27 32.5,30 M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5 M 12.5,37 C 18,34 27,34 32.5,37",
                    style: { fill: "none", stroke: "#ffffff" },
                  }),
                ],
              },
            ),
          ),
        },
      ),
    ),
  };
function zn(n, e, t) {
  const i = e / 8,
    a = n === "white" ? zc : _c,
    c = n === "white" ? Fc : jc,
    s = a[t[0]] * i + i / 2,
    o = c[parseInt(t[1], 10) - 1] * i + i / 2;
  return { x: s, y: o };
}
function Di(n) {
  let e = !1;
  return (
    Object.keys(rn).forEach((t) => {
      n[t] !== rn[t] && (e = !0);
    }),
    Object.keys(n).forEach((t) => {
      rn[t] !== n[t] && (e = !0);
    }),
    e
  );
}
function Hc(n, e) {
  const t = { removed: {}, added: {} };
  return (
    Object.keys(n).forEach((i) => {
      e[i] !== n[i] && (t.removed[i] = n[i]);
    }),
    Object.keys(e).forEach((i) => {
      n[i] !== e[i] && (t.added[i] = e[i]);
    }),
    t
  );
}
function pi(n) {
  return n === "start" ? rn : typeof n == "string" ? $c(n) : n;
}
function $c(n) {
  if (!Wc(n)) return {};
  n = n.replace(/ .+$/, "");
  const e = n.split("/"),
    t = {};
  let i = 8;
  for (let a = 0; a < 8; a++) {
    const c = e[a].split("");
    let s = 0;
    for (let o = 0; o < c.length; o++)
      if (c[o].search(/[1-8]/) !== -1) {
        const d = parseInt(c[o], 10);
        s = s + d;
      } else {
        const d = Ut[s] + i;
        ((t[d] = Uc(c[o])), (s = s + 1));
      }
    i = i - 1;
  }
  return t;
}
function Wc(n) {
  ((n = n.replace(/ .+$/, "")), (n = qc(n)));
  const e = n.split("/");
  if (e.length !== 8) return !1;
  for (let t = 0; t < 8; t++)
    if (e[t].length !== 8 || e[t].search(/[^kqrnbpKQRNBP1]/) !== -1) return !1;
  return !0;
}
function qc(n) {
  return n
    .replace(/8/g, "11111111")
    .replace(/7/g, "1111111")
    .replace(/6/g, "111111")
    .replace(/5/g, "11111")
    .replace(/4/g, "1111")
    .replace(/3/g, "111")
    .replace(/2/g, "11");
}
function Uc(n) {
  return n.toLowerCase() === n ? "b" + n.toUpperCase() : "w" + n.toUpperCase();
}
const Zc = (n, e = !0, t, i) => {
    const [a, c] = h.useState([]),
      [s, o] = h.useState([]),
      [d, N] = h.useState();
    (h.useEffect(() => {
      Array.isArray(n) && (l(), c(n?.filter((b) => b[0] !== b[1])));
    }, [n]),
      h.useEffect(() => {
        t?.(s);
      }, [s]));
    function l() {
      (o([]), N(void 0));
    }
    const u = (b, p) => {
        e && N([b, p, i]);
      },
      f = [...s, ...a];
    return {
      arrows: f,
      newArrow: d,
      clearArrows: l,
      drawNewArrow: u,
      setArrows: o,
      onArrowDrawEnd: (b, p) => {
        if (b === p || !e) return;
        let V;
        const G = [b, p, i];
        (f.every(([Q, _]) => !(Q === b && _ === p))
          ? (V = [...s, G])
          : (V = s.filter(([Q, _]) => !(Q === b && _ === p))),
          N(void 0),
          o(V));
      },
    };
  },
  Na = h.createContext({}),
  Ze = () => h.useContext(Na),
  Yc = h.forwardRef(
    (
      {
        allowDragOutsideBoard: n = !0,
        animationDuration: e = 300,
        areArrowsAllowed: t = !0,
        arePiecesDraggable: i = !0,
        arePremovesAllowed: a = !1,
        autoPromoteToQueen: c = !1,
        boardOrientation: s = "white",
        boardWidth: o,
        children: d,
        clearPremovesOnRightClick: N = !0,
        customArrows: l,
        customArrowColor: u = "rgb(255,170,0)",
        customBoardStyle: f,
        customNotationStyle: B,
        customDarkSquareStyle: b = { backgroundColor: "#B58863" },
        customDropSquareStyle: p = { boxShadow: "inset 0 0 1px 6px rgba(255,255,255,0.75)" },
        customLightSquareStyle: V = { backgroundColor: "#F0D9B5" },
        customPieces: G,
        customPremoveDarkSquareStyle: A = { backgroundColor: "#A42323" },
        customPremoveLightSquareStyle: Q = { backgroundColor: "#BD2828" },
        customSquare: _ = "div",
        customSquareStyles: z,
        dropOffBoardAction: j = "snapback",
        id: De = 0,
        isDraggablePiece: oe = () => !0,
        getPositionObject: fe = () => {},
        onArrowsChange: ie = () => {},
        onDragOverSquare: ue = () => {},
        onMouseOutSquare: Z = () => {},
        onMouseOverSquare: J = () => {},
        onPieceClick: de = () => {},
        onPieceDragBegin: $ = () => {},
        onPieceDragEnd: ge = () => {},
        onPieceDrop: ae = () => !0,
        onPieceDropOffBoard: K = () => {},
        onPromotionCheck: pe = (ce, be, _e) =>
          ((_e === "wP" && ce[1] === "7" && be[1] === "8") ||
            (_e === "bP" && ce[1] === "2" && be[1] === "1")) &&
          Math.abs(ce.charCodeAt(0) - be.charCodeAt(0)) <= 1,
        onPromotionPieceSelect: H = () => !0,
        onSparePieceDrop: X = () => !0,
        onSquareClick: ye = () => {},
        onSquareRightClick: F = () => {},
        position: S = "start",
        promotionDialogVariant: E = "default",
        promotionToSquare: ee = null,
        showBoardNotation: v = !0,
        showPromotionDialog: W = !1,
        snapToCursor: te = !0,
      },
      Se,
    ) => {
      const [ce, be] = h.useState(pi(S)),
        [_e, pt] = h.useState({ removed: {}, added: {} }),
        [ze, Fe] = h.useState(void 0),
        [wt, qe] = h.useState(W && !c),
        [Et, Ot] = h.useState(null),
        [Qt, lt] = h.useState(ee),
        [Ye, Je] = h.useState([]),
        Re = h.useRef(Ye),
        [gt, Ue] = h.useState(),
        [Rt, Pt] = h.useState(Object.assign(Object.assign({}, xi), G)),
        [Lt, Xe] = h.useState(!1),
        et = h.useRef(),
        [tt, nt] = h.useState(!1),
        [Kt, je] = h.useState(null);
      (h.useImperativeHandle(Se, () => ({
        clearPremoves(q = !0) {
          Vt(q);
        },
      })),
        h.useEffect(() => {
          Pt(Object.assign(Object.assign({}, xi), G));
        }, [G]),
        h.useEffect(() => {
          (qe(W), lt(ee));
        }, [ee, W]),
        h.useEffect(() => {
          var q, O, me;
          It();
          const I = pi(S),
            he = Hc(ce, I),
            we =
              ((q = Object.keys(he.added)) === null || q === void 0 ? void 0 : q.length) <= 2
                ? (me = (O = Object.entries(he.added)) === null || O === void 0 ? void 0 : O[0]) ===
                    null || me === void 0
                  ? void 0
                  : me[1][0]
                : void 0;
          if (tt) (be(I), nt(!1), a && Mt(we), et.current && clearTimeout(et.current));
          else if (Lt) (be(I), nt(!1), a && Mt(we));
          else {
            (Di(I) && ze !== void 0 ? Fe(we) : Di(I) ? Fe(void 0) : Fe("b"), pt(he), nt(!0));
            const Ae = setTimeout(() => {
              (be(I), nt(!1), a && Mt(we));
            }, e);
            et.current = Ae;
          }
          return (
            Xe(!1),
            fe(I),
            ne(),
            () => {
              clearTimeout(et.current);
            }
          );
        }, [S]));
      const {
        arrows: P,
        newArrow: Y,
        clearArrows: ne,
        drawNewArrow: ht,
        onArrowDrawEnd: Ne,
      } = Zc(l, t, ie, u);
      function it(q, O, me, I) {
        if (q === O) return;
        if (
          (ne(),
          (a && tt) ||
            (a && (ze === me[0] || Re.current.filter((we) => we.piece[0] === me[0]).length > 0)))
        ) {
          const we = [...Re.current];
          (we.push({ sourceSq: q, targetSq: O, piece: me }), (Re.current = we), Je([...we]), It());
          return;
        }
        if (!a && tt) return;
        const he = Object.assign({}, ce);
        (Xe(!!I),
          Fe(me[0]),
          ae.length ? ae(q, O, me) || (Vt(), Xe(!1)) : (delete he[q], (he[O] = me), be(he)),
          It(),
          fe(he));
      }
      function Ct(q) {
        const O = Object.assign({}, ce);
        (delete O[q], be(O), fe(O));
      }
      function Mt(q) {
        if (Re.current.length === 0) return;
        const O = Re.current[0];
        if (O.piece[0] !== void 0 && O.piece[0] !== q && ae.length)
          if ((Fe(O.piece[0]), Xe(!0), ae(O.sourceSq, O.targetSq, O.piece))) {
            const I = [...Re.current];
            (I.shift(), (Re.current = I), Je([...I]));
          } else Vt();
      }
      function mn(q, O) {
        if (!X(q, O)) return;
        const I = Object.assign({}, ce);
        ((I[O] = q), be(I), fe(I));
      }
      function Vt(q = !0) {
        (q && Fe(void 0), (Re.current = []), Je([]));
      }
      function It() {
        (Ot(null), lt(null), qe(!1));
      }
      function xn(q) {
        Ue(q);
      }
      function m(q) {
        if (gt) {
          if (gt === q) {
            (Ue(void 0), N && Vt(!1), F(q));
            return;
          }
        } else Ue(void 0);
      }
      function at() {
        Ue(void 0);
      }
      const ke = {
        allowDragOutsideBoard: n,
        animationDuration: e,
        arePiecesDraggable: i,
        arePremovesAllowed: a,
        arrows: P,
        autoPromoteToQueen: c,
        boardOrientation: s,
        boardWidth: o,
        chessPieces: Rt,
        clearArrows: ne,
        clearCurrentRightClickDown: at,
        currentPosition: ce,
        currentRightClickDown: gt,
        customArrowColor: u,
        customBoardStyle: f,
        customDarkSquareStyle: b,
        customDropSquareStyle: p,
        customLightSquareStyle: V,
        customNotationStyle: B,
        customPremoveDarkSquareStyle: A,
        customPremoveLightSquareStyle: Q,
        customSquare: _,
        customSquareStyles: z,
        deletePieceFromSquare: Ct,
        drawNewArrow: ht,
        dropOffBoardAction: j,
        handleSetPosition: it,
        handleSparePieceDrop: mn,
        id: De,
        isDraggablePiece: oe,
        isWaitingForAnimation: tt,
        lastPieceColour: ze,
        lastSquareDraggedOver: Kt,
        newArrow: Y,
        onArrowDrawEnd: Ne,
        onDragOverSquare: ue,
        onMouseOutSquare: Z,
        onMouseOverSquare: J,
        onPieceClick: de,
        onPieceDragBegin: $,
        onPieceDragEnd: ge,
        onPieceDrop: ae,
        onPieceDropOffBoard: K,
        onPromotionCheck: pe,
        onPromotionPieceSelect: H,
        onRightClickDown: xn,
        onRightClickUp: m,
        onSparePieceDrop: X,
        onSquareClick: ye,
        positionDifferences: _e,
        premoves: Ye,
        promoteFromSquare: Et,
        promoteToSquare: Qt,
        promotionDialogVariant: E,
        setLastSquareDraggedOver: je,
        setPromoteFromSquare: Ot,
        setPromoteToSquare: lt,
        setShowPromoteDialog: qe,
        showBoardNotation: v,
        showPromoteDialog: wt,
        snapToCursor: te,
      };
      return r.jsx(Na.Provider, Object.assign({ value: ke }, { children: d }));
    },
  );
function Jc({ row: n, col: e }) {
  const {
      boardOrientation: t,
      boardWidth: i,
      customDarkSquareStyle: a,
      customLightSquareStyle: c,
      customNotationStyle: s,
    } = Ze(),
    o = c.backgroundColor,
    d = a.backgroundColor,
    N = e === 0,
    l = n === 7,
    u = N && l;
  function f() {
    return t === "white" ? 8 - n : n + 1;
  }
  function B() {
    return t === "black" ? Ut[7 - e] : Ut[e];
  }
  function b() {
    return r.jsxs(r.Fragment, {
      children: [
        r.jsx(
          "div",
          Object.assign(
            {
              style: Object.assign(
                Object.assign({ zIndex: 3, position: "absolute" }, { color: o }),
                Ci(i, s),
              ),
            },
            { children: f() },
          ),
        ),
        r.jsx(
          "div",
          Object.assign(
            {
              style: Object.assign(
                Object.assign({ zIndex: 3, position: "absolute" }, { color: o }),
                Oi(i, s),
              ),
            },
            { children: B() },
          ),
        ),
      ],
    });
  }
  function p() {
    return r.jsx(
      "div",
      Object.assign(
        {
          style: Object.assign(
            Object.assign(
              { userSelect: "none", zIndex: 3, position: "absolute" },
              { color: e % 2 !== 0 ? d : o },
            ),
            Oi(i, s),
          ),
        },
        { children: B() },
      ),
    );
  }
  function V() {
    return r.jsx(
      "div",
      Object.assign(
        {
          style: Object.assign(
            Object.assign(
              { userSelect: "none", zIndex: 3, position: "absolute" },
              t === "black" ? { color: n % 2 === 0 ? d : o } : { color: n % 2 === 0 ? d : o },
            ),
            Ci(i, s),
          ),
        },
        { children: f() },
      ),
    );
  }
  return u ? b() : l ? p() : N ? V() : null;
}
const Oi = (n, e) =>
    Object.assign({ alignSelf: "flex-end", paddingLeft: n / 8 - n / 48, fontSize: n / 48 }, e),
  Ci = (n, e) =>
    Object.assign({ alignSelf: "flex-start", paddingRight: n / 8 - n / 48, fontSize: n / 48 }, e),
  la = h.createContext({ dragDropManager: void 0 });
function Ke(n) {
  return (
    "Minified Redux error #" +
    n +
    "; visit https://redux.js.org/Errors?code=" +
    n +
    " for the full message or use the non-minified dev environment for full errors. "
  );
}
var Vi = (function () {
    return (typeof Symbol == "function" && Symbol.observable) || "@@observable";
  })(),
  Si = function () {
    return Math.random().toString(36).substring(7).split("").join(".");
  },
  vi = { INIT: "@@redux/INIT" + Si(), REPLACE: "@@redux/REPLACE" + Si() };
function Xc(n) {
  if (typeof n != "object" || n === null) return !1;
  for (var e = n; Object.getPrototypeOf(e) !== null;) e = Object.getPrototypeOf(e);
  return Object.getPrototypeOf(n) === e;
}
function ga(n, e, t) {
  var i;
  if (
    (typeof e == "function" && typeof t == "function") ||
    (typeof t == "function" && typeof arguments[3] == "function")
  )
    throw new Error(Ke(0));
  if ((typeof e == "function" && typeof t > "u" && ((t = e), (e = void 0)), typeof t < "u")) {
    if (typeof t != "function") throw new Error(Ke(1));
    return t(ga)(n, e);
  }
  if (typeof n != "function") throw new Error(Ke(2));
  var a = n,
    c = e,
    s = [],
    o = s,
    d = !1;
  function N() {
    o === s && (o = s.slice());
  }
  function l() {
    if (d) throw new Error(Ke(3));
    return c;
  }
  function u(p) {
    if (typeof p != "function") throw new Error(Ke(4));
    if (d) throw new Error(Ke(5));
    var V = !0;
    return (
      N(),
      o.push(p),
      function () {
        if (V) {
          if (d) throw new Error(Ke(6));
          ((V = !1), N());
          var A = o.indexOf(p);
          (o.splice(A, 1), (s = null));
        }
      }
    );
  }
  function f(p) {
    if (!Xc(p)) throw new Error(Ke(7));
    if (typeof p.type > "u") throw new Error(Ke(8));
    if (d) throw new Error(Ke(9));
    try {
      ((d = !0), (c = a(c, p)));
    } finally {
      d = !1;
    }
    for (var V = (s = o), G = 0; G < V.length; G++) {
      var A = V[G];
      A();
    }
    return p;
  }
  function B(p) {
    if (typeof p != "function") throw new Error(Ke(10));
    ((a = p), f({ type: vi.REPLACE }));
  }
  function b() {
    var p,
      V = u;
    return (
      (p = {
        subscribe: function (A) {
          if (typeof A != "object" || A === null) throw new Error(Ke(11));
          function Q() {
            A.next && A.next(l());
          }
          Q();
          var _ = V(Q);
          return { unsubscribe: _ };
        },
      }),
      (p[Vi] = function () {
        return this;
      }),
      p
    );
  }
  return (
    f({ type: vi.INIT }),
    (i = { dispatch: f, subscribe: u, getState: l, replaceReducer: B }),
    (i[Vi] = b),
    i
  );
}
function M(n, e, ...t) {
  if (er() && e === void 0) throw new Error("invariant requires an error message argument");
  if (!n) {
    let i;
    if (e === void 0)
      i = new Error(
        "Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.",
      );
    else {
      let a = 0;
      ((i = new Error(
        e.replace(/%s/g, function () {
          return t[a++];
        }),
      )),
        (i.name = "Invariant Violation"));
    }
    throw ((i.framesToPop = 1), i);
  }
}
function er() {
  return typeof process < "u" && !0;
}
function tr(n, e, t) {
  return e.split(".").reduce((i, a) => (i && i[a] ? i[a] : t || null), n);
}
function nr(n, e) {
  return n.filter((t) => t !== e);
}
function ha(n) {
  return typeof n == "object";
}
function ir(n, e) {
  const t = new Map(),
    i = (c) => {
      t.set(c, t.has(c) ? t.get(c) + 1 : 1);
    };
  (n.forEach(i), e.forEach(i));
  const a = [];
  return (
    t.forEach((c, s) => {
      c === 1 && a.push(s);
    }),
    a
  );
}
function ar(n, e) {
  return n.filter((t) => e.indexOf(t) > -1);
}
const Zn = "dnd-core/INIT_COORDS",
  ln = "dnd-core/BEGIN_DRAG",
  Yn = "dnd-core/PUBLISH_DRAG_SOURCE",
  gn = "dnd-core/HOVER",
  hn = "dnd-core/DROP",
  Bn = "dnd-core/END_DRAG";
function Ai(n, e) {
  return { type: Zn, payload: { sourceClientOffset: e || null, clientOffset: n || null } };
}
const cr = { type: Zn, payload: { clientOffset: null, sourceClientOffset: null } };
function rr(n) {
  return function (t = [], i = { publishSource: !0 }) {
    const { publishSource: a = !0, clientOffset: c, getSourceClientOffset: s } = i,
      o = n.getMonitor(),
      d = n.getRegistry();
    (n.dispatch(Ai(c)), sr(t, o, d));
    const N = fr(t, o);
    if (N == null) {
      n.dispatch(cr);
      return;
    }
    let l = null;
    if (c) {
      if (!s) throw new Error("getSourceClientOffset must be defined");
      (or(s), (l = s(N)));
    }
    n.dispatch(Ai(c, l));
    const f = d.getSource(N).beginDrag(o, N);
    if (f == null) return;
    (dr(f), d.pinSource(N));
    const B = d.getSourceType(N);
    return {
      type: ln,
      payload: {
        itemType: B,
        item: f,
        sourceId: N,
        clientOffset: c || null,
        sourceClientOffset: l || null,
        isSourcePublic: !!a,
      },
    };
  };
}
function sr(n, e, t) {
  (M(!e.isDragging(), "Cannot call beginDrag while dragging."),
    n.forEach(function (i) {
      M(t.getSource(i), "Expected sourceIds to be registered.");
    }));
}
function or(n) {
  M(
    typeof n == "function",
    "When clientOffset is provided, getSourceClientOffset must be a function.",
  );
}
function dr(n) {
  M(ha(n), "Item must be an object.");
}
function fr(n, e) {
  let t = null;
  for (let i = n.length - 1; i >= 0; i--)
    if (e.canDragSource(n[i])) {
      t = n[i];
      break;
    }
  return t;
}
function Nr(n, e, t) {
  return (
    e in n
      ? Object.defineProperty(n, e, { value: t, enumerable: !0, configurable: !0, writable: !0 })
      : (n[e] = t),
    n
  );
}
function lr(n) {
  for (var e = 1; e < arguments.length; e++) {
    var t = arguments[e] != null ? arguments[e] : {},
      i = Object.keys(t);
    (typeof Object.getOwnPropertySymbols == "function" &&
      (i = i.concat(
        Object.getOwnPropertySymbols(t).filter(function (a) {
          return Object.getOwnPropertyDescriptor(t, a).enumerable;
        }),
      )),
      i.forEach(function (a) {
        Nr(n, a, t[a]);
      }));
  }
  return n;
}
function gr(n) {
  return function (t = {}) {
    const i = n.getMonitor(),
      a = n.getRegistry();
    (hr(i),
      br(i).forEach((s, o) => {
        const d = Br(s, o, a, i),
          N = { type: hn, payload: { dropResult: lr({}, t, d) } };
        n.dispatch(N);
      }));
  };
}
function hr(n) {
  (M(n.isDragging(), "Cannot call drop while not dragging."),
    M(!n.didDrop(), "Cannot call drop twice during one drag operation."));
}
function Br(n, e, t, i) {
  const a = t.getTarget(n);
  let c = a ? a.drop(i, n) : void 0;
  return (ur(c), typeof c > "u" && (c = e === 0 ? {} : i.getDropResult()), c);
}
function ur(n) {
  M(typeof n > "u" || ha(n), "Drop result must either be an object or undefined.");
}
function br(n) {
  const e = n.getTargetIds().filter(n.canDropOnTarget, n);
  return (e.reverse(), e);
}
function mr(n) {
  return function () {
    const t = n.getMonitor(),
      i = n.getRegistry();
    xr(t);
    const a = t.getSourceId();
    return (a != null && (i.getSource(a, !0).endDrag(t, a), i.unpinSource()), { type: Bn });
  };
}
function xr(n) {
  M(n.isDragging(), "Cannot call endDrag while not dragging.");
}
function _n(n, e) {
  return e === null ? n === null : Array.isArray(n) ? n.some((t) => t === e) : n === e;
}
function Dr(n) {
  return function (t, { clientOffset: i } = {}) {
    pr(t);
    const a = t.slice(0),
      c = n.getMonitor(),
      s = n.getRegistry(),
      o = c.getItemType();
    return (
      Cr(a, s, o),
      Or(a, c, s),
      Vr(a, c, s),
      { type: gn, payload: { targetIds: a, clientOffset: i || null } }
    );
  };
}
function pr(n) {
  M(Array.isArray(n), "Expected targetIds to be an array.");
}
function Or(n, e, t) {
  (M(e.isDragging(), "Cannot call hover while not dragging."),
    M(!e.didDrop(), "Cannot call hover after drop."));
  for (let i = 0; i < n.length; i++) {
    const a = n[i];
    M(n.lastIndexOf(a) === i, "Expected targetIds to be unique in the passed array.");
    const c = t.getTarget(a);
    M(c, "Expected targetIds to be registered.");
  }
}
function Cr(n, e, t) {
  for (let i = n.length - 1; i >= 0; i--) {
    const a = n[i],
      c = e.getTargetType(a);
    _n(c, t) || n.splice(i, 1);
  }
}
function Vr(n, e, t) {
  n.forEach(function (i) {
    t.getTarget(i).hover(e, i);
  });
}
function Sr(n) {
  return function () {
    if (n.getMonitor().isDragging()) return { type: Yn };
  };
}
function vr(n) {
  return { beginDrag: rr(n), publishDragSource: Sr(n), hover: Dr(n), drop: gr(n), endDrag: mr(n) };
}
class Ar {
  receiveBackend(e) {
    this.backend = e;
  }
  getMonitor() {
    return this.monitor;
  }
  getBackend() {
    return this.backend;
  }
  getRegistry() {
    return this.monitor.registry;
  }
  getActions() {
    const e = this,
      { dispatch: t } = this.store;
    function i(c) {
      return (...s) => {
        const o = c.apply(e, s);
        typeof o < "u" && t(o);
      };
    }
    const a = vr(this);
    return Object.keys(a).reduce((c, s) => {
      const o = a[s];
      return ((c[s] = i(o)), c);
    }, {});
  }
  dispatch(e) {
    this.store.dispatch(e);
  }
  constructor(e, t) {
    ((this.isSetUp = !1),
      (this.handleRefCountChange = () => {
        const i = this.store.getState().refCount > 0;
        this.backend &&
          (i && !this.isSetUp
            ? (this.backend.setup(), (this.isSetUp = !0))
            : !i && this.isSetUp && (this.backend.teardown(), (this.isSetUp = !1)));
      }),
      (this.store = e),
      (this.monitor = t),
      e.subscribe(this.handleRefCountChange));
  }
}
function Gr(n, e) {
  return { x: n.x + e.x, y: n.y + e.y };
}
function Ba(n, e) {
  return { x: n.x - e.x, y: n.y - e.y };
}
function yr(n) {
  const { clientOffset: e, initialClientOffset: t, initialSourceClientOffset: i } = n;
  return !e || !t || !i ? null : Ba(Gr(e, i), t);
}
function kr(n) {
  const { clientOffset: e, initialClientOffset: t } = n;
  return !e || !t ? null : Ba(e, t);
}
const jt = [],
  Jn = [];
jt.__IS_NONE__ = !0;
Jn.__IS_ALL__ = !0;
function wr(n, e) {
  return n === jt ? !1 : n === Jn || typeof e > "u" ? !0 : ar(e, n).length > 0;
}
class Er {
  subscribeToStateChange(e, t = {}) {
    const { handlerIds: i } = t;
    (M(typeof e == "function", "listener must be a function."),
      M(
        typeof i > "u" || Array.isArray(i),
        "handlerIds, when specified, must be an array of strings.",
      ));
    let a = this.store.getState().stateId;
    const c = () => {
      const s = this.store.getState(),
        o = s.stateId;
      try {
        o === a || (o === a + 1 && !wr(s.dirtyHandlerIds, i)) || e();
      } finally {
        a = o;
      }
    };
    return this.store.subscribe(c);
  }
  subscribeToOffsetChange(e) {
    M(typeof e == "function", "listener must be a function.");
    let t = this.store.getState().dragOffset;
    const i = () => {
      const a = this.store.getState().dragOffset;
      a !== t && ((t = a), e());
    };
    return this.store.subscribe(i);
  }
  canDragSource(e) {
    if (!e) return !1;
    const t = this.registry.getSource(e);
    return (
      M(t, `Expected to find a valid source. sourceId=${e}`),
      this.isDragging() ? !1 : t.canDrag(this, e)
    );
  }
  canDropOnTarget(e) {
    if (!e) return !1;
    const t = this.registry.getTarget(e);
    if (
      (M(t, `Expected to find a valid target. targetId=${e}`), !this.isDragging() || this.didDrop())
    )
      return !1;
    const i = this.registry.getTargetType(e),
      a = this.getItemType();
    return _n(i, a) && t.canDrop(this, e);
  }
  isDragging() {
    return !!this.getItemType();
  }
  isDraggingSource(e) {
    if (!e) return !1;
    const t = this.registry.getSource(e, !0);
    if (
      (M(t, `Expected to find a valid source. sourceId=${e}`),
      !this.isDragging() || !this.isSourcePublic())
    )
      return !1;
    const i = this.registry.getSourceType(e),
      a = this.getItemType();
    return i !== a ? !1 : t.isDragging(this, e);
  }
  isOverTarget(e, t = { shallow: !1 }) {
    if (!e) return !1;
    const { shallow: i } = t;
    if (!this.isDragging()) return !1;
    const a = this.registry.getTargetType(e),
      c = this.getItemType();
    if (c && !_n(a, c)) return !1;
    const s = this.getTargetIds();
    if (!s.length) return !1;
    const o = s.indexOf(e);
    return i ? o === s.length - 1 : o > -1;
  }
  getItemType() {
    return this.store.getState().dragOperation.itemType;
  }
  getItem() {
    return this.store.getState().dragOperation.item;
  }
  getSourceId() {
    return this.store.getState().dragOperation.sourceId;
  }
  getTargetIds() {
    return this.store.getState().dragOperation.targetIds;
  }
  getDropResult() {
    return this.store.getState().dragOperation.dropResult;
  }
  didDrop() {
    return this.store.getState().dragOperation.didDrop;
  }
  isSourcePublic() {
    return !!this.store.getState().dragOperation.isSourcePublic;
  }
  getInitialClientOffset() {
    return this.store.getState().dragOffset.initialClientOffset;
  }
  getInitialSourceClientOffset() {
    return this.store.getState().dragOffset.initialSourceClientOffset;
  }
  getClientOffset() {
    return this.store.getState().dragOffset.clientOffset;
  }
  getSourceClientOffset() {
    return yr(this.store.getState().dragOffset);
  }
  getDifferenceFromInitialOffset() {
    return kr(this.store.getState().dragOffset);
  }
  constructor(e, t) {
    ((this.store = e), (this.registry = t));
  }
}
const Gi = typeof global < "u" ? global : self,
  ua = Gi.MutationObserver || Gi.WebKitMutationObserver;
function ba(n) {
  return function () {
    const t = setTimeout(a, 0),
      i = setInterval(a, 50);
    function a() {
      (clearTimeout(t), clearInterval(i), n());
    }
  };
}
function Qr(n) {
  let e = 1;
  const t = new ua(n),
    i = document.createTextNode("");
  return (
    t.observe(i, { characterData: !0 }),
    function () {
      ((e = -e), (i.data = e));
    }
  );
}
const Rr = typeof ua == "function" ? Qr : ba;
class Pr {
  enqueueTask(e) {
    const { queue: t, requestFlush: i } = this;
    (t.length || (i(), (this.flushing = !0)), (t[t.length] = e));
  }
  constructor() {
    ((this.queue = []),
      (this.pendingErrors = []),
      (this.flushing = !1),
      (this.index = 0),
      (this.capacity = 1024),
      (this.flush = () => {
        const { queue: e } = this;
        for (; this.index < e.length;) {
          const t = this.index;
          if ((this.index++, e[t].call(), this.index > this.capacity)) {
            for (let i = 0, a = e.length - this.index; i < a; i++) e[i] = e[i + this.index];
            ((e.length -= this.index), (this.index = 0));
          }
        }
        ((e.length = 0), (this.index = 0), (this.flushing = !1));
      }),
      (this.registerPendingError = (e) => {
        (this.pendingErrors.push(e), this.requestErrorThrow());
      }),
      (this.requestFlush = Rr(this.flush)),
      (this.requestErrorThrow = ba(() => {
        if (this.pendingErrors.length) throw this.pendingErrors.shift();
      })));
  }
}
class Lr {
  call() {
    try {
      this.task && this.task();
    } catch (e) {
      this.onError(e);
    } finally {
      ((this.task = null), this.release(this));
    }
  }
  constructor(e, t) {
    ((this.onError = e), (this.release = t), (this.task = null));
  }
}
class Kr {
  create(e) {
    const t = this.freeTasks,
      i = t.length ? t.pop() : new Lr(this.onError, (a) => (t[t.length] = a));
    return ((i.task = e), i);
  }
  constructor(e) {
    ((this.onError = e), (this.freeTasks = []));
  }
}
const ma = new Pr(),
  Mr = new Kr(ma.registerPendingError);
function Ir(n) {
  ma.enqueueTask(Mr.create(n));
}
const Xn = "dnd-core/ADD_SOURCE",
  ei = "dnd-core/ADD_TARGET",
  ti = "dnd-core/REMOVE_SOURCE",
  un = "dnd-core/REMOVE_TARGET";
function Tr(n) {
  return { type: Xn, payload: { sourceId: n } };
}
function zr(n) {
  return { type: ei, payload: { targetId: n } };
}
function _r(n) {
  return { type: ti, payload: { sourceId: n } };
}
function Fr(n) {
  return { type: un, payload: { targetId: n } };
}
function jr(n) {
  (M(typeof n.canDrag == "function", "Expected canDrag to be a function."),
    M(typeof n.beginDrag == "function", "Expected beginDrag to be a function."),
    M(typeof n.endDrag == "function", "Expected endDrag to be a function."));
}
function Hr(n) {
  (M(typeof n.canDrop == "function", "Expected canDrop to be a function."),
    M(typeof n.hover == "function", "Expected hover to be a function."),
    M(typeof n.drop == "function", "Expected beginDrag to be a function."));
}
function Fn(n, e) {
  if (e && Array.isArray(n)) {
    n.forEach((t) => Fn(t, !1));
    return;
  }
  M(
    typeof n == "string" || typeof n == "symbol",
    e
      ? "Type can only be a string, a symbol, or an array of either."
      : "Type can only be a string or a symbol.",
  );
}
var Me;
(function (n) {
  ((n.SOURCE = "SOURCE"), (n.TARGET = "TARGET"));
})(Me || (Me = {}));
let $r = 0;
function Wr() {
  return $r++;
}
function qr(n) {
  const e = Wr().toString();
  switch (n) {
    case Me.SOURCE:
      return `S${e}`;
    case Me.TARGET:
      return `T${e}`;
    default:
      throw new Error(`Unknown Handler Role: ${n}`);
  }
}
function yi(n) {
  switch (n[0]) {
    case "S":
      return Me.SOURCE;
    case "T":
      return Me.TARGET;
    default:
      throw new Error(`Cannot parse handler ID: ${n}`);
  }
}
function ki(n, e) {
  const t = n.entries();
  let i = !1;
  do {
    const {
      done: a,
      value: [, c],
    } = t.next();
    if (c === e) return !0;
    i = !!a;
  } while (!i);
  return !1;
}
class Ur {
  addSource(e, t) {
    (Fn(e), jr(t));
    const i = this.addHandler(Me.SOURCE, e, t);
    return (this.store.dispatch(Tr(i)), i);
  }
  addTarget(e, t) {
    (Fn(e, !0), Hr(t));
    const i = this.addHandler(Me.TARGET, e, t);
    return (this.store.dispatch(zr(i)), i);
  }
  containsHandler(e) {
    return ki(this.dragSources, e) || ki(this.dropTargets, e);
  }
  getSource(e, t = !1) {
    return (
      M(this.isSourceId(e), "Expected a valid source ID."),
      t && e === this.pinnedSourceId ? this.pinnedSource : this.dragSources.get(e)
    );
  }
  getTarget(e) {
    return (M(this.isTargetId(e), "Expected a valid target ID."), this.dropTargets.get(e));
  }
  getSourceType(e) {
    return (M(this.isSourceId(e), "Expected a valid source ID."), this.types.get(e));
  }
  getTargetType(e) {
    return (M(this.isTargetId(e), "Expected a valid target ID."), this.types.get(e));
  }
  isSourceId(e) {
    return yi(e) === Me.SOURCE;
  }
  isTargetId(e) {
    return yi(e) === Me.TARGET;
  }
  removeSource(e) {
    (M(this.getSource(e), "Expected an existing source."),
      this.store.dispatch(_r(e)),
      Ir(() => {
        (this.dragSources.delete(e), this.types.delete(e));
      }));
  }
  removeTarget(e) {
    (M(this.getTarget(e), "Expected an existing target."),
      this.store.dispatch(Fr(e)),
      this.dropTargets.delete(e),
      this.types.delete(e));
  }
  pinSource(e) {
    const t = this.getSource(e);
    (M(t, "Expected an existing source."), (this.pinnedSourceId = e), (this.pinnedSource = t));
  }
  unpinSource() {
    (M(this.pinnedSource, "No source is pinned at the time."),
      (this.pinnedSourceId = null),
      (this.pinnedSource = null));
  }
  addHandler(e, t, i) {
    const a = qr(e);
    return (
      this.types.set(a, t),
      e === Me.SOURCE ? this.dragSources.set(a, i) : e === Me.TARGET && this.dropTargets.set(a, i),
      a
    );
  }
  constructor(e) {
    ((this.types = new Map()),
      (this.dragSources = new Map()),
      (this.dropTargets = new Map()),
      (this.pinnedSourceId = null),
      (this.pinnedSource = null),
      (this.store = e));
  }
}
const Zr = (n, e) => n === e;
function Yr(n, e) {
  return !n && !e ? !0 : !n || !e ? !1 : n.x === e.x && n.y === e.y;
}
function Jr(n, e, t = Zr) {
  if (n.length !== e.length) return !1;
  for (let i = 0; i < n.length; ++i) if (!t(n[i], e[i])) return !1;
  return !0;
}
function Xr(n = jt, e) {
  switch (e.type) {
    case gn:
      break;
    case Xn:
    case ei:
    case un:
    case ti:
      return jt;
    case ln:
    case Yn:
    case Bn:
    case hn:
    default:
      return Jn;
  }
  const { targetIds: t = [], prevTargetIds: i = [] } = e.payload,
    a = ir(t, i);
  if (!(a.length > 0 || !Jr(t, i))) return jt;
  const s = i[i.length - 1],
    o = t[t.length - 1];
  return (s !== o && (s && a.push(s), o && a.push(o)), a);
}
function es(n, e, t) {
  return (
    e in n
      ? Object.defineProperty(n, e, { value: t, enumerable: !0, configurable: !0, writable: !0 })
      : (n[e] = t),
    n
  );
}
function ts(n) {
  for (var e = 1; e < arguments.length; e++) {
    var t = arguments[e] != null ? arguments[e] : {},
      i = Object.keys(t);
    (typeof Object.getOwnPropertySymbols == "function" &&
      (i = i.concat(
        Object.getOwnPropertySymbols(t).filter(function (a) {
          return Object.getOwnPropertyDescriptor(t, a).enumerable;
        }),
      )),
      i.forEach(function (a) {
        es(n, a, t[a]);
      }));
  }
  return n;
}
const wi = { initialSourceClientOffset: null, initialClientOffset: null, clientOffset: null };
function ns(n = wi, e) {
  const { payload: t } = e;
  switch (e.type) {
    case Zn:
    case ln:
      return {
        initialSourceClientOffset: t.sourceClientOffset,
        initialClientOffset: t.clientOffset,
        clientOffset: t.clientOffset,
      };
    case gn:
      return Yr(n.clientOffset, t.clientOffset) ? n : ts({}, n, { clientOffset: t.clientOffset });
    case Bn:
    case hn:
      return wi;
    default:
      return n;
  }
}
function is(n, e, t) {
  return (
    e in n
      ? Object.defineProperty(n, e, { value: t, enumerable: !0, configurable: !0, writable: !0 })
      : (n[e] = t),
    n
  );
}
function vt(n) {
  for (var e = 1; e < arguments.length; e++) {
    var t = arguments[e] != null ? arguments[e] : {},
      i = Object.keys(t);
    (typeof Object.getOwnPropertySymbols == "function" &&
      (i = i.concat(
        Object.getOwnPropertySymbols(t).filter(function (a) {
          return Object.getOwnPropertyDescriptor(t, a).enumerable;
        }),
      )),
      i.forEach(function (a) {
        is(n, a, t[a]);
      }));
  }
  return n;
}
const as = {
  itemType: null,
  item: null,
  sourceId: null,
  targetIds: [],
  dropResult: null,
  didDrop: !1,
  isSourcePublic: null,
};
function cs(n = as, e) {
  const { payload: t } = e;
  switch (e.type) {
    case ln:
      return vt({}, n, {
        itemType: t.itemType,
        item: t.item,
        sourceId: t.sourceId,
        isSourcePublic: t.isSourcePublic,
        dropResult: null,
        didDrop: !1,
      });
    case Yn:
      return vt({}, n, { isSourcePublic: !0 });
    case gn:
      return vt({}, n, { targetIds: t.targetIds });
    case un:
      return n.targetIds.indexOf(t.targetId) === -1
        ? n
        : vt({}, n, { targetIds: nr(n.targetIds, t.targetId) });
    case hn:
      return vt({}, n, { dropResult: t.dropResult, didDrop: !0, targetIds: [] });
    case Bn:
      return vt({}, n, {
        itemType: null,
        item: null,
        sourceId: null,
        dropResult: null,
        didDrop: !1,
        isSourcePublic: null,
        targetIds: [],
      });
    default:
      return n;
  }
}
function rs(n = 0, e) {
  switch (e.type) {
    case Xn:
    case ei:
      return n + 1;
    case ti:
    case un:
      return n - 1;
    default:
      return n;
  }
}
function ss(n = 0) {
  return n + 1;
}
function os(n, e, t) {
  return (
    e in n
      ? Object.defineProperty(n, e, { value: t, enumerable: !0, configurable: !0, writable: !0 })
      : (n[e] = t),
    n
  );
}
function ds(n) {
  for (var e = 1; e < arguments.length; e++) {
    var t = arguments[e] != null ? arguments[e] : {},
      i = Object.keys(t);
    (typeof Object.getOwnPropertySymbols == "function" &&
      (i = i.concat(
        Object.getOwnPropertySymbols(t).filter(function (a) {
          return Object.getOwnPropertyDescriptor(t, a).enumerable;
        }),
      )),
      i.forEach(function (a) {
        os(n, a, t[a]);
      }));
  }
  return n;
}
function fs(n = {}, e) {
  return {
    dirtyHandlerIds: Xr(n.dirtyHandlerIds, {
      type: e.type,
      payload: ds({}, e.payload, { prevTargetIds: tr(n, "dragOperation.targetIds", []) }),
    }),
    dragOffset: ns(n.dragOffset, e),
    refCount: rs(n.refCount, e),
    dragOperation: cs(n.dragOperation, e),
    stateId: ss(n.stateId),
  };
}
function Ns(n, e = void 0, t = {}, i = !1) {
  const a = ls(i),
    c = new Er(a, new Ur(a)),
    s = new Ar(a, c),
    o = n(s, e, t);
  return (s.receiveBackend(o), s);
}
function ls(n) {
  const e = typeof window < "u" && window.__REDUX_DEVTOOLS_EXTENSION__;
  return ga(fs, n && e && e({ name: "dnd-core", instanceId: "dnd-core" }));
}
function gs(n, e) {
  if (n == null) return {};
  var t = hs(n, e),
    i,
    a;
  if (Object.getOwnPropertySymbols) {
    var c = Object.getOwnPropertySymbols(n);
    for (a = 0; a < c.length; a++)
      ((i = c[a]),
        !(e.indexOf(i) >= 0) && Object.prototype.propertyIsEnumerable.call(n, i) && (t[i] = n[i]));
  }
  return t;
}
function hs(n, e) {
  if (n == null) return {};
  var t = {},
    i = Object.keys(n),
    a,
    c;
  for (c = 0; c < i.length; c++) ((a = i[c]), !(e.indexOf(a) >= 0) && (t[a] = n[a]));
  return t;
}
let Ei = 0;
const sn = Symbol.for("__REACT_DND_CONTEXT_INSTANCE__");
var Bs = h.memo(function (e) {
  var { children: t } = e,
    i = gs(e, ["children"]);
  const [a, c] = us(i);
  return (
    h.useEffect(() => {
      if (c) {
        const s = xa();
        return (
          ++Ei,
          () => {
            --Ei === 0 && (s[sn] = null);
          }
        );
      }
    }, []),
    r.jsx(la.Provider, { value: a, children: t })
  );
});
function us(n) {
  if ("manager" in n) return [{ dragDropManager: n.manager }, !1];
  const e = bs(n.backend, n.context, n.options, n.debugMode),
    t = !n.context;
  return [e, t];
}
function bs(n, e = xa(), t, i) {
  const a = e;
  return (a[sn] || (a[sn] = { dragDropManager: Ns(n, e, t, i) }), a[sn]);
}
function xa() {
  return typeof global < "u" ? global : window;
}
var ms = function n(e, t) {
  if (e === t) return !0;
  if (e && t && typeof e == "object" && typeof t == "object") {
    if (e.constructor !== t.constructor) return !1;
    var i, a, c;
    if (Array.isArray(e)) {
      if (((i = e.length), i != t.length)) return !1;
      for (a = i; a-- !== 0;) if (!n(e[a], t[a])) return !1;
      return !0;
    }
    if (e.constructor === RegExp) return e.source === t.source && e.flags === t.flags;
    if (e.valueOf !== Object.prototype.valueOf) return e.valueOf() === t.valueOf();
    if (e.toString !== Object.prototype.toString) return e.toString() === t.toString();
    if (((c = Object.keys(e)), (i = c.length), i !== Object.keys(t).length)) return !1;
    for (a = i; a-- !== 0;) if (!Object.prototype.hasOwnProperty.call(t, c[a])) return !1;
    for (a = i; a-- !== 0;) {
      var s = c[a];
      if (!n(e[s], t[s])) return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
};
const xt = typeof window < "u" ? h.useLayoutEffect : h.useEffect;
function Da(n, e, t) {
  const [i, a] = h.useState(() => e(n)),
    c = h.useCallback(() => {
      const s = e(n);
      ms(i, s) || (a(s), t && t());
    }, [i, n, t]);
  return (xt(c), [i, c]);
}
function xs(n, e, t) {
  const [i, a] = Da(n, e, t);
  return (
    xt(
      function () {
        const s = n.getHandlerId();
        if (s != null) return n.subscribeToStateChange(a, { handlerIds: [s] });
      },
      [n, a],
    ),
    i
  );
}
function pa(n, e, t) {
  return xs(e, n || (() => ({})), () => t.reconnect());
}
function Oa(n, e) {
  const t = [...(e || [])];
  return (
    e == null && typeof n != "function" && t.push(n),
    h.useMemo(() => (typeof n == "function" ? n() : n), t)
  );
}
function Ds(n) {
  return h.useMemo(() => n.hooks.dragSource(), [n]);
}
function ps(n) {
  return h.useMemo(() => n.hooks.dragPreview(), [n]);
}
let Gn = !1,
  yn = !1;
class Os {
  receiveHandlerId(e) {
    this.sourceId = e;
  }
  getHandlerId() {
    return this.sourceId;
  }
  canDrag() {
    M(
      !Gn,
      "You may not call monitor.canDrag() inside your canDrag() implementation. Read more: http://react-dnd.github.io/react-dnd/docs/api/drag-source-monitor",
    );
    try {
      return ((Gn = !0), this.internalMonitor.canDragSource(this.sourceId));
    } finally {
      Gn = !1;
    }
  }
  isDragging() {
    if (!this.sourceId) return !1;
    M(
      !yn,
      "You may not call monitor.isDragging() inside your isDragging() implementation. Read more: http://react-dnd.github.io/react-dnd/docs/api/drag-source-monitor",
    );
    try {
      return ((yn = !0), this.internalMonitor.isDraggingSource(this.sourceId));
    } finally {
      yn = !1;
    }
  }
  subscribeToStateChange(e, t) {
    return this.internalMonitor.subscribeToStateChange(e, t);
  }
  isDraggingSource(e) {
    return this.internalMonitor.isDraggingSource(e);
  }
  isOverTarget(e, t) {
    return this.internalMonitor.isOverTarget(e, t);
  }
  getTargetIds() {
    return this.internalMonitor.getTargetIds();
  }
  isSourcePublic() {
    return this.internalMonitor.isSourcePublic();
  }
  getSourceId() {
    return this.internalMonitor.getSourceId();
  }
  subscribeToOffsetChange(e) {
    return this.internalMonitor.subscribeToOffsetChange(e);
  }
  canDragSource(e) {
    return this.internalMonitor.canDragSource(e);
  }
  canDropOnTarget(e) {
    return this.internalMonitor.canDropOnTarget(e);
  }
  getItemType() {
    return this.internalMonitor.getItemType();
  }
  getItem() {
    return this.internalMonitor.getItem();
  }
  getDropResult() {
    return this.internalMonitor.getDropResult();
  }
  didDrop() {
    return this.internalMonitor.didDrop();
  }
  getInitialClientOffset() {
    return this.internalMonitor.getInitialClientOffset();
  }
  getInitialSourceClientOffset() {
    return this.internalMonitor.getInitialSourceClientOffset();
  }
  getSourceClientOffset() {
    return this.internalMonitor.getSourceClientOffset();
  }
  getClientOffset() {
    return this.internalMonitor.getClientOffset();
  }
  getDifferenceFromInitialOffset() {
    return this.internalMonitor.getDifferenceFromInitialOffset();
  }
  constructor(e) {
    ((this.sourceId = null), (this.internalMonitor = e.getMonitor()));
  }
}
let kn = !1;
class Cs {
  receiveHandlerId(e) {
    this.targetId = e;
  }
  getHandlerId() {
    return this.targetId;
  }
  subscribeToStateChange(e, t) {
    return this.internalMonitor.subscribeToStateChange(e, t);
  }
  canDrop() {
    if (!this.targetId) return !1;
    M(
      !kn,
      "You may not call monitor.canDrop() inside your canDrop() implementation. Read more: http://react-dnd.github.io/react-dnd/docs/api/drop-target-monitor",
    );
    try {
      return ((kn = !0), this.internalMonitor.canDropOnTarget(this.targetId));
    } finally {
      kn = !1;
    }
  }
  isOver(e) {
    return this.targetId ? this.internalMonitor.isOverTarget(this.targetId, e) : !1;
  }
  getItemType() {
    return this.internalMonitor.getItemType();
  }
  getItem() {
    return this.internalMonitor.getItem();
  }
  getDropResult() {
    return this.internalMonitor.getDropResult();
  }
  didDrop() {
    return this.internalMonitor.didDrop();
  }
  getInitialClientOffset() {
    return this.internalMonitor.getInitialClientOffset();
  }
  getInitialSourceClientOffset() {
    return this.internalMonitor.getInitialSourceClientOffset();
  }
  getSourceClientOffset() {
    return this.internalMonitor.getSourceClientOffset();
  }
  getClientOffset() {
    return this.internalMonitor.getClientOffset();
  }
  getDifferenceFromInitialOffset() {
    return this.internalMonitor.getDifferenceFromInitialOffset();
  }
  constructor(e) {
    ((this.targetId = null), (this.internalMonitor = e.getMonitor()));
  }
}
function Vs(n, e, t) {
  const i = t.getRegistry(),
    a = i.addTarget(n, e);
  return [a, () => i.removeTarget(a)];
}
function Ss(n, e, t) {
  const i = t.getRegistry(),
    a = i.addSource(n, e);
  return [a, () => i.removeSource(a)];
}
function jn(n, e, t, i) {
  let a;
  if (a !== void 0) return !!a;
  if (n === e) return !0;
  if (typeof n != "object" || !n || typeof e != "object" || !e) return !1;
  const c = Object.keys(n),
    s = Object.keys(e);
  if (c.length !== s.length) return !1;
  const o = Object.prototype.hasOwnProperty.bind(e);
  for (let d = 0; d < c.length; d++) {
    const N = c[d];
    if (!o(N)) return !1;
    const l = n[N],
      u = e[N];
    if (((a = void 0), a === !1 || (a === void 0 && l !== u))) return !1;
  }
  return !0;
}
function Hn(n) {
  return n !== null && typeof n == "object" && Object.prototype.hasOwnProperty.call(n, "current");
}
function vs(n) {
  if (typeof n.type == "string") return;
  const e = n.type.displayName || n.type.name || "the component";
  throw new Error(
    `Only native element nodes can now be passed to React DnD connectors.You can either wrap ${e} into a <div>, or turn it into a drag source or a drop target itself.`,
  );
}
function As(n) {
  return (e = null, t = null) => {
    if (!h.isValidElement(e)) {
      const c = e;
      return (n(c, t), c);
    }
    const i = e;
    return (vs(i), Gs(i, t ? (c) => n(c, t) : n));
  };
}
function Ca(n) {
  const e = {};
  return (
    Object.keys(n).forEach((t) => {
      const i = n[t];
      if (t.endsWith("Ref")) e[t] = n[t];
      else {
        const a = As(i);
        e[t] = () => a;
      }
    }),
    e
  );
}
function Qi(n, e) {
  typeof n == "function" ? n(e) : (n.current = e);
}
function Gs(n, e) {
  const t = n.ref;
  return (
    M(
      typeof t != "string",
      "Cannot connect React DnD to an element with an existing string ref. Please convert it to use a callback ref instead, or wrap it into a <span> or <div>. Read more: https://reactjs.org/docs/refs-and-the-dom.html#callback-refs",
    ),
    t
      ? h.cloneElement(n, {
          ref: (i) => {
            (Qi(t, i), Qi(e, i));
          },
        })
      : h.cloneElement(n, { ref: e })
  );
}
class ys {
  receiveHandlerId(e) {
    this.handlerId !== e && ((this.handlerId = e), this.reconnect());
  }
  get connectTarget() {
    return this.dragSource;
  }
  get dragSourceOptions() {
    return this.dragSourceOptionsInternal;
  }
  set dragSourceOptions(e) {
    this.dragSourceOptionsInternal = e;
  }
  get dragPreviewOptions() {
    return this.dragPreviewOptionsInternal;
  }
  set dragPreviewOptions(e) {
    this.dragPreviewOptionsInternal = e;
  }
  reconnect() {
    const e = this.reconnectDragSource();
    this.reconnectDragPreview(e);
  }
  reconnectDragSource() {
    const e = this.dragSource,
      t =
        this.didHandlerIdChange() ||
        this.didConnectedDragSourceChange() ||
        this.didDragSourceOptionsChange();
    return (
      t && this.disconnectDragSource(),
      this.handlerId
        ? e
          ? (t &&
              ((this.lastConnectedHandlerId = this.handlerId),
              (this.lastConnectedDragSource = e),
              (this.lastConnectedDragSourceOptions = this.dragSourceOptions),
              (this.dragSourceUnsubscribe = this.backend.connectDragSource(
                this.handlerId,
                e,
                this.dragSourceOptions,
              ))),
            t)
          : ((this.lastConnectedDragSource = e), t)
        : t
    );
  }
  reconnectDragPreview(e = !1) {
    const t = this.dragPreview,
      i =
        e ||
        this.didHandlerIdChange() ||
        this.didConnectedDragPreviewChange() ||
        this.didDragPreviewOptionsChange();
    if ((i && this.disconnectDragPreview(), !!this.handlerId)) {
      if (!t) {
        this.lastConnectedDragPreview = t;
        return;
      }
      i &&
        ((this.lastConnectedHandlerId = this.handlerId),
        (this.lastConnectedDragPreview = t),
        (this.lastConnectedDragPreviewOptions = this.dragPreviewOptions),
        (this.dragPreviewUnsubscribe = this.backend.connectDragPreview(
          this.handlerId,
          t,
          this.dragPreviewOptions,
        )));
    }
  }
  didHandlerIdChange() {
    return this.lastConnectedHandlerId !== this.handlerId;
  }
  didConnectedDragSourceChange() {
    return this.lastConnectedDragSource !== this.dragSource;
  }
  didConnectedDragPreviewChange() {
    return this.lastConnectedDragPreview !== this.dragPreview;
  }
  didDragSourceOptionsChange() {
    return !jn(this.lastConnectedDragSourceOptions, this.dragSourceOptions);
  }
  didDragPreviewOptionsChange() {
    return !jn(this.lastConnectedDragPreviewOptions, this.dragPreviewOptions);
  }
  disconnectDragSource() {
    this.dragSourceUnsubscribe &&
      (this.dragSourceUnsubscribe(), (this.dragSourceUnsubscribe = void 0));
  }
  disconnectDragPreview() {
    this.dragPreviewUnsubscribe &&
      (this.dragPreviewUnsubscribe(),
      (this.dragPreviewUnsubscribe = void 0),
      (this.dragPreviewNode = null),
      (this.dragPreviewRef = null));
  }
  get dragSource() {
    return this.dragSourceNode || (this.dragSourceRef && this.dragSourceRef.current);
  }
  get dragPreview() {
    return this.dragPreviewNode || (this.dragPreviewRef && this.dragPreviewRef.current);
  }
  clearDragSource() {
    ((this.dragSourceNode = null), (this.dragSourceRef = null));
  }
  clearDragPreview() {
    ((this.dragPreviewNode = null), (this.dragPreviewRef = null));
  }
  constructor(e) {
    ((this.hooks = Ca({
      dragSource: (t, i) => {
        (this.clearDragSource(),
          (this.dragSourceOptions = i || null),
          Hn(t) ? (this.dragSourceRef = t) : (this.dragSourceNode = t),
          this.reconnectDragSource());
      },
      dragPreview: (t, i) => {
        (this.clearDragPreview(),
          (this.dragPreviewOptions = i || null),
          Hn(t) ? (this.dragPreviewRef = t) : (this.dragPreviewNode = t),
          this.reconnectDragPreview());
      },
    })),
      (this.handlerId = null),
      (this.dragSourceRef = null),
      (this.dragSourceOptionsInternal = null),
      (this.dragPreviewRef = null),
      (this.dragPreviewOptionsInternal = null),
      (this.lastConnectedHandlerId = null),
      (this.lastConnectedDragSource = null),
      (this.lastConnectedDragSourceOptions = null),
      (this.lastConnectedDragPreview = null),
      (this.lastConnectedDragPreviewOptions = null),
      (this.backend = e));
  }
}
class ks {
  get connectTarget() {
    return this.dropTarget;
  }
  reconnect() {
    const e = this.didHandlerIdChange() || this.didDropTargetChange() || this.didOptionsChange();
    e && this.disconnectDropTarget();
    const t = this.dropTarget;
    if (this.handlerId) {
      if (!t) {
        this.lastConnectedDropTarget = t;
        return;
      }
      e &&
        ((this.lastConnectedHandlerId = this.handlerId),
        (this.lastConnectedDropTarget = t),
        (this.lastConnectedDropTargetOptions = this.dropTargetOptions),
        (this.unsubscribeDropTarget = this.backend.connectDropTarget(
          this.handlerId,
          t,
          this.dropTargetOptions,
        )));
    }
  }
  receiveHandlerId(e) {
    e !== this.handlerId && ((this.handlerId = e), this.reconnect());
  }
  get dropTargetOptions() {
    return this.dropTargetOptionsInternal;
  }
  set dropTargetOptions(e) {
    this.dropTargetOptionsInternal = e;
  }
  didHandlerIdChange() {
    return this.lastConnectedHandlerId !== this.handlerId;
  }
  didDropTargetChange() {
    return this.lastConnectedDropTarget !== this.dropTarget;
  }
  didOptionsChange() {
    return !jn(this.lastConnectedDropTargetOptions, this.dropTargetOptions);
  }
  disconnectDropTarget() {
    this.unsubscribeDropTarget &&
      (this.unsubscribeDropTarget(), (this.unsubscribeDropTarget = void 0));
  }
  get dropTarget() {
    return this.dropTargetNode || (this.dropTargetRef && this.dropTargetRef.current);
  }
  clearDropTarget() {
    ((this.dropTargetRef = null), (this.dropTargetNode = null));
  }
  constructor(e) {
    ((this.hooks = Ca({
      dropTarget: (t, i) => {
        (this.clearDropTarget(),
          (this.dropTargetOptions = i),
          Hn(t) ? (this.dropTargetRef = t) : (this.dropTargetNode = t),
          this.reconnect());
      },
    })),
      (this.handlerId = null),
      (this.dropTargetRef = null),
      (this.dropTargetOptionsInternal = null),
      (this.lastConnectedHandlerId = null),
      (this.lastConnectedDropTarget = null),
      (this.lastConnectedDropTargetOptions = null),
      (this.backend = e));
  }
}
function Dt() {
  const { dragDropManager: n } = h.useContext(la);
  return (M(n != null, "Expected drag drop context"), n);
}
function ws(n, e) {
  const t = Dt(),
    i = h.useMemo(() => new ys(t.getBackend()), [t]);
  return (
    xt(
      () => ((i.dragSourceOptions = n || null), i.reconnect(), () => i.disconnectDragSource()),
      [i, n],
    ),
    xt(
      () => ((i.dragPreviewOptions = e || null), i.reconnect(), () => i.disconnectDragPreview()),
      [i, e],
    ),
    i
  );
}
function Es() {
  const n = Dt();
  return h.useMemo(() => new Os(n), [n]);
}
class Qs {
  beginDrag() {
    const e = this.spec,
      t = this.monitor;
    let i = null;
    return (
      typeof e.item == "object"
        ? (i = e.item)
        : typeof e.item == "function"
          ? (i = e.item(t))
          : (i = {}),
      i ?? null
    );
  }
  canDrag() {
    const e = this.spec,
      t = this.monitor;
    return typeof e.canDrag == "boolean"
      ? e.canDrag
      : typeof e.canDrag == "function"
        ? e.canDrag(t)
        : !0;
  }
  isDragging(e, t) {
    const i = this.spec,
      a = this.monitor,
      { isDragging: c } = i;
    return c ? c(a) : t === e.getSourceId();
  }
  endDrag() {
    const e = this.spec,
      t = this.monitor,
      i = this.connector,
      { end: a } = e;
    (a && a(t.getItem(), t), i.reconnect());
  }
  constructor(e, t, i) {
    ((this.spec = e), (this.monitor = t), (this.connector = i));
  }
}
function Rs(n, e, t) {
  const i = h.useMemo(() => new Qs(n, e, t), [e, t]);
  return (
    h.useEffect(() => {
      i.spec = n;
    }, [n]),
    i
  );
}
function Ps(n) {
  return h.useMemo(() => {
    const e = n.type;
    return (M(e != null, "spec.type must be defined"), e);
  }, [n]);
}
function Ls(n, e, t) {
  const i = Dt(),
    a = Rs(n, e, t),
    c = Ps(n);
  xt(
    function () {
      if (c != null) {
        const [o, d] = Ss(c, a, i);
        return (e.receiveHandlerId(o), t.receiveHandlerId(o), d);
      }
    },
    [i, e, t, a, c],
  );
}
function Ks(n, e) {
  const t = Oa(n, e);
  M(
    !t.begin,
    "useDrag::spec.begin was deprecated in v14. Replace spec.begin() with spec.item(). (see more here - https://react-dnd.github.io/react-dnd/docs/api/use-drag)",
  );
  const i = Es(),
    a = ws(t.options, t.previewOptions);
  return (Ls(t, i, a), [pa(t.collect, i, a), Ds(a), ps(a)]);
}
function Ms(n) {
  const t = Dt().getMonitor(),
    [i, a] = Da(t, n);
  return (
    h.useEffect(() => t.subscribeToOffsetChange(a)),
    h.useEffect(() => t.subscribeToStateChange(a)),
    i
  );
}
function Is(n) {
  return h.useMemo(() => n.hooks.dropTarget(), [n]);
}
function Ts(n) {
  const e = Dt(),
    t = h.useMemo(() => new ks(e.getBackend()), [e]);
  return (
    xt(
      () => ((t.dropTargetOptions = n || null), t.reconnect(), () => t.disconnectDropTarget()),
      [n],
    ),
    t
  );
}
function zs() {
  const n = Dt();
  return h.useMemo(() => new Cs(n), [n]);
}
function _s(n) {
  const { accept: e } = n;
  return h.useMemo(
    () => (M(n.accept != null, "accept must be defined"), Array.isArray(e) ? e : [e]),
    [e],
  );
}
class Fs {
  canDrop() {
    const e = this.spec,
      t = this.monitor;
    return e.canDrop ? e.canDrop(t.getItem(), t) : !0;
  }
  hover() {
    const e = this.spec,
      t = this.monitor;
    e.hover && e.hover(t.getItem(), t);
  }
  drop() {
    const e = this.spec,
      t = this.monitor;
    if (e.drop) return e.drop(t.getItem(), t);
  }
  constructor(e, t) {
    ((this.spec = e), (this.monitor = t));
  }
}
function js(n, e) {
  const t = h.useMemo(() => new Fs(n, e), [e]);
  return (
    h.useEffect(() => {
      t.spec = n;
    }, [n]),
    t
  );
}
function Hs(n, e, t) {
  const i = Dt(),
    a = js(n, e),
    c = _s(n);
  xt(
    function () {
      const [o, d] = Vs(c, a, i);
      return (e.receiveHandlerId(o), t.receiveHandlerId(o), d);
    },
    [i, e, a, t, c.map((s) => s.toString()).join("|")],
  );
}
function $s(n, e) {
  const t = Oa(n, e),
    i = zs(),
    a = Ts(t.options);
  return (Hs(t, i, a), [pa(t.collect, i, a), Is(a)]);
}
function Va(n) {
  let e = null;
  return () => (e == null && (e = n()), e);
}
function Ws(n, e) {
  return n.filter((t) => t !== e);
}
function qs(n, e) {
  const t = new Set(),
    i = (c) => t.add(c);
  (n.forEach(i), e.forEach(i));
  const a = [];
  return (t.forEach((c) => a.push(c)), a);
}
class Us {
  enter(e) {
    const t = this.entered.length,
      i = (a) => this.isNodeInDocument(a) && (!a.contains || a.contains(e));
    return ((this.entered = qs(this.entered.filter(i), [e])), t === 0 && this.entered.length > 0);
  }
  leave(e) {
    const t = this.entered.length;
    return (
      (this.entered = Ws(this.entered.filter(this.isNodeInDocument), e)),
      t > 0 && this.entered.length === 0
    );
  }
  reset() {
    this.entered = [];
  }
  constructor(e) {
    ((this.entered = []), (this.isNodeInDocument = e));
  }
}
class Zs {
  initializeExposedProperties() {
    Object.keys(this.config.exposeProperties).forEach((e) => {
      Object.defineProperty(this.item, e, {
        configurable: !0,
        enumerable: !0,
        get() {
          return (console.warn(`Browser doesn't allow reading "${e}" until the drop event.`), null);
        },
      });
    });
  }
  loadDataTransfer(e) {
    if (e) {
      const t = {};
      (Object.keys(this.config.exposeProperties).forEach((i) => {
        const a = this.config.exposeProperties[i];
        a != null &&
          (t[i] = { value: a(e, this.config.matchesTypes), configurable: !0, enumerable: !0 });
      }),
        Object.defineProperties(this.item, t));
    }
  }
  canDrag() {
    return !0;
  }
  beginDrag() {
    return this.item;
  }
  isDragging(e, t) {
    return t === e.getSourceId();
  }
  endDrag() {}
  constructor(e) {
    ((this.config = e), (this.item = {}), this.initializeExposedProperties());
  }
}
const Sa = "__NATIVE_FILE__",
  va = "__NATIVE_URL__",
  Aa = "__NATIVE_TEXT__",
  Ga = "__NATIVE_HTML__";
var Ri = Object.freeze({ __proto__: null, FILE: Sa, HTML: Ga, TEXT: Aa, URL: va });
function wn(n, e, t) {
  const i = e.reduce((a, c) => a || n.getData(c), "");
  return i ?? t;
}
const $n = {
  [Sa]: {
    exposeProperties: {
      files: (n) => Array.prototype.slice.call(n.files),
      items: (n) => n.items,
      dataTransfer: (n) => n,
    },
    matchesTypes: ["Files"],
  },
  [Ga]: {
    exposeProperties: { html: (n, e) => wn(n, e, ""), dataTransfer: (n) => n },
    matchesTypes: ["Html", "text/html"],
  },
  [va]: {
    exposeProperties: {
      urls: (n, e) =>
        wn(n, e, "").split(`
`),
      dataTransfer: (n) => n,
    },
    matchesTypes: ["Url", "text/uri-list"],
  },
  [Aa]: {
    exposeProperties: { text: (n, e) => wn(n, e, ""), dataTransfer: (n) => n },
    matchesTypes: ["Text", "text/plain"],
  },
};
function Ys(n, e) {
  const t = $n[n];
  if (!t) throw new Error(`native type ${n} has no configuration`);
  const i = new Zs(t);
  return (i.loadDataTransfer(e), i);
}
function En(n) {
  if (!n) return null;
  const e = Array.prototype.slice.call(n.types || []);
  return (
    Object.keys($n).filter((t) => {
      const i = $n[t];
      return i?.matchesTypes ? i.matchesTypes.some((a) => e.indexOf(a) > -1) : !1;
    })[0] || null
  );
}
const Js = Va(() => /firefox/i.test(navigator.userAgent)),
  ya = Va(() => !!window.safari);
class Pi {
  interpolate(e) {
    const { xs: t, ys: i, c1s: a, c2s: c, c3s: s } = this;
    let o = t.length - 1;
    if (e === t[o]) return i[o];
    let d = 0,
      N = s.length - 1,
      l;
    for (; d <= N;) {
      l = Math.floor(0.5 * (d + N));
      const B = t[l];
      if (B < e) d = l + 1;
      else if (B > e) N = l - 1;
      else return i[l];
    }
    o = Math.max(0, N);
    const u = e - t[o],
      f = u * u;
    return i[o] + a[o] * u + c[o] * f + s[o] * u * f;
  }
  constructor(e, t) {
    const { length: i } = e,
      a = [];
    for (let B = 0; B < i; B++) a.push(B);
    a.sort((B, b) => (e[B] < e[b] ? -1 : 1));
    const c = [],
      s = [];
    let o, d;
    for (let B = 0; B < i - 1; B++)
      ((o = e[B + 1] - e[B]), (d = t[B + 1] - t[B]), c.push(o), s.push(d / o));
    const N = [s[0]];
    for (let B = 0; B < c.length - 1; B++) {
      const b = s[B],
        p = s[B + 1];
      if (b * p <= 0) N.push(0);
      else {
        o = c[B];
        const V = c[B + 1],
          G = o + V;
        N.push((3 * G) / ((G + V) / b + (G + o) / p));
      }
    }
    N.push(s[s.length - 1]);
    const l = [],
      u = [];
    let f;
    for (let B = 0; B < N.length - 1; B++) {
      f = s[B];
      const b = N[B],
        p = 1 / c[B],
        V = b + N[B + 1] - f - f;
      (l.push((f - b - V) * p), u.push(V * p * p));
    }
    ((this.xs = e), (this.ys = t), (this.c1s = N), (this.c2s = l), (this.c3s = u));
  }
}
const Xs = 1;
function ka(n) {
  const e = n.nodeType === Xs ? n : n.parentElement;
  if (!e) return null;
  const { top: t, left: i } = e.getBoundingClientRect();
  return { x: i, y: t };
}
function en(n) {
  return { x: n.clientX, y: n.clientY };
}
function eo(n) {
  var e;
  return (
    n.nodeName === "IMG" &&
    (Js() || !(!((e = document.documentElement) === null || e === void 0) && e.contains(n)))
  );
}
function to(n, e, t, i) {
  let a = n ? e.width : t,
    c = n ? e.height : i;
  return (
    ya() && n && ((c /= window.devicePixelRatio), (a /= window.devicePixelRatio)),
    { dragPreviewWidth: a, dragPreviewHeight: c }
  );
}
function no(n, e, t, i, a) {
  const c = eo(e),
    o = ka(c ? n : e),
    d = { x: t.x - o.x, y: t.y - o.y },
    { offsetWidth: N, offsetHeight: l } = n,
    { anchorX: u, anchorY: f } = i,
    { dragPreviewWidth: B, dragPreviewHeight: b } = to(c, e, N, l),
    p = () => {
      let j = new Pi([0, 0.5, 1], [d.y, (d.y / l) * b, d.y + b - l]).interpolate(f);
      return (ya() && c && (j += (window.devicePixelRatio - 1) * b), j);
    },
    V = () => new Pi([0, 0.5, 1], [d.x, (d.x / N) * B, d.x + B - N]).interpolate(u),
    { offsetX: G, offsetY: A } = a,
    Q = G === 0 || G,
    _ = A === 0 || A;
  return { x: Q ? G : V(), y: _ ? A : p() };
}
let io = class {
  get window() {
    if (this.globalContext) return this.globalContext;
    if (typeof window < "u") return window;
  }
  get document() {
    var e;
    return !((e = this.globalContext) === null || e === void 0) && e.document
      ? this.globalContext.document
      : this.window
        ? this.window.document
        : void 0;
  }
  get rootElement() {
    var e;
    return (
      ((e = this.optionsArgs) === null || e === void 0 ? void 0 : e.rootElement) || this.window
    );
  }
  constructor(e, t) {
    ((this.ownerDocument = null), (this.globalContext = e), (this.optionsArgs = t));
  }
};
function ao(n, e, t) {
  return (
    e in n
      ? Object.defineProperty(n, e, { value: t, enumerable: !0, configurable: !0, writable: !0 })
      : (n[e] = t),
    n
  );
}
function Li(n) {
  for (var e = 1; e < arguments.length; e++) {
    var t = arguments[e] != null ? arguments[e] : {},
      i = Object.keys(t);
    (typeof Object.getOwnPropertySymbols == "function" &&
      (i = i.concat(
        Object.getOwnPropertySymbols(t).filter(function (a) {
          return Object.getOwnPropertyDescriptor(t, a).enumerable;
        }),
      )),
      i.forEach(function (a) {
        ao(n, a, t[a]);
      }));
  }
  return n;
}
class co {
  profile() {
    var e, t;
    return {
      sourcePreviewNodes: this.sourcePreviewNodes.size,
      sourcePreviewNodeOptions: this.sourcePreviewNodeOptions.size,
      sourceNodeOptions: this.sourceNodeOptions.size,
      sourceNodes: this.sourceNodes.size,
      dragStartSourceIds:
        ((e = this.dragStartSourceIds) === null || e === void 0 ? void 0 : e.length) || 0,
      dropTargetIds: this.dropTargetIds.length,
      dragEnterTargetIds: this.dragEnterTargetIds.length,
      dragOverTargetIds:
        ((t = this.dragOverTargetIds) === null || t === void 0 ? void 0 : t.length) || 0,
    };
  }
  get window() {
    return this.options.window;
  }
  get document() {
    return this.options.document;
  }
  get rootElement() {
    return this.options.rootElement;
  }
  setup() {
    const e = this.rootElement;
    if (e !== void 0) {
      if (e.__isReactDndBackendSetUp)
        throw new Error("Cannot have two HTML5 backends at the same time.");
      ((e.__isReactDndBackendSetUp = !0), this.addEventListeners(e));
    }
  }
  teardown() {
    const e = this.rootElement;
    if (
      e !== void 0 &&
      ((e.__isReactDndBackendSetUp = !1),
      this.removeEventListeners(this.rootElement),
      this.clearCurrentDragSourceNode(),
      this.asyncEndDragFrameId)
    ) {
      var t;
      (t = this.window) === null ||
        t === void 0 ||
        t.cancelAnimationFrame(this.asyncEndDragFrameId);
    }
  }
  connectDragPreview(e, t, i) {
    return (
      this.sourcePreviewNodeOptions.set(e, i),
      this.sourcePreviewNodes.set(e, t),
      () => {
        (this.sourcePreviewNodes.delete(e), this.sourcePreviewNodeOptions.delete(e));
      }
    );
  }
  connectDragSource(e, t, i) {
    (this.sourceNodes.set(e, t), this.sourceNodeOptions.set(e, i));
    const a = (s) => this.handleDragStart(s, e),
      c = (s) => this.handleSelectStart(s);
    return (
      t.setAttribute("draggable", "true"),
      t.addEventListener("dragstart", a),
      t.addEventListener("selectstart", c),
      () => {
        (this.sourceNodes.delete(e),
          this.sourceNodeOptions.delete(e),
          t.removeEventListener("dragstart", a),
          t.removeEventListener("selectstart", c),
          t.setAttribute("draggable", "false"));
      }
    );
  }
  connectDropTarget(e, t) {
    const i = (s) => this.handleDragEnter(s, e),
      a = (s) => this.handleDragOver(s, e),
      c = (s) => this.handleDrop(s, e);
    return (
      t.addEventListener("dragenter", i),
      t.addEventListener("dragover", a),
      t.addEventListener("drop", c),
      () => {
        (t.removeEventListener("dragenter", i),
          t.removeEventListener("dragover", a),
          t.removeEventListener("drop", c));
      }
    );
  }
  addEventListeners(e) {
    e.addEventListener &&
      (e.addEventListener("dragstart", this.handleTopDragStart),
      e.addEventListener("dragstart", this.handleTopDragStartCapture, !0),
      e.addEventListener("dragend", this.handleTopDragEndCapture, !0),
      e.addEventListener("dragenter", this.handleTopDragEnter),
      e.addEventListener("dragenter", this.handleTopDragEnterCapture, !0),
      e.addEventListener("dragleave", this.handleTopDragLeaveCapture, !0),
      e.addEventListener("dragover", this.handleTopDragOver),
      e.addEventListener("dragover", this.handleTopDragOverCapture, !0),
      e.addEventListener("drop", this.handleTopDrop),
      e.addEventListener("drop", this.handleTopDropCapture, !0));
  }
  removeEventListeners(e) {
    e.removeEventListener &&
      (e.removeEventListener("dragstart", this.handleTopDragStart),
      e.removeEventListener("dragstart", this.handleTopDragStartCapture, !0),
      e.removeEventListener("dragend", this.handleTopDragEndCapture, !0),
      e.removeEventListener("dragenter", this.handleTopDragEnter),
      e.removeEventListener("dragenter", this.handleTopDragEnterCapture, !0),
      e.removeEventListener("dragleave", this.handleTopDragLeaveCapture, !0),
      e.removeEventListener("dragover", this.handleTopDragOver),
      e.removeEventListener("dragover", this.handleTopDragOverCapture, !0),
      e.removeEventListener("drop", this.handleTopDrop),
      e.removeEventListener("drop", this.handleTopDropCapture, !0));
  }
  getCurrentSourceNodeOptions() {
    const e = this.monitor.getSourceId(),
      t = this.sourceNodeOptions.get(e);
    return Li({ dropEffect: this.altKeyPressed ? "copy" : "move" }, t || {});
  }
  getCurrentDropEffect() {
    return this.isDraggingNativeItem() ? "copy" : this.getCurrentSourceNodeOptions().dropEffect;
  }
  getCurrentSourcePreviewNodeOptions() {
    const e = this.monitor.getSourceId(),
      t = this.sourcePreviewNodeOptions.get(e);
    return Li({ anchorX: 0.5, anchorY: 0.5, captureDraggingState: !1 }, t || {});
  }
  isDraggingNativeItem() {
    const e = this.monitor.getItemType();
    return Object.keys(Ri).some((t) => Ri[t] === e);
  }
  beginDragNativeItem(e, t) {
    (this.clearCurrentDragSourceNode(),
      (this.currentNativeSource = Ys(e, t)),
      (this.currentNativeHandle = this.registry.addSource(e, this.currentNativeSource)),
      this.actions.beginDrag([this.currentNativeHandle]));
  }
  setCurrentDragSourceNode(e) {
    (this.clearCurrentDragSourceNode(), (this.currentDragSourceNode = e));
    const t = 1e3;
    this.mouseMoveTimeoutTimer = setTimeout(() => {
      var i;
      return (i = this.rootElement) === null || i === void 0
        ? void 0
        : i.addEventListener("mousemove", this.endDragIfSourceWasRemovedFromDOM, !0);
    }, t);
  }
  clearCurrentDragSourceNode() {
    if (this.currentDragSourceNode) {
      if (((this.currentDragSourceNode = null), this.rootElement)) {
        var e;
        ((e = this.window) === null ||
          e === void 0 ||
          e.clearTimeout(this.mouseMoveTimeoutTimer || void 0),
          this.rootElement.removeEventListener(
            "mousemove",
            this.endDragIfSourceWasRemovedFromDOM,
            !0,
          ));
      }
      return ((this.mouseMoveTimeoutTimer = null), !0);
    }
    return !1;
  }
  handleDragStart(e, t) {
    e.defaultPrevented ||
      (this.dragStartSourceIds || (this.dragStartSourceIds = []),
      this.dragStartSourceIds.unshift(t));
  }
  handleDragEnter(e, t) {
    this.dragEnterTargetIds.unshift(t);
  }
  handleDragOver(e, t) {
    (this.dragOverTargetIds === null && (this.dragOverTargetIds = []),
      this.dragOverTargetIds.unshift(t));
  }
  handleDrop(e, t) {
    this.dropTargetIds.unshift(t);
  }
  constructor(e, t, i) {
    ((this.sourcePreviewNodes = new Map()),
      (this.sourcePreviewNodeOptions = new Map()),
      (this.sourceNodes = new Map()),
      (this.sourceNodeOptions = new Map()),
      (this.dragStartSourceIds = null),
      (this.dropTargetIds = []),
      (this.dragEnterTargetIds = []),
      (this.currentNativeSource = null),
      (this.currentNativeHandle = null),
      (this.currentDragSourceNode = null),
      (this.altKeyPressed = !1),
      (this.mouseMoveTimeoutTimer = null),
      (this.asyncEndDragFrameId = null),
      (this.dragOverTargetIds = null),
      (this.lastClientOffset = null),
      (this.hoverRafId = null),
      (this.getSourceClientOffset = (a) => {
        const c = this.sourceNodes.get(a);
        return (c && ka(c)) || null;
      }),
      (this.endDragNativeItem = () => {
        this.isDraggingNativeItem() &&
          (this.actions.endDrag(),
          this.currentNativeHandle && this.registry.removeSource(this.currentNativeHandle),
          (this.currentNativeHandle = null),
          (this.currentNativeSource = null));
      }),
      (this.isNodeInDocument = (a) =>
        !!(a && this.document && this.document.body && this.document.body.contains(a))),
      (this.endDragIfSourceWasRemovedFromDOM = () => {
        const a = this.currentDragSourceNode;
        a == null ||
          this.isNodeInDocument(a) ||
          (this.clearCurrentDragSourceNode() && this.monitor.isDragging() && this.actions.endDrag(),
          this.cancelHover());
      }),
      (this.scheduleHover = (a) => {
        this.hoverRafId === null &&
          typeof requestAnimationFrame < "u" &&
          (this.hoverRafId = requestAnimationFrame(() => {
            (this.monitor.isDragging() &&
              this.actions.hover(a || [], { clientOffset: this.lastClientOffset }),
              (this.hoverRafId = null));
          }));
      }),
      (this.cancelHover = () => {
        this.hoverRafId !== null &&
          typeof cancelAnimationFrame < "u" &&
          (cancelAnimationFrame(this.hoverRafId), (this.hoverRafId = null));
      }),
      (this.handleTopDragStartCapture = () => {
        (this.clearCurrentDragSourceNode(), (this.dragStartSourceIds = []));
      }),
      (this.handleTopDragStart = (a) => {
        if (a.defaultPrevented) return;
        const { dragStartSourceIds: c } = this;
        this.dragStartSourceIds = null;
        const s = en(a);
        (this.monitor.isDragging() && (this.actions.endDrag(), this.cancelHover()),
          this.actions.beginDrag(c || [], {
            publishSource: !1,
            getSourceClientOffset: this.getSourceClientOffset,
            clientOffset: s,
          }));
        const { dataTransfer: o } = a,
          d = En(o);
        if (this.monitor.isDragging()) {
          if (o && typeof o.setDragImage == "function") {
            const l = this.monitor.getSourceId(),
              u = this.sourceNodes.get(l),
              f = this.sourcePreviewNodes.get(l) || u;
            if (f) {
              const {
                  anchorX: B,
                  anchorY: b,
                  offsetX: p,
                  offsetY: V,
                } = this.getCurrentSourcePreviewNodeOptions(),
                Q = no(u, f, s, { anchorX: B, anchorY: b }, { offsetX: p, offsetY: V });
              o.setDragImage(f, Q.x, Q.y);
            }
          }
          try {
            o?.setData("application/json", {});
          } catch {}
          this.setCurrentDragSourceNode(a.target);
          const { captureDraggingState: N } = this.getCurrentSourcePreviewNodeOptions();
          N
            ? this.actions.publishDragSource()
            : setTimeout(() => this.actions.publishDragSource(), 0);
        } else if (d) this.beginDragNativeItem(d);
        else {
          if (
            o &&
            !o.types &&
            ((a.target && !a.target.hasAttribute) || !a.target.hasAttribute("draggable"))
          )
            return;
          a.preventDefault();
        }
      }),
      (this.handleTopDragEndCapture = () => {
        (this.clearCurrentDragSourceNode() && this.monitor.isDragging() && this.actions.endDrag(),
          this.cancelHover());
      }),
      (this.handleTopDragEnterCapture = (a) => {
        if (((this.dragEnterTargetIds = []), this.isDraggingNativeItem())) {
          var c;
          (c = this.currentNativeSource) === null ||
            c === void 0 ||
            c.loadDataTransfer(a.dataTransfer);
        }
        if (!this.enterLeaveCounter.enter(a.target) || this.monitor.isDragging()) return;
        const { dataTransfer: o } = a,
          d = En(o);
        d && this.beginDragNativeItem(d, o);
      }),
      (this.handleTopDragEnter = (a) => {
        const { dragEnterTargetIds: c } = this;
        if (((this.dragEnterTargetIds = []), !this.monitor.isDragging())) return;
        ((this.altKeyPressed = a.altKey),
          c.length > 0 && this.actions.hover(c, { clientOffset: en(a) }),
          c.some((o) => this.monitor.canDropOnTarget(o)) &&
            (a.preventDefault(),
            a.dataTransfer && (a.dataTransfer.dropEffect = this.getCurrentDropEffect())));
      }),
      (this.handleTopDragOverCapture = (a) => {
        if (((this.dragOverTargetIds = []), this.isDraggingNativeItem())) {
          var c;
          (c = this.currentNativeSource) === null ||
            c === void 0 ||
            c.loadDataTransfer(a.dataTransfer);
        }
      }),
      (this.handleTopDragOver = (a) => {
        const { dragOverTargetIds: c } = this;
        if (((this.dragOverTargetIds = []), !this.monitor.isDragging())) {
          (a.preventDefault(), a.dataTransfer && (a.dataTransfer.dropEffect = "none"));
          return;
        }
        ((this.altKeyPressed = a.altKey),
          (this.lastClientOffset = en(a)),
          this.scheduleHover(c),
          (c || []).some((o) => this.monitor.canDropOnTarget(o))
            ? (a.preventDefault(),
              a.dataTransfer && (a.dataTransfer.dropEffect = this.getCurrentDropEffect()))
            : this.isDraggingNativeItem()
              ? a.preventDefault()
              : (a.preventDefault(), a.dataTransfer && (a.dataTransfer.dropEffect = "none")));
      }),
      (this.handleTopDragLeaveCapture = (a) => {
        (this.isDraggingNativeItem() && a.preventDefault(),
          this.enterLeaveCounter.leave(a.target) &&
            (this.isDraggingNativeItem() && setTimeout(() => this.endDragNativeItem(), 0),
            this.cancelHover()));
      }),
      (this.handleTopDropCapture = (a) => {
        if (((this.dropTargetIds = []), this.isDraggingNativeItem())) {
          var c;
          (a.preventDefault(),
            (c = this.currentNativeSource) === null ||
              c === void 0 ||
              c.loadDataTransfer(a.dataTransfer));
        } else En(a.dataTransfer) && a.preventDefault();
        this.enterLeaveCounter.reset();
      }),
      (this.handleTopDrop = (a) => {
        const { dropTargetIds: c } = this;
        ((this.dropTargetIds = []),
          this.actions.hover(c, { clientOffset: en(a) }),
          this.actions.drop({ dropEffect: this.getCurrentDropEffect() }),
          this.isDraggingNativeItem()
            ? this.endDragNativeItem()
            : this.monitor.isDragging() && this.actions.endDrag(),
          this.cancelHover());
      }),
      (this.handleSelectStart = (a) => {
        const c = a.target;
        typeof c.dragDrop == "function" &&
          (c.tagName === "INPUT" ||
            c.tagName === "SELECT" ||
            c.tagName === "TEXTAREA" ||
            c.isContentEditable ||
            (a.preventDefault(), c.dragDrop()));
      }),
      (this.options = new io(t, i)),
      (this.actions = e.getActions()),
      (this.monitor = e.getMonitor()),
      (this.registry = e.getRegistry()),
      (this.enterLeaveCounter = new Us(this.isNodeInDocument)));
  }
}
let tn;
function ro() {
  return (
    tn ||
      ((tn = new Image()),
      (tn.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==")),
    tn
  );
}
const so = function (e, t, i) {
  return new co(e, t, i);
};
function Ki({ isPremovedPiece: n = !1, piece: e, square: t, squares: i }) {
  const {
      animationDuration: a,
      arePiecesDraggable: c,
      boardWidth: s,
      boardOrientation: o,
      chessPieces: d,
      currentPosition: N,
      deletePieceFromSquare: l,
      dropOffBoardAction: u,
      id: f,
      isDraggablePiece: B,
      isWaitingForAnimation: b,
      onPieceClick: p,
      onPieceDragBegin: V,
      onPieceDragEnd: G,
      onPieceDropOffBoard: A,
      onPromotionCheck: Q,
      positionDifferences: _,
    } = Ze(),
    [z, j] = h.useState({
      opacity: 1,
      zIndex: 5,
      touchAction: "none",
      cursor: c && B({ piece: e, sourceSquare: t }) ? "-webkit-grab" : "default",
    }),
    [{ canDrag: De, isDragging: oe }, fe, ie] = Ks(
      () => ({
        type: "piece",
        item: () => (V(e, t), { piece: e, square: t, id: f }),
        end: (Z, J) => {
          (G(e, t), !J.didDrop() && (u === "trash" && l(t), A?.(t, e)));
        },
        collect: (Z) => ({
          canDrag: B({ piece: e, sourceSquare: t }),
          isDragging: !!Z.isDragging(),
        }),
      }),
      [e, t, N, f],
    );
  (ie(ro(), { captureDraggingState: !0 }),
    h.useEffect(() => {
      j((Z) => Object.assign(Object.assign({}, Z), { opacity: oe ? 0 : 1 }));
    }, [oe]),
    h.useEffect(() => {
      var Z;
      const J = (Z = _.removed) === null || Z === void 0 ? void 0 : Z[t];
      if (!_.added || !J) return;
      const de = Object.entries(_.added).find(([$, ge]) => ge === J || Q(t, $, J));
      if (b && J && de && !n) {
        const $ = t,
          ge = de[0];
        if ($ && ge) {
          const ae = s / 8;
          j((K) =>
            Object.assign(Object.assign({}, K), {
              transform: `translate(${(o === "black" ? -1 : 1) * (ge.charCodeAt(0) - $.charCodeAt(0)) * ae}px, ${(o === "black" ? -1 : 1) * (Number($[1]) - Number(ge[1])) * ae}px)`,
              transition: `transform ${a}ms`,
              zIndex: 6,
            }),
          );
        }
      }
    }, [_]),
    h.useEffect(() => {
      const { sourceSq: Z } = ue();
      Z &&
        j((J) =>
          Object.assign(Object.assign({}, J), {
            transform: "translate(0px, 0px)",
            transition: "transform 0ms",
          }),
        );
    }, [N]),
    h.useEffect(() => {
      j((Z) =>
        Object.assign(Object.assign({}, Z), {
          cursor: c && B({ piece: e, sourceSquare: t }) ? "-webkit-grab" : "default",
        }),
      );
    }, [t, N, c]));
  function ue() {
    return { sourceSq: i[t] };
  }
  return r.jsx(
    "div",
    Object.assign(
      { ref: c && De ? fe : null, onClick: () => p(e, t), "data-piece": e, style: z },
      {
        children:
          typeof d[e] == "function"
            ? d[e]({ squareWidth: s / 8, isDragging: oe, square: t })
            : r.jsx(
                "svg",
                Object.assign(
                  {
                    viewBox: "1 1 43 43",
                    width: s / 8,
                    height: s / 8,
                    style: { display: "block" },
                  },
                  { children: r.jsx("g", { children: d[e] }) },
                ),
              ),
      },
    ),
  );
}
function oo({ square: n, squareColor: e, setSquares: t, squareHasPremove: i, children: a }) {
  const c = h.useRef(null),
    {
      autoPromoteToQueen: s,
      boardWidth: o,
      boardOrientation: d,
      clearArrows: N,
      currentPosition: l,
      currentRightClickDown: u,
      customBoardStyle: f,
      customDarkSquareStyle: B,
      customDropSquareStyle: b,
      customLightSquareStyle: p,
      customPremoveDarkSquareStyle: V,
      customPremoveLightSquareStyle: G,
      customSquare: A,
      customSquareStyles: Q,
      drawNewArrow: _,
      handleSetPosition: z,
      handleSparePieceDrop: j,
      isWaitingForAnimation: De,
      lastPieceColour: oe,
      lastSquareDraggedOver: fe,
      onArrowDrawEnd: ie,
      onDragOverSquare: ue,
      onMouseOutSquare: Z,
      onMouseOverSquare: J,
      onPieceDrop: de,
      onPromotionCheck: $,
      onRightClickDown: ge,
      onRightClickUp: ae,
      onSquareClick: K,
      setLastSquareDraggedOver: pe,
      setPromoteFromSquare: H,
      setPromoteToSquare: X,
      setShowPromoteDialog: ye,
    } = Ze(),
    [{ isOver: F }, S] = $s(
      () => ({ accept: "piece", drop: E, collect: (v) => ({ isOver: !!v.isOver() }) }),
      [n, l, de, De, oe],
    );
  function E(v) {
    if (v.isSpare) {
      j(v.piece, n);
      return;
    }
    $(v.square, n, v.piece)
      ? s
        ? z(v.square, n, v.piece[0] === "w" ? "wQ" : "bQ")
        : (H(v.square), X(n), ye(!0))
      : z(v.square, n, v.piece, !0);
  }
  h.useEffect(() => {
    if (c.current) {
      const { x: v, y: W } = c.current.getBoundingClientRect();
      t((te) => Object.assign(Object.assign({}, te), { [n]: { x: v, y: W } }));
    }
  }, [o, d]);
  const ee = Object.assign(
    Object.assign(
      Object.assign(Object.assign({}, fo(n, d, f)), e === "black" ? B : p),
      i && (e === "black" ? V : G),
    ),
    F && b,
  );
  return r.jsx(
    "div",
    Object.assign(
      {
        ref: S,
        style: ee,
        "data-square-color": e,
        "data-square": n,
        onTouchMove: (v) => {
          var W;
          const te = v.touches[0],
            Se = document.elementsFromPoint(te.clientX, te.clientY),
            ce =
              (W = Se?.find((be) => be.getAttribute("data-square"))) === null || W === void 0
                ? void 0
                : W.getAttribute("data-square");
          ce && ce !== fe && (pe(ce), ue(ce));
        },
        onMouseOver: (v) => {
          (v.buttons === 2 && u && _(u, n),
            !(v.relatedTarget && v.currentTarget.contains(v.relatedTarget)) && J(n));
        },
        onMouseOut: (v) => {
          (v.relatedTarget && v.currentTarget.contains(v.relatedTarget)) || Z(n);
        },
        onMouseDown: (v) => {
          v.button === 2 && ge(n);
        },
        onMouseUp: (v) => {
          v.button === 2 && (u && ie(u, n), ae(n));
        },
        onDragEnter: () => ue(n),
        onClick: () => {
          const v = l[n];
          (K(n, v), N());
        },
        onContextMenu: (v) => {
          v.preventDefault();
        },
      },
      {
        children:
          typeof A == "string"
            ? r.jsx(
                A,
                Object.assign(
                  {
                    ref: c,
                    style: Object.assign(Object.assign(Object.assign({}, Ii(o)), Mi), !i && Q?.[n]),
                  },
                  { children: a },
                ),
              )
            : r.jsx(
                A,
                Object.assign(
                  {
                    ref: c,
                    square: n,
                    squareColor: e,
                    style: Object.assign(Object.assign(Object.assign({}, Ii(o)), Mi), !i && Q?.[n]),
                  },
                  { children: a },
                ),
              ),
      },
    ),
  );
}
const Mi = { display: "flex", justifyContent: "center" },
  Ii = (n) => ({ width: n / 8, height: n / 8 }),
  fo = (n, e, t) =>
    t?.borderRadius
      ? n === "a1"
        ? e === "white"
          ? { borderBottomLeftRadius: t.borderRadius }
          : { borderTopRightRadius: t.borderRadius }
        : n === "a8"
          ? e === "white"
            ? { borderTopLeftRadius: t.borderRadius }
            : { borderBottomRightRadius: t.borderRadius }
          : n === "h1"
            ? e === "white"
              ? { borderBottomRightRadius: t.borderRadius }
              : { borderTopLeftRadius: t.borderRadius }
            : n === "h8"
              ? e === "white"
                ? { borderTopRightRadius: t.borderRadius }
                : { borderBottomLeftRadius: t.borderRadius }
              : {}
      : {};
function No() {
  const [n, e] = h.useState({}),
    {
      arePremovesAllowed: t,
      boardOrientation: i,
      boardWidth: a,
      currentPosition: c,
      id: s,
      premoves: o,
      showBoardNotation: d,
    } = Ze(),
    N = h.useMemo(() => {
      const l = [];
      return t
        ? (o.forEach((u, f) => {
            const { sourceSq: B, targetSq: b, piece: p } = u,
              V = l.find((G) => {
                var A;
                return (
                  G.piece === p &&
                  ((A = G.premovesRoute.at(-1)) === null || A === void 0 ? void 0 : A.targetSq) ===
                    B
                );
              });
            V
              ? V.premovesRoute.push({ sourceSq: B, targetSq: b, index: f })
              : l.push({ piece: p, premovesRoute: [{ sourceSq: B, targetSq: b, index: f }] });
          }),
          l)
        : [];
    }, [o]);
  return r.jsx(
    "div",
    Object.assign(
      { "data-boardid": s },
      {
        children: [...Array(8)].map((l, u) =>
          r.jsx(
            "div",
            Object.assign(
              { style: { display: "flex", flexWrap: "nowrap", width: a } },
              {
                children: [...Array(8)].map((f, B) => {
                  const b = i === "black" ? Ut[7 - B] + (u + 1) : Ut[B] + (8 - u),
                    p = B % 2 === u % 2 ? "white" : "black",
                    V = o.find((A) => A.sourceSq === b || A.targetSq === b),
                    G = N.filter(({ premovesRoute: A }) => {
                      var Q;
                      return ((Q = A.at(-1)) === null || Q === void 0 ? void 0 : Q.targetSq) === b;
                    })
                      .sort((A, Q) => {
                        var _, z;
                        return (
                          ((_ = Q.premovesRoute.at(-1)) === null || _ === void 0
                            ? void 0
                            : _.index) -
                          ((z = A.premovesRoute.at(-1)) === null || z === void 0 ? void 0 : z.index)
                        );
                      })
                      .at(0);
                  return r.jsxs(
                    oo,
                    Object.assign(
                      { square: b, squareColor: p, setSquares: e, squareHasPremove: !!V },
                      {
                        children: [
                          !V && c[b] && r.jsx(Ki, { piece: c[b], square: b, squares: n }),
                          G &&
                            r.jsx(Ki, {
                              isPremovedPiece: !0,
                              piece: G.piece,
                              square: b,
                              squares: n,
                            }),
                          d && r.jsx(Jc, { row: u, col: B }),
                        ],
                      },
                    ),
                    `${B}${u}`,
                  );
                }),
              },
            ),
            u.toString(),
          ),
        ),
      },
    ),
  );
}
const lo = () => {
  const { arrows: n, newArrow: e, boardOrientation: t, boardWidth: i, customArrowColor: a } = Ze(),
    c = [...n, e].filter(Boolean);
  return r.jsx(
    "svg",
    Object.assign(
      {
        width: i,
        height: i,
        style: { position: "absolute", top: "0", left: "0", pointerEvents: "none", zIndex: "10" },
      },
      {
        children: c.map((s, o) => {
          const [d, N, l] = s;
          if (d === N) return null;
          const u = zn(t, i, d),
            f = zn(t, i, N);
          let B = i / 32;
          const b = o === n.length;
          n.some((Q) => Q[0] !== d && Q[1] === N) && !b && (B = i / 16);
          const p = f.x - u.x,
            V = f.y - u.y,
            G = Math.hypot(V, p),
            A = { x: u.x + (p * (G - B)) / G, y: u.y + (V * (G - B)) / G };
          return r.jsxs(
            h.Fragment,
            {
              children: [
                r.jsx(
                  "marker",
                  Object.assign(
                    {
                      id: `arrowhead-${o}`,
                      markerWidth: "2",
                      markerHeight: "2.5",
                      refX: "1.25",
                      refY: "1.25",
                      orient: "auto",
                    },
                    {
                      children: r.jsx("polygon", {
                        points: "0.3 0, 2 1.25, 0.3 2.5",
                        fill: l ?? a,
                      }),
                    },
                  ),
                ),
                r.jsx("line", {
                  x1: u.x,
                  y1: u.y,
                  x2: A.x,
                  y2: A.y,
                  opacity: b ? "0.5" : "0.65",
                  stroke: l ?? a,
                  strokeWidth: b ? (0.9 * i) / 40 : i / 40,
                  markerEnd: `url(#arrowhead-${o})`,
                }),
              ],
            },
            `${d}-${N}${b ? "-active" : ""}`,
          );
        }),
      },
    ),
  );
};
function go({ option: n }) {
  const [e, t] = h.useState(!1),
    {
      boardWidth: i,
      chessPieces: a,
      customDarkSquareStyle: c,
      customLightSquareStyle: s,
      handleSetPosition: o,
      onPromotionPieceSelect: d,
      promoteFromSquare: N,
      promoteToSquare: l,
      promotionDialogVariant: u,
    } = Ze(),
    f = () => {
      switch (n[1]) {
        case "Q":
          return c.backgroundColor;
        case "R":
          return s.backgroundColor;
        case "N":
          return u === "default" ? s.backgroundColor : c.backgroundColor;
        case "B":
          return u === "default" ? c.backgroundColor : s.backgroundColor;
      }
    };
  return r.jsx(
    "div",
    Object.assign(
      {
        onClick: () => {
          d(n, N ?? void 0, l ?? void 0) && o(N, l, n, !0);
        },
        onMouseOver: () => t(!0),
        onMouseOut: () => t(!1),
        "data-piece": n,
        style: {
          cursor: "pointer",
          backgroundColor: e ? f() : `${f()}aa`,
          borderRadius: "4px",
          transition: "all 0.1s ease-out",
        },
      },
      {
        children:
          typeof a[n] == "function"
            ? r.jsx(
                "div",
                Object.assign(
                  {
                    style: {
                      transition: "all 0.1s ease-out",
                      transform: e ? "scale(1)" : "scale(0.85)",
                    },
                  },
                  { children: a[n]({ squareWidth: i / 8, isDragging: !1 }) },
                ),
              )
            : r.jsx(
                "svg",
                Object.assign(
                  {
                    viewBox: "1 1 43 43",
                    width: i / 8,
                    height: i / 8,
                    style: {
                      transition: "all 0.1s ease-out",
                      transform: e ? "scale(1)" : "scale(0.85)",
                    },
                  },
                  { children: r.jsx("g", { children: a[n] }) },
                ),
              ),
      },
    ),
  );
}
function ho() {
  const {
      boardOrientation: n,
      boardWidth: e,
      promotionDialogVariant: t,
      promoteToSquare: i,
    } = Ze(),
    a = i?.[1] === "1" ? "b" : "w",
    c = [`${a ?? "w"}Q`, `${a ?? "w"}R`, `${a ?? "w"}N`, `${a ?? "w"}B`],
    s = {
      default: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        transform: `translate(${-e / 8}px, ${-e / 8}px)`,
      },
      vertical: { transform: `translate(${-e / 16}px, ${-e / 16}px)` },
      modal: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transform: `translate(0px, ${(3 * e) / 8}px)`,
        width: "100%",
        height: `${e / 4}px`,
        top: 0,
        backgroundColor: "white",
        left: 0,
      },
    },
    o = zn(n, e, i || "a8");
  return r.jsx(
    "div",
    Object.assign(
      {
        style: Object.assign(
          { position: "absolute", top: `${o?.y}px`, left: `${o?.x}px`, zIndex: 1e3 },
          s[t],
        ),
        title: "Choose promotion piece",
      },
      { children: c.map((d) => r.jsx(go, { option: d }, d)) },
    ),
  );
}
const Bo = {
  whiteKing: r.jsx(
    "svg",
    Object.assign(
      {
        xmlns: "http://www.w3.org/2000/svg",
        version: "1.1",
        style: {
          shapeRendering: "geometricPrecision",
          textRendering: "geometricPrecision",
          imageRendering: "crisp-edges",
        },
        viewBox: "0 0 4210 12970",
        x: "0px",
        y: "0px",
        fillRule: "evenodd",
        clipRule: "evenodd",
        width: "250",
        height: "250",
      },
      {
        children: r.jsx("g", {
          children: r.jsx("path", {
            style: { fill: "black", fillRule: "nonzero" },
            d: "M2105 0c169,0 286,160 249,315l200 0c-172,266 -231,479 -256,792 315,-24 530,-86 792,-255l0 897c-265,-171 -479,-231 -792,-256 18,234 75,495 185,682l339 0c233,0 369,269 225,456l545 0 -595 1916c130,94 158,275 59,402 465,0 416,568 51,568l-334 0 465 2867 332 0c250,0 381,306 199,485 162,63 273,220 273,399l0 633 168 0 0 475c-1403,0 -2807,0 -4210,0l0 -475 167 0 0 -633c0,-179 112,-336 274,-399 -181,-178 -52,-485 199,-485l332 0 465 -2867 -335 0c-353,0 -418,-568 51,-568 -98,-127 -70,-308 59,-402l-594 -1916c181,0 363,0 545,0 -144,-187 -9,-456 225,-456l339 0c110,-187 167,-448 185,-682 -315,25 -530,87 -793,256l0 -897c266,171 480,231 793,255 -25,-315 -87,-529 -256,-792l199 0c-36,-155 81,-315 250,-315zm-1994 10012l0 253 3988 0 0 -253c-1330,0 -2659,0 -3988,0zm484 -1060c-174,0 -316,142 -316,316l0 633 3652 0 0 -633c0,-174 -142,-316 -316,-316 -1007,0 -2013,0 -3020,0zm45 -457c-230,0 -225,345 0,345l2930 0c230,0 225,-345 0,-345 -977,0 -1953,0 -2930,0zm2020 -2978l-1111 0 -465 2867 2041 0 -465 -2867zm-1558 -456c-229,0 -224,345 0,345 669,0 1337,0 2005,0 230,0 225,-345 0,-345 -668,0 -1336,0 -2005,0zm1730 -457l-1454 0c-229,0 -224,345 0,345l1454 0c229,0 224,-345 0,-345zm-2064 -1862l544 1751c529,0 1057,0 1586,0l544 -1751c-892,0 -1783,0 -2674,0zm1085 -567l504 0c-126,-247 -163,-526 -177,-800 273,15 553,52 800,177l0 -504c-247,126 -527,163 -800,177 14,-273 51,-552 177,-799 -168,0 -336,0 -504,0 125,247 162,526 177,799 -274,-14 -553,-51 -800,-177l0 504c247,-125 527,-162 800,-177 -15,274 -52,553 -177,800zm969 111l-1434 0c-230,0 -225,345 0,345l1434 0c230,0 225,-345 0,-345zm-717 -2175c-105,0 -175,109 -133,204l266 0c42,-96 -30,-205 -133,-204z",
          }),
        }),
      },
    ),
  ),
};
function uo({ children: n }) {
  try {
    return r.jsx(r.Fragment, { children: n });
  } catch (e) {
    return (console.log(e), r.jsx(wa, { showError: !0 }));
  }
}
function wa({ showError: n = !1 }) {
  return r.jsxs(
    "div",
    Object.assign(
      {
        style: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        },
      },
      {
        children: [
          r.jsx(
            "div",
            Object.assign(
              { style: { width: 250, height: 250, transform: "rotate(90deg)" } },
              { children: Bo.whiteKing },
            ),
          ),
          n && r.jsx("h1", { children: "Something went wrong" }),
        ],
      },
    ),
  );
}
function bo() {
  const n = h.useRef(null),
    {
      boardWidth: e,
      clearCurrentRightClickDown: t,
      onPromotionPieceSelect: i,
      setShowPromoteDialog: a,
      showPromoteDialog: c,
      customBoardStyle: s,
    } = Ze();
  return (
    h.useEffect(() => {
      function o(d) {
        n.current && !n.current.contains(d.target) && t();
      }
      return (
        document.addEventListener("mouseup", o),
        () => {
          document.removeEventListener("mouseup", o);
        }
      );
    }, []),
    e
      ? r.jsx(
          "div",
          Object.assign(
            { style: { perspective: "1000px" } },
            {
              children: r.jsxs(
                "div",
                Object.assign(
                  {
                    ref: n,
                    style: Object.assign(Object.assign({ position: "relative" }, mo(e)), s),
                  },
                  {
                    children: [
                      r.jsx(No, {}),
                      r.jsx(lo, {}),
                      c &&
                        r.jsxs(r.Fragment, {
                          children: [
                            r.jsx("div", {
                              onClick: () => {
                                (a(!1), i?.());
                              },
                              style: {
                                position: "absolute",
                                top: "0",
                                left: "0",
                                zIndex: "100",
                                backgroundColor: "rgba(22,21,18,.7)",
                                width: e,
                                height: e,
                              },
                            }),
                            r.jsx(ho, {}),
                          ],
                        }),
                    ],
                  },
                ),
              ),
            },
          ),
        )
      : r.jsx(wa, {})
  );
}
const mo = (n) => ({ cursor: "default", height: n, width: n });
var ot;
(function (n) {
  ((n.mouse = "mouse"), (n.touch = "touch"), (n.keyboard = "keyboard"));
})(ot || (ot = {}));
class xo {
  get delay() {
    var e;
    return (e = this.args.delay) !== null && e !== void 0 ? e : 0;
  }
  get scrollAngleRanges() {
    return this.args.scrollAngleRanges;
  }
  get getDropTargetElementsAtPoint() {
    return this.args.getDropTargetElementsAtPoint;
  }
  get ignoreContextMenu() {
    var e;
    return (e = this.args.ignoreContextMenu) !== null && e !== void 0 ? e : !1;
  }
  get enableHoverOutsideTarget() {
    var e;
    return (e = this.args.enableHoverOutsideTarget) !== null && e !== void 0 ? e : !1;
  }
  get enableKeyboardEvents() {
    var e;
    return (e = this.args.enableKeyboardEvents) !== null && e !== void 0 ? e : !1;
  }
  get enableMouseEvents() {
    var e;
    return (e = this.args.enableMouseEvents) !== null && e !== void 0 ? e : !1;
  }
  get enableTouchEvents() {
    var e;
    return (e = this.args.enableTouchEvents) !== null && e !== void 0 ? e : !0;
  }
  get touchSlop() {
    return this.args.touchSlop || 0;
  }
  get delayTouchStart() {
    var e, t, i, a;
    return (a =
      (i = (e = this.args) === null || e === void 0 ? void 0 : e.delayTouchStart) !== null &&
      i !== void 0
        ? i
        : (t = this.args) === null || t === void 0
          ? void 0
          : t.delay) !== null && a !== void 0
      ? a
      : 0;
  }
  get delayMouseStart() {
    var e, t, i, a;
    return (a =
      (i = (e = this.args) === null || e === void 0 ? void 0 : e.delayMouseStart) !== null &&
      i !== void 0
        ? i
        : (t = this.args) === null || t === void 0
          ? void 0
          : t.delay) !== null && a !== void 0
      ? a
      : 0;
  }
  get window() {
    if (this.context && this.context.window) return this.context.window;
    if (typeof window < "u") return window;
  }
  get document() {
    var e;
    if (!((e = this.context) === null || e === void 0) && e.document) return this.context.document;
    if (this.window) return this.window.document;
  }
  get rootElement() {
    var e;
    return ((e = this.args) === null || e === void 0 ? void 0 : e.rootElement) || this.document;
  }
  constructor(e, t) {
    ((this.args = e), (this.context = t));
  }
}
function Do(n, e, t, i) {
  return Math.sqrt(Math.pow(Math.abs(t - n), 2) + Math.pow(Math.abs(i - e), 2));
}
function po(n, e, t, i, a) {
  if (!a) return !1;
  const c = (Math.atan2(i - e, t - n) * 180) / Math.PI + 180;
  for (let s = 0; s < a.length; ++s) {
    const o = a[s];
    if (o && (o.start == null || c >= o.start) && (o.end == null || c <= o.end)) return !0;
  }
  return !1;
}
const Oo = { Left: 1 },
  Co = { Left: 0 };
function Qn(n) {
  return n.button === void 0 || n.button === Co.Left;
}
function Vo(n) {
  return n.buttons === void 0 || (n.buttons & Oo.Left) === 0;
}
function Ea(n) {
  return !!n.targetTouches;
}
const So = 1;
function vo(n) {
  const e = n.nodeType === So ? n : n.parentElement;
  if (!e) return;
  const { top: t, left: i } = e.getBoundingClientRect();
  return { x: i, y: t };
}
function Ao(n, e) {
  if (n.targetTouches.length === 1) return fn(n.targetTouches[0]);
  if (e && n.touches.length === 1 && n.touches[0].target === e.target) return fn(n.touches[0]);
}
function fn(n, e) {
  return Ea(n) ? Ao(n, e) : { x: n.clientX, y: n.clientY };
}
const Ti = (() => {
    let n = !1;
    try {
      addEventListener(
        "test",
        () => {},
        Object.defineProperty({}, "passive", {
          get() {
            return ((n = !0), !0);
          },
        }),
      );
    } catch {}
    return n;
  })(),
  zt = {
    [ot.mouse]: {
      start: "mousedown",
      move: "mousemove",
      end: "mouseup",
      contextmenu: "contextmenu",
    },
    [ot.touch]: { start: "touchstart", move: "touchmove", end: "touchend" },
    [ot.keyboard]: { keydown: "keydown" },
  };
class Ht {
  profile() {
    var e;
    return {
      sourceNodes: this.sourceNodes.size,
      sourcePreviewNodes: this.sourcePreviewNodes.size,
      sourcePreviewNodeOptions: this.sourcePreviewNodeOptions.size,
      targetNodes: this.targetNodes.size,
      dragOverTargetIds:
        ((e = this.dragOverTargetIds) === null || e === void 0 ? void 0 : e.length) || 0,
    };
  }
  get document() {
    return this.options.document;
  }
  setup() {
    const e = this.options.rootElement;
    e &&
      (M(!Ht.isSetUp, "Cannot have two Touch backends at the same time."),
      (Ht.isSetUp = !0),
      this.addEventListener(e, "start", this.getTopMoveStartHandler()),
      this.addEventListener(e, "start", this.handleTopMoveStartCapture, !0),
      this.addEventListener(e, "move", this.handleTopMove),
      this.addEventListener(e, "move", this.handleTopMoveCapture, !0),
      this.addEventListener(e, "end", this.handleTopMoveEndCapture, !0),
      this.options.enableMouseEvents &&
        !this.options.ignoreContextMenu &&
        this.addEventListener(e, "contextmenu", this.handleTopMoveEndCapture),
      this.options.enableKeyboardEvents &&
        this.addEventListener(e, "keydown", this.handleCancelOnEscape, !0));
  }
  teardown() {
    const e = this.options.rootElement;
    e &&
      ((Ht.isSetUp = !1),
      (this._mouseClientOffset = {}),
      this.removeEventListener(e, "start", this.handleTopMoveStartCapture, !0),
      this.removeEventListener(e, "start", this.handleTopMoveStart),
      this.removeEventListener(e, "move", this.handleTopMoveCapture, !0),
      this.removeEventListener(e, "move", this.handleTopMove),
      this.removeEventListener(e, "end", this.handleTopMoveEndCapture, !0),
      this.options.enableMouseEvents &&
        !this.options.ignoreContextMenu &&
        this.removeEventListener(e, "contextmenu", this.handleTopMoveEndCapture),
      this.options.enableKeyboardEvents &&
        this.removeEventListener(e, "keydown", this.handleCancelOnEscape, !0),
      this.uninstallSourceNodeRemovalObserver());
  }
  addEventListener(e, t, i, a = !1) {
    const c = Ti ? { capture: a, passive: !1 } : a;
    this.listenerTypes.forEach(function (s) {
      const o = zt[s][t];
      o && e.addEventListener(o, i, c);
    });
  }
  removeEventListener(e, t, i, a = !1) {
    const c = Ti ? { capture: a, passive: !1 } : a;
    this.listenerTypes.forEach(function (s) {
      const o = zt[s][t];
      o && e.removeEventListener(o, i, c);
    });
  }
  connectDragSource(e, t) {
    const i = this.handleMoveStart.bind(this, e);
    return (
      this.sourceNodes.set(e, t),
      this.addEventListener(t, "start", i),
      () => {
        (this.sourceNodes.delete(e), this.removeEventListener(t, "start", i));
      }
    );
  }
  connectDragPreview(e, t, i) {
    return (
      this.sourcePreviewNodeOptions.set(e, i),
      this.sourcePreviewNodes.set(e, t),
      () => {
        (this.sourcePreviewNodes.delete(e), this.sourcePreviewNodeOptions.delete(e));
      }
    );
  }
  connectDropTarget(e, t) {
    const i = this.options.rootElement;
    if (!this.document || !i) return () => {};
    const a = (c) => {
      if (!this.document || !i || !this.monitor.isDragging()) return;
      let s;
      switch (c.type) {
        case zt.mouse.move:
          s = { x: c.clientX, y: c.clientY };
          break;
        case zt.touch.move:
          var o, d;
          s = {
            x: ((o = c.touches[0]) === null || o === void 0 ? void 0 : o.clientX) || 0,
            y: ((d = c.touches[0]) === null || d === void 0 ? void 0 : d.clientY) || 0,
          };
          break;
      }
      const N = s != null ? this.document.elementFromPoint(s.x, s.y) : void 0,
        l = N && t.contains(N);
      if (N === t || l) return this.handleMove(c, e);
    };
    return (
      this.addEventListener(this.document.body, "move", a),
      this.targetNodes.set(e, t),
      () => {
        this.document &&
          (this.targetNodes.delete(e), this.removeEventListener(this.document.body, "move", a));
      }
    );
  }
  getTopMoveStartHandler() {
    return !this.options.delayTouchStart && !this.options.delayMouseStart
      ? this.handleTopMoveStart
      : this.handleTopMoveStartDelay;
  }
  installSourceNodeRemovalObserver(e) {
    (this.uninstallSourceNodeRemovalObserver(),
      (this.draggedSourceNode = e),
      (this.draggedSourceNodeRemovalObserver = new MutationObserver(() => {
        e &&
          !e.parentElement &&
          (this.resurrectSourceNode(), this.uninstallSourceNodeRemovalObserver());
      })),
      !(!e || !e.parentElement) &&
        this.draggedSourceNodeRemovalObserver.observe(e.parentElement, { childList: !0 }));
  }
  resurrectSourceNode() {
    this.document &&
      this.draggedSourceNode &&
      ((this.draggedSourceNode.style.display = "none"),
      this.draggedSourceNode.removeAttribute("data-reactid"),
      this.document.body.appendChild(this.draggedSourceNode));
  }
  uninstallSourceNodeRemovalObserver() {
    (this.draggedSourceNodeRemovalObserver && this.draggedSourceNodeRemovalObserver.disconnect(),
      (this.draggedSourceNodeRemovalObserver = void 0),
      (this.draggedSourceNode = void 0));
  }
  constructor(e, t, i) {
    ((this.getSourceClientOffset = (a) => {
      const c = this.sourceNodes.get(a);
      return c && vo(c);
    }),
      (this.handleTopMoveStartCapture = (a) => {
        Qn(a) && (this.moveStartSourceIds = []);
      }),
      (this.handleMoveStart = (a) => {
        Array.isArray(this.moveStartSourceIds) && this.moveStartSourceIds.unshift(a);
      }),
      (this.handleTopMoveStart = (a) => {
        if (!Qn(a)) return;
        const c = fn(a);
        (c &&
          (Ea(a) && (this.lastTargetTouchFallback = a.targetTouches[0]),
          (this._mouseClientOffset = c)),
          (this.waitingForDelay = !1));
      }),
      (this.handleTopMoveStartDelay = (a) => {
        if (!Qn(a)) return;
        const c =
          a.type === zt.touch.start ? this.options.delayTouchStart : this.options.delayMouseStart;
        ((this.timeout = setTimeout(this.handleTopMoveStart.bind(this, a), c)),
          (this.waitingForDelay = !0));
      }),
      (this.handleTopMoveCapture = () => {
        this.dragOverTargetIds = [];
      }),
      (this.handleMove = (a, c) => {
        this.dragOverTargetIds && this.dragOverTargetIds.unshift(c);
      }),
      (this.handleTopMove = (a) => {
        if ((this.timeout && clearTimeout(this.timeout), !this.document || this.waitingForDelay))
          return;
        const { moveStartSourceIds: c, dragOverTargetIds: s } = this,
          o = this.options.enableHoverOutsideTarget,
          d = fn(a, this.lastTargetTouchFallback);
        if (!d) return;
        if (
          this._isScrolling ||
          (!this.monitor.isDragging() &&
            po(
              this._mouseClientOffset.x || 0,
              this._mouseClientOffset.y || 0,
              d.x,
              d.y,
              this.options.scrollAngleRanges,
            ))
        ) {
          this._isScrolling = !0;
          return;
        }
        if (
          (!this.monitor.isDragging() &&
            this._mouseClientOffset.hasOwnProperty("x") &&
            c &&
            Do(this._mouseClientOffset.x || 0, this._mouseClientOffset.y || 0, d.x, d.y) >
              (this.options.touchSlop ? this.options.touchSlop : 0) &&
            ((this.moveStartSourceIds = void 0),
            this.actions.beginDrag(c, {
              clientOffset: this._mouseClientOffset,
              getSourceClientOffset: this.getSourceClientOffset,
              publishSource: !1,
            })),
          !this.monitor.isDragging())
        )
          return;
        const N = this.sourceNodes.get(this.monitor.getSourceId());
        (this.installSourceNodeRemovalObserver(N),
          this.actions.publishDragSource(),
          a.cancelable && a.preventDefault());
        const l = (s || []).map((b) => this.targetNodes.get(b)).filter((b) => !!b),
          u = this.options.getDropTargetElementsAtPoint
            ? this.options.getDropTargetElementsAtPoint(d.x, d.y, l)
            : this.document.elementsFromPoint(d.x, d.y),
          f = [];
        for (const b in u) {
          if (!u.hasOwnProperty(b)) continue;
          let p = u[b];
          for (p != null && f.push(p); p;)
            ((p = p.parentElement), p && f.indexOf(p) === -1 && f.push(p));
        }
        const B = f
          .filter((b) => l.indexOf(b) > -1)
          .map((b) => this._getDropTargetId(b))
          .filter((b) => !!b)
          .filter((b, p, V) => V.indexOf(b) === p);
        if (o)
          for (const b in this.targetNodes) {
            const p = this.targetNodes.get(b);
            if (N && p && p.contains(N) && B.indexOf(b) === -1) {
              B.unshift(b);
              break;
            }
          }
        (B.reverse(), this.actions.hover(B, { clientOffset: d }));
      }),
      (this._getDropTargetId = (a) => {
        const c = this.targetNodes.keys();
        let s = c.next();
        for (; s.done === !1;) {
          const o = s.value;
          if (a === this.targetNodes.get(o)) return o;
          s = c.next();
        }
      }),
      (this.handleTopMoveEndCapture = (a) => {
        if (((this._isScrolling = !1), (this.lastTargetTouchFallback = void 0), !!Vo(a))) {
          if (!this.monitor.isDragging() || this.monitor.didDrop()) {
            this.moveStartSourceIds = void 0;
            return;
          }
          (a.cancelable && a.preventDefault(),
            (this._mouseClientOffset = {}),
            this.uninstallSourceNodeRemovalObserver(),
            this.actions.drop(),
            this.actions.endDrag());
        }
      }),
      (this.handleCancelOnEscape = (a) => {
        a.key === "Escape" &&
          this.monitor.isDragging() &&
          ((this._mouseClientOffset = {}),
          this.uninstallSourceNodeRemovalObserver(),
          this.actions.endDrag());
      }),
      (this.options = new xo(i, t)),
      (this.actions = e.getActions()),
      (this.monitor = e.getMonitor()),
      (this.sourceNodes = new Map()),
      (this.sourcePreviewNodes = new Map()),
      (this.sourcePreviewNodeOptions = new Map()),
      (this.targetNodes = new Map()),
      (this.listenerTypes = []),
      (this._mouseClientOffset = {}),
      (this._isScrolling = !1),
      this.options.enableMouseEvents && this.listenerTypes.push(ot.mouse),
      this.options.enableTouchEvents && this.listenerTypes.push(ot.touch),
      this.options.enableKeyboardEvents && this.listenerTypes.push(ot.keyboard));
  }
}
const Go = function (e, t = {}, i = {}) {
    return new Ht(e, t, i);
  },
  yo = h.createContext({ isCustomDndProviderSet: !1 }),
  ko = ({ children: n }) => r.jsx(r.Fragment, { children: n }),
  wo = ({ customDndBackend: n, customDndBackendOptions: e, children: t }) => {
    const [i, a] = h.useState(),
      [c, s] = h.useState(!1),
      [o, d] = h.useState(!1),
      { isCustomDndProviderSet: N } = h.useContext(yo);
    h.useEffect(() => {
      (d("ontouchstart" in window), s(!0), a(window));
    }, []);
    const l = N ? ko : Bs;
    return c
      ? i
        ? r.jsx(
            l,
            Object.assign(
              { backend: n || (o ? Go : so), context: i, options: n ? e : void 0 },
              { children: t },
            ),
          )
        : r.jsx(r.Fragment, { children: t })
      : null;
  };
function Eo({ boardContainer: n }) {
  const { boardWidth: e, chessPieces: t, id: i, snapToCursor: a, allowDragOutsideBoard: c } = Ze(),
    s = Ms((f) => ({
      item: f.getItem(),
      clientOffset: f.getClientOffset(),
      sourceClientOffset: f.getSourceClientOffset(),
      isDragging: f.isDragging(),
    })),
    { isDragging: o, item: d, clientOffset: N, sourceClientOffset: l } = s,
    u = h.useCallback(
      (f, B) => {
        if (!f || !B) return { display: "none" };
        let { x: b, y: p } = a ? f : B;
        const V = e / 8 / 2;
        if ((a && ((b -= V), (p -= V)), !c)) {
          const { left: A, top: Q } = n,
            _ = A - V,
            z = Q - V,
            j = A + e - V,
            De = Q + e - V;
          ((b = Math.max(_, Math.min(b, j))), (p = Math.max(z, Math.min(p, De))));
        }
        const G = `translate(${b}px, ${p}px)`;
        return { transform: G, WebkitTransform: G, touchAction: "none" };
      },
      [e, c, a, n],
    );
  return o && d.id === i
    ? r.jsx(
        "div",
        Object.assign(
          { style: { position: "fixed", pointerEvents: "none", zIndex: 10, left: 0, top: 0 } },
          {
            children: r.jsx(
              "div",
              Object.assign(
                { style: u(N, l) },
                {
                  children:
                    typeof t[d.piece] == "function"
                      ? t[d.piece]({ squareWidth: e / 8, isDragging: !0 })
                      : r.jsx(
                          "svg",
                          Object.assign(
                            { viewBox: "1 1 43 43", width: e / 8, height: e / 8 },
                            { children: r.jsx("g", { children: t[d.piece] }) },
                          ),
                        ),
                },
              ),
            ),
          },
        ),
      )
    : null;
}
const Qo = h.forwardRef((n, e) => {
    const { customDndBackend: t, customDndBackendOptions: i, onBoardWidthChange: a } = n,
      c = Tc(n, ["customDndBackend", "customDndBackendOptions", "onBoardWidthChange"]),
      [s, o] = h.useState(n.boardWidth),
      d = h.useRef(null),
      N = h.useRef(null),
      [l, u] = h.useState({ left: 0, top: 0 }),
      f = h.useMemo(() => {
        var B;
        return (B = d.current) === null || B === void 0 ? void 0 : B.getBoundingClientRect();
      }, [d.current]);
    return (
      h.useEffect(() => {
        s && a?.(s);
      }, [s]),
      h.useEffect(() => {
        u({ left: f?.left ? f?.left : 0, top: f?.top ? f?.top : 0 });
      }, [f]),
      h.useEffect(() => {
        var B;
        if (
          n.boardWidth === void 0 &&
          !((B = d.current) === null || B === void 0) &&
          B.offsetWidth
        ) {
          const b = new ResizeObserver(() => {
            var p;
            o((p = d.current) === null || p === void 0 ? void 0 : p.offsetWidth);
          });
          return (
            b.observe(d.current),
            () => {
              b.disconnect();
            }
          );
        }
      }, [d.current]),
      r.jsx(uo, {
        children: r.jsxs(
          "div",
          Object.assign(
            { ref: N, style: { display: "flex", flexDirection: "column", width: "100%" } },
            {
              children: [
                r.jsx("div", { ref: d, style: { width: "100%" } }),
                r.jsx(
                  wo,
                  Object.assign(
                    { customDndBackend: t, customDndBackendOptions: i },
                    {
                      children:
                        s &&
                        r.jsxs(
                          Yc,
                          Object.assign(
                            { boardWidth: s },
                            c,
                            { ref: e },
                            { children: [r.jsx(Eo, { boardContainer: l }), r.jsx(bo, {})] },
                          ),
                        ),
                    },
                  ),
                ),
              ],
            },
          ),
        ),
      })
    );
  }),
  Ro = "rgba(160, 230, 255, 0.55)",
  Rn = "rgba(255, 200, 100, 0.28)",
  Wn = "rgba(140, 225, 255, 0.55)",
  Pn = "rgba(140, 255, 190, 0.30)",
  $e = 16,
  zi = ["a", "b", "c", "d", "e", "f", "g", "h"],
  _i = ["8", "7", "6", "5", "4", "3", "2", "1"],
  Fi = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    color: "rgba(150, 195, 225, 0.55)",
    userSelect: "none",
  },
  ji = `radial-gradient(circle, ${Wn} 26%, transparent 27%)`,
  Hi = `radial-gradient(circle, transparent 56%, ${Wn} 57%, ${Wn} 68%, transparent 69%)`;
function $i(n, e) {
  return { background: e ? `${n}, linear-gradient(${e}, ${e})` : n, cursor: "pointer" };
}
const Po = {
    background:
      "linear-gradient(135deg, rgba(160, 210, 240, 0.22) 0%, rgba(130, 190, 230, 0.16) 100%)",
    boxShadow: "inset 0 0 12px rgba(180, 230, 255, 0.1), inset 1px 1px 0 rgba(255, 255, 255, 0.08)",
  },
  Lo = {
    background: "linear-gradient(135deg, rgba(50, 90, 130, 0.45) 0%, rgba(35, 70, 110, 0.38) 100%)",
    boxShadow: "inset 0 0 12px rgba(60, 140, 180, 0.08), inset -1px -1px 0 rgba(0, 0, 0, 0.12)",
  },
  Ko = {
    borderRadius: "12px",
    boxShadow: `
    0 0 40px rgba(120, 200, 235, 0.15),
    0 0 80px rgba(120, 200, 235, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(180, 230, 255, 0.2)
  `,
    background: "linear-gradient(145deg, rgba(20, 40, 60, 0.85) 0%, rgba(10, 25, 45, 0.9) 100%)",
    padding: "2px",
    overflow: "hidden",
  },
  Mo = `
/* Holographic shimmer effect on the board */
.nori-glass-board {
  position: relative;
}

.nori-glass-board::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: linear-gradient(
    105deg,
    transparent 20%,
    rgba(180, 230, 255, 0.03) 35%,
    rgba(200, 240, 255, 0.06) 40%,
    rgba(180, 230, 255, 0.03) 45%,
    transparent 60%
  );
  pointer-events: none;
  z-index: 10;
  animation: holographicShimmer 8s ease-in-out infinite;
}

@keyframes holographicShimmer {
  0%, 100% { opacity: 0.4; transform: translateX(-20%); }
  50% { opacity: 0.8; transform: translateX(120%); }
}

/* Piece styling - clean with subtle depth */
.nori-glass-board [data-piece] {
  will-change: transform;
}

.nori-glass-board [data-piece] svg {
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
  transition: filter 0.15s ease-out, transform 0.15s ease-out;
  transform-origin: center center;
}

.nori-glass-board [data-piece]:hover svg {
  filter: drop-shadow(0 0 8px rgba(160, 220, 255, 0.5)) drop-shadow(0 3px 4px rgba(0, 0, 0, 0.4));
  transform: scale(1.04);
}

/* Subtle grid lines for futuristic feel */
.nori-glass-board [data-square] {
  position: relative;
}

.nori-glass-board [data-square]::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid rgba(120, 200, 235, 0.08);
  pointer-events: none;
}

/* Selected square glow */
.nori-glass-board [data-square][style*="background: rgba(160, 230, 255"]::before {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 16px rgba(160, 230, 255, 0.4);
  pointer-events: none;
}

/* Legal-move destinations (dot/ring hints carry cursor: pointer) glow on hover */
.nori-glass-board [data-square][style*="cursor: pointer"]:hover::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(140, 225, 255, 0.1);
  box-shadow: inset 0 0 14px rgba(140, 225, 255, 0.3);
  pointer-events: none;
}

/* Last move highlight - warm amber holographic trail */
.nori-glass-board [data-square][style*="background: rgba(255, 200, 100"]::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 210, 120, 0.12) 0%, rgba(255, 180, 80, 0.06) 100%);
  box-shadow: 
    inset 0 0 20px rgba(255, 200, 100, 0.2),
    inset 0 0 6px rgba(255, 220, 140, 0.25);
  pointer-events: none;
  animation: lastMovePulse 3s ease-in-out infinite;
}

@keyframes lastMovePulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Border accent for last move squares */
.nori-glass-board [data-square][style*="background: rgba(255, 200, 100"]::after {
  border-color: rgba(255, 200, 100, 0.25);
}

/* Tutorial gate squares - mint pulse guiding the taught move */
.nori-glass-board [data-square][style*="rgba(140, 255, 190"]::before {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow:
    inset 0 0 22px rgba(140, 255, 190, 0.4),
    inset 0 0 6px rgba(190, 255, 220, 0.35);
  pointer-events: none;
  animation: tutorialHintPulse 1.6s ease-in-out infinite;
}

.nori-glass-board [data-square][style*="rgba(140, 255, 190"]::after {
  border-color: rgba(140, 255, 190, 0.35);
}

@keyframes tutorialHintPulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
`,
  Io = `
/* react-chessboard renders its drag preview using a fixed-position "CustomDragLayer".
   If any ancestor has a CSS transform (our OS windows do via Framer Motion), "fixed"
   becomes relative to that ancestor, causing cursor offset. We hide the built-in layer
   and render our own drag layer via a portal to document.body. */
.chessboard-dnd-drag-layer-fix [style*="position: fixed"][style*="pointer-events: none"][style*="z-index: 10"],
.chessboard-dnd-drag-layer-fix [style*="position:fixed"][style*="pointer-events:none"][style*="z-index:10"] {
  display: none !important;
}
`;
function To({ isActive: n, svgMarkup: e, pieceSize: t, snapToCursor: i, cursorRef: a }) {
  const c = h.useRef(null);
  return (
    h.useEffect(() => {
      if (!n) return;
      const s = () => {
        const N = c.current,
          l = a.current;
        if (!N || !l) return;
        let u = l.x,
          f = l.y;
        (i && t > 0 && ((u -= t / 2), (f -= t / 2)),
          (N.style.transform = `translate(${u}px, ${f}px)`));
      };
      s();
      let o;
      const d = () => {
        (s(), (o = requestAnimationFrame(d)));
      };
      return ((o = requestAnimationFrame(d)), () => cancelAnimationFrame(o));
    }, [n, t, i, a]),
    !n || !e
      ? null
      : ic.createPortal(
          r.jsx("div", {
            style: { position: "fixed", pointerEvents: "none", zIndex: 99999, left: 0, top: 0 },
            children: r.jsx("div", {
              ref: c,
              style: { willChange: "transform", touchAction: "none" },
              dangerouslySetInnerHTML: { __html: e },
            }),
          }),
          document.body,
        )
  );
}
const Wi = ["q", "r", "b", "n"];
function zo({ color: n, squareSize: e, expandDown: t, onSelect: i }) {
  const a = n === "w" ? "w" : "b",
    c = { q: "Queen", r: "Rook", b: "Bishop", n: "Knight" },
    s = { wq: "♕", wr: "♖", wb: "♗", wn: "♘", bq: "♛", br: "♜", bb: "♝", bn: "♞" },
    o = Math.max(e * 0.9, 40),
    d = o * 0.7;
  return r.jsx("div", {
    style: {
      position: "absolute",
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      padding: "5px",
      borderRadius: "10px",
      background: "linear-gradient(145deg, rgba(25, 45, 65, 0.98) 0%, rgba(12, 28, 48, 0.99) 100%)",
      boxShadow: `
          0 0 40px rgba(120, 200, 235, 0.35),
          0 8px 32px rgba(0, 0, 0, 0.6),
          0 2px 8px rgba(0, 0, 0, 0.4),
          inset 0 0 0 1px rgba(180, 230, 255, 0.35),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `,
      zIndex: 100,
      ...(t ? { top: 0 } : { bottom: 0 }),
    },
    children: (t ? Wi : [...Wi].reverse()).map((N) =>
      r.jsx(
        "button",
        {
          onClick: () => i(N),
          title: c[N],
          style: {
            width: o,
            height: o,
            fontSize: d,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, rgba(60, 100, 140, 0.5) 0%, rgba(40, 70, 110, 0.45) 100%)",
            border: "1px solid rgba(120, 200, 235, 0.25)",
            borderRadius: "6px",
            cursor: "pointer",
            color: n === "w" ? "#fff" : "#222",
            textShadow: n === "w" ? "0 2px 4px rgba(0,0,0,0.5)" : "0 1px 2px rgba(255,255,255,0.3)",
            transition: "all 0.12s ease-out",
          },
          onMouseEnter: (l) => {
            ((l.currentTarget.style.background =
              "linear-gradient(135deg, rgba(80, 140, 180, 0.6) 0%, rgba(60, 100, 140, 0.55) 100%)"),
              (l.currentTarget.style.boxShadow = "0 0 12px rgba(160, 220, 255, 0.5)"),
              (l.currentTarget.style.transform = "scale(1.05)"));
          },
          onMouseLeave: (l) => {
            ((l.currentTarget.style.background =
              "linear-gradient(135deg, rgba(60, 100, 140, 0.5) 0%, rgba(40, 70, 110, 0.45) 100%)"),
              (l.currentTarget.style.boxShadow = "none"),
              (l.currentTarget.style.transform = "scale(1)"));
          },
          children: s[a + N],
        },
        N,
      ),
    ),
  });
}
function _o({ fen: n, orientation: e, draggable: t, lastMove: i, tutorialMove: a, onMove: c }) {
  const s = h.useMemo(() => new Te(n), [n]),
    [o, d] = h.useState(null),
    [N, l] = h.useState([]),
    [u, f] = h.useState(null),
    B = h.useRef(null),
    b = h.useRef(null),
    p = h.useRef(!1),
    [V, G] = h.useState(!1),
    [A, Q] = h.useState(null),
    [_, z] = h.useState(0),
    j = h.useRef(null);
  (h.useEffect(() => {
    (d(null), l([]));
  }, [n]),
    h.useEffect(() => {
      const S = (W, te) => {
          ((b.current = { x: W, y: te }), p.current && (j.current = { x: W, y: te }));
        },
        E = (W) => {
          S(W.clientX, W.clientY);
        },
        ee = (W) => {
          const te = W.touches[0];
          te && S(te.clientX, te.clientY);
        },
        v = (W) => {
          S(W.clientX, W.clientY);
        };
      return (
        window.addEventListener("mousemove", E, { passive: !0 }),
        window.addEventListener("touchmove", ee, { passive: !0 }),
        window.addEventListener("drag", v, { passive: !0 }),
        window.addEventListener("dragover", v, { passive: !0 }),
        () => {
          (window.removeEventListener("mousemove", E),
            window.removeEventListener("touchmove", ee),
            window.removeEventListener("drag", v),
            window.removeEventListener("dragover", v));
        }
      );
    }, []));
  const De = h.useMemo(() => {
      const S = {};
      (i && ((S[i.from] = { background: Rn }), (S[i.to] = { background: Rn })),
        o && (S[o] = { background: Ro }));
      for (const E of N) {
        const ee = i && (E.to === i.from || E.to === i.to);
        S[E.to] = $i(E.capture ? Hi : ji, ee ? Rn : void 0);
      }
      if (a) {
        S[a.from] = { background: Pn };
        const E = N.find((ee) => ee.to === a.to);
        S[a.to] = E ? $i(E.capture ? Hi : ji, Pn) : { background: Pn, cursor: "pointer" };
      }
      return S;
    }, [o, N, i, a]),
    oe = (S) =>
      S
        ? a && S !== a.from
          ? []
          : s.moves({ square: S, verbose: !0 }).map((E) => ({ to: E.to, capture: !!E.captured }))
        : [],
    fe = (S, E) => s.moves({ square: S, verbose: !0 }).some((v) => v.to === E && !!v.promotion),
    ie = () => {
      (d(null), l([]));
    },
    ue = (S) => {
      if (!t || u) return;
      if (o && N.some((ee) => ee.to === S)) {
        if (a && S !== a.to) {
          Ie("boardgames-chess-illegal-move");
          return;
        }
        if (fe(o, S)) {
          (Ie("boardgames-chess-promotion-dialog"), f({ from: o, to: S }), ie());
          return;
        }
        (c(o, S), ie());
        return;
      }
      if (o === S) {
        ie();
        return;
      }
      const E = oe(S);
      (d(E.length ? S : null), l(E));
    },
    Z = (S, E) =>
      t
        ? a && (S !== a.from || E !== a.to)
          ? (S !== E && Ie("boardgames-chess-illegal-move"), !1)
          : fe(S, E)
            ? (Ie("boardgames-chess-promotion-dialog"), f({ from: S, to: E }), !0)
            : (c(S, E), ie(), !0)
        : !1,
    J = () => !1,
    de = (S) => {
      u && (c(u.from, u.to, S), f(null), ie());
    },
    $ = () => {
      (f(null), ie());
    },
    ge = h.useMemo(() => (u ? (s.get(u.from)?.color ?? "w") : "w"), [u, s]),
    ae = h.useMemo(() => {
      if (!u) return !0;
      const S = u.to[1] === "8";
      return e === "white" ? S : !S;
    }, [u, e]),
    K = (S, E) => {
      Ie("boardgames-chess-piece-pickup");
      const ee = B.current,
        v = `[data-square="${E}"] [data-piece="${S}"] svg`,
        W = ee ? ee.querySelector(v) : null;
      Q(W?.outerHTML ?? null);
      const te = W?.getBoundingClientRect();
      (z((te && (te.width || te.height)) || 0), (p.current = !0), G(!0));
      const Se = b.current;
      Se && (j.current = Se);
      const ce = oe(E);
      (d(E), l(ce));
    },
    pe = (S, E) => {
      ((p.current = !1), G(!1), Q(null), z(0), (j.current = null), ie());
    },
    H = (S, E) => {
      const ee = S.charCodeAt(0) - 97,
        v = Number.parseInt(S[1], 10) - 1;
      return E === "white" ? { col: ee, row: 7 - v } : { col: 7 - ee, row: v };
    },
    X = h.useMemo(() => {
      if (!u) return null;
      const { col: S, row: E } = H(u.to, e);
      return { col: S, row: E };
    }, [u, e]),
    ye = e === "white" ? _i : [..._i].reverse(),
    F = e === "white" ? zi : [...zi].reverse();
  return r.jsxs("div", {
    style: {
      display: "grid",
      gridTemplateColumns: `${$e}px 1fr`,
      gridTemplateRows: `1fr ${$e}px`,
      width: "100%",
      height: "100%",
    },
    children: [
      r.jsx("div", {
        "aria-hidden": !0,
        style: { display: "flex", flexDirection: "column" },
        children: ye.map((S) => r.jsx("div", { style: Fi, children: S }, S)),
      }),
      r.jsxs("div", {
        ref: B,
        className: "chessboard-dnd-drag-layer-fix nori-glass-board",
        style: { position: "relative" },
        children: [
          r.jsx("style", { children: Io }),
          r.jsx("style", { children: Mo }),
          r.jsx(Qo, {
            id: "chess-game-board",
            position: n,
            boardOrientation: e,
            arePiecesDraggable: t,
            animationDuration: 280,
            snapToCursor: !0,
            customBoardStyle: Ko,
            customLightSquareStyle: Po,
            customDarkSquareStyle: Lo,
            customSquareStyles: De,
            showBoardNotation: !1,
            isDraggablePiece: ({ piece: S, sourceSquare: E }) =>
              S.startsWith(e === "white" ? "w" : "b") ? !a || E === a.from : !1,
            onSquareClick: ue,
            onPieceDrop: Z,
            onPieceDragBegin: K,
            onPieceDragEnd: pe,
            onPromotionCheck: J,
          }),
          r.jsx(To, { isActive: V, svgMarkup: A, pieceSize: _, snapToCursor: !0, cursorRef: j }),
          u &&
            X &&
            r.jsxs(r.Fragment, {
              children: [
                r.jsx("div", { style: { position: "absolute", inset: 0, zIndex: 99 }, onClick: $ }),
                r.jsx("div", {
                  style: {
                    position: "absolute",
                    top: `${X.row * 12.5}%`,
                    left: `${X.col * 12.5}%`,
                    width: "12.5%",
                    pointerEvents: "auto",
                  },
                  children: r.jsx(zo, {
                    color: ge,
                    squareSize: B.current ? B.current.offsetWidth / 8 : 60,
                    expandDown: ae,
                    onSelect: de,
                  }),
                }),
              ],
            }),
        ],
      }),
      r.jsx("div", {}),
      r.jsx("div", {
        "aria-hidden": !0,
        style: { display: "flex" },
        children: F.map((S) => r.jsx("div", { style: Fi, children: S }, S)),
      }),
    ],
  });
}
function Fo() {
  const n = h.useRef(null),
    [e, t] = h.useState({ width: 0, height: 0 });
  return (
    h.useLayoutEffect(() => {
      const i = n.current;
      if (!i) return;
      t({ width: i.clientWidth, height: i.clientHeight });
      const a = new ResizeObserver((c) => {
        const s = c[0];
        s && t({ width: s.contentRect.width, height: s.contentRect.height });
      });
      return (a.observe(i), () => a.disconnect());
    }, []),
    [n, e]
  );
}
const Ln = ec()((n) => ({
    restartRequested: !1,
    requestRestart: () => n({ restartRequested: !0 }),
    clearRestartRequest: () => n({ restartRequested: !1 }),
  })),
  jo = `eco	name	pgn
A00	Amar Opening	1. Nh3
A00	Amar Opening: Paris Gambit	1. Nh3 d5 2. g3 e5 3. f4
A00	Amar Opening: Paris Gambit, Gent Gambit	1. Nh3 d5 2. g3 e5 3. f4 Bxh3 4. Bxh3 exf4 5. O-O fxg3 6. hxg3
A00	Amsterdam Attack	1. e3 e5 2. c4 d6 3. Nc3 Nc6 4. b3 Nf6
A00	Anderssen's Opening	1. a3
A00	Anderssen's Opening: Polish Gambit	1. a3 a5 2. b4
A00	Barnes Opening	1. f3
A00	Barnes Opening: Fool's Mate	1. f3 e5 2. g4 Qh4#
A00	Barnes Opening: Gedult Gambit	1. f3 d5 2. e4 g6 3. d4 dxe4 4. c3
A00	Barnes Opening: Gedult Gambit	1. f3 f5 2. e4 fxe4 3. Nc3
A00	Barnes Opening: Hammerschlag	1. f3 e5 2. Kf2
A00	Clemenz Opening	1. h3
A00	Clemenz Opening: Spike Lee Gambit	1. h3 h5 2. g4
A00	Creepy Crawly Formation: Classical Defense	1. h3 d5 2. a3 e5
A00	Formation: Hippopotamus Attack	1. a3 e5 2. b3 d5 3. c3 Nf6 4. d3 Nc6 5. e3 Bd6 6. f3 O-O 7. g3
A00	Formation: Shy Attack	1. a3 e5 2. g3 d5 3. Bg2 Nf6 4. d3 Nc6 5. Nd2 Bd6 6. e3 O-O 7. h3
A00	Global Opening	1. h3 e5 2. a3
A00	Grob Opening	1. g4
A00	Grob Opening: Alessi Gambit	1. g4 f5
A00	Grob Opening: Double Grob	1. g4 g5
A00	Grob Opening: Double Grob, Coca-Cola Gambit	1. g4 g5 2. f4
A00	Grob Opening: Grob Gambit	1. g4 d5 2. Bg2
A00	Grob Opening: Grob Gambit Declined	1. g4 d5 2. Bg2 c6
A00	Grob Opening: Grob Gambit, Basman Gambit	1. g4 d5 2. Bg2 h5 3. gxh5
A00	Grob Opening: Grob Gambit, Fritz Gambit	1. g4 d5 2. Bg2 Bxg4 3. c4
A00	Grob Opening: Grob Gambit, Fritz Gambit, Romford Countergambit	1. g4 d5 2. Bg2 Bxg4 3. c4 d4 4. Bxb7 Nd7 5. Bxa8 Qxa8
A00	Grob Opening: Grob Gambit, Keres Gambit	1. g4 d5 2. Bg2 e5 3. d4 exd4 4. c3
A00	Grob Opening: Grob Gambit, Richter-Grob Gambit	1. g4 d5 2. Bg2 c6 3. c4 dxc4 4. b3
A00	Grob Opening: Keene Defense	1. g4 d5 2. h3 e5 3. Bg2 c6
A00	Grob Opening: Keene Defense, Main Line	1. g4 d5 2. h3 e5 3. Bg2 c6 4. d4 e4 5. c4 Bd6 6. Nc3 Ne7
A00	Grob Opening: London Defense	1. g4 e5 2. h3 Nc6
A00	Grob Opening: Romford Countergambit	1. g4 d5 2. Bg2 Bxg4 3. c4 d4
A00	Grob Opening: Spike Attack	1. g4 d5 2. Bg2 c6 3. g5
A00	Grob Opening: Spike, Hurst Attack	1. g4 e5 2. Bg2 d5 3. c4
A00	Grob Opening: Zilbermints Gambit	1. g4 d5 2. e4 dxe4 3. Nc3
A00	Grob Opening: Zilbermints Gambit, Schiller Defense	1. g4 d5 2. e4 dxe4 3. Nc3 h5
A00	Grob Opening: Zilbermints Gambit, Zilbermints-Hartlaub Gambit	1. g4 d5 2. e4 dxe4 3. Nc3 e5 4. d3
A00	Hungarian Opening	1. g3
A00	Hungarian Opening: Asten Gambit	1. g3 Nc6 2. Nc3 d5 3. d4 e5 4. dxe5 d4 5. Ne4 f5
A00	Hungarian Opening: Burk Gambit	1. g3 e5 2. a3 d5 3. Nf3 e4 4. Nh4 Be7 5. d3
A00	Hungarian Opening: Bücker Gambit	1. g3 d5 2. Bg2 e5 3. b4
A00	Hungarian Opening: Catalan Formation	1. g3 d5 2. Bg2 e6
A00	Hungarian Opening: Dutch Defense	1. g3 f5
A00	Hungarian Opening: Indian Defense	1. g3 Nf6
A00	Hungarian Opening: Myers Defense	1. g3 g5
A00	Hungarian Opening: Pachman Gambit	1. g3 f5 2. e4 fxe4 3. Qh5+ g6
A00	Hungarian Opening: Paris Gambit	1. g3 e5 2. Nh3 d5 3. f4 Bxh3 4. Bxh3 exf4 5. O-O
A00	Hungarian Opening: Reversed Alekhine	1. g3 e5 2. Nf3
A00	Hungarian Opening: Reversed Brooklyn Defense, Brooklyn Benko Gambit	1. g3 e5 2. Nf3 e4 3. Ng1 Nf6 4. b4
A00	Hungarian Opening: Reversed Modern Defense	1. g3 d5 2. Bg2 c5
A00	Hungarian Opening: Reversed Norwegian Defense	1. g3 e5 2. Nf3 e4 3. Nh4
A00	Hungarian Opening: Sicilian Invitation	1. g3 c5
A00	Hungarian Opening: Slav Formation	1. g3 d5 2. Bg2 c6
A00	Hungarian Opening: Symmetrical Variation	1. g3 g6
A00	Hungarian Opening: Van Kuijk Gambit	1. g3 h5 2. Nf3 h4
A00	Hungarian Opening: Winterberg Gambit	1. g3 d5 2. Bg2 e5 3. c4 dxc4 4. b3
A00	Kádas Opening	1. h4
A00	Kádas Opening: Beginner's Trap	1. h4 d5 2. Rh3
A00	Kádas Opening: Koola-Koola Variation	1. h4 a5
A00	Kádas Opening: Kádas Gambit	1. h4 c5 2. b4
A00	Kádas Opening: Kádas Gambit	1. h4 d5 2. d4 c5 3. Nf3 cxd4 4. c3
A00	Kádas Opening: Kádas Gambit	1. h4 e5 2. d4 exd4 3. c3
A00	Kádas Opening: Myers Variation	1. h4 d5 2. d4 c5 3. e4
A00	Kádas Opening: Schneider Gambit	1. h4 g5
A00	Kádas Opening: Steinbok Gambit	1. h4 f5 2. e4 fxe4 3. d3
A00	Lasker Simul Special	1. g3 h5
A00	Mieses Opening	1. d3
A00	Mieses Opening: Myers Spike Attack	1. d3 g6 2. g4
A00	Mieses Opening: Reversed Rat	1. d3 e5
A00	Mieses Opening: Venezolana Variation	1. d3 c5 2. Nc3 Nc6 3. g3
A00	Polish Opening	1. b4
A00	Polish Opening, with d5	1. b4 d5
A00	Polish Opening, with d5	1. b4 d5 2. Bb2 Nf6 3. Nf3
A00	Polish Opening: Baltic Defense	1. b4 d5 2. Bb2 Bf5
A00	Polish Opening: Birmingham Gambit	1. b4 c5
A00	Polish Opening: Bugayev Advance Variation	1. b4 e5 2. Bb2 f6 3. b5
A00	Polish Opening: Bugayev Attack	1. b4 e5 2. a3
A00	Polish Opening: Czech Defense	1. b4 e5 2. Bb2 d6
A00	Polish Opening: Dutch Defense	1. b4 f5
A00	Polish Opening: German Defense	1. b4 d5 2. Bb2 Qd6
A00	Polish Opening: Grigorian Variation	1. b4 Nc6
A00	Polish Opening: Karniewski Variation	1. b4 Nh6
A00	Polish Opening: King's Indian Variation	1. b4 Nf6 2. Bb2 g6
A00	Polish Opening: King's Indian Variation, Schiffler Attack	1. b4 Nf6 2. Bb2 g6 3. e4
A00	Polish Opening: King's Indian Variation, Sokolsky Attack	1. b4 Nf6 2. Bb2 g6 3. c4 Bg7 4. e3 d6 5. Nf3 O-O 6. d4
A00	Polish Opening: Myers Variation	1. b4 d5 2. Bb2 c6 3. a4
A00	Polish Opening: Outflank Variation	1. b4 c6
A00	Polish Opening: Queen's Indian Variation	1. b4 e6 2. Bb2 Nf6 3. b5 b6
A00	Polish Opening: Queenside Defense	1. b4 e6 2. Bb2 Nf6 3. b5 a6
A00	Polish Opening: Rooks Swap Line	1. b4 e6 2. Bb2 Nf6 3. b5 a6 4. a4 axb5 5. axb5 Rxa1 6. Bxa1
A00	Polish Opening: Schiffler-Sokolsky Variation	1. b4 e6 2. Bb2 Nf6 3. b5 d5 4. e3
A00	Polish Opening: Schuehler Gambit	1. b4 c6 2. Bb2 a5 3. b5 cxb5 4. e4
A00	Polish Opening: Symmetrical Variation	1. b4 b5
A00	Polish Opening: Tartakower Gambit	1. b4 e5 2. Bb2 f6 3. e4
A00	Polish Opening: Wolferts Gambit	1. b4 e5 2. Bb2 c5
A00	Saragossa Opening	1. c3
A00	Sodium Attack	1. Na3
A00	Sodium Attack: Celadon Variation	1. Na3 e5 2. d3 Bxa3 3. bxa3 d5 4. e3 c5 5. Rb1
A00	Sodium Attack: Chenoboskion Variation	1. Na3 g6 2. g4
A00	Sodium Attack: Durkin Gambit	1. Na3 e5 2. Nc4 Nc6 3. e4 f5
A00	Valencia Opening	1. d3 e5 2. Nd2
A00	Van Geet Opening	1. Nc3
A00	Van Geet Opening: Battambang Variation	1. a3 e5 2. Nc3
A00	Van Geet Opening: Billockus-Johansen Gambit	1. Nc3 e5 2. Nf3 Bc5
A00	Van Geet Opening: Damhaug Gambit	1. Nc3 d5 2. f4 e5
A00	Van Geet Opening: Dougherty Gambit	1. Nc3 d5 2. e4 dxe4 3. f3
A00	Van Geet Opening: Dunst-Perrenet Gambit	1. Nc3 d5 2. e4 dxe4 3. d3
A00	Van Geet Opening: Düsseldorf Gambit	1. Nc3 c5 2. b4
A00	Van Geet Opening: Gladbacher Gambit	1. Nc3 e5 2. b3 d5 3. e4 dxe4 4. d3
A00	Van Geet Opening: Hector Gambit	1. Nc3 d5 2. e4 dxe4 3. Bc4
A00	Van Geet Opening: Hergert Gambit	1. Nc3 d6 2. f4 e5 3. fxe5 Nc6
A00	Van Geet Opening: Hulsemann Gambit	1. Nc3 e5 2. e3 d5 3. Qh5 Be6
A00	Van Geet Opening: Jendrossek Gambit	1. Nc3 d5 2. f4 d4 3. Ne4 f5 4. Nf2 Nf6 5. Nf3 c5 6. b4
A00	Van Geet Opening: Kluever Gambit	1. Nc3 f5 2. e4 fxe4 3. d3
A00	Van Geet Opening: Laroche Gambit	1. Nc3 b5
A00	Van Geet Opening: Liebig Gambit	1. Nc3 e5 2. e3 d5 3. Qh5 Nf6
A00	Van Geet Opening: Melleby Gambit	1. Nc3 d5 2. f4 d4 3. Ne4 c5
A00	Van Geet Opening: Myers Attack	1. Nc3 g6 2. h4
A00	Van Geet Opening: Napoleon Attack	1. Nc3 e5 2. Nf3 Nc6 3. d4
A00	Van Geet Opening: Novosibirsk Variation	1. Nc3 c5 2. d4 cxd4 3. Qxd4 Nc6 4. Qh4
A00	Van Geet Opening: Nowokunski Gambit	1. Nc3 e5 2. f4 exf4 3. e4
A00	Van Geet Opening: Pfeiffer Gambit	1. Nc3 d5 2. f4 d4 3. Ne4 e5
A00	Van Geet Opening: Pfeiffer Gambit, Sleipnir Countergambit	1. Nc3 d5 2. f4 d4 3. Ne4 e5 4. Nf3
A00	Van Geet Opening: Reversed Nimzowitsch	1. Nc3 e5
A00	Van Geet Opening: Reversed Scandinavian	1. Nc3 e5 2. d4 exd4 3. Qxd4 Nc6 4. Qa4
A00	Van Geet Opening: Sicilian Two Knights	1. Nc3 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4
A00	Van Geet Opening: Sleipnir Gambit	1. Nc3 d5 2. e3 e5 3. d4 Bb4
A00	Van Geet Opening: Twyble Attack	1. Nc3 c5 2. Rb1
A00	Van Geet Opening: Tübingen Gambit	1. Nc3 Nf6 2. g4
A00	Van Geet Opening: Venezolana Variation	1. Nc3 d5 2. d3 Nf6 3. g3
A00	Van Geet Opening: Warsteiner Gambit	1. Nc3 d5 2. f4 g5
A00	Van't Kruijs Opening	1. e3
A00	Van't Kruijs Opening: Bouncing Bishop Variation	1. e3 e5 2. Bc4 b5 3. Bb3
A00	Van't Kruijs Opening: Keoni-Hiva Gambit, Akahi Variation	1. e3 e5 2. Nc3 Nf6 3. f4 exf4 4. Nf3
A00	Van't Kruijs Opening: Keoni-Hiva Gambit, Alua Variation	1. e3 e5 2. Nc3 Nc6 3. f4 exf4 4. Nf3
A00	Van't Kruijs Opening: Keoni-Hiva Gambit, Ekolu Variation	1. e3 e5 2. Nc3 d5 3. f4 exf4 4. Nf3
A00	Ware Opening	1. a4
A00	Ware Opening: Cologne Gambit	1. a4 b6 2. d4 d5 3. Nc3 Nd7
A00	Ware Opening: Crab Variation	1. a4 e5 2. h4
A00	Ware Opening: Meadow Hay Trap	1. a4 e5 2. Ra3
A00	Ware Opening: Symmetric Variation	1. a4 a5
A00	Ware Opening: Ware Gambit	1. a4 e5 2. a5 d5 3. e3 f5 4. a6
A00	Ware Opening: Wing Gambit	1. a4 b5 2. axb5 Bb7
A01	Nimzo-Larsen Attack	1. b3
A01	Nimzo-Larsen Attack: Classical Variation	1. b3 d5
A01	Nimzo-Larsen Attack: Dutch Variation	1. b3 f5
A01	Nimzo-Larsen Attack: English Variation	1. b3 c5
A01	Nimzo-Larsen Attack: Graz Attack	1. b3 d5 2. Ba3
A01	Nimzo-Larsen Attack: Indian Variation	1. b3 Nf6
A01	Nimzo-Larsen Attack: Modern Variation	1. b3 e5
A01	Nimzo-Larsen Attack: Modern Variation	1. b3 e5 2. Bb2 Nc6
A01	Nimzo-Larsen Attack: Modern Variation	1. b3 e5 2. Bb2 Nc6 3. e3
A01	Nimzo-Larsen Attack: Modern Variation	1. b3 e5 2. Bb2 Nc6 3. c4 Nf6
A01	Nimzo-Larsen Attack: Pachman Gambit	1. b3 e5 2. Bb2 Nc6 3. f4
A01	Nimzo-Larsen Attack: Polish Variation	1. b3 b5
A01	Nimzo-Larsen Attack: Ringelbach Gambit	1. b3 f5 2. Bb2 e6 3. e4
A01	Nimzo-Larsen Attack: Spike Variation	1. b3 Nf6 2. Bb2 g6 3. g4
A01	Nimzo-Larsen Attack: Symmetrical Variation	1. b3 b6
A02	Bird Opening	1. f4
A02	Bird Opening: Batavo-Polish Attack	1. f4 Nf6 2. Nf3 g6 3. b4
A02	Bird Opening: Double Duck Formation	1. f4 f5 2. d4 d5
A02	Bird Opening: From's Gambit	1. f4 e5
A02	Bird Opening: From's Gambit, Bahr Gambit	1. f4 e5 2. Nc3
A02	Bird Opening: From's Gambit, Langheld Gambit	1. f4 e5 2. fxe5 d6 3. exd6 Nf6
A02	Bird Opening: From's Gambit, Lasker Variation	1. f4 e5 2. fxe5 d6 3. exd6 Bxd6 4. Nf3 g5
A02	Bird Opening: From's Gambit, Lipke Variation	1. f4 e5 2. fxe5 d6 3. exd6 Bxd6 4. Nf3 Nh6 5. d4
A02	Bird Opening: Hobbs Gambit	1. f4 g5
A02	Bird Opening: Hobbs-Zilbermints Gambit	1. f4 h6 2. Nf3 g5
A02	Bird Opening: Horsefly Defense	1. f4 Nh6
A02	Bird Opening: Lasker Gambit	1. f4 e5 2. fxe5 f6
A02	Bird Opening: Mujannah	1. f4 Nf6 2. c4
A02	Bird Opening: Myers Defense	1. f4 b5
A02	Bird Opening: Platz Gambit	1. f4 e5 2. fxe5 Ne7
A02	Bird Opening: Schlechter Gambit	1. f4 e5 2. fxe5 Nc6
A02	Bird Opening: Siegener Gambit	1. f4 e5 2. d4 exd4 3. Nf3 c5 4. c3
A02	Bird Opening: Swiss Gambit	1. f4 f5 2. e4 fxe4 3. Nc3 Nf6 4. g4
A02	Bird Opening: Wagner-Zwitersch Gambit	1. f4 f5 2. e4
A03	Bird Opening: Dutch Variation	1. f4 d5
A03	Bird Opening: Dutch Variation, Dudweiler Gambit	1. f4 d5 2. g4
A03	Bird Opening: Lasker Variation	1. f4 d5 2. Nf3 Nf6 3. e3 c5
A03	Bird Opening: Sturm Gambit	1. f4 d5 2. c4
A03	Bird Opening: Thomas Gambit	1. f4 d5 2. b3 Nf6 3. Bb2 d4 4. Nf3 c5 5. e3
A03	Bird Opening: Williams Gambit	1. f4 d5 2. e4
A03	Bird Opening: Williams Gambit	1. f4 d5 2. e4 dxe4 3. Nc3 Nf6 4. Qe2
A03	Bird Opening: Williams-Zilbermints Gambit	1. f4 d5 2. e4 dxe4 3. Nc3 Nf6 4. Nge2
A04	Colle System: Rhamphorhynchus Variation	1. Nf3 c5 2. e3 g6 3. d4 Bg7 4. dxc5 Qa5+
A04	Modern Defense: Semi-Averbakh Variation, Polish Variation	1. Nf3 c5 2. c4 g6 3. d4 Bg7 4. e4 Qb6
A04	Modern Defense: Semi-Averbakh Variation, Pterodactyl Variation	1. Nf3 c5 2. c4 g6 3. d4 Bg7 4. e4 Qa5+
A04	Modern Defense: Semi-Averbakh Variation, Pterodactyl Variation Accepted	1. Nf3 g6 2. d4 Bg7 3. e4 d6 4. c4 c5 5. dxc5 Qa5+
A04	Zukertort Defense: Kingside Variation	1. Nf3 Nh6 2. d4 g6
A04	Zukertort Defense: Sicilian Knight Variation	1. Nf3 Na6 2. e4 c5
A04	Zukertort Opening	1. Nf3
A04	Zukertort Opening: Arctic Defense	1. Nf3 f6
A04	Zukertort Opening: Arctic Defense, Drunken Knight Variation	1. Nf3 f6 2. e4 Nh6 3. d4 Nf7
A04	Zukertort Opening: Basman Defense	1. Nf3 h6
A04	Zukertort Opening: Black Mustang Defense	1. Nf3 Nc6
A04	Zukertort Opening: Drunken Cavalry Variation	1. Nf3 Na6 2. e4 Nh6
A04	Zukertort Opening: Dutch Variation	1. Nf3 f5
A04	Zukertort Opening: Herrstrom Gambit	1. Nf3 g5
A04	Zukertort Opening: Kingside Fianchetto	1. Nf3 g6
A04	Zukertort Opening: Lisitsyn Gambit	1. Nf3 f5 2. e4
A04	Zukertort Opening: Lisitsyn Gambit Deferred	1. Nf3 f5 2. d3 Nf6 3. e4
A04	Zukertort Opening: Pirc Invitation	1. Nf3 d6
A04	Zukertort Opening: Polish Defense	1. Nf3 b5
A04	Zukertort Opening: Queen's Gambit Invitation	1. Nf3 e6
A04	Zukertort Opening: Queenside Fianchetto Variation	1. Nf3 b6
A04	Zukertort Opening: Ross Gambit	1. Nf3 e5
A04	Zukertort Opening: Shabalov Gambit	1. Nf3 e6 2. c4 a6 3. Nc3 c5 4. g3 b5
A04	Zukertort Opening: Sicilian Invitation	1. Nf3 c5
A04	Zukertort Opening: Slav Invitation	1. Nf3 c6
A04	Zukertort Opening: Speelsmet Gambit	1. Nf3 c5 2. d4 cxd4 3. e3
A04	Zukertort Opening: St. George Defense	1. Nf3 a6
A04	Zukertort Opening: The Walrus	1. Nf3 e5 2. Nxe5 Nc6 3. Nxc6 dxc6
A04	Zukertort Opening: Vos Gambit	1. Nf3 d6 2. d4 e5
A04	Zukertort Opening: Wade Defense	1. Nf3 d6 2. e4 Bg4
A04	Zukertort Opening: Ware Defense	1. Nf3 a5
A05	King's Indian Attack	1. Nf3 Nf6 2. g3 d5
A05	King's Indian Attack: Smyslov Variation	1. Nf3 Nf6 2. g3 g6 3. b4
A05	King's Indian Attack: Spassky Variation	1. Nf3 Nf6 2. g3 b5
A05	King's Indian Attack: Symmetrical Defense	1. Nf3 Nf6 2. g3 g6
A05	King's Indian Attack: Wahls Defense	1. Nf3 Nf6 2. g3 g6 3. Bg2 Bg7 4. O-O O-O 5. d3 d5
A05	Polish Opening: Zukertort System	1. Nf3 Nf6 2. b4 g6 3. Bb2
A05	Zukertort Opening	1. Nf3 Nf6
A05	Zukertort Opening	1. Nf3 Nf6 2. Nc3 Nc6
A05	Zukertort Opening: Double Fianchetto Attack	1. Nf3 Nf6 2. g3 g6 3. b3 Bg7 4. Bb2 O-O 5. Bg2 d6 6. O-O
A05	Zukertort Opening: Lemberger Gambit	1. Nf3 Nf6 2. e4
A05	Zukertort Opening: Myers Polish Attack	1. Nf3 Nf6 2. a4 g6 3. b4
A05	Zukertort Opening: Nimzo-Larsen Variation	1. Nf3 Nf6 2. b3
A05	Zukertort Opening: Quiet System	1. Nf3 Nf6 2. e3
A06	Nimzo-Larsen Attack: Classical Variation	1. Nf3 d5 2. b3
A06	Nimzo-Larsen Attack: Norfolk Gambit	1. Nf3 d5 2. b3 c5 3. e4
A06	Nimzo-Larsen Attack: Norfolk Gambit	1. Nf3 d5 2. b3 Nf6 3. Bb2 c5 4. e4
A06	Zukertort Opening	1. Nf3 d5
A06	Zukertort Opening: Ampel Variation	1. Nf3 d5 2. Rg1
A06	Zukertort Opening: Old Indian Attack	1. Nf3 d5 2. d3
A06	Zukertort Opening: Pachman Gambit	1. Nf3 d5 2. e3 c5 3. c4 dxc4 4. b3
A06	Zukertort Opening: Regina-Nu Gambit	1. Nf3 d5 2. b3 c5 3. c4 dxc4 4. Nc3
A06	Zukertort Opening: Reversed Mexican Defense	1. Nf3 d5 2. Nc3
A06	Zukertort Opening: Santasiere's Folly	1. b4 d5 2. Nf3
A06	Zukertort Opening: Tennison Gambit	1. e4 d5 2. Nf3
A06	Zukertort Opening: Tennison Gambit, Brigg's Trap	1. e4 d5 2. Nf3 dxe4 3. Ng5 Nf6 4. Nc3 Bf5 5. Qe2 Qd4
A06	Zukertort Opening: The Potato	1. Nf3 d5 2. a4
A07	Hungarian Opening: Wiedenhagen-Beta Gambit	1. g3 d5 2. Nf3 g5
A07	King's Indian Attack	1. Nf3 d5 2. g3
A07	King's Indian Attack, with Bf5	1. Nf3 Nf6 2. g3 d5 3. Bg2 c6 4. O-O Bf5
A07	King's Indian Attack, with Bf5	1. Nf3 Nf6 2. g3 d5 3. Bg2 c6 4. O-O Bf5 5. d3 h6
A07	King's Indian Attack, with Bf5	1. Nf3 Nf6 2. g3 d5 3. Bg2 c6 4. O-O Bf5 5. d3 h6 6. c4 dxc4
A07	King's Indian Attack, with Bf5	1. Nf3 Nf6 2. g3 d5 3. Bg2 c6 4. O-O Bf5 5. d3 e6 6. Nbd2
A07	King's Indian Attack, with Bf5	1. Nf3 Nf6 2. g3 d5 3. Bg2 c6 4. O-O Bf5 5. d3 e6 6. Nh4
A07	King's Indian Attack, with e6	1. Nf3 Nf6 2. g3 d5 3. Bg2 e6
A07	King's Indian Attack, with e6	1. Nf3 Nf6 2. g3 d5 3. Bg2 e6 4. O-O Be7
A07	King's Indian Attack: Double Fianchetto	1. Nf3 d5 2. g3 g6
A07	King's Indian Attack: Keres Variation	1. Nf3 d5 2. g3 Bg4
A07	King's Indian Attack: Keres Variation	1. Nf3 d5 2. g3 Bg4 3. Bg2 Nd7
A07	King's Indian Attack: Keres Variation	1. Nf3 d5 2. g3 c6 3. Bg2 Bg4 4. O-O Nd7
A07	King's Indian Attack: Omega-Delta Gambit	1. Nf3 d5 2. g3 e5
A07	King's Indian Attack: Pachman System	1. Nf3 d5 2. g3 g6 3. Bg2 Bg7 4. O-O e5 5. d3 Ne7
A07	King's Indian Attack: Sicilian Variation	1. Nf3 d5 2. g3 c5
A07	King's Indian Attack: Yugoslav Variation	1. Nf3 Nf6 2. g3 d5 3. Bg2 c6 4. O-O Bg4
A08	King's Indian Attack: French Variation	1. Nf3 d5 2. g3 c5 3. Bg2 Nc6
A08	King's Indian Attack: Sicilian Variation	1. e4 e6 2. d3 d5 3. Nd2 Nf6 4. Ngf3 c5 5. g3 Nc6 6. Bg2 Be7 7. O-O O-O 8. Re1
A08	King's Indian Attack: Sicilian Variation	1. Nf3 d5 2. g3 c5 3. Bg2
A08	King's Indian Attack: Sicilian Variation	1. Nf3 d5 2. g3 c5 3. Bg2 Nf6 4. O-O e6 5. d3
A08	Zukertort Opening: Reversed Grünfeld	1. Nf3 d5 2. g3 c5 3. Bg2 Nc6 4. d4
A08	Zukertort Opening: Reversed Grünfeld	1. Nf3 d5 2. g3 c5 3. Bg2 Nc6 4. d4 Nf6
A08	Zukertort Opening: Reversed Grünfeld	1. Nf3 d5 2. g3 c5 3. Bg2 Nc6 4. d4 Nf6 5. O-O
A08	Zukertort Opening: Reversed Grünfeld	1. Nf3 d5 2. g3 c5 3. Bg2 Nc6 4. d4 e6 5. O-O
A09	Réti Opening	1. Nf3 d5 2. c4
A09	Réti Opening: Advance Variation	1. Nf3 d5 2. c4 d4
A09	Réti Opening: Advance Variation, Michel Gambit	1. Nf3 d5 2. c4 d4 3. b4 c5
A09	Réti Opening: Penguin Variation	1. Nf3 d5 2. c4 d4 3. Rg1
A09	Réti Opening: Reversed Blumenfeld Gambit	1. Nf3 d5 2. c4 d4 3. e3 c5 4. b4
A09	Réti Opening: Réti Accepted	1. Nf3 d5 2. c4 dxc4
A09	Réti Opening: Réti Gambit, Keres Variation	1. Nf3 d5 2. c4 dxc4 3. e3 Be6
A09	Réti Opening: Zilbermints Gambit	1. Nf3 d5 2. c4 b5
A10	English Opening	1. c4
A10	English Opening: Achilles-Omega Gambit	1. c4 Nf6 2. e4
A10	English Opening: Adorjan Defense	1. c4 g6 2. e4 e5
A10	English Opening: Anglo-Dutch Defense	1. c4 f5
A10	English Opening: Anglo-Dutch Defense, Hickmann Gambit	1. c4 f5 2. e4
A10	English Opening: Anglo-Dutch Variation, Chabanon Gambit	1. c4 f5 2. Nf3 d6 3. e4
A10	English Opening: Anglo-Dutch Variation, Ferenc Gambit	1. c4 f5 2. Nc3 Nf6 3. e4
A10	English Opening: Anglo-Lithuanian Variation	1. c4 Nc6
A10	English Opening: Anglo-Scandinavian Defense	1. c4 d5
A10	English Opening: Anglo-Scandinavian Defense, Löhn Gambit	1. c4 d5 2. cxd5 e6
A10	English Opening: Anglo-Scandinavian Defense, Malvinas Variation	1. c4 d5 2. cxd5 Qxd5 3. Nc3 Qa5
A10	English Opening: Anglo-Scandinavian Defense, Schulz Gambit	1. c4 d5 2. cxd5 Nf6
A10	English Opening: Great Snake Variation	1. c4 g6
A10	English Opening: Jaenisch Gambit	1. c4 b5
A10	English Opening: King's English Variation, Botvinnik System, Prickly Pawn Pass System	1. c4 g6 2. Nc3 Bg7 3. g3 Nf6 4. Bg2 O-O 5. e4 d6 6. Nge2 e5 7. O-O c6 8. d3 a6
A10	English Opening: Myers Defense	1. c4 g5
A10	English Opening: Myers Gambit	1. c4 g5 2. d4 Bg7
A10	English Opening: Porcupine Variation	1. c4 f5 2. Nc3 Nf6 3. e4 fxe4 4. g4
A10	English Opening: Wade Gambit	1. c4 f5 2. g4
A10	English Opening: Zilbermints Gambit	1. c4 g5 2. d4 e5
A11	English Opening: Caro-Kann Defensive System	1. c4 c6
A11	Réti Opening: Anglo-Slav Variation, Gurevich System	1. c4 c6 2. Nf3 d5 3. e3
A11	Réti Opening: Anglo-Slav Variation, Gurevich System	1. c4 c6 2. Nf3 d5 3. e3 Nf6 4. Qc2
A11	Réti Opening: Anglo-Slav Variation, Gurevich System	1. c4 c6 2. Nf3 d5 3. e3 Nf6 4. Nc3 Nbd7 5. Qc2
A11	Réti Opening: Anglo-Slav Variation, Gurevich System	1. c4 c6 2. Nf3 d5 3. e3 Nf6 4. Nc3 Nbd7 5. b3 e5
A11	Réti Opening: Anglo-Slav Variation, Gurevich System	1. c4 c6 2. Nf3 d5 3. e3 Nf6 4. Nc3 e6 5. b3 Bd6
A11	Réti Opening: Anglo-Slav Variation, with g3	1. c4 c6 2. Nf3 d5 3. g3 Nf6 4. b3 g6
A11	Réti Opening: Anglo-Slav Variation, with g3	1. c4 c6 2. Nf3 d5 3. g3 Nf6 4. Bg2
A11	Réti Opening: Anglo-Slav Variation, with g3	1. c4 c6 2. Nf3 d5 3. g3 Nf6 4. Bg2 dxc4
A11	Réti Opening: Anglo-Slav Variation, with g3	1. c4 c6 2. Nf3 d5 3. g3 Nf6 4. Bg2 Bf5
A11	Réti Opening: Anglo-Slav Variation, with g3	1. c4 c6 2. Nf3 d5 3. g3 Nf6 4. Bg2 Bf5 5. O-O e6 6. d3
A11	Réti Opening: Anglo-Slav Variation, with g3	1. Nf3 Nf6 2. g3 d5 3. Bg2 c6 4. O-O Bf5 5. d3 h6 6. c4 e6
A12	Réti Opening: Anglo-Slav Variation	1. c4 Nf6 2. g3 c6 3. Nf3 d5 4. b3
A12	Réti Opening: Anglo-Slav Variation, Bled Variation	1. Nf3 d5 2. b3 Nf6 3. Bb2 g6 4. c4 c6
A12	Réti Opening: Anglo-Slav Variation, Bogoljubow Variation	1. Nf3 d5 2. c4 c6 3. b3
A12	Réti Opening: Anglo-Slav Variation, Bogoljubow Variation	1. Nf3 d5 2. c4 c6 3. b3 Bg4
A12	Réti Opening: Anglo-Slav Variation, Bogoljubow Variation	1. Nf3 d5 2. c4 c6 3. b3 Bf5
A12	Réti Opening: Anglo-Slav Variation, Bogoljubow Variation	1. Nf3 d5 2. c4 c6 3. b3 Bf5 4. Bb2
A12	Réti Opening: Anglo-Slav Variation, Capablanca Variation	1. c4 Nf6 2. Nf3 c6 3. b3 d5 4. Bb2 Bg4
A12	Réti Opening: Anglo-Slav Variation, London Defensive System	1. c4 Nf6 2. g3 c6 3. Nf3 d5 4. b3 Bf5
A12	Réti Opening: Anglo-Slav Variation, New York System	1. Nf3 Nf6 2. c4 c6 3. b3 d5 4. Bb2 Bf5
A12	Réti Opening: Anglo-Slav Variation, Torre System	1. c4 Nf6 2. g3 c6 3. Nf3 d5 4. b3 Bg4
A12	Réti Opening: Anglo-Slav Variation, with dxc4	1. c4 Nf6 2. g3 c6 3. Nf3 d5 4. b3 dxc4
A13	English Opening: Agincourt Defense	1. c4 e6
A13	English Opening: Agincourt Defense	1. c4 e6 2. Nf3
A13	English Opening: Agincourt Defense	1. c4 e6 2. Nf3 d5
A13	English Opening: Agincourt Defense, Bogoljubow Defense	1. c4 e6 2. Nf3 d5 3. g3 Nf6 4. Bg2 Bd6
A13	English Opening: Agincourt Defense, Catalan Defense	1. c4 e6 2. Nf3 d5 3. g3 b6 4. Bg2 Bb7 5. O-O
A13	English Opening: Agincourt Defense, Catalan Defense	1. c4 e6 2. Nf3 d5 3. g3 c5
A13	English Opening: Agincourt Defense, Catalan Defense Accepted	1. c4 e6 2. Nf3 Nf6 3. g3 d5 4. Bg2 dxc4
A13	English Opening: Agincourt Defense, Catalan Defense, Semi-Slav Defense	1. c4 e6 2. Nf3 Nf6 3. g3 d5 4. Bg2 c6
A13	English Opening: Agincourt Defense, Kurajica Defense	1. c4 e6 2. Nf3 d5 3. g3 c6
A13	English Opening: Agincourt Defense, Tarrasch Defense	1. c4 e6 2. Nf3 d5 3. g3 Nf6 4. Bg2 c5 5. b3 Nc6 6. O-O Be7
A13	English Opening: Agincourt Defense, Wimpy System	1. c4 e6 2. Nf3 Nf6 3. b3 d5 4. Bb2 c5 5. e3
A13	English Opening: Neo-Catalan	1. c4 e6 2. Nf3 d5 3. g3 Nf6
A13	English Opening: Neo-Catalan Declined	1. c4 e6 2. Nf3 d5 3. g3 Nf6 4. Bg2 Be7
A13	English Opening: Romanishin Gambit	1. c4 Nf6 2. Nf3 e6 3. g3 a6 4. Bg2 b5
A14	English Opening: Agincourt Defense, Keres Defense	1. c4 e6 2. Nf3 d5 3. g3 Nf6 4. Bg2 Be7 5. O-O c5 6. cxd5 Nxd5 7. Nc3 Nc6
A14	English Opening: Agincourt Defense, Neo-Catalan Declined	1. c4 e6 2. Nf3 d5 3. g3 Nf6 4. Bg2 Be7 5. O-O
A14	English Opening: Agincourt Defense, Neo-Catalan Declined	1. c4 e6 2. Nf3 d5 3. g3 Nf6 4. Bg2 Be7 5. O-O O-O 6. b3
A14	English Opening: Agincourt Defense, Neo-Catalan Declined	1. Nf3 d5 2. g3 Nf6 3. Bg2 e6 4. O-O Be7 5. c4 O-O 6. b3 c5
A14	English Opening: Agincourt Defense, Neo-Catalan Declined	1. Nf3 d5 2. g3 Nf6 3. Bg2 e6 4. O-O Be7 5. c4 O-O 6. b3 c5 7. e3
A14	English Opening: Agincourt Defense, Neo-Catalan Declined	1. Nf3 d5 2. g3 Nf6 3. Bg2 e6 4. O-O Be7 5. c4 O-O 6. b3 c5 7. e3 d4
A14	English Opening: Agincourt Defense, Neo-Catalan Declined	1. Nf3 d5 2. g3 Nf6 3. Bg2 e6 4. O-O Be7 5. c4 O-O 6. b3 c5 7. e3 Nc6
A14	English Opening: Agincourt Defense, Neo-Catalan Declined, Early b3	1. c4 e6 2. Nf3 d5 3. g3 Nf6 4. Bg2 Be7 5. b3
A14	English Opening: Agincourt Defense, Neo-Catalan Declined, Early b3	1. c4 e6 2. Nf3 d5 3. g3 Nf6 4. Bg2 Be7 5. b3 b6
A14	English Opening: Agincourt Defense, Neo-Catalan Declined, Early b3	1. c4 e6 2. Nf3 d5 3. g3 Nf6 4. Bg2 Be7 5. b3 c5
A14	Réti Opening: Anglo-Slav Variation	1. Nf3 d5 2. c4 c6 3. g3 Nf6 4. Bg2 e6 5. b3 Be7 6. Bb2
A14	Réti Opening: Anglo-Slav Variation, Bogoljubow Variation, Stonewall Line	1. Nf3 d5 2. c4 e6 3. g3 Nf6 4. Bg2 Be7 5. O-O O-O 6. b3 c6 7. Bb2
A15	English Opening: Anglo-Indian Defense	1. c4 Nf6
A15	English Opening: Anglo-Indian Defense, Anti-Anti-Grünfeld	1. c4 Nf6 2. Nc3 g6 3. Nf3 Bg7 4. e4
A15	English Opening: Anglo-Indian Defense, Grünfeld Formation	1. c4 Nf6 2. Nf3 g6 3. g3 d5
A15	English Opening: Anglo-Indian Defense, King's Indian Formation	1. c4 Nf6 2. Nf3 g6
A15	English Opening: Anglo-Indian Defense, King's Indian Formation, Double Fianchetto	1. c4 Nf6 2. Nf3 g6 3. g3 b6 4. Bg2 Bb7
A15	English Opening: Anglo-Indian Defense, King's Knight Variation	1. c4 Nf6 2. Nf3
A15	English Opening: Anglo-Indian Defense, Old Indian Formation	1. c4 Nf6 2. Nf3 d6
A15	English Opening: Anglo-Indian Defense, Queen's Indian Formation	1. c4 Nf6 2. Nf3 b6
A15	English Opening: Anglo-Indian Defense, Queen's Indian Formation	1. c4 e6 2. Nf3 Nf6 3. g3 b6 4. Bg2 Bb7
A15	English Opening: Anglo-Indian Defense, Romanishin Variation	1. c4 e6 2. Nf3 Nf6 3. g3 a6
A15	English Opening: Anglo-Indian Defense, Scandinavian Defense	1. c4 Nf6 2. Nf3 d5
A15	English Opening: Anglo-Indian Defense, Scandinavian Defense, Exchange Variation	1. c4 Nf6 2. Nf3 d5 3. cxd5 Nxd5
A15	English Opening: Anglo-Indian Defense, Slav Formation	1. c4 Nf6 2. Nf3 g6 3. g3 c6
A15	English Orangutan	1. c4 Nf6 2. b4
A15	English Orangutan	1. c4 Nf6 2. Nf3 g6 3. b4
A16	English Opening: Anglo-Grünfeld Defense	1. c4 Nf6 2. Nc3 d5
A16	English Opening: Anglo-Grünfeld Defense, Korchnoi Variation	1. c4 Nf6 2. Nc3 d5 3. cxd5 Nxd5 4. Nf3 g6 5. g3 Bg7 6. Bg2 e5
A16	English Opening: Anglo-Indian Defense, Anglo-Grünfeld Variation	1. c4 Nf6 2. Nc3 d5 3. cxd5 Nxd5 4. Nf3
A16	English Opening: Anglo-Indian Defense, Anglo-Grünfeld Variation	1. c4 Nf6 2. Nc3 d5 3. cxd5 Nxd5 4. Nf3 g6
A16	English Opening: Anglo-Indian Defense, Anglo-Grünfeld Variation	1. c4 Nf6 2. Nc3 d5 3. cxd5 Nxd5 4. g3 g6 5. Bg2 Nb6
A16	English Opening: Anglo-Indian Defense, Anglo-Grünfeld Variation	1. c4 Nf6 2. Nc3 d5 3. cxd5 Nxd5 4. g3 g6 5. Bg2 Nxc3
A16	English Opening: Anglo-Indian Defense, Queen's Knight Variation	1. c4 Nf6 2. Nc3
A17	English Opening: Anglo-Indian Defense	1. c4 Nf6 2. Nc3 d5 3. cxd5 Nxd5 4. Nf3 c5 5. e3 e6
A17	English Opening: Anglo-Indian Defense, Hedgehog System	1. c4 Nf6 2. Nc3 e6
A17	English Opening: Anglo-Indian Defense, Nimzo-English	1. c4 Nf6 2. Nc3 e6 3. Nf3 Bb4
A17	English Opening: Anglo-Indian Defense, Queen's Indian Formation	1. c4 e6 2. Nc3 Nf6 3. Nf3 b6
A17	English Opening: Anglo-Indian Defense, Queen's Indian Variation	1. c4 e6 2. Nc3 Nf6 3. Nf3 b6 4. e4 Bb7 5. Bd3
A17	English Opening: Anglo-Indian Defense, Zvjaginsev-Krasenkow Attack	1. c4 e6 2. Nc3 Nf6 3. Nf3 Bb4 4. g4
A18	English Opening: Mikenas-Carls Variation	1. c4 e6 2. Nc3 Nf6 3. e4
A18	English Opening: Mikenas-Carls Variation	1. c4 e6 2. Nc3 Nf6 3. e4 Nc6
A18	English Opening: Mikenas-Carls Variation	1. c4 e6 2. Nc3 Nf6 3. e4 d5 4. e5
A19	English Opening: Anglo-Indian Defense, Flohr-Mikenas-Carls Variation, Nei Gambit	1. c4 e6 2. Nc3 Nf6 3. e4 c5 4. e5 Ng8
A19	English Opening: Mikenas-Carls, Sicilian	1. c4 e6 2. Nc3 Nf6 3. e4 c5
A20	English Opening: Drill Variation	1. c4 e5 2. g3 h5
A20	English Opening: King's English Variation	1. c4 e5
A20	English Opening: King's English Variation, Kahiko-Hula Gambit	1. c4 e5 2. e3 Nf6 3. f4 exf4 4. Nf3
A20	English Opening: King's English Variation, Nimzowitsch Variation	1. c4 e5 2. Nf3
A20	English Opening: King's English Variation, Nimzowitsch-Flohr Variation	1. c4 e5 2. Nf3 e4
A21	English Opening: King's English Variation	1. c4 e5 2. Nc3 d6 3. Nf3
A21	English Opening: King's English Variation, Keres Defense	1. c4 e5 2. Nc3 d6 3. g3 c6
A21	English Opening: King's English Variation, Kramnik-Shirov Counterattack	1. c4 e5 2. Nc3 Bb4
A21	English Opening: King's English Variation, Reversed Sicilian	1. c4 e5 2. Nc3
A21	English Opening: King's English Variation, Smyslov Defense	1. c4 e5 2. Nc3 d6 3. Nf3 Bg4
A21	English Opening: King's English Variation, Troger Defense	1. c4 e5 2. Nc3 Nc6 3. g3 d6 4. Bg2 Be6
A22	English Opening: Carls-Bremen System	1. c4 e5 2. Nc3 Nf6 3. g3
A22	English Opening: King's English Variation, Adhiban Gambit	1. c4 e5 2. Nc3 Nf6 3. Nf3 e4 4. Ng5 c6
A22	English Opening: King's English Variation, Bellon Gambit	1. c4 e5 2. Nc3 Nf6 3. Nf3 e4 4. Ng5 b5
A22	English Opening: King's English Variation, Two Knights Variation	1. c4 e5 2. Nc3 Nf6
A22	English Opening: King's English Variation, Two Knights Variation, Reversed Dragon	1. c4 e5 2. Nc3 Nf6 3. g3 d5
A22	English Opening: King's English Variation, Two Knights Variation, Smyslov System	1. c4 e5 2. Nc3 Nf6 3. g3 Bb4
A22	English Opening: King's English, Erbenheimer Gambit	1. c4 e5 2. Nc3 Nf6 3. Nf3 e4 4. Ng5 Ng4
A22	English Opening: King's English, Mazedonisch	1. c4 e5 2. Nc3 Nf6 3. f4
A23	English Opening: King's English Variation, Two Knights Variation, Keres Variation	1. c4 e5 2. Nc3 Nf6 3. g3 c6
A23	English Opening: King's English Variation, Two Knights Variation, Keres Variation	1. c4 e5 2. Nc3 Nf6 3. g3 Bc5 4. Bg2 c6
A24	English Opening: King's English Variation, Two Knights Variation, Fianchetto Line	1. c4 e5 2. Nc3 Nf6 3. g3 g6
A25	English Opening: Closed, Taimanov Variation	1. c4 e5 2. Nc3 Nc6 3. g3 g6 4. Rb1 Nh6 5. Bg2 Bg7
A25	English Opening: Closed, Taimanov Variation	1. c4 e5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. e3 d6 6. Nge2 Nh6
A25	English Opening: King's English Variation, Bremen-Hort Variation	1. c4 e5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. e3 d6 6. Nge2 Be6
A25	English Opening: King's English Variation, Closed System	1. c4 e5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. d3
A25	English Opening: King's English Variation, Hungarian Attack	1. c4 e5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. Rb1
A25	English Opening: King's English Variation, Reversed Closed Sicilian	1. c4 e5 2. Nc3 Nc6
A25	English Opening: King's English Variation, Taimanov Variation	1. c4 e5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7
A26	English Opening: King's English Variation, Botvinnik System	1. c4 e5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. d3 d6 6. e4
A26	English Opening: King's English Variation, Closed System, Full Symmetry	1. c4 e5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. d3 d6
A27	English Opening: King's English Variation, Three Knights System	1. c4 e5 2. Nc3 Nc6 3. Nf3
A28	English Opening: Four Knights System, Nimzowitsch Variation	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. e4
A28	English Opening: King's English Variation, Four Knights Variation	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6
A28	English Opening: King's English Variation, Four Knights Variation	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. d4 exd4 5. Nxd4 Bb4 6. Bg5 h6 7. Bh4 Bxc3+ 8. bxc3 Ne5
A28	English Opening: King's English Variation, Four Knights Variation, Bradley Beach Variation	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. d4 e4
A28	English Opening: King's English Variation, Four Knights Variation, Flexible Line	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. d3
A28	English Opening: King's English Variation, Four Knights Variation, Korchnoi Line	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. a3
A28	English Opening: King's English Variation, Four Knights Variation, Quiet Line	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. e3
A28	English Opening: King's English Variation, Four Knights Variation, Quiet Line	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. e3 Bb4 5. Qc2 Bxc3
A28	English Opening: King's English Variation, Four Knights Variation, Quiet Line	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. e3 Bb4 5. Qc2 O-O 6. Nd5 Re8 7. Qf5
A29	English Opening: King's English Variation, Four Knights Variation, Fianchetto Line	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3
A29	English Opening: King's English Variation, Four Knights Variation, Fianchetto Line	1. c4 e5 2. g3 Nf6 3. Bg2 d5 4. cxd5 Nxd5 5. Nf3 Nc6
A29	English Opening: King's English Variation, Four Knights Variation, Fianchetto Line	1. c4 e5 2. g3 Nf6 3. Bg2 d5 4. cxd5 Nxd5 5. Nf3 Nc6 6. d3
A29	English Opening: King's English Variation, Four Knights Variation, Fianchetto Line	1. c4 e5 2. g3 Nf6 3. Bg2 d5 4. cxd5 Nxd5 5. Nf3 Nc6 6. d3 Be7 7. O-O O-O
A29	English Opening: King's English Variation, Four Knights Variation, Fianchetto Line, Delayed .. Nc6	1. c4 e5 2. Nc3 Nf6 3. g3 Bb4 4. Bg2 O-O 5. Nf3 Re8 6. O-O e4 7. Nd4 Nc6
A29	English Opening: King's English Variation, Four Knights Variation, Fianchetto Line, with .. d6	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bc5 5. d3 d6 6. Bg2
A29	English Opening: King's English Variation, Four Knights Variation, Fianchetto Line, with .. d6	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bc5 5. d3 d6 6. Bg2 O-O 7. O-O
A29	English Opening: King's English Variation, Four Knights Variation, Fianchetto Line, with .. d6, Be7	1. c4 e5 2. Nc3 Nf6 3. g3 Nc6 4. Bg2 d6 5. d3 Be7 6. Nf3 O-O
A29	English Opening: King's English Variation, Four Knights Variation, Fianchetto Line, with .. d6, a6	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bc5 5. d3 d6 6. Bg2 a6
A29	English Opening: King's English Variation, Four Knights Variation, Fianchetto Line, with .. d6, h6	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bc5 5. d3 d6 6. Bg2 h6
A29	English Opening: King's English Variation, Four Knights Variation, Fianchetto Line, with Bc5	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 d5 5. cxd5 Nxd5 6. Bg2 Bc5
A29	English Opening: King's English Variation, Four Knights Variation, Fianchetto Line, with Nb6	1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 d5 5. cxd5 Nxd5 6. Bg2 Nb6
A30	English Opening: Symmetrical Variation	1. c4 c5
A30	English Opening: Symmetrical Variation	1. c4 c5 2. Nf3
A30	English Opening: Symmetrical Variation, Hedgehog Defense	1. c4 e6 2. Nf3 Nf6 3. Nc3 c5 4. g3 b6 5. Bg2 Bb7 6. O-O Be7
A30	English Opening: Symmetrical Variation, Napolitano Gambit	1. c4 c5 2. Nf3 Nf6 3. b4
A30	English Opening: Symmetrical, Hedgehog, Flexible Formation	1. c4 e6 2. Nf3 c5 3. Nc3 Nf6 4. g3 b6 5. Bg2 Bb7 6. O-O Be7 7. d4 cxd4 8. Qxd4 d6 9. Rd1 a6 10. b3 Nbd7
A30	English Opening: Wing Gambit	1. c4 c5 2. b4
A31	English Opening: Symmetrical Variation, Anti-Benoni Variation	1. c4 Nf6 2. d4 c5 3. Nf3
A32	English Opening: Symmetrical Variation, Anti-Benoni Variation, Spielmann Defense	1. c4 e6 2. d4 c5 3. Nf3 cxd4 4. Nxd4 Nf6
A33	English Opening: Symmetrical Variation, Anti-Benoni Variation, Geller Variation	1. c4 e6 2. Nf3 Nf6 3. Nc3 c5 4. d4 Nc6 5. g3 cxd4 6. Nxd4 Qb6
A33	English Opening: Symmetrical Variation, Anti-Benoni Variation, Spielmann Defense	1. c4 e6 2. Nf3 Nf6 3. Nc3 c5 4. d4 cxd4 5. Nxd4 Nc6
A34	English Opening: Symmetrical Variation	1. c4 c5 2. Nf3 Nf6 3. Nc3 Nc6 4. g3 d5 5. d4 cxd4
A34	English Opening: Symmetrical Variation, Fianchetto Variation	1. c4 Nf6 2. Nc3 c5 3. g3
A34	English Opening: Symmetrical Variation, Normal Variation	1. c4 c5 2. Nc3
A34	English Opening: Symmetrical Variation, Rubinstein Variation	1. c4 Nf6 2. Nc3 c5 3. g3 d5 4. cxd5 Nxd5 5. Bg2 Nc7
A34	English Opening: Symmetrical Variation, Rubinstein Variation	1. c4 c5 2. Nf3 Nf6 3. Nc3 d5 4. cxd5 Nxd5 5. g3 Nc6 6. Bg2 Nc7
A34	English Opening: Symmetrical Variation, Three Knights Variation	1. c4 c5 2. Nc3 Nf6 3. Nf3
A35	English Opening: Symmetrical Variation	1. c4 c5 2. Nc3 Nf6 3. Nf3 e5
A35	English Opening: Symmetrical Variation, Four Knights Variation	1. c4 Nf6 2. Nf3 c5 3. Nc3 Nc6
A35	English Opening: Symmetrical Variation, Two Knights Variation	1. c4 c5 2. Nc3 Nc6
A36	English Opening: Symmetrical Variation, Botvinnik System	1. c4 c5 2. e4 Nc6 3. Nc3 g6 4. g3 Bg7 5. Bg2
A36	English Opening: Symmetrical Variation, Botvinnik System Reversed, with e3	1. c4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. e3 e5
A36	English Opening: Symmetrical Variation, Two Knights, Fianchetto Variation	1. c4 c5 2. Nc3 Nc6 3. g3
A36	English Opening: Symmetrical Variation, Ultra-Symmetrical Variation	1. c4 c5 2. g3 g6 3. Bg2 Bg7 4. Nc3 Nc6
A37	English Opening: Symmetrical Variation, Botvinnik System Reversed, with Nf3	1. c4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. Nf3 e5
A37	English Opening: Symmetrical Variation, Botvinnik System Reversed, with Nf3	1. c4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. Nf3 e5 6. O-O Nge7
A37	English Opening: Symmetrical Variation, Botvinnik System Reversed, with Nf3	1. c4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. Nf3 e5 6. O-O Nge7 7. a3
A37	English Opening: Symmetrical Variation, Botvinnik System Reversed, with Nf3	1. c4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. Nf3 e5 6. O-O Nge7 7. d3
A37	English Opening: Symmetrical Variation, Three Knights, Fianchetto Variation	1. c4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. Nf3
A38	English Opening: Symmetrical Variation, Double Fianchetto	1. c4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. Nf3 Nf6 6. O-O O-O 7. b3
A38	English Opening: Symmetrical Variation, Duchamp Variation	1. c4 Nf6 2. Nf3 g6 3. g3 Bg7 4. Bg2 O-O 5. O-O c5 6. Nc3 Nc6 7. d3
A38	English Opening: Symmetrical Variation, Full Symmetry Line	1. c4 Nf6 2. Nf3 c5 3. Nc3 Nc6 4. g3 g6 5. Bg2 Bg7
A39	English Opening: Symmetrical Variation, Mecking Variation	1. c4 Nf6 2. Nf3 c5 3. Nc3 Nc6 4. g3 g6 5. Bg2 Bg7 6. O-O O-O 7. d4
A40	Australian Defense	1. d4 Na6
A40	Benoni Defense: Franco-Sicilian Hybrid	1. d4 e6 2. c4 c5 3. d5 exd5 4. cxd5 d6 5. Nc3 g6 6. e4 Bg7 7. Nf3 Ne7
A40	Borg Defense: Borg Gambit	1. d4 g5
A40	Colle System: Pterodactyl Variation	1. d4 g6 2. Nf3 Bg7 3. e3 c5 4. Bd3 Qa5+
A40	Colle System: Siroccopteryx Variation	1. d4 g6 2. Nf3 Bg7 3. e3 c5 4. Bd3 cxd4 5. Nxd4 Qa5+
A40	English Defense	1. d4 b6
A40	English Defense	1. d4 e6 2. c4 b6
A40	English Defense: Eastbourne Gambit	1. d4 b6 2. c4 Bb7 3. Nc3 e5
A40	English Defense: Hartlaub Gambit Accepted	1. c4 e6 2. d4 b6 3. Nc3 Bb7 4. e4 f5 5. exf5 Nf6
A40	English Defense: Hartlaub Gambit Declined	1. c4 e6 2. d4 b6 3. Nc3 Bb7 4. e4 f5 5. d5
A40	English Defense: Perrin Variation	1. d4 e6 2. c4 b6 3. e4 Bb7 4. Bd3 Nc6
A40	English Defense: Poli Gambit	1. d4 e6 2. c4 b6 3. e4 Bb7 4. f3 f5 5. exf5 Nh6
A40	Englund Gambit	1. d4 e5
A40	Englund Gambit Declined	1. d4 e5 2. d5
A40	Englund Gambit Declined: Diemer Counterattack	1. d4 e5 2. d5 Bc5 3. e4 Qh4
A40	Englund Gambit Declined: Reversed Alekhine	1. d4 e5 2. Nf3
A40	Englund Gambit Declined: Reversed Brooklyn	1. d4 e5 2. Nf3 e4 3. Ng1
A40	Englund Gambit Declined: Reversed French	1. d4 e5 2. e3
A40	Englund Gambit Declined: Reversed Krebs	1. d4 e5 2. Nf3 e4
A40	Englund Gambit Declined: Reversed Mokele Mbembe	1. d4 e5 2. Nf3 e4 3. Ne5
A40	Englund Gambit: Felbecker Gambit	1. d4 e5 2. dxe5 Nc6 3. Nf3 Bc5
A40	Englund Gambit: Hartlaub-Charlick Gambit	1. d4 e5 2. dxe5 d6
A40	Englund Gambit: Main Line	1. d4 e5 2. dxe5 Nc6 3. Nf3 Qe7
A40	Englund Gambit: Mosquito Gambit	1. d4 e5 2. dxe5 Qh4
A40	Englund Gambit: Soller Gambit	1. d4 e5 2. dxe5 f6
A40	Englund Gambit: Soller Gambit Deferred	1. d4 e5 2. dxe5 Nc6 3. Nf3 f6
A40	Englund Gambit: Stockholm Variation	1. d4 e5 2. dxe5 Nc6 3. Nf3 Qe7 4. Qd5
A40	Englund Gambit: Zilbermints Gambit	1. d4 e5 2. dxe5 Nc6 3. Nf3 Nge7
A40	Horwitz Defense	1. d4 e6
A40	Horwitz Defense: Zilbermints Gambit	1. d4 e6 2. c4 e5
A40	Kangaroo Defense	1. d4 e6 2. c4 Bb4+
A40	Kangaroo Defense: Keres Defense, Transpositional Variation	1. d4 e6 2. c4 Bb4+ 3. Nc3
A40	Mikenas Defense	1. d4 Nc6
A40	Mikenas Defense: Cannstatter Variation	1. d4 Nc6 2. c4 e5 3. d5 Nd4
A40	Mikenas Defense: Lithuanian Variation	1. d4 Nc6 2. c4 e5 3. d5 Nce7
A40	Mikenas Defense: Pozarek Gambit	1. d4 Nc6 2. c4 e5 3. dxe5 Nxe5 4. Nc3 Nxc4
A40	Modern Defense: Beefeater Variation	1. d4 g6 2. c4 Bg7 3. Nc3 c5 4. d5 Bxc3+ 5. bxc3 f5
A40	Modern Defense: Lizard Defense, Pirc-Diemer Gambit	1. d4 g6 2. h4 Nf6 3. h5
A40	Montevideo Defense	1. d4 Nc6 2. d5 Nb8
A40	Polish Defense	1. d4 b5
A40	Polish Defense: Spassky Gambit Accepted	1. d4 b5 2. e4 Bb7 3. Bxb5
A40	Pterodactyl Defense: Central, Benoni Beefeater Pterodactyl	1. d4 g6 2. c4 Bg7 3. Nc3 c5 4. d5 d6 5. e4 Bxc3+ 6. bxc3 Qa5
A40	Pterodactyl Defense: Central, Benoni Pterodactyl	1. d4 g6 2. c4 Bg7 3. e4 c5 4. d5 Qa5+
A40	Pterodactyl Defense: Fianchetto, Queen Benoni Pterodactyl	1. d4 g6 2. c4 Bg7 3. Nc3 c5 4. d5 Qa5
A40	Pterodactyl Defense: Fianchetto, Queen Pteranodon	1. d4 g6 2. c4 Bg7 3. Nc3 c5 4. d5 Bxc3+ 5. bxc3 Qa5
A40	Pterodactyl Defense: Fianchetto, Queen Pterodactyl	1. d4 g6 2. Nf3 Bg7 3. g3 c5 4. Bg2 Qa5+
A40	Pterodactyl Defense: Queen Pterodactyl, Quiet Line	1. d4 g6 2. c4 Bg7 3. Nc3 c5 4. e3
A40	Queen's Pawn Game	1. d4
A40	Queen's Pawn Game: Anglo-Slav Opening	1. d4 c6 2. c4 d6
A40	Queen's Pawn Game: Modern Defense	1. d4 g6
A40	Slav Indian: Kudischewitsch Gambit	1. d4 c6 2. Nf3 Nf6 3. c4 b5
A40	Zaire Defense	1. d4 Nc6 2. d5 Nb8 3. e4 Nf6 4. e5 Ng8
A41	Modern Defense	1. d4 g6 2. c4 Bg7 3. Nc3 d6
A41	Modern Defense: Neo-Modern Defense	1. d4 g6 2. c4 Bg7 3. e4 e5
A41	Old Indian Defense	1. d4 d6 2. c4
A41	Queen's Pawn Game	1. d4 d6
A41	Rat Defense: English Rat	1. d4 d6 2. c4 e5
A41	Rat Defense: English Rat, Lisbon Gambit	1. d4 d6 2. c4 e5 3. dxe5 Nc6
A41	Rat Defense: English Rat, Pounds Gambit	1. d4 d6 2. c4 e5 3. dxe5 Be6
A41	Robatsch Defense	1. d4 d6 2. Nf3 g6 3. c4 Bg7 4. e4 Bg4
A41	Wade Defense	1. d4 d6 2. Nf3 Bg4
A41	Zukertort Opening: Wade Defense, Chigorin Plan	1. d4 d6 2. Nf3 Bg4 3. c4 Nd7 4. Qb3 Rb8
A42	Modern Defense: Averbakh System	1. d4 g6 2. c4 Bg7 3. Nc3 d6 4. e4
A42	Modern Defense: Averbakh Variation, Pseudo-Sämisch	1. d4 g6 2. c4 Bg7 3. e4 d6 4. Be3 Nf6 5. f3
A42	Modern Defense: Kotov Variation	1. d4 g6 2. c4 Bg7 3. Nc3 d6 4. e4 Nc6
A42	Modern Defense: Randspringer Variation	1. d4 g6 2. c4 Bg7 3. Nc3 d6 4. e4 f5
A42	Pterodactyl Defense	1. Nf3 c5 2. c4 g6 3. d4 Bg7 4. e4 Qa5+ 5. Nc3 d6
A42	Pterodactyl Defense: Central, Bogolubovia	1. d4 g6 2. c4 Bg7 3. e4 d6 4. Nc3 c5 5. Nge2 Qa5
A43	Benoni Defense: Benoni Gambit Accepted	1. d4 c5 2. dxc5
A43	Benoni Defense: Benoni Gambit, Schlenker Defense	1. d4 c5 2. dxc5 Na6
A43	Benoni Defense: Benoni-Indian Defense	1. d4 c5 2. d5 Nf6
A43	Benoni Defense: Benoni-Indian Defense, Kingside Move Order	1. d4 c5 2. d5 Nf6 3. Nf3
A43	Benoni Defense: Benoni-Staunton Gambit	1. d4 c5 2. d5 f5 3. e4
A43	Benoni Defense: Cormorant Gambit	1. d4 c5 2. dxc5 b6
A43	Benoni Defense: French Benoni	1. e4 e6 2. d4 c5 3. d5
A43	Benoni Defense: Hawk Variation	1. d4 Nf6 2. Nf3 c5 3. d5 c4
A43	Benoni Defense: Old Benoni	1. d4 c5
A43	Benoni Defense: Old Benoni	1. d4 c5 2. d5
A43	Benoni Defense: Old Benoni	1. d4 c5 2. d5 d6
A43	Benoni Defense: Old Benoni, Mujannah Formation	1. d4 c5 2. d5 f5
A43	Benoni Defense: Old Benoni, Schmid Variation	1. d4 c5 2. d5 d6 3. Nc3 g6
A43	Benoni Defense: Snail Variation	1. d4 c5 2. d5 Na6
A43	Benoni Defense: Woozle	1. d4 c5 2. d5 Nf6 3. Nc3 Qa5
A43	Benoni Defense: Zilbermints-Benoni Gambit	1. d4 c5 2. b4
A43	Benoni Defense: Zilbermints-Benoni Gambit	1. d4 c5 2. Nf3 cxd4 3. b4
A43	Benoni Defense: Zilbermints-Benoni Gambit, Tamarkin Countergambit	1. d4 c5 2. Nf3 cxd4 3. b4 e5
A43	Indian Defense: Pseudo-Benko	1. d4 Nf6 2. Nf3 c5 3. d5 b5
A43	Queen's Pawn Game: Liedmann Gambit	1. d4 c5 2. c4 cxd4 3. e3
A44	Benoni Defense: Old Benoni	1. d4 c5 2. d5 e5
A44	Benoni Defense: Semi-Benoni	1. d4 c5 2. d5 e5 3. e4 d6
A45	Amazon Attack: Siberian Attack	1. d4 Nf6 2. Nc3 d5 3. Qd3
A45	Canard Opening	1. d4 Nf6 2. f4
A45	Indian Defense	1. d4 Nf6
A45	Indian Defense: Accelerated London System	1. d4 Nf6 2. Bf4
A45	Indian Defense: Gedult Attack	1. d4 Nf6 2. f3 d5 3. g4
A45	Indian Defense: Gibbins-Weidenhagen Gambit	1. d4 Nf6 2. g4
A45	Indian Defense: Gibbins-Weidenhagen Gambit Accepted	1. d4 Nf6 2. g4 Nxg4
A45	Indian Defense: Gibbins-Weidenhagen Gambit, Maltese Falcon	1. d4 Nf6 2. g4 Nxg4 3. f3 Nf6 4. e4
A45	Indian Defense: Gibbins-Weidenhagen Gambit, Oshima Defense	1. d4 Nf6 2. g4 e5
A45	Indian Defense: Gibbins-Weidenhagen Gambit, Stummer Gambit	1. d4 Nf6 2. g4 Nxg4 3. e4 d6 4. Be2 Nf6 5. Nc3
A45	Indian Defense: Lazard Gambit	1. d4 Nf6 2. Nd2 e5
A45	Indian Defense: Maddigan Gambit	1. d4 Nf6 2. Nc3 e5
A45	Indian Defense: Omega Gambit	1. d4 Nf6 2. e4
A45	Indian Defense: Omega Gambit, Arafat Gambit	1. d4 Nf6 2. e4 Nxe4 3. Bd3 Nf6 4. Bg5
A45	Indian Defense: Paleface Attack, Blackmar-Diemer Gambit Deferred	1. d4 Nf6 2. f3 d5 3. e4
A45	Indian Defense: Pawn Push Variation	1. d4 Nf6 2. d5
A45	Indian Defense: Reversed Chigorin Defense	1. d4 Nf6 2. Nc3 c5
A45	Indian Defense: Tartakower Attack	1. d4 Nf6 2. g3
A45	Paleface Attack	1. d4 Nf6 2. f3
A45	Queen's Pawn Game: Chigorin Variation	1. d4 Nf6 2. Nc3 d5
A45	Queen's Pawn Game: Veresov, Richter Attack	1. d4 Nf6 2. f3 d5 3. Nc3
A45	Trompowsky Attack	1. d4 Nf6 2. Bg5
A45	Trompowsky Attack: Borg Variation	1. d4 Nf6 2. Bg5 Ne4 3. Bf4 g5
A45	Trompowsky Attack: Classical Defense	1. d4 Nf6 2. Bg5 e6
A45	Trompowsky Attack: Classical Defense, Big Center Variation	1. d4 Nf6 2. Bg5 e6 3. e4
A45	Trompowsky Attack: Edge Variation	1. d4 Nf6 2. Bg5 Ne4 3. Bh4
A45	Trompowsky Attack: Edge Variation, Hergert Gambit	1. d4 Nf6 2. Bg5 Ne4 3. Bh4 c6 4. Nd2 Qa5 5. c3 Nxd2 6. Qxd2 d5 7. e4
A45	Trompowsky Attack: Edge Variation, Hergert Gambit	1. d4 Nf6 2. Bg5 Ne4 3. Bh4 d5 4. f3 Nf6 5. Nc3 Bf5 6. e4
A45	Trompowsky Attack: Poisoned Pawn Variation	1. d4 Nf6 2. Bg5 c5 3. d5 Qb6 4. Nc3
A45	Trompowsky Attack: Raptor Variation	1. d4 Nf6 2. Bg5 Ne4 3. h4
A45	Trompowsky Attack: Raptor Variation, Hergert Gambit	1. d4 Nf6 2. Bg5 Ne4 3. h4 Nxg5 4. hxg5 e5
A46	Döry Defense	1. d4 Nf6 2. Nf3 Ne4
A46	Indian Defense: Czech-Indian	1. d4 Nf6 2. Nf3 c6
A46	Indian Defense: Knights Variation	1. d4 Nf6 2. Nf3
A46	Indian Defense: Knights Variation, Alburt-Miles Variation	1. d4 Nf6 2. Nf3 a6
A46	Indian Defense: London System	1. d4 Nf6 2. Nf3 e6 3. Bf4
A46	Indian Defense: Polish Variation	1. d4 Nf6 2. Nf3 b5
A46	Indian Defense: Spielmann-Indian	1. d4 Nf6 2. Nf3 c5
A46	Indian Defense: Wade-Tartakower Defense	1. d4 Nf6 2. Nf3 d6
A46	Queen's Pawn Game: Torre Attack, Breyer Variation	1. d4 Nf6 2. Nf3 e6 3. Bg5 d5 4. e3 c5 5. c3 Qb6
A46	Queen's Pawn Game: Veresov Attack, Classical Defense	1. d4 Nf6 2. Nf3 e6 3. Nc3 d5 4. Bg5
A46	Torre Attack: Classical Defense	1. d4 Nf6 2. Nf3 e6 3. Bg5
A46	Torre Attack: Classical Defense, Nimzowitsch Variation	1. d4 Nf6 2. Nf3 e6 3. Bg5 h6
A46	Torre Attack: Classical Defense, Petrosian Gambit	1. d4 Nf6 2. Nf3 e6 3. Bg5 c5 4. e3 b6 5. d5
A46	Torre Attack: Wagner Gambit	1. d4 Nf6 2. Nf3 e6 3. Bg5 c5 4. e4
A46	Yusupov-Rubinstein System	1. d4 Nf6 2. Nf3 e6 3. e3
A47	Indian Defense: Schnepper Gambit	1. d4 Nf6 2. Nf3 b6 3. c3 e5
A47	Marienbad System	1. d4 Nf6 2. Nf3 b6 3. g3 Bb7 4. Bg2 c5
A47	Marienbad System: Berg Variation	1. d4 Nf6 2. Nf3 b6 3. g3 Bb7 4. Bg2 c5 5. c4 cxd4 6. Qxd4
A47	Pseudo Queen's Indian Defense	1. d4 Nf6 2. Nf3 b6
A48	East Indian Defense	1. d4 Nf6 2. Nf3 g6
A48	Indian Defense: Colle System, King's Indian Variation	1. d4 Nf6 2. Nf3 g6 3. e3 Bg7 4. Bd3 d6
A48	London System	1. d4 Nf6 2. Nf3 g6 3. Bf4
A48	London System	1. d4 Nf6 2. Nf3 g6 3. Bf4 Bg7 4. e3
A48	London System	1. d4 Nf6 2. Nf3 g6 3. Bf4 Bg7 4. e3 d6
A48	London System, with Bd3	1. d4 Nf6 2. Nf3 g6 3. Bf4 Bg7 4. e3 d6 5. Bd3
A48	London System, with Be2	1. d4 Nf6 2. Nf3 g6 3. Bf4 Bg7 4. e3 d6 5. Be2
A48	London System, with Be2	1. d4 Nf6 2. Nf3 g6 3. Bf4 Bg7 4. e3 d6 5. Be2 O-O
A48	London System, with Be2	1. d4 Nf6 2. Nf3 g6 3. Bf4 Bg7 4. e3 d6 5. h3 c5 6. Be2
A48	Queen's Pawn Game: Barry Attack	1. d4 Nf6 2. Nf3 g6 3. Nc3 d5 4. Bf4
A48	Queen's Pawn Game: Barry Attack	1. d4 Nf6 2. Nf3 g6 3. Nc3 d5 4. Bf4 Bg7
A48	Queen's Pawn Game: Barry Attack, Grünfeld Variation	1. d4 Nf6 2. Nf3 g6 3. Nc3 d5 4. Bf4 Bg7 5. e3 O-O 6. Be2
A48	Queen's Pawn Game: Barry Attack, Tarzan Attack	1. d4 Nf6 2. Nf3 g6 3. Nc3 d5 4. Bf4 Bg7 5. Qd2
A48	Queen's Pawn Game: Torre Attack, Grünfeld Variation, Main Line	1. d4 Nf6 2. Nf3 g6 3. Bg5 Bg7 4. Nbd2 d5 5. e3 O-O
A48	Torre Attack: Fianchetto Defense	1. d4 Nf6 2. Nf3 g6 3. Bg5
A48	Torre Attack: Fianchetto Defense, Euwe Variation	1. d4 Nf6 2. Nf3 g6 3. Bg5 Bg7 4. Nbd2 c5
A49	Indian Defense: Przepiorka Variation	1. d4 Nf6 2. Nf3 g6 3. g3
A50	Indian Defense: Medusa Gambit	1. d4 Nf6 2. c4 g5
A50	Indian Defense: Normal Variation	1. d4 Nf6 2. c4
A50	Indian Defense: Pyrenees Gambit	1. d4 Nf6 2. c4 b5
A50	Mexican Defense	1. d4 Nf6 2. c4 Nc6
A50	Mexican Defense: Horsefly Gambit	1. d4 Nf6 2. c4 Nc6 3. d5 Ne5 4. f4
A50	Queen's Indian Accelerated	1. d4 Nf6 2. c4 b6
A50	Slav Indian	1. d4 Nf6 2. c4 c6
A51	Indian Defense: Budapest Defense	1. d4 Nf6 2. c4 e5
A51	Indian Defense: Budapest Defense, Fajarowicz Defense, Bonsdorf Variation	1. d4 Nf6 2. c4 e5 3. dxe5 Ne4 4. a3 b6
A51	Indian Defense: Budapest Defense, Fajarowicz Variation	1. d4 Nf6 2. c4 e5 3. dxe5 Ne4
A51	Indian Defense: Budapest Defense, Fajarowicz-Steiner Variation	1. d4 Nf6 2. c4 e5 3. dxe5 Ne4 4. Qc2
A52	Indian Defense: Budapest Defense	1. d4 Nf6 2. c4 e5 3. dxe5 Ng4
A52	Indian Defense: Budapest Defense, Adler Variation	1. d4 Nf6 2. c4 e5 3. dxe5 Ng4 4. Nf3
A52	Indian Defense: Budapest Defense, Alekhine Variation	1. d4 Nf6 2. c4 e5 3. dxe5 Ng4 4. e4
A52	Indian Defense: Budapest Defense, Alekhine Variation, Abonyi Variation	1. d4 Nf6 2. c4 e5 3. dxe5 Ng4 4. e4 Nxe5 5. f4 Nec6
A52	Indian Defense: Budapest Defense, Alekhine Variation, Tartakower Defense	1. d4 Nf6 2. c4 e5 3. dxe5 Ng4 4. e4 d6
A52	Indian Defense: Budapest Defense, Rubinstein Variation	1. d4 Nf6 2. c4 e5 3. dxe5 Ng4 4. Bf4
A53	Old Indian Defense	1. d4 Nf6 2. c4 d6
A53	Old Indian Defense: Aged Gibbon Gambit	1. d4 Nf6 2. c4 d6 3. g4
A53	Old Indian Defense: Czech Variation, with Nc3	1. d4 Nf6 2. c4 d6 3. Nc3 c6
A53	Old Indian Defense: Czech Variation, with Nf3	1. d4 Nf6 2. c4 d6 3. Nf3 c6
A53	Old Indian Defense: Janowski Variation	1. d4 Nf6 2. c4 d6 3. Nc3 Bf5
A53	Old Indian Defense: Janowski Variation, Fianchetto Variation	1. d4 Nf6 2. c4 d6 3. Nc3 Bf5 4. g3
A53	Old Indian Defense: Janowski Variation, Grinberg Gambit	1. d4 Nf6 2. c4 d6 3. Nc3 Bf5 4. e4
A53	Old Indian Defense: Janowski Variation, Main Line	1. d4 Nf6 2. c4 d6 3. Nc3 Bf5 4. f3
A54	Old Indian Defense: Duz-Khotimirsky Variation	1. d4 Nf6 2. c4 d6 3. Nc3 e5 4. e3 Nbd7 5. Bd3
A54	Old Indian Defense: Tartakower-Indian	1. d4 Nf6 2. c4 d6 3. Nf3 Bg4
A54	Old Indian Defense: Two Knights Variation	1. d4 Nf6 2. c4 d6 3. Nc3 e5 4. Nf3
A54	Old Indian Defense: Ukrainian Variation	1. d4 Nf6 2. c4 d6 3. Nc3 e5
A55	Old Indian Defense: Normal Variation	1. d4 Nf6 2. c4 d6 3. Nc3 Nbd7 4. e4 e5 5. Nf3
A56	Benoni Defense	1. d4 Nf6 2. c4 c5
A56	Benoni Defense: Czech Benoni Defense	1. d4 Nf6 2. c4 c5 3. d5 e5
A56	Benoni Defense: Hromádka System	1. d4 Nf6 2. c4 c5 3. d5 d6
A56	Benoni Defense: King's Indian System	1. d4 Nf6 2. c4 c5 3. d5 e5 4. Nc3 d6 5. e4 g6
A56	Benoni Defense: Weenink Variation	1. d4 Nf6 2. c4 c5 3. dxc5 e6
A56	Grünfeld Defense: Three Knights Variation, Burille Variation, Reversed Tarrasch	1. d4 Nf6 2. c4 c5 3. e3 g6 4. Nc3 Bg7 5. Nf3 O-O 6. Be2 cxd4 7. exd4 d5 8. O-O Nc6
A56	Vulture Defense	1. d4 Nf6 2. c4 c5 3. d5 Ne4
A57	Benko Gambit	1. d4 Nf6 2. c4 c5 3. d5 b5
A57	Benko Gambit Accepted	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6
A57	Benko Gambit Accepted: Dlugy Variation	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. f3
A57	Benko Gambit Accepted: Modern Variation	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. e3
A57	Benko Gambit Accepted: Pawn Return Variation	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. b6
A57	Benko Gambit Declined: Bishop Attack	1. d4 Nf6 2. c4 c5 3. d5 b5 4. Bg5
A57	Benko Gambit Declined: Hjørring Countergambit	1. d4 Nf6 2. c4 c5 3. d5 b5 4. e4
A57	Benko Gambit Declined: Main Line	1. d4 Nf6 2. c4 c5 3. d5 b5 4. Nf3
A57	Benko Gambit Declined: Pseudo-Sämisch	1. d4 Nf6 2. c4 c5 3. d5 b5 4. f3
A57	Benko Gambit Declined: Quiet Line	1. d4 Nf6 2. c4 c5 3. d5 b5 4. Nd2
A57	Benko Gambit Declined: Sosonko Variation	1. d4 Nf6 2. c4 c5 3. d5 b5 4. a4
A57	Benko Gambit: Mutkin Countergambit	1. d4 Nf6 2. c4 c5 3. d5 b5 4. g4
A57	Benko Gambit: Nescafe Frappe Attack	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. Nc3 axb5 6. e4 b4 7. Nb5 d6 8. Bc4
A57	Benko Gambit: Zaitsev System	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. Nc3
A57	Benko Gambit: Zaitsev Variation, Nescafe Frappe Attack	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. Nc3 axb5 6. e4 b4 7. Nb5
A58	Benko Gambit Accepted: Central Storming Variation	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. bxa6 g6 6. Nc3 Bxa6 7. f4
A58	Benko Gambit Accepted: Fianchetto Variation	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. bxa6 g6 6. Nc3 Bxa6 7. g3 d6 8. Bg2 Bg7 9. Nf3
A58	Benko Gambit Accepted: Fully Accepted Variation	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. bxa6
A58	Benko Gambit: Fianchetto Variation	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. bxa6 Bxa6 6. Nc3 d6 7. Nf3 g6 8. g3
A58	Benko Gambit: Nd2 Variation	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. bxa6 Bxa6 6. Nc3 d6 7. Nf3 g6 8. Nd2
A59	Benko Gambit	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. bxa6 g6 6. Nc3 Bxa6 7. e4 Bxf1 8. Kxf1 d6 9. g3
A59	Benko Gambit Accepted: King Walk Variation	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. bxa6 g6 6. Nc3 Bxa6 7. Nf3 d6 8. e4 Bxf1 9. Kxf1 Bg7 10. g3 O-O 11. Kg2
A59	Benko Gambit Accepted: Yugoslav	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. bxa6 Bxa6 6. Nc3 d6 7. e4
A59	Benko Gambit Accepted: Yugoslav	1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. bxa6 g6 6. Nc3 Bxa6 7. e4 Bxf1 8. Kxf1 d6 9. Nge2
A60	Benoni Defense: Modern Variation	1. d4 Nf6 2. c4 c5 3. d5 e6
A60	Benoni Defense: Modern Variation, Snake Variation	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 Bd6
A61	Benoni Defense	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6
A61	Benoni Defense: Fianchetto Variation	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6 7. g3
A61	Benoni Defense: Knight's Tour Variation	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6 7. Nd2
A61	Benoni Defense: Uhlmann Variation	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6 7. Bg5
A62	Benoni Defense: Fianchetto Variation	1. d4 Nf6 2. c4 e6 3. g3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6 7. Bg2 Bg7 8. Nf3 O-O
A63	Benoni Defense: Fianchetto Variation, Hastings Defense	1. d4 Nf6 2. c4 e6 3. g3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6 7. Bg2 Bg7 8. Nf3 O-O 9. O-O Nbd7
A64	Benoni Defense: Fianchetto Variation, Hastings Defense, Main Line	1. d4 Nf6 2. c4 e6 3. g3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6 7. Bg2 Bg7 8. Nf3 O-O 9. O-O a6 10. a4 Nbd7 11. Nd2 Re8
A65	Benoni Defense: King's Pawn Line	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4
A65	Benoni Defense: King's Pawn Line	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. f3 Bg7
A65	Benoni Defense: King's Pawn Line	1. d4 Nf6 2. c4 g6 3. f3 c5 4. d5 d6 5. e4 Bg7 6. Nc3 e6 7. Be3 O-O 8. Qd2 exd5 9. cxd5
A65	Benoni Defense: King's Pawn Line, with Be3	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. f3 Bg7 8. Be3
A65	Benoni Defense: King's Pawn Line, with Bg5	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Bg5 c5 7. d5
A65	Benoni Defense: King's Pawn Line, with Bg5	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. f3 Bg7 8. Bg5
A65	Benoni Defense: King's Pawn Line, with Bg5	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Bg5 c5 7. d5 e6 8. Qd2 exd5 9. exd5
A65	Benoni Defense: King's Pawn Line, with Nge2	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. f3 Bg7 8. Nge2
A65	Benoni Defense: King's Pawn Line, with Nge2	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Nge2 c5 7. d5 e6 8. Ng3 exd5 9. cxd5
A66	Benoni Defense: Mikenas Variation	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. f4 Bg7 8. e5
A66	Benoni Defense: Pawn Storm Variation	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. f4
A67	Benoni Defense: Taimanov Variation	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. f4 Bg7 8. Bb5+
A68	Benoni Defense: Four Pawns Attack	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. f4 Bg7 8. Nf3 O-O
A69	Benoni Defense: Four Pawns Attack, Main Line	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. f4 Bg7 8. Nf3 O-O 9. Be2 Re8
A70	Benoni Defense: Classical Variation	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6 7. e4
A70	Benoni Defense: Classical Variation, New York Variation	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6 7. e4 Bg7 8. h3
A70	Benoni Defense: Classical Variation, Traditional Variation	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6 7. e4 Bg7 8. Be2
A71	Benoni Defense: Classical Variation, Averbakh-Grivas Attack	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6 7. e4 Bg7 8. Bg5
A72	Benoni Defense: Classical Variation	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. Nf3 Bg7 8. Be2 O-O
A73	Benoni Defense: Classical Variation, Main Line	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. Nf3 Bg7 8. Be2 O-O 9. O-O
A74	Benoni Defense: Classical Variation, Full Line	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. Nf3 Bg7 8. Be2 O-O 9. O-O a6 10. a4
A75	Benoni Defense: Classical Variation, Argentine Counterattack	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6 7. e4 Bg7 8. Be2 O-O 9. O-O a6 10. a4 Bg4
A76	Benoni Defense: Classical Variation, Czerniak Defense	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. Nf3 Bg7 8. Be2 O-O 9. O-O Re8
A77	Benoni Defense: Classical Variation, Czerniak Defense, Tal Line	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. Nf3 Bg7 8. Be2 O-O 9. O-O Re8 10. Nd2
A78	Benoni Defense: Classical Variation, Czerniak Defense	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 exd5 5. cxd5 d6 6. Nc3 g6 7. e4 Bg7 8. Be2 O-O 9. O-O Re8 10. Nd2 Na6
A79	Benoni Defense: Classical Variation, Czerniak Defense	1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. Nf3 Bg7 8. Be2 O-O 9. O-O Re8 10. Nd2 Na6 11. f3
A80	Dutch Defense	1. d4 f5
A80	Dutch Defense: Alapin Variation	1. d4 f5 2. Qd3
A80	Dutch Defense: Hevendehl Gambit	1. d4 f5 2. g4 e5
A80	Dutch Defense: Hopton Attack	1. d4 f5 2. Bg5
A80	Dutch Defense: Janzen-Korchnoi Gambit	1. d4 f5 2. h3 Nf6 3. g4
A80	Dutch Defense: Kingfisher Gambit	1. d4 f5 2. Nc3 d5 3. e4
A80	Dutch Defense: Korchnoi Attack	1. d4 f5 2. h3
A80	Dutch Defense: Krejcik Gambit	1. d4 f5 2. g4
A80	Dutch Defense: Krejcik Gambit, Tate Gambit	1. d4 f5 2. g4 fxg4 3. e4 d5 4. Nc3
A80	Dutch Defense: Manhattan Gambit, Anti-Classical Line	1. d4 f5 2. Qd3 e6 3. g4
A80	Dutch Defense: Manhattan Gambit, Anti-Leningrad	1. d4 f5 2. Qd3 g6 3. g4
A80	Dutch Defense: Manhattan Gambit, Anti-Modern	1. d4 f5 2. Qd3 d6 3. g4
A80	Dutch Defense: Manhattan Gambit, Anti-Stonewall	1. d4 f5 2. Qd3 d5 3. g4
A80	Dutch Defense: Omega-Isis Gambit	1. d4 f5 2. Nf3 e5
A80	Dutch Defense: Raphael Variation	1. d4 f5 2. Nc3
A80	Dutch Defense: Senechaud Gambit	1. d4 f5 2. Bf4 e6 3. g4
A80	Dutch Defense: Spielmann Gambit	1. d4 f5 2. Nc3 Nf6 3. g4
A80	Queen's Pawn Game: Veresov Attack, Dutch System	1. d4 f5 2. Nc3 d5
A81	Dutch Defense: Blackburne Variation	1. d4 f5 2. g3 Nf6 3. Bg2 e6 4. Nh3
A81	Dutch Defense: Fianchetto Attack	1. d4 f5 2. g3
A81	Dutch Defense: Leningrad Variation, Carlsbad Variation	1. d4 f5 2. g3 g6 3. Bg2 Bg7 4. Nh3
A81	Dutch Defense: Leningrad, Basman System	1. d4 f5 2. g3 c6 3. Bg2 g6 4. Nf3 Bg7 5. O-O Nh6
A81	Dutch Defense: Semi-Leningrad Variation	1. d4 f5 2. g3 Nf6 3. Bg2 g6
A82	Dutch Defense: Blackmar's Second Gambit	1. d4 f5 2. e4 fxe4 3. Nc3 Nf6 4. f3
A82	Dutch Defense: Staunton Gambit	1. d4 f5 2. e4
A82	Dutch Defense: Staunton Gambit Accepted	1. d4 f5 2. e4 fxe4
A82	Dutch Defense: Staunton Gambit, American Attack	1. d4 f5 2. e4 fxe4 3. Nd2
A82	Dutch Defense: Staunton Gambit, Tartakower Variation	1. d4 f5 2. e4 fxe4 3. Nc3 Nf6 4. g4
A82	Rat Defense: Balogh Defense	1. e4 d6 2. d4 f5
A83	Dutch Defense: Staunton Gambit	1. d4 f5 2. e4 fxe4 3. Nc3 Nf6 4. Bg5
A83	Dutch Defense: Staunton Gambit, Alekhine Variation	1. d4 f5 2. e4 fxe4 3. Nc3 Nf6 4. Bg5 g6 5. h4
A83	Dutch Defense: Staunton Gambit, Chigorin Variation	1. d4 f5 2. e4 fxe4 3. Nc3 Nf6 4. Bg5 c6
A83	Dutch Defense: Staunton Gambit, Lasker Variation	1. d4 f5 2. e4 fxe4 3. Nc3 Nf6 4. Bg5 g6 5. f3
A83	Dutch Defense: Staunton Gambit, Nimzowitsch Variation	1. d4 f5 2. e4 fxe4 3. Nc3 Nf6 4. Bg5 b6
A84	Dutch Defense	1. d4 f5 2. c4
A84	Dutch Defense: Bellon Gambit	1. d4 f5 2. c4 e6 3. e4
A84	Dutch Defense: Bladel Variation	1. d4 f5 2. c4 g6 3. Nc3 Nh6
A84	Dutch Defense: Classical Variation	1. d4 f5 2. c4 e6
A84	Dutch Defense: Krause Variation	1. d4 f5 2. c4 Nf6 3. Nc3 d6 4. Nf3 Nc6
A84	Dutch Defense: Normal Variation	1. d4 f5 2. c4 Nf6
A84	Dutch Defense: Rubinstein Variation	1. d4 f5 2. c4 e6 3. Nc3
A85	Dutch Defense: Queen's Knight Variation	1. d4 f5 2. c4 Nf6 3. Nc3
A86	Dutch Defense: Fianchetto Variation	1. d4 f5 2. c4 Nf6 3. g3
A86	Dutch Defense: Hort-Antoshin System	1. d4 f5 2. c4 Nf6 3. g3 d6 4. Bg2 c6 5. Nc3 Qc7
A86	Dutch Defense: Leningrad Variation	1. d4 f5 2. c4 Nf6 3. g3 g6
A87	Dutch Defense: Leningrad Variation	1. d4 f5 2. c4 Nf6 3. g3 g6 4. Bg2 Bg7 5. Nf3
A88	Dutch Defense: Leningrad Variation, Warsaw Variation	1. d4 f5 2. g3 Nf6 3. Bg2 g6 4. Nf3 Bg7 5. O-O O-O 6. c4 d6 7. Nc3 c6
A89	Dutch Defense: Leningrad Variation, Matulovic Variation	1. d4 f5 2. g3 Nf6 3. Bg2 g6 4. Nf3 Bg7 5. O-O O-O 6. c4 d6 7. Nc3 Nc6
A90	Dutch Defense: Classical Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2
A90	Dutch Defense: Classical Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 d5 5. Nf3
A90	Dutch Defense: Nimzo-Dutch Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Bb4+
A90	Dutch Defense: Nimzo-Dutch Variation, Alekhine Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Bb4+ 5. Bd2 Be7
A90	Dutch Defense: Stonewall Variation, Modern Variation	1. d4 f5 2. c4 e6 3. Nf3 Nf6 4. g3 c6 5. Bg2 d5 6. O-O Bd6
A91	Dutch Defense: Classical Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7
A91	Dutch Defense: Classical Variation, Blackburne Attack	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nh3
A92	Dutch Defense: Alekhine Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O Ne4
A92	Dutch Defense: Classical Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O
A92	Dutch Defense: Stonewall Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d5 7. Nc3
A92	Dutch Defense: Stonewall Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d5
A93	Dutch Defense: Stonewall Variation, Botvinnik Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d5 7. b3
A94	Dutch Defense: Stonewall Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d5 7. b3 c6 8. Ba3
A95	Dutch Defense: Stonewall Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d5 7. Nc3 c6
A95	Dutch Defense: Stonewall Variation, Chekhover Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d5 7. Nc3 c6 8. Qc2 Qe8 9. Bg5
A96	Dutch Defense: Classical Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d6
A96	Dutch Defense: Classical Variation, Buenos Aires Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d6 7. Nc3 a5
A96	Dutch Defense: Classical Variation, Huisl Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d6 7. Nc3 Ne4
A97	Dutch Defense: Classical Variation, Ilyin-Zhenevsky Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d6 7. Nc3 Qe8
A97	Dutch Defense: Classical Variation, Ilyin-Zhenevsky Variation, Winter Variation	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d6 7. Nc3 Qe8 8. Re1
A98	Dutch Defense: Classical Variation, Ilyin-Zhenevsky Variation, Alatortsev-Lisitsyn Line	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d6 7. Nc3 Qe8 8. Qc2
A99	Dutch Defense: Classical Variation, Ilyin-Zhenevsky Variation, Modern Main Line	1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d6 7. Nc3 Qe8 8. b3
`,
  Ho = `eco	name	pgn
B00	Barnes Defense	1. e4 f6
B00	Borg Defense	1. e4 g5
B00	Borg Defense: Borg Gambit	1. e4 g5 2. d4 Bg7
B00	Borg Defense: Troon Gambit	1. e4 g5 2. d4 h6 3. h4 g4
B00	Borg Defense: Zilbermints Gambit	1. e4 g5 2. d4 e5
B00	Carr Defense	1. e4 h6
B00	Carr Defense: Zilbermints Gambit	1. e4 h6 2. d4 e5
B00	Duras Gambit	1. e4 f5
B00	Fried Fox Defense	1. e4 f6 2. d4 Kf7
B00	Goldsmith Defense	1. e4 h5
B00	Goldsmith Defense: Picklepuss Defense	1. e4 h5 2. d4 Nf6
B00	Hippopotamus Defense	1. e4 Nh6
B00	Hippopotamus Defense	1. e4 Nh6 2. d4 g6 3. c4 f6
B00	King's Pawn Game	1. e4
B00	Lemming Defense	1. e4 Na6
B00	Lion Defense: Lion's Jaw	1. e4 d6 2. d4 Nf6 3. f3
B00	Nimzowitsch Defense	1. e4 Nc6
B00	Nimzowitsch Defense	1. e4 Nc6 2. d4
B00	Nimzowitsch Defense: Breyer Variation	1. e4 Nc6 2. Nc3 Nf6 3. d4 e5
B00	Nimzowitsch Defense: Colorado Countergambit	1. e4 Nc6 2. Nf3 f5
B00	Nimzowitsch Defense: Colorado Countergambit Accepted	1. e4 Nc6 2. Nf3 f5 3. exf5
B00	Nimzowitsch Defense: Declined Variation	1. e4 Nc6 2. Nf3
B00	Nimzowitsch Defense: El Columpio Defense	1. e4 Nc6 2. Nf3 Nf6 3. e5 Ng4
B00	Nimzowitsch Defense: El Columpio Defense, El Columpio Gambit	1. e4 Nc6 2. Nf3 Nf6 3. e5 Ng4 4. d4 d6 5. h3 Nh6 6. e6
B00	Nimzowitsch Defense: El Columpio Defense, Exchange Variation	1. e4 Nc6 2. Nf3 Nf6 3. e5 Ng4 4. d4 d6 5. h3 Nh6 6. exd6
B00	Nimzowitsch Defense: El Columpio Defense, Pin Variation	1. e4 Nc6 2. Nf3 Nf6 3. e5 Ng4 4. d4 d6 5. h3 Nh6 6. Bb5
B00	Nimzowitsch Defense: Franco-Nimzowitsch Variation	1. e4 Nc6 2. Nf3 e6
B00	Nimzowitsch Defense: French Connection	1. e4 Nc6 2. Nc3 e6
B00	Nimzowitsch Defense: Hornung Gambit	1. e4 Nc6 2. d4 d5 3. Be3
B00	Nimzowitsch Defense: Kennedy Variation	1. e4 Nc6 2. d4 e5
B00	Nimzowitsch Defense: Kennedy Variation, Bielefelder Gambit	1. e4 Nc6 2. d4 e5 3. dxe5 Bc5
B00	Nimzowitsch Defense: Kennedy Variation, Hammer Gambit	1. e4 Nc6 2. d4 e5 3. dxe5 f6
B00	Nimzowitsch Defense: Kennedy Variation, Herford Gambit	1. e4 Nc6 2. d4 e5 3. dxe5 Qh4
B00	Nimzowitsch Defense: Kennedy Variation, Keres Attack	1. e4 Nc6 2. d4 e5 3. dxe5 Nxe5 4. Nc3
B00	Nimzowitsch Defense: Kennedy Variation, Linksspringer Variation	1. e4 Nc6 2. d4 e5 3. d5
B00	Nimzowitsch Defense: Kennedy Variation, Main Line	1. e4 Nc6 2. d4 e5 3. dxe5 Nxe5 4. f4 Ng6
B00	Nimzowitsch Defense: Kennedy Variation, Paulsen Attack	1. e4 Nc6 2. d4 e5 3. dxe5 Nxe5 4. Nf3
B00	Nimzowitsch Defense: Kennedy Variation, Riemann Defense	1. e4 Nc6 2. d4 e5 3. dxe5 Nxe5 4. f4 Nc6
B00	Nimzowitsch Defense: Kennedy Variation, de Smet Gambit	1. e4 Nc6 2. d4 e5 3. dxe5 d6
B00	Nimzowitsch Defense: Mikenas Variation	1. e4 Nc6 2. d4 d6
B00	Nimzowitsch Defense: Neo-Mongoloid Defense	1. e4 Nc6 2. d4 f6
B00	Nimzowitsch Defense: Pirc Connection	1. e4 Nc6 2. Nc3 g6
B00	Nimzowitsch Defense: Pseudo-Spanish Variation	1. e4 Nc6 2. Bb5
B00	Nimzowitsch Defense: Scandinavian Variation	1. e4 Nc6 2. d4 d5
B00	Nimzowitsch Defense: Scandinavian Variation, Aachen Gambit	1. e4 Nc6 2. d4 d5 3. exd5 Nb4
B00	Nimzowitsch Defense: Scandinavian Variation, Advance Variation	1. e4 Nc6 2. d4 d5 3. e5
B00	Nimzowitsch Defense: Scandinavian Variation, Bogoljubow Variation	1. e4 Nc6 2. d4 d5 3. Nc3
B00	Nimzowitsch Defense: Scandinavian Variation, Bogoljubow Variation	1. e4 Nc6 2. d4 d5 3. Nc3 dxe4
B00	Nimzowitsch Defense: Scandinavian Variation, Bogoljubow Variation, Brandics Gambit	1. e4 Nc6 2. d4 d5 3. Nc3 a6
B00	Nimzowitsch Defense: Scandinavian Variation, Bogoljubow Variation, Erben Gambit	1. e4 Nc6 2. d4 d5 3. Nc3 g6
B00	Nimzowitsch Defense: Scandinavian Variation, Bogoljubow Variation, Heinola-Deppe Gambit	1. e4 Nc6 2. d4 d5 3. Nc3 e5
B00	Nimzowitsch Defense: Scandinavian Variation, Bogoljubow Variation, Nimzowitsch Gambit	1. e4 Nc6 2. d4 d5 3. Nc3 dxe4 4. d5 Ne5
B00	Nimzowitsch Defense: Scandinavian Variation, Bogoljubow Variation, Richter Gambit	1. e4 Nc6 2. d4 d5 3. Nc3 dxe4 4. d5 Nb8 5. f3
B00	Nimzowitsch Defense: Scandinavian Variation, Bogoljubow Variation, Vehre Variation	1. e4 Nc6 2. d4 d5 3. Nc3 Nf6
B00	Nimzowitsch Defense: Scandinavian Variation, Exchange Variation	1. e4 Nc6 2. d4 d5 3. exd5 Qxd5
B00	Nimzowitsch Defense: Scandinavian Variation, Exchange Variation, Marshall Gambit	1. e4 Nc6 2. d4 d5 3. exd5 Qxd5 4. Nc3
B00	Nimzowitsch Defense: Wheeler Gambit	1. e4 Nc6 2. b4
B00	Nimzowitsch Defense: Williams Variation	1. e4 Nc6 2. Nf3 d6
B00	Nimzowitsch Defense: Woodchuck Variation	1. e4 Nc6 2. d4 a6
B00	Owen Defense	1. e4 b6
B00	Owen Defense: Guatemala Defense	1. e4 b6 2. d4 Ba6
B00	Owen Defense: Hekili-Loa Gambit	1. e4 b6 2. d4 c5 3. dxc5 Nc6
B00	Owen Defense: Matovinsky Gambit	1. e4 b6 2. d4 Bb7 3. Bd3 f5 4. exf5 Bxg2 5. Qh5+ g6
B00	Owen Defense: Naselwaus Gambit	1. e4 b6 2. d4 Bb7 3. Bg5
B00	Owen Defense: Smith Gambit	1. e4 b6 2. d4 Bb7 3. Nf3
B00	Owen Defense: Unicorn Variation	1. e4 f6 2. d4 b6 3. c4 Bb7
B00	Owen Defense: Wind Gambit	1. e4 b6 2. d4 Bb7 3. f3 e5
B00	Pirc Defense	1. e4 d6
B00	Pirc Defense	1. e4 d6 2. d4
B00	Pirc Defense	1. e4 d6 2. d4 Nf6
B00	Pirc Defense: Roscher Gambit	1. e4 d6 2. d4 Nf6 3. Nf3
B00	Rat Defense: Antal Defense	1. e4 d6 2. d4 Nd7
B00	Rat Defense: Fuller Gambit	1. e4 d6 2. f4 d5 3. exd5 Nf6
B00	Rat Defense: Harmonist	1. e4 d6 2. f4
B00	Rat Defense: Petruccioli Attack	1. e4 d6 2. h4
B00	Rat Defense: Spike Attack	1. e4 d6 2. g4
B00	St. George Defense	1. e4 a6
B00	St. George Defense: Polish Variation	1. e4 a6 2. d4 b5 3. Nf3 Bb7 4. Bd3 e6
B00	St. George Defense: San Jorge Variation	1. e4 a6 2. d4 b5 3. Nf3 Bb7 4. Bd3 d6 5. O-O g6 6. c3 Bg7
B00	St. George Defense: Zilbermints Gambit	1. e4 a6 2. d4 e5
B00	Van Geet Opening: Berlin Gambit	1. e4 Nc6 2. d4 d5 3. Nc3 dxe4 4. d5
B00	Ware Defense	1. e4 a5
B00	Ware Defense: Snagglepuss Defense	1. e4 a5 2. d4 Nc6
B01	Scandinavian Defense	1. e4 d5
B01	Scandinavian Defense	1. e4 d5 2. b3
B01	Scandinavian Defense: Anderssen Counterattack	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 e5
B01	Scandinavian Defense: Anderssen Counterattack, Collijn Variation	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 e5 5. Nf3 Bg4
B01	Scandinavian Defense: Anderssen Counterattack, Goteborg System	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 e5 5. Nf3
B01	Scandinavian Defense: Anderssen Counterattack, Orthodox Attack	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 e5 5. dxe5 Nc6 6. Nf3 Bb4 7. Bd2
B01	Scandinavian Defense: Blackburne Gambit	1. e4 d5 2. exd5 c6 3. dxc6 Nxc6
B01	Scandinavian Defense: Blackburne-Kloosterboer Gambit	1. e4 d5 2. exd5 c6
B01	Scandinavian Defense: Boehnke Gambit	1. e4 d5 2. exd5 e5 3. dxe6 Bxe6
B01	Scandinavian Defense: Bronstein Variation	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qd6 4. d4 Nf6 5. Nf3 a6
B01	Scandinavian Defense: Classical Variation	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 Nf6 5. Nf3 Bf5
B01	Scandinavian Defense: Grünfeld Variation	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 Nf6 5. Nf3 Bf5 6. Ne5 c6 7. g4
B01	Scandinavian Defense: Gubinsky-Melts Defense	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qd6
B01	Scandinavian Defense: Icelandic-Palme Gambit	1. e4 d5 2. exd5 Nf6 3. c4 e6
B01	Scandinavian Defense: Kiel Variation	1. e4 d5 2. exd5 Nf6 3. d4 Nxd5 4. c4 Nb4
B01	Scandinavian Defense: Kloosterboer Gambit	1. e4 d5 2. exd5 c6 3. dxc6 e5
B01	Scandinavian Defense: Kádas Gambit	1. e4 d5 2. exd5 Nf6 3. d4 c6 4. dxc6 e5
B01	Scandinavian Defense: Lasker Variation	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 Nf6 5. Nf3 Bg4 6. h3
B01	Scandinavian Defense: Main Line	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5
B01	Scandinavian Defense: Main Line, Leonhardt Gambit	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. b4
B01	Scandinavian Defense: Main Line, Mieses Variation	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 Nf6
B01	Scandinavian Defense: Marshall Variation	1. e4 d5 2. exd5 Nf6 3. d4 Nxd5
B01	Scandinavian Defense: Mieses-Kotroc Variation	1. e4 d5 2. exd5 Qxd5
B01	Scandinavian Defense: Modern Variation	1. e4 d5 2. exd5 Nf6
B01	Scandinavian Defense: Modern Variation	1. e4 d5 2. exd5 Nf6 3. d4
B01	Scandinavian Defense: Modern Variation, Gipslis Variation	1. e4 d5 2. exd5 Nf6 3. d4 Nxd5 4. Nf3 Bg4
B01	Scandinavian Defense: Modern Variation, Wing Gambit	1. e4 d5 2. exd5 Nf6 3. d4 g6 4. c4 b5
B01	Scandinavian Defense: Panov Transfer	1. e4 d5 2. exd5 Nf6 3. c4 c6
B01	Scandinavian Defense: Portuguese Gambit	1. e4 d5 2. exd5 Nf6 3. d4 Bg4
B01	Scandinavian Defense: Portuguese Gambit, Banker Variation	1. e4 d5 2. exd5 Nf6 3. d4 Bg4 4. f3 Bf5 5. c4
B01	Scandinavian Defense: Portuguese Gambit, Classical Variation	1. e4 d5 2. exd5 Nf6 3. d4 Bg4 4. Nf3
B01	Scandinavian Defense: Portuguese Gambit, Correspondence Refutation	1. e4 d5 2. exd5 Nf6 3. d4 Bg4 4. f3 Bf5 5. g4
B01	Scandinavian Defense: Portuguese Gambit, Elbow Variation	1. e4 d5 2. exd5 Nf6 3. d4 Bg4 4. Bb5+ c6
B01	Scandinavian Defense: Portuguese Gambit, Jadoul Variation	1. e4 d5 2. exd5 Nf6 3. d4 Bg4 4. f3 Bf5 5. Bb5+ Nbd7 6. c4
B01	Scandinavian Defense: Portuguese Gambit, Lusophobe Variation	1. e4 d5 2. exd5 Nf6 3. d4 Bg4 4. Bb5+ Nbd7 5. Be2
B01	Scandinavian Defense: Portuguese Gambit, Melbourne Shuffle Variation	1. e4 d5 2. exd5 Nf6 3. d4 Bg4 4. f3 Bf5 5. Bb5+ Nbd7 6. Nc3
B01	Scandinavian Defense: Portuguese Gambit, Wuss Variation	1. e4 d5 2. exd5 Nf6 3. d4 Bg4 4. Be2
B01	Scandinavian Defense: Richter Variation	1. e4 d5 2. exd5 Nf6 3. d4 Nxd5 4. Nf3 g6
B01	Scandinavian Defense: Richter Variation	1. e4 d5 2. exd5 Nf6 3. d4 g6
B01	Scandinavian Defense: Schiller-Pytel Variation	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qd6 4. d4 c6
B01	Scandinavian Defense: Schiller-Pytel Variation, Modern Variation	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qd6 4. d4 Nf6 5. Bc4 c6 6. Nge2 Bf5 7. Bf4 Qb4
B01	Scandinavian Defense: Valencian Variation	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qd8
B01	Scandinavian Defense: Valencian Variation, Ilundain Variation	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qd8 4. d4 Nf6 5. Nf3 c6
B01	Scandinavian Defense: Valencian Variation, Main Line	1. e4 d5 2. exd5 Qxd5 3. Nc3 Qd8 4. d4 Nf6 5. Nf3 Bg4
B01	Scandinavian Defense: Zilbermints Gambit	1. e4 d5 2. b4
B01	Van Geet Opening: Grünfeld Defense	1. e4 d5 2. Nc3 dxe4 3. Nxe4 e5
B02	Alekhine Defense	1. e4 Nf6
B02	Alekhine Defense: Brooklyn Variation	1. e4 Nf6 2. e5 Ng8
B02	Alekhine Defense: Brooklyn Variation, Everglades Variation	1. e4 Nf6 2. e5 Ng8 3. d4 f5
B02	Alekhine Defense: Buckley Attack	1. e4 Nf6 2. e5 Nd5 3. Na3
B02	Alekhine Defense: Hunt Variation, Lasker Simul Gambit	1. e4 Nf6 2. e5 Nd5 3. c4 Nb6 4. c5 Nd5 5. Bc4 e6 6. Nc3
B02	Alekhine Defense: Hunt Variation, Matsukevich Gambit	1. e4 Nf6 2. e5 Nd5 3. c4 Nb6 4. c5 Nd5 5. Nc3 Nxc3 6. dxc3 d6 7. Bg5
B02	Alekhine Defense: Hunt Variation, Mikenas Gambit	1. e4 Nf6 2. e5 Nd5 3. c4 Nb6 4. c5 Nd5 5. Bc4 e6 6. Nc3 d6 7. Nxd5 exd5 8. Bxd5
B02	Alekhine Defense: Kmoch Variation	1. e4 Nf6 2. e5 Nd5 3. Bc4 Nb6 4. Bb3 c5 5. d3
B02	Alekhine Defense: Krejcik Variation	1. e4 Nf6 2. Bc4
B02	Alekhine Defense: Krejcik Variation, Krejcik Gambit	1. e4 Nf6 2. Bc4 Nxe4 3. Bxf7+
B02	Alekhine Defense: Maróczy Variation	1. e4 Nf6 2. d3
B02	Alekhine Defense: Mokele Mbembe	1. e4 Nf6 2. e5 Ne4
B02	Alekhine Defense: Mokele Mbembe, Modern Line	1. e4 Nf6 2. e5 Ne4 3. d4 f6
B02	Alekhine Defense: Mokele Mbembe, Vavra Defense	1. e4 Nf6 2. e5 Ne4 3. d4 e6
B02	Alekhine Defense: Normal Variation	1. e4 Nf6 2. e5 Nd5
B02	Alekhine Defense: Scandinavian Variation	1. e4 Nf6 2. Nc3 d5
B02	Alekhine Defense: Scandinavian Variation, Geschev Gambit	1. e4 Nf6 2. Nc3 d5 3. exd5 c6
B02	Alekhine Defense: Scandinavian Variation, Myers Gambit	1. e4 Nf6 2. Nc3 d5 3. d3 dxe4 4. Bg5
B02	Alekhine Defense: Spielmann Gambit	1. e4 Nf6 2. Nc3 d5 3. e5 Nfd7 4. e6
B02	Alekhine Defense: Steiner Variation	1. e4 Nf6 2. e5 Nd5 3. c4 Nb6 4. b3
B02	Alekhine Defense: Sämisch Attack	1. e4 Nf6 2. e5 Nd5 3. Nc3
B02	Alekhine Defense: The Squirrel	1. e4 Nf6 2. e5 Nd5 3. c4 Nf4
B02	Alekhine Defense: Two Pawns Attack	1. e4 Nf6 2. e5 Nd5 3. c4
B02	Alekhine Defense: Two Pawns Attack, Lasker Variation	1. e4 Nf6 2. e5 Nd5 3. c4 Nb6 4. c5
B02	Alekhine Defense: Two Pawns Attack, Mikenas Variation	1. e4 Nf6 2. e5 Nd5 3. c4 Nb6 4. c5 Nd5 5. Bc4 e6 6. Nc3 d6
B02	Alekhine Defense: Two Pawns Attack, Tate Variation	1. e4 Nf6 2. e5 Nd5 3. c4 Nb6 4. a4
B02	Alekhine Defense: Welling Variation	1. e4 Nf6 2. e5 Nd5 3. b3
B03	Alekhine Defense	1. e4 Nf6 2. e5 Nd5 3. d4
B03	Alekhine Defense	1. e4 Nf6 2. e5 Nd5 3. d4 d6
B03	Alekhine Defense	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4
B03	Alekhine Defense: Balogh Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Bc4
B03	Alekhine Defense: Exchange Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. exd6
B03	Alekhine Defense: Exchange Variation, Karpov Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. exd6 cxd6 6. Nc3 g6 7. h3 Bg7 8. Nf3 O-O 9. Be2 Nc6 10. O-O Bf5 11. Bf4
B03	Alekhine Defense: Exchange Variation, Voronezh Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. exd6 cxd6 6. Nc3 g6 7. Be3 Bg7 8. Rc1 O-O 9. b3
B03	Alekhine Defense: Four Pawns Attack	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. f4
B03	Alekhine Defense: Four Pawns Attack, Cambridge Gambit	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. f4 g5
B03	Alekhine Defense: Four Pawns Attack, Fianchetto Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. f4 g6
B03	Alekhine Defense: Four Pawns Attack, Ilyin-Zhenevsky Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. f4 dxe5 6. fxe5 Nc6 7. Nf3 Bg4 8. e6 fxe6 9. c5
B03	Alekhine Defense: Four Pawns Attack, Korchnoi Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. f4 dxe5 6. fxe5 Bf5 7. Nc3 e6 8. Nf3 Be7 9. Be2 O-O 10. O-O f6
B03	Alekhine Defense: Four Pawns Attack, Main Line	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. f4 dxe5 6. fxe5 Nc6 7. Be3
B03	Alekhine Defense: Four Pawns Attack, Tartakower Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. f4 dxe5 6. fxe5 Nc6 7. Be3 Bf5 8. Nc3 e6 9. Nf3 Qd7 10. Be2 O-O-O 11. O-O Be7
B03	Alekhine Defense: Four Pawns Attack, Trifunovic Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. f4 Bf5
B03	Alekhine Defense: Hunt Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. c5
B03	Alekhine Defense: Modern Variation, Alekhine Gambit	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. Nf3 Bg4 6. Be2
B03	Alekhine Defense: O'Sullivan Gambit	1. e4 Nf6 2. e5 Nd5 3. d4 b5
B04	Alekhine Defense: Modern Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3
B04	Alekhine Defense: Modern Variation, Alburt Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 g6
B04	Alekhine Defense: Modern Variation, Keres Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 g6 5. Bc4 Nb6 6. Bb3 Bg7 7. a4
B04	Alekhine Defense: Modern Variation, Larsen Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 dxe5
B04	Alekhine Defense: Modern Variation, Larsen-Haakert Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 Nc6
B04	Alekhine Defense: Modern Variation, Schmid Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 Nb6
B05	Alekhine Defense: Modern Variation, Alekhine Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 Bg4 5. c4
B05	Alekhine Defense: Modern Variation, Flohr Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 Bg4 5. Be2 c6
B05	Alekhine Defense: Modern Variation, Main Line	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 Bg4
B05	Alekhine Defense: Modern Variation, Panov Variation	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 Bg4 5. h3
B05	Alekhine Defense: Modern Variation, Vitolins Attack	1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 Bg4 5. c4 Nb6 6. d5
B06	Modern Defense	1. e4 g6
B06	Modern Defense	1. e4 g6 2. d4 Bg7
B06	Modern Defense: Anti-Modern	1. e4 g6 2. d4 Bg7 3. Nc3 c6 4. Bc4 d6 5. Qe2
B06	Modern Defense: Bishop Attack	1. e4 g6 2. d4 Bg7 3. Bc4
B06	Modern Defense: Bishop Attack, Bücker Gambit	1. e4 g6 2. d4 Bg7 3. Bc4 b5
B06	Modern Defense: Bishop Attack, Monkey's Bum	1. e4 g6 2. Bc4 Bg7 3. Qf3 e6 4. d4 Bxd4
B06	Modern Defense: Dunworthy Variation	1. e4 g6 2. d4 Bg7 3. c4 d5 4. exd5 c6 5. dxc6 Bxd4
B06	Modern Defense: Fianchetto Gambit	1. e4 g6 2. d4 f5
B06	Modern Defense: Gurgenidze Defense	1. e4 g6 2. d4 Bg7 3. Nc3 c6 4. f4 d5 5. e5 h5
B06	Modern Defense: Lizard Defense, Mittenberger Gambit	1. e4 g6 2. d4 Bg7 3. Nc3 d5
B06	Modern Defense: Masur Gambit	1. e4 g6 2. d4 Nh6 3. Nc3 f5 4. Bxh6 Bxh6 5. exf5 O-O
B06	Modern Defense: Modern Pterodactyl	1. e4 g6 2. d4 Bg7 3. Nc3 c5
B06	Modern Defense: Mongredien Defense, with Nc3	1. e4 g6 2. d4 Bg7 3. Nc3 b6
B06	Modern Defense: Mongredien Defense, with Nf3	1. e4 g6 2. d4 Bg7 3. Nf3 b6
B06	Modern Defense: Norwegian Defense	1. e4 g6 2. d4 Nf6
B06	Modern Defense: Norwegian Defense, Norwegian Gambit	1. e4 g6 2. d4 Nf6 3. e5 Nh5 4. Be2 d6
B06	Modern Defense: Pseudo-Austrian Attack	1. e4 g6 2. d4 Bg7 3. Nc3 d6 4. f4
B06	Modern Defense: Semi-Averbakh Variation, Pterodactyl Variation Declined	1. e4 g6 2. d4 Bg7 3. c4 c5 4. Nf3 d6 5. Be2 Qa5+
B06	Modern Defense: Standard Defense	1. e4 g6 2. d4 Bg7 3. Nc3 d6
B06	Modern Defense: Standard Line	1. e4 g6 2. d4 Bg7 3. Nc3
B06	Modern Defense: Three Pawns Attack	1. e4 g6 2. d4 Bg7 3. f4
B06	Modern Defense: Two Knights Variation	1. e4 g6 2. d4 Bg7 3. Nc3 d6 4. Nf3
B06	Modern Defense: Two Knights Variation, Suttles Variation	1. e4 g6 2. d4 Bg7 3. Nc3 c6 4. Nf3 d6
B06	Modern Defense: Two Knights Variation, Suttles Variation, Tal Gambit	1. e4 g6 2. d4 Bg7 3. Nc3 d6 4. Nf3 c6 5. Bg5 Qb6 6. Qd2 Qxb2
B06	Modern Defense: Westermann Gambit	1. e4 g6 2. d4 Bg7 3. Bd2
B06	Modern Defense: Wind Gambit	1. e4 g6 2. d4 Bg7 3. Bd3
B06	Pterodactyl Defense: Austrian, Austriadactylus Western	1. e4 g6 2. d4 Bg7 3. f4 c5 4. Nf3 Qa5+
B06	Pterodactyl Defense: Austrian, Grand Prix Pterodactyl	1. e4 g6 2. Nc3 Bg7 3. f4 c5 4. Nf3 Qa5
B06	Pterodactyl Defense: Austrian, Pteranodon	1. e4 g6 2. d4 Bg7 3. f4 c5 4. c3 Qa5
B06	Pterodactyl Defense: Central, Anhanguera	1. e4 g6 2. d4 Bg7 3. c4 c5 4. Nc3 d6 5. Be3 Qa5
B06	Pterodactyl Defense: Central, Benoni Quetzalcoatlus	1. e4 g6 2. d4 Bg7 3. c4 c5 4. d5 d6 5. Nc3 Qa5
B06	Pterodactyl Defense: Central, Quetzalcoatlus Gambit	1. e4 g6 2. d4 Bg7 3. c4 c5 4. Nc3 d6 5. dxc5 Qa5
B06	Pterodactyl Defense: Eastern, Anhanguera	1. e4 g6 2. d4 Bg7 3. Nc3 c5 4. Be3
B06	Pterodactyl Defense: Eastern, Benoni	1. d4 g6 2. e4 Bg7 3. Nc3 c5 4. d5
B06	Pterodactyl Defense: Eastern, Benoni Pteranodon	1. e4 g6 2. d4 Bg7 3. Nc3 c5 4. d5 Bxc3+ 5. bxc3 Qa5
B06	Pterodactyl Defense: Eastern, Benoni Pterodactyl	1. d4 g6 2. Nc3 Bg7 3. e4 c5 4. d5 Qa5
B06	Pterodactyl Defense: Eastern, Pteranodon	1. e4 g6 2. d4 Bg7 3. Nc3 c5 4. dxc5 Bxc3+ 5. bxc3 Qa5
B06	Pterodactyl Defense: Eastern, Pterodactyl	1. e4 g6 2. d4 Bg7 3. Nc3 c5 4. dxc5 Qa5
B06	Pterodactyl Defense: Eastern, Rhamphorhynchus	1. e4 g6 2. d4 Bg7 3. Nc3 c5 4. dxc5
B06	Pterodactyl Defense: Fianchetto, King Pterodactyl	1. e4 g6 2. d4 Bg7 3. g3 c5 4. Nf3 Qa5+
B06	Pterodactyl Defense: Fianchetto, Rhamphorhynchus	1. e4 g6 2. d4 Bg7 3. g3 c5 4. dxc5 Qa5+
B06	Pterodactyl Defense: Sicilian, Quetzalcoatlus	1. e4 g6 2. d4 Bg7 3. Nc3 c5 4. Nf3 Qa5 5. Be2 d6
B06	Pterodactyl Defense: Sicilian, Siroccopteryx	1. e4 g6 2. d4 Bg7 3. Nc3 c5 4. Nf3 Qa5 5. Bc4
B06	Pterodactyl Defense: Western, Anhanguera	1. e4 g6 2. d4 Bg7 3. Nf3 c5 4. Be3 Qa5+
B06	Pterodactyl Defense: Western, Siroccopteryx	1. e4 g6 2. Nf3 Bg7 3. d4 c5 4. Bc4 cxd4 5. Nxd4 Qa5+
B06	Rat Defense: Accelerated Gurgenidze	1. e4 g6 2. d4 d6 3. Nc3 c6
B07	Czech Defense	1. e4 d6 2. d4 Nf6 3. Nc3 c6
B07	King's Pawn Game: Maróczy Defense	1. e4 d6 2. d4 e5
B07	Lion Defense: Anti-Philidor	1. e4 d6 2. d4 Nf6 3. Nc3 Nbd7 4. f4
B07	Lion Defense: Anti-Philidor, Lion's Cave	1. e4 d6 2. d4 Nf6 3. Nc3 Nbd7 4. f4 e5
B07	Lion Defense: Anti-Philidor, Lion's Cave, Lion Claw Gambit	1. e4 d6 2. d4 Nf6 3. Nc3 Nbd7 4. f4 e5 5. Nf3 exd4 6. Qxd4 c6 7. Bc4 d5
B07	Lion Defense: Bayonet Attack	1. e4 d6 2. d4 Nf6 3. Nc3 Nbd7 4. g4
B07	Modern Defense: Geller's System	1. e4 g6 2. d4 Bg7 3. Nf3 d6 4. c3
B07	Pirc Defense	1. e4 d6 2. d4 Nf6 3. Nc3 g6
B07	Pirc Defense: 150 Attack	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 c6 5. Qd2
B07	Pirc Defense: 150 Attack, Inner Doll Defense	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 c6 5. Qd2 Bg4
B07	Pirc Defense: 150 Attack, Sveshnikov-Jansa Attack	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 c6 5. h3
B07	Pirc Defense: Bayonet Attack	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be2 Bg7 5. h4
B07	Pirc Defense: Byrne Variation	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Bg5
B07	Pirc Defense: Chinese Variation	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be2 Bg7 5. g4
B07	Pirc Defense: Kholmov System	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Bc4
B07	Pirc Defense: Sveshnikov System	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. g3
B08	Pirc Defense: Classical Variation	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3
B08	Pirc Defense: Classical Variation	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7
B08	Pirc Defense: Classical Variation, Quiet System	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. Be2
B08	Pirc Defense: Classical Variation, Quiet System, Chigorin Line	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. Be2 O-O 6. O-O Nc6
B08	Pirc Defense: Classical Variation, Quiet System, Czech Defense	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. Be2 O-O 6. O-O c6
B08	Pirc Defense: Classical Variation, Quiet System, Parma Defense	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. Be2 O-O 6. O-O Bg4
B08	Pirc Defense: Classical Variation, Schlechter Variation	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. h3
B09	Pirc Defense: Austrian Attack	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4
B09	Pirc Defense: Austrian Attack	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Nf3 O-O
B09	Pirc Defense: Austrian Attack, Dragon Formation	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Nf3 c5
B09	Pirc Defense: Austrian Attack, Kurajica Variation	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Nf3 O-O 6. Be3
B09	Pirc Defense: Austrian Attack, Ljubojevic Variation	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Bc4
B09	Pirc Defense: Austrian Attack, Unzicker Attack	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Nf3 O-O 6. e5
B09	Pirc Defense: Austrian Attack, Unzicker Attack, Bronstein Variation	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Nf3 O-O 6. e5 Nfd7 7. h4
B09	Pirc Defense: Austrian Attack, Weiss Variation	1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Nf3 O-O 6. Bd3
B10	Caro-Kann Defense	1. e4 c6
B10	Caro-Kann Defense	1. e4 c6 2. Nc3
B10	Caro-Kann Defense	1. e4 c6 2. Nc3 d5
B10	Caro-Kann Defense: Accelerated Panov Attack	1. e4 c6 2. c4
B10	Caro-Kann Defense: Accelerated Panov Attack	1. e4 c6 2. c4 d5
B10	Caro-Kann Defense: Accelerated Panov Attack, Modern Variation	1. e4 c6 2. c4 d5 3. exd5 cxd5 4. cxd5 Nf6
B10	Caro-Kann Defense: Accelerated Panov Attack, Open Variation	1. e4 c6 2. c4 e5
B10	Caro-Kann Defense: Accelerated Panov Attack, Pseudo-Scandinavian	1. e4 c6 2. c4 d5 3. exd5 Qxd5
B10	Caro-Kann Defense: Accelerated Panov Attack, Van Weersel Attack	1. e4 c6 2. c4 d5 3. cxd5 cxd5 4. Qb3
B10	Caro-Kann Defense: Apocalypse Attack	1. e4 c6 2. Nf3 d5 3. exd5 cxd5 4. Ne5
B10	Caro-Kann Defense: Breyer Variation	1. e4 c6 2. d3
B10	Caro-Kann Defense: Breyer Variation, Stein Attack	1. e4 c6 2. d3 d5 3. Nd2 g6 4. Ngf3 Bg7 5. g3 e5 6. Bg2 Ne7 7. O-O O-O 8. b4
B10	Caro-Kann Defense: Endgame Offer	1. e4 c6 2. Nf3 d5 3. d3
B10	Caro-Kann Defense: Endgame Variation	1. e4 c6 2. Nf3 d5 3. d3 dxe4 4. dxe4 Qxd1+ 5. Kxd1
B10	Caro-Kann Defense: Euwe Attack	1. e4 c6 2. b3
B10	Caro-Kann Defense: Goldman Variation	1. e4 c6 2. Nc3 d5 3. Qf3
B10	Caro-Kann Defense: Hector Gambit	1. e4 c6 2. Nc3 d5 3. Nf3 dxe4 4. Ng5
B10	Caro-Kann Defense: Hillbilly Attack	1. e4 c6 2. Bc4
B10	Caro-Kann Defense: Hillbilly Attack, Schaeffer Gambit	1. e4 c6 2. Bc4 d5 3. Bb3 dxe4 4. Qh5
B10	Caro-Kann Defense: Labahn Attack	1. e4 c6 2. b4
B10	Caro-Kann Defense: Labahn Attack, Double Gambit	1. e4 c6 2. b4 d5 3. b5
B10	Caro-Kann Defense: Labahn Attack, Polish Variation	1. e4 c6 2. b4 e5 3. Bb2
B10	Caro-Kann Defense: Scorpion-Horus Gambit	1. e4 c6 2. Nc3 d5 3. d3 dxe4 4. Bg5
B10	Caro-Kann Defense: Spike Variation	1. e4 c6 2. g4
B10	Caro-Kann Defense: Spike Variation, Scorpion-Grob Gambit	1. e4 c6 2. g4 d5 3. Nc3 dxe4 4. d3
B10	Caro-Kann Defense: St. Patrick's Attack	1. e4 c6 2. Nc3 d5 3. h3
B10	Caro-Kann Defense: Toikkanen Gambit	1. e4 c6 2. c4 d5 3. e5
B10	Caro-Kann Defense: Two Knights Attack	1. e4 c6 2. Nc3 d5 3. Nf3
B11	Caro-Kann Defense: Two Knights Attack, Mindeno Variation	1. e4 c6 2. Nc3 d5 3. Nf3 Bg4
B11	Caro-Kann Defense: Two Knights Attack, Mindeno Variation, Exchange Line	1. e4 c6 2. Nc3 d5 3. Nf3 Bg4 4. h3 Bxf3
B11	Caro-Kann Defense: Two Knights Attack, Mindeno Variation, Retreat Line	1. e4 c6 2. Nc3 d5 3. Nf3 Bg4 4. h3 Bh5
B12	Caro-Kann Defense	1. e4 c6 2. d4
B12	Caro-Kann Defense	1. e4 c6 2. d4 d5
B12	Caro-Kann Defense: Advance Variation	1. e4 c6 2. d4 d5 3. e5
B12	Caro-Kann Defense: Advance Variation, Bayonet Attack	1. e4 c6 2. d4 d5 3. e5 Bf5 4. g4
B12	Caro-Kann Defense: Advance Variation, Botvinnik-Carls Defense	1. e4 c6 2. d4 d5 3. e5 c5
B12	Caro-Kann Defense: Advance Variation, Bronstein Variation	1. e4 c6 2. d4 d5 3. e5 Bf5 4. Ne2
B12	Caro-Kann Defense: Advance Variation, Prins Attack	1. e4 c6 2. d4 d5 3. e5 Bf5 4. b4
B12	Caro-Kann Defense: Advance Variation, Short Variation	1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nf3
B12	Caro-Kann Defense: Advance Variation, Tal Variation	1. e4 c6 2. d4 d5 3. e5 Bf5 4. h4
B12	Caro-Kann Defense: Advance Variation, Van der Wiel Attack	1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nc3
B12	Caro-Kann Defense: Advance Variation, Van der Wiel Attack	1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nc3 e6 5. g4 Bg6 6. Nge2 c5 7. h4
B12	Caro-Kann Defense: Advance Variation, Van der Wiel Attack, Dreyev Defense	1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nc3 Qb6
B12	Caro-Kann Defense: Advance, Short Variation	1. e4 c6 2. d4 d5 3. e5 Bf5 4. c3 e6 5. Be2
B12	Caro-Kann Defense: De Bruycker Defense	1. e4 c6 2. d4 Na6
B12	Caro-Kann Defense: De Bruycker Defense	1. e4 c6 2. d4 Na6 3. Nc3 Nc7
B12	Caro-Kann Defense: Edinburgh Variation	1. e4 c6 2. d4 d5 3. Nd2 Qb6
B12	Caro-Kann Defense: Maróczy Variation	1. e4 c6 2. d4 d5 3. f3
B12	Caro-Kann Defense: Maróczy Variation, Maróczy Gambit	1. e4 c6 2. d4 d5 3. f3 dxe4 4. fxe4 e5 5. Nf3 exd4 6. Bc4
B12	Caro-Kann Defense: Masi Variation	1. e4 c6 2. d4 Nf6
B12	Caro-Kann Defense: Massachusetts Defense	1. e4 c6 2. d4 f5
B12	Caro-Kann Defense: Mieses Attack, Landau Gambit	1. e4 c6 2. d4 d5 3. Bd3 Nf6 4. e5 Nfd7 5. e6
B12	Caro-Kann Defense: Mieses Gambit	1. e4 c6 2. d4 d5 3. Be3
B12	Caro-Kann Defense: Modern Variation	1. e4 c6 2. d4 d5 3. Nd2
B12	Caro-Kann Defense: Ulysses Gambit	1. e4 c6 2. d4 d5 3. Nf3 dxe4 4. Ng5
B13	Caro-Kann Defense: Exchange Variation	1. e4 c6 2. d4 d5 3. exd5
B13	Caro-Kann Defense: Exchange Variation	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. Nf3 Nc6
B13	Caro-Kann Defense: Exchange Variation, Bulla Attack	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. g4
B13	Caro-Kann Defense: Exchange Variation, Rubinstein Variation	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. Bd3 Nc6 5. c3 Nf6 6. Bf4
B13	Caro-Kann Defense: Panov Attack	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4
B13	Caro-Kann Defense: Panov Attack	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3
B13	Caro-Kann Defense: Panov Attack, Gunderam Attack	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. c5
B13	Caro-Kann Defense: Panov Attack, Modern Defense	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 Nc6
B13	Caro-Kann Defense: Panov Attack, Modern Defense, Carlsbad Line	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 Nc6 6. Bg5 e6
B13	Caro-Kann Defense: Panov Attack, Modern Defense, Czerniak Line	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 Nc6 6. Bg5 Qa5
B13	Caro-Kann Defense: Panov Attack, Modern Defense, Mieses Line	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 Nc6 6. Nf3 Bg4
B13	Caro-Kann Defense: Panov Attack, Modern Defense, Reifir-Spielmann Line	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 Nc6 6. Bg5 Qb6
B13	Caro-Kann Defense: Panov-Botvinnik, Herzog Defense	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 Nc6 6. Bg5 dxc4 7. d5 Na5
B14	Caro-Kann Defense: Panov Attack	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 e6
B14	Caro-Kann Defense: Panov Attack, Fianchetto Defense	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 g6
B14	Caro-Kann Defense: Panov Attack, Fianchetto Defense, Fianchetto Gambit	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 g6 6. cxd5 Bg7
B14	Caro-Kann Defense: Panov Attack, Main Line	1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 e6 6. Nf3 Bb4
B15	Caro-Kann Defense	1. e4 c6 2. d4 d5 3. Nc3
B15	Caro-Kann Defense	1. e4 c6 2. d4 d5 3. Nc3 dxe4
B15	Caro-Kann Defense: Alekhine Gambit	1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nf6 5. Bd3
B15	Caro-Kann Defense: Alien Gambit	1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nf6 5. Ng5 h6 6. Nxf7
B15	Caro-Kann Defense: Campomanes Attack	1. e4 c6 2. d4 d5 3. Nc3 Nf6
B15	Caro-Kann Defense: Forgacs Variation	1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nf6 5. Nxf6+ exf6 6. Bc4
B15	Caro-Kann Defense: Gurgenidze Counterattack	1. e4 c6 2. d4 d5 3. Nc3 b5
B15	Caro-Kann Defense: Gurgenidze System	1. e4 c6 2. d4 d5 3. Nc3 g6
B15	Caro-Kann Defense: Main Line	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4
B15	Caro-Kann Defense: Rasa-Studier Gambit	1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. f3
B15	Caro-Kann Defense: Tartakower Variation	1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nf6 5. Nxf6+ exf6
B15	Caro-Kann Defense: von Hennig Gambit	1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Bc4
B16	Caro-Kann Defense: Bronstein-Larsen Variation	1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nf6 5. Nxf6+ gxf6
B16	Caro-Kann Defense: Finnish Variation	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 h6
B17	Caro-Kann Defense: Karpov Variation	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Nd7
B17	Caro-Kann Defense: Karpov Variation, Modern Main Line	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Nd7 5. Ng5 Ngf6 6. Bd3 e6 7. N1f3 Bd6 8. Qe2 h6 9. Ne4 Nxe4 10. Qxe4
B17	Caro-Kann Defense: Karpov Variation, Modern Variation	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Nd7 5. Ng5
B17	Caro-Kann Defense: Karpov Variation, Modern Variation, Ivanchuk Defense	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Nd7 5. Ng5 Ndf6
B17	Caro-Kann Defense: Karpov Variation, Modern Variation, Kasparov Attack	1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nd7 5. Nf3 Ngf6 6. Ng3
B17	Caro-Kann Defense: Karpov Variation, Smyslov Variation	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Nd7 5. Bc4 Ngf6 6. Ng5 e6 7. Qe2 Nb6
B17	Caro-Kann Defense: Karpov Variation, Smyslov Variation, Main Line	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Nd7 5. Bc4 Ngf6 6. Ng5 e6 7. Qe2 Nb6 8. Bb3
B17	Caro-Kann Defense: Karpov Variation, Tiviakov-Fischer Attack	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Nd7 5. Bc4 Ngf6 6. Nxf6+ Nxf6
B18	Caro-Kann Defense: Classical Variation	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Bf5
B18	Caro-Kann Defense: Classical Variation, Flohr Variation	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. Nh3
B18	Caro-Kann Defense: Classical Variation, Main Line	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4
B18	Caro-Kann Defense: Classical Variation, Maróczy Attack	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. f4
B18	Caro-Kann Defense: Martian Gambit	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Bf5 5. Ng5 Bg6 6. N1f3 h6 7. Ne6
B19	Caro-Kann Defense: Classical Variation	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7
B19	Caro-Kann Defense: Classical Variation, Lobron System	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7 8. h5 Bh7 9. Bd3 Bxd3 10. Qxd3 e6 11. Bd2 Ngf6 12. O-O-O Be7
B19	Caro-Kann Defense: Classical Variation, Seirawan Variation	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7 8. h5 Bh7 9. Bd3 Bxd3 10. Qxd3 Ngf6 11. Bd2 e6 12. O-O-O Bd6
B19	Caro-Kann Defense: Classical Variation, Spassky Variation	1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7 8. h5
B20	Sicilian Defense	1. e4 c5
B20	Sicilian Defense: Amazon Attack	1. e4 c5 2. Qg4
B20	Sicilian Defense: Big Clamp Formation	1. e4 c5 2. d3 Nc6 3. c3 d6 4. f4
B20	Sicilian Defense: Bowdler Attack	1. e4 c5 2. Bc4
B20	Sicilian Defense: Brick Variation	1. e4 c5 2. Nh3
B20	Sicilian Defense: Euwe Attack, Prins Gambit	1. e4 c5 2. b3 d5 3. Bb2
B20	Sicilian Defense: Gloria Variation	1. e4 c5 2. c4 d6 3. Nc3 Nc6 4. g3 h5
B20	Sicilian Defense: Grob Variation	1. e4 c5 2. g4
B20	Sicilian Defense: Keres Variation	1. e4 c5 2. Ne2
B20	Sicilian Defense: King David's Opening	1. e4 c5 2. Ke2
B20	Sicilian Defense: Kronberger Variation	1. e4 c5 2. Na3
B20	Sicilian Defense: Kronberger Variation, Nemeth Gambit	1. e4 c5 2. Na3 Nc6 3. d4 cxd4 4. Bc4
B20	Sicilian Defense: Lasker-Dunne Attack	1. e4 c5 2. g3
B20	Sicilian Defense: Mengarini Variation	1. e4 c5 2. a3
B20	Sicilian Defense: Myers Attack, with a4	1. e4 c5 2. a4
B20	Sicilian Defense: Myers Attack, with h4	1. e4 c5 2. h4
B20	Sicilian Defense: Snyder Variation	1. e4 c5 2. b3
B20	Sicilian Defense: Snyder Variation, Queen Fianchetto Variation	1. e4 c5 2. b3 b6
B20	Sicilian Defense: Staunton-Cochrane Variation	1. e4 c5 2. c4
B20	Sicilian Defense: Wing Gambit	1. e4 c5 2. b4
B20	Sicilian Defense: Wing Gambit, Abrahams Variation	1. e4 c5 2. b4 cxb4 3. Bb2
B20	Sicilian Defense: Wing Gambit, Carlsbad Variation	1. e4 c5 2. b4 cxb4 3. a3 bxa3
B20	Sicilian Defense: Wing Gambit, Marienbad Variation	1. e4 c5 2. b4 cxb4 3. a3 d5 4. exd5 Qxd5 5. Bb2
B20	Sicilian Defense: Wing Gambit, Marshall Variation	1. e4 c5 2. b4 cxb4 3. a3
B20	Sicilian Defense: Wing Gambit, Nanu Gambit	1. e4 c5 2. b4 cxb4 3. a3 d5 4. exd5 Qxd5 5. Nf3 e5 6. c4 Qe6 7. Bd3
B20	Sicilian Defense: Wing Gambit, Romanian Defense	1. e4 c5 2. b4 cxb4 3. a3 d5 4. exd5 Qxd5 5. Nf3 e5 6. Bb2 Nc6 7. c4 Qe6
B20	Sicilian Defense: Wing Gambit, Santasiere Variation	1. e4 c5 2. b4 cxb4 3. c4
B21	Bird Opening: Dutch Variation, Batavo Gambit	1. e4 c5 2. f4 d5 3. Nf3 dxe4
B21	Sicilian Defense: Coles Sicilian Gambit	1. e4 c5 2. d4 cxd4 3. Qxd4 Nc6 4. Qd1 Nf6 5. Bc4
B21	Sicilian Defense: Halasz Gambit	1. e4 c5 2. d4 cxd4 3. f4
B21	Sicilian Defense: McDonnell Attack	1. e4 c5 2. f4
B21	Sicilian Defense: McDonnell Attack, Tal Gambit	1. e4 c5 2. f4 d5 3. exd5 Nf6
B21	Sicilian Defense: Morphy Gambit	1. e4 c5 2. d4 cxd4 3. Nf3
B21	Sicilian Defense: Morphy Gambit, Andreaschek Gambit	1. e4 c5 2. d4 cxd4 3. Nf3 e5 4. c3
B21	Sicilian Defense: Smith-Morra Gambit	1. e4 c5 2. d4
B21	Sicilian Defense: Smith-Morra Gambit	1. e4 c5 2. d4 cxd4 3. c3
B21	Sicilian Defense: Smith-Morra Gambit Accepted	1. e4 c5 2. d4 cxd4 3. c3 dxc3
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Chicago Defense	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Bc4 e6 6. Nf3 d6 7. O-O a6 8. Qe2 b5 9. Bb3 Ra7
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Chicago Defense	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 d6 5. Nf3 e6 6. Bc4 Nf6 7. O-O a6
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Classical Formation	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 d6 6. Bc4 a6 7. O-O Nf6
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Danish Variation	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nf3
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Fianchetto Defense	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 g6
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Finegold Defense	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 e6 5. Nf3 d6 6. Bc4 a6 7. O-O Be7 8. Qe2 Nf6
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Kan Formation	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 e6 5. Nf3 a6
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Larsen Defense	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 e6 6. Bc4 Qc7 7. Qe2 a6 8. O-O Bd6
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Morphy Defense	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 e6 6. Bc4 Bc5
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Morphy Defense Deferred	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 e6 6. Bc4 a6 7. O-O b5 8. Bb3 Bc5
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Paulsen Formation	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 e6 6. Bc4 a6
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Pin Defense	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 e6 6. Bc4 Bb4
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Scheveningen Formation	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 d6 6. Bc4 e6
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Siberian Variation	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 e6 6. Bc4 Qc7
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Siberian Variation, Siberian Trap	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 e6 6. Bc4 Qc7 7. Qe2 Nf6 8. O-O Ng4
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Sozin Formation	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Bc4 e6 6. Nf3 d6 7. O-O a6 8. Qe2 b5
B21	Sicilian Defense: Smith-Morra Gambit Accepted, Taimanov Formation	1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 e6 5. Bc4 a6 6. Nf3 Ne7
B21	Sicilian Defense: Smith-Morra Gambit Declined, Alapin Formation	1. e4 c5 2. d4 cxd4 3. c3 Nf6
B21	Sicilian Defense: Smith-Morra Gambit Declined, Center Formation	1. e4 c5 2. d4 cxd4 3. c3 e5
B21	Sicilian Defense: Smith-Morra Gambit Declined, Dubois Variation	1. e4 c5 2. d4 cxd4 3. c3 d3 4. c4
B21	Sicilian Defense: Smith-Morra Gambit Declined, Push Variation	1. e4 c5 2. d4 cxd4 3. c3 d3
B21	Sicilian Defense: Smith-Morra Gambit Declined, Scandinavian Formation	1. e4 c5 2. d4 cxd4 3. c3 d5
B21	Sicilian Defense: Smith-Morra Gambit Declined, Wing Formation	1. e4 c5 2. d4 cxd4 3. c3 Qa5
B22	Sicilian Defense: Alapin Variation	1. e4 c5 2. c3
B22	Sicilian Defense: Alapin Variation, Barmen Defense	1. e4 c5 2. c3 d5 3. exd5 Qxd5
B22	Sicilian Defense: Alapin Variation, Barmen Defense, Central Exchange	1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4 cxd4 5. cxd4 Nc6 6. Nf3 Bg4
B22	Sicilian Defense: Alapin Variation, Barmen Defense, Endgame Variation	1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4 cxd4 5. cxd4 Nc6 6. Nf3 Bg4 7. Nc3 Bxf3 8. gxf3 Qxd4 9. Qxd4 Nxd4
B22	Sicilian Defense: Alapin Variation, Barmen Defense, Milner-Barry Attack	1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4 Nc6 5. Nf3 cxd4 6. cxd4 e5 7. Nc3 Bb4 8. Be2
B22	Sicilian Defense: Alapin Variation, Barmen Defense, Modern Line	1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4 Nf6 5. Nf3 Bg4
B22	Sicilian Defense: Alapin Variation, Smith-Morra Declined	1. e4 c5 2. c3 Nf6 3. e5 Nd5 4. d4 cxd4
B22	Sicilian Defense: Alapin Variation, Stoltz Attack	1. e4 c5 2. c3 Nf6 3. e5 Nd5 4. Nf3 Nc6 5. Bc4 Nb6 6. Bb3
B22	Sicilian Defense: Alapin Variation, Stoltz Attack, Ivanchuk Line	1. e4 c5 2. c3 Nf6 3. e5 Nd5 4. Nf3 Nc6 5. Bc4 Nb6 6. Bb3 c4 7. Bc2 Qc7 8. Qe2 g5
B22	Sicilian Defense: Delayed Alapin Variation	1. e4 c5 2. Nf3 e6 3. c3 d5 4. exd5 Qxd5 5. d4 Nf6
B22	Sicilian Defense: Heidenfeld Variation	1. e4 c5 2. c3 Nf6 3. e5 Nd5 4. Nf3 Nc6 5. Na3
B23	Sicilian Defense: Closed	1. e4 c5 2. Nc3
B23	Sicilian Defense: Closed	1. e4 c5 2. Nc3 e6
B23	Sicilian Defense: Closed	1. e4 c5 2. Nc3 e6 3. g3
B23	Sicilian Defense: Closed, Chameleon Variation	1. e4 c5 2. Nc3 Nc6 3. Nge2
B23	Sicilian Defense: Closed, Grob Attack	1. e4 c5 2. Nc3 Nc6 3. g4
B23	Sicilian Defense: Closed, Korchnoi Defense	1. e4 c5 2. Nc3 e6 3. g3 d5
B23	Sicilian Defense: Closed, Traditional	1. e4 c5 2. Nc3 Nc6
B23	Sicilian Defense: Grand Prix Attack	1. e4 c5 2. Nc3 Nc6 3. f4
B23	Sicilian Defense: Grand Prix Attack, Schofman Variation	1. e4 c5 2. Nc3 Nc6 3. f4 g6 4. Nf3 Bg7 5. Bc4 e6 6. f5
B24	Sicilian Defense: Closed	1. e4 c5 2. Nc3 Nc6 3. g3 g6
B24	Sicilian Defense: Closed	1. e4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7
B24	Sicilian Defense: Closed, Fianchetto Variation	1. e4 c5 2. Nc3 Nc6 3. g3
B24	Sicilian Defense: Closed, Smyslov Variation	1. e4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. d3 e6 6. Be3 Nd4 7. Nce2
B25	Sicilian Defense: Closed	1. e4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. d3 d6
B25	Sicilian Defense: Closed	1. e4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. d3 d6 6. f4
B25	Sicilian Defense: Closed, Botvinnik Defense, Edge Variation	1. e4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. d3 d6 6. f4 e5 7. Nh3 Nge7
B25	Sicilian Defense: Closed, Botvinnik Defense, with Nge2	1. e4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. d3 d6 6. Nge2 e5
B25	Sicilian Defense: Closed, Botvinnik Defense, with f4	1. e4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. d3 d6 6. f4 e5
B26	Sicilian Defense: Closed	1. e4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. d3 d6 6. Be3
B27	Modern Defense: Pterodactyl Variation	1. e4 c5 2. Nf3 g6 3. d4 Bg7 4. Nc3 Qa5
B27	Pterodactyl Defense: Sicilian, Anhanguera	1. e4 c5 2. Nf3 g6 3. d4 Bg7 4. Nc3 Qa5 5. Be3
B27	Pterodactyl Defense: Sicilian, Benoni Gambit	1. e4 c5 2. Nf3 g6 3. d4 Bg7 4. Nc3 Qa5 5. d5
B27	Pterodactyl Defense: Sicilian, Pteranodon	1. e4 c5 2. Nf3 g6 3. d4 Bg7 4. dxc5 Qa5+ 5. Nc3 Bxc3+ 6. bxc3
B27	Pterodactyl Defense: Sicilian, Rhamphorhynchus	1. e4 c5 2. Nf3 g6 3. d4 Bg7 4. dxc5 Qa5+ 5. Nc3
B27	Pterodactyl Defense: Sicilian, Unpin	1. e4 c5 2. Nf3 g6 3. d4 Bg7 4. Nc3 Qa5 5. Bd2
B27	Pterodactyl Defense: Western, Pterodactyl	1. e4 c5 2. Nf3 g6 3. c3 Bg7 4. d4 Qa5
B27	Pterodactyl Defense: Western, Rhamphorhynchus	1. e4 c5 2. Nf3 g6 3. d4 Bg7 4. dxc5 Qa5+
B27	Sicilian Defense	1. e4 c5 2. Nf3
B27	Sicilian Defense: Acton Extension	1. e4 c5 2. Nf3 g6 3. c4 Bh6
B27	Sicilian Defense: Brussels Gambit	1. e4 c5 2. Nf3 f5
B27	Sicilian Defense: Bücker Variation	1. e4 c5 2. Nf3 h6
B27	Sicilian Defense: Double-Dutch Gambit	1. e4 c5 2. Nf3 f5 3. exf5 Nh6
B27	Sicilian Defense: Frederico Variation	1. e4 c5 2. Nf3 g6 3. d4 f5
B27	Sicilian Defense: Hyperaccelerated Dragon	1. e4 c5 2. Nf3 g6
B27	Sicilian Defense: Hyperaccelerated Fianchetto	1. e4 c5 2. Nf3 g6 3. d4
B27	Sicilian Defense: Hyperaccelerated Pterodactyl	1. e4 c5 2. Nf3 g6 3. d4 Bg7
B27	Sicilian Defense: Hyperaccelerated Pterodactyl, Exchange Variation	1. e4 c5 2. Nf3 g6 3. d4 Bg7 4. dxc5 Qa5+ 5. Nc3 Bxc3+ 6. bxc3 Qxc3+
B27	Sicilian Defense: Jalalabad Variation	1. e4 c5 2. Nf3 e5
B27	Sicilian Defense: Katalimov Variation	1. e4 c5 2. Nf3 b6
B27	Sicilian Defense: Mongoose Variation	1. e4 c5 2. Nf3 Qa5
B27	Sicilian Defense: Polish Gambit	1. e4 c5 2. Nf3 b5
B27	Sicilian Defense: Quinteros Variation	1. e4 c5 2. Nf3 Qc7
B28	Sicilian Defense: O'Kelly Variation	1. e4 c5 2. Nf3 a6
B28	Sicilian Defense: O'Kelly Variation, Aronin System	1. e4 c5 2. Nf3 a6 3. Be2
B28	Sicilian Defense: O'Kelly Variation, Kieseritzky System	1. e4 c5 2. Nf3 a6 3. b3
B28	Sicilian Defense: O'Kelly Variation, Maróczy Bind	1. e4 c5 2. Nf3 a6 3. c4
B28	Sicilian Defense: O'Kelly Variation, Maróczy Bind, Paulsen Line	1. e4 c5 2. Nf3 a6 3. c4 e6
B28	Sicilian Defense: O'Kelly Variation, Maróczy Bind, Robatsch Line	1. e4 c5 2. Nf3 a6 3. c4 d6
B28	Sicilian Defense: O'Kelly Variation, Normal System	1. e4 c5 2. Nf3 a6 3. d4
B28	Sicilian Defense: O'Kelly Variation, Normal System, Cortlever Gambit	1. e4 c5 2. Nf3 a6 3. d4 cxd4 4. Bc4
B28	Sicilian Defense: O'Kelly Variation, Normal System, Smith-Morra Line	1. e4 c5 2. Nf3 a6 3. d4 cxd4 4. c3
B28	Sicilian Defense: O'Kelly Variation, Normal System, Taimanov Line	1. e4 c5 2. Nf3 a6 3. d4 cxd4 4. Nxd4 e5
B28	Sicilian Defense: O'Kelly Variation, Normal System, Zagorovsky Line	1. e4 c5 2. Nf3 a6 3. d4 cxd4 4. Qxd4
B28	Sicilian Defense: O'Kelly Variation, Quiet System	1. e4 c5 2. Nf3 a6 3. d3
B28	Sicilian Defense: O'Kelly Variation, Réti System	1. e4 c5 2. Nf3 a6 3. g3
B28	Sicilian Defense: O'Kelly Variation, Venice System	1. e4 c5 2. Nf3 a6 3. c3
B28	Sicilian Defense: O'Kelly Variation, Venice System, Barcza Line	1. e4 c5 2. Nf3 a6 3. c3 Nf6
B28	Sicilian Defense: O'Kelly Variation, Venice System, Gambit Line	1. e4 c5 2. Nf3 a6 3. c3 d5 4. exd5 Nf6
B28	Sicilian Defense: O'Kelly Variation, Venice System, Ljubojevic Line	1. e4 c5 2. Nf3 a6 3. c3 b5
B28	Sicilian Defense: O'Kelly Variation, Venice System, Steiner Line	1. e4 c5 2. Nf3 a6 3. c3 d6
B28	Sicilian Defense: O'Kelly Variation, Wing Gambit	1. e4 c5 2. Nf3 a6 3. b4
B28	Sicilian Defense: O'Kelly Variation, Yerevan System	1. e4 c5 2. Nf3 a6 3. Nc3
B29	Sicilian Defense: Nimzowitsch Variation	1. e4 c5 2. Nf3 Nf6
B29	Sicilian Defense: Nimzowitsch Variation, Advance Variation	1. e4 c5 2. Nf3 Nf6 3. e5
B29	Sicilian Defense: Nimzowitsch Variation, Closed Variation	1. e4 c5 2. Nf3 Nf6 3. Nc3
B29	Sicilian Defense: Nimzowitsch Variation, Exchange Variation	1. e4 c5 2. Nf3 Nf6 3. e5 Nd5 4. Nc3 Nxc3
B29	Sicilian Defense: Nimzowitsch Variation, Main Line	1. e4 c5 2. Nf3 Nf6 3. e5 Nd5 4. Nc3 e6 5. Nxd5 exd5 6. d4 Nc6
B30	Sicilian Defense: Closed, Anti-Sveshnikov Variation, Kharlov-Kramnik Line	1. e4 c5 2. Nf3 Nc6 3. Nc3 e5 4. Bc4 Be7 5. d3 d6 6. Nd2 Bg5
B30	Sicilian Defense: Closed, Anti-Sveshnikov Variation, with Nf6	1. e4 c5 2. Nf3 Nc6 3. Nc3 e5 4. Bc4 Be7 5. d3 Nf6
B30	Sicilian Defense: Closed, Anti-Sveshnikov Variation, with d6	1. e4 c5 2. Nf3 Nc6 3. Nc3 e5 4. Bc4 Be7 5. d3 d6
B30	Sicilian Defense: Nyezhmetdinov-Rossolimo Attack	1. e4 c5 2. Nf3 Nc6 3. Bb5
B30	Sicilian Defense: Nyezhmetdinov-Rossolimo Attack, Brooklyn Retreat Defense	1. e4 c5 2. Nf3 Nc6 3. Bb5 Nb8
B30	Sicilian Defense: Nyezhmetdinov-Rossolimo Attack, San Francisco Gambit	1. e4 c5 2. Nf3 Nc6 3. Bb5 Na5 4. b4
B30	Sicilian Defense: Old Sicilian	1. e4 c5 2. Nf3 Nc6
B30	Sicilian Defense: Portsmouth Gambit	1. e4 c5 2. Nf3 Nc6 3. b4
B31	Sicilian Defense: Nyezhmetdinov-Rossolimo Attack, Fianchetto Variation	1. e4 c5 2. Nf3 Nc6 3. Bb5 g6
B31	Sicilian Defense: Nyezhmetdinov-Rossolimo Attack, Fianchetto Variation, Gufeld Gambit	1. e4 c5 2. Nf3 Nc6 3. Bb5 g6 4. O-O Bg7 5. c3 e5 6. d4
B31	Sicilian Defense: Nyezhmetdinov-Rossolimo Attack, Fianchetto Variation, Lutikov Gambit	1. e4 c5 2. Nf3 Nc6 3. Bb5 g6 4. O-O Bg7 5. c3 Nf6 6. d4
B31	Sicilian Defense: Nyezhmetdinov-Rossolimo Attack, Fianchetto Variation, Totsky Attack	1. e4 c5 2. Nf3 Nc6 3. Bb5 g6 4. O-O Bg7 5. c3 Nf6 6. Qa4
B31	Sicilian Defense: Nyezhmetdinov-Rossolimo Attack, Gurgenidze Variation	1. e4 c5 2. Nf3 Nc6 3. Bb5 g6 4. O-O Bg7 5. Re1 e5 6. b4
B32	Sicilian Defense: Accelerated Dragon	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6
B32	Sicilian Defense: Flohr Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Qc7
B32	Sicilian Defense: Franco-Sicilian Variation	1. e4 c5 2. Nf3 Nc6 3. d4 e6
B32	Sicilian Defense: Godiva Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Qb6
B32	Sicilian Defense: Kalashnikov Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 e5 5. Nb5 d6
B32	Sicilian Defense: Löwenthal Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 e5
B32	Sicilian Defense: Nimzo-American Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 d5
B32	Sicilian Defense: O'Kelly Variation, Maróczy Bind, Geller Line	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 a6 5. c4 e5
B32	Sicilian Defense: Open	1. e4 c5 2. Nf3 Nc6 3. d4
B32	Sicilian Defense: Open	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4
B32	Sicilian Defense: Open	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4
B33	Sicilian Defense: Lasker-Pelikan Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5
B33	Sicilian Defense: Lasker-Pelikan Variation, Bird Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Na3 Be6
B33	Sicilian Defense: Lasker-Pelikan Variation, Exchange Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Nxc6
B33	Sicilian Defense: Lasker-Pelikan Variation, Retreat Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Nf3
B33	Sicilian Defense: Lasker-Pelikan Variation, Schlechter Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Nb3
B33	Sicilian Defense: Lasker-Pelikan Variation, Sveshnikov Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Na3 b5
B33	Sicilian Defense: Lasker-Pelikan Variation, Sveshnikov Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Na3 b5 9. Bxf6 gxf6 10. Nd5 f5
B33	Sicilian Defense: Lasker-Pelikan Variation, Sveshnikov Variation, Chelyabinsk Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Na3 b5 9. Nd5
B33	Sicilian Defense: Lasker-Pelikan Variation, Sveshnikov Variation, Novosibirsk Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Na3 b5 9. Bxf6 gxf6 10. Nd5 Bg7
B33	Sicilian Defense: Lasker-Pelikan Variation, Sveshnikov Variation, Peresypkin's Sacrifice	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Na3 b5 9. Bxf6 gxf6 10. Nd5 f5 11. Bxb5
B33	Sicilian Defense: Open	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6
B34	Sicilian Defense: Accelerated Dragon, Exchange Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nxc6
B34	Sicilian Defense: Accelerated Dragon, Modern Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3
B35	Sicilian Defense: Accelerated Dragon, Modern Bc4 Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Bc4
B35	Sicilian Defense: Dragon Variation, Modern Bc4 Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Bc4 d6
B36	Sicilian Defense: Accelerated Dragon, Maróczy Bind	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. c4
B36	Sicilian Defense: Accelerated Dragon, Maróczy Bind, Gurgenidze Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. c4 Nf6 6. Nc3 Nxd4 7. Qxd4 d6
B37	Sicilian Defense: Accelerated Dragon, Maróczy Bind	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. c4 Bg7
B37	Sicilian Defense: Accelerated Dragon, Simagin Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. c4 Bg7 6. Nc2 d6 7. Be2 Nh6
B38	Sicilian Defense: Accelerated Dragon, Maróczy Bind	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. c4 Bg7 6. Be3
B39	Sicilian Defense: Accelerated Dragon, Maróczy Bind, Breyer Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. c4 Bg7 6. Be3 Nf6 7. Nc3 Ng4
B40	Sicilian Defense: Alapin Variation, Sherzer Variation	1. e4 c5 2. Nf3 e6 3. c3 Nf6 4. e5 Nd5 5. d4 Nc6
B40	Sicilian Defense: Delayed Alapin Variation, with e6	1. e4 c5 2. Nf3 e6 3. c3
B40	Sicilian Defense: Drazic Variation	1. e4 c5 2. Nf3 e6 3. d4 a6
B40	Sicilian Defense: French Variation	1. e4 c5 2. Nf3 e6
B40	Sicilian Defense: French Variation, Normal	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6
B40	Sicilian Defense: French Variation, Open	1. e4 c5 2. Nf3 e6 3. d4 cxd4
B40	Sicilian Defense: French Variation, Westerinen Attack	1. e4 c5 2. Nf3 e6 3. b3
B40	Sicilian Defense: Gaw-Paw Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Qb6
B40	Sicilian Defense: Kan Variation, Wing Attack, Fianchetto Variation	1. e4 c5 2. Nf3 e6 3. Nc3 a6 4. g3 b5 5. d4 cxd4 6. Nxd4
B40	Sicilian Defense: Kramnik Variation	1. e4 c5 2. Nf3 e6 3. c4
B40	Sicilian Defense: Kveinis Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Qb6
B40	Sicilian Defense: Marshall Counterattack	1. e4 c5 2. Nf3 e6 3. d4 d5
B40	Sicilian Defense: Paulsen-Basman Defense	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Bc5
B40	Sicilian Defense: Pin Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Bb4
B40	Sicilian Defense: Pin Variation, Jaffe Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Bb4 6. Bd3 e5
B40	Sicilian Defense: Pin Variation, Koch Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Bb4 6. e5
B40	Sicilian Defense: Smith-Morra Gambit Deferred	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. c3
B40	Sicilian Defense: Wing Gambit Deferred	1. e4 c5 2. Nf3 e6 3. b4
B41	Sicilian Defense: Kan Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6
B41	Sicilian Defense: Kan Variation, Maróczy Bind, Bronstein Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. c4 Nf6 6. Nc3 Bb4 7. Bd3 Nc6
B41	Sicilian Defense: Kan Variation, Maróczy Bind, Bronstein Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. c4 Nf6 6. Nc3 Bb4 7. Bd3 Nc6 8. Bc2
B41	Sicilian Defense: Kan Variation, Maróczy Bind, Hedgehog Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. c4 g6
B41	Sicilian Defense: Kan Variation, Maróczy Bind, Réti Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. c4
B42	Sicilian Defense: Kan Variation, Gipslis Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Nf6 6. O-O d6 7. c4 g6
B42	Sicilian Defense: Kan Variation, Modern Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3
B42	Sicilian Defense: Kan Variation, Polugaevsky Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Bc5
B42	Sicilian Defense: Kan Variation, Swiss Cheese Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 g6
B43	Sicilian Defense: Kan Variation, Knight Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Nc3
B43	Sicilian Defense: Kan Variation, Wing Attack	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Nc3 b5
B43	Sicilian Defense: Kan Variation, Wing Attack, Christiansen's Dream	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Nc3 b5 6. Bd3 Qb6 7. Be3 Bc5 8. Qg4
B43	Sicilian Defense: Kan Variation, Wing Attack, Spraggett Attack	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Nc3 b5 6. Bd3 Qb6 7. Nf3
B44	Sicilian Defense: Taimanov Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6
B44	Sicilian Defense: Taimanov Variation, Gary Gambit	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 d5
B44	Sicilian Defense: Taimanov Variation, Modern Line	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 Be7 9. Be2 O-O 10. O-O b6
B44	Sicilian Defense: Taimanov Variation, Szén Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5
B45	Sicilian Defense: Four Knights Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Nf6
B45	Sicilian Defense: Four Knights Variation, American Attack	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Nf6 6. Ndb5 Bb4 7. Nd6+
B45	Sicilian Defense: Four Knights Variation, Cobra Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Nf6 6. Ndb5 Bc5
B45	Sicilian Defense: Four Knights Variation, Exchange Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Nf6 6. Nxc6
B45	Sicilian Defense: Four Knights Variation, Sveshnikov Transfer	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Nf6 6. Ndb5 d6
B45	Sicilian Defense: Taimanov Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3
B46	Sicilian Defense: Taimanov Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 a6
B47	Sicilian Defense: Taimanov Variation, Bastrikov Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Qc7
B47	Sicilian Defense: Taimanov Variation, Bastrikov Variation, Ponomariov Gambit	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Qc7 6. Ndb5 Qb8 7. Be3 a6 8. Bb6
B48	Sicilian Defense: Taimanov Variation, Bastrikov Variation, English Attack	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Qc7 6. Be3
B49	Sicilian Defense: Taimanov Variation, Bastrikov Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Qc7 6. Be3 a6 7. Be2
B50	Sicilian Defense	1. e4 c5 2. Nf3 d6 3. d4
B50	Sicilian Defense	1. e4 c5 2. Nf3 d6 3. d4 cxd4
B50	Sicilian Defense: Delayed Alapin Variation, Basman-Palatnik Double Gambit	1. e4 c5 2. Nf3 d6 3. c3 Nf6 4. Be2 Nc6 5. d4 cxd4 6. cxd4 Nxe4 7. d5 Qa5+ 8. Nc3 Nxc3 9. bxc3
B50	Sicilian Defense: Delayed Alapin Variation, Basman-Palatnik Gambit	1. e4 c5 2. Nf3 d6 3. c3 Nf6 4. Be2 Nc6 5. d4 cxd4 6. cxd4 Nxe4
B50	Sicilian Defense: Delayed Alapin Variation, with d6	1. e4 c5 2. Nf3 d6 3. c3
B50	Sicilian Defense: Kopec System	1. e4 c5 2. Nf3 d6 3. Bd3
B50	Sicilian Defense: Kotov Gambit	1. e4 c5 2. Nf3 d6 3. g3 b5
B50	Sicilian Defense: Modern Variations	1. e4 c5 2. Nf3 d6
B50	Sicilian Defense: Modern Variations, Anti-Qxd4 Move Order	1. e4 c5 2. Nf3 d6 3. d4 Nf6
B50	Sicilian Defense: Modern Variations, Anti-Qxd4 Move Order Accepted	1. e4 c5 2. Nf3 d6 3. d4 Nf6 4. dxc5 Nxe4
B50	Sicilian Defense: Modern Variations, Tartakower	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. c3
B50	Sicilian Defense: Wing Gambit, Deferred Variation	1. e4 c5 2. Nf3 d6 3. b4
B51	Sicilian Defense: Moscow Variation	1. e4 c5 2. Nf3 d6 3. Bb5+
B51	Sicilian Defense: Moscow Variation, Dorfman Gambit	1. e4 c5 2. Nf3 d6 3. Bb5+ Nc6 4. O-O Bd7 5. Qe2 g6 6. e5
B51	Sicilian Defense: Moscow Variation, Moscow Gambit	1. e4 c5 2. Nf3 d6 3. Bb5+ Nc6 4. O-O Bd7 5. c3 Nf6 6. Re1 a6 7. Bxc6 Bxc6 8. d4 Bxe4 9. Bg5
B52	Sicilian Defense: Moscow Variation, Haag Gambit	1. e4 c5 2. Nf3 d6 3. Bb5+ Bd7 4. Bxd7+ Qxd7 5. O-O Nc6 6. c3 Nf6 7. d4
B52	Sicilian Defense: Moscow Variation, Main Line	1. e4 c5 2. Nf3 d6 3. Bb5+ Bd7
B52	Sicilian Defense: Moscow Variation, Sokolsky Variation	1. e4 c5 2. Nf3 d6 3. Bb5+ Bd7 4. Bxd7+ Qxd7 5. c4
B53	Sicilian Defense: Chekhover Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Qxd4
B53	Sicilian Defense: Chekhover Variation, Zaitsev Defense	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Qxd4 Nc6 5. Bb5 Qd7
B54	Sicilian Defense: Dragon Variation, Accelerated Dragon	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 g6
B54	Sicilian Defense: Modern Variations, Ginsberg Gambit	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Bc4
B54	Sicilian Defense: Modern Variations, Main Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6
B54	Sicilian Defense: Prins Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. f3
B55	Sicilian Defense: Prins Variation, Venice Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. f3 e5 6. Bb5+
B56	Sicilian Defense: Classical Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6
B56	Sicilian Defense: Classical Variation, Fianchetto Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. g3
B56	Sicilian Defense: Kupreichik Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Bd7
B56	Sicilian Defense: Spielmann Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Nde2
B56	Sicilian Defense: Venice Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Bb5+
B56	Sicilian Defense: Yates Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bd3
B57	Sicilian Defense: Classical Variation, Anti-Sozin Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 Qb6
B57	Sicilian Defense: Classical Variation, Sozin Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bc4
B57	Sicilian Defense: Magnus Smith Trap	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 g6 7. Nxc6 bxc6 8. e5
B58	Sicilian Defense: Boleslavsky Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Be2 e5
B58	Sicilian Defense: Boleslavsky Variation, Louma Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Be2 e5 7. Nxc6
B58	Sicilian Defense: Classical Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Be2
B58	Sicilian Defense: Classical Variation, Dragon Transfer	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Be2 Nxd4 7. Qxd4 g6
B59	Sicilian Defense: Boleslavsky Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Be2 e5 7. Nb3
B60	Sicilian Defense: Richter-Rauzer Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5
B60	Sicilian Defense: Richter-Rauzer Variation, Dragon Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bg5 g6
B60	Sicilian Defense: Richter-Rauzer Variation, Modern Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 Bd7
B61	Sicilian Defense: Richter-Rauzer Variation, Modern Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bg5 Bd7 7. Qd2
B62	Sicilian Defense: Richter-Rauzer Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6
B62	Sicilian Defense: Richter-Rauzer Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Qd3
B62	Sicilian Defense: Richter-Rauzer Variation, Exchange Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Nxc6
B62	Sicilian Defense: Richter-Rauzer Variation, Podebrady Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bg5 e6 7. Nb3
B62	Sicilian Defense: Richter-Rauzer Variation, Vitolins Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Bb5
B63	Sicilian Defense: Richter-Rauzer Variation, Classical Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Qd2 Be7
B63	Sicilian Defense: Richter-Rauzer Variation, Classical Variation, Kantscher Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Qd2 Be7 8. O-O-O Nxd4 9. Qxd4 a6 10. f4 b5
B63	Sicilian Defense: Richter-Rauzer Variation, Ivanov Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Qd2 Qb6
B63	Sicilian Defense: Richter-Rauzer Variation, Traditional Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Qd2
B64	Sicilian Defense: Richter-Rauzer Variation, Classical Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bg5 e6 7. Qd2 Be7 8. O-O-O O-O 9. f4 e5
B64	Sicilian Defense: Richter-Rauzer Variation, Classical Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Qd2 Be7 8. O-O-O O-O 9. f4
B65	Sicilian Defense: Richter-Rauzer Variation, Classical Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Qd2 Be7 8. O-O-O O-O 9. f4 Nxd4 10. Qxd4
B65	Sicilian Defense: Richter-Rauzer Variation, Rauzer Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Qd2 Be7 8. O-O-O O-O 9. f4 Nxd4
B66	Sicilian Defense: Richter-Rauzer Variation, Neo-Modern Variation, Early Deviations	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Qd2 a6
B67	Sicilian Defense: Richter-Rauzer Variation, Neo-Modern Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bg5 e6 7. Qd2 a6 8. O-O-O Bd7
B68	Sicilian Defense: Richter-Rauzer Variation, Neo-Modern Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bg5 e6 7. Qd2 a6 8. O-O-O Bd7 9. f4 Be7
B69	Sicilian Defense: Richter-Rauzer Variation, Neo-Modern Variation, Nyezhmetdinov Attack	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bg5 e6 7. Qd2 a6 8. O-O-O Bd7 9. f4 Be7 10. Nf3 b5 11. Bxf6
B70	Sicilian Defense: Dragon Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6
B70	Sicilian Defense: Dragon Variation, Classical Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be2
B70	Sicilian Defense: Dragon Variation, Fianchetto Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. g3
B71	Sicilian Defense: Dragon Variation, Levenfish Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. f4
B71	Sicilian Defense: Dragon Variation, Levenfish Variation, Main Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. f4 Nbd7
B72	Sicilian Defense: Dragon Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3
B72	Sicilian Defense: Dragon Variation, Classical Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. Be2
B72	Sicilian Defense: Dragon Variation, Classical Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. Be2 Nc6
B72	Sicilian Defense: Dragon Variation, Classical Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. Be2 Nc6 8. Nb3
B72	Sicilian Defense: Dragon Variation, Classical Variation, Amsterdam Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Be2 g6 7. Be3 Bg7 8. Qd2
B72	Sicilian Defense: Dragon Variation, Classical Variation, Grigoriev Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Be2 g6 7. Be3 Bg7 8. Qd2 O-O 9. O-O-O
B73	Sicilian Defense: Dragon Variation, Classical Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be2 Bg7 7. O-O Nc6 8. Be3
B73	Sicilian Defense: Dragon Variation, Classical Variation, Battery Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be2 Bg7 7. O-O O-O 8. Be3 Nc6 9. Qd2
B73	Sicilian Defense: Dragon Variation, Classical Variation, Zollner Gambit	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Be3 Bg7 6. Be2 Nf6 7. Nc3 O-O 8. O-O d6 9. f4 Qb6 10. e5
B74	Sicilian Defense: Dragon Variation, Classical Variation, Alekhine Line	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Be2 O-O 8. O-O d6 9. Nb3 a5
B74	Sicilian Defense: Dragon Variation, Classical Variation, Bernard Defense	1. e4 c5 2. Nf3 g6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Be2 Bg7 7. O-O O-O 8. Be3 Nc6 9. Nb3 Be6 10. f4 Na5 11. f5 Bc4 12. Bd3 Bxd3 13. cxd3 d5
B74	Sicilian Defense: Dragon Variation, Classical Variation, Maróczy Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be2 Bg7 7. O-O O-O 8. Be3 Nc6 9. Nb3 Be6 10. f4 Na5
B74	Sicilian Defense: Dragon Variation, Classical Variation, Normal Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be2 Bg7 7. O-O O-O 8. Be3 Nc6 9. Nb3
B74	Sicilian Defense: Dragon Variation, Classical Variation, Spielmann Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Be2 O-O 8. Nb3 d6 9. O-O Be6 10. f4 Na5 11. f5 Bc4 12. Bd3
B74	Sicilian Defense: Dragon Variation, Classical Variation, Stockholm Attack	1. e4 c5 2. Nc3 d6 3. f4 Nc6 4. Nf3 g6 5. d4 cxd4 6. Nxd4 Bg7 7. Be3 Nf6 8. Be2 O-O 9. Nb3 Be6 10. O-O Na5 11. f5 Bc4 12. Nxa5 Bxe2 13. Qxe2 Qxa5 14. g4
B74	Sicilian Defense: Dragon Variation, Classical Variation, Tartakower Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be2 Bg7 7. O-O O-O 8. Be3 Nc6 9. Nb3 Be6 10. f4 Qc8
B75	Sicilian Defense: Dragon Variation, Yugoslav Attack, Belezky Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 Nc6
B75	Sicilian Defense: Dragon Variation, Yugoslav Attack, Early Deviations	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3
B76	Sicilian Defense: Dragon Variation, Yugoslav Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O
B76	Sicilian Defense: Dragon Variation, Yugoslav Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6
B76	Sicilian Defense: Dragon Variation, Yugoslav Attack, Modern Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 Nc6 8. Qd2 O-O 9. O-O-O
B76	Sicilian Defense: Dragon Variation, Yugoslav Attack, Panov Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. g4
B77	Sicilian Defense: Dragon Variation, Yugoslav Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. Bc4 Bd7
B77	Sicilian Defense: Dragon Variation, Yugoslav Attack, Byrne Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. Bc4 a5
B77	Sicilian Defense: Dragon Variation, Yugoslav Attack, Czerniak Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 Nc6 8. Qd2 O-O 9. Bc4 Nxd4 10. Bxd4 Be6
B77	Sicilian Defense: Dragon Variation, Yugoslav Attack, Main Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. Bc4
B77	Sicilian Defense: Dragon Variation, Yugoslav Attack, Sosonko Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 Nc6 8. Qd2 O-O 9. Bc4 Nd7
B78	Sicilian Defense: Dragon Variation, Yugoslav Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. Bc4 Bd7 10. O-O-O
B78	Sicilian Defense: Dragon Variation, Yugoslav Attack, Old Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. Bc4 Bd7 10. O-O-O Rc8
B79	Sicilian Defense: Dragon Variation, Yugoslav Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. Bc4 Bd7 10. h4 Qa5 11. O-O-O Rfc8 12. Bb3
B79	Sicilian Defense: Dragon Variation, Yugoslav Attack, Soltis Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. Bc4 Bd7 10. O-O-O Qa5 11. h4 Rfc8 12. Bb3 h5
B80	Sicilian Defense: Scheveningen Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6
B80	Sicilian Defense: Scheveningen Variation, English Attack, with Qd2	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e6 7. Qd2
B80	Sicilian Defense: Scheveningen Variation, Fianchetto Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. g3
B80	Sicilian Defense: Scheveningen Variation, Vitolins Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bb5+
B81	Sicilian Defense: Scheveningen Variation, Keres Attack	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. g4
B82	Sicilian Defense: Scheveningen Variation, Matanovic Attack	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. f4
B82	Sicilian Defense: Scheveningen Variation, Tal Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. f4 Nc6 7. Be3 Be7 8. Qf3
B83	Sicilian Defense: Scheveningen Variation, Classical Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Be2
B83	Sicilian Defense: Scheveningen Variation, Modern Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 d6 6. Be2 Nf6
B83	Sicilian Defense: Scheveningen Variation, Modern Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Be2 Be7 7. O-O O-O 8. f4 Nc6 9. Be3
B83	Sicilian Defense: Scheveningen Variation, Modern Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Be2 Be7 7. O-O O-O 8. f4 Nc6 9. Be3 Bd7 10. Nb3
B84	Sicilian Defense: Najdorf Variation, Scheveningen Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e6 7. O-O Nbd7
B84	Sicilian Defense: Scheveningen Variation, Classical Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e6
B84	Sicilian Defense: Scheveningen Variation, Classical Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e6 7. O-O Qc7
B85	Sicilian Defense: Scheveningen Variation, Classical Main Line	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Qc7 6. Be2 a6 7. O-O Nf6 8. Be3 Be7 9. f4 d6 10. Qe1 O-O
B85	Sicilian Defense: Scheveningen Variation, Classical Variation, Paulsen Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. f4 e6 7. Be2 Qc7 8. O-O Nc6
B85	Sicilian Defense: Scheveningen Variation, Classical Variation, Paulsen Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Qc7 6. Be2 a6 7. O-O Nf6 8. Be3 d6 9. f4
B85	Sicilian Defense: Scheveningen Variation, Classical Variation, Paulsen Variation	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Qc7 6. Be2 a6 7. O-O Nf6 8. Kh1 Be7 9. f4 d6 10. a4
B86	Sicilian Defense: Sozin Attack	1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4
B87	Sicilian Defense: Sozin Attack, Flank Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3 b5
B88	Sicilian Defense: Sozin Attack, Fischer Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 e6 7. Bb3 Be7 8. Be3 O-O 9. f4
B88	Sicilian Defense: Sozin Attack, Leonhardt Variation	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 e6
B89	Sicilian Defense: Sozin Attack, Main Line	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 e6 7. Be3
B89	Sicilian Defense: Sozin Attack, Main Line, Sherbakov Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bc4 e6 7. Be3 Be7 8. Bb3 O-O 9. O-O Na5 10. f4 b6
B89	Sicilian Defense: Velimirovic Attack	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 e6 7. Be3 Be7 8. Qe2
B90	Sicilian Defense: Najdorf Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6
B90	Sicilian Defense: Najdorf Variation, Adams Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. h3
B90	Sicilian Defense: Najdorf Variation, Dekker Gambit	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. g4
B90	Sicilian Defense: Najdorf Variation, English Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3
B90	Sicilian Defense: Najdorf Variation, English Attack, Anti-English	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 Ng4
B90	Sicilian Defense: Najdorf Variation, Freak Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Rg1
B90	Sicilian Defense: Najdorf Variation, Lipnitsky Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4
B90	Sicilian Defense: Scheveningen Variation, Delayed Keres Attack	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e6 7. g4
B90	Sicilian Defense: Scheveningen Variation, Delayed Keres Attack, Perenyi Gambit	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e6 7. g4 e5 8. Nf5 g6 9. g5
B90	Sicilian Defense: Scheveningen Variation, English Attack, with f3	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e6 7. f3
B91	Sicilian Defense: Najdorf Variation, Zagreb Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. g3
B92	Sicilian Defense: Najdorf Variation, Opocensky Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2
B92	Sicilian Defense: Najdorf Variation, Opocensky Variation	1. e4 c5 2. Nf3 Nf6 3. Nc3 d6 4. d4 cxd4 5. Nxd4 a6 6. Be2 e5 7. Nb3 Be6 8. Be3
B92	Sicilian Defense: Najdorf Variation, Opocensky Variation, Modern Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O Be6
B92	Sicilian Defense: Najdorf Variation, Opocensky Variation, Traditional Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O
B93	Sicilian Defense: Najdorf Variation, Amsterdam Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. f4
B94	Sicilian Defense: Najdorf Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5
B94	Sicilian Defense: Najdorf Variation, Ivkov Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 Nbd7 7. Bc4 Qa5 8. Qd2 e6 9. O-O-O b5 10. Bb3 Bb7 11. Rhe1 Nc5 12. e5
B95	Sicilian Defense: Najdorf Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6
B96	Sicilian Defense: Najdorf Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4
B96	Sicilian Defense: Najdorf Variation, Neo-Classical Defense	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Nc6
B96	Sicilian Defense: Najdorf Variation, Polugaevsky Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 b5
B96	Sicilian Defense: Najdorf Variation, Polugaevsky Variation, Simagin Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 b5 8. e5 dxe5 9. fxe5 Qc7 10. Qe2
B97	Sicilian Defense: Najdorf Variation, Poisoned Pawn Accepted	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Qb6 8. Qd2 Qxb2 9. Rb1 Qa3
B97	Sicilian Defense: Najdorf Variation, Poisoned Pawn Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Qb6
B98	Sicilian Defense: Najdorf Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7
B98	Sicilian Defense: Najdorf Variation, Browne Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 h6 9. Bh4 Qc7
B98	Sicilian Defense: Najdorf Variation, Goteborg Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 h6 9. Bh4 g5
B98	Sicilian Defense: Najdorf Variation, Traditional Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7
B99	Sicilian Defense: Najdorf Variation, Main Line	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7
`,
  $o = `eco	name	pgn
C00	French Defense	1. e4 e6
C00	French Defense	1. e4 e6 2. d4 d5
C00	French Defense: Alapin Gambit	1. e4 e6 2. d4 d5 3. Be3
C00	French Defense: Baeuerle Gambit	1. e4 e6 2. d4 b5
C00	French Defense: Banzai-Leong Gambit	1. e4 e6 2. b4
C00	French Defense: Banzai-Leong Gambit, Pinova Gambit	1. e4 e6 2. b4 Bxb4 3. e5
C00	French Defense: Bird Invitation	1. e4 e6 2. Bb5
C00	French Defense: Carlson Gambit	1. e4 e6 2. d4 d5 3. Nf3 dxe4 4. Ne5
C00	French Defense: Chigorin Variation	1. e4 e6 2. Qe2
C00	French Defense: Diemer-Duhm Gambit	1. e4 e6 2. d4 d5 3. c4
C00	French Defense: Diemer-Duhm Gambit Accepted	1. e4 e6 2. d4 d5 3. c4 dxe4
C00	French Defense: Franco-Hiva Gambit	1. e4 e6 2. d4 f5
C00	French Defense: Franco-Hiva Gambit Accepted	1. e4 e6 2. d4 f5 3. exf5
C00	French Defense: Franco-Sicilian Defense	1. e4 e6 2. d4 c5
C00	French Defense: Hoffmann Gambit	1. e4 e6 2. d4 d5 3. Qe2 e5 4. f4 exf4
C00	French Defense: Horwitz Attack	1. e4 e6 2. b3
C00	French Defense: Horwitz Attack, Papa-Ticulat Gambit	1. e4 e6 2. b3 d5 3. Bb2
C00	French Defense: King's Indian Attack	1. e4 e6 2. d3
C00	French Defense: King's Indian Attack, Franco-Hiva Gambit	1. e4 e6 2. d3 f5
C00	French Defense: Knight Variation	1. e4 e6 2. Nf3
C00	French Defense: Knight Variation, Franco-Hiva Gambit	1. e4 e6 2. Nf3 f5
C00	French Defense: La Bourdonnais Variation	1. e4 e6 2. f4
C00	French Defense: La Bourdonnais Variation, Reuter Gambit	1. e4 e6 2. f4 d5 3. Nf3 dxe4
C00	French Defense: Mediterranean Defense	1. e4 e6 2. d4 Nf6
C00	French Defense: Morphy Gambit	1. e4 e6 2. d4 d5 3. Nh3
C00	French Defense: Normal Variation	1. e4 e6 2. d4
C00	French Defense: Orthoschnapp Gambit	1. e4 e6 2. c4 d5 3. cxd5 exd5 4. Qb3
C00	French Defense: Pelikan Variation	1. e4 e6 2. Nc3 d5 3. f4
C00	French Defense: Perseus Gambit	1. e4 e6 2. d4 d5 3. Nf3
C00	French Defense: Queen's Knight	1. e4 e6 2. Nc3
C00	French Defense: Reversed Philidor Formation	1. e4 e6 2. d3 d5 3. Nd2 Nf6 4. Ngf3 Nc6 5. Be2
C00	French Defense: Réti-Spielmann Attack	1. e4 e6 2. g3
C00	French Defense: Schlechter Variation	1. e4 e6 2. d4 d5 3. Bd3
C00	French Defense: St. George Defense	1. e4 e6 2. d4 a6
C00	French Defense: St. George Defense, Sanky-George Gambit	1. e4 e6 2. d4 a6 3. c4 b5
C00	French Defense: St. George Defense, St. George Gambit	1. e4 e6 2. d4 a6 3. c4 b5 4. cxb5 axb5
C00	French Defense: St. George Defense, Three Pawn Attack	1. e4 e6 2. d4 a6 3. c4
C00	French Defense: St. George Defense, Traditional Line	1. e4 e6 2. d4 a6 3. Nf3 b5 4. Bd3 c5 5. c3 Bb7 6. O-O Nf6
C00	French Defense: Steiner Variation	1. e4 e6 2. c4
C00	French Defense: Steinitz Attack	1. e4 e6 2. e5
C00	French Defense: Two Knights Variation	1. e4 e6 2. Nf3 d5 3. Nc3
C00	French Defense: Wing Gambit	1. e4 e6 2. Nf3 d5 3. e5 c5 4. b4
C00	Rat Defense: Small Center Defense	1. d4 e6 2. e4 d6
C01	French Defense: Exchange Variation	1. e4 e6 2. d4 d5 3. exd5
C01	French Defense: Exchange Variation	1. e4 e6 2. d4 d5 3. exd5 exd5 4. Nf3
C01	French Defense: Exchange Variation	1. e4 e6 2. d4 d5 3. exd5 exd5 4. Nc3
C01	French Defense: Exchange Variation, Bogoljubow Variation	1. e4 e6 2. d4 d5 3. exd5 exd5 4. Nc3 Nf6 5. Bg5 Nc6
C01	French Defense: Exchange Variation, Monte Carlo Variation	1. e4 e6 2. d4 d5 3. exd5 exd5 4. c4
C01	French Defense: Exchange Variation, Svenonius Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. exd5 exd5 5. Bg5
C02	French Defense: Advance Variation	1. e4 e6 2. d4 d5 3. e5
C02	French Defense: Advance Variation	1. e4 e6 2. d4 d5 3. e5 c5
C02	French Defense: Advance Variation	1. e4 e6 2. d4 d5 3. e5 c5 4. c3
C02	French Defense: Advance Variation	1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6
C02	French Defense: Advance Variation, Euwe Variation	1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Bd7
C02	French Defense: Advance Variation, Extended Bishop Swap	1. e4 e6 2. d4 d5 3. e5 Bd7
C02	French Defense: Advance Variation, Frenkel Gambit	1. e4 e6 2. d4 d5 3. e5 c5 4. b4
C02	French Defense: Advance Variation, Kupreichik Variation	1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Be3
C02	French Defense: Advance Variation, Lputian Variation	1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. a3 Nh6
C02	French Defense: Advance Variation, Main Line	1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. a3
C02	French Defense: Advance Variation, Milner-Barry Gambit	1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. Bd3
C02	French Defense: Advance Variation, Milner-Barry Gambit, Hector Variation	1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. Bd3 cxd4 7. O-O
C02	French Defense: Advance Variation, Milner-Barry Gambit, Hector Variation	1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. Bd3 cxd4 7. O-O Bd7 8. Re1
C02	French Defense: Advance Variation, Milner-Barry Gambit, Main Line	1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. Bd3 cxd4 7. cxd4 Bd7 8. O-O
C02	French Defense: Advance Variation, Milner-Barry Gambit, Sørensen Variation	1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. Bd3 cxd4 7. cxd4 Bd7 8. O-O Nxd4 9. Ng5
C02	French Defense: Advance Variation, Nimzowitsch Attack	1. e4 e6 2. d4 d5 3. e5 c5 4. Qg4
C02	French Defense: Advance Variation, Nimzowitsch Gambit	1. e4 e6 2. d4 d5 3. e5 c5 4. Qg4 cxd4 5. Nf3
C02	French Defense: Advance Variation, Nimzowitsch System	1. e4 e6 2. d4 d5 3. e5 c5 4. Nf3
C02	French Defense: Advance Variation, Paulsen Attack	1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3
C02	French Defense: Advance Variation, Ruisdonk Gambit	1. e4 e6 2. d4 d5 3. e5 c5 4. Nf3 cxd4 5. Bd3
C02	French Defense: Advance Variation, Steinitz Variation	1. e4 e6 2. d4 d5 3. e5 c5 4. dxc5
C02	French Defense: Advance Variation, Wade Variation	1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Qb6 5. Nf3 Bd7
C03	French Defense: Tarrasch Variation	1. e4 e6 2. d4 d5 3. Nd2
C03	French Defense: Tarrasch Variation, Guimard Defense	1. e4 e6 2. d4 d5 3. Nd2 Nc6
C03	French Defense: Tarrasch Variation, Guimard Defense, Thunderbunny Variation	1. e4 e6 2. d4 d5 3. Nd2 Nc6 4. c3 dxe4 5. Nxe4 e5
C03	French Defense: Tarrasch Variation, Haberditz Variation	1. e4 e6 2. d4 d5 3. Nd2 f5
C03	French Defense: Tarrasch Variation, Modern System	1. e4 e6 2. d4 d5 3. Nd2 a6
C03	French Defense: Tarrasch Variation, Morozevich Variation	1. e4 e6 2. d4 d5 3. Nd2 Be7
C04	French Defense: Tarrasch Variation, Guimard Defense, Main Line	1. e4 e6 2. d4 d5 3. Nd2 Nc6 4. Ngf3 Nf6
C05	French Defense: Tarrasch Variation, Botvinnik Variation	1. e4 e6 2. d4 d5 3. Nd2 Nf6 4. e5 Nfd7 5. Bd3 c5 6. c3 b6
C05	French Defense: Tarrasch Variation, Closed Variation	1. e4 e6 2. d4 d5 3. Nd2 Nf6
C05	French Defense: Tarrasch Variation, Closed Variation	1. e4 e6 2. d4 d5 3. Nd2 Nf6 4. e5 Nfd7 5. Bd3 c5 6. c3 Nc6
C05	French Defense: Tarrasch Variation, Pawn Center Variation	1. e4 e6 2. d4 d5 3. Nd2 Nf6 4. e5 Nfd7 5. f4
C06	French Defense: Tarrasch Variation, Closed Variation, Main Line	1. e4 e6 2. d4 d5 3. Nd2 Nf6 4. e5 Nfd7 5. Bd3 c5 6. c3 Nc6 7. Ne2 cxd4 8. cxd4
C06	French Defense: Tarrasch Variation, Leningrad Variation	1. e4 e6 2. d4 d5 3. Nd2 Nf6 4. e5 Nfd7 5. Bd3 c5 6. c3 Nc6 7. Ne2 cxd4 8. cxd4 Nb6
C07	French Defense: Tarrasch Variation, Chistyakov Defense	1. e4 e6 2. d4 d5 3. Nd2 c5 4. exd5 Qxd5
C07	French Defense: Tarrasch Variation, Chistyakov Defense, Modern Line	1. e4 e6 2. d4 d5 3. Nd2 c5 4. exd5 Qxd5 5. Ngf3 cxd4 6. Bc4 Qd6 7. O-O Nf6 8. Nb3 Nc6 9. Nbxd4 Nxd4 10. Nxd4 a6
C07	French Defense: Tarrasch Variation, Eliskases Variation	1. e4 e6 2. d4 d5 3. Nd2 c5 4. exd5 Qxd5 5. Ngf3 cxd4 6. Bc4 Qd8
C07	French Defense: Tarrasch Variation, Open System	1. e4 e6 2. d4 d5 3. Nd2 c5
C07	French Defense: Tarrasch Variation, Open System, Euwe-Keres Line	1. e4 e6 2. d4 d5 3. Nd2 c5 4. Ngf3
C07	French Defense: Tarrasch Variation, Open System, Shaposhnikov Gambit	1. e4 e6 2. d4 d5 3. Nd2 c5 4. exd5 Nf6
C07	French Defense: Tarrasch Variation, Open System, Süchting Line	1. e4 e6 2. d4 d5 3. Nd2 c5 4. c3
C08	French Defense: Tarrasch Variation, Open System	1. e4 e6 2. d4 d5 3. Nd2 c5 4. exd5 exd5
C08	French Defense: Tarrasch Variation, Open System, Advance Line	1. e4 e6 2. d4 d5 3. Nd2 c5 4. exd5 exd5 5. Ngf3 c4
C09	French Defense: Tarrasch Variation, Open System, Main Line	1. e4 e6 2. d4 d5 3. Nd2 c5 4. exd5 exd5 5. Ngf3 Nc6
C10	French Defense: Hecht-Reefschläger Variation	1. e4 e6 2. d4 d5 3. Nc3 Nc6
C10	French Defense: Marshall Gambit	1. e4 e6 2. d4 d5 3. Nc3 c5
C10	French Defense: Paulsen Variation	1. e4 e6 2. d4 d5 3. Nc3
C10	French Defense: Rubinstein Variation	1. e4 e6 2. d4 d5 3. Nc3 dxe4
C10	French Defense: Rubinstein Variation, Blackburne Defense	1. e4 e6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nd7
C10	French Defense: Rubinstein Variation, Capablanca Line	1. e4 e6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nd7 5. Nf3 Ngf6 6. Nxf6+ Nxf6 7. Ne5
C10	French Defense: Rubinstein Variation, Ellis Gambit	1. e4 e6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 e5
C10	French Defense: Rubinstein Variation, Fort Knox Variation	1. e4 e6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bd7 5. Nf3 Bc6
C10	French Defense: Rubinstein Variation, Kasparov Attack	1. e4 e6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Nd7 5. Nf3 Ngf6 6. Nxf6+ Nxf6 7. c3
C10	French Defense: Rubinstein Variation, Maric Variation	1. e4 e6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Qd5
C11	French Defense: Classical Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6
C11	French Defense: Classical Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5
C11	French Defense: Classical Variation, Burn Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 dxe4
C11	French Defense: Classical Variation, Burn Variation, Main Line	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 dxe4 5. Nxe4 Be7 6. Bxf6 Bxf6 7. Nf3 O-O
C11	French Defense: Classical Variation, Burn Variation, Morozevich Line	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 dxe4 5. Nxe4 Be7 6. Bxf6 gxf6
C11	French Defense: Classical Variation, Delayed Exchange Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. exd5
C11	French Defense: Classical Variation, Shirov-Anand Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5 Nfd7 5. Nce2
C11	French Defense: Classical Variation, Steinitz Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5
C11	French Defense: Classical Variation, Swiss Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bd3
C11	French Defense: Henneberger Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Be3
C11	French Defense: Steinitz Variation	1. e4 e6 2. d4 d5 3. Nc3 a6 4. Nf3 Nf6 5. e5 Nfd7
C11	French Defense: Steinitz Variation	1. e4 e6 2. d4 d5 3. Nc3 a6 4. Nf3 Nf6 5. e5 Nfd7 6. a3
C11	French Defense: Steinitz Variation	1. e4 e6 2. d4 d5 3. Nc3 a6 4. Nf3 Nf6 5. e5 Nfd7 6. Ne2
C11	French Defense: Steinitz Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5 Nfd7 5. f4 c5 6. dxc5 Nc6
C11	French Defense: Steinitz Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5 Nfd7 5. f4 c5 6. Nf3
C11	French Defense: Steinitz Variation, Boleslavsky Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5 Nfd7 5. f4 c5 6. Nf3 Nc6 7. Be3
C11	French Defense: Steinitz Variation, Bradford Attack Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5 Nfd7 5. f4 c5 6. dxc5 Bxc5 7. Qg4
C11	French Defense: Steinitz Variation, Brodsky-Jones Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5 Nfd7 5. f4 c5 6. dxc5 Nc6 7. a3 Bxc5 8. Qg4 O-O 9. Nf3 f6
C11	French Defense: Steinitz Variation, Gledhill Attack	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5 Nfd7 5. Qg4
C12	French Defense: McCutcheon Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Bb4
C12	French Defense: McCutcheon Variation, Advance Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Bb4 5. e5
C12	French Defense: McCutcheon Variation, Bernstein Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Bb4 5. e5 h6 6. Bh4
C12	French Defense: McCutcheon Variation, Bogoljubow Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Bb4 5. exd5 Qxd5 6. Bxf6 gxf6 7. Qd2 Qa5
C12	French Defense: McCutcheon Variation, Chigorin Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Bb4 5. e5 h6 6. exf6
C12	French Defense: McCutcheon Variation, Dr. Olland Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Bb4 5. e5 h6 6. Bc1
C12	French Defense: McCutcheon Variation, Duras Variation	1. e4 e6 2. Nc3 d5 3. d4 Nf6 4. Bg5 Bb4 5. e5 h6 6. Bd2 Bxc3 7. bxc3 Ne4 8. Qg4 Kf8 9. Bc1
C12	French Defense: McCutcheon Variation, Exchange Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Bb4 5. exd5
C12	French Defense: McCutcheon Variation, Grigoriev Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Bb4 5. e5 h6 6. exf6 hxg5 7. fxg7 Rg8 8. h4 gxh4 9. Qg4
C12	French Defense: McCutcheon Variation, Janowski Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Bb4 5. e5 h6 6. Be3
C12	French Defense: McCutcheon Variation, Lasker Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Bb4 5. e5 h6 6. Bd2 Bxc3
C12	French Defense: McCutcheon Variation, Lasker Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Bb4 5. e5 h6 6. Bd2 Bxc3 7. bxc3 Ne4 8. Qg4 g6
C12	French Defense: McCutcheon Variation, Tartakower Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Bb4 5. e5 h6 6. Bd2 Nfd7
C13	French Defense: Alekhine-Chatard Attack	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. h4
C13	French Defense: Alekhine-Chatard Attack, Albin-Chatard Gambit	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. h4 Bxg5 7. hxg5 Qxg5
C13	French Defense: Alekhine-Chatard Attack, Breyer Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. h4 c5
C13	French Defense: Alekhine-Chatard Attack, Maróczy Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. h4 a6
C13	French Defense: Alekhine-Chatard Attack, Spielmann Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. h4 O-O
C13	French Defense: Alekhine-Chatard Attack, Teichmann Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. h4 f6
C13	French Defense: Classical Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 dxe4 5. Nxe4 Be7
C13	French Defense: Classical Variation, Frankfurt Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Ng8 6. Be3 b6
C13	French Defense: Classical Variation, Normal Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7
C13	French Defense: Classical Variation, Richter Attack	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. Bxf6
C13	French Defense: Classical Variation, Richter Attack	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. Bxf6 Bxf6 6. e5 Be7 7. Qg4
C13	French Defense: Classical Variation, Tartakower Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Ne4
C13	French Defense: Classical Variation, Vistaneckis Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Ng8
C14	French Defense: Classical Variation	1. e4 e6 2. d4 d5 3. Nc3 a6 4. Nf3 Nf6 5. e5 Nfd7 6. Bg5
C14	French Defense: Classical Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. Bxe7 Qxe7
C14	French Defense: Classical Variation, Alapin Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. Bxe7 Qxe7 7. Nb5
C14	French Defense: Classical Variation, Pollock Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. Bxe7 Qxe7 7. Qg4
C14	French Defense: Classical Variation, Rubinstein Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. Bxe7 Qxe7 7. Qd2
C14	French Defense: Classical Variation, Stahlberg Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. Bxe7 Qxe7 7. f4 O-O 8. Nf3 c5 9. Qd2 Nc6 10. O-O-O c4
C14	French Defense: Classical Variation, Steinitz Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. Bxe7 Qxe7 7. f4
C14	French Defense: Classical Variation, Tarrasch Variation	1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. Bxe7 Qxe7 7. Bd3
C15	French Defense: McCutcheon Variation, Wolf Gambit	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. Ne2 Nf6 5. Bg5
C15	French Defense: Winawer Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4
C15	French Defense: Winawer Variation, Alekhine Gambit Accepted	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. Ne2 dxe4 5. a3 Bxc3+
C15	French Defense: Winawer Variation, Alekhine Gambit, Alatortsev Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. Ne2 dxe4 5. a3 Be7 6. Nxe4 Nf6 7. N2g3 O-O 8. Be2 Nc6
C15	French Defense: Winawer Variation, Alekhine Gambit, Kan Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. Ne2 dxe4 5. a3 Bxc3+ 6. Nxc3 Nc6
C15	French Defense: Winawer Variation, Alekhine-Maróczy Gambit	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. Ne2
C15	French Defense: Winawer Variation, Delayed Exchange Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. exd5
C15	French Defense: Winawer Variation, Exchange Variation, Canal Attack	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. exd5 exd5 5. Bd3 Ne7 6. Qh5
C15	French Defense: Winawer Variation, Fingerslip Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. Bd2
C15	French Defense: Winawer Variation, Fingerslip Variation, Kunin Double Gambit	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. Bd2 dxe4 5. Qg4 Qxd4
C15	French Defense: Winawer Variation, Fingerslip Variation, Main Line	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. Bd2 dxe4 5. Qg4 Nf6 6. Qxg7 Rg8 7. Qh6
C15	French Defense: Winawer Variation, Fingerslip Variation, Schwarz's Line	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. Bd2 Ne7 5. Nb1
C15	French Defense: Winawer Variation, Kondratiyev Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. Bd3 c5 5. exd5 Qxd5 6. Bd2
C15	French Defense: Winawer Variation, Winckelmann-Reimer Gambit	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. a3 Bxc3+ 5. bxc3 dxe4 6. f3
C16	French Defense: Winawer Variation, Advance Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5
C16	French Defense: Winawer Variation, Petrosian Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 Qd7
C17	French Defense: Winawer Variation, Advance Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5
C17	French Defense: Winawer Variation, Advance Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3
C17	French Defense: Winawer Variation, Advance Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 cxd4 6. axb4 dxc3 7. Nf3
C17	French Defense: Winawer Variation, Advance Variation, Moscow Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. Qg4
C17	French Defense: Winawer Variation, Bogoljubow Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. Bd2
C17	French Defense: Winawer Variation, Bogoljubow Variation, Icelandic Defense	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. Bd2 Ne7 6. f4
C17	French Defense: Winawer Variation, Maróczy-Wallis Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 cxd4 6. axb4 dxc3
C17	French Defense: Winawer Variation, Retreat Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Ba5
C17	French Defense: Winawer Variation, Retreat Variation, Armenian Line	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Ba5 6. b4 cxd4
C18	French Defense: Winawer Variation, Advance Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3
C18	French Defense: Winawer Variation, Advance Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7
C18	French Defense: Winawer Variation, Advance Variation, with Bd3	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Bd3
C18	French Defense: Winawer Variation, Advance Variation, with Bd3	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Bd3 Qc7
C18	French Defense: Winawer Variation, Advance Variation, with h4	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. h4
C18	French Defense: Winawer Variation, Advance Variation, with h4	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. h4 Qc7
C18	French Defense: Winawer Variation, Classical Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Qc7
C18	French Defense: Winawer Variation, Eingorn Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 Kf8
C18	French Defense: Winawer Variation, Poisoned Pawn Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 Qc7
C18	French Defense: Winawer Variation, Poisoned Pawn Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 cxd4 8. Qxg7
C18	French Defense: Winawer Variation, Poisoned Pawn Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 cxd4 8. Qxg7 Rg8 9. Qxh7 Nbc6
C18	French Defense: Winawer Variation, Poisoned Pawn Variation Declined	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 Qc7 8. Bd3
C18	French Defense: Winawer Variation, Poisoned Pawn Variation, Main Line	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 Qc7 8. Qxg7 Rg8 9. Qxh7 cxd4 10. Ne2
C18	French Defense: Winawer Variation, Poisoned Pawn Variation, Paoli Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 Qc7 8. Qxg7 Rg8 9. Qxh7 cxd4 10. Kd1
C18	French Defense: Winawer Variation, Portisch-Hook Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Qa5
C18	French Defense: Winawer Variation, Warsaw Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 O-O
C19	French Defense: Winawer Variation, Advance Variation, Smyslov Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 Ne7 5. a3 Bxc3+ 6. bxc3 c5 7. a4
C19	French Defense: Winawer Variation, Advance Variation, Smyslov Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 Ne7 5. a3 Bxc3+ 6. bxc3 c5 7. a4 Qc7
C19	French Defense: Winawer Variation, Positional Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. a4 Nbc6 8. Nf3
C19	French Defense: Winawer Variation, Positional Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. a4 Nbc6 8. Nf3 Qa5 9. Qd2
C19	French Defense: Winawer Variation, Positional Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. a4 Nbc6 8. Nf3 Qa5 9. Qd2 Bd7
C19	French Defense: Winawer Variation, Positional Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. a4 Nbc6 8. Nf3 Qa5 9. Bd2
C19	French Defense: Winawer Variation, Positional Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. a4 Nbc6 8. Nf3 Qa5 9. Bd2 Bd7
C19	French Defense: Winawer Variation, Positional Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. a4 Nbc6 8. Nf3 Qa5 9. Bd2 c4
C19	French Defense: Winawer Variation, Positional Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Nf3
C19	French Defense: Winawer Variation, Positional Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Nc6 7. Nf3 Nge7
C19	French Defense: Winawer Variation, Positional Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Nf3 Qc7
C19	French Defense: Winawer Variation, Positional Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Nf3 Qc7 8. h4
C19	French Defense: Winawer Variation, Positional Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Bd3 Nbc6 8. Nf3
C19	French Defense: Winawer Variation, Positional Variation	1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Nc6 7. Nf3 Qa5 8. Bd2 Nge7
C20	Barnes Opening: Walkerling	1. f3 e5 2. e4 Nf6 3. Bc4
C20	Bongcloud Attack	1. e4 e5 2. Ke2
C20	Center Game	1. e4 e5 2. d4
C20	English Opening: The Whale	1. e4 e5 2. c4
C20	King's Pawn Game	1. e4 e5
C20	King's Pawn Game: Alapin Opening	1. e4 e5 2. Ne2
C20	King's Pawn Game: Bavarian Gambit	1. e4 e5 2. c4 d5
C20	King's Pawn Game: Beyer Gambit	1. e4 e5 2. d4 d5
C20	King's Pawn Game: Clam Variation, King's Gambit Reversed	1. e4 e5 2. d3 f5
C20	King's Pawn Game: Clam Variation, Radisch Gambit	1. e4 e5 2. d3 Nf6 3. f4 Bc5
C20	King's Pawn Game: King's Head Opening	1. e4 e5 2. f3
C20	King's Pawn Game: King's Head Opening	1. e4 e5 2. f3 Nf6 3. Nc3
C20	King's Pawn Game: Leonardis Variation	1. e4 e5 2. d3
C20	King's Pawn Game: MacLeod Attack	1. e4 e5 2. c3
C20	King's Pawn Game: MacLeod Attack, Lasa Gambit	1. e4 e5 2. c3 f5
C20	King's Pawn Game: MacLeod Attack, Norwalde Gambit	1. e4 e5 2. c3 d5 3. Qh5 Bd6
C20	King's Pawn Game: Mengarini's Opening	1. e4 e5 2. a3
C20	King's Pawn Game: Napoleon Attack	1. e4 e5 2. Qf3
C20	King's Pawn Game: Philidor Gambit	1. e4 e5 2. d4 d6 3. dxe5 Bd7
C20	King's Pawn Game: Tortoise Opening	1. e4 e5 2. Bd3
C20	King's Pawn Game: Wayward Queen Attack	1. e4 e5 2. Qh5
C20	King's Pawn Game: Wayward Queen Attack, Kiddie Countergambit	1. e4 e5 2. Qh5 Nf6
C20	King's Pawn Game: Wayward Queen Attack, Mellon Gambit	1. e4 e5 2. Qh5 Nc6 3. Bc4 Nh6 4. d3 g6 5. Qf3 f6 6. Ne2 d5
C20	King's Pawn Game: Weber Gambit	1. e4 e5 2. d3 d5 3. exd5 c6 4. dxc6 Nxc6
C20	King's Pawn Opening	1. e4 e5 2. b3
C20	King's Pawn Opening: Speers	1. e4 e5 2. Qg4 Nf6 3. Qf5
C20	King's Pawn Opening: Van Hooydoon Gambit	1. e4 e5 2. Qe2 Nc6 3. c3 Nf6 4. Nf3 Bc5 5. d4 exd4 6. cxd4 Nxd4
C20	Portuguese Opening	1. e4 e5 2. Bb5
C20	Portuguese Opening: Miguel Gambit	1. e4 e5 2. Bb5 Bc5 3. b4
C20	Portuguese Opening: Portuguese Gambit	1. e4 e5 2. Bb5 Nf6 3. d4
C21	Center Game	1. e4 e5 2. d4 exd4 3. Qxd4
C21	Center Game Accepted	1. e4 e5 2. d4 exd4
C21	Center Game: Halasz-McDonnell Gambit	1. e4 e5 2. d4 exd4 3. f4
C21	Center Game: Halasz-McDonnell Gambit, Crocodile Variation	1. e4 e5 2. d4 exd4 3. f4 Bc5 4. Nf3 Nc6 5. c3
C21	Center Game: Kieseritzky Variation	1. e4 e5 2. d4 exd4 3. Nf3
C21	Center Game: Kieseritzky Variation	1. e4 e5 2. d4 exd4 3. Nf3 c5
C21	Center Game: Kieseritzky Variation	1. e4 e5 2. d4 exd4 3. Nf3 c5 4. Bc4
C21	Center Game: Lanc-Arnold Gambit	1. e4 e5 2. d4 exd4 3. Nf3 Bc5 4. c3
C21	Center Game: Lanc-Arnold Gambit, Schippler Gambit	1. e4 e5 2. d4 exd4 3. Nf3 Bc5 4. c3 dxc3 5. Bc4
C21	Center Game: Ross Gambit	1. e4 e5 2. d4 exd4 3. Bd3
C21	Center Game: von der Lasa Gambit	1. e4 e5 2. d4 exd4 3. Bc4
C21	Danish Gambit	1. e4 e5 2. d4 exd4 3. c3
C21	Danish Gambit Accepted	1. e4 e5 2. d4 exd4 3. c3 dxc3
C21	Danish Gambit Accepted: Chigorin Defense	1. e4 e5 2. d4 exd4 3. c3 dxc3 4. Bc4 cxb2 5. Bxb2 Qe7
C21	Danish Gambit Accepted: Classical Defense	1. e4 e5 2. d4 exd4 3. c3 dxc3 4. Bc4 cxb2 5. Bxb2 Nf6
C21	Danish Gambit Accepted: Copenhagen Defense	1. e4 e5 2. d4 exd4 3. c3 dxc3 4. Bc4 cxb2 5. Bxb2 Bb4+
C21	Danish Gambit Accepted: Schlechter Defense	1. e4 e5 2. d4 exd4 3. c3 dxc3 4. Bc4 cxb2 5. Bxb2 d5
C21	Danish Gambit Accepted: Svenonius Defense	1. e4 e5 2. d4 exd4 3. c3 Ne7
C21	Danish Gambit Declined: Sörensen Defense	1. e4 e5 2. d4 exd4 3. c3 d5
C22	Center Game: Berger Variation	1. e4 e5 2. d4 exd4 3. Qxd4 Nc6 4. Qe3 Nf6
C22	Center Game: Charousek Variation	1. e4 e5 2. d4 exd4 3. Qxd4 Nc6 4. Qe3 Bb4+ 5. c3 Be7
C22	Center Game: Hall Variation	1. e4 e5 2. d4 exd4 3. Qxd4 Nc6 4. Qc4
C22	Center Game: Kupreichik Variation	1. e4 e5 2. d4 exd4 3. Qxd4 Nc6 4. Qe3 Nf6 5. Nc3 Bb4 6. Bd2 O-O 7. O-O-O Re8 8. Bc4 d6 9. Nh3
C22	Center Game: Normal Variation	1. e4 e5 2. d4 exd4 3. Qxd4 Nc6
C22	Center Game: Paulsen Attack Variation	1. e4 e5 2. d4 exd4 3. Qxd4 Nc6 4. Qe3
C22	Center Game: l'Hermet Variation	1. e4 e5 2. d4 exd4 3. Qxd4 Nc6 4. Qe3 f5
C23	Bishop's Opening	1. e4 e5 2. Bc4
C23	Bishop's Opening: Anderssen Gambit	1. e4 e5 2. Bc4 b5 3. Bxb5 c6
C23	Bishop's Opening: Boi Variation	1. e4 e5 2. Bc4 Bc5
C23	Bishop's Opening: Calabrese Countergambit	1. e4 e5 2. Bc4 f5
C23	Bishop's Opening: Calabrese Countergambit, Jaenisch Variation	1. e4 e5 2. Bc4 f5 3. d3
C23	Bishop's Opening: Four Pawns Gambit	1. e4 e5 2. Bc4 Bc5 3. b4 Bxb4 4. f4 exf4 5. Nf3 Be7 6. d4 Bh4+ 7. g3 fxg3 8. O-O gxh2+ 9. Kh1
C23	Bishop's Opening: Khan Gambit	1. e4 e5 2. Bc4 d5
C23	Bishop's Opening: Lewis Countergambit	1. e4 e5 2. Bc4 Bc5 3. c3 d5
C23	Bishop's Opening: Lewis Countergambit	1. e4 e5 2. Bc4 Bc5 3. c3 d5 4. Bxd5 Nf6
C23	Bishop's Opening: Lewis Countergambit, Walker Variation	1. e4 e5 2. Bc4 Bc5 3. c3 d5 4. Bxd5 Nf6 5. d4
C23	Bishop's Opening: Lewis Gambit	1. e4 e5 2. Bc4 Bc5 3. d4
C23	Bishop's Opening: Lisitsyn Variation	1. e4 e5 2. Bc4 c6 3. d4 d5 4. exd5 cxd5 5. Bb5+ Bd7 6. Bxd7+ Nxd7 7. dxe5 Nxe5 8. Ne2
C23	Bishop's Opening: Lopez Gambit	1. e4 e5 2. Bc4 Bc5 3. Qe2 Nc6 4. c3 Nf6 5. f4
C23	Bishop's Opening: Lopez Variation	1. e4 e5 2. Bc4 Bc5 3. Qe2
C23	Bishop's Opening: Lopez Variation, Lopez Gambit	1. e4 e5 2. Bc4 Bc5 3. Qe2 Nf6 4. f4
C23	Bishop's Opening: McDonnell Gambit	1. e4 e5 2. Bc4 Bc5 3. b4
C23	Bishop's Opening: McDonnell Gambit, La Bourdonnais-Denker Gambit	1. e4 e5 2. Bc4 Bc5 3. b4 Bxb4 4. c3
C23	Bishop's Opening: McDonnell Gambit, McDonnell Double Gambit	1. e4 e5 2. Bc4 Bc5 3. b4 Bxb4 4. f4
C23	Bishop's Opening: Philidor Counterattack	1. e4 e5 2. Bc4 c6
C23	Bishop's Opening: Philidor Variation	1. e4 e5 2. Bc4 Bc5 3. c3
C23	Bishop's Opening: Pratt Variation	1. e4 e5 2. Bc4 Bc5 3. c3 Nf6 4. d4 exd4 5. e5 d5 6. exf6 dxc4 7. Qh5 O-O
C23	Bishop's Opening: Stein Gambit	1. e4 e5 2. Bc4 Bc5 3. f4
C23	Bishop's Opening: Thorold Gambit	1. e4 e5 2. Bc4 b5 3. Bxb5 f5
C23	Bishop's Opening: del Rio Variation	1. e4 e5 2. Bc4 Bc5 3. c3 Qg5
C24	Bishop's Opening: Berlin Defense	1. e4 e5 2. Bc4 Nf6
C24	Bishop's Opening: Berlin Defense, Greco Gambit	1. e4 e5 2. Bc4 Nf6 3. f4
C24	Bishop's Opening: Kitchener Folly	1. e4 e5 2. Bc4 Nf6 3. d3 Be7 4. Nf3 O-O
C24	Bishop's Opening: Krejcik Gambit	1. e4 e5 2. Bc4 Nf6 3. f3 Bc5 4. Ne2 Nc6 5. b4
C24	Bishop's Opening: Pachman Gambit	1. e4 e5 2. Bc4 Nf6 3. Ne2 Nxe4 4. Nec3
C24	Bishop's Opening: Ponziani Gambit	1. e4 e5 2. Bc4 Nf6 3. d4
C24	Bishop's Opening: Urusov Gambit, Panov Variation	1. e4 e5 2. Bc4 Nf6 3. d4 exd4 4. Nf3 d5 5. exd5 Bb4+ 6. c3 Qe7+
C24	Bishop's Opening: Vienna Hybrid	1. e4 e5 2. Bc4 Nf6 3. d3 Nc6 4. Nc3
C24	Bishop's Opening: Warsaw Gambit	1. e4 e5 2. Bc4 Nf6 3. d4 exd4 4. c3
C25	Vienna Gambit, with Max Lange Defense	1. e4 e5 2. Nc3 Nc6 3. f4
C25	Vienna Gambit, with Max Lange Defense: Cunningham Defense	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. Nf3 Be7
C25	Vienna Gambit, with Max Lange Defense: Hamppe-Allgaier Gambit	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. Nf3 g5 5. h4 g4 6. Ng5
C25	Vienna Gambit, with Max Lange Defense: Hamppe-Allgaier Gambit, Alapin Variation	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. Nf3 g5 5. h4 g4 6. Ng5 d6
C25	Vienna Gambit, with Max Lange Defense: Hamppe-Allgaier Gambit, Thorold Variation	1. e4 e5 2. f4 exf4 3. Nf3 Nc6 4. Nc3 g5 5. h4 g4 6. Ng5 h6 7. Nxf7 Kxf7 8. d4
C25	Vienna Gambit, with Max Lange Defense: Hamppe-Muzio Gambit	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. Nf3 g5 5. Bc4 g4 6. O-O gxf3
C25	Vienna Gambit, with Max Lange Defense: Knight Variation	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. Nf3
C25	Vienna Gambit, with Max Lange Defense: Pierce Gambit	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. Nf3 g5 5. d4
C25	Vienna Gambit, with Max Lange Defense: Quelle Gambit	1. e4 e5 2. Nc3 Nc6 3. f4 Bc5 4. fxe5 d6
C25	Vienna Gambit, with Max Lange Defense: Steinitz Gambit	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. d4
C25	Vienna Gambit, with Max Lange Defense: Steinitz Gambit, Fraser-Minckwitz Defense	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. d4 Qh4+ 5. Ke2 b6
C25	Vienna Gambit, with Max Lange Defense: Steinitz Gambit, Main Line	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. d4 Qh4+ 5. Ke2
C25	Vienna Gambit, with Max Lange Defense: Steinitz Gambit, Paulsen Defense	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. d4 Qh4+ 5. Ke2 d6
C25	Vienna Gambit, with Max Lange Defense: Steinitz Gambit, Sörensen Defense	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. d4 Qh4+ 5. Ke2 g5
C25	Vienna Gambit, with Max Lange Defense: Steinitz Gambit, Zukertort Defense	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. d4 Qh4+ 5. Ke2 d5
C25	Vienna Game	1. e4 e5 2. Nc3
C25	Vienna Game: Anderssen Defense	1. e4 e5 2. Nc3 Bc5
C25	Vienna Game: Fyfe Gambit	1. e4 e5 2. Nc3 Nc6 3. d4
C25	Vienna Game: Giraffe Attack	1. e4 e5 2. Nc3 Bc5 3. Qg4
C25	Vienna Game: Hamppe-Meitner Variation	1. e4 e5 2. Nc3 Bc5 3. Na4
C25	Vienna Game: Hamppe-Muzio Gambit	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. Nf3 g5 5. Bc4 g4 6. O-O
C25	Vienna Game: Hamppe-Muzio, Dubois Variation	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. Nf3 g5 5. Bc4 g4 6. O-O gxf3 7. Qxf3 Ne5 8. Qxf4 Qf6
C25	Vienna Game: Max Lange Defense	1. e4 e5 2. Nc3 Nc6
C25	Vienna Game: Omaha Gambit	1. e4 e5 2. Nc3 d6 3. f4
C25	Vienna Game: Paulsen Variation	1. e4 e5 2. Nc3 Nc6 3. g3
C25	Vienna Game: Paulsen Variation	1. e4 e5 2. Nc3 Nc6 3. g3 Nf6 4. Bg2 Bc5 5. Nge2 d5
C25	Vienna Game: Paulsen Variation, Mariotti Gambit	1. e4 e5 2. Nc3 Nc6 3. g3 Bc5 4. Bg2 h5 5. Nf3 h4
C25	Vienna Game: Philidor Countergambit	1. e4 e5 2. Nc3 Nc6 3. d4 f5
C25	Vienna Game: Pierce Gambit, Rushmere Attack	1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. Nf3 g5 5. d4 g4 6. Bc4 gxf3 7. O-O d5 8. exd5 Bg4 9. dxc6
C25	Vienna Game: Stanley Variation, Meitner-Mieses Gambit	1. e4 e5 2. Nc3 Nc6 3. Bc4 Bc5 4. Qg4 Qf6 5. Nd5
C25	Vienna Game: Zhuravlev Countergambit	1. e4 e5 2. Nc3 Bb4 3. Qg4 Nf6
C26	Bishop's Opening: Horwitz Gambit	1. e4 e5 2. Bc4 Nf6 3. Nc3 b5
C26	Bishop's Opening: Vienna Hybrid, Spielmann Attack	1. e4 e5 2. Nc3 Nf6 3. Bc4 Bc5 4. d3
C26	Vienna Game: Falkbeer Variation	1. e4 e5 2. Nc3 Nf6
C26	Vienna Game: Mengarini Variation	1. e4 e5 2. Nc3 Nf6 3. a3
C26	Vienna Game: Mieses Variation	1. e4 e5 2. Nc3 Nf6 3. g3
C26	Vienna Game: Mieses Variation, Erben Gambit	1. e4 e5 2. Nc3 Nf6 3. g3 d5 4. exd5 c6
C26	Vienna Game: Paulsen Variation, Pollock Gambit	1. e4 e5 2. Nc3 Nf6 3. g3 Bc5 4. Bg2 Nc6 5. Nge2 d5 6. exd5
C26	Vienna Game: Stanley Variation	1. e4 e5 2. Nc3 Nf6 3. Bc4
C26	Vienna Game: Stanley Variation, Eifel Gambit	1. e4 e5 2. Nc3 Nf6 3. Bc4 Bc5 4. Nge2 b5
C26	Vienna Game: Stanley Variation, Reversed Spanish	1. e4 e5 2. Nc3 Nf6 3. Bc4 Bb4
C27	Bishop's Opening: Boden-Kieseritzky Gambit	1. e4 e5 2. Nf3 Nf6 3. Bc4 Nxe4 4. Nc3
C27	Bishop's Opening: Boden-Kieseritzky Gambit, Lichtenhein Defense	1. e4 e5 2. Nf3 Nf6 3. Bc4 Nxe4 4. Nc3 d5
C27	Vienna Game: Adams' Gambit	1. e4 e5 2. Nc3 Nf6 3. Bc4 Nxe4 4. Qh5 Nd6 5. Bb3 Nc6 6. d4
C27	Vienna Game: Frankenstein-Dracula Variation	1. e4 e5 2. Nc3 Nf6 3. Bc4 Nxe4
C27	Vienna Game: Stanley Variation, Alekhine Variation	1. e4 e5 2. Nc3 Nf6 3. Bc4 Nxe4 4. Qh5 Nd6 5. Bb3 Be7 6. Nf3 Nc6 7. Nxe5
C27	Vienna Game: Stanley Variation, Frankenstein-Dracula Variation	1. e4 e5 2. Nc3 Nf6 3. Bc4 Nxe4 4. Qh5 Nd6 5. Bb3 Nc6 6. Nb5 g6 7. Qf3 f5 8. Qd5 Qe7 9. Nxc7+ Kd8 10. Nxa8 b6
C27	Vienna Game: Stanley Variation, Monster Declined	1. e4 e5 2. Nc3 Nf6 3. Bc4 Nxe4 4. Qh5 Nd6 5. Bb3 Be7
C28	Bishop's Opening: Vienna Hybrid, Hromádka Variation	1. e4 e5 2. Nc3 Nc6 3. Bc4 Nf6 4. d3 Bb4 5. Ne2
C28	Vienna Game: Stanley Variation, Bronstein Gambit	1. e4 e5 2. Nc3 Nc6 3. Bc4 Nf6 4. f4 Nxe4 5. Nf3
C28	Vienna Game: Stanley Variation, Three Knights Variation	1. e4 e5 2. Nc3 Nc6 3. Bc4 Nf6
C29	Vienna Game: Heyde Variation	1. e4 e5 2. Nc3 Nf6 3. f4 d5 4. fxe5 Nxe4 5. Qf3 f5 6. d4
C29	Vienna Game: Vienna Gambit	1. e4 e5 2. Nc3 Nf6 3. f4
C29	Vienna Game: Vienna Gambit, Bardeleben Variation	1. e4 e5 2. Nc3 Nf6 3. f4 d5 4. fxe5 Nxe4 5. Qf3 f5
C29	Vienna Game: Vienna Gambit, Breyer Variation	1. e4 e5 2. Nc3 Nf6 3. f4 d5 4. fxe5 Nxe4 5. Nf3 Be7
C29	Vienna Game: Vienna Gambit, Kaufmann Variation	1. e4 e5 2. Nc3 Nf6 3. f4 d5 4. fxe5 Nxe4 5. Nf3 Bg4 6. Qe2
C29	Vienna Game: Vienna Gambit, Main Line	1. e4 e5 2. Nc3 Nf6 3. f4 d5
C29	Vienna Game: Vienna Gambit, Modern Variation	1. e4 e5 2. Nc3 Nf6 3. f4 d5 4. fxe5 Nxe4 5. d3
C29	Vienna Game: Vienna Gambit, Paulsen Attack	1. e4 e5 2. Nc3 Nf6 3. f4 d5 4. fxe5 Nxe4 5. Qf3
C29	Vienna Game: Vienna Gambit, Steinitz Variation	1. e4 e5 2. Nc3 Nf6 3. f4 d5 4. d3
C29	Vienna Game: Vienna Gambit, Wurzburger Trap	1. e4 e5 2. Nc3 Nf6 3. f4 d5 4. fxe5 Nxe4 5. d3 Qh4+ 6. g3 Nxg3 7. Nf3 Qh5 8. Nxd5
C30	King's Gambit	1. e4 e5 2. f4
C30	King's Gambit Declined: Classical Variation	1. e4 e5 2. f4 Bc5
C30	King's Gambit Declined: Classical Variation	1. e4 e5 2. f4 Bc5 3. Nf3 d6 4. c3
C30	King's Gambit Declined: Classical Variation, Euwe Attack	1. e4 e5 2. f4 Bc5 3. Nf3 d6 4. c3 Bg4 5. fxe5 dxe5 6. Qa4+
C30	King's Gambit Declined: Classical Variation, Rotlewi Countergambit	1. e4 e5 2. f4 Bc5 3. Nf3 d6 4. b4
C30	King's Gambit Declined: Classical Variation, Rubinstein Countergambit	1. e4 e5 2. f4 Bc5 3. Nf3 d6 4. c3 f5
C30	King's Gambit Declined: Classical Variation, Walthoffen Attack	1. e4 e5 2. f4 Bc5 3. Qh5
C30	King's Gambit Declined: Classical, Hanham Variation	1. e4 e5 2. f4 Bc5 3. Nf3 d6 4. Nc3 Nd7
C30	King's Gambit Declined: Classical, Réti Variation	1. e4 e5 2. f4 Bc5 3. Nf3 d6 4. c3 f5 5. fxe5 dxe5 6. d4 exd4 7. Bc4
C30	King's Gambit Declined: Classical, Soldatenkov Variation	1. e4 e5 2. f4 Bc5 3. Nf3 d6 4. fxe5
C30	King's Gambit Declined: Classical, Svenonius Variation	1. e4 e5 2. Bc4 Nc6 3. Nc3 Nf6 4. d3 Bc5 5. f4 d6 6. Nf3 Bg4 7. h3 Bxf3 8. Qxf3 exf4
C30	King's Gambit Declined: Hobbs-Zilbermints Gambit	1. e4 e5 2. f4 Nc6 3. Nf3 g5 4. fxg5 h6
C30	King's Gambit Declined: Keene Defense	1. e4 e5 2. f4 Qh4+ 3. g3 Qe7
C30	King's Gambit Declined: Keene's Defense	1. e4 e5 2. f4 Qh4+
C30	King's Gambit Declined: Keene's Defense	1. e4 e5 2. f4 Qh4+ 3. g3
C30	King's Gambit Declined: Mafia Defense	1. e4 c5 2. f4 e5
C30	King's Gambit Declined: Miles Defense	1. e4 e5 2. f4 Nc6 3. Nf3 f5
C30	King's Gambit Declined: Norwalde Variation	1. e4 e5 2. f4 Qf6
C30	King's Gambit Declined: Norwalde Variation, Bücker Gambit	1. e4 e5 2. f4 Qf6 3. Nc3 Qxf4 4. Nf3 Bb4 5. Bc4
C30	King's Gambit Declined: Norwalde Variation, Schubert Variation	1. e4 e5 2. f4 Qf6 3. Nc3 Qxf4 4. d4
C30	King's Gambit Declined: Panteldakis Countergambit	1. e4 e5 2. f4 f5
C30	King's Gambit Declined: Panteldakis Countergambit, Greco Variation	1. e4 e5 2. f4 f5 3. exf5 Qh4+
C30	King's Gambit Declined: Panteldakis Countergambit, Pawn Sacrifice Line	1. e4 e5 2. f4 f5 3. exf5 exf4 4. Qh5+ g6 5. fxg6 Qe7+ 6. Kd1
C30	King's Gambit Declined: Panteldakis Countergambit, Schiller's Defense	1. e4 e5 2. f4 f5 3. exf5 Bc5
C30	King's Gambit Declined: Panteldakis Countergambit, Shirazi Line	1. e4 e5 2. f4 f5 3. exf5 exf4 4. Qh5+ Ke7
C30	King's Gambit Declined: Panteldakis Countergambit, Symmetrical Variation	1. e4 e5 2. f4 f5 3. exf5 exf4 4. Nf3 d5 5. d4 Bd6 6. Bd3
C30	King's Gambit Declined: Petrov's Defense	1. e4 e5 2. f4 Nf6
C30	King's Gambit Declined: Queen's Knight Defense	1. e4 e5 2. f4 Nc6
C30	King's Gambit Declined: Senechaud Countergambit	1. e4 e5 2. f4 Bc5 3. Nf3 g5
C30	King's Gambit Declined: Soller-Zilbermints Gambit	1. e4 e5 2. f4 f6 3. fxe5 Nc6
C30	King's Gambit Declined: Zilbermints Double Countergambit	1. e4 e5 2. f4 g5
C30	King's Gambit Declined: Zilbermints Double Gambit	1. e4 e5 2. f4 Nc6 3. Nf3 g5
C31	King's Gambit Declined: Falkbeer Countergambit	1. e4 e5 2. f4 d5
C31	King's Gambit Declined: Falkbeer Countergambit Accepted	1. e4 e5 2. f4 d5 3. exd5
C31	King's Gambit Declined: Falkbeer Countergambit, Anderssen Attack	1. e4 e5 2. f4 d5 3. exd5 e4 4. Bb5+
C31	King's Gambit Declined: Falkbeer Countergambit, Blackburne Attack	1. e4 e5 2. f4 d5 3. Nf3
C31	King's Gambit Declined: Falkbeer Countergambit, Charousek Gambit	1. e4 e5 2. f4 d5 3. exd5 e4 4. d3
C31	King's Gambit Declined: Falkbeer Countergambit, Charousek Gambit, Morphy Defense	1. e4 e5 2. Nc3 Nf6 3. f4 d5 4. exd5 e4 5. d3 Bb4 6. Bd2 e3
C31	King's Gambit Declined: Falkbeer Countergambit, Hinrichsen Gambit	1. e4 e5 2. f4 d5 3. d4
C31	King's Gambit Declined: Falkbeer Countergambit, Miles Gambit	1. e4 e5 2. f4 d5 3. exd5 Bc5
C31	King's Gambit Declined: Falkbeer Countergambit, Milner-Barry Variation	1. e4 e5 2. f4 d5 3. Nc3
C31	King's Gambit Declined: Falkbeer Countergambit, Modern Transfer	1. e4 e5 2. f4 d5 3. exd5 exf4
C31	King's Gambit Declined: Falkbeer Countergambit, Nimzowitsch-Marshall Countergambit	1. e4 e5 2. f4 d5 3. exd5 c6
C31	King's Gambit Declined: Falkbeer Countergambit, Pickler Gambit	1. e4 e5 2. f4 d5 3. exd5 c6 4. dxc6 Bc5
C31	King's Gambit Declined: Falkbeer Countergambit, Rubinstein Variation	1. e4 e5 2. f4 d5 3. exd5 e4 4. Nc3 Nf6 5. Qe2
C31	King's Gambit Declined: Falkbeer Countergambit, Staunton Line	1. e4 e5 2. f4 d5 3. exd5 e4
C31	Van Geet Opening: Grünfeld Defense, Steiner Gambit	1. e4 e5 2. f4 d5 3. Nc3 dxe4 4. Nxe4
C32	King's Gambit Declined: Falkbeer Countergambit, Alapin Variation	1. e4 e5 2. f4 d5 3. exd5 e4 4. d3 Nf6 5. dxe4 Nxe4 6. Nf3 Bc5 7. Qe2 Bf2+ 8. Kd1 Qxd5+ 9. Nfd2
C32	King's Gambit Declined: Falkbeer Countergambit, Charousek Gambit	1. e4 e5 2. f4 d5 3. exd5 e4 4. d3 Nf6 5. dxe4 Nxe4 6. Qe2
C32	King's Gambit Declined: Falkbeer Countergambit, Charousek Gambit Accepted	1. e4 e5 2. f4 d5 3. exd5 e4 4. d3 Nf6 5. dxe4
C32	King's Gambit Declined: Falkbeer Countergambit, Charousek Gambit, Keres Variation	1. e4 e5 2. f4 d5 3. exd5 e4 4. d3 Nf6 5. Nd2
C32	King's Gambit Declined: Falkbeer Countergambit, Charousek Gambit, Main Line	1. e4 e5 2. f4 d5 3. exd5 e4 4. d3 Nf6 5. dxe4 Nxe4 6. Nf3 Bc5 7. Qe2 Bf5
C32	King's Gambit Declined: Falkbeer Countergambit, Charousek Gambit, Old Line	1. e4 e5 2. f4 d5 3. exd5 e4 4. d3 Nf6 5. Qe2
C32	King's Gambit Declined: Falkbeer Countergambit, Charousek Variation	1. e4 e5 2. f4 d5 3. exd5 e4 4. d3 Nf6 5. dxe4 Nxe4 6. Qe2 Qxd5 7. Nd2 f5 8. g4
C32	King's Gambit Declined: Falkbeer Countergambit, Tarrasch Variation	1. e4 e5 2. f4 d5 3. exd5 e4 4. d3 Nf6 5. dxe4 Nxe4 6. Nf3 Bc5 7. Qe2 Bf5 8. g4 O-O
C33	King's Gambit Accepted	1. e4 e5 2. f4 exf4
C33	King's Gambit Accepted: Basman Gambit	1. e4 e5 2. f4 exf4 3. Qe2
C33	King's Gambit Accepted: Bishop's Gambit	1. e4 e5 2. f4 exf4 3. Bc4
C33	King's Gambit Accepted: Bishop's Gambit, Anderssen Defense	1. e4 e5 2. f4 exf4 3. Bc4 g5
C33	King's Gambit Accepted: Bishop's Gambit, Anderssen Variation	1. e4 e5 2. f4 exf4 3. Bc4 d5 4. Bxd5 c6
C33	King's Gambit Accepted: Bishop's Gambit, Bledow Countergambit	1. e4 e5 2. f4 exf4 3. Bc4 d5 4. Bxd5 Nf6
C33	King's Gambit Accepted: Bishop's Gambit, Bledow Variation	1. e4 e5 2. f4 exf4 3. Bc4 d5
C33	King's Gambit Accepted: Bishop's Gambit, Boden Variation	1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 Nc6
C33	King's Gambit Accepted: Bishop's Gambit, Bogoljubow Defense	1. e4 e5 2. f4 exf4 3. Bc4 Nf6 4. Nc3 c6
C33	King's Gambit Accepted: Bishop's Gambit, Bogoljubow Variation	1. e4 e5 2. f4 exf4 3. Bc4 Nf6 4. Nc3
C33	King's Gambit Accepted: Bishop's Gambit, Boren-Svenonius Variation	1. e4 e5 2. f4 exf4 3. Bc4 d5 4. Bxd5 Qh4+ 5. Kf1 Bd6
C33	King's Gambit Accepted: Bishop's Gambit, Bryan Countergambit	1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5
C33	King's Gambit Accepted: Bishop's Gambit, Chigorin's Attack	1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 d5 5. Bxd5 g5 6. g3
C33	King's Gambit Accepted: Bishop's Gambit, Classical Defense	1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 Ne7 5. Nc3 g5 6. d4 Bg7
C33	King's Gambit Accepted: Bishop's Gambit, Classical Defense, Cozio Attack	1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 g5 5. Qf3
C33	King's Gambit Accepted: Bishop's Gambit, Cozio Defense	1. e4 e5 2. f4 exf4 3. Bc4 Nf6
C33	King's Gambit Accepted: Bishop's Gambit, Cozio Variation	1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 d6
C33	King's Gambit Accepted: Bishop's Gambit, First Jaenisch Variation	1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 Nf6
C33	King's Gambit Accepted: Bishop's Gambit, Fraser Variation	1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 g5 5. Nc3 Bg7 6. g3 fxg3 7. Qf3
C33	King's Gambit Accepted: Bishop's Gambit, Gianutio Gambit	1. e4 e5 2. f4 exf4 3. Bc4 f5
C33	King's Gambit Accepted: Bishop's Gambit, Greco Variation	1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 Bc5
C33	King's Gambit Accepted: Bishop's Gambit, Grimm Attack	1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 g5 5. Nc3 Bg7 6. d4 d6 7. e5
C33	King's Gambit Accepted: Bishop's Gambit, Kieseritzky Gambit	1. e4 e5 2. f4 exf4 3. Bc4 b5
C33	King's Gambit Accepted: Bishop's Gambit, Lopez Defense	1. e4 e5 2. f4 exf4 3. Bc4 c6
C33	King's Gambit Accepted: Bishop's Gambit, Lopez Variation	1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 g5
C33	King's Gambit Accepted: Bishop's Gambit, Maurian Defense	1. e4 e5 2. f4 exf4 3. Bc4 Nc6
C33	King's Gambit Accepted: Bishop's Gambit, McDonnell Attack	1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 g5 5. Nc3 Bg7 6. d4 Ne7 7. g3
C33	King's Gambit Accepted: Bishop's Gambit, McDonnell Attack	1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 g5 5. Nc3 Bg7 6. g3
C33	King's Gambit Accepted: Bishop's Gambit, Paulsen Attack	1. e4 e5 2. f4 exf4 3. Bc4 Nf6 4. Nc3 Bb4 5. e5
C33	King's Gambit Accepted: Bishop's Gambit, Steinitz Defense	1. e4 e5 2. f4 exf4 3. Bc4 Ne7
C33	King's Gambit Accepted: Breyer Gambit	1. e4 e5 2. f4 exf4 3. Qf3
C33	King's Gambit Accepted: Carrera Gambit	1. e4 e5 2. f4 exf4 3. Qh5
C33	King's Gambit Accepted: Dodo Variation	1. e4 e5 2. f4 exf4 3. Qg4
C33	King's Gambit Accepted: Eisenberg Variation	1. e4 e5 2. f4 exf4 3. Nh3
C33	King's Gambit Accepted: Gaga Gambit	1. e4 e5 2. f4 exf4 3. g3
C33	King's Gambit Accepted: Lopez-Gianutio Countergambit, Hein Variation	1. e4 e5 2. f4 exf4 3. Bc4 f5 4. Qe2 Qh4+ 5. Kd1 fxe4 6. Nc3 Kd8
C33	King's Gambit Accepted: Mason-Keres Gambit	1. e4 e5 2. f4 exf4 3. Nc3
C33	King's Gambit Accepted: Orsini Gambit	1. e4 e5 2. f4 exf4 3. b3
C33	King's Gambit Accepted: Paris Gambit	1. e4 e5 2. f4 exf4 3. Ne2
C33	King's Gambit Accepted: Schurig Gambit, with Bb5	1. e4 e5 2. f4 exf4 3. Bb5
C33	King's Gambit Accepted: Schurig Gambit, with Bd3	1. e4 e5 2. f4 exf4 3. Bd3
C33	King's Gambit Accepted: Stamma Gambit	1. e4 e5 2. f4 exf4 3. h4
C33	King's Gambit Accepted: Tartakower Gambit	1. e4 e5 2. f4 exf4 3. Be2
C33	King's Gambit Accepted: Tartakower Gambit, Weiss Defense	1. e4 e5 2. f4 exf4 3. Be2 f5 4. exf5 d6
C33	King's Gambit Accepted: Tumbleweed	1. e4 e5 2. f4 exf4 3. Kf2
C33	King's Gambit Accepted: Villemson Gambit	1. e4 e5 2. f4 exf4 3. d4
C34	King's Gambit Accepted: Becker Defense	1. e4 e5 2. f4 exf4 3. Nf3 h6
C34	King's Gambit Accepted: Bonsch-Osmolovsky Variation	1. e4 e5 2. f4 exf4 3. Nf3 Ne7
C34	King's Gambit Accepted: Fischer Defense	1. e4 e5 2. f4 exf4 3. Nf3 d6
C34	King's Gambit Accepted: Fischer Defense, Schulder Gambit	1. e4 e5 2. f4 exf4 3. Nf3 d6 4. b4
C34	King's Gambit Accepted: Fischer Defense, Spanish Variation	1. e4 e5 2. f4 exf4 3. Nf3 d6 4. d4 Nf6 5. Bd3
C34	King's Gambit Accepted: Gianutio Countergambit	1. e4 e5 2. f4 exf4 3. Nf3 f5
C34	King's Gambit Accepted: Greco Gambit	1. e4 e5 2. f4 exf4 3. Nf3 d6 4. Bc4 h6 5. d4 g5 6. h4 Bg7
C34	King's Gambit Accepted: King's Knight's Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5
C34	King's Gambit Accepted: King's Knight's Gambit	1. e4 e5 2. f4 exf4 3. Nf3
C34	King's Gambit Accepted: MacLeod Defense	1. e4 e5 2. f4 exf4 3. Nf3 Nc6
C34	King's Gambit Accepted: Schallopp Defense	1. e4 e5 2. f4 exf4 3. Nf3 Nf6
C34	King's Gambit Accepted: Schallopp Defense, Tashkent Attack	1. e4 e5 2. f4 exf4 3. Nf3 Nf6 4. e5 Nh5 5. g4
C34	King's Gambit Accepted: Wagenbach Defense	1. e4 e5 2. f4 exf4 3. Nf3 h5
C35	King's Gambit Accepted: Cunningham Defense	1. e4 e5 2. f4 exf4 3. Nf3 Be7
C35	King's Gambit Accepted: Cunningham Defense, Bertin Gambit	1. e4 e5 2. f4 exf4 3. Nf3 Be7 4. Bc4 Bh4+ 5. g3
C35	King's Gambit Accepted: Cunningham Defense, Bertin Gambit	1. e4 e5 2. f4 exf4 3. Nf3 Be7 4. Bc4 Bh4+ 5. g3 fxg3 6. O-O gxh2+ 7. Kh1
C35	King's Gambit Accepted: Cunningham Defense, McCormick Defense	1. e4 e5 2. f4 exf4 3. Nf3 Be7 4. Bc4 Nf6
C36	King's Gambit Accepted: Abbazia Defense	1. e4 e5 2. f4 exf4 3. Nf3 d5 4. exd5 Nf6
C36	King's Gambit Accepted: Abbazia Defense, Main Line	1. e4 e5 2. f4 exf4 3. Nf3 d5 4. exd5 Nf6 5. Bb5+ c6 6. dxc6 bxc6 7. Bc4 Nd5
C36	King's Gambit Accepted: Modern Defense	1. e4 e5 2. f4 exf4 3. Nf3 d5
C36	King's Gambit Accepted: Modern Defense	1. e4 e5 2. f4 exf4 3. Nf3 d5 4. exd5
C37	King's Gambit Accepted: Australian Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. h4
C37	King's Gambit Accepted: Blachly Gambit	1. e4 e5 2. f4 exf4 3. Nf3 Nc6 4. Bc4 g5
C37	King's Gambit Accepted: Double Muzio Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. O-O gxf3 6. Qxf3 Qf6 7. e5 Qxe5 8. Bxf7+
C37	King's Gambit Accepted: Double Muzio Gambit, Baldwin Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. O-O gxf3 6. Qxf3 Qf6 7. Nc3 Qd4+ 8. Kh1 Qxc4 9. Nd5
C37	King's Gambit Accepted: Double Muzio Gambit, Bello Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. O-O gxf3 6. Qxf3 Qf6 7. Nc3
C37	King's Gambit Accepted: Double Muzio Gambit, Paulsen Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. O-O gxf3 6. Qxf3 Qf6 7. e5 Qxe5 8. d3 Bh6 9. Nc3 Ne7 10. Bd2 Nbc6 11. Rae1
C37	King's Gambit Accepted: Double Muzio Gambit, Young Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. O-O gxf3 6. Qxf3 Qf6 7. Bxf7+ Kxf7 8. d4 Qxd4+ 9. Be3 Qf6 10. Nc3 fxe3
C37	King's Gambit Accepted: Ghulam-Kassim Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. d4
C37	King's Gambit Accepted: Ghulam-Kassim Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. d4 gxf3 6. Qxf3
C37	King's Gambit Accepted: King's Knight's Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4
C37	King's Gambit Accepted: Kotov Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. d4 gxf3 6. Bxf4
C37	King's Gambit Accepted: Lolli Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. Bxf7+
C37	King's Gambit Accepted: Lolli Gambit, Young Variation	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. Bxf7+ Kxf7 6. O-O gxf3 7. Qxf3 Qf6 8. d4 Qxd4+ 9. Be3 Qf6 10. Nc3
C37	King's Gambit Accepted: McDonnell Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. Nc3
C37	King's Gambit Accepted: Middleton Countergambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 d6 5. O-O Bg4 6. h3 h5 7. hxg4 hxg4
C37	King's Gambit Accepted: Muzio Gambit Accepted, From's Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. O-O gxf3 6. Qxf3 Qe7
C37	King's Gambit Accepted: Muzio Gambit, Brentano Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. O-O d5
C37	King's Gambit Accepted: Muzio Gambit, Holloway Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. O-O gxf3 6. Qxf3 Nc6
C37	King's Gambit Accepted: Muzio Gambit, Kling and Horwitz Counterattack	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. O-O Qe7
C37	King's Gambit Accepted: Muzio Gambit, Sarratt Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. O-O gxf3 6. Qxf3 Qf6
C37	King's Gambit Accepted: Muzio Gambit, Wild Muzio Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. O-O
C37	King's Gambit Accepted: Quaade Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Nc3
C37	King's Gambit Accepted: Rosentreter Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. d4
C37	King's Gambit Accepted: Rosentreter Gambit, Bird Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. d4 g4 5. Ne5 Qh4+ 6. g3
C37	King's Gambit Accepted: Rosentreter Gambit, Sörensen Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. d4 g4 5. Nc3
C37	King's Gambit Accepted: Rosentreter Gambit, Testa Variation	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. d4 g4 5. Bxf4
C37	King's Gambit Accepted: Salvio Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. Ne5
C37	King's Gambit Accepted: Salvio Gambit, Anderssen Counterattack	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. Ne5 Qh4+ 6. Kf1 Nh6 7. d4 d6
C37	King's Gambit Accepted: Salvio Gambit, Cochrane Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. Ne5 Qh4+ 6. Kf1 f3
C37	King's Gambit Accepted: Salvio Gambit, Santa Maria Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. Ne5 Qh4+ 6. Kf1 Nf6
C37	King's Gambit Accepted: Salvio Gambit, Silberschmidt Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. Ne5 Qh4+ 6. Kf1 Nh6
C37	King's Gambit Accepted: Salvio Gambit, Viennese Variation	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. Ne5 Qh4+ 6. Kf1 Nc6
C37	King's Gambit Accepted: Silberschmidt Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. Ne5 Qh4+ 6. Kf1 Nh6 7. d4 f3
C37	King's Gambit Accepted: Sörensen Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. d4 g4 5. Ne5
C38	King's Gambit Accepted: Greco Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 Bg7 5. h4 h6 6. d4 d6 7. Nc3 c6 8. hxg5 hxg5 9. Rxh8 Bxh8 10. Ne5
C38	King's Gambit Accepted: Hanstein Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 Bg7 5. O-O
C38	King's Gambit Accepted: Mayet Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 Bg7 5. d4 d6 6. c3
C38	King's Gambit Accepted: Philidor Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 Bg7 5. h4
C38	King's Gambit Accepted: Philidor Gambit, Schultz Variation	1. e4 e5 2. f4 exf4 3. Nf3 h6 4. Bc4 d6 5. d4 g5 6. h4 Bg7 7. Qd3
C38	King's Gambit Accepted: Traditional Variation	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 Bg7
C39	King's Gambit Accepted: Allgaier Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ng5
C39	King's Gambit Accepted: Allgaier Gambit, Thorold Attack	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ng5 h6 6. Nxf7 Kxf7 7. d4
C39	King's Gambit Accepted: Allgaier Gambit, Urusov Attack	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ng5 h6 6. Nxf7 Kxf7 7. Bc4+
C39	King's Gambit Accepted: Allgaier, Blackburne Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ng5 h6 6. Nxf7 Kxf7 7. Nc3
C39	King's Gambit Accepted: Allgaier, Cook Variation	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ng5 h6 6. Nxf7 Kxf7 7. d4 d5 8. Bxf4 dxe4 9. Bc4+ Kg7 10. Be5+
C39	King's Gambit Accepted: Allgaier, Horny Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ng5 h6 6. Nxf7 Kxf7 7. Qxg4 Nf6 8. Qxf4 Bd6
C39	King's Gambit Accepted: Allgaier, Schlechter Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ng5 Nf6
C39	King's Gambit Accepted: Allgaier, Urusov Attack	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ng5 h6 6. Nxf7 Kxf7 7. Bc4+ d5 8. Bxd5+ Kg7 9. d4
C39	King's Gambit Accepted: Kieseritzky Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5
C39	King's Gambit Accepted: Kieseritzky Gambit, Anderssen Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nf6 6. Bc4 d5 7. exd5 Bd6
C39	King's Gambit Accepted: Kieseritzky Gambit, Anderssen-Cordel Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nf6 6. Bc4 d5 7. exd5 Bd6 8. d4 Nh5 9. Bxf4 Nxf4
C39	King's Gambit Accepted: Kieseritzky Gambit, Berlin Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nf6
C39	King's Gambit Accepted: Kieseritzky Gambit, Berlin Defense, Rubinstein Variation	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nf6 6. d4
C39	King's Gambit Accepted: Kieseritzky Gambit, Berlin Defense, de Riviere Variation	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nf6 6. Nxg4 d5
C39	King's Gambit Accepted: Kieseritzky Gambit, Brentano Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 d5
C39	King's Gambit Accepted: Kieseritzky Gambit, Brentano Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 d5 6. d4 Nf6 7. Bxf4
C39	King's Gambit Accepted: Kieseritzky Gambit, Brentano Defense, Caro Variation	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 d5 6. d4 Nf6 7. Bxf4 Nxe4 8. Nd2
C39	King's Gambit Accepted: Kieseritzky Gambit, Cotter Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ng5 h6 6. Nxf7
C39	King's Gambit Accepted: Kieseritzky Gambit, Kolisch Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 d6
C39	King's Gambit Accepted: Kieseritzky Gambit, Long Whip	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 h5
C39	King's Gambit Accepted: Kieseritzky Gambit, Neumann Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nc6
C39	King's Gambit Accepted: Kieseritzky Gambit, Paulsen Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Bg7
C39	King's Gambit Accepted: Kieseritzky Gambit, Paulsen Defense Deferred	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nf6 6. Bc4 d5 7. exd5 Bg7
C39	King's Gambit Accepted: Kieseritzky Gambit, Rice Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nf6 6. Bc4 d5 7. exd5 Bd6 8. O-O Bxe5
C39	King's Gambit Accepted: Kieseritzky Gambit, Rosenthal Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Qe7
C39	King's Gambit Accepted: Kieseritzky, Long Whip Defense, Jaenisch Variation	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 h5 6. Bc4 Rh7 7. d4 Bh6 8. Nc3
C39	King's Gambit Accepted: Kieseritzky, Polerio Defense	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Be7
C39	King's Gambit Accepted: Kieseritzky, Rice Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nf6 6. Bc4 d5 7. exd5 Bd6 8. O-O
C39	King's Gambit Accepted: Kieseritzky, Salvio Defense, Cozio Variation	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Qe7 6. d4 f5 7. Bc4
C39	King's Gambit Accepted: King's Knight's Gambit	1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4
C40	Elephant Gambit	1. e4 e5 2. Nf3 d5
C40	Elephant Gambit: Maróczy Gambit	1. e4 e5 2. Nf3 d5 3. exd5 Bd6
C40	Elephant Gambit: Paulsen Countergambit	1. e4 e5 2. Nf3 d5 3. exd5 e4
C40	Elephant Gambit: Wasp Variation	1. e4 e5 2. Nf3 d5 3. Nxe5 dxe4 4. Bc4 Qg5
C40	Gunderam Defense	1. e4 e5 2. Nf3 Qe7
C40	King's Knight Opening	1. e4 e5 2. Nf3
C40	King's Pawn Game: Busch-Gass Gambit	1. e4 e5 2. Nf3 Bc5
C40	King's Pawn Game: Busch-Gass Gambit, Chiodini Gambit	1. e4 e5 2. Nf3 Bc5 3. Nxe5 Nc6
C40	King's Pawn Game: Damiano Defense	1. e4 e5 2. Nf3 f6
C40	King's Pawn Game: Damiano Defense, Damiano Gambit	1. e4 e5 2. Nf3 f6 3. Nxe5 fxe5 4. Qh5+ g6 5. Qxe5+ Qe7 6. Qxh8
C40	King's Pawn Game: Damiano Defense, Damiano Gambit, Chigorin Gambit	1. e4 e5 2. Nf3 f6 3. Nxe5 Qe7 4. Nf3 d5
C40	King's Pawn Game: Gunderam Defense, Gunderam Gambit	1. e4 e5 2. Nf3 Qe7 3. Bc4 f5
C40	King's Pawn Game: Gunderam Gambit	1. e4 e5 2. Nf3 c6
C40	King's Pawn Game: La Bourdonnais Gambit	1. e4 e5 2. Nf3 Qf6 3. Bc4 Qg6 4. O-O
C40	King's Pawn Game: McConnell Defense	1. e4 e5 2. Nf3 Qf6
C40	Latvian Gambit	1. e4 e5 2. Nf3 f5
C40	Latvian Gambit Accepted	1. e4 e5 2. Nf3 f5 3. exf5
C40	Latvian Gambit Accepted: Bilguer Variation	1. e4 e5 2. Nf3 f5 3. Nxe5 Qf6 4. d4 d6 5. Nc4
C40	Latvian Gambit Accepted: Bronstein Attack	1. e4 e5 2. Nf3 f5 3. Nxe5 Qf6 4. d4 d6 5. Nc4 fxe4 6. Be2
C40	Latvian Gambit Accepted: Bronstein Gambit	1. e4 e5 2. Nf3 f5 3. Nxe5 Qf6 4. d4 d6 5. Nc4 fxe4 6. Qh5+ g6 7. Qe2
C40	Latvian Gambit Accepted: Foltys Variation	1. e4 e5 2. Nf3 f5 3. Nxe5 Qf6 4. Nc4 fxe4 5. d3
C40	Latvian Gambit Accepted: Foltys-Leonhardt Variation	1. e4 e5 2. Nf3 f5 3. Nxe5 Qf6 4. Nc4
C40	Latvian Gambit Accepted: Leonhardt Variation	1. e4 e5 2. Nf3 f5 3. Nxe5 Qf6 4. Nc4 fxe4 5. Nc3
C40	Latvian Gambit Accepted: Main Line	1. e4 e5 2. Nf3 f5 3. Nxe5 Qf6 4. d4
C40	Latvian Gambit Accepted: Nimzowitsch Attack	1. e4 e5 2. Nf3 f5 3. Nxe5 Qf6 4. d4 d6 5. Nc4 fxe4 6. Ne3
C40	Latvian Gambit: Behting Variation	1. e4 e5 2. Nf3 f5 3. Bc4 fxe4 4. Nxe5 Qg5 5. Nf7 Qxg2 6. Rf1 d5 7. Nxh8 Nf6
C40	Latvian Gambit: Corkscrew Countergambit	1. e4 e5 2. Nf3 f5 3. Bc4 fxe4 4. Nxe5 Nf6
C40	Latvian Gambit: Corkscrew Gambit	1. e4 e5 2. Nf3 f5 3. Nxe5 Nf6 4. Bc4 fxe4 5. Nf7 Qe7 6. Nxh8 d5
C40	Latvian Gambit: Diepstraten Countergambit	1. e4 e5 2. Nf3 f5 3. c4
C40	Latvian Gambit: Fraser Defense	1. e4 e5 2. Nf3 f5 3. Nxe5 Nc6
C40	Latvian Gambit: Greco Variation	1. e4 e5 2. Nf3 f5 3. Nxe5 Qe7
C40	Latvian Gambit: Lobster Gambit	1. e4 e5 2. Nf3 f5 3. g4
C40	Latvian Gambit: Mason Countergambit	1. e4 e5 2. Nf3 f5 3. d4
C40	Latvian Gambit: Mayet Attack	1. e4 e5 2. Nf3 f5 3. Bc4
C40	Latvian Gambit: Mayet Attack, Morgado Defense	1. e4 e5 2. Nf3 f5 3. Bc4 Nf6
C40	Latvian Gambit: Mayet Attack, Poisoned Pawn Variation	1. e4 e5 2. Nf3 f5 3. Bc4 fxe4 4. Nxe5 Qg5 5. d4 Qxg2
C40	Latvian Gambit: Mayet Attack, Polerio-Svedenborg Variation	1. e4 e5 2. Nf3 f5 3. Bc4 fxe4 4. Nxe5 d5
C40	Latvian Gambit: Mayet Attack, Strautins Gambit	1. e4 e5 2. Nf3 f5 3. Bc4 b5
C40	Latvian Gambit: Mlotkowski Variation	1. e4 e5 2. Nf3 f5 3. Nc3
C40	Latvian Gambit: Senechaud Gambit	1. e4 e5 2. Nf3 f5 3. b4
C41	Philidor Defense	1. e4 e5 2. Nf3 d6
C41	Philidor Defense	1. e4 e5 2. Nf3 d6 3. d4
C41	Philidor Defense	1. e4 e5 2. Nf3 d6 3. Bc4
C41	Philidor Defense	1. e4 e5 2. Nf3 d6 3. Bc4 Be7
C41	Philidor Defense: Albin-Blackburne Gambit	1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Nd7
C41	Philidor Defense: Berger Variation	1. e4 e5 2. Nf3 d6 3. d4 exd4 4. Nxd4 Nf6 5. Nc3 Be7 6. Be2 O-O 7. O-O c5 8. Nf3 Nc6 9. Bg5 Be6 10. Re1
C41	Philidor Defense: Bird Gambit	1. e4 e5 2. Nf3 d6 3. d4 exd4 4. c3
C41	Philidor Defense: Boden Variation	1. e4 e5 2. Nf3 d6 3. d4 exd4 4. Qxd4 Bd7
C41	Philidor Defense: Exchange Variation	1. e4 e5 2. Nf3 d6 3. d4 exd4
C41	Philidor Defense: Exchange Variation	1. e4 e5 2. Nf3 d6 3. d4 exd4 4. Nxd4
C41	Philidor Defense: Exchange Variation	1. e4 e5 2. Nf3 d6 3. d4 exd4 4. Nxd4 Nf6
C41	Philidor Defense: Hanham Variation	1. e4 e5 2. Nf3 d6 3. d4 Nd7
C41	Philidor Defense: Hanham Variation, Delmar Variation	1. e4 e5 2. Nf3 d6 3. d4 Nd7 4. Bc4 c6 5. c3
C41	Philidor Defense: Hanham Variation, Krause Variation	1. e4 e5 2. Nf3 d6 3. d4 Nd7 4. Bc4 c6 5. O-O
C41	Philidor Defense: Hanham Variation, Schlechter Variation	1. e4 e5 2. Nf3 d6 3. d4 Nd7 4. Bc4 c6 5. Nc3
C41	Philidor Defense: Hanham Variation, Sharp Variation	1. e4 e5 2. Nf3 d6 3. d4 Nd7 4. Bc4 Nb6
C41	Philidor Defense: Hanham Variation, Steiner Variation	1. e4 e5 2. Nf3 d6 3. d4 Nd7 4. Bc4 c6 5. O-O Be7 6. dxe5
C41	Philidor Defense: Hanham, Kmoch Variation	1. e4 e5 2. Nf3 d6 3. d4 Nd7 4. Bc4 c6 5. Ng5
C41	Philidor Defense: Larsen Variation	1. e4 e5 2. Nf3 d6 3. d4 exd4 4. Nxd4 g6
C41	Philidor Defense: Lion Variation	1. e4 e5 2. Nf3 d6 3. d4 Nf6 4. Nc3 Nbd7
C41	Philidor Defense: Lion Variation, Bishop Sacrifice	1. e4 e5 2. Nf3 d6 3. d4 Nf6 4. Nc3 Nbd7 5. Bc4 Be7 6. Bxf7+
C41	Philidor Defense: Lion Variation, Delayed Bishop Sacrifice	1. e4 d6 2. d4 Nf6 3. Nc3 Nbd7 4. Nf3 e5 5. Bc4 Be7 6. dxe5 dxe5 7. Bxf7+
C41	Philidor Defense: Lion Variation, Forcing Line	1. e4 e5 2. Nf3 d6 3. d4 Nf6 4. Nc3 Nbd7 5. Bc4 Be7 6. Ng5 O-O 7. Bxf7+ Rxf7 8. Ne6
C41	Philidor Defense: Lion Variation, Lion's Claw, with Bc4 and h6	1. e4 e5 2. Nf3 d6 3. d4 Nf6 4. Nc3 Nbd7 5. Bc4 Be7 6. O-O h6
C41	Philidor Defense: Lion Variation, Lion's Claw, with Be2 and c6	1. e4 e5 2. Nf3 d6 3. d4 Nf6 4. Nc3 Nbd7 5. Be2 Be7 6. O-O c6
C41	Philidor Defense: Lion Variation, Shirov Gambit	1. e4 e5 2. Nf3 d6 3. d4 Nd7 4. Nc3 Ngf6 5. g4
C41	Philidor Defense: Lion Variation, Sozin Variation	1. e4 d6 2. d4 Nf6 3. Nc3 e5 4. Nf3 Nbd7 5. Bc4 Be7 6. O-O O-O 7. Qe2 c6 8. a4 exd4
C41	Philidor Defense: Lopez Countergambit	1. e4 e5 2. Nf3 d6 3. Bc4 f5
C41	Philidor Defense: Lopez Countergambit, Jaenisch Variation	1. e4 e5 2. Nf3 d6 3. d4 f5 4. Bc4 exd4 5. Ng5 Nh6 6. Nxh7
C41	Philidor Defense: Morphy Gambit	1. e4 e5 2. Nf3 d6 3. d4 exd4 4. Bc4
C41	Philidor Defense: Nimzowitsch Variation	1. e4 e5 2. Nf3 d6 3. d4 Nf6
C41	Philidor Defense: Nimzowitsch Variation	1. e4 e5 2. Nf3 d6 3. d4 Nf6 4. dxe5
C41	Philidor Defense: Nimzowitsch Variation, Klein Variation	1. e4 e5 2. Nf3 d6 3. d4 Nf6 4. Bc4
C41	Philidor Defense: Nimzowitsch Variation, Rellstab Variation	1. e4 e5 2. Nf3 d6 3. d4 Nf6 4. dxe5 Nxe4 5. Qd5
C41	Philidor Defense: Nimzowitsch Variation, Sokolsky Variation	1. e4 e5 2. Nf3 d6 3. d4 Nf6 4. dxe5 Nxe4 5. Nbd2
C41	Philidor Defense: Nimzowitsch, Larobok Variation	1. e4 e5 2. Nf3 d6 3. d4 Nf6 4. Nc3 Nbd7 5. Bc4 Be7 6. Ng5 O-O 7. Bxf7+
C41	Philidor Defense: Nimzowitsch, Locock Variation	1. e4 e5 2. Nf3 d6 3. d4 Nf6 4. Ng5
C41	Philidor Defense: Paulsen Attack	1. e4 e5 2. Nf3 d6 3. d4 exd4 4. Nxd4 d5 5. exd5
C41	Philidor Defense: Philidor Countergambit	1. e4 e5 2. Nf3 d6 3. d4 f5
C41	Philidor Defense: Philidor Countergambit, Berger Variation	1. e4 e5 2. Nf3 d6 3. d4 f5 4. dxe5 fxe4 5. Ng5 d5 6. e6 Bc5 7. Nc3
C41	Philidor Defense: Philidor Countergambit, Zukertort Variation	1. e4 e5 2. Nf3 d6 3. d4 f5 4. Nc3
C41	Philidor Defense: Philidor Countergambit, del Rio Attack	1. e4 e5 2. Nf3 d6 3. d4 f5 4. dxe5 fxe4 5. Ng5 d5 6. e6
C41	Philidor Defense: Philidor Gambit	1. e4 e5 2. Nf3 d6 3. d4 Bd7
C41	Philidor Defense: Steinitz Variation	1. e4 e5 2. Nf3 d6 3. Bc4 Be7 4. c3
C42	Petrov's Defense	1. e4 e5 2. Nf3 Nf6
C42	Petrov's Defense	1. e4 e5 2. Nf3 Nf6 3. Nxe5
C42	Petrov's Defense	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6
C42	Petrov's Defense	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3
C42	Petrov's Defense	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4
C42	Petrov's Defense: Classical Attack	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4
C42	Petrov's Defense: Classical Attack, Berger Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Be7 7. O-O Nc6 8. Re1 Bg4 9. c3 f5 10. Nbd2
C42	Petrov's Defense: Classical Attack, Chigorin Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Be7 7. O-O Nc6 8. Re1
C42	Petrov's Defense: Classical Attack, Chigorin Variation, Browne Attack	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Nc6 7. O-O Be7 8. c4 Nb4 9. cxd5
C42	Petrov's Defense: Classical Attack, Chigorin Variation, Main Line	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Nc6 7. O-O Be7 8. c4 Nb4 9. Be2
C42	Petrov's Defense: Classical Attack, Closed Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 Nf6
C42	Petrov's Defense: Classical Attack, Jaenisch Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Nc6 7. O-O Be7 8. c4
C42	Petrov's Defense: Classical Attack, Krause Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Nc6 7. O-O Be7 8. Re1 Bg4 9. c3 f5 10. c4
C42	Petrov's Defense: Classical Attack, Marshall Trap	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Bd6 7. O-O O-O 8. c4 Bg4 9. cxd5 f5 10. Re1 Bxh2+
C42	Petrov's Defense: Classical Attack, Marshall Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Bd6
C42	Petrov's Defense: Classical Attack, Marshall Variation, Chinese Gambit	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Bd6 7. O-O O-O 8. c4 c6 9. Re1 Bg4
C42	Petrov's Defense: Classical Attack, Maróczy Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Be7 7. O-O Nc6 8. Re1 Bg4 9. c3 f5 10. c4 Bh4
C42	Petrov's Defense: Classical Attack, Mason Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Be7 7. O-O O-O
C42	Petrov's Defense: Classical Attack, Mason-Showalter Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Nc6
C42	Petrov's Defense: Classical Attack, Staunton Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Bd6 7. O-O O-O 8. c4 c6
C42	Petrov's Defense: Classical Attack, Tarrasch Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Bd6 7. O-O O-O 8. c4 Bg4
C42	Petrov's Defense: Cochrane Gambit	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nxf7
C42	Petrov's Defense: Cochrane Gambit, Bishop Check Line	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nxf7 Kxf7 5. Bc4+
C42	Petrov's Defense: Cochrane Gambit, Center Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nxf7 Kxf7 5. d4
C42	Petrov's Defense: Cozio Attack	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. Qe2
C42	Petrov's Defense: Damiano Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nxe4
C42	Petrov's Defense: Damiano Variation, Kholmov Gambit	1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nxe4 4. Qe2 Qe7
C42	Petrov's Defense: French Attack	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d3
C42	Petrov's Defense: Italian Variation	1. e4 e5 2. Nf3 Nf6 3. Bc4
C42	Petrov's Defense: Karklins-Martinovsky Variation	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nd3
C42	Petrov's Defense: Kaufmann Attack	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. c4
C42	Petrov's Defense: Millennium Attack	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. Bd3
C42	Petrov's Defense: Moody Gambit	1. e4 e5 2. Nf3 Nf6 3. Qe2 Nc6 4. d4
C42	Petrov's Defense: Nimzowitsch Attack	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. Nc3
C42	Petrov's Defense: Paulsen Attack	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nc4
C42	Petrov's Defense: Stafford Gambit	1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nc6
C42	Petrov's Defense: Stafford Gambit	1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nc6 4. Nxc6 dxc6
C42	Petrov's Defense: Three Knights Game	1. e4 e5 2. Nf3 Nf6 3. Nc3
C43	Bishop's Opening: Urusov Gambit	1. e4 e5 2. Bc4 Nf6 3. d4 exd4 4. Nf3
C43	Bishop's Opening: Urusov Gambit, Keidansky Gambit	1. e4 e5 2. Bc4 Nf6 3. d4 exd4 4. Nf3 Nxe4 5. Qxd4
C43	Petrov's Defense: Modern Attack	1. e4 e5 2. Nf3 Nf6 3. d4
C43	Petrov's Defense: Modern Attack	1. e4 e5 2. Nf3 Nf6 3. d4 exd4
C43	Petrov's Defense: Modern Attack, Bardeleben Variation	1. e4 e5 2. Nf3 Nf6 3. d4 exd4 4. e5 Ne4 5. Qe2 Nc5 6. Nxd4 Nc6
C43	Petrov's Defense: Modern Attack, Center Attack	1. e4 e5 2. Nf3 Nf6 3. d4 exd4 4. e5 Ne4 5. Qxd4
C43	Petrov's Defense: Modern Attack, Center Variation	1. e4 e5 2. Nf3 Nf6 3. d4 Nxe4 4. Bd3
C43	Petrov's Defense: Modern Attack, Murrey Variation	1. e4 e5 2. Nf3 Nf6 3. d4 Nxe4 4. Bd3 Nc6
C43	Petrov's Defense: Modern Attack, Steinitz Variation	1. e4 e5 2. Nf3 Nf6 3. d4 exd4 4. e5 Ne4 5. Qe2
C43	Petrov's Defense: Modern Attack, Symmetrical Variation	1. e4 e5 2. Nf3 Nf6 3. d4 d5
C43	Petrov's Defense: Modern Attack, Tal Gambit	1. e4 e5 2. Nf3 Nf6 3. d4 exd4 4. e5 Ne4 5. Bb5
C43	Petrov's Defense: Modern Attack, Trifunovic Variation	1. e4 e5 2. Nf3 Nf6 3. d4 Nxe4 4. Bd3 d5 5. Nxe5 Bd6 6. O-O O-O 7. c4 Bxe5
C44	Dresden Opening: The Goblin	1. e4 e5 2. Nf3 Nc6 3. c4 Nf6 4. Nxe5
C44	Irish Gambit	1. e4 e5 2. Nf3 Nc6 3. Nxe5
C44	King's Knight Opening: Konstantinopolsky	1. e4 e5 2. Nf3 Nc6 3. g3
C44	King's Knight Opening: Normal Variation	1. e4 e5 2. Nf3 Nc6
C44	King's Pawn Game: Dresden Opening	1. e4 e5 2. Nf3 Nc6 3. c4
C44	King's Pawn Game: Pachman Wing Gambit	1. e4 e5 2. Nf3 Nc6 3. b4
C44	King's Pawn Game: Schulze-Müller Gambit	1. e4 e5 2. Nf3 Nc6 3. Nxe5 Nxe5 4. d4
C44	King's Pawn Game: Tayler Opening	1. e4 e5 2. Nf3 Nc6 3. Be2
C44	King's Pawn Game: Tayler Opening	1. e4 e5 2. Nf3 Nc6 3. Be2 Nf6 4. d4
C44	King's Pawn Game: Tayler Opening, Basman Gambit	1. e4 e5 2. Nf3 Nc6 3. Be2 Nf6 4. d4 exd4 5. e5
C44	King's Pawn Game: Tayler Opening, Inverted Hanham	1. e4 e5 2. Nf3 Nc6 3. Be2 Nf6 4. d3 d5 5. Nbd2
C44	Latvian Gambit: Clam Gambit	1. e4 e5 2. Nf3 Nc6 3. d3 f5 4. exf5
C44	Ponziani Opening	1. e4 e5 2. Nf3 Nc6 3. c3
C44	Ponziani Opening: Caro Gambit	1. e4 e5 2. Nf3 Nc6 3. c3 d5 4. Qa4 Bd7
C44	Ponziani Opening: Jaenisch Counterattack	1. e4 e5 2. Nf3 Nc6 3. c3 Nf6
C44	Ponziani Opening: Jaenisch Counterattack	1. e4 e5 2. Nf3 Nc6 3. c3 Nf6 4. d3
C44	Ponziani Opening: Jaenisch Counterattack	1. e4 e5 2. Nf3 Nc6 3. c3 Nf6 4. d3 d5
C44	Ponziani Opening: Jaenisch Counterattack	1. e4 e5 2. Nf3 Nc6 3. c3 Nf6 4. d3 d5 5. Nbd2
C44	Ponziani Opening: Leonhardt Variation	1. e4 e5 2. Nf3 Nc6 3. c3 d5 4. Qa4 Nf6
C44	Ponziani Opening: Neumann Gambit	1. e4 e5 2. Nf3 Nc6 3. c3 Nf6 4. Bc4
C44	Ponziani Opening: Ponziani Countergambit	1. e4 e5 2. Nf3 Nc6 3. c3 f5
C44	Ponziani Opening: Ponziani Countergambit, Schmidt Attack	1. e4 e5 2. Nf3 Nc6 3. c3 f5 4. d4 d6 5. d5
C44	Ponziani Opening: Romanishin Variation	1. e4 e5 2. Nf3 Nc6 3. c3 Be7
C44	Ponziani Opening: Réti Variation	1. e4 e5 2. Nf3 Nc6 3. c3 Nge7
C44	Ponziani Opening: Spanish Variation	1. e4 e5 2. Nf3 Nc6 3. c3 d5 4. Bb5
C44	Ponziani Opening: Spanish Variation, Harrwitz Attack, Nikitin Gambit	1. e4 e5 2. Nf3 Nc6 3. c3 d5 4. Bb5 dxe4 5. Nxe5 Qd5 6. Qa4
C44	Ponziani Opening: Steinitz Variation	1. e4 e5 2. Nf3 Nc6 3. c3 d5 4. Qa4 f6
C44	Ponziani Opening: Vukovic Gambit	1. e4 e5 2. Nf3 Nc6 3. c3 Nf6 4. d4 Nxe4 5. d5 Bc5
C44	Scotch Game	1. e4 e5 2. Nf3 Nc6 3. d4
C44	Scotch Game	1. e4 e5 2. Nf3 Nc6 3. d4 exd4
C44	Scotch Game: Benima Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Be7 4. d4 exd4
C44	Scotch Game: Cochrane Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Bb4+ 5. c3 dxc3 6. bxc3 Ba5 7. e5
C44	Scotch Game: Cochrane-Shumov Defense	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Bc5 5. Ng5 Nh6 6. Nxf7 Nxf7 7. Bxf7+ Kxf7 8. Qh5+ g6 9. Qxc5 d5
C44	Scotch Game: Göring Gambit	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. c3
C44	Scotch Game: Göring Gambit, Bardeleben Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. c3 dxc3 5. Bc4 Nf6 6. Nxc3 Bb4
C44	Scotch Game: Göring Gambit, Double Pawn Sacrifice	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. c3 dxc3 5. Bc4
C44	Scotch Game: Göring Gambit, Main Line	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. c3 dxc3 5. Nxc3 Bb4
C44	Scotch Game: Hanneken Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Bb4+ 5. c3 dxc3 6. O-O cxb2 7. Bxb2 Nf6 8. Ng5 O-O 9. e5 Nxe5
C44	Scotch Game: Haxo Gambit	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Bc5
C44	Scotch Game: Lolli Variation	1. e4 e5 2. Nf3 Nc6 3. d4 Nxd4
C44	Scotch Game: Lolli Variation	1. e4 e5 2. Nf3 Nc6 3. d4 Nxd4 4. Nxd4 exd4 5. Qxd4
C44	Scotch Game: Napoleon Gambit	1. e4 e5 2. Nf3 Nc6 3. d4 Nxd4 4. Nxd4 exd4 5. Bc4
C44	Scotch Game: Relfsson Gambit	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bb5
C44	Scotch Game: Scotch Gambit	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4
C44	Scotch Game: Scotch Gambit, Advance Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Nf6 5. e5
C44	Scotch Game: Scotch Gambit, Cochrane-Anderssen Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Bc5 5. O-O d6 6. c3 Bg4
C44	Scotch Game: Scotch Gambit, Dubois Réti Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4
C44	Scotch Game: Scotch Gambit, Göring Gambit Declined	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. c3 d5
C44	Scotch Game: Scotch Gambit, Kingside Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. e5 Ng4
C44	Scotch Game: Scotch Gambit, London Defense	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Bb4+
C44	Scotch Game: Scotch Gambit, Sarratt Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Bc5 5. Ng5
C44	Scotch Game: Sea-Cadet Mate	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. c3 dxc3 5. Nxc3 d6 6. Bc4 Bg4 7. O-O Ne5 8. Nxe5 Bxd1 9. Bxf7+ Ke7 10. Nd5#
C44	Scotch Game: Vitzthum Attack	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Bc5 5. Ng5 Nh6 6. Qh5
C45	Scotch Game	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4
C45	Scotch Game	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Qh4 5. Nb5 Bb4+ 6. Bd2
C45	Scotch Game: Alekhine Gambit	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nf6 5. e5
C45	Scotch Game: Blumenfeld Attack	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Be3 Qf6 6. Nb5
C45	Scotch Game: Braune Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Qh4 5. Be3
C45	Scotch Game: Classical Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5
C45	Scotch Game: Classical Variation, Blackburne Attack	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Be3 Qf6 6. c3 Nge7 7. Qd2
C45	Scotch Game: Classical Variation, Intermezzo Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Nxc6 Qf6
C45	Scotch Game: Classical Variation, Millennium Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Be3 Qf6 6. c3 Qg6
C45	Scotch Game: Fraser Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Qh4 5. Nf3
C45	Scotch Game: Ghulam-Kassim Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nxd4 5. Qxd4 d6 6. Bd3
C45	Scotch Game: Gottschall Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Be3 Qf6 6. c3 Nge7 7. Qd2 d5 8. Nb5 Bxe3 9. Qxe3 O-O 10. Nxc7 Rb8 11. Nxd5 Nxd5 12. exd5 Nb4
C45	Scotch Game: Horwitz Attack	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Qh4 5. Nb5
C45	Scotch Game: Horwitz Attack, Blackburne Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Qh4 5. Nb5 Bb4+ 6. Bd2 Qxe4+ 7. Be2 Kd8 8. O-O Bxd2 9. Qxd2
C45	Scotch Game: Malaniuk Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bb4+
C45	Scotch Game: Meitner Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Be3 Qf6 6. c3 Nge7 7. Nc2
C45	Scotch Game: Mieses Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nf6 5. Nxc6 bxc6 6. e5
C45	Scotch Game: Modern Defense	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Qh4 5. Nc3 Bb4
C45	Scotch Game: Paulsen Attack	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Be3 Qf6 6. c3 Nge7 7. Bb5
C45	Scotch Game: Paulsen Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Qh4 5. Nf5
C45	Scotch Game: Paulsen, Gunsberg Defense	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Be3 Qf6 6. c3 Nge7 7. Bb5 Nd8
C45	Scotch Game: Potter Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Nb3
C45	Scotch Game: Romanishin Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Nb3 Bb4+
C45	Scotch Game: Rosenthal Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Qh4 5. Nb5 Bb4+ 6. Bd2 Qxe4+ 7. Be2 Kd8 8. O-O Bxd2 9. Nxd2 Qg6
C45	Scotch Game: Schmidt Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nf6
C45	Scotch Game: Steinitz Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Qh4
C45	Scotch Game: Steinitz Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Qh4 5. Nc3
C45	Scotch Game: Tartakower Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nf6 5. Nxc6 bxc6 6. Nd2
C46	Three Knights Opening	1. e4 e5 2. Nf3 Nc6 3. Nc3
C46	Three Knights Opening	1. e4 e5 2. Nf3 Nc6 3. Nc3 Bb4
C46	Three Knights Opening: Schlechter Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Bb4 4. Nd5 Nf6
C46	Three Knights Opening: Steinitz Defense	1. e4 e5 2. Nf3 Nc6 3. Nc3 g6
C46	Three Knights Opening: Steinitz-Rosenthal Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 g6 4. d4 exd4 5. Nd5
C46	Three Knights Opening: Winawer Defense	1. e4 e5 2. Nf3 Nc6 3. Nc3 f5
C47	Four Knights Game	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6
C47	Four Knights Game: Glek System	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. g3
C47	Four Knights Game: Glek System	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. g3 d5 5. exd5 Nxd5 6. Bg2 Nxc3 7. bxc3
C47	Four Knights Game: Gunsberg Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. a3
C47	Four Knights Game: Halloween Gambit	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Nxe5
C47	Four Knights Game: Halloween Gambit, Oldtimer Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Nxe5 Nxe5 5. d4 Ng6 6. e5 Ng8 7. Bc4 Bb4 8. Qf3 f5
C47	Four Knights Game: Halloween Gambit, Plasma Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Nxe5 Nxe5 5. d4 Nc6 6. d5 Ne5 7. f4 Ng6 8. e5 Ng8 9. d6 cxd6 10. exd6 Qf6 11. Nb5 Rb8
C47	Four Knights Game: Italian Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Nc3
C47	Four Knights Game: Italian Variation, Noa Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Nc3 Nxe4 5. Bxf7+
C47	Four Knights Game: Scotch Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. d4
C47	Four Knights Game: Scotch Variation Accepted	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. d4 exd4
C47	Four Knights Game: Scotch Variation Accepted, Main Line	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. d4 exd4 5. Nxd4 Bb4 6. Nxc6 bxc6 7. Bd3 d5 8. exd5 O-O 9. O-O
C47	Four Knights Game: Scotch Variation, Belgrade Gambit	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. d4 exd4 5. Nd5
C47	Four Knights Game: Scotch Variation, Belgrade Gambit, Modern Defense	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. d4 exd4 5. Nd5 Nxe4 6. Qe2 f5
C47	Four Knights Game: Scotch Variation, Krause Gambit	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. d4 Bb4 5. Nxe5
C47	Four Knights Game: Scotch Variation, Krause Gambit, Leonhardt Defense	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. d4 Bb4 5. Nxe5 Qe7
C47	Four Knights Game: Scotch Variation, Oxford Gambit	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. d4 Bb4 5. d5 Nd4
C47	Four Knights Game: Scotch Variation, Schmid Defense	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. d4 exd4 5. Nxd4 Nxe4
C48	Four Knights Game: Spanish Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5
C48	Four Knights Game: Spanish Variation, Bardeleben Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bc5 5. O-O O-O 6. Nxe5 Nxe5 7. d4 Bd6 8. f4 Nc6 9. e5 Bb4
C48	Four Knights Game: Spanish Variation, Classical Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bc5
C48	Four Knights Game: Spanish Variation, Ranken Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 a6 5. Bxc6
C48	Four Knights Game: Spanish Variation, Rubinstein Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Nd4
C48	Four Knights Game: Spanish Variation, Rubinstein Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Nd4 5. Be2
C48	Four Knights Game: Spanish Variation, Rubinstein Variation	1. e4 e5 2. Nf3 Nf6 3. Nc3 Nc6 4. Bb5 Nd4 5. Nxe5 Qe7 6. f4
C48	Four Knights Game: Spanish Variation, Rubinstein Variation Accepted	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Nd4 5. Nxd4
C48	Four Knights Game: Spanish Variation, Rubinstein Variation, Henneberger Variation	1. e4 e5 2. Nf3 Nf6 3. Nc3 Nc6 4. Bb5 Nd4 5. O-O
C48	Four Knights Game: Spanish Variation, Rubinstein Variation, Marshall Gambit	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Nd4 5. Ba4 Bc5 6. Nxe5 O-O
C48	Four Knights Game: Spanish Variation, Rubinstein Variation, Marshall Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Nd4 5. Nxe5 Bc5 6. O-O O-O
C48	Four Knights Game: Spanish Variation, Rubinstein Variation, Maróczy Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Nd4 5. Be2 Nxf3+ 6. Bxf3 Bc5 7. O-O O-O 8. d3 d6 9. Na4 Bb6
C48	Four Knights Game: Spanish Variation, Spielmann Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 a6 5. Bxc6 dxc6 6. Nxe5 Nxe4 7. Nxe4 Qd4 8. O-O Qxe5 9. Re1 Be6 10. d4 Qd5
C49	Four Knights Game: Spanish Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4 5. O-O O-O 6. d3 Bxc3
C49	Four Knights Game: Spanish Variation, Alatortsev Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4 5. O-O O-O 6. d3 Qe7 7. Ne2 d5
C49	Four Knights Game: Spanish Variation, Double Spanish	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4
C49	Four Knights Game: Spanish Variation, Double Spanish	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4 5. O-O O-O 6. d3
C49	Four Knights Game: Spanish Variation, Gunsberg Counterattack	1. e4 e5 2. Nf3 Nf6 3. Nc3 Nc6 4. Bb5 Bb4 5. O-O O-O 6. Nd5 Nxd5 7. exd5 e4
C49	Four Knights Game: Spanish Variation, Janowski Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4 5. O-O O-O 6. d3 Bxc3 7. bxc3 d6 8. Re1
C49	Four Knights Game: Spanish Variation, Nimzowitsch Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4 5. O-O O-O 6. Bxc6
C49	Four Knights Game: Spanish Variation, Svenonius Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4 5. O-O O-O 6. d3 Bxc3 7. bxc3 d5
C49	Four Knights Game: Spanish Variation, Symmetrical Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4 5. O-O O-O 6. d3 d6
C49	Four Knights Game: Spanish Variation, Symmetrical Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4 5. O-O O-O 6. d3 d6 7. Bg5 Bxc3 8. bxc3 Qe7 9. Re1 Nd8 10. d4 Bg4
C49	Four Knights Game: Spanish Variation, Symmetrical Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4 5. O-O O-O 6. d3 d6 7. Bg5 Ne7
C49	Four Knights Game: Spanish Variation, Symmetrical Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4 5. O-O O-O 6. d3 d6 7. Ne2
C49	Four Knights Game: Spanish Variation, Symmetrical Variation, Blake Variation	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4 5. O-O O-O 6. d3 d6 7. Bg5 Ne7 8. Nh4 c6 9. Bc4 d5 10. Bb3 Qd6
C49	Four Knights Game: Spanish Variation, Symmetrical Variation, Metger Unpin	1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4 5. O-O O-O 6. d3 d6 7. Bg5 Bxc3 8. bxc3 Qe7
C49	Four Knights Game: Spanish Variation, Symmetrical Variation, Tarrasch Variation	1. e4 e5 2. Nf3 Nf6 3. Nc3 Nc6 4. Bb5 Bb4 5. O-O O-O 6. d3 d6 7. Bg5 Be6
C50	Four Knights Game: Italian Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. Nc3 Nf6
C50	Italian Game	1. e4 e5 2. Nf3 Nc6 3. Bc4
C50	Italian Game: Anti-Fried Liver Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 h6
C50	Italian Game: Blackburne-Kostić Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4
C50	Italian Game: Classical Variation, Albin Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. c3
C50	Italian Game: Deutz Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d4
C50	Italian Game: Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3
C50	Italian Game: Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. O-O Bc5 5. Nc3 d6 6. d3
C50	Italian Game: Giuoco Pianissimo, Canal Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nf6 5. Nc3 d6 6. Bg5
C50	Italian Game: Giuoco Pianissimo, Dubois Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 f5 5. Ng5 f4
C50	Italian Game: Giuoco Pianissimo, Italian Four Knights Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nf6 5. Nc3
C50	Italian Game: Giuoco Pianissimo, Lucchini Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 f5
C50	Italian Game: Giuoco Pianissimo, Normal	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Bc5
C50	Italian Game: Giuoco Piano	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5
C50	Italian Game: Hungarian Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Be7
C50	Italian Game: Hungarian Defense, Tartakower Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Be7 4. d4 exd4 5. c3 Nf6 6. e5 Ne4
C50	Italian Game: Jerome Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. Bxf7+
C50	Italian Game: Paris Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 d6
C50	Italian Game: Rosentreter Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d4
C50	Italian Game: Rousseau Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 f5
C51	Italian Game: Evans Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4
C51	Italian Game: Evans Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Bc5 6. d4 exd4 7. O-O d6 8. cxd4 Bb6 9. Nc3 Bg4
C51	Italian Game: Evans Gambit Accepted	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4
C51	Italian Game: Evans Gambit Declined	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bb6
C51	Italian Game: Evans Gambit Declined	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bb6 5. a4
C51	Italian Game: Evans Gambit Declined, Cordel Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bb6 5. Bb2
C51	Italian Game: Evans Gambit Declined, Hicken Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bb6 5. b5 Na5 6. Nxe5 Qg5 7. Qf3 Qxe5 8. Qxf7+ Kd8 9. Bb2
C51	Italian Game: Evans Gambit Declined, Hirschbach Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bb6 5. b5 Na5 6. Nxe5 Qg5
C51	Italian Game: Evans Gambit Declined, Lange Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bb6 5. b5 Na5 6. Nxe5 Nh6
C51	Italian Game: Evans Gambit Declined, Pavlov Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bb6 5. b5 Na5 6. Nxe5 Nh6 7. d4 d6 8. Bxh6 dxe5 9. Bxg7 Rg8 10. Bxf7+ Kxf7 11. Bxe5 Qg5 12. Nd2
C51	Italian Game: Evans Gambit Declined, Showalter Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bb6 5. a4 a6 6. Nc3
C51	Italian Game: Evans Gambit Declined, Vasquez Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bb6 5. b5 Na5 6. Nxe5 Qg5 7. Bxf7+ Ke7 8. Qh5
C51	Italian Game: Evans Gambit, Anderssen Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Be7
C51	Italian Game: Evans Gambit, Anderssen Variation, Cordel Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Be7 6. d4 Na5
C51	Italian Game: Evans Gambit, Fontaine Countergambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 b5
C51	Italian Game: Evans Gambit, Fraser Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Bc5 6. d4 exd4 7. O-O d6 8. cxd4 Bb6 9. Nc3 Bg4 10. Qa4
C51	Italian Game: Evans Gambit, Fraser-Mortimer Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Bc5 6. d4 exd4 7. O-O d6 8. cxd4 Bb6 9. Nc3 Bg4 10. Qa4 Bd7 11. Qb3 Na5 12. Bxf7+ Kf8 13. Qc2
C51	Italian Game: Evans Gambit, Göring Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Bc5 6. d4 exd4 7. O-O d6 8. cxd4 Bb6 9. Nc3 Na5 10. Bg5
C51	Italian Game: Evans Gambit, Harding Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Bc5 6. d4 exd4 7. cxd4 Bb4+ 8. Bd2
C51	Italian Game: Evans Gambit, Hein Countergambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 d5
C51	Italian Game: Evans Gambit, Mayet Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Bf8
C51	Italian Game: Evans Gambit, McDonnell Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Bc5
C51	Italian Game: Evans Gambit, McDonnell Defense, Main Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Bc5 6. d4 exd4 7. O-O d6 8. cxd4 Bb6
C51	Italian Game: Evans Gambit, Morphy Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d6 8. cxd4 Bb6 9. Nc3
C51	Italian Game: Evans Gambit, Mortimer-Evans Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Bc5 6. d4 exd4 7. O-O d6 8. cxd4 Bb6 9. Nc3 Bg4 10. Qa4 Bd7 11. Qb3 Na5 12. Bxf7+ Kf8 13. Qc2 Kxf7
C51	Italian Game: Evans Gambit, Paulsen Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Bc5 6. d4 exd4 7. O-O d6 8. cxd4 Bb6 9. d5 Na5 10. Bb2 Ne7
C51	Italian Game: Evans Gambit, Steinitz Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Bc5 6. d4 exd4 7. O-O d6 8. cxd4 Bb6 9. Nc3 Na5 10. Bg5 f6 11. Be3
C51	Italian Game: Evans Gambit, Stone-Ware Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Bd6
C51	Italian Game: Evans Gambit, Ulvestad Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Bc5 6. d4 exd4 7. O-O d6 8. cxd4 Bb6 9. d5 Na5 10. Bb2
C52	Italian Game: Evans Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. O-O d6
C52	Italian Game: Evans Gambit, Alapin-Steinitz Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. O-O d6 7. d4 Bg4
C52	Italian Game: Evans Gambit, Anderssen Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. O-O Nf6 7. d4 exd4
C52	Italian Game: Evans Gambit, Bronstein Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 d6
C52	Italian Game: Evans Gambit, Compromised Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O dxc3
C52	Italian Game: Evans Gambit, Compromised Defense, Main Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O dxc3 8. Qb3 Qf6 9. e5 Qg6 10. Nxc3 Nge7 11. Ba3
C52	Italian Game: Evans Gambit, Compromised Defense, Potter Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O dxc3 8. Qb3 Qf6 9. e5 Qg6 10. Nxc3 Nge7 11. Rd1
C52	Italian Game: Evans Gambit, Dufresne Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3
C52	Italian Game: Evans Gambit, Johner Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O b5
C52	Italian Game: Evans Gambit, Laroche Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 Nf6
C52	Italian Game: Evans Gambit, Lasker Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. O-O d6 7. d4 Bb6
C52	Italian Game: Evans Gambit, Leonhardt Countergambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 b5
C52	Italian Game: Evans Gambit, Levenfish Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 d6 7. Qb3 Qd7 8. dxe5 dxe5 9. O-O Bb6 10. Ba3 Na5 11. Nxe5
C52	Italian Game: Evans Gambit, Main Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5
C52	Italian Game: Evans Gambit, Mieses Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O Nge7
C52	Italian Game: Evans Gambit, Pierce Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4
C52	Italian Game: Evans Gambit, Richardson Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. O-O Nf6 7. d4 O-O 8. Nxe5
C52	Italian Game: Evans Gambit, Sanders-Alapin Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. O-O d6 7. d4 Bd7
C52	Italian Game: Evans Gambit, Slow Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. O-O
C52	Italian Game: Evans Gambit, Sokolsky Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 d6 7. Bg5
C52	Italian Game: Evans Gambit, Tartakower Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 d6 7. Qb3
C52	Italian Game: Evans Gambit, Waller Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d6 8. Qb3
C53	Italian Game: Bird's Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. b4
C53	Italian Game: Classical Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3
C53	Italian Game: Classical Variation, Center Holding Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Qe7 5. d4 Bb6
C53	Italian Game: Classical Variation, Closed Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Qe7
C53	Italian Game: Classical Variation, Eisinger Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Qe7 5. d4 Bb6 6. d5 Nb8 7. d6
C53	Italian Game: Classical Variation, La Bourdonnais Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 d6 5. d4 exd4 6. cxd4 Bb6
C53	Italian Game: Classical Variation, Mestel Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Qe7 5. d4 Bb6 6. Bg5
C53	Italian Game: Classical Variation, Tarrasch Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Qe7 5. d4 Bb6 6. O-O d6 7. a4 a6 8. h3 Nf6 9. Re1
C54	Italian Game: Classical Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6
C54	Italian Game: Classical Variation, Center Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4
C54	Italian Game: Classical Variation, Ghulam-Kassim Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. e5 Ne4 7. Bd5 Nxf2 8. Kxf2 dxc3+ 9. Kg3
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. Nbd2 O-O 7. O-O
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 h6 6. c3
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 a6
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 a6 7. a4
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 a6 7. a4 Ba7
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 a6 7. a4 O-O
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 a6 7. Re1
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 a6 7. Re1 Ba7
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 h6 7. Re1
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 h6 7. Nbd2
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 O-O 6. c3 d5
C54	Italian Game: Classical Variation, Giuoco Pianissimo	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 O-O 6. c3 d6
C54	Italian Game: Classical Variation, Giuoco Pianissimo, Albin Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. b4
C54	Italian Game: Classical Variation, Giuoco Pianissimo, Main Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O 7. Re1 a6 8. Bb3 Ba7 9. h3
C54	Italian Game: Classical Variation, Giuoco Pianissimo, with a4 a5	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O 7. a4 a5
C54	Italian Game: Classical Variation, Giuoco Pianissimo, with a5	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 a5 6. c3
C54	Italian Game: Classical Variation, Giuoco Pianissimo, with a6	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 a6
C54	Italian Game: Classical Variation, Giuoco Pianissimo, with a6	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. Nbd2 a6
C54	Italian Game: Classical Variation, Giuoco Pianissimo, with h6	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 h6
C54	Italian Game: Classical Variation, Greco Gambit, Anderssen Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. e5 d5 7. Bb5 Ne4 8. cxd4 Bb4+
C54	Italian Game: Classical Variation, Greco Gambit, Dubov Italian	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. b4
C54	Italian Game: Classical Variation, Greco Gambit, Greco Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Nxc3
C54	Italian Game: Classical Variation, Greco Gambit, Main Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Bxc3
C54	Italian Game: Classical Variation, Greco Gambit, Modern Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. e5
C54	Italian Game: Classical Variation, Greco Gambit, Modern Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. e5 d5
C54	Italian Game: Classical Variation, Greco Gambit, Moeller-Bayonet Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Bxc3 9. d5 Bf6 10. Re1 Ne7 11. Rxe4 d6 12. g4
C54	Italian Game: Classical Variation, Greco Gambit, Moeller-Therkatz Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Bxc3 9. d5
C54	Italian Game: Classical Variation, Greco Gambit, Traditional Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4
C54	Italian Game: Classical Variation, with d5	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d5
C54	Italian Game: Giuoco Piano, Aitken Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Nxc3 9. bxc3 Bxc3 10. Ba3
C54	Italian Game: Giuoco Piano, Bernstein Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Nxc3 9. bxc3 Bxc3 10. Qb3 d5
C54	Italian Game: Giuoco Piano, Cracow Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Kf1
C54	Italian Game: Giuoco Piano, Greco's Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3
C54	Italian Game: Giuoco Piano, Holzhausen Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. O-O Bc5 5. d4 Bxd4 6. Nxd4 Nxd4 7. Bg5 d6 8. f4 Qe7 9. fxe5 dxe5 10. Nc3
C54	Italian Game: Giuoco Piano, Krause Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Bd2 Nxe4 8. Bxb4 Nxb4 9. Bxf7+ Kxf7 10. Qb3+ d5 11. Ne5+ Kf6 12. f3
C54	Italian Game: Giuoco Piano, Rosentreter Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. O-O Bc5 5. d4 Bxd4 6. Nxd4 Nxd4 7. Bg5 h6 8. Bh4 g5 9. f4
C54	Italian Game: Giuoco Piano, Steinitz Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Bxc3 9. bxc3 d5 10. Ba3
C54	Italian Game: Giuoco Piano, Therkatz-Herzog Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Bxc3 9. d5 Bf6 10. Re1 Ne7 11. Rxe4 d6 12. Bg5 Bxg5 13. Nxg5 O-O 14. Nxh7
C55	Italian Game: Two Knights Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6
C55	Italian Game: Two Knights Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. O-O Bc5 5. d4 Bxd4 6. Nxd4 Nxd4 7. Bg5 d6
C55	Italian Game: Two Knights Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Nc3 Nxe4 5. Nxe4 d5
C55	Italian Game: Two Knights Defense, Modern Bishop's Opening	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3
C55	Italian Game: Two Knights Defense, Modern Bishop's Opening	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Be7
C56	Italian Game: Scotch Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O
C56	Italian Game: Scotch Gambit, Anderssen Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Nxe4 6. Re1 d5 7. Bxd5 Qxd5 8. Nc3
C56	Italian Game: Scotch Gambit, Anderssen Attack, Main Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Nxe4 6. Re1 d5 7. Bxd5 Qxd5 8. Nc3 Qa5 9. Nxe4 Be6 10. Bd2 Qd5 11. Bg5
C56	Italian Game: Scotch Gambit, Canal Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Nf6 5. O-O Nxe4 6. Re1 d5 7. Nc3
C56	Italian Game: Scotch Gambit, Double Gambit Accepted	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Nxe4
C56	Italian Game: Scotch Gambit, Janowski Defense	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Nf6 5. O-O d6
C56	Italian Game: Scotch Gambit, Max Lange Attack	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Nf6 5. O-O Bc5
C56	Italian Game: Scotch Gambit, Max Lange Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. e5 d5 6. Bb5 Ne4
C56	Italian Game: Scotch Gambit, Max Lange Attack Accepted	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d4 exd4 6. e5 d5 7. exf6 dxc4 8. Re1+ Be6 9. fxg7
C56	Italian Game: Scotch Gambit, Max Lange Attack, Long Variation	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Nf6 5. O-O Bc5 6. e5 d5 7. exf6 dxc4 8. Re1+ Be6 9. Ng5 Qd5 10. Nc3 Qf5 11. Nce4
C56	Italian Game: Scotch Gambit, Max Lange Attack, Spielmann Defense	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Nf6 5. O-O Bc5 6. e5 Ng4
C56	Italian Game: Scotch Gambit, Nakhmanson Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Nxe4 6. Nc3
C56	Italian Game: Scotch Gambit, Walbrodt-Baird Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. O-O
C56	Italian Game: Scotch Gambit, de Riviere Defense	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Nf6 5. O-O Be7
C56	Italian Game: Scotch Invitation Declined	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 d6
C56	Italian Game: Two Knights Defense, Keidansky Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. e5 d5 6. Bb5 Ne4 7. Nxd4 Bc5 8. Nxc6 Bxf2+ 9. Kf1 Qh4
C56	Italian Game: Two Knights Defense, Max Lange Attack	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Nf6 5. O-O Bc5 6. e5
C56	Italian Game: Two Knights Defense, Max Lange Attack, Berger Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Bc5 6. e5 d5 7. exf6 dxc4 8. Re1+ Be6 9. Ng5 Qd5 10. Nc3 Qf5 11. g4 Qg6 12. Nce4 Bb6 13. f4 O-O-O
C56	Italian Game: Two Knights Defense, Max Lange Attack, Krause Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Bc5 6. e5 Ng4 7. c3
C56	Italian Game: Two Knights Defense, Max Lange Attack, Loman Defense	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Bc5 5. O-O Nf6 6. e5 d5 7. exf6 dxc4 8. Re1+ Be6 9. Ng5 g6
C56	Italian Game: Two Knights Defense, Max Lange Attack, Rubinstein Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Bc5 6. e5 d5 7. exf6 dxc4 8. Re1+ Be6 9. Ng5 Qd5 10. Nc3 Qf5 11. Nce4 Bf8
C56	Italian Game: Two Knights Defense, Open Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4
C56	Italian Game: Two Knights Defense, Perreux Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. Ng5
C56	Italian Game: Two Knights Defense, Yurdansky Attack	1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Nf6 5. O-O Nxe4 6. Re1 d5 7. Bxd5 Qxd5 8. Nc3 Qa5 9. Nxe4 Be6 10. Bg5 h6 11. Bh4 g5 12. Nf6+ Ke7 13. b4
C57	Italian Game: Two Knights Defense, Fegatello Attack, Leonhardt Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 Kxf7 7. Qf3+ Ke6 8. Nc3 Nb4 9. Qe4 c6 10. a3 Na6 11. d4 Nc7
C57	Italian Game: Two Knights Defense, Fried Liver Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7
C57	Italian Game: Two Knights Defense, Fritz Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nd4
C57	Italian Game: Two Knights Defense, Fritz, Gruber Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nd4 6. c3 b5 7. Bf1 Nxd5 8. Ne4
C57	Italian Game: Two Knights Defense, Kloss Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nb4
C57	Italian Game: Two Knights Defense, Knight Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5
C57	Italian Game: Two Knights Defense, Knight Attack, Normal Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5
C57	Italian Game: Two Knights Defense, Lolli Attack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. d4
C57	Italian Game: Two Knights Defense, Pincus Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. d4 Bb4+
C57	Italian Game: Two Knights Defense, Ponziani-Steinitz Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 Nxe4
C57	Italian Game: Two Knights Defense, Traxler Counterattack	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 Bc5
C57	Italian Game: Two Knights Defense, Traxler Counterattack, Bishop Sacrifice Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 Bc5 5. Bxf7+
C57	Italian Game: Two Knights Defense, Traxler Counterattack, King March Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 Bc5 5. Nxf7 Bxf2+ 6. Kxf2 Nxe4+ 7. Ke3
C57	Italian Game: Two Knights Defense, Traxler Counterattack, Knight Sacrifice Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 Bc5 5. Nxf7
C57	Italian Game: Two Knights Defense, Traxler Variation, Trencianske-Teplice Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 Bc5 5. Bxf7+ Ke7 6. d4
C57	Italian Game: Two Knights Defense, Ulvestad Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 b5
C57	Italian Game: Two Knights Defense, Ulvestad Variation, Kurkin Gambit	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 b5 6. Bf1 h6 7. Nxf7
C58	Italian Game: Two Knights Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. Bb5+ c6 7. dxc6 bxc6 8. Be2
C58	Italian Game: Two Knights Defense, Blackburne Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. Bb5+ c6 7. dxc6 bxc6 8. Qf3 cxb5
C58	Italian Game: Two Knights Defense, Colman Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. Bb5+ c6 7. dxc6 bxc6 8. Qf3 Rb8
C58	Italian Game: Two Knights Defense, Maróczy Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. d3 h6 7. Nf3 e4 8. Qe2 Nxc4 9. dxc4 Be7
C58	Italian Game: Two Knights Defense, Paoli Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. Bb5+ c6 7. dxc6 bxc6 8. Qf3 Qc7 9. Bd3
C58	Italian Game: Two Knights Defense, Polerio Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5
C58	Italian Game: Two Knights Defense, Polerio Defense, Bishop Check Line	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. Bb5+
C58	Italian Game: Two Knights Defense, Polerio Defense, Bogoljubow Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. Bb5+ c6 7. dxc6 bxc6 8. Qf3
C58	Italian Game: Two Knights Defense, Polerio Defense, Kieseritzky Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. d3
C58	Italian Game: Two Knights Defense, Polerio Defense, Yankovich Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. d3 h6 7. Nf3 e4 8. Qe2 Nxc4 9. dxc4 Bc5 10. Nfd2
C59	Italian Game: Two Knights Defense, Knorre Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. Bb5+ c6 7. dxc6 bxc6 8. Be2 h6 9. Nf3 e4 10. Ne5 Bd6 11. d4 Qc7 12. Bd2
C59	Italian Game: Two Knights Defense, Polerio Defense, Göring Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. Bb5+ c6 7. dxc6 bxc6 8. Be2 h6 9. Nf3 e4 10. Ne5 Qc7
C59	Italian Game: Two Knights Defense, Polerio Defense, Suhle Defense	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. Bb5+ c6 7. dxc6 bxc6 8. Be2 h6
C59	Italian Game: Two Knights Defense, Steinitz Variation	1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. Bb5+ c6 7. dxc6 bxc6 8. Be2 h6 9. Nh3
C60	Ruy Lopez	1. e4 e5 2. Nf3 Nc6 3. Bb5
C60	Ruy Lopez: Alapin Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 Bb4
C60	Ruy Lopez: Alapin Defense, Alapin Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 Bb4 4. c3 Ba5 5. Bxc6 dxc6
C60	Ruy Lopez: Brentano Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 g5
C60	Ruy Lopez: Bulgarian Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a5
C60	Ruy Lopez: Cozio Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nge7
C60	Ruy Lopez: Cozio Defense, Paulsen Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nge7 4. Nc3 g6
C60	Ruy Lopez: Cozio Defense, Tartakower Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 g6 4. d4 exd4 5. Nxd4 Bg7 6. Be3 Nge7 7. Nc3 O-O 8. Qd2 d5
C60	Ruy Lopez: Fianchetto Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 g6
C60	Ruy Lopez: Fianchetto Defense, Kevitz Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 g6 4. c3 f5
C60	Ruy Lopez: Lucena Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Be7
C60	Ruy Lopez: Nürnberg Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 f6
C60	Ruy Lopez: Pollock Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 Na5
C60	Ruy Lopez: Retreat Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nb8
C60	Ruy Lopez: Rotary-Albany Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 b6
C60	Ruy Lopez: Spanish Countergambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 d5
C60	Ruy Lopez: Spanish Countergambit, Harding Countergambit, Fricke Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 d5 4. Nxe5 Qg5 5. O-O
C60	Ruy Lopez: Spanish Countergambit, Harding Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 d5 4. Nxe5 Qg5 5. Nxc6
C60	Ruy Lopez: Vinogradov Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Qe7
C61	Ruy Lopez: Bird Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nd4
C61	Ruy Lopez: Bird Variation, Paulsen Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nd4 4. Nxd4 exd4 5. O-O Ne7
C62	Ruy Lopez: Old Steinitz Defense, Semi-Duras Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 d6 4. d4 Bd7 5. c4
C62	Ruy Lopez: Steinitz Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 d6
C62	Ruy Lopez: Steinitz Defense, Center Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 d6 4. d4 exd4 5. O-O
C62	Ruy Lopez: Steinitz Defense, Nimzowitsch Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 d6 4. d4 Bd7 5. Nc3 Nf6 6. Bxc6
C63	Ruy Lopez: Schliemann Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 f5
C63	Ruy Lopez: Schliemann Defense, Classical Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 f5 4. Nc3 fxe4 5. Nxe4 d5 6. Nxe5 dxe4 7. Nxc6 Qg5
C63	Ruy Lopez: Schliemann Defense, Dyckhoff Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 f5 4. Nc3
C63	Ruy Lopez: Schliemann Defense, Exchange Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 f5 4. Bxc6
C63	Ruy Lopez: Schliemann Defense, Jaenisch Gambit Accepted	1. e4 e5 2. Nf3 Nc6 3. Bb5 f5 4. exf5
C63	Ruy Lopez: Schliemann Defense, Kostić Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 f5 4. Nc3 fxe4 5. Nxe4 Be7
C63	Ruy Lopez: Schliemann Defense, Möhring Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 f5 4. Nc3 fxe4 5. Nxe4 d5 6. Nxe5 dxe4 7. Nxc6 Qd5
C63	Ruy Lopez: Schliemann Defense, Schönemann Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 f5 4. d4
C63	Ruy Lopez: Schliemann Defense, Tartakower Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 f5 4. Nc3 fxe4 5. Nxe4 Nf6
C64	Ruy Lopez: Classical Defense, Benelux Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Bc5 5. c3 O-O 6. d4 Bb6
C64	Ruy Lopez: Classical Defense, Boden Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Bc5 4. c3 Qe7
C64	Ruy Lopez: Classical Defense, Zaitsev Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Bc5 4. O-O Nd4 5. b4
C64	Ruy Lopez: Classical Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Bc5
C64	Ruy Lopez: Classical Variation, Central Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Bc5 4. c3
C64	Ruy Lopez: Classical Variation, Charousek Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Bc5 4. c3 Bb6
C64	Ruy Lopez: Classical Variation, Cordel Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 Bc5 4. c3 f5
C64	Ruy Lopez: Classical Variation, Konikowski Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 Bc5 4. c3 d5
C64	Ruy Lopez: Classical Variation, Modern Main Line	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Bc5 5. c3 O-O 6. d4 Bb6 7. Bg5
C64	Ruy Lopez: Classical Variation, Spanish Wing Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 Bc5 4. b4
C65	Ruy Lopez: Berlin Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6
C65	Ruy Lopez: Berlin Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O
C65	Ruy Lopez: Berlin Defense, Anti-Berlin Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3
C65	Ruy Lopez: Berlin Defense, Anti-Berlin Variation, Anderssen Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 d6 5. Bxc6+
C65	Ruy Lopez: Berlin Defense, Anti-Berlin Variation, Duras Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 d6 5. c4
C65	Ruy Lopez: Berlin Defense, Anti-Berlin Variation, Kaufmann Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. Be3
C65	Ruy Lopez: Berlin Defense, Anti-Berlin Variation, Mortimer Trap	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Ne7 5. Nxe5 c6
C65	Ruy Lopez: Berlin Defense, Anti-Berlin Variation, Mortimer Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Ne7
C65	Ruy Lopez: Berlin Defense, Beverwijk Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Bc5
C65	Ruy Lopez: Berlin Defense, Fishing Pole Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Ng4
C65	Ruy Lopez: Berlin Defense, Nyholm Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d4 exd4 5. O-O
C65	Ruy Lopez: Classical Variation, Zukertort Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Bc5 5. c3
C65	Ruy Lopez: Halloween Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. Nxe5
C66	Ruy Lopez: Berlin Defense, Closed Bernstein Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O d6 5. d4 Bd7 6. Nc3 Be7 7. Bg5
C66	Ruy Lopez: Berlin Defense, Closed Showalter Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O d6 5. d4 Bd7 6. Nc3 Be7 7. Bxc6
C66	Ruy Lopez: Berlin Defense, Closed Wolf Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O d6 5. d4 Bd7 6. Nc3 exd4
C66	Ruy Lopez: Berlin Defense, Hedgehog Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O d6 5. d4 Bd7 6. Nc3 Be7
C66	Ruy Lopez: Berlin Defense, Improved Steinitz Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O d6
C66	Ruy Lopez: Berlin Defense, Tarrasch Trap	1. e4 e5 2. Nf3 Nc6 3. Bb5 d6 4. d4 Bd7 5. Nc3 Nf6 6. O-O Be7 7. Re1 O-O
C66	Ruy Lopez: Closed Berlin Defense, Chigorin Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O d6 5. d4 Nd7
C67	Ruy Lopez: Berlin Defense, Berlin Wall	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. Nc3 Bd7
C67	Ruy Lopez: Berlin Defense, Cordel Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Be7 6. Qe2 Nd6 7. Bxc6 bxc6 8. dxe5 Nf5
C67	Ruy Lopez: Berlin Defense, Minckwitz Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Be7 6. dxe5
C67	Ruy Lopez: Berlin Defense, Pillsbury Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Be7 6. Qe2 Nd6 7. Bxc6 bxc6 8. dxe5 Nb7 9. b3
C67	Ruy Lopez: Berlin Defense, Rio Gambit Accepted	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4
C67	Ruy Lopez: Berlin Defense, Rio de Janeiro Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Be7
C67	Ruy Lopez: Berlin Defense, Rio de Janeiro Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Be7 6. Qe2 Nd6 7. Bxc6 bxc6 8. dxe5 Nb7 9. Nc3 O-O 10. Re1 Nc5 11. Nd4 Ne6 12. Be3 Nxd4 13. Bxd4 c5
C67	Ruy Lopez: Berlin Defense, Rosenthal Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 a6
C67	Ruy Lopez: Berlin Defense, Trifunovic Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Be7 6. Qe2 d5
C67	Ruy Lopez: Berlin Defense, Winawer Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Be7 6. Qe2 Nd6 7. Bxc6 bxc6 8. dxe5 Nb7 9. Nd4
C67	Ruy Lopez: Berlin Defense, Zukertort Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Be7 6. Qe2 Nd6 7. Bxc6 bxc6 8. dxe5 Nb7 9. c4
C67	Ruy Lopez: Berlin Defense, l'Hermet Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6
C67	Ruy Lopez: Berlin Defense, l'Hermet Variation, Berlin Wall Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8
C67	Ruy Lopez: Berlin Defense, l'Hermet Variation, Westerinen Line	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Ne4
C67	Ruy Lopez: Open Berlin Defense, Showalter Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Ba4
C67	Ruy Lopez: Open Berlin Defense, l'Hermet Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. dxe5
C68	Ruy Lopez: Exchange Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6
C68	Ruy Lopez: Exchange Variation, Alekhine Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. d4 exd4 6. Qxd4 Qxd4 7. Nxd4 Bd6
C68	Ruy Lopez: Exchange Variation, Keres Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. Nc3
C68	Ruy Lopez: Exchange Variation, Lutikov Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 bxc6
C68	Ruy Lopez: Exchange Variation, Romanovsky Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. Nc3 f6 6. d3
C68	Ruy Lopez: Exchange, Alekhine Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. d4 exd4 6. Qxd4 Qxd4 7. Nxd4 Bd7
C69	Ruy Lopez: Exchange Variation, Alapin Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O Bg4 6. h3 h5
C69	Ruy Lopez: Exchange Variation, Bronstein Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O Qd6
C69	Ruy Lopez: Exchange Variation, Gligoric Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O f6
C69	Ruy Lopez: Exchange Variation, King's Bishop Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O Bd6
C69	Ruy Lopez: Exchange Variation, Normal Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O
C70	Ruy Lopez: Bird's Defense Deferred	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nd4
C70	Ruy Lopez: Morphy Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6
C70	Ruy Lopez: Morphy Defense, Alapin's Defense Deferred	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Bb4
C70	Ruy Lopez: Morphy Defense, Caro Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 b5
C70	Ruy Lopez: Morphy Defense, Classical Defense Deferred	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Bc5
C70	Ruy Lopez: Morphy Defense, Cozio Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nge7
C70	Ruy Lopez: Morphy Defense, Fianchetto Defense Deferred	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 g6
C70	Ruy Lopez: Morphy Defense, Graz Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 b5 5. Bb3 Bc5
C70	Ruy Lopez: Morphy Defense, Norwegian Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 b5 5. Bb3 Na5
C70	Ruy Lopez: Morphy Defense, Norwegian Variation, Nightingale Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 b5 5. Bb3 Na5 6. Bxf7+
C70	Ruy Lopez: Morphy Defense, Schliemann Defense Deferred	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 f5
C70	Ruy Lopez: Morphy Defense, Schliemann Defense Deferred, Jaenisch Gambit Deferred	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 f5 5. exf5
C71	Ruy Lopez: Morphy Defense, Modern Steinitz Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6
C71	Ruy Lopez: Morphy Defense, Modern Steinitz Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. Nc3
C71	Ruy Lopez: Morphy Defense, Modern Steinitz Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. c4
C71	Ruy Lopez: Noah's Ark Trap	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 b5 5. Bb3 d6 6. d4 Nxd4 7. Nxd4 exd4 8. Qxd4 c5
C72	Ruy Lopez: Closed, Kecskemet Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. O-O Bd7 6. c3 Nf6 7. d4 Be7 8. Nbd2 O-O 9. Re1 Be8
C72	Ruy Lopez: Morphy Defense, Modern Steinitz Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. O-O
C73	Ruy Lopez: Morphy Defense, Modern Steinitz Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. Bxc6+ bxc6 6. d4
C73	Ruy Lopez: Morphy Defense, Modern Steinitz Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. Bxc6+ bxc6 6. d4 f6
C74	Ruy Lopez: Morphy Defense, Modern Steinitz Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. c3
C74	Ruy Lopez: Morphy Defense, Modern Steinitz Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. c3 f5 6. exf5 Bxf5 7. O-O
C74	Ruy Lopez: Morphy Defense, Modern Steinitz Defense, Siesta Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. c3 f5
C75	Ruy Lopez: Morphy Defense, Modern Steinitz Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. c3 Bd7
C75	Ruy Lopez: Morphy Defense, Modern Steinitz Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. c3 Bd7 6. d4 Nge7
C76	Ruy Lopez: Morphy Defense, Modern Steinitz Defense, Fianchetto Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 g6 4. c3 a6 5. Ba4 d6 6. d4 Bd7
C77	Ruy Lopez: Morphy Defense, Anderssen Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. d3
C77	Ruy Lopez: Morphy Defense, Bayreuth Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. Bxc6
C77	Ruy Lopez: Morphy Defense, Duras Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. d3 d6 6. c4
C77	Ruy Lopez: Morphy Defense, Jaffe Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. c3
C77	Ruy Lopez: Morphy Defense, Mackenzie Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. d4
C77	Ruy Lopez: Morphy Defense, Tarrasch Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. Nc3
C77	Ruy Lopez: Morphy Defense, Wormald Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. Qe2
C77	Ruy Lopez: Wormald Attack, Grünfeld Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. Qe2 b5 6. Bb3 Be7 7. d4 d6 8. c3 Bg4
C78	Ruy Lopez: Brix Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O g6
C78	Ruy Lopez: Central Countergambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O d5
C78	Ruy Lopez: Morphy Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O
C78	Ruy Lopez: Morphy Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O b5 6. Bb3 d6
C78	Ruy Lopez: Morphy Defense, Arkhangelsk Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O b5 6. Bb3 Bb7
C78	Ruy Lopez: Morphy Defense, Neo-Arkhangelsk Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Bc5
C78	Ruy Lopez: Morphy Defense, Wing Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O b5 6. Bb3 Be7 7. a4
C78	Ruy Lopez: Rabinovich Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O b5 6. Bb3 d6 7. Ng5 d5 8. exd5 Nd4 9. Re1 Bc5 10. Rxe5+ Kf8
C79	Ruy Lopez: Morphy Defense, Steinitz Deferred	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O d6
C79	Ruy Lopez: Morphy Defense, Steinitz Deferred	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O d6 6. Bxc6+ bxc6 7. d4 Nxe4
C79	Ruy Lopez: Steinitz Defense Deferred, Boleslavsky Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O d6 6. Bxc6+ bxc6 7. d4 Nxe4 8. Re1 f5 9. dxe5 d5 10. Nc3
C79	Ruy Lopez: Steinitz Defense Deferred, Lipnitsky Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O d6 6. Bxc6+ bxc6 7. d4 Bg4
C80	Ruy Lopez: Morphy Defense, Tartakower Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. Qe2
C80	Ruy Lopez: Open	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4
C80	Ruy Lopez: Open	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4
C80	Ruy Lopez: Open	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3
C80	Ruy Lopez: Open	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5
C80	Ruy Lopez: Open, Berger Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. a4 Nxd4 9. Nxd4 exd4 10. Nc3
C80	Ruy Lopez: Open, Bernstein Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. Nbd2
C80	Ruy Lopez: Open, Bernstein Variation, Luther Line	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. Nbd2 Bc5 10. Qe1
C80	Ruy Lopez: Open, Friess Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Nxe5
C80	Ruy Lopez: Open, Harksen Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. c4
C80	Ruy Lopez: Open, Karpov Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. Nbd2 Nc5 10. c3 d4 11. Ng5
C80	Ruy Lopez: Open, Knorre Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. Nc3
C80	Ruy Lopez: Open, Main Line	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6
C80	Ruy Lopez: Open, Richter Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. d5
C80	Ruy Lopez: Open, Riga Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 exd4
C80	Ruy Lopez: Open, Schlechter Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. a4 Nxd4
C80	Ruy Lopez: Open, Skipworth Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. Re1 d5
C80	Ruy Lopez: Open, Zukertort Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Ne7
C81	Ruy Lopez: Open, Howell Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. Qe2
C81	Ruy Lopez: Open, Howell Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. Qe2 Be7 10. c4
C81	Ruy Lopez: Open, Howell Attack, Ekstrom Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. Qe2 Be7 10. Rd1 O-O 11. c4 bxc4 12. Bxc4 Qd7
C82	Ruy Lopez: Open	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3
C82	Ruy Lopez: Open, Berlin Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Nc5
C82	Ruy Lopez: Open, Dilworth Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Bc5 10. Nbd2 O-O 11. Bc2 Nxf2
C82	Ruy Lopez: Open, Italian Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Bc5
C82	Ruy Lopez: Open, Motzko Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Bc5 10. Qd3
C82	Ruy Lopez: Open, Motzko Attack, Nenarokov Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Bc5 10. Qd3 Ne7
C82	Ruy Lopez: Open, St. Petersburg Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Bc5 10. Nbd2
C83	Ruy Lopez: Open, Breslau Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Be7 10. Re1 O-O 11. Nd4 Nxe5
C83	Ruy Lopez: Open, Classical Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Be7
C83	Ruy Lopez: Open, Classical Defense, Main Line	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 Be7 7. Re1 b5 8. Bb3 d5 9. dxe5 Be6 10. c3
C83	Ruy Lopez: Open, Malkin Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Be7 10. Nbd2 O-O 11. Qe2
C83	Ruy Lopez: Open, Tarrasch Trap	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Be7 10. Re1 O-O 11. Nd4 Qd7 12. Nxe6 fxe6 13. Rxe4
C84	Ruy Lopez: Closed	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7
C84	Ruy Lopez: Closed, Basque Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. d4 exd4 7. e5 Ne4 8. c3
C84	Ruy Lopez: Closed, Center Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. d4
C84	Ruy Lopez: Closed, Center Attack, Basque Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. d4 exd4 7. e5 Ne4 8. c3 dxc3
C84	Ruy Lopez: Closed, Martinez Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. d3
C84	Ruy Lopez: Closed, Morphy Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Nc3
C85	Ruy Lopez: Closed, Delayed Exchange	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Bxc6
C86	Ruy Lopez: Closed, Worrall Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Qe2
C86	Ruy Lopez: Closed, Worrall Attack, Castling Line	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Qe2 b5 7. Bb3 O-O
C86	Ruy Lopez: Closed, Worrall Attack, Castling Line	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. Qe2 Be7 6. O-O b5 7. Bb3 O-O 8. c3 d5 9. d3
C86	Ruy Lopez: Closed, Worrall Attack, Delayed Castling Line	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Qe2 b5 7. Bb3 d6
C87	Ruy Lopez: Closed, Averbakh Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 d6
C88	Ruy Lopez: Closed	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3
C88	Ruy Lopez: Closed	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O
C88	Ruy Lopez: Closed, Alekhine Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 Na5 9. Bc2 c5 10. d4 Qc7 11. Nbd2 O-O 12. Nf1 Bg4 13. Ne3 Bxf3 14. Qxf3
C88	Ruy Lopez: Closed, Anti-Marshall	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. a4
C88	Ruy Lopez: Closed, Balla Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 Na5 9. Bc2 c5 10. d4 Qc7 11. a4
C88	Ruy Lopez: Closed, Leonhardt Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 Na5 9. Bc2 c5 10. d4 Qc7 11. h3 Nc6 12. d5 Nb8 13. Nbd2 g5
C88	Ruy Lopez: Closed, Rosen Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. d4
C88	Ruy Lopez: Closed, Trajkovic Counterattack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 Bb7
C88	Ruy Lopez: Noah's Ark Trap	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. d4 Nxd4 9. Nxd4 exd4 10. Qxd4 c5
C89	Ruy Lopez: Marshall Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5
C89	Ruy Lopez: Marshall Attack, Main Line	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6 12. d4
C89	Ruy Lopez: Marshall Attack, Main Line, Spassky Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6 12. d4 Bd6 13. Re1 Qh4 14. g3 Qh3 15. Be3 Bg4 16. Qd3 Rae8 17. Nd2 Re6 18. a4 Qh5
C89	Ruy Lopez: Marshall Attack, Modern Main Line	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6 12. d4 Bd6 13. Re1 Qh4 14. g3 Qh3
C89	Ruy Lopez: Marshall Attack, Modern Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6
C89	Ruy Lopez: Marshall Attack, Original Marshall Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 Nf6
C89	Ruy Lopez: Marshall Attack, Re3 Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6 12. Bxd5 cxd5 13. d4 Bd6 14. Re3
C89	Ruy Lopez: Marshall Attack, Steiner Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 e4
C90	Ruy Lopez: Closed	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O
C90	Ruy Lopez: Closed, Lutikov Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. Bc2
C90	Ruy Lopez: Closed, Pilnik Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. d3 d6 9. c3
C90	Ruy Lopez: Closed, Suetin Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. a3
C91	Ruy Lopez: Closed, Bogoljubow Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. d4 Bg4
C91	Ruy Lopez: Closed, Yates Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. d4
C91	Ruy Lopez: Closed, Yates Variation, Short Attack	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. d4 Bg4 10. a4
C92	Ruy Lopez: Closed	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3
C92	Ruy Lopez: Closed, Flohr System	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Bb7
C92	Ruy Lopez: Closed, Karpov Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nd7
C92	Ruy Lopez: Closed, Kholmov Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Be6
C92	Ruy Lopez: Closed, Smyslov-Breyer-Zaitsev Hybrid	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Bb7 10. d4 Re8 11. Nbd2 Bf8 12. a3 h6
C92	Ruy Lopez: Closed, Zaitsev System	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Re8
C93	Ruy Lopez: Closed, Smyslov Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 h6
C94	Ruy Lopez: Closed, Breyer Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8
C94	Ruy Lopez: Closed, Breyer Defense, Quiet Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d3
C95	Ruy Lopez: Closed, Breyer	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4
C95	Ruy Lopez: Closed, Breyer Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 c5
C95	Ruy Lopez: Closed, Breyer Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nh4
C95	Ruy Lopez: Closed, Breyer Defense, Zaitsev Hybrid	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7
C96	Ruy Lopez: Closed, Borisenko Variation	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Nc6
C96	Ruy Lopez: Closed, Chigorin Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2
C96	Ruy Lopez: Closed, Chigorin Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5
C96	Ruy Lopez: Closed, Chigorin Defense, Gajewski Gambit	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 d5
C96	Ruy Lopez: Closed, Keres Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Nd7
C96	Ruy Lopez: Closed, Rossolimo Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c6 11. d4 Qc7
C97	Ruy Lopez: Closed, Chigorin Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5
C97	Ruy Lopez: Closed, Chigorin Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7
C97	Ruy Lopez: Closed, Chigorin, Yugoslav System	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 Bd7 13. Nf1 Rfe8 14. Ne3 g6
C98	Ruy Lopez: Closed, Chigorin Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 Nc6
C98	Ruy Lopez: Closed, Chigorin Defense	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 Nc6 13. dxc5
C99	Ruy Lopez: Closed, Chigorin Defense, Panov System	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4
`,
  Wo = `eco	name	pgn
D00	Amazon Attack	1. d4 d5 2. Qd3
D00	Blackmar-Diemer Gambit	1. d4 d5 2. e4
D00	Blackmar-Diemer Gambit	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6
D00	Blackmar-Diemer Gambit Accepted	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3
D00	Blackmar-Diemer Gambit Accepted: Bogoljubow Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 g6
D00	Blackmar-Diemer Gambit Accepted: Bogoljubow Defense, Kloss Attack	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 g6 6. Bc4 Bg7 7. O-O O-O 8. Kh1
D00	Blackmar-Diemer Gambit Accepted: Bogoljubow Defense, Mad Dog Attack	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 g6 6. Bc4 Bg7 7. h4
D00	Blackmar-Diemer Gambit Accepted: Bogoljubow Defense, Nimzowitsch Attack	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 g6 6. Bc4 Bg7 7. Ne5
D00	Blackmar-Diemer Gambit Accepted: Bogoljubow Defense, Studier Attack	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 g6 6. Bc4 Bg7 7. O-O O-O 8. Qe1
D00	Blackmar-Diemer Gambit Accepted: Euwe Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 e6
D00	Blackmar-Diemer Gambit Accepted: Euwe Defense, Zilbermints Gambit	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 e6 6. Bg5 Be7 7. Bd3 Nc6 8. O-O Nxd4 9. Kh1
D00	Blackmar-Diemer Gambit Accepted: Gunderam Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 Bf5
D00	Blackmar-Diemer Gambit Accepted: Gunderam Defense, Stader Variation	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 Bf5 6. Ne5 e6 7. g4 Be4
D00	Blackmar-Diemer Gambit Accepted: Holwell Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 Qd6
D00	Blackmar-Diemer Gambit Accepted: Kaulich Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 c5
D00	Blackmar-Diemer Gambit Accepted: Pietrowsky Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 Nc6
D00	Blackmar-Diemer Gambit Accepted: Ritter Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 b6
D00	Blackmar-Diemer Gambit Accepted: Ryder Gambit	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Qxf3
D00	Blackmar-Diemer Gambit Accepted: Schlutter Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 Nbd7
D00	Blackmar-Diemer Gambit Accepted: Teichmann Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 Bg4
D00	Blackmar-Diemer Gambit Accepted: Teichmann Defense, Ciesielski Variation	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 Bg4 6. h3 Bxf3 7. Qxf3 c6 8. Qf2
D00	Blackmar-Diemer Gambit Accepted: Teichmann Defense, Classical Variation	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 Bg4 6. h3 Bxf3 7. Qxf3 c6 8. Be3
D00	Blackmar-Diemer Gambit Accepted: Teichmann Defense, Seidel-Hall Attack	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 Bg4 6. h3 Bxf3 7. Qxf3 c6 8. g4
D00	Blackmar-Diemer Gambit Accepted: Ziegler Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Nxf3 c6
D00	Blackmar-Diemer Gambit Declined: Brombacher Countergambit	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 c5
D00	Blackmar-Diemer Gambit Declined: Elbert Countergambit	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 e5
D00	Blackmar-Diemer Gambit Declined: Gedult Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 a6
D00	Blackmar-Diemer Gambit Declined: Lamb Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 Nc6
D00	Blackmar-Diemer Gambit Declined: Langeheinicke Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 e3
D00	Blackmar-Diemer Gambit Declined: O'Kelly Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 c6
D00	Blackmar-Diemer Gambit Declined: Vienna Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 Bf5
D00	Blackmar-Diemer Gambit Declined: Weinsbach Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 e6
D00	Blackmar-Diemer Gambit: Blackmar Gambit	1. d4 d5 2. e4 dxe4 3. f3
D00	Blackmar-Diemer Gambit: Diemer-Rosenberg Attack	1. d4 d5 2. e4 dxe4 3. Be3
D00	Blackmar-Diemer Gambit: Fritz Attack	1. d4 d5 2. e4 dxe4 3. Bc4
D00	Blackmar-Diemer Gambit: Lemberger Countergambit	1. d4 d5 2. e4 dxe4 3. Nc3 e5
D00	Blackmar-Diemer Gambit: Lemberger Countergambit, Endgame Variation	1. d4 d5 2. e4 dxe4 3. Nc3 e5 4. dxe5
D00	Blackmar-Diemer Gambit: Lemberger Countergambit, Lange Gambit	1. d4 d5 2. e4 dxe4 3. Nc3 e5 4. Nxe4
D00	Blackmar-Diemer Gambit: Lemberger Countergambit, Rasmussen Attack	1. d4 d5 2. e4 dxe4 3. Nc3 e5 4. Nge2
D00	Blackmar-Diemer Gambit: Lemberger Countergambit, Sneiders Attack	1. d4 d5 2. e4 dxe4 3. Nc3 e5 4. Qh5
D00	Blackmar-Diemer Gambit: Lemberger Countergambit, Soller Attack	1. d4 d5 2. e4 dxe4 3. Nc3 e5 4. Be3
D00	Blackmar-Diemer Gambit: Netherlands Variation	1. d4 d5 2. e4 dxe4 3. Nc3 f5
D00	Blackmar-Diemer Gambit: Rasa-Studier Gambit	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. Be3
D00	Blackmar-Diemer Gambit: Reversed Albin Countergambit	1. d4 d5 2. e4 dxe4 3. Nc3 c5
D00	Blackmar-Diemer Gambit: Zeller Defense	1. d4 d5 2. e4 dxe4 3. Nc3 Bf5
D00	Blackmar-Diemer Gambit: Zeller Defense, Soller Attack	1. d4 d5 2. e4 dxe4 3. Nc3 Bf5 4. f3 Nf6 5. Bc4
D00	Blackmar-Diemer Gambit: von Popiel Gambit	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. Bg5
D00	Blackmar-Diemer Gambit: von Popiel Gambit, Zilbermints Variation	1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. Bg5 Bf5 5. Bxf6 exf6 6. g4 Bg6 7. Qe2 Bb4 8. Qb5+
D00	Queen's Pawn Game	1. d4 d5
D00	Queen's Pawn Game	1. d4 d5 2. e3
D00	Queen's Pawn Game	1. d4 d5 2. e3 Nf6
D00	Queen's Pawn Game: Accelerated London System	1. d4 d5 2. Bf4
D00	Queen's Pawn Game: Accelerated London System, Steinitz Countergambit	1. d4 d5 2. Bf4 c5
D00	Queen's Pawn Game: Accelerated London System, Steinitz Countergambit Accepted	1. d4 d5 2. Bf4 c5 3. dxc5
D00	Queen's Pawn Game: Accelerated London System, Steinitz Countergambit, Morris Countergambit	1. d4 d5 2. Bf4 c5 3. e4
D00	Queen's Pawn Game: Accelerated London System, Steinitz Countergambit, Morris Countergambit Accepted	1. d4 d5 2. Bf4 c5 3. e4 dxe4
D00	Queen's Pawn Game: Chigorin Variation	1. d4 d5 2. Nc3
D00	Queen's Pawn Game: Chigorin Variation	1. d4 d5 2. Nc3 e6
D00	Queen's Pawn Game: Chigorin Variation, Alburt Defense	1. d4 d5 2. Nc3 Bf5
D00	Queen's Pawn Game: Chigorin Variation, Anti-Veresov	1. d4 d5 2. Nc3 Bg4
D00	Queen's Pawn Game: Chigorin Variation, Fianchetto Defense	1. d4 g6 2. Nf3 Bg7 3. Nc3 d5
D00	Queen's Pawn Game: Chigorin Variation, Irish Gambit	1. d4 d5 2. Nc3 c5
D00	Queen's Pawn Game: Chigorin Variation, Shaviliuk Gambit	1. d4 d5 2. Nc3 e5
D00	Queen's Pawn Game: Chigorin Variation, Shropshire Defense	1. d4 d5 2. Nc3 h5
D00	Queen's Pawn Game: Hübsch Gambit	1. d4 Nf6 2. Nc3 d5 3. e4
D00	Queen's Pawn Game: Levitsky Attack	1. d4 d5 2. Bg5
D00	Queen's Pawn Game: Levitsky Attack, Welling Variation	1. d4 d5 2. Bg5 Bg4
D00	Queen's Pawn Game: Mason Attack	1. d4 d5 2. f4
D00	Queen's Pawn Game: Stonewall Attack	1. d4 d5 2. e3 Nf6 3. Bd3
D00	Queen's Pawn Game: Zurich Gambit	1. d4 d5 2. g4
D01	Rapport-Jobava System	1. d4 d5 2. Nc3 Nf6 3. Bf4
D01	Rapport-Jobava System	1. d4 d5 2. Nc3 Nf6 3. Bf4 e6
D01	Rapport-Jobava System	1. d4 d5 2. Nc3 Nf6 3. Bf4 g6
D01	Rapport-Jobava System, with e6	1. d4 d5 2. Nc3 e6 3. Bf4
D01	Richter-Veresov Attack	1. d4 Nf6 2. Nc3 d5 3. Bg5
D01	Richter-Veresov Attack	1. d4 Nf6 2. Nc3 d5 3. Bg5 Bf5
D01	Richter-Veresov Attack: Boyce Defense	1. d4 Nf6 2. Nc3 d5 3. Bg5 Ne4
D01	Richter-Veresov Attack: Malich Gambit	1. d4 Nf6 2. Nc3 d5 3. Bg5 c5 4. Bxf6 gxf6 5. e4 dxe4 6. d5
D01	Richter-Veresov Attack: Richter Variation	1. d4 Nf6 2. Nc3 d5 3. Bg5 Bf5 4. f3
D01	Richter-Veresov Attack: Two Knights System	1. d4 Nf6 2. Nc3 d5 3. Bg5 Nbd7 4. Nf3
D01	Richter-Veresov Attack: Two Knights System, Grünfeld Defense	1. d4 Nf6 2. Nc3 d5 3. Bg5 Nbd7 4. Nf3 g6
D01	Richter-Veresov Attack: Veresov Variation	1. d4 Nf6 2. Nc3 d5 3. Bg5 Bf5 4. Bxf6
D02	London System: Poisoned Pawn Variation	1. d4 Nf6 2. Nf3 d5 3. Bf4 c5 4. e3 Qb6 5. Nc3
D02	Queen's Gambit Declined: Baltic Defense, Pseudo-Slav	1. d4 d5 2. Nf3 Bf5 3. c4 e6 4. Nc3 c6
D02	Queen's Pawn Game: Anti-Torre	1. Nf3 d5 2. d4 Bg4
D02	Queen's Pawn Game: Chandler Gambit	1. d4 d5 2. Nf3 c5 3. g3 cxd4 4. Bg2
D02	Queen's Pawn Game: Chigorin Variation	1. d4 d5 2. Nf3 Nc6
D02	Queen's Pawn Game: Krause Variation	1. d4 d5 2. Nf3 c5
D02	Queen's Pawn Game: Levitsky Attack, Euwe Variation, Modern Line	1. d4 d5 2. Nf3 c6 3. Bg5 h6 4. Bh4 Qb6
D02	Queen's Pawn Game: London System	1. d4 d5 2. Nf3 Nf6 3. Bf4
D02	Queen's Pawn Game: London System, Pterodactyl Variation	1. d4 g6 2. Nf3 Bg7 3. Bf4 c5 4. c3 cxd4 5. cxd4 Qa5+
D02	Queen's Pawn Game: London System, with e6	1. d4 d5 2. Nf3 e6 3. Bf4
D02	Queen's Pawn Game: Symmetrical Variation	1. d4 d5 2. Nf3 Nf6
D02	Queen's Pawn Game: Symmetrical Variation, Pseudo-Catalan	1. d4 d5 2. Nf3 Nf6 3. g3
D02	Queen's Pawn Game: Zilbermints Countergambit	1. d4 d5 2. Nf3 Nf6 3. c4 b5
D02	Queen's Pawn Game: Zukertort Variation	1. d4 d5 2. Nf3
D03	Queen's Pawn Game: Torre Attack	1. d4 d5 2. Nf3 Nf6 3. Bg5
D03	Queen's Pawn Game: Torre Attack, Gossip Variation	1. d4 d5 2. Nf3 Nf6 3. Bg5 Ne4
D03	Queen's Pawn Game: Torre Attack, Grünfeld Variation	1. d4 d5 2. Nf3 Nf6 3. Bg5 g6
D04	Queen's Pawn Game: Colle System	1. d4 d5 2. Nf3 Nf6 3. e3
D04	Queen's Pawn Game: Colle System, Anti-Colle	1. d4 d5 2. Nf3 Nf6 3. e3 Bf5
D04	Queen's Pawn Game: Colle System, Grünfeld Formation	1. d4 d5 2. Nf3 Nf6 3. e3 g6 4. Bd3 Bg7
D05	Queen's Pawn Game: Colle System	1. d4 d5 2. Nf3 Nf6 3. e3 e6
D05	Queen's Pawn Game: Colle System	1. d4 d5 2. Nf3 Nf6 3. e3 e6 4. Bd3
D05	Queen's Pawn Game: Colle System, Traditional Colle	1. d4 Nf6 2. Nf3 e6 3. e3 c5 4. Bd3 d5 5. c3
D05	Queen's Pawn Game: Zukertort Variation	1. d4 d5 2. Nf3 c5 3. e3 Nf6 4. Nbd2 e6 5. b3
D05	Rubinstein Opening	1. d4 Nf6 2. Nf3 e6 3. e3 c5 4. Bd3 d5 5. b3
D05	Rubinstein Opening: Bogoljubow Defense	1. d4 Nf6 2. Nf3 e6 3. e3 c5 4. Bd3 d5 5. b3 Nc6 6. O-O Bd6 7. Bb2 O-O
D05	Rubinstein Opening: Classical Defense	1. d4 Nf6 2. Nf3 e6 3. e3 c5 4. Bd3 d5 5. b3 Nc6 6. O-O Be7 7. Bb2 O-O
D05	Rubinstein Opening: Semi-Slav Defense	1. d4 d5 2. Nf3 Nf6 3. e3 e6 4. Bd3 Bd6 5. O-O O-O 6. b3 Nbd7 7. Bb2
D05	Rubinstein Opening: Semi-Slav Defense	1. d4 d5 2. Nf3 Nf6 3. e3 e6 4. Bd3 Bd6 5. O-O O-O 6. b3 Nbd7 7. Bb2 c6
D05	Rubinstein Opening: Semi-Slav Defense	1. d4 d5 2. Nf3 Nf6 3. e3 e6 4. Bd3 Bd6 5. O-O O-O 6. b3 Nbd7 7. Bb2 c6 8. Nbd2
D06	Queen's Gambit	1. d4 d5 2. c4
D06	Queen's Gambit Declined: Austrian Attack, Salvio Countergambit	1. d4 d5 2. c4 c5 3. dxc5 d4
D06	Queen's Gambit Declined: Austrian Defense	1. d4 d5 2. c4 c5
D06	Queen's Gambit Declined: Austrian Defense, Gusev Countergambit	1. d4 d5 2. c4 c5 3. cxd5 Nf6
D06	Queen's Gambit Declined: Austrian Defense, Haberditz Variation	1. d4 d5 2. c4 c5 3. cxd5 Nf6 4. e4 Nxe4 5. dxc5 Qa5+
D06	Queen's Gambit Declined: Baltic Defense	1. d4 d5 2. c4 Bf5
D06	Queen's Gambit Declined: Baltic Defense, Argentinian Gambit	1. d4 d5 2. c4 Bf5 3. cxd5 Bxb1 4. Qa4+ c6 5. dxc6 Nxc6
D06	Queen's Gambit Declined: Baltic Defense, Pseudo-Chigorin	1. d4 d5 2. c4 Bf5 3. Nc3 e6 4. Nf3 Nc6
D06	Queen's Gambit Declined: Baltic Defense, Queen Attack	1. d4 d5 2. c4 Bf5 3. Qb3
D06	Queen's Gambit Declined: Baltic Defense, Queen Attack Deferred	1. d4 d5 2. c4 Bf5 3. Nc3 e6 4. Qb3
D06	Queen's Gambit Declined: Marshall Defense	1. d4 d5 2. c4 Nf6
D06	Queen's Gambit Declined: Marshall Defense, Tan Gambit	1. d4 d5 2. c4 Nf6 3. cxd5 c6
D06	Queen's Gambit Declined: Zilbermints Gambit	1. d4 d5 2. c4 b5
D07	Queen's Gambit Declined: Chigorin Defense	1. d4 d5 2. c4 Nc6
D07	Queen's Gambit Declined: Chigorin Defense	1. d4 d5 2. c4 Nc6 3. Nc3
D07	Queen's Gambit Declined: Chigorin Defense	1. d4 d5 2. c4 Nc6 3. Nc3 dxc4
D07	Queen's Gambit Declined: Chigorin Defense, Exchange Variation	1. d4 d5 2. c4 Nc6 3. cxd5 Qxd5
D07	Queen's Gambit Declined: Chigorin Defense, Exchange Variation, Costa's Line	1. d4 d5 2. c4 Nc6 3. cxd5 Qxd5 4. e3 e5 5. Nc3 Bb4 6. Bd2 Bxc3 7. Bxc3 exd4 8. Ne2
D07	Queen's Gambit Declined: Chigorin Defense, Janowski Variation	1. d4 d5 2. c4 Nc6 3. Nc3 dxc4 4. Nf3
D07	Queen's Gambit Declined: Chigorin Defense, Lazard Gambit	1. d4 d5 2. c4 Nc6 3. Nf3 e5
D07	Queen's Gambit Declined: Chigorin Defense, Main Line	1. d4 d5 2. c4 Nc6 3. Nf3 Bg4
D07	Queen's Gambit Declined: Chigorin Defense, Main Line, Alekhine Variation	1. d4 d5 2. c4 Nc6 3. Nf3 Bg4 4. Qa4
D07	Queen's Gambit Declined: Chigorin Defense, Modern Gambit	1. d4 d5 2. c4 Nc6 3. Nc3 dxc4 4. Nf3 Nf6
D07	Queen's Gambit Declined: Chigorin Defense, Tartakower Gambit	1. d4 d5 2. c4 Nc6 3. Nc3 e5
D08	Queen's Gambit Declined: Albin Countergambit	1. d4 d5 2. c4 e5
D08	Queen's Gambit Declined: Albin Countergambit, Balogh Variation	1. d4 d5 2. c4 e5 3. dxe5 d4 4. Nf3 Nc6 5. Nbd2 Qe7
D08	Queen's Gambit Declined: Albin Countergambit, Janowski Variation	1. d4 d5 2. c4 e5 3. dxe5 d4 4. Nf3 Nc6 5. Nbd2 f6
D08	Queen's Gambit Declined: Albin Countergambit, Krenosz Variation	1. d4 d5 2. c4 e5 3. dxe5 d4 4. Nf3 Nc6 5. Nbd2 Bg4 6. h3 Bxf3 7. Nxf3 Bb4+ 8. Bd2 Qe7
D08	Queen's Gambit Declined: Albin Countergambit, Lasker Trap	1. d4 d5 2. c4 e5 3. dxe5 d4 4. e3 Bb4+ 5. Bd2 dxe3
D08	Queen's Gambit Declined: Albin Countergambit, Modern Line	1. d4 d5 2. c4 e5 3. dxe5 d4 4. Nf3 Nc6 5. Nbd2
D08	Queen's Gambit Declined: Albin Countergambit, Normal Line	1. d4 d5 2. c4 e5 3. dxe5 d4 4. Nf3
D08	Queen's Gambit Declined: Albin Countergambit, Tartakower Defense	1. d4 d5 2. c4 e5 3. dxe5 d4 4. Nf3 c5
D09	Queen's Gambit Declined: Albin Countergambit, Fianchetto Variation	1. d4 d5 2. c4 e5 3. dxe5 d4 4. Nf3 Nc6 5. g3
D09	Queen's Gambit Declined: Albin Countergambit, Fianchetto Variation, Be6 Line	1. d4 d5 2. c4 e5 3. dxe5 d4 4. Nf3 Nc6 5. g3 Be6
D09	Queen's Gambit Declined: Albin Countergambit, Fianchetto Variation, Bf5 Line	1. d4 d5 2. c4 e5 3. dxe5 d4 4. Nf3 Nc6 5. g3 Bf5
D09	Queen's Gambit Declined: Albin Countergambit, Fianchetto Variation, Bg4 Line	1. d4 d5 2. c4 e5 3. dxe5 d4 4. Nf3 Nc6 5. g3 Bg4
D10	Slav Defense	1. d4 d5 2. c4 c6
D10	Slav Defense	1. d4 d5 2. c4 c6 3. Nc3
D10	Slav Defense	1. d4 d5 2. c4 c6 3. Nc3 dxc4
D10	Slav Defense: Diemer Gambit	1. d4 d5 2. c4 c6 3. e4
D10	Slav Defense: Exchange Variation	1. d4 d5 2. c4 c6 3. cxd5
D10	Slav Defense: Exchange Variation, Boor Attack	1. d4 d5 2. c4 c6 3. cxd5 cxd5 4. Nc3 Nf6 5. f3
D10	Slav Defense: Slav Gambit, Alekhine Attack	1. d4 d5 2. c4 c6 3. Nc3 dxc4 4. e4
D10	Slav Defense: Winawer Countergambit	1. d4 d5 2. c4 c6 3. Nc3 e5
D10	Slav Defense: Winawer Countergambit, Anti-Winawer Gambit	1. d4 d5 2. c4 c6 3. Nc3 e5 4. e4
D11	Slav Defense: Bonet Gambit	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Bg5
D11	Slav Defense: Breyer Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nbd2
D11	Slav Defense: Modern Line	1. d4 d5 2. c4 c6 3. Nf3
D11	Slav Defense: Modern Line	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. g3 dxc4 5. Bg2 g6
D11	Slav Defense: Quiet Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3
D11	Slav Defense: Quiet Variation, Pin Defense	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 Bg4
D12	Slav Defense: Quiet Variation, Amsterdam Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 Bf5 5. cxd5 cxd5 6. Nc3 e6 7. Ne5 Nfd7
D12	Slav Defense: Quiet Variation, Landau Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 Bf5 5. cxd5 cxd5 6. Qb3 Qc8 7. Bd2 e6 8. Na3
D12	Slav Defense: Quiet Variation, Schallopp Defense	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 Bf5
D12	Slav Defense: Quiet Variation, Schallopp Defense	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 Bf5 5. Nc3 e6
D13	Slav Defense: Exchange Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. cxd5 cxd5
D13	Slav Defense: Exchange Variation, Schallopp Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 Bf5 5. cxd5 cxd5 6. Nc3
D14	Slav Defense: Exchange Variation, Symmetrical Line	1. d4 d5 2. c4 c6 3. cxd5 cxd5 4. Nc3 Nf6 5. Nf3 Nc6 6. Bf4 Bf5
D14	Slav Defense: Exchange Variation, Trifunovic Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. cxd5 cxd5 5. Nc3 Nc6 6. Bf4 Bf5 7. e3 e6 8. Qb3 Bb4
D15	Slav Defense: Alekhine Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. e3
D15	Slav Defense: Chebanenko Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 a6
D15	Slav Defense: Chebanenko Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 a6 5. e3 Bf5
D15	Slav Defense: Chebanenko Variation, Advance System	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 a6 5. c5
D15	Slav Defense: Geller Gambit	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. e4
D15	Slav Defense: Geller Gambit	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. e4 b5 6. e5
D15	Slav Defense: Schlechter Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 g6
D15	Slav Defense: Süchting Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 Qb6
D15	Slav Defense: Three Knights Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3
D15	Slav Defense: Two Knights Attack	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4
D16	Slav Defense: Alapin Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4
D16	Slav Defense: Smyslov Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Na6
D16	Slav Defense: Soultanbeieff Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 e6
D16	Slav Defense: Steiner Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bg4
D17	Slav Defense: Czech Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5
D17	Slav Defense: Czech Variation, Bled Attack	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. Nh4
D17	Slav Defense: Czech Variation, Carlsbad Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. Ne5 Nbd7 7. Nxc4 Qc7 8. g3 e5
D17	Slav Defense: Czech Variation, Carlsbad Variation, Morozevich Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. Ne5 Nbd7 7. Nxc4 Qc7 8. g3 e5 9. dxe5 Nxe5 10. Bf4 Nfd7 11. Bg2 g5
D17	Slav Defense: Czech Variation, Krause Attack	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. Ne5
D17	Slav Defense: Czech Variation, Krause Attack, Fazekas Gambit	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. Ne5 Na6 7. e4
D17	Slav Defense: Czech Variation, Wiesbaden Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. Ne5 e6
D17	Slav Defense: Czech Variation, Wiesbaden Variation, Sharp Line	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. Ne5 e6 7. f3 Bb4 8. e4
D18	Slav Defense: Czech Variation, Classical System	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. e3
D18	Slav Defense: Czech Variation, Lasker Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. e3 Na6
D19	Slav Defense: Czech Variation, Classical System, Main Line	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. e3 e6 7. Bxc4 Bb4 8. O-O O-O 9. Qe2
D19	Slav Defense: Czech Variation, Dutch Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. e3 e6 7. Bxc4 Bb4 8. O-O
D19	Slav Defense: Czech Variation, Dutch Variation, Sämisch Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. e3 e6 7. Bxc4 Bb4 8. O-O O-O 9. Qe2 Ne4 10. g4
D20	Queen's Gambit Accepted	1. d4 d5 2. c4 dxc4
D20	Queen's Gambit Accepted: Accelerated Mannheim Variation	1. d4 d5 2. c4 dxc4 3. Qa4+
D20	Queen's Gambit Accepted: Central Variation, Alekhine System	1. d4 d5 2. c4 dxc4 3. e4 Nf6
D20	Queen's Gambit Accepted: Central Variation, Greco Variation	1. d4 d5 2. c4 dxc4 3. e4 b5
D20	Queen's Gambit Accepted: Central Variation, McDonnell Defense	1. d4 d5 2. c4 dxc4 3. e4 e5
D20	Queen's Gambit Accepted: Central Variation, McDonnell Defense, Somov Gambit	1. d4 d5 2. c4 dxc4 3. e4 e5 4. Bxc4
D20	Queen's Gambit Accepted: Central Variation, Modern Defense	1. d4 d5 2. c4 dxc4 3. e4 Nc6
D20	Queen's Gambit Accepted: Central Variation, Rubinstein Defense	1. d4 d5 2. c4 dxc4 3. e4 c5
D20	Queen's Gambit Accepted: Central Variation, Rubinstein Defense, Yefimov Gambit	1. d4 d5 2. c4 dxc4 3. e4 c5 4. d5 b5
D20	Queen's Gambit Accepted: Linares Variation	1. d4 d5 2. c4 dxc4 3. e4 c5 4. d5 Nf6 5. Nc3 b5
D20	Queen's Gambit Accepted: Old Variation	1. d4 d5 2. c4 dxc4 3. e3
D20	Queen's Gambit Accepted: Old Variation, Billinger Gambit	1. d4 d5 2. c4 dxc4 3. e3 e5 4. Bxc4 exd4 5. Qb3 Qe7 6. a3
D20	Queen's Gambit Accepted: Old Variation, Christensen Gambit	1. d4 d5 2. c4 dxc4 3. e3 e5 4. Bxc4 exd4 5. Qb3 Qe7 6. Nf3
D20	Queen's Gambit Accepted: Old Variation, Korchnoi Gambit	1. d4 d5 2. c4 dxc4 3. e3 e5 4. Bxc4 exd4 5. Qb3 Qe7 6. Kf1
D20	Queen's Gambit Accepted: Old Variation, Novikov Gambit	1. d4 d5 2. c4 dxc4 3. e3 e5 4. Bxc4 exd4 5. Qb3 Qe7 6. Nd2
D20	Queen's Gambit Accepted: Saduleto Variation	1. d4 d5 2. c4 dxc4 3. e4
D20	Queen's Gambit Accepted: Schwartz Defense	1. d4 d5 2. c4 dxc4 3. e4 f5
D21	Queen's Gambit Accepted: Alekhine Defense, Borisenko-Furman Variation	1. d4 d5 2. c4 dxc4 3. Nf3 a6 4. e4
D21	Queen's Gambit Accepted: Godes Variation	1. d4 d5 2. c4 dxc4 3. Nf3 Nd7
D21	Queen's Gambit Accepted: Gunsberg Defense	1. d4 d5 2. c4 dxc4 3. Nf3 c5
D21	Queen's Gambit Accepted: Normal Variation	1. d4 d5 2. c4 dxc4 3. Nf3
D21	Queen's Gambit Accepted: Rosenthal Variation	1. d4 d5 2. c4 dxc4 3. Nf3 e6
D21	Queen's Gambit Accepted: Slav Gambit	1. d4 d5 2. c4 dxc4 3. Nf3 b5
D22	Queen's Gambit Accepted: Alekhine Defense	1. d4 d5 2. c4 dxc4 3. Nf3 a6
D22	Queen's Gambit Accepted: Alekhine Defense, Alatortsev Variation	1. d4 d5 2. c4 dxc4 3. Nf3 a6 4. e3 Bg4 5. Bxc4 e6 6. d5
D22	Queen's Gambit Accepted: Alekhine Defense, Haberditz Variation	1. d4 d5 2. c4 dxc4 3. Nf3 a6 4. e3 b5
D23	Queen's Gambit Accepted	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6
D23	Queen's Gambit Accepted: Mannheim Variation	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. Qa4+
D24	Queen's Gambit Accepted	1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. Nc3 dxc4 5. e4
D24	Queen's Gambit Accepted: Bogoljubow Defense	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. Nc3 a6 5. e4
D24	Queen's Gambit Accepted: Gunsberg Defense, Prianishenmo Gambit	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. Nc3 c5 5. d5 e6 6. e4 exd5 7. e5
D24	Queen's Gambit Accepted: Showalter Variation	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. Nc3
D25	Queen's Gambit Accepted: Janowski-Larsen Variation	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 Bg4
D25	Queen's Gambit Accepted: Normal Variation	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3
D25	Queen's Gambit Accepted: Smyslov Variation	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 g6
D25	Queen's Gambit Accepted: Winawer Defense	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 Be6
D26	Queen's Gambit Accepted: Classical Defense	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5
D26	Queen's Gambit Accepted: Classical Defense, Normal Line	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O
D26	Queen's Gambit Accepted: Classical Defense, Steinitz Variation, Development Variation	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O Nc6
D26	Queen's Gambit Accepted: Classical Defense, Steinitz Variation, Exchange Variation	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O cxd4
D26	Queen's Gambit Accepted: Classical, Furman Variation	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. Qe2 a6 7. dxc5 Bxc5 8. O-O Nc6 9. e4 b5 10. e5
D26	Queen's Gambit Accepted: Normal Variation, Traditional System	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6
D27	Queen's Gambit Accepted: Classical Defense, Main Line	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6
D27	Queen's Gambit Accepted: Classical Defense, Rubinstein Variation	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6 7. a4
D27	Queen's Gambit Accepted: Classical Defense, Russian Gambit	1. d4 d5 2. c4 dxc4 3. e3 Nf6 4. Bxc4 e6 5. Nf3 c5 6. O-O a6 7. e4
D27	Queen's Gambit Accepted: Furman Variation	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6 7. dxc5 Bxc5
D28	Queen's Gambit Accepted: Classical Defense, Alekhine System	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6 7. Qe2
D28	Queen's Gambit Accepted: Classical Defense, Alekhine System	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6 7. Qe2 b5
D28	Queen's Gambit Accepted: Classical, Flohr Variation	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6 7. Qe2 b5 8. Bb3 Nc6 9. Rd1 c4 10. Bc2 Nb4 11. Nc3 Nxc2 12. Qxc2 Bb7 13. d5 Qc7
D29	Queen's Gambit Accepted: Classical Defense, Alekhine System, Main Line	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6 7. Qe2 b5 8. Bb3 Bb7
D29	Queen's Gambit Accepted: Classical Defense, Alekhine System, Smyslov Variation	1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6 7. Qe2 b5 8. Bb3 Bb7 9. Rd1 Nbd7 10. Nc3 Bd6
D30	Queen's Gambit Declined	1. d4 d5 2. c4 e6
D30	Queen's Gambit Declined: Capablanca Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Bg5 h6
D30	Queen's Gambit Declined: Capablanca Variation	1. d4 Nf6 2. Nf3 e6 3. c4 d5 4. Bg5 c6 5. Nbd2 Nbd7 6. e3
D30	Queen's Gambit Declined: Semmering Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 e6 5. Nbd2 Nbd7 6. Bd3 c5
D30	Queen's Gambit Declined: Spielmann Variation	1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. e3 c6 5. Nbd2 g6
D30	Queen's Gambit Declined: Stonewall Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 e6 5. Nbd2 Ne4 6. Bd3 f5
D30	Queen's Gambit Declined: Tarrasch Defense, Pseudo-Tarrasch	1. d4 d5 2. c4 e6 3. Nf3 c5
D30	Queen's Gambit Declined: Tarrasch Defense, Pseudo-Tarrasch Bishop Attack	1. d4 d5 2. c4 e6 3. Nf3 c5 4. cxd5 exd5 5. Bg5
D30	Queen's Gambit Declined: Traditional Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Bg5
D30	Queen's Gambit Declined: Vienna Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Bg5 Bb4+
D30	Semi-Slav Defense: Quiet Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 e6 5. Nbd2
D30	Semi-Slav Defense: Quiet Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 e6 5. Nbd2 Nbd7
D31	Queen's Gambit Declined: Alapin Variation	1. d4 e6 2. c4 b6 3. Nc3 d5
D31	Queen's Gambit Declined: Charousek Variation	1. d4 d5 2. c4 e6 3. Nc3 Be7
D31	Queen's Gambit Declined: Charousek Variation, Miladinovic Gambit	1. d4 d5 2. c4 e6 3. Nc3 Be7 4. e4 dxe4 5. f3
D31	Queen's Gambit Declined: Janowski Variation	1. d4 d5 2. c4 e6 3. Nc3 a6
D31	Queen's Gambit Declined: Queen's Knight Variation	1. d4 d5 2. c4 e6 3. Nc3
D31	Queen's Gambit Declined: Semi-Slav, Abrahams Variation	1. d4 d5 2. c4 e6 3. Nc3 c6 4. Nf3 dxc4 5. a4 Bb4 6. e3 b5 7. Bd2 a5
D31	Queen's Gambit Declined: Semi-Slav, Junge Variation	1. d4 d5 2. c4 e6 3. Nf3 c6 4. Nc3 dxc4 5. a4 Bb4 6. e3 b5 7. Bd2 Qb6
D31	Queen's Gambit Declined: Semi-Slav, Koomen Variation	1. d4 d5 2. c4 e6 3. Nc3 c6 4. Nf3 dxc4 5. e3 b5 6. a4 Bb4 7. Bd2 Qe7
D31	Queen's Gambit Declined: Uhlmann Variation	1. d4 d5 2. c4 e6 3. Nc3 Be7 4. Nf3 Nf6 5. Bg5 h6 6. Bh4 O-O 7. Rc1 dxc4
D31	Semi-Slav Defense: Accelerated Move Order	1. d4 d5 2. c4 e6 3. Nc3 c6
D31	Semi-Slav Defense: Anti-Noteboom, Stonewall Variation, Portisch Gambit	1. d4 d5 2. c4 e6 3. Nc3 c6 4. e3 f5 5. g4
D31	Semi-Slav Defense: Gunderam Gambit	1. d4 d5 2. c4 e6 3. Nc3 c6 4. e4 dxe4 5. f3
D31	Semi-Slav Defense: Marshall Gambit	1. d4 d5 2. c4 e6 3. Nc3 c6 4. e4
D31	Semi-Slav Defense: Marshall Gambit, Forgotten Variation	1. d4 d5 2. c4 e6 3. Nc3 c6 4. e4 dxe4 5. Nxe4 Bb4+ 6. Nc3
D31	Semi-Slav Defense: Marshall Gambit, Main Line	1. d4 d5 2. c4 e6 3. Nc3 c6 4. e4 dxe4 5. Nxe4 Bb4+ 6. Bd2
D31	Semi-Slav Defense: Marshall Gambit, Tolush Variation	1. d4 d5 2. c4 e6 3. Nc3 c6 4. e4 dxe4 5. Nxe4 Bb4+ 6. Bd2 Qxd4 7. Bxb4 Qxe4+ 8. Be2 c5 9. Bxc5 Qxg2
D31	Semi-Slav Defense: Noteboom Variation	1. d4 d5 2. c4 e6 3. Nc3 c6 4. Nf3 dxc4
D31	Semi-Slav Defense: Noteboom Variation, Abrahams Variation	1. d4 d5 2. c4 e6 3. Nc3 c6 4. Nf3 dxc4 5. a4 Bb4 6. e3 Bxc3+ 7. bxc3 b5 8. axb5 cxb5
D31	Semi-Slav Defense: Noteboom Variation, Anti-Noteboom Gambit	1. d4 d5 2. c4 e6 3. Nc3 c6 4. Nf3 dxc4 5. g3
D31	Semi-Slav Defense: Noteboom Variation, Anti-Noteboom Variation	1. d4 d5 2. c4 e6 3. Nc3 c6 4. Nf3 dxc4 5. Bg5
D31	Semi-Slav Defense: Noteboom Variation, Anti-Noteboom Variation, Belyavsky Line	1. d4 d5 2. c4 e6 3. Nc3 c6 4. Nf3 dxc4 5. Bg5 f6
D32	Queen's Gambit Declined: Tarrasch Defense	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5
D32	Tarrasch Defense	1. d4 d5 2. c4 e6 3. Nc3 c5
D32	Tarrasch Defense: Grünfeld Gambit	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. dxc5 d4 7. Na4 b5
D32	Tarrasch Defense: Marshall Gambit	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. e4
D32	Tarrasch Defense: Schara Gambit	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 cxd4
D32	Tarrasch Defense: Symmetrical Variation	1. d4 d5 2. c4 e6 3. Nc3 c5 4. e3 Nf6 5. Nf3 Nc6
D32	Tarrasch Defense: Tarrasch Gambit	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. dxc5 d4 6. Na4 b5
D32	Tarrasch Defense: Two Knights Variation	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3
D32	Tarrasch Defense: von Hennig Gambit	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 cxd4 5. Qxd4 Nc6 6. Qd1 exd5 7. Qxd5 Be6
D33	Tarrasch Defense: Dubov Tarrasch	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 cxd4 8. Nxd4 Bc5
D33	Tarrasch Defense: Prague Variation	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6
D33	Tarrasch Defense: Rubinstein System	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3
D33	Tarrasch Defense: Swedish Variation	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 c4
D33	Tarrasch Defense: Swedish Variation, Central Break	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 c4 7. e4
D33	Tarrasch Defense: Wagner Variation	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Bg4
D34	Queen's Gambit Declined: Tarrasch Defense, Stoltz Variation	1. d4 d5 2. c4 e6 3. Nf3 c5 4. cxd5 exd5 5. g3 Nc6 6. Bg2 Nf6 7. O-O Be7 8. Nc3 O-O 9. Bg5 Be6 10. Rc1 b6
D34	Tarrasch Defense: Classical Variation	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Be7 8. O-O O-O
D34	Tarrasch Defense: Classical Variation, Advance Variation	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Be7 8. O-O O-O 9. Bg5 c4
D34	Tarrasch Defense: Classical Variation, Bogoljubow Variation	1. d4 Nf6 2. c4 e6 3. Nc3 c5 4. Nf3 d5 5. cxd5 exd5 6. g3 Nc6 7. Bg2 Be7 8. O-O O-O 9. Bg5 Be6 10. Rc1 c4
D34	Tarrasch Defense: Classical Variation, Carlsbad Variation	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Be7 8. O-O O-O 9. Bg5
D34	Tarrasch Defense: Classical Variation, Chandler Variation	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Be7 8. O-O O-O 9. Bg5 cxd4 10. Nxd4 h6 11. Be3 Re8 12. Rc1 Be6
D34	Tarrasch Defense: Classical Variation, Classical Tarrasch Gambit	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Be7 8. O-O O-O 9. dxc5 d4
D34	Tarrasch Defense: Classical Variation, Endgame Variation	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Be7 8. O-O O-O 9. Bg5 Be6
D34	Tarrasch Defense: Classical Variation, Main Line	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Be7 8. O-O O-O 9. Bg5 cxd4 10. Nxd4 h6 11. Be3 Re8
D34	Tarrasch Defense: Classical Variation, Petursson Variation	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Be7 8. O-O O-O 9. Bg5 cxd4 10. Nxd4 Re8
D34	Tarrasch Defense: Classical Variation, Réti Variation	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Be7 8. O-O O-O 9. dxc5 Bxc5 10. Na4
D34	Tarrasch Defense: Classical Variation, Spassky Variation	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Be7 8. O-O O-O 9. Bg5 cxd4 10. Nxd4 h6 11. Be3 Bg4
D34	Tarrasch Defense: Prague Variation, Main Line	1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Be7
D35	Queen's Gambit Declined: Exchange Variation	1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. cxd5
D35	Queen's Gambit Declined: Exchange Variation, Chameleon Variation	1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. cxd5 exd5 5. Bg5 Be7 6. e3 O-O 7. Bd3 Nbd7 8. Qc2 Re8 9. Nge2 Nf8 10. O-O-O
D35	Queen's Gambit Declined: Exchange Variation, Positional Variation	1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. cxd5 exd5 5. Bg5
D35	Queen's Gambit Declined: Exchange Variation, Positional Variation	1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. cxd5 exd5 5. Bg5 c6
D35	Queen's Gambit Declined: Exchange Variation, Sämisch Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Nbd7 5. cxd5 exd5 6. Bf4
D35	Queen's Gambit Declined: Harrwitz Attack	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bf4
D35	Queen's Gambit Declined: Normal Defense	1. d4 d5 2. c4 e6 3. Nc3 Nf6
D36	Queen's Gambit Declined: Exchange Variation, Reshevsky Variation	1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. cxd5 exd5 5. Bg5 c6 6. Qc2
D37	Queen's Gambit Declined: Barmen Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Nbd7
D37	Queen's Gambit Declined: Harrwitz Attack	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4
D37	Queen's Gambit Declined: Harrwitz Attack	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5 8. Qc2 Nc6 9. Rd1 Qa5 10. a3
D37	Queen's Gambit Declined: Harrwitz Attack	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5 8. Qc2 Nc6 9. a3 Qa5 10. O-O-O
D37	Queen's Gambit Declined: Harrwitz Attack, Fianchetto Defense	1. d4 d5 2. c4 e6 3. Nc3 Be7 4. Nf3 Nf6 5. Bf4 O-O 6. e3 b6
D37	Queen's Gambit Declined: Harrwitz Attack, Main Line	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5
D37	Queen's Gambit Declined: Harrwitz Attack, Orthodox Defense	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Be7 5. Bf4 O-O 6. e3 c6
D37	Queen's Gambit Declined: Harrwitz Attack, Two Knights Defense	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4 O-O 6. e3 Nbd7
D37	Queen's Gambit Declined: Harrwitz Attack, Two Knights Defense, Blockade Line	1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. Nf3 Be7 5. Bf4 O-O 6. e3 Nbd7 7. c5
D37	Queen's Gambit Declined: Knight Defense, Alekhine Gambit	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Nbd7 5. Bg5 h6 6. Bh4 dxc4
D37	Queen's Gambit Declined: Miles Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. Qc2
D37	Queen's Gambit Declined: Three Knights Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3
D37	Queen's Gambit Declined: Three Knights, Vienna Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 dxc4
D37	Queen's Gambit Declined: Vienna Variation, Quiet Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 dxc4 5. e3
D38	Queen's Gambit Declined: Ragozin Defense	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Bb4
D38	Queen's Gambit Declined: Ragozin Defense, Alekhine Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Bb4 5. Qa4+
D38	Queen's Gambit Declined: Westphalian Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Bb4 5. Bg5 Nbd7 6. e3 c5
D39	Queen's Gambit Declined: Ragozin Defense, Vienna Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Bb4 5. Bg5 dxc4
D40	Queen's Gambit Declined: Semi-Tarrasch Defense	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c5
D40	Queen's Gambit Declined: Semi-Tarrasch Defense, Levenfish Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 c5 5. e3 Nc6 6. Bd3 Bd6 7. O-O O-O 8. Qe2 Qe7 9. dxc5 Bxc5 10. e4
D40	Queen's Gambit Declined: Semi-Tarrasch Defense, Pillsbury Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 c5 5. Bg5
D40	Queen's Gambit Declined: Semi-Tarrasch Defense, Symmetrical Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 c5 5. e3 Nc6 6. Bd3 Bd6 7. O-O O-O
D41	Queen's Gambit Declined: Semi-Tarrasch Defense	1. c4 c5 2. Nf3 Nf6 3. Nc3 Nc6 4. g3 d5 5. d4 e6
D41	Queen's Gambit Declined: Semi-Tarrasch Defense	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c5 5. cxd5
D41	Queen's Gambit Declined: Semi-Tarrasch Defense, Endgame Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c5 5. cxd5 cxd4 6. Qxd4 exd5 7. e4 dxe4 8. Qxd8+
D41	Queen's Gambit Declined: Semi-Tarrasch Defense, Exchange Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c5 5. cxd5 Nxd5 6. e4
D41	Queen's Gambit Declined: Semi-Tarrasch Defense, Kmoch Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 c5 5. cxd5 Nxd5 6. e4 Nxc3 7. bxc3 cxd4 8. cxd4 Bb4+ 9. Bd2 Bxd2+ 10. Qxd2 O-O 11. Bb5
D41	Queen's Gambit Declined: Semi-Tarrasch Defense, Pillsbury Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c5 5. cxd5 Nxd5 6. e3
D41	Queen's Gambit Declined: Semi-Tarrasch Defense, San Sebastian Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 c5 7. Nf3 cxd4 8. cxd4 Bb4+ 9. Bd2 Qa5
D42	Queen's Gambit Declined: Semi-Tarrasch Defense, Main Line	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c5 5. cxd5 Nxd5 6. e3 Nc6 7. Bd3
D43	Queen's Gambit Declined: Hastings Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 h6 6. Bxf6 Qxf6 7. Qb3
D43	Semi-Slav Defense	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6
D43	Semi-Slav Defense: Anti-Moscow Gambit	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 h6 6. Bh4
D44	Semi-Slav Defense Accepted	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 dxc4
D44	Semi-Slav Defense: Botvinnik Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 dxc4 6. e4
D44	Semi-Slav Defense: Botvinnik Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 dxc4 6. e4 b5 7. e5 h6 8. Bh4 g5 9. Nxg5
D44	Semi-Slav Defense: Botvinnik Variation, Alatortsev System	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. Bg5 dxc4 6. e4 b5 7. e5 h6 8. Bh4 g5 9. Nxg5 Nd5
D44	Semi-Slav Defense: Botvinnik Variation, Ekstrom Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 dxc4 6. e4 b5 7. e5 h6 8. Bh4 g5 9. exf6 gxh4 10. Ne5
D44	Semi-Slav Defense: Botvinnik Variation, Lilienthal Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 dxc4 6. e4 b5 7. e5 h6 8. Bh4 g5 9. Nxg5 hxg5 10. Bxg5 Nbd7 11. g3
D44	Semi-Slav Defense: Botvinnik Variation, Szabo Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. Bg5 dxc4 6. e4 b5 7. e5 h6 8. Bh4 g5 9. Nxg5 hxg5 10. Bxg5 Nbd7 11. Qf3
D45	Semi-Slav Defense: Accelerated Meran Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 a6
D45	Semi-Slav Defense: Main Line	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3
D45	Semi-Slav Defense: Normal Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7
D45	Semi-Slav Defense: Normal Variation	1. Nf3 d5 2. e3 Nf6 3. c4 c6 4. Nc3 e6 5. b3 Bd6 6. Bb2 O-O 7. d4 Nbd7
D45	Semi-Slav Defense: Normal Variation	1. d4 d5 2. c4 e6 3. Nc3 c6 4. Nf3 Nf6 5. e3 Nbd7 6. b3 Bd6 7. Bb2 O-O 8. Be2
D45	Semi-Slav Defense: Rubinstein System	1. d4 d5 2. c4 e6 3. Nc3 c6 4. Nf3 Nf6 5. e3 Nbd7 6. Ne5
D45	Semi-Slav Defense: Stoltz Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Qc2
D45	Semi-Slav Defense: Stoltz Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Qc2 b6 7. b3
D45	Semi-Slav Defense: Stoltz Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Qc2 b6 7. b3 Bb7
D45	Semi-Slav Defense: Stoltz Variation	1. d4 d5 2. Nf3 Nf6 3. c4 c6 4. e3 e6 5. Nc3 Nbd7 6. Qc2 Bd6 7. b3
D45	Semi-Slav Defense: Stoltz Variation	1. d4 d5 2. Nf3 Nf6 3. c4 c6 4. e3 e6 5. Nc3 Nbd7 6. Qc2 Bd6 7. b3 O-O 8. Bb2
D45	Semi-Slav Defense: Stoltz Variation, Center Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Qc2 Bd6 7. e4
D45	Semi-Slav Defense: Stoltz Variation, Center Variation, Mikhalchishin Line	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Qc2 Bd6 7. e4 dxe4 8. Nxe4 Nxe4 9. Qxe4 e5 10. dxe5
D45	Semi-Slav Defense: Stoltz Variation, Shabalov Attack	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Qc2 Bd6 7. g4
D45	Semi-Slav Defense: Stonewall Defense	1. d4 d5 2. Nf3 Nf6 3. c4 c6 4. Nc3 e6 5. e3 Ne4 6. Bd3 f5
D46	Semi-Slav Defense: Bogoljubow Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 Be7
D46	Semi-Slav Defense: Chigorin Defense	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 Bd6
D46	Semi-Slav Defense: Chigorin Defense	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 Bd6 7. Qc2
D46	Semi-Slav Defense: Chigorin Defense	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. b3 Bd6 7. Bb2 O-O 8. Bd3
D46	Semi-Slav Defense: Chigorin Defense	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Qc2 b6 7. b3 Bb7 8. Bd3
D46	Semi-Slav Defense: Chigorin Defense	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Qc2 Bd6 7. b3 O-O 8. Bb2 Re8 9. Bd3
D46	Semi-Slav Defense: Chigorin Defense	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Qc2 Bd6 7. b3 O-O 8. Bb2 Qe7 9. Bd3
D46	Semi-Slav Defense: Chigorin Defense	1. d4 d5 2. c4 c6 3. Nf3 e6 4. e3 Nf6 5. Nc3 Bd6 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 Nbd7 9. O-O O-O 10. Qc2
D46	Semi-Slav Defense: Chigorin Defense	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 Bd6 9. O-O Bb7 10. a3 O-O 11. Qc2
D46	Semi-Slav Defense: Main Line	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3
D46	Semi-Slav Defense: Main Line	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Qc2 b6 7. b3 Bb7 8. Bd3 Be7 9. O-O O-O 10. Bb2
D46	Semi-Slav Defense: Romih Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 Bb4
D47	Semi-Slav Defense: Meran Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5
D47	Semi-Slav Defense: Meran Variation, Lundin Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 b4
D47	Semi-Slav Defense: Meran Variation, Wade Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 Bb7
D47	Semi-Slav Defense: Meran Variation, Wade Variation, Kaidanov Gambit	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 Bb7 9. e4 b4 10. Na4 c5 11. e5 Nd5 12. O-O cxd4 13. Nxd4
D47	Semi-Slav Defense: Meran Variation, Wade Variation, Larsen Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 Bb7 9. e4 b4 10. Na4 c5 11. e5 Nd5
D47	Semi-Slav Defense: Semi-Meran Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 dxc4 7. Bxc4
D48	Semi-Slav Defense: Meran Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 a6
D48	Semi-Slav Defense: Meran Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 a6 9. e4 c5
D48	Semi-Slav Defense: Meran Variation, Old Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 a6 9. e4 c5 10. e5
D48	Semi-Slav Defense: Meran Variation, Pirc Variation	1. d4 d5 2. c4 e6 3. Nc3 c6 4. e3 Nf6 5. Nf3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 a6 9. e4 b4
D48	Semi-Slav Defense: Meran Variation, Reynolds' Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 a6 9. e4 c5 10. d5
D49	Semi-Slav Defense: Meran Variation, Blumenfeld Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 a6 9. e4 c5 10. e5 cxd4 11. Nxb5
D49	Semi-Slav Defense: Meran Variation, Rabinovich Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 a6 9. e4 c5 10. e5 cxd4 11. Nxb5 Ng4
D49	Semi-Slav Defense: Meran Variation, Rellstab Attack	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. Nf3 e6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 a6 9. e4 c5 10. e5 cxd4 11. Nxb5 Nxe5 12. Nxe5 axb5 13. O-O Qd5 14. Qe2 Ba6 15. Bg5
D49	Semi-Slav Defense: Meran Variation, Sozin Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 a6 9. e4 c5 10. e5 cxd4 11. Nxb5 Nxe5
D49	Semi-Slav Defense: Meran Variation, Sozin Variation	1. d4 d5 2. Nf3 Nf6 3. c4 c6 4. Nc3 e6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 a6 9. e4 c5 10. e5 cxd4 11. Nxb5 Nxe5 12. Nxe5 axb5 13. O-O
D49	Semi-Slav Defense: Meran Variation, Stahlberg Variation	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 a6 9. e4 c5 10. e5 cxd4 11. Nxb5 Nxe5 12. Nxe5 axb5 13. Qf3
D50	Queen's Gambit Declined: Been-Koomen Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 c5
D50	Queen's Gambit Declined: Modern Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5
D50	Queen's Gambit Declined: Pseudo-Tarrasch Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 c5 5. cxd5
D50	Queen's Gambit Declined: Pseudo-Tarrasch Variation, Canal Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 c5 5. cxd5 Qb6
D50	Queen's Gambit Declined: Pseudo-Tarrasch Variation, Primitive Pillsbury Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 c5 5. Nf3 cxd4 6. Qxd4
D50	Queen's Gambit Declined: Semi-Tarrasch Defense, Krause Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 c5 5. Nf3 cxd4 6. Nxd4 e5 7. Ndb5 a6 8. Qa4
D51	Queen's Gambit Declined: Alekhine Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. Nf3 c6 6. e4
D51	Queen's Gambit Declined: Capablanca Variation, Anti-Cambridge Springs Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 c6 6. a3
D51	Queen's Gambit Declined: Manhattan Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 Bb4
D51	Queen's Gambit Declined: Modern Variation, Knight Defense	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7
D51	Queen's Gambit Declined: Modern Variation, Knight Defense	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3
D51	Queen's Gambit Declined: Modern Variation, Knight Defense	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 c6
D51	Queen's Gambit Declined: Rochlin Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. Nf3 c6 6. Rc1 Qa5 7. Bd2
D52	Queen's Gambit Declined	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 Nbd7 6. e3
D52	Queen's Gambit Declined: Cambridge Springs Defense	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 Nbd7 6. e3 Qa5
D52	Queen's Gambit Declined: Cambridge Springs Defense	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 Nbd7 6. e3 Qa5 7. cxd5
D52	Queen's Gambit Declined: Cambridge Springs Defense, Argentine Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 c6 6. Nf3 Qa5 7. Nd2 Bb4 8. Qc2 O-O 9. Bh4
D52	Queen's Gambit Declined: Cambridge Springs Defense, Bogoljubow Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 Nbd7 6. e3 Qa5 7. Nd2 Bb4 8. Qc2
D52	Queen's Gambit Declined: Cambridge Springs Defense, Capablanca Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 c6 6. Nf3 Qa5 7. Bxf6
D52	Queen's Gambit Declined: Cambridge Springs Defense, Rubinstein Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 Nbd7 6. e3 Qa5 7. Nd2 dxc4
D52	Queen's Gambit Declined: Cambridge Springs Defense, Yugoslav Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. Bg5 Nbd7 6. e3 Qa5 7. cxd5 Nxd5
D53	Queen's Gambit Declined	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7
D53	Queen's Gambit Declined: Lasker Defense	1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. Bg5 Be7 5. e3 Ne4
D53	Queen's Gambit Declined: Modern Variation, Heral Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. Bxf6
D54	Queen's Gambit Declined: Neo-Orthodox Variation	1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. Bg5 Be7 5. e3 O-O 6. Rc1
D55	Queen's Gambit Declined: Anti-Tartakower Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bxf6
D55	Queen's Gambit Declined: Anti-Tartakower Variation, Petrosian Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 h6 6. Bxf6 Bxf6 7. e3 O-O 8. Rc1 c6 9. Bd3 Nd7 10. O-O dxc4 11. Bxc4
D55	Queen's Gambit Declined: Modern Variation, Normal Line	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3
D55	Queen's Gambit Declined: Neo-Orthodox Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6
D55	Queen's Gambit Declined: Neo-Orthodox Variation, Main Line	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 h6 6. Bh4 O-O 7. e3
D55	Queen's Gambit Declined: Pillsbury Attack	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. Nc3 d5 5. cxd5 exd5 6. Bg5 Be7 7. e3 O-O 8. Bd3 Bb7 9. Ne5
D56	Queen's Gambit Declined: Lasker Defense	1. d4 d5 2. c4 e6 3. Nc3 Be7 4. Nf3 Nf6 5. Bg5 h6 6. Bh4 O-O 7. e3 Ne4
D56	Queen's Gambit Declined: Lasker Defense, Russian Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 Ne4 8. Bxe7 Qxe7 9. Qc2 Nf6 10. Bd3 dxc4 11. Bxc4 c5 12. O-O Nc6 13. Rfd1 Bd7
D56	Queen's Gambit Declined: Lasker Defense, Teichmann Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 h6 6. Bh4 O-O 7. e3 Ne4 8. Bxe7 Qxe7 9. Qc2
D57	Queen's Gambit Declined: Lasker Defense, Bernstein Variation	1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. Bg5 Be7 5. e3 h6 6. Bh4 O-O 7. Nf3 Ne4 8. Bxe7 Qxe7 9. cxd5 Nxc3 10. bxc3 exd5 11. Qb3 Qd6
D57	Queen's Gambit Declined: Lasker Defense, Bernstein Variation, Mar del Plata Gambit	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 Ne4 8. Bxe7 Qxe7 9. cxd5 Nxc3 10. bxc3 exd5 11. Qb3 Rd8 12. c4 Be6
D57	Queen's Gambit Declined: Lasker Defense, Main Line	1. d4 d5 2. c4 e6 3. Nc3 Be7 4. Nf3 Nf6 5. Bg5 h6 6. Bh4 O-O 7. e3 Ne4 8. Bxe7 Qxe7 9. cxd5 Nxc3 10. bxc3
D58	Queen's Gambit Declined: Tartakower Defense	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 h6 6. Bh4 O-O 7. e3 b6
D58	Queen's Gambit Declined: Tartakower Defense, Exchange Variation	1. d4 d5 2. c4 e6 3. Nc3 Be7 4. Nf3 Nf6 5. Bg5 h6 6. Bh4 O-O 7. e3 b6 8. cxd5 exd5
D59	Queen's Gambit Declined: Tartakower Defense	1. d4 d5 2. c4 e6 3. Nc3 Be7 4. Nf3 Nf6 5. Bg5 h6 6. Bh4 O-O 7. e3 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6
D59	Queen's Gambit Declined: Tartakower Defense, Makogonov Exchange Variation	1. d4 d5 2. c4 e6 3. Nc3 Be7 4. Nf3 Nf6 5. Bg5 h6 6. Bh4 O-O 7. e3 b6 8. cxd5 Nxd5
D60	Queen's Gambit Declined: Orthodox Defense	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7
D60	Queen's Gambit Declined: Orthodox Defense, Botvinnik Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Bd3
D60	Queen's Gambit Declined: Orthodox Defense, Rauzer Variation	1. d4 d5 2. Nf3 Nf6 3. c4 e6 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Qb3
D61	Queen's Gambit Declined: Orthodox Defense, Rubinstein Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Qc2
D62	Queen's Gambit Declined: Orthodox Defense, Rubinstein Variation, Flohr Line	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Qc2 c5 8. cxd5
D63	Queen's Gambit Declined: Orthodox Defense, Capablanca Variation	1. Nf3 d5 2. d4 Nf6 3. c4 e6 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Rc1 b6 8. cxd5 exd5 9. Bb5
D63	Queen's Gambit Declined: Orthodox Defense, Henneberger Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Rc1 a6
D63	Queen's Gambit Declined: Orthodox Defense, Main Line	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Rc1
D63	Queen's Gambit Declined: Orthodox Defense, Main Line	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Rc1 c6
D63	Queen's Gambit Declined: Orthodox Defense, Pillsbury Variation	1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 b6 8. cxd5 exd5 9. Bd3
D63	Queen's Gambit Declined: Orthodox Defense, Swiss, Carlsbad Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Rc1 a6 8. cxd5
D64	Queen's Gambit Declined: Orthodox Defense, Rubinstein Attack	1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. Nf3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Rc1 c6 8. a3 a6 9. Qc2
D64	Queen's Gambit Declined: Orthodox Defense, Rubinstein Attack	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Rc1 c6 8. Qc2
D64	Queen's Gambit Declined: Orthodox Defense, Rubinstein Attack	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Rc1 c6 8. Qc2 a6
D64	Queen's Gambit Declined: Orthodox Defense, Rubinstein Attack	1. Nf3 d5 2. d4 Nf6 3. c4 e6 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Rc1 c6 8. Qc2 Ne4
D65	Queen's Gambit Declined: Orthodox Defense, Rubinstein Attack	1. d4 d5 2. Nf3 Nf6 3. c4 e6 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Rc1 c6 8. Qc2 a6 9. cxd5
D66	Queen's Gambit Declined: Orthodox Defense, Bd3 Line	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3
D66	Queen's Gambit Declined: Orthodox Defense, Fianchetto Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 c6 5. Nf3 Be7 6. e3 Nbd7 7. Rc1 O-O 8. Bd3 dxc4 9. Bxc4 b5
D67	Queen's Gambit Declined: Orthodox Defense, Alekhine Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 11. Ne4
D67	Queen's Gambit Declined: Orthodox Defense, Bd3 Line	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7
D67	Queen's Gambit Declined: Orthodox Defense, Capablanca System	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5
D67	Queen's Gambit Declined: Orthodox Defense, Janowski Variation	1. d4 d5 2. Nf3 Nf6 3. c4 e6 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. h4
D67	Queen's Gambit Declined: Orthodox Defense, Main Line	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 11. O-O
D68	Queen's Gambit Declined: Orthodox Defense, Classical Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 11. O-O Nxc3 12. Rxc3 e5
D68	Queen's Gambit Declined: Orthodox Defense, Classical Variation	1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 11. O-O Nxc3 12. Rxc3 e5 13. Qb1
D68	Queen's Gambit Declined: Orthodox Defense, Classical Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 11. O-O Nxc3 12. Rxc3 e5 13. Qc2
D69	Queen's Gambit Declined: Orthodox Defense, Classical Variation	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 11. O-O Nxc3 12. Rxc3 e5 13. dxe5 Nxe5 14. Nxe5 Qxe5
D70	Neo-Grünfeld Defense: Goglidze Attack	1. d4 Nf6 2. c4 g6 3. f3 d5
D70	Neo-Grünfeld Defense: with Nf3	1. d4 Nf6 2. c4 g6 3. Nf3 d5
D70	Neo-Grünfeld Defense: with g3	1. d4 Nf6 2. c4 g6 3. g3 d5
D71	Neo-Grünfeld Defense: Exchange Variation	1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 d5 5. cxd5 Nxd5
D74	Neo-Grünfeld Defense: Delayed Exchange Variation	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d5 6. cxd5 Nxd5 7. O-O
D75	Neo-Grünfeld Defense: Delayed Exchange Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. Nf3 O-O 5. g3 d5 6. cxd5 Nxd5 7. Bg2 c5 8. O-O
D75	Neo-Grünfeld Defense: Delayed Exchange Variation	1. d4 Nf6 2. Nf3 g6 3. c4 Bg7 4. g3 O-O 5. Bg2 d5 6. cxd5 Nxd5 7. O-O c5 8. dxc5
D76	Neo-Grünfeld Defense: Delayed Exchange Variation	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d5 6. cxd5 Nxd5 7. O-O Nb6
D77	Neo-Grünfeld Defense: Classical Variation	1. d4 Nf6 2. Nf3 g6 3. g3 Bg7 4. Bg2 O-O 5. O-O d5 6. c4
D77	Neo-Grünfeld Defense: Classical Variation, Modern Defense	1. d4 Nf6 2. Nf3 g6 3. g3 Bg7 4. Bg2 O-O 5. O-O d5 6. c4 dxc4
D77	Neo-Grünfeld Defense: Classical Variation, Polgar Variation	1. d4 Nf6 2. Nf3 g6 3. g3 Bg7 4. Bg2 O-O 5. O-O d5 6. c4 Nc6
D78	Neo-Grünfeld Defense: Classical Variation, Original Defense	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 c6 6. O-O d5
D79	Neo-Grünfeld Defense: Ultra-Delayed Exchange Variation	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 c6 6. O-O d5 7. cxd5 cxd5
D80	Grünfeld Defense	1. d4 Nf6 2. c4 g6 3. Nc3 d5
D80	Grünfeld Defense: Gibbon Gambit	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. g4
D80	Grünfeld Defense: Lundin Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Bg5 Ne4 5. Nxe4 dxe4 6. Qd2 c5
D80	Grünfeld Defense: Lutikov Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. f3
D80	Grünfeld Defense: Lutikov Variation, Murrey Attack	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. f3 c5 5. cxd5 Nxd5 6. Na4
D80	Grünfeld Defense: Stockholm Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Bg5
D80	Grünfeld Defense: Zaitsev Gambit	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. h4
D81	Grünfeld Defense: Russian Variation, Accelerated Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Qb3
D82	Grünfeld Defense: Brinckmann Attack	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Bf4
D83	Grünfeld Defense: Brinckmann Attack, Grünfeld Gambit	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Bf4 Bg7 5. e3 O-O
D83	Grünfeld Defense: Brinckmann Attack, Grünfeld Gambit, Botvinnik Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Bf4 Bg7 5. e3 O-O 6. Rc1 c5 7. dxc5 Be6
D83	Grünfeld Defense: Brinckmann Attack, Grünfeld Gambit, Capablanca Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Bf4 Bg7 5. e3 O-O 6. Rc1
D83	Grünfeld Defense: Brinckmann Attack, Reshevsky Gambit	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Bf4 Bg7 5. Rc1 O-O 6. e3 c5 7. dxc5 Qa5
D84	Grünfeld Defense: Brinckmann Attack, Grünfeld Gambit Accepted	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Bf4 Bg7 5. e3 O-O 6. cxd5 Nxd5 7. Nxd5 Qxd5 8. Bxc7
D85	Grünfeld Defense: Exchange Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5
D85	Grünfeld Defense: Exchange Variation, Modern Exchange Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Nf3
D85	Grünfeld Defense: Exchange Variation, Modern Exchange Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Nf3 c5
D85	Grünfeld Defense: Exchange Variation, Modern Exchange Variation	1. d4 Nf6 2. Nf3 g6 3. c4 Bg7 4. Nc3 d5 5. cxd5 Nxd5 6. e4 Nxc3 7. bxc3 c5 8. Rb1
D85	Grünfeld Defense: Exchange Variation, Modern Exchange Variation, Kramnik's Line	1. d4 Nf6 2. Nf3 g6 3. c4 Bg7 4. Nc3 d5 5. cxd5 Nxd5 6. e4 Nxc3 7. bxc3 c5 8. h3
D85	Grünfeld Defense: Exchange Variation, Modern Exchange Variation, Pawn Grab Line	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Nf3 c5 8. Rb1 O-O 9. Be2 Nc6 10. d5 Bxc3+
D85	Grünfeld Defense: Exchange Variation, Nadanian Attack	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. Na4
D86	Grünfeld Defense: Exchange Variation, Classical Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4
D86	Grünfeld Defense: Exchange Variation, Larsen Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 O-O 8. Ne2 Qd7
D86	Grünfeld Defense: Exchange Variation, Larsen Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 O-O 8. Ne2 Qd7 9. O-O b6
D86	Grünfeld Defense: Exchange Variation, Simagin's Improved Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 O-O 8. Ne2 Nc6
D86	Grünfeld Defense: Exchange Variation, Simagin's Lesser Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 O-O 8. Ne2 b6
D87	Grünfeld Defense: Exchange Variation, Seville Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 Nc6 9. Be3 O-O 10. O-O Bg4 11. f3 Na5 12. Bxf7+
D87	Grünfeld Defense: Exchange Variation, Spassky Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 O-O
D88	Grünfeld Defense: Exchange Variation, Spassky Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 Nc6 9. Be3 O-O 10. O-O cxd4 11. cxd4
D89	Grünfeld Defense: Exchange Variation, Sokolsky Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 O-O 9. O-O Nc6 10. Be3 Bg4 11. f3 Na5 12. Bd3 cxd4 13. cxd4 Be6 14. d5
D89	Grünfeld Defense: Exchange Variation, Spassky Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 Nc6 9. Be3 O-O 10. O-O Bg4 11. f3 Na5 12. Bd3 cxd4 13. cxd4 Be6
D90	Grünfeld Defense: Flohr Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qa4+
D90	Grünfeld Defense: Three Knights Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3
D90	Grünfeld Defense: Three Knights Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7
D91	Grünfeld Defense: Three Knights Variation, Petrosian System	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Bg5
D92	Grünfeld Defense: Three Knights Variation, Hungarian Attack	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Bf4
D93	Grünfeld Defense: Three Knights Variation, Hungarian Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Bf4 O-O 6. e3
D94	Grünfeld Defense: Flohr Defense	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 g6 5. Nf3 Bg7 6. Bd3 O-O 7. O-O Bf5
D94	Grünfeld Defense: Makogonov Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. e3 O-O 6. b4
D94	Grünfeld Defense: Opocensky Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. e3 O-O 6. Bd2
D94	Grünfeld Defense: Smyslov Defense	1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 g6 5. Nf3 Bg7 6. Bd3 O-O 7. O-O Bg4
D94	Grünfeld Defense: Three Knights Variation, Burille Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. e3
D94	Grünfeld Defense: Three Knights Variation, Paris Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. e3 O-O 6. Bd3
D95	Grünfeld Defense: Botvinnik Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. e3 O-O 6. Qb3 e6
D95	Grünfeld Defense: Pachman Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. e3 Bg7 5. Qb3 dxc4 6. Bxc4 O-O 7. Nf3 Nbd7 8. Ng5
D95	Grünfeld Defense: Three Knights Variation, Vienna Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. e3 O-O 6. Qb3
D96	Grünfeld Defense: Russian Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3
D97	Grünfeld Defense: Russian Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3 dxc4 6. Qxc4 O-O 7. e4
D97	Grünfeld Defense: Russian Variation, Byrne Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3 dxc4 6. Qxc4 O-O 7. e4 Nc6
D97	Grünfeld Defense: Russian Variation, Hungarian Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3 dxc4 6. Qxc4 O-O 7. e4 a6
D97	Grünfeld Defense: Russian Variation, Levenfish Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3 dxc4 6. Qxc4 O-O 7. e4 b6
D97	Grünfeld Defense: Russian Variation, Prins Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3 dxc4 6. Qxc4 O-O 7. e4 Na6
D97	Grünfeld Defense: Russian Variation, Szabo Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3 dxc4 6. Qxc4 O-O 7. e4 c6
D98	Grünfeld Defense: Russian Variation, Keres Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3 dxc4 6. Qxc4 O-O 7. e4 Bg4 8. Be3 Nfd7 9. Be2 Nb6 10. Qd3 Nc6 11. O-O-O
D98	Grünfeld Defense: Russian Variation, Smyslov Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3 dxc4 6. Qxc4 O-O 7. e4 Bg4
D99	Grünfeld Defense: Russian Variation, Smyslov Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3 dxc4 6. Qxc4 O-O 7. e4 Bg4 8. Be3 Nfd7 9. Qb3
D99	Grünfeld Defense: Russian Variation, Yugoslav Variation	1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3 dxc4 6. Qxc4 O-O 7. e4 Bg4 8. Be3 Nfd7 9. Qb3 c5
`,
  qo = `eco	name	pgn
E00	Catalan Opening	1. d4 Nf6 2. c4 e6 3. g3
E00	Catalan Opening	1. d4 Nf6 2. c4 e6 3. g3 d5
E00	Catalan Opening: Hungarian Gambit	1. d4 Nf6 2. c4 e6 3. g3 e5
E00	Indian Defense	1. d4 Nf6 2. c4 e6 3. Qb3
E00	Indian Defense: Devin Gambit	1. d4 Nf6 2. c4 e6 3. g4
E00	Indian Defense: Seirawan Attack	1. d4 Nf6 2. c4 e6 3. Bg5
E01	Catalan Opening: Closed	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2
E02	Catalan Opening: Open Defense	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 dxc4
E03	Catalan Opening: Open Defense	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 dxc4 5. Qa4+ Nbd7 6. Qxc4
E03	Catalan Opening: Open Defense, Alekhine Variation	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 dxc4 5. Qa4+ Nbd7 6. Qxc4 a6 7. Qc2
E04	Catalan Opening: Open Defense	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 dxc4 5. Nf3
E04	Catalan Opening: Open Defense	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 c6 5. Bg2 dxc4
E04	Catalan Opening: Open Defense, Modern Sharp Variation	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 dxc4 5. Nf3 Nc6 6. Qa4 Bb4+
E05	Catalan Opening: Open Defense, Classical Line	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 dxc4 5. Nf3 Be7
E05	Catalan Opening: Open Defense, Classical Line	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Be7 5. Bg2 O-O 6. O-O dxc4
E06	Catalan Opening: Closed	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3
E06	Catalan Opening: Closed	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Bb4+ 5. Bd2 Be7 6. Bg2 O-O 7. O-O c6 8. Bf4 b6
E06	Catalan Opening: Closed	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O c6 7. Qc2 b6 8. Nbd2 Bb7 9. e4 Na6
E07	Catalan Opening: Closed	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O Nbd7
E07	Catalan Opening: Closed, Botvinnik Variation	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O Nbd7 7. Nc3 c6 8. Qd3
E08	Catalan Opening: Closed	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O Nbd7 7. Qc2
E08	Catalan Opening: Closed	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O Nbd7 7. Qc2 c6 8. b3
E08	Catalan Opening: Closed	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O Nbd7 7. Qc2 c6 8. b3 b6
E08	Catalan Opening: Closed	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O c6 7. Qc2 b6 8. Rd1 Nbd7 9. Bf4
E08	Catalan Opening: Closed	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O Nbd7 7. Qc2 c6 8. Bf4 b6 9. Nbd2 Bb7 10. e4
E08	Catalan Opening: Closed, Spassky Gambit	1. d4 Nf6 2. c4 e6 3. g3 Be7 4. Bg2 d5 5. Nf3 O-O 6. O-O Nbd7 7. Qc2 c6 8. b3 b6 9. Rd1 Bb7 10. Nc3 b5
E08	Catalan Opening: Closed, Zagoryansky Variation	1. d4 e6 2. c4 Nf6 3. Nf3 d5 4. g3 Be7 5. Bg2 O-O 6. O-O Nbd7 7. Qc2 c6 8. Rd1 b6 9. a4
E09	Catalan Opening: Closed Variation, Rabinovich Variation	1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Qc2 e6 5. Nbd2 Be7 6. g3 Nbd7 7. Bg2 O-O 8. O-O b5
E09	Catalan Opening: Closed Variation, Traditional Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Be7 5. Bg2 O-O 6. O-O Nbd7 7. Qc2 c6 8. Nbd2 b6
E09	Catalan Opening: Closed, Main Line	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Be7 5. Bg2 O-O 6. O-O Nbd7 7. Qc2 c6 8. Nbd2
E09	Catalan Opening: Closed, Main Line	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Be7 5. Bg2 O-O 6. O-O c6 7. Qc2 b6 8. Nbd2 Bb7 9. e4 Nbd7
E09	Catalan Opening: Closed, Main Line	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Be7 5. Bg2 O-O 6. O-O Nbd7 7. Qc2 c6 8. Bf4 b6 9. Nbd2 Bb7 10. e4 dxe4 11. Nxe4 Nxe4 12. Qxe4
E09	Catalan Opening: Closed, Sokolsky Variation	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O Nbd7 7. Qc2 c6 8. Nbd2 b6 9. b3 a5 10. Bb2 Ba6
E10	Blumenfeld Countergambit	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 b5
E10	Blumenfeld Countergambit Accepted	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 b5 5. dxe6 fxe6 6. cxb5 d5
E10	Blumenfeld Countergambit: Duz-Khotimirsky Variation	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 b5 5. Bg5
E10	Blumenfeld Countergambit: Spielmann Variation	1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. d5 b5 5. Bg5 exd5 6. cxd5 h6
E10	Indian Defense: Anti-Nimzo-Indian	1. d4 Nf6 2. c4 e6 3. Nf3
E10	Indian Defense: Dzindzi-Indian Defense	1. d4 Nf6 2. c4 e6 3. Nf3 a6
E10	Indian Defense: Döry Indian	1. d4 Nf6 2. c4 e6 3. Nf3 Ne4
E11	Bogo-Indian Defense	1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+
E11	Bogo-Indian Defense: Exchange Variation	1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Bd2 Bxd2+
E11	Bogo-Indian Defense: Grünfeld Variation	1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Nbd2
E11	Bogo-Indian Defense: Haiti Variation	1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Bd2 Nc6
E11	Bogo-Indian Defense: Monticelli Trap	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Bb4+ 6. Bd2 Bxd2+ 7. Qxd2 O-O 8. Nc3 Ne4 9. Qc2 Nxc3 10. Ng5
E11	Bogo-Indian Defense: New England Variation	1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Nfd2
E11	Bogo-Indian Defense: Nimzowitsch Variation	1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Bd2 Qe7
E11	Bogo-Indian Defense: Retreat Variation	1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Bd2 Be7
E11	Bogo-Indian Defense: Retreat Variation	1. d4 Nf6 2. c4 e6 3. g3 Bb4+ 4. Bd2 Be7 5. Bg2 d5 6. Nf3
E11	Bogo-Indian Defense: Retreat Variation	1. d4 Nf6 2. c4 e6 3. g3 Bb4+ 4. Bd2 Be7 5. Bg2 d5 6. Nf3 O-O
E11	Bogo-Indian Defense: Retreat Variation	1. d4 Nf6 2. c4 e6 3. g3 Bb4+ 4. Bd2 Be7 5. Bg2 d5 6. Nf3 O-O 7. O-O
E11	Bogo-Indian Defense: Retreat Variation	1. d4 Nf6 2. c4 e6 3. g3 Bb4+ 4. Bd2 Be7 5. Bg2 d5 6. Nf3 O-O 7. Qc2 c6 8. O-O
E11	Bogo-Indian Defense: Retreat Variation	1. d4 Nf6 2. c4 e6 3. g3 Bb4+ 4. Bd2 Be7 5. Bg2 d5 6. Nf3 Nbd7 7. O-O O-O 8. Qc2 c6
E11	Bogo-Indian Defense: Retreat Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Bb4+ 5. Bd2 Be7 6. Bg2 O-O 7. O-O c6 8. Qc2 Nbd7 9. Bf4 b6 10. Nbd2
E11	Bogo-Indian Defense: Retreat Variation	1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Bb4+ 5. Bd2 Be7 6. Bg2 O-O 7. O-O c6 8. Qc2 Nbd7 9. Bf4 b6 10. Nbd2 Ba6
E11	Bogo-Indian Defense: Vitolins Variation	1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Bd2 c5
E11	Bogo-Indian Defense: Wade-Smyslov Variation	1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Bd2 a5
E12	Queen's Indian Defense	1. d4 Nf6 2. c4 e6 3. Nf3 b6
E12	Queen's Indian Defense: Kasparov Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. Nc3
E12	Queen's Indian Defense: Kasparov Variation, Botvinnik Attack	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. Nc3 Bb7 5. Bg5 h6 6. Bh4 g5 7. Bg3 Nh5
E12	Queen's Indian Defense: Kasparov-Petrosian Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3
E12	Queen's Indian Defense: Kasparov-Petrosian Variation, Andersson Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3 Ne4
E12	Queen's Indian Defense: Kasparov-Petrosian Variation, Classical Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3 d5 6. cxd5 exd5
E12	Queen's Indian Defense: Kasparov-Petrosian Variation, Hedgehog Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3 g6
E12	Queen's Indian Defense: Kasparov-Petrosian Variation, Kasparov Attack	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3 d5 6. cxd5 Nxd5 7. Qc2
E12	Queen's Indian Defense: Kasparov-Petrosian Variation, Main Line	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3 d5
E12	Queen's Indian Defense: Kasparov-Petrosian Variation, Marco Defense	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3 Be7
E12	Queen's Indian Defense: Kasparov-Petrosian Variation, Modern Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3 d5 6. cxd5 Nxd5
E12	Queen's Indian Defense: Kasparov-Petrosian Variation, Petrosian Attack	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3 d5 6. cxd5 Nxd5 7. e3
E12	Queen's Indian Defense: Kasparov-Petrosian Variation, Polovodin Gambit	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. Nc3 Bb7 5. a3 d5 6. cxd5 Nxd5 7. e4
E12	Queen's Indian Defense: Kasparov-Petrosian Variation, Rashkovsky Attack	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3 d5 6. cxd5 Nxd5 7. Qa4+
E12	Queen's Indian Defense: Kasparov-Petrosian Variation, Romanishin Attack	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3 d5 6. cxd5 Nxd5 7. Bd2
E12	Queen's Indian Defense: Miles Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. Bf4
E12	Queen's Indian Defense: Petrosian Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3
E12	Queen's Indian Defense: Petrosian Variation, Farago Defense	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Ba6 5. Qc2 Bb7
E13	Queen's Indian Defense: Kasparov Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. Nc3 Bb4 5. Bg5 h6 6. Bh4 Bb7
E14	Queen's Indian Defense: Averbakh Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. e3 Bb7 5. Bd3 c5 6. O-O Be7 7. b3 O-O 8. Bb2 cxd4 9. Nxd4
E14	Queen's Indian Defense: Spassky System	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. e3
E15	Queen's Indian Defense: Buerger Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 c5 6. d5 exd5 7. Ng5
E15	Queen's Indian Defense: Fianchetto Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3
E15	Queen's Indian Defense: Fianchetto Variation, Check Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. b3 Bb4+
E15	Queen's Indian Defense: Fianchetto Variation, Check Variation, Intermezzo Line	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. b3 Bb4+ 6. Bd2 Be7
E15	Queen's Indian Defense: Fianchetto Variation, Check Variation, Modern Line	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. b3 Bb4+ 6. Bd2 Qe7
E15	Queen's Indian Defense: Fianchetto Variation, Nimzowitsch Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6
E15	Queen's Indian Defense: Fianchetto Variation, Nimzowitsch Variation, Nimzowitsch Attack	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. Qa4
E15	Queen's Indian Defense: Fianchetto Variation, Nimzowitsch Variation, Quiet Line	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. b3
E15	Queen's Indian Defense: Fianchetto Variation, Nimzowitsch Variation, Timman's Line	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. Qb3
E15	Queen's Indian Defense: Fianchetto Variation, Rubinstein Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 c5 6. d5 exd5 7. Nh4
E15	Queen's Indian Defense: Fianchetto Variation, Sämisch Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 c5
E15	Queen's Indian Defense: Fianchetto Variation, Traditional Line	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7
E16	Queen's Indian Defense: Capablanca Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Bb4+
E16	Queen's Indian Defense: Riumin Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Bb4+ 6. Bd2 Be7
E16	Queen's Indian Defense: Yates Variation	1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Bd2 a5 5. g3 b6 6. Bg2 Bb7
E17	Queen's Indian Defense: Anti-Queen's Indian System	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. Nc3
E17	Queen's Indian Defense: Classical Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O
E17	Queen's Indian Defense: Classical Variation, Polugaevsky Gambit	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. d5 exd5 8. Nh4
E17	Queen's Indian Defense: Classical Variation, Taimanov Gambit	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. d5 exd5 8. Nd4
E17	Queen's Indian Defense: Euwe Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. b3
E17	Queen's Indian Defense: Fianchetto Variation, Kramnik Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. Re1
E17	Queen's Indian Defense: Opocensky Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. Nc3 Ne4 7. Bd2
E17	Queen's Indian Defense: Traditional Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7
E18	Queen's Indian Defense: Classical Variation, Tiviakov Defense	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. Nc3 Na6
E18	Queen's Indian Defense: Classical Variation, Traditional Variation	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. Nc3
E18	Queen's Indian Defense: Classical Variation, Traditional Variation, Nimzowitsch Line	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. Nc3 d5
E19	Queen's Indian Defense: Classical Variation, Traditional Variation, Main Line	1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. Nc3 Ne4 8. Qc2 Nxc3 9. Qxc3
E20	Nimzo-Indian Defense	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4
E20	Nimzo-Indian Defense: Dilworth Gambit	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e4
E20	Nimzo-Indian Defense: Kmoch Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. f3
E20	Nimzo-Indian Defense: Mikenas Attack	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qd3
E20	Nimzo-Indian Defense: Romanishin Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. g3
E20	Nimzo-Indian Defense: Romanishin Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 c5 5. g3 O-O 6. Bg2
E20	Nimzo-Indian Defense: Romanishin Variation, English Hybrid	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 c5 5. g3 cxd4 6. Nxd4 O-O 7. Bg2 d5 8. cxd5 Nxd5
E21	Nimzo-Indian Defense: Three Knights Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3
E21	Nimzo-Indian Defense: Three Knights Variation, Euwe Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 c5 5. d5 Ne4
E21	Nimzo-Indian Defense: Three Knights Variation, Korchnoi Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 c5 5. d5
E21	Nimzo-Indian Defense: Three Knights Variation, Shocron Gambit	1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Nc3 c5 5. d5 b5
E22	Nimzo-Indian Defense: Spielmann Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qb3
E23	Nimzo-Indian Defense: Spielmann Variation, Carlsbad Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qb3 c5 5. dxc5 Nc6 6. Nf3 Ne4 7. Bd2 Nxd2
E23	Nimzo-Indian Defense: Spielmann Variation, Romanovsky Gambit	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qb3 c5 5. dxc5 Nc6
E23	Nimzo-Indian Defense: Spielmann Variation, Stahlberg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qb3 c5 5. dxc5 Nc6 6. Nf3 Ne4 7. Bd2 Nxc5
E23	Nimzo-Indian Defense: Spielmann Variation, Stahlberg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qb3 c5 5. dxc5 Nc6 6. Nf3 Ne4 7. Bd2 Nxc5 8. Qc2 f5 9. g3
E24	Nimzo-Indian Defense: Sämisch Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. a3
E24	Nimzo-Indian Defense: Sämisch Variation, Botvinnik Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. f3 d5 5. a3 Bxc3+ 6. bxc3 c5 7. e3 O-O 8. cxd5 Nxd5
E25	Nimzo-Indian Defense: Sämisch Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. f3 d5 5. a3 Bxc3+ 6. bxc3 c5 7. cxd5
E25	Nimzo-Indian Defense: Sämisch Variation, Keres Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. f3 d5 5. a3 Bxc3+ 6. bxc3 c5 7. cxd5 Nxd5 8. dxc5
E25	Nimzo-Indian Defense: Sämisch Variation, Romanovsky Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. f3 d5 5. a3 Bxc3+ 6. bxc3 c5 7. cxd5 Nxd5 8. dxc5 f5
E26	Nimzo-Indian Defense: Sämisch Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. a3 Bxc3+ 5. bxc3 c5 6. e3
E26	Nimzo-Indian Defense: Sämisch Variation, O'Kelly Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. a3 Bxc3+ 5. bxc3 c5 6. e3 b6
E27	Nimzo-Indian Defense: Sämisch Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. a3 Bxc3+ 5. bxc3 O-O
E28	Nimzo-Indian Defense: Sämisch Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. a3 Bxc3+ 6. bxc3
E29	Nimzo-Indian Defense: Sämisch Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Bd3 Nc6 6. a3 Bxc3+ 7. bxc3 O-O
E29	Nimzo-Indian Defense: Sämisch Variation, Capablanca Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Bd3 Nc6 6. a3 Bxc3+ 7. bxc3 O-O 8. Ne2 b6 9. e4 Ne8
E30	Nimzo-Indian Defense: Leningrad Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Bg5
E30	Nimzo-Indian Defense: Leningrad Variation, Averbakh Gambit	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Bg5 h6 5. Bh4 c5 6. d5 b5
E31	Nimzo-Indian Defense: Leningrad Variation, Benoni Defense	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Bg5 h6 5. Bh4 c5 6. d5 d6
E32	Nimzo-Indian Defense: Classical Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2
E32	Nimzo-Indian Defense: Classical Variation, Keres Defense	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 O-O 5. a3 Bxc3+ 6. Qxc3 b6
E32	Nimzo-Indian Defense: Classical Variation, Vitolins-Adorjan Gambit	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 O-O 5. a3 Bxc3+ 6. Qxc3 b5
E33	Nimzo-Indian Defense: Classical Variation, Milner-Barry Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 Nc6 5. Nf3 d6
E33	Nimzo-Indian Defense: Classical Variation, Zurich Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 Nc6
E34	Nimzo-Indian Defense: Classical Variation, Belyavsky Gambit	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. cxd5 Qxd5 6. Nf3 Qf5 7. Qd1 e5
E34	Nimzo-Indian Defense: Classical Variation, Noa Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5
E35	Nimzo-Indian Defense: Classical Variation, Noa Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. cxd5 exd5
E36	Nimzo-Indian Defense: Classical Variation, Noa Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. a3
E36	Nimzo-Indian Defense: Classical Variation, Noa Variation, Botvinnik Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. a3 Bxc3+ 6. Qxc3 Nc6
E36	Nimzo-Indian Defense: Classical Variation, Noa Variation, Main Line	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. a3 Bxc3+ 6. Qxc3 Ne4
E36	Nimzo-Indian Defense: Classical Variation, Romanishin Gambit	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. a3 Bxc3+ 6. Qxc3 c5
E37	Nimzo-Indian Defense: Classical Variation, Modern Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. a3 Bxc3+ 6. Qxc3 Ne4 7. Qc2 c5
E37	Nimzo-Indian Defense: Classical Variation, Noa Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. a3 Bxc3+ 6. Qxc3 Ne4 7. Qc2
E37	Nimzo-Indian Defense: Classical Variation, Noa Variation, San Remo Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. a3 Bxc3+ 6. Qxc3 Ne4 7. Qc2 Nc6 8. e3 e5
E38	Nimzo-Indian Defense: Classical Variation, Berlin Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 c5
E38	Nimzo-Indian Defense: Classical Variation, Berlin Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 O-O 5. e3 d5 6. Nf3 c5
E38	Nimzo-Indian Defense: Classical Variation, Berlin Variation, Steiner Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 c5 5. dxc5 Bxc3+
E39	Nimzo-Indian Defense: Classical Variation, Berlin Variation, Macieja System	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 c5 5. dxc5 O-O 6. a3 Bxc5 7. Nf3 b6
E39	Nimzo-Indian Defense: Classical Variation, Berlin Variation, Pirc Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 c5 5. dxc5 O-O
E40	Nimzo-Indian Defense: Rubinstein System	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3
E40	Nimzo-Indian Defense: Rubinstein System, Taimanov Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 Nc6
E41	Nimzo-Indian Defense: Rubinstein System	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5
E41	Nimzo-Indian Defense: Rubinstein System, Hübner Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Bd3 Nc6 6. Nf3 Bxc3+ 7. bxc3 d6
E41	Nimzo-Indian Defense: Rubinstein System, Hübner Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Bd3 Nc6 6. Nf3 Bxc3+ 7. bxc3 d6 8. O-O O-O
E42	Nimzo-Indian Defense: Rubinstein System, Rubinstein Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Ne2
E42	Nimzo-Indian Defense: Rubinstein System, Rubinstein Variation, Main Line	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Ne2 cxd4 6. exd4 O-O 7. a3
E42	Nimzo-Indian Defense: Rubinstein System, Rubinstein Variation, Sherbakov Attack	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Ne2 cxd4 6. exd4 O-O 7. c5
E43	Nimzo-Indian Defense: St. Petersburg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6
E43	Nimzo-Indian Defense: St. Petersburg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Bd3 Bb7 6. Nf3
E43	Nimzo-Indian Defense: St. Petersburg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Bd3 Bb7 6. Nf3 O-O
E43	Nimzo-Indian Defense: St. Petersburg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Bd3 Bb7 6. Nf3 O-O 7. O-O
E43	Nimzo-Indian Defense: St. Petersburg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Bd3 Bb7 6. Nf3 O-O 7. O-O c5
E43	Nimzo-Indian Defense: St. Petersburg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Bd3 Bb7 6. Nf3 O-O 7. O-O c5 8. Na4 cxd4 9. a3 Be7
E43	Nimzo-Indian Defense: St. Petersburg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 Ne4 5. Qc2 f5 6. Nf3 b6 7. Bd3 Bb7
E43	Nimzo-Indian Defense: St. Petersburg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 c5 6. Nf3 b6 7. O-O Bb7 8. Na4 Qe7
E43	Nimzo-Indian Defense: St. Petersburg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 Bxc3+ 5. bxc3 b6 6. e3 Bb7 7. Bd3 O-O 8. O-O
E43	Nimzo-Indian Defense: St. Petersburg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 b6 5. e3 Ne4 6. Qc2
E43	Nimzo-Indian Defense: St. Petersburg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 b6 5. e3 Ne4 6. Qc2 Bb7 7. Bd3 Bxc3+ 8. bxc3 f5 9. O-O
E43	Nimzo-Indian Defense: St. Petersburg Variation, with Ne4	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Bd3 Bb7 6. Nf3 Ne4
E44	Nimzo-Indian Defense: St. Petersburg Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Ne2
E44	Nimzo-Indian Defense: St. Petersburg Variation, American Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Ne2 Ne4
E44	Nimzo-Indian Defense: St. Petersburg Variation, Romanishin–Psakhis Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Ne2 c5 6. a3 Ba5
E45	Nimzo-Indian Defense: St. Petersburg Variation, Fischer Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Ne2 Ba6
E46	Nimzo-Indian Defense: Normal Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O
E46	Nimzo-Indian Defense: Reshevsky Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Ne2
E46	Nimzo-Indian Defense: Simagin Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Ne2 d5 6. a3 Bd6
E47	Nimzo-Indian Defense: Normal Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3
E48	Nimzo-Indian Defense: Normal Variation, Classical Defense	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5
E48	Nimzo-Indian Defense: Ragozin Defense	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 Nc6 7. O-O
E49	Nimzo-Indian Defense: Normal Variation, Botvinnik System	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. a3 Bxc3+ 7. bxc3
E50	Nimzo-Indian Defense	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Nf3
E51	Nimzo-Indian Defense: Normal Variation, Ragozin Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Nf3 d5
E51	Nimzo-Indian Defense: Normal Variation, Sämisch Deferred	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Nf3 d5 6. a3
E51	Nimzo-Indian Defense: Ragozin Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 Nc6 7. O-O dxc4
E52	Nimzo-Indian Defense: Normal Variation, Schlechter Defense	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 b6
E52	Nimzo-Indian Defense: Normal Variation, Schlechter Defense	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Bd3 Bb7 6. Nf3 O-O 7. O-O d5
E53	Nimzo-Indian Defense: Normal Variation, Gligoric System	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5
E53	Nimzo-Indian Defense: Normal Variation, Gligoric System	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O Nbd7
E53	Nimzo-Indian Defense: Normal Variation, Gligoric System, Keres Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O b6
E54	Nimzo-Indian Defense: Normal Variation, Gligoric System, Exchange Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O dxc4 8. Bxc4
E54	Nimzo-Indian Defense: Normal Variation, Gligoric System, Smyslov Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O dxc4 8. Bxc4 Qe7
E55	Nimzo-Indian Defense: Normal Variation, Gligoric System, Bronstein Variation	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O dxc4 8. Bxc4 Nbd7
E56	Nimzo-Indian Defense: Normal Variation, Gligoric System, Bernstein Defense	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O Nc6
E58	Nimzo-Indian Defense: Normal Variation, Bernstein Defense, Exchange Line	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O Nc6 8. a3 Bxc3 9. bxc3
E59	Nimzo-Indian Defense: Normal Variation, Bernstein Defense	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O Nc6 8. a3 Bxc3 9. bxc3 dxc4 10. Bxc4
E59	Nimzo-Indian Defense: Normal Variation, Bernstein Defense	1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. a3 Bxc3+ 7. bxc3 dxc4 8. Bxc4 c5 9. Nf3 Nc6 10. O-O Qc7 11. Qc2
E60	Grünfeld Defense: Counterthrust Variation	1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 d5
E60	Indian Defense: Anti-Grünfeld, Adorjan Gambit	1. d4 Nf6 2. c4 g6 3. d5 b5
E60	Indian Defense: Anti-Grünfeld, Advance Variation	1. d4 Nf6 2. c4 g6 3. d5
E60	Indian Defense: Anti-Grünfeld, Alekhine Variation	1. d4 Nf6 2. c4 g6 3. f3
E60	Indian Defense: Anti-Grünfeld, Alekhine Variation, Leko Gambit	1. d4 Nf6 2. c4 g6 3. f3 e5
E60	Indian Defense: Anti-Grünfeld, Basman-Williams Attack	1. d4 Nf6 2. c4 g6 3. h4
E60	Indian Defense: West Indian Defense	1. d4 Nf6 2. c4 g6
E60	King's Indian Defense: Fianchetto Variation	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3
E60	King's Indian Defense: Fianchetto Variation, Immediate Fianchetto	1. d4 Nf6 2. c4 g6 3. g3
E60	King's Indian Defense: Normal Variation, King's Knight Variation	1. d4 Nf6 2. Nf3 g6 3. c4
E60	King's Indian Defense: Santasiere Variation	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. b4
E60	King's Indian Defense: Semi-Classical Variation, Benoni Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. Nf3 O-O 5. e3 d6 6. Be2 c6
E60	King's Indian Defense: Semi-Classical Variation, Hollywood Variation	1. d4 Nf6 2. Nf3 g6 3. c4 Bg7 4. Nc3 O-O 5. e3 d6 6. Be2 Nc6
E60	Queen's Pawn, Mengarini Attack	1. d4 Nf6 2. c4 g6 3. Qc2
E61	King's Indian Defense	1. d4 Nf6 2. c4 g6 3. Nc3
E61	King's Indian Defense: Fianchetto Variation, Benjamin Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. Nf3 d6 5. g3 O-O 6. Bg2 c6 7. O-O Qb6
E61	King's Indian Defense: Semi-Classical Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. Nf3 O-O 5. e3 d6 6. Be2
E61	King's Indian Defense: Semi-Classical Variation, Exchange Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. Nf3 O-O 5. e3 d6 6. Be2 Nbd7 7. O-O e5 8. dxe5 dxe5
E61	King's Indian Defense: Semi-Classical Variation, Queenside Storm Line	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. Nf3 O-O 5. e3 d6 6. Be2 Nbd7 7. O-O e5 8. b4
E61	King's Indian Defense: Smyslov Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. Nf3 d6 5. Bg5
E62	King's Indian Defense: Fianchetto Variation, Carlsbad Variation	1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 O-O 5. Nc3 d6 6. Nf3 Nc6
E62	King's Indian Defense: Fianchetto Variation, Delayed Fianchetto	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. Nf3 d6 5. g3
E62	King's Indian Defense: Fianchetto Variation, Kavalek Defense	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O c6 7. Nc3 Qa5
E62	King's Indian Defense: Fianchetto Variation, Larsen Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. Nf3 d6 5. g3 O-O 6. Bg2 c6 7. O-O Bf5
E62	King's Indian Defense: Fianchetto Variation, Lesser Simagin (Spassky)	1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 O-O 5. Nc3 d6 6. Nf3 Nc6 7. O-O Bf5
E62	King's Indian Defense: Fianchetto Variation, Simagin Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. Nf3 d6 5. g3 O-O 6. Bg2 Nc6 7. O-O Bg4
E62	King's Indian Defense: Fianchetto Variation, Uhlmann-Szabo System	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O Nc6 7. Nc3 e5
E63	King's Indian Defense: Fianchetto Variation, Panno Variation	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O Nc6 7. Nc3 a6
E63	King's Indian Defense: Fianchetto Variation, Panno Variation, Blockade Line	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O Nc6 7. Nc3 a6 8. d5 Na5 9. Nd2 c5 10. Qc2 e5
E63	King's Indian Defense: Fianchetto Variation, Panno Variation, Donner Line	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O Nc6 7. Nc3 a6 8. d5 Na5 9. Nd2 c5 10. Qc2 Rb8 11. b3 b5 12. Bb2 bxc4 13. bxc4 Bh6
E63	King's Indian Defense: Fianchetto Variation, Panno Variation, Korchnoi Line	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O Nc6 7. Nc3 a6 8. h3 Rb8 9. Be3 b5 10. Nd2
E64	King's Indian Defense: Fianchetto Variation, Double Fianchetto Attack	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 d6 5. Bg2 O-O 6. O-O Nbd7 7. Nc3 e5 8. b3
E64	King's Indian Defense: Fianchetto Variation, Hungarian Variation	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 d6 5. Bg2 O-O 6. O-O Nbd7 7. Nc3 a6
E64	King's Indian Defense: Fianchetto Variation, Pterodactyl Variation	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 c5 5. Bg2 Qa5+
E64	King's Indian Defense: Fianchetto Variation, Yugoslav System	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 d6 5. Bg2 O-O 6. O-O c5
E64	King's Indian Defense: Fianchetto Variation, Yugoslav Variation, Rare Line	1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 O-O 5. Nc3 d6 6. Nf3 c5
E65	King's Indian Defense: Fianchetto Variation, Yugoslav Variation	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O c5 7. Nc3
E65	King's Indian Defense: Fianchetto Variation, Yugoslav Variation, Exchange Line	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O c5 7. Nc3 Nc6 8. dxc5 dxc5
E66	King's Indian Defense: Fianchetto Variation, Yugoslav Variation, Advance Line	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O c5 7. Nc3 Nc6 8. d5
E67	King's Indian Defense: Fianchetto Variation, Classical Fianchetto	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O Nbd7 7. Nc3 e5
E67	King's Indian Defense: Fianchetto Variation, Debrecen Defense	1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 O-O 5. Nc3 d6 6. Nf3 Nbd7
E68	King's Indian Defense: Fianchetto Variation, Classical Variation	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O Nbd7 7. Nc3 e5 8. e4
E68	King's Indian Defense: Fianchetto Variation, Long Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. Nf3 d6 5. g3 O-O 6. Bg2 Nbd7 7. O-O e5 8. e4 Re8 9. h3 exd4 10. Nxd4 Nc5 11. Re1 a5
E69	King's Indian Defense: Fianchetto Variation, Classical Main Line	1. d4 Nf6 2. c4 g6 3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O Nbd7 7. Nc3 e5 8. e4 c6 9. h3
E70	King's Indian Defense: Accelerated Averbakh Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Bg5
E70	King's Indian Defense: Kramer Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nge2
E70	King's Indian Defense: Normal Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4
E70	King's Indian Defense: Normal Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6
E71	King's Indian Defense: Makogonov Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. h3
E72	King's Indian Defense: Normal Variation, Deferred Fianchetto	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. g3
E72	King's Indian Defense: Pomar System	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. g3 O-O 6. Bg2 e5 7. Nge2
E73	King's Indian Defense: Averbakh Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5
E73	King's Indian Defense: Averbakh Variation, Flexible Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5 h6
E73	King's Indian Defense: Averbakh Variation, Geller Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5 Nbd7
E73	King's Indian Defense: Averbakh Variation, Modern Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5 Na6
E73	King's Indian Defense: Averbakh Variation, Modern Defense, Burgess Line	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5 Na6 7. Qd2 c6
E73	King's Indian Defense: Averbakh Variation, Nc6 Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5 Nc6
E73	King's Indian Defense: Averbakh Variation, Spanish Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5 a6
E73	King's Indian Defense: Normal Variation, Standard Development	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2
E73	King's Indian Defense: Semi-Averbakh System	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Be3
E74	King's Indian Defense: Averbakh Variation, Benoni Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5 c5
E74	King's Indian Defense: Averbakh Variation, Benoni Defense, Advance Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5 c5 7. d5
E74	King's Indian Defense: Averbakh Variation, Benoni Defense, Exchange Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5 c5 7. dxc5
E75	King's Indian Defense: Averbakh Variation, Main Line	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5 c5 7. d5 e6
E76	King's Indian Defense: Four Pawns Attack	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f4
E76	King's Indian Defense: Four Pawns Attack, Dynamic Attack	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f4 O-O 6. Nf3 c5 7. d5
E76	King's Indian Defense: Four Pawns Attack, Modern Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f4 Na6
E77	King's Indian Defense: Four Pawns Attack	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. f4
E77	King's Indian Defense: Four Pawns Attack, Florentine Gambit	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f4 O-O 6. Nf3 c5 7. d5 e6 8. Be2 exd5 9. e5
E77	King's Indian Defense: Four Pawns Attack, Normal Attack	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f4 O-O 6. Nf3 c5 7. d5 e6 8. Be2
E77	King's Indian Defense: Six Pawns Attack	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f4 O-O 6. Be2 c5 7. d5 e6 8. dxe6 fxe6 9. g4 Nc6 10. h4
E78	King's Indian Defense: Four Pawns Attack, Fluid Attack	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f4 O-O 6. Nf3 c5 7. Be2
E79	King's Indian Defense: Four Pawns Attack, Exchange Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f4 O-O 6. Nf3 c5 7. Be2 cxd4 8. Nxd4 Nc6 9. Be3
E80	King's Indian Defense: Sämisch Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3
E81	King's Indian Defense: Steiner Attack	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Bg5
E81	King's Indian Defense: Sämisch Variation, Bobotsov-Korchnoi-Petrosian Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Nge2
E81	King's Indian Defense: Sämisch Variation, Byrne Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 c6 7. Bd3 a6
E81	King's Indian Defense: Sämisch Variation, Normal Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O
E81	King's Indian Defense: Sämisch Variation, Sämisch Gambit	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 c5
E81	King's Indian Defense: Sämisch Variation, with Bg5	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Bg5 c5 7. d5 h6 8. Bf4
E81	King's Indian Defense: Sämisch Variation, with Bg5	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Bg5 c5 7. d5 e6 8. Qd2 exd5 9. Nxd5
E81	King's Indian Defense: Sämisch Variation, with Bg5	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Bg5 c5 7. d5 e6 8. Qd2 h6 9. Bxh6
E82	King's Indian Defense: Sämisch Variation, Double Fianchetto	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 b6
E83	King's Indian Defense: Sämisch Variation, Panno Formation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 Nc6 7. Nge2 a6
E83	King's Indian Defense: Sämisch Variation, Ruban Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 Nc6 7. Nge2 Rb8
E83	King's Indian Defense: Sämisch Variation, Yates Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 Nc6
E84	King's Indian Defense: Sämisch Variation, Panno Main Line	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 Nc6 7. Nge2 a6 8. Qd2 Rb8
E85	King's Indian Defense: Sämisch Variation, Orthodox Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 e5
E86	King's Indian Defense: Sämisch Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 e5 7. Nge2 c6
E87	King's Indian Defense: Sämisch Variation, Bronstein Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 e5 7. d5 Nh5 8. Qd2 Qh4+ 9. g3 Nxg3 10. Qf2 Nxf1 11. Qxh4 Nxe3 12. Ke2
E87	King's Indian Defense: Sämisch Variation, Closed Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 e5 7. d5
E87	King's Indian Defense: Sämisch Variation, Orthodox Variation, Bronstein Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 e5 7. d5 Nh5 8. Qd2 Qh4+ 9. g3 Nxg3 10. Qf2 Nxf1 11. Qxh4 Nxe3 12. Ke2 Nxc4
E89	King's Indian Defense: Sämisch Variation, Closed Variation, Main Line	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 e5 7. Nge2 c6 8. d5 cxd5
E90	King's Indian Defense: Larsen Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be3
E90	King's Indian Defense: Normal Variation, Rare Defenses	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3
E90	King's Indian Defense: Zinnowitz Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Bg5
E91	King's Indian Defense: Kazakh Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 Na6
E91	King's Indian Defense: Orthodox Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2
E92	King's Indian Defense: Exchange Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. dxe5
E92	King's Indian Defense: Orthodox Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5
E92	King's Indian Defense: Orthodox Variation, Gligoric-Taimanov System	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. Be3
E92	King's Indian Defense: Petrosian Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. d5
E92	King's Indian Defense: Petrosian Variation, Stein Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. d5 a5
E93	King's Indian Defense: Petrosian Variation, Keres Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. d5 Nbd7 8. Bg5 h6 9. Bh4 g5 10. Bg3 Nh5 11. h4
E93	King's Indian Defense: Petrosian Variation, Normal Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. d5 Nbd7
E94	King's Indian Defense: Orthodox Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O
E94	King's Indian Defense: Orthodox Variation, Donner Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O c6
E94	King's Indian Defense: Orthodox Variation, Glek Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Na6
E94	King's Indian Defense: Orthodox Variation, Positional Defense	1. d4 Nf6 2. c4 d6 3. Nc3 Nbd7 4. e4 e5 5. Nf3 g6 6. Be2 Bg7 7. O-O O-O
E94	King's Indian Defense: Orthodox Variation, Positional Defense, Closed Line	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 Nbd7 7. O-O e5 8. d5
E94	King's Indian Defense: Orthodox Variation, Ukrainian Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O a5
E95	King's Indian Defense: Orthodox Variation	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nbd7 8. Re1
E96	King's Indian Defense: Orthodox Variation, Positional Defense, Main Line	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nbd7 8. Re1 c6 9. Bf1 a5
E97	King's Indian Defense: Orthodox Variation, Aronin-Taimanov Defense	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6
E97	King's Indian Defense: Orthodox Variation, Bayonet Attack	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. b4
E97	King's Indian Defense: Orthodox Variation, Bayonet Attack, Sokolov's Line	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. b4 Nh5 10. Re1
E97	King's Indian Defense: Orthodox Variation, Bayonet Attack, Yepishin's Line	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. b4 Nh5 10. Qc2
E97	King's Indian Defense: Orthodox Variation, Korchnoi Attack	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Bd2
E97	King's Indian Defense: Orthodox Variation, Modern System	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Nd2
E98	King's Indian Defense: Orthodox Variation, Classical System	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1
E98	King's Indian Defense: Orthodox Variation, Classical System, Kozul Gambit	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1 Nd7 10. Be3 f5 11. f3 f4 12. Bf2 g5 13. Rc1 Ng6 14. c5
E98	King's Indian Defense: Orthodox Variation, Classical System, Neo-Classical Line	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1 Nd7 10. Be3
E99	King's Indian Defense: Orthodox Variation, Classical System, Benko Attack	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1 Nd7 10. f3 f5 11. g4
E99	King's Indian Defense: Orthodox Variation, Classical System, Traditional Line	1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1 Nd7 10. f3 f5
`,
  Uo = [jo, Ho, $o, Wo, qo];
function qi() {
  return { children: new Map(), labels: [] };
}
function Qa(n) {
  n.labels.sort((e, t) =>
    e.eco !== t.eco ? (e.eco < t.eco ? -1 : 1) : e.name !== t.name ? (e.name < t.name ? -1 : 1) : 0,
  );
  for (const e of n.children.values()) Qa(e);
}
function Zo(n) {
  const t = n
      .replaceAll(/\{[^}]*\}/g, " ")
      .replaceAll(/\([^)]*\)/g, " ")
      .replaceAll(/\r?\n/g, " ")
      .split(/\s+/g)
      .map((a) => a.trim())
      .filter(Boolean),
    i = [];
  for (let a of t)
    /^(1-0|0-1|1\/2-1\/2|\*)$/.test(a) ||
      /^\d+\.(\.\.)?$/.test(a) ||
      ((a = a.replace(/^\d+\.(\.\.)?/, "")), (a = a.replaceAll(/[!?]+$/g, "")), a && i.push(a));
  return i;
}
function Yo(n) {
  const e = new Te(),
    t = Zo(n),
    i = [];
  for (const a of t) {
    const c = e.move(a, { sloppy: !0 });
    if (!c) return [];
    const s = `${c.from}${c.to}${c.promotion ?? ""}`;
    i.push(s);
  }
  return i;
}
function Jo() {
  const n = qi();
  for (const e of Uo) {
    const t = e.split(/\r?\n/);
    for (let i = 1; i < t.length; i += 1) {
      const a = t[i]?.trim();
      if (!a) continue;
      const [c, s, o] = a.split("	"),
        d = c?.trim(),
        N = s?.trim(),
        l = o?.trim();
      if (!d || !N || !l) continue;
      const u = Yo(l);
      if (u.length === 0) continue;
      let f = n;
      for (const B of u) {
        let b = f.children.get(B);
        (b || ((b = qi()), f.children.set(B, b)), (f = b));
      }
      f.labels.push({ eco: d, name: N });
    }
  }
  return (Qa(n), n);
}
const Xo = Jo();
function ed(n) {
  let e = Xo,
    t = null;
  for (let i = 0; i < n.length; i += 1) {
    const a = n[i];
    if (((e = e.children.get(a)), !e)) break;
    e.labels.length > 0 && (t = { label: e.labels[0], matchedPlies: i + 1 });
  }
  return t ? { eco: t.label.eco, name: t.label.name, matchedPlies: t.matchedPlies } : null;
}
function td() {
  return {
    newGame: id,
    makeMove: ad,
    undoPlies: cd,
    resign: rd,
    getLegalMoves: sd,
    isLegalMove: od,
    detectPhase: Ra,
    getPositionInfo: dd,
  };
}
const nd = new Te().fen();
function id() {
  const n = new Te();
  return bn(n, [], n.fen());
}
function ad(n, e, t, i) {
  const a = new Te(n.fen);
  try {
    const c = a.move({ from: e, to: t, promotion: i });
    if (!c) return { success: !1, error: "Invalid move" };
    const s = ld(c, a);
    return { success: !0, state: bn(a, [...n.moveHistory, s], n.startFen), moveInfo: s };
  } catch (c) {
    return { success: !1, error: c instanceof Error ? c.message : "Unknown error" };
  }
}
function cd(n, e) {
  if (e < 1) return { success: !1, error: "Must undo at least 1 ply" };
  if (n.moveHistory.length < e)
    return { success: !1, error: `Not enough moves to undo (need at least ${e})` };
  const t = n.moveHistory.slice(0, -e),
    i = fd(n.startFen, t);
  return { success: !0, state: bn(i, t, n.startFen), moveInfo: n.moveHistory.at(-e) };
}
function rd(n, e) {
  if (n.status !== "playing") throw new T("Game is not in progress");
  return { ...n, status: "resigned", winner: e === "white" ? "black" : "white" };
}
function sd(n) {
  return new Te(n.fen)
    .moves({ verbose: !0 })
    .map((t) => ({ from: t.from, to: t.to, promotion: t.promotion }));
}
function od(n, e, t) {
  return new Te(n.fen).moves({ square: e, verbose: !0 }).some((c) => c.to === t);
}
function Ra(n) {
  const t = new Te(n.fen).board().flat().filter(Boolean),
    i = t.length,
    a = t.filter((N) => N && N.type !== "p" && N.type !== "k").length,
    c = { n: 3, b: 3, r: 5, q: 9 },
    s = t.reduce((N, l) => (!l || l.type === "p" || l.type === "k" ? N : N + (c[l.type] ?? 0)), 0),
    o = n.moveHistory.length,
    d = n.openingMatch;
  return s <= 20 || a <= 6 || i <= 12
    ? "endgame"
    : n.fullMoveNumber <= 10 || (d && d.matchedPlies === o && n.fullMoveNumber <= 14)
      ? "opening"
      : "middlegame";
}
function dd(n) {
  const t = new Te(n.fen).board().flat().filter(Boolean),
    i = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let a = 0,
    c = 0,
    s = 0,
    o = 0;
  for (const d of t) {
    if (!d) continue;
    const N = i[d.type] || 0;
    d.color === "w" ? ((a += N), s++) : ((c += N), o++);
  }
  return {
    materialBalance: a - c,
    pieceCount: { white: s, black: o },
    isEndgame: n.phase === "endgame",
  };
}
function fd(n, e) {
  const t = new Te(n);
  for (const i of e) t.move({ from: i.move.from, to: i.move.to, promotion: i.move.promotion });
  return t;
}
function Nd(n) {
  const e = n.move.promotion ?? "";
  return `${n.move.from}${n.move.to}${e}`;
}
function bn(n, e = [], t) {
  const i = n.isCheckmate(),
    a = n.isStalemate(),
    c = n.isDraw();
  let s = "playing",
    o = null;
  i
    ? ((s = "checkmate"), (o = n.turn() === "w" ? "black" : "white"))
    : a
      ? ((s = "stalemate"), (o = "draw"))
      : c && ((s = "draw"), (o = "draw"));
  const d = n.fen(),
    N = d.split(" "),
    l = Number.parseInt(N[4] ?? "0", 10) || 0,
    u = Number.parseInt(N[5] ?? "1", 10) || 1,
    f = t ?? n.fen(),
    B = f === nd ? ed(e.map(Nd)) : null,
    b = {
      fen: d,
      pgn: n.pgn(),
      turn: n.turn() === "w" ? "white" : "black",
      phase: "opening",
      status: s,
      fullMoveNumber: u,
      halfMoveClock: l,
      isCheck: n.isCheck(),
      isCheckmate: i,
      isStalemate: a,
      isDraw: c,
      isInsufficientMaterial: n.isInsufficientMaterial(),
      isThreefoldRepetition: n.isThreefoldRepetition(),
      winner: o,
      moveHistory: e,
      startFen: f,
      openingMatch: B,
    };
  return ((b.phase = Ra(b)), b);
}
function ld(n, e) {
  return {
    by: n.color === "w" ? "white" : "black",
    move: { piece: n.piece, from: n.from, to: n.to, promotion: n.promotion },
    piece: n.piece,
    san: n.san,
    captured: n.captured,
    isCheck: e.isCheck(),
    isCheckmate: e.isCheckmate(),
    isStalemate: e.isStalemate(),
    isCastling: n.isKingsideCastle() || n.isQueensideCastle(),
    isEnPassant: n.isEnPassant(),
    isPromotion: n.isPromotion(),
    promotionPiece: n.promotion ?? void 0,
  };
}
function gd(n) {
  const e = new Te(n);
  return bn(e, [], e.fen());
}
const Pa = Nt(["white", "black"]);
Nt(["opening", "middlegame", "endgame"]);
Nt(["playing", "checkmate", "stalemate", "draw", "resigned"]);
const La = Nt(["sleepy", "casual", "normal", "focused", "serious"]);
Nt(["normal", "tutorial"]);
const hd = tc("mode", [
    Ge({ mode: Ni("tutorial") }),
    Ge({ mode: Ni("normal"), side: Pa, difficulty: La }),
  ]),
  Bd = Nt(["p", "n", "b", "r", "q", "k"]),
  Ka = Nt(["q", "r", "b", "n"]),
  Ui = Nt([
    "a8",
    "b8",
    "c8",
    "d8",
    "e8",
    "f8",
    "g8",
    "h8",
    "a7",
    "b7",
    "c7",
    "d7",
    "e7",
    "f7",
    "g7",
    "h7",
    "a6",
    "b6",
    "c6",
    "d6",
    "e6",
    "f6",
    "g6",
    "h6",
    "a5",
    "b5",
    "c5",
    "d5",
    "e5",
    "f5",
    "g5",
    "h5",
    "a4",
    "b4",
    "c4",
    "d4",
    "e4",
    "f4",
    "g4",
    "h4",
    "a3",
    "b3",
    "c3",
    "d3",
    "e3",
    "f3",
    "g3",
    "h3",
    "a2",
    "b2",
    "c2",
    "d2",
    "e2",
    "f2",
    "g2",
    "h2",
    "a1",
    "b1",
    "c1",
    "d1",
    "e1",
    "f1",
    "g1",
    "h1",
  ]);
Ge({ piece: Bd, from: Ui, to: Ui, promotion: Ka.optional() });
const ud = [
    { id: "player_pawn_opens", mover: "player", move: { from: "e2", to: "e4" } },
    { id: "agent_pawn_mirrors", mover: "agent", move: { from: "e7", to: "e5" } },
    { id: "player_knight_develops", mover: "player", move: { from: "g1", to: "f3" } },
    { id: "agent_knight_defends", mover: "agent", move: { from: "b8", to: "c6" } },
    { id: "player_bishop_aims", mover: "player", move: { from: "f1", to: "c4" } },
    { id: "agent_bishop_mirrors", mover: "agent", move: { from: "f8", to: "c5" } },
    { id: "player_pawn_supports", mover: "player", move: { from: "c2", to: "c3" } },
    { id: "agent_knight_counters", mover: "agent", move: { from: "g8", to: "f6" } },
    { id: "player_pawn_strikes", mover: "player", move: { from: "d2", to: "d4" } },
    { id: "agent_pawn_captures", mover: "agent", move: { from: "e5", to: "d4" } },
    { id: "player_pawn_recaptures", mover: "player", move: { from: "c3", to: "d4" } },
    { id: "agent_bishop_checks", mover: "agent", move: { from: "c5", to: "b4" } },
    { id: "player_blocks_check", mover: "player", move: { from: "c1", to: "d2" } },
    { id: "agent_trades_bishops", mover: "agent", move: { from: "b4", to: "d2" } },
    { id: "player_knight_recaptures", mover: "player", move: { from: "b1", to: "d2" } },
    { id: "agent_frees_bishop", mover: "agent", move: { from: "d7", to: "d6" } },
    { id: "player_castles", mover: "player", move: { from: "e1", to: "g1" } },
    { id: "agent_castles", mover: "agent", move: { from: "e8", to: "g8" } },
    { id: "player_rook_guards", mover: "player", move: { from: "f1", to: "e1" } },
    { id: "agent_rook_mirrors", mover: "agent", move: { from: "f8", to: "e8" } },
    { id: "player_queen_develops", mover: "player", move: { from: "d1", to: "b3" } },
    { id: "agent_queen_connects", mover: "agent", move: { from: "d8", to: "d7" } },
  ],
  Zt = ac(ud),
  bd = Zt.firstStep,
  md = { playerSide: "white", difficulty: "sleepy" },
  Ma = Zt.isScriptedStep,
  xd = Zt.stepEvent;
function Ia(n) {
  const e = Zt.getGateSkeleton(n);
  return e.kind !== "scripted" ? e : { kind: "move", from: e.move.from, to: e.move.to };
}
function Dd(n, e, t) {
  const i = Ia(n);
  switch (i.kind) {
    case "free":
      return !0;
    case "wait":
      return "Tutorial: wait — it is not your move yet.";
    case "move":
      return e === i.from && t === i.to
        ? !0
        : `Tutorial: this step asks you to move ${i.from} to ${i.to} (got ${e} to ${t}).`;
    default:
      return i;
  }
}
const pd = Zt.advanceStep;
var Zi = {};
const on = { playerSide: "white", difficulty: "casual", locale: "en" },
  re = {
    game_start: (n, e) => ({ type: "game_start", playerSide: n, difficulty: e }),
    move: (n, e) => ({ type: "move", by: n, details: e }),
    check: (n, e) => ({ type: "check", by: n, from: e }),
    capture: (n, e, t) => ({ type: "capture", by: n, from: e, captured: t }),
    castling: (n, e) => ({ type: "castling", by: n, side: e }),
    promotion: (n, e, t) => ({ type: "promotion", by: n, from: e, promotion: t }),
    game_over: (n, e, t) => ({ type: "game_over", result: n, winner: e, playerSide: t }),
    draw_offer: (n) => ({ type: "draw_offer", side: n }),
    cancel_draw_offer: (n) => ({ type: "cancel_draw_offer", side: n }),
    respond_draw: (n, e) => ({ type: "respond_draw", respondSide: n, accept: e }),
    request_takeback: (n) => ({ type: "request_takeback", side: n }),
    cancel_takeback_request: (n) => ({ type: "cancel_takeback_request", side: n }),
    respond_takeback: (n, e) => ({ type: "respond_takeback", respondSide: n, accept: e }),
    history_rewound: (n, e, t, i) => ({
      type: "history_rewound",
      pliesUndone: n,
      prevPly: e,
      nextPly: t,
      fen: i,
    }),
    debug_scenario_loaded: (n, e, t) => ({
      type: "debug_scenario_loaded",
      scenarioId: n,
      startPly: e,
      fen: t,
    }),
    tutorial_step: (n) => xd(n),
  },
  Od = { player: {}, agent: {} },
  Cd = { ui: { actors: ["player", "agent"] } },
  Qe = cc({
    startGame: {
      actors: ["player", "agent"],
      schema: hd,
      input: (n) => n,
      result: (n) => ({ success: n }),
    },
    move: {
      actors: ["player", "agent"],
      schema: Ge({ from: St(), to: St(), promotion: Ka.optional() }),
      input: (n, e, t) => ({ from: n, to: e, promotion: t }),
      result: (n, e) => ({ success: n, move: e }),
    },
    resign: {
      actors: ["player", "agent"],
      schema: Ge({}),
      input: () => ({}),
      result: (n) => ({ success: n }),
    },
    offerDraw: {
      actors: ["player", "agent"],
      schema: Ge({}),
      input: () => ({}),
      result: (n) => ({ success: n }),
    },
    cancelDrawOffer: {
      actors: ["player", "agent"],
      schema: Ge({}),
      input: () => ({}),
      result: (n) => ({ success: n }),
    },
    respondDraw: {
      actors: ["player", "agent"],
      schema: Ge({ accept: gi() }),
      input: (n) => ({ accept: n }),
      result: (n) => ({ success: n }),
    },
    requestTakeback: {
      actors: ["player", "agent"],
      schema: Ge({}),
      input: () => ({}),
      result: (n) => ({ success: n }),
    },
    cancelTakebackRequest: {
      actors: ["player", "agent"],
      schema: Ge({}),
      input: () => ({}),
      result: (n) => ({ success: n }),
    },
    respondTakeback: {
      actors: ["player", "agent"],
      schema: Ge({ accept: gi() }),
      input: (n) => ({ accept: n }),
      result: (n) => ({ success: n }),
    },
    debugLoadScenario: {
      actors: ["player", "agent"],
      schema: Ge({
        id: St(),
        settings: Ge({ playerSide: Pa, difficulty: La, locale: St().optional() }),
        startFen: St(),
        startPly: li().int().min(0),
        script: nc(Ge({ uci: St(), durationMs: li().int().min(0).optional() })),
      }),
      input: (n) => n,
      result: (n) => ({ success: n }),
    },
  }),
  Ft = td();
function Yi() {
  return Zi.ARCADE_TEST === "1" || Zi.ARCADE_ENABLE_CHESS_DEBUG_HARNESS === "1";
}
function Vd(n) {
  const e = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(n);
  if (!e) throw new Error(`Invalid UCI move: ${n}`);
  return { from: e[1], to: e[2], promotion: e[3] ?? void 0 };
}
function Sd(n) {
  const e = n.move.promotion ?? "";
  return `${n.move.from}${n.move.to}${e}`;
}
function Ji(n) {
  return n === "white" ? "black" : "white";
}
function Ta(n) {
  return n === "player";
}
function bt(n, e) {
  return Ta(e) ? n.settings.playerSide : n.settings.playerSide === "white" ? "black" : "white";
}
function Xi(n, e, t) {
  let i = 0;
  for (let a = n.length - 1; a >= 0; a -= 1) {
    const c = n[a];
    if (c.by !== e || !t(c)) break;
    i += 1;
  }
  return i;
}
function vd(n, e, t) {
  const i = n.isCheck;
  let a;
  i &&
    (t.move.piece === "k"
      ? (a = "king_move")
      : t.captured
        ? (a = "capture_attacker")
        : (a = "block"));
  const c = Xi(n.moveHistory, t.by, (o) => o.isCheck),
    s = Xi(n.moveHistory, t.by, (o) => !!o.captured);
  return {
    ...t,
    fullMoveNumber: e.fullMoveNumber,
    isRespondingToCheck: i,
    checkResponseType: a,
    consecutiveChecks: c,
    consecutiveCaptures: s,
  };
}
function ea(n, e, t) {
  return oc(n === "draw" ? "draw" : n === e ? "win" : "loss", t);
}
function qn(n, e) {
  if (n.status === "playing") return [];
  if (n.status === "stalemate" || n.status === "draw")
    return [re.game_over(n.status, "draw", e), ea("draw", e, n.status)];
  if (n.winner == null) throw new Error(`chess: decisive status ${n.status} with no winner`);
  return [re.game_over(n.status, n.winner, e), ea(n.winner, e, n.status)];
}
function Ad(n, e, t, i, a) {
  if (!n.gameState) throw new T("Game not started");
  if (n.gameState.status !== "playing") throw new T("Game is not in progress");
  if (n.gameState.turn !== e) throw new T("Not your turn");
  const c = Ft.makeMove(n.gameState, t, i, a);
  if (!c.success) throw new T(c.error ?? "Invalid move");
  const s = vd(n.gameState, c.state, c.moveInfo),
    o = [re.move(e, s)];
  if (
    (c.moveInfo.isCheck &&
      o.push(re.check(e, { piece: c.moveInfo.move.piece, square: c.moveInfo.move.from })),
    c.moveInfo.captured &&
      o.push(
        re.capture(
          e,
          { piece: c.moveInfo.move.piece, square: c.moveInfo.move.from },
          { piece: c.moveInfo.captured, square: c.moveInfo.move.to },
        ),
      ),
    c.moveInfo.isCastling)
  ) {
    const N = c.moveInfo.move.to[0] === "g" ? "kingside" : "queenside";
    o.push(re.castling(e, N));
  }
  return (
    c.moveInfo.isPromotion &&
      o.push(
        re.promotion(
          e,
          { piece: c.moveInfo.move.piece, square: c.moveInfo.move.from },
          c.moveInfo.promotionPiece,
        ),
      ),
    o.push(...qn(c.state, n.settings.playerSide)),
    { nextState: { ...n, gameState: c.state }, events: o, move: c.moveInfo }
  );
}
function Gd(n) {
  return n.tutorial !== null && Ma(n.tutorial.step);
}
function Kn(n) {
  if (Gd(n)) throw new T("Tutorial: finish the guided moves first.");
}
const yd = {
  startGame: ({ actor: n, cmd: e, state: t }) => {
    if (n === "agent" && t.gameState && t.gameState.status === "playing")
      throw new T("A game is already in progress — only the player may start a new one.");
    const i =
        e.mode === "tutorial"
          ? { ...on, ...t.settings, ...md }
          : { ...on, ...t.settings, playerSide: e.side, difficulty: e.difficulty },
      a = e.mode === "tutorial" ? { step: bd } : null,
      c = Ft.newGame(),
      s = [re.game_start(i.playerSide, i.difficulty)];
    return {
      nextState: {
        ...t,
        settings: i,
        gameState: c,
        drawOffer: null,
        takebackRequest: null,
        tutorial: a,
        debugScenarioId: null,
        debugScenario: null,
      },
      events: s,
      result: Qe.startGame.result(!0),
    };
  },
  move: ({ actor: n, cmd: e, state: t }) => {
    if (t.tutorial && n === "player") {
      const f = Dd(t.tutorial.step, e.from, e.to);
      if (f !== !0) throw new T(f);
    }
    const i = Ta(n) ? t.settings.playerSide : t.settings.playerSide === "white" ? "black" : "white",
      a = Ad(t, i, e.from, e.to, e.promotion),
      c = Date.now(),
      s = t.gameState?.moveHistory.at(-1);
    let o = s?.madeAtMs ? c - s.madeAtMs : void 0;
    if (Yi() && t.debugScenario && a.nextState.gameState) {
      const f = t.debugScenario;
      if (f.id === t.debugScenarioId) {
        const B = a.nextState.gameState.moveHistory.length - 1,
          b = f.script[B];
        b &&
          b.uci === Sd(a.move) &&
          typeof b.durationMs == "number" &&
          (o = Math.max(0, Math.floor(b.durationMs)));
      }
    }
    const d = { ...a.move, madeAtMs: c, durationMs: o },
      N = a.nextState.gameState;
    if (N) {
      const f = N.moveHistory.length - 1;
      f >= 0 && (N.moveHistory[f] = d);
    }
    let l = a.nextState;
    const u = a.events;
    return (
      t.tutorial &&
        ((l = { ...l, tutorial: { step: pd(t.tutorial.step, n) } }),
        Ma(t.tutorial.step) && u.push(re.tutorial_step(t.tutorial.step))),
      t.drawOffer &&
        (u.push(re.respond_draw(Ji(t.drawOffer), !1)), (l = { ...l, drawOffer: null })),
      t.takebackRequest &&
        (u.push(re.respond_takeback(Ji(t.takebackRequest), !1)),
        (l = { ...l, takebackRequest: null })),
      { nextState: l, events: u, result: Qe.move.result(!0, d) }
    );
  },
  resign: ({ actor: n, state: e }) => {
    if (!e.gameState) throw new T("Game not started");
    Kn(e);
    const t = bt(e, n),
      i = Ft.resign(e.gameState, t);
    return {
      nextState: { ...e, gameState: i },
      events: qn(i, e.settings.playerSide),
      result: Qe.resign.result(!0),
    };
  },
  offerDraw: ({ actor: n, state: e }) => {
    if (!e.gameState) throw new T("Game not started");
    if (e.gameState.status !== "playing") throw new T("Game is not in progress");
    if ((Kn(e), e.drawOffer)) throw new T("There is already a draw offer pending");
    const t = bt(e, n);
    return {
      nextState: { ...e, drawOffer: t },
      events: [re.draw_offer(t)],
      result: Qe.offerDraw.result(!0),
    };
  },
  cancelDrawOffer: ({ actor: n, state: e }) => {
    if (!e.gameState) throw new T("Game not started");
    if (e.gameState.status !== "playing") throw new T("Game is not in progress");
    if (!e.drawOffer) throw new T("No draw offer pending");
    const t = bt(e, n);
    if (t !== e.drawOffer) throw new T("Not the side that offered the draw");
    return {
      nextState: { ...e, drawOffer: null },
      events: [re.cancel_draw_offer(t)],
      result: Qe.cancelDrawOffer.result(!0),
    };
  },
  respondDraw: ({ actor: n, cmd: e, state: t }) => {
    if (!t.gameState) throw new T("Game not started");
    if (t.gameState.status !== "playing") throw new T("Game is not in progress");
    if (!t.drawOffer) throw new T("No draw offer pending");
    const i = bt(t, n);
    if (i === t.drawOffer) throw new T("You cannot respond to your own draw offer");
    if (!e.accept)
      return {
        nextState: { ...t, drawOffer: null },
        events: [re.respond_draw(i, !1)],
        result: Qe.respondDraw.result(!0),
      };
    const a = {
      ...t.gameState,
      status: "draw",
      winner: "draw",
      isDraw: !0,
      isCheck: !1,
      isCheckmate: !1,
      isStalemate: !1,
    };
    return {
      nextState: { ...t, gameState: a, drawOffer: null },
      events: [re.respond_draw(i, !0), ...qn(a, t.settings.playerSide)],
      result: Qe.respondDraw.result(!0),
    };
  },
  requestTakeback: ({ actor: n, state: e }) => {
    if (!e.gameState) throw new T("Game not started");
    if (e.gameState.status !== "playing") throw new T("Game is not in progress");
    if ((Kn(e), e.takebackRequest)) throw new T("There is already a takeback request pending");
    const t = bt(e, n),
      i = e.gameState.turn === t ? 2 : 1;
    if (e.gameState.moveHistory.length < i)
      throw new T(`Not enough moves to take back (need at least ${i})`);
    return {
      nextState: { ...e, takebackRequest: t },
      events: [re.request_takeback(t)],
      result: Qe.requestTakeback.result(!0),
    };
  },
  cancelTakebackRequest: ({ actor: n, state: e }) => {
    if (!e.gameState) throw new T("Game not started");
    if (e.gameState.status !== "playing") throw new T("Game is not in progress");
    if (!e.takebackRequest) throw new T("No takeback request pending");
    const t = bt(e, n);
    if (t !== e.takebackRequest) throw new T("Not the side that requested the takeback");
    return {
      nextState: { ...e, takebackRequest: null },
      events: [re.cancel_takeback_request(t)],
      result: Qe.cancelTakebackRequest.result(!0),
    };
  },
  respondTakeback: ({ actor: n, cmd: e, state: t }) => {
    if (!t.gameState) throw new T("Game not started");
    if (t.gameState.status !== "playing") throw new T("Game is not in progress");
    if (!t.takebackRequest) throw new T("No takeback request pending");
    const i = bt(t, n);
    if (i === t.takebackRequest) throw new T("You cannot respond to your own takeback request");
    const a = t.gameState.turn === t.takebackRequest ? 2 : 1;
    if (t.gameState.moveHistory.length < a)
      throw new T(`Not enough moves to take back (need at least ${a})`);
    if (!e.accept)
      return {
        nextState: { ...t, takebackRequest: null },
        events: [re.respond_takeback(i, !1)],
        result: Qe.respondTakeback.result(!0),
      };
    const c = Ft.undoPlies(t.gameState, a);
    if (!c.success) throw new Error(c.error ?? "Cannot undo");
    const s = t.gameState.moveHistory.length,
      o = c.state.moveHistory.length;
    return {
      nextState: { ...t, gameState: c.state, takebackRequest: null },
      events: [re.respond_takeback(i, !0), re.history_rewound(a, s, o, c.state.fen)],
      result: Qe.respondTakeback.result(!0),
    };
  },
  debugLoadScenario: ({ cmd: n, state: e }) => {
    if (!Yi()) throw new T("Chess debug harness is disabled");
    const t = Math.floor(n.startPly);
    if (!Number.isFinite(t) || t < 0 || t > n.script.length)
      throw new Error(`Invalid startPly for scenario ${n.id}: ${n.startPly}`);
    let i = gd(n.startFen),
      a = Date.now();
    for (let s = 0; s < t; s += 1) {
      const o = n.script[s],
        { from: d, to: N, promotion: l } = Vd(o.uci),
        u = Ft.makeMove(i, d, N, l);
      if (!u.success || !u.state)
        throw new Error(`Scenario ${n.id} invalid at ply ${s + 1}: ${o.uci}`);
      i = u.state;
      const f = typeof o.durationMs == "number" ? Math.max(0, Math.floor(o.durationMs)) : void 0;
      a += f ?? 1;
      const B = i.moveHistory.length - 1;
      if (B >= 0) {
        const b = i.moveHistory[B];
        i.moveHistory[B] = { ...b, madeAtMs: a, ...(f != null ? { durationMs: f } : {}) };
      }
    }
    const c = {
      ...on,
      ...e.settings,
      playerSide: n.settings.playerSide,
      difficulty: n.settings.difficulty,
      locale: n.settings.locale ?? e.settings.locale,
    };
    return {
      nextState: {
        ...e,
        settings: c,
        gameState: i,
        drawOffer: null,
        takebackRequest: null,
        tutorial: null,
        debugScenarioId: n.id,
        debugScenario: n,
      },
      events: [re.debug_scenario_loaded(n.id, t, i.fen)],
      result: Qe.debugLoadScenario.result(!0),
    };
  },
};
rc({
  id: "chess",
  mutexGroup: sc,
  initialState: {
    settings: on,
    gameState: null,
    drawOffer: null,
    takebackRequest: null,
    tutorial: null,
    debugScenarioId: null,
    debugScenario: null,
  },
  actors: Od,
  visibilityFences: Cd,
  ev: re,
  cmd: Qe,
  handlers: yd,
});
const ta = { kind: "off" };
function kd(n) {
  const e = n?.tutorial;
  if (!n?.gameState || !e) return ta;
  const t = Ia(e.step);
  switch (t.kind) {
    case "free":
      return ta;
    case "wait":
      return { kind: "wait" };
    case "move":
      return { kind: "move", from: t.from, to: t.to };
    default:
      return t;
  }
}
const C = {
    bg: "oklch(0.14 0.015 250)",
    bgDeep: "oklch(0.11 0.018 250)",
    glass: "rgba(22, 28, 42, 0.85)",
    glassBorder: "rgba(120, 180, 210, 0.12)",
    glassHighlight: "rgba(255, 255, 255, 0.03)",
    accent: "oklch(0.78 0.08 210)",
    accentMuted: "oklch(0.78 0.08 210 / 20%)",
    accentGlow: "rgba(158, 200, 230, 0.15)",
    text: "oklch(0.93 0.008 200)",
    textMuted: "oklch(0.62 0.012 230)",
    textDim: "oklch(0.45 0.01 240)",
    win: "oklch(0.75 0.15 145)",
    lose: "oklch(0.65 0.15 25)",
    draw: "oklch(0.70 0.08 60)",
  },
  na = 560,
  wd = 220,
  ia = 280,
  aa = 212,
  Ed = 100 + $e,
  ca = 56 + $e,
  Qd = 520,
  Rd = [
    { id: "sleepy", elo: 400 },
    { id: "casual", elo: 700 },
    { id: "normal", elo: 1e3 },
    { id: "focused", elo: 1300 },
    { id: "serious", elo: 1600 },
  ],
  se = {
    gameStart: "chess.gameStart",
    gameEnd: "chess.gameEnd",
    moveSelf: "chess.moveSelf",
    moveOpponent: "chess.moveOpponent",
    capture: "chess.capture",
    castle: "chess.castle",
    check: "chess.check",
    promote: "chess.promote",
    illegal: "chess.illegal",
  };
let ra = null;
function Pd() {
  const n = At.getInstance(),
    e = async () => {
      await n.sfx.loadMany({
        [se.gameStart]: "/audio/chess/game-start.mp3",
        [se.gameEnd]: "/audio/chess/game-end.mp3",
        [se.moveSelf]: "/audio/sfx/wooden_button_click_in_05-4676cb.m4a",
        [se.moveOpponent]: "/audio/sfx/wooden_button_click_in_05-4676cb.m4a",
        [se.capture]: "/audio/chess/capture.mp3",
        [se.castle]: "/audio/chess/castle.mp3",
        [se.check]: "/audio/sfx/wooden_button_01-0cbcd2.m4a",
        [se.promote]: "/audio/chess/promote.mp3",
        [se.illegal]: "/audio/sfx/deny_1-1d4f88.m4a",
      });
    };
  n.onInit(() => {
    n.sfx.isLoaded(se.moveSelf) ||
      (ra ??= e().catch((t) => {
        ((ra = null), console.warn("[Chess] Failed to load SFX:", t));
      }));
  });
}
function za(n) {
  return n === "white" ? "black" : "white";
}
function _a(n) {
  const e = n.captured ? "×" : "–",
    t = n.move.promotion ? `=${n.move.promotion.toUpperCase()}` : "",
    i = n.isCheckmate ? "#" : n.isCheck ? "+" : "";
  return `${n.move.from}${e}${n.move.to}${t}${i}`;
}
function Ld(n, e) {
  const t = new Te(n),
    i = [n],
    a = [];
  for (const c of e) {
    const s = t.move({ from: c.move.from, to: c.move.to, promotion: c.move.promotion });
    (a.push(s?.san ?? _a(c)), i.push(t.fen()));
  }
  return { fensByPly: i, sanByMoveIndex: a };
}
function Kd(n) {
  const e = n.gameState?.moveHistory ?? [],
    t = e.length,
    i = n.settings.playerSide,
    a = {
      player: e.filter((s) => s.by === i && s.captured).length,
      nori: e.filter((s) => s.by !== i && s.captured).length,
    },
    c = {
      player: e.filter((s) => s.by === i && s.isCheck).length,
      nori: e.filter((s) => s.by !== i && s.isCheck).length,
    };
  return { totalMoves: t, captures: a, checks: c };
}
const Md = { p: 1, n: 3, b: 3, r: 5, q: 9 },
  Id = ["q", "r", "b", "n", "p"];
function dt({ piece: n, color: e, size: t = 16 }) {
  const i = e === "white",
    a = i ? "#f0f0f0" : "#1a1a1a",
    c = i ? "#333" : "rgba(180, 210, 240, 0.85)",
    s = i ? 1.5 : 2,
    o = {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 45 45",
      width: t,
      height: t,
      style: {
        display: "block",
        filter: i
          ? "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))"
          : "drop-shadow(0 0 3px rgba(140, 180, 220, 0.6)) drop-shadow(0 0 6px rgba(120, 160, 200, 0.3))",
      },
    };
  switch (n) {
    case "p":
      return r.jsx("svg", {
        ...o,
        children: r.jsx("path", {
          d: "M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z",
          fill: a,
          stroke: c,
          strokeWidth: s,
          strokeLinecap: "round",
        }),
      });
    case "n":
      return r.jsx("svg", {
        ...o,
        children: r.jsxs("g", {
          fill: "none",
          fillRule: "evenodd",
          stroke: c,
          strokeWidth: s,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: [
            r.jsx("path", { d: "M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21", fill: a }),
            r.jsx("path", {
              d: "M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3",
              fill: a,
            }),
            r.jsx("path", {
              d: "M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z",
              fill: i ? c : "rgba(180, 210, 240, 0.9)",
            }),
            r.jsx("path", {
              d: "M14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z",
              fill: i ? c : "rgba(180, 210, 240, 0.9)",
            }),
          ],
        }),
      });
    case "b":
      return r.jsx("svg", {
        ...o,
        children: r.jsxs("g", {
          fill: "none",
          fillRule: "evenodd",
          stroke: c,
          strokeWidth: s,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: [
            r.jsxs("g", {
              fill: a,
              children: [
                r.jsx("path", {
                  d: "M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z",
                }),
                r.jsx("path", {
                  d: "M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z",
                }),
                r.jsx("path", { d: "M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" }),
              ],
            }),
            r.jsx("path", {
              d: "M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5",
              stroke: i ? "#333" : "rgba(180, 210, 240, 0.7)",
              strokeLinejoin: "miter",
            }),
          ],
        }),
      });
    case "r":
      return r.jsx("svg", {
        ...o,
        children: r.jsxs("g", {
          fill: a,
          fillRule: "evenodd",
          stroke: c,
          strokeWidth: s,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: [
            r.jsx("path", {
              d: "M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5",
              strokeLinecap: "butt",
            }),
            r.jsx("path", { d: "M34 14l-3 3H14l-3-3" }),
            r.jsx("path", {
              d: "M31 17v12.5H14V17",
              strokeLinecap: "butt",
              strokeLinejoin: "miter",
            }),
            r.jsx("path", { d: "M31 29.5l1.5 2.5h-20l1.5-2.5" }),
            r.jsx("path", {
              d: "M11 14h23",
              fill: "none",
              stroke: i ? "#333" : "rgba(180, 210, 240, 0.7)",
              strokeLinejoin: "miter",
            }),
          ],
        }),
      });
    case "q":
      return r.jsx("svg", {
        ...o,
        children: r.jsxs("g", {
          fill: a,
          fillRule: "evenodd",
          stroke: c,
          strokeWidth: s,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: [
            r.jsx("path", {
              d: "M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM33 9a2 2 0 1 1-4 0 2 2 0 1 1 4 0z",
            }),
            r.jsx("path", {
              d: "M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12z",
              strokeLinecap: "butt",
            }),
            r.jsx("path", {
              d: "M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z",
              strokeLinecap: "butt",
            }),
            r.jsx("path", {
              d: "M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0",
              fill: "none",
              stroke: i ? "#333" : "rgba(180, 210, 240, 0.7)",
            }),
          ],
        }),
      });
    case "k":
      return r.jsx("svg", {
        ...o,
        children: r.jsxs("g", {
          fill: "none",
          fillRule: "evenodd",
          stroke: c,
          strokeWidth: s,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: [
            r.jsx("path", { d: "M22.5 11.63V6M20 8h5", strokeLinejoin: "miter" }),
            r.jsx("path", {
              d: "M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5",
              fill: a,
              strokeLinecap: "butt",
              strokeLinejoin: "miter",
            }),
            r.jsx("path", {
              d: "M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7",
              fill: a,
            }),
            r.jsx("path", {
              d: "M12.5 30c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0",
              stroke: i ? "#333" : "rgba(180, 210, 240, 0.7)",
            }),
          ],
        }),
      });
    default:
      return null;
  }
}
function Td(n, e) {
  const t = {},
    i = {};
  let a = 0,
    c = 0;
  for (const s of n)
    if (s.captured) {
      const o = s.captured.toLowerCase(),
        d = Md[o] ?? 0;
      s.by === e ? ((t[o] = (t[o] ?? 0) + 1), (a += d)) : ((i[o] = (i[o] ?? 0) + 1), (c += d));
    }
  return {
    playerCaptured: t,
    opponentCaptured: i,
    playerMaterial: a,
    opponentMaterial: c,
    advantage: a - c,
  };
}
function ft({ children: n, className: e = "", style: t = {} }) {
  return r.jsx("div", {
    className: `rounded-2xl ${e}`,
    style: {
      background: C.glass,
      backdropFilter: "blur(24px) saturate(140%)",
      WebkitBackdropFilter: "blur(24px) saturate(140%)",
      border: `1px solid ${C.glassBorder}`,
      boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 ${C.glassHighlight}
        `,
      ...t,
    },
    children: n,
  });
}
const zd = [
  { key: "king", piece: "k" },
  { key: "queen", piece: "q" },
  { key: "rook", piece: "r" },
  { key: "bishop", piece: "b" },
  { key: "knight", piece: "n" },
  { key: "pawn", piece: "p" },
];
function _d({ onClose: n }) {
  const { t: e } = kt();
  (h.useEffect(() => {
    Ie("primitives-sheet-open");
  }, []),
    h.useEffect(() => {
      const i = (a) => {
        a.key === "Escape" && (a.preventDefault(), Ie("primitives-sheet-dismiss"), n());
      };
      return (
        window.addEventListener("keydown", i),
        () => window.removeEventListener("keydown", i)
      );
    }, [n]));
  const t = () => {
    (Ie("primitives-sheet-dismiss"), n());
  };
  return r.jsxs("div", {
    className: "absolute inset-0 z-[60] flex items-center justify-center p-4",
    children: [
      r.jsx(Ce.div, {
        className: "absolute inset-0",
        style: {
          background: "rgba(8, 12, 20, 0.5)",
          backdropFilter: "blur(10px) saturate(120%)",
          WebkitBackdropFilter: "blur(10px) saturate(120%)",
        },
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
        onClick: t,
      }),
      r.jsx(Ce.div, {
        role: "dialog",
        "aria-modal": !0,
        "aria-label": e("chess.help.title"),
        className: "relative flex w-full max-w-[520px] max-h-[calc(100%-2rem)]",
        initial: { opacity: 0, y: 16, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 12, scale: 0.98 },
        transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
        children: r.jsxs(ft, {
          className: "w-full overflow-y-auto p-6",
          children: [
            r.jsxs("div", {
              className: "flex items-start justify-between",
              children: [
                r.jsxs("div", {
                  children: [
                    r.jsx("h2", {
                      className: "text-lg font-semibold",
                      style: { color: C.text },
                      children: e("chess.help.title"),
                    }),
                    r.jsx("p", {
                      className: "mt-1 text-[13px]",
                      style: { color: C.textMuted },
                      children: e("chess.help.goal"),
                    }),
                  ],
                }),
                r.jsx("button", {
                  onClick: t,
                  "aria-label": e("chess.help.close"),
                  className: "shrink-0 rounded-full p-1.5 transition-colors hover:bg-white/[0.06]",
                  style: { color: C.textMuted },
                  children: r.jsx(dn, { size: 18 }),
                }),
              ],
            }),
            r.jsx("div", {
              className: "mt-4 text-[10px] uppercase tracking-[0.2em] font-medium",
              style: { color: C.textDim },
              children: e("chess.help.pieces.title"),
            }),
            r.jsx("div", {
              className: "mt-2 space-y-1",
              children: zd.map(({ key: i, piece: a }) =>
                r.jsxs(
                  "div",
                  {
                    className: "flex items-center gap-3 rounded-lg px-2 py-1.5",
                    style: { background: "rgba(255, 255, 255, 0.02)" },
                    children: [
                      r.jsx(dt, { piece: a, color: "white", size: 20 }),
                      r.jsx("span", {
                        className: "w-14 shrink-0 text-[13px] font-medium",
                        style: { color: C.text },
                        children: e(`chess.help.pieces.${i}`),
                      }),
                      r.jsx("span", {
                        className: "min-w-0 flex-1 text-[12.5px]",
                        style: { color: C.textMuted },
                        children: e(`chess.help.pieces.${i}Move`),
                      }),
                    ],
                  },
                  i,
                ),
              ),
            }),
            r.jsx("div", {
              className: "mt-4 text-[10px] uppercase tracking-[0.2em] font-medium",
              style: { color: C.textDim },
              children: e("chess.help.table.title"),
            }),
            r.jsx("div", {
              className: "mt-2 space-y-1.5",
              children: ["takeback", "draw", "resign", "history"].map((i) =>
                r.jsx(
                  "p",
                  {
                    className: "text-[12.5px] leading-relaxed",
                    style: { color: C.textMuted },
                    children: e(`chess.help.table.${i}`),
                  },
                  i,
                ),
              ),
            }),
          ],
        }),
      }),
    ],
  });
}
function Fd({ open: n, onClose: e }) {
  return r.jsx(Gt, { children: n && r.jsx(_d, { onClose: e }) });
}
function sa({ capturedPieces: n, pieceColor: e, advantage: t, showAdvantage: i }) {
  const a = [];
  let c = 0;
  for (const d of Id) {
    const N = n[d] ?? 0;
    for (let l = 0; l < N; l++) {
      const u = c++;
      a.push(
        r.jsx(
          Ce.div,
          {
            initial: { opacity: 0, scale: 0.5 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.2, delay: u * 0.04, ease: [0.32, 0.72, 0, 1] },
            className: "flex-shrink-0",
            style: { marginRight: d === "p" ? "-3px" : "-1px" },
            children: r.jsx(dt, { piece: d, color: e, size: 18 }),
          },
          `${d}-${l}`,
        ),
      );
    }
  }
  const s = a.length > 0,
    o = i && t !== 0;
  return r.jsxs("div", {
    className: "flex items-center h-6 px-1 min-w-0",
    style: { minHeight: "24px" },
    children: [
      r.jsx("div", { className: "flex items-center", children: a }),
      o &&
        r.jsxs(Ce.span, {
          initial: { opacity: 0, x: -4 },
          animate: { opacity: 1, x: 0 },
          transition: { duration: 0.2, delay: 0.1 },
          className: "ml-1.5 text-xs font-semibold tabular-nums",
          style: { color: C.accent, textShadow: `0 0 8px ${C.accentGlow}` },
          children: ["+", Math.abs(t)],
        }),
      !s && !o && r.jsx("div", { className: "opacity-0 w-[18px] h-[18px]" }),
    ],
  });
}
function jd({ notification: n, onDismiss: e }) {
  return (
    h.useEffect(() => {
      if (!n) return;
      const t = setTimeout(e, 3e3);
      return () => clearTimeout(t);
    }, [n, e]),
    r.jsx(Gt, {
      children:
        n &&
        r.jsx(
          Ce.div,
          {
            className: "absolute top-4 left-1/2 z-30 pointer-events-auto",
            initial: { opacity: 0, y: -20, x: "-50%" },
            animate: { opacity: 1, y: 0, x: "-50%" },
            exit: { opacity: 0, y: -20, x: "-50%" },
            transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
            children: r.jsxs(ft, {
              className: "px-4 py-3 flex items-center gap-3",
              children: [
                n.icon,
                r.jsx("span", {
                  className: "text-sm font-medium",
                  style: { color: C.text },
                  children: n.message,
                }),
              ],
            }),
          },
          n.id,
        ),
    })
  );
}
const Hd = { sleepy: "p", casual: "n", normal: "b", focused: "r", serious: "q" },
  ni = [0.32, 0.72, 0, 1],
  $d = "linear-gradient(135deg, rgba(160, 210, 240, 0.18) 0%, rgba(130, 190, 230, 0.11) 100%)",
  Wd = "inset 0 1px 0 rgba(255, 255, 255, 0.07), inset 0 0 14px rgba(180, 230, 255, 0.06)";
function nn({ index: n, children: e }) {
  return r.jsx(Ce.div, {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: 0.1 + n * 0.07, ease: ni },
    children: e,
  });
}
function oa({ layoutId: n }) {
  return r.jsx(Ce.div, {
    layoutId: n,
    className: "absolute inset-0 rounded-lg",
    style: { background: $d, boxShadow: Wd },
    transition: { duration: 0.3, ease: ni },
  });
}
function qd({
  compact: n,
  color: e,
  difficulty: t,
  onColorChange: i,
  onDifficultyChange: a,
  onStart: c,
  onStartTutorial: s,
  onHelp: o,
}) {
  const { t: d } = kt(),
    N = n ? 30 : 38;
  return r.jsx(Ce.aside, {
    className: "absolute inset-0 flex flex-col min-h-0 overflow-y-auto",
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 12, transition: { duration: 0.15 } },
    transition: { duration: 0.4, ease: ni },
    children: r.jsxs("div", {
      className: "my-auto",
      children: [
        r.jsxs(nn, {
          index: 0,
          children: [
            r.jsxs("div", {
              className: "flex items-start justify-between gap-2",
              children: [
                r.jsx("h1", {
                  className: "font-bold tracking-tight",
                  style: { fontSize: n ? 19 : 23, lineHeight: 1.2, color: C.text },
                  children: d("chess.title"),
                }),
                r.jsx("button", {
                  onClick: o,
                  "aria-label": d("chess.help.button"),
                  className: "shrink-0 rounded-full p-1.5 transition-colors hover:bg-white/[0.06]",
                  style: { color: C.textMuted },
                  children: r.jsx(da, { size: 16 }),
                }),
              ],
            }),
            !n &&
              r.jsx("p", {
                className: "mt-1 text-xs",
                style: { color: C.textMuted },
                children: d("chess.subtitle"),
              }),
          ],
        }),
        r.jsx(nn, {
          index: 1,
          children: r.jsx("div", {
            className: `grid grid-cols-2 gap-1.5 ${n ? "mt-2" : "mt-4"}`,
            children: ["white", "black"].map((l) => {
              const u = e === l;
              return r.jsxs(
                "button",
                {
                  onClick: () => i(l),
                  className: `relative flex flex-col items-center rounded-lg transition-colors duration-200 hover:bg-white/[0.04] ${n ? "gap-0.5 py-1.5" : "gap-1 py-2.5"}`,
                  children: [
                    u && r.jsx(oa, { layoutId: "chess-setup-color-plate" }),
                    r.jsx("span", {
                      className: "relative",
                      style: { opacity: u ? 1 : 0.65 },
                      children: r.jsx(dt, { piece: "k", color: l, size: n ? 22 : 32 }),
                    }),
                    r.jsx("span", {
                      className: "relative text-[11px] font-medium",
                      style: { color: u ? C.text : C.textMuted },
                      children: d(
                        l === "white" ? "chess.start.playWhite" : "chess.start.playBlack",
                      ),
                    }),
                  ],
                },
                l,
              );
            }),
          }),
        }),
        r.jsx(nn, {
          index: 2,
          children: r.jsx("div", {
            className: n ? "mt-2" : "mt-4",
            children: Rd.map((l) => {
              const u = t === l.id;
              return r.jsxs(
                "button",
                {
                  onClick: () => a(l.id),
                  className:
                    "relative w-full flex items-center gap-2.5 px-3 rounded-lg text-left transition-colors duration-150 hover:bg-white/[0.04]",
                  style: { height: N },
                  children: [
                    u && r.jsx(oa, { layoutId: "chess-setup-difficulty-plate" }),
                    r.jsx("span", {
                      className: "relative shrink-0",
                      style: { opacity: u ? 1 : 0.55 },
                      children: r.jsx(dt, {
                        piece: Hd[l.id],
                        color: u ? "white" : "black",
                        size: 16,
                      }),
                    }),
                    r.jsx("span", {
                      className: "relative flex-1 truncate text-[13px] font-medium",
                      style: { color: u ? C.text : C.textMuted },
                      children: d(`chess.start.difficulties.${l.id}`),
                    }),
                    r.jsx("span", {
                      className: "relative shrink-0 text-[11px] tabular-nums",
                      style: { color: u ? C.accent : C.textDim },
                      children: d("chess.start.elo", { elo: l.elo }),
                    }),
                  ],
                },
                l.id,
              );
            }),
          }),
        }),
        r.jsxs(nn, {
          index: 3,
          children: [
            r.jsx(We, {
              size: n ? "default" : "lg",
              className: `w-full font-semibold hover:brightness-110 active:brightness-95 ${n ? "mt-2.5" : "mt-4"}`,
              onClick: c,
              style: {
                background: C.accent,
                color: "oklch(0.13 0.02 250)",
                border: "none",
                borderRadius: 10,
              },
              children: d("chess.start.startGame"),
            }),
            r.jsx(We, {
              size: n ? "sm" : "default",
              variant: "ghost",
              className: "w-full mt-2 font-medium hover:brightness-125",
              onClick: s,
              style: { background: "rgba(255, 255, 255, 0.06)", color: C.text, borderRadius: 10 },
              children: r.jsxs("span", {
                className: "flex items-center gap-1.5",
                children: [
                  r.jsx(dt, { piece: "p", color: "black", size: 14 }),
                  d("chess.start.tutorial"),
                ],
              }),
            }),
          ],
        }),
      ],
    }),
  });
}
function Ud({ type: n, onAccept: e, onDecline: t }) {
  const { t: i } = kt();
  return (
    h.useEffect(() => {
      n && Ie("boardgames-chess-nori-request-sheet");
    }, [n]),
    r.jsx(Gt, {
      children:
        n &&
        r.jsx(Ce.div, {
          className: "absolute bottom-4 left-1/2 z-20",
          initial: { opacity: 0, y: 100, x: "-50%" },
          animate: { opacity: 1, y: 0, x: "-50%" },
          exit: { opacity: 0, y: 100, x: "-50%" },
          transition: { type: "spring", damping: 25, stiffness: 300 },
          children: r.jsx(ft, {
            className: "px-5 py-4",
            children: r.jsxs("div", {
              className: "flex items-center gap-4",
              children: [
                r.jsx(Ce.div, {
                  className: "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                  style: { background: C.accentMuted, boxShadow: `0 0 16px ${C.accentGlow}` },
                  initial: { scale: 0.8 },
                  animate: { scale: 1 },
                  transition: { type: "spring", damping: 15 },
                  children:
                    n === "takeback"
                      ? r.jsx($t, { size: 20, style: { color: C.accent } })
                      : r.jsx(Wt, { size: 20, style: { color: C.accent } }),
                }),
                r.jsx("div", {
                  className: "mr-2",
                  children: r.jsx("p", {
                    className: "text-sm font-medium",
                    style: { color: C.text },
                    children: i(
                      n === "takeback"
                        ? "chess.request.noriRequestsTakeback"
                        : "chess.request.noriOffersDraw",
                    ),
                  }),
                }),
                r.jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [
                    r.jsx(We, {
                      size: "sm",
                      onClick: e,
                      style: {
                        background: `linear-gradient(135deg, ${C.accent} 0%, oklch(0.70 0.10 220) 100%)`,
                        color: "oklch(0.15 0.02 250)",
                        border: "none",
                      },
                      children: i("chess.request.accept"),
                    }),
                    r.jsx(We, {
                      size: "sm",
                      variant: "ghost",
                      onClick: t,
                      style: {
                        background: "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${C.glassBorder}`,
                        color: C.textMuted,
                      },
                      children: i("chess.request.decline"),
                    }),
                  ],
                }),
              ],
            }),
          }),
        }),
    })
  );
}
function Zd({ isOpen: n, isExpanded: e, onToggleExpanded: t, state: i, onPlayAgain: a }) {
  const { t: c } = kt(),
    s = i?.gameState,
    o = h.useMemo(() => (i ? Kd(i) : null), [i]);
  if (!i || !s) return null;
  const d = s.winner,
    N = d === "draw" || d === null,
    l = !N && d === i.settings.playerSide,
    u = c(N ? "chess.results.draw" : l ? "chess.results.youWin" : "chess.results.noriWins"),
    f = N ? C.draw : l ? C.win : C.lose,
    B =
      s.status === "checkmate"
        ? c("chess.results.checkmate")
        : s.status === "stalemate"
          ? c("chess.results.stalemate")
          : s.status === "draw"
            ? c("chess.results.drawAgreed")
            : s.status === "resigned"
              ? c("chess.results.resignation")
              : "";
  return r.jsx(Gt, {
    children:
      n &&
      r.jsx(Ce.div, {
        className: "absolute bottom-4 left-1/2 z-20",
        initial: { opacity: 0, y: 100, x: "-50%" },
        animate: { opacity: 1, y: 0, x: "-50%" },
        exit: { opacity: 0, y: 100, x: "-50%" },
        transition: { type: "spring", damping: 25, stiffness: 300 },
        children: r.jsxs(ft, {
          className: "overflow-hidden",
          style: { minWidth: e ? 360 : 200, maxWidth: "90vw" },
          children: [
            r.jsx("button", {
              type: "button",
              onClick: t,
              className:
                "w-full flex items-center justify-center py-2 cursor-pointer hover:bg-white/5 transition-colors",
              children: r.jsx(Ce.div, {
                className: "w-10 h-1 rounded-full",
                style: { background: C.textDim },
                animate: { rotate: e ? 0 : 180 },
              }),
            }),
            r.jsx(Gt, {
              mode: "wait",
              children: e
                ? r.jsxs(
                    Ce.div,
                    {
                      initial: { opacity: 0, height: 0 },
                      animate: { opacity: 1, height: "auto" },
                      exit: { opacity: 0, height: 0 },
                      transition: { duration: 0.2 },
                      className: "px-6 pb-5",
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center gap-4 mb-4",
                          children: [
                            r.jsx(Ce.div, {
                              className:
                                "flex items-center justify-center w-14 h-14 rounded-full shrink-0",
                              style: { background: `${f}20`, boxShadow: `0 0 24px ${f}30` },
                              initial: { scale: 0.5 },
                              animate: { scale: 1 },
                              transition: { type: "spring", damping: 15 },
                              children: N
                                ? r.jsx(Wt, { size: 28, style: { color: f } })
                                : l
                                  ? r.jsx(hi, { size: 28, style: { color: f } })
                                  : r.jsx(Mn, { size: 28, style: { color: f } }),
                            }),
                            r.jsxs("div", {
                              children: [
                                r.jsx("h2", {
                                  className: "text-xl font-semibold tracking-tight",
                                  style: { color: f },
                                  children: u,
                                }),
                                r.jsx("p", {
                                  className: "text-sm",
                                  style: { color: C.textMuted },
                                  children: B,
                                }),
                              ],
                            }),
                          ],
                        }),
                        o &&
                          r.jsxs("div", {
                            className: "rounded-xl p-3 mb-4 space-y-2",
                            style: { background: "rgba(255, 255, 255, 0.03)" },
                            children: [
                              r.jsxs("div", {
                                className: "flex justify-between text-sm",
                                children: [
                                  r.jsx("span", {
                                    style: { color: C.textMuted },
                                    children: c("chess.results.totalMoves"),
                                  }),
                                  r.jsx("span", {
                                    style: { color: C.text },
                                    children: o.totalMoves,
                                  }),
                                ],
                              }),
                              r.jsxs("div", {
                                className: "flex justify-between text-sm",
                                children: [
                                  r.jsx("span", {
                                    style: { color: C.textMuted },
                                    children: c("chess.results.captures"),
                                  }),
                                  r.jsxs("span", {
                                    style: { color: C.text },
                                    children: [o.captures.player, " / ", o.captures.nori],
                                  }),
                                ],
                              }),
                              r.jsxs("div", {
                                className: "flex justify-between text-sm",
                                children: [
                                  r.jsx("span", {
                                    style: { color: C.textMuted },
                                    children: c("chess.results.checks"),
                                  }),
                                  r.jsxs("span", {
                                    style: { color: C.text },
                                    children: [o.checks.player, " / ", o.checks.nori],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        r.jsx(We, {
                          size: "default",
                          className: "w-full font-medium",
                          onClick: a,
                          style: {
                            background: `linear-gradient(135deg, ${C.accent} 0%, oklch(0.70 0.10 220) 100%)`,
                            color: "oklch(0.15 0.02 250)",
                            border: "none",
                            boxShadow: `0 4px 20px ${C.accentGlow}`,
                          },
                          children: r.jsxs("span", {
                            className: "flex items-center gap-2",
                            children: [r.jsx($t, { size: 16 }), c("chess.results.playAgain")],
                          }),
                        }),
                      ],
                    },
                    "expanded",
                  )
                : r.jsxs(
                    Ce.div,
                    {
                      initial: { opacity: 0 },
                      animate: { opacity: 1 },
                      exit: { opacity: 0 },
                      transition: { duration: 0.15 },
                      className: "px-4 pb-3 flex items-center gap-2",
                      children: [
                        r.jsx("div", {
                          className:
                            "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                          style: { background: `${f}20` },
                          children: N
                            ? r.jsx(Wt, { size: 16, style: { color: f } })
                            : l
                              ? r.jsx(hi, { size: 16, style: { color: f } })
                              : r.jsx(Mn, { size: 16, style: { color: f } }),
                        }),
                        r.jsx("span", {
                          className: "text-sm font-medium",
                          style: { color: f },
                          children: u,
                        }),
                        r.jsxs(We, {
                          size: "sm",
                          className: "shrink-0 ml-4 font-medium",
                          onClick: a,
                          style: {
                            background: `linear-gradient(135deg, ${C.accent} 0%, oklch(0.70 0.10 220) 100%)`,
                            color: "oklch(0.15 0.02 250)",
                            border: "none",
                          },
                          children: [
                            r.jsx($t, { size: 14, className: "mr-1" }),
                            c("chess.results.playAgain"),
                          ],
                        }),
                      ],
                    },
                    "collapsed",
                  ),
            }),
          ],
        }),
      }),
  });
}
function Yd({
  state: n,
  compact: e,
  tutorialScripted: t,
  onResign: i,
  onOfferDraw: a,
  onDeclineDraw: c,
  onRequestTakeback: s,
  onCancelTakeback: o,
  onHelp: d,
  activePly: N,
  sanByMoveIndex: l,
  onSelectPly: u,
}) {
  const { t: f } = kt(),
    B = h.useRef(null),
    b = n.gameState,
    p = b?.moveHistory ?? [];
  if (
    (h.useEffect(() => {
      if (!b) return;
      const j = B.current;
      if (!j) return;
      j.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
    }, [N, b]),
    !b)
  )
    return null;
  const V = n.settings.playerSide,
    G = za(V),
    A = b.turn === V,
    Q = b.status === "playing",
    _ = Q && A && p.length >= 2 && !n.takebackRequest,
    z = n.takebackRequest === V;
  return r.jsxs(Ce.aside, {
    className: `absolute inset-0 flex flex-col justify-center min-h-0 ${e ? "gap-2" : "gap-3"}`,
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 12, transition: { duration: 0.15 } },
    transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
    children: [
      r.jsxs(ft, {
        className: `shrink-0 ${e ? "p-3" : "p-4"}`,
        children: [
          r.jsxs("div", {
            className: "flex items-center justify-between",
            children: [
              r.jsxs("div", {
                children: [
                  r.jsx("div", {
                    className: "text-[10px] uppercase tracking-[0.2em] font-medium",
                    style: { color: C.textDim },
                    children: f("chess.game.status"),
                  }),
                  r.jsx("div", {
                    className: "mt-1 text-lg font-medium",
                    style: { color: A ? C.accent : C.text },
                    children: f(
                      Q
                        ? A
                          ? "chess.game.yourTurn"
                          : "chess.game.norisTurn"
                        : "chess.game.gameOver",
                    ),
                  }),
                ],
              }),
              r.jsxs("div", {
                className: "flex items-center gap-2.5",
                children: [
                  r.jsx("div", {
                    className: "w-3 h-3 rounded-full animate-pulse",
                    style: {
                      background: A ? C.accent : C.textMuted,
                      boxShadow: A ? `0 0 12px ${C.accent}` : "none",
                    },
                  }),
                  r.jsx("button", {
                    onClick: d,
                    "aria-label": f("chess.help.button"),
                    className: "rounded-full p-1 transition-colors hover:bg-white/[0.06]",
                    style: { color: C.textMuted },
                    children: r.jsx(da, { size: 15 }),
                  }),
                ],
              }),
            ],
          }),
          n.drawOffer === G &&
            r.jsx("div", {
              className: "mt-2 text-xs font-medium px-2 py-1 rounded-md inline-block",
              style: { background: C.accentMuted, color: C.accent },
              children: f("chess.game.noriOfferedDraw"),
            }),
        ],
      }),
      r.jsxs(ft, {
        className: `flex flex-col min-h-0 ${e ? "p-3" : "p-4"}`,
        style: { flex: "0 1 300px", minHeight: 96 },
        children: [
          r.jsx("div", {
            className: "flex items-center justify-between mb-3",
            children: r.jsx("div", {
              className: "text-[10px] uppercase tracking-[0.2em] font-medium",
              style: { color: C.textDim },
              children: f("chess.game.moves"),
            }),
          }),
          r.jsx("div", {
            ref: B,
            className: "flex-1 min-h-0 overflow-y-auto pr-1",
            children:
              p.length === 0
                ? r.jsx("div", {
                    className: "text-sm",
                    style: { color: C.textDim },
                    children: f("chess.game.noMoves"),
                  })
                : r.jsxs("div", {
                    className: "space-y-1",
                    children: [
                      r.jsxs("div", {
                        className:
                          "grid grid-cols-[32px_1fr_1fr] gap-1 px-1 pb-1 text-[10px] uppercase tracking-[0.2em] font-medium",
                        style: { color: C.textDim },
                        children: [
                          r.jsx("div", { className: "text-right", children: "#" }),
                          r.jsx("div", {
                            className: "flex items-center gap-1.5",
                            children: r.jsx(dt, { piece: "p", color: "white", size: 14 }),
                          }),
                          r.jsx("div", {
                            className: "flex items-center gap-1.5",
                            children: r.jsx(dt, { piece: "p", color: "black", size: 14 }),
                          }),
                        ],
                      }),
                      Array.from({ length: Math.ceil(p.length / 2) }).map((j, De) => {
                        const oe = De + 1,
                          fe = De * 2,
                          ie = fe + 1,
                          ue = fe,
                          Z = N === ue,
                          J = (de) => {
                            const $ = p[de];
                            if (!$) return r.jsx("div", { className: "h-8" });
                            const ge = de + 1,
                              ae = N === ge,
                              K = !!$.captured,
                              pe = l[de] ?? _a($),
                              H = K ? pe.replaceAll(/[x×]/g, "") : pe,
                              X = $.by === "white" ? "black" : "white";
                            return r.jsxs(
                              "button",
                              {
                                type: "button",
                                onClick: () => u(ge),
                                "data-active": ae ? "true" : void 0,
                                className:
                                  "h-8 px-2 rounded-lg flex items-center gap-1.5 min-w-0 text-left transition-colors",
                                style: {
                                  background: ae ? C.accentMuted : "rgba(255, 255, 255, 0.02)",
                                  border: `1px solid ${ae ? C.accent : "transparent"}`,
                                  color: C.text,
                                },
                                children: [
                                  K &&
                                    $.captured &&
                                    r.jsx("span", {
                                      className: "flex-shrink-0",
                                      style: { opacity: 0.95 },
                                      children: r.jsx(dt, {
                                        piece: $.captured,
                                        color: X,
                                        size: 16,
                                      }),
                                    }),
                                  r.jsx("span", {
                                    className: "truncate text-sm font-medium",
                                    children: H,
                                  }),
                                ],
                              },
                              `${$.move.from}-${$.move.to}-${de}`,
                            );
                          };
                        return r.jsxs(
                          "div",
                          {
                            className: "grid grid-cols-[32px_1fr_1fr] gap-1",
                            children: [
                              r.jsx("button", {
                                type: "button",
                                onClick: () => u(ue),
                                "data-active": Z ? "true" : void 0,
                                className:
                                  "h-8 pr-1 text-right text-[11px] tabular-nums rounded-lg",
                                style: {
                                  color: Z ? C.accent : C.textDim,
                                  background: Z ? C.accentMuted : "transparent",
                                  border: `1px solid ${Z ? C.accent : "transparent"}`,
                                },
                                children: oe,
                              }),
                              J(fe),
                              J(ie),
                            ],
                          },
                          oe,
                        );
                      }),
                    ],
                  }),
          }),
        ],
      }),
      !t &&
        r.jsxs(ft, {
          className: `shrink-0 ${e ? "p-2 space-y-1.5" : "p-3 space-y-2"}`,
          children: [
            r.jsxs(We, {
              variant: "secondary",
              size: "sm",
              className: "w-full text-xs",
              onClick: z ? o : s,
              disabled: !z && !_,
              style: {
                background: z ? C.accentMuted : "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${z ? C.accent : C.glassBorder}`,
                color: C.text,
              },
              children: [
                r.jsx($t, { size: 14, className: "mr-1.5" }),
                f(z ? "chess.game.cancelTakeback" : "chess.game.requestTakeback"),
              ],
            }),
            r.jsxs(We, {
              variant: "secondary",
              size: "sm",
              className: "w-full text-xs",
              onClick: a,
              disabled: !Q,
              style: {
                background: "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${C.glassBorder}`,
                color: C.text,
              },
              children: [
                r.jsx(Wt, { size: 14, className: "mr-1.5" }),
                n.drawOffer === V
                  ? f("chess.game.cancelDrawOffer")
                  : n.drawOffer === G
                    ? f("chess.game.acceptDraw")
                    : f("chess.game.offerDraw"),
              ],
            }),
            n.drawOffer === G &&
              r.jsxs(We, {
                variant: "secondary",
                size: "sm",
                className: "w-full text-xs",
                onClick: c,
                disabled: !Q,
                style: {
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${C.glassBorder}`,
                  color: C.text,
                },
                children: [
                  r.jsx(dn, { size: 14, className: "mr-1.5" }),
                  f("chess.game.declineDraw"),
                ],
              }),
            r.jsxs(We, {
              variant: "destructive",
              size: "sm",
              className: "w-full text-xs",
              onClick: i,
              disabled: !Q,
              style: {
                background: "rgba(200, 80, 80, 0.15)",
                border: "1px solid rgba(200, 80, 80, 0.3)",
                color: "oklch(0.75 0.12 25)",
              },
              children: [r.jsx(Mn, { size: 14, className: "mr-1.5" }), f("chess.game.resign")],
            }),
          ],
        }),
    ],
  });
}
const i4 = h.memo(function () {
  const { t: e } = kt(),
    { setWindowStyle: t } = dc(),
    i = fc("chess"),
    a = Nc("chess"),
    c = Ln((P) => P.restartRequested),
    s = Ln((P) => P.requestRestart),
    o = Ln((P) => P.clearRestartRequest),
    d = h.useRef(-1),
    N = h.useRef(null),
    l = h.useRef(null),
    u = h.useRef(null),
    f = h.useRef(null),
    B = h.useRef(!1),
    b = h.useRef(!1),
    p = h.useRef(null),
    [V, G] = h.useState(null),
    [A, Q] = h.useState(!0),
    [_, z] = h.useState(null),
    [j, De] = h.useState("white"),
    [oe, fe] = h.useState("casual"),
    [ie, ue] = h.useState(!1),
    [Z, J] = Fo(),
    de = J.width > 0 && J.height > 0,
    $ = de ? Math.round(Math.max(wd, Math.min(na, J.height - Ed, J.width - ca - aa))) : na,
    ge = de ? Math.round(Math.min(ia, Math.max(aa, J.width - ca - $))) : ia,
    ae = de && J.height < Qd;
  (h.useEffect(() => (t({ titleBarBackground: C.bgDeep }), () => t(null)), [t]),
    h.useEffect(() => {
      Pd();
    }, []));
  const K = i?.gameState,
    pe = K ? (K.status === "playing" ? "playing" : c ? "start" : "results") : "start",
    H = i?.settings.playerSide ?? "white",
    X = za(H),
    ye = K?.turn === H,
    F = K?.status === "playing",
    S = K?.moveHistory?.length ?? 0,
    E = V ?? S,
    ee = V !== null,
    v = K?.status ?? null,
    W = i?.drawOffer ?? null,
    te = i?.takebackRequest ?? null,
    Se = K?.moveHistory?.length ?? null,
    ce = K?.startFen ?? null,
    be = K?.moveHistory ?? null,
    _e = F && i?.takebackRequest === X ? "takeback" : F && i?.drawOffer === X ? "draw" : null,
    pt = h.useMemo(() => (!ce || !be ? null : Ld(ce, be)), [ce, be]),
    ze = h.useMemo(() => kd(i ?? null), [i]),
    Fe = ze.kind !== "off",
    wt = ze.kind === "move" && V === null ? { from: ze.from, to: ze.to } : null;
  (h.useEffect(() => {
    if (!K) {
      G(null);
      return;
    }
    if (V === null) return;
    const P = K.moveHistory?.length ?? 0;
    (V < 0 || V >= P) && G(null);
  }, [K, V]),
    h.useEffect(() => {
      K?.status && K.status !== "playing" && Q(!0);
    }, [K?.status]));
  const qe = h.useCallback(
      async (P, Y) => {
        if (a)
          try {
            (await Pe("chess", { type: "startGame", mode: "normal", side: P, difficulty: Y }), o());
            const ne = At.getInstance();
            ne.isInitialized && ne.sfx.play(se.gameStart, { volume: 0.9 });
          } catch (ne) {
            console.warn("[Chess] Failed to start game:", ne);
          }
      },
      [a, o],
    ),
    Et = h.useCallback(() => {
      qe(j, oe);
    }, [qe, j, oe]),
    Ot = h.useCallback(async () => {
      if (a)
        try {
          (await Pe("chess", { type: "startGame", mode: "tutorial" }), o());
          const P = At.getInstance();
          P.isInitialized && P.sfx.play(se.gameStart, { volume: 0.9 });
        } catch (P) {
          console.warn("[Chess] Failed to start tutorial:", P);
        }
    }, [a, o]),
    Qt = h.useCallback(
      async (P, Y, ne) => {
        if (!(!a || !F || !ye))
          try {
            await Pe("chess", { type: "move", from: P, to: Y, promotion: ne });
          } catch (ht) {
            console.warn("[Chess] Move rejected:", ht);
            const Ne = At.getInstance();
            Ne.isInitialized && Ne.sfx.play(se.illegal, { volume: 0.9 });
          }
      },
      [a, F, ye],
    ),
    lt = h.useCallback(async () => {
      !a || !F || (await Pe("chess", { type: "resign" }));
    }, [a, F]),
    Ye = h.useCallback(async () => {
      !a ||
        !F ||
        !i ||
        (i.drawOffer === H
          ? ((b.current = !0), await Pe("chess", { type: "cancelDrawOffer" }))
          : i.drawOffer === X
            ? await Pe("chess", { type: "respondDraw", accept: !0 })
            : await Pe("chess", { type: "offerDraw" }));
    }, [a, F, i, H, X]),
    Je = h.useCallback(async () => {
      !a || !F || i?.drawOffer !== X || (await Pe("chess", { type: "respondDraw", accept: !1 }));
    }, [a, F, i, X]),
    Re = h.useCallback(async () => {
      !a ||
        !F ||
        i?.takebackRequest !== X ||
        (await Pe("chess", { type: "respondTakeback", accept: !0 }));
    }, [a, F, i, X]),
    gt = h.useCallback(async () => {
      !a ||
        !F ||
        i?.takebackRequest !== X ||
        (await Pe("chess", { type: "respondTakeback", accept: !1 }));
    }, [a, F, i, X]),
    Ue = h.useCallback(async () => {
      !a || !F || !ye || (await Pe("chess", { type: "requestTakeback" }));
    }, [a, F, ye]),
    Rt = h.useCallback(async () => {
      !a || !F || ((B.current = !0), await Pe("chess", { type: "cancelTakebackRequest" }));
    }, [a, F]),
    Pt = h.useCallback(() => {
      s();
    }, [s]),
    Lt = h.useCallback(
      (P) => {
        const Y = Math.max(0, Math.min(P, S));
        G(Y === S ? null : Y);
      },
      [S],
    ),
    Xe = h.useCallback(() => {
      G(null);
    }, []),
    et = h.useCallback(() => {
      Q((P) => !P);
    }, []),
    tt = K
      ? (pt?.fensByPly[E] ?? K.fen)
      : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    nt = K ? H : j,
    Kt = h.useMemo(() => {
      const P = K?.moveHistory;
      if (!P || E <= 0) return null;
      const Y = P[E - 1];
      return Y ? { from: Y.move.from, to: Y.move.to } : null;
    }, [K?.moveHistory, E]),
    je = h.useMemo(() => {
      const P = K?.moveHistory?.slice(0, E) ?? [];
      return Td(P, H);
    }, [K?.moveHistory, H, E]);
  return (
    h.useEffect(() => {
      const P = K?.moveHistory ?? [],
        Y = P.length;
      if (!K) {
        d.current = -1;
        return;
      }
      if (d.current === -1) {
        d.current = Y;
        return;
      }
      if (Y <= d.current) {
        d.current = Y;
        return;
      }
      const ne = At.getInstance();
      if (!ne.isInitialized) {
        d.current = Y;
        return;
      }
      const ht = P.slice(d.current);
      for (const Ne of ht) {
        const it = Ne.by === H;
        if (
          (Ne.isCheckmate
            ? (ne.sfx.play(se.check, { volume: 0.9 }),
              setTimeout(() => ne.sfx.play(se.gameEnd, { volume: 0.9 }), 200))
            : Ne.isCheck
              ? ne.sfx.play(se.check, { volume: 0.9 })
              : Ne.captured
                ? ne.sfx.play(se.capture, { volume: 0.9 })
                : Ne.isCastling
                  ? ne.sfx.play(se.castle, { volume: 0.9 })
                  : Ne.isPromotion
                    ? ne.sfx.play(se.promote, { volume: 0.9 })
                    : ne.sfx.play(it ? se.moveSelf : se.moveOpponent, { volume: 0.9 }),
          !Ne.isCheckmate)
        ) {
          const Ct = Ne.captured === "q" || Ne.captured === "r";
          Ne.captured && !it
            ? He(Ct ? Le.captureMajor.spec : Le.captureMinor.spec)
            : Ne.captured && Ct
              ? He(Le.lostMajorPiece.spec)
              : Ne.isCheck
                ? He(it ? Le.checked.spec : Le.givesCheck.spec)
                : Ne.isPromotion && it && He(Le.playerPromotes.spec);
        }
      }
      d.current = Y;
    }, [K, K?.moveHistory, H]),
    h.useEffect(() => {
      const P = K?.status ?? null;
      if (N.current === "playing" && P && P !== "playing" && P !== "checkmate") {
        const ne = At.getInstance();
        ne.isInitialized && ne.sfx.play(se.gameEnd, { volume: 0.9 });
      }
      N.current = P;
    }, [K?.status]),
    h.useEffect(() => {
      const P = K?.status ?? null;
      if (l.current === "playing" && P && P !== "playing") {
        const Y = K?.winner ?? null;
        Y === "draw" ? He(Le.draw.spec) : Y === X ? He(Le.wins.spec) : Y === H && He(Le.loses.spec);
      }
      l.current = P;
    }, [K?.status, K?.winner, X, H]),
    h.useEffect(() => {
      if (F) return (lc(), () => gc());
    }, [F]),
    h.useEffect(() => {
      const P = u.current,
        Y = v ?? "playing";
      if (v === null) {
        ((u.current = null), (b.current = !1));
        return;
      }
      (P === H &&
        W === null &&
        (b.current
          ? (b.current = !1)
          : Y === "draw"
            ? z({
                id: `draw-accepted-${Date.now()}`,
                message: e("chess.toast.noriAcceptedDraw"),
                icon: r.jsx(Wt, { size: 18, style: { color: C.draw } }),
              })
            : Y === "playing" &&
              (Ie("boardgames-chess-response-toast", { pitch: 0.9 }),
              He(Le.declinesRequest.spec),
              z({
                id: `draw-declined-${Date.now()}`,
                message: e("chess.toast.noriDeclinedDraw"),
                icon: r.jsx(dn, { size: 18, style: { color: C.lose } }),
              }))),
        (u.current = W));
    }, [W, v, H, e]),
    h.useEffect(() => {
      const P = f.current;
      if (Se === null) {
        ((f.current = null), (p.current = null));
        return;
      }
      (te === H && P !== H && (p.current = Se),
        P === H &&
          te === null &&
          (B.current
            ? ((B.current = !1), (p.current = null))
            : p.current !== null && Se < p.current
              ? (Ie("boardgames-chess-response-toast"),
                He(Le.acceptsRequest.spec),
                z({
                  id: `takeback-accepted-${Date.now()}`,
                  message: e("chess.toast.noriAcceptedTakeback"),
                  icon: r.jsx($t, { size: 18, style: { color: C.accent } }),
                }))
              : (Ie("boardgames-chess-response-toast", { pitch: 0.9 }),
                He(Le.declinesRequest.spec),
                z({
                  id: `takeback-declined-${Date.now()}`,
                  message: e("chess.toast.noriDeclinedTakeback"),
                  icon: r.jsx(dn, { size: 18, style: { color: C.lose } }),
                })),
          (p.current = null)),
        (f.current = te));
    }, [te, Se, H, e]),
    r.jsxs("div", {
      ref: Z,
      className: "relative h-full w-full overflow-hidden",
      style: { background: C.bg },
      children: [
        r.jsx("div", {
          className: "absolute inset-0 pointer-events-none",
          style: {
            background: `
            radial-gradient(ellipse 80% 50% at 20% 20%, ${C.accentGlow}, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(100, 140, 180, 0.08), transparent 40%)
          `,
          },
        }),
        r.jsxs(Ce.div, {
          className: "relative z-10 h-full flex items-center justify-center p-4 gap-4",
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.4 },
          children: [
            r.jsxs("div", {
              className: "flex flex-col items-center justify-center transition-all duration-300",
              style: { filter: pe === "start" ? "brightness(0.7) saturate(0.85)" : "none" },
              children: [
                r.jsx("div", {
                  className: "mb-1.5 transition-opacity duration-300",
                  style: { width: $ + $e, paddingLeft: $e, opacity: pe !== "start" ? 1 : 0 },
                  children: r.jsx(sa, {
                    capturedPieces: je.opponentCaptured,
                    pieceColor: H,
                    advantage: -je.advantage,
                    showAdvantage: je.advantage < 0,
                  }),
                }),
                r.jsx(ft, {
                  className: "overflow-hidden",
                  style: {
                    padding: 4,
                    boxShadow:
                      pe !== "start"
                        ? `0 12px 48px rgba(0, 0, 0, 0.5), 0 0 1px ${C.glassBorder}`
                        : "0 8px 32px rgba(0, 0, 0, 0.4)",
                  },
                  children: r.jsx("div", {
                    style: { width: $ + $e, height: $ + $e },
                    onPointerUpCapture: () => {
                      ee && Xe();
                    },
                    children: r.jsx(_o, {
                      fen: tt,
                      orientation: nt,
                      draggable: F === !0 && ye === !0 && V === null,
                      lastMove: Kt,
                      tutorialMove: wt,
                      onMove: Qt,
                    }),
                  }),
                }),
                r.jsx("div", {
                  className: "mt-1.5 transition-opacity duration-300",
                  style: { width: $ + $e, paddingLeft: $e, opacity: pe !== "start" ? 1 : 0 },
                  children: r.jsx(sa, {
                    capturedPieces: je.playerCaptured,
                    pieceColor: H === "white" ? "black" : "white",
                    advantage: je.advantage,
                    showAdvantage: je.advantage > 0,
                  }),
                }),
              ],
            }),
            r.jsx("div", {
              className: "relative self-stretch shrink-0",
              style: { width: ge },
              children: r.jsx(Gt, {
                initial: !1,
                children:
                  pe === "start"
                    ? r.jsx(
                        qd,
                        {
                          compact: ae,
                          color: j,
                          difficulty: oe,
                          onColorChange: De,
                          onDifficultyChange: fe,
                          onStart: Et,
                          onStartTutorial: Ot,
                          onHelp: () => ue(!0),
                        },
                        "setup",
                      )
                    : i
                      ? r.jsx(
                          Yd,
                          {
                            state: i,
                            compact: ae,
                            tutorialScripted: Fe,
                            onResign: lt,
                            onOfferDraw: Ye,
                            onDeclineDraw: Je,
                            onRequestTakeback: Ue,
                            onCancelTakeback: Rt,
                            onHelp: () => ue(!0),
                            activePly: E,
                            sanByMoveIndex: pt?.sanByMoveIndex ?? [],
                            onSelectPly: Lt,
                          },
                          "game",
                        )
                      : null,
              }),
            }),
          ],
        }),
        r.jsx(Zd, {
          isOpen: pe === "results",
          isExpanded: A,
          onToggleExpanded: et,
          state: i ?? null,
          onPlayAgain: Pt,
        }),
        r.jsx(Ud, {
          type: _e,
          onAccept: _e === "takeback" ? Re : Ye,
          onDecline: _e === "takeback" ? gt : Je,
        }),
        r.jsx(jd, { notification: _, onDismiss: h.useCallback(() => z(null), []) }),
        r.jsx(Fd, { open: ie, onClose: () => ue(!1) }),
      ],
    })
  );
});
export { i4 as ChessScreen };
