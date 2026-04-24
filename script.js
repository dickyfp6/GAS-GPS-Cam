const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwKj5KfcDCgOD-o-6-yrV2zlbUUqQmSgxAXFKqf4UvPg-VIo_Ybqni_MAF6vGoFMurM/exec";

let state = { lat: null, long: null, addr: "Mencari lokasi...", img: null, stream: null };

// 1. Inisialisasi: Izin & Data
window.onload = async () => {
  startTime();
  fetchOrmawa();
  initGPS();
  initCamera();
};

async function fetchOrmawa() {
  const select = document.getElementById('ormawa');
  try {
    const res = await fetch(APPS_SCRIPT_URL);
    const list = await res.json();
    select.innerHTML = '<option value="">-- Pilih ORMAWA --</option>';
    list.forEach(item => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = item;
      select.appendChild(opt);
    });
  } catch (e) {
    select.innerHTML = '<option value="">Gagal memuat data</option>';
  }
}

function initGPS() {
  navigator.geolocation.getCurrentPosition(async (p) => {
    state.lat = p.coords.latitude;
    state.long = p.coords.longitude;
    document.getElementById('overlayCoords').innerText = `Lat: ${state.lat.toFixed(5)} | Long: ${state.long.toFixed(5)}`;
    
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${state.lat}&lon=${state.long}`);
    const d = await res.json();
    state.addr = d.display_name.split(',').slice(0, 3).join(',');
    document.getElementById('overlayAddress').innerText = state.addr;
    checkReady();
  }, null, { enableHighAccuracy: true });
}

async function initCamera() {
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ video: { aspectRatio: 1.777 } });
    document.getElementById('video').srcObject = state.stream;
    document.getElementById('statusMsg').innerText = "Sistem Siap ✅";
    checkReady();
  } catch (e) {
    document.getElementById('statusMsg').innerText = "Kamera tidak terdeteksi!";
  }
}

function checkReady() {
  const isFilled = document.getElementById('nama').value && document.getElementById('ormawa').value;
  document.getElementById('captureBtn').disabled = !(isFilled && state.lat);
}

document.getElementById('nama').oninput = checkReady;
document.getElementById('ormawa').onchange = checkReady;

// 2. Capture & Freeze
document.getElementById('captureBtn').onclick = () => {
  const v = document.getElementById('video');
  const c = document.getElementById('canvas');
  const ctx = c.getContext('2d');
  
  c.width = v.videoWidth;
  c.height = v.videoHeight;
  
  ctx.translate(c.width, 0); ctx.scale(-1, 1);
  ctx.drawImage(v, 0, 0);
  ctx.setTransform(1,0,0,1,0,0);
  
  // Watermark
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, c.height - 100, c.width, 100);
  ctx.fillStyle = "white";
  ctx.font = "bold 24px Arial";
  ctx.fillText(state.addr, 20, c.height - 60);
  ctx.font = "18px Arial";
  ctx.fillText(`${document.getElementById('overlayCoords').innerText} | ${document.getElementById('overlayTime').innerText}`, 20, c.height - 25);

  state.img = c.toDataURL('image/jpeg', 0.8);
  v.style.display = 'none';
  document.getElementById('liveOverlay').style.display = 'none';
  c.style.display = 'block';
  
  document.getElementById('captureBtn').style.display = 'none';
  document.getElementById('postCaptureButtons').style.display = 'flex';
};

document.getElementById('retakeBtn').onclick = () => {
  location.reload(); // Paling bersih untuk reset state
};

// 3. Submit
document.getElementById('submitBtn').onclick = async () => {
  const btn = document.getElementById('submitBtn');
  btn.disabled = true; btn.innerText = "Mengirim...";
  
  const payload = {
    nama: document.getElementById('nama').value,
    ormawa: document.getElementById('ormawa').value,
    lat: state.lat, long: state.long, address: state.addr, image: state.img
  };

  await fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
  
  document.getElementById('result').innerHTML = "Presensi Berhasil! Halaman akan dimuat ulang...";
  document.getElementById('result').className = "result-box success";
  setTimeout(() => location.reload(), 3000);
};

function startTime() {
  setInterval(() => {
    document.getElementById('overlayTime').innerText = new Date().toLocaleTimeString('id-ID');
  }, 1000);
}