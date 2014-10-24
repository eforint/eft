/**
 * @depends {eip.js}
 * @depends {eip.modals.js}
 */
var EIP = (function(EIP, $, undefined) {
	$("#account_info_modal").on("show.bs.modal", function(e) {
		$("#account_info_name").val(EIP.accountInfo.name);
		$("#account_info_description").val(EIP.accountInfo.description);
	});

	EIP.forms.setAccountInfoComplete = function(response, data) {
		var name = $.trim(String(data.name));
		if (name) {
			$("#account_name").html(name.escapeHTML());
		} else {
			$("#account_name").html($.t("no_name_set"));
		}
	}

	return EIP;
}(EIP || {}, jQuery));