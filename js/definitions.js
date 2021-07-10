'use strict'

const ImageFiles = [
    'playerShip1_blue',
    'Lasers/laserBlue02_s'
]

const GameSettings = {
    keyPress: {
        left: 37,
        right: 39,
        up: 38,
        down: 40,
        space: 32
    },
    targetFPS: 1000 / 60,

    bulletSpeed: 700 / 1000, // bullet speed traverse the map vertically upwards at 0.7s
    bulletLife: 4000,  // bullet will traverse only for 4 seconds, then flies out of the boundaries and not exist (i.e. no life)
    bulletFireRate: 2000, // bullet will fire every 2 seconds from the player

    playAreaWidth: 720,
    playAreaHeight: 576,
    playAreaDiv: '#playArea',
    playerDivName: 'playerSprite',
    playerStart: {
        x: 360,
        y: 440
    },
    playerStartLives: 3,
    playerState: {
        ok: 0,
        dead: 1,
        hitFlashing: 2
    },
    playerMoveStep: 8
}

let GameManager = {
    assets: {},
    player: undefined,
    bullet: undefined,
    lastUpdated: Date.now(),
    elapsedTime: 0,
    fps: 0
}

