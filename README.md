# フランス語発音トレーナー

ブラウザに内蔵された Speech Synthesis（音声合成）を使って、フランス語の単語やフレーズの発音を手軽に練習できる小さな Web アプリです。単語クリック（単語モード）または範囲選択（範囲モード）で再生できます。PC/スマホ両対応。

このアプリは静的サイトとしてどこでもホスティング可能です（CDN 推奨）。以下に GitHub Pages での公開手順を記載します。

## 機能

- 単語モード: 単語をクリックすると即時再生
- 範囲モード: 2 点クリックまたはドラッグで選択 → 再生ボタンで再生（自動再生オプションあり）
- モバイル最適化: 画面上部固定のモードタブ、下部の再生ボタン、設定ドロワー
- 設定: 音声エンジン、速度、ピッチ、選択時の自動再生

## 動作要件

- Speech Synthesis API に対応したモダンブラウザ（Chrome/Edge/Firefox/Safari）
- HTTPS 配信を推奨（特に iOS での音声再生の安定のため）
- iOS/Safari: 初回は「ユーザー操作直後」でしか音が出ない場合があります。最初に任意のトークンをタップしてください。

## 開発

- 依存関係のインストール: `npm install`
- 開発サーバー起動: `npm run dev`
- 本番ビルド: `npm run build`（出力は `dist`）
- ビルドプレビュー: `npm run preview`

## GitHub Pages で公開

Project Pages（推奨）として `https://<user>.github.io/<repo>/` に公開できます。

1. ベースパスの設定

- 方法 A（設定ファイルで固定）: `vite.config.ts` に `base` を追加（`<repo>` は置き換え）

  ```ts
  // vite.config.ts
  export default defineConfig({
    // ...
    base: "/<repo>/",
  });
  ```

- 方法 B（ビルド時引数で指定）: 変更を加えず、ビルド時に `--base` を渡す

  ```bash
  vite build --base=/<repo>/
  # もしくは npm scripts 経由
  npm run build -- --base=/<repo>/
  ```

2. GitHub Actions（Pages）を追加

`.github/workflows/deploy.yml` を作成:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build -- --base=/${{ github.event.repository.name }}/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

3. Pages を有効化

- リポジトリ Settings → Pages → Build and deployment → GitHub Actions を選択

ワークフローが完了すると、`https://<user>.github.io/<repo>/` で公開されます。

補足

- ユーザー/組織サイト（`<user>.github.io` 直下）で公開する場合は `base` は不要です。
- 独自ドメインも Pages 設定から利用できます（HTTPS 推奨）。

## プライバシー

処理はすべてブラウザ内で完結します。アプリからサーバーへデータ送信は行いません。`localStorage` に最小限の設定と最後に入力したテキストのみ保存します。
