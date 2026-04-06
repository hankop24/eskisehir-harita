import { useEffect, useRef, useState } from 'react'
import { GeoJSON, MapContainer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { mahalleVeri } from '../data/mahalleVeri'
import { islerKitabevleri } from '../data/islerKitabevleri'
import 'leaflet/dist/leaflet.css'

function normalizeText(str = '') {
  return String(str)
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/mahallesi/g, '')
    .replace(/mah/g, '')
    .trim()
}

function getColorByPopulation(nufus) {
  if (nufus >= 35000) return '#c81e1e'
  if (nufus >= 25000) return '#ea580c'
  if (nufus >= 15000) return '#f59e0b'
  if (nufus >= 8000) return '#93c5fd'
  return '#8ecb8f'
}

const kitabeviIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function MapView({ setSelectedMahalle }) {
  const [geoData, setGeoData] = useState(null)
  const selectedLayerRef = useRef(null)

  useEffect(() => {
    fetch('/mahalleler.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('GeoJSON yüklenemedi:', err))
  }, [])

  const getFeatureStyle = (feature) => {
    const mahalleAdi =
      feature.properties?.name ||
      feature.properties?.ad ||
      feature.properties?.MAHALLE ||
      ''

    const veri = mahalleVeri.find(
      (item) => normalizeText(item.ad) === normalizeText(mahalleAdi)
    )

    return {
      fillColor: veri ? getColorByPopulation(veri.nufus) : '#d1d5db',
      weight: 2,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.9,
    }
  }

  const onEachFeature = (feature, layer) => {
    const mahalleAdi =
      feature.properties?.name ||
      feature.properties?.ad ||
      feature.properties?.MAHALLE ||
      ''

    const veri = mahalleVeri.find(
      (item) => normalizeText(item.ad) === normalizeText(mahalleAdi)
    )

    layer.on({
      click: () => {
        if (selectedLayerRef.current) {
          selectedLayerRef.current.setStyle({
            weight: 2,
            color: 'white',
            fillOpacity: 0.9,
          })
        }

        layer.setStyle({
          weight: 4,
          color: '#1f2937',
          fillOpacity: 1,
        })

        selectedLayerRef.current = layer

        if (veri) {
          setSelectedMahalle(veri)
        } else {
          setSelectedMahalle({
            ad: mahalleAdi,
            nufus: '-',
            yuzolcumu: '-',
            okullar: [],
          })
        }
      },
      mouseover: (e) => {
        if (selectedLayerRef.current !== layer) {
          e.target.setStyle({
            weight: 3,
            fillOpacity: 1,
          })
        }
      },
      mouseout: (e) => {
        if (selectedLayerRef.current !== layer) {
          e.target.setStyle({
            weight: 2,
            color: 'white',
            fillOpacity: 0.9,
          })
        }
      },
    })

    if (veri) {
      layer.bindTooltip(
        `<strong>${veri.ad}</strong><br/>Nüfus: ${Number(veri.nufus).toLocaleString('tr-TR')}`,
        { sticky: true }
      )
    } else if (mahalleAdi) {
      layer.bindTooltip(`<strong>${mahalleAdi}</strong>`, { sticky: true })
    }
  }

  return (
    <MapContainer
      center={[39.7767, 30.5206]}
      zoom={12}
      style={{ width: '100%', height: '100%', background: '#e5e7eb' }}
      zoomControl={true}
    >
      {geoData && (
        <GeoJSON
          data={geoData}
          style={getFeatureStyle}
          onEachFeature={onEachFeature}
        />
      )}

      {islerKitabevleri.map((sube, index) => (
        <Marker
          key={index}
          position={[sube.lat, sube.lng]}
          icon={kitabeviIcon}
        >
          <Popup>
            <div style={{ minWidth: '220px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                {sube.ad}
              </h3>
              <p style={{ margin: '0 0 6px 0', fontSize: '14px' }}>
                <strong>Mahalle:</strong> {sube.mahalle}
              </p>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                <strong>Adres:</strong> {sube.adres}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default MapView