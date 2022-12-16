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

function draw() {
	updatePrecision();
	divF4 = document.getElementById("div-F4");

	updateF4();
	mandelbrot();
}

function updatePrecision() {
	// if existing canvas, delete it
	let existing = document.getElementById("canvas");
	if (existing != undefined) {
		existing.remove();
	}

	// create canvas with correct size
	W = window.innerWidth/precision;
	H = window.innerHeight/precision;
	zoom = truezoom*W;

	canvas = document.createElement("canvas");
	canvas.id = "canvas";
	canvas.width = W;
	canvas.height = H;

	document.body.appendChild(canvas);
	canvas = canvas.getContext("2d");

}

function updateF4() {
	let elts = divF4.children[1].getElementsByTagName("p");
	let comments = ["Pos: ", "Zoom: ", "Iterations: ", "Resolution: "];
	let info = [pos.re + " + " + pos.im + "i", zoom, N, "(" + parseInt(W/precision) + ", " + parseInt(H/precision) + ")"];
	for (let i = 0; i < elts.length; i++) {
		elts[i].innerHTML = comments[i] + info[i];
	}
}

function mandelbrot(size=100) {
	function sortPos(a, b) {
		let s = size/2
		return (b[0] + s - W/2)**2 + (b[1] + s - H/2)**2 - (a[0] + s - W/2)**2 - (a[1] + s - H/2)**2
	}

	redraw = false;
	let allPos = [];
	for (let x = 0; x < W; x += size) {
		for (let y = 0; y < H; y += size) {
			allPos.push([x, y, Math.min(x+size, W), Math.min(y+size, H)]);
		}
	}
	allPos.sort(sortPos);
	window.setTimeout(() => {mandelbrotSlice(allPos)}, 0);
}

function mandelbrotSlice(allPos) {
	if (allPos == []) {
		return;
	}
	currentPos = allPos.pop(0);
	let z, c, n, q, r, b;
	for (let x = currentPos[0]; x < currentPos[2]; x ++) {
		for (let y = currentPos[1]; y < currentPos[3]; y ++) {
			c = new Complex((x - W/2)/zoom, (H/2 - y)/zoom).add(pos);
			z = new Complex(c.re, c.im);
			if (abs(z) > 2) {
				canvas.fillStyle = "black";
			} else {
				n = 1;
				while ((abs(z) <= 2) && (n < N)) {
					z.sqr().add(c);
					n += 1;
				}
				if (n == N) {
					canvas.fillStyle = "black";
				} else {
					let q = n/N;
					let r = x*255/W;
					let b = 255 - (y*255/H);
					canvas.fillStyle = "rgb(R, G, B)".replaceAll("R", r*q).replaceAll("G", (255-r)*q).replaceAll("B", b*q);
				}
			}
			canvas.fillRect(x, y, 1, 1);
		}
	}
	window.setTimeout(() => {mandelbrotSlice(allPos)}, 0);
}

function onpress(e) {
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
		if (precision > 1) {
			precision -= 1;
		}
		updatePrecision();
		redraw = true;
	} else if (e.key == "-") {
		precision += 1;
		updatePrecision();
		redraw = true;
	} else if (e.key == "F4") {
		F4 = !F4;
		if (F4) {
			divF4.className = "showed";
		} else {
			divF4.className = "hidden";
		}
	}
	if (redraw) {
		updateF4();
		mandelbrot();
	}
}

let canvas, divF4;
let W, H;
let precision = 5; // pixels
let redraw = true;
let F4 = true;

//let N = 2000;
//let pos = new Complex(0.268254503, 0.00362449166);
//let zoom = 18268774;
let trueN = N = 100;
let pos = new Complex(-0.5, 0);
let truezoom = 0.5;
let zoom;

document.addEventListener("keydown", onpress);
