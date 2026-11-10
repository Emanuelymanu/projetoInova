import { View } from 'react-native';
import { Texto } from './Texto';

interface Props {
  texto: string;
  cor: string;
  fundo: string;
  borda: string;
  ponto?: boolean;
}

/** Etiqueta arredondada, como "Prioridade alta" ou "Completa". */
export function Selo({ texto, cor, fundo, borda, ponto = false }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: borda,
        backgroundColor: fundo,
      }}
    >
      {ponto && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cor }} />}
      <Texto peso="semibold" tamanho={12} cor={cor}>
        {texto}
      </Texto>
    </View>
  );
}
