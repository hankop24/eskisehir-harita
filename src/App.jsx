import { useMemo, useState } from 'react'
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

function getSchoolType(okulAdi = '') {
  const text = okulAdi.toLowerCase()

  if (text.includes('anaokulu')) return 'Anaokulu'
  if (text.includes('ilkokulu')) return 'İlkokul'
  if (text.includes('ortaokulu')) return 'Ortaokul'
  if (text.includes('lisesi')) return 'Lise'

  return 'Okul'
}

function App() {
  const [selectedMahalle, setSelectedMahalle] = useState(null)

  const seciliMahalleDetay = useMemo(() => {
    if (!selectedMahalle?.ad) return null

    return (
      mahalleVeri.find(
        (item) => normalizeText(item.ad) === normalizeText(selectedMahalle.ad)
      ) || selectedMahalle
    )
  }, [selectedMahalle])

  const okullar = seciliMahalleDetay?.okullar || []

  const seciliKitabevleri = useMemo(() => {
    if (!seciliMahalleDetay?.ad) return []

    return islerKitabevleri.filter(
      (item) =>
        normalizeText(item.mahalle) === normalizeText(seciliMahalleDetay.ad)
    )
  }, [seciliMahalleDetay])

  return (
    <div className="app-shell">
      <div className="map-area">
        <MapView setSelectedMahalle={setSelectedMahalle} />
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
                    <li key={index} className="school-item">
                      <div className="school-main">
                        <span className="school-name">{okul}</span>
                        <span className="school-type">
                          {getSchoolType(okul)}
                        </span>
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
    </div>
  )
}

export default App