import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/trpc/*": ["./certs/supabase-ca.crt", "./prisma/schema.prisma"],
  },
};

export default nextConfig;
