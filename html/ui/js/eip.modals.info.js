/**
 * @depends {eip.js}
 * @depends {eip.modals.js}
 */
var EIP = (function(EIP, $, undefined) {
	$("#eip_modal").on("show.bs.modal", function(e) {
		if (EIP.fetchingModalData) {
			return;
		}

		EIP.fetchingModalData = true;

		EIP.sendRequest("getState", function(state) {
			for (var key in state) {
				var el = $("#eip_node_state_" + key);
				if (el.length) {
					if (key.indexOf("number") != -1) {
						el.html(EIP.formatAmount(state[key]));
					} else if (key.indexOf("Memory") != -1) {
						el.html(EIP.formatVolume(state[key]));
					} else if (key == "time") {
						el.html(EIP.formatTimestamp(state[key]));
					} else {
						el.html(String(state[key]).escapeHTML());
					}
				}
			}

			$("#eip_update_explanation").show();
			$("#eip_modal_state").show();

			EIP.fetchingModalData = false;
		});
	});

	$("#eip_modal").on("hide.bs.modal", function(e) {
		$("body").off("dragover.eip, drop.eip");

		$("#eip_update_drop_zone, #eip_update_result, #eip_update_hashes, #eip_update_hash_progress").hide();

		$(this).find("ul.nav li.active").removeClass("active");
		$("#eip_modal_state_nav").addClass("active");

		$(".eip_modal_content").hide();
	});

	$("#eip_modal ul.nav li").click(function(e) {
		e.preventDefault();

		var tab = $(this).data("tab");

		$(this).siblings().removeClass("active");
		$(this).addClass("active");

		$(".eip_modal_content").hide();

		var content = $("#eip_modal_" + tab);

		content.show();
	});

	return EIP;
}(EIP || {}, jQuery));