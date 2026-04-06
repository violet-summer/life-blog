import { getSiteRoot } from "@utils/url-utils";
import type { APIRoute } from "astro";

// 项目部署在子路径时，Disallow 需带 base（如 /life-blog/_astro/）
const disallowAstro = new URL("_astro/", getSiteRoot()).pathname;

const robotsTxt = `
User-agent: *
Disallow: ${disallowAstro}

Sitemap: ${new URL("sitemap-index.xml", getSiteRoot()).href}
`.trim();

export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
