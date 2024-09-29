import express from 'express';
import savePlayerAndBattles from '../controllers/playerController.js';
import Player from '../models/Player.js';
import Battle from '../models/Battle.js';
import { playersTagList } from '../config/playersTagList.js';

/** Players: Informações gerais sobre os jogadores e as batalhas */
const router = express.Router();

// Rota para buscar e salvar dados de um jogador pela player tag
router.get('/save/:tag', async (req, res) => {
  const playerTag = req.params.tag;

  try {
    await savePlayerAndBattles(playerTag);
    const successMessage = `Dados do jogador ${playerTag} e suas batalhas foram salvos no MongoDB.`;
    res.send(successMessage);
    console.log(successMessage);
  } catch (error) {
    const errorMessage = `Erro ao processar os dados: ${error}`;
    res.status(500).send(errorMessage);
    console.error(errorMessage);
  }
});

// Rota para popular todos os jogadores de uma lista (players + battles)
// Atenção: Dependendo do tamanho da lista, pode demorar até 5 minutos para popular a base de dados
router.get('/save-all-players', async (req, res) => {
  try {
    for (let tag of playersTagList) {
      await savePlayerAndBattles(tag);
    }
    const successMessage =
      'Dados do jogadores e suas batalhas foram salvos no MongoDB.';
    res.send(successMessage);
    console.log(successMessage);
  } catch (error) {
    const errorMessage = `Erro ao processar os dados: ${error}`;
    res.status(500).send(errorMessage);
    console.error(errorMessage);
  }
});

// Rota para obter informações de todos os jogadores
router.get('/profile/all-players', async (req, res) => {
  try {
    const players = await Player.find({});

    if (!players) {
      return res.status(404).json({ message: 'Não há jogadores cadastrados!' });
    }

    res.json(players); // Envia os dados do jogador como resposta
  } catch (err) {
    res.status(500).json({ message: `Erro ao buscar jogadores: ${err}` });
  }
});

// Rota para obter informações de um jogador pelo nickname
router.get('/profile/:nickname', async (req, res) => {
  const { nickname } = req.params;

  try {
    // Usando expressão regular para busca "LIKE" (parcial e case-insensitive)
    const player = await Player.find({
      // 'i' para ignorar maiúsculas/minúsculas
      nickname: { $regex: nickname, $options: 'i' }
    });

    if (!player) {
      return res.status(404).json({ message: 'Jogador não encontrado!' });
    }

    res.json(player); // Envia os dados do jogador como resposta
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar jogador!', error: err });
  }
});

// Rota para obter informações gerais de todos os jogadores
router.get('/profile/all-players/status', async (req, res) => {
  try {
    const playersNumber = await Player.countDocuments();

    if (!playersNumber) {
      return res.status(404).json({ message: 'Não há jogadores cadastrados!' });
    }

    const playersStatus = await Player.aggregate([
      {
        $group: {
          _id: null,
          levelMin: { $min: '$level' },
          levelMax: { $max: '$level' },
          levelAvg: { $avg: '$level' },
          totalGamesAvg: { $avg: '$totalGames' },
          trophiesAvg: { $avg: '$trophies' },
          winsAvg: { $avg: '$wins' },
          lossesAvg: { $avg: '$losses' }
        }
      }
    ]);

    res.json({
      playersNumber,
      ...playersStatus[0]
    }); // Envia os dados do jogador como resposta
  } catch (err) {
    res.status(500).json({ message: `Erro ao buscar jogadores: ${err}` });
  }
});

// Rota para obter informações das batalhas de todos os jogadores
router.get('/battles/all-battles', async (req, res) => {
  try {
    const battles = await Battle.find({});

    res.json(battles);
  } catch (err) {
    res.status(500).json({ message: `Erro ao buscar batalhas: ${err}` });
  }
});

// Rota para obter a quantidade de batalhas cadastradas
router.get('/battles/all-battles/status', async (req, res) => {
  try {
    const battlesNumber = await Battle.countDocuments();

    if (!battlesNumber) {
      return res.status(404).json({ message: 'Não há batalhas cadastradas!' });
    }

    const battlesStatus = await Battle.aggregate([
      {
        $group: {
          _id: null,
          winsPlayer1: {
            $sum: {
              $cond: [
                { $eq: ['$winner', 'player1'] }, // Conta vitórias do player1
                1,
                0
              ]
            }
          },
          winsPlayer2: {
            $sum: {
              $cond: [
                { $eq: ['$winner', 'player2'] }, // Conta vitórias do player1
                1,
                0
              ]
            }
          },
          player1TrophiesAvg: { $avg: '$player1Trophies' },
          player2TrophiesAvg: { $avg: '$player2Trophies' },
          player1TowersDestroyedAvg: { $avg: '$player1TowersDestroyed' },
          player2TowersDestroyedAvg: { $avg: '$player2TowersDestroyed' }
        }
      }
    ]);

    res.json({ battlesNumber, ...battlesStatus[0] });
  } catch (err) {
    res.status(500).json({ message: `Erro ao buscar batalhas: ${err}` });
  }
});

// Rota para obter o deck mais popular
router.get('/battles/all-battles/most-popular-deck', async (req, res) => {
  try {
    // Agregação para buscar decks únicos e quantas vezes eles foram jogados
    const uniqueDecks = await Battle.aggregate([
      {
        // Separa os decks dos dois jogadores
        $facet: {
          player1Decks: [
            {
              $project: {
                deck: '$player1Deck'
              }
            }
          ],
          player2Decks: [
            {
              $project: {
                deck: '$player2Deck'
              }
            }
          ]
        }
      },
      {
        // Combina os decks de ambos os jogadores em um único array
        $project: {
          decks: {
            $concatArrays: ['$player1Decks', '$player2Decks']
          }
        }
      },
      {
        // Desestrutura o array para que cada deck seja tratado individualmente
        $unwind: '$decks'
      },
      {
        // Agrupa os decks pela combinação única de cartas e conta quantas vezes cada um foi jogado
        $group: {
          _id: { deck: '$decks.deck' },
          played: { $sum: 1 }, // Conta quantas vezes o deck foi jogado
          cards: { $first: '$decks.deck' } // Mantém as informações das cartas
        }
      },
      {
        // Ordena os decks pelos mais jogados
        $sort: { played: -1 }
      },
      {
        // Projeta os detalhes dos decks com nomes e imagens das cartas
        $project: {
          played: 1, // Quantidade de vezes que o deck foi jogado
          deck: {
            $map: {
              input: '$cards',
              as: 'card',
              in: {
                name: '$$card.name', // Nome da carta
                image: '$$card.image' // Imagem da carta
              }
            }
          }
        }
      }
    ]);

    res.json({ ...uniqueDecks[0] });
  } catch (err) {
    res.status(500).json({ message: `Erro ao buscar decks: ${err}` });
  }
});

// Rota para buscar batalhas pelo nickname do jogador
router.get('/battles/:nickname', async (req, res) => {
  const { nickname } = req.params;

  try {
    const battles = await Battle.find({
      $or: [
        { player1: { $regex: nickname, $options: 'i' } },
        { player2: { $regex: nickname, $options: 'i' } }
      ]
    });

    res.json(battles); // Envia a lista de batalhas como resposta
  } catch (err) {
    res.status(500).json({ message: `Erro ao buscar batalhas: ${err}` });
  }
});

export default router;
