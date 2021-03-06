(function($) {

Mavo.attributes.push("mv-expressions");

var _ = Mavo.Expression = $.Class({
	constructor: function(expression) {
		this.expression = expression;
	},

	eval: function(data) {
		this.oldValue = this.value;

		Mavo.hooks.run("expression-eval-beforeeval", this);

		try {
			if (!this.function) {
				this.function = Mavo.Script.compile(this.expression);
				this.identifiers = this.expression.match(/[$a-z][$\w]*/ig) || [];
			}

			this.value = this.function(data);
		}
		catch (exception) {
			console.info("%cExpression error!", "color: red; font-weight: bold", `${exception.message} in expression ${this.expression}`, `
Not an expression? Use mv-expressions="none" to disable expressions on an element and its descendants.`);

			Mavo.hooks.run("expression-eval-error", {context: this, exception});

			this.value = exception;
		}

		return this.value;
	},

	toString() {
		return this.expression;
	},

	changedBy: function(evt) {
		if (!evt) {
			return true;
		}

		if (!this.identifiers) {
			return false;
		}

		if (this.identifiers.indexOf(evt.property) > -1) {
			return true;
		}

		if (Mavo.Functions.intersects(evt.properties, this.identifiers)) {
			return true;
		}

		if (evt.action != "propertychange") {
			if (Mavo.Functions.intersects(["$index", "$previous", "$next"], this.identifiers)) {
				return true;
			}

			var collection = evt.node.collection || evt.node;

			if (Mavo.Functions.intersects(collection.properties, this.identifiers)) {
				return true;
			}
		}

		return false;
	},

	live: {
		expression: function(value) {
			this.function = null;
		}
	},

	static: {
	}
});

_.Syntax = $.Class({
	constructor: function(start, end) {
		this.start = start;
		this.end = end;
		this.regex = RegExp(`${Mavo.escapeRegExp(start)}([\\S\\s]+?)${Mavo.escapeRegExp(end)}`, "gi");
	},

	test: function(str) {
		this.regex.lastIndex = 0;

		return this.regex.test(str);
	},

	tokenize: function(str) {
		var match, ret = [], lastIndex = 0;

		this.regex.lastIndex = 0;

		while ((match = this.regex.exec(str)) !== null) {
			// Literal before the expression
			if (match.index > lastIndex) {
				ret.push(str.substring(lastIndex, match.index));
			}

			lastIndex = this.regex.lastIndex;

			ret.push(new Mavo.Expression(match[1]));
		}

		// Literal at the end
		if (lastIndex < str.length) {
			ret.push(str.substring(lastIndex));
		}

		return ret;
	},

	static: {
		create: function(element) {
			if (element) {
				var syntax = element.getAttribute("mv-expressions");

				if (syntax) {
					syntax = syntax.trim();
					return /\s/.test(syntax)? new _.Syntax(...syntax.split(/\s+/)) : _.Syntax.ESCAPE;
				}
			}
		},

		ESCAPE: -1
	}
});

_.Syntax.default = new _.Syntax("[", "]");

})(Bliss);
