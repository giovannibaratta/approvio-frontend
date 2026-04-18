/**
 * A generic debounce function that delays the execution of the provided function
 * until after `waitFor` milliseconds have elapsed since the last time it was invoked.
 *
 * @param func The function to debounce.
 * @param waitFor The number of milliseconds to delay.
 * @returns A debounced version of the function with a `.clear()` method.
 */
export function debounce<A extends unknown[], R>(func: (...args: A) => R, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null

  const debounced = (...args: A) => {
    if (timeout !== null) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), waitFor)
  }

  debounced.clear = () => {
    if (timeout !== null) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return debounced
}
