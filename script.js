const API_BASE_URL = 'https://controlstock-backend-production.up.railway.app';

// =======================================================================
// BLOCO 1: 🌌 ESTADO GLOBAL DO MARKETPLACE (VARIÁVEIS DE MEMÓRIA)
// =======================================================================
let carrinho = JSON.parse(localStorage.getItem('controlstock_carrinho')) || {};
let listaProdutosGlobal = [];
let usuarioLogado = JSON.parse(localStorage.getItem('controlstock_sessao')) || null;
let cpfCadastroValido = false;
let fotoCarrosselAtual = 0;
let fotosDoProdutoModal = [];
let descontoCupomAtivo = 0;
let intervaloCarrossel;

console.log("O motor lógico do script.js foi carregado com sucesso!");


// =======================================================================
// BLOCO 2: 🪟 FUNÇÕES DE CONTROLE DOS MODAIS E AUTENTICAÇÃO
// =======================================================================
function abrirAuthModal() {
    document.getElementById('modalAuth').classList.add('aberto');
}

function fecharAuthModal() {
    document.getElementById('modalAuth').classList.remove('aberto');
}

function fecharModal() {
    document.getElementById('modalDetalhes').classList.remove('aberto');
}

function fecharModalRomaneio() {
    document.getElementById('modalRomaneio').classList.remove('aberto');
}

function fecharModalGateway() {
    document.getElementById('modalGatewayPagamento').classList.remove('aberto');
}

function mudarAbasAuth(aba) {
    document.querySelectorAll('.aba-auth').forEach(b => b.classList.remove('ativa'));
    document.querySelectorAll('.secao-auth').forEach(s => s.classList.remove('ativa'));
    document.getElementById('aba-' + aba).classList.add('ativa');
    document.getElementById('form-' + aba).classList.add('ativa');
}

function loginSocialSimulado(provedor) {
    alert('🔒 Login com ' + provedor + ' é uma demonstração acadêmica. Use o formulário de e-mail.');
}

function executarLoginCorporativo() {
    ejecutarLoginCorporativo();
}


// =======================================================================
// BLOCO 3: 🛍️ MODAL DE PRODUTO (CARROSSEL + TAMANHOS + AVALIAÇÕES)
// =======================================================================
function abrirModal(id) {
    const prod = listaProdutosGlobal.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('modalPreco').innerText = `R$ ${parseFloat(prod.preco).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('modalParcelas').innerText = `ou até 3x de R$ ${(parseFloat(prod.preco) / 3).toFixed(2)} sem juros`;

    const containerAvaliacoesExistente = document.getElementById('bloco-dinamico-avaliacoes');
    if (containerAvaliacoesExistente) containerAvaliacoesExistente.remove();

    const blocoAvaliacoesHtml = `
        <div id="bloco-dinamico-avaliacoes" class="bloco-avaliacoes" style="margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
            <h4 style="margin-bottom: 10px; color: #ffffff;">⭐ Avaliações dos Clientes</h4>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <span style="font-size: 24px; font-weight: bold; color: #ffca28;">4.8</span>
                <div>
                    <div style="color: #ffca28;">★★★★★</div>
                    <span style="font-size: 12px; color: #94a3b8;">94% dos clientes recomendam este produto</span>
                </div>
            </div>
            <div class="comentarios-lista" style="display: flex; flex-direction: column; gap: 12px;">
                <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; border: 1px solid #1e293b;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <strong style="font-size: 13px; color: #ffffff;">Lucas M.</strong>
                        <span style="color: #ffca28; font-size: 12px;">★★★★★</span>
                    </div>
                    <p style="font-size: 12px; color: #94a3b8; margin: 0;">Produto de altíssima qualidade, caimento perfeito e chegou muito rápido!</p>
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; border: 1px solid #1e293b;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <strong style="font-size: 13px; color: #ffffff;">Beatriz R.</strong>
                        <span style="color: #ffca28; font-size: 12px;">★★★★☆</span>
                    </div>
                    <p style="font-size: 12px; color: #94a3b8; margin: 0;">Muito bonito e confortável. Valeu super a pena o investimento.</p>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalDescricao').insertAdjacentHTML('afterend', blocoAvaliacoesHtml);

    tamanhoSelectedNoModal = null;

    const btnAddModal = document.getElementById('btn-add-modal');
    if (btnAddModal) {
        btnAddModal.disabled = true;
        btnAddModal.innerText = "🛒 Escolha um Tamanho";
    }

    const campoCep = document.getElementById('cep-frete');
    const containerResultado = document.getElementById('resultado-frete-modal');
    if (campoCep) campoCep.value = "";
    if (containerResultado) containerResultado.innerHTML = "";

    if (prod.fotos && prod.fotos.length > 0) {
        fotosDoProdutoModal = prod.fotos.map(f => f.url);
    } else {
        fotosDoProdutoModal = ['https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500'];
    }

    fotoCarrosselAtual = 0;
    mostrarFotoCarrossel();
    gerarIndicadoresCarrossel();

    const containerTamanhos = document.getElementById('container-tamanhos-botoes');
    if (containerTamanhos) {
        containerTamanhos.innerHTML = "";
        const listaTamanhosPadrao = ["P", "M", "G", "GG"];

        listaTamanhosPadrao.forEach(tam => {
            const botao = document.createElement('button');
            botao.className = "btn-tamanho-opcao";
            botao.innerText = tam;

            botao.onclick = () => {
                document.querySelectorAll('.btn-tamanho-opcao').forEach(b => b.classList.remove('selecionado'));
                botao.classList.add('selecionado');
                tamanhoSelectedNoModal = tam;

                let campoQtd = document.getElementById('modal-quantidade-selecionada');
                if (!campoQtd) {
                    const htmlQtd = `
                        <div id="wrapper-quantidade-modal" style="margin-top: 15px; display: flex; align-items: center; gap: 10px;">
                            <label style="color: #fff; font-size: 13px; font-weight: 600;">Quantidade:</label>
                            <input type="number" id="modal-quantidade-selecionada" value="1" min="1" max="${prod.quantidadeAtual}" style="width: 60px; text-align: center; padding: 5px; border-radius: 4px; background: #1e293b; border: 1px solid #334155; color: #fff;">
                        </div>
                    `;
                    containerTamanhos.insertAdjacentHTML('afterend', htmlQtd);
                }

                if (btnAddModal) {
                    const esgotado = prod.quantidadeAtual <= 0;
                    btnAddModal.disabled = esgotado;
                    btnAddModal.innerText = esgotado ? "❌ Esgotado" : `🛒 Adicionar Tamanho ${tam}`;
                }
            };
            containerTamanhos.appendChild(botao);
        });
    }

    if (btnAddModal) {
        btnAddModal.onclick = () => {
            const campoQtd = document.getElementById('modal-quantidade-selecionada');
            const qtdDesejada = campoQtd ? parseInt(campoQtd.value, 10) || 1 : 1;

            if (qtdDesejada > prod.quantidadeAtual) {
                alert(`❌ Erro de Estoque: Você tentou selecionar ${qtdDesejada} unidades, mas temos apenas ${prod.quantidadeAtual} disponíveis.`);
                if (campoQtd) campoQtd.value = prod.quantidadeAtual;
                return;
            }

            adicionarAoCarrinho(prod.id, prod.nome, prod.preco, prod.quantidadeAtual, tamanhoSelectedNoModal, qtdDesejada);

            const wrapperQtd = document.getElementById('wrapper-quantidade-modal');
            if (wrapperQtd) wrapperQtd.remove();

            fecharModal();
        };
    }

    document.getElementById('modalDetalhes').classList.add('aberto');
}


// =======================================================================
// BLOCO 4: 📸 CONTROLE INTERNO DO CARROSSEL DE FOTOS
// =======================================================================
function gerarIndicadoresCarrossel() {
    const containerPontos = document.getElementById('carrossel-pontos');
    if (!containerPontos) return;
    containerPontos.innerHTML = '';
    fotosDoProdutoModal.forEach((_, index) => {
        const ponto = document.createElement('div');
        ponto.classList.add('ponto');
        if (index === 0) ponto.classList.add('ativo');
        ponto.onclick = () => { fotoCarrosselAtual = index; mostrarFotoCarrossel(); };
        containerPontos.appendChild(ponto);
    });
}

function mudarFotoCarrossel(direcao) {
    if (fotosDoProdutoModal.length === 0) return;
    fotoCarrosselAtual += direcao;
    if (fotoCarrosselAtual >= fotosDoProdutoModal.length) fotoCarrosselAtual = 0;
    if (fotoCarrosselAtual < 0) fotoCarrosselAtual = fotosDoProdutoModal.length - 1;
    mostrarFotoCarrossel();
}

function mostrarFotoCarrossel() {
    const imgElement = document.getElementById('modalImg');
    if (imgElement && fotosDoProdutoModal.length > 0) {
        imgElement.src = fotosDoProdutoModal[fotoCarrosselAtual];
        const pontos = document.querySelectorAll('#carrossel-pontos .ponto');
        pontos.forEach((ponto, index) => {
            index === fotoCarrosselAtual ? ponto.classList.add('ativo') : ponto.classList.remove('ativo');
        });
    }
}


// =======================================================================
// BLOCO 5: 🔀 CONTROLE DO FLUXO DO CHECKOUT (WIZARD EM ETAPAS)
// =======================================================================
function avancarWizard(passo) {
    document.getElementById('checkout-secao-itens').style.display = 'none';
    document.getElementById('checkout-secao-endereco').style.display = 'none';

    const secaoPagamento = document.getElementById('checkout-secao-pagamento');

    document.getElementById('step-1').style.color = 'var(--cor-subtexto)';
    document.getElementById('step-1').style.textShadow = 'none';
    document.getElementById('step-2').style.color = 'var(--cor-subtexto)';
    document.getElementById('step-2').style.textShadow = 'none';
    document.getElementById('step-3').style.color = 'var(--cor-subtexto)';
    document.getElementById('step-3').style.textShadow = 'none';

    if (passo === 1) {
        document.getElementById('checkout-secao-itens').style.display = 'block';
        if (secaoPagamento) secaoPagamento.style.display = 'none';
        document.getElementById('step-1').style.color = 'var(--cor-primaria)';
        document.getElementById('step-1').style.textShadow = '0 0 8px var(--cor-primaria)';
    } else if (passo === 2) {
        document.getElementById('checkout-secao-endereco').style.display = 'block';
        if (secaoPagamento) secaoPagamento.style.display = 'none';
        document.getElementById('step-2').style.color = 'var(--cor-primaria)';
        document.getElementById('step-2').style.textShadow = '0 0 8px var(--cor-primaria)';
    } else if (passo === 3) {
        document.getElementById('checkout-secao-endereco').style.display = 'block';
        if (secaoPagamento) secaoPagamento.style.display = 'block';
        document.getElementById('step-3').style.color = 'var(--cor-primaria)';
        document.getElementById('step-3').style.textShadow = '0 0 8px var(--cor-primaria)';
    }
}


// =======================================================================
// BLOCO 6: 🔐 VALIDAÇÕES ANTIFRAUDE MATEMÁTICAS (CPF E CARTÃO)
// =======================================================================
function verificarCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11; if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false; soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11; if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
}

function validarCartaoMatematico(numero) {
    const n = numero.replace(/\D/g, '');
    let soma = 0;
    let deveDobrar = false;

    for (let i = n.length - 1; i >= 0; i--) {
        let digito = parseInt(n.charAt(i));
        if (deveDobrar) {
            digito *= 2;
            if (digito > 9) digito -= 9;
        }
        soma += digito;
        deveDobrar = !deveDobrar;
    }
    return (soma % 10 === 0 && n.length >= 13);
}

function validarCpfCadastro() {
    const campo = document.getElementById('cad-cpf');
    const msg = document.getElementById('msg-cpf-cad');
    let valor = campo.value.replace(/\D/g, "");

    if (valor.length === 0) { msg.innerText = ""; cpfCadastroValido = false; }
    else if (verificarCPF(valor)) {
        msg.innerText = "✓ CPF Autêntico"; msg.style.color = "var(--cor-sucesso)"; cpfCadastroValido = true;
    } else {
        msg.innerText = "✗ CPF Inválido"; msg.style.color = "var(--cor-erro)"; cpfCadastroValido = false;
    }
}

function validarCpfEntregaLive() {
    const campo = document.getElementById('ent-cpf');
    const msg = document.getElementById('msg-cpf-entrega');
    const btnAvancar = document.getElementById('btn-avancar-para-pagamento');
    let valor = campo.value.replace(/\D/g, "");

    if (valor.length === 0) {
        msg.innerText = "";
        btnAvancar.disabled = true;
    } else if (verificarCPF(valor)) {
        msg.innerText = "✓ CPF Autêntico para Despacho";
        msg.style.color = "var(--cor-sucesso)";
        btnAvancar.disabled = false;
    } else {
        msg.innerText = "✗ CPF Inválido";
        msg.style.color = "var(--cor-erro)";
        btnAvancar.disabled = true;
    }
}

function validarCartaoLive() {
    const campo = document.getElementById('card-numero');
    const msg = document.getElementById('msg-card-validacao');
    const btnFinalizar = document.getElementById('btnFinalizar');
    let valor = campo.value.replace(/\D/g, "");

    if (valor.length > 0) {
        campo.value = valor.match(/.{1,4}/g).join(" ");
    }

    if (valor.length === 0) {
        msg.innerText = "";
        btnFinalizar.disabled = true;
    } else if (validarCartaoMatematico(valor)) {
        msg.innerText = "✓ Cartão Válido (Luhn Verificado)";
        msg.style.color = "var(--cor-sucesso)";
        btnFinalizar.disabled = false;
    } else {
        msg.innerText = "✗ Cartão Inválido ou Suspeito";
        msg.style.color = "var(--cor-erro)";
        btnFinalizar.disabled = true;
    }
}


// =======================================================================
// BLOCO 7: 🔐 AUTENTICAÇÃO — LOGIN E CADASTRO
// =======================================================================
function ejecutarLoginCorporativo() {
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value.trim();

    if (!email || !senha) { alert("Preencha todos os campos."); return; }

    fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, senha: senha })
    })
    .then(res => {
        if (!res.ok) throw new Error("Credenciais inválidas");
        return res.json();
    })
    .then(dados => {
        if (dados.autenticado) {
            usuarioLogado = { nome: dados.nome, email: dados.email, nivel: dados.nivel };
            localStorage.setItem('controlstock_sessao', JSON.stringify(usuarioLogado));
            aplicarSessaoUsuario();
            fecharAuthModal();
            alert(dados.mensagem);
        }
    })
    .catch(err => alert("❌ Falha na Autenticação: E-mail ou senha incorretos."));
}

function mapearTecladoLogin(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        ejecutarLoginCorporativo();
    }
}

function executarCadastroMarketplace() {
    const nome = document.getElementById('cad-nome').value.trim();
    const email = document.getElementById('cad-email').value.trim();
    const senha = document.getElementById('cad-senha').value.trim();
    const cpf = document.getElementById('cad-cpf').value.trim();

    if (!nome || !email || !senha || !cpf) { alert("Preencha todos os dados."); return; }
    if (!cpfCadastroValido) { alert("Impossível cadastrar: CPF Inválido."); return; }

    fetch(`${API_BASE_URL}/api/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome, email: email, senha: senha, cpf: cpf })
    })
    .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.mensagem); });
        return res.json();
    })
    .then(dados => {
        usuarioLogado = { nome: dados.nome, email: dados.email, nivel: dados.nivel };
        localStorage.setItem('controlstock_sessao', JSON.stringify(usuarioLogado));
        aplicarSessaoUsuario();
        fecharAuthModal();
        alert(`🎉 Bem-vindo! Cadastro realizado com sucesso.`);
    })
    .catch(err => alert(`❌ Erro ao cadastrar: ${err.message}`));
}


// =======================================================================
// BLOCO 8: 👤 GERENCIAMENTO DE SESSÃO (ADMIN VS CLIENTE)
// =======================================================================
function aplicarSessaoUsuario() {
    document.getElementById('btn-entrar-topo').style.display = "none";
    document.getElementById('painel-user-topo').style.display = "flex";
    document.getElementById('label-nome-user').innerText = usuarioLogado.nome;
    document.getElementById('avatar-letra').innerText = usuarioLogado.nome.substring(0,1).toUpperCase();
    document.getElementById('alerta-login-checkout').style.display = "none";

    const botoesAdmin = document.querySelectorAll('.admin-only');
    botoesAdmin.forEach(btn => btn.style.display = "none");

    if (usuarioLogado.nivel === "ADMIN") {
        document.getElementById('painel-admin-bloqueado').style.display = "none";
        document.getElementById('painel-admin-liberado').style.display = "block";

        botoesAdmin.forEach(btn => btn.style.display = "block");

        atualizarDashboardAdmin();
        carregarTabelasInventarioEAuditoria();
        carregarDadosEPrevisoesAdmin();
    }
    carregarProdutosDaAPI();
    atualizarInterface();
}

function deslogarUsuario() {
    usuarioLogado = null;
    localStorage.removeItem('controlstock_sessao');

    document.getElementById('btn-entrar-topo').style.display = "flex";
    document.getElementById('painel-user-topo').style.display = "none";
    document.getElementById('alerta-login-checkout').style.display = "block";
    document.getElementById('painel-admin-bloqueado').style.display = "block";
    document.getElementById('painel-admin-liberado').style.display = "none";

    document.querySelectorAll('.admin-only').forEach(btn => btn.style.display = "none");

    document.getElementById('login-email').value = "";
    document.getElementById('login-senha').value = "";
    document.getElementById('cad-nome').value = "";
    document.getElementById('cad-email').value = "";
    document.getElementById('cad-cpf').value = "";
    document.getElementById('cad-senha').value = "";
    document.getElementById('msg-cpf-cad').innerText = "";

    carregarProdutosDaAPI();
    atualizarInterface();
    mudarAba('vitrine');
}


// =======================================================================
// BLOCO 9: 🗂️ NAVEGAÇÃO ENTRE ABAS DO MARKETPLACE
// =======================================================================
function mudarAba(nomeAba) {
    document.querySelectorAll('.aba-painel').forEach(aba => aba.classList.remove('ativa'));
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('ativo'));
    const abaAlvo = document.getElementById('aba-' + nomeAba);
    if (abaAlvo) abaAlvo.classList.add('ativa');
    const btnAlvo = document.getElementById('btn-' + nomeAba);
    if (btnAlvo) btnAlvo.classList.add('ativo');
    if (nomeAba === 'carrinho') { atualizarInterface(); avancarWizard(1); }
    if (nomeAba === 'historico' && usuarioLogado) { carregarHistoricoPedidos(); }
    if (nomeAba === 'admin') {
        if (usuarioLogado && usuarioLogado.nivel === 'ADMIN') {
            document.getElementById('painel-admin-bloqueado').style.display = 'none';
            document.getElementById('painel-admin-liberado').style.display = 'block';
            atualizarDashboardAdmin();
            carregarTabelasInventarioEAuditoria();
        } else {
            document.getElementById('painel-admin-bloqueado').style.display = 'block';
            document.getElementById('painel-admin-liberado').style.display = 'none';
        }
    }
}


// =======================================================================
// BLOCO 10: 📦 HISTÓRICO DE PEDIDOS E ROMANEIOS
// =======================================================================
function carregarHistoricoPedidos() {
    if (!usuarioLogado) return;
    const corpo = document.getElementById('lista-pedidos-corpo');
    if (!corpo) return;
    corpo.innerHTML = "<tr><td colspan='5' style='text-align:center; color:var(--cor-subtexto);'>Carregando fluxo de faturamento...</td></tr>";

    fetch(API_BASE_URL + '/api/pedidos/historico')
        .then(res => {
            if (!res.ok) {
                throw new Error(`Erro HTTP! Status: ${res.status}`);
            }
            return res.json();
        })
        .then(pedidos => {
            corpo.innerHTML = '';
            if (!pedidos || pedidos.length === 0) {
                corpo.innerHTML = "<tr><td colspan='5' style='text-align:center; color:var(--cor-subtexto);'>📦 Nenhum romaneio faturado no sistema até o momento.</td></tr>";
                return;
            }
            pedidos.forEach(p => {
                corpo.innerHTML += '<tr><td><b>' + (p.codigo || p.id) + '</b></td><td>' + (p.dataEmissao || p.data || '-') + '</td><td style="color:var(--cor-sucesso); font-weight:bold;">' + (p.status || 'Faturado') + '</td><td style="text-align:right; font-weight:bold;">R$ ' + parseFloat(p.total || 0).toFixed(2) + '</td><td style="text-align:center;"><button class="btn-detalhes" onclick="verDetalhesRomaneio(' + p.id + ')">Ver</button></td></tr>';
            });
        })
        .catch(err => {
            console.error("Falha ao carregar romaneios gerenciais:", err);
            corpo.innerHTML = "<tr><td colspan='5' style='text-align:center; color:var(--cor-erro);'>Erro ao carregar histórico de romaneios.</td></tr>";
        });
}

function verDetalhesRomaneio(id) {
    const modal = document.getElementById('modalRomaneio');
    const corpoTabela = document.getElementById('detalhes-romaneio-itens-corpo');

    if (!modal) return;
    modal.classList.add('aberto');

    const txtCodigo = document.getElementById('romaneio-modal-codigo');
    if (txtCodigo) txtCodigo.innerText = `Carregando Romaneio #${id}...`;
    if (corpoTabela) corpoTabela.innerHTML = "<tr><td colspan='4' style='text-align:center; color:var(--cor-subtexto);'>Buscando itens faturados...</td></tr>";

    fetch(`${API_BASE_URL}/api/pedidos/detalhes/${id}`)
        .then(res => {
            if (!res.ok) throw new Error("Erro ao buscar detalhes do romaneio.");
            return res.json();
        })
        .then(pedido => {
            if (txtCodigo) txtCodigo.innerText = `ROMANEIO: ${pedido.codigo || pedido.id}`;

            const txtData = document.getElementById('romaneio-modal-data');
            if (txtData) txtData.innerText = pedido.dataEmissao || pedido.data || '-';

            const txtTotal = document.getElementById('romaneio-modal-total');
            if (txtTotal) txtTotal.innerText = `R$ ${parseFloat(pedido.total || 0).toFixed(2)}`;

            if (corpoTabela) {
                corpoTabela.innerHTML = "";
                if (!pedido.itens || pedido.itens.length === 0) {
                    corpoTabela.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Nenhum item listado neste faturamento.</td></tr>";
                    return;
                }

                pedido.itens.forEach(item => {
                    let tagTamanho = item.tamanho ? `<span style="background: #27273a; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-left: 6px;">TAM: ${item.tamanho}</span>` : '';
                    let precoUnitario = parseFloat(item.precoUnitario || item.preco || 0);
                    let subtotal = parseInt(item.quantidade || item.qtd || 1) * precoUnitario;

                    corpoTabela.innerHTML += `
                        <tr>
                            <td><b>${item.nome || 'Produto'}</b>${tagTamanho}</td>
                            <td style="text-align:center;">${item.quantidade || item.qtd}</td>
                            <td style="text-align:right;">R$ ${precoUnitario.toFixed(2)}</td>
                            <td style="text-align:right; font-weight:bold;">R$ ${subtotal.toFixed(2)}</td>
                        </tr>
                    `;
                });
            }
        })
        .catch(err => {
            console.error(err);
            if (corpoTabela) {
                corpoTabela.innerHTML = "<tr><td colspan='4' style='text-align:center; color:var(--cor-erro);'>Falha ao carregar os itens deste romaneio.</td></tr>";
            }
        });
}


// =======================================================================
// BLOCO 11: 🎯 MOTOR DE VALIDAÇÃO E CÁLCULO DE CUPONS DE DESCONTO
// =======================================================================
function aplicarCupomDesconto() {
    const cupomTexto = document.getElementById('input-cupom').value.trim().toUpperCase();
    const msgResultado = document.getElementById('msg-cupom-resultado');
    const txtCupomValor = document.getElementById('txtCupomValor');

    let totalCarrinhoBruto = 0;
    Object.keys(carrinho).forEach(id => {
        let item = carrinho[id];
        let precoFinal = item.precoOriginal;
        if (item.qtd >= 5) precoFinal = item.precoOriginal * 0.90;
        totalCarrinhoBruto += (precoFinal * item.qtd);
    });

    if (totalCarrinhoBruto === 0) {
        msgResultado.innerText = "⚠️ Adicione itens ao carrinho antes de aplicar um cupom.";
        msgResultado.style.color = "var(--cor-erro)";
        return;
    }

    if (!cupomTexto) {
        msgResultado.innerText = "⚠️ Digite o código de um cupom.";
        msgResultado.style.color = "var(--cor-erro)";
        return;
    }

    if (cupomTexto === "NOTA10") {
        descontoCupomAtivo = totalCarrinhoBruto * 0.15;
        msgResultado.innerText = `✓ Cupom NOTA10 Aplicado! Você ganhou 15% de desconto.`;
        msgResultado.style.color = "var(--cor-sucesso)";
    } else if (cupomTexto === "CONTROLSTOCK") {
        descontoCupomAtivo = 10.00;
        msgResultado.innerText = "✓ Cupom CONTROLSTOCK Aplicado! R$ 10,00 deduzidos.";
        msgResultado.style.color = "var(--cor-sucesso)";
    } else {
        descontoCupomAtivo = 0;
        msgResultado.innerText = "✗ Cupom inválido ou expirado.";
        msgResultado.style.color = "var(--cor-erro)";
    }

    txtCupomValor.innerText = `R$ ${descontoCupomAtivo.toFixed(2)}`;
    let novoTotalFinal = totalCarrinhoBruto - descontoCupomAtivo;
    if (novoTotalFinal < 0) novoTotalFinal = 0;

    document.getElementById('txtTotal').innerText = `R$ ${novoTotalFinal.toFixed(2)}`;
}


// =======================================================================
// BLOCO 12: 🛒 MECANISMO DE PRODUTOS E CARREGAMENTO DO BANCO SQLITE
// =======================================================================
function carregarProdutosDaAPI() {
    const vitrine = document.getElementById('vitrine-produtos');
    if (!vitrine) return;
    vitrine.innerHTML = "<p style='color: var(--cor-subtexto);'>Buscando catálogo no banco...</p>";

    fetch(`${API_BASE_URL}/api/produtos`)
        .then(res => res.json())
        .then(produtos => {
            vitrine.innerHTML = "";
            listaProdutosGlobal = produtos;

            if (produtos.length === 0) {
                vitrine.innerHTML = "<p>Nenhum item cadastrado no banco.</p>";
                return;
            }

            produtos.forEach(prod => {
                const esgotado = prod.quantidadeAtual <= 0;
                let staticLineEstoqueHtml = "";

                if (usuarioLogado && usuarioLogado.nivel === "ADMIN") {
                    staticLineEstoqueHtml = `<div class="estoque-prod" style="color:var(--cor-primaria); font-weight:bold;">Disponível: ${prod.quantidadeAtual} un</div>`;
                } else {
                    if (esgotado) {
                        staticLineEstoqueHtml = `<div class="estoque-prod" style="color:var(--cor-erro); font-size:12px;">❌ Temporariamente Esgotado</div>`;
                    } else if (prod.quantidadeAtual <= 3) {
                        staticLineEstoqueHtml = `<div class="estoque-prod" style="color:#ef4444; font-size:12px; font-weight:bold; animation: pulse 1.5s infinite;">⚡ Apenas ${prod.quantidadeAtual} un. restantes!</div>`;
                    } else {
                        staticLineEstoqueHtml = `<div class="estoque-prod" style="color:var(--cor-subtexto); font-size:12px;">⚡ Item Disponível</div>`;
                    }
                }

                const classeAlertaCritico = (prod.quantidadeAtual <= 5 && prod.quantidadeAtual > 0) ? "alerta-critico" : "";
                const urlPrimeiraFoto = (prod.fotos && prod.fotos.length > 0) ? prod.fotos[0].url : 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500';

                vitrine.innerHTML += `
                    <div class="card-produto ${classeAlertaCritico}">
                        <div class="container-foto">
                            <img src="${urlPrimeiraFoto}" id="img-card-${prod.id}" class="foto-prod" alt="${prod.nome}" onerror="this.src='https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500'">
                        </div>
                        <div class="info-corpo-card">
                            <div class="nome-prod">${prod.nome}</div>
                            <div class="preco-prod">R$ ${prod.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                            ${staticLineEstoqueHtml}
                            <div class="container-botoes-card">
                                <button class="btn-detalhes" onclick="abrirModal(${prod.id})">🔍 Detalhes</button>
                                <button class="btn-add" ${esgotado ? "disabled" : ""} onclick="abrirModal(${prod.id})">${esgotado ? 'Esgotado' : 'Adicionar'}</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            setTimeout(iniciarCarrosselAutomatico, 1000);
        }).catch(() => {
            vitrine.innerHTML = "<p style='color:var(--cor-erro);font-weight:bold;'>Servidor Backend Desconectado.</p>";
        });
}


// =======================================================================
// BLOCO 13: 🧮 LÓGICA E CÁLCULOS DA INTERFACE DO CARRINHO (ATACADO)
// =======================================================================
function adicionarAoCarrinho(id, nome, preco, estoqueMaximo, tamanhoEscolhido, qtdDesejada = 1) {
    if (!tamanhoEscolhido) {
        mostrarToast("⚠️ Por favor, selecione um tamanho nas especificações!", "aviso");
        return;
    }

    const chaveItem = `${id}-${tamanhoEscolhido}`;

    if (carrinho[chaveItem]) {
        if ((carrinho[chaveItem].qtd + qtdDesejada) > estoqueMaximo) {
            mostrarToast(`Estoque limite atingido! Disponível apenas ${estoqueMaximo} unidades.`, 'aviso');
            return;
        }
        carrinho[chaveItem].qtd += qtdDesejada;
    } else {
        carrinho[chaveItem] = {
            id: id,
            nome: nome,
            precoOriginal: preco,
            qtd: qtdDesejada,
            tamanho: tamanhoEscolhido
        };
    }

    mostrarToast(`✓ ${nome} (${tamanhoEscolhido}) adicionado ao carrinho!`, 'sucesso');
    atualizarInterface();
}

function removerDoCarrinho(chaveItem) {
    if (carrinho[chaveItem]) {
        delete carrinho[chaveItem];
        mostrarToast("Item removido do carrinho.", 'aviso');
        atualizarInterface();
    }
}

function atualizarInterface() {
    const corpo = document.getElementById('corpo-carrinho');
    if (!corpo) return;
    corpo.innerHTML = "";
    let totalGeral = 0, descontoAtacadoGeral = 0, itensTotais = 0;
    const chaves = Object.keys(carrinho);

    // 1. CÁLCULO PRÉVIO DO TOTAL BRUTO PARA A BARRA DE FRETE
    let totalBrutoParaFrete = 0;
    chaves.forEach(chave => {
        let item = carrinho[chave];
        let precoFinal = item.precoOriginal;
        if (item.qtd >= 5) {
            precoFinal = item.precoOriginal * 0.875;
        }
        totalBrutoParaFrete += (precoFinal * item.qtd);
    });

    // 2. BARRA DE PROGRESSO DO FRETE GRÁTIS (ALVO: R$ 500,00)
    let porcentagemMeta = Math.min((totalBrutoParaFrete / 500) * 100, 100);
    let textoProgresso = "";
    let corBarra = "var(--cor-primaria)";

    if (chaves.length === 0) {
        textoProgresso = "🛒 Adicione itens para liberar FRETE GRÁTIS para todo o Brasil (Alvo: R$ 500,00)";
        porcentagemMeta = 0;
    } else if (totalBrutoParaFrete >= 500) {
        textoProgresso = "🎉 PARABÉNS! Você liberou Frete Grátis para todo o Brasil!";
        corBarra = "#22c55e";
    } else {
        let restante = 500 - totalBrutoParaFrete;
        textoProgresso = `🚚 Faltam apenas R$ ${restante.toFixed(2)} para liberar FRETE GRÁTIS para todo o Brasil!`;
    }

    const containerProgressoExistente = document.getElementById('wrapper-progresso-atacado');
    if (containerProgressoExistente) containerProgressoExistente.remove();

    const progressoHtml = `
        <div id="wrapper-progresso-atacado" style="background: rgba(255,255,255,0.02); border: 1px solid #1e293b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #ffffff; margin-bottom: 8px;">
                <span>${textoProgresso}</span>
                <span>${Math.round(porcentagemMeta)}%</span>
            </div>
            <div style="background: #1e293b; height: 10px; border-radius: 5px; overflow: hidden; width: 100%;">
                <div style="background: ${corBarra}; height: 100%; width: ${porcentagemMeta}%; transition: width 0.4s ease, background-color 0.4s ease;"></div>
            </div>
        </div>
    `;

    corpo.closest('table').insertAdjacentHTML('beforebegin', progressoHtml);

    // 3. MONTAGEM DAS LINHAS DA TABELA DO CARRINHO
    if (chaves.length === 0) {
        corpo.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--cor-subtexto);">Seu carrinho está vazio.</td></tr>`;
        descontoCupomAtivo = 0;
    } else {
        chaves.forEach(chave => {
            let item = carrinho[chave];
            let precoFinal = item.precoOriginal;
            let tagAtacado = "";
            itensTotais += item.qtd;

            if (item.qtd >= 5) {
                let descUnidade = item.precoOriginal * 0.125;
                precoFinal = item.precoOriginal - descUnidade;
                descontoAtacadoGeral += (descUnidade * item.qtd);
                tagAtacado = "<span style='color: var(--cor-destaque); font-size: 11px; margin-left:8px;'>🔥 Atacado -12.5%</span>";
            }

            let subtotalItem = item.qtd * precoFinal;
            totalGeral += subtotalItem;

            let tagTamanhoHtml = `<span style="background: #27273a; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-left: 6px;">TAM: ${item.tamanho}</span>`;

            corpo.innerHTML += `
                <tr>
                    <td>
                        <button onclick="removerDoCarrinho('${chave}')" style="background:none; border:none; color:var(--cor-erro); cursor:pointer; margin-right:8px;">❌</button>
                        <b>${item.nome}</b>${tagTamanhoHtml}${tagAtacado}
                    </td>
                    <td style="text-align:center;">${item.qtd}</td>
                    <td style="text-align:right;">R$ ${precoFinal.toFixed(2)}</td>
                    <td style="text-align:right;font-weight:bold;">R$ ${subtotalItem.toFixed(2)}</td>
                </tr>`;
        });
    }

    // 4. ATUALIZAÇÃO DOS CAMPOS DE TOTAIS E BOTÕES
    let totalFinal = totalGeral - descontoCupomAtivo;
    if (totalFinal < 0) totalFinal = 0;

    document.getElementById('txtTotal').innerText = `R$ ${totalFinal.toFixed(2)}`;
    document.getElementById('txtDesconto').innerText = `- R$ ${descontoAtacadoGeral.toFixed(2)}`;
    document.getElementById('badge-qtd').innerText = itensTotais;

    const btnPasso1 = document.getElementById('btn-avancar-para-endereco');
    const alertaLogin = document.getElementById('alerta-login-checkout');
    const btnFinalizar = document.getElementById('btnFinalizar');

    if (itensTotais > 0 && usuarioLogado !== null) {
        if (btnPasso1) btnPasso1.disabled = false;
        if (alertaLogin) alertaLogin.style.display = "none";
        if (btnFinalizar) btnFinalizar.disabled = false;
    } else {
        if (btnPasso1) btnPasso1.disabled = true;
        if (alertaLogin) alertaLogin.style.display = "block";
        if (btnFinalizar) btnFinalizar.disabled = true;
    }
    localStorage.setItem('controlstock_carrinho', JSON.stringify(carrinho));
}


// =======================================================================
// BLOCO 14: 🚚 LOGÍSTICA DE ENTREGA E FRETE DO CHECKOUT
// =======================================================================
function calcularFreteCheckout() {
    const cepInput = document.getElementById('cep-checkout').value.trim();
    const display = document.getElementById('resultado-frete-checkout');

    let totalFinal = parseFloat(document.getElementById('txtTotal').innerText.replace("R$ ", "").replace(".", "").replace(",", "."));
    if (totalFinal >= 500) {
        display.innerHTML = '<span style="color:#22c55e; font-weight:bold;">🚚 Frete Grátis Ativado por atingir o valor mínimo!</span>';
        return;
    }

    if (!cepInput) {
        alert("⚠️ Por favor, informe o CEP para calcular o frete.");
        return;
    }

    const cep = cepInput.replace(/\D/g, "");
    if (cep.length !== 8) {
        display.innerHTML = '<span style="color:var(--cor-erro);">CEP inválido. Use 8 dígitos.</span>';
        return;
    }

    if (cep.startsWith("11")) {
        display.innerHTML = '<span style="color:var(--cor-sucesso); font-weight:bold;">🚚 Frete Expresso Local: R$ 9,90 (Entrega em 24h)</span>';
    } else {
        display.innerHTML = '<span style="color:var(--cor-primaria);">📦 Envio Padrão Nacional: R$ 24,90 (4 a 7 dias úteis)</span>';
    }
}

async function buscarCepAuto() {
    const cepInput = document.getElementById('cep-checkout').value.trim();
    const cep = cepInput.replace(/\D/g, "");

    if (cep.length !== 8) return;

    try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await resposta.json();

        if (dados.erro) {
            mostrarToast("❌ CEP não encontrado na base dos Correios.", "erro");
            return;
        }

        document.getElementById('ent-rua').value = dados.logradouro;
        document.getElementById('ent-bairro').value = dados.bairro;

        mostrarToast("✓ Endereço localizado e preenchido!", "sucesso");

    } catch (erro) {
        console.error("Erro ao buscar CEP:", erro);
        mostrarToast("⚠️ Falha ao conectar com o serviço de CEP.", "aviso");
    }
}


// =======================================================================
// BLOCO 15: 💳 CHECKOUT, GATEWAY E SISTEMA IMPRESSOR DE ROMANEIO (PDF)
// =======================================================================
function alternarCamposPagamento(tipo) {
    const card = document.getElementById('dados-cartao');
    if (card) {
        if (tipo === 'Crédito' || tipo === 'Débito' || tipo === 'CARTAO' || tipo === 'DEBITO') {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    }

    const elementoTotal = document.getElementById('txtTotal');
    const displaySimulador = document.getElementById('simulador-parcelas-checkout');
    if (!elementoTotal || !displaySimulador) return;

    let textoObtido = elementoTotal.innerText;
    let apenasNumeros = textoObtido.replace(/[^\d,. ]/g, "").trim();
    let valorTotalReal = 0;

    if (apenasNumeros.includes(".") && apenasNumeros.includes(",")) {
        apenasNumeros = apenasNumeros.replace(/\./g, "").replace(",", ".");
        valorTotalReal = parseFloat(apenasNumeros);
    } else if (apenasNumeros.includes(",")) {
        apenasNumeros = apenasNumeros.replace(",", ".");
        valorTotalReal = parseFloat(apenasNumeros);
    } else {
        valorTotalReal = parseFloat(apenasNumeros);
    }

    if (isNaN(valorTotalReal) || valorTotalReal <= 0) {
        valorTotalReal = 0;
    }

    if (tipo === 'PIX') {
        const descontoPix = valorTotalReal * 0.05;
        const totalComDesconto = valorTotalReal - descontoPix;
        displaySimulador.style.color = "var(--cor-sucesso)";
        displaySimulador.innerHTML = `📱 <b>À vista no PIX:</b> R$ ${totalComDesconto.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span style="font-size:11px; color:var(--cor-subtexto);">(Economize 5%)</span>`;

    } else if (tipo === 'Crédito' || tipo === 'CARTAO') {
        displaySimulador.style.color = "var(--cor-primaria)";

        let htmlSelect = `
            <label style="display:block; margin-bottom:8px; font-weight:bold; color:#fff;">💳 Opções de Parcelamento:</label>
            <select id="select-parcelas-checkout" style="width:100%; padding:10px; background:#0f172a; border:1px solid #334155; color:#fff; border-radius:4px; font-size:14px; cursor:pointer;">
        `;

        for (let i = 1; i <= 12; i++) {
            const valorDaParcela = valorTotalReal / i;
            const parcelaFormatada = valorDaParcela.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            htmlSelect += `<option value="${i}">${i}x de R$ ${parcelaFormatada} sem juros</option>`;
        }

        htmlSelect += `</select>`;
        displaySimulador.innerHTML = htmlSelect;

    } else if (tipo === 'Débito' || tipo === 'DEBITO') {
        displaySimulador.style.color = "#fff";
        displaySimulador.innerHTML = `💳 <b>À vista no Débito:</b> 1x de R$ ${valorTotalReal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} sem tarifas.`;

    } else if (tipo === 'Boleto') {
        displaySimulador.style.color = "var(--cor-destaque)";
        displaySimulador.innerHTML = `📄 <b>Boleto Bancário:</b> R$ ${valorTotalReal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} à vista <span style="font-size:11px; color:var(--cor-subtexto);">(Compensação em até 48h úteis)</span>`;
    }
}

function validarDadosCheckout(formaPgto) {
    const campoNome = document.getElementById('ent-nome');
    const campoCpf = document.getElementById('ent-cpf');

    if (campoNome && campoCpf) {
        const nome = campoNome.value.trim();
        const cpf = campoCpf.value.trim().replace(/\D/g, "");

        if (!nome || !cpf) {
            alert("⚠️ Por favor, preencha os dados de entrega (Nome e CPF no Passo 2).");
            return false;
        }
        if (!verificarCPF(cpf)) {
            alert("❌ Antifraude: O CPF informado para a entrega é inválido!");
            return false;
        }
    }

    const usaCartao = formaPgto === 'Crédito' || formaPgto === 'Débito' || document.getElementById('dados-cartao').style.display === 'flex';
    if (usaCartao) {
        const num = document.getElementById('card-numero').value.trim().replace(/\D/g, "");
        const nomeCartao = document.getElementById('card-nome').value.trim();
        const val = document.getElementById('card-validade').value.trim();
        const cvv = document.getElementById('card-cvv').value.trim();

        if (!num || !nomeCartao || !val || !cvv) {
            alert("❌ Erro de Segurança: Para pagamentos em Cartão, todos os campos são estritamente obrigatórios!");
            return false;
        }
        if (!validarCartaoMatematico(num)) {
            alert("❌ Antifraude: Número de cartão inválido ';rejeitado pelo teste matemático de Luhn!");
            return false;
        }
    }
    return true;
}

function baixarRomaneioPDF() {
    const codRomaneio = document.getElementById('romaneio-titulo-cod')?.innerText || ("CS-" + Math.floor(Math.random() * 90000 + 10000));
    const dataEmissao = document.getElementById('romaneio-data')?.innerText || new Date().toLocaleString('pt-BR');

    const rua = document.getElementById('ent-rua')?.value || "";
    const num = document.getElementById('ent-num')?.value || "";
    const bairro = document.getElementById('ent-bairro')?.value || "";
    const localEntrega = `${rua}, ${num} - ${bairro}`;

    const totalGeral = document.getElementById('txtTotal').innerText;
    const nomeDestinatario = document.getElementById('ent-nome')?.value || "Não informado";
    const itensCorpoHtml = document.getElementById('corpo-carrinho').innerHTML;

    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(`
        <html>
        <head>
            <title>Romaneio ${codRomaneio}</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                html, body { background-color: #0b0a12 !important; color: #e2e8f0 !important; font-family: 'Segoe UI', system-ui, sans-serif; padding: 20px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .comprovante-wrapper { max-width: 740px; margin: 0 auto; background-color: #13111c !important; border: 1px solid #2a2440; padding: 35px; border-radius: 14px; }
                .topo-faturamento { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #221f33; padding-bottom: 20px; margin-bottom: 25px; }
                .marca-sistema { font-size: 26px; font-weight: 800; color: #ffffff !important; }
                .marca-sistema span { color: #a855f7 !important; }
                .token-autenticacao { background-color: #1a1827 !important; border: 1px solid #a855f7; color: #c084fc !important; padding: 8px 14px; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: 700; }
                .sub-titulo-secao { font-size: 14px; text-transform: uppercase; color: #a855f7 !important; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px; margin-top: 25px; }
                .painel-dados { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background-color: #1a1827 !important; padding: 20px; border-radius: 8px; border: 1px solid #221f33; }
                .item-dado p { font-size: 11px; text-transform: uppercase; color: #64748b !important; font-weight: 600; margin-bottom: 4px; }
                .item-dado span { font-size: 14px; font-weight: 600; color: #f1f5f9 !important; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { background-color: #1a1827 !important; color: #94a3b8 !important; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 12px 16px; border-bottom: 2px solid #221f33; text-align: left; }
                td { padding: 16px; border-bottom: 1px solid #221f33; color: #e2e8f0 !important; font-size: 13px; }
                td span { background: rgba(245, 158, 11, 0.1) !important; color: #fbbf24 !important; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
                .bloco-fechamento { display: flex; justify-content: flex-end; align-items: center; gap: 15px; background-color: #1a1827 !important; padding: 20px; border-radius: 8px; border: 1px solid #221f33; margin-top: 25px; }
                .total-txt { font-size: 13px; color: #94a3b8 !important; font-weight: 700; text-transform: uppercase; }
                .total-num { font-size: 24px; font-weight: 900; color: #22c55e !important; }
                @media print {
                    html, body { background-color: #0b0a12 !important; color: #e2e8f0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .comprovante-wrapper { background-color: #13111c !important; border: 1px solid #2a2440 !important; }
                    .painel-dados, th, .bloco-fechamento, .token-autenticacao { background-color: #1a1827 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            </style>
        </head>
        <body>
            <div class="comprovante-wrapper">
                <div class="topo-faturamento">
                    <div class="marca-sistema">ControlStock<span>+</span></div>
                    <div class="token-autenticacao">ROMANEIO: ${codRomaneio}</div>
                </div>
                <div class="sub-titulo-secao">📦 Informações de Distribuição</div>
                <div class="painel-dados">
                    <div class="item-dado">
                        <p>Data e Hora de Emissão</p>
                        <span>${dataEmissao}</span>
                    </div>
                    <div class="item-dado">
                        <p>Destinatário de Despacho</p>
                        <span>${nomeDestinatario}</span>
                    </div>
                    <div class="item-dado" style="grid-column: span 2;">
                        <p>Endereço de Entrega Cadastrado</p>
                        <span>${localEntrega}</span>
                    </div>
                    <div class="item-dado" style="grid-column: span 2;">
                        <p>Status do Romaneio no Sistema</p>
                        <span style="color: #22c55e !important; font-weight: bold;">✓ Sincronizado e Armazenado no SQLite</span>
                    </div>
                </div>
                <div class="sub-titulo-secao">📋 Itens do Faturamento</div>
                <table>
                    <thead>
                        <tr>
                            <th>Especificação do Produto</th>
                            <th style="text-align:center;">Qtd</th>
                            <th style="text-align:right;">Métrica Unitária</th>
                            <th style="text-align:right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itensCorpoHtml}
                    </tbody>
                </table>
                <div class="bloco-fechamento">
                    <div class="total-txt">Total Geral Faturado:</div>
                    <div class="total-num">${totalGeral}</div>
                </div>
            </div>
        </body>
        </html>
    `);

    janelaImpressao.document.close();
    janelaImpressao.print();
}


// =======================================================================
// BLOCO 16: ⚙️ ADMINISTRAÇÃO — LOTE, GESTÃO DE PRODUTOS E CADASTROS
// =======================================================================
function registrarEntradaLote() {
    const inputId = document.getElementById('lote-id');
    const inputQtd = document.getElementById('lote-qtd');
    const inputObs = document.getElementById('lote-obs');

    if (!inputId || !inputQtd) {
        console.error("Erro de portfólio: Os inputs 'lote-id' ou 'lote-qtd' não foram encontrados no HTML.");
        return;
    }

    const id = parseInt(inputId.value, 10);
    const qtd = parseInt(inputQtd.value, 10);
    const obs = inputObs ? inputObs.value.trim() : "Carga de reabastecimento.";

    if (isNaN(id) || isNaN(qtd) || qtd <= 0) {
        alert("⚠️ Por favor, informe um ID válido e uma Quantidade maior que zero!");
        return;
    }

    if (!id || !qtd) { alert("⚠️ Preencha o ID e a Quantidade do lote."); return; }

    fetch(`${API_BASE_URL}/api/admin/estoque/lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId: id, quantidade: qtd, observacao: obs })
    })
    .then(res => {
        if (!res.ok) throw new Error("Erro ao registrar entrada.");
        return res.json();
    })
    .then(dados => {
        alert(dados.mensagem);
        inputId.value = "";
        inputQtd.value = "";
        if (inputObs) inputObs.value = "";

        carregarProdutosDaAPI();
        atualizarDashboardAdmin();
        carregarTabelasInventarioEAuditoria();
    })
    .catch(() => alert("❌ Erro ao salvar lote no banco SQLite."));
}

function salvarAlteracoesProduto() {
    const id = document.getElementById('gerenciar-id').value;
    const nome = document.getElementById('gerenciar-nome').value.trim();
    const precoBase = parseFloat(document.getElementById('gerenciar-preco').value) || 0;
    const desconto = parseInt(document.getElementById('gerenciar-desconto').value) || 0;
    const url1 = document.getElementById('gerenciar-url1').value.trim();
    const url2 = document.getElementById('gerenciar-url2').value.trim();
    const url3 = document.getElementById('gerenciar-url3').value.trim();

    if (!id) {
        alert("⚠️ Você precisa informar o ID do produto para editá-lo!");
        return;
    }

    const payload = {
        produtoId: parseInt(id),
        novoNome: nome || null,
        novoPrecoBase: precoBase,
        porcentagemDesconto: desconto,
        url1: url1 || null,
        url2: url2 || null,
        url3: url3 || null
    };

    fetch(`${API_BASE_URL}/api/admin/produtos/precos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error("Não foi possível atualizar o produto. Status: " + res.status);
        return res.json();
    })
    .then(dados => {
        alert(dados.mensagem);
        document.getElementById('gerenciar-id').value = "";
        document.getElementById('gerenciar-nome').value = "";
        document.getElementById('gerenciar-preco').value = "";
        document.getElementById('gerenciar-desconto').value = "";
        document.getElementById('gerenciar-url1').value = "";
        document.getElementById('gerenciar-url2').value = "";
        document.getElementById('gerenciar-url3').value = "";

        carregarProdutosDaAPI();
        atualizarDashboardAdmin();
        carregarTabelasInventarioEAuditoria();
    })
    .catch(err => {
        console.error(err);
        alert("❌ Erro ao atualizar o produto. Verifique se o ID existe e se o C# está rodando.");
    });
}

function excluirProdutoDoSistema() {
    const id = document.getElementById('gerenciar-id').value;

    if (!id) {
        alert("⚠️ Digite o ID do produto para poder excluí-lo!");
        return;
    }

    if (!confirm(`🚨 ATENÇÃO: Tem certeza absoluta que deseja excluir o produto ID ${id} permanentemente do banco de dados?`)) {
        return;
    }

    fetch(`${API_BASE_URL}/api/admin/produtos/excluir/${id}`, {
        method: 'DELETE'
    })
    .then(res => {
        if (!res.ok) throw new Error("Erro ao deletar registro.");
        return res.json();
    })
    .then(dados => {
        alert(dados.mensagem);
        document.getElementById('gerenciar-id').value = "";

        carregarProdutosDaAPI();
        atualizarDashboardAdmin();
        carregarTabelasInventarioEAuditoria();
    })
    .catch(err => {
        console.error(err);
        alert("❌ Falha ao tentar excluir. O produto pode não existir.");
    });
}

function cadastrarProdutoPeloSite() {
    const nome = document.getElementById('prod-nome').value.trim();
    const preco = parseFloat(document.getElementById('prod-preco').value);
    const estoque = parseInt(document.getElementById('prod-qtd').value) || 0;
    const url1 = document.getElementById('prod-url-1').value.trim();
    const url2 = document.getElementById('prod-url-2').value.trim();
    const url3 = document.getElementById('prod-url-3').value.trim();

    if (!nome || !preco || !url1 || !url2) {
        alert("⚠️ Preencha Nome, Preço e pelo menos as 2 primeiras fotos obrigatórias.");
        return;
    }

    fetch(`${API_BASE_URL}/api/admin/produtos/novo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, preco, estoqueInicial: estoque, url1, url2, url3 })
    })
    .then(res => {
        if (!res.ok) throw new Error("Erro ao cadastrar.");
        return res.json();
    })
    .then(dados => {
        alert(dados.mensagem);
        document.getElementById('prod-nome').value = "";
        document.getElementById('prod-preco').value = "";
        document.getElementById('prod-qtd').value = "";
        document.getElementById('prod-url-1').value = "";
        document.getElementById('prod-url-2').value = "";
        document.getElementById('prod-url-3').value = "";

        carregarProdutosDaAPI();
        atualizarDashboardAdmin();
        carregarTabelasInventarioEAuditoria();
    }).catch(() => alert("❌ Falha crítica ao salvar produto no banco de dados."));
}

async function gerarProdutoComIA() {
    const inputPrompt = document.getElementById('prod-prompt-ia');
    const inputNome = document.getElementById('prod-nome');

    const termoBusca = (inputPrompt && inputPrompt.value.trim() !== "")
        ? inputPrompt.value.trim()
        : (inputNome ? inputNome.value.trim() : "");

    if (!termoBusca) {
        mostrarToast("⚠️ Insira o nome do produto ou use o campo de IA para pesquisar!", "aviso");
        return;
    }

    const btnGerar = document.getElementById('btn-gerar-ia');
    let textoOriginal = "";
    if (btnGerar) {
        textoOriginal = btnGerar.innerHTML;
        btnGerar.innerHTML = "⏳ A pesquisar...";
        btnGerar.disabled = true;
    }

    try {
        mostrarToast("🤖 Buscando dados e fotos oficiais...", "aviso");

        const resposta = await fetch(`${API_BASE_URL}/api/ia/gerar-produto?termo=${encodeURIComponent(termoBusca)}`);
        if (!resposta.ok) throw new Error("Erro na resposta do backend.");

        const dados = await resposta.json();

        if (inputNome && dados.nome) inputNome.value = dados.nome;

        const inputPreco = document.getElementById('prod-preco');
        if (inputPreco && dados.preco) inputPreco.value = dados.preco;

        if (dados.imagens && dados.imagens.length > 0) {
            const inputUrl1 = document.getElementById('prod-url-1');
            const inputUrl2 = document.getElementById('prod-url-2');
            const inputUrl3 = document.getElementById('prod-url-3');

            if (inputUrl1) inputUrl1.value = dados.imagens[0] || "";
            if (inputUrl2) inputUrl2.value = dados.imagens[1] || "";
            if (inputUrl3) inputUrl3.value = dados.imagens[2] || "";
        }

        mostrarToast("✨ Preenchido com sucesso!", "sucesso");

    } catch (erro) {
        console.error(erro);
        mostrarToast("❌ Erro ao falar com o backend de IA.", "erro");
    } finally {
        if (btnGerar) {
            btnGerar.innerHTML = textoOriginal;
            btnGerar.disabled = false;
        }
    }
}

function baixarRelatorioEstoqueCSV() {
    window.open(`${API_BASE_URL}/api/admin/relatorios/exportar`);
}

function buscarImagensAutomaticas() {
    const url1 = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600';
    let url2 = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600';
    let url3 = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600';

    document.getElementById('prod-url-1').value = url1;
    document.getElementById('prod-url-2').value = url2;
    document.getElementById('prod-url-3').value = url3;

    alert("🤖 Modo de Demonstração Acadêmica: URLs padrão do catálogo de teste vinculadas com sucesso!");
}


// =======================================================================
// BLOCO 17: 📊 DASHBOARD ADMIN — SINCRONIZADORES FINANCEIROS E TABELAS LIVE
// =======================================================================
function carregarDadosEPrevisoesAdmin() {
    const containerPrevisoes = document.getElementById('lista-previsoes-ia');
    if (!containerPrevisoes) return;

    fetch(`${API_BASE_URL}/api/admin/previsoes`)
        .then(res => res.json())
        .then(dados => {
            containerPrevisoes.innerHTML = "";
            dados.forEach(item => {
                containerPrevisoes.innerHTML += `
                    <li style="margin-bottom: 8px; font-size: 13px;">
                        🔹 <b>ID #${item.id} - ${item.nome}:</b> Est. atual: ${item.quantidadeAtual} un. 
                        <br><span style="color: var(--cor-primaria); font-weight: 500;">🤖 Análise IA: ${item.previsaoEsgotamento}</span>
                    </li>
                `;
            });
        }).catch(() => containerPrevisoes.innerHTML = "<li>Sem previsões históricas calculadas no momento.</li>");
}

async function atualizarDashboardAdmin() {
    if (!usuarioLogado || usuarioLogado.nivel !== "ADMIN") return;

    try {
        const resposta = await fetch(`${API_BASE_URL}/api/admin/dashboard/topo`);
        if (!resposta.ok) return;

        const dados = await resposta.json();

        const txtPatrimonio = document.getElementById('dash-patrimonio');
        const txtPedidos = document.getElementById('dash-vendas');
        const txtSaidas = document.getElementById('dash-itens');

        if (txtPatrimonio) {
            txtPatrimonio.innerText = dados.patrimonioEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        if (txtPedidos) {
            txtPedidos.innerText = dados.pedidosFaturados;
        }
        if (txtSaidas) {
            txtSaidas.innerText = `${dados.totalItensSaidos} un`;
        }
    } catch (erro) {
        console.error("Erro ao sincronizar dados em tempo real do painel:", erro);
    }
}

async function carregarTabelasInventarioEAuditoria() {
    if (!usuarioLogado || usuarioLogado.nivel !== "ADMIN") return;

    try {
        const resposta = await fetch(`${API_BASE_URL}/api/admin/dashboard`);
        if (!resposta.ok) return;

        const dados = await resposta.json();

        const tabelaEstoque = document.getElementById('tabela-monitoramento-estoque');
        if (tabelaEstoque) {
            tabelaEstoque.innerHTML = "";
            listaProdutosGlobal.forEach(p => {
                tabelaEstoque.innerHTML += `
                    <tr>
                        <td><b>#${p.id}</b></td>
                        <td>${p.nome}</td>
                        <td>R$ ${p.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                        <td style="font-weight:bold; text-align: center; color:${p.quantidadeAtual <= 3 ? '#ef4444' : 'var(--cor-sucesso)'}; background:${p.quantidadeAtual <= 3 ? 'rgba(239,68,68,0.1)' : 'transparent'}">${p.quantidadeAtual} un.</td>
                        <td style="text-align: center;"><span style="font-size:12px; color:var(--cor-primaria)">✓ Sincronizado no SQLite</span></td>
                    </tr>
                `;
            });
        }

        const tabelaAuditoria = document.getElementById('lista-auditorias-live');
        if (tabelaAuditoria && dados.auditoria) {
            tabelaAuditoria.innerHTML = "";
            dados.auditoria.forEach(aud => {
                const badgeTipo = aud.tipo == "ENTRADA" || aud.tipo == "CADASTRO"
                    ? `<span style="color:var(--cor-sucesso); font-weight:bold;">📥 ${aud.tipo}</span>`
                    : `<span style="color:var(--cor-erro); font-weight:bold;">📤 ${aud.tipo}</span>`;

                tabelaAuditoria.innerHTML += `
                    <tr>
                        <td><b>#${aud.id}</b></td>
                        <td>Prod #${aud.produtoId}</td>
                        <td>${badgeTipo}</td>
                        <td style="text-align: center; font-weight: bold;">${aud.quantidade}</td>
                        <td>${aud.observacao}</td>
                    </tr>
                `;
            });
        }

        const containerGrafico = document.getElementById('container-grafico');
        if (containerGrafico && dados.grafico) {
            containerGrafico.innerHTML = "";
            dados.grafico.forEach(g => {
                containerGrafico.innerHTML += `
                    <div style="margin-bottom: 10px;">
                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                            <span>${g.produto}</span>
                            <span style="color:var(--cor-sucesso); font-weight:bold;">R$ ${g.faturamento.toFixed(2)}</span>
                        </div>
                        <div style="background:#1e293b; height:8px; border-radius:4px; overflow:hidden;">
                            <div style="background:var(--cor-sucesso); height:100%; width: 100%;"></div>
                        </div>
                    </div>
                `;
            });
        }

    } catch (err) {
        console.error("Erro ao popular tabelas administrativas:", err);
    }
}


// =======================================================================
// BLOCO 18: 🚚 FRETE SIMULADO NO MODAL DO PRODUTO
// =======================================================================
function calcularFreteSimulado() {
    const cepInput = document.getElementById('cep-frete').value.trim();
    const containerResultado = document.getElementById('resultado-frete-modal');

    if (!cepInput) {
        alert("⚠️ Por favor, digite um CEP para realizar a simulação.");
        return;
    }

    const cepLimpo = cepInput.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
        containerResultado.innerHTML = `<span style="color: var(--cor-erro); font-weight: bold;">❌ Formato de CEP inválido. Use 8 dígitos.</span>`;
        return;
    }

    if (cepLimpo.startsWith("11")) {
        containerResultado.innerHTML = `
            <div style="background: rgba(34,197,94,0.1); border: 1px solid var(--cor-sucesso); padding: 10px; border-radius: 6px; margin-top: 5px;">
                <span style="color: var(--cor-sucesso); font-weight: bold;">🚚 Frete Expresso Regional Ativo!</span>
                <br><span style="color: #fff;">Valor: <b>R$ 9,90</b></span>
                <br><span style="color: var(--cor-subtexto); font-size: 12px;">Prazo: Entrega em até <b>24 horas</b> via nossa logística local em São Vicente e Região.</span>
            </div>
        `;
    } else {
        containerResultado.innerHTML = `
            <div style="background: #1e293b; border: 1px solid #334155; padding: 10px; border-radius: 6px; margin-top: 5px;">
                <span style="color: var(--cor-primaria); font-weight: bold;">📦 Envio padrão nacional</span>
                <br><span style="color: #fff;">Valor: <b>R$ 24,90</b></span>
                <br><span style="color: var(--cor-subtexto); font-size: 12px;">Prazo: de 4 a 7 dias úteis através de transportadoras parceiras.</span>
            </div>
        `;
    }
}


// =======================================================================
// BLOCO 19: 🛍️ FILTROS DA VITRINE (BUSCA E CATEGORIA)
// =======================================================================
function filtrarProdutosVitrine() {
    const termoBusca = document.getElementById('busca-vitrine').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.lista-produtos .card-produto');

    cards.forEach(card => {
        const nomeProduto = card.querySelector('.nome-prod').innerText.toLowerCase();
        if (nomeProduto.includes(termoBusca)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

function filtrarPorCategoria(categoriaAlvo, botaoClicado) {
    document.querySelectorAll('.btn-filtro-tag').forEach(btn => {
        btn.style.background = "#1e1b29";
        btn.style.color = "#fff";
        btn.style.border = "1px solid #334155";
    });

    botaoClicado.style.background = "var(--cor-primaria)";
    botaoClicado.style.color = "#000";
    botaoClicado.style.border = "none";

    const cards = document.querySelectorAll('.card-produto');

    cards.forEach(card => {
        const nomeProduto = card.querySelector('h3')?.innerText.toUpperCase() || "";

        if (categoriaAlvo === 'TODOS') {
            card.style.display = "block";
        } else {
            if (nomeProduto.includes(categoriaAlvo) || nomeProduto.includes('JAQUETA') && categoriaAlvo === 'AGASALHO') {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        }
    });
}


// =======================================================================
// BLOCO 20: 🌗 SISTEMA DE ALTERNAÇÃO DE TEMA (DARK / LIGHT MODE)
// =======================================================================
function alternarTemaSite() {
    const raizHtml = document.documentElement;
    const btnTema = document.getElementById('btn-tema');

    const éTemaClaro = raizHtml.getAttribute('data-tema') === 'light';

    if (éTemaClaro) {
        raizHtml.removeAttribute('data-tema');
        raizHtml.style.setProperty('--bg-principal', '#000000');
        raizHtml.style.setProperty('--bg-card', '#0d0d11');
        raizHtml.style.setProperty('--cor-texto', '#ffffff');
        raizHtml.style.setProperty('--cor-subtexto', '#94a3b8');

        btnTema.innerText = '🌙';
        mostrarToast("🌌 Modo Escuro Ativado", "sucesso");
    } else {
        raizHtml.setAttribute('data-tema', 'light');
        raizHtml.style.setProperty('--bg-principal', '#f8fafc');
        raizHtml.style.setProperty('--bg-card', '#ffffff');
        raizHtml.style.setProperty('--cor-texto', '#0f172a');
        raizHtml.style.setProperty('--cor-subtexto', '#475569');

        btnTema.innerText = '☀️';
        mostrarToast("☀️ Modo Claro Ativado", "sucesso");
    }
}


// =======================================================================
// BLOCO 21: 📱 FORÇADOR DE VISIBILIDADE MOBILE
// =======================================================================
function forcarLayoutBotoesMobile() {
    const ehMobile = window.innerWidth <= 768;
    if (!ehMobile) return;

    const usuarioLogado = localStorage.getItem('usuarioLogado') || sessionStorage.getItem('usuarioLogado');
    const ehAdministrador = usuarioLogado === 'admin' || (typeof isAdmin !== 'undefined' && isAdmin);

    const btnHistorico = document.getElementById('btn-historico');
    const btnAdmin = document.getElementById('btn-admin');

    if (!ehAdministrador) {
        if (btnHistorico) btnHistorico.style.setProperty('display', 'none', 'important');
        if (btnAdmin) btnAdmin.style.setProperty('display', 'none', 'important');
    } else {
        if (btnHistorico) btnHistorico.style.setProperty('display', 'inline-flex', 'important');
        if (btnAdmin) btnAdmin.style.setProperty('display', 'inline-flex', 'important');
    }
}

window.addEventListener('DOMContentLoaded', forcarLayoutBotoesMobile);
window.addEventListener('resize', forcarLayoutBotoesMobile);


// =======================================================================
// BLOCO 22: 🔔 SISTEMA CENTRALIZADO DE NOTIFICAÇÕES TOAST
// =======================================================================
function mostrarToast(mensagem, tipo = 'sucesso') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.color = '#ffffff';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    toast.style.transition = 'all 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.innerText = mensagem;

    if (tipo === 'sucesso') {
        toast.style.backgroundColor = '#22c55e';
        toast.style.borderLeft = '5px solid #15803d';
    } else if (tipo === 'erro') {
        toast.style.backgroundColor = '#ef4444';
        toast.style.borderLeft = '5px solid #b91c1c';
    } else {
        toast.style.backgroundColor = '#f59e0b';
        toast.style.borderLeft = '5px solid #b45309';
    }

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 50);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}


// =======================================================================
// BLOCO 23: 🖼️ CARROSSEL AUTOMÁTICO DA VITRINE
// =======================================================================
function iniciarCarrosselAutomatico() {
    if (intervaloCarrossel) clearInterval(intervaloCarrossel);

    const indicesFotosProdutos = {};

    intervaloCarrossel = setInterval(() => {
        if (!listaProdutosGlobal || listaProdutosGlobal.length === 0) return;

        listaProdutosGlobal.forEach(prod => {
            const fotosDisponiveis = [];
            if (prod.fotos && prod.fotos.length > 0) {
                prod.fotos.forEach(f => fotosDisponiveis.push(f.url));
            } else {
                if (prod.url1) fotosDisponiveis.push(prod.url1);
                if (prod.url2) fotosDisponiveis.push(prod.url2);
                if (prod.url3) fotosDisponiveis.push(prod.url3);
            }

            if (fotosDisponiveis.length > 1) {
                if (indicesFotosProdutos[prod.id] === undefined) {
                    indicesFotosProdutos[prod.id] = 0;
                }

                indicesFotosProdutos[prod.id]++;
                if (indicesFotosProdutos[prod.id] >= fotosDisponiveis.length) {
                    indicesFotosProdutos[prod.id] = 0;
                }

                const imgElement = document.getElementById(`img-card-${prod.id}`);
                if (imgElement) {
                    imgElement.src = fotosDisponiveis[indicesFotosProdutos[prod.id]];
                }
            }
        });
    }, 3000);
}


// =======================================================================
// BLOCO 24: ⏱️ INTERVALO DE ATUALIZAÇÃO EM TEMPO REAL (ADMIN)
// =======================================================================
setInterval(() => {
    if (usuarioLogado && usuarioLogado.nivel === "ADMIN") {
        atualizarDashboardAdmin();
        carregarTabelasInventarioEAuditoria();
        carregarDadosEPrevisoesAdmin();
    }
}, 3000);


// =======================================================================
// BLOCO 25: 🔌 INICIALIZAÇÃO — EVENT LISTENERS DO DOM
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutosDaAPI();
    atualizarInterface();
    if (usuarioLogado) {
        aplicarSessaoUsuario();
    }

    const inputEmail = document.getElementById('login-email');
    const inputSenha = document.getElementById('login-senha');
    if (inputEmail) inputEmail.addEventListener('keydown', mapearTecladoLogin);
    if (inputSenha) inputSenha.addEventListener('keydown', mapearTecladoLogin);

    const btnFinalizar = document.getElementById('btnFinalizar');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', () => {
            const formaPgtoElement = document.querySelector('input[name="formaPagamento"]:checked');
            const formaPgto = formaPgtoElement ? formaPgtoElement.value : 'PIX';

            if (!validarDadosCheckout(formaPgto)) return;

            const itensParaEnviar = Object.keys(carrinho).map(id => ({
                id: parseInt(id),
                nome: carrinho[id].nome,
                Qtd: carrinho[id].qtd
            }));

            fetch(`${API_BASE_URL}/api/pedidos/fechar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nomeCliente: usuarioLogado.nome,
                    documentoCliente: "PERFIL AUTENTICADO",
                    formaPagamento: formaPgto,
                    itens: itensParaEnviar
                })
            })
            .then(res => {
                if (!res.ok) return res.json().then(err => { throw new Error(err.mensagem); });
                return res.json();
            })
            .then(dados => {
                const modalGateway = document.getElementById('modalGatewayPagamento');
                const tituloGateway = document.getElementById('gateway-titulo');
                const conteudoGateway = document.getElementById('gateway-conteudo');
                const valorTotalStr = document.getElementById('txtTotal').innerText;

                if (formaPgto === 'PIX') {
                    tituloGateway.innerText = "📱 Gateway de Pagamento PIX";
                    conteudoGateway.innerHTML = `
                        <p style="color: var(--cor-sucesso); font-weight: bold; margin:0;">Pedido Faturado com Sucesso!</p>
                        <p style="font-size: 13px; color: var(--cor-subtexto); margin:0;">Escaneie o QR Code abaixo para transferir o valor de <b>${valorTotalStr}</b>:</p>
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ControlStockPixFalsoDynamicGatewayPayload" style="border: 6px solid #fff; border-radius: 4px; margin: 10px 0;">
                        <code style="background:#1e293b; padding:8px; border-radius:4px; font-size:11px; width:100%; word-break:break-all; color:var(--cor-primaria);">00020101021126360014br.gov.bcb.pix0114controlstockia5204000053039865405</code>
                    `;
                } else if (formaPgto === 'Boleto' || document.getElementById('dados-boleto')?.style.display === 'block') {
                    tituloGateway.innerText = "📄 Emissão de Boleto Bancário";
                    const codigoBarrasFake = "34191.79001 01043.513184 91020.150008 7 982100000" + Math.floor(Math.random() * 900 + 100);
                    conteudoGateway.innerHTML = `
                        <p style="color: var(--cor-destaque); font-weight: bold; margin:0;">Boleto Fictício Gerado!</p>
                        <p style="font-size: 13px; color: var(--cor-subtexto); margin:0;">Linha digitável para pagamento de <b>${valorTotalStr}</b>:</p>
                        <div style="background:#1e293b; padding:12px; border-radius:6px; font-size:12px; font-family:monospace; color:#fff; width:100%; border-left:4px solid var(--cor-destaque); text-align:left; margin: 10px 0;">
                            ${codigoBarrasFake}
                        </div>
                        <p style="font-size:11px; color:var(--cor-subtexto); margin:0;">✓ Romaneio vinculado ao SQLite. O estoque foi reservado e aguarda a compensação bancária.</p>
                    `;
                } else {
                    tituloGateway.innerText = `💳 Autorização de Cartão de ${formaPgto}`;
                    conteudoGateway.innerHTML = `
                        <div style="background: rgba(34,197,94,0.1); border: 1px solid var(--cor-sucesso); padding:15px; border-radius:8px; width:100%;">
                            <p style="color: var(--cor-sucesso); font-weight: bold; margin:0 0 5px 0;">✓ Transação Autorizada!</p>
                            <p style="font-size: 13px; color: #fff; margin:0;">O valor de <b>${valorTotalStr}</b> foi debitado do cartão informado.</p>
                        </div>
                        <p style="font-size:12px; color:var(--cor-subtexto); text-align:center; margin:0;">Código de autorização de e-commerce transacionado e salvo no SQLite via auditoria.</p>
                    `;
                }

                baixarRomaneioPDF();

                if (modalGateway) modalGateway.classList.add('aberto');

                carrinho = {};
                localStorage.removeItem('controlstock_carrinho');
                descontoCupomAtivo = 0;

                const inputCupom = document.getElementById('input-cupom');
                const msgCupom = document.getElementById('msg-cupom-resultado');
                const txtCupom = document.getElementById('txtCupomValor');
                if (inputCupom) inputCupom.value = "";
                if (msgCupom) msgCupom.innerText = "";
                if (txtCupom) txtCupom.innerText = "R$ 0,00";

                atualizarInterface();
                carregarProdutosDaAPI();
                if (usuarioLogado && usuarioLogado.nivel === "ADMIN") {
                    atualizarDashboardAdmin();
                    carregarTabelasInventarioEAuditoria();
                }

                const cNum = document.getElementById('card-numero');
                const cNome = document.getElementById('card-nome');
                const cVal = document.getElementById('card-validade');
                const cCvv = document.getElementById('card-cvv');
                if (cNum) cNum.value = "";
                if (cNome) cNome.value = "";
                if (cVal) cVal.value = "";
                if (cCvv) cCvv.value = "";
            })
            .catch(err => {
                alert(err.message || "❌ Falha crítica de faturamento no Servidor.");
            });
        });
    }
}); // 🎯 FECHAMENTO EXATO DO DOMContentLoaded AQUI!