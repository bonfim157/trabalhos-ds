// Estado dos dados
let dados = { temp: 24, usuarios: 1200, dolar: 5.15, cpu: 42 };
let historicoTemp = Array(20).fill(24);
let historicoUsuarios = Array(20).fill(1200);

// Inicializar gráficos
const ctxTemp = document.getElementById('grafico-temp').getContext('2d');
const ctxUsuarios = document.getElementById('grafico-usuarios').getContext('2d');

const graficoTemp = new Chart(ctxTemp, {
  type: 'line',
  data: {
    labels: Array(20).fill(''),
    datasets: [{
      label: 'Temperatura °C',
      data: [...historicoTemp],
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.1)',
      tension: 0.4, fill: true, pointRadius: 0,
    }]
  },
  options: {
    responsive: true, animation: false,
    plugins: { legend: { labels: { color: '#8b949e' } } },
    scales: {
      x: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
      y: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' }, min: 15, max: 40 }
    }
  }
});

const graficoUsuarios = new Chart(ctxUsuarios, {
  type: 'doughnut',
  data: {
    labels: ['Online', 'Idle', 'Offline'],
    datasets: [{
      data: [1200, 350, 450],
      backgroundColor: ['#3fb950', '#d29922', '#8b949e'],
      borderWidth: 0,
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { labels: { color: '#8b949e' } } }
  }
});

// Atualizar relógio
function atualizarRelogio() {
  const agora = new Date();
  document.getElementById('relogio').textContent = agora.toLocaleTimeString('pt-BR');
}

// Gerar variação aleatória suave
function variar(valor, min, max, delta) {
  const novo = valor + (Math.random() - 0.5) * delta * 2;
  return Math.max(min, Math.min(max, novo));
}

// Adicionar log
const tipos = [
  { classe: 'log-ok',   msgs: ['Conexão estável', 'Servidor respondendo', 'Backup concluído', 'Deploy finalizado'] },
  { classe: 'log-warn', msgs: ['CPU acima de 80%', 'Memória em 75%', 'Latência elevada'] },
  { classe: 'log-info', msgs: ['Novo usuário conectado', 'Requisição processada', 'Cache atualizado'] },
];

function adicionarLog() {
  const lista = document.getElementById('log-lista');
  const tipo = tipos[Math.floor(Math.random() * tipos.length)];
  const msg  = tipo.msgs[Math.floor(Math.random() * tipo.msgs.length)];
  const hora = new Date().toLocaleTimeString('pt-BR');

  const item = document.createElement('div');
  item.className = 'log-item';
  item.innerHTML = `<span class="log-hora">${hora}</span><span class="${tipo.classe} log-msg">● ${msg}</span>`;

  lista.insertBefore(item, lista.firstChild);
  // Manter apenas os últimos 10
  while (lista.children.length > 10) lista.removeChild(lista.lastChild);
}

// Atualização principal
function atualizar() {
  dados.temp     = variar(dados.temp,     15, 40,  0.8);
  dados.usuarios = Math.round(variar(dados.usuarios, 500, 3000, 50));
  dados.dolar    = variar(dados.dolar,    4.8, 5.8, 0.02);
  dados.cpu      = variar(dados.cpu,      10,  95,  5);

  // Cards
  document.getElementById('temperatura').textContent = dados.temp.toFixed(1) + '°C';
  document.getElementById('usuarios').textContent    = dados.usuarios.toLocaleString('pt-BR');
  document.getElementById('dolar').textContent       = 'R$ ' + dados.dolar.toFixed(2);
  document.getElementById('cpu').textContent         = Math.round(dados.cpu) + '%';

  // Gráfico de temperatura
  historicoTemp.push(parseFloat(dados.temp.toFixed(1)));
  historicoTemp.shift();
  graficoTemp.data.datasets[0].data = [...historicoTemp];
  graficoTemp.update();

  // Gráfico de rosca
  const idle    = Math.round(dados.usuarios * 0.25);
  const offline = Math.round(dados.usuarios * 0.35);
  graficoUsuarios.data.datasets[0].data = [dados.usuarios, idle, offline];
  graficoUsuarios.update();

  // Log aleatório a cada ~3 atualizações
  if (Math.random() > 0.65) adicionarLog();
}

// Iniciar
atualizarRelogio();
adicionarLog();
atualizar();

setInterval(atualizarRelogio, 1000);
setInterval(atualizar, 2000);
