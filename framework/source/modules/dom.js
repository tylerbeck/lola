/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: DOM
 *  Description: DOM module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	/**
	 * DOM Module
	 * @namespace lola.dom
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
        var namespace = "dom";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];

        /**
         * map of attribute getter/setter hooks
         * @private
         * @type {Object}
         */
        var attributeHooks = {};


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
         * sets or gets an node attribute
         * @param {Object} object the object on which to access the attribute
         * @param {String} name the name of the attribute
         * @param {*} value (optional) value to set
         */
        this.attr = function( object, name, value ) {
            //console.log('dom.attr');
            if ( attributeHooks[name] ) {
                return attributeHooks[name].apply( object, arguments );
            }
            else if (object) {
                if ( value || value == "") {   //set value
                    if (lola(value).isPrimitive()) {
                        return object[name] = value;
                    }
                    else {
                        throw new Error('attribute values must be primitives');
                    }
                }
                else {
                    return object[ name ];
                }
            }
        };

        /**
         * deletes expando properties
         * @param {Object} object
         * @param {String} name
         */
        this.deleteExpando =function( object, name ) {
            if ( lola.support.deleteExpando )
                delete object[name];
            else
                object[name] = null;
        };

        /**
         * determines if element a is descendant of element b
         * @param {Node} a
         * @param {Node} b
         */
        this.isDescendant = function ( a, b ) {
            return self.isAncestor( b, a );
        };

        /**
         * determines if element a is an ancestor of element b
         * @param {Node} a
         * @param {Node} b
         */
        this.isAncestor = function ( a, b ) {
            var ancestor = b;
            while ( ancestor && (ancestor = ancestor.parentNode) && ancestor.nodeName != "BODY" ) {
                if (a == ancestor) return true;
            }
            return false;
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
                        if (item.hasOwnProperty('childNodes')){
                            var cnl = item.childNodes.length;
                            for ( var i=0; i<cnl; i++ ) {
                                var child = item.childNodes.item(i);
                                console.log('safeDelete', child.nodeType);
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
                                    item.innerHTML = "";
                                    item.appendChild( content );
                                    break;
                            }
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
                if ( this.length > 0 ) {
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
                if ( this.length > 0 ) {
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
                if ( this.length > 0 ) {
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
                if ( this.length > 0 ) {
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
                if ( this.length > 0 ) {
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
                if ( this.length > 0 ) {
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
                        self.attr( item, name, value );
                    } );
                    return this;
                }
                else {
                    var values = [];
                    this.forEach( function( item ) {
                        values.push( self.attr( item, name ) );
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


    };


	//register module
	lola.registerModule( new Module() );

})( lola );

