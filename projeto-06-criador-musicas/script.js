/* MusicGen AI — script.js | Tone.js + Google Gemini */

// NOTA: Insira aqui sua chave válida do Google AI Studio (https://aistudio.google.com/app/apikey)
const GEMINI_KEY = 'AQ.Ab8RN6KF3TQBfnlZeAYcK4omM5UFA3-qj57XRvSX03753ScClw';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

// ── Timeout helper ─────────────────────────────────────────────
function fetchComTimeout(url, opcoes, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opcoes, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

// ── Config atual ───────────────────────────────────────────────
let config = { genero:'lofi', humor:'feliz', bpm:120, oitava:4 };
let sequencia = null, synth = null, reverb = null, delay = null;
let tocando = false, animId = null;
let historicoMusicas = [];

// ── Progressões de acordes por gênero (qualidade musical real) ─
const progressoes = {
  lofi:       [['C4','E4','G4'],['A3','C4','E4'],['F3','A3','C4'],['G3','B3','D4']],
  eletronico: [['C4'],['G3'],['A3'],['F3']],
  pop:        [['C4','E4','G4'],['G3','B3','D4'],['A3','C4','E4'],['F3','A3','C4']],
  rock:       [['E3'],['A3'],['D4'],['E3']],
  jazz:       [['C4','E4','G4','B4'],['A3','C4','E4','G4'],['D3','F3','A3','C4'],['G3','B3','D4','F4']],
  classico:   [['C4','E4','G4'],['F3','A3','C4'],['G3','B3','D4'],['C4','E4','G4']],
};

// ── Escalas melódicas por humor ────────────────────────────────
const escalas = {
  feliz:       ['C','D','E','G','A'],
  melancolico: ['A','C','D','E','G'],
  energico:    ['C','D','E','F','G','A','B'],
  relaxante:   ['D','F','G','A','C'],
};

// ── Nomes fallback ─────────────────────────────────────────────
const nomesLocal = {
  lofi:['Café da Tarde','Chuva Suave','Estudo Tranquilo','Saudade Digital'],
  eletronico:['Pulso Neon','Frequência X','Matrix Beat','Circuito Aberto'],
  pop:['Momento Perfeito','Verão Eterno','Estrela Brilhante','Sonho Vivo'],
  rock:['Energia Total','Sem Limites','Coragem','Revolução'],
  jazz:['Madrugada Azul','Improviso','Sax na Chuva','Blues do Coração'],
  classico:['Adagio em Dó','Prelúdio n°3','Sonata da Alma','Valsa Infinita'],
};

// ── Seleção de opções ──────────────────────────────────────────
function sel(tipo, el, valor) {
  document.getElementById(tipo + '-opcoes').querySelectorAll('.opcao-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  config[tipo] = valor;
}

// ── Gerar nome com Gemini ──────────────────────────────────────
async function gerarNomeIA(genero, humor, bpm) {
  const prompt = `Crie um nome criativo e uma descrição curta (máx 12 palavras) para uma música ${genero} com atmosfera ${humor} a ${bpm} BPM. Responda EXATAMENTE neste formato: NOME | DESCRIÇÃO`;
  try {
    const res = await fetchComTimeout(GEMINI_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:1,maxOutputTokens:60}})
    }, 4000); // timeout de 4 segundos
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();
    const txt = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (txt.includes('|')) {
      const [nome, desc] = txt.split('|').map(s => s.trim());
      return { nome, desc };
    }
    return { nome: txt, desc: `${genero} · ${humor} · ${bpm} BPM` };
  } catch {
    const nomes = nomesLocal[genero] || nomesLocal.lofi;
    return {
      nome: nomes[Math.floor(Math.random() * nomes.length)],
      desc: `${genero} · ${humor} · ${bpm} BPM`
    };
  }
}

// ── Gerar música ───────────────────────────────────────────────
async function gerarMusica() {
  config.bpm   = parseInt(document.getElementById('bpm').value);
  config.oitava = parseInt(document.getElementById('oitava').value);

  const btn = document.getElementById('btn-gerar');
  btn.textContent = '⏳ Gerando…';
  btn.disabled = true;

  // Parar música anterior
  pararMusica();
  if (synth) { synth.dispose(); synth = null; }
  if (reverb) { reverb.dispose(); reverb = null; }
  if (delay)  { delay.dispose();  delay = null;  }

  await Tone.start();
  Tone.getTransport().bpm.value = config.bpm;

  // ── Criar efeitos ──────────────────────────────────────────
  const reverbLevel = { lofi:.7, eletronico:.3, pop:.4, rock:.2, jazz:.5, classico:.8 };
  const delayLevel  = { lofi:.2, eletronico:.4, pop:.15, rock:.05, jazz:.3, classico:0 };

  reverb = new Tone.Reverb({ decay:4, wet: reverbLevel[config.genero] || .4 }).toDestination();
  delay  = new Tone.FeedbackDelay('8n', 0.25);
  delay.wet.value = delayLevel[config.genero] || .15;
  delay.connect(reverb);

  // ── Criar sintetizador por gênero ──────────────────────────
  if (config.genero === 'jazz' || config.genero === 'classico') {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator:{ type:'triangle' },
      envelope:{ attack:.05, decay:.1, sustain:.6, release:1.5 }
    }).connect(delay);
  } else if (config.genero === 'eletronico') {
    synth = new Tone.FMSynth({
      harmonicity:2, modulationIndex:8,
      envelope:{ attack:.01, decay:.1, sustain:.5, release:.8 }
    }).connect(delay);
  } else if (config.genero === 'rock') {
    synth = new Tone.Synth({
      oscillator:{ type:'sawtooth' },
      envelope:{ attack:.01, decay:.05, sustain:.8, release:.3 }
    }).connect(delay);
  } else {
    // lofi, pop
    synth = new Tone.AMSynth({
      harmonicity:1.5,
      envelope:{ attack:.1, decay:.2, sustain:.6, release:1.2 }
    }).connect(delay);
  }

  // ── Sequência de notas ─────────────────────────────────────
  const escala = escalas[config.humor] || escalas.feliz;
  const prog   = progressoes[config.genero] || progressoes.lofi;
  const notas  = gerarSequencia(escala, prog, config.oitava, 16);

  // ── Sequencer ─────────────────────────────────────────────
  sequencia = new Tone.Sequence((time, nota) => {
    if (!nota) return;
    if (Array.isArray(nota)) {
      if (synth instanceof Tone.PolySynth) {
        synth.triggerAttackRelease(nota, '4n', time);
      } else {
        synth.triggerAttackRelease(nota[0], '8n', time);
      }
    } else {
      synth.triggerAttackRelease(nota, '8n', time);
    }
  }, notas, '8n');

  // ── Gerar nome com IA ──────────────────────────────────────
  const { nome, desc } = await gerarNomeIA(config.genero, config.humor, config.bpm);

  document.getElementById('titulo-musica').textContent = '🎵 ' + nome;
  document.getElementById('desc-musica').textContent   = desc;

  // Mostrar notas
  const notasDiv = document.getElementById('notas-geradas');
  const notasWrapper = document.getElementById('notas-wrapper');
  notasWrapper.style.display = 'flex';
  notasDiv.innerHTML = notas.flat().filter(Boolean).slice(0,16).map(n =>
    `<span class="nota-tag">${n}</span>`
  ).join('');

  // Habilitar controles
  document.getElementById('btn-play').disabled  = false;
  document.getElementById('btn-parar').disabled = false;
  document.getElementById('btn-share').disabled = false;

  // Salvar no histórico
  adicionarHistorico(nome, desc);

  btn.textContent = '🎼 Gerar Nova Música';
  btn.disabled = false;

  // Tocar automaticamente
  tocarMusica();
}

// ── Gerar sequência de notas melhorada ────────────────────────
function gerarSequencia(escala, prog, oitava, quantidade) {
  const seq = [];
  const progSize = prog.length;

  for (let i = 0; i < quantidade; i++) {
    const beat = Math.floor(i / 2) % progSize;

    if (i % 8 === 0 && prog[beat].length > 1) {
      // Acorde no tempo forte
      seq.push(prog[beat]);
    } else if (Math.random() < 0.12) {
      // Pausa ocasional
      seq.push(null);
    } else {
      // Nota melódica
      const nota = escala[Math.floor(Math.random() * escala.length)];
      const oct  = oitava + (Math.random() > 0.75 ? 1 : 0);
      seq.push(`${nota}${oct}`);
    }
  }
  return seq;
}

// ── Controles de reprodução ────────────────────────────────────
function tocarMusica() {
  if (!sequencia) return;
  sequencia.start(0);
  Tone.getTransport().start();
  tocando = true;
  document.getElementById('btn-play').textContent = '⏸️ Pausar';
  document.getElementById('vinil').classList.add('tocando');
  animarVis();
}

function tocarPausar() {
  if (!sequencia) return;
  if (tocando) {
    Tone.getTransport().pause();
    tocando = false;
    document.getElementById('btn-play').textContent = '▶️ Tocar';
    document.getElementById('vinil').classList.remove('tocando');
    cancelAnimationFrame(animId);
    resetarVis();
  } else {
    Tone.getTransport().start();
    tocando = true;
    document.getElementById('btn-play').textContent = '⏸️ Pausar';
    document.getElementById('vinil').classList.add('tocando');
    animarVis();
  }
}

function pararMusica() {
  if (sequencia) sequencia.stop();
  Tone.getTransport().stop();
  tocando = false;
  document.getElementById('btn-play').textContent = '▶️ Tocar';
  document.getElementById('vinil').classList.remove('tocando');
  cancelAnimationFrame(animId);
  resetarVis();
}

// ── Visualizador ───────────────────────────────────────────────
function animarVis() {
  for (let i = 1; i <= 12; i++) {
    const el = document.getElementById('vis' + i);
    if (el) el.style.height = (8 + Math.random() * 52) + 'px';
  }
  animId = requestAnimationFrame(animarVis);
}

function resetarVis() {
  for (let i = 1; i <= 12; i++) {
    const el = document.getElementById('vis' + i);
    if (el) el.style.height = '10px';
  }
}

// ── Histórico ──────────────────────────────────────────────────
function adicionarHistorico(nome, desc) {
  historicoMusicas.unshift({ nome, desc, genero:config.genero, bpm:config.bpm });
  if (historicoMusicas.length > 3) historicoMusicas.pop();

  const el = document.getElementById('historico-musicas');
  el.innerHTML = historicoMusicas.map((m, i) => `
    <div class="hist-track">
      <span>🎵</span>
      <span class="hist-track-nome">${m.nome}</span>
      <span class="hist-track-meta">${m.genero} · ${m.bpm}bpm</span>
    </div>
  `).join('');
}

// ── Compartilhar ───────────────────────────────────────────────
function compartilhar() {
  const nome = document.getElementById('titulo-musica').textContent;
  const desc = document.getElementById('desc-musica').textContent;
  navigator.clipboard.writeText(`🎵 ${nome}\n${desc}\n\nGerado com MusicGen AI`).then(() => {
    const btn = document.getElementById('btn-share');
    btn.textContent = '✅ Copiado!';
    setTimeout(() => { btn.textContent = '📋 Copiar'; }, 2000);
  });
}
