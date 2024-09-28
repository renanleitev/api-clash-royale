import mongoose from 'mongoose';

const { Schema } = mongoose;

const PlayerSchema = new Schema({
  nickname: String,
  level: Number,
  trophies: Number,
  totalGames: Number,
  wins: Number,
  losses: Number,
  clan: String
});

const Player = mongoose.model('Player', PlayerSchema);

export default Player;
