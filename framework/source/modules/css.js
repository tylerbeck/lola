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

			//add stylesheet for dynamic rules
			var styleSheet = (lola.support.cssRules) ? document.createElement( 'style' ) : document.createStyleSheet();
			lola('head').prependChild( styleSheet );

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
		},

		addRule: function( selector ) {
			var ssi = document.styleSheets.length - 1;
			var ri = lola.support.cssRules ? document.styleSheets[ssi].cssRules.length : document.styleSheets[ssi].rules.length;
			if ( document.styleSheets[0].addRule )
				document.styleSheets[ document.styleSheets.length - 1 ].addRule( selector, null, ri );
			else
				document.styleSheets[ document.styleSheets.length - 1 ].insertRule( selector + ' { }', ri );

			return lola.css.getRules( selector )[0];
		},

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

		updateRules: function( selector, style, value, media ) {
			var rules = lola.css.getRules( selector, media );
			for ( var i in rules ) {
				lola.css.style( rules[i], style, value );
			}
			return rules;
		},

		deleteRules: function( selector, media ) {
			lola.css.performRuleAction( selector, function( si, ri ) {
				if ( lola.support.cssRules )
					document.styleSheets[ si ].deleteRule( ri );
				else
					document.styleSheets[ si ].removeRule( ri );
			}, media )
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
	lola.registerModule( css );

})( lola );
