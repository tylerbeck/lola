( function( window ) {
	/**
	 * @namespace lola
	 * @description: Lola Framework core is used to load modules and for top-level framework attributes and methods
	 * @param {String} selector selector string
	 * @param {Object|undefined} context for selection
	 * @return {lola.Selector}
	 */
	var lola = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @private
		 * @type {int}
		 */
		window: window,

		/**
		 * @private
		 * @type {int}
		 */
		 guid: 0,

		/**
		 * @private
		 * @type {Boolean}
		 */
		initialized: false,

		/**
		 * @private
		 * @type {Array}
		 */
		initializers: [],

		/**
		 * @private
		 * @type {Array}
		 */
		dependencies: [],

		/**
		 * @private
		 * @type {Array}
		 */
		safeDeleteHooks: [],

		/**
		 * @private
		 * @type {Boolean}
		 */
		debugMode: true,

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description framework initialization function
		 * @private
		 * @param wnd {Object} reference to window
		 */
		initialize: function( wnd ) {
			if (!lola.initialized) {
				lola.debug('lola::initialize');
				lola.initialized  = true;
				window = wnd;

				var i;

				//remove auto initialization listeners
				if ( document.addEventListener ) {
					document.removeEventListener( "DOMContentLoaded", lola.initialize, false );
				}
				else if ( document.attachEvent ) {
					document.detachEvent( "onreadystatechange", lola.initialize );
				}

				//check dependencies
				//TODO: Update dependencie checks
				var fails = [];
				var dependenciesLength = lola.dependencies.length;
				for ( i = 0; i < dependenciesLength; i++ ) {
					var dependency = lola.dependencies[i];
					//if ( this.hasProperties( this, this.dependencies[module] ) )
					//	break;
					//fails.push( module );
				}
				if ( fails.length > 0 ) {
					throw new Error( "module dependency checks failed for: " + fails.join( ", " ) );
				}

				//execute initialization stack
				var stackSize = lola.initializers.length;

				for ( i = 0; i < stackSize; i++ ) {
					var initializer = lola.initializers[i];
					if (initializer){
						initializer.call( window );
					}

					delete lola.initializers[i];
				}
			}
		},

		/**
		 * @description creates/gets and returns the object lineage defined in chain param
		 * @public
		 * @param {!Object} base object on which to build chain
		 * @param {!String} chain "." seperated namespace / package
		 * @return {Object}
		 */
		getPackage: function( base, chain ) {
			//lola.debug('lola::getPackage');
			var result = base;
			if ( typeof chain === 'string' ) {
				var parts = chain.split( '.' );
				var part;
				while ( part = parts.shift() ) {
					if ( result[part] == null  ) result[part] = {};
					result = result[part];
				}
			}
			return result;
		},

		/**
		 * @description extends the target with properties from the source
		 * @public
		 * @param target {Object}
		 * @param source {Object}
		 * @param overwrite {Boolean|undefined}
		 * @param errors {Boolean|undefined}
		 * @return {void}
		 */
		extend: function( target, source, overwrite, errors ) {
			//lola.debug('lola::extend');
			//TODO: make deep copy an option
			if ( overwrite == undefined ) overwrite = false;
			if ( errors == null ) errors = false;
			for ( var k in source ) {
				if ( overwrite || target[k] == null )
					target[k] = source[k];
				else if ( errors )
					throw new Error( "property " + k + " already exists on extend target!" );
			}
		},


		/**
		 * @description eval abstraction
		 * @param {String} expression the expression to evaluate
		 * @param {Object|undefined} node the node in which to load the script
		 */
		evaluate: function( expression, node ) {
			//console.info('eval: '+expression);
			if ( node == null ) {
				node = document.getElementsByTagName( 'head' )[0];
				if ( !node )
					node = document.documentElement;
			}

			var script = document.createElement( 'script' );
			script.type = "text/javascript";

			if ( this.support.domEval ) {
				script.appendChild( document.createTextNode( expression ) );
			}
			else {
				script.text = expression;
			}

			node.insertBefore( script, node.firstChild );
			node.removeChild( script );
		},

		/**
		 * @description loads a script from a url src
		 * @param {String} src the uri of the script to load
		 * @param {Function|undefined} callback the function to call after the script has loaded
		 */
		loadScript: function( src, callback ) {
			console.info('loadScript: '+src);
			var	node = document.getElementsByTagName( 'head' )[0];
			if ( !node )
				node = document.documentElement;

			var script = document.createElement( 'script' );
			script.type = "text/javascript";
			script.src = src;

			if (typeof callback == "function")
				lola.event.addListener(script, 'load', function(){ callback.call(); });

			node.insertBefore( script, node.firstChild );
			node.removeChild( script );
		},



		/**
		 * @description registers a module with the Lola Framework
		 * @public
		 * @param {lola.Module} module
		 * @return {void}
		 */
		registerModule: function( module ) {
			lola.debug('lola::registerModule - ' + module.getNamespace() );
			//add module dependencies
			lola.dependencies.push( module.getDependencies() );

			//add module to namespace
			lola.extend( lola.getPackage( lola, module.getNamespace() ), module );

			//add selector methods
			lola.extend( lola.Selector.prototype, module.getSelectorMethods() );
			delete module['getSelectorMethods'];

			//add initializer
			if ( module.initialize && typeof module.initialize === "function" ) {
				lola.initializers.push( function() {
					module.initialize();
				} );
			}

			//run preinitialization method if available
			if ( module.preinitialize && typeof module.preinitialize === "function" ) {
				module.preinitialize();
			}
		},

		/**
		 * @description delete a property on an object and removes framework references
		 * @public
		 * @param {Object} object object on which to delete property
		 * @param {String} property property to delete
		 * @return {void}
		 */
		safeDelete: function( object, property ) {
			//lola.debug('lola::safeDelete');
			var obj = (property) ? object[ property ] : object;
			for ( var i = this.safeDeleteHooks.length - 1; i >= 0; i-- ) {
				var hook = this.safeDeleteHooks[i];
				hook.fn.call( hook.scope, obj );
			}

			if ( object && property )
				delete object[ property ];

		},

		/**
		 * @description Object prototype's to string method
		 * @param {Object} object
		 * @return {String}
		 */
		toString: Object.prototype.toString,

		/**
		 * @description checks for required arguments
		 * @param {String} group
		 * @param {Array} required
		 * @param {Array} info
		 * @return {Boolean}
		 */
		checkArgs: function ( group, required, info ) {
			var check = true;
			var warnings = [];


			for (var i=required.length-1; i >= 0; i--){
				if (required[i][1] === undefined || required[i][1] === null){
					check = false;
					warnings.push(required[i][0]+' is not set!')
				}
			}

			if (!check){
				//start group
				if (console.groupCollapsed)
					console.groupCollapsed( group );
				else
					console.group( group );

				//error info
				if (lola.type.get(info) == 'array'){
					info.forEach( function(item){
						console.info( item );
					});
				}

				//error warnings
				warnings.forEach( function(item){
					console.warn( item );
				});

				//end group
				console.groupEnd();
			}

			return check;
		},

		debug: function( msg ){
			if (lola.debugMode) {
				console.log(msg);
			}
		},

		//==================================================================
		// Prototype Upgrades
		//==================================================================
		/**
		 * upgrades object prototype and is then deleted
		 * @private
		 */
		upgradeObjectPrototype: function() {

			if ( !Object.keys ) {
				Object.keys = function ( object ) {
					var keys = [];
					for ( var name in object ) {
						if ( Object.prototype.hasOwnProperty.call( object, name ) ) {
							keys.push( name );
						}
					}
					return keys;
				};
			}
		},

		//==================================================================
		// Classes
		//==================================================================
		/**
		 * @description Selector class
		 * @param {String} selector selector string
		 * @param {Object|undefined} context for selection
		 * @constructor
		 */
		Selector: function( selector, context ) {
			return this.initialize( selector, context );
		},

		/**
		 * @description Lola Module Interface
		 * @interface
		 */
		Module: function() {

		}

	};

	//==================================================================
	// Selector Methods
	//==================================================================
	lola.Selector.prototype = {
		/**
		 * @description internal selection element array
		 * @private
		 * @type {Array}
		 */
		elements: [],

		/**
		 * @description Selector initialization function
		 * @param {String} selector selector string
		 * @param {Object} context context in which to
		 * @return {lola.Selector}
		 */
		initialize: function( selector, context ) {
			if ( typeof selector === "string" ){
				if (Sizzle != null) {
					this.elements = Sizzle( selector, context );
				}
				else {
					//TODO: write lightweight selector to use if Sizzle not loaded
					throw new Error( "Sizzle not found" );
				}
			}
			else if ( Array.isArray( selector ) ) {
				this.elements = selector;
			}
			else {
				this.elements = [selector];
			}

			return this;
		},

		/**
		 * @description assigns guid to elements
		 * @return {lola.Selector}
		 */
		identify: function() {
			this.foreach( function( item ) {
				if ( !item.id )
					item.id = "lola-guid-" + guid++;
			} );

			return this;
		},

		/**
		 * @description returns the element at the specified index
		 * @param {int} index
		 * @return {Object}
		 */
		get: function( index ) {
			if ( index == undefined )
				index = 0;
			return this.elements[ index ];
		},

		/**
		 * @description returns all of the selected elements
		 * @return {Array}
		 */
		getAll: function() {
			return this.elements;
		},

		/**
		 * @description returns element count
		 * @return {int}
		 */
		count: function() {
			return this.elements.length;
		},

		/**
		 *@description concatenates the elements from one or more
		 * @param {lola.Selector|Array|Object} obj object to concatenate
		 * @return {lola.Selector}
		 */
		concat: function( obj ) {
			if ( obj instanceof Selector ) {
				this.elements = this.elements.concat( obj.getAll() );
			}
			else if ( obj instanceof Array ) {
				var item;
				while ( item = obj.pop() ) {
					this.concat( item );
				}
			}
			else {
				this.elements.push( obj );
			}

			return this;
		},

		/**
		 * @description  removes framework references for elements
		 * @return {lola.Selector}
		 */
		safeDelete: function() {
			this.foreach( function( item ){
				safeDelete( item );
			});
			return this;
		}

	};

	//==================================================================
	// Module Interface
	//==================================================================
	lola.Module.prototype = {

		/**
		 * @description initializes module
		 * @return {void}
		 */
		initialize: function() {
		},

		/**
		 * @description get module's namespace
		 * @return {String}
		 */
		getNamespace: function() {
			return "";
		},

		/**
		 * @description get module's dependencies
		 * @return {Array}
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * @description get module's selectors
		 * @return {Object}
		 */
		getSelectorMethods: function() {
			return {};
		}

	};

	//==================================================================
	// Auto Initialization
	//==================================================================
	var main = function( selector, context ) {
		return new lola.Selector( selector, context );
	};

	lola.upgradeObjectPrototype();
	delete lola.upgradeObjectPrototype;


	lola.extend( main, lola, true );
	lola = main;
	window['$'] = lola;
	window['lola'] = lola;

	if ( document.readyState === "complete" ) {
		lola.initialize( window );
	}
	else {
		if ( document.addEventListener ) {
			document.addEventListener( "DOMContentLoaded", lola.initialize, false );
			window.addEventListener( "load", lola.initialize, false );
		}
		else if ( document.attachEvent ) {
			document.attachEvent( "onreadystatechange", lola.initialize );
			window.attachEvent( "onload", lola.initialize );
		}
	}

})( window );


(function( lola ) {
	var $ = lola;
	/**
	 * @description Ag Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var agent = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @description registration index
		 * @private
		 */
		index: 0,

		/**
		 * @description registration map
		 * @private
		 */
		map: {},

		/**
		 * @description initializers
		 * @private
		 */
		initializers: [],

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.agent::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization
			lola.safeDeleteHooks.push( {scope:this, fn:this.drop} );


			//remove initialization method
			delete lola.agent.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.agent::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.agent.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "agent";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['event','data'];
		},


		/**
		 * @description used to register an agent with the framework
		 * @param {Object} agent object that implements the agent interface
		 */
		register: function( agent ) {
			console.info('register agent: '+agent.name);
			if (agent.sign && agent.drop) {
				//setup namespace
				var pkg = lola.getPkgChain( lola.agent, agent.name );

				//copy module methods and attributes
				lola.extend( pkg, agent, true );

				//map agent
				this.map[ agent.name ] = pkg;

				//add initializer
				if ( agent.initialize && typeof agent.initialize === "function" ) {
					lola.agent.initializers.push( function() {
						agent.initialize();
					} );
				}

				//run preinitialization method if available
				if ( agent.preinitialize && typeof agent.preinitialize === "function" ) {
					agent.preinitialize();
				}

			}
			else {
				console.error( 'invalid agent implementation: '+name );
			}

		},

		/**
		 * @description assign a client to an agent
		 * @param {Object} client
		 * @param {String} name name of registered agent
		 */
		assign: function( client, name ) {
			var agent = lola.agent.map[ name ];
			if (agent){
				agent.sign( client );
			}
			else {
				throw new Error("unknown agent: "+name);
			}
		},

		/**
		 * @description drop a client from an agent
		 * @param {Object} client
		 * @param {String} name name of registered agent
		 */
		drop: function( client, name ) {
			var agents = {};
			if (name == !undefined){
				agents = lola.agent.map;
			}
			else if (typeof name == 'string'){
				name.split(',').forEach( function(item){
					agents[ item ] = lola.agent.map[ item ];
				});
			}

			for (var i in agents){
				var agent = agents[i];
				if (agent){
					agent.drop( client );
				}
			}
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

				/**
				 * @description assigns an agent to selector elements
				 * @param {String} agentName name of registered agent
				 */
				assignAgent: function( agentName ) {
					this.foreach( function(item){
						lola.agent.assign( item, agentName );
					});
					return this;
				},

				/**
				 * @description drops client from agent
				 * @param {String} agentName name of registered agent
				 */
				dropAgent: function( agentName ) {
					this.foreach( function(item){
						lola.agent.drop( item, agentName );
					})
				}

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================




	//register module
	lola.registerModule( agent );

})( lola );

(function( lola ) {
	var $ = lola;
	/**
	 * @description Array Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var array = {

		//==================================================================
		// Attributes
		//==================================================================


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.array::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.array.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default array
		 */
		getNamespace: function() {
			return "array";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * @description checks an array of objects for a property with value
		 * @public
		 * @param {Array<Object>} array array to check
		 * @param {String} property property to inspect
		 * @param value value to match
		 * @return {Boolean}
		 */
		hasObjectWithProperty: function ( array, property, value ) {
			var callback = function( item, index, arr ) {
				return item[property] == value;
			};
			return array.some( callback );
		},

		/**
		 * @description returns a unique copy of the array
		 * @public
		 * @param array
		 * @return {Array}
		 */
		unique: function ( array ) {
			var tmp = [];
			for (var i = array.length-1; i >= 0; i--){
				if (tmp.indexOf( array[i] ) == -1){
					tmp.push( array[i] );
				}
			}

			return tmp;
		},

		/**
		 * @description checks if array contains object
		 * @public
		 * @param {Array} array
		 * @return {Boolean}
		 */
		isIn: function ( array, value ) {
			return array.indexOf( value ) >= 0;
		},

		/**
		 * @description removes null values from array
		 * @public
		 * @param {Array} array
		 * @return {Array}
		 */
		pruneNulls: function( array ) {
			var tmp = [];
			array.forEach( function(item){
				if ( item != null ){
					tmp.push( item );
				}
			});
			return tmp;
		},


		/**
		 * @description creates a sort function for property
		 * @param {String} property
		 * @return {Function}
		 */
		getSortFunction: function( property ){
			return function( a, b ) {
				var x = a[property];
				var y = b[property];
				return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			};
		},


		//==================================================================
		// Selector Methods
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

				/**
				 * @description iterates each element in Selector and applies callback.
				 * @param {Function} callback function callback( item, index, array ):void
				 */
				forEach: function( callback ) {
					this.elements.forEach( callback, this );
					return this;
				},

				/**
				 * @description iterates each element in Selector and checks that every callback returns true.
				 * @param {Function} callback function callback( item, index, array ):Boolean
				 */
				every: function( callback ) {
					return this.elements.every( callback, this );
				},

				/**
				 * @description iterates each element in Selector and checks that at least one callback returns true.
				 * @param {Function} callback function callback( item, index, array ):Boolean
				 */
				some: function( callback ) {
					return this.elements.some( callback, this );
				}

			};

			return methods;

		},


		//==================================================================
		// Prototype Upgrades
		//==================================================================
		/**
		 * upgrades array prototype and is then deleted
		 * @private
		 */
		upgradeArrayPrototype: function() {

			// forEach JS 1.6 ------------------------------------------
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

			// indexOf JS 1.6 ------------------------------------------
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

			// lastIndexOf JS 1.6 --------------------------------------
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

			// filter JS 1.6 -------------------------------------------
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

			// map JS 1.6 ----------------------------------------------
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

			// some JS 1.6 ---------------------------------------------
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

			// reduce ecma-5 -------------------------------------------
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

			// sortOn (custom) -----------------------------------------
			if ( !Array.prototype.sortOn ) {
				Array.prototype.sortOn = function( property ) {
					return this.sort( lola.array.getSortFunction(property) );
				}
			}

		}


	};

	//update array prototype
	array.upgradeArrayPrototype();
	delete array['upgradeArrayPrototype'];

	//register module
	lola.registerModule( array );

})( lola );

(function( lola ) {
	var $ = lola;
	/**
	 * @description CSS Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var css = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @description cache for fixed/mapped style properties
		 * @private
		 */
		propertyCache: {},

		/**
		 * @description cache for fixed/mapped selectors
		 * @private
		 */
		selectorCache: {},

		/**
		 * @description style property hooks
		 * @private
		 */
		propertyHooks: {},

		/**
		 * @description references to dynamic stylesheets
		 * @private
		 */
		stylesheets: {},

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			console.log( 'lola.css::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization

			//remove initialization method
			delete lola.css.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			console.log( 'lola.css::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization
			lola.support.cssRules = ( (document.styleSheets.length > 0 && document.styleSheets[0].cssRules) || !document.createStyleSheet ) ? true : false;

			//add default stylesheet for dynamic rules
			this.addStyleSheet( "_default" );

			//add default mappings
			this.propertyCache['float'] = (lola.support.cssFloat) ? 'cssFloat' : 'styleFloat';

			//remove initialization method
			delete lola.css.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "css";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * @description returns whether or not an object can have styles applied
		 * @param {*} obj
		 */
		canStyle: function( obj ) {
			//TODO: Implement canStyle function
			return true
		},

		/**
		 * @description gets mapped selector string
		 * @param {String} selector
		 * @return {String}
		 */
		getSelector: function( selector ) {
			if ( !this.selectorCache[selector] )
				this.selectorCache[selector] = lola.string.camelCase( selector );
			return this.selectorCache( selector );
		},

		/**
		 * @description gets mapped selector string
		 * @param {String} property
		 * @return {String}
		 */
		getProperty: function( property ) {
			if ( !this.propertyCache[property] )
				this.propertyCache[property] = lola.string.camelCase( property );
			return this.propertyCache( property );
		},

		/**
		 * @descrtiption gets/sets styles on an object
		 * @public
		 * @param {Object} obj styleable object
		 * @param {String} style style property
		 * @param {*} value leave undefined to get style
		 * @return {*}
		 */
		style: function( obj, style, value ) {
			//make sure style can be set
			if ( lola.css.canStyle( obj ) ) {
				var prop = lola.css.getProperty( style );
				if ( lola.css.propertyHooks[ style ] != null ) {
					return lola.css.propertyHooks[style].apply( obj, arguments );
				}
				else {
					if ( value == undefined ) {
						if (document.defaultView && document.defaultView.getComputedStyle) {
							return document.defaultView.getComputedStyle( obj )[ prop ];
						}
						else if ( typeof(document.body.currentStyle) !== "undefined") {
							return obj["currentStyle"][prop];
						}
						else {
							return obj.style[prop];
						}
					}
					else {
						return obj.style[ prop ] = value;
					}
				}
			}

			return false;
		},

		/**
		 * @description adds a stylesheet to the document head with an optional source
		 * @param {String|undefined} id reference id for stylesheet
		 * @param {String|undefined} source url for external stylesheet
		 */
		addStyleSheet: function( id, source ) {
			var stylesheet = (lola.support.cssRules) ? document.createElement( 'style' ) : document.createStyleSheet();
			if (source) {
				stylesheet.source = source;
			}
			if (id) {
				this.registerStyleSheet( stylesheet, id );
			}
			lola('head').appendChild( stylesheet );
		},

		/**
		 * @description registers a stylesheet with the css module
		 * @param {Node} stylesheet stylesheet object reference
		 * @param {String} id the id with which to register stylesheet
		 */
		registerStyleSheet: function( stylesheet, id ) {
			this.stylesheets[ id ] = stylesheet;
		},

		/**
		 * @description adds a selector to a stylesheet
		 * @param {String} selector
		 * @param {Object} styles an object containing key value pairs of style properties and values
		 * @param {String|Object|undefined} stylesheet registered stylesheet id or stylesheet reference
		 * @return {Object}
		 */
		addSelector: function( selector, styles, stylesheet ) {
			if (lola.type.get(stylesheet) == "string" ){
				stylesheet = this.stylesheets["_default"];
			}
			stylesheet = stylesheet || this.stylesheets["_default"];
			styles = styles || [];

			var ri = lola.support.cssRules ? stylesheet.cssRules.length : stylesheet.rules.length;
			if ( stylesheet.addRule )
				stylesheet.addRule( selector, null, ri );
			else
				stylesheet.insertRule( selector + ' { }', ri );

			var rule = lola.support.cssRules ? stylesheet.cssRules[ri] : stylesheet.rules[ri];
			if ( styles ){
				var props = styles.keys();
				props.forEach( function( item ){
					lola.css.style( rule, item, styles[item] );
				});
			}

			return rule;
		},
		/**
		 * @description performs action on matching rules
		 * @param {String} selector
		 * @param {Function} action
		 * @param {String} media
		 */
		performRuleAction: function( selector, action, media ) {
			selector = selector.toLowerCase();
			media = media ? media.toLowerCase() : '';
			for ( var si = 0; si < document.styleSheets.length; si++ ) {
				var ss = document.styleSheets[si];
				//match media
				if ( !media || media == ss.mediaText ) {
					var rules = (lola.support.cssRules) ? ss.cssRules : ss.rules;
					for ( var ri in rules ) {
						if ( rules[ri] && rules[ri].selectorText ) {
							if ( rules[ri].selectorText.toLowerCase() == selector ) {
								console.info( 'matched rule: ' + rules[ri].selectorText );
								action( si, ri );
							}
						}
					}
				}
			}
		},

		/**
		 * @description returns an array of matching rules
		 * @param {String} selector
		 * @param {String} media
		 * @return {Array}
		 */
		getRules: function( selector, media ) {
			var rules = [];
			lola.css.performRuleAction( selector, function( si, ri ) {
				if ( lola.support.cssRules )
					rules.push( document.styleSheets[ si ].cssRules[ ri ] );
				else
					rules.push( document.styleSheets[ si ].rules[ ri ] );
			}, media );
			return rules;
		},

		/**
		 * @description updates rules in matching selectors
		 * @param {String} selector
		 * @param {Object} styles an object containing key value pairs of style properties and values
		 * @param {String} media
		 * @return {Array}
		 */
		updateRules: function( selector, styles, media ) {
			var rules = lola.css.getRules( selector, media );
			var props = styles.keys();
			props.forEach( function( item ){
				rules.forEach( function( rule ){
					lola.css.style( rule, item, styles[item] );
				});
			});

			return rules;
		},

		/**
		 * @description deletes matching rules
		 * @param selector
		 * @param media
		 */
		deleteRules: function( selector, media ) {
			lola.css.performRuleAction( selector, function( si, ri ) {
				if ( lola.support.cssRules )
					document.styleSheets[ si ].deleteRule( ri );
				else
					document.styleSheets[ si ].removeRule( ri );
			}, media )
		},

		/**
		 * @description gets or sets an objects classes
		 * @param {Node} obj
		 * @param {String|Array|undefined} classes leave undefined to get classes
		 * @return {Array}
		 */
		classes: function( obj, classes ) {
			if ( classes != undefined ) {
				if ( lola.type.get( classes ) != 'array' ) {
					if ( lola.type.get( classes ) == 'string' )
						classes = [classes];
					else
						classes = [];
				}

				obj.className = classes.join( " " );
				return classes;

			}
			else {
				var names = obj.className.replace( lola.regex.extraSpace, " " );
				return names.split( " " ).reverse();
			}
		},

		/**
		 * @description returns
		 * @param obj
		 * @param className
		 */
		hasClass: function( obj, className ) {
			var names = lola.css.classes( obj );
			return lola.array.isIn( names, className );
		},

		/**
		 * @description adds class to object if not already added
		 * @param {Node} obj
		 * @param {String} className
		 */
		addClass: function( obj, className ) {
			var names = lola.css.classes( obj );
			if ( !lola.array.isIn( names, className ) ) {
				names.push( className );
				lola.css.classes( obj, names );
			}
		},

		/**
		 * @description removes a class from an object
		 * @param {Node} obj
		 * @param {String} className
		 */
		removeClass: function( obj, className ) {
			var names = lola.css.classes( obj );
			var index = names.indexOf( className );
			if ( index >= 0 ) {
				names.splice( index, 1 );
				lola.css.classes( obj, names );
			}
		},

		/**
		 * @description removes an objects style property
		 * @param obj
		 * @param style
		 */
		clearStyle: function( obj, style ) {
			delete obj.style[ lola.css.getProperty( style ) ];
		},

		/**
		 * @description parses an RGB or RGBA color
		 * @param {String} val
		 */
		parseRGBColor: function( val ) {
			var rgba = { r:0, g:0, b:0, a:1 };
			var parts = val.match( lola.type.rIsRGBColor );
			if ( parts != null ) {
				var v = parts[1].replace( /\s+/g, "" );
				v = v.split( ',' );
				rgba.r = lola.css.parseColorPart( v[0], 255 );
				rgba.g = lola.css.parseColorPart( v[1], 255 );
				rgba.b = lola.css.parseColorPart( v[2], 255  );
				rgba.a = (v.length > 3) ? lola.css.parseColorPart( v[3], 1 ) : 1;
			}
			return rgba;
		},

		/**
		 * @description parses an HSL or HSLA color
		 * @param {String} val
		 * @return {Object}
		 */
		parseHSLColor: function( val ) {
			var hsla = { h:0, s:0, l:0, a:1 };
			var parts = val.match( lola.type.rIsHSLColor );
			if ( parts != null ) {
				var v = parts[1].replace( /\s+/g, "" );
				v = v.split( ',' );
				hsla.h = lola.css.parseColorPart( v[0], 360  );
				hsla.s = lola.css.parseColorPart( v[1], 1  );
				hsla.l = lola.css.parseColorPart( v[2], 1  );
				hsla.a = (v.length > 3) ? lola.css.parseColorPart( v[3], 1 ) : 1;
			}
			return hsla;
		},

		/**
		 * @description parses color part value
		 * @private
		 * @param {String} val
		 * @return {Number}
		 */
		parseColorPart: function( val, divisor ) {
			if ( val ) {
				if ( val.indexOf( '%' ) > 0 )
					return parseFloat( val.replace( /%/g, "" ) ) / 100;
				else
					return parseFloat( val ) / divisor;
			}
			return 0;

		},


		//==================================================================
		// Classes
		//==================================================================
		Color: function( value ){
			return this.init( value );
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
				/**
				 * @description sets or gets element css property
				 * @param {String} property
				 * @param {*} value
				 */
				css: function( property, value ) {
					if ( value != undefined ) {
						this.foreach( function( item ) {
							lola.css.style( item, selector, value );
						} );
						return this;
					}
					else {
						var values = [];
						this.forEach( function(item){
							values.push( lola.css.style( item, property ) )
						});
						return values;
					}
				},

				/**
				 * @description sets or gets classes for elements
				 * @param {String|Array|undefined} values
				 */
				classes: function( values ) {
					if ( values != undefined ) {
						//set class names
						this.foreach( function( item ) {
							lola.css.classes( item, values );
						} );
						return this;

					}
					else {
						//get class names
						var names = [];
						this.foreach( function( item ) {
							names.push( lola.css.classes( item ) );
						} );

						return names;
					}
				},

				/**
				 * @description checks that all elements in selector have class
				 * @param {String} name
				 */
				hasClass: function( name ) {
					var check = true;
					this.foreach( function( item ) {
						if (!lola.css.hasClass( item, name )){
							check = false;
						}
					} );
					return check;
				},

				/**
				 * @description adds class to all elements
				 * @param {String} name
				 */
				addClass: function( name ) {
					this.foreach( function( item ) {
						lola.css.addClass( item, name );
					} );
					return this;
				},

				/**
				 * @description removes class from all elements
				 * @param {String} name
				 */
				removeClass: function( name ) {
					this.foreach( function( item ) {
						lola.css.removeClass( item, name );
					} );
					return this;
				}

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
	css.Color.prototype = {

		/**
		 * @description output color type
		 * @private
		 */
		outputType: "",

		/**
		 * @description hex color value object
		 * @public
		 */
		hexValue: null,

		/**
		 * @description rgba color value object
		 * @public
		 */
		rgbValue: null,

		/**
		 * @description hsla color value object
		 * @public
		 */
		hslValue: null,

		/**
		 * @description class initialization function
		 * @param value
		 */
		init: function( value ){
			if (value) this.parseString( value );
			return this;
		},

		/**
		 * @description parses style color values returns rgba object
		 * @public
		 * @param {String} val
		 */
		parseString: function( val ) {
			//console.info('parseColor ------ ');
			var cparts = val.match( lola.regex.isColor );
			if ( cparts ) {
				var parts,rgb,hsl,hex;
				switch ( cparts[1] ) {
					case '#':
						parts = val.match( lola.regex.isHexColor );
						hex = ( parts != null ) ? parts[1] : "000000";
						rgb = lola.math.color.hex2rgb(hex);
						hsl = lola.math.color.rgb2hsl(rgb.r,rgb.g,rgb.b);
						rgb.a = hsl.a = 1;
						break;
					case 'rgb':
					case 'rgba':
						rgb = lola.css.parseRGBColor( val );
						hsl = lola.math.color.rgb2hsl(rgb.r,rgb.g,rgb.b);
						hex = lola.math.color.rgb2hex(rgb.r,rgb.g,rgb.b);
						hsl.a = rgb.a;
						this.valueType = "rgba";
						break;
					case 'hsl':
					case 'hsla':
						hsl = lola.css.parseHSLColor( val );
						rgb = lola.math.color.hsl2rgb(hsl.h,hsl.s,hsl.l);
						hex = lola.math.color.rgb2hex(rgb.r,rgb.g,rgb.b);
						rgb.a = hsl.a;
						this.valueType = "hsla";
						break;
				}

				this.hexValue = hex;
				this.rgbValue = rgb;
				this.hslValue = hsl;
			}
		},

		/**
		 * @description outputs a css color string of the type specified in outputType
		 * @return {String}
		 */
		toString: function() {
			switch (this.outputType) {
				case "#":
					return this.toHexString();
				case "hsl":
					return this.toHslString();
				case "hsla":
					return this.toHslaString();
				case "rgb":
					return this.toRgbString();
				default:
					return this.toRgbaString();
			}
		},

		/**
		 * @description returns the uint value of color object
		 * @return {uint}
		 */
		toInt: function() {
			return parseInt("0x" + this.hexValue );
		},

		/**
		 * @description outputs a css color hex string
		 * @return {String}
		 */
		toHexString: function() {
			return "#" + this.hexValue;
		},

		/**
		 * @description outputs a css color hsl string
		 * @return {String}
		 */
		toHslString: function() {
			return "hsl("+
					Math.round( this.hslValue.h * 360 )+","+
					Math.round( this.hslValue.s * 100 )+"%,"+
					Math.round( this.hslValue.l * 100 )+"%)";
		},

		/**
		 * @description outputs a css color hsla string
		 * @return {String}
		 */
		toHslaString: function() {
			return "hsla("+
					Math.round( this.hslValue.h * 360 )+","+
					Math.round( this.hslValue.s * 100 )+"%,"+
					Math.round( this.hslValue.l * 100 )+"%,"+
					this.hslValue.a+"%)";
		},

		/**
		 * @description outputs a css color rgb string
		 * @return {String}
		 */
		toRgbString: function() {
			return "rgb("+
					Math.round( this.rgbValue.r * 255 )+","+
					Math.round( this.rgbValue.g * 255 )+","+
					Math.round( this.rgbValue.b * 255 )+")";
		},

		/**
		 * @description outputs a css color rgba string
		 * @return {String}
		 */
		toRgbaString: function() {
			return "rgba("+
					Math.round( this.rgbValue.r * 255 )+","+
					Math.round( this.rgbValue.g * 255 )+","+
					Math.round( this.rgbValue.b * 255 )+","+
					this.rgbValue.a+")";
		}
	};

	//register module
	lola.registerModule( css );

})( lola );
(function( lola ) {
	var $ = lola;
	/**
	 * @description Data Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var data = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @description cache for all data storage
		 * @private
		 */
		cache: {},

		/**
		 * @description uid for data references
		 * @private
		 */
		uid: 1,

		/**
		 * @description attribute for data storage uid
		 * @private
		 */
		cachIDProp: "LOLA-DATA-UID",

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.data::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization
			lola.safeDeleteHooks.push( {scope:this, fn:this.remove} );

			//remove initialization method
			delete lola.data.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.data::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.data.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "data";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ["support"];
		},

		/**
		 * @description get next data uid
		 * @return {int}
		 * @private
		 */
		nextUid: function() {
			return lola.data.uid++;
		},

		/**
		 * @description links element with data cache
		 * @param {Object} object
		 * @param {Boolean|undefined} create defaults to true,
		 * set to false to prevent creating a cache if one doesn't already exist
		 */
		getCacheId: function( object, create ) {
			create = (create == undefined) ? true : create;
			//assume if create cache is being called that ther is no cache
			var cacheId = lola.dom.attr( object, lola.data.cacheIDProp );
			if ( cacheId == null ) {
				switch ( lola.type.get( object ) ) {
					case 'function':
					case 'object':
						cacheId = object[lola.data.cacheIDProp];
						if ( cacheId == null && create ) {
							cacheId = lola.data.nextUid();
							object[lola.data.cacheIDProp] = cacheId;
						}
						break;
					case 'applet':
					case 'embed':
					case 'number':
					case 'date':
					case 'array':
					case 'boolean':
					case 'regexp':
					case 'string':
					case 'textnode':
					case 'commentnode':
						//not supported
						break;
					case 'htmlobject':
						//TODO: implement special case for flash objects
						break;
					default:
						//get attribute
						cacheId = lola.dom.attr( object, lola.data.cacheIDProp );
						if ( cacheId == null && create ) {
							cacheId = lola.data.nextUid();
							lola.dom.attr( object, lola.data.cacheIDProp, cacheId );
						}
						break;
				}
			}
			return cacheId;
		},

		/**
		 * @description gets an objects data for the specified namespace
		 * @param {Object} object the object for which to retrieve data
		 * @param {String} namespace the namespace to retrieve
		 * @param {Boolean|undefined} create namespace data for object if not found,
		 * defaults to false
		 */
		get: function( object, namespace, create ) {
			var cacheId = lola.data.getCacheId( object, false );

			if ( lola.data.cache[namespace] == null || cacheId == null ) {
				if (create) {
					return lola.data.set( object, {}, namespace, false );
				}
				else {
					return null;
				}
			}
			else
				return lola.data.cache[namespace][cacheId];
		},

		/**
		 * @description gets data for entire namespace
		 * @param {String} namespace the namespace to get from data cache
		 */
		getNamespaceData: function( namespace ) {
			return lola.data.cache[namespace];
		},

		/**
		 * @description replaces/updates existing object data
		 * @param {Object} object
		 * @param {Object} data
		 * @param {String} namespace namespace to put data
		 * @param {Boolean|undefined} overwite overwite existing data, defaults to false
		 */
		set: function( object, data, namespace, overwite ) {
			//console.info( 'lola.data.set: ' + object + "::" + namespace + ' replace=' + replace );
			//check for existing cache
			var cacheId = lola.data.getCacheId( object, true );

			if ( lola.data.cache[namespace] == null )
				lola.data.cache[namespace] = {};

			if ( overwite || lola.data.cache[namespace][cacheId] == null )
				lola.data.cache[namespace][cacheId] = data;
			else
				lola.extend( lola.data.cache[namespace][cacheId], data, true );

			return lola.data.cache[namespace][cacheId];
		},

		/**
		 * @description removes object data
		 * @param {Object} object
		 * @param {String|undefined} namespace namespace to remove data,
		 * removes data from all namespaces if undefined
		 * @param {Boolean|undefined} recurse recurse childNodes to delete data
		 */
		remove: function( object, namespace, recurse ) {
			//console.info( 'lola.data.remove: ' + object + "::" + namespace );
			//remove object data
			var cacheId = lola.data.getCacheId( object, false );
			if ( cacheId ) {
				if ( namespace == null || namespace == undefined ) {
					namespace = [];
					for ( var ns in lola.data.cache ) {
						namespace.push( ns );
					}
				}
				else {
					if ( lola.type.get(namespace) != "array" )
						namespace = [namespace];
				}

				namespace.forEach( function( nsp ) {
					delete lola.data.cache[nsp][cacheId];
				} )

			}

			if ( recurse ) {
				if ( object.childNodes ) {
					object.childNodes.forEach( function( item ) {
						lola.data.remove( item, namespace, true );
					} )
				}
			}

		},



		//==================================================================
		// Selector Methods
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

				/**
				 * @description get data for elements
				 * @param {String} namespace
				 * @param {Boolean|undefined} create create data object if null
				 * @return {Array}
				 */
				getData: function( namespace, create ) {
					var data = [];
					this.forEach( function( item ) {
						data.push( lola.data.get( item, namespace, create ) )
					} );
					return data;
				},

				/**
				 * @description put data for elements
				 * @param {Object} data data to put in cache for elements (overwrites)
				 * @param {String} namespace
				 * @return {lola.Selector}
				 */
				putData: function( data, namespace ) {
					this.forEach( function( item ) {
						lola.data.set( item, data, namespace, true );
					} );
					return this;
				},

				/**
				 * @description updates data for elements
				 * @param {Object} data
				 * @param {String} namespace
				 * @return {lola.Selector}
				 */
				updateData: function( data, namespace ) {
					this.forEach( function( item ) {
						//clear data
						lola.data.set( item, data, namespace, false );
					} );
					return this;
				},

				/**
				 * @description remove specified namespaces from data cache
				 * @param {Array|String|undefined} namespace
				 * @param {Boolean|undefined} recurse recurse childNodes, defaults to false
				 * @return {lola.Selector}
				 */
				removeData: function( namespace, recurse ) {
					this.forEach( function( item ) {
						//clear data
						lola.data.remove( item, namespace, recurse );
					} );
					return this;
				},

				/**
				 * @description remove specified namespaces from data cache
				 * @param {Boolean|undefined} recurse recurse childNodes, defaults to false
				 * @return {lola.Selector}
				 */
				removeAllData: function( recurse ) {
					return this.removeData( null, recurse );
				}
			};

			return methods;

		}



	};


	//register module
	lola.registerModule( data );

})( lola );
(function( lola ) {
	var $ = lola;
	/**
	 * @description DOM Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var dom = {

		//==================================================================
		// Attributes
		//==================================================================

		/**
		 * @description map of attribute getter/setter hooks
		 * @private
		 * @type {Array}
		 */
		attributeHooks: {},

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.dom::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization

			//remove initialization method
			delete lola.dom.initialize;


		},
		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "dom";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},


		/**
		 * @description sets or gets an node attribute
		 * @param {Object} object the object on which to access the attribute
		 * @param {String} name the name of the attribute
		 * @param {*} value (optional) value to set
		 */
		attr: function( object, name, value ) {
			if ( this.attributeHooks[name] ) {
				return this.attributeHooks[name].apply( object, arguments );
			}
			else {
				if ( value || value == "") {   //set value
					//TODO: Replace this type check with isPrimitive after implementing lola.type
					if (typeof value == "string" || typeof value == "number" || typeof value == "boolean") {
						return object[name] = value;
					}
					else {
						throw new Error('attribute values must be primitives');
					}
				}
				else {
					return object[name];
				}
			}
		},

		/**
		 * @description deletes expando properties
		 * @param {Object} object
		 * @param {String} name
		 */
		deleteExpando: function( object, name ) {
			if ( lola.support.deleteExpando )
				delete object[name];
			else
				object[name] = null;
		},

		//------------------------------------------------------------------
		// isDescendant - determines if a is descendant of b
		//------------------------------------------------------------------
		/**
		 * @description determines if element a is descendant of element b
		 * @param {Node} a
		 * @param {Node} b
		 */
		isDescendant: function ( a, b ) {
			return lola.dom.isAncestor( b, a );
		},

		/**
		 * @description determines if element a is an ancestor of element b
		 * @param {Node} a
		 * @param {Node} b
		 */
		isAncestor: function ( a, b ) {
			var ancestor = b;
			while ( ancestor && (ancestor = ancestor.parentNode) && ancestor.nodeName != "BODY" ) {
				if (a == ancestor) return true;
			}
			return false;
		},



		//==================================================================
		// Selector Methods
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

				/**
				 * @description  gets sub selection
				 * @return {lola.Selector}
				 */
				find: function( selector ) {
					var $instance = $([]);
					this.forEach( function(item){
						var $tmp = $(selector, item);
						$instance.concat( $tmp );
					});

					return $instance;
				},

				/**
				 * @description  generation selection
				 * @return {lola.Selector}
				 */
				generation: function( count ) {
					if (!count)
						count = 1;

					var $instance = $([]);
					this.forEach( function(item){
						var ancestor = item;
						var index = 0;
						while( ancestor = ancestor.parentNode && index < count ){
							index++;
						}
						if (ancestor)
							$instance.concat( [ancestor] );
					});

					return $instance;
				},

				/**
				 * @description  sets or gets html on elements
				 * @return {lola.Selector|Array}
				 */
				html: function( content ) {
					if ( arguments.length == 0 ) {
						var values = [];
						this.forEach( function( item ) {
							values.push( (item) ? item.innerHTML : null );
						} );
						return values;
					}
					else {
						this.forEach( function( item ) {
							for ( var child in item.childNodes ) {
								lola.safeDelete( child );
							}
							switch ( lola.type.get( content ) ) {
								case 'null':
								case 'undefined':
									item.innerHTML = "";
									break;
								case 'string':
									item.innerHTML = content;
									break;
								case 'array':
									item.innerHTML = "";
									for ( var c in content ) {
										item.appendChild( c );
									}
									break;
								default:
									console.info( item );
									console.info( content );
									item.innerHTML = "";
									item.appendChild( content );
									break;
							}
						} );
						return this;
					}
				},

				/**
				 * @description  appends node to first selection element in DOM
				 * @param {Element} node
				 * @return {lola.Selector}
				 */
				appendChild: function( node ) {
					if ( this.elements.length > 0 ) {
						this.get().appendChild( node );
					}

					return this;
				},

				/**
				 * @description  prepends node to first selection element in DOM
				 * @param {Element} node
				 * @return {lola.Selector}
				 */
				prependChild: function( node ) {
					if ( this.elements.length > 0 ) {
						this.get().insertBefore( node, this.get().firstChild );
					}

					return this;
				},

				/**
				 * @description  clones first selection element
				 * @param {Boolean} deep
				 * @return {Element}
				 */
				cloneNode: function( deep ) {
					if ( this.elements.length > 0 ) {
						return this.get().cloneNode( deep );
					}
					return null;
				},

				/**
				 * @description  inserts node before first element in DOM
				 * @param {Element} node
				 * @return {lola.Selector}
				 */
				insertBefore: function( node ) {
					if ( this.elements.length > 0 ) {
						this.get().insertBefore( node );
					}
					return this;
				},

				/**
				 * @description  removes node from first element in DOM
				 * @param {Element} node
				 * @return {lola.Selector}
				 */
				removeChild: function( node ) {
					if ( this.elements.length > 0 ) {
						lola.safeDelete( node );
						this.get().removeChild( node );
					}
					return this;
				},

				/**
				 * @description  replaces node in first element in DOM
				 * @param {Element} newChild
				 * @param {Element} oldChild
				 * @return {lola.Selector}
				 */
				replaceChild: function( newChild, oldChild ) {
					if ( this.elements.length > 0 ) {
						lola.safeDelete( oldChild );
						//TODO: check if call to below line is needed
						//lola.data.destroyCache( oldChild, true );
						this.get().replaceChild( newChild, oldChild );
					}
					return this;
				},

				/**
				 * @description  sets or gets attributes
				 * @param {String} name
				 * @param {*} value
				 * @return {lola.Selector|Array}
				 */
				attr: function( name, value ) {
					if ( value != undefined ) {
						this.forEach( function( item ) {
							lola.dom.attr( item, name, value );
						} );
						return this;
					}
					else {
						var values = [];
						this.forEach( function( item ) {
							values.push( lola.dom.attr( item, name ) );
						} );
						return values;
					}
				},

				/**
				 * @description  removes attribute from elements
				 * @param {String} name
				 * @return {lola.Selector}
				 */
				removeAttr: function( name ) {
					this.forEach( function( item ) {
						item.removeAttribute( name );
					} );
					return this;
				},

				/**
				 * @description  sets new parent elements
				 * @param {String} newParent
				 * @return {lola.Selector|Array}
				 */
				parent: function( newParent ) {
					if ( newParent != undefined ) {
						this.forEach(function(item){
							$(newParent).appendChild( item );
						});
						return this;
					}
					else {

						var values = [];
						this.forEach( function( item ) {
							values.push( item?item.parentNode:null );
						} );
						return values;
					}
				},

				/**
				 * @description  deletes expando property on elements
				 * @param {String} name
				 * @return {lola.Selector}
				 */
				deleteExpando: function( name ) {
					this.forEach( function( item ) {
						lola.deleteExpando( item, name );
					} );
					return this;
				}



			};

			return methods;

		}

	};


	//register module
	lola.registerModule( dom );

})( lola );

(function( lola ) {
	var $ = lola;
	/**
	 * @description Event Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var event = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @description event maping
		 * @private
		 * @type {Object}
		 */
		map: { 'mousewheel':['mousewheel','DOMMouseScroll'] },

		/**
		 * @description event hooks
		 * @private
		 * @type {Object}
		 */
		hooks: {},

		/**
		 * @description event listener uid
		 * @type {int}
		 */
		uid: 0,



		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.event::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.event.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.event::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.event.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "event";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},


		/**
		 * @description add a framework event listener
		 * @param {Object} target
		 * @param {String} type
		 * @param {Function} handler
		 * @param {Boolean|undefined} useCapture
		 * @param {uint|undefined} priority default 0xFFFFFF
		 * @param {Object|undefined} scope
		 */
		addListener: function( target, type, handler, useCapture, priority, scope ) {
			var required = [['target',target],['type',type],['handler',handler]];
			var info = [target,'type: '+type,'useCapture: '+useCapture];
			if ( lola.checkArgs('ERROR: lola.event.addListener( '+type+' )', required, info) ){
				if (lola.event.hooks[type] != null){
					return lola.event.hooks[type]['addListener'].call( lola.event.hooks[type], target, type, handler, useCapture, priority, scope );
				}
				else {
					var data = lola.data.get( target, lola.event.dataNs );
					if ( !data ) {
						data = { capture:{}, bubble:{} };
						lola.data.set( target, data, lola.event.dataNs, true );
					}

					var phase = lola.event.phaseString( target, useCapture );
					priority = priority || 0xFFFFFF;
					scope = scope || target;

					//assign handler a uid so it can be easily referenced
					if ( handler.uid == null )
						handler.uid = lola.event.uid++;
					var uid = handler.uid;

					if ( data[phase][type] == null )
						data[phase][type] = {};

					data[phase][type][uid] = {priority:priority, huid:uid, handler:handler, scope:scope };


					//since duplicate dom listeners are discarded just add listener every time
					// function checks if event listener can actually be added
					if ( phase == 'capture' )
						lola.event.addDOMListener( target, type, lola.event.captureHandler, true );
					else
						lola.event.addDOMListener( target, type, lola.event.bubbleHandler, false );

					return uid;
				}
			}
		},

		/**
		 * @description remove a framework event listener
		 * @param {Object} target
		 * @param {String} type
		 * @param {Function} handler
		 * @param {Boolean|undefined} useCapture
		 */
		removeListener: function( target, type, handler, useCapture ) {
			var required = [['target',target],['type',type],['handler',handler]];
			var info = [target,'type: '+type,'useCapture: '+useCapture];
			if ( lola.checkArgs('ERROR: lola.event.removeListener( '+type+' )', required, info) ){
				if (lola.event.hooks[type] != null){
					lola.event.hooks[type]['removeListener'].call( lola.event.hooks[type], target, type, handler, useCapture );
				}
				else {
					var data = lola.data.get( target, lola.event.dataNs );
					if ( !data ) data = { capture:{}, bubble:{} };

					var phase = lola.event.phaseString( target, useCapture );

					//get handler uid
					var uid = lola.type.get( handler ) == 'function' ? handler.uid : handler;

					delete data[phase][type][uid];

					//if there are no more listeners in stack remove handler
					// function checks if event listener can actually be removed
					if ( Object.keys( data[phase][type] ).length == 0 ) {
						if ( phase == 'capture' )
							lola.event.removeDOMListener( target, type, lola.event.captureHandler, true );
						else
							lola.event.removeDOMListener( target, type, lola.event.bubbleHandler, false );

					}
				}
			}
		},


		/**
		 * @description removes all listeners associated with handler
		 * @param {String|Array} types
		 * @param {Function} handler
		 * @param {Boolean|undefined} useCapture
		 */
		removeHandler: function( handler, types, useCapture ) {
			//console.info( 'lola.event.removeHandler: '+type+' '+capture );
			var required = [['handler',handler]];
			var info = [];
			if ( lola.checkArgs('ERROR: lola.event.removeHandler', required, info) ){
				//get handler uid
				var uid = lola.type.get( handler ) == 'function' ? handler.uid : handler;

				//get event data
				var data = lola.data.getNamespace( lola.event.dataNs );
				if ( data ) {
					var ctypes = (useCaputure == undefined) ? ['capture','bubble'] : useCapture ? ['capture'] : ['bubble'];
					//iterate data
					for ( var oid in data ) {
						if ( types != undefined )
							types = lola.type.get( types ) == 'array' ? types : [types];
						for ( var phase in ctypes ) {
							var type;
							if ( types ) {
								for ( type in types ) {
									if ( data[oid][phase][type] )
										delete  data[oid][phase][type][uid];
								}
							}
							else {
								for ( type in data[oid][phase] ) {
									delete  data[oid][phase][type][uid];
								}
							}
							//rempve DOM listener if needed
							if ( Object.keys( data[oid][phase][type] ).length == 0 )
								lola.event.removeDOMListener( target, type, (phase == 'capture') ? lola.event.captureHandler : lola.event.bubbleHandler, (phase == 'capture') );
						}
					}
				}
			}
		},

		/**
		 * @description internal capture listener
		 * @param {Object} event
		 * @private
		 */
		captureHandler: function( event ) {
			event = event || lola.window.event;
			lola.event.handler( event, 'capture' )
		},

		/**
		 * @description internal bubble listener
		 * @param {Object} event
		 * @private
		 */
		bubbleHandler: function( event ) {
			event = event || lola.window.event;
			lola.event.handler( event, 'bubble' )
		},

		/**
		 * @description internal capture listener
		 * @private
		 * @param {Object} event
		 * @param {String} phase
		 */
		handler: function( event, phase ) {
			//console.info( 'lola.event.handler: '+event.type+' '+phase );
			var e = (event.hasOwnProperty( 'originalEvent' )) ? event : new lola.event.LolaEvent( event );
			var data = lola.data.get( e.currentTarget, lola.event.dataNs );
			if ( data && data[phase] && data[phase][event.type] ) {
				//console.info('    found event');
				var stack = [];
				for ( var uid in data[phase][event.type] ) {
					stack.push( data[phase][event.type][uid] );
				}
				//stack = stack.sort( lola.util.prioritySort );
				stack = stack.sortOn( 'priority' );
				for ( var i in stack ) {
					if ( e._immediatePropagationStopped )
						break;
					var obj = stack[i];
					if ( obj.handler )
						obj.handler.call( obj.scope, e );
					else
						delete data[phase][event.type][obj.huid];
				}
			}
		},

		/**
		 * @description triggers a framework event on an object
		 * @param {Object} object
		 * @param {String} type
		 * @param {Boolean|undefined} bubbles
		 * @param {Boolean|undefined} cancelable
		 * @param {Object|undefined} data
		 */
		trigger: function( object, type, bubbles, cancelable, data ) {
			/*console.group('lola.event.trigger: '+type);
			lola.debug(object);
			console.groupEnd();*/
			var args = [object, type];
			var names = ['target','type'];
			var group = 'lola.event.trigger: type='+type+' bubbles='+bubbles;
			if ( lola.checkArgs(args, names, group) ){
				if ( bubbles == undefined )
					bubbles = true;
				if ( cancelable == undefined )
					cancelable = true;

				var event = type;
				if ( lola.type.get( event ) === 'string' ) {
					event = document.createEvent( "Event" );
					event.initEvent( type, bubbles, cancelable );
					event.data = data;
				}

				if ( object.hasOwnProperty( 'dispatchEvent' ) ) {
					object.dispatchEvent( event );
				}
				else {
					event = new lola.event.LolaEvent( event, object );
					lola.event.handler( event,  'capture' );
					lola.event.handler( event,  'bubble' );
				}
			}
		},

		/**
		 * @description add a DOM event listener
		 * @param {Object} target
		 * @param {String} type
		 * @param {Function} handler
		 * @param {Boolean|undefined} useCapture
		 */
		addDOMListener: function( target, type, handler, useCapture ) {
			//if ( target.hasOwnProperty('nodeType') && (target.nodeType == 1 || target.nodeType == 9)){
			type = lola.event.map[type] ? lola.event.map[type] : [type];
			type.forEach( function(t) {
				try {
					if ( target.addEventListener )
						target.addEventListener( t, handler, useCapture );
					else if ( lola.support.msEvent )
						target.attachEvent( 'on' + t, handler );
					else if ( target['on' + t.toLowerCase()] == null )
						target['on' + type.toLowerCase()] = handler;
				}
				catch( error ) {
					//console.info( 'lola.event.addDOMListener error' );
				}
			} );
			//}
		},

		/**
		 * @description remove a DOM event listener
		 * @param {Object} target
		 * @param {String} type
		 * @param {Function} handler
		 */
		removeDOMListener: function( target, type, handler ) {
			//if ( target.hasOwnProperty('nodeType') && (target.nodeType == 1 || target.nodeType == 9)){
			type = lola.event.map[type] ? lola.event.map[type] : [type];
			type.forEach( function() {
				try {
					if ( target.removeEventListener )
						target.removeEventListener( type, handler, false );
					else if ( lola.support.msEvent )
						target.detachEvent( 'on' + type, handler );
					else if ( target['on' + type.toLowerCase()] == null )
						delete target['on' + type.toLowerCase()];
				}
				catch( error ) {
					//console.info( 'lola.event.removeDOMListener error' );
				}
			} );
			//}
		},

		/**
		 * @description gets the dom target
		 * @param {Object} event
		 * @param {Object} target
		 * @return {Object}
		 */
		getDOMTarget: function( event, target ) {
			if ( event ) {
				if ( event.currentTarget )
					target = event.currentTarget;
				else if ( event.srcElement )
					target = event.srcElement;

				if ( target && target.nodeType == 3 ) // defeat Safari bug
					target = target.parentNode;
			}
			return target;
		},

		/**
		 * @descrtiption returns key code for key events
		 * @param {Event} e
		 * @return {int}
		 */
		getDOMKeycode: function( e ) {
			var code;

			if ( e.keyCode )
				code = e.keyCode;
			else if ( e.which )
				code = e.which;

			return code;
		},

		/**
		 * @description returns key string for key events
		 * @param {Event} e
		 * @return {String}
		 */
		getDOMKey: function( e ) {
			var code;

			if ( e.keyCode )
				code = e.keyCode;
			else if ( e.which )
				code = e.which;

			return String.fromCharCode( lola.event.getDOMKeycode(e) );
		},

		/**
		 * @description returns x,y coordinates relative to document
		 * @param {Event} e
		 * @return {Object}
		 */
		getDOMGlobalXY: function( e ) {
			var xPos = 0;
			var yPos = 0;
			if ( e.pageX || e.pageY ) {
				xPos = e.pageX;
				yPos = e.pageY;
			}
			else if ( e.clientX || e.clientY ) {
				xPos = e.clientX + document.documentElement.scrollLeft + document.body.scrollLeft;
				yPos = e.clientY + document.documentElement.scrollTop + document.body.scrollTop;
			}

			return {x:xPos,y:yPos};
		},

		/**
		 * @description returns actual event phase to use
		 * @param {Object} target
		 * @param {Boolean|undefined} useCapture
		 * @return {String}
		 */
		phaseString: function( target, useCapture ) {
			return ((useCapture && (lola.support.domEvent || lola.support.msEvent)) || (!target.dispatchEvent && !target.attachEvent)) ? 'capture' : 'bubble';
		},

		/**
		 * @description prevent default event action
		 * @param {Event} e
		 * @return {Boolean}
		 */
		preventDefault: function( e )
		{
			e = e ? e : window.event;
			if (e)
			{
				if(e.stopPropagation)
					e.stopPropagation();
				if(e.preventDefault)
					e.preventDefault();

				if(e.stopPropagation)
					e.stopPropagation();
				if(e.preventDefault)
					e.preventDefault();
				e.cancelBubble = true;
				e.cancel = true;
				e.returnValue = false;
			}
			return false;
		},


		//==================================================================
		// Classes
		//==================================================================
		/**
		 * @description LolqEvent class used with internal events
		 * @class
		 * @param {Object} event
		 * @param {Object} target
		 */
		LolaEvent: function( event, target ) {
			return this.init( event, target );
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

				/**
				 * @description adds a framework event listener
				 * @param {String} type
				 * @param {Function} handler
				 * @param {Boolean|undefined} useCapture
				 * @param {uint|undefined} priority
				 * @param {Object|undefined} scope
				 */
				addListener: function( type, handler, useCapture, priority, scope ) {
					this.forEach( function( item ) {
						lola.event.addListener( item, type, handler, useCapture, priority, scope );
					} );

					return this;
				},

				/**
				 * @description removes a framework event listener
				 * @param {String} type
				 * @param {Function} handler
				 * @param {Boolean|undefined} useCapture
				 */
				removeListener: function( type, handler, useCapture ) {
					this.forEach( function( item ) {
						lola.event.removeListener( item, type, handler, useCapture );
					} );

					return this;
				},

				/**
				 * @description removes all listeners associated with handler
				 * @param {Function} handler
				 * @param {Array|undefined} types event types to remove for handler, undefined removes all
				 * @param {String|undefined} phase
				 */
				removeHandler: function( handler, types, phase ) {
					this.forEach( function( item ) {
						lola.event.removeHandler( item, handler, types, phase );
					} );

					return this;
				},

				/**
				 * @description triggers an framework event on an object
				 * @param {String} type
				 * @param {Boolean|undefined} bubbles
				 * @param {Boolean|undefined} cancelable
				 * @param {Object|undefined} data
				 */
				trigger: function( type, bubbles, cancelable, data ) {
					this.forEach( function( item ) {
						lola.event.trigger( item, type, bubbles, cancelable, data );
					} );

					return this;
				}
			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
	event.LolaEvent.prototype = {

		/**
		 * @description reference to original event
		 * @type {Event}
		 */
		originalEvent: null,

		/**
		 * @description flag for propagation stopped
		 * @type {Boolean}
		 * @private
		 */
		propagationStopped: false,

		/**
		 * @description flag for immediate propagation stopped
		 * @type {Boolean}
		 * @private
		 */
		immediatePropagationStopped: false,

		/**
		 * @description event's target
		 * @type {Object}
		 */
		target: null,

		/**
		 * @description event's currentTarget
		 * @type {Object}
		 */
		currentTarget: null,

		/**
		 * @description global x position (Mouse/Touch Events)
		 * @type {Number}
		 */
		globalX: null,

		/**
		 * @description global y position (Mouse/Touch Events)
		 * @type {Number}
		 */
		globalY: null,

		/**
		 * @description key code for Key Events
		 * @type {int}
		 */
		key: null,

		/**
		 * @description class initializer
		 * @param {Event} event
		 * @param {Object} target
		 */
		init: function( event, target ) {
			lola.extend( this, event, false, false );
			this.originalEvent = event;
			if ( target ) {
				this.target = target;
			}
			this.currentTarget = lola.event.getDOMTarget( event, target );
			var gpos = lola.event.getDOMGlobalXY( event );
			this.globalX = gpos.x;
			this.globalY = gpos.y;

			this.key = lola.event.getDOMKey( event );

			return this;
		},

		/**
		 * @description prevents an events default behavior
		 */
		preventDefault: function(){
			this.originalEvent.preventDefault();
		},

		/**
		 * @description stops event propagation
		 */
		stopPropagation: function(){
			this.originalEvent.stopPropagation();
			this.propagationStopped = true;
		},

		/**
		 * @description stops immediate event propagation
		 */
		stopImmediatePropagation: function(){
			this.originalEvent.stopImmediatePropagation();
			this.immediatePropagationStopped = true;
		}

	};


	//==================================================================
	// Hooks
	//==================================================================

	/**
	 * @description delayed hover intent event hook
	 * @event hover
	 */
	event.hooks['hover'] = {
		event: 'hoverConfirmed',
		getData: function( target ){
			var ns = 'eventHover';
			var wait = lola.dom.attr( target, "hoverDelay" );
			wait = (wait == null || wait == undefined) ? 250 : parseInt(wait);
			var data = lola.data.get( target, ns );
			if ( !data ) {
			    data = { hasIntent:false, wait:wait, timeout:-1 };
			    lola.data.set( target, data, ns, true );
			}
			return data;
		},
		mouseOver: function( event ){
			//lola.debug('hover.mouseover');
			lola.event.addListener( event.currentTarget, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( event.currentTarget );
			data.hasIntent = true;
			if (data.timeout < 0)
				data.timeout = setTimeout( lola.event.hooks.hover.confirm, data.wait, event.currentTarget )
		},
		mouseOut: function( event ){
			//lola.debug('hover.mouseout')
			lola.event.removeListener( event.currentTarget, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( event.currentTarget );
			data.hasIntent = false;
		},
		confirm: function( target ){
			//lola.debug('hover.confirm')
			lola.event.removeListener( target, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( target );
			data.timeout = -1;
			if (data.hasIntent){
				lola.event.trigger( target, lola.event.hooks.hover.event );
			}
		},
		addListener: function( target, type, handler, useCapture, priority, scope ){
			var uid = lola.event.addListener( target, lola.event.hooks.hover.event, handler, useCapture, priority, scope );
			lola.event.hooks.hover.getData( target );
			lola.event.addListener( target, 'mouseover', lola.event.hooks.hover.mouseOver );
			return uid;
		},
		removeListener: function( target, type, handler, useCapture ){
			var edata = lola.data.get( target, lola.event.dataNs );
			lola.event.removeListener(target, lola.event.hooks.hover.event, handler, useCapture );
			var phase = lola.event.phaseString( target, useCapture );
			if (edata[phase][lola.event.hooks.hover.event] == null || Object.keys(edata[phase][lola.event.hooks.hover.event]).length == 0){
				lola.event.removeListener( target, 'mouseover', lola.event.hooks.hover.mouseOver );
				lola.data.remove( target, 'eventHover' );
			}
		}
	};

	/**
	 * @description mouse enter state event
	 * @event mouseenterstate
	 */
	event.hooks['mouseenterstate'] = {
		e1: 'domouseenter',
		e2: 'domouseleave',
		getData: function( target ){
			var ns = 'eventMouseEnterState';
			var data = lola.data.get( target, ns );
			if ( !data ) {
			    data = { within:false };
			    lola.data.set( target, data, ns, true );
			}
			return data;
		},
		getEnhancedType: function( type ){
			if (!lola.support.msEvent) {
				type = 'do'+type;
			}
			return type;
		},
		mouseOver: function( event ){
			var data = lola.event.hooks.mouseenterstate.getData( event.currentTarget );
			if (!data.within && event.currentTarget != event.relatedTarget){
				data.within = true;
				lola.event.trigger( event.currentTarget, lola.event.hooks.mouseenterstate.e1, false );
			}
		},
		mouseOut: function( event ){
			var data = lola.event.hooks.mouseenterstate.getData( event.currentTarget );
			if ( data.within &&
					!lola.util.isAncestor( event.currentTarget, event.relatedTarget ) &&
					event.currentTarget != event.relatedTarget ){
				data.within = false;
				lola.event.trigger( event.currentTarget, lola.event.hooks.mouseenterstate.e2, false );
			}
		},
		addListener: function( target, type, handler, useCapture, priority, scope ){
			//IE has it already
			if (!lola.support.msEvent) {
				//deal with other browsers
				lola.event.addListener( target, 'mouseover', lola.event.hooks.mouseenterstate.mouseOver, useCapture, priority, scope );
				lola.event.addListener( target, 'mouseout', lola.event.hooks.mouseenterstate.mouseOut, useCapture, priority, scope );
			}
			return lola.event.addListener( target, lola.event.hooks.mouseenterstate.getEnhancedType( type ), handler, useCapture, priority, scope );
		},
		removeListener: function( target, type, handler, useCapture ){

			var edata = lola.data.get( target, lola.event.dataNs );
			var phase = lola.event.phaseString( target, useCapture );
			type = lola.event.hooks.mouseenterstate.getEnhancedType( type );
			lola.event.removeListener( target, type, handler, useCapture );

			//check for other hook listeners before removeing
			if (    !lola.support.msEvent &&
					edata[phase][lola.event.hooks.mouseenterstate.getEnhancedType( type )] == null ||
					edata[phase][lola.event.hooks.mouseenterstate.getEnhancedType( type )].keys().length == 0){
				//deal with other browsers
				lola.event.removeListener( target, 'mouseover', lola.event.hooks.mouseenterstate.mouseOver, useCapture );
				lola.event.removeListener( target, 'mouseout', lola.event.hooks.mouseenterstate.mouseOut, useCapture );
			}

		}
	};

	/**
	 * @description mouse leave event
	 * @event mouseleave
	 */
	event.hooks['mouseleave'] = event.hooks['mouseenterstate'];

	/**
	 * @description mouse enter event
	 * @event mouseleave
	 */
	event.hooks['mouseenter'] = event.hooks['mouseenterstate'];


	//register module
	lola.registerModule( event );

})( lola );
(function( lola ) {
	var $ = lola;
	/**
	 * @description HTTP Request Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var http = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @description storage for cached xsl requests
		 */
		xslCache: {},


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.http::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.http.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.http::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.http.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "http";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['string'];
		},

		/**
		 * @descripiton applies transformation using results of two requests
		 * @public
		 * @param {lola.http.Request} xmlDoc
		 * @param {lola.http.Request} xslDoc
		 * @param {Object} xslParams
		 */
		transform: function( xmlDoc, xslDoc, xslParams ) {
			var children,k;
			if ( window.ActiveXObject ) {
				//THIS NEEDS TO BE TESTED! I've got no clue if it will work or not.
				var xsltCompiled = new ActiveXObject( "MSXML2.XSLTemplate" );
				xsltCompiled.stylesheet = xslDoc.documentElement;
				var processor = xsltCompiled.createProcessor();
				processor.input = xmlDoc;
				for ( k in xslParams ) {
					processor.addParameter( k, xslParams[k] );
				}
				processor.transform();

				var tempDiv = document.createElement( 'div' );
				tempDiv.innerHTML = processor.output;
				children = tempDiv.childNodes;
			}
			else if ( document.implementation && document.implementation.createDocument ) {
				var xsltProcessor = new XSLTProcessor();
				xsltProcessor.importStylesheet( xslDoc );
				for ( k in xslParams ) {
					xsltProcessor.setParameter( null, k, xslParams[k] );
				}
				var resultDocument = xsltProcessor.transformToFragment( xmlDoc, document );
				if ( resultDocument ) {
					children = resultDocument.childNodes;
				}
			}

			return children;
		},

		/**
		 * @description caches xsl request
		 * @public
		 * @param {String} id
		 * @param {lola.http.Request} xsl
		 */
		cacheXsl: function( id, xsl ){
			lola.http.xslCache[ id ] = xsl;
		},

		/**
		 * @description replaces "<" ">" "&" with "&lt;" "&gt;" "&amp;"
		 * @param {String} str
		 */
		encode: function( str ) {
			if ( typeof str == 'string' ) {
				str = str.replace( /</g, '&lt;' );
				str = str.replace( />/g, '&gt;' );
				str = str.replace( /&/g, '&amp;' );
			}
			return str;
		},

		/**
		 * @description replaces "&lt;" "&gt;" "&amp;" with "<" ">" "&"
		 * @param {String} str
		 */
		unencode: function( str ) {
			if ( typeof str == 'string' ) {
				str = str.replace( /\$lt;/g, '<' );
				str = str.replace( /&gt;/g, '>' );
				str = str.replace( /&amp;/g, '&' );
			}
			return str;
		},

		//==================================================================
		// Classes
		//==================================================================
		/**
		 * @description Base HTTP Request Class
		 * @class
		 * @param {String} url request url
		 * @param {String} method request method
		 * @param {Array} headers request headers
		 * @param {Boolean} async execute request asyncronously
		 * @param {String} user credentials username
		 * @param {String} password credentials password
		 */
		Request: function( url, method, headers, async, user, password ) {
			return this.init( url, method, headers, async, user, password );
		},

		/**
		 * @description Asynchronous HTTP Request Class
		 * @class
		 * @param {String} url request url
		 * @param {String} method request method
		 * @param {Array} headers request headers
		 * @param {String} user credentials username
		 * @param {String} password credentials password
		 * @extends lola.http.Request
		 */
		AsyncRequest: function( url, method, headers, user, password ) {
			return this.init( url, method, headers, true, user, password );
		},

		/**
		 * @description Synchronous HTTP Request Class
		 * @class
		 * @param {String} url request url
		 * @param {String} method request method
		 * @param {Array} headers request headers
		 * @param {String} user credentials username
		 * @param {String} password credentials password
		 * @extends lola.http.Request
		 */
		SyncRequest: function( url, method, headers, user, password ) {
			return this.init( url, method, headers, false, user, password );
		},

		/**
		 * @description AJAX Transform Class
		 * @param {lola.http.Request} xml request object
		 * @param {lola.http.Request|String} xsl request object or string id for cached xsl
		 * @param {Object} xslParams
		 * @param {String|undefined} xslCacheId if set xsl will be cached with the specified id
		 */
		Transform: function( xml, xmlParams, xsl, xslParams, transformParams, xslCacheId ) {
			return this.init( xml, xmlParams, xsl, xslParams, transformParams, xslCacheId );
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
				applyTransform: function( transform, interimContent, faultContent ) {
					this.html( interimContent );
					this.forEach( function(item){
						lola.event.addListener( transform, 'result', function( event ) {
							$( item ).html( event.data );
						} );
						lola.event.addListener( transform, 'fault', function() {
							$( item ).html( faultContent );
						} );
					});

					transform.load();

				},
				/**
				 * @description loads a request's content into elements
				 * @param {lola.http.Request} request
				 * @param {Object} requestParams
				 * @param {*} interimContent
				 * @param {*} faultContent
				 */
				applyRequest: function( request, requestParams, interimContent, faultContent ) {
					this.html( interimContent );
					this.forEach( function(item){
						lola.event.addListener( request, 'result', function( event ) {
							$( item ).html( event.currentTarget.responseText() );
						} );
						lola.event.addListener( request, 'fault', function() {
							$( item ).html( faultContent );
						} );
					});

					request.load();
				},

				/**
				 * @description loads http content into elements asynchronously
				 * @param {String} url
				 * @param {*} interimContent
				 * @param {*} faultContent
				 */
				loadContent: function( url, interimContent, faultContent ){
					var request = new lola.http.AsyncRequest( url, 'get', [] );
					this.applyRequest( request, {}, interimContent, faultContent);
				}
			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
	http.Request.prototype = {
		/**
		 * @description request url
		 * @private
		 */
		url: "",

		/**
		 * @description request method
		 * @private
		 */
		method: 'POST',

		/**
		 * @description request headers
		 * @private
		 */
		headers: [],

		/**
		 * @description execute request asyncronously
		 * @private
		 */
		async: true,

		/**
		 * @description username
		 * @private
		 */
		user: null,

		/**
		 * @description password
		 * @private
		 */
		password: null,

		/**
		 * @description DOM xmlhttprequest
		 * @private
		 */
		request: false,

		/**
		 * @description readyFlag
		 * @public
		 */
		ready: false,

		/**
		 * @description http.Request initializer
		 * @param {String} url request url
		 * @param {String} method request method
		 * @param {Array} headers request headers
		 * @param {Boolean} async execute request asyncronously
		 * @param {String} user credentials username
		 * @param {String} password credentials password
		 */
		init: function( url, method, headers, async, user, password ) {
			this.method = method || 'POST';
			this.headers = headers || [];
			this.async = async === true;
			this.url = url;
			this.user = user;
			this.password = password;

			return this;
		},

		/**
		 * @description gets correct request object
		 * @private
		 */
		getRequestObject: function() {
			var request = false;
			if ( window.XMLHttpRequest && !(window.ActiveXObject) ) {
				// branch for native XMLHttpRequest object
				try {
					request = new XMLHttpRequest();
				}
				catch( error ) {
					request = false;
				}
			}
			else if ( window.ActiveXObject ) {
				// branch for IE/Windows ActiveX version
				try {
					//request = new ActiveXObject("MSXML2.FreeThreadedDomDocument");
					request = new ActiveXObject( "Msxml2.XMLHTTP" );
				}
				catch( error ) {
					try {
						request = new ActiveXObject( "Microsoft.XMLHTTP" );
					}
					catch( error ) {
						request = false;
					}
				}
			}

			return request;
		},

		/**
		 * @description builds and executes request
		 * @private
		 * @param url
		 * @param params
		 * @param method
		 * @param headers
		 * @param async
		 * @param readystatechange
		 * @param scope
		 * @param user
		 * @param password
		 */
		makeRequest: function( url, params, method, headers, async, readystatechange, scope, user, password ) {
			var request = this.getRequestObject();
			request.open( method, url, async, user, password );
			request.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
			for ( var i = 0; i < headers.length; i++ ) {
				try {
					request.setRequestHeader( headers[i].name, headers[i].value );
				}
				catch( e ) {
				}
			}
			if ( params != null ) {
				if ( lola.type.get( params ) != 'string' ) {
					var temp = [];
					for ( var k in params ) {
						temp.push( k + "=" + lola.string.encode( params[k] ) );
					}
					params = temp.join( '&' );
				}

				if ( params.length > 0 ) {
					//request.setRequestHeader("Content-Length", params.length);
					//request.setRequestHeader("Connection", "close");
				}
			}

			request.onreadystatechange = function() {
				readystatechange.call( scope )
			};
			request.send( params );

			return request;
		},

		/**
		 * @description send request
		 * @public
		 * @param {Object|String|undefined} params
		 */
		load: function( params ) {
			this.request = this.makeRequest( this.url, params, this.method, this.headers, true, this.readyStateChange, this, this.user, this.password );
		},

		/**
		 * @description ready state change listener
		 * @private
		 */
		readyStateChange: function() {
			if ( this.request ) {
				switch ( this.request.readyState ) {
					case 0:
						//uninitialized
						break;
					case 1:
						//loading
						lola.event.trigger( this, 'loading', true, true, this.request );
						break;
					case 2:
						//loaded
						lola.event.trigger( this, 'loaded', true, true, this.request );
						break;
					case 3:
						//interactive
						lola.event.trigger( this, 'interactive', true, true, this.request );
						break;
					case 4:
						//complete
						lola.event.trigger( this, 'stateComplete', true, true, this.request );
						if ( this.request.status == 200 && !this.ready ) {
							this.ready = true;
							lola.event.trigger( this, 'result', true, true, this.request );
						}
						else if ( this.request.status >= 400 ) {
							console.info( 'AsyncRequest.readyStateChange.fault: ' + this.url );
							lola.event.trigger( this, 'fault', false, false, this.request );
						}
						break;
				}
			}
		},

		/**
		 * @description get raw response text
		 * @return {String}
		 */
		responseText: function() {
			if ( this.ready )
				return this.request.responseText;
			else
				return false;
		},

		/**
		 * @description get response xml document
		 * @return {XML}
		 */
		responseXML: function() {
			if ( this.ready )
				return this.request.responseXML;
			else
				return false;
		}


	};
	http.AsyncRequest.prototype = http.Request.prototype;
	http.SyncRequest.prototype = http.Request.prototype;

	http.Transform.prototype = {
		/**
		 * @description xml request object
		 * @private
		 * @type {lola.http.Request}
		 */
		xml: null,

		/**
		 * @description xsl request object
		 * @private
		 * @type {lola.http.Request}
		 */
		xsl: null,

		/**
		 * @description transformation xsl request params
		 * @private
		 * @type {Object}
		 */
		xslParams: null,

		/**
		 * @description transformation xml request params
		 * @private
		 * @type {Object}
		 */
		xmlParams: null,

		/**
		 * @description cache xsl onceLoaded
		 * @private
		 * @type {String}
		 */
		xslCacheId: "",

		/**
		 * @description holds transformation result
		 * @type {Array}
		 */
		resultNodes: [],

		/**
		 * @description Transform class initializer
		 * @private
		 * @param xml
		 * @param xsl
		 * @param xslParams
		 * @param xslCacheId
		 */
		init: function( xml, xmlParams, xsl, xslParams, transformParams, xslCacheId ) {
			this.xmlParams = xmlParams;
			this.xslParams = xslParams;
			this.transformParams = transformParams;
			this.xslCacheId = xslCacheId || "";
			if ( lola.type.get( xsl ) == 'string' ) {
				var xslId = xsl;
				xsl = lola.http.getCachedXsl( xslId );
				if ( !xsl ) {
					throw new Error( 'unknown xsl cache id: "' + xslId + '"' );
				}
			}
			else {
				this.xsl = xsl;
			}

			if ( this.xsl && this.xml ) {
				lola.event.addListener( this.xsl, 'result', this.checkStates, true, 0, this );
				lola.event.addListener( this.xsl, 'fault', this.handleXSLFault, true, 0, this );
				lola.event.addListener( this.xml, 'result', this.checkStates, true, 0, this );
				lola.event.addListener( this.xml, 'fault', this.handleXMLFault, true, 0, this );

				this.checkStates();
			}
			else {
				throw new Error( 'transform error!' );
			}

		},

		/**
		 * @description checks the states of both requests to see if the transform can be applied
		 * @private
		 */
		checkStates: function() {
			if ( this.xml.ready && this.xsl.ready ) {
				//cache xsl request if id set
				if (this.xslCacheId && this.xslCacheId != "") {
					lola.http.cacheXsl( this.xslCacheId, this.xsl );
				}

				//both requests are ready, do transform
				this.resultNodes = lola.http.transform( this.xml.responseXML(), this.xsl.responseXML(), this.transformParams );
				lola.event.trigger( this, 'result', true, true, this.resultNodes );
			}
		},

		/**
		 * @description  handles xsl fault
		 * @private
		 */
		handleXSLFault: function() {
			lola.event.trigger( this, 'fault', true, true, 'xsl fault' );
		},

		/**
		 * @description  handles xml fault
		 * @private
		 */
		handleXMLFault: function() {
			lola.event.trigger( this, 'fault', true, true, 'xml fault' );
		},

		/**
		 * @description sends the transform requests if not yet sent
		 * @public
		 */
		load: function() {
			if ( !this.xml.request ) {
				this.xml.send( this.xmlParams );
			}
			if ( !this.xsl.request ){
				this.xsl.send( this.xslParams );
			}
		},

		/**
		 * @description  cancels transform request... aborts requests and removes listeners
		 * @public
		 */
		cancel: function() {
			lola.event.removeListener( this.xsl, 'result', this.checkStates, true );
			lola.event.removeListener( this.xsl, 'fault', this.handleXSLFault, true );
			lola.event.removeListener( this.xml, 'result', this.checkStates, true );
			lola.event.removeListener( this.xml, 'fault', this.handleXMLFault, true );
			try {
				this.xsl.abort();
			}
			catch(e){}
			try {
				this.xml.abort();
			}
			catch(e){}
		},

		/**
		 * @description get the result of the transformation
		 * @public
		 * @return {Array} array of nodes
		 */
		getResultNodes: function(){
			return this.resultNodes;
		}


	};


	//register module
	lola.registerModule( http );

})( lola );
(function( lola ) {
	var $ = lola;
	/**
	 * @description JSON Module adapted from json.org code
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var json = {

		//==================================================================
		// Attributes
		//==================================================================
		// JSON parsing variables
		cx: /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		escapable: /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		gap: null,
		indent: null,
		meta: {    // table of character substitutions
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"' : '\\"',
			'\\': '\\\\'
		},
		rep: null,


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.json::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.json.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.json::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.json.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "json";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * @description json parsing method
		 * @private
		 * @param {String} string
		 */
		escapeQuotes: function ( string ) {
			// If the string contains no control characters, no quote characters, and no
			// backslash characters, then we can safely slap some quotes around it.
			// Otherwise we must also replace the offending characters with safe escape
			// sequences.
			//this.escapable.lastIndex = 0;
			return this.escapable.test( string ) ?
					'"' + string.replace( this.escapable, function ( a ) {
						var c = lola.json.meta[a];
						return typeof c === 'string' ? c :
								'\\u' + ('0000' + a.charCodeAt( 0 ).toString( 16 )).slice( -4 );
					} ) + '"' :
					'"' + string + '"';
		},


		/**
		 * @description json parsing method
		 * @private
		 * @param {String} key
		 * @param {Object} holder
		 */
		str: function ( key, holder ) {
			var i,          // The loop counter.
					k,          // The member key.
					v,          // The member value.
					length,
					mind = this.gap,
					partial,
					value = holder[key];

			// If the value has a toJSON method, call it to obtain a replacement value.
			if ( value && typeof value === 'object' &&
					typeof value.toJSON === 'function' ) {
				value = value.toJSON( key );
			}

			// If we were called with a replacer function, then call the replacer to
			// obtain a replacement value.
			if ( typeof this.rep === 'function' ) {
				value = this.rep.call( holder, key, value );
			}

			// What happens next depends on the value's type.
			switch ( typeof value ) {
				case 'string':
					return this.escapeQuotes( value );

				case 'number':
					// JSON numbers must be finite. Encode non-finite numbers as null.
					return isFinite( value ) ? String( value ) : 'null';

				case 'boolean':
				case 'null':
					// If the value is a boolean or null, convert it to a string. Note:
					// typeof null does not produce 'null'. The case is included here in
					// the remote chance that this gets fixed someday.
					return String( value );

				case 'object':
					// If the type is 'object', we might be dealing with an object or an array or null.
					// Due to a specification blunder in ECMAScript, typeof null is 'object',
					// so watch out for that case.
					if ( !value ) {
						return 'null';
					}

					// Make an array to hold the partial results of stringifying this object value.
					this.gap += this.indent;
					partial = [];

					// Is the value an array?
					if ( Object.prototype.toString.apply( value ) === '[object Array]' ) {

						// The value is an array. Stringify every element. Use null as a placeholder
						// for non-JSON values.
						length = value.length;
						for ( i = 0; i < length; i += 1 ) {
							partial[i] = this.str( i, value ) || 'null';
						}

						// Join all of the elements together, separated with commas, and wrap them in
						// brackets.
						v = partial.length === 0 ? '[]' :
								this.gap ? '[\n' + this.gap +
										partial.join( ',\n' + this.gap ) + '\n' +
										mind + ']' :
										'[' + partial.join( ',' ) + ']';
						this.gap = mind;
						return v;
					}

					// If the replacer is an array, use it to select the members to be stringified.
					if ( this.rep && typeof this.rep === 'object' ) {
						length = this.rep.length;
						for ( i = 0; i < length; i += 1 ) {
							k = this.rep[i];
							if ( typeof k === 'string' ) {
								v = this.str( k, value );
								if ( v ) {
									partial.push( this.escapeQuotes( k ) + (this.gap ? ': ' : ':') + v );
								}
							}
						}
					}
					else {
						// Otherwise, iterate through all of the keys in the object.
						for ( k in value ) {
							if ( Object.hasOwnProperty.call( value, k ) ) {
								v = this.str( k, value );
								if ( v ) {
									partial.push( this.escapeQuotes( k ) + (this.gap ? ': ' : ':') + v );
								}
							}
						}
					}

					// Join all of the member texts together, separated with commas,
					// and wrap them in braces.

					v = partial.length === 0 ? '{}' :
							this.gap ? '{\n' + this.gap + partial.join( ',\n' + this.gap ) + '\n' +
									mind + '}' : '{' + partial.join( ',' ) + '}';
					this.gap = mind;
					return v;
			}
		},

		/**
		 * @description json encodes a javascript object
		 * @public
		 * @param {Object} obj
		 * @return {String}
		 */
		encode: function ( obj ) {
			return lola.json.stringify( obj );
		},

		/**
		 * @description decodes a json string
		 * @public
		 * @param {String} text
		 * @return {Object}
		 */
		decode: function ( text ) {
			return lola.json.parse( text );
		},

		/**
		 * @description json encodes a javascript object
		 * @private
		 * @param {Object} value
		 * @param {Object} replacer
		 * @param {String} space
		 * @return {String}
		 */
		stringify: function ( value, replacer, space ) {
			// The stringify method takes a value and an optional replacer, and an optional
			// space parameter, and returns a JSON text. The replacer can be a function
			// that can replace values, or an array of strings that will select the keys.
			// A default replacer method can be provided. Use of the space parameter can
			// produce text that is more easily readable.

			var i;
			this.gap = '';
			this.indent = '';

			// If the space parameter is a number, make an indent string containing that
			// many spaces.
			if ( typeof space === 'number' ) {
				for ( i = 0; i < space; i += 1 ) {
					this.indent += ' ';
				}

			}
			else if ( typeof space === 'string' ) {
				// If the space parameter is a string, it will be used as the indent string.
				this.indent = space;
			}

			// If there is a replacer, it must be a function or an array.
			// Otherwise, throw an error.
			this.rep = replacer;
			if ( replacer && typeof replacer !== 'function' &&
					(typeof replacer !== 'object' ||
							typeof replacer.length !== 'number') ) {
				throw new Error( 'JSON.stringify' );
			}

			// Make a fake root object containing our value under the key of ''.
			// Return the result of stringifying the value.
			return this.str( '', {'': value} );

		},

		/**
		 * @description decodes a json string
		 * @private
		 * @param text
		 * @param reviver
		 */
		parse: function ( text, reviver ) {
			// The parse method takes a text and an optional reviver function, and returns
			// a JavaScript value if the text is a valid JSON text.
			var j;

			// The walk method is used to recursively walk the resulting structure so
			// that modifications can be made.
			function walk( holder, key ) {
				var k, v, value = holder[key];
				if ( value && typeof value === 'object' ) {
					for ( k in value ) {
						if ( Object.hasOwnProperty.call( value, k ) ) {
							v = walk( value, k );
							if ( v !== undefined ) {
								value[k] = v;
							}
							else {
								delete value[k];
							}
						}
					}
				}

				return reviver.call( holder, key, value );
			}

			// Parsing happens in four stages. In the first stage, we replace certain
			// Unicode characters with escape sequences. JavaScript handles many characters
			// incorrectly, either silently deleting them, or treating them as line endings.
			text = String( text );
			//this.cx.lastIndex = 0;
			if ( this.cx.test( text ) ) {
				text = text.replace( this.cx, function ( a ) {
					return '\\u' + ('0000' + a.charCodeAt( 0 ).toString( 16 )).slice( -4 );
				} );
			}

			// In the second stage, we run the text against regular expressions that look
			// for non-JSON patterns. We are especially concerned with '()' and 'new'
			// because they can cause invocation, and '=' because it can cause mutation.
			// But just to be safe, we want to reject all unexpected forms.

			// We split the second stage into 4 regexp operations in order to work around
			// crippling inefficiencies in IE's and Safari's regexp engines. First we
			// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
			// replace all simple value tokens with ']' characters. Third, we delete all
			// open brackets that follow a colon or comma or that begin the text. Finally,
			// we look to see that the remaining characters are only whitespace or ']' or
			// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
			if ( /^[\],:{}\s]*$/.test( text.replace( /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@' ).
					replace( /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']' ).
					replace( /(?:^|:|,)(?:\s*\[)+/g, '' ) ) ) {
				// In the third stage we use the eval function to compile the text into a
				// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
				// in JavaScript: it can begin a block or an object literal. We wrap the text
				// in parens to eliminate the ambiguity.
				j = eval( '(' + text + ')' );

				// In the optional fourth stage, we recursively walk the new structure, passing
				// each name/value pair to a reviver function for possible transformation.
				return typeof reviver === 'function' ? walk( {'': j}, '' ) : j;
			}

			// If the text is not JSON parseable, then a SyntaxError is thrown.
			throw new SyntaxError( 'JSON.parse' );

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

		},

		//==================================================================
		// Prototype Upgrades
		//==================================================================
		/**
		 * upgrades prototypes and is then deleted
		 * @private
		 */
		upgradePrototypes: function() {

			if ( typeof Date.prototype.toJSON !== 'function' ) {
				Date.prototype.toJSON = function ( key ) {
					return isFinite( this.valueOf() ) ?
							this.getUTCFullYear() + '-' +
									lola.string.padFront( this.getUTCMonth() + 1,"0",2 ) + '-' +
									lola.string.padFront( this.getUTCDate(),"0",2 ) + 'T' +
									lola.string.padFront( this.getUTCHours(),"0",2 ) + ':' +
									lola.string.padFront( this.getUTCMinutes(),"0",2 ) + ':' +
									lola.string.padFront( this.getUTCSeconds(),"0",2 ) + 'Z' : null;
				};

				String.prototype.toJSON =
						Number.prototype.toJSON =
								Boolean.prototype.toJSON = function ( key ) {
									return this.valueOf();
								};
			}
		}

	};

	//==================================================================
	// Class Prototypes
	//==================================================================


	json.upgradePrototypes();
	delete json.upgradePrototypes;

	//register module
	lola.registerModule( json );

})( lola );
(function( lola ) {
	var $ = lola;
	/**
	 * @description Math Color Module
	 * @implements {lola.Module}
	 * @memberof lola.math
	 */
	var color = {

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
			lola.debug('lola.color::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization



			//remove initialization method
			delete lola.math.color.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.color::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.math.color.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "math.color";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},


		/**
		 * @description converts red,green,blue values to hue,saturation,lightness
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @return {Object}
		 */
		rgb2hsl: function( r, g, b ) {
			var hue = 0;
			var saturation = 0;
			var lightness = 0;

			//make sure values are in range
			r = (r < 0) ? 0 : r;
			r = (r > 1) ? 1 : r;
			g = (g < 0) ? 0 : g;
			g = (g > 1) ? 1 : g;
			b = (b < 0) ? 0 : b;
			b = (b > 1) ? 1 : b;

			//set lightness
			var colorMax = (r > g) ? ((b > r) ? b : r) : ((b > g) ? b : g);
			var colorMin = (r < g) ? ((b < r) ? b : r) : ((b < g) ? b : g);
			lightness = colorMax;

			//set saturation
			if ( colorMax != 0 )
				saturation = (colorMax - colorMin) / colorMax;

			//set hue
			if ( saturation > 0 ) {
				var red = (colorMax - r) / (colorMax - colorMin);
				var green = (colorMax - g) / (colorMax - colorMin);
				var blue = (colorMax - b) / (colorMax - colorMin);
				if ( r == colorMax )
					hue = blue - green;

				else if ( g == colorMax )
					hue = 2 + red - blue;

				else
					hue = 4 + green - red;

				hue = hue / 6;

				while ( hue < 0 ) {
					hue++;
				}

			}

			return {h:hue, s:saturation, l:lightness };
		},

		/**
		 * @description converts red,green,blue values to hex string
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @return {String}
		 */
		rgb2hex: function( r, g, b ) {
			var str = "";

			//make sure values are in range
			r = (r < 0) ? 0 : r;
			r = (r > 1) ? 1 : r;
			g = (g < 0) ? 0 : g;
			g = (g > 1) ? 1 : g;
			b = (b < 0) ? 0 : b;
			b = (b > 1) ? 1 : b;

			var red = Math.round( r * 255 );
			var green = Math.round( g * 255 );
			var blue = Math.round( b * 255 );

			var digits = "0123456789ABCDEF";

			var lku = [];
			lku.push((red - (red % 16)) / 16);
			lku.push( red % 16);
			lku.push((green - (green % 16)) / 16);
			lku.push( green % 16);
			lku.push((blue - (blue % 16)) / 16);
			lku.push( blue % 16);


			lku.forEach( function(i){
				str += digits.charAt( i );
			});

			return str;
		},


		/**
		 * @description converts red,green,blue values to int
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @return {int}
		 */
		rgb2int: function( r, g, b ) {
			return parseInt("0x"+lola.math.color.rgb2hex(r,g,b));
		},

		/**
		 * @description converts hue,saturation,lightness values to red,green,blue
		 * @param {Number} h
		 * @param {Number} s
		 * @param {Number} l
		 * @return {Object}
		 */
		hsl2rgb: function( h, s, l ) {
			//make sure values are in range
			h = (h < 0) ? 0 : h;
			h = (h > 1) ? 1 : h;
			s = (s < 0) ? 0 : s;
			s = (s > 1) ? 1 : s;
			l = (l < 0) ? 0 : l;
			l = (l > 1) ? 1 : l;

			var red = 0;
			var green = 0;
			var blue = 0;

			if ( s == 0 ) {
				red = b;
				green = red;
				blue = red;
			}
			else {
				var _h = (h - Math.floor( h )) * 6;
				var _f = _h - Math.floor( _h );

				var _p = l * (1.0 - s);
				var _q = l * (1.0 - s * _f);
				var _t = l * (1.0 - (s * (1 - _f)));

				switch ( Math.floor( _h ) ) {
					case 0:
						red = l;
						green = _t;
						blue = _p;
						break;
					case 1:
						red = _q;
						green = l;
						blue = _p;
						break;
					case 2:
						red = _p;
						green = l;
						blue = _t;
						break;
					case 3:
						red = _p;
						green = _q;
						blue = l;
						break;
					case 4:
						red = _t;
						green = _p;
						blue = l;
						break;
					case 5:
						red = l;
						green = _p;
						blue = _q;
						break;
				}
			}
			return {r:red,g:green,b:blue};
		},

		/**
		 * @description converts hue,saturation,lightness values to uint
		 * @param {Number} h
		 * @param {Number} s
		 * @param {Number} l
		 * @return {int}
		 */
		hsl2int: function( h, s, l ) {
			var rgb = color.hsl2rgb( h, s, l );
			return color.rgb2int( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * @description converts hue,saturation,lightness values to hex
		 * @param {Number} h
		 * @param {Number} s
		 * @param {Number} l
		 * @return {String}
		 */
		hsl2hex: function( h, s, l ) {
			var rgb = color.hsl2rgb( h, s, l );
			return color.rgb2hex( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * @description converts int values to rgb
		 * @param {int} value
		 * @return {Object}
		 */
		int2rgb: function( value ) {
			var str = "";

			//make sure value is in range
			value = (value > 0xFFFFFF) ? 0xFFFFFF : value;
			value = (value < 0x000000) ? 0x000000 : value;

			var red = ((value >> 16) & 0xFF) / 255;
			var green = ((value >> 8) & 0xFF) / 255;
			var blue = ((value) & 0xFF) / 255;


			return {r:red,g:green,b:blue};
		},

		/**
		 * @description converts int values to hsl
		 * @param {int} value
		 * @return {Object}
		 */
		int2hsl: function( value ) {
			var rgb = color.int2rgb( value );
			return color.rgb2hsl( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * @description converts int values to hex string
		 * @param {int} value
		 * @return {String}
		 */
		int2hex: function( value ) {
			var rgb = color.int2rgb( value );
			return color.rgb2hex( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * @description converts hex values to int
		 * @param {String} value
		 * @return {int}
		 */
		hex2int: function( value ) {
			//special case for 3 digit color
			var str;
			if ( value.length == 3 ) {
				str = value[0] + value[0] + value[1] + value[1] + value[2] + value[2]
			}
			else {
				str = value;
			}

			return parseInt( "0x" + str );
		},

		/**
		 * @description converts hex values to rgb
		 * @param {String} value
		 * @return {Object}
		 */
		hex2rgb: function( value ) {
			return color.int2rgb( color.hex2int( value ) );
		},

		/**
		 * @description converts hex values to hsl
		 * @param {String} value
		 * @return {Object}
		 */
		hex2hsl: function( value ) {
			return color.int2hsl( color.hex2int( value ) );
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
	lola.registerModule( color );

})( lola );

(function( lola ) {
	var $ = lola;
	/**
	 * @description math Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var math = {

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
			lola.debug('lola.math::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization



			//remove initialization method
			delete lola.math.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.math::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.math.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "math";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * @description normalize radians to 0 to 2 * PI
		 * @param {Number} value radian value
		 * @return {Number}
		 */
		normalizeRadians: function( value ) {
			var unit = 2 * Math.PI;
			while (value < unit)
				value += unit;
			return value % unit;
		},

		/**
		 * @description normalize degrees to 0 to 360
		 * @param {Number} value radian value
		 * @return {Number}
		 */
		normalizeDegrees: function( value ) {
			while (value < 360)
				value += 360;
			return value % 360;
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

				/**
				 * @description get max value
				 * @param {Function} getVal function to get value from elements
				 * @return {Number}
				 */
				maxValue: function( getVal ) {
					return this.compareValues( getVal, Math.max, Number.MIN_VALUE );
				},

				/**
				 * @description get min value
				 * @param {Function} getVal function to get value from elements
				 * @return {Number}
				 */
				minValue: function( getVal ) {
					return this.compareValues( getVal, Math.min, Number.MAX_VALUE );
				},

				/**
				 * @description get total value
				 * @param {Function} getVal function to get value from elements
				 * @return {Number}
				 */
				totalValue: function( getVal ) {
					return this.compareValues( getVal, function( a, b ) {
						return a + b;
					}, 0 );
				},

				/**
				 * @description get averate value
				 * @param {Function} getVal function to get value from elements
				 * @return {Number}
				 */
				avgValue: function( getVal ) {
					return this.totalValue( getVal ) / this.elements.length;
				}

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================




	//register module
	lola.registerModule( math );

})( lola );

(function( lola ) {
	var $ = lola;
	/**
	 * @description Math Time Value of Money Module
	 * @implements {lola.Module}
	 * @memberof lola.math
	 */
	var tvm = {

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
			lola.debug('lola.math.tvm::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization



			//remove initialization method
			delete lola.math.tvm.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.math.tvm::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.math.tvm.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "math.tvm";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * @description present value
		 * @param fv future value
		 * @param rate rate per term
		 * @param term
		 */
		pv: function( fv, rate, term ) {
			return fv / Math.pow( 1 + rate, term );
		},

		/**
		 * @description future value
		 * @param pv present value
		 * @param rate rate per term
		 * @param term
		 */
		fv: function( pv, rate, term ) {
			return pv * Math.pow( 1 + rate, term );
		},


		/**
		 * @description present value of an annuity
		 * @param a annuity
		 * @param rate rate per term
		 * @param term
		 */
		pva: function( a, rate, term ) {
			return a * (1 - ( 1 / Math.pow( 1 + rate, term ) ) ) / rate;
		},

		/**
		 * @description future value of an annuity
		 * @param a annuity
		 * @param rate rate per term
		 * @param term
		 */
		fva: function( a, rate, term ) {
			return a * (Math.pow( 1 + rate, term ) - 1) / rate;
		},

		/**
		 * @description payment
		 * @param pv present value
		 * @param rate rate per term
		 * @param term
		 * @param fv future value
		 */
		payment: function( pv, rate, term, fv ) {
			var rp = Math.pow( 1 + rate, term );
			return  pv * rate / ( 1 - (1 / rp)) - fv * rate / (rp - 1);
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
	lola.registerModule( tvm );

})( lola );

(function( lola ) {
	var $ = lola;
	/**
	 * @description Regular Expression Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var regex = {

		//==================================================================
		// Attributes
		//==================================================================
		extraSpace: /\s\s+/g,
		isNumber: /^-?\d*(?:\.\d+)?$/,
		isDimension: /^(-?\d*(?:\.\d+)?)(%|in|cm|mm|em|ex|pt|pc|px)$/,
		isColor: /^(#|rgb|rgba|hsl|hsla)(.*)$/,
		isHexColor: /^#([A-F0-9]{3,6})$/,
		isRGBColor: /^rgba?\(([^\)]+)\)$/,
		isHSLColor: /^hsla?\(([^\)]+)\)$/,


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.regex::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization



			//remove initialization method
			delete lola.regex.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.regex::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.regex.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "regex";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
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
	lola.registerModule( regex );

})( lola );

(function( lola ) {
	var $ = lola;
	/**
	 * @description String Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var string = {

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
			lola.debug( 'lola.string::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.string.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.string::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.string.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "string";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},


		/**
		 * @description pads the front of a string with the specified character to the specified length
		 * @param {String|int} str
		 * @param {String} chr character to use in pad
		 * @param {int} size padded length
		 */
		padFront: function ( str, chr, size ) {
			str = str.toString();
			while ( str.length < size ) {
				str = chr[0] + str;
			}
			return str;
		},

		/**
		 * @description pads the end of a string with the specified character to the specified length
		 * @param {String|int} str
		 * @param {String} chr character to use in pad
		 * @param {int} size padded length
		 */
		padEnd: function ( str, chr, size ) {
			str = str.toString();
			while ( str.length < size ) {
				str = str + chr[0];
			}
			return str;
		},


		/**
		 * @description converts hyphenated strings to camelCase
		 * @param {String} str
		 */
		camelCase: function ( str ) {
			var parts = str.split( "-" );
			for ( var i in parts ) {
				if ( parts[i].length > 0 )
					parts[i][0] = parts[i][0].toUpperCase();
			}

			return parts.join();
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

		},


		//==================================================================
		// Prototype Upgrades
		//==================================================================
		/**
		 * upgrades string prototype and is then deleted
		 * @private
		 */
		upgradeStringPrototype: function() {

			if ( !String.prototype.trim ) {
				String.prototype.trim = function () {
					return String( this ).replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' );
				};
			}
		}

	};

	//==================================================================
	// Class Prototypes
	//==================================================================


	string.upgradeStringPrototype();
	delete string.upgradeStringPrototype;

	//register module
	lola.registerModule( string );

})( lola );
(function( lola ) {
	var $ = lola;
	/**
	 * @description Support Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var support = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @description can script text nodes be appended to script nodes
		 * @public
		 * @type {Boolean}
		 */
		domEval: false,

		/**
		 * @description can delete expando properties
		 * @public
		 * @type {Boolean}
		 */
		deleteExpando: true,

		/**
		 * @description dom event model
		 * @public
		 * @type {Boolean}
		 */
		domEvent: false,

		/**
		 * @description ms event model
		 * @public
		 * @type {Boolean}
		 */
		msEvent: false,

		/**
		 * @description browser animation frame timing
		 * @public
		 * @type {Boolean}
		 */
		browserAnimationFrame: false,

		/**
		 * @description IE style
		 * @public
		 * @type {Boolean}
		 */
		style: false,

		/**
		 * @description float is reserved check whether to user cssFloat or styleFloat
		 * @public
		 * @type {Boolean}
		 */
		cssFloat: false,

		/**
		 * @description check color alpha channel support
		 * @public
		 * @type {Boolean}
		 */
		colorAlpha: false,

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.support::preinitialize');
			//DOM script eval support
			var root = document.documentElement;
			var script = document.createElement( 'script' );
			var uid = "scriptCheck" + (new Date).getTime();
			script.type = "text/javascript";
			try {
				script.appendChild( document.createTextNode( 'window.' + uid + '=true;' ) );
			}
			catch( e ) {

			}

			root.insertBefore( script, root.firstChild );
			root.removeChild( script );

			if ( window[ uid ] ) {
				this.domEval = true;
				delete window[ uid ];
			}


			//create test div and test helpers for support tests
			var div = document.createElement( 'div' );
			var html = function( val ) {
				div.innerHTML = val;
			};


			//style support
			html( "<div style='color:black;opacity:.25;float:left;background-color:rgba(255,0,0,0.5);' test='true'>test</div>" );
			var target = div.firstChild;
			this.style = (typeof target.getAttribute( 'style' ) === 'string');
			this.cssFloat = /^left$/.test( target.style.cssFloat );
			this.colorAlpha = /^rgba.*/.test( target.style.backgroundColor );


			//check for deletion of expando properties
			try {
				delete target.test;
			}
			catch( e ) {
				this.deleteExpando = false;
			}


			//Event Model
			if ( document.addEventListener )
				this.domEvent = true;
			else if ( document.attachEvent )
				this.msEvent = true;


			//remove initialization method
			delete lola.support.preinitialize;

		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.support::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.support.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "support";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},


		//==================================================================
		// Selector Methods
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

	//register module
	lola.registerModule( support );

})( lola );

(function( lola ) {
	var $ = lola;
	/**
	 * @description Type Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var type = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @private
		 * @type {Object}
		 */
		map: {},

		/**
		 * @private
		 * @type {Object}
		 */
		primitives: ["boolean","number","string","undefined","null"],

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.type::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization
			lola.type.createMap();
			delete lola.type.createMap;
			delete lola.type.mapTag;
			delete lola.type.mapSpecialTag;
			delete lola.type.mapObject;

			//remove initialization method
			delete lola.type.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.type::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.type.initialize;
		},
		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "type";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * @description creates map of object and element types
		 * @private
		 */
		createMap: function() {

			var objTypes = "String Number Date Array Boolean RegExp Function Object";
			var tagTypes =  "a abbr acronym address applet area article aside audio "+
							"b base basefont bdi bdo big blockquote body br button "+
							"canvas caption center cite code col colgroup command "+
							"datalist dd del details dfn dir div dl dt "+
							"em embed "+
							"fieldset figcaption figure font footer form frame frameset "+
							"h1 h2 h3 h4 h5 h6 head header hgroup hr html "+
							"i iframe img input ins "+
							"keygen kbd "+
							"label legend li link "+
							"map mark menu meta meter "+
							"nav noframes noscript "+
							"object ol optgroup option output "+
							"p param pre progress "+
							"q "+
							"rp rt ruby "+
							"s samp script section select small source span strike strong style sub summary sup svg "+
							"table tbody td textarea tfoot th thead time title tr track tt "+
							"u ul "+
							"var video "+
							"wbr "+
							"xmp";
			var specialTagTypes ="object";

			objTypes.split(' ').forEach( this.mapObject );
			tagTypes.split(' ').forEach( this.mapTag );
			specialTagTypes.split(' ').forEach( this.mapSpecialTag );

			var tn = document.createTextNode( 'test' );
			var cn = document.createComment( 'test' );
			var tntype = lola.toString.call( tn );
			var cntype = lola.toString.call( cn );
			lola.type.map[ tntype ] = 'textnode';
			lola.type.map[ cntype ] = 'commentnode';
			//TODO: add isTextNode and isCommentNode selector functions

			delete lola.type.mapTag;
			delete lola.type.mapObject;
			delete lola.type.mapSpecialTag;

		},

		/**
		 * @description maps tag type
		 * @private
		 * @param item
		 * @param index
		 */
		mapTag: function( item, index ) {
			var tag = document.createElement( item );
			var type = lola.toString.call( tag );
			var name = type.replace( /\[object HTML/g, "" ).replace( /Element\]/g, "" );
			name = name == "" ? "Element" : name;
			lola.type.map[ type ] = name.toLowerCase();
			var isfn = "lola.Selector.prototype['is" + name + "'] = " +
					"function(index){ return this.isType('" + name.toLowerCase() + "',index); };";
			lola.evaluate( isfn );
		},

		/**
		 * @description maps special tag types
		 * @private
		 * @param item
		 * @param index
		 */
		mapSpecialTag: function( item, index ) {
			var tag = document.createElement( item );
			var type = lola.toString.call( tag );
			var name = type.replace( /\[object /g, "" ).replace( /Element\]/g, "" ); // keep HTML
			name = name == "" ? "Element" : name;
			lola.type.map[ type ] = name.toLowerCase();
			var isfn = "lola.Selector.prototype['is" + name + "'] = " +
					"function(index){ return this.isType('" + name.toLowerCase() + "',index); };";
			lola.evaluate( isfn );
		},

		/**
		 * @description maps object types
		 * @private
		 * @param item
		 * @param index
		 */
		mapObject: function( item, index ) {
			var type = "[object " + item + "]";
			lola.type.map[ type ] = item.toLowerCase();
			var isfn = "lola.Selector.prototype['is" + item + "'] = " +
					"function(index){ return this.isType('" + item.toLowerCase() + "',index); };";
			lola.evaluate( isfn );
		},

		/**
		 * @description gets the specified object's type
		 * @param {Object} object
		 * @return {String}
		 */
		get: function( object ) {
			if ( object ) {
				var type = lola.type.map[ lola.toString.call( object ) ];
				if ( type )
					return type;
				return 'other ';
			}
			return 'null'
		},


		//==================================================================
		// Selector Methods
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
				/**
				 * @description gets the type if the specified index
				 * @param {int} index
				 * @return {Array}
				 */
				getType: function( index ) {
					var values = [];
					this.forEach( function( item ) {
						values.push( lola.type.get(item) );
					} );
					return values;
				},

				/**
				 * @description checks if element at index is a type, or all elements are a type
				 * @param {String} type
				 * @param {int|undefined} index
				 */
				isType: function( type, index ) {
					if (index != undefined && index >= 0 ) {
						return lola.type.get( this.get(index)) == type;
					}
					else {
						return this.elements.every( function( item ){
							return lola.type.get(item) == type;
						} );
					}
				},

				/**
				 * @description checks if element at index is a primitive, or all elements are primitives
				 * @param {int|undefined} index
				 */
				isPrimitive: function( index ) {
					if (index != undefined && index >= 0 ) {
						return lola.type.primitives.indexOf( this.getType(index) );
					}
					else {
						return this.elements.every( function( item ){
							return lola.type.primitives.indexOf(lola.type.get(item)) >= 0;
						} );
					}
				}

			};

			return methods;

		}



	};


	//register module
	lola.registerModule( type );

})( lola );

(function( lola ) {
	var $ = lola;
	/**
	 * @description Utility Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var util = {

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
			lola.debug( 'lola.util::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.util.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.util::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.util.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "util";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
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

				/**
				 * @description iterate through values calling iterator to change value
				 * @param {Function} getVal function tat returns value from each item
				 * @param {Function} compareFn function that compares values / modifies data
				 * @param {Object} initialVal initial value;
				 * @return {*}
				 */
				compareValues: function( getVal, compareFn, initialVal ) {
					var value = initialVal;

					if ( typeof getVal === 'string' ) {
						this.foreach( function( item ) {
							value = compareFn.call( this, value, Number( item[getVal] ) );
						} );
					}
					else if ( typeof getVal === 'function' ) {
						this.foreach( function( item ) {
							value = compareFn.call( this, value, getVal.call( this, item ) );
						} );
					}

					return value;
				}

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================


	//register module
	lola.registerModule( util );

})( lola );