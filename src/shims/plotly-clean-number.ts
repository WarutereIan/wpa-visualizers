export default function plotlyCleanNumber(value: unknown) {
  let v: unknown = value
  if (typeof v === 'string') {
    v = v.replace(/^['"%,$#\s']+|[, ]|['"%,$#\s']+$/g, '')
  }
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
