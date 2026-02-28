const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const status = document.getElementById('status');
const downloadBtn = document.getElementById('downloadBtn');

dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleFile(e.target.files[0]);

// ドラッグ&ドロップ処理
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = "#58a6ff"; };
dropZone.ondragleave = () => { dropZone.style.borderColor = "#30363d"; };
dropZone.ondrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
};

async function handleFile(file) {
    if (!file || !file.name.endsWith('.zip')) {
        status.innerText = "エラー: ZIPファイルを選択してください";
        return;
    }

    status.innerText = "バイナリ構築中...";
    downloadBtn.style.display = "none";

    try {
        const zipArrayBuffer = await file.arrayBuffer();
        const zipData = new Uint8Array(zipArrayBuffer);

        // 1. 本物のEXEとして認識させるための最小限のPEヘッダー (64バイト)
        // マジックナンバー "MZ" (0x4D, 0x5A) から開始
        const mzStub = new Uint8Array([
            0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00,
            0xB8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00
        ]);

        // 2. 結合処理: [MZ Stub] + [ZIP Data]
        // これにより、ファイル先頭は MZ になり、中身は有効なZIPになります
        const finalBinary = new Uint8Array(mzStub.length + zipData.length);
        finalBinary.set(mzStub);
        finalBinary.set(zipData, mzStub.length);

        // Blobの作成
        const blob = new Blob([finalBinary], { type: 'application/vnd.microsoft.portable-executable' });
        const url = URL.createObjectURL(blob);

        // ダウンロードボタンの有効化
        downloadBtn.href = url;
        downloadBtn.download = file.name.replace('.zip', '.exe');
        downloadBtn.style.display = "inline-block";
        status.innerText = "変換完了！";

    } catch (err) {
        console.error(err);
        status.innerText = "エラーが発生しました。";
    }
}
