import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Create plain HTML/CSS/JS files so this app can be published on GitHub Pages.
  output: "export",
  // GitHub project sites live at /<repository-name>, while Vercel uses the root.
  basePath: isGitHubPages ? "/hackperimeter" : undefined,
  trailingSlash: true,
};

export default nextConfig;
