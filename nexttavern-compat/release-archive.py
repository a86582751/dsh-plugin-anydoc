"""Deterministic release tarballs from manifest-selected files; never glob or extract."""
import gzip
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import sys
import tarfile


def run(job):
    entries = job['entries']
    names = [entry['name'] for entry in entries]
    if len(set(names)) != len(names): raise ValueError('duplicate archive entry')
    for name in names:
        if not name or '\\' in name or ':' in name or name.startswith('/') or any(x in ('', '.', '..') for x in name.split('/')):
            raise ValueError('unsafe archive entry')
    target = Path(job['archive'])
    if job['action'] == 'create':
        with target.open('xb') as out, gzip.GzipFile(filename='', mode='wb', fileobj=out, mtime=0) as zipped, tarfile.open(fileobj=zipped, mode='w', format=tarfile.PAX_FORMAT) as archive:
            for entry in sorted(entries, key=lambda entry: entry['name']):
                data = Path(entry['source']).read_bytes()
                if hashlib.sha256(data).hexdigest() != entry['sha256']: raise ValueError('archive input drift')
                info = tarfile.TarInfo(entry['name'])
                info.size, info.mode, info.mtime = len(data), 0o644, 0
                archive.addfile(info, io.BytesIO(data))
    with tarfile.open(target, 'r:gz') as archive:
        actual = archive.getmembers()
        if sorted(m.name for m in actual) != sorted(names): raise ValueError('archive entry mismatch')
        expected = {entry['name']: entry for entry in entries}
        for member in actual:
            entry = expected[member.name]
            if not member.isfile() or member.size != entry['bytes']: raise ValueError('archive type/size mismatch')
            if hashlib.sha256(archive.extractfile(member).read()).hexdigest() != entry['sha256']: raise ValueError('archive payload drift')
    return {'entries': len(entries), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}


if __name__ == '__main__':
    print(json.dumps(run(json.load(sys.stdin))))
