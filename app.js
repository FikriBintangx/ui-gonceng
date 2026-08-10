/* ==========================================================================
   GO-NCENG MAP-FIRST NATIVE APP LOGIC
   ========================================================================== */

const state = {
  currentStep: 1,
  selectedService: 'gonceng-ride',
  selectedVehicle: 'gonceng_ride_std',
  baseFare: 14000,
  discountAmount: 5000,
  voucherCode: 'GONCENGHEMAT',
  selectedPayment: 'gopay',
  pickupLocation: 'Stasiun Manggarai, Jakarta Selatan',
  destLocation: 'Grand Indonesia Mall, Jakarta Pusat',
  driverNotes: '',
  driverName: 'Budi Santoso',
  driverPlate: 'B 4821 SGX • Honda Vario 160',
  driverPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  rating: 5,

  // Coordinates
  pickupCoords: [-6.2099, 106.8502],
  destCoords: [-6.1953, 106.8202],
  
  // Single Global Map Engine
  mainMap: null,
  routePolyline: null,
  pickupMarker: null,
  destMarker: null,
  driverMarker: null,
  trackingTimer: null
};

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initMainMap();
  updateCalculatedFare();
  
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
    });
  }
});

function initClock() {
  const timeEl = document.getElementById('statusTime');
  const updateTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    if (timeEl) timeEl.textContent = `${hours}:${minutes}`;
  };
  updateTime();
  setInterval(updateTime, 10000);
}

/* ================= SINGLE FULL CANVAS MAP ENGINE ================= */
function initMainMap() {
  if (!document.getElementById('mainMap')) return;

  state.mainMap = L.map('mainMap', { zoomControl: false }).setView(state.pickupCoords, 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(state.mainMap);

  const pickupIcon = L.divIcon({
    className: 'custom-map-pin',
    html: '<div style="background:#00AA13; width:18px; height:18px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 12px rgba(0,0,0,0.5);"></div>',
    iconSize: [18, 18]
  });

  const destIcon = L.divIcon({
    className: 'custom-map-pin',
    html: '<div style="background:#ef4444; width:18px; height:18px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 12px rgba(0,0,0,0.5);"></div>',
    iconSize: [18, 18]
  });

  state.pickupMarker = L.marker(state.pickupCoords, { icon: pickupIcon }).addTo(state.mainMap).bindPopup("Jemput: Stasiun Manggarai");
  state.destMarker = L.marker(state.destCoords, { icon: destIcon }).addTo(state.mainMap).bindPopup("Tujuan: Grand Indonesia");
}

function recenterMapToUser() {
  if (state.mainMap) {
    state.mainMap.flyTo(state.pickupCoords, 15, { duration: 1.2 });
  }
}

/* ================= STEP NAVIGATION & MAP OVERLAYS ================= */
function goToStep(stepNum) {
  state.currentStep = stepNum;

  document.querySelectorAll('.sheet-panel').forEach(panel => panel.classList.remove('active'));

  const panels = document.querySelectorAll('.sheet-panel');
  if (panels[stepNum - 1]) panels[stepNum - 1].classList.add('active');

  const btnBack = document.getElementById('btnBack');
  const bottomNav = document.getElementById('bottomNav');
  const island = document.getElementById('dynamicIsland');
  const islandBadge = document.getElementById('islandBadge');

  if (btnBack) {
    btnBack.style.display = stepNum > 1 && stepNum < 5 ? 'flex' : 'none';
    btnBack.onclick = () => goToStep(stepNum - 1);
  }

  if (bottomNav) bottomNav.style.display = stepNum === 1 ? 'flex' : 'none';

  // Dynamic Island Badge & Map Modes
  if (stepNum === 4) {
    if (island) island.classList.add('expanded');
    if (islandBadge) islandBadge.style.display = 'flex';
  } else {
    if (island) island.classList.remove('expanded');
    if (islandBadge) islandBadge.style.display = 'none';
  }

  if (stepNum === 2 || stepNum === 3) {
    showRoutePolylineOnMap();
  } else if (stepNum === 4) {
    startDriverSimulation();
  }
}

function showRoutePolylineOnMap() {
  if (!state.mainMap) return;

  if (state.routePolyline) {
    state.mainMap.removeLayer(state.routePolyline);
  }

  state.routePolyline = L.polyline([state.pickupCoords, [-6.2020, 106.8350], state.destCoords], {
    color: '#00AA13',
    weight: 5,
    opacity: 0.85,
    dashArray: '8, 8'
  }).addTo(state.mainMap);

  state.mainMap.fitBounds(state.routePolyline.getBounds(), { padding: [80, 80] });
}

function selectService(serviceType) {
  state.selectedService = serviceType;
  document.querySelectorAll('.service-pill').forEach(card => card.classList.remove('active'));
  const activeCard = document.querySelector(`.service-pill[data-service="${serviceType}"]`);
  if (activeCard) activeCard.classList.add('active');

  const vCards = document.querySelectorAll('.vehicle-card');
  vCards.forEach(card => {
    if (card.dataset.vtype === serviceType) {
      card.style.display = 'flex';
      card.click();
    } else {
      card.style.display = 'flex'; // show all or filter if clicked
    }
  });

  const fares = {
    'gonceng-ride': { veh: 'gonceng_ride_std', fare: 14000 },
    'gonceng-food': { veh: 'gonceng_food_std', fare: 12000 },
    'gonceng-send': { veh: 'gonceng_send_std', fare: 16000 },
    'gonceng-kids': { veh: 'gonceng_kids_std', fare: 22000 },
    'gonceng-shop': { veh: 'gonceng_shop_std', fare: 18000 }
  };

  const target = fares[serviceType] || fares['gonceng-ride'];
  const targetCard = document.querySelector(`.vehicle-card[data-vtype="${serviceType}"]`);
  if (targetCard) {
    selectVehicle(targetCard, target.veh, target.fare);
  }
}

function selectVehicle(element, vehId, fare) {
  state.selectedVehicle = vehId;
  state.baseFare = fare;

  if (element) {
    document.querySelectorAll('.vehicle-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
  }
  updateCalculatedFare();
}

function selectPaymentMethod(element, payId) {
  state.selectedPayment = payId;
  document.querySelectorAll('.pay-tile').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');

  document.querySelectorAll('.pay-tile .radio-icon').forEach(i => {
    i.className = 'fa-regular fa-circle radio-icon';
  });
  const radio = element.querySelector('.radio-icon');
  if (radio) radio.className = 'fa-solid fa-circle-dot radio-icon';
}

function updateCalculatedFare() {
  const finalFare = Math.max(0, state.baseFare + 2000 - state.discountAmount);
  
  const s2Total = document.getElementById('step2TotalFare');
  if (s2Total) s2Total.textContent = `Rp ${finalFare.toLocaleString('id-ID')}`;

  const summaryBaseFare = document.getElementById('summaryBaseFare');
  const summaryDiscountVal = document.getElementById('summaryDiscountVal');
  const summaryFinalTotal = document.getElementById('summaryFinalTotal');

  if (summaryBaseFare) summaryBaseFare.textContent = `Rp ${state.baseFare.toLocaleString('id-ID')}`;
  if (summaryDiscountVal) summaryDiscountVal.textContent = `-Rp ${state.discountAmount.toLocaleString('id-ID')}`;
  if (summaryFinalTotal) summaryFinalTotal.textContent = `Rp ${finalFare.toLocaleString('id-ID')}`;
}

function setQuickDest(placeName) {
  const destInput = document.getElementById('inputDestination');
  if (destInput) {
    destInput.value = placeName;
    state.destLocation = placeName;
  }
}

function clearInput(inputId) {
  const el = document.getElementById(inputId);
  if (el) el.value = '';
}

function toggleVoucherModal() {
  const modal = document.getElementById('voucherModal');
  if (modal) modal.classList.toggle('show');
}

function applyVoucher(code, discount, title, desc) {
  state.voucherCode = code;
  state.discountAmount = discount;

  const voucherTitle = document.getElementById('appliedVoucherTitle');
  const voucherDesc = document.getElementById('appliedVoucherDesc');

  if (voucherTitle) voucherTitle.textContent = title;
  if (voucherDesc) voucherDesc.textContent = desc;

  updateCalculatedFare();
  toggleVoucherModal();
}

function processPaymentOrder() {
  const notesEl = document.getElementById('driverNotes');
  if (notesEl) state.driverNotes = notesEl.value;
  goToStep(4);
}

function startDriverSimulation() {
  const searchBox = document.getElementById('viewSearchingDriver');
  const driverFoundBox = document.getElementById('viewDriverFound');
  const islandStatus = document.getElementById('islandStatusText');
  const searchFill = document.getElementById('searchProgressFill');

  if (searchBox) searchBox.style.display = 'flex';
  if (driverFoundBox) driverFoundBox.style.display = 'none';
  if (islandStatus) islandStatus.textContent = 'Mencari Driver';
  if (searchFill) searchFill.style.width = '20%';

  setTimeout(() => { if (searchFill) searchFill.style.width = '70%'; }, 1000);

  setTimeout(() => {
    if (searchFill) searchFill.style.width = '100%';
    if (searchBox) searchBox.style.display = 'none';
    if (driverFoundBox) driverFoundBox.style.display = 'block';
    if (islandStatus) islandStatus.textContent = 'Driver OTW';

    animateDriverMovement();
  }, 2200);
}

function animateDriverMovement() {
  let progress = 0;
  const start = [-6.2135, 106.8550];
  const pickup = state.pickupCoords;
  const dest = state.destCoords;

  if (state.driverMarker) {
    state.mainMap.removeLayer(state.driverMarker);
  }

  const bikeIcon = L.divIcon({
    className: 'driver-bike-marker',
    html: '<div style="background:#00AA13; color:#fff; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 18px rgba(0,0,0,0.4); font-size:18px;"><i class="fa-solid fa-motorcycle"></i></div>',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });

  state.driverMarker = L.marker(start, { icon: bikeIcon }).addTo(state.mainMap);

  if (state.trackingTimer) clearInterval(state.trackingTimer);

  state.trackingTimer = setInterval(() => {
    progress += 0.05;

    let currentLat, currentLng;
    const t1 = document.getElementById('stepTimeline1');
    const t2 = document.getElementById('stepTimeline2');
    const t3 = document.getElementById('stepTimeline3');

    if (progress <= 0.3) {
      const ratio = progress / 0.3;
      currentLat = start[0] + (pickup[0] - start[0]) * ratio;
      currentLng = start[1] + (pickup[1] - start[1]) * ratio;
      if (t1) t1.className = 't-node active';
    } else if (progress <= 0.5) {
      currentLat = pickup[0];
      currentLng = pickup[1];
      if (t2) t2.className = 't-node active';
    } else if (progress < 1.0) {
      const ratio = (progress - 0.5) / 0.5;
      currentLat = pickup[0] + (dest[0] - pickup[0]) * ratio;
      currentLng = pickup[1] + (dest[1] - pickup[1]) * ratio;
      if (t3) t3.className = 't-node active';
    } else {
      clearInterval(state.trackingTimer);
      state.trackingTimer = null;
      setTimeout(() => { goToStep(5); }, 1200);
      return;
    }

    if (state.driverMarker && state.mainMap) {
      state.driverMarker.setLatLng([currentLat, currentLng]);
      state.mainMap.panTo([currentLat, currentLng]);
    }
  }, 1000);
}

function fastForwardTripSim() {
  if (state.trackingTimer) {
    clearInterval(state.trackingTimer);
    state.trackingTimer = null;
  }
  goToStep(5);
}

function setRating(val) {
  state.rating = val;
  const stars = document.querySelectorAll('#starRating .star');
  stars.forEach((star, index) => {
    if (index < val) star.classList.add('active');
    else star.classList.remove('active');
  });
}

function submitRating() {
  const btn = document.querySelector('.btn-submit-review');
  if (btn) {
    btn.textContent = '✔ Ulasan Terkirim!';
    btn.style.background = '#00AA13';
    btn.style.color = '#ffffff';
  }
}

function resetAppToHome() {
  state.currentStep = 1;
  state.baseFare = 14000;
  state.discountAmount = 5000;
  state.selectedVehicle = 'goride_std';
  state.selectedService = 'goride';
  goToStep(1);
}

function openChatModal() {
  alert('Chat dengan Budi Santoso:\n"Saya sudah sampai di depan gapura Pintu Barat ya Mas!"');
}

/* ================= COLOR CUSTOMIZER ENGINE ================= */
function toggleColorCustomizer() {
  const modal = document.getElementById('colorCustomizerModal');
  if (!modal) {
    console.error('Modal colorCustomizerModal tidak ditemukan!');
    return;
  }
  if (modal.style.display === 'flex' || modal.classList.contains('show')) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  } else {
    modal.style.display = 'flex';
    modal.classList.add('show');
  }
}

function updateThemeColor(type, hexColor) {
  const root = document.documentElement;

  if (type === 'primary') {
    root.style.setProperty('--primary', hexColor);
    root.style.setProperty('--primary-dark', adjustColorBrightness(hexColor, -20));
    root.style.setProperty('--primary-light', hexColor + '18'); // subtle tint
    const valEl = document.getElementById('valPrimary');
    if (valEl) valEl.textContent = hexColor.toUpperCase();
  } 
  else if (type === 'sheetBg') {
    root.style.setProperty('--bg-sheet', hexColor);
    const valEl = document.getElementById('valSheetBg');
    if (valEl) valEl.textContent = hexColor.toUpperCase();
  } 
  else if (type === 'phoneBg') {
    root.style.setProperty('--bg-phone', hexColor);
    const valEl = document.getElementById('valPhoneBg');
    if (valEl) valEl.textContent = hexColor.toUpperCase();
  } 
  else if (type === 'textMain') {
    root.style.setProperty('--text-main', hexColor);
    const valEl = document.getElementById('valTextMain');
    if (valEl) valEl.textContent = hexColor.toUpperCase();
  } 
  else if (type === 'accentBlue') {
    root.style.setProperty('--accent-blue', hexColor);
    const valEl = document.getElementById('valAccentBlue');
    if (valEl) valEl.textContent = hexColor.toUpperCase();
  }
}

function applyPresetTheme(presetName) {
  const presets = {
    gojek: { primary: '#00AA13', sheetBg: '#ffffff', phoneBg: '#ffffff', textMain: '#0f172a', accentBlue: '#0284c7' },
    grab: { primary: '#00b140', sheetBg: '#ffffff', phoneBg: '#ffffff', textMain: '#0f172a', accentBlue: '#0f766e' },
    shopee: { primary: '#ee4d2d', sheetBg: '#ffffff', phoneBg: '#fafafa', textMain: '#1c1917', accentBlue: '#f97316' },
    cyberpunk: { primary: '#8b5cf6', sheetBg: '#1e1b4b', phoneBg: '#0f172a', textMain: '#f8fafc', accentBlue: '#ec4899' },
    ocean: { primary: '#0284c7', sheetBg: '#f0f9ff', phoneBg: '#e0f2fe', textMain: '#0c4a6e', accentBlue: '#0369a1' }
  };

  const theme = presets[presetName];
  if (!theme) return;

  // Apply colors & sync inputs
  updateThemeColor('primary', theme.primary);
  updateThemeColor('sheetBg', theme.sheetBg);
  updateThemeColor('phoneBg', theme.phoneBg);
  updateThemeColor('textMain', theme.textMain);
  updateThemeColor('accentBlue', theme.accentBlue);

  document.getElementById('pickerPrimary').value = theme.primary;
  document.getElementById('pickerSheetBg').value = theme.sheetBg;
  document.getElementById('pickerPhoneBg').value = theme.phoneBg;
  document.getElementById('pickerTextMain').value = theme.textMain;
  document.getElementById('pickerAccentBlue').value = theme.accentBlue;
}

function resetThemeToDefault() {
  applyPresetTheme('gojek');
}

function adjustColorBrightness(hex, percent) {
  let num = parseInt(hex.replace('#',''), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

// Click UI element directly to trigger color picker
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-color-target]').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      const targetType = el.getAttribute('data-color-target');
      const pickerIdMap = {
        'primary': 'pickerPrimary',
        'sheetBg': 'pickerSheetBg',
        'phoneBg': 'pickerPhoneBg',
        'textMain': 'pickerTextMain',
        'accentBlue': 'pickerAccentBlue'
      };
      const pickerInput = document.getElementById(pickerIdMap[targetType]);
      if (pickerInput) {
        pickerInput.click();
        pickerInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
});
