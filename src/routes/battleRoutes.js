import express from 'express';
import Battle from '../models/Battle.js';

/** Battles: Consultas específicas sobre as batalhas */
const router = express.Router();

/** Função para obter a imagem do card */
const findCardImage = async (card) => {
  // Obtendo a imagem do card
  const battle = await Battle.findOne({
    $or: [{ 'player1Deck.name': card }, { 'player2Deck.name': card }]
  });

  const cardFound1 = battle?.player1Deck?.find((item) => item.name === card);

  const cardFound2 = battle?.player2Deck?.find((item) => item.name === card);

  const cardImage = cardFound1?.imageURL ?? cardFound2?.imageURL ?? '';

  return cardImage;
};

// Rota para calcular a porcentagem de vitórias e derrotas com uma carta específica
router.get('/win-loss-percentage', async (req, res) => {
  const { card, startTime, endTime } = req.query;

  // Verificação de parâmetros
  if (!card || !startTime || !endTime) {
    return res.status(400).json({
      message: 'Parâmetros card, startTime e endTime são necessários!'
    });
  }

  try {
    // Converter as datas para objetos Date do JavaScript
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    const result = await Battle.aggregate([
      {
        // Filtrando pelo período e pelo nome do card (se está no deck do player1 ou do player2)
        $match: {
          battleTime: { $gte: startDate, $lte: endDate },
          $or: [{ 'player1Deck.name': card }, { 'player2Deck.name': card }]
        }
      },
      {
        // O $facet é utilizado para realizar multiplas operações de agregação
        $facet: {
          // Conta todas as batalhas em que a carta foi usada
          totalBattles: [
            {
              $count: 'total'
            }
          ],
          // Filtra todas as vezes em que a carta foi utilizada por um deck vitorioso
          wins: [
            {
              $match: {
                $or: [
                  { winner: 'player1', 'player1Deck.name': card },
                  { winner: 'player2', 'player2Deck.name': card }
                ]
              }
            },
            {
              $count: 'wins' // Conta as vitórias onde a carta foi usada pelo vencedor
            }
          ]
        }
      },
      {
        $project: {
          totalBattles: { $arrayElemAt: ['$totalBattles.total', 0] }, // Extrai o número total de batalhas
          wins: { $arrayElemAt: ['$wins.wins', 0] } // Extrai o número de vitórias
        }
      },
      {
        $project: {
          totalBattles: 1,
          wins: 1,
          losses: { $subtract: ['$totalBattles', '$wins'] }, // Calcula derrotas
          winPercentage: {
            $cond: {
              if: { $eq: ['$totalBattles', 0] },
              then: 0,
              else: {
                $multiply: [{ $divide: ['$wins', '$totalBattles'] }, 100]
              }
            }
          },
          lossPercentage: {
            $cond: {
              if: { $eq: ['$totalBattles', 0] },
              then: 0,
              else: {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$totalBattles', '$wins'] },
                      '$totalBattles'
                    ]
                  },
                  100
                ]
              }
            }
          }
        }
      }
    ]);

    const imageURL = await findCardImage(card);

    // Enviar os resultados
    res.json({
      name: card,
      imageURL,
      ...result[0]
    });
  } catch (err) {
    res.status(500).json({ message: `Erro ao calcular porcentagens: ${err}` });
  }
});

// Rota para listar decks que produziram mais de X% de vitórias
router.get('/decks-win-percentage', async (req, res) => {
  const { winPercentage, startTime, endTime } = req.query;

  // Verificação de parâmetros
  if (!winPercentage || !startTime || !endTime) {
    return res.status(400).json({
      message: 'Parâmetros winPercentage, startTime e endTime são necessários!'
    });
  }

  try {
    // Converter as datas para objetos Date do JavaScript
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const winThreshold = Number.parseFloat(winPercentage);

    // Consulta de agregação no MongoDB
    const result = await Battle.aggregate([
      {
        // Filtra as batalhas dentro do intervalo de tempo fornecido
        $match: {
          battleTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        // Desestrutura os decks dos dois jogadores e marca o vencedor
        $facet: {
          player1Stats: [
            {
              $project: {
                deck: '$player1Deck',
                winner: { $eq: ['$winner', 'player1'] } // Verifica se player1 venceu
              }
            }
          ],
          player2Stats: [
            {
              $project: {
                deck: '$player2Deck',
                winner: { $eq: ['$winner', 'player2'] } // Verifica se player2 venceu
              }
            }
          ]
        }
      },
      {
        // Combina os decks dos dois jogadores em um único array
        $project: {
          decks: {
            $concatArrays: ['$player1Stats', '$player2Stats']
          }
        }
      },
      {
        // Desestrutura o array de decks para processar cada deck individualmente
        $unwind: '$decks'
      },
      {
        // Agrupa os decks
        $group: {
          _id: {
            $map: { input: '$decks.deck', as: 'card', in: '$$card.name' }
          }, // Agrupa pelos nomes dos cards
          details: { $push: '$decks.deck' }, // Armazena os detalhes do deck
          played: { $sum: 1 }, // Conta quantas vezes o deck foi usado
          won: { $sum: { $cond: ['$decks.winner', 1, 0] } } // Conta quantas vezes o deck venceu
        }
      },
      {
        // Calcula a porcentagem de vitórias para cada deck
        $project: {
          details: {
            $reduce: {
              input: '$details',
              initialValue: [],
              in: { $setUnion: ['$$value', '$$this'] } // Remove decks duplicados
            }
          },
          winPercentage: {
            $multiply: [{ $divide: ['$won', '$played'] }, 100] // Calcula a % de vitórias
          },
          played: 1,
          won: 1
        }
      },
      {
        // Substitui a lista de nomes dos cards por um array de objetos contendo nome e imagem
        $project: {
          // Removendo o _id do resultado final
          _id: 0,
          deck: {
            // Obtendo apenas nomes e imagens únicos
            $setUnion: {
              // Fazendo um map para retornar um array de objetos com o nome e a imagem dos cards
              $map: {
                input: '$details',
                as: 'card',
                in: {
                  name: '$$card.name', // Pega o nome do card
                  imageURL: '$$card.imageURL' // Pega a imagem do card
                }
              }
            }
          },
          winPercentage: 1,
          played: 1,
          won: 1
        }
      },
      {
        // Filtra os decks que têm uma porcentagem de vitória maior ou igual que o limite
        $match: {
          winPercentage: { $gte: winThreshold }
        }
      },
      // Ordenando por ordem crescente
      {
        $sort: {
          winPercentage: 1
        }
      }
    ]);

    if (!result.length) {
      return res.status(404).json({
        message:
          'Nenhum deck encontrado com essa porcentagem de vitórias ou superior no intervalo especificado.'
      });
    }

    res.json({ ...result });
  } catch (err) {
    res.status(500).json({ message: `Erro ao calcular porcentagens: ${err}` });
  }
});

// Rota para calcular a quantidade de derrotas usando um combo de cartas
router.get('/defeats-by-card-combo', async (req, res) => {
  const { cardCombo, startTime, endTime } = req.query;

  // Verificação de parâmetros
  if (!cardCombo || !startTime || !endTime) {
    return res.status(400).json({
      message: 'Parâmetros cardCombo, startTime e endTime são necessários!'
    });
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  // Converter o combo de cartas em um array
  const combo = cardCombo.split(',').map((card) => card.trim());

  // Obtendo a imagem dos cards
  const deckImages = await Promise.all(
    combo.map(async (card) => await findCardImage(card))
  );

  // Salvando o deck com o nome e a imagem dos cards
  const deck = combo.map((card, index) => {
    return {
      name: card,
      imageURL: deckImages[index]
    };
  });

  try {
    const result = await Battle.aggregate([
      {
        $match: {
          battleTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $match: {
          $or: [
            { 'player1Deck.name': { $all: combo } }, // Verifica se o combo está no deck do player1
            { 'player2Deck.name': { $all: combo } } // Verifica se o combo está no deck do player2
          ]
        }
      },
      {
        $match: {
          $expr: {
            $eq: ['$winner', 'player2'] // Considerando que se a condição for verdadeira, o player1 perdeu e o player2 venceu
          }
        }
      },
      {
        $count: 'defeats' // Conta as derrotas
      }
    ]);

    res.json({ deck, ...result[0] });
  } catch (err) {
    res.status(500).json({ message: `Erro ao calcular derrotas: ${err}` });
  }
});

// Rota para calcular a quantidade de vitórias envolvendo uma carta específica
router.get('/wins-by-card-and-trophies', async (req, res) => {
  const { card, trophyPercentage, startTime, endTime } = req.query;

  // Verificação de parâmetros
  if (!card || !trophyPercentage || !startTime || !endTime) {
    return res.status(400).json({
      message:
        'Parâmetros card, trophyPercentage, startTime e endTime são necessários!'
    });
  }

  // Converter a porcentagem para um número decimal
  const trophyThreshold = Number.parseFloat(trophyPercentage) / 100;

  try {
    // Converter as datas para objetos Date do JavaScript
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    const result = await Battle.aggregate([
      {
        $match: {
          battleTime: { $gte: startDate, $lte: endDate },
          $or: [
            { player1Deck: { $elemMatch: { name: card } } }, // Verifica se a carta está no deck do player1
            { player2Deck: { $elemMatch: { name: card } } } // Verifica se a carta está no deck do player2
          ]
        }
      },
      {
        $match: {
          $expr: {
            $and: [
              {
                $gte: [
                  '$player1Trophies',
                  { $multiply: ['$player2Trophies', 1 - trophyThreshold] }
                ]
              }, // Vencedor (player1) tem Z% menos troféus que o perdedor
              {
                $gte: [
                  '$player2Trophies',
                  { $multiply: ['$player1Trophies', 1 - trophyThreshold] }
                ]
              }, // Vencedor (player2) tem Z% menos troféus que o perdedor
              { $gte: ['$player1TowersDestroyed', 2] }, // O perdedor (player2) derrubou pelo menos duas torres
              { $gte: ['$player2TowersDestroyed', 2] } // O perdedor (player1) derrubou pelo menos duas torres
            ]
          }
        }
      },
      {
        $group: {
          _id: null, // Agrupamos tudo em um único documento
          victories: {
            $sum: { $cond: [{ $eq: ['$winner', 'player1'] }, 1, 0] }
          } // Conta vitórias do player1
        }
      }
    ]);

    const imageURL = await findCardImage(card);

    res.json({ name: card, imageURL, ...result[0] });
  } catch (err) {
    res.status(500).json({ message: `Erro ao calcular vitórias: ${err}` });
  }
});

// Rota para listar combos de cartas que produziram mais de Y% de vitórias
router.get('/combos-wins-percentage', async (req, res) => {
  const { deckSize, winPercentage, startTime, endTime } = req.query;

  // Verificação de parâmetros
  if (!deckSize || !winPercentage || !startTime || !endTime) {
    return res.status(400).json({
      message:
        'Parâmetros deckSize, winPercentage, startTime e endTime são necessários!'
    });
  }

  try {
    const size = Number.parseInt(deckSize); // Convertendo para inteiro a fim de fazer o slice
    const winThreshold = Number.parseFloat(winPercentage); // Converte a porcentagem em fração
    const startDate = new Date(startTime); // Data de início
    const endDate = new Date(endTime); // Data de fim

    const result = await Battle.aggregate([
      {
        $match: {
          battleTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $project: {
          battleTime: 1,
          winner: 1,
          // OBS: Foi necessário substituir $slice por $filter baseado em índices,
          // pois o slice retornava elementos menores que o número de cards desejado
          player1Combo: {
            $filter: {
              input: '$player1Deck',
              as: 'card',
              cond: {
                $lt: [{ $indexOfArray: ['$player1Deck', '$$card'] }, size]
              } // Retorna apenas os primeiros 'size' elementos
            }
          },
          player2Combo: {
            $filter: {
              input: '$player2Deck',
              as: 'card',
              cond: {
                $lt: [{ $indexOfArray: ['$player2Deck', '$$card'] }, size]
              } // Retorna apenas os primeiros 'size' elementos
            }
          }
        }
      },
      {
        $project: {
          battleTime: 1,
          winner: 1,
          combo: {
            $cond: [
              { $eq: ['$winner', 'player1'] },
              {
                $map: {
                  input: '$player1Combo',
                  as: 'card',
                  in: { name: '$$card.name', image: '$$card.imageURL' }
                }
              }, // Se player1 venceu, usa deck do player1
              {
                $map: {
                  input: '$player2Combo',
                  as: 'card',
                  in: { name: '$$card.name', image: '$$card.imageURL' }
                }
              } // Se player2 venceu, usa deck do player2
            ]
          }
        }
      },
      {
        $group: {
          _id: { combo: '$combo' }, // Agrupa pelo combo de cartas
          victories: {
            $sum: {
              $cond: [{ $eq: ['$winner', 'player1'] }, 1, 0] // Conta vitórias do player1
            }
          },
          total: { $sum: 1 } // Conta quantas vezes o combo foi jogado
        }
      },
      {
        $project: {
          // Removendo o campo _id do resultado final
          _id: 0,
          // Obtendo o deck
          deck: '$_id.combo',
          // Primeiro, divide o número de vitórias pelo total (victories/total)
          // Depois, multipla por 100 para transformar em porcentagem
          winPercentage: {
            $multiply: [{ $divide: ['$victories', '$total'] }, 100]
          }, // Calcula o percentual de vitórias
          victories: 1,
          total: 1
        }
      },
      {
        $match: {
          winPercentage: { $gte: winThreshold } // Filtra combos com % de vitórias maior que o threshold
        }
      },
      {
        $sort: { winPercentage: 1 } // Ordena os resultados por % de vitórias em ordem decrescente
      }
    ]);

    // Retornar o resultado
    res.json({ ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Erro ao buscar combos: ${error}` });
  }
});

export default router;
