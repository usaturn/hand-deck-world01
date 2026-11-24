// xrift check --json の結果を読み、全件 APPROVE のときだけ 0 で終わる。
// CLI 0.26.0 は REVIEW（警告）だけなら終了コード 0 を返すので、終了コードだけでは判定しない。
// 使い方: node scripts/check-report.mjs <report.json> <xrift check の終了コード>
import { readFileSync } from 'node:fs'

const [reportPath, statusText] = process.argv.slice(2)
const problems = []

if (statusText !== '0') {
  problems.push(`xrift check exited with status ${statusText}`)
}

let report
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'))
} catch (error) {
  problems.push(`cannot read the check report: ${error.message}`)
}

if (report !== undefined) {
  if (report === null || typeof report !== 'object' || Array.isArray(report)) {
    problems.push('the check report is not a JSON object')
  } else {
    if ('error' in report) {
      problems.push(`xrift check reported an error: ${report.error}`)
    }
    if (!Array.isArray(report.results) || report.results.length === 0) {
      problems.push('the check report has no checked files')
    } else {
      for (const result of report.results) {
        if (result?.verdict !== 'APPROVE') {
          problems.push(`${result?.file}: ${result?.verdict}`)
          const violations = [...(result?.violations?.critical ?? []), ...(result?.violations?.warnings ?? [])]
          for (const violation of violations) {
            problems.push(`  ${JSON.stringify(violation)}`)
          }
        }
      }
    }
    if (report.hasReject !== false) problems.push('hasReject is not false')
    if (report.hasReview !== false) problems.push('hasReview is not false')
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem)
  console.error('xrift check failed')
  process.exit(1)
}
console.log(`xrift check: all ${report.results.length} files APPROVE`)
