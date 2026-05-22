import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'cpp', 'iim_ranker.cpp');
const outDir = path.join(root, 'bin');
const output = path.join(outDir, process.platform === 'win32' ? 'iim_ranker.exe' : 'iim_ranker');

mkdirSync(outDir, { recursive: true });

const candidates = process.platform === 'win32'
  ? [
      { cmd: 'g++', args: ['-O3', '-std=c++17', source, '-o', output] },
      { cmd: 'clang++', args: ['-O3', '-std=c++17', source, '-o', output] },
      { cmd: 'cl', args: ['/O2', '/EHsc', '/std:c++17', source, `/Fe:${output}`] }
    ]
  : [
      { cmd: 'g++', args: ['-O3', '-std=c++17', source, '-o', output] },
      { cmd: 'clang++', args: ['-O3', '-std=c++17', source, '-o', output] }
    ];

let compiled = false;
for (const candidate of candidates) {
  const result = spawnSync(candidate.cmd, candidate.args, { cwd: root, stdio: 'inherit' });
  if (result.status === 0 && existsSync(output)) {
    compiled = true;
    console.log(`[OK] C++ ranker compiled: ${output}`);
    break;
  }
}

if (!compiled) {
  console.warn('[WARN] C++ compiler tidak ditemukan. App tetap jalan memakai JS fallback.');
}
