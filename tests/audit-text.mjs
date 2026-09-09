import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
function walk(d) {
  return fs
    .readdirSync(d, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)],
    );
}
for (const f of walk("src").filter((f) => f.endsWith(".tsx"))) {
  const sf = ts.createSourceFile(
    f,
    fs.readFileSync(f, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const out = [];
  function visit(n) {
    if (ts.isJsxText(n)) {
      let t = n.getText(sf).replace(/\s+/g, " ").trim();
      if (/[a-z]{2}/i.test(t)) out.push(t);
    }
    if (
      ts.isJsxAttribute(n) &&
      n.initializer &&
      ts.isStringLiteral(n.initializer) &&
      [
        "title",
        "label",
        "description",
        "note",
        "eyebrow",
        "name",
        "aria-label",
      ].includes(n.name.getText(sf)) &&
      /^[A-Za-z]/.test(n.initializer.text)
    )
      out.push(n.name.getText(sf) + "=" + n.initializer.text);
    ts.forEachChild(n, visit);
  }
  visit(sf);
  if (out.length) console.log(f, JSON.stringify(out));
}
