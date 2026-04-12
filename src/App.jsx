import { useEffect, useMemo, useState } from 'react'
import MapView from './components/MapView'
import { mahalleVeri } from './data/mahalleVeri'
import { islerKitabevleri } from './data/islerKitabevleri'

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

function formatArea(value) {
  if (value === undefined || value === null || value === '') return '-'
  return `${value} km²`
}

function getSchoolType(okul = null) {
  if (okul && typeof okul === 'object' && okul.tur) return okul.tur

  const okulAdi = typeof okul === 'string' ? okul : okul?.ad || ''
  const text = okulAdi.toLowerCase()

  if (text.includes('anaokulu')) return 'Anaokulu'
  if (text.includes('ilkokulu')) return 'İlkokul'
  if (text.includes('ortaokulu')) return 'Ortaokul'
  if (text.includes('lisesi')) return 'Lise'

  return 'Okul'
}

function getSchoolName(okul = null) {
  if (typeof okul === 'string') return okul
  if (okul && typeof okul === 'object') return okul.ad || 'İsimsiz Okul'
  return 'İsimsiz Okul'
}

function calcPercent(part, total) {
  const p = Number(part)
  const t = Number(total)
  if (!t || Number.isNaN(p) || Number.isNaN(t)) return 0
  return Number(((p / t) * 100).toFixed(1))
}

function RingChart({
  value = 0,
  centerText,
  label,
  sublabel,
  colorA = '#10b981',
  colorB = '#34d399'
}) {
  const safeValue = Math.max(0, Math.min(Number(value) || 0, 100))
  const degree = (safeValue / 100) * 360

  return (
    <div className="single-ring-chart">
      <div
        className="single-ring-circle"
        style={{
          background: `conic-gradient(${colorA} 0deg, ${colorB} ${degree}deg, #e5e7eb ${degree}deg, #e5e7eb 360deg)`
        }}
      >
        <div className="single-ring-inner">
          <div className="single-ring-center">{centerText}</div>
        </div>
      </div>

      <div className="single-ring-info">
        <div className="single-ring-label">{label}</div>
        <div className="single-ring-sublabel">{sublabel}</div>
      </div>
    </div>
  )
}

function SchoolModal({ school, onClose }) {
  if (!school) return null

  const schoolName = getSchoolName(school)
  const schoolType = getSchoolType(school)

  const teacherStudentRatio =
    school?.ogrenciSayisi && school?.ogretmenSayisi
      ? `1 / ${Math.round(school.ogrenciSayisi / school.ogretmenSayisi)}`
      : '-'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#fff',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '20px'
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 800,
                color: '#111827',
                lineHeight: 1.2
              }}
            >
              {schoolName}
            </h2>

            <div
              style={{
                marginTop: '10px',
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '999px',
                background: '#eef2ff',
                color: '#4f46e5',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              {schoolType}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: '#f3f4f6',
              borderRadius: '12px',
              padding: '10px 14px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Kapat
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '14px'
          }}
        >
          <InfoCard
            title="Öğrenci Sayısı"
            value={formatNumber(school?.ogrenciSayisi)}
          />
          <InfoCard
            title="Öğretmen Sayısı"
            value={formatNumber(school?.ogretmenSayisi)}
          />
          <InfoCard
            title="Derslik Sayısı"
            value={formatNumber(school?.derslikSayisi)}
          />
          <InfoCard
            title="Şube Sayısı"
            value={formatNumber(school?.subeSayisi)}
          />
          <InfoCard
            title="Ortalama Sınıf Mevcudu"
            value={formatNumber(school?.ortalamaSinifMevcudu)}
          />
          <InfoCard
            title="Öğretmen / Öğrenci Oranı"
            value={teacherStudentRatio}
          />
        </div>

        {school?.notlar ? (
          <div
            style={{
              marginTop: '18px',
              padding: '16px',
              borderRadius: '16px',
              background: '#f9fafb',
              border: '1px solid #e5e7eb'
            }}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: '8px',
                color: '#111827'
              }}
            >
              Notlar
            </div>
            <div
              style={{
                color: '#4b5563',
                lineHeight: 1.6,
                fontSize: '14px'
              }}
            >
              {school.notlar}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function InfoCard({ title, value }) {
  return (
    <div
      style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '18px',
        padding: '16px'
      }}
    >
      <div
        style={{
          fontSize: '13px',
          color: '#6b7280',
          marginBottom: '8px'
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 800,
          color: '#111827'
        }}
      >
        {value ?? '-'}
      </div>
    </div>
  )
}

function getCenterAdvantage(mahalleAdi = '') {
  const birinciDereceMerkez = [
    'arifiye',
    'deliklitas',
    'istiklal',
    'hosnudiye',
    'osmangazi',
    'visnelik'
  ]

  const ikinciDereceMerkez = [
    'cumhuriyet',
    'kurtulus',
    'akarbasi',
    'mamure',
    'yenibaglar'
  ]

  const name = normalizeText(mahalleAdi)

  if (birinciDereceMerkez.includes(name)) return 4
  if (ikinciDereceMerkez.includes(name)) return 2

  return 0
}

function getFeatureMahalleName(feature) {
  return (
    feature?.properties?.name ||
    feature?.properties?.ad ||
    feature?.properties?.MAHALLE ||
    ''
  )
}

function flattenCoordinates(geometry) {
  if (!geometry) return []

  if (geometry.type === 'Polygon') {
    return geometry.coordinates.flat()
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flat(2)
  }

  return []
}

function getVertexSet(feature) {
  const coords = flattenCoordinates(feature?.geometry)
  const set = new Set()

  coords.forEach((coord) => {
    if (!Array.isArray(coord) || coord.length < 2) return
    const lng = Number(coord[0]).toFixed(5)
    const lat = Number(coord[1]).toFixed(5)
    set.add(`${lng},${lat}`)
  })

  return set
}

function buildNeighborMap(geoData) {
  if (!geoData?.features?.length) return {}

  const features = geoData.features.map((feature) => ({
    name: normalizeText(getFeatureMahalleName(feature)),
    vertices: getVertexSet(feature)
  }))

  const map = {}

  features.forEach((item) => {
    map[item.name] = []
  })

  for (let i = 0; i < features.length; i += 1) {
    for (let j = i + 1; j < features.length; j += 1) {
      const a = features[i]
      const b = features[j]

      let commonCount = 0

      for (const point of a.vertices) {
        if (b.vertices.has(point)) {
          commonCount += 1
          if (commonCount >= 2) break
        }
      }

      if (commonCount >= 2) {
        map[a.name].push(b.name)
        map[b.name].push(a.name)
      }
    }
  }

  return map
}

function getSchoolStudentTotal(okullar = []) {
  return okullar.reduce((sum, okul) => {
    if (typeof okul === 'object' && okul?.ogrenciSayisi) {
      return sum + (Number(okul.ogrenciSayisi) || 0)
    }
    return sum
  }, 0)
}

function calculateCustomerPotential(mahalle, neighborMap, allMahalleData) {
  const toplamNufus = Number(mahalle?.nufus) || 0
  const yas5_19 =
    Number(mahalle?.yas5_19) ||
    Number(mahalle?.yas_5_19) ||
    Number(mahalle?.besOnDokuzYas) ||
    0

  const okullar = Array.isArray(mahalle?.okullar) ? mahalle.okullar : []
  const okulSayisi = okullar.length
  const toplamOgrenciSayisi = getSchoolStudentTotal(okullar)
  const yasOran = calcPercent(yas5_19, toplamNufus)

  const mahalleKey = normalizeText(mahalle?.ad)
  const komsuAdlari = neighborMap?.[mahalleKey] || []

  const komsuMahalleler = komsuAdlari
    .map((komsuAdi) =>
      allMahalleData.find((item) => normalizeText(item.ad) === komsuAdi)
    )
    .filter(Boolean)

  const komsuToplamOkul = komsuMahalleler.reduce((sum, item) => {
    return sum + (Array.isArray(item.okullar) ? item.okullar.length : 0)
  }, 0)

  const komsuToplamOgrenci = komsuMahalleler.reduce((sum, item) => {
    return sum + getSchoolStudentTotal(item.okullar || [])
  }, 0)

  const komsuToplam5_19 = komsuMahalleler.reduce((sum, item) => {
    return (
      sum +
      (Number(item?.yas5_19) ||
        Number(item?.yas_5_19) ||
        Number(item?.besOnDokuzYas) ||
        0)
    )
  }, 0)

  const komsuToplamNufus = komsuMahalleler.reduce((sum, item) => {
    return sum + (Number(item?.nufus) || 0)
  }, 0)

  const komsuYasOran = calcPercent(komsuToplam5_19, komsuToplamNufus)

  // Komşu mahalle etkisi: ana mahalleden daha düşük ağırlıkla hesaba katılır
  const agirlikliOkul = okulSayisi + komsuToplamOkul * 0.4
  const agirlikliOgrenci = toplamOgrenciSayisi + komsuToplamOgrenci * 0.35
  const agirlikliYas = yas5_19 + komsuToplam5_19 * 0.35
  const agirlikliYasOran = yasOran * 0.7 + komsuYasOran * 0.3

  let puan = 0

  // 1) Okul sayısı
  if (agirlikliOkul >= 10) puan += 4
  else if (agirlikliOkul >= 7) puan += 3
  else if (agirlikliOkul >= 4) puan += 2
  else if (agirlikliOkul >= 2) puan += 1

  // 2) Öğrenci sayısı
  if (agirlikliOgrenci >= 7000) puan += 4
  else if (agirlikliOgrenci >= 4500) puan += 3
  else if (agirlikliOgrenci >= 2200) puan += 2
  else if (agirlikliOgrenci >= 800) puan += 1

  // 3) 5–19 yaş toplamı
  if (agirlikliYas >= 15000) puan += 4
  else if (agirlikliYas >= 9000) puan += 3
  else if (agirlikliYas >= 4000) puan += 2
  else if (agirlikliYas >= 1500) puan += 1

  // 4) 5–19 yaş oranı
  if (agirlikliYasOran >= 26) puan += 3
  else if (agirlikliYasOran >= 20) puan += 2
  else if (agirlikliYasOran >= 14) puan += 1

  // 5) Merkez avantajı
  puan += getCenterAdvantage(mahalle?.ad)

  let durum = 'Riskli'
  let className = 'potential-low'
  let aciklama =
    'Mahalle ve komşu çevre etkisi birlikte değerlendirildiğinde şube için potansiyel düşük görünüyor.'

  if (puan >= 13) {
    durum = 'Çok Uygun'
    className = 'potential-high'
    aciklama =
      'Mahalle içi ve çevre mahalle etkisi çok güçlü. Okul, öğrenci, genç nüfus ve merkez avantajı açısından oldukça güçlü bir lokasyon.'
  } else if (puan >= 9) {
    durum = 'Uygun'
    className = 'potential-medium'
    aciklama =
      'Mahalle ve komşu çevre birlikte değerlendirildiğinde müşteri potansiyeli iyi düzeyde görünüyor.'
  } else if (puan >= 5) {
    durum = 'Az Riskli'
    className = 'potential-midlow'
    aciklama =
      'Potansiyel tamamen zayıf değil ancak lokasyon seçimi ve rekabet durumu dikkatle değerlendirilmelidir.'
  }

  return {
    puan,
    durum,
    className,
    aciklama,
    yas5_19,
    yasOran,
    okulSayisi,
    toplamOgrenciSayisi,
    komsuSayisi: komsuMahalleler.length,
    komsuToplamOkul,
    komsuToplamOgrenci,
    komsuToplam5_19,
    agirlikliOkul,
    agirlikliOgrenci,
    agirlikliYas,
    agirlikliYasOran
  }
}

function BottomStaticPanel({
  mahalle,
  onClose,
  isVisible,
  neighborMap,
  allMahalleData
}) {
  if (!mahalle) return null

  const analiz = calculateCustomerPotential(mahalle, neighborMap, allMahalleData)

  return (
    <div
      className="bottom-panel-shell"
      style={{
        maxHeight: isVisible ? '270px' : '0px',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.35s ease'
      }}
    >
      <div className="bottom-panel-inner-card">
        <div className="bottom-panel-head">
          <div>
            <div className="bottom-panel-kicker">NÜFUS ANALİZİ</div>
            <h3 className="bottom-panel-title">5–19 Yaş Aralığı</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="bottom-panel-badge">{mahalle.ad}</div>

            <button onClick={onClose} className="bottom-close-btn">
              ✕
            </button>
          </div>
        </div>

        <div className="single-bottom-panel-layout">
          <RingChart
            value={analiz.yasOran}
            centerText={`%${analiz.yasOran}`}
            label="Toplam Nüfusa Oranı"
            sublabel="Seçilen mahalle"
          />

          <div className="age-side-stats">
            <div className="age-stat-box">
              <span>5–19 Yaş Toplamı</span>
              <strong>{formatNumber(analiz.yas5_19)}</strong>
            </div>

            <div className="age-stat-box">
              <span>Toplam Okul</span>
              <strong>{formatNumber(analiz.okulSayisi)}</strong>
            </div>

            <div className="age-stat-box">
              <span>Toplam Öğrenci</span>
              <strong>{formatNumber(analiz.toplamOgrenciSayisi)}</strong>
            </div>

            <div className="age-stat-box">
              <span>İşler Potansiyeli</span>
              <strong className={analiz.className}>{analiz.durum}</strong>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '10px',
            fontSize: '12px',
            color: '#64748b',
            lineHeight: 1.5
          }}
        >
          Komşu mahalle etkisi dahil: {formatNumber(analiz.komsuSayisi)} mahalle ·
          +{formatNumber(Math.round(analiz.komsuToplamOkul))} okul · +
          {formatNumber(Math.round(analiz.komsuToplamOgrenci))} öğrenci · +
          {formatNumber(Math.round(analiz.komsuToplam5_19))} genç nüfus
        </div>
      </div>
    </div>
  )
}

function App() {
  const [selectedMahalle, setSelectedMahalle] = useState(null)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [showBottomPanel, setShowBottomPanel] = useState(true)
  const [neighborMap, setNeighborMap] = useState({})

  useEffect(() => {
    fetch('/mahalleler.geojson')
      .then((res) => res.json())
      .then((geoData) => {
        const map = buildNeighborMap(geoData)
        setNeighborMap(map)
      })
      .catch((err) => {
        console.error('Komşuluk haritası oluşturulamadı:', err)
        setNeighborMap({})
      })
  }, [])

  const seciliMahalleDetay = useMemo(() => {
    if (!selectedMahalle?.ad) return null

    return (
      mahalleVeri.find(
        (item) => normalizeText(item.ad) === normalizeText(selectedMahalle.ad)
      ) || selectedMahalle
    )
  }, [selectedMahalle])

  useEffect(() => {
    if (seciliMahalleDetay) {
      setShowBottomPanel(true)
    }
  }, [seciliMahalleDetay])

  const handleSelectedMahalle = (mahalle) => {
    setSelectedMahalle(mahalle)
    setShowBottomPanel(true)
  }

  const okullar = seciliMahalleDetay?.okullar || []

  const seciliKitabevleri = useMemo(() => {
    if (!seciliMahalleDetay?.ad) return []

    return islerKitabevleri.filter(
      (item) =>
        normalizeText(item.mahalle) === normalizeText(seciliMahalleDetay.ad)
    )
  }, [seciliMahalleDetay])

  return (
    <div className="app-shell app-shell-custom">
      <div className="map-column">
        <div className="map-area">
          <MapView setSelectedMahalle={handleSelectedMahalle} />

          {seciliMahalleDetay && (
            <BottomStaticPanel
              mahalle={seciliMahalleDetay}
              onClose={() => setShowBottomPanel(false)}
              isVisible={showBottomPanel}
              neighborMap={neighborMap}
              allMahalleData={mahalleVeri}
            />
          )}
        </div>
      </div>

      <aside className="sidebar">
        {!seciliMahalleDetay ? (
          <div className="sidebar-empty">
            <div className="empty-glow" />
            <div className="empty-card">
              <p className="eyebrow">ESKİŞEHİR HARİTASI</p>
              <h2>Mahalle Bilgileri</h2>
              <p className="empty-text">
                Detayları görmek için haritadan bir mahalle seç.
              </p>

              <div className="empty-mini-grid">
                <div className="empty-mini-box">
                  <span>Nüfus</span>
                  <strong>—</strong>
                </div>
                <div className="empty-mini-box">
                  <span>Yüzölçümü</span>
                  <strong>—</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div key={seciliMahalleDetay.ad} className="sidebar-content">
            <div className="panel-top">
              <p className="eyebrow">SEÇİLEN MAHALLE</p>
              <h2>Mahalle Bilgileri</h2>
              <p className="panel-subtitle">
                Haritada seçtiğin bölgenin özet bilgileri aşağıda yer alıyor.
              </p>
            </div>

            <div className="hero-card">
              <div className="hero-orb hero-orb-1" />
              <div className="hero-orb hero-orb-2" />

              <div className="hero-content">
                <div className="hero-title-row">
                  <h3>{seciliMahalleDetay.ad}</h3>
                  <span className="live-badge">Aktif</span>
                </div>

                <p className="hero-desc">
                  Bölgeye ait temel istatistikler, okul listesi ve İşler
                  Kitabevi noktaları aşağıda gösteriliyor.
                </p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div>
                  <span className="stat-label">Nüfus</span>
                  <strong>{formatNumber(seciliMahalleDetay.nufus)}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📐</div>
                <div>
                  <span className="stat-label">Yüzölçümü</span>
                  <strong>{formatArea(seciliMahalleDetay.yuzolcumu)}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🏫</div>
                <div>
                  <span className="stat-label">Toplam Okul</span>
                  <strong>{okullar.length}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div>
                  <span className="stat-label">İşler Kitabevi</span>
                  <strong>{seciliKitabevleri.length}</strong>
                </div>
              </div>
            </div>

            <div className="schools-card">
              <div className="schools-header">
                <h4>Okullar</h4>
                <span className="school-count">{okullar.length} kayıt</span>
              </div>

              {okullar.length > 0 ? (
                <ul className="school-list">
                  {okullar.map((okul, index) => (
                    <li
                      key={index}
                      className="school-item"
                      onClick={() => setSelectedSchool(okul)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="school-main">
                        <span className="school-name">{getSchoolName(okul)}</span>
                        <span className="school-type">{getSchoolType(okul)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-school-text">
                  Bu mahalle için okul bilgisi bulunamadı.
                </p>
              )}
            </div>

            <div className="schools-card">
              <div className="schools-header">
                <h4>İşler Kitabevleri</h4>
                <span className="school-count">
                  {seciliKitabevleri.length} kayıt
                </span>
              </div>

              {seciliKitabevleri.length > 0 ? (
                <ul className="school-list">
                  {seciliKitabevleri.map((sube, index) => (
                    <li key={index} className="school-item">
                      <div className="school-main">
                        <span className="school-name">{sube.ad}</span>
                        <span className="school-type">{sube.adres}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-school-text">
                  Bu mahallede İşler Kitabevi şubesi görünmüyor.
                </p>
              )}
            </div>
          </div>
        )}
      </aside>

      <SchoolModal
        school={selectedSchool}
        onClose={() => setSelectedSchool(null)}
      />
    </div>
  )
}

export default App
