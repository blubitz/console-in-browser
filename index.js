/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Generates a current timestamp in "HH:MM" format.
 *
 * @returns {string} The current time as a string, zero-padded.
 */
function getTimestamp() {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
}

/**
 * Hooks into `console.log`, `console.warn`, and `console.error` to intercept messages.
 * Sends each message (with a timestamp) to the provided callback.
 * Also listens for `window.onerror` and `unhandledrejection` events to capture uncaught errors.
 *
 * @param {(time: string, type: string, message: string) => void} callback - Function to handle intercepted messages.
 */
export function consolePipe(callback) {
    const consoleFuncs = ['log', 'warn', 'error']

    function appendToConsoleOutput(message, method) {
        callback(getTimestamp(), method, message)
    }

    consoleFuncs.forEach(method => {
        const original = console[method]

        console[method] = (...args) => {
            args = args.map(a =>
                typeof a === 'object' ?
                    JSON.stringify(a, null, 2) :
                    a
            )
            appendToConsoleOutput(`${args.join(' ')}`, method)
            original.apply(console, args)
        }

        window.addEventListener('error', event => {
            appendToConsoleOutput(
                `Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
                'error'
            )
        })

        window.addEventListener('unhandledrejection', event => {
            appendToConsoleOutput(
                `Unhandled Promise Rejection: ${event.reason}`,
                'error'
            )
        })
    })
}

/**
 * Creates a styled console element inside the provided container.
 * Returns an object with methods to print messages into the console.
 *
 * @param {HTMLElement} container - The parent element to attach the console to.
 * @returns {{ printMessage: (time: string, type: string, message: string) => void }} 
 */
export function createConsoleDOM(container, colors) {
    const resolvedColors = {
        logText: '#87cefa',
        logBg: 'rgba(135, 206, 250, 0.1)',
        warnText: '#ffcc00',
        warnBg: 'rgba(255, 204, 0, 0.1)',
        errorText: '#ff5f5f',
        errorBg: 'rgba(255, 95, 95, 0.1)',
        consoleText: '#d4d4d4',
        consoleBg: '#1e1e1e',
        ...colors
    }

    const consoleElement = document.createElement('div');
    consoleElement.style.cssText = `
        display: flex;
        flex-direction: column;
        height: 300px;
        overflow-y: auto;
        font-family: monospace;
        background-color: ${resolvedColors.consoleBg};
        color: ${resolvedColors.consoleText};
        padding: 8px;
        border: 1px solid #555;
    `;
    container.appendChild(consoleElement);

    function printMessage(time, type, message) {
        if (arguments.length == 1) {
            message = arguments[0]
            time = getTimestamp()
        } else if (arguments.length == 2) {
            type = arguments[0]
            message = arguments[1]
            time = getTimestamp()
        }

        const line = document.createElement('div');
        line.style.margin = '2px 0';
        line.style.padding = '2px 4px';
        line.style.borderRadius = '3px';

        line.style.color = resolvedColors[`${type}Text`] ?? resolvedColors.consoleText;
        line.style.backgroundColor = resolvedColors[`${type}Bg`] ?? resolvedColors.consoleBg;

        line.textContent = [time, type?.toUpperCase(), message].join(' ');
        consoleElement.appendChild(line);

        // Auto-scroll to bottom
        consoleElement.scrollTop = consoleElement.scrollHeight;
    }

    return { printMessage };
}
