/**
 * @depends {eip.js}
 */
var EIP = (function(EIP, $, undefined) {
	$(".sidebar_context").on("contextmenu", "a", function(e) {
		e.preventDefault();

		if (!EIP.databaseSupport) {
			return;
		}

		EIP.closeContextMenu();

		if ($(this).hasClass("no-context")) {
			return;
		}

		EIP.selectedContext = $(this);

		EIP.selectedContext.addClass("context");

		$(document).on("click.contextmenu", EIP.closeContextMenu);

		var contextMenu = $(this).data("context");

		if (!contextMenu) {
			contextMenu = $(this).closest(".list-group").attr("id") + "_context";
		}

		var $contextMenu = $("#" + contextMenu);

		if ($contextMenu.length) {
			var $options = $contextMenu.find("ul.dropdown-menu a");

			$.each($options, function() {
				var requiredClass = $(this).data("class");

				if (!requiredClass) {
					$(this).show();
				} else if (EIP.selectedContext.hasClass(requiredClass)) {
					$(this).show();
				} else {
					$(this).hide();
				}
			});

			$contextMenu.css({
				display: "block",
				left: e.pageX,
				top: e.pageY
			});
		}

		return false;
	});

	EIP.closeContextMenu = function(e) {
		if (e && e.which == 3) {
			return;
		}

		$(".context_menu").hide();

		if (EIP.selectedContext) {
			EIP.selectedContext.removeClass("context");
			//EIP.selectedContext = null;
		}

		$(document).off("click.contextmenu");
	}

	return EIP;
}(EIP || {}, jQuery));