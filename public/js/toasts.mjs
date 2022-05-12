/**
 * A Toast Queue – stores toast notifications and periodically displays new ones. 
 * TODO: refactor, move into its own file? May be shared by other pages.
 * @see {toastQueue} for the global ToastQueue singleton.
 * */
 export class ToastQueue {
    /**
     * @typedef {Object} ToastOptions
     * A {@link https://en.wikipedia.org/wiki/Command_pattern Command Pattern}
     * -style record type, encoding options for a Toast to be displayed.
     * @property {string} message - The message to display to the user.
     * @property {Array<string>} classes - The CSS classes to attach to the 
     *                                     toast element, when displaying it.
     */

    /** @constructor */
    constructor() {
        /** @readonly */
        /** @type {HTMLDivElement} */
        this.toastBoxEl = document.getElementById('dashboard-toasts');
        /** @readonly from non-ToastQueue code. */
        this.toasting = false;
        /** @private The internal toast queue. Alter externally at your own peril. */
        /** @type {Array<ToastOptions>} */
        this._queue = [];
        /** @type {?number} @private The internal interval handle for periodically dequeueing and displaying a toast. */
        this._refreshHandle = null;
    }


    /**
     * Create an interval handle, periodically dequeueing and displaying a toast.
     * @param {boolean} displayNow - Whether to display a toast right away, or to wait 
     *                               the refresh interval before the first display.
     * @param {number} [refreshInterval=1000] - In ms, how long to wait between each refresh. 
     *                                          Default: 5 seconds.
     * @returns {number} handle from the {@link setInterval setInterval} function.
     */
    makeRefreshHandle(displayNow, refreshInterval) {
        if (displayNow) {
            this.popToast();
        }
        refreshInterval = refreshInterval ?? 5000;
        return setInterval(this.popToast.bind(this), refreshInterval);
    }

    /** 
     * Helper function: sets `toasting` to `true` and makes the proper refresh handle for the
     * toasting to start.
     * @param {boolean} [displayNow=true] - Whether to start toasting immediately.
     */
    startToasting(displayNow) {
        this._refreshHandle = this.makeRefreshHandle(displayNow ?? true);
        this.toasting = true;
    }

    /**
     * Helper function: adds many Toasts to the end of the queue. 
     * Starts displaying them if they aren't being displayed already.
     * Toasts are added in the sequence provided, first element in the array is displayed first.
     * @param {ToastOptions[]} toasts 
     */
    queueToasts(toasts) {
        this._queue = this._queue.concat(toasts);
        if (!this.toasting) { this.startToasting(); }
    }

    /**
     * Add a toast to be displayed to the toast queue.
     * @param {ToastOptions} toast - The toast to enqueue.
     * @param {boolean} [shouldStart=true] - Whether the queue should start toasting right away. 
     */
    queueToast(toast, shouldStart) {
        this._queue.push(toast);
        // Start toasting, in case we aren't toasting already.
        if (!this.toasting && shouldStart) { this.startToasting(); }
    }
    /**
     * Make an {@link HTMLDivElement} based on the given {@link ToastOptions}.
     * @param {ToastOptions} options - The {@link ToastOptions} record to base the toast element on.
     * @returns {HTMLDivElement}
     */
    makeToastEl(options) {
        /** @type HTMLTemplateElement */
        const toastTemplate = document.getElementById('toast');
        const toastEl = toastTemplate.content.cloneNode(true).firstElementChild;
        toastEl.classList.add(...(options?.classes ?? []));
        toastEl.getElementsByClassName('toast-message').item(0).textContent = (options?.message ?? "");
        // TODO: document
        setTimeout(() => toastEl.classList.add('toast-slideup'), 100);
        return toastEl;
    }

    /**
     * Make a function that removes the given toast element from its parent element.
     * @param {HTMLDivElement} toastEl
     * @returns {() => void} A callback that removes the element.
     */
    removeToastElAction(toastEl) {
        return () => {
            toastEl.classList.remove('toast-slideup');
            setTimeout(() => toastEl.remove(), 100)
        }
    }

    /**
     * Dequeue and display a toast. 
     * @returns {boolean} - whether there are toasts left on the queue. 
     */
    popToast() {
        // Dequeue a toast. If there's nothing on the queue, do nothing.
        const toast = this._queue.shift();
        if (toast !== undefined) {
            // Display the toast!
            const toastEl = this.makeToastEl(toast);
            this.toastBoxEl.appendChild(toastEl);
            // TODO: factor magic delayMs number out into a constant/construction-time init variable.
            setTimeout(this.removeToastElAction(toastEl), 4000);
        }

        // If we just displayed the last toast, clear the handle.
        if (this._queue.length == 0) {
            this.stopToasting();
        }
    }

    /** 
     * Stop toasting - clear the refresh handle and set 
     * {@link ToastQueue._refreshHandle} to `null`,  set 
     * {@link ToastQueue.toasting} to `false`.
     */
    stopToasting() { 
        this.toasting = false;
        clearInterval(this._refreshHandle);
        this._refreshHandle = null;
    }
}

/** 
 * @global The ToastQueue {@link https://en.wikipedia.org/wiki/Singleton_pattern singleton} instance. 
 */
export default new ToastQueue();