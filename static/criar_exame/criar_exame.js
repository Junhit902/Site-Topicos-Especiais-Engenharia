document.addEventListener("DOMContentLoaded", function () {
    carregarPacientes();

    document.getElementById("formCriarExame").addEventListener("submit", function(event) {
        event.preventDefault();
        criarExame();
    });

    document.getElementById("selectPaciente").addEventListener("change", function() {
        const selectedOption = this.options[this.selectedIndex];
        const cpfPaciente = selectedOption.getAttribute('data-cpf');
        document.getElementById('cpfPaciente').textContent = cpfPaciente ? `CPF: ${cpfPaciente}` : '';
    });
});

function carregarPacientes() {
    fetch('/obter-pacientes')
        .then(response => response.json())
        .then(data => {
            const selectPaciente = document.getElementById('selectPaciente');
            selectPaciente.innerHTML = '<option value="">Selecione um paciente</option>'; // Limpa as opções anteriores

            data.forEach(paciente => {
                const option = document.createElement('option');
                option.value = paciente.id;
                option.textContent = paciente.nome;
                option.setAttribute('data-cpf', paciente.cpf);
                selectPaciente.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar pacientes:', error);
        });
}

function mostrarFormularioExame() {
    const tipoExame = document.getElementById('tipoExame').value;
    const formExameContainer = document.getElementById('formExameContainer');
    formExameContainer.innerHTML = ''; // Limpa o formulário anterior

    if (tipoExame === 'Sangue') {
        formExameContainer.innerHTML = `
            <label for="hemoglobina">Hemoglobina:</label>
            <input type="text" id="hemoglobina" name="hemoglobina" required>
            <label for="leucocitos">Leucócitos:</label>
            <input type="text" id="leucocitos" name="leucocitos" required>
        `;
    } else if (tipoExame === 'Urina') {
        formExameContainer.innerHTML = `
            <label for="ph">pH:</label>
            <input type="text" id="ph" name="ph" required>
            <label for="densidade">Densidade:</label>
            <input type="text" id="densidade" name="densidade" required>
        `;
    } else if (tipoExame === 'Raio-X') {
        formExameContainer.innerHTML = `
            <label for="regiao">Região:</label>
            <input type="text" id="regiao" name="regiao" required>
            <label for="observacoes">Observações:</label>
            <textarea id="observacoes" name="observacoes" required></textarea>
        `;
    } else if (tipoExame === 'Ultrassom') {
        formExameContainer.innerHTML = `
            <label for="regiao">Região:</label>
            <input type="text" id="regiao" name="regiao" required>
            <label for="observacoes">Observações:</label>
            <textarea id="observacoes" name="observacoes" required></textarea>
        `;
    } else if (tipoExame === 'Eletrocardiograma') {
        formExameContainer.innerHTML = `
            <label for="frequencia">Frequência Cardíaca:</label>
            <input type="text" id="frequencia" name="frequencia" required>
            <label for="ritmo">Ritmo:</label>
            <input type="text" id="ritmo" name="ritmo" required>
        `;
    }
}

function criarExame() {
    const pacienteId = document.getElementById('selectPaciente').value;
    const tipoExame = document.getElementById('tipoExame').value;

    // Pega todos os inputs gerados dinamicamente dentro do formExameContainer
    const formExameContainer = document.getElementById('formExameContainer');
    const inputs = formExameContainer.querySelectorAll('input, textarea');

    // Cria um objeto para armazenar os detalhes do exame
    const detalhes = {};
    inputs.forEach(input => {
        detalhes[input.name] = input.value;
    });

    // Validações
    if (!pacienteId || !tipoExame) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    // Estrutura de dados do exame
    const exame = {
        pacienteId,
        tipoExame,
        data: new Date().toISOString(),
        detalhes
    };

    fetch('/criar-exame', {
        method: 'POST',  // Alterado para POST, pois é mais adequado para criação
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(exame)
    })
    .then(response => response.json())
    .then(data => {
        const resultadoDiv = document.getElementById('resultadoCriacao');
        if (data.error) {
            resultadoDiv.innerHTML = `<p>${data.error}</p>`;
        } else {
            resultadoDiv.innerHTML = `<p>${data.message}</p>`;
        }
    })
    .catch(error => {
        console.error('Erro ao criar exame:', error);
    });
}

function toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    menu.classList.toggle('active');
}
