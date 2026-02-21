# Issue からブランチ作成スキル

指定した GitHub issue の内容をもとにブランチを作成します。

## 使い方

```
/branch-from-issue <issue番号>
```

## 手順

1. `$ARGUMENTS` から issue 番号を取得する
2. `gh` CLI で issue の情報を取得する
3. issue のタイトルからブランチ名を生成する
4. ブランチを作成してチェックアウトする
5. 結果をユーザーに伝える

## 実行

### issue 番号の確認

`$ARGUMENTS` が空の場合は、issue 番号をユーザーに尋ねてください。

### issue 情報の取得

```bash
gh issue view <issue番号> --json number,title,body
```

### ブランチ名の生成ルール

- フォーマット: `<issue番号>-<タイトルをケバブケースに変換>`
- タイトルが日本語を含む場合は、**必ずClaude自身が英語に翻訳してからケバブケースに変換すること**
- タイトルの変換:
  - 日本語タイトルは英語に翻訳する（例:「ボイドの衝突回避を実装する」→「implement-boid-collision-avoidance」）
  - 英語に変換後、すべて小文字化
  - スペース・特殊文字はハイフン `-` に置換
  - 連続するハイフンは1つにまとめる
  - 先頭・末尾のハイフンは除去
  - 長すぎる場合は50文字程度に切り詰める
- **ブランチ名に日本語（非ASCII文字）を含めてはならない**
- 例: issue #42「Add user authentication」→ `42-add-user-authentication`
- 例: issue #7「ボイドの衝突回避を実装する」→ `7-implement-boid-collision-avoidance`
- 例: issue #3「feat: PRレビュースキルと多角的レビューサブエージェントの実装」→ `3-feat-pr-review-skill-and-multi-perspective-subagents`

### ブランチ作成とチェックアウト

```bash
git checkout -b <生成したブランチ名>
```

### 完了報告

- 作成したブランチ名を表示する
- issue のタイトルと番号も併せて表示する
- 現在そのブランチにいることを伝える
