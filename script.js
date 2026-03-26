/* ============================================
   HEMANTH SAMAYAMANTRI — PORTFOLIO JS
   Theme toggle, scroll animations, 3 mini-apps
   ============================================ */

// ==========================================
// THEME TOGGLE
// ==========================================
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

// Load saved theme
const saved = localStorage.getItem('theme');
if (saved) setTheme(saved);
else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');

// ==========================================
// MOBILE MENU
// ==========================================
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');

mobileToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  mobileToggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
});

// ==========================================
// SCROLL REVEAL ANIMATIONS
// ==========================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 60);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ==========================================
// MINI-APP 1: ODOMETRY SIMULATOR
// ==========================================
(function initOdometry() {
  const canvas = document.getElementById('odoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Robot state
  let robot = { x: 0, y: 0, theta: 0 }; // inches, radians
  let trail = [];
  let totalDL = 0, totalDR = 0;
  const TRACK = 12; // inches between wheels
  const STEP = 1.5;  // inches per key press
  const keys = {};

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
  }
  resize();
  window.addEventListener('resize', resize);

  // Keyboard
  document.addEventListener('keydown', e => { keys[e.key] = true; });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  function update() {
    let dL = 0, dR = 0;

    // Forward / backward
    if (keys['w'] || keys['W'] || keys['ArrowUp']) { dL += STEP; dR += STEP; }
    if (keys['s'] || keys['S'] || keys['ArrowDown']) { dL -= STEP; dR -= STEP; }
    // Turn
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) { dL -= STEP * 0.6; dR += STEP * 0.6; }
    if (keys['d'] || keys['D'] || keys['ArrowRight']) { dL += STEP * 0.6; dR -= STEP * 0.6; }

    if (dL !== 0 || dR !== 0) {
      // Odometry math — exactly from FTC portfolio
      const deltaTheta = (dR - dL) / TRACK;
      const deltaS = (dL + dR) / 2;
      let deltaX, deltaY;

      if (Math.abs(deltaTheta) < 0.0001) {
        deltaX = deltaS * Math.cos(robot.theta);
        deltaY = deltaS * Math.sin(robot.theta);
      } else {
        deltaX = (Math.sin(deltaTheta) / deltaTheta) * deltaS * Math.cos(robot.theta)
               - ((1 - Math.cos(deltaTheta)) / deltaTheta) * deltaS * Math.sin(robot.theta);
        deltaY = (Math.sin(deltaTheta) / deltaTheta) * deltaS * Math.sin(robot.theta)
               + ((1 - Math.cos(deltaTheta)) / deltaTheta) * deltaS * Math.cos(robot.theta);
      }

      robot.x += deltaX;
      robot.y += deltaY;
      robot.theta += deltaTheta;
      totalDL += Math.abs(dL);
      totalDR += Math.abs(dR);
      trail.push({ x: robot.x, y: robot.y });
      if (trail.length > 500) trail.shift();

      // Update readouts
      document.getElementById('odo-x').textContent = robot.x.toFixed(2);
      document.getElementById('odo-y').textContent = robot.y.toFixed(2);
      document.getElementById('odo-theta').textContent = ((robot.theta * 180 / Math.PI) % 360).toFixed(1) + '°';
      document.getElementById('odo-dl').textContent = totalDL.toFixed(1);
      document.getElementById('odo-dr').textContent = totalDR.toFixed(1);
      document.getElementById('odo-dtheta').textContent = (deltaTheta).toFixed(4);
    }
  }

  function draw() {
    const w = canvas.width / 2;
    const h = canvas.height / 2;
    const scale = 3; // pixels per inch
    const cx = w / 2;
    const cy = h / 2;

    // Background
    ctx.fillStyle = '#060b18';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(100,116,139,0.15)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
    }
    for (let i = 0; i < h; i += 20) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }

    // Origin crosshair
    ctx.strokeStyle = 'rgba(37,99,235,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();

    // Trail
    if (trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(96,165,250,0.6)';
      ctx.lineWidth = 2;
      trail.forEach((p, i) => {
        const sx = cx + p.x * scale;
        const sy = cy - p.y * scale;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();
    }

    // Robot
    const rx = cx + robot.x * scale;
    const ry = cy - robot.y * scale;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(-robot.theta);

    // Body
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-10, -8, 20, 16);
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-10, -8, 20, 16);

    // Direction arrow
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(6, -4);
    ctx.lineTo(6, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Instructions
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.fillText('WASD or Arrow Keys to move', 10, h - 10);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();

// ==========================================
// MINI-APP 2: CHESS RATING PREDICTOR
// ==========================================
function predictRating() {
  const cpl = parseFloat(document.getElementById('chess-cpl').value) || 45;
  const inacc = parseFloat(document.getElementById('chess-inacc').value) || 3;
  const mistakes = parseFloat(document.getElementById('chess-mistakes').value) || 2;
  const blunders = parseFloat(document.getElementById('chess-blunders').value) || 1;

  // Simplified model based on research findings
  // Higher CPL -> lower rating, with weak inverse relationship
  // Weighted composite: CPL is primary, errors are secondary
  const errorScore = (inacc * 1) + (mistakes * 3) + (blunders * 8);
  const composite = cpl * 0.7 + errorScore * 0.3;

  // Mapping: composite 10 -> ~2800, composite 200 -> ~600
  // Using inverse relationship: rating = a - b * ln(composite)
  let rating = Math.round(2950 - 480 * Math.log(composite + 1));
  rating = Math.max(400, Math.min(3000, rating));

  // Add randomness range (MAE was 238)
  const low = Math.max(400, rating - 120);
  const high = Math.min(3000, rating + 120);

  // Tier classification
  let tier = '';
  if (rating >= 2200) tier = 'Master level — exceptional play with minimal errors.';
  else if (rating >= 1800) tier = 'Expert level — strong tactical and positional understanding.';
  else if (rating >= 1400) tier = 'Intermediate — solid fundamentals with room to grow.';
  else if (rating >= 1000) tier = 'Developing player — building pattern recognition.';
  else tier = 'Beginner — keep playing and analyzing your games!';

  // Display
  document.getElementById('chessResult').style.display = 'block';
  document.getElementById('chess-rating-value').textContent = `${low}–${high}`;
  document.getElementById('chess-bar').style.width = ((rating / 3000) * 100) + '%';
  document.getElementById('chess-tier').textContent = tier;
}

// ==========================================
// MINI-APP 3: GAMBLING IMPACT CALCULATOR
// ==========================================
let gambChartInstance = null;

const RISK_LABELS = ['', '1 — Conservative', '2 — Cautious', '3 — Moderate', '4 — Aggressive', '5 — High Risk'];

function updateRiskLabel() {
  const val = document.getElementById('gamb-risk').value;
  document.getElementById('gamb-risk-label').textContent = RISK_LABELS[val];
}

function calcGambling() {
  const salary = parseFloat(document.getElementById('gamb-salary').value) || 65000;
  const ageIdx = parseInt(document.getElementById('gamb-age').value);
  const regionIdx = parseInt(document.getElementById('gamb-region').value);
  const risk = parseInt(document.getElementById('gamb-risk').value);

  // Age group data: [avg income, food, housing, transport, healthcare, insurance]
  const ageData = [
    [48514, 7215, 16853, 9243, 1485, 4428],
    [102494, 9630, 26380, 12802, 3825, 10701],
    [128285, 12460, 30369, 15581, 5949, 13465],
    [141121, 12772, 30747, 17184, 6748, 14948],
    [75460, 8483, 22329, 11414, 7715, 4579]
  ];

  // Regional multipliers: [food, housing, transport, healthcare, insurance]
  const regions = [
    [1.05, 1.14, 0.94, 1.08, 1.02], // NE
    [0.95, 0.85, 0.98, 0.96, 1.01], // MW
    [0.97, 0.92, 1.03, 0.98, 0.99], // S
    [1.04, 1.19, 1.05, 1.00, 0.98]  // W
  ];

  // Elasticities
  const elasticities = [0.33, 0.16, 0.74, 0.70, 0.80];

  const age = ageData[ageIdx];
  const reg = regions[regionIdx];
  const avgIncome = age[0];

  // Calculate taxes (US simplified)
  const fica = salary * 0.0765;
  let taxableIncome = Math.max(0, salary - 14600);
  let fedTax = 0;
  const brackets = [[11600, 0.10], [35550, 0.12], [53375, 0.22], [50650, 0.24]];
  let remaining = taxableIncome;
  for (const [size, rate] of brackets) {
    const amt = Math.min(remaining, size);
    fedTax += amt * rate;
    remaining -= amt;
    if (remaining <= 0) break;
  }
  fedTax += remaining * 0.32;
  const stateTax = salary * 0.05;
  const totalTax = fica + fedTax + stateTax;

  // Essential spending with elasticities and regional adjustment
  let totalEssential = 0;
  for (let i = 0; i < 5; i++) {
    const baseline = age[i + 1];
    const incAdj = Math.pow(salary / avgIncome, elasticities[i]);
    const spending = baseline * incAdj * reg[i];
    totalEssential += spending;
  }

  const disposableIncome = salary - totalTax - totalEssential;

  // Gambling loss calculation
  const wagerMultipliers = [0, 1, 2, 4, 7, 12];
  const houseEdges = [0, 0.045, 0.055, 0.08, 0.12, 0.18];
  const beta = 0.10;
  const effectiveDI = Math.max(disposableIncome, 2000);
  const annualWager = effectiveDI * beta * wagerMultipliers[risk];
  const expectedLoss = annualWager * houseEdges[risk];

  // 30-year projection (simplified deterministic)
  const savingsRate = 0.20;
  const annualReturn = 0.07;
  const annualSave = Math.max(disposableIncome, 0) * savingsRate;

  let noGamb = [], gamb = [];
  let sNG = 0, sG = 0;
  for (let y = 0; y <= 30; y++) {
    noGamb.push(Math.round(sNG));
    gamb.push(Math.round(sG));
    sNG = sNG * (1 + annualReturn) + annualSave;
    sG = sG * (1 + annualReturn) + annualSave - expectedLoss;
  }

  // Display results
  const resultDiv = document.getElementById('gambResult');
  resultDiv.style.display = 'block';
  document.getElementById('gamb-di-text').innerHTML =
    `<strong>Disposable Income:</strong> $${Math.round(disposableIncome).toLocaleString()}/yr (after $${Math.round(totalTax).toLocaleString()} taxes + $${Math.round(totalEssential).toLocaleString()} essentials)`;
  document.getElementById('gamb-loss-text').innerHTML =
    `<strong>Expected Annual Loss:</strong> $${Math.round(expectedLoss).toLocaleString()} (${disposableIncome > 0 ? ((expectedLoss / disposableIncome * 100).toFixed(1) + '% of DI') : 'N/A'})`;
  document.getElementById('gamb-30yr-text').innerHTML =
    `<strong>30-Year Impact:</strong> Non-gambler saves $${noGamb[30].toLocaleString()} · Gambler saves $${gamb[30].toLocaleString()} · <span style="color:var(--accent);font-weight:700">Gap: $${(noGamb[30] - gamb[30]).toLocaleString()}</span>`;

  // Chart
  if (gambChartInstance) gambChartInstance.destroy();
  const chartCanvas = document.getElementById('gambChart');
  const isDark = html.getAttribute('data-theme') === 'dark';

  gambChartInstance = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: Array.from({ length: 31 }, (_, i) => i),
      datasets: [
        {
          label: 'No Gambling',
          data: noGamb,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2
        },
        {
          label: `Risk ${risk} Gambler`,
          data: gamb,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: isDark ? '#cbd5e1' : '#475569', font: { size: 11, family: 'DM Sans' } }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Years', color: isDark ? '#64748b' : '#94a3b8', font: { size: 10 } },
          ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { size: 10 } },
          grid: { color: isDark ? 'rgba(100,116,139,0.1)' : 'rgba(148,163,184,0.15)' }
        },
        y: {
          title: { display: true, text: 'Savings ($)', color: isDark ? '#64748b' : '#94a3b8', font: { size: 10 } },
          ticks: {
            color: isDark ? '#64748b' : '#94a3b8',
            font: { size: 10 },
            callback: v => '$' + (v / 1000).toFixed(0) + 'k'
          },
          grid: { color: isDark ? 'rgba(100,116,139,0.1)' : 'rgba(148,163,184,0.15)' }
        }
      }
    }
  });
}
