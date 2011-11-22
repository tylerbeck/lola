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
				console.log('lola::initialize');
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
			//console.log('lola::getPackage');
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
			//console.log('lola::extend');
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
			console.log('lola::registerModule - ' + module.getNamespace() );
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
			//console.log('lola::safeDelete');
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


/**
 * @license
 * Sizzle CSS Selector Engine
 *  Copyright 2011, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	expando = "sizcache" + (Math.random() + '').replace('.', ''),
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true,
	rBackslash = /\\/g,
	rReturn = /\r\n/g,
	rNonWord = /\W/;

// Here we check if the JavaScript engine is using some sort of
// optimization where it does not always call our comparision
// function. If that is the case, discard the hasDuplicate value.
//   Thus far that includes Google Chrome.
[0, 0].sort(function() {
	baseHasDuplicate = false;
	return 0;
});

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
			set = posProcess( parts[0] + parts[1], context, seed );

		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] ) {
					selector += parts.shift();
				}

				set = posProcess( selector, set, seed );
			}
		}

	} else {
		// Take a shortcut and set the context if the root selector is an ID
		// (but not if it'll be faster if the inner selector is an ID)
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {

			ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ?
				Sizzle.filter( ret.expr, ret.set )[0] :
				ret.set[0];
		}

		if ( context ) {
			ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
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

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );

		} else if ( context && context.nodeType === 1 ) {
			for ( i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains(context, checkSet[i])) ) {
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
	var set, i, len, match, type, left;

	if ( !expr ) {
		return [];
	}

	for ( i = 0, len = Expr.order.length; i < len; i++ ) {
		type = Expr.order[i];

		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			left = match[1];
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
		type, found, item, filter, left,
		i, pass,
		old = expr,
		result = [],
		curLoop = set,
		isXMLFilter = set && set[0] && Sizzle.isXML( set[0] );

	while ( expr && set.length ) {
		for ( type in Expr.filter ) {
			if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
				filter = Expr.filter[ type ];
				left = match[1];

				anyFound = false;

				match.splice(1,1);

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
					for ( i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							pass = not ^ found;

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
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Utility function for retreiving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
var getText = Sizzle.getText = function( elem ) {
    var i, node,
		nodeType = elem.nodeType,
		ret = "";

	if ( nodeType ) {
		if ( nodeType === 1 || nodeType === 9 ) {
			// Use textContent || innerText for elements
			if ( typeof elem.textContent === 'string' ) {
				return elem.textContent;
			} else if ( typeof elem.innerText === 'string' ) {
				// Replace IE's carriage returns
				return elem.innerText.replace( rReturn, '' );
			} else {
				// Traverse it's children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling) {
					ret += getText( elem );
				}
			}
		} else if ( nodeType === 3 || nodeType === 4 ) {
			return elem.nodeValue;
		}
	} else {

		// If no nodeType, this is expected to be an array
		for ( i = 0; (node = elem[i]); i++ ) {
			// Do not traverse comment nodes
			if ( node.nodeType !== 8 ) {
				ret += getText( node );
			}
		}
	}
	return ret;
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
		"+": function(checkSet, part){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !rNonWord.test( part ),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag ) {
				part = part.toLowerCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

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

		"": function(checkSet, part, isXML){
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
				var m = context.getElementById(match[1]);
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
					if ( results[i].getAttribute("name") === match[1] ) {
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
					if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n\r]/g, " ").indexOf(match) >= 0) ) {
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

				match[2] = match[2].replace(/^\+|\s*/g, '');

				// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
				var test = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(
					match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

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
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);

				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);

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
				return (elem.textContent || elem.innerText || getText([ elem ]) || "").indexOf(match[3]) >= 0;

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
			var first, last,
				doneName, parent, cache,
				count, diff,
				type = match[1],
				node = elem;

			switch ( type ) {
				case "only":
				case "first":
					while ( (node = node.previousSibling) )	 {
						if ( node.nodeType === 1 ) {
							return false;
						}
					}

					if ( type === "first" ) {
						return true;
					}

					node = elem;

				case "last":
					while ( (node = node.nextSibling) )	 {
						if ( node.nodeType === 1 ) {
							return false;
						}
					}

					return true;

				case "nth":
					first = match[2];
					last = match[3];

					if ( first === 1 && last === 0 ) {
						return true;
					}

					doneName = match[0];
					parent = elem.parentNode;

					if ( parent && (parent[ expando ] !== doneName || !elem.nodeIndex) ) {
						count = 0;

						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						}

						parent[ expando ] = doneName;
					}

					diff = elem.nodeIndex - last;

					if ( first === 0 ) {
						return diff === 0;

					} else {
						return ( diff % first === 0 && diff / first >= 0 );
					}
			}
		},

		ID: function( elem, match ) {
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},

		TAG: function( elem, match ) {
			return (match === "*" && elem.nodeType === 1) || !!elem.nodeName && elem.nodeName.toLowerCase() === match;
		},

		CLASS: function( elem, match ) {
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},

		ATTR: function( elem, match ) {
			var name = match[1],
				result = Sizzle.attr ?
					Sizzle.attr( elem, name ) :
					Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				!type && Sizzle.attr ?
				result != null :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value !== check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
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
	fescape = function(all, num){
		return "\\" + (num - 0 + 1);
	};

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source) );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, fescape) );
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

		if ( toString.call(array) === "[object Array]" ) {
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

		return a.compareDocumentPosition(b) & 4 ? -1 : 1;
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

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
	// We're going to inject a fake input element with a specified name
	var form = document.createElement("div"),
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
				var m = context.getElementById(match[1]);

				return m ?
					m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ?
						[m] :
						undefined :
					[];
			}
		};

		Expr.filter.ID = function( elem, match ) {
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");

			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );

	// release memory in IE
	root = form = null;
})();

(function(){
	// Check to see if the browser returns only elements
	// when doing getElementsByTagName("*")

	// Create a fake element
	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	// Make sure no comments are found
	if ( div.getElementsByTagName("*").length > 0 ) {
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
			div.firstChild.getAttribute("href") !== "#" ) {

		Expr.attrHandle.href = function( elem ) {
			return elem.getAttribute( "href", 2 );
		};
	}

	// release memory in IE
	div = null;
})();

if ( document.querySelectorAll ) {
	(function(){
		var oldSizzle = Sizzle,
			div = document.createElement("div"),
			id = "__sizzle__";

		div.innerHTML = "<p class='TEST'></p>";

		// Safari can't handle uppercase or unicode characters when
		// in quirks mode.
		if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
			return;
		}

		Sizzle = function( query, context, extra, seed ) {
			context = context || document;

			// Only use querySelectorAll on non-XML documents
			// (ID selectors don't work in non-HTML documents)
			if ( !seed && !Sizzle.isXML(context) ) {
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
						return makeArray( context.querySelectorAll(query), extra );
					} catch(qsaError) {}

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

					} catch(pseudoError) {
					} finally {
						if ( !old ) {
							oldContext.removeAttribute( "id" );
						}
					}
				}
			}

			return oldSizzle(query, context, extra, seed);
		};

		for ( var prop in oldSizzle ) {
			Sizzle[ prop ] = oldSizzle[ prop ];
		}

		// release memory in IE
		div = null;
	})();
}

(function(){
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
			expr = expr.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");

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
				} catch(e) {}
			}

			return Sizzle(expr, null, null, [node]).length > 0;
		};
	}
})();

(function(){
	var div = document.createElement("div");

	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	// Opera can't find a second classname (in 9.6)
	// Also, make sure that getElementsByClassName actually exists
	if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
		return;
	}

	// Safari caches class attributes, doesn't catch changes (in 3.2)
	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 ) {
		return;
	}

	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function( match, context, isXML ) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
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
				if ( elem[ expando ] === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem[ expando ] = doneName;
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
				if ( elem[ expando ] === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem[ expando ] = doneName;
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
		return a !== b && (a.contains ? a.contains(b) : true);
	};

} else if ( document.documentElement.compareDocumentPosition ) {
	Sizzle.contains = function( a, b ) {
		return !!(a.compareDocumentPosition(b) & 16);
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

var posProcess = function( selector, context, seed ) {
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
		Sizzle( selector, root[i], tmpSet, seed );
	}

	return Sizzle.filter( later, tmpSet );
};

// EXPOSE

window.Sizzle = Sizzle;

})();
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
			console.log('lola.array::initialize');
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
			console.log( 'lola.data::preinitialize' );
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
			console.log( 'lola.data::initialize' );
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
			console.log('lola.dom::initialize');
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
			console.log( 'lola.event::preinitialize' );
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
			console.log( 'lola.event::initialize' );
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
			console.log( 'lola.json::preinitialize' );
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
			console.log( 'lola.json::initialize' );
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
			console.log( 'lola.string::preinitialize' );
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
			console.log( 'lola.string::initialize' );
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
			console.log('lola.support::preinitialize');
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
			console.log('lola.support::initialize');
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
			console.log('lola.type::preinitialize');
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
			console.log('lola.type::initialize');
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
			console.log( 'lola.util::preinitialize' );
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
			console.log( 'lola.util::initialize' );
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
(function( lola ) {
	var $ = lola;
	/**
	 * @description XML HTTP Request Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var xhr = {

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
			console.log( 'lola.xhr::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.xhr.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			console.log( 'lola.xhr::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.xhr.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "xhr";
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

		//==================================================================
		// Classes
		//==================================================================
		Request: function( url, method, headers, async, user, password ){
			return this.init( url, method, headers, async, user, password );
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

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
	xhr.Request.prototype = {
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
		 * @description xhr.Request initializer
		 * @param {String} url request url
		 * @param {String} method request method
		 * @param {Array} headers request headers
		 * @param {Boolean} async execute request asyncronously
		 * @param {String} user credentials username
		 * @param {String} password credentials password
		 */
		init: function( url, method, headers, async, user, password ){
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
		send: function( params ) {
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

	//register module
	lola.registerModule( xhr );

})( lola );
