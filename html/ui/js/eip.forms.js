/**
 * @depends {eip.js}
 */
var EIP = (function(EIP, $, undefined) {
	EIP.confirmedFormWarning = false;

	EIP.forms = {};

	$(".modal form input").keydown(function(e) {
		if (e.which == "13") {
			e.preventDefault();
			if (EIP.settings["submit_on_enter"] && e.target.type != "textarea") {
				$(this).submit();
			} else {
				return false;
			}
		}
	});

	$(".modal button.btn-primary:not([data-dismiss=modal]):not([data-ignore=true])").click(function() {
		EIP.submitForm($(this).closest(".modal"), $(this));
	});

	function getSuccessMessage(requestType) {
		var ignore = ["asset_exchange_change_group_name", "asset_exchange_group", "add_contact", "update_contact", "delete_contact",
			"send_message", "decrypt_messages", "start_forging", "stop_forging", "generate_token", "send_money", "set_alias", "add_asset_bookmark", "sell_alias"
		];

		if (ignore.indexOf(requestType) != -1) {
			return "";
		} else {
			var key = "success_" + requestType;

			return $.t(key);
		}
	}

	function getErrorMessage(requestType) {
		var ignore = ["start_forging", "stop_forging", "generate_token", "validate_token"];

		if (ignore.indexOf(requestType) != -1) {
			return "";
		} else {
			var key = "error_" + requestType;

				return $.t(key);
		}
	}

	EIP.addMessageData = function(data, requestType) {
		if (requestType == "sendMessage") {
			data.add_message = true;
		}

		if (!data.add_message && !data.add_note_to_self) {
			delete data.message;
			delete data.note_to_self;
			delete data.encrypt_message;
			delete data.add_message;
			delete data.add_note_to_self;

			return data;
		} else if (!data.add_message) {
			delete data.message;
			delete data.encrypt_message;
			delete data.add_message;
		} else if (!data.add_note_to_self) {
			delete data.note_to_self;
			delete data.add_note_to_self;
		}

		data["_extra"] = {
			"message": data.message,
			"note_to_self": data.note_to_self
		};

		if (data.add_message && data.message) {
			if (!EIP.dgsBlockPassed) {
				data.message = converters.stringToHexString(data.message);
			} else if (data.encrypt_message) {
				try {
					var options = {};

					if (data.recipient) {
						options.account = data.recipient;
					} else if (data.encryptedMessageRecipient) {
						options.account = data.encryptedMessageRecipient;
						delete data.encryptedMessageRecipient;
					}

					if (data.recipientPublicKey) {
						options.publicKey = data.recipientPublicKey;
					}

					var encrypted = EIP.encryptNote(data.message, options, data.secretPhrase);

					data.encryptedMessageData = encrypted.message;
					data.encryptedMessageNonce = encrypted.nonce;
					data.messageToEncryptIsText = "true";

					delete data.message;
				} catch (err) {
					throw err;
				}
			} else {
				data.messageIsText = "true";
			}
		} else {
			delete data.message;
		}

		if (data.add_note_to_self && data.note_to_self) {
			if (!EIP.dgsBlockPassed) {
				delete data.note_to_self;
			} else {
				try {
					var options = {};

					var encrypted = EIP.encryptNote(data.note_to_self, {
						"publicKey": converters.hexStringToByteArray(EIP.generatePublicKey(data.secretPhrase))
					}, data.secretPhrase);

					data.encryptToSelfMessageData = encrypted.message;
					data.encryptToSelfMessageNonce = encrypted.nonce;
					data.messageToEncryptToSelfIsText = "true";

					delete data.note_to_self;
				} catch (err) {
					throw err;
				}
			}
		} else {
			delete data.note_to_self;
		}

		delete data.add_message;
		delete data.encrypt_message;
		delete data.add_note_to_self;

		return data;
	}

	EIP.submitForm = function($modal, $btn) {
		if (!$btn) {
			$btn = $modal.find("button.btn-primary:not([data-dismiss=modal])");
		}

		var $modal = $btn.closest(".modal");

		$modal.modal("lock");
		$modal.find("button").prop("disabled", true);
		$btn.button("loading");

		if ($btn.data("form")) {
			var $form = $modal.find("form#" + $btn.data("form"));
			if (!$form.length) {
				$form = $modal.find("form:first");
			}
		} else {
			var $form = $modal.find("form:first");
		}

		var requestType = $form.find("input[name=request_type]").val();
		var requestTypeKey = requestType.replace(/([A-Z])/g, function($1) {
			return "_" + $1.toLowerCase();
		});

		var successMessage = getSuccessMessage(requestTypeKey);
		var errorMessage = getErrorMessage(requestTypeKey);

		var data = null;

		var formFunction = EIP["forms"][requestType];
		var formErrorFunction = EIP["forms"][requestType + "Error"];

		if (typeof formErrorFunction != "function") {
			formErrorFunction = false;
		}

		var originalRequestType = requestType;

		if (EIP.downloadingBlockchain) {
			$form.find(".error_message").html($.t("error_blockchain_downloading")).show();
			if (formErrorFunction) {
				formErrorFunction();
			}
			EIP.unlockForm($modal, $btn);
			return;
		} else if (EIP.state.isScanning) {
			$form.find(".error_message").html($.t("error_form_blockchain_rescanning")).show();
			if (formErrorFunction) {
				formErrorFunction();
			}
			EIP.unlockForm($modal, $btn);
			return;
		}

		var invalidElement = false;

		//TODO
		$form.find(":input").each(function() {
			if ($(this).is(":invalid")) {
				var error = "";
				var name = String($(this).attr("name")).replace("EFT", "").replace("NQT", "").capitalize();
				var value = $(this).val();

				if ($(this).hasAttr("max")) {
					if (!/^[\-\d\.]+$/.test(value)) {
						error = $.t("error_not_a_number", {
							"field": EIP.getTranslatedFieldName(name).toLowerCase()
						}).capitalize();
					} else {
						var max = $(this).attr("max");

						if (value > max) {
							error = $.t("error_max_value", {
								"field": EIP.getTranslatedFieldName(name).toLowerCase(),
								"max": max
							}).capitalize();
						}
					}
				}

				if ($(this).hasAttr("min")) {
					if (!/^[\-\d\.]+$/.test(value)) {
						error = $.t("error_not_a_number", {
							"field": EIP.getTranslatedFieldName(name).toLowerCase()
						}).capitalize();
					} else {
						var min = $(this).attr("min");

						if (value < min) {
							error = $.t("error_min_value", {
								"field": EIP.getTranslatedFieldName(name).toLowerCase(),
								"min": min
							}).capitalize();
						}
					}
				}

				if (!error) {
					error = $.t("error_invalid_field", {
						"field": EIP.getTranslatedFieldName(name).toLowerCase()
					}).capitalize();
				}

				$form.find(".error_message").html(error).show();

				if (formErrorFunction) {
					formErrorFunction();
				}

				EIP.unlockForm($modal, $btn);
				invalidElement = true;
				return false;
			}
		});

		if (invalidElement) {
			return;
		}

		if (typeof formFunction == "function") {
			var output = formFunction($modal);

			if (!output) {
				return;
			} else if (output.error) {
				$form.find(".error_message").html(output.error.escapeHTML()).show();
				if (formErrorFunction) {
					formErrorFunction();
				}
				EIP.unlockForm($modal, $btn);
				return;
			} else {
				if (output.requestType) {
					requestType = output.requestType;
				}
				if (output.data) {
					data = output.data;
				}
				if ("successMessage" in output) {
					successMessage = output.successMessage;
				}
				if ("errorMessage" in output) {
					errorMessage = output.errorMessage;
				}
				if (output.stop) {
					EIP.unlockForm($modal, $btn, true);
					return;
				}
			}
		}

		if (!data) {
			data = EIP.getFormData($form);
		}

		if (data.recipient) {
			data.recipient = $.trim(data.recipient);
			if (/^\d+$/.test(data.recipient)) {
				$form.find(".error_message").html($.t("error_numeric_ids_not_allowed")).show();
				if (formErrorFunction) {
					formErrorFunction(false, data);
				}
				EIP.unlockForm($modal, $btn);
				return;
			} else if (!/^EFT\-[A-Z0-9]+\-[A-Z0-9]+\-[A-Z0-9]+\-[A-Z0-9]+/i.test(data.recipient)) {
				var convertedAccountId = $modal.find("input[name=converted_account_id]").val();
				if (!convertedAccountId || (!/^\d+$/.test(convertedAccountId) && !/^EFT\-[A-Z0-9]+\-[A-Z0-9]+\-[A-Z0-9]+\-[A-Z0-9]+/i.test(convertedAccountId))) {
					$form.find(".error_message").html($.t("error_account_id")).show();
					if (formErrorFunction) {
						formErrorFunction(false, data);
					}
					EIP.unlockForm($modal, $btn);
					return;
				} else {
					data.recipient = convertedAccountId;
					data["_extra"] = {
						"convertedAccount": true
					};
				}
			}
		}

		try {
			data = EIP.addMessageData(data, requestType);
		} catch (err) {
			$form.find(".error_message").html(String(err.message).escapeHTML()).show();
			if (formErrorFunction) {
				formErrorFunction();
			}
			EIP.unlockForm($modal, $btn);
			return;
		}

		if (data.deadline) {
			data.deadline = String(data.deadline * 60); //hours to minutes
		}

		if ("secretPhrase" in data && !data.secretPhrase.length && !EIP.rememberPassword) {
			$form.find(".error_message").html($.t("error_passphrase_required")).show();
			if (formErrorFunction) {
				formErrorFunction(false, data);
			}
			EIP.unlockForm($modal, $btn);
			return;
		}

		if (!EIP.showedFormWarning) {
			if ("amountEFT" in data && EIP.settings["amount_warning"] && EIP.settings["amount_warning"] != "0") {
				if (new BigInteger(EIP.convertToNQT(data.amountEFT)).compareTo(new BigInteger(EIP.settings["amount_warning"])) > 0) {
					EIP.showedFormWarning = true;
					$form.find(".error_message").html($.t("error_max_amount_warning", {
						"eft": EIP.formatAmount(EIP.settings["amount_warning"])
					})).show();
					if (formErrorFunction) {
						formErrorFunction(false, data);
					}
					EIP.unlockForm($modal, $btn);
					return;
				}
			}

			if ("feeEFT" in data && EIP.settings["fee_warning"] && EIP.settings["fee_warning"] != "0") {
				if (new BigInteger(EIP.convertToNQT(data.feeEFT)).compareTo(new BigInteger(EIP.settings["fee_warning"])) > 0) {
					EIP.showedFormWarning = true;
					$form.find(".error_message").html($.t("error_max_fee_warning", {
						"eft": EIP.formatAmount(EIP.settings["fee_warning"])
					})).show();
					if (formErrorFunction) {
						formErrorFunction(false, data);
					}
					EIP.unlockForm($modal, $btn);
					return;
				}
			}
		}

		if (data.doNotBroadcast) {
			data.broadcast = "false";
			delete data.doNotBroadcast;
		}

		EIP.sendRequest(requestType, data, function(response) {
			//todo check again.. response.error
			if (response.fullHash) {
				EIP.unlockForm($modal, $btn);

				if (!$modal.hasClass("modal-no-hide")) {
					$modal.modal("hide");
				}

				if (successMessage) {
					$.growl(successMessage.escapeHTML(), {
						type: "success"
					});
				}

				var formCompleteFunction = EIP["forms"][originalRequestType + "Complete"];

				if (requestType != "parseTransaction") {
					if (typeof formCompleteFunction == "function") {
						data.requestType = requestType;

						if (response.transaction) {
							EIP.addUnconfirmedTransaction(response.transaction, function(alreadyProcessed) {
								response.alreadyProcessed = alreadyProcessed;
								formCompleteFunction(response, data);
							});
						} else {
							response.alreadyProcessed = false;
							formCompleteFunction(response, data);
						}
					} else {
						EIP.addUnconfirmedTransaction(response.transaction);
					}
				} else {
					if (typeof formCompleteFunction == "function") {
						data.requestType = requestType;
						formCompleteFunction(response, data);
					}
				}

				if (EIP.accountInfo && !EIP.accountInfo.publicKey) {
					$("#dashboard_message").hide();
				}
			} else if (response.errorCode) {
				$form.find(".error_message").html(response.errorDescription.escapeHTML()).show();

				if (formErrorFunction) {
					formErrorFunction(response, data);
				}

				EIP.unlockForm($modal, $btn);
			} else {
				var sentToFunction = false;

				if (!errorMessage) {
					var formCompleteFunction = EIP["forms"][originalRequestType + "Complete"];

					if (typeof formCompleteFunction == 'function') {
						sentToFunction = true;
						data.requestType = requestType;

						EIP.unlockForm($modal, $btn);

						if (!$modal.hasClass("modal-no-hide")) {
							$modal.modal("hide");
						}
						formCompleteFunction(response, data);
					} else {
						errorMessage = $.t("error_unknown");
					}
				}

				if (!sentToFunction) {
					EIP.unlockForm($modal, $btn, true);

					$.growl(errorMessage.escapeHTML(), {
						type: 'danger'
					});
				}
			}
		});
	}

	EIP.unlockForm = function($modal, $btn, hide) {
		$modal.find("button").prop("disabled", false);
		if ($btn) {
			$btn.button("reset");
		}
		$modal.modal("unlock");
		if (hide) {
			$modal.modal("hide");
		}
	}

	return EIP;
}(EIP || {}, jQuery));