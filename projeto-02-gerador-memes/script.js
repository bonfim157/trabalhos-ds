/* ============================================================
   MemeForge — script.js
   Imgflip API + Canvas API
   ============================================================ */

// ── Fallback de templates (usado se a API falhar) ─────────────
const FALLBACK_TEMPLATES = [
  { id: 'f1',  name: 'Clássico',     emoji: '😂', bg: '#1a1a1a' },
  { id: 'f2',  name: 'Sapo',         emoji: '🐸', bg: '#0f2410' },
  { id: 'f3',  name: 'Cachorro',     emoji: '🐶', bg: '#2a1a0e' },
  { id: 'f4',  name: 'Dark Humor',   emoji: '💀', bg: '#0a0a0a' },
  { id: 'f5',  name: 'Palhaço',      emoji: '🤡', bg: '#1a0505' },
  { id: 'f6',  name: 'Espacial',     emoji: '🚀', bg: '#050518' },
  { id: 'f7',  name: 'Big Brain',    emoji: '🧠', bg: '#12082a' },
  { id: 'f8',  name: 'Stonks',       emoji: '📈', bg: '#051a10' },
  { id: 'f9',  name: 'Choque',       emoji: '😱', bg: '#1a1000' },
  { id: 'f10', name: 'Chad',         emoji: '😎', bg: '#0a1020' },
];

// ── Estado da aplicação ───────────────────────────────────────
let templateSelecionado = null;   // objeto do template atual
let imgAtual = null;              // HTMLImageElement carregado
let modoEmoji = false;            // true quando usando fallback

// ── Referências DOM ───────────────────────────────────────────
const canvas       = document.getElementById('canvas-meme');
const ctx          = canvas.getContext('2d');
const gridEl       = document.getElementById('grid-templates');
const badgeEl      = document.getElementById('badge-count');
const selectedName = document.getElementById('selected-name');
const placeholder  = document.getElementById('canvas-placeholder');
const colorInput   = document.getElementById('cor-texto');
const colorPreview = document.getElementById('color-preview');
const fontSizeEl   = document.getElementById('tamanho-fonte');
const fontLabel    = document.getElementById('valor-fonte');

// ── Inicialização ─────────────────────────────────────────────
async function init() {
  try {
    const res  = await fetch('https://api.imgflip.com/get_memes');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.success) throw new Error('API retornou success=false');

    const top20 = data.data.memes.slice(0, 20);
    renderTemplatesReais(top20);
    badgeEl.textContent = '20 templates';
    modoEmoji = false;

  } catch (err) {
    console.warn('Imgflip API falhou, usando fallback emoji:', err.message);
    renderFallbackEmojis();
    badgeEl.textContent = 'offline';
    modoEmoji = true;
  }
}

// ── Renderizar templates com imagens reais ────────────────────
function renderTemplatesReais(memes) {
  gridEl.innerHTML = '';

  memes.forEach((meme, idx) => {
    const item = document.createElement('div');
    item.className = 'template-item';
    item.title = meme.name;

    const img = document.createElement('img');
    img.src   = meme.url;
    img.alt   = meme.name;
    img.loading = 'lazy';

    const nameTag = document.createElement('span');
    nameTag.className = 'item-name';
    nameTag.textContent = meme.name;

    item.appendChild(img);
    item.appendChild(nameTag);

    item.addEventListener('click', () => selecionarTemplate(meme, item, false));
    gridEl.appendChild(item);

    // Seleciona automaticamente o 1º
    if (idx === 0) {
      selecionarTemplate(meme, item, false);
    }
  });
}

// ── Renderizar fallback com emojis ────────────────────────────
function renderFallbackEmojis() {
  gridEl.innerHTML = '';

  FALLBACK_TEMPLATES.forEach((t, idx) => {
    const item = document.createElement('div');
    item.className = 'template-item emoji-item';
    item.title = t.name;
    item.innerHTML = `
      <span>${t.emoji}</span>
      <span class="emoji-label">${t.name}</span>
    `;

    item.addEventListener('click', () => selecionarTemplate(t, item, true));
    gridEl.appendChild(item);

    if (idx === 0) {
      selecionarTemplate(t, item, true);
    }
  });
}

// ── Selecionar template ───────────────────────────────────────
function selecionarTemplate(template, el, isEmoji) {
  // Remove seleção anterior
  document.querySelectorAll('.template-item').forEach(d => d.classList.remove('selected'));
  el.classList.add('selected');

  templateSelecionado = template;
  modoEmoji = isEmoji;

  // Atualiza nome exibido
  selectedName.textContent = template.name;

  // Esconde placeholder
  placeholder.classList.add('hidden');

  if (isEmoji) {
    // Modo emoji: não precisa carregar imagem
    imgAtual = null;
    canvas.width  = 600;
    canvas.height = 500;
    atualizarMeme();
  } else {
    // Carrega imagem real e desenha
    carregarImagem(template.url);
  }
}

// ── Carregar imagem no canvas ─────────────────────────────────
function carregarImagem(url) {
  const novaImg = new Image();
  novaImg.crossOrigin = 'anonymous';   // necessário para toDataURL depois

  novaImg.onload = () => {
    imgAtual = novaImg;

    // Ajusta canvas proporcional à imagem (máx 600px de largura)
    const maxW = 600;
    const scale = Math.min(1, maxW / novaImg.naturalWidth);
    canvas.width  = Math.round(novaImg.naturalWidth  * scale);
    canvas.height = Math.round(novaImg.naturalHeight * scale);

    atualizarMeme();
  };

  novaImg.onerror = () => {
    // Se a imagem não carregar (CORS etc.), usa fundo cinza
    imgAtual = null;
    canvas.width  = 600;
    canvas.height = 500;
    atualizarMeme();
  };

  novaImg.src = url;
}

// ── Desenhar meme no canvas ───────────────────────────────────
function atualizarMeme() {
  if (!templateSelecionado) return;

  const textoCima  = document.getElementById('texto-cima').value  || '';
  const textoBaixo = document.getElementById('texto-baixo').value || '';
  const cor        = colorInput.value;
  const tamanho    = parseInt(fontSizeEl.value);

  // Atualiza displays
  fontLabel.textContent    = tamanho + 'px';
  colorPreview.textContent = cor;

  // Limpa canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ── Fundo ─────────────────────────────────────────────────
  if (modoEmoji || !imgAtual) {
    // Fundo sólido (fallback)
    ctx.fillStyle = templateSelecionado.bg || '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Emoji central grande
    if (templateSelecionado.emoji) {
      ctx.font = '160px serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(templateSelecionado.emoji, canvas.width / 2, canvas.height / 2);
    }
  } else {
    // Imagem real
    ctx.drawImage(imgAtual, 0, 0, canvas.width, canvas.height);
  }

  // ── Configuração tipográfica ───────────────────────────────
  ctx.font        = `bold ${tamanho}px Impact, "Arial Black", sans-serif`;
  ctx.textAlign   = 'center';
  ctx.lineWidth   = Math.max(2, tamanho * 0.1); // contorno proporcional
  ctx.strokeStyle = cor === '#ffffff' || cor === '#ffffffff'
    ? '#000000'
    : '#ffffff';       // contorno sempre oposto ao texto

  // ── Função helper: texto com contorno ─────────────────────
  function desenharTexto(texto, x, y, baseline) {
    if (!texto.trim()) return;
    ctx.textBaseline = baseline;
    const linhas = quebrarLinhas(ctx, texto.toUpperCase(), canvas.width - 40);
    const alturaLinha = tamanho * 1.2;

    linhas.forEach((linha, i) => {
      let posY;
      if (baseline === 'top') {
        posY = y + i * alturaLinha;
      } else {
        posY = y - (linhas.length - 1 - i) * alturaLinha;
      }
      ctx.strokeText(linha, x, posY);
      ctx.fillStyle = cor;
      ctx.fillText(linha, x, posY);
    });
  }

  // ── Texto de Cima ─────────────────────────────────────────
  desenharTexto(textoCima, canvas.width / 2, 16, 'top');

  // ── Texto de Baixo ────────────────────────────────────────
  desenharTexto(textoBaixo, canvas.width / 2, canvas.height - 16, 'bottom');
}

// ── Quebra de linha automática ────────────────────────────────
function quebrarLinhas(ctx, texto, maxWidth) {
  if (!texto) return [];
  const palavras = texto.split(' ');
  const linhas   = [];
  let atual      = '';

  palavras.forEach(palavra => {
    const teste = atual ? atual + ' ' + palavra : palavra;
    if (ctx.measureText(teste).width > maxWidth && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = teste;
    }
  });
  if (atual) linhas.push(atual);
  return linhas;
}

// ── Gerar meme via API Imgflip (caption_image) ────────────────
async function gerarViaAPI() {
  if (!templateSelecionado) {
    mostrarErroAPI('Selecione um template primeiro!');
    return;
  }

  // Só funciona com templates reais (que têm ID numérico da Imgflip)
  const templateId = templateSelecionado.id;
  if (!templateId || String(templateId).startsWith('f')) {
    mostrarErroAPI('Este template offline não é suportado pela API. Selecione um template da galeria Imgflip.');
    return;
  }

  const textoCima  = document.getElementById('texto-cima').value  || '';
  const textoBaixo = document.getElementById('texto-baixo').value || '';

  // Estado: carregando
  const btn = document.getElementById('btn-gerar-api');
  const resultadoEl = document.getElementById('resultado-api');
  const imgResultEl = document.getElementById('img-resultado-api');
  const erroEl      = document.getElementById('erro-api');

  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span><span>Gerando…</span>';
  resultadoEl.classList.add('hidden');
  erroEl.classList.add('hidden');

  try {
    const formData = new URLSearchParams();
    formData.append('template_id', templateId);
    formData.append('username',    'ferreirabonfimrafael@gmail.com');
    formData.append('password',    '12345678Ra_-');
    formData.append('text0',       textoCima);
    formData.append('text1',       textoBaixo);

    const res = await fetch('https://api.imgflip.com/caption_image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    if (!res.ok) throw new Error('Erro HTTP ' + res.status);

    const data = await res.json();

    if (!data.success) {
      // A API retorna error_message quando success=false
      throw new Error(data.error_message || 'A API retornou um erro desconhecido.');
    }

    // Sucesso: exibe a imagem gerada
    const urlMeme = data.data.url;
    imgResultEl.src = urlMeme;
    imgResultEl.alt = 'Meme gerado pela Imgflip API';
    resultadoEl.classList.remove('hidden');

    // Scroll suave até o resultado
    resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    let msg = err.message;
    // Traduz erros comuns para mensagens amigáveis
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      msg = 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
    } else if (msg.includes('401') || msg.toLowerCase().includes('login')) {
      msg = 'Credenciais inválidas. Verifique seu usuário e senha da Imgflip.';
    } else if (msg.includes('429')) {
      msg = 'Limite de requisições atingido. Aguarde alguns instantes e tente novamente.';
    }
    mostrarErroAPI('Não foi possível gerar o meme: ' + msg);
    console.error('[caption_image] Erro:', err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">🚀</span><span>Gerar via API 🚀</span>';
  }
}

function mostrarErroAPI(mensagem) {
  const erroEl = document.getElementById('erro-api');
  erroEl.textContent = '⚠️ ' + mensagem;
  erroEl.classList.remove('hidden');
  document.getElementById('resultado-api').classList.add('hidden');
}

function abrirLinkDownloadAPI() {
  const imgEl = document.getElementById('img-resultado-api');
  if (imgEl && imgEl.src) {
    window.open(imgEl.src, '_blank', 'noopener,noreferrer');
  }
}

// ── Download do meme ──────────────────────────────────────────
function baixarMeme() {
  if (!templateSelecionado) {
    alert('Selecione um template primeiro!');
    return;
  }

  try {
    const link      = document.createElement('a');
    link.download   = 'meme-memeforge.png';
    link.href       = canvas.toDataURL('image/png');
    link.click();
  } catch (e) {
    // CORS pode bloquear toDataURL com imagens externas
    alert(
      'Não foi possível baixar (bloqueio CORS da imagem).\n' +
      'Tente clicar com o botão direito no canvas e "Salvar imagem".'
    );
    console.error(e);
  }
}

// ── Listeners adicionais ──────────────────────────────────────
colorInput.addEventListener('input', () => {
  colorPreview.textContent = colorInput.value;
  atualizarMeme();
});

fontSizeEl.addEventListener('input', () => {
  fontLabel.textContent = fontSizeEl.value + 'px';
  atualizarMeme();
});

// ── Start ─────────────────────────────────────────────────────
init();
