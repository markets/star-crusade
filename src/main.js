import { Game } from './gameState.js'
import { Player } from './Player.js'
import { Enemy } from './Enemy.js'
import { Particle } from './Particle.js'
import { clamp, collision, randomInt, preventSpaceScroll, play } from './utils.js'
import { setupMobileControls, setupOptionsMenu, restart, togglePause, toggleSound } from './controls.js'
import { render } from './rendering.js'

import { Game, clamp, randomInt, collision, play } from './gameState.js'
import { Player, Enemy, Bullet, Particle } from './classes.js'

console.log('Modules loaded successfully!')

// Rest of the game will go here
start()

function start() {
  console.log('Starting game...')
  Game.canvas = document.getElementById('game')
  Game.ctx = Game.canvas.getContext('2d')
  
  // Test basic functionality
  Game.width = 800
  Game.height = 600
  Game.player = new Player()
  
  console.log('Game initialized with player:', Game.player)
}