import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Texto } from '@/components/Texto';
import { useSessao } from '@/contexts/SessaoContext';
import { URL_API } from '@/services/api';
import { cores, fontes } from '@/theme';

export default function Login() {
  const { entrar, entrarDemo } = useSessao();
  const { top, bottom } = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEntrar() {
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await entrar(email.trim().toLowerCase(), senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.');
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: cores.fundo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[estilos.conteudo, { paddingTop: top + 48, paddingBottom: bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={estilos.logo}>
          <Ionicons name="trash" size={34} color="#FFFFFF" />
        </View>
        <Texto peso="extrabold" tamanho={28} style={{ textAlign: 'center' }}>
          Coleta Inteligente
        </Texto>
        <Texto cor={cores.textoSuave} style={{ textAlign: 'center', marginTop: 4, marginBottom: 32 }}>
          Entre para ver a sua rota de hoje
        </Texto>

        <Texto peso="semibold" tamanho={13} cor={cores.textoSuave} style={estilos.rotulo}>
          E-mail
        </Texto>
        <View style={estilos.campo}>
          <Ionicons name="mail-outline" size={18} color={cores.textoSuave} />
          <TextInput
            style={estilos.entrada}
            value={email}
            onChangeText={setEmail}
            placeholder="seu.email@cidade.gov.br"
            placeholderTextColor={cores.textoFraco}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
          />
        </View>

        <Texto peso="semibold" tamanho={13} cor={cores.textoSuave} style={estilos.rotulo}>
          Senha
        </Texto>
        <View style={estilos.campo}>
          <Ionicons name="lock-closed-outline" size={18} color={cores.textoSuave} />
          <TextInput
            style={estilos.entrada}
            value={senha}
            onChangeText={setSenha}
            placeholder="••••••••"
            placeholderTextColor={cores.textoFraco}
            secureTextEntry={!verSenha}
            autoComplete="password"
            returnKeyType="go"
            onSubmitEditing={aoEntrar}
          />
          <Pressable onPress={() => setVerSenha((v) => !v)} hitSlop={10} accessibilityLabel={verSenha ? 'Ocultar senha' : 'Mostrar senha'}>
            <Ionicons name={verSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color={cores.textoSuave} />
          </Pressable>
        </View>

        {erro && (
          <View style={estilos.erro}>
            <Ionicons name="alert-circle" size={16} color={cores.vermelho} />
            <Texto tamanho={13} cor={cores.vermelho} style={{ flex: 1 }}>
              {erro}
            </Texto>
          </View>
        )}

        <Pressable
          onPress={aoEntrar}
          disabled={enviando}
          style={({ pressed }) => [estilos.botao, (pressed || enviando) && { opacity: 0.8 }]}
        >
          {enviando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Texto peso="bold" tamanho={16}>
              Entrar
            </Texto>
          )}
        </Pressable>

        <Pressable onPress={entrarDemo} style={({ pressed }) => [estilos.botaoSecundario, pressed && { opacity: 0.7 }]}>
          <Texto peso="semibold" cor={cores.azulClaro}>
            Testar sem servidor (modo demonstração)
          </Texto>
        </Pressable>

        <Texto tamanho={11} cor={cores.textoFraco} style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 32 }}>
          Servidor: {URL_API}
        </Texto>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { flexGrow: 1, paddingHorizontal: 24 },
  logo: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  rotulo: { marginBottom: 6, marginTop: 14 },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  entrada: { flex: 1, color: cores.texto, fontFamily: fontes.regular, fontSize: 15 },
  erro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: cores.vermelhoFundo,
    borderWidth: 1,
    borderColor: cores.vermelhoBorda,
  },
  botao: {
    marginTop: 24,
    height: 54,
    borderRadius: 16,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSecundario: { marginTop: 14, padding: 10, alignItems: 'center' },
});
