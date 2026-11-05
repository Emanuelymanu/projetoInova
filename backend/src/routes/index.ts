import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as dashboardController from '../controllers/dashboard.controller';
import * as lixeiraController from '../controllers/lixeira.controller';
import * as telemetriaController from '../controllers/telemetria.controller';
import * as usuarioController from '../controllers/usuario.controller';
import * as zonaController from '../controllers/zona.controller';
import { autenticar, exigirTipo } from '../middlewares/auth.middleware';
import { autenticarSensor } from '../middlewares/sensor.middleware';

export const routes = Router();

// Autenticação
routes.post('/auth/cadastro', authController.cadastrar);
routes.post('/auth/login', authController.login);
routes.get('/auth/perfil', autenticar, authController.perfil);

// Usuários (criar outro gestor, por exemplo)
routes.post('/usuarios', autenticar, exigirTipo('GESTOR'), usuarioController.criar);

// Sensor da lixeira
routes.post('/telemetria', autenticarSensor, telemetriaController.registrar);

// Dashboard
routes.get('/dashboard', autenticar, dashboardController.obter);
routes.get('/zonas', autenticar, zonaController.listar);

// Lixeiras
routes.get('/lixeiras', autenticar, lixeiraController.listar);
routes.post('/lixeiras', autenticar, exigirTipo('GESTOR'), lixeiraController.criar);
routes.get('/lixeiras/:id', autenticar, lixeiraController.buscar);
routes.get('/lixeiras/:id/historico', autenticar, lixeiraController.historico);
