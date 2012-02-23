/***********************************************************************
 * Lola JavaScript Framework Agent
 *
 *       Agent: Integrated Label Input
 *  Description: controller for text inputs with integrated labels
 *       Author: Copyright 2012, tbeck
 *
 ***********************************************************************/
(function (lola) {
    var Agent = function () {
        var $ = lola;
        var self = this;

        //==================================================================
        // Attributes
        //==================================================================
        /**
         * agent's namespace
         * @type {String}
         * @private
         */
        var namespace = "ui.input.labeled";

        /**
         * agent's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["data", "css", "tween"];

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
            var $client = $(client);
            $client.identify();
            if (clients[ client.id ] == null) {

                //setup client
                clients[ client.id ] = client;
                $client.putData({}, namespace);
                var label = $('label[for="'+client.id+'"]').get();
                var data = $client.getData( namespace );
                data.label = label;
                setVisibility( client );

                //add listeners
                $client.addListener('keypress',handler,false,lola.event.PRIORITY_BEFORE,self);
                $client.addListener('keyup',handler,false,lola.event.PRIORITY_BEFORE,self);
                $client.addListener('change',handler,false,lola.event.PRIORITY_BEFORE,self);

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
                $client.removeListener('keypress',handler,false);
                $client.removeListener('keyup',handler,false);
                $client.removeListener('change',handler,false);
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
            $("input.ui-input-labeled").assignAgent(namespace);
        };

        function handler( event ){
            setVisibility( event.currentTarget, (event.type == 'keypress')?false:undefined );
        }

        function setVisibility( client, visible ){
            var $client = $(client);
            var data = $client.getData( namespace );
            if (visible == undefined)
                visible = $client.attr('value') == "";
            $(data.label).style('opacity',visible?1:0);
        }

    };

    //register module
    lola.agent.registerAgent(new Agent());

})(lola);

