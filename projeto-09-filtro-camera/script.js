/* Filtro Câmera — script.js */

const MODELS_URL = '../midias-meme/face-api.js/weights';
let modoFaceAPI = false;
let landmarks = null; // pontos do rosto detectados

// Inicializar face-api.js
(async () => {
  if (typeof faceapi === 'undefined') return;
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL),
    ]);
    modoFaceAPI = true;
    console.log('✅ face-api.js carregado — stickers no rosto real!');
    const sub = document.querySelector('.header-sub');
    if (sub) sub.textContent = '🤖 Stickers inteligentes · Filtros ao vivo · Capturas';
  } catch (e) {
    console.warn('face-api.js não disponível, stickers em posição fixa');
  }
})();

const video  = document.getElementById('video');
const canvas = document.getElementById('canvas-filtro');
const ctx    = canvas.getContext('2d');

let stream = null, cameraAtiva = false, animId = null;
let filtroAtual = 'normal';
let stickersAtivos = new Set();
let ajustes = { brilho:100, contraste:100, saturacao:100 };
let totalFotos = 0;

// ── Toggle câmera ─────────────────────────────────────────────
async function toggleCamera() {
  if (!cameraAtiva) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video:{ width:1280, height:720 }, audio:false });
      video.srcObject = stream;
      await video.play();
      cameraAtiva = true;

      video.addEventListener('loadedmetadata', () => {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        iniciarLoop();
        if (modoFaceAPI) detectarLandmarks();
      }, { once:true });

      document.getElementById('btn-camera').textContent = '🔴 Parar Câmera';
      document.getElementById('btn-camera').classList.add('parar');
      document.getElementById('btn-foto').disabled = false;
      document.getElementById('cam-placeholder').style.display = 'none';
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
  cancelAnimationFrame(animId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  document.getElementById('btn-camera').textContent = '📷 Ativar Câmera';
  document.getElementById('btn-camera').classList.remove('parar');
  document.getElementById('btn-foto').disabled = true;
  document.getElementById('cam-placeholder').style.display = 'flex';
}

// ── Loop de renderização ──────────────────────────────────────
function iniciarLoop() {
  function loop() {
    if (!cameraAtiva) return;
    renderizar();
    animId = requestAnimationFrame(loop);
  }
  loop();
}

function renderizar() {
  if (video.readyState < 2) return;

  const w = canvas.width, h = canvas.height;
  ctx.save();

  // Espelhar horizontalmente
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();

  // Aplicar filtro
  aplicarFiltro();
}

// ── Filtros CSS via canvas filter ─────────────────────────────
function aplicarFiltro() {
  const b = ajustes.brilho / 100;
  const c = ajustes.contraste / 100;
  const s = ajustes.saturacao / 100;
  const base = `brightness(${b}) contrast(${c}) saturate(${s})`;

  switch (filtroAtual) {
    case 'pb':        ctx.filter = base + ' grayscale(1)'; break;
    case 'sepia':     ctx.filter = base + ' sepia(0.85)'; break;
    case 'invertido': ctx.filter = base + ' invert(1)'; break;
    case 'brilho':    ctx.filter = `brightness(${b*1.9}) contrast(${c}) saturate(${s*1.2})`; break;
    case 'escuro':    ctx.filter = `brightness(${b*0.35}) contrast(${c*1.4}) saturate(${s})`; break;
    case 'vermelho':  ctx.filter = base + ' sepia(1) saturate(6) hue-rotate(330deg)'; break;
    case 'verde':     ctx.filter = base + ' sepia(1) saturate(5) hue-rotate(90deg)'; break;
    case 'azul':      ctx.filter = base + ' sepia(1) saturate(6) hue-rotate(200deg)'; break;
    case 'roxo':      ctx.filter = base + ' sepia(1) saturate(5) hue-rotate(260deg)'; break;
    case 'espelho':   ctx.filter = base; break;
    case 'pixelado':  ctx.filter = base; break;
    default:          ctx.filter = base;
  }

  // Re-desenhar com filtro aplicado (apenas para filtros que precisam)
  if (['pb','sepia','invertido','brilho','escuro','vermelho','verde','azul','roxo'].includes(filtroAtual)) {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  ctx.filter = 'none';

  // Efeitos especiais por pixel
  if (filtroAtual === 'pixelado') aplicarPixelado();
  if (filtroAtual === 'espelho')  aplicarEspelho();

  // Stickers
  aplicarStickers();
}

function aplicarPixelado() {
  const size = 14;
  const w = canvas.width, h = canvas.height;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const tmp = document.createElement('canvas');
  tmp.width = Math.ceil(w / size);
  tmp.height = Math.ceil(h / size);
  const tCtx = tmp.getContext('2d');
  tCtx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
  ctx.drawImage(tmp, 0, 0, w, h);
  ctx.restore();
}

function aplicarEspelho() {
  const w = canvas.width, h = canvas.height;
  const half = canvas.toDataURL();
  const img = new Image();
  img.onload = () => {
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w/2, h, 0, 0, w/2, h);
    ctx.restore();
  };
  img.src = half;
}

// ── Loop com face-api.js para detectar landmarks ──────────────
async function detectarLandmarks() {
  if (!modoFaceAPI || !cameraAtiva || typeof faceapi === 'undefined') return;
  try {
    const det = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize:320 }))
      .withFaceLandmarks(true);
    landmarks = det ? det.landmarks : null;
  } catch(e) {}
  if (cameraAtiva) setTimeout(detectarLandmarks, 200);
}

// ── Stickers ──────────────────────────────────────────────────
function aplicarStickers() {
  if (stickersAtivos.size === 0) return;

  const w = canvas.width, h = canvas.height;
  const tamanho = Math.min(w, h) * 0.18;
  ctx.font = `${tamanho}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (modoFaceAPI && landmarks) {
    // Posicionamento baseado em landmarks reais (espelhado)
    const pts = landmarks.positions;
    // face-api retorna coordenadas na imagem original (não espelhada)
    // como aplicamos mirror no canvas, precisamos espelhar o X
    const mirrorX = x => w - x;

    // Olhos: pontos 36-41 (olho esq) e 42-47 (olho dir)
    const olhoEsqX = pts.slice(36,42).reduce((s,p)=>s+p.x,0)/6;
    const olhoEsqY = pts.slice(36,42).reduce((s,p)=>s+p.y,0)/6;
    const olhoDirX = pts.slice(42,48).reduce((s,p)=>s+p.x,0)/6;
    const olhoDirY = pts.slice(42,48).reduce((s,p)=>s+p.y,0)/6;
    const olhoCX = (mirrorX(olhoEsqX) + mirrorX(olhoDirX)) / 2;
    const olhoCY = (olhoEsqY + olhoDirY) / 2;

    // Nariz: ponto 30
    const nX = mirrorX(pts[30].x), nY = pts[30].y;

    // Topo da cabeça: ponto mais alto da jaw (17) ou estimado
    const topY = pts[27].y - (pts[8].y - pts[27].y) * 0.5;
    const topX = mirrorX(pts[27].x);

    // Boca: pontos 48-67, centro
    const bocaX = mirrorX(pts.slice(48,68).reduce((s,p)=>s+p.x,0)/20);
    const bocaY = pts.slice(48,68).reduce((s,p)=>s+p.y,0)/20;

    const emojis = {
      oculos:'🕶️', chapeu:'🎩', coroa:'👑',
      arcoiris:'🌈', fogo:'🔥', estrelas:'⭐'
    };
    const posReal = {
      oculos:   [olhoCX, olhoCY],
      chapeu:   [topX,   topY - tamanho*0.3],
      coroa:    [topX,   topY - tamanho*0.5],
      arcoiris: [topX + w*0.15, topY - tamanho*0.1],
      fogo:     [bocaX, bocaY + tamanho*0.1],
      estrelas: [olhoDirX > olhoEsqX ? mirrorX(olhoEsqX)-tamanho : mirrorX(olhoDirX)-tamanho, olhoCY-tamanho*0.3],
    };

    stickersAtivos.forEach(s => {
      if (posReal[s]) ctx.fillText(emojis[s], posReal[s][0], posReal[s][1]);
    });
  } else {
    // Fallback: posições fixas proporcional
    const cx = w/2, emojis = { oculos:'🕶️', chapeu:'🎩', coroa:'👑', arcoiris:'🌈', fogo:'🔥', estrelas:'⭐' };
    const posicoes = {
      oculos:   [cx,       h*0.38],
      chapeu:   [cx,       h*0.15],
      coroa:    [cx,       h*0.10],
      arcoiris: [cx+w*0.25,h*0.25],
      fogo:     [cx-w*0.25,h*0.25],
      estrelas: [cx+w*0.3, h*0.18],
    };
    stickersAtivos.forEach(s => {
      if (posicoes[s]) ctx.fillText(emojis[s], posicoes[s][0], posicoes[s][1]);
    });
  }
}

// ── Seleção de filtro ─────────────────────────────────────────
function aplicarFiltro(filtro, el) {
  filtroAtual = filtro;
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

// ── Toggle sticker ────────────────────────────────────────────
function toggleSticker(nome, btn) {
  if (stickersAtivos.has(nome)) {
    stickersAtivos.delete(nome);
    btn.classList.remove('ativo');
  } else {
    stickersAtivos.add(nome);
    btn.classList.add('ativo');
  }
}

// ── Ajustes de slider ─────────────────────────────────────────
function ajustar() {
  ajustes.brilho    = document.getElementById('slider-brilho').value;
  ajustes.contraste = document.getElementById('slider-contraste').value;
  ajustes.saturacao = document.getElementById('slider-saturacao').value;
  document.getElementById('val-brilho').textContent    = ajustes.brilho + '%';
  document.getElementById('val-contraste').textContent = ajustes.contraste + '%';
  document.getElementById('val-saturacao').textContent = ajustes.saturacao + '%';
}

// ── Tirar foto ────────────────────────────────────────────────
function tirarFoto() {
  if (!cameraAtiva) return;

  const snap = document.createElement('canvas');
  snap.width  = canvas.width;
  snap.height = canvas.height;
  snap.getContext('2d').drawImage(canvas, 0, 0);

  totalFotos++;
  document.getElementById('galeria-count').textContent = totalFotos;
  document.getElementById('galeria-section').style.display = 'block';

  const galeria = document.getElementById('galeria-fotos');
  const item = document.createElement('div');
  item.className = 'foto-item';

  const img = document.createElement('img');
  img.src = snap.toDataURL('image/jpeg', 0.92);

  const badge = document.createElement('div');
  badge.className = 'foto-filtro-badge';
  badge.textContent = filtroAtual;

  const btnDl = document.createElement('button');
  btnDl.className = 'btn-dl';
  btnDl.textContent = '⬇';
  btnDl.onclick = () => {
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `snap-${filtroAtual}-${Date.now()}.jpg`;
    a.click();
  };

  item.appendChild(img);
  item.appendChild(badge);
  item.appendChild(btnDl);
  galeria.insertBefore(item, galeria.firstChild);

  // Flash de captura
  canvas.style.transition = 'opacity .08s';
  canvas.style.opacity = '0.2';
  setTimeout(() => { canvas.style.opacity = '1'; }, 120);
}
