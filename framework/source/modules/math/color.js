(function( lola ) {
	var $ = lola;
	/**
	 * Math Color Module
	 * @implements {lola.Module}
	 * @memberof lola.math
	 */
	var color = {

		//==================================================================
		// Attributes
		//==================================================================



		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.color::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization



			//remove initialization method
			delete lola.math.color.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.color::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.math.color.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "math.color";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['math'];
		},


		/**
		 * converts red,green,blue values to hue,saturation,lightness
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @return {Object}
		 */
		rgb2hsl: function( r, g, b ) {
			var hue = 0;
			var saturation = 0;
			var lightness = 0;

			//make sure values are in range
			r = (r < 0) ? 0 : r;
			r = (r > 1) ? 1 : r;
			g = (g < 0) ? 0 : g;
			g = (g > 1) ? 1 : g;
			b = (b < 0) ? 0 : b;
			b = (b > 1) ? 1 : b;

			//set lightness
			var colorMax = (r > g) ? ((b > r) ? b : r) : ((b > g) ? b : g);
			var colorMin = (r < g) ? ((b < r) ? b : r) : ((b < g) ? b : g);
			lightness = colorMax;

			//set saturation
			if ( colorMax != 0 )
				saturation = (colorMax - colorMin) / colorMax;

			//set hue
			if ( saturation > 0 ) {
				var red = (colorMax - r) / (colorMax - colorMin);
				var green = (colorMax - g) / (colorMax - colorMin);
				var blue = (colorMax - b) / (colorMax - colorMin);
				if ( r == colorMax )
					hue = blue - green;

				else if ( g == colorMax )
					hue = 2 + red - blue;

				else
					hue = 4 + green - red;

				hue = hue / 6;

				while ( hue < 0 ) {
					hue++;
				}

			}

			return {h:hue, s:saturation, l:lightness };
		},

		/**
		 * converts red,green,blue values to hex string
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @return {String}
		 */
		rgb2hex: function( r, g, b ) {
			var str = "";

			//make sure values are in range
			r = (r < 0) ? 0 : r;
			r = (r > 1) ? 1 : r;
			g = (g < 0) ? 0 : g;
			g = (g > 1) ? 1 : g;
			b = (b < 0) ? 0 : b;
			b = (b > 1) ? 1 : b;

			var red = Math.round( r * 255 );
			var green = Math.round( g * 255 );
			var blue = Math.round( b * 255 );

			var digits = "0123456789ABCDEF";

			var lku = [];
			lku.push((red - (red % 16)) / 16);
			lku.push( red % 16);
			lku.push((green - (green % 16)) / 16);
			lku.push( green % 16);
			lku.push((blue - (blue % 16)) / 16);
			lku.push( blue % 16);


			lku.forEach( function(i){
				str += digits.charAt( i );
			});

			return str;
		},


		/**
		 * converts red,green,blue values to int
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @return {int}
		 */
		rgb2int: function( r, g, b ) {
			return parseInt("0x"+lola.math.color.rgb2hex(r,g,b));
		},

		/**
		 * converts hue,saturation,lightness values to red,green,blue
		 * @param {Number} h
		 * @param {Number} s
		 * @param {Number} l
		 * @return {Object}
		 */
		hsl2rgb: function( h, s, l ) {
			//make sure values are in range
			h = (h < 0) ? 0 : h;
			h = (h > 1) ? 1 : h;
			s = (s < 0) ? 0 : s;
			s = (s > 1) ? 1 : s;
			l = (l < 0) ? 0 : l;
			l = (l > 1) ? 1 : l;

			var red = 0;
			var green = 0;
			var blue = 0;

			if ( s == 0 ) {
				red = b;
				green = red;
				blue = red;
			}
			else {
				var _h = (h - Math.floor( h )) * 6;
				var _f = _h - Math.floor( _h );

				var _p = l * (1.0 - s);
				var _q = l * (1.0 - s * _f);
				var _t = l * (1.0 - (s * (1 - _f)));

				switch ( Math.floor( _h ) ) {
					case 0:
						red = l;
						green = _t;
						blue = _p;
						break;
					case 1:
						red = _q;
						green = l;
						blue = _p;
						break;
					case 2:
						red = _p;
						green = l;
						blue = _t;
						break;
					case 3:
						red = _p;
						green = _q;
						blue = l;
						break;
					case 4:
						red = _t;
						green = _p;
						blue = l;
						break;
					case 5:
						red = l;
						green = _p;
						blue = _q;
						break;
				}
			}
			return {r:red,g:green,b:blue};
		},

		/**
		 * converts hue,saturation,lightness values to uint
		 * @param {Number} h
		 * @param {Number} s
		 * @param {Number} l
		 * @return {int}
		 */
		hsl2int: function( h, s, l ) {
			var rgb = color.hsl2rgb( h, s, l );
			return color.rgb2int( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * converts hue,saturation,lightness values to hex
		 * @param {Number} h
		 * @param {Number} s
		 * @param {Number} l
		 * @return {String}
		 */
		hsl2hex: function( h, s, l ) {
			var rgb = color.hsl2rgb( h, s, l );
			return color.rgb2hex( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * converts int values to rgb
		 * @param {int} value
		 * @return {Object}
		 */
		int2rgb: function( value ) {
			var str = "";

			//make sure value is in range
			value = (value > 0xFFFFFF) ? 0xFFFFFF : value;
			value = (value < 0x000000) ? 0x000000 : value;

			var red = ((value >> 16) & 0xFF) / 255;
			var green = ((value >> 8) & 0xFF) / 255;
			var blue = ((value) & 0xFF) / 255;


			return {r:red,g:green,b:blue};
		},

		/**
		 * converts int values to hsl
		 * @param {int} value
		 * @return {Object}
		 */
		int2hsl: function( value ) {
			var rgb = color.int2rgb( value );
			return color.rgb2hsl( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * converts int values to hex string
		 * @param {int} value
		 * @return {String}
		 */
		int2hex: function( value ) {
			var rgb = color.int2rgb( value );
			return color.rgb2hex( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * converts hex values to int
		 * @param {String} value
		 * @return {int}
		 */
		hex2int: function( value ) {
			//special case for 3 digit color
			var str;
			if ( value.length == 3 ) {
				str = value[0] + value[0] + value[1] + value[1] + value[2] + value[2]
			}
			else {
				str = value;
			}

			return parseInt( "0x" + str );
		},

		/**
		 * converts hex values to rgb
		 * @param {String} value
		 * @return {Object}
		 */
		hex2rgb: function( value ) {
			return color.int2rgb( color.hex2int( value ) );
		},

		/**
		 * converts hex values to hsl
		 * @param {String} value
		 * @return {Object}
		 */
		hex2hsl: function( value ) {
			return color.int2hsl( color.hex2int( value ) );
		},


		//==================================================================
		// Classes
		//==================================================================



		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================




	//register module
	lola.registerModule( color );

})( lola );

