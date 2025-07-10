# Valorant 個人用 AI コーチ

これは、あなたの Valorant のプレイを分析し、改善のためのアドバイスを提供する個人用 AI コーチです。

## 概要

[HenrikDev API](https://docs.henrikdev.xyz/) を利用して、Valorant の様々なゲームデータを取得し、コーチングに役立てます。

主な機能:
- アカウント情報、MMR、マッチ履歴の取得
- リーダーボード、プレミアモード関連情報の取得
- ストア情報、eスポーツスケジュール、キュー状況の確認
- クロスヘア画像の生成

## セットアップ

1.  **リポジトリをクローン:**
    `git clone https://github.com/your-username/valorant-coachi.git`
    `cd valorant-coachi`

2.  **依存関係をインストール:**
    `npm install`

3.  **環境変数を設定:**
    プロジェクトのルートディレクトリに `.env` ファイルを作成し、以下の環境変数を設定してください。

    ```
    VALORANT_API_KEY=YOUR_HENRIKDEV_API_KEY
    GOOGLE_GENERATIVE_AI_API_KEY=YOUR_GOOGLE_GENERATIVE_AI_API_KEY
    ```

    - `VALORANT_API_KEY`: [HenrikDev API](https://docs.henrikdev.xyz/) から取得した API キーを設定します。
    - `GOOGLE_GENERATIVE_AI_API_KEY`: Google Generative AI API のキーを設定します。

## 使い方

このプロジェクトは Mastra エージェントとして動作します。Mastra を通じて対話的に利用できます。

## ライセンス

MIT License