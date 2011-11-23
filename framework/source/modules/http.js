(function( lola ) {
	var $ = lola;
	/**
	 * @description HTTP Request Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var http = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @description storage for cached xsl requests
		 */
		xslCache: {},


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.http::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.http.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.http::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.http.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "http";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['string'];
		},

		/**
		 * @descripiton applies transformation using results of two requests
		 * @public
		 * @param {lola.http.Request} xmlDoc
		 * @param {lola.http.Request} xslDoc
		 * @param {Object} xslParams
		 */
		transform: function( xmlDoc, xslDoc, xslParams ) {
			var children,k;
			if ( window.ActiveXObject ) {
				//THIS NEEDS TO BE TESTED! I've got no clue if it will work or not.
				var xsltCompiled = new ActiveXObject( "MSXML2.XSLTemplate" );
				xsltCompiled.stylesheet = xslDoc.documentElement;
				var processor = xsltCompiled.createProcessor();
				processor.input = xmlDoc;
				for ( k in xslParams ) {
					processor.addParameter( k, xslParams[k] );
				}
				processor.transform();

				var tempDiv = document.createElement( 'div' );
				tempDiv.innerHTML = processor.output;
				children = tempDiv.childNodes;
			}
			else if ( document.implementation && document.implementation.createDocument ) {
				var xsltProcessor = new XSLTProcessor();
				xsltProcessor.importStylesheet( xslDoc );
				for ( k in xslParams ) {
					xsltProcessor.setParameter( null, k, xslParams[k] );
				}
				var resultDocument = xsltProcessor.transformToFragment( xmlDoc, document );
				if ( resultDocument ) {
					children = resultDocument.childNodes;
				}
			}

			return children;
		},

		/**
		 * @description caches xsl request
		 * @public
		 * @param {String} id
		 * @param {lola.http.Request} xsl
		 */
		cacheXsl: function( id, xsl ){
			lola.http.xslCache[ id ] = xsl;
		},

		/**
		 * @description replaces "<" ">" "&" with "&lt;" "&gt;" "&amp;"
		 * @param {String} str
		 */
		encode: function( str ) {
			if ( typeof str == 'string' ) {
				str = str.replace( /</g, '&lt;' );
				str = str.replace( />/g, '&gt;' );
				str = str.replace( /&/g, '&amp;' );
			}
			return str;
		},

		/**
		 * @description replaces "&lt;" "&gt;" "&amp;" with "<" ">" "&"
		 * @param {String} str
		 */
		unencode: function( str ) {
			if ( typeof str == 'string' ) {
				str = str.replace( /\$lt;/g, '<' );
				str = str.replace( /&gt;/g, '>' );
				str = str.replace( /&amp;/g, '&' );
			}
			return str;
		},



		//==================================================================
		// Classes
		//==================================================================
		/**
		 * @description Base HTTP Request Class
		 * @class
		 * @param {String} url request url
		 * @param {String} method request method
		 * @param {Array} headers request headers
		 * @param {Boolean} async execute request asyncronously
		 * @param {String} user credentials username
		 * @param {String} password credentials password
		 */
		Request: function( url, method, headers, async, user, password ) {
			return this.init( url, method, headers, async, user, password );
		},

		/**
		 * @description Asynchronous HTTP Request Class
		 * @class
		 * @param {String} url request url
		 * @param {String} method request method
		 * @param {Array} headers request headers
		 * @param {String} user credentials username
		 * @param {String} password credentials password
		 * @extends lola.http.Request
		 */
		AsyncRequest: function( url, method, headers, user, password ) {
			return this.init( url, method, headers, true, user, password );
		},

		/**
		 * @description Synchronous HTTP Request Class
		 * @class
		 * @param {String} url request url
		 * @param {String} method request method
		 * @param {Array} headers request headers
		 * @param {String} user credentials username
		 * @param {String} password credentials password
		 * @extends lola.http.Request
		 */
		SyncRequest: function( url, method, headers, user, password ) {
			return this.init( url, method, headers, false, user, password );
		},

		/**
		 * @description AJAX Transform Class
		 * @param {lola.http.Request} xml request object
		 * @param {lola.http.Request|String} xsl request object or string id for cached xsl
		 * @param {Object} xslParams
		 * @param {String|undefined} xslCacheId if set xsl will be cached with the specified id
		 */
		Transform: function( xml, xmlParams, xsl, xslParams, transformParams, xslCacheId ) {
			return this.init( xml, xmlParams, xsl, xslParams, transformParams, xslCacheId );
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
				applyTransform: function( transform, interimContent, faultContent ) {
					this.html( interimContent );
					this.forEach( function(item){
						lola.event.addListener( transform, 'result', function( event ) {
							$( item ).html( event.data );
						} );
						lola.event.addListener( transform, 'fault', function() {
							$( item ).html( faultContent );
						} );
					});

					transform.load();

				},
				/**
				 * @description loads a request's content into elements
				 * @param {lola.http.Request} request
				 * @param {Object} requestParams
				 * @param {*} interimContent
				 * @param {*} faultContent
				 */
				applyRequest: function( request, requestParams, interimContent, faultContent ) {
					this.html( interimContent );
					this.forEach( function(item){
						lola.event.addListener( request, 'result', function( event ) {
							$( item ).html( event.currentTarget.responseText() );
						} );
						lola.event.addListener( request, 'fault', function() {
							$( item ).html( faultContent );
						} );
					});

					request.load();
				},

				/**
				 * @description loads http content into elements asynchronously
				 * @param {String} url
				 * @param {*} interimContent
				 * @param {*} faultContent
				 */
				loadContent: function( url, interimContent, faultContent ){
					var request = new lola.http.AsyncRequest( url, 'get', [] );
					this.applyRequest( request, {}, interimContent, faultContent);
				}
			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
	http.Request.prototype = {
		/**
		 * @description request url
		 * @private
		 */
		url: "",

		/**
		 * @description request method
		 * @private
		 */
		method: 'POST',

		/**
		 * @description request headers
		 * @private
		 */
		headers: [],

		/**
		 * @description execute request asyncronously
		 * @private
		 */
		async: true,

		/**
		 * @description username
		 * @private
		 */
		user: null,

		/**
		 * @description password
		 * @private
		 */
		password: null,

		/**
		 * @description DOM xmlhttprequest
		 * @private
		 */
		request: false,

		/**
		 * @description readyFlag
		 * @public
		 */
		ready: false,

		/**
		 * @description http.Request initializer
		 * @param {String} url request url
		 * @param {String} method request method
		 * @param {Array} headers request headers
		 * @param {Boolean} async execute request asyncronously
		 * @param {String} user credentials username
		 * @param {String} password credentials password
		 */
		init: function( url, method, headers, async, user, password ) {
			this.method = method || 'POST';
			this.headers = headers || [];
			this.async = async === true;
			this.url = url;
			this.user = user;
			this.password = password;

			return this;
		},

		/**
		 * @description gets correct request object
		 * @private
		 */
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

		/**
		 * @description builds and executes request
		 * @private
		 * @param url
		 * @param params
		 * @param method
		 * @param headers
		 * @param async
		 * @param readystatechange
		 * @param scope
		 * @param user
		 * @param password
		 */
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
				if ( lola.type.get( params ) != 'string' ) {
					var temp = [];
					for ( var k in params ) {
						temp.push( k + "=" + lola.string.encode( params[k] ) );
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

		/**
		 * @description send request
		 * @public
		 * @param {Object|String|undefined} params
		 */
		load: function( params ) {
			this.request = this.makeRequest( this.url, params, this.method, this.headers, true, this.readyStateChange, this, this.user, this.password );
		},

		/**
		 * @description ready state change listener
		 * @private
		 */
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
						lola.event.trigger( this, 'stateComplete', true, true, this.request );
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

		/**
		 * @description get raw response text
		 * @return {String}
		 */
		responseText: function() {
			if ( this.ready )
				return this.request.responseText;
			else
				return false;
		},

		/**
		 * @description get response xml document
		 * @return {XML}
		 */
		responseXML: function() {
			if ( this.ready )
				return this.request.responseXML;
			else
				return false;
		}


	};
	http.AsyncRequest.prototype = http.Request.prototype;
	http.SyncRequest.prototype = http.Request.prototype;

	http.Transform.prototype = {
		/**
		 * @description xml request object
		 * @private
		 * @type {lola.http.Request}
		 */
		xml: null,

		/**
		 * @description xsl request object
		 * @private
		 * @type {lola.http.Request}
		 */
		xsl: null,

		/**
		 * @description transformation xsl request params
		 * @private
		 * @type {Object}
		 */
		xslParams: null,

		/**
		 * @description transformation xml request params
		 * @private
		 * @type {Object}
		 */
		xmlParams: null,

		/**
		 * @description cache xsl onceLoaded
		 * @private
		 * @type {String}
		 */
		xslCacheId: "",

		/**
		 * @description holds transformation result
		 * @type {Array}
		 */
		resultNodes: [],

		/**
		 * @description Transform class initializer
		 * @private
		 * @param xml
		 * @param xsl
		 * @param xslParams
		 * @param xslCacheId
		 */
		init: function( xml, xmlParams, xsl, xslParams, transformParams, xslCacheId ) {
			this.xmlParams = xmlParams;
			this.xslParams = xslParams;
			this.transformParams = transformParams;
			this.xslCacheId = xslCacheId || "";
			if ( lola.type.get( xsl ) == 'string' ) {
				var xslId = xsl;
				xsl = lola.http.getCachedXsl( xslId );
				if ( !xsl ) {
					throw new Error( 'unknown xsl cache id: "' + xslId + '"' );
				}
			}
			else {
				this.xsl = xsl;
			}

			if ( this.xsl && this.xml ) {
				lola.event.addListener( this.xsl, 'result', this.checkStates, true, 0, this );
				lola.event.addListener( this.xsl, 'fault', this.handleXSLFault, true, 0, this );
				lola.event.addListener( this.xml, 'result', this.checkStates, true, 0, this );
				lola.event.addListener( this.xml, 'fault', this.handleXMLFault, true, 0, this );

				this.checkStates();
			}
			else {
				throw new Error( 'transform error!' );
			}

		},

		/**
		 * @description checks the states of both requests to see if the transform can be applied
		 * @private
		 */
		checkStates: function() {
			if ( this.xml.ready && this.xsl.ready ) {
				//cache xsl request if id set
				if (this.xslCacheId && this.xslCacheId != "") {
					lola.http.cacheXsl( this.xslCacheId, this.xsl );
				}

				//both requests are ready, do transform
				this.resultNodes = lola.http.transform( this.xml.responseXML(), this.xsl.responseXML(), this.transformParams );
				lola.event.trigger( this, 'result', true, true, this.resultNodes );
			}
		},

		/**
		 * @description  handles xsl fault
		 * @private
		 */
		handleXSLFault: function() {
			lola.event.trigger( this, 'fault', true, true, 'xsl fault' );
		},

		/**
		 * @description  handles xml fault
		 * @private
		 */
		handleXMLFault: function() {
			lola.event.trigger( this, 'fault', true, true, 'xml fault' );
		},

		/**
		 * @description sends the transform requests if not yet sent
		 * @public
		 */
		load: function() {
			if ( !this.xml.request ) {
				this.xml.send( this.xmlParams );
			}
			if ( !this.xsl.request ){
				this.xsl.send( this.xslParams );
			}
		},

		/**
		 * @description  cancels transform request... aborts requests and removes listeners
		 * @public
		 */
		cancel: function() {
			lola.event.removeListener( this.xsl, 'result', this.checkStates, true );
			lola.event.removeListener( this.xsl, 'fault', this.handleXSLFault, true );
			lola.event.removeListener( this.xml, 'result', this.checkStates, true );
			lola.event.removeListener( this.xml, 'fault', this.handleXMLFault, true );
			try {
				this.xsl.abort();
			}
			catch(e){}
			try {
				this.xml.abort();
			}
			catch(e){}
		},

		/**
		 * @description get the result of the transformation
		 * @public
		 * @return {Array} array of nodes
		 */
		getResultNodes: function(){
			return this.resultNodes;
		}


	};


	//register module
	lola.registerModule( http );

})( lola );
