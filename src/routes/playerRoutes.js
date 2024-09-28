import express from "express";
import savePlayerAndBattles from "../controllers/playerController.js";
import Player from "../models/Player.js";
import Battle from "../models/Battle.js";
import { playersTagList } from "../config/playersTagList.js";

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
    
    res.json(player);  // Envia os dados do jogador como resposta
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar jogador!', error: err });
  }
});

// Rota para buscar batalhas pelo nickname do jogador
router.get('/battles/:nickname', async (req, res) => {
  const { nickname } = req.params;

  try {
    const battles = await Battle.find({
      player1: { $regex: nickname, $options: 'i' } 
    });

    res.json(battles);  // Envia a lista de batalhas como resposta
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar batalhas!', error: err });
  }
});

// Rota para popular todos os jogadores de uma lista (players + battles)
// Atenção: Dependendo do tamanho da lista, pode demorar até 5 minutos para popular a base de dados
router.get('/save-all-players', async (req, res) => {  
  try {
    for (let tag of playersTagList) {
      await savePlayerAndBattles(tag);
    }
    const successMessage = 'Dados do jogadores e suas batalhas foram salvos no MongoDB.';
    res.send(successMessage);
    console.log(successMessage);
  } catch (error) {
    const errorMessage = `Erro ao processar os dados: ${error}`;
    res.status(500).send(errorMessage);
    console.error(errorMessage);
  }
});

export default router;
