/**
 * @param {{ timestamp: string }} a
 * @param {{ timestamp: string }} b
 */
export function sortByTimestampAsc(a, b) {
  if (a.timestamp > b.timestamp) {
    return 1
  }

  if (a.timestamp < b.timestamp) {
    return -1
  }

  return 0
}

/**
 * @param {{ timestamp: string }} a
 * @param {{ timestamp: string }} b
 */
function sortByTimestampDesc(a, b) {
  if (a.timestamp < b.timestamp) {
    return 1
  }

  if (a.timestamp > b.timestamp) {
    return -1
  }

  return 0
}

export function sortByTimestamp(direction = 'desc') {
  if (direction === 'asc') {
    return sortByTimestampAsc
  }

  if (direction === 'desc') {
    return sortByTimestampDesc
  }
}
