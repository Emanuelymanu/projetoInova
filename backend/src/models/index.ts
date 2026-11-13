import { HistoricoTelemetria } from './HistoricoTelemetria';
import { Lixeira } from './Lixeira';
import { Rota } from './Rota';
import { RotaParada } from './RotaParada';
import { Usuario } from './Usuario';
import { Zona } from './Zona';

Zona.hasMany(Lixeira, { foreignKey: 'zona_id', as: 'lixeiras' });
Lixeira.belongsTo(Zona, { foreignKey: 'zona_id', as: 'zona' });

Lixeira.hasMany(HistoricoTelemetria, { foreignKey: 'lixeira_id', as: 'historico' });
HistoricoTelemetria.belongsTo(Lixeira, { foreignKey: 'lixeira_id', as: 'lixeira' });

Usuario.hasMany(Rota, { foreignKey: 'motorista_id', as: 'rotas' });
Rota.belongsTo(Usuario, { foreignKey: 'motorista_id', as: 'motorista' });

Rota.hasMany(RotaParada, { foreignKey: 'rota_id', as: 'paradas' });
RotaParada.belongsTo(Rota, { foreignKey: 'rota_id', as: 'rota' });
RotaParada.belongsTo(Lixeira, { foreignKey: 'lixeira_id', as: 'lixeira' });

export { HistoricoTelemetria, Lixeira, Rota, RotaParada, Usuario, Zona };
