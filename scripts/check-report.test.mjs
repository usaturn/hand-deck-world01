// check-report.mjs の合否の代表例を確かめる。
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('./check-report.mjs', import.meta.url))

function run(report, status = '0') {
  const dir = mkdtempSync(join(tmpdir(), 'check-report-'))
  try {
    const file = join(dir, 'report.json')
    writeFileSync(file, JSON.stringify(report))
    return spawnSync(process.execPath, [script, file, status], { encoding: 'utf8' })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const approve = { file: 'a.js', score: 20, verdict: 'APPROVE', violations: { critical: [], warnings: [] } }

test('全件 APPROVE なら合格する', () => {
  const result = run({ results: [approve], hasReject: false, hasReview: false })
  assert.equal(result.status, 0, result.stderr)
})

test('REVIEW だけでも CLI の終了コードが 0 でも失敗する', () => {
  const review = { file: 'b.js', score: 50, verdict: 'REVIEW', violations: { critical: [], warnings: ['w'] } }
  const result = run({ results: [approve, review], hasReject: false, hasReview: true })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /b\.js/)
})

test('検査した JS が 0 件なら失敗する', () => {
  const result = run({ results: [], hasReject: false, hasReview: false })
  assert.equal(result.status, 1)
})
