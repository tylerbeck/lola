/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: String
 *  Description: String module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	/**
	 * String Module
	 * @implements {lola.Module}
	 * @namespace lola.string
	 */
	var Module = function(){
        var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "string";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];


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
         * pads the front of a string with the specified character to the specified length
         * @param {String|int} str
         * @param {String} chr character to use in pad, can be multiple characters for escaped chrs
         * @param {int} size padded length
         */
        this.padFront = function ( str, chr, size ) {
            str = str.toString();
            var l = str.length;
            var p = [str];
            while ( l < size ) {
                p.push(chr);
                l++;
            }
            return p.join("");
        };

        /**
         * pads the end of a string with the specified character to the specified length
         * @param {String|int} str
         * @param {String} chr character to use in pad, can be multiple characters for escaped chrs
         * @param {int} size padded length
         */
        this.padEnd = function ( str, chr, size ) {
            str = str.toString();
            var l = str.length;
            var p = [str];
            while ( l < size ) {
                p.unshift(chr);
                l++;
            }
            return p.join("");
        };

        /**
         * converts hyphenated strings to camelCase
         * @param {String} str
         */
        this.camelCase = function ( str ) {
            str = String(str);
            var parts = str.split( "-" );
            var pl = parts.length;
            for ( var i = 1; i<pl; i++ ) {
                if ( parts[i].length > 0 )
                    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
            }

            return parts.join("");
        };

        /**
         * converts hyphenated strings to camelCase
         * @param {String} str
         */
        this.dashed = function ( str ) {
            var chs = str.split('');
            var ch;
            var parts = [];
            while ( ch = chs.shift() ){
                if (ch == ch.toUpperCase())
                    parts.push( "-" );
                parts.push( ch.toLowerCase() );
            }
            return parts.join("");
        };

    };


	//register module
	lola.registerModule( new Module() );

})( lola );
