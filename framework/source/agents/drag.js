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
         * bounds for current drag target
         * @private
         */
        var bounds;

        /**
         * default bounding function for current drag target
         * @private
         */
        var boundsFn;

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
                $client.addListener( 'touchstart', startDrag, true, undefined, self );

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
                $client.removeListener( 'touchstart', startDrag, true );
                delete clients[ client.id ];
            }
        };

        /**
         * default bounding function for current drag target
         * @param t
         * @param x
         * @param y
         * @return {Object}
         */
        function defaultBoundsFn(t,x,y){
            return {x:x,y:y};
        }


        /**
         * parent bounding function for current drag target
         * @param t
         * @param x
         * @param y
         * @return {Object}
         */
        function parentalBoundsFn(t,x,y){
	        //TODO: take border box into account
            var $t = $(t);
            var $p = $($t.parent());
            x = lola.math.normalizeRange( 0, x, $p.width() - $t.width() );
            y = lola.math.normalizeRange( 0, y, $p.height() - $t.height() );
	        //console.log('[',x,',',y,']');
            return {x:x,y:y};
        }


        /**
         * drag start handler
         * @param event
         * @private
         */
        function startDrag( event ) {
            document.onselectstart = function(){ return false; };
            target = event.currentTarget;
            offset = new lola.geometry.Point(-event.localX,-event.localY);
            var parentOffset = lola.geometry.getOffset($(target).parent());
            offset = offset.subtract( parentOffset );
            dragging = false;

            var $target = $(event.currentTarget);
            var data = $target.getData(namespace, true );
            data.position = new lola.geometry.Point(event.globalX, event.globalY);
            data.parent = $target.parent();
            data.zIndex = $target.style('zIndex');
            data.cursor = $target.style('cursor');

            var cursor = $target.dataset('dragcursor');
            var drgb = $target.dataset('dragbounds');
	        if (drgb == "parent"){
                boundsFn = parentalBoundsFn;
                bounds = [];
            }
            else{
                boundsFn = (data.boundsFn) ? data.boundsFn : defaultBoundsFn;
                bounds = drgb ? drgb.split(','): [];
            }

            $target.style('zIndex', 10000 );
            $target.style('cursor', cursor?cursor:'none' );

            $(document).addListener('mousemove', doDrag, true, undefined, self)
                .addListener('mouseup', endDrag, true, undefined, self )
                .addListener('touchmove', doDrag, true, undefined, self )
                .addListener('touchend', endDrag, true, undefined, self );
            $('body').addClass('dragging');

        }


        /**
         * do drag
         * @param event
         * @private
         */
        function doDrag( event ){
            event.preventDefault();
            var $target = $(target);


            var newX = event.globalX + offset.x;
            var newY = event.globalY + offset.y;
            if (bounds.length == 4) {
                newX = lola.math.normalizeRange( bounds[0], newX, bounds[2] - $target.width() );
                newY = lola.math.normalizeRange( bounds[1], newY, bounds[3] - $target.height() );
            }
            var pos = boundsFn(target,newX,newY);

            if (!dragging) {
                dragging = true;
                $target.style('position', 'absolute');
                //$('html').appendChild(target);
                $target.trigger( "dragstart", false, false, { x:pos.x, y:pos.y } );
            }

            $target.style('left', pos.x+'px');
            $target.style('top', pos.y+'px');

            $target.trigger( "dragmove", false, false, { x:pos.x, y:pos.y } );
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
            //$(data.parent).appendChild( target );
            dragging = false;
            target = null;
            $(document).removeListener('mousemove', doDrag, true )
                .removeListener('mouseup', endDrag, true )
                .removeListener('touchmove', doDrag, true )
                .removeListener('touchend', endDrag, true );

            document.onselectstart = null;
            $('body').removeClass('dragging');
            $target.trigger( "dragend", false, false );
        }

        this.initialize = function(){
            lola(".draggable").assignAgent( namespace );
        };

    };


	//register module
	lola.agent.registerAgent( new Agent() );

})( lola );

