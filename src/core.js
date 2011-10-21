/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Core
 *  Description: core framework
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/

//======================================================================
// Define Core lola Framework
//======================================================================
//setup console functions
if (!console in window) {
	var console = {};
	methods.split(" ").forEach( function(item){
		console[item] = function(){};
	});
}

var lola = ( function( window ) {
	var lola = {

		//==================================================================
		// Attributes
		//==================================================================
		//initialization flag
		initialized: false,

		//selector alias
		alias: '$',

		//reference to this window
		window: window,

		//initialization functions
		initializers: [],
		moduleIndex: 0,
		modules: [],
		dependencies: {'core':['type','util','support']},


		//attribute hooks
		// setter = function( object, name, value ){}
		// getter = function( object, name ){ return value }
		attribHooks: {},

		safeDeleteHooks: [],

		guid: 0,

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - framework initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.initialized ) {
				//console.info( "lola initialize" );
				lola.initialized = true;

				//remove auto initialization listeners
				if ( document.addEventListener ) {
					document.removeEventListener( "DOMContentLoaded", lola.initialize, false );
				}
				else if ( document.attachEvent ) {
					document.detachEvent( "onreadystatechange", lola.initialize );
				}

				//check dependencies
				var fails = [];
				for ( var module in lola.dependencies ) {
					if ( lola.hasProperties( lola, lola.dependencies[module] ) )
						break;
					fails.push( module );
				}
				if ( fails.length > 0 ) {
					throw new Error( "module dependency checks failed for: " + fails.join( ", " ) );
				}

				//execute initialization functions
				lola.initializers = lola.initializers.sort( lola.util.prioritySort );
				for ( var i in lola.initializers ) {
					var initializer = lola.initializers[i];
					if ( initializer ) {
						if ( initializer.scope && initializer.fn ) {
							initializer.fn.call( initializer.scope, initializer.params );
						}
					}

					delete lola.initializers[i];
				}

				delete lola.initialize;

			}
		},

		//------------------------------------------------------------------
		// checkArgs - this is intended for debugging
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// registerInitializer - registers an initializion expression
		//------------------------------------------------------------------
		registerInitializer: function ( scope, fn, params, priority ) {
			if ( priority == null )
				priority = 0xFFFFFF;

			var initializer = {scope:scope, fn:fn, params:params, priority:priority};

			if ( !lola.initialized )
				lola.initializers.push( initializer );
			else
				initializer.fn.call( initializer.scope, initializer.params );
		},

		//------------------------------------------------------------------
		// eval abstraction
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// loadScript
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// registerModule - adds module to namespace
		//------------------------------------------------------------------
		registerModule: function( module ) {
			//console.info( "registerModule: " + module.namespace );

			//add to dependency map
			if ( module.hasOwnProperty( 'dependencies' ) )
				lola.dependencies[module.namespace] = module.dependencies;

			//setup namespace
			var pkg = lola.getPkgChain( lola, module.namespace );

			//copy module methods and attributes
			lola.extend( pkg, module, false );

			//copy selectors
			if ( module.hasOwnProperty( 'SelectionPrototype' ) )
				lola.extend( lola.SelectionPrototype, module.SelectionPrototype, false );

			//register initializers
			if ( module.initialize && typeof module.initialize == 'function' )
				lola.registerInitializer( module, module.initialize, null, lola.moduleIndex++ );
			if ( module.setup && typeof module.setup == 'function')
				lola.registerInitializer( module, module.setup, null, 0xEFFFFF + lola.moduleIndex );

			return true;
		},

		//------------------------------------------------------------------
		// gets object specified in chain
		//------------------------------------------------------------------
		getPkgChain: function( root, chain ) {
			if ( typeof chain == 'string' ) {
				chain = chain.split( '.' );
				var pkg = root;
				var part;
				while ( part = chain.shift() ) {
					if ( pkg[part] == null )
						pkg[part] = {};
					pkg = pkg[part];
				}

				return pkg;
			}
			else {
				return root;
			}
		},

		//------------------------------------------------------------------
		// set property on window
		//------------------------------------------------------------------
		setProperty: function( root, chain, name, value ) {
			var target = lola.getPkgChain( root, chain );
			target[name] = value;
		},

		//------------------------------------------------------------------
		// foreach object iterator
		//------------------------------------------------------------------
		foreach: function( object, callback, args ) {
			for ( var index in object ) {
				callback.call( object[ index ], object[ index ], index, args );
			}
		},

		//------------------------------------------------------------------
		// extend - copies object properties to target (1st level)
		//------------------------------------------------------------------
		//TODO: make deep copy an option
		extend: function( target, source, overwrite, errors ) {
			if ( overwrite == null )
				overwrite = false;
			if ( errors == null )
				errors = false;

			for ( var k in source ) {
				if ( overwrite || target[k] == null )
					target[k] = source[k];
				else if ( errors )
					throw new Error( "property " + k + " already exists on copy target!" );
			}
		},

		//------------------------------------------------------------------
		// hasProperties - checks if object has all properties
		//------------------------------------------------------------------
		hasProperties: function( object, props ) {
			var prop;
			var check = true;
			while ( prop = props.pop() ) {
				if ( !object.hasOwnProperty( prop ) ) {
					check = false;
					break;
				}
			}
			return check;
		},

		//------------------------------------------------------------------
		// hasPropertyOfType - checks if object has all properties
		//------------------------------------------------------------------
		hasPropertyOfType: function( object, prop, type ) {
			return ( object.hasOwnProperty( prop ) && lola( object ).is( type ) );
		},

		//------------------------------------------------------------------
		// toString
		//------------------------------------------------------------------
		toString: Object.prototype.toString,

		//------------------------------------------------------------------
		// attribute - sets/gets
		//------------------------------------------------------------------
		attr: function( object, name, value ) {
			if ( lola.attribHooks[name] ) {
				return lola.attribHooks[name].apply( object, arguments );
			}
			else {
				if ( value ) {   //set value
					return object[name] = value;
				}
				else {
					return object[name];
				}
			}
		},

		//------------------------------------------------------------------
		// deleteExpando deletes expando attribute
		//------------------------------------------------------------------
		deleteExpando: function( object, name ) {
			if ( lola.support.deleteExpando )
				delete object[name];
			else
				object[name] = null;
		},

		//------------------------------------------------------------------
		// safeDelete
		//------------------------------------------------------------------
		safeDelete: function( object, prop ) {
			var obj = (prop) ? object[ prop ] : object;

			for (var i = lola.safeDeleteHooks.length - 1; i >= 0; i--){
				var hook = lola.safeDeleteHooks[i];
				hook.fn.call( hook.scope, obj );
			}

			if (object && prop )
				delete object[ prop ];
		},

		//==================================================================
		// Selection Prototype
		//==================================================================
		SelectionPrototype: {

			isSelector: true,

			//list of elements returned by sizzle
			elements:[],

			//selector init
			init: function( selector, context ) {
				if ( lola.type.get( selector ) == 'string' )
					this.elements = Sizzle( selector, context );
				else if (lola.type.get( selector ) == 'array')
					this.elements = selector;
				else
					this.elements = [selector];

				return this;
			},

			//sub selection
			find: function( selector ) {
				var $instance = $([]);
				this.foreach( function(item){
					var $tmp = $(selector, item);
					$instance.concat( $tmp );
				});

				return $instance;
			},

			//generation selection
			generation: function( count ) {
				if (!count)
					count = 1;

				var $instance = $([]);
				this.foreach( function(item){
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


			//concat selection
			concat: function( obj ) {
				if (obj.isSelector)
					this.elements = this.elements.concat( obj.getAll() );
				else
					this.elements.push( obj );
				return this;
			},

			//assign id if blank
			identify: function() {
				this.foreach( function(item){
					if (!item.id)
						item.id = "lola-guid-"+lola.guid++;
				});
				return this;
			},

			//get element
			get: function( index ) {
				if ( index == null )
					index = 0;
				return this.elements[ index ];
			},

			//get all elements
			getAll: function() {
				return this.elements;
			},

			//get element count
			count: function() {
				return this.elements.length;
			},

			//set/get html
			html: function( content ) {
				if ( arguments.length == 0 ) {
					var element = this.get();
					return (element) ? element.innerHTML : null;
				}
				else {
					this.foreach( function( item ) {
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

			appendChild: function( node ) {
				if ( this.elements.length > 0 ) {
					this.get().appendChild( node );
				}

				return this;
			},

			cloneNode: function( deep ) {
				if ( this.elements.length > 0 ) {
					return this.get().cloneNode( deep );
				}
				return null;
			},
			insertBefore: function( element ) {
				if ( this.elements.length > 0 ) {
					this.get().insertBefore( element );
				}
				return this;
			},
			removeChild: function( element ) {
				if ( this.elements.length > 0 ) {
					lola.safeDelete( element );
					this.get().removeChild( element );
				}
				return this;
			},
			replaceChild: function( newChild, oldChild ) {
				if ( this.elements.length > 0 ) {
					lola.data.destroyCache( oldChild, true );
					this.get().replaceChild( newChild, oldChild );
				}
				return this;
			},
			attr: function( name, value ) {
				if ( value != undefined ) {
					this.foreach( function( item ) {
						lola.attr( item, name, value );
					} );
					return this;
				}
				else {
					return lola.attr( this.get(), name );
				}
			},

			removeAttr: function( name ) {
				this.foreach( function( item ) {
					item.removeAttribute( name );
				} );
				return this;
			},

			parent: function( newParent ) {
				if ( newParent != undefined ) {
					this.foreach(function(item){
						$(newParent).appendChild( item );
					});
					return this;
				}
				else {
					if (this.count() > 0)
						return this.get().parentNode;
					else
						return null;
				}
			},

			safeDelete: function() {
				this.foreach( function( item ) {
					lola.safeDelete( item );
				} );
				return this;
			},

			deleteExpando: function( name ) {
				this.foreach( function( item ) {
					lola.deleteExpando( item, name );
				} );
				return this;
			}

		}


	};


	//======================================================================
	// SETUP AUTO-INITIALIZATION
	//======================================================================

	//Selector Class
	var Selector = function( selector, context ) {
		return this.init( selector, context );
	};
	Selector.prototype = lola.SelectionPrototype;
	lola.setProperty( lola, "window", 'Selector', Selector );

	//Selector
	var main = function( selector, context ) {
		return new Selector( selector, context );
	};
	lola.extend( main, lola, true );
 	lola.setProperty( lola, "window", lola.alias, main );
	lola = main;


	//add object keys
	if ( !Object.keys ) Object.keys = function( o ) {
		if ( o !== Object( o ) )
			throw new TypeError( 'Object.keys called on non-object' );
		var ret = [],p;
		for ( p in o ) if ( Object.prototype.hasOwnProperty.call( o, p ) ) ret.push( p );
		return ret;
	}

	// initialize lola
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

	return lola;

})( window );
