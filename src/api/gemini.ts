const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export type OcrItem = {
  category: string;
  amount: number;
  description: string;
  memo: string;
};

export async function extractFromReceipt(
  base64Image: string,
  mimeType: string,
  categories: string[]
): Promise<OcrItem[]> {
  if (!GEMINI_API_KEY) throw new Error('Gemini APIキーが設定されていません');

  const prompt = `このレシートや明細から支出データを抽出してください。
カテゴリは必ず以下のリストから最も適切なものを1つ選んでください: ${categories.join(', ')}
合計ではなく購入した内容をまとめて1〜数件で返してください。

以下のJSON配列形式のみで返してください（説明文・コードブロック不要）:
[{"category":"カテゴリ名","amount":金額,"description":"店名や品目","memo":""}]`;

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64Image } }
      ]}],
      generationConfig: { temperature: 0.1 }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? 'OCRに失敗しました');
  }

  const json = await res.json();
  const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('データの解析に失敗しました');

  const items = JSON.parse(match[0]) as OcrItem[];
  return items.filter(i => i.amount > 0 && i.description);
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
