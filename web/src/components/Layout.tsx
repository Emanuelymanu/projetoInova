import { LayoutDashboard, LogOut, MapPinned, Route, Trash2, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { iniciais } from '../lib/formatar'
import { useSessao } from '../lib/sessaoContexto'

const MENU = [
  { para: '/', rotulo: 'Visão geral', icone: LayoutDashboard, fim: true },
  { para: '/rotas', rotulo: 'Rotas', icone: Route },
  { para: '/lixeiras', rotulo: 'Lixeiras', icone: Trash2 },
  { para: '/zonas', rotulo: 'Locais', icone: MapPinned },
  { para: '/motoristas', rotulo: 'Equipe', icone: Users },
]

export function Layout() {
  const { usuario, sair } = useSessao()

  return (
    <div className="estrutura">
      <nav className="lateral" aria-label="Menu principal">
        <div className="marca">
          <span className="marca-icone">
            <Trash2 size={18} aria-hidden />
          </span>
          <span>
            Coleta Inteligente
            <small>Painel do gestor</small>
          </span>
        </div>
        {MENU.map(({ para, rotulo, icone: Icone, fim }) => (
          <NavLink key={para} to={para} end={fim} className={({ isActive }) => `menu-item${isActive ? ' ativo' : ''}`} title={rotulo}>
            <Icone size={19} aria-hidden />
            <span>{rotulo}</span>
          </NavLink>
        ))}
        <div className="lateral-rodape">
          <span className="avatar">{iniciais(usuario?.nome ?? '')}</span>
          <span className="nome">
            {usuario?.nome}
            <small>Gestor</small>
          </span>
          <button type="button" className="botao-icone" onClick={sair} aria-label="Sair" title="Sair">
            <LogOut size={17} />
          </button>
        </div>
      </nav>
      <main className="principal">
        <Outlet />
      </main>
    </div>
  )
}
