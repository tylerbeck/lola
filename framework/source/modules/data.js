/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Data
 *  Description: Data module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	/**
	 * Data Module
	 * @namespace lola.data
	 */
	var Module = function(){
		var $ = lola;
		var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "data";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['dom','type'];

        /**
         * cache for all data storage
         * @private
         */
        var cache = {};

        /**
         * uid for data references
         * @private
         */
        var uid = 1;

        /**
         * attribute for data storage uid
         * @private
         */
         var cacheIDProp = "LOLA-DATA-UID";

        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        //==================================================================
        // Methods
        //==================================================================
        /**
         * get next data uid
         * @return {int}
         * @private
         */
        function nextUid() {
            return uid++;
        }

        /**
         * links element with data cache
         * @param {Object} object
         * @param {Boolean|undefined} create defaults to true,
         * set to false to prevent creating a cache if one doesn't already exist
         * @private
         */
        function getCacheId( object, create ) {
            create = (create == undefined) ? true : create;
            //assume if create cache is being called that ther is no cache
            var cacheId = $.dom.attr( object, cacheIDProp );
            if ( cacheId == null ) {
                switch ( $.type.get( object ) ) {
                    case 'function':
                    case 'object':
                        cacheId = object[cacheIDProp];
                        if ( cacheId == null && create ) {
                            cacheId = nextUid();
                            object[cacheIDProp] = cacheId;
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
                        cacheId = $.dom.attr( object, cacheIDProp );
                        if ( cacheId == null && create ) {
                            cacheId = nextUid();
                            $.dom.attr( object, cacheIDProp, cacheId );
                        }
                        break;
                }
            }
            return cacheId;
        }

        /**
         * gets an objects data for the specified namespace
         * @param {Object} object the object for which to retrieve data
         * @param {String} namespace the namespace to retrieve
         * @param {Boolean|undefined} create namespace data for object if not found,
         * defaults to false
         */
        this.get = function( object, namespace, create ) {
            var cacheId = getCacheId( object, false );
            if ( cache[namespace] == null || cacheId == null ) {
                if (create) {
                    var obj = {};
                    return self.set( object, obj, namespace, false );
                }
                else {
                    return null;
                }
            }
            else
                return cache[namespace][cacheId];
        };

        /**
         * gets data for entire namespace
         * @param {String} namespace the namespace to get from data cache
         */
        this.getNamespaceData = function( namespace ) {
            return cache[ namespace ];
        };

        /**
         * replaces/updates existing object data
         * @param {Object} object
         * @param {Object} data
         * @param {String} namespace namespace to put data
         * @param {Boolean|undefined} overwite overwite existing data, defaults to false
         */
        this.set = function( object, data, namespace, overwite ) {
            //check for existing cache
            var cacheId = getCacheId( object, true );

            if ( cache[namespace] == null )
                cache[namespace] = {};

            if ( overwite || cache[namespace][cacheId] == null )
                cache[namespace][cacheId] = data;
            else
                $.extend(cache[namespace][cacheId], data, true );

            return cache[namespace][cacheId];
        };

        /**
         * removes object data
         * @param {Object} object
         * @param {String|undefined} namespace namespace to remove data,
         * removes data from all namespaces if undefined
         * @param {Boolean|undefined} recurse recurse childNodes to delete data
         */
        this.remove = function( object, namespace, recurse ) {
            //remove object data
            var cacheId = getCacheId( object, false );
            if ( cacheId ) {
                if ( namespace == null || namespace == undefined ) {
                    namespace = [];
                    for ( var ns in cache ) {
                        namespace.push( ns );
                    }
                }
                else {
                    if ( $.type.get(namespace) != "array" )
                        namespace = [namespace];
                }

                namespace.forEach( function( nsp ) {
                    delete cache[nsp][cacheId];
                } )

            }
            if (recurse === undefined)
                recurse = true;

            if ( recurse ) {
                if ( object.childNodes && $.type.get(object.childNodes) == "array") {
                    object.childNodes.forEach( function( item ) {
                        self.remove( item, namespace, true );
                    } )
                }
            }

        };

        this.dataset = function( elem, name, value ){
            if (value != undefined ){
                if ($.support.dataset){
                    elem.dataset[name] = value;
                }
                else{
                    $(elem).attr('data-'+name, value);
                }
            }
            else{
                if ($.support.dataset){
                    try {
                        return elem.dataset[name];
                    }
                    catch(e){}
                    return undefined;
                }
                else{
                    return $(elem).attr('data-'+name);
                }
            }
        };

        //==================================================================
        // Selector Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {

            /**
             * get data for elements
             * @param {String} namespace
             * @param {Boolean|undefined} create create data object if null
             * @return {Array}
             */
            getData: function( namespace, create ) {
                return this.g( self.get, namespace, create );
            },

            /**
             * put data for elements
             * @param {Object} data data to put in cache for elements (overwrites)
             * @param {String} namespace
             * @return {*}
             */
            putData: function( data, namespace ) {
                return this.s( self.set, data, namespace );
            },

            /**
             * updates data for elements
             * @param {Object} data
             * @param {String} namespace
             * @return {*}
             */
            updateData: function( data, namespace ) {
                return this.s( self.set, data, namespace, false );
            },

            /**
             * remove specified namespaces from data cache
             * @param {Array|String|undefined} namespace
             * @param {Boolean|undefined} recurse recurse childNodes, defaults to false
             * @return {*}
             */
            removeData: function( namespace, recurse ) {
                return this.s( self.remove, namespace, recurse );
            },

            /**
             * remove specified namespaces from data cache
             * @param {Boolean|undefined} recurse recurse childNodes, defaults to false
             * @return {lola.Selector}
             */
            removeAllData: function( recurse ) {
                return this.removeData( null, recurse );
            },

            dataset: function( name, value ){
                return this._( self.dataset, name, value );
            }
        };

        //==================================================================
        // Preinitialize
        //==================================================================
        $.addSafeDeleteHook( this.remove, this );

    };


	//register module
	lola.registerModule( new Module() );

})( lola );
