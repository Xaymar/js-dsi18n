# Dead Simple Internationalization Library (DSI18n)
A dead simple library to handle translations with support for Node.JS, Electron and Browsers.

## Features
* Simple but modern API with Promises.
* Fully documented, including the internal works.
* Delayed evaluation for languag trees with missing languages.
* Support for base languages with multiple languages.

## Support the Project
DSI18n, like all my other projects, is funded through [Patreon](https://www.patreon.com/Xaymar), which is my secondary source of income. If my projects have helped you, consider becoming a Patron (recurring donation) or donating once [through PayPal](https://paypal.me/Xaymar).

## License
The project is licensed under X11:

    Copyright (C) 2018-2019 Michael Fabian Dirks
    
    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL MICHAEL FABIAN DIRKS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    
    Except as contained in this notice, the name of the copyright holder shall not be used in advertising or otherwise to promote the sale, use or other dealings in this Software without prior written authorization from the copyright holder.

# Documentation
This is an addition to the documentation contained within `i18n.js`, which uses JSDoc. Any modern IDE should be capable of showing it, and even if it doesn't you should first look at the comments in `i18n.js` before looking at this file. 

## class I18n (exported as: `I18n`)
Our beloved dead simple internationalization class, ready for use. Exported if `module` is not undefined.

### Core Functionality
##### constructor(string defaultLanguage, string baseLanguageKey = '\_base')
Creates a new I18n object when called with `new I18n('mylanguage')` and sets up internal structures for quick use later. Optionally can specify an override for the base language key, which is used to detect base languages from loaded language files. Can throw exceptions if an error occurs.

#### setBaseLanguage(string language)
Changes the default base language to the new language.

#### string getBaseLanguage()
Get the current base language name.

### Language Editing and Usage
##### bool hasLanguage(string language)
Check if a language is known to this I18n object. Returns true if known. Throws exceptions.

##### createLanguage(string language)
Create a new empty language, or replaces a loaded one with an empty one. Throws exceptions.

##### Promise(string) loadLanguage(string language, File|Blob|object|string data, string encoding = 'utf-8')
Load a language from a File, Blob, object or string as JSON data, and store it as the language. Returns a Promise, which will resolve once it is done loading and parsing and the result will contain the loaded language name. Throws exceptions.

##### Promise(string) saveLanguage(string language)
Save a language to a string as JSON data. Returns a Promise which will resolve with the JSON data string once done. Modifying the language before the returned Promise is done can result in corrupt data. Throws exceptions.

##### destroyLanguage(string language)
Destroy a language, thus clearing any references to data in it. Throws exceptions.

##### bool clearKey(string language, string key)
Remove a key from a language. Returns true if the key was removed. Throws exceptions.

##### bool setKey(string language, string key, any value, bool force = true)
Set a key in a language to a new value, optionally overwriting the previous content (defaults to true). Returns true if successful. Throws exceptions.

##### any getKey(string language, string key)
Get the value of a key in a language. Returns the value of the key if known, otherwise throws an exception.

### Translation
##### string translate(string key, string language)
Translate a given key to the language selected. Returns the translated string or the original key if it was not found. Throws exceptions.

##### Promise domTranslate(string language, string property = 'data-i18n', function resolver = string function(string language, string key, Node element), function applier = bool function(string language, string key, string translated, Node element))
Automatically translate all elements in the current DOM which have the attribute specified in `property`. Returns a Promise which resolves when the translation is complete. Throws exceptions.

### Listening to Events
#### object hook(string event, function callback)
Hook a specific event with your own callback. See further below for all events.

#### unhook(object hook_id)
Removes an existing hook. You must have the id of the hook you've created before, otherwise you will not be able to unhook.

### Events
#### missingLanguage(string language)
This event is called for all languages that are missing while evaluating the translation tree. 

#### missingKey(string missingKey, string language)
Called when a key is not found in a language. Can't be used to replace the resolved text.

#### change()
Event is called for every single change, usually meant for debugging. Very expensive to hook.

