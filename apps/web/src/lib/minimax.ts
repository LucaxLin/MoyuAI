const MINIMAX_API_URL = "https://api.minimax.chat/v1/image_generation";

export async function generateImage(params: {
  prompt: string;
  aspectRatio?: string;
  subjectReference?: Array<{
    type: string;
    image_file: string;
  }>;
}) {
  const response = await fetch(MINIMAX_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "image-01",
      prompt: params.prompt,
      prompt_optimizer:true,
      aspect_ratio: params.aspectRatio || "1:1",
      subject_reference: params.subjectReference,
      n: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`MiniMax API error: ${response.status}`);
  }

  return response.json();
}
