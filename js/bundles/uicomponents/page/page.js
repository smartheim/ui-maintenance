/**
 * Class to handle a loaded page
 */
export default class Page {
    constructor(dom) {
        this.dom = dom;
    }

    /**
     * Performs a querySelector in the page content or document
     *
     * @param  {string} selector
     * @param  {DocumentElement} context
     *
     * @return {Node}
     */
    querySelector(selector, context = this.dom) {
        const result = context.querySelector(selector);

        if (!result) {
            throw new Error(`Not found the target "${selector}"`);
        }

        return result;
    }

    /**
     * Performs a querySelector
     *
     * @param  {string} selector
     * @param  {DocumentElement} context
     *
     * @return {Nodelist}
     */
    querySelectorAll(selector, context = this.dom) {
        const result = context.querySelectorAll(selector);

        if (!result.length) {
            throw new Error(`Not found the target "${selector}"`);
        }

        return result;
    }

    /**
     * Removes elements in the document
     *
     * @param  {String} selector
     *
     * @return {this}
     */
    removeContent(selector) {
        this.querySelectorAll(selector, document).forEach(element =>
            element.remove()
        );

        return this;
    }

    async timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Replace an element in the document by an element in the page
     * Optionally, it can execute a callback to the new inserted element
     *
     * @param  {String} selector
     * @param  {Function|undefined} callback
     *
     * @return {this}
     */
    async replaceContent(selector = 'body', options = null) {
        const content = this.querySelector(selector);

        if (!options || !options.animationClass)
            this.querySelector(selector, document).replaceWith(content);
        else {
            try {
                const oldMain = this.querySelector(selector, document);
                const duration = options.duration || 1;
                // First insert the new element, just before the old one.
                // The grid layout will make sure the old one is still at the front
                oldMain.parentNode.insertBefore(content, oldMain);
                // Add animation class and remove old after timeout
                oldMain.classList.add(options.animationClass);
                await this.timeout(duration * 1000)
                oldMain.remove();
            } catch (e) {
                console.warn("ANIM failed", e);
            }
        }

        if (options && typeof options.callback === 'function') {
            options.callback(content);
        }

        return this;
    }

    /**
     * Appends the content of an element in the page in other element in the document
     * Optionally, it can execute a callback for each new inserted elements
     *
     * @param  {String} selector
     * @param  {Function|undefined} callback
     *
     * @return {this}
     */
    appendContent(target = 'body', callback = undefined) {
        const content = Array.from(this.querySelector(target).childNodes);
        const fragment = document.createDocumentFragment();

        content.forEach(item => fragment.appendChild(item));

        this.querySelector(target, document).append(fragment);

        if (typeof callback === 'function') {
            content
                .filter(item => item.nodeType === Node.ELEMENT_NODE)
                .forEach(callback);
        }

        return this;
    }

    replaceNavReferences(context = 'head') {
        const documentContext = this.querySelector(context, document);
        const pageContext = this.querySelector(context);

        documentContext.querySelectorAll('link[rel="prev"]').forEach(link => link.remove());
        documentContext.querySelectorAll('link[rel="next"]').forEach(link => link.remove());
        documentContext.querySelectorAll('link[rel="parent"]').forEach(link => link.remove());

        var link;
        link = pageContext.querySelector('link[rel="prev"]');
        if (link) documentContext.append(link);
        link = pageContext.querySelector('link[rel="next"]');
        if (link) documentContext.append(link);
        link = pageContext.querySelector('link[rel="parent"]');
        if (link) documentContext.append(link);

        return this;
    }

    addNewStyles(context = 'head') {
        const currentPage = this.querySelector(context, document);
        const newPage = this.querySelector(context);

        // Inline styles are perfomed immediately
        currentPage
            .querySelectorAll('style')
            .forEach(style => style.remove());
        newPage
            .querySelectorAll('style')
            .forEach(style => currentPage.append(style));


        this.oldLinks = Array.from(
            currentPage.querySelectorAll('link[rel="stylesheet"]')
        );

        const newLinks = Array.from(
            newPage.querySelectorAll('link[rel="stylesheet"]')
        ).filter(newLink => {
            let found = this.oldLinks.findIndex(oldLink => oldLink.href == newLink.href);
            if (found != -1) {
                this.oldLinks.splice(found, 1);
                return false;
            }
            return true;
        });

        return Promise.all(
            newLinks.map(
                link =>
                    new Promise((resolve, reject) => {
                        link.addEventListener('load', resolve);
                        link.addEventListener('error', reject);
                        currentPage.append(link);
                    })
            )
        ).then(() => this);
    }

    removeOldStyles(context = 'head') {
        for (let link of this.oldLinks) {
            link.remove();
        }
        delete this.oldLinks;
        return this;
    }

    /**
     * Change the scripts of the current page
     *
     * @param {string} context
     *
     * @return Promise
     */
    replaceScripts(context = 'head') {
        const documentContext = this.querySelector(context, document);
        const pageContext = this.querySelector(context);
        const oldScripts = Array.from(
            documentContext.querySelectorAll('script')
        );
        const newScripts = Array.from(pageContext.querySelectorAll('script'));

        oldScripts.forEach(script => {
            if (!script.src) {
                script.remove();
                return;
            }

            const index = newScripts.findIndex(
                newScript => newScript.src === script.src
            );

            if (index === -1) {
                script.remove();
            } else {
                newScripts.splice(index, 1);
            }
        });

        return Promise.all(
            newScripts.map(
                script =>
                    new Promise((resolve, reject) => {
                        const scriptElement = document.createElement('script');

                        scriptElement.type = script.type || 'text/javascript';
                        scriptElement.defer = script.defer;
                        scriptElement.async = script.async;

                        if (script.src) {
                            scriptElement.src = script.src;
                            scriptElement.addEventListener('load', resolve);
                            scriptElement.addEventListener('error', reject);
                            documentContext.append(scriptElement);
                            return;
                        }

                        scriptElement.innerText = script.innerText;
                        documentContext.append(script);
                        resolve();
                    })
            )
        ).then(() => Promise.resolve(this));
    }
}
