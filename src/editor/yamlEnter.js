import { EditorSelection, Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";

import { getNextLineIndent } from "./yamlIndent.js";

/* Enter с учётом отступов YAML (правила — в yamlIndent.js). */

export function yamlEnterCommand(view) {
    const { state } = view;

    if (state.readOnly) {
        return false;
    }

    const transaction = state.changeByRange(range => {
        const line = state.doc.lineAt(range.from);
        const before = state.sliceDoc(line.from, range.from);

        const { indent, exitList } = getNextLineIndent(before);

        /* Enter на пустом "- ": убираем дефис, остаёмся на строке */
        if (exitList) {
            return {
                changes: {
                    from: line.from,
                    to: range.to,
                    insert: indent
                },
                range: EditorSelection.cursor(line.from + indent.length)
            };
        }

        const insert = "\n" + indent;

        return {
            changes: {
                from: range.from,
                to: range.to,
                insert
            },
            range: EditorSelection.cursor(range.from + insert.length)
        };
    });

    view.dispatch(transaction, {
        scrollIntoView: true,
        userEvent: "input"
    });

    return true;
}


export const yamlEnter = Prec.highest(
    keymap.of([
        {
            key: "Enter",
            run: yamlEnterCommand
        }
    ])
);
