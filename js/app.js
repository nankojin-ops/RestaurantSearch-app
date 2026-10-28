/**
 * アプリケーション コントローラー & UI描画モジュール
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM要素の参照
  const searchBtn = document.getElementById('search-btn');
  const statusBar = document.getElementById('status-bar');
  const tableBody = document.getElementById('restaurant-table-body');
  const resultCount = document.getElementById('result-count');

  // モーダル関連要素
  const settingsModal = document.getElementById('settings-modal');
  const openSettingsBtn = document.getElementById('open-settings-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const clearKeyBtn = document.getElementById('clear-key-btn');
  const apiKeyInput = document.getElementById('api-key-input');

  /**
   * HTMLエスケープ処理 (XSS防止)
   */
  const escapeHtml = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  /**
   * Googleマップ検索URLを生成する
   * 店舗名と住所を安全に結合してエンコード
   */
  const createGoogleMapsUrl = (name, address) => {
    const query = encodeURIComponent(`${name || ''} ${address || ''}`.trim());
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  /**
   * ステータスメッセージの表示制御
   */
  const showStatus = (message, type = 'info') => {
    statusBar.classList.remove('hidden', 'bg-blue-50', 'text-blue-700', 'bg-red-50', 'text-red-700', 'bg-green-50', 'text-green-700');

    if (type === 'error') {
      statusBar.classList.add('bg-red-50', 'text-red-700', 'border', 'border-red-200');
    } else if (type === 'success') {
      statusBar.classList.add('bg-green-50', 'text-green-700', 'border', 'border-green-200');
    } else {
      statusBar.classList.add('bg-blue-50', 'text-blue-700', 'border', 'border-blue-200');
    }

    statusBar.innerHTML = message;
  };

  const hideStatus = () => {
    statusBar.classList.add('hidden');
  };

  /**
   * モーダルの開閉制御
   */
  const openModal = () => {
    apiKeyInput.value = StorageManager.getApiKey();
    settingsModal.classList.remove('hidden');
    apiKeyInput.focus();
  };

  const closeModal = () => {
    settingsModal.classList.add('hidden');
  };

  // モーダルイベントリスナー
  openSettingsBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      alert('APIキーを入力してください。');
      return;
    }
    StorageManager.setApiKey(key);
    closeModal();
    showStatus('APIキーをブラウザに保存しました。「現在地で検索する」を実行できます。', 'success');
  });

  clearKeyBtn.addEventListener('click', () => {
    if (confirm('保存されているAPIキーを削除しますか？')) {
      StorageManager.clearApiKey();
      apiKeyInput.value = '';
      closeModal();
      showStatus('APIキーを削除しました。', 'info');
    }
  });

  /**
   * レストラン一覧テーブルの描画
   */
  const renderTable = (shops, available, returned) => {
    if (!shops || shops.length === 0) {
      resultCount.textContent = '0件';
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="py-12 text-center text-slate-400">
            <i class="fa-solid fa-circle-exclamation text-3xl mb-2 block text-amber-400"></i>
            半径1km以内に飲食店が見つかりませんでした。
          </td>
        </tr>
      `;
      return;
    }

    if (available > returned) {
      resultCount.textContent = `${returned}件（全${available}件中）を表示中`;
    } else {
      resultCount.textContent = `${returned}件の店舗を表示中`;
    }

    const rowsHtml = shops.map((shop) => {
      const name = escapeHtml(shop.name || '名称不明');
      const genre = escapeHtml(shop.genre?.name || 'ジャンル情報なし');
      const address = escapeHtml(shop.address || '');
      const openHours = escapeHtml(shop.open || '営業時間情報なし');

      // 価格帯の処理（基準金額・目安）
      const budgetName = escapeHtml(shop.budget?.name || '目安なし');
      const budgetAverage = escapeHtml(shop.budget?.average || '平均情報なし');

      // Googleマップリンクの生成
      const gmapsUrl = createGoogleMapsUrl(shop.name, shop.address);

      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <!-- 店舗名 / ジャンル -->
          <td class="py-3 px-4 align-top">
            <div class="font-bold text-slate-800 text-sm">${name}</div>
            <div class="text-xs text-orange-600 font-medium mt-0.5">${genre}</div>
            <div class="text-xs text-slate-400 mt-1 flex items-start gap-1">
              <i class="fa-solid fa-location-dot mt-0.5 text-slate-400 flex-shrink-0"></i>
              <span>${address}</span>
            </div>
          </td>

          <!-- 営業時間 -->
          <td class="py-3 px-4 align-top text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            ${openHours}
          </td>

          <!-- 標準価格帯（目安金額） -->
          <td class="py-3 px-4 align-top">
            <div class="inline-block bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded font-semibold border border-emerald-200">
              <i class="fa-solid fa-coins mr-1"></i>${budgetName}
            </div>
            <div class="text-xs text-slate-500 mt-1.5">
              <span class="text-slate-400">平均:</span> ${budgetAverage}
            </div>
          </td>

          <!-- Googleマップリンク -->
          <td class="py-3 px-4 align-top text-center">
            <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" 
               class="inline-flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors whitespace-nowrap">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              <span>マップを開く</span>
            </a>
          </td>
        </tr>
      `;
    }).join('');

    tableBody.innerHTML = rowsHtml;
  };

  /**
   * 検索実行処理
   */
  searchBtn.addEventListener('click', async () => {
    // 1. APIキーチェック
    if (!StorageManager.hasApiKey()) {
      openModal();
      showStatus('検索を実行するには、まずホットペッパーAPIキーを設定してください。', 'info');
      return;
    }

    const apiKey = StorageManager.getApiKey();

    // 2. UIをローディング状態に変更
    searchBtn.disabled = true;
    searchBtn.classList.add('opacity-70', 'cursor-not-allowed');
    searchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i><span>検索中...</span>';
    showStatus('<i class="fa-solid fa-spinner fa-spin mr-2"></i>端末の現在地を取得しています...', 'info');

    try {
      // 3. 現在地取得
      const coords = await GeoManager.getCurrentLocation();
      showStatus(`<i class="fa-solid fa-spinner fa-spin mr-2"></i>現在地を取得しました (緯度: ${coords.lat.toFixed(4)}, 経度: ${coords.lng.toFixed(4)})。周辺1kmの店舗を検索中...`, 'info');

      // 4. APIリクエスト
      const result = await HotpepperApi.fetchNearbyRestaurants(apiKey, coords.lat, coords.lng);

      // 5. テーブル描画
      renderTable(result.shops, result.available, result.returned);

      const hitMessage = result.available > result.returned
        ? `検索完了: 半径1km以内に ${result.available} 件見つかりました（上位 ${result.returned} 件を表示中）。`
        : `検索完了: 半径1km以内に ${result.returned} 件の飲食店が見つかりました。`;

      showStatus(hitMessage, 'success');

    } catch (error) {
      console.error(error);
      showStatus(`<i class="fa-solid fa-triangle-exclamation mr-1"></i>${error.message}`, 'error');
    } finally {
      // ローディング解除
      searchBtn.disabled = false;
      searchBtn.classList.remove('opacity-70', 'cursor-not-allowed');
      searchBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs mr-1"></i><span>現在地で検索する</span>';
    }
  });

  // 初回起動時: APIキー未登録であればモーダルを案内
  if (!StorageManager.hasApiKey()) {
    setTimeout(() => {
      openModal();
    }, 500);
  }
});