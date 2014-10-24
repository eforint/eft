/**
 * @depends {eip.js}
 * @depends {eip.modals.js}
 */
var EIP = (function(EIP, $, undefined) {
	$("#account_details_modal").on("show.bs.modal", function(e) {
		$("#account_details_modal_qr_code").empty().qrcode({
			"text": EIP.accountRS,
			"width": 128,
			"height": 128
		});

		$("#account_details_modal_balance").show();

		if (EIP.accountInfo.errorCode && EIP.accountInfo.errorCode != 5) {
			$("#account_balance_table").hide();
			//todo
			$("#account_balance_warning").html(String(EIP.accountInfo.errorDescription).escapeHTML()).show();
		} else {
			$("#account_balance_warning").hide();

			if (EIP.accountInfo.errorCode && EIP.accountInfo.errorCode == 5) {
				$("#account_balance_balance, #account_balance_unconfirmed_balance, #account_balance_effective_balance, #account_balance_guaranteed_balance").html("0 EFT");
				$("#account_balance_public_key").html(String(EIP.publicKey).escapeHTML());
				$("#account_balance_account_rs").html(String(EIP.accountRS).escapeHTML());
				$("#account_balance_account").html(String(EIP.account).escapeHTML());
			} else {
				$("#account_balance_balance").html(EIP.formatAmount(new BigInteger(EIP.accountInfo.balanceNQT)) + " EFT");
				$("#account_balance_unconfirmed_balance").html(EIP.formatAmount(new BigInteger(EIP.accountInfo.unconfirmedBalanceNQT)) + " EFT");
				$("#account_balance_effective_balance").html(EIP.formatAmount(EIP.accountInfo.effectiveBalanceEFT) + " EFT");
				$("#account_balance_guaranteed_balance").html(EIP.formatAmount(new BigInteger(EIP.accountInfo.guaranteedBalanceNQT)) + " EFT");

				$("#account_balance_public_key").html(String(EIP.accountInfo.publicKey).escapeHTML());
				$("#account_balance_account_rs").html(String(EIP.accountInfo.accountRS).escapeHTML());
				$("#account_balance_account").html(String(EIP.account).escapeHTML());

				if (!EIP.accountInfo.publicKey) {
					$("#account_balance_public_key").html("/");
					$("#account_balance_warning").html($.t("no_public_key_warning") + " " + $.t("public_key_actions")).show();
				}
			}
		}
	});

	$("#account_details_modal ul.nav li").click(function(e) {
		e.preventDefault();

		var tab = $(this).data("tab");

		$(this).siblings().removeClass("active");
		$(this).addClass("active");

		$(".account_details_modal_content").hide();

		var content = $("#account_details_modal_" + tab);

		content.show();
	});

	$("#account_details_modal").on("hidden.bs.modal", function(e) {
		$(this).find(".account_details_modal_content").hide();
		$(this).find("ul.nav li.active").removeClass("active");
		$("#account_details_balance_nav").addClass("active");
		$("#account_details_modal_qr_code").empty();
	});

	return EIP;
}(EIP || {}, jQuery));