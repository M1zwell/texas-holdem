import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, getToken } from '../lib/api'
import { connectSocket } from '../lib/socket'
import { PlayingCard } from '../components/PlayingCard'
import type {
  ClientAction,
  PublicBaccaratState,
  PublicGameState,
  PublicHoldemState,
  PublicTttState,
} from '@shared/types'

export function TablePage() {
  const { id } = useParams()
  const [lobby, setLobby] = useState<any>(null)
  const [state, setState] = useState<PublicGameState | null>(null)
  const [me, setMe] = useState<string>('')
  const [chat, setChat] = useState<string[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id || !getToken()) return
    let live = true
    api
      .me()
      .then((r) => live && setMe(r.user.id))
      .catch(() => undefined)
    api
      .getLobby(id)
      .then((r) => {
        if (!live) return
        setLobby(r.lobby)
        setState(r.state)
      })
      .catch((err) => setError(err.message))
    const socket = connectSocket()
    socket.emit('join_room', { lobbyId: id })
    socket.on('gameState', (s: PublicGameState) => setState(s))
    socket.on('lobby', (l) => setLobby((prev: any) => ({ ...prev, ...l })))
    socket.on('chat', (m) => setChat((c) => [...c.slice(-30), `${m.name}: ${m.text}`]))
    socket.on('error', (e) => setError(e.message))
    return () => {
      live = false
      socket.off('gameState')
      socket.off('lobby')
      socket.off('chat')
      socket.off('error')
    }
  }, [id])

  if (!lobby) {
    return <div className="shell">{error || 'Loading table…'}</div>
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1 style={{ margin: 0 }}>{lobby.name}</h1>
          <div className="muted">
            {lobby.game} · host {lobby.hostName}
          </div>
        </div>
        <HostControls lobby={lobby} me={me} onLobby={setLobby} />
      </header>
      {error && <div className="notice">{error}</div>}
      {state?.kind === 'holdem' && <HoldemView state={state} me={me} lobbyId={id!} />}
      {state?.kind === 'baccarat' && <BaccaratView state={state} lobbyId={id!} />}
      {state?.kind === 'tictactoe' && <TttView state={state} me={me} lobbyId={id!} />}
      <section className="card" style={{ marginTop: 18 }}>
        <div className="muted">Table chat</div>
        {chat.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            connectSocket().emit('chat', { lobbyId: id, text })
            setText('')
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Say something"
          />
        </form>
      </section>
    </div>
  )
}

function HostControls({
  lobby,
  me,
  onLobby,
}: {
  lobby: any
  me: string
  onLobby: (l: any) => void
}) {
  const [busy, setBusy] = useState(false)
  const isHost = me !== '' && lobby.hostId === me
  if (!isHost) return null
  return (
    <div className="card" style={{ minWidth: 240 }}>
      {lobby.code && (
        <div>
          Join code · 加入码{' '}
          <strong className={lobby.codeBlurred ? 'blur-code' : ''}>{lobby.code}</strong>
        </div>
      )}
      <div className="actions">
        <button
          className="btn ghost"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            const r = await api.regenerate(lobby.id)
            onLobby({ ...lobby, code: r.code, expiresAt: r.expiresAt })
            setBusy(false)
          }}
        >
          Regenerate
        </button>
        <button
          className="btn ghost"
          onClick={async () => {
            await api.streamer(lobby.id, !lobby.streamerMode)
            onLobby({
              ...lobby,
              streamerMode: !lobby.streamerMode,
              codeBlurred: !lobby.streamerMode,
            })
          }}
        >
          {lobby.streamerMode ? 'Unblur' : 'Streamer blur'}
        </button>
        <button
          className="btn"
          onClick={() => connectSocket().emit('start_hand', { lobbyId: lobby.id })}
        >
          Start
        </button>
      </div>
      {lobby.waitlist?.map((w: any) => (
        <div key={w.user.id}>
          {w.user.name}{' '}
          <button className="btn" onClick={() => api.approve(lobby.id, w.user.id)}>
            Approve
          </button>
        </div>
      ))}
    </div>
  )
}

function HoldemView({
  state,
  me,
  lobbyId,
}: {
  state: PublicHoldemState
  me: string
  lobbyId: string
}) {
  const seats = useMemo(() => layoutSeats(state.players.length), [state.players.length])
  return (
    <div>
      <div className="felt">
        {state.players.map((p, i) => (
          <div
            key={p.id}
            className={`seat ${state.toAct === p.id ? 'to-act' : ''}`}
            style={seats[i]}
          >
            <div className="name">
              {p.name} {p.role ? `(${p.role})` : ''}
            </div>
            <div className="muted">
              {p.chips} · bet {p.bet}
              {p.folded ? ' · fold' : ''}
              {p.allIn ? ' · all-in' : ''}
            </div>
            <div className="board">
              {(p.hole ?? [null, null]).map((c, idx) => (
                <PlayingCard key={idx} card={c} hidden={!c} />
              ))}
            </div>
          </div>
        ))}
        <div className="pot">
          <div className="gold display" style={{ fontSize: 28 }}>
            Pot {state.pot}
          </div>
          <div className="muted">
            {state.street ?? 'waiting'} · hand #{state.handId}
          </div>
          <div className="board">
            {state.board.map((c) => (
              <PlayingCard key={c} card={c} />
            ))}
          </div>
          {state.you?.equity && (
            <div className="muted">Equity {(state.you.equity.win * 100).toFixed(1)}% win</div>
          )}
          {state.winners?.length ? (
            <div>
              Winners:{' '}
              {state.winners
                .map((w) => `${w.id.slice(0, 4)} +${w.amount} ${w.handName ?? ''}`)
                .join(', ')}
            </div>
          ) : null}
        </div>
      </div>
      <div className="actions">
        {(state.legal ?? []).map((a) => (
          <button key={a.type} className="btn" onClick={() => act(lobbyId, a)}>
            {label(a)}
          </button>
        ))}
      </div>
      {state.toAct === me && <p className="gold">Your turn · 到你行动</p>}
    </div>
  )
}

function BaccaratView({ state, lobbyId }: { state: PublicBaccaratState; lobbyId: string }) {
  return (
    <div className="card">
      <h2>Baccarat · 百家乐</h2>
      <p className="muted">
        Shoe {state.shoeRemaining} · {state.status}
      </p>
      <div className="grid-3">
        <div>
          <h3>Player · 闲 {state.playerTotal ?? ''}</h3>
          <div className="board">
            {state.playerCards.map((c) => (
              <PlayingCard key={c} card={c} />
            ))}
          </div>
        </div>
        <div>
          <h3>Banker · 庄 {state.bankerTotal ?? ''}</h3>
          <div className="board">
            {state.bankerCards.map((c) => (
              <PlayingCard key={c} card={c} />
            ))}
          </div>
        </div>
        <div>{state.winner && <h3>Winner: {state.winner}</h3>}</div>
      </div>
      <div className="actions">
        {(['player', 'banker', 'tie'] as const).map((seat) => (
          <button
            key={seat}
            className="btn"
            disabled={state.status !== 'betting'}
            onClick={() => {
              connectSocket().emit('baccarat_bet', { lobbyId, seat, amount: 100 })
            }}
          >
            Bet 100 {seat}
          </button>
        ))}
      </div>
    </div>
  )
}

function TttView({ state, me, lobbyId }: { state: PublicTttState; me: string; lobbyId: string }) {
  const mark = state.players.X === me ? 'X' : state.players.O === me ? 'O' : null
  return (
    <div className="card">
      <h2>Tic-Tac-Toe · 井字棋</h2>
      <p className="muted">
        {state.winner ? `Result: ${state.winner}` : state.xIsNext ? 'X to move' : 'O to move'}
      </p>
      <div className="ttt">
        {state.board.map((cell, i) => (
          <button key={i} onClick={() => connectSocket().emit('ttt_move', { lobbyId, index: i })}>
            {cell ?? ''}
          </button>
        ))}
      </div>
      {mark && <p>You are {mark}</p>}
      <button className="btn ghost" onClick={() => connectSocket().emit('ttt_reset', { lobbyId })}>
        Reset
      </button>
    </div>
  )
}

function act(lobbyId: string, action: ClientAction) {
  connectSocket().emit('player_action', { lobbyId, action })
}

function label(a: ClientAction): string {
  return a.amount != null ? `${a.type} ${a.amount}` : a.type
}

function layoutSeats(n: number): Array<{ top: string; left: string }> {
  return Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / Math.max(n, 1) + Math.PI / 2
    return {
      top: `${50 + Math.sin(angle) * 38}%`,
      left: `${50 + Math.cos(angle) * 38}%`,
      transform: 'translate(-50%, -50%)',
    } as { top: string; left: string }
  })
}
