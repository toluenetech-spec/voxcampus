/**
 * A tiny, Firestore-shaped, in-memory document store.
 *
 * It exists so VoxCampus is fully browsable when the Firebase backend is
 * unreachable (offline dev, sandbox preview, demo deployments). It implements
 * only the subset of the Firestore API the app actually uses, and it is
 * wired in through `src/services/store.js` — application code never imports
 * this file directly, so swapping backends is a one-line decision.
 */

const STORAGE_KEY = 'voxcampus_demo_db_v1'

/* ------------------------------------------------------------------ *
 * Timestamps
 * ------------------------------------------------------------------ */

export class LocalTimestamp {
  constructor(millis = Date.now()) {
    this.millis = millis
  }

  toMillis() {
    return this.millis
  }

  toDate() {
    return new Date(this.millis)
  }

  get seconds() {
    return Math.floor(this.millis / 1000)
  }

  get nanoseconds() {
    return (this.millis % 1000) * 1e6
  }

  isEqual(other) {
    return Boolean(other) && other.millis === this.millis
  }

  valueOf() {
    return this.millis
  }

  toJSON() {
    return { __localTimestamp: this.millis }
  }
}

/* ------------------------------------------------------------------ *
 * Field sentinels
 * ------------------------------------------------------------------ */

export const serverTimestamp = () => ({ __op: 'serverTimestamp' })
export const increment = (n = 1) => ({ __op: 'increment', n })
export const arrayUnion = (...values) => ({ __op: 'arrayUnion', values })
export const arrayRemove = (...values) => ({ __op: 'arrayRemove', values })
export const deleteField = () => ({ __op: 'deleteField' })

const isSentinel = (value) =>
  Boolean(value) && typeof value === 'object' && typeof value.__op === 'string'

const isTimestamp = (value) => value instanceof LocalTimestamp

/* ------------------------------------------------------------------ *
 * Query / reference shapes
 * ------------------------------------------------------------------ */

const makeCollectionRef = (path) => ({ __local: true, kind: 'collection', path, constraints: [] })
const makeDocRef = (path, id) => ({ __local: true, kind: 'doc', path, id })

export const collection = (_db, path) => makeCollectionRef(path)

export function doc(dbOrRef, pathOrId, maybeId) {
  // doc(collectionRef, id)
  if (dbOrRef && dbOrRef.kind === 'collection') return makeDocRef(dbOrRef.path, pathOrId)
  // doc(db, 'users', uid)
  return makeDocRef(pathOrId, maybeId)
}

export const where = (field, op, value) => ({ __op: 'where', field, op, value })
export const orderBy = (field, direction = 'asc') => ({ __op: 'orderBy', field, direction })
export const limit = (n) => ({ __op: 'limit', n })

export function query(ref, ...constraints) {
  return { ...ref, constraints: [...(ref.constraints ?? []), ...constraints] }
}

/* ------------------------------------------------------------------ *
 * Snapshots
 * ------------------------------------------------------------------ */

const toDocSnapshot = (id, data) => ({
  id,
  exists: () => data !== undefined && data !== null,
  data: () => data,
  get: (field) => data?.[field],
})

const toQuerySnapshot = (docs) => {
  const list = docs.map(({ id, data }) => ({
    id,
    data: () => data,
    get: (field) => data?.[field],
  }))

  return {
    docs: list,
    empty: list.length === 0,
    size: list.length,
    forEach: (cb) => list.forEach(cb),
  }
}

/* ------------------------------------------------------------------ *
 * Store
 * ------------------------------------------------------------------ */

class LocalDb {
  constructor() {
    this.collections = new Map()
    this.listeners = new Set()
    this.saveHandle = null
    this.load()
  }

  /* ---------------- persistence ---------------- */

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw, (_key, value) => {
        if (value && typeof value === 'object' && typeof value.__localTimestamp === 'number') {
          return new LocalTimestamp(value.__localTimestamp)
        }
        return value
      })
      // JSON cannot express Maps, so rebuild them: every bucket must come back
      // as a Map or the store throws on the first read after a reload.
      this.collections = new Map(
        Object.entries(parsed ?? {}).map(([path, docs]) => [path, new Map(Object.entries(docs ?? {}))]),
      )
    } catch (error) {
      console.warn('[localDb] could not restore demo data, starting fresh', error)
      this.collections = new Map()
    }
  }

  scheduleSave() {
    if (this.saveHandle) return
    this.saveHandle = setTimeout(() => {
      this.saveHandle = null
      try {
        // `JSON.stringify` silently turns Maps into `{}`, so convert first.
        const plain = {}
        this.collections.forEach((docs, path) => {
          plain[path] = Object.fromEntries(docs)
        })
        localStorage.setItem(STORAGE_KEY, JSON.stringify(plain))
      } catch {
        /* storage full or unavailable — demo data simply won't persist */
      }
    }, 250)
  }

  reset() {
    this.collections = new Map()
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    this.notify()
  }

  /* ---------------- internals ---------------- */

  bucket(path) {
    if (!this.collections.has(path)) this.collections.set(path, new Map())
    return this.collections.get(path)
  }

  rawDocs(path) {
    return [...this.bucket(path).entries()].map(([id, data]) => ({ id, data }))
  }

  matches(data, constraints = []) {
    return constraints.every((c) => {
      if (c.__op !== 'where') return true
      const value = data?.[c.field]
      switch (c.op) {
        case '==':
          return value === c.value
        case '!=':
          return value !== c.value
        case 'array-contains':
          return Array.isArray(value) && value.includes(c.value)
        case 'array-contains-any':
          return Array.isArray(value) && c.value.some((v) => value.includes(v))
        case 'in':
          return Array.isArray(c.value) && c.value.includes(value)
        default:
          return true
      }
    })
  }

  runQuery(ref) {
    const constraints = ref.constraints ?? []
    const docs = this.rawDocs(ref.path).filter(({ data }) => this.matches(data, constraints))

    const sortConstraint = constraints.find((c) => c.__op === 'orderBy')
    if (sortConstraint) {
      const dir = sortConstraint.direction === 'desc' ? -1 : 1
      docs.sort((a, b) => {
        const av = a.data?.[sortConstraint.field]
        const bv = b.data?.[sortConstraint.field]
        const an = av?.millis ?? av
        const bn = bv?.millis ?? bv
        if (an === bn) return 0
        return (an > bn ? 1 : -1) * dir
      })
    }

    // Newest first by default so freshly created items appear immediately.
    if (!sortConstraint) {
      docs.sort((a, b) => (b.data?.createdAt?.millis ?? 0) - (a.data?.createdAt?.millis ?? 0))
    }

    const limitConstraint = constraints.find((c) => c.__op === 'limit')
    return toQuerySnapshot(limitConstraint ? docs.slice(0, limitConstraint.n) : docs)
  }

  notify(paths) {
    this.scheduleSave()
    this.listeners.forEach(({ ref, onNext }) => {
      if (paths && !paths.includes(ref.path)) return
      try {
        if (ref.kind === 'doc') {
          onNext(toDocSnapshot(ref.id, this.bucket(ref.path).get(ref.id)))
        } else {
          onNext(this.runQuery(ref))
        }
      } catch (error) {
        console.error('[localDb] listener error', error)
      }
    })
  }

  resolve(current, data) {
    const next = { ...(current ?? {}) }
    Object.entries(data).forEach(([field, value]) => {
      if (isSentinel(value)) {
        switch (value.__op) {
          case 'serverTimestamp':
            next[field] = new LocalTimestamp()
            break
          case 'increment':
            next[field] = (Number(next[field]) || 0) + value.n
            break
          case 'arrayUnion': {
            const arr = Array.isArray(next[field]) ? next[field] : []
            next[field] = [...arr, ...value.values.filter((v) => !arr.includes(v))]
            break
          }
          case 'arrayRemove': {
            const arr = Array.isArray(next[field]) ? next[field] : []
            next[field] = arr.filter((v) => !value.values.includes(v))
            break
          }
          case 'deleteField':
            delete next[field]
            break
          default:
            break
        }
      } else {
        next[field] = value
      }
    })
    return next
  }

  /* ---------------- public API ---------------- */

  onSnapshot(ref, onNext) {
    const entry = { ref, onNext }
    this.listeners.add(entry)
    // Firestore emits an initial snapshot asynchronously.
    Promise.resolve().then(() => {
      if (!this.listeners.has(entry)) return
      if (ref.kind === 'doc') {
        onNext(toDocSnapshot(ref.id, this.bucket(ref.path).get(ref.id)))
      } else {
        onNext(this.runQuery(ref))
      }
    })
    return () => this.listeners.delete(entry)
  }

  getDoc(ref) {
    return Promise.resolve(toDocSnapshot(ref.id, this.bucket(ref.path).get(ref.id)))
  }

  getDocs(ref) {
    return Promise.resolve(this.runQuery(ref))
  }

  setDoc(ref, data, options = {}) {
    const current = this.bucket(ref.path).get(ref.id)
    const resolved = this.resolve(options.merge === false ? undefined : current, data)
    this.bucket(ref.path).set(ref.id, resolved)
    this.notify([ref.path])
    return Promise.resolve()
  }

  updateDoc(ref, data) {
    const path = ref.path
    const bucket = this.bucket(path)
    if (!bucket.has(ref.id)) {
      // Firestore would reject this; for demo purposes an upsert keeps the UI
      // from getting stuck on half-written profiles.
      bucket.set(ref.id, this.resolve(undefined, data))
    } else {
      bucket.set(ref.id, this.resolve(bucket.get(ref.id), data))
    }
    this.notify([path])
    return Promise.resolve()
  }

  addDoc(ref, data) {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 20)
        : Math.random().toString(36).slice(2, 22)
    this.bucket(ref.path).set(id, this.resolve(undefined, data))
    this.notify([ref.path])
    return Promise.resolve(makeDocRef(ref.path, id))
  }

  deleteDoc(ref) {
    this.bucket(ref.path).delete(ref.id)
    this.notify([ref.path])
    return Promise.resolve()
  }

  /* ---------------- seeding ---------------- */

  seed(collections = {}) {
    Object.entries(collections).forEach(([path, docs]) => {
      const bucket = this.bucket(path)
      Object.entries(docs).forEach(([id, data]) => {
        if (bucket.has(id)) return
        bucket.set(id, this.deserialize(data))
      })
    })
    this.notify()
  }

  deserialize(value) {
    if (Array.isArray(value)) return value.map((v) => this.deserialize(v))
    if (value && typeof value === 'object') {
      if (typeof value.__localTimestamp === 'number') return new LocalTimestamp(value.__localTimestamp)
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, this.deserialize(v)]))
    }
    return value
  }
}

export const localDb = new LocalDb()

/* ------------------------------------------------------------------ *
 * Function-style API (mirrors the modular Firestore SDK)
 * ------------------------------------------------------------------ */

export function onSnapshot(ref, onNext) {
  const unsubscribe = localDb.onSnapshot(ref, onNext)
  return unsubscribe
}

export function getDoc(ref) {
  return localDb.getDoc(ref)
}

export function getDocs(ref) {
  return localDb.getDocs(ref)
}

export function setDoc(ref, data, options) {
  return localDb.setDoc(ref, data, options)
}

export function updateDoc(ref, data) {
  return localDb.updateDoc(ref, data)
}

export function addDoc(ref, data) {
  return localDb.addDoc(ref, data)
}

export function deleteDoc(ref) {
  return localDb.deleteDoc(ref)
}

export { isTimestamp }
