/***********************************************************************
 * Lola JavaScript Framework
 *
 *  Description: Base Construct Head
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
( function( window ) {

    /**
     * @namespace lola
     * @description: Lola Framework core is used to load modules and for top-level framework attributes and methods
     * @param {String} selector selector string
     * @param {Object|undefined} context for selection
     * @return {lola.Selector}
     */
    var lola = function( selector, context ){
        return new lola.Selector( selector, context );
    };

    /**
     * window reference
     */
    lola.window = window;

    /**
     * extends the target with properties from the source
     * @public
     * @param target {Object}
     * @param source {Object}
     * @param overwrite {Boolean|undefined}
     * @param errors {Boolean|undefined}
     * @param deep {Boolean|undefined}
     * @return {void}
     */
    lola.extend = function( target, source, overwrite, errors, deep ) {
        //TODO: make deep copy an option
        if ( overwrite == undefined ) overwrite = false;
        if ( errors == undefined ) errors = false;
        if ( deep == undefined ) deep = false;
        for ( var k in source ) {
            if ( overwrite || target[ k ] == null )
                target[ k ] = source[ k ];
            else if ( errors )
                throw new Error( "property " + k + " already exists on extend target!" );
        }
    };

    /**
     * creates/gets and returns the object lineage defined in chain param
     * @public
     * @param {!Object} base object on which to build chain
     * @param {!String} chain "." seperated namespace / package
     * @return {Object}
     */
    lola.getPackage = function( base, chain ) {
        //lola.debug('lola::getPackage');
        var result = base;
        if ( typeof chain === 'string' ) {
            var parts = chain.split( '.' );
            var part;
            while ( part = parts.shift() ) {
                if ( result[part] == null  )
                    result[part] = {};
                result = result[part];
            }
        }
        return result;
    };

    /**
     * registers a module with the Lola Framework
     * @public
     * @param {lola.Module} module
     * @return {void}
     */
    lola.registerModule = function( module ) {
        var namespace = module.getNamespace();

        //add module to namespace
        lola.extend( lola.getPackage( lola, namespace ), module, false, false );

        //add module dependencies
        if (this.hasFn( module, "getDependencies" )){
            lola.addDependencies( namespace, module.getDependencies() );
        }

        //add selector methods
        if ( module[ "selectorMethods" ] ){
            lola.extend( lola.Selector.prototype, module[ "selectorMethods" ], false, false );
            delete module[ "selectorMethods" ];
        }

        //add initializer
        if ( lola.hasFn( module, "initialize" ) ) {
            lola.addInitializer( module.initialize );
        }

        lola.debug('module registered:', namespace );

    };

    /**
     * framework initialization method (self deleting)
     */
    lola.initialize = function(){
        //remove auto initialization listeners
        if ( document.addEventListener ) {
            document.removeEventListener( "DOMContentLoaded", lola.initialize, false );
            lola.window.removeEventListener( "load", lola.initialize, false );
        }
        else if ( document.attachEvent ) {
            document.detachEvent( "onreadystatechange", lola.initialize );
            lola.window.detachEvent( "onload", lola.initialize );
        }

        //check dependencies
        lola.checkDependencies();

        //execute initialization stack
        lola.executeInitializers();

        delete lola['initialize'];
    };

    window['lola'] = lola;
    window['$'] = lola;

})(window);