# 手書き漢字認識

ブラウザ上で動作する手書き漢字認識Webアプリケーション。TensorFlow.jsを使用してクライアントサイドでML推論を行うため、外部APIへの通信は不要です。

## 機能

- 手書き入力による漢字認識（2,199文字対応）
- 認識結果の読み方表示（音読み・訓読み）
- 漢字の保存・履歴管理
- モバイル最適化（タッチ操作、スクロールロック）
- ダークモード対応

## 技術スタック

- **フロントエンド**: Vanilla JavaScript + Vite
- **ML推論**: TensorFlow.js（ブラウザ内で動作）
- **モデル**: [ichisadashioko/kanji-recognition](https://github.com/ichisadashioko/kanji-recognition)（ETL文字データセットで学習済み）
- **読みデータ**: KANJIDIC2（CC BY-SA 4.0）
- **ホスティング**: Cloudflare Pages

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド（モデルの自動ダウンロード含む）
npm run build
```

## ディレクトリ構成

```
kanji/
├── index.html          # メインHTML
├── package.json
├── public/
│   └── model/          # TensorFlow.jsモデル（ビルド時にDL）
├── scripts/
│   ├── download-model.sh      # モデルダウンロードスクリプト
│   └── generate-readings.js   # 読みデータ生成スクリプト
└── src/
    ├── main.js         # メインロジック、UI制御
    ├── canvas.js       # 描画機能
    ├── recognizer.js   # ML認識機能
    ├── history.js      # 履歴管理（localStorage）
    ├── labels.js       # 文字ラベルデータ
    ├── readings.js     # 読みデータ（KANJIDIC2から生成）
    └── style.css       # スタイル
```

## ロードマップ

### 実装済み

- [x] 手書き漢字認識
- [x] 読み方表示
- [x] 漢字保存機能（localStorage）
- [x] モバイル最適化

### 予定

- [ ] Googleログイン認証（Firebase Authentication）
- [ ] クラウドでの履歴同期（Cloud Firestore）
- [ ] 学習機能（間違えやすい漢字の復習）
- [ ] 漢字の詳細情報表示（部首、画数、例文など）
- [ ] PWA対応（オフライン利用）

## ライセンス

MIT License

### 使用データ・モデルのライセンス

- **漢字認識モデル**: [ichisadashioko/kanji-recognition](https://github.com/ichisadashioko/kanji-recognition) - MIT License
- **読みデータ**: [KANJIDIC2](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project) - CC BY-SA 4.0
