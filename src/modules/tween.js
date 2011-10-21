/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Tweening
 *  Description: tween module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "tween",

		//module dependencies
		dependencies: ['array','ease', 'math.color'],

		//initialization flag
		initialized: false,

		//tween ids
		idSequence: 1,
		unusedIds: [],

		//tween stacks map
		//    map[ tweenId ][ property ] = stack;
		map: {},
		index: {}, //index[tweenId] = target;

		//tween property initializers / proxies
		//type: { proxy:[function valueTweenProxy],
		//        parse:[function valueParser],
		//        canTween:[function valueComparison],
		//        getDelta:[function valueComparison],
		//        match:[regex useThisTypeTest] }
		types: [],
		hooks: {},

		//animation frame function type
		getFrameType: 0,

		//animation frame delay (ms) for non-optimized animations
		tickDelay: 30,

		//last time a tick was executed
		lastTick: 0,
		deltaTick: 0,
		currentTick: 0,


		//==================================================================
		// Classes
		//==================================================================
		//------------------------------------------------------------------
		// Instance - tweens a single property on a single target
		//------------------------------------------------------------------
		TweenInstancePrototype: {
			//object on which to tween property
			target: null,
			//property to tween
			property: null,
			//property is setter
			type: null,
			//easing method
			easing: null,
			//epoch time of animation start
			startTime: 0,
			//length of animation in millis
			duration: 500,
			//from value
			from: null,
			//to value
			to: null,
			//value change (non proxy only)
			delta: null,
			//value calculation proxy
			proxy: false,
			//animation status [waiting: -1, hold: 0, active: 1, processing complete: 2 ]
			status: -1,
			//value getter/setter
			getSet:null,
			//last calculated value
			value:null,

			//create tween instance amount = {(to |&&| from) || delta)
			init: function( target, property, amount, delay, duration, easing, getSet ) {
				//console.info( 'lola.tween.Instance.init: ' + target + ', ' + property  );
				//check required values
				if ( target && property && amount ) {
					this.target = target;
					this.property = property;
				}
				else {
					throw new Error( 'invalid values' );
				}

				// try to get a value for to
				var deltaMethod = 0;
				if ( amount.to == null || amount.to == undefined ) {
					if ( amount.add ) {
						this.to = amount.add;
						deltaMethod = 1;
					}
					else if ( amount.subtract ) {
						this.to = amount.subtract;
						deltaMethod = -1;
					}
					else if ( getSet ) {
						this.to = getSet.call( this, target, property );
					}
					else {
						this.to = target[ property ];
					}
				}
				else {
					this.to = amount.to;
				}

				// try to get a value for from
				if ( amount.from == null || amount.from == undefined ) {
					if ( getSet ) {
						this.from = getSet.call( this, target, property );
					}
					else {
						this.from = target[ property ];
					}
				}
				else {
					this.from = amount.from;
				}

				//set initial value;
				this.value = this.from;

				//set attributes
				this.easing = lola.ease.get( easing );
				this.duration = (duration) ? parseInt( duration ) : 500;
				this.startTime = 0 - ((delay) ? parseInt( delay ) : 0);
				this.getSet = getSet;


				//determine how to tween values
				var ttype;
				if ( lola.tween.hooks[ property ] ) {
					ttype = lola.tween.hooks[ property ];
					//console.info('   tween type: using hook -> '+property);
				}
				else {
					for ( var i in lola.tween.types ) {
						ttype = lola.tween.types[i];
						if ( ttype.match.test( String( this.to ) ) && ttype.match.test( String( this.from ) ) ) {
							//console.info('   tween type: using indexed -> '+i);
							break;
						}
						else {
							ttype = null;
						}
					}
				}

				if ( ttype ) {
					// test parsed objects to see if they can be tweened
					if ( !ttype.canTween( this.from, this.to ) ) {
						ttype = null;
					}
					else {
						this.to = ttype.parse( this.to );
						this.from = ttype.parse( this.from );
						this.delta = ttype.getDelta( this.to, this.from, deltaMethod );
					}
				}

				if ( ttype == null ) {
					//if no tween type has been found use setAfter
					//console.info('   null tween type: using setBeforeAndAfter');
					ttype = { proxy: lola.tween.setBeforeAndAfterProxy };
				}

				this.proxy = ttype.proxy;

				//console.info( this );

				return this;
			},

			//calculates next value
			process: function() {
				var elapsed = lola.tween.currentTick - this.startTime;
				//console.info('  process: '+elapsed+'/'+this.duration );
				if ( elapsed >= this.duration ) {
					elapsed = this.duration;
					//mark processing complete
					this.status = 2;
				}
				//console.info(this);
				if ( this.proxy )
					this.value = this.proxy( this.easing, elapsed, this.to, this.from, this.delta, this.duration );
				else
					this.value = this.easing.call( this, elapsed, this.from, this.delta, this.duration );
			},

			//apply current value
			applyValue: function() {
				if ( this.value != null ) {
					if ( this.getSet )
						this.getSet( this.target, this.property, this.value );
					else
						this.target[ this.property ] = this.value;
				}

				return true;
			},

			//executes frame - returns whether tween is complete or not
			execute: function() {
				//console.info('execute: '+this.status);
				if ( this.status == 1 ) {
					//active tween
					this.process( lola.tween.currentTick );
				}
				else if ( this.status == 0 ) {
					//hold tween by adding delta to start
					this.startTime += lola.tween.deltaTick;
				}
				else if ( this.status == 2 ) {
					//processing complete
					return false;
				}
				else {
					//new or delayed tween, set value and start time
					if ( this.startTime < 0 )
						this.startTime += lola.tween.deltaTick;
					else {
						this.startTime = lola.tween.currentTick;
						this.status = 1;
					}
				}

				//again
				return true;

			}

		},

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.tween.initialized ) {
				//console.info( 'lola.tween.initialize' );

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				//get optimized animation timer function
				if ( window.requestAnimationFrame )
					lola.tween.getFrameType = 1;
				if ( window.mozRequestAnimationFrame )
					lola.tween.getFrameType = 2;
				else if ( window.webkitRequestAnimationFrame )
					lola.tween.getFrameType = 3;
				else if ( window.oRequestAnimationFrame )
					lola.tween.getFrameType = 4;

				lola.support.browserAnimationFrame = lola.tween.getFrameType > 0;


				//setup tween types
				var simpleTween = {
					match: lola.type.rIsNumber,
					parse: function( val ) {
						return parseFloat( val );
					},
					canTween: function( a, b ) {
						return (a!=undefined && b!=undefined) && (a!=null && b!=null)
					},
					getDelta: function( to, from, method ) {
						if ( method == 0 )
							return to - from;
						else if ( method == 1 )
							return to;
						else
							return 0 - to;
					},
					proxy: null
				};

				var dimensionalTween = {
					match: lola.type.rIsDimension,
					parse: function( val ) {
						var parts = String( val ).match( lola.type.rIsDimension );
						return { value: parseFloat( parts[1] ), units: parts[2] };
					},
					canTween: function( a, b ) {
						return (a!=undefined && b!=undefined) && (a!=null && b!=null) && (a.units == b.units) ;
					},
					getDelta: function( to, from, method ) {
						if ( method == 0 )
							return {value:to.value - from.value, units:to.units};
						else if ( method == 1 )
							return {value:to.value, units:to.units};
						else
							return {value:0 - to.value, units:to.units};
					},
					proxy: function( easing, elapsed, to, from, delta, duration ) {
						return ( "" + easing( elapsed, from.value, delta.value, duration ) + delta.units);
					}
				};

				var colorTween = {
					match: lola.type.rIsColor,
					parse: lola.css.parseColor,
					canTween: function( a, b ) {
						return ( a && b );
					},
					getDelta: function( to, from, method ) {
						if ( method == 0 )
							return {r:to.r - from.r, g:to.g - from.g, b:to.b - from.b, a:to.a - from.a };
						else if ( method == 1 )
							return {r:to.r, g:to.g, b:to.b, a:to.a };
						else
							return {r:0 - to.r, g:0 - to.g, b:0 - to.b, a:0 - to.a };

					},
					proxy: function( easing, elapsed, to, from, delta, duration ) {
						var r = Math.floor( easing( elapsed, from.r, delta.r, duration ) * 255 );
						var g = Math.floor( easing( elapsed, from.g, delta.g, duration ) * 255 );
						var b = Math.floor( easing( elapsed, from.b, delta.b, duration ) * 255 );
						var a = easing( elapsed, from.a, delta.a, duration );
						//console.info('  rgb('+r+','+g+','+b+')');
						if ( lola.support.colorAlpha )
							return "rgba(" + [r,g,b,a].join( ',' ) + ")";
						else
							return "rgb(" + [r,g,b].join( ',' ) + ")";
					}
				};

				lola.tween.types.push( simpleTween, dimensionalTween, colorTween );

				//set up tween classes

				var TweenInstance = function ( target, property, type, amount, delay, duration, easing, setter ) {
					return this.init( target, property, type, amount, delay, duration, easing, setter );
				};
				TweenInstance.prototype = lola.tween.TweenInstancePrototype;
				lola.setProperty( lola, "tween", 'TweenInstance', TweenInstance );

				lola.tween.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// getNextTweenId - gets next available tweenID
		//------------------------------------------------------------------
		getNextTweenId: function() {
			if ( lola.tween.unusedIds.length > 0 )
				return lola.tween.unusedIds.pop();
			else
				return lola.tween.idSequence++;
		},

		//------------------------------------------------------------------
		// get next frame
		//------------------------------------------------------------------
		getFrame: function() {
			// firefox 4 throws exception unless get frame is done like this
			switch ( lola.tween.getFrameType ) {
				case 1:
					lola.window.requestAnimationFrame( lola.tween.tick );
					break;
				case 2:
					lola.window.mozRequestAnimationFrame( lola.tween.tick );
					break;
				case 3:
					lola.window.webkitRequestAnimationFrame( lola.tween.tick );
					break;
				case 4:
					lola.window.oRequestAnimationFrame( lola.tween.tick );
					break;
				default:
					setTimeout( lola.tween.tick, lola.tween.tickDelay );
					break;
			}

		},

		//------------------------------------------------------------------
		// tick - execute tween stack
		//------------------------------------------------------------------
		tick: function() {
			//dispatch tick event
			//lola.event.trigger( this, 'tweenTick', false, false );

			//set ticks
			var now = new Date();
			lola.tween.currentTick = now.getTime();

			if ( lola.tween.lastTick == 0 )
				lola.tween.lastTick = lola.tween.currentTick;
			lola.tween.deltaTick = lola.tween.currentTick - lola.tween.lastTick;

			//apply & calculate values
			var again = lola.tween.executeFrame();
			//console.info('    again: '+again);

			//request next animation frame if stack has items
			if ( again ) {

				lola.tween.getFrame();
				lola.tween.lastTick = lola.tween.currentTick;
			}
			else {
				//nothing left to animate reset everything
				lola.tween.map = {};
				lola.tween.lastTick = lola.tween.currentTick = 0;
			}
		},

		//------------------------------------------------------------------
		// pruneMap - cleans null items from map
		//------------------------------------------------------------------
		pruneMap: function() {
			for ( var id in lola.tween.map ) {
				var hasProps = false;
				for ( var prop in lola.tween.map[id] ) {
					var tmp = [];
					var instance;
					while ( instance = lola.tween.map[id][prop].pop() ) {
						if ( instance != null )
							tmp.push( instance );
					}
					lola.tween.map[id][prop] = tmp;
					if ( lola.tween.map[id][prop].length > 0 )
						hasProps = true;
					else
						delete lola.tween.map[id][prop];
				}
				if ( !hasProps ) {
					lola.event.trigger( lola.tween.index[id], 'tweenComplete', false, false );
					lola.tween.releaseId( id );
				}
			}
		},

		//------------------------------------------------------------------
		// foreach - iterates tween map
		//------------------------------------------------------------------
		foreach: function( callback ) {
			var result = false;
			for ( var id in lola.tween.map ) {
				for ( var prop in lola.tween.map[id] ) {
					for ( var index in lola.tween.map[id][prop] ) {
						result = callback.apply( lola.tween, [ id, prop, index ] ) || result;
					}
				}
			}
			return result;
		},

		//------------------------------------------------------------------
		// applyValue - applies preprocessed value to tweened object
		//------------------------------------------------------------------
		applyValue: function( id, prop, index ) {
			var instance = lola.tween.map[id][prop][index];
			if ( instance ) {
				//console.info('applyValue ---------------');
				//console.info(instance);
				instance.applyValue();
			}
		},

		//------------------------------------------------------------------
		// processNextValue
		//------------------------------------------------------------------
		processNextValue: function( id, prop, index ) {
			var instance = lola.tween.map[id][prop][index];
			var again = false;
			if ( instance ) {
				//console.info('processNextValue ---------------');
				//console.info(instance);
				again = instance.execute();
			}
			if ( !again ) {
				delete lola.tween.map[id][prop][index];
			}
			//console.info('    again: '+again);
			return again;
		},

		//------------------------------------------------------------------
		// releaseId - releases tween id for use by another object
		//------------------------------------------------------------------
		releaseId: function( id ) {
			delete lola.tween.map[id];
			delete lola.tween.index[id];
			//TODO: fix tweenId recycling
			//lola( '*[tweenId="' + id + '"]' ).deleteExpando( 'tweenId' );
			//lola.tween.unusedIds.push( id );
		},

		//------------------------------------------------------------------
		// executeFrame - executes all active tweens
		//------------------------------------------------------------------
		executeFrame: function() {
			//apply values
			//console.info('execute frame ----------------');
			lola.tween.foreach( lola.tween.applyValue );
			var again = lola.tween.foreach( lola.tween.processNextValue );
			lola.tween.pruneMap();
			return again;
		},

		//------------------------------------------------------------------
		// setBeforeAndAfterProxy - sets non tweenables values in tweens
		//------------------------------------------------------------------
		setBeforeAndAfterProxy: function( easing, elapsed, to, from, delta, duration ) {
			if ( elapsed < duration )
				return from;
			else
				return to;
		},

		//------------------------------------------------------------------
		// start - starts tweens
		//------------------------------------------------------------------
		start: function( objects, properties, delay, duration, easing, collisions ) {
			//console.info('starting tween on '+objects.length+' objects');
			if ( lola.type.get( objects ) != 'array' )
				objects = [objects];

			//set collisions
			collisions = collisions === true;

			//iterate through objects
			objects.every( function( item ) {
				//get identifier for object
				if ( item.tweenId == null )
					item.tweenId = lola.tween.getNextTweenId();

				//add to index
				lola.tween.index[ item.tweenId ] = item;

				//console.info('object.tweenId:'+item.tweenId);
				//iterate properties
				for ( var prop in properties ) {
					var amount = {};
					if ( prop == 'style' ) {
						//iterate style properties
						var styles = properties['style'];
						for ( var style in styles ) {
							amount = {};
							if ( lola.type.get( styles[style] ) == 'object' ) {
								amount = styles[style];
							}
							else
								amount = {to:styles[style]};

							var styleinstance = new lola.tween.TweenInstance( item, style, amount, delay, duration, easing, lola.css.style );
							lola.tween.addTweenInstance( styleinstance, collisions );
						}
					}
					else {
						if ( lola.type.get( properties[prop] ) == 'object' ) {
							amount = properties[prop];
						}
						else
							amount = {to:properties[prop]};

						var instance = new lola.tween.TweenInstance( item, prop, amount, delay, duration, easing, null );
						lola.tween.addTweenInstance( instance, collisions );
						lola.event.trigger( instance.target, 'tweenStart', false, false );

					}
				}
			}, lola.tween );

			//start frame
			if ( lola.tween.currentTick == 0 )
				lola.tween.getFrame();

		},

		//------------------------------------------------------------------
		// addTweenInstance
		//------------------------------------------------------------------
		addTweenInstance: function( instance, allowCollisions ) {
			//add instance to execution list
			//console.info('addTweenInstance -------');
			//console.info(instance);
			if ( instance.target.tweenId ) {
				var id = instance.target.tweenId;
				var prop = instance.property;

				if ( !lola.tween.map[ id ] )
					lola.tween.map[ id ] = {};
				if ( !lola.tween.map[ id ][ prop ] ) {
					//just add instance and return
					lola.tween.map[ id ][ prop ] = [instance];
				}
				else {
					if ( allowCollisions )
						lola.tween.map[ id ][ prop ].push( instance );
					else
						lola.tween.map[ id ][ prop ] = [ instance ];

				}
			}
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			tween: function( properties, delay, duration, easing, collisions ) {
				this.foreach( function( element ) {
					lola.tween.start( element, properties, delay, duration, easing, collisions );
				} );
				return this;
			}
		}

	};
	lola.registerModule( Module );
})( lola );
