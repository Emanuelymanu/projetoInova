import { HistoricoTelemetria } from './HistoricoTelemetria';
import { Lixeira } from './Lixeira';
import { Usuario } from './Usuario';
import { Zona } from './Zona';

Zona.hasMany(Lixeira, { foreignKey: 'zona_id', as: 'lixeiras' });
Lixeira.belongsTo(Zona, { foreignKey: 'zona_id', as: 'zona' });

Lixeira.hasMany(HistoricoTelemetria, { foreignKey: 'lixeira_id', as: 'historico' });
HistoricoTelemetria.belongsTo(Lixeira, { foreignKey: 'lixeira_id', as: 'lixeira' });

export { HistoricoTelemetria, Lixeira, Usuario, Zona };
