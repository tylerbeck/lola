(function( lola ) {
	var $ = lola;
	/**
	 * @description Graphics Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var graphics = {

		//==================================================================
		// Attributes
		//==================================================================
		ctx: null,
		map2d: {},
		reset2d: {},

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.graphics::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization
			lola.safeDeleteHooks.push( {scope:this, fn:this.remove2dContext} );

			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			for ( var k in ctx ){
				switch ( lola.type.get(ctx[k]) ) {
					case "string":
					case "boolean":
					case "number":
						this.reset2d[ k ] = ctx[k];
						break;
				}
			}

			//remove initialization method
			delete lola.graphics.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.graphics::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.graphics.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "graphics";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [ "math.point","math.vector" ];
		},

		map2dContext:function( canvas, id ){
			var context = canvas.getContext('2d');
			id = (id==undefined)?$(canvas).identify().attr('id'):id;
			var gdata = $(canvas).getData( this.getNamespace(), true );
			if (gdata.contexts2d == null)
				gdata.contexts2d = [];
			gdata.contexts2d.push( id );
			//$(canvas).putData( gdata, this.getNamespace() );


			this.map2d[ id ] = context;
		},

		remove2dContext:function( canvas ){
			var gdata = $(canvas).getData( this.getNamespace(), false );
			if (gdata && gdata.contexts2d) {
				var id;
				while ( id = gdata.contexts2d.pop() ){
					delete this.map2d[ id ];
				}
			}
		},

		get2dContext: function(id) {
			return this.map2d[id];
		},

		reset2dContext: function( ctx ) {
			if (typeof ctx == "string")
				ctx = this.get2dContext(ctx);

			if (ctx){
				for (var k in this.reset2d){
					ctx[k] = this.reset2d[k];
				}
			}
		},

		drawSpline: function(spline,ctx){
			var sl = spline.points.length;
			//console.log('drawSpline: '+sl);
			if (sl > 1) {
				var pts = [];
				//console.log(pts);
				spline.points.forEach( function(item){
					pts.push( item.getControl1() );
					pts.push( item.getAnchor() );
					pts.push( item.getControl2() );
				});
				ctx.moveTo( pts[1].x,pts[1].y );
				var pl = pts.length;
				for (var i=2; i<pl-3; i+=3){
					ctx.bezierCurveTo(
							pts[i].x,pts[i].y,
							pts[i+1].x,pts[i+1].y,
							pts[i+2].x,pts[i+2].y
					);
				}

				if (spline.closed){
					ctx.bezierCurveTo(
							pts[pl-1].x,pts[pl-1].y,
							pts[0].x,pts[0].y,
							pts[1].x,pts[1].y
					);
				}
			}
			else{
				throw new Error('not enough spline points');
			}
		},


		//==================================================================
		// Classes
		//==================================================================
		Point: function ( x, y ) {
			this.x = x;
			this.y = y;
			return this;
		},

		Spline: function( points, closed ){
			this.points = points?points:[];
			this.closed = closed===true;
			return this;
		},

		SplinePoint: function( anchorX, anchorY, entryStrength, entryAngle, exitStrength, exitAngle ) {
			return this.init( anchorX, anchorY, entryStrength, entryAngle, exitStrength, exitAngle );
		},

		Vector: function ( velocity, angle ){
			this.velocity = velocity;
			this.angle = angle;
			return this;
		},




		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * @description get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * @description module's selector methods
			 * @type {Object}
			 */
			var methods = {
				map2dContext: function(){
					this.forEach( function(item){
						lola.graphics.map2dContext( item );
					});

					return this;
				}
			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
	graphics.Point.prototype = {
		x: undefined,
		y: undefined,
		toVector: function(){
			var a = Math.atan2( this.y, this.x );
			var v = Math.sqrt( this.x*this.x + this.y+this.y );
			return new lola.graphics.vector(v,a);
		}
	};

	graphics.Spline.prototype = {
		points: [],
		closed: false,
		addPoint: function( splinePoint, index ){
			if ( index == undefined )
				index = this.points.length;

			this.points.splice(index,0,splinePoint);
		},
		removePoint: function( index ){
			if ( index != undefined )
				this.points.splice(index,1,undefined);
		},
		updatePoint: function( splinePoint, index ){
			if ( index != undefined )
			this.points.splice(index,1,splinePoint);
		},
		getPoint: function( index ){
			return this.points[ index ];
		}

	};

	graphics.SplinePoint.prototype = {
		anchor: undefined,
		entry: undefined,
		exit: undefined,

		init: function (ax, ay, es, ea, xs, xa){
			this.anchor = new lola.graphics.Point( ax, ay );
			this.entry = new lola.graphics.Vector( es, ea );
			this.exit = new lola.graphics.Vector( xs, xa==undefined?ea:xa );
		},

		setAngle: function( angle1, angle2) {
			this.entry.angle = angle1;
			this.exit.angle = angle2==undefined?angle1:angle2;
		},

		getAnchor: function(){
			return this.anchor;
		},
		getControl1: function(){
			return lola.math.point.subtract( this.anchor, this.entry.toPoint());
		},
		getControl2: function(){
			return lola.math.point.add( this.anchor, this.exit.toPoint() );
		}

	};

	graphics.Vector.prototype = {
		velocity: undefined,
		angle: undefined,
		toPoint: function() {
			return new lola.graphics.Point(
					Math.cos(this.angle)*this.velocity,
					Math.sin(this.angle)*this.velocity
			)
		}
	};

	//register module
	lola.registerModule( graphics );

})( lola );
