import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import type { Lixeira, StatusLixeira, Zona } from '../lib/tipos'
import { MensagemErro, Modal } from './ui'

/** Cadastro (sem `lixeira`) ou edição de uma lixeira. */
export function FormLixeira({
  lixeira,
  zonas,
  aoFechar,
  aoSalvar,
}: {
  lixeira?: Lixeira
  zonas: Zona[]
  aoFechar: () => void
  aoSalvar: (l: Lixeira) => void
}) {
  const [codigo, setCodigo] = useState(lixeira?.codigo_identificador ?? '')
  const [endereco, setEndereco] = useState(lixeira?.endereco ?? '')
  const [epc, setEpc] = useState(lixeira?.epc ?? '')
  const [latitude, setLatitude] = useState(lixeira ? String(lixeira.latitude) : '')
  const [longitude, setLongitude] = useState(lixeira ? String(lixeira.longitude) : '')
  const [capacidade, setCapacidade] = useState(String(lixeira?.capacidade_litros ?? 240))
  const [altura, setAltura] = useState(String(lixeira?.altura_cm ?? 100))
  const [zonaId, setZonaId] = useState(lixeira?.zona ? String(lixeira.zona.id) : '')
  const [status, setStatus] = useState<StatusLixeira>(lixeira?.status ?? 'OPERACIONAL')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    const lat = Number(latitude.replace(',', '.'))
    const lng = Number(longitude.replace(',', '.'))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setErro('Latitude e longitude precisam ser números, ex.: -23.5505 e -46.6333.')
      return
    }
    const corpo = {
      codigo_identificador: codigo.trim(),
      endereco: endereco.trim() || null,
      epc: epc.trim() || null,
      latitude: lat,
      longitude: lng,
      capacidade_litros: Number(capacidade),
      altura_cm: Number(altura),
      zona_id: zonaId ? Number(zonaId) : null,
      ...(lixeira ? { status } : {}),
    }
    setEnviando(true)
    setErro(null)
    try {
      const salva = lixeira
        ? await api<Lixeira>(`/lixeiras/${lixeira.id}`, { metodo: 'PATCH', corpo })
        : await api<Lixeira>('/lixeiras', { metodo: 'POST', corpo })
      aoSalvar(salva)
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar.')
      setEnviando(false)
    }
  }

  return (
    <Modal titulo={lixeira ? `Editar ${lixeira.codigo_identificador}` : 'Nova lixeira'} aoFechar={aoFechar}>
      <form className="formulario" onSubmit={aoEnviar}>
        <div className="linha">
          <label className="rotulo">
            Código do sensor
            <input className="entrada" required maxLength={50} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="LIX-012" />
          </label>
          <label className="rotulo">
            Local
            <select className="entrada" value={zonaId} onChange={(e) => setZonaId(e.target.value)}>
              <option value="">Sem zona</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="rotulo">
          Endereço
          <input
            className="entrada"
            maxLength={150}
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Praça Central, Rua Principal 120"
          />
        </label>
        <label className="rotulo">
          Código da tag RFID (EPC)
          <input
            className="entrada"
            maxLength={100}
            value={epc}
            onChange={(e) => setEpc(e.target.value)}
            placeholder="E28068940000501234567890"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="ajuda">
            O código gravado na tag UHF colada na lixeira. Com o leitor no modo teclado, clique aqui e leia a tag.
          </span>
        </label>
        <div className="linha">
          <label className="rotulo">
            Latitude
            <input className="entrada" required inputMode="decimal" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="-23.5505" />
          </label>
          <label className="rotulo">
            Longitude
            <input className="entrada" required inputMode="decimal" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-46.6333" />
          </label>
        </div>
        <div className="linha">
          <label className="rotulo">
            Capacidade (litros)
            <input className="entrada" type="number" min={1} required value={capacidade} onChange={(e) => setCapacidade(e.target.value)} />
          </label>
          <label className="rotulo">
            Altura interna (cm)
            <input className="entrada" type="number" min={1} max={1000} required value={altura} onChange={(e) => setAltura(e.target.value)} />
            <span className="ajuda">Da tampa (sensor) até o fundo. Usada para calcular o nível.</span>
          </label>
        </div>
        {lixeira && (
          <label className="rotulo">
            Situação do equipamento
            <select className="entrada" value={status} onChange={(e) => setStatus(e.target.value as StatusLixeira)}>
              <option value="OPERACIONAL">Operacional</option>
              <option value="MANUTENCAO">Em manutenção</option>
              <option value="DESATIVADO">Desativada (sai das rotas e do painel)</option>
            </select>
          </label>
        )}
        {erro && <MensagemErro>{erro}</MensagemErro>}
        <div className="modal-acoes">
          <button type="button" className="botao secundario" onClick={aoFechar}>
            Cancelar
          </button>
          <button type="submit" className="botao" disabled={enviando}>
            {lixeira ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
