/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: HTTP
 *  Description: HTTP module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	/**
	 * HTTP Request Module
	 * @namespace lola.http
	 */
    var Module = function(){
        var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "http";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["event","type","string"];

        /**
         * storage for cached xsl requests
         * @private
         */
        var xslCache = {};


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
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * @descripiton applies transformation using results of two requests
         * @public
         * @param {lola.http.Request} xmlDoc
         * @param {lola.http.Request} xslDoc
         * @param {Object} xslParams
         */
        this.transform = function( xmlDoc, xslDoc, xslParams ) {
            var children,k;
            if ( window.ActiveXObject ) {
                //TODO: Test this in IE I've got no clue if it will work or not.
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
        };

        /**
         * caches xsl request
         * @public
         * @param {String} id
         * @param {lola.http.Request} xsl
         */
        this.cacheXsl = function( id, xsl ){
            xslCache[ id ] = xsl;
        };

        /**
         * replaces "<" ">" "&" with "&lt;" "&gt;" "&amp;"
         * @param {String} str
         */
        this.encode = function( str ) {
            if ( typeof str == 'string' ) {
                str = str.replace( /</g, '&lt;' );
                str = str.replace( />/g, '&gt;' );
                str = str.replace( /&/g, '&amp;' );
            }
            return str;
        };

        /**
         * replaces "&lt;" "&gt;" "&amp;" with "<" ">" "&"
         * @param {String} str
         */
        this.unencode = function( str ) {
            if ( typeof str == 'string' ) {
                str = str.replace( /\$lt;/g, '<' );
                str = str.replace( /&gt;/g, '>' );
                str = str.replace( /&amp;/g, '&' );
            }
            return str;
        };


        //==================================================================
        // Selection Methods
        //==================================================================

        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {
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
             * loads a request's content into elements
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
             * loads http content into elements asynchronously
             * @param {String} url
             * @param {*} interimContent
             * @param {*} faultContent
             */
            loadContent: function( url, interimContent, faultContent ){
                var request = new lola.http.AsyncRequest( url, 'get', [] );
                this.applyRequest( request, {}, interimContent, faultContent);
            }
        };


        //==================================================================
        // Classes
        //==================================================================
        /**
         * Base HTTP Request Class
         * @class
         * @private
         * @param {String} u request url
         * @param {String} m request method
         * @param {Array} h request headers
         * @param {Boolean} a execute request asyncronously
         * @param {String} un credentials username
         * @param {String} p credentials password
         */
        var Request = function( url, method, headers, async, user, password ) {
            var parent = self;
            var self = this;
            /**
             * DOM xmlhttprequest
             * @private
             */
            var request = false;

            /**
             * readyFlag
             * @private
             */
            var ready = false;

            /**
             * returns readystate
             * @return {Boolean}
             */
            this.ready = function(){
                return ready;
            };

            /**
             * initializes class
             * @private
             */
            function initialize(){
                method = method || 'POST';
                headers = headers || [];
                async = async == undefined ? true : async;
                user = user || null;
                password = password || null;
            }

            /**
             * gets correct request object
             * @private
             */
            var getRequestObject = function() {
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
            };

            /**
             * send request
             * @public
             * @param {Object|String|undefined} params
             * @return {lola.http.Request}
             */
            this.send = function( params ) {
                request = getRequestObject();
                request.open( method, url, async, user, password );
                request.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
                for ( var i = 0; i < headers.length; i++ ) {
                    try {
                        request.setRequestHeader( headers[i].name, headers[i].value );
                    }
                    catch( e ) {
                    }
                }
                if ( params != undefined ) {
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
                    readyStateChange.call( self )
                };
                request.send( params );

                return request;
            };

            /**
             * ready state change listener
             * @private
             */
            function readyStateChange() {
                if ( request ) {
                    switch ( request.readyState ) {
                        case 0:
                            //uninitialized
                            break;
                        case 1:
                            //loading
                            lola.event.trigger( self, 'loading', true, true, request );
                            break;
                        case 2:
                            //loaded
                            lola.event.trigger( self, 'loaded', true, true, request );
                            break;
                        case 3:
                            //interactive
                            lola.event.trigger( self, 'interactive', true, true, request );
                            break;
                        case 4:
                            //complete
                            lola.event.trigger( self, 'stateComplete', true, true, request );
                            if ( request.status == 200 && !ready ) {
                                ready = true;
                                lola.event.trigger( self, 'result', true, true, request );
                            }
                            else if ( request.status >= 400 ) {
                                console.info( 'AsyncRequest.readyStateChange.fault:', url );
                                lola.event.trigger( self, 'fault', false, false, request );
                            }
                            break;
                    }
                }
            }

            /**
             * get raw response text
             * @return {String}
             */
            this.responseText = function() {
                if ( ready || !async)
                    return request.responseText;
                else
                    return false;
            };

            /**
             * get response xml document
             * @return {XML}
             */
            this.responseXML = function() {
                if ( ready || !async )
                    return request.responseXML;
                else
                    return false;
            };


            initialize();

            return this;
        };

        /**
         * Asynchronous HTTP Request Class Alias
         * @class
         * @param {String} url request url
         * @param {String} method request method
         * @param {Array} headers request headers
         * @param {String} user credentials username
         * @param {String} password credentials password
         * @extends lola.http.Request
         */
        this.AsyncRequest = function( url, method, headers, user, password ) {
            return new Request( url, method, headers, true, user, password );
        };

        /**
         * Synchronous HTTP Request Class Alias
         * @class
         * @param {String} url request url
         * @param {String} method request method
         * @param {Array} headers request headers
         * @param {String} user credentials username
         * @param {String} password credentials password
         * @extends lola.http.Request
         */
        this.SyncRequest = function( url, method, headers, user, password ) {
            return new Request( url, method, headers, false, user, password );
        };

        /**
         * AJAX Transform Class
         * @param {lola.http.Request} xml request object
         * @param {lola.http.Request|String} xsl request object or string id for cached xsl
         * @param {Object} transformParams
         * @param {String|undefined} xslCacheId if set xsl will be cached with the specified id
         */
        this.Transform = function( xml, xsl, transformParams, xslCacheId ) {
            var parent = self;
            var self = this;
            /**
             * holds transformation result
             * @type {Array}
             */
            var resultNodes = [];

            /**
             * result nodes getter
             * @return {Array}
             */
            this.resultNodes = function(){
                return resultNodes;
            };

            /**
             * initializes class
             * @private
             */
            function initialize() {
                xslCacheId = xslCacheId || "";
                if ( lola.type.get( xsl ) == 'string' ) {
                    var xslId = xsl;
                    xsl = parent.getCachedXsl( xslId );
                    if ( !xsl ) {
                        throw new Error( 'unknown xsl cache id: "' + xslId + '"' );
                    }
                }
                else {
                    this.xsl = xsl;
                }

                if ( this.xsl && this.xml ) {
                    lola.event.addListener( this.xsl, 'result', checkStates, true, 0, this );
                    lola.event.addListener( this.xsl, 'fault', handleXSLFault, true, 0, this );
                    lola.event.addListener( this.xml, 'result', checkStates, true, 0, this );
                    lola.event.addListener( this.xml, 'fault', handleXMLFault, true, 0, this );

                    checkStates();
                }
                else {
                    throw new Error( 'transform error!' );
                }
            }

            /**
             * checks the states of both requests to see if the transform can be applied
             * @private
             */
            function checkStates() {
                if ( xml.ready() && xsl.ready() ) {
                    //cache xsl request if id set
                    if (xslCacheId && xslCacheId != "") {
                        parent.cacheXsl( xslCacheId, xsl );
                    }

                    //both requests are ready, do transform
                    resultNodes = parent.transform( xml.responseXML(), xsl.responseXML(), transformParams );
                    lola.event.trigger( self, 'result', true, true, resultNodes );
                }
            }

            /**
             *  handles xsl fault
             * @private
             */
            function handleXSLFault() {
                lola.event.trigger( self, 'fault', true, true, 'xsl fault' );
            }

            /**
             *  handles xml fault
             * @private
             */
            function handleXMLFault() {
                lola.event.trigger( self, 'fault', true, true, 'xml fault' );
            }

            /**
             * sends the transform requests if not yet sent
             * @public
             */
            this.send = function( xmlParams, xslParams ) {
                if ( !xml.ready() ) {
                    xml.send( xmlParams );
                }
                if ( !xsl.ready() ){
                    xsl.send( xslParams );
                }
            };

            /**
             *  cancels transform request... aborts requests and removes listeners
             * @public
             */
            this.cancel = function() {
                lola.event.removeListener( xsl, 'result', checkStates, true );
                lola.event.removeListener( xsl, 'fault', handleXSLFault, true );
                lola.event.removeListener( xml, 'result', checkStates, true );
                lola.event.removeListener( xml, 'fault', handleXMLFault, true );
                try {
                    xsl.abort();
                }
                catch(e){}
                try {
                    xml.abort();
                }
                catch(e){}
            };

            initialize();

            return this;
        };

    };


	//register module
	lola.registerModule( new Module() );

})( lola );
