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
                data.startTouchY = 0;
                data.contentOffsetY = 0;
                data.contentStartOffsetY = 0;

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

        /**
         * agent initializer
         */
        this.initialize = function () {
            lola(".mobile-scroll").assignAgent(namespace);
        };



    };

    //register module
    lola.agent.registerAgent(new Agent());

})(lola);

