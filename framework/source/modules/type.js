/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Type
 *  Description: Type module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {

	/**
	 * Type Module
	 * @namespace lola.type
	 */
	var Module = function() {
        var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "type";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];

        /**
         * map of types
         * @private
         * @type {Object}
         */
        var map = {};

        /**
         * primitive types
         * @private
         * @type {Array}
         */
        var primitives = ["boolean","number","string","undefined","null"];



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
         * creates map of object and element types
         * @private
         */
         function createMap() {

            var objTypes = "String Number Date Array Boolean RegExp Function Object Undefined Null";
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
                "ol optgroup option output "+
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

            objTypes.split(' ').forEach( mapObject );
            tagTypes.split(' ').forEach( mapTag );
            specialTagTypes.split(' ').forEach( mapSpecialTag );

            var tn = document.createTextNode( 'test' );
            var cn = document.createComment( 'test' );
            var tntype = Object.prototype.toString.call( tn );
            var cntype = Object.prototype.toString.call( cn );
            map[ tntype ] = 'textnode';
            map[ cntype ] = 'commentnode';

            //TODO: add isTextNode and isCommentNode selector functions
        }

        /**
         * maps tag type
         * @param item
         * @param index
         * @private
         */
        function mapTag( item, index ) {
            var tag = document.createElement( item );
            var type = Object.prototype.toString.call( tag );
            var name = type.replace( /\[object HTML/g, "" ).replace( /Element\]/g, "" );
            name = name == "" ? "Element" : name;
            map[ type ] = name.toLowerCase();
            var isfn = "lola.Selector.prototype['is" + name + "'] = " +
                "function(index){ return this.isType('" + name.toLowerCase() + "',index); };";
            lola.evaluate( isfn );
        }

        /**
         * maps special tag types
         * @param item
         * @param index
         * @private
         */
        function mapSpecialTag( item, index ) {
            var tag = document.createElement( item );
            var type = Object.prototype.toString.call( tag );
            var name = type.replace( /\[object /g, "" ).replace( /Element\]/g, "" ); // keep HTML
            name = name == "" ? "Element" : name;
            map[ type ] = name.toLowerCase();
            var isfn = "lola.Selector.prototype['is" + name + "'] = " +
                "function(index){ return this.isType('" + name.toLowerCase() + "',index); };";
            lola.evaluate( isfn );
        }

        /**
         * maps object types
         * @param item
         * @param index
         * @private
         */
        function mapObject( item, index ) {
            var type = "[object " + item + "]";
            map[ type ] = item.toLowerCase();
            var isfn = "lola.Selector.prototype['is" + item + "'] = " +
                "function(index){ return this.isType('" + item.toLowerCase() + "',index); };";
            lola.evaluate( isfn );
        }

        /**
         * gets the specified object's type
         * @param {Object} object
         * @return {String}
         */
        this.get = function( object ) {
            //if ( object ) {
                var type = map[ Object.prototype.toString.call( object ) ];
                if ( type )
                    return type;
                return 'other';
            //}
            //else if ( object === undefined )
            //return 'null';
        };

        this.isPrimitive = function( object ) {
            return primitives.indexOf(self.get(object)) >= 0;
        };

        //==================================================================
        // Selector Methods
        //==================================================================
        this.selectorMethods = {
            /**
             * gets the type if the specified index
             * @return {Array}
             */
            getType: function() {
                var values = [];
                this.forEach( function( item ) {
                    values.push( self.get(item) );
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
                    return self.get( this[index]) === type;
                }
                else {
                    return this.every( function( item ){
                        return self.get(item) === type;
                    } );
                }
            },

            /**
             * checks if element at index is a primitive, or all elements are primitives
             * @param {int|undefined} index
             */
            isPrimitive: function( index ) {
                if (index != undefined && index >= 0 ) {
                    return self.isPrimitive( this.getType(index) );
                }
                else {
                    return this.every( function( item ){
                        return self.isPrimitive(item) >= 0;
                    } );
                }
            }

        };

        //==================================================================
        // Preinitialize
        //==================================================================
        createMap();


    };


	//register module
	lola.registerModule( new Module() );

})( lola );

