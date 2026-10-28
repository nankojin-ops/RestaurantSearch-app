/**
 * Geolocation API 位置情報取得モジュール
 */
const GeoManager = (() => {
  /**
   * 現在位置（緯度・経度）を取得する
   * @returns {Promise<{lat: number, lng: number}>}
   */
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('お使いのブラウザは位置情報サービス（Geolocation API）に対応していません。'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          let errorMsg = '位置情報の取得に失敗しました。';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = '位置情報の利用が許可されていません。ブラウザ設定で位置情報を許可してください。';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = '端末の位置情報を特定できませんでした。電波環境の良い場所で再度お試しください。';
              break;
            case error.TIMEOUT:
              errorMsg = '位置情報の取得がタイムアウトしました。再度実行してください。';
              break;
          }
          reject(new Error(errorMsg));
        },
        options
      );
    });
  };

  return {
    getCurrentLocation
  };
})();