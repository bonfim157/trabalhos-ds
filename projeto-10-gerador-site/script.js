/* Gerador de Site — script.js | Gemini AI + 6 temas */

const GEMINI_KEY = 'AIzaSyAQ.Ab8RN6IUJwvclhq6lsBQoNoV3MXKAwlZAP5dYOzUVqdTVzh3TA';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

let avatar = '👨‍💻';
let tema = 'dark-azul';
let skills = [];
let projetos = [];

// ── Temas ──────────────────────────────────────────────────────
const temas = {
  'dark-azul': { bg:'#0d1117', card:'#161b22', accent:'#2563eb', texto:'#e6edf3', sub:'#8b949e', borda:'#21262d' },
  'dark-roxo': { bg:'#0f0c29', card:'#1a1033', accent:'#a855f7', texto:'#f3e8ff', sub:'#a78bfa', borda:'#2d1b5e' },
  'neon-verde':{ bg:'#001a00', card:'#002800', accent:'#00ff41', texto:'#00ff41', sub:'#00cc33', borda:'#003310' },
  'sunset':    { bg:'#1a0a00', card:'#2a1200', accent:'#f97316', texto:'#fed7aa', sub:'#fb923c', borda:'#7c2d12' },
  'ocean':     { bg:'#001a2c', card:'#002a44', accent:'#06b6d4', texto:'#e0f7fa', sub:'#67e8f9', borda:'#0e4c5e' },
  'claro':     { bg:'#f8fafc', card:'#ffffff', accent:'#3b82f6', texto:'#1e293b', sub:'#64748b', borda:'#e2e8f0' },
};

// ── Avatar ────────────────────────────────────────────────────
function selAvatar(el, av) {
  document.querySelectorAll('.avatar-op').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  avatar = av;
}

// ── Tema ──────────────────────────────────────────────────────
function selTema(el, t) {
  document.querySelectorAll('.tema-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  tema = t;
}

// ── Skills ────────────────────────────────────────────────────
function addSkill() {
  const input = document.getElementById('skill-input');
  const val = input.value.trim();
  if (!val) return;
  skills.push(val);
  input.value = '';
  renderSkills();
}

function removeSkill(i) { skills.splice(i, 1); renderSkills(); }

function renderSkills() {
  document.getElementById('skills-lista').innerHTML = skills.map((s, i) =>
    `<span class="skill-tag">${s}<button onclick="removeSkill(${i})">✕</button></span>`
  ).join('');
}

// ── Projetos ──────────────────────────────────────────────────
function addProjeto() {
  const nome = document.getElementById('proj-nome').value.trim();
  const desc = document.getElementById('proj-desc').value.trim();
  if (!nome) return;
  projetos.push({ nome, desc });
  document.getElementById('proj-nome').value = '';
  document.getElementById('proj-desc').value = '';
  renderProjetos();
}

function removeProjeto(i) { projetos.splice(i, 1); renderProjetos(); }

function renderProjetos() {
  document.getElementById('projetos-lista').innerHTML = projetos.map((p, i) =>
    `<div class="proj-item"><span><strong>${p.nome}</strong>${p.desc ? ' — ' + p.desc : ''}</span><button onclick="removeProjeto(${i})">✕</button></div>`
  ).join('');
}

// ── Gerar Bio com IA ──────────────────────────────────────────
async function gerarBioIA() {
  const nome     = document.getElementById('f-nome').value.trim() || 'Desenvolvedor';
  const profissao = document.getElementById('f-profissao').value.trim() || 'Profissional de tecnologia';
  const skillsStr = skills.join(', ') || 'programação';

  const btn = document.getElementById('btn-ia-bio');
  btn.textContent = '⏳ Gerando…';
  btn.disabled = true;

  try {
    const prompt = `Escreva uma bio profissional e cativante para um portfólio pessoal.
Pessoa: ${nome} | Profissão: ${profissao} | Skills: ${skillsStr}
Máx 3 frases. Tom: moderno, confiante e acessível. Em português brasileiro.`;

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{ temperature:.8, maxOutputTokens:150 } })
    });
    const data = await res.json();
    const bio = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (bio) document.getElementById('f-bio').value = bio;
  } catch {
    document.getElementById('f-bio').value = `Sou ${nome}, ${profissao} apaixonado por criar soluções inovadoras. Tenho experiência em ${skillsStr} e estou sempre em busca de novos desafios. Vamos construir algo incrível juntos!`;
  } finally {
    btn.textContent = '✨ Gerar Bio com IA';
    btn.disabled = false;
  }
}

// ── Gerar Site ────────────────────────────────────────────────
function gerarSite() {
  const nome      = document.getElementById('f-nome').value || 'Seu Nome';
  const profissao = document.getElementById('f-profissao').value || 'Profissão';
  const bio       = document.getElementById('f-bio').value || 'Olá! Bem-vindo ao meu portfólio.';
  const github    = document.getElementById('f-github').value;
  const instagram = document.getElementById('f-instagram').value;
  const linkedin  = document.getElementById('f-linkedin').value;

  const t = temas[tema] || temas['dark-azul'];

  // Skills HTML
  const skillsHTML = skills.map(s =>
    `<span style="background:${t.accent}22;border:1px solid ${t.accent};color:${t.accent};padding:4px 14px;border-radius:50px;font-size:.85rem;white-space:nowrap">${s}</span>`
  ).join('');

  // Projetos HTML
  const projetosHTML = projetos.length
    ? projetos.map(p => `
      <div style="background:${t.bg};border:1px solid ${t.borda};border-radius:12px;padding:1rem">
        <h4 style="color:${t.accent};margin-bottom:.4rem">📁 ${p.nome}</h4>
        ${p.desc ? `<p style="color:${t.sub};font-size:.88rem">${p.desc}</p>` : ''}
      </div>`).join('')
    : `<p style="color:${t.sub}">Nenhum projeto adicionado ainda.</p>`;

  // Redes sociais
  const redes = [
    github    ? `<a href="https://github.com/${github}" target="_blank" style="color:${t.accent};text-decoration:none;font-weight:500">🐙 GitHub</a>` : '',
    instagram ? `<a href="https://instagram.com/${instagram.replace('@','')}" target="_blank" style="color:${t.accent};text-decoration:none;font-weight:500">📸 Instagram</a>` : '',
    linkedin  ? `<a href="https://linkedin.com/in/${linkedin}" target="_blank" style="color:${t.accent};text-decoration:none;font-weight:500">💼 LinkedIn</a>` : '',
  ].filter(Boolean).join(`<span style="color:${t.borda};margin:0 .5rem">·</span>`);

  const html = `
<div style="font-family:'Segoe UI',system-ui,sans-serif;background:${t.bg};min-height:100vh;padding:2rem 1rem;color:${t.texto}">
  <div style="max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem">

    <!-- Hero -->
    <div style="text-align:center;padding:3rem 2rem;background:${t.card};border-radius:20px;border:1px solid ${t.borda}">
      <div style="font-size:5rem;margin-bottom:1rem">${avatar}</div>
      <h1 style="font-size:2.4rem;font-weight:800;margin-bottom:.4rem;color:${t.texto}">${nome}</h1>
      <p style="color:${t.accent};font-size:1.1rem;font-weight:600;margin-bottom:1rem">${profissao}</p>
      <p style="color:${t.sub};max-width:520px;margin:0 auto 1.5rem;line-height:1.7;font-size:.95rem">${bio}</p>
      ${redes ? `<div style="display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap">${redes}</div>` : ''}
    </div>

    ${skillsHTML ? `
    <!-- Skills -->
    <div style="background:${t.card};border-radius:16px;border:1px solid ${t.borda};padding:1.5rem">
      <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:1rem;color:${t.texto}">🛠️ Habilidades</h2>
      <div style="display:flex;flex-wrap:wrap;gap:.5rem">${skillsHTML}</div>
    </div>` : ''}

    <!-- Projetos -->
    <div style="background:${t.card};border-radius:16px;border:1px solid ${t.borda};padding:1.5rem">
      <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:1rem;color:${t.texto}">📁 Projetos</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">${projetosHTML}</div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;color:${t.sub};font-size:.82rem;padding:.75rem">
      Criado com 💙 usando <strong>SiteGen AI</strong>
    </div>

  </div>
</div>`;

  document.getElementById('preview-conteudo').innerHTML = html;
  document.getElementById('tela-form').classList.add('hidden');
  document.getElementById('tela-preview').classList.remove('hidden');
}

// ── Voltar ────────────────────────────────────────────────────
function voltarForm() {
  document.getElementById('tela-preview').classList.add('hidden');
  document.getElementById('tela-form').classList.remove('hidden');
}

// ── Exportar ──────────────────────────────────────────────────
function exportarSite() {
  const nome = document.getElementById('f-nome').value || 'meu-site';
  const conteudo = document.getElementById('preview-conteudo').innerHTML;
  const full = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${nome}</title></head><body style="margin:0">${conteudo}</body></html>`;

  const blob = new Blob([full], { type:'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome.toLowerCase().replace(/\s+/g,'-') + '.html';
  a.click();
}

// ── Skills padrão para demo ───────────────────────────────────
['HTML', 'CSS', 'JavaScript'].forEach(s => { skills.push(s); });
renderSkills();
