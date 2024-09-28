import express from 'express'
import Battle from '../models/Battle.js'

const router = express.Router()

const findCardImage = async (card) => {
  // Obtendo a imagem do card
  const battle = await Battle.findOne({
    $or: [{ 'player1Deck.name': card }, { 'player2Deck.name': card }]
  })

  const cardFound1 = battle?.player1Deck?.find((item) => item.name === card)

  const cardFound2 = battle?.player2Deck?.find((item) => item.name === card)

  const cardImage = cardFound1?.imageURL ?? cardFound2?.imageURL ?? ''

  return cardImage
}

// Rota para calcular a porcentagem de vitórias e derrotas com uma carta específica
router.get('/win-loss-percentage', async (req, res) => {
  const { card, startTime, endTime } = req.query

  // Verificação de parâmetros
  if (!card || !startTime || !endTime) {
    return res
      .status(400)
      .json({
        message: 'Parâmetros card, startTime e endTime são necessários!'
      })
  }

  try {
    // Converter as datas para objetos Date do JavaScript
    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    // Busca todas as batalhas que ocorreram dentro do intervalo de tempo e onde a carta foi usada
    const totalBattles = await Battle.countDocuments({
      battleTime: { $gte: startDate, $lte: endDate },
      $or: [
        { 'player1Deck.name': card }, // Verifica se a carta está no deck do player1
        { 'player2Deck.name': card } // Verifica se a carta está no deck do player2
      ]
    })

    if (totalBattles === 0) {
      return res
        .status(404)
        .json({
          message:
            'Nenhuma batalha encontrada com essa carta no intervalo de tempo especificado.'
        })
    }

    // Contar as vitórias onde a carta estava no deck do vencedor
    const wins = await Battle.countDocuments({
      battleTime: { $gte: startDate, $lte: endDate },
      $or: [
        { winner: 'player1', 'player1Deck.name': card }, // Verifica se player1 venceu e usou a carta
        { winner: 'player2', 'player2Deck.name': card } // Verifica se player2 venceu e usou a carta
      ]
    })

    // Contar as derrotas (total de batalhas menos as vitórias)
    const losses = totalBattles - wins

    // Calcular as porcentagens
    const winPercentage = (wins / totalBattles) * 100
    const lossPercentage = (losses / totalBattles) * 100

    const cardImage = await findCardImage(card)

    // Enviar os resultados
    res.json({
      card,
      cardImage,
      totalBattles,
      wins,
      losses,
      winPercentage,
      lossPercentage
    })
  } catch (err) {
    res.status(500).json({ message: `Erro ao calcular porcentagens: ${err}` })
  }
})

// Rota para listar decks que produziram mais de X% de vitórias
router.get('/decks-win-percentage', async (req, res) => {
  const { winPercentage, startTime, endTime } = req.query

  // Verificação de parâmetros
  if (!winPercentage || !startTime || !endTime) {
    return res
      .status(400)
      .json({
        message:
          'Parâmetros winPercentage, startTime e endTime são necessários!'
      })
  }

  try {
    // Converter as datas para objetos Date do JavaScript
    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    // Usando aggregate para calcular vitórias por deck
    const result = await Battle.aggregate([
      {
        $match: {
          battleTime: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null, // Para contar todas as vitórias em geral
          totalBattles: { $sum: 1 }, // Total de batalhas
          wins: {
            $sum: {
              $cond: [
                { $eq: ['$winner', 'player1'] }, // Conta vitórias do player1
                1,
                0
              ]
            }
          },
          player1Deck: { $first: '$player1Deck' }, // Captura o deck do player1
          player2Deck: { $first: '$player2Deck' } // Captura o deck do player2
        }
      },
      {
        $project: {
          winRate: { $divide: ['$wins', '$totalBattles'] }, // Calcula a taxa de vitórias
          player1Deck: 1,
          player2Deck: 1
        }
      },
      {
        $match: {
          winRate: { $gt: winPercentage / 100 } // Filtra decks com taxa de vitórias maior que o limite
        }
      }
    ])

    if (!result.length) {
      return res
        .status(404)
        .json({
          message:
            'Nenhum deck encontrado com mais de essa porcentagem de vitórias no intervalo especificado.'
        })
    }

    // Formatar a resposta
    const decks = result.map((battle) => ({
      player1Deck: battle.player1Deck,
      player2Deck: battle.player2Deck,
      winRate: battle.winRate * 100 // Convertendo para porcentagem
    }))

    res.json(decks)
  } catch (err) {
    res.status(500).json({ message: `Erro ao calcular porcentagens: ${err}` })
  }
})

// Rota para calcular a quantidade de derrotas usando um combo de cartas
router.get('/defeats-by-card-combo', async (req, res) => {
  const { cardCombo, startTime, endTime } = req.query

  // Verificação de parâmetros
  if (!cardCombo || !startTime || !endTime) {
    return res
      .status(400)
      .json({
        message: 'Parâmetros cardCombo, startTime e endTime são necessários!'
      })
  }

  // Converter o combo de cartas em um array
  const comboArray = cardCombo.split(',').map((card) => card.trim())

  try {
    // Converter as datas para objetos Date do JavaScript
    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    // Contar derrotas onde o combo de cartas foi utilizado
    const defeatsCount = await Battle.countDocuments({
      battleTime: {
        $gte: startDate,
        $lte: endDate
      },
      winner: 'player2',
      $or: [
        { 'player1Deck.name': { $all: comboArray } }, // Verifica se o combo está no deck do player1
        { 'player2Deck.name': { $all: comboArray } } // Verifica se o combo está no deck do player2
      ]
    })

    const cardImages = await Promise.all(
      comboArray.map(async (card) => await findCardImage(card))
    )

    const deck = comboArray.map((card, index) => {
      return {
        name: card,
        imageURL: cardImages[index]
      }
    })

    res.json({ deck, defeatsCount })
  } catch (err) {
    res.status(500).json({ message: `Erro ao calcular derrotas: ${err}` })
  }
})

// Rota para calcular a quantidade de vitórias envolvendo uma carta específica
router.get('/wins-by-card-and-trophies', async (req, res) => {
  const { card, trophyPercentage, startTime, endTime } = req.query

  // Verificação de parâmetros
  if (!card || !trophyPercentage || !startTime || !endTime) {
    return res
      .status(400)
      .json({
        message:
          'Parâmetros card, trophyPercentage, startTime e endTime são necessários!'
      })
  }

  // Converter a porcentagem para um número decimal
  const trophyThreshold = 1 - trophyPercentage / 100 // Z% menos troféus

  try {
    // Converter as datas para objetos Date do JavaScript
    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    // Contar vitórias com as condições especificadas
    const winsCount = await Battle.find({
      battleTime: {
        $gte: startDate,
        $lte: endDate
      },
      winner: 'player1', // Verifica se player1 é o vencedor
      player2TowersDestroyed: { $gte: 2 }, // Player2 derrubou pelo menos 2 torres
      $or: [
        { 'player1Deck.name': card }, // Verifica se a carta está no deck do vencedor (player1)
        { 'player2Deck.name': card } // Verifica se a carta está no deck do perdedor (player2)
      ]
    })

    // Verificar se o vencedor possui Z% menos troféus do que o perdedor
    const validWins = winsCount.filter((battle) => {
      const player1Trophies = battle.player1Trophies
      const player2Trophies = battle.player2Trophies

      return player1Trophies < player2Trophies * trophyThreshold
    })

    const cardImage = await findCardImage(card)

    res.json({ card, cardImage, winsCount: validWins.length })
  } catch (err) {
    res.status(500).json({ message: `Erro ao calcular vitórias: ${err}` })
  }
})

// Rota para listar combos de cartas que produziram mais de Y% de vitórias
router.get('/combos-wins-percentage', async (req, res) => {
  const { deckQuantity, winPercentage, startTime, endTime } = req.query

  // Verificação de parâmetros
  if (!deckQuantity || !winPercentage || !startTime || !endTime) {
    return res
      .status(400)
      .json({
        message:
          'Parâmetros deckQuantity, winPercentage, startTime e endTime são necessários!'
      })
  }

  try {
    const deckLimit = Number.parseInt(deckQuantity)
    const winThreshold = Number.parseFloat(winPercentage)
    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    // Busca todas as batalhas no intervalo de timestamps
    const battles = await Battle.find({
      battleTime: { $gte: startDate, $lte: endDate }
    })

    // Onde serão armazenados os decks e as estatísticas de jogadas e vitórias
    let deckStats = {}

    // Filtrando os decks pela quantidade de cards desejada por deck
    const battlesFiltered = battles.filter(
      (battle) =>
        battle.player1Deck.length === deckLimit ||
        battle.player2Deck.length === deckLimit
    )

    // Processa cada batalha
    battlesFiltered.forEach((battle) => {
      // Identifica os decks usados
      const player1Deck = battle.player1Deck
      const player2Deck = battle.player2Deck

      // Chave única para os decks vencedores e não vencedores
      const player1DeckKey = player1Deck.map((card) => card.name).join(', ')
      const player2DeckKey = player2Deck.map((card) => card.name).join(', ')

      // Inicializa as estatísticas para o player1Deck se não estiver no objeto
      if (!deckStats[player1DeckKey]) {
        deckStats[player1DeckKey] = { played: 0, won: 0, details: player1Deck }
      }

      // Inicializa as estatísticas para o player2Deck se não estiver no objeto
      if (!deckStats[player2DeckKey]) {
        deckStats[player2DeckKey] = { played: 0, won: 0, details: player2Deck }
      }

      // Incrementa a contagem de vezes que os decks foram usados
      deckStats[player1DeckKey].played += 1
      deckStats[player2DeckKey].played += 1

      // Incrementa a contagem de vitórias apenas para o deck vencedor
      if (battle.winner === 'player1') {
        deckStats[player1DeckKey].won += 1
      } else {
        deckStats[player2DeckKey].won += 1
      }
    })

    // Calcula as porcentagens de vitória para cada deck
    const result = Object.keys(deckStats)
      .map((deckKey) => {
        const played = deckStats[deckKey].played
        const won = deckStats[deckKey].won
        const winPercentage = (won / played) * 100

        return {
          deck: deckStats[deckKey].details, // Detalhes do deck
          played,
          won,
          winPercentage
        }
      })
      .filter((item) => item.winPercentage >= winThreshold) // Filtra decks com % de vitória

    // Retornar o resultado
    res.json({ result })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: `Erro ao buscar combos: ${error}` })
  }
})

export default router
