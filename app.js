import express from 'express';
import connectDB from './src/config/database.js';
import playerRoutes from './src/routes/playerRoutes.js';

const app = express();

// Conecta ao MongoDB
connectDB();

// Usa as rotas
app.use('/player', playerRoutes);

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
