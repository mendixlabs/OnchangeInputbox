define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/query",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text!OnChangeInputbox/widget/template/OnChangeInputbox.html"
], function(
    declare,
    _WidgetBase,
    _TemplatedMixin,
    dom,
    dojoDom,
    domQuery,
    domProp,
    domGeom,
    domClass,
    domStyle,
    dojoConstruct,
    dojoArray,
    lang,
    widgetTemplate
) {
    "use strict";

    return declare(
        "OnChangeInputbox.widget.OnChangeInputbox",
        [_WidgetBase, _TemplatedMixin],
        {
            templateString: widgetTemplate,

            //CACHES
            _hasStarted: false,
            subHandle: null,
            divNode: "",
            inputBox: "",
            handle: "",
            delay_timer: "",
            currValue: "",
            _contextObj: null,

            onChangeEvent: "",
            onChangeMicroflow: "",
            onChangeNanoflow: null,
            onLeaveEvent: "",
            onLeaveMicroflow: "",
            onLeaveNanoflow: null,
            _alertDiv: null,
            _readOnly: false,

            postCreate: function() {
                logger.debug(this.id + ".postCreate");
                if (this.readOnly || this.checkDisabled()) {
                    this._readOnly = true;
                }
                if (this.placeholder) {
                    domProp.set(this.inputBox, "placeholder", this.placeholder);
                }
                if (this.showaspassword) {
                    domProp.set(this.inputBox, "type", "password");
                }
                if (!this._readOnly) {
                    this._setupEvents();
                }
            },

            update: function(obj, callback) {
                logger.debug(this.id + ".update");
                if (obj) {
                    this._contextObj = obj;
                    this.inputBox.disabled = this._readOnly;
                    this._resetSubscriptions();
                    this._updateRendering(callback);
                }
            },

            _updateRendering: function(callback) {
                this._clearValidations();
                this.setInputBox();
                if (callback) {
                    callback();
                }
            },
            _setupEvents: function() {
                this.connect(
                    this.inputBox,
                    "onkeyup",
                    lang.hitch(this, this.eventOnChange)
                );
                this.connect(
                    this.inputBox,
                    "onblur",
                    lang.hitch(this, this.onLeaveAction)
                );
                this.connect(
                    this.inputBox,
                    "onfocus",
                    lang.hitch(this, this.eventInputFocus)
                );
            },

            setInputBox: function() {
                this.inputBox.value = this._contextObj.get(this.name);
            },

            eventInputFocus: function() {
                domClass.add(this.inputBox, "MxClient_formFocus");
            },

            eventOnChange: function() {
                if (this._contextObj.get(this.name) !== this.inputBox.value) {
                    this._contextObj.set(this.name, this.inputBox.value);
                    if (this.chartreshold > 0) {
                        if (this.inputBox.value.length > this.chartreshold) {
                            this.eventCheckDelay();
                        } else {
                            clearTimeout(this.delay_timer);
                        }
                    } else {
                        this.eventCheckDelay();
                    }
                }
            },

            eventCheckDelay: function() {
                if (this.delay > 0) {
                    if (this.delay_timer) {
                        clearTimeout(this.delay_timer);
                    }
                    this.delay_timer = setTimeout(
                        lang.hitch(this, this.onChangeAction),
                        this.delay
                    ); // in milliseconds, seconds * 1000 !
                } else {
                    this.onChangeAction();
                }
            },

            onChangeAction: function() {
                this.delay_timer = null;
                if (
                    this.onChangeEvent === "callMicroflow" &&
                    this.onChangeMicroflow
                ) {
                    this._executeMicroflow(this.onChangeMicroflow);
                } else if (
                    this.onChangeEvent === "callNanoflow" &&
                    this.onChangeNanoflow.nanoflow &&
                    this._contextObj
                ) {
                    this._executeNanoflow(this.onChangeNanoflow);
                } else if (this.onChangeEvent === "doNothing") {
                    return;
                } else {
                    mx.ui.error(
                        "No action specified for " + this.onChangeEvent
                    );
                }
            },

            onLeaveAction: function() {
                this.delay_timer = null;
                if (
                    this.onLeaveEvent === "callMicroflow" &&
                    this.onLeaveMicroflow
                ) {
                    this._executeMicroflow(this.onLeaveMicroflow);
                } else if (
                    this.onLeaveEvent === "callNanoflow" &&
                    this.onLeaveNanoflow.nanoflow &&
                    this._contextObj
                ) {
                    this._executeNanoflow(this.onLeaveNanoflow);
                } else if (this.onLeaveEvent === "doNothing") {
                    return;
                } else {
                    mx.ui.error("No action specified for " + this.onLeaveEvent);
                }
            },

            _executeNanoflow: function(nanoflow) {
                mx.data.callNanoflow({
                    nanoflow: nanoflow,
                    origin: this.mxform,
                    context: this.mxcontext,
                    error: function(error) {
                        mx.ui.error(
                            "An error occurred while executing the on nanoflow: " +
                                error.message
                        );
                    }
                });
            },

            _executeMicroflow: function(microflow) {
                if (microflow && this._contextObj) {
                    mx.data.action({
                        origin: this.mxform,
                        params: {
                            actionname: microflow,
                            applyto: "selection",
                            guids: [this._contextObj.getGuid()]
                        },
                        error: function() {
                            mx.ui.error(
                                "OnChangeInputbox.widget.OnChangeInputbox.triggerMicroFlow: XAS error executing microflow"
                            );
                        }
                    });
                }
            },

            _resetSubscriptions: function() {
                logger.debug(this.id + "._resetSubscriptions");
                // Release handles on previous object, if any.
                this.unsubscribeAll();
                // When a context object exists create subscribtions.
                if (this._contextObj) {
                    this.subscribe({
                        guid: this._contextObj.getGuid(),
                        attr: this.name,
                        callback: lang.hitch(this, function(guid) {
                            this._updateRendering();
                        })
                    });
                    // set validation handler
                    this.subscribe({
                        guid: this._contextObj.getGuid(),
                        val: true,
                        callback: lang.hitch(this, this._handleValidation)
                    });
                }
            },

            // Handle validations.
            _handleValidation: function(validations) {
                logger.debug(this.id + "._handleValidation");
                // clear validation if any
                this._clearValidations();

                var validation = validations[0],
                    feedbackMessage = validation.getReasonByAttribute(
                        this.name
                    );
                if (this._readOnly) {
                    validation.removeAttribute(this.name);
                } else if (feedbackMessage) {
                    this._addValidation(feedbackMessage);
                    validation.removeAttribute(this.name);
                }
            },

            _addValidation: function(feedbackMessage) {
                logger.debug(this.id + "._addValidation");
                if (this._alertDiv !== null) {
                    domProp.set(this._alertDiv, "innerHTML", feedbackMessage);
                    return;
                }
                this._alertDiv = dojoConstruct.create("div", {
                    class: "alert alert-danger",
                    innerHTML: feedbackMessage
                });
                dojoConstruct.place(this._alertDiv, this.domNode);
            },
            _clearValidations: function() {
                logger.debug(this.id + "._clearValidations");
                if (this._alertDiv) {
                    dojoConstruct.destroy(this._alertDiv);
                    this._alertDiv = null;
                }
            },
            uninitialize: function() {
                logger.debug(this.id + ".uninitialize");
                this.unsubscribeAll();
                if (this.delay_timer) {
                    clearTimeout(this.delay_timer);
                }
            }
        }
    );
});

require(["OnChangeInputbox/widget/OnChangeInputbox"]);
