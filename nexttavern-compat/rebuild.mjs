import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), value = key => args[args.indexOf(key) + 1];
if (!args.includes('--upstream') || !args.includes('--out')) throw Error('node rebuild.mjs --upstream ORIGINAL_PACKAGE --out NEW_DIR');
const upstream = path.resolve(value('--upstream')), out = path.resolve(value('--out'));
if (fs.existsSync(out)) throw Error('Choose a new output directory');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'build-input.json')));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const packageRoot = path.join(out, 'package');
const entries = [];
for (const member of plan.files) {
  let bytes;
  if (member.upstream) {
    bytes = Buffer.from(fs.readFileSync(path.join(upstream, member.path), 'utf8').replaceAll('\r\n', '\n'));
    if (hash(bytes) !== member.before) throw Error('Unknown upstream input: ' + member.path);
    if (member.patch) {
      let cursor = 0;
      const parts = [];
      for (const edit of member.patch.edits) {parts.push(bytes.subarray(cursor, edit.offset), Buffer.from(edit.insert, 'base64')); cursor = edit.offset + edit.delete;}
      parts.push(bytes.subarray(cursor)); bytes = Buffer.concat(parts);
    }
  } else bytes = fs.readFileSync(path.join(root, 'package-metadata', member.path));
  if (hash(bytes) !== member.after) throw Error('Output mismatch: ' + member.path);
  const target = path.join(packageRoot, member.path);
  fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, bytes);
  entries.push({name: 'package/' + member.path, source: target, bytes: bytes.length, sha256: hash(bytes)});
}
const archive = path.join(out, plan.filename);
execFileSync('python', [path.join(root, 'release-archive.py')], {input: JSON.stringify({action: 'create', archive, entries}), encoding: 'utf8'});
const sha256 = hash(fs.readFileSync(archive));
if (sha256 !== plan.sha256) throw Error('Archive mismatch');
console.log(JSON.stringify({filename: plan.filename, sha256, files: entries.length}));
