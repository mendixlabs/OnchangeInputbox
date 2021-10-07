define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/dom-prop",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dojo/text!OnChangeInputbox/widget/template/OnChangeInputbox.html"
], function(
    declare,
    _WidgetBase,
    _TemplatedMixin,
    domProp,
    dojoClass,
    dojoConstruct,
    lang,
    widgetTemplate
) {
    "use strict";

    return declare(
        "OnChangeInputbox.widget.OnChangeInputbox",
        [_WidgetBase, _TemplatedMixin],
        {
            templateString: widgetTemplate,
            delay_timer: null,
            _contextObj: null,
            _alertDiv: null,
            _readOnly: false,

            log: function() {
                var args = Array.prototype.slice.call(arguments);
                if (this.id) {
                    args.unshift(this.id);
                }
                if (mx && mx.logger && mx.logger.debug) {
                    mx.logger.debug.apply(mx.logger, args);
                } else {
                    logger.debug.apply(logger, args);
                }
            },

            postCreate: function() {
                this.log(".postCreate");
                if (this.readOnly || this.checkDisabled()) {
                    this._readOnly = true;
                }
                if (this.placeholder) {
                    domProp.set(this.inputBox, "placeholder", this.placeholder);
                }
                if (this.showaspassword) {
                    domProp.set(this.inputBox, "type", "password");
                }
                // if it's not ready only register event listeners
                if (!this._readOnly) {
                    this._setupEvents();
                }
            },

            update: function(obj, callback) {
                this.log(".update");
                if (obj) {
                    this._contextObj = obj;
                    this.inputBox.disabled = this._readOnly;
                    this._resetSubscriptions();
                    this._updateRendering(callback);
                }
            },

            _updateRendering: function(callback) {
                this.log("._updateRendering");
                this._clearValidations();
                this._setInputBox();
                if (callback && typeof callback === "function") {
                    callback();
                }
            },
            _setupEvents: function() {
                this.log("._setupEvents");
                this.connect(
                    this.inputBox,
                    "onkeyup",
                    lang.hitch(this, this._eventOnChange)
                );
                this.connect(
                    this.inputBox,
                    "onblur",
                    lang.hitch(this, this._onLeaveAction)
                );
                this.connect(
                    this.inputBox,
                    "onfocus",
                    lang.hitch(this, this._eventInputFocus)
                );
            },

            _setInputBox: function() {
                this.log("._setInputBox");
                this.inputBox.value = this._contextObj.get(this.name);
            },

            _eventInputFocus: function() {
                this.log("._eventInputFocus");
                dojoClass.add(this.inputBox, "mx-focus");
            },

            _eventOnChange: function() {
                this.log("._eventOnChange");
                if (this._contextObj.get(this.name) !== this.inputBox.value) {
                    this._contextObj.set(this.name, this.inputBox.value);
                    if (this.chartreshold > 0) {
                        if (this.inputBox.value.length > this.chartreshold) {
                            this._eventCheckDelay();
                        } else {
                            clearTimeout(this.delay_timer);
                        }
                    } else {
                        this._eventCheckDelay();
                    }
                }
            },

            _eventCheckDelay: function() {
                this.log("._eventCheckDelay");
                if (this.delay > 0) {
                    if (this.delay_timer) {
                        clearTimeout(this.delay_timer);
                    }
                    this.delay_timer = setTimeout(
                        lang.hitch(this, this._onChangeAction),
                        this.delay
                    ); // in milliseconds, seconds * 1000 !
                } else {
                    this._onChangeAction();
                }
            },

            _onChangeAction: function() {
                this.log("._onChangeAction");
                this.delay_timer = null;
                if (
                    this.onChangeEvent === "callMicroflow" &&
                    this.onchangemf
                ) {
                    this._executeMicroflow(this.onchangemf);
                } else if (
                    this.onChangeEvent === "callNanoflow" &&
                    this.onChangeNanoflow.nanoflow &&
                    this.mxcontext
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

            _onLeaveAction: function() {
                this.log("._onLeaveAction");
                this.delay_timer = null;
                if (
                    this.onLeaveEvent === "callMicroflow" &&
                    this.onleavemf
                ) {
                    this._executeMicroflow(this.onleavemf);
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
                this.log(" _executeNanoflow");
                if (nanoflow && this._contextObj) {
                    mx.data.callNanoflow({
                        nanoflow: nanoflow,
                        origin: this.mxform,
                        context: this.mxcontext,
                        error: function(error) {
                            mx.ui.error(
                                "An error occurred while executing the Nanoflow: " +
                                    error.message
                            );
                            console.error(error.message);
                        }
                    });
                }
            },

            _executeMicroflow: function(microflow) {
                this.log(" _executeMicroflow");
                if (microflow && this._contextObj) {
                    mx.data.action({
                        origin: this.mxform,
                        params: {
                            actionname: microflow,
                            applyto: "selection",
                            guids: [this._contextObj.getGuid()]
                        },
                        error: function(error) {
                            mx.ui.error(
                                "An error occurred while executing the Microflow: " +
                                    error.message
                            );
                            console.error(error.message);
                        }
                    });
                }
            },

            _resetSubscriptions: function() {
                this.log("._resetSubscriptions");
                // Release handles on previous object, if any.
                this.unsubscribeAll();
                // When a context object exists create subscribtions.
                if (this._contextObj) {
                    this.subscribe({
                        guid: this._contextObj.getGuid(),
                        attr: this.name,
                        callback: lang.hitch(this, this._updateRendering)
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
                this.log("._handleValidation");
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
                this.log("._addValidation");
                if (this._alertDiv !== null) {
                    domProp.set(this._alertDiv, "innerHTML", feedbackMessage);
                    return;
                }
                this._alertDiv = dojoConstruct.create("div", {
                    class: "alert alert-danger",
                    innerHTML: feedbackMessage
                });
                dojoConstruct.place(this._alertDiv, this.domNode);
                dojoClass.add(this.domNode, "has-error");
            },
            _clearValidations: function() {
                this.log("._clearValidations");
                if (this._alertDiv) {
                    dojoConstruct.destroy(this._alertDiv);
                    this._alertDiv = null;
                    dojoClass.remove(this.domNode, "has-error");
                }
            },
            uninitialize: function() {
                this.log(".uninitialize");
                this.unsubscribeAll();
                if (this.delay_timer) {
                    clearTimeout(this.delay_timer);
                }
            }
        }
    );
});

require(["OnChangeInputbox/widget/OnChangeInputbox"]);
