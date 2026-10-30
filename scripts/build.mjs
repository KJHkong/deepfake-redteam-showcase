import fs from 'node:fs';
import path from 'node:path';
import {root,validate} from './check.mjs';
const source=path.join(root,'src'),destination=path.join(root,'dist');
const before=validate(source);
// Only this project's generated output is replaced; external paths are never read.
if(fs.existsSync(destination))fs.rmSync(destination,{recursive:true});
fs.cpSync(source,destination,{recursive:true,errorOnExist:true});
console.log(JSON.stringify({build:'success',output:'dist',...before,production:validate(destination)},null,2));
