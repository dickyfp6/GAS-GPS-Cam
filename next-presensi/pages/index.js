import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwKj5KfcDCgOD-o-6-yrV2zlbUUqQmSgxAXFKqf4UvPg-VIo_Ybqni_MAF6vGoFMurM/exec";

export default function Home() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [statusMsg, setStatusMsg] = useState('Menyiapkan kamera dan lokasi...')
  const [ormawa, setOrmawa] = useState([])
  const [name, setName] = useState('')
  const [captured, setCaptured] = useState(null)
  const [lat, setLat] = useState(null)
  const [long, setLong] = useState(null)
  const [addr, setAddr] = useState('Mencari lokasi...')
  const [overlayTime, setOverlayTime] = useState(new Date().toLocaleTimeString('id-ID') + ' WIB')
  const [selectedOrmawa, setSelectedOrmawa] = useState('')
  const [showOrmawaCustom, setShowOrmawaCustom] = useState(false)
  const [ormawaCustom, setOrmawaCustom] = useState('')
  const [resultMsg, setResultMsg] = useState(null)

  useEffect(() => {
    startCamera()
    loadOrmawa()
    startGPS()
    const t = setInterval(() => setOverlayTime(new Date().toLocaleTimeString('id-ID') + ' WIB'), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      if (videoRef.current) videoRef.current.srcObject = stream
      setStatusMsg('Sistem Siap ✅')
    } catch (e) {
      setStatusMsg('Tidak dapat mengakses kamera')
    }
  }

  async function loadOrmawa() {
    try {
      const res = await fetch(APPS_SCRIPT_URL)
      const data = await res.json()
      setOrmawa(data)
    } catch (e) {
      setOrmawa([])
    }
  }

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    // draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // watermark background
    const h = canvas.height
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, h - 110, canvas.width, 110)
    ctx.fillStyle = 'white'
    ctx.font = 'bold 26px Arial'
    ctx.fillText(addr, 25, h - 65)
    ctx.font = '20px Arial'
    const coordsText = `Lat: ${lat?.toFixed(5) || '-'} | Long: ${long?.toFixed(5) || '-'} | ${overlayTime}`
    ctx.fillText(coordsText, 25, h - 30)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCaptured(dataUrl)

    // hide live video by pausing stream
    try { if (video.srcObject) video.srcObject.getTracks().forEach(t => t.stop()) } catch(e){}
  }

  // Minimal GPS placeholder
  function startGPS() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (p) => {
      setLat(p.coords.latitude)
      setLong(p.coords.longitude)
      // update overlay coords
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.coords.latitude}&lon=${p.coords.longitude}`)
        const d = await res.json()
        const short = d.display_name.split(',').slice(0,3).join(',')
        setAddr(short)
      } catch(e) {
        setAddr('Lokasi terdeteksi')
      }
    }, null, { enableHighAccuracy: true })
  }

  function getFinalOrmawaValue() {
    if (String(selectedOrmawa).trim().toLowerCase() === 'lainnya') return ormawaCustom.trim()
    return selectedOrmawa
  }

  function checkReady() {
    const ready = name.trim() && getFinalOrmawaValue() && lat
    return ready
  }

  async function submitData() {
    const payload = {
      nama: name,
      ormawa: getFinalOrmawaValue(),
      lat, long, address: addr, image: captured
    }
    setResultMsg('Mengirim...')
    try {
      await fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) })
      setResultMsg('Berhasil! Data telah tersimpan di Spreadsheet.')
      setTimeout(() => location.reload(), 3000)
    } catch(e) {
      setResultMsg('Gagal mengirim data')
    }
  }

  return (
    <>
      <Head>
        <title>Sistem Presensi - Next.js</title>
      </Head>
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl bg-[#f5f1ed] rounded-2xl p-8 border-2 border-[#D4AF37]">
          <h2 className="text-3xl text-[#8B0000] text-center font-bold mb-6">📸 FOTO DI SINI DULU PRES!</h2>
          <p className="text-sm text-[#8B0000] text-center mb-6">{statusMsg}</p>

          <div className="flex gap-8">
            <div className="flex-3">
              <div className="relative rounded-lg overflow-hidden border-2 border-[#D4AF37]">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover bg-black" />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-3 text-sm">Lat: - | Long: - • <span>{new Date().toLocaleTimeString()}</span></div>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-bold text-[#8B0000] mb-2">Pilih ORMAWA</label>
              <select value={selectedOrmawa} onChange={e=>{ setSelectedOrmawa(e.target.value); setShowOrmawaCustom(String(e.target.value).trim().toLowerCase()==='lainnya') }} className="w-full p-3 rounded-md border-2 border-[#D4AF37] mb-4">
                <option value="">-- Pilih ORMAWA --</option>
                {ormawa.map((o, i) => <option key={i} value={o}>{o}</option>)}
                {!ormawa.some(x=>String(x).trim().toLowerCase()==='lainnya') && <option value="Lainnya">Lainnya</option>}
              </select>

              {showOrmawaCustom && (
                <div className="mb-4">
                  <label className="block text-sm font-bold text-[#8B0000] mb-2">Isi ORMAWA Lainnya</label>
                  <input value={ormawaCustom} onChange={e=>setOrmawaCustom(e.target.value)} placeholder="Masukkan nama ORMAWA" className="w-full p-3 rounded-md border-2 border-[#D4AF37]" />
                </div>
              )}

              <label className="block text-sm font-bold text-[#8B0000] mb-2">Nama Lengkap</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Masukkan nama Anda" className="w-full p-3 rounded-md border-2 border-[#D4AF37] mb-4" />

              {!captured && (
                <button onClick={capture} disabled={!checkReady()} className="w-full p-3 bg-[#D4AF37] text-[#1a0f0f] font-bold rounded-md disabled:opacity-60">📸 Ambil Foto</button>
              )}

              {captured && (
                <div className="mt-4">
                  <img src={captured} alt="capture" className="w-full rounded-md mb-2" />
                  <div className="flex gap-2">
                    <button onClick={submitData} className="flex-1 p-3 bg-[#8B0000] text-white rounded-md">✅ Kirim Data</button>
                    <button onClick={()=>{ setCaptured(null); window.location.reload() }} className="flex-1 p-3 bg-[#B8860B] text-white rounded-md">🔄 Foto Ulang</button>
                  </div>
                </div>
              )}

              {resultMsg && <div className="result-box success mt-4">{resultMsg}</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
