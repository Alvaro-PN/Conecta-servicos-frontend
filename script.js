async function carregarServicos() {

    const listaServicos = document.getElementById("lista-servicos");
    const selectServico = document.getElementById("servico");

    try {

        const resposta = await fetch("http://127.0.0.1:5000/servicos");

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
    "http://127.0.0.1:5000/usuarios"
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
        "http://127.0.0.1:5000/usuarios",
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
        "http://127.0.0.1:5000/usuarios"
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
            "http://127.0.0.1:5000/solicitacoes",
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