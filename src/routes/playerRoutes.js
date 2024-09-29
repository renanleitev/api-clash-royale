import express from 'express';
import savePlayerAndBattles from '../controllers/playerController.js';
import Player from '../models/Player.js';
import Battle from '../models/Battle.js';
import { playersTagList } from '../config/playersTagList.js';

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

// Rota para obter a quantidade de players cadastrados
router.get('/profile/all-players/count', async (req, res) => {
  try {
    const players = await Player.countDocuments();

    if (!players) {
      return res.status(404).json({ message: 'Não há jogadores cadastrados!' });
    }

    res.json({ playersNumber: players }); // Envia os dados do jogador como resposta
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

// Rota para obter informações das batalhas de todos os jogadores
router.get('/battles/all-battles', async (req, res) => {
  try {
    const battles = await Battle.find({});

    res.json(battles); // Envia a lista de batalhas como resposta
  } catch (err) {
    res.status(500).json({ message: `Erro ao buscar batalhas: ${err}` });
  }
});

// Rota para obter a quantidade de batalhas cadastradas
router.get('/battles/all-battles/count', async (req, res) => {
  try {
    const battles = await Battle.countDocuments();

    res.json({ battlesNumber: battles }); // Envia a lista de batalhas como resposta
  } catch (err) {
    res.status(500).json({ message: `Erro ao buscar batalhas: ${err}` });
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
