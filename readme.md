# I18n (JavaScript)
Very simple JavaScript library for handling translations. Supports Node.js, Electron and other JavaScript based code runners.

## Features:
* Simple modern API with Promises and full Documentation.
* Support for languages with more than one base language and per language base language overrides.
* Cached translation chains for quick and recursion free key lookups.

# License
Licensed under Affero GNU GPLv3. See license.txt for more information.

# Documentation
`i18n.js` is fully documented using JSDoc, a format IDEs should be able to display. If in any case your IDE is not showing this information, your first reference should be `i18n.js`, not this readme.

## I18n
The class that contains all the translation data.

### constructor(string defaultLanguage, string baseLanguageKey = '_base')
Creates a new I18n object when called with `new I18n('mylanguage')`. Will set up internal structures and variables for later use. Throws exceptions.

### bool hasLanguage(string language)
Check if a language is known to this I18n object. Returns true if known. Throws exceptions.

### createLanguage(string language)
Create a new empty language, or replaces a loaded one with an empty one. Throws exceptions.

### Promise(string) loadLanguage(string language, File|Blob|object|string data, string encoding = 'utf-8')
Load a language from a File, Blob, object or string as JSON data, and store it as the language. Returns a Promise, which will resolve once it is done loading and parsing and the result will contain the loaded language name. Throws exceptions.

### Promise(string) saveLanguage(string language)
Save a language to a string as JSON data. Returns a Promise which will resolve with the JSON data string once done. Modifying the language before the returned Promise is done can result in corrupt data. Throws exceptions.

### destroyLanguage(string language)
Destroy a language, thus clearing any references to data in it. Throws exceptions.

### bool clearKey(string language, string key)
Remove a key from a language. Returns true if the key was removed. Throws exceptions.

### bool setKey(string language, string key, any value, bool force = true)
Set a key in a language to a new value, optionally overwriting the previous content (defaults to true). Returns true if successful. Throws exceptions.

### any getKey(string language, string key)
Get the value of a key in a language. Returns the value of the key if known, otherwise throws an exception.

### string translate(string key, string language)
Translate a given key to the language selected. Returns the translated string or the original key if it was not found. Throws exceptions.

### Promise domTranslate(string language, string property = 'data-i18n', function resolver = string function(string language, string key, Node element), function applier = bool function(string language, string key, string translated, Node element))
Automatically translate all elements in the current DOM which have the attribute `property`. Returns a Promise which resolves when the translation is complete. Throws exceptions.
