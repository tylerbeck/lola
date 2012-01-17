/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Chart
 *  Description: Chart module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function (lola) {
    /**
     * Chart Module
     * @namespace lola.chart
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
        var namespace = "chart";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['graphics'];


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

        //==================================================================
        // Classes
        //==================================================================
        this.Grid = function(x,y,width,height,spacing,flags){

            function init(x,y,width,height,spacing,flags){
                x = x || 0;
                y = y || 0;
                width = width || 100;
                height = height || 100;
                spacing = spacing || 10;
                flags = (flags==undefined)?3:flags;
            }

            this.draw = function( ctx, flgs ){
                flgs = flgs == undefined ? flags : flgs;

                var i;
                //vertical
                if (flgs & self.Grid.VERTICAL){
                    for (i=x+spacing; i<=width+x; i+=spacing){
                        ctx.beginPath();
                        ctx.moveTo(i,y);
                        ctx.lineTo(i,y+height);
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
                //horizontal
                if (flgs & self.Grid.HORIZONTAL){
                    for (i=y+spacing; i<=height+y; i+=spacing){
                        ctx.beginPath();
                        ctx.moveTo(x,i);
                        ctx.lineTo(x+width,i);
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
            };

            init(x,y,width,height,spacing,flags);

            return this;
        };
        this.Grid.HORIZONTAL = 0x1;
        this.Grid.VERTICAL = 0x2;


        this.Axis =function(x,y,size,label,labelOffset,flags ){
            function init(x,y,size,label,labelOffset,flags){
                x = x || 0;
                y = y || 0;
                size = size || 100;
                label = label;
                if( labelOffset ) labelOffset = labelOffset;
                flags = (flags==undefined)?0x2:flags;
            }

            this.draw = function( ctx, flgs ){
                flgs = flgs == undefined ? flags : flgs;
                ctx.beginPath();
                ctx.moveTo( x, y );
                if (flgs & self.Axis.VERTICAL){
                    //vertical axis
                    ctx.lineTo( x, y+size );
                }
                else {
                    //horizontal axis
                    ctx.lineTo( x+size, y );
                }
                ctx.stroke();
                ctx.closePath();

                if (label) {
                    if (flgs & self.Axis.VERTICAL) {
                        //label at bottom
                        ctx.textAlign = "center";
                        ctx.fillText( label, x + labelOffset.x, y + size + labelOffset.y );
                    }
                    else {
                        ctx.textAlign = "right";
                        ctx.fillText( label, x + labelOffset.x, y + labelOffset.y );
                    }
                }
            };


            init(x,y,size,label,labelOffset,flags);
            return this;
        };
        this.Axis.VERTICAL = 0x1;

    };


    //register module
    lola.registerModule( new Module() );

})(lola);
