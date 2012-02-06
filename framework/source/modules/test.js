/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Test
 *  Description: test module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    /**
     * Test Module
     * @namespace lola.test
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
        var namespace = "test";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];

        /**
         * source for tests
         * @private
         */
        var src = "tests.xml";

        /**
         * current executable index
         * @private
         */
        var index = -1;

        /**
         * executables
         * @private
         */
        var executables = [];

        /**
         * current executable
         * @private
         */
        var current = null;

        /**
         * function used to output test results
         * @private
         */
        var logFn = function(){
            console.log( [].splice.call(arguments,0).join(' ') );
        };
        var errorFn = function(){
            console.error( [].splice.call(arguments,0).join(' ') );
        };

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

        /**
         * sets the output function
         * @param {Function} fn
         */
        this.setLogFn = function( fn ){
            logFn = fn;
        };
        /**
         * sets the output function
         * @param {Function} fn
         */
        this.setErrorFn = function( fn ){
            errorFn = fn;
        };

        /**
         * sets the test source
         * @param {String} source
         */
        this.setSource = function( source ){
            src = source;
        };

        /**
         * gets the current executeable
         */
        this.current = function(){
            return current;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * load and run all tests
         */
        this.start = function(){
            //load test source
            executables = [];
            logFn('lola.test.run: '+src);
            loadExternalXML( src );
            index = -1;
            next();
            return "";
        };

        /**
         * loads external test xml source
         * @param source
         */
        function loadExternalXML( source ){

            var req = new lola.http.SyncRequest( source );
            req.send();
            var xml = req.responseXML();
            var list = [];

            //parse test source
            if (xml.documentElement.tagName == "tests"){
                var root = xml.documentElement;
                var count = root.childNodes.length;
                for ( var i = 0; i < count; i++ ){
                    var n = root.childNodes[i];
                    //logFn( n.nodeType, n.nodeName.toLowerCase() );
                    if ( n.nodeType == 1){
                        switch( n.nodeName.toLowerCase() ){
                            case 'script':
                                //this is a setup or teardown script
                                var script = new Script(n);
                                list.push( script );
                                break;
                            case 'test':
                                //this is a test
                                var t = new Test(n);
                                list.push( t );
                                break;
                            case 'xml':
                                //this is a test
                                var x = new ExternalXML(n);
                                list.push( x );
                                break;
                        }
                    }
                }
            }
            list.unshift( 0 );
            list.unshift( index + 1 );

            executables.splice.apply(executables, list );
        }

        /**
         * run next executable
         */
        function next(){
            index++;
            //logFn( test.index, '/', test.executables.length );
            if ( index < executables.length ){
                var executable = executables[ index ];
                current = executable;
                var completed = executable.execute();
                if (completed){
                    setTimeout( function(){ next();}, 2);
                }
            }
            else {
                complete();
            }
        }


        /**
         * called when all groups have executed
         * @private
         */
        function complete(){
            console.log('lola.test.complete');

        }

        //==================================================================
        // Classes
        //==================================================================
        /**
         * @private
         * @class
         * @param {Node} node
         */
        function Script( node ){
            var name = "";
            var value = "";

            this.execute = function(){
                logFn('executing', '"'+name+'"', 'script');
                //try {
                lola.evaluate( value );
                //}
                //catch( e ){
                //   errorFn('error evaluating', name, 'script:', e.message );
                //}

                return true;
            };

            if ((node.hasAttribute('name')))
                name = node.attributes.getNamedItem("name").nodeValue;

            var str = "";
            for( var i = 0; i<node.childNodes.length; i++){
                str += node.childNodes[i].data;
            }
            value = str;

            return this;
        }

        /**
         * @private
         * @class
         * @param {Node} node
         */
        function Test( node ){
            var name;
            var result;
            var assert = "==";
            var compareTo;
            var test;
            var async = false;
            var passed;
            var error = "";

            this.execute = function(){
                logFn( name );
                try {
                    if ( async ){
                        lola.evaluate( test );
                        return false;
                    }
                    else {
                        result = eval( test );
                        compare();
                        return true;
                    }
                }
                catch( e ){
                    passed = false;
                    error = 'failed due to error: '+e.message;
                    errorFn( '    ', error );
                    logFn ( '    ', e );
                    return true;
                }
            };

            this.setResult = function( val ){
                result = val;
                compare();
                next();
            };

            function compare(){
                switch (assert){
                    case "equals":
                        passed = result == compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" == "+compareTo;
                        break;
                    case "strictlyEquals":
                        passed = result === compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" === "+compareTo;
                        break;
                    case "doesNotEqual":
                        passed = result != compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" != "+compareTo;
                        break;
                    case "greaterThan":
                        passed = result > compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" > "+compareTo;
                        break;
                    case "lessThan":
                        passed = result < compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" < "+compareTo;
                        break;
                    case "greaterThanOrEquals":
                        passed = result >= compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" >= "+compareTo;
                        break;
                    case "lessThanOrEquals":
                        passed = result <= compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" <= "+compareTo;
                        break;
                    default:
                        passed = result == compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" == "+compareTo;
                        break;
                }

                if (passed) {
                    //logFn( '    ','passed');
                }
                else {
                    error = 'failed, '+error;
                    errorFn( '    ', error );
                }
            }

            function init( node ){

                name = node.attributes.getNamedItem("name").nodeValue;

                if (node.hasAttribute('async'))
                    async = node.attributes.getNamedItem("async").nodeValue == "true";

                if (node.hasAttribute('equals')){
                    assert = "equals";
                }
                else if (node.hasAttribute('strictlyEquals')){
                    assert = "strictlyEquals";
                }
                else if (node.hasAttribute('doesNotEqual')){
                    assert = "doesNotEqual";
                }
                else if (node.hasAttribute('greaterThan')){
                    assert = "greaterThan";
                }
                else if (node.hasAttribute('lessThan')){
                    assert = "lessThan";
                }
                else if (node.hasAttribute('greaterThanOrEquals')){
                    assert = "greaterThanOrEquals";
                }
                else if (node.hasAttribute('lessThanOrEquals')){
                    assert = "lessThanOrEquals";
                }

                var rawValue = node.attributes.getNamedItem( assert ).nodeValue;
                var type = node.attributes.getNamedItem("type").nodeValue;
                switch ( type ){
                    case "float":
                        compareTo = parseFloat( rawValue );
                        break;
                    case "int":
                        compareTo = parseInt( rawValue );
                        break;
                    case "bool":
                        compareTo = rawValue === "true";
                        break;
                    default:
                        compareTo = String( rawValue );
                        break;
                }

                var str = "";
                for( var i = 0; i<node.childNodes.length; i++){
                    str += node.childNodes[i].data;
                }
                test = str;
            }
            init(node);
            return this;
        }

        /**
         * @private
         * @class
         * @param {Node} node
         */
        function ExternalXML( node ){
            var source;

            if ((node.hasAttribute('src')))
                source = node.attributes.getNamedItem("src").nodeValue;

            this.execute = function(){
                logFn('================================================\nsource\n================================================');
                if (source){
                    loadExternalXML( source );
                }
                return true;
            };

        }

    };


    //register module
    lola.registerModule( new Module() );

})( lola );

