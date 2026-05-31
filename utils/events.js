let listeners = {}

function on(eventName, callback) {
  if (!listeners[eventName]) {
    listeners[eventName] = []
  }
  listeners[eventName].push(callback)
}

function off(eventName, callback) {
  if (!listeners[eventName]) return
  listeners[eventName] = listeners[eventName].filter(function (fn) {
    return fn !== callback
  })
}

function emit(eventName, data) {
  if (!listeners[eventName]) return
  listeners[eventName].forEach(function (fn) {
    fn(data)
  })
}

module.exports = {
  on: on,
  off: off,
  emit: emit,
}
