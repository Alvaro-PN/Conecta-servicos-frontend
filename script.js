const API_URL = "http://127.0.0.1:5000";

async function carregarServicos(){

    const listaServicos = document.getElementById("lista-servicos");
    const selectServico = document.getElementById("servico");

    try {

        const resposta = await fetch(`${API_URL}/servicos`);

        const servicos = await resposta.json();

        listaServicos.innerHTML = "";

        servicos.forEach(function(servico) {

            // Cria o cartão do serviço
            const card = document.createElement("div");

            card.classList.add("card-servico");

            card.innerHTML = `
                <h3>${servico.nome}</h3>
                <p>${servico.descricao || "Serviço disponível no Conecta Serviços."}</p>
                <span>${servico.categoria}</span>
            `;

            listaServicos.appendChild(card);


            // Adiciona o serviço no campo de seleção
            const opcao = document.createElement("option");

            opcao.value = servico.id;
            opcao.textContent = servico.nome;

            selectServico.appendChild(opcao);

        });

    } catch (erro) {

        listaServicos.innerHTML =
            "<p>Não foi possível carregar os serviços.</p>";

        console.error("Erro ao buscar serviços:", erro);
    }
}


carregarServicos();

const formulario = document.getElementById("form-solicitacao");

formulario.addEventListener("submit", async function(evento) {

    evento.preventDefault();

    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const telefone = document.getElementById("telefone").value;
    const servicoId = document.getElementById("servico").value;
    const cidade = document.getElementById("cidade").value;
    const descricao = document.getElementById("descricao").value;

    const mensagem = document.getElementById("mensagem-formulario");

    try {

        // 1. Cadastrar o cliente

// 1. Verificar se o usuário já existe
const respostaUsuarios = await fetch(
    `${API_URL}/usuarios`
);

const usuarios = await respostaUsuarios.json();

if (!respostaUsuarios.ok) {
    throw new Error("Não foi possível consultar os usuários.");
}

// Procurar usuário pelo e-mail
let usuario = usuarios.find(
    function(item) {
        return item.email.toLowerCase() === email.toLowerCase();
    }
);

// 2. Se o usuário não existir, cadastrar
if (!usuario) {

    const respostaNovoUsuario = await fetch(
    `${API_URL}/usuarios`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                nome: nome,
                email: email,
                telefone: telefone,
                tipo: "cliente",
                cidade: cidade
            })
        }
    );

    const resultadoNovoUsuario = await respostaNovoUsuario.json();

    if (!respostaNovoUsuario.ok) {
        throw new Error(
            resultadoNovoUsuario.erro ||
            "Erro ao cadastrar usuário."
        );
    }

    // Como o POST /usuarios retorna apenas a mensagem,
    // buscamos novamente os usuários para obter o ID.
    const respostaUsuariosAtualizada = await fetch(
    `${API_URL}/usuarios`
    );

    const usuariosAtualizados =
        await respostaUsuariosAtualizada.json();

    usuario = usuariosAtualizados.find(
        function(item) {
            return item.email.toLowerCase() === email.toLowerCase();
        }
    );
}

// Garantir que encontramos o usuário
if (!usuario) {
    throw new Error("Não foi possível identificar o usuário.");
}


        // 2. Criar a solicitação

        const respostaSolicitacao = await fetch(
    `${API_URL}/solicitacoes`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    cliente_id: usuario.id,
                    servico_id: Number(servicoId),
                    descricao: descricao,
                    cidade: cidade
                })
            }
        );

        const solicitacao = await respostaSolicitacao.json();

        if (!respostaSolicitacao.ok) {
            throw new Error(
                solicitacao.erro || "Erro ao criar solicitação."
            );
        }


        // 3. Mostrar mensagem de sucesso

        mensagem.textContent =
            "Solicitação criada com sucesso! Número: " +
            solicitacao.id;

        formulario.reset();

    } catch (erro) {

        mensagem.textContent =
            "Não foi possível criar a solicitação.";

        console.error("Erro:", erro);
    }

});

// ==========================================
// SOLICITAÇÕES DE SERVIÇOS DISPONÍVEIS
// ==========================================

async function carregarSolicitacoes() {

    const lista =
        document.getElementById("lista-solicitacoes");

    try {

        const resposta = await fetch(
            `${API_URL}/solicitacoes`
        );

        const solicitacoes = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                solicitacoes.erro ||
                "Erro ao buscar solicitações."
            );
        }

        lista.innerHTML = "";

        // Mostrar somente solicitações em aberto
        const solicitacoesAbertas =
            solicitacoes.filter(function(solicitacao) {
                return solicitacao.status === "aberta";
            });

        if (solicitacoesAbertas.length === 0) {

            lista.innerHTML = `
                <p class="sem-solicitacoes">
                    Nenhuma solicitação de serviço disponível no momento.
                </p>
            `;

            return;
        }

        solicitacoesAbertas.forEach(
            function(solicitacao) {

                const card =
                    document.createElement("div");

                card.classList.add(
                    "card-solicitacao"
                );

                const telefone =
                    solicitacao.cliente_telefone
                    ? solicitacao.cliente_telefone
                        .replace(/\D/g, "")
                    : "";

                card.innerHTML = `
                    <div class="informacoes-solicitacao">

                        <h3>
                            ${solicitacao.servico_nome}
                        </h3>

                        <p>
                            ${solicitacao.descricao}
                        </p>

                        <span>
                            Cidade: ${solicitacao.cidade}
                        </span>

                        <span>
                            Cliente: ${solicitacao.cliente_nome}
                        </span>

                    </div>

                    <div class="contato-solicitacao">

                        ${
                            telefone
                            ? `
                                <a
                                    href="https://wa.me/55${telefone}"
                                    target="_blank"
                                    class="botao-contato"
                                >
                                    Entrar em contato
                                </a>
                              `
                            : `
                                <p>
                                    Telefone não disponível.
                                </p>
                              `
                        }

                        <button
                            class="botao-excluir"
                            title="Excluir solicitação"
                        >
                            🗑️
                        </button>

                    </div>
                `;

                lista.appendChild(card);


                // Botão de excluir
                const botaoExcluir =
                    card.querySelector(
                        ".botao-excluir"
                    );

                botaoExcluir.addEventListener(
                    "click",
                    async function() {

                        const confirmar = confirm(
                            "Deseja realmente excluir esta solicitação?"
                        );

                        if (!confirmar) {
                            return;
                        }

                        try {

                            const resposta =
                                await fetch(
                                    `${API_URL}/solicitacoes/${solicitacao.id}`,
                                    {
                                        method: "DELETE"
                                    }
                                );

                            const resultado =
                                await resposta.json();

                            if (!resposta.ok) {

                                throw new Error(
                                    resultado.erro ||
                                    "Não foi possível excluir a solicitação."
                                );
                            }

                            // Atualiza a lista
                            carregarSolicitacoes();

                        } catch (erro) {

                            alert(
                                "Erro ao excluir a solicitação."
                            );

                            console.error(erro);
                        }
                    }
                );
            }
        );

    } catch (erro) {

        lista.innerHTML = `
            <p class="sem-solicitacoes">
                Não foi possível carregar as solicitações.
            </p>
        `;

        console.error(
            "Erro ao carregar solicitações:",
            erro
        );
    }
}

carregarSolicitacoes();