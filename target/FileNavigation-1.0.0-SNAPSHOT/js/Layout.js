define([
    'dojo/_base/lang',
    'dojo/_base/declare',
    'dojo/cookie',
    'dojo/dom-construct',
    'dojo/query',
    //'rfe/Tree',
    //'rfe/Grid',
    
    "dojo/store/Memory", "dojo/store/Observable",
    "dijit/Tree", "dijit/tree/ObjectStoreModel", "dijit/tree/dndSource",
    'rfe/dnd/TreeSource',
    'rfe/dnd/GridSource',
    'dijit/registry',
    'dijit/form/CheckBox',
    'dijit/Dialog',
    'rfe/layout/Toolbar',
    'rfe/layout/Menubar',
    'rfe/layout/Panes',
    'rfe/Console',
    'rfe/ContextMenu'
], function (lang, declare, cookie, domConstruct, query, //Tree, Grid, 
             Memory, Observable, Tree, ObjectStoreModel,dndSource,TreeSource,
        GridSource, registry, CheckBox, Dialog, Toolbar, Menubar, Panes, Console, ContextMenu) {

    /**
     * @class
     * @name rfe.Layout
     * @property {rfe.layout.Panes} panes
     * @property {rfe.layout.Toolbar} toolbar
     * @property {rfe.layout.Menubar} menubar
     * @property {rfe.Console} console
     * @property {rfe.Grid} tree
     * @property {dijit.Tree} grid
     */
    return declare(null, /** @lends rfe.Layout.prototype */ {
        _cnDialogSettingsFolderState: 'DialogSettingsFolderState', // name of cookie

        panes: null,
        toolbar: null,
        menubar: null,
        console: null,
        tree: null,
        grid: null,
        /** @constructor */
        constructor: function (props) {
            lang.mixin(this, props || {});
        },
        init: function () {
            this.panes = new Panes({
                view: 'horizontal'
            }, this.id);

            this.menubar = new Menubar({
                rfe: this,
                tabIndex: 1
            }, domConstruct.create('div'));

            this.toolbar = new Toolbar({
                rfe: this,
                tabIndex: 10
            }, domConstruct.create('div'));

            this.panes.treePane.set('tabIndex', 20);
            this.panes.gridPane.set('tabIndex', 30);
            this.menubar.placeAt(this.panes.menuPane.domNode);
            this.toolbar.placeAt(this.panes.menuPane.domNode);
            this.panes.startup();

            this.console = new Console(null, domConstruct.create('div', null, this.panes.logPane.domNode));

            this.editContextMenu = new ContextMenu({
                rfe: this,
                targetNodeIds: [this.panes.treePane.id, this.panes.gridPane.id]
            });
            this.initTree();
            //this.initGrid();
            this.initDialogs();
        },
        /**
         * Initializes the tree and tree dnd.
         */
        initTree: function () {

            var storeD = new Memory({
                data: [
                    {id: 'world', name: 'The earth', type: 'planet', population: '6 billion'},
                    {id: 'AF', name: 'Africa', type: 'continent', population: '900 million', area: '30,221,532 sq km',
                        timezone: '-1 UTC to +4 UTC', parent: 'world'},
                    {id: 'EG', name: 'Egypt', type: 'country', parent: 'AF'},
                    {id: 'KE', name: 'Kenya', type: 'country', parent: 'AF'},
                    {id: 'Nairobi', name: 'Nairobi', type: 'city', parent: 'KE'},
                    {id: 'Mombasa', name: 'Mombasa', type: 'city', parent: 'KE'},
                    {id: 'SD', name: 'Sudan', type: 'country', parent: 'AF'},
                    {id: 'Khartoum', name: 'Khartoum', type: 'city', parent: 'SD'},
                    {id: 'AS', name: 'Asia', type: 'continent', parent: 'world'},
                    {id: 'CN', name: 'China', type: 'country', parent: 'AS'},
                    {id: 'IN', name: 'India', type: 'country', parent: 'AS'},
                    {id: 'RU', name: 'Russia', type: 'country', parent: 'AS'},
                    {id: 'MN', name: 'Mongolia', type: 'country', parent: 'AS'},
                    {id: 'OC', name: 'Oceania', type: 'continent', population: '21 million', parent: 'world'},
                    {id: 'AU', name: 'Australia', type: 'country', population: '21 million', parent: 'OC'},
                    {id: 'EU', name: 'Europe', type: 'continent', parent: 'world'},
                    {id: 'DE', name: 'Germany', type: 'country', parent: 'EU'},
                    {id: 'FR', name: 'France', type: 'country', parent: 'EU'},
                    {id: 'ES', name: 'Spain', type: 'country', parent: 'EU'},
                    {id: 'IT', name: 'Italy', type: 'country', parent: 'EU'},
                    {id: 'NA', name: 'North America', type: 'continent', parent: 'world'},
                    {id: 'MX', name: 'Mexico', type: 'country', population: '108 million', area: '1,972,550 sq km',
                        parent: 'NA'},
                    {id: 'Mexico City', name: 'Mexico City', type: 'city', population: '19 million', timezone: '-6 UTC', parent: 'MX'},
                    {id: 'Guadalajara', name: 'Guadalajara', type: 'city', population: '4 million', timezone: '-6 UTC', parent: 'MX'},
                    {id: 'CA', name: 'Canada', type: 'country', population: '33 million', area: '9,984,670 sq km', parent: 'NA'},
                    {id: 'Ottawa', name: 'Ottawa', type: 'city', population: '0.9 million', timezone: '-5 UTC', parent: 'CA'},
                    {id: 'Toronto', name: 'Toronto', type: 'city', population: '2.5 million', timezone: '-5 UTC', parent: 'CA'},
                    {id: 'US', name: 'United States of America', type: 'country', parent: 'NA'},
                    {id: 'SA', name: 'South America', type: 'continent', parent: 'world'},
                    {id: 'BR', name: 'Brazil', type: 'country', population: '186 million', parent: 'SA'},
                    {id: 'AR', name: 'Argentina', type: 'country', population: '40 million', parent: 'SA'}
                ]
            });

            // Since dojo.store.Memory doesn't have various store methods we need, we have to add them manually
            storeD.getChildren = function (object) {
                // Add a getChildren() method to store for the data model where
                // children objects point to their parent (aka relational model)
                return this.query({parent: this.getIdentity(object)});
            };
            
            
            // Wrap the store in Observable so that updates to the store are reflected to the Tree
            var storeD = new Observable(storeD);

            // Create the model and tree
            this.store = new ObjectStoreModel({store: storeD, query: {id: 'world'}});
            
            this.store.add = function(object, options) {
			console.log(JSON.stringify(object));
			console.log(JSON.stringify(options));
            }
            
            this.tree = new Tree({
                model: this.store,
                dndController: function(arg, params) {
			return new TreeSource(arg, lang.mixin(params || {}, {
				accept: ['dgrid-row'],
				rfe: arg.rfe
			}))
                    }
            });
            this.tree.dndSource = this.dndController;
            
            this.tree.placeAt(this.panes.treePane);
        },
        initGrid: function () {
            var div = domConstruct.create('div', null, this.panes.gridPane.domNode);
            this.grid = new Grid({
                rfe: this,
                tabIndex: 31,
                view: 'icons',
                store: null, // store is set in FileExplorer.initState()
                dndConstructor: GridSource, // dgrid/extension/dnd can't be overridden directly
                dndParams: {
                    accept: ['treeNode'],
                    rfe: this
                }
            }, div);
        },
        initDialogs: function () {
            // TODO: move to dialog.js
            new Dialog({
                id: 'rfeDialogAbout',
                title: "About Remote File Explorer (rfe)",
                content: '<div id="rfeDialogAboutLogo"><img src="' + require.toUrl('rfe') + '/resources/images/logo-speich.net.png' +
                        '" alt="speich.net logo" title="Created by Simon Speich, www.speich.net"/></div>' +
                        '<div id="rfeDialogAboutText">' +
                        '<h2>Remote File Explorer (rfe)</h2>' +
                        '<p>version ' + this.version + ' - ' + this.versionDate + '</p>' +
                        '<p>Created by <a href="http://www.speich.net" target="_blank">Simon Speich</a>, www.speich.net using the ' +
                        '<a href="http://www.dojotoolkit.org" target="_blank">dojotoolkit</a> and <a href="http://www.php.net" target="_blank">PHP</a>. ' +
                        'The code is available on <a href="https://github.com/speich/remoteFileExplorer" target="_blank">github</a></p>' +
                        '<p>Available under the same <a href="http://dojotoolkit.org/license" target="_blank">dual BSD/AFL license</a> as the Dojo Toolkit.</p>' +
                        '</div>'
            });

            // TODO: move to dialogs.js
            var self = this;
            var dialog = new Dialog({
                id: 'rfeDialogSettings',
                title: "Settings",
                content: '<div>Not implmented yet' +
                        '<fieldset><legend>Navigation Pane (Folders)</legend></fieldset>' +
                        '</div>'
            });

            // TODO: move dialog creation to constructor/init so we can use cookie also to set store on first display
            var label = domConstruct.create('label', {
                innerHTML: 'Remember folders state'
            }, query('fieldset', dialog.domNode)[0], 'last');
            domConstruct.create('br', null, label);
            var input = domConstruct.create('input', null, label, 'first');
            new CheckBox({
                checked: cookie(this._cnDialogSettingsFolderState) || true,
                disabled: 'disabled',
                onChange: function () {
                    self.tree.set('persist', this.checked);
                    cookie(this._cnDialogSettingsFolderState, this.checked);
                }
            }, input);

            label = domConstruct.create('label', {
                innerHTML: 'Show folders only'
            }, query('fieldset', dialog.domNode)[0], 'last');
            input = domConstruct.create('input', null, label, 'first');
            new CheckBox({
                checked: true,
                disabled: 'disabled',
                onClick: function () {
                    self.store.skipWithNoChildren = this.checked;
                    self.reload();
                }
            }, input);
        },
        showDialogAbout: function () {
            registry.byId('rfeDialogAbout').show();
        },
        showDialogSettings: function () {
            registry.byId('rfeDialogSettings').show();
        }

    });
});