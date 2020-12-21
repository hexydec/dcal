import $ from "../node_modules/dabbyjs/dist/dabby.js";

export default class dcal {

	constructor(obj, config) {
		this.obj = $(obj);
		this.name = this.obj.attr("name");
		this.rendered = false;

		this.obj.on("focus", () => {
			if (!this.rendered) {

				// convert min and max to date objects
				if (config) {
					["min", "max"].forEach(item => {
						if (config[item] && !(config[item] instanceof Date)) {
							config[item] = new Date(config[item]);
						}
					});
				}

				// merge default config
				this.config = $.extend({
					type: "date",
					min: null,
					max: null,
					headings: ["Hrs", "Mins", "Secs"],
					groupsec: 15,
					cls: "dcal"
				}, config || {});
				this.date = this.config.type.indexOf("date") > -1;
				this.time = this.config.type.indexOf("time") > -1;

				// create HTML structure
				this.calendar = $("<div>", {"class": this.config.cls});
				const cls = this.config.cls + "__",
					html = $("<div>", {"class": cls + "calendar"});

				// render date control
				if (this.date) {
					const date = $("<div>", {"class": cls + "date"}),
						year = new Date().getFullYear(),
						years = $("<section>", {"class": cls + "years"}),
						months = $("<section>", {"class": cls + "months"}),
						dates = $("<section>", {"class": cls + "dates"});

					// render years
					this.render(years, "year", year - 2, year + 2);
					date.append(years);

					// render months
					this.render(months, "month", 0, 11, i => {
						const date = new Date(2020, i, 1, 0, 0, 0);
						return date.toLocaleString("default", {month: "short"});
					});
					date.append(months);

					// render days
					const day = new Date(Date.UTC(1999, 11, 13));
					for (let i = 0; i < 7; i++) {
						dates.append($("<div>", {
							"class": cls + "dates-days",
							text: day.toLocaleString("default", {weekday: "short"}).substr(0, 2)
						}));
						day.setDate(day.getDate() + 1);
					}
					this.render(dates, "day", 1, 31);
					date.append(dates);
					html.append(date);
				}

				// render time control
				if (this.time) {
					const hours = $("<section>", {"class": cls + "hours"})
							.append($("<h3>", {"class": cls + "heading", text: this.config.headings[0]})),
						hours1 = $("<div>", {"class": cls + "group"}),
						hours2 = $("<div>", {"class": cls + "group"}),
						mins = $("<section>", {"class": cls + "mins"})
							.append($("<h3>", {"class": cls + "heading", text: this.config.headings[1]})),
						mins1 = $("<div>", {"class": cls + "group"}),
						mins2 = $("<div>", {"class": cls + "group"}),
						secs = $("<section>", {"class": cls + "secs"})
							.append($("<h3>", {"class": cls + "heading", text: this.config.headings[2]})),
						secs1 = $("<div>", {"class": cls + "group"}),
						pad = i => i.toString().padStart(2, "0");

					// render hours
					this.render(hours1, "hour", 0, 11, pad);
					this.render(hours2, "hour", 12, 23, pad);
					hours.append(hours1).append(hours2);
					html.append(hours);

					// render minutes
					this.render(mins1, "min1", 0, 5);
					this.render(mins2, "min2", 0, 9);
					mins.append(mins1).append(mins2);
					html.append(mins);

					// render seconds
					if (this.config.groupsec) {
						this.render(secs1, "sec", 0, 3, i => (i * 15).toString().padStart(2, "0"));
						secs.append(secs1);
					} else {
						const secs2 = $("<div>", {"class": cls + "group"});
						this.render(secs1, "sec1", 0, 4);
						this.render(secs2, "sec2", 5, 9);
						mins.append(secs1).append(secs2);
						html.append(secs);
					}
					html.append(secs);
				}
				this.obj.after(this.calendar.append(html));
				this.rendered = true;
			}
			this.show();
		}).on("blur", () => {
			if (!$(document.activeElement, this.calendar).length) {
				this.hide();
			}
		});

		this.obj.on("change", () => {
			this.get();
		});
	}

	set(value) {
		const cls = this.config.cls + "__";
		if (this.date) {
			$("." + cls + "months ." + cls + "control", this.calendar)
				.removeClass(cls + "control--on")
				.eq(value.getMonth())
				.addClass(cls + "control--on");
		}
		if (this.time) {
			let items = {hours: "getHour", minutes: "getMinute"};
			if (this.config.groupsec) {
				items.seconds = "getSecond";
			}
			$.each(items, (func, name) => {
				$("." + cls + name + " ." + cls + "control", this.calendar)
					.removeClass(cls + "control--on")
					.eq(value[func]())
					.addClass(cls + "control--on");
			});
		}
	}

	get() {
		let val = this.obj.val();
		if (val) {

			// swap date and month for UK
			if (["en-GB", "en-CY"].indexOf(navigator.language) > -1) {
				const match = val.match(/^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{2,4})(.*)/);
				if (match) {
					val = match[2] + "/" + match[1] + "/" + match[3] + match[4];
				}
			}

			// parse date
			const milli = Date.parse(val);
			if (!Number.isNaN(milli)) {
				const date = new Date(val),
					name = this.name,
					update = {};
				if (this.date) {
					update.year = date.getFullYear();
					update.month = date.getMonth();
					update.day = date.getDate();
				}
				if (this.time) {
					update.hour = date.getHours();
					const min = date.getMinutes().toString().padStart(2, "0");
					update.min1 = min.substr(0, 1);
					update.min2 = min.substr(1, 1);
					if (this.config.groupsec) {
						update.sec = date.getSeconds();
					} else {
						const sec = date.getSeconds().toString().padStart(2, "0");
						update.sec1 = sec.substr(0, 1);
						update.sec2 = sec.substr(1, 1);
					}
				}

				// update the calendar
				$.each(update, (key, value) => {
					$("input[type=radio][name="+name+"-"+key+"][value='"+value+"']").prop("checked", true);
				});
			}
		}
	}

	update() {
		const items = [];
		if (this.date) {
			items.push("year");
			items.push("month");
			items.push("day");
		}
		if (this.time) {
			items.push("hour");
			items.push("min1");
			items.push("min2");
			if (this.config.groupsec) {
				items.push("sec");
			} else {
				items.push("sec1");
				items.push("sec2");
			}
		}
		const value = {},
			update = items.every(item => {
				const obj = $("input[type=radio][name="+this.name+"-"+item+"]:checked", this.calendar);
				if (obj.length) {
					value[item] = parseInt(obj.val());
					return true;
				}
				return false;
			});

		// set the dates to the right day
		if (value.year && typeof value.month !== "undefined") {
			const day = new Date(value.year, value.month, 1).getDay(),
				last = new Date(value.year, value.month+1, 0).getDate();
			$("."+this.config.cls+"__control[for='date-day-1']", this.calendar).data("start", day);
			$("input[type=radio][name="+this.name+"-day]", this.calendar).each((key, item) => {
				const self = $(item);
				self.prop("disabled", self.val() > last);
			});
		}

		// we have all the values, so update
		if (update) {
			const obj = new Date(
				value.year || 1980,
				value.month || 11,
				value.day || 13,
				value.hour,
				value.min1.toString().concat(value.min2),
				value.sec || value.sec1.toString().concat(value.sec2)
			);
			this.obj.val(new Intl.DateTimeFormat("default", {
				dateStyle: date ? "short" : null,
				timeStyle: time ? "medium" : null
			}).format(obj));
		}
	}

	show(value) {
		this.calendar.addClass(this.config.cls + "--show");
		this.get();
	}

	hide() {
		this.calendar.removeClass(this.config.cls + "--show");
	}

	render(obj, name, start, end, func) {
		for (let i = start; i <= end; i++) {
			obj.append(
				$("<input>", {
					type: "radio",
					name: this.name + "-" + name,
					id: this.name + "-" + name + "-" + i,
					value: i,
					"class": this.config.cls + "__control-radio",
					change: () => this.update()
				})
			)
			.append(
				$("<label>", {
					"class": this.config.cls + "__control",
					for: this.name + "-" + name + "-" + i,
					text: func ? func(i) : i.toString()
				})
			);
		}
	}
}
