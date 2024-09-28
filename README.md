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

### Player

Buscar os dados de um jogador e salvar no banco de dados:

    GET /player/save/:tag

Obter os dados do perfil do jogador:

    GET /player/profile/:nickname

Obter o histórico de batalha do jogador:

    GET /player/battles/:nickname

Salvar os dados de múltiplos jogadores, dada uma lista:

    GET /player/save-all-players

OBS: Dependendo do tamanho da lista, pode demorar até 5 minutos para popular a base de dados

### Battles

Calcule a porcentagem de vitórias e derrotas utilizando a carta X (parâmetro) ocorridas em um intervalo de timestamps (parâmetro).

    GET /battles/win-loss-percentage?card=Knight&startTime=2024-01-01T00:00:00Z&endTime=2024-09-30T23:59:59Z

Liste os decks completos que produziram mais de X% (parâmetro) de vitórias ocorridas em um intervalo de timestamps (parâmetro).

    GET /battles/decks-win-percentage?winPercentage=10&startTime=2024-01-01T00:00:00Z&endTime=2024-09-30T23:59:59Z

Calcule a quantidade de derrotas utilizando o combo de cartas (X1,X2, ...) (parâmetro) ocorridas em um intervalo de timestamps (parâmetro).

    GET /battles/defeats-by-card-combo?cardCombo=Knight,Skeletons&startTime=2024-01-01T00:00:00Z&endTime=2024-09-30T23:59:59Z

Calcule a quantidade de vitórias envolvendo a carta X (parâmetro) nos casos em que o vencedor possui Z% (parâmetro) menos troféus do que o perdedor e o perdedor derrubou ao menos duas torres do adversário.

    GET /battles/wins-by-card-and-trophies?card=Knight&trophyPercentage=0&startTime=2024-01-01T00:00:00Z&endTime=2024-09-30T23:59:59Z

Liste o combo de cartas (eg: carta 1, carta 2, carta 3... carta n) de tamanho N (parâmetro) que produziram mais de Y% (parâmetro) de vitórias ocorridas em um intervalo de timestamps (parâmetro).

    GET /battles/combos-wins-percentage?deckQuantity=8&winPercentage=10&startTime=2024-08-01T00:00:00Z&endTime=2024-09-30T23:59:59Z

# Lista de jogadores

Usar a rota `/player/save-all-players` para inserir todos os jogadores automaticamente

Se necessário, usar a lista de tags no arquivo `/src/config/playersTagList.js` para inserir manualmente alguns jogadores

Ou então, usar a lista disponível no site do [Clash Royale API](https://royaleapi.com/player/search/results?lang=en&q=%28Tag&fwd=1) para inserir manualmente alguns jogadores

## Equipe

- Flávio Raposo
- João Pedro Marinho
- José Adeilton
- Renan Leite Vieira
- Rian Vinicius
- Robério José
