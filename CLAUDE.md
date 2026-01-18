# CLAUDE.md

このファイルはClaude Codeがプロジェクトを理解するためのコンテキストを提供します。

## プロジェクト概要

手書き漢字認識Webアプリ。TensorFlow.jsでブラウザ内ML推論を行い、外部API不要で動作する。

## 開発ワークフロー

- **ブランチ戦略**: feature branch → PR → merge to main
- **デプロイ**: Cloudflare Pages（mainへのpushで自動デプロイ）
- **プレビュー**: PRごとにプレビューURLが自動生成される

## よく使うコマンド

```bash
# 開発サーバー
npm run dev

# ビルド（モデルDL + Viteビルド）
npm run build

# モデルのみダウンロード
npm run download-model

# 読みデータ再生成
node scripts/generate-readings.js
```

## 主要ファイル

| ファイル | 役割 |
|----------|------|
| `src/main.js` | アプリのエントリーポイント、UI制御 |
| `src/canvas.js` | タッチ対応のCanvas描画、スクロールロック |
| `src/recognizer.js` | TensorFlow.jsモデルのロードと推論 |
| `src/history.js` | localStorageを使った履歴管理 |
| `src/labels.js` | 漢字⇔インデックスのマッピング（2,199文字） |
| `src/readings.js` | 漢字の読みデータ（KANJIDIC2から生成） |

## 外部依存

### モデル（ビルド時にダウンロード）

- **ソース**: `ichisadashioko/kanji-recognition` gh-pagesブランチ
- **入力**: 64x64 グレースケール画像
- **出力**: 2,199クラスのsoftmax確率

### 読みデータ（リポジトリに含む）

- **ソース**: KANJIDIC2 (XML)
- **生成**: `scripts/generate-readings.js`
- **ライセンス**: CC BY-SA 4.0

## 設計方針

- **費用最小化**: 無料サービス・OSSを優先
- **オフライン動作**: 外部API呼び出しなし
- **モバイルファースト**: タッチ操作を最適化
- **段階的拡張**: localStorage → Firebase への移行を想定

## 今後の拡張予定

1. **Firebase統合**: Google認証 + Firestoreでクロスデバイス同期
2. **PWA化**: Service Workerでオフライン対応
3. **学習機能**: 保存した漢字のクイズ形式復習
