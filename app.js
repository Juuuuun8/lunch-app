// HTML要素の取得
const decideButton = document.getElementById('decideButton');
const loadingElement = document.getElementById('loading');
const resultElement = document.getElementById('result');
const shopNameElement = document.getElementById('shopName');
const shopRatingElement = document.getElementById('shopRating');
const shopAddressElement = document.getElementById('shopAddress');
const shopOpeningHoursElement = document.getElementById('shopOpeningHours');
const shopImageElement = document.getElementById('shopImage');
const mapLinkElement = document.getElementById('mapLink');
const genreSelect = document.getElementById('genre');

// イベントリスナー: ボタンがクリックされた時の処理
decideButton.addEventListener('click', () => {
    // ユーザーの位置情報を取得
    if (navigator.geolocation) {
        // ボタンを無効化し、ローディングを表示
        decideButton.disabled = true;
        resultElement.classList.add('hidden');
        loadingElement.classList.remove('hidden');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // 位置情報取得成功時の処理
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const genre = genreSelect.value;
                fetchLunchSpot(lat, lon, genre);
            },
            (error) => {
                // 位置情報取得失敗時の処理
                console.error("位置情報の取得に失敗しました:", error);
                displayError("位置情報の取得に失敗しました。GPSをオンにして再度お試しください。");
            }
        );
    } else {
        // ブラウザが位置情報APIをサポートしていない場合の処理
        displayError("お使いのブラウザは位置情報サービスをサポートしていません。");
    }
});

// バックエンドAPIを呼び出す関数
async function fetchLunchSpot(lat, lon, genre) {
    try {
        const response = await fetch('/api/get-lunch-spot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lat, lon, genre }),
        });

        if (!response.ok) {
            throw new Error('サーバーからの応答に失敗しました。');
        }

        const data = await response.json();

        if (data.name) {
            // 店舗情報表示
            shopNameElement.textContent = data.name;
            shopImageElement.src = data.photoUrl || 'placeholder.jpg';
            shopImageElement.alt = data.name + 'の写真';
            // 修正箇所: Google マップのリンクを修正
            mapLinkElement.href = `https://www.google.com/maps/search/?api=1&query=${data.name}&query_place_id=${data.place_id}`;
            
            // 詳細情報を表示
            shopRatingElement.textContent = `評価: ${data.rating ? data.rating + ' / 5' : '評価なし'}`;
            shopAddressElement.textContent = `住所: ${data.address}`;
            
            // 営業時間・定休日情報を表示
            shopOpeningHoursElement.innerHTML = '';
            if (data.openingHours) {
                data.openingHours.forEach(day => {
                    const p = document.createElement('p');
                    p.textContent = day;
                    shopOpeningHoursElement.appendChild(p);
                });
            } else {
                shopOpeningHoursElement.textContent = '営業時間情報がありません。';
            }

            resultElement.classList.remove('hidden');
        } else {
            displayError('お近くにランチスポットが見つかりませんでした。');
        }
    } catch (error) {
        console.error("ランチスポットの取得中にエラーが発生しました:", error);
        displayError("ランチスポットの取得中にエラーが発生しました。");
    } finally {
        // ローディングを非表示にし、ボタンを有効化
        loadingElement.classList.add('hidden');
        decideButton.disabled = false;
    }
}

// エラーメッセージを表示する関数
function displayError(message) {
    shopNameElement.textContent = 'エラー';
    shopImageElement.src = 'error.jpg';
    shopImageElement.alt = 'エラー';
    
    // 詳細情報を非表示にするか、エラー用に書き換える
    shopRatingElement.textContent = '';
    shopAddressElement.textContent = '';
    shopOpeningHoursElement.innerHTML = '';
    mapLinkElement.href = '#';

    resultElement.classList.remove('hidden');
    console.error(message);
}