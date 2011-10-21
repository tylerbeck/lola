/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Easing
 *  Description: easing module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "ease",

		//module dependencies
		dependencies: [],

		//initialization flag
		initialized: false,

		//map
		map: {},

		//default
		standard: null,

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.ease.initialized ) {
				//console.info('lola.ease.types.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				//create easeInOut functions for types with easeIn and easeOut
				for ( var k in lola.ease.types ) {
					if (lola.ease.types[k].hasOwnProperty('easeIn') && lola.ease.types[k].hasOwnProperty('easeOut')) {
						var ei = 'lola.ease.types["'+k+'"]["easeIn"]';
						var eo = 'lola.ease.types["'+k+'"]["easeOut"]';
						var fn = 'lola.ease.types["'+k+'"]["easeInOut"] = function( t, v, c, d ){ return (t < d / 2) ? ('+ei+'(t,v,c/2,d/2)) : ('+eo+'( t - d/2,'+ei+'(d,v,c/2,d),c/2,d/2)); }';
						lola.evaluate( fn );
					}
				}

				lola.ease.types.standard = lola.ease.types.cubic.easeInOut;
				lola.ease.map[""] = lola.ease.types.standard;
				lola.ease.map["null"] = lola.ease.types.standard;
				lola.ease.map["default"] = lola.ease.types.standard;
				lola.ease.map["standard"] = lola.ease.types.standard;
				lola.ease.map["undefined"] = lola.ease.types.standard;
				lola.ease.map["none"] = lola.ease.types.linear.easeNone;

				lola.ease.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// get - return function based on string
		//------------------------------------------------------------------
		get: function( value ) {
			//just in case an easing function is already set.
			if ( lola.type.get( value ) == 'function' )
				return value;

			//otherwise return mapped value
			if ( lola.ease.map[ String( value ) ] ) {
				return lola.ease.map[ String( value ) ];
			}
			else {
				//try to map value
				var parts = String( value ).split( '.' );
				var func = lola.ease.types.standard;
				if ( parts.length == 2 ) {
					if ( lola.ease.types[ parts[0] ] ) {
						if ( lola.ease.types[ parts[0] ][parts[1]] )
							func = lola.ease.types[ parts[0] ][parts[1]];
					}
				}
				lola.ease.map[ String( value ) ] = func;
				return func;
			}

		},

		//------------------------------------------------------------------
		// setBackPower - sets params for 'back'
		//------------------------------------------------------------------
		setBackPower: function( value ){
			value = Math.max(value,0);
			value = Math.min(1,value);
			lola.ease.params.back.a = 5.4 * (.25 + value*.75);
			lola.ease.params.back.b = lola.ease.params.back.a - 1;
		},

		//------------------------------------------------------------------
		// draw - draws an easing graph and returns canvas
		//------------------------------------------------------------------
		draw: function( easing, w, h, strokeStyle, axis ){
			var canvas = document.createElement('canvas');
			canvas.width = w;
			canvas.height = h;
			if (canvas.getContext){
				var ctx = canvas.getContext('2d');
				if (axis) {
					ctx.fillStyle = "rgb(50,50,50)";
					ctx.fillRect(0,0,1,h);
					ctx.fillRect(0,3*h/4,w,1);
					ctx.fillStyle = "rgb(200,200,200)";
					ctx.fillRect(1,h/4,w,1)
					ctx.fillText('to',w-15,h/4 - 5);
					ctx.fillText('from',10,3*h/4 + 15);
				}

				//draw easing
				ctx.beginPath();
				ctx.strokeStyle = strokeStyle;
				ctx.moveTo( 0,3*h/4 );

				var c = h/2;
				var e = lola.ease.get( easing );
				for (var t = 0; t<= w; t++ ){
					ctx.lineTo(t, 3*h/4 - e(t,0,c,w));
				}
				ctx.stroke();
			}

			return canvas;
		},



		//------------------------------------------------------------------
		// easing functions
		//------------------------------------------------------------------
		/*
		 t - time in millis
		 v - initial value
		 c - value change
		 d - duration in millis
		 */
		//---------------------------------
		params: {
			back: { a: 2.7, b: 1.7 }
		},

		types: {
			back: {
				easeIn: function( t, v, c, d ) {
					return c * (t /= d) * t * (lola.ease.params.back.a * t - lola.ease.params.back.b) + v;
				},
				easeOut: function( t, v, c, d ) {
					return c * ((t = t / d - 1) * t * (lola.ease.params.back.a * t + lola.ease.params.back.b) + 1) + v;
				}
			},
			//---------------------------------
			bounce: {
				easeIn: function( t, v, c, d ) {
					return c - lola.ease.types.bounce.easeOut( d - t, 0, c, d ) + v;
				},
				easeOut: function( t, v, c, d ) {
					return ((t /= d) < (1 / 2.75)) ?
								(c * (7.5625 * t * t) + v) :
								( (t < (2 / 2.75)) ?
										(c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + v) :
										( (t < (2.5 / 2.75)) ?
												(c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + v) :
												(c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + v)));
				}
			},
			//---------------------------------
			circular: {
				easeIn: function( t, v, c, d ) {
					return -c * (Math.sqrt( 1 - (t /= d) * t ) - 1) + v;
				},
				easeOut: function( t, v, c, d ) {
					return c * Math.sqrt( 1 - (t = t/d - 1) * t ) + v;
				}
			},
			//---------------------------------
			cubic: {
				easeIn: function( t, v, c, d ) {
					return c * (t /= d) * t * t + v;
				},
				easeOut: function( t, v, c, d ) {
					return c * ((t = t / d - 1) * t * t + 1) + v;
				}
			},
			//---------------------------------
			elastic: {
				easeIn: function( t, v, c, d ) {
					if ( t == 0 ) return v;
					if ( (t /= d) == 1 ) return v + c;
					var p,a,s;
					p = d * 0.3;
					a = c;
					s = p / 4;
					return -(a * Math.pow( 2, 10 * (t -= 1) ) * Math.sin( (t * d - s) * (2 * Math.PI) / p )) + v;
				},
				easeOut: function( t, v, c, d ) {
					if ( t == 0 ) return v;
					if ( (t /= d) == 1 ) return v + c;
					var s,a,p;
					p = d * 0.3;
					a = c;
					s = p / 4;
					return a * Math.pow( 2, -10 * t ) * Math.sin( (t * d - s) * (2 * Math.PI) / p ) + c + v;
				}
			},
			//---------------------------------
			exponential: {
				easeIn: function( t, v, c, d ) {
					return (t == 0) ? v : (c * Math.pow( 2, 10 * (t / d - 1) ) + v);
				},
				easeOut: function( t, v, c, d ) {
					return (t == d) ? (v + c) : (c * (-Math.pow( 2, -10 * t / d ) + 1) + v);
				}
			},
			//---------------------------------
			linear: {
				easeNone: function( t, v, c, d ) {
					return c * t / d + v;
				}
			},
			//---------------------------------
			quadratic: {
				easeIn: function( t, v, c, d ) {
					return c * (t /= d) * t + v;
				},
				easeOut: function( t, v, c, d ) {
					return -c * (t /= d) * (t - 2) + v;
				}
			},
			//---------------------------------
			quartic: {
				easeIn: function( t, v, c, d ) {
					return c * (t /= d) * t * t * t + v;
				},
				easeOut: function( t, v, c, d ) {
					return -c * ((t = t / d - 1) * t * t * t - 1) + v;
				}
			},
			//---------------------------------
			quintic: {
				easeIn: function( t, v, c, d ) {
					return c * (t /= d) * t * t * t * t + v;
				},
				easeOut: function( t, v, c, d ) {
					return c * ((t = t / d - 1) * t * t * t * t + 1) + v;
				}
			},
			//---------------------------------
			sine: {
				easeIn: function( t, v, c, d ) {
					return -c * Math.cos( t / d * (Math.PI / 2) ) + c + v;
				},
				easeOut: function( t, v, c, d ) {
					return c * Math.sin( t / d * (Math.PI / 2) ) + v;
				}
			}
		},


		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

		}

	};


	lola.registerModule( Module );
})( lola );
