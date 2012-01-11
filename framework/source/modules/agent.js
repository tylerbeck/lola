/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Agent
 *  Description: Agent module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Ag Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var agent = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * registration index
		 * @private
		 */
		index: 0,

		/**
		 * registration map
		 * @private
		 */
		map: {},

		/**
		 * initializers
		 * @private
		 */
		initializers: [],

        /**
         * @private
         * @type {Object}
         */
        dependencies: {},


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.agent::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization
			lola.safeDeleteHooks.push( {scope:this, fn:this.drop} );


			//remove initialization method
			delete lola.agent.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.agent::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

            //check agent dependencies
            lola.checkDependencies( this.dependencies );

            //execute agent initialization stack
            var stackSize = lola.agent.initializers.length;

            for ( i = 0; i < stackSize; i++ ) {
                if (lola.hasFn( lola.agent.initializers, i )){
                    lola.agent.initializers[i]();
	                delete lola.agent.initializers[i];
                }
            }

			//remove initialization method
			delete lola.agent.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "agent";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['event','data'];
		},


		/**
		 * used to register an agent with the framework
		 * @param {Object} agent object that implements the agent interface
		 */
        registerAgent: function( agent ) {
            var ns = agent.getNamespace();
			console.info('register agent: '+ns);
			if (ns && agent.sign && agent.drop) {
				//setup namespace
				var pkg = lola.getPackage( lola.agent, ns );

				//copy module methods and attributes
				lola.extend( pkg, agent, true );

                //add dependencies
                if (lola.hasFn(agent,'getDependencies'))
                    this.dependencies[ 'agent.'+ns ] = agent.getDependencies();

				//map agent
				this.map[ ns ] = pkg;

				//add initializer
                if (lola.hasFn(agent,'initialize')) {
					lola.agent.initializers.push( function() {
						agent.initialize();
					} );
				}

				//run preinitialization method if available
                if (lola.hasFn(agent,'preinitialize')) {
					agent.preinitialize();
				}

			}
			else {
				console.error( 'invalid agent implementation: '+name );
			}

		},

		/**
		 * assign a client to an agent
		 * @param {Object} client
		 * @param {String} name name of registered agent
		 */
		assign: function( client, name ) {
			var agent = lola.agent.map[ name ];
			if (agent){
				agent.sign( client );
			}
			else {
				throw new Error("unknown agent: "+name);
			}
		},

		/**
		 * drop a client from an agent
		 * @param {Object} client
		 * @param {String} name name of registered agent
		 */
		drop: function( client, name ) {
			var agents = {};
			if (name == !undefined){
				agents = lola.agent.map;
			}
			else if (typeof name == 'string'){
				name.split(',').forEach( function(item){
					agents[ item ] = lola.agent.map[ item ];
				});
			}

			for (var i in agents){
				var agent = agents[i];
				if (agent){
					agent.drop( client );
				}
			}
		},



		//==================================================================
		// Classes
		//==================================================================



		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {

				/**
				 * assigns an agent to selector elements
				 * @param {String} agentName name of registered agent
				 */
				assignAgent: function( agentName ) {
					this.forEach( function(item){
						lola.agent.assign( item, agentName );
					});
					return this;
				},

				/**
				 * drops client from agent
				 * @param {String} agentName name of registered agent
				 */
				dropAgent: function( agentName ) {
					this.forEach( function(item){
						lola.agent.drop( item, agentName );
					})
				}

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================




	//register module
	lola.registerModule( agent );

})( lola );

