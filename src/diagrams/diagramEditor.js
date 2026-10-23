import { EditorView, keymap } from "@codemirror/view";
import { EditorState, Prec } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { StreamLanguage } from "@codemirror/language";
import { indentMore, indentLess } from "@codemirror/commands";

import { diagramStreamParser } from "./highlight.js";

/*
 * Редактор текста диаграммы. Подсветка собрана на StreamLanguage (как у SQL).
 *
 * onChange(text) — при каждой правке (картинка и черновик),
 * onSubmit() — Ctrl+Enter / Cmd+Enter (проверить ответ).
 */
export function createDiagramEditor(parent, initialText, { onChange, onSubmit } = {}) {
    const changeListener = EditorView.updateListener.of(update => {
        if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
        }
    });

    const keys = Prec.highest(
        keymap.of([
            {
                key: "Mod-Enter",
                run() {
                    if (onSubmit) {
                        onSubmit();
                    }

                    return true;
                }
            },
            { key: "Tab", run: indentMore, shift: indentLess }
        ])
    );

    return new EditorView({
        state: EditorState.create({
            doc: initialText,
            extensions: [
                basicSetup,
                StreamLanguage.define(diagramStreamParser),
                EditorView.lineWrapping,
                keys,
                changeListener
            ]
        }),
        parent
    });
}
