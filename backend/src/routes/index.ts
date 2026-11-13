import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as dashboardController from '../controllers/dashboard.controller';
import * as lixeiraController from '../controllers/lixeira.controller';
import * as rotaController from '../controllers/rota.controller';
import * as telemetriaController from '../controllers/telemetria.controller';
import * as usuarioController from '../controllers/usuario.controller';
import * as zonaController from '../controllers/zona.controller';
import { autenticar, exigirTipo } from '../middlewares/auth.middleware';
import { autenticarSensor } from '../middlewares/sensor.middleware';

export const routes = Router();

const gestor = exigirTipo('GESTOR');
const motorista = exigirTipo('MOTORISTA');

// Autenticação
routes.post('/auth/cadastro', authController.cadastrar);
routes.post('/auth/login', authController.login);
routes.get('/auth/perfil', autenticar, authController.perfil);

// Usuários (motoristas e gestores)
routes.get('/usuarios', autenticar, gestor, usuarioController.listar);
routes.post('/usuarios', autenticar, gestor, usuarioController.criar);
routes.patch('/usuarios/:id', autenticar, gestor, usuarioController.atualizar);

// Sensor da lixeira
routes.post('/telemetria', autenticarSensor, telemetriaController.registrar);

// Dashboard
routes.get('/dashboard', autenticar, dashboardController.obter);

// Zonas
routes.get('/zonas', autenticar, zonaController.listar);
routes.post('/zonas', autenticar, gestor, zonaController.criar);
routes.patch('/zonas/:id', autenticar, gestor, zonaController.atualizar);

// Lixeiras
routes.get('/lixeiras', autenticar, lixeiraController.listar);
routes.post('/lixeiras', autenticar, gestor, lixeiraController.criar);
routes.get('/lixeiras/:id', autenticar, lixeiraController.buscar);
routes.patch('/lixeiras/:id', autenticar, gestor, lixeiraController.atualizar);
routes.get('/lixeiras/:id/historico', autenticar, lixeiraController.historico);

// Rotas de coleta. "/rotas/atual" vem antes de "/rotas/:id" para não ser lido como id.
routes.get('/rotas', autenticar, rotaController.listar);
routes.get('/rotas/atual', autenticar, motorista, rotaController.atual);
routes.post('/rotas', autenticar, gestor, rotaController.criar);
routes.get('/rotas/:id', autenticar, rotaController.buscar);
routes.post('/rotas/:id/iniciar', autenticar, rotaController.iniciar);
routes.patch('/rotas/:id/paradas/:paradaId', autenticar, rotaController.marcarParada);
routes.post('/rotas/:id/leituras-rfid', autenticar, rotaController.leituraRfid);
routes.post('/rotas/:id/finalizar', autenticar, rotaController.finalizar);
routes.post('/rotas/:id/cancelar', autenticar, gestor, rotaController.cancelar);
