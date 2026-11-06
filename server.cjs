const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/core.js':'core.js','/app.js':'app.js'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer((req,res)=>{const file=files[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Permissions-Policy':'geolocation=(), microphone=(), camera=()'});fs.createReadStream(path.join(__dirname,'docs',file)).pipe(res);}).listen(4187,'127.0.0.1',()=>console.log('となり: http://127.0.0.1:4187  (終了: Ctrl+C)'));


