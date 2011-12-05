(function( lola ) {
	var $ = lola;
	/**
	 * @description Event Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var event = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @description event maping
		 * @private
		 * @type {Object}
		 */
		map: { 'mousewheel':['mousewheel','DOMMouseScroll'] },

		/**
		 * @description event hooks
		 * @private
		 * @type {Object}
		 */
		hooks: {},

		/**
		 * @description event listener uid
		 * @type {int}
		 */
		uid: 0,



		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.event::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.event.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.event::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.event.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "event";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},


		/**
		 * @description add a framework event listener
		 * @param {Object} target
		 * @param {String} type
		 * @param {Function} handler
		 * @param {Boolean|undefined} useCapture
		 * @param {uint|undefined} priority default 0xFFFFFF
		 * @param {Object|undefined} scope
		 */
		addListener: function( target, type, handler, useCapture, priority, scope ) {
			var required = [['target',target],['type',type],['handler',handler]];
			var info = [target,'type: '+type,'useCapture: '+useCapture];
			if ( lola.checkArgs('ERROR: lola.event.addListener( '+type+' )', required, info) ){
				if (lola.event.hooks[type] != null){
					return lola.event.hooks[type]['addListener'].call( lola.event.hooks[type], target, type, handler, useCapture, priority, scope );
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
						handler.uid = lola.event.uid++;
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

		/**
		 * @description remove a framework event listener
		 * @param {Object} target
		 * @param {String} type
		 * @param {Function} handler
		 * @param {Boolean|undefined} useCapture
		 */
		removeListener: function( target, type, handler, useCapture ) {
			var required = [['target',target],['type',type],['handler',handler]];
			var info = [target,'type: '+type,'useCapture: '+useCapture];
			if ( lola.checkArgs('ERROR: lola.event.removeListener( '+type+' )', required, info) ){
				if (lola.event.hooks[type] != null){
					lola.event.hooks[type]['removeListener'].call( lola.event.hooks[type], target, type, handler, useCapture );
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


		/**
		 * @description removes all listeners associated with handler
		 * @param {String|Array} types
		 * @param {Function} handler
		 * @param {Boolean|undefined} useCapture
		 */
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

		/**
		 * @description internal capture listener
		 * @param {Object} event
		 * @private
		 */
		captureHandler: function( event ) {
			event = event || lola.window.event;
			lola.event.handler( event, 'capture' )
		},

		/**
		 * @description internal bubble listener
		 * @param {Object} event
		 * @private
		 */
		bubbleHandler: function( event ) {
			event = event || lola.window.event;
			lola.event.handler( event, 'bubble' )
		},

		/**
		 * @description internal capture listener
		 * @private
		 * @param {Object} event
		 * @param {String} phase
		 */
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
				//stack = stack.sort( lola.util.prioritySort );
				stack = lola.array.sortOn( 'priority', stack );
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

		/**
		 * @description triggers a framework event on an object
		 * @param {Object} object
		 * @param {String} type
		 * @param {Boolean|undefined} bubbles
		 * @param {Boolean|undefined} cancelable
		 * @param {Object|undefined} data
		 */
		trigger: function( object, type, bubbles, cancelable, data ) {
			/*console.group('lola.event.trigger: '+type);
			lola.debug(object);
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

		/**
		 * @description add a DOM event listener
		 * @param {Object} target
		 * @param {String} type
		 * @param {Function} handler
		 * @param {Boolean|undefined} useCapture
		 */
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

		/**
		 * @description remove a DOM event listener
		 * @param {Object} target
		 * @param {String} type
		 * @param {Function} handler
		 */
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

		/**
		 * @description gets the dom target
		 * @param {Object} event
		 * @param {Object} target
		 * @return {Object}
		 */
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

		/**
		 * @descrtiption returns key code for key events
		 * @param {Event} e
		 * @return {int}
		 */
		getDOMKeycode: function( e ) {
			var code;

			if ( e.keyCode )
				code = e.keyCode;
			else if ( e.which )
				code = e.which;

			return code;
		},

		/**
		 * @description returns key string for key events
		 * @param {Event} e
		 * @return {String}
		 */
		getDOMKey: function( e ) {
			var code;

			if ( e.keyCode )
				code = e.keyCode;
			else if ( e.which )
				code = e.which;

			return String.fromCharCode( lola.event.getDOMKeycode(e) );
		},

		/**
		 * @description returns x,y coordinates relative to document
		 * @param {Event} e
		 * @return {Object}
		 */
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

		/**
		 * @description returns x,y coordinates relative to currentTarget
		 * @param {Event} e
		 * @return {Object}
		 */
		getDOMLocalXY: function( e ) {
			var xPos = e.layerX || e.offsetX || 0;
			var yPos = e.layerY || e.offsetY || 0;
			return {x:xPos,y:yPos};
		},

		/**
		 * @description returns actual event phase to use
		 * @param {Object} target
		 * @param {Boolean|undefined} useCapture
		 * @return {String}
		 */
		phaseString: function( target, useCapture ) {
			return ((useCapture && (lola.support.domEvent || lola.support.msEvent)) || (!target.dispatchEvent && !target.attachEvent)) ? 'capture' : 'bubble';
		},

		/**
		 * @description prevent default event action
		 * @param {Event} e
		 * @return {Boolean}
		 */
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
		// Classes
		//==================================================================
		/**
		 * @description LolqEvent class used with internal events
		 * @class
		 * @param {Object} event
		 * @param {Object} target
		 */
		LolaEvent: function( event, target ) {
			return this.init( event, target );
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * @description get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * @description module's selector methods
			 * @type {Object}
			 */
			var methods = {

				/**
				 * @description adds a framework event listener
				 * @param {String} type
				 * @param {Function} handler
				 * @param {Boolean|undefined} useCapture
				 * @param {uint|undefined} priority
				 * @param {Object|undefined} scope
				 */
				addListener: function( type, handler, useCapture, priority, scope ) {
					this.forEach( function( item ) {
						lola.event.addListener( item, type, handler, useCapture, priority, scope );
					} );

					return this;
				},

				/**
				 * @description removes a framework event listener
				 * @param {String} type
				 * @param {Function} handler
				 * @param {Boolean|undefined} useCapture
				 */
				removeListener: function( type, handler, useCapture ) {
					this.forEach( function( item ) {
						lola.event.removeListener( item, type, handler, useCapture );
					} );

					return this;
				},

				/**
				 * @description removes all listeners associated with handler
				 * @param {Function} handler
				 * @param {Array|undefined} types event types to remove for handler, undefined removes all
				 * @param {String|undefined} phase
				 */
				removeHandler: function( handler, types, phase ) {
					this.forEach( function( item ) {
						lola.event.removeHandler( item, handler, types, phase );
					} );

					return this;
				},

				/**
				 * @description triggers an framework event on an object
				 * @param {String} type
				 * @param {Boolean|undefined} bubbles
				 * @param {Boolean|undefined} cancelable
				 * @param {Object|undefined} data
				 */
				trigger: function( type, bubbles, cancelable, data ) {
					this.forEach( function( item ) {
						lola.event.trigger( item, type, bubbles, cancelable, data );
					} );

					return this;
				}
			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
	event.LolaEvent.prototype = {

		/**
		 * @description reference to original event
		 * @type {Event}
		 */
		originalEvent: null,

		/**
		 * @description flag for propagation stopped
		 * @type {Boolean}
		 * @private
		 */
		propagationStopped: false,

		/**
		 * @description flag for immediate propagation stopped
		 * @type {Boolean}
		 * @private
		 */
		immediatePropagationStopped: false,

		/**
		 * @description event's target
		 * @type {Object}
		 */
		target: null,

		/**
		 * @description event's currentTarget
		 * @type {Object}
		 */
		currentTarget: null,

		/**
		 * @description global x position (Mouse/Touch Events)
		 * @type {Number}
		 */
		globalX: null,

		/**
		 * @description global y position (Mouse/Touch Events)
		 * @type {Number}
		 */
		globalY: null,

		/**
		 * @description key code for Key Events
		 * @type {int}
		 */
		key: null,

		/**
		 * @description class initializer
		 * @param {Event} event
		 * @param {Object} target
		 */
		init: function( event, target ) {
			lola.extend( this, event, false, false );
			this.originalEvent = event;
			if ( target ) {
				this.target = target;
			}
			this.currentTarget = lola.event.getDOMTarget( event, target );
			var gpos = lola.event.getDOMGlobalXY( event );
			this.globalX = gpos.x;
			this.globalY = gpos.y;

			var lpos = lola.event.getDOMLocalXY( event );
			this.localX = lpos.x;
			this.localY = lpos.y;

			this.key = lola.event.getDOMKey( event );

			return this;
		},

		/**
		 * @description prevents an events default behavior
		 */
		preventDefault: function(){
			this.originalEvent.preventDefault();
		},

		/**
		 * @description stops event propagation
		 */
		stopPropagation: function(){
			this.originalEvent.stopPropagation();
			this.propagationStopped = true;
		},

		/**
		 * @description stops immediate event propagation
		 */
		stopImmediatePropagation: function(){
			this.originalEvent.stopImmediatePropagation();
			this.immediatePropagationStopped = true;
		}

	};


	//==================================================================
	// Hooks
	//==================================================================

	/**
	 * @description delayed hover intent event hook
	 * @event hover
	 */
	event.hooks['hover'] = {
		event: 'hoverConfirmed',
		getData: function( target ){
			var ns = 'eventHover';
			var wait = lola.dom.attr( target, "hoverDelay" );
			wait = (wait == null || wait == undefined) ? 250 : parseInt(wait);
			var data = lola.data.get( target, ns );
			if ( !data ) {
			    data = { hasIntent:false, wait:wait, timeout:-1 };
			    lola.data.set( target, data, ns, true );
			}
			return data;
		},
		mouseOver: function( event ){
			//lola.debug('hover.mouseover');
			lola.event.addListener( event.currentTarget, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( event.currentTarget );
			data.hasIntent = true;
			if (data.timeout < 0)
				data.timeout = setTimeout( lola.event.hooks.hover.confirm, data.wait, event.currentTarget )
		},
		mouseOut: function( event ){
			//lola.debug('hover.mouseout')
			lola.event.removeListener( event.currentTarget, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( event.currentTarget );
			data.hasIntent = false;
		},
		confirm: function( target ){
			//lola.debug('hover.confirm')
			lola.event.removeListener( target, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( target );
			data.timeout = -1;
			if (data.hasIntent){
				lola.event.trigger( target, lola.event.hooks.hover.event );
			}
		},
		addListener: function( target, type, handler, useCapture, priority, scope ){
			var uid = lola.event.addListener( target, lola.event.hooks.hover.event, handler, useCapture, priority, scope );
			lola.event.hooks.hover.getData( target );
			lola.event.addListener( target, 'mouseover', lola.event.hooks.hover.mouseOver );
			return uid;
		},
		removeListener: function( target, type, handler, useCapture ){
			var edata = lola.data.get( target, lola.event.dataNs );
			lola.event.removeListener(target, lola.event.hooks.hover.event, handler, useCapture );
			var phase = lola.event.phaseString( target, useCapture );
			if (edata[phase][lola.event.hooks.hover.event] == null || Object.keys(edata[phase][lola.event.hooks.hover.event]).length == 0){
				lola.event.removeListener( target, 'mouseover', lola.event.hooks.hover.mouseOver );
				lola.data.remove( target, 'eventHover' );
			}
		}
	};

	/**
	 * @description mouse enter state event
	 * @event mouseenterstate
	 */
	event.hooks['mouseenterstate'] = {
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
		addListener: function( target, type, handler, useCapture, priority, scope ){
			//IE has it already
			if (!lola.support.msEvent) {
				//deal with other browsers
				lola.event.addListener( target, 'mouseover', lola.event.hooks.mouseenterstate.mouseOver, useCapture, priority, scope );
				lola.event.addListener( target, 'mouseout', lola.event.hooks.mouseenterstate.mouseOut, useCapture, priority, scope );
			}
			return lola.event.addListener( target, lola.event.hooks.mouseenterstate.getEnhancedType( type ), handler, useCapture, priority, scope );
		},
		removeListener: function( target, type, handler, useCapture ){

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

	/**
	 * @description mouse leave event
	 * @event mouseleave
	 */
	event.hooks['mouseleave'] = event.hooks['mouseenterstate'];

	/**
	 * @description mouse enter event
	 * @event mouseleave
	 */
	event.hooks['mouseenter'] = event.hooks['mouseenterstate'];


	//register module
	lola.registerModule( event );

})( lola );
