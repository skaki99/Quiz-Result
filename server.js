// 의존성 없는 Node 서버: node server.js  (PORT, ADMIN_KEY 환경변수)
const http=require('http'),fs=require('fs'),path=require('path');
const PORT=process.env.PORT||3000, KEY=process.env.ADMIN_KEY||'admin1234';
const Q=JSON.parse(fs.readFileSync(path.join(__dirname,'questions.json')));
const DB=path.join(__dirname,'data.json');
let rows=fs.existsSync(DB)?JSON.parse(fs.readFileSync(DB)):[];
const send=(r,c,b,t='application/json')=>{r.writeHead(c,{'Content-Type':t+'; charset=utf-8'});r.end(typeof b==='string'?b:JSON.stringify(b))};
http.createServer((req,res)=>{
 const u=new URL(req.url,'http://x');
 if(req.method==='GET'&&u.pathname==='/api/questions')return send(res,200,Q.map(({q,o})=>({q,o})));
 if(req.method==='POST'&&u.pathname==='/api/submit'){let b='';req.on('data',d=>{b+=d;if(b.length>1e5)req.destroy()});req.on('end',()=>{
  try{const{org,name,answers}=JSON.parse(b);
   if(!org?.trim()||!name?.trim()||!Array.isArray(answers)||answers.length!==Q.length)return send(res,400,{error:'입력 오류'});
   const dupe=rows.some(r=>r.org===org.trim()&&r.name===name.trim());
   if(dupe)return send(res,409,{error:'이미 제출한 참여자입니다.'});
   const score=Q.filter((x,i)=>answers[i]===x.a).length;
   rows.push({no:rows.length+1,org:org.trim().slice(0,50),name:name.trim().slice(0,30),score,at:new Date().toISOString()});
   fs.writeFileSync(DB,JSON.stringify(rows));
   send(res,200,{score,total:Q.length,wrong:Q.map((x,i)=>answers[i]===x.a?null:i+1).filter(Boolean)});
  }catch(e){send(res,400,{error:'잘못된 요청'})}});return}
 if(u.pathname==='/api/results'){if(u.searchParams.get('key')!==KEY)return send(res,401,{error:'권한 없음'});return send(res,200,{total:Q.length,rows})}
 const f=u.pathname==='/'?'index.html':u.pathname==='/results'?'results.html':null;
 if(f)return send(res,200,fs.readFileSync(path.join(__dirname,'public',f)),'text/html');
 send(res,404,{error:'not found'});
}).listen(PORT,()=>console.log('http://localhost:'+PORT+'  결과: /results?key='+KEY));
