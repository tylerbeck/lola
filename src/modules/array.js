/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Array
 *  Description: array module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/

//======================================================================
//Define lola Array Module
//======================================================================
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "array",

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
			if ( !lola.array.initialized ) {
				//console.info('lola.array.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				lola.array.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// isIn
		//------------------------------------------------------------------
		isIn: function ( arr, value ) {
			return arr.indexOf( value ) >= 0;
		},

		//------------------------------------------------------------------
		// hasPropertyValue
		//------------------------------------------------------------------
		hasPropertyValue: function ( arr, prop, value ) {
			var callback = function( element, index, array ) {
				return element[prop] == value;
			};
			return lola( arr ).some( callback, {prop:prop,value:value} );
		},

		//------------------------------------------------------------------
		// hasNonNullValue
		//------------------------------------------------------------------
		hasNonNullValue: function ( arr, prop, value ) {
			var callback = function( element, index, array ) {
				return element != null;
			};
			return lola( arr ).some( callback, {prop:prop,value:value} );
		},

		//------------------------------------------------------------------
		// unique - returns unique array values
		//------------------------------------------------------------------
		unique: function ( arr ) {
			var tmp = [];
			for (var i = arr.length-1; i >= 0; i--){
				if (tmp.indexOf( arr[i] ) == -1){
					tmp.push( arr[i] );
				}
			}

			return tmp;
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

			//foreach
			foreach: function( callback ) {
				//callback(element, index, array)
				this.elements.forEach( callback, this );
				return this;
			},

			//every
			every: function( callback ) {
				//callback(element, index, array) returns boolean
				return this.elements.every( callback, this );
			},

			//some
			some: function( callback, data ) {
				//callback(element, index, array) returns boolean
				return this.elements.some( callback, this );
			}

		},

		//==================================================================
		// NEW Javascript Functionality
		//==================================================================
		upgradeArrayPrototype: function() {
			// forEach JS 1.6 ----------------------------------------------
			if ( !Array.prototype.forEach ) {
				Array.prototype.forEach = function( fun /*, thisp */ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( typeof fun !== "function" )
						throw new TypeError();

					var thisp = arguments[1];
					for ( var i = 0; i < len; i++ ) {
						if ( i in t )
							fun.call( thisp, t[i], i, t );
					}
				};
			}


			// indexOf JS 1.6 ----------------------------------------------
			if ( !Array.prototype.indexOf ) {
				Array.prototype.indexOf = function( searchElement /*, fromIndex */ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( len === 0 )
						return -1;

					var n = 0;
					if ( arguments.length > 0 ) {
						n = Number( arguments[1] );
						if ( n !== n ) // shortcut for verifying if it's NaN
							n = 0;
						else if ( n !== 0 && n !== (1 / 0) && n !== -(1 / 0) )
							n = (n > 0 || -1) * Math.floor( Math.abs( n ) );
					}

					if ( n >= len )
						return -1;

					var k = n >= 0
							? n
							: Math.max( len - Math.abs( n ), 0 );

					for ( ; k < len; k++ ) {
						if ( k in t && t[k] === searchElement )
							return k;
					}
					return -1;
				};
			}

			// lastIndexOf JS 1.6 -------------------------------
			if ( !Array.prototype.lastIndexOf ) {
				Array.prototype.lastIndexOf = function( searchElement /*, fromIndex*/ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( len === 0 )
						return -1;

					var n = len;
					if ( arguments.length > 1 ) {
						n = Number( arguments[1] );
						if ( n !== n )
							n = 0;
						else if ( n !== 0 && n !== (1 / 0) && n !== -(1 / 0) )
							n = (n > 0 || -1) * Math.floor( Math.abs( n ) );
					}

					var k = n >= 0
							? Math.min( n, len - 1 )
							: len - Math.abs( n );

					for ( ; k >= 0; k-- ) {
						if ( k in t && t[k] === searchElement )
							return k;
					}
					return -1;
				};
			}

			// filter JS 1.6 --------------------------------------------
			if ( !Array.prototype.filter ) {
				Array.prototype.filter = function( fun /*, thisp */ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( typeof fun !== "function" )
						throw new TypeError();

					var res = [];
					var thisp = arguments[1];
					for ( var i = 0; i < len; i++ ) {
						if ( i in t ) {
							var val = t[i]; // in case fun mutates this
							if ( fun.call( thisp, val, i, t ) )
								res.push( val );
						}
					}

					return res;
				};
			}

			// every JS 1.6 --------------------------------------------
			if ( !Array.prototype.every ) {
				Array.prototype.every = function( fun /*, thisp */ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( typeof fun !== "function" )
						throw new TypeError();

					var thisp = arguments[1];
					for ( var i = 0; i < len; i++ ) {
						if ( i in t && !fun.call( thisp, t[i], i, t ) )
							return false;
					}

					return true;
				};
			}

			// map JS 1.6 --------------------------------------------
			if ( !Array.prototype.map ) {
				Array.prototype.map = function( fun /*, thisp */ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( typeof fun !== "function" )
						throw new TypeError();

					var res = new Array( len );
					var thisp = arguments[1];
					for ( var i = 0; i < len; i++ ) {
						if ( i in t )
							res[i] = fun.call( thisp, t[i], i, t );
					}

					return res;
				};
			}

			// some JS 1.6 --------------------------------------------
			if ( !Array.prototype.some ) {
				Array.prototype.some = function( fun /*, thisp */ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( typeof fun !== "function" )
						throw new TypeError();

					var thisp = arguments[1];
					for ( var i = 0; i < len; i++ ) {
						if ( i in t && fun.call( thisp, t[i], i, t ) )
							return true;
					}

					return false;
				};
			}

			// reduce ecma-5 ------------------------------------------
			if ( !Array.prototype.reduce ) {
				Array.prototype.reduce = function reduce( accumlator ) {
					var i, l = this.length, curr;

					if ( typeof accumlator !== "function" ) // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
						throw new TypeError( "First argument is not callable" );

					if ( (l == 0 || l === null) && (arguments.length <= 1) )// == on purpose to test 0 and false.
						throw new TypeError( "Array length is 0 and no second argument" );

					if ( arguments.length <= 1 ) {
						for ( i = 0; i = l; i++ ) // empty array
							throw new TypeError( "Empty array and no second argument" );

						curr = this[i++]; // Increase i to start searching the secondly defined element in the array
					}
					else {
						curr = arguments[1];
					}

					for ( i = i || 0; i < l; i++ ) {
						if ( i in this )
							curr = accumlator.call( undefined, curr, this[i], i, this );
					}

					return curr;
				};
			}

			// isArray ecma-5 ------------------------------------------
			if ( !Array.isArray ) {
				Array.isArray = function( obj ) {
					return Object.prototype.toString.call( obj ) === "[object Array]" ||
							(obj instanceof Array);
				};
			}


		}


	};
//set prototypes
	Module.upgradeArrayPrototype();
	delete Module['upgradeArrayPrototype'];

	lola.registerModule( Module );
})( lola );

