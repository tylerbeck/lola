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
