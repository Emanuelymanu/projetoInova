import { Zona } from '../models';

export function listarZonas() {
  return Zona.findAll({ order: [['nome', 'ASC']] });
}
