const DEBUG = true;

const fs = require("fs");
const path = require('path');
const UglifyJS = require("uglify-js");
const mime = require('mime-types');

if(process.argv.length != 3) {
	console.log("Usage: node pack.js <html-output-file>\n");
	process.exit();
}

const outputFile = process.argv[2];

const code = fs.readFileSync("engine.js", "utf8") + fs.readFileSync("game.js", "utf8");
const minified = UglifyJS.minify(code, { mangle: { toplevel: true, reserved: ["initAd", "resized"] } });
if(minified.error) {
	console.error(`Error minifying code: ${minified.error}`);
	process.exit(-1);
}

let resources = "let images={};let sounds={};";
let files;
try {
	files = fs.readdirSync("images");
}
catch (err) {
	return console.log(`Unable to read 'images' directory: ${err}`);
}
files.forEach(function (filename) {
	const dot = filename.lastIndexOf(".");
	const imgName = filename.slice(0, dot);
	const mimeType = mime.lookup(filename);
	if(!mimeType.startsWith("image")) {
		console.warning(`Warning: found non-image file '${filename}' in 'images' folder, ignoring!`);
	}
	else if(!imgName.startsWith(".")) {
		resources += `images.${imgName}="data:${mimeType};base64,${fs.readFileSync(path.join("images",filename)).toString("base64")}";`;
	}
});
try {
	files = fs.readdirSync("sounds");
}
catch (err) {
	return console.log(`Unable to read 'sounds' directory: ${err}`);
}
files.forEach(function (filename) {
	const dot = filename.lastIndexOf(".");
	const sndName = filename.slice(0, dot);
	const mimeType = mime.lookup(filename);
	if(!mimeType.startsWith("audio")) {
		console.warning(`Warning: found non-audio file '${filename}' in 'sounds' folder, ignoring!`);
	}
	else if(!sndName.startsWith(".")) {
		resources += `sounds.${sndName}="data:${mimeType};base64,${fs.readFileSync(path.join("sounds",filename)).toString("base64")}";`;
	}
});

const output = fs.readFileSync("boilerplate.html", "utf8").replace("JSCODE", DEBUG ? code : minified.code).replace("RESOURCES", resources);

try {
	fs.writeFileSync(outputFile, output);
	var stats = fs.statSync(outputFile);
	console.log(`Succesfully written ${stats.size} bytes (${(stats.size / 1024).toFixed(1)} kB, ${(stats.size / 1048576).toFixed(1)} MB) to '${outputFile}'.\n`);
} catch (err) {
	console.error(`Error writing to '${outputFile}':\n${err}\n`);
}
