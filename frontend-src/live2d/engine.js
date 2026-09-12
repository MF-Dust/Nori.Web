/** Recovered Cubism SDK and WebGL model engine.
 * Provenance: the shipped NormalApp chunk, class it through function mce.
 * Public engine symbols are restored by scope-aware AST renaming.
 * The Cubism Core binary remains the separately shipped SDK asset.
 */
class csmVector {
  constructor(e = 0) {
    e < 1
      ? ((this._ptr = []), (this._capacity = 0), (this._size = 0))
      : ((this._ptr = new Array(e)), (this._capacity = e), (this._size = 0));
  }
  at(e) {
    return this._ptr[e];
  }
  set(e, n) {
    this._ptr[e] = n;
  }
  get(e = 0) {
    const n = new Array();
    for (let r = e; r < this._size; r++) n.push(this._ptr[r]);
    return n;
  }
  pushBack(e) {
    (this._size >= this._capacity &&
      this.prepareCapacity(
        this._capacity == 0 ? csmVector.DefaultSize : this._capacity * 2,
      ),
      (this._ptr[this._size++] = e));
  }
  clear() {
    ((this._ptr.length = 0), (this._size = 0));
  }
  getSize() {
    return this._size;
  }
  assign(e, n) {
    this._size < e && this.prepareCapacity(e);
    for (let i = 0; i < e; i++) this._ptr[i] = n;
    this._size = e;
  }
  resize(e, n = null) {
    this.updateSize(e, n, !0);
  }
  updateSize(e, n = null, r = !0) {
    if (this._size < e)
      if ((this.prepareCapacity(e), r))
        for (let s = this._size; s < e; s++)
          typeof n == "function"
            ? (this._ptr[s] = JSON.parse(JSON.stringify(new n())))
            : (this._ptr[s] = n);
      else for (let s = this._size; s < e; s++) this._ptr[s] = n;
    else {
      const s = this._size - e;
      this._ptr.splice(this._size - s, s);
    }
    this._size = e;
  }
  insert(e, n, r) {
    let i = e._index;
    const s = n._index,
      o = r._index,
      a = o - s;
    this.prepareCapacity(this._size + a);
    const l = this._size - i;
    if (l > 0) for (let c = 0; c < l; c++) this._ptr.splice(i + c, 0, null);
    for (let c = s; c < o; c++, i++) this._ptr[i] = n._vector._ptr[c];
    this._size = this._size + a;
  }
  remove(e) {
    return e < 0 || this._size <= e
      ? !1
      : (this._ptr.splice(e, 1), --this._size, !0);
  }
  erase(e) {
    const n = e._index;
    return n < 0 || this._size <= n
      ? e
      : (this._ptr.splice(n, 1), --this._size, new vb(this, n));
  }
  prepareCapacity(e) {
    e > this._capacity &&
      (this._capacity == 0
        ? ((this._ptr = new Array(e)), (this._capacity = e))
        : ((this._ptr.length = e), (this._capacity = e)));
  }
  begin() {
    return this._size == 0 ? this.end() : new vb(this, 0);
  }
  end() {
    return new vb(this, this._size);
  }
  getOffset(e) {
    const n = new csmVector();
    return (
      (n._ptr = this.get(e)),
      (n._size = this.get(e).length),
      (n._capacity = this.get(e).length),
      n
    );
  }
  _ptr;
  _size;
  _capacity;
  static DefaultSize = 10;
}
let vb = class kT {
  constructor(e, n) {
    ((this._vector = e ?? null), (this._index = n ?? 0));
  }
  set(e) {
    return ((this._index = e._index), (this._vector = e._vector), this);
  }
  preIncrement() {
    return (++this._index, this);
  }
  preDecrement() {
    return (--this._index, this);
  }
  increment() {
    return new kT(this._vector, this._index++);
  }
  decrement() {
    return new kT(this._vector, this._index--);
  }
  ptr() {
    return this._vector._ptr[this._index];
  }
  substitution(e) {
    return ((this._index = e._index), (this._vector = e._vector), this);
  }
  notEqual(e) {
    return this._index != e._index || this._vector != e._vector;
  }
  _index;
  _vector;
};
var CD;
((t) => {
  ((t.csmVector = csmVector), (t.iterator = vb));
})(CD || (CD = {}));
class csmString {
  append(e, n) {
    return ((this.s += n !== void 0 ? e.substr(0, n) : e), this);
  }
  expansion(e, n) {
    for (let r = 0; r < e; r++) this.append(n);
    return this;
  }
  getBytes() {
    return encodeURIComponent(this.s).replace(/%../g, "x").length;
  }
  getLength() {
    return this.s.length;
  }
  isLess(e) {
    return this.s < e.s;
  }
  isGreat(e) {
    return this.s > e.s;
  }
  isEqual(e) {
    return this.s == e;
  }
  isEmpty() {
    return this.s.length == 0;
  }
  constructor(e) {
    this.s = e;
  }
  s;
}
var RD;
((t) => {
  t.csmString = csmString;
})(RD || (RD = {}));
class CubismId {
  static createIdInternal(e) {
    return new CubismId(e);
  }
  getString() {
    return this._id;
  }
  isEqual(e) {
    return typeof e == "string"
      ? this._id.isEqual(e)
      : e instanceof csmString
        ? this._id.isEqual(e.s)
        : e instanceof CubismId
          ? this._id.isEqual(e._id.s)
          : !1;
  }
  isNotEqual(e) {
    return typeof e == "string"
      ? !this._id.isEqual(e)
      : e instanceof csmString
        ? !this._id.isEqual(e.s)
        : e instanceof CubismId
          ? !this._id.isEqual(e._id.s)
          : !1;
  }
  constructor(e) {
    if (typeof e == "string") {
      this._id = new csmString(e);
      return;
    }
    this._id = e;
  }
  _id;
}
var AD;
((t) => {
  t.CubismId = CubismId;
})(AD || (AD = {}));
class CubismIdManager {
  constructor() {
    this._ids = new csmVector();
  }
  release() {
    for (let e = 0; e < this._ids.getSize(); ++e) this._ids.set(e, void 0);
    this._ids = null;
  }
  registerIds(e) {
    for (let n = 0; n < e.length; n++) this.registerId(e[n]);
  }
  registerId(e) {
    let n = null;
    if (typeof e == "string") {
      if ((n = this.findId(e)) != null) return n;
      ((n = CubismId.createIdInternal(e)), this._ids.pushBack(n));
    } else return this.registerId(e.s);
    return n;
  }
  getId(e) {
    return this.registerId(e);
  }
  isExist(e) {
    return typeof e == "string" ? this.findId(e) != null : this.isExist(e.s);
  }
  findId(e) {
    for (let n = 0; n < this._ids.getSize(); ++n)
      if (this._ids.at(n).getString().isEqual(e)) return this._ids.at(n);
    return null;
  }
  _ids;
}
var PD;
((t) => {
  t.CubismIdManager = CubismIdManager;
})(PD || (PD = {}));
class CubismMatrix44 {
  constructor() {
    ((this._tr = new Float32Array(16)), this.loadIdentity());
  }
  static multiply(e, n, r) {
    const i = new Float32Array([
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]),
      s = 4;
    for (let o = 0; o < s; ++o)
      for (let a = 0; a < s; ++a)
        for (let l = 0; l < s; ++l) i[a + o * 4] += e[l + o * 4] * n[a + l * 4];
    for (let o = 0; o < 16; ++o) r[o] = i[o];
  }
  loadIdentity() {
    const e = new Float32Array([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
    ]);
    this.setMatrix(e);
  }
  setMatrix(e) {
    for (let n = 0; n < 16; ++n) this._tr[n] = e[n];
  }
  getArray() {
    return this._tr;
  }
  getScaleX() {
    return this._tr[0];
  }
  getScaleY() {
    return this._tr[5];
  }
  getTranslateX() {
    return this._tr[12];
  }
  getTranslateY() {
    return this._tr[13];
  }
  transformX(e) {
    return this._tr[0] * e + this._tr[12];
  }
  transformY(e) {
    return this._tr[5] * e + this._tr[13];
  }
  invertTransformX(e) {
    return (e - this._tr[12]) / this._tr[0];
  }
  invertTransformY(e) {
    return (e - this._tr[13]) / this._tr[5];
  }
  translateRelative(e, n) {
    const r = new Float32Array([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      e,
      n,
      0,
      1,
    ]);
    CubismMatrix44.multiply(r, this._tr, this._tr);
  }
  translate(e, n) {
    ((this._tr[12] = e), (this._tr[13] = n));
  }
  translateX(e) {
    this._tr[12] = e;
  }
  translateY(e) {
    this._tr[13] = e;
  }
  scaleRelative(e, n) {
    const r = new Float32Array([
      e,
      0,
      0,
      0,
      0,
      n,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
    ]);
    CubismMatrix44.multiply(r, this._tr, this._tr);
  }
  scale(e, n) {
    ((this._tr[0] = e), (this._tr[5] = n));
  }
  multiplyByMatrix(e) {
    CubismMatrix44.multiply(e.getArray(), this._tr, this._tr);
  }
  clone() {
    const e = new CubismMatrix44();
    for (let n = 0; n < this._tr.length; n++) e._tr[n] = this._tr[n];
    return e;
  }
  _tr;
}
var ID;
((t) => {
  t.CubismMatrix44 = CubismMatrix44;
})(ID || (ID = {}));
class csmRect {
  constructor(e, n, r, i) {
    ((this.x = e), (this.y = n), (this.width = r), (this.height = i));
  }
  getCenterX() {
    return this.x + 0.5 * this.width;
  }
  getCenterY() {
    return this.y + 0.5 * this.height;
  }
  getRight() {
    return this.x + this.width;
  }
  getBottom() {
    return this.y + this.height;
  }
  setRect(e) {
    ((this.x = e.x),
      (this.y = e.y),
      (this.width = e.width),
      (this.height = e.height));
  }
  expand(e, n) {
    ((this.x -= e),
      (this.y -= n),
      (this.width += e * 2),
      (this.height += n * 2));
  }
  x;
  y;
  width;
  height;
}
var kD;
((t) => {
  t.csmRect = csmRect;
})(kD || (kD = {}));
class CubismRenderer {
  static create() {
    return null;
  }
  static delete(e) {}
  initialize(e) {
    this._model = e;
  }
  drawModel() {
    this.getModel() != null &&
      (this.saveProfile(), this.doDrawModel(), this.restoreProfile());
  }
  setMvpMatrix(e) {
    this._mvpMatrix4x4.setMatrix(e.getArray());
  }
  getMvpMatrix() {
    return this._mvpMatrix4x4;
  }
  setModelColor(e, n, r, i) {
    (e < 0 ? (e = 0) : e > 1 && (e = 1),
      n < 0 ? (n = 0) : n > 1 && (n = 1),
      r < 0 ? (r = 0) : r > 1 && (r = 1),
      i < 0 ? (i = 0) : i > 1 && (i = 1),
      (this._modelColor.r = e),
      (this._modelColor.g = n),
      (this._modelColor.b = r),
      (this._modelColor.a = i));
  }
  getModelColor() {
    return JSON.parse(JSON.stringify(this._modelColor));
  }
  getModelColorWithOpacity(e) {
    const n = this.getModelColor();
    return (
      (n.a *= e),
      this.isPremultipliedAlpha() && ((n.r *= n.a), (n.g *= n.a), (n.b *= n.a)),
      n
    );
  }
  setIsPremultipliedAlpha(e) {
    this._isPremultipliedAlpha = e;
  }
  isPremultipliedAlpha() {
    return this._isPremultipliedAlpha;
  }
  setIsCulling(e) {
    this._isCulling = e;
  }
  isCulling() {
    return this._isCulling;
  }
  setAnisotropy(e) {
    this._anisotropy = e;
  }
  getAnisotropy() {
    return this._anisotropy;
  }
  getModel() {
    return this._model;
  }
  useHighPrecisionMask(e) {
    this._useHighPrecisionMask = e;
  }
  isUsingHighPrecisionMask() {
    return this._useHighPrecisionMask;
  }
  constructor() {
    ((this._isCulling = !1),
      (this._isPremultipliedAlpha = !1),
      (this._anisotropy = 0),
      (this._model = null),
      (this._modelColor = new CubismTextureColor()),
      (this._useHighPrecisionMask = !1),
      (this._mvpMatrix4x4 = new CubismMatrix44()),
      this._mvpMatrix4x4.loadIdentity());
  }
  static staticRelease;
  _mvpMatrix4x4;
  _modelColor;
  _isCulling;
  _isPremultipliedAlpha;
  _anisotropy;
  _model;
  _useHighPrecisionMask;
}
var CubismBlendMode = ((t) => (
  (t[(t.CubismBlendMode_Normal = 0)] = "CubismBlendMode_Normal"),
  (t[(t.CubismBlendMode_Additive = 1)] = "CubismBlendMode_Additive"),
  (t[(t.CubismBlendMode_Multiplicative = 2)] =
    "CubismBlendMode_Multiplicative"),
  t
))(CubismBlendMode || {});
class CubismTextureColor {
  constructor(e = 1, n = 1, r = 1, i = 1) {
    ((this.r = e), (this.g = n), (this.b = r), (this.a = i));
  }
  r;
  g;
  b;
  a;
}
class mae {
  constructor(e, n) {
    ((this._clippingIdList = e),
      (this._clippingIdCount = n),
      (this._allClippedDrawRect = new csmRect()),
      (this._layoutBounds = new csmRect()),
      (this._clippedDrawableIndexList = []),
      (this._matrixForMask = new CubismMatrix44()),
      (this._matrixForDraw = new CubismMatrix44()),
      (this._bufferIndex = 0));
  }
  release() {
    (this._layoutBounds != null && (this._layoutBounds = null),
      this._allClippedDrawRect != null && (this._allClippedDrawRect = null),
      this._clippedDrawableIndexList != null &&
        (this._clippedDrawableIndexList = null));
  }
  addClippedDrawable(e) {
    this._clippedDrawableIndexList.push(e);
  }
  _isUsing;
  _clippingIdList;
  _clippingIdCount;
  _layoutChannelIndex;
  _layoutBounds;
  _allClippedDrawRect;
  _matrixForMask;
  _matrixForDraw;
  _clippedDrawableIndexList;
  _bufferIndex;
}
var DD;
((t) => {
  ((t.CubismBlendMode = CubismBlendMode),
    (t.CubismRenderer = CubismRenderer),
    (t.CubismTextureColor = CubismTextureColor));
})(DD || (DD = {}));
const gae = (t, e, n) => {
    CubismDebug.print(t, "[CSM]" + e, n);
  },
  kg = (t, e, n) => {
    gae(
      t,
      e +
        `
`,
      n,
    );
  },
  Si = (t) => {
    console.assert(t);
  };
let Ym, Cs, Yt, Wn;
((Ym = (t, ...e) => {
  kg(Zo.LogLevel_Debug, "[D]" + t, e);
}),
  (Cs = (t, ...e) => {
    kg(Zo.LogLevel_Info, "[I]" + t, e);
  }),
  (Yt = (t, ...e) => {
    kg(Zo.LogLevel_Warning, "[W]" + t, e);
  }),
  (Wn = (t, ...e) => {
    kg(Zo.LogLevel_Error, "[E]" + t, e);
  }));
class CubismDebug {
  static print(e, n, r) {
    if (e < CubismFramework.getLoggingLevel()) return;
    const i = CubismFramework.coreLogFunction;
    if (!i) return;
    const s = n.replace(/\{(\d+)\}/g, (o, a) => r[a]);
    i(s);
  }
  static dumpBytes(e, n, r) {
    for (let i = 0; i < r; i++)
      (i % 16 == 0 && i > 0
        ? this.print(
            e,
            `
`,
          )
        : i % 8 == 0 && i > 0 && this.print(e, "  "),
        this.print(e, "{0} ", [n[i] & 255]));
    this.print(
      e,
      `
`,
    );
  }
  constructor() {}
}
var LD;
((t) => {
  t.CubismDebug = CubismDebug;
})(LD || (LD = {}));
class csmPair {
  constructor(e, n) {
    ((this.first = e ?? null), (this.second = n ?? null));
  }
  first;
  second;
}
class csmMap {
  constructor(e) {
    e != null
      ? e < 1
        ? ((this._keyValues = []), (this._dummyValue = null), (this._size = 0))
        : ((this._keyValues = new Array(e)), (this._size = e))
      : ((this._keyValues = []), (this._dummyValue = null), (this._size = 0));
  }
  release() {
    this.clear();
  }
  appendKey(e) {
    let n = -1;
    for (let r = 0; r < this._size; r++)
      if (this._keyValues[r].first == e) {
        n = r;
        break;
      }
    if (n != -1) {
      Yt("The key `{0}` is already append.", e);
      return;
    }
    (this.prepareCapacity(this._size + 1, !1),
      (this._keyValues[this._size] = new csmPair(e)),
      (this._size += 1));
  }
  getValue(e) {
    let n = -1;
    for (let r = 0; r < this._size; r++)
      if (this._keyValues[r].first == e) {
        n = r;
        break;
      }
    return n >= 0
      ? this._keyValues[n].second
      : (this.appendKey(e), this._keyValues[this._size - 1].second);
  }
  setValue(e, n) {
    let r = -1;
    for (let i = 0; i < this._size; i++)
      if (this._keyValues[i].first == e) {
        r = i;
        break;
      }
    r >= 0
      ? (this._keyValues[r].second = n)
      : (this.appendKey(e), (this._keyValues[this._size - 1].second = n));
  }
  isExist(e) {
    for (let n = 0; n < this._size; n++)
      if (this._keyValues[n].first == e) return !0;
    return !1;
  }
  clear() {
    ((this._keyValues = void 0),
      (this._keyValues = null),
      (this._keyValues = []),
      (this._size = 0));
  }
  getSize() {
    return this._size;
  }
  prepareCapacity(e, n) {
    e > this._keyValues.length &&
      (this._keyValues.length == 0
        ? (!n && e < csmMap.DefaultSize && (e = csmMap.DefaultSize),
          (this._keyValues.length = e))
        : (!n &&
            e < this._keyValues.length * 2 &&
            (e = this._keyValues.length * 2),
          (this._keyValues.length = e)));
  }
  begin() {
    return new Mu(this, 0);
  }
  end() {
    return new Mu(this, this._size);
  }
  erase(e) {
    const n = e._index;
    return n < 0 || this._size <= n
      ? e
      : (this._keyValues.splice(n, 1), --this._size, new Mu(this, n));
  }
  dumpAsInt() {
    for (let e = 0; e < this._size; e++)
      (Ym("{0} ,", this._keyValues[e]),
        Ym(`
`));
  }
  static DefaultSize = 10;
  _keyValues;
  _dummyValue;
  _size;
}
class Mu {
  constructor(e, n) {
    ((this._map = e ?? new csmMap()), (this._index = n ?? 0));
  }
  set(e) {
    return ((this._index = e._index), (this._map = e._map), this);
  }
  preIncrement() {
    return (++this._index, this);
  }
  preDecrement() {
    return (--this._index, this);
  }
  increment() {
    return new Mu(this._map, this._index++);
  }
  decrement() {
    const e = new Mu(this._map, this._index);
    return ((this._map = e._map), (this._index = e._index), this);
  }
  ptr() {
    return this._map._keyValues[this._index];
  }
  notEqual(e) {
    return this._index != e._index || this._map != e._map;
  }
  _index;
  _map;
}
var ND;
((t) => {
  ((t.csmMap = csmMap), (t.csmPair = csmPair), (t.iterator = Mu));
})(ND || (ND = {}));
class E_ {
  static parseJsonObject(e, n) {
    return (
      Object.keys(e).forEach((r) => {
        if (typeof e[r] == "boolean") {
          const i = !!e[r];
          n.put(r, new io(i));
        } else if (typeof e[r] == "string") {
          const i = String(e[r]);
          n.put(r, new th(i));
        } else if (typeof e[r] == "number") {
          const i = Number(e[r]);
          n.put(r, new R_(i));
        } else
          e[r] instanceof Array
            ? n.put(r, E_.parseJsonArray(e[r]))
            : e[r] instanceof Object
              ? n.put(r, E_.parseJsonObject(e[r], new Pf()))
              : e[r] == null
                ? n.put(r, new Af())
                : n.put(r, e[r]);
      }),
      n
    );
  }
  static parseJsonArray(e) {
    const n = new qC();
    return (
      Object.keys(e).forEach((r) => {
        if (typeof Number(r) == "number")
          if (typeof e[r] == "boolean") {
            const s = !!e[r];
            n.add(new io(s));
          } else if (typeof e[r] == "string") {
            const s = String(e[r]);
            n.add(new th(s));
          } else if (typeof e[r] == "number") {
            const s = Number(e[r]);
            n.add(new R_(s));
          } else
            e[r] instanceof Array
              ? n.add(this.parseJsonArray(e[r]))
              : e[r] instanceof Object
                ? n.add(this.parseJsonObject(e[r], new Pf()))
                : e[r] == null
                  ? n.add(new Af())
                  : n.add(e[r]);
        else if (e[r] instanceof Array) n.add(this.parseJsonArray(e[r]));
        else if (e[r] instanceof Object)
          n.add(this.parseJsonObject(e[r], new Pf()));
        else if (e[r] == null) n.add(new Af());
        else {
          const s = Array(e[r]);
          for (let o = 0; o < s.length; o++) n.add(s[o]);
        }
      }),
      n
    );
  }
}
const C_ = "Error: type mismatch",
  vae = "Error: index out of bounds";
let zr = class Io {
  constructor() {}
  getRawString(e, n) {
    return this.getString(e, n);
  }
  toInt(e = 0) {
    return e;
  }
  toFloat(e = 0) {
    return e;
  }
  toBoolean(e = !1) {
    return e;
  }
  getSize() {
    return 0;
  }
  getArray(e = null) {
    return e;
  }
  getVector(e = new csmVector()) {
    return e;
  }
  getMap(e) {
    return e;
  }
  getValueByIndex(e) {
    return Io.errorValue.setErrorNotForClientCall(C_);
  }
  getValueByString(e) {
    return Io.nullValue.setErrorNotForClientCall(C_);
  }
  getKeys() {
    return Io.dummyKeys;
  }
  isError() {
    return !1;
  }
  isNull() {
    return !1;
  }
  isBool() {
    return !1;
  }
  isFloat() {
    return !1;
  }
  isString() {
    return !1;
  }
  isArray() {
    return !1;
  }
  isMap() {
    return !1;
  }
  equals(e) {
    return !1;
  }
  isStatic() {
    return !1;
  }
  setErrorNotForClientCall(e) {
    return Zm.errorValue;
  }
  static staticInitializeNotForClientCall() {
    ((io.trueValue = new io(!0)),
      (io.falseValue = new io(!1)),
      (Io.errorValue = new Zm("ERROR", !0)),
      (Io.nullValue = new Af()),
      (Io.dummyKeys = new csmVector()));
  }
  static staticReleaseNotForClientCall() {
    ((io.trueValue = null),
      (io.falseValue = null),
      (Io.errorValue = null),
      (Io.nullValue = null),
      (Io.dummyKeys = null));
  }
  _stringBuffer;
  static dummyKeys;
  static errorValue;
  static nullValue;
};
class CubismJson {
  constructor(e, n) {
    ((this._error = null),
      (this._lineCount = 0),
      (this._root = null),
      e != null && this.parseBytes(e, n, this._parseCallback));
  }
  static create(e, n) {
    const r = new CubismJson();
    return r.parseBytes(e, n, r._parseCallback)
      ? r
      : (CubismJson.delete(r), null);
  }
  static delete(e) {}
  getRoot() {
    return this._root;
  }
  static arrayBufferToString(e) {
    const n = new Uint8Array(e);
    let r = "";
    for (let i = 0, s = n.length; i < s; ++i)
      r += "%" + this.pad(n[i].toString(16));
    return ((r = decodeURIComponent(r)), r);
  }
  static pad(e) {
    return e.length < 2 ? "0" + e : e;
  }
  parseBytes(e, n, r) {
    const i = new Array(1),
      s = CubismJson.arrayBufferToString(e);
    if (
      (r == null
        ? (this._root = this.parseValue(s, n, 0, i))
        : (this._root = r(JSON.parse(s), new Pf())),
      this._error)
    ) {
      let o = "\0";
      return (
        (o =
          "Json parse error : @line " +
          (this._lineCount + 1) +
          `
`),
        (this._root = new th(o)),
        Cs("{0}", this._root.getRawString()),
        !1
      );
    } else if (this._root == null)
      return ((this._root = new Zm(new csmString(this._error), !1)), !1);
    return !0;
  }
  getParseError() {
    return this._error;
  }
  checkEndOfFile() {
    return this._root.getArray()[1].equals("EOF");
  }
  parseValue(e, n, r, i) {
    if (this._error) return null;
    let s = null,
      o = r,
      a;
    for (; o < n; o++)
      switch (e[o]) {
        case "-":
        case ".":
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9": {
          const c = new Array(1);
          return (
            (a = bae(e.slice(o), c)),
            (i[0] = e.indexOf(c[0])),
            new R_(a)
          );
        }
        case '"':
          return new th(this.parseString(e, n, o + 1, i));
        case "[":
          return ((s = this.parseArray(e, n, o + 1, i)), s);
        case "{":
          return ((s = this.parseObject(e, n, o + 1, i)), s);
        case "n":
          return (
            o + 3 < n
              ? ((s = new Af()), (i[0] = o + 4))
              : (this._error = "parse null"),
            s
          );
        case "t":
          return (
            o + 3 < n
              ? ((s = io.trueValue), (i[0] = o + 4))
              : (this._error = "parse true"),
            s
          );
        case "f":
          return (
            o + 4 < n
              ? ((s = io.falseValue), (i[0] = o + 5))
              : (this._error = "illegal ',' position"),
            s
          );
        case ",":
          return ((this._error = "illegal ',' position"), null);
        case "]":
          return ((i[0] = o), null);
        case `
`:
          this._lineCount++;
      }
    return ((this._error = "illegal end of value"), null);
  }
  parseString(e, n, r, i) {
    if (this._error) return null;
    if (!e) return ((this._error = "string is null"), null);
    let s = r,
      o,
      a;
    const l = new csmString("");
    let c = r;
    for (; s < n; s++)
      switch (((o = e[s]), o)) {
        case '"':
          return ((i[0] = s + 1), l.append(e.slice(c), s - c), l.s);
        case "//":
          if (
            (s++, s - 1 > c && l.append(e.slice(c), s - c), (c = s + 1), s < n)
          )
            switch (((a = e[s]), a)) {
              case "\\":
                l.expansion(1, "\\");
                break;
              case '"':
                l.expansion(1, '"');
                break;
              case "/":
                l.expansion(1, "/");
                break;
              case "b":
                l.expansion(1, "\b");
                break;
              case "f":
                l.expansion(1, "\f");
                break;
              case "n":
                l.expansion(
                  1,
                  `
`,
                );
                break;
              case "r":
                l.expansion(1, "\r");
                break;
              case "t":
                l.expansion(1, "	");
                break;
              case "u":
                this._error = "parse string/unicord escape not supported";
                break;
            }
          else this._error = "parse string/escape error";
      }
    return ((this._error = "parse string/illegal end"), null);
  }
  parseObject(e, n, r, i) {
    if (this._error) return null;
    if (!e) return ((this._error = "buffer is null"), null);
    const s = new Pf();
    let o = "",
      a = r,
      l = "";
    const c = Array(1);
    let u = !1;
    for (; a < n; a++) {
      e: for (; a < n; a++)
        switch (((l = e[a]), l)) {
          case '"':
            if (((o = this.parseString(e, n, a + 1, c)), this._error))
              return null;
            ((a = c[0]), (u = !0));
            break e;
          case "}":
            return ((i[0] = a + 1), s);
          case ":":
            this._error = "illegal ':' position";
            break;
          case `
`:
            this._lineCount++;
        }
      if (!u) return ((this._error = "key not found"), null);
      u = !1;
      e: for (; a < n; a++)
        switch (((l = e[a]), l)) {
          case ":":
            ((u = !0), a++);
            break e;
          case "}":
            this._error = "illegal '}' position";
            break;
          case `
`:
            this._lineCount++;
        }
      if (!u) return ((this._error = "':' not found"), null);
      const d = this.parseValue(e, n, a, c);
      if (this._error) return null;
      ((a = c[0]), s.put(o, d));
      e: for (; a < n; a++)
        switch (((l = e[a]), l)) {
          case ",":
            break e;
          case "}":
            return ((i[0] = a + 1), s);
          case `
`:
            this._lineCount++;
        }
    }
    return ((this._error = "illegal end of perseObject"), null);
  }
  parseArray(e, n, r, i) {
    if (this._error) return null;
    if (!e) return ((this._error = "buffer is null"), null);
    let s = new qC(),
      o = r,
      a;
    const l = new Array(1);
    for (; o < n; o++) {
      const c = this.parseValue(e, n, o, l);
      if (this._error) return null;
      ((o = l[0]), c && s.add(c));
      e: for (; o < n; o++)
        switch (((a = e[o]), a)) {
          case ",":
            break e;
          case "]":
            return ((i[0] = o + 1), s);
          case `
`:
            ++this._lineCount;
        }
    }
    return ((s = void 0), (this._error = "illegal end of parseObject"), null);
  }
  _parseCallback = E_.parseJsonObject;
  _error;
  _lineCount;
  _root;
}
class R_ extends zr {
  constructor(e) {
    (super(), (this._value = e));
  }
  isFloat() {
    return !0;
  }
  getString(e, n) {
    return (
      (this._value = parseFloat("\0")),
      (this._stringBuffer = "\0"),
      this._stringBuffer
    );
  }
  toInt(e = 0) {
    return parseInt(this._value.toString());
  }
  toFloat(e = 0) {
    return this._value;
  }
  equals(e) {
    return typeof e == "number" ? (Math.round(e) ? !1 : e == this._value) : !1;
  }
  _value;
}
class io extends zr {
  isBool() {
    return !0;
  }
  toBoolean(e = !1) {
    return this._boolValue;
  }
  getString(e, n) {
    return (
      (this._stringBuffer = this._boolValue ? "true" : "false"),
      this._stringBuffer
    );
  }
  equals(e) {
    return typeof e == "boolean" ? e == this._boolValue : !1;
  }
  isStatic() {
    return !0;
  }
  constructor(e) {
    (super(), (this._boolValue = e));
  }
  static trueValue;
  static falseValue;
  _boolValue;
}
class th extends zr {
  constructor(e) {
    (super(),
      typeof e == "string" && (this._stringBuffer = e),
      e instanceof csmString && (this._stringBuffer = e.s));
  }
  isString() {
    return !0;
  }
  getString(e, n) {
    return this._stringBuffer;
  }
  equals(e) {
    return typeof e == "string"
      ? this._stringBuffer == e
      : e instanceof csmString
        ? this._stringBuffer == e.s
        : !1;
  }
}
class Zm extends th {
  isStatic() {
    return this._isStatic;
  }
  setErrorNotForClientCall(e) {
    return ((this._stringBuffer = e), this);
  }
  constructor(e, n) {
    (typeof e == "string" ? super(e) : super(e), (this._isStatic = n));
  }
  isError() {
    return !0;
  }
  _isStatic;
}
class Af extends zr {
  isNull() {
    return !0;
  }
  getString(e, n) {
    return this._stringBuffer;
  }
  isStatic() {
    return !0;
  }
  setErrorNotForClientCall(e) {
    return ((this._stringBuffer = e), Zm.nullValue);
  }
  constructor() {
    (super(), (this._stringBuffer = "NullValue"));
  }
}
class qC extends zr {
  constructor() {
    (super(), (this._array = new csmVector()));
  }
  release() {
    for (
      let e = this._array.begin();
      e.notEqual(this._array.end());
      e.preIncrement()
    ) {
      let n = e.ptr();
      n && !n.isStatic() && ((n = void 0), (n = null));
    }
  }
  isArray() {
    return !0;
  }
  getValueByIndex(e) {
    if (e < 0 || this._array.getSize() <= e)
      return zr.errorValue.setErrorNotForClientCall(vae);
    const n = this._array.at(e);
    return n ?? zr.nullValue;
  }
  getValueByString(e) {
    return zr.errorValue.setErrorNotForClientCall(C_);
  }
  getString(e, n) {
    const r =
      n +
      `[
`;
    for (
      let i = this._array.begin();
      i.notEqual(this._array.end());
      i.increment()
    ) {
      const s = i.ptr();
      this._stringBuffer +=
        n +
        "" +
        s.getString(n + " ") +
        `
`;
    }
    return (
      (this._stringBuffer =
        r +
        n +
        `]
`),
      this._stringBuffer
    );
  }
  add(e) {
    this._array.pushBack(e);
  }
  getVector(e = null) {
    return this._array;
  }
  getSize() {
    return this._array.getSize();
  }
  _array;
}
class Pf extends zr {
  constructor() {
    (super(), (this._map = new csmMap()));
  }
  release() {
    const e = this._map.begin();
    for (; e.notEqual(this._map.end());) {
      let n = e.ptr().second;
      (n && !n.isStatic() && ((n = void 0), (n = null)), e.preIncrement());
    }
  }
  isMap() {
    return !0;
  }
  getValueByString(e) {
    if (e instanceof csmString) {
      const n = this._map.getValue(e.s);
      return n ?? zr.nullValue;
    }
    for (
      let n = this._map.begin();
      n.notEqual(this._map.end());
      n.preIncrement()
    )
      if (n.ptr().first == e)
        return n.ptr().second == null ? zr.nullValue : n.ptr().second;
    return zr.nullValue;
  }
  getValueByIndex(e) {
    return zr.errorValue.setErrorNotForClientCall(C_);
  }
  getString(e, n) {
    this._stringBuffer =
      n +
      `{
`;
    const r = this._map.begin();
    for (; r.notEqual(this._map.end());) {
      const i = r.ptr().first,
        s = r.ptr().second;
      ((this._stringBuffer +=
        n +
        " " +
        i +
        " : " +
        s.getString(n + "   ") +
        ` 
`),
        r.preIncrement());
    }
    return (
      (this._stringBuffer +=
        n +
        `}
`),
      this._stringBuffer
    );
  }
  getMap(e) {
    return this._map;
  }
  put(e, n) {
    this._map.setValue(e, n);
  }
  getKeys() {
    if (!this._keys) {
      this._keys = new csmVector();
      const e = this._map.begin();
      for (; e.notEqual(this._map.end());) {
        const n = e.ptr().first;
        (this._keys.pushBack(n), e.preIncrement());
      }
    }
    return this._keys;
  }
  getSize() {
    return this._keys.getSize();
  }
  _map;
  _keys;
}
var OD;
((t) => {
  ((t.CubismJson = CubismJson),
    (t.JsonArray = qC),
    (t.JsonBoolean = io),
    (t.JsonError = Zm),
    (t.JsonFloat = R_),
    (t.JsonMap = Pf),
    (t.JsonNullvalue = Af),
    (t.JsonString = th),
    (t.Value = zr));
})(OD || (OD = {}));
function bae(t, e) {
  let n = 0;
  for (let i = 1; ; i++) {
    const s = t.slice(i - 1, i);
    if (s == "e" || s == "-" || s == "E") continue;
    const o = t.substring(0, i),
      a = Number(o);
    if (isNaN(a)) break;
    n = i;
  }
  let r = parseFloat(t);
  return (isNaN(r) && (r = NaN), (e[0] = t.slice(n)), r);
}
let Hs = !1,
  gd = !1,
  vd = null,
  ep = null;
const Gr = Object.freeze({ vertexOffset: 0, vertexStep: 2 });
function csmDelete(t) {
  t && (t = void 0);
}
class CubismFramework {
  static startUp(e = null) {
    if (Hs) return (Cs("CubismFramework.startUp() is already done."), Hs);
    if (
      ((vd = e),
      vd != null &&
        Live2DCubismCore.Logging.csmGetLogFunction() !== vd.logFunction &&
        Live2DCubismCore.Logging.csmSetLogFunction(vd.logFunction),
      (Hs = !0),
      Hs)
    ) {
      const n = Live2DCubismCore.Version.csmGetVersion(),
        r = (n & 4278190080) >> 24,
        i = (n & 16711680) >> 16,
        s = n & 65535,
        o = n;
      Cs(
        "Live2D Cubism Core version: {0}.{1}.{2} ({3})",
        ("00" + r).slice(-2),
        ("00" + i).slice(-2),
        ("0000" + s).slice(-4),
        o,
      );
    }
    return (Cs("CubismFramework.startUp() is complete."), Hs);
  }
  static cleanUp() {
    ((Hs = !1), (gd = !1), (vd = null), (ep = null));
  }
  static initialize(e = 0) {
    if ((Si(Hs), !Hs)) {
      Yt("CubismFramework is not started.");
      return;
    }
    if (gd) {
      Yt("CubismFramework.initialize() skipped, already initialized.");
      return;
    }
    (zr.staticInitializeNotForClientCall(),
      (ep = new CubismIdManager()),
      Live2DCubismCore.Memory.initializeAmountOfMemory(e),
      (gd = !0),
      Cs("CubismFramework.initialize() is complete."));
  }
  static dispose() {
    if ((Si(Hs), !Hs)) {
      Yt("CubismFramework is not started.");
      return;
    }
    if (!gd) {
      Yt("CubismFramework.dispose() skipped, not initialized.");
      return;
    }
    (zr.staticReleaseNotForClientCall(),
      ep.release(),
      (ep = null),
      CubismRenderer.staticRelease(),
      (gd = !1),
      Cs("CubismFramework.dispose() is complete."));
  }
  static isStarted() {
    return Hs;
  }
  static isInitialized() {
    return gd;
  }
  static coreLogFunction(e) {
    Live2DCubismCore.Logging.csmGetLogFunction() &&
      Live2DCubismCore.Logging.csmGetLogFunction()(e);
  }
  static getLoggingLevel() {
    return vd != null ? vd.loggingLevel : 5;
  }
  static getIdManager() {
    return ep;
  }
  constructor() {}
}
class _ae {
  logFunction;
  loggingLevel;
}
var Zo = ((t) => (
    (t[(t.LogLevel_Verbose = 0)] = "LogLevel_Verbose"),
    (t[(t.LogLevel_Debug = 1)] = "LogLevel_Debug"),
    (t[(t.LogLevel_Info = 2)] = "LogLevel_Info"),
    (t[(t.LogLevel_Warning = 3)] = "LogLevel_Warning"),
    (t[(t.LogLevel_Error = 4)] = "LogLevel_Error"),
    (t[(t.LogLevel_Off = 5)] = "LogLevel_Off"),
    t
  ))(Zo || {}),
  FD;
((t) => {
  ((t.Constant = Gr),
    (t.csmDelete = csmDelete),
    (t.CubismFramework = CubismFramework));
})(FD || (FD = {}));
let bd;
const yae = 10;
class CubismShader_WebGL {
  constructor() {
    this._shaderSets = new csmVector();
  }
  release() {
    this.releaseShaderProgram();
  }
  setupShaderProgramForDraw(e, n, r) {
    (e.isPremultipliedAlpha() || Wn("NoPremultipliedAlpha is not allowed"),
      this._shaderSets.getSize() == 0 && this.generateShaders());
    let i, s, o, a;
    const l = e.getClippingContextBufferForDraw() != null,
      c = n.getDrawableInvertedMaskBit(r),
      u = l ? (c ? 2 : 1) : 0;
    let d;
    switch (n.getDrawableBlendMode(r)) {
      case CubismBlendMode.CubismBlendMode_Normal:
      default:
        ((d = this._shaderSets.at(1 + u)),
          (i = this.gl.ONE),
          (s = this.gl.ONE_MINUS_SRC_ALPHA),
          (o = this.gl.ONE),
          (a = this.gl.ONE_MINUS_SRC_ALPHA));
        break;
      case CubismBlendMode.CubismBlendMode_Additive:
        ((d = this._shaderSets.at(4 + u)),
          (i = this.gl.ONE),
          (s = this.gl.ONE),
          (o = this.gl.ZERO),
          (a = this.gl.ONE));
        break;
      case CubismBlendMode.CubismBlendMode_Multiplicative:
        ((d = this._shaderSets.at(7 + u)),
          (i = this.gl.DST_COLOR),
          (s = this.gl.ONE_MINUS_SRC_ALPHA),
          (o = this.gl.ZERO),
          (a = this.gl.ONE));
        break;
    }
    if (
      (this.gl.useProgram(d.shaderProgram),
      e.bindDrawableVertexBuffers(
        n,
        r,
        d.attributePositionLocation,
        d.attributeTexCoordLocation,
      ),
      l)
    ) {
      this.gl.activeTexture(this.gl.TEXTURE1);
      const y = e
        .getClippingContextBufferForDraw()
        .getClippingManager()
        .getColorBuffer()
        .at(e.getClippingContextBufferForDraw()._bufferIndex);
      (this.gl.bindTexture(this.gl.TEXTURE_2D, y),
        this.gl.uniform1i(d.samplerTexture1Location, 1),
        this.gl.uniformMatrix4fv(
          d.uniformClipMatrixLocation,
          !1,
          e.getClippingContextBufferForDraw()._matrixForDraw.getArray(),
        ));
      const x = e.getClippingContextBufferForDraw()._layoutChannelIndex,
        w = e
          .getClippingContextBufferForDraw()
          .getClippingManager()
          .getChannelFlagAsColor(x);
      this.gl.uniform4f(d.uniformChannelFlagLocation, w.r, w.g, w.b, w.a);
    }
    const f = n.getDrawableTextureIndex(r),
      h = e.getBindedTextures().getValue(f);
    (this.gl.activeTexture(this.gl.TEXTURE0),
      this.gl.bindTexture(this.gl.TEXTURE_2D, h),
      this.gl.uniform1i(d.samplerTexture0Location, 0));
    const _ = e.getMvpMatrix();
    this.gl.uniformMatrix4fv(d.uniformMatrixLocation, !1, _.getArray());
    const m = e.getModelColorWithOpacity(n.getDrawableOpacity(r)),
      p = n.getMultiplyColor(r),
      v = n.getScreenColor(r);
    (this.gl.uniform4f(d.uniformBaseColorLocation, m.r, m.g, m.b, m.a),
      this.gl.uniform4f(d.uniformMultiplyColorLocation, p.r, p.g, p.b, p.a),
      this.gl.uniform4f(d.uniformScreenColorLocation, v.r, v.g, v.b, v.a),
      e.bindDrawableIndexBuffer(n, r),
      this.gl.blendFuncSeparate(i, s, o, a));
  }
  setupShaderProgramForMask(e, n, r) {
    (e.isPremultipliedAlpha() || Wn("NoPremultipliedAlpha is not allowed"),
      this._shaderSets.getSize() == 0 && this.generateShaders());
    const i = this._shaderSets.at(0);
    (this.gl.useProgram(i.shaderProgram),
      e.bindDrawableVertexBuffers(
        n,
        r,
        i.attributePositionLocation,
        i.attributeTexCoordLocation,
      ));
    const s = n.getDrawableTextureIndex(r),
      o = e.getBindedTextures().getValue(s);
    (this.gl.activeTexture(this.gl.TEXTURE0),
      this.gl.bindTexture(this.gl.TEXTURE_2D, o),
      this.gl.uniform1i(i.samplerTexture0Location, 0),
      e.getClippingContextBufferForMask());
    const a = e.getClippingContextBufferForMask()._layoutChannelIndex,
      l = e
        .getClippingContextBufferForMask()
        .getClippingManager()
        .getChannelFlagAsColor(a);
    (this.gl.uniform4f(i.uniformChannelFlagLocation, l.r, l.g, l.b, l.a),
      this.gl.uniformMatrix4fv(
        i.uniformClipMatrixLocation,
        !1,
        e.getClippingContextBufferForMask()._matrixForMask.getArray(),
      ));
    const c = e.getClippingContextBufferForMask()._layoutBounds;
    this.gl.uniform4f(
      i.uniformBaseColorLocation,
      c.x * 2 - 1,
      c.y * 2 - 1,
      c.getRight() * 2 - 1,
      c.getBottom() * 2 - 1,
    );
    const u = n.getMultiplyColor(r),
      d = n.getScreenColor(r);
    (this.gl.uniform4f(i.uniformMultiplyColorLocation, u.r, u.g, u.b, u.a),
      this.gl.uniform4f(i.uniformScreenColorLocation, d.r, d.g, d.b, d.a));
    const f = this.gl.ZERO,
      h = this.gl.ONE_MINUS_SRC_COLOR,
      _ = this.gl.ZERO,
      m = this.gl.ONE_MINUS_SRC_ALPHA;
    (e.bindDrawableIndexBuffer(n, r), this.gl.blendFuncSeparate(f, h, _, m));
  }
  invalidateShaders() {
    this._shaderSets.clear();
  }
  releaseShaderProgram() {
    for (let e = 0; e < this._shaderSets.getSize(); e++)
      (this.gl.deleteProgram(this._shaderSets.at(e).shaderProgram),
        (this._shaderSets.at(e).shaderProgram = 0),
        this._shaderSets.set(e, void 0),
        this._shaderSets.set(e, null));
  }
  generateShaders() {
    for (let e = 0; e < yae; e++)
      this._shaderSets.pushBack(new CubismShaderSet());
    ((this._shaderSets.at(0).shaderProgram = this.loadShaderProgram(xae, wae)),
      (this._shaderSets.at(1).shaderProgram = this.loadShaderProgram(Sae, Mae)),
      (this._shaderSets.at(2).shaderProgram = this.loadShaderProgram(BD, Tae)),
      (this._shaderSets.at(3).shaderProgram = this.loadShaderProgram(BD, Eae)),
      (this._shaderSets.at(4).shaderProgram =
        this._shaderSets.at(1).shaderProgram),
      (this._shaderSets.at(5).shaderProgram =
        this._shaderSets.at(2).shaderProgram),
      (this._shaderSets.at(6).shaderProgram =
        this._shaderSets.at(3).shaderProgram),
      (this._shaderSets.at(7).shaderProgram =
        this._shaderSets.at(1).shaderProgram),
      (this._shaderSets.at(8).shaderProgram =
        this._shaderSets.at(2).shaderProgram),
      (this._shaderSets.at(9).shaderProgram =
        this._shaderSets.at(3).shaderProgram),
      (this._shaderSets.at(0).attributePositionLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(0).shaderProgram,
          "a_position",
        )),
      (this._shaderSets.at(0).attributeTexCoordLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(0).shaderProgram,
          "a_texCoord",
        )),
      (this._shaderSets.at(0).samplerTexture0Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(0).shaderProgram,
          "s_texture0",
        )),
      (this._shaderSets.at(0).uniformClipMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(0).shaderProgram,
          "u_clipMatrix",
        )),
      (this._shaderSets.at(0).uniformChannelFlagLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(0).shaderProgram,
          "u_channelFlag",
        )),
      (this._shaderSets.at(0).uniformBaseColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(0).shaderProgram,
          "u_baseColor",
        )),
      (this._shaderSets.at(0).uniformMultiplyColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(0).shaderProgram,
          "u_multiplyColor",
        )),
      (this._shaderSets.at(0).uniformScreenColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(0).shaderProgram,
          "u_screenColor",
        )),
      (this._shaderSets.at(1).attributePositionLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(1).shaderProgram,
          "a_position",
        )),
      (this._shaderSets.at(1).attributeTexCoordLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(1).shaderProgram,
          "a_texCoord",
        )),
      (this._shaderSets.at(1).samplerTexture0Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(1).shaderProgram,
          "s_texture0",
        )),
      (this._shaderSets.at(1).uniformMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(1).shaderProgram,
          "u_matrix",
        )),
      (this._shaderSets.at(1).uniformBaseColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(1).shaderProgram,
          "u_baseColor",
        )),
      (this._shaderSets.at(1).uniformMultiplyColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(1).shaderProgram,
          "u_multiplyColor",
        )),
      (this._shaderSets.at(1).uniformScreenColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(1).shaderProgram,
          "u_screenColor",
        )),
      (this._shaderSets.at(2).attributePositionLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(2).shaderProgram,
          "a_position",
        )),
      (this._shaderSets.at(2).attributeTexCoordLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(2).shaderProgram,
          "a_texCoord",
        )),
      (this._shaderSets.at(2).samplerTexture0Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(2).shaderProgram,
          "s_texture0",
        )),
      (this._shaderSets.at(2).samplerTexture1Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(2).shaderProgram,
          "s_texture1",
        )),
      (this._shaderSets.at(2).uniformMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(2).shaderProgram,
          "u_matrix",
        )),
      (this._shaderSets.at(2).uniformClipMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(2).shaderProgram,
          "u_clipMatrix",
        )),
      (this._shaderSets.at(2).uniformChannelFlagLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(2).shaderProgram,
          "u_channelFlag",
        )),
      (this._shaderSets.at(2).uniformBaseColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(2).shaderProgram,
          "u_baseColor",
        )),
      (this._shaderSets.at(2).uniformMultiplyColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(2).shaderProgram,
          "u_multiplyColor",
        )),
      (this._shaderSets.at(2).uniformScreenColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(2).shaderProgram,
          "u_screenColor",
        )),
      (this._shaderSets.at(3).attributePositionLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(3).shaderProgram,
          "a_position",
        )),
      (this._shaderSets.at(3).attributeTexCoordLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(3).shaderProgram,
          "a_texCoord",
        )),
      (this._shaderSets.at(3).samplerTexture0Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(3).shaderProgram,
          "s_texture0",
        )),
      (this._shaderSets.at(3).samplerTexture1Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(3).shaderProgram,
          "s_texture1",
        )),
      (this._shaderSets.at(3).uniformMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(3).shaderProgram,
          "u_matrix",
        )),
      (this._shaderSets.at(3).uniformClipMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(3).shaderProgram,
          "u_clipMatrix",
        )),
      (this._shaderSets.at(3).uniformChannelFlagLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(3).shaderProgram,
          "u_channelFlag",
        )),
      (this._shaderSets.at(3).uniformBaseColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(3).shaderProgram,
          "u_baseColor",
        )),
      (this._shaderSets.at(3).uniformMultiplyColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(3).shaderProgram,
          "u_multiplyColor",
        )),
      (this._shaderSets.at(3).uniformScreenColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(3).shaderProgram,
          "u_screenColor",
        )),
      (this._shaderSets.at(4).attributePositionLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(4).shaderProgram,
          "a_position",
        )),
      (this._shaderSets.at(4).attributeTexCoordLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(4).shaderProgram,
          "a_texCoord",
        )),
      (this._shaderSets.at(4).samplerTexture0Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(4).shaderProgram,
          "s_texture0",
        )),
      (this._shaderSets.at(4).uniformMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(4).shaderProgram,
          "u_matrix",
        )),
      (this._shaderSets.at(4).uniformBaseColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(4).shaderProgram,
          "u_baseColor",
        )),
      (this._shaderSets.at(4).uniformMultiplyColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(4).shaderProgram,
          "u_multiplyColor",
        )),
      (this._shaderSets.at(4).uniformScreenColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(4).shaderProgram,
          "u_screenColor",
        )),
      (this._shaderSets.at(5).attributePositionLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(5).shaderProgram,
          "a_position",
        )),
      (this._shaderSets.at(5).attributeTexCoordLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(5).shaderProgram,
          "a_texCoord",
        )),
      (this._shaderSets.at(5).samplerTexture0Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(5).shaderProgram,
          "s_texture0",
        )),
      (this._shaderSets.at(5).samplerTexture1Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(5).shaderProgram,
          "s_texture1",
        )),
      (this._shaderSets.at(5).uniformMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(5).shaderProgram,
          "u_matrix",
        )),
      (this._shaderSets.at(5).uniformClipMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(5).shaderProgram,
          "u_clipMatrix",
        )),
      (this._shaderSets.at(5).uniformChannelFlagLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(5).shaderProgram,
          "u_channelFlag",
        )),
      (this._shaderSets.at(5).uniformBaseColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(5).shaderProgram,
          "u_baseColor",
        )),
      (this._shaderSets.at(5).uniformMultiplyColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(5).shaderProgram,
          "u_multiplyColor",
        )),
      (this._shaderSets.at(5).uniformScreenColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(5).shaderProgram,
          "u_screenColor",
        )),
      (this._shaderSets.at(6).attributePositionLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(6).shaderProgram,
          "a_position",
        )),
      (this._shaderSets.at(6).attributeTexCoordLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(6).shaderProgram,
          "a_texCoord",
        )),
      (this._shaderSets.at(6).samplerTexture0Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(6).shaderProgram,
          "s_texture0",
        )),
      (this._shaderSets.at(6).samplerTexture1Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(6).shaderProgram,
          "s_texture1",
        )),
      (this._shaderSets.at(6).uniformMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(6).shaderProgram,
          "u_matrix",
        )),
      (this._shaderSets.at(6).uniformClipMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(6).shaderProgram,
          "u_clipMatrix",
        )),
      (this._shaderSets.at(6).uniformChannelFlagLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(6).shaderProgram,
          "u_channelFlag",
        )),
      (this._shaderSets.at(6).uniformBaseColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(6).shaderProgram,
          "u_baseColor",
        )),
      (this._shaderSets.at(6).uniformMultiplyColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(6).shaderProgram,
          "u_multiplyColor",
        )),
      (this._shaderSets.at(6).uniformScreenColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(6).shaderProgram,
          "u_screenColor",
        )),
      (this._shaderSets.at(7).attributePositionLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(7).shaderProgram,
          "a_position",
        )),
      (this._shaderSets.at(7).attributeTexCoordLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(7).shaderProgram,
          "a_texCoord",
        )),
      (this._shaderSets.at(7).samplerTexture0Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(7).shaderProgram,
          "s_texture0",
        )),
      (this._shaderSets.at(7).uniformMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(7).shaderProgram,
          "u_matrix",
        )),
      (this._shaderSets.at(7).uniformBaseColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(7).shaderProgram,
          "u_baseColor",
        )),
      (this._shaderSets.at(7).uniformMultiplyColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(7).shaderProgram,
          "u_multiplyColor",
        )),
      (this._shaderSets.at(7).uniformScreenColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(7).shaderProgram,
          "u_screenColor",
        )),
      (this._shaderSets.at(8).attributePositionLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(8).shaderProgram,
          "a_position",
        )),
      (this._shaderSets.at(8).attributeTexCoordLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(8).shaderProgram,
          "a_texCoord",
        )),
      (this._shaderSets.at(8).samplerTexture0Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(8).shaderProgram,
          "s_texture0",
        )),
      (this._shaderSets.at(8).samplerTexture1Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(8).shaderProgram,
          "s_texture1",
        )),
      (this._shaderSets.at(8).uniformMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(8).shaderProgram,
          "u_matrix",
        )),
      (this._shaderSets.at(8).uniformClipMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(8).shaderProgram,
          "u_clipMatrix",
        )),
      (this._shaderSets.at(8).uniformChannelFlagLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(8).shaderProgram,
          "u_channelFlag",
        )),
      (this._shaderSets.at(8).uniformBaseColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(8).shaderProgram,
          "u_baseColor",
        )),
      (this._shaderSets.at(8).uniformMultiplyColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(8).shaderProgram,
          "u_multiplyColor",
        )),
      (this._shaderSets.at(8).uniformScreenColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(8).shaderProgram,
          "u_screenColor",
        )),
      (this._shaderSets.at(9).attributePositionLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(9).shaderProgram,
          "a_position",
        )),
      (this._shaderSets.at(9).attributeTexCoordLocation =
        this.gl.getAttribLocation(
          this._shaderSets.at(9).shaderProgram,
          "a_texCoord",
        )),
      (this._shaderSets.at(9).samplerTexture0Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(9).shaderProgram,
          "s_texture0",
        )),
      (this._shaderSets.at(9).samplerTexture1Location =
        this.gl.getUniformLocation(
          this._shaderSets.at(9).shaderProgram,
          "s_texture1",
        )),
      (this._shaderSets.at(9).uniformMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(9).shaderProgram,
          "u_matrix",
        )),
      (this._shaderSets.at(9).uniformClipMatrixLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(9).shaderProgram,
          "u_clipMatrix",
        )),
      (this._shaderSets.at(9).uniformChannelFlagLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(9).shaderProgram,
          "u_channelFlag",
        )),
      (this._shaderSets.at(9).uniformBaseColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(9).shaderProgram,
          "u_baseColor",
        )),
      (this._shaderSets.at(9).uniformMultiplyColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(9).shaderProgram,
          "u_multiplyColor",
        )),
      (this._shaderSets.at(9).uniformScreenColorLocation =
        this.gl.getUniformLocation(
          this._shaderSets.at(9).shaderProgram,
          "u_screenColor",
        )));
  }
  loadShaderProgram(e, n) {
    let r = this.gl.createProgram(),
      i = this.compileShaderSource(this.gl.VERTEX_SHADER, e);
    if (!i) return (Wn("Vertex shader compile error!"), 0);
    let s = this.compileShaderSource(this.gl.FRAGMENT_SHADER, n);
    return s
      ? (this.gl.attachShader(r, i),
        this.gl.attachShader(r, s),
        this.gl.linkProgram(r),
        this.gl.getProgramParameter(r, this.gl.LINK_STATUS)
          ? (this.gl.deleteShader(i), this.gl.deleteShader(s), r)
          : (Wn("Failed to link program: {0}", r),
            this.gl.deleteShader(i),
            (i = 0),
            this.gl.deleteShader(s),
            (s = 0),
            r && (this.gl.deleteProgram(r), (r = 0)),
            0))
      : (Wn("Vertex shader compile error!"), 0);
  }
  compileShaderSource(e, n) {
    const r = n,
      i = this.gl.createShader(e);
    if ((this.gl.shaderSource(i, r), this.gl.compileShader(i), !i)) {
      const o = this.gl.getShaderInfoLog(i);
      Wn("Shader compile log: {0} ", o);
    }
    return this.gl.getShaderParameter(i, this.gl.COMPILE_STATUS)
      ? i
      : (this.gl.deleteShader(i), null);
  }
  setGl(e) {
    this.gl = e;
  }
  _shaderSets;
  gl;
}
class CubismShaderManager_WebGL {
  static getInstance() {
    return (bd == null && (bd = new CubismShaderManager_WebGL()), bd);
  }
  static deleteInstance() {
    bd && (bd.release(), (bd = null));
  }
  constructor() {
    this._shaderMap = new csmMap();
  }
  release() {
    for (
      const e = this._shaderMap.begin();
      e.notEqual(this._shaderMap.end());
      e.preIncrement()
    )
      e.ptr().second.release();
    this._shaderMap.clear();
  }
  getShader(e) {
    return this._shaderMap.getValue(e);
  }
  setGlContext(e) {
    if (!this._shaderMap.isExist(e)) {
      const n = new CubismShader_WebGL();
      (n.setGl(e), this._shaderMap.setValue(e, n));
    }
  }
  invalidateGlContext(e) {
    this._shaderMap.isExist(e) &&
      this._shaderMap.getValue(e).invalidateShaders();
  }
  _shaderMap;
}
class CubismShaderSet {
  shaderProgram;
  attributePositionLocation;
  attributeTexCoordLocation;
  uniformMatrixLocation;
  uniformClipMatrixLocation;
  samplerTexture0Location;
  samplerTexture1Location;
  uniformBaseColorLocation;
  uniformChannelFlagLocation;
  uniformMultiplyColorLocation;
  uniformScreenColorLocation;
}
var w8 = ((t) => (
  (t[(t.ShaderNames_SetupMask = 0)] = "ShaderNames_SetupMask"),
  (t[(t.ShaderNames_NormalPremultipliedAlpha = 1)] =
    "ShaderNames_NormalPremultipliedAlpha"),
  (t[(t.ShaderNames_NormalMaskedPremultipliedAlpha = 2)] =
    "ShaderNames_NormalMaskedPremultipliedAlpha"),
  (t[(t.ShaderNames_NomralMaskedInvertedPremultipliedAlpha = 3)] =
    "ShaderNames_NomralMaskedInvertedPremultipliedAlpha"),
  (t[(t.ShaderNames_AddPremultipliedAlpha = 4)] =
    "ShaderNames_AddPremultipliedAlpha"),
  (t[(t.ShaderNames_AddMaskedPremultipliedAlpha = 5)] =
    "ShaderNames_AddMaskedPremultipliedAlpha"),
  (t[(t.ShaderNames_AddMaskedPremultipliedAlphaInverted = 6)] =
    "ShaderNames_AddMaskedPremultipliedAlphaInverted"),
  (t[(t.ShaderNames_MultPremultipliedAlpha = 7)] =
    "ShaderNames_MultPremultipliedAlpha"),
  (t[(t.ShaderNames_MultMaskedPremultipliedAlpha = 8)] =
    "ShaderNames_MultMaskedPremultipliedAlpha"),
  (t[(t.ShaderNames_MultMaskedPremultipliedAlphaInverted = 9)] =
    "ShaderNames_MultMaskedPremultipliedAlphaInverted"),
  t
))(w8 || {});
const xae =
    "attribute vec4     a_position;attribute vec2     a_texCoord;varying vec2       v_texCoord;varying vec4       v_myPos;uniform mat4       u_clipMatrix;void main(){   gl_Position = u_clipMatrix * a_position;   v_myPos = u_clipMatrix * a_position;   v_texCoord = a_texCoord;   v_texCoord.y = 1.0 - v_texCoord.y;}",
  wae =
    "precision mediump float;varying vec2       v_texCoord;varying vec4       v_myPos;uniform vec4       u_baseColor;uniform vec4       u_channelFlag;uniform sampler2D  s_texture0;void main(){   float isInside =        step(u_baseColor.x, v_myPos.x/v_myPos.w)       * step(u_baseColor.y, v_myPos.y/v_myPos.w)       * step(v_myPos.x/v_myPos.w, u_baseColor.z)       * step(v_myPos.y/v_myPos.w, u_baseColor.w);   gl_FragColor = u_channelFlag * texture2D(s_texture0, v_texCoord).a * isInside;}",
  Sae =
    "attribute vec4     a_position;attribute vec2     a_texCoord;varying vec2       v_texCoord;uniform mat4       u_matrix;void main(){   gl_Position = u_matrix * a_position;   v_texCoord = a_texCoord;   v_texCoord.y = 1.0 - v_texCoord.y;}",
  BD =
    "attribute vec4     a_position;attribute vec2     a_texCoord;varying vec2       v_texCoord;varying vec4       v_clipPos;uniform mat4       u_matrix;uniform mat4       u_clipMatrix;void main(){   gl_Position = u_matrix * a_position;   v_clipPos = u_clipMatrix * a_position;   v_texCoord = a_texCoord;   v_texCoord.y = 1.0 - v_texCoord.y;}",
  Mae =
    "precision mediump float;varying vec2       v_texCoord;uniform vec4       u_baseColor;uniform sampler2D  s_texture0;uniform vec4       u_multiplyColor;uniform vec4       u_screenColor;void main(){   vec4 texColor = texture2D(s_texture0, v_texCoord);   texColor.rgb = texColor.rgb * u_multiplyColor.rgb;   texColor.rgb = (texColor.rgb + u_screenColor.rgb * texColor.a) - (texColor.rgb * u_screenColor.rgb);   vec4 color = texColor * u_baseColor;   gl_FragColor = vec4(color.rgb, color.a);}",
  Tae =
    "precision mediump float;varying vec2       v_texCoord;varying vec4       v_clipPos;uniform vec4       u_baseColor;uniform vec4       u_channelFlag;uniform sampler2D  s_texture0;uniform sampler2D  s_texture1;uniform vec4       u_multiplyColor;uniform vec4       u_screenColor;void main(){   vec4 texColor = texture2D(s_texture0, v_texCoord);   texColor.rgb = texColor.rgb * u_multiplyColor.rgb;   texColor.rgb = (texColor.rgb + u_screenColor.rgb * texColor.a) - (texColor.rgb * u_screenColor.rgb);   vec4 col_formask = texColor * u_baseColor;   vec4 clipMask = (1.0 - texture2D(s_texture1, v_clipPos.xy / v_clipPos.w)) * u_channelFlag;   float maskVal = clipMask.r + clipMask.g + clipMask.b + clipMask.a;   col_formask = col_formask * maskVal;   gl_FragColor = col_formask;}",
  Eae =
    "precision mediump float;varying vec2      v_texCoord;varying vec4      v_clipPos;uniform sampler2D s_texture0;uniform sampler2D s_texture1;uniform vec4      u_channelFlag;uniform vec4      u_baseColor;uniform vec4      u_multiplyColor;uniform vec4      u_screenColor;void main(){   vec4 texColor = texture2D(s_texture0, v_texCoord);   texColor.rgb = texColor.rgb * u_multiplyColor.rgb;   texColor.rgb = (texColor.rgb + u_screenColor.rgb * texColor.a) - (texColor.rgb * u_screenColor.rgb);   vec4 col_formask = texColor * u_baseColor;   vec4 clipMask = (1.0 - texture2D(s_texture1, v_clipPos.xy / v_clipPos.w)) * u_channelFlag;   float maskVal = clipMask.r + clipMask.g + clipMask.b + clipMask.a;   col_formask = col_formask * (1.0 - maskVal);   gl_FragColor = col_formask;}";
var UD;
((t) => {
  ((t.CubismShaderSet = CubismShaderSet),
    (t.CubismShader_WebGL = CubismShader_WebGL),
    (t.CubismShaderManager_WebGL = CubismShaderManager_WebGL),
    (t.ShaderNames = w8));
})(UD || (UD = {}));
const ENGINE_DEFAULTS = {
    baseUrl: "/",
    logging: "info",
    rafIntervalMs: void 0,
  },
  RENDER_DEFAULTS = {
    premultipliedAlpha: !0,
    clearColor: [0, 0, 0, 0],
    maxResolution: 3072,
  },
  INPUT_DEFAULTS = { enableDrag: !0, enableTap: !0, passThrough: !0 },
  CAMERA_DEFAULTS = { viewScale: 1, offsetX: 0, offsetY: 0 };
class Camera {
  viewScale;
  offsetX;
  offsetY;
  constructor(e) {
    ((this.viewScale = e?.viewScale ?? 1),
      (this.offsetX = e?.offsetX ?? 0),
      (this.offsetY = e?.offsetY ?? 0));
  }
  setViewScale(e) {
    this.viewScale = e;
  }
  setOffsets(e, n) {
    ((this.offsetX = e), (this.offsetY = n));
  }
  getProjection(e, n, r) {
    const i = new CubismMatrix44();
    return (
      i.loadIdentity(),
      e.model &&
        (e.model.getCanvasWidth() > 1 && n < r
          ? (e.getModelMatrix().setWidth(2), i.scale(1, n / r))
          : i.scale(r / n, 1),
        i.scaleRelative(this.viewScale, this.viewScale),
        i.translateRelative(this.offsetX, this.offsetY)),
      i
    );
  }
  screenToModel(e, n, r, i) {
    const s = ((e - r.left) / r.width) * 2 - 1,
      o = ((r.bottom - n) / r.height) * 2 - 1;
    if (i && i.model) {
      const u = this.getProjection(i, r.width, r.height),
        d = new CubismMatrix44();
      (d.loadIdentity(),
        d.multiplyByMatrix(u),
        d.multiplyByMatrix(i.getModelMatrix()));
      const f = d.invertTransformX(s),
        h = d.invertTransformY(o);
      return { x: f, y: h };
    }
    const a = this.viewScale !== 0 ? 1 / this.viewScale : 1,
      l = (s - this.offsetX) * a,
      c = (o - this.offsetY) * a;
    return { x: l, y: c };
  }
}
class PointerInput {
  canvas;
  camera;
  callbacks;
  enableDrag;
  enableTap;
  passThrough;
  eventTarget;
  useCapture;
  isDragging = !1;
  activePointerId = null;
  currentModel = null;
  handlePointerDown = (e) => {
    const n = e;
    if (n.button !== 0) return;
    if (this.passThrough) {
      if (
        n.target instanceof Element &&
        n.target.closest("[data-live2d-input-ignore]") !== null
      )
        return;
      const i = this.canvas.getBoundingClientRect(),
        s = n.clientX,
        o = n.clientY;
      if (s < i.left || s > i.right || o < i.top || o > i.bottom) return;
    }
    const r = this.toModelCoords(n);
    (this.enableTap && this.callbacks.onTap?.(r.x, r.y, n),
      this.enableDrag &&
        ((this.isDragging = !0),
        (this.activePointerId = n.pointerId),
        this.passThrough || this.canvas.setPointerCapture(n.pointerId),
        this.callbacks.onDrag?.(r.x, r.y, n, "start")));
  };
  handlePointerMove = (e) => {
    const n = e;
    if (
      !this.enableDrag ||
      !this.isDragging ||
      n.pointerId !== this.activePointerId
    )
      return;
    const r = this.toModelCoords(n);
    this.callbacks.onDrag?.(r.x, r.y, n, "move");
  };
  handlePointerUp = (e) => {
    const n = e;
    n.pointerId === this.activePointerId &&
      ((this.isDragging = !1),
      (this.activePointerId = null),
      this.passThrough || this.canvas.releasePointerCapture(n.pointerId),
      this.callbacks.onDragEnd?.(n));
  };
  constructor(e, n, r, i) {
    ((this.canvas = e),
      (this.camera = r),
      (this.callbacks = i),
      (this.enableDrag = n?.enableDrag ?? !0),
      (this.enableTap = n?.enableTap ?? !0),
      (this.passThrough = n?.passThrough ?? !1),
      (this.eventTarget = this.passThrough ? window : this.canvas),
      (this.useCapture = this.passThrough),
      this.eventTarget.addEventListener("pointerdown", this.handlePointerDown, {
        passive: !0,
        capture: this.useCapture,
      }),
      this.eventTarget.addEventListener("pointermove", this.handlePointerMove, {
        passive: !0,
        capture: this.useCapture,
      }),
      this.eventTarget.addEventListener("pointerup", this.handlePointerUp, {
        passive: !0,
        capture: this.useCapture,
      }),
      this.eventTarget.addEventListener("pointercancel", this.handlePointerUp, {
        passive: !0,
        capture: this.useCapture,
      }));
  }
  destroy() {
    (this.eventTarget.removeEventListener(
      "pointerdown",
      this.handlePointerDown,
      this.useCapture,
    ),
      this.eventTarget.removeEventListener(
        "pointermove",
        this.handlePointerMove,
        this.useCapture,
      ),
      this.eventTarget.removeEventListener(
        "pointerup",
        this.handlePointerUp,
        this.useCapture,
      ),
      this.eventTarget.removeEventListener(
        "pointercancel",
        this.handlePointerUp,
        this.useCapture,
      ));
  }
  setCurrentModel(e) {
    this.currentModel = e;
  }
  toModelCoords(e) {
    const n = this.canvas.getBoundingClientRect();
    return this.camera.screenToModel(
      e.clientX,
      e.clientY,
      n,
      this.currentModel ?? void 0,
    );
  }
}
const zl = new Map();
function Iae(t, e) {
  const n = zl.get(t);
  if (n) return n;
  const r = e();
  return (
    zl.set(t, r),
    r.catch(() => {
      zl.get(t) === r && zl.delete(t);
    }),
    r
  );
}
function VD(t) {
  const e = zl.get(t);
  return (e && zl.delete(t), e);
}
function kae() {
  for (const t of zl.values()) t.then((e) => e.close()).catch(() => {});
  zl.clear();
}
const GD = "http://localhost/";
function jD(t) {
  return t.endsWith("/") ? t : `${t}/`;
}
class ResourceResolver {
  baseHref;
  constructor(e) {
    const n =
        typeof window < "u" && window.location ? window.location.href : GD,
      r = jD(e);
    this.baseHref = new URL(r, n).toString();
  }
  resolve(e) {
    if (/^https?:\/\//i.test(e)) return e;
    if (e.startsWith("/")) {
      const n =
        typeof window < "u" && window.location ? window.location.origin : GD;
      return new URL(e, n).toString();
    }
    return new URL(e, this.baseHref).toString();
  }
  join(e, n) {
    const r = jD(e);
    return this.resolve(`${r}${n}`);
  }
}
class ResourceLoader {
  resolver;
  logger;
  arrayBufferCache = new Map();
  jsonCache = new Map();
  constructor(e, n) {
    ((this.resolver = new ResourceResolver(e)), (this.logger = n));
  }
  resolveModelPath(e, n) {
    return this.resolver.join(e, n);
  }
  async loadJson(e, n) {
    const r = this.resolver.resolve(e),
      i = this.jsonCache.get(r);
    if (i) return i.promise;
    const s = this.fetch(r, n).then((o) => {
      if (!o.ok) throw new Error(`Failed to fetch ${r}: ${o.status}`);
      return o.json();
    });
    this.jsonCache.set(r, { promise: s });
    try {
      return await s;
    } catch (o) {
      throw (this.jsonCache.delete(r), o);
    }
  }
  async loadArrayBuffer(e, n) {
    const r = this.resolver.resolve(e),
      i = this.arrayBufferCache.get(r);
    if (i) return i.promise;
    const s = this.fetch(r, n).then((o) => {
      if (!o.ok) throw new Error(`Failed to fetch ${r}: ${o.status}`);
      return o.arrayBuffer();
    });
    this.arrayBufferCache.set(r, { promise: s });
    try {
      return await s;
    } catch (o) {
      throw (this.arrayBufferCache.delete(r), o);
    }
  }
  async loadImageBitmap(e, n) {
    const r = this.resolver.resolve(e);
    if (n?.aborted) throw new DOMException("Live2D load aborted", "AbortError");
    const i = VD(r);
    if (i)
      try {
        return await i;
      } catch {}
    return this.fetchImageBitmap(r, n);
  }
  async fetchImageBitmap(e, n) {
    const r = await this.fetch(e, n);
    if (!r.ok) throw new Error(`Failed to fetch ${e}: ${r.status}`);
    const i = await r.blob();
    return createImageBitmap(i);
  }
  stageImageBitmap(e) {
    const n = this.resolver.resolve(e);
    return Iae(n, () => this.fetchImageBitmap(n));
  }
  evictStagedBitmap(e) {
    const n = VD(this.resolver.resolve(e));
    n && n.then((r) => r.close()).catch(() => {});
  }
  fetch(e, n) {
    return (this.logger.debug("Fetching resource", e), fetch(e, { signal: n }));
  }
}
let FrameClock = class {
  lastTimestamp = null;
  _deltaTimeSeconds = 0;
  _paused = !1;
  get deltaTimeSeconds() {
    return this._deltaTimeSeconds;
  }
  set paused(e) {
    ((this._paused = e), e && (this.lastTimestamp = null));
  }
  get paused() {
    return this._paused;
  }
  tick(e = performance.now()) {
    if (this._paused) {
      this._deltaTimeSeconds = 0;
      return;
    }
    if (this.lastTimestamp == null) {
      ((this._deltaTimeSeconds = 0), (this.lastTimestamp = e));
      return;
    }
    const n = Math.max(0, e - this.lastTimestamp);
    ((this._deltaTimeSeconds = n / 1e3), (this.lastTimestamp = e));
  }
};
class CanvasSession {
  gl;
  time = new FrameClock();
  canvas;
  renderConfig;
  logger;
  rafId = null;
  destroyed = !1;
  width = 0;
  height = 0;
  resolutionInitialized = !1;
  targetLongestEdge;
  minFrameIntervalMs = null;
  lastFrameTimestamp = 0;
  framesRendered = 0;
  loggedWaitingForCssSize = !1;
  contextLost = !1;
  onRestored = null;
  handleContextLost;
  handleContextRestored;
  constructor(e, n, r) {
    ((this.canvas = e),
      (this.renderConfig = { ...RENDER_DEFAULTS, ...n }),
      (this.targetLongestEdge = this.renderConfig.maxResolution ?? 4096),
      (this.logger = r));
    const i = e.getContext("webgl", {
      alpha: !0,
      premultipliedAlpha: this.renderConfig.premultipliedAlpha !== !1,
      preserveDrawingBuffer: !0,
    });
    if (!i)
      throw new Error("Failed to acquire WebGL context for Live2D canvas");
    ((this.gl = i),
      (this.handleContextLost = (s) => {
        (s.preventDefault(),
          (this.contextLost = !0),
          this.logger.info("Live2D WebGL context lost"));
      }),
      (this.handleContextRestored = () => {
        ((this.contextLost = !1),
          this.resolutionInitialized &&
            this.gl.viewport(0, 0, this.width, this.height),
          this.logger.info("Live2D WebGL context restored"),
          this.onRestored?.());
      }),
      e.addEventListener("webglcontextlost", this.handleContextLost, !1),
      e.addEventListener(
        "webglcontextrestored",
        this.handleContextRestored,
        !1,
      ));
  }
  setOnContextRestored(e) {
    this.onRestored = e;
  }
  isContextLost() {
    return this.contextLost || this.gl.isContextLost();
  }
  getCssSize() {
    const e = this.canvas.getBoundingClientRect(),
      n = e.width > 0 ? e.width : this.canvas.clientWidth,
      r = e.height > 0 ? e.height : this.canvas.clientHeight;
    return { width: n, height: r };
  }
  tryInitResolution() {
    if (this.resolutionInitialized) return !0;
    const { width: e, height: n } = this.getCssSize();
    if (!Number.isFinite(e) || !Number.isFinite(n) || e <= 0 || n <= 0)
      return (
        this.loggedWaitingForCssSize ||
          ((this.loggedWaitingForCssSize = !0),
          this.logger.debug(
            `Canvas CSS size not ready yet (css=${e}x${n}); deferring resolution init to avoid bad aspect ratio`,
          )),
        !1
      );
    const r = this.targetLongestEdge,
      i = e / n;
    return (
      i >= 1
        ? ((this.width = r), (this.height = Math.max(1, Math.round(r / i))))
        : ((this.height = r), (this.width = Math.max(1, Math.round(r * i)))),
      (this.canvas.width = this.width),
      (this.canvas.height = this.height),
      this.gl.viewport(0, 0, this.width, this.height),
      (this.resolutionInitialized = !0),
      this.logger.debug(
        `Canvas resolution fixed at ${this.width}x${this.height}`,
      ),
      !0
    );
  }
  setResolution(e) {
    const n = Math.round(e);
    !Number.isFinite(n) ||
      n <= 0 ||
      n === this.targetLongestEdge ||
      ((this.targetLongestEdge = n), (this.resolutionInitialized = !1));
  }
  setMaxFps(e) {
    this.minFrameIntervalMs = e != null && e > 0 ? 1e3 / e : null;
  }
  getContext() {
    return this.gl;
  }
  getCanvasElement() {
    return this.canvas;
  }
  start(e) {
    if (this.destroyed || this.rafId != null) return;
    this.time.paused = !0;
    const n = (r) => {
      if (this.destroyed) return;
      if (((this.rafId = requestAnimationFrame(n)), this.contextLost)) {
        this.time.paused = !0;
        return;
      }
      if (document.hidden) {
        this.time.paused = !0;
        return;
      }
      if (!this.tryInitResolution()) return;
      const i = this.minFrameIntervalMs;
      if (i != null) {
        if (r - this.lastFrameTimestamp < i - 0.5) return;
        this.lastFrameTimestamp = r - ((r - this.lastFrameTimestamp) % i);
      }
      (this.time.paused && (this.time.paused = !1), this.time.tick(r));
      const s = this.time.deltaTimeSeconds;
      if (s === 0) return;
      const o = this.renderConfig.clearColor ?? [0, 0, 0, 0];
      (this.gl.clearColor(o[0], o[1], o[2], o[3]),
        this.gl.clear(this.gl.COLOR_BUFFER_BIT),
        this.framesRendered++,
        e({
          gl: this.gl,
          deltaTimeSeconds: s,
          width: this.width,
          height: this.height,
        }));
    };
    (this.logger.debug("Starting canvas session RAF loop"),
      (this.rafId = requestAnimationFrame(n)));
  }
  stop() {
    (this.rafId != null &&
      (cancelAnimationFrame(this.rafId), (this.rafId = null)),
      (this.time.paused = !0),
      this.logger.debug("Stopped canvas session RAF loop"));
  }
  destroy() {
    if ((this.stop(), this.destroyed)) return;
    ((this.destroyed = !0),
      (this.onRestored = null),
      this.canvas.removeEventListener(
        "webglcontextlost",
        this.handleContextLost,
        !1,
      ),
      this.canvas.removeEventListener(
        "webglcontextrestored",
        this.handleContextRestored,
        !1,
      ),
      this.gl.getExtension("WEBGL_lose_context")?.loseContext(),
      this.logger.debug("Destroyed canvas session WebGL context"));
  }
}
class Live2DLogger {
  level;
  constructor(e) {
    this.level = e;
  }
  debug(e, ...n) {
    this.level === "debug" && console.debug(`[Live2D] ${e}`, ...n);
  }
  info(e, ...n) {
    (this.level === "debug" || this.level === "info") &&
      console.info(`[Live2D] ${e}`, ...n);
  }
  error(e, ...n) {
    this.level !== "none" && console.error(`[Live2D] ${e}`, ...n);
  }
}
function createLogger(t) {
  return t ? new Live2DLogger(t) : new Live2DLogger("error");
}
class M8 {}
var zD;
((t) => {
  t.ICubismModelSetting = M8;
})(zD || (zD = {}));
var T8 = ((t) => (
  (t[(t.FrequestNode_Groups = 0)] = "FrequestNode_Groups"),
  (t[(t.FrequestNode_Moc = 1)] = "FrequestNode_Moc"),
  (t[(t.FrequestNode_Motions = 2)] = "FrequestNode_Motions"),
  (t[(t.FrequestNode_Expressions = 3)] = "FrequestNode_Expressions"),
  (t[(t.FrequestNode_Textures = 4)] = "FrequestNode_Textures"),
  (t[(t.FrequestNode_Physics = 5)] = "FrequestNode_Physics"),
  (t[(t.FrequestNode_Pose = 6)] = "FrequestNode_Pose"),
  (t[(t.FrequestNode_HitAreas = 7)] = "FrequestNode_HitAreas"),
  t
))(T8 || {});
class CubismModelSettingJson extends M8 {
  constructor(e, n) {
    (super(),
      (this._json = CubismJson.create(e, n)),
      this.getJson() &&
        ((this._jsonValue = new csmVector()),
        this._jsonValue.pushBack(
          this.getJson().getRoot().getValueByString(this.groups),
        ),
        this._jsonValue.pushBack(
          this.getJson()
            .getRoot()
            .getValueByString(this.fileReferences)
            .getValueByString(this.moc),
        ),
        this._jsonValue.pushBack(
          this.getJson()
            .getRoot()
            .getValueByString(this.fileReferences)
            .getValueByString(this.motions),
        ),
        this._jsonValue.pushBack(
          this.getJson()
            .getRoot()
            .getValueByString(this.fileReferences)
            .getValueByString(this.expressions),
        ),
        this._jsonValue.pushBack(
          this.getJson()
            .getRoot()
            .getValueByString(this.fileReferences)
            .getValueByString(this.textures),
        ),
        this._jsonValue.pushBack(
          this.getJson()
            .getRoot()
            .getValueByString(this.fileReferences)
            .getValueByString(this.physics),
        ),
        this._jsonValue.pushBack(
          this.getJson()
            .getRoot()
            .getValueByString(this.fileReferences)
            .getValueByString(this.pose),
        ),
        this._jsonValue.pushBack(
          this.getJson().getRoot().getValueByString(this.hitAreas),
        )));
  }
  release() {
    (CubismJson.delete(this._json), (this._jsonValue = null));
  }
  getJson() {
    return this._json;
  }
  getModelFileName() {
    return this.isExistModelFile() ? this._jsonValue.at(1).getRawString() : "";
  }
  getTextureCount() {
    return this.isExistTextureFiles() ? this._jsonValue.at(4).getSize() : 0;
  }
  getTextureDirectory() {
    const n = this._jsonValue
        .at(4)
        .getValueByIndex(0)
        .getRawString()
        .split("/"),
      r = n.length - 1;
    let i = "";
    for (let s = 0; s < r; s++) ((i += n[s]), s < r - 1 && (i += "/"));
    return i;
  }
  getTextureFileName(e) {
    return this._jsonValue.at(4).getValueByIndex(e).getRawString();
  }
  getHitAreasCount() {
    return this.isExistHitAreas() ? this._jsonValue.at(7).getSize() : 0;
  }
  getHitAreaId(e) {
    return CubismFramework.getIdManager().getId(
      this._jsonValue
        .at(7)
        .getValueByIndex(e)
        .getValueByString(this.id)
        .getRawString(),
    );
  }
  getHitAreaName(e) {
    return this._jsonValue
      .at(7)
      .getValueByIndex(e)
      .getValueByString(this.name)
      .getRawString();
  }
  getPhysicsFileName() {
    return this.isExistPhysicsFile()
      ? this._jsonValue.at(5).getRawString()
      : "";
  }
  getPoseFileName() {
    return this.isExistPoseFile() ? this._jsonValue.at(6).getRawString() : "";
  }
  getExpressionCount() {
    return this.isExistExpressionFile() ? this._jsonValue.at(3).getSize() : 0;
  }
  getExpressionName(e) {
    return this._jsonValue
      .at(3)
      .getValueByIndex(e)
      .getValueByString(this.name)
      .getRawString();
  }
  getExpressionFileName(e) {
    return this._jsonValue
      .at(3)
      .getValueByIndex(e)
      .getValueByString(this.filePath)
      .getRawString();
  }
  getMotionGroupCount() {
    return this.isExistMotionGroups()
      ? this._jsonValue.at(2).getKeys().getSize()
      : 0;
  }
  getMotionGroupName(e) {
    return this.isExistMotionGroups()
      ? this._jsonValue.at(2).getKeys().at(e)
      : null;
  }
  getMotionCount(e) {
    return this.isExistMotionGroupName(e)
      ? this._jsonValue.at(2).getValueByString(e).getSize()
      : 0;
  }
  getMotionFileName(e, n) {
    return this.isExistMotionGroupName(e)
      ? this._jsonValue
          .at(2)
          .getValueByString(e)
          .getValueByIndex(n)
          .getValueByString(this.filePath)
          .getRawString()
      : "";
  }
  getMotionSoundFileName(e, n) {
    return this.isExistMotionSoundFile(e, n)
      ? this._jsonValue
          .at(2)
          .getValueByString(e)
          .getValueByIndex(n)
          .getValueByString(this.soundPath)
          .getRawString()
      : "";
  }
  getMotionFadeInTimeValue(e, n) {
    return this.isExistMotionFadeIn(e, n)
      ? this._jsonValue
          .at(2)
          .getValueByString(e)
          .getValueByIndex(n)
          .getValueByString(this.fadeInTime)
          .toFloat()
      : -1;
  }
  getMotionFadeOutTimeValue(e, n) {
    return this.isExistMotionFadeOut(e, n)
      ? this._jsonValue
          .at(2)
          .getValueByString(e)
          .getValueByIndex(n)
          .getValueByString(this.fadeOutTime)
          .toFloat()
      : -1;
  }
  getUserDataFile() {
    return this.isExistUserDataFile()
      ? this.getJson()
          .getRoot()
          .getValueByString(this.fileReferences)
          .getValueByString(this.userData)
          .getRawString()
      : "";
  }
  getLayoutMap(e) {
    const n = this.getJson().getRoot().getValueByString(this.layout).getMap();
    if (n == null) return !1;
    let r = !1;
    for (const i = n.begin(); i.notEqual(n.end()); i.preIncrement())
      (e.setValue(i.ptr().first, i.ptr().second.toFloat()), (r = !0));
    return r;
  }
  getEyeBlinkParameterCount() {
    if (!this.isExistEyeBlinkParameters()) return 0;
    let e = 0;
    for (let n = 0; n < this._jsonValue.at(0).getSize(); n++) {
      const r = this._jsonValue.at(0).getValueByIndex(n);
      if (
        !(r.isNull() || r.isError()) &&
        r.getValueByString(this.name).getRawString() == this.eyeBlink
      ) {
        e = r.getValueByString(this.ids).getVector().getSize();
        break;
      }
    }
    return e;
  }
  getEyeBlinkParameterId(e) {
    if (!this.isExistEyeBlinkParameters()) return null;
    for (let n = 0; n < this._jsonValue.at(0).getSize(); n++) {
      const r = this._jsonValue.at(0).getValueByIndex(n);
      if (
        !(r.isNull() || r.isError()) &&
        r.getValueByString(this.name).getRawString() == this.eyeBlink
      )
        return CubismFramework.getIdManager().getId(
          r.getValueByString(this.ids).getValueByIndex(e).getRawString(),
        );
    }
    return null;
  }
  getLipSyncParameterCount() {
    if (!this.isExistLipSyncParameters()) return 0;
    let e = 0;
    for (let n = 0; n < this._jsonValue.at(0).getSize(); n++) {
      const r = this._jsonValue.at(0).getValueByIndex(n);
      if (
        !(r.isNull() || r.isError()) &&
        r.getValueByString(this.name).getRawString() == this.lipSync
      ) {
        e = r.getValueByString(this.ids).getVector().getSize();
        break;
      }
    }
    return e;
  }
  getLipSyncParameterId(e) {
    if (!this.isExistLipSyncParameters()) return null;
    for (let n = 0; n < this._jsonValue.at(0).getSize(); n++) {
      const r = this._jsonValue.at(0).getValueByIndex(n);
      if (
        !(r.isNull() || r.isError()) &&
        r.getValueByString(this.name).getRawString() == this.lipSync
      )
        return CubismFramework.getIdManager().getId(
          r.getValueByString(this.ids).getValueByIndex(e).getRawString(),
        );
    }
    return null;
  }
  isExistModelFile() {
    const e = this._jsonValue.at(1);
    return !e.isNull() && !e.isError();
  }
  isExistTextureFiles() {
    const e = this._jsonValue.at(4);
    return !e.isNull() && !e.isError();
  }
  isExistHitAreas() {
    const e = this._jsonValue.at(7);
    return !e.isNull() && !e.isError();
  }
  isExistPhysicsFile() {
    const e = this._jsonValue.at(5);
    return !e.isNull() && !e.isError();
  }
  isExistPoseFile() {
    const e = this._jsonValue.at(6);
    return !e.isNull() && !e.isError();
  }
  isExistExpressionFile() {
    const e = this._jsonValue.at(3);
    return !e.isNull() && !e.isError();
  }
  isExistMotionGroups() {
    const e = this._jsonValue.at(2);
    return !e.isNull() && !e.isError();
  }
  isExistMotionGroupName(e) {
    const n = this._jsonValue.at(2).getValueByString(e);
    return !n.isNull() && !n.isError();
  }
  isExistMotionSoundFile(e, n) {
    const r = this._jsonValue
      .at(2)
      .getValueByString(e)
      .getValueByIndex(n)
      .getValueByString(this.soundPath);
    return !r.isNull() && !r.isError();
  }
  isExistMotionFadeIn(e, n) {
    const r = this._jsonValue
      .at(2)
      .getValueByString(e)
      .getValueByIndex(n)
      .getValueByString(this.fadeInTime);
    return !r.isNull() && !r.isError();
  }
  isExistMotionFadeOut(e, n) {
    const r = this._jsonValue
      .at(2)
      .getValueByString(e)
      .getValueByIndex(n)
      .getValueByString(this.fadeOutTime);
    return !r.isNull() && !r.isError();
  }
  isExistUserDataFile() {
    const e = this.getJson()
      .getRoot()
      .getValueByString(this.fileReferences)
      .getValueByString(this.userData);
    return !e.isNull() && !e.isError();
  }
  isExistEyeBlinkParameters() {
    if (this._jsonValue.at(0).isNull() || this._jsonValue.at(0).isError())
      return !1;
    for (let e = 0; e < this._jsonValue.at(0).getSize(); ++e)
      if (
        this._jsonValue
          .at(0)
          .getValueByIndex(e)
          .getValueByString(this.name)
          .getRawString() == this.eyeBlink
      )
        return !0;
    return !1;
  }
  isExistLipSyncParameters() {
    if (this._jsonValue.at(0).isNull() || this._jsonValue.at(0).isError())
      return !1;
    for (let e = 0; e < this._jsonValue.at(0).getSize(); ++e)
      if (
        this._jsonValue
          .at(0)
          .getValueByIndex(e)
          .getValueByString(this.name)
          .getRawString() == this.lipSync
      )
        return !0;
    return !1;
  }
  _json;
  _jsonValue;
  version = "Version";
  fileReferences = "FileReferences";
  groups = "Groups";
  layout = "Layout";
  hitAreas = "HitAreas";
  moc = "Moc";
  textures = "Textures";
  physics = "Physics";
  pose = "Pose";
  expressions = "Expressions";
  motions = "Motions";
  userData = "UserData";
  name = "Name";
  filePath = "File";
  id = "Id";
  ids = "Ids";
  target = "Target";
  idle = "Idle";
  tapBody = "TapBody";
  pinchIn = "PinchIn";
  pinchOut = "PinchOut";
  shake = "Shake";
  flickHead = "FlickHead";
  parameter = "Parameter";
  soundPath = "Sound";
  fadeInTime = "FadeInTime";
  fadeOutTime = "FadeOutTime";
  centerX = "CenterX";
  centerY = "CenterY";
  x = "X";
  y = "Y";
  width = "Width";
  height = "Height";
  lipSync = "LipSync";
  eyeBlink = "EyeBlink";
  initParameter = "init_param";
  initPartsVisible = "init_parts_visible";
  val = "val";
}
var WD;
((t) => {
  ((t.CubismModelSettingJson = CubismModelSettingJson), (t.FrequestNode = T8));
})(WD || (WD = {}));
function throwIfAborted(t) {
  if (t?.aborted)
    throw new DOMException("Live2D model load aborted", "AbortError");
}
class CubismVector2 {
  constructor(e, n) {
    ((this.x = e), (this.y = n), (this.x = e ?? 0), (this.y = n ?? 0));
  }
  add(e) {
    const n = new CubismVector2(0, 0);
    return ((n.x = this.x + e.x), (n.y = this.y + e.y), n);
  }
  substract(e) {
    const n = new CubismVector2(0, 0);
    return ((n.x = this.x - e.x), (n.y = this.y - e.y), n);
  }
  multiply(e) {
    const n = new CubismVector2(0, 0);
    return ((n.x = this.x * e.x), (n.y = this.y * e.y), n);
  }
  multiplyByScaler(e) {
    return this.multiply(new CubismVector2(e, e));
  }
  division(e) {
    const n = new CubismVector2(0, 0);
    return ((n.x = this.x / e.x), (n.y = this.y / e.y), n);
  }
  divisionByScalar(e) {
    return this.division(new CubismVector2(e, e));
  }
  getLength() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  getDistanceWith(e) {
    return Math.sqrt(
      (this.x - e.x) * (this.x - e.x) + (this.y - e.y) * (this.y - e.y),
    );
  }
  dot(e) {
    return this.x * e.x + this.y * e.y;
  }
  normalize() {
    const e = Math.pow(this.x * this.x + this.y * this.y, 0.5);
    ((this.x = this.x / e), (this.y = this.y / e));
  }
  isEqual(e) {
    return this.x == e.x && this.y == e.y;
  }
  isNotEqual(e) {
    return !this.isEqual(e);
  }
}
var $D;
((t) => {
  t.CubismVector2 = CubismVector2;
})($D || ($D = {}));
class CubismMath {
  static Epsilon = 1e-5;
  static range(e, n, r) {
    return (e < n ? (e = n) : e > r && (e = r), e);
  }
  static sin(e) {
    return Math.sin(e);
  }
  static cos(e) {
    return Math.cos(e);
  }
  static abs(e) {
    return Math.abs(e);
  }
  static sqrt(e) {
    return Math.sqrt(e);
  }
  static cbrt(e) {
    if (e === 0) return e;
    let n = e;
    const r = n < 0;
    r && (n = -n);
    let i;
    return (
      n === 1 / 0
        ? (i = 1 / 0)
        : ((i = Math.exp(Math.log(n) / 3)), (i = (n / (i * i) + 2 * i) / 3)),
      r ? -i : i
    );
  }
  static getEasingSine(e) {
    return e < 0 ? 0 : e > 1 ? 1 : 0.5 - 0.5 * this.cos(e * Math.PI);
  }
  static max(e, n) {
    return e > n ? e : n;
  }
  static min(e, n) {
    return e > n ? n : e;
  }
  static clamp(e, n, r) {
    return e < n ? n : r < e ? r : e;
  }
  static degreesToRadian(e) {
    return (e / 180) * Math.PI;
  }
  static radianToDegrees(e) {
    return (e * 180) / Math.PI;
  }
  static directionToRadian(e, n) {
    const r = Math.atan2(n.y, n.x),
      i = Math.atan2(e.y, e.x);
    let s = r - i;
    for (; s < -Math.PI;) s += Math.PI * 2;
    for (; s > Math.PI;) s -= Math.PI * 2;
    return s;
  }
  static directionToDegrees(e, n) {
    const r = this.directionToRadian(e, n);
    let i = this.radianToDegrees(r);
    return (n.x - e.x > 0 && (i = -i), i);
  }
  static radianToDirection(e) {
    const n = new CubismVector2();
    return ((n.x = this.sin(e)), (n.y = this.cos(e)), n);
  }
  static quadraticEquation(e, n, r) {
    if (this.abs(e) < CubismMath.Epsilon)
      return this.abs(n) < CubismMath.Epsilon ? -r : -r / n;
    const i = this.sqrt(Math.max(0, n * n - 4 * e * r)),
      s = (-n + i) / (2 * e),
      o = (-n - i) / (2 * e);
    return this.abs(s - 0.5) < this.abs(o - 0.5) ? s : o;
  }
  static cardanoAlgorithmForBezier(e, n, r, i) {
    if (this.abs(e) < CubismMath.Epsilon)
      return this.range(this.quadraticEquation(n, r, i), 0, 1);
    const s = n / e,
      o = r / e,
      a = i / e,
      l = (3 * o - s * s) / 3,
      c = l / 3,
      u = (2 * s * s * s - 9 * s * o + 27 * a) / 27,
      d = u / 2,
      f = d * d + c * c * c,
      h = 0.5,
      _ = h + 0.01;
    if (f < 0) {
      const x = -l / 3,
        w = x * x * x,
        S = this.sqrt(w),
        T = -u / (2 * S),
        R = this.range(T, -1, 1),
        E = Math.acos(R),
        C = 2 * this.cbrt(S),
        A = C * this.cos(E / 3) - s / 3;
      if (this.abs(A - h) < _) return this.range(A, 0, 1);
      const k = C * this.cos((E + 2 * Math.PI) / 3) - s / 3;
      if (this.abs(k - h) < _) return this.range(k, 0, 1);
      const N = C * this.cos((E + 4 * Math.PI) / 3) - s / 3;
      return this.range(N, 0, 1);
    }
    if (f == 0) {
      let x;
      d < 0 ? (x = this.cbrt(-d)) : (x = -this.cbrt(d));
      const w = 2 * x - s / 3;
      if (this.abs(w - h) < _) return this.range(w, 0, 1);
      const S = -x - s / 3;
      return this.range(S, 0, 1);
    }
    const m = this.sqrt(f),
      p = this.cbrt(m - d),
      v = this.cbrt(m + d),
      y = p - v - s / 3;
    return this.range(y, 0, 1);
  }
  static mod(e, n) {
    if (!isFinite(e) || n === 0 || isNaN(e) || isNaN(n))
      return (
        console.warn(`divided: ${e}, divisor: ${n} mod() returns 'NaN'.`),
        NaN
      );
    const r = Math.abs(e),
      i = Math.abs(n);
    let s = r - Math.floor(r / i) * i;
    return ((s *= Math.sign(e)), s);
  }
  constructor() {}
}
var qD;
((t) => {
  t.CubismMath = CubismMath;
})(qD || (qD = {}));
class CubismBreath {
  static create() {
    return new CubismBreath();
  }
  static delete(e) {}
  setParameters(e) {
    this._breathParameters = e;
  }
  getParameters() {
    return this._breathParameters;
  }
  updateParameters(e, n) {
    this._currentTime += n;
    const r = this._currentTime * 2 * Math.PI;
    for (let i = 0; i < this._breathParameters.getSize(); ++i) {
      const s = this._breathParameters.at(i);
      e.addParameterValueById(
        s.parameterId,
        s.offset + s.peak * Math.sin(r / s.cycle),
        s.weight,
      );
    }
  }
  constructor() {
    this._currentTime = 0;
  }
  _breathParameters;
  _currentTime;
}
class Wd {
  constructor(e, n, r, i, s) {
    ((this.parameterId = e ?? null),
      (this.offset = n ?? 0),
      (this.peak = r ?? 0),
      (this.cycle = i ?? 0),
      (this.weight = s ?? 0));
  }
  parameterId;
  offset;
  peak;
  cycle;
  weight;
}
var XD;
((t) => {
  ((t.BreathParameterData = Wd), (t.CubismBreath = CubismBreath));
})(XD || (XD = {}));
class CubismEyeBlink {
  static create(e = null) {
    return new CubismEyeBlink(e);
  }
  static delete(e) {}
  setBlinkingInterval(e) {
    this._blinkingIntervalSeconds = e;
  }
  setBlinkingSetting(e, n, r) {
    ((this._closingSeconds = e),
      (this._closedSeconds = n),
      (this._openingSeconds = r));
  }
  setParameterIds(e) {
    this._parameterIds = e;
  }
  getParameterIds() {
    return this._parameterIds;
  }
  updateParameters(e, n) {
    this._userTimeSeconds += n;
    let r,
      i = 0;
    switch (this._blinkingState) {
      case 2:
        ((i =
          (this._userTimeSeconds - this._stateStartTimeSeconds) /
          this._closingSeconds),
          i >= 1 &&
            ((i = 1),
            (this._blinkingState = 3),
            (this._stateStartTimeSeconds = this._userTimeSeconds)),
          (r = 1 - i));
        break;
      case 3:
        ((i =
          (this._userTimeSeconds - this._stateStartTimeSeconds) /
          this._closedSeconds),
          i >= 1 &&
            ((this._blinkingState = 4),
            (this._stateStartTimeSeconds = this._userTimeSeconds)),
          (r = 0));
        break;
      case 4:
        ((i =
          (this._userTimeSeconds - this._stateStartTimeSeconds) /
          this._openingSeconds),
          i >= 1 &&
            ((i = 1),
            (this._blinkingState = 1),
            (this._nextBlinkingTime = this.determinNextBlinkingTiming())),
          (r = i));
        break;
      case 1:
        (this._nextBlinkingTime < this._userTimeSeconds &&
          ((this._blinkingState = 2),
          (this._stateStartTimeSeconds = this._userTimeSeconds)),
          (r = 1));
        break;
      case 0:
      default:
        ((this._blinkingState = 1),
          (this._nextBlinkingTime = this.determinNextBlinkingTiming()),
          (r = 1));
        break;
    }
    CubismEyeBlink.CloseIfZero || (r = -r);
    for (let o = 0; o < this._parameterIds.getSize(); ++o)
      e.setParameterValueById(this._parameterIds.at(o), r);
  }
  constructor(e) {
    if (
      ((this._blinkingState = 0),
      (this._nextBlinkingTime = 0),
      (this._stateStartTimeSeconds = 0),
      (this._blinkingIntervalSeconds = 4),
      (this._closingSeconds = 0.1),
      (this._closedSeconds = 0.05),
      (this._openingSeconds = 0.15),
      (this._userTimeSeconds = 0),
      (this._parameterIds = new csmVector()),
      e != null)
    )
      for (let n = 0; n < e.getEyeBlinkParameterCount(); ++n)
        this._parameterIds.pushBack(e.getEyeBlinkParameterId(n));
  }
  determinNextBlinkingTiming() {
    const e = Math.random();
    return this._userTimeSeconds + e * (2 * this._blinkingIntervalSeconds - 1);
  }
  _blinkingState;
  _parameterIds;
  _nextBlinkingTime;
  _stateStartTimeSeconds;
  _blinkingIntervalSeconds;
  _closingSeconds;
  _closedSeconds;
  _openingSeconds;
  _userTimeSeconds;
  static CloseIfZero = !0;
}
var E8 = ((t) => (
    (t[(t.EyeState_First = 0)] = "EyeState_First"),
    (t[(t.EyeState_Interval = 1)] = "EyeState_Interval"),
    (t[(t.EyeState_Closing = 2)] = "EyeState_Closing"),
    (t[(t.EyeState_Closed = 3)] = "EyeState_Closed"),
    (t[(t.EyeState_Opening = 4)] = "EyeState_Opening"),
    t
  ))(E8 || {}),
  KD;
((t) => {
  ((t.CubismEyeBlink = CubismEyeBlink), (t.EyeState = E8));
})(KD || (KD = {}));
const Bae = 0.001,
  Q1 = 0.5,
  YD = "FadeInTime",
  ZD = "Link",
  Uae = "Groups",
  Vae = "Id";
class CubismPose {
  static create(e, n) {
    const r = CubismJson.create(e, n);
    if (!r) return null;
    const i = new CubismPose(),
      s = r.getRoot();
    s.getValueByString(YD).isNull() ||
      ((i._fadeTimeSeconds = s.getValueByString(YD).toFloat(Q1)),
      i._fadeTimeSeconds < 0 && (i._fadeTimeSeconds = Q1));
    const o = s.getValueByString(Uae),
      a = o.getSize();
    for (let l = 0; l < a; ++l) {
      const c = o.getValueByIndex(l),
        u = c.getSize();
      let d = 0;
      for (let f = 0; f < u; ++f) {
        const h = c.getValueByIndex(f),
          _ = new Qm(),
          m = CubismFramework.getIdManager().getId(
            h.getValueByString(Vae).getRawString(),
          );
        if (((_.partId = m), !h.getValueByString(ZD).isNull())) {
          const p = h.getValueByString(ZD),
            v = p.getSize();
          for (let y = 0; y < v; ++y) {
            const x = new Qm(),
              w = CubismFramework.getIdManager().getId(
                p.getValueByIndex(y).getString(),
              );
            ((x.partId = w), _.link.pushBack(x));
          }
        }
        (i._partGroups.pushBack(_.clone()), ++d);
      }
      i._partGroupCounts.pushBack(d);
    }
    return (CubismJson.delete(r), i);
  }
  static delete(e) {}
  updateParameters(e, n) {
    (e != this._lastModel && this.reset(e),
      (this._lastModel = e),
      n < 0 && (n = 0));
    let r = 0;
    for (let i = 0; i < this._partGroupCounts.getSize(); i++) {
      const s = this._partGroupCounts.at(i);
      (this.doFade(e, n, r, s), (r += s));
    }
    this.copyPartOpacities(e);
  }
  reset(e) {
    let n = 0;
    for (let r = 0; r < this._partGroupCounts.getSize(); ++r) {
      const i = this._partGroupCounts.at(r);
      for (let s = n; s < n + i; ++s) {
        this._partGroups.at(s).initialize(e);
        const o = this._partGroups.at(s).partIndex,
          a = this._partGroups.at(s).parameterIndex;
        if (!(o < 0)) {
          (e.setPartOpacityByIndex(o, s == n ? 1 : 0),
            e.setParameterValueByIndex(a, s == n ? 1 : 0));
          for (let l = 0; l < this._partGroups.at(s).link.getSize(); ++l)
            this._partGroups.at(s).link.at(l).initialize(e);
        }
      }
      n += i;
    }
  }
  copyPartOpacities(e) {
    for (let n = 0; n < this._partGroups.getSize(); ++n) {
      const r = this._partGroups.at(n);
      if (r.link.getSize() == 0) continue;
      const i = this._partGroups.at(n).partIndex,
        s = e.getPartOpacityByIndex(i);
      for (let o = 0; o < r.link.getSize(); ++o) {
        const l = r.link.at(o).partIndex;
        l < 0 || e.setPartOpacityByIndex(l, s);
      }
    }
  }
  doFade(e, n, r, i) {
    let s = -1,
      o = 1;
    const a = 0.5,
      l = 0.15;
    for (let c = r; c < r + i; ++c) {
      const u = this._partGroups.at(c).partIndex,
        d = this._partGroups.at(c).parameterIndex;
      if (e.getParameterValueByIndex(d) > Bae) {
        if (s >= 0) break;
        if (((s = c), this._fadeTimeSeconds == 0)) {
          o = 1;
          continue;
        }
        ((o = e.getPartOpacityByIndex(u)),
          (o += n / this._fadeTimeSeconds),
          o > 1 && (o = 1));
      }
    }
    s < 0 && ((s = 0), (o = 1));
    for (let c = r; c < r + i; ++c) {
      const u = this._partGroups.at(c).partIndex;
      if (s == c) e.setPartOpacityByIndex(u, o);
      else {
        let d = e.getPartOpacityByIndex(u),
          f;
        (o < a ? (f = (o * (a - 1)) / a + 1) : (f = ((1 - o) * a) / (1 - a)),
          (1 - f) * (1 - o) > l && (f = 1 - l / (1 - o)),
          d > f && (d = f),
          e.setPartOpacityByIndex(u, d));
      }
    }
  }
  constructor() {
    ((this._fadeTimeSeconds = Q1),
      (this._lastModel = null),
      (this._partGroups = new csmVector()),
      (this._partGroupCounts = new csmVector()));
  }
  _partGroups;
  _partGroupCounts;
  _fadeTimeSeconds;
  _lastModel;
}
class Qm {
  constructor(e) {
    if (
      ((this.parameterIndex = 0),
      (this.partIndex = 0),
      (this.link = new csmVector()),
      e != null)
    ) {
      this.partId = e.partId;
      for (const n = e.link.begin(); n.notEqual(e.link.end()); n.preIncrement())
        this.link.pushBack(n.ptr().clone());
    }
  }
  assignment(e) {
    this.partId = e.partId;
    for (const n = e.link.begin(); n.notEqual(e.link.end()); n.preIncrement())
      this.link.pushBack(n.ptr().clone());
    return this;
  }
  initialize(e) {
    ((this.parameterIndex = e.getParameterIndex(this.partId)),
      (this.partIndex = e.getPartIndex(this.partId)),
      e.setParameterValueByIndex(this.parameterIndex, 1));
  }
  clone() {
    const e = new Qm();
    ((e.partId = this.partId),
      (e.parameterIndex = this.parameterIndex),
      (e.partIndex = this.partIndex),
      (e.link = new csmVector()));
    for (let n = this.link.begin(); n.notEqual(this.link.end()); n.increment())
      e.link.pushBack(n.ptr().clone());
    return e;
  }
  partId;
  parameterIndex;
  partIndex;
  link;
}
var JD;
((t) => {
  ((t.CubismPose = CubismPose), (t.PartData = Qm));
})(JD || (JD = {}));
class CubismModelMatrix extends CubismMatrix44 {
  constructor(e, n) {
    (super(),
      (this._width = e !== void 0 ? e : 0),
      (this._height = n !== void 0 ? n : 0),
      this.setHeight(2));
  }
  setWidth(e) {
    const n = e / this._width,
      r = n;
    this.scale(n, r);
  }
  setHeight(e) {
    const n = e / this._height,
      r = n;
    this.scale(n, r);
  }
  setPosition(e, n) {
    this.translate(e, n);
  }
  setCenterPosition(e, n) {
    (this.centerX(e), this.centerY(n));
  }
  top(e) {
    this.setY(e);
  }
  bottom(e) {
    const n = this._height * this.getScaleY();
    this.translateY(e - n);
  }
  left(e) {
    this.setX(e);
  }
  right(e) {
    const n = this._width * this.getScaleX();
    this.translateX(e - n);
  }
  centerX(e) {
    const n = this._width * this.getScaleX();
    this.translateX(e - n / 2);
  }
  setX(e) {
    this.translateX(e);
  }
  centerY(e) {
    const n = this._height * this.getScaleY();
    this.translateY(e - n / 2);
  }
  setY(e) {
    this.translateY(e);
  }
  setupFromLayout(e) {
    const n = "width",
      r = "height",
      o = "center_x",
      a = "center_y",
      c = "bottom",
      u = "left",
      d = "right";
    for (const f = e.begin(); f.notEqual(e.end()); f.preIncrement()) {
      const h = f.ptr().first,
        _ = f.ptr().second;
      h == n ? this.setWidth(_) : h == r && this.setHeight(_);
    }
    for (const f = e.begin(); f.notEqual(e.end()); f.preIncrement()) {
      const h = f.ptr().first,
        _ = f.ptr().second;
      h == "x"
        ? this.setX(_)
        : h == "y"
          ? this.setY(_)
          : h == o
            ? this.centerX(_)
            : h == a
              ? this.centerY(_)
              : h == "top"
                ? this.top(_)
                : h == c
                  ? this.bottom(_)
                  : h == u
                    ? this.left(_)
                    : h == d && this.right(_);
    }
  }
  _width;
  _height;
}
var QD;
((t) => {
  t.CubismModelMatrix = CubismModelMatrix;
})(QD || (QD = {}));
const ew = 30,
  e5 = 0.01;
class CubismTargetPoint {
  constructor() {
    ((this._faceTargetX = 0),
      (this._faceTargetY = 0),
      (this._faceX = 0),
      (this._faceY = 0),
      (this._faceVX = 0),
      (this._faceVY = 0),
      (this._lastTimeSeconds = 0),
      (this._userTimeSeconds = 0));
  }
  update(e) {
    this._userTimeSeconds += e;
    const r = ((40 / 10) * 1) / ew;
    if (this._lastTimeSeconds == 0) {
      this._lastTimeSeconds = this._userTimeSeconds;
      return;
    }
    const i = (this._userTimeSeconds - this._lastTimeSeconds) * ew;
    this._lastTimeSeconds = this._userTimeSeconds;
    const o = 0.15 * ew,
      a = (i * r) / o,
      l = this._faceTargetX - this._faceX,
      c = this._faceTargetY - this._faceY;
    if (CubismMath.abs(l) <= e5 && CubismMath.abs(c) <= e5) return;
    const u = CubismMath.sqrt(l * l + c * c),
      d = (r * l) / u,
      f = (r * c) / u;
    let h = d - this._faceVX,
      _ = f - this._faceVY;
    const m = CubismMath.sqrt(h * h + _ * _);
    ((m < -a || m > a) && ((h *= a / m), (_ *= a / m)),
      (this._faceVX += h),
      (this._faceVY += _));
    {
      const p = 0.5 * (CubismMath.sqrt(a * a + 16 * a * u - 8 * a * u) - a),
        v = CubismMath.sqrt(
          this._faceVX * this._faceVX + this._faceVY * this._faceVY,
        );
      v > p && ((this._faceVX *= p / v), (this._faceVY *= p / v));
    }
    ((this._faceX += this._faceVX), (this._faceY += this._faceVY));
  }
  getX() {
    return this._faceX;
  }
  getY() {
    return this._faceY;
  }
  set(e, n) {
    ((this._faceTargetX = e), (this._faceTargetY = n));
  }
  _faceTargetX;
  _faceTargetY;
  _faceX;
  _faceY;
  _faceVX;
  _faceVY;
  _lastTimeSeconds;
  _userTimeSeconds;
}
var t5;
((t) => {
  t.CubismTargetPoint = CubismTargetPoint;
})(t5 || (t5 = {}));
class ACubismMotion {
  static delete(e) {
    (e.release(), (e = null));
  }
  constructor() {
    ((this._fadeInSeconds = -1),
      (this._fadeOutSeconds = -1),
      (this._weight = 1),
      (this._offsetSeconds = 0),
      (this._isLoop = !1),
      (this._isLoopFadeIn = !0),
      (this._previousLoopState = this._isLoop),
      (this._firedEventValues = new csmVector()));
  }
  release() {
    this._weight = 0;
  }
  updateParameters(e, n, r) {
    if (!n.isAvailable() || n.isFinished()) return;
    this.setupMotionQueueEntry(n, r);
    const i = this.updateFadeWeight(n, r);
    (this.doUpdateParameters(e, r, i, n),
      n.getEndTime() > 0 && n.getEndTime() < r && n.setIsFinished(!0));
  }
  setupMotionQueueEntry(e, n) {
    e == null ||
      e.isStarted() ||
      (e.isAvailable() &&
        (e.setIsStarted(!0),
        e.setStartTime(n - this._offsetSeconds),
        e.setFadeInStartTime(n),
        e.getEndTime() < 0 && this.adjustEndTime(e),
        e._motion._onBeganMotion && e._motion._onBeganMotion(e._motion)));
  }
  updateFadeWeight(e, n) {
    e == null &&
      CubismDebug.print(Zo.LogLevel_Error, "motionQueueEntry is null.");
    let r = this._weight;
    const i =
        this._fadeInSeconds == 0
          ? 1
          : CubismMath.getEasingSine(
              (n - e.getFadeInStartTime()) / this._fadeInSeconds,
            ),
      s =
        this._fadeOutSeconds == 0 || e.getEndTime() < 0
          ? 1
          : CubismMath.getEasingSine(
              (e.getEndTime() - n) / this._fadeOutSeconds,
            );
    return ((r = r * i * s), e.setState(n, r), Si(0 <= r && r <= 1), r);
  }
  setFadeInTime(e) {
    this._fadeInSeconds = e;
  }
  setFadeOutTime(e) {
    this._fadeOutSeconds = e;
  }
  getFadeOutTime() {
    return this._fadeOutSeconds;
  }
  getFadeInTime() {
    return this._fadeInSeconds;
  }
  setWeight(e) {
    this._weight = e;
  }
  getWeight() {
    return this._weight;
  }
  getDuration() {
    return -1;
  }
  getLoopDuration() {
    return -1;
  }
  setOffsetTime(e) {
    this._offsetSeconds = e;
  }
  setLoop(e) {
    this._isLoop = e;
  }
  getLoop() {
    return this._isLoop;
  }
  setLoopFadeIn(e) {
    this._isLoopFadeIn = e;
  }
  getLoopFadeIn() {
    return this._isLoopFadeIn;
  }
  getFiredEvent(e, n) {
    return this._firedEventValues;
  }
  setBeganMotionHandler = (e) => (this._onBeganMotion = e);
  getBeganMotionHandler = () => this._onBeganMotion;
  setFinishedMotionHandler = (e) => (this._onFinishedMotion = e);
  getFinishedMotionHandler = () => this._onFinishedMotion;
  isExistModelOpacity() {
    return !1;
  }
  getModelOpacityIndex() {
    return -1;
  }
  getModelOpacityId(e) {
    return null;
  }
  getModelOpacityValue() {
    return 1;
  }
  adjustEndTime(e) {
    const n = this.getDuration(),
      r = n <= 0 ? -1 : e.getStartTime() + n;
    e.setEndTime(r);
  }
  _fadeInSeconds;
  _fadeOutSeconds;
  _weight;
  _offsetSeconds;
  _isLoop;
  _isLoopFadeIn;
  _previousLoopState;
  _firedEventValues;
  _onBeganMotion;
  _onFinishedMotion;
}
var n5;
((t) => {
  t.ACubismMotion = ACubismMotion;
})(n5 || (n5 = {}));
const Gae = "FadeInTime",
  jae = "FadeOutTime",
  r5 = "Parameters",
  Hae = "Id",
  zae = "Value",
  Dg = "Blend",
  Wae = "Add",
  $ae = "Multiply",
  qae = "Overwrite",
  i5 = 1;
class CubismExpressionMotion extends ACubismMotion {
  static DefaultAdditiveValue = 0;
  static DefaultMultiplyValue = 1;
  static create(e, n) {
    const r = new CubismExpressionMotion();
    return (r.parse(e, n), r);
  }
  doUpdateParameters(e, n, r, i) {
    for (let s = 0; s < this._parameters.getSize(); ++s) {
      const o = this._parameters.at(s);
      switch (o.blendType) {
        case 0: {
          e.addParameterValueById(o.parameterId, o.value, r);
          break;
        }
        case 1: {
          e.multiplyParameterValueById(o.parameterId, o.value, r);
          break;
        }
        case 2: {
          e.setParameterValueById(o.parameterId, o.value, r);
          break;
        }
      }
    }
  }
  calculateExpressionParameters(e, n, r, i, s, o) {
    if (!(r == null || i == null) && r.isAvailable()) {
      this._fadeWeight = this.updateFadeWeight(r, n);
      for (let a = 0; a < i.getSize(); ++a) {
        const l = i.at(a);
        if (l.parameterId == null) continue;
        const c = (l.overwriteValue = e.getParameterValueById(l.parameterId)),
          u = this.getExpressionParameters();
        let d = -1;
        for (let p = 0; p < u.getSize(); ++p)
          if (l.parameterId == u.at(p).parameterId) {
            d = p;
            break;
          }
        if (d < 0) {
          s == 0
            ? ((l.additiveValue = CubismExpressionMotion.DefaultAdditiveValue),
              (l.multiplyValue = CubismExpressionMotion.DefaultMultiplyValue),
              (l.overwriteValue = c))
            : ((l.additiveValue = this.calculateValue(
                l.additiveValue,
                CubismExpressionMotion.DefaultAdditiveValue,
                o,
              )),
              (l.multiplyValue = this.calculateValue(
                l.multiplyValue,
                CubismExpressionMotion.DefaultMultiplyValue,
                o,
              )),
              (l.overwriteValue = this.calculateValue(l.overwriteValue, c, o)));
          continue;
        }
        const f = u.at(d).value;
        let h, _, m;
        switch (u.at(d).blendType) {
          case 0:
            ((h = f),
              (_ = CubismExpressionMotion.DefaultMultiplyValue),
              (m = c));
            break;
          case 1:
            ((h = CubismExpressionMotion.DefaultAdditiveValue),
              (_ = f),
              (m = c));
            break;
          case 2:
            ((h = CubismExpressionMotion.DefaultAdditiveValue),
              (_ = CubismExpressionMotion.DefaultMultiplyValue),
              (m = f));
            break;
          default:
            return;
        }
        s == 0
          ? ((l.additiveValue = h),
            (l.multiplyValue = _),
            (l.overwriteValue = m))
          : ((l.additiveValue = l.additiveValue * (1 - o) + h * o),
            (l.multiplyValue = l.multiplyValue * (1 - o) + _ * o),
            (l.overwriteValue = l.overwriteValue * (1 - o) + m * o));
      }
    }
  }
  getExpressionParameters() {
    return this._parameters;
  }
  getFadeWeight() {
    return this._fadeWeight;
  }
  parse(e, n) {
    const r = CubismJson.create(e, n);
    if (!r) return;
    const i = r.getRoot();
    (this.setFadeInTime(i.getValueByString(Gae).toFloat(i5)),
      this.setFadeOutTime(i.getValueByString(jae).toFloat(i5)));
    const s = i.getValueByString(r5).getSize();
    this._parameters.prepareCapacity(s);
    for (let o = 0; o < s; ++o) {
      const a = i.getValueByString(r5).getValueByIndex(o),
        l = CubismFramework.getIdManager().getId(
          a.getValueByString(Hae).getRawString(),
        ),
        c = a.getValueByString(zae).toFloat();
      let u;
      a.getValueByString(Dg).isNull() ||
      a.getValueByString(Dg).getString() == Wae
        ? (u = 0)
        : a.getValueByString(Dg).getString() == $ae
          ? (u = 1)
          : a.getValueByString(Dg).getString() == qae
            ? (u = 2)
            : (u = 0);
      const d = new A8();
      ((d.parameterId = l),
        (d.blendType = u),
        (d.value = c),
        this._parameters.pushBack(d));
    }
    CubismJson.delete(r);
  }
  calculateValue(e, n, r) {
    return e * (1 - r) + n * r;
  }
  constructor() {
    (super(), (this._parameters = new csmVector()), (this._fadeWeight = 0));
  }
  _parameters;
  _fadeWeight;
}
var R8 = ((t) => (
  (t[(t.Additive = 0)] = "Additive"),
  (t[(t.Multiply = 1)] = "Multiply"),
  (t[(t.Overwrite = 2)] = "Overwrite"),
  t
))(R8 || {});
class A8 {
  parameterId;
  blendType;
  value;
}
var s5;
((t) => {
  ((t.CubismExpressionMotion = CubismExpressionMotion),
    (t.ExpressionBlendType = R8),
    (t.ExpressionParameter = A8));
})(s5 || (s5 = {}));
class CubismMotionQueueEntry {
  constructor() {
    ((this._autoDelete = !1),
      (this._motion = null),
      (this._available = !0),
      (this._finished = !1),
      (this._started = !1),
      (this._startTimeSeconds = -1),
      (this._fadeInStartTimeSeconds = 0),
      (this._endTimeSeconds = -1),
      (this._stateTimeSeconds = 0),
      (this._stateWeight = 0),
      (this._lastEventCheckSeconds = 0),
      (this._motionQueueEntryHandle = this),
      (this._fadeOutSeconds = 0),
      (this._isTriggeredFadeOut = !1));
  }
  release() {
    this._autoDelete && this._motion && ACubismMotion.delete(this._motion);
  }
  setFadeOut(e) {
    ((this._fadeOutSeconds = e), (this._isTriggeredFadeOut = !0));
  }
  startFadeOut(e, n) {
    const r = n + e;
    ((this._isTriggeredFadeOut = !0),
      (this._endTimeSeconds < 0 || r < this._endTimeSeconds) &&
        (this._endTimeSeconds = r));
  }
  isFinished() {
    return this._finished;
  }
  isStarted() {
    return this._started;
  }
  getStartTime() {
    return this._startTimeSeconds;
  }
  getFadeInStartTime() {
    return this._fadeInStartTimeSeconds;
  }
  getEndTime() {
    return this._endTimeSeconds;
  }
  setStartTime(e) {
    this._startTimeSeconds = e;
  }
  setFadeInStartTime(e) {
    this._fadeInStartTimeSeconds = e;
  }
  setEndTime(e) {
    this._endTimeSeconds = e;
  }
  setIsFinished(e) {
    this._finished = e;
  }
  setIsStarted(e) {
    this._started = e;
  }
  isAvailable() {
    return this._available;
  }
  setIsAvailable(e) {
    this._available = e;
  }
  setState(e, n) {
    ((this._stateTimeSeconds = e), (this._stateWeight = n));
  }
  getStateTime() {
    return this._stateTimeSeconds;
  }
  getStateWeight() {
    return this._stateWeight;
  }
  getLastCheckEventSeconds() {
    return this._lastEventCheckSeconds;
  }
  setLastCheckEventSeconds(e) {
    this._lastEventCheckSeconds = e;
  }
  isTriggeredFadeOut() {
    return this._isTriggeredFadeOut;
  }
  getFadeOutSeconds() {
    return this._fadeOutSeconds;
  }
  getCubismMotion() {
    return this._motion;
  }
  _autoDelete;
  _motion;
  _available;
  _finished;
  _started;
  _startTimeSeconds;
  _fadeInStartTimeSeconds;
  _endTimeSeconds;
  _stateTimeSeconds;
  _stateWeight;
  _lastEventCheckSeconds;
  _fadeOutSeconds;
  _isTriggeredFadeOut;
  _motionQueueEntryHandle;
}
var o5;
((t) => {
  t.CubismMotionQueueEntry = CubismMotionQueueEntry;
})(o5 || (o5 = {}));
class CubismMotionQueueManager {
  constructor() {
    ((this._userTimeSeconds = 0),
      (this._eventCallBack = null),
      (this._eventCustomData = null),
      (this._motions = new csmVector()));
  }
  release() {
    for (let e = 0; e < this._motions.getSize(); ++e)
      this._motions.at(e) &&
        (this._motions.at(e).release(), this._motions.set(e, null));
    this._motions = null;
  }
  startMotion(e, n, r) {
    if (e == null) return I8;
    let i = null;
    for (let s = 0; s < this._motions.getSize(); ++s)
      ((i = this._motions.at(s)), i?.setFadeOut(i._motion.getFadeOutTime()));
    return (
      (i = new CubismMotionQueueEntry()),
      (i._autoDelete = n),
      (i._motion = e),
      this._motions.pushBack(i),
      i._motionQueueEntryHandle
    );
  }
  isFinished() {
    for (let e = this._motions.begin(); e.notEqual(this._motions.end());) {
      let n = e.ptr();
      if (n == null) {
        e = this._motions.erase(e);
        continue;
      }
      if (n._motion == null) {
        (n.release(), (n = null), (e = this._motions.erase(e)));
        continue;
      }
      if (n.isFinished()) e.preIncrement();
      else return !1;
    }
    return !0;
  }
  isFinishedByHandle(e) {
    for (
      let n = this._motions.begin();
      n.notEqual(this._motions.end());
      n.increment()
    ) {
      const r = n.ptr();
      if (r != null && r._motionQueueEntryHandle == e && !r.isFinished())
        return !1;
    }
    return !0;
  }
  stopAllMotions() {
    for (let e = this._motions.begin(); e.notEqual(this._motions.end());) {
      let n = e.ptr();
      if (n == null) {
        e = this._motions.erase(e);
        continue;
      }
      (n.release(), (n = null), (e = this._motions.erase(e)));
    }
  }
  getCubismMotionQueueEntries() {
    return this._motions;
  }
  getCubismMotionQueueEntry(e) {
    for (
      let n = this._motions.begin();
      n.notEqual(this._motions.end());
      n.preIncrement()
    ) {
      const r = n.ptr();
      if (r != null && r._motionQueueEntryHandle == e) return r;
    }
    return null;
  }
  setEventCallback(e, n = null) {
    ((this._eventCallBack = e), (this._eventCustomData = n));
  }
  doUpdateMotion(e, n) {
    let r = !1;
    for (let i = this._motions.begin(); i.notEqual(this._motions.end());) {
      let s = i.ptr();
      if (s == null) {
        i = this._motions.erase(i);
        continue;
      }
      const o = s._motion;
      if (o == null) {
        (s.release(), (s = null), (i = this._motions.erase(i)));
        continue;
      }
      (o.updateParameters(e, s, n), (r = !0));
      const a = o.getFiredEvent(
        s.getLastCheckEventSeconds() - s.getStartTime(),
        n - s.getStartTime(),
      );
      for (let l = 0; l < a.getSize(); ++l)
        this._eventCallBack(this, a.at(l), this._eventCustomData);
      (s.setLastCheckEventSeconds(n),
        s.isFinished()
          ? (s.release(), (s = null), (i = this._motions.erase(i)))
          : (s.isTriggeredFadeOut() && s.startFadeOut(s.getFadeOutSeconds(), n),
            i.preIncrement()));
    }
    return r;
  }
  _userTimeSeconds;
  _motions;
  _eventCallBack;
  _eventCustomData;
}
const I8 = -1;
var a5;
((t) => {
  ((t.CubismMotionQueueManager = CubismMotionQueueManager),
    (t.InvalidMotionQueueEntryHandleValue = I8));
})(a5 || (a5 = {}));
class Xae {
  parameterId;
  additiveValue;
  multiplyValue;
  overwriteValue;
}
class CubismExpressionMotionManager extends CubismMotionQueueManager {
  constructor() {
    (super(),
      (this._currentPriority = 0),
      (this._reservePriority = 0),
      (this._expressionParameterValues = new csmVector()),
      (this._fadeWeights = new csmVector()));
  }
  release() {
    (this._expressionParameterValues &&
      (csmDelete(this._expressionParameterValues),
      (this._expressionParameterValues = null)),
      this._fadeWeights &&
        (csmDelete(this._fadeWeights), (this._fadeWeights = null)));
  }
  getCurrentPriority() {
    return (
      Cs(
        "CubismExpressionMotionManager.getCurrentPriority() is deprecated because a priority value is not actually used during expression motion playback.",
      ),
      this._currentPriority
    );
  }
  getReservePriority() {
    return (
      Cs(
        "CubismExpressionMotionManager.getReservePriority() is deprecated because a priority value is not actually used during expression motion playback.",
      ),
      this._reservePriority
    );
  }
  getFadeWeight(e) {
    return e < 0 ||
      this._fadeWeights.getSize() < 1 ||
      e >= this._fadeWeights.getSize()
      ? (console.warn(
          "Failed to get the fade weight value. The element at that index does not exist.",
        ),
        -1)
      : this._fadeWeights.at(e);
  }
  setFadeWeight(e, n) {
    if (
      e < 0 ||
      this._fadeWeights.getSize() < 1 ||
      this._fadeWeights.getSize() <= e
    ) {
      console.warn(
        "Failed to set the fade weight value. The element at that index does not exist.",
      );
      return;
    }
    this._fadeWeights.set(e, n);
  }
  setReservePriority(e) {
    (Cs(
      "CubismExpressionMotionManager.setReservePriority() is deprecated because a priority value is not actually used during expression motion playback.",
    ),
      (this._reservePriority = e));
  }
  startMotionPriority(e, n, r) {
    return (
      Cs(
        "CubismExpressionMotionManager.startMotionPriority() is deprecated because a priority value is not actually used during expression motion playback.",
      ),
      r == this.getReservePriority() && this.setReservePriority(0),
      (this._currentPriority = r),
      this.startMotion(e, n)
    );
  }
  updateMotion(e, n) {
    this._userTimeSeconds += n;
    let r = !1;
    const i = this.getCubismMotionQueueEntries();
    let s = 0,
      o = 0;
    if (this._fadeWeights.getSize() !== i.getSize()) {
      const a = i.getSize() - this._fadeWeights.getSize();
      for (let l = 0; l < a; l++) this._fadeWeights.pushBack(0);
    }
    for (let a = this._motions.begin(); a.notEqual(this._motions.end());) {
      const l = a.ptr();
      if (l == null) {
        a = i.erase(a);
        continue;
      }
      const c = l.getCubismMotion();
      if (c == null) {
        (csmDelete(l), (a = i.erase(a)));
        continue;
      }
      const u = c.getExpressionParameters();
      if (l.isAvailable())
        for (let d = 0; d < u.getSize(); ++d) {
          if (u.at(d).parameterId == null) continue;
          let f = -1;
          for (let _ = 0; _ < this._expressionParameterValues.getSize(); ++_)
            if (
              this._expressionParameterValues.at(_).parameterId ==
              u.at(d).parameterId
            ) {
              f = _;
              break;
            }
          if (f >= 0) continue;
          const h = new Xae();
          ((h.parameterId = u.at(d).parameterId),
            (h.additiveValue = CubismExpressionMotion.DefaultAdditiveValue),
            (h.multiplyValue = CubismExpressionMotion.DefaultMultiplyValue),
            (h.overwriteValue = e.getParameterValueById(h.parameterId)),
            this._expressionParameterValues.pushBack(h));
        }
      (c.setupMotionQueueEntry(l, this._userTimeSeconds),
        this.setFadeWeight(o, c.updateFadeWeight(l, this._userTimeSeconds)),
        c.calculateExpressionParameters(
          e,
          this._userTimeSeconds,
          l,
          this._expressionParameterValues,
          o,
          this.getFadeWeight(o),
        ),
        (s +=
          c.getFadeInTime() == 0
            ? 1
            : CubismMath.getEasingSine(
                (this._userTimeSeconds - l.getFadeInStartTime()) /
                  c.getFadeInTime(),
              )),
        (r = !0),
        l.isTriggeredFadeOut() &&
          l.startFadeOut(l.getFadeOutSeconds(), this._userTimeSeconds),
        a.preIncrement(),
        ++o);
    }
    if (
      i.getSize() > 1 &&
      this.getFadeWeight(this._fadeWeights.getSize() - 1) >= 1
    )
      for (let l = i.getSize() - 2; l >= 0; --l) {
        const c = i.at(l);
        (csmDelete(c), i.remove(l), this._fadeWeights.remove(l));
      }
    s > 1 && (s = 1);
    for (let a = 0; a < this._expressionParameterValues.getSize(); ++a) {
      const l = this._expressionParameterValues.at(a);
      (e.setParameterValueById(
        l.parameterId,
        (l.overwriteValue + l.additiveValue) * l.multiplyValue,
        s,
      ),
        (l.additiveValue = CubismExpressionMotion.DefaultAdditiveValue),
        (l.multiplyValue = CubismExpressionMotion.DefaultMultiplyValue));
    }
    return r;
  }
  _expressionParameterValues;
  _fadeWeights;
  _currentPriority;
  _reservePriority;
  _startExpressionTime;
}
var l5;
((t) => {
  t.CubismExpressionMotionManager = CubismExpressionMotionManager;
})(l5 || (l5 = {}));
var CubismMotionCurveTarget = ((t) => (
    (t[(t.CubismMotionCurveTarget_Model = 0)] =
      "CubismMotionCurveTarget_Model"),
    (t[(t.CubismMotionCurveTarget_Parameter = 1)] =
      "CubismMotionCurveTarget_Parameter"),
    (t[(t.CubismMotionCurveTarget_PartOpacity = 2)] =
      "CubismMotionCurveTarget_PartOpacity"),
    t
  ))(CubismMotionCurveTarget || {}),
  CubismMotionSegmentType = ((t) => (
    (t[(t.CubismMotionSegmentType_Linear = 0)] =
      "CubismMotionSegmentType_Linear"),
    (t[(t.CubismMotionSegmentType_Bezier = 1)] =
      "CubismMotionSegmentType_Bezier"),
    (t[(t.CubismMotionSegmentType_Stepped = 2)] =
      "CubismMotionSegmentType_Stepped"),
    (t[(t.CubismMotionSegmentType_InverseStepped = 3)] =
      "CubismMotionSegmentType_InverseStepped"),
    t
  ))(CubismMotionSegmentType || {});
class CubismMotionPoint {
  time = 0;
  value = 0;
}
class CubismMotionSegment {
  constructor() {
    ((this.evaluate = null), (this.basePointIndex = 0), (this.segmentType = 0));
  }
  evaluate;
  basePointIndex;
  segmentType;
}
class CubismMotionCurve {
  constructor() {
    ((this.type = 0),
      (this.segmentCount = 0),
      (this.baseSegmentIndex = 0),
      (this.fadeInTime = 0),
      (this.fadeOutTime = 0));
  }
  type;
  id;
  segmentCount;
  baseSegmentIndex;
  fadeInTime;
  fadeOutTime;
}
class CubismMotionEvent {
  fireTime = 0;
  value;
}
class CubismMotionData {
  constructor() {
    ((this.duration = 0),
      (this.loop = !1),
      (this.curveCount = 0),
      (this.eventCount = 0),
      (this.fps = 0),
      (this.curves = new csmVector()),
      (this.segments = new csmVector()),
      (this.points = new csmVector()),
      (this.events = new csmVector()));
  }
  duration;
  loop;
  curveCount;
  eventCount;
  fps;
  curves;
  segments;
  points;
  events;
}
var c5;
((t) => {
  ((t.CubismMotionCurve = CubismMotionCurve),
    (t.CubismMotionCurveTarget = CubismMotionCurveTarget),
    (t.CubismMotionData = CubismMotionData),
    (t.CubismMotionEvent = CubismMotionEvent),
    (t.CubismMotionPoint = CubismMotionPoint),
    (t.CubismMotionSegment = CubismMotionSegment),
    (t.CubismMotionSegmentType = CubismMotionSegmentType));
})(c5 || (c5 = {}));
const Bi = "Meta",
  Kae = "Duration",
  Yae = "Loop",
  Zae = "AreBeziersRestricted",
  Jae = "CurveCount",
  Qae = "Fps",
  ele = "TotalSegmentCount",
  tle = "TotalPointCount",
  ga = "Curves",
  nle = "Target",
  rle = "Id",
  Lg = "FadeInTime",
  Ng = "FadeOutTime",
  u5 = "Segments",
  d5 = "UserData",
  ile = "UserDataCount",
  sle = "TotalUserDataSize",
  ole = "Time",
  ale = "Value";
class CubismMotionJson {
  constructor(e, n) {
    this._json = CubismJson.create(e, n);
  }
  release() {
    CubismJson.delete(this._json);
  }
  getMotionDuration() {
    return this._json
      .getRoot()
      .getValueByString(Bi)
      .getValueByString(Kae)
      .toFloat();
  }
  isMotionLoop() {
    return this._json
      .getRoot()
      .getValueByString(Bi)
      .getValueByString(Yae)
      .toBoolean();
  }
  hasConsistency() {
    let e = !0;
    if (!this._json || !this._json.getRoot()) return !1;
    const n = this._json.getRoot().getValueByString(ga).getVector().getSize();
    let r = 0,
      i = 0;
    for (let s = 0; s < n; ++s)
      for (let o = 0; o < this.getMotionCurveSegmentCount(s);) {
        switch (
          (o == 0 && ((i += 1), (o += 2)), this.getMotionCurveSegment(s, o))
        ) {
          case CubismMotionSegmentType.CubismMotionSegmentType_Linear:
            ((i += 1), (o += 3));
            break;
          case CubismMotionSegmentType.CubismMotionSegmentType_Bezier:
            ((i += 3), (o += 7));
            break;
          case CubismMotionSegmentType.CubismMotionSegmentType_Stepped:
            ((i += 1), (o += 3));
            break;
          case CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped:
            ((i += 1), (o += 3));
            break;
          default:
            Si(0);
            break;
        }
        ++r;
      }
    return (
      n != this.getMotionCurveCount() &&
        (Yt("The number of curves does not match the metadata."), (e = !1)),
      r != this.getMotionTotalSegmentCount() &&
        (Yt("The number of segment does not match the metadata."), (e = !1)),
      i != this.getMotionTotalPointCount() &&
        (Yt("The number of point does not match the metadata."), (e = !1)),
      e
    );
  }
  getEvaluationOptionFlag(e) {
    return e == 0
      ? this._json
          .getRoot()
          .getValueByString(Bi)
          .getValueByString(Zae)
          .toBoolean()
      : !1;
  }
  getMotionCurveCount() {
    return this._json
      .getRoot()
      .getValueByString(Bi)
      .getValueByString(Jae)
      .toInt();
  }
  getMotionFps() {
    return this._json
      .getRoot()
      .getValueByString(Bi)
      .getValueByString(Qae)
      .toFloat();
  }
  getMotionTotalSegmentCount() {
    return this._json
      .getRoot()
      .getValueByString(Bi)
      .getValueByString(ele)
      .toInt();
  }
  getMotionTotalPointCount() {
    return this._json
      .getRoot()
      .getValueByString(Bi)
      .getValueByString(tle)
      .toInt();
  }
  isExistMotionFadeInTime() {
    return !this._json
      .getRoot()
      .getValueByString(Bi)
      .getValueByString(Lg)
      .isNull();
  }
  isExistMotionFadeOutTime() {
    return !this._json
      .getRoot()
      .getValueByString(Bi)
      .getValueByString(Ng)
      .isNull();
  }
  getMotionFadeInTime() {
    return this._json
      .getRoot()
      .getValueByString(Bi)
      .getValueByString(Lg)
      .toFloat();
  }
  getMotionFadeOutTime() {
    return this._json
      .getRoot()
      .getValueByString(Bi)
      .getValueByString(Ng)
      .toFloat();
  }
  getMotionCurveTarget(e) {
    return this._json
      .getRoot()
      .getValueByString(ga)
      .getValueByIndex(e)
      .getValueByString(nle)
      .getRawString();
  }
  getMotionCurveId(e) {
    return CubismFramework.getIdManager().getId(
      this._json
        .getRoot()
        .getValueByString(ga)
        .getValueByIndex(e)
        .getValueByString(rle)
        .getRawString(),
    );
  }
  isExistMotionCurveFadeInTime(e) {
    return !this._json
      .getRoot()
      .getValueByString(ga)
      .getValueByIndex(e)
      .getValueByString(Lg)
      .isNull();
  }
  isExistMotionCurveFadeOutTime(e) {
    return !this._json
      .getRoot()
      .getValueByString(ga)
      .getValueByIndex(e)
      .getValueByString(Ng)
      .isNull();
  }
  getMotionCurveFadeInTime(e) {
    return this._json
      .getRoot()
      .getValueByString(ga)
      .getValueByIndex(e)
      .getValueByString(Lg)
      .toFloat();
  }
  getMotionCurveFadeOutTime(e) {
    return this._json
      .getRoot()
      .getValueByString(ga)
      .getValueByIndex(e)
      .getValueByString(Ng)
      .toFloat();
  }
  getMotionCurveSegmentCount(e) {
    return this._json
      .getRoot()
      .getValueByString(ga)
      .getValueByIndex(e)
      .getValueByString(u5)
      .getVector()
      .getSize();
  }
  getMotionCurveSegment(e, n) {
    return this._json
      .getRoot()
      .getValueByString(ga)
      .getValueByIndex(e)
      .getValueByString(u5)
      .getValueByIndex(n)
      .toFloat();
  }
  getEventCount() {
    return this._json
      .getRoot()
      .getValueByString(Bi)
      .getValueByString(ile)
      .toInt();
  }
  getTotalEventValueSize() {
    return this._json
      .getRoot()
      .getValueByString(Bi)
      .getValueByString(sle)
      .toInt();
  }
  getEventTime(e) {
    return this._json
      .getRoot()
      .getValueByString(d5)
      .getValueByIndex(e)
      .getValueByString(ole)
      .toFloat();
  }
  getEventValue(e) {
    return new csmString(
      this._json
        .getRoot()
        .getValueByString(d5)
        .getValueByIndex(e)
        .getValueByString(ale)
        .getRawString(),
    );
  }
  _json;
}
var B8 = ((t) => (
    (t[(t.EvaluationOptionFlag_AreBeziersRistricted = 0)] =
      "EvaluationOptionFlag_AreBeziersRistricted"),
    t
  ))(B8 || {}),
  f5;
((t) => {
  t.CubismMotionJson = CubismMotionJson;
})(f5 || (f5 = {}));
const lle = "EyeBlink",
  cle = "LipSync",
  ule = "Model",
  dle = "Parameter",
  fle = "PartOpacity",
  Og = "Opacity",
  hle = !1;
function Ts(t, e, n) {
  const r = new CubismMotionPoint();
  return (
    (r.time = t.time + (e.time - t.time) * n),
    (r.value = t.value + (e.value - t.value) * n),
    r
  );
}
function U8(t, e) {
  let n = (e - t[0].time) / (t[1].time - t[0].time);
  return (n < 0 && (n = 0), t[0].value + (t[1].value - t[0].value) * n);
}
function ple(t, e) {
  let n = (e - t[0].time) / (t[3].time - t[0].time);
  n < 0 && (n = 0);
  const r = Ts(t[0], t[1], n),
    i = Ts(t[1], t[2], n),
    s = Ts(t[2], t[3], n),
    o = Ts(r, i, n),
    a = Ts(i, s, n);
  return Ts(o, a, n).value;
}
function mle(t, e) {
  const n = e,
    r = t[0].time,
    i = t[3].time,
    s = t[1].time,
    o = t[2].time,
    a = i - 3 * o + 3 * s - r,
    l = 3 * o - 6 * s + 3 * r,
    c = 3 * s - 3 * r,
    u = r - n,
    d = CubismMath.cardanoAlgorithmForBezier(a, l, c, u),
    f = Ts(t[0], t[1], d),
    h = Ts(t[1], t[2], d),
    _ = Ts(t[2], t[3], d),
    m = Ts(f, h, d),
    p = Ts(h, _, d);
  return Ts(m, p, d).value;
}
function V8(t, e) {
  return t[0].value;
}
function G8(t, e) {
  return t[1].value;
}
function tw(t, e, n, r, i) {
  const s = t.curves.at(e);
  let o = -1;
  const a = s.baseSegmentIndex + s.segmentCount;
  let l = 0;
  for (let u = s.baseSegmentIndex; u < a; ++u)
    if (
      ((l =
        t.segments.at(u).basePointIndex +
        (t.segments.at(u).segmentType ==
        CubismMotionSegmentType.CubismMotionSegmentType_Bezier
          ? 3
          : 1)),
      t.points.at(l).time > n)
    ) {
      o = u;
      break;
    }
  if (o == -1)
    return r && n < i
      ? gle(t, a - 1, t.segments.at(s.baseSegmentIndex).basePointIndex, l, n, i)
      : t.points.at(l).value;
  const c = t.segments.at(o);
  return c.evaluate(t.points.get(c.basePointIndex), n);
}
function gle(t, e, n, r, i, s) {
  const o = [new CubismMotionPoint(), new CubismMotionPoint()];
  {
    const a = t.points.at(r);
    ((o[0].time = a.time), (o[0].value = a.value));
  }
  {
    const a = t.points.at(n);
    ((o[1].time = s), (o[1].value = a.value));
  }
  switch (t.segments.at(e).segmentType) {
    case CubismMotionSegmentType.CubismMotionSegmentType_Linear:
    case CubismMotionSegmentType.CubismMotionSegmentType_Bezier:
    default:
      return U8(o, i);
    case CubismMotionSegmentType.CubismMotionSegmentType_Stepped:
      return V8(o);
    case CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped:
      return G8(o);
  }
}
class CubismMotion extends ACubismMotion {
  static create(e, n, r, i, s = !1) {
    const o = new CubismMotion();
    if ((o.parse(e, n, s), o._motionData))
      ((o._sourceFrameRate = o._motionData.fps),
        (o._loopDurationSeconds = o._motionData.duration),
        (o._onFinishedMotion = r),
        (o._onBeganMotion = i));
    else return (csmDelete(o), null);
    return o;
  }
  doUpdateParameters(e, n, r, i) {
    (this._modelCurveIdEyeBlink == null &&
      (this._modelCurveIdEyeBlink = CubismFramework.getIdManager().getId(lle)),
      this._modelCurveIdLipSync == null &&
        (this._modelCurveIdLipSync = CubismFramework.getIdManager().getId(cle)),
      this._modelCurveIdOpacity == null &&
        (this._modelCurveIdOpacity = CubismFramework.getIdManager().getId(Og)),
      this._motionBehavior === 1 &&
        this._previousLoopState !== this._isLoop &&
        (this.adjustEndTime(i), (this._previousLoopState = this._isLoop)));
    let s = n - i.getStartTime();
    s < 0 && (s = 0);
    let o = Number.MAX_VALUE,
      a = Number.MAX_VALUE;
    const l = 64;
    let c = 0,
      u = 0;
    (this._eyeBlinkParameterIds.getSize() > l &&
      Ym(
        "too many eye blink targets : {0}",
        this._eyeBlinkParameterIds.getSize(),
      ),
      this._lipSyncParameterIds.getSize() > l &&
        Ym(
          "too many lip sync targets : {0}",
          this._lipSyncParameterIds.getSize(),
        ));
    const d =
        this._fadeInSeconds <= 0
          ? 1
          : CubismMath.getEasingSine(
              (n - i.getFadeInStartTime()) / this._fadeInSeconds,
            ),
      f =
        this._fadeOutSeconds <= 0 || i.getEndTime() < 0
          ? 1
          : CubismMath.getEasingSine(
              (i.getEndTime() - n) / this._fadeOutSeconds,
            );
    let h,
      _,
      m,
      p = s,
      v = this._motionData.duration;
    const y = this._motionBehavior === 1 && this._isLoop;
    if (this._isLoop)
      for (
        this._motionBehavior === 1 && (v += 1 / this._motionData.fps);
        p > v;
      )
        p -= v;
    const x = this._motionData.curves;
    for (
      _ = 0;
      _ < this._motionData.curveCount &&
      x.at(_).type == CubismMotionCurveTarget.CubismMotionCurveTarget_Model;
      ++_
    )
      ((h = tw(this._motionData, _, p, y, v)),
        x.at(_).id == this._modelCurveIdEyeBlink
          ? (a = h)
          : x.at(_).id == this._modelCurveIdLipSync
            ? (o = h)
            : x.at(_).id == this._modelCurveIdOpacity &&
              ((this._modelOpacity = h),
              e.setModelOapcity(this.getModelOpacityValue())));
    for (
      ;
      _ < this._motionData.curveCount &&
      x.at(_).type == CubismMotionCurveTarget.CubismMotionCurveTarget_Parameter;
      ++_
    ) {
      if (((m = e.getParameterIndex(x.at(_).id)), m == -1)) continue;
      const w = e.getParameterValueByIndex(m);
      if (((h = tw(this._motionData, _, p, y, v)), a != Number.MAX_VALUE)) {
        for (let T = 0; T < this._eyeBlinkParameterIds.getSize() && T < l; ++T)
          if (this._eyeBlinkParameterIds.at(T) == x.at(_).id) {
            ((h *= a), (u |= 1 << T));
            break;
          }
      }
      if (o != Number.MAX_VALUE) {
        for (let T = 0; T < this._lipSyncParameterIds.getSize() && T < l; ++T)
          if (this._lipSyncParameterIds.at(T) == x.at(_).id) {
            ((h += o), (c |= 1 << T));
            break;
          }
      }
      e.isRepeat(m) && (h = e.getParameterRepeatValue(m, h));
      let S;
      if (x.at(_).fadeInTime < 0 && x.at(_).fadeOutTime < 0)
        S = w + (h - w) * r;
      else {
        let T, R;
        (x.at(_).fadeInTime < 0
          ? (T = d)
          : (T =
              x.at(_).fadeInTime == 0
                ? 1
                : CubismMath.getEasingSine(
                    (n - i.getFadeInStartTime()) / x.at(_).fadeInTime,
                  )),
          x.at(_).fadeOutTime < 0
            ? (R = f)
            : (R =
                x.at(_).fadeOutTime == 0 || i.getEndTime() < 0
                  ? 1
                  : CubismMath.getEasingSine(
                      (i.getEndTime() - n) / x.at(_).fadeOutTime,
                    )));
        const E = this._weight * T * R;
        S = w + (h - w) * E;
      }
      e.setParameterValueByIndex(m, S, 1);
    }
    {
      if (a != Number.MAX_VALUE)
        for (
          let w = 0;
          w < this._eyeBlinkParameterIds.getSize() && w < l;
          ++w
        ) {
          const S = e.getParameterValueById(this._eyeBlinkParameterIds.at(w));
          if ((u >> w) & 1) continue;
          const T = S + (a - S) * r;
          e.setParameterValueById(this._eyeBlinkParameterIds.at(w), T);
        }
      if (o != Number.MAX_VALUE)
        for (let w = 0; w < this._lipSyncParameterIds.getSize() && w < l; ++w) {
          const S = e.getParameterValueById(this._lipSyncParameterIds.at(w));
          if ((c >> w) & 1) continue;
          const T = S + (o - S) * r;
          e.setParameterValueById(this._lipSyncParameterIds.at(w), T);
        }
    }
    for (
      ;
      _ < this._motionData.curveCount &&
      x.at(_).type ==
        CubismMotionCurveTarget.CubismMotionCurveTarget_PartOpacity;
      ++_
    )
      ((m = e.getParameterIndex(x.at(_).id)),
        m != -1 &&
          ((h = tw(this._motionData, _, p, y, v)),
          e.setParameterValueByIndex(m, h)));
    (s >= v &&
      (this._isLoop
        ? this.updateForNextLoop(i, n, p)
        : (this._onFinishedMotion && this._onFinishedMotion(this),
          i.setIsFinished(!0))),
      (this._lastWeight = r));
  }
  setIsLoop(e) {
    (Yt("setIsLoop() is a deprecated function. Please use setLoop()."),
      (this._isLoop = e));
  }
  isLoop() {
    return (
      Yt("isLoop() is a deprecated function. Please use getLoop()."),
      this._isLoop
    );
  }
  setIsLoopFadeIn(e) {
    (Yt(
      "setIsLoopFadeIn() is a deprecated function. Please use setLoopFadeIn().",
    ),
      (this._isLoopFadeIn = e));
  }
  isLoopFadeIn() {
    return (
      Yt(
        "isLoopFadeIn() is a deprecated function. Please use getLoopFadeIn().",
      ),
      this._isLoopFadeIn
    );
  }
  setMotionBehavior(e) {
    this._motionBehavior = e;
  }
  getMotionBehavior() {
    return this._motionBehavior;
  }
  getDuration() {
    return this._isLoop ? -1 : this._loopDurationSeconds;
  }
  getLoopDuration() {
    return this._loopDurationSeconds;
  }
  setParameterFadeInTime(e, n) {
    const r = this._motionData.curves;
    for (let i = 0; i < this._motionData.curveCount; ++i)
      if (e == r.at(i).id) {
        r.at(i).fadeInTime = n;
        return;
      }
  }
  setParameterFadeOutTime(e, n) {
    const r = this._motionData.curves;
    for (let i = 0; i < this._motionData.curveCount; ++i)
      if (e == r.at(i).id) {
        r.at(i).fadeOutTime = n;
        return;
      }
  }
  getParameterFadeInTime(e) {
    const n = this._motionData.curves;
    for (let r = 0; r < this._motionData.curveCount; ++r)
      if (e == n.at(r).id) return n.at(r).fadeInTime;
    return -1;
  }
  getParameterFadeOutTime(e) {
    const n = this._motionData.curves;
    for (let r = 0; r < this._motionData.curveCount; ++r)
      if (e == n.at(r).id) return n.at(r).fadeOutTime;
    return -1;
  }
  setEffectIds(e, n) {
    ((this._eyeBlinkParameterIds = e), (this._lipSyncParameterIds = n));
  }
  constructor() {
    (super(),
      (this._sourceFrameRate = 30),
      (this._loopDurationSeconds = -1),
      (this._isLoop = !1),
      (this._isLoopFadeIn = !0),
      (this._lastWeight = 0),
      (this._motionData = null),
      (this._modelCurveIdEyeBlink = null),
      (this._modelCurveIdLipSync = null),
      (this._modelCurveIdOpacity = null),
      (this._eyeBlinkParameterIds = null),
      (this._lipSyncParameterIds = null),
      (this._modelOpacity = 1),
      (this._debugMode = !1));
  }
  release() {
    ((this._motionData = void 0), (this._motionData = null));
  }
  updateForNextLoop(e, n, r) {
    switch (this._motionBehavior) {
      case 1:
      default:
        (e.setStartTime(n - r),
          this._isLoopFadeIn && e.setFadeInStartTime(n - r),
          this._onFinishedMotion != null && this._onFinishedMotion(this));
        break;
      case 0:
        (e.setStartTime(n), this._isLoopFadeIn && e.setFadeInStartTime(n));
        break;
    }
  }
  parse(e, n, r = !1) {
    let i = new CubismMotionJson(e, n);
    if (!i) {
      (i.release(), (i = void 0));
      return;
    }
    if (r && !i.hasConsistency()) {
      (i.release(), Wn("Inconsistent motion3.json."));
      return;
    }
    ((this._motionData = new CubismMotionData()),
      (this._motionData.duration = i.getMotionDuration()),
      (this._motionData.loop = i.isMotionLoop()),
      (this._motionData.curveCount = i.getMotionCurveCount()),
      (this._motionData.fps = i.getMotionFps()),
      (this._motionData.eventCount = i.getEventCount()));
    const s = i.getEvaluationOptionFlag(
      B8.EvaluationOptionFlag_AreBeziersRistricted,
    );
    (i.isExistMotionFadeInTime()
      ? (this._fadeInSeconds =
          i.getMotionFadeInTime() < 0 ? 1 : i.getMotionFadeInTime())
      : (this._fadeInSeconds = 1),
      i.isExistMotionFadeOutTime()
        ? (this._fadeOutSeconds =
            i.getMotionFadeOutTime() < 0 ? 1 : i.getMotionFadeOutTime())
        : (this._fadeOutSeconds = 1),
      this._motionData.curves.updateSize(
        this._motionData.curveCount,
        CubismMotionCurve,
        !0,
      ),
      this._motionData.segments.updateSize(
        i.getMotionTotalSegmentCount(),
        CubismMotionSegment,
        !0,
      ),
      this._motionData.points.updateSize(
        i.getMotionTotalPointCount(),
        CubismMotionPoint,
        !0,
      ),
      this._motionData.events.updateSize(
        this._motionData.eventCount,
        CubismMotionEvent,
        !0,
      ));
    let o = 0,
      a = 0;
    for (let l = 0; l < this._motionData.curveCount; ++l) {
      (i.getMotionCurveTarget(l) == ule
        ? (this._motionData.curves.at(l).type =
            CubismMotionCurveTarget.CubismMotionCurveTarget_Model)
        : i.getMotionCurveTarget(l) == dle
          ? (this._motionData.curves.at(l).type =
              CubismMotionCurveTarget.CubismMotionCurveTarget_Parameter)
          : i.getMotionCurveTarget(l) == fle
            ? (this._motionData.curves.at(l).type =
                CubismMotionCurveTarget.CubismMotionCurveTarget_PartOpacity)
            : Yt(
                'Warning : Unable to get segment type from Curve! The number of "CurveCount" may be incorrect!',
              ),
        (this._motionData.curves.at(l).id = i.getMotionCurveId(l)),
        (this._motionData.curves.at(l).baseSegmentIndex = a),
        (this._motionData.curves.at(l).fadeInTime =
          i.isExistMotionCurveFadeInTime(l)
            ? i.getMotionCurveFadeInTime(l)
            : -1),
        (this._motionData.curves.at(l).fadeOutTime =
          i.isExistMotionCurveFadeOutTime(l)
            ? i.getMotionCurveFadeOutTime(l)
            : -1));
      for (let c = 0; c < i.getMotionCurveSegmentCount(l);) {
        switch (
          (c == 0
            ? ((this._motionData.segments.at(a).basePointIndex = o),
              (this._motionData.points.at(o).time = i.getMotionCurveSegment(
                l,
                c,
              )),
              (this._motionData.points.at(o).value = i.getMotionCurveSegment(
                l,
                c + 1,
              )),
              (o += 1),
              (c += 2))
            : (this._motionData.segments.at(a).basePointIndex = o - 1),
          i.getMotionCurveSegment(l, c))
        ) {
          case CubismMotionSegmentType.CubismMotionSegmentType_Linear: {
            ((this._motionData.segments.at(a).segmentType =
              CubismMotionSegmentType.CubismMotionSegmentType_Linear),
              (this._motionData.segments.at(a).evaluate = U8),
              (this._motionData.points.at(o).time = i.getMotionCurveSegment(
                l,
                c + 1,
              )),
              (this._motionData.points.at(o).value = i.getMotionCurveSegment(
                l,
                c + 2,
              )),
              (o += 1),
              (c += 3));
            break;
          }
          case CubismMotionSegmentType.CubismMotionSegmentType_Bezier: {
            ((this._motionData.segments.at(a).segmentType =
              CubismMotionSegmentType.CubismMotionSegmentType_Bezier),
              s || hle
                ? (this._motionData.segments.at(a).evaluate = ple)
                : (this._motionData.segments.at(a).evaluate = mle),
              (this._motionData.points.at(o).time = i.getMotionCurveSegment(
                l,
                c + 1,
              )),
              (this._motionData.points.at(o).value = i.getMotionCurveSegment(
                l,
                c + 2,
              )),
              (this._motionData.points.at(o + 1).time = i.getMotionCurveSegment(
                l,
                c + 3,
              )),
              (this._motionData.points.at(o + 1).value =
                i.getMotionCurveSegment(l, c + 4)),
              (this._motionData.points.at(o + 2).time = i.getMotionCurveSegment(
                l,
                c + 5,
              )),
              (this._motionData.points.at(o + 2).value =
                i.getMotionCurveSegment(l, c + 6)),
              (o += 3),
              (c += 7));
            break;
          }
          case CubismMotionSegmentType.CubismMotionSegmentType_Stepped: {
            ((this._motionData.segments.at(a).segmentType =
              CubismMotionSegmentType.CubismMotionSegmentType_Stepped),
              (this._motionData.segments.at(a).evaluate = V8),
              (this._motionData.points.at(o).time = i.getMotionCurveSegment(
                l,
                c + 1,
              )),
              (this._motionData.points.at(o).value = i.getMotionCurveSegment(
                l,
                c + 2,
              )),
              (o += 1),
              (c += 3));
            break;
          }
          case CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped: {
            ((this._motionData.segments.at(a).segmentType =
              CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped),
              (this._motionData.segments.at(a).evaluate = G8),
              (this._motionData.points.at(o).time = i.getMotionCurveSegment(
                l,
                c + 1,
              )),
              (this._motionData.points.at(o).value = i.getMotionCurveSegment(
                l,
                c + 2,
              )),
              (o += 1),
              (c += 3));
            break;
          }
          default: {
            Si(0);
            break;
          }
        }
        (++this._motionData.curves.at(l).segmentCount, ++a);
      }
    }
    for (let l = 0; l < i.getEventCount(); ++l)
      ((this._motionData.events.at(l).fireTime = i.getEventTime(l)),
        (this._motionData.events.at(l).value = i.getEventValue(l)));
    (i.release(), (i = void 0), (i = null));
  }
  getFiredEvent(e, n) {
    this._firedEventValues.updateSize(0);
    for (let r = 0; r < this._motionData.eventCount; ++r)
      this._motionData.events.at(r).fireTime > e &&
        this._motionData.events.at(r).fireTime <= n &&
        this._firedEventValues.pushBack(
          new csmString(this._motionData.events.at(r).value.s),
        );
    return this._firedEventValues;
  }
  isExistModelOpacity() {
    for (let e = 0; e < this._motionData.curveCount; e++) {
      const n = this._motionData.curves.at(e);
      if (
        n.type == CubismMotionCurveTarget.CubismMotionCurveTarget_Model &&
        n.id.getString().s.localeCompare(Og) == 0
      )
        return !0;
    }
    return !1;
  }
  getModelOpacityIndex() {
    if (this.isExistModelOpacity())
      for (let e = 0; e < this._motionData.curveCount; e++) {
        const n = this._motionData.curves.at(e);
        if (
          n.type == CubismMotionCurveTarget.CubismMotionCurveTarget_Model &&
          n.id.getString().s.localeCompare(Og) == 0
        )
          return e;
      }
    return -1;
  }
  getModelOpacityId(e) {
    if (e != -1) {
      const n = this._motionData.curves.at(e);
      if (
        n.type == CubismMotionCurveTarget.CubismMotionCurveTarget_Model &&
        n.id.getString().s.localeCompare(Og) == 0
      )
        return CubismFramework.getIdManager().getId(n.id.getString().s);
    }
    return null;
  }
  getModelOpacityValue() {
    return this._modelOpacity;
  }
  setDebugMode(e) {
    this._debugMode = e;
  }
  _sourceFrameRate;
  _loopDurationSeconds;
  _motionBehavior = 1;
  _lastWeight;
  _motionData;
  _eyeBlinkParameterIds;
  _lipSyncParameterIds;
  _modelCurveIdEyeBlink;
  _modelCurveIdLipSync;
  _modelCurveIdOpacity;
  _modelOpacity;
  _debugMode;
}
var h5;
((t) => {
  t.CubismMotion = CubismMotion;
})(h5 || (h5 = {}));
class CubismMotionManager extends CubismMotionQueueManager {
  constructor() {
    (super(), (this._currentPriority = 0), (this._reservePriority = 0));
  }
  getCurrentPriority() {
    return this._currentPriority;
  }
  getReservePriority() {
    return this._reservePriority;
  }
  setReservePriority(e) {
    this._reservePriority = e;
  }
  startMotionPriority(e, n, r) {
    return (
      r == this._reservePriority && (this._reservePriority = 0),
      (this._currentPriority = r),
      super.startMotion(e, n)
    );
  }
  updateMotion(e, n) {
    this._userTimeSeconds += n;
    const r = super.doUpdateMotion(e, this._userTimeSeconds);
    return (
      this.isFinished() &&
        (console.log(
          "[CubismMotionManager] all motions finished, clearing currentPriority",
        ),
        (this._currentPriority = 0)),
      r
    );
  }
  reserveMotion(e) {
    return e <= this._reservePriority || e <= this._currentPriority
      ? !1
      : ((this._reservePriority = e), !0);
  }
  _currentPriority;
  _reservePriority;
}
var p5;
((t) => {
  t.CubismMotionManager = CubismMotionManager;
})(p5 || (p5 = {}));
var CubismPhysicsTargetType = ((t) => (
    (t[(t.CubismPhysicsTargetType_Parameter = 0)] =
      "CubismPhysicsTargetType_Parameter"),
    t
  ))(CubismPhysicsTargetType || {}),
  CubismPhysicsSource = ((t) => (
    (t[(t.CubismPhysicsSource_X = 0)] = "CubismPhysicsSource_X"),
    (t[(t.CubismPhysicsSource_Y = 1)] = "CubismPhysicsSource_Y"),
    (t[(t.CubismPhysicsSource_Angle = 2)] = "CubismPhysicsSource_Angle"),
    t
  ))(CubismPhysicsSource || {});
class vle {
  constructor() {
    ((this.gravity = new CubismVector2(0, 0)),
      (this.wind = new CubismVector2(0, 0)));
  }
  gravity;
  wind;
}
class CubismPhysicsParameter {
  id;
  targetType;
}
class CubismPhysicsNormalization {
  minimum;
  maximum;
  defalut;
}
class CubismPhysicsParticle {
  constructor() {
    ((this.initialPosition = new CubismVector2(0, 0)),
      (this.position = new CubismVector2(0, 0)),
      (this.lastPosition = new CubismVector2(0, 0)),
      (this.lastGravity = new CubismVector2(0, 0)),
      (this.force = new CubismVector2(0, 0)),
      (this.velocity = new CubismVector2(0, 0)));
  }
  initialPosition;
  mobility;
  delay;
  acceleration;
  radius;
  position;
  lastPosition;
  lastGravity;
  force;
  velocity;
}
class CubismPhysicsSubRig {
  constructor() {
    ((this.normalizationPosition = new CubismPhysicsNormalization()),
      (this.normalizationAngle = new CubismPhysicsNormalization()));
  }
  inputCount;
  outputCount;
  particleCount;
  baseInputIndex;
  baseOutputIndex;
  baseParticleIndex;
  normalizationPosition;
  normalizationAngle;
}
class CubismPhysicsInput {
  constructor() {
    this.source = new CubismPhysicsParameter();
  }
  source;
  sourceParameterIndex;
  weight;
  type;
  reflect;
  getNormalizedParameterValue;
}
class CubismPhysicsOutput {
  constructor() {
    ((this.destination = new CubismPhysicsParameter()),
      (this.translationScale = new CubismVector2(0, 0)));
  }
  destination;
  destinationParameterIndex;
  vertexIndex;
  translationScale;
  angleScale;
  weight;
  type;
  reflect;
  valueBelowMinimum;
  valueExceededMaximum;
  getValue;
  getScale;
}
class CubismPhysicsRig {
  constructor() {
    ((this.settings = new csmVector()),
      (this.inputs = new csmVector()),
      (this.outputs = new csmVector()),
      (this.particles = new csmVector()),
      (this.gravity = new CubismVector2(0, 0)),
      (this.wind = new CubismVector2(0, 0)),
      (this.fps = 0));
  }
  subRigCount;
  settings;
  inputs;
  outputs;
  particles;
  gravity;
  wind;
  fps;
}
var m5;
((t) => {
  ((t.CubismPhysicsInput = CubismPhysicsInput),
    (t.CubismPhysicsNormalization = CubismPhysicsNormalization),
    (t.CubismPhysicsOutput = CubismPhysicsOutput),
    (t.CubismPhysicsParameter = CubismPhysicsParameter),
    (t.CubismPhysicsParticle = CubismPhysicsParticle),
    (t.CubismPhysicsRig = CubismPhysicsRig),
    (t.CubismPhysicsSource = CubismPhysicsSource),
    (t.CubismPhysicsSubRig = CubismPhysicsSubRig),
    (t.CubismPhysicsTargetType = CubismPhysicsTargetType),
    (t.PhysicsJsonEffectiveForces = vle));
})(m5 || (m5 = {}));
const tp = "Position",
  nw = "X",
  rw = "Y",
  iw = "Angle",
  g5 = "Type",
  v5 = "Id",
  va = "Meta",
  Fg = "EffectiveForces",
  ble = "TotalInputCount",
  _le = "TotalOutputCount",
  yle = "PhysicsSettingCount",
  b5 = "Gravity",
  _5 = "Wind",
  xle = "VertexCount",
  wle = "Fps",
  wn = "PhysicsSettings",
  _d = "Normalization",
  y5 = "Minimum",
  x5 = "Maximum",
  w5 = "Default",
  S5 = "Reflect",
  M5 = "Weight",
  np = "Input",
  Sle = "Source",
  Lc = "Output",
  Mle = "Scale",
  Tle = "VertexIndex",
  Ele = "Destination",
  Nc = "Vertices",
  Cle = "Mobility",
  Rle = "Delay",
  Ale = "Radius",
  Ple = "Acceleration";
class CubismPhysicsJson {
  constructor(e, n) {
    this._json = CubismJson.create(e, n);
  }
  release() {
    CubismJson.delete(this._json);
  }
  getGravity() {
    const e = new CubismVector2(0, 0);
    return (
      (e.x = this._json
        .getRoot()
        .getValueByString(va)
        .getValueByString(Fg)
        .getValueByString(b5)
        .getValueByString(nw)
        .toFloat()),
      (e.y = this._json
        .getRoot()
        .getValueByString(va)
        .getValueByString(Fg)
        .getValueByString(b5)
        .getValueByString(rw)
        .toFloat()),
      e
    );
  }
  getWind() {
    const e = new CubismVector2(0, 0);
    return (
      (e.x = this._json
        .getRoot()
        .getValueByString(va)
        .getValueByString(Fg)
        .getValueByString(_5)
        .getValueByString(nw)
        .toFloat()),
      (e.y = this._json
        .getRoot()
        .getValueByString(va)
        .getValueByString(Fg)
        .getValueByString(_5)
        .getValueByString(rw)
        .toFloat()),
      e
    );
  }
  getFps() {
    return this._json
      .getRoot()
      .getValueByString(va)
      .getValueByString(wle)
      .toFloat(0);
  }
  getSubRigCount() {
    return this._json
      .getRoot()
      .getValueByString(va)
      .getValueByString(yle)
      .toInt();
  }
  getTotalInputCount() {
    return this._json
      .getRoot()
      .getValueByString(va)
      .getValueByString(ble)
      .toInt();
  }
  getTotalOutputCount() {
    return this._json
      .getRoot()
      .getValueByString(va)
      .getValueByString(_le)
      .toInt();
  }
  getVertexCount() {
    return this._json
      .getRoot()
      .getValueByString(va)
      .getValueByString(xle)
      .toInt();
  }
  getNormalizationPositionMinimumValue(e) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(_d)
      .getValueByString(tp)
      .getValueByString(y5)
      .toFloat();
  }
  getNormalizationPositionMaximumValue(e) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(_d)
      .getValueByString(tp)
      .getValueByString(x5)
      .toFloat();
  }
  getNormalizationPositionDefaultValue(e) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(_d)
      .getValueByString(tp)
      .getValueByString(w5)
      .toFloat();
  }
  getNormalizationAngleMinimumValue(e) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(_d)
      .getValueByString(iw)
      .getValueByString(y5)
      .toFloat();
  }
  getNormalizationAngleMaximumValue(e) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(_d)
      .getValueByString(iw)
      .getValueByString(x5)
      .toFloat();
  }
  getNormalizationAngleDefaultValue(e) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(_d)
      .getValueByString(iw)
      .getValueByString(w5)
      .toFloat();
  }
  getInputCount(e) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(np)
      .getVector()
      .getSize();
  }
  getInputWeight(e, n) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(np)
      .getValueByIndex(n)
      .getValueByString(M5)
      .toFloat();
  }
  getInputReflect(e, n) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(np)
      .getValueByIndex(n)
      .getValueByString(S5)
      .toBoolean();
  }
  getInputType(e, n) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(np)
      .getValueByIndex(n)
      .getValueByString(g5)
      .getRawString();
  }
  getInputSourceId(e, n) {
    return CubismFramework.getIdManager().getId(
      this._json
        .getRoot()
        .getValueByString(wn)
        .getValueByIndex(e)
        .getValueByString(np)
        .getValueByIndex(n)
        .getValueByString(Sle)
        .getValueByString(v5)
        .getRawString(),
    );
  }
  getOutputCount(e) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(Lc)
      .getVector()
      .getSize();
  }
  getOutputVertexIndex(e, n) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(Lc)
      .getValueByIndex(n)
      .getValueByString(Tle)
      .toInt();
  }
  getOutputAngleScale(e, n) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(Lc)
      .getValueByIndex(n)
      .getValueByString(Mle)
      .toFloat();
  }
  getOutputWeight(e, n) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(Lc)
      .getValueByIndex(n)
      .getValueByString(M5)
      .toFloat();
  }
  getOutputDestinationId(e, n) {
    return CubismFramework.getIdManager().getId(
      this._json
        .getRoot()
        .getValueByString(wn)
        .getValueByIndex(e)
        .getValueByString(Lc)
        .getValueByIndex(n)
        .getValueByString(Ele)
        .getValueByString(v5)
        .getRawString(),
    );
  }
  getOutputType(e, n) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(Lc)
      .getValueByIndex(n)
      .getValueByString(g5)
      .getRawString();
  }
  getOutputReflect(e, n) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(Lc)
      .getValueByIndex(n)
      .getValueByString(S5)
      .toBoolean();
  }
  getParticleCount(e) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(Nc)
      .getVector()
      .getSize();
  }
  getParticleMobility(e, n) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(Nc)
      .getValueByIndex(n)
      .getValueByString(Cle)
      .toFloat();
  }
  getParticleDelay(e, n) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(Nc)
      .getValueByIndex(n)
      .getValueByString(Rle)
      .toFloat();
  }
  getParticleAcceleration(e, n) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(Nc)
      .getValueByIndex(n)
      .getValueByString(Ple)
      .toFloat();
  }
  getParticleRadius(e, n) {
    return this._json
      .getRoot()
      .getValueByString(wn)
      .getValueByIndex(e)
      .getValueByString(Nc)
      .getValueByIndex(n)
      .getValueByString(Ale)
      .toFloat();
  }
  getParticlePosition(e, n) {
    const r = new CubismVector2(0, 0);
    return (
      (r.x = this._json
        .getRoot()
        .getValueByString(wn)
        .getValueByIndex(e)
        .getValueByString(Nc)
        .getValueByIndex(n)
        .getValueByString(tp)
        .getValueByString(nw)
        .toFloat()),
      (r.y = this._json
        .getRoot()
        .getValueByString(wn)
        .getValueByIndex(e)
        .getValueByString(Nc)
        .getValueByIndex(n)
        .getValueByString(tp)
        .getValueByString(rw)
        .toFloat()),
      r
    );
  }
  _json;
}
var T5;
((t) => {
  t.CubismPhysicsJson = CubismPhysicsJson;
})(T5 || (T5 = {}));
const E5 = "X",
  C5 = "Y",
  R5 = "Angle",
  Ile = 5,
  LT = 100,
  A5 = 0.001,
  kle = 5;
class CubismPhysics {
  static create(e, n) {
    const r = new CubismPhysics();
    return (r.parse(e, n), (r._physicsRig.gravity.y = 0), r);
  }
  static delete(e) {
    e != null && (e.release(), (e = null));
  }
  parse(e, n) {
    this._physicsRig = new CubismPhysicsRig();
    let r = new CubismPhysicsJson(e, n);
    ((this._physicsRig.gravity = r.getGravity()),
      (this._physicsRig.wind = r.getWind()),
      (this._physicsRig.subRigCount = r.getSubRigCount()),
      (this._physicsRig.fps = r.getFps()),
      this._physicsRig.settings.updateSize(
        this._physicsRig.subRigCount,
        CubismPhysicsSubRig,
        !0,
      ),
      this._physicsRig.inputs.updateSize(
        r.getTotalInputCount(),
        CubismPhysicsInput,
        !0,
      ),
      this._physicsRig.outputs.updateSize(
        r.getTotalOutputCount(),
        CubismPhysicsOutput,
        !0,
      ),
      this._physicsRig.particles.updateSize(
        r.getVertexCount(),
        CubismPhysicsParticle,
        !0,
      ),
      this._currentRigOutputs.clear(),
      this._previousRigOutputs.clear());
    let i = 0,
      s = 0,
      o = 0;
    for (let a = 0; a < this._physicsRig.settings.getSize(); ++a) {
      ((this._physicsRig.settings.at(a).normalizationPosition.minimum =
        r.getNormalizationPositionMinimumValue(a)),
        (this._physicsRig.settings.at(a).normalizationPosition.maximum =
          r.getNormalizationPositionMaximumValue(a)),
        (this._physicsRig.settings.at(a).normalizationPosition.defalut =
          r.getNormalizationPositionDefaultValue(a)),
        (this._physicsRig.settings.at(a).normalizationAngle.minimum =
          r.getNormalizationAngleMinimumValue(a)),
        (this._physicsRig.settings.at(a).normalizationAngle.maximum =
          r.getNormalizationAngleMaximumValue(a)),
        (this._physicsRig.settings.at(a).normalizationAngle.defalut =
          r.getNormalizationAngleDefaultValue(a)),
        (this._physicsRig.settings.at(a).inputCount = r.getInputCount(a)),
        (this._physicsRig.settings.at(a).baseInputIndex = i));
      for (let u = 0; u < this._physicsRig.settings.at(a).inputCount; ++u)
        ((this._physicsRig.inputs.at(i + u).sourceParameterIndex = -1),
          (this._physicsRig.inputs.at(i + u).weight = r.getInputWeight(a, u)),
          (this._physicsRig.inputs.at(i + u).reflect = r.getInputReflect(a, u)),
          r.getInputType(a, u) == E5
            ? ((this._physicsRig.inputs.at(i + u).type =
                CubismPhysicsSource.CubismPhysicsSource_X),
              (this._physicsRig.inputs.at(i + u).getNormalizedParameterValue =
                Lle))
            : r.getInputType(a, u) == C5
              ? ((this._physicsRig.inputs.at(i + u).type =
                  CubismPhysicsSource.CubismPhysicsSource_Y),
                (this._physicsRig.inputs.at(i + u).getNormalizedParameterValue =
                  Nle))
              : r.getInputType(a, u) == R5 &&
                ((this._physicsRig.inputs.at(i + u).type =
                  CubismPhysicsSource.CubismPhysicsSource_Angle),
                (this._physicsRig.inputs.at(i + u).getNormalizedParameterValue =
                  Ole)),
          (this._physicsRig.inputs.at(i + u).source.targetType =
            CubismPhysicsTargetType.CubismPhysicsTargetType_Parameter),
          (this._physicsRig.inputs.at(i + u).source.id = r.getInputSourceId(
            a,
            u,
          )));
      ((i += this._physicsRig.settings.at(a).inputCount),
        (this._physicsRig.settings.at(a).outputCount = r.getOutputCount(a)),
        (this._physicsRig.settings.at(a).baseOutputIndex = s));
      const l = new P5();
      l.outputs.resize(this._physicsRig.settings.at(a).outputCount);
      const c = new P5();
      c.outputs.resize(this._physicsRig.settings.at(a).outputCount);
      for (let u = 0; u < this._physicsRig.settings.at(a).outputCount; ++u)
        (l.outputs.set(u, 0),
          c.outputs.set(u, 0),
          (this._physicsRig.outputs.at(s + u).destinationParameterIndex = -1),
          (this._physicsRig.outputs.at(s + u).vertexIndex =
            r.getOutputVertexIndex(a, u)),
          (this._physicsRig.outputs.at(s + u).angleScale =
            r.getOutputAngleScale(a, u)),
          (this._physicsRig.outputs.at(s + u).weight = r.getOutputWeight(a, u)),
          (this._physicsRig.outputs.at(s + u).destination.targetType =
            CubismPhysicsTargetType.CubismPhysicsTargetType_Parameter),
          (this._physicsRig.outputs.at(s + u).destination.id =
            r.getOutputDestinationId(a, u)),
          r.getOutputType(a, u) == E5
            ? ((this._physicsRig.outputs.at(s + u).type =
                CubismPhysicsSource.CubismPhysicsSource_X),
              (this._physicsRig.outputs.at(s + u).getValue = Fle),
              (this._physicsRig.outputs.at(s + u).getScale = jle))
            : r.getOutputType(a, u) == C5
              ? ((this._physicsRig.outputs.at(s + u).type =
                  CubismPhysicsSource.CubismPhysicsSource_Y),
                (this._physicsRig.outputs.at(s + u).getValue = Ble),
                (this._physicsRig.outputs.at(s + u).getScale = Hle))
              : r.getOutputType(a, u) == R5 &&
                ((this._physicsRig.outputs.at(s + u).type =
                  CubismPhysicsSource.CubismPhysicsSource_Angle),
                (this._physicsRig.outputs.at(s + u).getValue = Ule),
                (this._physicsRig.outputs.at(s + u).getScale = zle)),
          (this._physicsRig.outputs.at(s + u).reflect = r.getOutputReflect(
            a,
            u,
          )));
      (this._currentRigOutputs.pushBack(l),
        this._previousRigOutputs.pushBack(c),
        (s += this._physicsRig.settings.at(a).outputCount),
        (this._physicsRig.settings.at(a).particleCount = r.getParticleCount(a)),
        (this._physicsRig.settings.at(a).baseParticleIndex = o));
      for (let u = 0; u < this._physicsRig.settings.at(a).particleCount; ++u)
        ((this._physicsRig.particles.at(o + u).mobility = r.getParticleMobility(
          a,
          u,
        )),
          (this._physicsRig.particles.at(o + u).delay = r.getParticleDelay(
            a,
            u,
          )),
          (this._physicsRig.particles.at(o + u).acceleration =
            r.getParticleAcceleration(a, u)),
          (this._physicsRig.particles.at(o + u).radius = r.getParticleRadius(
            a,
            u,
          )),
          (this._physicsRig.particles.at(o + u).position =
            r.getParticlePosition(a, u)));
      o += this._physicsRig.settings.at(a).particleCount;
    }
    (this.initialize(), r.release(), (r = void 0), (r = null));
  }
  stabilization(e) {
    let n, r, i, s;
    const o = new CubismVector2();
    let a, l, c, u;
    const d = e.getModel().parameters.values,
      f = e.getModel().parameters.maximumValues,
      h = e.getModel().parameters.minimumValues,
      _ = e.getModel().parameters.defaultValues;
    ((this._parameterCaches?.length ?? 0) < e.getParameterCount() &&
      (this._parameterCaches = new Float32Array(e.getParameterCount())),
      (this._parameterInputCaches?.length ?? 0) < e.getParameterCount() &&
        (this._parameterInputCaches = new Float32Array(e.getParameterCount())));
    for (let m = 0; m < e.getParameterCount(); ++m)
      ((this._parameterCaches[m] = d[m]),
        (this._parameterInputCaches[m] = d[m]));
    for (let m = 0; m < this._physicsRig.subRigCount; ++m) {
      ((n = { angle: 0 }),
        (o.x = 0),
        (o.y = 0),
        (a = this._physicsRig.settings.at(m)),
        (l = this._physicsRig.inputs.get(a.baseInputIndex)),
        (c = this._physicsRig.outputs.get(a.baseOutputIndex)),
        (u = this._physicsRig.particles.get(a.baseParticleIndex)));
      for (let p = 0; p < a.inputCount; ++p)
        ((r = l[p].weight / LT),
          l[p].sourceParameterIndex == -1 &&
            (l[p].sourceParameterIndex = e.getParameterIndex(l[p].source.id)),
          l[p].getNormalizedParameterValue(
            o,
            n,
            d[l[p].sourceParameterIndex],
            h[l[p].sourceParameterIndex],
            f[l[p].sourceParameterIndex],
            _[l[p].sourceParameterIndex],
            a.normalizationPosition,
            a.normalizationAngle,
            l[p].reflect,
            r,
          ),
          (this._parameterCaches[l[p].sourceParameterIndex] =
            d[l[p].sourceParameterIndex]));
      ((i = CubismMath.degreesToRadian(-n.angle)),
        (o.x = o.x * CubismMath.cos(i) - o.y * CubismMath.sin(i)),
        (o.y = o.x * CubismMath.sin(i) + o.y * CubismMath.cos(i)),
        $le(
          u,
          a.particleCount,
          o,
          n.angle,
          this._options.wind,
          A5 * a.normalizationPosition.maximum,
        ));
      for (let p = 0; p < a.outputCount; ++p) {
        const v = c[p].vertexIndex;
        if (
          (c[p].destinationParameterIndex == -1 &&
            (c[p].destinationParameterIndex = e.getParameterIndex(
              c[p].destination.id,
            )),
          v < 1 || v >= a.particleCount)
        )
          continue;
        let y = new CubismVector2();
        ((y = u[v].position.substract(u[v - 1].position)),
          (s = c[p].getValue(y, u, v, c[p].reflect, this._options.gravity)),
          this._currentRigOutputs.at(m).outputs.set(p, s),
          this._previousRigOutputs.at(m).outputs.set(p, s));
        const x = c[p].destinationParameterIndex,
          w =
            !Float32Array.prototype.slice &&
            "subarray" in Float32Array.prototype
              ? JSON.parse(JSON.stringify(d.subarray(x)))
              : d.slice(x);
        sw(w, h[x], f[x], s, c[p]);
        for (let S = x, T = 0; S < this._parameterCaches.length; S++, T++)
          d[S] = this._parameterCaches[S] = w[T];
      }
    }
  }
  evaluate(e, n) {
    let r, i, s, o;
    const a = new CubismVector2();
    let l, c, u, d;
    if (0 >= n) return;
    const f = e.getModel().parameters.values,
      h = e.getModel().parameters.maximumValues,
      _ = e.getModel().parameters.minimumValues,
      m = e.getModel().parameters.defaultValues;
    let p;
    if (
      ((this._currentRemainTime += n),
      this._currentRemainTime > kle && (this._currentRemainTime = 0),
      (this._parameterCaches?.length ?? 0) < e.getParameterCount() &&
        (this._parameterCaches = new Float32Array(e.getParameterCount())),
      (this._parameterInputCaches?.length ?? 0) < e.getParameterCount())
    ) {
      this._parameterInputCaches = new Float32Array(e.getParameterCount());
      for (let y = 0; y < e.getParameterCount(); ++y)
        this._parameterInputCaches[y] = f[y];
    }
    for (
      this._physicsRig.fps > 0 ? (p = 1 / this._physicsRig.fps) : (p = n);
      this._currentRemainTime >= p;
    ) {
      for (let x = 0; x < this._physicsRig.subRigCount; ++x) {
        ((l = this._physicsRig.settings.at(x)),
          (u = this._physicsRig.outputs.get(l.baseOutputIndex)));
        for (let w = 0; w < l.outputCount; ++w)
          this._previousRigOutputs
            .at(x)
            .outputs.set(w, this._currentRigOutputs.at(x).outputs.at(w));
      }
      const y = p / this._currentRemainTime;
      for (let x = 0; x < e.getParameterCount(); ++x)
        ((this._parameterCaches[x] =
          this._parameterInputCaches[x] * (1 - y) + f[x] * y),
          (this._parameterInputCaches[x] = this._parameterCaches[x]));
      for (let x = 0; x < this._physicsRig.subRigCount; ++x) {
        ((r = { angle: 0 }),
          (a.x = 0),
          (a.y = 0),
          (l = this._physicsRig.settings.at(x)),
          (c = this._physicsRig.inputs.get(l.baseInputIndex)),
          (u = this._physicsRig.outputs.get(l.baseOutputIndex)),
          (d = this._physicsRig.particles.get(l.baseParticleIndex)));
        for (let w = 0; w < l.inputCount; ++w)
          ((i = c[w].weight / LT),
            c[w].sourceParameterIndex == -1 &&
              (c[w].sourceParameterIndex = e.getParameterIndex(c[w].source.id)),
            c[w].getNormalizedParameterValue(
              a,
              r,
              this._parameterCaches[c[w].sourceParameterIndex],
              _[c[w].sourceParameterIndex],
              h[c[w].sourceParameterIndex],
              m[c[w].sourceParameterIndex],
              l.normalizationPosition,
              l.normalizationAngle,
              c[w].reflect,
              i,
            ));
        ((s = CubismMath.degreesToRadian(-r.angle)),
          (a.x = a.x * CubismMath.cos(s) - a.y * CubismMath.sin(s)),
          (a.y = a.x * CubismMath.sin(s) + a.y * CubismMath.cos(s)),
          Wle(
            d,
            l.particleCount,
            a,
            r.angle,
            this._options.wind,
            A5 * l.normalizationPosition.maximum,
            p,
            Ile,
          ));
        for (let w = 0; w < l.outputCount; ++w) {
          const S = u[w].vertexIndex;
          if (
            (u[w].destinationParameterIndex == -1 &&
              (u[w].destinationParameterIndex = e.getParameterIndex(
                u[w].destination.id,
              )),
            S < 1 || S >= l.particleCount)
          )
            continue;
          const T = new CubismVector2();
          ((T.x = d[S].position.x - d[S - 1].position.x),
            (T.y = d[S].position.y - d[S - 1].position.y),
            (o = u[w].getValue(T, d, S, u[w].reflect, this._options.gravity)),
            this._currentRigOutputs.at(x).outputs.set(w, o));
          const R = u[w].destinationParameterIndex,
            E =
              !Float32Array.prototype.slice &&
              "subarray" in Float32Array.prototype
                ? JSON.parse(JSON.stringify(this._parameterCaches.subarray(R)))
                : this._parameterCaches.slice(R);
          sw(E, _[R], h[R], o, u[w]);
          for (let M = R, C = 0; M < this._parameterCaches.length; M++, C++)
            this._parameterCaches[M] = E[C];
        }
      }
      this._currentRemainTime -= p;
    }
    const v = this._currentRemainTime / p;
    this.interpolate(e, v);
  }
  interpolate(e, n) {
    let r, i;
    const s = e.getModel().parameters.values,
      o = e.getModel().parameters.maximumValues,
      a = e.getModel().parameters.minimumValues;
    for (let l = 0; l < this._physicsRig.subRigCount; ++l) {
      ((i = this._physicsRig.settings.at(l)),
        (r = this._physicsRig.outputs.get(i.baseOutputIndex)));
      for (let c = 0; c < i.outputCount; ++c) {
        if (r[c].destinationParameterIndex == -1) continue;
        const u = r[c].destinationParameterIndex,
          d =
            !Float32Array.prototype.slice &&
            "subarray" in Float32Array.prototype
              ? JSON.parse(JSON.stringify(s.subarray(u)))
              : s.slice(u);
        sw(
          d,
          a[u],
          o[u],
          this._previousRigOutputs.at(l).outputs.at(c) * (1 - n) +
            this._currentRigOutputs.at(l).outputs.at(c) * n,
          r[c],
        );
        for (let f = u, h = 0; f < s.length; f++, h++) s[f] = d[h];
      }
    }
  }
  setOptions(e) {
    this._options = e;
  }
  getOption() {
    return this._options;
  }
  constructor() {
    ((this._physicsRig = null),
      (this._options = new K8()),
      (this._options.gravity.y = -1),
      (this._options.gravity.x = 0),
      (this._options.wind.x = 0),
      (this._options.wind.y = 0),
      (this._currentRigOutputs = new csmVector()),
      (this._previousRigOutputs = new csmVector()),
      (this._currentRemainTime = 0),
      (this._parameterCaches = null),
      (this._parameterInputCaches = null));
  }
  release() {
    ((this._physicsRig = void 0), (this._physicsRig = null));
  }
  initialize() {
    let e, n, r;
    for (let i = 0; i < this._physicsRig.subRigCount; ++i) {
      ((n = this._physicsRig.settings.at(i)),
        (e = this._physicsRig.particles.get(n.baseParticleIndex)),
        (e[0].initialPosition = new CubismVector2(0, 0)),
        (e[0].lastPosition = new CubismVector2(
          e[0].initialPosition.x,
          e[0].initialPosition.y,
        )),
        (e[0].lastGravity = new CubismVector2(0, -1)),
        (e[0].lastGravity.y *= -1),
        (e[0].velocity = new CubismVector2(0, 0)),
        (e[0].force = new CubismVector2(0, 0)));
      for (let s = 1; s < n.particleCount; ++s)
        ((r = new CubismVector2(0, 0)),
          (r.y = e[s].radius),
          (e[s].initialPosition = new CubismVector2(
            e[s - 1].initialPosition.x + r.x,
            e[s - 1].initialPosition.y + r.y,
          )),
          (e[s].position = new CubismVector2(
            e[s].initialPosition.x,
            e[s].initialPosition.y,
          )),
          (e[s].lastPosition = new CubismVector2(
            e[s].initialPosition.x,
            e[s].initialPosition.y,
          )),
          (e[s].lastGravity = new CubismVector2(0, -1)),
          (e[s].lastGravity.y *= -1),
          (e[s].velocity = new CubismVector2(0, 0)),
          (e[s].force = new CubismVector2(0, 0)));
    }
  }
  _physicsRig;
  _options;
  _currentRigOutputs;
  _previousRigOutputs;
  _currentRemainTime;
  _parameterCaches;
  _parameterInputCaches;
}
class K8 {
  constructor() {
    ((this.gravity = new CubismVector2(0, 0)),
      (this.wind = new CubismVector2(0, 0)));
  }
  gravity;
  wind;
}
class P5 {
  constructor() {
    this.outputs = new csmVector(0);
  }
  outputs;
}
function Dle(t) {
  let e = 0;
  return (t > 0 ? (e = 1) : t < 0 && (e = -1), e);
}
function Lle(t, e, n, r, i, s, o, a, l, c) {
  t.x += QC(n, r, i, s, o.minimum, o.maximum, o.defalut, l) * c;
}
function Nle(t, e, n, r, i, s, o, a, l, c) {
  t.y += QC(n, r, i, s, o.minimum, o.maximum, o.defalut, l) * c;
}
function Ole(t, e, n, r, i, s, o, a, l, c) {
  e.angle += QC(n, r, i, s, a.minimum, a.maximum, a.defalut, l) * c;
}
function Fle(t, e, n, r, i) {
  let s = t.x;
  return (r && (s *= -1), s);
}
function Ble(t, e, n, r, i) {
  let s = t.y;
  return (r && (s *= -1), s);
}
function Ule(t, e, n, r, i) {
  let s;
  return (
    n >= 2
      ? (i = e[n - 1].position.substract(e[n - 2].position))
      : (i = i.multiplyByScaler(-1)),
    (s = CubismMath.directionToRadian(i, t)),
    r && (s *= -1),
    s
  );
}
function Vle(t, e) {
  const n = CubismMath.max(t, e),
    r = CubismMath.min(t, e);
  return CubismMath.abs(n - r);
}
function Gle(t, e) {
  return CubismMath.min(t, e) + Vle(t, e) / 2;
}
function jle(t, e) {
  return JSON.parse(JSON.stringify(t.x));
}
function Hle(t, e) {
  return JSON.parse(JSON.stringify(t.y));
}
function zle(t, e) {
  return JSON.parse(JSON.stringify(e));
}
function Wle(t, e, n, r, i, s, o, a) {
  let l,
    c,
    u = new CubismVector2(0, 0),
    d = new CubismVector2(0, 0),
    f = new CubismVector2(0, 0),
    h = new CubismVector2(0, 0);
  t[0].position = new CubismVector2(n.x, n.y);
  const _ = CubismMath.degreesToRadian(r),
    m = CubismMath.radianToDirection(_);
  m.normalize();
  for (let p = 1; p < e; ++p)
    ((t[p].force = m.multiplyByScaler(t[p].acceleration).add(i)),
      (t[p].lastPosition = new CubismVector2(t[p].position.x, t[p].position.y)),
      (l = t[p].delay * o * 30),
      (u = t[p].position.substract(t[p - 1].position)),
      (c = CubismMath.directionToRadian(t[p].lastGravity, m) / a),
      (u.x = CubismMath.cos(c) * u.x - u.y * CubismMath.sin(c)),
      (u.y = CubismMath.sin(c) * u.x + u.y * CubismMath.cos(c)),
      (t[p].position = t[p - 1].position.add(u)),
      (d = t[p].velocity.multiplyByScaler(l)),
      (f = t[p].force.multiplyByScaler(l).multiplyByScaler(l)),
      (t[p].position = t[p].position.add(d).add(f)),
      (h = t[p].position.substract(t[p - 1].position)),
      h.normalize(),
      (t[p].position = t[p - 1].position.add(h.multiplyByScaler(t[p].radius))),
      CubismMath.abs(t[p].position.x) < s && (t[p].position.x = 0),
      l != 0 &&
        ((t[p].velocity = t[p].position.substract(t[p].lastPosition)),
        (t[p].velocity = t[p].velocity.divisionByScalar(l)),
        (t[p].velocity = t[p].velocity.multiplyByScaler(t[p].mobility))),
      (t[p].force = new CubismVector2(0, 0)),
      (t[p].lastGravity = new CubismVector2(m.x, m.y)));
}
function $le(t, e, n, r, i, s) {
  let o = new CubismVector2(0, 0);
  t[0].position = new CubismVector2(n.x, n.y);
  const a = CubismMath.degreesToRadian(r),
    l = CubismMath.radianToDirection(a);
  l.normalize();
  for (let c = 1; c < e; ++c)
    ((t[c].force = l.multiplyByScaler(t[c].acceleration).add(i)),
      (t[c].lastPosition = new CubismVector2(t[c].position.x, t[c].position.y)),
      (t[c].velocity = new CubismVector2(0, 0)),
      (o = t[c].force),
      o.normalize(),
      (o = o.multiplyByScaler(t[c].radius)),
      (t[c].position = t[c - 1].position.add(o)),
      CubismMath.abs(t[c].position.x) < s && (t[c].position.x = 0),
      (t[c].force = new CubismVector2(0, 0)),
      (t[c].lastGravity = new CubismVector2(l.x, l.y)));
}
function sw(t, e, n, r, i) {
  let s;
  const o = i.getScale(i.translationScale, i.angleScale);
  ((s = r * o),
    s < e
      ? (s < i.valueBelowMinimum && (i.valueBelowMinimum = s), (s = e))
      : s > n &&
        (s > i.valueExceededMaximum && (i.valueExceededMaximum = s), (s = n)));
  const a = i.weight / LT;
  (a >= 1 || (s = t[0] * (1 - a) + s * a), (t[0] = s));
}
function QC(t, e, n, r, i, s, o, a) {
  let l = 0;
  const c = CubismMath.max(n, e);
  c < t && (t = c);
  const u = CubismMath.min(n, e);
  u > t && (t = u);
  const d = CubismMath.min(i, s),
    f = CubismMath.max(i, s),
    h = o,
    _ = Gle(u, c),
    m = t - _;
  switch (Dle(m)) {
    case 1: {
      const p = f - h,
        v = c - _;
      v != 0 && ((l = m * (p / v)), (l += h));
      break;
    }
    case -1: {
      const p = d - h,
        v = u - _;
      v != 0 && ((l = m * (p / v)), (l += h));
      break;
    }
    case 0: {
      l = h;
      break;
    }
  }
  return a ? l : l * -1;
}
var I5;
((t) => {
  ((t.CubismPhysics = CubismPhysics), (t.Options = K8));
})(I5 || (I5 = {}));
const ow = 4,
  qle = 36,
  Xle = 32;
class Kle {
  constructor(e) {
    ((this._renderTextureCount = 0),
      (this._clippingMaskBufferSize = 256),
      (this._clippingContextListForMask = new csmVector()),
      (this._clippingContextListForDraw = new csmVector()),
      (this._channelColors = new csmVector()),
      (this._tmpBoundsOnModel = new csmRect()),
      (this._tmpMatrix = new CubismMatrix44()),
      (this._tmpMatrixForMask = new CubismMatrix44()),
      (this._tmpMatrixForDraw = new CubismMatrix44()),
      (this._clippingContexttConstructor = e));
    let n = new CubismTextureColor();
    ((n.r = 1),
      (n.g = 0),
      (n.b = 0),
      (n.a = 0),
      this._channelColors.pushBack(n),
      (n = new CubismTextureColor()),
      (n.r = 0),
      (n.g = 1),
      (n.b = 0),
      (n.a = 0),
      this._channelColors.pushBack(n),
      (n = new CubismTextureColor()),
      (n.r = 0),
      (n.g = 0),
      (n.b = 1),
      (n.a = 0),
      this._channelColors.pushBack(n),
      (n = new CubismTextureColor()),
      (n.r = 0),
      (n.g = 0),
      (n.b = 0),
      (n.a = 1),
      this._channelColors.pushBack(n));
  }
  release() {
    for (let e = 0; e < this._clippingContextListForMask.getSize(); e++)
      (this._clippingContextListForMask.at(e) &&
        (this._clippingContextListForMask.at(e).release(),
        this._clippingContextListForMask.set(e, void 0)),
        this._clippingContextListForMask.set(e, null));
    this._clippingContextListForMask = null;
    for (let e = 0; e < this._clippingContextListForDraw.getSize(); e++)
      this._clippingContextListForDraw.set(e, null);
    this._clippingContextListForDraw = null;
    for (let e = 0; e < this._channelColors.getSize(); e++)
      this._channelColors.set(e, null);
    ((this._channelColors = null),
      this._clearedFrameBufferFlags != null &&
        this._clearedFrameBufferFlags.clear(),
      (this._clearedFrameBufferFlags = null));
  }
  initialize(e, n) {
    (n % 1 != 0 &&
      (Yt(
        "The number of render textures must be specified as an integer. The decimal point is rounded down and corrected to an integer.",
      ),
      (n = ~~n)),
      n < 1 &&
        Yt(
          "The number of render textures must be an integer greater than or equal to 1. Set the number of render textures to 1.",
        ),
      (this._renderTextureCount = n < 1 ? 1 : n),
      (this._clearedFrameBufferFlags = new csmVector(
        this._renderTextureCount,
      )));
    for (let r = 0; r < e.getDrawableCount(); r++) {
      if (e.getDrawableMaskCounts()[r] <= 0) {
        this._clippingContextListForDraw.pushBack(null);
        continue;
      }
      let i = this.findSameClip(
        e.getDrawableMasks()[r],
        e.getDrawableMaskCounts()[r],
      );
      (i == null &&
        ((i = new this._clippingContexttConstructor(
          this,
          e.getDrawableMasks()[r],
          e.getDrawableMaskCounts()[r],
        )),
        this._clippingContextListForMask.pushBack(i)),
        i.addClippedDrawable(r),
        this._clippingContextListForDraw.pushBack(i));
    }
  }
  findSameClip(e, n) {
    for (let r = 0; r < this._clippingContextListForMask.getSize(); r++) {
      const i = this._clippingContextListForMask.at(r),
        s = i._clippingIdCount;
      if (s != n) continue;
      let o = 0;
      for (let a = 0; a < s; a++) {
        const l = i._clippingIdList[a];
        for (let c = 0; c < s; c++)
          if (e[c] == l) {
            o++;
            break;
          }
      }
      if (o == s) return i;
    }
    return null;
  }
  setupMatrixForHighPrecision(e, n) {
    let r = 0;
    for (let i = 0; i < this._clippingContextListForMask.getSize(); i++) {
      const s = this._clippingContextListForMask.at(i);
      (this.calcClippedDrawTotalBounds(e, s), s._isUsing && r++);
    }
    if (r > 0) {
      if (
        (this.setupLayoutBounds(0),
        this._clearedFrameBufferFlags.getSize() != this._renderTextureCount)
      ) {
        this._clearedFrameBufferFlags.clear();
        for (let i = 0; i < this._renderTextureCount; i++)
          this._clearedFrameBufferFlags.pushBack(!1);
      } else
        for (let i = 0; i < this._renderTextureCount; i++)
          this._clearedFrameBufferFlags.set(i, !1);
      for (let i = 0; i < this._clippingContextListForMask.getSize(); i++) {
        const s = this._clippingContextListForMask.at(i),
          o = s._allClippedDrawRect,
          a = s._layoutBounds,
          l = 0.05;
        let c = 0,
          u = 0;
        const d = e.getPixelsPerUnit(),
          f = s.getClippingManager().getClippingMaskBufferSize(),
          h = a.width * f,
          _ = a.height * f;
        (this._tmpBoundsOnModel.setRect(o),
          this._tmpBoundsOnModel.width * d > h
            ? (this._tmpBoundsOnModel.expand(o.width * l, 0),
              (c = a.width / this._tmpBoundsOnModel.width))
            : (c = d / h),
          this._tmpBoundsOnModel.height * d > _
            ? (this._tmpBoundsOnModel.expand(0, o.height * l),
              (u = a.height / this._tmpBoundsOnModel.height))
            : (u = d / _),
          this.createMatrixForMask(n, a, c, u),
          s._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray()),
          s._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray()));
      }
    }
  }
  createMatrixForMask(e, n, r, i) {
    (this._tmpMatrix.loadIdentity(),
      this._tmpMatrix.translateRelative(-1, -1),
      this._tmpMatrix.scaleRelative(2, 2),
      this._tmpMatrix.translateRelative(n.x, n.y),
      this._tmpMatrix.scaleRelative(r, i),
      this._tmpMatrix.translateRelative(
        -this._tmpBoundsOnModel.x,
        -this._tmpBoundsOnModel.y,
      ),
      this._tmpMatrixForMask.setMatrix(this._tmpMatrix.getArray()),
      this._tmpMatrix.loadIdentity(),
      this._tmpMatrix.translateRelative(n.x, n.y * (e ? -1 : 1)),
      this._tmpMatrix.scaleRelative(r, i * (e ? -1 : 1)),
      this._tmpMatrix.translateRelative(
        -this._tmpBoundsOnModel.x,
        -this._tmpBoundsOnModel.y,
      ),
      this._tmpMatrixForDraw.setMatrix(this._tmpMatrix.getArray()));
  }
  setupLayoutBounds(e) {
    const n =
      this._renderTextureCount <= 1 ? qle : Xle * this._renderTextureCount;
    if (e <= 0 || e > n) {
      e > n &&
        Wn(
          `not supported mask count : {0}
[Details] render texture count : {1}, mask count : {2}`,
          e - n,
          this._renderTextureCount,
          e,
        );
      for (let c = 0; c < this._clippingContextListForMask.getSize(); c++) {
        const u = this._clippingContextListForMask.at(c);
        ((u._layoutChannelIndex = 0),
          (u._layoutBounds.x = 0),
          (u._layoutBounds.y = 0),
          (u._layoutBounds.width = 1),
          (u._layoutBounds.height = 1),
          (u._bufferIndex = 0));
      }
      return;
    }
    const r = this._renderTextureCount <= 1 ? 9 : 8;
    let i = e / this._renderTextureCount;
    const s = e % this._renderTextureCount;
    i = Math.ceil(i);
    let o = i / ow;
    const a = i % ow;
    o = ~~o;
    let l = 0;
    for (let c = 0; c < this._renderTextureCount; c++)
      for (let u = 0; u < ow; u++) {
        let d = o + (u < a ? 1 : 0);
        const f = a + (o < 1 ? -1 : 0);
        if ((u == f && s > 0 && (d -= c < s ? 0 : 1), d != 0))
          if (d == 1) {
            const h = this._clippingContextListForMask.at(l++);
            ((h._layoutChannelIndex = u),
              (h._layoutBounds.x = 0),
              (h._layoutBounds.y = 0),
              (h._layoutBounds.width = 1),
              (h._layoutBounds.height = 1),
              (h._bufferIndex = c));
          } else if (d == 2)
            for (let h = 0; h < d; h++) {
              let _ = h % 2;
              _ = ~~_;
              const m = this._clippingContextListForMask.at(l++);
              ((m._layoutChannelIndex = u),
                (m._layoutBounds.x = _ * 0.5),
                (m._layoutBounds.y = 0),
                (m._layoutBounds.width = 0.5),
                (m._layoutBounds.height = 1),
                (m._bufferIndex = c));
            }
          else if (d <= 4)
            for (let h = 0; h < d; h++) {
              let _ = h % 2,
                m = h / 2;
              ((_ = ~~_), (m = ~~m));
              const p = this._clippingContextListForMask.at(l++);
              ((p._layoutChannelIndex = u),
                (p._layoutBounds.x = _ * 0.5),
                (p._layoutBounds.y = m * 0.5),
                (p._layoutBounds.width = 0.5),
                (p._layoutBounds.height = 0.5),
                (p._bufferIndex = c));
            }
          else if (d <= r)
            for (let h = 0; h < d; h++) {
              let _ = h % 3,
                m = h / 3;
              ((_ = ~~_), (m = ~~m));
              const p = this._clippingContextListForMask.at(l++);
              ((p._layoutChannelIndex = u),
                (p._layoutBounds.x = _ / 3),
                (p._layoutBounds.y = m / 3),
                (p._layoutBounds.width = 1 / 3),
                (p._layoutBounds.height = 1 / 3),
                (p._bufferIndex = c));
            }
          else {
            Wn(
              `not supported mask count : {0}
[Details] render texture count : {1}, mask count : {2}`,
              e - n,
              this._renderTextureCount,
              e,
            );
            for (let h = 0; h < d; h++) {
              const _ = this._clippingContextListForMask.at(l++);
              ((_._layoutChannelIndex = 0),
                (_._layoutBounds.x = 0),
                (_._layoutBounds.y = 0),
                (_._layoutBounds.width = 1),
                (_._layoutBounds.height = 1),
                (_._bufferIndex = 0));
            }
          }
      }
  }
  calcClippedDrawTotalBounds(e, n) {
    let r = Number.MAX_VALUE,
      i = Number.MAX_VALUE,
      s = Number.MIN_VALUE,
      o = Number.MIN_VALUE;
    const a = n._clippedDrawableIndexList.length;
    for (let l = 0; l < a; l++) {
      const c = n._clippedDrawableIndexList[l],
        u = e.getDrawableVertexCount(c),
        d = e.getDrawableVertices(c);
      let f = Number.MAX_VALUE,
        h = Number.MAX_VALUE,
        _ = -Number.MAX_VALUE,
        m = -Number.MAX_VALUE;
      const p = u * Gr.vertexStep;
      for (let v = Gr.vertexOffset; v < p; v += Gr.vertexStep) {
        const y = d[v],
          x = d[v + 1];
        (y < f && (f = y),
          y > _ && (_ = y),
          x < h && (h = x),
          x > m && (m = x));
      }
      if (f != Number.MAX_VALUE)
        if (
          (f < r && (r = f),
          h < i && (i = h),
          _ > s && (s = _),
          m > o && (o = m),
          r == Number.MAX_VALUE)
        )
          ((n._allClippedDrawRect.x = 0),
            (n._allClippedDrawRect.y = 0),
            (n._allClippedDrawRect.width = 0),
            (n._allClippedDrawRect.height = 0),
            (n._isUsing = !1));
        else {
          n._isUsing = !0;
          const v = s - r,
            y = o - i;
          ((n._allClippedDrawRect.x = r),
            (n._allClippedDrawRect.y = i),
            (n._allClippedDrawRect.width = v),
            (n._allClippedDrawRect.height = y));
        }
    }
  }
  getClippingContextListForDraw() {
    return this._clippingContextListForDraw;
  }
  getClippingMaskBufferSize() {
    return this._clippingMaskBufferSize;
  }
  getRenderTextureCount() {
    return this._renderTextureCount;
  }
  getChannelFlagAsColor(e) {
    return this._channelColors.at(e);
  }
  setClippingMaskBufferSize(e) {
    this._clippingMaskBufferSize = e;
  }
  _clearedFrameBufferFlags;
  _channelColors;
  _clippingContextListForMask;
  _clippingContextListForDraw;
  _clippingMaskBufferSize;
  _renderTextureCount;
  _tmpMatrix;
  _tmpMatrixForMask;
  _tmpMatrixForDraw;
  _tmpBoundsOnModel;
  _clippingContexttConstructor;
}
let Va, P_;
class CubismClippingManager_WebGL extends Kle {
  getMaskRenderTexture() {
    if (this._maskTexture && this._maskTexture.textures != null)
      this._maskTexture.frameNo = this._currentFrameNo;
    else {
      (this._maskRenderTextures != null && this._maskRenderTextures.clear(),
        (this._maskRenderTextures = new csmVector()),
        this._maskColorBuffers != null && this._maskColorBuffers.clear(),
        (this._maskColorBuffers = new csmVector()));
      const e = this._clippingMaskBufferSize;
      for (let n = 0; n < this._renderTextureCount; n++)
        (this._maskColorBuffers.pushBack(this.gl.createTexture()),
          this.gl.bindTexture(this.gl.TEXTURE_2D, this._maskColorBuffers.at(n)),
          this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            e,
            e,
            0,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            null,
          ),
          this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_S,
            this.gl.CLAMP_TO_EDGE,
          ),
          this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_T,
            this.gl.CLAMP_TO_EDGE,
          ),
          this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MIN_FILTER,
            this.gl.LINEAR,
          ),
          this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MAG_FILTER,
            this.gl.LINEAR,
          ),
          this.gl.bindTexture(this.gl.TEXTURE_2D, null),
          this._maskRenderTextures.pushBack(this.gl.createFramebuffer()),
          this.gl.bindFramebuffer(
            this.gl.FRAMEBUFFER,
            this._maskRenderTextures.at(n),
          ),
          this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            this._maskColorBuffers.at(n),
            0,
          ));
      (this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, P_),
        (this._maskTexture = new CubismRenderTextureResource(
          this._currentFrameNo,
          this._maskRenderTextures,
        )));
    }
    return this._maskTexture.textures;
  }
  setGL(e) {
    this.gl = e;
  }
  constructor() {
    super(CubismClippingContext);
  }
  setupClippingContext(e, n) {
    this._currentFrameNo++;
    let r = 0;
    for (let i = 0; i < this._clippingContextListForMask.getSize(); i++) {
      const s = this._clippingContextListForMask.at(i);
      (this.calcClippedDrawTotalBounds(e, s), s._isUsing && r++);
    }
    if (r > 0) {
      (this.gl.viewport(
        0,
        0,
        this._clippingMaskBufferSize,
        this._clippingMaskBufferSize,
      ),
        (this._currentMaskRenderTexture = this.getMaskRenderTexture().at(0)),
        n.preDraw(),
        this.setupLayoutBounds(r),
        this.gl.bindFramebuffer(
          this.gl.FRAMEBUFFER,
          this._currentMaskRenderTexture,
        ),
        this._clearedFrameBufferFlags.getSize() != this._renderTextureCount &&
          (this._clearedFrameBufferFlags.clear(),
          (this._clearedFrameBufferFlags = new csmVector(
            this._renderTextureCount,
          ))));
      for (let i = 0; i < this._clearedFrameBufferFlags.getSize(); i++)
        this._clearedFrameBufferFlags.set(i, !1);
      for (let i = 0; i < this._clippingContextListForMask.getSize(); i++) {
        const s = this._clippingContextListForMask.at(i),
          o = s._allClippedDrawRect,
          a = s._layoutBounds,
          l = 0.05;
        let c = 0,
          u = 0;
        const d = this.getMaskRenderTexture().at(s._bufferIndex);
        (this._currentMaskRenderTexture != d &&
          ((this._currentMaskRenderTexture = d),
          n.preDraw(),
          this.gl.bindFramebuffer(
            this.gl.FRAMEBUFFER,
            this._currentMaskRenderTexture,
          )),
          this._tmpBoundsOnModel.setRect(o),
          this._tmpBoundsOnModel.expand(o.width * l, o.height * l),
          (c = a.width / this._tmpBoundsOnModel.width),
          (u = a.height / this._tmpBoundsOnModel.height),
          this._tmpMatrix.loadIdentity(),
          this._tmpMatrix.translateRelative(-1, -1),
          this._tmpMatrix.scaleRelative(2, 2),
          this._tmpMatrix.translateRelative(a.x, a.y),
          this._tmpMatrix.scaleRelative(c, u),
          this._tmpMatrix.translateRelative(
            -this._tmpBoundsOnModel.x,
            -this._tmpBoundsOnModel.y,
          ),
          this._tmpMatrixForMask.setMatrix(this._tmpMatrix.getArray()),
          this._tmpMatrix.loadIdentity(),
          this._tmpMatrix.translateRelative(a.x, a.y),
          this._tmpMatrix.scaleRelative(c, u),
          this._tmpMatrix.translateRelative(
            -this._tmpBoundsOnModel.x,
            -this._tmpBoundsOnModel.y,
          ),
          this._tmpMatrixForDraw.setMatrix(this._tmpMatrix.getArray()),
          s._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray()),
          s._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray()));
        const f = s._clippingIdCount;
        for (let h = 0; h < f; h++) {
          const _ = s._clippingIdList[h];
          e.getDrawableDynamicFlagVertexPositionsDidChange(_) &&
            (n.setIsCulling(e.getDrawableCulling(_) != !1),
            this._clearedFrameBufferFlags.at(s._bufferIndex) ||
              (this.gl.clearColor(1, 1, 1, 1),
              this.gl.clear(this.gl.COLOR_BUFFER_BIT),
              this._clearedFrameBufferFlags.set(s._bufferIndex, !0)),
            n.setClippingContextBufferForMask(s),
            n.drawMeshWebGL(e, _));
        }
      }
      (this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, P_),
        n.setClippingContextBufferForMask(null),
        this.gl.viewport(Va[0], Va[1], Va[2], Va[3]));
    }
  }
  getColorBuffer() {
    return this._maskColorBuffers;
  }
  getClippingMaskCount() {
    return this._clippingContextListForMask.getSize();
  }
  _currentMaskRenderTexture;
  _maskRenderTextures;
  _maskColorBuffers;
  _currentFrameNo;
  _maskTexture;
  gl;
}
class CubismRenderTextureResource {
  constructor(e, n) {
    ((this.frameNo = e), (this.textures = n));
  }
  frameNo;
  textures;
}
class CubismClippingContext extends mae {
  constructor(e, n, r) {
    (super(n, r), (this._owner = e));
  }
  getClippingManager() {
    return this._owner;
  }
  setGl(e) {
    this._owner.setGL(e);
  }
  _owner;
}
class Yle {
  setGlEnable(e, n) {
    n ? this.gl.enable(e) : this.gl.disable(e);
  }
  setGlEnableVertexAttribArray(e, n) {
    n
      ? this.gl.enableVertexAttribArray(e)
      : this.gl.disableVertexAttribArray(e);
  }
  save() {
    if (this.gl == null) {
      Wn(`'gl' is null. WebGLRenderingContext is required.
Please call 'CubimRenderer_WebGL.startUp' function.`);
      return;
    }
    ((this._lastArrayBufferBinding = this.gl.getParameter(
      this.gl.ARRAY_BUFFER_BINDING,
    )),
      (this._lastElementArrayBufferBinding = this.gl.getParameter(
        this.gl.ELEMENT_ARRAY_BUFFER_BINDING,
      )),
      (this._lastProgram = this.gl.getParameter(this.gl.CURRENT_PROGRAM)),
      (this._lastActiveTexture = this.gl.getParameter(this.gl.ACTIVE_TEXTURE)),
      this.gl.activeTexture(this.gl.TEXTURE1),
      (this._lastTexture1Binding2D = this.gl.getParameter(
        this.gl.TEXTURE_BINDING_2D,
      )),
      this.gl.activeTexture(this.gl.TEXTURE0),
      (this._lastTexture0Binding2D = this.gl.getParameter(
        this.gl.TEXTURE_BINDING_2D,
      )),
      (this._lastVertexAttribArrayEnabled[0] = this.gl.getVertexAttrib(
        0,
        this.gl.VERTEX_ATTRIB_ARRAY_ENABLED,
      )),
      (this._lastVertexAttribArrayEnabled[1] = this.gl.getVertexAttrib(
        1,
        this.gl.VERTEX_ATTRIB_ARRAY_ENABLED,
      )),
      (this._lastVertexAttribArrayEnabled[2] = this.gl.getVertexAttrib(
        2,
        this.gl.VERTEX_ATTRIB_ARRAY_ENABLED,
      )),
      (this._lastVertexAttribArrayEnabled[3] = this.gl.getVertexAttrib(
        3,
        this.gl.VERTEX_ATTRIB_ARRAY_ENABLED,
      )),
      (this._lastScissorTest = this.gl.isEnabled(this.gl.SCISSOR_TEST)),
      (this._lastStencilTest = this.gl.isEnabled(this.gl.STENCIL_TEST)),
      (this._lastDepthTest = this.gl.isEnabled(this.gl.DEPTH_TEST)),
      (this._lastCullFace = this.gl.isEnabled(this.gl.CULL_FACE)),
      (this._lastBlend = this.gl.isEnabled(this.gl.BLEND)),
      (this._lastFrontFace = this.gl.getParameter(this.gl.FRONT_FACE)),
      (this._lastColorMask = this.gl.getParameter(this.gl.COLOR_WRITEMASK)),
      (this._lastBlending[0] = this.gl.getParameter(this.gl.BLEND_SRC_RGB)),
      (this._lastBlending[1] = this.gl.getParameter(this.gl.BLEND_DST_RGB)),
      (this._lastBlending[2] = this.gl.getParameter(this.gl.BLEND_SRC_ALPHA)),
      (this._lastBlending[3] = this.gl.getParameter(this.gl.BLEND_DST_ALPHA)),
      (this._lastFBO = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING)),
      (this._lastViewport = this.gl.getParameter(this.gl.VIEWPORT)));
  }
  restore() {
    if (this.gl == null) {
      Wn(`'gl' is null. WebGLRenderingContext is required.
Please call 'CubimRenderer_WebGL.startUp' function.`);
      return;
    }
    (this.gl.useProgram(this._lastProgram),
      this.setGlEnableVertexAttribArray(
        0,
        this._lastVertexAttribArrayEnabled[0],
      ),
      this.setGlEnableVertexAttribArray(
        1,
        this._lastVertexAttribArrayEnabled[1],
      ),
      this.setGlEnableVertexAttribArray(
        2,
        this._lastVertexAttribArrayEnabled[2],
      ),
      this.setGlEnableVertexAttribArray(
        3,
        this._lastVertexAttribArrayEnabled[3],
      ),
      this.setGlEnable(this.gl.SCISSOR_TEST, this._lastScissorTest),
      this.setGlEnable(this.gl.STENCIL_TEST, this._lastStencilTest),
      this.setGlEnable(this.gl.DEPTH_TEST, this._lastDepthTest),
      this.setGlEnable(this.gl.CULL_FACE, this._lastCullFace),
      this.setGlEnable(this.gl.BLEND, this._lastBlend),
      this.gl.frontFace(this._lastFrontFace),
      this.gl.colorMask(
        this._lastColorMask[0],
        this._lastColorMask[1],
        this._lastColorMask[2],
        this._lastColorMask[3],
      ),
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._lastArrayBufferBinding),
      this.gl.bindBuffer(
        this.gl.ELEMENT_ARRAY_BUFFER,
        this._lastElementArrayBufferBinding,
      ),
      this.gl.activeTexture(this.gl.TEXTURE1),
      this.gl.bindTexture(this.gl.TEXTURE_2D, this._lastTexture1Binding2D),
      this.gl.activeTexture(this.gl.TEXTURE0),
      this.gl.bindTexture(this.gl.TEXTURE_2D, this._lastTexture0Binding2D),
      this.gl.activeTexture(this._lastActiveTexture),
      this.gl.blendFuncSeparate(
        this._lastBlending[0],
        this._lastBlending[1],
        this._lastBlending[2],
        this._lastBlending[3],
      ));
  }
  setGl(e) {
    this.gl = e;
  }
  constructor() {
    ((this._lastVertexAttribArrayEnabled = new Array(4)),
      (this._lastColorMask = new Array(4)),
      (this._lastBlending = new Array(4)),
      (this._lastViewport = new Array(4)));
  }
  _lastArrayBufferBinding;
  _lastElementArrayBufferBinding;
  _lastProgram;
  _lastActiveTexture;
  _lastTexture0Binding2D;
  _lastTexture1Binding2D;
  _lastVertexAttribArrayEnabled;
  _lastScissorTest;
  _lastBlend;
  _lastStencilTest;
  _lastDepthTest;
  _lastCullFace;
  _lastFrontFace;
  _lastColorMask;
  _lastBlending;
  _lastFBO;
  _lastViewport;
  gl;
}
class CubismRenderer_WebGL extends CubismRenderer {
  initialize(e, n = 1) {
    (e.isUsingMasking() &&
      ((this._clippingManager = new CubismClippingManager_WebGL()),
      this._clippingManager.initialize(e, n)),
      this._sortedDrawableIndexList.resize(e.getDrawableCount(), 0),
      super.initialize(e));
  }
  bindTexture(e, n) {
    this._textures.setValue(e, n);
  }
  getBindedTextures() {
    return this._textures;
  }
  setClippingMaskBufferSize(e) {
    if (!this._model.isUsingMasking()) return;
    const n = this._clippingManager.getRenderTextureCount();
    (this._clippingManager.release(),
      (this._clippingManager = void 0),
      (this._clippingManager = null),
      (this._clippingManager = new CubismClippingManager_WebGL()),
      this._clippingManager.setClippingMaskBufferSize(e),
      this._clippingManager.initialize(this.getModel(), n));
  }
  getClippingMaskBufferSize() {
    return this._model.isUsingMasking()
      ? this._clippingManager.getClippingMaskBufferSize()
      : -1;
  }
  getRenderTextureCount() {
    return this._model.isUsingMasking()
      ? this._clippingManager.getRenderTextureCount()
      : -1;
  }
  constructor() {
    (super(),
      (this._clippingContextBufferForMask = null),
      (this._clippingContextBufferForDraw = null),
      (this._rendererProfile = new Yle()),
      (this.firstDraw = !0),
      (this._textures = new csmMap()),
      (this._sortedDrawableIndexList = new csmVector()),
      (this._bufferData = {
        vertex: (WebGLBuffer = null),
        uv: (WebGLBuffer = null),
        index: (WebGLBuffer = null),
      }),
      this._textures.prepareCapacity(32, !0));
  }
  release() {
    (this._clippingManager &&
      (this._clippingManager.release(),
      (this._clippingManager = void 0),
      (this._clippingManager = null)),
      this.gl != null &&
        (this.gl.deleteBuffer(this._bufferData.vertex),
        (this._bufferData.vertex = null),
        this.gl.deleteBuffer(this._bufferData.uv),
        (this._bufferData.uv = null),
        this.gl.deleteBuffer(this._bufferData.index),
        (this._bufferData.index = null),
        (this._bufferData = null),
        (this._textures = null)));
  }
  doDrawModel() {
    if (this.gl == null) {
      Wn(`'gl' is null. WebGLRenderingContext is required.
Please call 'CubimRenderer_WebGL.startUp' function.`);
      return;
    }
    (this._clippingManager != null &&
      (this.preDraw(),
      this.isUsingHighPrecisionMask()
        ? this._clippingManager.setupMatrixForHighPrecision(this.getModel(), !1)
        : this._clippingManager.setupClippingContext(this.getModel(), this)),
      this.preDraw());
    const e = this.getModel().getDrawableCount(),
      n = this.getModel().getDrawableRenderOrders();
    for (let r = 0; r < e; ++r) {
      const i = n[r];
      this._sortedDrawableIndexList.set(i, r);
    }
    for (let r = 0; r < e; ++r) {
      const i = this._sortedDrawableIndexList.at(r);
      if (!this.getModel().getDrawableDynamicFlagIsVisible(i)) continue;
      const s =
        this._clippingManager != null
          ? this._clippingManager.getClippingContextListForDraw().at(i)
          : null;
      if (s != null && this.isUsingHighPrecisionMask()) {
        s._isUsing &&
          (this.gl.viewport(
            0,
            0,
            this._clippingManager.getClippingMaskBufferSize(),
            this._clippingManager.getClippingMaskBufferSize(),
          ),
          this.preDraw(),
          this.gl.bindFramebuffer(
            this.gl.FRAMEBUFFER,
            s.getClippingManager().getMaskRenderTexture().at(s._bufferIndex),
          ),
          this.gl.clearColor(1, 1, 1, 1),
          this.gl.clear(this.gl.COLOR_BUFFER_BIT));
        {
          const o = s._clippingIdCount;
          for (let a = 0; a < o; a++) {
            const l = s._clippingIdList[a];
            this._model.getDrawableDynamicFlagVertexPositionsDidChange(l) &&
              (this.setIsCulling(this._model.getDrawableCulling(l) != !1),
              this.setClippingContextBufferForMask(s),
              this.drawMeshWebGL(this._model, l));
          }
        }
        (this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, P_),
          this.setClippingContextBufferForMask(null),
          this.gl.viewport(Va[0], Va[1], Va[2], Va[3]),
          this.preDraw());
      }
      (this.setClippingContextBufferForDraw(s),
        this.setIsCulling(this.getModel().getDrawableCulling(i)),
        this.drawMeshWebGL(this._model, i));
    }
  }
  drawMeshWebGL(e, n) {
    (this.isCulling()
      ? this.gl.enable(this.gl.CULL_FACE)
      : this.gl.disable(this.gl.CULL_FACE),
      this.gl.frontFace(this.gl.CCW),
      this.isGeneratingMask()
        ? CubismShaderManager_WebGL.getInstance()
            .getShader(this.gl)
            .setupShaderProgramForMask(this, e, n)
        : CubismShaderManager_WebGL.getInstance()
            .getShader(this.gl)
            .setupShaderProgramForDraw(this, e, n));
    {
      const r = e.getDrawableVertexIndexCount(n);
      this.gl.drawElements(this.gl.TRIANGLES, r, this.gl.UNSIGNED_SHORT, 0);
    }
    (this.gl.useProgram(null),
      this.setClippingContextBufferForDraw(null),
      this.setClippingContextBufferForMask(null));
  }
  saveProfile() {
    this._rendererProfile.save();
  }
  restoreProfile() {
    this._rendererProfile.restore();
  }
  bindDrawableVertexBuffers(e, n, r, i) {
    (this._bufferData.vertex == null &&
      (this._bufferData.vertex = this.gl.createBuffer()),
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._bufferData.vertex),
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        e.getDrawableVertices(n),
        this.gl.DYNAMIC_DRAW,
      ),
      this.gl.enableVertexAttribArray(r),
      this.gl.vertexAttribPointer(r, 2, this.gl.FLOAT, !1, 0, 0),
      this._bufferData.uv == null &&
        (this._bufferData.uv = this.gl.createBuffer()),
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._bufferData.uv),
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        e.getDrawableVertexUvs(n),
        this.gl.DYNAMIC_DRAW,
      ),
      this.gl.enableVertexAttribArray(i),
      this.gl.vertexAttribPointer(i, 2, this.gl.FLOAT, !1, 0, 0));
  }
  bindDrawableIndexBuffer(e, n) {
    (this._bufferData.index == null &&
      (this._bufferData.index = this.gl.createBuffer()),
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this._bufferData.index),
      this.gl.bufferData(
        this.gl.ELEMENT_ARRAY_BUFFER,
        e.getDrawableVertexIndices(n),
        this.gl.DYNAMIC_DRAW,
      ));
  }
  static doStaticRelease() {
    CubismShaderManager_WebGL.deleteInstance();
  }
  setRenderState(e, n) {
    ((P_ = e), (Va = n));
  }
  preDraw() {
    if (
      (this.firstDraw && (this.firstDraw = !1),
      this.gl.disable(this.gl.SCISSOR_TEST),
      this.gl.disable(this.gl.STENCIL_TEST),
      this.gl.disable(this.gl.DEPTH_TEST),
      this.gl.frontFace(this.gl.CW),
      this.gl.enable(this.gl.BLEND),
      this.gl.colorMask(!0, !0, !0, !0),
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null),
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null),
      this.getAnisotropy() > 0 && this._extension)
    )
      for (let e = 0; e < this._textures.getSize(); ++e)
        (this.gl.bindTexture(this.gl.TEXTURE_2D, this._textures.getValue(e)),
          this.gl.texParameterf(
            this.gl.TEXTURE_2D,
            this._extension.TEXTURE_MAX_ANISOTROPY_EXT,
            this.getAnisotropy(),
          ));
  }
  setClippingContextBufferForMask(e) {
    this._clippingContextBufferForMask = e;
  }
  getClippingContextBufferForMask() {
    return this._clippingContextBufferForMask;
  }
  setClippingContextBufferForDraw(e) {
    this._clippingContextBufferForDraw = e;
  }
  getClippingContextBufferForDraw() {
    return this._clippingContextBufferForDraw;
  }
  isGeneratingMask() {
    return this.getClippingContextBufferForMask() != null;
  }
  startUp(e) {
    ((this.gl = e),
      this._clippingManager && this._clippingManager.setGL(e),
      CubismShaderManager_WebGL.getInstance().setGlContext(e),
      this._rendererProfile.setGl(e),
      (this._extension =
        this.gl.getExtension("EXT_texture_filter_anisotropic") ||
        this.gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") ||
        this.gl.getExtension("MOZ_EXT_texture_filter_anisotropic")));
  }
  _textures;
  _sortedDrawableIndexList;
  _clippingManager;
  _clippingContextBufferForMask;
  _clippingContextBufferForDraw;
  _rendererProfile;
  firstDraw;
  _bufferData;
  _extension;
  gl;
}
CubismRenderer.staticRelease = () => {
  CubismRenderer_WebGL.doStaticRelease();
};
var k5;
((t) => {
  ((t.CubismClippingContext = CubismClippingContext),
    (t.CubismClippingManager_WebGL = CubismClippingManager_WebGL),
    (t.CubismRenderTextureResource = CubismRenderTextureResource),
    (t.CubismRenderer_WebGL = CubismRenderer_WebGL));
})(k5 || (k5 = {}));
class Zle {
  constructor(e = !1, n = !1) {
    ((this.isOverridden = e), (this.isParameterRepeated = n));
  }
  isOverridden;
  isParameterRepeated;
}
class D5 {
  constructor(e = !1, n = new CubismTextureColor()) {
    ((this.isOverridden = e), (this.color = n));
  }
  isOverridden;
  color;
  get isOverwritten() {
    return this.isOverridden;
  }
}
class L5 {
  constructor(e = !1, n = new CubismTextureColor()) {
    ((this.isOverridden = e), (this.color = n));
  }
  isOverridden;
  color;
  get isOverwritten() {
    return this.isOverridden;
  }
}
class Jle {
  constructor(e = !1, n = !1) {
    ((this.isOverridden = e), (this.isCulling = n));
  }
  isOverridden;
  isCulling;
  get isOverwritten() {
    return this.isOverridden;
  }
}
class CubismModel {
  update() {
    (this._model.update(), this._model.drawables.resetDynamicFlags());
  }
  getPixelsPerUnit() {
    return this._model == null ? 0 : this._model.canvasinfo.PixelsPerUnit;
  }
  getCanvasWidth() {
    return this._model == null
      ? 0
      : this._model.canvasinfo.CanvasWidth /
          this._model.canvasinfo.PixelsPerUnit;
  }
  getCanvasHeight() {
    return this._model == null
      ? 0
      : this._model.canvasinfo.CanvasHeight /
          this._model.canvasinfo.PixelsPerUnit;
  }
  saveParameters() {
    const e = this._model.parameters.count,
      n = this._savedParameters.getSize();
    for (let r = 0; r < e; ++r)
      r < n
        ? this._savedParameters.set(r, this._parameterValues[r])
        : this._savedParameters.pushBack(this._parameterValues[r]);
  }
  getMultiplyColor(e) {
    return this.getOverrideFlagForModelMultiplyColors() ||
      this.getOverrideFlagForDrawableMultiplyColors(e)
      ? this._userMultiplyColors.at(e).color
      : this.getDrawableMultiplyColor(e);
  }
  getScreenColor(e) {
    return this.getOverrideFlagForModelScreenColors() ||
      this.getOverrideFlagForDrawableScreenColors(e)
      ? this._userScreenColors.at(e).color
      : this.getDrawableScreenColor(e);
  }
  setMultiplyColorByTextureColor(e, n) {
    this.setMultiplyColorByRGBA(e, n.r, n.g, n.b, n.a);
  }
  setMultiplyColorByRGBA(e, n, r, i, s = 1) {
    ((this._userMultiplyColors.at(e).color.r = n),
      (this._userMultiplyColors.at(e).color.g = r),
      (this._userMultiplyColors.at(e).color.b = i),
      (this._userMultiplyColors.at(e).color.a = s));
  }
  setScreenColorByTextureColor(e, n) {
    this.setScreenColorByRGBA(e, n.r, n.g, n.b, n.a);
  }
  setScreenColorByRGBA(e, n, r, i, s = 1) {
    ((this._userScreenColors.at(e).color.r = n),
      (this._userScreenColors.at(e).color.g = r),
      (this._userScreenColors.at(e).color.b = i),
      (this._userScreenColors.at(e).color.a = s));
  }
  getPartMultiplyColor(e) {
    return this._userPartMultiplyColors.at(e).color;
  }
  getPartScreenColor(e) {
    return this._userPartScreenColors.at(e).color;
  }
  setPartColor(e, n, r, i, s, o, a) {
    if (
      ((o.at(e).color.r = n),
      (o.at(e).color.g = r),
      (o.at(e).color.b = i),
      (o.at(e).color.a = s),
      o.at(e).isOverridden)
    )
      for (let l = 0; l < this._partChildDrawables.at(e).getSize(); ++l) {
        const c = this._partChildDrawables.at(e).at(l);
        ((a.at(c).color.r = n),
          (a.at(c).color.g = r),
          (a.at(c).color.b = i),
          (a.at(c).color.a = s));
      }
  }
  setPartMultiplyColorByTextureColor(e, n) {
    this.setPartMultiplyColorByRGBA(e, n.r, n.g, n.b, n.a);
  }
  setPartMultiplyColorByRGBA(e, n, r, i, s) {
    this.setPartColor(
      e,
      n,
      r,
      i,
      s,
      this._userPartMultiplyColors,
      this._userMultiplyColors,
    );
  }
  setPartScreenColorByTextureColor(e, n) {
    this.setPartScreenColorByRGBA(e, n.r, n.g, n.b, n.a);
  }
  setPartScreenColorByRGBA(e, n, r, i, s) {
    this.setPartColor(
      e,
      n,
      r,
      i,
      s,
      this._userPartScreenColors,
      this._userScreenColors,
    );
  }
  getOverrideFlagForModelParameterRepeat() {
    return this._isOverriddenParameterRepeat;
  }
  setOverrideFlagForModelParameterRepeat(e) {
    this._isOverriddenParameterRepeat = e;
  }
  getOverrideFlagForParameterRepeat(e) {
    return this._userParameterRepeatDataList.at(e).isOverridden;
  }
  setOverrideFlagForParameterRepeat(e, n) {
    this._userParameterRepeatDataList.at(e).isOverridden = n;
  }
  getRepeatFlagForParameterRepeat(e) {
    return this._userParameterRepeatDataList.at(e).isParameterRepeated;
  }
  setRepeatFlagForParameterRepeat(e, n) {
    this._userParameterRepeatDataList.at(e).isParameterRepeated = n;
  }
  getOverwriteFlagForModelMultiplyColors() {
    return (
      Yt(
        "getOverwriteFlagForModelMultiplyColors() is a deprecated function. Please use getOverrideFlagForModelMultiplyColors().",
      ),
      this.getOverrideFlagForModelMultiplyColors()
    );
  }
  getOverrideFlagForModelMultiplyColors() {
    return this._isOverriddenModelMultiplyColors;
  }
  getOverwriteFlagForModelScreenColors() {
    return (
      Yt(
        "getOverwriteFlagForModelScreenColors() is a deprecated function. Please use getOverrideFlagForModelScreenColors().",
      ),
      this.getOverrideFlagForModelScreenColors()
    );
  }
  getOverrideFlagForModelScreenColors() {
    return this._isOverriddenModelScreenColors;
  }
  setOverwriteFlagForModelMultiplyColors(e) {
    (Yt(
      "setOverwriteFlagForModelMultiplyColors(value: boolean) is a deprecated function. Please use setOverrideFlagForModelMultiplyColors(value: boolean).",
    ),
      this.setOverrideFlagForModelMultiplyColors(e));
  }
  setOverrideFlagForModelMultiplyColors(e) {
    this._isOverriddenModelMultiplyColors = e;
  }
  setOverwriteFlagForModelScreenColors(e) {
    (Yt(
      "setOverwriteFlagForModelScreenColors(value: boolean) is a deprecated function. Please use setOverrideFlagForModelScreenColors(value: boolean).",
    ),
      this.setOverrideFlagForModelScreenColors(e));
  }
  setOverrideFlagForModelScreenColors(e) {
    this._isOverriddenModelScreenColors = e;
  }
  getOverwriteFlagForDrawableMultiplyColors(e) {
    return (
      Yt(
        "getOverwriteFlagForDrawableMultiplyColors(drawableindex: number) is a deprecated function. Please use getOverrideFlagForDrawableMultiplyColors(drawableindex: number).",
      ),
      this.getOverrideFlagForDrawableMultiplyColors(e)
    );
  }
  getOverrideFlagForDrawableMultiplyColors(e) {
    return this._userMultiplyColors.at(e).isOverridden;
  }
  getOverwriteFlagForDrawableScreenColors(e) {
    return (
      Yt(
        "getOverwriteFlagForDrawableScreenColors(drawableindex: number) is a deprecated function. Please use getOverrideFlagForDrawableScreenColors(drawableindex: number).",
      ),
      this.getOverrideFlagForDrawableScreenColors(e)
    );
  }
  getOverrideFlagForDrawableScreenColors(e) {
    return this._userScreenColors.at(e).isOverridden;
  }
  setOverwriteFlagForDrawableMultiplyColors(e, n) {
    (Yt(
      "setOverwriteFlagForDrawableMultiplyColors(drawableindex: number, value: boolean) is a deprecated function. Please use setOverrideFlagForDrawableMultiplyColors(drawableindex: number, value: boolean).",
    ),
      this.setOverrideFlagForDrawableMultiplyColors(e, n));
  }
  setOverrideFlagForDrawableMultiplyColors(e, n) {
    this._userMultiplyColors.at(e).isOverridden = n;
  }
  setOverwriteFlagForDrawableScreenColors(e, n) {
    (Yt(
      "setOverwriteFlagForDrawableScreenColors(drawableindex: number, value: boolean) is a deprecated function. Please use setOverrideFlagForDrawableScreenColors(drawableindex: number, value: boolean).",
    ),
      this.setOverrideFlagForDrawableScreenColors(e, n));
  }
  setOverrideFlagForDrawableScreenColors(e, n) {
    this._userScreenColors.at(e).isOverridden = n;
  }
  getOverwriteColorForPartMultiplyColors(e) {
    return (
      Yt(
        "getOverwriteColorForPartMultiplyColors(partIndex: number) is a deprecated function. Please use getOverrideColorForPartMultiplyColors(partIndex: number).",
      ),
      this.getOverrideColorForPartMultiplyColors(e)
    );
  }
  getOverrideColorForPartMultiplyColors(e) {
    return this._userPartMultiplyColors.at(e).isOverridden;
  }
  getOverwriteColorForPartScreenColors(e) {
    return (
      Yt(
        "getOverwriteColorForPartScreenColors(partIndex: number) is a deprecated function. Please use getOverrideColorForPartScreenColors(partIndex: number).",
      ),
      this.getOverrideColorForPartScreenColors(e)
    );
  }
  getOverrideColorForPartScreenColors(e) {
    return this._userPartScreenColors.at(e).isOverridden;
  }
  setOverwriteColorForPartColors(e, n, r, i) {
    (Yt(
      "setOverwriteColorForPartColors(partIndex: number, value: boolean, partColors: csmVector<PartColorData>, drawableColors: csmVector<DrawableColorData>) is a deprecated function. Please use setOverrideColorForPartColors(partIndex: number, value: boolean, partColors: csmVector<PartColorData>, drawableColors: csmVector<DrawableColorData>).",
    ),
      this.setOverrideColorForPartColors(e, n, r, i));
  }
  setOverrideColorForPartColors(e, n, r, i) {
    r.at(e).isOverridden = n;
    for (let s = 0; s < this._partChildDrawables.at(e).getSize(); ++s) {
      const o = this._partChildDrawables.at(e).at(s);
      ((i.at(o).isOverridden = n),
        n &&
          ((i.at(o).color.r = r.at(e).color.r),
          (i.at(o).color.g = r.at(e).color.g),
          (i.at(o).color.b = r.at(e).color.b),
          (i.at(o).color.a = r.at(e).color.a)));
    }
  }
  setOverwriteColorForPartMultiplyColors(e, n) {
    (Yt(
      "setOverwriteColorForPartMultiplyColors(partIndex: number, value: boolean) is a deprecated function. Please use setOverrideColorForPartMultiplyColors(partIndex: number, value: boolean).",
    ),
      this.setOverrideColorForPartMultiplyColors(e, n));
  }
  setOverrideColorForPartMultiplyColors(e, n) {
    ((this._userPartMultiplyColors.at(e).isOverridden = n),
      this.setOverrideColorForPartColors(
        e,
        n,
        this._userPartMultiplyColors,
        this._userMultiplyColors,
      ));
  }
  setOverwriteColorForPartScreenColors(e, n) {
    (Yt(
      "setOverwriteColorForPartScreenColors(partIndex: number, value: boolean) is a deprecated function. Please use setOverrideColorForPartScreenColors(partIndex: number, value: boolean).",
    ),
      this.setOverrideColorForPartScreenColors(e, n));
  }
  setOverrideColorForPartScreenColors(e, n) {
    ((this._userPartScreenColors.at(e).isOverridden = n),
      this.setOverrideColorForPartColors(
        e,
        n,
        this._userPartScreenColors,
        this._userScreenColors,
      ));
  }
  getDrawableCulling(e) {
    if (
      this.getOverrideFlagForModelCullings() ||
      this.getOverrideFlagForDrawableCullings(e)
    )
      return this._userCullings.at(e).isCulling;
    const n = this._model.drawables.constantFlags;
    return !Live2DCubismCore.Utils.hasIsDoubleSidedBit(n[e]);
  }
  setDrawableCulling(e, n) {
    this._userCullings.at(e).isCulling = n;
  }
  getOverwriteFlagForModelCullings() {
    return (
      Yt(
        "getOverwriteFlagForModelCullings() is a deprecated function. Please use getOverrideFlagForModelCullings().",
      ),
      this.getOverrideFlagForModelCullings()
    );
  }
  getOverrideFlagForModelCullings() {
    return this._isOverriddenCullings;
  }
  setOverwriteFlagForModelCullings(e) {
    (Yt(
      "setOverwriteFlagForModelCullings(isOverriddenCullings: boolean) is a deprecated function. Please use setOverrideFlagForModelCullings(isOverriddenCullings: boolean).",
    ),
      this.setOverrideFlagForModelCullings(e));
  }
  setOverrideFlagForModelCullings(e) {
    this._isOverriddenCullings = e;
  }
  getOverwriteFlagForDrawableCullings(e) {
    return (
      Yt(
        "getOverwriteFlagForDrawableCullings(drawableIndex: number) is a deprecated function. Please use getOverrideFlagForDrawableCullings(drawableIndex: number).",
      ),
      this.getOverrideFlagForDrawableCullings(e)
    );
  }
  getOverrideFlagForDrawableCullings(e) {
    return this._userCullings.at(e).isOverridden;
  }
  setOverwriteFlagForDrawableCullings(e, n) {
    (Yt(
      "setOverwriteFlagForDrawableCullings(drawableIndex: number, isOverriddenCullings: boolean) is a deprecated function. Please use setOverrideFlagForDrawableCullings(drawableIndex: number, isOverriddenCullings: boolean).",
    ),
      this.setOverrideFlagForDrawableCullings(e, n));
  }
  setOverrideFlagForDrawableCullings(e, n) {
    this._userCullings.at(e).isOverridden = n;
  }
  getModelOapcity() {
    return this._modelOpacity;
  }
  setModelOapcity(e) {
    this._modelOpacity = e;
  }
  getModel() {
    return this._model;
  }
  getPartIndex(e) {
    let n;
    const r = this._model.parts.count;
    for (n = 0; n < r; ++n) if (e == this._partIds.at(n)) return n;
    return this._notExistPartId.isExist(e)
      ? this._notExistPartId.getValue(e)
      : ((n = r + this._notExistPartId.getSize()),
        this._notExistPartId.setValue(e, n),
        this._notExistPartOpacities.appendKey(n),
        n);
  }
  getPartId(e) {
    const n = this._model.parts.ids[e];
    return CubismFramework.getIdManager().getId(n);
  }
  getPartCount() {
    return this._model.parts.count;
  }
  getPartParentPartIndices() {
    return this._model.parts.parentIndices;
  }
  setPartOpacityByIndex(e, n) {
    if (this._notExistPartOpacities.isExist(e)) {
      this._notExistPartOpacities.setValue(e, n);
      return;
    }
    (Si(0 <= e && e < this.getPartCount()), (this._partOpacities[e] = n));
  }
  setPartOpacityById(e, n) {
    const r = this.getPartIndex(e);
    r < 0 || this.setPartOpacityByIndex(r, n);
  }
  getPartOpacityByIndex(e) {
    return this._notExistPartOpacities.isExist(e)
      ? this._notExistPartOpacities.getValue(e)
      : (Si(0 <= e && e < this.getPartCount()), this._partOpacities[e]);
  }
  getPartOpacityById(e) {
    const n = this.getPartIndex(e);
    return n < 0 ? 0 : this.getPartOpacityByIndex(n);
  }
  getParameterIndex(e) {
    let n;
    const r = this._model.parameters.count;
    for (n = 0; n < r; ++n) if (e == this._parameterIds.at(n)) return n;
    return this._notExistParameterId.isExist(e)
      ? this._notExistParameterId.getValue(e)
      : ((n =
          this._model.parameters.count + this._notExistParameterId.getSize()),
        this._notExistParameterId.setValue(e, n),
        this._notExistParameterValues.appendKey(n),
        n);
  }
  getParameterCount() {
    return this._model.parameters.count;
  }
  getParameterType(e) {
    return this._model.parameters.types[e];
  }
  getParameterMaximumValue(e) {
    return this._model.parameters.maximumValues[e];
  }
  getParameterMinimumValue(e) {
    return this._model.parameters.minimumValues[e];
  }
  getParameterDefaultValue(e) {
    return this._model.parameters.defaultValues[e];
  }
  getParameterId(e) {
    return CubismFramework.getIdManager().getId(this._model.parameters.ids[e]);
  }
  getParameterValueByIndex(e) {
    return this._notExistParameterValues.isExist(e)
      ? this._notExistParameterValues.getValue(e)
      : (Si(0 <= e && e < this.getParameterCount()), this._parameterValues[e]);
  }
  getParameterValueById(e) {
    const n = this.getParameterIndex(e);
    return this.getParameterValueByIndex(n);
  }
  setParameterValueByIndex(e, n, r = 1) {
    if (this._notExistParameterValues.isExist(e)) {
      this._notExistParameterValues.setValue(
        e,
        r == 1
          ? n
          : this._notExistParameterValues.getValue(e) * (1 - r) + n * r,
      );
      return;
    }
    (Si(0 <= e && e < this.getParameterCount()),
      this.isRepeat(e)
        ? (n = this.getParameterRepeatValue(e, n))
        : (n = this.getParameterClampValue(e, n)),
      (this._parameterValues[e] =
        r == 1
          ? n
          : (this._parameterValues[e] =
              this._parameterValues[e] * (1 - r) + n * r)));
  }
  setParameterValueById(e, n, r = 1) {
    const i = this.getParameterIndex(e);
    this.setParameterValueByIndex(i, n, r);
  }
  addParameterValueByIndex(e, n, r = 1) {
    this.setParameterValueByIndex(e, this.getParameterValueByIndex(e) + n * r);
  }
  addParameterValueById(e, n, r = 1) {
    const i = this.getParameterIndex(e);
    this.addParameterValueByIndex(i, n, r);
  }
  isRepeat(e) {
    if (this._notExistParameterValues.isExist(e)) return !1;
    Si(0 <= e && e < this.getParameterCount());
    let n;
    return (
      this._isOverriddenParameterRepeat ||
      this._userParameterRepeatDataList.at(e).isOverridden
        ? (n = this._userParameterRepeatDataList.at(e).isParameterRepeated)
        : (n = this._model.parameters.repeats[e] != 0),
      n
    );
  }
  getParameterRepeatValue(e, n) {
    if (this._notExistParameterValues.isExist(e)) return n;
    Si(0 <= e && e < this.getParameterCount());
    const r = this._model.parameters.maximumValues[e],
      i = this._model.parameters.minimumValues[e],
      s = r - i;
    if (r < n) {
      const o = CubismMath.mod(n - r, s);
      Number.isNaN(o) ? (n = r) : (n = i + o);
    }
    if (n < i) {
      const o = CubismMath.mod(i - n, s);
      Number.isNaN(o) ? (n = i) : (n = r - o);
    }
    return n;
  }
  getParameterClampValue(e, n) {
    if (this._notExistParameterValues.isExist(e)) return n;
    Si(0 <= e && e < this.getParameterCount());
    const r = this._model.parameters.maximumValues[e],
      i = this._model.parameters.minimumValues[e];
    return CubismMath.clamp(n, i, r);
  }
  getParameterRepeats(e) {
    return this._model.parameters.repeats[e] != 0;
  }
  multiplyParameterValueById(e, n, r = 1) {
    const i = this.getParameterIndex(e);
    this.multiplyParameterValueByIndex(i, n, r);
  }
  multiplyParameterValueByIndex(e, n, r = 1) {
    this.setParameterValueByIndex(
      e,
      this.getParameterValueByIndex(e) * (1 + (n - 1) * r),
    );
  }
  getDrawableIndex(e) {
    const n = this._model.drawables.count;
    for (let r = 0; r < n; ++r) if (this._drawableIds.at(r) == e) return r;
    return -1;
  }
  getDrawableCount() {
    return this._model.drawables.count;
  }
  getDrawableId(e) {
    const n = this._model.drawables.ids;
    return CubismFramework.getIdManager().getId(n[e]);
  }
  getDrawableRenderOrders() {
    return this._model.drawables.renderOrders;
  }
  getDrawableTextureIndices(e) {
    return this.getDrawableTextureIndex(e);
  }
  getDrawableTextureIndex(e) {
    return this._model.drawables.textureIndices[e];
  }
  getDrawableDynamicFlagVertexPositionsDidChange(e) {
    const n = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(n[e]);
  }
  getDrawableVertexIndexCount(e) {
    return this._model.drawables.indexCounts[e];
  }
  getDrawableVertexCount(e) {
    return this._model.drawables.vertexCounts[e];
  }
  getDrawableVertices(e) {
    return this.getDrawableVertexPositions(e);
  }
  getDrawableVertexIndices(e) {
    return this._model.drawables.indices[e];
  }
  getDrawableVertexPositions(e) {
    return this._model.drawables.vertexPositions[e];
  }
  getDrawableVertexUvs(e) {
    return this._model.drawables.vertexUvs[e];
  }
  getDrawableOpacity(e) {
    return this._model.drawables.opacities[e];
  }
  getDrawableMultiplyColor(e) {
    const n = this._model.drawables.multiplyColors,
      r = e * 4,
      i = new CubismTextureColor();
    return (
      (i.r = n[r]),
      (i.g = n[r + 1]),
      (i.b = n[r + 2]),
      (i.a = n[r + 3]),
      i
    );
  }
  getDrawableScreenColor(e) {
    const n = this._model.drawables.screenColors,
      r = e * 4,
      i = new CubismTextureColor();
    return (
      (i.r = n[r]),
      (i.g = n[r + 1]),
      (i.b = n[r + 2]),
      (i.a = n[r + 3]),
      i
    );
  }
  getDrawableParentPartIndex(e) {
    return this._model.drawables.parentPartIndices[e];
  }
  getDrawableBlendMode(e) {
    const n = this._model.drawables.constantFlags;
    return Live2DCubismCore.Utils.hasBlendAdditiveBit(n[e])
      ? CubismBlendMode.CubismBlendMode_Additive
      : Live2DCubismCore.Utils.hasBlendMultiplicativeBit(n[e])
        ? CubismBlendMode.CubismBlendMode_Multiplicative
        : CubismBlendMode.CubismBlendMode_Normal;
  }
  getDrawableInvertedMaskBit(e) {
    const n = this._model.drawables.constantFlags;
    return Live2DCubismCore.Utils.hasIsInvertedMaskBit(n[e]);
  }
  getDrawableMasks() {
    return this._model.drawables.masks;
  }
  getDrawableMaskCounts() {
    return this._model.drawables.maskCounts;
  }
  isUsingMasking() {
    for (let e = 0; e < this._model.drawables.count; ++e)
      if (!(this._model.drawables.maskCounts[e] <= 0)) return !0;
    return !1;
  }
  getDrawableDynamicFlagIsVisible(e) {
    const n = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasIsVisibleBit(n[e]);
  }
  getDrawableDynamicFlagVisibilityDidChange(e) {
    const n = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasVisibilityDidChangeBit(n[e]);
  }
  getDrawableDynamicFlagOpacityDidChange(e) {
    const n = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasOpacityDidChangeBit(n[e]);
  }
  getDrawableDynamicFlagRenderOrderDidChange(e) {
    const n = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(n[e]);
  }
  getDrawableDynamicFlagBlendColorDidChange(e) {
    const n = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasBlendColorDidChangeBit(n[e]);
  }
  loadParameters() {
    let e = this._model.parameters.count;
    const n = this._savedParameters.getSize();
    e > n && (e = n);
    for (let r = 0; r < e; ++r)
      this._parameterValues[r] = this._savedParameters.at(r);
  }
  initialize() {
    (Si(this._model),
      (this._parameterValues = this._model.parameters.values),
      (this._partOpacities = this._model.parts.opacities),
      (this._parameterMaximumValues = this._model.parameters.maximumValues),
      (this._parameterMinimumValues = this._model.parameters.minimumValues));
    {
      const n = this._model.parameters.ids,
        r = this._model.parameters.count;
      (this._parameterIds.prepareCapacity(r),
        this._userParameterRepeatDataList.prepareCapacity(r));
      for (let i = 0; i < r; ++i)
        (this._parameterIds.pushBack(
          CubismFramework.getIdManager().getId(n[i]),
        ),
          this._userParameterRepeatDataList.pushBack(new Zle(!1, !1)));
    }
    const e = this._model.parts.count;
    {
      const n = this._model.parts.ids;
      this._partIds.prepareCapacity(e);
      for (let r = 0; r < e; ++r)
        this._partIds.pushBack(CubismFramework.getIdManager().getId(n[r]));
      (this._userPartMultiplyColors.prepareCapacity(e),
        this._userPartScreenColors.prepareCapacity(e),
        this._partChildDrawables.prepareCapacity(e));
    }
    {
      const n = this._model.drawables.ids,
        r = this._model.drawables.count;
      (this._userMultiplyColors.prepareCapacity(r),
        this._userScreenColors.prepareCapacity(r),
        this._userCullings.prepareCapacity(r));
      const i = new Jle(!1, !1);
      for (let s = 0; s < e; ++s) {
        const o = new CubismTextureColor(1, 1, 1, 1),
          a = new CubismTextureColor(0, 0, 0, 1),
          l = new L5(!1, o),
          c = new L5(!1, a);
        (this._userPartMultiplyColors.pushBack(l),
          this._userPartScreenColors.pushBack(c),
          this._partChildDrawables.pushBack(new csmVector()),
          this._partChildDrawables.at(s).prepareCapacity(r));
      }
      for (let s = 0; s < r; ++s) {
        const o = new CubismTextureColor(1, 1, 1, 1),
          a = new CubismTextureColor(0, 0, 0, 1),
          l = new D5(!1, o),
          c = new D5(!1, a);
        (this._drawableIds.pushBack(CubismFramework.getIdManager().getId(n[s])),
          this._userMultiplyColors.pushBack(l),
          this._userScreenColors.pushBack(c),
          this._userCullings.pushBack(i));
        const u = this.getDrawableParentPartIndex(s);
        u >= 0 && this._partChildDrawables.at(u).pushBack(s);
      }
    }
  }
  constructor(e) {
    ((this._model = e),
      (this._parameterValues = null),
      (this._parameterMaximumValues = null),
      (this._parameterMinimumValues = null),
      (this._partOpacities = null),
      (this._savedParameters = new csmVector()),
      (this._parameterIds = new csmVector()),
      (this._drawableIds = new csmVector()),
      (this._partIds = new csmVector()),
      (this._isOverriddenParameterRepeat = !0),
      (this._isOverriddenModelMultiplyColors = !1),
      (this._isOverriddenModelScreenColors = !1),
      (this._isOverriddenCullings = !1),
      (this._modelOpacity = 1),
      (this._userParameterRepeatDataList = new csmVector()),
      (this._userMultiplyColors = new csmVector()),
      (this._userScreenColors = new csmVector()),
      (this._userCullings = new csmVector()),
      (this._userPartMultiplyColors = new csmVector()),
      (this._userPartScreenColors = new csmVector()),
      (this._partChildDrawables = new csmVector()),
      (this._notExistPartId = new csmMap()),
      (this._notExistParameterId = new csmMap()),
      (this._notExistParameterValues = new csmMap()),
      (this._notExistPartOpacities = new csmMap()));
  }
  release() {
    (this._model.release(), (this._model = null));
  }
  _notExistPartOpacities;
  _notExistPartId;
  _notExistParameterValues;
  _notExistParameterId;
  _savedParameters;
  _isOverriddenParameterRepeat;
  _isOverriddenModelMultiplyColors;
  _isOverriddenModelScreenColors;
  _userParameterRepeatDataList;
  _userMultiplyColors;
  _userScreenColors;
  _userPartScreenColors;
  _userPartMultiplyColors;
  _partChildDrawables;
  _model;
  _parameterValues;
  _parameterMaximumValues;
  _parameterMinimumValues;
  _partOpacities;
  _modelOpacity;
  _parameterIds;
  _partIds;
  _drawableIds;
  _isOverriddenCullings;
  _userCullings;
}
var N5;
((t) => {
  t.CubismModel = CubismModel;
})(N5 || (N5 = {}));
class CubismMoc {
  static create(e, n) {
    let r = null;
    if (n && !this.hasMocConsistency(e)) return (Wn("Inconsistent MOC3."), r);
    const i = Live2DCubismCore.Moc.fromArrayBuffer(e);
    return (
      i &&
        ((r = new CubismMoc(i)),
        (r._mocVersion = Live2DCubismCore.Version.csmGetMocVersion(i, e))),
      r
    );
  }
  static delete(e) {
    (e._moc._release(), (e._moc = null), (e = null));
  }
  createModel() {
    let e = null;
    const n = Live2DCubismCore.Model.fromMoc(this._moc);
    return (
      n && ((e = new CubismModel(n)), e.initialize(), ++this._modelCount),
      e
    );
  }
  deleteModel(e) {
    e != null && (e.release(), (e = null), --this._modelCount);
  }
  constructor(e) {
    ((this._moc = e), (this._modelCount = 0), (this._mocVersion = 0));
  }
  release() {
    (Si(this._modelCount == 0), this._moc._release(), (this._moc = null));
  }
  getLatestMocVersion() {
    return Live2DCubismCore.Version.csmGetLatestMocVersion();
  }
  getMocVersion() {
    return this._mocVersion;
  }
  static hasMocConsistency(e) {
    return Live2DCubismCore.Moc.prototype.hasMocConsistency(e) === 1;
  }
  _moc;
  _modelCount;
  _mocVersion;
}
var O5;
((t) => {
  t.CubismMoc = CubismMoc;
})(O5 || (O5 = {}));
const F5 = "Meta",
  Qle = "UserDataCount",
  ece = "TotalUserDataSize",
  aw = "UserData",
  tce = "Target",
  nce = "Id",
  rce = "Value";
class CubismModelUserDataJson {
  constructor(e, n) {
    this._json = CubismJson.create(e, n);
  }
  release() {
    CubismJson.delete(this._json);
  }
  getUserDataCount() {
    return this._json
      .getRoot()
      .getValueByString(F5)
      .getValueByString(Qle)
      .toInt();
  }
  getTotalUserDataSize() {
    return this._json
      .getRoot()
      .getValueByString(F5)
      .getValueByString(ece)
      .toInt();
  }
  getUserDataTargetType(e) {
    return this._json
      .getRoot()
      .getValueByString(aw)
      .getValueByIndex(e)
      .getValueByString(tce)
      .getRawString();
  }
  getUserDataId(e) {
    return CubismFramework.getIdManager().getId(
      this._json
        .getRoot()
        .getValueByString(aw)
        .getValueByIndex(e)
        .getValueByString(nce)
        .getRawString(),
    );
  }
  getUserDataValue(e) {
    return this._json
      .getRoot()
      .getValueByString(aw)
      .getValueByIndex(e)
      .getValueByString(rce)
      .getRawString();
  }
  _json;
}
var B5;
((t) => {
  t.CubismModelUserDataJson = CubismModelUserDataJson;
})(B5 || (B5 = {}));
const ice = "ArtMesh";
class CubismModelUserDataNode {
  targetType;
  targetId;
  value;
}
class CubismModelUserData {
  static create(e, n) {
    const r = new CubismModelUserData();
    return (r.parseUserData(e, n), r);
  }
  static delete(e) {
    e != null && (e.release(), (e = null));
  }
  getArtMeshUserDatas() {
    return this._artMeshUserDataNode;
  }
  parseUserData(e, n) {
    let r = new CubismModelUserDataJson(e, n);
    if (!r) {
      (r.release(), (r = void 0));
      return;
    }
    const i = CubismFramework.getIdManager().getId(ice),
      s = r.getUserDataCount();
    for (let o = 0; o < s; o++) {
      const a = new CubismModelUserDataNode();
      ((a.targetId = r.getUserDataId(o)),
        (a.targetType = CubismFramework.getIdManager().getId(
          r.getUserDataTargetType(o),
        )),
        (a.value = new csmString(r.getUserDataValue(o))),
        this._userDataNodes.pushBack(a),
        a.targetType == i && this._artMeshUserDataNode.pushBack(a));
    }
    (r.release(), (r = void 0));
  }
  constructor() {
    ((this._userDataNodes = new csmVector()),
      (this._artMeshUserDataNode = new csmVector()));
  }
  release() {
    for (let e = 0; e < this._userDataNodes.getSize(); ++e)
      this._userDataNodes.set(e, null);
    this._userDataNodes = null;
  }
  _userDataNodes;
  _artMeshUserDataNode;
}
var U5;
((t) => {
  ((t.CubismModelUserData = CubismModelUserData),
    (t.CubismModelUserDataNode = CubismModelUserDataNode));
})(U5 || (U5 = {}));
class CubismUserModel {
  isInitialized() {
    return this._initialized;
  }
  setInitialized(e) {
    this._initialized = e;
  }
  isUpdating() {
    return this._updating;
  }
  setUpdating(e) {
    this._updating = e;
  }
  setDragging(e, n) {
    this._dragManager.set(e, n);
  }
  setAcceleration(e, n, r) {
    ((this._accelerationX = e),
      (this._accelerationY = n),
      (this._accelerationZ = r));
  }
  getModelMatrix() {
    return this._modelMatrix;
  }
  setOpacity(e) {
    this._opacity = e;
  }
  getOpacity() {
    return this._opacity;
  }
  loadModel(e, n = !1) {
    if (((this._moc = CubismMoc.create(e, n)), this._moc == null)) {
      Wn("Failed to CubismMoc.create().");
      return;
    }
    if (((this._model = this._moc.createModel()), this._model == null)) {
      Wn("Failed to CreateModel().");
      return;
    }
    (this._model.saveParameters(),
      (this._modelMatrix = new CubismModelMatrix(
        this._model.getCanvasWidth(),
        this._model.getCanvasHeight(),
      )));
  }
  loadMotion(e, n, r, i, s, o, a, l, c = !1) {
    if (e == null || n == 0) return (Wn("Failed to loadMotion()."), null);
    const u = CubismMotion.create(e, n, i, s, c);
    if (u == null)
      return (Wn("Failed to create motion from buffer in LoadMotion()"), null);
    if (o) {
      const d = o.getMotionFadeInTimeValue(a, l);
      d >= 0 && u.setFadeInTime(d);
      const f = o.getMotionFadeOutTimeValue(a, l);
      f >= 0 && u.setFadeOutTime(f);
    }
    return u;
  }
  loadExpression(e, n, r) {
    return e == null || n == 0
      ? (Wn("Failed to loadExpression()."), null)
      : CubismExpressionMotion.create(e, n);
  }
  loadPose(e, n) {
    if (e == null || n == 0) {
      Wn("Failed to loadPose().");
      return;
    }
    this._pose = CubismPose.create(e, n);
  }
  loadUserData(e, n) {
    if (e == null || n == 0) {
      Wn("Failed to loadUserData().");
      return;
    }
    this._modelUserData = CubismModelUserData.create(e, n);
  }
  loadPhysics(e, n) {
    if (e == null || n == 0) {
      Wn("Failed to loadPhysics().");
      return;
    }
    this._physics = CubismPhysics.create(e, n);
  }
  isHit(e, n, r) {
    const i = this._model.getDrawableIndex(e);
    if (i < 0) return !1;
    const s = this._model.getDrawableVertexCount(i),
      o = this._model.getDrawableVertices(i);
    let a = o[0],
      l = o[0],
      c = o[1],
      u = o[1];
    for (let h = 1; h < s; ++h) {
      const _ = o[Gr.vertexOffset + h * Gr.vertexStep],
        m = o[Gr.vertexOffset + h * Gr.vertexStep + 1];
      (_ < a && (a = _), _ > l && (l = _), m < c && (c = m), m > u && (u = m));
    }
    const d = this._modelMatrix.invertTransformX(n),
      f = this._modelMatrix.invertTransformY(r);
    return a <= d && d <= l && c <= f && f <= u;
  }
  getModel() {
    return this._model;
  }
  getRenderer() {
    return this._renderer;
  }
  createRenderer(e = 1) {
    (this._renderer && this.deleteRenderer(),
      (this._renderer = new CubismRenderer_WebGL()),
      this._renderer.initialize(this._model, e));
  }
  deleteRenderer() {
    this._renderer != null &&
      (this._renderer.release(), (this._renderer = null));
  }
  motionEventFired(e) {
    Cs("{0}", e.s);
  }
  static cubismDefaultMotionEventCallback(e, n, r) {
    const i = r;
    i?.motionEventFired(n);
  }
  constructor() {
    ((this._moc = null),
      (this._model = null),
      (this._motionManager = null),
      (this._expressionManager = null),
      (this._eyeBlink = null),
      (this._breath = null),
      (this._modelMatrix = null),
      (this._pose = null),
      (this._dragManager = null),
      (this._physics = null),
      (this._modelUserData = null),
      (this._initialized = !1),
      (this._updating = !1),
      (this._opacity = 1),
      (this._lipsync = !0),
      (this._lastLipSyncValue = 0),
      (this._dragX = 0),
      (this._dragY = 0),
      (this._accelerationX = 0),
      (this._accelerationY = 0),
      (this._accelerationZ = 0),
      (this._mocConsistency = !1),
      (this._debugMode = !1),
      (this._renderer = null),
      (this._motionManager = new CubismMotionManager()),
      this._motionManager.setEventCallback(
        CubismUserModel.cubismDefaultMotionEventCallback,
        this,
      ),
      (this._expressionManager = new CubismExpressionMotionManager()),
      (this._dragManager = new CubismTargetPoint()));
  }
  release() {
    (this._motionManager != null &&
      (this._motionManager.release(), (this._motionManager = null)),
      this._expressionManager != null &&
        (this._expressionManager.release(), (this._expressionManager = null)),
      this._moc != null &&
        (this._moc.deleteModel(this._model),
        this._moc.release(),
        (this._moc = null)),
      (this._modelMatrix = null),
      CubismPose.delete(this._pose),
      CubismEyeBlink.delete(this._eyeBlink),
      CubismBreath.delete(this._breath),
      (this._dragManager = null),
      CubismPhysics.delete(this._physics),
      CubismModelUserData.delete(this._modelUserData),
      this.deleteRenderer());
  }
  _moc;
  _model;
  _motionManager;
  _expressionManager;
  _eyeBlink;
  _breath;
  _modelMatrix;
  _pose;
  _dragManager;
  _physics;
  _modelUserData;
  _initialized;
  _updating;
  _opacity;
  _lipsync;
  _lastLipSyncValue;
  _dragX;
  _dragY;
  _accelerationX;
  _accelerationY;
  _accelerationZ;
  _mocConsistency;
  _motionConsistency;
  _debugMode;
  _renderer;
}
var V5;
((t) => {
  t.CubismUserModel = CubismUserModel;
})(V5 || (V5 = {}));
class sce extends CubismRenderer_WebGL {
  drawableBuffers = new Map();
  scratchModelColor = new CubismTextureColor();
  frameTick = 0;
  saveProfile() {}
  restoreProfile() {
    this.gl.activeTexture(this.gl.TEXTURE0);
  }
  getModelColorWithOpacity(e) {
    const n = this.scratchModelColor,
      r = this._modelColor;
    return (
      (n.r = r.r),
      (n.g = r.g),
      (n.b = r.b),
      (n.a = r.a * e),
      this.isPremultipliedAlpha() && ((n.r *= n.a), (n.g *= n.a), (n.b *= n.a)),
      n
    );
  }
  doDrawModel() {
    (this.frameTick++, super.doDrawModel());
  }
  bindDrawableVertexBuffers(e, n, r, i) {
    const s = this.gl,
      o = this.buffersFor(e, n);
    (s.bindBuffer(s.ARRAY_BUFFER, o.vertex),
      (o.vertexTick === -1 ||
        (o.vertexTick !== this.frameTick &&
          e.getDrawableDynamicFlagVertexPositionsDidChange(n))) &&
        (s.bufferSubData(s.ARRAY_BUFFER, 0, e.getDrawableVertices(n)),
        (o.vertexTick = this.frameTick)),
      s.enableVertexAttribArray(r),
      s.vertexAttribPointer(r, 2, s.FLOAT, !1, 0, 0),
      s.bindBuffer(s.ARRAY_BUFFER, o.uv),
      s.enableVertexAttribArray(i),
      s.vertexAttribPointer(i, 2, s.FLOAT, !1, 0, 0));
  }
  bindDrawableIndexBuffer(e, n) {
    const r = this.gl;
    r.bindBuffer(r.ELEMENT_ARRAY_BUFFER, this.buffersFor(e, n).index);
  }
  release() {
    const e = this.gl;
    if (e != null)
      for (const n of this.drawableBuffers.values())
        (e.deleteBuffer(n.vertex),
          e.deleteBuffer(n.uv),
          e.deleteBuffer(n.index));
    (this.drawableBuffers.clear(), super.release());
  }
  buffersFor(e, n) {
    const r = this.drawableBuffers.get(n);
    if (r) return r;
    const i = this.gl,
      s = i.createBuffer(),
      o = i.createBuffer(),
      a = i.createBuffer();
    if (!s || !o || !a)
      throw new Error("Failed to create Live2D drawable buffers");
    (i.bindBuffer(i.ARRAY_BUFFER, s),
      i.bufferData(
        i.ARRAY_BUFFER,
        e.getDrawableVertices(n).byteLength,
        i.DYNAMIC_DRAW,
      ),
      i.bindBuffer(i.ARRAY_BUFFER, o),
      i.bufferData(i.ARRAY_BUFFER, e.getDrawableVertexUvs(n), i.STATIC_DRAW),
      i.bindBuffer(i.ELEMENT_ARRAY_BUFFER, a),
      i.bufferData(
        i.ELEMENT_ARRAY_BUFFER,
        e.getDrawableVertexIndices(n),
        i.STATIC_DRAW,
      ));
    const l = { vertex: s, uv: o, index: a, vertexTick: -1 };
    return (this.drawableBuffers.set(n, l), l);
  }
}
class Live2DModel extends CubismUserModel {
  id;
  logger;
  modelSetting;
  eyeBlinkIds = new csmVector();
  lipSyncIds = new csmVector();
  motions = new Map();
  motionMeta = new Map();
  expressions = new Map();
  effectInstances = [];
  effectPluginMap = new Map();
  baseTextures = [];
  hitAreaNames = [];
  partDrawablesCache = new Map();
  gl = null;
  lightingRenderer = null;
  restoreDeps = null;
  restPose = !1;
  variantTextures = new Map();
  activeTextureVariant = null;
  idleSequence = null;
  activeSequence = null;
  currentStepIndex = 0;
  sequenceCallbacks = null;
  motionToKey = new Map();
  currentMotionKey = null;
  expressionFades = new Map();
  expressionTimer = null;
  userTimeSeconds = 0;
  mocConsistency = !1;
  motionConsistency = !1;
  constructor(e, n, r) {
    (super(), (this.id = e), (this.modelSetting = n), (this.logger = r));
  }
  get model() {
    return this._model;
  }
  getSetting() {
    return this.modelSetting;
  }
  getGl() {
    if (!this.gl) throw new Error("Model GL context not initialized");
    return this.gl;
  }
  getCubismRenderer() {
    return this.getRenderer();
  }
  createRenderer(e = 1) {
    (this._renderer && this.deleteRenderer(),
      (this._renderer = new sce()),
      this._renderer.initialize(this._model, e));
  }
  setLightingRenderer(e) {
    this.lightingRenderer = e;
  }
  setRestPose(e) {
    this.restPose = e;
  }
  isRestPose() {
    return this.restPose;
  }
  getEyeBlinkIds() {
    return this.eyeBlinkIds;
  }
  getLipSyncIds() {
    return this.lipSyncIds;
  }
  getElapsedTimeSeconds() {
    return this.userTimeSeconds;
  }
  getHitAreaNames() {
    return this.hitAreaNames;
  }
  getExpressionNames() {
    return Array.from(this.expressions.keys());
  }
  hitTestArea(e, n) {
    for (const r of this.hitAreaNames) if (this.hitTest(r, e, n)) return r;
    return null;
  }
  hasPhysics() {
    return this._physics != null;
  }
  evaluatePhysics(e) {
    this._physics && this._model && this._physics.evaluate(this._model, e);
  }
  hasPose() {
    return this._pose != null;
  }
  updatePose(e) {
    this._pose && this._model && this._pose.updateParameters(this._model, e);
  }
  async initialize(e) {
    const {
      loader: n,
      paths: r,
      textureCache: i,
      gl: s,
      signal: o,
      premultipliedAlpha: a,
      plugins: l,
    } = e;
    ((this.gl = s),
      (this.restoreDeps = {
        loader: n,
        textureCache: i,
        paths: r,
        premultipliedAlpha: a,
      }),
      (this.mocConsistency = !!e.mocConsistency),
      (this.motionConsistency = !!e.motionConsistency),
      this.logInfo("Loading moc %s", r.mocUrl));
    const c = await n.loadArrayBuffer(r.mocUrl, o);
    if (
      (throwIfAborted(o), this.loadModel(c, this.mocConsistency), !this._model)
    )
      throw new Error("Failed to load Cubism model");
    (this._model.saveParameters(), this.createRenderer());
    const u = this.getRenderer();
    if (
      (u.setIsPremultipliedAlpha?.(a),
      u.startUp?.(s),
      this.collectEffectIds(),
      await Promise.all([
        this.loadExpressions(n, r.expressionUrls, o),
        this.loadMotions(n, r.motionUrls, o),
        this.loadPhysicsAsset(n, r.physicsUrl, o),
        this.loadPoseAsset(n, r.poseUrl, o),
        this.loadUserDataAsset(n, r.userDataUrl, o),
      ]),
      throwIfAborted(o),
      await Promise.all([
        this.loadTextures(i, n, r.textureUrls, a, o),
        this.loadTextureVariants(i, n, r.textureVariantUrls, a, o),
      ]),
      throwIfAborted(o),
      this.applyLayout(),
      this.cacheHitAreaNames(),
      l)
    )
      for (const d of l) {
        const f = d.install(this);
        (this.effectInstances.push(f), this.effectPluginMap.set(d.id, f));
      }
    (this.setInitialized(!0),
      this.setUpdating(!1),
      this.logInfo(
        "Model ready with %d motions, %d expressions",
        this.motions.size,
        this.expressions.size,
      ));
  }
  async restoreGraphics() {
    const e = this.restoreDeps,
      n = this.gl;
    if (!e || !n || !this._model || !this.isInitialized()) return;
    this.createRenderer();
    const r = this.getRenderer();
    (r.setIsPremultipliedAlpha?.(e.premultipliedAlpha),
      r.startUp?.(n),
      await Promise.all([
        this.loadTextures(
          e.textureCache,
          e.loader,
          e.paths.textureUrls,
          e.premultipliedAlpha,
        ),
        this.loadTextureVariants(
          e.textureCache,
          e.loader,
          e.paths.textureVariantUrls,
          e.premultipliedAlpha,
        ),
      ]));
    const i = this.activeTextureVariant;
    (i !== null &&
      ((this.activeTextureVariant = null), this.setTextureVariant(i)),
      this.lightingRenderer?.restoreGraphics(),
      this.logInfo("GPU resources rebuilt after context restore"));
  }
  update(e) {
    if (!this.isInitialized() || !this._model) return;
    ((this.userTimeSeconds += e), this._model.loadParameters());
    let n = !1;
    (this.restPose
      ? this.resetToDefaultParameters()
      : ((n = this._motionManager.updateMotion(this._model, e)),
        this._model.saveParameters()),
      this.applyActiveExpressions(e));
    const r = { model: this, deltaTimeSeconds: e, motionUpdated: n };
    for (const i of this.effectInstances) i.update(r);
    this._model.update();
  }
  resetToDefaultParameters() {
    const e = this._model;
    if (!e) return;
    const n = e.getParameterCount();
    for (let r = 0; r < n; r++)
      e.setParameterValueByIndex(r, e.getParameterDefaultValue(r));
  }
  applyActiveExpressions(e) {
    if (!this._model) return;
    let n = !1;
    for (const [r, i] of this.expressionFades) {
      const s = this.expressions.get(r);
      if (!s) continue;
      if (i.target === 1)
        i.progress =
          s.fadeInSeconds <= 0
            ? 1
            : Math.min(1, i.progress + e / s.fadeInSeconds);
      else if (
        ((i.progress =
          s.fadeOutSeconds <= 0
            ? 0
            : Math.max(0, i.progress - e / s.fadeOutSeconds)),
        i.progress === 0)
      ) {
        n = !0;
        continue;
      }
      const o = CubismMath.getEasingSine(i.progress);
      for (const a of s.params)
        switch (a.blendType) {
          case 0:
            this._model.addParameterValueById(a.id, a.value, o);
            break;
          case 1:
            this._model.multiplyParameterValueById(a.id, a.value, o);
            break;
          case 2:
            this._model.setParameterValueById(a.id, a.value, o);
            break;
        }
    }
    if (n)
      for (const [r, i] of this.expressionFades)
        i.target === 0 && i.progress === 0 && this.expressionFades.delete(r);
  }
  draw(e, n) {
    if (!this.isInitialized() || !this._model) return;
    const r = this.getRenderer(),
      i = new CubismMatrix44();
    if (
      (i.loadIdentity(),
      i.multiplyByMatrix(e),
      i.multiplyByMatrix(this.getModelMatrix()),
      (this.lastMvp = i),
      this.lightingRenderer?.isReady())
    ) {
      this.lightingRenderer.renderLit(this, i, n);
      return;
    }
    (r.setRenderState(null, n), r.setMvpMatrix(i), r.drawModel());
  }
  addExpression(e) {
    if (!this.expressions.has(e)) {
      this.logDebug("Expression %s not found", e);
      return;
    }
    const n = this.expressionFades.get(e);
    n
      ? (n.target = 1)
      : this.expressionFades.set(e, { progress: 0, target: 1 });
  }
  removeExpression(e) {
    const n = this.expressionFades.get(e);
    n && (n.target = 0);
  }
  setExpression(e) {
    this.clearExpressionTimer();
    for (const n of this.expressionFades.values()) n.target = 0;
    this.addExpression(e);
  }
  setTemporaryExpression(e, n) {
    (this.addExpression(e),
      n > 0 &&
        (this.expressionTimer = window.setTimeout(() => {
          (this.removeExpression(e), (this.expressionTimer = null));
        }, n * 1e3)));
  }
  clearExpressions() {
    this.clearExpressionTimer();
    for (const e of this.expressionFades.values()) e.target = 0;
  }
  clearExpressionTimer() {
    this.expressionTimer !== null &&
      (window.clearTimeout(this.expressionTimer),
      (this.expressionTimer = null));
  }
  getActiveExpressions() {
    const e = [];
    for (const [n, r] of this.expressionFades) r.target === 1 && e.push(n);
    return e;
  }
  startMotion(e) {
    const { steps: n, onBegin: r, onFinish: i } = e,
      s = Array.isArray(n) ? n : [n];
    if (s.length === 0) {
      this.logDebug("Empty motion sequence");
      return;
    }
    ((this.activeSequence = s),
      (this.currentStepIndex = 0),
      (this.sequenceCallbacks = { onBegin: r, onFinish: i }),
      this.startSequenceStep(0, !0));
  }
  setIdleSequence(e) {
    const n = Array.isArray(e) ? e : [e];
    this.idleSequence = n;
    for (const r of n) {
      const i = this.motionKey(r.group, r.index ?? 0),
        s = this.motions.get(i);
      s && (s.setLoop(r.loop ?? !1), s.setLoopFadeIn(!1));
    }
    (this.logDebug("Idle sequence set: %d steps", n.length),
      this._motionManager.isFinished() && this.startIdleSequenceIfConfigured());
  }
  startSequenceStep(e, n) {
    if (!this.activeSequence || e >= this.activeSequence.length) return;
    const r = this.activeSequence[e],
      i = r.index ?? 0,
      s = this.motionKey(r.group, i),
      o = this.motions.get(s);
    if (!o) {
      (this.logDebug("Motion %s not loaded, skipping step", s),
        this.startSequenceStep(e + 1, !1));
      return;
    }
    this._motionManager.setReservePriority(3);
    const a = this.motionMeta.get(s),
      l = r.fadeIn ?? a?.fadeIn,
      c = r.fadeOut ?? a?.fadeOut;
    (l !== void 0 && o.setFadeInTime(l),
      c !== void 0 && o.setFadeOutTime(c),
      o.setLoop(r.loop ?? !1),
      o.setLoopFadeIn(!1),
      (this.currentMotionKey = s),
      (this.currentStepIndex = e),
      n && this.sequenceCallbacks?.onBegin && this.sequenceCallbacks.onBegin(),
      this._motionManager.startMotionPriority(o, !1, 3));
  }
  hitTest(e, n, r) {
    if (this.getOpacity() < 1) return !1;
    const i = this.modelSetting.getHitAreasCount();
    for (let s = 0; s < i; s++)
      if (this.modelSetting.getHitAreaName(s) === e) {
        const o = this.modelSetting.getHitAreaId(s);
        return this.isHit(o, n, r);
      }
    return !1;
  }
  hitTestParts(e, n, r) {
    for (const i of this.resolvePartDrawables(e))
      if (
        this._model.getDrawableDynamicFlagIsVisible(i) &&
        this.isPointInDrawableBounds(i, n, r)
      )
        return !0;
    return !1;
  }
  lastMvp = null;
  canvasUVToModel(e, n) {
    const r = this.lastMvp;
    return r
      ? { x: r.invertTransformX(e * 2 - 1), y: r.invertTransformY(1 - n * 2) }
      : null;
  }
  modelToCanvasUV(e, n) {
    const r = this.lastMvp;
    return r
      ? { u: (r.transformX(e) + 1) / 2, v: (1 - r.transformY(n)) / 2 }
      : null;
  }
  getPartsBounds(e) {
    let n = null;
    for (const r of this.resolvePartDrawables(e)) {
      const i = this._model,
        s = i.getDrawableVertexCount(r);
      if (s === 0) continue;
      const o = i.getDrawableVertices(r);
      for (let a = 0; a < s; a++) {
        const l = o[Gr.vertexOffset + a * Gr.vertexStep],
          c = o[Gr.vertexOffset + a * Gr.vertexStep + 1];
        n
          ? (l < n.left && (n.left = l),
            l > n.right && (n.right = l),
            c > n.top && (n.top = c),
            c < n.bottom && (n.bottom = c))
          : (n = { left: l, right: l, top: c, bottom: c });
      }
    }
    return n;
  }
  resolvePartDrawables(e) {
    const n = this._model;
    if (!n) return [];
    const r = e.join("|"),
      i = this.partDrawablesCache.get(r);
    if (i) return i;
    const s = new Set(e),
      o = n.getPartCount(),
      a = n.getPartParentPartIndices(),
      l = new Array(o);
    for (let d = 0; d < o; d++) {
      let f = !1;
      for (let h = d; h >= 0; h = a[h] ?? -1)
        if (s.has(n.getPartId(h).getString().s)) {
          f = !0;
          break;
        }
      l[d] = f;
    }
    const c = [],
      u = n.getDrawableCount();
    for (let d = 0; d < u; d++) {
      const f = n.getDrawableParentPartIndex(d);
      f >= 0 && l[f] && c.push(d);
    }
    return (this.partDrawablesCache.set(r, c), c);
  }
  isPointInDrawableBounds(e, n, r) {
    const i = this._model,
      s = i.getDrawableVertexCount(e);
    if (s === 0) return !1;
    const o = i.getDrawableVertices(e);
    let a = o[0],
      l = o[0],
      c = o[1],
      u = o[1];
    for (let d = 1; d < s; d++) {
      const f = o[Gr.vertexOffset + d * Gr.vertexStep],
        h = o[Gr.vertexOffset + d * Gr.vertexStep + 1];
      (f < a && (a = f), f > l && (l = f), h < c && (c = h), h > u && (u = h));
    }
    return a <= n && n <= l && c <= r && r <= u;
  }
  release() {
    this.clearExpressionTimer();
    for (const e of this.effectInstances) e.dispose();
    this.effectInstances.length = 0;
    for (const e of this.motions.values()) CubismMotion.delete(e);
    (this.motions.clear(),
      this.motionMeta.clear(),
      this.expressions.clear(),
      this.expressionFades.clear(),
      this.lightingRenderer?.dispose(),
      (this.lightingRenderer = null),
      (this.hitAreaNames.length = 0),
      this.partDrawablesCache.clear(),
      this.deleteRenderer(),
      (this.baseTextures.length = 0),
      this.variantTextures.clear(),
      (this.activeTextureVariant = null));
  }
  setDragging(e, n) {
    for (const r of this.effectInstances) r.setDragTarget?.(e, n);
  }
  getPluginEnabled(e) {
    return this.effectPluginMap.get(e)?.enabled ?? !1;
  }
  setPluginEnabled(e, n) {
    const r = this.effectPluginMap.get(e);
    r?.setEnabled && r.setEnabled(n);
  }
  setTextureVariant(e) {
    if (e !== null && !this.variantTextures.has(e))
      throw new Error(
        `Texture variant "${e}" not declared on this model (have: ${[...this.variantTextures.keys()].join(", ") || "none"})`,
      );
    if (!this.isInitialized() || e === this.activeTextureVariant) return;
    this.activeTextureVariant = e;
    const n = e !== null ? this.variantTextures.get(e) : void 0,
      r = this.getRenderer();
    for (let i = 0; i < this.baseTextures.length; i++)
      r.bindTexture(i, n?.get(i) ?? this.baseTextures[i]);
    this.logInfo("Texture variant → %s", e ?? "base");
  }
  getTextureVariant() {
    return this.activeTextureVariant;
  }
  async loadExpressions(e, n, r) {
    this.expressions.clear();
    const i = Array.from(n.entries()).map(async ([s, o]) => {
      const a = await e.loadArrayBuffer(o, r),
        l = this.parseExpressionJson(s, a);
      l && this.expressions.set(s, l);
    });
    await Promise.all(i);
  }
  parseExpressionJson(e, n) {
    try {
      const r = new TextDecoder(),
        i = JSON.parse(r.decode(n)),
        s = [],
        o = i.Parameters ?? [];
      for (const a of o) {
        const l = CubismFramework.getIdManager().getId(a.Id);
        if (!l) continue;
        let c = 0;
        (a.Blend === "Multiply" ? (c = 1) : a.Blend === "Overwrite" && (c = 2),
          s.push({ id: l, blendType: c, value: a.Value ?? 0 }));
      }
      return {
        name: e,
        params: s,
        fadeInSeconds: typeof i.FadeInTime == "number" ? i.FadeInTime : 1,
        fadeOutSeconds: typeof i.FadeOutTime == "number" ? i.FadeOutTime : 1,
      };
    } catch (r) {
      return (this.logDebug("Failed to parse expression %s: %o", e, r), null);
    }
  }
  async loadMotions(e, n, r) {
    (this.motions.clear(), this.motionMeta.clear());
    const i = [];
    (n.forEach((s, o) => {
      s.forEach((a, l) => {
        const c = this.motionKey(o, l);
        i.push(
          (async () => {
            const u = await e.loadArrayBuffer(a, r),
              d = () => this.onMotionFinished(h),
              f = () => this.onMotionBegan(h),
              h = this.loadMotion(
                u,
                u.byteLength,
                c,
                d,
                f,
                this.modelSetting,
                o,
                l,
                this.motionConsistency,
              );
            if (!h) {
              this.logDebug("Skipping empty motion %s", c);
              return;
            }
            (this.motionToKey.set(h, c),
              h.setLoop(!1),
              h.setLoopFadeIn(!1),
              h.setEffectIds(this.eyeBlinkIds, this.lipSyncIds),
              this.motions.set(c, h),
              this.motionMeta.set(c, {
                fadeIn: this.modelSetting.getMotionFadeInTimeValue(o, l) ?? 1,
                fadeOut: this.modelSetting.getMotionFadeOutTimeValue(o, l) ?? 1,
              }));
          })(),
        );
      });
    }),
      await Promise.all(i));
  }
  async loadPhysicsAsset(e, n, r) {
    if (!n) return;
    const i = await e.loadArrayBuffer(n, r);
    i.byteLength !== 0 && this.loadPhysics(i, i.byteLength);
  }
  async loadPoseAsset(e, n, r) {
    if (!n) return;
    const i = await e.loadArrayBuffer(n, r);
    i.byteLength !== 0 && this.loadPose(i, i.byteLength);
  }
  async loadUserDataAsset(e, n, r) {
    if (!n) return;
    const i = await e.loadArrayBuffer(n, r);
    i.byteLength !== 0 && this.loadUserData(i, i.byteLength);
  }
  async loadTextures(e, n, r, i, s) {
    const o = this.getRenderer();
    this.baseTextures.length = r.length;
    const a = r.map(async (l, c) => {
      const u = await e.load(l, i, n, s);
      (o.bindTexture(c, u.texture),
        (this.baseTextures[c] = u.texture),
        this.logDebug("Bound texture %s to slot %d", l, c));
    });
    await Promise.all(a);
  }
  async loadTextureVariants(e, n, r, i, s) {
    const o = [];
    for (const [a, l] of r) {
      const c = new Map();
      this.variantTextures.set(a, c);
      for (const [u, d] of l)
        o.push(
          (async () => {
            const f = await e.load(d, i, n, s);
            (c.set(u, f.texture),
              this.logDebug(
                "Loaded variant %s texture for slot %d (%s)",
                a,
                u,
                d,
              ));
          })(),
        );
    }
    await Promise.all(o);
  }
  collectEffectIds() {
    (this.eyeBlinkIds.clear(), this.lipSyncIds.clear());
    const e = this.modelSetting.getEyeBlinkParameterCount();
    for (let r = 0; r < e; r++)
      this.eyeBlinkIds.pushBack(this.modelSetting.getEyeBlinkParameterId(r));
    const n = this.modelSetting.getLipSyncParameterCount();
    for (let r = 0; r < n; r++)
      this.lipSyncIds.pushBack(this.modelSetting.getLipSyncParameterId(r));
  }
  cacheHitAreaNames() {
    this.hitAreaNames.length = 0;
    const e = this.modelSetting.getHitAreasCount();
    for (let n = 0; n < e; n++)
      this.hitAreaNames.push(this.modelSetting.getHitAreaName(n));
  }
  applyLayout() {
    const e = new csmMap();
    (this.modelSetting.getLayoutMap(e),
      this.getModelMatrix().setupFromLayout(e));
  }
  motionKey(e, n) {
    return `${e}_${n}`;
  }
  onMotionBegan(e) {}
  onMotionFinished(e) {
    const n = this.motionToKey.get(e);
    if (!n) return;
    if (!this.activeSequence || n !== this.currentMotionKey) {
      this.startIdleSequenceIfConfigured();
      return;
    }
    if (this.activeSequence[this.currentStepIndex]?.loop) {
      this.logDebug("Looping motion completed cycle, continuing loop");
      return;
    }
    const i = this.currentStepIndex + 1;
    if (i < this.activeSequence.length) this.startSequenceStep(i, !1);
    else {
      const s = this.sequenceCallbacks;
      ((this.activeSequence = null),
        (this.currentStepIndex = 0),
        (this.currentMotionKey = null),
        (this.sequenceCallbacks = null),
        s?.onFinish && s.onFinish(),
        queueMicrotask(() => {
          this._motionManager.isFinished() &&
            this.startIdleSequenceIfConfigured();
        }));
    }
  }
  startIdleSequenceIfConfigured() {
    !this.idleSequence ||
      this.idleSequence.length === 0 ||
      ((this.activeSequence = this.idleSequence),
      (this.currentStepIndex = 0),
      (this.sequenceCallbacks = null),
      this.startSequenceStep(0, !1));
  }
  logInfo(e, ...n) {
    this.logger.info(`[Model ${this.id}] ${e}`, ...n);
  }
  logDebug(e, ...n) {
    this.logger.debug(`[Model ${this.id}] ${e}`, ...n);
  }
}
class ModelPaths {
  source;
  setting;
  loader;
  constructor(e, n, r) {
    ((this.source = e), (this.setting = n), (this.loader = r));
  }
  getSetting() {
    return this.setting;
  }
  getPaths() {
    const e = this.setting.getModelFileName();
    if (!e) throw new Error("Model file missing in model3.json");
    const n = this.loader.resolveModelPath(
        this.source.dir,
        this.source.modelJson,
      ),
      r = this.loader.resolveModelPath(this.source.dir, e),
      i = [],
      s = this.setting.getTextureCount();
    for (let _ = 0; _ < s; _++) {
      const m = this.setting.getTextureFileName(_);
      m && i.push(this.loader.resolveModelPath(this.source.dir, m));
    }
    const o = new Map();
    for (const [_, m] of Object.entries(this.source.textureVariants ?? {})) {
      const p = new Map();
      for (const [v, y] of Object.entries(m)) {
        const x = Number(v);
        if (x < 0 || x >= i.length)
          throw new Error(
            `Texture variant "${_}" targets slot ${v}, but the model has ${i.length} texture slots`,
          );
        p.set(x, this.loader.resolveModelPath(this.source.dir, y));
      }
      o.set(_, p);
    }
    const a = new Map(),
      l = this.setting.getExpressionCount();
    for (let _ = 0; _ < l; _++) {
      const m = this.setting.getExpressionName(_),
        p = this.setting.getExpressionFileName(_);
      m && p && a.set(m, this.loader.resolveModelPath(this.source.dir, p));
    }
    const c = new Map(),
      u = this.setting.getMotionGroupCount();
    for (let _ = 0; _ < u; _++) {
      const m = this.setting.getMotionGroupName(_),
        p = [],
        v = this.setting.getMotionCount(m);
      for (let y = 0; y < v; y++) {
        const x = this.setting.getMotionFileName(m, y);
        x && p.push(this.loader.resolveModelPath(this.source.dir, x));
      }
      c.set(m, p);
    }
    const d = this.setting.getPhysicsFileName(),
      f = this.setting.getPoseFileName(),
      h = this.setting.getUserDataFile();
    return {
      modelJsonUrl: n,
      mocUrl: r,
      textureUrls: i,
      textureVariantUrls: o,
      expressionUrls: a,
      motionUrls: c,
      physicsUrl: d ? this.loader.resolveModelPath(this.source.dir, d) : void 0,
      poseUrl: f ? this.loader.resolveModelPath(this.source.dir, f) : void 0,
      userDataUrl: h
        ? this.loader.resolveModelPath(this.source.dir, h)
        : void 0,
    };
  }
}
class ModelLoader {
  loader;
  logger;
  constructor(e, n) {
    ((this.loader = e), (this.logger = n));
  }
  async load(e) {
    const { source: n, gl: r, textureCache: i, plugins: s, signal: o } = e,
      a = e.premultipliedAlpha ?? !0,
      l = this.loader.resolveModelPath(n.dir, n.modelJson);
    this.logger.info("Fetching model setting %s", l);
    const c = await this.loader.loadArrayBuffer(l, o);
    throwIfAborted(o);
    const u = new CubismModelSettingJson(c, c.byteLength),
      d = new ModelPaths(n, u, this.loader),
      f = new Live2DModel(this.createModelId(n), u, this.logger),
      h = {
        loader: this.loader,
        textureCache: i,
        paths: d.getPaths(),
        gl: r,
        premultipliedAlpha: a,
        plugins: s,
        signal: o,
        mocConsistency: e.mocConsistency,
        motionConsistency: e.motionConsistency,
      };
    try {
      await f.initialize(h);
    } catch (_) {
      throw (f.release(), _);
    }
    return f;
  }
  createModelId(e) {
    return `${e.dir.replaceAll(/\W+/g, "_")}_${e.modelJson}`;
  }
}
function lce(t) {
  return `${t.url}|${t.premultiplied ? "p" : "np"}`;
}
class TextureCache {
  gl;
  logger;
  cache = new Map();
  constructor(e, n) {
    ((this.gl = e), (this.logger = n));
  }
  load(e, n, r, i) {
    const s = lce({ url: e, premultiplied: n }),
      o = this.cache.get(s);
    if (o) return o;
    const a = r.loadImageBitmap(e, i).then((l) => {
      if (i?.aborted)
        throw (
          l.close(),
          new DOMException("Live2D load aborted", "AbortError")
        );
      const c = l.width,
        u = l.height,
        d = this.gl.createTexture();
      if (!d) throw new Error("Failed to create WebGL texture");
      return (
        this.gl.bindTexture(this.gl.TEXTURE_2D, d),
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MIN_FILTER,
          this.gl.LINEAR_MIPMAP_LINEAR,
        ),
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MAG_FILTER,
          this.gl.LINEAR,
        ),
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, n ? 1 : 0),
        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          l,
        ),
        this.gl.generateMipmap(this.gl.TEXTURE_2D),
        this.gl.bindTexture(this.gl.TEXTURE_2D, null),
        l.close(),
        this.logger.debug("Loaded texture", e),
        { texture: d, width: c, height: u, premultiplied: n }
      );
    });
    return (
      this.cache.set(s, a),
      a.catch(() => {
        this.cache.get(s) === a && this.cache.delete(s);
      }),
      a
    );
  }
  invalidate() {
    this.cache.clear();
  }
  dispose() {
    for (const [, e] of this.cache)
      e.then(
        (n) => {
          this.gl.deleteTexture(n.texture);
        },
        () => {},
      );
    this.cache.clear();
  }
}
class Live2DEngine {
  // Core has a fixed function table. Reuse its callback across Framework lifetimes.
  static activeLogger = null;
  static coreLog = (message) => Live2DEngine.activeLogger?.info(message);
  disposed = false;
  static cubismRefCount = 0;
  config;
  logger;
  resourceLoader;
  sessions = new Set();
  constructor(e) {
    ((this.config = { ...ENGINE_DEFAULTS, ...e }),
      (this.logger = createLogger(this.config.logging)),
      (this.resourceLoader = new ResourceLoader(
        this.config.baseUrl,
        this.logger,
      )),
      Live2DEngine.acquireCubism(this.logger, this.config));
  }
  static create(e) {
    return new Live2DEngine(e);
  }
  createSession(e) {
    this.logger.debug("CREATING session");
    const n = new Live2DSession(e, this);
    return (this.sessions.add(n), n);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const e of Array.from(this.sessions)) e.destroy();
    Live2DEngine.releaseCubism(this.logger);
  }
  detachSession(e) {
    this.sessions.delete(e);
  }
  getResourceLoader() {
    return this.resourceLoader;
  }
  getLogger() {
    return this.logger;
  }
  getConfig() {
    return this.config;
  }
  static acquireCubism(e, n) {
    Live2DEngine.activeLogger = e;
    if (Live2DEngine.cubismRefCount === 0) {
      if (!CubismFramework.isStarted()) {
        const r = new _ae();
        ((r.loggingLevel = Live2DEngine.toCubismLogLevel(n.logging)),
          (r.logFunction = Live2DEngine.coreLog),
          CubismFramework.startUp(r),
          e.info("CubismFramework started"));
      }
      CubismFramework.isInitialized() ||
        (CubismFramework.initialize(), e.info("CubismFramework initialized"));
    }
    Live2DEngine.cubismRefCount++;
  }
  static releaseCubism(e) {
    Live2DEngine.cubismRefCount !== 0 &&
      (Live2DEngine.cubismRefCount--,
      Live2DEngine.cubismRefCount === 0 &&
        (CubismFramework.dispose(),
        CubismFramework.cleanUp(),
        (Live2DEngine.activeLogger = null),
        e.info("CubismFramework disposed")));
  }
  static toCubismLogLevel(e) {
    switch (e) {
      case "debug":
        return Zo.LogLevel_Verbose;
      case "info":
        return Zo.LogLevel_Info;
      case "error":
        return Zo.LogLevel_Error;
      default:
        return Zo.LogLevel_Off;
    }
  }
}
class Live2DSession {
  destroyed = false;
  engine;
  canvasSession;
  camera;
  input;
  modelLoader;
  textureCache;
  basePlugins;
  premultipliedAlpha;
  tapListeners = new Set();
  dragListeners = new Set();
  currentModel = null;
  currentModelAbort = null;
  running = !1;
  restoringGraphics = !1;
  lastDragX = 0;
  lastDragY = 0;
  constructor(e, n) {
    ((this.engine = n),
      (this.canvasSession = new CanvasSession(
        e.canvas,
        e.render,
        n.getLogger(),
      )),
      (this.camera = new Camera(e.camera)),
      (this.modelLoader = new ModelLoader(
        n.getResourceLoader(),
        n.getLogger(),
      )),
      (this.textureCache = new TextureCache(
        this.canvasSession.getContext(),
        n.getLogger(),
      )),
      (this.basePlugins = e.plugins ? [...e.plugins] : []),
      (this.premultipliedAlpha =
        e.render?.premultipliedAlpha ??
        RENDER_DEFAULTS.premultipliedAlpha ??
        !0));
    const r = {
      onDrag: (i, s, o, a) => {
        (this.currentModel?.setDragging(i, s),
          (this.lastDragX = i),
          (this.lastDragY = s),
          this.emitPointerDrag({
            phase: a,
            modelX: i,
            modelY: s,
            target: o.target,
          }));
      },
      onDragEnd: (i) => {
        (this.currentModel?.setDragging(0, 0),
          this.emitPointerDrag({
            phase: "end",
            modelX: this.lastDragX,
            modelY: this.lastDragY,
            target: i.target,
          }));
      },
      onTap: (i, s) => {
        this.emitTap(i, s);
      },
    };
    ((this.input = new PointerInput(e.canvas, e.input, this.camera, r)),
      this.canvasSession.setOnContextRestored(() => {
        this.restoreGraphicsAfterContextLoss();
      }));
  }
  async restoreGraphicsAfterContextLoss() {
    if (this.restoringGraphics) return;
    this.restoringGraphics = !0;
    const e = this.engine.getLogger();
    try {
      (this.textureCache.invalidate(),
        CubismShaderManager_WebGL.getInstance().invalidateGlContext(
          this.canvasSession.getContext(),
        ),
        await this.currentModel?.restoreGraphics(),
        e.info("Live2D session recovered from WebGL context loss"));
    } catch (n) {
      e.error("Live2D context-restore rebuild failed", n);
    } finally {
      this.restoringGraphics = !1;
    }
  }
  get canvas() {
    return this.canvasSession.getCanvasElement();
  }
  get model() {
    return this.currentModel;
  }
  get framesRendered() {
    return this.canvasSession.framesRendered;
  }
  onTap(e) {
    return (
      this.engine.getLogger().debug("onTap registered", e),
      this.tapListeners.add(e),
      this.engine.getLogger().debug("now listeners", this.tapListeners),
      () => {
        (this.engine.getLogger().debug("onTap unregistered", e),
          this.tapListeners.delete(e));
      }
    );
  }
  onPointerDrag(e) {
    return (
      this.dragListeners.add(e),
      () => {
        this.dragListeners.delete(e);
      }
    );
  }
  async loadModel(e, n) {
    if (this.destroyed) throw new Error("Session is destroyed");
    this.cancelInFlightLoad();
    const r = new AbortController();
    this.currentModelAbort = r;
    const i = await this.modelLoader.load({
      source: e,
      gl: this.canvasSession.getContext(),
      textureCache: this.textureCache,
      plugins: [...this.basePlugins, ...(n ?? [])],
      signal: r.signal,
      premultipliedAlpha: this.premultipliedAlpha,
    });
    if (this.destroyed || r.signal.aborted || this.currentModelAbort !== r) {
      i.release();
      throw new DOMException("Model load cancelled", "AbortError");
    }
    return (
      this.currentModel?.release(),
      (this.currentModel = i),
      this.input.setCurrentModel(i),
      (this.currentModelAbort = null),
      i
    );
  }
  replaceModel(e, n) {
    return this.loadModel(e, n);
  }
  start() {
    this.running ||
      ((this.running = !0),
      this.canvasSession.start(
        ({ deltaTimeSeconds: e, width: n, height: r }) => {
          if (!this.currentModel || this.restoringGraphics) return;
          const i = this.camera.getProjection(this.currentModel, n, r);
          (this.currentModel.update(e),
            this.currentModel.draw(i, [0, 0, n, r]));
        },
      ));
  }
  stop() {
    ((this.running = !1), this.canvasSession.stop());
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    (this.stop(),
      this.cancelInFlightLoad(),
      this.input.destroy(),
      this.currentModel?.release(),
      (this.currentModel = null),
      this.tapListeners.clear(),
      this.dragListeners.clear(),
      this.textureCache.dispose(),
      this.canvasSession.destroy(),
      this.engine.detachSession(this));
  }
  updateCameraScale(e) {
    this.camera.setViewScale(e);
  }
  updateCameraOffsets(e, n) {
    this.camera.setOffsets(e, n);
  }
  setResolution(e) {
    this.canvasSession.setResolution(e);
  }
  setMaxFps(e) {
    this.canvasSession.setMaxFps(e);
  }
  emitTap(e, n) {
    if (this.tapListeners.size === 0) return;
    this.engine.getLogger().debug("listeners", this.tapListeners);
    const r = this.currentModel?.hitTestArea(e, n) ?? void 0,
      i = { modelX: e, modelY: n, hitAreaName: r };
    for (const s of this.tapListeners) s(i);
  }
  emitPointerDrag(e) {
    for (const n of this.dragListeners) n(e);
  }
  cancelInFlightLoad() {
    this.currentModelAbort &&
      (this.currentModelAbort.abort("Cancelled"),
      (this.currentModelAbort = null));
  }
}
const PARAMETER_IDS = Object.freeze({
  HitAreaPrefix: "HitArea",
  HitAreaHead: "Head",
  HitAreaBody: "Body",
  PartsIdCore: "Parts01Core",
  PartsArmPrefix: "Parts01Arm_",
  PartsArmLPrefix: "Parts01ArmL_",
  PartsArmRPrefix: "Parts01ArmR_",
  ParamAngleX: "ParamAngleX",
  ParamAngleY: "ParamAngleY",
  ParamAngleZ: "ParamAngleZ",
  ParamEyeLOpen: "ParamEyeLOpen",
  ParamEyeLSmile: "ParamEyeLSmile",
  ParamEyeROpen: "ParamEyeROpen",
  ParamEyeRSmile: "ParamEyeRSmile",
  ParamEyeBallX: "ParamEyeBallX",
  ParamEyeBallY: "ParamEyeBallY",
  ParamEyeBallForm: "ParamEyeBallForm",
  ParamBrowLY: "ParamBrowLY",
  ParamBrowRY: "ParamBrowRY",
  ParamBrowLX: "ParamBrowLX",
  ParamBrowRX: "ParamBrowRX",
  ParamBrowLAngle: "ParamBrowLAngle",
  ParamBrowRAngle: "ParamBrowRAngle",
  ParamBrowLForm: "ParamBrowLForm",
  ParamBrowRForm: "ParamBrowRForm",
  ParamMouthForm: "ParamMouthForm",
  ParamMouthOpenY: "ParamMouthOpenY",
  ParamCheek: "ParamCheek",
  ParamBodyAngleX: "ParamBodyAngleX",
  ParamBodyAngleY: "ParamBodyAngleY",
  ParamBodyAngleZ: "ParamBodyAngleZ",
  ParamBreath: "ParamBreath",
  ParamArmLA: "ParamArmLA",
  ParamArmRA: "ParamArmRA",
  ParamArmLB: "ParamArmLB",
  ParamArmRB: "ParamArmRB",
  ParamHandL: "ParamHandL",
  ParamHandR: "ParamHandR",
  ParamHairFront: "ParamHairFront",
  ParamHairSide: "ParamHairSide",
  ParamHairBack: "ParamHairBack",
  ParamHairFluffy: "ParamHairFluffy",
  ParamShoulderY: "ParamShoulderY",
  ParamBustX: "ParamBustX",
  ParamBustY: "ParamBustY",
  ParamBaseX: "ParamBaseX",
  ParamBaseY: "ParamBaseY",
  ParamNONE: "NONE:",
});
var G5;
((t) => {
  ((t.HitAreaBody = PARAMETER_IDS.HitAreaBody),
    (t.HitAreaHead = PARAMETER_IDS.HitAreaHead),
    (t.HitAreaPrefix = PARAMETER_IDS.HitAreaPrefix),
    (t.ParamAngleX = PARAMETER_IDS.ParamAngleX),
    (t.ParamAngleY = PARAMETER_IDS.ParamAngleY),
    (t.ParamAngleZ = PARAMETER_IDS.ParamAngleZ),
    (t.ParamArmLA = PARAMETER_IDS.ParamArmLA),
    (t.ParamArmLB = PARAMETER_IDS.ParamArmLB),
    (t.ParamArmRA = PARAMETER_IDS.ParamArmRA),
    (t.ParamArmRB = PARAMETER_IDS.ParamArmRB),
    (t.ParamBaseX = PARAMETER_IDS.ParamBaseX),
    (t.ParamBaseY = PARAMETER_IDS.ParamBaseY),
    (t.ParamBodyAngleX = PARAMETER_IDS.ParamBodyAngleX),
    (t.ParamBodyAngleY = PARAMETER_IDS.ParamBodyAngleY),
    (t.ParamBodyAngleZ = PARAMETER_IDS.ParamBodyAngleZ),
    (t.ParamBreath = PARAMETER_IDS.ParamBreath),
    (t.ParamBrowLAngle = PARAMETER_IDS.ParamBrowLAngle),
    (t.ParamBrowLForm = PARAMETER_IDS.ParamBrowLForm),
    (t.ParamBrowLX = PARAMETER_IDS.ParamBrowLX),
    (t.ParamBrowLY = PARAMETER_IDS.ParamBrowLY),
    (t.ParamBrowRAngle = PARAMETER_IDS.ParamBrowRAngle),
    (t.ParamBrowRForm = PARAMETER_IDS.ParamBrowRForm),
    (t.ParamBrowRX = PARAMETER_IDS.ParamBrowRX),
    (t.ParamBrowRY = PARAMETER_IDS.ParamBrowRY),
    (t.ParamBustX = PARAMETER_IDS.ParamBustX),
    (t.ParamBustY = PARAMETER_IDS.ParamBustY),
    (t.ParamCheek = PARAMETER_IDS.ParamCheek),
    (t.ParamEyeBallForm = PARAMETER_IDS.ParamEyeBallForm),
    (t.ParamEyeBallX = PARAMETER_IDS.ParamEyeBallX),
    (t.ParamEyeBallY = PARAMETER_IDS.ParamEyeBallY),
    (t.ParamEyeLOpen = PARAMETER_IDS.ParamEyeLOpen),
    (t.ParamEyeLSmile = PARAMETER_IDS.ParamEyeLSmile),
    (t.ParamEyeROpen = PARAMETER_IDS.ParamEyeROpen),
    (t.ParamEyeRSmile = PARAMETER_IDS.ParamEyeRSmile),
    (t.ParamHairBack = PARAMETER_IDS.ParamHairBack),
    (t.ParamHairFluffy = PARAMETER_IDS.ParamHairFluffy),
    (t.ParamHairFront = PARAMETER_IDS.ParamHairFront),
    (t.ParamHairSide = PARAMETER_IDS.ParamHairSide),
    (t.ParamHandL = PARAMETER_IDS.ParamHandL),
    (t.ParamHandR = PARAMETER_IDS.ParamHandR),
    (t.ParamMouthForm = PARAMETER_IDS.ParamMouthForm),
    (t.ParamMouthOpenY = PARAMETER_IDS.ParamMouthOpenY),
    (t.ParamNONE = PARAMETER_IDS.ParamNONE),
    (t.ParamShoulderY = PARAMETER_IDS.ParamShoulderY),
    (t.PartsArmLPrefix = PARAMETER_IDS.PartsArmLPrefix),
    (t.PartsArmPrefix = PARAMETER_IDS.PartsArmPrefix),
    (t.PartsArmRPrefix = PARAMETER_IDS.PartsArmRPrefix),
    (t.PartsIdCore = PARAMETER_IDS.PartsIdCore));
})(G5 || (G5 = {}));
const dce = {
  angleXMultiplier: 30,
  angleYMultiplier: 30,
  angleZMultiplier: -30,
  bodyAngleXMultiplier: 10,
  eyeBallXMultiplier: 1,
  eyeBallYMultiplier: 1,
};
function createDragPlugin(t = {}) {
  const e = { ...dce, ...t };
  return {
    id: "dragToLook",
    install() {
      const n = CubismFramework.getIdManager(),
        r = new CubismTargetPoint(),
        i = n.getId(PARAMETER_IDS.ParamAngleX),
        s = n.getId(PARAMETER_IDS.ParamAngleY),
        o = n.getId(PARAMETER_IDS.ParamAngleZ),
        a = n.getId(PARAMETER_IDS.ParamEyeBallX),
        l = n.getId(PARAMETER_IDS.ParamEyeBallY),
        c = n.getId(PARAMETER_IDS.ParamBodyAngleX);
      let u = e.enabled ?? !0;
      return {
        get enabled() {
          return u;
        },
        setEnabled(d) {
          u = d;
        },
        setDragTarget(d, f) {
          r.set(d, f);
        },
        update(d) {
          if (!u) return;
          const f = d.model.model;
          if (!f) return;
          r.update(d.deltaTimeSeconds);
          const h = r.getX(),
            _ = r.getY();
          (f.addParameterValueById(i, h * e.angleXMultiplier),
            f.addParameterValueById(s, _ * e.angleYMultiplier),
            f.addParameterValueById(o, h * _ * e.angleZMultiplier),
            f.addParameterValueById(c, h * e.bodyAngleXMultiplier),
            f.addParameterValueById(a, h * e.eyeBallXMultiplier),
            f.addParameterValueById(l, _ * e.eyeBallYMultiplier));
        },
        dispose() {},
      };
    },
  };
}
function createBlinkPlugin(t = {}) {
  return {
    id: "eyeBlink",
    install(e) {
      if (e.getSetting().getEyeBlinkParameterCount() === 0)
        return (
          e.logInfo("No eye blink parameters found. EyeBlink plugin disabled."),
          fce()
        );
      const n = CubismEyeBlink.create(e.getSetting());
      let r = t.enabled ?? !0;
      return {
        get enabled() {
          return r;
        },
        setEnabled(i) {
          r = i;
        },
        update(i) {
          if (!r || i.motionUpdated) return;
          const s = i.model.model;
          s && n.updateParameters(s, i.deltaTimeSeconds);
        },
        dispose() {
          CubismEyeBlink.delete(n);
        },
      };
    },
  };
}
function fce() {
  return { enabled: !1, setEnabled() {}, update() {}, dispose() {} };
}
function createBreathPlugin(t = {}) {
  return {
    id: "breath",
    install() {
      const e = CubismBreath.create();
      e.setParameters(hce());
      let n = t.enabled ?? !0;
      return {
        get enabled() {
          return n;
        },
        setEnabled(r) {
          n = r;
        },
        update(r) {
          if (!n) return;
          const i = r.model.model;
          i && e.updateParameters(i, r.deltaTimeSeconds);
        },
        dispose() {
          CubismBreath.delete(e);
        },
      };
    },
  };
}
function hce() {
  const t = new csmVector(),
    e = CubismFramework.getIdManager();
  return (
    t.pushBack(new Wd(e.getId(PARAMETER_IDS.ParamAngleX), 0, 15, 6.5345, 0.5)),
    t.pushBack(new Wd(e.getId(PARAMETER_IDS.ParamAngleY), 0, 8, 3.5345, 0.5)),
    t.pushBack(new Wd(e.getId(PARAMETER_IDS.ParamAngleZ), 0, 10, 5.5345, 0.5)),
    t.pushBack(
      new Wd(e.getId(PARAMETER_IDS.ParamBodyAngleX), 0, 4, 15.5345, 0.5),
    ),
    t.pushBack(new Wd(e.getId("ParamBreath"), 0.5, 0.5, 3.2345, 0.5)),
    t
  );
}
function createPhysicsPlugin(t = {}) {
  return {
    id: "physics",
    install(e) {
      if (!e.hasPhysics() && !e.hasPose()) return pce();
      let n = t.enabled ?? !0;
      return {
        get enabled() {
          return n;
        },
        setEnabled(r) {
          n = r;
        },
        update(r) {
          n &&
            (e.hasPhysics() && e.evaluatePhysics(r.deltaTimeSeconds),
            e.hasPose() && e.updatePose(r.deltaTimeSeconds));
        },
        dispose() {},
      };
    },
  };
}
function pce() {
  return { enabled: !1, setEnabled() {}, update() {}, dispose() {} };
}
function Tu(t) {
  return CubismFramework.getIdManager().getId(t);
}
function createLipSyncPlugin(t = {}) {
  return {
    id: "lipSync",
    install(e) {
      const n = e.getLipSyncIds();
      if (n.getSize() === 0) return mce();
      let r = t.enabled ?? !1,
        i = 0;
      const s = t.smoothingUp ?? 0.5,
        o = t.smoothingDown ?? 0.3,
        a = Tu("ParamMouthForm");
      return {
        get enabled() {
          return r;
        },
        setEnabled(l) {
          ((r = l), l || (i = 0));
        },
        update(l) {
          if (!r) return;
          const c = l.model.model;
          if (!c) return;
          const u = t.getAmplitude?.() ?? 0,
            d = u > i ? s : o;
          i += (u - i) * d;
          const f = t.getIntensity?.() ?? 1,
            h = i * f,
            _ = t.getExpressionBlend?.(e.getActiveExpressions()) ?? 1,
            m = Number.isFinite(_) ? Math.max(0, Math.min(1, _)) : 1;
          for (let v = 0; v < n.getSize(); v++)
            c.setParameterValueById(n.at(v), h, m);
          const p = t.getFormConstant?.() ?? null;
          if (p !== null) c.setParameterValueById(a, p, m);
          else {
            const v = t.getFormIntensity?.() ?? 0;
            v !== 0 && c.setParameterValueById(a, i * v, m);
          }
        },
        dispose() {},
      };
    },
  };
}
function mce() {
  return { enabled: !1, setEnabled() {}, update() {}, dispose() {} };
}

export {
  Live2DEngine,
  createDragPlugin,
  createBlinkPlugin,
  createBreathPlugin,
  createPhysicsPlugin,
  createLipSyncPlugin,
};
