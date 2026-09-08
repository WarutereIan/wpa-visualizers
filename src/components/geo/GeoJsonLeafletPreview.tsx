import { useEffect, useState } from 'react'
import { GeoJSON as LeafletGeoJson, MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { GeoJsonObject } from 'geojson'
import type { GeoJsonFeatureCollection } from '#/lib/geo/geojsonValidate'

const PREVIEW_PATH = {
  color: '#328f97',
  fillColor: '#4fb8b2',
  fillOpacity: 0.45,
  weight: 1.5,
}

function FitGeoJsonBounds({ data }: { data: GeoJsonFeatureCollection }) {
  const map = useMap()
  useEffect(() => {
    const layer = L.geoJSON(data as GeoJsonObject)
    const bounds = layer.getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 8 })
    }
    const timer = window.setTimeout(() => map.invalidateSize(), 80)
    return () => window.clearTimeout(timer)
  }, [map, data])
  return null
}

export interface GeoJsonLeafletPreviewProps {
  data: GeoJsonFeatureCollection
  labelField: string
  className?: string
}

/** Renders only in the browser (Leaflet needs `window`). */
export function GeoJsonLeafletPreview({ data, labelField, className }: GeoJsonLeafletPreviewProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const mapMinH = 240
  const defaultCenter: L.LatLngTuple = [0, 20]
  const layerKey = `${labelField}-${data.features.length}`

  if (!mounted) {
    return (
      <div
        className={className}
        style={{ minHeight: mapMinH, height: mapMinH }}
        aria-hidden
      />
    )
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={3}
      className={['rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]', className]
        .filter(Boolean)
        .join(' ')}
      style={{ minHeight: mapMinH, height: mapMinH, width: '100%', zIndex: 0 }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitGeoJsonBounds data={data} />
      <LeafletGeoJson
        key={layerKey}
        data={data as GeoJsonObject}
        style={PREVIEW_PATH}
        onEachFeature={(feature, layer) => {
          const props = (feature.properties ?? {}) as Record<string, unknown>
          const raw = props[labelField] ?? props.name ?? props.code ?? 'Feature'
          layer.bindPopup(String(raw))
        }}
      />
    </MapContainer>
  )
}
