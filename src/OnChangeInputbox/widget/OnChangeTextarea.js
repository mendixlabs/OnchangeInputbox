define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/dom-prop",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dojo/text!OnChangeInputbox/widget/template/OnChangeTextarea.html"
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
        "OnChangeInputbox.widget.OnChangeTextarea",
        [_WidgetBase, _TemplatedMixin],
        {
            templateString: widgetTemplate,
            delay_timer: null,
            _contextObj: null,
            _alertDiv: null,
            _counterLabel: null,
            _textTooLongMessageDiv: null,
            _readOnly: false,

            postCreate: function() {
                logger.debug(this.id + ".postCreate");
                if (this.readOnly || this.checkDisabled()) {
                    this._readOnly = true;
                }
                if (this.placeholder) {
                    domProp.set(
                        this.textareaNode,
                        "placeholder",
                        this.placeholder
                    );
                }
                if (this.maxLength) {
                    domProp.set(this.textareaNode, "maxLength", this.maxLength);
                }
                if (this.rows) {
                    domProp.set(this.textareaNode, "rows", this.rows);
                }

                // if it's not ready only register event listeners
                if (!this._readOnly) {
                    this._setupEvents();
                }
            },

            update: function(obj, callback) {
                logger.debug(this.id + ".update");
                if (obj) {
                    this._contextObj = obj;
                    this.textareaNode.disabled = this._readOnly;
                    this._resetSubscriptions();
                    this._updateRendering(callback);
                }
            },

            _updateRendering: function(callback) {
                logger.debug(this.id + "._updateRendering");
                this._clearValidations();
                this._setTextarea();
                // when maxLenght is set to 0 that means the text length is unlimited, and the counter message  & text too long message won't appear
                if (this.maxLength > 0) {
                    if (this.counterMsg.trim()) {
                        this._setCounterMessage();
                    }
                    if (this.textTooLongMsg.trim()) {
                        this._setTextTooLongMessage();
                    }
                }
                if (callback && typeof callback === "function") {
                    callback();
                }
            },
            _setupEvents: function() {
                logger.debug(this.id + "._setupEvents");
                this.connect(
                    this.textareaNode,
                    "onkeyup",
                    lang.hitch(this, this._eventOnChange)
                );
                this.connect(
                    this.textareaNode,
                    "onblur",
                    lang.hitch(this, this._onLeaveAction)
                );
                this.connect(
                    this.textareaNode,
                    "onfocus",
                    lang.hitch(this, this._eventInputFocus)
                );
            },

            _setTextarea: function() {
                logger.debug(this.id + "._setTextarea");
                this.textareaNode.value = this._contextObj.get(this.name);
            },

            _eventInputFocus: function() {
                logger.debug(this.id + " _eventInputFocus");
                dojoClass.add(this.textareaNode, "mx-focus");
            },

            _eventOnChange: function() {
                logger.debug(this.id + " _eventOnChange");
                if (
                    this._contextObj.get(this.name) !== this.textareaNode.value
                ) {
                    this._contextObj.set(this.name, this.textareaNode.value);
                    if (this.chartreshold > 0) {
                        if (
                            this.textareaNode.value.length > this.chartreshold
                        ) {
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
                logger.debug(this.id + " _eventCheckDelay");
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
                logger.debug(this.id + " _onChangeAction");
                this.delay_timer = null;
                if (
                    this.onChangeEvent === "callMicroflow" &&
                    this.onchangemf
                ) {
                    this._executeMicroflow(this.onchangemf);
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
            _onLeaveAction: function() {
                logger.debug(this.id + "._onLeaveAction");
                this.delay_timer = null;
                if (
                    this.onLeaveEvent === "callMicroflow" &&
                    this.onleavemf
                ) {
                    this._executeMicroflow(this.onleavemf);
                } else if (
                    this.onLeaveEvent === "callNanoflow" &&
                    this.onLeaveNanoflow.nanoflow &&
                    this.mxcontext
                ) {
                    this._executeNanoflow(this.onLeaveNanoflow);
                } else if (this.onLeaveEvent === "doNothing") {
                    return;
                } else {
                    mx.ui.error("No action specified for " + this.onLeaveEvent);
                }
            },

            _executeNanoflow: function(nanoflow) {
                logger.debug(this.id + " _executeNanoflow");
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
                logger.debug(this.id + " _executeMicroflow");
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
                logger.debug(this.id + "._resetSubscriptions");
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

            _setCounterMessage: function() {
                logger.debug(this.id + "._addCounterMessage");
                // replace '{1}' ( if provided ) with the length of the entered text
                var counterMessageString = this.counterMsg.trim();
                if (counterMessageString.indexOf("{1}") >= 0) {
                    counterMessageString = counterMessageString.replace(
                        "{1}",
                        this.textareaNode.value.length
                    );
                }
                // replace '{2}' ( if provided ) with the max allowed length of the text
                if (counterMessageString.indexOf("{2}") >= 0) {
                    counterMessageString = counterMessageString.replace(
                        "{2}",
                        this.maxLength
                    );
                }
                if (this._counterLabel) {
                    // counter label is already mounted to the dom
                    // update the text only
                    domProp.set(
                        this._counterLabel,
                        "innerHTML",
                        counterMessageString
                    );
                } else {
                    // create counter label and append it to the widget node
                    this._counterLabel = dojoConstruct.create("label", {
                        class: "mx-textarea-counter",
                        innerHTML: counterMessageString
                    });
                    dojoConstruct.place(this._counterLabel, this.domNode);
                }
            },

            _setTextTooLongMessage: function() {
                logger.debug(this.id + "._setTextTooLongMessage");
                var textTooLongMessageString = this.textTooLongMsg.trim();
                var txtLength = this.textareaNode.value.length;
                if (txtLength > this.maxLength) {
                    if (!this._textTooLongMessageDiv) {
                        this._textTooLongMessageDiv = dojoConstruct.create(
                            "div",
                            {
                                class:
                                    "alert alert-danger mx-validation-message",
                                innerHTML: textTooLongMessageString
                            }
                        );
                        dojoConstruct.place(
                            this._textTooLongMessageDiv,
                            this.domNode
                        );
                    }
                } else {
                    if (this._textTooLongMessageDiv) {
                        dojoConstruct.destroy(this._textTooLongMessageDiv);
                        this._textTooLongMessageDiv = null;
                    }
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
                dojoClass.add(this.domNode, "has-error");
            },
            _clearValidations: function() {
                logger.debug(this.id + "._clearValidations");
                if (this._alertDiv) {
                    dojoConstruct.destroy(this._alertDiv);
                    this._alertDiv = null;
                    dojoClass.remove(this.domNode, "has-error");
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

require(["OnChangeInputbox/widget/OnChangeTextarea"]);
