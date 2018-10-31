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

let group = "i18n";
let group_style = "font-weight: bold;";
let text_style = "font-weight: inherit;";

class I18n {
    /** Create a new object, ready to be used.
     * 
     * @param {string} urlFormat URL from which to asynchronously load translation data from in the format 'url/file{0}.extension' ({0} is replaced by the lowercase language name).
     */
    constructor(urlFormat) {
        console.log("%c[%s]%c Initializing ...", group_style, group, text_style);
        if (typeof(urlFormat) != "string") {
            throw "urlFormat must be of type string";
        }
        this.url = urlFormat;
        this.languages = {};
        this.languages.base = '';
    }

    _sanitizeLanguage(language) {
        if (typeof(language) != "string") {
            throw "language must be of type string";
        }
        return language.toLowerCase();
    }

    /** Load a new language.
     * 
     * @param {string} language Name of the language file.
     * @param {boolean} isBaseLanguage Use this language as the new base language.
     * @returns {Promise}
     */
    load(language, isBaseLanguage) {
        language = this._sanitizeLanguage(language);
        if (isBaseLanguage == true) {
            this.languages.base = language;
        }
        if (this.languages[language] == undefined) {
            return new Promise((resolve, reject) => {
                let self = this;
                let url = this.url.replace('{0}', language);
                console.debug("%c[%s]%c Loading language '%s' from url '%s'...",
                    group_style, group, text_style,
                    language, url);

                let req = new XMLHttpRequest();
                req.addEventListener("error", function (event) {
                    console.log("%c[%s]%c Failed to load language '%s': ",
                        group_style, group, text_style,
                        language, event);

                });
                req.addEventListener("progress", function (event) {
                    let prc = event.loaded / event.total;
                    if (event.loaded == event.total) {
                        prc = 100.0;
                    }
                    if (event.total == 0) {
                        prc = 0.0;
                    }
                    console.debug("%c[%s]%c Loading language '%s'... [%6.2f%%]",
                        group_style, group, text_style,
                        language, prc);
                });
                req.addEventListener("load", function (event) {
                    console.debug("%c[%s]%c Parsing language '%s'...",
                        group_style, group, text_style,
                        language);
                    try {
                        self.languages[language] = JSON.parse(req.responseText);
                    } catch (e) {
                        console.log("%c[%s]%c Failed to load language '%s': ",
                            group_style, group, text_style,
                            language, e);
                        reject(e);
                        return;
                    }
                    resolve(true);
                    console.log("%c[%s]%c Loaded language '%s'.",
                        group_style, group, text_style,
                        language);
                    return;
                });
                req.open("GET", url);
                req.overrideMimeType("text/plain; charset=utf-8");
                req.send();
            });
        } else {
            console.log("%c[%s]%c Loaded language '%s'...",
                group_style, group, text_style, language);
            return new Promise((resolve, reject) => { resolve(true); });
        }
    }

    /** Translate a single string to any loaded language.
     * 
     * @param {string} string String to translate
     * @param {string} language Language to translate to
     * @return {string} Translated string, or if failed the string plus the language appended.
     */
    translate(string, language) {
        language = this._sanitizeLanguage(language);
        if (typeof(string) != "string") {
            throw "string must be of type string";
        }
        let str = this.languages[language][string];
        if (str == undefined) {
            let str = this.languages[this.languages.base][string];
            if (str == undefined) {
                console.error("%c[%s]%c Language '%s' and base language '%s' contain no translation for '%s'.",
                    group_style, group, text_style,
                    language, this.languages.base, string
                )
                return string + language;
            } else {
                console.debug("%c[%s]%c Language '%s' contains no translation for '%s', falling back to base language '%s'.",
                    group_style, group, text_style,
                    language, string, this.languages.base
                )
                return str;
            }
        } else {
            return str;
        }
    }

    /** Automatically translate the entire page using the specified property on elements.
     * 
     * @param {*} language Language to translate to
     * @param {*} property Property to search for (default 'data-i18n')
     */
    autoTranslate(language, property = 'data-i18n') {
        language = this._sanitizeLanguage(language);
        return new Promise((resolve, reject) => {
            console.debug("%c[%s]%c Starting automatic translation to language '%s'...",
                group_style, group, text_style,
                language);
            let els = document.querySelectorAll(`[${property}]`);
            for (let el of els) {
                let string = el.getAttribute(property);
                el.textContent = string;
                el.textContent = this.translate(string, language);
            }
            console.log("%c[%s]%c Translated to language '%s'.",
                group_style, group, text_style,
                language);
        });
    }
}
