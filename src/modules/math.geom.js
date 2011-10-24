/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Utility
 *  Description: utility module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "math.geom",

		//module dependencies
		dependencies: [],

		//initialization flag
		initialized: false,


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.math.geom.initialized ) {
				//console.info('lola.math.tvm.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );


				lola.math.geom.initialized = true;
			}
		},


		//------------------------------------------------------------------
		// distance
		//------------------------------------------------------------------
		distance: function( p1, p2 ){
			return Math.sqrt( Math.pow(p2.x-p1.x,2) + Math.pow(p2.y-p1.y,2)  );
		},

		//------------------------------------------------------------------
		// distance
		//------------------------------------------------------------------
		offsetAngle: function( point, angle, distance ){
			console.log('getting offset of: ['+point.x+','+point.y+'] a:' + angle+' d:'+distance );
			var offset = {x:point.x, y:point.y};
			offset.x += Math.cos( angle ) * distance;
			offset.y += Math.sin( angle ) * distance;
			return offset;
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {


		}

	};
	lola.registerModule( Module );
})( lola );
