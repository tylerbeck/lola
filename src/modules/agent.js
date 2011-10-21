/***********************************************************************
 *       Module: App Nav
 *  Description: navigation module
 *       Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "agent",

		//module dependencies
		dependencies: ['event','data'],

		//registration index
		index: 0,

		//list of registered agents
		map: {},

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//add safe delete hook
			lola.safeDeleteHooks.push( {scope:this, fn:this.drop} );
		},

		//------------------------------------------------------------------
		// register
		//------------------------------------------------------------------
		register: function( agent ) {
			console.info('register agent: '+agent.name);
			if (agent.sign && agent.drop) {
				//setup namespace
				var pkg = lola.getPkgChain( lola.agent, agent.name );

				//copy module methods and attributes
				lola.extend( pkg, agent, true );

				//map agent
				this.map[ agent.name ] = pkg;

				//register initializers
				if ( agent.initialize && typeof agent.initialize == 'function' )
					lola.registerInitializer( agent, agent.initialize, null, lola.moduleIndex + lola.agent.index++ );
				if ( agent.setup && typeof agent.setup == 'function')
					lola.registerInitializer( agent, agent.setup, null, 0xEFFFFF + lola.moduleIndex + lola.agent.index );

			}
			else {
				console.error( 'invalid agent implementation: '+name );
			}

		},

		//------------------------------------------------------------------
		// assign
		//------------------------------------------------------------------
		assign: function( client, name ) {
			//console.info('assign: '+name);
			var agent = lola.agent.map[ name ];
			if (agent){
				agent.sign( client );
			}
		},

		//------------------------------------------------------------------
		// addClient
		//------------------------------------------------------------------
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
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			assignAgent: function( agentName ) {
				this.foreach( function(item){
					lola.agent.assign( item, agentName );
				})
			},
			dropAgent: function( agentName ) {
				this.foreach( function(item){
					lola.agent.drop( item, agentName );
				})
			}
		}

	};
	lola.registerModule( Module );
})( lola );
