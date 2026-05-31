export const downloadBlob = async (blob: Blob, name: string): Promise<void> => {
  const data = await blob.arrayBuffer();
  await window.gestivo.saveRecording(data, name);
};
