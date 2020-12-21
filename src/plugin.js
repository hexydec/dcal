import $ from "../node_modules/dabbyjs/dist/dabby.js";
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
