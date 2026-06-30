import { visit } from "unist-util-visit";

export function remarkRewriteLinks() {
  return (tree) => {
    visit(tree, "link", (node) => {
      const url = node.url;
      if (url.startsWith("http") || url.startsWith("/") || url.startsWith("#")) return;

      const slug = url.replace(/\.md$/, "");
      node.url = `/posts/${slug}/`;
    });
  };
}
