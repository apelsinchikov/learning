import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { indentMore, indentLess } from "@codemirror/commands";

import { multiLineSelection } from "./multiLineSelection.js";
import { yamlEnter } from "./yamlEnter.js";


/*
 * Tab добавляет отступ (два пробела), Shift+Tab убирает.
 * В YAML нельзя использовать символ табуляции — только пробелы,
 * поэтому редактор сам вставляет пробелы.
 */
const tabHandler = EditorView.domEventHandlers({
    keydown(event, view) {
        if (event.key !== "Tab") {
            return false;
        }

        event.preventDefault();

        if (event.shiftKey) {
            indentLess(view);
        } else {
            indentMore(view);
        }

        return true;
    }
});


/*
 * onChange (необязательный) вызывается с полным текстом при каждой правке —
 * по нему сохраняется черновик.
 */
export function createYamlEditor(parent, initialText, { onChange } = {}) {
    const changeListener = EditorView.updateListener.of(update => {
        if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
        }
    });

    return new EditorView({
        state: EditorState.create({
            doc: initialText,

            extensions: [
                basicSetup,
                yaml(),
                multiLineSelection,
                yamlEnter,
                tabHandler,
                changeListener
            ]
        }),

        parent
    });
}
