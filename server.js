// パッケージの読み込み
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// 環境変数の読み込み
dotenv.config();

const app = express();
const port = 3000;

// JSONリクエストのボディを解析できるようにする
app.use(express.json());

// フロントエンドのファイルを公開する
app.use(express.static(path.join(__dirname, '')));

// APIエンドポイントの定義
app.post('/api/get-lunch-spot', async (req, res) => {
    const { lat, lon, genre } = req.body;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const radius = 500;
    const type = 'restaurant';
    const keyword = genre ? genre : 'restaurant';

    // Google Maps APIリクエストURL (Nearby Search)
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=${type}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // ランダムに1店舗を選択
            const randomIndex = Math.floor(Math.random() * data.results.length);
            const selectedShop = data.results[randomIndex];

            const placeId = selectedShop.place_id;

            // Place Details APIにリクエストを送信し、詳細情報を取得
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,photos,rating,opening_hours,website,vicinity&key=${apiKey}`;
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();
            
            if (detailsData.result) {
                const detailedShop = detailsData.result;

                const shopName = detailedShop.name;
                const shopLocation = detailedShop.geometry.location;
                let photoUrl = null;

                if (detailedShop.photos && detailedShop.photos.length > 0) {
                    const photoReference = detailedShop.photos[0].photo_reference;
                    const maxWidth = 400;
                    photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
                }

                res.json({
                    name: shopName,
                    lat: shopLocation.lat,
                    lon: shopLocation.lng,
                    photoUrl: photoUrl,
                    rating: detailedShop.rating || null,
                    address: detailedShop.formatted_address || detailedShop.vicinity,
                    openingHours: detailedShop.opening_hours ? detailedShop.opening_hours.weekday_text : null
                });
            } else {
                res.status(404).json({ message: 'お店の詳細情報が見つかりませんでした。' });
            }
        } else {
            res.status(404).json({ message: 'お近くにランチスポットが見つかりませんでした。' });
        }
    } catch (error) {
        console.error('API呼び出し中にエラー:', error);
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
});

// サーバーの起動
app.listen(port, () => {
    console.log(`サクメシ サーバーが http://localhost:${port} で起動しました。`);
});