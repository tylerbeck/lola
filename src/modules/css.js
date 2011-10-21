/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: CSS
 *  Description: CSS module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "css",

		//module dependencies
		dependencies: ['util','type'],

		//initialization flag
		initialized: false,

		//selector cache
		cache:{},

		//selector hooks
		/*
		var hook = function( obj, style, value ){
			if ( value == undefined ) {
				//get style
			}
			else {
				//set style;
			}
		}
		*/
		hooks:{},

		//color styles

		//length styles

		//regex
		rXtraSpc: /\s\s+/g,

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.css.initialized ) {
				//console.info('lola.css.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				//add default selectors
				lola.css.cache['float'] = (lola.support.cssFloat) ? 'cssFloat' : 'styleFloat';
				//add default hooks

				//set rule suport type
				lola.support.cssRules = ( (document.styleSheets.length > 0 && document.styleSheets[0].cssRules) || !document.createStyleSheet ) ? true : false;

				lola.css.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// can apply styles
		//------------------------------------------------------------------
		canStyle: function( obj ) {
			//make sure style can be set
			//TODO: FIX THIS
			return true;//( !obj || !obj.style || obj.nodeType === 3 || obj.nodeType === 8 );
		},

		//------------------------------------------------------------------
		// fixSelector
		//------------------------------------------------------------------
		fixSelector: function( selector ) {
			if ( !lola.css.cache[selector] ) {
				//create and cache fixed selector
				lola.css.cache[ selector ] = lola.string.camelCase( selector );
			}
			return lola.css.cache[selector];
		},

		//------------------------------------------------------------------
		// set/get style
		//------------------------------------------------------------------
		style: function( obj, style, value ) {
			//console.info('css.style: '+style+' '+((value==undefined)?'get':'set -> '+value));
			//make sure style can be set
			if ( lola.css.canStyle( obj ) ) {
				if ( lola.css.hooks[ style ] != null ) {
					return lola.css.hooks[style].apply( obj, arguments );
				}
				else {
					var selector = lola.css.fixSelector( style );
					if ( value == undefined ) {
						if (document.defaultView && document.defaultView.getComputedStyle) {
							return document.defaultView.getComputedStyle( obj )[selector];
						}
						else if ( typeof(document.body.currentStyle) !== "undefined") {
							return obj["currentStyle"][selector];
						}
					}
					else {
						return obj.style[ selector ] = value;
					}
				}
			}
		},

		//------------------------------------------------------------------
		// performs action on matching rules
		//------------------------------------------------------------------
		performRuleAction: function( selector, action, media ) {
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
								console.info( 'matched rule: ' + rules[ri].selectorText );
								action( si, ri );
							}
						}
					}
				}
			}
		},

		//------------------------------------------------------------------
		// delete matching rules
		//------------------------------------------------------------------
		deleteRules: function( selector, media ) {
			lola.css.performRuleAction( selector, function( si, ri ) {
				if ( lola.support.cssRules )
					document.styleSheets[ si ].deleteRule( ri );
				else
					document.styleSheets[ si ].removeRule( ri );
			}, media )
		},

		//------------------------------------------------------------------
		// get matching rules
		//------------------------------------------------------------------
		getRules: function( selector, media ) {
			var rules = [];
			lola.css.performRuleAction( selector, function( si, ri ) {
				if ( lola.support.cssRules )
					rules.push( document.styleSheets[ si ].cssRules[ ri ] );
				else
					rules.push( document.styleSheets[ si ].rules[ ri ] );
			}, media );
			return rules;
		},

		//------------------------------------------------------------------
		// update matching rules
		//------------------------------------------------------------------
		updateRules: function( selector, style, value, media ) {
			var rules = lola.css.getRules( selector, media );
			for ( var i in rules ) {
				lola.css.style( rules[i], style, value );
			}
			return rules;
		},

		//------------------------------------------------------------------
		// update matching rules
		//------------------------------------------------------------------
		addRule: function( selector ) {
			var ssi = document.styleSheets.length - 1;
			var ri = lola.support.cssRules ? document.styleSheets[ssi].cssRules.length : document.styleSheets[ssi].rules.length;
			if ( document.styleSheets[0].addRule )
				document.styleSheets[ document.styleSheets.length - 1 ].addRule( selector, null, ri );
			else
				document.styleSheets[ document.styleSheets.length - 1 ].insertRule( selector + ' { }', ri );

			return lola.css.getRules( selector )[0];
		},


		//------------------------------------------------------------------
		// set / get classes
		//------------------------------------------------------------------
		classes: function( obj, classes ) {
			if ( classes != undefined ) {
				if ( lola.type.get( classes ) != 'array' ) {
					if ( lola.type.get( classes ) == 'string' )
						classes = [classes];
					else
						classes = [];
				}

				return obj.className = classes.join( " " );

			}
			else {
				var names = obj.className.replace( lola.css.rXtraSpc, " " );
				//console.log('classes: '+names);
				return names.split( " " ).reverse();
			}
		},

		//------------------------------------------------------------------
		// hasClass
		//------------------------------------------------------------------
		hasClass: function( obj, className ) {
			var names = lola.css.classes( obj );
			return lola.array.isIn( names, className );
		},

		//------------------------------------------------------------------
		// addClass
		//------------------------------------------------------------------
		addClass: function( obj, className ) {
			var names = lola.css.classes( obj );
			if ( !lola.array.isIn( names, className ) ) {
				names.push( className );
				lola.css.classes( obj, names );
			}
		},

		//------------------------------------------------------------------
		// removeClass
		//------------------------------------------------------------------
		removeClass: function( obj, className ) {
			var names = lola.css.classes( obj );
			var index = names.indexOf( className );
			if ( index >= 0 ) {
				names.splice( index, 1 );
				lola.css.classes( obj, names );
			}
		},

		//------------------------------------------------------------------
		// clearStyle
		//------------------------------------------------------------------
		clearStyle: function( obj, style ) {
			delete obj.style[ lola.css.fixSelector( style ) ];
		},

		//------------------------------------------------------------------
		// parses style color values returns rgba 6object
		//------------------------------------------------------------------
		parseColor: function( val ) {
			//console.info('parseColor ------ ');
			var rgba = {r:0,g:0,b:0,a:1};
			var cparts = val.match( lola.type.rIsColor );
			if ( cparts ) {
				var a,v,parts;
				switch ( cparts[1] ) {
					case '#':
						parts = val.match( lola.type.rIsHexColor );
						//console.info(parts);
						if ( parts != null ) {
							rgba = lola.math.color.hex2rgb( parts[1] );
							rgba.a = 1;
						}
						break;
					case 'rgb':
					case 'rgba':
						rgba = lola.css.parseRGBColor( val );
						break;
					case 'hsl':
					case 'hsla':
						var hsla = lola.css.parseHSLColor( val );
						rgba = lola.math.color.hsl2rgb( hsla.h, hsla.s, hsla.l );
						rgba.a = a;
						break;
				}
			}
			//console.info(rgba);
			return rgba;
		},

		//------------------------------------------------------------------
		// parses rgb color
		//------------------------------------------------------------------
		parseRGBColor: function( val ) {
			var rgba = { r:0, g:0, b:0, a:1 };
			var parts = val.match( lola.type.rIsRGBColor );
			if ( parts != null ) {
				var v = parts[1].replace( /\s+/g, "" );
				v = v.split( ',' );
				rgba.r = lola.css.parseColorPart( v[0] );
				rgba.g = lola.css.parseColorPart( v[1] );
				rgba.b = lola.css.parseColorPart( v[2] );
				rgba.a = (v.length > 3) ? lola.css.parseColorAlpha( v[3] ) : 1;
			}
			return rgba;
		},

		//------------------------------------------------------------------
		// parses hsl color
		//------------------------------------------------------------------
		parseHSLColor: function( val ) {
			var hsla = { h:0, s:0, l:0, a:1 };
			var parts = val.match( lola.type.rIsHSLColor );
			if ( parts != null ) {
				var v = parts[1].replace( /\s+/g, "" );
				v = v.split( ',' );
				hsla.h = lola.css.parseColorPart( v[0] );
				hsla.s = lola.css.parseColorPart( v[1] );
				hsla.l = lola.css.parseColorPart( v[2] );
				hsla.a = (v.length > 3) ? lola.css.parseColorAlpha( v[3] ) : 1;
			}
			return hsla;
		},

		//------------------------------------------------------------------
		// parses style color part
		//------------------------------------------------------------------
		parseColorPart: function( val ) {
			if ( val ) {
				if ( val.indexOf( '%' ) > 0 )
					return parseFloat( val.replace( /%/g, "" ) ) / 100;
				else
					return parseFloat( val ) / 255;
			}
			return 0;

		},

		//------------------------------------------------------------------
		// parses style color part
		//------------------------------------------------------------------
		parseColorAlpha: function( val ) {
			if ( val ) {
				if ( val.indexOf( '%' ) > 0 )
					return parseFloat( val.replace( /%/g, "" ) ) / 100;
				else
					return parseFloat( val );
			}
			return 1;

		},


		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			//set & get css styles
			css: function( selector, value ) {
				if ( value != undefined ) {
					this.foreach( function( item ) {
						lola.css.style( item, selector, value );
					} );
					return this;
				}
				else {
					return lola.css.style( this.get(), selector );
				}
			},

			//set & get css styles
			classes: function( values ) {
				if ( values != undefined ) {
					//set class names
					this.foreach( function( item ) {
						lola.css.classes( item, values );
					} );
					return this;

				}
				else {
					//get class names
					var names = [];
					this.foreach( function( item ) {
						names = names.concat( lola.css.classes( item ) );
					} );

					return lola.array.unique( names );
				}


			},

			//checks for existence of class
			hasClass: function( name ) {
				var check = true;
				this.foreach( function( item ) {
					if (!lola.css.hasClass( item, name )){
						check = false;
					}
				} );
				return check;
			},


			//add class to selection
			addClass: function( name ) {
				this.foreach( function( item ) {
					lola.css.addClass( item, name );
				} );
				return this;
			},

			//remove class from selection
			removeClass: function( name ) {
				this.foreach( function( item ) {
					lola.css.removeClass( item, name );
				} );
				return this;
			},

			show: function(){
				var data = this.getData('_css.original', true);
				return this.css( 'display', data.display ? data.display : 'block' );
			},

			hide: function(){
				var data = this.getData('_css.original', true);
				data.display = this.css( 'display');
				return this.css( 'display', 'none' );
			}



		}

	};
	lola.registerModule( Module );
})( lola );

