
import { useState } from "react";
import {
  FileText,
  UploadCloud,
  Languages,
  Download,
  LoaderCircle,
  CheckCircle2,
  Trash2,
  BookOpen,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const API = import.meta.env.VITE_API_URL || "https://paper-backend-ak99.onrender.com/";

  const selectFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("PDFファイルを選択してください。");
      return;
    }

    setFile(selectedFile);
    setStatus("idle");
    setError("");
    setJobId(null);
  };

  const translate = async () => {
    if (!file) return;

    setStatus("uploading");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API}/api/translate`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "翻訳を開始できませんでした。");
      }

      setJobId(data.jobId);
      setStatus("processing");

      checkStatus(data.jobId);

    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const checkStatus = async (id) => {
    try {
      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const response = await fetch(`${API}/api/status/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "状態確認に失敗しました。");
        }

        if (data.status === "done") {
          setStatus("done");
          break;
        }

        if (data.status === "error") {
          throw new Error("翻訳に失敗しました。");
        }
      }
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const download = async () => {
    try {
      const response = await fetch(`${API}/api/download/${jobId}`);

      if (!response.ok) {
        throw new Error("ダウンロードに失敗しました。");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "translated_paper.pdf";
      link.click();

      URL.revokeObjectURL(url);

    } catch (err) {
      setError(err.message);
    }
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setJobId(null);
    setError("");
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <BookOpen size={21} />
          </div>
          <span>Paper<span className="brand-light">Translator</span></span>
        </div>

        <div className="header-right">
          <span className="status-dot"></span>
          Research Translation Tool
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <div className="eyebrow">
            <Sparkles size={14} />
            YOUR RESEARCH COMPANION
          </div>

          <h1>
            Read research.
            <br />
            <span>Without language barriers.</span>
          </h1>

          <p>
            Upload your scientific paper and translate it into Japanese
            while preserving the original PDF layout.
          </p>
        </section>

        <section className="translator-card">
          <div className="card-heading">
            <div>
              <h2>Document Translation</h2>
              <p>Upload your research paper to get started.</p>
            </div>
            <FileText size={25} className="heading-icon" />
          </div>

          <div className="language-row">
            <div className="language-box">
              <span>FROM</span>
              <strong>English</strong>
            </div>

            <ArrowRight size={19} className="language-arrow" />

            <div className="language-box">
              <span>TO</span>
              <strong>日本語</strong>
            </div>
          </div>

          {!file ? (
            <div
              className={`dropzone ${dragging ? "dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                selectFile(e.dataTransfer.files[0]);
              }}
            >
              <input
                type="file"
                accept=".pdf,application/pdf"
                id="fileInput"
                hidden
                onChange={(e) => selectFile(e.target.files[0])}
              />

              <div className="upload-icon">
                <UploadCloud size={29} />
              </div>

              <h3>Drop your PDF here</h3>
              <p>or browse files from your computer</p>

              <label htmlFor="fileInput" className="browse-button">
                Browse PDF
              </label>

              <div className="file-note">
                PDF format · Maximum 50 MB
              </div>
            </div>
          ) : (
            <div className="selected-file">
              <div className="file-icon">
                <FileText size={25} />
              </div>

              <div className="file-info">
                <strong>{file.name}</strong>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>

              {status === "idle" && (
                <button className="remove-button" onClick={reset}>
                  <Trash2 size={18} />
                </button>
              )}

              {status === "done" && (
                <CheckCircle2 className="success-icon" />
              )}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {status === "idle" && file && (
            <button className="translate-button" onClick={translate}>
              <Languages size={19} />
              Translate Document
            </button>
          )}

          {(status === "uploading" || status === "processing") && (
            <div className="processing-box">
              <LoaderCircle size={25} className="spinner" />
              <div>
                <strong>
                  {status === "uploading"
                    ? "Uploading document..."
                    : "Translating your paper..."}
                </strong>
                <p>Please keep this page open.</p>
              </div>
            </div>
          )}

          {status === "done" && (
            <button className="translate-button" onClick={download}>
              <Download size={19} />
              Download Translated PDF
            </button>
          )}

          {status === "done" && (
            <button className="reset-button" onClick={reset}>
              Translate another document
            </button>
          )}

          <div className="privacy-note">
            <span>🔒</span>
            Your documents are processed securely.
          </div>
        </section>

        <section className="features">
          <div className="feature">
            <FileText size={20} />
            <div>
              <strong>Original Layout</strong>
              <span>Preserve document formatting</span>
            </div>
          </div>

          <div className="feature">
            <Languages size={20} />
            <div>
              <strong>Academic Translation</strong>
              <span>English to Japanese</span>
            </div>
          </div>

          <div className="feature">
            <Download size={20} />
            <div>
              <strong>PDF Export</strong>
              <span>Download your translated paper</span>
            </div>
          </div>
        </section>

        <footer>
          PAPER TRANSLATOR · MADE FOR RESEARCHERS
        </footer>
      </main>
    </div>
  );
}

export default App;
