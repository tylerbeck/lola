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
        current: null,

        //==================================================================
        // Methods
        //==================================================================

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
            test.executables = [];

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
                                var script = new test.Script(n);
                                test.executables.push( script );
                                break;
                            case 'test':
                                //this is a test
                                var t = new test.Test(n);
                                test.executables.push( t );
                                break;
                        }
                    }
                }
            }
            test.index = -1;
            test.next();
        },

        /**
         * run next executable
         */
        next: function(){
            test.index++;
            //console.log( test.index, '/', test.executables.length );
            if ( test.index < test.executables.length ){
                var executable = test.executables[ test.index ];
                lola.test.current = executable;
                var completed = executable.execute();
                if (completed){
                    setTimeout( function(){ test.next();}, 10);
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
    test.Script.prototype = {
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

    test.Test.prototype = {
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
            lola.test.next();
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


    //register module
    lola.registerModule( test );

})( lola );

