import { Game } from './gameState.js'

export class Bullet {
  constructor(x, y) {
    this.width = 5
    this.height = 10
    this.x = x - this.width / 2
    this.y = y - this.height
    this.speed = 980 // px/s
    this.active = true
  }

  update(dt) {
    if (!this.active) return
    this.y -= this.speed * dt
    if (this.y < -this.height) this.active = false
  }

  render() {
    if (!this.active) return
    Game.ctx.fillStyle = 'white'
    Game.ctx.fillRect(this.x, this.y, this.width, this.height)
  }
}