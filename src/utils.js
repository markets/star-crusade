import { Game } from './gameState.js'

// Prevent default touch/scroll behaviors
export function preventDefaults(e) {
  e.preventDefault()
  e.stopPropagation()
}

export function preventSpaceScroll(e) {
  if (e.target === document.body) e.preventDefault()
}

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