const whenDomReady = () => new Promise(resolve => {
	const doc = window.document;
	if (['interactive', 'complete'].includes(doc.readyState)) {
		resolve();
	} else {
        const listener = function loaded() {
            doc.removeEventListener('DOMContentLoaded', this);
            resolve();
        };

		doc.addEventListener('DOMContentLoaded', listener);
	}
});

// pauses the execution of a Promise chain and then resumes it with the last value once the DOM is ready.
whenDomReady.resume = doc => val => whenDomReady(doc).then(() => val);

export {whenDomReady};