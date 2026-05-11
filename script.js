// GANTI INI DENGAN URL WEB APP KAMU
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwKj5KfcDCgOD-o-6-yrV2zlbUUqQmSgxAXFKqf4UvPg-VIo_Ybqni_MAF6vGoFMurM/exec"; 

let state = { lat: null, long: null, addr: "Mencari lokasi...", img: null };

// ============ Butterfly Animation System ============
class ButterflyGenerator {
    constructor(containerSelector = '.butterfly-container') {
        this.container = document.querySelector(containerSelector);
        this.butterflyEmojis = ['🦋', '🦋'];
        this.activeButterflies = 0;
        this.maxButterflies = 8;
    }

    createButterfly() {
        if (this.activeButterflies >= this.maxButterflies) return;

        const butterfly = document.createElement('div');
        butterfly.className = 'butterfly';
        butterfly.textContent = this.butterflyEmojis[Math.floor(Math.random() * this.butterflyEmojis.length)];

        const startX = Math.random() * 100;
        const startY = Math.random() * -50;
        const duration = 15 + Math.random() * 10;

        butterfly.style.cssText = `
            left: ${startX}vw;
            top: ${startY}vh;
            animation: floatButter ${duration}s linear forwards;
            animation-delay: 0s;
            opacity: ${0.6 + Math.random() * 0.3};
        `;

        this.container.appendChild(butterfly);
        this.activeButterflies++;

        setTimeout(() => {
            butterfly.remove();
            this.activeButterflies--;
        }, duration * 1000);
    }

    startAnimation(interval = 3000) {
        this.animationInterval = setInterval(() => {
            this.createButterfly();
        }, interval);
    }

    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
    }
}

// ============ Ripple Animation ============
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

function isLainnyaSelected() {
  return document.getElementById('ormawa').value.trim().toLowerCase() === 'lainnya';
}

function getFinalOrmawaValue() {
  if (isLainnyaSelected()) {
    return document.getElementById('ormawaCustom').value.trim();
  }
  return document.getElementById('ormawa').value;
}

function toggleOrmawaCustomField() {
  const customGroup = document.getElementById('ormawaCustomGroup');
  customGroup.style.display = isLainnyaSelected() ? 'block' : 'none';
}

window.onload = () => {
  // Initialize butterfly animation
  const butterflyGen = new ButterflyGenerator('.butterfly-container');
  butterflyGen.startAnimation(2500);

  // Add ripple effect to buttons
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', function() {
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
      `;
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

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

    const hasLainnya = data.some(item => String(item).trim().toLowerCase() === 'lainnya');
    if (!hasLainnya) {
      let otherOpt = document.createElement('option');
      otherOpt.value = otherOpt.textContent = 'Lainnya';
      select.appendChild(otherOpt);
    }
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
  const ready = document.getElementById('nama').value.trim() && getFinalOrmawaValue() && state.lat;
  document.getElementById('captureBtn').disabled = !ready;
}

document.getElementById('nama').oninput = checkReady;
document.getElementById('ormawa').onchange = () => {
  toggleOrmawaCustomField();
  checkReady();
};
document.getElementById('ormawaCustom').oninput = checkReady;

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
    ormawa: getFinalOrmawaValue(),
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
