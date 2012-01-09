/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Test
 *  Description: test module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    var $ = lola;
    /**
     * Test Module
     * @implements {lola.Module}
     * @memberof lola
     */
    var test = {

        //==================================================================
        // Attributes
        //==================================================================
        src: "tests.xml",
        index: -1,
        executables: [],

        //==================================================================
        // Methods
        //==================================================================
        /**
         * preinitializes module
         * @private
         * @return {void}
         */
        preinitialize: function() {
            lola.debug('lola.test::preinitialize');
            if ( !lola ) throw new Error( 'lola not defined!' );

            //do module preinitialization



            //remove initialization method
            delete lola.test.preinitialize;
        },

        /**
         * initializes module
         * @public
         * @return {void}
         */
        initialize: function() {
            lola.debug('lola.test::initialize');
            //this framework is dependent on lola framework
            if ( !lola ) throw new Error( 'lola not defined!' );

            //do module initialization



            //remove initialization method
            delete lola.test.initialize;
        },

        /**
         * get module's namespace
         * @public
         * @return {String}
         */
        getNamespace: function() {
            return "test";
        },

        /**
         * get module's dependencies
         * @public
         * @return {Array}
         * @default []
         */
        getDependencies: function() {
            return [];
        },

        /**
         * sets the test source
         * @param {String} src
         */
        setSource: function( src ){
            test.src = src;
        },

        /**
         * load all tests
         */
        start: function(){
            //load test source
            console.log('lola.test.run: '+test.src);
            var req = new lola.http.SyncRequest( test.src );
            req.load();
            var xml = req.responseXML();
            this.executables = [];

            //parse test source
            if (xml.documentElement.tagName == "tests"){
                var root = xml.documentElement;
                var count = root.childNodes.length;
                for ( var i = 0; i < count; i++ ){
                    var n = root.childNodes[i];
                    if ( n.nodeType == 1){
                        switch( n.nodeName.toLowerCase() ){
                            case 'script':
                                //this is a setup or teardown script
                                this.executables.push( new test.Script(n) );
                                break;
                            case 'test':
                                //this is a test
                                this.executables.push( new test.Test(n) );
                                break;
                        }
                    }
                }
            }

            test.next();
        },

        next: function(){
            test.index++;
            if ( test.index < test.executables.length ){
                var executable = test.executables[ test.index ];
                var completed = executable.execute();
                if (completed){
                    setTimeout( function(){test.next();}, 5);
                }
            }
            else {
                test.complete();
            }
        },

        /**
         * called when all groups have executed
         * @private
         */
        complete: function(){
            console.log('lola.test.complete');
        },

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

            };

            return methods;

        },


        //==================================================================
        // Classes
        //==================================================================
        /**
         * @private
         * @param {Node} node
         */
        Script: function( node ){
            return this.init(node);
        },

        /**
         * @private
         * @param {Node} node
         */
        Test: function( node ){
            return this.init(node);
        }

    };

    //==================================================================
    // Class Prototypes
    //==================================================================
    test.Group1.prototype = {
        init: function( xml ){
            this.name = xml.attributes.getNamedItem("name").nodeValue;

            var nStr = function( node ){
                var str = "";
                for( var i = 0; i<node.childNodes.length; i++){
                    str += node.childNodes[i].data;
                }
                str += "";
                return str;
                //return (eval( str ));
            };

            //get setup & teardown
            if ( xml.getElementsByTagName('setup').length > 0 )
                this.setup = nStr( xml.getElementsByTagName('setup')[0] );
            if ( xml.getElementsByTagName('teardown').length > 0 )
                this.teardown = nStr( xml.getElementsByTagName('teardown')[0] );

            //get tests
            this.tests = [];
            var testNodes = xml.getElementsByTagName('test');
            if (testNodes.length > 0){
                for (var n=0; n<testNodes.length; n++){
                    var t = new test.Test( testNodes[n] );
                    this.tests.push( t );
                }
            }

        },
        tests: [],
        index: 0,
        name: "",
        setup: "",
        teardown: "",
        completeCallback: undefined,
        execute: function( callback ){
            this.completeCallback = callback;
            console.log('executing group "'+this.name+'"' );
            console.log('    ','begin setup' );
            lola.evaluate( this.setup );
            console.log('    ','setup complete' );
            this.index = -1;
            this.runNextTest();
        },
        continueTests: function(){
            this.runNextTest()
        },
        runNextTest: function(){
            this.index++;
            if (this.index < this.tests.length){
                var th = this;
                var test = this.tests[ this.index ];
                var next = test.execute( function(){th.continueTests();} );
                if (next)
                    setTimeout( function(){ th.runNextTest(); }, 5 );
            }
            else{
                console.log('    ','begin teardown' );
                lola.evaluate( this.teardown );
                console.log('    ','teardown complete' );
                this.completeCallback();
            }
        }
    };

    test.Test1.prototype = {
        init: function( xml ){
            this.name = xml.attributes.getNamedItem("name").nodeValue;
            this.async = xml.attributes.getNamedItem("async").nodeValue == "true";
            var type = xml.attributes.getNamedItem("type").nodeValue;
            var raw = xml.attributes.getNamedItem("expected").nodeValue;
            switch ( type ){
                case "float":
                    this.expected = parseFloat( raw );
                    break;
                case "int":
                    this.expected = parseInt( raw );
                    break;
                case "bool":
                    this.expected = raw === "true";
                    break;
                default:
                    this.expected = String( raw );
                    break;
            }

            var str = "";
            for( var i = 0; i<xml.childNodes.length; i++){
                str += xml.childNodes[i].data;
            }
            this.test = str;

            return this;
        },
        name: "",
        test: "(function(){ return true; })();",
        expected: true,
        actual: undefined,
        passed: false,
        errorMsg: "",
        async: false,
        execute: function( callback ){
            console.log('    executing test:', this.name);
            try{
                this.actual = eval(this.test);
                if (this.actual === this.expected){
                    this.passed = true;
                    console.log('    ','passed');
                }
                else{
                    this.passed = false;
                    this.errorMsg = "Expected: "+(typeof this.expected)+" "+String(this.expected)+" Actual: "+(typeof this.actual)+" "+String(this.actual);
                    console.error('    ', 'failed', this.errorMsg);
               }
            }
            catch(e){
                console.error('error:', e.message);
                this.errorMsg = "Error: "+e.message;
            }

            return !this.async;
        }

    };





    //register module
    lola.registerModule( test );

})( lola );

