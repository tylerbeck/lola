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

