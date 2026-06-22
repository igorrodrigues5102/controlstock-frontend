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
let descontoCupomAtivo = 0; // Armazena o valor bruto deduzido pelo cupom

console.log("O motor lógico do script.js foi carregado com sucesso!");

// ====== SISTEMA DA VITRINE INTERATIVA (CARROSSEL AUTOMÁTICO) ======
var produtoAtualIndex = 0; // Mudamos de 'let' para 'var'
let intervaloCarrossel;

function iniciarCarrosselAutomatico() {
    if (intervaloCarrossel) clearInterval(intervaloCarrossel);

    intervaloCarrossel = setInterval(() => {
        // Busca os cards de produtos na tela
        const cards = document.querySelectorAll('#container-produtos .card-produto') || document.querySelectorAll('#produtos-container .card-produto');
        if (cards.length <= 1) return; 

        produtoAtualIndex++;
        if (produtoAtualIndex >= cards.length) {
            produtoAtualIndex = 0; 
        }

        // Faz o scroll suave até o próximo produto
        cards[produtoAtualIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }, 4000); // Rola a cada 4 segundos
}

// Dispara o carrossel de forma segura após a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(iniciarCarrosselAutomatico, 1500));
} else {
    setTimeout(iniciarCarrosselAutomatico, 1500);
}


// =======================================================================
// BLOCO 2: 🧭 CONTROLE DE NAVEGAÇÃO (ABAS E ABRE/FECHA MODAIS)
// =======================================================================
function mudarAba(nomeAba) {
    document.querySelectorAll('.aba-painel').forEach(a => a.classList.remove('ativa'));
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('ativo'));
    
    document.getElementById(`aba-${nomeAba}`).classList.add('ativa');
    
    if (nomeAba === 'vitrine') document.getElementById('btn-vitrine').classList.add('ativo');
    if (nomeAba === 'carrinho') document.getElementById('btn-carrinho').classList.add('ativo');
    if (nomeAba === 'historico') document.getElementById('btn-historico').classList.add('ativo');
    if (nomeAba === 'admin') document.getElementById('btn-admin').classList.add('ativo');
}

function abrirAuthModal() { document.getElementById('modalAuth').classList.add('aberto'); }
function fecharAuthModal() { document.getElementById('modalAuth').classList.remove('aberto'); }

function abrirModal(id) {
    const prod = listaProdutosGlobal.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('modalTitulo').innerText = prod.nome;
    document.getElementById('modalPreco').innerText = `R$ ${prod.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('modalDescricao').innerText = prod.descricao || "Sem descrição disponível.";

    // Limpa o resultado do frete anterior ao reabrir o modal
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

    document.getElementById('modalDetalhes').classList.add('aberto');
}

function fecharModal() {
    document.getElementById('modalDetalhes').classList.remove('aberto');
}

function fecharModalGateway() {
    document.getElementById('modalGatewayPagamento').classList.remove('aberto');
}

function mudarAbasAuth(tipo) {
    document.querySelectorAll('.aba-auth').forEach(a => a.classList.remove('ativa'));
    document.querySelectorAll('.secao-auth').forEach(s => s.classList.remove('ativa'));
    
    document.getElementById(`aba-${tipo}`).classList.add('ativa');
    document.getElementById(`form-${tipo}`).classList.add('ativa');
}


// =======================================================================
// BLOCO 2.1: 🔀 CONTROLE DO FLUXO DO CHECKOUT (WIZARD EM ETAPAS)
// =======================================================================
function avancarWizard(passo) {
    // Esconde as seções da esquerda
    document.getElementById('checkout-secao-itens').style.display = 'none';
    document.getElementById('checkout-secao-endereco').style.display = 'none';

    // Captura o bloco da direita
    const secaoPagamento = document.getElementById('checkout-secao-pagamento');

    // Reseta os indicadores visuais do topo
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
        // Mantém a tela de endereço visível na esquerda e altera o pagamento na direita
        document.getElementById('checkout-secao-endereco').style.display = 'block';
        if (secaoPagamento) secaoPagamento.style.display = 'block';
        document.getElementById('step-3').style.color = 'var(--cor-primaria)';
        document.getElementById('step-3').style.textShadow = '0 0 8px var(--cor-primaria)';
    }
}


// =======================================================================
// BLOCO 3: 📸 CONTROLE INTERNO DO CARROSSEL DE FOTOS
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
// BLOCO 4: 🔐 PROCESSAMENTO DE AUTENTICAÇÃO E VALIDÇÕES ANTIFRAUDE MATEMÁTICAS
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

// Algoritmo de Luhn — validação matemática real de número de cartão de crédito
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

// Validação e feedback em tempo real para o CPF na tela de entrega (Passo 2)
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

// Validação em tempo real do número do cartão com máscara visual (Passo 3)
function validarCartaoLive() {
    const campo = document.getElementById('card-numero');
    const msg = document.getElementById('msg-card-validacao');
    const btnFinalizar = document.getElementById('btnFinalizar');
    let valor = campo.value.replace(/\D/g, "");

    // Aplica a máscara visual em blocos de 4 dígitos automática
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


// =======================================================================
// BLOCO 5: 👤 GERENCIAMENTO DE REFRESH DE SESSÃO (ADMIN VS CLIENTE)
// =======================================================================
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

function baixarRelatorioEstoqueCSV() {
    window.open(`${API_BASE_URL}/api/admin/relatorios/exportar`);
}

function aplicarSessaoUsuario() {
    document.getElementById('btn-entrar-topo').style.display = "none";
    document.getElementById('painel-user-topo').style.display = "flex";
    document.getElementById('label-nome-user').innerText = usuarioLogado.nome;
    document.getElementById('avatar-letra').innerText = usuarioLogado.nome.substring(0,1).toUpperCase();
    document.getElementById('alerta-login-checkout').style.display = "none";
    
    if(usuarioLogado.nivel === "ADMIN") {
        document.getElementById('painel-admin-bloqueado').style.display = "none";
        document.getElementById('painel-admin-liberado').style.display = "block";
        
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
// 🎯 MOTOR DE VALIDAÇÃO E CÁLCULO DE CUPONS DE DESCONTO (MARKETPLACE)
// =======================================================================
function aplicarCupomDesconto() {
    const cupomTexto = document.getElementById('input-cupom').value.trim().toUpperCase();
    const msgResultado = document.getElementById('msg-cupom-resultado');
    const txtCupomValor = document.getElementById('txtCupomValor');
    
    let totalCarrinhoBruto = 0;
    Object.keys(carrinho).forEach(id => {
        let item = carrinho[id];
        let precoFinal = item.precoOriginal;
        if (item.qtd >= 5) precoFinal = item.precoOriginal * 0.90; // Regra de atacado
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
        descontoCupomAtivo = totalCarrinhoBruto * 0.15; // 15% de dedução
        msgResultado.innerText = `✓ Cupom NOTA10 Aplicado! Você ganhou 15% de desconto.`;
        msgResultado.style.color = "var(--cor-sucesso)";
    } else if (cupomTexto === "CONTROLSTOCK") {
        descontoCupomAtivo = 10.00; // Desconto fixo de R$ 10
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
// BLOCO 6: 🛒 MECANISMO DE PRODUTOS E CARREGAMENTO DO BANCO SQLITE
// =======================================================================
function carregarProdutosDaAPI() {
    const vitrine = document.getElementById('vitrine-produtos');
    vitrine.innerHTML = "<p style='color: var(--cor-subtexto);'>Buscando catálogo no banco...</p>";

    fetch(`${API_BASE_URL}/api/produtos`)
        .then(res => res.json())
        .then(produtos => {
            vitrine.innerHTML = "";
            listaProdutosGlobal = produtos;
            
            if(produtos.length === 0) {
                vitrine.innerHTML = "<p>Nenhum item cadastrado no banco.</p>";
                return;
            }

            produtos.forEach(prod => {
                const esgotado = prod.quantidadeAtual <= 0;
                let staticLineEstoqueHtml = "";
                
                if (usuarioLogado && usuarioLogado.nivel === "ADMIN") {
                    staticLineEstoqueHtml = `<div class="estoque-prod" style="color:var(--cor-primaria); font-weight:bold;">Disponível: ${prod.quantidadeAtual} un</div>`;
                } else {
                    staticLineEstoqueHtml = `<div class="estoque-prod" style="color:var(--cor-subtexto); font-size:12px;">${esgotado ? '❌ Temporariamente Esgotado' : '⚡ Item Disponível'}</div>`;
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
                            <div class="grupo-botoes-card">
                                <button class="btn-detalhes" onclick="abrirModal(${prod.id})">🔍 Detalhes</button>
                                <button class="btn-add" ${esgotado ? "disabled" : ""} onclick="adicionarAoCarrinho(${prod.id}, '${prod.nome}', ${prod.preco}, ${prod.quantidadeAtual})">${esgotado ? 'Esgotado' : 'Adicionar'}</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            // O LUGAR CERTO É AQUI (FORA E ANTES DO CATCH):
            setTimeout(iniciarCarrosselAutomatico, 1000);
        }).catch(() => { 
            
            vitrine.innerHTML = "<p style='color:var(--cor-erro);font-weight:bold;'>Servidor Backend Desconectado.</p>"; 
        });
}


// =======================================================================
// BLOCO 7: 🧮 LOGICA E CÁLCULOS DA INTERFACE DO CARRINHO (ATACADO)
// =======================================================================
function adicionarAoCarrinho(id, nome, preco, estoqueMaximo) {
    if (carrinho[id]) {
        if (carrinho[id].qtd >= estoqueMaximo) { 
            mostrarToast(`Estoque limite atingido. Máximo disponível: ${estoqueMaximo} un.`, 'aviso'); 
            return; 
        }
        carrinho[id].qtd += 1;
    } else { 
        carrinho[id] = { id: id, nome: nome, precoOriginal: preco, qtd: 1 }; 
    }
    
    // Dispara o Toast de sucesso na tela!
    mostrarToast(`✓ ${nome} adicionado ao carrinho!`, 'sucesso');
    atualizarInterface();
}

function atualizarInterface() {
    const corpo = document.getElementById('corpo-carrinho');
    if (!corpo) return;
    corpo.innerHTML = ""; 
    let totalGeral = 0, descontoAtacadoGeral = 0, itensTotais = 0;
    const chaves = Object.keys(carrinho);

    if(chaves.length === 0) {
        corpo.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--cor-subtexto);">Seu carrinho está vazio.</td></tr>`;
        descontoCupomAtivo = 0;
    } else {
        chaves.forEach(id => {
            let item = carrinho[id]; let precoFinal = item.precoOriginal; let tagAtacado = "";
            itensTotais += item.qtd;
            if (item.qtd >= 5) { 
                let descUnidade = item.precoOriginal * 0.10; 
                precoFinal = item.precoOriginal - descUnidade; 
                descontoAtacadoGeral += (descUnidade * item.qtd); 
                tagAtacado = "<span style='color: var(--cor-destaque); font-size: 11px; margin-left:8px;'>🔥 Atacado -10%</span>"; 
            }
            let subtotalItem = item.qtd * precoFinal; totalGeral += subtotalItem;
            corpo.innerHTML += `<tr><td><b>${item.nome}</b>${tagAtacado}</td><td style="text-align:center;">${item.qtd}</td><td style="text-align:right;">R$ ${precoFinal.toFixed(2)}</td><td style="text-align:right;font-weight:bold;">R$ ${subtotalItem.toFixed(2)}</td></tr>`;
        });
    }

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
// BLOCO 8: 🚚 LOGÍSTICA DE ENTREGA E FRETE DO CHECKOUT
// =======================================================================
function calcularFreteCheckout() {
    const cepInput = document.getElementById('cep-checkout').value.trim();
    const display = document.getElementById('resultado-frete-checkout');

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


// =======================================================================
// BLOCO 9: 💳 CHECKOUT, GATEWAY E SISTEMA IMPRESSOR DE ROMANEIO (PDF)
// =======================================================================

function alternarCamposPagamento(tipo) {
    const card = document.getElementById('dados-cartao');
    if (card) {
        // Verifica exatamente os valores enviados pelos inputs de rádio ('Crédito' ou 'Débito')
        if (tipo === 'Crédito' || tipo === 'Débito' || tipo === 'CARTAO' || tipo === 'DEBITO') {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
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
            alert("❌ Antifraude: Número de cartão inválido rejeitado pelo teste matemático de Luhn!");
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
                
                /* Força o background escuro no HTML e Body */
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
                
                /* Ajusta as tags span de atacado que vem do carrinho do sistema */
                td span { background: rgba(245, 158, 11, 0.1) !important; color: #fbbf24 !important; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
                
                .bloco-fechamento { display: flex; justify-content: flex-end; align-items: center; gap: 15px; background-color: #1a1827 !important; padding: 20px; border-radius: 8px; border: 1px solid #221f33; margin-top: 25px; }
                .total-txt { font-size: 13px; color: #94a3b8 !important; font-weight: 700; text-transform: uppercase; }
                .total-num { font-size: 24px; font-weight: 900; color: #22c55e !important; }
                
                /* Força a renderização escura total na janela do driver de PDF */
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
// BLOCO 10: ⚙️ COMUNICAÇÃO DE ADMINISTRAÇÃO (LOTE, GESTÃO AVANÇADA E CADASTROS)
// =======================================================================
function registrarEntradaLote() {
    const id = parseInt(document.getElementById('lote-id').value);
    const qtd = parseInt(document.getElementById('lote-qtd').value);
    const obs = document.getElementById('lote-obs').value.trim();

    if (!id || !qtd) { alert("⚠️ Preencha o ID e a Quantidade do lote."); return; }

    fetch(`${API_BASE_URL}/api/admin/estoque/lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId: id, quantity: qtd, observacao: obs || "Carga de reabastecimento." })
    })
    .then(res => {
        if (!res.ok) throw new Error("Erro ao registrar entrada.");
        return res.json();
    })
    .then(dados => {
        alert(dados.mensagem);
        document.getElementById('lote-id').value = "";
        document.getElementById('lote-qtd').value = "";
        document.getElementById('lote-obs').value = "";
        
        carregarProdutosDaAPI();
        atualizarDashboardAdmin();
        carregarTabelasInventarioEAuditoria();
    }).catch(() => alert("❌ Erro ao salvar lote no banco SQLite."));
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


// =======================================================================
// BLOCO 11: 📊 SINCRONIZADORES FINANCEIROS E REPASSE DE TABELAS LIVE (IA)
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
                        <td style="font-weight:bold; text-align: center; color:${p.quantidadeAtual <= 2 ? 'var(--cor-erro)' : 'var(--cor-sucesso)'}">${p.quantidadeAtual} un.</td>
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
// BLOCO 12: 🤖 MÓDULO DE IMAGENS DE DEMONSTRAÇÃO ACADÊMICA E FRETE REGIONAL
// =======================================================================
function buscarImagensAutomaticas() {
    const url1 = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600'; 
    let url2 = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600';
    let url3 = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600';

    document.getElementById('prod-url-1').value = url1;
    document.getElementById('prod-url-2').value = url2;
    document.getElementById('prod-url-3').value = url3;

    alert("🤖 Modo de Demonstração Acadêmica: URLs padrão do catálogo de teste vinculadas com sucesso!");
}

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
// BLOCO 13: 🔌 INICIALIZAÇÃO DOS EVENT LISTENERS DO DOM
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

    // ESCUTADOR CENTRAL E ÚNICO DO BOTÃO FINALIZAR COMPRA
    const btnFinalizar = document.getElementById('btnFinalizar');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', () => {
            const formaPgtoElement = document.querySelector('input[name="formaPagamento"]:checked');
            const formaPgto = formaPgtoElement ? formaPgtoElement.value : 'PIX';

            // Executa as verificações matemáticas antifraude (Luhn/CPF) antes de mandar ao servidor
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
                // Abre a janela de confirmação na tela (Gateway Visual)
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

                // 🔥 DISPARA E EMITE O COMPROVANTE DE ROMANEIO COMPLETO EM PDF AUTOMATICAMENTE NO FATURAMENTO
                baixarRomaneioPDF();

                if (modalGateway) modalGateway.classList.add('aberto');

                // Limpa de forma segura o estado global do carrinho após a transação bem-sucedida
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
                
                // Reseta os campos de faturamento sensíveis do formulário por motivos de segurança
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
});


// =======================================================================
// INTERVALO DE EXECUÇÃO EM TEMPO REAL (ATUALIZA A CADA 3 SEGUNDOS)
// =======================================================================
setInterval(() => {
    if (usuarioLogado && usuarioLogado.nivel === "ADMIN") {
        atualizarDashboardAdmin();
        carregarTabelasInventarioEAuditoria();
        carregarDadosEPrevisoesAdmin(); 
    }
}, 3000);

// ====== SISTEMA DA VITRINE INTERATIVA (CARROSSEL AUTOMÁTICO) ======
 produtoAtualIndex = 0;
 intervaloCarrossel;

function iniciarCarrosselAutomatico() {
    if (intervaloCarrossel) clearInterval(intervaloCarrossel);

    // Cria um objeto na memória para controlar qual foto cada produto está exibindo
    const indicesFotosProdutos = {};

    intervaloCarrossel = setInterval(() => {
        if (!listaProdutosGlobal || listaProdutosGlobal.length === 0) return;

        listaProdutosGlobal.forEach(prod => {
            // Cria a lista de fotos disponíveis para este produto
            const fotosDisponiveis = [];
            if (prod.fotos && prod.fotos.length > 0) {
                prod.fotos.forEach(f => fotosDisponiveis.push(f.url));
            } else {
                // Fallback caso venha do cadastro básico simplificado
                if (prod.url1) fotosDisponiveis.push(prod.url1);
                if (prod.url2) fotosDisponiveis.push(prod.url2);
                if (prod.url3) fotosDisponiveis.push(prod.url3);
            }

            // Se o produto tiver mais de uma foto, faz o slide acontecer
            if (fotosDisponiveis.length > 1) {
                if (indicesFotosProdutos[prod.id] === undefined) {
                    indicesFotosProdutos[prod.id] = 0;
                }

                // Avança para a próxima foto
                indicesFotosProdutos[prod.id]++;
                if (indicesFotosProdutos[prod.id] >= fotosDisponiveis.length) {
                    indicesFotosProdutos[prod.id] = 0; // Volta para a primeira
                }

                // Alvo exato da tag img do card deste produto específico
                const imgElement = document.getElementById(`img-card-${prod.id}`);
                if (imgElement) {
                    imgElement.src = fotosDisponiveis[indicesFotosProdutos[prod.id]];
                }
            }
        });
    }, 3000); // Troca a foto a cada 3 segundos de forma automática
}

// Modificar a função que renderiza os produtos para dar o pontapé inicial no carrossel
// Procure onde os produtos são desenhados na tela e adicione a chamada abaixo após o loop:
// iniciarCarrosselAutomatico();
// Sistema Centralizado de Notificações Toast para o Portfólio
function mostrarToast(mensagem, tipo = 'sucesso') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Cria o bloco do toast
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

    // Define a cor de fundo com base no tipo de alerta
    if (tipo === 'sucesso') {
        toast.style.backgroundColor = '#22c55e'; // Verde sucesso
        toast.style.borderLeft = '5px solid #15803d';
    } else if (tipo === 'erro') {
        toast.style.backgroundColor = '#ef4444'; // Vermelho erro
        toast.style.borderLeft = '5px solid #b91c1c';
    } else {
        toast.style.backgroundColor = '#f59e0b'; // Amarelo aviso
        toast.style.borderLeft = '5px solid #b45309';
    }

    container.appendChild(toast);

    // Efeito de entrada suave
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 50);

    // Remove o toast automaticamente após 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
