import mongoose from "mongoose";

const { Schema } = mongoose;

const BattleSchema = new Schema({
  battleTime: Date,
  player1: String,
  player2: String,
  player1TowersDestroyed: Number,
  player2TowersDestroyed: Number,
  winner: String,
  loser: String,
  player1Deck: [{
    name: String, 
    imageURL: String,
  }], 
  player2Deck: [{
    name: String, 
    imageURL: String,
  }],
  player1Trophies: Number,
  player2Trophies: Number,
});

const Battle = mongoose.model('Battle', BattleSchema);

export default Battle;
