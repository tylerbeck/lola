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
            console.log('lola.test.run: '+src);
            var req = new lola.http.SyncRequest( src );
            req.send();
            var xml = req.responseXML();
            executables = [];

            //parse test source
            if (xml.documentElement.tagName == "tests"){
                var root = xml.documentElement;
                var count = root.childNodes.length;
                for ( var i = 0; i < count; i++ ){
                    var n = root.childNodes[i];
                    //console.log( n.nodeType, n.nodeName.toLowerCase() );
                    if ( n.nodeType == 1){
                        switch( n.nodeName.toLowerCase() ){
                            case 'script':
                                //this is a setup or teardown script
                                var script = new Script(n);
                                executables.push( script );
                                break;
                            case 'test':
                                //this is a test
                                var t = new Test(n);
                                executables.push( t );
                                break;
                        }
                    }
                }
            }
            index = -1;
            next();
        };

        /**
         * run next executable
         */
        function next(){
            index++;
            //console.log( test.index, '/', test.executables.length );
            if ( index < executables.length ){
                var executable = executables[ index ];
                current = executable;
                var completed = executable.execute();
                if (completed){
                    setTimeout( function(){ next();}, 10);
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
         * @param {Node} node
         */
        function Script( node ){
            return this.init(node);
        }
        Script.prototype = {
            name: "",
            value: "",

            init: function( node ){
                if ((node.hasAttribute('name')))
                    this.name = node.attributes.getNamedItem("name").nodeValue;

                var str = "";
                for( var i = 0; i<node.childNodes.length; i++){
                    str += node.childNodes[i].data;
                }
                this.value = str;

                return this;
            },

            execute: function(){
                console.log('executing', '"'+this.name+'"', 'script');
                //try {
                lola.evaluate( this.value );
                //}
                //catch( e ){
                //   console.error('error evaluating', this.name, 'script:', e.message );
                //}

                return true;
            }
        };

        /**
         * @private
         * @param {Node} node
         */
        function Test( node ){
            return this.init(node);
        }
        Test.prototype = {
            name: undefined,
            result: undefined,
            assert: "==",
            compareTo: undefined,
            test: undefined,
            async: false,
            passed: undefined,
            error: "",

            init: function( node ){

                this.name = node.attributes.getNamedItem("name").nodeValue;

                if (node.hasAttribute('async'))
                    this.async = node.attributes.getNamedItem("async").nodeValue == "true";

                if (node.hasAttribute('equals')){
                    this.assert = "equals";
                }
                else if (node.hasAttribute('strictlyEquals')){
                    this.assert = "strictlyEquals";
                }
                else if (node.hasAttribute('doesNotEqual')){
                    this.assert = "doesNotEqual";
                }
                else if (node.hasAttribute('greaterThan')){
                    this.assert = "greaterThan";
                }
                else if (node.hasAttribute('lessThan')){
                    this.assert = "lessThan";
                }
                else if (node.hasAttribute('greaterThanOrEquals')){
                    this.assert = "greaterThanOrEquals";
                }
                else if (node.hasAttribute('lessThanOrEquals')){
                    this.assert = "lessThanOrEquals";
                }

                var rawValue = node.attributes.getNamedItem( this.assert ).nodeValue;
                var type = node.attributes.getNamedItem("type").nodeValue;
                switch ( type ){
                    case "float":
                        this.compareTo = parseFloat( rawValue );
                        break;
                    case "int":
                        this.compareTo = parseInt( rawValue );
                        break;
                    case "bool":
                        this.compareTo = rawValue === "true";
                        break;
                    default:
                        this.compareTo = String( rawValue );
                        break;
                }

                var str = "";
                for( var i = 0; i<node.childNodes.length; i++){
                    str += node.childNodes[i].data;
                }
                this.test = str;

                return this;
            },

            execute: function(){
                console.log( this.name );
                try {
                    if ( this.async ){
                        lola.evaluate( this.test );
                        return false;
                    }
                    else {
                        this.result = eval( this.test );
                        this.compare();
                        return true;
                    }
                }
                catch( e ){
                    this.passed = false;
                    this.error = 'failed due to error: '+e.message;
                    console.error( '    ', this.error );
                    console.log ( '    ', e );
                    return true;
                }
            },

            setResult: function( val ){
                this.result = val;
                this.compare();
                next();
            },

            compare:function(){
                switch (this.assert){
                    case "equals":
                        this.passed = this.result == this.compareTo;
                        if (!this.passed)
                            this.error = "assertion false: "+this.result+" == "+this.compareTo;
                        break;
                    case "strictlyEquals":
                        this.passed = this.result === this.compareTo;
                        if (!this.passed)
                            this.error = "assertion false: "+this.result+" === "+this.compareTo;
                        break;
                    case "doesNotEqual":
                        this.passed = this.result != this.compareTo;
                        if (!this.passed)
                            this.error = "assertion false: "+this.result+" != "+this.compareTo;
                        break;
                    case "greaterThan":
                        this.passed = this.result > this.compareTo;
                        if (!this.passed)
                            this.error = "assertion false: "+this.result+" > "+this.compareTo;
                        break;
                    case "lessThan":
                        this.passed = this.result < this.compareTo;
                        if (!this.passed)
                            this.error = "assertion false: "+this.result+" < "+this.compareTo;
                        break;
                    case "greaterThanOrEquals":
                        this.passed = this.result >= this.compareTo;
                        if (!this.passed)
                            this.error = "assertion false: "+this.result+" >= "+this.compareTo;
                        break;
                    case "lessThanOrEquals":
                        this.passed = this.result <= this.compareTo;
                        if (!this.passed)
                            this.error = "assertion false: "+this.result+" <= "+this.compareTo;
                        break;
                    default:
                        this.passed = this.result == this.compareTo;
                        if (!this.passed)
                            this.error = "assertion false: "+this.result+" == "+this.compareTo;
                        break;
                }

                if (this.passed) {
                    //console.log( '    ','passed');
                }
                else {
                    this.error = 'failed, '+this.error;
                    console.error( '    ', this.error );
                }
            }
        };
    };


    //register module
    lola.registerModule( new Module() );

})( lola );

