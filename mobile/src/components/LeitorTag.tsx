import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Switch, TextInput, Vibration, View, type TextInputInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRota } from '@/contexts/RotaContext';
import { cores, fontes } from '@/theme';
import { Texto } from './Texto';

interface Leitura {
  id: number;
  ok: boolean;
  mensagem: string;
}

/**
 * Recebe as leituras do leitor UHF Bluetooth no modo teclado (HID): o leitor "digita"
 * o código da tag no campo e manda Enter. O campo fica sempre em foco, então o motorista
 * só aponta o leitor e aperta o gatilho. Sem leitor, dá para digitar o código.
 */
export function LeitorTag({ visivel, aoFechar }: { visivel: boolean; aoFechar: () => void }) {
  const { lerTag } = useRota();
  const { bottom } = useSafeAreaInsets();
  const campo = useRef<TextInputInstance>(null);
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [teclado, setTeclado] = useState(false);
  const [leituras, setLeituras] = useState<Leitura[]>([]);

  async function registrar() {
    const epc = codigo.trim();
    setCodigo('');
    if (!epc || enviando) return;
    setEnviando(true);
    const resultado = await lerTag(epc);
    setEnviando(false);
    // Vibração curta = deu certo; três toques = algo errado. O motorista não precisa olhar a tela.
    Vibration.vibrate(resultado.ok ? 60 : [0, 120, 80, 120, 80, 120]);
    setLeituras((atual) => [{ id: Date.now(), ...resultado }, ...atual].slice(0, 6));
    campo.current?.focus();
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={aoFechar} onShow={() => campo.current?.focus()}>
      <KeyboardAvoidingView style={estilos.fundo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[estilos.folha, { paddingBottom: bottom + 20 }]}>
          <View style={estilos.topo}>
            <View style={{ flex: 1 }}>
              <Texto peso="bold" tamanho={20}>
                Ler tag da lixeira
              </Texto>
              <Texto tamanho={13} cor={cores.textoSuave}>
                Aponte o leitor para a tag e aperte o gatilho
              </Texto>
            </View>
            <Pressable onPress={aoFechar} hitSlop={10} accessibilityLabel="Fechar leitor">
              <Ionicons name="close" size={26} color={cores.textoSuave} />
            </Pressable>
          </View>

          <Pressable style={estilos.alvo} onPress={() => campo.current?.focus()}>
            {enviando ? (
              <ActivityIndicator color={cores.primariaSuave} size="large" />
            ) : (
              <Ionicons name="scan-outline" size={44} color={cores.primariaSuave} />
            )}
            <Texto peso="semibold" cor={cores.textoSuave} style={{ marginTop: 8 }}>
              {enviando ? 'Registrando…' : 'Aguardando leitura'}
            </Texto>
          </Pressable>

          <TextInput
            ref={campo}
            value={codigo}
            onChangeText={setCodigo}
            onSubmitEditing={registrar}
            submitBehavior="submit"
            autoFocus
            autoCapitalize="characters"
            autoCorrect={false}
            showSoftInputOnFocus={teclado}
            placeholder={teclado ? 'Digite o código da tag e toque em OK' : 'O código lido aparece aqui'}
            placeholderTextColor={cores.textoFraco}
            style={estilos.campo}
            returnKeyType="done"
          />
          <View style={estilos.linhaTeclado}>
            <Texto tamanho={13} cor={cores.textoSuave} style={{ flex: 1 }}>
              Sem leitor? Mostrar o teclado para digitar o código
            </Texto>
            <Switch
              value={teclado}
              onValueChange={(v) => {
                setTeclado(v);
                // Refoca para o teclado aparecer (ou sumir) na hora.
                campo.current?.blur();
                setTimeout(() => campo.current?.focus(), 50);
              }}
              trackColor={{ true: cores.primaria, false: cores.borda }}
            />
          </View>

          {leituras.map((l) => (
            <View key={l.id} style={[estilos.leitura, l.ok ? estilos.leituraOk : estilos.leituraErro]}>
              <Ionicons name={l.ok ? 'checkmark-circle' : 'alert-circle'} size={18} color={l.ok ? cores.verde : cores.vermelho} />
              <Texto tamanho={14} cor={l.ok ? cores.texto : '#F8A5A5'} style={{ flex: 1 }}>
                {l.mensagem}
              </Texto>
            </View>
          ))}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fundo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(3,8,18,0.6)' },
  folha: {
    backgroundColor: cores.fundoTopo,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 20,
    gap: 12,
  },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  alvo: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 130,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: cores.azulBorda,
    backgroundColor: cores.cartaoInterno,
  },
  campo: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.cartao,
    paddingHorizontal: 14,
    color: cores.texto,
    fontFamily: fontes.semibold,
    fontSize: 15,
    letterSpacing: 1,
  },
  linhaTeclado: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  leitura: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  leituraOk: { backgroundColor: cores.verdeFundo, borderColor: cores.verdeBorda },
  leituraErro: { backgroundColor: cores.vermelhoFundo, borderColor: cores.vermelhoBorda },
});
