let GROQ_CONFIG = {
  key: '', // Enter your key in the UI for security
  model: 'llama-3.3-70b-versatile'
};

// --- DATA SIMULATION ---
const STADIUM_DATA = {
  food: [
    { id: 'gate1', name: 'Gate 1 Stall', wait: 15, crowd: 'High', color: '#ef4444' },
    { id: 'gate3', name: 'Gate 3 Stall', wait: 5, crowd: 'Low', color: '#10b981' },
    { id: 'gate5', name: 'Gate 5 Stall', wait: 10, crowd: 'Medium', color: '#f59e0b' }
  ],
  washrooms: [
    { id: 'wash2', name: 'Near Gate 2', crowd: 'High', color: '#ef4444' },
    { id: 'wash4', name: 'Near Gate 4', crowd: 'Low', color: '#10b981' }
  ],
  exits: [
    { id: 'exitA', name: 'Exit A', status: 'Congested', level: 'High', color: '#ef4444' },
    { id: 'exitB', name: 'Exit B', status: 'Moderate', level: 'Medium', color: '#f59e0b' },
    { id: 'exitC', name: 'Exit C', status: 'Clear', level: 'Low', color: '#10b981' }
  ]
};

// --- SIMULATION LOGIC ---

function fluctuateData() {
  // Randomly adjust food wait times by +/- 2 mins
  STADIUM_DATA.food.forEach(stall => {
    const change = Math.floor(Math.random() * 5) - 2;
    stall.wait = Math.max(1, stall.wait + change);
    stall.crowd = stall.wait > 12 ? 'High' : (stall.wait > 7 ? 'Medium' : 'Low');
    stall.color = stall.crowd === 'High' ? '#ef4444' : (stall.crowd === 'Medium' ? '#f59e0b' : '#10b981');
  });

  // Occasionally flip washroom status
  if (Math.random() > 0.8) {
    const temp = STADIUM_DATA.washrooms[0].crowd;
    STADIUM_DATA.washrooms[0].crowd = STADIUM_DATA.washrooms[1].crowd;
    STADIUM_DATA.washrooms[1].crowd = temp;
    STADIUM_DATA.washrooms.forEach(w => {
      w.color = w.crowd === 'High' ? '#ef4444' : '#10b981';
    });
  }
}

// --- CORE LOGIC ---

/**
 * Recommendations based on minimum wait/crowd.
 * Confidence calculation:
 * - High: Recommendation is significantly better than next best (>40% wait diff or Low vs High crowd)
 * - Medium: Better than next best (10-40% diff)
 * - Low: Marginal difference or tie
 */
function getRecommendation(intent) {
  let result = null;
  let confidence = 'Low';
  let reason = '';

  if (intent === 'food') {
    const sorted = [...STADIUM_DATA.food].sort((a, b) => a.wait - b.wait);
    result = sorted[0];
    const diff = sorted[1].wait - sorted[0].wait;
    const diffPercent = (diff / sorted[1].wait) * 100;
    
    if (diffPercent > 40) confidence = 'High';
    else if (diffPercent > 10) confidence = 'Medium';
    
    reason = `only ${result.wait} min wait and ${result.crowd.toLowerCase()} crowd 👍`;
  } 
  else if (intent === 'washroom') {
    result = STADIUM_DATA.washrooms.find(w => w.crowd === 'Low');
    // Simple logic: Low crowd vs High crowd = High confidence
    confidence = 'High';
    reason = `it has the lowest crowd density right now ✨`;
  }
  else if (intent === 'exit') {
    result = STADIUM_DATA.exits.find(e => e.level === 'Low');
    confidence = 'High';
    reason = `it is currently clear and fastest for departure 🚪`;
  }

  return { result, confidence, reason };
}

// --- GROQ API SERVICE ---

async function fetchGroqResponse(userQuery) {
  if (!GROQ_CONFIG.key) return null;

  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  // Update data slightly to simulate "live" changes
  fluctuateData();
  initMap(); // Refresh map visuals
  updateSidebarUI(); // Refresh sidebar text/bars

  const systemPrompt = `
    You are SmartArena, a highly intelligent and helpful stadium assistant.
    CONTOUR: You are in a live sporting event. People are in a hurry.
    
    STADIUM DATA (LIVE):
    ${JSON.stringify(STADIUM_DATA, null, 2)}
    
    YOUR MISSION:
    - Help users navigate based on the LIVE DATA provided.
    - Don't just give the same answer every time. Use natural, varied language.
    - If someone asks "how" vs "where" vs "I want", adjust your tone accordingly.
    - Always recommend the ONE BEST option (minimize wait/crowd).
    - Include a "Confidence Level" (High/Medium/Low).
    - Keep it short, but make it feel human and varied.
    
    Example: Instead of always "Gate 3 is best", try "If you're looking for a quick bite, Gate 3 is currently your fastest bet with only 5 mins wait! 👍"
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_CONFIG.key}`
      },
      body: JSON.stringify({
        model: GROQ_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.8, // Increased for more variety
        max_tokens: 500
      })
    });

    if (!response.ok) throw new Error('Groq API Error');
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Groq Error:', error);
    return null;
  }
}

// --- UI COMPONENTS ---

/**
 * Generate the Stadium SVG Map
 */
function initMap() {
  const container = document.getElementById('map-container');
  if (!container) return;

  const svg = `
    <svg viewBox="0 0 400 300" class="stadium-svg">
      <!-- Stadium Layout -->
      <ellipse cx="200" cy="150" rx="180" ry="120" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
      <ellipse cx="200" cy="150" rx="140" ry="80" fill="rgba(0,210,255,0.05)" stroke="rgba(0,210,255,0.2)" stroke-width="2" />
      <rect x="130" y="100" width="140" height="100" rx="5" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.3)" />
      
      <!-- Pins -->
      <!-- Food -->
      <circle cx="50" cy="150" r="6" fill="${STADIUM_DATA.food[0].color}" class="map-pin" title="Gate 1 Stall" />
      <circle cx="200" cy="30" r="6" fill="${STADIUM_DATA.food[1].color}" class="map-pin" title="Gate 3 Stall">
        <animate attributeName="r" values="6;9;6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="350" cy="150" r="6" fill="${STADIUM_DATA.food[2].color}" class="map-pin" title="Gate 5 Stall" />
      
      <!-- Washrooms -->
      <circle cx="100" cy="60" r="5" fill="${STADIUM_DATA.washrooms[0].color}" class="map-pin" title="Gate 2 Washroom" />
      <circle cx="300" cy="240" r="5" fill="${STADIUM_DATA.washrooms[1].color}" class="map-pin" title="Gate 4 Washroom" />
      
      <!-- Exits -->
      <path d="M20,100 L40,100" stroke="${STADIUM_DATA.exits[0].color}" stroke-width="4" />
      <path d="M200,280 L200,260" stroke="${STADIUM_DATA.exits[1].color}" stroke-width="4" />
      <path d="M380,100 L360,100" stroke="${STADIUM_DATA.exits[2].color}" stroke-width="4" />
    </svg>
    <div style="text-align: center; font-size: 10px; color: var(--text-muted); margin-top: 5px;">📍 Live Interactive Map Visualization</div>
  `;
  container.innerHTML = svg;
}

// --- MESSAGE HANDLING ---

const chatArea = document.getElementById('chatArea');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const quickActions = document.querySelectorAll('.quick-btn');

function addMessage(text, isBot = false, recommendation = null) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
  
  let recHtml = '';
  if (recommendation) {
    recHtml = `
      <div class="recommendation-card">
        <strong>Best Option: ${recommendation.result.name}</strong>
        <p style="font-size: 0.85rem; margin-top: 4px;">${recommendation.reason}</p>
        <div class="confidence-tag conf-${recommendation.confidence.toLowerCase()}">
          Confidence: ${recommendation.confidence}
        </div>
      </div>
    `;
  }

  msgDiv.innerHTML = `
    <div class="message-avatar ${isBot ? 'bot-avatar' : 'user-avatar'}">
      ${isBot ? '🤖' : '👤'}
    </div>
    <div class="message-body">
      <div class="message-bubble">
        ${text}
        ${recHtml}
      </div>
      <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  `;
  
  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function handleInput() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, false);
  userInput.value = '';
  userInput.style.height = 'auto';

  // Show "Thinking" status
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'message bot-message';
  typingIndicator.innerHTML = `
    <div class="message-avatar bot-avatar">🤖</div>
    <div class="message-body"><div class="message-bubble">...Thinking...</div></div>
  `;
  chatArea.appendChild(typingIndicator);
  chatArea.scrollTop = chatArea.scrollHeight;

  // Process Response
  setTimeout(async () => {
    chatArea.removeChild(typingIndicator);
    
    // Try Groq first
    const groqResponse = await fetchGroqResponse(text);
    if (groqResponse) {
      addMessage(groqResponse, true);
    } else {
      // Fallback to local logic
      processBotResponse(text.toLowerCase());
    }
  }, 300);
}

function processBotResponse(query) {
  let response = "I'm not sure about that. Try asking about food, washrooms, or exits! 🏟️";
  let rec = null;

  if (query.includes('food') || query.includes('eat') || query.includes('hungry')) {
    rec = getRecommendation('food');
    response = `${rec.result.name} is your best option — ${rec.reason}`;
  } 
  else if (query.includes('washroom') || query.includes('toilet') || query.includes('restroom')) {
    rec = getRecommendation('washroom');
    response = `The washroom ${rec.result.name} is the best choice right now.`;
  }
  else if (query.includes('exit') || query.includes('leave') || query.includes('out')) {
    rec = getRecommendation('exit');
    response = `I recommend using ${rec.result.name} for the fastest exit.`;
  }
  else if (query.includes('crowd') || query.includes('status')) {
    response = "The stadium is currently at 65% capacity. Gate 3 area is the least crowded! 📊";
  }
  else if (query.includes('gate 3')) {
    response = "To reach Gate 3: Head North from your current position, take a right at the Main Concourse. It's a 2-minute walk! 🗺️";
  }

  addMessage(response, true, rec);
}

// --- EVENT LISTENERS ---

sendBtn.addEventListener('click', handleInput);

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleInput();
  }
});

// Auto-expand textarea
userInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

quickActions.forEach(btn => {
  btn.addEventListener('click', () => {
    const query = btn.getAttribute('data-query');
    userInput.value = query;
    handleInput();
  });
});

document.getElementById('clearBtn').addEventListener('click', () => {
  chatArea.innerHTML = '';
  addMessage("Chat cleared. How can I help you now? 🏟️", true);
});

document.getElementById('emergencyBtn').addEventListener('click', () => {
  const rec = getRecommendation('exit');
  document.body.classList.add('emergency-active');
  addMessage("🚨 EMERGENCY PROCEDURE ACTIVATED. PLEASE CALM DOWN.", true);
  addMessage(`FASTEST EXIT: ${rec.result.name}. Follow the illuminated green signs.`, true, rec);
  
  // Reset emergency state after 10s
  setTimeout(() => {
    document.body.classList.remove('emergency-active');
  }, 10000);
});

// Sidebar Toggle
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const sidebarToggle = document.getElementById('sidebarToggle');

function toggleSidebar() {
  sidebar.classList.toggle('active');
}

menuBtn.addEventListener('click', toggleSidebar);
sidebarToggle.addEventListener('click', toggleSidebar);

// Settings Modal Logic
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModal = document.getElementById('closeModal');
const saveSettings = document.getElementById('saveSettings');
const groqKeyInput = document.getElementById('groqKey');
const groqModelSelect = document.getElementById('groqModel');

settingsBtn.addEventListener('click', () => {
  groqKeyInput.value = GROQ_CONFIG.key;
  groqModelSelect.value = GROQ_CONFIG.model;
  settingsModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
  settingsModal.classList.remove('active');
});

window.addEventListener('click', (e) => {
  if (e.target === settingsModal) settingsModal.classList.remove('active');
});

saveSettings.addEventListener('click', () => {
  GROQ_CONFIG.key = groqKeyInput.value.trim();
  GROQ_CONFIG.model = groqModelSelect.value;
  settingsModal.classList.remove('active');
  addMessage("AI settings updated! I'm now powered by Groq. 🚀", true);
});

// Initialize
window.addEventListener('load', () => {
  // Add map container to sidebar status panel
  const statusPanel = document.querySelector('.status-panel');
  const mapDiv = document.createElement('div');
  mapDiv.id = 'map-container';
  mapDiv.className = 'map-container';
  statusPanel.insertBefore(mapDiv, statusPanel.firstChild);
  
  initMap();
});

/**
 * Update the Sidebar status items to match fluctuating live data
 */
function updateSidebarUI() {
  STADIUM_DATA.food.forEach(stall => {
    const el = document.getElementById(`stall-${stall.id}`);
    if (el) {
      const badge = el.querySelector('.crowd-badge');
      badge.className = `crowd-badge ${stall.crowd.toLowerCase()}`;
      badge.textContent = stall.crowd + (stall.crowd === 'Low' ? ' ✓' : '');
      el.querySelector('.wait-time').textContent = `⏱ ${stall.wait} min`;
      
      const fill = el.querySelector('.crowd-fill');
      fill.style.width = Math.min(100, stall.wait * 6) + '%';
      fill.style.background = stall.color;
      
      // Toggle recommended class
      if (stall.crowd === 'Low') el.classList.add('recommended');
      else el.classList.remove('recommended');
    }
  });

  STADIUM_DATA.washrooms.forEach(wash => {
    const el = document.getElementById(`wash-${wash.id === 'wash2' ? 'gate2' : 'gate4'}`);
    if (el) {
      const badge = el.querySelector('.crowd-badge');
      badge.className = `crowd-badge ${wash.crowd.toLowerCase()}`;
      badge.textContent = wash.crowd + (wash.crowd === 'Low' ? ' ✓' : '');
      el.querySelector('.crowd-fill').style.background = wash.color;
      
      if (wash.crowd === 'Low') el.classList.add('recommended');
      else el.classList.remove('recommended');
    }
  });
}
