export function imagePayload(dataUrl: string) {
  const match =
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) throw new Error("외부 URL 또는 지원하지 않는 사진 형식입니다");
  let bytes: string;
  try {
    bytes = atob(match[2]);
  } catch {
    throw new Error("손상된 사진 데이터입니다");
  }
  if (bytes.length < 12 || bytes.length > 10 * 1024 * 1024)
    throw new Error("사진은 정상적인 10MB 이하 이미지여야 합니다");
  const type = match[1];
  const valid =
    type === "png"
      ? bytes.startsWith("\x89PNG\r\n\x1a\n") && bytes.includes("IEND")
      : type === "jpeg"
        ? bytes.startsWith("\xff\xd8") && bytes.endsWith("\xff\xd9")
        : bytes.startsWith("RIFF") && bytes.slice(8, 12) === "WEBP";
  if (!valid) throw new Error("사진 형식과 실제 데이터가 다릅니다");
  return dataUrl;
}
export async function decodePhoto(dataUrl: string) {
  imagePayload(dataUrl);
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      img.naturalWidth > 0 && img.naturalHeight > 0
        ? resolve()
        : reject(new Error("빈 이미지입니다"));
    img.onerror = () => reject(new Error("사진을 해독할 수 없습니다"));
    img.src = dataUrl;
  });
}
