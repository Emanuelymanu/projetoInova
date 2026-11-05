import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database';
import type { Zona } from './Zona';

export type StatusLixeira = 'OPERACIONAL' | 'MANUTENCAO' | 'DESATIVADO';

export class Lixeira extends Model<InferAttributes<Lixeira>, InferCreationAttributes<Lixeira>> {
  declare id: CreationOptional<number>;
  declare codigo_identificador: string;
  declare latitude: number;
  declare longitude: number;
  declare localizacao: unknown;
  declare capacidade_litros: CreationOptional<number>;
  declare altura_cm: CreationOptional<number>;
  declare nivel_preenchimento_pct: CreationOptional<number>;
  declare nivel_bateria_pct: CreationOptional<number>;
  declare status: CreationOptional<StatusLixeira>;
  declare zona_id: number | null;
  declare ultima_atualizacao: CreationOptional<Date>;

  declare zona?: NonAttribute<Zona>;
}

Lixeira.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    codigo_identificador: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
    localizacao: { type: DataTypes.GEOMETRY('POINT', 4326), allowNull: false },
    capacidade_litros: { type: DataTypes.INTEGER, defaultValue: 240 },
    altura_cm: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
    nivel_preenchimento_pct: { type: DataTypes.INTEGER, defaultValue: 0 },
    nivel_bateria_pct: { type: DataTypes.INTEGER, defaultValue: 100 },
    status: {
      type: DataTypes.ENUM('OPERACIONAL', 'MANUTENCAO', 'DESATIVADO'),
      defaultValue: 'OPERACIONAL',
    },
    zona_id: { type: DataTypes.INTEGER },
    ultima_atualizacao: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'lixeiras',
    timestamps: false,
    // latitude/longitude já expõem a posição; o POINT só serve a consultas espaciais.
    defaultScope: { attributes: { exclude: ['localizacao'] } },
  },
);
