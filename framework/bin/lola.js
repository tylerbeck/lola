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
		 * @type {Object}
		 */
		dependencies: {},

		/**
		 * @private
		 * @type {Array}
		 */
		safeDeleteHooks: [],

		/**
		 * @public
		 * @type {Object}
		 */
		urlvars: {},

		/**
		 * @public
		 * @type {String}
		 */
		hash: "",

		/**
		 * @private
		 * @type {Boolean}
		 */
		debugMode: false,

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * framework initialization function
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
                lola.checkDependencies(lola.dependencies);

				//execute initialization stack
				var stackSize = lola.initializers.length;

				for ( i = 0; i < stackSize; i++ ) {
					var initializer = lola.initializers[i];
					if (typeof initializer == "function"){
						initializer();
					}

					delete lola.initializers[i];
				}
			}
		},

        /**
         * checks a dependency map for modules
         * @param {Object} map
         */
        checkDependencies: function( map ){
            var fails = [];
            for ( var k in map ) {
                var missing = this.checkModules( map[k] );
                if ( missing.length > 0 )
                    fails.push(k+': '+missing.join(', '));
            }
            if ( fails.length > 0 ) {
                throw new Error( "module dependency checks failed for: \n\t" + fails.join( "\n\t" ) );
            }
        },

        /**
         * checks if modules are registered and returns missing modules
         * @param {Array} modules
         * @return {Array} missing modules
         */
        checkModules: function( modules ){
            var missing = [];
            modules.forEach( function(item){
                if (!lola.hasPackage( lola, item ))
                    missing.push(item);
            });

            return missing;
        },

        /**
         * parses a url to get hash and vars
         * @param {String} url
         * @return {Object} vars, hash
         */
        parseUrl: function( url ){
			var parts = url.split("#",2);
			var vars = {};
			var hash = parts[1];

			var parts = parts[0].replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
				vars[key] = value;
			});

			return { vars:vars, hash:hash};
		},

		/**
		 * creates/gets and returns the object lineage defined in chain param
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
					if ( result[part] == null  )
                        result[part] = {};
					result = result[part];
				}
			}
			return result;
		},

        /**
         * checks the existence of the object lineage defined in chain param
         * @public
         * @param {!Object} base object on which to build chain
         * @param {!String} chain "." seperated namespace / package
         * @return {Boolean}
         */
        hasPackage: function( base, chain ) {
            var result = base;
            if ( typeof chain === 'string' ) {
                var parts = chain.split( '.' );
                var part;
                while ( part = parts.shift() ) {
                    if ( result[part] == null  )
                        return false;
                    else
                        result = result[part];
                }
            }
            return true;
        },

		/**
		 * extends the target with properties from the source
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
			if ( errors == undefined ) errors = false;
			for ( var k in source ) {
				if ( overwrite || target[k] == null )
					target[k] = source[k];
				else if ( errors )
					throw new Error( "property " + k + " already exists on extend target!" );
			}
		},


		/**
		 * eval abstraction
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
		 * loads a script from a url src
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
		 * registers a module with the Lola Framework
		 * @public
		 * @param {lola.Module} module
		 * @return {void}
		 */
		registerModule: function( module ) {
            var ns = module.getNamespace();
            lola.debug('lola::registerModule - ' + ns );

			//add module dependencies
            if (module.hasOwnProperty('getDependencies') && typeof module.getDependencies=="function")
			    lola.dependencies[ns] =  module.getDependencies();

			//add module to namespace
			lola.extend( lola.getPackage( lola, ns ), module );

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
		 * delete a property on an object and removes framework references
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
		 * Object prototype's to string method
		 * @param {Object} object
		 * @return {String}
		 */
		toString: Object.prototype.toString,

		/**
		 * checks for required arguments
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

        now: function(){
            return (new Date()).getTime();
        },

		__: function( v ){
			return (v.length == 1) ? v[0] : v;
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
		 * Selector class
		 * @param {String} selector selector string
		 * @param {Object|undefined} context for selection
		 * @constructor
		 */
		Selector: function( selector, context ) {
			return this.initialize( selector, context );
		},

		/**
		 * Lola Module Interface
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
		 * internal selection element array
		 * @private
		 * @type {Array}
		 */
		elements: [],

		/**
		 * Selector initialization function
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
		 * assigns guid to elements
		 * @return {lola.Selector}
		 */
		identify: function() {
			this.forEach( function( item ) {
				if ( !item.id )
					item.id = "lola-guid-" + lola.guid++;
			} );

			return this;
		},

		/**
		 * returns the element at the specified index
		 * @param {int} index
		 * @return {Object}
		 */
		get: function( index ) {
			if ( index == undefined )
				index = 0;
			return this.elements[ index ];
		},

		/**
		 * returns all of the selected elements
		 * @return {Array}
		 */
		getAll: function() {
			return this.elements;
		},

		/**
		 * returns element count
		 * @return {int}
		 */
		count: function() {
			return this.elements.length;
		},

		/**
		 *concatenates the elements from one or more
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
		 *  removes framework references for elements
		 * @return {lola.Selector}
		 */
		safeDelete: function() {
			this.forEach( function( item ){
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
		 * initializes module
		 * @return {void}
		 */
		initialize: function() {
		},

		/**
		 * get module's namespace
		 * @return {String}
		 */
		getNamespace: function() {
			return "";
		},

		/**
		 * get module's dependencies
		 * @return {Array}
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * get module's selectors
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

	var parts = lola.parseUrl( window.location.href );
	lola.urlvars = parts.vars;
	lola.hash = parts.hash;
	lola.debugMode = lola.urlvars['debug'] == "true";

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
	 * Array Module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 * @default array
		 */
		getNamespace: function() {
			return "array";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * checks an array of objects for a property with value
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
		 * returns a unique copy of the array
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
		 * checks if array contains object
		 * @public
		 * @param {Array} array
		 * @return {Boolean}
		 */
		isIn: function ( array, value ) {
			return array.indexOf( value ) >= 0;
		},

		/**
		 * removes null values from array
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
		 * creates a sort function for property
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

		/**
		 * sort an array on a property
		 * @param {Array} array
		 * @param {String} property
		 */
		sortOn: function( property, array ){
			return array.sort( lola.array.getSortFunction(property) );
		},


		//==================================================================
		// Selector Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {

				/**
				 * iterates each element in Selector and applies callback.
				 * @param {Function} callback function callback( item, index, array ):void
				 */
				forEach: function( callback ) {
					this.elements.forEach( callback, this );
					return this;
				},

				/**
				 * iterates each element in Selector and checks that every callback returns true.
				 * @param {Function} callback function callback( item, index, array ):Boolean
				 */
				every: function( callback ) {
					return this.elements.every( callback, this );
				},

				/**
				 * iterates each element in Selector and checks that at least one callback returns true.
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
				Array.prototype.reduce = function( accumlator ) {
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

	//update array prototype
	array.upgradeArrayPrototype();
	delete array['upgradeArrayPrototype'];

	//register module
	lola.registerModule( array );

})( lola );

(function( lola ) {
	var $ = lola;
	/**
	 * CSS Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var css = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * cache for fixed/mapped style properties
		 * @private
		 */
		propertyCache: {},

		/**
		 * cache for fixed/mapped selectors
		 * @private
		 */
		selectorCache: {},

		/**
		 * style property hooks
		 * @private
		 */
		propertyHooks: {},

		/**
		 * references to dynamic stylesheets
		 * @private
		 */
		stylesheets: {},

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.css::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization

			//remove initialization method
			delete lola.css.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.css::initialize' );
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "css";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * returns whether or not an object can have styles applied
		 * @param {*} obj
		 */
		canStyle: function( obj ) {
			//TODO: Implement canStyle function
			return true
		},

		/**
		 * gets mapped selector string
		 * @param {String} selector
		 * @return {String}
		 */
		getSelector: function( selector ) {
			if ( !this.selectorCache[selector] )
				this.selectorCache[selector] = lola.string.camelCase( selector );
			return this.selectorCache( selector );
		},

		/**
		 * gets mapped selector string
		 * @param {String} property
		 * @return {String}
		 */
		getProperty: function( property ) {
			if ( !this.propertyCache[property] )
				this.propertyCache[property] = lola.string.camelCase( property );
			return this.propertyCache[ property ];
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
		 * adds a stylesheet to the document head with an optional source
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
		 * registers a stylesheet with the css module
		 * @param {Node} stylesheet stylesheet object reference
		 * @param {String} id the id with which to register stylesheet
		 */
		registerStyleSheet: function( stylesheet, id ) {
			this.stylesheets[ id ] = stylesheet;
		},

		/**
		 * adds a selector to a stylesheet
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
		 * performs action on matching rules
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
		 * returns an array of matching rules
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
		 * updates rules in matching selectors
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
		 * deletes matching rules
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
		 * gets or sets an objects classes
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
		 * returns
		 * @param obj
		 * @param className
		 */
		hasClass: function( obj, className ) {
			var names = lola.css.classes( obj );
			return lola.array.isIn( names, className );
		},

		/**
		 * adds class to object if not already added
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
		 * removes a class from an object
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
		 * removes an objects style property
		 * @param obj
		 * @param style
		 */
		clearStyle: function( obj, style ) {
			delete obj.style[ lola.css.getProperty( style ) ];
		},

		/**
		 * parses an RGB or RGBA color
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
		 * parses an HSL or HSLA color
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
		 * parses color part value
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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {
				/**
				 * sets or gets element css property
				 * @param {String} property
				 * @param {*} value
				 */
				style: function( property, value ) {
					if ( value != undefined ) {
						this.forEach( function( item ) {
							lola.css.style( item, property, value );
						} );
						return this;
					}
					else {
						var values = [];
						this.forEach( function(item){
							values.push( lola.css.style( item, property ) )
						});
						return lola.__(values);
					}
				},

				/**
				 * sets or gets classes for elements
				 * @param {String|Array|undefined} values
				 */
				classes: function( values ) {
					if ( values != undefined ) {
						//set class names
						this.forEach( function( item ) {
							lola.css.classes( item, values );
						} );
						return this;

					}
					else {
						//get class names
						var names = [];
						this.forEach( function( item ) {
							names.push( lola.css.classes( item ) );
						} );

						return lola.__(names);
					}
				},

				/**
				 * checks that all elements in selector have class
				 * @param {String} name
				 */
				hasClass: function( name ) {
					var check = true;
					this.forEach( function( item ) {
						if (!lola.css.hasClass( item, name )){
							check = false;
						}
					} );
					return check;
				},

				/**
				 * adds class to all elements
				 * @param {String} name
				 */
				addClass: function( name ) {
					this.forEach( function( item ) {
						lola.css.addClass( item, name );
					} );
					return this;
				},

				/**
				 * removes class from all elements
				 * @param {String} name
				 */
				removeClass: function( name ) {
					this.forEach( function( item ) {
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
		 * output color type
		 * @private
		 */
		outputType: "",

		/**
		 * hex color value object
		 * @public
		 */
		hexValue: null,

		/**
		 * rgba color value object
		 * @public
		 */
		rgbValue: null,

		/**
		 * hsla color value object
		 * @public
		 */
		hslValue: null,

		/**
		 * class initialization function
		 * @param value
		 */
		init: function( value ){
			if (value) this.parseString( value );
			return this;
		},

		/**
		 * parses style color values returns rgba object
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
		 * outputs a css color string of the type specified in outputType
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
		 * returns the uint value of color object
		 * @return {uint}
		 */
		toInt: function() {
			return parseInt("0x" + this.hexValue );
		},

		/**
		 * outputs a css color hex string
		 * @return {String}
		 */
		toHexString: function() {
			return "#" + this.hexValue;
		},

		/**
		 * outputs a css color hsl string
		 * @return {String}
		 */
		toHslString: function() {
			return "hsl("+
					Math.round( this.hslValue.h * 360 )+","+
					Math.round( this.hslValue.s * 100 )+"%,"+
					Math.round( this.hslValue.l * 100 )+"%)";
		},

		/**
		 * outputs a css color hsla string
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
		 * outputs a css color rgb string
		 * @return {String}
		 */
		toRgbString: function() {
			return "rgb("+
					Math.round( this.rgbValue.r * 255 )+","+
					Math.round( this.rgbValue.g * 255 )+","+
					Math.round( this.rgbValue.b * 255 )+")";
		},

		/**
		 * outputs a css color rgba string
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
	 * Data Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var data = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * cache for all data storage
		 * @private
		 */
		cache: {},

		/**
		 * uid for data references
		 * @private
		 */
		uid: 1,

		/**
		 * attribute for data storage uid
		 * @private
		 */
		cacheIDProp: "LOLA-DATA-UID",

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "data";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ["support"];
		},

		/**
		 * get next data uid
		 * @return {int}
		 * @private
		 */
		nextUid: function() {
			return lola.data.uid++;
		},

		/**
		 * links element with data cache
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
		 * gets an objects data for the specified namespace
		 * @param {Object} object the object for which to retrieve data
		 * @param {String} namespace the namespace to retrieve
		 * @param {Boolean|undefined} create namespace data for object if not found,
		 * defaults to false
		 */
		get: function( object, namespace, create ) {
			var cacheId = lola.data.getCacheId( object, false );
			//console.log('data.get: ' + object);
			if ( lola.data.cache[namespace] == null || cacheId == null ) {
				if (create) {
					var obj = {};
					return lola.data.set( object, obj, namespace, false );
				}
				else {
					return null;
				}
			}
			else
				return lola.data.cache[namespace][cacheId];
		},

		/**
		 * gets data for entire namespace
		 * @param {String} namespace the namespace to get from data cache
		 */
		getNamespaceData: function( namespace ) {
			return lola.data.cache[namespace];
		},

		/**
		 * replaces/updates existing object data
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
		 * removes object data
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
			if (recurse === undefined)
				recurse == true;

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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {

				/**
				 * get data for elements
				 * @param {String} namespace
				 * @param {Boolean|undefined} create create data object if null
				 * @return {Array}
				 */
				getData: function( namespace, create ) {
					var data = [];
					this.forEach( function( item ) {
						data.push( lola.data.get( item, namespace, create ) )
					} );
					return lola.__(data);
				},

				/**
				 * put data for elements
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
				 * updates data for elements
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
				 * remove specified namespaces from data cache
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
				 * remove specified namespaces from data cache
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
	 * DOM Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var dom = {

		//==================================================================
		// Attributes
		//==================================================================

		/**
		 * map of attribute getter/setter hooks
		 * @private
		 * @type {Array}
		 */
		attributeHooks: {},

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "dom";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},


		/**
		 * sets or gets an node attribute
		 * @param {Object} object the object on which to access the attribute
		 * @param {String} name the name of the attribute
		 * @param {*} value (optional) value to set
		 */
		attr: function( object, name, value ) {
			//console.log('dom.attr');
			if ( this.attributeHooks[name] ) {
				return this.attributeHooks[name].apply( object, arguments );
			}
			else {
				if ( value || value == "") {   //set value
					if (lola(value).isPrimitive()) {
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
		 * deletes expando properties
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
		 * determines if element a is descendant of element b
		 * @param {Node} a
		 * @param {Node} b
		 */
		isDescendant: function ( a, b ) {
			return lola.dom.isAncestor( b, a );
		},

		/**
		 * determines if element a is an ancestor of element b
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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {

				/**
				 *  gets sub selection
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
				 *  generation selection
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
				 *  sets or gets html on elements
				 * @return {lola.Selector|Array}
				 */
				html: function( content ) {
					if ( arguments.length == 0 ) {
						var values = [];
						this.forEach( function( item ) {
							values.push( (item) ? item.innerHTML : null );
						} );
						return lola.__(values);
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
				 *  appends node to first selection element in DOM
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
				 *  prepends node to first selection element in DOM
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
				 *  clones first selection element
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
				 *  inserts node before first element in DOM
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
				 *  removes node from first element in DOM
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
				 *  replaces node in first element in DOM
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
				 *  sets or gets attributes
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
						return lola.__(values);
					}
				},

				/**
				 *  removes attribute from elements
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
				 *  sets new parent elements
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
						return lola.__(values);
					}
				},

				/**
				 *  deletes expando property on elements
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
	 * Event Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var event = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * event maping
		 * @private
		 * @type {Object}
		 */
		map: { 'mousewheel':['mousewheel','DOMMouseScroll'] },

		/**
		 * event hooks
		 * @private
		 * @type {Object}
		 */
		hooks: {},

		/**
		 * event listener uid
		 * @type {int}
		 */
		uid: 0,



		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "event";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},


		/**
		 * add a framework event listener
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
					priority = priority || event.PRIORITY_NORMAL;
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
		 * remove a framework event listener
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
		 * removes all listeners associated with handler
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
		 * internal capture listener
		 * @param {Object} event
		 * @private
		 */
		captureHandler: function( event ) {
			event = event || lola.window.event;
			lola.event.handler( event, 'capture' )
		},

		/**
		 * internal bubble listener
		 * @param {Object} event
		 * @private
		 */
		bubbleHandler: function( event ) {
			event = event || lola.window.event;
			lola.event.handler( event, 'bubble' )
		},

		/**
		 * internal capture listener
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
				stack = lola.array.sortOn( 'priority', stack );
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
		 * triggers a framework event on an object
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
		 * add a DOM event listener
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
		 * remove a DOM event listener
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
		 * gets the dom target
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
		 * returns key string for key events
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
		 * returns x,y coordinates relative to document
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
		 * returns x,y coordinates relative to currentTarget
		 * @param {Event} e
		 * @return {Object}
		 */
		getDOMLocalXY: function( e ) {
			var xPos = e.layerX || e.offsetX || 0;
			var yPos = e.layerY || e.offsetY || 0;
			return {x:xPos,y:yPos};
		},

		/**
		 * returns actual event phase to use
		 * @param {Object} target
		 * @param {Boolean|undefined} useCapture
		 * @return {String}
		 */
		phaseString: function( target, useCapture ) {
			return ((useCapture && (lola.support.domEvent || lola.support.msEvent)) || (!target.dispatchEvent && !target.attachEvent)) ? 'capture' : 'bubble';
		},

		/**
		 * prevent default event action
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
		 * LolqEvent class used with internal events
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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {

				/**
				 * adds a framework event listener
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
				 * removes a framework event listener
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
				 * removes all listeners associated with handler
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
				 * triggers an framework event on an object
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
		 * reference to original event
		 * @type {Event}
		 */
		originalEvent: null,

		/**
		 * flag for propagation stopped
		 * @type {Boolean}
		 * @private
		 */
		propagationStopped: false,

		/**
		 * flag for immediate propagation stopped
		 * @type {Boolean}
		 * @private
		 */
		immediatePropagationStopped: false,

		/**
		 * event's target
		 * @type {Object}
		 */
		target: null,

		/**
		 * event's currentTarget
		 * @type {Object}
		 */
		currentTarget: null,

		/**
		 * global x position (Mouse/Touch Events)
		 * @type {Number}
		 */
		globalX: null,

		/**
		 * global y position (Mouse/Touch Events)
		 * @type {Number}
		 */
		globalY: null,

		/**
		 * key code for Key Events
		 * @type {int}
		 */
		key: null,

		/**
		 * class initializer
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

			var lpos = lola.event.getDOMLocalXY( event );
			this.localX = lpos.x;
			this.localY = lpos.y;

			this.key = lola.event.getDOMKey( event );

			return this;
		},

		/**
		 * prevents an events default behavior
		 */
		preventDefault: function(){
			this.originalEvent.preventDefault();
		},

		/**
		 * stops event propagation
		 */
		stopPropagation: function(){
			this.originalEvent.stopPropagation();
			this.propagationStopped = true;
		},

		/**
		 * stops immediate event propagation
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
	 * delayed hover intent event hook
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
	 * mouse enter state event
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
	 * mouse leave event
	 * @event mouseleave
	 */
	event.hooks['mouseleave'] = event.hooks['mouseenterstate'];

	/**
	 * mouse enter event
	 * @event mouseleave
	 */
	event.hooks['mouseenter'] = event.hooks['mouseenterstate'];

    event.PRIORITY_BEFORE = 1;
    event.PRIORITY_FIRST = 0x400000;
    event.PRIORITY_NORMAL = 0x800000;
    event.PRIORITY_LAST= 0xC00000;
    event.PRIORITY_AFTER = 0xFFFFFF;

	//register module
	lola.registerModule( event );

})( lola );
(function( lola ) {
	var $ = lola;
	/**
	 * math Module
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
		 * preinitializes module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "math";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * normalize radians to 0 to 2 * PI
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
		 * normalize degrees to 0 to 360
		 * @param {Number} value radian value
		 * @return {Number}
		 */
		normalizeDegrees: function( value ) {
			while (value < 360)
				value += 360;
			return value % 360;
		},

		/**
		 * normalize a value within a range
		 * @param {Number} min
		 * @param {Number} value
		 * @param {Number} max
		 * @return {Number}
		 */
		normalizeRange: function( min, value, max ){
			return Math.max( min, Math.min( max, value ) );
		},

		//==================================================================
		// Classes
		//==================================================================


		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {

				/**
				 * get max value
				 * @param {Function} getVal function to get value from elements
				 * @return {Number}
				 */
				maxValue: function( getVal ) {
					return this.compareValues( getVal, Math.max, Number.MIN_VALUE );
				},

				/**
				 * get min value
				 * @param {Function} getVal function to get value from elements
				 * @return {Number}
				 */
				minValue: function( getVal ) {
					return this.compareValues( getVal, Math.min, Number.MAX_VALUE );
				},

				/**
				 * get total value
				 * @param {Function} getVal function to get value from elements
				 * @return {Number}
				 */
				totalValue: function( getVal ) {
					return this.compareValues( getVal, function( a, b ) {
						return a + b;
					}, 0 );
				},

				/**
				 * get averate value
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
	 * Regular Expression Module
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
		 * preinitializes module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "regex";
		},

		/**
		 * get module's dependencies
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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
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
	 * String Module
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
		 * preinitializes module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "string";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},


		/**
		 * pads the front of a string with the specified character to the specified length
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
		 * pads the end of a string with the specified character to the specified length
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
		 * converts hyphenated strings to camelCase
		 * @param {String} str
		 */
		camelCase: function ( str ) {
			var parts = str.split( "-" );
			var pl = parts.length;
			for ( var i = 1; i<pl; i++ ) {
				if ( parts[i].length > 0 )
					parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
			}

			return parts.join("");
		},




		//==================================================================
		// Classes
		//==================================================================


		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
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
	 * Support Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var support = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * can script text nodes be appended to script nodes
		 * @public
		 * @type {Boolean}
		 */
		domEval: false,

		/**
		 * can delete expando properties
		 * @public
		 * @type {Boolean}
		 */
		deleteExpando: true,

		/**
		 * dom event model
		 * @public
		 * @type {Boolean}
		 */
		domEvent: false,

		/**
		 * ms event model
		 * @public
		 * @type {Boolean}
		 */
		msEvent: false,

		/**
		 * browser animation frame timing
		 * @public
		 * @type {Boolean}
		 */
		browserAnimationFrame: false,

		/**
		 * IE style
		 * @public
		 * @type {Boolean}
		 */
		style: false,

		/**
		 * float is reserved check whether to user cssFloat or styleFloat
		 * @public
		 * @type {Boolean}
		 */
		cssFloat: false,

		/**
		 * check color alpha channel support
		 * @public
		 * @type {Boolean}
		 */
		colorAlpha: false,

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "support";
		},

		/**
		 * get module's dependencies
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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
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
	 * Type Module
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
		 * preinitializes module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "type";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * creates map of object and element types
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
		 * maps tag type
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
		 * maps special tag types
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
		 * maps object types
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
		 * gets the specified object's type
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

        isPrimitive: function( object ) {
            return this.primitives.indexOf(this.get(object)) >= 0;
        },

		//==================================================================
		// Selector Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {
				/**
				 * gets the type if the specified index
				 * @param {int} index
				 * @return {Array}
				 */
				getType: function( index ) {
					var values = [];
					this.forEach( function( item ) {
						values.push( lola.type.get(item) );
					} );
					return lola.__(values);
				},

				/**
				 * checks if element at index is a type, or all elements are a type
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
				 * checks if element at index is a primitive, or all elements are primitives
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
	 * Utility Module
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
		 * preinitializes module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "util";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

        copyPrimitives: function( source, target ){
            for (var k in source){
                if (lola.type.isPrimitive(source[k])){
                    target[k] = source[k];
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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {

				/**
				 * iterate through values calling iterator to change value
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
	 * Ag Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var agent = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * registration index
		 * @private
		 */
		index: 0,

		/**
		 * registration map
		 * @private
		 */
		map: {},

		/**
		 * initializers
		 * @private
		 */
		initializers: [],

        /**
         * @private
         * @type {Object}
         */
        dependencies: {},


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
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
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.agent::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

            //check agent dependencies
            lola.checkDependencies( this.dependencies );

            //execute agent initialization stack
            var stackSize = lola.agent.initializers.length;

            for ( i = 0; i < stackSize; i++ ) {
                var initializer = lola.agent.initializers[i];
                if (typeof initializer == "function"){
                    initializer();
                }

                delete lola.agent.initializers[i];
            }


			//remove initialization method
			delete lola.agent.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "agent";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['event','data'];
		},


		/**
		 * used to register an agent with the framework
		 * @param {Object} agent object that implements the agent interface
		 */
        registerAgent: function( agent ) {
            var ns = agent.getNamespace();
			console.info('register agent: '+ns);
			if (ns && agent.sign && agent.drop) {
				//setup namespace
				var pkg = lola.getPackage( lola.agent, ns );

				//copy module methods and attributes
				lola.extend( pkg, agent, true );

                //add dependencies
                if (agent.hasOwnProperty('getDependencies') && typeof agent.getDependencies=="function")
                    this.dependencies[ 'agent.'+ns ] = agent.getDependencies();

				//map agent
				this.map[ ns ] = pkg;

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
		 * assign a client to an agent
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
		 * drop a client from an agent
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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {

				/**
				 * assigns an agent to selector elements
				 * @param {String} agentName name of registered agent
				 */
				assignAgent: function( agentName ) {
					this.forEach( function(item){
						lola.agent.assign( item, agentName );
					});
					return this;
				},

				/**
				 * drops client from agent
				 * @param {String} agentName name of registered agent
				 */
				dropAgent: function( agentName ) {
					this.forEach( function(item){
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

(function (lola) {
    var $ = lola;
    /**
     * @description Chart Module
     * @implements {lola.Module}
     * @memberof lola
     */
    var chart = {

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
        preinitialize:function () {
            lola.debug('lola.chart::preinitialize');
            if (!lola) throw new Error('lola not defined!');

            //do module preinitialization


            //remove initialization method
            delete lola.chart.preinitialize;
        },

        /**
         * @description initializes module
         * @public
         * @return {void}
         */
        initialize:function () {
            lola.debug('lola.chart::initialize');
            //this framework is dependent on lola framework
            if (!lola) throw new Error('lola not defined!');

            //do module initialization


            //remove initialization method
            delete lola.chart.initialize;
        },

        /**
         * @description get module's namespace
         * @public
         * @return {String}
         * @default dom
         */
        getNamespace:function () {
            return "chart";
        },

        /**
         * @description get module's dependencies
         * @public
         * @return {Array}
         * @default []
         */
        getDependencies:function () {
            return ['graphics'];
        },

        //==================================================================
        // Classes
        //==================================================================
        Grid: function(x,y,width,height,spacing,flags){
            return this.init(x,y,width,height,spacing,flags);
        },

        Axis: function(x,y,size,label,labelOffset,flags ){
            return this.init(x,y,size,label,labelOffset,flags);
        },


        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * @description get module's selectors
         * @public
         * @return {Object}
         */
        getSelectorMethods:function () {

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
    chart.Grid.HORIZONTAL = 0x1;
    chart.Grid.VERTICAL = 0x2;
    chart.Grid.prototype = {
        x:0,
        y:0,
        width:100,
        height:100,
        spacing:10,
        flags:3,
        init: function(x,y,width,height,spacing,flags){
            this.x = x || 0;
            this.y = y || 0;
            this.width = width || 100;
            this.height = height || 100;
            this.spacing = spacing || 10;
            this.flags = (flags==undefined)?3:flags;

            return this;
        },

        draw: function( ctx, flags ){
            flags = flags == undefined ? this.flags : flags;

            var i;
            //vertical
            if (flags & lola.chart.Grid.VERTICAL){
                for (i=this.x+this.spacing; i<=this.width+this.x; i+=this.spacing){
                        ctx.beginPath();
                        ctx.moveTo(i,this.y);
                        ctx.lineTo(i,this.y+this.height);
                        ctx.stroke();
                        ctx.closePath();
                }
            }
            //horizontal
            if (flags & lola.chart.Grid.HORIZONTAL){
                for (i=this.y+this.spacing; i<=this.height+this.y; i+=this.spacing){
                    ctx.beginPath();
                    ctx.moveTo(this.x,i);
                    ctx.lineTo(this.x+this.width,i);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
    };

    chart.Axis.VERTICAL = 0x1;
    chart.Axis.prototype = {
        x:0,
        y:0,
        size: 100,
        label: undefined,
        labelOffset: {x:0,y:0},
        flags: 0x2,
        init: function(x,y,size,label,labelOffset,flags){
            this.x = x || 0;
            this.y = y || 0;
            this.size = size || 100;
            this.label = label;
            if( labelOffset ) this.labelOffset = labelOffset;
            this.flags = (flags==undefined)?0x0:flags;
            return this;
        },

        draw: function( ctx, flags ){
            flags = flags == undefined ? this.flags : flags;
            ctx.beginPath();
            ctx.moveTo( this.x, this.y );
            if (flags & lola.chart.Axis.VERTICAL){
                //vertical axis
                ctx.lineTo( this.x, this.y+this.size );
            }
            else {
                //horizontal axis
                ctx.lineTo( this.x+this.size, this.y );
            }
            ctx.stroke();
            ctx.closePath();

            if (this.label) {
                if (flags & lola.chart.Axis.VERTICAL) {
                    //label at bottom
                    ctx.textAlign = "center";
                    ctx.fillText( this.label, this.x + this.labelOffset.x, this.y + this.size + this.labelOffset.y );
                }
                else {
                    ctx.textAlign = "right";
                    ctx.fillText( this.label, this.x + this.labelOffset.x, this.y + this.labelOffset.y );
                }
            }
        }
    };



    //register module
    lola.registerModule(chart);

})(lola);
(function( lola ) {
	var $ = lola;
	/**
	 * Command Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var cmd = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * registry of commands
		 * @private
		 */
		registry: {},

		/**
		 * holds calls to unloaded commands
		 * @private
		 */
		callLater: {},


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.cmd::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.cmd.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.cmd::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.cmd.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "cmd";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['event'];
		},

		/**
		 * registers command with the module
		 * @param {Class|String} cmd the comman ./d b class or url of the class' js file
		 * @param {String} name the name with which tobv register the command
		 */
		register: function( cmd, name ) {
			if ( typeof cmd != "string" && name == undefined  )
				name = cmd.name;

			lola.debug('register command: '+name);
			if ( this.registry[name] != null && typeof this.registry[name] != "string" )
				console.warn( 'command "'+name+'" has already been registered... overwriting' );

			//register command class or url
			this.registry[name] = cmd;

			lola.event.addListener( this, name, this.executeCommand  );
		},

		/**
		 * executes a registered command
		 * @param {String} name registered command name
		 * @param {Object} params parameter object to be passed to command
		 * @param {lola.cmd.Responder} responder responder object to handle command events
		 */
		execute: function( name, params, responder ){
			if (this.registry[name]) {

				if (!responder) {
					responder = new cmd.Responder();
				}

				if ( typeof this.registry[name] == "string" ) {
					//add execution params to call later queue for the unloaded command
					if ( !this.callLater[ name ] ){
						//try to load command
						lola.loadScript( this.registry[name], function(e){
							if ( typeof this.registry[name] == "function" ) {
								//command successfully loaded - iterate through queued calls
								var s = lola.cmd.callLater[ name ].length;
								for (var i = 0; i < s; i++){
									var o = lola.cmd.callLater[ name ][i];
									lola.cmd.execute( o.name, o.params, o.responder );
								}
								delete lola.cmd.callLater[ name ];
							}
							else {
								throw new Error('The command loaded from "'+lola.cmd.registry[name]+'" is not named "'+name+'"');
							}
						});
						this.callLater[ name ] = [];
					}

					var cmdObj = {name:name, params:params, responder:responder};
					this.callLater[ name ].push( cmdObj );
				}
				else {
					//try to execute command
					var cmdClass = this.registry[ name ];
					if (cmdClass) {
						var cmd = new cmdClass();
						if (responder) {
							lola.event.addListener( cmd, 'result', responder.handleResult );
							lola.event.addListener( cmd, 'fault', responder.handleFault );
							lola.event.addListener( cmd, 'status', responder.handleStatus );
						}

						cmd.execute( params );
					}
				}
			}
			else {
				throw new Error('Unknown command type: '+name);
			}

			return responder;

		},

		/**
		 * handles executing commands triggered via event model
		 * @private
		 * @param event
		 */
		executeCommand: function( event ){
			lola.cmd.execute(event.type, event.data.parameters, event.data.responder );
		},


		//==================================================================
		// Classes
		//==================================================================
		/**
		 * Responder class handles command events
		 * @class
		 * @param {Function} resultHandler
		 * @param {Function} faultHandler
		 * @param {Function} statusHandler
		 */
		Responder: function( resultHandler, faultHandler, statusHandler ){
			return this.init();
		},

		/**
		 * Data object for executing commands via event model
		 * @param {Object} parameters parameter object
		 * @param {lola.cmd.Responder} responder responder object
		 */
		Data: function( parameters, responder ){
			return this.init( parameters, responder);
		},


		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
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
	cmd.Responder.prototype = {
		/**
		 * user defined result handler
		 */
		resultHandler:undefined,

		/**
		 * user defined fault handler
		 */
		faultHandler:undefined,

		/**
		 * user defined status handler
		 */
		statusHandler:undefined,

		/**
		 * last response event
		 * @private
		 */
		lastResponse: undefined,

		/**
		 * class initializer
		 * @private
		 * @param {Function} resultHandler
		 * @param {Function} faultHandler
		 * @param {Function} statusHandler
		 */
		init: function( resultHandler, faultHandler, statusHandler ){
			this.resultHandler = resultHandler;
			this.faultHandler = faultHandler;
			this.statusHandler = statusHandler;
		},

		/**
		 * handle status events from command
		 * @private
		 * @param {Object} event
		 */
		handleStatus: function( event ){
			if (!this.lastResponse ||  this.lastResponse.type == 'status' )
				this.lastResponse = event;
			if (typeof this.statusHandler == 'function')
				this.statusHandler.apply(lola.window, [event] );
		},

		/**
		 * handle result events from command
		 * @private
		 * @param {Object} event
		 */
		handleResult: function( event ){
			this.lastResponse = event;
			if (typeof this.resultHandler == 'function')
				this.resultHandler.apply(lola.window, [event] );
		},

		/**
		 * handle fault events from command
		 * @private
		 * @param {Object} event
		 */
		handleFault: function( event ){
			this.lastResponse = event;
			if (typeof this.faultHandler == 'function')
				this.faultHandler.apply(lola.window, [event] );
		},

		/**
		 * get last response
		 * @return {Object|undefined}
		 */
		getLastResponse: function(){
			return this.lastResponse;
		}


	};

	cmd.Data.prototype = {
		/**
		 * command parameters
		 * @type {Object}
		 */
		parameters: undefined,

		/**
		 * command responder
		 * @type {lola.cmd.Responder}
		 */
		responder: undefined,

		/**
		 * class initializer
		 * @private
		 * @param {Object} parameters
		 * @param {lola.cmd.Responder} responder
		 */
		init: function(parameters, responder) {
			this.parameters = parameters;
			this.responder = responder;
		}
	};

	//register module
	lola.registerModule( cmd );

})( lola );
(function( lola ) {
	var $ = lola;
	/**
	 * Easing Module
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
		 * preinitializes module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "easing";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ["math.point","graphics"];
		},


		/**
		 * calculates a point on a cubic bezier curve given time and an array of points.
		 * @private
		 * @param {Number} t time 0 <= t <= 1
		 * @param {lola.graphics.Point} p0 anchor 1
		 * @param {lola.graphics.Point} p1 control 1
		 * @param {lola.graphics.Point} p2 control 2
		 * @param {lola.graphics.Point} p3 anchor 2
		 * @return {lola.graphics.Point}
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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
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

(function( lola ) {
	var $ = lola;
	/**
	 * Graphics Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var graphics = {

		//==================================================================
		// Attributes
		//==================================================================
        /**
         * default context
         * @private
         */
		ctx: null,

        /**
         * 2d context map
         * @private
         */
		map2d: {},

        /**
         * 2d context reset object
         * @private
         */
		reset2d: {},

        /**
         * 2d style map
         * @private
         */
        styles2d: {},

        /**
         * routine map
         * @private
         */
        routines: {},

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.graphics::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization
			lola.safeDeleteHooks.push( {scope:this, fn:this.remove2dContext} );

			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			for ( var k in ctx ){
				switch ( lola.type.get(ctx[k]) ) {
					case "string":
					case "boolean":
					case "number":
						this.reset2d[ k ] = ctx[k];
						break;
                    case "function":
                        //console.log("Context Method: "+k);
                        if ( !this[k] ){
                            lola.evaluate( "lola.graphics."+k+" = function(){"+
                                    "this.ctx."+k+".apply( this.ctx, arguments );"+
                                "}");
                        }
                        break;
				}
			}

			//remove initialization method
			delete lola.graphics.preinitialize;

            //alias graphics package
            lola.g = lola.graphics;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.graphics::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.graphics.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "graphics";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [ "math.point","math.vector" ];
		},

        /**
         * maps 2d context of specified canvas
         * @param {Element} canvas
         * @param {String|undefined} id
         */
		register2dContext:function( canvas, id ){
			var context = canvas.getContext('2d');
			id = (id==undefined)?$(canvas).identify().attr('id'):id;
			var gdata = $(canvas).getData( this.getNamespace(), true );
			if (gdata.contexts2d == null)
				gdata.contexts2d = [];
			gdata.contexts2d.push( id );
			//$(canvas).putData( gdata, this.getNamespace() );


			this.map2d[ id ] = context;
		},

        /**
         * unmaps 2d context for specified canvas
         * @param canvas
         */
		remove2dContext:function( canvas ){
			var gdata = $(canvas).getData( this.getNamespace(), false );
			if (gdata && gdata.contexts2d) {
				var id;
				while ( id = gdata.contexts2d.pop() ){
					delete this.map2d[ id ];
				}
			}
		},

        /**
         * get a mapped context
         * @param {String} id
         * @return {Object}
         */
        get2dContext: function(id) {
            return this.map2d[id];
        },

        /**
         * resolves string to context
         * if a context is passed the same context is returned.
         * if nothing is found the current default context is returned
         * @param {Object|String|undefined} ctx
         */
        resolveContext: function( ctx ) {
            if (typeof ctx === "string")
                ctx = this.get2dContext( ctx );

            return ctx || lola.graphics.ctx;
        },

        /**
         * @descrtiption sets the current default context
         * @param {Object|String} ctx
         */
        setContext: function( ctx ) {
            this.ctx = this.resolveContext( ctx );
        },

        /**
         * returns a context to its original state
         * @param {Object|String|undefined} ctx
         */
		reset2dContext: function( ctx ) {
			if (typeof ctx == "string")
				ctx = this.resolveContext(ctx);

			if (ctx) lola.util.copyPrimitives( this.reset2d, ctx );
		},

        /**
         * copies properties of styleObject into style cache with given name
         * @param {String} name
         * @param {Object} styleObj
         */
        registerStyle: function( name, styleObj ) {
            var obj = {};
            lola.util.copyPrimitives( styleObj, obj );
            this.styles2d[ name ] = obj;
        },

        /**
         * removes style with specified name
         * @param {String} name
         */
        removeStyle: function(  name ) {
            delete this.styles2d[ name ];
        },

        /**
         * registers a repeatable drawing routine
         * @param {String} name
         * @param {Function} fnc function that accepts ctx to draw
         */
        registerRoutine: function( name, fnc ) {
            this.routines[ name ] = fnc;
        },

        /**
         * removes routine with specified name
         * @param {String} name
         */
        removeRoutine: function(  name ) {
            delete this.routines[ name ];
        },

        /**
         * execute a drawing routine
         * @param {String} name
         */
        executeRoutine: function( name ) {
            if (typeof this.routines[name] == "function" ){
                this.routines[name]( this.ctx );
            }
        },

        /**
         * copies properties of styleObject into style cache with given name
         * @param {Object|String} style
         * @param {Object|String} ctx
         */
        applyStyle: function( style, ctx ) {
            ctx = this.resolveContext( ctx );
            var styles = (typeof style == "string") ?  this.styles2d[ style ] || this.reset2d : style;
            lola.util.copyPrimitives( this.reset2d, ctx );
            lola.util.copyPrimitives( styles, ctx );
        },

        /**
         * draws drawable objects in current context
         * @param {Object|Array} objects
         */
        draw: function( object, flags ){
            if ( object.draw && typeof object.draw === "function" ){
                object.draw( lola.graphics.ctx, flags );
            }
        },

        /**
         * clears a context
         * @param ctx
         */
        clear: function( ctx ){
            ctx = this.resolveContext( ctx );
            ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
        },


		//==================================================================
		// Classes
		//==================================================================
        /**
         * Point class
         * @class
         * @param {Number|undefined} x x coordinate
         * @param {Number|undefined} y y coordinate
         */
		Point: function ( x, y ) {
			this.x = x;
			this.y = y;
			return this;
		},

        /**
         * Spline class
         * @class
         * @param {Array|undefined} points array of spline points
         * @param {uint} flags
         */
		Spline: function( points, flags ){
			this.points = points?points:[];
            this.flags = flags == undefined ? 0 : flags;
			return this;
		},

        /**
         * SplinePoint class
         * @class
         * @param anchorX
         * @param anchorY
         * @param entryStrength
         * @param entryAngle
         * @param exitStrength
         * @param exitAngle
         */
		SplinePoint: function( anchorX, anchorY, entryStrength, entryAngle, exitStrength, exitAngle ) {
			return this.init( anchorX, anchorY, entryStrength, entryAngle, exitStrength, exitAngle );
		},

        /**
         * Vector class
         * @class
         * @param velocity
         * @param angle
         */
		Vector: function ( velocity, angle ){
			this.velocity = velocity;
			this.angle = angle;
			return this;
		},




		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {
				register2dContext: function(){
					this.forEach( function(item){
						lola.graphics.register2dContext( item );
					});

					return this;
				}
			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
	graphics.Point.prototype = {
        /**
         * x coordinate
         * @type {Number}
         */
		x: undefined,

        /**
         * y coordinate
         * @type {Number}
         */
		y: undefined,

        /**
         * converts point to vector
         * @return {lola.graphics.Vector}
         */
		toVector: function(){
			var a = Math.atan2( this.y, this.x );
			var v = Math.sqrt( this.x*this.x + this.y*this.y );
			return new lola.graphics.Vector(v,a);
		}
	};

    graphics.Spline.CLOSED = 0x1;
    graphics.Spline.FILL = 0x2;
    graphics.Spline.STROKE = 0x4;
    graphics.Spline.CONTROLS =0x8;
	graphics.Spline.prototype = {
        /**
         * array of {lola.graphics.SplinePoint}
         * @type {Array}
         * @private
         */
		points: [],

        /**
         * spline flags
         * @type {Boolean}
         */
        flags: 0x0,

        /**
         * adds a point at the specified index.
         * if index is not passed, point will be added at last position
         * @param {lola.graphics.SplinePoint} splinePoint
         * @param {uint|undefined} index
         */
		addPoint: function( splinePoint, index ){
			if ( index == undefined )
				index = this.points.length;

			this.points.splice(index,0,splinePoint);
		},

        /**
         * removes the point at the specified index.
         * @param {uint} index
         */
		removePoint: function( index ){
			if ( index != undefined )
				this.points.splice(index,1,undefined);
		},

        /**
         * updates/replaces a point at the specified index.
         * @param {lola.graphics.SplinePoint} splinePoint
         * @param {uint} index
         */
		updatePoint: function( splinePoint, index ){
			if ( index != undefined )
			this.points.splice(index,1,splinePoint);
		},

        /**
         * gets the splinePoint at the specified index.
         * @param {uint} index
         */
        getPoint: function( index ){
            return this.points[ index ];
        },

        /**
         * gets all splinePoints.
         */
        getPoints: function(){
            return this.points;
        },

        /**
         * draws spline
         * @param {Boolean} close draw a closed spline
         * @param {Object|String|undefined} ctx
         */
        draw: function( ctx, flags ){
            flags = flags == undefined ? this.flags : flags;
            var sl = this.points.length;
            //console.log('drawSpline: '+sl);
            if (sl > 1) {
                var pts = [];
                //console.log(pts);
                this.points.forEach( function(item){
                    pts.push( item.getControl1() );
                    pts.push( item.getAnchor() );
                    pts.push( item.getControl2() );
                });
                var pl = pts.length;


                if (flags & graphics.Spline.CONTROLS){

                    ctx.beginPath();
                    ctx.moveTo(pts[1].x, pts[1].y);
                    ctx.lineTo(pts[2].x, pts[2].y);
                    ctx.stroke();
                    ctx.closePath();

                    for (var n=3; n<pl-3; n+=3){
                        var n2 = n+1;
                        var n3 = n+2;
                        ctx.beginPath();
                        ctx.moveTo(pts[n].x, pts[n].y);
                        ctx.lineTo(pts[n2].x, pts[n2].y);
                        ctx.stroke();
                        ctx.closePath();

                        ctx.beginPath();
                        ctx.moveTo(pts[n2].x, pts[n2].y);
                        ctx.lineTo(pts[n3].x, pts[n3].y);
                        ctx.stroke();
                        ctx.closePath();
                   }

                    ctx.beginPath();
                    ctx.moveTo(pts[n].x, pts[n].y);
                    ctx.lineTo(pts[n+1].x, pts[n+1].y);
                    ctx.stroke();
                    ctx.closePath();

                }

                ctx.beginPath();
                ctx.moveTo( pts[1].x,pts[1].y );
                for (var i=2; i<pl-3; i+=3){
                    ctx.bezierCurveTo(
                        pts[i].x,pts[i].y,
                        pts[i+1].x,pts[i+1].y,
                        pts[i+2].x,pts[i+2].y
                    );
                }

                if (flags & graphics.Spline.CLOSED){
                    ctx.bezierCurveTo(
                        pts[pl-1].x,pts[pl-1].y,
                        pts[0].x,pts[0].y,
                        pts[1].x,pts[1].y
                    );
                }

                if (flags & graphics.Spline.FILL){
                    ctx.fill();
                }

                if (flags & graphics.Spline.STROKE){
                    ctx.stroke();
                }

                ctx.closePath();

            }
            else{
                throw new Error('not enough spline points');
            }
        }

	};

	graphics.SplinePoint.prototype = {

        /**
         * splinepoint anchor point
         * @type {lola.graphics.Point|undefined}
         */
		anchor: undefined,

        /**
         * splinepoint entry vector
         * @type {lola.graphics.Vector|undefined}
         */
		entry: undefined,

        /**
         * splinepoint exit vector
         * @type {lola.graphics.Vector|undefined}
         */
		exit: undefined,

        /**
         * initialization function
         * @param ax
         * @param ay
         * @param es
         * @param ea
         * @param xs
         * @param xa
         */
		init: function (ax, ay, es, ea, xs, xa){
			this.anchor = new lola.graphics.Point( ax, ay );
			this.entry = new lola.graphics.Vector( es, ea );
			this.exit = new lola.graphics.Vector( xs, xa==undefined?ea:xa );
		},

        /**
         * sets the SplinePont's entry and exit angles
         * if exitAngle is omitted the same angle is set for both
         * @param {Number} entryAngle
         * @param {Number|undefined} exitAngle
         */
        setAngle: function( entryAngle, exitAngle) {
            this.entry.angle = entryAngle;
            this.exit.angle = exitAngle==undefined?entryAngle:exitAngle;
        },


        /**
         * gets the spline point's anchor
         * @return {lola.graphics.Point}
         */
		getAnchor: function(){
			return this.anchor;
		},

        /**
         * gets the spline point's entry control point
         * @return {lola.graphics.Point}
         */
		getControl1: function(){
			return lola.math.point.subtract( this.anchor, this.entry.toPoint());
		},

        /**
         * gets the spline point's exit control point
         * @return {lola.graphics.Point}
         */
		getControl2: function(){
			return lola.math.point.add( this.anchor, this.exit.toPoint() );
		}

	};

	graphics.Vector.prototype = {
        /**
         * velocity or length of the vector
         * @type {Number}
         */
		velocity: undefined,

        /**
         * angle of vector (horizontal pointing right is 0 radians)
         * @type {Number}
         */
		angle: undefined,

        /**
         * converts a vector to a (0,0) based point
         * @return {lola.graphics.Point}
         */
		toPoint: function() {
			return new lola.graphics.Point(
					Math.cos(this.angle)*this.velocity,
					Math.sin(this.angle)*this.velocity
			)
		}
	};

	//register module
	lola.registerModule( graphics );

})( lola );
(function( lola ) {
	var $ = lola;
	/**
	 * HTTP Request Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var http = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * storage for cached xsl requests
		 */
		xslCache: {},


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "http";
		},

		/**
		 * get module's dependencies
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
		 * caches xsl request
		 * @public
		 * @param {String} id
		 * @param {lola.http.Request} xsl
		 */
		cacheXsl: function( id, xsl ){
			lola.http.xslCache[ id ] = xsl;
		},

		/**
		 * replaces "<" ">" "&" with "&lt;" "&gt;" "&amp;"
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
		 * replaces "&lt;" "&gt;" "&amp;" with "<" ">" "&"
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
		 * Base HTTP Request Class
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
		 * Asynchronous HTTP Request Class
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
		 * Synchronous HTTP Request Class
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
		 * AJAX Transform Class
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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
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
				 * loads a request's content into elements
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
				 * loads http content into elements asynchronously
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
		 * request url
		 * @private
		 */
		url: "",

		/**
		 * request method
		 * @private
		 */
		method: 'POST',

		/**
		 * request headers
		 * @private
		 */
		headers: [],

		/**
		 * execute request asyncronously
		 * @private
		 */
		async: true,

		/**
		 * username
		 * @private
		 */
		user: null,

		/**
		 * password
		 * @private
		 */
		password: null,

		/**
		 * DOM xmlhttprequest
		 * @private
		 */
		request: false,

		/**
		 * readyFlag
		 * @public
		 */
		ready: false,

		/**
		 * http.Request initializer
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
		 * gets correct request object
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
		 * builds and executes request
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
		 * send request
		 * @public
		 * @param {Object|String|undefined} params
		 */
		load: function( params ) {
			this.request = this.makeRequest( this.url, params, this.method, this.headers, true, this.readyStateChange, this, this.user, this.password );
		},

		/**
		 * ready state change listener
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
		 * get raw response text
		 * @return {String}
		 */
		responseText: function() {
			if ( this.ready )
				return this.request.responseText;
			else
				return false;
		},

		/**
		 * get response xml document
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
		 * xml request object
		 * @private
		 * @type {lola.http.Request}
		 */
		xml: null,

		/**
		 * xsl request object
		 * @private
		 * @type {lola.http.Request}
		 */
		xsl: null,

		/**
		 * transformation xsl request params
		 * @private
		 * @type {Object}
		 */
		xslParams: null,

		/**
		 * transformation xml request params
		 * @private
		 * @type {Object}
		 */
		xmlParams: null,

		/**
		 * cache xsl onceLoaded
		 * @private
		 * @type {String}
		 */
		xslCacheId: "",

		/**
		 * holds transformation result
		 * @type {Array}
		 */
		resultNodes: [],

		/**
		 * Transform class initializer
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
		 * checks the states of both requests to see if the transform can be applied
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
		 *  handles xsl fault
		 * @private
		 */
		handleXSLFault: function() {
			lola.event.trigger( this, 'fault', true, true, 'xsl fault' );
		},

		/**
		 *  handles xml fault
		 * @private
		 */
		handleXMLFault: function() {
			lola.event.trigger( this, 'fault', true, true, 'xml fault' );
		},

		/**
		 * sends the transform requests if not yet sent
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
		 *  cancels transform request... aborts requests and removes listeners
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
		 * get the result of the transformation
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
	 * JSON Module adapted from json.org code
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
		 * preinitializes module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "json";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * json parsing method
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
		 * json parsing method
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
		 * json encodes a javascript object
		 * @public
		 * @param {Object} obj
		 * @return {String}
		 */
		encode: function ( obj ) {
			return lola.json.stringify( obj );
		},

		/**
		 * decodes a json string
		 * @public
		 * @param {String} text
		 * @return {Object}
		 */
		decode: function ( text ) {
			return lola.json.parse( text );
		},

		/**
		 * json encodes a javascript object
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
		 * decodes a json string
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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
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
	 * Math Color Module
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
		 * preinitializes module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "math.color";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['math'];
		},


		/**
		 * converts red,green,blue values to hue,saturation,lightness
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
		 * converts red,green,blue values to hex string
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
		 * converts red,green,blue values to int
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @return {int}
		 */
		rgb2int: function( r, g, b ) {
			return parseInt("0x"+lola.math.color.rgb2hex(r,g,b));
		},

		/**
		 * converts hue,saturation,lightness values to red,green,blue
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
		 * converts hue,saturation,lightness values to uint
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
		 * converts hue,saturation,lightness values to hex
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
		 * converts int values to rgb
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
		 * converts int values to hsl
		 * @param {int} value
		 * @return {Object}
		 */
		int2hsl: function( value ) {
			var rgb = color.int2rgb( value );
			return color.rgb2hsl( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * converts int values to hex string
		 * @param {int} value
		 * @return {String}
		 */
		int2hex: function( value ) {
			var rgb = color.int2rgb( value );
			return color.rgb2hex( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * converts hex values to int
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
		 * converts hex values to rgb
		 * @param {String} value
		 * @return {Object}
		 */
		hex2rgb: function( value ) {
			return color.int2rgb( color.hex2int( value ) );
		},

		/**
		 * converts hex values to hsl
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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
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
	 * math.geom Module
	 * @implements {lola.Module}
	 * @memberof lola.math
	 */
	var geom = {

		//==================================================================
		// Attributes
		//==================================================================



		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.math.geom::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.math.geom.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.math.geom::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.math.geom.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "math.geom";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['math'];
		},



		//==================================================================
		// Classes
		//==================================================================


		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
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
	lola.registerModule( geom );

})( lola );
(function( lola ) {
	var $ = lola;
	/**
	 * Point Math Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var point = {

		//==================================================================
		// Attributes
		//==================================================================

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.graphics::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.math.point.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.graphics::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.math.point.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "math.point";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ["math","graphics"];
		},

		/**
		 * adds arguments to p1
		 * @param {lola.graphics.Point} p1
		 * @return {lola.graphics.Point}
		 */
		add: function( p1 ){
			var r = new lola.graphics.Point(p1.x,p1.y);
			var len =  arguments.length;
			for (var i=1; i<len; i++) {
				var arg = arguments[i];
				if (typeof arg == "number") {
					r.x += arg;
					r.y += arg;
				}
				else {
					r.x += arg.x;
					r.y += arg.y;
				}
			}
			return r;
		},


		/**
		 * subtract args from p1
		 * @param {lola.graphics.Point} p1
		 * @return {lola.graphics.Point}
		 */
		subtract: function( p1 ){
			var r = new lola.graphics.Point(p1.x,p1.y);
			var len =  arguments.length;
			for (var i=1; i<len; i++) {
				var arg = arguments[i];
				if (typeof arg == "number") {
					r.x -= arg;
					r.y -= arg;
				}
				else {
					r.x -= arg.x;
					r.y -= arg.y;
				}
			}
			return r;
		},

		/**
		 * multiply p1 by args
		 * @param {lola.graphics.Point} p1
		 * @param {lola.graphics.Point|Number} p2
		 * @return {lola.graphics.Point}
		 */
		multiply: function( p1 ){
			var r = new lola.graphics.Point(p1.x,p1.y);
			var len =  arguments.length;
			for (var i=1; i<len; i++) {
				var arg = arguments[i];
				if (typeof arg == "number") {
					r.x *= arg;
					r.y *= arg;
				}
				else {
					r.x *= arg.x;
					r.y *= arg.y;
				}
			}
			return r;
		},

		/**
		 * divide p1 by args
		 * @param {lola.graphics.Point} p1
		 * @param {lola.graphics.Point|Number} p2
		 * @return {lola.graphics.Point}
		 */
		divide: function( p1 ){
			var r = new lola.graphics.Point(p1.x,p1.y);
			var len =  arguments.length;
			for (var i=1; i<len; i++) {
				var arg = arguments[i];
				if (typeof arg == "number") {
					r.x /= arg;
					r.y /= arg;
				}
				else {
					r.x /= arg.x;
					r.y /= arg.y;
				}
			}
			return r;
		},

		/**
		 * raise p to the po
		 * @param {lola.graphics.Point} p
		 * @param {lola.graphics.Point} po
		 * @return {lola.graphics.Point}
		 */
		pow: function( p, po ){
			return new lola.graphics.Point( Math.pow( p.x, po ), Math.pow( p.y, po ) );
		},

		/**
		 * calculates the absolute distance between p1 and p2
		 * @param {lola.graphics.Point} p1
		 * @param {lola.graphics.Point} p2
		 * @return {Number}
		 */
		distance: function( p1, p2 ) {
			return Math.sqrt( Math.pow(p2.x-p1.x,2) + Math.pow(p2.y-p1.y,2)  );
		},

		/**
		 * offsets a point at the specified angle by the specified distance
		 * @param {lola.graphics.Point} p
		 * @param {Number} angle angle in radians
		 * @param {Number} distance
		 */
		offsetPoint: function( p, angle, distance ){
			var offset = new lola.graphics.Point( p.x, p.y );
			offset.x += Math.cos( angle ) * distance;
			offset.y += Math.sin( angle ) * distance;
			return offset;
		},



		//==================================================================
		// Classes
		//==================================================================


		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
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
	lola.registerModule( point );

})( lola );
(function( lola ) {
	var $ = lola;
	/**
	 * Math Time Value of Money Module
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
		 * preinitializes module
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
		 * initializes module
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
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "math.tvm";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * present value
		 * @param fv future value
		 * @param rate rate per term
		 * @param term
		 */
		pv: function( fv, rate, term ) {
			return fv / Math.pow( 1 + rate, term );
		},

		/**
		 * future value
		 * @param pv present value
		 * @param rate rate per term
		 * @param term
		 */
		fv: function( pv, rate, term ) {
			return pv * Math.pow( 1 + rate, term );
		},


		/**
		 * present value of an annuity
		 * @param a annuity
		 * @param rate rate per term
		 * @param term
		 */
		pva: function( a, rate, term ) {
			return a * (1 - ( 1 / Math.pow( 1 + rate, term ) ) ) / rate;
		},

		/**
		 * future value of an annuity
		 * @param a annuity
		 * @param rate rate per term
		 * @param term
		 */
		fva: function( a, rate, term ) {
			return a * (Math.pow( 1 + rate, term ) - 1) / rate;
		},

		/**
		 * payment
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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
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
	 * Vector Module
	 * @implements {lola.Module}
	 * @memberof lola.math
	 */
	var vector = {

		//==================================================================
		// Attributes
		//==================================================================



		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.math.vector::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.math.vector.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.math.vector::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.math.vector.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "math.vector";
		},

		/**
		 * get module's dependencies
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
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
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
	lola.registerModule( vector );

})( lola );
(function( lola ) {
	var $ = lola;
	/**
	 * Tween Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var tween = {

        //==================================================================
        // Attributes
		//==================================================================
        /**
         * map of active tween targets
         * @private
         */
        targets: {},

        /**
         * tween uid generato
         * @private
         */
        tweenUid: 0,

        /**
         * tween uid generato
         * @private
         */
        freeTweenIds: [],

        /**
         * map of tweens
         * @private
         */
        tweens: {},

        /**
         * map of tween types
         * @private
         */
        hooks: {},

        /**
         * indicates whether module is ticking
         */
        active: false,


        //==================================================================
		// Methods
		//==================================================================
        /**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.tween::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization
            if ( window.requestAnimationFrame ) {
                lola.tween.requestTick = function(){ lola.window.requestAnimationFrame( lola.tween.tick ); };
                lola.tween.requestFrame = function( callback ){ lola.window.requestAnimationFrame( callback ); };
            }
            if ( window.mozRequestAnimationFrame ){
                lola.tween.requestTick = function(){ lola.window.mozRequestAnimationFrame( lola.tween.tick ); };
                lola.tween.requestFrame = function( callback ){ lola.window.mozRequestAnimationFrame( callback ); };
            }
            else if ( window.webkitRequestAnimationFrame ){
                lola.tween.requestTick = function(){ lola.window.webkitRequestAnimationFrame( lola.tween.tick ); };
                lola.tween.requestFrame = function( callback ){ lola.window.webkitRequestAnimationFrame( callback ); };
            }
            else if ( window.oRequestAnimationFrame ){
                lola.tween.requestTick = function(){ lola.window.oRequestAnimationFrame( lola.tween.tick ); };
                lola.tween.requestFrame = function( callback ){ lola.window.oRequestAnimationFrame( callback ); };
            }

			//remove initialization method
			delete lola.tween.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.tween::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.tween.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "tween";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

        /**
         * set callback for animation frame
         * @private
         */
        requestTick: function(){
            setTimeout( function(){ lola.tween.tick.call(lola.tween); }, 20 );
        },

        /**
         * set callback for animation frame
         * @param {Function} callback
         */
        requestFrame: function(callback){
            setTimeout( callback, 20 );
        },

        registerTween: function( tween ){
            var tid = this.freeTweenIds.length > 0 ? this.freeTweenIds.pop() : this.tweenUid++;
            this.tweens[tid] = tween;
            return tid;
        },

        start: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].start();
                if (!this.active){
                    this.active = true;
                    this.requestTick();
                }
            }
        },

        stop: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].stop();
            }
        },

        pause: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].pause();
            }
        },
        resume: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].resume();
                if (!this.active){
                    this.active = true;
                    this.requestTick();
                }
            }
        },

        addTarget: function( tweenId, objects, properties, overwrite ){
            if (this.tweens[ tweenId ]){
                overwrite = overwrite != false;
                if (lola.type.get(objects) != 'array')
                    objects = [objects];

                var ol = objects.length;
                for (var i=0; i<ol; i++) {
                    var obj = objects[i];
                    var id = $(obj).identify().attr('id');
                    if (!this.targets[id])
                        this.targets[id] = {};
                    for (var p in properties){
                        if (overwrite || this.targets[id][p] == null ){
                            this.targets[id][p] = this.getTweenObject( tweenId, obj, p, properties[p] );
                        }
                    }
                }
            }
            else{
                throw new Error("tween not found");
            }
        },

        getTweenObject: function( tweenId, target, property, value ){
            console.log("getTweenObject", tweenId, target, property, value );
            //get initial value
            var from,to,delta;
            if ( value.from ) {
                from = value.from;
            }
            else if (typeof value == "function"){
                from = value.call( target );
            }
            else{
                from = target[ property ];
            }
            console.log('from', from);
            //we can only tween if there's a from value
            var deltaMethod = 0;
            if (from != null && from != undefined) {
                //get to value
                if (lola.type.isPrimitive( value )) {
                    to = value;
                }
                else if (value.to) {
                    to = value.to;
                }
                else if (value.add) {
                    deltaMethod = 1;
                    to = value.add;
                }
                else if (value.subtract) {
                    deltaMethod = 2;
                    to = value.subtract;
                }
            }
            else{
                throw new Error('invalid tween parameters')
            }
            console.log('to', to);

            //break down from and to values to tweenable values
            //and determine how to tween values
            var type, proxy;
            if ( lola.tween.hooks[ property ] ) {
                type = lola.tween.hooks[ property ];
            }
            else {
                for ( var i in lola.tween.types ) {
                    type = lola.tween.types[i];
                    if ( type.match.test( String( to ) ) && type.match.test( String( from ) ) ) {
                        break;
                    }
                    else {
                        type = null;
                    }
                }
            }

            if ( type ) {
                // test parsed objects to see if they can be tweened
                to = type.parse( to );
                from = type.parse( from );
                delta = type.getDelta( to, from, deltaMethod );
                proxy = type.proxy;
                if ( !type.canTween( from, to ) ) {
                    type = null;
                }
            }
            if (!type) {
                proxy = lola.tween.setAfterProxy;
                delta = to;
            }
            console.log('type', type);


            return new tween.TweenObject( tweenId, target, property, from, delta, proxy );
        },

        tick: function(){
           //iterate through tweens and check for active state
            //if active, run position calculation on tweens
            var activityCheck = false;
            var now = lola.now();
            var t = this.tweens;
            for (var k in t){
                if (t[k].active){
                    activityCheck = true;
                    if ( !t[k].complete )
                        t[k].calculate( now );
                    else{
                        delete t[k];
                        lola.tween.freeTweenIds.push( parseInt(k) );
                    }
                }

            }

            //apply tween position to targets
            for (var t in this.targets){
                var c = 0;
                for ( var p in this.targets[t] )
                {
                    c++;
                    var to = this.targets[t][p];
                    if (this.tweens[to.tweenId].active) {
                        to.apply( this.tweens[to.tweenId].value );
                        if ( this.tweens[to.tweenId].complete )
                            delete this.targets[t][p];
                    }
                }
                if (c == 0)
                    delete this.targets[t];

            }

            if (activityCheck){
                this.requestTick();
                this.active = true;
            }
            else {
                this.active = false;
            }

        },

        setAfterProxy: function( target, property, from, delta, progress ) {
            if ( progress >= 1  )
                target[property] = delta;
        },



        //==================================================================
        // Tween Types
        //==================================================================
        types: {
            simple: {
                match: lola.regex.isNumber,
                parse: function(val){
                    return parseFloat( val );
                },
                canTween: function(a,b){
                    return (a && b);
                },
                getDelta: function( to, from, method) {
                    switch( method ){
                        case 1:
                            return to;
                            break;
                        case 2:
                            return 0 - to;
                            break;

                    }
                    return to - from;
                },
                proxy: null
            },

            dimensional: {
                match: lola.regex.isDimension,
                parse: function(val){
                    var parts = String( val ).match( lola.regex.isDimension );
                    return { value: parseFloat( parts[1] ), units: parts[2] };
                },
                canTween: function(a,b){
                    return ((a && b) && ((a.units == b.units)||(a.units == "" && b.units != "")));
                },
                getDelta: function( to, from, method) {
                    switch( method ){
                        case 1:
                            return {value:to.value, units:to.units};
                            break;
                        case 2:
                            return {value:0 - to.value, units:to.units};
                            break;

                    }
                    return {value:to.value - from.value, units:to.units};
                },
                proxy: function( target, property, from, delta, progress ) {
                    target[property] = (from.value + delta.value * progress) + delta.units;
                }
            }

        },

        //==================================================================
        // Classes
        //==================================================================
        Tween: function( duration, easing, delay ) {
            this.init( duration, easing, delay );
            return this;
        },

        TweenObject: function( tweenId, target, property, initialValue, deltaValue, proxy ){
            this.init( tweenId, target, property, initialValue, deltaValue, proxy );
            return this;
        },



		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {
                tweenStyle: function( properties, duration, delay, easing, overwrite ){
                    var targets = [];
                    this.forEach( function(item){
                       targets.push( item.style );
                    });
                    var tweenId = lola.tween.registerTween( new tween.Tween( duration, easing, delay ) );
                    lola.tween.addTarget( tweenId, targets, properties, overwrite );
                    lola.tween.start(tweenId);
                }
			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
    tween.Tween.prototype = {
        startTime: -1,
        pauseTime: -1,
        lastCalc: 0,
        duration: 1000,
        delay: 0,
        value: 0,
        easing: null,
        active: false,
        complete: false,

        init: function( duration, easing, delay ) {
            this.duration = duration;
            this.easing = easing;
            this.delay = delay;
            if (!easing){
                this.easing = function(t,v,c,d){ return (t/d)*c + v;};
            }
        },

        calculate: function( now ){
            var elapsed = now - this.startTime - this.delay;
            if (elapsed >= this.duration){
                elapsed = this.duration;
                this.complete = true;
            }

            this.value = elapsed ? this.easing( elapsed, 0, 1, this.duration ) : 0;
        },

        start: function(){
            console.log('Tween.start');
            this.active = true;
            this.startTime = lola.now();
            if (!lola.tween.active) {
                lola.tween.requestTick();
            }

        },
        stop: function(){
            this.active = false;
            this.complete = true;
        },
        pause: function(){
            this.active = false;
            this.pauseTime = lola.now();
        },
        resume: function(){
            this.active = false;
            this.startTime += lola.now() - this.pauseTime;
            if (!lola.tween.active) {
                lola.tween.requestTick();
            }
        }


    };

    tween.TweenObject.prototype = {
        target: null,
        property: null,
        tweenId: -1,
        initialValue: null,
        deltaValue: null,
        proxy: null,
        units: "",
        init: function( tweenId, target, property, initialValue, deltaValue, proxy ){
            this.target = target;
            this.property = property;
            this.tweenId = tweenId;
            this.initialValue = initialValue;
            this.deltaValue = deltaValue;
            this.proxy = proxy;
        },

        apply: function( value ){
            console.log('tween.apply',value);
            if (this.proxy){
                this.proxy( this.target, this.property, this.initialValue, this.deltaValue, value );
            }
            else {
                this.target[ this.property ] = this.initialValue + this.deltaValue * value;
            }
        }
    };





	//register module
	lola.registerModule( tween );

})( lola );

