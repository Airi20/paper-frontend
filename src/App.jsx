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
  ShieldCheck,
  LockKeyhole,
  LogOut,
} from "lucide-react";
import "./App.css";

function App() {
  // ログイン情報
  const [token, setToken] = useState(
    () => localStorage.getItem("paper_token") || ""
  );
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // 翻訳情報
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const API = (
    import.meta.env.VITE_API_URL ||
    "https://paper-backend-ak99.onrender.com"
  ).replace(/\/+$/, "");

  // ログイン処理
  const login = async () => {
    if (!password) return;

    setLoggingIn(true);
    setLoginError("");

    try {
      const response = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ログインに失敗しました");
      }

      localStorage.setItem("paper_token", data.token);
      setToken(data.token);
      setPassword("");

    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  // ログアウト処理
  const logout = () => {
    localStorage.removeItem("paper_token");
    setToken("");
    reset();
  };

  // 認証付き通信
  const authFetch = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem("paper_token");
      setToken("");
      setError("ログインの有効期限が切れました。再ログインしてください。");
      throw new Error("ログインの有効期限が切れました。");
    }

    return response;
  };

  // ファイル選択
  const selectFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("PDFファイルを選択してください。");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("ファイルサイズは50MB以下にしてください。");
      return;
    }

    setFile(selectedFile);
    setStatus("idle");
    setError("");
    setJobId(null);
  };

  // 翻訳開始
  const translate = async () => {
    if (!file) return;

    setStatus("uploading");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch(`${API}/api/translate`, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `サーバーからJSON以外の応答が返りました。HTTP ${response.status}: ${text.slice(0, 200)}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "翻訳を開始できませんでした。"
        );
      }

      setJobId(data.jobId);
      setStatus("processing");

      await checkStatus(data.jobId);

    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  // 翻訳状況確認
  const checkStatus = async (id) => {
    try {
      while (true) {
        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );

        const response = await authFetch(
          `${API}/api/status/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "状態確認に失敗しました。"
          );
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

  // PDFダウンロード
  const download = async () => {
    try {
      const response = await authFetch(
        `${API}/api/download/${jobId}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || "ダウンロードに失敗しました。"
        );
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

  // リセット
  const reset = () => {
    setFile(null);
    setStatus("idle");
    setJobId(null);
    setError("");
  };

  // ==================================
  // ログイン画面
  // ==================================

  if (!token) {
    return (
      <div className="app">
        <header className="header">
          <div className="brand">
            <div className="brand-icon">
              <BookOpen size={21} />
            </div>
            <span>
              Paper<span className="brand-light">Translator</span>
            </span>
          </div>

          <div className="header-right">
            <LockKeyhole size={16} />
            Private Access
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
              Your personal research translation tool.
              <br />
              Please enter the access password.
            </p>
          </section>

          <section className="translator-card">
            <div className="card-heading">
              <div>
                <h2>Welcome Back</h2>
                <p>Enter your password to continue.</p>
              </div>

              <ShieldCheck
                size={27}
                className="heading-icon"
              />
            </div>

            <div style={{ marginTop: "25px" }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") login();
                }}
                placeholder="Enter password"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "16px",
                  border: "1px solid #dce1e8",
                  borderRadius: "10px",
                  fontSize: "16px",
                  outline: "none",
                }}
              />

              {loginError && (
                <div className="error-message">
                  {loginError}
                </div>
              )}

              <button
                className="translate-button"
                onClick={login}
                disabled={loggingIn || !password}
                style={{
                  marginTop: "18px",
                  opacity: loggingIn || !password ? 0.6 : 1,
                }}
              >
                <LockKeyhole size={18} />
                {loggingIn ? "Logging in..." : "Login"}
              </button>
            </div>

            <div className="privacy-note">
              <span>🔒</span>
              Authorized users only.
            </div>
          </section>
        </main>

        <footer
          style={{
            textAlign: "center",
            padding: "30px",
            fontSize: "12px",
            opacity: 0.6,
          }}
        >
          PAPER TRANSLATOR · MADE FOR RESEARCHERS
        </footer>
      </div>
    );
  }

  // ==================================
  // 翻訳画面
  // ==================================

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <BookOpen size={21} />
          </div>

          <span>
            Paper<span className="brand-light">Translator</span>
          </span>
        </div>

        <div className="header-right">
          <span className="status-dot"></span>
          Research Translation Tool

          <button
            onClick={logout}
            title="Logout"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginLeft: "15px",
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid #dce1e8",
              background: "white",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
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

            <ArrowRight
              size={19}
              className="language-arrow"
            />

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
                onChange={(e) =>
                  selectFile(e.target.files[0])
                }
              />

              <div className="upload-icon">
                <UploadCloud size={29} />
              </div>

              <h3>Drop your PDF here</h3>
              <p>or browse files from your computer</p>

              <label
                htmlFor="fileInput"
                className="browse-button"
              >
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
                <span>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              {status === "idle" && (
                <button
                  className="remove-button"
                  onClick={reset}
                >
                  <Trash2 size={18} />
                </button>
              )}

              {status === "done" && (
                <CheckCircle2 className="success-icon" />
              )}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {status === "idle" && file && (
            <button
              className="translate-button"
              onClick={translate}
            >
              <Languages size={19} />
              Translate Document
            </button>
          )}

          {(status === "uploading" ||
            status === "processing") && (
            <div className="processing-box">
              <LoaderCircle
                size={25}
                className="spinner"
              />

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
            <button
              className="translate-button"
              onClick={download}
            >
              <Download size={19} />
              Download Translated PDF
            </button>
          )}

          {status === "done" && (
            <button
              className="reset-button"
              onClick={reset}
            >
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

          <details className="legal-section">
            <summary>
              <ShieldCheck size={15} />
              利用規約・プライバシーポリシー
            </summary>

            <div className="legal-content">
              <h3>利用規約</h3>

              <p>
                本サービスは、研究論文などのPDF文書を日本語に翻訳することを目的としたWebサービスです。
                利用者は、本規約に同意したうえで本サービスを利用するものとします。
              </p>

              <h4>1. 禁止事項</h4>

              <p>以下の行為を禁止します。</p>

              <ul>
                <li>第三者の著作権その他の権利を侵害する目的での利用</li>
                <li>第三者の許可なく、翻訳した文書を無断で再配布・公開する行為</li>
                <li>不正アクセスやサーバーへの過度な負荷を与える行為</li>
                <li>法令または公序良俗に反する行為</li>
              </ul>

              <h4>2. 著作権について</h4>

              <p>
                アップロードされたPDF文書の著作権は、原則として各権利者に帰属します。
                利用者は、アップロードする文書について適法に利用する権限を有していることを確認するものとします。
                本サービスは、著作権を侵害する目的での利用を認めるものではありません。
              </p>

              <h4>3. 外部サービスについて</h4>

              <p>
                本サービスでは翻訳処理のためにDeepL APIを利用しています。
                アップロードされた文書のデータは翻訳処理のために外部サービスへ送信されます。
                外部サービスの利用規約およびプライバシーポリシーもご確認ください。
              </p>

              <h4>4. 個人情報・機密情報について</h4>

              <p>
                個人情報、研究機関の機密情報、未公開の研究資料など、
                第三者への送信について許可を得ていない情報のアップロードはお控えください。
              </p>

              <h4>5. データの取り扱い</h4>

              <p>
                アップロードされたファイルは翻訳処理のためにサーバー上で一時的に取り扱われます。
                データの保存および削除については、本サービスの実際の処理仕様に従います。
              </p>

              <h4>6. 免責事項</h4>

              <p>
                本サービスは翻訳結果の正確性、完全性および有用性を保証するものではありません。
                専門的な研究、論文執筆、学術的な判断などに翻訳結果を使用する場合は、
                必ず原文と照合してください。
              </p>

              <p>
                本サービスの利用によって生じた損害について、
                運営者は法令上認められる範囲で責任を負わないものとします。
              </p>

              <h4>7. サービスの変更・停止</h4>

              <p>
                本サービスは、予告なく内容の変更、停止または終了を行う場合があります。
              </p>

              <h4>8. 規約の変更</h4>

              <p>
                本規約は必要に応じて変更される場合があります。
                変更後の規約は、本サービス上に掲載した時点から適用されます。
              </p>

              <h3>プライバシーについて</h3>

              <p>
                本サービスでは、翻訳処理に必要な範囲で利用者が選択したPDFファイルを取り扱います。
              </p>

              <ul>
                <li>翻訳処理にはDeepL APIを使用します。</li>
                <li>PDFファイルは翻訳処理のために外部サービスへ送信されます。</li>
                <li>アップロードされたファイルはサーバー上で処理されます。</li>
                <li>個人情報や機密情報を含むファイルのアップロードは推奨しません。</li>
              </ul>

              <p>
                本サービスに関するお問い合わせは、運営者までご連絡ください。
              </p>

              <p className="legal-last">
                PAPER TRANSLATOR
              </p>
            </div>
          </details>
        </footer>
      </main>
    </div>
  );
}

export default App;
