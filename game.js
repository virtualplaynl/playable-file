let xylo, whistle;
let title;

function createGame()
{
	addFpsLabel(16);

	androidLink = "https://play.google.com/store/apps/details?id=nl.volleybal.opstellingen&hl=nl&gl=US";
	iosLink = "https://apps.apple.com/nl/app/opstellingsfout/id1483937838";
	otherLink = "https://virtualplay.games/";

	physicsDemo();
}

function physicsDemo()
{
	gravity.y = 200;

	title = new GameObject("Title", {x: 0, y: -50}, 0, 1, new Label("Simple Physics", "Helvetica, Arial, sans-serif", 50, 'rgb(128,200,255)', 2));

	xylo = new Sound("Xylo", 62);
	whistle = new Sound("Whistle", 62);

	let spr = new Sprite("Circle", [255, 0, 0]);
	spr.onTapDown = button => {
		spr.object.destroy();
	};
	new GameObject("Circle", {x: 0, y: -200}, 0, .5, spr, new Rigidbody(), new CircleCollider(spr.width * .208));

	spr2 = new Sprite("Circle", [0, 0, 255]);
	spr2.onTapDown = button => {
		spr2.colorize(255, 255, 255);
	};
	spr2.onTapUp = button => {
		spr2.colorize(0, 0, 255);
	};
	new GameObject("Circle2", {x: -50, y: -220}, 0, .5 * .75, spr2, new Rigidbody(false, .5), new CircleCollider(spr.width * .208 * .75, false, .95));
	new GameObject("Circle3", {x: 10, y: 0}, 0, .5 * 1.5, new Sprite("Circle", [0, 255, 0]), new Rigidbody(false, 3), new CircleCollider(spr.width * .208 * 1.5, false, .1));
	new GameObject("Circle4", {x: -50, y: -100}, 0, .5 * .9, new Sprite("Circle", [255, 255, 0]), new Rigidbody(false, .8), new CircleCollider(spr.width * .208 * .9));
	new GameObject("Circle5", {x: 50, y: -150}, 0, .5 * 1.2, new Sprite("Circle", [255, 0, 255]), new Rigidbody(false, 1.5), new CircleCollider(spr.width * .208 * 1.2));

	new GameObject("Top", {x: 0, y: -250}, 0, {x: 100, y: .02}, new Sprite("Square"), new EdgeCollider("d", false, .8));
	new GameObject("Bottom", {x: 0, y: 250}, 0, {x: 100, y: .02}, new Sprite("Square"), new EdgeCollider("u", false, .8));
	new GameObject("Left", {x: -250, y: 0}, 0, {x: .02, y: 100}, new Sprite("Square"), new EdgeCollider("r", false, .8));
	new GameObject("Right", {x: 250, y: 0}, 0, {x: .02, y: 100}, new Sprite("Square"), new EdgeCollider("l", false, .8));
}

function updateGame(elapsed)
{
	if(mouse.rightDown) {
		xylo.playNote(randomInt(56, 62));
	}
	if(mouse.rightUp) {
		whistle.playNote(randomInt(72, 78));
	}
}