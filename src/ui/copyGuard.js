/*
 * Примеры кода в теории нельзя скопировать и вставить в редактор:
 * вместо кода в буфер попадает шутка. Идея курса — писать YAML руками.
 */

export const COPY_MESSAGE = "Неа! Пиши сам!";

const EXAMPLE_SELECTOR = ".theory-panel pre";


function toElement(node) {
    return node && node.nodeType === Node.TEXT_NODE
        ? node.parentElement
        : node;
}


function selectionTouchesExample(selection) {
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return false;
    }

    const range = selection.getRangeAt(0);

    return [...document.querySelectorAll(EXAMPLE_SELECTOR)].some(
        example => range.intersectsNode(example)
    );
}


let toastTimer;

function showToast(message) {
    let toast = document.querySelector(".copy-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.className = "copy-toast";
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("copy-toast--visible");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("copy-toast--visible");
    }, 1800);
}


export function initCopyGuard() {
    document.addEventListener("copy", event => {
        if (!selectionTouchesExample(window.getSelection())) {
            return;
        }

        event.clipboardData.setData("text/plain", COPY_MESSAGE);
        event.preventDefault();

        showToast(COPY_MESSAGE);
    });

    /* нельзя перетащить пример мышью прямо в редактор */
    document.addEventListener("dragstart", event => {
        const element = toElement(event.target);

        if (element && element.closest && element.closest(EXAMPLE_SELECTOR)) {
            event.preventDefault();
        }
    });
}
