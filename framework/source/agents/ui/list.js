/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Agent: UI List
 *  Description:
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    var $ = lola;
    /**
     * UI LIST AGENT
     *
     * supported styles
     * .ui-list-input - this class is assigned to the select tag to move it off screen
     * .ui-list-ctrl - this is the class assigned to the ui control
     * .ui-list-ctrl.focused - the 'focused' class is added when input is focused
     * .ui-list-ctrl a - each row in the control
     * .ui-list-ctrl a.selected - selected rows get the 'selected' class
     *
     * client events
     * selectionChanged: triggered whenever the client selection changes
     *
     * @namespace lola.agent.ui.list
     *
     */
    var Agent = function(){
        var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * agent's namespace
         * @type {String}
         * @private
         */
        var namespace = "ui.list";

        /**
         * agent's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['math','css','event','data','dom','geometry'];

        /**
         * map of agent's clients
         * @private
         * @type {Object}
         */
        var clients = {};

        /**
         * default item label function
         * @private
         * @type {Function}
         */
        var defaultLabelFn = function( item ){
            return String( item );
        };

        /**
         * default item value function
         * @private
         * @type {Function}
         */
        var defaultValueFn = function( item ){
            return String( item );
        };

        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get agent's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get agent's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        //==================================================================
        // Methods
        //==================================================================
        /**
         * signs a client
         * @param {*} client
         */
        this.sign = function( client ) {

            var $client = $(client);
            $client.identify();
            //console.log('agent.ui.list::sign', client.id );
            if ( clients[ client.id ] == null) {
                //console.log('   not a client' );

                //setup client
                var control = document.createElement('div');
                var $control = $(control);
                control.id = client.id + '-ctrl';
                $control.classes( $client.classes() );
                $control.addClass("ui-list-ctrl");
                $control.removeClass("ui-list");
                $client.insertBefore( control );
                $client.addClass('ui-list-input');
                $control.putData( {client:client}, namespace );


                var multi = (["yes","true",""]).indexOf( String($client.attr('multiple')) ) >= 0;
                //console.log('multi', $client.attr('multiple'));

                clients[ client.id ] = client;
                $client.putData( {
                    control:control,
                    multi:multi,
                    selectedIndices:[],
                    lastStart: -1,
                    lastEnd: -1,
                    lastSelection: -1
                }, namespace );

                var g = lola.util.getInlineValue;
                self.setLabelFn( client, g( client, 'label-fn', 'function', defaultLabelFn ) );
                self.setValueFn( client, g( client, 'value-fn', 'function', defaultValueFn ) );
                self.setDataProvider( client, g( client, 'data-provider', 'array', [] ) );

                //add listeners
                $client.addListener('focus', handleClientFocus, false, lola.event.PRIORITY_NORMAL, self );
                $client.addListener('blur', handleClientBlur, false, lola.event.PRIORITY_NORMAL, self );
                $client.addListener('keydown', handleClientKeyDown, false, lola.event.PRIORITY_BEFORE, self );
                $control.addListener('mousedown', handleControlMouseDown, false, lola.event.PRIORITY_BEFORE, self );
            }
        };

        /**
         * drops a client
         * @param {*} client
         */
        this.drop = function( client ) {
            if (clients[ client.id ] ) {
                var $client = $(client);
                var data = $client.getData( namespace );
                var $control = $(data.control);

                //remove listeners
                $client.removeListener('focus', handleClientFocus, false );
                $client.removeListener('blur', handleClientBlur, false );
                $client.removeListener('keydown', handleClientKeyDown, false );
                $control.removeListener('mousedown', handleControlMouseDown, false );


                //teardown client
                $control.parent().removeChild( data.control );
                $client.removeClass('ui-list-psuedo-input');
                $client.removeData( namespace );
                delete clients[ client.id ];
            }
        };

        /**
         * checks if client exists
         * @private
         * @param {*} client
         * @return {Boolean}
         */
        function clientExists( client ){
            return ( client.id && clients[ client.id ] );
        }

        /**
         * agent initializer
         */
        this.initialize = function(){
            lola(".ui-list").assignAgent( namespace );
        };

        /**
         * sets data provider on a client
         * @param {*} client
         * @param {Array} dp
         */
        this.setDataProvider = function( client, dp ) {
            //console.log('agent.ui.list::setDataProvider', dp );
            if ( clientExists(client) ) {
                var $client = $(client);
                var data = $client.getData( namespace );
                data.dataProvider = dp;
                renderClient( client );
            }
        };

        /**
         * sets default label function for agent
         * @param {Function} fn
         */
        this.setDefaultLabelFn = function( fn ) {
            defaultLabelFn = fn;
        };

        /**
         * sets data provider on a client
         * @param {*} client
         * @param {Function} fn
         */
        this.setLabelFn = function( client, fn ) {
            //console.log('agent.ui.list::setLabelFn', fn );
            if ( clientExists(client) ) {
                var $client = $(client);
                var data = $client.getData( namespace );
                data.labelFn = fn;
            }
        };

        /**
         * sets default value function for agent
         * @param {Function} fn
         */
        this.setDefaultValueFn = function( fn ) {
            defaultValueFn = fn;
        };

        /**
         * sets value fn on a client
         * @param {*} client
         * @param {Function} fn
         */
        this.setValueFn = function( client, fn ) {
            //console.log('agent.ui.list::setLabelFn', fn );
            if ( clientExists(client) ) {
                var $client = $(client);
                var data = $client.getData( namespace );
                data.valueFn = fn;
            }
        };

        /**
         * renders client data
         * @private
         * @param client
         */
        function renderClient( client ){
            var $client = $(client);
            var data = $client.getData( namespace );
            var $ctrl = $(data.control);
            var dp = data.dataProvider;
            var lblFn = data.labelFn;
            var valFn = data.valueFn;

            //reset client
            $ctrl.html( "" );
            client.options.length = 0;
            data.selectedIndices = [];
            dp.forEach( function(item,index){
                self.updateClientRow( client, index, item, lblFn, valFn, $ctrl[0] );
                if (item.selected){
                    if (data.multi)
                        data.selectedIndices.push( index );
                    else
                        data.selectedIndices = [index];
                }
            });
            setSelections( client, data.selectedIndices, true, true );
        }

        /**
         * sets the selected class on selected rows
         * @param client
         * @param list
         * @param selected
         */
        function setSelections( client, list, selected, clear ){
            var data = $(client).getData(namespace);
            var ctrl = data.control;

            var setFn = function( index, slct ){
                $(ctrl.children[ index ])[ slct?"addClass":"removeClass"]('selected');
                data.dataProvider[ index ].selected = slct;
                client.options[ index ].selected = slct;
            };

            if (clear){
                for (var i=0; i<ctrl.childNodes.length; i++){
                    setFn(i,false);
                }
            }

            list.forEach( function(item){
                setFn(item,selected);
            });
        }

        /**
         * updates client data provider with provided object and re-renders row
         * @param client
         * @param row
         * @param obj
         * @param labelFn
         * @param valueFn
         * @param ctrl
         * @return {Node}
         */
        this.updateClientRow = function( client, row, obj, labelFn, valueFn, ctrl ){

            var $client = $(client);

            //get label function if not in arguments
            labelFn = labelFn ? labelFn : $client.getData( namespace ).labelFn;

            //get control if not in arguments
            ctrl = ctrl ? ctrl : $client.getData( namespace ).control;

            //get or set row data object
            if ( obj == undefined ){
                //get obj from dataprovider
                obj = $client.getData( namespace ).dataProvider[row];
            }
            else {
                //replace dataprovider object
                $client.getData( namespace ).dataProvider[row] = obj;
            }

            //create row node
            var a = document.createElement('a');
            a.className = "list-item";
            a.href = "javascript:lola.event.preventDefault(event);";
            a.innerHTML = labelFn( obj );
            addListeners( a );

            //create shadow option
            var opt = new Option( labelFn( obj ), valueFn( obj ) );

            if (ctrl.childNodes.length <= row){
                //add child
                $(ctrl).appendChild( a );
                client.options.add( opt );
            }
            else {
                //replace child
                var old = ctrl.childNodes[row];
                $(ctrl).replaceChild( a, old);
                client.options[row] = opt;

            }

            return a;
        };

        /**
         * adds interaction listeners to row
         * @param row
         */
        function addListeners( row ){
            $(row).addListener( 'click', handleClientRowClick, false, lola.event.PRIORITY_NORMAL, self );
        }

        /**
         * steps a value based on a keycode
         * @private
         * @param key
         * @param value
         * @param min
         * @param max
         * @return {Number}
         */
        function doKeyStep( key, value, min, max ){

            value = (value == undefined) ? 0 : value;
            min = (min == undefined) ? Number.MIN_VALUE : min;
            max = (max == undefined) ? Number.MAX_VALUE : max;

            //increment / decrement value
            if ( key == 40 )
                value++;
            else if ( key == 38 )
                value--;

            return lola.math.normalizeRange( min, value, max );
        }

        /**
         * gets indices in range
         * @private
         * @param a
         * @param b
         * @return {Array}
         */
        function getRangeIndexes( a,b ){
            var from = Math.min( a,b );
            var to = Math.max( a,b );
            var range = [];
            for (var i = from; i <= to; i++){
                range.push(i);
            }

            return range;
        }

        /**
         * row click handler
         * @private
         * @param event
         */
        function handleClientRowClick( event ){
            var $row = $( event.currentTarget );
            var ctrl = $row.parent();
            var client = $(ctrl).getData( namespace ).client;
            var data = $(client).getData( namespace );
            var index = $row.nodeIndex();

            //reset clickedIndices
            data.clickedIndices = null;

            //console.log('agent.ui.list::handleClientRowClick', client );
            if ( (event.metaKey && data.multi) || (event.metaKey && data.dataProvider[index].selected===true) ){

                //toggle row's selected class
                var selected = !(data.dataProvider[index].selected===true);
                setSelections( client, [index], selected );

                //update selected indices
                if (selected){
                    data.selectedIndices.push(index);
                }
                else{
                    var i = data.selectedIndices.indexOf(index);
                    data.selectedIndices.splice(i,1);
                }
            }
            else if( event.shiftKey && data.multi ){

                if (data.lastSelection < 0)
                    data.lastSelection = index;

                //console.log('    shift select');
                data.selectedIndices = getRangeIndexes( data.lastSelection, index );
                setSelections( client, data.selectedIndices, true, true );
            }
            else {
                data.selectedIndices = [index];
                setSelections( client, data.selectedIndices, true, true );
            }

            //update last click value
            data.lastSelection = index;
            data.selectedIndices = data.selectedIndices.sort();
            selectionChanged( client );
        }

        /**
         * dispatches selectionChanged event
         * @private
         * @param client
         */
        function selectionChanged(client){
            $(client).trigger('selectionChanged', false, false, {
                selectedIndices: self.getSelectedIndices(client),
                selectedValues: self.getSelectedValues(client)
            });
        }

        /**
         * key press handler
         * @private
         * @param event
         */
        function handleClientKeyDown( event ){

            //TODO: Add key jumpto functionality
            //TODO: Add scrollto functionality

            //keep tabbing behavior
            if ( event.keyCode != 9 )
                event.preventDefault();

            //only execute handler if keycode expected
            if ( ([38,40]).indexOf(event.keyCode) >= 0 ){

                var client = event.currentTarget;
                var $client = $(client);
                var data = $client.getData( namespace );
                var $ctrl = $(data.control);

                //console.log('data.lastSelection:',data.lastSelection);
                if (data.multi && event.shiftKey){
                    //set clicked selections for concatenation with keyed selections and initial ranges
                    if (!data.clickedIndices){
                        data.clickedIndices = [].concat( data.selectedIndices );
                        data.selectStart = Math.max(data.lastSelection,0);
                        data.selectEnd = data.lastSelection;
                    }

                    data.selectEnd = doKeyStep( event.keyCode, data.selectEnd, 0, data.dataProvider.length-1 );
                    var keyIndices = getRangeIndexes (data.selectStart, data.selectEnd);
                    //console.log( data.selectStart, data.selectEnd );
                    data.lastSelection = data.selectEnd;
                    //update selections
                    data.selectedIndices = lola.array.unique( [].concat( keyIndices, data.clickedIndices ) );
                    setSelections( client, data.selectedIndices, true, true );
                    self.scrollToRow( client, data.selectEnd );

                }
                else {
                    var index = doKeyStep( event.keyCode, data.lastSelection, 0, data.dataProvider.length-1 );
                    //console.log(index);

                    //update selected indices
                    data.selectedIndices = [ index ];
                    setSelections( client, data.selectedIndices, true, true );
                    data.lastSelection = index;
                    data.clickedIndices = null;
                    self.scrollToRow( client, index );

                }


                data.selectedIndices = data.selectedIndices.sort();
                selectionChanged( client );
            }

            return false;
        }

        /**
         * control mousedown handler
         * @private
         * @param event
         */
        function handleControlMouseDown( event ){
            event.preventDefault();
            var client = $(event.currentTarget).getData(namespace).client;
            client.focus();
        }

        /**
         * client focus handler
         * @private
         * @param event
         */
        function handleClientFocus( event ){
            $ctrl = $( $(event.currentTarget).getData(namespace).control );
            $ctrl.addClass('focused');
        }

        /**
         * client blur handler
         * @private
         * @param event
         */
        function handleClientBlur( event ){
            $ctrl = $( $(event.currentTarget).getData(namespace).control );
            $ctrl.removeClass('focused');
        }

        /**
         * scrolls to row of specified client
         * @param {Node} client
         * @param {int} row
         */
        this.scrollToRow = function( client, row ){
            var $client = $(client);
            var data = $client.getData( namespace );
            var ctrl = data.control;

            if ( row < data.dataProvider.length ){
                var $r = $(ctrl.childNodes[ row ]);
                var o = $r.offset( ctrl );
                var h = $r.height();
                var ch = $(ctrl).height();
                var cst = ctrl.scrollTop;

                console.log('ctrl.offsetTop: '+ctrl.offsetTop, ctrl.offsetParent );
                console.log('row.offsetTop: '+$r[0].offsetTop, $r[0].offsetParent );

                console.log( o.y+h, ch+cst,' | ', o.y , cst );

                /*if ( o.y+h > ch+cst ){
                    ctrl.scrollTop = o.y+h - ch;
                }
                else if ( o.y < cst){
                    ctrl.scrollTop = o.y;
                }*/
            }
        };

        /**
         * returns the client's selected indices
         * @param client
         * @return {Array}
         */
        this.getSelectedIndices = function( client ){
            var data = $(client).getData(namespace);
            return [].concat( data.selectedIndices );
        };

        /**
         * returns the client's selected values
         * @param client
         * @return {Array}
         */
        this.getSelectedValues = function( client ){
            var data = $(client).getData(namespace);
            var values = [];
            data.selectedIndices.forEach( function(index){
                values.push( data.valueFn( data.dataProvider[index]) );
            });

            return values;
        };

        /**
         * returns the value at specified index
         * @param client
         * @param index
         * @param data
         * @return {*}
         */
        this.getValueAtIndex = function( client, index, data ){
            data = data?data:$(client).getData(namespace);
            return data.valueFn( data.dataProvider[index] );
        };

        /**
         * returns the index of specified value
         * @param client
         * @param value
         * @param data
         * @return {*}
         */
        this.getIndexOfValue = function( client, value, data ){
            data = data?data:$(client).getData(namespace);
            var index = -1;
            var l = data.dataProvider.length;
            for (var i = 0; i<l; i++){
                if (value == self.getValueAtIndex(client, i, data) ){
                    index = i;
                    break;
                }
            }
            return index;
        };


        /**
         * returns the client's selected indices
         * @param client
         * @param indices
         */
        this.setSelectedIndices = function( client, indices ){
            var data = $(client).getData(namespace);
            data.selectedIndices = indices;
            setSelections( client, indices, true, true );
        };

        /**
         * returns the client's selected values
         * @param client
         * @param values
         */
        this.setSelectedValues = function( client, values ){
            var data = $(client).getData(namespace);
            var indices = [];
            values.forEach( function(item){
                var index = self.getIndexOfValue( client, item, data );
                if (index > -1)
                    indices.push( index );
            });

            self.setSelectedIndices( client, indices );
        };
    };

	//register module
	lola.agent.registerAgent( new Agent() );

})( lola );

