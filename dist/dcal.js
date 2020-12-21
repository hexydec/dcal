/* dcal by hexydec */
/*! dabbyjs v0.9.12 by Will Earp - https://github.com/hexydec/dabby */

const $ = function dabby(selector, context) {
	if (this instanceof dabby) {
		let nodes = [],
			match;

		// if no selector, return empty collection
		if (selector) {

			// handle string selector first
			if (typeof selector === "string") {

				// CSS selector
				if (selector[0] !== "<") {

					// normalise context
					if (!context) {
						context = [document];
					} else if (typeof context === "string") {
						context = [document.querySelector(context)];
					} else if (context.nodeType) {
						context = [context];
					}

					// if the context exists, filter
					if (context.length) {
						let i = context.length;
						while (i--) {
							nodes = Array.from(context[i].querySelectorAll(selector)).concat(nodes);
						}
					}

				// create a single node and attach properties
				} else if ((match = selector.match(/^<([a-z0-9]+)(( ?\/)?|><\/\1)>$/i)) !== null) {
					nodes = [document.createElement(match[1])];

					// context is CSS attributes
					if ($.isPlainObject(context)) {
						$(nodes).attr(context);
					}

				// parse HTML into nodes
				} else {
					nodes = $.parseHTML(selector, context || document, true);
				}

			// $ collection
			} else if (selector instanceof dabby) {
				return selector;

			// single node
			} else if (selector.nodeType) {
				if ([1, 9, 11].indexOf(selector.nodeType) > -1) {
					nodes = [selector];
				}

			} else if ($.isWindow(selector)) {
				nodes = [selector];

			// ready function
			} else if ($.isFunction(selector)) {
				if (document.readyState !== "loading") {
					selector.call(document, $);
				} else {
					document.addEventListener("DOMContentLoaded", () => selector.call(document, $), {once: true});
				}

			// array|NodeList|HTMLCollection of nodes
			} else {

				// check node is unique, then filter only element, document, documentFragment and window
				nodes = Array.from(selector).filter(
					(node, i, self) => self.indexOf(node) === i && ([1, 9, 11].indexOf(node.nodeType) > -1 || $.isWindow(node))
				);
			}
		}

		// assign nodes to object
		let i = nodes.length;
		this.length = i;
		while (i--) {
			this[i] = nodes[i];
		}
		return this;
	} else {
		return new dabby(selector, context);
	}
};

// alias functions
$.fn = $.prototype;

$.each = (obj, callback) => {
	const isArr = Array.isArray(obj),
		keys = Object.keys(obj),
		len = keys.length;

	for (let i = 0; i < len; i++) {
		if (callback.call(obj[keys[i]], isArr ? parseInt(keys[i]) : keys[i], obj[keys[i]]) === false) {
			break; // stop if callback returns false
		}
	}
	return obj;
};

$.fn.each = function (callback) {
	$.each(Array.from(this), callback);
	return this;
};

$.isWindow = obj => obj !== null && obj === obj.window;

$.isFunction = func => func && func.constructor === Function;

$.parseHTML = (html, context, runscripts = false) => {

	// sort out args
	if (typeof context === "boolean") {
		runscripts = context;
		context = null;
	}

	// prepare context
	if (!context) {
		context = document.implementation.createHTMLDocument("");
	}

	// create a vessel to parse HTML into
	const obj = context.createElement("div");
	obj.innerHTML = html;

	// run scripts
	if (runscripts && html.indexOf("<script") > -1) {
		Array.from(obj.querySelectorAll("script")).forEach(item => {
			const src = item.getAttribute("src"),
				script = context.createElement("script");
			if (src) {
				script.src = src;
			} else {
				script.text = item.innerText;
			}
			context.head.appendChild(script);
		});
	}

	// extract nodes
	return Array.from(obj.children);
};

$.isPlainObject = obj => {

	// Basic check for Type object that's not null
	if (obj !== null && typeof obj === "object") {

		// If Object.getPrototypeOf supported, use it
	    if (typeof Object.getPrototypeOf === "function") {
			let proto = Object.getPrototypeOf(obj);
			return proto === Object.prototype || proto === null;
		}

		// Otherwise, use internal class
		// This should be reliable as if getPrototypeOf not supported, is pre-ES5
		return Object.prototype.toString.call(obj) === "[object Object]";
 	}

 	// Not an object
	return false;
};

$.extend = (...arrs) => {
	if (arrs[0] === true) {

		// merge function will recursively merge items
		function merge(target, ...sources) {
			if (sources.length) {

				// work on next source
				const source = sources.shift();
				if ($.isPlainObject(target) && $.isPlainObject(source)) {

					// loop through each property
					$.each(source, (i, val) => {

						// merge recursively if source is object, if target is not object, overwrite
						if ($.isPlainObject(val)) {
							target[i] = $.isPlainObject(target[i]) ? merge(target[i], val) : val;

						// when source property is value just overwrite
						} else {
							target[i] = val;
						}
					});
				}

				// merge next source
			    return merge(target, ...sources);
			}
			return target;
		}
		return merge.apply(null, arrs.slice(1));
	}
	return Object.assign.apply(null, arrs);
};

$.param = obj => {
	let params = [],
		add = (key, value, params) => {
			let isArr = Array.isArray(value);
			if (isArr || typeof value === "object") {
				$.each(value, (i, val) => {
					params = add(`${key}[${isArr ? "" : i}]`, val, params);
				});
			} else {
				if ($.isFunction(value)) {
					value = value();
				}
				params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value === null ? "" : value));
			}
			return params;
		};

	// process values
	$.each(obj, (key, item) => {
		params = add(key, item, params);
	});
	return params.join("&");
};

$.ajax = (url, settings) => {

	// normalise args
	if (url !== null && typeof url === "object") {
		settings = url;
	} else {
		if (typeof settings !== "object") {
			settings = {};
		}
		settings.url = url;
	}

	// set default settings
	settings = Object.assign({
		method: "GET",
		cache: null, // start with null so we can see if explicitly set
		data: null,
		dataType: null, // only changes behavior with json, jsonp, script
		async: true,
		crossDomain: false,
		scriptAttrs: {},
		jsonp: "callback",
		jsonpCallback: "dabby" + Date.now(),
		headers: {
			"X-Requested-With": "XMLHttpRequest"
		},
		xhr: () => new XMLHttpRequest(),
		contentType: null,
		context: null,
		statusCode: {},
		username: null,
		password: null,
		xhrFields: {}
	}, settings);

	// set to itself
	if (settings.url == null) { // double equals as also captures undefined
		settings.url = location.href;
	}

	// determine datatype
	if (!settings.dataType && settings.url.split("?")[0].split(".").pop() === "js") {
		settings.dataType = "script";
	}

	let sync = ["script", "jsonp"].indexOf(settings.dataType) > -1,
		join = settings.url.indexOf("?") > -1 ? "&" : "?",
		script, data;

	// process data add data to query string for GET requests
	if (settings.data) {
		data = $.isPlainObject(settings.data) ? $.param(settings.data) : settings.data;

		if (settings.method === "GET") {
			settings.url += join + data;
			join = "&";
			data = null;
		}
	}

	// add cache buster
	if (settings.cache || (settings.cache === null && sync)) {
		settings.url += join + "_=" + (+new Date());
		join = "&";
	}

	// fetch script
	if (sync || settings.crossDomain) {
		script = document.createElement("script");
		$.each(settings.scriptAttrs, (key, item) => {
			script.setAttribute(key, item);
		});

		// add callback parameter
		if (settings.dataType === "jsonp") {
			settings.url += join + settings.jsonp + "=" + settings.jsonpCallback;
		}

		// setup event callbacks
		$.each({
			load: "success",
			error: "error"
		}, (key, value) => {
			script.addEventListener(key, () => {
				const response = settings.dataType === "jsonp" ? window[settings.jsonpCallback] || null : null;
				[settings[value], settings.complete].forEach(callback => {
					if (callback) {
						callback.apply(settings.context || settings, callback === settings.complete ? [null, value] : [response, value]);
					}
				});
			}, {once: true});
		});

		script.src = settings.url;
		script.async = settings.async;
		document.head.appendChild(script);

	// make xhr request
	} else {
		const xhr = settings.xhr(),
			callback = (xhr, type, status) => {
				let response = xhr.responseText;

				// parse JSON
				if (["json", null, undefined].indexOf(settings.dataType) > -1) {
					try {
						response = JSON.parse(response);
					} catch (e) {
						// do nothing
					}
				}

				// run callbacks
				[settings.statusCode[xhr.status], settings[type], settings.complete].forEach((callback, i) => {
					if (callback) {
						callback.apply(settings.context || settings, i < 2 ? [response, status, xhr] : [xhr, status]);
					}
				});
			};

		// XHR settings
		$.each(settings.xhrFields, (key, value) => xhr[key] = value);

		// callbacks
		xhr.onload = () => {
			const status = [200, 204, 304].indexOf(xhr.status) > -1 ? "success" : "error";
			callback(xhr, status, status);
		};
		xhr.ontimeout = () => {
			callback(xhr, "error", "timeout");
		};
		xhr.onabort = () => {
			callback(xhr, "error", "abort");
		};
		xhr.onerror = () => {
			callback(xhr, "error", "error");
		};

		xhr.open(settings.method, settings.url, settings.async, settings.username, settings.password);

		// add headers
		if (typeof data === "string" && !settings.contentType) {
			settings.contentType = "application/x-www-form-urlencoded; charset=UTF-8";
		}
		if (settings.contentType) {
			settings.headers["Content-Type"] = settings.contentType;
		}
		$.each(settings.headers, (key, value) => {
			xhr.setRequestHeader(key, value);
		});

		// send request
		xhr.send(data);
		return xhr;
	}
};

["get", "post"].forEach(name => {
	$[name] = (url, data, success, type) => {
		const isFunc = $.isFunction(data);
		let settings = url !== null && typeof url === "object" ? url : {
			url: url,
			data: isFunc ? {} : data,
			success: isFunc ? data : success,
			dataType: isFunc ? success : type
		};
		settings.method = name.toUpperCase();
		return $.ajax(settings);
	};
});

$.getScript = (url, success) => $.ajax({
	url: url,
	dataType: "script",
	success: success
});

var filterNodes = (dabby, filter, context, not) => {
	let func,
		nodes = dabby.nodeType ? [dabby] : Array.from(dabby);

	// sort out args
	if (typeof context === "boolean") {
		not = context;
		context = null;
	}

	// custom filter function
	if ($.isFunction(filter)) {
		func = filter;

	// nodes
	} else {

		// normalise filters
		if (typeof filter === "string") {
			filter = [filter];
		} else {
			filter = Array.from($(filter, context));
		}

		// default filter function
		func = (n, node) => {
			let i = filter.length;
			while (i--) {
				if (typeof(filter[i]) === "string" && node.matches ? node.matches(filter[i]) : node === filter[i]) {
					return true;
				}
			}
			return false;
		};
	}
	return nodes.filter((item, i) => func.call(item, i, item) === !not, nodes);
};

["filter", "not", "is"].forEach(name => {
	$.fn[name] = function (selector) {
		const nodes = filterNodes(this, selector, name === "not");
		return name === "is" ? !!nodes.length : $(nodes);
	};
});

$.fn.load = function (url, data, success) {
	if (this[0]) {

		// get selector from URL
		url = url.split(" ", 2);
		const uri = url[0],
			selector = url[1];

		// check for data
		if ($.isFunction(data)) {
			success = data;
			data = undefined;
		}

		// make AJAX request
		$.ajax(uri, {
			data: data,
			type: data instanceof Object ? "POST" : "GET",
			success: (response, status, xhr) => {

				// if a selector is specified, find it in the returned document
				let html = "",
					i = this.length;

				// refine by selector if supplied
				if (selector) {
					html = $(response, this[0].ownerDocument).filter(selector);
				} else {
					html = response;
				}

				// set HTML to nodes in collection
				this.append(html);

					// fire success callback on nodes
				if (success) {
					while (i--) {
						success.call(this[i], response, status, xhr);
					}
				}
			}
		});
	}
	return this;
};

/**
 * compiles values for each object passed to it
 *
 * @param {array|object} obj An array or interatable object from which to generate values
 * @param {mixed} val Can be a static primitive value, object, or function, objects will be cloned, functions will generate a value per item
 * @param {mixed} current The current value or a callback to retrieve the current value
 * @return {array} An array of values corresponding to each obj
 */
var getVal = (obj, val, current) => {
	let i = obj.length,
		values = [];

	// only do something if there is something to do
	if (i) {

		// chek what types of data we are dealing with
		const funcVal = $.isFunction(val),
			objVal = funcVal ? 0 : $.isPlainObject(val),
			funcCurrent = $.isFunction(current);

		// generate calues
		while (i--) {

			// generate the value from a function
			if (funcVal) {
				values[i] = val.call(obj[i], i, funcCurrent ? current(obj[i]) : current);

			// clone if value is an object
			} else if (objVal) {
				values[i] = Object.create(val);

			// plain value
			} else {
				values[i] = val;
			}
		}
	}
	return values;
};

$.map = (obj, callback) => {
	let arr = [];
	$.each(obj, (i, item) => {
		const result = callback.call(window, item, i);
		if (result != null) { // double equals to capture undefined also
			arr = arr.concat(Array.isArray(result) ? result : [result]);
		}
	});
	return arr;
};

$.fn.val = function (value) {

	// set value
	if (value !== undefined) {
		let i = this.length,
			values = getVal(this, value, obj => obj.val());

		while (i--) {
			const isArr = Array.isArray(values[i]);

			// array on select, set matching values to selected
			if (this[i].type.indexOf("select") > -1) {
				values[i] = (isArr ? values[i] : [values[i]]).map(val => "" + val);
				$("option", this[i]).each((key, obj) => {
					obj.selected = values[i].indexOf(obj.value || obj.text) > -1;
				});

			// set the checked attribute for radios and checkbox
			} else if (isArr) {
				this[i].checked = values[i].indexOf(this[i].value) > -1;

			// string value, just set to value attribute
			} else {
				this[i].value = values[i];
			}
		}
		return this;
	}

	// read value from first node
	if (this[0]) {

		// get multiple values
		if (this[0].type === "select-multiple") {
			let values = [];
			$("option", this[0]).each((key, obj) => {
				if (obj.selected) {
					values.push("" + obj.value);
				}
			});
			return values;
		}

		// get single value
		if (this[0].type !== "checkbox" || this[0].checked) {
			return "" + this[0].value;
		}
	}
};

$.fn.serialize = function () {
	const selector = "input[name]:not([type=file]):not([type=submit]):not([type=radio]):not([type=checkbox]),input[name]:checked,textarea[name],select[name]",
		add = (name, value, params) => {
			let match;

			if ((match = name.match(/([^\[]*)\[([^\]]*)\](.*)/)) !== null) {
				name = match[1];
				let arr = add(match[2] + match[3], value, params[name] || {});
				value = arr;
			}

			if (name !== "") {
				params[name] = value;
			} else {
				if (!Array.isArray(params)) {
					params = [];
				}
				params = params.concat(Array.isArray(value) ? value : [value]);
			}
			return params;
		};
	let obj = this.filter(selector);

	if (!obj.length) {
		obj = $(selector, this);
	}

	let params = {};

	// process values
	obj.each((key, obj) => {
		const value = $(obj).val();
		if (!obj.disabled && value !== undefined) {
			params = add(obj.name, value, params);
		}
	});
	return $.param(params);
};

$.fn.get = function (i) {
	return i === undefined ? Array.from(this) : this[i >= 0 ? i : i + this.length];
};

$.fn.add = function (nodes, context) {
	nodes = $(nodes, context).get();
	return $(Array.from(this).concat(nodes));
};

["parent", "parents", "parentsUntil"].forEach(func => {
	const all = func.indexOf("s") > -1,
		until = func.indexOf("U") > -1;

	$.fn[func] = function (selector, filter) {
		let nodes = [],
			i = this.length;

		while (i--) {
			let parent = this[i].parentNode;
			while (parent && parent.nodeType === Node.ELEMENT_NODE) {
				if (until && filterNodes(parent, selector).length) {
					break;
				}
				nodes.push(parent);
				if (!all) {
					break;
				}
				parent = parent.parentNode;
			}
		}
		if (!until) {
			filter = selector;
		}
		return $(filter ? filterNodes(nodes, filter) : nodes);
	};
});

// add and remove event handlers
["on", "one"].forEach(name => {
	$.fn[name] = function (events, selector, data, callback) {
		if (this.length) {

			// sort out args
			if ($.isFunction(selector)) {
				callback = selector;
				selector = undefined;
			} else if ($.isFunction(data)) {
				callback = data;
				data = undefined;
			}

			// stadardise as plain object
			if (!$.isPlainObject(events)) {
				const evt = events;
				events = {};
				events[evt] = callback;
			}

			// attach event
			let i = this.length;
			while (i--) {

				// record the original function
				if (!this[i].events) {
					this[i].events = [];
				}

				// loop through functions
				$.each(events, (evt, func) => {
					evt.split(" ").forEach(e => {

						// record event
						const event = {
							event: e,
							selector: selector,
							data: data,
							callback: func,
							func: evt => { // delegate function
								const target = selector ? $(selector, evt.currentTarget).filter(evt.target).get() : [evt.currentTarget];
								if (target.length) {
									evt.data = data; // set data to event object
									for (let n = 0, len = target.length; n < len; n++) {
										if (func.call(target[n], evt, evt.args) === false) {
											evt.preventDefault();
											evt.stopPropagation();
										}
									}
								}
							},
							once: name === "one"
						};
						this[i].events.push(event);

						// bind event
						this[i].addEventListener(e, event.func, {once: name === "one", capture: !!selector});
					});
				});
			}
		}
		return this;
	};
});

var events = ["focusin", "focusout", "focus", "blur", "resize", "scroll", "unload", "click", "dblclick", "mousedown", "mouseup", "mousemove", "mouseover", "mouseout", "mouseenter", "mouseleave", "contextmenu", "change", "select", "keydown", "keypress", "keyup", "error", "submit"];

$.fn.attr = function (prop, value) {
	let isObj = typeof prop !== "string",
		obj = {};

	// set properties
	if (isObj || value !== undefined) {

		// normalise to object
		if (!isObj) {
			obj[prop] = value;
			prop = obj;
		}

		$.each(prop, (key, val) => {

			// if event, hand it off to $.fn.on()
			if (events.indexOf(key) > -1) {
				this.on(key, val);

			// process other values
			} else {
				let i = this.length,
					values = getVal(this, val, obj => $(obj).attr(key));
				while (i--) {
					if (key === "style") {
						this[i].style.cssText = values[i];
					} else if (key === "class") {
						this[i].className = values[i];
					} else if (key === "text") {
						this[i].textContent = values[i];
					} else if (values[i] === null) {
						this[i].removeAttribute(key);
					} else {
						this[i].setAttribute(key, values[i]);
					}
				}
			}
		});
		return this;
	} else if (this.length) {

		// retrieve properties
		if (prop === "style") {
			return this[0].style.cssText;
		}
		if (prop === "class") {
			return this[0].className;
		}
		return this[0].getAttribute(prop);
	}
};

const funcs = [];
["removeClass", "addClass", "toggleClass"].forEach((func, f) => {

	// remove "Class" from name for classList method and remember
	funcs.push(func.substr(0, func.length - 5));

	// create function
	$.fn[func] = function (cls, state) {
		if (this.length) {
			let i = this.length,
				values = getVal(this, cls, obj => obj.className),
				key = f;

			if (func === "toggleClass" && typeof state === "boolean") {
				key = 0 + state;
			}

			// manage classes on nodes
			while (i--) {
				if (typeof values[i] === "string") {
					values[i] = values[i].split(" ");
				}
				for (let n = 0, len = values[i].length; n < len; n++) {
					this[i].classList[funcs[key]](values[i][n]);
				}
			}
		}
		return this;
	};
});

var camelise = prop => prop.replace(/-([\w])/g, (text, letter) => letter.toUpperCase()); // matches underscore too but you shouldn't do that anyway

var setCss = (dabby, props, value) => {

	// normalise props
	if (typeof props === "string") {
		const name = props;
		props = {};
		props[name] = value;
	}

	// prepare values
	let values = {};
	$.each(props, (i, prop) => {
		values[camelise(i)] = getVal(dabby, prop, obj => obj.style[i]);
	});

	// set properties
	$.each(values, (key, val) => {
		let i = dabby.length;
		while (i--) {
			dabby[i].style[key] = val[i] + (!val[i] || isNaN(val[i]) ? "" : "px");
		}
	});
	return dabby;
};

$.fn.css = function (props, value) {

	// set the values
	if (value !== undefined || $.isPlainObject(props)) {
		return setCss(this, props, value);
	}

	// retrieve value from first property
	if (this[0]) {
		let name = props,
			i,
			style = getComputedStyle(this[0], ""),
			output = {},
			ret = false;

		// requested single value, normalise to array
		if (typeof name === "string") {
			props = [name];
			ret = true;
		}

		// gather values
		i = props.length;
		while (i--) {
			output[props[i]] = style[camelise(props[i])];
			if (ret) {
				return output[props[i]];
			}
		}
		return output;
	}
};

$.fn.data = function (name, data) {

	// convert data to object
	if (typeof name === "object") {
		data = name;
	} else if (data !== undefined) {
		let temp = {};
		temp[name] = data;
		data = temp;
	}

	// set value
	if (data !== undefined) {
		let i = this.length;
		while (i--) {
			$.each(data, (key, value) => {
				this[i].dataset[camelise(key)] = typeof value === "object" ? JSON.stringify(value) : value;
			});
		}
		return this;
	}

	// get value
	if (this[0] && this[0].dataset) {
		let parse = value => {
			try {
				return JSON.parse(value);
			} catch (e) {
				return value;
			}
		};

		// all properties
		if (name === undefined) {
			let arr = {};
			$.each(this[0].dataset, (key, value) => {
				arr[key] = parse(value);
			});
			return arr;
		}

		// retrieve specific property
		name = camelise(name);
		if (this[0].dataset.hasOwnProperty(name)) {
			return parse(this[0].dataset[name]);
		}
	}
};

$.fn.hasClass = function (cls) {
	let i = this.length;
	while (i--) {
		if (this[i].classList.contains(cls)) {
			return true;
		}
	}
	return false;
};

var getProp = prop => {
	let properties = {
		"for": "htmlFor",
		"class": "className",
		"tabindex": "tabIndex",
		"readonly": "readOnly",
		"maxlength": "maxLength",
		"cellspacing": "cellSpacing",
		"cellpadding": "cellPadding",
		"rowspan": "rowSpan",
		"colspan": "colSpan",
		"usemap": "useMap",
		"frameborder": "frameBorder",
		"contenteditable": "contentEditable"
	};
	return properties[prop.toLowerCase()] || prop;
};

$.fn.prop = function (prop, value) {
	const isObj = $.isPlainObject(prop);

	// set
	if (value !== undefined || isObj) {

		// only work if there are nodes to work on
		if (this[0]) {

			// normalise values
			if (!isObj) {
				const tmp = {};
				tmp[prop] = value;
				prop = tmp;
			}

			// set properties
			$.each(prop, (key, val) => {
				val = getVal(this, val, obj => obj[key]);
				key = getProp(key); // do after
				let i = this.length;
				while (i--) {
					this[i][key] = val[i];
				}
			});
		}
		return this;
	}

	// get
	if (this[0]) {
		return this[0][getProp(prop)];
	}
};

$.fn.removeProp = function (prop) {
	let i = this.length;
	prop = getProp(prop);

	while (i--) {
		delete this[i][prop];
	}
	return this;
};

// store for current values
const display = [],
	obj = [],
	defaults = [],
	values = ["none", "block"];

["hide", "show", "toggle"].forEach((func, n) => {

	// attach function
	$.fn[func] = function (show) {

		// for toggle they can set the show value
		if (n === 2 && show !== undefined) {
			n = parseInt(show);
		}

		// loop through each node
		let i = this.length;
		while (i--) {
			let item = obj.indexOf(this[i]),
				current = item > -1 && n < 2 ? null : getComputedStyle(this[i]).display;

			// cache the initial value of the current
			if (item === -1) {
				item = obj.length;
				obj.push(this[i]);
				display.push(current);
				defaults.push(this[i].style.display);
			}

			// determine if we are going to show or hide
			let value = values[n] || (current === "none" ? "block" : "none");

			// if show update the block value to the initial if it was not "none"
			if (value !== "none" && display[item] !== "none") {
				value = display[item];
			}

			// update the value, use the default if setting back to initial
			this[i].style.display = value === display[item] ? defaults[item] : value;
		}
		return this;
	};
});

$.fn.map = function (callback) {
	let len = this.length,
		values = [],
		i = 0;

	for (; i < len; i++) {
		values.push(callback.call(this[i], i, this[i]));
	}
	return values;
};

$.fn.offset = function (coords) {

	// set
	if (coords) {

		// prepare values
		let values = getVal(this, coords, obj => obj.offset()), // copy the object
			i = this.length;

		while (i--) {

			// set position to relative if not positioned
			let pos = getComputedStyle(this[i]).position;
			if (pos === "static") {
				values[i].position = pos = "relative";
			}

			// take off offset parent position
			const parent = this[i][pos === "relative" ? "parentNode" : "offsetParent"];
			$.each($(parent).offset(), (key, val) => values[i][key] -= val);

			// relative add inner offset
			if (pos === "relative") {
				const style = getComputedStyle(parent);
				values[i].top -= parseFloat(style.paddingTop) + parseFloat(style.borderTopWidth);
				values[i].left -= parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth);
			}
		}

		// update values in one hit to prevent thrashing
		i = this.length;
		while (i--) {
			$.each(values[i], (key, val) => this[i].style[key] = val + (isNaN(val) ? "" : "px"));
		}
		return this;
	}

	// get
	if (this[0]) {
		const doc = document.documentElement,
			pos = this[0].style.position === "fixed",
			rect = this[0].getBoundingClientRect();
		return {
			top: rect.top + (pos ? 0 : doc.scrollTop),
			left: rect.left + (pos ? 0 : doc.scrollLeft)
		};
	}
};

$.fn.offsetParent = function () {
	return $(this[0] ? this[0].offsetParent : null);
};

$.fn.position = function () {
	if (this[0]) {
		return {left: this[0].offsetLeft, top: this[0].offsetTop};
	}
};

["scrollLeft", "scrollTop"].forEach(item => {
	$.fn[item] = function (pos) {
		const top = item === "scrollTop";

		// set
		if (pos !== undefined) {
			let i = this.length,
				tl = top ? "top" : "left",
				values = getVal(this, pos, obj => obj[item]);

			while (i--) {
				if ($.isWindow(this[i])) {
					let obj = {};
					obj[tl] = values[i];
					this[i].scroll(obj);
				} else {
					this[i][item] = values[i];
				}
			}			return this;
		}

		// get
		if (this[0]) {
			let key = item;
			if ($.isWindow(this[0])) {
				key = top ? "pageYOffset" : "pageXOffset";
			}
			return this[0][key];
		}
	};
});

["width", "height", "innerWidth", "innerHeight", "outerWidth", "outerHeight"].forEach(dim => {

	$.fn[dim] = function (val) {
		const width = dim.indexOf("d") > -1,
			wh = width ? "width" : "height", // width or height
			whu = width ? "Width" : "Height", // with uppercase letter
			io = dim.indexOf("inner") > -1 ? "inner" : (dim.indexOf("outer") > -1 ? "outer" : ""), // inner outer or neither
			pos = [
				width ? "Left" : "Top", // first dimension
				width ? "Right" : "Bottom" // second dimension
			];

		// set value
		if (val !== undefined && typeof val !== "boolean") {
			let values = getVal(this, val, obj => obj[dim]),
				i = this.length,
				props = [],
				style;
			while (i--) {

				// add additional lengths
				if (io) {

					// fetch current style and build properties
					pos.forEach(item => {
						props.push("padding" + item);
						if (io === "outer") {
							props.push("border" + item + "Width");
						}
					});

					// set width to convert to a px value
					if (isNaN(values[i]) && values[i].indexOf("px") === -1) {
						this[i].style[wh] = values[i];
						props.push(wh);
						values[i] = 0; // reset to 0
					}

					// add values
					style = getComputedStyle(this[i]);
					props.forEach(val => values[i] -= parseFloat(style[val]));
				}
				this[i].style[wh] = values[i] + (isNaN(values[i]) ? "" : "px");
			}
			return this;
		}

		// get value
		if (this[0]) {

			// document
			if (this[0].nodeType === Node.DOCUMENT_NODE) {
				return this[0].documentElement["scroll" + whu];
			}

			// element
			if (!$.isWindow(this[0])) {
				let value = this[0][(io === "outer" ? "offset" : "client") + whu];

				// add padding on, or if outer and margins requested, add margins on
				if (io === "" || (io === "outer" && val === true)) {
					const style = getComputedStyle(this[0]);
					pos.forEach(item => value += parseFloat(style[(io ? "margin" : "padding") + item]) * (io ? 1 : -1));
				}
				return value;
			}

			// window
			if (io === "inner") {
				return this[0].document.documentElement["client" + whu];
			}

			return this[0]["inner" + whu];
		}
	};
});

$.fn.trigger = function (name, data) {
	let i = this.length;
	while (i--) {
		let isFunc = $.isFunction(this[i][name]);

		// native submit event doesn't trigger event handlers
		if (name == "submit" || !isFunc) {
			const evt = new CustomEvent(name, {bubbles: true, cancelable: true});
			evt.args = data;
			this[i].dispatchEvent(evt);

			// cancel submit event if default is prevented
			if (evt.defaultPrevented) {
				isFunc = false;
			}
		}

		// trigger native event
		if (isFunc) {
			this[i][name]();
		}
	}
	return this;
};

events.forEach(event => {
	$.fn[event] = function (data, callback) {
		return data ? this.on(event, data, callback) : this.trigger(event);
	};
});

// add and remove event handlers
$.fn.off = function (events, selector, callback) {
	if (this.length) {

		// sort out args
		if ($.isFunction(selector)) {
			callback = selector;
			selector = undefined;
		}

		// stadardise as plain object
		if (events && !$.isPlainObject(events)) {
			const evt = events;
			events = {};
			events[evt] = callback;
		}

		// attach event
		let i = this.length;
		while (i--) {

			// find the original function
			if (this[i].events.length) {

				// remove selected events
				if (events) {
					$.each(events, (evt, func) => {
						evt.split(" ").forEach(e => {
							this[i].events.forEach((evt, n) => {
								if (evt.event.indexOf(e) > -1 && (!func || evt.callback === func) && (!selector || evt.selector === selector)) {

									// remove event listerer
									this[i].removeEventListener(e, evt.func, {capture: !!evt.selector}); // must pass same arguments

									// remove event from events list
									this[i].events.splice(n, 1);
								}
							});
						});
					});

				// remove all events
				} else {
					this[i].events.forEach((evt, n) => {

						// remove event listerer
						this[i].removeEventListener(evt.event, evt.func, {capture: !!evt.selector}); // must pass same arguments

						// remove all events from events list
						this[i].events = [];
					});
				}
			}
		}
	}
	return this;
};

const copy = (from, to) => {

	// copy data
	Object.assign(to.dataset, from.dataset);

	// copy events
	if (from.events) {
		from.events.forEach(e => {
			$(to).on(e.events, e.selector, e.data, e.callback);
		});
	}
};

$.fn.clone = function (withDataAndEvents = false, deepWithDataAndEvents = null) {

	// default for arg 2 is the same as arg 1
	if (deepWithDataAndEvents === null) {
		deepWithDataAndEvents = withDataAndEvents;
	}

	// clone nodes
	let i = this.length,
		nodes = [];
	while (i--) {
		nodes[i] = this[i].cloneNode(true);

		// copy data and events for the new node
		if (withDataAndEvents) {
			copy(this[i], nodes[i]);
		}

		// copy data and events for the new node's children
		if (deepWithDataAndEvents) {
			const from = this[i].querySelectorAll("*"),
				to = nodes[i].querySelectorAll("*");
			let n = from.length;
			while (n--) {
				copy(from[n], to[n]);
			}
		}
	}
	return $(nodes);
};

$.fn.empty = function () {
	let i = this.length;
	while (i--) {
		while (this[i].firstChild && this[i].removeChild(this[i].firstChild));
	}
	return this;
};

$.fn.html = function (html) {

	// set
	if (html !== undefined) {
		let i = this.length,
			values = getVal(this, html, obj => obj.innerHTML);
		while (i--) {
			this[i].innerHTML = values[i];
		}
		return this;
	}

	// get
	if (this[0]) {
		return this[0].innerHTML;
	}
};

$.each({
	before: "beforeBegin",
	prepend: "afterBegin",
	append: "beforeEnd",
	after: "afterEnd"
}, (name, pos) => {

	// function tracking variables
	const pre = ["prepend", "after"].indexOf(name) > -1;

	// the function
	$.fn[name] = function (...content) {
		let elems,
			i = this.length,
			len = i,
			isFunc = $.isFunction(content[0]);

		// multiple arguments containing nodes
		if (!isFunc) {
			elems = content.reduce((dabby, item) => dabby.add(item), $());
		}

		// insert objects onto each element in collection
		while (i--) {

			// retrieve nodes from function
			if (isFunc) {
				elems = getVal([this[i]], content[0], obj => obj.innerHTML).reduce((dabby, item) => dabby.add(item), $()); // getVal() returns an array so the items need merging into a collection
			}

			// insert nodes
			let backwards = elems.length, // for counting down
				forwards = -1; // for counting up
			while (pre ? backwards-- : ++forwards < backwards) { // insert forwards or backwards?
				this[i].insertAdjacentElement(pos, i === len-1 ? elems[pre ? backwards : forwards] : elems.eq(pre ? backwards : forwards).clone(true)[0]);
			}
		}
		return this;
	};
});

$.each({
	prependTo: "prepend",
	appendTo: "append",
	insertBefore: "before",
	insertAfter: "after"
}, (name, func) => {
	$.fn[name] = function (selector) {
		$(selector)[func](this);
		return this;
	};
});

["remove", "detach"].forEach(func => {
	$.fn[func] = function (selector) {
		let i = this.length,
			nodes = [];

		// detach selected nodes
		while (i--) {
			if (!selector || filterNodes(this[i], selector).length) {
				nodes.push(this[i].parentNode.removeChild(this[i]));
			}
		}

		// create a new dabby object to return
		return func === "detach" ? $(nodes) : this;
	};
});

["replaceWith", "replaceAll"].forEach(name => {
	$.fn[name] = function (html) {
		const all = name === "replaceAll",
			source = all ? $(html) : this;
		let target = all ? this : html,
			isFunc = $.isFunction(target),
			i = source.length;

		if (!isFunc) {
			target = $(target);
		}

		while (i--) {
			let n = target.length,
				parent = source[i].parentNode;
			while (n--) {
				const replace = isFunc ? getVal(target[n], n, target[n]) : target[n];
				if (n) {
					source[i].insertAdjacentElement("beforebegin", $(replace).clone(true).get(0));
				} else {
					source[i] = parent.replaceChild(i ? $(replace).clone(true).get(0) : replace, source[i]);
				}
			}
		}
		return this;
	};
});

$.fn.slice = function (start, end) {
	return $(this.get().slice(start, end));
};

$.fn.text = function (text) {
	let i = this.length,
		output = [];

	// set
	if (text !== undefined) {
		const values = getVal(this, text, obj => obj.textContent);
		while (i--) {
			this[i].textContent = values[i];
		}
		return this;
	}

	// get
	while (i--) {
		output[i] = this[i].textContent;
	}
	return output.join(" ");
};

$.fn.unwrap = function (selector) {
	this.parent(selector).not("body").each((key, obj) => {
		$(obj.children).each((i, node) => {
			obj.parentNode.insertBefore(node, obj);
		});
		obj.parentNode.removeChild(obj);
	});
	return this;
};

$.fn.eq = function (i) {
	return $(this[i < 0 ? i + this.length : i]);
};

$.fn.wrapAll = function (html) {
	if (this[0]) {
		if ($.isFunction(html)) {
			html = html.call(this[0]);
		}

		// set variables
		let len = this.length,
			i = 0,
			node = $(html).eq(0).clone(true).get(0);

		// insert clone into parent
		this[0].parentNode.insertBefore(node, null);

		// find innermost child of node
		while (node.firstElementChild) {
			node = node.firstElementChild;
		}

		// attach nodes to the new node
		for (; i < len; i++) {
			node.appendChild(this[i]);
		}
	}
	return this;
};

$.fn.wrap = function (html) {
	let i = this.length,
		values = getVal(this, html);

	while (i--) {
		$(this[i]).wrapAll(values[i]);
	}
	return this;
};

$.fn.children = function (selector) {
	let nodes = [],
		i = this.length;

	while (i--) {
		nodes = nodes.concat(Array.from(this[i].children));
	}

	// filter nodes by selector
	return $(selector ? filterNodes(nodes, selector) : nodes);
};

$.fn.closest = function (selector, context) {
	let i = this.length,
		nodes = [];

	while (i--) {
		let node = this[i];
		while (node && node.nodeType === Node.ELEMENT_NODE) {
			if (filterNodes(node, selector, context).length) {
				nodes.unshift(node);
				break;
			}
			node = node.parentNode;
		}
	}
	return $(nodes);
};

$.fn.find = function (selector) {
	return $(selector, this);
};

$.fn.first = function () {
	return $(this[0]);
};

$.fn.has = function (selector) {
	return $(this.get().filter(node => !!$(selector, node).length));
};

$.fn.index = function (selector) {
	if (this[0]) {
		let nodes,
			subject = this[0],
			i;

		// if no selector, match against first elements siblings
		if (selector === undefined) {
			nodes = this[0].parentNode.children;

		// if selector is string, match first node in current collection against resulting collection
		} else if (typeof selector === "string") {
			nodes = $(selector);

		// if element or collection match the element or first node against current collection
		} else {
			nodes = this;
			subject = $(selector)[0];
		}

		i = nodes.length;
		while (i--) {
			if (nodes[i] === subject) {
				return i;
			}
		}
	}
	return -1;
};

$.fn.last = function () {
	return this.eq(-1);
};

["next", "nextAll", "nextUntil", "prev", "prevAll", "prevUntil"].forEach(func => {
	const next = func.indexOf("x") > -1,
		all = func.indexOf("A") > -1,
		until = func.indexOf("U") > -1,
		method = next ? "nextElementSibling" : "previousElementSibling";

	$.fn[func] = function (selector, filter) {
		let nodes = [];

		// look through each node and get siblings
		for (let i = 0, len = this.length; i < len; i++) {
			let sibling = this[i][method];
			while (sibling) {

				// end when we match until
				if (until && filterNodes(sibling, selector).length) {
					break;
				}

				// add the node
				nodes.push(sibling);

				// end when not finding all
				if (!all && !until) {
					break;
				}
				sibling = sibling[method];
			}
		}

		// swap args for *Until methods
		if (until) {
			selector = filter;
		}

		// return new collection
		return $(selector ? filterNodes(nodes, selector) : nodes);
	};
});

$.fn.siblings = function (selector) {
	let i = this.length,
		nodes = [];

	while (i--) {
		Array.from(this[i].parentNode.children).forEach(child => {
			if (child !== this[i]) {
				nodes.push(child);
			}
		});
	}
	return $(selector ? filterNodes(nodes, selector) : nodes);
};

class dcal {

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

//# sourceMappingURL=dcal.js.map