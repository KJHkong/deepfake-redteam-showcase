import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function files(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(item=>{const p=path.join(folder,item.name);if(item.isSymbolicLink())throw new Error('Symbolic links are forbidden');return item.isDirectory()?files(p):[p];});}
const forbidden=[
 /\/(?:mnt|home|tmp|root|var\/lib)\//,
 /\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|127\.0\.0\.1)\b/,
 /localhost|demo-api|harbor\.|\.gy\.ntes|CUDA_VISIBLE_DEVICES|ThriftDetectorClient|DualBranchPipeline/,
 /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,})\b/,
 /["'](?:run_id|task_id|source_sha256|target_sha256|source_path|raw_result|artifact_id|model_path)["']\s*:/,
 /\b[a-f0-9]{32,64}\b/,
];
export function validate(folder=path.join(root,'src')){
 const all=files(folder);const findings=[];
 for(const p of all){
  if(/\.(?:onnx|pth|pt|ckpt|safetensors|pkl|log|jsonl|py|env|map)$/.test(p))findings.push(path.relative(folder,p)+': forbidden file type');
  if(/\.(?:html|css|js|json|txt|svg)$/.test(p)){
   const text=fs.readFileSync(p,'utf8');for(const expression of forbidden)if(expression.test(text))findings.push(path.relative(folder,p)+': private-data pattern');
   if(p.endsWith('.html')&&(/type=["']file["']/.test(text)||/<script(?![^>]*\bsrc=)[^>]*>\s*[^<\s]/.test(text)))findings.push('Upload or inline script found');
  }
  if(p.endsWith('.png')){
   const b=fs.readFileSync(p);if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('Invalid PNG');
   for(let offset=8;offset<b.length;){const length=b.readUInt32BE(offset),kind=b.toString('ascii',offset+4,offset+8);if(['eXIf','tEXt','iTXt','zTXt'].includes(kind))findings.push(path.basename(p)+': embedded image metadata');offset+=length+12;}
  }
 }
 const data=JSON.parse(fs.readFileSync(path.join(folder,'data/showcase.json'),'utf8'));
 if(data.mode!=='precomputed_static'||data.samples.length!==25)throw new Error('Unexpected static catalogue');
 const expected={swapping:3,editing:5,'source-analyzer':5,modifier:8,detector:4};
 for(const [section,n]of Object.entries(expected))if(data.sections[section]?.length!==n)throw new Error('Missing existing display cases');
 const ids=new Set(data.samples.map(s=>s.sample_id));if(ids.size!==25)throw new Error('Duplicate sample IDs');
 function imageRefs(value){if(Array.isArray(value))return value.flatMap(imageRefs);if(value&&typeof value==='object')return [...(value.src?[value.src]:[]),...Object.values(value).flatMap(imageRefs)];return [];}
 for(const asset of imageRefs(data)){if(!/^\/assets\/images\/image-\d{3}\.png$/.test(asset)||!fs.statSync(path.join(folder,asset)).isFile())throw new Error('Missing or nonstatic image');}
 for(const sample of data.samples){
  if(sample.variants){const base=sample.variants.find(v=>v.id==='no_modifier');if(!base||base.final_image.src!==sample.generated_image.src)throw new Error('Incorrect Generator-only variant');
   if(sample.modifier&&base.detector_result!==null)throw new Error('Modified score leaked into Generator-only view');
   for(const v of sample.variants)if(v.id!=='no_modifier'&&(v.id!==sample.modifier?.tool_name||v.final_image.src!==sample.final_image.src))throw new Error('Variant mismatch');
  }
 }
 for(const html of all.filter(p=>p.endsWith('.html'))){
  const text=fs.readFileSync(html,'utf8');for(const match of text.matchAll(/(?:src|href)="(\/[^"#]*)/g)){
   const url=match[1];if(url==='/')continue;const name=path.join(folder,url);
   if(!fs.existsSync(name))throw new Error('Broken local HTML link: '+url);
  }
 }
 if(findings.length)throw new Error(findings.join('\n'));
 return {passed:true,files:all.length,cases:data.samples.length,images:all.filter(p=>/\/images\/.*\.png$/.test(p)).length,private_data_findings:0};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(validate(),null,2));
