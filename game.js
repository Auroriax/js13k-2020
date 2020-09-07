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

//var mousePos = new Vector2(0,0);

var gameName = "Ban";
var subTitle = "Press any key";

const obj = {
    EMPTY: ".",
    PLAYER: "p",
    WALL: "#",
    BOX: "b",
    SHIFTBOX: "+",
    SHIFTBOXHOR: "-",
    SHIFTBOXVER: "|",
    TARGET: "t",
    LEVELONE: "1",
    LEVELTWO: "2",
    LEVELTHREE: "3",
    LEVELFOUR: "4",
    RUBBLE: "r",
    GATE: "g",

    //SHIFTBOXANDTARGET: "x"
}; //all lowercase if applicable!

var levelName = "";
var levelOffsetX = 0;
var levelOffsetY = 0; //QQQ Can't both be non-zero, might implement this later

var prevLevelOffsetX = 0; //Between -1 and 1
var prevLevelOffsetY = 0;

onkeydown = function(e) {
    if (e.key == "ArrowDown" || e.key == "ArrowUp" || e.key == " " || e.key == "Backspace")
    {
        e.preventDefault();
    }

    input(e);
};

/*canvas.addEventListener('mousemove', function(evt) {
    var rect = canvas.getBoundingClientRect();
    mousePos = new Vector2(evt.clientX - rect.left, evt.clientY - rect.top);
    //console.log(mousePos);
}, false);*/

window.onbeforeunload = function(e) {
    return "Quit?";
};

var favicon = null;
var wroteFavicon = false;
onload = function(e) {
    favicon = document.querySelector('link[rel="icon"]');
    //console.log("Page fully loaded");
}

var level = 0;

//Init level
var gridHeight = levels[level].length;
var gridWidth = levels[level][0].length;

var player = {x: 0, y: 0};
//var playerTarget 
var walls = [];
var boxes = [];
var targets = [];
var levelNodes = [];
var gates = [];
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

var timeToDisplayLevelName = 0.2;
var timeSinceLevelNameChanged = 0;

var timeToToggleMenu = 0.25;
var timeSinceMenuToggled = timeToToggleMenu;

var menuOpened = false;
var menuSelection = 0;
var titleScreen = true;

var verticalInput = new InputHandler(["KeyS", "ArrowDown"], ["KeyW", "ArrowUp"], timing, 0.1, 0.2);
var horizontalInput = new InputHandler(["KeyD", "ArrowRight"], ["KeyA", "ArrowLeft"], timing, 0.1, 0.2);
var undoInput = new InputHandler(["KeyZ", "Backspace"], [], timing, 0.1, 0.2);
var confirmInput = new InputHandler(["KeyX", "Space", "Enter"], [], timing, 0.1, 0.2);

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

var dirtyRender = true; //Change when theme was changed.
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
    levelSolved[i] = 0; //0 = new, 1 = tried, 2 = solved.
}
var amountOfLevelsSolved = 0;

loadGame();

loadLevel(level);

function gameLoop() {
    try {
        //Init
        timing.update();
        horizontalInput.update();
        verticalInput.update();
        undoInput.update();
        confirmInput.update();
        
        //console.log(horizontalInput.delta);

        //Input
        if (!victory && !titleScreen) {
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
                        setLevelName(lvl,1)
                    }

                    timeSinceLastAction = timeToCompleteTween;

                    console.warn("Popped the undo stack, remaining entries:", undoStack.length);

                    dirtyRender = true;
                }
                if (confirmInput.fired) {
                    if (timeSinceLevelStart >= timeToLoadLevel) {
                        var lvl = hasLevelNode(player.x, player.y)
                        if (lvl != null) {
                            targetLevel = levelNodes[lvl].target;
                            victory = true;
                            timeSinceLevelWon = 0;
                            audio("select");
                        }
                    }
                }
            } else {//Menu input
                var items = 5;
                if (level == 0) {
                    items = 4;
                }
        
                if (verticalInput.fired && verticalInput.delta == 1) {
                    menuSelection += 1; if (menuSelection >= items) {menuSelection = 0;}
                }
                else if (verticalInput.fired && verticalInput.delta == -1) {
                    menuSelection -= 1; if (menuSelection < 0) {menuSelection = items-1;}
                }
                else if (confirmInput.fired) {
                    switch(menuSelection) {
                        case 0: 
                            menuOpened = !menuOpened;
                            audio("select", true);
                            break;
                        case 1:
                            audioEnabled = !audioEnabled;
                            if (audioEnabled) {
                                audio("menu", true);
                            }
                            saveGame();
                            break;
                        case 2:
                            reduceMotion = !reduceMotion;
                            audio("walk", true);
                            saveGame();
                            break;
                        case 3:
                            if (timeSinceLastThemeChange >= timeUntilChangableTheme) {
                                timeSinceLastThemeChange = 0;
                                colorTheme++;
                                if (colorTheme >= colors.length) {
                                    colorTheme = 0;
                                }
                                dirtyRender = true;
                                audio("walk", true);
                            }
                            saveGame();
                            break;
                        case 4:
                            loadLevel(0);
                            audio("back", true);
                            menuOpened = !menuOpened;
                    }
                }
            }
        }

        //Rendering
        timeSinceLastAction = Math.min(timeSinceLastAction + timing.currentFrameLength, timeToCompleteTween);
        timeSinceUpdatedRenders = Math.min(timeSinceUpdatedRenders + timing.currentFrameLength, timeToUpdateRenders);
        timeSinceLevelStart = Math.min(timeSinceLevelStart + timing.currentFrameLength, timeToLoadLevel);
        timeSinceLevelWon = Math.min(timeSinceLevelWon + timing.currentFrameLength, timeUntilLevelEnd); //Don't forget about the level select level end!
        timeSinceLastThemeChange = Math.min(timeSinceLastThemeChange + timing.currentFrameLength, timeUntilChangableTheme);
        timeSinceLastAudio = Math.min(timeSinceLastAudio + timing.currentFrameLength, timeUntilPlayableAudio);
        timeSinceLevelNameChanged = Math.min(timeSinceLevelNameChanged + timing.currentFrameLength, timeToDisplayLevelName);
        timeSinceMenuToggled = Math.min(timeSinceMenuToggled + timing.currentFrameLength, timeToToggleMenu);

        if (titleScreen) {
            timeSinceLevelStart = timeToLoadLevel * .5;
        }

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
                if (level == levels.length-1) {
                    gameName = "Victory! ";
                    subTitle = "Thank you for playing!"
                    titleScreen = true;
                    audio("gameend");
                }
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

        if (favicon != null && !wroteFavicon) {
            favicon.href = targetCanvas.toDataURL('image/png');
            wroteFavicon = true;
            //console.log("Set favicon");
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

        if (rerendered || titleScreen) {
            //console.log("Triggers only when entire canvas is redrawn");

            var shakeMultiplier = 1;
            if (reduceMotion) {shakeMultiplier = 0}

            var cameraX = Math.round(canvas.width * 0.5 - horWidth * 0.5 - levelMargin * 0.5 + camShakeX * 0.25 * shakeMultiplier);
            var cameraY = Math.round(canvas.height * 0.5 - verHeight * 0.5 - levelMargin * 0.5+ camShakeY * 0.25 * shakeMultiplier);
                
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
            ctx.drawImage(levelCanvas, Math.round(cameraX + camShakeX * shakeMultiplier), Math.round(cameraY + camShakeY * shakeMultiplier));
            const borderOffset = 5;
            roughCanvas.rectangle(Math.round(cameraX-borderOffset + camShakeX * 0.5 * shakeMultiplier), Math.round(cameraY-borderOffset + camShakeY * 0.5 * shakeMultiplier), 
                horWidth + borderOffset + levelMargin, verHeight + borderOffset + levelMargin, {stroke: colors[colorTheme][2], seed: roughSeed});
            ctx.globalAlpha = 1;

            //Draw rectangle
            if (titleScreen || menuOpened) {
                //Menu bg
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = colors[colorTheme][1];
                ctx.fillRect(-1,-1,canvas.width + 2, canvas.height + 2);
                ctx.globalAlpha = 1;
            }

            //Draw level name
            if (!titleScreen) {
                ctx.textAlign = "left";
                ctx.font = "40px sans-serif";
                ctx.globalAlpha = EaseInOut(timeSinceLevelNameChanged / timeToDisplayLevelName)
                drawStroked(ctx, levelName, 40, canvas.height - 40);
                ctx.globalAlpha = 1;
            }

            ctx.font = "22px sans-serif";
            ctx.fillStyle = colors[colorTheme][1];
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            //Draw title screen
            if (titleScreen) {
                ctx.font = Math.round(scale * 1.2) + "px sans-serif";
                ctx.textAlign = "left";
                ctx.textBaseline = "center";
                ctx.fillStyle = "black";

                var txt = gameName;

                var textWidth = ctx.measureText(txt).width;
                var amount = Math.ceil(canvas.width / textWidth)+1;

                txt = txt.repeat(amount);

                var startX = 0
                if (!reduceMotion) {
                    var startX = (timing.timePlaying % 2) / 2;
                }

                drawStroked(ctx, txt,-startX * textWidth,canvas.height * .5);

                ctx.font = Math.round(scale * 0.5) + "px sans-serif";
                ctx.textAlign = "center";
                drawStroked(ctx, subTitle,canvas.width * .5,canvas.height * .6);
            }
            else if (!menuOpened) {
                if (!victory) {
                    //Menu
                    roughCanvas.rectangle(-5, -5, 85, 85, {fill: colors[colorTheme][2], fillWeight: 4, stroke: "none", seed: Math.round(roughSeed / 2)})
                    ctx.fillText("[Esc]",50,60);
 
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
                ctx.globalAlpha = 1;
                var growth = 1;
                if (!reduceMotion) {
                    var growth = EaseInOut(timeSinceMenuToggled / timeToToggleMenu);
                }
                var width = 400 * growth;
                roughCanvas.rectangle(-5, -5, width + 5, 55 + 250 * growth, {fill: colors[colorTheme][2], fillWeight: 4, stroke: "none", seed: Math.round(roughSeed / 2)})

                var textBase = 50;
                var textOffset = 50 * growth;
                ctx.globalAlpha = growth;
                roughCanvas.rectangle(20, textBase * 0.5 + menuSelection * textOffset, width - 40, textOffset, {fillStyle: "none", stroke: colors[colorTheme][1], seed: roughSeed});

                ctx.fillStyle = colors[colorTheme][1];
                ctx.textAlign = "center";

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

                ctx.globalAlpha = 1;
            }
        }
    
        previousScale = localScale;
        window.requestAnimationFrame(gameLoop);
    }
    catch (e) {
        console.error("Whoops! The game crashed.", e);
        console.log("Please report this information to the dev. (It might contain some personal information.)");
        console.log("Your user agent is:",navigator.userAgent);
        console.log("Are your cookies enabled?",navigator.cookieEnabled);
        
        const canvas = document.getElementById("canvas");
        if (canvas) {
            console.log("Size of the canvas:",{width: canvas.width, height: canvas.height})
            ctx.font = "30px sans-serif";
            ctx.fillStyle = "red";
            ctx.textAlign = "left";
            ctx.fillText("Whoops, the game crashed! See the console for more info.",50,50)
        }
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

    var playerTween = tweenPlayer();

    //Path
    if (undoStack.length > 0) {
        var amt = 12;
        var cur = 0;
        for(var i = Math.max(0, undoStack.length - amt); i != undoStack.length; i += 1) {
            cur++;

            levelCtx.globalAlpha = (cur / amt) * 0.5 + (1/amt) * (1-(timeSinceLastAction / timeToCompleteTween));

            var p1 = undoStack[i].player;
            var p2;
            if (i == undoStack.length-1) {
                p2 = playerTween;
            } else {
                p2 = undoStack[i+1].player;
            } //QQQ Make sure line wraps around screen properly, and stays intact during shifts
            roughLevel.line(PosX(p1.x + .5), PosY(p1.y + .5), PosX(p2.x + .5), PosY(p2.y + .5), {strokeWidth: localScale * 0.25, stroke: colors[colorTheme][3], seed: roughSeed});
            //console.log(PosX(p1.x + .5))
        }
    }
    //console.log(levelCtx.globalAlpha);
    levelCtx.globalAlpha = 1;

    //Rubble
    for(let i = 0; i != rubble.length; i++) {
        //var even = (walls[i].x + walls[i].y);
        levelCtx.drawImage(rubbleCanvas, PosX(rubble[i].x) - rubbleMargin * 0.5, PosY(rubble[i].y) - rubbleMargin * 0.5);
    }

    //Target
    for(let i = 0; i != targets.length; i++) {
        levelCtx.drawImage(targetCanvas, PosX(targets[i].x) - targetMargin * 0.5, PosY(targets[i].y) - targetMargin * 0.5);
    }

    //Gate image
    for(let i = 0; i != gates.length; i++) {
        if (gates[i].target <= amountOfLevelsSolved) {
            levelCtx.globalAlpha = 0.2;
        } else {
            levelCtx.globalAlpha = 1;
        }
        levelCtx.drawImage(boxCanvas, PosX(gates[i].x) - boxMargin * 0.5, PosY(gates[i].y) - boxMargin * 0.5);
    }
    levelCtx.globalAlpha = 1;

    //Walls
    for(let i = 0; i != walls.length; i++) {
        levelCtx.drawImage(wallCanvas, PosX(walls[i].x) - wallMargin * 0.5, PosY(walls[i].y) - wallMargin * 0.5);
    }

    //LevelNode image
    for(let i = 0; i != levelNodes.length; i++) {
        levelCtx.drawImage(targetCanvas, PosX(levelNodes[i].x) - targetMargin * 0.5, PosY(levelNodes[i].y) - targetMargin * 0.5);
    }

    //Player
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
    levelCtx.textAlign = "center";
    levelCtx.textBaseline = "middle";
    levelCtx.fillStyle = colors[colorTheme][2];
    for(let i = 0; i != levelNodes.length; i++) {
        //drawStroked()
        levelCtx.font = Math.round(0.5 * localScale)+"px sans-serif";
        levelCtx.fillText(levels[levelNodes[i].target][0].nr.toString(), PosX(levelNodes[i].x) + targetCanvas.width * 0.5 - targetMargin * 0.5, PosY(levelNodes[i].y) - targetMargin * 0.5 + targetCanvas.height * 0.5)
        
        if (levelSolved[i+1] == 2) {
            levelCtx.font = Math.round(0.4 * localScale)+"px sans-serif";
            levelCtx.fillText("✓", PosX(levelNodes[i].x) + targetCanvas.width * 0.75 - targetMargin * 0.5, PosY(levelNodes[i].y) - targetMargin * 0.5 + targetCanvas.height * 0.75);
        } else if (levelSolved[i+1] == 0) {
            levelCtx.font = "bold " + Math.round(0.25 * localScale)+"px sans-serif";
            levelCtx.fillText("!", PosX(levelNodes[i].x) + targetCanvas.width * 0.5 - targetMargin * 0.5, PosY(levelNodes[i].y) - targetMargin * 0.5 + targetCanvas.height * 0.8)
        }
    }

    //Gates text
    levelCtx.font = Math.round(0.4 * localScale)+"px sans-serif";
    levelCtx.textAlign = "center";
    levelCtx.textBaseline = "middle";
    levelCtx.fillStyle = colors[colorTheme][2];
    for(let i = 0; i != gates.length; i++) {
        if (gates[i].target <= amountOfLevelsSolved) {
            levelCtx.globalAlpha = 0.2;
        } else {
            levelCtx.globalAlpha = 1;
        }
        drawStroked(levelCtx, amountOfLevelsSolved + "/" + gates[i].target, PosX(gates[i].x) + boxCanvas.width * 0.5 - boxMargin * 0.5, PosY(gates[i].y) - boxMargin * 0.5 + boxCanvas.height * 0.5)
    }
    levelCtx.globalAlpha = 1;

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

function input(event) {
    if (victory) {return;}
    if (titleScreen) {
        audio("select", true);
        titleScreen = false;
        return;
    }

    var key = event.key;

    dirtyRender = true;

    if (key == "Escape" && timeSinceMenuToggled >= 0.1) {
        menuOpened = !menuOpened;
        if (menuOpened) {
            audio("menu", true);
        } else {
            audio("select", true);
        }
        timeSinceMenuToggled = 0;
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
        } else if (event.shiftKey && key == "n" || key == "N") {
            loadLevel(Math.min(level + 1, levels.length-1 )); //QQQ
            return;
        } else if (event.shiftKey && key == "b" || key == "B") {
            loadLevel(Math.max(level - 1, 0 )); //QQQ
            return;
        }
    }
}

function loadLevel(number, resetStack = true) {
    level = number;

    var levelToLoad = levels[number].slice();
    var metadata = levelToLoad.shift();

    gridHeight = levelToLoad.length;
    gridWidth = levelToLoad[0].length;

    if (levelSolved[level] == 0) {
        levelSolved[level] = 1;
        saveGame();
    }
    
    player = {x: 0, y: 0};
    walls.length = 0;
    boxes.length = 0;
    targets.length = 0;
    levelNodes.length = 0;
    rubble.length = 0;
    gates.length = 0;

    camShakeX = 0;
    camShakeY = 0;

    //path = null;

    freshState = true;

    victory = false;

    setLevelName(level)

    if (levelSolved[level] == 2 && level != 0) {
        levelName += " ✓";
    }

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
    var levelsPlaced = null;
    if (metadata.levelSpread) {
        //console.log(metadata.levelSpread);
        var levelsPlaced = metadata.levelSpread.slice();
    }
    var gatesPlaced = 0;

    function checkPlayer(x, y, lvl) {
        if (lvl == targetLevel && !placedPlayer) {
            this.player = {x: x, y: y};
            placedPlayer = true;

            levelName = levels[targetLevel][0].nr+": "+levels[targetLevel][0].name + " - [Space] to enter";
            timeSinceLevelNameChanged = 0;
        }
    }

    for(let y = 0; y < gridHeight; y++) {
        for(let x = 0; x < gridWidth; x++) {
            var str = levelToLoad[y].substring(x,x+1).toLowerCase();
            switch (str) {
                case obj.PLAYER:
                    if (!placedPlayer) {
                        player = {x: x, y: y};
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
                /*case obj.SHIFTBOXANDTARGET:
                    boxes.push({x: x, y: y, shift: 3});
                    targets.push({x: x, y: y});
                    break;*/
                case obj.TARGET:
                    targets.push({x: x, y: y});
                    break;
                case obj.LEVELONE:
                    levelNodes.push({x: x, y: y, target: levelsPlaced[0]});
                    //console.log("Placing level "+levelsPlaced[0])
                    checkPlayer(x, y, levelsPlaced[0]);
                    levelsPlaced[0]++;
                    break;
                case obj.LEVELTWO:
                    if (amountOfLevelsSolved < metadata.gates[1]) {
                        targets.push({x: x, y: y});
                        break;
                    }
                    levelNodes.push({x: x, y: y, target: levelsPlaced[1]});
                    //console.log("Placing level "+levelsPlaced[1])
                    checkPlayer(x, y, levelsPlaced[1]);
                    levelsPlaced[1]++;
                    break;
                case obj.LEVELTHREE:
                    if (amountOfLevelsSolved < metadata.gates[2]) {
                        targets.push({x: x, y: y});
                        break;
                    }
                    levelNodes.push({x: x, y: y, target: levelsPlaced[2]});
                    //console.log("Placing level "+levelsPlaced[2])
                    checkPlayer(x, y, levelsPlaced[2]);
                    levelsPlaced[2]++;
                    break;
                case obj.LEVELFOUR:
                    if (amountOfLevelsSolved < metadata.gates[3]) {
                        targets.push({x: x, y: y});
                        break;
                    }
                    levelNodes.push({x: x, y: y, target: levelsPlaced[3]});
                    //console.log("Placing level "+levelsPlaced[3])
                    checkPlayer(x, y, levelsPlaced[3]);
                    levelsPlaced[3]++;
                    break;
                case obj.RUBBLE:
                    rubble.push({x: x, y: y});
                    break;
                case obj.GATE:
                    gates.push({x: x, y: y, target: metadata.gates[gatesPlaced]})
                    gatesPlaced++;
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
    /*var wrappedOnY =*/ wrapY();
    if (!wrappedOnX) { //QQQ Shouldn't this be the other way around?
        wrapX();
    }
    /*if (!wrappedOnY) {
        wrapY();
    }*/

    return {x: newX, y: newY}
}

function hasThing(array, x, y) { //Returns INDEX, not OBJECT!
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

function hasClosedGate(x, y) {
    var gate = hasThing(gates, x, y)
    if (gates[gate] != null) {
        //console.log(gates[gate].target, amountOfLevelsSolved)
        if (gates[gate].target <= amountOfLevelsSolved) {
            return null;
        }
    }
    return gate;
}

function even(val) {
    return ((val % 2) == 0)
}

function EaseInOut(t) {
    return(t*(2-t));
}

//From https://stackoverflow.com/questions/13627111/drawing-text-with-an-outer-stroke-with-html5s-canvas
function drawStroked(ctx, text, x, y) {
    ctx.miterLimit = 2;
    ctx.strokeStyle = colors[colorTheme][2];
    ctx.lineWidth = 8;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = colors[colorTheme][1];
    ctx.fillText(text, x, y);
}

function MovePlayer(horDelta, verDelta) {
    var dir = "";

    if (horDelta == -1) {dir = "l"}
    else if (horDelta == 1) {dir = "r"}
    else if (verDelta == 1) {dir = "d"}
    else if (verDelta == -1) {dir = "u"}
    else {throw new Error("MovePlayer function did not recieve valid arguments.")}

    //console.log("------");

    if (horDelta != 0 || verDelta != 0) {
        undoStack.push({player: player, boxes: boxes.slice(), xOff: levelOffsetX, yOff: levelOffsetY}); //Other objects can't move, so aren't stored.

        var movementResolved = false;
        var boxPushed = false;

        prevLevelOffsetX = 0;
        prevLevelOffsetY = 0;

        var target = wrapCoords(player.x + horDelta, player.y + verDelta);
        var targetX = target.x;
        var targetY = target.y;

        //console.log("x:"+player.x+"y:"+player.y+" tx:"+targetX+"ty:"+targetY);

        let foundBox = hasBox(targetX, targetY);
        //console.log("fb: "+foundBox);
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
        else if (hasWall(targetX, targetY) === null && hasClosedGate(targetX, targetY) === null) {
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

        prevHorDelta = horDelta;
        prevVerDelta = verDelta;

        freshState = false;

        if (level == 0) {
            var lvl = hasLevelNode(player.x, player.y);
            setLevelName(lvl,1);
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
            if (levelSolved[level] != 2) {
                levelSolved[level] = 2;
                amountOfLevelsSolved++;
            }
            saveGame();

            audio("victory", true);
            victory = true;
            timeSinceLevelWon = 0;
        } else {
            if (boxPushed) {
                if (prevLevelOffsetX != 0 || prevLevelOffsetY != 0) {
                    audio("shift");
                } else {
                    audio("push");
                }
            } else {
                audio("walk");
            }
        }
    } else {
        if (horDelta != 0 || verDelta != 0) {
            audio("bump");
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
            case "select":
                zzfx(...[,.3,176,.02,,.08,3,.4,-0.7,-21,-127,.01,.05,,,,.38,,.03]);
                break;
            case "bump":
                zzfx(...[,.3,220,.02,,.08,3,.4,-0.7,-21,-127,.01,.05,,,,.38,,.03]);
            case "walk":
                zzfx(...[.6,.1,176,.02,,.01,3,.4,-0.7,-21,-127,.01,.05,,,,.1,,.02]);
                break;
            case "push":
                zzfx(...[.5,.1,220,.02,,.01,3,.4,-0.7,-21,-127,.01,.05,,,,.1,,.02]);
                break;
            case "shift":
                zzfx(...[.45,.1,250,.02,,.01,3,.4,-0.7,-21,-127,.01,.05,,,.1,.1,,.02]);
                break;
            case "victory":
                zzfx(...[.6,,934,.12,.38,.93,1,.27,,.4,-434,.08,.2,.1,,.1,.17,.55,1,.46]);
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
            case "back":
                zzfx(...[,,98,.08,.18,.02,2,2.47,36,.5,,,.04,.1,,.9,.44,,.04]);
                break;
            case "gameend":
                zzfx(...[,,525,.18,.28,.17,1,1.24,8.3,-9.7,-151,.03,.06,,,,,.93,.02,.14]);
        }
    }
}

function saveGame() {
    var ls = window.localStorage;

    var levelsSaved = "";
    for (var i = 1; i != levelSolved.length; i += 1) {
        if (levelSolved[i] == 2) {
            levelsSaved += "t";
        } else if (levelSolved[i] == 1) {
            levelsSaved += "f";
        } else {
            levelsSaved += "n";
        }
    }

    ls.setItem("banbanban-levelsSolved",levelsSaved);
    ls.setItem("banbanban-color",colorTheme);
    ls.setItem("banbanban-audio", audioEnabled);
    ls.setItem("banbanban-reduceMotion", reduceMotion);
    ls.setItem("banbanban-version", 1);
}

function loadGame() {
    var ls = window.localStorage;

    var loadedValue = ls.getItem("banbanban-levelsSolved");
    //console.log(loadedValue);
    if (loadedValue != null) {
        for (var i = 1; i != levelSolved.length; i += 1) {
            if (loadedValue[i-1] == "t") {
                levelSolved[i] = 2;
                amountOfLevelsSolved++;
            } else if (loadedValue[i-1] == "f") {
                levelSolved[i] = 1;
            }
        }
    }

    var loadedValue = parseInt(ls.getItem("banbanban-color"));
    if (loadedValue >= 0 && loadedValue < colors.length) {
        colorTheme = loadedValue;
    }

    var loadedValue = ls.getItem("banbanban-audio");
    if (loadedValue == "false") {
        audioEnabled = false;
    }

    var loadedValue = ls.getItem("banbanban-reduceMotion");
    reduceMotion = loadedValue == "true";
}

function setLevelName(lvl, offset = 0) {
    var prevName = levelName;
    if (level != 0 && !levelSolved.includes(2)) {
        levelName = "Push the box to the goal!";
    } else if (lvl != null && lvl + offset != 0) {
        levelName = levels[lvl + offset][0].nr+": "+levels[lvl + offset][0].name;
        if (level == 0) {
            levelName += " - [Space] to enter";
        }
    } else if (!levelSolved.includes(2)) {
        levelName = "WASD/Arrow Keys to move";
    } else {
        levelName = "";
    }
    if (prevName != levelName) {
        timeSinceLevelNameChanged = 0;
    }
}