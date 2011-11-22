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

