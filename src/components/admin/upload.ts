/**
 * 서명 업로드 URL 로 파일을 Supabase Storage 에 직접 PUT 한다 (진행률 콜백 지원).
 * fetch 는 업로드 진행률을 주지 않아 XMLHttpRequest 를 쓴다.
 */
export function putToSignedUrl(
  signedUrl: string,
  file: File,
  contentType: string,
  onProgress: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("content-type", contentType || file.type || "application/octet-stream");
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        let msg = `업로드 실패 (HTTP ${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body?.message) msg += `: ${body.message}`;
        } catch {}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("네트워크 오류로 업로드하지 못했습니다."));
    xhr.onabort = () => reject(new Error("업로드를 취소했습니다."));
    signal?.addEventListener("abort", () => xhr.abort());
    xhr.send(file);
  });
}
