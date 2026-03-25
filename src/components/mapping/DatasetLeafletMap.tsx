import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { DataRow } from '#/types/data'
import {
  isValidLatitude,
  isValidLongitude,
  parseCoordinate,
} from '#/lib/geo'

export interface MapPoint {
  id: string
  lat: number
  lng: number
  label: string
  detail: string
}

function FitBounds({ positions }: { positions: L.LatLngExpression[] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 8)
      return
    }
    const b = L.latLngBounds(positions as L.LatLngTuple[])
    map.fitBounds(b, { padding: [40, 40], maxZoom: 12 })
  }, [map, positions])
  return null
}

function buildPoints(
  rows: DataRow[],
  latCol: string,
  lngCol: string,
  labelCol: string | null,
): MapPoint[] {
  const out: MapPoint[] = []
  rows.forEach((row, idx) => {
    const lat = parseCoordinate(row[latCol])
    const lng = parseCoordinate(row[lngCol])
    if (lat === null || lng === null) return
    if (!isValidLatitude(lat) || !isValidLongitude(lng)) return
    const label =
      labelCol && row[labelCol] !== undefined && row[labelCol] !== null
        ? String(row[labelCol])
        : `Point ${idx + 1}`
    const detail = Object.entries(row)
      .map(([k, v]) => `${k}: ${formatPopupValue(v)}`)
      .join('\n')
    out.push({
      id: `${idx}-${lat}-${lng}`,
      lat,
      lng,
      label,
      detail,
    })
  })
  return out
}

function formatPopupValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

export interface DatasetLeafletMapProps {
  rows: DataRow[]
  latitudeColumn: string
  longitudeColumn: string
  labelColumn: string | null
  className?: string
}

/** Renders only in the browser (Leaflet needs `window`). */
export function DatasetLeafletMap({
  rows,
  latitudeColumn,
  longitudeColumn,
  labelColumn,
  className,
}: DatasetLeafletMapProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const points = useMemo(
    () => buildPoints(rows, latitudeColumn, longitudeColumn, labelColumn),
    [rows, latitudeColumn, longitudeColumn, labelColumn],
  )

  const positions = useMemo(() => points.map((p) => [p.lat, p.lng] as L.LatLngTuple), [points])

  const defaultCenter: L.LatLngTuple = [35.5, 10.2]
  const defaultZoom = 6

  const mapMinH = 'min(70vh, 640px)'

  if (!mounted) {
    return (
      <div
        className={className}
        style={{ minHeight: mapMinH }}
        aria-hidden
      />
    )
  }

  if (points.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--sea-ink-soft)] ${className ?? ''}`}
        style={{ minHeight: mapMinH }}
      >
        No rows with valid coordinates. Check latitude/longitude columns and values (−90…90 / −180…180).
      </div>
    )
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className={['rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]', className].filter(Boolean).join(' ')}
      style={{ minHeight: mapMinH, height: mapMinH, width: '100%', zIndex: 0 }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds positions={positions} />
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={8}
          pathOptions={{
            color: '#328f97',
            fillColor: '#4fb8b2',
            fillOpacity: 0.85,
            weight: 2,
          }}
        >
          <Popup>
            <div style={{ maxWidth: 260 }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#173a40' }}>{p.label}</div>
              <pre
                style={{
                  marginTop: 6,
                  fontSize: 10,
                  lineHeight: 1.35,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'ui-monospace, monospace',
                  color: '#416166',
                }}
              >
                {p.detail}
              </pre>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
