// Ganti dengan URL Web App Google Apps Script hasil deploy
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-mjXk9z6TCYSlN3P6elmwfaMLiA1kvvmKAD2cHz7uLhntn1x4GOxsks_II5f3XpRhcQ/exec"; // ⬅️ GANTI

let currentLocation = { lat: null, long: null };
let capturedPhoto = null;
let videoStream = null;

// DOM Elements
const namaInput = document.getElementById('nama');
const getLocationBtn = document.getElementById('getLocationBtn');
const locationStatus = document.getElementById('locationStatus');
const startCameraBtn = document.getElementById('startCameraBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const cameraWrapper = document.getElementById('cameraWrapper');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const cameraStatus = document.getElementById('cameraStatus');
const photoPreview = document.getElementById('photoPreview');
const submitBtn = document.getElementById('submitBtn');
const resultDiv = document.getElementById('result');

// Fungsi mulai kamera
async function startCamera() {
  cameraStatus.innerText = 'Meminta akses kamera...';
  cameraStatus.style.background = '#f1f5f9';
  try {
    const constraints = { video: { facingMode: "user" } };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoStream = stream;
    video.srcObject = stream;
    cameraWrapper.style.display = 'block';
    startCameraBtn.disabled = true;
    stopCameraBtn.disabled = false;
    cameraStatus.innerText = '✅ Kamera aktif. Silakan ambil foto.';
    cameraStatus.style.background = '#d4edda';
  } catch (err) {
    console.error(err);
    let errorMsg = err.message;
    if (err.name === 'NotAllowedError') errorMsg = 'Izin kamera ditolak. Periksa pengaturan browser.';
    if (err.name === 'NotFoundError') errorMsg = 'Tidak ada kamera terdeteksi.';
    cameraStatus.innerText = 'Gagal: ' + errorMsg;
    cameraStatus.style.background = '#f8d7da';
    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;
  }
}

// Fungsi hentikan kamera
function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
    video.srcObject = null;
  }
  cameraWrapper.style.display = 'none';
  startCameraBtn.disabled = false;
  stopCameraBtn.disabled = true;
  cameraStatus.innerText = 'Kamera dihentikan.';
  cameraStatus.style.background = '#f1f5f9';
}

// Event kamera
startCameraBtn.addEventListener('click', startCamera);
stopCameraBtn.addEventListener('click', stopCamera);

// Ambil foto
captureBtn.addEventListener('click', () => {
  if (!videoStream || !video.videoWidth || !video.videoHeight) {
    cameraStatus.innerText = 'Kamera belum aktif atau belum siap.';
    return;
  }
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  // Mirroring
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  context.setTransform(1, 0, 0, 1, 0, 0);
  const imgData = canvas.toDataURL('image/jpeg', 0.8);
  capturedPhoto = imgData;
  photoPreview.innerHTML = `<img src="${imgData}" alt="Foto selfie">`;
  cameraStatus.innerText = '✅ Foto berhasil diambil.';
  checkFormComplete();
});

// Lokasi
getLocationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    locationStatus.innerText = 'Geolokasi tidak didukung browser ini.';
    return;
  }
  locationStatus.innerText = 'Mengambil lokasi...';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      currentLocation.lat = pos.coords.latitude;
      currentLocation.long = pos.coords.longitude;
      locationStatus.innerHTML = `✅ Lokasi: ${currentLocation.lat.toFixed(6)}, ${currentLocation.long.toFixed(6)}`;
      checkFormComplete();
    },
    (err) => {
      locationStatus.innerText = 'Gagal ambil lokasi: ' + err.message;
    }
  );
});

// Cek kelengkapan form
function checkFormComplete() {
  const namaValid = namaInput.value.trim() !== '';
  const locationValid = currentLocation.lat !== null && currentLocation.long !== null;
  const photoValid = capturedPhoto !== null;
  submitBtn.disabled = !(namaValid && locationValid && photoValid);
}

namaInput.addEventListener('input', checkFormComplete);

// Kirim presensi ke Apps Script
submitBtn.addEventListener('click', async () => {
  if (submitBtn.disabled) return;
  submitBtn.disabled = true;
  submitBtn.innerText = 'Menyimpan...';
  resultDiv.innerHTML = '';
  
  const payload = {
    nama: namaInput.value.trim(),
    lat: currentLocation.lat,
    long: currentLocation.long,
    image: capturedPhoto
  };
  
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Penting untuk Apps Script, meski response terbatas
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    // Karena mode 'no-cors', kita tidak bisa baca response body.
    // Tapi Apps Script tetap akan memproses. Kita kasih pesan sukses asumsi.
    resultDiv.innerHTML = "Presensi terkirim! (Cek spreadsheet) ✅";
    resultDiv.className = 'result success';
    // Reset form
    stopCamera();
    capturedPhoto = null;
    photoPreview.innerHTML = '';
    currentLocation = { lat: null, long: null };
    locationStatus.innerText = 'Belum mengambil lokasi';
    namaInput.value = '';
    checkFormComplete();
    submitBtn.innerText = '✅ Kirim Presensi';
  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = 'Error: ' + err.message;
    resultDiv.className = 'result error';
    submitBtn.disabled = false;
    submitBtn.innerText = '✅ Kirim Presensi';
  }
});

// Bersihkan kamera saat halaman ditutup
window.addEventListener('beforeunload', () => {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
  }
});