/**
 * @depends {eip.js}
 */
var EIP = (function(EIP, $, undefined) {
	EIP.newlyCreatedAccount = false;

	EIP.allowLoginViaEnter = function() {
		$("#login_password").keypress(function(e) {
			if (e.which == '13') {
				e.preventDefault();
				var password = $("#login_password").val();
				EIP.login(password);
			}
		});
	}

	EIP.showLoginOrWelcomeScreen = function() {
		if (EIP.hasLocalStorage && localStorage.getItem("logged_in")) {
			EIP.showLoginScreen();
		} else {
			EIP.showWelcomeScreen();
		}
	}

	EIP.showLoginScreen = function() {
		$("#account_phrase_custom_panel, #account_phrase_generator_panel, #welcome_panel, #custom_passphrase_link").hide();
		$("#account_phrase_custom_panel :input:not(:button):not([type=submit])").val("");
		$("#account_phrase_generator_panel :input:not(:button):not([type=submit])").val("");
		$("#login_panel").show();
		setTimeout(function() {
			$("#login_password").focus()
		}, 10);
	}

	EIP.showWelcomeScreen = function() {
		$("#login_panel, account_phrase_custom_panel, #account_phrase_generator_panel, #account_phrase_custom_panel, #welcome_panel, #custom_passphrase_link").hide();
		$("#welcome_panel").show();
	}

	EIP.registerUserDefinedAccount = function() {
		$("#account_phrase_generator_panel, #login_panel, #welcome_panel, #custom_passphrase_link").hide();
		$("#account_phrase_custom_panel :input:not(:button):not([type=submit])").val("");
		$("#account_phrase_generator_panel :input:not(:button):not([type=submit])").val("");
		$("#account_phrase_custom_panel").show();
		$("#registration_password").focus();
	}

	EIP.registerAccount = function() {
		$("#login_panel, #welcome_panel").hide();
		$("#account_phrase_generator_panel").show();
		$("#account_phrase_generator_panel step_3 .callout").hide();

		var $loading = $("#account_phrase_generator_loading");
		var $loaded = $("#account_phrase_generator_loaded");

		if (window.crypto || window.msCrypto) {
			$loading.find("span.loading_text").html($.t("generating_passphrase_wait"));
		}

		$loading.show();
		$loaded.hide();

		if (typeof PassPhraseGenerator == "undefined") {
			$.when(
				$.getScript("js/crypto/3rdparty/seedrandom.js"),
				$.getScript("js/crypto/passphrasegenerator.js")
			).done(function() {
				$loading.hide();
				$loaded.show();

				PassPhraseGenerator.generatePassPhrase("#account_phrase_generator_panel");
			}).fail(function(jqxhr, settings, exception) {
				alert($.t("error_word_list"));
			});
		} else {
			$loading.hide();
			$loaded.show();

			PassPhraseGenerator.generatePassPhrase("#account_phrase_generator_panel");
		}
	}

	EIP.verifyGeneratedPassphrase = function() {
		var password = $.trim($("#account_phrase_generator_panel .step_3 textarea").val());

		if (password != PassPhraseGenerator.passPhrase) {
			$("#account_phrase_generator_panel .step_3 .callout").show();
		} else {
			EIP.newlyCreatedAccount = true;
			EIP.login(password);
			PassPhraseGenerator.reset();
			$("#account_phrase_generator_panel textarea").val("");
			$("#account_phrase_generator_panel .step_3 .callout").hide();
		}
	}

	$("#account_phrase_custom_panel form").submit(function(event) {
		event.preventDefault()

		var password = $("#registration_password").val();
		var repeat = $("#registration_password_repeat").val();

		var error = "";

		if (password.length < 35) {
			error = $.t("error_passphrase_length");
		} else if (password.length < 50 && (!password.match(/[A-Z]/) || !password.match(/[0-9]/))) {
			error = $.t("error_passphrase_strength");
		} else if (password != repeat) {
			error = $.t("error_passphrase_match");
		}

		if (error) {
			$("#account_phrase_custom_panel .callout").first().removeClass("callout-info").addClass("callout-danger").html(error);
		} else {
			$("#registration_password, #registration_password_repeat").val("");
			EIP.login(password);
		}
	});

	EIP.login = function(password, callback) {
		if (!password.length) {
			$.growl($.t("error_passphrase_required_login"), {
				"type": "danger",
				"offset": 10
			});
			return;
		} else if (!EIP.isTestNet && password.length < 12 && $("#login_check_password_length").val() == 1) {
			$("#login_check_password_length").val(0);
			$("#login_error .callout").html($.t("error_passphrase_login_length"));
			$("#login_error").show();
			return;
		}

		$("#login_password, #registration_password, #registration_password_repeat").val("");
		$("#login_check_password_length").val(1);

		EIP.sendRequest("getBlockchainStatus", function(response) {
			if (response.errorCode) {
				$.growl($.t("error_server_connect"), {
					"type": "danger",
					"offset": 10
				});

				return;
			}

			EIP.state = response;

			//this is done locally..
			EIP.sendRequest("getAccountId", {
				"secretPhrase": password
			}, function(response) {
				if (!response.errorCode) {
					EIP.account = String(response.accountId).escapeHTML();
					EIP.publicKey = EIP.getPublicKey(converters.stringToHexString(password));
				}

				if (!EIP.account) {
					$.growl($.t("error_find_account_id"), {
						"type": "danger",
						"offset": 10
					});
					return;
				}

				var eftAddress = new EftAddress();

				if (eftAddress.set(EIP.account)) {
					EIP.accountRS = eftAddress.toString();
				} else {
					$.growl($.t("error_generate_account_id"), {
						"type": "danger",
						"offset": 10
					});
					return;
				}

				EIP.sendRequest("getAccountPublicKey", {
					"account": EIP.account
				}, function(response) {
					if (response && response.publicKey && response.publicKey != EIP.generatePublicKey(password)) {
						$.growl($.t("error_account_taken"), {
							"type": "danger",
							"offset": 10
						});
						return;
					}

					if ($("#remember_password").is(":checked")) {
						EIP.rememberPassword = true;
						$("#remember_password").prop("checked", false);
						EIP.setPassword(password);
						$(".secret_phrase, .show_secret_phrase").hide();
						$(".hide_secret_phrase").show();
					}

					$("#account_id").html(String(EIP.accountRS).escapeHTML()).css("font-size", "12px");

					var passwordNotice = "";

					if (password.length < 35) {
						passwordNotice = $.t("error_passphrase_length_secure");
					} else if (password.length < 50 && (!password.match(/[A-Z]/) || !password.match(/[0-9]/))) {
						passwordNotice = $.t("error_passphrase_strength_secure");
					}

					if (passwordNotice) {
						$.growl("<strong>" + $.t("warning") + "</strong>: " + passwordNotice, {
							"type": "danger"
						});
					}

					if (EIP.state) {
						EIP.checkBlockHeight();
					}

					EIP.getAccountInfo(true, function() {
						if (EIP.accountInfo.currentLeasingHeightFrom) {
							EIP.isLeased = (EIP.lastBlockHeight >= EIP.accountInfo.currentLeasingHeightFrom && EIP.lastBlockHeight <= EIP.accountInfo.currentLeasingHeightTo);
						} else {
							EIP.isLeased = false;
						}

						//forging requires password to be sent to the server, so we don't do it automatically if not localhost
						if (!EIP.accountInfo.publicKey || EIP.accountInfo.effectiveBalanceEFT == 0 || !EIP.isLocalHost || EIP.downloadingBlockchain || EIP.isLeased) {
							$("#forging_indicator").removeClass("forging");
							$("#forging_indicator span").html($.t("not_forging")).attr("not_forging");
							$("#forging_indicator").show();
							EIP.isForging = false;
						} else if (EIP.isLocalHost) {
							EIP.sendRequest("startForging", {
								"secretPhrase": password
							}, function(response) {
								if ("deadline" in response) {
									$("#forging_indicator").addClass("forging");
									$("#forging_indicator span").html($.t("forging")).attr("forging");
									EIP.isForging = true;
								} else {
									$("#forging_indicator").removeClass("forging");
									$("#forging_indicator span").html($.t("not_forging")).attr("not_forging");
									EIP.isForging = false;
								}
								$("#forging_indicator").show();
							});
						}
					});

					//EIP.getAccountAliases();

					EIP.unlock();

					if (EIP.isOutdated) {
						$.growl($.t("eip_update_available"), {
							"type": "danger"
						});
					}

					if (!EIP.downloadingBlockchain) {
						EIP.checkIfOnAFork();
					}

					EIP.setupClipboardFunctionality();

					if (callback) {
						callback();
					}

					EIP.checkLocationHash(password);

					$(window).on("hashchange", EIP.checkLocationHash);

					EIP.getInitialTransactions();
				});
			});
		});
	}

	$("#logout_button_container").on("show.bs.dropdown", function(e) {
		if (!EIP.isForging) {
			e.preventDefault();
		}
	});

	EIP.showLockscreen = function() {
		if (EIP.hasLocalStorage && localStorage.getItem("logged_in")) {
			setTimeout(function() {
				$("#login_password").focus()
			}, 10);
		} else {
			EIP.showWelcomeScreen();
		}

		$("#center").show();
	}

	EIP.unlock = function() {
		if (EIP.hasLocalStorage && !localStorage.getItem("logged_in")) {
			localStorage.setItem("logged_in", true);
		}

		var userStyles = ["header", "sidebar", "boxes"];

		for (var i = 0; i < userStyles.length; i++) {
			var color = EIP.settings[userStyles[i] + "_color"];
			if (color) {
				EIP.updateStyle(userStyles[i], color);
			}
		}

		var contentHeaderHeight = $(".content-header").height();
		var navBarHeight = $("nav.navbar").height();

		//	$(".content-splitter-right").css("bottom", (contentHeaderHeight + navBarHeight + 10) + "px");

		$("#lockscreen").hide();
		$("body, html").removeClass("lockscreen");

		$("#login_error").html("").hide();

		$(document.documentElement).scrollTop(0);
	}

	$("#logout_button").click(function(e) {
		if (!EIP.isForging) {
			e.preventDefault();
			EIP.logout();
		}
	});

	EIP.logout = function(stopForging) {
		if (stopForging && EIP.isForging) {
			$("#stop_forging_modal .show_logout").show();
			$("#stop_forging_modal").modal("show");
		} else {
			EIP.setDecryptionPassword("");
			EIP.setPassword("");
			window.location.reload();
		}
	}

	EIP.setPassword = function(password) {
		EIP.setEncryptionPassword(password);
		EIP.setServerPassword(password);
	}
	return EIP;
}(EIP || {}, jQuery));