from flask import Flask, request, jsonify, render_template
from flask_cors import CORS  # Para permitir requisições cross-origin
from couchbase.cluster import Cluster
from couchbase.options import ClusterOptions, QueryOptions, UpsertOptions
from couchbase.auth import PasswordAuthenticator
from couchbase.exceptions import DocumentNotFoundException, CouchbaseException
from couchbase.mutation_state import MutationState
import os
import logging
from datetime import datetime
from couchbase.subdocument import upsert

app = Flask(__name__)
CORS(app)  # Habilita CORS para todas as rotas

# Configuração do logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuração do Couchbase
try:
    couchbase_host = 'cb.gomnpmkp8tqp8d1t.cloud.couchbase.com'
    couchbase_bucket = os.environ.get('COUCHBASE_BUCKET', 'DevHealthy')
    couchbase_user = os.environ.get('COUCHBASE_USER', 'DevHealthy')
    couchbase_password = os.environ.get('COUCHBASE_PASSWORD', 'Bk01Tj02@')

    cluster = Cluster.connect(f'couchbases://{couchbase_host}',
                            ClusterOptions(PasswordAuthenticator(couchbase_user, couchbase_password)))
    bucket = cluster.bucket(couchbase_bucket)
    collection = bucket.default_collection()
    logger.info("Conectado ao Couchbase com sucesso!")
except CouchbaseException as e:
    logger.error("Erro ao conectar ao Couchbase: %s", e.__class__.__name__)
    logger.error("Detalhes do erro: %s", e)
    exit(1)  # Encerra a aplicação em caso de erro de conexão
except Exception as e:
    logger.error("Erro inesperado ao conectar ao Couchbase: %s", e)
    exit(1)  # Encerra a aplicação em caso de erro de conexão

# Rota de Teste
@app.route('/test', methods=['GET'])
def test():
    return "Conexão bem-sucedida!", 200

# Rota para página principal
@app.route('/')
def home():
    return render_template('home.html')

# Rota para página de cadastro de paciente
@app.route('/cadastrar_paciente')
def cadastro_page():
    return render_template('cadastrar_paciente.html')

# Rota para página de consulta de paciente
@app.route('/consultar_paciente')
def consulta_page():
    return render_template('consultar_paciente.html')

# Rota para página de criação de exame
@app.route('/criar_exame')
def criar_exame_page():
    return render_template('criar_exame.html')

# Rota para página de consulta de exame
@app.route('/consultar_exame')
def consultar_exame_page():
    return render_template('consultar_exame.html')

# Rota para cadastrar paciente
@app.route('/cadastrar-paciente', methods=['POST'])
def cadastrar_paciente():
    try:
        paciente = request.json
        document_id = f"paciente::{paciente['cpf']}"
        
        # Verifica se o paciente já existe
        try:
            collection.get(document_id)
            return jsonify({"error": "Paciente já cadastrado"}), 400
        except DocumentNotFoundException:
            # Adiciona o tipo do documento
            paciente['type'] = 'paciente'
            # Insere o novo paciente
            collection.insert(document_id, paciente)
            logger.info(f"Paciente cadastrado com sucesso: {paciente}")
            return jsonify({"message": "Paciente cadastrado com sucesso!"}), 201
    except CouchbaseException as e:
        logger.error("Erro ao cadastrar paciente: %s", e)
        return jsonify({"error": str(e)}), 500

# Rota para consultar pacientes
@app.route('/consultar-pacientes', methods=['GET'])
def consultar_pacientes():
    try:
        query = 'SELECT * FROM `DevHealthy` WHERE type = "paciente"'
        result = cluster.query(query)
        pacientes = [row for row in result]
        logger.info(f"Pacientes encontrados: {pacientes}")
        return jsonify(pacientes), 200
    except CouchbaseException as e:
        logger.error("Erro ao consultar pacientes: %s", e)
        return jsonify({"error": str(e)}), 500

# Rota para consultar paciente por CPF
@app.route('/consultar-paciente/<cpf>', methods=['GET'])
def consultar_paciente(cpf):
    try:
        document_id = f"paciente::{cpf}"
        result = collection.get(document_id)
        paciente = result.content_as[dict]
        logger.info(f"Paciente encontrado: {paciente}")
        return jsonify(paciente), 200
    except DocumentNotFoundException:
        logger.warning(f"Paciente não encontrado: {cpf}")
        return jsonify({"error": "Paciente não encontrado"}), 404
    except CouchbaseException as e:
        logger.error("Erro ao consultar paciente: %s", e)
        return jsonify({"error": str(e)}), 500

# Rota para criar exame
@app.route('/criar-exame', methods=['POST'])
def criar_exame():
    try:
        exame = request.json
        paciente_id = exame['pacienteId']
        tipo_exame = exame['tipoExame']
        detalhes_exame = exame['detalhes']
        
        # Se a chave for 'frequencia', renomeie para 'frequenciaCardiaca'
        if 'frequencia' in detalhes_exame and 'frequenciaCardiaca' not in detalhes_exame:
            detalhes_exame['frequenciaCardiaca'] = detalhes_exame.pop('frequencia')
        
        data_exame = exame['data']
        logger.info(f"Recebido exame para paciente {paciente_id}: {exame}")

        # Gera um ID único para o exame baseado em pacienteId, tipo e data
        exame_id = f"exame::{paciente_id}::{tipo_exame}::{data_exame}"

        # Verifica se o exame já existe
        try:
            collection.get(exame_id)
            logger.warning(f"Exame já existe: {exame_id}")
            return jsonify({"error": "Exame já existe"}), 400
        except DocumentNotFoundException:
            pass  # Se não existir, continua

        # Salva o exame no Couchbase
        exame_data = {
            'tipo': tipo_exame,
            'data': data_exame,
            'detalhes': {
                'frequenciaCardiaca': detalhes_exame.get('frequenciaCardiaca') or detalhes_exame.get('frequencia_cardiaca'),
                'ritmo': detalhes_exame.get('ritmo')
            },
            'pacienteId': paciente_id,
            'type': 'exame'
        }
        collection.insert(exame_id, exame_data)
        logger.info(f"Exame criado com sucesso para paciente: {paciente_id}")
        return jsonify({"message": "Exame criado com sucesso!"}), 201
    except CouchbaseException as e:
        logger.error("Erro ao criar exame: %s", e)
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error("Erro inesperado ao criar exame: %s", e)
        return jsonify({"error": str(e)}), 500

# Rota para consultar exames
# Rota para consultar exames de um paciente por CPF
@app.route('/api/consultar-exames/<cpf>', methods=['GET'])
def consultar_exames_paciente(cpf):
    if not cluster:
        return jsonify({"error": "Conexão com banco de dados não estabelecida"}), 500

    try:
        # Log para verificar o CPF recebido
        logger.info(f"Buscando exames para o paciente com CPF: {cpf}")

        # Primeiro, buscamos o paciente pelo CPF para pegar o pacienteId e o nome
        paciente_query = f'''
        SELECT META().id as id, nome
        FROM `DevHealthy`
        WHERE type = "paciente" AND cpf = "{cpf}"
        '''
        paciente_result = cluster.query(paciente_query)
        paciente = [row for row in paciente_result]

        if not paciente:
            logger.warning(f"Paciente com CPF {cpf} não encontrado")
            return jsonify({"error": "Paciente não encontrado"}), 404

        paciente_id = paciente[0]['id']  # Recupera o ID do paciente
        paciente_nome = paciente[0]['nome']  # Recupera o nome do paciente
        logger.info(f"Paciente encontrado: {paciente_id}, Nome: {paciente_nome}")

        # Consulta para obter os exames do paciente
        exame_query = f'''
        SELECT META().id as id, tipo, data, detalhes
        FROM `DevHealthy`
        WHERE type = "exame" AND pacienteId = "{paciente_id}"
        ORDER BY data DESC
        '''
        result = cluster.query(exame_query)
        exames = [row for row in result]

        if not exames:
            logger.warning(f"Não foram encontrados exames para o paciente {cpf} (pacienteId: {paciente_id})")

        # Adiciona o nome do paciente a cada exame
        for exame in exames:
            exame['pacienteNome'] = paciente_nome

        logger.info(f"Exames encontrados para o paciente {cpf}: {exames}")
        return jsonify(exames), 200
    except CouchbaseException as e:
        logger.error(f"Erro ao consultar exames do paciente {cpf}: {e}")
        return jsonify({"error": "Erro ao consultar exames"}), 500
    except Exception as e:
        logger.error(f"Erro inesperado ao consultar exames do paciente {cpf}: {e}")
        return jsonify({"error": "Erro inesperado ao consultar exames"}), 500


@app.route('/api/remover-exame/<cpf>/<data>', methods=['DELETE'])
def remover_exame(cpf, data):
    if not collection:
        return jsonify({"error": "Conexão com banco de dados não estabelecida"}), 500
        
    try:
        document_id = f"exame::{cpf}::{data}"
        
        try:
            collection.get(document_id)
        except DocumentNotFoundException:
            return jsonify({"error": "Exame não encontrado"}), 404

        collection.remove(document_id)
        return jsonify({"message": "Exame removido com sucesso"}), 200
    except CouchbaseException as e:
        return jsonify({"error": f"Erro no banco de dados: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Erro inesperado: {str(e)}"}), 500

# Rota para obter a lista de pacientes
@app.route('/obter-pacientes', methods=['GET'])
def obter_pacientes():
    try:
        query = 'SELECT META().id, nome, cpf FROM `DevHealthy` WHERE type = "paciente"'
        result = cluster.query(query)
        pacientes = [row for row in result]
        logger.info(f"Pacientes encontrados: {pacientes}")
        return jsonify(pacientes), 200
    except CouchbaseException as e:
        logger.error("Erro ao obter pacientes: %s", e)
        return jsonify({"error": "Erro ao obter pacientes"}), 500
    except Exception as e:
        logger.error("Erro inesperado ao obter pacientes: %s", e)
        return jsonify({"error": "Erro inesperado ao obter pacientes"}), 500

def atualizar_exames():
    exame_query = 'SELECT META().id as id, detalhes FROM `DevHealthy` WHERE type = "exame" AND tipo = "Eletrocardiograma"'
    result = cluster.query(exame_query)
    exames = [row for row in result]

    for exame in exames:
        exame_id = exame['id']
        detalhes = exame['detalhes']
        if 'frequencia' in detalhes:
            detalhes['frequenciaCardiaca'] = detalhes.pop('frequencia')
            # Atualiza o documento no Couchbase
            collection.mutate_in(
                exame_id,
                [upsert('detalhes', detalhes)]
            )
            logger.info(f"Exame {exame_id} atualizado com sucesso.")

# Chame a função para executar a atualização
atualizar_exames()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
