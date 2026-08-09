/* ==========================================================================
   GO-NCENG INTERACTIVE LOGIC & STATE MANAGEMENT
   ========================================================================== */

// Application State Store
const state = {
  currentStep: 1,
  selectedService: 'goride', // goride, gocar, gosend, gofood
  selectedVehicle: 'goride_std',
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

  // Coordinates (Jakarta Manggarai to Grand Indonesia)
  pickupCoords: [-6.2099, 106.8502],
  destCoords: [-6.1953, 106.8202],
  
  // Map instances
  mapAlamat: null,
  mapRoute: null,
  mapTracking: null,
  
  // Animation markers & timers
  driverMarker: null,
  trackingTimer: null
};

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initMaps();
  updateCalculatedFare();
  
  // Theme toggle button logic
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-frame');
    });
  }
});

// Update status bar digital time
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

/* ================= LEAFLET MAPS INTEGRATION ================= */
function initMaps() {
  // 1. Map Step 1 (Address Overview)
  if (document.getElementById('mapAlamat')) {
    state.mapAlamat = L.map('mapAlamat', { zoomControl: false }).setView(state.pickupCoords, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(state.mapAlamat);

    // Custom Icon Markers
    const pickupIcon = L.divIcon({
      className: 'custom-map-pin pickup-pin',
      html: '<div style="background:#00AA13; width:16px; height:16px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 8px rgba(0,0,0,0.4);"></div>',
      iconSize: [16, 16]
    });

    const destIcon = L.divIcon({
      className: 'custom-map-pin dest-pin',
      html: '<div style="background:#ef4444; width:16px; height:16px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 8px rgba(0,0,0,0.4);"></div>',
      iconSize: [16, 16]
    });

    L.marker(state.pickupCoords, { icon: pickupIcon }).addTo(state.mapAlamat).bindPopup("Titik Jemput: Stasiun Manggarai");
    L.marker(state.destCoords, { icon: destIcon }).addTo(state.mapAlamat).bindPopup("Titik Tujuan: Grand Indonesia");
  }
}

function initRouteMap() {
  if (state.mapRoute) {
    state.mapRoute.remove();
  }
  
  const mapEl = document.getElementById('mapRoute');
  if (!mapEl) return;

  state.mapRoute = L.map('mapRoute', { zoomControl: false }).setView(state.pickupCoords, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapRoute);

  const routePolyline = L.polyline([state.pickupCoords, [-6.2020, 106.8350], state.destCoords], {
    color: '#00AA13',
    weight: 5,
    opacity: 0.8,
    dashArray: '8, 8'
  }).addTo(state.mapRoute);

  state.mapRoute.fitBounds(routePolyline.getBounds(), { padding: [30, 30] });
}

function initTrackingMap() {
  if (state.mapTracking) {
    state.mapTracking.remove();
  }
  
  const mapEl = document.getElementById('mapTracking');
  if (!mapEl) return;

  state.mapTracking = L.map('mapTracking', { zoomControl: false }).setView(state.pickupCoords, 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapTracking);

  // Driver Bike Marker Icon
  const bikeIcon = L.divIcon({
    className: 'driver-bike-marker',
    html: '<div style="background:#00AA13; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.3); font-size:16px;"><i class="fa-solid fa-motorcycle"></i></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  // Start driver slightly away to simulate approach
  const driverStart = [-6.2135, 106.8550];
  state.driverMarker = L.marker(driverStart, { icon: bikeIcon }).addTo(state.mapTracking);

  // Pickup marker
  L.circleMarker(state.pickupCoords, {
    radius: 8,
    fillColor: "#00AA13",
    color: "#ffffff",
    weight: 3,
    opacity: 1,
    fillOpacity: 0.9
  }).addTo(state.mapTracking);

  // Destination marker
  L.circleMarker(state.destCoords, {
    radius: 8,
    fillColor: "#ef4444",
    color: "#ffffff",
    weight: 3,
    opacity: 1,
    fillOpacity: 0.9
  }).addTo(state.mapTracking);

  // Route Polyline
  L.polyline([driverStart, state.pickupCoords, [-6.2020, 106.8350], state.destCoords], {
    color: '#00AA13',
    weight: 4,
    opacity: 0.7
  }).addTo(state.mapTracking);
}

/* ================= STEP NAVIGATION ================= */
function goToStep(stepNum) {
  state.currentStep = stepNum;

  // Hide all screens
  document.querySelectorAll('.screen-step').forEach(el => el.classList.remove('active'));

  // Show target step screen
  const targetStep = document.getElementById(`stepStep${stepNum}`) || document.querySelectorAll('.screen-step')[stepNum - 1];
  if (targetStep) {
    targetStep.classList.add('active');
  }

  // Header Back Button Logic
  const btnBack = document.getElementById('btnBack');
  const bottomNav = document.getElementById('bottomNav');
  
  if (btnBack) {
    btnBack.style.display = stepNum > 1 && stepNum < 5 ? 'flex' : 'none';
    btnBack.onclick = () => goToStep(stepNum - 1);
  }

  if (bottomNav) {
    bottomNav.style.display = stepNum === 1 ? 'flex' : 'none';
  }

  // Trigger Step Specific Initialization
  if (stepNum === 2) {
    setTimeout(initRouteMap, 100);
    updateCalculatedFare();
  } else if (stepNum === 3) {
    updateCalculatedFare();
  } else if (stepNum === 4) {
    setTimeout(initTrackingMap, 100);
    startDriverSimulation();
  }
}

/* ================= SERVICE & VEHICLE SELECTION ================= */
function selectService(serviceType) {
  state.selectedService = serviceType;
  document.querySelectorAll('.service-card').forEach(card => card.classList.remove('active'));
  const activeCard = document.querySelector(`.service-card[data-service="${serviceType}"]`);
  if (activeCard) activeCard.classList.add('active');

  if (serviceType === 'goride') selectVehicle(null, 'goride_std', 14000);
  else if (serviceType === 'gocar') selectVehicle(null, 'gocar_std', 32000);
  else if (serviceType === 'gosend') selectVehicle(null, 'goride_std', 16000);
  else if (serviceType === 'gofood') selectVehicle(null, 'goride_std', 12000);
}

function selectVehicle(element, vehId, fare) {
  state.selectedVehicle = vehId;
  state.baseFare = fare;

  if (element) {
    document.querySelectorAll('.vehicle-option-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
  }
  updateCalculatedFare();
}

function selectPaymentMethod(element, payId) {
  state.selectedPayment = payId;
  document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');
  
  // Toggle radio icon inside
  document.querySelectorAll('.payment-option .pay-radio i').forEach(i => {
    i.className = 'fa-regular fa-circle';
  });
  const radio = element.querySelector('.pay-radio i');
  if (radio) radio.className = 'fa-solid fa-circle-dot';
}

function updateCalculatedFare() {
  const finalFare = Math.max(0, state.baseFare + 2000 - state.discountAmount);
  
  // Update step 2 preview
  const s2Total = document.getElementById('step2TotalFare');
  if (s2Total) s2Total.textContent = `Rp ${finalFare.toLocaleString('id-ID')}`;

  // Update step 3 breakdown
  const summaryBaseFare = document.getElementById('summaryBaseFare');
  const summaryDiscountVal = document.getElementById('summaryDiscountVal');
  const summaryFinalTotal = document.getElementById('summaryFinalTotal');

  if (summaryBaseFare) summaryBaseFare.textContent = `Rp ${state.baseFare.toLocaleString('id-ID')}`;
  if (summaryDiscountVal) summaryDiscountVal.textContent = `-Rp ${state.discountAmount.toLocaleString('id-ID')}`;
  if (summaryFinalTotal) summaryFinalTotal.textContent = `Rp ${finalFare.toLocaleString('id-ID')}`;
}

/* ================= QUICK LOCATION HELPERS ================= */
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

function useCurrentLocation(type) {
  if (type === 'pickup') {
    document.getElementById('inputPickup').value = 'Lokasi Saya (Jl. Manggarai Utara No. 12)';
  } else {
    document.getElementById('inputDestination').value = 'Lokasi Saya (Jl. MH Thamrin No. 1)';
  }
}

/* ================= VOUCHER MODAL LOGIC ================= */
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

/* ================= SIMULATION DRIVER & TRIP PROGRESS ================= */
function processPaymentOrder() {
  // Read optional notes
  const notesEl = document.getElementById('driverNotes');
  if (notesEl) state.driverNotes = notesEl.value;

  goToStep(4);
}

function startDriverSimulation() {
  const searchBox = document.getElementById('viewSearchingDriver');
  const driverFoundBox = document.getElementById('viewDriverFound');
  const statusPillText = document.getElementById('liveStatusText');
  const searchFill = document.getElementById('searchProgressFill');

  if (searchBox) searchBox.style.display = 'flex';
  if (driverFoundBox) driverFoundBox.style.display = 'none';
  if (statusPillText) statusPillText.textContent = 'Mencari Driver Terdekat...';
  if (searchFill) searchFill.style.width = '20%';

  // Step A: Searching driver (2 seconds animation)
  setTimeout(() => {
    if (searchFill) searchFill.style.width = '70%';
  }, 1000);

  setTimeout(() => {
    if (searchFill) searchFill.style.width = '100%';
    
    // Step B: Driver Found!
    if (searchBox) searchBox.style.display = 'none';
    if (driverFoundBox) driverFoundBox.style.display = 'block';
    if (statusPillText) statusPillText.textContent = 'Driver Ditemukan - Menuju Penjemputan';

    animateDriverMovement();
  }, 2200);
}

function animateDriverMovement() {
  let progress = 0;
  const start = [-6.2135, 106.8550];
  const pickup = state.pickupCoords;
  const dest = state.destCoords;

  if (state.trackingTimer) clearInterval(state.trackingTimer);

  state.trackingTimer = setInterval(() => {
    progress += 0.05;

    let currentLat, currentLng;
    const t1 = document.getElementById('stepTimeline1');
    const t2 = document.getElementById('stepTimeline2');
    const t3 = document.getElementById('stepTimeline3');
    const statusPillText = document.getElementById('liveStatusText');

    if (progress <= 0.3) {
      // Driver moving to pickup
      const ratio = progress / 0.3;
      currentLat = start[0] + (pickup[0] - start[0]) * ratio;
      currentLng = start[1] + (pickup[1] - start[1]) * ratio;
      if (t1) t1.className = 'time-step completed';
      if (statusPillText) statusPillText.textContent = 'Driver Menuju Lokasi Penjemputan...';
    } else if (progress <= 0.5) {
      // Driver arrived at pickup
      currentLat = pickup[0];
      currentLng = pickup[1];
      if (t2) t2.className = 'time-step completed';
      if (statusPillText) statusPillText.textContent = 'Driver Sudah Sampai di Titik Jemput!';
    } else if (progress < 1.0) {
      // Driver trip to destination
      const ratio = (progress - 0.5) / 0.5;
      currentLat = pickup[0] + (dest[0] - pickup[0]) * ratio;
      currentLng = pickup[1] + (dest[1] - pickup[1]) * ratio;
      if (t3) t3.className = 'time-step completed';
      if (statusPillText) statusPillText.textContent = 'Perjalanan Menuju Grand Indonesia...';
    } else {
      // Trip completed!
      clearInterval(state.trackingTimer);
      state.trackingTimer = null;
      if (statusPillText) statusPillText.textContent = 'Tiba di Tujuan!';
      
      setTimeout(() => {
        goToStep(5);
      }, 1200);
      return;
    }

    if (state.driverMarker && state.mapTracking) {
      state.driverMarker.setLatLng([currentLat, currentLng]);
      state.mapTracking.panTo([currentLat, currentLng]);
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

/* ================= STEP 5: COMPLETED & RATING ================= */
function setRating(val) {
  state.rating = val;
  const stars = document.querySelectorAll('#starRating .star');
  stars.forEach((star, index) => {
    if (index < val) star.classList.add('active');
    else star.classList.remove('active');
  });
}

function submitRating() {
  const btn = document.querySelector('.btn-submit-rating');
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
  alert('Chat dengan Budi Santoso:\n"Saya sudah di depan gapura Stasiun Manggarai ya Mas!"');
}
