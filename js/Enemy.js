class Enemy extends Sprite {
    constructor(divName, assetDesc, player, sequence) {
        super(divName, new Point(0,0), assetDesc.fileName, new Size(assetDesc.width, assetDesc.height))
        this.state = GameSettings.enemyState.ready
        this.waypointList = []
        this.targetWayPointNumber = 0
        this.targetWayPoint = new Waypoint(0,0,0,0)
        this.lastWayPointIndex = 0
        this.player = player
        this.score = sequence.score
        this.lives = sequence.lives
        this.speed = sequence.speed
        this.readInWaypoints(sequence.waypoints)
    }

    readInWaypoints(wpList) {
        this.waypointList = []
        for (let i = 0; i < wpList.length; ++i) {
            let t_wp = wpList[i]
            let n_wp = new Waypoint(
                t_wp.x + this.anchorShift.x , 
                t_wp.y + this.anchorShift.y, 
                t_wp.dir_x, 
                t_wp.dir_y
                )
            this.waypointList.push(n_wp)
        }
    }

    update(dt) {
        switch(this.state) {
            case GameSettings.enemyState.movingToWaypoint:
                this.moveTowardPoint(dt)
                this.checkplayerCollision()
            break
        }
    }

    checkplayerCollision() {
        if(this.containingBox.IntersectedBy(this.player.containingBox)) {
            if (!this.player.hit) {
                this.player.hit = true
                console.log('collision with player')
            }
        }
    }

    moveTowardPoint(dt) {
        let inc = dt * this.speed
        this.incrementPosition(inc * this.targetWayPoint.dir_x, inc * this.targetWayPoint.dir_y)

        if(Math.abs(this.position.x - this.targetWayPoint.point.x) < Math.abs(inc) &&
        Math.abs(this.position.y - this.targetWayPoint.point.y) < Math.abs(inc)) {
            this.updatePosition( this.targetWayPoint.point.x,  this.targetWayPoint.point.y)
        }

        if(this.position.equalToPoint(this.targetWayPoint.point.x, this.targetWayPoint.point.y)) {
            if (this.targetWayPointNumber === this.lastWayPointIndex) {
                this.killMe()
                // console.log('reached end')
            } else {
                this.setNextWayPoint()
            }
        }
    }

    setNextWayPoint() {
        this.targetWayPointNumber++
        this.targetWayPoint = this.waypointList[this.targetWayPointNumber]
    }

    killMe() {
        this.state = GameSettings.enemyState.dead
        this.removeFromBoard()
    }

    setMoving() {
        this.targetWayPointNumber = 0
        this.targetWayPoint = this.waypointList[this.targetWayPointNumber]
        this.lastWayPointIndex = this.waypointList.length - 1
        this.setPosition(this.targetWayPoint.point.x, this.targetWayPoint.point.y, false)
        this.addToBoard(false)
        this.targetWayPointNumber = 1
        this.targetWayPoint = this.waypointList[this.targetWayPointNumber]
        this.state = GameSettings.enemyState.movingToWaypoint
    }
}

class EnemyCollection {
	constructor(player, bullets, explosions) {
		this.listEnemies = []
		this.lastAdded = 0
		this.gameOver = false
		this.sequenceIndex = 0
		this.sequencesDone = false
		this.count = 0
		this.player = player
        this.bullets = bullets
        this.explosions = explosions
    }

    reset() {
        this.killAll()
		this.listEnemies = []
		this.lastAdded = 0
		this.gameOver = false
		this.sequenceIndex = 0
		this.sequencesDone = false
		this.count = 0
    }

    killAll() {
        for (let i = 0; i < this.listEnemies.length; i++) {
            this.listEnemies[i].killMe()
        }
    }
    
    update(dt) {
		this.lastAdded += dt
		if (!this.sequencesDone && 
            EnemySequences[this.sequenceIndex].delayBefore < this.lastAdded) {
			this.addEnemy()
		}

        for (let i = this.listEnemies.length - 1; i >= 0; i--) {
            if (this.listEnemies[i].state === GameSettings.enemyState.dead) {
            	this.listEnemies.splice(i, 1)
            } else if (this.listEnemies[i].state === GameSettings.enemyState.movingToWaypoint){
                let en = this.listEnemies[i]

                for (let b = 0; b < this.bullets.listBullets.length; b++) {
                    let bu = this.bullets.listBullets[b]
                    if (!bu.dead &&
                        bu.position.y > GameSettings.bulletTop &&
                        en.containingBox.IntersectedBy(bu.containingBox)) {
                            bu.killMe()
                            en.lives--
                            if (en.lives <= 0) {
                                playSound('explosion')
                                this.player.incrementScore(en.score)
                                en.killMe()
                                let cp = en.getCenterPoint()
                                this.explosions.createExplosion(new Point(cp.x, cp.y))
                            }
                    }
                }

                en.update(dt)
            }
        }

		this.checkGameOver()
    }
    
    checkGameOver() {
		if (!this.listEnemies.length && this.sequencesDone) {
			this.gameOver = true
            // console.log('game over')   
		}
    }
    
    addEnemy() {
		// add a new enemy withe the sequence data
		let seq = EnemySequences[this.sequenceIndex]
		let en_new = new Enemy('en_' + this.count, GameManager.assets[seq.image],
		this.player, seq )
		this.listEnemies.push(en_new)
		en_new.setMoving()
		this.count++
		this.sequenceIndex++
        this.lastAdded = 0
        if (this.sequenceIndex === EnemySequences.length) {
            this.sequencesDone = true
            // console.log('sequences done')
        }
	}
}


function addEnemySequence(delayBefore, delayBetween, image, score, 
    lives, speed, number, waypoints) {
    for (let i = 0; i < number; i++) {
        let delay = delayBetween
        if(!i) {
            delay = delayBefore
        }
        EnemySequences.push(
            {
            delayBefore: delay,
            image: image,
            waypoints: waypoints,
            score: score,
            lives: lives,
            speed: speed
            }
        )
    }
}

function createSequence(arr) {
    let delayBetween, image, number, attackBlock, score, lives, speed, delayBefore;
    [delayBetween, image, number, attackBlock, score, lives, speed, delayBefore] = arr
    for (let i = 0; i < attackBlock.length; i++) {
        let delay = delayBetween
        if (!i) {
            delay = delayBefore
        }
        //console.log('adding sequence between:' , delayBetween, ' before: ' , delayBefore, ' delay:' , delay, ' block:' , attackBlock)
        addEnemySequence(delay, delayBetween, image, score, lives, speed, number, attackBlock[i])
    }
}

function setUpSequences(randomise = false, demo=false) {
    arr = [[600,'Enemies/enemyGreen2', 1,  AttackBlocks.STREAMDOWN, 100, 1, enemySpeed.medium, 1000],
    [600,'Enemies/enemyBlack4', 1,  AttackBlocks.STREAMDOWNMIXED, 100, 1, enemySpeed.medium, 2000], 
    [600,'Enemies/enemyBlue3', 1,  AttackBlocks.STREAMRETURNMIXED, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyRed5', 1,  AttackBlocks.BADDIETYPE1, 1000, 8, enemySpeed.slow, 500],
    [600,'Enemies/enemyBlue3', 2,  AttackBlocks.STREAMUPMIXED, 100, 1, enemySpeed.fast, 4000],
    [600,'Enemies/enemyBlack4', 1,  AttackBlocks.SIDEASSAULT1, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyBlue3', 1,  AttackBlocks.SIDEASSAULT2, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyGreen2', 2,  AttackBlocks.SIDEASSAULT3, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyRed1', 2,  AttackBlocks.SIDEASSAULT4, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlue3', 4,  AttackBlocks.SIDEASSAULT2, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyGreen2', 4,  AttackBlocks.SIDEASSAULT3, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyRed5', 1,  AttackBlocks.BADDIETYPE2, 1000, 8, enemySpeed.slow, 500],
    [600,'Enemies/enemyGreen2', 2,  AttackBlocks.STREAMDOWN, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlack4', 2,  AttackBlocks.STREAMDOWNMIXED, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlue3', 4,  AttackBlocks.STREAMRETURNMIXED, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyRed5', 1,  AttackBlocks.BADDIETYPE2, 1000, 8, enemySpeed.slow, 500],
    [600,'Enemies/enemyBlack4', 1,  AttackBlocks.SIDEASSAULT1, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyBlue3', 1,  AttackBlocks.SIDEASSAULT2, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyGreen2', 2,  AttackBlocks.SIDEASSAULT3, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyGreen2', 1,  AttackBlocks.STREAMDOWN, 100, 1, enemySpeed.medium, 1000],
    [600,'Enemies/enemyBlack4', 1,  AttackBlocks.STREAMDOWNMIXED, 100, 1, enemySpeed.medium, 2000], 
    [600,'Enemies/enemyBlue3', 1,  AttackBlocks.STREAMRETURNMIXED, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyRed5', 1,  AttackBlocks.BADDIETYPE1, 1000, 8, enemySpeed.slow, 500],
    [600,'Enemies/enemyBlue3', 2,  AttackBlocks.STREAMUPMIXED, 100, 1, enemySpeed.fast, 4000],
    [600,'Enemies/enemyBlack4', 1,  AttackBlocks.SIDEASSAULT1, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyBlue3', 1,  AttackBlocks.SIDEASSAULT2, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyGreen2', 2,  AttackBlocks.SIDEASSAULT3, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyRed1', 2,  AttackBlocks.SIDEASSAULT4, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlue3', 4,  AttackBlocks.SIDEASSAULT2, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyGreen2', 4,  AttackBlocks.SIDEASSAULT3, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyRed5', 1,  AttackBlocks.BADDIETYPE2, 1000, 8, enemySpeed.slow, 500],
    [600,'Enemies/enemyGreen2', 2,  AttackBlocks.STREAMDOWN, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlack4', 2,  AttackBlocks.STREAMDOWNMIXED, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlue3', 4,  AttackBlocks.STREAMRETURNMIXED, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyRed5', 1,  AttackBlocks.BADDIETYPE2, 1000, 8, enemySpeed.slow, 500],
    [600,'Enemies/enemyBlack4', 1,  AttackBlocks.SIDEASSAULT1, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyBlue3', 1,  AttackBlocks.SIDEASSAULT2, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyGreen2', 2,  AttackBlocks.SIDEASSAULT3, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyGreen2', 1,  AttackBlocks.STREAMDOWN, 100, 1, enemySpeed.medium, 1000],
    [600,'Enemies/enemyBlack4', 1,  AttackBlocks.STREAMDOWNMIXED, 100, 1, enemySpeed.medium, 2000], 
    [600,'Enemies/enemyBlue3', 1,  AttackBlocks.STREAMRETURNMIXED, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyRed5', 1,  AttackBlocks.BADDIETYPE1, 1000, 8, enemySpeed.slow, 500],
    [600,'Enemies/enemyBlue3', 2,  AttackBlocks.STREAMUPMIXED, 100, 1, enemySpeed.fast, 4000],
    [600,'Enemies/enemyBlack4', 1,  AttackBlocks.SIDEASSAULT1, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyBlue3', 1,  AttackBlocks.SIDEASSAULT2, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyGreen2', 2,  AttackBlocks.SIDEASSAULT3, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyRed1', 2,  AttackBlocks.SIDEASSAULT4, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlue3', 4,  AttackBlocks.SIDEASSAULT2, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyGreen2', 4,  AttackBlocks.SIDEASSAULT3, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyRed5', 1,  AttackBlocks.BADDIETYPE2, 1000, 8, enemySpeed.slow, 500],
    [600,'Enemies/enemyGreen2', 2,  AttackBlocks.STREAMDOWN, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlack4', 2,  AttackBlocks.STREAMDOWNMIXED, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlue3', 4,  AttackBlocks.STREAMRETURNMIXED, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyRed5', 1,  AttackBlocks.BADDIETYPE2, 1000, 8, enemySpeed.slow, 500],
    [600,'Enemies/enemyBlack4', 1,  AttackBlocks.SIDEASSAULT1, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyBlue3', 1,  AttackBlocks.SIDEASSAULT2, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyGreen2', 2,  AttackBlocks.SIDEASSAULT3, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlue3', 4,  AttackBlocks.SIDEASSAULT2, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyGreen2', 4,  AttackBlocks.SIDEASSAULT3, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyRed5', 1,  AttackBlocks.BADDIETYPE2, 1000, 8, enemySpeed.slow, 500],
    [600,'Enemies/enemyGreen2', 2,  AttackBlocks.STREAMDOWN, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlack4', 2,  AttackBlocks.STREAMDOWNMIXED, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlue3', 4,  AttackBlocks.STREAMRETURNMIXED, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyRed5', 1,  AttackBlocks.BADDIETYPE2, 1000, 8, enemySpeed.slow, 500],
    [600,'Enemies/enemyBlack4', 1,  AttackBlocks.SIDEASSAULT1, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyBlue3', 1,  AttackBlocks.SIDEASSAULT2, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyGreen2', 2,  AttackBlocks.SIDEASSAULT3, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlue3', 1,  AttackBlocks.SIDEASSAULT2, 100, 1, enemySpeed.fast, 3000],
    [600,'Enemies/enemyGreen2', 2,  AttackBlocks.SIDEASSAULT3, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyRed1', 2,  AttackBlocks.SIDEASSAULT4, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlue3', 4,  AttackBlocks.SIDEASSAULT2, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyGreen2', 4,  AttackBlocks.SIDEASSAULT3, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyRed5', 1,  AttackBlocks.BADDIETYPE2, 1000, 8, enemySpeed.slow, 500],
    [600,'Enemies/enemyGreen2', 2,  AttackBlocks.STREAMDOWN, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlack4', 2,  AttackBlocks.STREAMDOWNMIXED, 100, 1, enemySpeed.fast, 2000],
    [600,'Enemies/enemyBlue3', 4,  AttackBlocks.STREAMRETURNMIXED, 100, 1, enemySpeed.medium, 2000],
    [600,'Enemies/enemyRed5', 1,  AttackBlocks.BADDIETYPE2, 1000, 8, enemySpeed.slow, 500]]

    arr = arr.concat(arr)

    if (randomise) {
        shuffle(arr)
    }

    if (demo) {
        arr = arr.slice(0,GameManager.sampleSequence)
    }
    // console.log(arr.length)
    for (const element of arr) {
        createSequence(element)
    }
    // console.log("EnemySequences:" , EnemySequences)
}


function shuffle(array) {
    let currentIndex = array.length, randomIndex
    
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
    
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--;
    
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]]
    }
    
    return array;
    }




