import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const port=Number(process.env.PORT||4173),host='localhost';
if(!fs.existsSync(path.join(root,'index.html')))throw new Error('Run npm run build first');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.otf':'font/otf','.txt':'text/plain; charset=utf-8'};
const csp="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
const server=http.createServer((request,response)=>{
 response.setHeader('Content-Security-Policy',csp);response.setHeader('X-Content-Type-Options','nosniff');response.setHeader('Referrer-Policy','no-referrer');
 if(!['GET','HEAD'].includes(request.method)){response.writeHead(405);response.end('Static files only');return;}
 let decoded;
 try{decoded=decodeURIComponent(request.url.split('?')[0]);}catch{response.writeHead(400);response.end();return;}
 if(decoded.includes('\\')||decoded.split('/').includes('..')){response.writeHead(403);response.end();return;}
 let candidate=path.resolve(root,'.'+decoded);
 if(!candidate.startsWith(root+path.sep)&&candidate!==root){response.writeHead(403);response.end();return;}
 if(fs.existsSync(candidate)&&fs.statSync(candidate).isDirectory()){
  if(!decoded.endsWith('/')){response.writeHead(308,{Location:decoded+'/'});response.end();return;}
  candidate=path.join(candidate,'index.html');
 }
 if(!fs.existsSync(candidate)||!fs.statSync(candidate).isFile()){response.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});response.end(request.method==='HEAD'?'':fs.readFileSync(path.join(root,'404.html')));return;}
 if(!fs.realpathSync(candidate).startsWith(root+path.sep)){response.writeHead(403);response.end();return;}
 response.writeHead(200,{'Content-Type':types[path.extname(candidate)]||'application/octet-stream'});
 if(request.method==='HEAD')response.end();else fs.createReadStream(candidate).pipe(response);
});
server.listen(port,host,()=>console.log(`Static preview: http://${host}:${port}/`));
