/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Chart
 *  Description: Chart module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function (lola) {
    var $ = lola;
    /**
     * @description Chart Module
     * @implements {lola.Module}
     * @memberof lola
     */
    var chart = {

        //==================================================================
        // Attributes
        //==================================================================



        //==================================================================
        // Methods
        //==================================================================
        /**
         * @description get module's namespace
         * @public
         * @return {String}
         * @default dom
         */
        getNamespace:function () {
            return "chart";
        },

        /**
         * @description get module's dependencies
         * @public
         * @return {Array}
         * @default []
         */
        getDependencies:function () {
            return ['graphics'];
        },

        //==================================================================
        // Classes
        //==================================================================
        Grid: function(x,y,width,height,spacing,flags){
            return this.init(x,y,width,height,spacing,flags);
        },

        Axis: function(x,y,size,label,labelOffset,flags ){
            return this.init(x,y,size,label,labelOffset,flags);
        },


        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * @description get module's selectors
         * @public
         * @return {Object}
         */
        getSelectorMethods:function () {

            /**
             * @description module's selector methods
             * @type {Object}
             */
            var methods = {

            };

            return methods;

        }
    };

    //==================================================================
    // Class Prototypes
    //==================================================================
    chart.Grid.HORIZONTAL = 0x1;
    chart.Grid.VERTICAL = 0x2;
    chart.Grid.prototype = {
        x:0,
        y:0,
        width:100,
        height:100,
        spacing:10,
        flags:3,
        init: function(x,y,width,height,spacing,flags){
            this.x = x || 0;
            this.y = y || 0;
            this.width = width || 100;
            this.height = height || 100;
            this.spacing = spacing || 10;
            this.flags = (flags==undefined)?3:flags;

            return this;
        },

        draw: function( ctx, flags ){
            flags = flags == undefined ? this.flags : flags;

            var i;
            //vertical
            if (flags & lola.chart.Grid.VERTICAL){
                for (i=this.x+this.spacing; i<=this.width+this.x; i+=this.spacing){
                        ctx.beginPath();
                        ctx.moveTo(i,this.y);
                        ctx.lineTo(i,this.y+this.height);
                        ctx.stroke();
                        ctx.closePath();
                }
            }
            //horizontal
            if (flags & lola.chart.Grid.HORIZONTAL){
                for (i=this.y+this.spacing; i<=this.height+this.y; i+=this.spacing){
                    ctx.beginPath();
                    ctx.moveTo(this.x,i);
                    ctx.lineTo(this.x+this.width,i);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
    };

    chart.Axis.VERTICAL = 0x1;
    chart.Axis.prototype = {
        x:0,
        y:0,
        size: 100,
        label: undefined,
        labelOffset: {x:0,y:0},
        flags: 0x2,
        init: function(x,y,size,label,labelOffset,flags){
            this.x = x || 0;
            this.y = y || 0;
            this.size = size || 100;
            this.label = label;
            if( labelOffset ) this.labelOffset = labelOffset;
            this.flags = (flags==undefined)?0x0:flags;
            return this;
        },

        draw: function( ctx, flags ){
            flags = flags == undefined ? this.flags : flags;
            ctx.beginPath();
            ctx.moveTo( this.x, this.y );
            if (flags & lola.chart.Axis.VERTICAL){
                //vertical axis
                ctx.lineTo( this.x, this.y+this.size );
            }
            else {
                //horizontal axis
                ctx.lineTo( this.x+this.size, this.y );
            }
            ctx.stroke();
            ctx.closePath();

            if (this.label) {
                if (flags & lola.chart.Axis.VERTICAL) {
                    //label at bottom
                    ctx.textAlign = "center";
                    ctx.fillText( this.label, this.x + this.labelOffset.x, this.y + this.size + this.labelOffset.y );
                }
                else {
                    ctx.textAlign = "right";
                    ctx.fillText( this.label, this.x + this.labelOffset.x, this.y + this.labelOffset.y );
                }
            }
        }
    };



    //register module
    lola.registerModule(chart);

})(lola);
