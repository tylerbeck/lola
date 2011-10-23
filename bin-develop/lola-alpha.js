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
/*!
 * Sizzle CSS Selector Engine
 *  Copyright 2011, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function() {

	var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
			done = 0,
			toString = Object.prototype.toString,
			hasDuplicate = false,
			baseHasDuplicate = true,
			rBackslash = /\\/g,
			rNonWord = /\W/;

// Here we check if the JavaScript engine is using some sort of
// optimization where it does not always call our comparision
// function. If that is the case, discard the hasDuplicate value.
//   Thus far that includes Google Chrome.
	[0, 0].sort( function() {
		baseHasDuplicate = false;
		return 0;
	} );

	var Sizzle = function( selector, context, results, seed ) {
		results = results || [];
		context = context || document;

		var origContext = context;

		if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
			return [];
		}

		if ( !selector || typeof selector !== "string" ) {
			return results;
		}

		var m, set, checkSet, extra, ret, cur, pop, i,
				prune = true,
				contextXML = Sizzle.isXML( context ),
				parts = [],
				soFar = selector;

		// Reset the position of the chunker regexp (start from head)
		do {
			chunker.exec( "" );
			m = chunker.exec( soFar );

			if ( m ) {
				soFar = m[3];

				parts.push( m[1] );

				if ( m[2] ) {
					extra = m[3];
					break;
				}
			}
		} while ( m );

		if ( parts.length > 1 && origPOS.exec( selector ) ) {

			if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
				set = posProcess( parts[0] + parts[1], context );

			} else {
				set = Expr.relative[ parts[0] ] ?
						[ context ] :
						Sizzle( parts.shift(), context );

				while ( parts.length ) {
					selector = parts.shift();

					if ( Expr.relative[ selector ] ) {
						selector += parts.shift();
					}

					set = posProcess( selector, set );
				}
			}

		} else {
			// Take a shortcut and set the context if the root selector is an ID
			// (but not if it'll be faster if the inner selector is an ID)
			if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
					Expr.match.ID.test( parts[0] ) && !Expr.match.ID.test( parts[parts.length - 1] ) ) {

				ret = Sizzle.find( parts.shift(), context, contextXML );
				context = ret.expr ?
						Sizzle.filter( ret.expr, ret.set )[0] :
						ret.set[0];
			}

			if ( context ) {
				ret = seed ?
				{ expr: parts.pop(), set: makeArray( seed ) } :
						Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );

				set = ret.expr ?
						Sizzle.filter( ret.expr, ret.set ) :
						ret.set;

				if ( parts.length > 0 ) {
					checkSet = makeArray( set );

				} else {
					prune = false;
				}

				while ( parts.length ) {
					cur = parts.pop();
					pop = cur;

					if ( !Expr.relative[ cur ] ) {
						cur = "";
					} else {
						pop = parts.pop();
					}

					if ( pop == null ) {
						pop = context;
					}

					Expr.relative[ cur ]( checkSet, pop, contextXML );
				}

			} else {
				checkSet = parts = [];
			}
		}

		if ( !checkSet ) {
			checkSet = set;
		}

		if ( !checkSet ) {
			Sizzle.error( cur || selector );
		}

		if ( toString.call( checkSet ) === "[object Array]" ) {
			if ( !prune ) {
				results.push.apply( results, checkSet );

			} else if ( context && context.nodeType === 1 ) {
				for ( i = 0; checkSet[i] != null; i++ ) {
					if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains( context, checkSet[i] )) ) {
						results.push( set[i] );
					}
				}

			} else {
				for ( i = 0; checkSet[i] != null; i++ ) {
					if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
						results.push( set[i] );
					}
				}
			}

		} else {
			makeArray( checkSet, results );
		}

		if ( extra ) {
			Sizzle( extra, origContext, results, seed );
			Sizzle.uniqueSort( results );
		}

		return results;
	};

	Sizzle.uniqueSort = function( results ) {
		if ( sortOrder ) {
			hasDuplicate = baseHasDuplicate;
			results.sort( sortOrder );

			if ( hasDuplicate ) {
				for ( var i = 1; i < results.length; i++ ) {
					if ( results[i] === results[ i - 1 ] ) {
						results.splice( i--, 1 );
					}
				}
			}
		}

		return results;
	};

	Sizzle.matches = function( expr, set ) {
		return Sizzle( expr, null, null, set );
	};

	Sizzle.matchesSelector = function( node, expr ) {
		return Sizzle( expr, null, null, [node] ).length > 0;
	};

	Sizzle.find = function( expr, context, isXML ) {
		var set;

		if ( !expr ) {
			return [];
		}

		for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
			var match,
					type = Expr.order[i];

			if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
				var left = match[1];
				match.splice( 1, 1 );

				if ( left.substr( left.length - 1 ) !== "\\" ) {
					match[1] = (match[1] || "").replace( rBackslash, "" );
					set = Expr.find[ type ]( match, context, isXML );

					if ( set != null ) {
						expr = expr.replace( Expr.match[ type ], "" );
						break;
					}
				}
			}
		}

		if ( !set ) {
			set = typeof context.getElementsByTagName !== "undefined" ?
					context.getElementsByTagName( "*" ) :
					[];
		}

		return { set: set, expr: expr };
	};

	Sizzle.filter = function( expr, set, inplace, not ) {
		var match, anyFound,
				old = expr,
				result = [],
				curLoop = set,
				isXMLFilter = set && set[0] && Sizzle.isXML( set[0] );

		while ( expr && set.length ) {
			for ( var type in Expr.filter ) {
				if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
					var found, item,
							filter = Expr.filter[ type ],
							left = match[1];

					anyFound = false;

					match.splice( 1, 1 );

					if ( left.substr( left.length - 1 ) === "\\" ) {
						continue;
					}

					if ( curLoop === result ) {
						result = [];
					}

					if ( Expr.preFilter[ type ] ) {
						match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

						if ( !match ) {
							anyFound = found = true;

						} else if ( match === true ) {
							continue;
						}
					}

					if ( match ) {
						for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
							if ( item ) {
								found = filter( item, match, i, curLoop );
								var pass = not ^ !!found;

								if ( inplace && found != null ) {
									if ( pass ) {
										anyFound = true;

									} else {
										curLoop[i] = false;
									}

								} else if ( pass ) {
									result.push( item );
									anyFound = true;
								}
							}
						}
					}

					if ( found !== undefined ) {
						if ( !inplace ) {
							curLoop = result;
						}

						expr = expr.replace( Expr.match[ type ], "" );

						if ( !anyFound ) {
							return [];
						}

						break;
					}
				}
			}

			// Improper expression
			if ( expr === old ) {
				if ( anyFound == null ) {
					Sizzle.error( expr );

				} else {
					break;
				}
			}

			old = expr;
		}

		return curLoop;
	};

	Sizzle.error = function( msg ) {
		throw "Syntax error, unrecognized expression: " + msg;
	};

	var Expr = Sizzle.selectors = {
		order: [ "ID", "NAME", "TAG" ],

		match: {
			ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
			CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
			NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
			ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
			TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
			CHILD: /:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,
			POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
			PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
		},

		leftMatch: {},

		attrMap: {
			"class": "className",
			"for": "htmlFor"
		},

		attrHandle: {
			href: function( elem ) {
				return elem.getAttribute( "href" );
			},
			type: function( elem ) {
				return elem.getAttribute( "type" );
			}
		},

		relative: {
			"+": function( checkSet, part ) {
				var isPartStr = typeof part === "string",
						isTag = isPartStr && !rNonWord.test( part ),
						isPartStrNotTag = isPartStr && !isTag;

				if ( isTag ) {
					part = part.toLowerCase();
				}

				for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
					if ( (elem = checkSet[i]) ) {
						while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {
						}

						checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
								elem || false :
								elem === part;
					}
				}

				if ( isPartStrNotTag ) {
					Sizzle.filter( part, checkSet, true );
				}
			},

			">": function( checkSet, part ) {
				var elem,
						isPartStr = typeof part === "string",
						i = 0,
						l = checkSet.length;

				if ( isPartStr && !rNonWord.test( part ) ) {
					part = part.toLowerCase();

					for ( ; i < l; i++ ) {
						elem = checkSet[i];

						if ( elem ) {
							var parent = elem.parentNode;
							checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
						}
					}

				} else {
					for ( ; i < l; i++ ) {
						elem = checkSet[i];

						if ( elem ) {
							checkSet[i] = isPartStr ?
									elem.parentNode :
									elem.parentNode === part;
						}
					}

					if ( isPartStr ) {
						Sizzle.filter( part, checkSet, true );
					}
				}
			},

			"": function( checkSet, part, isXML ) {
				var nodeCheck,
						doneName = done++,
						checkFn = dirCheck;

				if ( typeof part === "string" && !rNonWord.test( part ) ) {
					part = part.toLowerCase();
					nodeCheck = part;
					checkFn = dirNodeCheck;
				}

				checkFn( "parentNode", part, doneName, checkSet, nodeCheck, isXML );
			},

			"~": function( checkSet, part, isXML ) {
				var nodeCheck,
						doneName = done++,
						checkFn = dirCheck;

				if ( typeof part === "string" && !rNonWord.test( part ) ) {
					part = part.toLowerCase();
					nodeCheck = part;
					checkFn = dirNodeCheck;
				}

				checkFn( "previousSibling", part, doneName, checkSet, nodeCheck, isXML );
			}
		},

		find: {
			ID: function( match, context, isXML ) {
				if ( typeof context.getElementById !== "undefined" && !isXML ) {
					var m = context.getElementById( match[1] );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					return m && m.parentNode ? [m] : [];
				}
			},

			NAME: function( match, context ) {
				if ( typeof context.getElementsByName !== "undefined" ) {
					var ret = [],
							results = context.getElementsByName( match[1] );

					for ( var i = 0, l = results.length; i < l; i++ ) {
						if ( results[i].getAttribute( "name" ) === match[1] ) {
							ret.push( results[i] );
						}
					}

					return ret.length === 0 ? null : ret;
				}
			},

			TAG: function( match, context ) {
				if ( typeof context.getElementsByTagName !== "undefined" ) {
					return context.getElementsByTagName( match[1] );
				}
			}
		},
		preFilter: {
			CLASS: function( match, curLoop, inplace, result, not, isXML ) {
				match = " " + match[1].replace( rBackslash, "" ) + " ";

				if ( isXML ) {
					return match;
				}

				for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
					if ( elem ) {
						if ( not ^ (elem.className && (" " + elem.className + " ").replace( /[\t\n\r]/g, " " ).indexOf( match ) >= 0) ) {
							if ( !inplace ) {
								result.push( elem );
							}

						} else if ( inplace ) {
							curLoop[i] = false;
						}
					}
				}

				return false;
			},

			ID: function( match ) {
				return match[1].replace( rBackslash, "" );
			},

			TAG: function( match, curLoop ) {
				return match[1].replace( rBackslash, "" ).toLowerCase();
			},

			CHILD: function( match ) {
				if ( match[1] === "nth" ) {
					if ( !match[2] ) {
						Sizzle.error( match[0] );
					}

					match[2] = match[2].replace( /^\+|\s*/g, '' );

					// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
					var test = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(
							match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
									!/\D/.test( match[2] ) && "0n+" + match[2] || match[2] );

					// calculate the numbers (first)n+(last) including if they are negative
					match[2] = (test[1] + (test[2] || 1)) - 0;
					match[3] = test[3] - 0;
				}
				else if ( match[2] ) {
					Sizzle.error( match[0] );
				}

				// TODO: Move to normal caching system
				match[0] = done++;

				return match;
			},

			ATTR: function( match, curLoop, inplace, result, not, isXML ) {
				var name = match[1] = match[1].replace( rBackslash, "" );

				if ( !isXML && Expr.attrMap[name] ) {
					match[1] = Expr.attrMap[name];
				}

				// Handle if an un-quoted value was used
				match[4] = ( match[4] || match[5] || "" ).replace( rBackslash, "" );

				if ( match[2] === "~=" ) {
					match[4] = " " + match[4] + " ";
				}

				return match;
			},

			PSEUDO: function( match, curLoop, inplace, result, not ) {
				if ( match[1] === "not" ) {
					// If we're dealing with a complex expression, or a simple one
					if ( ( chunker.exec( match[3] ) || "" ).length > 1 || /^\w/.test( match[3] ) ) {
						match[3] = Sizzle( match[3], null, null, curLoop );

					} else {
						var ret = Sizzle.filter( match[3], curLoop, inplace, true ^ not );

						if ( !inplace ) {
							result.push.apply( result, ret );
						}

						return false;
					}

				} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
					return true;
				}

				return match;
			},

			POS: function( match ) {
				match.unshift( true );

				return match;
			}
		},

		filters: {
			enabled: function( elem ) {
				return elem.disabled === false && elem.type !== "hidden";
			},

			disabled: function( elem ) {
				return elem.disabled === true;
			},

			checked: function( elem ) {
				return elem.checked === true;
			},

			selected: function( elem ) {
				// Accessing this property makes selected-by-default
				// options in Safari work properly
				if ( elem.parentNode ) {
					elem.parentNode.selectedIndex;
				}

				return elem.selected === true;
			},

			parent: function( elem ) {
				return !!elem.firstChild;
			},

			empty: function( elem ) {
				return !elem.firstChild;
			},

			has: function( elem, i, match ) {
				return !!Sizzle( match[3], elem ).length;
			},

			header: function( elem ) {
				return (/h\d/i).test( elem.nodeName );
			},

			text: function( elem ) {
				var attr = elem.getAttribute( "type" ), type = elem.type;
				// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
				// use getAttribute instead to test this case
				return elem.nodeName.toLowerCase() === "input" && "text" === type && ( attr === type || attr === null );
			},

			radio: function( elem ) {
				return elem.nodeName.toLowerCase() === "input" && "radio" === elem.type;
			},

			checkbox: function( elem ) {
				return elem.nodeName.toLowerCase() === "input" && "checkbox" === elem.type;
			},

			file: function( elem ) {
				return elem.nodeName.toLowerCase() === "input" && "file" === elem.type;
			},

			password: function( elem ) {
				return elem.nodeName.toLowerCase() === "input" && "password" === elem.type;
			},

			submit: function( elem ) {
				var name = elem.nodeName.toLowerCase();
				return (name === "input" || name === "button") && "submit" === elem.type;
			},

			image: function( elem ) {
				return elem.nodeName.toLowerCase() === "input" && "image" === elem.type;
			},

			reset: function( elem ) {
				var name = elem.nodeName.toLowerCase();
				return (name === "input" || name === "button") && "reset" === elem.type;
			},

			button: function( elem ) {
				var name = elem.nodeName.toLowerCase();
				return name === "input" && "button" === elem.type || name === "button";
			},

			input: function( elem ) {
				return (/input|select|textarea|button/i).test( elem.nodeName );
			},

			focus: function( elem ) {
				return elem === elem.ownerDocument.activeElement;
			}
		},
		setFilters: {
			first: function( elem, i ) {
				return i === 0;
			},

			last: function( elem, i, match, array ) {
				return i === array.length - 1;
			},

			even: function( elem, i ) {
				return i % 2 === 0;
			},

			odd: function( elem, i ) {
				return i % 2 === 1;
			},

			lt: function( elem, i, match ) {
				return i < match[3] - 0;
			},

			gt: function( elem, i, match ) {
				return i > match[3] - 0;
			},

			nth: function( elem, i, match ) {
				return match[3] - 0 === i;
			},

			eq: function( elem, i, match ) {
				return match[3] - 0 === i;
			}
		},
		filter: {
			PSEUDO: function( elem, match, i, array ) {
				var name = match[1],
						filter = Expr.filters[ name ];

				if ( filter ) {
					return filter( elem, i, match, array );

				} else if ( name === "contains" ) {
					return (elem.textContent || elem.innerText || Sizzle.getText( [ elem ] ) || "").indexOf( match[3] ) >= 0;

				} else if ( name === "not" ) {
					var not = match[3];

					for ( var j = 0, l = not.length; j < l; j++ ) {
						if ( not[j] === elem ) {
							return false;
						}
					}

					return true;

				} else {
					Sizzle.error( name );
				}
			},

			CHILD: function( elem, match ) {
				var type = match[1],
						node = elem;

				switch ( type ) {
					case "only":
					case "first":
						while ( (node = node.previousSibling) ) {
							if ( node.nodeType === 1 ) {
								return false;
							}
						}

						if ( type === "first" ) {
							return true;
						}

						node = elem;

					case "last":
						while ( (node = node.nextSibling) ) {
							if ( node.nodeType === 1 ) {
								return false;
							}
						}

						return true;

					case "nth":
						var first = match[2],
								last = match[3];

						if ( first === 1 && last === 0 ) {
							return true;
						}

						var doneName = match[0],
								parent = elem.parentNode;

						if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
							var count = 0;

							for ( node = parent.firstChild; node; node = node.nextSibling ) {
								if ( node.nodeType === 1 ) {
									node.nodeIndex = ++count;
								}
							}

							parent.sizcache = doneName;
						}

						var diff = elem.nodeIndex - last;

						if ( first === 0 ) {
							return diff === 0;

						} else {
							return ( diff % first === 0 && diff / first >= 0 );
						}
				}
			},

			ID: function( elem, match ) {
				return elem.nodeType === 1 && elem.getAttribute( "id" ) === match;
			},

			TAG: function( elem, match ) {
				return (match === "*" && elem.nodeType === 1) || elem.nodeName.toLowerCase() === match;
			},

			CLASS: function( elem, match ) {
				return (" " + (elem.className || elem.getAttribute( "class" )) + " ")
						.indexOf( match ) > -1;
			},

			ATTR: function( elem, match ) {
				var name = match[1],
						result = Expr.attrHandle[ name ] ?
								Expr.attrHandle[ name ]( elem ) :
								elem[ name ] != null ?
										elem[ name ] :
										elem.getAttribute( name ),
						value = result + "",
						type = match[2],
						check = match[4];

				return result == null ?
						type === "!=" :
						type === "=" ?
								value === check :
								type === "*=" ?
										value.indexOf( check ) >= 0 :
										type === "~=" ?
												(" " + value + " ").indexOf( check ) >= 0 :
												!check ?
														value && result !== false :
														type === "!=" ?
																value !== check :
																type === "^=" ?
																		value.indexOf( check ) === 0 :
																		type === "$=" ?
																				value.substr( value.length - check.length ) === check :
																				type === "|=" ?
																						value === check || value.substr( 0, check.length + 1 ) === check + "-" :
																						false;
			},

			POS: function( elem, match, i, array ) {
				var name = match[2],
						filter = Expr.setFilters[ name ];

				if ( filter ) {
					return filter( elem, i, match, array );
				}
			}
		}
	};

	var origPOS = Expr.match.POS,
			fescape = function( all, num ) {
				return "\\" + (num - 0 + 1);
			};

	for ( var type in Expr.match ) {
		Expr.match[ type ] = new RegExp( Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source) );
		Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace( /\\(\d+)/g, fescape ) );
	}

	var makeArray = function( array, results ) {
		array = Array.prototype.slice.call( array, 0 );

		if ( results ) {
			results.push.apply( results, array );
			return results;
		}

		return array;
	};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
// Also verifies that the returned array holds DOM nodes
// (which is not the case in the Blackberry browser)
	try {
		Array.prototype.slice.call( document.documentElement.childNodes, 0 )[0].nodeType;

// Provide a fallback method if it does not work
	} catch( e ) {
		makeArray = function( array, results ) {
			var i = 0,
					ret = results || [];

			if ( toString.call( array ) === "[object Array]" ) {
				Array.prototype.push.apply( ret, array );

			} else {
				if ( typeof array.length === "number" ) {
					for ( var l = array.length; i < l; i++ ) {
						ret.push( array[i] );
					}

				} else {
					for ( ; array[i]; i++ ) {
						ret.push( array[i] );
					}
				}
			}

			return ret;
		};
	}

	var sortOrder, siblingCheck;

	if ( document.documentElement.compareDocumentPosition ) {
		sortOrder = function( a, b ) {
			if ( a === b ) {
				hasDuplicate = true;
				return 0;
			}

			if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
				return a.compareDocumentPosition ? -1 : 1;
			}

			return a.compareDocumentPosition( b ) & 4 ? -1 : 1;
		};

	} else {
		sortOrder = function( a, b ) {
			// The nodes are identical, we can exit early
			if ( a === b ) {
				hasDuplicate = true;
				return 0;

				// Fallback to using sourceIndex (in IE) if it's available on both nodes
			} else if ( a.sourceIndex && b.sourceIndex ) {
				return a.sourceIndex - b.sourceIndex;
			}

			var al, bl,
					ap = [],
					bp = [],
					aup = a.parentNode,
					bup = b.parentNode,
					cur = aup;

			// If the nodes are siblings (or identical) we can do a quick check
			if ( aup === bup ) {
				return siblingCheck( a, b );

				// If no parents were found then the nodes are disconnected
			} else if ( !aup ) {
				return -1;

			} else if ( !bup ) {
				return 1;
			}

			// Otherwise they're somewhere else in the tree so we need
			// to build up a full list of the parentNodes for comparison
			while ( cur ) {
				ap.unshift( cur );
				cur = cur.parentNode;
			}

			cur = bup;

			while ( cur ) {
				bp.unshift( cur );
				cur = cur.parentNode;
			}

			al = ap.length;
			bl = bp.length;

			// Start walking down the tree looking for a discrepancy
			for ( var i = 0; i < al && i < bl; i++ ) {
				if ( ap[i] !== bp[i] ) {
					return siblingCheck( ap[i], bp[i] );
				}
			}

			// We ended someplace up the tree so do a sibling check
			return i === al ?
					siblingCheck( a, bp[i], -1 ) :
					siblingCheck( ap[i], b, 1 );
		};

		siblingCheck = function( a, b, ret ) {
			if ( a === b ) {
				return ret;
			}

			var cur = a.nextSibling;

			while ( cur ) {
				if ( cur === b ) {
					return -1;
				}

				cur = cur.nextSibling;
			}

			return 1;
		};
	}

// Utility function for retreiving the text value of an array of DOM nodes
	Sizzle.getText = function( elems ) {
		var ret = "", elem;

		for ( var i = 0; elems[i]; i++ ) {
			elem = elems[i];

			// Get the text from text nodes and CDATA nodes
			if ( elem.nodeType === 3 || elem.nodeType === 4 ) {
				ret += elem.nodeValue;

				// Traverse everything else, except comment nodes
			} else if ( elem.nodeType !== 8 ) {
				ret += Sizzle.getText( elem.childNodes );
			}
		}

		return ret;
	};

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
	(function() {
		// We're going to inject a fake input element with a specified name
		var form = document.createElement( "div" ),
				id = "script" + (new Date()).getTime(),
				root = document.documentElement;

		form.innerHTML = "<a name='" + id + "'/>";

		// Inject it into the root element, check its status, and remove it quickly
		root.insertBefore( form, root.firstChild );

		// The workaround has to do additional checks after a getElementById
		// Which slows things down for other browsers (hence the branching)
		if ( document.getElementById( id ) ) {
			Expr.find.ID = function( match, context, isXML ) {
				if ( typeof context.getElementById !== "undefined" && !isXML ) {
					var m = context.getElementById( match[1] );

					return m ?
							m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode( "id" ).nodeValue === match[1] ?
									[m] :
									undefined :
							[];
				}
			};

			Expr.filter.ID = function( elem, match ) {
				var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode( "id" );

				return elem.nodeType === 1 && node && node.nodeValue === match;
			};
		}

		root.removeChild( form );

		// release memory in IE
		root = form = null;
	})();

	(function() {
		// Check to see if the browser returns only elements
		// when doing getElementsByTagName("*")

		// Create a fake element
		var div = document.createElement( "div" );
		div.appendChild( document.createComment( "" ) );

		// Make sure no comments are found
		if ( div.getElementsByTagName( "*" ).length > 0 ) {
			Expr.find.TAG = function( match, context ) {
				var results = context.getElementsByTagName( match[1] );

				// Filter out possible comments
				if ( match[1] === "*" ) {
					var tmp = [];

					for ( var i = 0; results[i]; i++ ) {
						if ( results[i].nodeType === 1 ) {
							tmp.push( results[i] );
						}
					}

					results = tmp;
				}

				return results;
			};
		}

		// Check to see if an attribute returns normalized href attributes
		div.innerHTML = "<a href='#'></a>";

		if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
				div.firstChild.getAttribute( "href" ) !== "#" ) {

			Expr.attrHandle.href = function( elem ) {
				return elem.getAttribute( "href", 2 );
			};
		}

		// release memory in IE
		div = null;
	})();

	if ( document.querySelectorAll ) {
		(function() {
			var oldSizzle = Sizzle,
					div = document.createElement( "div" ),
					id = "__sizzle__";

			div.innerHTML = "<p class='TEST'></p>";

			// Safari can't handle uppercase or unicode characters when
			// in quirks mode.
			if ( div.querySelectorAll && div.querySelectorAll( ".TEST" ).length === 0 ) {
				return;
			}

			Sizzle = function( query, context, extra, seed ) {
				context = context || document;

				// Only use querySelectorAll on non-XML documents
				// (ID selectors don't work in non-HTML documents)
				if ( !seed && !Sizzle.isXML( context ) ) {
					// See if we find a selector to speed up
					var match = /^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec( query );

					if ( match && (context.nodeType === 1 || context.nodeType === 9) ) {
						// Speed-up: Sizzle("TAG")
						if ( match[1] ) {
							return makeArray( context.getElementsByTagName( query ), extra );

							// Speed-up: Sizzle(".CLASS")
						} else if ( match[2] && Expr.find.CLASS && context.getElementsByClassName ) {
							return makeArray( context.getElementsByClassName( match[2] ), extra );
						}
					}

					if ( context.nodeType === 9 ) {
						// Speed-up: Sizzle("body")
						// The body element only exists once, optimize finding it
						if ( query === "body" && context.body ) {
							return makeArray( [ context.body ], extra );

							// Speed-up: Sizzle("#ID")
						} else if ( match && match[3] ) {
							var elem = context.getElementById( match[3] );

							// Check parentNode to catch when Blackberry 4.6 returns
							// nodes that are no longer in the document #6963
							if ( elem && elem.parentNode ) {
								// Handle the case where IE and Opera return items
								// by name instead of ID
								if ( elem.id === match[3] ) {
									return makeArray( [ elem ], extra );
								}

							} else {
								return makeArray( [], extra );
							}
						}

						try {
							return makeArray( context.querySelectorAll( query ), extra );
						} catch( qsaError ) {
						}

						// qSA works strangely on Element-rooted queries
						// We can work around this by specifying an extra ID on the root
						// and working up from there (Thanks to Andrew Dupont for the technique)
						// IE 8 doesn't work on object elements
					} else if ( context.nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
						var oldContext = context,
								old = context.getAttribute( "id" ),
								nid = old || id,
								hasParent = context.parentNode,
								relativeHierarchySelector = /^\s*[+~]/.test( query );

						if ( !old ) {
							context.setAttribute( "id", nid );
						} else {
							nid = nid.replace( /'/g, "\\$&" );
						}
						if ( relativeHierarchySelector && hasParent ) {
							context = context.parentNode;
						}

						try {
							if ( !relativeHierarchySelector || hasParent ) {
								return makeArray( context.querySelectorAll( "[id='" + nid + "'] " + query ), extra );
							}

						} catch( pseudoError ) {
						} finally {
							if ( !old ) {
								oldContext.removeAttribute( "id" );
							}
						}
					}
				}

				return oldSizzle( query, context, extra, seed );
			};

			for ( var prop in oldSizzle ) {
				Sizzle[ prop ] = oldSizzle[ prop ];
			}

			// release memory in IE
			div = null;
		})();
	}

	(function() {
		var html = document.documentElement,
				matches = html.matchesSelector || html.mozMatchesSelector || html.webkitMatchesSelector || html.msMatchesSelector;

		if ( matches ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9 fails this)
			var disconnectedMatch = !matches.call( document.createElement( "div" ), "div" ),
					pseudoWorks = false;

			try {
				// This should fail with an exception
				// Gecko does not error, returns false instead
				matches.call( document.documentElement, "[test!='']:sizzle" );

			} catch( pseudoError ) {
				pseudoWorks = true;
			}

			Sizzle.matchesSelector = function( node, expr ) {
				// Make sure that attribute selectors are quoted
				expr = expr.replace( /\=\s*([^'"\]]*)\s*\]/g, "='$1']" );

				if ( !Sizzle.isXML( node ) ) {
					try {
						if ( pseudoWorks || !Expr.match.PSEUDO.test( expr ) && !/!=/.test( expr ) ) {
							var ret = matches.call( node, expr );

							// IE 9's matchesSelector returns false on disconnected nodes
							if ( ret || !disconnectedMatch ||
								// As well, disconnected nodes are said to be in a document
								// fragment in IE 9, so check for that
									node.document && node.document.nodeType !== 11 ) {
								return ret;
							}
						}
					} catch( e ) {
					}
				}

				return Sizzle( expr, null, null, [node] ).length > 0;
			};
		}
	})();

	(function() {
		var div = document.createElement( "div" );

		div.innerHTML = "<div class='test e'></div><div class='test'></div>";

		// Opera can't find a second classname (in 9.6)
		// Also, make sure that getElementsByClassName actually exists
		if ( !div.getElementsByClassName || div.getElementsByClassName( "e" ).length === 0 ) {
			return;
		}

		// Safari caches class attributes, doesn't catch changes (in 3.2)
		div.lastChild.className = "e";

		if ( div.getElementsByClassName( "e" ).length === 1 ) {
			return;
		}

		Expr.order.splice( 1, 0, "CLASS" );
		Expr.find.CLASS = function( match, context, isXML ) {
			if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
				return context.getElementsByClassName( match[1] );
			}
		};

		// release memory in IE
		div = null;
	})();

	function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
		for ( var i = 0, l = checkSet.length; i < l; i++ ) {
			var elem = checkSet[i];

			if ( elem ) {
				var match = false;

				elem = elem[dir];

				while ( elem ) {
					if ( elem.sizcache === doneName ) {
						match = checkSet[elem.sizset];
						break;
					}

					if ( elem.nodeType === 1 && !isXML ) {
						elem.sizcache = doneName;
						elem.sizset = i;
					}

					if ( elem.nodeName.toLowerCase() === cur ) {
						match = elem;
						break;
					}

					elem = elem[dir];
				}

				checkSet[i] = match;
			}
		}
	}

	function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
		for ( var i = 0, l = checkSet.length; i < l; i++ ) {
			var elem = checkSet[i];

			if ( elem ) {
				var match = false;

				elem = elem[dir];

				while ( elem ) {
					if ( elem.sizcache === doneName ) {
						match = checkSet[elem.sizset];
						break;
					}

					if ( elem.nodeType === 1 ) {
						if ( !isXML ) {
							elem.sizcache = doneName;
							elem.sizset = i;
						}

						if ( typeof cur !== "string" ) {
							if ( elem === cur ) {
								match = true;
								break;
							}

						} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
							match = elem;
							break;
						}
					}

					elem = elem[dir];
				}

				checkSet[i] = match;
			}
		}
	}

	if ( document.documentElement.contains ) {
		Sizzle.contains = function( a, b ) {
			return a !== b && (a.contains ? a.contains( b ) : true);
		};

	} else if ( document.documentElement.compareDocumentPosition ) {
		Sizzle.contains = function( a, b ) {
			return !!(a.compareDocumentPosition( b ) & 16);
		};

	} else {
		Sizzle.contains = function() {
			return false;
		};
	}

	Sizzle.isXML = function( elem ) {
		// documentElement is verified for cases where it doesn't yet exist
		// (such as loading iframes in IE - #4833)
		var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;

		return documentElement ? documentElement.nodeName !== "HTML" : false;
	};

	var posProcess = function( selector, context ) {
		var match,
				tmpSet = [],
				later = "",
				root = context.nodeType ? [context] : context;

		// Position selectors must be done after the filter
		// And so must :not(positional) so we move all PSEUDOs to the end
		while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
			later += match[0];
			selector = selector.replace( Expr.match.PSEUDO, "" );
		}

		selector = Expr.relative[selector] ? selector + "*" : selector;

		for ( var i = 0, l = root.length; i < l; i++ ) {
			Sizzle( selector, root[i], tmpSet );
		}

		return Sizzle.filter( later, tmpSet );
	};

// EXPOSE

	window.Sizzle = Sizzle;

})();
/***********************************************************************
 *       Module: App Nav
 *  Description: navigation module
 *       Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "agent",

		//module dependencies
		dependencies: ['event','data'],

		//registration index
		index: 0,

		//list of registered agents
		map: {},

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//add safe delete hook
			lola.safeDeleteHooks.push( {scope:this, fn:this.drop} );
		},

		//------------------------------------------------------------------
		// register
		//------------------------------------------------------------------
		register: function( agent ) {
			console.info('register agent: '+agent.name);
			if (agent.sign && agent.drop) {
				//setup namespace
				var pkg = lola.getPkgChain( lola.agent, agent.name );

				//copy module methods and attributes
				lola.extend( pkg, agent, true );

				//map agent
				this.map[ agent.name ] = pkg;

				//register initializers
				if ( agent.initialize && typeof agent.initialize == 'function' )
					lola.registerInitializer( agent, agent.initialize, null, lola.moduleIndex + lola.agent.index++ );
				if ( agent.setup && typeof agent.setup == 'function')
					lola.registerInitializer( agent, agent.setup, null, 0xEFFFFF + lola.moduleIndex + lola.agent.index );

			}
			else {
				console.error( 'invalid agent implementation: '+name );
			}

		},

		//------------------------------------------------------------------
		// assign
		//------------------------------------------------------------------
		assign: function( client, name ) {
			//console.info('assign: '+name);
			var agent = lola.agent.map[ name ];
			if (agent){
				agent.sign( client );
			}
		},

		//------------------------------------------------------------------
		// addClient
		//------------------------------------------------------------------
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
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			assignAgent: function( agentName ) {
				this.foreach( function(item){
					lola.agent.assign( item, agentName );
				})
			},
			dropAgent: function( agentName ) {
				this.foreach( function(item){
					lola.agent.drop( item, agentName );
				})
			}
		}

	};
	lola.registerModule( Module );
})( lola );
/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: AJAX
 *  Description: ajax module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "ajax",

		//module dependencies
		dependencies: ['xhr'],

		//initialization flag
		initialized: false,

		//xsl cache
		xslCache: {},


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.ajax.initialized ) {
				//console.info('lola.async.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				//request class
				var Transform = function( url, method, headers, async, user, password ) {
					return this.init( url, method, headers, async, user, password );
				};
				Transform.prototype = lola.ajax.TransformPrototype;
				lola.setProperty( lola, "xhr", 'Transform', Transform );

				lola.ajax.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// caches xsl request
		//------------------------------------------------------------------
		cacheXSL: function( name, xsl ) {
			lola.ajax.xslCache[ name ] = xsl;
		},

		//------------------------------------------------------------------
		// performs transform
		//------------------------------------------------------------------
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





		//==================================================================
		// TransformPrototype
		//==================================================================
		TransformPrototype: {
			xsl: null,
			xslParams: null,
			xml: null,
			init: function( xsl, xml, xslParams ) {
				this.xslParams = xslParams;
				var xslr;
				if ( lola.type.get( xsl ) == 'string' ) {
					xslr = lola.ajax.xslCache[ xsl ];
					if ( !xslr )
						throw new Error( 'unknown xsl: "' + xsl + '"' );
				}
				else {
					xslr = xsl
				}

				if ( xslr && xml ) {
					//add listeners
					lola.event.addListener( xslr, 'result', this.checkStates );
					lola.event.addListener( xslr, 'fault', this.handleXSLFault );
					lola.event.addListener( xml, 'result', this.checkStates );
					lola.event.addListener( xml, 'fault', this.handleXMLFault );

					this.checkStates();
				}

			},

			checkStates: function() {
				if ( this.xml.ready && this.xsl.ready ) {
					//both requests are ready, do transform
					var result = lola.ajax.transform( this.xml.responseXML(), this.xsl.responseXML(), this.xslParams );
					lola.event.trigger( this, 'result', true, true, result );
				}
			},

			handleXSLFault: function() {
				lola.event.trigger( this, 'fault', true, true, 'xsl fault' );
			},

			handleXMLFault: function() {
				lola.event.trigger( this, 'fault', true, true, 'xml fault' );
			},

			cancel: function() {
				lola.event.removeListener( xslr, 'result', this.checkStates );
				lola.event.removeListener( xslr, 'fault', this.handleXSLFault );
				lola.event.removeListener( xml, 'result', this.checkStates );
				lola.event.removeListener( xml, 'fault', this.handleXMLFault );
			}


		},


		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			applyTransform: function( transform, interimContent, faultContent ) {
				var element = this.get();
				$( element ).html( interimContent );
				lola.event.addListener( transform, 'result', function( event ) {
					$( element ).html( event.data );
				} );
				lola.event.addListener( transform, 'fault', function( event ) {
					$( element ).html( faultContent );
				} );

			}
		}



	};
	lola.registerModule( Module );
})( lola );
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

/***********************************************************************
 *       Module: App Nav
 *  Description: navigation module
 *       Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "cmd",

		//module dependencies
		dependencies: ['event','data'],

		//initialization flag
		initialized: false,

		//registry
		registry: {},

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// setup
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.cmd.initialized ) {
				//this module is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				lola.cmd.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// register command
		//------------------------------------------------------------------
		register: function( cmd, name ) {
			if ( typeof cmd != "string" && name == undefined  )
				name = cmd.name;

			console.info('register command: '+name);
			if ( lola.cmd.registry[name] != null && typeof lola.cmd.registry[name] != "string" )
				console.warn( 'command "'+name+'" has already been registered... overwriting' );

			if (typeof cmd == "string"){
				//register path
				this.registry[name] = cmd;
			}
			else{
				//create command class from object
				this.registry[name] = function(){
					return this.init();
				};
				this.registry[name].prototype = cmd;
			}
			lola.event.addListener( this, name, this.executeCommand  );
		},

		//------------------------------------------------------------------
		// execute command
		//------------------------------------------------------------------
		execute: function( name, params, result, fault, scope ) {
			if ( this.registry[name] == null )
				console.warn( 'command "'+name+'" is not registered' );
			else {
				lola.event.trigger( lola.cmd, name, false, false, {params:params, result:result, fault:fault, scope:scope} );
			}
		},

		//------------------------------------------------------------------
		// execute command handler
		//------------------------------------------------------------------
		executeCommand: function( event ) {
			console.info('executeCommand: '+event.type);
			if ( typeof this.registry[event.type] == "string" ){
				//command code needs to be loaded
				console.log('   load command: '+event.type+' -> '+this.registry[event.type]);
				var d = event.data;
				lola.loadScript( this.registry[event.type], function(e){
					if (typeof lola.cmd.registry[event.type] != 'string' ){
						//successfully loded command
						lola.cmd.execute( event.type, d.params, d.result, d.fault, d.scope );
					}
					else {
						console.error('the command loaded from "'+lola.cmd.registry[event.type]+'" is not named "'+event.type+'"');
					}
				});
			}
			else {
				var cmdClass = this.registry[event.type];
				if (cmdClass){
					var cmd = new cmdClass();
					var scope = event.data.scope || event.currentTarget;

					if (event.data.result){
						lola.event.addListener( cmd, 'result', event.data.result, true, null, scope );
					}

					if (event.data.fault){
						lola.event.addListener( cmd, 'fault', event.data.fault, true, null, scope );
					}

					cmd.execute( event.data.params );
				}
				else {
					console.error('command not found: '+event.type);
				}
			}

		},

		//------------------------------------------------------------------
		// result
		//------------------------------------------------------------------
		result: function( cmd, result ) {
			//call once execution is complete
			lola.event.trigger( cmd, 'result', false, false, result );
		},

		//------------------------------------------------------------------
		// fault
		//------------------------------------------------------------------
		fault: function( cmd, msg ) {
			//call once execution is complete
			lola.event.trigger( cmd, 'fault', false, false, msg );
		},





		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

		}

	};
	lola.registerModule( Module );
})( lola );
/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: CSS
 *  Description: CSS module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "css",

		//module dependencies
		dependencies: ['util','type'],

		//initialization flag
		initialized: false,

		//selector cache
		cache:{},

		//selector hooks
		/*
		var hook = function( obj, style, value ){
			if ( value == undefined ) {
				//get style
			}
			else {
				//set style;
			}
		}
		*/
		hooks:{},

		//color styles

		//length styles

		//regex
		rXtraSpc: /\s\s+/g,

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.css.initialized ) {
				//console.info('lola.css.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				//add default selectors
				lola.css.cache['float'] = (lola.support.cssFloat) ? 'cssFloat' : 'styleFloat';
				//add default hooks

				//set rule suport type
				lola.support.cssRules = ( (document.styleSheets.length > 0 && document.styleSheets[0].cssRules) || !document.createStyleSheet ) ? true : false;

				lola.css.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// can apply styles
		//------------------------------------------------------------------
		canStyle: function( obj ) {
			//make sure style can be set
			//TODO: FIX THIS
			return true;//( !obj || !obj.style || obj.nodeType === 3 || obj.nodeType === 8 );
		},

		//------------------------------------------------------------------
		// fixSelector
		//------------------------------------------------------------------
		fixSelector: function( selector ) {
			if ( !lola.css.cache[selector] ) {
				//create and cache fixed selector
				lola.css.cache[ selector ] = lola.string.camelCase( selector );
			}
			return lola.css.cache[selector];
		},

		//------------------------------------------------------------------
		// set/get style
		//------------------------------------------------------------------
		style: function( obj, style, value ) {
			//console.info('css.style: '+style+' '+((value==undefined)?'get':'set -> '+value));
			//make sure style can be set
			if ( lola.css.canStyle( obj ) ) {
				if ( lola.css.hooks[ style ] != null ) {
					return lola.css.hooks[style].apply( obj, arguments );
				}
				else {
					var selector = lola.css.fixSelector( style );
					if ( value == undefined ) {
						if (document.defaultView && document.defaultView.getComputedStyle) {
							return document.defaultView.getComputedStyle( obj )[selector];
						}
						else if ( typeof(document.body.currentStyle) !== "undefined") {
							return obj["currentStyle"][selector];
						}
					}
					else {
						return obj.style[ selector ] = value;
					}
				}
			}
		},

		//------------------------------------------------------------------
		// performs action on matching rules
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// delete matching rules
		//------------------------------------------------------------------
		deleteRules: function( selector, media ) {
			lola.css.performRuleAction( selector, function( si, ri ) {
				if ( lola.support.cssRules )
					document.styleSheets[ si ].deleteRule( ri );
				else
					document.styleSheets[ si ].removeRule( ri );
			}, media )
		},

		//------------------------------------------------------------------
		// get matching rules
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// update matching rules
		//------------------------------------------------------------------
		updateRules: function( selector, style, value, media ) {
			var rules = lola.css.getRules( selector, media );
			for ( var i in rules ) {
				lola.css.style( rules[i], style, value );
			}
			return rules;
		},

		//------------------------------------------------------------------
		// update matching rules
		//------------------------------------------------------------------
		addRule: function( selector ) {
			var ssi = document.styleSheets.length - 1;
			var ri = lola.support.cssRules ? document.styleSheets[ssi].cssRules.length : document.styleSheets[ssi].rules.length;
			if ( document.styleSheets[0].addRule )
				document.styleSheets[ document.styleSheets.length - 1 ].addRule( selector, null, ri );
			else
				document.styleSheets[ document.styleSheets.length - 1 ].insertRule( selector + ' { }', ri );

			return lola.css.getRules( selector )[0];
		},


		//------------------------------------------------------------------
		// set / get classes
		//------------------------------------------------------------------
		classes: function( obj, classes ) {
			if ( classes != undefined ) {
				if ( lola.type.get( classes ) != 'array' ) {
					if ( lola.type.get( classes ) == 'string' )
						classes = [classes];
					else
						classes = [];
				}

				return obj.className = classes.join( " " );

			}
			else {
				var names = obj.className.replace( lola.css.rXtraSpc, " " );
				//console.log('classes: '+names);
				return names.split( " " ).reverse();
			}
		},

		//------------------------------------------------------------------
		// hasClass
		//------------------------------------------------------------------
		hasClass: function( obj, className ) {
			var names = lola.css.classes( obj );
			return lola.array.isIn( names, className );
		},

		//------------------------------------------------------------------
		// addClass
		//------------------------------------------------------------------
		addClass: function( obj, className ) {
			var names = lola.css.classes( obj );
			if ( !lola.array.isIn( names, className ) ) {
				names.push( className );
				lola.css.classes( obj, names );
			}
		},

		//------------------------------------------------------------------
		// removeClass
		//------------------------------------------------------------------
		removeClass: function( obj, className ) {
			var names = lola.css.classes( obj );
			var index = names.indexOf( className );
			if ( index >= 0 ) {
				names.splice( index, 1 );
				lola.css.classes( obj, names );
			}
		},

		//------------------------------------------------------------------
		// clearStyle
		//------------------------------------------------------------------
		clearStyle: function( obj, style ) {
			delete obj.style[ lola.css.fixSelector( style ) ];
		},

		//------------------------------------------------------------------
		// parses style color values returns rgba 6object
		//------------------------------------------------------------------
		parseColor: function( val ) {
			//console.info('parseColor ------ ');
			var rgba = {r:0,g:0,b:0,a:1};
			var cparts = val.match( lola.type.rIsColor );
			if ( cparts ) {
				var a,v,parts;
				switch ( cparts[1] ) {
					case '#':
						parts = val.match( lola.type.rIsHexColor );
						//console.info(parts);
						if ( parts != null ) {
							rgba = lola.math.color.hex2rgb( parts[1] );
							rgba.a = 1;
						}
						break;
					case 'rgb':
					case 'rgba':
						rgba = lola.css.parseRGBColor( val );
						break;
					case 'hsl':
					case 'hsla':
						var hsla = lola.css.parseHSLColor( val );
						rgba = lola.math.color.hsl2rgb( hsla.h, hsla.s, hsla.l );
						rgba.a = a;
						break;
				}
			}
			//console.info(rgba);
			return rgba;
		},

		//------------------------------------------------------------------
		// parses rgb color
		//------------------------------------------------------------------
		parseRGBColor: function( val ) {
			var rgba = { r:0, g:0, b:0, a:1 };
			var parts = val.match( lola.type.rIsRGBColor );
			if ( parts != null ) {
				var v = parts[1].replace( /\s+/g, "" );
				v = v.split( ',' );
				rgba.r = lola.css.parseColorPart( v[0] );
				rgba.g = lola.css.parseColorPart( v[1] );
				rgba.b = lola.css.parseColorPart( v[2] );
				rgba.a = (v.length > 3) ? lola.css.parseColorAlpha( v[3] ) : 1;
			}
			return rgba;
		},

		//------------------------------------------------------------------
		// parses hsl color
		//------------------------------------------------------------------
		parseHSLColor: function( val ) {
			var hsla = { h:0, s:0, l:0, a:1 };
			var parts = val.match( lola.type.rIsHSLColor );
			if ( parts != null ) {
				var v = parts[1].replace( /\s+/g, "" );
				v = v.split( ',' );
				hsla.h = lola.css.parseColorPart( v[0] );
				hsla.s = lola.css.parseColorPart( v[1] );
				hsla.l = lola.css.parseColorPart( v[2] );
				hsla.a = (v.length > 3) ? lola.css.parseColorAlpha( v[3] ) : 1;
			}
			return hsla;
		},

		//------------------------------------------------------------------
		// parses style color part
		//------------------------------------------------------------------
		parseColorPart: function( val ) {
			if ( val ) {
				if ( val.indexOf( '%' ) > 0 )
					return parseFloat( val.replace( /%/g, "" ) ) / 100;
				else
					return parseFloat( val ) / 255;
			}
			return 0;

		},

		//------------------------------------------------------------------
		// parses style color part
		//------------------------------------------------------------------
		parseColorAlpha: function( val ) {
			if ( val ) {
				if ( val.indexOf( '%' ) > 0 )
					return parseFloat( val.replace( /%/g, "" ) ) / 100;
				else
					return parseFloat( val );
			}
			return 1;

		},


		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			//set & get css styles
			css: function( selector, value ) {
				if ( value != undefined ) {
					this.foreach( function( item ) {
						lola.css.style( item, selector, value );
					} );
					return this;
				}
				else {
					return lola.css.style( this.get(), selector );
				}
			},

			//set & get css styles
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
						names = names.concat( lola.css.classes( item ) );
					} );

					return lola.array.unique( names );
				}


			},

			//checks for existence of class
			hasClass: function( name ) {
				var check = true;
				this.foreach( function( item ) {
					if (!lola.css.hasClass( item, name )){
						check = false;
					}
				} );
				return check;
			},


			//add class to selection
			addClass: function( name ) {
				this.foreach( function( item ) {
					lola.css.addClass( item, name );
				} );
				return this;
			},

			//remove class from selection
			removeClass: function( name ) {
				this.foreach( function( item ) {
					lola.css.removeClass( item, name );
				} );
				return this;
			},

			show: function(){
				var data = this.getData('_css.original', true);
				return this.css( 'display', data.display ? data.display : 'block' );
			},

			hide: function(){
				var data = this.getData('_css.original', true);
				data.display = this.css( 'display');
				return this.css( 'display', 'none' );
			}



		}

	};
	lola.registerModule( Module );
})( lola );

/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Data
 *  Description: data module -
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {
		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "data",

		//module dependencies
		dependencies: ['support'],

		//initialization flag
		initialized: false,

		cache: {},
		uid: 1,
		cacheIDProp: "LOLA-DATA-UID",

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.data.initialized ) {
				//console.info( 'lola.data.initialize' );

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				//add safe delete hook
				lola.safeDeleteHooks.push( {scope:this, fn:this.remove} );

				lola.data.initialized = true;
			}
		},
		//------------------------------------------------------------------
		// nextUid - get next uid
		//------------------------------------------------------------------
		nextUid: function() {
			return lola.data.uid++;
		},

		//------------------------------------------------------------------
		// getCacheId - links element with data cache
		//------------------------------------------------------------------
		getCacheId: function( object, create ) {
			//console.info( 'lola.data.getCacheId: ' + object );
			create = (create == undefined) ? true : create;
			//assume if create cache is being called that ther is no cache
			var cacheId = lola.attr( object, lola.data.cacheIDProp );
			if ( cacheId == null ) {
				switch ( lola.type.get( object ) ) {
					case 'function':
					case 'object':
						cacheId = object[lola.data.cacheIDProp];
						if ( cacheId == null && create ) {
							//console.info( '    create for object' );
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
						cacheId = lola.attr( object, lola.data.cacheIDProp );
						if ( cacheId == null && create ) {
							//console.info( '    create for element' );
							cacheId = lola.data.nextUid();
							lola.attr( object, lola.data.cacheIDProp, cacheId );
						}
						break;
				}
			}
			//console.info( '    cacheId: '+cacheId );
			return cacheId;
		},

		//------------------------------------------------------------------
		// get - gets object data
		//------------------------------------------------------------------
		get: function( object, namespace, create ) {
			//console.info( 'lola.data.get: ' + object + "::" + namespace );
			//get data
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

		//------------------------------------------------------------------
		// getNamespace - gets data for entire namespace
		//------------------------------------------------------------------
		getNamespace: function( namespace ) {
			return lola.data.cache[namespace];
		},

		//------------------------------------------------------------------
		// set - replaces/updates existing object data
		//------------------------------------------------------------------
		set: function( object, data, namespace, replace ) {
			//console.info( 'lola.data.set: ' + object + "::" + namespace + ' replace=' + replace );
			//check for existing cache
			var cacheId = lola.data.getCacheId( object, true );

			if ( lola.data.cache[namespace] == null )
				lola.data.cache[namespace] = {};

			if ( replace || lola.data.cache[namespace][cacheId] == null )
				lola.data.cache[namespace][cacheId] = data;
			else
				lola.extend( lola.data.cache[namespace][cacheId], data, true );

			return lola.data.cache[namespace][cacheId];
		},

		//------------------------------------------------------------------
		// remove - removes object data
		//------------------------------------------------------------------
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
				else
					namespace = [namespace];

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
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			//iterate through values calling iterator to change this.data.value
			getData: function( namespace, create ) {
				var data = [];
				this.foreach( function( item ) {
					//get data
					data.push( lola.data.get( item, namespace, create ) )
				} );
				if ( data.length > 1 )
					return data;
				else
					return data[0];
			},


			putData: function( data, namespace ) {
				this.foreach( function( item ) {
					//put data
					lola.data.set( item, data, namespace, true );
				} );
				return this;
			},

			updateData: function( data, namespace ) {
				this.foreach( function( item ) {
					//clear data
					lola.data.set( item, data, namespace, false );
				} );
				return this;
			},

			removeData: function( namespace, recurse ) {
				this.foreach( function( item ) {
					//clear data
					lola.data.remove( item, namespace, recurse );
				} );
				return this;
			},

			removeAllData: function( recurse ) {
				return this.removeData( null, recurse );
			}

		}

	};
	lola.registerModule( Module );
})( lola );
/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Easing
 *  Description: easing module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "ease",

		//module dependencies
		dependencies: [],

		//initialization flag
		initialized: false,

		//map
		map: {},

		//default
		standard: null,

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.ease.initialized ) {
				//console.info('lola.ease.types.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				//create easeInOut functions for types with easeIn and easeOut
				for ( var k in lola.ease.types ) {
					if (lola.ease.types[k].hasOwnProperty('easeIn') && lola.ease.types[k].hasOwnProperty('easeOut')) {
						var ei = 'lola.ease.types["'+k+'"]["easeIn"]';
						var eo = 'lola.ease.types["'+k+'"]["easeOut"]';
						var fn = 'lola.ease.types["'+k+'"]["easeInOut"] = function( t, v, c, d ){ return (t < d / 2) ? ('+ei+'(t,v,c/2,d/2)) : ('+eo+'( t - d/2,'+ei+'(d,v,c/2,d),c/2,d/2)); }';
						lola.evaluate( fn );
					}
				}

				lola.ease.types.standard = lola.ease.types.cubic.easeInOut;
				lola.ease.map[""] = lola.ease.types.standard;
				lola.ease.map["null"] = lola.ease.types.standard;
				lola.ease.map["default"] = lola.ease.types.standard;
				lola.ease.map["standard"] = lola.ease.types.standard;
				lola.ease.map["undefined"] = lola.ease.types.standard;
				lola.ease.map["none"] = lola.ease.types.linear.easeNone;

				lola.ease.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// get - return function based on string
		//------------------------------------------------------------------
		get: function( value ) {
			//just in case an easing function is already set.
			if ( lola.type.get( value ) == 'function' )
				return value;

			//otherwise return mapped value
			if ( lola.ease.map[ String( value ) ] ) {
				return lola.ease.map[ String( value ) ];
			}
			else {
				//try to map value
				var parts = String( value ).split( '.' );
				var func = lola.ease.types.standard;
				if ( parts.length == 2 ) {
					if ( lola.ease.types[ parts[0] ] ) {
						if ( lola.ease.types[ parts[0] ][parts[1]] )
							func = lola.ease.types[ parts[0] ][parts[1]];
					}
				}
				lola.ease.map[ String( value ) ] = func;
				return func;
			}

		},

		//------------------------------------------------------------------
		// setBackPower - sets params for 'back'
		//------------------------------------------------------------------
		setBackPower: function( value ){
			value = Math.max(value,0);
			value = Math.min(1,value);
			lola.ease.params.back.a = 5.4 * (.25 + value*.75);
			lola.ease.params.back.b = lola.ease.params.back.a - 1;
		},

		//------------------------------------------------------------------
		// draw - draws an easing graph and returns canvas
		//------------------------------------------------------------------
		draw: function( easing, w, h, strokeStyle, axis ){
			var canvas = document.createElement('canvas');
			canvas.width = w;
			canvas.height = h;
			if (canvas.getContext){
				var ctx = canvas.getContext('2d');
				if (axis) {
					ctx.fillStyle = "rgb(50,50,50)";
					ctx.fillRect(0,0,1,h);
					ctx.fillRect(0,3*h/4,w,1);
					ctx.fillStyle = "rgb(200,200,200)";
					ctx.fillRect(1,h/4,w,1)
					ctx.fillText('to',w-15,h/4 - 5);
					ctx.fillText('from',10,3*h/4 + 15);
				}

				//draw easing
				ctx.beginPath();
				ctx.strokeStyle = strokeStyle;
				ctx.moveTo( 0,3*h/4 );

				var c = h/2;
				var e = lola.ease.get( easing );
				for (var t = 0; t<= w; t++ ){
					ctx.lineTo(t, 3*h/4 - e(t,0,c,w));
				}
				ctx.stroke();
			}

			return canvas;
		},



		//------------------------------------------------------------------
		// easing functions
		//------------------------------------------------------------------
		/*
		 t - time in millis
		 v - initial value
		 c - value change
		 d - duration in millis
		 */
		//---------------------------------
		params: {
			back: { a: 2.7, b: 1.7 }
		},

		types: {
			back: {
				easeIn: function( t, v, c, d ) {
					return c * (t /= d) * t * (lola.ease.params.back.a * t - lola.ease.params.back.b) + v;
				},
				easeOut: function( t, v, c, d ) {
					return c * ((t = t / d - 1) * t * (lola.ease.params.back.a * t + lola.ease.params.back.b) + 1) + v;
				}
			},
			//---------------------------------
			bounce: {
				easeIn: function( t, v, c, d ) {
					return c - lola.ease.types.bounce.easeOut( d - t, 0, c, d ) + v;
				},
				easeOut: function( t, v, c, d ) {
					return ((t /= d) < (1 / 2.75)) ?
								(c * (7.5625 * t * t) + v) :
								( (t < (2 / 2.75)) ?
										(c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + v) :
										( (t < (2.5 / 2.75)) ?
												(c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + v) :
												(c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + v)));
				}
			},
			//---------------------------------
			circular: {
				easeIn: function( t, v, c, d ) {
					return -c * (Math.sqrt( 1 - (t /= d) * t ) - 1) + v;
				},
				easeOut: function( t, v, c, d ) {
					return c * Math.sqrt( 1 - (t = t/d - 1) * t ) + v;
				}
			},
			//---------------------------------
			cubic: {
				easeIn: function( t, v, c, d ) {
					return c * (t /= d) * t * t + v;
				},
				easeOut: function( t, v, c, d ) {
					return c * ((t = t / d - 1) * t * t + 1) + v;
				}
			},
			//---------------------------------
			elastic: {
				easeIn: function( t, v, c, d ) {
					if ( t == 0 ) return v;
					if ( (t /= d) == 1 ) return v + c;
					var p,a,s;
					p = d * 0.3;
					a = c;
					s = p / 4;
					return -(a * Math.pow( 2, 10 * (t -= 1) ) * Math.sin( (t * d - s) * (2 * Math.PI) / p )) + v;
				},
				easeOut: function( t, v, c, d ) {
					if ( t == 0 ) return v;
					if ( (t /= d) == 1 ) return v + c;
					var s,a,p;
					p = d * 0.3;
					a = c;
					s = p / 4;
					return a * Math.pow( 2, -10 * t ) * Math.sin( (t * d - s) * (2 * Math.PI) / p ) + c + v;
				}
			},
			//---------------------------------
			exponential: {
				easeIn: function( t, v, c, d ) {
					return (t == 0) ? v : (c * Math.pow( 2, 10 * (t / d - 1) ) + v);
				},
				easeOut: function( t, v, c, d ) {
					return (t == d) ? (v + c) : (c * (-Math.pow( 2, -10 * t / d ) + 1) + v);
				}
			},
			//---------------------------------
			linear: {
				easeNone: function( t, v, c, d ) {
					return c * t / d + v;
				}
			},
			//---------------------------------
			quadratic: {
				easeIn: function( t, v, c, d ) {
					return c * (t /= d) * t + v;
				},
				easeOut: function( t, v, c, d ) {
					return -c * (t /= d) * (t - 2) + v;
				}
			},
			//---------------------------------
			quartic: {
				easeIn: function( t, v, c, d ) {
					return c * (t /= d) * t * t * t + v;
				},
				easeOut: function( t, v, c, d ) {
					return -c * ((t = t / d - 1) * t * t * t - 1) + v;
				}
			},
			//---------------------------------
			quintic: {
				easeIn: function( t, v, c, d ) {
					return c * (t /= d) * t * t * t * t + v;
				},
				easeOut: function( t, v, c, d ) {
					return c * ((t = t / d - 1) * t * t * t * t + 1) + v;
				}
			},
			//---------------------------------
			sine: {
				easeIn: function( t, v, c, d ) {
					return -c * Math.cos( t / d * (Math.PI / 2) ) + c + v;
				},
				easeOut: function( t, v, c, d ) {
					return c * Math.sin( t / d * (Math.PI / 2) ) + v;
				}
			}
		},


		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

		}

	};


	lola.registerModule( Module );
})( lola );
/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Event
 *  Description: event module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "event",
		dataNs: "__events",

		//module dependencies
		dependencies: ['data'],

		//event mapping
		map: {
			'mousewheel':['mousewheel','DOMMouseScroll']
		},

		//hooks - event hooks must have 'add' and 'remove' methods
		hooks: {},

		//listener uid index
		lUid: 0,

		//initialization flag
		initialized: false,


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.event.initialized ) {
				//console.info( 'lola.event.initialize' );

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				var LolaEvent = function( event, target ) {
					return this.init( event, target );
				};
				LolaEvent.prototype = lola.event.LolaEventPrototype;
				lola.setProperty( lola, "event", 'LolaEvent', LolaEvent );

				lola.event.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// listen
		//------------------------------------------------------------------
		addListener: function( target, type, handler, useCapture, priority, scope ) {
			var required = [['target',target],['type',type],['handler',handler]];
			var info = [target,'type: '+type,'useCapture: '+useCapture];
			if ( lola.checkArgs('ERROR: lola.event.addListener( '+type+' )', required, info) ){
				if (lola.event.hooks[type] != null){
					return lola.event.hooks[type]['add'].call( lola.event.hooks[type], target, type, handler, useCapture, priority, scope );
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
						handler.uid = lola.event.lUid++;
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

		//------------------------------------------------------------------
		// removeListener
		//------------------------------------------------------------------
		removeListener: function( target, type, handler, useCapture ) {
			var required = [['target',target],['type',type],['handler',handler]];
			var info = [target,'type: '+type,'useCapture: '+useCapture];
			if ( lola.checkArgs('ERROR: lola.event.removeListener( '+type+' )', required, info) ){
				if (lola.event.hooks[type] != null){
					lola.event.hooks[type]['remove'].call( lola.event.hooks[type], target, type, handler, useCapture );
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


		//------------------------------------------------------------------
		// removeHandler - removes all listeners with handler
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// captureHandler - generic handler for events registered through lola
		//------------------------------------------------------------------
		captureHandler: function( event ) {
			event = event || lola.window.event;
			lola.event.handler( event, 'capture' )
		},

		//------------------------------------------------------------------
		// bubbleHandler - generic handler for events registered through lola
		//------------------------------------------------------------------
		bubbleHandler: function( event ) {
			event = event || lola.window.event;
			lola.event.handler( event, 'bubble' )
		},

		//------------------------------------------------------------------
		// handler - generic handler for events registered through lola
		//------------------------------------------------------------------
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
				stack = stack.sort( lola.util.prioritySort );
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

		//------------------------------------------------------------------
		// trigger
		//------------------------------------------------------------------
		trigger: function( object, type, bubbles, cancelable, data ) {
			/*console.group('lola.event.trigger: '+type);
			console.log(object);
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

		//------------------------------------------------------------------
		// add a DOM event listener on target
		//------------------------------------------------------------------
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
						target['on' + t.toLowerCase()] = handler;
				}
				catch( error ) {
					//console.info( 'lola.event.addDOMListener error' );
				}
			} );
			//}
		},

		//------------------------------------------------------------------
		// removes DOM Event listener from target
		//------------------------------------------------------------------
		removeDOMListener: function( target, type, handler ) {
			//if ( target.hasOwnProperty('nodeType') && (target.nodeType == 1 || target.nodeType == 9)){
			type = lola.event.map[type] ? lola.event.map[type] : [type];
			type.forEach( function(t) {
				try {
					if ( target.removeEventListener )
						target.removeEventListener( t, handler, false );
					else if ( lola.support.msEvent )
						target.detachEvent( 'on' + t, handler );
					else if ( target['on' + t.toLowerCase()] == null )
						delete target['on' + t.toLowerCase()];
				}
				catch( error ) {
					//console.info( 'lola.event.removeDOMListener error' );
				}
			} );
			//}
		},

		//------------------------------------------------------------------
		// returns an events target element
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// returns key code for key events
		//------------------------------------------------------------------
		getDOMKeycode: function( e ) {
			var code;

			if ( e.keyCode )
				code = e.keyCode;
			else if ( e.which )
				code = e.which;

			return code;
		},

		//------------------------------------------------------------------
		// returns keys for key events
		//------------------------------------------------------------------
		getDOMKey: function( e ) {
			var code;

			if ( e.keyCode )
				code = e.keyCode;
			else if ( e.which )
				code = e.which;

			return String.fromCharCode( lola.event.getDOMKeycode(e) );
		},

		//------------------------------------------------------------------
		// returns x,y coordinates relative to document
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// returns actual event phase to use
		//------------------------------------------------------------------
		phaseString: function( target, useCapture ) {
			var phase = ((useCapture && (lola.support.domEvent || lola.support.msEvent)) || (!target.dispatchEvent && !target.attachEvent)) ? 'capture' : 'bubble';
			return phase;
		},

		//------------------------------------------------------------------
		// preventDefault
		//------------------------------------------------------------------
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
		// Selection Methods
		//==================================================================
		LolaEventPrototype: {
			originalEvent: null,
			_propagationStopped: false,
			_immediatePropagationStopped: false,
			init: function( event, target ) {
				//first copy event props into this
				lola.extend( this, event, false, false );

				///normalize and add special props
				this.originalEvent = event;
				if ( target )
					this.target = target;
				this.currentTarget = lola.event.getDOMTarget( event, target );

				var gpos = lola.event.getDOMGlobalXY( event );
				this.globalX = gpos.x;
				this.globalY = gpos.y;

				this.key = lola.event.getDOMKey( event );

				//rewrite original functions
				this.preventDefault = function() {
					this.originalEvent.preventDefault();
				};

				this.stopPropagation = function() {
					this.originalEvent.stopPropagation();
					this._propagationStopped = true;
				};

				this.stopImmediatePropagation = function() {
					this.originalEvent.stopImmediatePropagation();
					this._immediatePropagationStopped = true;
				};


				return this;
			}


		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

			addListener: function( type, handler, useCapture, priority, scope ) {
				this.foreach( function( item ) {
					lola.event.addListener( item, type, handler, useCapture, priority, scope );
				} );

				return this;
			},

			removeListener: function( type, handler, useCapture ) {
				this.foreach( function( item ) {
					lola.event.removeListener( item, type, handler, useCapture );
				} );

				return this;
			},

			removeHandler: function( handler, types, phase ) {
				this.foreach( function( item ) {
					lola.event.removeHandler( item, handler, types, phase );
				} );

				return this;
			},

			trigger: function( type, bubbles, cancelable, data ) {
				this.foreach( function( item ) {
					lola.event.trigger( item, type, bubbles, cancelable, data );
				} );

				return this;
			}

		}

	};

	//add conveinience listener methods
	var events = "change click mousedown mouseup mouseover mouseout mouseenter mouseleave hover keydown keyup resize";
	events.split(' ').forEach( function( eventName ){
		Module.SelectionPrototype[eventName] = function( handler, useCapture, priority, scope ) {
			this.addListener( eventName, handler, useCapture, priority, scope );
			return this;
		}
	});

	//add default hooks
	Module.hooks['hover'] = {
		event: 'hoverConfirmed',
		getData: function( target ){
			var ns = 'eventHover';
			var data = lola.data.get( target, ns );
			if ( !data ) {
			    data = { hasIntent:false, wait:250, timeout:-1 };
			    lola.data.set( target, data, ns, true );
			}
			return data;
		},
		setWaitTime:function( target, time ){
			var data = lola.event.hooks.hover.getData( target );
			data.wait = time;
		},
		mouseOver: function( event ){
			//console.log('hover.mouseover');
			lola.event.addListener( event.currentTarget, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( event.currentTarget );
			data.hasIntent = true;
			if (data.timeout < 0)
				data.timeout = setTimeout( lola.event.hooks.hover.confirm, data.wait, event.currentTarget )
		},
		mouseOut: function( event ){
			//console.log('hover.mouseout')
			lola.event.removeListener( event.currentTarget, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( event.currentTarget );
			data.hasIntent = false;
		},
		confirm: function( target ){
			//console.log('hover.confirm')
			lola.event.removeListener( target, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( target );
			data.timeout = -1;
			if (data.hasIntent){
				lola.event.trigger( target, lola.event.hooks.hover.event );
			}
		},
		add: function( target, type, handler, useCapture, priority, scope ){
			var uid = lola.event.addListener( target, lola.event.hooks.hover.event, handler, useCapture, priority, scope );
			lola.event.hooks.hover.getData( target );
			lola.event.addListener( target, 'mouseover', lola.event.hooks.hover.mouseOver );
			return uid;
		},
		remove: function( target, type, handler, useCapture ){
			var edata = lola.data.get( target, lola.event.dataNs );
			lola.event.removeListener(target, lola.event.hooks.hover.event, handler, useCapture );
			var phase = lola.event.phaseString( target, useCapture );
			if (edata[phase][lola.event.hooks.hover.event] == null || Object.keys(edata[phase][lola.event.hooks.hover.event]).length == 0){
				lola.event.removeListener( target, 'mouseover', lola.event.hooks.hover.mouseOver );
				lola.data.remove( target, 'eventHover' );
			}
		}
	};

	Module.hooks['mouseenterstate'] = {
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
		add: function( target, type, handler, useCapture, priority, scope ){
			//IE has it already
			if (!lola.support.msEvent) {
				//deal with other browsers
				lola.event.addListener( target, 'mouseover', lola.event.hooks.mouseenterstate.mouseOver, useCapture, priority, scope );
				lola.event.addListener( target, 'mouseout', lola.event.hooks.mouseenterstate.mouseOut, useCapture, priority, scope );
			}
			return lola.event.addListener( target, lola.event.hooks.mouseenterstate.getEnhancedType( type ), handler, useCapture, priority, scope );
		},
		remove: function( target, type, handler, useCapture ){

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

	Module.hooks['mouseleave'] = Module.hooks['mouseenterstate'];
	Module.hooks['mouseenter'] = Module.hooks['mouseenterstate'];

	lola.registerModule( Module );

})( lola );
/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: JSON
 *  Description: JSON parsing engine
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {
		//==================================================================
		// Attributes
		//==================================================================
		//module namespace
		namespace: 'json',

		//dependencies
		dependencies: ['util'],

		//initialization flag
		initialized: false,

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
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.json.initialized ) {
				//console.info('lola.json.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				//setup toJason on built-in classes
				if ( typeof Date.prototype.toJSON !== 'function' ) {
					Date.prototype.toJSON = function ( key ) {
						return isFinite( this.valueOf() ) ?
								this.getUTCFullYear() + '-' +
										lola.util.padInt( this.getUTCMonth() + 1 ) + '-' +
										lola.util.padInt( this.getUTCDate() ) + 'T' +
										lola.util.padInt( this.getUTCHours() ) + ':' +
										lola.util.padInt( this.getUTCMinutes() ) + ':' +
										lola.util.padInt( this.getUTCSeconds() ) + 'Z' : null;
					};

					String.prototype.toJSON =
							Number.prototype.toJSON =
									Boolean.prototype.toJSON = function ( key ) {
										return this.valueOf();
									};
				}

				//set initialization flag
				lola.json.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// escapeQuotes
		//------------------------------------------------------------------
		_escapeQuotes: function ( string ) {
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


		//------------------------------------------------------------------
		// _str: Produce a string from holder[key].
		//------------------------------------------------------------------
		_str: function ( key, holder ) {
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
					return this._escapeQuotes( value );

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
							partial[i] = this._str( i, value ) || 'null';
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
								v = this._str( k, value );
								if ( v ) {
									partial.push( this._escapeQuotes( k ) + (this.gap ? ': ' : ':') + v );
								}
							}
						}
					}
					else {
						// Otherwise, iterate through all of the keys in the object.
						for ( k in value ) {
							if ( Object.hasOwnProperty.call( value, k ) ) {
								v = this._str( k, value );
								if ( v ) {
									partial.push( this._escapeQuotes( k ) + (this.gap ? ': ' : ':') + v );
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

		//------------------------------------------------------------------
		// encode: stringify alias
		//------------------------------------------------------------------
		encode: function ( obj ) {
			return lola.json.stringify( obj );
		},

		//------------------------------------------------------------------
		// decode: parse alias
		//------------------------------------------------------------------
		decode: function ( text ) {
			return lola.json.parse( text );
		},

		//------------------------------------------------------------------
		// stringify: Produce a string from value
		//------------------------------------------------------------------
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
			return this._str( '', {'': value} );

		},


		//------------------------------------------------------------------
		// parse: parse a js object from JSON string
		//------------------------------------------------------------------
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
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

		}

	};

	lola.registerModule( Module );
})( lola );


/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Color conversions
 *  Description: color conversion module
 *          Author: Copyright 2011, Tyler Beck
 *
 *  ALL HSL && RGB colors are passed as 0-1 values!
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "math.color",

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
			if ( !lola.math.color.initialized ) {
				//console.info( 'lola.math.color.initialize' );

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );


				lola.math.color.initialized = true;
			}
		},


		//------------------------------------------------------------------
		// rgb2int: converts red,green,blue values to a int
		//------------------------------------------------------------------
		rgb2int: function( r, g, b ) {
			//make sure values are in range
			r = (r < 0) ? 0 : r;
			r = (r > 1) ? 1 : r;
			g = (g < 0) ? 0 : g;
			g = (g > 1) ? 1 : g;
			b = (b < 0) ? 0 : b;
			b = (b > 1) ? 1 : b;

			var u = (Math.round( r * 255 ) << 16 ) | (Math.round( g * 255 ) << 8 ) | ( Math.round( b * 255 ) );

			return u;
		},

		//------------------------------------------------------------------
		// rgb2hsl: converts red,green,blue values to hue,saturation,lightness
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// rgb2hex: converts red,green,blue values to hex string
		//------------------------------------------------------------------
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

			var lku = []
			lku[0] = (red - (red % 16)) / 16;
			lku[1] = red % 16;
			lku[2] = (green - (green % 16)) / 16;
			lku[3] = green % 16;
			lku[4] = (blue - (blue % 16)) / 16;
			lku[5] = blue % 16;

			for ( var i in lku ) {
				str += digits[ lku[i] ];
			}

			return str;
		},

		//------------------------------------------------------------------
		// hsl2rgb: converts hue,saturation,lightness values to red,green,blue
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// hsl2int: converts hue,saturation,lightness values to int
		//------------------------------------------------------------------
		hsl2int: function( h, s, l ) {
			var rgb = hsl2rgb( h, s, l );
			return lola.math.color.rgb2int( rgb.r, rgb.g, rgb.b );
		},

		//------------------------------------------------------------------
		// hsl2hex: converts hue,saturation,lightness values to hex string
		//------------------------------------------------------------------
		hsl2hex: function( h, s, b ) {
			var rgb = hsl2rgb( h, s, l );
			return lola.math.color.rgb2hex( rgb.r, rgb.g, rgb.b );
		},

		//------------------------------------------------------------------
		// int2rgb: converts int values to red,green,blue
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// int2hsl: converts int values to hue,saturation,lightness
		//------------------------------------------------------------------
		int2hsl: function( value ) {
			var rgb = int2rgb( value );
			return lola.math.color.rgb2hsl( rgb.r, rgb.g, rgb.b );
		},

		//------------------------------------------------------------------
		// int2hex: converts int values to hex string
		//------------------------------------------------------------------
		int2hex: function( value ) {
			var rgb = int2rgb( value );
			return lola.math.color.rgb2hex( rgb.r, rgb.g, rgb.b );
		},

		//------------------------------------------------------------------
		// hex2int: converts hex color string value to int
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// hex2rgb: converts hex string value to red,green,blue
		//------------------------------------------------------------------
		hex2rgb: function( value ) {
			return lola.math.color.int2rgb( lola.math.color.hex2int( value ) );
		},

		//------------------------------------------------------------------
		// hex2hsl: converts hex string value to hue,saturation,lightness
		//------------------------------------------------------------------
		hex2hsl: function( value ) {
			return lola.math.color.int2hsl( lola.math.color.hex2int( value ) );
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

		}

	};
	lola.registerModule( Module );
})( lola );
/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Math
 *  Description: math module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "math",

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
			if ( !lola.math.initialized ) {
				//console.info('lola.math.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				lola.math.initialized = true;
			}
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

			maxValue: function( getVal ) {
				return this.compareValues( getVal, Math.max, 0 );
			},

			minValue: function( getVal ) {
				return this.compareValues( getVal, Math.min, 0xFFFFFF );
			},

			totalValue: function( getVal ) {
				return this.compareValues( getVal, function( a, b ) {
					return a + b;
				}, 0 );
			},

			avgValue: function( getVal ) {
				return this.totalValue( getVal ) / this.elements.length;
			},


			summaryValue: function( type, getVal ) {
				if ( typeof type === 'number' ) {
					return this.valueAtIndex( getVal, type );
				}
				else {
					switch ( type ) {
						case 'min':
							return this.minValue( getVal );
							break;
						case 'max':
							return this.maxValue( getVal );
							break;
						case 'avg':
							return this.avgValue( getVal );
							break;
						default:
							return this.totalValue( getVal );
							break;
					}
				}
				return 0;
			}

		}

	};

	lola.registerModule( Module );
})( lola );
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
		namespace: "math.tvm",

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
			if ( !lola.math.tvm.initialized ) {
				//console.info('lola.math.tvm.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );


				lola.math.tvm.initialized = true;
			}
		},


		//------------------------------------------------------------------
		// PV: Present Value
		//------------------------------------------------------------------
		PV: function( FV, RATE, TERM ) {
			return FV / Math.pow( 1 + RATE, TERM );
		},

		//------------------------------------------------------------------
		// FV: Future Value
		//------------------------------------------------------------------
		FV: function( PV, RATE, TERM ) {
			return PV * Math.pow( 1 + RATE, TERM );
		},


		//------------------------------------------------------------------
		// PVA: Present Value of an Annuity
		//------------------------------------------------------------------
		PVA: function( A, RATE, TERM ) {
			return A * (1 - ( 1 / Math.pow( 1 + RATE, TERM ) ) ) / RATE;
		},

		//------------------------------------------------------------------
		// FVA: Future Value of an Annuity
		//------------------------------------------------------------------
		FVA: function( A, RATE, TERM ) {
			return A * (Math.pow( 1 + RATE, TERM ) - 1) / RATE;
		},

		//------------------------------------------------------------------
		// Payment: Payment For a loan with the given parameters
		//------------------------------------------------------------------
		Payment: function( PV, RATE, TERM, FV ) {
			var rp = Math.pow( 1 + RATE, TERM );
			return  PV * RATE / ( 1 - (1 / rp)) - FV * RATE / (rp - 1);
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {


		}

	};
	lola.registerModule( Module );
})( lola );
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

/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Support
 *  Description: support module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "support",

		//module dependencies
		dependencies: [],

		//initialization flag
		initialized: false,

		// can script text nodes be appended to script nodes
		domEval: false,

		// can delete expando properties (set later)
		deleteExpando: true,

		// event model
		domEvent: false,

		// event model
		msEvent: false,

		//browser animation frame timing
		browserAnimationFrame: false,

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.support.initialized ) {
				//console.info( 'lola.support.initialize' );

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				lola.support.initialized = true;
			}
		}
	};


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
		Module.domEval = true;
		delete window[ uid ];
	}

	//create test div and test helpers for support tests
	var div = document.createElement( 'div' );
	var html = function( val ) {
		div.innerHTML = val;
	};


	html( "<div style='color:black;opacity:.25;float:left;background-color:rgba(255,0,0,0.5);' test='true'>test</div>" );
	var target = div.firstChild;
	var support = {

		//IE returns style object
		style: (typeof target.getAttribute( 'style' ) === 'string'),

		//account for web-kit locale bug
		// this is supported in modern browsers no need to test
		//opacity: /^0[\.,]25$/.test( target.style.opacity ),

		//float is reserved check whether to user cssFloat or styleFloat
		cssFloat: /^left$/.test( target.style.cssFloat ),

		//check color alpha channel support
		colorAlpha: /^rgba.*/.test( target.style.backgroundColor )

	};

	lola.extend( Module, support, true );

	//check for deletion of expando properties
	try {
		delete target.test;
	}
	catch( e ) {
		Module.deleteExpando = false;
	}

	//Event Model
	if ( document.addEventListener )
		Module.domEvent = true;
	else if ( document.attachEvent )
		Module.msEvent = true;


	lola.registerModule( Module );
})( lola );

/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Template
 *  Description: templating engine
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {
		//==================================================================
		// Attributes
		//==================================================================
		//module namespace
		namespace: 'template',

		//dependencies
		dependencies: [],


		//place-holders
		delimiters: ['${','{'],
		escapedDelimiters: ['\\$\\{','\\}'],
		indexId: "INDEX",

		//templates
		map: {},

		//hooks
		hooks: {},

		//initialization flag
		initialized: false,

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.template.initialized ) {
				//console.info('lola.template.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );


				lola.template.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// addHook - adds replacement value hook
		//------------------------------------------------------------------
		addHook: function( name, fn ) {
			if ( typeof fn === 'function' ) {
				lola.template.hooks[name] = fn;
			}
			else {
				throw new TypeError( 'expected function, got ' + fn );
			}
		},

		//------------------------------------------------------------------
		// load
		//------------------------------------------------------------------
		load: function( node ) {
			var children = node.childNodes;
			if ( children ) {
				for ( var i = 0; i < children.length; i++ ) {
					var child = children[i];
					//check if valid template node
					if ( child.nodeName == 'DIV' ) {
						var id = child['id'].replace( /\-template/g, "" );

						if ( $( child ).hasClass( 'table-content' ) ) {
							//this is a special case (search "table innerHTML" for details)
							//get the contents of the table body
							child = child.getElementsByTagName( 'tbody' )[0];
						}
						var template = lola.template.create( unescape( lola.unencode( child.innerHTML ) ) );
						lola.template.map[ id ] = template;

					}
				}
			}
		},

		//------------------------------------------------------------------
		// break string into template definition
		//------------------------------------------------------------------
		create: function( str ) {
			var ed = lola.template.escapedDelimiters;
			var d = lola.template.delimiters;
			var ind = lola.template.indexId;

			//uncomment scripts
			str = str.replace( /\<\!\-\-SCRIPT/g, "\<script language='javascript' type='text/javascript'\>" );
			str = str.replace( /SCRIPT\-\-\>/g, "\<\/script\>" );

			//remove comments (no comments should be in templates)
			str = str.replace( /\<\!\-\-/g, "" );
			str = str.replace( /\-\-\>/g, "" );

			//get insert points
			var fpatt = new RegExp( "(" + ed[0] + ")" + "([^" + ed[1] + "]+)" + "(" + ed[1] + ")" );
			var spatt = new RegExp( /([^\(]+)\(?([^\)]*)?\)?\|?([a-zA-Z0-9\-_\|]*)/ );
			var olpatt = new RegExp( /[^\[]+\[[^\]]+\],?/g );
			var opatt = new RegExp( /([^\[]+)\[([^\]]+)\],?/ );
			var index = str.search( fpatt );
			var builder = [];
			while ( index >= 0 ) {
				var result = str.match( fpatt );
				var tag = result[2];
				var parts = tag.match( spatt );
				var opts = false;
				if ( parts[2] && parts[2] != "" ) {
					var list = parts[2].match( olpatt );
					if ( list ) {
						opts = {};
						for ( var i = 0; i < list.length; i++ ) {
							var oparts = list[i].match( opatt );
							opts[oparts[1]] = oparts[2];
						}
					}
				}
				var hooks = false;
				if ( parts[3] && parts[3] != "" ) {
					hooks = parts[3].split( "|" );
				}
				builder.push( str.substring( 0, index ) );
				builder.push( {index:index, property:"" + parts[1], options:opts, hooks:hooks} );
				str = str.substring( index + result[0].length );

				//get next insertion index
				index = str.search( fpatt );
			}
			builder.push( str );

			return builder;
		},

		//------------------------------------------------------------------
		// applyHooks - applies insert's hooks on value
		//------------------------------------------------------------------
		applyHooks: function( value, obj, index ) {

			for ( var key in obj.hooks ) {
				var fn = lola.page.hooks[ obj.hooks[key] ];
				if ( fn )
					value = fn( value, obj, index );
			}

			return value;
		},

		//------------------------------------------------------------------
		// apply - recursively applies data to template;
		//		   returns string
		//------------------------------------------------------------------
		apply: function( name, data, ordinal ) {
			if ( ordinal == null )
				ordinal = 0;

			if ( lola.template.map[ name ] != null ) {
				return lola.template.process( lola.template.map[ name ], data, ordinal );
			}
			else throw new Error( "Unknown template: " + name );

		},

		//------------------------------------------------------------------
		// process - recursively applies data to template
		//		   string; returns string
		//------------------------------------------------------------------
		process: function( builder, data, index ) {
			if ( index == null )
				index = 0;

			var built = [];

			if ( builder.length > 0 ) {
				for ( var part in builder ) {
					if ( !lola( builder[part] ).isString() ) {
						//get part
						var obj = builder[part];

						//get data value
						var value = (obj.property == lola.template.indexId) ? index : data[obj.property];
						if ( obj.hooks )
							value = lola.template.applyHooks( value, obj, index );
						if ( value == null ) value = "";

						var subtmp;

						//get replacement value
						switch ( $( value ).getType() ) {
							case 'number':
							case 'string':
							case 'boolean':
								if ( insert.options == null ) {
									built.push( value );
								}
								else {
									var enumVal = insert.options[ value ];
									if ( enumVal == null )
										enumVal = insert.options['DEFAULT'];
									if ( enumVal == null )
										enumVal = "";
									built.push( enumVal );
								}
								break;

							case 'object':
								subtmp = insert.options['TEMPLATE'];
								if ( subtmp )
									built.push( lola.template.apply( subtmp, value ) );
								break;

							case 'array':
								subtmp = insert.options['TEMPLATE'];
								if ( subtmp ) {
									if ( value.length > 0 ) {
										var n = 0;
										do {
											built.push( lola.template.apply( subtmp, value[n], n ) );
											n++;
										}
										while ( n < list.length );
									}
								}
								break;

							default:
								break;
						}
					}
					else {
						built.push( args );
					}

				}
			}

			return built.join();
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			applyTemplate: function( name, data ){
				html = lola.template.apply( name, data );
				this.html( html );
			}
		}

	};

	lola.registerModule( Module );
})( lola );

/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Tweening
 *  Description: tween module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "tween",

		//module dependencies
		dependencies: ['array','ease', 'math.color'],

		//initialization flag
		initialized: false,

		//tween ids
		idSequence: 1,
		unusedIds: [],

		//tween stacks map
		//    map[ tweenId ][ property ] = stack;
		map: {},
		index: {}, //index[tweenId] = target;

		//tween property initializers / proxies
		//type: { proxy:[function valueTweenProxy],
		//        parse:[function valueParser],
		//        canTween:[function valueComparison],
		//        getDelta:[function valueComparison],
		//        match:[regex useThisTypeTest] }
		types: [],
		hooks: {},

		//animation frame function type
		getFrameType: 0,

		//animation frame delay (ms) for non-optimized animations
		tickDelay: 30,

		//last time a tick was executed
		lastTick: 0,
		deltaTick: 0,
		currentTick: 0,


		//==================================================================
		// Classes
		//==================================================================
		//------------------------------------------------------------------
		// Instance - tweens a single property on a single target
		//------------------------------------------------------------------
		TweenInstancePrototype: {
			//object on which to tween property
			target: null,
			//property to tween
			property: null,
			//property is setter
			type: null,
			//easing method
			easing: null,
			//epoch time of animation start
			startTime: 0,
			//length of animation in millis
			duration: 500,
			//from value
			from: null,
			//to value
			to: null,
			//value change (non proxy only)
			delta: null,
			//value calculation proxy
			proxy: false,
			//animation status [waiting: -1, hold: 0, active: 1, processing complete: 2 ]
			status: -1,
			//value getter/setter
			getSet:null,
			//last calculated value
			value:null,

			//create tween instance amount = {(to |&&| from) || delta)
			init: function( target, property, amount, delay, duration, easing, getSet ) {
				//console.info( 'lola.tween.Instance.init: ' + target + ', ' + property  );
				//check required values
				if ( target && property && amount ) {
					this.target = target;
					this.property = property;
				}
				else {
					throw new Error( 'invalid values' );
				}

				// try to get a value for to
				var deltaMethod = 0;
				if ( amount.to == null || amount.to == undefined ) {
					if ( amount.add ) {
						this.to = amount.add;
						deltaMethod = 1;
					}
					else if ( amount.subtract ) {
						this.to = amount.subtract;
						deltaMethod = -1;
					}
					else if ( getSet ) {
						this.to = getSet.call( this, target, property );
					}
					else {
						this.to = target[ property ];
					}
				}
				else {
					this.to = amount.to;
				}

				// try to get a value for from
				if ( amount.from == null || amount.from == undefined ) {
					if ( getSet ) {
						this.from = getSet.call( this, target, property );
					}
					else {
						this.from = target[ property ];
					}
				}
				else {
					this.from = amount.from;
				}

				//set initial value;
				this.value = this.from;

				//set attributes
				this.easing = lola.ease.get( easing );
				this.duration = (duration) ? parseInt( duration ) : 500;
				this.startTime = 0 - ((delay) ? parseInt( delay ) : 0);
				this.getSet = getSet;


				//determine how to tween values
				var ttype;
				if ( lola.tween.hooks[ property ] ) {
					ttype = lola.tween.hooks[ property ];
					//console.info('   tween type: using hook -> '+property);
				}
				else {
					for ( var i in lola.tween.types ) {
						ttype = lola.tween.types[i];
						if ( ttype.match.test( String( this.to ) ) && ttype.match.test( String( this.from ) ) ) {
							//console.info('   tween type: using indexed -> '+i);
							break;
						}
						else {
							ttype = null;
						}
					}
				}

				if ( ttype ) {
					// test parsed objects to see if they can be tweened
					if ( !ttype.canTween( this.from, this.to ) ) {
						ttype = null;
					}
					else {
						this.to = ttype.parse( this.to );
						this.from = ttype.parse( this.from );
						this.delta = ttype.getDelta( this.to, this.from, deltaMethod );
					}
				}

				if ( ttype == null ) {
					//if no tween type has been found use setAfter
					//console.info('   null tween type: using setBeforeAndAfter');
					ttype = { proxy: lola.tween.setBeforeAndAfterProxy };
				}

				this.proxy = ttype.proxy;

				//console.info( this );

				return this;
			},

			//calculates next value
			process: function() {
				var elapsed = lola.tween.currentTick - this.startTime;
				//console.info('  process: '+elapsed+'/'+this.duration );
				if ( elapsed >= this.duration ) {
					elapsed = this.duration;
					//mark processing complete
					this.status = 2;
				}
				//console.info(this);
				if ( this.proxy )
					this.value = this.proxy( this.easing, elapsed, this.to, this.from, this.delta, this.duration );
				else
					this.value = this.easing.call( this, elapsed, this.from, this.delta, this.duration );
			},

			//apply current value
			applyValue: function() {
				if ( this.value != null ) {
					if ( this.getSet )
						this.getSet( this.target, this.property, this.value );
					else
						this.target[ this.property ] = this.value;
				}

				return true;
			},

			//executes frame - returns whether tween is complete or not
			execute: function() {
				//console.info('execute: '+this.status);
				if ( this.status == 1 ) {
					//active tween
					this.process( lola.tween.currentTick );
				}
				else if ( this.status == 0 ) {
					//hold tween by adding delta to start
					this.startTime += lola.tween.deltaTick;
				}
				else if ( this.status == 2 ) {
					//processing complete
					return false;
				}
				else {
					//new or delayed tween, set value and start time
					if ( this.startTime < 0 )
						this.startTime += lola.tween.deltaTick;
					else {
						this.startTime = lola.tween.currentTick;
						this.status = 1;
					}
				}

				//again
				return true;

			}

		},

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.tween.initialized ) {
				//console.info( 'lola.tween.initialize' );

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				//get optimized animation timer function
				if ( window.requestAnimationFrame )
					lola.tween.getFrameType = 1;
				if ( window.mozRequestAnimationFrame )
					lola.tween.getFrameType = 2;
				else if ( window.webkitRequestAnimationFrame )
					lola.tween.getFrameType = 3;
				else if ( window.oRequestAnimationFrame )
					lola.tween.getFrameType = 4;

				lola.support.browserAnimationFrame = lola.tween.getFrameType > 0;


				//setup tween types
				var simpleTween = {
					match: lola.type.rIsNumber,
					parse: function( val ) {
						return parseFloat( val );
					},
					canTween: function( a, b ) {
						return (a!=undefined && b!=undefined) && (a!=null && b!=null)
					},
					getDelta: function( to, from, method ) {
						if ( method == 0 )
							return to - from;
						else if ( method == 1 )
							return to;
						else
							return 0 - to;
					},
					proxy: null
				};

				var dimensionalTween = {
					match: lola.type.rIsDimension,
					parse: function( val ) {
						var parts = String( val ).match( lola.type.rIsDimension );
						return { value: parseFloat( parts[1] ), units: parts[2] };
					},
					canTween: function( a, b ) {
						return (a!=undefined && b!=undefined) && (a!=null && b!=null) && (a.units == b.units) ;
					},
					getDelta: function( to, from, method ) {
						if ( method == 0 )
							return {value:to.value - from.value, units:to.units};
						else if ( method == 1 )
							return {value:to.value, units:to.units};
						else
							return {value:0 - to.value, units:to.units};
					},
					proxy: function( easing, elapsed, to, from, delta, duration ) {
						return ( "" + easing( elapsed, from.value, delta.value, duration ) + delta.units);
					}
				};

				var colorTween = {
					match: lola.type.rIsColor,
					parse: lola.css.parseColor,
					canTween: function( a, b ) {
						return ( a && b );
					},
					getDelta: function( to, from, method ) {
						if ( method == 0 )
							return {r:to.r - from.r, g:to.g - from.g, b:to.b - from.b, a:to.a - from.a };
						else if ( method == 1 )
							return {r:to.r, g:to.g, b:to.b, a:to.a };
						else
							return {r:0 - to.r, g:0 - to.g, b:0 - to.b, a:0 - to.a };

					},
					proxy: function( easing, elapsed, to, from, delta, duration ) {
						var r = Math.floor( easing( elapsed, from.r, delta.r, duration ) * 255 );
						var g = Math.floor( easing( elapsed, from.g, delta.g, duration ) * 255 );
						var b = Math.floor( easing( elapsed, from.b, delta.b, duration ) * 255 );
						var a = easing( elapsed, from.a, delta.a, duration );
						//console.info('  rgb('+r+','+g+','+b+')');
						if ( lola.support.colorAlpha )
							return "rgba(" + [r,g,b,a].join( ',' ) + ")";
						else
							return "rgb(" + [r,g,b].join( ',' ) + ")";
					}
				};

				lola.tween.types.push( simpleTween, dimensionalTween, colorTween );

				//set up tween classes

				var TweenInstance = function ( target, property, type, amount, delay, duration, easing, setter ) {
					return this.init( target, property, type, amount, delay, duration, easing, setter );
				};
				TweenInstance.prototype = lola.tween.TweenInstancePrototype;
				lola.setProperty( lola, "tween", 'TweenInstance', TweenInstance );

				lola.tween.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// getNextTweenId - gets next available tweenID
		//------------------------------------------------------------------
		getNextTweenId: function() {
			if ( lola.tween.unusedIds.length > 0 )
				return lola.tween.unusedIds.pop();
			else
				return lola.tween.idSequence++;
		},

		//------------------------------------------------------------------
		// get next frame
		//------------------------------------------------------------------
		getFrame: function() {
			// firefox 4 throws exception unless get frame is done like this
			switch ( lola.tween.getFrameType ) {
				case 1:
					lola.window.requestAnimationFrame( lola.tween.tick );
					break;
				case 2:
					lola.window.mozRequestAnimationFrame( lola.tween.tick );
					break;
				case 3:
					lola.window.webkitRequestAnimationFrame( lola.tween.tick );
					break;
				case 4:
					lola.window.oRequestAnimationFrame( lola.tween.tick );
					break;
				default:
					setTimeout( lola.tween.tick, lola.tween.tickDelay );
					break;
			}

		},

		//------------------------------------------------------------------
		// tick - execute tween stack
		//------------------------------------------------------------------
		tick: function() {
			//dispatch tick event
			//lola.event.trigger( this, 'tweenTick', false, false );

			//set ticks
			var now = new Date();
			lola.tween.currentTick = now.getTime();

			if ( lola.tween.lastTick == 0 )
				lola.tween.lastTick = lola.tween.currentTick;
			lola.tween.deltaTick = lola.tween.currentTick - lola.tween.lastTick;

			//apply & calculate values
			var again = lola.tween.executeFrame();
			//console.info('    again: '+again);

			//request next animation frame if stack has items
			if ( again ) {

				lola.tween.getFrame();
				lola.tween.lastTick = lola.tween.currentTick;
			}
			else {
				//nothing left to animate reset everything
				lola.tween.map = {};
				lola.tween.lastTick = lola.tween.currentTick = 0;
			}
		},

		//------------------------------------------------------------------
		// pruneMap - cleans null items from map
		//------------------------------------------------------------------
		pruneMap: function() {
			for ( var id in lola.tween.map ) {
				var hasProps = false;
				for ( var prop in lola.tween.map[id] ) {
					var tmp = [];
					var instance;
					while ( instance = lola.tween.map[id][prop].pop() ) {
						if ( instance != null )
							tmp.push( instance );
					}
					lola.tween.map[id][prop] = tmp;
					if ( lola.tween.map[id][prop].length > 0 )
						hasProps = true;
					else
						delete lola.tween.map[id][prop];
				}
				if ( !hasProps ) {
					lola.event.trigger( lola.tween.index[id], 'tweenComplete', false, false );
					lola.tween.releaseId( id );
				}
			}
		},

		//------------------------------------------------------------------
		// foreach - iterates tween map
		//------------------------------------------------------------------
		foreach: function( callback ) {
			var result = false;
			for ( var id in lola.tween.map ) {
				for ( var prop in lola.tween.map[id] ) {
					for ( var index in lola.tween.map[id][prop] ) {
						result = callback.apply( lola.tween, [ id, prop, index ] ) || result;
					}
				}
			}
			return result;
		},

		//------------------------------------------------------------------
		// applyValue - applies preprocessed value to tweened object
		//------------------------------------------------------------------
		applyValue: function( id, prop, index ) {
			var instance = lola.tween.map[id][prop][index];
			if ( instance ) {
				//console.info('applyValue ---------------');
				//console.info(instance);
				instance.applyValue();
			}
		},

		//------------------------------------------------------------------
		// processNextValue
		//------------------------------------------------------------------
		processNextValue: function( id, prop, index ) {
			var instance = lola.tween.map[id][prop][index];
			var again = false;
			if ( instance ) {
				//console.info('processNextValue ---------------');
				//console.info(instance);
				again = instance.execute();
			}
			if ( !again ) {
				delete lola.tween.map[id][prop][index];
			}
			//console.info('    again: '+again);
			return again;
		},

		//------------------------------------------------------------------
		// releaseId - releases tween id for use by another object
		//------------------------------------------------------------------
		releaseId: function( id ) {
			delete lola.tween.map[id];
			delete lola.tween.index[id];
			//TODO: fix tweenId recycling
			//lola( '*[tweenId="' + id + '"]' ).deleteExpando( 'tweenId' );
			//lola.tween.unusedIds.push( id );
		},

		//------------------------------------------------------------------
		// executeFrame - executes all active tweens
		//------------------------------------------------------------------
		executeFrame: function() {
			//apply values
			//console.info('execute frame ----------------');
			lola.tween.foreach( lola.tween.applyValue );
			var again = lola.tween.foreach( lola.tween.processNextValue );
			lola.tween.pruneMap();
			return again;
		},

		//------------------------------------------------------------------
		// setBeforeAndAfterProxy - sets non tweenables values in tweens
		//------------------------------------------------------------------
		setBeforeAndAfterProxy: function( easing, elapsed, to, from, delta, duration ) {
			if ( elapsed < duration )
				return from;
			else
				return to;
		},

		//------------------------------------------------------------------
		// start - starts tweens
		//------------------------------------------------------------------
		start: function( objects, properties, delay, duration, easing, collisions ) {
			//console.info('starting tween on '+objects.length+' objects');
			if ( lola.type.get( objects ) != 'array' )
				objects = [objects];

			//set collisions
			collisions = collisions === true;

			//iterate through objects
			objects.every( function( item ) {
				//get identifier for object
				if ( item.tweenId == null )
					item.tweenId = lola.tween.getNextTweenId();

				//add to index
				lola.tween.index[ item.tweenId ] = item;

				//console.info('object.tweenId:'+item.tweenId);
				//iterate properties
				for ( var prop in properties ) {
					var amount = {};
					if ( prop == 'style' ) {
						//iterate style properties
						var styles = properties['style'];
						for ( var style in styles ) {
							amount = {};
							if ( lola.type.get( styles[style] ) == 'object' ) {
								amount = styles[style];
							}
							else
								amount = {to:styles[style]};

							var styleinstance = new lola.tween.TweenInstance( item, style, amount, delay, duration, easing, lola.css.style );
							lola.tween.addTweenInstance( styleinstance, collisions );
						}
					}
					else {
						if ( lola.type.get( properties[prop] ) == 'object' ) {
							amount = properties[prop];
						}
						else
							amount = {to:properties[prop]};

						var instance = new lola.tween.TweenInstance( item, prop, amount, delay, duration, easing, null );
						lola.tween.addTweenInstance( instance, collisions );
						lola.event.trigger( instance.target, 'tweenStart', false, false );

					}
				}
			}, lola.tween );

			//start frame
			if ( lola.tween.currentTick == 0 )
				lola.tween.getFrame();

		},

		//------------------------------------------------------------------
		// addTweenInstance
		//------------------------------------------------------------------
		addTweenInstance: function( instance, allowCollisions ) {
			//add instance to execution list
			//console.info('addTweenInstance -------');
			//console.info(instance);
			if ( instance.target.tweenId ) {
				var id = instance.target.tweenId;
				var prop = instance.property;

				if ( !lola.tween.map[ id ] )
					lola.tween.map[ id ] = {};
				if ( !lola.tween.map[ id ][ prop ] ) {
					//just add instance and return
					lola.tween.map[ id ][ prop ] = [instance];
				}
				else {
					if ( allowCollisions )
						lola.tween.map[ id ][ prop ].push( instance );
					else
						lola.tween.map[ id ][ prop ] = [ instance ];

				}
			}
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			tween: function( properties, delay, duration, easing, collisions ) {
				this.foreach( function( element ) {
					lola.tween.start( element, properties, delay, duration, easing, collisions );
				} );
				return this;
			}
		}

	};
	lola.registerModule( Module );
})( lola );
/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Type
 *  Description: type module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "type",

		//module dependencies
		dependencies: ['array'],

		//initialization flag
		initialized: false,

		//raw lists
		objTypes: "String Number Date Array Boolean RegExp Function Object",
		tagTypes: "a abbr acronym address applet area b base basefont bdo big blockquote body br button caption center cite code col colgroup dd del dfn dir div dl dt em fieldset font form frame frameset head h1 h2 h3 h4 h5 h6 hr html i iframe img input ins kbd label legend li link map menu meta noframes noscript ol optgroup option p param pre q s samp script select small span strike strong style sub sup table tbody td textarea tfoot th thead title tr tt u ul var",
		specialTagTypes:"object",
		//map of toString types -> element type
		map: {},

		//regex expressions
		rIsNumber: /^-?\d*(?:\.\d+)?$/,
		rIsDimension: /^(-?\d*(?:\.\d+)?)(%|in|cm|mm|em|ex|pt|pc|px)$/,
		rIsColor: /^(#|rgb|rgba|hsl|hsla)(.*)$/,
		rIsHexColor: /^#([A-F0-9]{3,6})$/,
		rIsRGBColor: /^rgba?\(([^\)]+)\)$/,
		rIsHSLColor: /^hsla?\(([^\)]+)\)$/,


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.type.initialized ) {
				//console.info('lola.'+this.namespace+'.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				lola.type.createMap();

				lola.type.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// creates map of object and element types
		//------------------------------------------------------------------
		createMap: function() {
			//console.info( "Type Module: createMap" );
			lola.foreach( lola.type.tagTypes.split( " " ), lola.type.mapTag );
			lola.foreach( lola.type.specialTagTypes.split( " " ), lola.type.mapSpecialTag );
			lola.foreach( lola.type.objTypes.split( " " ), lola.type.mapObject );
			var tn = document.createTextNode( 'test' );
			var cn = document.createComment( 'test' );
			var tntype = lola.toString.call( tn );
			var cntype = lola.toString.call( cn );
			lola.type.map[ tntype ] = 'textnode';
			lola.type.map[ cntype ] = 'commentnode';
			//TODO: add isTextNode and isCommentNode selector functions
		},

		//------------------------------------------------------------------
		// maps tag type
		//------------------------------------------------------------------
		mapTag: function( item, index ) {
			var tag = document.createElement( item );
			var type = lola.toString.call( tag );
			var name = type.replace( /\[object HTML/g, "" ).replace( /Element\]/g, "" );
			name = name == "" ? "Element" : name;
			lola.type.map[ type ] = name.toLowerCase();
			var isfn = "Selector.prototype['is" + name + "'] = " +
					"function(index){ return this.isType('" + name.toLowerCase() + "',index); };";
			lola.evaluate( isfn );
		},

		//------------------------------------------------------------------
		// maps special tag type
		//------------------------------------------------------------------
		mapSpecialTag: function( item, index ) {
			var tag = document.createElement( item );
			var type = lola.toString.call( tag );
			var name = type.replace( /\[object /g, "" ).replace( /Element\]/g, "" ); // keep HTML
			name = name == "" ? "Element" : name;
			lola.type.map[ type ] = name.toLowerCase();
			var isfn = "Selector.prototype['is" + name + "'] = " +
					"function(index){ return this.isType('" + name.toLowerCase() + "',index); };";
			lola.evaluate( isfn );
		},

		//------------------------------------------------------------------
		// maps object type
		//------------------------------------------------------------------
		mapObject: function( item, index ) {
			var type = "[object " + item + "]";
			lola.type.map[ type ] = item.toLowerCase();
			var isfn = "Selector.prototype['is" + item + "'] = " +
					"function(index){ return this.isType('" + item.toLowerCase() + "',index); };";
			lola.evaluate( isfn );
		},

		//------------------------------------------------------------------
		// get - returns type string
		//------------------------------------------------------------------
		get: function( object ) {
			if ( object ) {
				var type = lola.type.map[ lola.toString.call( object ) ];
				if ( type )
					return type;
				return 'other ';
			}
			return 'null'
		},

		//------------------------------------------------------------------
		// list - outputs map str
		//------------------------------------------------------------------
		list: function() {
			var html = "";
			for ( var k in lola.type.map ) {
				html += "<div class='type'><span class='label'>" + k + "</span><span class='value'>" + lola.type.map[k] + "</span></div>";
			}
			return html;
		},


		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			//gets type of specified index
			getType: function( index ) {
				return String( lola.type.get( this.get( index ) ) );
			},

			//checks if specified index is of type
			isType: function( type, index ) {
				return lola.type.is( this.get( index ), type );
			}

			//NOTE: all isType functions are dynamically generated

		}

	};


	lola.registerModule( Module );
})( lola );
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
		namespace: "util",

		//module dependencies
		dependencies: ['array'],

		//initialization flag
		initialized: false,


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.util.initialized ) {
				//console.info('lola.util.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );


				lola.util.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// prioritySort - sorts on priority property
		//------------------------------------------------------------------
		prioritySort: function ( a, b ) {
			var x = a.priority;
			var y = b.priority;
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		},

		//------------------------------------------------------------------
		// isDescendant - determines if a is descendant of b
		//------------------------------------------------------------------
		isDescendant: function ( a, b ) {
			return lola.util.isAncestor( b, a );
		},

		//------------------------------------------------------------------
		// isAncestor - determines if a is ancestor of b
		//------------------------------------------------------------------
		isAncestor: function ( a, b ) {
			var ancestor = b;
			while ( ancestor && (ancestor = ancestor.parentNode) && ancestor.nodeName != "BODY" ) {
				if (a == ancestor) return true;
			}
			return false;
		},

		//------------------------------------------------------------------
		// setStatus - sets window status text
		//------------------------------------------------------------------
		setStatus: function ( val ) {
			val = val || "";
			lola.window.status = val;
			return true;
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			//iterate through values calling iterator to change this.data.value
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
			},


			valueAtIndex: function( getVal, index ) {
				if ( typeof getVal === 'string' )
					return this.elements[index][getVal];
				else if ( typeof getVal === 'function' )
					return getVal.call( this, this.elements[index] );
			}


   		},

		//==================================================================
		// NEW Javascript Functionality
		//==================================================================
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
		}


	};

	Module.upgradeObjectPrototype();
	delete Module.upgradeObjectPrototype;

	lola.registerModule( Module );
})( lola );
/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: XHR
 *  Description: xhr module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "xhr",

		//module dependencies
		dependencies: ['event'],

		//initialization flag
		initialized: false,


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.xhr.initialized ) {
				//console.info('lola.async.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				//request class
				var Request = function( url, method, headers, async, user, password ) {
					return this.init( url, method, headers, async, user, password );
				};
				Request.prototype = lola.xhr.RequestPrototype;
				lola.setProperty( lola, "xhr", 'Request', Request );

				//async request class
				var AsyncRequest = function( url, method, headers, user, password ) {
					return this.init( url, method, headers, true, user, password );
				};
				AsyncRequest.prototype = lola.xhr.RequestPrototype;
				lola.setProperty( lola, "xhr", 'AsyncRequest', AsyncRequest );

				//sync request class
				var SyncRequest = function( url, method, headers, user, password ) {
					return this.init( url, method, headers, true, user, password );
				};
				SyncRequest.prototype = lola.xhr.RequestPrototype;
				lola.setProperty( lola, "xhr", 'SyncRequest', SyncRequest );

				lola.xhr.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// gets the supported request object
		//------------------------------------------------------------------

		//==================================================================
		// RequestPrototype
		//==================================================================
		RequestPrototype:
		{
			url: "",
			method: 'POST',
			headers: [],
			async: true,
			user: null,
			password: null,

			request: false,
			ready: false,

			init: function( url, method, headers, async, user, password ) {
				this.method = method || 'POST';
				this.headers = headers || [];
				this.async = async === true;
				this.url = url;
				this.user = user;
				this.password = password;

				return this;
			},

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
					if ( !Mainline.util.isString( params ) ) {
						var temp = [];
						for ( var k in params ) {
							temp.push( k + "=" + Mainline.util.encode( params[k] ) );
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

			send: function( params ) {
				this.request = this.makeRequest( this.url, params, this.method, this.headers, true, this.readyStateChange, this, this.user, this.password );
			},

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
							lola.event.dispatch( this, 'stateComplete', true, true, this.request );
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

			responseText: function() {
				if ( this.ready )
					return this.request.responseText;
				else
					return false;
			},

			responseXML: function() {
				if ( this.ready )
					return this.request.responseXML;
				else
					return false;
			}

		},



		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

		}



	};
	lola.registerModule( Module );
})( lola );
