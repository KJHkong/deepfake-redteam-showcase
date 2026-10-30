export function findSample(data, selection) {
  return data.samples.find(s => s.section === selection.branch && s.branch === selection.branch &&
    s.source_id === selection.source_id && s.generator === selection.generator &&
    (selection.branch === 'swapping' ? s.target_id === selection.target_id : s.action === selection.action)) || null;
}
export function findVariant(sample, id) {
  return sample?.variants?.find(v => v.id === id) || null;
}
export function assetPath(path) {
  if (!/^\/assets\/images\/image-\d{3}\.png$/.test(path)) throw new Error('Invalid static image path');
  return path;
}
