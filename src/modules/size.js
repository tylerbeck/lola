/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Size
 *  Description: size module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "size",

		//module dependencies
		dependencies: ['math','util','css'],

		//initialization flag
		initialized: false,


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.size.initialized ) {
				//console.info('lola.size.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );


				lola.size.initialized = true;
			}
		},


		//------------------------------------------------------------------
		// get real width
		//------------------------------------------------------------------
		getWidth: function ( object ) {
			if ( object.offsetWidth )
				return object.offsetWidth;
			else
				return object.clientWidth;
		},

		//------------------------------------------------------------------
		// get real height
		//------------------------------------------------------------------
		getHeight: function ( object ) {
			if ( object.offsetHeight )
				return object.offsetHeight;
			else
				return object.offsetHeight;
		},

		//------------------------------------------------------------------
		// get offset
		//------------------------------------------------------------------
		getOffset: function ( object, absolute ) {
			if ( absolute == null )
				absolute = false;
			var point = {left:object.offsetLeft,top:object.offsetTop};
			var obj;
			if ( absolute && object.offsetParent ) {
				var parent = lola.measure.getOffset( object.offsetParent, true );
				point.left += parent.left;
				point.top += parent.top;
			}

			return point;

		},

		//------------------------------------------------------------------
		// get absolute x
		//------------------------------------------------------------------
		getAbsX: function ( object ) {
			return lola.size.getOffset( object, true ).left;
		},

		//------------------------------------------------------------------
		// get absolute y
		//------------------------------------------------------------------
		getAbsY: function ( object ) {
			return lola.size.getOffset( object, true ).top;
		},

		//------------------------------------------------------------------
		// get absolute x
		//------------------------------------------------------------------
		getLocalX: function ( object ) {
			return lola.size.getOffset( object, false ).left;
		},

		//------------------------------------------------------------------
		// get absolute y
		//------------------------------------------------------------------
		getLocalY: function ( object ) {
			return lola.size.getOffset( object, false ).top;
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

			width: function ( type ) {
				return this.summaryValue( type, lola.size.getWidth );
			},

			height: function ( type ) {
				return this.summaryValue( type, lola.size.getHeight );
			},

			absX: function ( type ) {
				return this.summaryValue( type, lola.size.getAbsX );
			},

			absY: function ( type ) {
				return this.summaryValue( type, lola.size.getAbsY );
			}

		}

	};

	lola.registerModule( Module );
})( lola );

