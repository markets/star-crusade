// Game state - keeping this simple by avoiding circular dependencies
export const Game = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  dpr: 1,
  sound: false,
  player: null,
  enemies: [],
  bullets: [],
  particles: [],
  score: 0,
  newMaxScore: false,
  gameOver: false,
  gameOverSfxPlayed: false,
  paused: false,
  backgroundImage: new Image(),
  backgroundY: 0,
  backgroundSpeed: 140,
  interval: 0,
  lastFrameTime: 0,
  frameId: 0,
  spawnIntervalId: 0,
  font: 'Press Start 2P',
  playerImage: new Image()
}

// Simple utility functions
export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

export function randomInt(min, max) {
  const diff = Math.max(0, max - min)
  return Math.floor(Math.random() * diff) + min
}

export function randomColor() {
  return `#${Math.floor(Math.random()*16777215).toString(16)}`
}

export function collision(a, b) {
  return (a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y)
}

export function play(sound, volume = 0.2) {
  const audio = document.getElementById(sound)
  audio.volume = Game.sound ? volume : 0
  if (!audio.loop) audio.currentTime = 0
  audio.play()
}