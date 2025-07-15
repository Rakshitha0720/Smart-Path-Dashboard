let map = L.map('map').setView([12.9716, 77.5946], 13); // Bengaluru
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

// Canvas setup
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
let pathPoints = [];
let isDrawing = false;

// Set canvas size
function resizeCanvas() {
  const container = document.getElementById('mapContainer');
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
}

// Convert lat/lng to canvas coordinates
function latLngToCanvasPoint(lat, lng) {
  const point = map.latLngToContainerPoint([lat, lng]);
  return { x: point.x, y: point.y };
}

// Draw path on canvas
function drawPath() {
  if (pathPoints.length < 2) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw path
  ctx.beginPath();
  ctx.strokeStyle = '#00bfff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#00bfff';
  ctx.shadowBlur = 10;

  for (let i = 0; i < pathPoints.length; i++) {
    const point = latLngToCanvasPoint(pathPoints[i].lat, pathPoints[i].lng);
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
  ctx.stroke();

  // Draw start point
  if (pathPoints.length > 0) {
    const startPoint = latLngToCanvasPoint(pathPoints[0].lat, pathPoints[0].lng);
    ctx.beginPath();
    ctx.fillStyle = '#17c671';
    ctx.shadowColor = '#17c671';
    ctx.shadowBlur = 15;
    ctx.arc(startPoint.x, startPoint.y, 8, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Draw current/end point
  if (pathPoints.length > 1) {
    const endPoint = latLngToCanvasPoint(pathPoints[pathPoints.length - 1].lat, pathPoints[pathPoints.length - 1].lng);
    ctx.beginPath();
    ctx.fillStyle = isDrawing ? '#ffc107' : '#dc3545';
    ctx.shadowColor = isDrawing ? '#ffc107' : '#dc3545';
    ctx.shadowBlur = 15;
    ctx.arc(endPoint.x, endPoint.y, 8, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// Add point to path
function addPathPoint(lat, lng) {
  pathPoints.push({ lat, lng });
  drawPath();
}

// Clear path
function clearPath() {
  pathPoints = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Map event handlers
map.on('zoom', drawPath);
map.on('move', drawPath);
map.on('resize', () => {
  resizeCanvas();
  drawPath();
});

// Initialize canvas
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let liveDist = 0, liveDur = 0, liveTimer = null, liveWatch = null;
let lastLivePos = null;
let routeControl = null;
let insightsChart = null;
let routeChart = null;

// Simulation variables
let simDist = 0, simDur = 0, simTimer = null, simInterval = null;
let simCurrentPos = null, simEndPos = null;
let simMarker = null;
let simPath = [];
let simTotalDistance = 0;
let simCurrentStep = 0;

// UI Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearPathBtn = document.getElementById('clearPathBtn');
const liveDistance = document.getElementById('liveDistance');
const liveDuration = document.getElementById('liveDuration');
const startInput = document.getElementById('startInput');
const endInput = document.getElementById('endInput');
const drawRouteBtn = document.getElementById('drawRouteBtn');
const showRouteStatsBtn = document.getElementById('showRouteStatsBtn');
const routeStatsModal = new bootstrap.Modal(document.getElementById('routeStatsModal'));

// Simulation UI Elements
const simStartInput = document.getElementById('simStartInput');
const simEndInput = document.getElementById('simEndInput');
const simulateBtn = document.getElementById('simulateBtn');
const stopSimBtn = document.getElementById('stopSimBtn');
const clearSimPathBtn = document.getElementById('clearSimPathBtn');
const simDistance = document.getElementById('simDistance');
const simDuration = document.getElementById('simDuration');
const simStatus = document.getElementById('simStatus');

// Insights elements
const stepsTaken = document.getElementById('stepsTaken');
const caloriesBurned = document.getElementById('caloriesBurned');
const distanceDisplay = document.getElementById('distanceDisplay');
const insightsChartCanvas = document.getElementById('insightsChart');
const routeChartCanvas = document.getElementById('routeChart');

// Modal elements
const modalDist = document.getElementById('routeDistance');
const modalSteps = document.getElementById('routeSteps');
const modalCalories = document.getElementById('routeCalories');

// Initialize insights chart
function initInsightsChart() {
  if (insightsChart) insightsChart.destroy();

  insightsChart = new Chart(insightsChartCanvas, {
    type: 'doughnut',
    data: {
      labels: ['Steps', 'Calories', 'Distance (m)'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#17c671', '#dc3545', '#00bfff'],
        borderWidth: 0,
        cutout: '60%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#fff',
            font: { size: 12 },
            padding: 15
          }
        }
      },
      animation: {
        animateScale: true,
        animateRotate: true
      }
    }
  });
}

// Update insights
function updateInsights(distance, steps, calories) {
  stepsTaken.textContent = steps;
  caloriesBurned.textContent = calories;
  distanceDisplay.textContent = distance.toFixed(1) + ' m';

  if (insightsChart) {
    insightsChart.data.datasets[0].data = [steps, calories, distance];
    insightsChart.update('active');
  }
}

// Create path between two points for simulation
function createSimulationPath(start, end, steps = 50) {
  const path = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = start[0] + (end[0] - start[0]) * ratio;
    const lng = start[1] + (end[1] - start[1]) * ratio;

    // Add some randomness to make it more realistic
    const randomOffset = 0.0001;
    const randomLat = lat + (Math.random() - 0.5) * randomOffset;
    const randomLng = lng + (Math.random() - 0.5) * randomOffset;

    path.push([randomLat, randomLng]);
  }
  return path;
}

// Simulation functionality
simulateBtn.onclick = async () => {
  try {
    const startPos = await geocode(simStartInput.value);
    const endPos = await geocode(simEndInput.value);

    // Reset simulation variables
    simDist = 0;
    simDur = 0;
    simCurrentStep = 0;
    simDistance.textContent = 0;
    simDuration.textContent = 0;
    isDrawing = true;
    clearPath();

    // Create simulation path
    simPath = createSimulationPath([startPos.lat, startPos.lng], [endPos.lat, endPos.lng], 100);
    simTotalDistance = calcDist([startPos.lat, startPos.lng], [endPos.lat, endPos.lng]);

    // Set up marker
    if (simMarker) map.removeLayer(simMarker);
    simMarker = L.marker(simPath[0]).addTo(map);

    // Add first point to path
    addPathPoint(simPath[0][0], simPath[0][1]);

    // Center map on start position
    map.setView(simPath[0], 16);

    // Update UI
    simulateBtn.disabled = true;
    stopSimBtn.disabled = false;
    simStatus.style.display = 'block';

    // Start simulation timer
    simTimer = setInterval(() => {
      simDur++;
      simDuration.textContent = simDur;
    }, 1000);

    // Start position updates (every 2 seconds for realistic walking speed)
    simInterval = setInterval(() => {
      if (simCurrentStep < simPath.length - 1) {
        simCurrentStep++;
        const currentPos = simPath[simCurrentStep];
        const previousPos = simPath[simCurrentStep - 1];

        // Calculate distance for this step
        const stepDistance = calcDist(previousPos, currentPos);
        simDist += stepDistance;
        simDistance.textContent = simDist.toFixed(1);

        // Add point to path
        addPathPoint(currentPos[0], currentPos[1]);

        // Update marker position
        simMarker.setLatLng(currentPos);
        map.setView(currentPos, 16);

        // Update insights
        const steps = Math.round(simDist / 0.8);
        const calories = Math.round(steps * 0.05);
        updateInsights(simDist, steps, calories);
      } else {
        // Simulation complete
        stopSimulation();
      }
    }, 2000); // Update every 2 seconds for realistic walking pace

  } catch (e) {
    alert('Could not find locations for simulation.');
  }
};

function stopSimulation() {
  clearInterval(simTimer);
  clearInterval(simInterval);
  simulateBtn.disabled = false;
  stopSimBtn.disabled = true;
  simStatus.style.display = 'none';
  isDrawing = false;
  drawPath(); // Redraw to show end point
}

stopSimBtn.onclick = stopSimulation;

// Clear path buttons
clearPathBtn.onclick = () => {
  clearPath();
  liveDist = 0;
  liveDur = 0;
  liveDistance.textContent = 0;
  liveDuration.textContent = 0;
  updateInsights(0, 0, 0);
};

clearSimPathBtn.onclick = () => {
  clearPath();
  simDist = 0;
  simDur = 0;
  simDistance.textContent = 0;
  simDuration.textContent = 0;
  updateInsights(0, 0, 0);
};

// Live Tracking
startBtn.onclick = () => {
  if (liveWatch) navigator.geolocation.clearWatch(liveWatch);
  liveDist = 0; liveDur = 0;
  liveDistance.textContent = 0;
  liveDuration.textContent = 0;
  lastLivePos = null;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  isDrawing = true;
  clearPath();

  liveTimer = setInterval(() => {
    liveDur++;
    liveDuration.textContent = liveDur;

    // Update insights during live tracking
    const steps = Math.round(liveDist / 0.8);
    const calories = Math.round(steps * 0.05);
    updateInsights(liveDist, steps, calories);
  }, 1000);

  liveWatch = navigator.geolocation.watchPosition(p => {
    const cur = [p.coords.latitude, p.coords.longitude];
    if (lastLivePos) {
      liveDist += calcDist(lastLivePos, cur);
      addPathPoint(cur[0], cur[1]);
    } else {
      // First position - add as start point
      addPathPoint(cur[0], cur[1]);
    }
    liveDistance.textContent = liveDist.toFixed(1);
    map.setView(cur, 16);
    lastLivePos = cur;
  }, e => alert(e.message), { enableHighAccuracy: true });
};

stopBtn.onclick = () => {
  navigator.geolocation.clearWatch(liveWatch);
  clearInterval(liveTimer);
  startBtn.disabled = false;
  stopBtn.disabled = true;
  isDrawing = false;
  drawPath(); // Redraw to show end point
};

// Draw Route
drawRouteBtn.onclick = async () => {
  if (routeControl) map.removeControl(routeControl);
  try {
    const pts = await Promise.all([
      geocode(startInput.value),
      geocode(endInput.value)
    ]);
    routeControl = L.Routing.control({ waypoints: pts, addWaypoints: false }).addTo(map);

    // Update insights when route is drawn
    routeControl.on('routesfound', function (e) {
      const route = e.routes[0];
      const distance = route.summary.totalDistance;
      const steps = Math.round(distance / 0.8);
      const calories = Math.round(steps * 0.05);
      updateInsights(distance, steps, calories);
    });
  } catch (e) {
    alert('Could not find locations.');
  }
};

// Show Stats
showRouteStatsBtn.onclick = () => {
  if (!routeControl) return alert('Please draw route first.');
  const wp = routeControl.getWaypoints();
  const dist = calcDist([wp[0].lat, wp[0].lng], [wp[1].lat, wp[1].lng]);
  const steps = Math.round(dist / 0.8);
  const calories = Math.round(steps * 0.05);
  modalDist.textContent = dist.toFixed(1);
  modalSteps.textContent = steps;
  modalCalories.textContent = calories;
  showChart(dist, steps, calories);
  routeStatsModal.show();
};

// Chart Display
function showChart(dist, steps, calories) {
  if (routeChart) routeChart.destroy();
  routeChart = new Chart(routeChartCanvas, {
    type: 'bar',
    data: {
      labels: ['Distance (m)', 'Steps', 'Calories'],
      datasets: [{
        label: 'Route Stats',
        data: [dist.toFixed(1), steps, calories],
        backgroundColor: ['#00bfff', '#17c671', '#ffc107'],
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#fff' },
          grid: { color: '#333' }
        },
        x: {
          ticks: { color: '#fff' },
          grid: { display: false }
        }
      }
    }
  });
}

// Utility
function toRad(x) { return x * Math.PI / 180; }
function calcDist(a, b) {
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) *
    Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function geocode(q) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
  const j = await res.json();
  if (!j.length) throw 'Location not found';
  return L.latLng(j[0].lat, j[0].lon);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function () {
  initInsightsChart();
  AOS.init({
    duration: 1000,
    easing: 'ease-in-out',
    once: true
  });
});

class NetworkManager {
  constructor() {
    this.statusElement = document.getElementById('networkStatus');
    this.init();
  }

  init() {
    this.updateNetworkStatus();

    // Listen for online/offline events
    window.addEventListener('online', () => this.updateNetworkStatus());
    window.addEventListener('offline', () => this.updateNetworkStatus());

    // Network Information API (if supported)
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => this.updateNetworkInfo());
      this.updateNetworkInfo();
    }
  }

  updateNetworkStatus() {
    const isOnline = navigator.onLine;
    this.statusElement.className = `network-status ${isOnline ? 'online' : 'offline'}`;
    this.statusElement.innerHTML = `${isOnline ? '🌐' : '📶'} ${isOnline ? 'Online' : 'Offline'}`;
  }

  updateNetworkInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType || 'unknown';
      this.statusElement.innerHTML = `📡 ${effectiveType.toUpperCase()}`;
    }
  }
}

// Performance Monitoring with Background Tasks API
class PerformanceManager {
  constructor() {
    this.performanceElement = document.getElementById('performanceIndicator');
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.init();
  }

  init() {
    this.monitorPerformance();
    this.scheduleBackgroundTasks();
  }

  monitorPerformance() {
    const now = performance.now();
    this.frameCount++;

    if (now - this.lastTime >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.updatePerformanceIndicator(fps);
      this.frameCount = 0;
      this.lastTime = now;
    }

    requestAnimationFrame(() => this.monitorPerformance());
  }

  updatePerformanceIndicator(fps) {
    let status, icon;

    if (fps >= 50) {
      status = 'good';
      icon = '⚡';
    } else if (fps >= 30) {
      status = 'moderate';
      icon = '⚠️';
    } else {
      status = 'poor';
      icon = '🐌';
    }

    this.performanceElement.className = `performance-indicator ${status}`;
    this.performanceElement.innerHTML = `${icon} ${fps} FPS`;
  }

  scheduleBackgroundTasks() {
    if ('requestIdleCallback' in window) {
      const performBackgroundTask = (deadline) => {
        while (deadline.timeRemaining() > 0) {
          // Perform low-priority tasks during idle time
          this.optimizeCanvasPerformance();
          this.cleanupOldData();
          break;
        }
        requestIdleCallback(performBackgroundTask);
      };

      requestIdleCallback(performBackgroundTask);
    }
  }

  optimizeCanvasPerformance() {
    // Optimize canvas rendering when idle
    const canvas = document.getElementById('mapCanvas');
    if (canvas && pathPoints.length > 100) {
      // Reduce path points for better performance
      pathPoints = pathPoints.filter((_, index) => index % 2 === 0);
    }
  }

  cleanupOldData() {
    // Clean up old tracking data
    if (pathPoints.length > 1000) {
      pathPoints = pathPoints.slice(-500);
    }
  }
}

// Intersection Observer for Lazy Loading
class LazyLoader {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadElement(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });

      // Observe all lazy-loading elements
      document.querySelectorAll('.lazy-loading').forEach(el => {
        this.observer.observe(el);
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      document.querySelectorAll('.lazy-loading').forEach(el => {
        this.loadElement(el);
      });
    }
  }

  loadElement(element) {
    // Add loading animation
    element.style.opacity = '0.5';
    element.classList.add('loading-skeleton');

    // Simulate loading delay
    setTimeout(() => {
      element.classList.remove('loading-skeleton');
      element.classList.add('loaded');
      element.style.opacity = '1';
    }, 300);
  }
}
