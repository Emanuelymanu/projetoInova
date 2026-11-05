import { app } from './app';
import { sequelize } from './config/database';
import { env } from './config/env';

async function iniciar() {
  try {
    await sequelize.authenticate();
  } catch (erro) {
    console.error('Não foi possível conectar ao MySQL. O container está rodando?', erro);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`API e dashboard em http://localhost:${env.PORT}`);
  });
}

iniciar();
