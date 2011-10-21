/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: String
 *  Description: string module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "string",

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
			if ( !lola.string.initialized ) {
				//console.info('lola.string.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				lola.string.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// pads an int with '0's
		//------------------------------------------------------------------
		padInt: function ( n, size ) {
			if ( size == null )
				size = 2;

			str = n.toString();
			while ( str.length < size ) {
				str = '0' + str;
			}

			return str;
		},


		//------------------------------------------------------------------
		// camelCase - changes hyphenated strings to camelCase
		//------------------------------------------------------------------
		camelCase: function ( str ) {
			var parts = str.split( "-" );
			for ( var i in parts ) {
				if ( parts[i].length > 0 )
					parts[i][0] = parts[i][0].toUpperCase();
			}

			return parts.join();
		},

		//------------------------------------------------------------------
		// encode a string
		//------------------------------------------------------------------
		encode: function( str ) {
			if ( typeof str == 'string' ) {
				str = str.replace( /</g, '&lt;' );
				str = str.replace( />/g, '&gt;' );
				str = str.replace( /&/g, '&amp;' );
			}
			return str;
		},

		//------------------------------------------------------------------
		// unencode a string
		//------------------------------------------------------------------
		unencode: function( str ) {
			if ( typeof str == 'string' ) {
				str = str.replace( /\$lt;/g, '<' );
				str = str.replace( /&gt;/g, '>' );
				str = str.replace( /&amp;/g, '&' );
			}
			return str;
		},



		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

		},

		//==================================================================
		// NEW Javascript Functionality
		//==================================================================
		upgradeStringPrototype: function() {

			if ( !String.prototype.trim ) {
				String.prototype.trim = function () {
					return String( this ).replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' );
				};
			}
		}


	};

	Module.upgradeStringPrototype();
	delete Module['upgradeStringPrototype'];

	lola.registerModule( Module );
})( lola );

