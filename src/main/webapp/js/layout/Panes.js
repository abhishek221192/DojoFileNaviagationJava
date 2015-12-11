/**
 * @module rfe/layout/Panes
 * TODO: use css display flex for layout, also to switch from vertical to horizontal
 */
define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/dom-geometry',
    'dojo/dom-style',
    'dijit/layout/BorderContainer',
    "dijit/layout/TabContainer",
    "dojox/layout/ExpandoPane",
    'dijit/layout/ContentPane'
], function (declare, domConstruct, domGeometry, domStyle, BorderContainer, TabContainer, ExpandoPane,ContentPane) {

    var cpPosition;	// remember position of contentPane when show/hide treePane to restore layout
    // this information is only available after child panes (treePane, gridPane) are added

    /**
     * @class
     * @name rfe.layout.Panes
     * @property {boolean} liveSplitters
     * @property {boolean} gutters
     * @property {string} view
     * @propery {boolean} treePaneVisible
     * @property {dijit.layout.ContentPane} contentPane
     * @property {dijit.layout.BorderContainer} contentPaneBc
     * @property {dijit.layout.ContentPane} menuPane
     * @property {dijit.layout.ContentPane} logPane
     * @property {dijit.layout.ContentPane} treePane
     * @property {dijit.layout.ContentPane} gridPane
     * @extends {dijit.layout.BorderContainer}
     */
    return declare([BorderContainer], /** @lends rfe.layout.Panes.prototype */ {
        liveSplitters: true,
        gutters: false,
        view: 'horizontal',
        treePaneVisible: true,
        contentPane: null,
        contentPaneBc: null,
        menuPane: null,
        logPane: null,
        treePane: null,
        gridPane: null,
        buildRendering: function () {
            this.inherited('buildRendering', arguments);

            this.menuPane = new ContentPane({
                region: 'top',
                'class': 'rfeMenuPane'
            });
            this.contentPane = new ContentPane({
                region: 'center',
                'class': 'rfeContentPane'
            });

            this.contentPaneBc = new BorderContainer({
                gutters: false
            }, domConstruct.create('div'));

            this.contentCodePane = new TabContainer({
                region: 'center',
                splitter: true,
                minSize: 180,
                'class': 'rfeTreePane'
            });
            this.codePane1 = new ContentPane({
                title: "Source1"
            });
            this.contentCodePane.addChild(this.codePane1);
            this.codePane2 = new ContentPane({
                title: "Source2"
            });
            this.contentCodePane.addChild(this.codePane2);

            this.contentPaneBc.addChild(this.contentCodePane);


            this.pallate = new ExpandoPane({
                startExpanded: false,
                title: "Palatte",
                region: "right",
                duration: "125",
                previewOnDblClick: true,
                style: "width:10%",
                splitter: true
            });
            this.contentPaneBc.addChild(this.pallate);

            this.treePane = new TabContainer({
                region: 'left',
                splitter: true,
                minSize: 180,
                'class': 'rfeTreePane'
            });
            this.projectPane = new ContentPane({
                title: "Project"
            });
            this.treePane.addChild(this.projectPane);
            this.filesPane = new ContentPane({
                title: "Files"
            });
            this.treePane.addChild(this.filesPane);
            this.contentPaneBc.addChild(this.treePane);

            this.contentPane.addChild(this.contentPaneBc);


            //----Bottom --------------------------------------------------------------



            this.logPane = new BorderContainer({
                region: 'bottom',
                splitter: true,
                style: "height:20%;width:100%"
            }, domConstruct.create('div'));

            this.chatPane = new ContentPane({
                region: 'left',
                style: "height:100%;width:15%"
            });
            this.logPane.addChild(this.chatPane);
            this.outputPane = new TabContainer({
                region: 'center',
                style: "height:100%;"
            });

            this.outputPanePane = new ContentPane({
                title: "Output"
            });
            this.outputPane.addChild(this.outputPanePane);

            this.logPane.addChild(this.outputPane);

        },
        postCreate: function () {
            this.inherited('postCreate', arguments);
            this.addChild(this.menuPane);
            this.addChild(this.contentPane);
            this.addChild(this.logPane);
        },
        /**
         * Sets the layout view of the explorer.
         * @param {string} view 'vertical' or 'horizontal'
         */
        _setViewAttr: function (view) {
            // TODO: add and respect this.persist
            if (this.treePaneVisible) {
                this.contentPaneBc.removeChild(this.treePane);
                if (view === 'vertical') {
                    this.treePane.set({
                        region: 'top',
                        style: 'width: 100%; height: 15%;'
                    });
                } else if (view === 'horizontal') {
                    this.treePane.set({
                        region: 'left',
                        style: 'width: 15%; height: 100%'
                    });
                }
                // hiding treePane messes up layout, fix that
                if (this.contentPane._started && cpPosition) {
                    domStyle.set(this.contentPane.domNode, {
                        left: cpPosition.x + 'px',
                        top: cpPosition.y + 'px',
                        width: cpPosition.w + 'px',
                        height: cpPosition.h + 'px'
                    });
                    this.contentPaneBc.resize({w: cpPosition.w, h: cpPosition.h});	// propagates style to all children
                }
                this.contentPaneBc.addChild(this.treePane);
            }
            this._set('view', view);
        },
        /**
         * Show or hide the tree pane.
         * @param {Boolean} visible
         */
        _setTreePaneVisibleAttr: function (visible) {
            var treePane = this.treePane;
            // before removing pane, remember position of contentPane when show/hide treePane to restore layout
            if (this.contentPane._started) {
                cpPosition = domGeometry.position(this.contentPane.domNode);
            }
            visible === false ? this.removeChild(treePane) : this.addChild(treePane);
            this._set('treePaneVisible', visible);
        }

    });
});
