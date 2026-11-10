import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapaRota } from '@/components/MapaRota';
import { Texto } from '@/components/Texto';
import { useRota } from '@/contexts/RotaContext';
import { useSessao } from '@/contexts/SessaoContext';
import { cores } from '@/theme';
import { dataCurta, prioridadeDe, tempoDesde } from '@/utils/formatar';

export default function Inicio() {
  const { sessao } = useSessao();
  const { lixeiras, coletadas, carregando, erro, atualizadoEm, atualizar, emAndamento, iniciar } = useRota();
  const { top } = useSafeAreaInsets();
  const [atualizando, setAtualizando] = useState(false);
  const agora = useRelogio();

  const primeiroNome = sessao?.usuario.nome.split(' ').slice(0, 2).join(' ') ?? '';
  const concluidos = lixeiras.filter((l) => coletadas.has(l.id)).length;
  const pendentes = lixeiras.length - concluidos;
  const urgentes = lixeiras.filter((l) => !coletadas.has(l.id) && prioridadeDe(l) === 'alta').length;
  const semSinal = lixeiras.filter((l) => l.sem_sinal).length;

  async function aoPuxar() {
    setAtualizando(true);
    await atualizar();
    setAtualizando(false);
  }

  function aoIniciar() {
    iniciar();
    router.navigate('/rota');
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoPuxar} tintColor={cores.texto} />}
    >
      <View style={[estilos.topo, { paddingTop: top + 16 }]}>
        <View style={estilos.linhaTopo}>
          <View style={{ flex: 1 }}>
            <Texto tamanho={14} cor={cores.textoSuave}>
              Olá,
            </Texto>
            <Texto peso="bold" tamanho={26} numberOfLines={1}>
              {primeiroNome} 👋
            </Texto>
          </View>
          <Pressable style={estilos.sino} onPress={() => router.navigate('/rota')} accessibilityLabel="Avisos">
            <Ionicons name="notifications-outline" size={22} color={cores.texto} />
            {urgentes > 0 && <View style={estilos.pontoAviso} />}
          </Pressable>
        </View>

        <StatusSensores erro={erro} semSinal={semSinal} atualizadoEm={atualizadoEm} agora={agora} demo={!!sessao?.demo} />
      </View>

      <View style={estilos.corpo}>
        <View style={estilos.cartao}>
          <View style={estilos.linhaTitulo}>
            <Texto peso="bold" tamanho={18}>
              Rota de hoje
            </Texto>
            <Texto tamanho={13} cor={cores.textoSuave}>
              {dataCurta(new Date(agora))}
            </Texto>
          </View>
          {carregando && lixeiras.length === 0 ? (
            <ActivityIndicator color={cores.primaria} style={{ paddingVertical: 24 }} />
          ) : (
            <View style={estilos.numeros}>
              <Numero valor={lixeiras.length} rotulo="Total" cor={cores.texto} />
              <Numero valor={concluidos} rotulo="Concluídos" cor={cores.verde} />
              <Numero valor={pendentes} rotulo="Pendentes" cor={cores.azulClaro} />
            </View>
          )}
        </View>

        {urgentes > 0 && (
          <Pressable
            onPress={() => router.navigate({ pathname: '/rota', params: { filtro: 'prioridade' } })}
            style={({ pressed }) => [estilos.alerta, pressed && { opacity: 0.85 }]}
          >
            <View style={estilos.iconeAlerta}>
              <Ionicons name="warning-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Texto peso="bold" tamanho={16} cor={cores.vermelho}>
                {urgentes} {urgentes === 1 ? 'ponto precisa' : 'pontos precisam'} de coleta urgente
              </Texto>
              <Texto tamanho={12} cor="#F08A8A" style={{ marginTop: 2 }}>
                Toque para ver a lista
              </Texto>
            </View>
            <Ionicons name="chevron-forward" size={20} color={cores.vermelho} />
          </Pressable>
        )}

        <View style={estilos.linhaTitulo}>
          <Texto peso="bold" tamanho={16}>
            Mapa da rota
          </Texto>
          <Pressable onPress={() => router.navigate('/rota')} hitSlop={8}>
            <Texto peso="semibold" tamanho={13} cor={cores.primariaSuave}>
              Ver completo
            </Texto>
          </Pressable>
        </View>
        <MapaRota lixeiras={lixeiras} coletadas={coletadas} />

        <Pressable
          onPress={aoIniciar}
          disabled={lixeiras.length === 0}
          style={({ pressed }) => [estilos.botao, (pressed || lixeiras.length === 0) && { opacity: 0.7 }]}
        >
          <Ionicons name={emAndamento ? 'navigate' : 'play'} size={22} color="#FFFFFF" />
          <Texto peso="bold" tamanho={17}>
            {emAndamento ? 'Continuar rota' : 'Iniciar rota'}
          </Texto>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/** Atualiza o "há X min" a cada 30 s. */
function useRelogio() {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return agora;
}

function StatusSensores({
  erro,
  semSinal,
  atualizadoEm,
  agora,
  demo,
}: {
  erro: string | null;
  semSinal: number;
  atualizadoEm: number | null;
  agora: number;
  demo: boolean;
}) {
  let cor: string = cores.verde;
  let fundo: string = cores.verdeFundo;
  let borda: string = cores.verdeBorda;
  let texto = atualizadoEm ? `Sensores IoT ativos · última sync ${tempoDesde(atualizadoEm, agora)}` : 'Sincronizando sensores…';

  if (erro) {
    [cor, fundo, borda, texto] = [cores.vermelho, cores.vermelhoFundo, cores.vermelhoBorda, erro];
  } else if (semSinal > 0) {
    [cor, fundo, borda] = [cores.amarelo, cores.amareloFundo, cores.amareloBorda];
    texto = `${semSinal} ${semSinal === 1 ? 'sensor sem sinal' : 'sensores sem sinal'} · sync ${tempoDesde(atualizadoEm ?? agora, agora)}`;
  }
  if (demo && !erro) texto = `Modo demonstração · ${texto}`;

  return (
    <View style={[estilos.status, { backgroundColor: fundo, borderColor: borda }]}>
      <View style={[estilos.pontoStatus, { backgroundColor: cor }]} />
      <Texto tamanho={12} cor={cor} style={{ flex: 1 }} numberOfLines={2}>
        {texto}
      </Texto>
    </View>
  );
}

function Numero({ valor, rotulo, cor }: { valor: number; rotulo: string; cor: string }) {
  return (
    <View style={estilos.numero}>
      <Texto peso="bold" tamanho={26} cor={cor}>
        {valor}
      </Texto>
      <Texto tamanho={12} cor={cores.textoSuave}>
        {rotulo}
      </Texto>
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
    gap: 14,
  },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sino: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.cartao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pontoAviso: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: cores.vermelho,
    borderWidth: 1.5,
    borderColor: cores.cartao,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  pontoStatus: { width: 7, height: 7, borderRadius: 4 },
  corpo: { padding: 20, gap: 16 },
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 16,
    gap: 14,
  },
  linhaTitulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numeros: { flexDirection: 'row', gap: 10 },
  numero: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: cores.cartaoInterno,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: cores.vermelhoFundo,
    borderWidth: 1,
    borderColor: cores.vermelhoBorda,
  },
  iconeAlerta: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: cores.vermelho,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botao: {
    flexDirection: 'row',
    gap: 10,
    height: 58,
    borderRadius: 16,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: cores.primaria,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
