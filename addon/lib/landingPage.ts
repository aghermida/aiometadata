import fs from 'fs';

function serveLandingPage(res: any, clientIndexPath: string): void {
  const html = fs.readFileSync(clientIndexPath, 'utf8')
    .replace(/<title>.*?<\/title>/, '<title>AIOMetadata</title>')
    .replace('</head>', `  <script>window.LANDING_MODE = true;</script>\n  </head>`);

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send(html);
}

export { serveLandingPage };
module.exports = { serveLandingPage };
