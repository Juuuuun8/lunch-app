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
const retryButton = document.getElementById('retryButton');

// イベントリスナー: ボタンがクリックされた時の処理
decideButton.addEventListener('click', () => {
    // ユーザーの位置情報を取得
    if (navigator.geolocation) {
        // ボタンを無効化し、ローディングを表示
        decideButton.disabled = true;
        resultElement.classList.add('hidden');
        loadingElement.classList.remove('hidden');
        retryButton.classList.add('hidden');

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
                displayError("位置情報の取得に失敗しました。GPSをオンにして再度お試しください。", false);
            }
        );
    } else {
        // ブラウザが位置情報APIをサポートしていない場合の処理
        displayError("お使いのブラウザは位置情報サービスをサポートしていません。", false);
    }
});

// 再検索ボタンのイベントリスナーを追加
retryButton.addEventListener('click', () => {
    decideButton.disabled = true;
    resultElement.classList.add('hidden');
    loadingElement.classList.remove('hidden');
    retryButton.classList.add('hidden');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            // ジャンルを空にして「おまかせ」で再検索
            fetchLunchSpot(lat, lon, "");
        },
        (error) => {
            console.error("位置情報の取得に失敗しました:", error);
            displayError("位置情報の取得に失敗しました。GPSをオンにして再度お試しください。", false);
        }
    );
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

        const data = await response.json();

        if (!response.ok) {
            displayError(data.message || 'サーバーからの応答に失敗しました。', genre !== "");
            return;
        }

        if (data.name) {
            shopNameElement.textContent = data.name;
            shopImageElement.src = data.photoUrl || 'placeholder.jpg';
            shopImageElement.alt = data.name + 'の写真';
            mapLinkElement.href = `https://www.google.com/maps/search/?api=1&query=${data.name}&query_place_id=${data.place_id}`;
            
            shopRatingElement.textContent = `評価: ${data.rating ? data.rating + ' / 5' : '評価なし'}`;
            shopAddressElement.textContent = `住所: ${data.address}`;
            
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
            displayError(data.message || 'お近くにランチスポットが見つかりませんでした。', genre !== "");
        }
    } catch (error) {
        console.error("ランチスポットの取得中にエラーが発生しました:", error);
        displayError("ランチスポットの取得中にエラーが発生しました。", genre !== "");
    } finally {
        loadingElement.classList.add('hidden');
        decideButton.disabled = false;
    }
}

// エラーメッセージを表示する関数
function displayError(message, showRetryButton = false) {
    shopNameElement.textContent = message;
    shopImageElement.src = 'error.jpg';
    shopImageElement.alt = 'エラー';
    
    shopRatingElement.textContent = '';
    shopAddressElement.textContent = '';
    shopOpeningHoursElement.innerHTML = '';
    mapLinkElement.href = '#';

    resultElement.classList.remove('hidden');

    if (showRetryButton) {
        retryButton.classList.remove('hidden');
    } else {
        retryButton.classList.add('hidden');
    }
    console.error(message);
}