import type { NextConfig } from 'next';
const production=process.env.NODE_ENV==='production';
const config: NextConfig={allowedDevOrigins:['127.0.0.1'],outputFileTracingExcludes:{'*':['./private-data/**/*','./.env*','./tests/**/*','./docs/**/*']},poweredByHeader:false,devIndicators:false,async headers(){return[{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'no-referrer'},{key:'Permissions-Policy',value:'camera=(self), geolocation=(self), microphone=()'},{key:'X-Frame-Options',value:'DENY'},...(production?[{key:'Strict-Transport-Security',value:'max-age=63072000; includeSubDomains'}]:[])]}];}};
export default config;
