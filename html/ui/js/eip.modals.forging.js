/**
 * @depends {eip.js}
 * @depends {eip.modals.js}
 */
var EIP = (function(EIP, $, undefined) {
	//todo: use a startForgingError function instaed!

	EIP.forms.startForgingComplete = function(response, data) {
		if ("deadline" in response) {
			$("#forging_indicator").addClass("forging");
			$("#forging_indicator span").html($.t("forging")).attr("forging");
			EIP.isForging = true;
			$.growl($.t("success_start_forging"), {
				type: "success"
			});
		} else {
			EIP.isForging = false;
			$.growl($.t("error_start_forging"), {
				type: 'danger'
			});
		}
	}

	EIP.forms.stopForgingComplete = function(response, data) {
		if ($("#stop_forging_modal .show_logout").css("display") == "inline") {
			EIP.logout();
			return;
		}

		$("#forging_indicator").removeClass("forging");
		$("#forging_indicator span").html($.t("not_forging")).attr("not_forging");

		EIP.isForging = false;

		if (response.foundAndStopped) {
			$.growl($.t("success_stop_forging"), {
				type: 'success'
			});
		} else {
			$.growl($.t("error_stop_forging"), {
				type: 'danger'
			});
		}
	}

	$("#forging_indicator").click(function(e) {
		e.preventDefault();

		if (EIP.downloadingBlockchain) {
			$.growl($.t("error_forging_blockchain_downloading"), {
				"type": "danger"
			});
		} else if (EIP.state.isScanning) {
			$.growl($.t("error_forging_blockchain_rescanning"), {
				"type": "danger"
			});
		} else if (!EIP.accountInfo.publicKey) {
			$.growl($.t("error_forging_no_public_key"), {
				"type": "danger"
			});
		} else if (EIP.accountInfo.effectiveBalanceEFT == 0) {
			if (EIP.lastBlockHeight >= EIP.accountInfo.currentLeasingHeightFrom && EIP.lastBlockHeight <= EIP.accountInfo.currentLeasingHeightTo) {
				$.growl($.t("error_forging_lease"), {
					"type": "danger"
				});
			} else {
				$.growl($.t("error_forging_effective_balance"), {
					"type": "danger"
				});
			}
		} else if ($(this).hasClass("forging")) {
			$("#stop_forging_modal").modal("show");
		} else {
			$("#start_forging_modal").modal("show");
		}
	});

	return EIP;
}(EIP || {}, jQuery));