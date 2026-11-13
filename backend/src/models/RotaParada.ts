import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database';
import type { Lixeira } from './Lixeira';

export type Confirmacao = 'RFID' | 'SENSOR' | 'MANUAL';

export class RotaParada extends Model<InferAttributes<RotaParada>, InferCreationAttributes<RotaParada>> {
  declare id: CreationOptional<number>;
  declare rota_id: number;
  declare lixeira_id: number;
  declare ordem_visita: number;
  declare coletado: CreationOptional<boolean>;
  declare data_hora_coleta: Date | null;
  declare confirmacao: Confirmacao | null;
  declare epc_lido: string | null;
  declare nivel_na_coleta: number | null;
  declare esvaziada_em: Date | null;

  declare lixeira?: NonAttribute<Lixeira>;
}

RotaParada.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    rota_id: { type: DataTypes.INTEGER, allowNull: false },
    lixeira_id: { type: DataTypes.INTEGER, allowNull: false },
    ordem_visita: { type: DataTypes.INTEGER, allowNull: false },
    coletado: { type: DataTypes.BOOLEAN, defaultValue: false },
    data_hora_coleta: { type: DataTypes.DATE },
    confirmacao: { type: DataTypes.ENUM('RFID', 'SENSOR', 'MANUAL') },
    epc_lido: { type: DataTypes.STRING(64) },
    nivel_na_coleta: { type: DataTypes.INTEGER },
    esvaziada_em: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'rota_paradas', timestamps: false },
);
