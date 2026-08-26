import { N as v } from "./NormalApp-Cn6agT0F.js";
import { v as b, p, a as m, c as y, C as A, j as w } from "./index-B-Up_0PN.js";
import { i as T, a as P, l as C } from "./paginated_query_client-BfQfGvpv.js";
var S = Object.defineProperty,
  E = (d, t, e) =>
    t in d ? S(d, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : (d[t] = e),
  u = (d, t, e) => E(d, typeof t != "symbol" ? t + "" : t, e);
const O = 560;
let g;
class N {
  constructor(t, e) {
    if (
      (u(this, "address"),
      u(this, "auth"),
      u(this, "adminAuth"),
      u(this, "encodedTsPromise"),
      u(this, "debug"),
      u(this, "fetchOptions"),
      u(this, "fetch"),
      u(this, "logger"),
      u(this, "mutationQueue", []),
      u(this, "isProcessingQueue", !1),
      typeof e == "boolean")
    )
      throw new Error(
        "skipConvexDeploymentUrlCheck as the second argument is no longer supported. Please pass an options object, `{ skipConvexDeploymentUrlCheck: true }`.",
      );
    ((e ?? {}).skipConvexDeploymentUrlCheck !== !0 && b(t),
      (this.logger =
        e?.logger === !1
          ? T({ verbose: !1 })
          : e?.logger !== !0 && e?.logger
            ? e.logger
            : P({ verbose: !1 })),
      (this.address = t),
      (this.debug = !0),
      (this.auth = void 0),
      (this.adminAuth = void 0),
      (this.fetch = e?.fetch),
      e?.auth && this.setAuth(e.auth));
  }
  backendUrl() {
    return `${this.address}/api`;
  }
  get url() {
    return this.address;
  }
  setAuth(t) {
    (this.clearAuth(), (this.auth = t));
  }
  setAdminAuth(t, e) {
    if ((this.clearAuth(), e !== void 0)) {
      const s = new TextEncoder().encode(JSON.stringify(e)),
        r = btoa(String.fromCodePoint(...s));
      this.adminAuth = `${t}:${r}`;
    } else this.adminAuth = t;
  }
  clearAuth() {
    ((this.auth = void 0), (this.adminAuth = void 0));
  }
  setDebug(t) {
    this.debug = t;
  }
  setFetchOptions(t) {
    this.fetchOptions = t;
  }
  async consistentQuery(t, ...e) {
    const s = p(e[0]),
      r = this.getTimestamp();
    return await this.queryInner(t, s, { timestampPromise: r });
  }
  async getTimestamp() {
    return this.encodedTsPromise
      ? this.encodedTsPromise
      : (this.encodedTsPromise = this.getTimestampInner());
  }
  async getTimestampInner() {
    const t = this.fetch || g || fetch,
      e = { "Content-Type": "application/json", "Convex-Client": `npm-${m}` },
      s = await t(`${this.address}/api/query_ts`, {
        ...this.fetchOptions,
        method: "POST",
        headers: e,
      });
    if (!s.ok) throw new Error(await s.text());
    const { ts: r } = await s.json();
    return r;
  }
  async query(t, ...e) {
    const s = p(e[0]);
    return await this.queryInner(t, s, {});
  }
  async queryInner(t, e, s) {
    const r = v(t),
      i = [y(e)],
      h = { "Content-Type": "application/json", "Convex-Client": `npm-${m}` };
    this.adminAuth
      ? (h.Authorization = `Convex ${this.adminAuth}`)
      : this.auth && (h.Authorization = `Bearer ${this.auth}`);
    const c = this.fetch || g || fetch,
      o = s.timestampPromise ? await s.timestampPromise : void 0,
      n = JSON.stringify({
        path: r,
        format: "convex_encoded_json",
        args: i,
        ...(o ? { ts: o } : {}),
      }),
      a = o ? `${this.address}/api/query_at_ts` : `${this.address}/api/query`,
      l = await c(a, { ...this.fetchOptions, body: n, method: "POST", headers: h });
    if (!l.ok && l.status !== O) throw new Error(await l.text());
    const f = await l.json();
    if (this.debug) for (const $ of f.logLines ?? []) C(this.logger, "info", "query", r, $);
    switch (f.status) {
      case "success":
        return w(f.value);
      case "error":
        throw f.errorData !== void 0
          ? x(f.errorData, new A(f.errorMessage))
          : new Error(f.errorMessage);
      default:
        throw new Error(`Invalid response: ${JSON.stringify(f)}`);
    }
  }
  async mutationInner(t, e) {
    const s = v(t),
      r = JSON.stringify({ path: s, format: "convex_encoded_json", args: [y(e)] }),
      i = { "Content-Type": "application/json", "Convex-Client": `npm-${m}` };
    this.adminAuth
      ? (i.Authorization = `Convex ${this.adminAuth}`)
      : this.auth && (i.Authorization = `Bearer ${this.auth}`);
    const c = await (this.fetch || g || fetch)(`${this.address}/api/mutation`, {
      ...this.fetchOptions,
      body: r,
      method: "POST",
      headers: i,
    });
    if (!c.ok && c.status !== O) throw new Error(await c.text());
    const o = await c.json();
    if (this.debug) for (const n of o.logLines ?? []) C(this.logger, "info", "mutation", s, n);
    switch (o.status) {
      case "success":
        return w(o.value);
      case "error":
        throw o.errorData !== void 0
          ? x(o.errorData, new A(o.errorMessage))
          : new Error(o.errorMessage);
      default:
        throw new Error(`Invalid response: ${JSON.stringify(o)}`);
    }
  }
  async processMutationQueue() {
    if (!this.isProcessingQueue) {
      for (this.isProcessingQueue = !0; this.mutationQueue.length > 0;) {
        const { mutation: t, args: e, resolve: s, reject: r } = this.mutationQueue.shift();
        try {
          const i = await this.mutationInner(t, e);
          s(i);
        } catch (i) {
          r(i);
        }
      }
      this.isProcessingQueue = !1;
    }
  }
  enqueueMutation(t, e) {
    return new Promise((s, r) => {
      (this.mutationQueue.push({ mutation: t, args: e, resolve: s, reject: r }),
        this.processMutationQueue());
    });
  }
  async mutation(t, ...e) {
    const [s, r] = e,
      i = p(s);
    return r?.skipQueue ? await this.mutationInner(t, i) : await this.enqueueMutation(t, i);
  }
  async action(t, ...e) {
    const s = p(e[0]),
      r = v(t),
      i = JSON.stringify({ path: r, format: "convex_encoded_json", args: [y(s)] }),
      h = { "Content-Type": "application/json", "Convex-Client": `npm-${m}` };
    this.adminAuth
      ? (h.Authorization = `Convex ${this.adminAuth}`)
      : this.auth && (h.Authorization = `Bearer ${this.auth}`);
    const o = await (this.fetch || g || fetch)(`${this.address}/api/action`, {
      ...this.fetchOptions,
      body: i,
      method: "POST",
      headers: h,
    });
    if (!o.ok && o.status !== O) throw new Error(await o.text());
    const n = await o.json();
    if (this.debug) for (const a of n.logLines ?? []) C(this.logger, "info", "action", r, a);
    switch (n.status) {
      case "success":
        return w(n.value);
      case "error":
        throw n.errorData !== void 0
          ? x(n.errorData, new A(n.errorMessage))
          : new Error(n.errorMessage);
      default:
        throw new Error(`Invalid response: ${JSON.stringify(n)}`);
    }
  }
  async function(t, e, ...s) {
    const r = p(s[0]),
      i = typeof t == "string" ? t : v(t),
      h = JSON.stringify({ componentPath: e, path: i, format: "convex_encoded_json", args: y(r) }),
      c = { "Content-Type": "application/json", "Convex-Client": `npm-${m}` };
    this.adminAuth
      ? (c.Authorization = `Convex ${this.adminAuth}`)
      : this.auth && (c.Authorization = `Bearer ${this.auth}`);
    const n = await (this.fetch || g || fetch)(`${this.address}/api/function`, {
      ...this.fetchOptions,
      body: h,
      method: "POST",
      headers: c,
    });
    if (!n.ok && n.status !== O) throw new Error(await n.text());
    const a = await n.json();
    if (this.debug) for (const l of a.logLines ?? []) C(this.logger, "info", "any", i, l);
    switch (a.status) {
      case "success":
        return w(a.value);
      case "error":
        throw a.errorData !== void 0
          ? x(a.errorData, new A(a.errorMessage))
          : new Error(a.errorMessage);
      default:
        throw new Error(`Invalid response: ${JSON.stringify(a)}`);
    }
  }
}
function x(d, t) {
  return ((t.data = w(d)), t);
}
export { N as C };
