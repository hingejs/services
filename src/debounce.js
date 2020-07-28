const Debounce = (func, wait = 50) => {
  let timer
  return (...params) => {
    if (timer) {
      globalThis.clearTimeout(timer)
    }
    timer = globalThis.setTimeout(func.bind.apply(func, [null].concat(params)), wait)
  }
}
export default Debounce
