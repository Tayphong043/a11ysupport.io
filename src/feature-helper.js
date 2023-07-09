let helper = {};
const moment = require('moment');
let now = new moment();

//Grab the ATBrowsers data
const ATBrowsers = require('./../data/ATBrowsers');
const at_types = ['sr', 'vc', 'kb'];

/**
 * Generic array sorting
 *
 * @param property
 * @returns {Function}
 */
let sortByProperty = function (property) {
	return function (x, y) {
		return ((x[property] === y[property]) ? 0 : ((x[property] > y[property]) ? 1 : -1));
	};
};

Array.prototype.unique = function() {
	return this.filter(function(elem, pos, self) {
		return self.indexOf(elem) === pos;
	});
};

let isCoreCombination = function(at, browser) {
	if (!ATBrowsers.core_at.includes(at)) {
		return false;
	}

	if (!ATBrowsers.at[at]) {
		return false;
	}

	if (ATBrowsers.at[at].core_browsers.includes(browser)) {
		return true;
	}

	return false;
};

Array.prototype.occurenceCount = function (what) {
	let count = 0;
	for (let i = 0; i < this.length; i++) {
		if (this[i] === what) {
			count++;
		}
	}
	return count;
};

helper.initalizeFeatureObject = function(featureObject, techId, id) {
	featureObject.id = id;
	featureObject.techId = techId;

	featureObject.all_dates = {
		all: [],
		min: null,
		max: null
	};

	featureObject.failing_dates = {
		all: [],
		min: null,
		max: null
	};

	//Set up support properties
	featureObject.core_support = {};
	featureObject.core_support_by_at = {};
	featureObject.core_support_by_at_browser = {};
	featureObject.core_support_string = {};
	featureObject.extended_support = {};
	featureObject.extended_support_string = {};
	featureObject.core_must_support = {};
	featureObject.core_must_support_string = {};
	featureObject.core_should_support = {};
	featureObject.core_should_support_string = {};
	featureObject.core_may_support = {};
	featureObject.core_may_support_string = {};

	at_types.forEach(at_type => {
		featureObject.core_support[at_type] = [];
		featureObject.core_support_string[at_type] = 'unknown';
		featureObject.extended_support[at_type] = [];
		featureObject.extended_support_string[at_type] = 'unknown';
		featureObject.core_must_support[at_type] = [];
		featureObject.core_must_support_string[at_type] = 'unknown';
		featureObject.core_should_support[at_type] = [];
		featureObject.core_should_support_string[at_type] = 'unknown';
		featureObject.core_may_support[at_type] = [];
		featureObject.core_may_support_string[at_type] = 'unknown';
	})

	if (!featureObject.keywords) {
		featureObject.keywords = [];
	}

	if (!featureObject.is_form_control) {
		featureObject.is_form_control = false;
	}

	featureObject.keywords.push(featureObject.title);

	// Set defaults for assertions
	featureObject.assertions.forEach((assertion, assertion_key) => {
		switch (assertion.id) {
			case 'convey_name':
				featureObject.assertions[assertion_key] = Object.assign({
					title: "convey its name",
					rationale: "A screen reader user needs to know what to enter.",
					strength: {
						sr: "MUST",
						vc: "MUST",
						kb: "NA"
                    },
					operation_modes: [
						"sr/reading",
						"sr/interaction",
						"vc"
					],
				}, assertion);

				if (featureObject.is_form_control && !featureObject.assertions[assertion_key].notes) {
					featureObject.assertions[assertion_key].notes = "For form inputs - commands to read line by line (down and up arrows in most windows screen readers) will not always result in the name being explicitly conveyed when the virtual focus is moved to an input where the label is visually displayed and programmatically associated with the input. This is acceptable because the name is implied by the fact that it should be naturally found in the reading order. Some screen readers choose to not convey the name in these cases, likely in an effort to reduce verbosity."
				}
				break;
			case 'convey_role':
				featureObject.assertions[assertion_key] = Object.assign({
					title: "convey its role",
					rationale: "A screen reader user needs to know how they can interact with the element. Voice control software might use the role to help users activate controls that do not have a visible name.",
					examples: [
						"A screen reader might announce an element as something like \"<name>, <role>\"",
						"A screen reader might imply the role by the presence of certain context roles",
						"Voice Control software might let the user say something like \"click, <role>\".",
						"Voice Control software might let the user say something like \"show numbers\", and interactive roles will be flagged with numbers.",
					],
					strength: {
						sr: "MUST",
						vc: "MUST",
						kb: "NA"
					},
					operation_modes: [
						"sr/reading",
						"sr/interaction",
						"vc"
					],
					"exclude_at": {"vc_ios":  "no_support"}
				}, assertion);
				break;
			case 'convey_value':
				featureObject.assertions[assertion_key] = Object.assign({
					title: "convey the current value",
					rationale: "A screen reader user needs to know the current value of the input.",
					strength: {
						sr: "MUST",
						vc: "NA",
						kb: "NA"
					},
					operation_modes: [
						"sr/reading",
						"sr/interaction"
					]
				}, assertion);
				break;
			case 'convey_change_in_value':
				featureObject.assertions[assertion_key] = Object.assign({
					title: "convey changes in value",
					rationale: "The user needs to know that the value was successfully changed.",
					strength: {
						sr: "MUST",
						vc: "NA",
						kb: "NA"
					},
					pass_strategy: "all",
					operation_modes: [
						"sr/interaction"
					]
				}, assertion);
				break;
			case 'convey_change_in_state':
				featureObject.assertions[assertion_key] = Object.assign({
					title: "convey changes in state",
					rationale: "The user needs to know that the state was successfully changed.",
					strength: {
						sr: "MUST",
						vc: "NA",
						kb: "NA"
					},
					pass_strategy: "all",
					operation_modes: [
						"sr/interaction"
					]
				}, assertion);
				break;
			case 'convey_boundaries':
				featureObject.assertions[assertion_key] = Object.assign({
					title: "convey the boundaries of the element",
					rationale: "A user needs to know when they enter and exit an element",
					strength: {
						sr: "MUST",
						vc: "NA",
						kb: "NA"
					},
					examples: [
						"A screen reader might announce the role of the element when entering and say something like \"leaving\" when exiting.",
						"A screen reader might not explicitly announce entering and existing the element, but instead imply that the is in the containing object by conveying the roles of required children (options in a listbox for example).",
						"A screen reader might announce position in set information such as \"1 of 6\".",
						"A screen reader might not convey boundaries if the content fits on a single line"
					],
					pass_strategy: "all",
					operation_modes: [
						"sr/reading",
						"sr/interaction"
					]
				}, assertion);
				break;
			case 'convey_nesting_level':
				featureObject.assertions[assertion_key] = Object.assign({
					title: "convey the nesting level",
					rationale: "A screen reader user might find it helpful to know what nesting level they are at",
					strength: {
						sr: "SHOULD",
						vc: "NA",
						kb: "NA"
					},
					operation_modes: [
						"sr/reading",
						"sr/interaction"
					]
				}, assertion);
				break;
			case 'content_navigable':
				featureObject.assertions[assertion_key] = Object.assign({
					title: "allow navigating content",
					rationale: "A user needs to be able to navigate the content",
					strength: {
						sr: "MUST",
						vc: "NA",
						kb: "NA"
					},
					examples: [
						"A screen reader might allow reading-mode navigation, such as reading line-by-line."
					],
					pass_strategy: "all",
					operation_modes: [
						"sr/reading"
					]
				}, assertion);
				break;
			case 'convey_posinset':
				featureObject.assertions[assertion_key] = Object.assign({
					title: "convey the position in set information",
					rationale: "A user needs to where the position is in the list",
					strength: {
						sr: "MUST",
						vc: "NA",
						kb: "NA"
					},
					examples: [
						"A screen reader might something like \"1 of 6\".",
					],
					operation_modes: [
						"sr/reading",
						"sr/interaction"
					]
				}, assertion);
				break;
			case 'convey_boolean_property':
				featureObject.assertions[assertion_key] = Object.assign({
					id: "convey_boolean_property",
					title: "convey the property",
					rationale: "The user needs to know that property is set",
					strength: {
						sr: "MUST",
						vc: "NA",
						kb: "NA"
					},
					examples: [
						"A screen reader might announce the property along with the elements name, role, and value"
					],
					operation_modes: [
						"sr/reading",
						"sr/interaction"
					]
				}, assertion);
				break;
			case 'provide_shortcuts':
				featureObject.assertions[assertion_key] = Object.assign({
					title: "provide shortcuts to jump to this role",
					rationale: "Screen reader users might want to quickly navigate to elements of this type.",
					strength: {
						sr: "SHOULD",
						vc: "NA",
						kb: "NA"
					},
					operation_modes: [
						"sr/reading"
					]
				}, assertion);
				break;
			case 'convey_setsize':
				featureObject.assertions[assertion_key] = Object.assign({
					title: "convey the number of items in the list",
					rationale: "A user needs to be able to understand how many items are in the list",
					strength: {
						sr: "MUST",
						vc: "NA",
						kb: "NA"
					},
					examples: [
						"A screen reader might convey the position of each item in the list as something like \"x of y\" where y is the number of items in the list.",
						"A screen reader might convey the number of items in the list when first entering the list."
					],
					operation_modes: [
						"sr/reading"
					]
				}, assertion);
				break;
			case 'allow_data_entry':
				featureObject.assertions[assertion_key] = Object.assign({
					title: "allow data entry",
					rationale: "Users need to be able to enter data",
					strength: {
						sr: "NA",
						vc: "MUST",
						kb: "NA"
					},
					examples: [
						"Voice control software might allow someone to dictate data into a field once it is focused.",
					],
					operation_modes: [
						"vc"
					]
				}, assertion);
				break;
		}
	});

	// Define the keywords_string
	featureObject.keywords_string = featureObject.keywords.join(' ').replace(/\"/g, '');
};

helper.bubbleFeatureSupport = function(featureObject) {
	// Initialize the feature with defaults
	at_types.forEach(type => {
		featureObject.core_support[type].push('u');
	});
	for (let i = 0; i < ATBrowsers.core_at.length; i++) {
		featureObject.core_support_by_at[ATBrowsers.core_at[i]] = {};
		featureObject.core_support_by_at[ATBrowsers.core_at[i]].values = ['u'];
		featureObject.core_support_by_at[ATBrowsers.core_at[i]].string = helper.generateSupportString(['u']);
	}

	featureObject.assertions.forEach((assertion, assertion_key) => {
		featureObject.assertions[assertion_key].tests = [];

		if (!assertion.pass_strategy) {
			featureObject.assertions[assertion_key].pass_strategy = 'all';
		}

		// Now set a flag for what types of AT this assertion applies to
		featureObject.assertions[assertion_key].supports_at = [];
		if (!featureObject.assertions[assertion_key].rationale) {
			featureObject.assertions[assertion_key].rationale = "";
		}

		at_types.forEach(type => {
			let found = assertion.operation_modes.findIndex(element => element.startsWith(type));
			if (found > -1) {
				featureObject.assertions[assertion_key].supports_at.push(type);
			}
		});
	});

	for (let testIndex = 0; testIndex < featureObject.tests.length; testIndex++) {
		featureObject.tests[testIndex] = require('../build/tests/'+featureObject.tests[testIndex]);

		if (featureObject.tests[testIndex].status && featureObject.tests[testIndex].status === 'DRAFT') {
			// This is a draft test, don't bubble support to the feature level.
			continue;
		}

		// Set up keywords to help searches
		if (featureObject.tests[testIndex].keywords) {
			featureObject.keywords = featureObject.keywords.concat(featureObject.tests[testIndex].keywords);
		}

		// Note: tests are be built before a feature is built so that bubbling works correctly
		// Detect support
		featureObject.tests[testIndex].assertions.forEach(assertion => {
			if (featureObject.id !== assertion.feature_id) {
				return;
			}
			if (!assertion.all_dates) {
				console.log(assertion);
			}
			featureObject.all_dates.all = [...new Set(featureObject.all_dates.all.concat(assertion.all_dates.all))];
			featureObject.failing_dates.all = [...new Set(featureObject.failing_dates.all.concat(assertion.failing_dates.all))];

			let assertion_key = featureObject.assertions.findIndex(obj => obj.id === assertion.feature_assertion_id);

			if (!featureObject.assertions[assertion_key].tests.some(e => e.id  === featureObject.tests[testIndex].id)) {
				let tmp_test_summary = {
					id: featureObject.tests[testIndex].id,
					title: featureObject.tests[testIndex].title,
					core_support_string: {},
					core_assertion_support_by_at_browser: assertion.core_support_by_at_browser
				}
				at_types.forEach(type => {
					tmp_test_summary.core_support_string[type] = featureObject.tests[testIndex].core_support_string[type];
				});

				featureObject.assertions[assertion_key].tests.push(tmp_test_summary);
			}

			// Set up the feature assertion properties
			if (featureObject.assertions[assertion_key].core_support === undefined) {
				featureObject.assertions[assertion_key].core_support = {};
				featureObject.assertions[assertion_key].core_support_string = {};
				featureObject.assertions[assertion_key].extended_support = {};
				featureObject.assertions[assertion_key].extended_support_string = {};
				featureObject.assertions[assertion_key].core_support_by_at = {};
				featureObject.assertions[assertion_key].core_support_by_at_browser = {};
				at_types.forEach(type => {
					featureObject.assertions[assertion_key].core_support[type] = [];
					featureObject.assertions[assertion_key].core_support_string[type] = 'unknown';
					featureObject.assertions[assertion_key].extended_support[type] = [];
					featureObject.assertions[assertion_key].extended_support_string[type] = 'unknown';
				});
			}

			for(let at in ATBrowsers.at){
				let validBrowsers = ATBrowsers.at[at].core_browsers.concat(ATBrowsers.at[at].extended_browsers);
				validBrowsers.forEach(function(browser) {
					//Set support arrays
					let support = assertion.results[at].browsers[browser].support;
					let some_support_behind_settings = assertion.results[at].browsers[browser].some_support_behind_settings;
					if (ATBrowsers.at[at].core_browsers.includes(browser)) {
						if (ATBrowsers.core_at.includes(at)) {
							if (!featureObject.core_support_by_at[at]) {
								featureObject.core_support_by_at[at] = {
									'string': null,
									'values': [],
									'some_support_behind_settings': false
								};
							}

							if (!featureObject.core_support_by_at_browser) {
								featureObject.core_support_by_at_browser = {};
							}

							if (!featureObject.core_support_by_at_browser[at]) {
								featureObject.core_support_by_at_browser[at] = {};
							}

							if (!featureObject.core_support_by_at_browser[at][browser]) {
								featureObject.core_support_by_at_browser[at][browser] = {
									'string': null,
									'values': [],
									'some_support_behind_settings': false
								};
							}

							if (!featureObject.assertions[assertion_key].core_support_by_at[at]) {
								featureObject.assertions[assertion_key].core_support_by_at[at] = {
									'string': null,
									'values': [],
									'some_support_behind_settings': false
								};
							}

							if (!featureObject.assertions[assertion_key].core_support_by_at_browser[at]) {
								featureObject.assertions[assertion_key].core_support_by_at_browser[at] = {};
							}

							if (!featureObject.assertions[assertion_key].core_support_by_at_browser[at][browser]) {
								featureObject.assertions[assertion_key].core_support_by_at_browser[at][browser] = {
									'string': null,
									'values': [],
									'some_support_behind_settings': false
								};
							}

							if (featureObject.assertions[assertion_key].strength[ATBrowsers.at[at].type] === "MUST" || featureObject.assertions[assertion_key].strength[ATBrowsers.at[at].type] === "MUST NOT") {
								// Only include "must" assertions in core support at the feature level
								featureObject.core_support_by_at_browser[at][browser].values.push(support);
								if (some_support_behind_settings) {
									featureObject.core_support_by_at_browser[at][browser].some_support_behind_settings = some_support_behind_settings;
								}

								featureObject.core_support_by_at[at].values.push(support);
								featureObject.core_support[ATBrowsers.at[at].type].push(support);
							} else {
								featureObject.extended_support[ATBrowsers.at[at].type].push(support);
							}

							featureObject.assertions[assertion_key].core_support_by_at[at].values.push(support);
							if (some_support_behind_settings) {
								featureObject.assertions[assertion_key].core_support_by_at[at].some_support_behind_settings = some_support_behind_settings;
							}

							featureObject.assertions[assertion_key].core_support[ATBrowsers.at[at].type].push(support);
							featureObject.assertions[assertion_key].core_support_by_at_browser[at][browser].values.push(support);
							if (some_support_behind_settings) {
								featureObject.assertions[assertion_key].core_support_by_at_browser[at][browser].some_support_behind_settings = some_support_behind_settings;
							}
						} else {
							featureObject.extended_support[ATBrowsers.at[at].type].push(support);
							featureObject.assertions[assertion_key].extended_support[ATBrowsers.at[at].type].push(support);
						}
					} else if (ATBrowsers.at[at].extended_browsers.includes(browser)) {
						featureObject.extended_support[ATBrowsers.at[at].type].push(support);
						featureObject.assertions[assertion_key].extended_support[ATBrowsers.at[at].type].push(support);
					}
				});
			}
		});
	}

	featureObject.all_dates.all = [...new Set(featureObject.all_dates.all)];
	featureObject.all_dates.min = Math.min(...featureObject.all_dates.all);
	featureObject.all_dates.max = Math.max(...featureObject.all_dates.all);
	featureObject.failing_dates.all = [...new Set(featureObject.failing_dates.all)];
	featureObject.failing_dates.min = Math.min(...featureObject.failing_dates.all);
	featureObject.failing_dates.max = Math.max(...featureObject.failing_dates.all);

	//Set support strings
	at_types.forEach(type => {
		featureObject.core_support_string[type] = helper.generateSupportString(featureObject.core_support[type]);
		featureObject.extended_support_string[type] = helper.generateSupportString(featureObject.extended_support[type]);
	});

	for (let i = 0; i < ATBrowsers.core_at.length; i++) {
		let at = ATBrowsers.core_at[i];
		featureObject.core_support_by_at[at].string = helper.generateSupportString(featureObject.core_support_by_at[at].values);

		if (!featureObject.core_support_by_at_browser[at]) {
			featureObject.core_support_by_at_browser[at] = {};
		}

		ATBrowsers.at[at].core_browsers.forEach(browser => {
			if (!featureObject.core_support_by_at_browser[at][browser]) {
				featureObject.core_support_by_at_browser[at][browser] = {
					"values": [],
					"string": ""
				};
			}

			featureObject.core_support_by_at_browser[at][browser].string = helper.generateSupportString(featureObject.core_support_by_at_browser[at][browser].values);
		});

		featureObject.assertions.forEach((assertion, assertion_key) => {
			if (!featureObject.assertions[assertion_key].core_support_by_at) {
				featureObject.assertions[assertion_key].core_support_by_at = {};
			}

			if (!featureObject.assertions[assertion_key].core_support_by_at[at]) {
				featureObject.assertions[assertion_key].core_support_by_at[at] = {
					"values": [],
					"string": ""
				};
			}
			featureObject.assertions[assertion_key].core_support_by_at[at].string = helper.generateSupportString(featureObject.assertions[assertion_key].core_support_by_at[at].values);

			// Loop over browsers and set values
			ATBrowsers.at[at].core_browsers.forEach(browser => {

				if (!featureObject.assertions[assertion_key].core_support_by_at_browser) {
					featureObject.assertions[assertion_key].core_support_by_at_browser = {};
				}

				if (!featureObject.assertions[assertion_key].core_support_by_at_browser[at]) {
					featureObject.assertions[assertion_key].core_support_by_at_browser[at] = {};
				}

				if (!featureObject.assertions[assertion_key].core_support_by_at_browser[at][browser]) {
					featureObject.assertions[assertion_key].core_support_by_at_browser[at][browser] = {
						"values": [],
						"string": ""
					};
				}

				featureObject.assertions[assertion_key].core_support_by_at_browser[at][browser].string = helper.generateSupportString(featureObject.assertions[assertion_key].core_support_by_at_browser[at][browser].values);
			});
		});
	}

	featureObject.supports_at = [];
	featureObject.assertions.forEach((assertion, assertion_key) => {
		// aggregate must/should/may core support
		at_types.forEach(type => {
			if (assertion.supports_at.includes(type) && !featureObject.supports_at.includes(type)) {
				featureObject.supports_at.push(type);
			}

			if (assertion.strength[type] === "MUST" || assertion.strength[type] === "MUST NOT") {
				if (assertion.core_support && assertion.core_support[type] && assertion.core_support[type].length) {
					featureObject.core_must_support[type] = featureObject.core_must_support[type].concat(assertion.core_support[type]);
				}
				featureObject.core_must_support_string[type] = helper.generateSupportString(featureObject.core_must_support[type]);
			} else if (assertion.strength[type] === "SHOULD") {
				if (assertion.core_support && assertion.core_support[type] && assertion.core_support[type].length) {
					featureObject.core_should_support[type] = featureObject.core_should_support[type].concat(assertion.core_support[type]);
				}
				featureObject.core_should_support_string[type] = helper.generateSupportString(featureObject.core_should_support[type]);
			} else {
				if (assertion.core_support && assertion.core_support[type] && assertion.core_support[type].length) {
					featureObject.core_may_support[type] = featureObject.core_may_support[type].concat(assertion.core_support[type]);
				}
				featureObject.core_may_support_string[type] = helper.generateSupportString(featureObject.core_may_support[type]);
			}
		});
	});

	at_types.forEach(type => {
		if (!featureObject.supports_at.includes(type)) {
			featureObject.core_must_support_string[type] = helper.generateSupportString('na');
			featureObject.core_should_support_string[type] = helper.generateSupportString('na');
			featureObject.core_may_support_string[type] = helper.generateSupportString('na');
		}
	});
};

/**
 * Needs to be run after support data has bubbled
 * @param featureObject
 */
helper.checkForOnlyNegativeSupport = function(featureObject) {
	// detect if assertions contain something like convey_value_false
	let hasNegativeExpectation = featureObject.assertions.some(e => e.same_as_no_support === true);

	if (!hasNegativeExpectation) {
		return; // nothing to see here, keep moving (fail early)
	}

	for(let at in ATBrowsers.at) {
		let validBrowsers = ATBrowsers.at[at].core_browsers;
		validBrowsers.forEach(function (browser) {
			// for each AT/browser combo, detect if same_as_no_support is the only supported assertion
			let negativeSupport = false;
			let positiveSupport = false;
			featureObject.assertions.forEach((assertion, assertion_key) => {
				//Set support arrays
				let support = [...new Set(assertion.core_support_by_at_browser[at][browser].values)]; // Make sure its unique

				if (support.length === 1 && assertion.same_as_no_support) {
					if (support[0] === 'y') {
						negativeSupport = true;
					}
				} else {
					if (support[0] === 'y') {
						positiveSupport = true;
					}
				}
			});

			featureObject.core_support_by_at_browser[at][browser].onlyNegativeSupport = false;
			if (negativeSupport === true && positiveSupport === false) {
				featureObject.core_support_by_at_browser[at][browser].onlyNegativeSupport = true;
			}
		});
	}
};

helper.initalizeTestCase = function (testCase) {
	// transform the commands object to the assertions array
	if (!testCase.assertions) {
		testCase.assertions = [];
	}

	testCase.all_dates = {
		all: [],
		min: null,
		max: null
	};

	testCase.failing_dates = {
		all: [],
		min: null,
		max: null
	};

	testCase.assertions.forEach(assertion => {
		if (!assertion.applied_to) {
			assertion.applied_to = null;
		}

		if (!assertion.references) {
			assertion.references = [];
		}

		if (!assertion.results) {
			assertion.results = {};
		}

		if (!assertion.all_dates) {
			assertion.all_dates = {
				all: [],
				min: null,
				max: null
			};
		}

		if (!assertion.failing_dates) {
			assertion.failing_dates = {
				all: [],
				min: null,
				max: null
			};
		}
	});

	for(let at in ATBrowsers.at){
		if (!testCase.versions[at]) {
			continue;
		}

		if (!testCase.versions[at].browsers) {
			continue;
		}

		let validBrowsers = ATBrowsers.at[at].core_browsers.concat(ATBrowsers.at[at].extended_browsers);
		validBrowsers.forEach((browser) => {
			if (!testCase.versions[at].browsers[browser]) {
				return;
			}
			if (!testCase.versions[at].browsers[browser].date) {
				return;
			}

			if (isCoreCombination(at, browser)) {
				testCase.all_dates.all.push(new Date(testCase.versions[at].browsers[browser].date).getTime());
			}
		});
	}

	for(let at in ATBrowsers.at) {
		if (!testCase.commands[at]) {
			continue;
		}

		let validBrowsers = ATBrowsers.at[at].core_browsers.concat(ATBrowsers.at[at].extended_browsers);
		validBrowsers.forEach(function (browser) {
			if (!testCase.commands[at][browser]) {
				return;
			}
			testCase.commands[at][browser].forEach(function(command) {

				if (command.procedure_key) {
					let procedure_index = testCase.procedures.findIndex(obj =>
						obj.key === command.procedure_key
					);

					if (procedure_index === -1) {
						console.log('error: procedure key of "' + command.procedure_key + '" was not found',  "testCase: " + testCase.id,);
					}

					// clone so that we can customize per AT
					let procedure = JSON.parse(JSON.stringify(testCase.procedures[procedure_index]));

					if (['vo_ios', 'talkback'].includes(at)) {
						procedure.steps = procedure.steps.filter(step => {
							return step.action !== "set mode to"
						});
						procedure.steps.forEach(step => {
							if (step.ensure_at_location && step.ensure_at_location.focus) {
								delete step.ensure_at_location.focus;
							}
						});
					}

					// merge the procedure into the command
					command = Object.assign({}, procedure, command);
				}

				if (!command.results) {
					command.results = [];
				}

				command.results.forEach(function(result) {
					if (!result.applied_to) {
						result.applied_to = null;
					}
					if (!result.references) {
						result.references = [];
					}
					let assertion_key = testCase.assertions.findIndex(obj =>
						obj.feature_id === result.feature_id
						&& obj.feature_assertion_id === result.feature_assertion_id
						&& obj.applied_to === result.applied_to
						&& obj.references.join('-') === result.references.join('-')
					);

					if (-1 === assertion_key) {
						testCase.assertions.push({
							feature_id: result.feature_id,
							feature_assertion_id: result.feature_assertion_id,
						});
						assertion_key = testCase.assertions.length-1;
					}

					if (!testCase.assertions[assertion_key].results) {
						console.log(assertion_key, testCase.assertions[assertion_key]);
						console.log("Error; make sure that this assertion reference actually exists and is spelled correctly", "testCase: " + testCase.id, assertion_key, result.feature_id, result.feature_assertion_id, 'applied_to: ', result.applied_to, 'references: ', result.references);
					}

					if (!testCase.assertions[assertion_key].results[at]) {
						testCase.assertions[assertion_key].results[at] = {
							browsers: {}
						}
					}

					if (!testCase.assertions[assertion_key].results[at].browsers[browser]) {
						testCase.assertions[assertion_key].results[at].browsers[browser] = {
							output: []
						}
					}

					let output = Object.assign({}, command);

					if (command.notes) {
						output.commandNotes = command.notes;
						delete output.notes;
					}

					if (result.notes) {
						output.resultNotes = result.notes;
					}

					output.result = result.result;
					delete output.results;

					// handle dates
					testCase.assertions[assertion_key].all_dates.all.push(new Date(testCase.versions[at].browsers[browser].date).getTime());
					testCase.assertions[assertion_key].results[at].browsers[browser].output.push(output);
					if (isCoreCombination(at, browser)) {
						if (output.result === "fail" || output.result === "partial") {
							testCase.failing_dates.all.push(new Date(testCase.versions[at].browsers[browser].date).getTime());
							testCase.assertions[assertion_key].failing_dates.all.push(new Date(testCase.versions[at].browsers[browser].date).getTime());
							testCase.versions[at].browsers[browser].has_failing = true;
						}

						testCase.assertions[assertion_key].all_dates.all = [...new Set(testCase.assertions[assertion_key].all_dates.all)];
						testCase.assertions[assertion_key].all_dates.min = Math.min(...testCase.assertions[assertion_key].all_dates.all);
						testCase.assertions[assertion_key].all_dates.max = Math.max(...testCase.assertions[assertion_key].all_dates.all);
						testCase.assertions[assertion_key].failing_dates.all = [...new Set(testCase.assertions[assertion_key].failing_dates.all)];
						testCase.assertions[assertion_key].failing_dates.min = Math.min(...testCase.assertions[assertion_key].failing_dates.all);
						testCase.assertions[assertion_key].failing_dates.max = Math.max(...testCase.assertions[assertion_key].failing_dates.all);
					}
				});
			});
		});
	}

	delete testCase.commands;

	testCase.all_dates.all = [...new Set(testCase.all_dates.all)];
	testCase.all_dates.min = Math.min(...testCase.all_dates.all);
	testCase.all_dates.max = Math.max(...testCase.all_dates.all);
	testCase.failing_dates.all = [...new Set(testCase.failing_dates.all)];
	testCase.failing_dates.min = Math.min(...testCase.failing_dates.all);
	testCase.failing_dates.max = Math.max(...testCase.failing_dates.all);

	let sortStrengthMap = {
		convey_name: '0',
		convey_role: '1',
		convey_value: '2',
		convey_change_in_value: '3',
		convey_state: '4',
		convey_change_in_state: '5',
		convey_property: '6'
	};

	let generateSortString = function(assertion_id) {
		let string = '';
		if (sortStrengthMap[assertion_id]) {
			string = sortStrengthMap[assertion_id];
		}

		return string+assertion_id;
	};

	testCase.assertions.sort(function(x, y) {
		let x_id = x.feature_id+"."+generateSortString(x.feature_assertion_id);
		let y_id = y.feature_id+"."+generateSortString(y.feature_assertion_id);
		return ((x_id === y_id) ? 0 : ((x_id > y_id) ? 1 : -1));
	});

	//Set support properties
	testCase.core_support = {};
	testCase.core_support_string = {};
	testCase.extended_support = {};
	testCase.extended_support_string = {};
	testCase.core_must_support = {};
	testCase.core_must_support_string = {};
	testCase.core_should_support = {};
	testCase.core_should_support_string = {};
	testCase.core_may_support = {};
	testCase.core_may_support_string = {};
	at_types.forEach(type => {
		testCase.core_support[type] = [];
		testCase.core_support_string[type] = 'unknown';
		testCase.extended_support[type] = [];
		testCase.extended_support_string[type] = 'unknown';
		testCase.core_must_support[type] = [];
		testCase.core_must_support_string[type] = 'unknown';
		testCase.core_should_support[type] = [];
		testCase.core_should_support_string[type] = 'unknown';
		testCase.core_may_support[type] = [];
		testCase.core_may_support_string[type] = 'unknown';
	});

	testCase.history = testCase.history.sort(sortByProperty('date'));

	// compute data for each assertion
	testCase.assertions.forEach(function(assertion, assertion_key) {
		// Load the feature object so that we can reference linked assertions (use the data version because the feature hasn't been built yet)
		let feature = require('../data/tech/'+assertion.feature_id+".json");
		let ref_assertion = feature.assertions.find(obj => obj.id === assertion.feature_assertion_id);

		if (!ref_assertion) {
			console.log(testCase.id, assertion.feature_assertion_id);
		}

		// Look at what operations modes the assertion supports and set some helpful flags
		// We have to do this here because tests are built before features.
		let supports_by_at = {};
		at_types.forEach(type => {
			supports_by_at[type] = false;
		});
		testCase.assertions[assertion_key].supports_at = [];

		if (!ref_assertion.operation_modes) {
			console.log(feature, ref_assertion);
		}

		at_types.forEach(type => {
			let found = ref_assertion.operation_modes.findIndex(element => element.startsWith(type));
			if (found > -1) {
				supports_by_at[type] = true;
				testCase.assertions[assertion_key].supports_at.push(type)
			}
		});

		let titleModifier = 'The assistive technology ';
		if (testCase.assertions[assertion_key].supports_at.length === 1 && testCase.assertions[assertion_key].supports_at[0] === 'sr') {
			titleModifier = 'The screen reader ';
		} else if (testCase.assertions[assertion_key].supports_at.length === 1 && testCase.assertions[assertion_key].supports_at[0] === 'vc') {
			titleModifier = 'The voice control software ';
		}
		let ref_applied_to_feature = null;
		if (assertion.applied_to) {
			ref_applied_to_feature = require('../data/tech/'+assertion.applied_to+".json");
		}
		let ref_references_features = null;
		if (assertion.references) {
			testCase.assertions[assertion_key].references_titles = [];
			assertion.references.forEach(ref => {
				let ref_feature = require('../data/tech/'+ref+".json");
				testCase.assertions[assertion_key].references_titles.push(ref_feature.title);
			});
			testCase.assertions[assertion_key].references_titles = testCase.assertions[assertion_key].references_titles.join(', ');
		}

		testCase.assertions[assertion_key].feature_title = feature.title;
		testCase.assertions[assertion_key].applied_to_title = (ref_applied_to_feature) ? ref_applied_to_feature.title : null;
		testCase.assertions[assertion_key].assertion_title = ref_assertion.title;
		testCase.assertions[assertion_key].assertion_strength = ref_assertion.strength;
		testCase.assertions[assertion_key].assertion_notes = ref_assertion.notes;
		testCase.assertions[assertion_key].assertion_examples = ref_assertion.examples;

		testCase.assertions[assertion_key].core_support = {};
		testCase.assertions[assertion_key].core_support_string = {};
		testCase.assertions[assertion_key].extended_support = {};
		testCase.assertions[assertion_key].extended_support_string = {};

		at_types.forEach(type => {
			testCase.assertions[assertion_key].core_support[type] = [];
			testCase.assertions[assertion_key].core_support_string[type] = supports_by_at[type] ? 'unknown' : 'na';
			testCase.assertions[assertion_key].extended_support[type] = [];
			testCase.assertions[assertion_key].extended_support_string[type] = supports_by_at[type] ? 'unknown' : 'na';
		});

		testCase.assertions[assertion_key].core_support_by_at_browser = {};
		testCase.assertions[assertion_key].operation_modes = ref_assertion.operation_modes;

		testCase.assertions[assertion_key].rationale = "";
		if (ref_assertion.rationale) {
			testCase.assertions[assertion_key].assertion_rationale = ref_assertion.rationale;
		}
		if (ref_assertion.examples) {
			testCase.assertions[assertion_key].assertion_examples = ref_assertion.examples;
		}
		if (ref_assertion.pass_strategy) {
			testCase.assertions[assertion_key].pass_strategy = ref_assertion.pass_strategy;
		}

        if (!testCase.assertions[assertion_key].css_target) {
        	// Use the referenced assertion's css target if it isn't overridden by the assertion link
			testCase.assertions[assertion_key].css_target = ref_assertion.css_target;
		}

		if (!testCase.assertions[assertion_key].results) {
			testCase.assertions[assertion_key].results = {}
		}

		//Add missing AT
		for(let at in ATBrowsers.at){
			//Add an empty versions array if we don't have any info on versions
			if (!testCase.assertions[assertion_key].results.hasOwnProperty(at)) {
				testCase.assertions[assertion_key].results[at] = {
					"browsers": {},
				}
			}

			//Set this ID so we can use it later with a `this` scope where `this` is the AT object
			testCase.assertions[assertion_key].results[at].id = at;
			testCase.assertions[assertion_key].results[at].core_support = [];
			testCase.assertions[assertion_key].results[at].core_support_string = 'unknown';
			testCase.assertions[assertion_key].results[at].extended_support = [];
			testCase.assertions[assertion_key].results[at].extended_support_string = 'unknown';
			testCase.assertions[assertion_key].core_support_by_at_browser[at] = {};

			let validBrowsers = ATBrowsers.at[at].core_browsers.concat(ATBrowsers.at[at].extended_browsers);
			validBrowsers.forEach(function(browser) {
				if (!testCase.assertions[assertion_key].results[at].browsers) {
					//Add the missing browser property
					testCase.assertions[assertion_key].results[at].browsers = {};
				}

				if (!testCase.assertions[assertion_key].results[at].browsers[browser]) {
					//Add an empty array to make future operations easier
					testCase.assertions[assertion_key].results[at].browsers[browser] = {
						"support": "u", //unknown support
						"id": browser
					};
				}

				testCase.assertions[assertion_key].core_support_by_at_browser[at][browser] = {
					'string': null,
					'values': [],
					'some_support_behind_settings': false
				};

				// copy over notes
				if (testCase.assertions[assertion_key].browserNotes
					&& testCase.assertions[assertion_key].browserNotes[at]
					&& testCase.assertions[assertion_key].browserNotes[at][browser]) {
					testCase.assertions[assertion_key].results[at].browsers[browser].notes = testCase.assertions[assertion_key].browserNotes[at][browser];
				}

				// Auto set this to NA if the assertion link indicates that this AT is not applicable
				if (ref_assertion.exclude_at
					&& ref_assertion.exclude_at[at]) {
					testCase.assertions[assertion_key].results[at].browsers[browser].support = "na";
				}

				if (testCase.assertions[assertion_key].exclude_at
					&& testCase.assertions[assertion_key].exclude_at[at]) {
					testCase.assertions[assertion_key].results[at].browsers[browser].support = "na";
				}

				if (ref_assertion.exclude_browsers
					&& ref_assertion.exclude_browsers[browser]) {
					testCase.assertions[assertion_key].results[at].browsers[browser].support = "na";
				}

				if (testCase.assertions[assertion_key].exclude_browsers
					&& testCase.assertions[assertion_key].exclude_browsers[browser]) {
					testCase.assertions[assertion_key].results[at].browsers[browser].support = "na";
				}

				if (!supports_by_at[ATBrowsers.at[at].type]) {
					// This test case does not support this type of AT
					testCase.assertions[assertion_key].results[at].browsers[browser].support = "na";
				}

				if (testCase.assertions[assertion_key].results[at].browsers[browser].output) {
					// Set the support property based on the result of the output.
					var results = [];
					testCase.assertions[assertion_key].results[at].browsers[browser].some_support_behind_settings = false;
					testCase.assertions[assertion_key].results[at].browsers[browser].output.forEach(function(output) {
						if (output.behind_setting) {
							testCase.assertions[assertion_key].results[at].browsers[browser].some_support_behind_settings = true;
						}
						results.push(output.result);
					});

					// Reduce it to unique values
					results = results.unique();

					// unknown or n/a support by default
					if (testCase.assertions[assertion_key].supports_at.includes(ATBrowsers.at[at].type)) {
						testCase.assertions[assertion_key].results[at].browsers[browser].support = 'unknown';
					} else {
						testCase.assertions[assertion_key].results[at].browsers[browser].support = 'na';
					}

					var pass_strategy = 'any';
					if (ref_assertion.pass_strategy) {
						pass_strategy = ref_assertion.pass_strategy;
					}

					if (pass_strategy === 'all') {
						// filter out "na" values so that they don't muddle 'y' results
						let filteredResults = results.filter(function(element) {
							return element !== "na"
						});

						// 'all' strategy, all commands must pass for the assertion
						if (filteredResults.length === 1 && filteredResults.includes('pass')) {
							testCase.assertions[assertion_key].results[at].browsers[browser].support = 'y';
						} else if (results.includes('pass')) {
							testCase.assertions[assertion_key].results[at].browsers[browser].support = 'p';
						} else if (results.includes('partial')) {
							testCase.assertions[assertion_key].results[at].browsers[browser].support = 'p';
						} else if (results.includes('fail')) {
							testCase.assertions[assertion_key].results[at].browsers[browser].support = 'n';
						} else if (results.includes('na')) {
							testCase.assertions[assertion_key].results[at].browsers[browser].support = 'na';
						} else if (results.includes('unknown')) {
							testCase.assertions[assertion_key].results[at].browsers[browser].support = 'u';
						}
					} else {
						// 'any' strategy, a single pass for a command counts a pass for the assertion
						if (results.includes('pass')) {
							testCase.assertions[assertion_key].results[at].browsers[browser].support = 'y';
						} else if (results.includes('partial')) {
							testCase.assertions[assertion_key].results[at].browsers[browser].support = 'p';
						} else if (results.includes('fail')) {
							testCase.assertions[assertion_key].results[at].browsers[browser].support = 'n';
						} else if (results.includes('na')) {
							testCase.assertions[assertion_key].results[at].browsers[browser].support = 'na';
						} else if (results.includes('unknown')) {
							testCase.assertions[assertion_key].results[at].browsers[browser].support = 'u';
						}
					}
				}

				// Set associated IDs to help define the support point
				testCase.assertions[assertion_key].results[at].browsers[browser].id = browser;
				testCase.assertions[assertion_key].results[at].browsers[browser].testId = testCase.id;
				testCase.assertions[assertion_key].results[at].browsers[browser].ATId = at;
				testCase.assertions[assertion_key].results[at].browsers[browser].test_title = testCase.title;
				testCase.assertions[assertion_key].results[at].browsers[browser].support_string = helper.generateSupportString(testCase.assertions[assertion_key].results[at].browsers[browser].support);

				// Set support arrays
				let support = testCase.assertions[assertion_key].results[at].browsers[browser].support;
				testCase.assertions[assertion_key].core_support_by_at_browser[at][browser].values.push(support);
				testCase.assertions[assertion_key].core_support_by_at_browser[at][browser].string = helper.generateSupportString(testCase.assertions[assertion_key].core_support_by_at_browser[at][browser].values);
				if (testCase.assertions[assertion_key].results[at].browsers[browser].some_support_behind_settings) {
					testCase.assertions[assertion_key].core_support_by_at_browser[at][browser].some_support_behind_settings = testCase.assertions[assertion_key].results[at].browsers[browser].some_support_behind_settings;
				}

				if (ATBrowsers.at[at].core_browsers.includes(browser)) {
					testCase.assertions[assertion_key].results[at].core_support.push(support);

					if (testCase.assertions[assertion_key].results[at].browsers[browser].some_support_behind_settings) {
						testCase.assertions[assertion_key].results[at].some_support_behind_settings = testCase.assertions[assertion_key].results[at].browsers[browser].some_support_behind_settings;
					}

					if (ATBrowsers.core_at.includes(at)) {
                        testCase.assertions[assertion_key].core_support[ATBrowsers.at[at].type].push(support);
                        if (ref_assertion.strength[ATBrowsers.at[at].type] === "MUST" || ref_assertion.strength[ATBrowsers.at[at].type] === "MUST NOT") {
							testCase.core_support[ATBrowsers.at[at].type].push(support);
						}

						if (testCase.assertions[assertion_key].results[at].browsers[browser].some_support_behind_settings) {
							testCase.assertions[assertion_key].some_support_behind_settings = testCase.assertions[assertion_key].results[at].browsers[browser].some_support_behind_settings;
						}
					} else {
                        testCase.assertions[assertion_key].extended_support[ATBrowsers.at[at].type].push(support);
						testCase.extended_support[ATBrowsers.at[at].type].push(support);
					}
				} else if (ATBrowsers.at[at].extended_browsers.includes(browser)) {
					testCase.assertions[assertion_key].results[at].extended_support.push(support);
					testCase.extended_support[ATBrowsers.at[at].type].push(support);
				}

				// Set the priority for manual testing
				if (testCase.type === 'external') {
					// External test, low or no priority. (no priority for now)
					testCase.assertions[assertion_key].results[at].browsers[browser].priority = null;
				} else {
					// Internal tests, higher priority
					if (ATBrowsers.core_at.includes(at) && ATBrowsers.at[at].core_browsers.includes(browser)) {
						// core support
						if (support === 'u') {
							// Unknown core support is always top priority
							testCase.assertions[assertion_key].results[at].browsers[browser].priority = 0;
						} else if (['n', 'p'].includes(support)) {
							let date = moment(testCase.assertions[assertion_key].results[at].browsers[browser].date);
							let diff = now.diff(date, 'days');
							if (diff >= 6) {
								// Older tests should have a higher priority
								testCase.assertions[assertion_key].results[at].browsers[browser].priority = 1;
							} else {
								testCase.assertions[assertion_key].results[at].browsers[browser].priority = 2;
							}
						} else if (support === 'y') {
							let date = moment(testCase.assertions[assertion_key].results[at].browsers[browser].date);
							let diff = now.diff(date, 'days');
							if (diff >= 12) {
								// Older tests should have a higher priority
								testCase.assertions[assertion_key].results[at].browsers[browser].priority = 3;
							} else {
								testCase.assertions[assertion_key].results[at].browsers[browser].priority = 4;
							}
						} else {
							// na (no need to test)
							testCase.assertions[assertion_key].results[at].browsers[browser].priority = null;
						}
					} else {
						// extended support
						if (support === 'u') {
							testCase.assertions[assertion_key].results[at].browsers[browser].priority = 5;
						} else if (['n', 'p'].includes(support)) {
							testCase.assertions[assertion_key].results[at].browsers[browser].priority = 6;
						} else if (support === 'y') {
							testCase.assertions[assertion_key].results[at].browsers[browser].priority = 7;
						} else {
							// na (no need to test)
							testCase.assertions[assertion_key].results[at].browsers[browser].priority = null;
						}
					}
				}

			});

			//Set support strings for the AT
			testCase.assertions[assertion_key].results[at].core_support_string = helper.generateSupportString(testCase.assertions[assertion_key].results[at].core_support);
			testCase.assertions[assertion_key].results[at].extended_support_string = helper.generateSupportString(testCase.assertions[assertion_key].results[at].extended_support);
		}

		at_types.forEach(type => {
			//Set support strings for the assertion
			testCase.assertions[assertion_key].core_support_string[type] = helper.generateSupportString(testCase.assertions[assertion_key].core_support[type]);
			testCase.assertions[assertion_key].extended_support_string[type] = helper.generateSupportString(testCase.assertions[assertion_key].extended_support[type]);

			// aggregate must/should/may core support
			if (ref_assertion.strength[type] === "MUST" || ref_assertion.strength[type] === "MUST NOT") {
				if (testCase.assertions[assertion_key].core_support[type] && testCase.assertions[assertion_key].core_support[type].length) {
					testCase.core_must_support[type] = testCase.core_must_support[type].concat(testCase.assertions[assertion_key].core_support[type]);
				}
				testCase.core_must_support_string[type] = helper.generateSupportString(testCase.core_must_support[type]);
			} else if (ref_assertion.strength[type] === "SHOULD") {
				if (testCase.assertions[assertion_key].core_support[type] && testCase.assertions[assertion_key].core_support[type].length) {
					testCase.core_should_support[type] = testCase.core_should_support[type].concat(testCase.assertions[assertion_key].core_support[type]);
				}
				testCase.core_should_support_string[type] = helper.generateSupportString(testCase.core_should_support[type]);
			} else {
				if (testCase.assertions[assertion_key].core_support[type] && testCase.assertions[assertion_key].core_support[type].length) {
					testCase.core_may_support[type] = testCase.core_may_support[type].concat(testCase.assertions[assertion_key].core_support[type]);
				}
				testCase.core_may_support_string[type] =  helper.generateSupportString(testCase.core_may_support[type]);
			}
		});

		delete testCase.assertions[assertion_key].browserNotes;
	});

	//Set support strings for the test
	at_types.forEach(type => {
		testCase.core_support_string[type] = helper.generateSupportString(testCase.core_support[type]);
		testCase.extended_support_string[type] = helper.generateSupportString(testCase.extended_support[type]);
	});
};

helper.generateSupportString = function(support) {
	if (typeof support === "string") {
		let supportString = '';
		let supportClass = '';
		switch(support) {
			case 'y':
				supportString = 'yes';
				supportClass = 'ye';
				break;
			case 'n':
				supportString = 'none';
				supportClass = 'no';
				break;
			case 'p':
				supportString = 'partial';
				supportClass = 'pa';
				break;
			case 'na':
				supportString = 'not applicable';
				supportClass = 'na';
				break;
			default:
				supportString = 'unknown';
				supportClass = 'un';
		}

		return {
			class: supportClass,
			string: supportString
		}
	}

	if (support.length === 0) {
		return helper.generateSupportString("unknown");
	}

	// test for full na support before filtering na support
	let uniqueSupport = support.unique();
	if (uniqueSupport.length === 1 && uniqueSupport[0] === "na") {
		return helper.generateSupportString("na");
	}

	// filter out "na" values
	let filteredSupport = support.filter(function(element) {
		return element !== "na"
	});

	if (filteredSupport.length === 0) {
		return helper.generateSupportString("na");
	}

	//Get the unique values to make it easier to compare
	uniqueSupport = filteredSupport.unique();

	if (uniqueSupport.length === 1) {
		if (uniqueSupport[0] === 'y') {
			return {
				class: "ye",
				string: "supported"
			};
		}

		return helper.generateSupportString(uniqueSupport[0]);
	}

	if (uniqueSupport.length === 2 && uniqueSupport.includes('y') && uniqueSupport.includes('u')) {
		let numUnknown = filteredSupport.occurenceCount('u');
		if (numUnknown === 1) {
			return {
				class: 'pa',
				string: 'supported with '+numUnknown+' unknown result'
			}
		}

		return {
			class: 'pa',
			string: 'supported with '+numUnknown+' unknown results',
		}
	}

	let numPassing = filteredSupport.occurenceCount('y');

	if (numPassing) {
		// At least one thing is passing
		return {
			class: 'pa',
			string: 'partial ('+numPassing+'/'+filteredSupport.length+')',
		}
	}

	let numPartial = filteredSupport.occurenceCount('p');

	if (numPartial) {
		// At least one thing is passing
		return {
			class: 'pa',
			string: 'some partial support',
		}
	}

	if (support.includes('n')) {
		return {
			class: 'no',
			string: 'no known support',
		}
	}

	return {
		class: 'un',
		string: 'unknown support',
	}
};

module.exports = helper;
