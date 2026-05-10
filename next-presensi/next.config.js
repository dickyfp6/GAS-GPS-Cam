/** Next.js config for static export to GitHub Pages
  - If you deploy to a project page (username.github.io/repo), set `basePath` and `assetPrefix`
  - See README for instructions to set repo name
*/
const repoName = process.env.NEXT_PUBLIC_REPO || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // When exporting static site for GitHub Pages, Next will put files in `out/`.
  // Optionally set basePath/assetPrefix when deploying to a project subpath.
  basePath: repoName ? `/${repoName}` : undefined,
  assetPrefix: repoName ? `/${repoName}/` : undefined,
}

module.exports = nextConfig;
