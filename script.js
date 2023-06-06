function abs(c) {
	return Math.sqrt(c.re*c.re + c.im*c.im);
}

class Complex {
	constructor(re, im) {
		this.re = re;
		this.im = im;
	}

	sqr() {
		let re = this.re*this.re - this.im*this.im;
		let im = this.re*this.im;
		this.re = re;
		this.im = im*2;
		return this;
	}

	add(c) {
		this.re += c.re;
		this.im += c.im;
		return this;
	}
}

function init() {
	divF4 = document.getElementById("F4");

	infoElem = {};
	let ids = ["real", "imag", "zoom", "iter", "w", "h", "antialias"];
	for (let i = 0; i < ids.length; i++) {
		infoElem[ids[i]] = document.getElementById(ids[i]);
	}

	draw();
}

function draw() {
	// edit canvas and size according to precision
	updateResolution();

	// fill in F4 menu
	updateF4();
	
	// draw mandelbrot
	mandelbrot();
}

function updateResolution() {
	// make a canvas from (W, H)

	// if existing canvas, delete it
	let existing = document.getElementById("canvas");
	if (existing != undefined) {
		existing.remove();
	}

	// fix ratio using last modified between W and H
	if (existing == undefined || W != existing.width) {
		H = W*window.innerHeight/window.innerWidth;
	} else {
		W = H*window.innerWidth/window.innerHeight;
	}
	// W and H must be integers in correct boundaries
	W = Math.min(Math.max(parseInt(W), 1), window.innerWidth);
	H = Math.min(Math.max(parseInt(H), 1), window.innerHeight);
	zoom = truezoom*W;

	canvas = document.createElement("canvas");
	canvas.id = "canvas";
	canvas.width = W;
	canvas.height = H;

	document.body.appendChild(canvas);
	canvas = canvas.getContext("2d");
}

function updateF4() {
	let anti;
	if (antialias == 1) {
		anti = "No antialiasing";
	} else {
		anti = "" + antialias + "x";
	}

	n = parseInt(Math.log10(zoom)); // change displayed pos precision depending on zoom

	infoElem.real.value = pos.re.toFixed(n);
	infoElem.imag.value = pos.im.toFixed(n);
	infoElem.zoom.value = zoom;
	infoElem.iter.value = N;
	infoElem.w.value = parseInt(W);
	infoElem.h.value = parseInt(H);
	slideTo([1, 2, 4, 8].indexOf(antialias));
}

function slideTo(n) {
	let offset = 0;
	let children = infoElem.antialias.children;
	let width;

	// find the desired position and width of the selector
	for (let i = 0; i <= n; i++) {
		width = children[i+1].offsetWidth;
		if (i < n) {
			offset += width + 10;
		}
	}

	// change the color of the tabs
	for (let i = 1; i < children.length; i++) {
		if (i == n+1) {
			children[i].style = "color: black";
		} else {
			children[i].style = "";
		}
	}

	children[0].style = "--left: " + offset + "; --width: " + width;
	antialias = [1, 2, 4, 8][n];
}

function mandelbrot(size=300) {
	function sortPos(a, b) {
		let s = size/2
		return (b[0] + s - W/2)**2 + (b[1] + s - H/2)**2 - (a[0] + s - W/2)**2 - (a[1] + s - H/2)**2
	}

	redraw = false;
	let allPos = [];
	for (let x = 0; x < W; x += size) {
		for (let y = 0; y < H; y += size) {
			allPos.push([x, y, Math.min(x+size, parseInt(W)), Math.min(y+size, parseInt(H))]);
		}
	}
	allPos.sort(sortPos);
	window.setTimeout(() => {mandelbrotSlice(allPos)}, 0);
}

function mandelbrotSlice(allPos) {
	if (allPos.length == 0) {
		return;
	}
	currentPos = allPos.pop(0);
	let w = currentPos[2]-currentPos[0];
	let h = currentPos[3]-currentPos[1];
	let data = new Uint8ClampedArray(4*w*h);
	let z, c, n, total, bright, r, b;
	let index = 0;
	let a = antialias * antialias;

	for (let y = currentPos[1]; y < currentPos[3]; y ++) {
		for (let x = currentPos[0]; x < currentPos[2]; x ++) {
			data[index+3] = 255; // non-transparent pixel
			total = 0;
			bright = 0;
			for (let dx = 0; dx < antialias; dx++) {
				for (let dy = 0; dy < antialias; dy++) {
					c = new Complex((x - W/2 + dx/antialias)/zoom, (H/2 - y - dy/antialias)/zoom).add(pos);
					z = new Complex(c.re, c.im);
					if (abs(z) <= 2) {
						n = 1;
						while ((abs(z) <= 2) && (n < N)) {
							z.sqr().add(c);
							n += 1;
						}
						if (n < N) {
							total += n/N;
						} else {
							bright ++; // black fading near black mandelbrot set for antialiasing
						}
					}
				}
			}
			total /= a;
			bright = 1 - bright/a;
			if (total < 1) {
				let r = x*255/W;
				let b = 255 - (y*255/H);
				data[index] = r*total*bright;
				data[index+1] = (255-r)*total*bright;
				data[index+2] = b*total*bright;
			}
			index += 4;
		}
	}

	canvas.putImageData(new ImageData(data, w, h), currentPos[0], currentPos[1]);
	window.setTimeout(() => {mandelbrotSlice(allPos)}, 0);
}

function apply() {
	// paste manually set settings into variables and redraw

	pos = new Complex(parseFloat(infoElem.real.value), parseFloat(infoElem.imag.value));
	truezoom = parseInt(infoElem.zoom.value)/W;
	trueN = N = parseInt(infoElem.iter.value);

	// set up precision depending on set resolution
	W = parseInt(infoElem.w.value);
	H = parseInt(infoElem.h.value);

	draw();
}

function onpress(e) {
	let node = window.getSelection().anchorNode;
	if (node != null && node.textContent != "canvas selected") {
			return; // don't move if in an input box
	}

	let movement = 10/zoom;
	if (e.key == "q") {
		pos.re -= movement;
		redraw = true;
	} else if (e.key == "d") {
		pos.re += movement;
		redraw = true;
	} else if (e.key == "z") {
		pos.im += movement;
		redraw = true;
	} else if (e.key == "s") {
		pos.im -= movement;
		redraw = true;
	} else if (e.key == "ArrowUp") {
		truezoom *= 1.2;
		zoom = truezoom*W;
		redraw = true;
	} else if (e.key == "ArrowDown") {
		truezoom /= 1.2;
		zoom = truezoom*W;
		redraw = true;
	} else if (e.key == "ArrowRight") {
		trueN *= 1.2;
		N = parseInt(trueN);
		redraw = true;
	} else if (e.key == "ArrowLeft") {
		trueN /= 1.2;
		N = parseInt(trueN);
		redraw = true;
	} else if (e.key == "+") {
		W *= 1.3;
		H *= 1.3;
		updateResolution();
		redraw = true;
	} else if (e.key == "-") {
		W /= 1.3;
		H /= 1.3;
		updateResolution();
		redraw = true;
	} else if (e.key == "a") {
		if (antialias == 8) {
			antialias = 1;
		} else {
			antialias *= 2;
		}
		redraw = true;
	} else if (e.key == "F4") {
		F4 = !F4;
		if (F4) {
			divF4.className = "F4-showed";
		} else {
			divF4.className = "F4-hidden";
		}
	}
	if (redraw) {
		updateF4();
		mandelbrot();
	}
}

let canvas, divF4, infoElem;
let W = window.innerWidth/2;
let H = window.innerHeight/2;
let redraw = true;
let F4 = true;
let antialias = 1;

//let N = 2000;
//let pos = new Complex(0.268254503, 0.00362449166);
//let zoom = 18268774;
let trueN = N = 100;
let pos = new Complex(-0.5, 0);
let truezoom = 0.5;
let zoom;

document.addEventListener("keydown", onpress);
