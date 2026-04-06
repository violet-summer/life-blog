/**
 * 从 violet-summer-blog 同步每篇文章 frontmatter 中的 tags 到当前仓库（同相对路径）。
 * 部分文件在 fork 后位于 posts/，而旧仓库在 spec/，见 PATH_REMAPS。
 *
 * 路径解析（不依赖盘符）：
 * - 本仓库内容目录：相对本脚本所在目录解析到仓库根下的 src/content
 * - 旧博客目录：默认「与当前仓库同级」的 violet-summer-blog/src/content
 * - 可通过环境变量 VIOLET_CONTENT_DIR 覆盖（绝对路径或相对 cwd 的路径）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const LIFE_ROOT = path.join(REPO_ROOT, "src", "content");

const VIOLET_ROOT = process.env.VIOLET_CONTENT_DIR
	? path.resolve(process.env.VIOLET_CONTENT_DIR)
	: path.resolve(REPO_ROOT, "..", "violet-summer-blog", "src", "content");

/** violet 相对路径 -> life 相对路径 */
const PATH_REMAPS = [
	["spec/guide/index.md", "posts/guide/index.md"],
	["spec/markdown.md", "posts/markdown.md"],
	["spec/markdown-extended.md", "posts/markdown-extended.md"],
	["spec/draft.md", "posts/draft.md"],
];

function walkMd(dir, files = []) {
	if (!fs.existsSync(dir)) return files;
	for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, name.name);
		if (name.isDirectory()) walkMd(p, files);
		else if (name.name.endsWith(".md")) files.push(p);
	}
	return files;
}

/** @returns {{ fm: string, body: string } | null} */
function splitFrontmatter(raw) {
	if (!raw.startsWith("---")) return null;
	const end = raw.indexOf("---", 3);
	if (end === -1) return null;
	return {
		fm: raw.slice(3, end).replace(/^\r?\n/, "").replace(/\r?\n$/, ""),
		body: raw.slice(end + 3).replace(/^\r?\n/, ""),
	};
}

/** 取出 tags: 整块（含列表项） */
function extractTagsBlock(fm) {
	const lines = fm.split(/\r?\n/);
	const start = lines.findIndex((l) => /^tags:\s*/.test(l));
	if (start === -1) return null;
	const block = [lines[start]];
	const first = lines[start].trim();
	if (/^tags:\s*\[.*\]\s*$/.test(first)) {
		return block.join("\n");
	}
	let i = start + 1;
	while (i < lines.length) {
		const l = lines[i];
		if (/^\s+-\s/.test(l)) {
			block.push(l);
			i++;
			continue;
		}
		break;
	}
	return block.join("\n");
}

function removeTagsBlock(fm) {
	const lines = fm.split(/\r?\n/);
	const out = [];
	let i = 0;
	while (i < lines.length) {
		const line = lines[i];
		if (/^tags:\s*/.test(line)) {
			if (/^tags:\s*\[.*\]\s*$/.test(line.trim())) {
				i++;
				continue;
			}
			i++;
			while (i < lines.length && /^\s+-\s/.test(lines[i])) i++;
			continue;
		}
		out.push(line);
		i++;
	}
	return out.join("\n");
}

function insertTagsAfterDescription(fm, tagsBlock) {
	const lines = fm.split(/\r?\n/);
	let insertAt = -1;
	for (let i = 0; i < lines.length; i++) {
		if (/^description:\s/.test(lines[i])) {
			insertAt = i + 1;
			break;
		}
	}
	if (insertAt === -1) {
		for (let i = 0; i < lines.length; i++) {
			if (/^published:\s/.test(lines[i])) {
				insertAt = i + 1;
				break;
			}
		}
	}
	if (insertAt === -1) insertAt = 0;
	const before = lines.slice(0, insertAt);
	const after = lines.slice(insertAt);
	return [...before, tagsBlock, ...after].join("\n");
}

function mergeTags(lifeFm, violetTagsBlock) {
	if (violetTagsBlock === null || violetTagsBlock === undefined) {
		return lifeFm;
	}
	let fm = removeTagsBlock(lifeFm);
	const t = violetTagsBlock.trim();
	if (t === "tags:" || t === "") {
		return insertTagsAfterDescription(fm, "tags:");
	}
	return insertTagsAfterDescription(fm, violetTagsBlock);
}

function syncOne(violetPath, lifePath) {
	if (!fs.existsSync(violetPath) || !fs.existsSync(lifePath)) {
		return false;
	}
	const violetRaw = fs.readFileSync(violetPath, "utf8");
	const lifeRaw = fs.readFileSync(lifePath, "utf8");
	const v = splitFrontmatter(violetRaw);
	const l = splitFrontmatter(lifeRaw);
	if (!v || !l) return false;
	const tagsBlock = extractTagsBlock(v.fm);
	const newFm = mergeTags(l.fm, tagsBlock);
	if (newFm === l.fm) return false;
	const out = `---\n${newFm}\n---\n${l.body}`;
	fs.writeFileSync(lifePath, out, "utf8");
	return true;
}

let updated = 0;
let skipped = 0;

const violetFiles = walkMd(VIOLET_ROOT);
for (const vf of violetFiles) {
	const rel = path.relative(VIOLET_ROOT, vf);
	const lf = path.join(LIFE_ROOT, rel);
	if (!syncOne(vf, lf)) {
		skipped++;
	} else {
		updated++;
		console.log("tags synced:", rel);
	}
}

for (const [vRel, lRel] of PATH_REMAPS) {
	const vf = path.join(VIOLET_ROOT, vRel);
	const lf = path.join(LIFE_ROOT, lRel);
	if (syncOne(vf, lf)) {
		updated++;
		console.log("tags synced (remap):", vRel, "->", lRel);
	}
}

console.log(`Done. Updated ${updated} files.`);
