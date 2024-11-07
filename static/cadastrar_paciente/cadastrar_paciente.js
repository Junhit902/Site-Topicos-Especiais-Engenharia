document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("formCadastrarPaciente").addEventListener("submit", cadastrarPaciente);
});

function cadastrarPaciente(event) {
    event.preventDefault();

    const paciente = {
        nome: document.getElementById('nomePaciente').value,
        dataNascimento: document.getElementById('dataNascimento').value,
        sexo: document.getElementById('sexoPaciente').value,
        cpf: document.getElementById('cpfPaciente').value,
        endereco: {
            rua: document.getElementById('ruaPaciente').value,
            numero: document.getElementById('numeroPaciente').value,
            cidade: document.getElementById('cidadePaciente').value,
            estado: document.getElementById('estadoPaciente').value,
            cep: document.getElementById('cepPaciente').value,
        }
    };

    fetch('/cadastrar-paciente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paciente)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('mensagem').textContent = data.message || data.error;
        if (data.message) {
            // Sucesso: limpa o formulário
            document.getElementById('formCadastrarPaciente').reset();
        }
    })
    .catch(error => {
        document.getElementById('mensagem').textContent = 'Erro ao cadastrar paciente: ' + error;
    });
}

function toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (menuId === 'offcanvasMenu') {
        menu.classList.toggle('show');
    } else {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}
