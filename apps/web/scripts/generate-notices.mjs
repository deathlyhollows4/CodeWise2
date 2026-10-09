import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  statSync,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
const root = resolve("."),
  manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const direct = new Set(Object.keys(manifest.dependencies));
const queue = [
    ...direct,
    ...["@monaco-editor/loader", "dompurify", "highlight.js"],
  ].map((name) => ({ name, from: root })),
  seen = new Set(),
  notices = [];
function findPackage(name, from) {
  let search = from;
  while (true) {
    const candidate = join(search, "node_modules", name);
    if (existsSync(join(candidate, "package.json"))) return candidate;
    const parent = dirname(search);
    if (parent === search) return null;
    search = parent;
  }
}
while (queue.length) {
  const { name, from } = queue.shift();
  const dir = findPackage(name, from);
  if (!dir || seen.has(dir)) continue;
  seen.add(dir);
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const files = readdirSync(dir).filter(
    (file) =>
      /^(licen[cs]e|copying|notice|thirdpartynotices)([-_.]|$)/i.test(file) &&
      statSync(join(dir, file)).isFile(),
  );
  const text = files
    .map((file) => `${file}\n${readFileSync(join(dir, file), "utf8")}`)
    .join("\n\n");
  notices.push({
    name: pkg.name,
    version: pkg.version,
    license:
      typeof pkg.license === "string"
        ? pkg.license
        : pkg.license?.type || "See package license",
    homepage: pkg.homepage || "",
    direct: direct.has(pkg.name),
    notice:
      text ||
      "License metadata recorded; consult the installed package for its complete notice.",
  });
  for (const dependency of Object.keys({
    ...pkg.dependencies,
    ...pkg.optionalDependencies,
  }))
    queue.push({ name: dependency, from: dir });
}
notices.sort(
  (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
);
writeFileSync(
  join(root, "apps/web/src/dependency-notices.json"),
  JSON.stringify(notices, null, 2),
);
const markdown =
  "# Dependency notices\n\nGenerated from the packages installed in this checkout. This preserves direct dependency and installed transitive dependency notices, including the editor, Markdown renderer, math and sanitizer packages. Optional packages reflect this machine’s installation. System interface/code fonts are fallbacks and are not redistributed. KaTeX font assets are bundled with the KaTeX package and its accompanying notices. Node.js, browsers and the isolated runner are separately installed runtimes with their own distribution notices.\n\n" +
  notices
    .map(
      (n) =>
        `## ${n.name} ${n.version}\n\nLicense: ${n.license}\n\n${n.notice}\n`,
    )
    .join("\n");
writeFileSync(join(root, "docs/dependency-notices.md"), markdown);
writeFileSync(
  join(root, "THIRD_PARTY_NOTICES.md"),
  "# CodeWise2 third-party notices\n\nApplication dependency license text and attribution are preserved in [docs/dependency-notices.md](docs/dependency-notices.md) and the in-app Sources & Licenses page, including installed transitive and editor/math notices. Regenerate them with `node apps/web/scripts/generate-notices.mjs` after a dependency update.\n\nApproved content asset provenance belongs to each published problem pack and the content notices directory. Original authored drafts are not imported dataset assets and are not publication proof. NeetCode is a curriculum topic/count reference; no affiliation or blanket content license is claimed. Test fixtures are excluded from the production bank.\n\nThe application uses local system font fallbacks and bundled KaTeX font assets. No remote font or external analytics resource is required at runtime.\n",
);
console.log(
  `Preserved ${notices.length} installed dependency notices, including transitive dependencies.`,
);
