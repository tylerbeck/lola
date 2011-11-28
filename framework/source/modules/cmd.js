(function( lola ) {
	var $ = lola;
	/**
	 * @description Command Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var cmd = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @description registry of commands
		 * @private
		 */
		registry: {},

		/**
		 * @description holds calls to unloaded commands
		 * @private
		 */
		callLater: {},


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.cmd::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.cmd.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.cmd::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.cmd.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "cmd";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['event'];
		},

		/**
		 * @description registers command with the module
		 * @param {Class|String} cmd the comman ./d b class or url of the class' js file
		 * @param {String} name the name with which tobv register the command
		 */
		register: function( cmd, name ) {
			if ( typeof cmd != "string" && name == undefined  )
				name = cmd.name;

			lola.debug('register command: '+name);
			if ( this.registry[name] != null && typeof this.registry[name] != "string" )
				console.warn( 'command "'+name+'" has already been registered... overwriting' );

			//register command class or url
			this.registry[name] = cmd;

			lola.event.addListener( this, name, this.executeCommand  );
		},

		/**
		 * @description executes a registered command
		 * @param {String} name registered command name
		 * @param {Object} params parameter object to be passed to command
		 * @param {lola.cmd.Responder} responder responder object to handle command events
		 */
		execute: function( name, params, responder ){
			if (this.registry[name]) {

				if (!responder) {
					responder = new cmd.Responder();
				}

				if ( typeof this.registry[name] == "string" ) {
					//add execution params to call later queue for the unloaded command
					if ( !this.callLater[ name ] ){
						//try to load command
						lola.loadScript( this.registry[name], function(e){
							if ( typeof this.registry[name] == "function" ) {
								//command successfully loaded - iterate through queued calls
								var s = lola.cmd.callLater[ name ].length;
								for (var i = 0; i < s; i++){
									var o = lola.cmd.callLater[ name ][i];
									lola.cmd.execute( o.name, o.params, o.responder );
								}
								delete lola.cmd.callLater[ name ];
							}
							else {
								throw new Error('The command loaded from "'+lola.cmd.registry[name]+'" is not named "'+name+'"');
							}
						});
						this.callLater[ name ] = [];
					}

					var cmdObj = {name:name, params:params, responder:responder};
					this.callLater[ name ].push( cmdObj );
				}
				else {
					//try to execute command
					var cmdClass = this.registry[ name ];
					if (cmdClass) {
						var cmd = new cmdClass();
						if (responder) {
							lola.event.addListener( cmd, 'result', responder.handleResult );
							lola.event.addListener( cmd, 'fault', responder.handleFault );
							lola.event.addListener( cmd, 'status', responder.handleStatus );
						}

						cmd.execute( params );
					}
				}
			}
			else {
				throw new Error('Unknown command type: '+name);
			}

			return responder;

		},

		/**
		 * @description handles executing commands triggered via event model
		 * @private
		 * @param event
		 */
		executeCommand: function( event ){
			lola.cmd.execute(event.type, event.data.parameters, event.data.responder );
		},


		//==================================================================
		// Classes
		//==================================================================
		/**
		 * @description Responder class handles command events
		 * @class
		 * @param {Function} resultHandler
		 * @param {Function} faultHandler
		 * @param {Function} statusHandler
		 */
		Responder: function( resultHandler, faultHandler, statusHandler ){
			return this.init();
		},

		/**
		 * @description Data object for executing commands via event model
		 * @param {Object} parameters parameter object
		 * @param {lola.cmd.Responder} responder responder object
		 */
		Data: function( parameters, responder ){
			return this.init( parameters, responder);
		},


		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * @description get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * @description module's selector methods
			 * @type {Object}
			 */
			var methods = {

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
	cmd.Responder.prototype = {
		/**
		 * @description user defined result handler
		 */
		resultHandler:undefined,

		/**
		 * @description user defined fault handler
		 */
		faultHandler:undefined,

		/**
		 * @description user defined status handler
		 */
		statusHandler:undefined,

		/**
		 * @description last response event
		 * @private
		 */
		lastResponse: undefined,

		/**
		 * @description class initializer
		 * @private
		 * @param {Function} resultHandler
		 * @param {Function} faultHandler
		 * @param {Function} statusHandler
		 */
		init: function( resultHandler, faultHandler, statusHandler ){
			this.resultHandler = resultHandler;
			this.faultHandler = faultHandler;
			this.statusHandler = statusHandler;
		},

		/**
		 * @description handle status events from command
		 * @private
		 * @param {Object} event
		 */
		handleStatus: function( event ){
			if (!this.lastResponse ||  this.lastResponse.type == 'status' )
				this.lastResponse = event;
			if (typeof this.statusHandler == 'function')
				this.statusHandler.apply(lola.window, [event] );
		},

		/**
		 * @description handle result events from command
		 * @private
		 * @param {Object} event
		 */
		handleResult: function( event ){
			this.lastResponse = event;
			if (typeof this.resultHandler == 'function')
				this.resultHandler.apply(lola.window, [event] );
		},

		/**
		 * @description handle fault events from command
		 * @private
		 * @param {Object} event
		 */
		handleFault: function( event ){
			this.lastResponse = event;
			if (typeof this.faultHandler == 'function')
				this.faultHandler.apply(lola.window, [event] );
		},

		/**
		 * @description get last response
		 * @return {Object|undefined}
		 */
		getLastResponse: function(){
			return this.lastResponse;
		}


	};

	cmd.Data.prototype = {
		/**
		 * @description command parameters
		 * @type {Object}
		 */
		parameters: undefined,

		/**
		 * @description command responder
		 * @type {lola.cmd.Responder}
		 */
		responder: undefined,

		/**
		 * @description class initializer
		 * @private
		 * @param {Object} parameters
		 * @param {lola.cmd.Responder} responder
		 */
		init: function(parameters, responder) {
			this.parameters = parameters;
			this.responder = responder;
		}
	};

	//register module
	lola.registerModule( cmd );

})( lola );
