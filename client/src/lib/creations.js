import { fileUrl } from "../config/api";

export const IMAGE_TYPES = ["image", "background", "object"];
export const isImage = (c) => IMAGE_TYPES.includes(c.type);

// Plain-text preview of Markdown: no headings, emphasis, list markers or links
export const excerpt = (markdown = "", length = 160) => {
    const text = markdown
        .replace(/^#{1,6}\s+.*$/gm, "")
        .replace(/[*_`>~]/g, "")
        .replace(/^\s*(\d+\.|[-+])\s+/gm, "")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
    return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
};

// The individual titles from a "blog-titles" list (list items, or every line if there's no list)
const LIST_ITEM = /^\s*(\d+[.)]|[-*+])\s+/;
export const titleLines = (markdown = "") => {
    const lines = markdown.split("\n");
    const listed = lines.filter((l) => LIST_ITEM.test(l));
    return (listed.length ? listed : lines).map((l) => l.replace(LIST_ITEM, "").replace(/[*_`]/g, "").trim()).filter(Boolean);
};

export const wordCount = (markdown = "") => (markdown.match(/[\p{L}\p{N}’']+/gu) || []).length;

// "My lighthouse.webp" style file name for downloads
export const downloadName = (c) => (c.title || "toolverse").replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 60).trim() || "toolverse";

export const imageDownloadUrl = (c) => (c.imageUrl ? fileUrl(c.imageUrl, { download: downloadName(c) }) : null);

export const downloadText = (c) => {
    const blob = new Blob([c.content || ""], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${downloadName(c)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
