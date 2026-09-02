import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, getToken, setToken } from '../lib/api'
import type { LobbyPreview } from '@shared/types'

export function JoinPage() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [preview, setPreview] = useState<LobbyPreview | null>(null)
  const [error, setError] = useState('')
  const [name, setName] = useState(localStorage.getItem('jub-name') || '')
  const [waitlisted, setWaitlisted] = useState(false)

  useEffect(() => {
    const token = params.get('token') ?? undefined
    const code = params.get('code') ?? undefined
    const lobby = params.get('lobby') ?? undefined
    if (!token && !code && !lobby) {
      setError('Invite credential missing. 缺少邀请凭证。')
      return
    }
    if (lobby && !token && !code) {
      api
        .getLobby(lobby)
        .then((r) => {
          setPreview({
            lobbyId: r.lobby.id,
            name: r.lobby.name,
            hostName: r.lobby.hostName,
            game: r.lobby.game,
            status: r.lobby.status,
            playerCount: r.lobby.members?.length ?? 0,
            maxPlayers: r.lobby.maxPlayers,
            approvalRequired: r.lobby.approvalRequired,
            expiresAt: r.lobby.expiresAt,
            blinds: r.lobby.blinds,
          })
        })
        .catch(() => {
          setError('This public table needs a join code from the host. 公开桌仍需房主加入码。')
        })
      return
    }
    api
      .preview({ token, code })
      .then((r) => setPreview(r.preview))
      .catch((err) => {
        setError(err.message)
      })
  }, [params])

  async function confirm() {
    if (!preview) return
    try {
      if (!getToken()) {
        const s = await api.session(name)
        setToken(s.token)
        localStorage.setItem('jub-name', s.user.name)
      }
      const result = await api.join(preview.lobbyId)
      if (result.waitlisted) {
        setWaitlisted(true)
        return
      }
      nav(`/table/${preview.lobbyId}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="shell">
      <h1>Lobby preview · 大厅预览</h1>
      <p className="muted">Confirm before the WebSocket handshake. 确认后再建立实时连接。</p>
      {error && <div className="notice">{error}</div>}
      {preview && (
        <section className="card" style={{ maxWidth: 460 }}>
          <h2>{preview.name}</h2>
          <p>Host · 房主：{preview.hostName}</p>
          <p>Game · 玩法：{preview.game}</p>
          <p>
            Seats · 人数：{preview.playerCount}/{preview.maxPlayers}
          </p>
          <p>Status · 状态：{preview.status}</p>
          {preview.blinds && (
            <p>
              Blinds · 盲注：{preview.blinds.small}/{preview.blinds.big}
            </p>
          )}
          {preview.approvalRequired && <p className="gold">Host approval required · 需房主同意</p>}
          <p className="muted">
            Code expires · 验证码失效：{new Date(preview.expiresAt).toLocaleTimeString()}
          </p>
          {preview.status === 'playing' && (
            <div className="notice">This hand has already started. 牌局已开战。</div>
          )}
          <label className="field">
            Your name · 昵称
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          {waitlisted ? (
            <p>Waiting for host approval · 等待房主同意…</p>
          ) : (
            <button
              className="btn"
              onClick={confirm}
              disabled={preview.status === 'playing' || preview.playerCount >= preview.maxPlayers}
            >
              Confirm join · 确认加入
            </button>
          )}
        </section>
      )}
    </div>
  )
}
