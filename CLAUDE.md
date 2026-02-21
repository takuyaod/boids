# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト構成

モノレポ構成で、Next.js アプリケーションは [app/](app/) ディレクトリに配置されています。開発コマンドはすべて `app/` ディレクトリで実行してください。

## コマンド

すべて `app/` ディレクトリで実行します：

```bash
cd app

npm run dev      # 開発サーバー起動 (http://localhost:3000)
npm run build    # プロダクションビルド
npm run start    # プロダクションサーバー起動
npm run lint     # ESLint 実行
```

テストフレームワークは未設定です。

## アーキテクチャ

- **フレームワーク**: Next.js 16（App Router）
- **言語**: TypeScript 5（strict モード）
- **スタイリング**: Tailwind CSS 4（PostCSS 経由）
- **パスエイリアス**: `@/*` → `./src/*`

### App Router 構成

ソースは [app/src/app/](app/src/app/) に配置され、Next.js App Router の規約に従います：
- [layout.tsx](app/src/app/layout.tsx) — Geist フォントを設定するルートレイアウト
- [page.tsx](app/src/app/page.tsx) — ホームページ（現在はテンプレートのプレースホルダー）
- [globals.css](app/src/app/globals.css) — Tailwind のインポートとライト/ダークテーマの CSS カスタムプロパティ

### features ディレクトリ構成

機能別のコードは [app/src/features/](app/src/features/) に配置します。各機能は以下のサブディレクトリを持ちます：

```
app/src/features/
└── <機能名>/
    ├── components/   # React コンポーネント
    └── lib/          # ビジネスロジック・ユーティリティ
```

現在の機能：
- [boids/](app/src/features/boids/) — 群れシミュレーション
  - [components/BoidsCanvas.tsx](app/src/features/boids/components/BoidsCanvas.tsx) — Canvas レンダリングコンポーネント
  - [lib/Boid.ts](app/src/features/boids/lib/Boid.ts) — Boid エージェントクラス
  - [lib/constants.ts](app/src/features/boids/lib/constants.ts) — シミュレーション定数
  - [lib/crt.ts](app/src/features/boids/lib/crt.ts) — CRT エフェクトユーティリティ
  - [lib/vec2.ts](app/src/features/boids/lib/vec2.ts) — 2D ベクトル演算

このプロジェクトは "boids"（群れシミュレーション）の実装を目的としています。

## コーディング規則

- **コードコメント**: 日本語で記述する
- **変数名・関数名**: 英語（プロジェクトの既存スタイルに従う）

## ワークフロー規則

- **コミット禁止**: ユーザーから明示的に指示されない限り、git commit を実行しないこと

## スキル（Claude Code カスタムコマンド）

プロジェクト固有のスキルは `~/.claude/` ではなく、このリポジトリ内の [.claude/skills/](.claude/skills/) ディレクトリに作成してください。これにより、スキルをバージョン管理に含められます。

各スキルは `.claude/skills/<スキル名>/SKILL.md` として配置します。
