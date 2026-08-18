/* ============================================================
   PROJETO 01 — JOGO DE ADIVINHAÇÃO (Estilo Akinator)
   script.js — Lógica principal
   ============================================================ */

// ── Configuração da API Gemini ────────────────────────────────────────────
// NOTA: Insira aqui sua chave válida do Google AI Studio (https://aistudio.google.com/app/apikey)
const GEMINI_KEY = 'AQ.Ab8RN6KF3TQBfnlZeAYcK4omM5UFA3-qj57XRvSX03753ScClw';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

// ── Timeout helper para fetch ─────────────────────────────────────────────
function fetchComTimeout(url, opcoes, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opcoes, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

// Modo IA: quando true, usa Gemini para gerar perguntas em vez da árvore
let modoIA = false;
let perguntaIAAtual = null; // pergunta atual gerada pela IA
let tentativasIA = 0;       // quantas tentativas a IA já fez
const MAX_TENTATIVAS_IA = 20;

// ── Função IA com Gemini ──────────────────────────────────────────────────
async function perguntarIA(hist) {
  const historicoTexto = hist
    .map((h, i) => `${i + 1}. "${h.pergunta}" → ${h.resposta}`)
    .join('\n');

  const totalResps = hist.length;
  const prompt = totalResps >= 3
    ? `Você é um jogo de adivinhação estilo Akinator.
O jogador está pensando em algo (animal, personagem famoso, objeto, comida, país ou qualquer coisa).
Perguntas já feitas (${totalResps} total):
${historicoTexto}

Com base nessas ${totalResps} respostas, você tem informações suficientes para tentar adivinhar?
- Se SIM, responda: PALPITE: [sua resposta aqui com emoji]
- Se NÃO, faça A PRÓXIMA pergunta mais eficiente de sim/não.
Responda APENAS com a pergunta OU com "PALPITE: [resposta]". Sem explicações. Em português.`
    : `Você é um jogo de adivinhação estilo Akinator.
O jogador está pensando em algo (animal, personagem, objeto, comida, país, etc.).
${totalResps > 0 ? `Respostas até agora:\n${historicoTexto}\n` : ''}
Faça a PRIMEIRA pergunta mais eficiente de sim/não para estreitar as possibilidades.
Responda APENAS com a pergunta. Sem explicações. Em português.`;

  const res = await fetchComTimeout(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 100 }
    })
  }, 4000); // timeout de 4 segundos

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const texto = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  return texto;
}

// ── Árvore de decisão expandida ───────────────────────────────────────────
// Cobre: animais, personagens famosos, objetos, comidas, países
const arvore = {
  pergunta: "É um ser vivo?",
  sim: {
    pergunta: "É um animal (não humano)?",
    sim: {
      pergunta: "Vive principalmente na água?",
      sim: {
        pergunta: "Tem nadadeiras (peixe/tubarão)?",
        sim: {
          pergunta: "É um mamífero aquático?",
          sim: { resposta: "🐬 Golfinho" },
          nao: {
            pergunta: "É muito grande e perigoso?",
            sim: { resposta: "🦈 Tubarão" },
            nao: { resposta: "🐟 Peixe" }
          }
        },
        nao: {
          pergunta: "Tem casca ou casco duro?",
          sim: { resposta: "🐢 Tartaruga" },
          nao: {
            pergunta: "Tem mandíbulas fortes e é réptil?",
            sim: { resposta: "🐊 Crocodilo" },
            nao: { resposta: "🐙 Polvo" }
          }
        }
      },
      nao: {
        pergunta: "Tem penas?",
        sim: {
          pergunta: "Consegue voar?",
          sim: {
            pergunta: "É uma ave de rapina (águia, coruja)?",
            sim: { resposta: "🦅 Águia" },
            nao: {
              pergunta: "Tem cores vibrantes (papagaio, tucano)?",
              sim: { resposta: "🦜 Papagaio" },
              nao: { resposta: "🐦 Pássaro" }
            }
          },
          nao: {
            pergunta: "Vive em regiões geladas?",
            sim: { resposta: "🐧 Pinguim" },
            nao: { resposta: "🦩 Flamingo" }
          }
        },
        nao: {
          pergunta: "Tem quatro patas?",
          sim: {
            pergunta: "É um animal doméstico?",
            sim: {
              pergunta: "Late e é chamado de 'melhor amigo do homem'?",
              sim: { resposta: "🐶 Cachorro" },
              nao: {
                pergunta: "Mia e gosta de dormir muito?",
                sim: { resposta: "🐱 Gato" },
                nao: {
                  pergunta: "É um roedor pequeno?",
                  sim: { resposta: "🐹 Hamster" },
                  nao: { resposta: "🐰 Coelho" }
                }
              }
            },
            nao: {
              pergunta: "É um animal de grande porte (acima de 200kg)?",
              sim: {
                pergunta: "Tem tromba comprida?",
                sim: { resposta: "🐘 Elefante" },
                nao: {
                  pergunta: "Tem chifres ou listas?",
                  sim: {
                    pergunta: "É branco e preto com listras?",
                    sim: { resposta: "🦓 Zebra" },
                    nao: { resposta: "🦏 Rinoceronte" }
                  },
                  nao: {
                    pergunta: "Tem juba e é chamado de rei da selva?",
                    sim: { resposta: "🦁 Leão" },
                    nao: { resposta: "🐆 Leopardo" }
                  }
                }
              },
              nao: {
                pergunta: "Tem crina e é usado como montaria?",
                sim: { resposta: "🐴 Cavalo" },
                nao: {
                  pergunta: "É famoso por ficar em pé e boxear?",
                  sim: { resposta: "🦘 Canguru" },
                  nao: {
                    pergunta: "É um primata inteligente?",
                    sim: { resposta: "🦍 Gorila" },
                    nao: { resposta: "🦊 Raposa" }
                  }
                }
              }
            }
          },
          nao: {
            pergunta: "Tem asas mas não é ave?",
            sim: { resposta: "🦇 Morcego" },
            nao: {
              pergunta: "É um réptil que rasteja?",
              sim: {
                pergunta: "Tem pernas?",
                sim: { resposta: "🦎 Lagarto" },
                nao: { resposta: "🐍 Cobra" }
              },
              nao: {
                pergunta: "É um inseto ou artrópode?",
                sim: {
                  pergunta: "Tem 8 patas?",
                  sim: { resposta: "🕷️ Aranha" },
                  nao: {
                    pergunta: "Produz mel?",
                    sim: { resposta: "🐝 Abelha" },
                    nao: { resposta: "🦋 Borboleta" }
                  }
                },
                nao: { resposta: "🐸 Sapo" }
              }
            }
          }
        }
      }
    },
    nao: {
      // Ser vivo mas humano → personagem famoso
      pergunta: "É um personagem fictício (desenho, filme, série)?",
      sim: {
        pergunta: "É de um filme de animação?",
        sim: {
          pergunta: "É da Disney/Pixar?",
          sim: {
            pergunta: "É um rei leão?",
            sim: { resposta: "🦁 Simba (O Rei Leão)" },
            nao: {
              pergunta: "Usa chapéu de cowboy e é um brinquedo?",
              sim: { resposta: "🤠 Woody (Toy Story)" },
              nao: { resposta: "🧜 Ariel (A Pequena Sereia)" }
            }
          },
          nao: {
            pergunta: "É japonês (anime/manga)?",
            sim: {
              pergunta: "Usa uniforme laranja e é ninja?",
              sim: { resposta: "🍥 Naruto Uzumaki" },
              nao: {
                pergunta: "Usa roupas de super-herói e tem poderes de borracha?",
                sim: { resposta: "⚓ Monkey D. Luffy (One Piece)" },
                nao: { resposta: "⚔️ Goku (Dragon Ball)" }
              }
            },
            nao: { resposta: "🧱 Shrek" }
          }
        },
        nao: {
          pergunta: "É de um filme de super-herói?",
          sim: {
            pergunta: "É da Marvel?",
            sim: {
              pergunta: "Usa armadura de ferro?",
              sim: { resposta: "🦾 Tony Stark / Homem de Ferro" },
              nao: {
                pergunta: "Foi picado por uma aranha?",
                sim: { resposta: "🕷️ Homem-Aranha" },
                nao: { resposta: "🔨 Thor" }
              }
            },
            nao: {
              pergunta: "Usa capa vermelha e voa muito rápido?",
              sim: { resposta: "🦸 Superman" },
              nao: { resposta: "🦇 Batman" }
            }
          },
          nao: { resposta: "⚗️ Hermione Granger (Harry Potter)" }
        }
      },
      nao: {
        // Pessoa real famosa
        pergunta: "É um atleta ou esportista?",
        sim: {
          pergunta: "É jogador de futebol?",
          sim: {
            pergunta: "É brasileiro e jogou pela Seleção Canarinho?",
            sim: { resposta: "⚽ Pelé" },
            nao: { resposta: "🐐 Lionel Messi" }
          },
          nao: {
            pergunta: "É tenista e ganhou muitos Grand Slams?",
            sim: { resposta: "🎾 Roger Federer" },
            nao: { resposta: "🏀 Michael Jordan" }
          }
        },
        nao: {
          pergunta: "É um líder político ou histórico?",
          sim: {
            pergunta: "É famoso por libertar escravos nos EUA?",
            sim: { resposta: "🎩 Abraham Lincoln" },
            nao: {
              pergunta: "Liderou a luta contra o apartheid?",
              sim: { resposta: "✊ Nelson Mandela" },
              nao: { resposta: "🏛️ Napoleão Bonaparte" }
            }
          },
          nao: {
            pergunta: "É um cientista ou inventor?",
            sim: {
              pergunta: "Descobriu a gravidade com uma maçã?",
              sim: { resposta: "🍎 Isaac Newton" },
              nao: {
                pergunta: "Inventou a lâmpada elétrica?",
                sim: { resposta: "💡 Thomas Edison" },
                nao: { resposta: "⚡ Albert Einstein" }
              }
            },
            nao: { resposta: "🎤 Michael Jackson" }
          }
        }
      }
    }
  },
  nao: {
    // Não é ser vivo → objeto, comida ou país
    pergunta: "É uma coisa que você pode comer ou beber?",
    sim: {
      pergunta: "É um prato salgado (refeição)?",
      sim: {
        pergunta: "É um prato típico brasileiro?",
        sim: {
          pergunta: "Tem feijão preto e vários acompanhamentos?",
          sim: { resposta: "🍲 Feijoada" },
          nao: {
            pergunta: "É carne assada com mandioca?",
            sim: { resposta: "🥩 Churrasco" },
            nao: { resposta: "🍚 Arroz com Feijão" }
          }
        },
        nao: {
          pergunta: "É redondo, tem molho de tomate e queijo?",
          sim: { resposta: "🍕 Pizza" },
          nao: {
            pergunta: "Tem dois pães e é recheado?",
            sim: { resposta: "🍔 Hambúrguer" },
            nao: {
              pergunta: "É macarrão com molho?",
              sim: { resposta: "🍝 Espaguete" },
              nao: { resposta: "🌮 Taco" }
            }
          }
        }
      },
      nao: {
        pergunta: "É uma sobremesa ou doce?",
        sim: {
          pergunta: "É gelado e cremoso?",
          sim: { resposta: "🍦 Sorvete" },
          nao: {
            pergunta: "É um bolo com cobertura e velas?",
            sim: { resposta: "🎂 Bolo de Aniversário" },
            nao: {
              pergunta: "É pequeno, redondo e de chocolate?",
              sim: { resposta: "🍫 Chocolate" },
              nao: { resposta: "🍩 Rosquinha / Donut" }
            }
          }
        },
        nao: {
          pergunta: "É uma fruta?",
          sim: {
            pergunta: "É amarela e comprida?",
            sim: { resposta: "🍌 Banana" },
            nao: {
              pergunta: "É vermelha e pequena?",
              sim: { resposta: "🍓 Morango" },
              nao: { resposta: "🍉 Melancia" }
            }
          },
          nao: { resposta: "☕ Café" }
        }
      }
    },
    nao: {
      pergunta: "É um lugar (país, cidade, continente)?",
      sim: {
        pergunta: "É um país?",
        sim: {
          pergunta: "Fica na América do Sul?",
          sim: {
            pergunta: "É o maior país da América Latina?",
            sim: { resposta: "🇧🇷 Brasil" },
            nao: {
              pergunta: "Fica nos Andes e tem Machu Picchu?",
              sim: { resposta: "🇵🇪 Peru" },
              nao: { resposta: "🇦🇷 Argentina" }
            }
          },
          nao: {
            pergunta: "É o país mais populoso do mundo?",
            sim: { resposta: "🇨🇳 China" },
            nao: {
              pergunta: "Tem a Torre Eiffel?",
              sim: { resposta: "🇫🇷 França" },
              nao: {
                pergunta: "É famoso pelo futebol e vai à Copa do Mundo com frequência?",
                sim: { resposta: "🇩🇪 Alemanha" },
                nao: { resposta: "🇺🇸 Estados Unidos" }
              }
            }
          }
        },
        nao: { resposta: "🌎 Um continente ou região geográfica" }
      },
      nao: {
        // Objeto
        pergunta: "Cabe na palma da mão?",
        sim: {
          pergunta: "É um aparelho eletrônico?",
          sim: {
            pergunta: "Serve para fazer ligações e acessar a internet?",
            sim: { resposta: "📱 Smartphone / Celular" },
            nao: {
              pergunta: "Serve para ouvir música sem fio?",
              sim: { resposta: "🎧 Fone de Ouvido" },
              nao: { resposta: "⌚ Smartwatch / Relógio" }
            }
          },
          nao: {
            pergunta: "Serve para escrever?",
            sim: { resposta: "🖊️ Caneta" },
            nao: {
              pergunta: "Você usa no pulso?",
              sim: { resposta: "⌚ Relógio de Pulso" },
              nao: { resposta: "🔑 Chave" }
            }
          }
        },
        nao: {
          pergunta: "É um meio de transporte?",
          sim: {
            pergunta: "Voa?",
            sim: {
              pergunta: "Transporta muitos passageiros?",
              sim: { resposta: "✈️ Avião" },
              nao: { resposta: "🚁 Helicóptero" }
            },
            nao: {
              pergunta: "Anda sobre trilhos?",
              sim: { resposta: "🚂 Trem / Metrô" },
              nao: {
                pergunta: "Tem duas rodas?",
                sim: { resposta: "🚲 Bicicleta" },
                nao: { resposta: "🚗 Carro" }
              }
            }
          },
          nao: {
            pergunta: "Você encontra em uma casa?",
            sim: {
              pergunta: "Serve para sentar?",
              sim: { resposta: "🛋️ Sofá" },
              nao: {
                pergunta: "Exibe imagens e vídeos?",
                sim: { resposta: "📺 Televisão" },
                nao: {
                  pergunta: "Serve para dormir?",
                  sim: { resposta: "🛏️ Cama" },
                  nao: { resposta: "🚿 Chuveiro" }
                }
              }
            },
            nao: {
              pergunta: "É usado para processar informações?",
              sim: { resposta: "💻 Computador / Notebook" },
              nao: { resposta: "📦 Um objeto diverso" }
            }
          }
        }
      }
    }
  }
};

// ── Estado do jogo ────────────────────────────────────────────────────────
let noAtual = null;
let historico = [];
let totalPerguntas = 0;
const MAX_PERGUNTAS = 20; // limite estimado para barra de progresso

// ── Utilidades de tela ────────────────────────────────────────────────────
function mostrarTela(idTela) {
  const telas = ['tela-inicio', 'tela-jogo', 'tela-resultado', 'tela-fim'];
  telas.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('hidden', id !== idTela);
      if (id === idTela) {
        // re-trigger animation
        el.classList.remove('ativa');
        void el.offsetWidth; // reflow
        el.classList.add('ativa');
      }
    }
  });
}

// ── Iniciar jogo ──────────────────────────────────────────────────────────
function iniciarJogo(comIA = false) {
  modoIA = comIA;
  noAtual = arvore;
  historico = [];
  totalPerguntas = 0;
  tentativasIA = 0;
  perguntaIAAtual = null;

  // Mostrar badge do modo
  const badge = document.getElementById('modo-badge');
  if (badge) {
    badge.textContent = comIA ? '🤖 Modo IA' : '🌳 Modo Clássico';
    badge.style.display = 'inline-block';
  }

  mostrarTela('tela-jogo');

  if (comIA) {
    mostrarPerguntaIA();
  } else {
    mostrarPergunta();
  }
}

// ── Mostrar pergunta (modo clássico) ──────────────────────────────────────
function mostrarPergunta() {
  if (!noAtual || noAtual.resposta !== undefined) {
    mostrarResultado();
    return;
  }

  totalPerguntas++;

  const numEl = document.getElementById('num-pergunta');
  numEl.textContent = totalPerguntas;
  numEl.style.animation = 'none';
  void numEl.offsetWidth;
  numEl.style.animation = 'counterPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both';

  const textoEl = document.getElementById('pergunta-texto');
  textoEl.style.animation = 'none';
  void textoEl.offsetWidth;
  textoEl.textContent = noAtual.pergunta;
  textoEl.style.animation = 'fadeSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) both';

  const progresso = Math.min((totalPerguntas / MAX_PERGUNTAS) * 100, 95);
  const barra = document.getElementById('barra-progresso');
  barra.style.width = `${progresso}%`;
  barra.parentElement.setAttribute('aria-valuenow', Math.round(progresso));
}

// ── Mostrar pergunta (modo IA) ─────────────────────────────────────────────
async function mostrarPerguntaIA() {
  // Desabilitar botões enquanto carrega
  setBotoesResposta(false);

  const textoEl = document.getElementById('pergunta-texto');
  textoEl.textContent = '🤖 Pensando…';
  textoEl.style.animation = 'fadeSlideIn 0.3s ease both';

  try {
    tentativasIA++;
    const resposta = await perguntarIA(historico);

    // Verificar se a IA quer fazer um palpite
    if (resposta.toUpperCase().startsWith('PALPITE:')) {
      const palpite = resposta.replace(/^PALPITE:\s*/i, '').trim();
      noAtual = { resposta: palpite };
      mostrarResultado();
      return;
    }

    // Limite de perguntas
    if (tentativasIA >= MAX_TENTATIVAS_IA) {
      noAtual = { resposta: '🔮 Não consegui adivinhar! Você venceu!' };
      mostrarResultado();
      return;
    }

    // Exibir a pergunta gerada
    perguntaIAAtual = resposta.replace(/[?]$/,'').trim() + '?';
    totalPerguntas++;

    const numEl = document.getElementById('num-pergunta');
    numEl.textContent = totalPerguntas;
    numEl.style.animation = 'none';
    void numEl.offsetWidth;
    numEl.style.animation = 'counterPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both';

    textoEl.textContent = perguntaIAAtual;
    textoEl.style.animation = 'none';
    void textoEl.offsetWidth;
    textoEl.style.animation = 'fadeSlideIn 0.3s ease both';

    const progresso = Math.min((totalPerguntas / MAX_PERGUNTAS) * 100, 95);
    document.getElementById('barra-progresso').style.width = `${progresso}%`;

    setBotoesResposta(true);
  } catch (err) {
    console.error('Erro Gemini:', err);
    // Fallback para modo clássico se a IA falhar (timeout ou chave inválida)
    textoEl.textContent = '⚠️ IA indisponível, iniciando modo clássico…';
    setBotoesResposta(false);
    setTimeout(() => {
      modoIA = false;
      noAtual = arvore;
      historico = [];
      totalPerguntas = 0;
      mostrarPergunta();
    }, 1500);
  }
}

// ── Habilitar/desabilitar botões de resposta ───────────────────────────────
function setBotoesResposta(ativo) {
  document.querySelectorAll('.btn-resposta').forEach(b => {
    b.disabled = !ativo;
    b.style.opacity = ativo ? '1' : '0.5';
  });
}

// ── Responder ─────────────────────────────────────────────────────────────
function responder(opcao) {
  if (modoIA) {
    // Modo IA: salvar resposta e pedir próxima pergunta
    const pergAtual = perguntaIAAtual || document.getElementById('pergunta-texto').textContent;
    historico.push({ pergunta: pergAtual, resposta: opcao });
    mostrarPerguntaIA();
    return;
  }

  // Modo clássico
  if (!noAtual) return;
  historico.push({ pergunta: noAtual.pergunta, resposta: opcao });

  if (opcao === 'sim') {
    noAtual = noAtual.sim;
  } else if (opcao === 'nao') {
    noAtual = noAtual.nao;
  } else {
    noAtual = Math.random() > 0.5 ? noAtual.sim : noAtual.nao;
  }

  if (!noAtual) {
    noAtual = { resposta: "🔮 Algo muito misterioso! Não consegui adivinhar." };
  }

  mostrarPergunta();
}

// ── Mostrar resultado (palpite) ───────────────────────────────────────────
function mostrarResultado() {
  mostrarTela('tela-resultado');

  const palpite = noAtual?.resposta || '🔮 Não consegui adivinhar!';
  document.getElementById('palpite-final').textContent = palpite;
  document.getElementById('resultado-perguntas').textContent =
    `Cheguei aqui com ${totalPerguntas} pergunta${totalPerguntas !== 1 ? 's' : ''}`;
}

// ── Verificar se acertou e mostrar tela final ────────────────────────────
function verificarResposta(acertou) {
  mostrarTela('tela-fim');

  // Emoji e mensagem principal
  const emojiEl = document.getElementById('fim-emoji');
  const msgEl = document.getElementById('mensagem-fim');

  if (acertou) {
    emojiEl.textContent = '🎉';
    msgEl.innerHTML = `Acertei!<br><small style="color:#94a3b8;font-weight:400;">Pensei em <strong style="color:#c084fc">${noAtual?.resposta || 'sua resposta'}</strong> com apenas ${totalPerguntas} pergunta${totalPerguntas !== 1 ? 's' : ''}.</small>`;
  } else {
    emojiEl.textContent = '🤔';
    msgEl.innerHTML = `Errei desta vez!<br><small style="color:#94a3b8;font-weight:400;">Mas é assim que a IA melhora — aprendo com seus dados!</small>`;
  }

  // Estrelas baseadas no número de perguntas
  mostrarEstrelas(totalPerguntas, acertou);

  // Histórico
  const lista = document.getElementById('lista-historico');
  lista.innerHTML = '';
  historico.forEach(h => {
    const li = document.createElement('li');
    const emoji = h.resposta === 'sim' ? '✅' : h.resposta === 'nao' ? '❌' : '🤔';
    li.textContent = `${emoji} ${h.pergunta} → ${h.resposta}`;
    li.classList.add(`resp-${h.resposta}`);
    lista.appendChild(li);
  });
}

// ── Sistema de estrelas ───────────────────────────────────────────────────
function mostrarEstrelas(numPerguntas, acertou) {
  // Estrelas: quanto menos perguntas, mais estrelas
  // 1-4 perguntas → 5 estrelas
  // 5-7  → 4 estrelas
  // 8-10 → 3 estrelas
  // 11-14 → 2 estrelas
  // 15+  → 1 estrela
  // Se errou: máximo 2 estrelas
  let estrelas;
  if (!acertou) {
    estrelas = 0;
  } else if (numPerguntas <= 4) {
    estrelas = 5;
  } else if (numPerguntas <= 7) {
    estrelas = 4;
  } else if (numPerguntas <= 10) {
    estrelas = 3;
  } else if (numPerguntas <= 14) {
    estrelas = 2;
  } else {
    estrelas = 1;
  }

  const container = document.getElementById('estrelas-container');
  const descEl = document.getElementById('estrelas-desc');
  container.innerHTML = '';

  const descricoes = {
    0: 'Quase lá! Tente de novo.',
    1: 'Difícil, mas não desisto!',
    2: 'Razoável — posso melhorar.',
    3: 'Bom resultado! ⚡',
    4: 'Muito bom! Quase perfeito! 🔥',
    5: 'Perfeito! Incrível! 🏆'
  };

  for (let i = 1; i <= 5; i++) {
    const span = document.createElement('span');
    span.classList.add('estrela');
    span.textContent = i <= estrelas ? '⭐' : '☆';
    span.style.animationDelay = `${(i - 1) * 0.12}s`;
    span.style.opacity = i <= estrelas ? '1' : '0.3';
    container.appendChild(span);
  }

  descEl.textContent = descricoes[estrelas] || '';
}

// ── Reiniciar ─────────────────────────────────────────────────────────────
function reiniciar() {
  noAtual = null;
  historico = [];
  totalPerguntas = 0;

  // Reseta barra
  const barra = document.getElementById('barra-progresso');
  if (barra) barra.style.width = '5%';

  mostrarTela('tela-inicio');
}
