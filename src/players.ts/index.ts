import { Player, Card, Action } from '../model'
import { EventEmitter } from 'events'
import { run } from '../engine'
import _ = require('lodash')
import Debug = require('debug')

const debug = Debug('players:CallPlayer')
export class CallPlayer implements Player {
  deal(cards: [Card, Card]): void {}
  join(event: EventEmitter, position: number): void {}
  async action(actionList: Action[]): Promise<Action> {
    debug('available actions %O', actionList)
    const callAction = _.find(actionList, (action) => action.action === 'call')
    if (callAction) {
      return callAction
    }
    const betAction = _.find(actionList, (action) => action.action === 'bet')
    if (betAction) {
      return betAction
    }
    const checkAction = _.find(actionList, (action) => action.action === 'check')
    if (checkAction) {
      return checkAction
    }
    return { action: 'fold' }
  }
  constructor(public name: string) {}
}

/** Simple preflop/postflop heuristic — missing from the original house engine. */
export class SimpleStratetyPlayer implements Player {
  private hole: [Card, Card] | undefined
  deal(cards: [Card, Card]): void {
    this.hole = cards
  }
  join(_event: EventEmitter, _position: number): void {}
  async action(actionList: Action[]): Promise<Action> {
    const ranks = '23456789TJQKA'
    const score = this.hole
      ? ranks.indexOf(this.hole[0][0]) +
        ranks.indexOf(this.hole[1][0]) +
        (this.hole[0][0] === this.hole[1][0] ? 8 : 0)
      : 0
    if (score >= 20) {
      return (
        _.find(actionList, (a) => a.action === 'raise') ||
        _.find(actionList, (a) => a.action === 'bet') ||
        actionList[0]
      )
    }
    if (score >= 12) {
      return (
        _.find(actionList, (a) => a.action === 'call') ||
        _.find(actionList, (a) => a.action === 'check') ||
        actionList[0]
      )
    }
    return _.find(actionList, (a) => a.action === 'check') || { action: 'fold' }
  }
  constructor(public name: string) {}
}

export class RandomPlayer implements Player {
  deal(cards: [Card, Card]): void {}
  join(event: EventEmitter, position: number): void {}
  async action(actionList: Action[]): Promise<Action> {
    debug('available actions %O', actionList)
    return _.sample(actionList)!
  }
  constructor(public name: string) {}
}
