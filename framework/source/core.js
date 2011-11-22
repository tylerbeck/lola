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


