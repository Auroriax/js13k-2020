///TOMATO

///TIMING
class Time {
	constructor(seconds) {
		this.seconds = seconds;
	}

	get days() {return this.hours * 24}
	set days(t) {this.seconds = t / 60 / 60 / 24 }
	get hours() {return this.minutes *  60}
	set hours(t) {this.seconds = t / 60 / 60 }
	get minutes() {return (this.seconds * 60)}
	set minutes(t) {this.seconds = t / 60 }
	get milliSeconds() {return (this.seconds * 0.001);}
	set milliSeconds(t) {this.seconds = t * 1000}
}

class Timing {
	constructor(minimumFrameLength, maximumFrameLength) {
		this.minimumFrameLength = minimumFrameLength;
		this.maximumFrameLength = maximumFrameLength;
		this.lastUpdate = new Date();

		this.currentFrameLength = 0;
		this.stepsProcessed = 0;
		this.timePlaying = 0;
	}

	update(overwrite = null) {
		const newUpdate = new Date();

		if (!overwrite) {
			this.currentFrameLength = (newUpdate - this.lastUpdate) / 1000;
		} else {
			this.currentFrameLength = overwrite;
		}

		this.lastUpdate = newUpdate;
		this.timePlaying += this.currentFrameLength;
		this.stepsProcessed += 1;
	}

	get fps() {
		return (1 / this.currentFrameLength)
	}

	perSecond(v) {
		return v * this.currentFrameLength;
	}
}

//COLLISIONS
class Vector2 {
	constructor(x,y) {
		this.x = x;
		this.y = y;
	}

	/** Returns a new Vector2 with the x and y axis swapped around. */
	swap() {return new Vector2(this.y, this.x)}
}

class Hitbox {
	constructor(xOffset, yOffset, width, height) {
		this.origin = new Vector2(xOffset, yOffset); //Topleft corner
		this.width = width;
		this.height = height;
	}

	/** Render this hitbox for debugging purposes. If the point falls in the hitbox, change appearance. */
	render(ctx, point = null) {
		ctx.beginPath();

		if (point != null && PointInRectangle(point, this)) {
			console.log("True!");
			ctx.lineWidth = 5;
		} else {
			ctx.lineWidth = 1;
		}

		ctx.rect(this.origin.x, this.origin.y, this.width, this.height);
		ctx.stroke();
	}
}

/** A square hitbox with the origin in the center. */
function HitboxSquare(xOffset, yOffset, size) {
	return new Hitbox(xOffset, yOffset, size, size, size, size);
}

function PointInRectangle(point, hitbox) {
	return (point.x > hitbox.origin.x && point.x < hitbox.origin.x + hitbox.width 
		&& point.y > hitbox.origin.y && point.y < hitbox.origin.y + hitbox.height )
}

///INPUT
class InputHandler {
	constructor(positiveKeys, negativeKeys = null, timer = null, timeForRefiring = 0) {
		this.delta = 0;
		this.posKeysHeld = [];
		this.negKeysHeld = [];
		this.timer = timer;
		this.heldTime = 0;
		this.waitForRefiring = timeForRefiring;
		this.fired = false;

		if (positiveKeys) {
			positiveKeys.forEach((element) => {
				window.addEventListener('keydown', (event) => {
					if (this.change(event, element)) {
						this.posKeysHeld = PushUnique(this.posKeysHeld, element);
						this.updateDelta();
					}
				});
				window.addEventListener('keyup', (event) => {
					if (this.change(event, element)) {
						this.posKeysHeld = SpliceUnique(this.posKeysHeld, element);
						this.updateDelta();
					}
				});
			});
		}
		this.positiveKeys = positiveKeys;

		if (negativeKeys) {
			negativeKeys.forEach((element) => {
				window.addEventListener('keydown', (event) => {
					if (this.change(event, element)) {
						this.negKeysHeld = PushUnique(this.negKeysHeld, element);
						this.updateDelta();
					}
				});
				window.addEventListener('keyup', (event) => {
					if (this.change(event, element)) {
						this.negKeysHeld = SpliceUnique(this.negKeysHeld, element);
						this.updateDelta();
					}
				});
			});
		}
		this.negativeKeys = negativeKeys;
	}

	change(event, element) {
		return (event.code == element || event.keyCode == element);
	}

	updateDelta() {
		const diff = this.posKeysHeld.length - this.negKeysHeld.length;
		if (diff > 0 && this.delta != 1) {
			this.delta = 1;
			this.heldTime = 0;
		} else if (diff < 0 && this.delta != -1) {
			this.delta = -1;
			this.heldTime = 0;
		} else if (this.delta != 0) {
			this.delta = 0;
			this.heldTime = 0;
		}
	}

	update() {
		if (this.timer && this.delta != 0) {
			var prevHeldTime = this.heldTime;
			this.heldTime += this.timer.currentFrameLength;
			console.log(this.heldTime);

			if (prevHeldTime == 0 || (prevHeldTime % this.waitForRefiring > this.heldTime % this.waitForRefiring)) {
				this.fired = true;
			} else {
				this.fired = false;
			}
		}
	}
}


///MISC
function Clamp(nr, min, max) {
	return Math.max(min, Math.min(nr, max));
}

function PushUnique(array, newEntry) {
	if (array.indexOf(newEntry) === -1) array.push(newEntry);
	return array;
}

function SpliceUnique(array, EntryToSplice) {
	const index = array.indexOf(EntryToSplice);
	if (index > -1) {
		array.splice(index, 1);
	}
	return array;
}

console.log("🍅 Tomato loaded successfully! Version 0.1.0")