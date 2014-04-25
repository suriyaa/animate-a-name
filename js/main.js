$(function() {
	var canvas = $("#c");
	var canvasHeight;
	var canvasWidth;
	var ctx;
	var dt = 0.1;
	
	var pointCollection;
	
	var baseColor = [ [355,50], [40,50], [120,25], [225,55] ];
	
	function makeColor(hslList, fade){
		return "hsl("+hslList[0]+","+(((255-fade)/255)*40+60)+"%,"+hslList[1]+"%)";
	};
	
	function phraseToHex(phrase) {
		var hexphrase = "";
		for(jj=0; jj<phrase.length; jj++) {
			hexphrase += phrase.charCodeAt(jj).toString(16);
		}
		return hexphrase;
	}
	
	function init() {
		updateCanvasDimensions();
		
		var g = new Array();
		var offset = 0;
		
		function addLetter(cc_hex, ix) {
			if (document.alphabet.hasOwnProperty(cc_hex)) {
				var chr_data = document.alphabet[cc_hex].P;
				var bc = baseColor[ix%4];
				for ( var i=0, len=chr_data.length; i<len; ++i ){
					point = chr_data[i];
					g.push(new Point(point[0]+offset, 
						 point[1],
						 0.0,
						 point[2],
						 makeColor(bc,point[3])));
					}
					offset += document.alphabet[cc_hex].W;
			}
		}
		
		hexphrase = phraseToHex("Suriyaa Kudo");
		
		for(jj=0; jj<hexphrase.length; jj+=2) {
			var cc_hex = "A" + hexphrase.charAt(jj) + hexphrase.charAt(jj+1);
			addLetter(cc_hex, jj/2);
		}	
						
		gLength = g.length;
		for (var i = 0; i < gLength; i++) {
			g[i].curPos.x = (canvasWidth/2 - offset/2) + g[i].curPos.x;
			g[i].curPos.y = (canvasHeight/2 - 180) + g[i].curPos.y;
			g[i].originalPos.x = (canvasWidth/2 - offset/2) + g[i].originalPos.x;
			g[i].originalPos.y = (canvasHeight/2 - 180) + g[i].originalPos.y;
		};
		
		pointCollection = new PointCollection();
		pointCollection.points = g;
		
		initEventListeners();
		timeout();
	};
	
	function initEventListeners() {
		$(window).bind('resize', updateCanvasDimensions).bind('mousemove', onMove);
	};
	
	function updateCanvasDimensions() {
		canvas.attr({height: $(window).height(), width: $(window).width()});
		canvasWidth = canvas.width();
		canvasHeight = canvas.height();
		draw();
	};
	
	function onMove(e) {
		if (pointCollection)
			pointCollection.mousePos.set(e.pageX, e.pageY);
	};
	
	function timeout() {
		draw();
		update();		
		setTimeout(function() { timeout() }, 30);
	};
	
	function draw() {
		var tmpCanvas = canvas.get(0);
		if (tmpCanvas.getContext == null) {
			return; 
		};		
		ctx = tmpCanvas.getContext('2d');
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);		
		if (pointCollection)
			pointCollection.draw();
	};
	
	function update() {		
		if (pointCollection)
			pointCollection.update();
	};
	
	function Vector(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z; 
		this.addX = function(x) {
			this.x += x;
		};		
		this.addY = function(y) {
			this.y += y;
		};		
		this.addZ = function(z) {
			this.z += z;
		}; 
		this.set = function(x, y, z) {
			this.x = x; 
			this.y = y;
			this.z = z;
		};
	};
	
	function PointCollection() {
		this.mousePos = new Vector(0, 0);
		this.points = new Array();
		
		this.newPoint = function(x, y, z) {
			var point = new Point(x, y, z);
			this.points.push(point);
			return point;
		};
		
		this.update = function() {		
			var pointsLength = this.points.length;
			
			for (var i = 0; i < pointsLength; i++) {
				var point = this.points[i];
				
				if (point == null)
					continue;
				
				var dx = this.mousePos.x - point.curPos.x;
				var dy = this.mousePos.y - point.curPos.y;
				var dd = (dx * dx) + (dy * dy);
				var d = Math.sqrt(dd);
				
				if (d < 150) {
					point.targetPos.x = (this.mousePos.x < point.curPos.x) ? point.curPos.x - dx : point.curPos.x - dx;
					point.targetPos.y = (this.mousePos.y < point.curPos.y) ? point.curPos.y - dy : point.curPos.y - dy;
				} else {
					point.targetPos.x = point.originalPos.x;
					point.targetPos.y = point.originalPos.y;
				};
				
				point.update();
			};
		};
		
		this.draw = function() {
			var pointsLength = this.points.length;
			for (var i = 0; i < pointsLength; i++) {
				var point = this.points[i];
				
				if (point == null)
					continue;

				point.draw();
			};
		};
	};
	
	function Point(x, y, z, size, colour) {
		this.colour = colour;
		this.curPos = new Vector(x, y, z);
		this.friction = 0.8;
		this.originalPos = new Vector(x, y, z);
		this.radius = size;
		this.size = size;
		this.springStrength = 0.1;
		this.targetPos = new Vector(x, y, z);
		this.velocity = new Vector(0.0, 0.0, 0.0);
		
		this.update = function() {
			var dx = this.targetPos.x - this.curPos.x;
			var ax = dx * this.springStrength;
			this.velocity.x += ax;
			this.velocity.x *= this.friction;
			this.curPos.x += this.velocity.x;
			
			var dy = this.targetPos.y - this.curPos.y;
			var ay = dy * this.springStrength;
			this.velocity.y += ay;
			this.velocity.y *= this.friction;
			this.curPos.y += this.velocity.y;
			
			var dox = this.originalPos.x - this.curPos.x;
			var doy = this.originalPos.y - this.curPos.y;
			var dd = (dox * dox) + (doy * doy);
			var d = Math.sqrt(dd);
			
			this.targetPos.z = d/100 + 1;
			var dz = this.targetPos.z - this.curPos.z;
			var az = dz * this.springStrength;
			this.velocity.z += az;
			this.velocity.z *= this.friction;
			this.curPos.z += this.velocity.z;
			
			this.radius = this.size*this.curPos.z;
			if (this.radius < 1) this.radius = 1;
		};
		
		this.draw = function() {
			ctx.fillStyle = this.colour;
			ctx.beginPath();
			ctx.arc(this.curPos.x, this.curPos.y, this.radius, 0, Math.PI*2, true);
			ctx.fill();
		};
	};
	
	init();
});
