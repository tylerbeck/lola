/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: AJAX
 *  Description: ajax module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "ajax",

		//module dependencies
		dependencies: ['xhr'],

		//initialization flag
		initialized: false,

		//xsl cache
		xslCache: {},


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.ajax.initialized ) {
				//console.info('lola.async.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				//request class
				var Transform = function( url, method, headers, async, user, password ) {
					return this.init( url, method, headers, async, user, password );
				};
				Transform.prototype = lola.ajax.TransformPrototype;
				lola.setProperty( lola, "xhr", 'Transform', Transform );

				lola.ajax.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// caches xsl request
		//------------------------------------------------------------------
		cacheXSL: function( name, xsl ) {
			lola.ajax.xslCache[ name ] = xsl;
		},

		//------------------------------------------------------------------
		// performs transform
		//------------------------------------------------------------------
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





		//==================================================================
		// TransformPrototype
		//==================================================================
		TransformPrototype: {
			xsl: null,
			xslParams: null,
			xml: null,
			init: function( xsl, xml, xslParams ) {
				this.xslParams = xslParams;
				var xslr;
				if ( lola.type.get( xsl ) == 'string' ) {
					xslr = lola.ajax.xslCache[ xsl ];
					if ( !xslr )
						throw new Error( 'unknown xsl: "' + xsl + '"' );
				}
				else {
					xslr = xsl
				}

				if ( xslr && xml ) {
					//add listeners
					lola.event.addListener( xslr, 'result', this.checkStates );
					lola.event.addListener( xslr, 'fault', this.handleXSLFault );
					lola.event.addListener( xml, 'result', this.checkStates );
					lola.event.addListener( xml, 'fault', this.handleXMLFault );

					this.checkStates();
				}

			},

			checkStates: function() {
				if ( this.xml.ready && this.xsl.ready ) {
					//both requests are ready, do transform
					var result = lola.ajax.transform( this.xml.responseXML(), this.xsl.responseXML(), this.xslParams );
					lola.event.trigger( this, 'result', true, true, result );
				}
			},

			handleXSLFault: function() {
				lola.event.trigger( this, 'fault', true, true, 'xsl fault' );
			},

			handleXMLFault: function() {
				lola.event.trigger( this, 'fault', true, true, 'xml fault' );
			},

			cancel: function() {
				lola.event.removeListener( xslr, 'result', this.checkStates );
				lola.event.removeListener( xslr, 'fault', this.handleXSLFault );
				lola.event.removeListener( xml, 'result', this.checkStates );
				lola.event.removeListener( xml, 'fault', this.handleXMLFault );
			}


		},


		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			applyTransform: function( transform, interimContent, faultContent ) {
				var element = this.get();
				$( element ).html( interimContent );
				lola.event.addListener( transform, 'result', function( event ) {
					$( element ).html( event.data );
				} );
				lola.event.addListener( transform, 'fault', function( event ) {
					$( element ).html( faultContent );
				} );

			}
		}



	};
	lola.registerModule( Module );
})( lola );
