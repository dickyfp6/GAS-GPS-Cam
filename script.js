// GANTI INI DENGAN URL WEB APP KAMU
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwKj5KfcDCgOD-o-6-yrV2zlbUUqQmSgxAXFKqf4UvPg-VIo_Ybqni_MAF6vGoFMurM/exec"; 

let state = { lat: null, long: null, addr: "Mencari lokasi...", img: null };

window.onload = () => {
  updateTime();
  setInterval(updateTime, 1000);
  loadOrmawa();
  startGPS();
  startCamera();
};

async function loadOrmawa() {
  const select = document.getElementById('ormawa');
  try {
    const res = await fetch(APPS_SCRIPT_URL);
    const data = await res.json();
    select.innerHTML = '<option value="">-- Pilih ORMAWA --</option>';
    data.forEach(item => {
      let opt = document.createElement('option');
      opt.value = opt.textContent = item;
      select.appendChild(opt);
    });
  } catch (e) {
    select.innerHTML = '<option value="">Gagal memuat ORMAWA</option>';
  }
}

function startGPS() {
  navigator.geolocation.getCurrentPosition(async (p) => {
    state.lat = p.coords.latitude;
    state.long = p.coords.longitude;
    document.getElementById('overlayCoords').innerText = `Lat: ${state.lat.toFixed(5)} | Long: ${state.long.toFixed(5)}`;
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${state.lat}&lon=${state.long}`);
      const d = await res.json();
      state.addr = d.display_name.split(',').slice(0, 3).join(',');
      document.getElementById('overlayAddress').innerText = state.addr;
    } catch(e) { state.addr = "Lokasi terdeteksi"; }
    checkReady();
  }, null, { enableHighAccuracy: true });
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { aspectRatio: 1.777 } });
    document.getElementById('video').srcObject = stream;
    document.getElementById('statusMsg').innerText = "Sistem Siap ✅";
    checkReady();
  } catch (e) {
    document.getElementById('statusMsg').innerText = "Kamera diblokir!";
  }
}

function checkReady() {
  const ready = document.getElementById('nama').value && document.getElementById('ormawa').value && state.lat;
  document.getElementById('captureBtn').disabled = !ready;
}

document.getElementById('nama').oninput = checkReady;
document.getElementById('ormawa').onchange = checkReady;

// AMBIL FOTO (Tanpa Mirror)
document.getElementById('captureBtn').onclick = () => {
  const v = document.getElementById('video');
  const c = document.getElementById('canvas');
  const ctx = c.getContext('2d');
  
  c.width = v.videoWidth;
  c.height = v.videoHeight;
  
  // Gambar normal tanpa mirror
  ctx.drawImage(v, 0, 0, c.width, c.height);
  
  // Tambah Watermark
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, c.height - 110, c.width, 110);
  ctx.fillStyle = "white";
  ctx.font = "bold 26px Arial";
  ctx.fillText(state.addr, 25, c.height - 65);
  ctx.font = "20px Arial";
  ctx.fillText(`${document.getElementById('overlayCoords').innerText} | ${document.getElementById('overlayTime').innerText}`, 25, c.height - 30);

  state.img = c.toDataURL('image/jpeg', 0.8);
  v.style.display = 'none';
  document.getElementById('liveOverlay').style.display = 'none';
  c.style.display = 'block';
  
  document.getElementById('captureBtn').style.display = 'none';
  document.getElementById('postCapture').style.display = 'flex';
};

document.getElementById('retakeBtn').onclick = () => location.reload();

document.getElementById('submitBtn').onclick = async () => {
  const sBtn = document.getElementById('submitBtn');
  sBtn.disabled = true; sBtn.innerText = "Mengirim...";
  
  const payload = {
    nama: document.getElementById('nama').value,
    ormawa: document.getElementById('ormawa').value,
    lat: state.lat, long: state.long, address: state.addr, image: state.img
  };

  await fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
  
  const resDiv = document.getElementById('result');
  resDiv.style.display = 'block';
  resDiv.className = 'result-box success';
  resDiv.innerText = "Berhasil! Data telah tersimpan di Spreadsheet.";
  setTimeout(() => location.reload(), 3000);
};

function updateTime() {
  document.getElementById('overlayTime').innerText = new Date().toLocaleTimeString('id-ID') + " WIB";
}