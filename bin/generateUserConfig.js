const config = {
  'admin': 'admin',
};

const jsonConfigStr = JSON.stringify(config);
const jsonConfigBuffer = Buffer.from(jsonConfigStr);
const jsonConfigBase64Str = jsonConfigBuffer.toString('base64');

console.log(jsonConfigBase64Str);
console.log(Buffer.from(jsonConfigBase64Str, 'base64').toString('utf8'));
