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
	 * @namespace lola.css
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

        /*
         * cache for fixed/mapped selectors
         * @private
         */
        //var selectorCache = {};

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
            $.syslog( 'lola.css::initialize' );

            //add default hooks
            var dimensionals = "padding margin background-position border-top-width border-right-width border-bottom-width "+
                "border-left-width border-width bottom font-size height left line-height list-style-position "+
                "margin margin-top margin-right margin-bottom margin-left max-height max-width min-height "+
                "min-width outline-width padding padding-top padding-right padding-bottom padding-left right "+
                "text-indent top width";

            dimensionals.split(' ').forEach( function( item ){
                self.registerStyleHook( item, dimensionalHook );
            });

            //add default mappings
            propertyCache['float'] = ($.support.cssFloat) ? 'cssFloat' : 'styleFloat';

            //register default hooks
            var getOffsetStyle = function( node, style, value, type ){
                var result = self.style( node, style, value, false );
                if (result == "auto"){
                    //get actual value
                    var offset = $.geometry.getOffset( node, node.offsetParent );
                    return offset[type]+'px';
                }
                return result;
            };
            self.registerStyleHook( 'top', function( node, style, value ){
                return getOffsetStyle(node, style, value, 'y');
            });
            self.registerStyleHook( 'left', function( node, style, value ){
                return getOffsetStyle(node, style, value, 'x');
            });

            //remove initialization method
            delete self.initialize;
        };

        /**
         * returns whether or not an object can have styles applied
         * @param {*} obj
         */
        function canStyle( obj ) {
            //TODO: Implement canStyle function
            return obj != false;
        }

        /*
         * gets mapped selector string
         * @param {String} selector
         * @return {String}

        function getSelector( selector ) {
            if ( !selectorCache[selector] )
                selectorCache[selector] = $.string.camelCase( selector );
            return selectorCache[selector];
        }*/

        /**
         * gets mapped selector string
         * @param {String} property
         * @return {String}
         */
        function getProperty( property ) {
            if ( !propertyCache[property] )
                propertyCache[property] = $.string.camelCase( property );
            return propertyCache[ property ];
        }

        /**
         * gets/sets style on an object
         * @public
         * @param {Node} node styleable object
         * @param {String} style style property
         * @param {*} value leave undefined to get style
         * @param {Boolean} useHooks set to
         * @return {*}
         */
        this['style'] = function( node, style, value, useHooks ) {

            //make sure style can be set
            var prop = getProperty( style );
            if ( canStyle( node ) ) {
                if ( propertyHooks[ prop ] != null && useHooks !== false ) {
                    return propertyHooks[prop].apply( node, arguments );
                }
                else {
                    if ( value == undefined )
                        return self.getRawStyle( node, prop );
                    else
                        return self.setRawStyle( node, prop, value );
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
            //console.log( 'getting raw style', '"'+prop+'"', '"'+$.string.dashed( prop )+'"', node );

            var result = node.style[prop];
            if ( !result || result == "" ){
                //console.log('element style not set');
                var compStyle;

                if ( document.defaultView && document.defaultView.getComputedStyle ) {
                    //console.log( document.defaultView );
                    //console.log( document.defaultView.getComputedStyle );
                    compStyle = document.defaultView.getComputedStyle( node, undefined );
                }

                if (compStyle){
                    //console.log( 'using getComputedStyle', compStyle );
                    result = compStyle.getPropertyValue( $.string.dashed(prop) );
                }
                else if ( typeof(document.body.currentStyle) !== "undefined") {
                    //console.log( 'using currentStyle', node["currentStyle"] );
                    result = node["currentStyle"][prop];
                }
                else {
                    result = undefined;
                }
            }

            return result;
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
            var result;
            if (value == undefined) {
                result = self.getRawStyle( obj, style );
                result = parseFloat(result.replace( $.regex.isDimension, "$1"));
            }
            else {
                value = (String(value).match($.regex.isDimension) || value == 'auto' || value == 'inherit') ? value : value+"px";
                result = self.setRawStyle( obj, style, value );
            }

            return result;
        }

        /**
         * adds a stylesheet to the document head with an optional source
         * @param {String|undefined} id reference id for stylesheet
         * @param {String|undefined} source url for external stylesheet
         */
        this.addStyleSheet = function( id, source ) {
            $.syslog('addStyleSheet',$.support.cssRules, id, source );
            var stylesheet;
            if ($.support.cssRules){
                stylesheet = document.createElement( 'style' );
                $.dom.attr(stylesheet, "type", "text/css");
            }
            else{
                stylesheet = document.createStyleSheet();
            }
            var head = document.getElementsByTagName("head")[0];
            head.appendChild( stylesheet );


            if (source) {
                stylesheet.source = source;
            }
            if (id) {
                self.registerStyleSheet( stylesheet, id );
            }
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
            if ($.type.get(stylesheet) == "string" ){
                stylesheet = stylesheets["_default"];
            }
            stylesheet = stylesheet || stylesheets["_default"];
            styles = styles || [];

            var ri = $.support.cssRules ? stylesheet.cssRules.length : stylesheet.rules.length;
            if ( stylesheet.addRule )
                stylesheet.addRule( selector, null, ri );
            else
                stylesheet.insertRule( selector + ' { }', ri );

            var rule = $.support.cssRules ? stylesheet.cssRules[ri] : stylesheet.rules[ri];
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
                    var rules = ($.support.cssRules) ? ss.cssRules : ss.rules;
                    for ( var ri in rules ) {
                        if ( rules.hasOwnProperty(ri)){
                            if ( rules[ri] && rules[ri].selectorText ) {
                                if ( rules[ri].selectorText.toLowerCase() == selector ) {
                                    //console.info( 'matched rule: ' + rules[ri].selectorText );
                                    action( si, ri );
                                }
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
            self.performRuleAction( selector, function( si, ri ) {
                if ( $.support.cssRules )
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
            var rules = self.getRules( selector, media );
            var props = styles.keys();
            props.forEach( function( item ){
                rules.forEach( function( rule ){
                    self.style( rule, item, styles[item] );
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
            self.performRuleAction( selector, function( si, ri ) {
                if ( $.support.cssRules )
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
                //console.log('setting classes:', classes);
                if ( $.type.get( classes ) != 'array' ) {
                    if ( $.type.get( classes ) == 'string' )
                        classes = [classes];
                    else
                        classes = [];
                }
                obj.className = classes.join( " " );
                return classes;

            }
            else {
                var names = (obj && obj.className) ? obj.className.replace( $.regex.extraSpace , " " ): "";
                return names.split( " " ).reverse();
            }
        };

        /**
         * returns
         * @param obj
         * @param className
         */
        this.hasClass = function( obj, className ) {
            var names = self.classes( obj );
            return $.array.isIn( names, className );
        };

        /**
         * adds class to object if not already added
         * @param {Node} obj
         * @param {String} className
         */
        this.addClass = function( obj, className ) {
            //console.log('$.addClass: ',obj, className);
            var names = self.classes( obj );
            if ( names.indexOf( className ) == -1 ) {
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
            var names = self.classes( obj );
            //console.log('$.removeClass: ', className);
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
                return this._( self.style, property, value );
            },

            /**
             * sets or gets classes for elements
             * @param {String|Array|undefined} values
             */
            classes: function( values ) {
                return this._( self.classes, values );
            },

            /**
             * checks that all elements in selector have class
             * @param {String} name
             */
            hasClass: function( name ) {
                return this.every( function( item ) {
                    return self.hasClass( item, name )
                } );
            },

            /**
             * adds class to all elements
             * @param {String} name
             */
            addClass: function( name ) {
                return this.s( self.addClass, name );
            },

            /**
             * removes class from all elements
             * @param {String} name
             */
            removeClass: function( name ) {
                return this.s( self.removeClass, name );
            }

        };

        //==================================================================
        // Classes
        //==================================================================
        this.Color = function( value ){
	        var $ = lola;
	        var self = this;
            var c = $.math.color;
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
             * parses style color values
             * @public
             * @param {String|Object} val
             */
            function parseValue( val ) {
                if (typeof val == "string"){
                    var cparts = val.match( $.regex.isColor );
                    if ( cparts ) {
                        var parts;
                        switch ( cparts[1] ) {
                            case '#':
                                parts = val.match( $.regex.isHexColor );
                                hex = ( parts != null ) ? parts[1] : "000000";
                                rgb = c.hex2rgb(hex);
                                hsl = c.rgb2hsl( rgb.r, rgb.g, rgb.b );
                                rgb.a = hsl.a = 1;
                                break;
                            case 'rgb':
                            case 'rgba':
                                rgb = parseRGBColorString( val );
                                hex = c.rgb2hex( rgb.r, rgb.g, rgb.b );
                                hsl = c.rgb2hsl( rgb.r, rgb.g, rgb.b );
                                break;
                            case 'hsl':
                            case 'hsla':
                                hsl = parseHSLColorString( val );
                                rgb = c.hsl2rgb(hsl.h,hsl.s,hsl.l);
                                hex = c.rgb2hex(rgb.r, rgb.g, rgb.b);
                                rgb.a = hsl.a;
                                break;
                        }
                    }
                }
                else{
                    if ( val.r != undefined && val.g != undefined && val.b != undefined){
                        //rgba
                        rgb = val;
                        hex = c.rgb2hex( rgb.r, rgb.g, rgb.b );
                        hsl = c.rgb2hsl( rgb.r, rgb.g, rgb.b );
                    }
                    else if ( val.h != undefined && val.s != undefined && val.l != undefined){
                        hsl = val;
                        rgb = c.hsl2rgb(hsl.h,hsl.s,hsl.l);
                        hex = c.rgb2hex(rgb.r, rgb.g, rgb.b);
                    }

                    if (val.a != undefined){
                        rgb.a = val.a;
                        hsl.a = val.a;
                    }
                    else{
                        rgb.a = 1;
                        hsl.a = 1;
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
                var parts = val.match( $.regex.isHSLColor );
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
                var parts = val.match( $.regex.isRGBColor );
                if ( parts != null ) {
                    var v = parts[1].replace( /\s+/g, "" );
                    v = v.split( ',' );
                    c.r = parseColorPart( v[0], 255  );
                    c.g = parseColorPart( v[1], 255  );
                    c.b = parseColorPart( v[2], 255  );
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

            parseValue(value);
            return this;
        };


        //==================================================================
        // Preinitialization
        //==================================================================
        //TODO:this breaks in IE browsers and needs to be fixed
        //add default stylesheet for dynamic rules
        //self.addStyleSheet( "_default" );


    };

	//register module
	lola.registerModule( new Module() );

})( lola );
