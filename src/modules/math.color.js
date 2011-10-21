/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Color conversions
 *  Description: color conversion module
 *          Author: Copyright 2011, Tyler Beck
 *
 *  ALL HSL && RGB colors are passed as 0-1 values!
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "math.color",

		//module dependencies
		dependencies: [],

		//initialization flag
		initialized: false,


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.math.color.initialized ) {
				//console.info( 'lola.math.color.initialize' );

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );


				lola.math.color.initialized = true;
			}
		},


		//------------------------------------------------------------------
		// rgb2int: converts red,green,blue values to a int
		//------------------------------------------------------------------
		rgb2int: function( r, g, b ) {
			//make sure values are in range
			r = (r < 0) ? 0 : r;
			r = (r > 1) ? 1 : r;
			g = (g < 0) ? 0 : g;
			g = (g > 1) ? 1 : g;
			b = (b < 0) ? 0 : b;
			b = (b > 1) ? 1 : b;

			var u = (Math.round( r * 255 ) << 16 ) | (Math.round( g * 255 ) << 8 ) | ( Math.round( b * 255 ) );

			return u;
		},

		//------------------------------------------------------------------
		// rgb2hsl: converts red,green,blue values to hue,saturation,lightness
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// rgb2hex: converts red,green,blue values to hex string
		//------------------------------------------------------------------
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

			var lku = []
			lku[0] = (red - (red % 16)) / 16;
			lku[1] = red % 16;
			lku[2] = (green - (green % 16)) / 16;
			lku[3] = green % 16;
			lku[4] = (blue - (blue % 16)) / 16;
			lku[5] = blue % 16;

			for ( var i in lku ) {
				str += digits[ lku[i] ];
			}

			return str;
		},

		//------------------------------------------------------------------
		// hsl2rgb: converts hue,saturation,lightness values to red,green,blue
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// hsl2int: converts hue,saturation,lightness values to int
		//------------------------------------------------------------------
		hsl2int: function( h, s, l ) {
			var rgb = hsl2rgb( h, s, l );
			return lola.math.color.rgb2int( rgb.r, rgb.g, rgb.b );
		},

		//------------------------------------------------------------------
		// hsl2hex: converts hue,saturation,lightness values to hex string
		//------------------------------------------------------------------
		hsl2hex: function( h, s, b ) {
			var rgb = hsl2rgb( h, s, l );
			return lola.math.color.rgb2hex( rgb.r, rgb.g, rgb.b );
		},

		//------------------------------------------------------------------
		// int2rgb: converts int values to red,green,blue
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// int2hsl: converts int values to hue,saturation,lightness
		//------------------------------------------------------------------
		int2hsl: function( value ) {
			var rgb = int2rgb( value );
			return lola.math.color.rgb2hsl( rgb.r, rgb.g, rgb.b );
		},

		//------------------------------------------------------------------
		// int2hex: converts int values to hex string
		//------------------------------------------------------------------
		int2hex: function( value ) {
			var rgb = int2rgb( value );
			return lola.math.color.rgb2hex( rgb.r, rgb.g, rgb.b );
		},

		//------------------------------------------------------------------
		// hex2int: converts hex color string value to int
		//------------------------------------------------------------------
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

		//------------------------------------------------------------------
		// hex2rgb: converts hex string value to red,green,blue
		//------------------------------------------------------------------
		hex2rgb: function( value ) {
			return lola.math.color.int2rgb( lola.math.color.hex2int( value ) );
		},

		//------------------------------------------------------------------
		// hex2hsl: converts hex string value to hue,saturation,lightness
		//------------------------------------------------------------------
		hex2hsl: function( value ) {
			return lola.math.color.int2hsl( lola.math.color.hex2int( value ) );
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

		}

	};
	lola.registerModule( Module );
})( lola );
