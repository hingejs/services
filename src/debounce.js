const Debounce = (func, wait = 50) => {
  let timer
  return params => {
    if (timer) {
      window.clearTimeout(timer)
    }
    timer = window.setTimeout(func, wait, params)
  }
}
export default Debounce
