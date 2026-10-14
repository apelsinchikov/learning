import { Decoration, ViewPlugin } from "@codemirror/view";

/*
 * Подсвечиваем выбранные строки:
 *
 *   обычные выбранные строки -> более тёмный фон
 *   последняя выбранная строка (где head) -> более светлый фон
 */

const selectionStyle = document.createElement("style");

selectionStyle.textContent = `
    .cm-line.cm-multi-selection-line {
        background: rgba(100, 116, 139, 0.14);
    }

    .cm-line.cm-multi-selection-active-line {
        background: rgba(100, 116, 139, 0.08);
    }
`;

document.head.appendChild(selectionStyle);


const regularLine = Decoration.line({
    attributes: { class: "cm-multi-selection-line" }
});

const activeLine = Decoration.line({
    attributes: { class: "cm-multi-selection-active-line" }
});


function buildDecorations(view) {
    const ranges = [];
    const { doc, selection } = view.state;
    const activeLineNumber = doc.lineAt(selection.main.head).number;

    for (const range of selection.ranges) {
        if (range.from === range.to) {
            continue;
        }

        const first = doc.lineAt(range.from).number;
        const last = doc.lineAt(range.to).number;

        for (let number = first; number <= last; number++) {
            const line = doc.line(number);

            ranges.push(
                (number === activeLineNumber ? activeLine : regularLine)
                    .range(line.from)
            );
        }
    }

    return Decoration.set(ranges, true);
}


export const multiLineSelection = ViewPlugin.fromClass(
    class {
        constructor(view) {
            this.decorations = buildDecorations(view);
        }

        update(update) {
            if (
                update.selectionSet ||
                update.docChanged ||
                update.viewportChanged
            ) {
                this.decorations = buildDecorations(update.view);
            }
        }
    },
    {
        decorations: plugin => plugin.decorations
    }
);
