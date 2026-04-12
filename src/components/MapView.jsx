import { useEffect, useMemo, useRef, useState } from 'react'
import { GeoJSON, MapContainer, Marker, useMap } from 'react-leaflet'
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

function formatNumber(value) {
  if (value === undefined || value === null || value === '') return '-'
  const num = Number(String(value).replace(/\./g, '').replace(',', '.'))
  if (Number.isNaN(num)) return value
  return num.toLocaleString('tr-TR')
}

function getPopulationLevel(nufus) {
  const value = Number(nufus) || 0

  if (value >= 35000) return 5
  if (value >= 25000) return 4
  if (value >= 15000) return 3
  if (value >= 8000) return 2
  return 1
}

function getDistrictFromFeature(feature, veri) {
  const ilceFromVeri = veri?.ilce || veri?.ilceAdi || veri?.district
  if (ilceFromVeri) {
    const ilce = normalizeText(ilceFromVeri)
    if (ilce.includes('tepebasi')) return 'tepebasi'
    if (ilce.includes('odunpazari')) return 'odunpazari'
  }

  const wikipediaText = feature?.properties?.wikipedia || ''
  const nameText = feature?.properties?.name || ''
  const combined = `${wikipediaText} ${nameText}`.toLowerCase()

  if (combined.includes('tepebaşı') || combined.includes('tepebasi')) {
    return 'tepebasi'
  }

  if (combined.includes('odunpazarı') || combined.includes('odunpazari')) {
    return 'odunpazari'
  }

  return null
}

function getColorByDistrictAndPopulation(ilce, nufus) {
  const level = getPopulationLevel(nufus)

  if (ilce === 'tepebasi') {
    if (level === 5) return '#991b1b'
    if (level === 4) return '#b91c1c'
    if (level === 3) return '#dc2626'
    if (level === 2) return '#ef4444'
    return '#fca5a5'
  }

  if (ilce === 'odunpazari') {
    if (level === 5) return '#1d4ed8'
    if (level === 4) return '#2563eb'
    if (level === 3) return '#3b82f6'
    if (level === 2) return '#60a5fa'
    return '#93c5fd'
  }

  return '#d1d5db'
}

function getFeatureMahalleName(feature) {
  return (
    feature?.properties?.name ||
    feature?.properties?.ad ||
    feature?.properties?.MAHALLE ||
    ''
  )
}

function isMahalleInSelectedSube(mahalleAdi, selectedSube) {
  if (!selectedSube) return true

  const etkiListesi = selectedSube.etkiMahalleleri || []

  return etkiListesi.some(
    (item) => normalizeText(item) === normalizeText(mahalleAdi)
  )
}

const aktifSubeIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
})

const aktifSubeIconFaded = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
  className: 'leaflet-marker-icon faded-marker'
})

const potansiyelSubeIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #a855f7;
      border: 3px solid white;
      box-shadow: 0 0 0 5px rgba(168, 85, 247, 0.25);
      position: relative;
    ">
      <div style="
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        border: 2px dashed rgba(168, 85, 247, 0.7);
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const potansiyelSubeIconFaded = L.divIcon({
  className: 'custom-marker faded-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #a855f7;
      border: 3px solid white;
      box-shadow: 0 0 0 5px rgba(168, 85, 247, 0.10);
      position: relative;
      opacity: 0.3;
    ">
      <div style="
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        border: 2px dashed rgba(168, 85, 247, 0.28);
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

function FocusToSelection({ selectedSube, activeGeoData }) {
  const map = useMap()

  useEffect(() => {
    if (!selectedSube || !activeGeoData?.features?.length) return

    const layer = L.geoJSON(activeGeoData)
    const bounds = layer.getBounds()

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        paddingTopLeft: [40, 220],
        paddingBottomRight: [40, 40],
        maxZoom: 13
      })
    }
  }, [map, selectedSube, activeGeoData])

  return null
}

function MiniCard({ title, value }) {
  return (
    <div
      style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '12px'
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: '#6b7280',
          marginBottom: '6px'
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: '22px',
          fontWeight: 800,
          color: '#111827'
        }}
      >
        {value}
      </div>
    </div>
  )
}

function MapView({ setSelectedMahalle }) {
  const [geoData, setGeoData] = useState(null)
  const [selectedSube, setSelectedSube] = useState(null)
  const selectedLayerRef = useRef(null)
  const activeGeoJsonRef = useRef(null)

  useEffect(() => {
    fetch('/mahalleler.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('GeoJSON yüklenemedi:', err))
  }, [])

  const selectedSubeMahalleleri = useMemo(() => {
    if (!selectedSube) return []

    return mahalleVeri.filter((item) =>
      (selectedSube.etkiMahalleleri || []).some(
        (mahalle) => normalizeText(mahalle) === normalizeText(item.ad)
      )
    )
  }, [selectedSube])

  const selectedSubeStats = useMemo(() => {
    if (!selectedSube) return null

    const toplamNufus = selectedSubeMahalleleri.reduce(
      (sum, item) => sum + (Number(item.nufus) || 0),
      0
    )

    const toplamOkul = selectedSubeMahalleleri.reduce((sum, item) => {
      return sum + (Array.isArray(item.okullar) ? item.okullar.length : 0)
    }, 0)

    const okulAdlari = selectedSubeMahalleleri.flatMap((item) =>
      Array.isArray(item.okullar)
        ? item.okullar.map((okul) =>
            typeof okul === 'string' ? okul : okul.ad || 'İsimsiz Okul'
          )
        : []
    )

    return {
      mahalleSayisi: selectedSubeMahalleleri.length,
      toplamNufus,
      toplamOkul,
      mahalleAdlari: selectedSubeMahalleleri.map((item) => item.ad),
      okulAdlari
    }
  }, [selectedSube, selectedSubeMahalleleri])

  const activeGeoData = useMemo(() => {
    if (!geoData || !selectedSube) return null

    return {
      ...geoData,
      features: geoData.features.filter((feature) =>
        isMahalleInSelectedSube(getFeatureMahalleName(feature), selectedSube)
      )
    }
  }, [geoData, selectedSube])

  const getBaseFeatureStyle = (feature) => {
    const mahalleAdi = getFeatureMahalleName(feature)

    const veri = mahalleVeri.find(
      (item) => normalizeText(item.ad) === normalizeText(mahalleAdi)
    )

    const ilce = getDistrictFromFeature(feature, veri)

    return {
      fillColor: veri
        ? getColorByDistrictAndPopulation(ilce, veri.nufus)
        : '#d1d5db',
      weight: 2,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.9
    }
  }

  const getFadedFeatureStyle = () => {
    return {
      fillColor: '#cbd5e1',
      weight: 1,
      opacity: 0.28,
      color: '#cbd5e1',
      fillOpacity: 0.12,
      interactive: false
    }
  }

  const resetActiveStyles = () => {
    if (activeGeoJsonRef.current) {
      activeGeoJsonRef.current.resetStyle()
    }
    selectedLayerRef.current = null
  }

  const handleSubeClick = (sube) => {
    setSelectedSube(sube)
    setSelectedMahalle(null)
    selectedLayerRef.current = null
  }

  const clearSubeFilter = () => {
    setSelectedSube(null)
    setSelectedMahalle(null)
    selectedLayerRef.current = null
  }

  const onEachActiveFeature = (feature, layer) => {
    const mahalleAdi = getFeatureMahalleName(feature)

    const veri = mahalleVeri.find(
      (item) => normalizeText(item.ad) === normalizeText(mahalleAdi)
    )

    if (veri) {
      layer.bindTooltip(
        `<strong>${veri.ad}</strong><br/>Nüfus: ${formatNumber(veri.nufus)}`,
        { sticky: true }
      )
    } else if (mahalleAdi) {
      layer.bindTooltip(`<strong>${mahalleAdi}</strong>`, { sticky: true })
    }

    layer.on({
      click: () => {
        if (selectedLayerRef.current && selectedLayerRef.current !== layer) {
          selectedLayerRef.current.setStyle(
            getBaseFeatureStyle(selectedLayerRef.current.feature)
          )
        }

        layer.setStyle({
          ...getBaseFeatureStyle(feature),
          weight: 4,
          color: '#1f2937',
          fillOpacity: 1
        })

        selectedLayerRef.current = layer

        if (veri) {
          setSelectedMahalle(veri)
        } else {
          setSelectedMahalle({
            ad: mahalleAdi,
            nufus: '-',
            yuzolcumu: '-',
            okullar: []
          })
        }
      },
      mouseover: (e) => {
        if (selectedLayerRef.current !== layer) {
          e.target.setStyle({
            ...getBaseFeatureStyle(feature),
            weight: 3,
            fillOpacity: 1
          })
        }
      },
      mouseout: (e) => {
        if (selectedLayerRef.current !== layer) {
          e.target.setStyle(getBaseFeatureStyle(feature))
        }
      }
    })
  }

  useEffect(() => {
    resetActiveStyles()
  }, [selectedSube])

  const getMarkerIcon = (sube) => {
    const aktifMi = !selectedSube || selectedSube.ad === sube.ad

    if (sube.tip === 'potansiyel') {
      return aktifMi ? potansiyelSubeIcon : potansiyelSubeIconFaded
    }

    return aktifMi ? aktifSubeIcon : aktifSubeIconFaded
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {selectedSube && selectedSubeStats && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            width: 'min(760px, calc(100% - 32px))'
          }}
        >
          <div
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '18px',
              padding: '14px 16px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.12)'
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#6366f1',
                letterSpacing: '0.08em',
                marginBottom: '6px'
              }}
            >
              ŞUBE ETKİ ALANI ÖZETİ
            </div>

            <div
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#111827',
                lineHeight: 1.2,
                marginBottom: '6px'
              }}
            >
              {selectedSube.ad}
            </div>

            <div
              style={{
                fontSize: '12px',
                color: '#4b5563',
                lineHeight: 1.45,
                marginBottom: '12px'
              }}
            >
              {selectedSube.tip === 'potansiyel'
                ? 'Seçilen potansiyel lokasyonun etki alanındaki mahalle ve okul bilgileri.'
                : 'Seçilen şubenin etki alanındaki mahalle ve okul bilgileri.'}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '10px',
                marginBottom: '10px'
              }}
            >
              <MiniCard
                title="Mahalle Sayısı"
                value={formatNumber(selectedSubeStats.mahalleSayisi)}
              />
              <MiniCard
                title="Toplam Nüfus"
                value={formatNumber(selectedSubeStats.toplamNufus)}
              />
              <MiniCard
                title="Toplam Okul"
                value={formatNumber(selectedSubeStats.toplamOkul)}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px'
              }}
            >
              <div
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px',
                  minHeight: '92px'
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: '8px'
                  }}
                >
                  Mahalleler
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedSubeStats.mahalleAdlari.map((ad, index) => (
                    <span
                      key={`${ad}-${index}`}
                      style={{
                        padding: '6px 9px',
                        borderRadius: '999px',
                        background: '#eef2ff',
                        color: '#4338ca',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      {ad}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px',
                  minHeight: '92px'
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: '8px'
                  }}
                >
                  Okullar
                </div>

                <div
                  style={{
                    maxHeight: '92px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}
                >
                  {selectedSubeStats.okulAdlari.length > 0 ? (
                    selectedSubeStats.okulAdlari.map((ad, index) => (
                      <div
                        key={`${ad}-${index}`}
                        style={{
                          fontSize: '11px',
                          color: '#374151',
                          padding: '4px 0',
                          borderBottom:
                            index !== selectedSubeStats.okulAdlari.length - 1
                              ? '1px solid #e5e7eb'
                              : 'none'
                        }}
                      >
                        {ad}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      Okul bilgisi bulunamadı.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={clearSubeFilter}
            style={{
              width: '200px',
              border: 'none',
              background: '#111827',
              color: '#fff',
              borderRadius: '12px',
              padding: '10px 14px',
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
            }}
          >
            Filtreyi Temizle
          </button>
        </div>
      )}

      <style>
        {`
          .faded-marker {
            opacity: 0.28 !important;
            filter: grayscale(35%);
          }
        `}
      </style>

      <MapContainer
        center={[39.7767, 30.5206]}
        zoom={12}
        style={{ width: '100%', height: '100%', background: '#e5e7eb' }}
        zoomControl={true}
      >
        {!selectedSube && geoData && (
          <GeoJSON
            data={geoData}
            style={getBaseFeatureStyle}
            onEachFeature={onEachActiveFeature}
          />
        )}

        {selectedSube && geoData && (
          <>
            <GeoJSON
              data={geoData}
              style={getFadedFeatureStyle}
              interactive={false}
            />
            {activeGeoData && (
              <GeoJSON
                key={selectedSube.ad}
                ref={activeGeoJsonRef}
                data={activeGeoData}
                style={getBaseFeatureStyle}
                onEachFeature={onEachActiveFeature}
              />
            )}
          </>
        )}

        <FocusToSelection
          selectedSube={selectedSube}
          activeGeoData={activeGeoData}
        />

        {islerKitabevleri.map((sube, index) => (
          <Marker
            key={index}
            position={[sube.lat, sube.lng]}
            icon={getMarkerIcon(sube)}
            eventHandlers={{
              click: () => handleSubeClick(sube)
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}

export default MapView
