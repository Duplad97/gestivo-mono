export const saveRecordingToDisk = async (blob: Blob, fileName: string): Promise<void> => {
  const data = await blob.arrayBuffer();
  await window.gestivo.saveRecording(data, fileName);
};
