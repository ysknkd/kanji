# 手書き漢字認識

ブラウザ上で動作する手書き漢字認識Webアプリケーション。TensorFlow.jsを使用してクライアントサイドでML推論を行うため、外部APIへの通信は不要です。

## 機能

- 手書き入力による漢字認識（2,199文字対応）
- 認識結果の読み方表示（音読み・訓読み）
- 漢字の保存・履歴管理
- Googleログイン認証（Firebase Authentication）
- クラウド同期（Cloud Firestore）
- ローカルストレージからクラウドへの自動マイグレーション
- モバイル最適化（タッチ操作、スクロールロック）
- ダークモード対応

## 技術スタック

- **フロントエンド**: Vanilla JavaScript + Vite
- **ML推論**: TensorFlow.js（ブラウザ内で動作）
- **モデル**: [ichisadashioko/kanji-recognition](https://github.com/ichisadashioko/kanji-recognition)（ETL文字データセットで学習済み）
- **認証**: Firebase Authentication（Google OAuth）
- **データベース**: Cloud Firestore
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
├── docs/
│   └── DESIGN_AUTH_STORAGE.md  # 認証・ストレージ設計ドキュメント
├── public/
│   └── model/          # TensorFlow.jsモデル（ビルド時にDL）
├── scripts/
│   ├── download-model.sh      # モデルダウンロードスクリプト
│   └── generate-readings.js   # 読みデータ生成スクリプト
└── src/
    ├── main.js         # メインロジック、UI制御
    ├── canvas.js       # 描画機能
    ├── config.js       # 環境設定、Firebase設定
    ├── recognizer.js   # ML認識機能
    ├── labels.js       # 文字ラベルデータ
    ├── readings.js     # 読みデータ（KANJIDIC2から生成）
    ├── style.css       # スタイル
    └── services/
        ├── auth.js     # 認証サービス
        ├── storage.js  # ストレージサービス
        └── providers/
            ├── firebase.js  # Firebase実装
            └── local.js     # ローカルストレージ実装
```

## ロードマップ

### 実装済み

- [x] 手書き漢字認識
- [x] 読み方表示
- [x] 漢字保存機能（localStorage）
- [x] モバイル最適化
- [x] Googleログイン認証（Firebase Authentication）
- [x] クラウドでの履歴同期（Cloud Firestore）
- [x] ローカル→クラウドの自動マイグレーション

### 予定

- [ ] 学習機能（間違えやすい漢字の復習）
- [ ] 漢字の詳細情報表示（部首、画数、例文など）
- [ ] PWA対応（オフライン利用）

## Firebase設定

自分の環境にデプロイする場合、以下の環境変数を設定してください：

| 変数名 | 説明 |
|--------|------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |

環境変数が未設定の場合、認証機能は無効になりローカルストレージのみで動作します。

## ライセンス

MIT License

### 使用データ・モデルのライセンス

- **漢字認識モデル**: [ichisadashioko/kanji-recognition](https://github.com/ichisadashioko/kanji-recognition) - MIT License
- **読みデータ**: [KANJIDIC2](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project) - CC BY-SA 4.0
