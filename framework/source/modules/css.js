/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: CSS
 *  Description: CSS module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	/**
	 * CSS Module
	 * @implements {lola.Module}
	 * @memberof lola
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
        var namespace = "css";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["type","math.color"];

        /**
         * cache for fixed/mapped style properties
         * @private
         */
        var propertyCache = {};

        /**
         * cache for fixed/mapped selectors
         * @private
         */
        var selectorCache = {};

        /**
         * style property hooks
         * @private
         */
        var propertyHooks = {};

        /**
         * references to dynamic stylesheets
         * @private
         */
        var stylesheets = {};


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
         * initializes module
         * @public
         * @return {void}
         */
        this.initialize = function() {
            lola.debug( 'lola.css::initialize' );

            //add default hooks
            var dimensionals = "padding margin background-position border-top-width border-right-width border-bottom-width "+
                "border-left-width border-width bottom font-size height left line-height list-style-position "+
                "margin margin-top margin-right margin-bottom margin-left max-height max-width min-height "+
                "min-width outline-width padding padding-top padding-right padding-bottom padding-left right "+
                "text-indent top width";

            dimensionals.split(' ').forEach( function( item ){
                self.registerStyleHook( item, dimensionalHook );
            });

            //add default stylesheet for dynamic rules
            self.addStyleSheet( "_default" );

            //add default mappings
            propertyCache['float'] = (lola.support.cssFloat) ? 'cssFloat' : 'styleFloat';

            //remove initialization method
            delete self.initialize;
        };

        /**
         * returns whether or not an object can have styles applied
         * @param {*} obj
         */
        function canStyle( obj ) {
            //TODO: Implement canStyle function
            return true
        }

        /**
         * gets mapped selector string
         * @param {String} selector
         * @return {String}
         */
        function getSelector( selector ) {
            if ( !selectorCache[selector] )
                selectorCache[selector] = lola.string.camelCase( selector );
            return selectorCache[selector];
        }

        /**
         * gets mapped selector string
         * @param {String} property
         * @return {String}
         */
        function getProperty( property ) {
            if ( !propertyCache[property] )
                propertyCache[property] = lola.string.camelCase( property );
            return propertyCache[ property ];
        }

        /**
         * gets/sets style on an object
         * @public
         * @param {Node} node styleable object
         * @param {String} style style property
         * @param {*} value leave undefined to get style
         * @return {*}
         */
        this['style'] = function( node, style, value ) {
            //make sure style can be set
            var prop = getProperty( style );
            if ( canStyle( node ) ) {
                if ( propertyHooks[ prop ] != null ) {
                    return propertyHooks[prop].apply( node, arguments );
                }
                else {
                    if ( value == undefined )
                        self.getRawStyle( node, prop );
                    else
                        self.setRawStyle( node, prop, value );
                }
            }

            return false;
        };

        /**
         * gets raw style of an object
         * @public
         * @param {Node} node styleable object
         * @param {String} style style property
         * @return {String}
         */
        this.getRawStyle = function( node, style ){
            var prop = getProperty( style );
            if (document.defaultView && document.defaultView.getComputedStyle) {
                return document.defaultView.getComputedStyle( node, undefined )[ prop ];
            }
            else if ( typeof(document.body.currentStyle) !== "undefined") {
                return node["currentStyle"][prop];
            }
            else {
                return node.style[prop];
            }
        };

        /**
         * sets raw style on an object
         * @public
         * @param {Node} node styleable object
         * @param {String} style style property
         * @param {*} value leave undefined to get style
         */
        this.setRawStyle = function( node, style, value ){
            var prop = getProperty( style );
            return node.style[ prop ] = value;
        };

        /**
         * registers hook for style property
         * @param {String} style
         * @param {Function} fn function(obj, style, value):*
         */
        this.registerStyleHook = function( style, fn ){
            var prop = getProperty( style );
            propertyHooks[ prop ] = fn;
        };

        /**
         * sets a dimension style with or without units
         * gets a dimensional style with no units
         * @param obj
         * @param style
         * @param value
         * @private
         */
        function dimensionalHook( obj, style, value ){
            if (value == undefined) {
                var val = self.getRawStyle( obj, style );
                return parseFloat(val.replace( lola.regex.isDimension, "$1"));
            }
            else {
                value = (String(value).match(lola.regex.isDimension)) ? value : value+"px";
                self.setRawStyle( obj, style, value );
            }
        }

        /**
         * adds a stylesheet to the document head with an optional source
         * @param {String|undefined} id reference id for stylesheet
         * @param {String|undefined} source url for external stylesheet
         */
        this.addStyleSheet = function( id, source ) {
            var stylesheet = (lola.support.cssRules) ? document.createElement( 'style' ) : document.createStyleSheet();
            if (source) {
                stylesheet.source = source;
            }
            if (id) {
                self.registerStyleSheet( stylesheet, id );
            }
            lola('head').appendChild( stylesheet );
        };


        /**
         * registers a stylesheet with the css module
         * @param {Node} stylesheet stylesheet object reference
         * @param {String} id the id with which to register stylesheet
         */
        this.registerStyleSheet = function( stylesheet, id ) {
            stylesheets[ id ] = stylesheet;
        };

        /**
         * adds a selector to a stylesheet
         * @param {String} selector
         * @param {Object} styles an object containing key value pairs of style properties and values
         * @param {String|Object|undefined} stylesheet registered stylesheet id or stylesheet reference
         * @return {Object}
         */
        this.addSelector = function( selector, styles, stylesheet ) {
            if (lola.type.get(stylesheet) == "string" ){
                stylesheet = stylesheets["_default"];
            }
            stylesheet = stylesheet || stylesheets["_default"];
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
                    self.style( rule, item, styles[item] );
                });
            }

            return rule;
        };

        /**
         * performs action on matching rules
         * @param {String} selector
         * @param {Function} action
         * @param {String} media
         */
        this.performRuleAction = function( selector, action, media ) {
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
                                //console.info( 'matched rule: ' + rules[ri].selectorText );
                                action( si, ri );
                            }
                        }
                    }
                }
            }
        };

        /**
         * returns an array of matching rules
         * @param {String} selector
         * @param {String} media
         * @return {Array}
         */
        this.getRules = function( selector, media ) {
            var rules = [];
            this.performRuleAction( selector, function( si, ri ) {
                if ( lola.support.cssRules )
                    rules.push( document.styleSheets[ si ].cssRules[ ri ] );
                else
                    rules.push( document.styleSheets[ si ].rules[ ri ] );
            }, media );
            return rules;
        };

        /**
         * updates rules in matching selectors
         * @param {String} selector
         * @param {Object} styles an object containing key value pairs of style properties and values
         * @param {String} media
         * @return {Array}
         */
        this.updateRules = function( selector, styles, media ) {
            var rules = this.getRules( selector, media );
            var props = styles.keys();
            props.forEach( function( item ){
                rules.forEach( function( rule ){
                    this.style( rule, item, styles[item] );
                });
            });

            return rules;
        };

        /**
         * deletes matching rules
         * @param selector
         * @param media
         */
        this.deleteRules = function( selector, media ) {
            this.performRuleAction( selector, function( si, ri ) {
                if ( lola.support.cssRules )
                    document.styleSheets[ si ].deleteRule( ri );
                else
                    document.styleSheets[ si ].removeRule( ri );
            }, media );
        };

        /**
         * gets or sets an objects classes
         * @param {Node} obj
         * @param {String|Array|undefined} classes leave undefined to get classes
         * @return {Array}
         */
        this.classes = function( obj, classes ) {
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
                var names = obj.className.replace( lola.regex.extraSpace , " " );
                return names.split( " " ).reverse();
            }
        };

        /**
         * returns
         * @param obj
         * @param className
         */
        this.hasClass = function( obj, className ) {
            var names = this.classes( obj );
            return lola.array.isIn( names, className );
        };

        /**
         * adds class to object if not already added
         * @param {Node} obj
         * @param {String} className
         */
        this.addClass = function( obj, className ) {
            var names = this.classes( obj );
            if ( !lola.array.isIn( names, className ) ) {
                names.push( className );
                self.classes( obj, names );
            }
        };

        /**
         * removes a class from an object
         * @param {Node} obj
         * @param {String} className
         */
        this.removeClass = function( obj, className ) {
            var names = this.classes( obj );
            var index = names.indexOf( className );
            if ( index >= 0 ) {
                names.splice( index, 1 );
                self.classes( obj, names );
            }
        };

        /**
         * removes an objects style property
         * @param obj
         * @param style
         */
        this.clearStyle = function( obj, style ) {
            delete obj.style[ getProperty( style ) ];
        };



        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {
            /**
             * sets or gets element css property
             * @param {String} property
             * @param {*} value
             */
            style: function( property, value ) {
                if ( value != undefined ) {
                    this.forEach( function( item ) {
                        self.style( item, property, value );
                    } );
                    return this;
                }
                else {
                    var values = [];
                    this.forEach( function(item){
                        values.push( self.style( item, property ) )
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
                        self.classes( item, values );
                    } );
                    return this;

                }
                else {
                    //get class names
                    var names = [];
                    this.forEach( function( item ) {
                        names.push( self.classes( item ) );
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
                    if (!self.hasClass( item, name )){
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
                    self.addClass( item, name );
                } );
                return this;
            },

            /**
             * removes class from all elements
             * @param {String} name
             */
            removeClass: function( name ) {
                this.forEach( function( item ) {
                    self.removeClass( item, name );
                } );
                return this;
            }

        };

        //==================================================================
        // Classes
        //==================================================================
        this.Color = function( value ){
            /**
             * rgba color value object
             * @private
             */
            var rgb;

            /**
             * hsl color value object
             * @private
             */
            var hsl;

            /**
             * hex color value object
             * @private
             */
            var hex;

            /**
             * get rgba object
             * @return {Object}
             */
            this.getRgbValue = function(){
                return rgb;
            };

            /**
             * get hsla object
             * @return {Object}
             */
            this.getHslValue = function(){
                return hsl;
            };

            /**
             * get hsla object
             * @return {Object}
             */
            this.getHexValue = function(){
                return hex;
            };

            /**
             * parses style color values returns rgba object
             * @public
             * @param {String} val
             */
            function parseString( val ) {

                var cparts = val.match( lola.regex.isColor );
                if ( cparts ) {
                    var parts,rgb,hsl,hex;
                    switch ( cparts[1] ) {
                        case '#':
                            parts = val.match( lola.regex.isHexColor );
                            hex = ( parts != null ) ? parts[1] : "000000";
                            rgb = lola.math.color.hex2rgb(hex);
                            hsl = lola.math.color.rgb2hsl( rgb.r, rgb.g, rgb.b );
                            rgb.a = hsl.a = 1;
                            break;
                        case 'rgb':
                        case 'rgba':
                            rgb = parseRGBColorString( val );
                            hex = lola.math.color.rgb2hex( rgb.r, rgb.g, rgb.b );
                            hsl = lola.math.color.rgb2hsl( rgb.r, rgb.g, rgb.b );
                            break;
                        case 'hsl':
                        case 'hsla':
                            hsl = parseHSLColorString( val );
                            rgb = lola.math.color.hsl2rgb(hsl.h,hsl.s,hsl.l);
                            hex = lola.math.color.rgb2hex(rgb.r, rgb.g, rgb.b);
                            rgb.a = hsl.a;
                            break;
                    }
                }
            }

            /**
             * parses an HSL or HSLA color
             * @param {String} val
             * @private
             * @return {Object}
             */
            function parseHSLColorString( val ) {
                var c = { h:0, s:0, l:0, a:1 };
                var parts = val.match( lola.regex.isHSLColor );
                if ( parts != null ) {
                    var v = parts[1].replace( /\s+/g, "" );
                    v = v.split( ',' );
                    c.h = parseColorPart( v[0], 360  );
                    c.s = parseColorPart( v[1], 1  );
                    c.l = parseColorPart( v[2], 1  );
                    c.a = (v.length > 3) ? parseColorPart( v[3], 1 ) : 1;
                }
                return c;
            }

            /**
             * parses an RGB or RGBA color
             * @param {String} val
             * @private
             * @return {Object}
             */
            function parseRGBColorString( val ) {
                var c = { r:0, g:0, b:0, a:1 };
                var parts = val.match( lola.regex.isHSLColor );
                if ( parts != null ) {
                    var v = parts[1].replace( /\s+/g, "" );
                    v = v.split( ',' );
                    c.h = parseColorPart( v[0], 255  );
                    c.s = parseColorPart( v[1], 255  );
                    c.l = parseColorPart( v[2], 255  );
                    c.a = (v.length > 3) ? parseColorPart( v[3], 1 ) : 1;
                }
                return c;
            }

            /**
             * parses color part value
             * @private
             * @param {String} val
             * @return {Number}
             */
            function parseColorPart( val, divisor ) {
                if ( val ) {
                    if ( val.indexOf( '%' ) > 0 )
                        return parseFloat( val.replace( /%/g, "" ) ) / 100;
                    else
                        return parseFloat( val ) / divisor;
                }
                return 0;
            }

            /**
             * returns the uint value of color object
             * @return {uint}
             */
            this.toInt = function() {
                return parseInt("0x" + hex );
            };

            /**
             * outputs a css color hex string
             * @return {String}
             */
            this.toHexString = function() {
                return "#" + hex;
            };

            /**
             * outputs a css color hsl string
             * @param {Boolean} alpha
             * @return {String}
             */
            this.toHslString = function( alpha ) {
                return (alpha?"hsla":"hsl")+"("+
                    Math.round( hsl.h * 360 )+","+
                    Math.round( hsl.s * 100 )+"%,"+
                    Math.round( hsl.l * 100 )+"%"+
                    (alpha?","+hsl.a:"")+")";
            };

            /**
             * outputs a css color hsla string
             * @return {String}
             */
            this.toHslaString = function() {
                return self.toHslString( true );
            };

            /**
             * outputs a css color rgb string
             * @param {Boolean} alpha
             * @return {String}
             */
            this.toRgbString = function(alpha) {
                return (alpha?"rgba":"rgb")+"("+
                    Math.round( rgb.r * 255 )+","+
                    Math.round( rgb.g * 255 )+","+
                    Math.round( rgb.b * 255 )+
                    (alpha?","+rgb.a:"")+")";
            };

            /**
             * outputs a css color rgba string
             * @return {String}
             */
            this.toRgbaString = function() {
                return self.toRgbString(true)
            };

            return this.init(value);
        };

    };

	//register module
	lola.registerModule( new Module() );

})( lola );
