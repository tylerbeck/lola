/***********************************************************************
 * Lola JavaScript Framework
 *
 *  Description: Selector Constructor
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function(lola){
    /**
     * Selector class
     * @class
     * @param {*} selector
     * @param {Node|Element|Object} context
     */
    lola.Selector = function( selector, context ){
        var i = 0;
        if ( Array.isArray( selector ) ) {
            var sl = selector.length;
            for (i=0; i<sl; i++){
                this[i] = sl[i];
            }
        }
        else if ( typeof selector === 'object' ){
            this[i] = selector;
            i++;
        }
        else if ( typeof selector === "string" ){
            if (window['Sizzle']) {
                var siz = Sizzle( selector, context );
                for (i=0; i<sl; i++){
                    this[i] = siz[i];
                }
            }
            else {
                try {
                    if (!context)
                        context = document;
                    //TODO Optimize: this can be made faster in most browsers
                    var nodeList =  context.querySelectorAll( selector );
                    var nl = nodeList.length;
                    for (i=0; i<nl; i++){
                        this[i] = nodeList.item(i);
                    }
                    this.length = i;
                }
                catch (e){
                    console.warn('Exception:', selector );
                }
            }
        }
        else if (typeof selector == "function") {
           lola.addInitializer( selector );
        }
        this.length = i;

        return this;
    };
    lola.Selector.prototype = {};
    lola.Selector.prototype.forEach = Array.prototype.forEach;
    //lola.Selector.prototype.concat = Array.prototype.concat;
    lola.Selector.prototype.every = Array.prototype.every;
    lola.Selector.prototype.filter = Array.prototype.filter;
    lola.Selector.prototype.indexOf = Array.prototype.indexOf;
    lola.Selector.prototype.join = Array.prototype.join;
    lola.Selector.prototype.lastIndexOf = Array.prototype.lastIndexOf;
    lola.Selector.prototype.map = Array.prototype.map;
    lola.Selector.prototype.push = Array.prototype.push;
    lola.Selector.prototype.pop = Array.prototype.pop;
    lola.Selector.prototype.shift = Array.prototype.shift;
    lola.Selector.prototype.unshift = Array.prototype.unshift;
    lola.Selector.prototype.slice = Array.prototype.slice;
    lola.Selector.prototype.splice = Array.prototype.splice;
    lola.Selector.prototype.reverse = Array.prototype.reverse;
})(lola);

