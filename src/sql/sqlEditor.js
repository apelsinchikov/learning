import { EditorView, keymap } from "@codemirror/view";
import { EditorState, Prec } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { StreamLanguage } from "@codemirror/language";
import { indentMore, indentLess } from "@codemirror/commands";

import { sqlStreamParser } from "./highlight.js";

/*
 * Редактор запросов. Подсветка SQL собрана на StreamLanguage из пакета
 * @codemirror/language, отдельный пакет языка не нужен.
 *
 * onChange(text) — при каждой правке (черновик),
 * onRun() — Ctrl+Enter / Cmd+Enter (выполнить запрос).
 */
export function createSqlEditor(parent, initialText, { onChange, onRun } = {}) {
    const changeListener = EditorView.updateListener.of(update => {
        if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
        }
    });

    const runKeys = Prec.highest(
        keymap.of([
            {
                key: "Mod-Enter",
                run() {
                    if (onRun) {
                        onRun();
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
                StreamLanguage.define(sqlStreamParser),
                EditorView.lineWrapping,
                runKeys,
                changeListener
            ]
        }),
        parent
    });
}
