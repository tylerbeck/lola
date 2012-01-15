/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Event
 *  Description: Event module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {

	/**
	 * Event Module
	 * @namespace lola.event
	 */
	var Module = function(){
        var self = this;
        //==================================================================
        // Attributes
        //==================================================================

        this.PRIORITY_BEFORE = 1;
        this.PRIORITY_FIRST = 0x400000;
        this.PRIORITY_NORMAL = 0x800000;
        this.PRIORITY_LAST= 0xC00000;
        this.PRIORITY_AFTER = 0xFFFFFF;

        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "event";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['data','util','type'];

        /**
         * event maping
         * @type {Object}
         * @private
         */
        var map = { 'mousewheel':['mousewheel','DOMMouseScroll'] };

        /**
         * event hooks
         * @type {Object}
         * @private
         */
        var hooks = {};

        /**
         * event listener uid
         * @type {int}
         * @private
         */
        var uid = 0;

        /**
         * namespace to use in data
         */
        var dataNamespace = "_"+namespace;


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
         * add hook to event hooks
         * @param {String} type
         * @param {Object} object
         */
        this.addHook = function( type, object ){
            hooks[ type ] = object;
        };

        /**
         * add a framework event listener
         * @param {Object} target
         * @param {String} type
         * @param {Function} handler
         * @param {Boolean|undefined} useCapture
         * @param {uint|undefined} priority default 0xFFFFFF
         * @param {Object|undefined} scope
         */
        this.addListener = function( target, type, handler, useCapture, priority, scope ) {
            var required = [['target',target],['type',type],['handler',handler]];
            var info = [target,'type: '+type,'useCapture: '+useCapture];
            if ( lola.util.checkArgs('ERROR: lola.event.addListener( '+type+' )', required, info) ){
                if (hooks[type] != null){
                    var hook = hooks[type];
                    return hook.addListener( target, type, handler, useCapture, priority, hook );
                }
                else {
                    var data = lola.data.get( target, dataNamespace );
                    if ( !data ) {
                        data = { capture:{}, bubble:{} };
                        lola.data.set( target, data, dataNamespace, true );
                    }

                    var phase = self.phaseString( target, useCapture );
                    priority = priority || this.PRIORITY_NORMAL;
                    scope = scope || target;

                    //assign handler a uid so it can be easily referenced
                    if ( handler.uid == null )
                        handler.uid = uid++;
                    var uid = handler.uid;

                    if ( data[phase][type] == null )
                        data[phase][type] = {};

                    data[phase][type][uid] = {priority:priority, huid:uid, handler:handler, scope:scope };


                    //since duplicate dom listeners are discarded just add listener every time
                    // function checks if event listener can actually be added
                    if ( phase == 'capture' )
                        self.addDOMListener( target, type, captureHandler, true );
                    else
                        self.addDOMListener( target, type, bubbleHandler, false );

                    return uid;
                }
            }
        };

        /**
         * remove a framework event listener
         * @param {Object} target
         * @param {String} type
         * @param {Function} handler
         * @param {Boolean|undefined} useCapture
         */
        this.removeListener = function( target, type, handler, useCapture ) {
            var required = [['target',target],['type',type],['handler',handler]];
            var info = [target,'type: '+type,'useCapture: '+useCapture];
            if ( lola.util.checkArgs('ERROR: lola.event.removeListener( '+type+' )', required, info) ){
                if (hooks[type] != null){
                    hooks[type]['removeListener'].call( hooks[type], target, type, handler, useCapture );
                }
                else {
                    var data = lola.data.get( target, dataNamespace );
                    if ( !data ) data = { capture:{}, bubble:{} };

                    var phase = self.phaseString( target, useCapture );

                    //get handler uid
                    var uid = lola.type.get( handler ) == 'function' ? handler.uid : handler;

                    delete data[phase][type][uid];

                    //if there are no more listeners in stack remove handler
                    // function checks if event listener can actually be removed
                    if ( Object.keys( data[phase][type] ).length == 0 ) {
                        if ( phase == 'capture' )
                            self.removeDOMListener( target, type, captureHandler, true );
                        else
                            self.removeDOMListener( target, type, bubbleHandler, false );

                    }
                }
            }
        };

        /**
         * removes all listeners associated with handler
         * @param {String|Array} types
         * @param {Function} handler
         * @param {Boolean|undefined} useCapture
         */
        this.removeHandler = function( handler, types, useCapture ) {
            //console.info( 'lola.event.removeHandler: '+type+' '+capture );
            var required = [['handler',handler]];
            var info = [];
            if ( lola.utils.checkArgs('ERROR: lola.event.removeHandler', required, info) ){
                //get handler uid
                var uid = lola.type.get( handler ) == 'function' ? handler.uid : handler;

                //get event data
                var data = lola.data.getNamespace( dataNamespace );
                if ( data ) {
                    var ctypes = (useCapture == undefined) ? ['capture','bubble'] : useCapture ? ['capture'] : ['bubble'];
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
                                self.removeDOMListener( target, type, (phase == 'capture') ? captureHandler : bubbleHandler, (phase == 'capture') );
                        }
                    }
                }
            }
        };

        /**
         * internal capture listener
         * @param {Object} event
         * @private
         */
        function captureHandler( event ) {
            event = event || lola.window.event;
            handler( event, 'capture' )
        }

        /**
         * internal bubble listener
         * @param {Object} event
         * @private
         */
        function bubbleHandler( event ) {
            event = event || lola.window.event;
            handler( event, 'bubble' )
        }

        /**
         * internal capture listener
         * @private
         * @param {Object} event
         * @param {String} phase
         */
        function handler( event, phase ) {
            //console.info( 'lola.event.handler: '+event.type+' '+phase );
            var e = (event.hasOwnProperty( 'originalEvent' )) ? event : new LolaEvent( event, {} );
            var data = lola.data.get( e.currentTarget, dataNamespace );
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
        }

        /**
         * triggers a framework event on an object
         * @param {Object} object
         * @param {String} type
         * @param {Boolean|undefined} bubbles
         * @param {Boolean|undefined} cancelable
         * @param {Object|undefined} data
         */
        this.trigger = function( object, type, bubbles, cancelable, data ) {
            /*console.group('lola.event.trigger: '+type);
             lola.debug(object);
             console.groupEnd();*/
            var args = [object, type];
            var names = ['target','type'];
            var group = 'lola.event.trigger: type='+type+' bubbles='+bubbles;
            if ( lola.util.checkArgs(args, names, group) ){
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
                    event = new LolaEvent( event, object );
                    handler( event,  'capture' );
                    if (bubbles)
                        handler( event,  'bubble' );
                }
            }
        };

        /**
         * add a DOM event listener
         * @param {Object} target
         * @param {String} type
         * @param {Function} handler
         * @param {Boolean|undefined} useCapture
         */
        this.addDOMListener = function( target, type, handler, useCapture ) {
            type = map[type] ? map[type] : [type];
            type.forEach( function(t) {
                try {
                    if ( lola.support.domEvent && target.addEventListener )
                        target.addEventListener( t, handler, useCapture );
                    else if ( lola.support.msEvent && target.attachEvent )
                        target.attachEvent( 'on' + t, handler );
                    else if ( target['on' + t.toLowerCase()] == null )
                        target['on' + type.toLowerCase()] = handler;
                }
                catch( error ) {
                    lola.debug( 'lola.event.addDOMListener error:', target, type, handler, useCapture );
                }
            } );
        };

        /**
         * remove a DOM event listener
         * @param {Object} target
         * @param {String} type
         * @param {Function} handler
         * @param {Boolean|undefined} useCapture
         */
        this.removeDOMListener = function( target, type, handler, useCapture ) {
            type = map[type] ? map[type] : [type];
            type.forEach( function() {
                try {
                    if ( lola.support.domEvent && target.removeEventListener )
                        target.removeEventListener( type, handler, useCapture );
                    else if ( lola.support.msEvent && target.detachEvent )
                        target.detachEvent( 'on' + type, handler );
                    else if ( target['on' + type.toLowerCase()] == null )
                        delete target['on' + type.toLowerCase()];
                }
                catch( error ) {
                    lola.debug( 'lola.event.removeDOMListener error:', target, type, handler, useCapture );
                }
            } );
        };

        /**
         * gets the dom target
         * @param {Object} event
         * @param {Object} target
         * @return {Object}
         */
        this.getDOMTarget = function( event, target ) {
            if ( event ) {
                if ( event.currentTarget )
                    target = event.currentTarget;
                else if ( event.srcElement )
                    target = event.srcElement;

                if ( target && target.nodeType == 3 ) // defeat Safari bug
                    target = target.parentNode;
            }
            return target;
        };

        /**
         * @descrtiption returns key code for key events
         * @param {Event} e
         * @return {int}
         */
        this.getDOMKeycode = function( e ) {
            var code;

            if ( e.keyCode )
                code = e.keyCode;
            else if ( e.which )
                code = e.which;

            return code;
        };

        /**
         * returns key string for key events
         * @param {Event} e
         * @return {String}
         */
        this.getDOMKey = function( e ) {
            var code;

            if ( e.keyCode )
                code = e.keyCode;
            else if ( e.which )
                code = e.which;

            return String.fromCharCode( self.getDOMKeycode(e) );
        };

        /**
         * returns x,y coordinates relative to document
         * @param {Event} e
         * @return {Object}
         */
        this.getDOMGlobalXY = function( e ) {
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
        };

        /**
         * returns x,y coordinates relative to currentTarget
         * @param {Event} e
         * @return {Object}
         */
        this.getDOMLocalXY = function( e ) {
            var xPos = e.layerX || e.offsetX || 0;
            var yPos = e.layerY || e.offsetY || 0;
            return {x:xPos,y:yPos};
        };

        /**
         * returns actual event phase to use
         * @param {Object} target
         * @param {Boolean|undefined} useCapture
         * @return {String}
         */
        this.phaseString = function( target, useCapture ) {
            return ((useCapture && (lola.support.domEvent || lola.support.msEvent)) || (!target.dispatchEvent && !target.attachEvent)) ? 'capture' : 'bubble';
        };

        /**
         * prevent default event action
         * @param {Event} e
         * @return {Boolean}
         */
        this.preventDefault = function( e ){
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
             * adds a framework event listener
             * @param {String} type
             * @param {Function} handler
             * @param {Boolean|undefined} useCapture
             * @param {uint|undefined} priority
             * @param {Object|undefined} scope
             */
            addListener: function( type, handler, useCapture, priority, scope ) {
                this.forEach( function( item ) {
                    self.addListener( item, type, handler, useCapture, priority, scope );
                } );

                return this;
            },

            /**
             * removes a framework event listener
             * @param {String} type
             * @param {Function} handler
             * @param {Boolean|undefined} useCapture
             */
            removeListener: function( type, handler, useCapture ) {
                this.forEach( function( item ) {
                    self.removeListener( item, type, handler, useCapture );
                } );

                return this;
            },

            /**
             * removes all listeners associated with handler
             * @param {Function} handler
             * @param {Array|undefined} types event types to remove for handler, undefined removes all
             * @param {String|undefined} phase
             */
            removeHandler: function( handler, types, phase ) {
                this.forEach( function( item ) {
                    self.removeHandler( item, handler, types, phase );
                } );

                return this;
            },

            /**
             * triggers an framework event on an object
             * @param {String} type
             * @param {Boolean|undefined} bubbles
             * @param {Boolean|undefined} cancelable
             * @param {Object|undefined} data
             */
            trigger: function( type, bubbles, cancelable, data ) {
                this.forEach( function( item ) {
                    self.trigger( item, type, bubbles, cancelable, data );
                } );

                return this;
            }
        };

        //==================================================================
        // Classes
        //==================================================================
        /**
         * LolaEvent class used with internal events
         * @class
         * @param {Object} event
         * @param {Object} target
         */
        var LolaEvent = function( event, target ) {
            return this.init( event, target );
        };
        LolaEvent.prototype = {

            /**
             * reference to original event
             * @type {Event}
             */
            originalEvent: null,

            /**
             * flag for propagation stopped
             * @type {Boolean}
             * @private
             */
            propagationStopped: false,

            /**
             * flag for immediate propagation stopped
             * @type {Boolean}
             * @private
             */
            immediatePropagationStopped: false,

            /**
             * event's target
             * @type {Object}
             */
            target: null,

            /**
             * event's currentTarget
             * @type {Object}
             */
            currentTarget: null,

            /**
             * global x position (Mouse/Touch Events)
             * @type {Number}
             */
            globalX: null,

            /**
             * global y position (Mouse/Touch Events)
             * @type {Number}
             */
            globalY: null,

            /**
             * key code for Key Events
             * @type {int}
             */
            key: null,

            /**
             * class initializer
             * @param {Event} event
             * @param {Object} target
             */
            init: function( event, target ) {
                lola.extend( this, event, false, false );
                this.originalEvent = event;
                if ( target ) {
                    this.target = target;
                }
                this.currentTarget = self.getDOMTarget( event, target );
                var gpos = self.getDOMGlobalXY( event );
                this.globalX = gpos.x;
                this.globalY = gpos.y;

                var lpos = self.getDOMLocalXY( event );
                this.localX = lpos.x;
                this.localY = lpos.y;

                this.key = self.getDOMKey( event );

                return this;
            },

            /**
             * prevents an events default behavior
             */
            preventDefault: function(){
                this.originalEvent.preventDefault();
            },

            /**
             * stops event propagation
             */
            stopPropagation: function(){
                this.originalEvent.stopPropagation();
                this.propagationStopped = true;
            },

            /**
             * stops immediate event propagation
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
         * delayed hover intent event hook
         * @event hover
         */
        var HoverHook = function() {
            var self = this;
            var hookEvent = "hover";

            var ns = 'eventHover';

            function getData( target ){
                var wait = lola.dom.attr( target, "hoverDelay" );
                wait = (wait == null || wait == undefined) ? 250 : parseInt(wait);
                var data = lola.data.get( target, ns );
                if ( !data ) {
                    data = { hasIntent:false, wait:wait, timeout:-1 };
                    lola.data.set( target, data, ns, true );
                }
                return data;
            }

            function mouseOver( event ){
                self.addListener( event.currentTarget, 'mouseout', mouseOut, false, 0, this );
                var data = getData( event.currentTarget );
                data.hasIntent = true;
                if (data.timeout < 0)
                    data.timeout = setTimeout( confirm, data.wait );
            }

            function mouseOut( event ){
                self.removeListener( event.currentTarget, 'mouseout', mouseOut, false );
                var data = getData( event.currentTarget );
                data.hasIntent = false;
            }

            function confirm( target ){
                self.removeListener( target, 'mouseout', mouseOut, false, 0, this );
                var data = getData( target );
                data.timeout = -1;
                if (data.hasIntent){
                    self.trigger( target, hookEvent );
                }
            }

            this.addListener = function( target, type, handler, useCapture, priority, scope ){
                var uid = self.addListener( target, hookEvent, handler, useCapture, priority, scope );
                getData( target );
                self.addListener( target, 'mouseover', mouseOver, false, 0, this );
                return uid;
            };

            this.removeListener = function( target, type, handler, useCapture ){
                var edata = lola.data.get( target, dataNamespace );
                self.removeListener(target, hookEvent, handler, useCapture );
                var phase = self.phaseString( target, useCapture );
                //check for other hook listeners before removeing
                if (edata[phase][hookEvent] == null || Object.keys(edata[phase][hookEvent]).length == 0){
                    self.removeListener( target, 'mouseover', mouseOver, false );
                    lola.data.remove( target, ns );
                }
            };


            return this;
        };
        this.addHook( 'hover', new HoverHook() );

        /**
         * mouse enter state event
         * @event mouseenterstate
         */
        var MouseEnterStateHook = function(){
            var self = this;

            var e1 = 'domouseenter';
            var e2 = 'domouseleave';
            var ns = 'eventMouseEnterState';

            function getData( target ){
                var data = lola.data.get( target, ns );
                if ( !data ) {
                    data = { within:false };
                    lola.data.set( target, data, ns, true );
                }
                return data;
            }

            function getEnhancedType ( type ){
                if (!lola.support.msEvent) {
                    type = 'do'+type;
                }
                return type;
            }

            function mouseOver( event ){
                var data = getData( event.currentTarget );
                if (!data.within && event.currentTarget != event.relatedTarget){
                    data.within = true;
                    self.trigger( event.currentTarget, e1, false );
                }
            }

            function mouseOut( event ){
                var data = getData( event.currentTarget );
                if ( data.within &&
                    !lola.util.isAncestor( event.currentTarget, event.relatedTarget ) &&
                    event.currentTarget != event.relatedTarget ){
                    data.within = false;
                    self.trigger( event.currentTarget, e2, false );
                }
            }

            this.addListener = function( target, type, handler, useCapture, priority, scope ){
                //IE has it already
                if (!lola.support.msEvent){
                    //deal with other browsers
                    self.addListener( target, 'mouseover', mouseOver, useCapture, priority, scope );
                    self.addListener( target, 'mouseout', mouseOut, useCapture, priority, scope );
                }
                return self.addListener( target, getEnhancedType( type ), handler, useCapture, priority, scope );
            };

            this.removeListener = function( target, type, handler, useCapture ){

                var edata = lola.data.get( target, dataNamespace );
                var phase = self.phaseString( target, useCapture );
                type = getEnhancedType( type );
                self.removeListener( target, type, handler, useCapture );

                //check for other hook listeners before removeing
                if (!lola.support.msEvent &&
                    edata[phase][type] == null ||
                    edata[phase][type].keys().length == 0){
                    //deal with other browsers
                    self.removeListener( target, 'mouseover', mouseOver, useCapture );
                    self.removeListener( target, 'mouseout', mouseOut, useCapture );
                }
            }
        };
        var mesh = new MouseEnterStateHook();
        this.addHook( 'mouseenterstate', mesh );

        /**
         * mouse leave event
         * @event mouseleave
         */

        this.addHook( 'mouseleave', mesh );
        /**
         * mouse enter event
         * @event mouseleave
         */
        this.addHook( 'mouseenter', mesh );

    };

	//register module
	lola.registerModule( new Module() );

})( lola );
