import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

export class Zona extends Model<InferAttributes<Zona>, InferCreationAttributes<Zona>> {
  declare id: CreationOptional<number>;
  declare nome: string;
  declare descricao: string | null;
}

Zona.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    descricao: { type: DataTypes.TEXT },
  },
  { sequelize, tableName: 'zonas', timestamps: false },
);
