import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, getToken, setToken } from '../lib/api'
import { subscribeLobbies } from '../lib/realtime'
import type { GameKind } from '@shared/types'

const GAMES: { kind: GameKind; title: string; zh: string; blurb: string }[] = [
  {
    kind: 'holdem',
    title: "Texas Hold'em",
    zh: '德州扑克',
    blurb: 'No-limit table · side pots · GA bots · Monte Carlo equity',
  },
  {
    kind: 'baccarat',
    title: 'Baccarat',
    zh: '百家乐',
    blurb: 'Tableau third-card rules · 8-deck shoe · player / banker / tie',
  },
  {
    kind: 'tictactoe',
    title: 'Tic-Tac-Toe',
    zh: '井字棋',
    blurb: 'Minimax seat · private room · turn-based sync',
  },
  {
    kind: 'blackjack',
    title: 'Blackjack',
    zh: '二十一点',
    blurb: 'Hit / stand · dealer 17 · 3:2 blackjack · play chips',
  },
  {
    kind: 'fortyfive',
    title: '45-Bust',
    zh: '四十五点 · 爆破',
    blurb: 'Keep drawing · closest to 45 wins · over 45 busts',
  },
]

export function HomePage() {
  const nav = useNavigate()
  const [name, setName] = useState(localStorage.getItem('jub-name') || '')
  const [game, setGame] = useState<GameKind>('holdem')
  const [roomName, setRoomName] = useState('')
  const [approval, setApproval] = useState(false)
  const [streamer, setStreamer] = useState(false)
  const [singleUse, setSingleUse] = useState(false)
  const [fillBots, setFillBots] = useState(true)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [open, setOpen] = useState<
    Array<{
      id: string
      name: string
      game: GameKind
      playerCount: number
      maxPlayers: number
      status: string
    }>
  >([])

  useEffect(() => {
    api
      .list()
      .then((r) => setOpen(r.lobbies))
      .catch(() => undefined)
    return subscribeLobbies((rows) => {
      setOpen(
        rows.map((l) => ({
          id: l.id,
          name: l.name,
          game: l.game,
          playerCount: l.player_count,
          maxPlayers: l.max_players,
          status: l.status,
        })),
      )
    })
  }, [])

  async function ensureSession() {
    if (getToken()) return
    const s = await api.session(name)
    setToken(s.token)
    localStorage.setItem('jub-name', s.user.name)
  }

  async function create() {
    setError('')
    try {
      await ensureSession()
      const created = await api.createLobby({
        name: roomName,
        game,
        maxPlayers: game === 'tictactoe' ? 2 : 6,
        approvalRequired: approval,
        singleUseInvites: singleUse,
        streamerMode: streamer,
        fillBots,
      })
      nav(`/table/${created.lobby.id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function goJoin() {
    nav(`/join?code=${encodeURIComponent(code.trim().toUpperCase())}`)
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">J</div>
          <div>
            <div className="display" style={{ fontSize: 28 }}>
              Jub Poker · 聚牌
            </div>
            <div className="muted">Play-chip tables · jubuddy.com/poker · m1z.gg</div>
          </div>
        </div>
        <div className="muted">Social chips only · 仅社交筹码</div>
      </header>

      <p className="muted" style={{ maxWidth: 720 }}>
        Private lobbies with short-lived join codes, host approval, streamer blur, and a
        server-authoritative engine. 私人大厅：短时加入码、房主审批、主播模糊、服务端权威状态。
      </p>

      <div className="grid-3" style={{ margin: '24px 0' }}>
        {GAMES.map((g) => (
          <button
            key={g.kind}
            className="card"
            onClick={() => setGame(g.kind)}
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              outline: game === g.kind ? '2px solid var(--gold)' : undefined,
            }}
          >
            <h2 style={{ margin: '0 0 6px' }}>{g.title}</h2>
            <div className="gold">{g.zh}</div>
            <p className="muted">{g.blurb}</p>
          </button>
        ))}
      </div>

      <div className="grid-3">
        <section className="card">
          <h3>Create private room · 创建房间</h3>
          <label className="field">
            Display name · 昵称
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </label>
          <label className="field">
            Table name · 房间名
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Night table 653"
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={approval}
              onChange={(e) => setApproval(e.target.checked)}
            />{' '}
            Host approval · 房主审批
          </label>
          <label>
            <input
              type="checkbox"
              checked={streamer}
              onChange={(e) => setStreamer(e.target.checked)}
            />{' '}
            Streamer mode · 主播模糊
          </label>
          <label>
            <input
              type="checkbox"
              checked={singleUse}
              onChange={(e) => setSingleUse(e.target.checked)}
            />{' '}
            One-use invite · 一次性邀请
          </label>
          <label>
            <input
              type="checkbox"
              checked={fillBots}
              onChange={(e) => setFillBots(e.target.checked)}
            />{' '}
            Fill empty seats with AI · AI补位
          </label>
          {error && <div className="notice">{error}</div>}
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={create}>
              Open table · 开局
            </button>
          </div>
        </section>

        <section className="card">
          <h3>Join with code · 加入码</h3>
          <p className="muted">
            Preview first — you will not teleport into a live hand. 先预览，不会直接空降。
          </p>
          <label className="field">
            Join code
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="AB3K7Q" />
          </label>
          <button className="btn ghost" onClick={goJoin}>
            Preview lobby · 预览大厅
          </button>
        </section>

        <section className="card">
          <h3>Open tables · 公开桌</h3>
          {open.length === 0 && <p className="muted">No public rooms yet.</p>}
          {open.map((l) => (
            <div key={l.id} style={{ marginBottom: 8 }}>
              <Link to={`/join?lobby=${l.id}`}>{l.name}</Link>
              <div className="muted">
                {l.game} · {l.playerCount}/{l.maxPlayers} · {l.status}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
