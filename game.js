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
const targetMargin = 10;

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
}; //all lowercase if applicable!

var levelName = "Test";
var levelOffsetX = 0;
var levelOffsetY = 0; //QQQ Can't both be non-zero, might implement this later

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

var steps = "";
var prevHorDelta = 0;
var prevVerDelta = 0;

var timeSinceLastAction = 0; //in s
var timeToCompleteTween = 0.1; //in s

var timeToUpdateRenders = (1/3); //in s
var timeSinceUpdatedRenders = timeToUpdateRenders; //in s

loadLevel(level);

function gameLoop() {
    try {
        //Init
        timing.update();

        timeSinceLastAction += timing.currentFrameLength;
        timeSinceUpdatedRenders += timing.currentFrameLength;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        ctx.fillStyle = "white";
        ctx.fillRect(0,0,canvas.width, canvas.height);

        if (canvas.width < 500) {
            scale = 40;
        } else {
            scale = 70;
        }

        var localScale = scale;
        var verHeight = gridHeight * localScale;
        var horWidth = gridWidth * localScale;

        //Render
        if (timeSinceUpdatedRenders >= timeToUpdateRenders) {
            //console.log("Updating renders",timeSinceUpdatedRenders)
            timeSinceUpdatedRenders = 0;

            roughSeed += 1;

            //Render player
            playerCanvas.width = localScale;
            playerCanvas.height = localScale;
            var size = 0.8;
            roughPlayer.circle(localScale * .5, localScale * .5,
                localScale * size, {strokeWidth: 1, seed: roughSeed});

            //Render wall
            wallCanvas.width = localScale+wallMargin;
            wallCanvas.height = localScale+wallMargin;
            roughWall.rectangle(wallMargin * 0.5, wallMargin * 0.5, 
                scale, scale, {fill: "solid", strokeWidth: 1, seed: roughSeed});

            //Render box
            boxCanvas.width = localScale+boxMargin;
            boxCanvas.height = localScale+boxMargin;
            var size = 0.8;
            roughBox.rectangle(boxMargin * 0.5 + (1-size) * 0.5 * localScale, boxMargin * 0.5 + (1-size) * 0.5 * localScale, 
                scale * size, scale * size, {fill: "dots", strokeWidth: 2, seed: roughSeed});

            //Render target
            targetCanvas.width = localScale+targetMargin;
            targetCanvas.height = localScale+targetMargin;
            var size = 1.1;
            roughTarget.circle(localScale * 0.5 + targetMargin * 0.5, localScale * 0.5 + targetMargin * 0.5, 
                localScale * size, {fillStyle: "zigzag", fill: "#888", strokeWidth: 1, seed: roughSeed});
        }

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

        //console.log("cx: "+camShakeX + " cy: "+camShakeY)

        const borderOffset = 5;
        roughCanvas.rectangle(cameraX-borderOffset + camShakeX, cameraY-borderOffset + camShakeY, 
            horWidth + borderOffset + levelMargin, verHeight + borderOffset + levelMargin, {seed: roughSeed});

        drawLevel(roughLevel, 0, 0, gridWidth, gridHeight, localScale, roughSeed);
        
        var clipOffset = 10; //In pixels, positive
        var screenWidthRatio = Math.ceil(((canvas.width - horWidth + clipOffset) / horWidth * 0.5));
        var screenHeightRatio = Math.ceil(((canvas.height - verHeight + clipOffset) / verHeight * 0.5));

        //Add a little safety padding in case the level wrapping is offset
        if (levelOffsetX != 0) {screenWidthRatio += 1}
        if (levelOffsetY != 0) {screenHeightRatio += 1}

        for(let y = -screenHeightRatio; y <= screenHeightRatio; y++) {
            for(let x = -screenWidthRatio; x <= screenWidthRatio; x++) {
                if (x != 0 || y != 0) 
                {
                    ctx.globalAlpha = Math.max(0, 1 - Math.abs(y) * 0.1 - Math.abs(x * 0.1));
                    if (ctx.globalAlpha > 0) {
                        ctx.drawImage(levelCanvas, 
                        cameraX + horWidth * x + levelOffsetX * scale * y,
                        cameraY + verHeight * y + levelOffsetY * scale * x);
                    }
                }
            }
        }

        ctx.globalAlpha = 1;
        ctx.drawImage(levelCanvas, cameraX + camShakeX, cameraY + camShakeY);

        //Draw level name
        drawStroked(levelName, 40, canvas.height - 40);

        ctx.font = "22px sans-serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        //Menu
        roughCanvas.rectangle(-5, -5, 85, 85, {fill: "solid", fillWeight: 4, fillStyle: "white", seed: Math.round(roughSeed / 2)})
        ctx.fillText("[Esc]",50,60);

        //Reset
        roughCanvas.rectangle(canvas.width-160, canvas.height - 80, 100, 50, {fill: "solid", fillWeight: 4, fillStyle: "white", seed: Math.round(roughSeed / 2)})
        ctx.fillText("[R] Retry",canvas.width-110,canvas.height - 55);

        //Undo
        roughCanvas.rectangle(canvas.width-280, canvas.height - 80, 100, 50, {fill: "solid", fillWeight: 4, fillStyle: "white", seed: Math.round(roughSeed / 2) + 10})
        ctx.fillText("[Z] Undo",canvas.width-230,canvas.height - 55);

        //QQQ
        roughCanvas.rectangle(250,50,canvas.width - 300, 50, {fill: "solid", fillWeight: 4, fillStyle: "white", seed: 1});
        ctx.fillText("[Todo: Level Select, Puzzles, Settings. Deadline 13 September!]",canvas.width * 0.5 + 100,75);
    
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
        levelCtx.drawImage(playerCanvas, PosX(playerTween.x) + offsetX, 
        PosY(playerTween.y) + offsetY);
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

            percent = Tween(percent);

            function Tween(t) {
                return(t*(2-t));
            }

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
    if (key == "r") {
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
            var stateToRestore = undoStack.pop();

            player = stateToRestore.player;
            boxes = stateToRestore.boxes;

            steps = steps.slice(0, -1);

            console.warn("Popped the undo stack, remaining entries:", undoStack.length);
        }
        return;
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
        var victory = true;
        for(let i = 0; i != targets.length; i++) {
            if (hasBox(targets[i].x, targets[i].y) === null) {
                victory = false; break;
            }
        }

        if (victory) {
            console.warn("Victory!",steps + " (" + steps.length + ")");
        }
    } else {
        camShakeX = horDelta * 12;
        camShakeY = verDelta * 12;
        undoStack.pop(); //Nothing changed, so discard Undo state.
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

    if (metadata.name) {
        levelName = (level+1).toString() + ": "+ metadata.name;
    } else {
        levelName = (level+1).toString();
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
            }
        }
    }

    if (resetStack) {
        undoStack = [];
        steps = "";
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

//From https://stackoverflow.com/questions/13627111/drawing-text-with-an-outer-stroke-with-html5s-canvas
function drawStroked(text, x, y) {
    ctx.miterLimit = 2;
    ctx.font = '40px sans-serif';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 8;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = 'white';
    ctx.fillText(text, x, y);
}