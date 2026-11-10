import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Cabecalho } from '@/components/Cabecalho';
import { Texto } from '@/components/Texto';
import { useRota } from '@/contexts/RotaContext';
import { useSessao } from '@/contexts/SessaoContext';
import { URL_API } from '@/services/api';
import { cores } from '@/theme';

export default function Perfil() {
  const { sessao, sair } = useSessao();
  const { historico } = useRota();
  if (!sessao) return null;
  const { usuario, demo } = sessao;

  const iniciais = usuario.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
  const totalColetas = historico.reduce((soma, r) => soma + r.coletas, 0);

  function aoSair() {
    Alert.alert('Sair da conta?', 'O andamento da rota fica salvo neste aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: sair },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <Cabecalho titulo="Perfil" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={[estilos.cartao, { alignItems: 'center', paddingVertical: 24 }]}>
          <View style={estilos.avatar}>
            <Texto peso="bold" tamanho={26}>
              {iniciais}
            </Texto>
          </View>
          <Texto peso="bold" tamanho={20} style={{ marginTop: 12 }}>
            {usuario.nome}
          </Texto>
          <Texto cor={cores.textoSuave}>{usuario.tipo === 'GESTOR' ? 'Gestor' : 'Motorista'}</Texto>
        </View>

        <View style={estilos.resumo}>
          <Resumo valor={historico.length} rotulo="Rotas finalizadas" />
          <Resumo valor={totalColetas} rotulo="Coletas" />
        </View>

        <View style={estilos.cartao}>
          <Linha icone="mail-outline" rotulo="E-mail" valor={usuario.email} />
          <Linha icone="id-card-outline" rotulo="Matrícula" valor={String(usuario.id)} />
          <Linha icone="server-outline" rotulo="Servidor" valor={demo ? 'Modo demonstração (sem servidor)' : URL_API} ultima />
        </View>

        <Pressable onPress={aoSair} style={({ pressed }) => [estilos.sair, pressed && { opacity: 0.8 }]}>
          <Ionicons name="log-out-outline" size={20} color={cores.vermelho} />
          <Texto peso="bold" cor={cores.vermelho}>
            Sair
          </Texto>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Resumo({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <View style={[estilos.cartao, { flex: 1, alignItems: 'center' }]}>
      <Texto peso="bold" tamanho={24} cor={cores.azulClaro}>
        {valor}
      </Texto>
      <Texto tamanho={12} cor={cores.textoSuave}>
        {rotulo}
      </Texto>
    </View>
  );
}

function Linha({ icone, rotulo, valor, ultima }: { icone: keyof typeof Ionicons.glyphMap; rotulo: string; valor: string; ultima?: boolean }) {
  return (
    <View style={[estilos.linha, !ultima && estilos.linhaBorda]}>
      <Ionicons name={icone} size={20} color={cores.textoSuave} />
      <View style={{ flex: 1 }}>
        <Texto tamanho={12} cor={cores.textoSuave}>
          {rotulo}
        </Texto>
        <Texto peso="semibold" numberOfLines={1}>
          {valor}
        </Texto>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumo: { flexDirection: 'row', gap: 12 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  linhaBorda: { borderBottomWidth: 1, borderBottomColor: cores.borda },
  sair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cores.vermelhoBorda,
    backgroundColor: cores.vermelhoFundo,
  },
});
