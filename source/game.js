var playerCanvas, tileCanvas, borderCanvas, playerContext, tileContext, borderContext, mapCanvas, mapContext;
var domtypes = ["getElementById", "querySelector", "querySelectorAll"];
var getElementById = 0;
var querySelector = 1;
var querySelectorAll = 2;
var runGameLoop = false;
var frameEvent = new CustomEvent("frame");
var currentTick = window.performance.now();
var lastTick = window.performance.now();
var events = {};
var keymap = {};

var player = {
	x: 151,
	y: 16 * 3,
	w: 16,
	h: 32,
	img: null,
	xDirection: 0,
	yDirection: 1,
	xAccel: 0,
	yAccel: 0,
	maxAccel: 5,
	jumpForce: 7,
	jumpHeight: 50,
	jumpStart: 0,
	jumping: 0,
	jumpsUsed: 0,
	maxJumps: 1,
	angle: 0
}
var dt = currentTick - lastTick;
var entities = [player];
var keys = {
	a: 65,
	w: 87,
	s: 83,
	d: 68,
	space: 32,
	shift: 16,
	ctrl: 17,
	alt: 18,
	tab: 9,
	debug: 192
};

function listen(eventName, fn) {
	if (!events[eventName]) {
		events[eventName] = [];
	}
	events[eventName].push(fn);
}

function entity(x, y, w, h, img, moveable, jumpable) {
	var entity = {
		x: x,
		y: y,
		w: w,
		h: h,
		angle: 0,
		img: img
	};
	if (moveable) {
		entity.xDirection = 0;
		entity.yDirection = 0;
		entity.xAccel = 0;
		entity.yAccel = 1;
		entity.maxAccel = 5;
	}
	if (moveable) {
		entity.jumpForce = 7;
		entity.jumpHeight = 50;
		entity.jumpStart = 0;
		entity.jumping = 0;
		entity.jumpsUsed = 0;
		entity.maxJumps = 3;
	}
	return (entity);
}

function trigger(event) {
	var eventName = event.type;
	if (events[eventName] && events[eventName].length > 0) {
		for (var i = 0; i < events[eventName].length; i++) {
			events[eventName][i](event);
		}
	}
}

function getByType(type, id) {
	return document[domtypes[type]](id);
}



function DOMLoaded() {
	playerCanvas = getByType(getElementById, "player");
	borderCanvas = getByType(getElementById, "border");
	tileCanvas = getByType(getElementById, "tile");
	playerContext = playerCanvas.getContext("2d");
	borderContext = borderCanvas.getContext("2d");
	tileContext = tileCanvas.getContext("2d");
	resizeCanvas();
	// createMap();
	loop();
}

function resizeCanvas() {
	if (window.innerWidth > 300) {
		borderCanvas.width = playerCanvas.width = tileCanvas.width = 300;
	} else {
		borderCanvas.width = playerCanvas.width = tileCanvas.width = window.innerWidth;
	}
	if (window.innerHeight > 300) {
		borderCanvas.height = playerCanvas.height = tileCanvas.height = 300;
	} else {
		borderCanvas.height = playerCanvas.height = tileCanvas.height = window.innerHeight;
	}
}



function eachFrame(event) {
	playerContext.clearRect(0, 0, playerCanvas.width, playerCanvas.height);
	borderContext.clearRect(0, 0, borderCanvas.width, borderCanvas.height);
	tileContext.clearRect(0, 0, tileCanvas.width, tileCanvas.height);
	for (var i = 0; i < entities.length; i++) {
		var entity = entities[i];
		handleXMovement(entity);
		entity.x = round(entity.x);
		entity.y = round(entity.y);
		testWalking(entity);
		testJumping(entity);
		handleJump(entity);
		testFalling(entity);
		// drawImg(entity);
		// Physics.
		// if (map[(((entity.x - entity.x % 16) / 16) * width) + (entity.y / 16)] === 1) {
		// 	context.fillStyle = "#FF0000";
		// } else {
		// 	context.fillStyle = "#FFFFFF";
		// }
		// context.fillRect((entity.x - entity.x % 16) / 16, entity.y, entity.w, entity.h);
		// context.fillStyle = "#000000";
		// context.fillRect(entity.x-viewPortX, entity.y-viewPortY, entity.w, entity.h);
		// testHit(entity);
	}
	parseViewPort();
	drawMap();
	// drawRoom();
	playerContext.fillStyle = "#000000";
	for (var i = 0; i < entities.length; i++) {
		var entity = entities[i];
		setStyle(playerContext, "player", "fillStyle", '#000000');
		playerContext.fillRect(entity.x - viewPortX, entity.y - viewPortY, entity.w, entity.h);
	}
}



function loop() {
	currentTick = window.performance.now();
	dt = currentTick - lastTick;
	lastTick = currentTick;
	document.dispatchEvent(frameEvent);
	if (runGameLoop) {
		requestAnimationFrame(loop);
	}
}

// canvas.addEventListener("mousedown")
listen("keydown", handleKeyDown);
listen("keyup", handleKeyUp);
listen("resize", resizeCanvas);
listen("DOMContentLoaded", DOMLoaded);
listen("frame", eachFrame);
window.addEventListener("resize", trigger);
document.addEventListener("DOMContentLoaded", trigger);
document.addEventListener("mousedown", trigger);
document.addEventListener("mouseup", trigger);
document.addEventListener("keydown", trigger);
document.addEventListener("keyup", trigger);
document.addEventListener("frame", trigger);