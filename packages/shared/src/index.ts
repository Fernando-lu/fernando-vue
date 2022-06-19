export function isObject(o) {
  return typeof o === 'object' && o !== null
}

export function isFunction(o) {
  return typeof o === 'function'
}

export function isArray(o) {
  return Array.isArray(o)
}

export function isString(o) {
  return typeof o === 'string'
}

export function isNumber(o) {
  return typeof o === 'number'
}