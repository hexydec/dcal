import $ from "../node_modules/dabbyjs/src/core/core.js";
import "../node_modules/dabbyjs/src/utils/extend/extend.js";
import dcal from "../src/dcal.js";

$.fn.dcal = function () {
	let i = this.length;
	while (i--) {
		const $this = $(this[i]),
			config = $.extend({
				type: "date"
			}, $this.data("dcal") || {});
		new dcal($this, config);
	}
};
