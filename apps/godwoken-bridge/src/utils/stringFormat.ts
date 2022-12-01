export function truncateMiddle(str: string, first = 40, last = 6) {
  if (str.length < first + last) {
    return str;
  }
  return str.substring(0, first) + "..." + str.substring(str.length - last);
}

export function truncateEthAddress(address: string) {
  return truncateMiddle(address, 5, 4);
}

export function truncateCkbAddress(address: string) {
  return truncateMiddle(address, 11, 11);
}

export function truncateDotBitAlias(address: string) {
  return truncateMiddle(address, 4, 8);
}
