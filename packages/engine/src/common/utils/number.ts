// number-precision
export function stripNum(num, precision = 12) {
  return +parseFloat(num.toPrecision(precision));
}
