function tick() {
    let now = Date.now()
    let dt = now - GameManager.lastUpdated //dt = delta time
    GameManager.lastUpdated = now
    GameManager.fps = parseInt(1000 / dt)

    $('#divFPS').text('FPS ' + GameManager.fps)

    GameManager.bullets.update(dt)

    setTimeout(tick, GameSettings.targetFPS)
}

function resetBullets() {
    if (GameManager.bullets != undefined) {
        GameManagere.bullets.reset()
    } else {
        GameManager.bullets = new BulletCollection(GameManager.player)
    }
}

function resetPlayer() {
    if (GameManager.player === undefined) {
        let asset = GameManager.assets['playerShip1_blue']
        const padding = 40
        GameManager.player = new Player(GameSettings.playerDivName, 
            new Point(GameSettings.playerStart.x, GameSettings.playerStart.y), 
            asset,
            new Rect(padding, padding, GameSettings.playAreaWidth - padding * 2, GameSettings.playAreaHeight - padding * 2)
        )
        GameManager.player.addToBoard(true)
    }
    console.log('resetplayer() GameManager.player:', GameManager.player)
    GameManager.player.reset()
}

function resetGame() {
    resetPlayer()
    resetBullets()
    setTimeout(tick, GameSettings.targetFPS)
}

function processAsset(index) {
    const img = new Image() // create new image object
    const fileName = 'assets/' + ImageFiles[index] + '.png' // concatenate file directory "assets" with image file names and .png extension
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
            resetGame();
        }
    }
}

$(function () {
    processAsset(0)
    const sensitivity = 2
    $(document).keydown(function (e) {
        switch (e.which) {
            case GameSettings.keyPress.up:
                GameManager.player.move(0, -sensitivity)
                break;
            case GameSettings.keyPress.down:
                GameManager.player.move(0, sensitivity)
                break;
            case GameSettings.keyPress.left:
                GameManager.player.move(-sensitivity, 0)
                break;
            case GameSettings.keyPress.right:
                GameManager.player.move(sensitivity, 0)
                break;
            case GameSettings.keyPress.space:
                break;
        }
    })
})
