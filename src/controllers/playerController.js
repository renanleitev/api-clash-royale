import Battle from "../models/Battle.js";
import Player from "../models/Player.js";
import { getPlayerInfo, getPlayerBattles } from "../services/clashRoyaleService.js";

// Convertendo a data para o formato ISO (YYYY-MM-DDTHH:MM:SS.sssZ)
const formatDataString = (dataString) => {
    // Extrai partes da data
    const year = dataString.slice(0, 4);
    const month = dataString.slice(4, 6);
    const day = dataString.slice(6, 8);
    const hour = dataString.slice(9, 11);
    const min = dataString.slice(11, 13);
    const sec = dataString.slice(13, 15);
    
    // Constrói a nova string no formato desejado
    const dataConvertida = `${year}-${month}-${day}T${hour}:${min}:${sec}.000Z`;
    
    return dataConvertida;
};

const savePlayerData = async (playerData) => {
  const player = new Player({
    nickname: playerData?.name,
    level: playerData?.expLevel,
    trophies: playerData?.trophies,
    totalGames: playerData?.battleCount,
    wins: playerData?.wins,
    losses: playerData?.losses,
    clan: playerData?.clan ? playerData.clan?.name : 'Sem clã',
  });
  
  return await player.save();
};

const saveBattleData = async (battleData) => {
  const battle = new Battle({
    battleTime: new Date(formatDataString(battleData.battleTime)),
    player1: battleData.team[0].name,
    player2: battleData.opponent[0].name,
    player1TowersDestroyed: battleData.team[0].crowns,
    player2TowersDestroyed: battleData.opponent[0].crowns,
    winner: battleData.team[0].crowns > battleData.opponent[0].crowns ? 'player1' : 'player2',
    loser: battleData.team[0].crowns < battleData.opponent[0].crowns ? 'player1' : 'player2',
    player1Deck: battleData.team[0].cards.map(card => card.name),
    player2Deck: battleData.opponent[0].cards.map(card => card.name),
    player1Trophies: battleData.team[0].startingTrophies,
    player2Trophies: battleData.opponent[0].startingTrophies,
  });
  
  return await battle.save();
};

const savePlayerAndBattles = async (playerTag) => {
  // Obtém informações do jogador
  const playerData = await getPlayerInfo(playerTag);

  if (!playerData) {
    console.error('Nenhum dado encontrado para o jogador');
    return;
  }

  // Salva o jogador no banco de dados
  await savePlayerData(playerData);

  // Obtém e salva batalhas
  const battleData = await getPlayerBattles(playerTag);

  if (battleData && battleData.length > 0) {
    for (let battle of battleData) {
      await saveBattleData(battle);
    }
  }
};

export default savePlayerAndBattles;
