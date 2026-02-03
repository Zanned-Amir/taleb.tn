import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./i18n/request.ts"); // Path to your config

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextIntl(nextConfig);
