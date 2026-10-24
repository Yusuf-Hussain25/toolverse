import { EraserIcon, FileTextIcon, HashIcon, ImageIcon, PenLineIcon, ScissorsIcon } from "lucide-react";

// The six tools. `kind` decides which monthly allowance they use (text or image),
// and each has its own pair of colours within the brand gradient.
export const TOOLS = [
    {
        id: "article",
        path: "/tools/write-article",
        name: "Article Writer",
        short: "Article",
        kind: "text",
        icon: PenLineIcon,
        colors: ["#8b5cf6", "#6366f1"],
        blurb: "Turn a topic into a structured article with headings, in the tone you want.",
    },
    {
        id: "blog-titles",
        path: "/tools/blog-titles",
        name: "Blog Title Ideas",
        short: "Titles",
        kind: "text",
        icon: HashIcon,
        colors: ["#ec4899", "#8b5cf6"],
        blurb: "Ten catchy titles for any topic: how-tos, lists, questions and bold claims.",
    },
    {
        id: "image",
        path: "/tools/generate-image",
        name: "Image Generator",
        short: "Image",
        kind: "image",
        icon: ImageIcon,
        colors: ["#22d3ee", "#6366f1"],
        blurb: "Describe a scene and pick a style. Share your favourites with the community.",
    },
    {
        id: "background",
        path: "/tools/remove-background",
        name: "Background Remover",
        short: "Background",
        kind: "image",
        icon: EraserIcon,
        colors: ["#f97316", "#ec4899"],
        blurb: "Cut the subject out of any photo and download a transparent PNG.",
    },
    {
        id: "object",
        path: "/tools/remove-object",
        name: "Object Remover",
        short: "Object",
        kind: "image",
        icon: ScissorsIcon,
        colors: ["#14b8a6", "#22d3ee"],
        blurb: "Name something in a photo and it disappears, background filled in.",
    },
    {
        id: "resume-review",
        path: "/tools/review-resume",
        name: "Resume Review",
        short: "Resume",
        kind: "text",
        icon: FileTextIcon,
        colors: ["#f59e0b", "#f97316"],
        blurb: "A score out of 100, strengths, fixes and missing keywords for your target role.",
    },
];

export const toolById = (id) => TOOLS.find((t) => t.id === id);
export const toolGradient = (tool) => `linear-gradient(135deg, ${tool.colors[0]}, ${tool.colors[1]})`;
