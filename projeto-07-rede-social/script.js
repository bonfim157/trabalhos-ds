let usuarioAtual = null;
let posts = JSON.parse(localStorage.getItem('ds_posts') || '[]');
let usuarios = JSON.parse(localStorage.getItem('ds_usuarios') || '[]');

// Usuários fictícios para popular o feed
const botUsers = [
  { nome: 'Ana Lima',    user: 'analima',  avatar: '👩‍💻' },
  { nome: 'Carlos Dev',  user: 'carlosdev', avatar: '🤓' },
  { nome: 'Marina JS',   user: 'marinajs',  avatar: '🎨' },
  { nome: 'Pedro Tech',  user: 'pedrotech', avatar: '🎮' },
  { nome: 'Julia Code',  user: 'juliacode', avatar: '🌟' },
];

const postsIniciais = [
  { texto: 'Acabei de criar meu primeiro site em HTML! 🚀 Quem mais está aprendendo programação aqui?', user: botUsers[0] },
  { texto: 'Python > tudo. Provem que estou errado. 😂 #tech #programação', user: botUsers[1] },
  { texto: 'Dica do dia: use variáveis com nomes que façam sentido! Seu eu do futuro vai agradecer 💡', user: botUsers[2] },
  { texto: '🎮 Quem aí quer criar um jogo? Estou desenvolvendo um projeto em JavaScript puro!', user: botUsers[3] },
  { texto: 'Curso técnico foi a melhor decisão que tomei! Já estou desenvolvendo meu portfólio 📁✨', user: botUsers[4] },
];

function inicializarDados() {
  if (posts.length === 0) {
    posts = postsIniciais.map((p, i) => ({
      id: i + 1,
      texto: p.texto,
      autor: p.user.nome,
      handle: p.user.user,
      avatar: p.user.avatar,
      curtidas: Math.floor(Math.random() * 50) + 5,
      comentarios: Math.floor(Math.random() * 10),
      tempo: Date.now() - (i * 300000),
      curtidoPor: [],
    }));
    salvarPosts();
  }
}

function entrar() {
  const nome = document.getElementById('input-nome').value.trim();
  const user = document.getElementById('input-user').value.trim().replace(/\s/g, '').replace('@', '');
  const avatar = document.getElementById('input-avatar').value;

  if (!nome || !user) { alert('Preencha nome e usuário!'); return; }

  usuarioAtual = { nome, user, avatar, seguidores: 0, seguindo: 0, posts: 0 };

  if (!usuarios.find(u => u.user === user)) {
    usuarios.push(usuarioAtual);
    localStorage.setItem('ds_usuarios', JSON.stringify(usuarios));
  }

  document.getElementById('tela-login').classList.add('hidden');
  document.getElementById('tela-feed').classList.remove('hidden');

  renderizarPerfilMini();
  renderizarFeed();
  renderizarTrending();
  renderizarOnline();
}

function sair() {
  usuarioAtual = null;
  document.getElementById('tela-feed').classList.add('hidden');
  document.getElementById('tela-login').classList.remove('hidden');
}

function renderizarPerfilMini() {
  document.getElementById('perfil-mini').innerHTML = `
    <div style="font-size:2rem;text-align:center">${usuarioAtual.avatar}</div>
    <div style="text-align:center;font-weight:bold;margin-top:0.3rem">${usuarioAtual.nome}</div>
    <div style="text-align:center;color:#8b98a5;font-size:0.8rem">@${usuarioAtual.user}</div>
    <div style="display:flex;justify-content:center;gap:1rem;margin-top:0.5rem;font-size:0.8rem">
      <span><b>${posts.filter(p=>p.handle===usuarioAtual.user).length}</b> posts</span>
    </div>
  `;
}

function adicionarEmoji(e) {
  const t = document.getElementById('input-post');
  t.value += e;
  t.focus();
}

function publicarPost() {
  const texto = document.getElementById('input-post').value.trim();
  if (!texto) return;

  const novoPost = {
    id: Date.now(),
    texto,
    autor: usuarioAtual.nome,
    handle: usuarioAtual.user,
    avatar: usuarioAtual.avatar,
    curtidas: 0,
    comentarios: 0,
    tempo: Date.now(),
    curtidoPor: [],
  };

  posts.unshift(novoPost);
  salvarPosts();
  document.getElementById('input-post').value = '';
  renderizarFeed();
  renderizarPerfilMini();
}

function renderizarFeed() {
  const lista = document.getElementById('lista-posts');
  lista.innerHTML = '';
  [...posts].sort((a, b) => b.tempo - a.tempo).forEach(post => {
    lista.appendChild(criarCardPost(post));
  });
}

function criarCardPost(post) {
  const div = document.createElement('div');
  div.className = 'post-card';
  const tempo = formatarTempo(post.tempo);
  const jaCurtiu = post.curtidoPor.includes(usuarioAtual?.user);

  div.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">${post.avatar}</div>
      <div>
        <div class="post-user-nome">${post.autor}</div>
        <div class="post-user-handle">@${post.handle}</div>
      </div>
      <div class="post-tempo">${tempo}</div>
    </div>
    <div class="post-texto">${post.texto}</div>
    <div class="post-acoes-rodape">
      <button class="btn-acao ${jaCurtiu ? 'curtido' : ''}" onclick="curtir(${post.id})">
        ${jaCurtiu ? '❤️' : '🤍'} ${post.curtidas}
      </button>
      <button class="btn-acao">💬 ${post.comentarios}</button>
      <button class="btn-acao">🔁 Compartilhar</button>
    </div>
  `;
  return div;
}

function curtir(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;
  const idx = post.curtidoPor.indexOf(usuarioAtual.user);
  if (idx === -1) {
    post.curtidoPor.push(usuarioAtual.user);
    post.curtidas++;
  } else {
    post.curtidoPor.splice(idx, 1);
    post.curtidas--;
  }
  salvarPosts();
  renderizarFeed();
}

function mudarAba(aba) {
  document.querySelectorAll('.aba').forEach(a => a.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('aba-' + aba).classList.remove('hidden');
  document.getElementById('nav-' + aba).classList.add('active');

  if (aba === 'explorar') renderizarExplorar();
  if (aba === 'perfil') renderizarPerfil();
}

function renderizarExplorar() {
  const lista = document.getElementById('lista-usuarios-explorar');
  lista.innerHTML = '';
  botUsers.forEach(u => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:1rem;padding:0.8rem;background:#16181c;border-radius:12px;margin-bottom:0.5rem;border:1px solid #2f3336';
    div.innerHTML = `
      <span style="font-size:2rem">${u.avatar}</span>
      <div>
        <div style="font-weight:bold">${u.nome}</div>
        <div style="color:#8b98a5;font-size:0.85rem">@${u.user}</div>
      </div>
      <button onclick="this.textContent=this.textContent==='Seguir'?'Seguindo ✓':'Seguir'" style="margin-left:auto;padding:0.4rem 1rem;background:#1d9bf0;border:none;border-radius:50px;color:#fff;cursor:pointer">Seguir</button>
    `;
    lista.appendChild(div);
  });
}

function renderizarPerfil() {
  const meusPosts = posts.filter(p => p.handle === usuarioAtual.user);
  document.getElementById('perfil-completo').innerHTML = `
    <div style="text-align:center;padding:2rem;background:#16181c;border-radius:15px;border:1px solid #2f3336;margin-bottom:1rem">
      <div style="font-size:5rem">${usuarioAtual.avatar}</div>
      <h2>${usuarioAtual.nome}</h2>
      <p style="color:#8b98a5">@${usuarioAtual.user}</p>
      <p style="margin-top:0.5rem;color:#aaa">Membro do ConnectDS 🎓</p>
      <div style="display:flex;justify-content:center;gap:2rem;margin-top:1rem">
        <div><b>${meusPosts.length}</b><br><span style="color:#8b98a5;font-size:0.8rem">Posts</span></div>
        <div><b>${Math.floor(Math.random()*50)}</b><br><span style="color:#8b98a5;font-size:0.8rem">Seguidores</span></div>
      </div>
    </div>
    ${meusPosts.length === 0 ? '<p style="text-align:center;color:#8b98a5">Você ainda não fez nenhum post!</p>' : meusPosts.map(p => criarCardPost(p).outerHTML).join('')}
  `;
}

function renderizarTrending() {
  const tags = ['#programação', '#tech', '#javascript', '#html', '#css', '#python', '#games', '#IA'];
  document.getElementById('trending-lista').innerHTML =
    tags.map(t => `<div class="trend-item">${t}</div>`).join('');
}

function renderizarOnline() {
  const lista = document.getElementById('online-lista');
  lista.innerHTML = botUsers.map(u =>
    `<div class="online-item"><div class="online-dot"></div><span>${u.avatar} ${u.nome.split(' ')[0]}</span></div>`
  ).join('');
}

function formatarTempo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return diff + 's';
  if (diff < 3600) return Math.floor(diff / 60) + 'min';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  return Math.floor(diff / 86400) + 'd';
}

function salvarPosts() {
  localStorage.setItem('ds_posts', JSON.stringify(posts));
}

inicializarDados();
