import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database';
import type { RotaParada } from './RotaParada';
import type { Usuario } from './Usuario';

export const STATUS_ROTA = ['PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'] as const;
export type StatusRota = (typeof STATUS_ROTA)[number];

export class Rota extends Model<InferAttributes<Rota>, InferCreationAttributes<Rota>> {
  declare id: CreationOptional<number>;
  declare motorista_id: number | null;
  /** DATEONLY: o driver devolve "AAAA-MM-DD". */
  declare data_rota: string;
  declare status: CreationOptional<StatusRota>;
  declare distancia_total_km: number | null;
  declare tempo_estimado_min: number | null;
  declare iniciada_em: Date | null;
  declare concluida_em: Date | null;
  declare criado_em: CreationOptional<Date>;

  declare motorista?: NonAttribute<Usuario>;
  declare paradas?: NonAttribute<RotaParada[]>;
}

Rota.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    motorista_id: { type: DataTypes.INTEGER },
    data_rota: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM(...STATUS_ROTA), defaultValue: 'PLANEJADA' },
    distancia_total_km: { type: DataTypes.DECIMAL(6, 2) },
    tempo_estimado_min: { type: DataTypes.INTEGER },
    iniciada_em: { type: DataTypes.DATE },
    concluida_em: { type: DataTypes.DATE },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'rotas', timestamps: false },
);
