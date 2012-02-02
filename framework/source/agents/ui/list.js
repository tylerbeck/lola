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
        var dependencies = [];

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
            console.log('agent.ui.list::sign', client.id );
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
                $client.addClass('ui-list-psuedo-input');
                $control.putData( {client:client}, namespace );


                var multi = (["yes","true",""]).indexOf( String($client.attr('multiple')) ) >= 0;
                console.log('multi', $client.attr('multiple'));

                clients[ client.id ] = client;
                $client.putData( {
                    control:control,
                    multi:multi,
                    selectedIndices:[],
                    lastClick: -1
                }, namespace );

                var g = lola.util.getInlineValue;
                self.setLabelFn( client, g( client, 'label-fn', 'function', defaultLabelFn ) );
                self.setValueFn( client, g( client, 'value-fn', 'function', defaultValueFn ) );
                self.setDataProvider( client, g( client, 'data-provider', 'array', [] ) );

                //add listeners
                $client.addListener('focus', handleClientFocus, false, lola.event.PRIORITY_NORMAL, self );
                $client.addListener('blur', handleClientBlur, false, lola.event.PRIORITY_NORMAL, self );
                $client.addListener('keydown', handleClientKeyDown, false, lola.event.PRIORITY_BEFORE, self );
            }
        };

        /**
         * drops a client
         * @param {*} client
         */
        this.drop = function( client ) {
            var $client = $(client);
            if (clients[ client.id ] ) {
                var data = $client.getData( namespace );
                //remove listeners

                //teardown client
                $client.appendChild( data.input );
                $client.removeChild( data.input );
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

        function handleClientFocus( event ){

        }
        function handleClientBlur( event ){

        }
        function handleClientKeyDown( event ){
            event.preventDefault();
            var client = event.currentTarget;
            var $client = $(client);
            var data = $client.getData( namespace );
            var $ctrl = $(data.control);

            if ( event.keyCode == 40 ){
                //down

            }
            else if ( event.keyCode == 38 ){
                //up

            }
            else {

            }
            
            console.log(event.key);
            if ( data.multi ){

            }
            else{
               // if (!event.shiftKey)
                //    data.lastClick = index;
            }

            return false;
        }

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
                var row = self.updateClientRow( client, index, item, lblFn, valFn, $ctrl[0] );
                if (item.selected){
                    if (data.multi){
                        data.selectedIndices.push( index );
                    }
                    else{
                        setSelections( client, data.selectedIndices, false );
                        data.selectedIndices = [index];
                    }
                }
            });

            setSelections( client, data.selectedIndices, true );
        }

        /**
         * sets the selected class on selected rows
         * @param client
         * @param list
         * @param selected
         */
        function setSelections( client, list, selected ){
            var data = $(client).getData(namespace);
            var ctrl = data.control;
            var mthd = selected?"addClass":"removeClass";

            list.forEach( function(item){
                $(ctrl.childNodes[ item ])[mthd]('selected');
                data.dataProvider[ item ].selected = selected;
                client.options[ item ].selected = selected;
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
            a.href = "#";
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

        function handleClientRowClick( event ){
            var $row = $( event.currentTarget );
            var ctrl = $row.parent();
            var client = $(ctrl).getData( namespace ).client;
            var data = $(client).getData( namespace );
            var index = $row.nodeIndex();
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

                //update last click value
                data.lastClick = index;

            }
            else if( event.shiftKey && data.multi ){

                if (data.lastClick < 0)
                    data.lastClick = index;

                //console.log('    shift select');
                setSelections( client, data.selectedIndices, false );
                data.selectedIndices = [];
                var from = Math.min( data.lastClick, index );
                var to = Math.max( data.lastClick, index );
                for (var n=from; n<=to; n++){
                    data.selectedIndices.push(n);
                }
                setSelections( client, data.selectedIndices, true );
            }
            else {
                setSelections( client, data.selectedIndices, false );
                data.selectedIndices = [index];
                setSelections( client, data.selectedIndices, true );

                //update last click value
                data.lastClick = index;
            }
            data.selectedIndices = data.selectedIndices.sort();
            $(client).trigger('selectionChanged', false, false, [].concat(data.selectedIndices));
            //console.log('    indices', data.selectedIndices );

        }

    };

	//register module
	lola.agent.registerAgent( new Agent() );

})( lola );

