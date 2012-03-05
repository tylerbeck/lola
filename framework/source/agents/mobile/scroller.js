/***********************************************************************
 * Lola JavaScript Framework Agent
 *
 *       Agent: scroller
 *  Description: allows for fixed position scrolling in ios
 *       Author: Copyright 2012, tylerbeck
 *
 ***********************************************************************/
(function (lola) {
    var Agent = function () {
        var self = this;

        //==================================================================
        // Attributes
        //==================================================================
        /**
         * agent's namespace
         * @type {String}
         * @private
         */
        var namespace = "scroller";

        /**
         * agent's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["event"];

        /**
         * map of agent's clients
         * @private
         * @type {Object}
         */
        var clients = {};

        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get agent's namespace
         * @return {String}
         */
        this.namespace = function () {
            return namespace;
        };

        /**
         * get agent's dependencies
         * @return {Array}
         */
        this.dependencies = function () {
            return dependencies;
        };

        //==================================================================
        // Methods
        //==================================================================
        /**
         * signs a client
         * @param {*} client
         */
        this.sign = function (client) {
            var $client = $(client).identify();
            if (clients[ client.id ] == null) {

                //setup client
                clients[ client.id ] = client;
                $client.putData({}, namespace);
                var data = $client.getData(namespace);
                data.startTouch = {x:0,y:0};
                data.contentOffset = {x:0,y:0};
                data.contentStartOffset = {x:0,y:0};
                data.boundsMin = {x:Number.MIN_VALUE, y:Number.MIN_VALUE};
                data.boundsMax = {x:Number.MAX_VALUE, y:Number.MAX_VALUE};

                //add listeners
                $client.addListener('touchstart', handleTouchStart );
                $client.addListener('touchmove', handleTouchMove );
                $client.addListener('touchend', handleTouchEnd );

            }
        };

        /**
         * drops a client
         * @param {*} client
         */
        this.drop = function (client) {
            if (clients[ client.id ]) {
                var $client = $(client);
                var data = $client.getData(namespace);
                //remove listeners

                //teardown client
                $client.removeData(namespace);
                delete clients[ client.id ];
            }
        };

        /**
         * checks if client exists
         * @param {*} client
         * @return {Boolean}
         */
        this.clientExists = function (client) {
            return ( client.id && clients[ client.id ] );
        };

        this.setBounds = function(client,xMin,xMax,yMin,yMax){
            if (clients[ client.id ]){
                var $client = $(client);
                var data = $client.getData(namespace);

                data.boundsMin = {x:xMin, y:yMin};
                data.boundsMax = {x:xMax, y:yMax};
            }
        };

        /**
         * agent initializer
         */
        this.initialize = function () {
            lola(".mobile-scroll-fix").assignAgent(namespace);
        };

        function getPoint(e){
            return {x:e.touches[0].clientX, y:e.touches[0].clientY};
        }

        function isDragging( e, data ){
            return true;
        }

        function onTouchStart(e) {
            var $client = $(e.currentTarget);
            var data = $client.getData(namespace);
            //stop momentum

            data.startTouch = getPoint(e);
            data.contentStartOffset = data.contentOffset;
        }

        function onTouchMove(e) {
            var $client = $(e.currentTarget);
            var data = $client.getData(namespace);

            if ( isDragging(e,data) ) {
                var current = getPoint(e);
                var delta = {x:current.x - data.startTouch.x, y:current.y - data.startTouch.y};
                var newOffset = {x:delta.x+data.contentStartOffset.x, y:delta.x+data.contentStartOffset.y };
                animateTo(newOffset);
            }
        }

        function onTouchEnd(e) {
            var $client = $(e.currentTarget);
            var data = $client.getData(namespace);

            if ( isDragging(e,data) ) {
                //start momentum if needed
            }
        }

        function snapOffset( offset, data ){
            var x = Math.min( data.boundsMin.x, Math.max(data.boundsMax.x, offset.x ));
            var y = Math.min( data.boundsMin.y, Math.max(data.boundsMax.y, offset.y ));
            return {x:x,y:y};
        }

        function animateTo( offset ) {
            var $client = $(e.currentTarget);
            var data = $client.getData(namespace);

            offset = snapOffset( offset, data );
            data.contentOffset = offset;

            //TODO add check if transform is supported
            $client.style('webkitTransform', 'translate3d(' + offset.x + 'px, ' + offset.y + 'px, 0)');
        }





    };

    //register module
    lola.agent.registerAgent(new Agent());

})(lola);

