import React, { useEffect, useRef } from 'react';

// ─── KQL Simulator Component ────────────────────────────────────────────────
// Embeds the KQL interpreter as an isolated iframe inside the React frontend.
// All logic runs in the iframe — no dependency conflicts with the host app.

const KQL_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KQL Simulator</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#f8f7f4;color:#1a1a18;padding:16px}
@media(prefers-color-scheme:dark){body{background:#181816;color:#e8e6de}}
.root{display:flex;flex-direction:column;gap:12px}
.btn{padding:6px 14px;font-size:13px;border:0.5px solid #ccc;border-radius:8px;cursor:pointer;background:transparent;color:inherit;font-family:inherit}
.btn:hover{background:rgba(0,0,0,0.05)}
.btn-run{background:#e6f1fb;color:#185fa5;border-color:#85b7eb;font-weight:500}
.btn-sql{background:#eaf3de;color:#3b6d11;border-color:#97c459}
.btn-clear{background:#fcebeb;color:#a32d2d;border-color:#f09595}
.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.editor-wrap{background:rgba(0,0,0,0.04);border:0.5px solid rgba(0,0,0,0.15);border-radius:8px;overflow:hidden}
textarea#kql-editor{width:100%;min-height:110px;padding:12px;font-family:'Fira Code','Cascadia Code','Consolas',monospace;font-size:13px;line-height:1.7;background:transparent;color:inherit;border:none;resize:vertical;outline:none}
.error-bar{background:#fcebeb;color:#a32d2d;font-size:12px;padding:8px 12px;border-radius:8px;display:none}
.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.metric{background:rgba(0,0,0,0.04);border-radius:8px;padding:10px 12px}
.metric-label{font-size:11px;color:#888;margin-bottom:4px}
.metric-val{font-size:20px;font-weight:500}
.result-wrap{overflow-x:auto;border:0.5px solid rgba(0,0,0,0.12);border-radius:8px}
table.res{width:100%;border-collapse:collapse;font-size:12px}
table.res th{text-align:left;padding:7px 10px;background:rgba(0,0,0,0.04);color:#888;font-weight:500;font-size:11px;border-bottom:0.5px solid rgba(0,0,0,0.1);white-space:nowrap}
table.res td{padding:6px 10px;border-bottom:0.5px solid rgba(0,0,0,0.07);white-space:nowrap}
table.res tr:last-child td{border-bottom:none}
table.res tr:hover td{background:rgba(0,0,0,0.03)}
.chart-wrap{background:#fff;border:0.5px solid rgba(0,0,0,0.1);border-radius:8px;padding:16px;display:none}
@media(prefers-color-scheme:dark){.chart-wrap{background:#1e1e1c}}
.sql-wrap{background:rgba(0,0,0,0.04);border:0.5px solid rgba(0,0,0,0.1);border-radius:8px;padding:12px;font-family:monospace;font-size:11px;line-height:1.6;color:#888;display:none;max-height:200px;overflow-y:auto;white-space:pre}
.examples-row{display:flex;gap:6px;flex-wrap:wrap}
.ex-btn{padding:4px 10px;font-size:11px;border:0.5px solid rgba(0,0,0,0.12);border-radius:12px;cursor:pointer;background:transparent;color:#888;font-family:inherit}
.ex-btn:hover{background:rgba(0,0,0,0.05);color:inherit}
.section-label{font-size:11px;font-weight:500;color:#aaa;text-transform:uppercase;letter-spacing:.5px}
</style>
</head>
<body>
<div class="root">
  <div><span class="section-label">Queries de exemplo</span></div>
  <div class="examples-row" id="examples-row"></div>
  <div class="editor-wrap">
    <textarea id="kql-editor" spellcheck="false">SecurityEvent
| where EventID == 4625
| summarize Falhas = count(), Contas = dcount(Account) by Computer
| order by Falhas desc</textarea>
  </div>
  <div class="toolbar">
    <button class="btn btn-run" onclick="runQuery()">&#9654; Executar</button>
    <button class="btn btn-sql" onclick="toggleSQL()">Exportar SQL</button>
    <button class="btn" onclick="toggleDataPreview()">Ver tabela raw</button>
    <button class="btn btn-clear" onclick="clearEditor()">Limpar</button>
    <span id="timing" style="font-size:12px;color:#aaa;margin-left:auto"></span>
  </div>
  <div class="error-bar" id="error-bar"></div>
  <div class="metrics" id="metrics" style="display:none"></div>
  <div id="chart-wrap" class="chart-wrap"><canvas id="chart" height="180"></canvas></div>
  <div class="result-wrap" id="result-wrap" style="display:none">
    <table class="res" id="result-table"></table>
  </div>
  <div class="sql-wrap" id="sql-wrap"></div>
</div>
<script>
const EXAMPLES=[
  {label:"Falhas por IP",q:"SecurityEvent\\n| where EventID == 4625\\n| summarize Falhas = count() by IpAddress\\n| order by Falhas desc\\n| top 10 by Falhas"},
  {label:"Brute-force (>5 falhas)",q:"SecurityEvent\\n| where EventID == 4625\\n| summarize Falhas = count(), Contas = dcount(Account) by Computer, IpAddress\\n| where Falhas > 5\\n| order by Falhas desc"},
  {label:"Eventos por hora",q:"SecurityEvent\\n| summarize Total = count() by bin(TimeGenerated, 1h)\\n| order by TimeGenerated asc\\n| render timechart"},
  {label:"Top contas",q:"SecurityEvent\\n| summarize Eventos = count() by Account\\n| top 10 by Eventos"},
  {label:"EventIDs distintos",q:"SecurityEvent\\n| summarize count() by EventID\\n| order by count_ desc"},
  {label:"Logons bem-sucedidos",q:"SecurityEvent\\n| where EventID == 4624\\n| project TimeGenerated, Account, Computer, IpAddress\\n| take 20"},
  {label:"Contas suspeitas",q:"SecurityEvent\\n| where EventID in (4625, 4740)\\n| summarize Falhas = count() by Account\\n| where Falhas > 3\\n| order by Falhas desc"},
  {label:"Por computador",q:"SecurityEvent\\n| summarize Total = count() by Computer\\n| order by Total desc\\n| render barchart"},
];
const computers=["DC01","DC02","WEB01","WEB02","SQL01","FILE01","VPN01","APP01","APP02","MGMT01"];
const accounts=["CORP\\\\joao.silva","CORP\\\\maria.santos","CORP\\\\pedro.lima","CORP\\\\ana.costa","CORP\\\\bob.martin","CORP\\\\guest","CORP\\\\admin","CORP\\\\svc_backup","CORP\\\\svc_monitor","NT AUTHORITY\\\\SYSTEM","NT AUTHORITY\\\\NETWORK SERVICE"];
const ips=["192.168.1.10","192.168.1.45","10.0.0.5","10.0.0.22","172.16.0.3","203.0.113.55","198.51.100.7","185.220.101.9","10.10.5.100","192.168.50.200"];
const eventIds=[4624,4624,4624,4625,4625,4634,4688,4720,4740,4768,4776];
const activities={4624:"Logon bem-sucedido",4625:"Falha no logon",4634:"Logoff",4688:"Novo processo criado",4720:"Conta de usuário criada",4740:"Conta bloqueada",4768:"Kerberos TGT solicitado",4776:"Validação de credencial NTLM"};
const logonTypes={4624:[2,3,7,10],4625:[3,7,10],4634:[2,3],4688:[4],4720:[5],4740:[3],4768:[3],4776:[3]};
function rand(a){return a[Math.floor(Math.random()*a.length)];}
function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
const BASE_TIME=new Date('2024-01-15T06:00:00Z').getTime();
const DATA=[];
for(let i=0;i<200;i++){
  const ts=new Date(BASE_TIME+i*randInt(60000,900000));
  const eid=rand(eventIds);
  const comp=rand(computers);
  const acct=eid===4625?rand([...accounts.slice(4),'CORP\\\\hacker','CORP\\\\unknown']):rand(accounts);
  const ip=rand(ips);
  const lt=rand(logonTypes[eid]||[3]);
  DATA.push({TimeGenerated:ts.toISOString().replace('T',' ').slice(0,19),_ts:ts.getTime(),Computer:comp,Account:acct,EventID:eid,Activity:activities[eid]||'Evento desconhecido',IpAddress:ip,LogonType:lt,SubjectUserName:acct.split('\\\\')[1]||acct,WorkstationName:comp,RowNum:i+1});
}
DATA.sort((a,b)=>a._ts-b._ts);
const exRow=document.getElementById('examples-row');
EXAMPLES.forEach(e=>{const b=document.createElement('button');b.className='ex-btn';b.textContent=e.label;b.onclick=()=>{document.getElementById('kql-editor').value=e.q.replace(/\\n/g,'\\n');runQuery();};exRow.appendChild(b);});
let chartInst=null,lastResult=[],sqlVisible=false,dataPreviewVisible=false;
function showError(msg){const bar=document.getElementById('error-bar');bar.textContent='Erro: '+msg;bar.style.display='block';}
function clearError(){document.getElementById('error-bar').style.display='none';}
function parseKQL(raw){const lines=raw.split('\\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('//'));const table=lines[0];const pipes=lines.slice(1).map(l=>l.startsWith('|')?l.slice(1).trim():l);return{table,pipes};}
function tokenize(expr){const tokens=[];let i=0;while(i<expr.length){if(/\\s/.test(expr[i])){i++;continue;}if(expr[i]==='"'||expr[i]==="'"){let q=expr[i],s='',j=i+1;while(j<expr.length&&expr[j]!==q)s+=expr[j++];tokens.push({t:'str',v:s});i=j+1;continue;}if(/\\d/.test(expr[i])){let s='';while(i<expr.length&&/[\\d.]/.test(expr[i]))s+=expr[i++];tokens.push({t:'num',v:parseFloat(s)});continue;}const ops=['==','!=','>=','<=','>','<','+','-','*','/','(',')',',','[',']'];let matched=false;for(const op of ops){if(expr.slice(i,i+op.length)===op){tokens.push({t:'op',v:op});i+=op.length;matched=true;break;}}if(matched)continue;const KWDS=['matches regex','!startswith','!contains','!endswith','startswith','endswith','contains','between','and','or','not','in','by'];for(const kw of KWDS){if(expr.slice(i,i+kw.length).toLowerCase()===kw){tokens.push({t:'op',v:kw.toLowerCase()});i+=kw.length;matched=true;break;}}if(matched)continue;let s='';while(i<expr.length&&!/[\\s,()[\\]"']/.test(expr[i]))s+=expr[i++];if(s){const nl=s.toLowerCase();if(nl==='true')tokens.push({t:'bool',v:true});else if(nl==='false')tokens.push({t:'bool',v:false});else if(nl==='null')tokens.push({t:'null',v:null});else tokens.push({t:'id',v:s});}}return tokens;}
function getVal(row,key){if(row[key]!==undefined)return row[key];const kl=key.toLowerCase();for(const k of Object.keys(row))if(k.toLowerCase()===kl)return row[k];return undefined;}
function evalFn(name,args){const n=name.toLowerCase();switch(n){case 'count':return args.length?args[0]:1;case 'dcount':return args[0];case 'sum':case 'avg':case 'max':case 'min':return args[0];case 'ago':return args[0];case 'now':return Date.now();case 'bin':return args[0];case 'tostring':return String(args[0]??'');case 'toint':case 'todouble':case 'tolong':return parseFloat(args[0]);case 'toupper':return String(args[0]||'').toUpperCase();case 'tolower':return String(args[0]||'').toLowerCase();case 'strlen':return String(args[0]||'').length;case 'strcat':return args.map(a=>String(a??'')).join('');case 'isnotempty':return args[0]!==undefined&&args[0]!==''&&args[0]!==null;case 'isempty':return!args[0];case 'isnull':return args[0]==null;case 'isnotnull':return args[0]!=null;case 'iff':case 'iif':return args[0]?args[1]:args[2];case 'round':return Math.round(args[0]);case 'floor':return Math.floor(args[0]);case 'ceiling':return Math.ceil(args[0]);case 'abs':return Math.abs(args[0]);case 'hourofday':{const d=new Date(args[0]);return isNaN(d)?0:d.getUTCHours();}case 'dayofweek':{const d=new Date(args[0]);return isNaN(d)?0:d.getUTCDay();}case 'make_set':return[...new Set([args[0]])].join(',');case 'make_list':return String(args[0]??'');default:return args[0];}}
function evalExpr(expr,row){const toks=tokenize(expr);function primary(i){const t=toks[i];if(!t)return[undefined,i];if(t.t==='num')return[t.v,i+1];if(t.t==='str')return[t.v,i+1];if(t.t==='bool')return[t.v,i+1];if(t.t==='null')return[null,i+1];if(t.t==='op'&&t.v==='('){const[v,ni]=orP(i+1);return[v,ni+1];}if(t.t==='op'&&t.v==='not'){const[v,ni]=primary(i+1);return[!v,ni];}if(t.t==='id'){const nm=t.v;if(toks[i+1]&&toks[i+1].v==='('){const args=[];let ni=i+2;while(ni<toks.length&&toks[ni].v!==')'){if(toks[ni].v===','){ni++;continue;}const[av,ani]=orP(ni);args.push(av);ni=ani;}return[evalFn(nm,args),ni+1];}return[getVal(row,nm),i+1];}return[undefined,i+1];}
function cmpP(i){let[left,ni]=primary(i);while(ni<toks.length){const op=toks[ni];if(!op||op.t!=='op')break;const ov=op.v.toLowerCase();if(ov==='in'){let items=[],j=ni+2;while(j<toks.length&&toks[j].v!==')'){if(toks[j].v===','){j++;continue;}const[av,aj]=primary(j);items.push(av);j=aj;}left=items.map(x=>String(x)).includes(String(left));ni=j+1;}else if(['==','!=','>','<','>=','<=','contains','!contains','startswith','!startswith','endswith','!endswith','matches regex'].includes(ov)){const[right,rni]=primary(ni+1);const L=String(left??'').toLowerCase(),R=String(right??'').toLowerCase();switch(ov){case '==':left=left==right;break;case '!=':left=left!=right;break;case '>':left=left>right;break;case '<':left=left<right;break;case '>=':left=left>=right;break;case '<=':left=left<=right;break;case 'contains':left=L.includes(R);break;case '!contains':left=!L.includes(R);break;case 'startswith':left=L.startsWith(R);break;case '!startswith':left=!L.startsWith(R);break;case 'endswith':left=L.endsWith(R);break;case '!endswith':left=!L.endsWith(R);break;case 'matches regex':try{left=new RegExp(String(right||'')).test(String(left||''));}catch(e){left=false;}break;}ni=rni;}else if(ov==='+'||ov==='-'||ov==='*'||ov==='/'){const[right,rni]=primary(ni+1);if(ov==='+')left=Number(left)+Number(right);else if(ov==='-')left=Number(left)-Number(right);else if(ov==='*')left=Number(left)*Number(right);else left=Number(left)/Number(right);ni=rni;}else break;}return[left,ni];}
function andP(i){let[left,ni]=cmpP(i);while(ni<toks.length&&toks[ni]&&toks[ni].v.toLowerCase()==='and'){const[right,rni]=cmpP(ni+1);left=left&&right;ni=rni;}return[left,ni];}
function orP(i){let[left,ni]=andP(i);while(ni<toks.length&&toks[ni]&&toks[ni].v.toLowerCase()==='or'){const[right,rni]=andP(ni+1);left=left||right;ni=rni;}return[left,ni];}
return orP(0)[0];}
function splitParts(s){const parts=[];let cur='',depth=0;for(let i=0;i<s.length;i++){if(s[i]==='('||s[i]==='[')depth++;else if(s[i]===')'||s[i]===']')depth--;if(s[i]===','&&depth===0){parts.push(cur.trim());cur='';}else cur+=s[i];}if(cur.trim())parts.push(cur.trim());return parts;}
function parseNE(p){const m=p.match(/^(\\w+)\\s*=\\s*(.+)$/s);if(m)return{name:m[1].trim(),expr:m[2].trim()};const name=p.trim().split(/\\s+/)[0];return{name,expr:p.trim()};}
function execPipe(data,pipe){const m=pipe.match(/^(\\S+)\\s*(.*)/s);if(!m)return data;const op=m[1].toLowerCase(),rest=m[2].trim();
if(op==='where')return data.filter(row=>{try{return!!evalExpr(rest,row);}catch(e){return false;}});
if(op==='project'){const parts=splitParts(rest);return data.map(row=>{const out={};parts.forEach(p=>{const{name,expr}=parseNE(p);try{out[name]=evalExpr(expr,row);}catch(e){out[name]=undefined;}});return out;});}
if(op==='project-away'){const cols=rest.split(',').map(s=>s.trim().toLowerCase());return data.map(row=>{const out={};Object.keys(row).forEach(k=>{if(!cols.includes(k.toLowerCase()))out[k]=row[k];});return out;});}
if(op==='extend'){const parts=splitParts(rest);return data.map(row=>{const out={...row};parts.forEach(p=>{const{name,expr}=parseNE(p);try{out[name]=evalExpr(expr,out);}catch(e){out[name]=undefined;}});return out;});}
if(op==='take'||op==='limit')return data.slice(0,parseInt(rest)||10);
if(op==='top'){const tm=rest.match(/^(\\d+)\\s+by\\s+(.+?)(\\s+asc|\\s+desc)?$/i);if(tm){const n=parseInt(tm[1]),col=tm[2].trim(),asc=(tm[3]||'').trim()==='asc';return[...data].sort((a,b)=>{const av=a[col],bv=b[col];if(av===undefined)return 1;if(bv===undefined)return-1;return asc?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0);}).slice(0,n);}}
if(op==='order'||op==='sort'){const bm=rest.match(/^by\\s+(.+?)(\\s+asc|\\s+desc)?$/i);if(bm){const col=bm[1].trim(),asc=(bm[2]||'').trim()==='asc';return[...data].sort((a,b)=>{const av=a[col],bv=b[col];if(av===undefined)return 1;if(bv===undefined)return-1;if(typeof av==='string'&&typeof bv==='string')return asc?av.localeCompare(bv):bv.localeCompare(av);return asc?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0);});}}
if(op==='summarize'){const byMatch=rest.match(/\\bby\\b(.+)$/i);const byStr=byMatch?byMatch[1].trim():'';const aggStr=byMatch?rest.slice(0,rest.lastIndexOf(byMatch[0])).trim():rest;const byCols=byStr?splitParts(byStr).map(b=>{const bm=b.trim().match(/^(\\w+)\\s*=\\s*(.+)$/);return bm?{alias:bm[1],expr:bm[2].trim()}:{alias:b.trim().split(/\\s+/)[0],expr:b.trim()};}):[]; const aggDefs=splitParts(aggStr).map(a=>{const am=a.trim().match(/^(\\w+)\\s*=\\s*(.+)$/);if(am)return{name:am[1],expr:am[2].trim()};const fm=a.trim().match(/^(\\w+)\\((.*)\\)$/);if(fm)return{name:fm[1]+'_',expr:a.trim()};return{name:a.trim(),expr:a.trim()};});const groups=new Map();data.forEach(row=>{const key=byCols.map(b=>String(evalExpr(b.expr,row)??'')).join('||');if(!groups.has(key))groups.set(key,{rows:[],keyVals:byCols.map(b=>({k:b.alias,v:evalExpr(b.expr,row)}))});groups.get(key).rows.push(row);});const result=[];groups.forEach(({rows:gRows,keyVals})=>{const out={};keyVals.forEach(({k,v})=>out[k]=v);aggDefs.forEach(({name,expr})=>{const fm=expr.match(/^(\\w+)\\((.*)?\\)$/i);if(!fm){out[name]=evalExpr(expr,gRows[0]);return;}const fn=fm[1].toLowerCase(),arg=fm[2]?.trim();switch(fn){case 'count':out[name]=gRows.length;break;case 'dcount':out[name]=new Set(gRows.map(r=>arg?r[arg]:1)).size;break;case 'sum':out[name]=gRows.reduce((s,r)=>s+(parseFloat(arg?r[arg]:0)||0),0);break;case 'avg':out[name]=gRows.reduce((s,r)=>s+(parseFloat(arg?r[arg]:0)||0),0)/gRows.length;break;case 'max':out[name]=Math.max(...gRows.map(r=>parseFloat(arg?r[arg]:0)||0));break;case 'min':out[name]=Math.min(...gRows.map(r=>parseFloat(arg?r[arg]:0)||0));break;case 'make_set':out[name]=[...new Set(gRows.map(r=>r[arg]))].join(',');break;case 'make_list':out[name]=gRows.map(r=>r[arg]).join(',');break;default:out[name]=gRows.length;}});result.push(out);});return result;}
if(op==='render')return data;
return data;}
function needsChart(pipes){return pipes.some(p=>p.trim().toLowerCase().startsWith('render'));}
function getRenderType(pipes){for(const p of pipes){const m=p.match(/render\\s+(\\w+)/i);if(m)return m[1].toLowerCase();}return'barchart';}
function drawChart(data,type){const wrap=document.getElementById('chart-wrap');wrap.style.display='block';if(chartInst){chartInst.destroy();chartInst=null;}const cols=Object.keys(data[0]||{}).filter(c=>c!=='_ts');const labelCol=cols[0];const valCols=cols.slice(1).filter(c=>data.some(r=>typeof r[c]==='number'||!isNaN(parseFloat(r[c]))));if(!valCols.length&&cols.length>1)valCols.push(cols[1]);const labels=data.map(r=>String(r[labelCol]??''));const COLORS=['#378ADD','#1D9E75','#D85A30','#7F77DD','#D4537E','#BA7517'];const datasets=valCols.map((vc,i)=>({label:vc,data:data.map(r=>parseFloat(r[vc])||0),backgroundColor:COLORS[i%COLORS.length]+'bb',borderColor:COLORS[i%COLORS.length],borderWidth:1,fill:type==='timechart',tension:0.3,pointRadius:type==='timechart'?2:0}));const chartType=type==='timechart'?'line':type==='piechart'?'pie':'bar';chartInst=new Chart(document.getElementById('chart'),{type:chartType,data:{labels,datasets},options:{responsive:true,plugins:{legend:{display:datasets.length>1,labels:{font:{size:11}}}},scales:chartType==='pie'?{}:{x:{ticks:{font:{size:10},maxTicksLimit:12}},y:{ticks:{font:{size:10}}}}}});}
function renderTable(data){const wrap=document.getElementById('result-wrap');const table=document.getElementById('result-table');if(!data||!data.length){wrap.style.display='none';table.innerHTML='';return;}wrap.style.display='block';const cols=Object.keys(data[0]).filter(c=>c!=='_ts');let html=\`<thead><tr>\${cols.map(c=>\`<th>\${c}</th>\`).join('')}</tr></thead><tbody>\`;data.slice(0,200).forEach(r=>{html+=\`<tr>\${cols.map(c=>{const v=r[c];if(typeof v==='number')return\`<td style="font-variant-numeric:tabular-nums">\${Number.isInteger(v)?v:v.toFixed(2)}</td>\`;return\`<td>\${v??''}</td>\`;}).join('')}</tr>\`;});if(data.length>200)html+=\`<tr><td colspan="\${cols.length}" style="color:#aaa;font-size:11px;padding:8px 10px">... e mais \${data.length-200} linhas</td></tr>\`;html+='</tbody>';table.innerHTML=html;}
function renderMetrics(data,ms){const div=document.getElementById('metrics');const cols=Object.keys(data[0]||{}).filter(c=>c!=='_ts');div.style.display='grid';div.innerHTML=\`<div class="metric"><div class="metric-label">Linhas retornadas</div><div class="metric-val">\${data.length}</div></div><div class="metric"><div class="metric-label">Colunas</div><div class="metric-val">\${cols.length}</div></div><div class="metric"><div class="metric-label">Dataset total</div><div class="metric-val">200</div></div><div class="metric"><div class="metric-label">Tempo</div><div class="metric-val">\${ms}ms</div></div>\`;}
function buildSQL(data){if(!data||!data.length)return'';const cols=Object.keys(data[0]).filter(c=>c!=='_ts');const create=\`-- Criar tabela\\nCREATE TABLE IF NOT EXISTS security_events (\\n\${cols.map(c=>{const s=data.find(r=>r[c]!==undefined)?.[c];let t='TEXT';if(typeof s==='number')t=Number.isInteger(s)?'INTEGER':'NUMERIC';return\`  \${c.toLowerCase()} \${t}\`;}).join(',\\n')}\\n);\\n\\n-- Inserir dados\`;const inserts=data.slice(0,50).map(row=>{const vals=cols.map(c=>{const v=row[c];if(v===undefined||v===null)return'NULL';if(typeof v==='number')return v;return\`'\${String(v).replace(/'/g,"''")}'\\`;});return\`INSERT INTO security_events (\${cols.map(c=>c.toLowerCase()).join(', ')}) VALUES (\${vals.join(', ')});\`;}).join('\\n');return create+'\\n'+inserts;}
function runQuery(){clearError();const wrap=document.getElementById('chart-wrap');wrap.style.display='none';if(chartInst){chartInst.destroy();chartInst=null;}document.getElementById('result-wrap').style.display='none';document.getElementById('metrics').style.display='none';document.getElementById('sql-wrap').style.display='none';sqlVisible=false;const raw=document.getElementById('kql-editor').value.trim();if(!raw)return;const t0=Date.now();try{const{table,pipes}=parseKQL(raw);if(table.toLowerCase()!=='securityevent')throw new Error(\`Tabela "\${table}" não disponível. Use SecurityEvent.\`);let data=[...DATA];const isChart=needsChart(pipes);const chartType=getRenderType(pipes);const filteredPipes=pipes.filter(p=>!p.trim().toLowerCase().startsWith('render'));for(const pipe of filteredPipes){data=execPipe(data,pipe);if(!Array.isArray(data))break;}const ms=Date.now()-t0;lastResult=data;renderMetrics(data,ms);if(isChart&&data.length>0){renderTable(data);setTimeout(()=>drawChart(data,chartType),50);}else{renderTable(data);}}catch(e){showError(e.message||String(e));document.getElementById('metrics').style.display='none';}}
function toggleSQL(){const wrap=document.getElementById('sql-wrap');sqlVisible=!sqlVisible;if(sqlVisible){const sql=buildSQL(lastResult);if(!sql){wrap.style.display='none';return;}wrap.textContent=sql;wrap.style.display='block';}else{wrap.style.display='none';}}
function toggleDataPreview(){dataPreviewVisible=!dataPreviewVisible;if(dataPreviewVisible){lastResult=DATA.slice(0,50);renderTable(DATA.slice(0,50));document.getElementById('result-wrap').style.display='block';document.getElementById('metrics').style.display='grid';document.getElementById('metrics').innerHTML='<div class="metric"><div class="metric-label">Total de eventos</div><div class="metric-val">200</div></div><div class="metric"><div class="metric-label">Computadores</div><div class="metric-val">10</div></div><div class="metric"><div class="metric-label">EventIDs</div><div class="metric-val">8</div></div><div class="metric"><div class="metric-label">Mostrando</div><div class="metric-val">50</div></div>';}else{document.getElementById('result-wrap').style.display='none';document.getElementById('metrics').style.display='none';}}
function clearEditor(){document.getElementById('kql-editor').value='SecurityEvent\\n| take 10';clearError();document.getElementById('result-wrap').style.display='none';document.getElementById('metrics').style.display='none';document.getElementById('chart-wrap').style.display='none';document.getElementById('sql-wrap').style.display='none';if(chartInst){chartInst.destroy();chartInst=null;}sqlVisible=false;dataPreviewVisible=false;}
document.getElementById('kql-editor').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();runQuery();}if(e.key==='Tab'){e.preventDefault();const s=e.target.selectionStart;const v=e.target.value;e.target.value=v.slice(0,s)+'    '+v.slice(e.target.selectionEnd);e.target.selectionStart=e.target.selectionEnd=s+4;}});
runQuery();
<\/script>
</body>
</html>`;

// ─── Component ───────────────────────────────────────────────────────────────
export default function KqlSimulator() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(KQL_HTML);
    doc.close();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header / Explainer ─────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #042C53 0%, #185FA5 100%)',
        borderRadius: '12px',
        padding: '24px 28px',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            Simulador
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
            KQL — Kusto Query Language
          </h2>
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.7', opacity: 0.85, margin: '0 0 16px' }}>
          KQL é a linguagem de consulta do <strong>Microsoft Sentinel</strong>, <strong>Azure Monitor</strong>,{' '}
          <strong>Log Analytics</strong> e <strong>Microsoft Defender</strong>. É usada por times de segurança
          para investigar alertas, correlacionar eventos, detectar ameaças e construir dashboards operacionais
          em tempo real.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Microsoft Sentinel','Azure Monitor','Log Analytics','Defender XDR','Application Insights'].map(tag => (
            <span key={tag} style={{
              background: 'rgba(255,255,255,0.12)',
              border: '0.5px solid rgba(255,255,255,0.25)',
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '12px',
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* ── Como usar ──────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
      }}>
        {[
          { icon: '①', title: 'Escolha um exemplo', desc: 'Clique em qualquer query de exemplo para carregá-la no editor' },
          { icon: '②', title: 'Edite a query', desc: 'Modifique a query no editor. Ctrl+Enter executa sem sair do teclado' },
          { icon: '③', title: 'Execute e explore', desc: 'Veja métricas, tabela e gráficos. Use render timechart para visualizar séries temporais' },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{
            background: 'var(--color-background-secondary, #f5f5f3)',
            borderRadius: '10px',
            padding: '16px',
            border: '0.5px solid var(--color-border-tertiary, #e0e0de)',
          }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{title}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #888)', lineHeight: '1.5' }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* ── Dataset info ───────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-background-secondary, #f5f5f3)',
        borderRadius: '10px',
        padding: '12px 16px',
        border: '0.5px solid var(--color-border-tertiary, #e0e0de)',
        fontSize: '12px',
        color: 'var(--color-text-secondary, #888)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ color: '#3b6d11', fontWeight: 600 }}>● dataset local</span>
        <span>200 eventos SecurityEvent simulados — 10 computadores, 11 contas, 8 EventIDs diferentes</span>
        <span style={{ marginLeft: 'auto' }}>tabela: SecurityEvent</span>
      </div>

      {/* ── Iframe com o interpretador ─────────────────────────────── */}
      <div style={{
        border: '0.5px solid var(--color-border-tertiary, #e0e0de)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <iframe
          ref={iframeRef}
          title="KQL Simulator"
          style={{
            width: '100%',
            height: '640px',
            border: 'none',
            display: 'block',
          }}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      {/* ── Referência rápida ──────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-background-secondary, #f5f5f3)',
        borderRadius: '10px',
        padding: '16px',
        border: '0.5px solid var(--color-border-tertiary, #e0e0de)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#aaa', marginBottom: '12px' }}>
          Referência rápida
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          {[
            { op: 'where', desc: 'Filtra linhas por condição' },
            { op: 'project', desc: 'Seleciona colunas específicas' },
            { op: 'extend', desc: 'Adiciona colunas calculadas' },
            { op: 'summarize', desc: 'Agrega dados (count, sum, avg…)' },
            { op: 'order by', desc: 'Ordena resultados' },
            { op: 'top N by', desc: 'Retorna os N maiores' },
            { op: 'take / limit', desc: 'Limita número de linhas' },
            { op: 'render barchart', desc: 'Renderiza gráfico de barras' },
            { op: 'render timechart', desc: 'Renderiza série temporal' },
            { op: 'bin(col, 1h)', desc: 'Agrupa por intervalo de tempo' },
            { op: 'dcount(col)', desc: 'Conta valores distintos' },
            { op: 'make_set(col)', desc: 'Cria conjunto de valores únicos' },
          ].map(({ op, desc }) => (
            <div key={op} style={{ fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <code style={{
                background: 'rgba(55,138,221,0.1)',
                color: '#185fa5',
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>{op}</code>
              <span style={{ color: 'var(--color-text-secondary, #888)', lineHeight: '1.5' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
