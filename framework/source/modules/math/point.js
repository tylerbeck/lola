/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Point Math
 *  Description: Point Math module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Point Math Module
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
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.graphics::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.math.point.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.graphics::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.math.point.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "math.point";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ["math","graphics"];
		},

		/**
		 * adds arguments to p1
		 * @param {lola.geometry.Point} p1
		 * @return {lola.geometry.Point}
		 */
		add: function( p1 ){
			var r = new lola.geometry.Point(p1.x,p1.y);
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
		 * subtract args from p1
		 * @param {lola.geometry.Point} p1
		 * @return {lola.geometry.Point}
		 */
		subtract: function( p1 ){
			var r = new lola.geometry.Point(p1.x,p1.y);
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
		 * multiply p1 by args
		 * @param {lola.geometry.Point} p1
		 * @param {lola.geometry.Point|Number} p2
		 * @return {lola.geometry.Point}
		 */
		multiply: function( p1 ){
			var r = new lola.geometry.Point(p1.x,p1.y);
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
		 * divide p1 by args
		 * @param {lola.geometry.Point} p1
		 * @param {lola.geometry.Point|Number} p2
		 * @return {lola.geometry.Point}
		 */
		divide: function( p1 ){
			var r = new lola.geometry.Point(p1.x,p1.y);
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
		 * raise p to the po
		 * @param {lola.geometry.Point} p
		 * @param {lola.geometry.Point} po
		 * @return {lola.geometry.Point}
		 */
		pow: function( p, po ){
			return new lola.geometry.Point( Math.pow( p.x, po ), Math.pow( p.y, po ) );
		},

		/**
		 * calculates the absolute distance between p1 and p2
		 * @param {lola.geometry.Point} p1
		 * @param {lola.geometry.Point} p2
		 * @return {Number}
		 */
		distance: function( p1, p2 ) {
			return Math.sqrt( Math.pow(p2.x-p1.x,2) + Math.pow(p2.y-p1.y,2)  );
		},

		/**
		 * offsets a point at the specified angle by the specified distance
		 * @param {lola.geometry.Point} p
		 * @param {Number} angle angle in radians
		 * @param {Number} distance
		 */
		offsetPoint: function( p, angle, distance ){
			var offset = new lola.geometry.Point( p.x, p.y );
			offset.x += Math.cos( angle ) * distance;
			offset.y += Math.sin( angle ) * distance;
			return offset;
		},



		//==================================================================
		// Classes
		//==================================================================


		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
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

	//register module
	lola.registerModule( point );

})( lola );
