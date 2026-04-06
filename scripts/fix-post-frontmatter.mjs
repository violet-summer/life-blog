/**
 * Ensures every post has valid Astro frontmatter (title, published).
 */
import fs from "node:fs";
import path from "node:path";

const POSTS_ROOT = path.join("src", "content", "posts");

function walkMd(dir, out = []) {
	for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, name.name);
		if (name.isDirectory()) walkMd(p, out);
		else if (name.name.endsWith(".md")) out.push(p);
	}
	return out;
}

function slugTitle(filePath) {
	const base = path.basename(filePath, ".md");
	return base.replace(/_/g, " ").replace(/-/g, " ");
}

function firstHeading(body) {
	const m = body.match(/^#\s+(.+)$/m);
	return m ? m[1].trim() : null;
}

function parseDateFromName(name) {
	const m = name.match(/(\d{4})-(\d{2})-(\d{2})/);
	if (m) return `${m[1]}-${m[2]}-${m[3]}`;
	return null;
}

function stripLeadingFrontmatter(raw) {
	if (!raw.startsWith("---")) return { front: "", body: raw };
	const end = raw.indexOf("---", 3);
	if (end === -1) return { front: "", body: raw };
	return {
		front: raw.slice(3, end).trim(),
		body: raw.slice(end + 3).replace(/^\r?\n/, ""),
	};
}

function ensureFields(front, title, published) {
	let f = front || "";
	if (!/^title\s*:/m.test(f)) f = `title: ${JSON.stringify(title)}\n${f}`;
	if (!/^published\s*:/m.test(f)) f = `published: ${published}\n${f}`;
	return f.trim();
}

function fixFile(filePath) {
	const raw = fs.readFileSync(filePath, "utf8");
	const { front, body } = stripLeadingFrontmatter(raw);
	const name = path.basename(filePath);
	let title = firstHeading(body);
	if (!title) title = slugTitle(filePath);
	let dateStr = parseDateFromName(name);
	if (!dateStr) {
		const stat = fs.statSync(filePath);
		dateStr = stat.mtime.toISOString().slice(0, 10);
	}
	const published = dateStr;

	const merged = ensureFields(front, title, published);
	const newContent = `---\n${merged}\n---\n${body}`;
	if (newContent !== raw) fs.writeFileSync(filePath, newContent, "utf8");
}

const files = walkMd(POSTS_ROOT);
for (const f of files) fixFile(f);
console.log(`Processed ${files.length} markdown files.`);
