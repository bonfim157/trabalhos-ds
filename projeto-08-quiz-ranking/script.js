/* Quiz Ranking — script.js | Open Trivia DB API */

const TROFEUS = ['🥇','🥈','🥉','🏅','🏅','🏅','🏅','🏅','🏅','🏅'];

let estado = {
  jogador:'', categoria:'any', dificuldade:'any',
  perguntas:[], idx:0, pontos:0, acertos:0,
  timer:15, timerInterval:null, inicio:0
};

let ranking = JSON.parse(localStorage.getItem('ds_quiz_v2') || '[]');

/* ── Seleção de categoria e dificuldade ───────────── */
function selecionarCat(cat, el) {
  estado.categoria = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function selecionarDif(dif, el) {
  estado.dificuldade = dif;
  document.querySelectorAll('.dif-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

/* ── Iniciar Quiz ─────────────────────────────────── */
async function iniciarQuiz() {
  const nome = document.getElementById('input-jogador').value.trim();
  if (!nome) { alert('Digite seu nome!'); return; }
  estado.jogador = nome;
  estado.idx = 0; estado.pontos = 0; estado.acertos = 0;
  estado.inicio = Date.now();

  // Mostrar loading
  mostrarTela('tela-loading');

  try {
    const perguntas = await buscarPerguntas();
    if (!perguntas || perguntas.length === 0) throw new Error('Sem perguntas');
    estado.perguntas = perguntas;
    configurarLabels();
    mostrarTela('tela-quiz');
    mostrarPergunta();
  } catch (err) {
    console.error('Open Trivia DB falhou:', err);
    // Fallback com perguntas locais
    estado.perguntas = bancoPerguntasLocal();
    configurarLabels();
    mostrarTela('tela-quiz');
    mostrarPergunta();
  }
}

/* ── Buscar da Open Trivia DB ─────────────────────── */
async function buscarPerguntas() {
  let url = 'https://opentdb.com/api.php?amount=10&type=multiple&encode=url3986';
  if (estado.categoria !== 'any') url += `&category=${estado.categoria}`;
  if (estado.dificuldade !== 'any') url += `&difficulty=${estado.dificuldade}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (data.response_code !== 0) throw new Error('API code ' + data.response_code);

  // Formatar perguntas
  return data.results.map(q => {
    const correta = decodeURIComponent(q.correct_answer);
    const incorretas = q.incorrect_answers.map(a => decodeURIComponent(a));
    const todas = [...incorretas, correta].sort(() => Math.random() - 0.5);
    return {
      pergunta: decodeURIComponent(q.question),
      opcoes: todas,
      correta: todas.indexOf(correta),
      dificuldade: q.difficulty
    };
  });
}

/* ── Banco local de fallback ──────────────────────── */
function bancoPerguntasLocal() {
  return [
    { pergunta:'Qual é o maior planeta do Sistema Solar?', opcoes:['Saturno','Júpiter','Urano','Netuno'], correta:1, dificuldade:'easy' },
    { pergunta:'Quem criou o Python?', opcoes:['Guido van Rossum','Dennis Ritchie','Linus Torvalds','Bjarne Stroustrup'], correta:0, dificuldade:'medium' },
    { pergunta:'O que significa HTML?', opcoes:['HyperText Markup Language','High Tech Modern Language','Hyper Transfer Mode Link','Home Tool Maker Language'], correta:0, dificuldade:'easy' },
    { pergunta:'Quantos bits tem 1 byte?', opcoes:['4','16','8','2'], correta:2, dificuldade:'easy' },
    { pergunta:'Qual linguagem de programação usa o símbolo "#" para comentários?', opcoes:['Java','C++','Python','JavaScript'], correta:2, dificuldade:'easy' },
    { pergunta:'Qual empresa criou o Java?', opcoes:['Microsoft','Sun Microsystems','Apple','IBM'], correta:1, dificuldade:'medium' },
    { pergunta:'O que é um algoritmo?', opcoes:['Um tipo de hardware','Sequência de passos para resolver um problema','Um banco de dados','Um sistema operacional'], correta:1, dificuldade:'easy' },
    { pergunta:'Qual protocolo é usado para navegar na web?', opcoes:['FTP','SMTP','HTTP','SSH'], correta:2, dificuldade:'easy' },
    { pergunta:'Qual é a extensão de um arquivo JavaScript?', opcoes:['.java','.js','.py','.cpp'], correta:1, dificuldade:'easy' },
    { pergunta:'O que significa CSS?', opcoes:['Cascading Style Sheets','Computer Style System','Creative Sheet Style','Code Style Script'], correta:0, dificuldade:'easy' },
  ].sort(() => Math.random() - 0.5);
}

/* ── Configurar labels ────────────────────────────── */
const catNomes = { any:'🎲 Geral', '9':'📚 Conhecimentos', '11':'🎬 Cinema', '12':'🎵 Música', '15':'🎮 Games', '18':'💻 Tech', '21':'⚽ Esportes', '27':'🐾 Animais' };
const difNomes = { any:'🎯 Qualquer', easy:'🟢 Fácil', medium:'🟡 Médio', hard:'🔴 Difícil' };

function configurarLabels() {
  document.getElementById('categoria-label').textContent = catNomes[estado.categoria] || '🎲 Geral';
  document.getElementById('dif-label').textContent = difNomes[estado.dificuldade] || '🎯';
}

/* ── Mostrar pergunta ─────────────────────────────── */
function mostrarPergunta() {
  if (estado.idx >= estado.perguntas.length) { encerrarQuiz(); return; }

  const p = estado.perguntas[estado.idx];
  const total = estado.perguntas.length;

  document.getElementById('num-pergunta').textContent = `Pergunta ${estado.idx + 1}/${total}`;
  document.getElementById('texto-pergunta').textContent = p.pergunta;
  document.getElementById('barra-quiz').style.width = `${(estado.idx / total) * 100}%`;
  document.getElementById('placar').textContent = `${estado.pontos} pts`;

  const container = document.getElementById('opcoes-container');
  container.innerHTML = '';
  p.opcoes.forEach((op, i) => {
    const btn = document.createElement('button');
    btn.className = 'opcao';
    btn.textContent = op;
    btn.onclick = () => responder(i, btn, p.correta);
    container.appendChild(btn);
  });

  iniciarTimer();
}

/* ── Timer ────────────────────────────────────────── */
function iniciarTimer() {
  clearInterval(estado.timerInterval);
  estado.timer = 15;
  atualizarTimer();

  estado.timerInterval = setInterval(() => {
    estado.timer--;
    atualizarTimer();
    if (estado.timer <= 0) {
      clearInterval(estado.timerInterval);
      responder(-1, null, estado.perguntas[estado.idx].correta);
    }
  }, 1000);
}

function atualizarTimer() {
  const el = document.getElementById('timer');
  el.textContent = estado.timer;
  el.classList.toggle('timer-urgente', estado.timer <= 5);
  // Atualizar anel
  const pct = (estado.timer / 15) * 100;
  const cor = estado.timer > 5 ? '#6366f1' : '#ef4444';
  document.getElementById('timer-container').style.background =
    `conic-gradient(${cor} ${pct}%, rgba(99,102,241,0.2) 0%)`;
}

/* ── Responder ────────────────────────────────────── */
function responder(idx, btn, correta) {
  clearInterval(estado.timerInterval);

  document.querySelectorAll('.opcao').forEach((b, i) => {
    b.onclick = null;
    b.disabled = true;
    if (i === correta) b.classList.add('correta');
  });

  if (idx === correta) {
    if (btn) btn.classList.add('correta');
    const bonus = Math.round(estado.timer * 10);
    estado.pontos += 100 + bonus;
    estado.acertos++;
  } else {
    if (btn) btn.classList.add('errada');
  }

  estado.idx++;
  setTimeout(mostrarPergunta, 1300);
}

/* ── Encerrar Quiz ────────────────────────────────── */
function encerrarQuiz() {
  clearInterval(estado.timerInterval);
  const tempo = Math.round((Date.now() - estado.inicio) / 1000);
  const total = estado.perguntas.length;
  const precisao = Math.round((estado.acertos / total) * 100);

  // Salvar ranking
  ranking.push({ nome: estado.jogador, pontos: estado.pontos, acertos: estado.acertos, total, tempo });
  ranking.sort((a, b) => b.pontos - a.pontos);
  if (ranking.length > 10) ranking = ranking.slice(0, 10);
  localStorage.setItem('ds_quiz_v2', JSON.stringify(ranking));

  mostrarTela('tela-resultado');

  document.getElementById('nome-resultado').textContent = estado.jogador;
  document.getElementById('pontos-final').textContent = estado.pontos;
  document.getElementById('acertos-final').textContent = `${estado.acertos}/${total}`;
  document.getElementById('tempo-final').textContent = tempo + 's';
  document.getElementById('precisao-final').textContent = precisao + '%';

  const pos = ranking.findIndex(r => r.nome === estado.jogador && r.pontos === estado.pontos);
  document.getElementById('trofeu-icon').textContent = TROFEUS[pos] || '🎮';

  const msgs = ['Pratique mais! 💪','Bom começo! 📚','Indo bem! 😄','Muito bom! 🔥','Incrível! 🏆','Perfeito! 🌟'];
  document.getElementById('mensagem-resultado').textContent = msgs[Math.floor(precisao / 20)] || msgs[0];

  document.getElementById('ranking-final').innerHTML = ranking.slice(0, 5).map((r, i) =>
    `<div class="rank-item"><span>${TROFEUS[i]||i+1+'º'}</span><span>${r.nome}</span><span class="rank-pts">${r.pontos}pts</span><span class="rank-acc">${Math.round(r.acertos/r.total*100)}%</span></div>`
  ).join('');
}

/* ── Voltar ao início ─────────────────────────────── */
function voltarInicio() {
  mostrarTela('tela-inicio');
  renderizarRankingMini();
}

function renderizarRankingMini() {
  const el = document.getElementById('ranking-mini');
  if (ranking.length === 0) {
    el.innerHTML = '<div class="rank-vazio">Ainda sem pontuações! Seja o primeiro! 🎮</div>';
    return;
  }
  el.innerHTML = ranking.slice(0, 5).map((r, i) =>
    `<div class="rank-item"><span>${TROFEUS[i]||i+1+'º'}</span><span>${r.nome}</span><span class="rank-pts">${r.pontos}pts</span><span class="rank-acc">${Math.round(r.acertos/r.total*100)}%</span></div>`
  ).join('');
}

/* ── Utilitário de telas ──────────────────────────── */
function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

/* ── Init ─────────────────────────────────────────── */
renderizarRankingMini();
