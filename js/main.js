function tick() {

    let now = Date.now()
    let dt = now - GameManager.lastUpdated
    GameManager.lastUpdated = now
    GameManager.fps = parseInt(1000 / dt)

    // $('#divFPS').text('FPS:' + GameManager.fps)

    GameManager.bullets.update(dt)
    GameManager.enemies.update(dt)

    if (GameManager.enemies.gameOver == true) {
        console.log('game over')
        showGameOver()
    } else {
        GameManager.bullets.update(dt)
        GameManager.player.update(dt)
        if (GameManager.player.lives <= 0) {
            console.log('game over')
            showGameOver()
        } else if (GameManager.phase === GameSettings.gamePhase.playing) {
            setTimeout(tick, GameSettings.targetFPS)
        }
    }
}

function clearTimeouts() {
    for (let i = 0; i < GameManager.timeouts.length; i++) {
        clearTimeout(GameManager.timeouts[i])
    }
    GameManager.timeouts = []
}

function showGameOver() {
    GameManager.phase = GameSettings.gameOver
    pauseStars()
    clearTimeouts()

    if (GameManager.enemies.gameOver) {
        playSound('completed')
        writeMessage('You Won!')
    } else {
        playSound('gameover')
        writeMessage('Game Over')
    }

    setTimeout(function () {
        appendMessage('Press Space To Reset')
    }, GameSettings.pressSpaceDelay)

}

function endCountDown() {
    clearMessages()
    playSound('go')
    GameManager.phase = GameSettings.gamePhase.playing
    GameManager.lastUpdated = Date.now()
    setTimeout(tick, GameSettings.targetFPS)
}

function setCountDownValue(val) {
    playSound('countdown')
    writeMessage(val)
}

function runCountDown() {
    createStars()
    GameManager.phase = GameSettings.gamePhase.countdownToStart
    writeMessage(3)
    playSound('countdown')
    for (let i = 0; i < GameSettings.countDownValues.length; i++) {
        setTimeout(setCountDownValue, GameSettings.countDownGap * (i + 1), GameSettings.countDownValues[i])
    }
    setTimeout(endCountDown, (GameSettings.countDownValues.length + 1) * GameSettings.countDownGap)
}

function writeMessage(text) {
    clearMessages()
    appendMessage(text)
}

function writeWelcomeMessage(text) {
    appendMessage(text)
}

function appendMessage(text) {
    $('#messageContainer').append('<div class="message">' + text + '</div>')
}

function resetExplosions() {
    GameManager.explosions = new Explosions('Explosion/explosion00_s')
}

function clearMessages() {
    $('#messageContainer').empty()
}

function resetBullets() {
    if (GameManager.bullets != undefined) {
        GameManager.bullets.reset()
    } else {
        GameManager.bullets = new BulletCollection(GameManager.player)
    }
}

function resetEnemies() {
    if (GameManager.enemies != undefined) {
        GameManager.enemies.reset()
    } else {
        GameManager.enemies = new EnemyCollection(GameManager.player, GameManager.bullets, GameManager.explosions)
    }
}

function resetplayer() {
    console.log('resetplayer()')
    // console.log('resetplayer() GameManager.player:', GameManager.player)
    if (GameManager.player == undefined) {
        // console.log('resetplayer() making new')
        let asset = GameManager.assets['playerShip1_blue']
        GameManager.player = new Player('playerSprite', new Point(GameSettings.playerStart.x, GameSettings.playerStart.y), GameManager.assets['playerShip1_blue'], new Rect(40, 40, GameSettings.playAreaWidth - 80, GameSettings.playAreaHeight - 80))
        GameManager.player.addToBoard(true)
        // console.log('resetplayer() added new GameManager.player:', GameManager.player)
    }

    // console.log('resetplayer() GameManager.player:', GameManager.player)
    GameManager.player.reset()
}

function resetGame() {
    // console.log('Main Game init()')
    clearTimeouts()
    removeStars()
    resetExplosions()
    resetplayer()
    resetBullets()
    resetEnemies()

    GameManager.phase = GameSettings.gamePhase.readyToplay
    GameManager.lastUpdated = Date.now()
    GameManager.elapsedTime = 0

    clearMessages()
    writeWelcomeMessage('Welcome!')
    writeWelcomeMessage('Space: (Standard) Enter: (Random) Move: Arrow / WASD')
    // writeWelcomeMessage('Move: Arrow / WASD')
}


function processAsset(index) {
    let img = new Image()
    let fileName = 'assets/' + ImageFiles[index] + '.png'
    img.src = fileName
    img.onload = function () {
        GameManager.assets[ImageFiles[index]] = {
            width: this.width,
            height: this.height,
            fileName: fileName
        }
        index++
        if (index < ImageFiles.length) {
            processAsset(index)
        } else {
            console.log('Assets Done:', GameManager.assets)
            resetGame()
        }
    }
}


$(function () {
    console.log('ready..!')
    console.log("GameSettings:GameSettings", GameSettings)
    initSounds()
    
    $(document).keydown(function (e) {
        // console.log(e.which)
        if (GameManager.phase == GameSettings.gamePhase.readyToplay) {
            if (e.which == GameSettings.keyPress.space) {
                setUpSequences(false,GameManager.sample)
                runCountDown()
            } else if (e.which == GameSettings.keyPress.enter) {
                setUpSequences(true,GameManager.sample)
                runCountDown()
            }
        } else if (GameManager.phase == GameSettings.gamePhase.playing) {
            switch (e.which) {
                case GameSettings.keyPress.up:
                case GameSettings.keyPress.upW:
                    GameManager.player.move(0, -GameSettings.keySensitivity)
                    break
                case GameSettings.keyPress.down:
                case GameSettings.keyPress.downS:
                    GameManager.player.move(0, GameSettings.keySensitivity)
                    break
                case GameSettings.keyPress.left:
                case GameSettings.keyPress.leftA:
                    GameManager.player.move(-GameSettings.keySensitivity, 0)
                    break
                case GameSettings.keyPress.right:
                case GameSettings.keyPress.rightD:
                    GameManager.player.move(GameSettings.keySensitivity, 0)
                    break
            }
        } else if (GameManager.phase == GameSettings.gameOver) {
            if (e.which == GameSettings.keyPress.space) {
                resetGame()
            }
        }
    })
    processAsset(0)
})
