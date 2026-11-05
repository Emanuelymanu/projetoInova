import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

export class HistoricoTelemetria extends Model<
  InferAttributes<HistoricoTelemetria>,
  InferCreationAttributes<HistoricoTelemetria>
> {
  declare id: CreationOptional<number>;
  declare lixeira_id: number;
  declare nivel_preenchimento_pct: number;
  declare nivel_bateria_pct: number;
  declare distancia_cm: number;
  declare data_hora: Date;
}

HistoricoTelemetria.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    lixeira_id: { type: DataTypes.INTEGER, allowNull: false },
    nivel_preenchimento_pct: { type: DataTypes.INTEGER, allowNull: false },
    nivel_bateria_pct: { type: DataTypes.INTEGER, allowNull: false },
    distancia_cm: { type: DataTypes.INTEGER },
    data_hora: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, tableName: 'historico_telemetria', timestamps: false },
);
