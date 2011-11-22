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
