/* Detector de Emoções — script.js
   face-api.js REAL com modelos locais + fallback simulado */

// ── Configuração de emoções ───────────────────────────────────
const EMOCOES = [
  { nome:'Feliz',     emoji:'😄', cor:'#10b981', key:'happy'    },
  { nome:'Surpreso',  emoji:'😲', cor:'#f59e0b', key:'surprised'},
  { nome:'Neutro',    emoji:'😐', cor:'#6366f1', key:'neutral'  },
  { nome:'Triste',    emoji:'😢', cor:'#3b82f6', key:'sad'      },
  { nome:'Raiva',     emoji:'😠', cor:'#ef4444', key:'angry'    },
  { nome:'Medo',      emoji:'😨', cor:'#a855f7', key:'fearful'  },
  { nome:'Nojo',      emoji:'🤢', cor:'#84cc16', key:'disgusted'},
];

// ── Caminho dos modelos face-api.js ───────────────────────────
const MODELS_URL = '../midias-meme/face-api.js/weights';

// ── Estado ────────────────────────────────────────────────────
let cameraAtiva = false;
let intervalDeteccao = null;
let intervalTempo = null;
let stream = null;
let historicoEmocoes = [];
let contagemEmocoes = {};
EMOCOES.forEach(e => contagemEmocoes[e.key] = 0);
let totalDeteccoes = 0;
let segundosAtivos = 0;
let emocaoDominanteAtual = EMOCOES[2]; // neutro
let pesos = EMOCOES.map(() => Math.random() * 0.3 + 0.05);
let modoIA = false; // true quando face-api.js estiver carregado

const video   = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx     = overlay.getContext('2d');

// ── Carregar modelos face-api.js ──────────────────────────────
async function carregarModelos() {
  if (typeof faceapi === 'undefined') {
    console.warn('face-api.js não encontrado, usando modo simulado');
    return false;
  }
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
    ]);
    console.log('✅ face-api.js modelos carregados!');
    modoIA = true;

    // Atualizar badge de status
    const sub = document.querySelector('.header-sub');
    if (sub) sub.textContent = '🤖 face-api.js ativo — Detecção REAL';
    return true;
  } catch (err) {
    console.warn('face-api.js falhou ao carregar modelos:', err.message);
    return false;
  }
}

// ── Toggle câmera ─────────────────────────────────────────────
async function toggleCamera() {
  if (!cameraAtiva) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user', width:640, height:480 }, audio:false });
      video.srcObject = stream;
      await video.play();
      cameraAtiva = true;

      video.addEventListener('loadedmetadata', () => {
        overlay.width  = video.videoWidth;
        overlay.height = video.videoHeight;
      }, { once: true });

      document.getElementById('btn-camera').textContent = '🔴 Parar Câmera';
      document.getElementById('btn-camera').classList.add('parar');
      document.getElementById('btn-foto').disabled = false;
      document.getElementById('camera-placeholder').style.display = 'none';
      document.getElementById('scan-line').classList.add('ativa');

      iniciarDeteccao();
      iniciarCronometro();
    } catch (e) {
      alert('Não foi possível acessar a câmera.\nVerifique as permissões do navegador.');
    }
  } else {
    pararCamera();
  }
}

function pararCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  video.srcObject = null;
  cameraAtiva = false;
  clearInterval(intervalDeteccao);
  clearInterval(intervalTempo);
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  document.getElementById('btn-camera').textContent = '📷 Ativar Câmera';
  document.getElementById('btn-camera').classList.remove('parar');
  document.getElementById('btn-foto').disabled = true;
  document.getElementById('camera-placeholder').style.display = 'flex';
  document.getElementById('scan-line').classList.remove('ativa');
}

// ── Cronômetro ────────────────────────────────────────────────
function iniciarCronometro() {
  segundosAtivos = 0;
  clearInterval(intervalTempo);
  intervalTempo = setInterval(() => {
    segundosAtivos++;
    const m = Math.floor(segundosAtivos / 60);
    const s = segundosAtivos % 60;
    document.getElementById('stat-tempo').textContent = m > 0 ? `${m}m${s}s` : `${s}s`;
  }, 1000);
}

// ── Iniciar detecção (real ou simulada) ───────────────────────
function iniciarDeteccao() {
  clearInterval(intervalDeteccao);
  if (modoIA) {
    // Modo real: loop contínuo com face-api.js
    loopFaceAPI();
  } else {
    // Modo simulado
    intervalDeteccao = setInterval(detectarSimulado, 900);
  }
}

// ── Loop face-api.js REAL ─────────────────────────────────────
async function loopFaceAPI() {
  if (!cameraAtiva) return;

  try {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
      .withFaceExpressions();

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (detections && detections.length > 0) {
      const det = detections[0];
      const exprs = det.expressions;

      // Mapear expressões para nosso formato
      const norm = EMOCOES.map(e => exprs[e.key] || 0);
      atualizarUI(norm, det.detection.box);
      totalDeteccoes++;
      document.getElementById('stat-deteccoes').textContent = totalDeteccoes;
    } else {
      // Nenhum rosto detectado
      document.getElementById('emoji-grande').textContent = '👤';
      document.getElementById('emocao-nome').textContent = 'Nenhum rosto';
      document.getElementById('confianca-fill').style.width = '0%';
      document.getElementById('confianca-texto').textContent = 'Aproxime-se da câmera';
    }
  } catch (err) {
    console.error('face-api loop error:', err);
  }

  // Continuar o loop
  if (cameraAtiva) {
    setTimeout(loopFaceAPI, 300);
  }
}

// ── Simulação de detecção ─────────────────────────────────────
function detectarSimulado() {
  pesos = pesos.map(p => Math.max(0.01, Math.min(1, p + (Math.random() - 0.5) * 0.25)));
  if (Math.random() < 0.08) {
    const idx = Math.floor(Math.random() * EMOCOES.length);
    pesos[idx] = Math.random() * 0.5 + 0.5;
  }
  const norm = normalizar(pesos);
  atualizarUI(norm, null);
  desenharOverlaySimulado();
  totalDeteccoes++;
  document.getElementById('stat-deteccoes').textContent = totalDeteccoes;
}

function normalizar(arr) {
  const soma = arr.reduce((a, b) => a + b, 0);
  return soma === 0 ? arr.map(() => 1/arr.length) : arr.map(v => v / soma);
}

// ── Atualizar UI ──────────────────────────────────────────────
function atualizarUI(norm, box) {
  let maxIdx = 0;
  norm.forEach((v, i) => { if (v > norm[maxIdx]) maxIdx = i; });

  const dom = EMOCOES[maxIdx];
  const conf = Math.round(norm[maxIdx] * 100);
  emocaoDominanteAtual = dom;

  document.getElementById('emoji-grande').textContent = dom.emoji;
  document.getElementById('emocao-nome').textContent  = dom.nome;
  const fill = document.getElementById('confianca-fill');
  fill.style.width = conf + '%';
  fill.style.background = dom.cor;
  document.getElementById('confianca-texto').textContent = `Confiança: ${conf}%`;

  // Barras individuais
  const lista = document.getElementById('lista-emocoes');
  lista.innerHTML = '';
  EMOCOES.forEach((e, i) => {
    const pct = Math.round(norm[i] * 100);
    const item = document.createElement('div');
    item.className = 'emocao-item';
    item.innerHTML = `
      <span class="emocao-emoji">${e.emoji}</span>
      <span class="emocao-nome">${e.nome}</span>
      <div class="emocao-barra-bg">
        <div class="emocao-barra-fill" style="width:${pct}%;background:${e.cor}"></div>
      </div>
      <span class="emocao-pct">${pct}%</span>
    `;
    lista.appendChild(item);
  });

  // Histórico
  historicoEmocoes.unshift(dom.emoji);
  if (historicoEmocoes.length > 30) historicoEmocoes.pop();
  document.getElementById('historico-lista').innerHTML =
    historicoEmocoes.map(e => `<span class="hist-item">${e}</span>`).join('');
  document.getElementById('hist-count').textContent = historicoEmocoes.length;

  // Estatística dominante
  contagemEmocoes[dom.key] = (contagemEmocoes[dom.key] || 0) + 1;
  const maisFreq = Object.entries(contagemEmocoes).sort((a,b) => b[1]-a[1])[0][0];
  const emFreq = EMOCOES.find(e => e.key === maisFreq);
  document.getElementById('stat-dominante').textContent = emFreq ? emFreq.emoji : '—';

  // Desenhar box se tiver detecção real
  if (box) desenharBoxReal(box, dom);
}

// ── Desenhar box real (face-api.js) ───────────────────────────
function desenharBoxReal(box, dom) {
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  // Escalar box para o tamanho do overlay
  const scaleX = overlay.width / video.videoWidth;
  const scaleY = overlay.height / video.videoHeight;
  const x = box.x * scaleX;
  const y = box.y * scaleY;
  const w = box.width  * scaleX;
  const h = box.height * scaleY;

  ctx.strokeStyle = dom.cor;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = dom.cor;
  ctx.shadowBlur = 12;
  ctx.strokeRect(x, y, w, h);
  ctx.shadowBlur = 0;

  // Cantos decorativos
  const c = 16;
  ctx.strokeStyle = '#00f5d4';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#00f5d4';
  ctx.shadowBlur = 8;
  [[x,y,1,1],[x+w-c,y,-1,1],[x,y+h-c,1,-1],[x+w-c,y+h-c,-1,-1]].forEach(([px,py,dx,dy]) => {
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px+c*dx, py); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py+c*dy); ctx.stroke();
  });
  ctx.shadowBlur = 0;

  // Label
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = dom.cor;
  ctx.shadowColor = dom.cor;
  ctx.shadowBlur = 8;
  ctx.fillText(`${dom.emoji} ${dom.nome}`, x, y - 8);
  ctx.shadowBlur = 0;
}

// ── Desenhar overlay simulado ─────────────────────────────────
function desenharOverlaySimulado() {
  if (!video.videoWidth) return;
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  const w = overlay.width, h = overlay.height;
  const cx = w/2, cy = h/2.2;
  const fw = w*0.38, fh = h*0.52;

  ctx.strokeStyle = emocaoDominanteAtual.cor;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = emocaoDominanteAtual.cor;
  ctx.shadowBlur = 12;
  ctx.strokeRect(cx-fw/2, cy-fh/2, fw, fh);
  ctx.shadowBlur = 0;

  const c = 18;
  ctx.strokeStyle = '#00f5d4';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#00f5d4';
  ctx.shadowBlur = 8;
  [[cx-fw/2,cy-fh/2,1,1],[cx+fw/2-c,cy-fh/2,-1,1],[cx-fw/2,cy+fh/2-c,1,-1],[cx+fw/2-c,cy+fh/2-c,-1,-1]].forEach(([x,y,dx,dy]) => {
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+c*dx,y);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+c*dy);ctx.stroke();
  });

  const pts = [[cx-fw*.2,cy-fh*.12],[cx+fw*.2,cy-fh*.12],[cx,cy+fh*.02],[cx-fw*.15,cy+fh*.2],[cx+fw*.15,cy+fh*.2]];
  ctx.fillStyle='#00f5d4'; ctx.shadowColor='#00f5d4'; ctx.shadowBlur=6;
  pts.forEach(([px,py]) => { ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fill(); });
  ctx.shadowBlur=0;

  ctx.font='bold 13px sans-serif'; ctx.textAlign='left';
  ctx.fillStyle=emocaoDominanteAtual.cor; ctx.shadowColor=emocaoDominanteAtual.cor; ctx.shadowBlur=8;
  ctx.fillText(`${emocaoDominanteAtual.emoji} ${emocaoDominanteAtual.nome}`, cx-fw/2, cy-fh/2-8);
  ctx.shadowBlur=0;
}

// ── Tirar foto ────────────────────────────────────────────────
function tirarFoto() {
  if (!cameraAtiva) return;

  const snap = document.createElement('canvas');
  snap.width  = overlay.width  || 640;
  snap.height = overlay.height || 480;
  const sCtx = snap.getContext('2d');

  sCtx.translate(snap.width, 0);
  sCtx.scale(-1, 1);
  sCtx.drawImage(video, 0, 0, snap.width, snap.height);
  sCtx.setTransform(1,0,0,1,0,0);
  sCtx.drawImage(overlay, 0, 0);

  const galeria  = document.getElementById('galeria-fotos');
  const section  = document.getElementById('galeria-section');
  section.style.display = 'block';

  const item = document.createElement('div');
  item.className = 'foto-item';

  const img = document.createElement('img');
  img.src = snap.toDataURL('image/jpeg', 0.9);

  const badge = document.createElement('div');
  badge.className = 'foto-emocao-badge';
  badge.textContent = `${emocaoDominanteAtual.emoji} ${emocaoDominanteAtual.nome}`;

  const btnDl = document.createElement('button');
  btnDl.className = 'btn-dl-foto';
  btnDl.textContent = '⬇';
  btnDl.onclick = () => {
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `emoscan-${emocaoDominanteAtual.key}-${Date.now()}.jpg`;
    a.click();
  };

  item.appendChild(img);
  item.appendChild(badge);
  item.appendChild(btnDl);
  galeria.insertBefore(item, galeria.firstChild);
}

// ── Inicializar ───────────────────────────────────────────────
(async () => {
  const ok = await carregarModelos();
  if (!ok) {
    const sub = document.querySelector('.header-sub');
    if (sub) sub.textContent = '⚠️ Modo simulado — face-api.js não carregado';
  }
})();
