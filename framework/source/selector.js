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
        if ( typeof selector === "string" ){
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
        else if ( Array.isArray( selector ) ) {
            var sl = selector.length;
            for (i=0; i<sl; i++){
                this[i] = sl[i];
            }
        }
        else {
            this[i] = selector;
            i++;
        }
        this.length = i;

        return this;
    };
    lola.Selector.prototype = Array.prototype;
})(lola);

