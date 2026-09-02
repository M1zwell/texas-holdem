import type { Lobby } from './store'

export function publicLobby(lobby: Lobby, hostView: boolean) {
  return {
    id: lobby.id,
    name: lobby.name,
    game: lobby.game,
    hostId: lobby.hostId,
    hostName: lobby.hostName,
    status: lobby.status,
    maxPlayers: lobby.maxPlayers,
    approvalRequired: lobby.approvalRequired,
    streamerMode: lobby.streamerMode,
    members: lobby.members,
    waitlist: hostView ? lobby.waitlist : [],
    code: hostView ? lobby.invite.code : undefined,
    codeBlurred: lobby.streamerMode,
    expiresAt: lobby.invite.expiresAt,
    blinds: lobby.blinds,
    fillBots: lobby.fillBots,
    chats: lobby.chats ?? [],
  }
}
