(function( lola ) {
	var $ = lola;
	/**
	 * @description Easing Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var easing = {

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
			lola.debug( 'lola.easing::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.easing.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.easing::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.easing.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "easing";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ["math.point"];
		},


		/**
		 * @description calculates a point on a cubic bezier curve given time and an array of points.
		 * @private
		 * @param {Number} t time 0 <= t <= 1
		 * @param {lola.point.Point} p0 anchor 1
		 * @param {lola.point.Point} p1 control 1
		 * @param {lola.point.Point} p2 control 2
		 * @param {lola.point.Point} p3 anchor 2
		 * @return {lola.point.Point}
		 */
		cubicBezier: function( t, p0, p1, p2, p3 ) {
			var inv = 1 - t;
			return lola.math.point.add(
					lola.math.point.multiply( p0, inv * inv * inv ),
					lola.math.point.multiply( p1, 3 * inv * inv * t ),
					lola.math.point.multiply( p2, 3 * inv * t * t ),
					lola.math.point.multiply( p3, t * t * t )
			);

		},



		//==================================================================
		// Classes
		//==================================================================



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


	//register module
	lola.registerModule( easing );

})( lola );

