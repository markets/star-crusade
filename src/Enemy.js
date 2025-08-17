import { Game } from './gameState.js'
import { randomColor } from './utils.js'

export class Enemy {
  constructor(speed, size = 50) {
    this.width = size
    this.height = size
    this.x = Math.random() * (Game.width - this.width)
    this.y = -this.height
    this.speed = speed // px/s
    this.color = randomColor()
    this.active = true
  }

  update(dt) {
    if (!this.active) return
    this.y += this.speed * dt
    if (this.y > Game.height) {
      this.active = false
    }
  }

  render() {
    if (!this.active) return
    Game.ctx.fillStyle = this.color
    Game.ctx.fillRect(this.x, this.y, this.width, this.height)
  }
}