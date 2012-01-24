/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Agent: Drag Agent
 *  Description: handles javascript dragging
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/

(function( lola ) {
    var Agent = function(){
        var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * agent's namespace
         * @type {String}
         * @private
         */
        var namespace = "drag";

        /**
         * agent's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['event','data','graphics','geometry'];

        /**
         * map of agent's clients
         * @private
         * @type {Object}
         */
        var clients = {};

        /**
         * current drag target
         * @private
         */
        var target;

        /**
         * bounds
         * @private
         */
        var bounds;

        /**
         * dragging flag
         * @private
         */
        var dragging = false;

        /**
         * drag offset
         * @private
         */
        var offset;

        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get agent's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get agent's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        /**
         * set bounds
         * @param xMin
         * @param xMax
         * @param yMin
         * @param yMax
         */
        this.setBounds = function( xMin, xMax, yMin, yMax) {
            bounds = {
                xMin:xMin,
                xMax:xMax,
                yMin:yMin,
                yMax:yMax
            };
        };

        /**
         * get bounds
         * @return {Object}
         */
        this.getBounds = function() {
            return {
                xMin:bounds.xMin,
                xMax:bounds.xMax,
                yMin:bounds.yMin,
                yMax:bounds.yMax
            };
        };




        //==================================================================
        // Methods
        //==================================================================
        /**
         * signs a client
         * @param {*} client
         */
        this.sign = function( client ) {
            var $client = $(client);
            $client.identify();
            if ( clients[ client.id ] == null) {

                //not a client yet
                clients[ client.id ] = client;
                $client.putData( {}, namespace );

                //add listeners
                $client.addListener( 'mousedown', startDrag, true, undefined, self );

            }
        };

        /**
         * drops a client
         * @param {*} client
         */
        this.drop = function( client ) {
            var $client = $(client);
            if (clients[ client.id ] ) {
                $client.removeData( namespace );

                //remove listeners
                $client.removeListener( 'mousedown', startDrag, true );
                delete clients[ client.id ];
            }
        };

        /**
         * resets bounds
         */
        this.resetBounds = function() {
            bounds = null;
        };

        /**
         * drag start handler
         * @param event
         * @private
         */
        function startDrag( event ) {
            target = event.currentTarget;
            offset = new lola.geometry.Point(-event.localX,-event.localY);
            dragging = false;

            var $target = $(event.currentTarget);
            var data = $target.getData(namespace, true );
            data.position = new lola.geometry.Point(event.globalX, event.globalY);
            data.parent = $target.parent();
            data.zIndex = $target.style('zIndex');
            data.cursor = $target.style('cursor');
            $target.style('zIndex', 10000 );
            $target.style('cursor', 'none' );

            $(document).addListener('mousemove', doDrag, true, undefined, self );
            $(document).addListener('mouseup', endDrag, true, undefined, self );
        }

        /**
         * do drag
         * @param event
         * @private
         */
        function doDrag( event ){
            var $target = $(target);

            if (!dragging) {
                dragging = true;
                $target.style('position', 'absolute');
                $('body').appendChild(target);
                $target.trigger( "dragstart", false, false );
            }

            var newX = event.globalX + offset.x;
            var newY = event.globalY + offset.y;

            if (bounds) {
                newX = lola.math.normalizeRange( bounds.xMin, newX, bounds.xMax );
                newY = lola.math.normalizeRange( bounds.yMin, newY, bounds.yMax );
            }
            else {
                newX = event.globalX;
                newY = event.globalY;
            }

            $target.style('left',newX+'px');
            $target.style('top',newY+'px');

            $target.trigger( "dragmove", false, false, { x:newX, y:newY } );
        }

        /**
         * end drag handler
         * @param event
         * @private
         */
        function endDrag( event ){
            var $target = $(target);
            var data = $target.getData(namespace, true );
            $target.style('cursor', data.cursor );
            $target.style('zIndex', data.zIndex );
            dragging = false;
            target = null;
            $(document).removeListener('mousemove', doDrag, true );
            $(document).removeListener('mouseup', endDrag, true );
            $target.trigger( "dragend", false, false );

        }

        this.initialize = function(){
            lola(".draggable").assignAgent( namespace );
        };

    };


	//register module
	lola.agent.registerAgent( new Agent() );

})( lola );

