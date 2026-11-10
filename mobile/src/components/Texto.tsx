import { Text, type TextProps } from 'react-native';
import { cores, fontes } from '@/theme';

interface Props extends TextProps {
  peso?: keyof typeof fontes;
  tamanho?: number;
  cor?: string;
}

/** Text com a fonte Nunito e as cores do tema aplicadas. */
export function Texto({ peso = 'regular', tamanho = 14, cor = cores.texto, style, ...resto }: Props) {
  return <Text style={[{ fontFamily: fontes[peso], fontSize: tamanho, color: cor }, style]} {...resto} />;
}
