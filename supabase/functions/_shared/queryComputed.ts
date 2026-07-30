import type { DataPrimitive, DataRow, QueryComputedField } from './types.ts'
import { slugAlias } from './slugAlias.ts'

type Tok =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' | '(' | ')' }

function tokenize(expression: string, row: DataRow): Tok[] {
  const tokens: Tok[] = []
  const re = /([A-Za-z_][A-Za-z0-9_]*)|(\d+(?:\.\d+)?)|([+\-*/()])|\s+/g
  let m: RegExpExecArray | null
  let lastIndex = 0
  while ((m = re.exec(expression)) !== null) {
    if (m.index !== lastIndex) {
      throw new Error(`Invalid character in formula near: ${expression.slice(lastIndex, m.index)}`)
    }
    lastIndex = re.lastIndex
    if (m[0].trim() === '') continue
    if (m[1]) {
      if (!(m[1] in row)) throw new Error(`Unknown column in formula: ${m[1]}`)
      const v = row[m[1]]
      const n = typeof v === 'number' ? v : Number(v)
      if (!Number.isFinite(n)) throw new Error(`Non-numeric value for ${m[1]}`)
      tokens.push({ kind: 'num', value: n })
    } else if (m[2]) {
      tokens.push({ kind: 'num', value: Number(m[2]) })
    } else if (m[3]) {
      tokens.push({ kind: 'op', value: m[3] as '+' | '-' | '*' | '/' | '(' | ')' })
    }
  }
  if (lastIndex !== expression.length) {
    throw new Error(`Invalid trailing formula text: ${expression.slice(lastIndex)}`)
  }
  return tokens
}

function parseExpr(tokens: Tok[], i: { at: number }): number {
  let left = parseTerm(tokens, i)
  while (i.at < tokens.length) {
    const t = tokens[i.at]
    if (t.kind !== 'op' || (t.value !== '+' && t.value !== '-')) break
    i.at++
    const right = parseTerm(tokens, i)
    left = t.value === '+' ? left + right : left - right
  }
  return left
}

function parseTerm(tokens: Tok[], i: { at: number }): number {
  let left = parseFactor(tokens, i)
  while (i.at < tokens.length) {
    const t = tokens[i.at]
    if (t.kind !== 'op' || (t.value !== '*' && t.value !== '/')) break
    i.at++
    const right = parseFactor(tokens, i)
    left = t.value === '*' ? left * right : right === 0 ? NaN : left / right
  }
  return left
}

function parseFactor(tokens: Tok[], i: { at: number }): number {
  const t = tokens[i.at]
  if (!t) throw new Error('Unexpected end of formula')
  if (t.kind === 'num') {
    i.at++
    return t.value
  }
  if (t.kind === 'op' && t.value === '(') {
    i.at++
    const v = parseExpr(tokens, i)
    const close = tokens[i.at]
    if (!close || close.kind !== 'op' || close.value !== ')') {
      throw new Error('Missing closing parenthesis')
    }
    i.at++
    return v
  }
  if (t.kind === 'op' && t.value === '-') {
    i.at++
    return -parseFactor(tokens, i)
  }
  throw new Error('Unexpected token in formula')
}

export function evaluateComputedExpression(expression: string, row: DataRow): number | null {
  const expr = expression.trim()
  if (!expr) return null
  const tokens = tokenize(expr, row)
  const i = { at: 0 }
  const value = parseExpr(tokens, i)
  if (i.at !== tokens.length) throw new Error('Unexpected trailing tokens in formula')
  return Number.isFinite(value) ? value : null
}

export function applyComputedFields(
  rows: DataRow[],
  fields: QueryComputedField[] | undefined,
): DataRow[] {
  if (!fields || fields.length === 0) return rows
  return rows.map((row) => {
    const out: DataRow = { ...row }
    for (const f of fields) {
      const alias = slugAlias(f.alias.trim()) || f.alias.trim()
      if (!alias) continue
      out[alias] = evaluateComputedExpression(f.expression, out) as DataPrimitive
    }
    return out
  })
}

/**
 * Convert a safe formula into SQL using quoted identifiers for known result columns.
 * Throws if the expression references unknown names or illegal tokens.
 */
export function formulaToSql(expression: string, knownColumns: string[]): string {
  const known = new Set(knownColumns)
  const expr = expression.trim()
  if (!expr) throw new Error('Empty formula')
  const re = /([A-Za-z_][A-Za-z0-9_]*)|(\d+(?:\.\d+)?)|([+\-*/()])|\s+/g
  let m: RegExpExecArray | null
  let lastIndex = 0
  const parts: string[] = []
  while ((m = re.exec(expr)) !== null) {
    if (m.index !== lastIndex) throw new Error('Invalid formula syntax')
    lastIndex = re.lastIndex
    if (m[0].trim() === '') continue
    if (m[1]) {
      if (!known.has(m[1])) throw new Error(`Unknown column in formula: ${m[1]}`)
      parts.push('"' + m[1].replace(/"/g, '""') + '"')
    } else if (m[2]) {
      parts.push(m[2])
    } else if (m[3]) {
      parts.push(m[3])
    }
  }
  if (lastIndex !== expr.length) throw new Error('Invalid formula syntax')
  return parts.join(' ')
}
