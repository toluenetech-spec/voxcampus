/**
 * Single data-access entry point.
 *
 * Every view imports Firestore helpers from here instead of
 * `firebase/firestore`. That lets the app swap the real backend for the
 * in-memory demo store (used when Firebase is unreachable or when the user
 * picks "Explore the demo") without touching a single component.
 */
import * as cloud from 'firebase/firestore'
import * as local from '../lib/localDb'
import { db as cloudDb } from '../firebase/config'

let useLocal = false

/** Live binding: importers observe the active backend when it changes. */
export let db = cloudDb

export function setBackend(isLocal) {
  useLocal = Boolean(isLocal)
  db = useLocal ? local.localDb : cloudDb
}

export const isLocalBackend = () => useLocal

export const collection = (...args) => (useLocal ? local.collection(...args) : cloud.collection(...args))
export const doc = (...args) => (useLocal ? local.doc(...args) : cloud.doc(...args))
export const where = (...args) => (useLocal ? local.where(...args) : cloud.where(...args))
export const orderBy = (...args) => (useLocal ? local.orderBy(...args) : cloud.orderBy(...args))
export const limit = (...args) => (useLocal ? local.limit(...args) : cloud.limit(...args))
export const query = (...args) => (useLocal ? local.query(...args) : cloud.query(...args))
export const onSnapshot = (...args) => (useLocal ? local.onSnapshot(...args) : cloud.onSnapshot(...args))
export const getDoc = (...args) => (useLocal ? local.getDoc(...args) : cloud.getDoc(...args))
export const getDocs = (...args) => (useLocal ? local.getDocs(...args) : cloud.getDocs(...args))
export const setDoc = (...args) => (useLocal ? local.setDoc(...args) : cloud.setDoc(...args))
export const updateDoc = (...args) => (useLocal ? local.updateDoc(...args) : cloud.updateDoc(...args))
export const addDoc = (...args) => (useLocal ? local.addDoc(...args) : cloud.addDoc(...args))
export const deleteDoc = (...args) => (useLocal ? local.deleteDoc(...args) : cloud.deleteDoc(...args))

export const serverTimestamp = () => (useLocal ? local.serverTimestamp() : cloud.serverTimestamp())
export const increment = (n) => (useLocal ? local.increment(n) : cloud.increment(n))
export const arrayUnion = (...values) => (useLocal ? local.arrayUnion(...values) : cloud.arrayUnion(...values))
export const arrayRemove = (...values) => (useLocal ? local.arrayRemove(...values) : cloud.arrayRemove(...values))
