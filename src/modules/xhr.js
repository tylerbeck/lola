/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: XHR
 *  Description: xhr module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "xhr",

		//module dependencies
		dependencies: ['event'],

		//initialization flag
		initialized: false,


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.xhr.initialized ) {
				//console.info('lola.async.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				//request class
				var Request = function( url, method, headers, async, user, password ) {
					return this.init( url, method, headers, async, user, password );
				};
				Request.prototype = lola.xhr.RequestPrototype;
				lola.setProperty( lola, "xhr", 'Request', Request );

				//async request class
				var AsyncRequest = function( url, method, headers, user, password ) {
					return this.init( url, method, headers, true, user, password );
				};
				AsyncRequest.prototype = lola.xhr.RequestPrototype;
				lola.setProperty( lola, "xhr", 'AsyncRequest', AsyncRequest );

				//sync request class
				var SyncRequest = function( url, method, headers, user, password ) {
					return this.init( url, method, headers, true, user, password );
				};
				SyncRequest.prototype = lola.xhr.RequestPrototype;
				lola.setProperty( lola, "xhr", 'SyncRequest', SyncRequest );

				lola.xhr.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// gets the supported request object
		//------------------------------------------------------------------

		//==================================================================
		// RequestPrototype
		//==================================================================
		RequestPrototype:
		{
			url: "",
			method: 'POST',
			headers: [],
			async: true,
			user: null,
			password: null,

			request: false,
			ready: false,

			init: function( url, method, headers, async, user, password ) {
				this.method = method || 'POST';
				this.headers = headers || [];
				this.async = async === true;
				this.url = url;
				this.user = user;
				this.password = password;

				return this;
			},

			getRequestObject: function() {
				var request = false;
				if ( window.XMLHttpRequest && !(window.ActiveXObject) ) {
					// branch for native XMLHttpRequest object
					try {
						request = new XMLHttpRequest();
					}
					catch( error ) {
						request = false;
					}
				}
				else if ( window.ActiveXObject ) {
					// branch for IE/Windows ActiveX version
					try {
						//request = new ActiveXObject("MSXML2.FreeThreadedDomDocument");
						request = new ActiveXObject( "Msxml2.XMLHTTP" );
					}
					catch( error ) {
						try {
							request = new ActiveXObject( "Microsoft.XMLHTTP" );
						}
						catch( error ) {
							request = false;
						}
					}
				}

				return request;
			},

			makeRequest: function( url, params, method, headers, async, readystatechange, scope, user, password ) {
				var request = this.getRequestObject();
				request.open( method, url, async, user, password );
				request.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
				for ( var i = 0; i < headers.length; i++ ) {
					try {
						request.setRequestHeader( headers[i].name, headers[i].value );
					}
					catch( e ) {
					}
				}
				if ( params != null ) {
					if ( !Mainline.util.isString( params ) ) {
						var temp = [];
						for ( var k in params ) {
							temp.push( k + "=" + Mainline.util.encode( params[k] ) );
						}
						params = temp.join( '&' );
					}

					if ( params.length > 0 ) {
						//request.setRequestHeader("Content-Length", params.length);
						//request.setRequestHeader("Connection", "close");
					}
				}

				request.onreadystatechange = function() {
					readystatechange.call( scope )
				};
				request.send( params );

				return request;
			},

			send: function( params ) {
				this.request = this.makeRequest( this.url, params, this.method, this.headers, true, this.readyStateChange, this, this.user, this.password );
			},

			readyStateChange: function() {
				if ( this.request ) {
					switch ( this.request.readyState ) {
						case 0:
							//uninitialized
							break;
						case 1:
							//loading
							lola.event.trigger( this, 'loading', true, true, this.request );
							break;
						case 2:
							//loaded
							lola.event.trigger( this, 'loaded', true, true, this.request );
							break;
						case 3:
							//interactive
							lola.event.trigger( this, 'interactive', true, true, this.request );
							break;
						case 4:
							//complete
							lola.event.dispatch( this, 'stateComplete', true, true, this.request );
							if ( this.request.status == 200 && !this.ready ) {
								this.ready = true;
								lola.event.trigger( this, 'result', true, true, this.request );
							}
							else if ( this.request.status >= 400 ) {
								console.info( 'AsyncRequest.readyStateChange.fault: ' + this.url );
								lola.event.trigger( this, 'fault', false, false, this.request );
							}
							break;
					}
				}
			},

			responseText: function() {
				if ( this.ready )
					return this.request.responseText;
				else
					return false;
			},

			responseXML: function() {
				if ( this.ready )
					return this.request.responseXML;
				else
					return false;
			}

		},



		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

		}



	};
	lola.registerModule( Module );
})( lola );
