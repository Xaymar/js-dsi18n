/*
    Internationalization Class for JavaScript
    Copyright (C) 2018 Michael Fabian 'Xaymar' Dirks <info@xaymar.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, version 3 of the License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/*
Dead Simple I18n Library

Languages are stored in a Map() to allow for any kind of name to be used. In
 addition to that there is a global base language, and each language can 
 specify an override base language which will be used only if that language
 is actually loaded during translation. The base language can be an array
 instead of a string, in which each language is tested in order of appearance.

The key can only be a string, while the Value is allowed to be anything. In
 case you want to implement pluralization in your translation layer, you would
 be doing it with an object value or similar. This creates a simple structure
 that can be used for various kinds of translations, and is as fast as the
 underlying Map implementation.

# Example: Evaluation of the language chain [en-US < en-GB < de-DE < de-BE]
Searching for the key will first happen in de-BE, then in de-DE, then in en-GB
 and finally in en-US. If de-BE, de-DE or en-GB is not loaded, that specific
 lookup step skips straight to the global base language, in this case en-US. If
 en-US is not loaded, the original i18n key is returned instead.

# Example: Evaluation of the language chain [en-US < en-GB < de-DE, en-GB < de-BE]
Checks first happen in de-BE, if de-BE does not have the key checks move on to
 de-DE. If de-DE is not loaded, en-GB is instead checked. If de-DE does not
 have the key, checks progress to en-GB. If en-GB does not have the key, checks
 progress to en-US. If any of them are not loaded or does not have the key, the
 next language in the base languages is checked, until the base languages are
 exhausted, in which case the i18n key is returned.

# Structure
Map{
    languageName: Map{
        // Base language override (optional)
        _base: {string},
        // Key Value storage for lookup
        {string key}: {any value},
    }
}

# Internal behavior
The library will build a chain of languages to check in a loop for, to avoid
 costly recursive calls that aren't well protected against loops in base
 language definitions (i.e. de-DE depends on en-GB, en-GB depends on de-DE).
This cache is refreshed when first attempting to translate to that language,
 and flagged as dirty every time a language is loaded or a base language is
 changed.

*/

class I18n {
	/** Create a new object, ready to be used.
     * 
     * @param {string} defaultLanguage Initial base language to base all translations on.
     * @param {string} baseLanguageKey Key to use for base language overrides. (Default = _base)
     * @throws Exception on invalid parameters.
     */
	constructor(defaultLanguage, baseLanguageKey = '_base') {
		this._sanitizeLanguage(defaultLanguage);
		this._verifyKey(baseLanguageKey);

		this.languages = new Map();
		this.chains = new Map();
		this.baseLanguage = defaultLanguage;
		this.baseLanguageKey = baseLanguageKey;

		this.dirtyTs = performance.now();
		this.chainsTs = performance.now();
	}

	_verifyLanguageKnown(language) {
		if (!this.languages.has(language)) {
			throw 'language unknown';
		}
	}

	_verifyKey(key) {
		if (typeof (key) == 'string') {
			return;
		}
		throw 'key must be of type string';
	}

	_verifyKeyKnown(language, key) {
		this._verifyLanguageKnown(language);
		this._verifyKey(key);

		if (!this.languages.get(language).has(key)) {
			throw 'key unknown in language';
		}
	}

	_verifyData(data) {
		if (typeof (data) == 'string') {
			return;
		}
		if (typeof (data) == 'object') {
			return;
		}
		if (data instanceof File) {
			return;
		}
		if (data instanceof Blob) {
			return;
		}
		throw 'data must be of type string, object, File or Blob';
	}

	_sanitizeLanguage(language) {
		try {
			this._verifyKey(language);
		} catch (e) {
			throw 'language must be of type string';
		}
		return language.toLowerCase();
	}

	_defaultResolver(language, key, element) {
		element;
		return this.translate(key, language);
	}

	_defaultApplier(language, key, translation, element) {
		try {
			element.textContent = translation;
			return true;
		} catch (e) {
			return false;
		}
	}

	/** Caches the necessary language chain for translation.
     * 
     * Creates and returns a language chain required for translation, avoiding
     *  recursive loops that never end in the process. The chain will not 
     *  evalute the entire branch first, instead it will check all branches
     *  and then list the childs of those branches. This is an expensive
     *  operation and should only be done once on every language update.
     * 
     * Example:
     *  de-DE +- en-GB - en-US - de-DE (- en-GB, en-US, ... [recursive])
     *        \- en-US - de-DE (- en-GB, en-US, ... [recursive])
     * Result: [de-DE, en-GB, en-US]
     * Explanation: de-DE depends on both en-GB and en-US, and will check both
     *  before considering the next branch. Since all dependencies are resolved
     *  early, a recursive lookup is prevented here.
     * 
     * Example:
     *  
     * 
     * @param {string} language 
     * @returns {array} Translation chain
     */
	_cacheChain(language) {
		// This caches a chain so that we do not have to rebuild this every
		//  lookup. It is important that there are no recursive loops in this
		//  code, which means we can't rely on this function to work until the
		//  cache is completed.

		// Have there been changes to the timestamp?
		if (this.chainsTs < this.dirtyTs) {
			// If yes, clear all chains for rebuilding.
			this.chainsTs = this.dirtyTs;
			this.chains.clear();
		}

		// Do we have a chain cached?
		if (this.chains.has(language)) {
			// Yes, return the cached chain and go back to translation.
			return this.chains.get(language);
		}

		// Create a new chain without relying on our own function.
		let chain = new Array();
		chain.push(language); // Chains always contain the language itself.

		// Now we walk through the chain manually, modifying it as we go.
		for (let pos = 0; pos < chain.length; pos++) {
			// Check if the language is loaded, if not skip it.
			if (!this.languages.has(chain[pos])) {
				continue;
			}
			let languageMap = this.languages.get(chain[pos]);

			// Check if there is a base language override.
			if (!languageMap.has(this.baseLanguageKey)) {
				continue;
			}
			let baseLanguages = languageMap.get(this.baseLanguageKey);

			// Convert to array for for...in.
			if (typeof (baseLanguages) == 'string') {
				baseLanguages = [baseLanguages];
			} else if (!(baseLanguages instanceof Array)) {
				continue;
			}

			for (let base of baseLanguages) {
				base = this._sanitizeLanguage(base);
				if (!chain.includes(base) && (this.languages.has(base))) {
					chain.push(base);
				}
			}
            
			// Append the global base languages if there are no other languages left.
			if (pos == (chain.length - 1)) {
				let baseLanguages = this.baseLanguage;
				if (typeof(this.baseLanguage) == 'string') {
					baseLanguages = [this.baseLanguage];
				}
				for (let base of baseLanguages) {
					if (!chain.includes(base) && (this.languages.has(base))) {
						chain.push(base);
					}
				}
			}
		}

		// Store.
		this.chains.set(language, chain);

		// Return.
		return chain;
	}

	/** Check if a language is known.
     * 
     * @param {string} language Name of the language
     * @returns {bool} true if known.
     */
	hasLanguage(language) {
		language = this._sanitizeLanguage(language);
		return this.languages.has(language);
	}

	/** Create a new language.
     * 
     * @param {string} language Name of the language.
     * @throws Exception on invalid parameters.
     */
	createLanguage(language) {
		language = this._sanitizeLanguage(language);
		this.languages.set(language, new Map());
		this.dirtyTs = performance.now();
	}

	/** Load a new language.
     * 
     * @param {string} language Name of the language.
	 * @param {File/Blob/object/string} data Data containing a JSON representation of the language.
     * @param {string} encoding (Optional) Encoding to use when reading File or Blob.
     * @returns {Promise}
     * @throws Exception on invalid parameters or invalid data.
     */
	loadLanguage(language, data, encoding = 'utf-8') {
		// Verify input.
		language = this._sanitizeLanguage(language);
		this._verifyData(data);

		return new Promise(async (resolve, reject) => {
			try {
				let json_data;

				// Decode File, Blob and string to JSON object.
				if ((data instanceof File) || (data instanceof Blob)) {
					let freader = new FileReader();
					await new Promise((resolve2, reject2) => {
						freader.onload(() => {
							resolve2();
						});
						freader.onabort((ev) => {
							reject2(ev);
						});
						freader.onerror((ev) => {
							reject2(ev);
						});
						freader.readAsText(data, encoding);
					});
					json_data = JSON.parse(freader.result);
				} else if (typeof (data) == 'string') {
					json_data = JSON.parse(data);
				} else if (typeof (data) == 'object') {
					json_data = data;
				}

				let language_map = new Map();
				for (let key in json_data) {
					language_map.set(key, json_data[key]);
				}

				this.languages.set(language, language_map);
				this.dirtyTs = performance.now();
				resolve(language);
			} catch (e) {
				reject(e);
				return;
			}
		});
	}

	/** Save a language.
     * 
     * @param {string} language Name of the language.
     * @returns {Promise} Promise that eventually returns the JSON data of the language.
     * @throws Exception on invalid parameters and missing language.
     */
	saveLanguage(language) {
		language = this._sanitizeLanguage(language);
		this._verifyLanguageKnown(language);

		return new Promise((resolve, reject) => {
			reject;
			this._verifyLanguageKnown(language);

			let language_data = {};
			let language_map = this.languages.get(language);
			language_map.forEach((value, key, map) => {
				map;
				language_data[key] = value;
			});
			let json_data = JSON.stringify(language_data);
			resolve(json_data);
		});
	}

	/** Destroy/unload a language.
     * 
     * @param {string} language Name of the language.
     * @throws Exception on invalid parameters and missing language.
     */
	destroyLanguage(language) {
		language = this._sanitizeLanguage(language);
		this._verifyLanguageKnown(language);

		this.languages.delete(language);
		this.dirtyTs = performance.now();
	}

	/** Clear a key from a language.
     * 
     * @param {string} language Language to edit.
     * @param {string} key Key to clear.
     * @return {bool} true on success.
     * @throws Exception on invalid parameters and missing language.
     */
	clearKey(language, key) {
		// Verify and sanitize input.
		language = this._sanitizeLanguage(language);
		this._verifyKey(key);

		// Check if language exists.
		this._verifyLanguageKnown(language);

		// Delete key if exists.
		let language_map = this.languages.get(language);
		if (!language_map.has(key)) {
			return false;
		}
		language_map.delete(key);

		// If the key was the base language key, set dirty timestamp.
		if (key == this.baseLanguageKey) {
			this.dirtyTs = performance.now();
		}

		return true;
	}

	/** Set a key in a language
     * 
     * @param {string} language Language to edit.
     * @param {string} key Key to set.
     * @param {*} value New value to set.
     * @param {bool} force Force the update if the key exists. (Default = true)
     * @return {bool} true on success.
     * @throws Exception on invalid parameters and missing language.
     */
	setKey(language, key, value, force = true) {
		// Verify and sanitize input.
		language = this._sanitizeLanguage(language);
		this._verifyKey(key);

		// Check if language exists.
		this._verifyLanguageKnown(language);

		// Set key.
		let language_map = this.languages.get(language);
		if ((language_map.has(key)) && !force) {
			return false;
		}
		language_map.set(key, value);

		// If the key was the base language key, set dirty timestamp.
		if (key == this.baseLanguageKey) {
			this.dirtyTs = performance.now();
		}

		return true;
	}

	/** Get a key in a language
     * 
     * @param {string} language 
     * @param {string} key 
     * @return {*} the value
     * @throws Exception on invalid parameters, missing language and missing key.
     */
	getKey(language, key) {
		// Verify and sanitize input.
		language = this._sanitizeLanguage(language);
		this._verifyKeyKnown(language, key);

		// Get Key
		let language_map = this.languages.get(language);
		return language_map.get(key);
	}

	/** Translate a single string to any loaded language.
     * 
     * @param {string} key String to translate
     * @param {string} language Language to translate to
     * @return {string} Translated string, or if failed the string plus the language appended.
     * @throws Exception on invalid parameters.
     */
	translate(key, language) {
		// Verify and sanitize input.
		language = this._sanitizeLanguage(language);
		this._verifyKey(key);

		// Translate using the translation chain.
		let chain = this._cacheChain(language);
		let translated = key;
		for (let language of chain) {
			let languageMap = this.languages.get(language);
			if (languageMap.has(key)) {
				translated = languageMap.get(key);
				break;
			}
		}

		return translated;
	}

	/** Automatically translate the entire page using the specified property on elements.
     * 
     * @param {string} language Language to translate to
     * @param {string} property Property to search for (default 'data-i18n')
     * @param {function} resolver Function to call to find the proper translation, called with parameters ({string}language, {string}key, {Node}element) and must return a string.
     * @param {function} applier Function to call to apply the proper translation, called with parameters ({string}language, {string}key, {string}translation, {Node}element) and must return a boolean.
     * @returns {Promise} resolved when successful, rejected if applier returns false.
     * @throws Exception on invalid parameters.
     */
	domTranslate(language, property = 'data-i18n', resolver = undefined, applier = undefined) {
		language = this._sanitizeLanguage(language);
		if ((resolver != undefined) && (typeof (resolver) != 'function')) {
			throw 'resolver must be a function';
		} else if (resolver == undefined) {
			let self = this;
			resolver = (language, key, el) => {
				return self._defaultResolver(language, key, el);
			};
		}
		if ((applier != undefined) && (typeof (applier) != 'function')) {
			throw 'applier must be a function';
		} else if (applier == undefined) {
			let self = this;
			applier = (language, key, translation, el) => {
				return self._defaultApplier(language, key, translation, el);
			};
		}

		return new Promise((resolve, reject) => {
			let els = document.querySelectorAll(`[${property}]`);
			for (let el of els) {
				let key = el.getAttribute(property);
				if (!applier(language, key, resolver(language, key, el), el)) {
					reject();
					return;
				}
			}
			resolve();
		});
	}
}

// Compatible with Node.js and Browsers
if (typeof (module) != 'undefined') {
	module.exports = exports = {
		'I18n': I18n
	};
}
