import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { PRIORIDADE, prioridadeDe } from '../lib/formatar'
import type { Lixeira } from '../lib/tipos'

// Mapa do OpenStreetMap: gratuito e sem chave de API. O tema escuro vem de um filtro CSS
// (.leaflet-tile-pane em index.css). Para muito acesso, use um provedor de mapas próprio.
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATRIBUICAO = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

export interface PontoMapa {
  lixeira: Lixeira
  /** Número da ordem de visita; sem ele, o ponto é um círculo simples. */
  ordem?: number
  /** Coletada: aparece cinza. */
  apagado?: boolean
  popup?: ReactNode
}

function Enquadrar({ pontos }: { pontos: PontoMapa[] }) {
  const mapa = useMap()
  // Só as coordenadas: reenquadra quando os pontos mudam, não a cada nova leitura de nível.
  const coordenadas = JSON.stringify(pontos.map((p) => [p.lixeira.latitude, p.lixeira.longitude]))
  useEffect(() => {
    const lista = JSON.parse(coordenadas) as L.LatLngTuple[]
    if (lista.length === 0) return
    mapa.fitBounds(L.latLngBounds(lista), { padding: [36, 36], maxZoom: 16 })
  }, [mapa, coordenadas])
  return null
}

function corDo(ponto: PontoMapa) {
  return ponto.apagado ? '#64748B' : PRIORIDADE[prioridadeDe(ponto.lixeira.nivel_preenchimento_pct)].cor
}

function iconeNumerado(ordem: number, cor: string) {
  return L.divIcon({
    className: '',
    html: `<div class="marcador-numero" style="background:${cor}">${ordem}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  })
}

export function Mapa({ pontos, ligar = false, alto = false }: { pontos: PontoMapa[]; ligar?: boolean; alto?: boolean }) {
  const centro: [number, number] = pontos[0] ? [pontos[0].lixeira.latitude, pontos[0].lixeira.longitude] : [-23.5505, -46.6333]

  return (
    <div className={`mapa${alto ? ' alto' : ''}`}>
      <MapContainer center={centro} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer url={TILES} attribution={ATRIBUICAO} />
        <Enquadrar pontos={pontos} />
        {ligar && pontos.length > 1 && (
          <Polyline
            positions={pontos.map((p): L.LatLngTuple => [p.lixeira.latitude, p.lixeira.longitude])}
            pathOptions={{ color: '#5B8CFF', weight: 3, opacity: 0.8, dashArray: '6 8' }}
          />
        )}
        {pontos.map((p) => {
          const cor = corDo(p)
          const conteudo = p.popup ?? <PopupLixeira lixeira={p.lixeira} />
          return p.ordem !== undefined ? (
            <Marker key={p.lixeira.id} position={[p.lixeira.latitude, p.lixeira.longitude]} icon={iconeNumerado(p.ordem, cor)}>
              <Popup>{conteudo}</Popup>
            </Marker>
          ) : (
            <CircleMarker
              key={p.lixeira.id}
              center={[p.lixeira.latitude, p.lixeira.longitude]}
              radius={8}
              pathOptions={{ color: '#0A1220', weight: 2, fillColor: cor, fillOpacity: 1 }}
            >
              <Popup>{conteudo}</Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}

function PopupLixeira({ lixeira }: { lixeira: Lixeira }) {
  return (
    <div>
      <strong>{lixeira.codigo_identificador}</strong>
      {lixeira.endereco && <div className="suave">{lixeira.endereco}</div>}
      <div style={{ marginTop: 4 }}>
        Nível <strong>{lixeira.nivel_preenchimento_pct}%</strong> · bateria {lixeira.nivel_bateria_pct}%
      </div>
      <Link to={`/lixeiras/${lixeira.id}`}>Ver detalhes</Link>
    </div>
  )
}

/** Legenda das cores, sempre com texto. */
export function LegendaMapa({ comColetada = false }: { comColetada?: boolean }) {
  return (
    <div className="legenda">
      <span>
        <i style={{ background: PRIORIDADE.alta.cor }} /> Urgente (80% ou mais)
      </span>
      <span>
        <i style={{ background: PRIORIDADE.media.cor }} /> Atenção (50–79%)
      </span>
      <span>
        <i style={{ background: PRIORIDADE.baixa.cor }} /> OK
      </span>
      {comColetada && (
        <span>
          <i style={{ background: '#64748B' }} /> Coletada
        </span>
      )}
    </div>
  )
}
