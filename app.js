import express from 'express';
import cors from 'cors';
import connectDB from './src/config/database.js';
import playerRoutes from './src/routes/playerRoutes.js';
import battleRoutes from './src/routes/battleRoutes.js';

const app = express();

// To avoid CORS errors
app.use(cors());
app.options('*', cors());

// Conecta ao MongoDB
connectDB();

// Usa as rotas
app.use('/players', playerRoutes);
app.use('/battles', battleRoutes);

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
