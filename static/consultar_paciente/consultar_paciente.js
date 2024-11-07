document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("formConsultarPaciente").addEventListener("submit", consultarPaciente);
    document.getElementById("cpfPaciente").addEventListener("input", buscarSugestoesPacientes);
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

function consultarPaciente(event) {
    event.preventDefault();

    const cpfPaciente = document.getElementById('cpfPaciente').value.split(' - ').pop(); // Extrai o CPF do valor selecionado

    if (!cpfPaciente) {
        alert("Por favor, forneça um CPF para a consulta.");
        return;
    }

    fetch(`/consultar-paciente/${encodeURIComponent(cpfPaciente)}`)
        .then(response => response.json())
        .then(data => {
            const resultadoDiv = document.getElementById('resultadoConsulta');
            resultadoDiv.innerHTML = ''; // Limpa os resultados anteriores

            if (data.error) {
                resultadoDiv.innerHTML = `<p>${data.error}</p>`;
            } else {
                resultadoDiv.innerHTML = `
                    <div class="resultado-consulta">
                        <p><strong>Nome:</strong> ${data.nome || 'N/A'}</p>
                        <p><strong>Data de Nascimento:</strong> ${data.dataNascimento || 'N/A'}</p>
                        <p><strong>Sexo:</strong> ${data.sexo || 'N/A'}</p>
                        <p><strong>Estado:</strong> ${data.endereco.estado || 'N/A'}</p>
                        <p><strong>Cidade:</strong> ${data.endereco.cidade || 'N/A'}</p>
                        <p><strong>Rua:</strong> ${data.endereco.rua || 'N/A'}</p>
                        <p><strong>Número:</strong> ${data.endereco.numero || 'N/A'}</p>
                        <p><strong>CEP:</strong> ${data.endereco.cep || 'N/A'} </p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Erro ao consultar paciente:', error);
            document.getElementById('resultadoConsulta').innerHTML = '<p>Erro ao consultar paciente</p>';
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

const express = require('express');
const couchbase = require('couchbase');
const app = express();
const cluster = new couchbase.Cluster('couchbase://localhost', {
    username: 'Grupo09', // Substitua pelo seu nome de usuário do Couchbase
    password: '222628'  // Substitua pela sua senha do Couchbase
});
const bucket = cluster.bucket('DevHealthy'); // Substitua pelo nome do seu bucket
const collection = bucket.defaultCollection();

app.use(express.json());

app.get('/sugestoes-pacientes', async (req, res) => {
    const consulta = req.query.consulta.toLowerCase();
    try {
        const query = `
            SELECT nome, cpf FROM \`pacientes\`
            WHERE LOWER(nome) LIKE $1 OR cpf LIKE $2
            LIMIT 10
        `;
        const options = { parameters: [`%${consulta}%`, `%${consulta}%`] };
        const result = await cluster.query(query, options);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar sugestões de pacientes:', error);
        res.status(500).json({ error: 'Erro ao buscar sugestões de pacientes' });
    }
});

app.get('/consultar-paciente', async (req, res) => {
    const consulta = req.query.consulta.toLowerCase();
    try {
        const query = `
            SELECT nome, dataNascimento, sexo, cpf, endereco FROM \`pacientes\`
            WHERE LOWER(nome) LIKE $1 OR cpf LIKE $2
        `;
        const options = { parameters: [`%${consulta}%`, `%${consulta}%`] };
        const result = await cluster.query(query, options);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao consultar paciente:', error);
        res.status(500).json({ error: 'Erro ao consultar paciente' });
    }
});

app.listen(5000, () => {
    console.log('Servidor rodando na porta 5000');
});