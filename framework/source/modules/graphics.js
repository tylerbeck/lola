/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Graphics
 *  Description: Graphics module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    /**
     * Graphics Module
     * @namespace lola.graphics
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
        var namespace = "graphics";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['util'];

        /**
         * default context
         * @private
         */
        var context = null;

        /**
         *  context map
         * @private
         */
        var map = {};

        /**
         *  context reset object
         * @private
         */
        var reset = {};

        /**
         *  style map
         * @private
         */
        var styles = {};

        /**
         * routine map
         * @private
         */
        var routines = {};



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
         * maps context of specified canvas
         * @param {Element} canvas
         * @param {String|undefined} id
         */
        this.registerContext = function( canvas, id ){
            var ctx = canvas.getContext('2d');
            id = (id==undefined)?lola(canvas).identify().attr('id'):id;
            var gdata = $(canvas).getData( "_"+namespace, true );
            if (gdata.contexts == null)
                gdata.contexts = [];
            gdata.contexts.push( id );

            map[ id ] = ctx;
        };

        /**
         * unmaps  context for specified canvas
         * @param canvas
         */
        this.removeContext = function( canvas ){
            var gdata = lola(canvas).getData( "_"+namespace, false );
            if (gdata && gdata.contexts) {
                var id;
                while ( id = gdata.contexts.pop() ){
                    delete map[ id ];
                }
            }
        };

        /**
         * get a mapped context
         * @param {String} id
         * @return {Object}
         */
        this.getContext = function(id) {
            return map[id];
        };

        /**
         * resolves string to context
         * if a context is passed the same context is returned.
         * if nothing is found the current default context is returned
         * @param {Object|String|undefined} ctx
         */
        function resolveContext( ctx ) {
            if (typeof ctx === "string")
                ctx = self.getContext( ctx );

            return ctx || context;
        }

        /**
         * @descrtiption sets the current default context
         * @param {Object|String} ctx
         */
        this.setContext = function( ctx ) {
            context = resolveContext( ctx );
        };

        /**
         * returns a context to its original state
         * @param {Object|String|undefined} ctx
         */
        this.resetContext = function( ctx ) {
            if (typeof ctx == "string")
                context = resolveContext(ctx);

            if (context) lola.util.copyPrimitives( reset, context );
        };

        /**
         * copies properties of styleObject into style cache with given name
         * @param {String} name
         * @param {Object} styleObj
         */
        this.registerStyle = function( name, styleObj ) {
            var obj = {};
            lola.util.copyPrimitives( styleObj, obj );
            styles[ name ] = obj;
        };

        /**
         * removes style with specified name
         * @param {String} name
         */
        this.removeStyle = function(  name ) {
            delete styles[ name ];
        };

        /**
         * registers a repeatable drawing routine
         * @param {String} name
         * @param {Function} fnc function that accepts ctx to draw
         */
        this.registerRoutine = function( name, fnc ) {
            routines[ name ] = fnc;
        };

        /**
         * removes routine with specified name
         * @param {String} name
         */
        this.removeRoutine = function(  name ) {
            delete this.routines[ name ];
        };

        /**
         * execute a drawing routine
         * @param {String} name
         */
        this.executeRoutine = function( name ) {
            if ( lola.hasFn(routines,name) ){
                routines[name]( context );
            }
        };

        /**
         * copies properties of styleObject into style cache with given name
         * @param {Object|String} style
         * @param {Object|String} ctx
         */
        this.applyStyle = function( style, ctx ) {
            ctx = resolveContext( ctx );
            var sty = (typeof style == "string") ?  styles[ style ] || reset : style;
            lola.util.copyPrimitives( reset, ctx );
            lola.util.copyPrimitives( sty, ctx );
        };

        /**
         * draws drawable objects in current context
         * @param {Object|Array} objects
         */
        this.draw = function( object, flags ){
            if ( lola.hasFn( object, 'draw')){
                object.draw( context, flags );
            }
        };

        /**
         * clears a context
         * @param ctx
         */
        this.clear = function( ctx ){
            ctx = resolveContext( ctx );
            ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
        };

        function copyContextMethod( prop ){
            self[ prop ] = function(){
                context[prop].apply( context, arguments );
            }
        }
        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {
            registerContext: function(){
                this.forEach( function(item){
                    lola.graphics.registerContext( item );
                });

                return this;
            }
        };


        //==================================================================
        // Preinitialization
        //==================================================================
        lola.addSafeDeleteHook( self.removeContext, self );

        //get reset context
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        for ( var prop in ctx ){
            if ( lola.type.isPrimitive( ctx[ prop ] ) ){
                reset[ prop ] = ctx[ prop ];
            }
            else if (lola.type.get( ctx[prop] ) == 'function'){
                copyContextMethod( prop );
            }
        }

    };

	//register module
	lola.registerModule( new Module() );

})( lola );
