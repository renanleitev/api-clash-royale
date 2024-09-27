# API Clash Royale - Análise de Jogadores e Batalhas

API feita para o curso de Análise e Desenvolvimento de Sistemas da Faculdade Senac/PE.

É possível analisar dados de Jogadores e Batalhas do jogo Clash Royale.

Os dados são salvos na base de dados do MongoDB.

## Requisitos

- Criar uma conta no [MongoDB](https://developer.clashroyale.com/) e cadastrar uma base de dados
- Criar uma conta no site da API do [Clash Royale](https://account.mongodb.com/account/login) e obter o token de autenticação

## Ferramentas

Back-end:
- NodeJS
- Express
- Axios
- Mongoose

Banco de Dados:
- MongoDB

## Iniciando a aplicação

Faça a instalação das dependências do projeto:

    npm i
  
Altere o nome do arquivo `.env.example` para `.env`.

Dentro do arquivo `.env`, coloque a sua chave de API do Clash Royale e a URL da sua base de dados MongoDB:

    CLASH_TOKEN_API=''
    DATABASE_URL=''

Para iniciar a aplicação, execute o comando abaixo:

    npm start

Em seguida, abra o seu navegador e vá até a rota `/player/save/:tag` e insira uma tag de um jogador.

Os dados do jogador serão salvos no banco de dados e será possível visualizar um JSON.

## Rotas

Buscar os dados de um jogador e salvar no banco de dados:

    GET /player/save/:tag

Obter os dados do perfil do jogador:

    GET /player/profile/:nickname

Obter o histórico de batalha do jogador:

    GET /player/battles/:nickname

# Lista de jogadores

Use a lista de tags no arquivo `playersTagList.txt` para inserir alguns jogadores

Ou então, usar a lista disponível no site do [Clash Royale API](https://royaleapi.com/player/search/results?lang=en&q=%28Tag&fwd=1)

OBS: Inserir os IDs sem # (apenas o ID)

## Equipe

- Flávio Raposo
- João Pedro Marinho
- José Adeilton
- Renan Leite Vieira
- Rian Vinicius
- Robério José