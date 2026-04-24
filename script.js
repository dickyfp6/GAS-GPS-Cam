// GANTI DENGAN URL WEB APP DEPLOY KAMU
const APPS_SCRIPT_URL = "URL_WEB_APP_KAMU_DISINI"; 

// Data State
let currentLocation = { lat: null, long: null, address: "Mencari lokasi..." };
let capturedPhoto = null;
let videoStream = null;

// DOM Elements
const ormawaSelect = document.getElementById('ormawa');
const namaInput = document.getElementById('nama');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const liveOverlay = document.getElementById('liveOverlay');
const overlayAddress = document.getElementById('overlayAddress');
const overlayCoords = document.getElementById('overlayCoords');
const overlayTime = document.getElementById('overlayTime');
const statusMsg = document.getElementById('statusMsg');

const captureBtn = document.getElementById('captureBtn');
const retakeBtn = document.getElementById('retakeBtn');
const submitBtn = document.getElementById('submitBtn');
const resultDiv = document.getElementById('result');

// 1. Inisialisasi Data Ormawa (seperti sebelumnya)
const daftarOrmawa = [
  "BEM ITS", "BLM ITS", "HIMASIKA - Fisika", "HIMATIKA - Matematika", "HMTC - Teknik Informatika",
  "HMTI - Teknik Sistem dan Industri", "HMTL - Teknik Lingkungan", "HIMAGE - Teknik Geomatika",
  "HIMATEKKOM - Teknik Komputer", "HMSI - Sistem Informasi", "Lainnya" // Tambahkan sisa data ormawa di sini
];

daftarOrmawa.forEach(ormawa => {
  const option = document.createElement('option');
  option.value = ormawa;
  option.textContent = ormawa;
  ormawaSelect.appendChild(option);
});

// 2. Fungsi Auto-Run saat halaman dimuat
window.addEventListener('DOMContentLoaded', async () => {
  updateClock();
  setInterval(updateClock, 1000);
  
  // Minta Lokasi
  initLocation();
  // Minta Kamera
  await initCamera();
});

function updateClock() {
  const now = new Date();
  overlayTime.innerText = now.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'medium' }) + " WIB";
}

function initLocation() {
  if (!navigator.geolocation) {
    statusMsg.innerText = "Browser tidak mendukung GPS.";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      currentLocation.lat = pos.coords.latitude;
      currentLocation.long = pos.coords.longitude;
      overlayCoords.innerText = `Lat: ${currentLocation.lat.toFixed(6)} | Long: ${currentLocation.long.toFixed(6)}`;
      statusMsg.innerText = "Lokasi ditemukan ✅";
      
      // Ambil alamat dari OpenStreetMap API (Gratis)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLocation.lat}&lon=${currentLocation.long}&zoom=18&addressdetails=1`);
        const data = await res.json();
        if (data && data.display_name) {
          // Potong agar tidak terlalu panjang
          const addrParts = data.display_name.split(",").slice(0, 4);
          currentLocation.address = addrParts.join(",").trim();
        } else {
          currentLocation.address = "Detail jalan tidak ditemukan";
        }
      } catch (e) {
        currentLocation.address = "Gagal memuat nama jalan";
      }
      overlayAddress.innerText = currentLocation.address;
      checkFormComplete(); // Validasi tombol capture
    },
    (err) => {
      statusMsg.innerText = "Gagal ambil lokasi. Pastikan GPS aktif/diizinkan.";
      overlayAddress.innerText = "Lokasi tidak diizinkan!";
    },
    { enableHighAccuracy: true }
  );
}

async function initCamera() {
  try {
    const constraints = { video: { facingMode: "user" } };
    videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = videoStream;
    statusMsg.innerText = "Kamera & Lokasi siap digunakan ✅";
    checkFormComplete();
  } catch (err) {
    statusMsg.innerText = "Kamera diblokir atau tidak ditemukan.";
  }
}

// 3. Validasi: Tombol "Ambil Foto" baru aktif kalau Lokasi & Form terisi
function checkFormComplete() {
  const isFormFilled = namaInput.value.trim() !== '' && ormawaSelect.value !== '';
  const isLocationReady = currentLocation.lat !== null;
  const isCameraReady = videoStream !== null;
  
  if (isFormFilled && isLocationReady && isCameraReady) {
    captureBtn.disabled = false;
  } else {
    captureBtn.disabled = true;
  }
}

ormawaSelect.addEventListener('change', checkFormComplete);
namaInput.addEventListener('input', checkFormComplete);

// 4. Aksi Ambil Foto (Freeze & Draw Watermark)
captureBtn.addEventListener('click', () => {
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Menggambar video ke canvas (Di-mirror karena kamera depan)
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Reset transform agar tulisan teks tidak terbalik (mirror)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  // Menggambar Frame/Watermark Hitam Transparan di bagian bawah
  const rectHeight = 120;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, canvas.height - rectHeight, canvas.width, rectHeight);
  
  // Menggambar Teks Alamat, Koordinat, & Waktu
  ctx.fillStyle = 'white';
  
  // Responsive font size
  const fontSizeAddress = Math.max(14, canvas.width * 0.03); 
  const fontSizeSmall = Math.max(12, canvas.width * 0.025);
  
  // Gambar Alamat
  ctx.font = `bold ${fontSizeAddress}px sans-serif`;
  ctx.fillText(currentLocation.address, 15, canvas.height - rectHeight + 35, canvas.width - 30);
  
  // Gambar Koordinat
  ctx.font = `${fontSizeSmall}px sans-serif`;
  ctx.fillText(`Lat: ${currentLocation.lat.toFixed(6)} | Long: ${currentLocation.long.toFixed(6)}`, 15, canvas.height - rectHeight + 65);
  
  // Gambar Waktu
  ctx.fillText(overlayTime.innerText, 15, canvas.height - rectHeight + 90);

  // Simpan hasil base64
  capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);
  
  // Sembunyikan Video & Live Overlay, Tampilkan Canvas (Efek Freeze)
  video.style.display = 'none';
  liveOverlay.style.display = 'none';
  canvas.style.display = 'block';
  
  // Atur Tombol
  captureBtn.style.display = 'none';
  retakeBtn.style.display = 'block';
  submitBtn.style.display = 'block';
});

// 5. Aksi Ulangi Foto (Unfreeze)
retakeBtn.addEventListener('click', () => {
  capturedPhoto = null;
  video.style.display = 'block';
  liveOverlay.style.display = 'block';
  canvas.style.display = 'none';
  
  captureBtn.style.display = 'block';
  retakeBtn.style.display = 'none';
  submitBtn.style.display = 'none';
  resultDiv.className = 'result';
  resultDiv.innerHTML = '';
});

// 6. Kirim Data
submitBtn.addEventListener('click', async () => {
  submitBtn.disabled = true;
  submitBtn.innerText = 'Menyimpan...';
  retakeBtn.disabled = true;
  
  const payload = {
    nama: namaInput.value.trim(),
    ormawa: ormawaSelect.value,
    lat: currentLocation.lat,
    long: currentLocation.long,
    address: currentLocation.address,
    image: capturedPhoto
  };
  
  try {
    // Pakai no-cors agar tidak bentrok dengan kebijakan CORS Apps Script
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    resultDiv.innerHTML = "Presensi Berhasil Dikirim! ✅";
    resultDiv.className = 'result success';
    
    // Reset Form Otomatis setelah sukses
    setTimeout(() => {
      namaInput.value = '';
      ormawaSelect.value = '';
      retakeBtn.click(); // Panggil fungsi retake untuk unfreeze kamera
      submitBtn.innerText = '✅ Kirim Presensi';
      submitBtn.disabled = false;
      retakeBtn.disabled = false;
      checkFormComplete();
    }, 2500);

  } catch (err) {
    resultDiv.innerHTML = 'Gagal mengirim: ' + err.message;
    resultDiv.className = 'result error';
    submitBtn.disabled = false;
    retakeBtn.disabled = false;
    submitBtn.innerText = '✅ Kirim Presensi';
  }
});