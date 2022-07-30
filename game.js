let triangle, circle, square;
let xylo, whistle;
let title;

function createGame()
{
	addFpsLabel(30);

	androidLink = "https://play.google.com/store/apps/details?id=nl.volleybal.opstellingen&hl=nl&gl=US";
	iosLink = "https://apps.apple.com/nl/app/opstellingsfout/id1483937838";
	otherLink = "https://virtualplay.games/";

	gravity.y = 200;

	title = new GameObject("Title", {x: 0, y: -50}, 0, 1, new Label("Simple Physics", "Helvetica, Arial, sans-serif", "50px", 'rgb(128,200,255)', 2));

	xylo = new Sound("Xylo", 62);
	whistle = new Sound("Whistle", 62);

	let spr = new Sprite("Circle");
	circle = new GameObject("Circle", {x: 0, y: 50}, 0, .5, spr, new Rigidbody(), new CircleCollider(spr.width * .208));

	new GameObject("Circle2", {x: -30, y: 100}, 0, .5 * .75, spr, new Rigidbody(false, 0.5), new CircleCollider(spr.width * .208 * .75));
	new GameObject("Circle3", {x: 10, y: 200}, 0, .5 * 1.5, spr, new Rigidbody(false, 2), new CircleCollider(spr.width * .208 * 1.5));
	new GameObject("Circle4", {x: -50, y: 150}, 0, .5 * .9, spr, new Rigidbody(false, 0.8), new CircleCollider(spr.width * .208 * .9));
	new GameObject("Circle5", {x: 50, y: 100}, 0, .5 * 1.2, spr, new Rigidbody(false, 1.5), new CircleCollider(spr.width * .208 * 1.2));

	new GameObject("Top", {x: 0, y: -250}, 0, {x: 100, y: .02}, new Sprite("Square"), new EdgeCollider("d"));
	new GameObject("Bottom", {x: 0, y: 250}, 0, {x: 100, y: .02}, new Sprite("Square"), new EdgeCollider("u"));
	new GameObject("Left", {x: -250, y: 0}, 0, {x: .02, y: 100}, new Sprite("Square"), new EdgeCollider("r"));
	new GameObject("Right", {x: 250, y: 0}, 0, {x: .02, y: 100}, new Sprite("Square"), new EdgeCollider("l"));
}

function updateGame(elapsed)
{
	if(mouse.leftDown) {
		triangle.enabled = !triangle.enabled;
	}
	if(mouse.leftUp) {
		square.enabled = !square.enabled;
	}
	if(mouse.rightDown) {
		xylo.playNote(randomInt(56, 62));
	}
	if(mouse.rightUp) {
		whistle.playNote(randomInt(72, 78));
	}
}