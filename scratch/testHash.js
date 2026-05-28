const crypto = require('crypto');
function generateHashId(url, title) {
  const seed = url || title || Math.random().toString();
  return crypto.createHash('md5').update(seed).digest('hex');
}
console.log("Hash 1:", generateHashId(
  'https://www.hrw.org/news/2026/05/26/sudan-colombians-linked-atrocities-trained-uae-bases', 
  'Sudan: Colombians Linked to Atrocities Trained in UAE Bases'
));
console.log("Hash 2:", generateHashId(
  'https://www.hrw.org/news/2026/05/26/sudan-colombians-linked-to-atrocities-trained-in-uae-bases',
  'Sudan: Colombians Linked to Atrocities Trained in UAE Bases'
));
console.log("Hash 3 (title only):", generateHashId(
  null,
  'Sudan: Colombians Linked to Atrocities Trained in UAE Bases'
));
