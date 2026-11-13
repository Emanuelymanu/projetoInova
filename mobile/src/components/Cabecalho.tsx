import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores } from '@/theme';
import { Texto } from './Texto';

/** Topo das telas: título grande, subtítulo e um conteúdo opcional embaixo (ex.: filtros). */
export function Cabecalho({
  titulo,
  subtitulo,
  acao,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  /** Botão no canto direito do título. */
  acao?: ReactNode;
  children?: ReactNode;
}) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[estilos.topo, { paddingTop: top + 20 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Texto peso="bold" tamanho={26} style={{ flex: 1 }}>
          {titulo}
        </Texto>
        {acao}
      </View>
      {subtitulo && (
        <Texto tamanho={13} cor={cores.textoSuave} style={{ marginTop: 2 }}>
          {subtitulo}
        </Texto>
      )}
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  topo: {
    backgroundColor: cores.fundoTopo,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
});
