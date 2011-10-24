/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Event
 *  Description: event module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "event",
		dataNs: "__events",

		//module dependencies
		dependencies: ['data'],

		//event mapping
		map: {
			'mousewheel':['mousewheel','DOMMouseScroll']
		},

		//hooks - event hooks must have 'add' and 'remove' methods
		hooks: {},

		//listener uid index
		lUid: 0,

		//initialization flag
		initialized: false,


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.event.initialized ) {
				//console.info( 'lola.event.initialize' );

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				var LolaEvent = function( event, target ) {
					return this.init( event, target );
				};
				LolaEvent.prototype = lola.event.LolaEventPrototype;
				lola.setProperty( lola, "event", 'LolaEvent', LolaEvent );

				lola.event.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// listen
		//------------------------------------------------------------------
		addListener: function( target, type, handler, useCapture, priority, scope ) {
			var required = [['target',target],['type',type],['handler',handler]];
			var info = [target,'type: '+type,'useCapture: '+useCapture];
			if ( lola.checkArgs('ERROR: lola.event.addListener( '+type+' )', required, info) ){
				if (lola.event.hooks[type] != null){
					return lola.event.hooks[type]['add'].call( lola.event.hooks[type], target, type, handler, useCapture, priority, scope );
				}
				else {
					var data = lola.data.get( target, lola.event.dataNs );
					if ( !data ) {
						data = { capture:{}, bubble:{} };
						lola.data.set( target, data, lola.event.dataNs, true );
					}

					var phase = lola.event.phaseString( target, useCapture );
					priority = priority || 0xFFFFFF;
					scope = scope || target;

					//assign handler a uid so it can be easily referenced
					if ( handler.uid == null )
						handler.uid = lola.event.lUid++;
					var uid = handler.uid;

					if ( data[phase][type] == null )
						data[phase][type] = {};

					data[phase][type][uid] = {priority:priority, huid:uid, handler:handler, scope:scope };


					//since duplicate dom listeners are discarded just add listener every time
					// function checks if event listener can actually be added
					if ( phase == 'capture' )
						lola.event.addDOMListener( target, type, lola.event.captureHandler, true );
					else
						lola.event.addDOMListener( target, type, lola.event.bubbleHandler, false );

					return uid;
				}
			}
		},

		//------------------------------------------------------------------
		// removeListener
		//------------------------------------------------------------------
		removeListener: function( target, type, handler, useCapture ) {
			var required = [['target',target],['type',type],['handler',handler]];
			var info = [target,'type: '+type,'useCapture: '+useCapture];
			if ( lola.checkArgs('ERROR: lola.event.removeListener( '+type+' )', required, info) ){
				if (lola.event.hooks[type] != null){
					lola.event.hooks[type]['remove'].call( lola.event.hooks[type], target, type, handler, useCapture );
				}
				else {
					var data = lola.data.get( target, lola.event.dataNs );
					if ( !data ) data = { capture:{}, bubble:{} };

					var phase = lola.event.phaseString( target, useCapture );

					//get handler uid
					var uid = lola.type.get( handler ) == 'function' ? handler.uid : handler;

					delete data[phase][type][uid];

					//if there are no more listeners in stack remove handler
					// function checks if event listener can actually be removed
					if ( Object.keys( data[phase][type] ).length == 0 ) {
						if ( phase == 'capture' )
							lola.event.removeDOMListener( target, type, lola.event.captureHandler, true );
						else
							lola.event.removeDOMListener( target, type, lola.event.bubbleHandler, false );

					}
				}
			}
		},


		//------------------------------------------------------------------
		// removeHandler - removes all listeners with handler
		//------------------------------------------------------------------
		removeHandler: function( handler, types, useCapture ) {
			//console.info( 'lola.event.removeHandler: '+type+' '+capture );
			var required = [['handler',handler]];
			var info = [];
			if ( lola.checkArgs('ERROR: lola.event.removeHandler', required, info) ){
				//get handler uid
				var uid = lola.type.get( handler ) == 'function' ? handler.uid : handler;

				//get event data
				var data = lola.data.getNamespace( lola.event.dataNs );
				if ( data ) {
					var ctypes = (useCaputure == undefined) ? ['capture','bubble'] : useCapture ? ['capture'] : ['bubble'];
					//iterate data
					for ( var oid in data ) {
						if ( types != undefined )
							types = lola.type.get( types ) == 'array' ? types : [types];
						for ( var phase in ctypes ) {
							var type;
							if ( types ) {
								for ( type in types ) {
									if ( data[oid][phase][type] )
										delete  data[oid][phase][type][uid];
								}
							}
							else {
								for ( type in data[oid][phase] ) {
									delete  data[oid][phase][type][uid];
								}
							}
							//rempve DOM listener if needed
							if ( Object.keys( data[oid][phase][type] ).length == 0 )
								lola.event.removeDOMListener( target, type, (phase == 'capture') ? lola.event.captureHandler : lola.event.bubbleHandler, (phase == 'capture') );
						}
					}
				}
			}
		},

		//------------------------------------------------------------------
		// captureHandler - generic handler for events registered through lola
		//------------------------------------------------------------------
		captureHandler: function( event ) {
			event = event || lola.window.event;
			lola.event.handler( event, 'capture' )
		},

		//------------------------------------------------------------------
		// bubbleHandler - generic handler for events registered through lola
		//------------------------------------------------------------------
		bubbleHandler: function( event ) {
			event = event || lola.window.event;
			lola.event.handler( event, 'bubble' )
		},

		//------------------------------------------------------------------
		// handler - generic handler for events registered through lola
		//------------------------------------------------------------------
		handler: function( event, phase ) {
			//console.info( 'lola.event.handler: '+event.type+' '+phase );
			var e = (event.hasOwnProperty( 'originalEvent' )) ? event : new lola.event.LolaEvent( event );
			var data = lola.data.get( e.currentTarget, lola.event.dataNs );
			if ( data && data[phase] && data[phase][event.type] ) {
				//console.info('    found event');
				var stack = [];
				for ( var uid in data[phase][event.type] ) {
					stack.push( data[phase][event.type][uid] );
				}
				stack = stack.sort( lola.util.prioritySort );
				for ( var i in stack ) {
					if ( e._immediatePropagationStopped )
						break;
					var obj = stack[i];
					if ( obj.handler )
						obj.handler.call( obj.scope, e );
					else
						delete data[phase][event.type][obj.huid];
				}
			}
		},

		//------------------------------------------------------------------
		// trigger
		//------------------------------------------------------------------
		trigger: function( object, type, bubbles, cancelable, data ) {
			/*console.group('lola.event.trigger: '+type);
			console.log(object);
			console.groupEnd();*/
			var args = [object, type];
			var names = ['target','type'];
			var group = 'lola.event.trigger: type='+type+' bubbles='+bubbles;
			if ( lola.checkArgs(args, names, group) ){
				if ( bubbles == undefined )
					bubbles = true;
				if ( cancelable == undefined )
					cancelable = true;

				var event = type;
				if ( lola.type.get( event ) === 'string' ) {
					event = document.createEvent( "Event" );
					event.initEvent( type, bubbles, cancelable );
					event.data = data;
				}

				if ( object.hasOwnProperty( 'dispatchEvent' ) ) {
					object.dispatchEvent( event );
				}
				else {
					event = new lola.event.LolaEvent( event, object );
					lola.event.handler( event,  'capture' );
					lola.event.handler( event,  'bubble' );
				}
			}
		},

		//------------------------------------------------------------------
		// add a DOM event listener on target
		//------------------------------------------------------------------
		addDOMListener: function( target, type, handler, useCapture ) {
			//if ( target.hasOwnProperty('nodeType') && (target.nodeType == 1 || target.nodeType == 9)){
			type = lola.event.map[type] ? lola.event.map[type] : [type];
			type.forEach( function(t) {
				try {
					if ( target.addEventListener )
						target.addEventListener( t, handler, useCapture );
					else if ( lola.support.msEvent )
						target.attachEvent( 'on' + t, handler );
					else if ( target['on' + t.toLowerCase()] == null )
						target['on' + type.toLowerCase()] = handler;
				}
				catch( error ) {
					//console.info( 'lola.event.addDOMListener error' );
				}
			} );
			//}
		},

		//------------------------------------------------------------------
		// removes DOM Event listener from target
		//------------------------------------------------------------------
		removeDOMListener: function( target, type, handler ) {
			//if ( target.hasOwnProperty('nodeType') && (target.nodeType == 1 || target.nodeType == 9)){
			type = lola.event.map[type] ? lola.event.map[type] : [type];
			type.forEach( function() {
				try {
					if ( target.removeEventListener )
						target.removeEventListener( type, handler, false );
					else if ( lola.support.msEvent )
						target.detachEvent( 'on' + type, handler );
					else if ( target['on' + type.toLowerCase()] == null )
						delete target['on' + type.toLowerCase()];
				}
				catch( error ) {
					//console.info( 'lola.event.removeDOMListener error' );
				}
			} );
			//}
		},

		//------------------------------------------------------------------
		// returns an events target element
		//------------------------------------------------------------------
		getDOMTarget: function( event, target ) {
			if ( event ) {
				if ( event.currentTarget )
					target = event.currentTarget;
				else if ( event.srcElement )
					target = event.srcElement;

				if ( target && target.nodeType == 3 ) // defeat Safari bug
					target = target.parentNode;
			}
			return target;
		},

		//------------------------------------------------------------------
		// returns key code for key events
		//------------------------------------------------------------------
		getDOMKeycode: function( e ) {
			var code;

			if ( e.keyCode )
				code = e.keyCode;
			else if ( e.which )
				code = e.which;

			return code;
		},

		//------------------------------------------------------------------
		// returns keys for key events
		//------------------------------------------------------------------
		getDOMKey: function( e ) {
			var code;

			if ( e.keyCode )
				code = e.keyCode;
			else if ( e.which )
				code = e.which;

			return String.fromCharCode( lola.event.getDOMKeycode(e) );
		},

		//------------------------------------------------------------------
		// returns x,y coordinates relative to document
		//------------------------------------------------------------------
		getDOMGlobalXY: function( e ) {
			var xPos = 0;
			var yPos = 0;
			if ( e.pageX || e.pageY ) {
				xPos = e.pageX;
				yPos = e.pageY;
			}
			else if ( e.clientX || e.clientY ) {
				xPos = e.clientX + document.documentElement.scrollLeft + document.body.scrollLeft;
				yPos = e.clientY + document.documentElement.scrollTop + document.body.scrollTop;
			}

			return {x:xPos,y:yPos};
		},

		//------------------------------------------------------------------
		// returns actual event phase to use
		//------------------------------------------------------------------
		phaseString: function( target, useCapture ) {
			var phase = ((useCapture && (lola.support.domEvent || lola.support.msEvent)) || (!target.dispatchEvent && !target.attachEvent)) ? 'capture' : 'bubble';
			return phase;
		},

		//------------------------------------------------------------------
		// preventDefault
		//------------------------------------------------------------------
		preventDefault: function( e )
		{
			e = e ? e : window.event;
			if (e)
			{
				if(e.stopPropagation)
					e.stopPropagation();
				if(e.preventDefault)
					e.preventDefault();

				if(e.stopPropagation)
					e.stopPropagation();
				if(e.preventDefault)
					e.preventDefault();
				e.cancelBubble = true;
				e.cancel = true;
				e.returnValue = false;
			}
			return false;
		},



		//==================================================================
		// Selection Methods
		//==================================================================
		LolaEventPrototype: {
			originalEvent: null,
			_propagationStopped: false,
			_immediatePropagationStopped: false,
			init: function( event, target ) {
				//first copy event props into this
				lola.extend( this, event, false, false );

				///normalize and add special props
				this.originalEvent = event;
				if ( target )
					this.target = target;
				this.currentTarget = lola.event.getDOMTarget( event, target );

				var gpos = lola.event.getDOMGlobalXY( event );
				this.globalX = gpos.x;
				this.globalY = gpos.y;

				this.key = lola.event.getDOMKey( event );

				//rewrite original functions
				this.preventDefault = function() {
					this.originalEvent.preventDefault();
				};

				this.stopPropagation = function() {
					this.originalEvent.stopPropagation();
					this._propagationStopped = true;
				};

				this.stopImmediatePropagation = function() {
					this.originalEvent.stopImmediatePropagation();
					this._immediatePropagationStopped = true;
				};


				return this;
			}


		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

			addListener: function( type, handler, useCapture, priority, scope ) {
				this.foreach( function( item ) {
					lola.event.addListener( item, type, handler, useCapture, priority, scope );
				} );

				return this;
			},

			removeListener: function( type, handler, useCapture ) {
				this.foreach( function( item ) {
					lola.event.removeListener( item, type, handler, useCapture );
				} );

				return this;
			},

			removeHandler: function( handler, types, phase ) {
				this.foreach( function( item ) {
					lola.event.removeHandler( item, handler, types, phase );
				} );

				return this;
			},

			trigger: function( type, bubbles, cancelable, data ) {
				this.foreach( function( item ) {
					lola.event.trigger( item, type, bubbles, cancelable, data );
				} );

				return this;
			}

		}

	};

	//add conveinience listener methods
	var events = "change click mousedown mouseup mouseover mouseout mouseenter mouseleave hover keydown keyup resize";
	events.split(' ').forEach( function( eventName ){
		Module.SelectionPrototype[eventName] = function( handler, useCapture, priority, scope ) {
			this.addListener( eventName, handler, useCapture, priority, scope );
			return this;
		}
	});

	//add default hooks
	Module.hooks['hover'] = {
		event: 'hoverConfirmed',
		getData: function( target ){
			var ns = 'eventHover';
			var data = lola.data.get( target, ns );
			if ( !data ) {
			    data = { hasIntent:false, wait:250, timeout:-1 };
			    lola.data.set( target, data, ns, true );
			}
			return data;
		},
		setWaitTime:function( target, time ){
			var data = lola.event.hooks.hover.getData( target );
			data.wait = time;
		},
		mouseOver: function( event ){
			//console.log('hover.mouseover');
			lola.event.addListener( event.currentTarget, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( event.currentTarget );
			data.hasIntent = true;
			if (data.timeout < 0)
				data.timeout = setTimeout( lola.event.hooks.hover.confirm, data.wait, event.currentTarget )
		},
		mouseOut: function( event ){
			//console.log('hover.mouseout')
			lola.event.removeListener( event.currentTarget, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( event.currentTarget );
			data.hasIntent = false;
		},
		confirm: function( target ){
			//console.log('hover.confirm')
			lola.event.removeListener( target, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( target );
			data.timeout = -1;
			if (data.hasIntent){
				lola.event.trigger( target, lola.event.hooks.hover.event );
			}
		},
		add: function( target, type, handler, useCapture, priority, scope ){
			var uid = lola.event.addListener( target, lola.event.hooks.hover.event, handler, useCapture, priority, scope );
			lola.event.hooks.hover.getData( target );
			lola.event.addListener( target, 'mouseover', lola.event.hooks.hover.mouseOver );
			return uid;
		},
		remove: function( target, type, handler, useCapture ){
			var edata = lola.data.get( target, lola.event.dataNs );
			lola.event.removeListener(target, lola.event.hooks.hover.event, handler, useCapture );
			var phase = lola.event.phaseString( target, useCapture );
			if (edata[phase][lola.event.hooks.hover.event] == null || Object.keys(edata[phase][lola.event.hooks.hover.event]).length == 0){
				lola.event.removeListener( target, 'mouseover', lola.event.hooks.hover.mouseOver );
				lola.data.remove( target, 'eventHover' );
			}
		}
	};

	Module.hooks['mouseenterstate'] = {
		e1: 'domouseenter',
		e2: 'domouseleave',
		getData: function( target ){
			var ns = 'eventMouseEnterState';
			var data = lola.data.get( target, ns );
			if ( !data ) {
			    data = { within:false };
			    lola.data.set( target, data, ns, true );
			}
			return data;
		},
		getEnhancedType: function( type ){
			if (!lola.support.msEvent) {
				type = 'do'+type;
			}
			return type;
		},
		mouseOver: function( event ){
			var data = lola.event.hooks.mouseenterstate.getData( event.currentTarget );
			if (!data.within && event.currentTarget != event.relatedTarget){
				data.within = true;
				lola.event.trigger( event.currentTarget, lola.event.hooks.mouseenterstate.e1, false );
			}
		},
		mouseOut: function( event ){
			var data = lola.event.hooks.mouseenterstate.getData( event.currentTarget );
			if ( data.within &&
					!lola.util.isAncestor( event.currentTarget, event.relatedTarget ) &&
					event.currentTarget != event.relatedTarget ){
				data.within = false;
				lola.event.trigger( event.currentTarget, lola.event.hooks.mouseenterstate.e2, false );
			}
		},
		add: function( target, type, handler, useCapture, priority, scope ){
			//IE has it already
			if (!lola.support.msEvent) {
				//deal with other browsers
				lola.event.addListener( target, 'mouseover', lola.event.hooks.mouseenterstate.mouseOver, useCapture, priority, scope );
				lola.event.addListener( target, 'mouseout', lola.event.hooks.mouseenterstate.mouseOut, useCapture, priority, scope );
			}
			return lola.event.addListener( target, lola.event.hooks.mouseenterstate.getEnhancedType( type ), handler, useCapture, priority, scope );
		},
		remove: function( target, type, handler, useCapture ){

			var edata = lola.data.get( target, lola.event.dataNs );
			var phase = lola.event.phaseString( target, useCapture );
			type = lola.event.hooks.mouseenterstate.getEnhancedType( type );
			lola.event.removeListener( target, type, handler, useCapture );

			//check for other hook listeners before removeing
			if (    !lola.support.msEvent &&
					edata[phase][lola.event.hooks.mouseenterstate.getEnhancedType( type )] == null ||
					edata[phase][lola.event.hooks.mouseenterstate.getEnhancedType( type )].keys().length == 0){
				//deal with other browsers
				lola.event.removeListener( target, 'mouseover', lola.event.hooks.mouseenterstate.mouseOver, useCapture );
				lola.event.removeListener( target, 'mouseout', lola.event.hooks.mouseenterstate.mouseOut, useCapture );
			}

		}
	};

	Module.hooks['mouseleave'] = Module.hooks['mouseenterstate'];
	Module.hooks['mouseenter'] = Module.hooks['mouseenterstate'];

	lola.registerModule( Module );

})( lola );
