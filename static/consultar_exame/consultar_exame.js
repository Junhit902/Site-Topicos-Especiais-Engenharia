document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("formConsultarExame").addEventListener("submit", consultarExame);
    document.getElementById("consultaPaciente").addEventListener("input", buscarSugestoesPacientes);
    // Remova a linha abaixo se já está adicionando o listener ao formulário
    // document.getElementById("botao_buscar").addEventListener("click", consultarExame);
});

function buscarSugestoesPacientes(event) {
    const consulta = event.target.value;

    if (consulta.length >= 2) { // Buscar sugestões quando houver pelo menos 2 caracteres
        fetch(`/sugestoes-pacientes?consulta=${encodeURIComponent(consulta)}`)
            .then(response => response.json())
            .then(data => {
                const datalist = document.getElementById('sugestoesPacientes');
                datalist.innerHTML = ''; // Limpa as sugestões anteriores

                data.forEach(paciente => {
                    const option = document.createElement('option');
                    option.value = `${paciente.nome} - ${paciente.cpf}`;
                    datalist.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Erro ao buscar sugestões de pacientes:', error);
            });
    }
}

function consultarExame(event) {
    event.preventDefault();

    const consulta = document.getElementById('consultaPaciente').value.trim();
    const tbody = document.querySelector('#resultadoConsulta tbody');
    tbody.innerHTML = ''; // Limpa os resultados anteriores

    if (!consulta) {
        document.getElementById('mensagem').textContent = "Por favor, insira um CPF válido.";
        return;
    }

    fetch(`/api/consultar-exames/${consulta}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log('Dados recebidos:', data); // Linha para depuração
            if (data.error) {
                document.getElementById('mensagem').textContent = data.error;
            } else {
                document.getElementById('mensagem').textContent = '';
                if (data.length === 0) {
                    document.getElementById('mensagem').textContent = 'Nenhum exame encontrado.';
                } else {
                    const uniqueExams = new Set();
                    data.forEach(exame => {
                        const exameId = exame.id || `${exame.tipo}-${exame.data}`;
                        if (!uniqueExams.has(exameId)) {
                            uniqueExams.add(exameId);
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${exame.pacienteNome}</td>
                                <td>${consulta}</td>
                                <td>${exame.tipo}</td>
                                <td>${new Date(exame.data).toLocaleDateString()}</td>
                                <td>${formatarDetalhes(exame.tipo, exame.detalhes)}</td>
                            `;
                            tbody.appendChild(tr);
                        }
                    });
                }
            }
        })
        .catch(error => {
            console.error('Erro ao consultar exames:', error);
            document.getElementById('mensagem').textContent = 'Erro ao consultar exames';
        });
}

function formatarDetalhes(tipo, detalhes) {
    switch (tipo) {
        case 'Sangue':
            return `
                <div>Hemoglobina: ${detalhes.hemoglobina || 'N/A'}</div>
                <div>Leucócitos: ${detalhes.leucocitos || 'N/A'}</div>
            `;
        case 'Urina':
            return `
                <div>pH: ${detalhes.ph || 'N/A'}</div>
                <div>Densidade: ${detalhes.densidade || 'N/A'}</div>
            `;
        case 'Eletrocardiograma':
            const frequenciaCardiaca = detalhes.frequenciaCardiaca || detalhes.frequencia_cardiaca || detalhes.frequencia || 'N/A';
            return `
                <div>Frequência Cardíaca: ${frequenciaCardiaca}</div>
                <div>Ritmo: ${detalhes.ritmo || 'N/A'}</div>
            `;
        default:
            return `
                <div>Observações: ${detalhes.observacoes || 'N/A'}</div>
                <div>Região: ${detalhes.regiao || 'N/A'}</div>
            `;
    }
}

function toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    menu.classList.toggle('active');
}
