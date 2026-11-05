import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

export const TIPOS_USUARIO = ['GESTOR', 'MOTORISTA'] as const;
export type TipoUsuario = (typeof TIPOS_USUARIO)[number];

export class Usuario extends Model<InferAttributes<Usuario>, InferCreationAttributes<Usuario>> {
  declare id: CreationOptional<number>;
  declare nome: string;
  declare email: string;
  declare senha_hash: string;
  declare tipo: TipoUsuario;
  declare criado_em: CreationOptional<Date>;
}

Usuario.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    senha_hash: { type: DataTypes.STRING(255), allowNull: false },
    tipo: { type: DataTypes.ENUM(...TIPOS_USUARIO), allowNull: false },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'usuarios', timestamps: false },
);
