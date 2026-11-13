import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Carregando } from './components/ui'
import { SessaoProvider } from './lib/sessao'
import { useSessao } from './lib/sessaoContexto'
import { Equipe } from './pages/Equipe'
import { LixeiraDetalhe } from './pages/LixeiraDetalhe'
import { Lixeiras } from './pages/Lixeiras'
import { Login } from './pages/Login'
import { NovaRota } from './pages/NovaRota'
import { RotaDetalhe } from './pages/RotaDetalhe'
import { Rotas } from './pages/Rotas'
import { VisaoGeral } from './pages/VisaoGeral'
import { Zonas } from './pages/Zonas'

function Paginas() {
  const { carregando, usuario } = useSessao()
  if (carregando) return <Carregando texto="Verificando sessão…" />
  if (!usuario) return <Login />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<VisaoGeral />} />
        <Route path="rotas" element={<Rotas />} />
        <Route path="rotas/nova" element={<NovaRota />} />
        <Route path="rotas/:id" element={<RotaDetalhe />} />
        <Route path="lixeiras" element={<Lixeiras />} />
        <Route path="lixeiras/:id" element={<LixeiraDetalhe />} />
        <Route path="zonas" element={<Zonas />} />
        <Route path="motoristas" element={<Equipe />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <SessaoProvider>
        <Paginas />
      </SessaoProvider>
    </BrowserRouter>
  )
}
