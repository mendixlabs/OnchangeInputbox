define([
    "dojo/_base/declare", "mxui/widget/_WidgetBase", "dijit/_TemplatedMixin",
    "mxui/dom", "dojo/dom", "dojo/query", "dojo/dom-prop", "dojo/dom-geometry", "dojo/dom-class", "dojo/dom-style", "dojo/dom-construct", "dojo/_base/array", "dojo/_base/lang",
    "dojo/text!OnChangeInputbox/widget/template/OnChangeInputbox.html"
], function(declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, domQuery, domProp, domGeom, domClass, domStyle, domConstruct, dojoArray, dojoLang, widgetTemplate) {
    "use strict";

    return declare("OnChangeInputbox.widget.OnChangeInputbox", [_WidgetBase, _TemplatedMixin], {
        templateString: widgetTemplate,

        //CACHES
        _hasStarted: false,
        divNode: "",
        inputBox: "",
        handle: "",
        delay_timer: "",
        currValue: "",
        obj: null,

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _alertDiv: null,

        startup: function() {
            if (this._hasStarted) {
                return;
            }
            this._hasStarted = true;

            if (this.placeholder) {
                domProp.set(this.inputBox, "placeholder", this.placeholder);
            }

            if (this.showaspassword) {
                domProp.set(this.inputBox, "type", "password");
            }

            this.connect(this.inputBox, "onkeyup", dojoLang.hitch(this, this.eventOnChange));
            this.connect(this.inputBox, "onblur", dojoLang.hitch(this, this.onLeaveMicroflow));
            this.connect(this.inputBox, "onfocus", dojoLang.hitch(this, this.eventInputFocus));

            this.actLoaded();
        },

        update: function(obj, callback) {
            this.obj = obj;
            this._resetSubscriptions();
            this._clearValidations();

            if (callback) {
                callback();
            }
        },

        changeInputBox: function() {
            this.inputBox.value = this.obj.get(this.name);
        },

        eventInputFocus: function() {
            domClass.add(this.inputBox, "MxClient_formFocus");
        },

        eventOnChange: function() {
            if (this.obj.get(this.name) !== this.inputBox.value) {
                this.obj.set(this.name, this.inputBox.value);
                mx.data.save({
                    mxobj: this.obj,
                    callback: dojoLang.hitch(this, function() {
                        // CHECK TRESHOLD HERE.
                        if (this.chartreshold > 0) {
                            if (this.inputBox.value.length > this.chartreshold) {
                                this.eventCheckDelay();
                            } else {
                                clearTimeout(this.delay_timer);
                            }
                        } else {
                            this.eventCheckDelay();
                        }
                    })
                });
            }
        },

        eventCheckDelay: function() {
            if (this.delay > 0) {
                if (this.delay_timer) {
                    clearTimeout(this.delay_timer);
                }
                this.delay_timer = setTimeout(dojoLang.hitch(this, this.onChangeMicroflow), this.delay); // in milliseconds, seconds * 1000 !
            } else {
                this.onChangeMicroflow();
            }
        },

        onChangeMicroflow: function() {
            this.delay_timer = null;
            this.executeMicroflow(this.onchangemf);
        },

        onLeaveMicroflow: function() {
            this.delay_timer = null;
            this.executeMicroflow(this.onleavemf);
        },

        executeMicroflow: function(mf) {
            this._clearValidations();
            
            if (mf && this.obj) {
                mx.data.action({
                    store: {
                        caller: this.mxform
                    },
                    params: {
                        actionname: mf,
                        applyto: "selection",
                        guids: [this.obj.getGuid()]
                    },
                    callback: function() {},
                    error: function() {
                        logger.error("OnChangeInputbox.widget.OnChangeInputbox.triggerMicroFlow: XAS error executing microflow");
                    }
                });
            }
        },

        // Handle validations.
        _handleValidation: function (validations) {
            logger.debug(this.id + "._handleValidation");
            this._clearValidations();

            var validation = validations[0];
            var message = validation.getReasonByAttribute(this.name);

            if (message) {
                this._addValidation(message);
                validation.removeAttribute(this.name);
            }
        },

        // Clear validations.
        _clearValidations: function () {
            logger.debug(this.id + "._clearValidations");
            domConstruct.destroy(this._alertDiv);
            domClass.remove( this.domNode, 'has-error' );
            this._alertDiv = null;
        },
       
        // Add a validation.
        _addValidation: function (message) {
            logger.debug(this.id + "._addValidation");
            if (this._alertDiv !== null) {
                dojoHtml.set(this._alertDiv, message);
            } else {
                this._alertDiv = domConstruct.create("div", {
                    "class": "alert alert-danger",
                    "innerHTML": message
                });
                domConstruct.place(this._alertDiv, this.domNode);
            }
            domClass.add( this.domNode, 'has-error' );
        },

        // Reset subscriptions.
        _resetSubscriptions: function () {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            this.unsubscribeAll();

            // When a mendix object exists create subscribtions.
            if (this.obj) {
                this.subscribe({
                    guid: this.obj.getGuid(),
                    attr: this.name,
                    callback: dojoLang.hitch(this, function(obj) {
                        this.changeInputBox();
                    })
                });
                this.subscribe({
                    guid: this.obj.getGuid(),
                    val: true,
                    callback: dojoLang.hitch(this, this._handleValidation)
                });
                this.changeInputBox();
            }
        }
    });
});

require(["OnChangeInputbox/widget/OnChangeInputbox"]);
