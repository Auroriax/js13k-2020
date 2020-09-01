var scale = 70;
var roughSeed = 1;

const timing = new Timing((1/ 10), (1 / 60));

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const roughCanvas = rough.canvas(canvas);

const levelCanvas = document.createElement("canvas");
const levelCtx = levelCanvas.getContext("2d");
const roughLevel = rough.canvas(levelCanvas);

const wallCanvas = document.createElement("canvas");
const wallCtx = wallCanvas.getContext("2d");
const roughWall = rough.canvas(wallCanvas);
const wallMargin = 10;

const playerCanvas = document.createElement("canvas");
const PlayerCtx = wallCanvas.getContext("2d");
const roughPlayer = rough.canvas(playerCanvas);

const boxCanvas = document.createElement("canvas");
const boxCtx = wallCanvas.getContext("2d");
const roughBox = rough.canvas(boxCanvas);
const boxMargin = 10;

const targetCanvas = document.createElement("canvas");
const targetCtx = wallCanvas.getContext("2d");
const roughTarget = rough.canvas(targetCanvas);
const targetMargin = 15;

let undoStack = [];

var camShakeX = 0;
var camShakeY = 0;

var mousePos = new Vector2(0,0);

const obj = {
    EMPTY: ".",
    PLAYER: "p",
    WALL: "#",
    BOX: "b",
    TARGET: "t",
    LEVELNODE: "l",
}; //all lowercase if applicable!

var levelName = "Test";
var levelOffsetX = 0;
var levelOffsetY = 0; //QQQ Can't both be non-zero, might implement this later

var prevLevelOffsetX = 0; //Between -1 and 1
var prevLevelOffsetY = 0;

onkeydown = e => {
    if (e.key == "ArrowDown" || e.key == "ArrowUp" || e.key == " " || e.key == "Backspace")
    {
        e.preventDefault();
    }

    input(e.key);
};

canvas.addEventListener('mousemove', function(evt) {
    var rect = canvas.getBoundingClientRect();
    mousePos = new Vector2(evt.clientX - rect.left, evt.clientY - rect.top);
    //console.log(mousePos);
}, false);

//Init level
var gridHeight = levels[level].length;
var gridWidth = levels[level][0].length;

var player = {x: 0, y: 0};
var walls = [];
var boxes = [];
var targets = [];
var levelNodes = [];

var steps = "";
var prevHorDelta = 0;
var prevVerDelta = 0;

var timeSinceLastAction = 0; //in s
var timeToCompleteTween = 0.1; //in s

var timeToUpdateRenders = (1/3); //in s
var timeSinceUpdatedRenders = timeToUpdateRenders; //in s

var timeUntilLevelEnd = 4; //in s;
var timeUntilLevelSelected = 1;
var timeSinceLevelWon = timeUntilLevelEnd;

var timeSinceLevelStart = 0;
var timeToLoadLevel = 1; //in s;

var timeUntilChangableTheme = 0.2;
var timeSinceLastThemeChange = 0;

var timeUntilPlayableAudio = 0.05;
var timeSinceLastAudio = 0;

var menuOpened = false;
var menuSelection = 0;

var reduceMotion = false;
var colors = [];
colors[0] = ["Sketchbook", "white", "black", "gray"]; //name, bg, main, contrast
colors[1] = ["Scratchpad", "#222", "white", "gray"];
var colorTheme = 0;
var audioEnabled = true;

var victory = false;
var targetLevel = 0;

var levelSolved = [];
for(var i = 0; i != levels.length; i += 1) {
    levelSolved[i] = false; //QQQ
}

loadLevel(level);

function gameLoop() {
    try {
        //Init
        timing.update();

        timeSinceLastAction += timing.currentFrameLength;
        timeSinceUpdatedRenders += timing.currentFrameLength;
        timeSinceLevelStart += timing.currentFrameLength;
        timeSinceLevelWon += timing.currentFrameLength;
        timeSinceLastThemeChange += timing.currentFrameLength;
        timeSinceLastAudio += timing.currentFrameLength;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        ctx.fillStyle = colors[colorTheme][1];
        ctx.fillRect(0,0,canvas.width, canvas.height);

        if (canvas.width < 700 || canvas.height < 700) {
            scale = 40;
        } else if (canvas.width < 1000 || canvas.height < 900) {
            scale = 55;
        } else {
            scale = 70;
        }

        var alph = 1;
        var localScale = scale;
        if (timeSinceLevelStart < timeToLoadLevel) {
            alph = timeSinceLevelStart / timeToLoadLevel;
            localScale = (scale + 20) - 20 * EaseInOut(timeSinceLevelStart / timeToLoadLevel);
        } else if (timeSinceLevelWon < timeUntilLevelEnd && level != 0) {
            alph = 1 - (timeSinceLevelWon / timeUntilLevelEnd);
            localScale = (scale - 50) + 50 * (1-EaseInOut(timeSinceLevelWon / timeUntilLevelEnd));
        } else if (timeSinceLevelWon < timeUntilLevelSelected && level == 0) {
            alph = 1 - (timeSinceLevelWon / timeUntilLevelSelected);
            localScale = (scale) - 20 * (EaseInOut(timeSinceLevelWon / timeUntilLevelSelected));
        } else if (((timeSinceLevelWon >= timeUntilLevelEnd && level != 0) || (timeSinceLevelWon >= timeUntilLevelSelected && level == 0)) && victory) {
            loadLevel(targetLevel);
            alph = 0;
        }

        if (reduceMotion) {
            var localScale = scale;
        }

        //console.log(alph);

        var verHeight = gridHeight * localScale;
        var horWidth = gridWidth * localScale;

        //Render
        if (timeSinceUpdatedRenders >= timeToUpdateRenders) {
            if (!reduceMotion) {
                roughSeed += 1;
            }
            timeSinceUpdatedRenders = 0;
        }

        //Render player
        playerCanvas.width = localScale;
        playerCanvas.height = localScale;
        var size = 0.8;
        roughPlayer.circle(localScale * .5, localScale * .5,
            localScale * size, {stroke: colors[colorTheme][2], strokeWidth: 1, seed: roughSeed});

        //Render wall
        wallCanvas.width = localScale+wallMargin;
        wallCanvas.height = localScale+wallMargin;
        roughWall.rectangle(wallMargin * 0.5, wallMargin * 0.5, 
            localScale, localScale, {stroke: colors[colorTheme][2], fill: colors[colorTheme][2], strokeWidth: 1, seed: roughSeed});

        //Render box
        boxCanvas.width = localScale+boxMargin;
        boxCanvas.height = localScale+boxMargin;
        var size = 0.8;
        roughBox.rectangle(boxMargin * 0.5 + (1-size) * 0.5 * localScale, boxMargin * 0.5 + (1-size) * 0.5 * localScale, 
        localScale * size, localScale * size, {stroke: colors[colorTheme][2], fill: colors[colorTheme][2], strokeWidth: 2, seed: roughSeed});

        //Render target
        targetCanvas.width = localScale+targetMargin;
        targetCanvas.height = localScale+targetMargin;
        var size = 1.1;
        roughTarget.circle(localScale * 0.5 + targetMargin * 0.5, localScale * 0.5 + targetMargin * 0.5, 
            localScale * size, {fillStyle: "zigzag", fill: colors[colorTheme][3], stroke: colors[colorTheme][2], strokeWidth: 1, seed: roughSeed});

        //Render level
        var levelMargin = 20; //In pixels, positive
        levelCanvas.width = horWidth+levelMargin;
        levelCanvas.height = verHeight+levelMargin;

        var cameraX = Math.round(canvas.width * 0.5 - horWidth * 0.5 - levelMargin * 0.5) + camShakeX * 0.25;
        var cameraY = Math.round(canvas.height * 0.5 - verHeight * 0.5 - levelMargin * 0.5) + camShakeY * 0.25;

        var reduceCamShake = 2;
        if (camShakeX > 0) {camShakeX = Math.max(0, camShakeX - reduceCamShake)}
        else if (camShakeX < 0) {camShakeX = Math.min(0, camShakeX + reduceCamShake)}

        if (camShakeY > 0) {camShakeY = Math.max(0, camShakeY - reduceCamShake)}
        else if (camShakeY < 0) {camShakeY = Math.min(0, camShakeY + reduceCamShake)}

        ctx.globalAlpha = alph;
        const borderOffset = 5;
        roughCanvas.rectangle(cameraX-borderOffset + camShakeX * 0.5, cameraY-borderOffset + camShakeY * 0.5, 
            horWidth + borderOffset + levelMargin, verHeight + borderOffset + levelMargin, {stroke: colors[colorTheme][2], seed: roughSeed});

        drawLevel(roughLevel, 0, 0, gridWidth, gridHeight, localScale, roughSeed);
        
        var clipOffset = 10; //In pixels, positive
        var screenWidthRatio = Math.ceil(((canvas.width - horWidth + clipOffset) / horWidth * 0.5));
        var screenHeightRatio = Math.ceil(((canvas.height - verHeight + clipOffset) / verHeight * 0.5));

        //Add a little safety padding in case the level wrapping is offset
        if (levelOffsetX != 0) {screenWidthRatio += 1}
        if (levelOffsetY != 0) {screenHeightRatio += 1}

        var tweenOffsetX = levelOffsetX - prevLevelOffsetX * (1-EaseInOut(Math.min(timeSinceLastAction / timeToCompleteTween, 1)));
        var tweenOffsetY = levelOffsetY - prevLevelOffsetY * (1-EaseInOut(Math.min(timeSinceLastAction / timeToCompleteTween, 1)));

        for(let y = -screenHeightRatio; y <= screenHeightRatio; y++) {
            for(let x = -screenWidthRatio; x <= screenWidthRatio; x++) {
                if (x != 0 || y != 0) 
                {
                    ctx.globalAlpha = Math.max(0, alph - Math.abs(y) * 0.1 - Math.abs(x * 0.1));
                    if (ctx.globalAlpha > 0) {
                        ctx.drawImage(levelCanvas, 
                        cameraX + horWidth * x + tweenOffsetX * localScale * y,
                        cameraY + verHeight * y + tweenOffsetY * localScale * x);
                    }
                }
            }
        }

        ctx.globalAlpha = alph;
        ctx.drawImage(levelCanvas, cameraX + camShakeX, cameraY + camShakeY);
        ctx.globalAlpha = 1;

        //Draw level name
        drawStroked(levelName, 40, canvas.height - 40);

        ctx.font = "22px sans-serif";
        ctx.fillStyle = colors[colorTheme][1];
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (!menuOpened) {
            //Menu
            roughCanvas.rectangle(-5, -5, 85, 85, {fill: "solid", fillWeight: 4, stroke: "none", seed: Math.round(roughSeed / 2)})
            ctx.fillText("[Esc]",50,60);

            //Reset
            roughCanvas.rectangle(canvas.width-160, canvas.height - 80, 100, 50, {fill: "solid", fillWeight: 4, stroke: "none", seed: Math.round(roughSeed / 2)})
            ctx.fillText("[R] Retry",canvas.width-110,canvas.height - 55);

            //Undo
            roughCanvas.rectangle(canvas.width-280, canvas.height - 80, 100, 50, {fill: "solid", fillWeight: 4, stroke: "none", seed: Math.round(roughSeed / 2) + 10})
            ctx.fillText("[Z] Undo",canvas.width-230,canvas.height - 55);

            //QQQ
            roughCanvas.rectangle(250,50,canvas.width - 300, 50, {fill: "solid", fillWeight: 4, seed: 1});
            ctx.fillText("[Todo: Saving, 20 Puzzles, Shiftblock, player target. Deadline 13 September!]",canvas.width * 0.5 + 100,75);
        } else {
            //Menu bg
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = colors[colorTheme][2];
            ctx.fillRect(-1,-1,canvas.width + 2, canvas.height + 2);

            ctx.globalAlpha = 1;
            var width = 400;
            roughCanvas.rectangle(-5, -5, width + 5, 305, {fill: "solid", fillWeight: 4, stroke: "none", seed: Math.round(roughSeed / 2)})
        
            ctx.fillStyle = colors[colorTheme][1];
            ctx.textAlign = "center";

            var textBase = 50;
            var textOffset = 50;
            roughCanvas.rectangle(20, textBase * 0.5 + menuSelection * textOffset, width - 40, textOffset, {fill: "none", stroke: colors[colorTheme][1], seed: roughSeed});

            var txt = "Audio: ";
            if (audioEnabled == true) {
                txt += "ON";
            } else {
                txt += "OFF";
            }
            ctx.fillText(txt, width * 0.5,textBase + textOffset * 1);

            ctx.fillText("[Esc] Resume", width * 0.5,textBase);
            var txt = "Reduce Motion: ";
            if (reduceMotion == true) {
                txt += "ON";
            } else {
                txt += "OFF";
            }
            ctx.fillText(txt, width * 0.5,textBase + textOffset * 2);

            txt = "Theme: "+colors[colorTheme][0] + " ("+(colorTheme+1) + "/" + colors.length + ")";
            ctx.fillText(txt, width * 0.5,textBase + textOffset * 3);

            if (level != 0) {
                ctx.fillText("Back to Level Select", width * 0.5, textBase + textOffset * 4 );
            } else {
                ctx.font = "16px sans-serif";
                ctx.fillText("Game by Tom Hermans for js13k 2020", width * 0.5, textBase + textOffset * 3.8);
                ctx.fillText("rough - Copyright (c) 2019 Preet Shihn", width * 0.5, textBase + textOffset * 4.2);
                ctx.fillText("ZzFX - Copyright (c) 2019 Frank Force", width * 0.5, textBase + textOffset * 4.6);
            }
        }
    
        window.requestAnimationFrame(gameLoop);
    }
    catch (e) {
        console.error("Whoops! Something went wrong and the game crashed. The cause:", e);
        console.log("Here's some extra info to help resolve the issue. (It might contain some personal information.)");
        console.log("Your user agent is:",navigator.userAgent);
        console.log("Are your cookies enabled?",navigator.cookieEnabled);
        console.log("Are you online?",navigator.onLine);
        console.log("The language your browser is set to:",navigator.language);
        
        const canvas = document.getElementById("canvas");
        if (canvas) {
            console.log("Size of the canvas:",{width: canvas.width, height: canvas.height})
        }

        clearInterval(gameLoop);
    }
};

window.requestAnimationFrame(gameLoop);

function drawLevel(rghCanvas,rootX,rootY, gridWidth, gridHeight, localScale, seed) {

    function drawWrapped(object, drawFunction) {
        drawFunction();

        //if (timeSinceLastAction >= timeToCompleteTween) {return;}

        if (object.x == 0) {
            var wrapY = ((object.y + levelOffsetY + gridHeight) % gridHeight) - object.y;
            drawFunction(gridWidth * localScale, wrapY * localScale);
        } else if (object.x == gridWidth-1) {
            var wrapY = ((object.y - levelOffsetY + gridHeight) % gridHeight) - object.y;
            drawFunction(-gridWidth * localScale, wrapY * localScale);
        }
        
        if (object.y == 0) {
            var wrapX = ((object.x + levelOffsetX + gridWidth) % gridWidth) - object.x;
            drawFunction(wrapX * localScale, gridHeight * localScale);
        } else if (object.y == gridHeight-1) {
            var wrapX = ((object.x - levelOffsetX + gridWidth) % gridWidth) - object.x;
            drawFunction(wrapX * localScale, -gridHeight * localScale);
        }
    }

    var off = 10;

    //Player
    var playerTween = tweenPlayer();

    function drawPlayer(offsetX = 0, offsetY = 0) {
        levelCtx.drawImage(playerCanvas, PosX(playerTween.x) + offsetX + camShakeX, 
        PosY(playerTween.y) + offsetY + camShakeY);
    }

    drawWrapped(player, drawPlayer);

    //Boxes
    for(let i = 0; i != boxes.length; i++) {
        var boxTween = tweenBox(i);

        function drawBox(offsetX = 0, offsetY = 0) {
            levelCtx.drawImage(boxCanvas, PosX(boxTween.x) - boxMargin * .5 + offsetX, 
                PosY(boxTween.y) - boxMargin * 0.5 + offsetY);
        }
        
        drawWrapped(boxes[i], drawBox);
    }

    //Target
    for(let i = 0; i != targets.length; i++) {
        levelCtx.drawImage(targetCanvas, PosX(targets[i].x) - targetMargin * 0.5, PosY(targets[i].y) - targetMargin * 0.5);
        //rghCanvas.circle(PosX(targets[i].x) + localScale * 0.5, PosY(targets[i].y) + localScale * 0.5, localScale * 1.1, {fillStyle: "zigzag", fill: "#888", strokeWidth: 1, seed: seed});
    }

    //Walls
    for(let i = 0; i != walls.length; i++) {
        //var even = (walls[i].x + walls[i].y);
        levelCtx.drawImage(wallCanvas, PosX(walls[i].x) - wallMargin * 0.5, PosY(walls[i].y) - wallMargin * 0.5);
    }

    //LevelNode
    for(let i = 0; i != levelNodes.length; i++) {
        levelCtx.drawImage(targetCanvas, PosX(levelNodes[i].x) - targetMargin * 0.5, PosY(levelNodes[i].y) - targetMargin * 0.5);
        levelCtx.font = Math.round(0.8 * localScale)+"px sans-serif";
        levelCtx.textAlign = "center";
        levelCtx.textBaseline = "middle";
        levelCtx.fillStyle = colors[colorTheme][2];
        //drawStroked()
        levelCtx.fillText(levelNodes[i].target.toString(), PosX(levelNodes[i].x) + targetCanvas.width * 0.5 - targetMargin * 0.5, PosY(levelNodes[i].y) - targetMargin * 0.5 + targetCanvas.height * 0.5)
        
        if (levelSolved[i+1]) {
            levelCtx.font = Math.round(0.4 * localScale)+"px sans-serif";
            levelCtx.fillText("✓", PosX(levelNodes[i].x) + targetCanvas.width * 0.75 - targetMargin * 0.5, PosY(levelNodes[i].y) - targetMargin * 0.5 + targetCanvas.height * 0.75)
        }
    }

    function tweenPlayer() {
        if (undoStack.length > 0) {
            var lastState = undoStack[undoStack.length-1];
            var source = lastState.player;
            return tweenObject(player, source);
        }
        else {
            return({x: player.x, y: player.y});
        }
    }

    function tweenBox(id) {
        if (undoStack.length > 0) {
            var lastState = undoStack[undoStack.length-1];
            var source = lastState.boxes[id];
            return tweenObject(boxes[id], source);
        }
        else {
            return({x: boxes[id].x, y: boxes[id].y});
        }
    }

    function tweenObject(current, source) {
        var percent = 1-Clamp((timeSinceLastAction / timeToCompleteTween), 0, 1);

        if (percent != 0) {
            var diffX = Math.round(current.x - source.x);
            var diffY = Math.round(current.y - source.y);

            //console.log("Before: x:"+diffX + "y: "+diffY)
            if (diffX != 0 && diffY != 0) {
                if (prevHorDelta != 0) { //Does not resolve correctly 100% of the time
                    diffX -= Math.sign(diffX) * gridWidth;
                    diffY = 0;
                } else {
                    diffY -= Math.sign(diffY) * gridHeight;
                    diffX = 0;
                }
            } else if (Math.abs(diffX) > 1) {
                diffX -= Math.sign(diffX) * gridWidth;
            } else if (Math.abs(diffY) > 1) {
                diffY -= Math.sign(diffY) * gridHeight;
            }

            //console.log("x: "+diffX + " y: "+diffY)

            percent = EaseInOut(percent);

            return ({x: current.x - (diffX * percent), y: current.y - (diffY * percent)});
        } else {
            return({x: current.x, y: current.y});
        }
    }

    function PosX(val) {
        return (rootX + off + val * localScale);
    }

    function PosY(val) {
        return (rootY + off + val * localScale);
    }
}

function input(key) {
    if (victory) {return;}

    if (key == "Escape") {
        menuOpened = !menuOpened;
        if (menuOpened) {
            audio("menu", true);
        }
        menuSelection = 0;
    }

    if (!menuOpened) {
        if (key == "r") {
            audio("restart");
            undoStack.push({player: player, boxes: boxes.slice()});
            loadLevel(level, false);
            return;
        } else if (key == "+") {
            loadLevel(Math.min(level + 1, levels.length-1 ));
            return;
        } else if (key == "-") {
            loadLevel(Math.max(level - 1, 0 ));
            return;
        } else if (key == "z") {
            if (undoStack.length != 0) {
                audio("undo");

                var stateToRestore = undoStack.pop();

                player = stateToRestore.player;
                boxes = stateToRestore.boxes;

                steps = steps.slice(0, -1);

                console.warn("Popped the undo stack, remaining entries:", undoStack.length);
            }
            return;
        } else if (key == " " || key == "x" || key == "Enter") {
            if (levelNodes.length != 0) {
                for(let i = 0; i != levelNodes.length; i++) {
                    var node = levelNodes[i];
                    if (node.x == player.x && node.y == player.y) {
                        targetLevel = node.target;
                        victory = true;
                        timeSinceLevelWon = 0;
                        audio("invalid");
                        break;
                    }
                }
            }
        } else if (key == "1") {
            if (levelOffsetY == 0) {
                levelOffsetX += 1;
                prevLevelOffsetX = 1;
                timeSinceLastAction = 0;
                if (levelOffsetX >= gridWidth * 0.5) {
                    levelOffsetX -= gridWidth;
                }
            } else {
                console.log("Movement not resolved: Cannot shift X when Y is shifted")
            }
        } else if (key == "2") {
            if (levelOffsetY == 0) {
                levelOffsetX -= 1;
                prevLevelOffsetX = -1;
                timeSinceLastAction = 0;
                if (levelOffsetX <= -gridWidth * 0.5) {
                    levelOffsetX += gridWidth;
                }
            } else {
                console.log("Movement not resolved: Cannot shift X when Y is shifted")
            }
        } else if (key == "3") {
            prevLevelOffsetX = 0;
        }

        var dir = "";

        var horDelta = 0; 
        if (key == "ArrowLeft" || key == "a" || key == "q") {horDelta = -1; dir = "l"}
        if (key == "ArrowRight" || key == "d") {horDelta = 1; dir = "r"}

        var verDelta = 0;
        if (key == "ArrowDown" || key == "s") {verDelta = 1; dir = "d"}
        if (key == "ArrowUp" || key == "w") {verDelta = -1; dir = "u"}

        console.log("------");

        if (horDelta != 0 || verDelta != 0) {
            undoStack.push({player: player, boxes: boxes.slice()}); //Other objects can't move, so aren't stored.

            var movementResolved = false;

            var target = wrapCoords(player.x + horDelta, player.y + verDelta);
            var targetX = target.x;
            var targetY = target.y;

            console.log("x:"+player.x+"y:"+player.y+" tx:"+targetX+"ty:"+targetY);

            let foundBox = hasBox(targetX, targetY);
            console.log("fb: "+foundBox);
            if (foundBox !== null) {
                var boxTarget = wrapCoords(targetX + horDelta, targetY + verDelta);
                let boxTargetX = boxTarget.x;
                let boxTargetY = boxTarget.y;

                //console.log("bx: "+boxTargetX+" by:"+boxTargetY);
                //console.log("hasWall:",hasWall(boxTargetX, boxTargetY))
                if (hasWall(boxTargetX, boxTargetY) === null && hasBox(boxTargetX, boxTargetY) === null) {
                    boxes[foundBox] = {x: boxTargetX, y: boxTargetY};
                    player = {x: targetX, y: targetY};
                    movementResolved = true;
                } else {
                    console.log("Movement not resolved","Could not push box");
                }
            }
            else if (hasWall(targetX, targetY) === null) {
                player = {x: targetX, y: targetY};
                movementResolved = true;
            } else {
                console.log("Movement not resolved","Something was in the way");
            }
        }

        if (movementResolved) {
            steps += dir;
            timeSinceLastAction = 0;

            prevHorDelta = horDelta;
            prevVerDelta = verDelta;

            //Check if won
            var hasWon = true;
            if (targets.length > 0) {
                for(let i = 0; i != targets.length; i++) {
                    if (hasBox(targets[i].x, targets[i].y) === null) {
                        hasWon = false; break;
                    }
                }
            } else {
                hasWon = false;
            }

            if (hasWon) {
                console.warn("Victory!",steps + " (" + steps.length + ")");
                levelSolved[level] = true;

                audio("victory");
                victory = true;
                targetLevel = 0;
                timeSinceLevelWon = 0;
            } else {
                audio("walk");
            }
        } else {
            if (horDelta != 0 || verDelta != 0) {
                audio("invalid");
            }
            camShakeX = horDelta * 12;
            camShakeY = verDelta * 12;
            undoStack.pop(); //Nothing changed, so discard Undo state.
        }
    } else { //Menu input
        var items = 5;
        if (level == 0) {
            items = 4;
        }

        if (key == "ArrowDown" || key == "s") {
            menuSelection += 1; if (menuSelection >= items) {menuSelection = 0;}
        }
        else if (key == "ArrowUp" || key == "w") {
            menuSelection -= 1; if (menuSelection < 0) {menuSelection = items-1;}
        }
        else if (key == " " || key == "x" || key == "Enter") {
            switch(menuSelection) {
                case 0: 
                    menuOpened = !menuOpened;
                    break;
                case 1:
                    audioEnabled = !audioEnabled;
                    if (audioEnabled) {
                        audio("menu", true);
                    }
                    break;
                case 2:
                    reduceMotion = !reduceMotion;
                    break;
                case 3:
                    if (timeSinceLastThemeChange >= timeUntilChangableTheme) {
                        timeSinceLastThemeChange = 0;
                        colorTheme++;
                        if (colorTheme >= colors.length) {
                            colorTheme = 0;
                        }
                    }
                    break;
                case 4:
                    loadLevel(0);
                    menuOpened = !menuOpened;
            }
        }
    }
}

function loadLevel(number, resetStack = true) {
    level = number;

    var levelToLoad = levels[number].slice();
    var metadata = levelToLoad.shift();

    gridHeight = levelToLoad.length;
    gridWidth = levelToLoad[0].length;
    
    player = {x: 0, y: 0};
    walls = [];
    boxes = [];
    targets = [];
    levelNodes = [];

    camShakeX = 0;
    camShakeY = 0;

    victory = false;

    if (metadata.name) {
        levelName = (level) + ": "+ metadata.name;
    } else {
        levelName = "";
    }

    /*if (levelSolved[level]) {
        levelName += " ✓";
    }*/

    if (metadata.xOff) {
        levelOffsetX = metadata.xOff;
    } else {
        levelOffsetX = 0;
    }

    if (metadata.yOff) {
        levelOffsetY = metadata.yOff;
    } else {
        levelOffsetY = 0;
    }

    for(let y = 0; y < gridHeight; y++) {
        for(let x = 0; x < gridWidth; x++) {
            var str = levelToLoad[y].substring(x,x+1).toLowerCase();
            switch (str) {
                case obj.PLAYER:
                    this.player = {x: x, y: y};
                    break;
                case obj.WALL:
                    walls.push({x: x, y: y});
                    break;
                case obj.BOX:
                    boxes.push({x: x, y: y});
                    break;
                case obj.TARGET:
                    targets.push({x: x, y: y});
                    break;
                case obj.LEVELNODE:
                    levelNodes.push({x: x, y: y, target: levelNodes.length+1});
                    break;
            }
        }
    }

    if (resetStack) {
        undoStack = [];
        steps = "";
        timeSinceLevelStart = 0;
        timeSinceLevelWon = timeUntilLevelEnd;
    } else {
        steps += "!";
    }
}

function wrapCoords(newX, newY) {
    function wrapX() {
        if (newX >= gridWidth) {
            newX -= gridWidth;
            newY -= levelOffsetY;
            //console.log("X-");
            return true;
        } else if (newX < 0) {
            newX += gridWidth;
            newY += levelOffsetY;
            //console.log("X+");
            return true;
        }
        return false;
    }

    function wrapY() {
        if (newY >= gridHeight) {
            newY -= gridHeight;
            newX -= levelOffsetX;
            //console.log("Y-");
            return true;
        } else if (newY < 0) {
            newY += gridHeight;
            newX += levelOffsetX;
            //console.log("Y+");
            return true;
        }
        return false;
    }

    var wrappedOnX = wrapX();
    var wrappedOnY = wrapY();
    if (!wrappedOnX) {
        wrapX();
    }
    /*if (!wrappedOnY) {
        wrapY();
    }*/

    return {x: newX, y: newY}
}

function hasThing(array, x, y) {
    for(let i = 0; i != array.length; i++) {
        if (array[i].x == x && array[i].y == y) {
            return i;
        }
    }
    return null;
}

function hasWall(x, y) {
    return hasThing(walls, x, y)
}

function hasBox(x, y) {
    return hasThing(boxes, x, y)
}

function hasTarget(x, y) {
    return hasThing(targets, x, y)
}

function even(val) {
    return ((val % 2) == 0)
}

function EaseInOut(t) {
    return(t*(2-t));
}

//From https://stackoverflow.com/questions/13627111/drawing-text-with-an-outer-stroke-with-html5s-canvas
function drawStroked(text, x, y) {
    ctx.miterLimit = 2;
    ctx.font = '40px sans-serif';
    ctx.strokeStyle = colors[colorTheme][2];
    ctx.lineWidth = 8;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = colors[colorTheme][1];
    ctx.fillText(text, x, y);
}

function audio(soundID, alwaysPlay = false) {
    if (!audioEnabled) {return;}

    if (timeSinceLastAudio >= timeUntilPlayableAudio || alwaysPlay) {
        if (!alwaysPlay) {timeSinceLastAudio = 0;}
        switch (soundID.toLowerCase()) {
            case "invalid":
                zzfx(...[,.3,176,.02,,.08,3,.4,-0.7,-21,-127,.01,.05,,,,.38,,.03]);
                break;
            case "walk":
                zzfx(...[.6,.1,176,.02,,.01,3,.4,-0.7,-21,-127,.01,.05,,,,.1,,.02]);
                break;
            case "victory":
                zzfx(...[,,934,.12,.38,.93,1,.27,,.4,-434,.08,.2,.1,,.1,.17,.55,1,.46]);
                break;
            case "undo": 
                zzfx(...[,,110,,,,1,1.82,,.1,,,,.1,,.1,.01,.7,.02,.15]);
                break;
            case "restart":
                zzfx(...[,,283,.02,,.11,,.38,,,,,.07,,,.1,.08,.63,.02]);
                break;
            case "menu":
                zzfx(...[,.02,1638,,.05,.17,1,,,,490,.09,,,,.1,.05,.5,.03]);
                break;
        }
    }
}