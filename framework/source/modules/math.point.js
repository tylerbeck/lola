(function( lola ) {
	var $ = lola;
	/**
	 * @description Point Math Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var point = {

		//==================================================================
		// Attributes
		//==================================================================

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.math.point::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.math.point.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.math.point::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.math.point.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "math.point";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ["math"];
		},

		/**
		 * @description adds arguments to p1
		 * @param {lola.math.point.Point} p1
		 * @return {lola.math.point.Point}
		 */
		add: function( p1 ){
			var r = new point.Point(p1.x,p1.y);
			var len =  arguments.length;
			for (var i=1; i<len; i++) {
				var arg = arguments[i];
				if (typeof arg == "number") {
					r.x += arg;
					r.y += arg;
				}
				else {
					r.x += arg.x;
					r.y += arg.y;
				}
			}
			return r;
		},

		/**
		 * @description subtract args from p1
		 * @param {lola.math.point.Point} p1
		 * @return {lola.math.point.Point}
		 */
		subtract: function( p1 ){
			var r = new point.Point(p1.x,p1.y);
			var len =  arguments.length;
			for (var i=1; i<len; i++) {
				var arg = arguments[i];
				if (typeof arg == "number") {
					r.x -= arg;
					r.y -= arg;
				}
				else {
					r.x -= arg.x;
					r.y -= arg.y;
				}
			}
			return r;
		},

		/**
		 * @description multiply p1 by args
		 * @param {lola.math.point.Point} p1
		 * @param {lola.math.point.Point|Number} p2
		 * @return {lola.math.point.Point}
		 */
		multiply: function( p1 ){
			var r = new point.Point(p1.x,p1.y);
			var len =  arguments.length;
			for (var i=1; i<len; i++) {
				var arg = arguments[i];
				if (typeof arg == "number") {
					r.x *= arg;
					r.y *= arg;
				}
				else {
					r.x *= arg.x;
					r.y *= arg.y;
				}
			}
			return r;
		},

		/**
		 * @description divide p1 by args
		 * @param {lola.math.point.Point} p1
		 * @param {lola.math.point.Point|Number} p2
		 * @return {lola.math.point.Point}
		 */
		divide: function( p1 ){
			var r = new point.Point(p1.x,p1.y);
			var len =  arguments.length;
			for (var i=1; i<len; i++) {
				var arg = arguments[i];
				if (typeof arg == "number") {
					r.x /= arg;
					r.y /= arg;
				}
				else {
					r.x /= arg.x;
					r.y /= arg.y;
				}
			}
			return r;
		},

		/**
		 * @description raise p to the po
		 * @param {lola.math.point.Point} p
		 * @param {lola.math.point.Point} po
		 * @return {lola.math.point.Point}
		 */
		pow: function( p, po ){
			return new point.Point( Math.pow( p.x, po ), Math.pow( p.y, po ) );
		},

		/**
		 * @description calculates the absolute distance between p1 and p2
		 * @param {lola.math.point.Point} p1
		 * @param {lola.math.point.Point} p2
		 * @return {Number}
		 */
		distance: function( p1, p2 ) {
			return Math.sqrt( Math.pow(p2.x-p1.x,2) + Math.pow(p2.y-p1.y,2)  );
		},

		/**
		 * @description offsets a point at the specified angle by the specified distance
		 * @param {lola.math.point.Point} p
		 * @param {Number} angle angle in radians
		 * @param {Number} distance
		 */
		offsetPoint: function( p, angle, distance ){
			var offset = new point.Point( p.x, p.y );
			offset.x += Math.cos( angle ) * distance;
			offset.y += Math.sin( angle ) * distance;
			return offset;
		},



		//==================================================================
		// Classes
		//==================================================================
		Point: function ( x, y ) {
			this.x = x;
			this.y = y;
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

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
	point.Point.prototype = {
		x: undefined,
		y:undefined
	};

	//register module
	lola.registerModule( point );

})( lola );
