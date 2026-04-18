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
    - Reply in ${APP_LANGUAGE === 'hi' ? 'Hindi' : 'English'}.
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
let liveUpdateInterval = null;
let lastBestSnapshot = null;
let APP_LANGUAGE = 'en';
let VOICE_ENABLED = true;
let speechRecognition = null;
let isListening = false;
let speechRetryInProgress = false;
let micCooldownUntil = 0;
let lastSpeechError = '';
let lastSpeechErrorAt = 0;
let speechNetworkErrorCount = 0;
let voiceInputFallbackMode = false;
let mediaRecorder = null;
let recordedAudioChunks = [];
let isRecordingAudio = false;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMessageText(text) {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function localized(enText, hiText) {
  return APP_LANGUAGE === 'hi' ? hiText : enText;
}

function getBrowserVoice() {
  const synth = window.speechSynthesis;
  if (!synth) return null;
  const voices = synth.getVoices();
  if (!voices.length) return null;

  const preferredLang = APP_LANGUAGE === 'hi' ? 'hi' : 'en';
  return (
    voices.find(v => v.lang.toLowerCase().startsWith(preferredLang)) ||
    voices.find(v => v.lang.toLowerCase().startsWith('en')) ||
    voices[0]
  );
}

function speakMessage(text, isBot) {
  if (!VOICE_ENABLED || !isBot || !window.speechSynthesis) return;
  const cleanText = String(text || '').replace(/\s+/g, ' ').trim();
  if (!cleanText) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voice = getBrowserVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = APP_LANGUAGE === 'hi' ? 'hi-IN' : 'en-US';
  }
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function isSpeechRecognitionSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function addSpeechErrorMessage(enMsg, hiMsg) {
  const now = Date.now();
  const messageKey = `${enMsg}|${hiMsg}`;
  if (lastSpeechError === messageKey && now - lastSpeechErrorAt < 3000) {
    return;
  }
  lastSpeechError = messageKey;
  lastSpeechErrorAt = now;
  addMessage(localized(enMsg, hiMsg), true);
}

function refreshMicButtonState() {
  if (!micBtn) return;
  if (isRecordingAudio) {
    micBtn.textContent = '⏺️';
    micBtn.classList.add('mic-active');
    micBtn.title = 'Stop Recording';
    return;
  }
  if (isListening) {
    micBtn.textContent = '🛑';
    micBtn.classList.add('mic-active');
    micBtn.title = 'Stop Listening';
    return;
  }
  micBtn.classList.remove('mic-active');
  if (voiceInputFallbackMode) {
    micBtn.textContent = '🎙️';
    micBtn.title = 'Groq voice recording mode';
  } else {
    micBtn.textContent = '🎤';
    micBtn.title = 'Voice Input';
  }
}

function activateVoiceFallbackMode() {
  voiceInputFallbackMode = true;
  refreshMicButtonState();
  addSpeechErrorMessage(
    'Voice service is unstable. Mic switched to Groq recording fallback mode.',
    'Voice service unstable hai. Mic ko Groq recording fallback mode me switch kar diya gaya hai.'
  );
}

function isMediaRecorderSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

async function transcribeAudioWithGroq(audioBlob) {
  if (!GROQ_CONFIG.key) {
    addMessage(
      localized(
        'Please add your Groq API key in settings to use voice transcription fallback.',
        'Voice transcription fallback use karne ke liye settings me Groq API key add karein.'
      ),
      true
    );
    return;
  }

  addMessage(localized('Transcribing your voice...', 'Aapki voice transcribe ki ja rahi hai...'), true);
  const form = new FormData();
  form.append('file', audioBlob, 'voice-input.webm');
  form.append('model', 'whisper-large-v3');
  form.append('language', APP_LANGUAGE === 'hi' ? 'hi' : 'en');
  form.append('response_format', 'json');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_CONFIG.key}`
      },
      body: form
    });

    if (!response.ok) throw new Error('Transcription API error');
    const data = await response.json();
    const transcript = String(data?.text || '').trim();
    if (!transcript) {
      addMessage(localized('Could not detect speech. Please try again.', 'Speech detect nahi hui. Dobara try karein.'), true);
      return;
    }
    userInput.value = transcript;
    handleInput();
  } catch (error) {
    addMessage(
      localized(
        'Transcription failed. Please check key/network and try again.',
        'Transcription fail ho gaya. Key/network check karke dobara try karein.'
      ),
      true
    );
  }
}

async function startGroqRecording() {
  if (!isMediaRecorderSupported()) {
    addMessage(
      localized(
        'Recording fallback is not supported in this browser.',
        'Is browser me recording fallback supported nahi hai.'
      ),
      true
    );
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedAudioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedAudioChunks.push(event.data);
      }
    };
    mediaRecorder.onstop = async () => {
      const blobType = mediaRecorder?.mimeType || 'audio/webm';
      const audioBlob = new Blob(recordedAudioChunks, { type: blobType });
      stream.getTracks().forEach(track => track.stop());
      mediaRecorder = null;
      isRecordingAudio = false;
      refreshMicButtonState();
      if (audioBlob.size > 0) {
        await transcribeAudioWithGroq(audioBlob);
      }
    };
    mediaRecorder.start();
    isRecordingAudio = true;
    refreshMicButtonState();
    addMessage(localized('Recording started. Tap again to stop.', 'Recording start ho gayi. Stop karne ke liye dobara tap karein.'), true);
  } catch (error) {
    addMessage(
      localized(
        'Microphone access failed for recording fallback.',
        'Recording fallback ke liye microphone access fail ho gaya.'
      ),
      true
    );
  }
}

function stopGroqRecording() {
  if (mediaRecorder && isRecordingAudio) {
    mediaRecorder.stop();
  }
}

function initSpeechRecognition() {
  if (!isSpeechRecognitionSupported()) return null;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new Recognition();
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    refreshMicButtonState();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    addMessage(localized('Listening... Speak now.', 'Sun raha hoon... Ab boliye.'), true);
  };

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();
    if (!transcript) return;
    speechNetworkErrorCount = 0;
    userInput.value = transcript;
    handleInput();
  };

  recognition.onerror = (event) => {
    const errorType = event?.error || 'unknown';
    let enMsg = 'Voice input failed. Please try again.';
    let hiMsg = 'Voice input fail ho gaya. Dobara try karein.';

    if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
      enMsg = 'Microphone permission denied. Allow mic access in browser settings and try again.';
      hiMsg = 'Microphone permission deny hai. Browser settings me mic access allow karke dobara try karein.';
    } else if (errorType === 'audio-capture') {
      enMsg = 'No microphone detected. Check your mic device and retry.';
      hiMsg = 'Microphone detect nahi hua. Mic device check karke retry karein.';
    } else if (errorType === 'no-speech') {
      enMsg = 'No speech detected. Tap mic and speak clearly.';
      hiMsg = 'Koi speech detect nahi hui. Mic dabake clearly boliye.';
    } else if (errorType === 'network') {
      // Prevent endless error loops by applying a short cooldown.
      micCooldownUntil = Date.now() + 5000;
      speechRetryInProgress = true;
      speechNetworkErrorCount += 1;
      enMsg = 'Voice service network error detected. Switching to Groq recording mode now.';
      hiMsg = 'Voice service network error detect hua. Abhi Groq recording mode pe switch kar rahe hain.';
      activateVoiceFallbackMode();
      if (isListening) {
        recognition.stop();
      }
    } else if (errorType === 'aborted') {
      enMsg = 'Voice input stopped.';
      hiMsg = 'Voice input stop ho gaya.';
    }

    addSpeechErrorMessage(enMsg, hiMsg);
  };

  recognition.onend = () => {
    isListening = false;
    refreshMicButtonState();
  };

  return recognition;
}

function addMessage(text, isBot = false, recommendation = null) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
  
  let recHtml = '';
  if (recommendation) {
    const recommendationName = escapeHtml(recommendation.result?.name || 'Best Option');
    const recommendationReason = formatMessageText(recommendation.reason || '');
    const confidenceClass = escapeHtml((recommendation.confidence || 'Low').toLowerCase());
    const confidenceLabel = escapeHtml(recommendation.confidence || 'Low');

    recHtml = `
      <div class="recommendation-card">
        <strong>Best Option: ${recommendationName}</strong>
        <p style="font-size: 0.85rem; margin-top: 4px;">${recommendationReason}</p>
        <div class="confidence-tag conf-${confidenceClass}">
          Confidence: ${confidenceLabel}
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
        ${formatMessageText(text)}
        ${recHtml}
      </div>
      <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  `;
  
  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
  speakMessage(text, isBot);
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
    if (typingIndicator.parentNode === chatArea) {
      chatArea.removeChild(typingIndicator);
    }
    
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
  let response = localized(
    "I'm not sure about that. Try asking about food, washrooms, or exits! 🏟️",
    "Mujhe iske bare me pakka nahi hai. Food, washroom, ya exit ke bare me pucho! 🏟️"
  );
  let rec = null;

  if (query.includes('food') || query.includes('eat') || query.includes('hungry')) {
    rec = getRecommendation('food');
    response = localized(
      `${rec.result.name} is your best option — ${rec.reason}`,
      `${rec.result.name} aapke liye best option hai — ${rec.reason}`
    );
  } 
  else if (query.includes('washroom') || query.includes('toilet') || query.includes('restroom')) {
    rec = getRecommendation('washroom');
    response = localized(
      `The washroom ${rec.result.name} is the best choice right now.`,
      `${rec.result.name} wala washroom abhi sabse achha choice hai.`
    );
  }
  else if (query.includes('exit') || query.includes('leave') || query.includes('out')) {
    rec = getRecommendation('exit');
    response = localized(
      `I recommend using ${rec.result.name} for the fastest exit.`,
      `Sabse fast exit ke liye ${rec.result.name} use karein.`
    );
  }
  else if (query.includes('crowd') || query.includes('status')) {
    response = localized(
      "The stadium is currently at 65% capacity. Gate 3 area is the least crowded! 📊",
      "Stadium abhi lagbhag 65% capacity par hai. Gate 3 area sabse kam crowded hai! 📊"
    );
  }
  else if (query.includes('gate 3')) {
    response = localized(
      "To reach Gate 3: Head North from your current position, take a right at the Main Concourse. It's a 2-minute walk! 🗺️",
      "Gate 3 ke liye: apni current location se North side jaiye, Main Concourse par right lijiye. Lagbhag 2 minute ka walk hai! 🗺️"
    );
  }
  else if (
    query.includes('plan my visit') ||
    query.includes('smart plan') ||
    query.includes('full plan') ||
    query.includes('itinerary')
  ) {
    response = generateSmartVisitPlan();
  }
  else if (query.includes('live update') || query.includes('best now') || query.includes('current best')) {
    const snapshot = getCurrentBestSnapshot();
    response = localized(
      `Live snapshot: 🍔 ${snapshot.food.name} (${snapshot.food.wait} min), 🚻 ${snapshot.washroom.name}, 🚪 ${snapshot.exit.name}.`,
      `Live snapshot: 🍔 ${snapshot.food.name} (${snapshot.food.wait} min), 🚻 ${snapshot.washroom.name}, 🚪 ${snapshot.exit.name}.`
    );
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
  addMessage(localized("Chat cleared. How can I help you now? 🏟️", "Chat clear ho gaya. Ab main kaise help karun? 🏟️"), true);
});

document.getElementById('emergencyBtn').addEventListener('click', () => {
  const rec = getRecommendation('exit');
  document.body.classList.add('emergency-active');
  addMessage(localized("🚨 EMERGENCY PROCEDURE ACTIVATED. PLEASE CALM DOWN.", "🚨 EMERGENCY PROCEDURE ACTIVATE HUA. KRIPYA SHAANT RAHEN."), true);
  addMessage(
    localized(
      `FASTEST EXIT: ${rec.result.name}. Follow the illuminated green signs.`,
      `SABSE FAST EXIT: ${rec.result.name}. Green emergency signs follow karein.`
    ),
    true,
    rec
  );
  
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
const languageBtn = document.getElementById('languageBtn');
const voiceBtn = document.getElementById('voiceBtn');
const micBtn = document.getElementById('micBtn');
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
  addMessage(localized("AI settings updated! I'm now powered by Groq. 🚀", "AI settings update ho gayi! Ab main Groq se powered hoon. 🚀"), true);
});

languageBtn.addEventListener('click', () => {
  APP_LANGUAGE = APP_LANGUAGE === 'en' ? 'hi' : 'en';
  languageBtn.textContent = APP_LANGUAGE === 'en' ? 'EN' : 'HI';
  addMessage(localized('Language switched to English.', 'Language Hindi par switch ho gayi.'), true);
});

if (voiceBtn) {
  voiceBtn.addEventListener('click', () => {
    VOICE_ENABLED = !VOICE_ENABLED;
    voiceBtn.textContent = VOICE_ENABLED ? '🔊' : '🔇';
    if (!VOICE_ENABLED && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    addMessage(
      localized(
        VOICE_ENABLED ? 'Voice output is now ON.' : 'Voice output is now OFF.',
        VOICE_ENABLED ? 'Voice output ab ON hai.' : 'Voice output ab OFF hai.'
      ),
      true
    );
  });
}

// Initialize
window.addEventListener('load', () => {
  // Add map container only if it does not already exist in markup.
  const statusPanel = document.querySelector('.status-panel');
  if (statusPanel && !document.getElementById('map-container')) {
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map-container';
    mapDiv.className = 'map-container';
    statusPanel.insertBefore(mapDiv, statusPanel.firstChild);
  }
  
  initMap();
  updateSidebarUI();
  startLiveUpdates();

  if (micBtn && !isSpeechRecognitionSupported() && !isMediaRecorderSupported()) {
    micBtn.disabled = true;
    micBtn.title = 'Voice input not supported';
  }
  refreshMicButtonState();

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {};
  }
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

function getCurrentBestSnapshot() {
  const bestFood = [...STADIUM_DATA.food].sort((a, b) => a.wait - b.wait)[0];
  const bestWashroom = STADIUM_DATA.washrooms.find(w => w.crowd === 'Low') || STADIUM_DATA.washrooms[0];
  const bestExit = STADIUM_DATA.exits.find(e => e.level === 'Low') || STADIUM_DATA.exits[0];

  return {
    food: { id: bestFood.id, name: bestFood.name, wait: bestFood.wait },
    washroom: { id: bestWashroom.id, name: bestWashroom.name },
    exit: { id: bestExit.id, name: bestExit.name }
  };
}

function snapshotsEqual(a, b) {
  if (!a || !b) return false;
  return a.food.id === b.food.id && a.washroom.id === b.washroom.id && a.exit.id === b.exit.id;
}

function startLiveUpdates() {
  if (liveUpdateInterval) return;

  lastBestSnapshot = getCurrentBestSnapshot();
  liveUpdateInterval = setInterval(() => {
    fluctuateData();
    initMap();
    updateSidebarUI();

    const currentSnapshot = getCurrentBestSnapshot();
    if (!snapshotsEqual(lastBestSnapshot, currentSnapshot)) {
      addMessage(
        localized(
          `🔄 Live update: Best options changed — 🍔 ${currentSnapshot.food.name} (${currentSnapshot.food.wait} min), 🚻 ${currentSnapshot.washroom.name}, 🚪 ${currentSnapshot.exit.name}.`,
          `🔄 Live update: Best options change hue — 🍔 ${currentSnapshot.food.name} (${currentSnapshot.food.wait} min), 🚻 ${currentSnapshot.washroom.name}, 🚪 ${currentSnapshot.exit.name}.`
        ),
        true
      );
      lastBestSnapshot = currentSnapshot;
    }
  }, 15000);
}

function generateSmartVisitPlan() {
  const bestFood = getRecommendation('food').result;
  const bestWashroom = getRecommendation('washroom').result;
  const bestExit = getRecommendation('exit').result;

  const avgFoodWait = STADIUM_DATA.food.reduce((sum, stall) => sum + stall.wait, 0) / STADIUM_DATA.food.length;
  const savedMinutes = Math.max(0, Math.round(avgFoodWait - bestFood.wait));
  const crowdMessage = bestWashroom.crowd === 'Low' ? 'minimal queue' : `${bestWashroom.crowd.toLowerCase()} queue`;
  const exitStatus = bestExit.status.toLowerCase();

  const enPlan = [
    'Here is your SmartArena visit plan:',
    `1) 🍔 Grab food at ${bestFood.name} (${bestFood.wait} min wait).`,
    `2) 🚻 Use washroom at ${bestWashroom.name} (${crowdMessage}).`,
    `3) 🚪 Leave via ${bestExit.name} (${exitStatus} route).`,
    `Estimated benefit: about ${savedMinutes} min faster than average food queue + smoother movement.`
  ].join('\n');

  const hiPlan = [
    'Yeh raha aapka SmartArena visit plan:',
    `1) 🍔 ${bestFood.name} se food lein (${bestFood.wait} min wait).`,
    `2) 🚻 ${bestWashroom.name} washroom use karein (${crowdMessage}).`,
    `3) 🚪 ${bestExit.name} se bahar niklein (${exitStatus} route).`,
    `Estimated benefit: average food queue se lagbhag ${savedMinutes} min faster + smoother movement.`
  ].join('\n');

  return localized(enPlan, hiPlan);
}
