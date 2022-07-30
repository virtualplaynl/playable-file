let canvas, ctx;
let backgroundFill = "rgb(0,30,50)";
let width, height, hW, hH;
let previousTime;
let paused = true;

const objects = [];
const componentsById = {};
let compID = 1;

const preloaded = { images: {}, sounds: {} };
let preImages, preSounds, completeCheck;
let preloadComplete = false;

let soundInit = false;
const activeSounds = [];
let noteFrequency = [8.18,8.66,9.18,9.72,10.3,10.91,11.56,12.25,12.98,13.75,14.57,15.434,16.352,17.324,18.354,19.445,20.602,21.827,23.125,24.5,25.957,27.5,29.135,30.868,32.703,34.648,36.708,38.891,41.203,43.654,46.249,48.999,51.913,55,58.27,61.735,65.406,69.296,73.416,77.782,82.407,87.307,92.499,97.999,103.83,110,116.54,123.47,130.81,138.59,146.83,155.56,164.81,174.61,185,196,207.65,220,233.08,246.94,261.63,277.18,293.66,311.13,329.63,349.23,369.99,392,415.3,440,466.16,493.88,523.25,554.37,587.33,622.25,659.26,698.46,739.99,783.99,830.61,880,932.33,987.77,1046.5,1108.7,1174.7,1244.5,1318.5,1396.9,1480,1568,1661.2,1760,1864.7,1975.5,2093,2217.5,2349.3,2489,2637,2793.8,2960,3136,3322.4,3520,3729.3,3951.1,4186,4434.9,4698.6,4978,5274,5587.7,5919.9,6271.9,6644.9,7040,7458.6,7902.1,8372,8869.8,9397.3,9956.1,10548,11175,11840,12544,13290,14080,14917,15804,16744];
const audioCtx = new AudioContext();

let gravity = { x: 0, y: 9.81 };
const colliders = [];
const activeCollisions = {};
let minVelocity = .8;

let prevLMB = false, prevMMB = false, prevRMB = false;
const touches = [];
let simulateMouse = true;

let androidLink = "";
let iosLink = "";
let otherLink = "";
let platform = "*";

const camera = {
	x: 0,
	y: 0,
	width: 500,
	height: 500,
	ws: 1,
	hs: 1,
	fitMode: "expand",
	transform: new DOMMatrix(),
	inverse: new DOMMatrix(),
	updateTransform: function() {
		this.transform = new DOMMatrix();
		this.transform.translateSelf(hW-this.x, hH-this.y);
		this.ws = width / this.width;
		this.hs = height / this.height;
		if(this.fitMode == "expand") {
			if(this.ws < this.hs) this.hs = this.ws;
			else this.ws = this.hs;
		}
		this.transform.scaleSelf(this.ws, this.hs);

		this.inverse = this.transform.inverse();
	}
};
const mouse = {
	abs: new DOMPoint(),
	pos: new DOMPoint(),
	leftDown: false,
	middleDown: false,
	rightDown: false,
	leftPressed: false,
	middlePressed: false,
	rightPressed: false,
	leftUp: false,
	middleUp: false,
	rightUp: false
};


function randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class GameObject
{
	constructor(name, position, rotation, scale, ...components)
	{
		this.name = name;
		this.enabled = true;
		this.position = position;
		this.rotation = rotation;
		this.scale = scale;
		this.absolute = false;
		this.rigidbody = null;
		this.components = [];

		components.forEach(component => this.add(component));

		objects.push(this);
	}

	draw()
	{
		if(this.components.length > 0)
		{
			ctx.save();
			if(this.absolute) {
				ctx.resetTransform();
			}
			ctx.translate(this.position.x, this.position.y);
			ctx.rotate(this.rotation);
			if(isNaN(this.scale)) ctx.scale(this.scale.x, this.scale.y);
			else ctx.scale(this.scale, this.scale);
			this.components.forEach(component => {
				ctx.save();
				component.draw();
				ctx.restore();
			});
			ctx.restore();
		}
	}

	update(elapsed)
	{
		this.components.forEach(component => component.update(elapsed));
	}

	lateUpdate(elapsed)
	{
		this.components.forEach(component => component.lateUpdate(elapsed));
	}

	add(component)
	{
		if(component instanceof Rigidbody) {
			if(this.rigidbody != null) {
				console.error(`Error: Can only add one Rigidbody components to ${this}!`);
				return;
			}
			this.rigidbody = component;
		}
		component.object = this;
		this.components.push(component);
	}

	findComponent(componentType)
	{
		this.components.forEach(component => {
			if(typeof(component) == componentType) return component;
		});

		return null;
	}

	collisionEnter(collider)
	{
		this.components.forEach(component => component.collisionEnter(collider));
	}
	collisionStay(collider)
	{
		this.components.forEach(component => component.collisionStay(collider));
	}
	collisionExit(collider)
	{
		this.components.forEach(component => component.collisionExit(collider));
	}

	toString()
	{
		return `[GameObject ${this.name}]`;
	}
}

class Component
{
	constructor()
	{
		this.id = compID++;
		componentsById[this.id] = this;
	}
	draw(){}
	update(elapsed){}
	lateUpdate(elapsed){}
	collisionEnter(collider){}
	collisionStay(collider){}
	collisionExit(collider){}
}

class Sprite extends Component
{
	constructor(imgName, gridX = 1, gridY = 1, index = 0)
	{
		super();
		this.imgName = imgName;
		this.gridX = gridX;
		this.gridY = gridY;
		this.index = index;
		this.image = preloaded.images[imgName];
		this.width = this.image.width / this.gridX;
		this.height = this.image.height / this.gridY;
		this.halfWidth = this.width / 2;
		this.halfHeight = this.height / 2;
		this.alpha = 1;
	}

	draw()
	{
		if(this.alpha < 1) ctx.globalAlpha = this.alpha;
		ctx.drawImage(this.image, (this.index % this.gridX) * this.width, (this.index / this.gridX) * this.height, this.width, this.height, -this.halfWidth, -this.halfHeight, this.width, this.height);
	}
}

class Label extends Component
{
	constructor(text, font, size, fill, shadow = 0)
	{
		super();
		this.text = text;
		this.font = `${size} ${font}`;
		this.size = size;
		this.fill = fill;
		this.shadow = shadow;
		this.align = "center";
		this.baseline = "middle";
	}

	draw()
	{
		ctx.font = this.font;
		ctx.textAlign = this.align;
		ctx.textBaseline = this.baseline;
		if(this.shadow > 0)
		{
			ctx.strokeStyle = 'rgb(0,0,0,0.5)';
			ctx.lineWidth = this.shadow * 1.5;
			ctx.strokeText(this.text, this.shadow, this.shadow);
		}
		ctx.fillStyle = this.fill;
		ctx.fillText(this.text, 0, 0);
	}
}

class Sound extends Component
{
	constructor(sndName, clipNote = 60, loop = false, autoplay = false)
	{
		super();
		this.sndName = sndName;
		this.clipNote = clipNote;
		this.loop = loop;
		this.node = null;
		this.playing = false;
		this.newNode();
		activeSounds.push(this);

		if(autoplay) this.play();
	}

	newNode()
	{
		this.next = new AudioBufferSourceNode(audioCtx, {
			buffer: preloaded.sounds[this.sndName],
			loop: this.loop
		});
		this.next.volume = new GainNode(audioCtx);
		this.next.addEventListener("ended", this.ended);
		this.next.connect(this.next.volume);
		this.next.volume.connect(audioCtx.destination);
	}

	prepare()
	{
		this.play(1.0, audioCtx.currentTime, 0, 0.001);
	}

	playNote(note, volume = 1.0)
	{
		this.play(noteFrequency[note] / noteFrequency[this.clipNote], volume);
	}

	play(rate = 1.0, volume = 1.0, when = audioCtx.currentTime, seek = 0, duration = 86400)
	{
		this.playing = true;
		this.node = this.next;
		this.node.volume.gain.value = volume;
		this.node.playbackRate.value = rate;
		this.node.start(when, seek, duration);
		this.newNode();
	}

	ended()
	{
		this.playing = false;
		this.node = null;
	}
}

function preStartSounds()
{
	soundInit = true;

	activeSounds.forEach(sound => {
		sound.prepare();
	});
}

const piPerMin = 30000 / Math.PI;
class Rotator extends Component
{
	constructor(rpm)
	{
		super();
		this.rpm = rpm;
	}

	update(elapsed)
	{
		this.object.rotation += this.rpm * elapsed / piPerMin;
	}
}

class Rigidbody extends Component
{
	constructor(kinematic = false, mass = 1.0, drag = 1)
	{
		super();
		this.kinematic = kinematic;
		this.invMass = 1.0 / mass;
		this.dragFactor = drag / 10;
		this.gravityMultiplier = 1;
		this.velocity = { x: 0, y: 0 };
		this.resting = {};
	}

	lateUpdate(elapsed)
	{
		if(!this.kinematic) {
			add_to_vector(this.velocity, scaled_vector(gravity, this.gravityMultiplier * elapsed));
			if(this.dragFactor < 1) scale_vector(this.velocity, 1 - this.dragFactor * elapsed);
		}

		this.object.position.x += this.velocity.x * elapsed;
		this.object.position.y += this.velocity.y * elapsed;
	}
}

class Collider extends Component
{
	constructor(isTrigger, bounce)
	{
		super();
		this.isTrigger = isTrigger;
		this.bounce = bounce;
		colliders.push(this);
	}

	test(x, y) {}
}

class CircleCollider extends Collider
{
	constructor(radius, isTrigger = false, bounce = 0.5)
	{
		super(isTrigger, bounce);
		this.radius = radius;
	}

}

// TODO
class BoxCollider extends Collider
{
	constructor(size, isTrigger = false, bounce = 0.5)
	{
		super(isTrigger, bounce);
		this.size = size;
	}
}

class EdgeCollider extends Collider
{
	constructor(direction, isTrigger = false, bounce = 0.5)
	{
		super(isTrigger, bounce);
		this.direction = direction;
	}
}

function updatePhysics(elapsed)
{
	for(let aid in activeCollisions) {
		for(let bid in activeCollisions[aid]) {
			activeCollisions[aid][bid].retain = false;
		}
	}
	let data;
	for (var a = 0; a < colliders.length - 1; a++) {
		for (var b = a + 1; b < colliders.length; b++) {
			if(colliders[a].object != colliders[b].object) {
				data = collisionCheck(colliders[a], colliders[b]);
				if(data.collision) {
					collision(colliders[a], colliders[b], data);
				}
			}
		}
	}
	for(let aid in activeCollisions) {
		for(let bid in activeCollisions[aid]) {
			if(!activeCollisions[aid][bid].retain) {
				componentsById[aid].object.collisionExit(componentsById[bid]);
				componentsById[bid].object.collisionExit(componentsById[aid]);
				delete activeCollisions[aid][bid];
				if(Object.keys(activeCollisions[aid]).length == 0) {
					delete activeCollisions[aid];
				}
			}
		}
	}
}

function collision(a, b, data)
{
	if(a.id in activeCollisions && b.id in activeCollisions[a.id])
	{
		activeCollisions[a.id][b.id].retain = true;
		a.object.collisionStay(b);
		b.object.collisionStay(a);
	}
	else if(b.id in activeCollisions && a.id in activeCollisions[b.id])
	{
		activeCollisions[b.id][a.id].retain = true;
		a.object.collisionStay(b);
		b.object.collisionStay(a);
	}
	else
	{
		if(!(a.id in activeCollisions)) activeCollisions[a.id] = {};
		activeCollisions[a.id][b.id] = { retain: true };
		a.object.collisionEnter(b);
		b.object.collisionEnter(a);
	}

	if(!a.isTrigger && !b.isTrigger && data.inter > 0) {
		resolveCollision(a, b, data);
	}
}

function resolveCollision(a, b, data)
{
	let rba = a.object.rigidbody;
	let rbb = b.object.rigidbody;
	//TODO resting per other collider
	//if((rba == null || rba.resting) && (rbb == null || rbb.resting)) return;

	let normal = data.normal;
	if(a.id == data.b) normal = scaled_vector(data.normal, -1);

	let invMassA = 0;
	let invMassB = 0;
	let va = {x: 0, y: 0};
	let vb = {x: 0, y: 0};
	if(rba != null) {
		invMassA = rba.invMass;
		va = rba.velocity;
	}
	if(rbb != null) {
		invMassB = rbb.invMass;
		vb = rbb.velocity;
	}

	let vr = subtract_vectors(va, vb);
	let vj = (-(1 + a.bounce * b.bounce)) * dot(vr, normal);
	let totalInvMass = invMassA + invMassB;
	let J = vj / totalInvMass;

	if(rba != null) {
		a.object.position = subtract_vectors(a.object.position, scaled_vector(normal, data.inter * invMassA / totalInvMass));
		rba.velocity = add_vectors(va, scaled_vector(normal, invMassA * J));
		// if(sqrMagnitude(rba.velocity) < minVelocity) {
		// 	rba.resting = true;
		// 	rba.velocity = {x: 0, y: 0};
		// }
	}
	if(rbb != null) {
		b.object.position = add_vectors(b.object.position, scaled_vector(normal, data.inter * invMassB / totalInvMass));
		rbb.velocity = subtract_vectors(vb, scaled_vector(normal, invMassB * J));
		// if(sqrMagnitude(rbb.velocity) < minVelocity) {
		// 	rbb.resting = true;
		// 	rbb.velocity = {x: 0, y: 0};
		// }
	}
}

function collisionCheck(a, b)
{
	let rba = a.object.rigidbody;
	let rbb = b.object.rigidbody;
	if(rba == null && rbb == null) return {collision: false};
	//if((rba == null || (rba.resting && is_zero(rba.velocity))) && (rbb == null || (rba.resting && is_zero(rba.velocity)))) return {collision: true, inter: 0};

	if(a instanceof CircleCollider) {
		if(b instanceof CircleCollider) {
			return collideCircleCircle(a, b);
		}
		else if(b instanceof EdgeCollider) {
			return collideCircleEdge(a, b);
		}
	}
	else if(a instanceof EdgeCollider) {
		if(b instanceof CircleCollider) {
			return collideCircleEdge(b, a);
		}
	}
}

function collideCircleCircle(a, b)
{
	let ip = (a.radius + b.radius) - distance(a.object.position, b.object.position);
	if(ip > 0)
	{
		let normal = normalized(subtract_vectors(b.object.position, a.object.position));
		return {collision: true, a: a.id, b: b.id, normal: normal, inter: ip};
	}

	return {collision: false};
}

function collideCircleEdge(a, b)
{
	let ip;
	switch(b.direction)
	{
		case "u":
			ip = (a.object.position.y + a.radius) - b.object.position.y;
			if(ip > 0) {
				return {collision: true, a: a.id, b: b.id, normal: {x: 0, y: 1}, inter: ip};
			}
			break;
		case "d":
			ip = b.object.position.y - (a.object.position.y - a.radius);
			if(ip > 0) {
				return {collision: true, a: a.id, b: b.id, normal: {x: 0, y: -1}, inter: ip};
			}
			break;
		case "l":
			ip = (a.object.position.x + a.radius) - b.object.position.x;
			if(ip > 0) {
				return {collision: true, a: a.id, b: b.id, normal: {x: 1, y: 0}, inter: ip};
			}
			break;
		case "r":
			ip = b.object.position.x - (a.object.position.x - a.radius);
			if(ip > 0) {
				return {collision: true, a: a.id, b: b.id, normal: {x: -1, y: 0}, inter: ip};
			}
			break;
	}

	return {collision: false};
}

function distance(va, vb)
{
	return Math.sqrt((vb.x-va.x) * (vb.x-va.x) + (vb.y-va.y) * (vb.y-va.y));
}

function dot(va, vb)
{
	return (va.x * vb.x + va.y * vb.y);
}

function add_vectors(va, vb)
{
	return {x: va.x + vb.x, y: va.y + vb.y};
}

function add_to_vector(va, vb)
{
	va.x += vb.x;
	va.y += vb.y;
}

function subtract_vectors(va, vb)
{
	return {x: va.x - vb.x, y: va.y - vb.y};
}

function subtract_from_vector(va, vb)
{
	va.x -= vb.x;
	va.y -= vb.y;
}

function scaled_vector(v, s)
{
	return {x: v.x * s, y: v.y * s};
}

function scale_vector(v, s)
{
	v.x *= s;
	v.y *= s;
}

function normalize(v)
{
	scale_vector(v, 1 / Math.sqrt(sqrMagnitude(v)));
}

function normalized(v)
{
	return scaled_vector(v, 1 / Math.sqrt(sqrMagnitude(v)));
}

function is_zero(v)
{
	return v.x == 0 && v.y == 0;
}

function sqrMagnitude(v)
{
	return v.x * v.x + v.y * v.y;
}

function setPlatform()
{
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/android/i.test(userAgent)) platform = "a";
    else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) platform = "i";
}

function startAd()
{
	if(canvas === undefined)
	{
		mraid.removeEventListener('ready');

		canvas = document.getElementById("content");
		ctx = canvas.getContext('2d');
		ctx.imageSmoothingQuality = "high";
		resized();

		setPlatform();

		window.addEventListener('orientationchange', resized);
		window.addEventListener('contextmenu', function (e) { 
		  e.preventDefault(); 
		}, false);
		window.onscroll = function() { window.scrollTo(0, 0); };

		canvas.addEventListener("mousemove", mouseMove);
		canvas.addEventListener("mousedown", mouseDown);
		canvas.addEventListener("mouseup", mouseUp);
		canvas.addEventListener("mouseout", mouseOut);
		canvas.addEventListener("touchstart", touchStart);
		canvas.addEventListener("touchmove", touchMove);
		canvas.addEventListener("touchend", touchEnd);
		canvas.addEventListener("touchcancel", touchCancel);

		camera.updateTransform();

		createGame();

		if(platform == "a" && androidLink == "") alert("Warning: Android link not set");
		else if(platform == "i" && iosLink == "") alert("Warning: iOS link not set");

		loop();
	}
}

function preloadAssets()
{
	preImages = Object.keys(images).length;

	for(let imageName in images) {
		preloaded.images[imageName] = new Image();
		preloaded.images[imageName].src = images[imageName];
	};

	for(let soundName in sounds) {
		fetch(sounds[soundName])
		.then(res => res.blob())
		.then(data => data.arrayBuffer())
		.then(arrayBuffer => {
			preloaded.sounds[soundName] = { loaded: false };
			audioCtx.decodeAudioData(arrayBuffer,
				buffer => {
					preloaded.sounds[soundName] = buffer;
					preloaded.sounds[soundName].loaded = true;
				},
				() => console.log(`Error decoding audio data: ${e.err}`)
			);
		});
	}

	preSounds = Object.keys(sounds).length;

	completeCheck = setInterval(assetCheck, 20);
}

function assetCheck()
{
	let done = 0;
	for(imageName in preloaded.images) {
		if(preloaded.images[imageName].complete) done++;
	}
	for(soundName in preloaded.sounds) {
		if(preloaded.sounds[soundName].loaded) done++;
	}

	if(done >= preImages + preSounds) {
		clearInterval(completeCheck);
		preloadComplete = true;
		if(!paused) startAd();
	}
}

function openAdLink()
{
	if(platform == "android") mraid.open(androidLink);
	else if(platform == "ios") mraid.open(iosLink);
	else mraid.open(otherLink);
}

function mouseMove(evt) {
	mouse.abs.x = evt.clientX;
	mouse.abs.y = evt.clientY;
	mouse.pos = mouse.abs.matrixTransform(camera.inverse);
}

function mouseDown(evt)
{
	if(!soundInit) preStartSounds();
	switch(evt.button)
	{
		case 0:
			mouse.leftPressed = true;
			break;
		case 1:
			mouse.middlePressed = true;
			break;
		case 2:
			mouse.rightPressed = true;
			break;
	}
}

function mouseUp(evt)
{
	switch(evt.button)
	{
		case 0:
			mouse.leftPressed = false;
			break;
		case 1:
			mouse.middlePressed = false;
			break;
		case 2:
			mouse.rightPressed = false;
			break;
	}
}

function mouseOut(evt)
{
	mouse.leftPressed = false;
	mouse.middlePressed = false;
	mouse.rightPressed = false;
}

function getTouch(touch, finger) {
	return { x: touch.pageX, y: touch.pageY, id: touch.identifier, finger: finger };
}

function findTouch(touch) {
	for(let i = 3; i > -1; i--) {
		if(touches.length > i && touches[i].id == touch.identifier) return i;
	}
	return -1;
}

function touchStart(evt)
{
	evt.preventDefault();
	for (let i = 0; i < evt.changedTouches.length; i++) {
		if(touches.length < 4) {
			touches.push(getTouch(evt.changedTouches[i], touches.length));
		}
		if(simulateMouse && touches.length < 4) {
			mouseMove({clientX: touches[0].x, clientY: touches[0].y});
			mouseDown({button: touches.length - 1});
		}
	}
}

function touchMove(evt)
{
	evt.preventDefault();

	for (let i = 0; i < evt.changedTouches.length; i++) {
		let match = findTouch(evt.changedTouches[i]);
		if(match > -1) {
			touches[match].x = evt.changedTouches[i].pageX;
			touches[match].y = evt.changedTouches[i].pageY;
			if(simulateMouse && touches[match].finger == 0) {
				mouseMove({clientX: touches[match].x, clientY: touches[match].y});
			}
		}
	}
}

function touchEnd(evt)
{
	evt.preventDefault();

	for (let i = 0; i < evt.changedTouches.length; i++) {
		let match = findTouch(evt.changedTouches[i]);
		if(match > -1) {
			if(simulateMouse && touches[match].finger < 3) {
				mouseUp({button: touches[match].finger});
			}
			touches.splice(match, 1);
		}
	}
}

function touchCancel(evt)
{
	touchEnd(evt);
}

function mraidReady() {
    mraid.addEventListener('error', mraidError);
    mraid.addEventListener('stateChange', adStateChange);
    mraid.addEventListener('exposureChange', adExposureChange);
    mraid.addEventListener('sizeChange', adSizeChange);
    mraid.addEventListener('viewableChange', viewableChange);
    preloadAssets();
}

function mraidError(err) {
	console.log(`--- MRAID error: ${err}`)
}

function adStateChange(state) {
	console.log(`--- Ad state change: ${err}`)
}

function adExposureChange(exposure) {
    viewableChange(exposure != 0);
}

function adSizeChange(w, h) {
	resized(w, h);
}

function viewableChange(viewable) {
    paused = !viewable;
    if(!paused && preloadComplete && canvas === undefined) startAd();
}

function initAd()
{
	window.removeEventListener('ready', initAd);
	if (document.readyState === 'complete') {
		if (typeof mraid !== 'undefined') {
			if (mraid.getState() === 'loading') {
				mraid.addEventListener('ready', mraidReady);
			}
			else if (mraid.getState() === 'default') {
				mraidReady();
			}
		}
	}
}

function loop(timestamp)
{
	if (previousTime === undefined) previousTime = timestamp;
	const elapsed = (timestamp - previousTime) *.001;

	if(!paused)
	{
		/* update input */
		mouse.leftDown = mouse.leftPressed && !prevLMB;
		mouse.middleDown = mouse.middlePressed && !prevMMB;
		mouse.rightDown = mouse.rightPressed && !prevRMB;
		mouse.leftUp = !mouse.leftPressed && prevLMB;
		mouse.middleUp = !mouse.middlePressed && prevMMB;
		mouse.rightUp = !mouse.rightPressed && prevRMB;
		prevLMB = mouse.leftPressed;
		prevMMB = mouse.middlePressed;
		prevRMB = mouse.rightPressed;

		/* update objects */
		if(elapsed > 0)
		{
			updateGame(elapsed);
			objects.forEach(o => { if(o.enabled) o.update(elapsed); });
			updatePhysics(elapsed);
			objects.forEach(o => { if(o.enabled) o.lateUpdate(elapsed); });
		}

		/* draw objects */
		ctx.resetTransform();
		ctx.fillStyle = backgroundFill;
		ctx.fillRect(0, 0, width, height);

		ctx.setTransform(camera.transform);
		objects.forEach(o => { if(o.enabled) o.draw(elapsed); });
	}


	previousTime = timestamp;

	requestAnimationFrame(loop);
}

function resized(w = 0, h = 0)
{
	if(isNaN(w) || w == 0) {
		width = window.innerWidth;
		height = window.innerHeight;
	}
	else {
		width = w;
		height = h;
	}
	width *= 2;
	height *= 2;
	canvas.width = width;
	canvas.height = height;
	canvas.style.width = "100%";
	canvas.style.height = "100%";
	hW = width / 2;
	hH = height / 2;
	camera.updateTransform();
}

let fps = 60;
function addFpsLabel(size = 20)
{
	let fpsLabel = new Label("0 FPS", "Arial", `${size}px`, "yellow", 0);
	fpsLabel.align = "left";
	fpsLabel.baseline = "top";
	fpsDisplay = new GameObject("FPS Display", {x: size / 2, y: size * 2}, 0, 1, fpsLabel);
	fpsDisplay.absolute = true;
	fpsDisplay.update = function(elapsed)
	{
		fps = fps * .95 + (.05 / elapsed);
		fpsLabel.text = `${fps.toFixed(1)} FPS`;
	}
}

window.addEventListener('load', initAd);
window.addEventListener('resize', resized);