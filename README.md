# VALUE CAPITAL

`value-capital.jp` 向けの静的Webサイトです。GitHub Pagesを前提とし、サイト本体はGitHub、案件・フォームデータはGoogleスプレッドシート、機密資料はGoogle Driveで分離管理します。

## ページ
- `/` トップ（LP型）
- `/deals/` 売却案件一覧（ノンネーム情報）
- `/valuation/` 査定依頼
- `/buyer/` 買手登録
- `/company/` 会社概要
- `/privacy/` プライバシーポリシー
- `/terms/` 利用・免責事項

個別案件詳細ページは作成しません。案件CTAは `/buyer/?deal=案件ID` へ遷移し、案件IDを自動入力します。

## データ管理
- `案件管理`：内部マスター。正式会社名、正式所在地、担当者、内部メモ、DriveフォルダURL等を保持可能。
- `公開用案件データ`：Web APIへ返してよい公開項目のみ。
- `査定依頼`：売主・相談者フォームの保存先。
- `買手登録`：買手情報と対象案件IDの保存先。

公開Webは `公開用案件データ` のみ読み取ります。内部案件マスターをブラウザへ返さないでください。

## Google Apps Script
`gas/Code.gs` をApps Scriptへ配置します。

Script Properties:
- `SPREADSHEET_ID`：VALUE CAPITAL案件管理スプレッドシートID
- `TURNSTILE_SECRET`：Cloudflare Turnstile利用時のみ

Webアプリとしてデプロイ後、`assets/js/config.js` の `GAS_ENDPOINT` にURLを設定します。GAS稼働確認後は `USE_SEED_DATA:false` にします。

## Cloudflare Turnstile
Cloudflareでサイトキーとシークレットを作成し、
- `assets/js/config.js` → `TURNSTILE_SITE_KEY`
- Apps Script Properties → `TURNSTILE_SECRET`
へ設定します。

## GA4
VALUE CAPITAL専用GA4プロパティ作成後、`assets/js/config.js` の `GA_MEASUREMENT_ID` を設定します。イベントは査定CTA、案件一覧、案件詳細希望、査定送信、買手登録、電話、メールを計測する設計です。

## 公開前
現在は全HTMLが `noindex,nofollow`、`robots.txt` が全クロール拒否です。本番情報・フォーム・DNS確認が完了するまで解除しません。

正式公開時に以下を実施します。
1. `robots.txt` を通常運用へ変更
2. 必要ページの `noindex,nofollow` を削除
3. `sitemap.xml` を最終確認
4. GitHub Pagesへ `value-capital.jp` を設定
5. `www.value-capital.jp` を正規URLへ統一
6. Search Consoleのドメインプロパティを設定

## 現在の仮情報
- 電話番号 `093-472-2701` は仮番号扱い。公開前に確認してください。
- `assets/img/*.svg` は外部ホットリンクを避けるためのローカル建築ビジュアルです。本番写真へ差し替える場合は `assets/img/` にWebPで保存してください。
- `data/public-deals.seed.json` はGAS接続前のプレビュー用です。案件運用の正本にはしません。
