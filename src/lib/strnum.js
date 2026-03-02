/**
 * Vendored strnum@2.1.2 for fast-xml-parser (pnpm resolution issue in Next.js bundle).
 * Source: https://github.com/NaturalIntelligence/strnum
 */
const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/
const numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/

const consider = {
  hex: true,
  leadingZeros: true,
  decimalPoint: '.',
  eNotation: true,
}

export default function toNumber(str, options = {}) {
  options = Object.assign({}, consider, options)
  if (!str || typeof str !== 'string') return str

  const trimmedStr = str.trim()

  if (options.skipLike !== undefined && options.skipLike.test(trimmedStr)) return str
  if (str === '0') return 0
  if (options.hex && hexRegex.test(trimmedStr)) {
    return parseInt(trimmedStr, 16)
  }
  if (trimmedStr.includes('e') || trimmedStr.includes('E')) {
    return resolveEnotation(str, trimmedStr, options)
  }
  const match = numRegex.exec(trimmedStr)
  if (match) {
    const sign = match[1] || ''
    const leadingZeros = match[2]
    const numTrimmedByZeros = trimZeros(match[3])
    const decimalAdjacentToLeadingZeros = sign
      ? str[leadingZeros.length + 1] === '.'
      : str[leadingZeros.length] === '.'

    if (
      !options.leadingZeros &&
      (leadingZeros.length > 1 ||
        (leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros))
    ) {
      return str
    }
    const num = Number(trimmedStr)
    const parsedStr = String(num)
    if (num === 0) return num
    if (parsedStr.search(/[eE]/) !== -1) {
      return options.eNotation ? num : str
    }
    if (trimmedStr.indexOf('.') !== -1) {
      if (parsedStr === '0') return num
      if (parsedStr === numTrimmedByZeros) return num
      if (parsedStr === `${sign}${numTrimmedByZeros}`) return num
      return str
    }
    const n = leadingZeros ? numTrimmedByZeros : trimmedStr
    if (leadingZeros) {
      return n === parsedStr || sign + n === parsedStr ? num : str
    }
    return n === parsedStr || n === sign + parsedStr ? num : str
  }
  return str
}

const eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/
function resolveEnotation(str, trimmedStr, options) {
  if (!options.eNotation) return str
  const notation = trimmedStr.match(eNotationRegx)
  if (notation) {
    const sign = notation[1] || ''
    const eChar = notation[3].indexOf('e') === -1 ? 'E' : 'e'
    const leadingZeros = notation[2]
    const eAdjacentToLeadingZeros = sign
      ? str[leadingZeros.length + 1] === eChar
      : str[leadingZeros.length] === eChar

    if (leadingZeros.length > 1 && eAdjacentToLeadingZeros) return str
    if (
      leadingZeros.length === 1 &&
      (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)
    ) {
      return Number(trimmedStr)
    }
    if (options.leadingZeros && !eAdjacentToLeadingZeros) {
      trimmedStr = (notation[1] || '') + notation[3]
      return Number(trimmedStr)
    }
    return str
  }
  return str
}

function trimZeros(numStr) {
  if (numStr && numStr.indexOf('.') !== -1) {
    numStr = numStr.replace(/0+$/, '')
    if (numStr === '.') numStr = '0'
    else if (numStr[0] === '.') numStr = '0' + numStr
    else if (numStr[numStr.length - 1] === '.')
      numStr = numStr.substring(0, numStr.length - 1)
    return numStr
  }
  return numStr
}
