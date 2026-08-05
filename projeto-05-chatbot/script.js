/* =====================================================
   ChatBot IA — script.js
   Google Gemini 1.5 Flash API
   ===================================================== */

const GEMINI_KEY = 'AIzaSyAQ.Ab8RN6IUJwvclhq6lsBQoNoV3MXKAwlZAP5dYOzUVqdTVzh3TA';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

// ── Estado ────────────────────────────────────────────
let config = {
  nome: 'ARIA',
  personalidade: 'amigavel',
  area: 'geral',
  cor: 'azul'
};

let historico = [];   // array de { role, parts }
let totalMsgs = 0;
let aguardando = false;

// ── Paletas de cor ────────────────────────────────────
const paletas = {
  azul:    '#2563eb',
  roxo:    '#7c3aed',
  verde:   '#059669',
  rosa:    '#db2777',
  laranja: '#ea580c',
  ciano:   '#0891b2',
};

// ── System prompts por personalidade ─────────────────
const systemPrompts = {
  amigavel: (nome, area) =>
    `Você é ${nome}, um chatbot super amigável, animado e acolhedor. 
     Responde em português brasileiro de forma calorosa, usa emojis com moderação.
     Sua especialidade é: ${area}. 
     Seja conciso (máx 3 parágrafos), natural e descontraído.`,

  formal: (nome, area) =>
    `Você é ${nome}, um assistente profissional e formal.
     Responde em português brasileiro com linguagem culta e objetiva, sem gírias.
     Sua especialidade é: ${area}.
     Seja preciso e respeitoso. Máx 3 parágrafos.`,

  sarcastico: (nome, area) =>
    `Você é ${nome}, um chatbot sarcástico e irônico, mas sem ser ofensivo.
     Responde em português brasileiro com humor ácido e comentários inteligentes.
     Especialidade: ${area}. Use sarcasmo leve, seja engraçado. Máx 3 parágrafos.`,

  motivacional: (nome, area) =>
    `Você é ${nome}, um coach motivacional extremamente energético!
     Responde em português brasileiro com ENTUSIASMO TOTAL, palavras poderosas e incentivo constante!
     Especialidade: ${area}. Use maiúsculas com moderação, emojis de energia. Máx 3 parágrafos.`,

  geek: (nome, area) =>
    `Você é ${nome}, um chatbot geek apaixonado por tecnologia, programação e cultura nerd.
     Responde em português brasileiro com referências a games, filmes sci-fi, programação.
     Especialidade: ${area}. Seja técnico mas acessível. Máx 3 parágrafos.`,

  comico: (nome, area) =>
    `Você é ${nome}, um chatbot humorístico que adora fazer piadas e deixar as pessoas rindo.
     Responde em português brasileiro com humor, trocadilhos e situações engraçadas.
     Especialidade: ${area}. Seja engraçado sem ser ofensivo. Máx 3 parágrafos.`,
};

// ── Respostas locais de fallback ──────────────────────
const fallbacks = {
  amigavel:    ['Que interessante! Me conta mais! 😊', 'Adorei isso! E aí, o que mais?', 'Que legal! Conta mais detalhes! 🥳'],
  formal:      ['Compreendo. Poderia elaborar?', 'Interessante perspectiva.', 'Entendido. Prossiga.'],
  sarcastico:  ['Claro, como se eu não soubesse... 🙄', 'Uau. Revolucionário. 😏', 'Fascinante. *boceja*'],
  motivacional:['VOCÊ CONSEGUE! 💪🔥', 'VAI LÁ E CONQUISTE! 🚀', 'ACREDITE EM VOCÊ! ⚡'],
  geek:        ['Interessante algoritmo de pensamento! 🤓', 'Processando... resultado: fascinante! 💻', 'Debug mode ativado! 🐛'],
  comico:      ['Hahahaha! Mas sério, boa! 😂', 'Isso é tão engraçado quanto um loop infinito! 🤣', 'Ta bom né! 😄'],
};

// ── Seleção de personalidade ──────────────────────────
function selecionarPers(el) {
  document.querySelectorAll('.pers-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  config.personalidade = el.dataset.pers;
}

// ── Seleção de cor ────────────────────────────────────
function selecionarCor(el) {
  document.querySelectorAll('.cor-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  config.cor = el.dataset.cor;
}

// ── Criar bot e ir para o chat ────────────────────────
function criarBot() {
  config.nome = document.getElementById('bot-nome').value.trim() || 'ARIA';
  config.area = document.getElementById('bot-area').value;

  // Aplicar cor no header
  const header = document.getElementById('chat-header');
  const btnEnviar = document.querySelector('.btn-enviar');
  const cor = paletas[config.cor] || paletas.azul;
  header.style.background = cor;
  btnEnviar.style.background = cor;
  document.documentElement.style.setProperty('--accent', cor);

  // Atualizar nome no header
  document.getElementById('bot-nome-header').textContent = config.nome;
  document.getElementById('header-avatar').textContent = avatarPorPersonalidade(config.personalidade);

  // Resetar histórico
  historico = [];
  totalMsgs = 0;
  document.getElementById('chat-mensagens').innerHTML = '';
  document.getElementById('msg-counter').textContent = '0 msgs';

  // Trocar de tela
  document.getElementById('tela-config').classList.add('hidden');
  document.getElementById('tela-chat').classList.remove('hidden');

  // Mensagem de boas-vindas
  setTimeout(() => {
    const bvDiv = document.createElement('div');
    bvDiv.className = 'msg-boas-vindas';
    bvDiv.innerHTML = `🤖 <strong>${config.nome}</strong> está online · Powered by Google Gemini`;
    document.getElementById('chat-mensagens').appendChild(bvDiv);
    enviarBoasVindas();
  }, 300);
}

function avatarPorPersonalidade(p) {
  const avatares = { amigavel:'😊', formal:'🎩', sarcastico:'😏', motivacional:'💪', geek:'👾', comico:'😂' };
  return avatares[p] || '🤖';
}

async function enviarBoasVindas() {
  mostrarDigitando();
  const bv = await chamarGemini('Olá! Me apresente de forma criativa em 1-2 frases.');
  removerDigitando();
  adicionarMensagem(bv, 'bot');
}

// ── Voltar para configuração ──────────────────────────
function voltarConfig() {
  document.getElementById('tela-chat').classList.add('hidden');
  document.getElementById('tela-config').classList.remove('hidden');
}

// ── Limpar chat ───────────────────────────────────────
function limparChat() {
  historico = [];
  totalMsgs = 0;
  document.getElementById('chat-mensagens').innerHTML = '';
  document.getElementById('msg-counter').textContent = '0 msgs';
  const bvDiv = document.createElement('div');
  bvDiv.className = 'msg-boas-vindas';
  bvDiv.innerHTML = `🗑️ Chat limpo · <strong>${config.nome}</strong> continua online`;
  document.getElementById('chat-mensagens').appendChild(bvDiv);
}

// ── Enter para enviar ─────────────────────────────────
function teclaEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    enviarMensagem();
  }
  // Atualizar contador de caracteres
  const len = e.target.value.length;
  document.getElementById('char-counter').textContent = `${len}/500`;
}

// ── Enviar mensagem ───────────────────────────────────
async function enviarMensagem() {
  if (aguardando) return;

  const input = document.getElementById('input-mensagem');
  const texto = input.value.trim();
  if (!texto) return;

  adicionarMensagem(texto, 'usuario');
  input.value = '';
  document.getElementById('char-counter').textContent = '0/500';

  // Desabilitar enquanto aguarda
  aguardando = true;
  const btnEnviar = document.getElementById('btn-enviar');
  btnEnviar.disabled = true;
  document.getElementById('status-texto').textContent = 'Digitando…';

  mostrarDigitando();

  try {
    const resposta = await chamarGemini(texto);
    removerDigitando();
    adicionarMensagem(resposta, 'bot');
  } catch (err) {
    removerDigitando();
    const fb = fallbacks[config.personalidade];
    adicionarMensagem(fb[Math.floor(Math.random() * fb.length)], 'bot', true);
    console.error('Gemini error:', err);
  } finally {
    aguardando = false;
    btnEnviar.disabled = false;
    document.getElementById('status-texto').textContent = 'Online · Gemini IA';
  }
}

// ── Chamar API Gemini ─────────────────────────────────
async function chamarGemini(mensagemUsuario) {
  const systemPrompt = systemPrompts[config.personalidade]
    ? systemPrompts[config.personalidade](config.nome, config.area)
    : systemPrompts.amigavel(config.nome, config.area);

  // Adicionar mensagem ao histórico
  historico.push({ role: 'user', parts: [{ text: mensagemUsuario }] });

  // Manter apenas as últimas 10 mensagens no histórico
  if (historico.length > 20) historico = historico.slice(-20);

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: historico,
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 400,
    }
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || '...';

  // Adicionar resposta do bot ao histórico
  historico.push({ role: 'model', parts: [{ text: resposta }] });

  return resposta;
}

// ── Adicionar mensagem no DOM ─────────────────────────
function adicionarMensagem(texto, tipo, isErro = false) {
  const container = document.getElementById('chat-mensagens');
  const div = document.createElement('div');
  div.className = `msg msg-${tipo}${isErro ? ' msg-erro' : ''}`;

  const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Processar markdown básico
  const textoFormatado = tipo === 'bot' ? processarMarkdown(texto) : escapeHtml(texto);

  div.innerHTML = `${textoFormatado}<div class="msg-hora">${hora}</div>`;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  // Atualizar contador
  if (tipo === 'usuario') {
    totalMsgs++;
    document.getElementById('msg-counter').textContent =
      `${totalMsgs} msg${totalMsgs !== 1 ? 's' : ''}`;
  }
}

// ── Processar markdown básico ─────────────────────────
function processarMarkdown(texto) {
  return escapeHtml(texto)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Indicador de digitação ────────────────────────────
function mostrarDigitando() {
  removerDigitando();
  const container = document.getElementById('chat-mensagens');
  const div = document.createElement('div');
  div.className = 'digitando';
  div.id = 'typing-indicator';
  div.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removerDigitando() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

// ── Contador de chars no input ────────────────────────
document.getElementById('input-mensagem').addEventListener('input', function() {
  document.getElementById('char-counter').textContent = `${this.value.length}/500`;
});
