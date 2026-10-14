import mermaid from "mermaid";

mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict"
});


/*
 * Находит в DOM блоки .mermaid и превращает их в SVG.
 * Вызывать нужно после того, как HTML урока уже вставлен на страницу.
 */
export async function renderMermaid() {
    const diagrams = document.querySelectorAll(".mermaid");

    if (!diagrams.length) {
        return;
    }

    try {
        await mermaid.run({ nodes: diagrams });
    } catch (error) {
        console.error("Mermaid rendering error:", error);
    }
}
