import axios from "axios";
import 'dotenv/config';

export const getPlayerInfo = async (playerTag) => {
  try {
    const response = await axios.get(`${process.env.CLASH_BASE_URL}/players/%23${playerTag}`, {
      headers: { Authorization: `Bearer ${process.env.CLASH_TOKEN_API}` },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados do jogador', error);
    return null;
  }
};

export const getPlayerBattles = async (playerTag) => {
  try {
    const response = await axios.get(`${process.env.CLASH_BASE_URL}/players/%23${playerTag}/battlelog`, {
      headers: { Authorization: `Bearer ${process.env.CLASH_TOKEN_API}` },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar batalhas do jogador', error);
    return null;
  }
};
