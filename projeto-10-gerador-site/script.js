/* SiteGen AI — script.js (limpo, sem duplicatas) */

// NOTA: Insira aqui sua chave válida do Google AI Studio (https://aistudio.google.com/app/apikey)
const GEMINI_KEY = 'AQ.Ab8RN6KF3TQBfnlZeAYcK4omM5UFA3-qj57XRvSX03753ScClw';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_KEY;

// ── Timeout helper ────────────────────────────────────────────
function fetchComTimeout(url, opcoes, ms) {
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, ms);
  return fetch(url, Object.assign({}, opcoes, { signal: controller.signal }))
    .finally(function() { clearTimeout(timer); });
}

/* ─── ESTADO GLOBAL ────────────────────────────────────────── */
let avatar      = '👨‍💻';
let tema        = 'dark-azul';
let fonte       = 'Poppins';
let template    = 'classic';
let fotoPerfil  = null;
let fotoBanner  = null;
let skills      = [];
let projetos    = [];
let experiencias = [];
let formacoes   = [];
let editandoProjeto     = -1;
let editandoExperiencia = -1;
let editandoFormacao    = -1;

/* ─── TEMAS ────────────────────────────────────────────────── */
const temas = {
  'dark-azul':     { bg:'#0d1117', card:'#161b22', accent:'#2563eb', texto:'#e6edf3', sub:'#8b949e', borda:'#21262d', gradHero:'linear-gradient(135deg,#0d1117 60%,#1a2744)' },
  'dark-roxo':     { bg:'#0f0c29', card:'#1a1033', accent:'#a855f7', texto:'#f3e8ff', sub:'#a78bfa', borda:'#2d1b5e', gradHero:'linear-gradient(135deg,#0f0c29 60%,#2d1b5e)' },
  'neon-verde':    { bg:'#001a00', card:'#002800', accent:'#00ff41', texto:'#ccffcc', sub:'#00cc33', borda:'#003310', gradHero:'linear-gradient(135deg,#001a00 60%,#003310)' },
  'sunset':        { bg:'#1a0a00', card:'#2a1200', accent:'#f97316', texto:'#fed7aa', sub:'#fb923c', borda:'#7c2d12', gradHero:'linear-gradient(135deg,#1a0a00 60%,#3b1400)' },
  'ocean':         { bg:'#001a2c', card:'#002a44', accent:'#06b6d4', texto:'#e0f7fa', sub:'#67e8f9', borda:'#0e4c5e', gradHero:'linear-gradient(135deg,#001a2c 60%,#003d5c)' },
  'claro':         { bg:'#f8fafc', card:'#ffffff', accent:'#3b82f6', texto:'#1e293b', sub:'#64748b', borda:'#e2e8f0', gradHero:'linear-gradient(135deg,#f8fafc 60%,#dbeafe)' },
  'midnight-pink': { bg:'#1a0020', card:'#2a0035', accent:'#ec4899', texto:'#fce7f3', sub:'#f9a8d4', borda:'#4a0060', gradHero:'linear-gradient(135deg,#1a0020 60%,#3b0050)' },
  'cyberpunk':     { bg:'#0a0a0a', card:'#111111', accent:'#ffe600', texto:'#ffe600', sub:'#ccb800', borda:'#333300', gradHero:'linear-gradient(135deg,#0a0a0a 60%,#1a1a00)' },
  'mono':          { bg:'#111111', card:'#1e1e1e', accent:'#aaaaaa', texto:'#eeeeee', sub:'#888888', borda:'#333333', gradHero:'linear-gradient(135deg,#111 60%,#222)' },
  'minimal':       { bg:'#ffffff', card:'#f9fafb', accent:'#111827', texto:'#111827', sub:'#6b7280', borda:'#e5e7eb', gradHero:'linear-gradient(135deg,#fff 60%,#f3f4f6)' },
};

/* ─── ABAS / AVATAR / TEMA / FONTE / TEMPLATE ──────────────── */
function mudarAba(el, aba) {
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
  el.classList.add('active');
  document.getElementById('tab-' + aba).classList.add('active');
}
function selAvatar(el, av) {
  document.querySelectorAll('.avatar-op').forEach(function(b) { b.classList.remove('selected'); });
  el.classList.add('selected');
  avatar = av;
  atualizarPreview();
}
function selTema(el, t) {
  document.querySelectorAll('.tema-btn').forEach(function(b) { b.classList.remove('active'); });
  el.classList.add('active');
  tema = t;
  atualizarPreview();
}
function selFonte(el, f) {
  document.querySelectorAll('.fonte-btn').forEach(function(b) { b.classList.remove('active'); });
  el.classList.add('active');
  fonte = f;
  atualizarPreview();
}
function selTemplate(el, tpl) {
  document.querySelectorAll('.template-btn').forEach(function(b) { b.classList.remove('active'); });
  el.classList.add('active');
  template = tpl;
  atualizarPreview();
}

/* ─── UPLOADS ──────────────────────────────────────────────── */
function carregarFotoPerfil(event) {
  var file = event.target.files[0];
  if (!file) return;
  // feedback imediato de carregamento
  var prev = document.getElementById('perfil-preview');
  prev.innerHTML = '<div class="img-loading"><div class="img-spinner"></div><span>Carregando…</span></div>';
  var reader = new FileReader();
  reader.onload = function(e) {
    fotoPerfil = e.target.result;
    prev.innerHTML = '<img src="' + fotoPerfil + '" alt="Foto" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>';
    document.getElementById('btn-remover-perfil').style.display = 'inline-flex';
    document.getElementById('campo-avatar-emoji').style.opacity = '0.4';
    mostrarToast('✅ Foto de perfil carregada!');
    atualizarPreview();
  };
  reader.onerror = function() {
    prev.innerHTML = '<span class="upload-placeholder-icon">⚠️</span><span class="upload-placeholder-text">Erro ao carregar</span>';
    mostrarToast('❌ Erro ao carregar a imagem', 'erro');
  };
  reader.readAsDataURL(file);
}
function carregarBanner(event) {
  var file = event.target.files[0];
  if (!file) return;
  var wrap = document.getElementById('banner-preview-wrap');
  wrap.innerHTML = '<div class="img-loading"><div class="img-spinner"></div><span>Carregando banner…</span></div>';
  var reader = new FileReader();
  reader.onload = function(e) {
    fotoBanner = e.target.result;
    wrap.innerHTML = '<img src="' + fotoBanner + '" alt="Banner" style="width:100%;height:100%;object-fit:cover;border-radius:8px"/>';
    document.getElementById('btn-remover-banner').style.display = 'inline-flex';
    mostrarToast('✅ Banner carregado!');
    atualizarPreview();
  };
  reader.onerror = function() {
    wrap.innerHTML = '<span class="upload-placeholder-icon">⚠️</span><span class="upload-placeholder-text">Erro ao carregar</span>';
    mostrarToast('❌ Erro ao carregar o banner', 'erro');
  };
  reader.readAsDataURL(file);
}
function removerFoto(tipo, event) {
  event.stopPropagation();
  if (tipo === 'perfil') {
    fotoPerfil = null;
    document.getElementById('perfil-preview').innerHTML =
      '<span class="upload-placeholder-icon">📷</span><span class="upload-placeholder-text">Clique para adicionar foto</span>';
    document.getElementById('btn-remover-perfil').style.display = 'none';
    document.getElementById('campo-avatar-emoji').style.opacity = '1';
    document.getElementById('upload-perfil').value = '';
  } else {
    fotoBanner = null;
    document.getElementById('banner-preview-wrap').innerHTML =
      '<span class="upload-placeholder-icon">🖼️</span><span class="upload-placeholder-text">Clique para adicionar banner</span>';
    document.getElementById('btn-remover-banner').style.display = 'none';
    document.getElementById('upload-banner').value = '';
  }
  atualizarPreview();
}

/* ─── SKILLS ───────────────────────────────────────────────── */
function addSkill() {
  var input = document.getElementById('skill-input');
  var val = input.value.trim();
  if (!val) return;
  val.split(',').map(function(s) { return s.trim(); }).filter(Boolean).forEach(function(s) {
    if (!skills.includes(s)) skills.push(s);
  });
  input.value = '';
  renderSkills();
  atualizarPreview();
}
function removeSkill(i) { skills.splice(i, 1); renderSkills(); atualizarPreview(); }
function renderSkills() {
  document.getElementById('skills-lista').innerHTML = skills.map(function(s, i) {
    return '<span class="skill-tag">' + s + '<button onclick="removeSkill(' + i + ')">✕</button></span>';
  }).join('');
}


/* ─── GEMINI ───────────────────────────────────────────────── */
async function chamarGemini(prompt, maxTokens) {
  if (!maxTokens) maxTokens = 150;
  var res = await fetchComTimeout(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:.8,maxOutputTokens:maxTokens} })
  }, 5000); // timeout de 5 segundos
  if (!res.ok) throw new Error('HTTP ' + res.status);
  var data = await res.json();
  var c = data.candidates;
  return (c && c[0] && c[0].content && c[0].content.parts && c[0].content.parts[0] && c[0].content.parts[0].text)
    ? c[0].content.parts[0].text.trim() : '';
}
async function gerarBioIA() {
  var nome = document.getElementById('f-nome').value.trim() || 'Profissional';
  var prof = document.getElementById('f-profissao').value.trim() || 'Profissional';
  var sk   = skills.join(', ') || prof;
  var btn  = document.getElementById('btn-ia-bio');
  btn.innerHTML = '<span class="btn-spinner"></span> Gerando…'; btn.disabled = true;
  try {
    var bio = await chamarGemini('Escreva uma bio profissional para o portfólio de ' + nome +
      ', que é ' + prof + '. Habilidades: ' + sk +
      '. Máx 3 frases, tom confiante adequado para ' + prof + '. Em português. Sem aspas.', 180);
    if (bio) {
      document.getElementById('f-bio').value = bio;
      mostrarToast('✅ Bio gerada com sucesso!');
      atualizarPreview();
    } else {
      throw new Error('Resposta vazia');
    }
  } catch(e) {
    // Fallback local: bio padrão profissional
    document.getElementById('f-bio').value = 'Sou ' + nome + ', ' + prof + ' apaixonado(a) por inovação e resultados. Com experiência em ' + sk + ', busco sempre entregar soluções de qualidade e impacto.';
    mostrarToast('⚠️ IA indisponível — bio padrão aplicada', 'aviso');
    atualizarPreview();
  }
  btn.innerHTML = '✨ Gerar Bio com IA'; btn.disabled = false;
}
async function gerarTituloIA() {
  var prof = document.getElementById('f-profissao').value.trim();
  if (!prof) { mostrarToast('⚠️ Preencha a profissão primeiro', 'aviso'); return; }
  var input = document.getElementById('f-profissao');
  var btnEl = document.querySelector('[onclick="gerarTituloIA()"]');
  if (btnEl) { btnEl.innerHTML = '<span class="btn-spinner"></span> Melhorando…'; btnEl.disabled = true; }
  input.disabled = true;
  try {
    var r = await chamarGemini('Reescreva este título de forma impactante para portfólio de ' + prof +
      ': "' + prof + '". Retorne APENAS o título, sem aspas, máx 6 palavras, em português.', 30);
    if (r) {
      input.value = r.replace(/^["']|["']$/g,'');
      mostrarToast('✅ Título melhorado!');
      atualizarPreview();
    } else {
      throw new Error('Resposta vazia');
    }
  } catch(e) {
    // Fallback: manter o título atual sem alteração
    mostrarToast('⚠️ IA indisponível — título mantido', 'aviso');
  }
  input.disabled = false;
  if (btnEl) { btnEl.innerHTML = '✨ Melhorar com IA'; btnEl.disabled = false; }
}
async function sugerirSkillsIA() {
  var prof = document.getElementById('f-profissao').value.trim() || 'Profissional';
  var btn  = document.querySelector('[onclick="sugerirSkillsIA()"]');
  btn.innerHTML = '<span class="btn-spinner"></span> Sugerindo…'; btn.disabled = true;

  // Skills fallback por área
  var skillsFallback = {
    'default':         ['HTML','CSS','JavaScript','Git','Comunicação','Trabalho em equipe','Resolução de problemas','Inglês'],
    'desenvolvedor':   ['JavaScript','TypeScript','React','Node.js','Git','SQL','APIs REST','Docker'],
    'designer':        ['Figma','Adobe XD','Photoshop','Illustrator','UI/UX','Prototipagem','Design System','CSS'],
    'analista':        ['Excel','Power BI','SQL','Python','Análise de dados','Tableau','Estatística','Relatórios'],
    'gestor':          ['Gestão de projetos','Scrum','Agile','Liderança','Excel','Comunicação','Negociação','OKRs'],
  };

  try {
    var r = await chamarGemini('Liste 8 habilidades essenciais para um ' + prof +
      '. Retorne APENAS os nomes separados por vírgula, sem explicações.', 100);
    if (r) {
      var adicionadas = 0;
      r.split(',').map(function(s){return s.trim();}).filter(Boolean).forEach(function(s){
        if (!skills.includes(s)) { skills.push(s); adicionadas++; }
      });
      renderSkills(); atualizarPreview();
      mostrarToast('✅ ' + adicionadas + ' skills adicionadas!');
    } else {
      throw new Error('Resposta vazia');
    }
  } catch(e) {
    // Fallback local: adicionar skills padrão baseadas no título
    var profLower = prof.toLowerCase();
    var chave = Object.keys(skillsFallback).find(function(k) { return profLower.includes(k); }) || 'default';
    var lista = skillsFallback[chave];
    var adicionadas = 0;
    lista.forEach(function(s) { if (!skills.includes(s)) { skills.push(s); adicionadas++; } });
    renderSkills(); atualizarPreview();
    mostrarToast('⚠️ IA indisponível — ' + adicionadas + ' skills padrão adicionadas', 'aviso');
  }
  btn.innerHTML = '✨ Sugerir Skills com IA'; btn.disabled = false;
}
async function gerarDescProjetoIA() {
  var nome = document.getElementById('mp-nome').value.trim();
  var tech = document.getElementById('mp-techs').value.trim();
  var prof = document.getElementById('f-profissao').value.trim() || 'profissional';
  if (!nome) { mostrarToast('⚠️ Preencha o nome do projeto', 'aviso'); return; }
  var btn = document.querySelector('[onclick="gerarDescProjetoIA()"]');
  btn.innerHTML = '<span class="btn-spinner"></span> Gerando…'; btn.disabled = true;
  try {
    var r = await chamarGemini('Descrição atraente para projeto "' + nome + '"' +
      (tech ? ' feito com ' + tech : '') + ' por um ' + prof +
      '. Máx 2 frases. Em português. Sem aspas.', 120);
    if (r) {
      document.getElementById('mp-desc').value = r;
      mostrarToast('✅ Descrição gerada!');
    } else {
      throw new Error('Resposta vazia');
    }
  } catch(e) {
    // Fallback: descrição padrão baseada no nome e tecnologias
    var descFallback = 'Projeto ' + nome + (tech ? ' desenvolvido com ' + tech : '') + '. Solução criada para demonstrar habilidades técnicas e resolução de problemas reais.';
    document.getElementById('mp-desc').value = descFallback;
    mostrarToast('⚠️ IA indisponível — descrição padrão aplicada', 'aviso');
  }
  btn.innerHTML = '✨ Gerar descrição com IA'; btn.disabled = false;
}

/* ─── TOAST / NOTIFICAÇÃO ──────────────────────────────────── */
function mostrarToast(msg, tipo) {
  var old = document.getElementById('sitegen-toast');
  if (old) old.remove();
  var toast = document.createElement('div');
  toast.id = 'sitegen-toast';
  var cor = tipo === 'erro' ? '#ef4444' : tipo === 'aviso' ? '#f59e0b' : '#22c55e';
  toast.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;background:'+cor+
    ';color:#fff;padding:.65rem 1.1rem;border-radius:10px;font-size:.83rem;font-weight:600;'+
    'box-shadow:0 4px 20px rgba(0,0,0,.35);display:flex;align-items:center;gap:.5rem;'+
    'animation:toastIn .25s ease;max-width:320px;line-height:1.4';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function() {
    toast.style.animation = 'toastOut .3s ease forwards';
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
  }, 3000);
}

/* ─── MODAIS ───────────────────────────────────────────────── */
function abrirModal(id) { document.getElementById(id).classList.remove('hidden'); }
function fecharModal(id) { document.getElementById(id).classList.add('hidden'); }
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.add('hidden');
});

/* PROJETO */
function abrirModalProjeto(i) {
  if (i === undefined) i = -1;
  editandoProjeto = i;
  var p = i >= 0 ? projetos[i] : null;
  document.getElementById('mp-nome').value   = p ? p.nome   : '';
  document.getElementById('mp-desc').value   = p ? p.desc   : '';
  document.getElementById('mp-url').value    = p ? p.url    : '';
  document.getElementById('mp-img').value    = p ? p.img    : '';
  document.getElementById('mp-techs').value  = p ? p.techs  : '';
  document.getElementById('mp-status').value = p ? p.status : 'concluido';
  previewImgProjeto();
  document.querySelector('#modal-projeto .modal-header h3').textContent = i>=0 ? '📁 Editar Projeto'   : '📁 Adicionar Projeto';
  document.querySelector('#modal-projeto .btn-confirmar').textContent   = i>=0 ? 'Salvar Alterações' : 'Adicionar Projeto';
  abrirModal('modal-projeto');
}
function previewImgProjeto() {
  var url = document.getElementById('mp-img').value.trim();
  var w   = document.getElementById('img-projeto-preview');
  var im  = document.getElementById('img-projeto-preview-img');
  if (url) { w.style.display='block'; im.src=url; } else { w.style.display='none'; }
}
function salvarProjeto() {
  var nome = document.getElementById('mp-nome').value.trim();
  if (!nome) { document.getElementById('mp-nome').focus(); return; }
  var p = { nome:nome, desc:document.getElementById('mp-desc').value.trim(),
    url:document.getElementById('mp-url').value.trim(), img:document.getElementById('mp-img').value.trim(),
    techs:document.getElementById('mp-techs').value.trim(), status:document.getElementById('mp-status').value };
  if (editandoProjeto>=0) projetos[editandoProjeto]=p; else projetos.push(p);
  fecharModal('modal-projeto'); renderProjetosEditor(); atualizarPreview();
}
function removerProjeto(i) { projetos.splice(i,1); renderProjetosEditor(); atualizarPreview(); }
var statusLabel = { concluido:'✅ Concluído', desenvolvimento:'🔧 Em Dev', opensource:'🌐 Open Source' };
function renderProjetosEditor() {
  var el = document.getElementById('projetos-lista-editor');
  if (!projetos.length) { el.innerHTML='<p class="lista-vazia">Nenhum projeto adicionado</p>'; return; }
  el.innerHTML = projetos.map(function(p,i) {
    return '<div class="bloco-item"><div class="bloco-info"><strong>'+p.nome+'</strong>'+
      '<span class="bloco-sub">'+(statusLabel[p.status]||'')+(p.techs?' · '+p.techs:'')+'</span></div>'+
      '<div class="bloco-acoes"><button onclick="abrirModalProjeto('+i+')">✏️</button>'+
      '<button onclick="removerProjeto('+i+')">🗑️</button></div></div>';
  }).join('');
}

/* EXPERIÊNCIA */
function abrirModalExperiencia(i) {
  if (i === undefined) i = -1;
  editandoExperiencia = i;
  var ex = i>=0 ? experiencias[i] : null;
  document.getElementById('me-empresa').value = ex ? ex.empresa : '';
  document.getElementById('me-cargo').value   = ex ? ex.cargo   : '';
  document.getElementById('me-inicio').value  = ex ? ex.inicio  : '';
  document.getElementById('me-fim').value     = ex ? ex.fim     : '';
  document.getElementById('me-desc').value    = ex ? ex.desc    : '';
  document.querySelector('#modal-experiencia .modal-header h3').textContent = i>=0 ? '🏆 Editar Experiência'   : '🏆 Adicionar Experiência';
  document.querySelector('#modal-experiencia .btn-confirmar').textContent   = i>=0 ? 'Salvar Alterações' : 'Adicionar Experiência';
  abrirModal('modal-experiencia');
}
function salvarExperiencia() {
  var empresa = document.getElementById('me-empresa').value.trim();
  var cargo   = document.getElementById('me-cargo').value.trim();
  if (!empresa || !cargo) return;
  var ex = { empresa:empresa, cargo:cargo,
    inicio:document.getElementById('me-inicio').value.trim(),
    fim:document.getElementById('me-fim').value.trim(),
    desc:document.getElementById('me-desc').value.trim() };
  if (editandoExperiencia>=0) experiencias[editandoExperiencia]=ex; else experiencias.push(ex);
  fecharModal('modal-experiencia'); renderExperienciasEditor(); atualizarPreview();
}
function removerExperiencia(i) { experiencias.splice(i,1); renderExperienciasEditor(); atualizarPreview(); }
function renderExperienciasEditor() {
  var el = document.getElementById('experiencias-lista-editor');
  if (!experiencias.length) { el.innerHTML='<p class="lista-vazia">Nenhuma experiência adicionada</p>'; return; }
  el.innerHTML = experiencias.map(function(ex,i) {
    return '<div class="bloco-item"><div class="bloco-info"><strong>'+ex.cargo+'</strong>'+
      '<span class="bloco-sub">'+ex.empresa+(ex.inicio?' · '+ex.inicio:'')+(ex.fim?' → '+ex.fim:'')+'</span></div>'+
      '<div class="bloco-acoes"><button onclick="abrirModalExperiencia('+i+')">✏️</button>'+
      '<button onclick="removerExperiencia('+i+')">🗑️</button></div></div>';
  }).join('');
}

/* FORMAÇÃO */
function abrirModalFormacao(i) {
  if (i === undefined) i = -1;
  editandoFormacao = i;
  var f = i>=0 ? formacoes[i] : null;
  document.getElementById('mf-instituicao').value = f ? f.instituicao : '';
  document.getElementById('mf-curso').value       = f ? f.curso       : '';
  document.getElementById('mf-inicio').value      = f ? f.inicio      : '';
  document.getElementById('mf-fim').value         = f ? f.fim         : '';
  document.querySelector('#modal-formacao .modal-header h3').textContent = i>=0 ? '🎓 Editar Formação'   : '🎓 Adicionar Formação';
  document.querySelector('#modal-formacao .btn-confirmar').textContent   = i>=0 ? 'Salvar Alterações' : 'Adicionar Formação';
  abrirModal('modal-formacao');
}
function salvarFormacao() {
  var inst  = document.getElementById('mf-instituicao').value.trim();
  var curso = document.getElementById('mf-curso').value.trim();
  if (!inst || !curso) return;
  var f = { instituicao:inst, curso:curso,
    inicio:document.getElementById('mf-inicio').value.trim(),
    fim:document.getElementById('mf-fim').value.trim() };
  if (editandoFormacao>=0) formacoes[editandoFormacao]=f; else formacoes.push(f);
  fecharModal('modal-formacao'); renderFormacoesEditor(); atualizarPreview();
}
function removerFormacao(i) { formacoes.splice(i,1); renderFormacoesEditor(); atualizarPreview(); }
function renderFormacoesEditor() {
  var el = document.getElementById('formacoes-lista-editor');
  if (!formacoes.length) { el.innerHTML='<p class="lista-vazia">Nenhuma formação adicionada</p>'; return; }
  el.innerHTML = formacoes.map(function(f,i) {
    return '<div class="bloco-item"><div class="bloco-info"><strong>'+f.curso+'</strong>'+
      '<span class="bloco-sub">'+f.instituicao+(f.inicio?' · '+f.inicio:'')+(f.fim?' → '+f.fim:'')+'</span></div>'+
      '<div class="bloco-acoes"><button onclick="abrirModalFormacao('+i+')">✏️</button>'+
      '<button onclick="removerFormacao('+i+')">🗑️</button></div></div>';
  }).join('');
}


/* ─── HELPERS HTML ─────────────────────────────────────────── */
function secAtiva(id) { var el=document.getElementById(id); return el ? el.checked : true; }
function coletarDados() {
  return {
    nome:      document.getElementById('f-nome').value      || 'Seu Nome',
    profissao: document.getElementById('f-profissao').value || 'Profissional',
    bio:       document.getElementById('f-bio').value       || 'Bem-vindo ao meu portfólio!',
    sobre:     document.getElementById('f-sobre').value     || '',
    email:     document.getElementById('f-email').value     || '',
    github:    document.getElementById('f-github').value    || '',
    instagram: document.getElementById('f-instagram').value || '',
    linkedin:  document.getElementById('f-linkedin').value  || '',
  };
}
function mkFontLink() {
  return '<link rel="preconnect" href="https://fonts.googleapis.com"/>' +
    '<link href="https://fonts.googleapis.com/css2?family=' + fonte.replace(/ /g,'+') +
    ':wght@400;500;600;700;800&display=swap" rel="stylesheet"/>';
}
function mkAvatar(t, nome, size) {
  if (!size) size = 110;
  if (fotoPerfil)
    return '<img src="'+fotoPerfil+'" alt="'+nome+'" style="width:'+size+'px;height:'+size+'px;border-radius:50%;object-fit:cover;border:3px solid '+t.accent+'"/>';
  return '<div style="font-size:'+Math.round(size*.65)+'px;line-height:1">'+avatar+'</div>';
}
function mkRedes(d, t, pill) {
  var s = pill
    ? 'color:'+t.accent+';text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:.3rem;padding:.4rem .9rem;border:1px solid '+t.accent+'44;border-radius:20px;font-size:.82rem;background:'+t.accent+'11'
    : 'color:'+t.accent+';text-decoration:none;font-weight:600;font-size:.85rem';
  var r=[];
  if (d.github)    r.push('<a href="https://github.com/'+d.github+'" target="_blank" style="'+s+'">🐙 GitHub</a>');
  if (d.instagram) r.push('<a href="https://instagram.com/'+d.instagram.replace('@','')+'" target="_blank" style="'+s+'">📸 Instagram</a>');
  if (d.linkedin)  r.push('<a href="https://linkedin.com/in/'+d.linkedin+'" target="_blank" style="'+s+'">💼 LinkedIn</a>');
  return r.join('');
}
function mkProjetosCards(t, cols) {
  if (!secAtiva('sec-projetos')) return '';
  if (!cols) cols = 'repeat(auto-fill,minmax(240px,1fr))';
  var ico={concluido:'✅',desenvolvimento:'🔧',opensource:'🌐'};
  var cards = !projetos.length
    ? '<p style="color:'+t.sub+';font-size:.88rem">Nenhum projeto adicionado ainda.</p>'
    : projetos.map(function(p) {
        var tags = p.techs ? p.techs.split(',').map(function(tk){
          return '<span style="background:'+t.borda+';color:'+t.sub+';padding:2px 8px;border-radius:4px;font-size:.73rem">'+tk.trim()+'</span>';
        }).join('') : '';
        var thumb = p.img
          ? '<img src="'+p.img+'" alt="'+p.nome+'" style="width:100%;height:150px;object-fit:cover"/>'
          : '<div style="width:100%;height:72px;background:linear-gradient(135deg,'+t.borda+','+t.accent+'33);display:flex;align-items:center;justify-content:center;font-size:1.8rem">📁</div>';
        return '<div style="background:'+t.bg+';border:1px solid '+t.borda+';border-radius:12px;overflow:hidden;display:flex;flex-direction:column">'+
          thumb+'<div style="padding:.9rem;flex:1;display:flex;flex-direction:column;gap:.4rem">'+
          '<div style="display:flex;align-items:center;gap:.4rem"><span>'+(ico[p.status]||'📁')+'</span>'+
          '<h4 style="color:'+t.accent+';font-size:.9rem;font-weight:700;flex:1;margin:0">'+p.nome+'</h4></div>'+
          (p.desc?'<p style="color:'+t.sub+';font-size:.81rem;line-height:1.5;flex:1;margin:0">'+p.desc+'</p>':'')+
          (tags?'<div style="display:flex;flex-wrap:wrap;gap:.2rem">'+tags+'</div>':'')+
          (p.url?'<a href="'+p.url+'" target="_blank" style="color:'+t.accent+';font-size:.8rem;font-weight:600;text-decoration:none">🔗 Ver projeto →</a>':'')+
          '</div></div>';
      }).join('');
  return '<div style="display:grid;grid-template-columns:'+cols+';gap:1rem">'+cards+'</div>';
}
function mkExpTimeline(t) {
  if (!secAtiva('sec-experiencia')||!experiencias.length) return '';
  return experiencias.map(function(ex,i){
    return '<div style="padding-left:1.1rem;border-left:2px solid '+t.accent+';margin-left:.4rem;padding-bottom:'+(i<experiencias.length-1?'1.4rem':'0')+'">'+
      '<h4 style="color:'+t.texto+';font-weight:700;font-size:.92rem;margin:0 0 .15rem">'+ex.cargo+'</h4>'+
      '<p style="color:'+t.accent+';font-size:.82rem;font-weight:600;margin:0 0 .15rem">'+ex.empresa+'</p>'+
      ((ex.inicio||ex.fim)?'<p style="color:'+t.sub+';font-size:.78rem;margin:0 0 .3rem">'+(ex.inicio||'')+(ex.fim?' → '+ex.fim:'')+'</p>':'')+
      (ex.desc?'<p style="color:'+t.sub+';font-size:.83rem;line-height:1.6;margin:0">'+ex.desc+'</p>':'')+
      '</div>';
  }).join('');
}
function mkFormGrid(t) {
  if (!secAtiva('sec-formacao')||!formacoes.length) return '';
  return formacoes.map(function(f){
    return '<div style="display:flex;gap:.65rem;padding:.7rem;background:'+t.bg+';border-radius:10px;border:1px solid '+t.borda+'">'+
      '<span style="font-size:1.4rem">🎓</span><div>'+
      '<h4 style="color:'+t.texto+';font-weight:700;font-size:.87rem;margin:0 0 .1rem">'+f.curso+'</h4>'+
      '<p style="color:'+t.accent+';font-size:.8rem;margin:0">'+f.instituicao+'</p>'+
      ((f.inicio||f.fim)?'<p style="color:'+t.sub+';font-size:.76rem;margin:0">'+(f.inicio||'')+(f.fim?' → '+f.fim:'')+'</p>':'')+
      '</div></div>';
  }).join('');
}

/* ─── DISPATCHER ───────────────────────────────────────────── */
function gerarHTMLSite() {
  var d = coletarDados();
  var t = temas[tema] || temas['dark-azul'];
  if (template==='sidebar')  return tplSidebar(d,t);
  if (template==='landing')  return tplLanding(d,t);
  if (template==='cardgrid') return tplCardGrid(d,t);
  if (template==='terminal') return tplTerminal(d,t);
  return tplClassic(d,t);
}


/* ─── TEMPLATE 1: CLASSIC ──────────────────────────────────── */
function tplClassic(d,t) {
  var bg = fotoBanner ? 'background:url(\''+fotoBanner+'\') center/cover no-repeat' : 'background:'+t.gradHero;
  var ov = fotoBanner ? '<div style="position:absolute;inset:0;background:linear-gradient(to bottom,'+t.bg+'44,'+t.bg+')"></div>' : '';
  var redes = mkRedes(d,t,true);
  var P='1.6rem', G='1.5rem';

  var sobre = secAtiva('sec-sobre')&&d.sobre
    ? '<div style="background:'+t.card+';border-radius:16px;border:1px solid '+t.borda+';padding:'+P+';margin-bottom:'+G+'">'+
      '<h2 style="font-size:1rem;font-weight:700;color:'+t.texto+';margin:0 0 .9rem">📝 Sobre mim</h2>'+
      '<p style="color:'+t.sub+';line-height:1.8;font-size:.93rem;margin:0;white-space:pre-line">'+d.sobre+'</p></div>' : '';

  var skills_ = secAtiva('sec-skills')&&skills.length
    ? '<div style="background:'+t.card+';border-radius:16px;border:1px solid '+t.borda+';padding:'+P+';margin-bottom:'+G+'">'+
      '<h2 style="font-size:1rem;font-weight:700;color:'+t.texto+';margin:0 0 .9rem">🛠️ Habilidades</h2>'+
      '<div style="display:flex;flex-wrap:wrap;gap:.45rem">'+
      skills.map(function(s){ return '<span style="background:'+t.accent+'20;border:1px solid '+t.accent+'55;color:'+t.accent+';padding:5px 15px;border-radius:50px;font-size:.83rem;font-weight:500">'+s+'</span>'; }).join('')+
      '</div></div>' : '';

  var proj = secAtiva('sec-projetos')
    ? '<div style="background:'+t.card+';border-radius:16px;border:1px solid '+t.borda+';padding:'+P+';margin-bottom:'+G+'">'+
      '<h2 style="font-size:1rem;font-weight:700;color:'+t.texto+';margin:0 0 .9rem">📁 Projetos</h2>'+mkProjetosCards(t)+'</div>' : '';

  var exp = secAtiva('sec-experiencia')&&experiencias.length
    ? '<div style="background:'+t.card+';border-radius:16px;border:1px solid '+t.borda+';padding:'+P+';margin-bottom:'+G+'">'+
      '<h2 style="font-size:1rem;font-weight:700;color:'+t.texto+';margin:0 0 1rem">🏆 Experiência</h2>'+mkExpTimeline(t)+'</div>' : '';

  var form = secAtiva('sec-formacao')&&formacoes.length
    ? '<div style="background:'+t.card+';border-radius:16px;border:1px solid '+t.borda+';padding:'+P+';margin-bottom:'+G+'">'+
      '<h2 style="font-size:1rem;font-weight:700;color:'+t.texto+';margin:0 0 .9rem">🎓 Formação</h2>'+
      '<div style="display:flex;flex-direction:column;gap:.65rem">'+mkFormGrid(t)+'</div></div>' : '';

  var ctLinks=[];
  if(d.email)   ctLinks.push('<a href="mailto:'+d.email+'" style="color:'+t.accent+';text-decoration:none;font-weight:600;font-size:.88rem">✉️ '+d.email+'</a>');
  if(d.github)  ctLinks.push('<a href="https://github.com/'+d.github+'" target="_blank" style="color:'+t.accent+';text-decoration:none;font-weight:600;font-size:.88rem">🐙 github.com/'+d.github+'</a>');
  if(d.linkedin)ctLinks.push('<a href="https://linkedin.com/in/'+d.linkedin+'" target="_blank" style="color:'+t.accent+';text-decoration:none;font-weight:600;font-size:.88rem">💼 linkedin.com/in/'+d.linkedin+'</a>');
  var contato = secAtiva('sec-contato')&&ctLinks.length
    ? '<div style="background:'+t.card+';border-radius:16px;border:1px solid '+t.borda+';padding:'+P+';margin-bottom:'+G+';text-align:center">'+
      '<h2 style="font-size:1rem;font-weight:700;color:'+t.texto+';margin:0 0 .9rem">📬 Contato</h2>'+
      '<div style="display:flex;flex-direction:column;align-items:center;gap:.55rem">'+ctLinks.join('')+'</div></div>' : '';

  return mkFontLink()+
    '<div style="font-family:\''+fonte+'\',system-ui,sans-serif;background:'+t.bg+';min-height:100vh;color:'+t.texto+'">'+
    '<div style="'+bg+';min-height:300px;display:flex;align-items:flex-end;justify-content:center;padding:2rem 1rem 0;position:relative">'+ov+
    '<div style="position:relative;z-index:1;text-align:center;width:100%;max-width:720px">'+
    '<div style="margin-bottom:.75rem">'+mkAvatar(t,d.nome,120)+'</div>'+
    '<h1 style="font-size:2.5rem;font-weight:800;color:'+t.texto+';margin:0 0 .3rem;line-height:1.1">'+d.nome+'</h1>'+
    '<p style="color:'+t.accent+';font-size:1.1rem;font-weight:600;margin:0 0 .75rem">'+d.profissao+'</p>'+
    '<p style="color:'+t.sub+';font-size:.93rem;line-height:1.7;max-width:520px;margin:0 auto 1.25rem">'+d.bio+'</p>'+
    (redes?'<div style="display:flex;justify-content:center;gap:.6rem;flex-wrap:wrap;margin-bottom:2rem">'+redes+'</div>':'<div style="height:2rem"></div>')+
    '</div></div>'+
    '<div style="max-width:720px;margin:0 auto;padding:2rem 1rem 3rem">'+
    sobre+skills_+proj+exp+form+contato+
    '<div style="text-align:center;color:'+t.sub+';font-size:.76rem;padding-top:.5rem">Criado com 💙 <strong style="color:'+t.accent+'">SiteGen AI</strong></div>'+
    '</div></div>';
}

/* ─── TEMPLATE 2: SIDEBAR ──────────────────────────────────── */
function tplSidebar(d,t) {
  var pills = skills.map(function(s){
    return '<span style="display:block;padding:4px 10px;background:'+t.accent+'18;border-left:3px solid '+t.accent+';color:'+t.texto+';font-size:.78rem;border-radius:0 6px 6px 0;margin-bottom:.3rem">'+s+'</span>';
  }).join('');
  var soc=[];
  if(d.github)    soc.push('<a href="https://github.com/'+d.github+'" target="_blank" style="color:'+t.sub+';text-decoration:none;font-size:.8rem;display:flex;align-items:center;gap:.4rem;padding:.3rem 0;border-bottom:1px solid '+t.borda+'">🐙 '+d.github+'</a>');
  if(d.instagram) soc.push('<a href="https://instagram.com/'+d.instagram.replace('@','')+'" target="_blank" style="color:'+t.sub+';text-decoration:none;font-size:.8rem;display:flex;align-items:center;gap:.4rem;padding:.3rem 0;border-bottom:1px solid '+t.borda+'">📸 '+d.instagram+'</a>');
  if(d.linkedin)  soc.push('<a href="https://linkedin.com/in/'+d.linkedin+'" target="_blank" style="color:'+t.sub+';text-decoration:none;font-size:.8rem;display:flex;align-items:center;gap:.4rem;padding:.3rem 0">💼 '+d.linkedin+'</a>');
  if(d.email)     soc.push('<a href="mailto:'+d.email+'" style="color:'+t.sub+';text-decoration:none;font-size:.8rem;display:flex;align-items:center;gap:.4rem;padding:.3rem 0">✉️ '+d.email+'</a>');
  var lbl='font-size:.7rem;font-weight:700;color:'+t.sub+';text-transform:uppercase;letter-spacing:.07em;margin:0 0 .5rem;padding-bottom:.3rem;border-bottom:1px solid '+t.borda;
  var bnr = fotoBanner ? '<div style="background:url(\''+fotoBanner+'\') center/cover;height:180px;border-radius:14px;margin-bottom:2rem;border:1px solid '+t.borda+'"></div>' : '';

  var sec1 = secAtiva('sec-sobre')&&d.sobre ? '<div style="margin-bottom:1.75rem"><h2 style="'+lbl+'">Sobre mim</h2><p style="color:'+t.sub+';line-height:1.8;font-size:.9rem;margin:0;white-space:pre-line">'+d.sobre+'</p></div>' : '';
  var sec2 = secAtiva('sec-projetos') ? '<div style="margin-bottom:1.75rem"><h2 style="'+lbl+'">Projetos</h2>'+mkProjetosCards(t,'repeat(auto-fill,minmax(200px,1fr))')+'</div>' : '';
  var sec3 = secAtiva('sec-experiencia')&&experiencias.length ? '<div style="margin-bottom:1.75rem"><h2 style="'+lbl+'">Experiência</h2>'+mkExpTimeline(t)+'</div>' : '';
  var sec4 = secAtiva('sec-formacao')&&formacoes.length ? '<div style="margin-bottom:1.75rem"><h2 style="'+lbl+'">Formação</h2><div style="display:flex;flex-direction:column;gap:.55rem">'+mkFormGrid(t)+'</div></div>' : '';

  return mkFontLink()+
    '<div style="font-family:\''+fonte+'\',system-ui,sans-serif;background:'+t.bg+';min-height:100vh;color:'+t.texto+';display:flex">'+
    '<aside style="width:250px;min-width:250px;background:'+t.card+';border-right:1px solid '+t.borda+';padding:1.75rem 1.1rem;display:flex;flex-direction:column;gap:1rem;position:sticky;top:0;height:100vh;overflow-y:auto">'+
    '<div style="text-align:center">'+mkAvatar(t,d.nome,85)+
    '<h1 style="font-size:1.1rem;font-weight:800;color:'+t.texto+';margin:.65rem 0 .2rem">'+d.nome+'</h1>'+
    '<p style="color:'+t.accent+';font-size:.8rem;font-weight:600;margin:0 0 .65rem">'+d.profissao+'</p>'+
    '<p style="color:'+t.sub+';font-size:.76rem;line-height:1.6;margin:0">'+d.bio+'</p></div>'+
    (secAtiva('sec-skills')&&skills.length?'<div><p style="font-size:.7rem;font-weight:700;color:'+t.sub+';text-transform:uppercase;letter-spacing:.07em;margin:0 0 .5rem">Skills</p>'+pills+'</div>':'')+
    (soc.length?'<div>'+soc.join('')+'</div>':'')+
    '<div style="margin-top:auto;text-align:center;color:'+t.sub+';font-size:.7rem">💙 <strong style="color:'+t.accent+'">SiteGen AI</strong></div>'+
    '</aside>'+
    '<main style="flex:1;padding:2.25rem 1.75rem;overflow-y:auto">'+bnr+sec1+sec2+sec3+sec4+'</main></div>';
}


/* ─── TEMPLATE 3: LANDING ──────────────────────────────────── */
function tplLanding(d,t) {
  var heroBg = fotoBanner ? 'background:url(\''+fotoBanner+'\') center/cover no-repeat' : 'background:'+t.gradHero;
  var ov     = fotoBanner ? '<div style="position:absolute;inset:0;background:linear-gradient(to bottom,'+t.bg+'66,'+t.bg+'cc)"></div>' : '';
  var redes  = mkRedes(d,t,false);

  var nav='';
  if(secAtiva('sec-sobre')&&d.sobre)                   nav+='<a href="#sobre"    style="color:'+t.texto+';text-decoration:none;font-size:.83rem;font-weight:500;opacity:.8">Sobre</a>';
  if(secAtiva('sec-skills')&&skills.length)            nav+='<a href="#skills"   style="color:'+t.texto+';text-decoration:none;font-size:.83rem;font-weight:500;opacity:.8">Skills</a>';
  if(secAtiva('sec-projetos'))                         nav+='<a href="#projetos" style="color:'+t.texto+';text-decoration:none;font-size:.83rem;font-weight:500;opacity:.8">Projetos</a>';
  if(secAtiva('sec-experiencia')&&experiencias.length) nav+='<a href="#exp"      style="color:'+t.texto+';text-decoration:none;font-size:.83rem;font-weight:500;opacity:.8">Experiência</a>';
  if(secAtiva('sec-contato'))                          nav+='<a href="#contato"  style="color:'+t.texto+';text-decoration:none;font-size:.83rem;font-weight:500;opacity:.8">Contato</a>';

  var s1='';
  if(secAtiva('sec-sobre')&&d.sobre)
    s1='<section id="sobre" style="padding:5rem 1rem;background:'+t.card+'">'+
       '<div style="max-width:760px;margin:0 auto;display:grid;grid-template-columns:1fr 2fr;gap:2.5rem;align-items:center">'+
       '<div style="text-align:center">'+mkAvatar(t,d.nome,130)+'</div>'+
       '<div><h2 style="font-size:1.6rem;font-weight:800;color:'+t.texto+';margin:0 0 1rem">Sobre mim</h2>'+
       '<p style="color:'+t.sub+';line-height:1.8;font-size:.95rem;white-space:pre-line;margin:0">'+d.sobre+'</p></div>'+
       '</div></section>';

  var s2='';
  if(secAtiva('sec-skills')&&skills.length)
    s2='<section id="skills" style="padding:5rem 1rem;background:'+t.bg+'">'+
       '<div style="max-width:760px;margin:0 auto">'+
       '<h2 style="font-size:1.6rem;font-weight:800;color:'+t.texto+';margin:0 0 .5rem;text-align:center">Habilidades</h2>'+
       '<p style="color:'+t.sub+';text-align:center;margin:0 0 2rem;font-size:.9rem">O que eu trago para o projeto</p>'+
       '<div style="display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center">'+
       skills.map(function(s){ return '<span style="background:'+t.accent+'22;border:1px solid '+t.accent+'55;color:'+t.accent+';padding:7px 20px;border-radius:50px;font-size:.88rem;font-weight:600">'+s+'</span>'; }).join('')+
       '</div></div></section>';

  var s3='';
  if(secAtiva('sec-projetos'))
    s3='<section id="projetos" style="padding:5rem 1rem;background:'+t.card+'">'+
       '<div style="max-width:900px;margin:0 auto">'+
       '<h2 style="font-size:1.6rem;font-weight:800;color:'+t.texto+';margin:0 0 .5rem;text-align:center">Projetos</h2>'+
       '<p style="color:'+t.sub+';text-align:center;margin:0 0 2rem;font-size:.9rem">Trabalhos selecionados</p>'+
       mkProjetosCards(t,'repeat(auto-fill,minmax(260px,1fr))')+'</div></section>';

  var expHtml=mkExpTimeline(t);
  var formHtml='';
  if(secAtiva('sec-formacao')&&formacoes.length)
    formHtml='<div style="margin-top:2.5rem"><h3 style="font-size:1.2rem;font-weight:700;color:'+t.texto+';margin:0 0 1.25rem">Formação</h3>'+
              '<div style="display:flex;flex-direction:column;gap:.65rem">'+mkFormGrid(t)+'</div></div>';
  var s4='';
  if(expHtml||formHtml)
    s4='<section id="exp" style="padding:5rem 1rem;background:'+t.bg+'">'+
       '<div style="max-width:680px;margin:0 auto">'+
       (expHtml?'<h2 style="font-size:1.6rem;font-weight:800;color:'+t.texto+';margin:0 0 2rem;text-align:center">Experiência</h2>'+expHtml:'')+
       formHtml+'</div></section>';

  var cta=[];
  if(d.email)    cta.push('<a href="mailto:'+d.email+'" style="display:inline-flex;align-items:center;gap:.5rem;padding:.7rem 1.5rem;background:'+t.accent+';color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:.88rem">✉️ Enviar email</a>');
  if(d.github)   cta.push('<a href="https://github.com/'+d.github+'" target="_blank" style="display:inline-flex;align-items:center;gap:.5rem;padding:.7rem 1.5rem;border:1px solid '+t.accent+';color:'+t.accent+';text-decoration:none;border-radius:8px;font-weight:600;font-size:.88rem">🐙 GitHub</a>');
  if(d.linkedin) cta.push('<a href="https://linkedin.com/in/'+d.linkedin+'" target="_blank" style="display:inline-flex;align-items:center;gap:.5rem;padding:.7rem 1.5rem;border:1px solid '+t.accent+';color:'+t.accent+';text-decoration:none;border-radius:8px;font-weight:600;font-size:.88rem">💼 LinkedIn</a>');
  var s5='';
  if(secAtiva('sec-contato')&&cta.length)
    s5='<section id="contato" style="padding:5rem 1rem;background:'+t.card+';text-align:center">'+
       '<h2 style="font-size:1.6rem;font-weight:800;color:'+t.texto+';margin:0 0 .5rem">Vamos conversar?</h2>'+
       '<p style="color:'+t.sub+';margin:0 0 2rem;font-size:.93rem">Aberto a oportunidades e colaborações</p>'+
       '<div style="display:flex;justify-content:center;gap:.75rem;flex-wrap:wrap">'+cta.join('')+'</div></section>';

  return mkFontLink()+
    '<div style="font-family:\''+fonte+'\',system-ui,sans-serif;background:'+t.bg+';color:'+t.texto+'">'+
    '<nav style="position:sticky;top:0;z-index:100;background:'+t.bg+'dd;backdrop-filter:blur(12px);border-bottom:1px solid '+t.borda+';padding:.65rem 2rem;display:flex;align-items:center;justify-content:space-between">'+
    '<span style="font-weight:800;color:'+t.accent+';font-size:.95rem">'+d.nome+'</span>'+
    '<div style="display:flex;gap:1.5rem">'+nav+'</div></nav>'+
    '<section style="'+heroBg+';min-height:92vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:3rem 1rem;position:relative">'+ov+
    '<div style="position:relative;z-index:1;max-width:680px">'+
    '<div style="margin-bottom:1.25rem">'+mkAvatar(t,d.nome,100)+'</div>'+
    '<h1 style="font-size:3rem;font-weight:800;color:'+t.texto+';margin:0 0 .5rem;line-height:1.1">'+d.nome+'</h1>'+
    '<p style="color:'+t.accent+';font-size:1.2rem;font-weight:700;margin:0 0 1.25rem">'+d.profissao+'</p>'+
    '<p style="color:'+t.sub+';font-size:1rem;line-height:1.7;max-width:520px;margin:0 auto 2rem">'+d.bio+'</p>'+
    (redes?'<div style="display:flex;justify-content:center;gap:.75rem;flex-wrap:wrap">'+redes+'</div>':'')+
    '</div></section>'+s1+s2+s3+s4+s5+
    '<footer style="text-align:center;padding:1.5rem;background:'+t.bg+';color:'+t.sub+';font-size:.76rem;border-top:1px solid '+t.borda+'">Criado com 💙 <strong style="color:'+t.accent+'">SiteGen AI</strong></footer>'+
    '</div>';
}

/* ─── TEMPLATE 4: CARD GRID ────────────────────────────────── */
function tplCardGrid(d,t) {
  var lbl='font-size:.78rem;font-weight:700;color:'+t.sub+';text-transform:uppercase;letter-spacing:.08em;margin:0 0 .75rem';
  var badges=skills.slice(0,14).map(function(s){ return '<span style="background:'+t.accent+'20;border:1px solid '+t.accent+'44;color:'+t.accent+';padding:4px 12px;border-radius:6px;font-size:.78rem;font-weight:500">'+s+'</span>'; }).join('');
  var soc=[];
  if(d.github)    soc.push('<a href="https://github.com/'+d.github+'" target="_blank" style="display:flex;align-items:center;gap:.5rem;color:'+t.texto+';text-decoration:none;padding:.5rem .75rem;border-radius:8px;background:'+t.bg+';border:1px solid '+t.borda+';font-size:.82rem">🐙 GitHub</a>');
  if(d.instagram) soc.push('<a href="https://instagram.com/'+d.instagram.replace('@','')+'" target="_blank" style="display:flex;align-items:center;gap:.5rem;color:'+t.texto+';text-decoration:none;padding:.5rem .75rem;border-radius:8px;background:'+t.bg+';border:1px solid '+t.borda+';font-size:.82rem">📸 Instagram</a>');
  if(d.linkedin)  soc.push('<a href="https://linkedin.com/in/'+d.linkedin+'" target="_blank" style="display:flex;align-items:center;gap:.5rem;color:'+t.texto+';text-decoration:none;padding:.5rem .75rem;border-radius:8px;background:'+t.bg+';border:1px solid '+t.borda+';font-size:.82rem">💼 LinkedIn</a>');
  if(d.email)     soc.push('<a href="mailto:'+d.email+'" style="display:flex;align-items:center;gap:.5rem;color:'+t.texto+';text-decoration:none;padding:.5rem .75rem;border-radius:8px;background:'+t.bg+';border:1px solid '+t.borda+';font-size:.82rem">✉️ Email</a>');

  var bnr=fotoBanner
    ? '<div style="background:url(\''+fotoBanner+'\') center/cover;height:160px;border-radius:12px;border:1px solid '+t.borda+'"></div>'
    : '<div style="background:'+t.gradHero+';height:160px;border-radius:12px;border:1px solid '+t.borda+';display:flex;align-items:center;justify-content:center"><span style="font-size:3.5rem;opacity:.2">✦</span></div>';

  var skCard=secAtiva('sec-skills')&&skills.length
    ? '<div style="background:'+t.card+';border:1px solid '+t.borda+';border-radius:14px;padding:1.3rem;flex:1">'+
      '<h3 style="'+lbl+'">🛠️ Skills</h3><div style="display:flex;flex-wrap:wrap;gap:.35rem">'+badges+'</div></div>' : '';
  var socCard=soc.length
    ? '<div style="background:'+t.card+';border:1px solid '+t.borda+';border-radius:14px;padding:1.3rem">'+
      '<h3 style="'+lbl+'">🔗 Contato</h3><div style="display:flex;flex-direction:column;gap:.4rem">'+soc.join('')+'</div></div>' : '';
  var projCard=secAtiva('sec-projetos')
    ? '<div style="background:'+t.card+';border:1px solid '+t.borda+';border-radius:16px;padding:1.4rem">'+
      '<h3 style="'+lbl+'">📁 Projetos</h3>'+mkProjetosCards(t,'repeat(auto-fill,minmax(220px,1fr))')+'</div>' : '';
  var sobreCard=secAtiva('sec-sobre')&&d.sobre
    ? '<div style="background:'+t.card+';border:1px solid '+t.borda+';border-radius:14px;padding:1.3rem">'+
      '<h3 style="'+lbl+'">📝 Sobre</h3><p style="color:'+t.sub+';font-size:.87rem;line-height:1.7;margin:0;white-space:pre-line">'+d.sobre+'</p></div>' : '';
  var expCard=secAtiva('sec-experiencia')&&experiencias.length
    ? '<div style="background:'+t.card+';border:1px solid '+t.borda+';border-radius:14px;padding:1.3rem">'+
      '<h3 style="'+lbl+'">🏆 Experiência</h3>'+mkExpTimeline(t)+'</div>' : '';
  var formCard=secAtiva('sec-formacao')&&formacoes.length
    ? '<div style="background:'+t.card+';border:1px solid '+t.borda+';border-radius:14px;padding:1.3rem">'+
      '<h3 style="'+lbl+'">🎓 Formação</h3><div style="display:flex;flex-direction:column;gap:.5rem">'+mkFormGrid(t)+'</div></div>' : '';
  var bottom=(sobreCard||expCard||formCard)
    ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">'+
      '<div style="display:flex;flex-direction:column;gap:1rem">'+sobreCard+'</div>'+
      '<div style="display:flex;flex-direction:column;gap:1rem">'+expCard+formCard+'</div></div>' : '';

  return mkFontLink()+
    '<div style="font-family:\''+fonte+'\',system-ui,sans-serif;background:'+t.bg+';min-height:100vh;color:'+t.texto+';padding:1.5rem 1rem">'+
    '<div style="max-width:980px;margin:0 auto;display:flex;flex-direction:column;gap:1rem">'+
    '<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:1rem">'+
    '<div style="background:'+t.card+';border:1px solid '+t.borda+';border-radius:16px;padding:1.75rem;display:flex;flex-direction:column;gap:1rem">'+
    '<div style="display:flex;align-items:center;gap:1rem">'+mkAvatar(t,d.nome,70)+
    '<div><h1 style="font-size:1.45rem;font-weight:800;color:'+t.texto+';margin:0 0 .2rem">'+d.nome+'</h1>'+
    '<p style="color:'+t.accent+';font-size:.87rem;font-weight:600;margin:0">'+d.profissao+'</p></div></div>'+
    '<p style="color:'+t.sub+';font-size:.87rem;line-height:1.7;margin:0">'+d.bio+'</p>'+bnr+'</div>'+
    '<div style="display:flex;flex-direction:column;gap:1rem">'+skCard+socCard+'</div></div>'+
    projCard+bottom+
    '<div style="text-align:center;color:'+t.sub+';font-size:.75rem;padding:.5rem">Criado com 💙 <strong style="color:'+t.accent+'">SiteGen AI</strong></div>'+
    '</div></div>';
}


/* ─── TEMPLATE 5: TERMINAL ─────────────────────────────────── */
function tplTerminal(d,t) {
  var tb={bg:'#0d0d0d',win:'#1a1a1a',borda:'#2a2a2a',green:'#00ff88',blue:'#61afef',
          yellow:'#e5c07b',red:'#e06c75',text:'#abb2bf',bright:'#ffffff',cyan:'#56b6c2',purple:'#c678dd'};
  var acc=t.accent;
  var pr='<span style="color:'+tb.green+'">➜</span> <span style="color:'+tb.blue+'">~</span>';

  var skLine=skills.length
    ? skills.map(function(s){ return '<span style="color:'+tb.yellow+'">"'+s+'"</span>'; }).join(', ')
    : '<span style="color:'+tb.text+'">[]</span>';

  var projHtml=!projetos.length
    ? '<span style="color:'+tb.text+'">// Nenhum projeto adicionado</span>'
    : projetos.map(function(p){
        var tags=p.techs?p.techs.split(',').map(function(tk){
          return '<span style="background:#222;color:'+tb.cyan+';padding:1px 7px;border-radius:4px;font-size:.74rem;margin-right:.3rem">'+tk.trim()+'</span>';
        }).join(''):'';
        return '<div style="margin-bottom:.75rem;padding:.75rem;background:#111;border-left:3px solid '+acc+';border-radius:0 8px 8px 0">'+
          '<div><span style="color:'+tb.purple+'">project</span> <span style="color:'+tb.blue+'">'+p.nome+'</span> <span style="color:'+tb.green+'">['+p.status+']</span></div>'+
          (p.desc?'<div style="color:'+tb.text+';margin:.2rem 0 .2rem 1rem;font-size:.81rem">'+p.desc+'</div>':'')+
          (tags?'<div style="margin:.1rem 0 0 1rem">'+tags+'</div>':'')+
          (p.url?'<div style="margin:.3rem 0 0 1rem"><a href="'+p.url+'" target="_blank" style="color:'+tb.green+';font-size:.79rem">→ '+p.url+'</a></div>':'')+
          '</div>';
      }).join('');

  var expHtml=experiencias.map(function(ex){
    return '<div style="margin-bottom:.65rem;padding:.7rem;background:#111;border-radius:8px;border:1px solid '+tb.borda+'">'+
      '<div><span style="color:'+tb.purple+'">job</span> <span style="color:'+tb.blue+'">'+ex.cargo+'</span> <span style="color:'+tb.text+'">@</span> <span style="color:'+tb.yellow+'">'+ex.empresa+'</span></div>'+
      ((ex.inicio||ex.fim)?'<div style="color:'+tb.text+';font-size:.79rem;margin:.1rem 0 0 1rem">'+(ex.inicio||'')+(ex.fim?' → '+ex.fim:'')+'</div>':'')+
      (ex.desc?'<div style="color:'+tb.text+';font-size:.81rem;margin:.25rem 0 0 1rem;line-height:1.6">'+ex.desc+'</div>':'')+
      '</div>';
  }).join('');

  var sobreBlk=secAtiva('sec-sobre')&&d.sobre
    ? '<div style="margin-bottom:1.5rem">'+
      '<div>'+pr+' <span style="color:'+tb.green+'">cat</span> <span style="color:'+tb.yellow+'">about.txt</span></div>'+
      '<div style="margin-top:.3rem;padding:.7rem 1rem;background:#111;border-radius:8px;border:1px solid '+tb.borda+';color:'+tb.text+';font-size:.86rem;line-height:1.8;white-space:pre-line">'+d.sobre+'</div></div>' : '';

  var socLine=[];
  if(d.github)    socLine.push('<a href="https://github.com/'+d.github+'" target="_blank" style="color:'+tb.cyan+';text-decoration:none">github.com/'+d.github+'</a>');
  if(d.linkedin)  socLine.push('<a href="https://linkedin.com/in/'+d.linkedin+'" target="_blank" style="color:'+tb.cyan+';text-decoration:none">linkedin.com/in/'+d.linkedin+'</a>');
  if(d.instagram) socLine.push('<a href="https://instagram.com/'+d.instagram.replace('@','')+'" target="_blank" style="color:'+tb.cyan+';text-decoration:none">instagram/'+d.instagram.replace('@','')+'</a>');
  if(d.email)     socLine.push('<a href="mailto:'+d.email+'" style="color:'+tb.cyan+';text-decoration:none">'+d.email+'</a>');

  var formHtml=formacoes.map(function(f){
    return '<div style="margin-bottom:.3rem"><span style="color:'+tb.yellow+'">['+f.inicio+(f.fim?' → '+f.fim:'')+']</span> <span style="color:'+tb.blue+'">'+f.curso+'</span> <span style="color:'+tb.text+'">@ '+f.instituicao+'</span></div>';
  }).join('');

  return '<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet"/>'+
    '<div style="font-family:\'Fira Code\',\'Courier New\',monospace;background:'+tb.bg+';min-height:100vh;color:'+tb.text+';padding:1.5rem 1rem">'+
    '<div style="max-width:820px;margin:0 auto">'+
    '<div style="background:'+tb.win+';border:1px solid '+tb.borda+';border-radius:12px;overflow:hidden">'+
    '<div style="background:#2a2a2a;padding:.55rem 1rem;display:flex;align-items:center;gap:.45rem;border-bottom:1px solid '+tb.borda+'">'+
    '<span style="width:12px;height:12px;border-radius:50%;background:#ff5f57;display:inline-block"></span>'+
    '<span style="width:12px;height:12px;border-radius:50%;background:#febc2e;display:inline-block"></span>'+
    '<span style="width:12px;height:12px;border-radius:50%;background:#28c840;display:inline-block"></span>'+
    '<span style="margin-left:.75rem;font-size:.75rem;color:#666">portfolio — bash</span></div>'+
    '<div style="padding:1.5rem 1.75rem;font-size:.88rem;line-height:1.9">'+
    '<div style="margin-bottom:1.5rem">'+
    '<div>'+pr+' <span style="color:'+tb.green+'">whoami</span></div>'+
    '<div style="margin-top:.3rem;padding-left:1rem">'+
    '<div><span style="color:'+tb.purple+'">name:</span>  <span style="color:'+tb.bright+';font-weight:600">'+d.nome+'</span></div>'+
    '<div><span style="color:'+tb.purple+'">role:</span>  <span style="color:'+acc+'">'+d.profissao+'</span></div>'+
    '<div><span style="color:'+tb.purple+'">bio:</span>   <span style="color:'+tb.text+'">'+d.bio+'</span></div>'+
    (socLine.length?'<div><span style="color:'+tb.purple+'">links:</span> '+socLine.join(' <span style="color:#444">|</span> ')+'</div>':'')+
    '</div></div>'+
    (secAtiva('sec-skills')&&skills.length
      ? '<div style="margin-bottom:1.5rem"><div>'+pr+' <span style="color:'+tb.green+'">cat</span> <span style="color:'+tb.yellow+'">skills.json</span></div>'+
        '<div style="margin-top:.3rem;padding:.75rem 1rem;background:#111;border-radius:8px;border:1px solid '+tb.borda+'">'+
        '<span style="color:#666">{</span><br>&nbsp;&nbsp;<span style="color:'+tb.red+'">"skills"</span><span style="color:#666">: [</span> '+skLine+' <span style="color:#666">]</span><br><span style="color:#666">}</span></div></div>' : '')+
    sobreBlk+
    (secAtiva('sec-projetos')?'<div style="margin-bottom:1.5rem"><div>'+pr+' <span style="color:'+tb.green+'">ls</span> <span style="color:'+tb.yellow+'">./projects</span></div><div style="margin-top:.5rem">'+projHtml+'</div></div>':'')+
    (secAtiva('sec-experiencia')&&experiencias.length?'<div style="margin-bottom:1.5rem"><div>'+pr+' <span style="color:'+tb.green+'">cat</span> <span style="color:'+tb.yellow+'">experience.log</span></div><div style="margin-top:.4rem">'+expHtml+'</div></div>':'')+
    (secAtiva('sec-formacao')&&formacoes.length?'<div style="margin-bottom:1.5rem"><div>'+pr+' <span style="color:'+tb.green+'">cat</span> <span style="color:'+tb.yellow+'">education.log</span></div><div style="margin-top:.4rem;padding-left:1rem">'+formHtml+'</div></div>':'')+
    '<div>'+pr+' <span style="color:'+tb.text+';opacity:.4">█</span></div>'+
    '<div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid '+tb.borda+';font-size:.72rem;color:#444">// Criado com 💙 <span style="color:'+acc+'">SiteGen AI</span></div>'+
    '</div></div></div></div>';
}


/* ─── PREVIEW AO VIVO ──────────────────────────────────────── */
var _previewTimer = null;
function atualizarPreview() {
  // mostra badge "Atualizando…"
  var badge = document.getElementById('preview-live-badge');
  if (badge) {
    badge.textContent = '🔄 Atualizando…';
    badge.style.background = 'rgba(245,158,11,.2)';
    badge.style.borderColor = 'rgba(245,158,11,.5)';
    badge.style.color = '#fbbf24';
  }
  clearTimeout(_previewTimer);
  _previewTimer = setTimeout(function() {
    var frame = document.getElementById('preview-live-frame');
    if (frame) frame.innerHTML = gerarHTMLSite();
    if (badge) {
      badge.textContent = '✓ Atualizado';
      badge.style.background = 'rgba(34,197,94,.15)';
      badge.style.borderColor = 'rgba(34,197,94,.4)';
      badge.style.color = '#4ade80';
      setTimeout(function() {
        badge.textContent = 'Auto-atualiza';
        badge.style.background = '';
        badge.style.borderColor = '';
        badge.style.color = '';
      }, 1500);
    }
  }, 150);
}

/* ─── NAVEGAÇÃO ────────────────────────────────────────────── */
function abrirPreviewCompleto() {
  document.getElementById('preview-conteudo').innerHTML = gerarHTMLSite();
  document.getElementById('tela-editor').classList.add('hidden');
  document.getElementById('tela-preview').classList.remove('hidden');
}
function voltarEditor() {
  document.getElementById('tela-preview').classList.add('hidden');
  document.getElementById('tela-editor').classList.remove('hidden');
}

/* ─── EXPORTAR ─────────────────────────────────────────────── */
function exportarSite() {
  var nome = document.getElementById('f-nome').value || 'meu-site';
  var furl = 'https://fonts.googleapis.com/css2?family=' + fonte.replace(/ /g,'+') + ':wght@400;500;600;700;800&display=swap';
  var html = '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8"/>\n'+
    '<meta name="viewport" content="width=device-width,initial-scale=1"/>\n'+
    '<title>'+nome+'</title>\n'+
    '<link rel="preconnect" href="https://fonts.googleapis.com"/>\n'+
    '<link href="'+furl+'" rel="stylesheet"/>\n'+
    '</head>\n<body style="margin:0">'+gerarHTMLSite()+'</body>\n</html>';
  var blob = new Blob([html], {type:'text/html'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome.toLowerCase().replace(/\s+/g,'-') + '.html';
  a.click();
}

/* ─── INICIALIZAÇÃO ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  ['HTML','CSS','JavaScript'].forEach(function(s){ skills.push(s); });
  renderSkills();
  renderProjetosEditor();
  renderExperienciasEditor();
  renderFormacoesEditor();
  atualizarPreview();
});
