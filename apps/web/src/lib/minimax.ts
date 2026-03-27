const MINIMAX_API_URL = "https://api.minimax.chat/v1/image_generation";

export async function generateImage(params: {
  model: "image-01";
  prompt: string;
  imageUrl?: string;
  maskImageUrl?: string;
  maskPrompt?: string;
  maskRegions?: Array<{ x: number; y: number; width: number; height: number }>;
  width?: number;
  height?: number;
}) {
  const response = await fetch(MINIMAX_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      prompt: params.prompt,
      image_url: params.imageUrl,
      mask_image_url: params.maskImageUrl,
      mask_prompt: params.maskPrompt,
      mask_regions: params.maskRegions,
      width: params.width || 1024,
      height: params.height || 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`MiniMax API error: ${response.status}`);
  }

  return response.json();
}
