import type { CardCode } from '@shared/types'

const SUIT: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' }

export function PlayingCard({ card, hidden }: { card?: CardCode | null; hidden?: boolean }) {
  if (!card || hidden) {
    return <div className="pcard back">J</div>
  }
  const red = card[1] === 'h' || card[1] === 'd'
  const rank = card[0] === 'T' ? '10' : card[0]
  return (
    <div className={`pcard ${red ? 'red' : ''}`} aria-label={`${rank}${SUIT[card[1]]}`}>
      <div>{rank}</div>
      <div style={{ textAlign: 'center', fontSize: 22 }}>{SUIT[card[1]]}</div>
      <div style={{ transform: 'rotate(180deg)' }}>{rank}</div>
    </div>
  )
}
