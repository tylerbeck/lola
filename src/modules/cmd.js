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
		namespace: "cmd",

		//module dependencies
		dependencies: ['event','data'],

		//initialization flag
		initialized: false,

		//registry
		registry: {},

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// setup
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.cmd.initialized ) {
				//this module is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				lola.cmd.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// register command
		//------------------------------------------------------------------
		register: function( cmd, name ) {
			if ( typeof cmd != "string" && name == undefined  )
				name = cmd.name;

			console.info('register command: '+name);
			if ( lola.cmd.registry[name] != null && typeof lola.cmd.registry[name] != "string" )
				console.warn( 'command "'+name+'" has already been registered... overwriting' );

			if (typeof cmd == "string"){
				//register path
				this.registry[name] = cmd;
			}
			else{
				//create command class from object
				this.registry[name] = function(){
					return this.init();
				};
				this.registry[name].prototype = cmd;
			}
			lola.event.addListener( this, name, this.executeCommand  );
		},

		//------------------------------------------------------------------
		// execute command
		//------------------------------------------------------------------
		execute: function( name, params, result, fault, scope ) {
			if ( this.registry[name] == null )
				console.warn( 'command "'+name+'" is not registered' );
			else {
				lola.event.trigger( lola.cmd, name, false, false, {params:params, result:result, fault:fault, scope:scope} );
			}
		},

		//------------------------------------------------------------------
		// execute command handler
		//------------------------------------------------------------------
		executeCommand: function( event ) {
			console.info('executeCommand: '+event.type);
			if ( typeof this.registry[event.type] == "string" ){
				//command code needs to be loaded
				console.log('   load command: '+event.type+' -> '+this.registry[event.type]);
				var d = event.data;
				lola.loadScript( this.registry[event.type], function(e){
					if (typeof lola.cmd.registry[event.type] != 'string' ){
						//successfully loded command
						lola.cmd.execute( event.type, d.params, d.result, d.fault, d.scope );
					}
					else {
						console.error('the command loaded from "'+lola.cmd.registry[event.type]+'" is not named "'+event.type+'"');
					}
				});
			}
			else {
				var cmdClass = this.registry[event.type];
				if (cmdClass){
					var cmd = new cmdClass();
					var scope = event.data.scope || event.currentTarget;

					if (event.data.result){
						lola.event.addListener( cmd, 'result', event.data.result, true, null, scope );
					}

					if (event.data.fault){
						lola.event.addListener( cmd, 'fault', event.data.fault, true, null, scope );
					}

					cmd.execute( event.data.params );
				}
				else {
					console.error('command not found: '+event.type);
				}
			}

		},

		//------------------------------------------------------------------
		// result
		//------------------------------------------------------------------
		result: function( cmd, result ) {
			//call once execution is complete
			lola.event.trigger( cmd, 'result', false, false, result );
		},

		//------------------------------------------------------------------
		// fault
		//------------------------------------------------------------------
		fault: function( cmd, msg ) {
			//call once execution is complete
			lola.event.trigger( cmd, 'fault', false, false, msg );
		},





		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

		}

	};
	lola.registerModule( Module );
})( lola );
