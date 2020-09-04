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
const PlayerCtx = playerCanvas.getContext("2d");
const roughPlayer = rough.canvas(playerCanvas);

const boxCanvas = document.createElement("canvas");
const boxCtx = boxCanvas.getContext("2d");
const roughBox = rough.canvas(boxCanvas);
const boxMargin = 10;

const targetCanvas = document.createElement("canvas");
const targetCtx = targetCanvas.getContext("2d");
const roughTarget = rough.canvas(targetCanvas);
const targetMargin = 15;

const rubbleCanvas = document.createElement("canvas");
const rubbleCtx = rubbleCanvas.getContext("2d");
const roughRubble = rough.canvas(rubbleCanvas);
const rubbleMargin = 15;

let undoStack = [];

var camShakeX = 0;
var camShakeY = 0;

var mousePos = new Vector2(0,0);

const obj = {
    EMPTY: ".",
    PLAYER: "p",
    WALL: "#",
    BOX: "b",
    SHIFTBOX: "+",
    SHIFTBOXHOR: "-",
    SHIFTBOXVER: "|",
    TARGET: "t",
    LEVELNODE: "l",
    RUBBLE: "r",

    SHIFTBOXANDTARGET: "x"
}; //all lowercase if applicable!

var levelName = "";
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
//var playerTarget 
var walls = [];
var boxes = [];
var targets = [];
var levelNodes = [];
var rubble = [];

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

var timeUntilPlayableAudio = 0.075;
var timeSinceLastAudio = 0;

var menuOpened = false;
var menuSelection = 0;

var verticalInput = new InputHandler(["KeyS", "ArrowDown"], ["KeyW", "ArrowUp"], timing, 0.1, 0.3);
var horizontalInput = new InputHandler(["KeyD", "ArrowRight"], ["KeyA", "ArrowLeft"], timing, 0.1, 0.3);
var undoInput = new InputHandler(["KeyZ", "Backspace"], [], timing, 0.1, 0.3);

//var path = null;

var reduceMotion = false;
var colors = [];
colors[0] = ["Sketchbook", "white", "black", "gray", "red"]; //name, bg, main, in-between, contrast
colors[1] = ["Scratchpad", "#222", "white", "gray", "gold"];
colors[2] = ["Golden Ticket", "#333", "#b29700", "#8e7900", "#efe7d6"];
colors[3] = ["Ikaniko", "#1E2A26", "#7CA49B", "#267B75", "#C8EEE5" ]
colors[4] = ["BackFlipped", "#223e32", "#b3dd52", "#04bf00", "#A7C06D" ]
var colorTheme = 0;
var audioEnabled = true;

var freshState = true; //If the level was either just loaded or just reset
var victory = false; //If the level is finished, no input is accepted until the next level loads
var targetLevel = 0;

var dirtyRender = false; //Change when theme was changed.
var previousScale = 0;

window.onresize = function() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    dirtyRender = true;
}

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

var levelSolved = [];
for(var i = 0; i != levels.length; i += 1) {
    levelSolved[i] = false; //QQQ
}

loadLevel(level);

function gameLoop() {
    try {
        //Init
        timing.update();
        horizontalInput.update();
        verticalInput.update();
        undoInput.update();

        //Input
        if (!victory) {
            if (!menuOpened) {
                if (verticalInput.fired) {
                    MovePlayer(0, verticalInput.delta);
                }
                if (horizontalInput.fired) {
                    MovePlayer(horizontalInput.delta, 0);
                }
                if (undoInput.fired == true && undoStack.length != 0) {
                    audio("undo");

                    var stateToRestore = undoStack.pop();

                    player = stateToRestore.player;
                    boxes = stateToRestore.boxes;
                    levelOffsetX = stateToRestore.xOff;
                    levelOffsetY = stateToRestore.yOff;

                    steps = steps.slice(0, -1);
                    if (steps.length == 0 || steps.slice(-1) == " ") {
                        freshState = true;
                    } else {
                        freshState = false;
                    }

                    if (level == 0) {
                        var lvl = hasLevelNode(player.x, player.y);
                        if (lvl != null) {
                            levelName = (lvl+1)+": "+levels[lvl+1][0].name + " - [Space] to enter";
                        } else {
                            levelName = "";
                        }
                    }

                    timeSinceLastAction = timeToCompleteTween;

                    console.warn("Popped the undo stack, remaining entries:", undoStack.length);

                    dirtyRender = true;
                }
            }
        }

        //Rendering
        timeSinceLastAction += timing.currentFrameLength;
        timeSinceUpdatedRenders += timing.currentFrameLength;
        timeSinceLevelStart += timing.currentFrameLength;
        timeSinceLevelWon += timing.currentFrameLength;
        timeSinceLastThemeChange += timing.currentFrameLength;
        timeSinceLastAudio += timing.currentFrameLength;

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
            if (level == 0) {
                loadLevel(targetLevel);
            } else {
                loadLevel(0);
            }
            alph = 0;
        }

        if (reduceMotion) {
            var localScale = scale;
        }

        var verHeight = gridHeight * localScale;
        var horWidth = gridWidth * localScale;
        var rerendered = false;

        //console.log("Triggers every frame");

        //Render
        if ((!reduceMotion && timeSinceUpdatedRenders >= timeToUpdateRenders) || localScale != previousScale || dirtyRender) {
            if (!reduceMotion && timeSinceUpdatedRenders >= timeToUpdateRenders) {
                roughSeed += 1;
                timeSinceUpdatedRenders = 0;
            }

            rerendered = true;
            dirtyRender = false;

            if (localScale != previousScale) {
                playerCanvas.width = localScale;
                playerCanvas.height = localScale;

                wallCanvas.width = localScale+wallMargin;
                wallCanvas.height = localScale+wallMargin;

                boxCanvas.width = localScale+boxMargin;
                boxCanvas.height = localScale+boxMargin;

                rubbleCanvas.width = localScale+rubbleMargin;
                rubbleCanvas.height = localScale+rubbleMargin;

                targetCanvas.width = localScale+targetMargin;
                targetCanvas.height = localScale+targetMargin;
            } else {
                PlayerCtx.clearRect(0,0, playerCanvas.width, playerCanvas.height);
                PlayerCtx.beginPath();

                wallCtx.clearRect(0,0, wallCanvas.width, wallCanvas.height);
                wallCtx.beginPath();
                
                boxCtx.clearRect(0,0, boxCanvas.width, boxCanvas.height);
                boxCtx.beginPath();

                rubbleCtx.clearRect(0,0, rubbleCanvas.width, rubbleCanvas.height);
                rubbleCtx.beginPath();

                targetCtx.clearRect(0,0, targetCanvas.width, targetCanvas.height);
                targetCtx.beginPath();
            }

            //Render player
            var size = 0.8;
            roughPlayer.circle(localScale * .5, localScale * .5,
                localScale * size, {fill: colors[colorTheme][1], fillStyle: "solid", stroke: colors[colorTheme][2], strokeWidth: 1, seed: roughSeed});

            //Render wall
            roughWall.rectangle(wallMargin * 0.5, wallMargin * 0.5, 
                localScale, localScale, {stroke: colors[colorTheme][2], fill: colors[colorTheme][2], strokeWidth: 1, seed: roughSeed});

            //Render box
            var size = 0.8;
            roughBox.rectangle(boxMargin * 0.5 + (1-size) * 0.5 * localScale, boxMargin * 0.5 + (1-size) * 0.5 * localScale, 
            localScale * size, localScale * size, {stroke: colors[colorTheme][2], fill: colors[colorTheme][2], strokeWidth: 2, seed: roughSeed});

            //Render rubble
            var size = 1.1;
            roughRubble.rectangle(rubbleMargin * 0.5 + (1-size) * 0.5 * localScale, rubbleMargin * 0.5 + (1-size) * 0.5 * localScale, 
            localScale * size, localScale * size, {stroke: "none", fill: colors[colorTheme][2], fillStyle: "dots", fillWeight: localScale / 70, strokeWidth: 2, seed: roughSeed});

            //Render target
            var size = 1.1;
            roughTarget.circle(localScale * 0.5 + targetMargin * 0.5, localScale * 0.5 + targetMargin * 0.5, 
                localScale * size, {fillStyle: "zigzag", fill: colors[colorTheme][3], stroke: colors[colorTheme][2], strokeWidth: 1, seed: roughSeed});
        }

        var shaking = (camShakeX != 0 || camShakeY != 0)
        var reduceCamShake = 2;
        if (camShakeX > 0) {camShakeX = Math.max(0, camShakeX - reduceCamShake)}
        else if (camShakeX < 0) {camShakeX = Math.min(0, camShakeX + reduceCamShake)}

        if (camShakeY > 0) {camShakeY = Math.max(0, camShakeY - reduceCamShake)}
        else if (camShakeY < 0) {camShakeY = Math.min(0, camShakeY + reduceCamShake)}

        var levelMargin = 20; //In pixels, positive
        if (rerendered || timeSinceUpdatedRenders >= timeToUpdateRenders || timeSinceLastAction <= timeToCompleteTween * 2 || alph != 1 || shaking) {
            //Render level
            if (localScale != previousScale || dirtyRender) {
                levelCanvas.width = horWidth+levelMargin;
                levelCanvas.height = verHeight+levelMargin;
            } else {
                levelCtx.clearRect(0,0, levelCanvas.width, levelCanvas.height);
                levelCtx.beginPath();
            }

            drawLevel(0, 0, gridWidth, gridHeight, localScale);

            rerendered = true;
        }

        if (rerendered) {
            //console.log("Triggers only when entire canvas is redrawn");

            var cameraX = Math.round(canvas.width * 0.5 - horWidth * 0.5 - levelMargin * 0.5 + camShakeX * 0.25);
            var cameraY = Math.round(canvas.height * 0.5 - verHeight * 0.5 - levelMargin * 0.5+ camShakeY * 0.25);
                
            var clipOffset = 10; //In pixels, positive
            var screenWidthRatio = Math.ceil(((canvas.width - horWidth + clipOffset) / horWidth * 0.5));
            var screenHeightRatio = Math.ceil(((canvas.height - verHeight + clipOffset) / verHeight * 0.5));

            //Add a little safety padding in case the level wrapping is offset
            if (levelOffsetX != 0) {screenWidthRatio += 1}
            if (levelOffsetY != 0) {screenHeightRatio += 1}

            var tweenOffsetX = levelOffsetX - prevLevelOffsetX * (1-EaseInOut(Math.min(timeSinceLastAction / timeToCompleteTween, 1)));
            var tweenOffsetY = levelOffsetY - prevLevelOffsetY * (1-EaseInOut(Math.min(timeSinceLastAction / timeToCompleteTween, 1)));

            ctx.globalAlpha = 1;
            ctx.fillStyle = colors[colorTheme][1];
            ctx.fillRect(0,0,canvas.width, canvas.height);

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
            const borderOffset = 5;
            roughCanvas.rectangle(Math.round(cameraX-borderOffset + camShakeX * 0.5), Math.round(cameraY-borderOffset + camShakeY * 0.5), 
                horWidth + borderOffset + levelMargin, verHeight + borderOffset + levelMargin, {stroke: colors[colorTheme][2], seed: roughSeed});
            ctx.globalAlpha = 1;        

            //Path
            /*if (path && path.length != 0) {
                var drawPath = [[cameraX + levelMargin * 0.5 + (player.x+.5) * localScale, cameraY + levelMargin * 0.5 + (player.y+.5) * localScale]];
                for(var i = 0; i != path.length; i += 1) {
                    drawPath.push([cameraX + levelMargin * 0.5 + (path[i].x + 0.5 - gridHeight) * localScale, 
                    cameraY + levelMargin * 0.5 + (path[i].y + 0.5 - gridWidth) * localScale]);
                }
                //console.log(drawPath)

                roughCanvas.linearPath(drawPath, {stroke: colors[colorTheme][3], strokeWidth: 5, seed: roughSeed});
                var last = drawPath[drawPath.length-1]
                roughCanvas.circle(last[0], last[1], 25, {seed: roughSeed});
            }*/

            //Draw level name
            ctx.textAlign = "left";
            drawStroked(levelName, 40, canvas.height - 40);

            ctx.font = "22px sans-serif";
            ctx.fillStyle = colors[colorTheme][1];
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (!menuOpened) {
                if (!victory) {
                    //Menu
                    roughCanvas.rectangle(-5, -5, 85, 85, {fill: colors[colorTheme][2], fillWeight: 4, stroke: "none", seed: Math.round(roughSeed / 2)})
                    ctx.fillText("[Esc]",50,60);

                    //QQQ
                    roughCanvas.rectangle(250,50,canvas.width - 300, 50, {fill: colors[colorTheme][2], fillWeight: 4, seed: 1});
                    ctx.fillText("[Todo: Progression, Polish, QA, Saving, 2 more puzzles. Deadline 13 September!]",canvas.width * 0.5 + 100,75);
 
                    if (level != 0) {
                        if (!freshState) {
                            ctx.globalAlpha = 1;
                        } else {
                            ctx.globalAlpha = 0.25;
                        }

                        //Reset
                        roughCanvas.rectangle(canvas.width-160, canvas.height - 80, 100, 50, {fill: colors[colorTheme][2], fillWeight: 4, stroke: "none", seed: Math.round(roughSeed / 2)})
                        ctx.fillText("[R] Retry",canvas.width-110,canvas.height - 55);

                        if (undoStack.length > 0) {
                            ctx.globalAlpha = 1;
                        } else {
                            ctx.globalAlpha = 0.25;
                        }
                        //Undo
                            roughCanvas.rectangle(canvas.width-280, canvas.height - 80, 100, 50, {fill: colors[colorTheme][2], fillWeight: 4, stroke: "none", seed: Math.round(roughSeed / 2) + 10})
                            ctx.fillText("[Z] Undo",canvas.width-230,canvas.height - 55);
                        }
                    }
                } else {
                //Menu bg
                ctx.globalAlpha = 0.2;
                ctx.fillStyle = colors[colorTheme][2];
                ctx.fillRect(-1,-1,canvas.width + 2, canvas.height + 2);

                ctx.globalAlpha = 1;
                var width = 400;
                roughCanvas.rectangle(-5, -5, width + 5, 305, {fill: colors[colorTheme][2], fillWeight: 4, stroke: "none", seed: Math.round(roughSeed / 2)})
            
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
        }
    
        previousScale = localScale;
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

function drawLevel(rootX,rootY, gridWidth, gridHeight, localScale) {

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

    //Rubble
    for(let i = 0; i != rubble.length; i++) {
        //var even = (walls[i].x + walls[i].y);
        levelCtx.drawImage(rubbleCanvas, PosX(rubble[i].x) - rubbleMargin * 0.5, PosY(rubble[i].y) - rubbleMargin * 0.5);
    }

    //Target
    for(let i = 0; i != targets.length; i++) {
        levelCtx.drawImage(targetCanvas, PosX(targets[i].x) - targetMargin * 0.5, PosY(targets[i].y) - targetMargin * 0.5);
    }

    //Walls
    for(let i = 0; i != walls.length; i++) {
        levelCtx.drawImage(wallCanvas, PosX(walls[i].x) - wallMargin * 0.5, PosY(walls[i].y) - wallMargin * 0.5);
    }

    //LevelNode image
    for(let i = 0; i != levelNodes.length; i++) {
        levelCtx.drawImage(targetCanvas, PosX(levelNodes[i].x) - targetMargin * 0.5, PosY(levelNodes[i].y) - targetMargin * 0.5);
    }

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
            if (boxes[i].shift == 1 || boxes[i].shift == 3) {
                roughLevel.line(PosX(boxTween.x) + localScale * 0.2 + offsetX, PosY(boxTween.y) + localScale * 0.5 + offsetY, 
                    PosX(boxTween.x) + localScale * 0.8 + offsetX, PosY(boxTween.y) + localScale * 0.5 + offsetY, 
                    {stroke: colors[colorTheme][4], strokeWidth: localScale / 7, seed: roughSeed})
            }
            if (boxes[i].shift == 2 || boxes[i].shift == 3) {
                roughLevel.line(PosX(boxTween.x) + localScale * 0.5 + offsetX, PosY(boxTween.y) + localScale * 0.2 + offsetY, 
                    PosX(boxTween.x) + localScale * 0.5 + offsetX, PosY(boxTween.y) + localScale * 0.8 + offsetY, 
                    {stroke: colors[colorTheme][4], strokeWidth: localScale / 7, seed: roughSeed})
            }
        }
        
        drawWrapped(boxes[i], drawBox);
    }

    //LevelNode text
    for(let i = 0; i != levelNodes.length; i++) {
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

    dirtyRender = true;

    if (key == "Escape") {
        menuOpened = !menuOpened;
        if (menuOpened) {
            audio("menu", true);
        }
        menuSelection = 0;
    }

    if (!menuOpened) {
        if (key == "r" || key == "R") {
            if (!freshState) {
                audio("restart");
                undoStack.push({player: player, boxes: boxes.slice(), xOff: levelOffsetX, yOff: levelOffsetY});
                loadLevel(level, false);
            }
            return;
        } else if (key == "+") {
            loadLevel(Math.min(level + 1, levels.length-1 ));
            return;
        } else if (key == "-") {
            loadLevel(Math.max(level - 1, 0 ));
            return;
        } else if (key == " " || key == "x" || key == "X" || key == "Enter") {
            if (timeSinceLevelStart >= timeToLoadLevel) {
                var lvl = hasLevelNode(player.x, player.y)
                if (lvl != null) {
                    targetLevel = levelNodes[lvl].target;
                    victory = true;
                    timeSinceLevelWon = 0;
                    audio("invalid");
                }
            }
        }
    } else { //Menu input
        var items = 5;
        if (level == 0) {
            items = 4;
        }

        if (key == "ArrowDown" || key == "s" || key == "S") {
            menuSelection += 1; if (menuSelection >= items) {menuSelection = 0;}
        }
        else if (key == "ArrowUp" || key == "w" || key == "W") {
            menuSelection -= 1; if (menuSelection < 0) {menuSelection = items-1;}
        }
        else if (key == " " || key == "x" || key == "X" || key == "Enter") {
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
                        dirtyRender = true;
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
    walls.length = 0;
    boxes.length = 0;
    targets.length = 0;
    levelNodes.length = 0;
    rubble.length = 0;

    camShakeX = 0;
    camShakeY = 0;

    //path = null;

    freshState = true;

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

    var placedPlayer = false;

    for(let y = 0; y < gridHeight; y++) {
        for(let x = 0; x < gridWidth; x++) {
            var str = levelToLoad[y].substring(x,x+1).toLowerCase();
            switch (str) {
                case obj.PLAYER:
                    if (!placedPlayer) {
                        this.player = {x: x, y: y};
                    }
                    break;
                case obj.WALL:
                    walls.push({x: x, y: y});
                    break;
                case obj.BOX:
                    boxes.push({x: x, y: y, shift: 0});
                    break;
                case obj.SHIFTBOXHOR:
                    boxes.push({x: x, y: y, shift: 1});
                    break;
                case obj.SHIFTBOXVER:
                    boxes.push({x: x, y: y, shift: 2});
                    break;
                case obj.SHIFTBOX:
                    boxes.push({x: x, y: y, shift: 3});
                    break;
                case obj.SHIFTBOXANDTARGET:
                    boxes.push({x: x, y: y, shift: 3});
                    targets.push({x: x, y: y});
                    break;
                case obj.TARGET:
                    targets.push({x: x, y: y});
                    break;
                case obj.LEVELNODE:
                    levelNodes.push({x: x, y: y, target: levelNodes.length+1});
                    if (levelNodes.length == targetLevel && !placedPlayer) {
                        this.player = {x: x, y: y};
                        placedPlayer = true;

                        levelName = (targetLevel)+": "+levels[targetLevel][0].name + " - [Space] to enter";
                    }
                    break;
                case obj.RUBBLE:
                    rubble.push({x: x, y: y});
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
        steps += " ";
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

function hasLevelNode(x, y) {
    return hasThing(levelNodes, x, y)
}

function hasRubble(x, y) {
    return hasThing(rubble, x, y)
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

/*function pathFinding(targetX, targetY) {
    //Make 3x3 grid
    var grid = [];
    for(var xx = 0; xx != 3; xx += 1) {
        for(var x = 0; x != gridWidth; x += 1) {
            grid.push([]);
            for(var yy = 0; yy != 3; yy += 1) {
                for(var y = 0; y != gridHeight; y += 1) {
                    if (hasBox(x,y) !== null || hasWall(x,y) !== null) {
                        grid[grid.length-1].push(0);
                    } else {
                        grid[grid.length-1].push(1);
                    }
                }
            }
        }
    }

    //Apply level offset
    if (levelOffsetX != 0) {
        console.log("Shifting X for the pathfinder");
        var s = Math.sign(levelOffsetY)-1;
        for(var i = 0; i != Math.abs(levelOffsetX); i += 1) {
            for(var j = 0; j != grid.length; j += 1) {
                var d = Math.floor(j / gridWidth) - 1; 
                console.log("d",d)
                if (d*s == 1) { //Remove from ending of array, move to back
                    var item = grid[j].pop()
                    grid[j].unshift(item);
                } else if (d*s == -1) {
                    var item = grid[j].shift(); //Remove from beginning of array, add at end
                    grid[j].push(DataTransferItem)
                }
            }
        }
    } else if (levelOffsetY != 0) {
        //QQQ
    }

    console.log(grid);

    var graph = new Graph(grid);

    var winningPath = [];
    for(var x = -1; x != 2; x += 1) {
        for(var y = -1; y != 2; y += 1) {
            var px = player.x + (x+1) * gridHeight;
            var py = player.y + (y+1) * gridWidth;

            var tx = (targetX + gridHeight);
            var ty = (targetY + gridWidth);

            if (px == tx || py == ty) {
                //Already on the targeted position!
                path = [];
                return;
            }

            if (px < 0 || py < 0 || tx < 0 || ty < 0) {
                console.log("One of the coordinates falls below 0");
                break;
            } else if (px > gridWidth*3 || py > gridHeight*3 || tx > gridWidth*3 || ty > gridHeight*3) {
                console.log("One of the coordinates falls beyond grid boundaries");
                break;
            }
 
            var start = graph.grid[(px)][(py)];
            console.log("Start",start);
            var end = graph.grid[tx][ty];
            console.log("End",end);
            var result = astar.search(graph, start, end);
            console.log("Result",result);

            if (result.length != 0 && (result.length < winningPath.length || winningPath.length == 0)) {
                winningPath = result;
            }
        }
    }

    console.log("Winning Result",winningPath);
    path = winningPath;
}*/

function MovePlayer(horDelta, verDelta) {
    var dir = "";

    if (horDelta == -1) {dir = "l"}
    else if (horDelta == 1) {dir = "r"}
    else if (verDelta == 1) {dir = "d"}
    else if (verDelta == -1) {dir = "u"}
    else {throw new Error("MovePlayer function did not recieve valid inputs.")}

    console.log("------");

    if (horDelta != 0 || verDelta != 0) {
        undoStack.push({player: player, boxes: boxes.slice(), xOff: levelOffsetX, yOff: levelOffsetY}); //Other objects can't move, so aren't stored.

        var movementResolved = false;
        var boxPushed = false;

        prevLevelOffsetX = 0;
        prevLevelOffsetY = 0;

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
            if (hasWall(boxTargetX, boxTargetY) === null && hasBox(boxTargetX, boxTargetY) === null && hasRubble(boxTargetX, boxTargetY) === null) {
                boxes[foundBox] = {x: boxTargetX, y: boxTargetY, shift: boxes[foundBox].shift};
                player = {x: targetX, y: targetY};
                movementResolved = true;
                boxPushed = true;

                if (boxes[foundBox].shift != 0) {
                    if (boxes[foundBox].shift == 1 || boxes[foundBox].shift == 3) { //Horizontal/x
                        if (levelOffsetY == 0) {
                            levelOffsetX -= horDelta;
                            prevLevelOffsetX = -horDelta;
                            timeSinceLastAction = 0;
                            if (levelOffsetX >= gridWidth * 0.5) {
                                levelOffsetX -= gridWidth;
                            } else if (levelOffsetX <= -gridWidth * 0.5) {
                                levelOffsetX += gridWidth;
                            }
                        } else {
                            console.log("Shifting not resolved: Cannot shift X when Y is shifted")
                        }
                    }
                    
                    if (boxes[foundBox].shift == 2 || boxes[foundBox].shift == 3) { //Vertical/y
                        if (levelOffsetX == 0) {
                            levelOffsetY -= verDelta;
                            prevLevelOffsetY = -verDelta;
                            timeSinceLastAction = 0;
                            if (levelOffsetY >= gridHeight * 0.5) {
                                levelOffsetY -= gridHeight;
                            } else if (levelOffsetY <= -gridHeight * 0.5) {
                                levelOffsetY += gridHeight;
                            }
                        } else {
                            console.log("Shifting not resolved: Cannot shift Y when X is shifted")
                        }
                    }
                }
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
        if (!boxPushed) {
            steps += dir;
        } else {
            steps += dir.toUpperCase();
        }
        timeSinceLastAction = 0;

        //pathFinding(1, 2);

        prevHorDelta = horDelta;
        prevVerDelta = verDelta;

        freshState = false;

        if (level == 0) {
            var lvl = hasLevelNode(player.x, player.y);
            if (lvl != null) {
                levelName = (lvl+1)+": "+levels[lvl+1][0].name + " - [Space] to enter";
            } else {
                levelName = "";
            }
        }

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

            audio("victory", true);
            victory = true;
            timeSinceLevelWon = 0;
        } else {
            audio("walk");
        }
    } else {
        if (horDelta != 0 || verDelta != 0) {
            audio("invalid");
            undoStack.pop(); //Nothing changed, so discard Undo state.
        }
        camShakeX = horDelta * 12;
        camShakeY = verDelta * 12;
    }
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