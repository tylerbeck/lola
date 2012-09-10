/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Agent
 *  Description: Agent module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    /**
     * Agent Module
     * @namespace lola.agent
     */
    var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "agent";

        /**
         * agents' dependencies (non-standard implementation)
         * @type {Object}
         * @private
         */
        var dependencies = {};

        /**
         * registration index
         * @private
         */
        var index = 0;

        /**
         * registration map
         * @private
         */
        var map = {};

        /**
         * initializers
         * @private
         */
        var agentDependencies = {};

        /**
         * initializers
         * @private
         */
        var initializers = [];



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
            return ['event','data'];
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * initializes module
         * @public
         * @return {void}
         */
        this.initialize = function() {
            $.syslog('lola.agent::initialize');

            //check agent dependencies
            $.checkDependencies( this.dependencies );

            //execute agent initialization stack
            var stackSize = initializers.length;

            for ( var i = 0; i < stackSize; i++ ) {
                if ($.hasFn( initializers, i )){
                    initializers[i]();
                    delete initializers[i];
                }
            }

            //remove initialization method
            delete self.initialize;
        };

        /**
         * used to register an agent with the framework
         * @param {Object} agent object that implements the agent interface
         */
        this.registerAgent = function( agent ) {
            var ns = agent.namespace();
            $.syslog('register agent: '+ns);
            if ( ns && $.hasFn( agent,"sign" ) && $.hasFn( agent,"drop" ) ) {
                //setup module
                var pkg = $.getPackage( $.agent, ns, agent );

                //add dependencies
                if ($.hasFn(agent,'getDependencies'))
                    this.dependencies[ 'agent.'+ns ] = agent.getDependencies();

                //map agent
                map[ ns ] = pkg;

                //add initializer
                if ($.hasFn( agent,'initialize' )) {
                    initializers.push( function() {
                        agent.initialize();
                    });
                }

                //run preinitialization method if available
                if ($.hasFn( agent,'preinitialize' )) {
                    agent.preinitialize();
                }

            }
            else {
                console.error( 'invalid agent implementation: '+name );
            }
        };

        /**
         * assign a client to an agent
         * @param {Object} client
         * @param {String} name name of registered agent
         */
        this.assign = function( client, name ) {
            var agent = map[ name ];
            if (agent){
                agent.sign( client );
            }
            else {
                throw new Error("unknown agent: "+name);
            }
        };

        /**
         * drop a client from an agent
         * @param {Object} client
         * @param {String} name name of registered agent
         */
        this.drop = function( client, name ) {
            var agents = {};
            if (name == undefined){
                agents = map;
            }
            else if (typeof name == 'string'){
                name.split(',').forEach( function(item){
                    agents[ item ] = map[ item ];
                });
            }

            for (var i in agents){
                var a = agents[i];
                if (a){
                    a.drop( client );
                }
            }
        };

        //==================================================================
        // Selection Methods
        //==================================================================
        this.selectorMethods = {

            /**
             * assigns an agent to selector elements
             * @param {String} agentName name of registered agent
             */
            assignAgent: function( agentName ) {
                return this.s( self.assign, agentName );
            },

            /**
             * drops client from agent
             * @param {String} agentName name of registered agent
             */
            dropAgent: function( agentName ) {
                return this.s( self.drop, agentName );
            }

        };

        //==================================================================
        // Preinitialization
        //==================================================================
        $.addSafeDeleteHook( this.drop, this );

    };



	//register module
	lola.registerModule( new Module() );

})( lola );

