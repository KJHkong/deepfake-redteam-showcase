import test from 'node:test';
import assert from 'node:assert/strict';
import {findSample,findVariant,assetPath} from '../src/assets/catalog.js';

const sample={sample_id:'sample-01',section:'swapping',branch:'swapping',source_id:'source-01',target_id:'target-01',generator:'simswap',action:null,
 variants:[{id:'no_modifier',detector_result:null,gate1:'Not evaluated'},{id:'pixelate',detector_result:{fake_score:0.8},gate1:'passed'}]};
const data={samples:[sample]};
const selection={branch:'swapping',source_id:'source-01',target_id:'target-01',generator:'simswap'};
test('matches the exact stored source, target and generator',()=>assert.equal(findSample(data,selection),sample));
test('never substitutes another generator or input combination',()=>{
 for(const field of ['source_id','target_id','generator']) assert.equal(findSample(data,{...selection,[field]:'other'}),null);
});
test('unavailable Modifier has no implicit fallback',()=>assert.equal(findVariant(sample,'gaussian_blur'),null));
test('generator-only view never borrows modified-output scores',()=>{
 assert.equal(findVariant(sample,'no_modifier').detector_result,null);
 assert.equal(findVariant(sample,'pixelate').detector_result.fake_score,0.8);
});
test('editing action and Source must both match',()=>{
 const s={...sample,section:'editing',branch:'editing',target_id:null,generator:'liveportrait_static',action:'frontal_to_left'};
 assert.equal(findSample({samples:[s]},{branch:'editing',source_id:'source-01',action:'frontal_to_right',generator:'liveportrait_static'}),null);
});
test('static image URL rejects arbitrary paths and remote assets',()=>{
 assert.equal(assetPath('/assets/images/image-001.png'),'/assets/images/image-001.png');
 for(const p of ['../../private.png','https://example.com/private.png','/data/file.json']) assert.throws(()=>assetPath(p));
});
