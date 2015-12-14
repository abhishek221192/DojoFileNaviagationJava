define([
    'dojo/_base/lang',
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/on',
    'dojo/aspect',
    'dojo/dom-construct',
    'dojo/query',
    'dijit/registry',
    'dijit/Toolbar',
    'dijit/ToolbarSeparator',
    'dijit/form/Button',
    'dijit/form/Select',
    'rfe/config/fileObject',
    'dijit/form/ValidationTextBox'
], function (lang, declare, array, on, aspect, domConstruct, query, registry, Toolbar, ToolbarSeparator, Button, Select, fileObject, ValidationTextBox) {

    /**
     * @class rfe.layout.Toolbar
     * @extends dijit.Toolbar
     * @property {rfe} rfe reference to remoteFileExplorer
     */
    return declare([Toolbar], /** @lends rfe.layout.Toolbar.prototype */ {
        link: null,
        iframe: null,
        /**
         * Adds the buttons to the toolbar buttons and defines their actions.
         */
        postCreate: function () {
            this.inherited('postCreate', arguments);	// in case we've overriden something

            var self = this;


            var prev = new Button({
                label: 'Prev',
                showLabel: false,
                iconClass: 'dijitEditorIconleftarrow',
                onClick: function () {
                    self.iframe.contentWindow.history.back();
                }
            });
            this.addChild(prev);

            var next = new Button({
                label: 'Next',
                showLabel: false,
                iconClass: 'dijitEditorIconrightarrow',
                onClick: function () {
                    self.iframe.contentWindow.history.forward();
                }
            });
            this.addChild(next);

            var filetype = new ValidationTextBox({
                type: 'text',
                trim: true,
                style: "width:92.5%;",
                value: this.link
            });
            this.addChild(filetype);

            // TODO: file and label properties should not be hardcoded
            var div = domConstruct.create('div', {
                'class': 'rfeToolbarSort'
            }, this.domNode);

            var bt4 = new Button({
                label: 'Go',
                showLabel: false,
                iconClass: 'dijitEditorIconrefresh',
                onClick: function () {
                    self.iframe.src = filetype.get("value");
                }
            }).placeAt(div);

            var bt5 = new Button({
                label: 'Max',
                showLabel: false,
                iconClass: 'dijitEditorIconmax',
                onClick: function () {
                    var newtab = window.open("", '_blank');
                    newtab.location = filetype.get("value");
                }
            }).placeAt(div);

        },
        _onContainerKeydown: function (evt) {
            var widget = registry.getEnclosingWidget(evt.target);
            if (!widget.textbox) {
                this.inherited('_onContainerKeydown', arguments);
            }
        },
        _onContainerKeypress: function (evt) {
            var widget = registry.getEnclosingWidget(evt.target);
            if (!widget.textbox) {
                this.inherited('_onContainerKeydown', arguments);
            }
        },
        setIframe: function (iframe)
        {
            this.iframe = iframe;
        }
    });
});