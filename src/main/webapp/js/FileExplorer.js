/**
 * A module that creates an application that allows you to manage and browse files and directories on a remote web server.
 * It consists of tree and a grid. The tree loads file data over REST via php from remote server.
 * @module FileExplorer rfe/FileExplorer
 */
define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/Deferred',
	'dojo/when',
	'dojo/dom',
	'dojo/dom-class',
	'dojo/on',
	'dojo/Stateful',
	'dijit/registry',
	'rfe/_Base',
	'rfe/Layout',
	'rfe/History',
	'rfe/Edit',
	//'rfe/store/FileStore',
	'rfe/dialogs/dialogs',
	'rfe/Keyboard',
	'rfe/dnd/Manager'	// needs to be loaded for dnd
], function(lang, declare, Deferred, when, dom, domClass, on, Stateful,
				registry, _Base, Layout, History, Edit, //FileStore, 
                                dialogs, Keyboard) {

	/*
	 *	@class rfe/FileExporer
	 *	@extends {rfe/Layout}
	 * @mixes {rfe/Edit}
	 * @property {string} version
	 * @property {string} versionDate
	 * @property {dojo/Stateful} currentTreeObject keeps track of currently selected store object in tree. Equals always parent of grid items
	 * @property {dojo/Stateful} context keeps track of widget the context menu was created on (right clicked on)
	 * @config {boolean} isOnGridRow
	 * @config {boolean} isOnTreeRow
	 * @config {boolean} isOnGridContainer
	 * @config {boolean} isOnTreeContainer
	 * @property {object} history
	 * @config {array} steps saves the steps
	 * @config {int} curIdx index of current step we're on
	 * @config {int} numSteps number of steps you can go forward/back
	 * @property {rfe/store/FileStore} store
	 *
	 */
	return declare([_Base, History, Layout, Edit, Keyboard], {
		version: '0.9',
		versionDate: '2014',
		currentTreeObject: null,
		context: null,
		store: null,

		/**
		 * Need to know the page url in order to know which part of path is resource to load into app
		 * @param {string} origPageUrl url of application without path to a file/folder
		 **/
		origPageUrl: '/',

		constructor: function() {
			// TODO: should tree connect also on right click as grid? If so, attache event to set currentTreeItem
			this.currentTreeObject = new Stateful();	// allows Toolbar and Edit to keep track of selected object in tree
			//this.store = new FileStore();
			this.context = {
				isOnGridRow: false,
				isOnGridContainer: false,
				isOnGrid: false,
				isOnTreeRow: false,
				isOnTreeContainer: false,
				isOnTree: false
			};
			this.domNode = dom.byId(this.id);
		},

		startup: function() {
			this.init();
			this.postCreate();
			//this.initEvents();
		},

		initEvents: function() {
			var self = this,
				grid = this.grid,
				tree = this.tree,
				store = this.store;

			on(this.panes.domNode, '.rfeTreePane:mousedown, .rfeGridPane:mousedown', function(evt) {
				self.set('context', evt, this);
			});

			tree.on('click', function(object) {	// when calling tree.on(click, load) at once object is not passed
				when(self.displayChildrenInGrid(object), function() {	// use when since dfd might already have resolved from previous click
					self.currentTreeObject.set(object);
					self.set('history', object.id);
				});
			});
			tree.on('load', function() {
				self.initState().then(function() {

					grid.on('.dgrid-row:click, .dgrid-row:dblclick', function(evt) {
						var object = grid.row(evt.target).data;

						switch(evt.type) {
							case 'dblclick':
								if (object.dir) {
									self.display(object).then(function() {
										self.set('history', object.id);
									});
								}
								else {
									window.open(store.storeMaster.target + object.id, '_blank');
								}
								break;
							case 'click':
								self.set('history', object.id);
								break;
						}

					});
					grid.on('dgrid-datachange', function(evt) {
						// catch using editor when renaming
						var obj = evt.cell.row.data;

						obj[store.labelAttr] = evt.value;
						store.put(obj).then(function() {
							grid.save();
						}, function() {
							grid.revert();
						});
					});
				});
			});
		},

		/**
		 * Displays folder content in grid.
		 * @param {Object} object dojo data object
		 * @return {dojo.Deferred}
		 */
		displayChildrenInGrid: function(object) {
			var grid = this.grid,
				store = this.store,
				dfd = new Deferred();

			if (object.dir) {
				dfd = when(store.getChildren(object), function() {
					var sort = grid.get('sort');
					grid.set('query', {parId: object.id}, {sort: sort});
				});
			}
			else {
				dfd.resolve(object);
			}
			return dfd;
		},

		/**
		 * Displays the store object (folder) in the tree and it's children in the grid.
		 * The tree and the grid can either be in sync meaning that they show the same content (e.g. tree folder is expanded)
		 * or the grid is one level down (e.g. tree folder is selected but not expanded).
		 * @param {Object} object store object
		 * @return {dojo/Deferred}
		 */
		display: function(object) {
			var path, dfd = new Deferred();
			if (object.dir) {
				path = this.store.storeMemory.getPath(object);
				dfd = this.tree.set('path', path);
			}
			else {
				dfd.reject(false);
			}
			dfd.then(lang.hitch(this, function() {
				return this.displayChildrenInGrid(object);
			}));
			this.currentTreeObject.set(object);
			return dfd;
		},

		/**
		 * Display parent directory.
		 * @param {Object} [object] dojo.data.object
		 */
		goDirUp: function(object) {
			var def;
			if (!object) {
				object = this.currentTreeObject;
			}
			if (object.parId) {
				def = when(this.store.get(object.parId), lang.hitch(this, function(object) {
					return this.display(object);
				}), function(err) {
					console.debug('Error occurred when going directory up', err);
				});
			}
			else {
				def = new Deferred();
				def.resolve(false);
			}
			return def;
		},

		/**
		 * Reload file explorer.
		 */
		reload: function() {
			alert("Not implemented Yet")

		},
		/**
		 * Set object properties describing on which part of the file explorer we are on.
		 * @param {Event} evt
		 * @param {HTMLElement} node
		 */
		_setContext: function(evt, node) {
			var widget = registry.getEnclosingWidget(evt.target),
				//isGridRow = this.grid.row(evt) !== undefined,
				isTreeRow = widget && widget.baseClass === 'dijitTreeNode';

			node = node || widget.domNode;

			this.context = {
				//isOnGridRow: isGridRow,
				isOnGridContainer: domClass.contains(node, 'rfeGridPane'),
				isOnTreeRow: isTreeRow,
				isOnTreeContainer: widget && widget.baseClass === 'dijitTree'
			};

			//this.context.isOnGrid = this.context.isOnGridRow || this.context.isOnGridContainer;
			this.context.isOnTree = this.context.isOnTreeRow || this.context.isOnTreeContainer;
		},

		/**
		 * Initializes the default or last state of the tree and the grid.
		 * Expects the tree to be loaded and expanded otherwise it will be set to root, then displays the correct folder in the grid.
		 */
		showFileDetails: function() {
			// Note: A visible file/folder object is always loaded
			var dialog, id, store = this.store,
				i = 0, len,
				widget = this.context.isOnGrid ? this.grid : this.tree,
				selection = widget.selection;

			// TODO: if multiple selected file objects, only use one dialog with multiple values (and sum of all file sizes). Requires preloading folder contents first!
			// grid
			if (selection) {
				for (id in selection) {
					if (selection[id] === true) {
						dialog = dialogs.getByFileObj('fileProperties', store.get(id));
						dialog.show();
					}
				}
			}
			// TODO: extend dijit.tree._dndSelector to work same way as grid.selection ? so we don't need to differentiate here
			// tree
			else if (widget.selectedItems) {
				len = widget.selectedItems.length;
				for (i; i < len; i++) {
					dialog = dialogs.getByFileObj('fileProperties', widget.selectedItems[i]);
					dialog.show();
				}
			}
		}
	});

});