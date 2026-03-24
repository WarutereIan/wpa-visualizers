var vulgarFractionToAsciiMap = {
  "¼": "1/4",
  "½": "1/2",
  "¾": "3/4",
  "⅐": "1/7",
  "⅑": "1/9",
  "⅒": "1/10",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
  "⅟": "1/"
};
var numericRegex = /^(?=-?\s*\.\d|-?\s*\d)(-)?\s*((?:\d(?:[\d,_]*\d)?)*)(([eE][+-]?\d(?:[\d,_]*\d)?)?|\.\d(?:[\d,_]*\d)?([eE][+-]?\d(?:[\d,_]*\d)?)?|(\s+\d(?:[\d,_]*\d)?\s*)?\s*\/\s*\d(?:[\d,_]*\d)?)?$/;
var numericRegexWithTrailingInvalid = new RegExp(
  numericRegex.source.replace(/\$$/, "(?:\\s*[^\\.\\d\\/].*)?")
);
var vulgarFractionsRegex = new RegExp(
  `(${Object.keys(vulgarFractionToAsciiMap).join("|")})`
);
var romanNumeralValues = {
  MMM: 3e3,
  MM: 2e3,
  M: 1e3,
  CM: 900,
  DCCC: 800,
  DCC: 700,
  DC: 600,
  D: 500,
  CD: 400,
  CCC: 300,
  CC: 200,
  C: 100,
  XC: 90,
  LXXX: 80,
  LXX: 70,
  LX: 60,
  L: 50,
  XL: 40,
  XXX: 30,
  XX: 20,
  XII: 12,
  // only here for tests; not used in practice
  XI: 11,
  // only here for tests; not used in practice
  X: 10,
  IX: 9,
  VIII: 8,
  VII: 7,
  VI: 6,
  V: 5,
  IV: 4,
  III: 3,
  II: 2,
  I: 1
};
var romanNumeralUnicodeToAsciiMap = {
  // Roman Numeral One (U+2160)
  "Ⅰ": "I",
  // Roman Numeral Two (U+2161)
  "Ⅱ": "II",
  // Roman Numeral Three (U+2162)
  "Ⅲ": "III",
  // Roman Numeral Four (U+2163)
  "Ⅳ": "IV",
  // Roman Numeral Five (U+2164)
  "Ⅴ": "V",
  // Roman Numeral Six (U+2165)
  "Ⅵ": "VI",
  // Roman Numeral Seven (U+2166)
  "Ⅶ": "VII",
  // Roman Numeral Eight (U+2167)
  "Ⅷ": "VIII",
  // Roman Numeral Nine (U+2168)
  "Ⅸ": "IX",
  // Roman Numeral Ten (U+2169)
  "Ⅹ": "X",
  // Roman Numeral Eleven (U+216A)
  "Ⅺ": "XI",
  // Roman Numeral Twelve (U+216B)
  "Ⅻ": "XII",
  // Roman Numeral Fifty (U+216C)
  "Ⅼ": "L",
  // Roman Numeral One Hundred (U+216D)
  "Ⅽ": "C",
  // Roman Numeral Five Hundred (U+216E)
  "Ⅾ": "D",
  // Roman Numeral One Thousand (U+216F)
  "Ⅿ": "M",
  // Small Roman Numeral One (U+2170)
  "ⅰ": "I",
  // Small Roman Numeral Two (U+2171)
  "ⅱ": "II",
  // Small Roman Numeral Three (U+2172)
  "ⅲ": "III",
  // Small Roman Numeral Four (U+2173)
  "ⅳ": "IV",
  // Small Roman Numeral Five (U+2174)
  "ⅴ": "V",
  // Small Roman Numeral Six (U+2175)
  "ⅵ": "VI",
  // Small Roman Numeral Seven (U+2176)
  "ⅶ": "VII",
  // Small Roman Numeral Eight (U+2177)
  "ⅷ": "VIII",
  // Small Roman Numeral Nine (U+2178)
  "ⅸ": "IX",
  // Small Roman Numeral Ten (U+2179)
  "ⅹ": "X",
  // Small Roman Numeral Eleven (U+217A)
  "ⅺ": "XI",
  // Small Roman Numeral Twelve (U+217B)
  "ⅻ": "XII",
  // Small Roman Numeral Fifty (U+217C)
  "ⅼ": "L",
  // Small Roman Numeral One Hundred (U+217D)
  "ⅽ": "C",
  // Small Roman Numeral Five Hundred (U+217E)
  "ⅾ": "D",
  // Small Roman Numeral One Thousand (U+217F)
  "ⅿ": "M"
};
var romanNumeralUnicodeRegex = new RegExp(
  `(${Object.keys(romanNumeralUnicodeToAsciiMap).join("|")})`,
  "gi"
);
var romanNumeralRegex = /^(?=[MDCLXVI])(M{0,3})(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/i;
var defaultOptions = {
  round: 3,
  allowTrailingInvalid: false,
  romanNumerals: false,
  bigIntOnOverflow: false
};
var parseRomanNumerals = (romanNumerals) => {
  const normalized = `${romanNumerals}`.replace(
    romanNumeralUnicodeRegex,
    (_m, rn) => romanNumeralUnicodeToAsciiMap[rn]
  ).toUpperCase();
  const regexResult = romanNumeralRegex.exec(normalized);
  if (!regexResult) {
    return NaN;
  }
  const [, thousands, hundreds, tens, ones] = regexResult;
  return (romanNumeralValues[thousands] ?? 0) + (romanNumeralValues[hundreds] ?? 0) + (romanNumeralValues[tens] ?? 0) + (romanNumeralValues[ones] ?? 0);
};
var spaceThenSlashRegex = /^\s*\//;
function numericQuantity(quantity, options = defaultOptions) {
  if (typeof quantity === "number" || typeof quantity === "bigint") {
    return quantity;
  }
  let finalResult = NaN;
  const quantityAsString = `${quantity}`.replace(
    vulgarFractionsRegex,
    (_m, vf) => ` ${vulgarFractionToAsciiMap[vf]}`
  ).replace("⁄", "/").trim();
  if (quantityAsString.length === 0) {
    return NaN;
  }
  const opts = {
    ...defaultOptions,
    ...options
  };
  const regexResult = (opts.allowTrailingInvalid ? numericRegexWithTrailingInvalid : numericRegex).exec(quantityAsString);
  if (!regexResult) {
    return opts.romanNumerals ? parseRomanNumerals(quantityAsString) : NaN;
  }
  const [, dash, ng1temp, ng2temp] = regexResult;
  const numberGroup1 = ng1temp.replace(/[,_]/g, "");
  const numberGroup2 = ng2temp?.replace(/[,_]/g, "");
  if (!numberGroup1 && numberGroup2 && numberGroup2.startsWith(".")) {
    finalResult = 0;
  } else {
    if (opts.bigIntOnOverflow) {
      const asBigInt = dash ? BigInt(`-${numberGroup1}`) : BigInt(numberGroup1);
      if (asBigInt > BigInt(Number.MAX_SAFE_INTEGER) || asBigInt < BigInt(Number.MIN_SAFE_INTEGER)) {
        return asBigInt;
      }
    }
    finalResult = parseInt(numberGroup1);
  }
  if (!numberGroup2) {
    return dash ? finalResult * -1 : finalResult;
  }
  const roundingFactor = opts.round === false ? NaN : parseFloat(`1e${Math.floor(Math.max(0, opts.round))}`);
  if (numberGroup2.startsWith(".") || numberGroup2.startsWith("e") || numberGroup2.startsWith("E")) {
    const decimalValue = parseFloat(`${finalResult}${numberGroup2}`);
    finalResult = isNaN(roundingFactor) ? decimalValue : Math.round(decimalValue * roundingFactor) / roundingFactor;
  } else if (spaceThenSlashRegex.test(numberGroup2)) {
    const numerator = parseInt(numberGroup1);
    const denominator = parseInt(numberGroup2.replace("/", ""));
    finalResult = isNaN(roundingFactor) ? numerator / denominator : Math.round(numerator * roundingFactor / denominator) / roundingFactor;
  } else {
    const fractionArray = numberGroup2.split("/");
    const [numerator, denominator] = fractionArray.map((v) => parseInt(v));
    finalResult += isNaN(roundingFactor) ? numerator / denominator : Math.round(numerator * roundingFactor / denominator) / roundingFactor;
  }
  return dash ? finalResult * -1 : finalResult;
}
export {
  numericRegex as a,
  numericQuantity as n
};
